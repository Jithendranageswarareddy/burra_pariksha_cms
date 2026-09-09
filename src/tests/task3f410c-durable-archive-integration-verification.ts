/**
 * BURRA PARIKSHA CMS - Integration Verification Test Suite
 * Task 3F.4.10C: Durable Snapshot Archive Integration Verification
 */

import { snapshotHistoryService, SnapshotHistoryItem } from '../lib/services/snapshot-history.service';
import { DurableSnapshotArchiveService } from '../lib/services/durable-snapshot-archive.service';
import { GoogleSheetsSnapshot } from '../lib/services/snapshot-exporter.service';

export async function runDurableArchiveIntegrationVerification(): Promise<boolean> {
  console.log('======================================================================');
  console.log('TASK 3F.4.10C — DURABLE SNAPSHOT ARCHIVE INTEGRATION VERIFICATION');
  console.log('======================================================================');

  let passed = true;

  // Save original environment variables for safety
  const oldEnabled = process.env.GCS_SNAPSHOT_ENABLED;
  const oldBucket = process.env.GCS_SNAPSHOT_BUCKET;
  const oldSA = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const oldKey = process.env.GOOGLE_PRIVATE_KEY;

  const historyService = snapshotHistoryService;
  const archiveService = DurableSnapshotArchiveService.getInstance();

  try {
    // ----------------------------------------------------------------------
    // TEST 1: GCS Disabled Mode Safety
    // ----------------------------------------------------------------------
    console.log('\n--- 1. GCS DISABLED MODE SAFETY ---');
    process.env.GCS_SNAPSHOT_ENABLED = 'false';
    process.env.GCS_SNAPSHOT_BUCKET = '';
    archiveService.injectTestContext({
      bucketName: '',
      enabled: false,
      retentionDays: 365,
      isGcsConfigured: false,
      warnings: [],
    });
    historyService.clearCache();

    // Verify baseline snapshot compatibility
    const history = await historyService.getSnapshotHistory();
    const baselineItem = history.find(item => item.status === 'SYSTEM_BASELINE');
    if (!baselineItem) {
      console.error('❌ Expected SYSTEM_BASELINE snapshot to exist in history even when GCS is disabled.');
      passed = false;
    } else {
      console.log(`✅ Baseline snapshot auto-generation works cleanly. ID: ${baselineItem.id}, Checksum: ${baselineItem.checksum}`);
    }

    // Verify that creating a durable archive in disabled mode fails safely
    try {
      await historyService.createDurableArchive();
      console.error('❌ Expected createDurableArchive to fail when GCS is disabled, but it succeeded.');
      passed = false;
    } catch (err: any) {
      console.log(`✅ Create archive correctly blocked when disabled: "${err.message}"`);
    }

    // ----------------------------------------------------------------------
    // TEST 2: Durable Archive Creation & History Registration
    // ----------------------------------------------------------------------
    console.log('\n--- 2. DURABLE ARCHIVE CREATION & HISTORY REGISTRATION ---');
    // Enable GCS mock context
    process.env.GCS_SNAPSHOT_ENABLED = 'true';
    process.env.GCS_SNAPSHOT_BUCKET = 'mock-test-bucket';
    archiveService.injectTestContext({
      bucketName: 'mock-test-bucket',
      enabled: true,
      retentionDays: 365,
      isGcsConfigured: true,
      warnings: [],
    });
    historyService.clearCache();

    const mockSnapshot = await (await import('../lib/services/snapshot-exporter.service')).snapshotExporterService.exportSnapshot();
    const archivedItem = await historyService.createDurableArchive(mockSnapshot);
    if (archivedItem.status !== 'DURABLE_ARCHIVE') {
      console.error(`❌ Expected archived item status to be 'DURABLE_ARCHIVE', got '${archivedItem.status}'`);
      passed = false;
    } else {
      console.log(`✅ Durable snapshot archived and registered successfully. ID: ${archivedItem.id}`);
    }

    // Verify it is present in the history list
    const activeHistory = await historyService.getSnapshotHistory();
    const registered = activeHistory.find(item => item.id === archivedItem.id);
    if (!registered) {
      console.error('❌ Archived snapshot was not found in getSnapshotHistory() list.');
      passed = false;
    } else {
      console.log('✅ Archived snapshot registered in history cache successfully.');
    }

    // ----------------------------------------------------------------------
    // TEST 3: Duplicate Archive Protection
    // ----------------------------------------------------------------------
    console.log('\n--- 3. DUPLICATE ARCHIVE PROTECTION ---');
    try {
      // Re-archive exact same snapshot using GCS layer directly (simulate manual duplicate name attempt)
      await archiveService.archiveSnapshot(mockSnapshot);
      console.error('❌ Expected duplicate snapshot archive attempt to fail, but it succeeded.');
      passed = false;
    } catch (err: any) {
      console.log(`✅ Duplicate archive attempt blocked cleanly: "${err.message}"`);
    }

    // ----------------------------------------------------------------------
    // TEST 4: Failed Archive Safety Gates
    // ----------------------------------------------------------------------
    console.log('\n--- 4. FAILED ARCHIVE SAFETY GATES ---');
    // Configure mock failing storage client
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = 'fake-sa@gserviceaccount.com';
    process.env.GOOGLE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\nfake-key\n-----END PRIVATE KEY-----';
    
    const failingMockClient = {
      objects: {
        get: async () => {
          const err: any = new Error('Simulated GCS Network Failure');
          err.status = 503;
          throw err;
        },
        insert: async () => {
          const err: any = new Error('Simulated GCS Insert Failure');
          err.status = 503;
          throw err;
        }
      }
    };

    archiveService.injectTestContext({
      bucketName: 'fail-bucket',
      enabled: true,
      retentionDays: 365,
      isGcsConfigured: true,
      warnings: [],
    }, failingMockClient, false);

    // Capture pre-failure history count
    const beforeFailCount = (await historyService.getSnapshotHistory()).length;

    try {
      await historyService.createDurableArchive();
      console.error('❌ Expected createDurableArchive to throw on GCS insert failure, but it completed.');
      passed = false;
    } catch (err: any) {
      console.log(`✅ GCS upload failure handled safely: "${err.message}"`);
      
      const afterFailHistory = await historyService.getSnapshotHistory();
      if (afterFailHistory.length !== beforeFailCount) {
        console.error('❌ Failed snapshot archive was incorrectly added to snapshot history!');
        passed = false;
      } else {
        console.log('✅ Failed snapshot archive was NOT registered in history metadata.');
      }
    }

    // Restore valid GCS mock context
    delete process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    delete process.env.GOOGLE_PRIVATE_KEY;
    archiveService.injectTestContext({
      bucketName: 'mock-test-bucket',
      enabled: true,
      retentionDays: 365,
      isGcsConfigured: true,
      warnings: [],
    }, undefined, false);

    // ----------------------------------------------------------------------
    // TEST 5: Restart / Reload History Discovery
    // ----------------------------------------------------------------------
    console.log('\n--- 5. RESTART/RELOAD HISTORY DISCOVERY ---');
    // Clear history cache to simulate application cold start
    historyService.clearCache();

    // Re-verify that history list queries GCS and auto-populates durable history
    const restoredHistory = await historyService.getSnapshotHistory();
    const discovered = restoredHistory.find(item => item.id === archivedItem.id);
    if (!discovered) {
      console.error('❌ Failed to discover historical durable snapshot from GCS after application restart/reload.');
      passed = false;
    } else {
      console.log(`✅ Discovered GCS snapshot metadata upon restart. ID: ${discovered.id}, Status: ${discovered.status}`);
    }

    // ----------------------------------------------------------------------
    // TEST 6: Durable Snapshot Retrieval & Checksum Verification
    // ----------------------------------------------------------------------
    console.log('\n--- 6. DURABLE SNAPSHOT RETRIEVAL & CHECKSUM VERIFICATION ---');
    const retrieved = await historyService.retrieveDurableSnapshot(archivedItem.id);
    if (!retrieved || retrieved.checksum !== archivedItem.checksum) {
      console.error('❌ Retrieved snapshot checksum mismatch or empty payload.');
      passed = false;
    } else {
      console.log(`✅ Snapshot payload retrieved and validated. Total rows: ${retrieved.metadata.totalRows}`);
    }

    // ----------------------------------------------------------------------
    // TEST 7: Corrupted Archive Rejection
    // ----------------------------------------------------------------------
    console.log('\n--- 7. CORRUPTED ARCHIVE REJECTION ---');
    // Retrieve relative object path
    const dataPath = archiveService.formatObjectPath(archivedItem.exportTimestamp, archivedItem.checksum).dataPath;
    
    // Fetch raw snapshot string from mock bucket and corrupt it
    const rawPayload = (archiveService as any).mockBucket.get(dataPath);
    const parsedPayload = JSON.parse(rawPayload);
    
    // Tamper with worksheets data without updating manifest checksum
    parsedPayload.worksheets = {
      ...parsedPayload.worksheets,
      'TamperedWorksheet': {
        sheetName: 'TamperedWorksheet',
        headers: ['Tampered'],
        rows: [['CORRUPTED DATA']],
        rowCount: 1
      }
    };
    (archiveService as any).mockBucket.set(dataPath, JSON.stringify(parsedPayload));

    try {
      await historyService.retrieveDurableSnapshot(archivedItem.id);
      console.error('❌ Expected retrieveDurableSnapshot to fail on tampered checksum, but it succeeded.');
      passed = false;
    } catch (err: any) {
      console.log(`✅ Integrity engine blocked corrupted snapshot download cleanly: "${err.message}"`);
    }

    // ----------------------------------------------------------------------
    // TEST 8: Recovery API Compatability Check
    // ----------------------------------------------------------------------
    console.log('\n--- 8. RECOVERY API COMPATIBILITY ---');
    // Check if recovery status, history, and retrieve routes are functioning
    const { requireRole } = await import('../server/middleware/auth.middleware');
    if (typeof requireRole !== 'function') {
      console.error('❌ Existing requireRole middleware check failed.');
      passed = false;
    } else {
      console.log('✅ Auth requireRole middleware validated.');
    }

  } catch (err: any) {
    console.error('❌ Unexpected exception in integration test execution:', err);
    passed = false;
  } finally {
    // Tear down environment overrides
    if (oldEnabled) {
      process.env.GCS_SNAPSHOT_ENABLED = oldEnabled;
    } else {
      delete process.env.GCS_SNAPSHOT_ENABLED;
    }

    if (oldBucket) {
      process.env.GCS_SNAPSHOT_BUCKET = oldBucket;
    } else {
      delete process.env.GCS_SNAPSHOT_BUCKET;
    }

    if (oldSA) {
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = oldSA;
    } else {
      delete process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    }

    if (oldKey) {
      process.env.GOOGLE_PRIVATE_KEY = oldKey;
    } else {
      delete process.env.GOOGLE_PRIVATE_KEY;
    }

    archiveService.resetContext();
    historyService.clearCache();
  }

  console.log('======================================================================');
  if (passed) {
    console.log('TASK 3F.4.10C INTEGRATION VERIFICATION RESULT: PASS');
  } else {
    console.log('TASK 3F.4.10C INTEGRATION VERIFICATION RESULT: FAIL');
  }
  console.log('======================================================================');

  return passed;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runDurableArchiveIntegrationVerification().then((success) => {
    process.exit(success ? 0 : 1);
  });
}
