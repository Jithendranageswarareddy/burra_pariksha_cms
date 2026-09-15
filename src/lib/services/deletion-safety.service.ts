/**
 * BURRA PARIKSHA CMS - Deletion Safety & Verified Backup Pipeline
 * Phase 2 Remediation: Production Deletion Hardening
 * 
 * Enforces the mandatory 6-phase lifecycle for all record deletions:
 * 1. BACKUP: Capture complete entity state, row context, headers, and compute SHA-256 checksum
 * 2. VERIFY BACKUP: Confirm backup file was written to disk, re-read and verify SHA-256 checksum match
 * 3. DELETE: Authorize single-use VerifiedDeletionToken; block direct calls to googleSheetsClient.deleteRow()
 * 4. READ-BACK: Invalidate cache and verify record is physically gone from the worksheet
 * 5. INTEGRITY CHECK: Verify row count decremented by exactly 1 and schema remains uncorrupted
 * 6. AUDIT RESULT: Log verified deletion with backup file path and checksum to AUDIT_LOG
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface DeletionBackupRecord {
  id: string;
  backupTimestamp: string;
  sheetName: string;
  entityId: string;
  physicalRowIndex: number;
  headers: string[];
  rawRow: (string | number | boolean)[];
  record: any;
  checksum: string;
  actor?: { id: string; name: string };
  reason?: string;
}

export interface VerifiedDeletionToken {
  tokenId: string;
  sheetName: string;
  entityId: string;
  physicalRowIndex: number;
  backupFilePath: string;
  checksum: string;
  issuedAt: number;
  expiresAt: number;
}

export class DeletionBackupError extends Error {
  constructor(message: string, public readonly cause?: any) {
    super(`DELETION_BACKUP_ERROR: ${message}`);
    this.name = 'DeletionBackupError';
  }
}

export class DeletionBackupVerificationError extends Error {
  constructor(message: string, public readonly cause?: any) {
    super(`DELETION_BACKUP_VERIFICATION_ERROR: ${message}`);
    this.name = 'DeletionBackupVerificationError';
  }
}

export class DirectDeleteBypassError extends Error {
  constructor(message: string) {
    super(`DIRECT_DELETE_FORBIDDEN: ${message}`);
    this.name = 'DirectDeleteBypassError';
  }
}

export class DeletionReadBackError extends Error {
  constructor(message: string) {
    super(`DELETION_READBACK_ERROR: ${message}`);
    this.name = 'DeletionReadBackError';
  }
}

export class DeletionIntegrityError extends Error {
  constructor(message: string) {
    super(`DELETION_INTEGRITY_ERROR: ${message}`);
    this.name = 'DeletionIntegrityError';
  }
}

export class DeletionSafetyService {
  private static instance: DeletionSafetyService | null = null;
  private activeTokens: Map<string, VerifiedDeletionToken> = new Map();

  // Test failure simulation hooks (strictly for deterministic unit tests)
  private simulateBackupFailure = false;
  private simulateVerificationFailure = false;

  private constructor() {}

  public static getInstance(): DeletionSafetyService {
    if (!DeletionSafetyService.instance) {
      DeletionSafetyService.instance = new DeletionSafetyService();
    }
    return DeletionSafetyService.instance;
  }

  /**
   * Test hook to simulate backup or verification failures.
   */
  public setSimulationHooks(hooks: { backupFailure?: boolean; verificationFailure?: boolean }): void {
    this.simulateBackupFailure = !!hooks.backupFailure;
    this.simulateVerificationFailure = !!hooks.verificationFailure;
  }

  public resetSimulationHooks(): void {
    this.simulateBackupFailure = false;
    this.simulateVerificationFailure = false;
  }

  /**
   * Deterministically computes the SHA-256 checksum over canonical payload fields.
   */
  public computeChecksum(payload: {
    sheetName: string;
    entityId: string;
    physicalRowIndex: number;
    headers: string[];
    rawRow: (string | number | boolean)[];
    record: any;
  }): string {
    const canonical = JSON.stringify({
      sheetName: payload.sheetName,
      entityId: payload.entityId,
      physicalRowIndex: payload.physicalRowIndex,
      headers: payload.headers,
      rawRow: payload.rawRow,
      record: payload.record,
    });
    return crypto.createHash('sha256').update(canonical).digest('hex');
  }

  /**
   * PHASE 1 & 2: Creates and verifies pre-deletion backup on disk.
   * Returns a single-use VerifiedDeletionToken on success.
   * Fails closed: if backup or verification fails, throws and target row is untouched.
   */
  public async createAndVerifyBackup(params: {
    sheetName: string;
    entityId: string;
    physicalRowIndex: number;
    headers: string[];
    rawRow: (string | number | boolean)[];
    record: any;
    actor?: { id: string; name: string };
    reason?: string;
  }): Promise<VerifiedDeletionToken> {
    // 1. Simulation check for deterministic tests
    if (this.simulateBackupFailure) {
      throw new DeletionBackupError('Simulated backup creation failure (pre-deletion safety check)');
    }

    const backupId = `DEL-BAK-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const backupTimestamp = new Date().toISOString();
    const checksum = this.computeChecksum({
      sheetName: params.sheetName,
      entityId: params.entityId,
      physicalRowIndex: params.physicalRowIndex,
      headers: params.headers,
      rawRow: params.rawRow,
      record: params.record,
    });

    const backupRecord: DeletionBackupRecord = {
      id: backupId,
      backupTimestamp,
      sheetName: params.sheetName,
      entityId: params.entityId,
      physicalRowIndex: params.physicalRowIndex,
      headers: params.headers,
      rawRow: params.rawRow,
      record: params.record,
      checksum,
      actor: params.actor,
      reason: params.reason,
    };

    // Ensure backups directory exists
    const backupDir = path.join(process.cwd(), 'backups', 'deletion');
    try {
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
    } catch (dirErr: any) {
      throw new DeletionBackupError(`Failed to create backup directory '${backupDir}': ${dirErr?.message}`, dirErr);
    }

    // Write backup file to disk
    const sanitizedId = params.entityId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const backupFileName = `${backupId}-${params.sheetName}-${sanitizedId}.json`;
    const backupFilePath = path.join(backupDir, backupFileName);

    try {
      fs.writeFileSync(backupFilePath, JSON.stringify(backupRecord, null, 2), 'utf-8');
    } catch (writeErr: any) {
      throw new DeletionBackupError(`Failed to write backup file to disk: ${writeErr?.message}`, writeErr);
    }

    // PHASE 2: VERIFY BACKUP EXISTS AND IS VALID
    if (this.simulateVerificationFailure) {
      throw new DeletionBackupVerificationError('Simulated backup verification failure (post-write validation check)');
    }

    if (!fs.existsSync(backupFilePath)) {
      throw new DeletionBackupVerificationError(`Backup verification failed: file does not exist at '${backupFilePath}'`);
    }

    let readBackContent = '';
    try {
      readBackContent = fs.readFileSync(backupFilePath, 'utf-8');
    } catch (readErr: any) {
      throw new DeletionBackupVerificationError(`Failed to read back backup file for verification: ${readErr?.message}`, readErr);
    }

    let parsedBackup: DeletionBackupRecord;
    try {
      parsedBackup = JSON.parse(readBackContent);
    } catch (jsonErr: any) {
      throw new DeletionBackupVerificationError(`Backup file corruption: invalid JSON in '${backupFilePath}'`, jsonErr);
    }

    if (
      !parsedBackup ||
      parsedBackup.id !== backupId ||
      parsedBackup.sheetName !== params.sheetName ||
      parsedBackup.entityId !== params.entityId ||
      parsedBackup.checksum !== checksum
    ) {
      throw new DeletionBackupVerificationError(`Backup verification failed: header/checksum mismatch in '${backupFilePath}'`);
    }

    const recomputedChecksum = this.computeChecksum({
      sheetName: parsedBackup.sheetName,
      entityId: parsedBackup.entityId,
      physicalRowIndex: parsedBackup.physicalRowIndex,
      headers: parsedBackup.headers,
      rawRow: parsedBackup.rawRow,
      record: parsedBackup.record,
    });

    if (recomputedChecksum !== checksum) {
      throw new DeletionBackupVerificationError(`Backup verification failed: recomputed checksum ${recomputedChecksum} !== ${checksum}`);
    }

    // Issue single-use VerifiedDeletionToken (valid for 60 seconds)
    const token: VerifiedDeletionToken = {
      tokenId: `TOK-${crypto.randomBytes(16).toString('hex')}`,
      sheetName: params.sheetName,
      entityId: params.entityId,
      physicalRowIndex: params.physicalRowIndex,
      backupFilePath,
      checksum,
      issuedAt: Date.now(),
      expiresAt: Date.now() + 60000,
    };

    this.activeTokens.set(token.tokenId, token);
    return token;
  }

  /**
   * Consumes a single-use VerifiedDeletionToken.
   * Validates token authenticity, expiration, matching sheet, and row index.
   * Prevents replay and unauthorized deletions.
   */
  public consumeToken(token: VerifiedDeletionToken, sheetName: string, physicalRowIndex: number): boolean {
    if (!token || !token.tokenId) return false;
    const stored = this.activeTokens.get(token.tokenId);
    if (!stored) return false;

    // Single-use: remove immediately
    this.activeTokens.delete(token.tokenId);

    if (stored.sheetName !== sheetName) return false;
    // In fallback mode physicalRowIndex is -1
    if (physicalRowIndex !== -1 && stored.physicalRowIndex !== physicalRowIndex) return false;
    if (Date.now() > stored.expiresAt) return false;

    return true;
  }
}

export const deletionSafetyService = DeletionSafetyService.getInstance();
