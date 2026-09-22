/**
 * BURRA PARIKSHA CMS - Deletion Safety Pipeline Automated Tests
 * 
 * Deterministic tests proving:
 * 1. Direct call to googleSheetsClient.deleteRow() without token is blocked.
 * 2. Direct call to googleSheetsClient.deleteRow() with fabricated/invalid token is blocked.
 * 3. Backup creation failure blocks deletion and leaves target record untouched.
 * 4. Backup verification failure blocks deletion and leaves target record untouched.
 * 5. Successful backup permits deletion, read-back verifies deletion, and integrity count updates.
 * 6. Deletion safety token cannot be reused (single-use protection).
 * 7. Deletion token fails if sheetName does not match.
 * 8. Configured Google Sheets mode passes token to client.deleteRow, performs read-back, and validates integrity.
 */

import assert from 'node:assert';
import {
  deletionSafetyService,
  DeletionBackupError,
  DeletionBackupVerificationError,
  DirectDeleteBypassError,
  VerifiedDeletionToken,
} from '../lib/services/deletion-safety.service';
import { googleSheetsClient } from '../lib/google-sheets/client';
import { BaseRepository } from '../lib/repositories/base.repository';

// Test concrete repository using fallback store
class TestEntityRepository extends BaseRepository<{ id: string; name: string }> {
  constructor(forceFallback = true) {
    super({
      sheetName: 'TEST_DELETION_ENTITY' as any,
      purpose: 'Unit testing deletion safety pipeline',
      primaryKey: 'id',
      columns: [
        { name: 'id', propertyKey: 'id', type: 'string', required: true, isPrimaryKey: true },
        { name: 'name', propertyKey: 'name', type: 'string', required: true },
      ],
    });
    if (forceFallback) {
      this.client = {
        ...googleSheetsClient,
        isConfigured: () => false,
        invalidateRowCache: () => {},
      } as any;
    }
  }
}

export async function runDeletionSafetyPipelineTests(): Promise<{ passed: number; failed: number }> {
  console.log('--- RUNNING DELETION SAFETY PIPELINE TEST SUITE ---');
  let passed = 0;
  let failed = 0;

  function resetEnvironment() {
    deletionSafetyService.resetSimulationHooks();
    const repo = new TestEntityRepository(true);
    repo.clearFallbackData();
    repo.seedFallbackData([
      { id: 'TEST-REC-001', name: 'Alpha Record' },
      { id: 'TEST-REC-002', name: 'Beta Record' },
      { id: 'TEST-REC-003', name: 'Gamma Record' },
    ]);
    return repo;
  }

  // Test 1: Direct deleteRow without token blocked
  try {
    let threw = false;
    try {
      await googleSheetsClient.deleteRow('QUESTIONS', 2);
    } catch (err) {
      assert.ok(err instanceof DirectDeleteBypassError, 'Expected DirectDeleteBypassError');
      threw = true;
    }
    assert.strictEqual(threw, true, 'deleteRow without token must throw');
    console.log('✓ 1. Direct call to googleSheetsClient.deleteRow() without token is blocked');
    passed++;
  } catch (err: any) {
    console.error('✗ Test 1 failed:', err.message);
    failed++;
  }

  // Test 2: Fabricated token blocked
  try {
    let threw = false;
    const fakeToken: VerifiedDeletionToken = {
      tokenId: 'TOK-fabricated-fake-token',
      sheetName: 'QUESTIONS',
      entityId: 'BP-Q-000001',
      physicalRowIndex: 2,
      backupFilePath: '/tmp/fake.json',
      checksum: 'fakechecksum',
      issuedAt: Date.now(),
      expiresAt: Date.now() + 60000,
    };
    try {
      await googleSheetsClient.deleteRow('QUESTIONS', 2, undefined, fakeToken);
    } catch (err) {
      assert.ok(err instanceof DirectDeleteBypassError, 'Expected DirectDeleteBypassError');
      threw = true;
    }
    assert.strictEqual(threw, true, 'Fabricated token must throw DirectDeleteBypassError');
    console.log('✓ 2. Direct call to googleSheetsClient.deleteRow() with fabricated/invalid token is blocked');
    passed++;
  } catch (err: any) {
    console.error('✗ Test 2 failed:', err.message);
    failed++;
  }

  // Test 3: Backup creation failure blocks deletion and leaves target record untouched
  try {
    const repo = resetEnvironment();
    deletionSafetyService.setSimulationHooks({ backupFailure: true });

    let threw = false;
    try {
      await repo.deleteRecord('TEST-REC-001');
    } catch (err) {
      assert.ok(err instanceof DeletionBackupError, 'Expected DeletionBackupError');
      threw = true;
    }
    assert.strictEqual(threw, true, 'Backup creation failure must throw DeletionBackupError');

    // Verify record was untouched
    const rec = await repo.findById('TEST-REC-001');
    assert.ok(rec !== null, 'Target record must remain present');
    assert.strictEqual(rec?.name, 'Alpha Record');

    const all = await repo.findAll();
    assert.strictEqual(all.length, 3, 'Total records count must remain 3');

    console.log('✓ 3. Backup creation failure blocks deletion and leaves target record untouched');
    passed++;
  } catch (err: any) {
    console.error('✗ Test 3 failed:', err.message);
    failed++;
  }

  // Test 4: Backup verification failure blocks deletion and leaves target record untouched
  try {
    const repo = resetEnvironment();
    deletionSafetyService.setSimulationHooks({ verificationFailure: true });

    let threw = false;
    try {
      await repo.deleteRecord('TEST-REC-002');
    } catch (err) {
      assert.ok(err instanceof DeletionBackupVerificationError, 'Expected DeletionBackupVerificationError');
      threw = true;
    }
    assert.strictEqual(threw, true, 'Verification failure must throw DeletionBackupVerificationError');

    // Verify record was untouched
    const rec = await repo.findById('TEST-REC-002');
    assert.ok(rec !== null, 'Target record must remain present');
    assert.strictEqual(rec?.name, 'Beta Record');

    const all = await repo.findAll();
    assert.strictEqual(all.length, 3, 'Total records count must remain 3');

    console.log('✓ 4. Backup verification failure blocks deletion and leaves target record untouched');
    passed++;
  } catch (err: any) {
    console.error('✗ Test 4 failed:', err.message);
    failed++;
  }

  // Test 5: Successful backup permits deletion, read-back verifies deletion, and integrity count updates
  try {
    const repo = resetEnvironment();
    const success = await repo.deleteRecord('TEST-REC-002');
    assert.strictEqual(success, true, 'deleteRecord must return true on success');

    // Read-back verification
    const rec = await repo.findById('TEST-REC-002');
    assert.strictEqual(rec, null, 'Deleted record must no longer exist on read-back');

    const remaining = await repo.findAll();
    assert.strictEqual(remaining.length, 2, 'Remaining records must be exactly 2');
    assert.deepStrictEqual(remaining.map((r) => r.id), ['TEST-REC-001', 'TEST-REC-003']);

    console.log('✓ 5. Successful backup permits deletion, read-back verifies deletion, and integrity count updates');
    passed++;
  } catch (err: any) {
    console.error('✗ Test 5 failed:', err.message);
    failed++;
  }

  // Test 6: Deletion safety token single-use protection
  try {
    deletionSafetyService.resetSimulationHooks();
    const token = await deletionSafetyService.createAndVerifyBackup({
      sheetName: 'TEST_SHEET',
      entityId: 'TEST-REC-001',
      physicalRowIndex: -1,
      headers: ['id', 'name'],
      rawRow: ['TEST-REC-001', 'Alpha Record'],
      record: { id: 'TEST-REC-001', name: 'Alpha Record' },
    });
    assert.ok(token.tokenId.startsWith('TOK-'));

    const firstConsume = deletionSafetyService.consumeToken(token, 'TEST_SHEET', -1);
    assert.strictEqual(firstConsume, true, 'First consumption must succeed');

    const secondConsume = deletionSafetyService.consumeToken(token, 'TEST_SHEET', -1);
    assert.strictEqual(secondConsume, false, 'Second consumption must fail');

    console.log('✓ 6. Deletion safety token cannot be reused (single-use protection)');
    passed++;
  } catch (err: any) {
    console.error('✗ Test 6 failed:', err.message);
    failed++;
  }

  // Test 7: Deletion token fails if sheetName does not match
  try {
    deletionSafetyService.resetSimulationHooks();
    const token = await deletionSafetyService.createAndVerifyBackup({
      sheetName: 'CORRECT_SHEET',
      entityId: 'TEST-REC-001',
      physicalRowIndex: 5,
      headers: ['id'],
      rawRow: ['TEST-REC-001'],
      record: { id: 'TEST-REC-001' },
    });

    const consumeWrong = deletionSafetyService.consumeToken(token, 'WRONG_SHEET', 5);
    assert.strictEqual(consumeWrong, false, 'Mismatched sheetName must fail');

    console.log('✓ 7. Deletion token fails if sheetName does not match');
    passed++;
  } catch (err: any) {
    console.error('✗ Test 7 failed:', err.message);
    failed++;
  }

  // Test 8: Configured Google Sheets mode passes token to client.deleteRow, performs read-back, and validates integrity
  try {
    deletionSafetyService.resetSimulationHooks();
    let mockSheetRows = [
      ['TEST-CFG-001', 'First Item'],
      ['TEST-CFG-002', 'Second Item'],
      ['TEST-CFG-003', 'Third Item'],
    ];

    let receivedToken: VerifiedDeletionToken | undefined;

    const mockClient = {
      isConfigured: () => true,
      getSpreadsheetId: () => 'mock-spreadsheet-id',
      invalidateRowCache: () => {},
      getRows: async () => ({
        headers: ['id', 'name'],
        rows: [...mockSheetRows],
      }),
      deleteRow: async (sheetName: string, rowIndex: number, overrideId?: string, safetyToken?: VerifiedDeletionToken) => {
        receivedToken = safetyToken;
        if (!safetyToken || !deletionSafetyService.consumeToken(safetyToken, sheetName, rowIndex)) {
          throw new DirectDeleteBypassError('DIRECT_DELETE_FORBIDDEN');
        }
        mockSheetRows.splice(rowIndex - 2, 1);
      },
    };

    const configuredRepo = new TestEntityRepository(false);
    (configuredRepo as any).client = mockClient;

    const deleteSuccess = await configuredRepo.deleteRecord('TEST-CFG-002');
    assert.strictEqual(deleteSuccess, true, 'Configured deletion must return true');
    assert.ok(receivedToken !== undefined, 'VerifiedDeletionToken must be passed to deleteRow');
    assert.strictEqual(receivedToken?.entityId, 'TEST-CFG-002');
    assert.strictEqual(receivedToken?.physicalRowIndex, 3);

    assert.strictEqual(mockSheetRows.length, 2);
    assert.deepStrictEqual(mockSheetRows.map((r) => r[0]), ['TEST-CFG-001', 'TEST-CFG-003']);

    console.log('✓ 8. Configured Google Sheets mode passes token to client.deleteRow, performs read-back, and validates integrity');
    passed++;
  } catch (err: any) {
    console.error('✗ Test 8 failed:', err.message);
    failed++;
  }

  deletionSafetyService.resetSimulationHooks();
  console.log(`\nTEST SUMMARY: ${passed} passed, ${failed} failed`);
  return { passed, failed };
}

// Auto-run if executed directly
runDeletionSafetyPipelineTests().then(({ failed }) => {
  if (failed > 0) process.exit(1);
});
