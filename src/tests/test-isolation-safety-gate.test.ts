/**
 * BURRA PARIKSHA CMS - A-02.2 Test Isolation & Safety Gate Regression Test Suite
 * 
 * Verifies the central fail-closed write safety gate:
 * 1. Production mode + production target -> existing behavior preserved (no block by isolation gate).
 * 2. Test mode + TEST_GOOGLE_SHEETS_ID -> write allowed.
 * 3. Test mode + TEST_ANALYTICS_SPREADSHEET_ID -> write allowed.
 * 4. Test mode + GOOGLE_SHEETS_ID -> write blocked.
 * 5. Test mode + SPREADSHEET_ID -> write blocked.
 * 6. Test mode + ANALYTICS_SPREADSHEET_ID -> write blocked.
 * 7. Test mode + no TEST_* target -> write does not fall back to production (fails closed).
 * 8. ALLOW_LIVE_TEST_WRITES=true explicitly permits controlled live writes.
 * 9. Reads remain unaffected in test mode.
 * 10. Sequence writes are protected against live sheet mutations.
 * 11. Analytics writes are protected against live sheet mutations.
 * 12. The guard covers every GoogleSheetsClient mutation method:
 *     - appendRow
 *     - updateRow
 *     - deleteRow
 *     - createWorksheetIfNotExists
 *     - clearDataRows
 *     - updateRangeValues
 * 
 * NOTE: Network calls are 100% mocked/stubbed. Zero external Google Sheets or Drive API calls.
 */

import { googleSheetsClient } from '../lib/google-sheets/client';
import { TestIsolationWriteBlockedError } from '../lib/google-sheets/errors';
import { sequencesRepository } from '../lib/repositories/sequences.repository';
import { analyticsRepository } from '../lib/repositories/analytics.repository';
import { SEQUENCE_ENTITIES } from '../lib/schemas/google-sheets-schema';

async function runSafetyGateTests() {
  console.log('===============================================================');
  console.log('A-02.2: TEST ISOLATION & GLOBAL WRITE SAFETY GATE VERIFICATION');
  console.log('===============================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    total++;
    if (condition) {
      console.log(`[PASS] Test ${total.toString().padStart(2, ' ')}: ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] Test ${total.toString().padStart(2, ' ')}: ${testName} - Detail: ${detail || 'Assertion failed'}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  // Preserve original environment variables
  const origEnv = { ...process.env };

  function restoreEnv() {
    process.env = { ...origEnv };
  }

  try {
    // ------------------------------------------------------------------------
    // TEST 1: Production mode + production target -> existing behavior preserved
    // (assertWriteAllowed does not throw in production mode)
    // ------------------------------------------------------------------------
    delete process.env.NODE_ENV;
    delete process.env.CMS_TEST_ISOLATION;
    delete process.env.ALLOW_LIVE_TEST_WRITES;
    process.env.GOOGLE_SHEETS_ID = 'live-prod-sheet-123';

    let test1Passed = false;
    try {
      googleSheetsClient.assertWriteAllowed('live-prod-sheet-123', 'testOp');
      test1Passed = true;
    } catch {
      test1Passed = false;
    }
    assert(test1Passed, 'Production mode + production target -> write allowed (unrestricted)');

    // ------------------------------------------------------------------------
    // TEST 2: Test mode (NODE_ENV=test) + TEST_GOOGLE_SHEETS_ID -> write allowed
    // ------------------------------------------------------------------------
    process.env.NODE_ENV = 'test';
    delete process.env.CMS_TEST_ISOLATION;
    delete process.env.ALLOW_LIVE_TEST_WRITES;
    process.env.TEST_GOOGLE_SHEETS_ID = 'test-sandbox-sheet-abc';
    process.env.GOOGLE_SHEETS_ID = 'live-prod-sheet-123';

    let test2Passed = false;
    try {
      googleSheetsClient.assertWriteAllowed('test-sandbox-sheet-abc', 'appendRow');
      test2Passed = true;
    } catch {
      test2Passed = false;
    }
    assert(test2Passed, 'Test mode + TEST_GOOGLE_SHEETS_ID target -> write allowed');

    // ------------------------------------------------------------------------
    // TEST 3: Test mode (CMS_TEST_ISOLATION=true) + TEST_ANALYTICS_SPREADSHEET_ID -> write allowed
    // ------------------------------------------------------------------------
    delete process.env.NODE_ENV;
    process.env.CMS_TEST_ISOLATION = 'true';
    delete process.env.ALLOW_LIVE_TEST_WRITES;
    process.env.TEST_ANALYTICS_SPREADSHEET_ID = 'test-sandbox-analytics-xyz';
    process.env.ANALYTICS_SPREADSHEET_ID = 'live-analytics-sheet-456';

    let test3Passed = false;
    try {
      googleSheetsClient.assertWriteAllowed('test-sandbox-analytics-xyz', 'appendRow');
      test3Passed = true;
    } catch {
      test3Passed = false;
    }
    assert(test3Passed, 'Test mode (CMS_TEST_ISOLATION) + TEST_ANALYTICS_SPREADSHEET_ID -> write allowed');

    // ------------------------------------------------------------------------
    // TEST 4: Test mode + GOOGLE_SHEETS_ID -> write blocked with TestIsolationWriteBlockedError
    // ------------------------------------------------------------------------
    process.env.NODE_ENV = 'test';
    delete process.env.CMS_TEST_ISOLATION;
    delete process.env.ALLOW_LIVE_TEST_WRITES;
    process.env.GOOGLE_SHEETS_ID = 'live-prod-sheet-123';

    let test4Blocked = false;
    let test4ErrorMsg = '';
    try {
      googleSheetsClient.assertWriteAllowed('live-prod-sheet-123', 'appendRow');
    } catch (err: any) {
      if (err instanceof TestIsolationWriteBlockedError) {
        test4Blocked = true;
        test4ErrorMsg = err.message;
      }
    }
    assert(
      test4Blocked && test4ErrorMsg.includes('LIVE production CMS workbook') && test4ErrorMsg.includes('TEST_GOOGLE_SHEETS_ID'),
      'Test mode + GOOGLE_SHEETS_ID -> blocked with descriptive diagnostic error'
    );

    // ------------------------------------------------------------------------
    // TEST 5: Test mode + SPREADSHEET_ID -> write blocked
    // ------------------------------------------------------------------------
    delete process.env.GOOGLE_SHEETS_ID;
    process.env.SPREADSHEET_ID = 'legacy-live-spreadsheet-789';

    let test5Blocked = false;
    try {
      googleSheetsClient.assertWriteAllowed('legacy-live-spreadsheet-789', 'updateRow');
    } catch (err: any) {
      if (err instanceof TestIsolationWriteBlockedError) {
        test5Blocked = true;
      }
    }
    assert(test5Blocked, 'Test mode + SPREADSHEET_ID -> blocked');

    // ------------------------------------------------------------------------
    // TEST 6: Test mode + ANALYTICS_SPREADSHEET_ID -> write blocked
    // ------------------------------------------------------------------------
    delete process.env.SPREADSHEET_ID;
    process.env.ANALYTICS_SPREADSHEET_ID = 'live-analytics-sheet-456';

    let test6Blocked = false;
    let test6ErrorMsg = '';
    try {
      googleSheetsClient.assertWriteAllowed('live-analytics-sheet-456', 'clearDataRows');
    } catch (err: any) {
      if (err instanceof TestIsolationWriteBlockedError) {
        test6Blocked = true;
        test6ErrorMsg = err.message;
      }
    }
    assert(
      test6Blocked && test6ErrorMsg.includes('LIVE analytics workbook'),
      'Test mode + ANALYTICS_SPREADSHEET_ID -> blocked with analytics workbook notice'
    );

    // ------------------------------------------------------------------------
    // TEST 7: Test mode + no TEST_* target -> fails closed, does not fall back to production
    // ------------------------------------------------------------------------
    process.env.NODE_ENV = 'test';
    delete process.env.TEST_GOOGLE_SHEETS_ID;
    delete process.env.TEST_ANALYTICS_SPREADSHEET_ID;
    process.env.GOOGLE_SHEETS_ID = 'live-prod-sheet-123';

    // Verify resolveTargetSpreadsheetId returns empty or test ID, never live sheet
    const resolvedInTest = googleSheetsClient.getSpreadsheetId();
    assert(
      resolvedInTest === '',
      'Test mode without TEST_GOOGLE_SHEETS_ID -> resolves to empty string, never live sheet',
      `Expected '', got '${resolvedInTest}'`
    );

    let test7Blocked = false;
    try {
      googleSheetsClient.assertWriteAllowed('', 'appendRow');
    } catch (err: any) {
      if (err instanceof TestIsolationWriteBlockedError) {
        test7Blocked = true;
      }
    }
    assert(test7Blocked, 'Test mode with unconfigured test target -> fails closed');

    // ------------------------------------------------------------------------
    // TEST 8: ALLOW_LIVE_TEST_WRITES=true explicitly permits controlled live writes
    // ------------------------------------------------------------------------
    process.env.NODE_ENV = 'test';
    process.env.GOOGLE_SHEETS_ID = 'live-prod-sheet-123';
    process.env.ALLOW_LIVE_TEST_WRITES = 'true';

    let test8Passed = false;
    try {
      googleSheetsClient.assertWriteAllowed('live-prod-sheet-123', 'appendRow');
      test8Passed = true;
    } catch {
      test8Passed = false;
    }
    assert(test8Passed, 'ALLOW_LIVE_TEST_WRITES=true explicitly permits controlled live writes');

    // ------------------------------------------------------------------------
    // TEST 9: Reads remain unaffected in test mode
    // ------------------------------------------------------------------------
    process.env.NODE_ENV = 'test';
    delete process.env.ALLOW_LIVE_TEST_WRITES;
    process.env.GOOGLE_SHEETS_ID = 'live-prod-sheet-123';

    // Mock getSheetsApi to intercept read calls without network access
    let readAttempted = false;
    const origGetSheetsApi = (googleSheetsClient as any).getSheetsApi;
    (googleSheetsClient as any).getSheetsApi = () => ({
      spreadsheets: {
        values: {
          get: async () => {
            readAttempted = true;
            return { data: { values: [['ID', 'Title'], ['1', 'Sample']] } };
          },
        },
      },
    });

    try {
      const headers = await googleSheetsClient.getHeaders('QUESTIONS', 'live-prod-sheet-123');
      assert(readAttempted && headers.length === 2 && headers[0] === 'ID', 'Reads remain unaffected in test mode');
    } finally {
      (googleSheetsClient as any).getSheetsApi = origGetSheetsApi;
    }

    // ------------------------------------------------------------------------
    // TEST 10: Sequence writes are protected against live sheet mutations
    // ------------------------------------------------------------------------
    process.env.NODE_ENV = 'test';
    delete process.env.ALLOW_LIVE_TEST_WRITES;
    process.env.GOOGLE_SHEETS_ID = 'live-prod-sheet-123';
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL = 'mock-sa@example.iam.gserviceaccount.com';
    process.env.GOOGLE_PRIVATE_KEY = 'mock-private-key';

    // In test mode without TEST_GOOGLE_SHEETS_ID, repositories route to undefined / in-memory fallback.
    // If any caller attempts to explicitly mutate the live production sheet in test mode, the client safety gate blocks it.
    let seqBlocked = false;
    try {
      await googleSheetsClient.appendRow('SEQUENCES', ['BP-Q-', 999], 'live-prod-sheet-123');
    } catch (err: any) {
      if (err instanceof TestIsolationWriteBlockedError) {
        seqBlocked = true;
      }
    }
    assert(seqBlocked, 'Sequence repository writes are blocked from mutating live sheets in test mode');

    // ------------------------------------------------------------------------
    // TEST 11: Analytics writes are protected against live sheet mutations
    // ------------------------------------------------------------------------
    process.env.NODE_ENV = 'test';
    delete process.env.ALLOW_LIVE_TEST_WRITES;
    delete process.env.TEST_ANALYTICS_SPREADSHEET_ID;
    process.env.ANALYTICS_SPREADSHEET_ID = 'live-analytics-sheet-456';

    let analyticsBlocked = false;
    try {
      // In test mode without TEST_ANALYTICS_SPREADSHEET_ID, repository routes to undefined / unconfigured
      // If someone explicitly targets live analytics sheet, client blocks it
      await googleSheetsClient.appendRow('SOCIAL_ANALYTICS', ['snap-1', 'CNT-1'], 'live-analytics-sheet-456');
    } catch (err: any) {
      if (err instanceof TestIsolationWriteBlockedError) {
        analyticsBlocked = true;
      }
    }
    assert(analyticsBlocked, 'Analytics writes to live analytics spreadsheet are blocked in test mode');

    // ------------------------------------------------------------------------
    // TEST 12: The guard covers every GoogleSheetsClient mutation method
    // ------------------------------------------------------------------------
    process.env.NODE_ENV = 'test';
    delete process.env.ALLOW_LIVE_TEST_WRITES;
    process.env.GOOGLE_SHEETS_ID = 'live-prod-sheet-123';

    const mutationMethods = [
      {
        name: 'appendRow',
        call: () => googleSheetsClient.appendRow('TEST_SHEET', ['val1', 'val2'], 'live-prod-sheet-123'),
      },
      {
        name: 'updateRow',
        call: () => googleSheetsClient.updateRow('TEST_SHEET', 2, ['val1', 'val2'], 'live-prod-sheet-123'),
      },
      {
        name: 'deleteRow',
        call: () => googleSheetsClient.deleteRow('TEST_SHEET', 2, 'live-prod-sheet-123'),
      },
      {
        name: 'createWorksheetIfNotExists',
        call: () => googleSheetsClient.createWorksheetIfNotExists('TEST_SHEET', ['Col1'], 'live-prod-sheet-123'),
      },
      {
        name: 'clearDataRows',
        call: () => googleSheetsClient.clearDataRows('TEST_SHEET', 'live-prod-sheet-123'),
      },
      {
        name: 'updateRangeValues',
        call: () => googleSheetsClient.updateRangeValues('TEST_SHEET', 'A2', [['val1']], 'live-prod-sheet-123'),
      },
    ];

    let allCovered = true;
    for (const method of mutationMethods) {
      let methodBlocked = false;
      try {
        await method.call();
      } catch (err: any) {
        if (err instanceof TestIsolationWriteBlockedError) {
          methodBlocked = true;
        }
      }
      if (!methodBlocked) {
        allCovered = false;
        console.error(`Method ${method.name} was NOT intercepted by TestIsolationWriteBlockedError!`);
      }
    }
    assert(allCovered, 'All 6 mutation methods (append, update, delete, createSheet, clear, updateRange) are protected');

  } finally {
    restoreEnv();
  }

  console.log('\n===============================================================');
  console.log(`📊 A-02.2 SAFETY GATE RESULTS: ${passed}/${total} PASSED`);
  console.log('===============================================================\n');

  if (passed !== total) {
    throw new Error(`A-02.2 safety gate suite had failures: ${total - passed}`);
  }
}

runSafetyGateTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
