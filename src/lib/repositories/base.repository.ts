/**
 * BURRA PARIKSHA CMS - Base Repository
 * Phase 2: Google Sheets Database Architecture & Persistence
 * 
 * Provides unified, header-mapped CRUD operations against Google Sheets tabs.
 * Integrates schema validation, header caching, and fallback local store.
 */

import { SheetSchemaContract, SheetTabName } from '../schemas/google-sheets-schema';
import { googleSheetsClient, GoogleSheetsClient } from '../google-sheets/client';
import { objectToRow, rowToObject, validateWorksheetHeaders } from '../google-sheets/helpers';
import { MissingHeaderError } from '../google-sheets/errors';

export abstract class BaseRepository<T extends Record<string, any>> {
  protected schema: SheetSchemaContract;
  protected client: GoogleSheetsClient;
  protected cachedHeaders: string[] | null = null;
  protected lastHeaderFetchTime: number = 0;
  protected HEADER_CACHE_TTL_MS = 60000; // 1 minute header cache

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
   * Retrieves worksheet headers with validation.
   */
  public async getValidatedHeaders(): Promise<string[]> {
    if (!this.client.isConfigured()) {
      return this.schema.columns.map((c) => c.name);
    }

    const now = Date.now();
    if (this.cachedHeaders && now - this.lastHeaderFetchTime < this.HEADER_CACHE_TTL_MS) {
      return this.cachedHeaders;
    }

    const headers = await this.client.getHeaders(this.schema.sheetName);
    const validation = validateWorksheetHeaders(headers, this.schema);

    if (!validation.isValid) {
      throw new MissingHeaderError(this.schema.sheetName, validation.missingHeaders);
    }

    this.cachedHeaders = headers;
    this.lastHeaderFetchTime = now;
    return headers;
  }

  /**
   * Reads all records from the worksheet.
   */
  public async findAll(): Promise<T[]> {
    const pkProp = this.getPrimaryKeyProperty();

    if (!this.client.isConfigured()) {
      const sheetStore = BaseRepository.fallbackStore.get(this.schema.sheetName)!;
      return Array.from(sheetStore.values()) as T[];
    }

    const { headers, rows } = await this.client.getRows(this.schema.sheetName);
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
  }

  /**
   * Finds a single record by its primary key.
   */
  public async findById(id: string): Promise<T | null> {
    if (!id) return null;
    const pkProp = this.getPrimaryKeyProperty();

    if (!this.client.isConfigured()) {
      const sheetStore = BaseRepository.fallbackStore.get(this.schema.sheetName)!;
      const item = sheetStore.get(id);
      return item ? ({ ...item } as T) : null;
    }

    const { headers, rows } = await this.client.getRows(this.schema.sheetName);
    if (!headers || headers.length === 0) return null;

    for (const row of rows) {
      const record = rowToObject<T>(row, headers, this.schema);
      if (record && String(record[pkProp]) === String(id)) {
        return record;
      }
    }

    return null;
  }

  /**
   * Appends a new record to the worksheet.
   */
  public async appendRecord(record: T): Promise<T> {
    const pkProp = this.getPrimaryKeyProperty();
    const pkValue = record[pkProp];

    if (!this.client.isConfigured()) {
      const sheetStore = BaseRepository.fallbackStore.get(this.schema.sheetName)!;
      if (pkValue !== undefined && pkValue !== null) {
        sheetStore.set(String(pkValue), { ...record });
      }
      return record;
    }

    const headers = await this.getValidatedHeaders();
    const row = objectToRow(record, headers, this.schema);
    await this.client.appendRow(this.schema.sheetName, row);
    return record;
  }

  /**
   * Updates an existing record by primary key.
   */
  public async updateRecord(id: string, updates: Partial<T>): Promise<T | null> {
    if (!id) return null;
    const pkProp = this.getPrimaryKeyProperty();

    if (!this.client.isConfigured()) {
      const sheetStore = BaseRepository.fallbackStore.get(this.schema.sheetName)!;
      const existing = sheetStore.get(id);
      if (!existing) return null;
      const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
      sheetStore.set(id, updated);
      return updated as unknown as T;
    }

    const { headers, rows } = await this.client.getRows(this.schema.sheetName);
    if (!headers || headers.length === 0) return null;

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
      return null;
    }

    const mergedRecord = {
      ...existingRecord,
      ...updates,
      updatedAt: new Date().toISOString(),
    } as unknown as T;

    const newRow = objectToRow(mergedRecord, headers, this.schema);
    await this.client.updateRow(this.schema.sheetName, targetRowIndex, newRow);

    return mergedRecord;
  }

  /**
   * Deletes an existing record by primary key.
   */
  public async deleteRecord(id: string): Promise<boolean> {
    if (!id) return false;
    const pkProp = this.getPrimaryKeyProperty();

    if (!this.client.isConfigured()) {
      const sheetStore = BaseRepository.fallbackStore.get(this.schema.sheetName);
      if (sheetStore) {
        return sheetStore.delete(id);
      }
      return false;
    }

    const { headers, rows } = await this.client.getRows(this.schema.sheetName);
    if (!headers || headers.length === 0) return false;

    let targetRowIndex = -1;
    for (let i = 0; i < rows.length; i++) {
      const rec = rowToObject<T>(rows[i], headers, this.schema);
      if (rec && String(rec[pkProp]) === String(id)) {
        targetRowIndex = i + 2; // Row 1 is header, so row 0 in array is sheet row 2
        break;
      }
    }

    if (targetRowIndex === -1) {
      return false;
    }

    await this.client.deleteRow(this.schema.sheetName, targetRowIndex);
    return true;
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
