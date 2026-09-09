/**
 * BURRA PARIKSHA CMS - Durable Snapshot Archive Service
 * Task 3F.4.10B: GCS Durable Archive with SHA-256 Integrity Verification
 */

import { google } from 'googleapis';
import * as crypto from 'crypto';
import { getSnapshotArchiveConfig, SnapshotArchiveConfig } from '../../config/snapshot.config';
import { GoogleSheetsSnapshot } from './snapshot-exporter.service';

export interface SnapshotMetaManifest {
  id: string;
  exportTimestamp: string;
  spreadsheetTitle: string;
  spreadsheetIdMasked: string;
  totalWorksheets: number;
  totalRows: number;
  sizeBytes: number;
  checksum: string;
  integrityStatus: 'VALID' | 'CORRUPTED';
  status: 'AVAILABLE' | 'TAMPERED';
  generator: string;
  storageUri: string;
  retentionExpiration: string;
}

export class DurableSnapshotArchiveService {
  private static instance: DurableSnapshotArchiveService | null = null;
  private config: SnapshotArchiveConfig;
  private gcsClient: any = null;

  // In-memory fallback for local development or mock tests
  private mockBucket: Map<string, string> = new Map();

  private constructor() {
    this.config = getSnapshotArchiveConfig();
  }

  public static getInstance(): DurableSnapshotArchiveService {
    if (!DurableSnapshotArchiveService.instance) {
      DurableSnapshotArchiveService.instance = new DurableSnapshotArchiveService();
    }
    return DurableSnapshotArchiveService.instance;
  }

  /**
   * Allows injecting a mock GCS client or resetting config for testing.
   */
  public injectTestContext(config: SnapshotArchiveConfig, mockClient?: any, clearMock = true) {
    this.config = config;
    this.gcsClient = mockClient;
    if (clearMock) {
      this.mockBucket.clear();
    }
  }

  /**
   * Resets the configuration back to reading process environment.
   */
  public resetContext() {
    this.config = getSnapshotArchiveConfig();
    this.gcsClient = null;
    this.mockBucket.clear();
  }

  /**
   * Returns active configuration.
   */
  public getConfig(): SnapshotArchiveConfig {
    return this.config;
  }

  /**
   * Deterministically canonicalizes a snapshot to string for SHA-256 calculation.
   */
  public canonicalizeSnapshot(snapshot: GoogleSheetsSnapshot): string {
    const sortedWorksheets: Record<string, any> = {};
    const sheetNames = Object.keys(snapshot.worksheets || {}).sort();
    
    for (const name of sheetNames) {
      const ws = snapshot.worksheets[name];
      sortedWorksheets[name] = {
        sheetName: ws.sheetName,
        headers: ws.headers || [],
        rows: ws.rows || [],
        rowCount: ws.rowCount || 0,
      };
    }

    const sortedSequences = [...(snapshot.sequences || [])].sort((a, b) => {
      return String(a?.entity || '').localeCompare(String(b?.entity || ''));
    });

    return JSON.stringify({
      worksheets: sortedWorksheets,
      sequences: sortedSequences,
    });
  }

  /**
   * Inspects snapshot payload for standard patterns of secrets/credentials to reject.
   */
  public validateNoSecrets(payloadString: string): void {
    const secretPatterns = [
      /-----BEGIN PRIVATE KEY-----/,
      /-----BEGIN RSA PRIVATE KEY-----/,
      /"private_key":/,
      /AIzaSy[A-Za-z0-9_\\-]{33}/, // Google API Key
      /ey[J-Z][a-zA-Z0-9_-]+\.ey[J-Z][a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/ // JWT Token
    ];

    for (const pattern of secretPatterns) {
      if (pattern.test(payloadString)) {
        throw new Error('Security Violation: Snapshot payload contains sensitive credentials or secrets. Archival rejected.');
      }
    }

    // Check against configured environment secrets explicitly
    const envSecrets = [
      process.env.GOOGLE_PRIVATE_KEY,
      process.env.GEMINI_API_KEY,
      process.env.SESSION_SECRET,
      process.env.INITIAL_ADMIN_PASSWORD,
    ].filter(Boolean) as string[];

    for (const secret of envSecrets) {
      if (secret.length > 12 && payloadString.includes(secret)) {
        throw new Error('Security Violation: Snapshot payload contains an active server environment secret value. Archival rejected.');
      }
    }
  }

  /**
   * Formats a deterministic object path for the snapshot.
   * Path pattern: snapshots/YYYY/MM/SNAP-YYYYMMDD-HHMMSS-{checksum8}.json
   */
  public formatObjectPath(timestamp: string, checksum: string): { dataPath: string; metaPath: string; snapshotId: string } {
    const date = new Date(timestamp);
    const year = String(date.getUTCFullYear());
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    
    // YYYYMMDD-HHMMSS format
    const ymd = date.toISOString().replace(/[-:]/g, '').split('T')[0];
    const hms = date.toISOString().replace(/[-:]/g, '').split('T')[1].split('.')[0];
    const tsPart = `${ymd}-${hms}`;
    
    const checksum8 = (checksum || '00000000').substring(0, 8).toUpperCase();
    const snapshotId = `SNAP-${tsPart}-${checksum8}`;

    return {
      dataPath: `snapshots/${year}/${month}/${snapshotId}.json`,
      metaPath: `snapshots/${year}/${month}/${snapshotId}.meta.json`,
      snapshotId,
    };
  }

  /**
   * Gets or initializes the GCS client with Service Account JWT Auth.
   */
  private getStorageClient() {
    if (this.gcsClient) return this.gcsClient;

    const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    let privateKey = process.env.GOOGLE_PRIVATE_KEY;

    if (!email || !privateKey) {
      throw new Error('Google Cloud Service Account credentials are not configured in environment.');
    }

    if (privateKey.includes('\\n')) {
      privateKey = privateKey.replace(/\\n/g, '\n');
    }

    const auth = new google.auth.JWT({
      email,
      key: privateKey,
      scopes: ['https://www.googleapis.com/auth/devstorage.read_write'],
    });

    this.gcsClient = google.storage({ version: 'v1', auth });
    return this.gcsClient;
  }

  /**
   * Executes a GCS REST API operation with bounded retries and backoff for transient errors.
   */
  private async executeWithRetry<T>(operation: () => Promise<T>, opName: string, maxRetries = 3): Promise<T> {
    let attempt = 0;
    while (true) {
      try {
        return await operation();
      } catch (err: any) {
        attempt++;
        const statusCode = err?.response?.status || err?.status || 0;
        const isTransient = 
          statusCode === 500 || 
          statusCode === 502 || 
          statusCode === 503 || 
          statusCode === 504 || 
          err?.code === 'ECONNRESET' || 
          err?.code === 'ETIMEDOUT';

        if (isTransient && attempt <= maxRetries) {
          const delay = Math.pow(2, attempt) * 1000 + Math.floor(Math.random() * 200);
          console.warn(`[DurableSnapshot-Retry] Transient error ${statusCode || err?.code} during ${opName}. Retrying (${attempt}/${maxRetries}) in ${delay}ms...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw err;
      }
    }
  }

  /**
   * Uploads a validated snapshot and its manifest to GCS.
   */
  public async archiveSnapshot(snapshot: GoogleSheetsSnapshot): Promise<SnapshotMetaManifest> {
    if (!this.config.enabled) {
      throw new Error('Durable Snapshot Archive is disabled or unconfigured.');
    }

    const canonicalPayload = this.canonicalizeSnapshot(snapshot);
    this.validateNoSecrets(canonicalPayload);

    // Re-verify payload checksum match
    const computedChecksum = crypto.createHash('sha256').update(canonicalPayload).digest('hex');
    
    const timestamp = snapshot.metadata?.exportTimestamp || new Date().toISOString();
    const { dataPath, metaPath, snapshotId } = this.formatObjectPath(timestamp, computedChecksum);

    const sizeBytes = Buffer.byteLength(canonicalPayload, 'utf8');
    const retentionExp = new Date();
    retentionExp.setDate(retentionExp.getDate() + this.config.retentionDays);

    const manifest: SnapshotMetaManifest = {
      id: snapshotId,
      exportTimestamp: timestamp,
      spreadsheetTitle: snapshot.metadata?.spreadsheetTitle || 'Unknown Database',
      spreadsheetIdMasked: snapshot.metadata?.spreadsheetIdMasked || 'Unknown',
      totalWorksheets: Object.keys(snapshot.worksheets || {}).length,
      totalRows: Object.values(snapshot.worksheets || {}).reduce((acc, curr) => acc + (curr?.rowCount || 0), 0),
      sizeBytes,
      checksum: computedChecksum,
      integrityStatus: 'VALID',
      status: 'AVAILABLE',
      generator: 'DurableSnapshotArchiveService',
      storageUri: `gs://${this.config.bucketName}/${dataPath}`,
      retentionExpiration: retentionExp.toISOString(),
    };

    // Ensure the snapshot checksum matches our computed canonical checksum
    snapshot.checksum = computedChecksum;

    const serializedSnapshot = JSON.stringify(snapshot, null, 2);
    const serializedManifest = JSON.stringify(manifest, null, 2);

    // MOCK MODE FOR TESTS OR LOCAL FALLBACK
    if (this.config.bucketName === 'mock-test-bucket' || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
      // Check existing to enforce immutability
      if (this.mockBucket.has(dataPath)) {
        throw new Error(`Conflict: Snapshot object already exists in bucket: ${dataPath}`);
      }
      this.mockBucket.set(dataPath, serializedSnapshot);
      this.mockBucket.set(metaPath, serializedManifest);
      return manifest;
    }

    const storage = this.getStorageClient();

    // 1. Enforce Immutability - Precheck if exists
    try {
      await this.executeWithRetry(async () => {
        await storage.objects.get({
          bucket: this.config.bucketName,
          object: dataPath,
        });
      }, 'get-precheck');
      
      // If we didn't throw, the object already exists
      throw new Error(`Conflict: Snapshot object already exists at immutable path: gs://${this.config.bucketName}/${dataPath}`);
    } catch (err: any) {
      const statusCode = err?.response?.status || err?.status || 0;
      if (statusCode !== 404) {
        // Re-throw any actual errors except 404 (Not Found)
        throw err;
      }
    }

    // 2. Upload Snapshot JSON
    await this.executeWithRetry(async () => {
      await storage.objects.insert({
        bucket: this.config.bucketName,
        name: dataPath,
        media: {
          mimeType: 'application/json',
          body: serializedSnapshot,
        },
        // Cloud-native prevent-overwrite precondition parameter
        ifGenerationMatch: 0,
      });
    }, 'upload-snapshot');

    // 3. Upload Metadata JSON Manifest
    await this.executeWithRetry(async () => {
      await storage.objects.insert({
        bucket: this.config.bucketName,
        name: metaPath,
        media: {
          mimeType: 'application/json',
          body: serializedManifest,
        },
        ifGenerationMatch: 0,
      });
    }, 'upload-manifest');

    return manifest;
  }

  /**
   * Retrieves an archived snapshot by GCS path.
   */
  public async retrieveSnapshot(dataPath: string): Promise<GoogleSheetsSnapshot> {
    if (!this.config.enabled) {
      throw new Error('Durable Snapshot Archive is disabled or unconfigured.');
    }

    let payload: string;

    // MOCK MODE FOR TESTS OR LOCAL FALLBACK
    if (this.config.bucketName === 'mock-test-bucket' || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
      const mockData = this.mockBucket.get(dataPath);
      if (!mockData) {
        throw new Error(`Snapshot not found: ${dataPath}`);
      }
      payload = mockData;
    } else {
      const storage = this.getStorageClient();
      const res = await this.executeWithRetry(async () => {
        return await storage.objects.get({
          bucket: this.config.bucketName,
          object: dataPath,
          alt: 'media',
        });
      }, 'retrieve-snapshot');

      if (typeof res.data === 'string') {
        payload = res.data;
      } else {
        payload = JSON.stringify(res.data);
      }
    }

    const snapshot: GoogleSheetsSnapshot = JSON.parse(payload);

    // Calculate & verify canonical payload SHA-256 integrity
    const canonicalPayload = this.canonicalizeSnapshot(snapshot);
    const computedChecksum = crypto.createHash('sha256').update(canonicalPayload).digest('hex');

    if (snapshot.checksum !== computedChecksum) {
      throw new Error(`Data Integrity Exception: Retrieved snapshot SHA-256 mismatch. Payload may have been corrupted or tampered with.`);
    }

    return snapshot;
  }

  /**
   * Retrieves the meta.json manifest for a given path.
   */
  public async retrieveManifest(metaPath: string): Promise<SnapshotMetaManifest> {
    if (!this.config.enabled) {
      throw new Error('Durable Snapshot Archive is disabled or unconfigured.');
    }

    let payload: string;

    // MOCK MODE FOR TESTS OR LOCAL FALLBACK
    if (this.config.bucketName === 'mock-test-bucket' || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
      const mockData = this.mockBucket.get(metaPath);
      if (!mockData) {
        throw new Error(`Manifest not found: ${metaPath}`);
      }
      payload = mockData;
    } else {
      const storage = this.getStorageClient();
      const res = await this.executeWithRetry(async () => {
        return await storage.objects.get({
          bucket: this.config.bucketName,
          object: metaPath,
          alt: 'media',
        });
      }, 'retrieve-manifest');

      if (typeof res.data === 'string') {
        payload = res.data;
      } else {
        payload = JSON.stringify(res.data);
      }
    }

    return JSON.parse(payload);
  }

  /**
   * Lists all snapshot manifests in the GCS bucket.
   */
  public async listManifests(): Promise<SnapshotMetaManifest[]> {
    if (!this.config.enabled) {
      return [];
    }

    if (this.config.bucketName === 'mock-test-bucket' || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
      const manifests: SnapshotMetaManifest[] = [];
      for (const [key, value] of this.mockBucket.entries()) {
        if (key.endsWith('.meta.json')) {
          try {
            manifests.push(JSON.parse(value));
          } catch (err) {
            // Ignore bad parses
          }
        }
      }
      return manifests.sort((a, b) => b.exportTimestamp.localeCompare(a.exportTimestamp));
    }

    const storage = this.getStorageClient();
    try {
      const res = await this.executeWithRetry(async () => {
        return await storage.objects.list({
          bucket: this.config.bucketName,
          prefix: 'snapshots/',
        });
      }, 'list-objects');

      const items = res.data.items || [];
      const metaItems = items.filter((item: any) => item.name && item.name.endsWith('.meta.json'));

      const manifests = await Promise.all(
        metaItems.map(async (item: any) => {
          try {
            return await this.retrieveManifest(item.name);
          } catch (err) {
            console.error(`Failed to retrieve manifest for ${item.name}:`, err);
            return null;
          }
        })
      );

      return (manifests.filter(Boolean) as SnapshotMetaManifest[]).sort(
        (a, b) => b.exportTimestamp.localeCompare(a.exportTimestamp)
      );
    } catch (err: any) {
      console.error('Failed to list snapshot manifests from GCS:', err);
      throw err;
    }
  }

  /**
   * Deletes a snapshot JSON object and its metadata manifest from GCS bucket.
   * Single GCS storage boundary enforcement for retention cleanup.
   */
  public async deleteArchive(dataPath: string, metaPath: string): Promise<void> {
    if (!this.config.enabled) {
      throw new Error('Durable Snapshot Archive is disabled or unconfigured.');
    }

    if (this.config.bucketName === 'mock-test-bucket' || !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
      this.mockBucket.delete(dataPath);
      this.mockBucket.delete(metaPath);
      return;
    }

    const storage = this.getStorageClient();

    // 1. Delete data JSON object
    await this.executeWithRetry(async () => {
      await storage.objects.delete({
        bucket: this.config.bucketName,
        object: dataPath,
      });
    }, 'delete-snapshot');

    // 2. Delete manifest meta.json object
    await this.executeWithRetry(async () => {
      await storage.objects.delete({
        bucket: this.config.bucketName,
        object: metaPath,
      });
    }, 'delete-manifest');
  }
}
