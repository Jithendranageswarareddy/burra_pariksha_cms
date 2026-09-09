/**
 * BURRA PARIKSHA CMS - Durable Snapshot Archive Configuration
 * Task 3F.4.10A: Configuration Foundation for GCS Snapshot Storage
 */

export interface SnapshotArchiveConfig {
  /** GCS Bucket name for storing archived snapshot payloads */
  bucketName: string;
  /** Whether GCS snapshot archive is explicitly enabled */
  enabled: boolean;
  /** Retention duration in days (default: 365) */
  retentionDays: number;
  /** Whether GCS bucket configuration is valid and usable */
  isGcsConfigured: boolean;
  /** Configuration validation warnings, if any */
  warnings: string[];
  /** Whether automated snapshot backup scheduling is explicitly enabled */
  scheduleEnabled?: boolean;
  /** Schedule interval in hours (default: 24) */
  scheduleIntervalHours?: number;
  /** Whether automatic retention cleanup of expired GCS archives is enabled (default: false) */
  retentionCleanupEnabled?: boolean;
  /** Minimum number of newest durable snapshots to protect from deletion (default: 5) */
  minKeepCount?: number;
}

/**
 * Validates GCS bucket name according to Cloud Storage naming rules.
 * - 3 to 63 characters
 * - Lowercase letters, numbers, hyphens, underscores, dots
 * - Must start and end with a number or letter
 */
export function validateBucketName(bucket: string): boolean {
  if (!bucket || typeof bucket !== 'string') return false;
  const trimmed = bucket.trim();
  if (trimmed.length < 3 || trimmed.length > 63) return false;
  // GCS bucket naming regex (lowercase letters, numbers, hyphens, underscores, dots)
  const gcsBucketPattern = /^[a-z0-9][a-z0-9._-]*[a-z0-9]$/;
  return gcsBucketPattern.test(trimmed);
}

/**
 * Reads, parses, and validates durable snapshot archive configuration from environment variables.
 * Designed to fail safely for invalid inputs and fall back to local development defaults.
 */
export function getSnapshotArchiveConfig(): SnapshotArchiveConfig {
  const warnings: string[] = [];

  const rawBucket = process.env.GCS_SNAPSHOT_BUCKET || '';
  const bucketName = rawBucket.trim();

  const rawEnabled = (process.env.GCS_SNAPSHOT_ENABLED || '').toLowerCase().trim();
  const rawRetention = (process.env.GCS_SNAPSHOT_RETENTION_DAYS || '').trim();

  // Validate Retention Days
  let retentionDays = 365; // Default: 1 year
  if (rawRetention) {
    const parsedDays = parseInt(rawRetention, 10);
    if (isNaN(parsedDays) || parsedDays <= 0) {
      warnings.push(`Invalid GCS_SNAPSHOT_RETENTION_DAYS value "${rawRetention}". Falling back to default (365 days).`);
      retentionDays = 365;
    } else {
      retentionDays = parsedDays;
    }
  }

  // Validate Bucket Name
  const isGcsConfigured = validateBucketName(bucketName);
  if (bucketName && !isGcsConfigured) {
    warnings.push(`Invalid GCS_SNAPSHOT_BUCKET name "${bucketName}". Must be 3-63 chars of lowercase letters, numbers, hyphens, underscores, or dots.`);
  }

  // Determine Effective Enabled State
  let enabled = false;
  if (rawEnabled === 'true' || rawEnabled === '1') {
    if (isGcsConfigured) {
      enabled = true;
    } else {
      warnings.push('GCS_SNAPSHOT_ENABLED is set to true, but GCS_SNAPSHOT_BUCKET is invalid or unconfigured. GCS snapshot archiving will remain disabled.');
      enabled = false;
    }
  } else {
    enabled = false;
  }

  // Scheduling Configuration
  const rawScheduleEnabled = (process.env.GCS_SNAPSHOT_SCHEDULE_ENABLED || '').toLowerCase().trim();
  const rawInterval = (process.env.GCS_SNAPSHOT_INTERVAL_HOURS || '').trim();

  let scheduleIntervalHours = 24; // Default: 24 hours
  if (rawInterval) {
    const parsedInterval = parseInt(rawInterval, 10);
    if (isNaN(parsedInterval) || parsedInterval <= 0) {
      warnings.push(`Invalid GCS_SNAPSHOT_INTERVAL_HOURS value "${rawInterval}". Falling back to default (24 hours).`);
      scheduleIntervalHours = 24;
    } else {
      scheduleIntervalHours = parsedInterval;
    }
  }

  let scheduleEnabled = false;
  if (rawScheduleEnabled === 'true' || rawScheduleEnabled === '1') {
    if (enabled) {
      scheduleEnabled = true;
    } else {
      warnings.push('GCS_SNAPSHOT_SCHEDULE_ENABLED is set to true, but GCS snapshot archiving is disabled or unconfigured. Backup scheduling will remain disabled.');
      scheduleEnabled = false;
    }
  }

  // Retention Cleanup Configuration
  const rawRetentionCleanup = (process.env.GCS_SNAPSHOT_RETENTION_CLEANUP_ENABLED || '').toLowerCase().trim();
  let retentionCleanupEnabled = false;
  if (rawRetentionCleanup === 'true' || rawRetentionCleanup === '1') {
    if (enabled) {
      retentionCleanupEnabled = true;
    } else {
      warnings.push('GCS_SNAPSHOT_RETENTION_CLEANUP_ENABLED is set to true, but GCS snapshot archiving is disabled or unconfigured. Retention cleanup will remain disabled.');
      retentionCleanupEnabled = false;
    }
  }

  const rawMinKeep = (process.env.GCS_SNAPSHOT_MIN_KEEP_COUNT || '').trim();
  let minKeepCount = 5; // Protect at least 5 latest snapshots
  if (rawMinKeep) {
    const parsedMinKeep = parseInt(rawMinKeep, 10);
    if (!isNaN(parsedMinKeep) && parsedMinKeep >= 0) {
      minKeepCount = parsedMinKeep;
    }
  }

  return {
    bucketName,
    enabled,
    retentionDays,
    isGcsConfigured,
    warnings,
    scheduleEnabled,
    scheduleIntervalHours,
    retentionCleanupEnabled,
    minKeepCount,
  };
}
