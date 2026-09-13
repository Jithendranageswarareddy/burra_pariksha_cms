/**
 * BURRA PARIKSHA CMS - Question Configuration Infrastructure Test Suite
 * 
 * Verifies:
 * 1. QUESTION_CONFIG schema validity (exact 10-column contract)
 * 2. Repository parsing
 * 3. Dimension filtering (REAL_LIFE_CONTEXT vs QUESTION_STYLE)
 * 4. Active/inactive filtering
 * 5. sort_order ascending sort
 * 6. default detection (explicit flag + fallback)
 * 7. stable ID and code preservation (e.g. CFG-STY-001, CFG-CTX-001)
 * 8. malformed configuration rejection (strict errors)
 * 9. empty configuration handling (no silent mock fallback)
 * 10. cache behavior (60s TTL + invalidateCache)
 * 11. No accidental writes to existing production worksheets
 * 12. Existing repository regression guarantees
 */

import {
  SHEET_TABS,
  ALL_SHEET_TABS,
  SHEET_SCHEMAS,
} from '../lib/schemas/google-sheets-schema';
import {
  questionConfigRepository,
  QuestionConfigRepository,
} from '../lib/repositories/question-config.repository';
import {
  QuestionConfigService,
  QuestionConfigError,
} from '../lib/services/question-config.service';
import { QuestionConfigEntry } from '../types';
import { rowToObject } from '../lib/google-sheets/helpers';
import { topicsRepository } from '../lib/repositories/topics.repository';
import { subtopicsRepository } from '../lib/repositories/subtopics.repository';
import { questionsRepository } from '../lib/repositories/questions.repository';
import { sequencesRepository } from '../lib/repositories/sequences.repository';
import { usersRepository } from '../lib/repositories/users.repository';

export async function runQuestionConfigInfrastructureTests() {
  console.log('================================================================');
  console.log('BURRA PARIKSHA CMS — QUESTION_CONFIG INFRASTRUCTURE TEST SUITE');
  console.log('================================================================\n');

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

  // ============================================================================
  // 1. QUESTION_CONFIG SCHEMA VALIDITY
  // ============================================================================
  console.log('--- Suite 1: Schema Contract Integrity ---');

  assert(
    SHEET_TABS.QUESTION_CONFIG === 'QUESTION_CONFIG',
    'SHEET_TABS defines authoritative QUESTION_CONFIG worksheet constant'
  );

  assert(
    ALL_SHEET_TABS.includes('QUESTION_CONFIG'),
    'ALL_SHEET_TABS registry includes QUESTION_CONFIG'
  );

  const schema = SHEET_SCHEMAS[SHEET_TABS.QUESTION_CONFIG];
  assert(
    Boolean(schema),
    'SHEET_SCHEMAS contains contract definition for QUESTION_CONFIG'
  );

  assert(
    schema.sheetName === 'QUESTION_CONFIG' && schema.primaryKey === 'id',
    'Schema specifies primary key as "id" and sheetName as "QUESTION_CONFIG"'
  );

  const expectedColumns = [
    { name: 'id', prop: 'id', type: 'string', required: true, isPrimaryKey: true },
    { name: 'dimension', prop: 'dimension', type: 'string', required: true },
    { name: 'code', prop: 'code', type: 'string', required: true },
    { name: 'display_label', prop: 'displayLabel', type: 'string', required: true },
    { name: 'description', prop: 'description', type: 'string', required: false },
    { name: 'ai_prompt_guidance', prop: 'aiPromptGuidance', type: 'string', required: false },
    { name: 'sort_order', prop: 'sortOrder', type: 'number', required: true },
    { name: 'is_active', prop: 'isActive', type: 'boolean', required: true },
    { name: 'is_default', prop: 'isDefault', type: 'boolean', required: true },
    { name: 'updated_at', prop: 'updatedAt', type: 'date', required: true },
  ];

  assert(
    schema.columns.length === 10,
    `QUESTION_CONFIG has exact 10 columns (found: ${schema.columns.length})`
  );

  let columnsMatch = true;
  for (let i = 0; i < expectedColumns.length; i++) {
    const expected = expectedColumns[i];
    const actual = schema.columns[i];
    if (
      !actual ||
      actual.name !== expected.name ||
      actual.propertyKey !== expected.prop ||
      actual.type !== expected.type ||
      actual.required !== expected.required ||
      Boolean(actual.isPrimaryKey) !== Boolean(expected.isPrimaryKey)
    ) {
      columnsMatch = false;
      console.error(`Mismatch at column index ${i}: Expected ${JSON.stringify(expected)} vs Actual ${JSON.stringify(actual)}`);
      break;
    }
  }

  assert(columnsMatch, 'All 10 columns match the exact column specification and types');

  // ============================================================================
  // 2. REPOSITORY PARSING (rowToObject)
  // ============================================================================
  console.log('\n--- Suite 2: Repository Row Parsing ---');

  const headers = [
    'id',
    'dimension',
    'code',
    'display_label',
    'description',
    'ai_prompt_guidance',
    'sort_order',
    'is_active',
    'is_default',
    'updated_at',
  ];

  const sampleRow = [
    'CFG-STY-001',
    'QUESTION_STYLE',
    'STORY_BASED',
    'Story-Based Scenario',
    'Narrative setup in daily life',
    'Frame problem inside authentic narrative',
    '10',
    'TRUE',
    'TRUE',
    '2026-09-13T04:30:00.000Z',
  ];

  const parsed = rowToObject<QuestionConfigEntry>(sampleRow, headers, schema);

  assert(parsed.id === 'CFG-STY-001', 'Row parsing maps id correctly');
  assert(parsed.dimension === 'QUESTION_STYLE', 'Row parsing maps dimension correctly');
  assert(parsed.code === 'STORY_BASED', 'Row parsing maps code correctly');
  assert(parsed.displayLabel === 'Story-Based Scenario', 'Row parsing maps displayLabel correctly');
  assert(parsed.description === 'Narrative setup in daily life', 'Row parsing maps description correctly');
  assert(parsed.aiPromptGuidance === 'Frame problem inside authentic narrative', 'Row parsing maps aiPromptGuidance correctly');
  assert(parsed.sortOrder === 10, 'Row parsing converts sort_order string to number');
  assert(parsed.isActive === true, 'Row parsing converts is_active TRUE to boolean true');
  assert(parsed.isDefault === true, 'Row parsing converts is_default TRUE to boolean true');

  // ============================================================================
  // 3. SERVICE SETUP WITH IN-MEMORY MOCK REPOSITORY
  // ============================================================================
  console.log('\n--- Suite 3: Dimension, Active, Sorting, & Defaults Logic ---');

  // Construct a controlled test dataset
  const testData: QuestionConfigEntry[] = [
    {
      id: 'CFG-STY-001',
      dimension: 'QUESTION_STYLE',
      code: 'STORY_BASED',
      displayLabel: 'Story-Based Scenario',
      description: 'Conversational narrative problem',
      aiPromptGuidance: 'Frame problem inside narrative arc',
      sortOrder: 10,
      isActive: true,
      isDefault: true,
      updatedAt: '2026-09-13T04:30:00.000Z',
    },
    {
      id: 'CFG-STY-002',
      dimension: 'QUESTION_STYLE',
      code: 'SPEED_MATH_TRICK',
      displayLabel: 'Speed Math / Burra Trick',
      sortOrder: 20,
      isActive: true,
      isDefault: false,
      updatedAt: '2026-09-13T04:30:00.000Z',
    },
    {
      id: 'CFG-STY-003',
      dimension: 'QUESTION_STYLE',
      code: 'DEPRECATED_STYLE',
      displayLabel: 'Deprecated Style Option',
      sortOrder: 5,
      isActive: false, // Inactive
      isDefault: false,
      updatedAt: '2026-09-13T04:30:00.000Z',
    },
    {
      id: 'CFG-CTX-001',
      dimension: 'REAL_LIFE_CONTEXT',
      code: 'DAILY_COMMUTE',
      displayLabel: 'Daily Commute & Public Transit',
      description: 'Metro, bus, train travel',
      aiPromptGuidance: 'Focus on transit speeds and ticket costs',
      sortOrder: 10,
      isActive: true,
      isDefault: true,
      updatedAt: '2026-09-13T04:30:00.000Z',
    },
    {
      id: 'CFG-CTX-002',
      dimension: 'REAL_LIFE_CONTEXT',
      code: 'FESTIVE_SHOPPING',
      displayLabel: 'Festive Shopping & Discounts',
      sortOrder: 30,
      isActive: true,
      isDefault: false,
      updatedAt: '2026-09-13T04:30:00.000Z',
    },
    {
      id: 'CFG-CTX-003',
      dimension: 'REAL_LIFE_CONTEXT',
      code: 'BLINKIT_DELIVERY',
      displayLabel: '10-Minute Grocery Delivery',
      sortOrder: 15,
      isActive: true,
      isDefault: false,
      updatedAt: '2026-09-13T04:30:00.000Z',
    },
    {
      id: 'CFG-CTX-004',
      dimension: 'REAL_LIFE_CONTEXT',
      code: 'INACTIVE_CONTEXT',
      displayLabel: 'Old Inactive Scenario',
      sortOrder: 1,
      isActive: false, // Inactive
      isDefault: false,
      updatedAt: '2026-09-13T04:30:00.000Z',
    },
  ];

  // Create an isolated mock repository for testing the service
  class MockConfigRepository extends QuestionConfigRepository {
    private mockRecords: QuestionConfigEntry[];

    constructor(records: QuestionConfigEntry[]) {
      super();
      this.mockRecords = [...records];
    }

    public async findAll(): Promise<QuestionConfigEntry[]> {
      return [...this.mockRecords];
    }

    public setRecords(records: QuestionConfigEntry[]): void {
      this.mockRecords = [...records];
    }
  }

  const mockRepo = new MockConfigRepository(testData);
  QuestionConfigService.resetInstance();
  const service = QuestionConfigService.getInstance(mockRepo);

  // 3. Dimension Filtering
  const allStyles = await service.getQuestionStyles(false);
  assert(
    allStyles.length === 3 && allStyles.every((s) => s.dimension === 'QUESTION_STYLE'),
    'Dimension filtering: getQuestionStyles returns only QUESTION_STYLE entries (3 found)'
  );

  const allContexts = await service.getRealLifeContexts(false);
  assert(
    allContexts.length === 4 && allContexts.every((c) => c.dimension === 'REAL_LIFE_CONTEXT'),
    'Dimension filtering: getRealLifeContexts returns only REAL_LIFE_CONTEXT entries (4 found)'
  );

  // 4. Active/Inactive Filtering
  const activeStyles = await service.getQuestionStyles(true);
  assert(
    activeStyles.length === 2 && !activeStyles.some((s) => s.code === 'DEPRECATED_STYLE'),
    'Active filtering: Inactive styles are excluded when activeOnly is true (found 2 active)'
  );

  const activeContexts = await service.getRealLifeContexts(true);
  assert(
    activeContexts.length === 3 && !activeContexts.some((c) => c.code === 'INACTIVE_CONTEXT'),
    'Active filtering: Inactive contexts are excluded when activeOnly is true (found 3 active)'
  );

  // 5. sort_order Ascending Order
  assert(
    activeContexts[0].code === 'DAILY_COMMUTE' && // sortOrder: 10
    activeContexts[1].code === 'BLINKIT_DELIVERY' && // sortOrder: 15
    activeContexts[2].code === 'FESTIVE_SHOPPING', // sortOrder: 30
    'Sort order: Active contexts are strictly ordered ascending by sortOrder (10, 15, 30)'
  );

  // 6. Default Detection
  const defaultStyle = await service.getDefaultQuestionStyle();
  assert(
    defaultStyle !== null && defaultStyle.code === 'STORY_BASED' && defaultStyle.isDefault === true,
    'Default detection: Correctly identifies STORY_BASED as the default question style'
  );

  const defaultContext = await service.getDefaultRealLifeContext();
  assert(
    defaultContext !== null && defaultContext.code === 'DAILY_COMMUTE' && defaultContext.isDefault === true,
    'Default detection: Correctly identifies DAILY_COMMUTE as the default real-life context'
  );

  // Default fallback when no explicit default exists
  const contextWithoutDefault = testData
    .filter((d) => d.dimension === 'REAL_LIFE_CONTEXT' && d.isActive)
    .map((d) => ({ ...d, isDefault: false }));
  mockRepo.setRecords(contextWithoutDefault);
  service.invalidateCache();

  const fallbackContext = await service.getDefaultRealLifeContext();
  assert(
    fallbackContext !== null && fallbackContext.code === 'DAILY_COMMUTE',
    'Default fallback: When no explicit isDefault=true exists, falls back to first active entry by sortOrder'
  );

  // Restore test data
  mockRepo.setRecords(testData);
  service.invalidateCache();

  // 7. Stable ID and Code Preservation
  const foundByCode = await service.getByCode('QUESTION_STYLE', 'STORY_BASED');
  assert(
    foundByCode !== null && foundByCode.id === 'CFG-STY-001' && foundByCode.code === 'STORY_BASED',
    'Stable ID/code: getByCode preserves exact ID "CFG-STY-001" and code "STORY_BASED"'
  );

  const foundById = await service.getById('CFG-CTX-002');
  assert(
    foundById !== null && foundById.code === 'FESTIVE_SHOPPING',
    'Stable ID/code: getById preserves exact ID "CFG-CTX-002"'
  );

  // Grouped active configuration payload
  const grouped = await service.getGroupedActiveConfig();
  assert(
    grouped.realLifeContexts.length === 3 &&
    grouped.questionStyles.length === 2 &&
    grouped.defaultQuestionStyle?.code === 'STORY_BASED' &&
    grouped.defaultRealLifeContext?.code === 'DAILY_COMMUTE',
    'Grouped config: Produces complete Question Studio payload with contexts, styles, and defaults'
  );

  // ============================================================================
  // 8. MALFORMED CONFIGURATION REJECTION
  // ============================================================================
  console.log('\n--- Suite 4: Validation & Malformed Configuration Rejection ---');

  // Test missing ID
  let missingIdRejected = false;
  try {
    service.validateEntry({
      dimension: 'QUESTION_STYLE',
      code: 'TEST',
      displayLabel: 'Test',
      sortOrder: 1,
      isActive: true,
      isDefault: false,
    });
  } catch (err: any) {
    missingIdRejected = err instanceof QuestionConfigError && err.code === 'MISSING_REQUIRED_FIELD';
  }
  assert(missingIdRejected, 'Validation: Rejects entry with missing "id"');

  // Test missing dimension
  let missingDimRejected = false;
  try {
    service.validateEntry({
      id: 'CFG-TEST-001',
      code: 'TEST',
      displayLabel: 'Test',
      sortOrder: 1,
      isActive: true,
      isDefault: false,
    });
  } catch (err: any) {
    missingDimRejected = err instanceof QuestionConfigError && err.code === 'MISSING_REQUIRED_FIELD';
  }
  assert(missingDimRejected, 'Validation: Rejects entry with missing "dimension"');

  // Test unsupported dimension
  let unsupportedDimRejected = false;
  try {
    service.validateEntry({
      id: 'CFG-TEST-001',
      dimension: 'ARBITRARY_DIMENSION',
      code: 'TEST',
      displayLabel: 'Test',
      sortOrder: 1,
      isActive: true,
      isDefault: false,
    });
  } catch (err: any) {
    unsupportedDimRejected = err instanceof QuestionConfigError && err.code === 'UNSUPPORTED_DIMENSION';
  }
  assert(unsupportedDimRejected, 'Validation: Rejects entry with unsupported dimension');

  // Test missing code
  let missingCodeRejected = false;
  try {
    service.validateEntry({
      id: 'CFG-TEST-001',
      dimension: 'QUESTION_STYLE',
      displayLabel: 'Test',
      sortOrder: 1,
      isActive: true,
      isDefault: false,
    });
  } catch (err: any) {
    missingCodeRejected = err instanceof QuestionConfigError && err.code === 'MISSING_REQUIRED_FIELD';
  }
  assert(missingCodeRejected, 'Validation: Rejects entry with missing "code"');

  // Test missing displayLabel
  let missingLabelRejected = false;
  try {
    service.validateEntry({
      id: 'CFG-TEST-001',
      dimension: 'QUESTION_STYLE',
      code: 'TEST',
      sortOrder: 1,
      isActive: true,
      isDefault: false,
    });
  } catch (err: any) {
    missingLabelRejected = err instanceof QuestionConfigError && err.code === 'MISSING_REQUIRED_FIELD';
  }
  assert(missingLabelRejected, 'Validation: Rejects entry with missing "display_label"');

  // ============================================================================
  // 9. EMPTY CONFIGURATION HANDLING (NO SILENT MOCK FALLBACK)
  // ============================================================================
  console.log('\n--- Suite 5: Empty Configuration Contract ---');

  mockRepo.setRecords([]);
  service.invalidateCache();

  let emptyConfigErrorThrown = false;
  let emptyConfigErrorCode = '';
  try {
    await service.loadAllConfig();
  } catch (err: any) {
    emptyConfigErrorThrown = true;
    emptyConfigErrorCode = err.code;
  }

  assert(
    emptyConfigErrorThrown && emptyConfigErrorCode === 'EMPTY_CONFIGURATION',
    'Empty configuration: Throws explicit EMPTY_CONFIGURATION error; does NOT silently return fake data'
  );

  // ============================================================================
  // 10. CACHE BEHAVIOR (60s TTL AND INVALIDATION)
  // ============================================================================
  console.log('\n--- Suite 6: Cache Mechanics ---');

  // Restore test data
  mockRepo.setRecords(testData);
  service.invalidateCache();

  const load1 = await service.loadAllConfig();
  // Modify repository underlying records
  mockRepo.setRecords([
    {
      id: 'CFG-STY-999',
      dimension: 'QUESTION_STYLE',
      code: 'NEW_STYLE',
      displayLabel: 'New Style',
      sortOrder: 99,
      isActive: true,
      isDefault: false,
      updatedAt: '2026-09-13T04:30:00.000Z',
    },
  ]);

  // Load without invalidateCache -> Should return cached entries
  const load2 = await service.loadAllConfig();
  assert(
    load2.length === load1.length && load2[0].id === 'CFG-STY-001',
    'Cache: Second load within TTL returns cached entries without hitting repository'
  );

  // Invalidate cache -> Should reload updated records
  service.invalidateCache();
  const load3 = await service.loadAllConfig();
  assert(
    load3.length === 1 && load3[0].id === 'CFG-STY-999',
    'Cache invalidation: invalidateCache forces reload of updated records'
  );

  // ============================================================================
  // 11. NO ACCIDENTAL WRITES TO EXISTING WORKSHEETS
  // ============================================================================
  console.log('\n--- Suite 7: Worksheet Isolation & Write Safety ---');

  assert(
    questionConfigRepository.getSheetName() === 'QUESTION_CONFIG',
    'Repository isolation: questionConfigRepository targets ONLY "QUESTION_CONFIG"'
  );

  // ============================================================================
  // 12. EXISTING REPOSITORY REGRESSION ASSURANCE
  // ============================================================================
  console.log('\n--- Suite 8: Existing Repositories Regression Guarantees ---');

  assert(
    topicsRepository.getSheetName() === 'TOPICS',
    'Regression check: topicsRepository remains bound to TOPICS'
  );

  assert(
    subtopicsRepository.getSheetName() === 'SUBTOPICS',
    'Regression check: subtopicsRepository remains bound to SUBTOPICS'
  );

  assert(
    questionsRepository.getSheetName() === 'QUESTIONS',
    'Regression check: questionsRepository remains bound to QUESTIONS'
  );

  assert(
    sequencesRepository.getSheetName() === 'SEQUENCES',
    'Regression check: sequencesRepository remains bound to SEQUENCES'
  );

  assert(
    usersRepository.getSheetName() === 'USERS',
    'Regression check: usersRepository remains bound to USERS'
  );

  // Clean up
  QuestionConfigService.resetInstance();

  console.log('\n================================================================');
  console.log(`QUESTION_CONFIG INFRASTRUCTURE TESTS COMPLETE: ${passedTests}/${totalTests} PASS`);
  console.log('================================================================\n');

  if (passedTests !== totalTests) {
    throw new Error(`Test failure: Only ${passedTests} of ${totalTests} tests passed.`);
  }

  return { passedTests, totalTests };
}

// Auto-run if executed directly
if (process.argv[1]?.includes('question-config-infrastructure.test')) {
  runQuestionConfigInfrastructureTests().catch((err) => {
    console.error('Fatal error during test run:', err);
    process.exit(1);
  });
}
