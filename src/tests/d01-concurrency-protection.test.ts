/**
 * BURRA PARIKSHA CMS - D-01 Concurrency Protection Verification Tests
 * 
 * Verifies that BaseRepository.withRecordLock:
 * TEST 1 — SERIALIZATION: Serializes concurrent updates to the same record in FIFO order.
 * TEST 2 — INDEPENDENT RECORDS: Allows concurrent updates to different records to run in parallel.
 * TEST 3 — ERROR RELEASE: Releases lock upon operation failure, allowing subsequent operations to proceed.
 * TEST 4 — MEMORY CLEANUP: Guarantees zero lock bookkeeping memory leak (registry size returns to 0).
 */

import assert from 'node:assert';
import { BaseRepository } from '../lib/repositories/base.repository';
import { SheetSchemaContract } from '../lib/schemas/google-sheets-schema';

interface TestRecord {
  id: string;
  fieldA: string;
  fieldB: string;
  counter: number;
}

const TEST_SCHEMA: SheetSchemaContract = {
  sheetName: 'TEST_CONCURRENCY_ENTITY' as any,
  purpose: 'Testing D-01 record-level serialization',
  primaryKey: 'id',
  columns: [
    { name: 'id', propertyKey: 'id', type: 'string', required: true, isPrimaryKey: true },
    { name: 'fieldA', propertyKey: 'fieldA', type: 'string', required: false },
    { name: 'fieldB', propertyKey: 'fieldB', type: 'string', required: false },
    { name: 'counter', propertyKey: 'counter', type: 'number', required: false },
  ],
};

class MockConcurrencyRepository extends BaseRepository<TestRecord> {
  public inFlightMap: Map<string, number> = new Map();
  public maxInFlightPerRecord: Map<string, number> = new Map();
  public globalInFlight = 0;
  public maxGlobalInFlight = 0;
  public executionLog: string[] = [];

  // In-memory backing store for mock Google Sheets rows
  public mockRows: (string | number | boolean)[][] = [];

  constructor() {
    super(TEST_SCHEMA);

    const mockClient = {
      isConfigured: () => true,
      getSpreadsheetId: () => 'MOCK_SHEET_ID',
      isTestMode: () => false,
      invalidateRowCache: () => {},
      assertWriteAllowed: () => {},
      getHeaders: async () => ['id', 'fieldA', 'fieldB', 'counter'],
      getRows: async (_sheetName: string, _endCol: string, _overrideId?: string) => {
        return {
          headers: ['id', 'fieldA', 'fieldB', 'counter'],
          rows: this.mockRows.map(r => [...r]),
        };
      },
      updateRow: async (
        _sheetName: string,
        rowIndex: number,
        rowValues: (string | number | boolean)[]
      ) => {
        const id = String(rowValues[0]);
        const currentForId = (this.inFlightMap.get(id) || 0) + 1;
        this.inFlightMap.set(id, currentForId);
        this.maxInFlightPerRecord.set(id, Math.max(currentForId, this.maxInFlightPerRecord.get(id) || 0));

        this.globalInFlight++;
        this.maxGlobalInFlight = Math.max(this.globalInFlight, this.maxGlobalInFlight);
        this.executionLog.push(`WRITE_START:${id}`);

        // Simulate async I/O latency to stress test concurrency
        await new Promise(r => setTimeout(r, 40));
        this.mockRows[rowIndex - 2] = [...rowValues];

        this.executionLog.push(`WRITE_FINISH:${id}`);
        this.inFlightMap.set(id, (this.inFlightMap.get(id) || 1) - 1);
        this.globalInFlight--;
      },
    };

    this.client = mockClient as any;
  }

  public seedMockRecord(rec: TestRecord) {
    this.mockRows.push([rec.id, rec.fieldA, rec.fieldB, rec.counter]);
  }
}

export async function runD01ConcurrencyTests(): Promise<{ passed: number; failed: number }> {
  console.log('======================================================');
  console.log('🚀 RUNNING D-01: CONCURRENCY PROTECTION TESTS');
  console.log('======================================================\n');
  let passed = 0;
  let failed = 0;

  // -------------------------------------------------------------------------
  // TEST 1 — SERIALIZATION OF CONCURRENT UPDATES TARGETING THE SAME RECORD
  // -------------------------------------------------------------------------
  try {
    console.log('Running Test 1: Serialization of concurrent updates to the same record...');
    const repo = new MockConcurrencyRepository();
    repo.seedMockRecord({ id: 'REC-001', fieldA: 'InitialA', fieldB: 'InitialB', counter: 0 });

    // Launch two simultaneous updates targeting REC-001
    // Update A modifies fieldA
    // Update B modifies fieldB
    const promiseA = repo.updateRecord('REC-001', { fieldA: 'UpdatedByA' });
    const promiseB = repo.updateRecord('REC-001', { fieldB: 'UpdatedByB' });

    const [resA, resB] = await Promise.all([promiseA, promiseB]);

    // Check 1: Max in-flight critical-section operations for REC-001 was strictly 1
    const maxInFlightForRec1 = repo.maxInFlightPerRecord.get('REC-001');
    assert.strictEqual(maxInFlightForRec1, 1, 'Concurrent operations on REC-001 must be strictly serialized (max in-flight = 1)');

    // Check 2: Final state contains BOTH updates (no lost update!)
    // The second operation must have read the first operation's changes and preserved them
    assert.strictEqual(resA?.fieldA, 'UpdatedByA', 'Operation A must succeed');
    assert.strictEqual(resB?.fieldB, 'UpdatedByB', 'Operation B must succeed');
    assert.strictEqual(resB?.fieldA, 'UpdatedByA', 'Operation B must NOT overwrite Operation A (Lost-update prevented)');

    // Check 3: The underlying row store contains both fields updated
    const finalRow = repo.mockRows[0];
    assert.strictEqual(finalRow[1], 'UpdatedByA', 'Row in datastore must retain fieldA from Operation A');
    assert.strictEqual(finalRow[2], 'UpdatedByB', 'Row in datastore must retain fieldB from Operation B');

    console.log('✅ PASS: Test 1 — Concurrent updates to same record were serialized without lost updates.\n');
    passed++;
  } catch (err: any) {
    console.error('❌ FAIL: Test 1 — Serialization test failed:', err?.message || err);
    failed++;
  }

  // -------------------------------------------------------------------------
  // TEST 2 — INDEPENDENT RECORDS RUN CONCURRENTLY WITHOUT BLOCKING
  // -------------------------------------------------------------------------
  try {
    console.log('Running Test 2: Independent records execute concurrently...');
    const repo = new MockConcurrencyRepository();
    repo.seedMockRecord({ id: 'REC-ALPHA', fieldA: 'Alpha', fieldB: '0', counter: 1 });
    repo.seedMockRecord({ id: 'REC-BETA', fieldA: 'Beta', fieldB: '0', counter: 2 });

    // Launch updates to two different records at the exact same moment
    const promiseAlpha = repo.updateRecord('REC-ALPHA', { fieldB: 'AlphaModified' });
    const promiseBeta = repo.updateRecord('REC-BETA', { fieldB: 'BetaModified' });

    await Promise.all([promiseAlpha, promiseBeta]);

    // Check 1: Each individual record was limited to 1 in-flight
    assert.strictEqual(repo.maxInFlightPerRecord.get('REC-ALPHA'), 1, 'REC-ALPHA in-flight was 1');
    assert.strictEqual(repo.maxInFlightPerRecord.get('REC-BETA'), 1, 'REC-BETA in-flight was 1');

    // Check 2: Both ran in parallel (global concurrent in-flight reached 2)
    assert.strictEqual(repo.maxGlobalInFlight, 2, 'Independent records must execute concurrently in parallel (global in-flight = 2)');

    console.log('✅ PASS: Test 2 — Unrelated records executed in parallel without unnecessary serialization.\n');
    passed++;
  } catch (err: any) {
    console.error('❌ FAIL: Test 2 — Independent records test failed:', err?.message || err);
    failed++;
  }

  // -------------------------------------------------------------------------
  // TEST 3 — ERROR RELEASE: Lock is released when an operation fails
  // -------------------------------------------------------------------------
  try {
    console.log('Running Test 3: Lock is released when an operation fails...');
    const repo = new MockConcurrencyRepository();
    repo.seedMockRecord({ id: 'REC-FAIL', fieldA: 'Stable', fieldB: 'Clean', counter: 10 });

    // Temporarily inject an error into updateRow
    let shouldFail = true;
    const clientAny = (repo as any).client;
    const originalUpdateRow = clientAny.updateRow;
    clientAny.updateRow = async (sheet: string, rowIdx: number, vals: any[]) => {
      if (shouldFail) {
        throw new Error('Simulated Google Sheets Network Write Error');
      }
      return originalUpdateRow(sheet, rowIdx, vals);
    };

    // First operation throws
    let firstOpFailed = false;
    try {
      await repo.updateRecord('REC-FAIL', { fieldA: 'WillFail' });
    } catch (err: any) {
      firstOpFailed = true;
      assert.strictEqual(err.message, 'Simulated Google Sheets Network Write Error');
    }
    assert.strictEqual(firstOpFailed, true, 'First operation must throw the simulated error');

    // Stop failing
    shouldFail = false;

    // Second operation on the exact same record must proceed and NOT be blocked or hang
    const resSecond = await repo.updateRecord('REC-FAIL', { fieldA: 'RecoveredAfterError' });
    assert.strictEqual(resSecond?.fieldA, 'RecoveredAfterError', 'Second operation on same record must succeed after first fails');

    console.log('✅ PASS: Test 3 — Lock released cleanly after exception; subsequent operation succeeded.\n');
    passed++;
  } catch (err: any) {
    console.error('❌ FAIL: Test 3 — Error release test failed:', err?.message || err);
    failed++;
  }

  // -------------------------------------------------------------------------
  // TEST 4 — MEMORY LEAK PREVENTION: Lock registry size returns to 0
  // -------------------------------------------------------------------------
  try {
    console.log('Running Test 4: Memory leak prevention (lock registry cleanup)...');
    const repo = new MockConcurrencyRepository();
    repo.seedMockRecord({ id: 'REC-CLEAN-1', fieldA: '1', fieldB: '1', counter: 1 });
    repo.seedMockRecord({ id: 'REC-CLEAN-2', fieldA: '2', fieldB: '2', counter: 2 });
    repo.seedMockRecord({ id: 'REC-CLEAN-3', fieldA: '3', fieldB: '3', counter: 3 });

    // Execute multiple parallel and sequential updates
    await Promise.all([
      repo.updateRecord('REC-CLEAN-1', { counter: 10 }),
      repo.updateRecord('REC-CLEAN-1', { counter: 11 }),
      repo.updateRecord('REC-CLEAN-2', { counter: 20 }),
      repo.updateRecord('REC-CLEAN-3', { counter: 30 }),
    ]);

    // Check active lock count in BaseRepository static map
    const activeLocks = BaseRepository.getActiveLockCount();
    assert.strictEqual(activeLocks, 0, `All lock entries must be cleaned up from the registry after completion. Found: ${activeLocks}`);

    console.log('✅ PASS: Test 4 — All lock registry entries were cleanly evicted (size = 0, zero memory leak).\n');
    passed++;
  } catch (err: any) {
    console.error('❌ FAIL: Test 4 — Memory leak test failed:', err?.message || err);
    failed++;
  }

  console.log('======================================================');
  console.log(`📊 D-01 CONCURRENCY TEST SUMMARY: ${passed}/${passed + failed} PASSED`);
  console.log('======================================================\n');

  return { passed, failed };
}

// Auto-run if executed directly via tsx
if (import.meta.url === `file://${process.argv[1]}`) {
  runD01ConcurrencyTests()
    .then(({ failed }) => {
      process.exit(failed > 0 ? 1 : 0);
    })
    .catch((err) => {
      console.error('Unexpected runner error:', err);
      process.exit(1);
    });
}
