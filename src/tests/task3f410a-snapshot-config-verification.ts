/**
 * BURRA PARIKSHA CMS - Verification Test Suite
 * Task 3F.4.10A: Durable Snapshot Archive Configuration Foundation
 */

import { getSnapshotArchiveConfig, validateBucketName } from '../config/snapshot.config';

export async function runSnapshotConfigVerification(): Promise<boolean> {
  console.log('======================================================================');
  console.log('TASK 3F.4.10A — DURABLE SNAPSHOT ARCHIVE CONFIGURATION VERIFICATION');
  console.log('======================================================================');

  let passed = true;

  // Preserve initial environment
  const origBucket = process.env.GCS_SNAPSHOT_BUCKET;
  const origEnabled = process.env.GCS_SNAPSHOT_ENABLED;
  const origRetention = process.env.GCS_SNAPSHOT_RETENTION_DAYS;

  try {
    // ----------------------------------------------------------------------
    // TEST 1: Bucket Name Validation Pattern
    // ----------------------------------------------------------------------
    console.log('\n--- 1. BUCKET NAME VALIDATION RULES ---');
    
    const validBuckets = [
      'my-snapshot-bucket',
      'burra-pariksha-prod-snapshots',
      'cms.backup.2026',
      'bucket-123',
    ];

    const invalidBuckets = [
      '',
      'ab', // too short (< 3)
      'MyBucket', // uppercase
      'bucket_with_INVALID_caps',
      '-start-with-hyphen',
      'end-with-hyphen-',
      'space in bucket',
      'a'.repeat(64), // too long (> 63)
    ];

    for (const b of validBuckets) {
      const isValid = validateBucketName(b);
      if (!isValid) {
        console.error(`❌ Expected "${b}" to be valid, got false`);
        passed = false;
      }
    }

    for (const b of invalidBuckets) {
      const isValid = validateBucketName(b);
      if (isValid) {
        console.error(`❌ Expected "${b}" to be invalid, got true`);
        passed = false;
      }
    }

    if (passed) {
      console.log('✅ Bucket name validation rules operate correctly.');
    }

    // ----------------------------------------------------------------------
    // TEST 2: Default Unconfigured State (Local Dev Compatibility)
    // ----------------------------------------------------------------------
    console.log('\n--- 2. DEFAULT UNCONFIGURED STATE (LOCAL DEV) ---');
    delete process.env.GCS_SNAPSHOT_BUCKET;
    delete process.env.GCS_SNAPSHOT_ENABLED;
    delete process.env.GCS_SNAPSHOT_RETENTION_DAYS;

    const defaultConfig = getSnapshotArchiveConfig();
    if (defaultConfig.enabled !== false) {
      console.error(`❌ Expected enabled=false by default, got ${defaultConfig.enabled}`);
      passed = false;
    }
    if (defaultConfig.isGcsConfigured !== false) {
      console.error(`❌ Expected isGcsConfigured=false by default, got ${defaultConfig.isGcsConfigured}`);
      passed = false;
    }
    if (defaultConfig.retentionDays !== 365) {
      console.error(`❌ Expected retentionDays=365 by default, got ${defaultConfig.retentionDays}`);
      passed = false;
    }
    console.log(`✅ Default unconfigured state verified: enabled=${defaultConfig.enabled}, retention=${defaultConfig.retentionDays} days.`);

    // ----------------------------------------------------------------------
    // TEST 3: Valid Production Configuration Parsing
    // ----------------------------------------------------------------------
    console.log('\n--- 3. VALID PRODUCTION CONFIGURATION PARSING ---');
    process.env.GCS_SNAPSHOT_BUCKET = 'burra-pariksha-prod-snapshots';
    process.env.GCS_SNAPSHOT_ENABLED = 'true';
    process.env.GCS_SNAPSHOT_RETENTION_DAYS = '180';

    const prodConfig = getSnapshotArchiveConfig();
    if (prodConfig.enabled !== true) {
      console.error(`❌ Expected enabled=true for valid prod config, got ${prodConfig.enabled}`);
      passed = false;
    }
    if (prodConfig.bucketName !== 'burra-pariksha-prod-snapshots') {
      console.error(`❌ Expected bucketName="burra-pariksha-prod-snapshots", got "${prodConfig.bucketName}"`);
      passed = false;
    }
    if (prodConfig.retentionDays !== 180) {
      console.error(`❌ Expected retentionDays=180, got ${prodConfig.retentionDays}`);
      passed = false;
    }
    console.log(`✅ Valid production configuration parsed cleanly: bucket="${prodConfig.bucketName}", retention=${prodConfig.retentionDays}d, enabled=${prodConfig.enabled}.`);

    // ----------------------------------------------------------------------
    // TEST 4: Invalid Retention Days Fallback & Warnings
    // ----------------------------------------------------------------------
    console.log('\n--- 4. INVALID RETENTION DAYS FALLBACK & WARNINGS ---');
    process.env.GCS_SNAPSHOT_RETENTION_DAYS = 'invalid-number';

    const fallbackRetentionConfig = getSnapshotArchiveConfig();
    if (fallbackRetentionConfig.retentionDays !== 365) {
      console.error(`❌ Expected fallback retentionDays=365 for invalid string, got ${fallbackRetentionConfig.retentionDays}`);
      passed = false;
    }
    if (fallbackRetentionConfig.warnings.length === 0) {
      console.error('❌ Expected warning for invalid retention days, got none');
      passed = false;
    }
    console.log(`✅ Invalid retention days safely handled with fallback: retention=${fallbackRetentionConfig.retentionDays}d, warning="${fallbackRetentionConfig.warnings[0]}".`);

    // ----------------------------------------------------------------------
    // TEST 5: Enabled with Invalid Bucket (Fail-Safe Behavior)
    // ----------------------------------------------------------------------
    console.log('\n--- 5. ENABLED WITH INVALID BUCKET (FAIL-SAFE BEHAVIOR) ---');
    process.env.GCS_SNAPSHOT_BUCKET = 'INVALID_UPPERCASE_BUCKET!';
    process.env.GCS_SNAPSHOT_ENABLED = 'true';

    const failSafeConfig = getSnapshotArchiveConfig();
    if (failSafeConfig.enabled !== false) {
      console.error(`❌ Expected enabled=false when bucket is invalid, got ${failSafeConfig.enabled}`);
      passed = false;
    }
    if (failSafeConfig.isGcsConfigured !== false) {
      console.error(`❌ Expected isGcsConfigured=false when bucket is invalid, got ${failSafeConfig.isGcsConfigured}`);
      passed = false;
    }
    console.log(`✅ Fail-safe configuration verified: enabled defaulted to false due to invalid bucket name.`);

  } finally {
    // Restore initial environment
    if (origBucket !== undefined) process.env.GCS_SNAPSHOT_BUCKET = origBucket;
    else delete process.env.GCS_SNAPSHOT_BUCKET;

    if (origEnabled !== undefined) process.env.GCS_SNAPSHOT_ENABLED = origEnabled;
    else delete process.env.GCS_SNAPSHOT_ENABLED;

    if (origRetention !== undefined) process.env.GCS_SNAPSHOT_RETENTION_DAYS = origRetention;
    else delete process.env.GCS_SNAPSHOT_RETENTION_DAYS;
  }

  console.log('======================================================================');
  if (passed) {
    console.log('TASK 3F.4.10A CONFIGURATION VERIFICATION RESULT: PASS');
  } else {
    console.log('TASK 3F.4.10A CONFIGURATION VERIFICATION RESULT: FAIL');
  }
  console.log('======================================================================');

  return passed;
}

// Execute standalone if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runSnapshotConfigVerification().then((success) => {
    process.exit(success ? 0 : 1);
  });
}
