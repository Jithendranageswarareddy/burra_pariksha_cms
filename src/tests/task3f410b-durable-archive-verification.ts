/**
 * BURRA PARIKSHA CMS - Verification Test Suite
 * Task 3F.4.10B: Durable Snapshot Archive Service Verification
 */

import { DurableSnapshotArchiveService } from '../lib/services/durable-snapshot-archive.service';
import { GoogleSheetsSnapshot } from '../lib/services/snapshot-exporter.service';

export async function runDurableArchiveVerification(): Promise<boolean> {
  console.log('======================================================================');
  console.log('TASK 3F.4.10B — DURABLE SNAPSHOT ARCHIVE SERVICE VERIFICATION');
  console.log('======================================================================');

  let passed = true;
  const service = DurableSnapshotArchiveService.getInstance();

  // Create clean isolated test snapshot payload
  const sampleSnapshot: GoogleSheetsSnapshot = {
    metadata: {
      exportTimestamp: '2026-09-01T07:15:00.000Z',
      spreadsheetTitle: 'Burra Pariksha CMS Test DB',
      spreadsheetIdMasked: '1Bx...9aX',
      totalWorksheets: 2,
      totalRows: 15,
      generator: 'SnapshotExporterService',
    },
    worksheets: {
      'Questions': {
        sheetName: 'Questions',
        headers: ['id', 'statement', 'difficulty'],
        rows: [
          ['BP-Q-0001', 'Calculate the relative velocity...', 'EASY'],
          ['BP-Q-0002', 'Solve speed-time-distance formulas...', 'MEDIUM'],
        ],
        rowCount: 2,
      },
      'Videos': {
        sheetName: 'Videos',
        headers: ['id', 'title', 'status'],
        rows: [
          ['BP-V-0001', 'Shorts: Relative Speed Trick', 'SCRIPT_READY'],
        ],
        rowCount: 1,
      },
    },
    sequences: [
      { entity: 'QUESTION', prefix: 'BP-Q-', nextNumber: 10003 },
      { entity: 'VIDEO', prefix: 'BP-V-', nextNumber: 10002 },
    ],
    checksum: '', // Will calculate deterministically
  };

  // Add the canonical checksum to the snapshot to make it valid
  const canonical = service.canonicalizeSnapshot(sampleSnapshot);
  const crypto = await import('crypto');
  const initialChecksum = crypto.createHash('sha256').update(canonical).digest('hex');
  sampleSnapshot.checksum = initialChecksum;

  try {
    // ----------------------------------------------------------------------
    // TEST 1: Disabled Mode Safety (Zero GCS API Interaction)
    // ----------------------------------------------------------------------
    console.log('\n--- 1. DISABLED GCS ARCHIVE MODE ---');
    service.injectTestContext({
      bucketName: '',
      enabled: false,
      retentionDays: 365,
      isGcsConfigured: false,
      warnings: [],
    });

    try {
      await service.archiveSnapshot(sampleSnapshot);
      console.error('❌ Expected archiveSnapshot to fail when disabled, but it succeeded.');
      passed = false;
    } catch (err: any) {
      console.log(`✅ Disabled mode blocked archive: "${err.message}"`);
    }

    try {
      await service.retrieveSnapshot('snapshots/2026/09/dummy.json');
      console.error('❌ Expected retrieveSnapshot to fail when disabled, but it succeeded.');
      passed = false;
    } catch (err: any) {
      console.log(`✅ Disabled mode blocked retrieve: "${err.message}"`);
    }

    // ----------------------------------------------------------------------
    // TEST 2: Deterministic Naming & Metadata Generation
    // ----------------------------------------------------------------------
    console.log('\n--- 2. DETERMINISTIC OBJECT NAMING & METADATA ---');
    const { dataPath, metaPath, snapshotId } = service.formatObjectPath('2026-09-01T07:15:00.000Z', 'ABC123XYZ789');
    
    const expectedDataPath = 'snapshots/2026/09/SNAP-20260901-071500-ABC123XY.json';
    const expectedMetaPath = 'snapshots/2026/09/SNAP-20260901-071500-ABC123XY.meta.json';
    const expectedId = 'SNAP-20260901-071500-ABC123XY';

    if (dataPath !== expectedDataPath) {
      console.error(`❌ Data path mismatch. Got "${dataPath}", expected "${expectedDataPath}"`);
      passed = false;
    }
    if (metaPath !== expectedMetaPath) {
      console.error(`❌ Meta path mismatch. Got "${metaPath}", expected "${expectedMetaPath}"`);
      passed = false;
    }
    if (snapshotId !== expectedId) {
      console.error(`❌ Snapshot ID mismatch. Got "${snapshotId}", expected "${expectedId}"`);
      passed = false;
    }
    if (passed) {
      console.log('✅ Deterministic naming & directory routing verified successfully.');
    }

    // ----------------------------------------------------------------------
    // TEST 3: Secret Detection & Rejection Guard
    // ----------------------------------------------------------------------
    console.log('\n--- 3. SECURITY SENSITIVE KEY / CREDENTIAL FILTER ---');
    const badSnapshot: GoogleSheetsSnapshot = JSON.parse(JSON.stringify(sampleSnapshot));
    // Embed a fake private key in sheet data
    badSnapshot.worksheets['Questions'].rows.push(['BP-Q-0003', '-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBg...', 'HARD']);
    
    try {
      await service.canonicalizeSnapshot(badSnapshot); // canonicalize does not throw
      const badCanonical = service.canonicalizeSnapshot(badSnapshot);
      service.validateNoSecrets(badCanonical);
      console.error('❌ Expected validation to block private key string, but it passed.');
      passed = false;
    } catch (err: any) {
      console.log(`✅ Secret filter successfully blocked private key: "${err.message}"`);
    }

    // Embed an active env key match
    const backupApiKey = process.env.GEMINI_API_KEY;
    try {
      process.env.GEMINI_API_KEY = 'AIzaSyFakeKeyWithHighEntropyPatternForTest_';
      const badSnapshotEnv: GoogleSheetsSnapshot = JSON.parse(JSON.stringify(sampleSnapshot));
      badSnapshotEnv.worksheets['Questions'].rows.push(['BP-Q-0004', 'API Key value AIzaSyFakeKeyWithHighEntropyPatternForTest_', 'EASY']);
      
      const envCanonical = service.canonicalizeSnapshot(badSnapshotEnv);
      service.validateNoSecrets(envCanonical);
      console.error('❌ Expected validation to block env API key, but it passed.');
      passed = false;
    } catch (err: any) {
      console.log(`✅ Secret filter successfully blocked exact GEMINI_API_KEY value: "${err.message}"`);
    } finally {
      process.env.GEMINI_API_KEY = backupApiKey;
    }

    // ----------------------------------------------------------------------
    // TEST 4: Immutable Duplicate & Overwrite Protection
    // ----------------------------------------------------------------------
    console.log('\n--- 4. DUPLICATE & OVERWRITE PROTECTION (IMMUTABILITY) ---');
    service.injectTestContext({
      bucketName: 'mock-test-bucket',
      enabled: true,
      retentionDays: 365,
      isGcsConfigured: true,
      warnings: [],
    });

    // Archive the snapshot first time (should succeed)
    const manifest = await service.archiveSnapshot(sampleSnapshot);
    console.log(`✅ Primary snapshot and manifest archived: id=${manifest.id}`);

    // Try archiving again to duplicate path (should reject)
    try {
      await service.archiveSnapshot(sampleSnapshot);
      console.error('❌ Expected duplicate snapshot upload to fail, but it overwritten the existing object.');
      passed = false;
    } catch (err: any) {
      console.log(`✅ Double write blocked cleanly to protect immutability: "${err.message}"`);
    }

    // ----------------------------------------------------------------------
    // TEST 5: Retrieval & Integrity Checksum Validation
    // ----------------------------------------------------------------------
    console.log('\n--- 5. RETRIEVAL & INTEGRITY SHA-256 CHECK ---');
    const { dataPath: uploadDataPath } = service.formatObjectPath(sampleSnapshot.metadata.exportTimestamp, sampleSnapshot.checksum);
    
    // Valid retrieval
    const retrieved = await service.retrieveSnapshot(uploadDataPath);
    if (retrieved.checksum !== sampleSnapshot.checksum) {
      console.error('❌ Retrieved checksum mismatch.');
      passed = false;
    } else {
      console.log(`✅ Verified retrieved snapshot SHA-256: ${retrieved.checksum}`);
    }

    // Corrupted retrieval (manually change data in retrieved but use same checksum)
    const malformedPayload: GoogleSheetsSnapshot = JSON.parse(JSON.stringify(sampleSnapshot));
    malformedPayload.worksheets['Questions'].rows[0][1] = 'TAMPERED / CORRUPTED DATA!';
    // Try to retrieve manually injected tampered data
    const tamperedService = DurableSnapshotArchiveService.getInstance();
    // Inject custom tampered state directly to mock bucket bypass write validation
    const serializedTampered = JSON.stringify(malformedPayload);
    (tamperedService as any).mockBucket.set(uploadDataPath, serializedTampered);

    try {
      await tamperedService.retrieveSnapshot(uploadDataPath);
      console.error('❌ Expected tampered data to fail SHA-256 integrity check, but retrieveSnapshot succeeded.');
      passed = false;
    } catch (err: any) {
      console.log(`✅ Integrity engine successfully blocked corrupted snapshot download: "${err.message}"`);
    }

    // ----------------------------------------------------------------------
    // TEST 6: Transient Retry Mock Execution
    // ----------------------------------------------------------------------
    console.log('\n--- 6. TRANSIENT FAILURE AND RETRY GATES ---');
    let apiCallCount = 0;
    
    const mockStorageWithTransientError = {
      objects: {
        get: async () => {
          apiCallCount++;
          if (apiCallCount < 3) {
            // Simulate GCS standard transient error
            const err: any = new Error('Service Unavailable');
            err.status = 503;
            err.response = { status: 503 };
            throw err;
          }
          return { data: sampleSnapshot };
        }
      }
    };

    // Inject transient-error client with enabled GCS
    service.injectTestContext({
      bucketName: 'real-bucket-name',
      enabled: true,
      retentionDays: 365,
      isGcsConfigured: true,
      warnings: [],
    }, mockStorageWithTransientError);

    // Patch process env to allow client instantiation check in retrieve
    const oldSA = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const oldKey = process.env.GOOGLE_PRIVATE_KEY;
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = 'fake@gserviceaccount.com';
    process.env.GOOGLE_PRIVATE_KEY = '-----BEGIN PRIVATE KEY-----\nfake\n-----END PRIVATE KEY-----';

    try {
      // Shorten retry timeout dynamically for rapid verification unit testing
      const startMs = Date.now();
      const retrievedWithRetry = await service.retrieveSnapshot(uploadDataPath);
      const duration = Date.now() - startMs;
      
      if (retrievedWithRetry.checksum !== sampleSnapshot.checksum) {
        console.error('❌ Failed checksum validation on retried retrieve.');
        passed = false;
      }
      console.log(`✅ Retry mechanism completed successfully with ${apiCallCount} calls in ${duration}ms. Backoff worked.`);
    } catch (err: any) {
      console.error('❌ Expected transient retries to succeed on attempt 3, but operation threw:', err);
      passed = false;
    } finally {
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = oldSA;
      process.env.GOOGLE_PRIVATE_KEY = oldKey;
    }

  } finally {
    // Reset back to system config defaults
    service.resetContext();
  }

  console.log('======================================================================');
  if (passed) {
    console.log('TASK 3F.4.10B DURABLE ARCHIVE SERVICE VERIFICATION RESULT: PASS');
  } else {
    console.log('TASK 3F.4.10B DURABLE ARCHIVE SERVICE VERIFICATION RESULT: FAIL');
  }
  console.log('======================================================================');

  return passed;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runDurableArchiveVerification().then((success) => {
    process.exit(success ? 0 : 1);
  });
}
