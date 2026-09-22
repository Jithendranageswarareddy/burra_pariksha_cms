/**
 * A-02.4: CREATION PIPELINE CONVERGENCE, REFERENCE INTEGRITY & SEQUENCE FAIL-CLOSED TEST SUITE
 * 
 * Verifies all 3 core stabilization contracts of A-02.4:
 * 1. Legacy Pipeline Convergence: questionService.createQuestion delegates to canonical createQuestionFromRequest.
 * 2. Reference Integrity: contentMasterId existence validation against contentMastersRepository before Question ID allocation.
 * 3. Fail-Closed Sequence Allocation: sequencesRepository.getMaxExistingId throws SequenceAllocationError on read errors.
 */

import { questionService, QuestionService } from '../lib/services/question.service';
import { contentMasterService } from '../lib/services/content-master.service';
import { idService } from '../lib/services/id.service';
import { MultiLayerVerificationEngine } from '../lib/validation/multi-layer-verification.engine';
import { taxonomyService } from '../lib/services/taxonomy.service';
import { smartRandomService } from '../lib/services/smart-random.service';
import { questionConfigService } from '../lib/services/question-config.service';
import { questionsRepository } from '../lib/repositories/questions.repository';
import { contentMastersRepository } from '../lib/repositories/content-masters.repository';
import { sequencesRepository } from '../lib/repositories/sequences.repository';
import { auditLogRepository } from '../lib/repositories/audit-log.repository';
import { workflowService, auditService } from '../lib/services/audit.service';
import { validationsRepository } from '../lib/repositories/validations.repository';
import { ReferenceIntegrityError, SequenceAllocationError, ValidationError } from '../lib/google-sheets/errors';
import { SEQUENCE_ENTITIES } from '../lib/schemas/google-sheets-schema';
import { UserRole, Question } from '../types';

export async function runPipelineConvergenceSequenceResilienceTests() {
  console.log('========================================================================');
  console.log('A-02.4: PIPELINE CONVERGENCE & SEQUENCE FAIL-CLOSED TEST SUITE');
  console.log('========================================================================\n');

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

  // Ensure test mode isolation is active
  process.env.NODE_ENV = 'test';
  delete process.env.ALLOW_LIVE_TEST_WRITES;

  // Track operations
  let allocatedQuestionCount = 0;
  let allocatedContentMasterCount = 0;
  let persistedQuestions: Question[] = [];
  let persistedContentMasters: any[] = [];
  let compensatedContentMasterDeletions: string[] = [];
  let canonicalRequestInvocations: any[] = [];

  // Backup originals
  const origAllocateQuestionId = idService.allocateQuestionId;
  const origCreateContentMaster = contentMasterService.createContentMaster;
  const origContentMasterFindById = contentMastersRepository.findById;
  const origVerify = MultiLayerVerificationEngine.verify;
  const origValidateTaxonomy = taxonomyService.validateQuestionTaxonomy;
  const origResolveParams = smartRandomService.resolveParameters;
  const origGetRealLifeContexts = questionConfigService.getRealLifeContexts;
  const origGetQuestionStyles = questionConfigService.getQuestionStyles;
  const origGetDefaultQuestionStyle = questionConfigService.getDefaultQuestionStyle;
  const origQuestionsAppend = questionsRepository.appendRecord;
  const origQuestionsFindAll = questionsRepository.findAll;
  const origContentMastersDelete = contentMastersRepository.delete;
  const origWorkflowRecord = workflowService.recordTransition;
  const origAuditLog = auditService.log;
  const origValidationsSave = validationsRepository.saveValidationResult;
  const origCreateQuestionFromRequest = questionService.createQuestionFromRequest;
  const origGetSequence = sequencesRepository.getSequence;

  try {
    // Standard mock setup
    idService.allocateQuestionId = async () => {
      allocatedQuestionCount++;
      return `BP-Q-${allocatedQuestionCount.toString().padStart(6, '0')}`;
    };

    contentMasterService.createContentMaster = async (payload: any) => {
      allocatedContentMasterCount++;
      const master = {
        id: `BP-CNT-${allocatedContentMasterCount.toString().padStart(6, '0')}`,
        ...payload,
      };
      persistedContentMasters.push(master);
      return master;
    };

    contentMastersRepository.findById = async (id: string) => {
      if (id === 'BP-CNT-000042') {
        return {
          id: 'BP-CNT-000042',
          title: 'Existing Content Master',
          primaryQuestionId: 'BP-Q-000042',
          categoryId: 'CAT-1',
          topicId: 'TP-1',
          subtopicId: 'STP-1',
        } as any;
      }
      return null;
    };

    contentMastersRepository.delete = async (id: string): Promise<boolean> => {
      compensatedContentMasterDeletions.push(id);
      return true;
    };

    MultiLayerVerificationEngine.verify = async (q: any) => ({
      aggregatedStatus: 'VERIFIED',
      canSave: true,
      canonicalValidationStatus: 'VERIFIED',
      confidenceScore: 98,
      id: `VAL-${Date.now()}`,
      overallErrors: [],
      overallWarnings: [],
      layerList: [],
      layers: {} as any,
      timestamp: new Date().toISOString(),
      humanReviewState: 'NOT_REQUIRED',
    } as any);

    taxonomyService.validateQuestionTaxonomy = async () => ({
      category: { id: 'CAT-1', name: 'General Science' } as any,
      topic: { id: 'TP-1', name: 'Physics' } as any,
      subtopic: { id: 'STP-1', name: 'Kinematics' } as any,
    });

    smartRandomService.resolveParameters = async (params: any) => ({
      topicId: params.topicId,
      subtopicId: params.subtopicId,
      topicName: 'Physics',
      subtopicName: 'Kinematics',
      categoryId: params.categoryId || 'CAT-1',
      categoryName: 'General Science',
      difficulty: params.difficulty || 'MEDIUM',
      realLifeContext: 'Kinematics of a moving train',
      challengeType: 'ABCD',
      presentationType: 'Text',
      language: 'TELUGU',
      generationMode: 'SUBTOPIC',
    } as any);

    questionConfigService.getRealLifeContexts = async () => [
      { code: 'DEFAULT', displayLabel: 'Default Context', isActive: true } as any,
    ];
    questionConfigService.getQuestionStyles = async () => [
      { code: 'STORY_BASED', displayLabel: 'Story Based', isActive: true } as any,
    ];
    questionConfigService.getDefaultQuestionStyle = async () =>
      ({ code: 'STORY_BASED', displayLabel: 'Story Based', isActive: true } as any);

    questionsRepository.appendRecord = async (q: Question) => {
      persistedQuestions.push(q);
      return q;
    };

    workflowService.recordTransition = async (): Promise<any> => ({} as any);
    auditService.log = async (): Promise<any> => ({} as any);
    validationsRepository.saveValidationResult = async () => ({} as any);

    // Baseline Question creation input
    const baseInput = {
      categoryId: 'CAT-1',
      topicId: 'TP-1',
      subtopicId: 'STP-1',
      difficulty: 'MEDIUM',
      questionText: 'What is the speed of light in vacuum?',
      options: {
        a: '300,000 km/s',
        b: '150,000 km/s',
        c: '100,000 km/s',
        d: '500,000 km/s',
      },
      correctAnswer: 'A' as const,
      explanation: 'The speed of light in vacuum is approximately 300,000 kilometers per second.',
    };

    // =========================================================================
    // SECTION 1: LEGACY PIPELINE CONVERGENCE TESTS
    // =========================================================================

    // Test 1: createQuestion delegates to createQuestionFromRequest
    let delegationOccurred: boolean = false;
    questionService.createQuestionFromRequest = async (payload: any, actor: any) => {
      delegationOccurred = true;
      canonicalRequestInvocations.push({ payload, actor });
      return origCreateQuestionFromRequest.call(questionService, payload, actor);
    };

    const createdViaLegacy = await questionService.createQuestion({
      ...baseInput,
      questionText: 'Convergence test question 1',
    });

    assert(delegationOccurred, 'createQuestion successfully delegates to createQuestionFromRequest');
    assert(createdViaLegacy.id.startsWith('BP-Q-'), 'Delegated createQuestion produces valid canonical Question ID');
    assert(createdViaLegacy.questionText === 'Convergence test question 1', 'Delegated createQuestion preserves questionText');
    assert(canonicalRequestInvocations.length === 1, 'createQuestion invokes createQuestionFromRequest exactly once');
    assert(canonicalRequestInvocations[0].payload.creationMode === 'manual', 'createQuestion sets creationMode to "manual"');

    // Restore origCreateQuestionFromRequest for remainder of tests
    questionService.createQuestionFromRequest = origCreateQuestionFromRequest;

    // Test 2: createQuestion respects Idempotency through canonical pipeline
    const idempotentKey = `conv-idem-${Date.now()}`;
    const firstCall = await questionService.createQuestion({
      ...baseInput,
      questionText: 'Idempotent legacy convergence question',
      idempotencyKey: idempotentKey,
    } as any);

    const initialAllocatedQuestions = allocatedQuestionCount;

    const secondCall = await questionService.createQuestion({
      ...baseInput,
      questionText: 'Idempotent legacy convergence question',
      idempotencyKey: idempotentKey,
    } as any);

    assert(firstCall.id === secondCall.id, 'createQuestion idempotent replay returns identical Question ID');
    assert(allocatedQuestionCount === initialAllocatedQuestions, 'createQuestion idempotent replay allocates zero new Question IDs');

    // Test 3: createQuestion triggers compensation on persistence error through canonical pipeline
    questionsRepository.appendRecord = async () => {
      throw new Error('Simulated Sheets append failure for legacy convergence');
    };

    let compensationThrew = false;
    try {
      await questionService.createQuestion({
        ...baseInput,
        questionText: 'Compensation test question via legacy createQuestion',
      });
    } catch (err: any) {
      compensationThrew = true;
    }

    assert(compensationThrew === true, 'createQuestion throws on persistence error');
    assert(compensatedContentMasterDeletions.length > 0, 'createQuestion triggers Content Master compensation rollback');

    // Restore appendRecord
    questionsRepository.appendRecord = async (q: Question) => {
      persistedQuestions.push(q);
      return q;
    };

    // =========================================================================
    // SECTION 2: REFERENCE INTEGRITY TESTS
    // =========================================================================

    // Test 4: Passing non-existent contentMasterId throws ReferenceIntegrityError
    const allocBeforeRefIntegrity = allocatedQuestionCount;
    let refIntegrityThrew = false;
    let thrownError: any = null;

    try {
      await questionService.createQuestionFromRequest({
        creationMode: 'manual',
        ...baseInput,
        questionText: 'Non-existent master test question',
        contentMasterId: 'BP-CNT-NONEXISTENT-999',
      });
    } catch (err: any) {
      refIntegrityThrew = true;
      thrownError = err;
    }

    assert(refIntegrityThrew === true, 'Non-existent contentMasterId throws error');
    assert(thrownError instanceof ReferenceIntegrityError, 'Thrown error is an instance of ReferenceIntegrityError');
    assert(thrownError.statusCode === 400, 'ReferenceIntegrityError has statusCode 400');
    assert(
      thrownError.message.includes('BP-CNT-NONEXISTENT-999'),
      'ReferenceIntegrityError includes the missing contentMasterId in message'
    );
    assert(
      allocatedQuestionCount === allocBeforeRefIntegrity,
      'No Question ID sequence allocation occurred before ReferenceIntegrity check failure'
    );

    // Test 5: Passing non-existent contentMasterId via legacy createQuestion also throws ReferenceIntegrityError
    let legacyRefIntegrityThrew = false;
    try {
      await questionService.createQuestion({
        ...baseInput,
        questionText: 'Legacy non-existent master test question',
        contentMasterId: 'BP-CNT-DOES-NOT-EXIST-000',
      } as any);
    } catch (err: any) {
      legacyRefIntegrityThrew = true;
      assert(err instanceof ReferenceIntegrityError, 'Legacy createQuestion throws ReferenceIntegrityError on invalid contentMasterId');
    }
    assert(legacyRefIntegrityThrew === true, 'Legacy createQuestion enforced ReferenceIntegrity check');

    // Test 6: Passing existing contentMasterId succeeds without creating new Content Master
    const initialMastersCount = persistedContentMasters.length;
    const initialAllocatedMasters = allocatedContentMasterCount;

    const validMasterQuestion = await questionService.createQuestionFromRequest({
      creationMode: 'manual',
      ...baseInput,
      questionText: 'Valid master test question',
      contentMasterId: 'BP-CNT-000042',
    });

    assert(validMasterQuestion.contentMasterId === 'BP-CNT-000042', 'Question successfully associated with existing Content Master');
    assert(validMasterQuestion.contentId === 'BP-CNT-000042', 'Question contentId matches contentMasterId');
    assert(
      allocatedContentMasterCount === initialAllocatedMasters,
      'No new Content Master was created when valid contentMasterId provided'
    );
    assert(
      persistedContentMasters.length === initialMastersCount,
      'No Content Master appended to repository when valid contentMasterId provided'
    );

    // =========================================================================
    // SECTION 3: SEQUENCE ALLOCATION FAIL-CLOSED TESTS
    // =========================================================================

    // Test 7: sequencesRepository.getMaxExistingId throws SequenceAllocationError on read failure
    questionsRepository.findAll = async () => {
      throw new Error('Google Sheets API 503 Backend Unavailable / Network Disconnect');
    };

    let sequenceErrorThrew = false;
    let sequenceError: any = null;

    try {
      await sequencesRepository.getMaxExistingId(SEQUENCE_ENTITIES.QUESTION);
    } catch (err: any) {
      sequenceErrorThrew = true;
      sequenceError = err;
    }

    assert(sequenceErrorThrew === true, 'getMaxExistingId throws error on repository read failure');
    assert(sequenceError instanceof SequenceAllocationError, 'getMaxExistingId error is instance of SequenceAllocationError');
    assert(
      sequenceError.message.includes('QUESTION'),
      'SequenceAllocationError mentions the entityType ("QUESTION")'
    );
    assert(
      sequenceError.message.includes('503 Backend Unavailable'),
      'SequenceAllocationError preserves underlying cause'
    );

    // Test 8: allocateNextNumber fails closed when getMaxExistingId fails (never falls back to 0 or 1)
    let allocateFailedClosed = false;
    try {
      await sequencesRepository.allocateNextNumber(SEQUENCE_ENTITIES.QUESTION);
    } catch (err: any) {
      allocateFailedClosed = true;
      assert(err instanceof SequenceAllocationError, 'allocateNextNumber rethrows SequenceAllocationError');
    }
    assert(allocateFailedClosed === true, 'allocateNextNumber fails closed when record scanning fails');

    // Test 9: getMaxExistingId properly scans and calculates maximum when repository succeeds
    questionsRepository.findAll = async () => [
      { id: 'BP-Q-000010' } as any,
      { id: 'BP-Q-000025' } as any,
      { id: 'BP-Q-000007' } as any,
      { id: 'TEST-Q-999999' } as any, // non-canonical, ignored
    ];

    const maxQuestionId = await sequencesRepository.getMaxExistingId(SEQUENCE_ENTITIES.QUESTION);
    assert(maxQuestionId === 25, 'getMaxExistingId correctly calculates maximum valid canonical ID (25)');

    // Test 10: getMaxExistingId returns 0 safely for empty repository (no records)
    questionsRepository.findAll = async () => [];
    const emptyMax = await sequencesRepository.getMaxExistingId(SEQUENCE_ENTITIES.QUESTION);
    assert(emptyMax === 0, 'getMaxExistingId returns 0 when repository is completely empty (no error)');

    console.log('\n========================================================================');
    console.log(`A-02.4: ALL ${passed}/${total} TESTS PASSED PERFECTLY!`);
    console.log('========================================================================\n');

    return {
      success: true,
      total,
      passed,
      failed: total - passed,
    };
  } finally {
    // Restore all patched methods
    idService.allocateQuestionId = origAllocateQuestionId;
    contentMasterService.createContentMaster = origCreateContentMaster;
    contentMastersRepository.findById = origContentMasterFindById;
    MultiLayerVerificationEngine.verify = origVerify;
    taxonomyService.validateQuestionTaxonomy = origValidateTaxonomy;
    smartRandomService.resolveParameters = origResolveParams;
    questionConfigService.getRealLifeContexts = origGetRealLifeContexts;
    questionConfigService.getQuestionStyles = origGetQuestionStyles;
    questionConfigService.getDefaultQuestionStyle = origGetDefaultQuestionStyle;
    questionsRepository.appendRecord = origQuestionsAppend;
    questionsRepository.findAll = origQuestionsFindAll;
    contentMastersRepository.delete = origContentMastersDelete;
    workflowService.recordTransition = origWorkflowRecord;
    auditService.log = origAuditLog;
    validationsRepository.saveValidationResult = origValidationsSave;
    questionService.createQuestionFromRequest = origCreateQuestionFromRequest;
    sequencesRepository.getSequence = origGetSequence;
  }
}

// Direct execution support
if (import.meta.url === `file://${process.argv[1]}`) {
  runPipelineConvergenceSequenceResilienceTests()
    .then((result) => {
      if (!result.success) process.exit(1);
    })
    .catch((err) => {
      console.error('Fatal test failure:', err);
      process.exit(1);
    });
}
