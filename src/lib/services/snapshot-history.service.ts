/**
 * BURRA PARIKSHA CMS - Snapshot History Service
 * Task 3F.4.10C: GCS Durable Archive Integration
 * 
 * Provides read-only snapshot metadata history for system recovery management.
 * Strictly side-effect free and read-only.
 */

import { snapshotExporterService, GoogleSheetsSnapshot } from './snapshot-exporter.service';
import { getSnapshotArchiveConfig } from '../../config/snapshot.config';
import { DurableSnapshotArchiveService } from './durable-snapshot-archive.service';

export interface SnapshotHistoryItem {
  id: string;
  exportTimestamp: string;
  spreadsheetTitle: string;
  spreadsheetIdMasked: string;
  totalWorksheets: number;
  totalRows: number;
  checksum: string;
  integrityStatus: 'VALID' | 'WARNING' | 'CORRUPTED';
  status: 'AVAILABLE' | 'ARCHIVED' | 'SYSTEM_BASELINE' | 'DURABLE_ARCHIVE';
  generator: string;
  storageUri?: string;
}

export class SnapshotHistoryService {
  private static instance: SnapshotHistoryService | null = null;
  private historyCache: SnapshotHistoryItem[] = [];
  private gcsDiscovered = false;

  private constructor() {}

  public static getInstance(): SnapshotHistoryService {
    if (!SnapshotHistoryService.instance) {
      SnapshotHistoryService.instance = new SnapshotHistoryService();
    }
    return SnapshotHistoryService.instance;
  }

  /**
   * Retrieves all available snapshot metadata records.
   * Integrates GCS discovery when enabled to pull durable snapshots.
   * If cache is empty and discovery didn't yield items, generates a live system baseline.
   */
  public async getSnapshotHistory(): Promise<SnapshotHistoryItem[]> {
    const archiveConfig = DurableSnapshotArchiveService.getInstance().getConfig();
    const isGcsEnabled = archiveConfig.enabled;

    if (isGcsEnabled && !this.gcsDiscovered) {
      try {
        const archiveService = DurableSnapshotArchiveService.getInstance();
        const manifests = await archiveService.listManifests();
        for (const m of manifests) {
          if (!this.historyCache.some(item => item.id === m.id)) {
            const item: SnapshotHistoryItem = {
              id: m.id,
              exportTimestamp: m.exportTimestamp,
              spreadsheetTitle: m.spreadsheetTitle,
              spreadsheetIdMasked: m.spreadsheetIdMasked,
              totalWorksheets: m.totalWorksheets,
              totalRows: m.totalRows,
              checksum: m.checksum,
              integrityStatus: m.integrityStatus === 'CORRUPTED' ? 'CORRUPTED' : 'VALID',
              status: 'DURABLE_ARCHIVE',
              generator: m.generator,
              storageUri: m.storageUri,
            };
            this.historyCache.push(item);
          }
        }
        this.gcsDiscovered = true;
      } catch (err) {
        console.error('Failed to auto-discover GCS snapshots:', err);
      }
    }

    // Always ensure we have at least one SYSTEM_BASELINE snapshot representing current sheets state
    if (!this.historyCache.some(item => item.status === 'SYSTEM_BASELINE')) {
      try {
        const liveSnapshot = await snapshotExporterService.exportSnapshot();
        const baselineItem: SnapshotHistoryItem = {
          id: `SNAP-BSL-${Date.now().toString(36).toUpperCase()}`,
          exportTimestamp: liveSnapshot.metadata.exportTimestamp,
          spreadsheetTitle: liveSnapshot.metadata.spreadsheetTitle,
          spreadsheetIdMasked: liveSnapshot.metadata.spreadsheetIdMasked,
          totalWorksheets: liveSnapshot.metadata.totalWorksheets,
          totalRows: liveSnapshot.metadata.totalRows,
          checksum: liveSnapshot.checksum,
          integrityStatus: 'VALID',
          status: 'SYSTEM_BASELINE',
          generator: liveSnapshot.metadata.generator || 'SnapshotExporterService',
        };
        this.historyCache.push(baselineItem);
      } catch {
        // Fall back gracefully if live export fails
      }
    }

    // Sort chronologically descending
    this.historyCache.sort((a, b) => b.exportTimestamp.localeCompare(a.exportTimestamp));

    return [...this.historyCache];
  }

  /**
   * Generates a new durable archive snapshot and uploads it to GCS.
   * Does NOT modify production Sheets or update sequences.
   */
  public async createDurableArchive(existingSnapshot?: GoogleSheetsSnapshot): Promise<SnapshotHistoryItem> {
    const isGcsEnabled = DurableSnapshotArchiveService.getInstance().getConfig().enabled;
    if (!isGcsEnabled) {
      throw new Error('GCS Snapshot Archive is disabled or unconfigured.');
    }

    // 1. Export authoritative snapshot or use provided snapshot
    const snapshot = existingSnapshot || await snapshotExporterService.exportSnapshot();

    // 2. Archive complete snapshot
    const archiveService = DurableSnapshotArchiveService.getInstance();
    const manifest = await archiveService.archiveSnapshot(snapshot);

    // 3. Register resulting metadata
    const item: SnapshotHistoryItem = {
      id: manifest.id,
      exportTimestamp: manifest.exportTimestamp,
      spreadsheetTitle: manifest.spreadsheetTitle,
      spreadsheetIdMasked: manifest.spreadsheetIdMasked,
      totalWorksheets: manifest.totalWorksheets,
      totalRows: manifest.totalRows,
      checksum: manifest.checksum,
      integrityStatus: 'VALID',
      status: 'DURABLE_ARCHIVE',
      generator: manifest.generator,
      storageUri: manifest.storageUri,
    };

    // Store in history
    this.historyCache.unshift(item);
    
    // Sort descending by timestamp
    this.historyCache.sort((a, b) => b.exportTimestamp.localeCompare(a.exportTimestamp));

    return item;
  }

  /**
   * Retrieves an archived snapshot payload from GCS, verifying SHA-256 integrity before returning.
   */
  public async retrieveDurableSnapshot(id: string): Promise<GoogleSheetsSnapshot> {
    const isGcsEnabled = getSnapshotArchiveConfig().enabled;
    if (!isGcsEnabled) {
      throw new Error('GCS Snapshot Archive is disabled or unconfigured.');
    }

    // Get snapshot history to verify the ID exists and is a DURABLE_ARCHIVE
    const history = await this.getSnapshotHistory();
    const item = history.find(x => x.id === id);
    if (!item) {
      throw new Error(`Durable snapshot history item not found: ${id}`);
    }

    if (item.status !== 'DURABLE_ARCHIVE') {
      throw new Error(`Snapshot ${id} is not a DURABLE_ARCHIVE (status is ${item.status})`);
    }

    let dataPath = '';
    if (item.storageUri) {
      const gsPrefix = `gs://${getSnapshotArchiveConfig().bucketName}/`;
      if (item.storageUri.startsWith(gsPrefix)) {
        dataPath = item.storageUri.substring(gsPrefix.length);
      }
    }

    if (!dataPath) {
      // Deterministically reconstruct path if storageUri is missing
      const archiveService = DurableSnapshotArchiveService.getInstance();
      const paths = archiveService.formatObjectPath(item.exportTimestamp, item.checksum);
      dataPath = paths.dataPath;
    }

    const archiveService = DurableSnapshotArchiveService.getInstance();
    const snapshot = await archiveService.retrieveSnapshot(dataPath);

    // Double check integrity of retrieved snapshot checksum against history metadata checksum
    if (snapshot.checksum !== item.checksum) {
      throw new Error('Data Integrity Exception: Retrieved snapshot checksum does not match registered history checksum.');
    }

    return snapshot;
  }

  /**
   * Registers a newly generated snapshot into history (in-memory tracking).
   */
  public registerSnapshot(snapshot: GoogleSheetsSnapshot): SnapshotHistoryItem {
    const item: SnapshotHistoryItem = {
      id: `SNAP-${Date.now().toString(36).toUpperCase()}`,
      exportTimestamp: snapshot.metadata.exportTimestamp,
      spreadsheetTitle: snapshot.metadata.spreadsheetTitle,
      spreadsheetIdMasked: snapshot.metadata.spreadsheetIdMasked,
      totalWorksheets: snapshot.metadata.totalWorksheets,
      totalRows: snapshot.metadata.totalRows,
      checksum: snapshot.checksum,
      integrityStatus: 'VALID',
      status: 'AVAILABLE',
      generator: snapshot.metadata.generator || 'SnapshotExporterService',
    };
    this.historyCache.unshift(item);
    return item;
  }

  /**
   * Clears in-memory cache for testing purposes.
   */
  public clearCache(): void {
    this.historyCache = [];
    this.gcsDiscovered = false;
  }
}

export const snapshotHistoryService = SnapshotHistoryService.getInstance();
