/**
 * BURRA PARIKSHA CMS - Base Repository
 * Phase 2: Google Sheets Database Architecture & Persistence
 * 
 * Provides unified, header-mapped CRUD operations against Google Sheets tabs.
 * Integrates schema validation, header caching, and fallback local store.
 */

import { SheetSchemaContract, SheetTabName } from '../schemas/google-sheets-schema';
import { googleSheetsClient, GoogleSheetsClient } from '../google-sheets/client';
import { colIndexToA1Letter, objectToRow, rowToObject, validateWorksheetHeaders } from '../google-sheets/helpers';
import { MissingHeaderError, WorksheetNotFoundError } from '../google-sheets/errors';
import {
  deletionSafetyService,
  DeletionReadBackError,
  DeletionIntegrityError,
  DirectDeleteBypassError,
  VerifiedDeletionToken,
} from '../services/deletion-safety.service';

export abstract class BaseRepository<T extends Record<string, any>> {
  protected schema: SheetSchemaContract;
  protected client: GoogleSheetsClient;
  protected cachedHeaders: string[] | null = null;
  protected lastHeaderFetchTime: number = 0;
  protected HEADER_CACHE_TTL_MS = 60000; // 1 minute header cache
  protected worksheetChecked: boolean = false;

  // Local fallback storage for development when Google credentials are not provided
  protected static fallbackStore: Map<string, Map<string, Record<string, any>>> = new Map();

  constructor(schema: SheetSchemaContract) {
    this.schema = schema;
    this.client = googleSheetsClient;

    if (!BaseRepository.fallbackStore.has(this.schema.sheetName)) {
      BaseRepository.fallbackStore.set(this.schema.sheetName, new Map());
    }
  }

  public getSheetName(): SheetTabName {
    return this.schema.sheetName;
  }

  public getSchema(): SheetSchemaContract {
    return this.schema;
  }

  protected getPrimaryKeyProperty(): string {
    const pkCol = this.schema.columns.find(
      (c) => c.isPrimaryKey || c.name === this.schema.primaryKey || c.propertyKey === this.schema.primaryKey
    );
    return pkCol ? pkCol.propertyKey : this.schema.primaryKey;
  }

  /**
   * Hook for subclasses to specify a custom target spreadsheet ID (e.g. ANALYTICS_SPREADSHEET_ID).
   * Defaults to undefined, which resolves to the main GOOGLE_SHEETS_ID.
   */
  protected getTargetSpreadsheetId(): string | undefined {
    return undefined;
  }

  /**
   * Calculates the canonical A1 column letter corresponding to the declared schema width.
   * e.g. 7 columns -> 'G', 10 columns -> 'J', 35 columns -> 'AI'.
   */
  protected getEndColLetter(): string {
    const numCols = this.schema.columns?.length || 0;
    return numCols > 0 ? colIndexToA1Letter(numCols - 1) : 'ZZ';
  }

  /**
   * Ensures the remote worksheet tab exists with declared headers, creating it if needed.
   */
  public async ensureWorksheet(): Promise<boolean> {
    if (!this.client.isConfigured(this.getTargetSpreadsheetId()) || this.worksheetChecked) {
      return true;
    }
    try {
      await this.client.createWorksheetIfNotExists(
        this.schema.sheetName,
        this.schema.columns.map((c) => c.name),
        this.getTargetSpreadsheetId()
      );
      this.worksheetChecked = true;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Checks if an error is a WorksheetNotFoundError or missing tab error.
   */
  protected isWorksheetNotFoundError(err: any): boolean {
    return (
      err instanceof WorksheetNotFoundError ||
      err?.name === 'WorksheetNotFoundError' ||
      (typeof err?.message === 'string' && err.message.includes('does not exist'))
    );
  }

  /**
   * Retrieves worksheet headers with validation.
   */
  public async getValidatedHeaders(): Promise<string[]> {
    if (!this.client.isConfigured(this.getTargetSpreadsheetId())) {
      return this.schema.columns.map((c) => c.name);
    }

    const now = Date.now();
    if (this.cachedHeaders && now - this.lastHeaderFetchTime < this.HEADER_CACHE_TTL_MS) {
      return this.cachedHeaders;
    }

    try {
      const headers = await this.client.getHeaders(this.schema.sheetName, this.getTargetSpreadsheetId());
      const validation = validateWorksheetHeaders(headers, this.schema);

      if (!validation.isValid) {
        throw new MissingHeaderError(this.schema.sheetName, validation.missingHeaders);
      }

      this.cachedHeaders = headers;
      this.lastHeaderFetchTime = now;
      return headers;
    } catch (err: any) {
      if (this.isWorksheetNotFoundError(err)) {
        const created = await this.ensureWorksheet();
        if (created) {
          try {
            const headers = await this.client.getHeaders(this.schema.sheetName, this.getTargetSpreadsheetId());
            this.cachedHeaders = headers;
            this.lastHeaderFetchTime = now;
            return headers;
          } catch (headerErr: any) {
            if (this.client.isConfigured(this.getTargetSpreadsheetId())) {
              throw headerErr;
            }
          }
        }
      }
      if (this.client.isConfigured(this.getTargetSpreadsheetId())) {
        throw err;
      }
      return this.schema.columns.map((c) => c.name);
    }
  }

  /**
   * Reads all records from the worksheet.
   */
  public async findAll(): Promise<T[]> {
    const pkProp = this.getPrimaryKeyProperty();

    if (!this.client.isConfigured(this.getTargetSpreadsheetId())) {
      const sheetStore = BaseRepository.fallbackStore.get(this.schema.sheetName)!;
      return Array.from(sheetStore.values()) as T[];
    }

    try {
      const { headers, rows } = await this.client.getRows(this.schema.sheetName, this.getEndColLetter(), this.getTargetSpreadsheetId());
      if (!headers || headers.length === 0) {
        return [];
      }

      const validation = validateWorksheetHeaders(headers, this.schema);
      if (!validation.isValid) {
        throw new MissingHeaderError(this.schema.sheetName, validation.missingHeaders);
      }

      const records: T[] = [];
      for (const row of rows) {
        if (!row || row.length === 0 || row.every((c) => c === '' || c === undefined)) {
          continue; // Skip empty rows
        }
        const record = rowToObject<T>(row, headers, this.schema);
        if (record && record[pkProp]) {
          records.push(record);
        }
      }

      return records;
    } catch (err: any) {
      if (this.isWorksheetNotFoundError(err)) {
        const created = await this.ensureWorksheet();
        if (created) {
          return [];
        }
      }
      if (this.client.isConfigured(this.getTargetSpreadsheetId())) {
        throw err;
      }
      const sheetStore = BaseRepository.fallbackStore.get(this.schema.sheetName)!;
      return Array.from(sheetStore.values()) as T[];
    }
  }

  /**
   * Finds a single record by its primary key.
   */
  public async findById(id: string): Promise<T | null> {
    if (!id) return null;
    const pkProp = this.getPrimaryKeyProperty();

    if (!this.client.isConfigured(this.getTargetSpreadsheetId())) {
      const sheetStore = BaseRepository.fallbackStore.get(this.schema.sheetName)!;
      const item = sheetStore.get(id);
      return item ? ({ ...item } as T) : null;
    }

    try {
      const { headers, rows } = await this.client.getRows(this.schema.sheetName, this.getEndColLetter(), this.getTargetSpreadsheetId());
      if (!headers || headers.length === 0) return null;

      for (const row of rows) {
        const record = rowToObject<T>(row, headers, this.schema);
        if (record && String(record[pkProp]) === String(id)) {
          const sheetStore = BaseRepository.fallbackStore.get(this.schema.sheetName);
          const cached = sheetStore ? sheetStore.get(id) : undefined;
          if (cached) {
            return { ...record, ...cached };
          }
          return record;
        }
      }

      return null;
    } catch (err: any) {
      if (this.isWorksheetNotFoundError(err)) {
        const created = await this.ensureWorksheet();
        if (created) {
          return null;
        }
      }
      if (this.client.isConfigured(this.getTargetSpreadsheetId())) {
        throw err;
      }
      const sheetStore = BaseRepository.fallbackStore.get(this.schema.sheetName)!;
      const item = sheetStore.get(id);
      return item ? ({ ...item } as T) : null;
    }
  }

  /**
   * Appends a new record to the worksheet.
   */
  public async appendRecord(record: T): Promise<T> {
    const pkProp = this.getPrimaryKeyProperty();
    const pkValue = record[pkProp];

    // Always mirror in fallbackStore
    const sheetStore = BaseRepository.fallbackStore.get(this.schema.sheetName)!;
    if (pkValue !== undefined && pkValue !== null) {
      sheetStore.set(String(pkValue), { ...record });
    }

    if (!this.client.isConfigured(this.getTargetSpreadsheetId())) {
      return record;
    }

    try {
      const headers = await this.getValidatedHeaders();
      const row = objectToRow(record, headers, this.schema);
      await this.client.appendRow(this.schema.sheetName, row, this.getTargetSpreadsheetId());
      return record;
    } catch (err: any) {
      if (this.isWorksheetNotFoundError(err)) {
        const created = await this.ensureWorksheet();
        if (created) {
          try {
            const headers = await this.getValidatedHeaders();
            const row = objectToRow(record, headers, this.schema);
            await this.client.appendRow(this.schema.sheetName, row, this.getTargetSpreadsheetId());
            return record;
          } catch (retryErr: any) {
            if (this.client.isConfigured(this.getTargetSpreadsheetId())) {
              throw retryErr;
            }
            return record;
          }
        }
      }
      if (this.client.isConfigured(this.getTargetSpreadsheetId())) {
        throw err;
      }
      return record;
    }
  }

  /**
   * Alias for appendRecord to support standard repository contract.
   */
  public async create(record: T): Promise<T> {
    return this.appendRecord(record);
  }

  /**
   * Updates an existing record by primary key.
   */
  public async updateRecord(id: string, updates: Partial<T>): Promise<T | null> {
    if (!id) return null;
    const pkProp = this.getPrimaryKeyProperty();

    const sheetStore = BaseRepository.fallbackStore.get(this.schema.sheetName)!;
    const localExisting = sheetStore.get(id);
    let updated: any = null;
    if (localExisting) {
      updated = { ...localExisting, ...updates, updatedAt: new Date().toISOString() };
      sheetStore.set(id, updated);
    }

    if (!this.client.isConfigured(this.getTargetSpreadsheetId())) {
      return updated as unknown as T;
    }

    try {
      const { headers, rows } = await this.client.getRows(this.schema.sheetName, this.getEndColLetter(), this.getTargetSpreadsheetId());
      if (!headers || headers.length === 0) return updated as unknown as T;

      let targetRowIndex = -1;
      let existingRecord: T | null = null;

      for (let i = 0; i < rows.length; i++) {
        const rec = rowToObject<T>(rows[i], headers, this.schema);
        if (rec && String(rec[pkProp]) === String(id)) {
          targetRowIndex = i + 2; // Row 1 is header, so row 0 in array is sheet row 2
          existingRecord = rec;
          break;
        }
      }

      if (targetRowIndex === -1 || !existingRecord) {
        return updated as unknown as T;
      }

      const mergedRecord = {
        ...(localExisting || {}),
        ...existingRecord,
        ...updates,
        updatedAt: new Date().toISOString(),
      } as unknown as T;
      sheetStore.set(id, mergedRecord);

      const newRow = objectToRow(mergedRecord, headers, this.schema);
      await this.client.updateRow(this.schema.sheetName, targetRowIndex, newRow, this.getTargetSpreadsheetId());

      return mergedRecord;
    } catch (err: any) {
      if (this.isWorksheetNotFoundError(err)) {
        await this.ensureWorksheet();
        return updated as unknown as T;
      }
      throw err;
    }
  }

  /**
   * Alias for updateRecord supporting both update(id, updates).
   */
  public async update(recordOrId: T | string, updates?: Partial<T>): Promise<T | null> {
    if (typeof recordOrId === 'string') {
      return this.updateRecord(recordOrId, updates || {});
    }
    const pkProp = this.getPrimaryKeyProperty();
    const id = recordOrId[pkProp];
    if (!id) return null;
    return this.updateRecord(String(id), recordOrId as Partial<T>);
  }

  /**
   * Deletes an existing record by primary key through the mandatory Deletion Safety Pipeline:
   * 1. BACKUP: Captures target record, physical row, headers, and computes SHA-256 checksum.
   * 2. VERIFY BACKUP: Verifies backup file existence on disk, read-back validity, and SHA-256 match.
   * 3. DELETE: Authorizes single-use VerifiedDeletionToken; blocks direct deleteRow bypasses.
   * 4. READ-BACK: Verifies target record no longer exists in worksheet.
   * 5. INTEGRITY CHECK: Verifies row count decremented by exactly 1 and schema remains uncorrupted.
   * 6. AUDIT RESULT: Persists verified audit record with backup file path and checksum.
   */
  public async deleteRecord(
    id: string,
    options?: { actor?: { id: string; name: string }; reason?: string }
  ): Promise<boolean> {
    if (!id) return false;
    const pkProp = this.getPrimaryKeyProperty();

    if (!this.client.isConfigured(this.getTargetSpreadsheetId())) {
      const sheetStore = BaseRepository.fallbackStore.get(this.schema.sheetName);
      if (!sheetStore) return false;
      const existing = sheetStore.get(id);
      if (!existing) return false;

      const previousCount = sheetStore.size;

      // 1. BACKUP & 2. VERIFY BACKUP
      const safetyToken = await deletionSafetyService.createAndVerifyBackup({
        sheetName: this.schema.sheetName,
        entityId: String(id),
        physicalRowIndex: -1,
        headers: this.schema.columns.map((c) => c.name),
        rawRow: this.schema.columns.map((c) => (existing as any)[c.propertyKey] ?? ''),
        record: existing,
        actor: options?.actor,
        reason: options?.reason,
      });

      // 3. DELETE (consuming single-use token)
      const consumed = deletionSafetyService.consumeToken(safetyToken, this.schema.sheetName, -1);
      if (!consumed) {
        throw new DirectDeleteBypassError('Invalid or expired deletion safety token');
      }
      sheetStore.delete(id);

      // 4. READ-BACK VERIFICATION
      if (sheetStore.has(id)) {
        throw new DeletionReadBackError(`Post-deletion read-back failed: record '${id}' still present in fallback store`);
      }

      // 5. INTEGRITY CHECK
      if (sheetStore.size !== previousCount - 1) {
        throw new DeletionIntegrityError(`Post-deletion count mismatch: expected ${previousCount - 1}, found ${sheetStore.size}`);
      }

      // 6. AUDIT RESULT
      await this.logDeletionAudit(id, safetyToken, options?.actor, options?.reason);
      return true;
    }

    const { headers, rows } = await this.client.getRows(this.schema.sheetName, this.getEndColLetter(), this.getTargetSpreadsheetId());
    if (!headers || headers.length === 0) return false;

    let targetRowIndex = -1;
    let targetRecord: T | null = null;
    let targetRawRow: (string | number | boolean)[] = [];

    for (let i = 0; i < rows.length; i++) {
      const rec = rowToObject<T>(rows[i], headers, this.schema);
      if (rec && String(rec[pkProp]) === String(id)) {
        targetRowIndex = i + 2; // Row 1 is header, so row 0 in array is sheet row 2
        targetRecord = rec;
        targetRawRow = rows[i];
        break;
      }
    }

    if (targetRowIndex === -1 || !targetRecord) {
      return false;
    }

    const previousRowCount = rows.length;

    // 1. BACKUP & 2. VERIFY BACKUP (Fails closed before modifying worksheet)
    const safetyToken = await deletionSafetyService.createAndVerifyBackup({
      sheetName: this.schema.sheetName,
      entityId: String(id),
      physicalRowIndex: targetRowIndex,
      headers,
      rawRow: targetRawRow,
      record: targetRecord,
      actor: options?.actor,
      reason: options?.reason,
    });

    // 3. DELETE (passing single-use safety token to client.deleteRow)
    await this.client.deleteRow(this.schema.sheetName, targetRowIndex, this.getTargetSpreadsheetId(), safetyToken);

    // 4. READ-BACK VERIFICATION
    const spreadsheetId = this.getTargetSpreadsheetId() || this.client.getSpreadsheetId();
    this.client.invalidateRowCache(`${spreadsheetId}:${this.schema.sheetName}`);
    const postData = await this.client.getRows(this.schema.sheetName, this.getEndColLetter(), this.getTargetSpreadsheetId());

    for (let i = 0; i < postData.rows.length; i++) {
      const rec = rowToObject<T>(postData.rows[i], postData.headers, this.schema);
      if (rec && String(rec[pkProp]) === String(id)) {
        throw new DeletionReadBackError(
          `Post-deletion read-back failed: record '${id}' is still present in '${this.schema.sheetName}' at sheet row ${i + 2}`
        );
      }
    }

    // 5. INTEGRITY CHECK
    if (postData.rows.length !== previousRowCount - 1) {
      throw new DeletionIntegrityError(
        `Post-deletion row count invariant violated in '${this.schema.sheetName}': expected ${previousRowCount - 1}, found ${postData.rows.length}`
      );
    }

    // 6. AUDIT RESULT
    await this.logDeletionAudit(id, safetyToken, options?.actor, options?.reason);
    return true;
  }

  /**
   * Records verified deletion audit entry with pre-deletion backup path and checksum.
   */
  protected async logDeletionAudit(
    entityId: string,
    safetyToken: VerifiedDeletionToken,
    actor?: { id: string; name: string },
    reason?: string
  ): Promise<void> {
    if (this.schema.sheetName === 'AUDIT_LOG') {
      return; // Avoid infinite recursive audit logging
    }
    try {
      const { AuditLogRepository } = await import('./audit-log.repository');
      const auditRepo = AuditLogRepository.getInstance();
      const actorId = actor?.id || 'SYSTEM_DELETE_SAFETY';
      const actorName = actor?.name || 'Deletion Safety Pipeline';
      await auditRepo.logAction(
        actorId,
        actorName,
        'VERIFIED_RECORD_DELETION',
        this.schema.sheetName,
        entityId,
        {
          sheetName: this.schema.sheetName,
          physicalRowIndex: safetyToken.physicalRowIndex,
          backupFilePath: safetyToken.backupFilePath,
          backupChecksum: safetyToken.checksum,
          verifiedAt: new Date().toISOString(),
          reason: reason || 'Controlled deletion via BaseRepository safety pipeline',
        }
      );
    } catch (auditErr) {
      console.warn(`[BaseRepository] Deletion audit logging failed for ${entityId}:`, auditErr);
    }
  }

  /**
   * Helper for tests or initial demo seed initialization in fallback store.
   */
  public seedFallbackData(records: T[]): void {
    const pkProp = this.getPrimaryKeyProperty();
    const sheetStore = BaseRepository.fallbackStore.get(this.schema.sheetName)!;
    for (const r of records) {
      if (r[pkProp]) {
        sheetStore.set(String(r[pkProp]), { ...r });
      }
    }
  }

  public clearFallbackData(): void {
    const sheetStore = BaseRepository.fallbackStore.get(this.schema.sheetName)!;
    sheetStore.clear();
  }
}
