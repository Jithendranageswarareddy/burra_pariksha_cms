/**
 * BURRA PARIKSHA CMS - Automated Snapshot Backup Scheduler & Retention Service
 * Task 3F.4.10F: Automated Durable Snapshot Backup Scheduling & Safe Retention
 * 
 * Provides a server-side automated backup timer and safe retention evaluation service.
 * Operates strictly through DurableSnapshotArchiveService (single GCS boundary).
 * Enforces concurrency protection and zero-write safety for Google Sheets.
 */

import { getSnapshotArchiveConfig, SnapshotArchiveConfig } from '../../config/snapshot.config';
import { snapshotHistoryService, SnapshotHistoryItem } from './snapshot-history.service';
import { DurableSnapshotArchiveService, SnapshotMetaManifest } from './durable-snapshot-archive.service';
import { GoogleSheetsSnapshot } from './snapshot-exporter.service';

export interface RetentionCandidateReport {
  id: string;
  exportTimestamp: string;
  storageUri: string;
  protected: boolean;
  protectedReason?: 'NEWEST_MINIMUM_BACKUPS' | 'WITHIN_RETENTION_PERIOD' | 'INTEGRITY_FLAGGED_POLICY' | 'NON_DURABLE';
}

export interface RetentionEvaluationReport {
  evaluatedCount: number;
  retentionDays: number;
  minKeepCount: number;
  cleanupEnabled: boolean;
  protectedCount: number;
  eligibleForDeletionCount: number;
  candidates: RetentionCandidateReport[];
  deletedCount: number;
  errors: string[];
}

export interface SchedulerStatusReport {
  schedulerEnabled: boolean;
  scheduleIntervalHours: number;
  lastBackupTimestamp: string | null;
  lastBackupFailureTimestamp: string | null;
  lastBackupStatus: 'IDLE' | 'RUNNING' | 'SUCCESS' | 'FAILED';
  currentlyRunning: boolean;
  retentionCleanupEnabled: boolean;
  retentionDays: number;
  minKeepCount: number;
  durableArchiveCount: number;
  lastErrorMessage: string | null;
  lastCleanupTimestamp: string | null;
  lastCleanupReport: RetentionEvaluationReport | null;
}

export class SnapshotSchedulerService {
  private static instance: SnapshotSchedulerService | null = null;

  private timer: NodeJS.Timeout | null = null;
  private currentlyRunning = false;
  private schedulerStarted = false;

  private lastBackupTimestamp: string | null = null;
  private lastBackupFailureTimestamp: string | null = null;
  private lastBackupStatus: 'IDLE' | 'RUNNING' | 'SUCCESS' | 'FAILED' = 'IDLE';
  private lastErrorMessage: string | null = null;
  
  private lastCleanupTimestamp: string | null = null;
  private lastCleanupReport: RetentionEvaluationReport | null = null;

  private testConfigOverride: SnapshotArchiveConfig | null = null;

  private constructor() {}

  public static getInstance(): SnapshotSchedulerService {
    if (!SnapshotSchedulerService.instance) {
      SnapshotSchedulerService.instance = new SnapshotSchedulerService();
    }
    return SnapshotSchedulerService.instance;
  }

  /**
   * Retrieves active snapshot configuration (supporting test overrides).
   */
  public getConfig(): SnapshotArchiveConfig {
    if (this.testConfigOverride) {
      return this.testConfigOverride;
    }
    return getSnapshotArchiveConfig();
  }

  /**
   * Inject test context for automated verification tests.
   */
  public injectTestContext(config: SnapshotArchiveConfig) {
    this.testConfigOverride = config;
  }

  /**
   * Reset test overrides to environment defaults.
   */
  public resetContext() {
    this.testConfigOverride = null;
    this.stopScheduler();
    this.currentlyRunning = false;
    this.lastBackupStatus = 'IDLE';
    this.lastBackupTimestamp = null;
    this.lastBackupFailureTimestamp = null;
    this.lastErrorMessage = null;
    this.lastCleanupTimestamp = null;
    this.lastCleanupReport = null;
  }

  /**
   * Starts the recurring server-side snapshot backup scheduler if explicitly enabled.
   */
  public startScheduler(): boolean {
    const config = this.getConfig();
    const scheduleEnabled = config.scheduleEnabled ?? false;
    const scheduleIntervalHours = config.scheduleIntervalHours ?? 24;

    if (!scheduleEnabled) {
      console.log('[SnapshotScheduler] Scheduler disabled by configuration (GCS_SNAPSHOT_SCHEDULE_ENABLED=false).');
      return false;
    }

    if (this.schedulerStarted && this.timer) {
      console.log('[SnapshotScheduler] Scheduler is already active.');
      return true;
    }

    const intervalMs = scheduleIntervalHours * 60 * 60 * 1000;
    console.log(`[SnapshotScheduler] Starting automated snapshot scheduler. Interval: ${scheduleIntervalHours} hours (${intervalMs}ms).`);

    this.schedulerStarted = true;
    this.timer = setInterval(() => {
      this.triggerScheduledBackup().catch((err) => {
        console.error('[SnapshotScheduler] Unhandled error during scheduled backup interval tick:', err);
      });
    }, intervalMs);

    // Unref timer in Node environment so process exits cleanly if needed
    if (this.timer && typeof this.timer.unref === 'function') {
      this.timer.unref();
    }

    return true;
  }

  /**
   * Stops the recurring server-side snapshot backup scheduler.
   */
  public stopScheduler(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.schedulerStarted = false;
  }

  /**
   * Triggers a scheduled or on-demand snapshot backup.
   * Protected by concurrency lock to prevent simultaneous execution.
   */
  public async triggerScheduledBackup(existingSnapshot?: GoogleSheetsSnapshot): Promise<SnapshotHistoryItem | null> {
    const config = this.getConfig();

    if (!config.enabled) {
      const msg = 'GCS Snapshot Archive is disabled or unconfigured.';
      this.lastBackupStatus = 'FAILED';
      this.lastBackupFailureTimestamp = new Date().toISOString();
      this.lastErrorMessage = msg;
      throw new Error(msg);
    }

    // Concurrency protection lock
    if (this.currentlyRunning) {
      console.warn('[SnapshotScheduler] Backup execution skipped: a backup job is currently running.');
      return null;
    }

    this.currentlyRunning = true;
    this.lastBackupStatus = 'RUNNING';

    try {
      // 1. Create authoritative durable archive via SnapshotHistoryService
      const archivedItem = await snapshotHistoryService.createDurableArchive(existingSnapshot);

      // Update success metrics
      this.lastBackupTimestamp = new Date().toISOString();
      this.lastBackupStatus = 'SUCCESS';
      this.lastErrorMessage = null;

      // 2. Perform safe retention evaluation / cleanup if configured
      await this.executeRetentionCleanup();

      return archivedItem;
    } catch (err: any) {
      const rawMsg = err?.message || String(err);
      // Sanitize error message to prevent secret exposure
      const sanitizedMsg = rawMsg.replace(/AIzaSy[A-Za-z0-9_\\-]{33}/g, '[REDACTED_API_KEY]');

      this.lastBackupFailureTimestamp = new Date().toISOString();
      this.lastBackupStatus = 'FAILED';
      this.lastErrorMessage = sanitizedMsg;
      console.error('[SnapshotScheduler] Scheduled snapshot backup failed:', sanitizedMsg);
      throw new Error(sanitizedMsg);
    } finally {
      // Release concurrency lock
      this.currentlyRunning = false;
    }
  }

  /**
   * Evaluates retention policy without executing any deletion.
   * Safe, read-only evaluation.
   */
  public evaluateRetentionPolicy(manifests: SnapshotMetaManifest[]): RetentionEvaluationReport {
    const config = this.getConfig();
    const retentionDays = config.retentionDays;
    const minKeepCount = config.minKeepCount ?? 5;
    const retentionCleanupEnabled = config.retentionCleanupEnabled ?? false;

    const sorted = [...manifests].sort((a, b) => b.exportTimestamp.localeCompare(a.exportTimestamp));
    const now = new Date().getTime();
    const cutoffTime = now - retentionDays * 24 * 60 * 60 * 1000;

    const candidateReports: RetentionCandidateReport[] = [];
    let protectedCount = 0;
    let eligibleCount = 0;

    sorted.forEach((manifest, index) => {
      const timestampMs = new Date(manifest.exportTimestamp).getTime();
      let isProtected = false;
      let protectedReason: RetentionCandidateReport['protectedReason'] | undefined;

      // Rule 1: Always protect the N newest backups
      if (index < minKeepCount) {
        isProtected = true;
        protectedReason = 'NEWEST_MINIMUM_BACKUPS';
      }
      // Rule 2: Protect manifests with non-valid integrity status for manual inspection
      else if (manifest.integrityStatus !== 'VALID') {
        isProtected = true;
        protectedReason = 'INTEGRITY_FLAGGED_POLICY';
      }
      // Rule 3: Protect manifests within retention period
      else if (timestampMs >= cutoffTime) {
        isProtected = true;
        protectedReason = 'WITHIN_RETENTION_PERIOD';
      }

      if (isProtected) {
        protectedCount++;
      } else {
        eligibleCount++;
      }

      candidateReports.push({
        id: manifest.id,
        exportTimestamp: manifest.exportTimestamp,
        storageUri: manifest.storageUri,
        protected: isProtected,
        protectedReason,
      });
    });

    return {
      evaluatedCount: manifests.length,
      retentionDays,
      minKeepCount,
      cleanupEnabled: retentionCleanupEnabled,
      protectedCount,
      eligibleForDeletionCount: eligibleCount,
      candidates: candidateReports,
      deletedCount: 0,
      errors: [],
    };
  }

  /**
   * Executes safe retention evaluation and (if retentionCleanupEnabled is true) deletes expired archives.
   */
  public async executeRetentionCleanup(): Promise<RetentionEvaluationReport> {
    const config = this.getConfig();
    const archiveService = DurableSnapshotArchiveService.getInstance();
    
    let manifests: SnapshotMetaManifest[] = [];
    try {
      manifests = await archiveService.listManifests();
    } catch {
      manifests = [];
    }

    const evaluation = this.evaluateRetentionPolicy(manifests);

    if (!config.retentionCleanupEnabled || evaluation.eligibleForDeletionCount === 0) {
      this.lastCleanupTimestamp = new Date().toISOString();
      this.lastCleanupReport = evaluation;
      return evaluation;
    }

    // Execute deletion of eligible candidates through single GCS storage boundary
    const eligibleCandidates = evaluation.candidates.filter(c => !c.protected);
    let deletedCount = 0;
    const errors: string[] = [];

    for (const candidate of eligibleCandidates) {
      try {
        const gsPrefix = `gs://${config.bucketName}/`;
        let dataPath = '';
        if (candidate.storageUri.startsWith(gsPrefix)) {
          dataPath = candidate.storageUri.substring(gsPrefix.length);
        } else {
          const formatted = archiveService.formatObjectPath(candidate.exportTimestamp, candidate.id);
          dataPath = formatted.dataPath;
        }

        const metaPath = dataPath.endsWith('.json')
          ? dataPath.replace(/\.json$/, '.meta.json')
          : `${dataPath}.meta.json`;

        await archiveService.deleteArchive(dataPath, metaPath);
        deletedCount++;
      } catch (err: any) {
        const errMsg = `Failed to delete candidate ${candidate.id}: ${err?.message || String(err)}`;
        errors.push(errMsg);
        console.error(`[SnapshotScheduler] ${errMsg}`);
      }
    }

    evaluation.deletedCount = deletedCount;
    evaluation.errors = errors;

    if (deletedCount > 0) {
      snapshotHistoryService.clearCache();
    }

    this.lastCleanupTimestamp = new Date().toISOString();
    this.lastCleanupReport = evaluation;
    return evaluation;
  }

  /**
   * Provides operational status metadata for API and Admin UI reporting.
   */
  public async getStatus(): Promise<SchedulerStatusReport> {
    const config = this.getConfig();
    let durableArchiveCount = 0;

    if (config.enabled) {
      try {
        const history = await snapshotHistoryService.getSnapshotHistory();
        durableArchiveCount = history.filter(item => item.status === 'DURABLE_ARCHIVE').length;
      } catch {
        durableArchiveCount = 0;
      }
    }

    return {
      schedulerEnabled: config.scheduleEnabled ?? false,
      scheduleIntervalHours: config.scheduleIntervalHours ?? 24,
      lastBackupTimestamp: this.lastBackupTimestamp,
      lastBackupFailureTimestamp: this.lastBackupFailureTimestamp,
      lastBackupStatus: this.lastBackupStatus,
      currentlyRunning: this.currentlyRunning,
      retentionCleanupEnabled: config.retentionCleanupEnabled ?? false,
      retentionDays: config.retentionDays,
      minKeepCount: config.minKeepCount ?? 5,
      durableArchiveCount,
      lastErrorMessage: this.lastErrorMessage,
      lastCleanupTimestamp: this.lastCleanupTimestamp,
      lastCleanupReport: this.lastCleanupReport,
    };
  }
}

export const snapshotSchedulerService = SnapshotSchedulerService.getInstance();
