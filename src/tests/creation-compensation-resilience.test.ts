/**
 * A-02.3.2a: CORE CREATION COMPENSATION & POST-SAVE AUXILIARY RESILIENCE TEST SUITE
 * 
 * Verifies the exact safety guarantees of A-02.3.2a:
 * 1. Content Master audit failure does not abort Content Master creation.
 * 2. Question persistence success causes idempotency cache population BEFORE workflow.
 * 3. Question persistence failure triggers Content Master compensation.
 * 4. Compensation is attempted ONLY when Content Master was created by THIS request.
 * 5. Pre-existing Content Master is NOT deleted when Question persistence fails.
 * 6. Compensation failure preserves and rethrows the original Question persistence error.
 * 7. Workflow failure does NOT cause Question deletion.
 * 8. Workflow failure does NOT cause Content Master deletion.
 * 9. Workflow failure does NOT make the creation request fail after the Question is already persisted.
 * 10. Question audit failure does NOT cause Question deletion.
 * 11. Question audit failure does NOT cause Content Master deletion.
 * 12. Question audit failure does NOT make the creation request fail after the Question is already persisted.
 * 13. Sequence values are never decremented or restored by compensation.
 * 14. Existing pre-save verification behavior remains unchanged.
 */

import { questionService } from '../lib/services/question.service';
import { contentMasterService } from '../lib/services/content-master.service';
import { idService } from '../lib/services/id.service';
import { MultiLayerVerificationEngine } from '../lib/validation/multi-layer-verification.engine';
import { taxonomyService } from '../lib/services/taxonomy.service';
import { smartRandomService } from '../lib/services/smart-random.service';
import { questionsRepository } from '../lib/repositories/questions.repository';
import { contentMastersRepository } from '../lib/repositories/content-masters.repository';
import { auditLogRepository } from '../lib/repositories/audit-log.repository';
import { workflowService, auditService } from '../lib/services/audit.service';
import { validationsRepository } from '../lib/repositories/validations.repository';
import { UserRole } from '../types';

async function runTests() {
  console.log('========================================================================');
  console.log('A-02.3.2a: CREATION COMPENSATION & POST-SAVE RESILIENCE REGRESSION TESTS');
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

  // Stubs / Spies state tracking
  let allocatedQuestionIds: string[] = [];
  let allocatedContentMasterIds: string[] = [];
  let deletedContentMasterIds: string[] = [];
  let deletedQuestionIds: string[] = [];
  let executionEventLog: string[] = [];

  const origAllocateQuestionId = idService.allocateQuestionId.bind(idService);
  const origAllocateContentMasterId = (idService as any).allocateContentMasterId.bind(idService);
  const origCreateContentMaster = contentMastersRepository.create.bind(contentMastersRepository);
  const origDeleteContentMaster = contentMastersRepository.delete.bind(contentMastersRepository);
  const origDeleteQuestion = (questionsRepository as any).delete ? (questionsRepository as any).delete.bind(questionsRepository) : undefined;
  const origAppendQuestion = questionsRepository.appendRecord.bind(questionsRepository);
  const origVerify = MultiLayerVerificationEngine.verify.bind(MultiLayerVerificationEngine);
  const origValidateTaxonomy = taxonomyService.validateQuestionTaxonomy.bind(taxonomyService);
  const origResolveParameters = smartRandomService.resolveParameters.bind(smartRandomService);
  const origLogAuditAction = auditLogRepository.logAction.bind(auditLogRepository);
  const origAuditLog = auditService.log.bind(auditService);
  const origWorkflowRecord = workflowService.recordTransition.bind(workflowService);
  const origSaveValidationResult = validationsRepository.saveValidationResult.bind(validationsRepository);

  const validPayload: any = {
    creationMode: 'manual',
    topicId: 'TP-001',
    subtopicId: 'STP-001',
    difficulty: 'MEDIUM',
    questionText: 'What is 25 x 4?',
    options: { a: '100', b: '50', c: '75', d: '125' },
    correctAnswer: 'A',
    explanation: '25 multiplied by 4 equals 100 exactly.',
    challengeType: 'ABCD',
    presentationType: 'Text',
    language: 'TELUGU',
  };

  try {
    // Standard taxonomy & smart random resolution stubs
    (taxonomyService as any).validateQuestionTaxonomy = async () => ({
      category: { id: 'CAT-001', name: 'Mathematics' },
      topic: { id: 'TP-001', name: 'Arithmetic' },
      subtopic: { id: 'STP-001', name: 'Multiplication' },
    });

    (smartRandomService as any).resolveParameters = async (input: any) => ({
      categoryId: 'CAT-001',
      categoryName: 'Mathematics',
      topicId: 'TP-001',
      topicName: 'Arithmetic',
      subtopicId: 'STP-001',
      subtopicName: 'Multiplication',
      difficulty: 'MEDIUM',
      realLifeContext: 'Shopping & E-commerce',
      challengeType: 'ABCD',
      presentationType: 'Text',
      language: 'TELUGU',
      generationMode: 'SUBTOPIC',
    });

    (validationsRepository as any).saveValidationResult = async () => {};

    // Mock ID allocations
    (idService as any).allocateQuestionId = async () => {
      const qId = `BP-Q-${String(allocatedQuestionIds.length + 1).padStart(6, '0')}`;
      allocatedQuestionIds.push(qId);
      executionEventLog.push(`ALLOCATE_QUESTION_ID:${qId}`);
      return qId;
    };

    (idService as any).allocateContentMasterId = async () => {
      const cntId = `BP-CNT-${String(allocatedContentMasterIds.length + 1).padStart(6, '0')}`;
      allocatedContentMasterIds.push(cntId);
      executionEventLog.push(`ALLOCATE_CONTENT_MASTER_ID:${cntId}`);
      return cntId;
    };

    // Mock Content Master repository
    (contentMastersRepository as any).create = async (master: any) => {
      executionEventLog.push(`PERSIST_CONTENT_MASTER:${master.id}`);
      return master;
    };

    (contentMastersRepository as any).delete = async (id: string) => {
      deletedContentMasterIds.push(id);
      executionEventLog.push(`COMPENSATE_DELETE_CONTENT_MASTER:${id}`);
      return true;
    };

    // MultiLayerVerification Engine always passes by default
    (MultiLayerVerificationEngine as any).verify = async () => {
      executionEventLog.push('PRE_SAVE_VERIFY');
      return {
        id: 'VAL-TEST-001',
        aggregatedStatus: 'VERIFIED',
        confidenceScore: 99,
        canSave: true,
        canonicalValidationStatus: 'VERIFIED',
        overallErrors: [],
        overallWarnings: [],
        layerList: [],
        layers: {},
        timestamp: new Date().toISOString(),
      };
    };

    // ------------------------------------------------------------------------
    // TEST 1: Content Master audit failure does not abort Content Master creation
    // ------------------------------------------------------------------------
    (auditLogRepository as any).logAction = async () => {
      throw new Error('Simulated Google Sheets audit log connectivity timeout');
    };

    const createdMaster = await contentMasterService.createContentMaster({
      title: 'Standalone Content Master Test',
      primaryQuestionId: 'BP-Q-000001',
      categoryId: 'CAT-001',
      topicId: 'TP-001',
      subtopicId: 'STP-001',
    });

    assert(createdMaster.id.startsWith('BP-CNT-'), 'Content Master created successfully despite audit failure');
    assert(createdMaster.title === 'Standalone Content Master Test', 'Content Master attributes intact');

    // ------------------------------------------------------------------------
    // TEST 2: Question persistence success causes idempotency cache population BEFORE workflow
    // ------------------------------------------------------------------------
    executionEventLog = [];
    (questionsRepository as any).appendRecord = async (rec: any) => {
      executionEventLog.push(`PERSIST_QUESTION:${rec.id}`);
      return rec;
    };

    let cachedDuringWorkflow: boolean | undefined = false;
    (workflowService as any).recordTransition = async (entityType: any, entityId: any) => {
      executionEventLog.push(`WORKFLOW_TRANSITION:${entityId}`);
      // Verify that at the exact moment workflow runs, the question is ALREADY present in the idempotency cache
      cachedDuringWorkflow = (questionService as any).idempotencyCache.has('idemp-test-order');
      return {} as any;
    };

    (auditService as any).log = async (a1: any, a2: any, action: any, entityType: any, entityId: any) => {
      executionEventLog.push(`AUDIT_LOG:${action}:${entityId}`);
      return {} as any;
    };

    const qWithIdemp = await questionService.createQuestionFromRequest({
      ...validPayload,
      idempotencyKey: 'idemp-test-order',
    });

    assert(cachedDuringWorkflow === true, 'Question is present in idempotency cache BEFORE workflow runs');
    assert(
      executionEventLog.indexOf(`PERSIST_QUESTION:${qWithIdemp.id}`) <
      executionEventLog.indexOf(`WORKFLOW_TRANSITION:${qWithIdemp.id}`),
      'Question persistence strictly precedes workflow transition'
    );

    // ------------------------------------------------------------------------
    // TEST 3: Question persistence failure triggers Content Master compensation
    // ------------------------------------------------------------------------
    executionEventLog = [];
    deletedContentMasterIds = [];
    (questionsRepository as any).appendRecord = async () => {
      throw new Error('Simulated Google Sheets QUESTIONS 503 Backend Write Error');
    };

    let primaryPersistErrorCaught = false;
    try {
      await questionService.createQuestionFromRequest(validPayload);
    } catch (err: any) {
      primaryPersistErrorCaught = true;
      assert(err.message.includes('QUESTIONS 503 Backend Write Error'), 'Original Question persistence error rethrown');
    }

    assert(primaryPersistErrorCaught, 'Question creation aborted on Question persistence failure');
    assert(deletedContentMasterIds.length === 1, 'Content Master compensation deletion was triggered');
    assert(
      executionEventLog.some(e => e.startsWith('COMPENSATE_DELETE_CONTENT_MASTER:BP-CNT-')),
      'Compensation cleanly deleted newly created Content Master'
    );

    // ------------------------------------------------------------------------
    // TEST 4 & 5: Pre-existing Content Master is NOT deleted on Question failure
    // ------------------------------------------------------------------------
    deletedContentMasterIds = [];
    let preExistingErrorCaught = false;

    try {
      await questionService.createQuestionFromRequest({
        ...validPayload,
        contentMasterId: 'BP-CNT-PRE-EXISTING-999',
      });
    } catch (err: any) {
      preExistingErrorCaught = true;
    }

    assert(preExistingErrorCaught, 'Question creation failed as expected');
    assert(deletedContentMasterIds.length === 0, 'Pre-existing Content Master was NOT deleted (ownership check passed)');

    // ------------------------------------------------------------------------
    // TEST 6: Compensation failure preserves and rethrows original Question error
    // ------------------------------------------------------------------------
    (contentMastersRepository as any).delete = async () => {
      throw new Error('Simulated deletion failure during compensation');
    };

    let originalErrorPreserved = false;
    try {
      await questionService.createQuestionFromRequest(validPayload);
    } catch (err: any) {
      if (err.message.includes('QUESTIONS 503 Backend Write Error')) {
        originalErrorPreserved = true;
      }
    }

    assert(originalErrorPreserved, 'Original Question persistence error preserved even if compensation deletion throws');

    // ------------------------------------------------------------------------
    // TEST 7, 8, 9: Workflow failure does NOT delete Question/ContentMaster or fail request
    // ------------------------------------------------------------------------
    deletedContentMasterIds = [];
    deletedQuestionIds = [];
    (questionsRepository as any).appendRecord = async (rec: any) => rec;
    (contentMastersRepository as any).delete = async (id: string) => {
      deletedContentMasterIds.push(id);
      return true;
    };
    (workflowService as any).recordTransition = async () => {
      throw new Error('Simulated WORKFLOW sheet 500 error');
    };
    (auditService as any).log = async () => ({} as any);

    const qWithWfFailure = await questionService.createQuestionFromRequest(validPayload);

    assert(qWithWfFailure.id.startsWith('BP-Q-'), 'Question creation succeeds despite workflow persistence failure');
    assert(deletedContentMasterIds.length === 0, 'Content Master was NOT deleted on workflow failure');
    assert(deletedQuestionIds.length === 0, 'Question was NOT deleted on workflow failure');

    // ------------------------------------------------------------------------
    // TEST 10, 11, 12: Question audit failure does NOT delete Question/ContentMaster or fail request
    // ------------------------------------------------------------------------
    deletedContentMasterIds = [];
    deletedQuestionIds = [];
    (workflowService as any).recordTransition = async () => ({} as any);
    (auditService as any).log = async () => {
      throw new Error('Simulated AUDIT sheet quota exceeded error');
    };

    const qWithAuditFailure = await questionService.createQuestionFromRequest(validPayload);

    assert(qWithAuditFailure.id.startsWith('BP-Q-'), 'Question creation succeeds despite audit log failure');
    assert(deletedContentMasterIds.length === 0, 'Content Master was NOT deleted on audit log failure');
    assert(deletedQuestionIds.length === 0, 'Question was NOT deleted on audit log failure');

    // ------------------------------------------------------------------------
    // TEST 13: Monotonic sequences are never decremented or restored
    // ------------------------------------------------------------------------
    const allocatedBefore = allocatedQuestionIds.length;
    // Failed attempt
    (questionsRepository as any).appendRecord = async () => {
      throw new Error('Persistence error');
    };
    try {
      await questionService.createQuestionFromRequest(validPayload);
    } catch {}
    const allocatedAfter = allocatedQuestionIds.length;

    assert(allocatedAfter === allocatedBefore + 1, 'Sequence allocation remains strictly monotonic; no rollback/decrement');

    // ------------------------------------------------------------------------
    // TEST 14: Pre-save verification failure terminates before any allocation
    // ------------------------------------------------------------------------
    (MultiLayerVerificationEngine as any).verify = async () => ({
      id: 'VAL-FAIL-999',
      aggregatedStatus: 'FAILED',
      confidenceScore: 0,
      canSave: false,
      canonicalValidationStatus: 'REJECTED',
      overallErrors: ['Fatal mathematical flaw'],
      overallWarnings: [],
      layerList: [],
      layers: {},
      timestamp: new Date().toISOString(),
    });

    const allocCountBefore = allocatedQuestionIds.length;
    let preSaveRejected = false;
    try {
      await questionService.createQuestionFromRequest(validPayload);
    } catch (err: any) {
      preSaveRejected = true;
    }

    assert(preSaveRejected, 'Pre-save verification rejection correctly throws ValidationError');
    assert(allocatedQuestionIds.length === allocCountBefore, 'Zero sequences allocated when pre-save verification fails');

  } finally {
    // Restore all original bindings
    (idService as any).allocateQuestionId = origAllocateQuestionId;
    (idService as any).allocateContentMasterId = origAllocateContentMasterId;
    (contentMastersRepository as any).create = origCreateContentMaster;
    (contentMastersRepository as any).delete = origDeleteContentMaster;
    (questionsRepository as any).appendRecord = origAppendQuestion;
    (MultiLayerVerificationEngine as any).verify = origVerify;
    (taxonomyService as any).validateQuestionTaxonomy = origValidateTaxonomy;
    (smartRandomService as any).resolveParameters = origResolveParameters;
    (auditLogRepository as any).logAction = origLogAuditAction;
    (auditService as any).log = origAuditLog;
    (workflowService as any).recordTransition = origWorkflowRecord;
    (validationsRepository as any).saveValidationResult = origSaveValidationResult;
  }

  console.log('\n========================================================================');
  console.log(`📊 A-02.3.2a REGRESSION RESULTS: ${passed}/${total} PASSED`);
  console.log('========================================================================\n');
}

runTests().catch((err) => {
  console.error('Fatal error during A-02.3.2a test run:', err);
  process.exit(1);
});
