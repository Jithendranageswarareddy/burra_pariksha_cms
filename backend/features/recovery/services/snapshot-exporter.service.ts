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
   * Legacy Sheets live export disabled. Cloud Firestore is authoritative.
   */
  public async exportSnapshot(): Promise<GoogleSheetsSnapshot> {
    throw new Error('Google Sheets snapshot export is disabled. Persistence is managed via Firebase Cloud Firestore.');
  }
}

export const snapshotExporterService = SnapshotExporterService.getInstance();
