/**
 * BURRA PARIKSHA CMS - Google Sheets Snapshot Exporter Service
 * Task 3F.4.3: Google Sheets Snapshot Exporter
 * 
 * Provides a server-side read-only utility to export all authoritative Google Sheets worksheets,
 * headers, rows, and sequence state into a structured JSON snapshot with a deterministic integrity checksum.
 * 
 * Strict Constraints:
 * - Read-only operation against Google Sheets.
 * - Does not export secrets (API keys, credentials, tokens).
 * - Side-effect free.
 */

import { googleSheetsClient } from '../google-sheets/client';
import { ALL_SHEET_TABS, SheetTabName } from '../schemas/google-sheets-schema';
import { sequencesRepository } from '../repositories/sequences.repository';
import crypto from 'node:crypto';

export interface WorksheetSnapshot {
  sheetName: string;
  headers: string[];
  rows: (string | number | boolean)[][];
  rowCount: number;
}

export interface SnapshotMetadata {
  exportTimestamp: string;
  spreadsheetTitle: string;
  spreadsheetIdMasked: string;
  totalWorksheets: number;
  totalRows: number;
  generator: string;
}

export interface GoogleSheetsSnapshot {
  metadata: SnapshotMetadata;
  worksheets: Record<string, WorksheetSnapshot>;
  sequences: any[];
  checksum: string;
}

export class SnapshotExporterService {
  private static instance: SnapshotExporterService | null = null;

  private constructor() {}

  public static getInstance(): SnapshotExporterService {
    if (!SnapshotExporterService.instance) {
      SnapshotExporterService.instance = new SnapshotExporterService();
    }
    return SnapshotExporterService.instance;
  }

  /**
   * Generates a complete, read-only JSON snapshot of all authoritative worksheets, headers, rows,
   * and sequence states, along with a deterministic SHA-256 checksum.
   */
  public async exportSnapshot(): Promise<GoogleSheetsSnapshot> {
    const isConfigured = googleSheetsClient.isConfigured();
    const spreadsheetId = googleSheetsClient.getSpreadsheetId();
    const spreadsheetIdMasked =
      spreadsheetId && spreadsheetId.length > 8
        ? `${spreadsheetId.substring(0, 4)}...${spreadsheetId.substring(spreadsheetId.length - 4)}`
        : '(Not configured / Local Mock)';

    let spreadsheetTitle = 'Local Mock Environment';
    let existingSheetNames: string[] = ALL_SHEET_TABS as unknown as string[];

    if (isConfigured) {
      try {
        const metadata = await googleSheetsClient.getSpreadsheetMetadata();
        spreadsheetTitle = metadata.title;
        existingSheetNames = metadata.sheetNames;
      } catch {
        // Fall back to ALL_SHEET_TABS if metadata fetch fails
      }
    }

    const worksheets: Record<string, WorksheetSnapshot> = {};
    let totalRows = 0;

    for (const tabName of ALL_SHEET_TABS) {
      let headers: string[] = [];
      let rows: (string | number | boolean)[][] = [];

      if (isConfigured && existingSheetNames.includes(tabName)) {
        try {
          const sheetData = await googleSheetsClient.getRows(tabName);
          headers = sheetData.headers;
          rows = sheetData.rows;
        } catch {
          headers = [];
          rows = [];
        }
      } else {
        // If not configured or sheet tab doesn't exist yet, populate empty structure or fallback
        headers = [];
        rows = [];
      }

      worksheets[tabName] = {
        sheetName: tabName,
        headers,
        rows,
        rowCount: rows.length,
      };
      totalRows += rows.length;
    }

    // Export sequence state
    let sequences: any[] = [];
    try {
      sequences = await sequencesRepository.findAll();
    } catch {
      sequences = [];
    }

    const exportTimestamp = new Date().toISOString();

    const metadata: SnapshotMetadata = {
      exportTimestamp,
      spreadsheetTitle,
      spreadsheetIdMasked,
      totalWorksheets: ALL_SHEET_TABS.length,
      totalRows,
      generator: 'BurraPariksha-SnapshotExporter-v1.0',
    };

    // Calculate deterministic integrity checksum over canonical representation of worksheets and sequences
    const checksumPayload = JSON.stringify({
      worksheets,
      sequences,
    });
    const checksum = crypto.createHash('sha256').update(checksumPayload).digest('hex');

    return {
      metadata,
      worksheets,
      sequences,
      checksum,
    };
  }
}

export const snapshotExporterService = SnapshotExporterService.getInstance();
