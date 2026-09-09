/**
 * BURRA PARIKSHA CMS - Phase 15.5 Verification Suite
 * Targeted Read-Path Optimization:
 * 1. GoogleSheetsClient.getRows() in-flight deduplication
 * 2. BaseRepository schema-bounded column range reads
 */

import fs from 'fs';
import path from 'path';
import { googleSheetsClient, GoogleSheetsClient } from '../lib/google-sheets/client';
import { BaseRepository } from '../lib/repositories/base.repository';
import { contentMastersRepository, questionsRepository, videosRepository } from '../lib/repositories';
import { SHEET_SCHEMAS, SHEET_TABS } from '../lib/schemas/google-sheets-schema';

export async function runPhase15Step5Verification(): Promise<{
  success: boolean;
  totalTests: number;
  passedTests: number;
  results: Array<{ name: string; passed: boolean; message?: string }>;
}> {
  const results: Array<{ name: string; passed: boolean; message?: string }> = [];

  const addResult = (name: string, passed: boolean, message?: string) => {
    results.push({ name, passed, message });
  };

  // 1. Static code inspection: GoogleSheetsClient inFlightReads map and deduplication
  try {
    const clientPath = path.resolve(process.cwd(), 'src/lib/google-sheets/client.ts');
    const clientCode = fs.readFileSync(clientPath, 'utf8');

    const hasInFlightMap = clientCode.includes('inFlightReads') && clientCode.includes('Map<string, Promise<');
    const checksInFlight = clientCode.includes('this.inFlightReads.get(sheetName)');
    const setsInFlight = clientCode.includes('this.inFlightReads.set(sheetName');
    const deletesInFlightInFinally = clientCode.includes('this.inFlightReads.delete(sheetName)');
    const acceptsColBound = clientCode.includes('endColLetter?: string') || clientCode.includes('endColLetter: string');

    const passed = hasInFlightMap && checksInFlight && setsInFlight && deletesInFlightInFinally && acceptsColBound;
    addResult(
      '1. Code Inspection: GoogleSheetsClient has inFlightReads deduplication with cleanup in finally block',
      passed,
      `hasInFlightMap: ${hasInFlightMap}, checksInFlight: ${checksInFlight}, setsInFlight: ${setsInFlight}, deletesInFlightInFinally: ${deletesInFlightInFinally}, acceptsColBound: ${acceptsColBound}`
    );
  } catch (err: any) {
    addResult('1. Code Inspection: GoogleSheetsClient in-flight deduplication', false, err.message);
  }

  // 2. Static code inspection: BaseRepository schema-bounded range and getEndColLetter
  try {
    const repoPath = path.resolve(process.cwd(), 'src/lib/repositories/base.repository.ts');
    const repoCode = fs.readFileSync(repoPath, 'utf8');

    const importsColIndex = repoCode.includes('colIndexToA1Letter');
    const hasGetEndColLetter = repoCode.includes('getEndColLetter(): string') || repoCode.includes('getEndColLetter()');
    const findAllUsesBoundedRange = repoCode.includes('this.client.getRows(this.schema.sheetName, this.getEndColLetter())');
    const findByIdUsesBoundedRange = repoCode.includes('this.client.getRows(this.schema.sheetName, this.getEndColLetter())');

    const passed = importsColIndex && hasGetEndColLetter && findAllUsesBoundedRange && findByIdUsesBoundedRange;
    addResult(
      '2. Code Inspection: BaseRepository computes schema-bounded column letter and passes to getRows',
      passed,
      `importsColIndex: ${importsColIndex}, hasGetEndColLetter: ${hasGetEndColLetter}, findAllUsesBounded: ${findAllUsesBoundedRange}, findByIdUsesBounded: ${findByIdUsesBoundedRange}`
    );
  } catch (err: any) {
    addResult('2. Code Inspection: BaseRepository bounded column ranges', false, err.message);
  }

  // 3. Runtime Verification: getEndColLetter matches schema width for repositories
  try {
    // CONTENT_MASTERS has 11 columns -> index 10 -> 'K'
    // QUESTIONS has 35 columns -> index 34 -> 'AI'
    // VIDEOS has 25 columns -> index 24 -> 'Y'
    const cmCols = SHEET_SCHEMAS[SHEET_TABS.CONTENT_MASTERS].columns.length;
    const qCols = SHEET_SCHEMAS[SHEET_TABS.QUESTIONS].columns.length;
    const vCols = SHEET_SCHEMAS[SHEET_TABS.VIDEOS].columns.length;

    // Test helper directly
    const cmEnd = (contentMastersRepository as any).getEndColLetter();
    const qEnd = (questionsRepository as any).getEndColLetter();
    const vEnd = (videosRepository as any).getEndColLetter();

    const passed = cmCols === 11 && cmEnd === 'K' && qCols === 35 && qEnd === 'AI' && vCols === 25 && vEnd === 'Y';
    addResult(
      '3. Schema Column Letter Calculation: matches declared schema column counts accurately',
      passed,
      `CONTENT_MASTERS (${cmCols} cols): ${cmEnd} (expected K), QUESTIONS (${qCols} cols): ${qEnd} (expected AI), VIDEOS (${vCols} cols): ${vEnd} (expected Y)`
    );
  } catch (err: any) {
    addResult('3. Schema Column Letter Calculation', false, err.message);
  }

  // 4. Runtime In-Flight Deduplication: 10 concurrent requests coalesce to 1 network call
  try {
    const client = GoogleSheetsClient.getInstance();
    client.invalidateRowCache('TEST_CONCURRENCY_TAB');

    let rawApiCallCount = 0;
    const mockSheetsApi = {
      spreadsheets: {
        values: {
          get: async (params: { spreadsheetId: string; range: string }) => {
            rawApiCallCount++;
            // Simulate 50ms network delay
            await new Promise((resolve) => setTimeout(resolve, 50));
            return {
              data: {
                values: [
                  ['id', 'title', 'status'],
                  ['CM-001', 'Test Master 1', 'DRAFT'],
                  ['CM-002', 'Test Master 2', 'APPROVED'],
                ],
              },
            };
          },
        },
      },
    };

    // Inject mock api temporarily
    const originalApi = (client as any).sheetsApi;
    const originalAuth = (client as any).isAuthInitialized;
    const originalSpreadsheetId = (client as any).spreadsheetId;

    (client as any).sheetsApi = mockSheetsApi;
    (client as any).isAuthInitialized = true;
    (client as any).spreadsheetId = 'mock-spreadsheet-id';

    try {
      // Launch 10 simultaneous getRows calls on cold cache
      const promises = Array.from({ length: 10 }, () =>
        client.getRows('TEST_CONCURRENCY_TAB', 'C')
      );

      const allResults = await Promise.all(promises);

      // Verify all 10 received the exact same data
      const allRowsIdentical = allResults.every(
        (res) => res.rows.length === 2 && res.headers[0] === 'id' && res.rows[0][0] === 'CM-001'
      );

      // Verify API was called EXACTLY once
      const passed = rawApiCallCount === 1 && allRowsIdentical && allResults.length === 10;
      addResult(
        '4. In-Flight Promise Deduplication: 10 concurrent requests trigger exactly 1 API call',
        passed,
        `Raw API calls executed: ${rawApiCallCount} (expected: 1), all results valid: ${allRowsIdentical}`
      );
    } finally {
      // Restore
      (client as any).sheetsApi = originalApi;
      (client as any).isAuthInitialized = originalAuth;
      (client as any).spreadsheetId = originalSpreadsheetId;
      client.invalidateRowCache('TEST_CONCURRENCY_TAB');
    }
  } catch (err: any) {
    addResult('4. In-Flight Promise Deduplication', false, err.message);
  }

  // 5. Cache and Isolation: Mutating returned result does not corrupt cache or concurrent callers
  try {
    const client = GoogleSheetsClient.getInstance();
    client.invalidateRowCache('TEST_ISOLATION_TAB');

    const mockSheetsApi = {
      spreadsheets: {
        values: {
          get: async () => ({
            data: {
              values: [
                ['id', 'title'],
                ['ROW-1', 'Original Title'],
              ],
            },
          }),
        },
      },
    };

    const originalApi = (client as any).sheetsApi;
    const originalAuth = (client as any).isAuthInitialized;
    const originalSpreadsheetId = (client as any).spreadsheetId;

    (client as any).sheetsApi = mockSheetsApi;
    (client as any).isAuthInitialized = true;
    (client as any).spreadsheetId = 'mock-spreadsheet-id';

    try {
      const res1 = await client.getRows('TEST_ISOLATION_TAB', 'B');
      // Mutate returned array
      res1.rows[0][1] = 'TAMPERED';
      res1.headers.push('TAMPERED_HEADER');

      // Fetch again from cache
      const res2 = await client.getRows('TEST_ISOLATION_TAB', 'B');

      const isClean = res2.rows[0][1] === 'Original Title' && res2.headers.length === 2;
      addResult(
        '5. Result Isolation: Callers receive defensive shallow copies, preventing cache pollution',
        isClean,
        `Cached row after mutation: "${res2.rows[0][1]}", header count: ${res2.headers.length}`
      );
    } finally {
      (client as any).sheetsApi = originalApi;
      (client as any).isAuthInitialized = originalAuth;
      (client as any).spreadsheetId = originalSpreadsheetId;
      client.invalidateRowCache('TEST_ISOLATION_TAB');
    }
  } catch (err: any) {
    addResult('5. Result Isolation', false, err.message);
  }

  // 6. In-Flight Error Handling & Recovery: Rejected promise does not lock inFlightReads map
  try {
    const client = GoogleSheetsClient.getInstance();
    client.invalidateRowCache('TEST_ERROR_TAB');

    let callCount = 0;
    const mockSheetsApi = {
      spreadsheets: {
        values: {
          get: async () => {
            callCount++;
            if (callCount === 1) {
              throw new Error('Temporary API error');
            }
            return {
              data: {
                values: [
                  ['id', 'status'],
                  ['ROW-OK', 'ACTIVE'],
                ],
              },
            };
          },
        },
      },
    };

    const originalApi = (client as any).sheetsApi;
    const originalAuth = (client as any).isAuthInitialized;
    const originalSpreadsheetId = (client as any).spreadsheetId;

    (client as any).sheetsApi = mockSheetsApi;
    (client as any).isAuthInitialized = true;
    (client as any).spreadsheetId = 'mock-spreadsheet-id';

    try {
      // First call fails
      let firstFailed = false;
      try {
        await client.getRows('TEST_ERROR_TAB', 'B');
      } catch {
        firstFailed = true;
      }

      // Check map is clean
      const inFlightEmpty = (client as any).inFlightReads.has('TEST_ERROR_TAB') === false;

      // Second call succeeds
      const secondResult = await client.getRows('TEST_ERROR_TAB', 'B');
      const secondSuccess = secondResult.rows.length === 1 && secondResult.rows[0][0] === 'ROW-OK';

      const passed = firstFailed && inFlightEmpty && secondSuccess;
      addResult(
        '6. In-Flight Error Cleanup: Rejection properly cleans inFlightReads and allows subsequent reads',
        passed,
        `First failed: ${firstFailed}, inFlight cleared: ${inFlightEmpty}, second succeeded: ${secondSuccess}`
      );
    } finally {
      (client as any).sheetsApi = originalApi;
      (client as any).isAuthInitialized = originalAuth;
      (client as any).spreadsheetId = originalSpreadsheetId;
      client.invalidateRowCache('TEST_ERROR_TAB');
    }
  } catch (err: any) {
    addResult('6. In-Flight Error Cleanup', false, err.message);
  }

  // 7. Range construction check: endColLetter is properly formatted in range string
  try {
    const client = GoogleSheetsClient.getInstance();
    client.invalidateRowCache('TEST_RANGE_TAB');

    let capturedRange = '';
    const mockSheetsApi = {
      spreadsheets: {
        values: {
          get: async (params: { range: string }) => {
            capturedRange = params.range;
            return {
              data: {
                values: [
                  ['id', 'col2'],
                  ['1', 'val'],
                ],
              },
            };
          },
        },
      },
    };

    const originalApi = (client as any).sheetsApi;
    const originalAuth = (client as any).isAuthInitialized;
    const originalSpreadsheetId = (client as any).spreadsheetId;

    (client as any).sheetsApi = mockSheetsApi;
    (client as any).isAuthInitialized = true;
    (client as any).spreadsheetId = 'mock-spreadsheet-id';

    try {
      await client.getRows('TEST_RANGE_TAB', 'AI');
      const rangeAI = capturedRange;

      client.invalidateRowCache('TEST_RANGE_TAB');
      await client.getRows('TEST_RANGE_TAB'); // default ZZ
      const rangeDefault = capturedRange;

      const passed = rangeAI === "'TEST_RANGE_TAB'!A:AI" && rangeDefault === "'TEST_RANGE_TAB'!A:ZZ";
      addResult(
        '7. Range Formulation: Range accurately binds to sheet schema column or falls back to A:ZZ',
        passed,
        `Explicit AI: "${rangeAI}", Default: "${rangeDefault}"`
      );
    } finally {
      (client as any).sheetsApi = originalApi;
      (client as any).isAuthInitialized = originalAuth;
      (client as any).spreadsheetId = originalSpreadsheetId;
      client.invalidateRowCache('TEST_RANGE_TAB');
    }
  } catch (err: any) {
    addResult('7. Range Formulation', false, err.message);
  }

  // 8. BaseRepository read compatibility: findAll() and findById() work accurately with schema-bounded ranges
  try {
    // 8a. Live configured read
    const allMasters = await contentMastersRepository.findAll();
    const hasLiveRecords = allMasters.length > 0;
    let foundLiveById = false;

    if (hasLiveRecords) {
      const firstId = allMasters[0].id;
      const fetched = await contentMastersRepository.findById(firstId);
      foundLiveById = Boolean(fetched && fetched.id === firstId);
    }

    // 8b. Fallback store isolation check (when client is unconfigured)
    const client = GoogleSheetsClient.getInstance();
    const originalConfigured = client.isConfigured;
    (client as any).isConfigured = () => false;

    let fallbackPassed = false;
    try {
      const testFallback = {
        id: 'CM-FALLBACK-TEST',
        title: 'Fallback Master',
        status: 'DRAFT',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      contentMastersRepository.seedFallbackData([testFallback as any]);
      const foundFallback = await contentMastersRepository.findById('CM-FALLBACK-TEST');
      const allFallback = await contentMastersRepository.findAll();
      fallbackPassed = Boolean(foundFallback && foundFallback.id === 'CM-FALLBACK-TEST' && allFallback.some((m) => m.id === 'CM-FALLBACK-TEST'));
    } finally {
      (client as any).isConfigured = originalConfigured;
    }

    const passed = hasLiveRecords && foundLiveById && fallbackPassed;
    addResult(
      '8. BaseRepository Contract: findAll() and findById() remain 100% functional and compatible with bounded ranges',
      passed,
      `Live records: ${allMasters.length}, Live findById: ${foundLiveById}, Fallback store functional: ${fallbackPassed}`
    );
  } catch (err: any) {
    addResult('8. BaseRepository Contract', false, err.message);
  }

  const passedTests = results.filter((r) => r.passed).length;
  const totalTests = results.length;
  const success = passedTests === totalTests;

  return {
    success,
    totalTests,
    passedTests,
    results,
  };
}
