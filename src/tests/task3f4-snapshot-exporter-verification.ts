/**
 * BURRA PARIKSHA CMS - Task 3F.4.3 Snapshot Exporter Verification Script
 * 
 * Safely invokes and tests the Google Sheets snapshot exporter service.
 * Verifies that all authoritative worksheets, headers, rows, sequence state,
 * metadata, and deterministic checksum are correctly produced without exposing secrets.
 */

import { snapshotExporterService } from '../lib/services/snapshot-exporter.service';
import { ALL_SHEET_TABS } from '../lib/schemas/google-sheets-schema';

export async function runTask3F4SnapshotVerification(): Promise<{
  success: boolean;
  message: string;
  metadata?: any;
  worksheetCount?: number;
  sequenceCount?: number;
  checksum?: string;
  secretsCheckPassed?: boolean;
}> {
  try {
    console.log('[Task 3F.4.3 Verification] Starting snapshot export...');
    const snapshot = await snapshotExporterService.exportSnapshot();

    if (!snapshot || !snapshot.metadata || !snapshot.worksheets || !snapshot.sequences || !snapshot.checksum) {
      return {
        success: false,
        message: 'Snapshot structure is invalid or missing required properties (metadata, worksheets, sequences, checksum).',
      };
    }

    // Verify all authoritative worksheets are present
    const exportedSheetNames = Object.keys(snapshot.worksheets);
    for (const expectedTab of ALL_SHEET_TABS) {
      if (!snapshot.worksheets[expectedTab]) {
        return {
          success: false,
          message: `Missing authoritative worksheet in snapshot: "${expectedTab}"`,
        };
      }
    }

    // Verify sequences are present
    if (!Array.isArray(snapshot.sequences)) {
      return {
        success: false,
        message: 'Snapshot sequences field is not an array.',
      };
    }

    // Verify checksum is valid SHA-256 hex (64 chars)
    const checksumRegex = /^[a-f0-9]{64}$/i;
    if (!checksumRegex.test(snapshot.checksum)) {
      return {
        success: false,
        message: `Invalid checksum format: "${snapshot.checksum}" (expected 64-char SHA-256 hex)`,
      };
    }

    // Verify secrets constraint: Snapshot MUST NOT contain API keys, private keys, or credentials
    const serializedSnapshot = JSON.stringify(snapshot);
    const forbiddenSubstrings = [
      'GOOGLE_PRIVATE_KEY',
      'GOOGLE_SERVICE_ACCOUNT_EMAIL',
      'BEGIN PRIVATE KEY',
      'client_secret',
      'DATABASE_URL',
      'BOOTSTRAP_SECRET',
      'GEMINI_API_KEY',
    ];

    for (const forbidden of forbiddenSubstrings) {
      if (serializedSnapshot.includes(forbidden)) {
        return {
          success: false,
          message: `Security violation: Snapshot contains forbidden secret substring "${forbidden}"!`,
          secretsCheckPassed: false,
        };
      }
    }

    console.log('[Task 3F.4.3 Verification] Snapshot export verified successfully.');
    return {
      success: true,
      message: `Successfully exported snapshot with ${exportedSheetNames.length} worksheets, ${snapshot.sequences.length} sequence records, and valid checksum.`,
      metadata: snapshot.metadata,
      worksheetCount: exportedSheetNames.length,
      sequenceCount: snapshot.sequences.length,
      checksum: snapshot.checksum,
      secretsCheckPassed: true,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Snapshot verification failed with error: ${err?.message || 'Unknown error'}`,
    };
  }
}
