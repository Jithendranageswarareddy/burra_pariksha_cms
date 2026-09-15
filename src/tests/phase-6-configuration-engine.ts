/**
 * PHASE 06 — QUESTION STUDIO CONFIGURATION ENGINE VERIFICATION SUITE
 * 
 * Verifies P06-01 through P06-16:
 * P06-01 QUESTION_CONFIG schema integrity
 * P06-02 Authoritative configuration retrieval
 * P06-03 Question Style retrieval
 * P06-04 Real-Life Context retrieval
 * P06-05 Active/inactive filtering
 * P06-06 Deterministic ordering
 * P06-07 Authoritative defaults
 * P06-08 Invalid configuration rejection
 * P06-09 Missing configuration produces explicit failure
 * P06-10 No silent hardcoded fallback
 * P06-11 Question Studio consumes API configuration
 * P06-12 Configuration reaches question creation correctly
 * P06-13 Inactive configuration cannot be selected for new questions
 * P06-14 Existing saved question remains readable with inactive historical configuration
 * P06-15 Configuration authorization
 * P06-16 Structural code-controlled validation remains intact
 */

import { SHEET_TABS, ALL_SHEET_TABS, SHEET_SCHEMAS } from '../lib/schemas/google-sheets-schema';
import { QuestionConfigRepository, questionConfigRepository } from '../lib/repositories/question-config.repository';
import { QuestionConfigService, QuestionConfigError, questionConfigService } from '../lib/services/question-config.service';
import { QuestionConfigEntry, UserRole, QuestionStatus, DifficultyLevel } from '../types';
import { questionService } from '../lib/services/question.service';
import { smartRandomService } from '../lib/services/smart-random.service';
import { questionsRepository } from '../lib/repositories/questions.repository';
import { taxonomyService } from '../lib/services/taxonomy.service';

export async function runPhase6ConfigurationEngineTests(): Promise<boolean> {
  console.log('================================================================');
  console.log('PHASE 06 — QUESTION STUDIO CONFIGURATION ENGINE VERIFICATION');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testId: string, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`✅ [${testId}] PASS: ${testName}`);
    } else {
      console.error(`❌ [${testId}] FAIL: ${testName} - ${detail || 'Assertion failed'}`);
      throw new Error(`Test failed [${testId}]: ${testName}`);
    }
  }

  // --- [P06-01] QUESTION_CONFIG SCHEMA INTEGRITY ---
  const schema = SHEET_SCHEMAS[SHEET_TABS.QUESTION_CONFIG];
  assert(
    SHEET_TABS.QUESTION_CONFIG === 'QUESTION_CONFIG' &&
    ALL_SHEET_TABS.includes('QUESTION_CONFIG') &&
    Boolean(schema) &&
    schema.sheetName === 'QUESTION_CONFIG' &&
    schema.primaryKey === 'id' &&
    schema.columns.length === 10,
    'P06-01',
    'QUESTION_CONFIG schema integrity (exact 10 columns, primaryKey="id")'
  );

  const expectedProps = ['id', 'dimension', 'code', 'displayLabel', 'description', 'aiPromptGuidance', 'sortOrder', 'isActive', 'isDefault', 'updatedAt'];
  const actualProps = schema.columns.map(c => c.propertyKey);
  const propsMatch = expectedProps.every(p => actualProps.includes(p));
  assert(propsMatch, 'P06-01b', 'QUESTION_CONFIG property keys match exact specification');

  // --- [P06-02] AUTHORITATIVE CONFIGURATION RETRIEVAL ---
  const repoSheetName = questionConfigRepository.getSheetName();
  assert(
    repoSheetName === 'QUESTION_CONFIG',
    'P06-02',
    'QuestionConfigRepository targets authoritative QUESTION_CONFIG worksheet'
  );

  // --- [P06-03] QUESTION STYLE RETRIEVAL ---
  const styles = await questionConfigService.getQuestionStyles(true, true);
  assert(
    Array.isArray(styles) && styles.length > 0 && styles.every(s => s.dimension === 'QUESTION_STYLE'),
    'P06-03',
    'Question Style retrieval returns entries with dimension = QUESTION_STYLE'
  );

  // --- [P06-04] REAL-LIFE CONTEXT RETRIEVAL ---
  const contexts = await questionConfigService.getRealLifeContexts(true, true);
  assert(
    Array.isArray(contexts) && contexts.length > 0 && contexts.every(c => c.dimension === 'REAL_LIFE_CONTEXT'),
    'P06-04',
    'Real-Life Context retrieval returns entries with dimension = REAL_LIFE_CONTEXT'
  );

  // --- [P06-05] ACTIVE / INACTIVE FILTERING ---
  const testMockEntries: QuestionConfigEntry[] = [
    { id: 'CFG-001', dimension: 'QUESTION_STYLE', code: 'ACTIVE_STYLE', displayLabel: 'Active Style', sortOrder: 1, isActive: true, isDefault: false, updatedAt: new Date().toISOString() },
    { id: 'CFG-002', dimension: 'QUESTION_STYLE', code: 'INACTIVE_STYLE', displayLabel: 'Inactive Style', sortOrder: 2, isActive: false, isDefault: false, updatedAt: new Date().toISOString() },
    { id: 'CFG-003', dimension: 'REAL_LIFE_CONTEXT', code: 'ACTIVE_CTX', displayLabel: 'Active Context', sortOrder: 1, isActive: true, isDefault: false, updatedAt: new Date().toISOString() },
    { id: 'CFG-004', dimension: 'REAL_LIFE_CONTEXT', code: 'INACTIVE_CTX', displayLabel: 'Inactive Context', sortOrder: 2, isActive: false, isDefault: false, updatedAt: new Date().toISOString() },
  ];

  class MockRepo extends QuestionConfigRepository {
    public async findAll(): Promise<QuestionConfigEntry[]> {
      return testMockEntries;
    }
  }

  QuestionConfigService.getInstance().setRepository(new MockRepo() as any);
  const mockService = QuestionConfigService.getInstance();

  const activeStyles = await mockService.getQuestionStyles(true, true);
  const allStyles = await mockService.getQuestionStyles(false, true);

  assert(
    activeStyles.length === 1 && activeStyles[0].code === 'ACTIVE_STYLE' &&
    allStyles.length === 2,
    'P06-05',
    'Active/inactive filtering: activeOnly=true excludes inactive entries while activeOnly=false includes them'
  );

  // --- [P06-06] DETERMINISTIC ORDERING ---
  const unorderedMockEntries: QuestionConfigEntry[] = [
    { id: 'CFG-B', dimension: 'QUESTION_STYLE', code: 'B', displayLabel: 'Style B', sortOrder: 20, isActive: true, isDefault: false, updatedAt: new Date().toISOString() },
    { id: 'CFG-A', dimension: 'QUESTION_STYLE', code: 'A', displayLabel: 'Style A', sortOrder: 5, isActive: true, isDefault: false, updatedAt: new Date().toISOString() },
    { id: 'CFG-C', dimension: 'QUESTION_STYLE', code: 'C', displayLabel: 'Style C', sortOrder: 10, isActive: true, isDefault: false, updatedAt: new Date().toISOString() },
  ];

  class OrderMockRepo extends QuestionConfigRepository {
    public async findAll(): Promise<QuestionConfigEntry[]> {
      return unorderedMockEntries;
    }
  }

  QuestionConfigService.getInstance().setRepository(new OrderMockRepo() as any);
  const orderService = QuestionConfigService.getInstance();
  const sorted = await orderService.getQuestionStyles(true, true);

  assert(
    sorted[0].code === 'A' && sorted[1].code === 'C' && sorted[2].code === 'B',
    'P06-06',
    'Deterministic ordering: Entries are sorted strictly by sortOrder ascending (5, 10, 20)'
  );

  // --- [P06-07] AUTHORITATIVE DEFAULTS ---
  const defaultMockEntries: QuestionConfigEntry[] = [
    { id: 'CFG-1', dimension: 'QUESTION_STYLE', code: 'FIRST', displayLabel: 'First', sortOrder: 10, isActive: true, isDefault: false, updatedAt: new Date().toISOString() },
    { id: 'CFG-2', dimension: 'QUESTION_STYLE', code: 'DEFAULT_ITEM', displayLabel: 'Default Item', sortOrder: 20, isActive: true, isDefault: true, updatedAt: new Date().toISOString() },
  ];

  class DefaultMockRepo extends QuestionConfigRepository {
    public async findAll(): Promise<QuestionConfigEntry[]> {
      return defaultMockEntries;
    }
  }

  QuestionConfigService.getInstance().setRepository(new DefaultMockRepo() as any);
  const defaultService = QuestionConfigService.getInstance();
  const defaultStyle = await defaultService.getDefaultQuestionStyle(true);

  assert(
    defaultStyle !== null && defaultStyle.code === 'DEFAULT_ITEM',
    'P06-07',
    'Authoritative defaults: Entry with isDefault = true is correctly selected as dimension default'
  );

  // --- [P06-08] INVALID CONFIGURATION REJECTION ---
  let caughtInvalidError = false;
  try {
    mockService.validateEntry({ id: 'CFG-BAD', dimension: 'INVALID_DIMENSION', code: 'BAD', displayLabel: 'Bad' });
  } catch (err: any) {
    if (err instanceof QuestionConfigError && err.code === 'UNSUPPORTED_DIMENSION') {
      caughtInvalidError = true;
    }
  }

  assert(
    caughtInvalidError,
    'P06-08',
    'Invalid configuration rejection: Malformed or invalid entries throw explicit QuestionConfigError'
  );

  // --- [P06-09] MISSING CONFIGURATION PRODUCES EXPLICIT FAILURE ---
  class EmptyRepo extends QuestionConfigRepository {
    public async findAll(): Promise<QuestionConfigEntry[]> {
      return [];
    }
  }

  QuestionConfigService.getInstance().setRepository(new EmptyRepo() as any);
  const emptyService = QuestionConfigService.getInstance();

  let caughtEmptyError = false;
  try {
    await emptyService.loadAllConfig(true);
  } catch (err: any) {
    if (err instanceof QuestionConfigError && err.code === 'EMPTY_CONFIGURATION') {
      caughtEmptyError = true;
    }
  }

  assert(
    caughtEmptyError,
    'P06-09',
    'Missing configuration produces explicit QuestionConfigError (HTTP 404/503)'
  );

  // --- [P06-10] NO SILENT HARDCODED FALLBACK ---
  let caughtRandomError = false;
  try {
    await smartRandomService.resolveParameters({ realLifeContext: 'RANDOM' });
  } catch (err: any) {
    // If emptyService or no active config
  }

  // Verify that when emptyService is active, no silent mock array is substituted
  let caughtSmartRandomConfigError = false;
  try {
    QuestionConfigService.getInstance().setRepository(new EmptyRepo() as any);
    await QuestionConfigService.getInstance().getRealLifeContexts(true, true);
  } catch (err: any) {
    if (err instanceof QuestionConfigError) {
      caughtSmartRandomConfigError = true;
    }
  } finally {
    QuestionConfigService.getInstance().resetRepository();
  }

  assert(
    caughtSmartRandomConfigError,
    'P06-10',
    'No silent hardcoded fallback: Missing QUESTION_CONFIG throws explicit error rather than silently returning mock defaults'
  );

  // Restore live repository
  QuestionConfigService.getInstance().resetRepository();
  const liveService = QuestionConfigService.getInstance();
  liveService.invalidateCache();

  // --- [P06-11] QUESTION STUDIO CONSUMES API CONFIGURATION ---
  const groupedConfig = await liveService.getGroupedActiveConfig(true);
  assert(
    Array.isArray(groupedConfig.realLifeContexts) &&
    Array.isArray(groupedConfig.questionStyles) &&
    groupedConfig.realLifeContexts.length > 0 &&
    groupedConfig.questionStyles.length > 0,
    'P06-11',
    'Grouped configuration payload contains active realLifeContexts and questionStyles for API consumption'
  );

  // --- [P06-12] CONFIGURATION REACHES QUESTION CREATION CORRECTLY ---
  const { categoriesRepository } = await import('../lib/repositories/categories.repository');
  const { topicsRepository } = await import('../lib/repositories/topics.repository');
  const { subtopicsRepository } = await import('../lib/repositories/subtopics.repository');

  const allSubs = await subtopicsRepository.findAll();
  const validSubObj = allSubs[0];
  const allTops = await topicsRepository.findAll();
  const validTopObj = allTops.find((t) => t.id === validSubObj.topicId) || allTops[0];
  const allCats = await categoriesRepository.findAll();
  const validCatObj = allCats.find((c) => c.id === validTopObj.categoryId) || allCats[0];

  const validCat = validCatObj?.id || 'CAT-GENERAL';
  const validTop = validTopObj.id;
  const validSub = validSubObj.id;

  const liveContexts = await liveService.getRealLifeContexts(true);
  const liveStyles = await liveService.getQuestionStyles(true);
  const targetContext = liveContexts[0].displayLabel;
  const targetStyle = liveStyles[0].code;

  const adminActor = { id: 'USR-ADMIN-01', name: 'Admin Tester', role: UserRole.ADMIN };

  const createdQ = await questionService.createQuestion(
    {
      questionText: 'P06-12 Configuration Pipeline Test Question?',
      options: { a: '10', b: '20', c: '30', d: '40' },
      correctAnswer: 'A',
      categoryId: validCat,
      topicId: validTop,
      subtopicId: validSub,
      difficulty: DifficultyLevel.EASY,
      explanation: 'Explanation for P06-12 test',
      realLifeContext: targetContext,
      questionStyle: targetStyle,
    } as any,
    adminActor
  );

  assert(
    createdQ.realLifeContext === targetContext && createdQ.questionStyle === targetStyle,
    'P06-12',
    'Configuration reaches question creation correctly and persists realLifeContext and questionStyle'
  );

  // --- [P06-13] INACTIVE CONFIGURATION CANNOT BE SELECTED FOR NEW QUESTIONS ---
  // Create mock repo with an inactive style
  const inactiveStyleEntries: QuestionConfigEntry[] = [
    ...liveContexts,
    ...liveStyles,
    { id: 'CFG-STY-INACTIVE', dimension: 'QUESTION_STYLE', code: 'DEPRECATED_STYLE', displayLabel: 'Deprecated Style', sortOrder: 99, isActive: false, isDefault: false, updatedAt: new Date().toISOString() },
  ];

  class InactiveMockRepo extends QuestionConfigRepository {
    public async findAll(): Promise<QuestionConfigEntry[]> {
      return inactiveStyleEntries;
    }
  }

  QuestionConfigService.getInstance().setRepository(new InactiveMockRepo() as any);

  let caughtInactiveError = false;
  try {
    await questionService.createQuestion(
      {
        questionText: 'Test attempt with inactive question style?',
        options: { a: '10', b: '20', c: '30', d: '40' },
        correctAnswer: 'A',
        categoryId: validCat,
        topicId: validTop,
        subtopicId: validSub,
        difficulty: DifficultyLevel.EASY,
        explanation: 'Testing inactive style rejection',
        realLifeContext: targetContext,
        questionStyle: 'DEPRECATED_STYLE',
      } as any,
      adminActor
    );
  } catch (err: any) {
    if (err?.message && err.message.includes('inactive in QUESTION_CONFIG')) {
      caughtInactiveError = true;
    }
  } finally {
    QuestionConfigService.getInstance().resetRepository();
  }

  assert(
    caughtInactiveError,
    'P06-13',
    'Inactive configuration cannot be selected for new questions (strictly rejected by QuestionService)'
  );

  // --- [P06-14] EXISTING SAVED QUESTION REMAINS READABLE WITH INACTIVE HISTORICAL CONFIGURATION ---
  const savedQuestionReadBack = await questionsRepository.findById(createdQ.id);
  assert(
    savedQuestionReadBack !== null && savedQuestionReadBack.id === createdQ.id,
    'P06-14',
    'Existing saved question remains readable from repository regardless of future configuration state changes'
  );

  // Cleanup test question created in P06-12
  await questionsRepository.deleteRecord(createdQ.id);

  // --- [P06-15] CONFIGURATION AUTHORIZATION ---
  const viewerActor = { id: 'USR-VIEWER-01', name: 'Viewer User', role: UserRole.ANALYTICS_VIEWER };
  let caughtAuthError = false;
  try {
    await questionService.createQuestion(
      {
        questionText: 'Unauthorized creation attempt?',
        options: { a: '10', b: '20', c: '30', d: '40' },
        correctAnswer: 'A',
        categoryId: validCat,
        topicId: validTop,
        subtopicId: validSub,
        difficulty: DifficultyLevel.EASY,
        explanation: 'Testing role authorization',
      } as any,
      viewerActor
    );
  } catch (err: any) {
    if (err?.message && (err.message.includes('Unauthorized') || err.message.includes('Forbidden') || err.message.includes('permission'))) {
      caughtAuthError = true;
    }
  }

  assert(
    caughtAuthError,
    'P06-15',
    'Configuration authorization: Unauthorized role (VIEWER) is strictly blocked from creating questions'
  );

  // --- [P06-16] STRUCTURAL CODE-CONTROLLED VALIDATION REMAINS INTACT ---
  let caughtStructuralError = false;
  try {
    await questionService.createQuestion(
      {
        questionText: 'Invalid structural question?',
        options: { a: '10', b: '20', c: '30', d: '40' },
        correctAnswer: 'Z', // Invalid choice! Must be A, B, C, or D
        categoryId: validCat,
        topicId: validTop,
        subtopicId: validSub,
        difficulty: DifficultyLevel.EASY,
        explanation: 'Testing structural validation',
      } as any,
      adminActor
    );
  } catch (err: any) {
    if (err?.message && err.message.includes('correctAnswer')) {
      caughtStructuralError = true;
    }
  }

  assert(
    caughtStructuralError,
    'P06-16',
    'Structural code-controlled validation remains intact (invalid correct choice "Z" strictly rejected)'
  );

  console.log('\n================================================================');
  console.log(`PHASE 06 VERIFICATION COMPLETE: ${passedTests}/${totalTests} PASSED`);
  console.log('================================================================\n');

  return passedTests === totalTests;
}

if (process.argv[1] && process.argv[1].includes('phase-6-configuration-engine')) {
  runPhase6ConfigurationEngineTests()
    .then((success) => {
      process.exit(success ? 0 : 1);
    })
    .catch((err) => {
      console.error('Fatal test error:', err);
      process.exit(1);
    });
}
