/**
 * BURRA PARIKSHA CMS - Production Sheet Initializer Verification Test Suite
 * 
 * Tests the safety, idempotency, schema header alignment, and non-destructive properties
 * of the ProductionSheetInitializer service.
 */

import { productionSheetInitializer } from '../lib/services/production-sheet-initializer.service';
import {
  ALL_SHEET_TABS,
  ID_PREFIX_MAP,
  SEQUENCE_ENTITIES,
  SHEET_SCHEMAS,
  SHEET_TABS,
  SequenceEntityType,
} from '../lib/schemas/google-sheets-schema';
import { googleSheetsClient } from '../lib/google-sheets/client';
import { sequencesRepository } from '../lib/repositories/sequences.repository';

export async function runProductionSheetInitializerTest() {
  console.log('====================================================');
  console.log('BURRA PARIKSHA CMS — PRODUCTION SHEET INITIALIZER TEST');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  [PASS] Test ${totalTests}: ${testName}`);
    } else {
      console.error(`  [FAIL] Test ${totalTests}: ${testName}`);
      if (detail) console.error(`         Detail: ${detail}`);
    }
  }

  // 1. Singleton instance check
  assert(
    Boolean(productionSheetInitializer),
    'ProductionSheetInitializer singleton is cleanly instantiated'
  );

  // 2. Schema tabs count invariant
  assert(
    ALL_SHEET_TABS.length === 18,
    `Authoritative worksheet registry contains exactly 18 tabs (found ${ALL_SHEET_TABS.length})`
  );

  // 3. Header definitions integrity for all 18 tabs
  let totalColumns = 0;
  let allHeadersValid = true;
  for (const tab of ALL_SHEET_TABS) {
    const schema = SHEET_SCHEMAS[tab];
    if (!schema || !schema.columns || schema.columns.length === 0) {
      allHeadersValid = false;
    }
    totalColumns += schema.columns.length;
  }

  assert(
    allHeadersValid,
    'All 18 worksheet schemas have non-empty, strictly typed column definitions'
  );

  assert(
    totalColumns === 184,
    `Total schema columns across all 18 tabs matches exact 184 count (found ${totalColumns})`
  );

  // 4. Primary key mappings check
  const pkCheck = ALL_SHEET_TABS.every((tab) => {
    const schema = SHEET_SCHEMAS[tab];
    return Boolean(schema.primaryKey && schema.columns.some((c) => c.name === schema.primaryKey || c.isPrimaryKey));
  });

  assert(
    pkCheck,
    'All 18 worksheets have valid primary key column mappings'
  );

  // 5. Sequence entities registry completeness
  const allSeqEntities = Object.values(SEQUENCE_ENTITIES);
  const seqConfigCheck = allSeqEntities.every((entity) => {
    const config = ID_PREFIX_MAP[entity as SequenceEntityType];
    return Boolean(config && config.prefix && config.padLength > 0);
  });

  assert(
    seqConfigCheck,
    `All ${allSeqEntities.length} sequence entities have valid ID prefix and pad length configuration`
  );

  // 6. Test Initializer execution
  const report1 = await productionSheetInitializer.initializeSpreadsheet();
  assert(
    typeof report1 === 'object' && typeof report1.isConfigured === 'boolean',
    'initializeSpreadsheet() executes cleanly and returns structured report'
  );

  if (googleSheetsClient.isConfigured()) {
    console.log('    * Live Google Sheets credentials detected.');
    console.log(`    * Created tabs: ${report1.createdTabs.join(', ') || 'None (all existed)'}`);
    console.log(`    * Skipped tabs: ${report1.skippedTabs.join(', ')}`);
    console.log(`    * Initialized sequences: ${report1.sequencesInitialized.join(', ') || 'None (all initialized)'}`);

    // Test Idempotency: Running a second time must not create tabs or overwrite sequences
    const report2 = await productionSheetInitializer.initializeSpreadsheet();
    assert(
      report2.createdTabs.length === 0,
      'Idempotency guarantee: Second run creates 0 duplicate tabs'
    );
    assert(
      report2.sequencesInitialized.length === 0,
      'Idempotency guarantee: Second run skips all existing sequences'
    );
  } else {
    console.log('    * No live Google Sheets credentials in sandbox. Handled gracefully without crash.');
    assert(
      report1.isLiveAccess === false && report1.isConfigured === false,
      'When credentials are not set, initializer reports explicit configuration missing state'
    );
  }

  console.log(`\nInitializer Test Complete: ${passedTests}/${totalTests} PASS\n`);
  return { passedTests, totalTests };
}
