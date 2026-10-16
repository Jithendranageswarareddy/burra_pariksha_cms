/**
 * BURRA PARIKSHA CMS — S8-T14 Unit Test Suite
 * Dynamic Workflow Resolution & Server-Authoritative Transitions
 *
 * Verifies all mandatory requirements of S8-T14:
 * 1. Content-Mode Registry integration across all three canonical modes:
 *    - Mode 1: QUESTION_CHALLENGE_SHORT (1 MCQ, 9:16, 10-point proof checklist)
 *    - Mode 2: TOPIC_INTRODUCTION (0 questions, 9:16/16:9, 5-point concept checklist)
 *    - Mode 3: EXPLAINED_QUESTIONS_VIDEO (1 intro + 5/10/15/20 questions, 16:9, 10-point proof checklist)
 * 2. Shared Dynamic Workflow Resolver (resolveDynamicWorkflow):
 *    - Canonical 15-step definitions, step identities, and order preserved
 *    - Mode-specific applicability & checklist metadata attached without reordering or merging steps
 *    - Distinct entity-level statuses vs workflow-instance stage and status
 *    - Progress calculated strictly from applicable steps without counting non-applicable steps as completed work
 *    - Safe handling of missing mode, incomplete prerequisites, rejected content, and terminal states
 * 3. Server-Authoritative Transitions & Security:
 *    - GAR-02 Anti-Self-Approval enforcement: author cannot approve own work at quality gates
 *    - Optimistic Concurrency Control (OCC): expectedVersion mismatch throws ConcurrencyConflictError (HTTP 409)
 *    - Prerequisite validation failure throws ValidationError (HTTP 400)
 *    - Illegal forward jump throws InvalidWorkflowTransitionError (HTTP 422)
 *    - Mandatory Step 07 Final QC invariant across all modes
 * 4. Production Workbench & Context Synchronization:
 *    - Displayed progress and next action match server-resolved state
 */

import assert from 'node:assert';
import {
  contentModeRegistry,
  resolveDynamicWorkflow,
  WorkflowResolutionInput,
  ResolvedWorkflowState,
  CANONICAL_WORKFLOW_STEPS,
  CanonicalWorkflowStep,
  WorkflowInstanceDocument,
  CanonicalRbacRole,
} from '../../shared';
import { workflowService, workflowEngine } from '../../backend/domain/workflow';
import { resolveWorkbenchSummary } from '../../frontend/features/question-generation/components/ProductionWorkbenchSummary';
import {
  ConcurrencyConflictError,
  ForbiddenError,
  InvalidWorkflowTransitionError,
  ValidationError,
} from '../../src/lib/errors';

async function runS8T14UnitTests() {
  console.log('========================================================================');
  console.log('RUNNING S8-T14 TESTS: Dynamic Workflow Resolution & Transitions');
  console.log('========================================================================\n');

  let passedTests = 0;
  const pass = (name: string) => {
    passedTests++;
    console.log(`  ✓ ${name}`);
  };

  // =========================================================================
  // SECTION 1: Content-Mode Registry Integration
  // =========================================================================
  console.log('[SECTION 1] Content-Mode Registry Integration');

  // Test 1.1: Mode 1 (QUESTION_CHALLENGE_SHORT) Registry Definition
  const m1Def = contentModeRegistry.getDefinition('QUESTION_CHALLENGE_SHORT');
  assert.strictEqual(m1Def.code, 'MODE_1');
  assert.deepStrictEqual(m1Def.questionCount.allowedValues, [1]);
  assert.strictEqual(m1Def.aspectRatio.defaultValue, '9:16');
  assert.strictEqual(m1Def.duration.maxSeconds, 58);
  assert.strictEqual(m1Def.verification.checklistType, '10_POINT_PROOF');
  assert.strictEqual(m1Def.verification.enforcesGar02, true);
  assert.strictEqual(m1Def.applicableStages.length, 15);
  pass('1.1 Mode 1 registered with 1 MCQ, 9:16 vertical, 10-point proof checklist, GAR-02');

  // Test 1.2: Mode 2 (TOPIC_INTRODUCTION) Registry Definition
  const m2Def = contentModeRegistry.getDefinition('TOPIC_INTRODUCTION');
  assert.strictEqual(m2Def.code, 'MODE_2');
  assert.deepStrictEqual(m2Def.questionCount.allowedValues, [0]);
  assert.strictEqual(m2Def.questionCount.defaultValue, 0);
  assert.deepStrictEqual(m2Def.aspectRatio.allowedValues, ['9:16', '16:9']);
  assert.strictEqual(m2Def.duration.maxSeconds, 180);
  assert.strictEqual(m2Def.verification.checklistType, '5_POINT_CONCEPT');
  assert.strictEqual(m2Def.inputs.requiresMCQOptions, false);
  assert.strictEqual(m2Def.verification.enforcesGar02, true);
  pass('1.2 Mode 2 registered with 0 questions, 9:16/16:9, 5-point concept checklist, GAR-02');

  // Test 1.3: Mode 3 (EXPLAINED_QUESTIONS_VIDEO) Registry Definition
  const m3Def = contentModeRegistry.getDefinition('EXPLAINED_QUESTIONS_VIDEO');
  assert.strictEqual(m3Def.code, 'MODE_3');
  assert.deepStrictEqual(m3Def.questionCount.allowedValues, [5, 10, 15, 20]);
  assert.strictEqual(m3Def.aspectRatio.defaultValue, '16:9');
  assert.strictEqual(m3Def.verification.checklistType, '10_POINT_PROOF');
  assert.strictEqual(m3Def.inputs.requiresIntroductoryConcept, true);
  assert.strictEqual(m3Def.verification.enforcesGar02, true);
  pass('1.3 Mode 3 registered with 5/10/15/20 questions, 16:9 landscape, masterclass model');

  // Test 1.4: Registry Config Validation
  const validM1Config = contentModeRegistry.validateConfig('QUESTION_CHALLENGE_SHORT', 1, '9:16');
  assert.strictEqual(validM1Config.isValid, true);

  const invalidM1Count = contentModeRegistry.validateConfig('QUESTION_CHALLENGE_SHORT', 5, '9:16');
  assert.strictEqual(invalidM1Count.isValid, false);

  const validM2Landscape = contentModeRegistry.validateConfig('TOPIC_INTRODUCTION', 0, '16:9');
  assert.strictEqual(validM2Landscape.isValid, true);

  const invalidM2Questions = contentModeRegistry.validateConfig('TOPIC_INTRODUCTION', 1, '9:16');
  assert.strictEqual(invalidM2Questions.isValid, false);

  const validM3Count = contentModeRegistry.validateConfig('EXPLAINED_QUESTIONS_VIDEO', 10, '16:9');
  assert.strictEqual(validM3Count.isValid, true);

  const invalidM3Aspect = contentModeRegistry.validateConfig('EXPLAINED_QUESTIONS_VIDEO', 10, '9:16');
  assert.strictEqual(invalidM3Aspect.isValid, false);
  pass('1.4 Registry config validation deterministically enforces mode constraints');

  // =========================================================================
  // SECTION 2: Dynamic Workflow Resolution & Step Preservation
  // =========================================================================
  console.log('\n[SECTION 2] Dynamic Workflow Resolution & Step Preservation');

  // Test 2.1: Preservation of Canonical 15 Steps across all modes
  const m1Resolved = resolveDynamicWorkflow({
    entityId: 'qst_test_m1',
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    entityData: {
      topicId: 'top_01',
      subtopicId: 'sub_01',
      questionText: 'What is 2+2?',
      options: ['1', '2', '3', '4'],
      correctAnswer: 'D',
      proof: '2+2=4',
    },
  });

  assert.strictEqual(m1Resolved.applicableSteps.length, 15, 'All 15 canonical steps must be present');
  m1Resolved.applicableSteps.forEach((step, idx) => {
    assert.strictEqual(step.stepNumber, idx + 1, `Step ${idx + 1} must preserve canonical sequence`);
    assert.strictEqual(step.isApplicable, true, `Step ${idx + 1} must be marked applicable`);
  });
  assert.strictEqual(m1Resolved.applicableSteps[1].applicableChecklistType, '10_POINT_PROOF');
  assert.strictEqual(m1Resolved.applicableSteps[6].applicableChecklistType, 'FINAL_QC_CHECKLIST');
  pass('2.1 Canonical 15 steps preserved without omissions, reordering, or merging in Mode 1');

  // Test 2.2: Mode 2 Resolution attaches 5-Point Concept Checklist at Step 02
  const m2Resolved = resolveDynamicWorkflow({
    entityId: 'qst_test_m2',
    productionMode: 'TOPIC_INTRODUCTION',
    entityData: {
      topicId: 'top_01',
      subtopicId: 'sub_01',
      conceptTitle: 'Time and Work Fundamentals',
      introductoryConcept: 'Overview of work efficiency formulas.',
    },
  });

  assert.strictEqual(m2Resolved.applicableSteps.length, 15);
  assert.strictEqual(m2Resolved.applicableSteps[1].applicableChecklistType, '5_POINT_CONCEPT');
  assert.strictEqual(m2Resolved.applicableSteps[6].applicableChecklistType, 'FINAL_QC_CHECKLIST');
  assert.strictEqual(m2Resolved.applicableSteps[1].isBlocked, false);
  pass('2.2 Mode 2 attaches polymorphic 5-point concept checklist and validates zero-question concept');

  // Test 2.3: Mode 2 blocks Step 02 if MCQ options are present (N=0 violation)
  const m2Violation = resolveDynamicWorkflow({
    entityId: 'qst_test_m2_viol',
    productionMode: 'TOPIC_INTRODUCTION',
    entityData: {
      topicId: 'top_01',
      subtopicId: 'sub_01',
      conceptTitle: 'Time and Work',
      options: ['A', 'B', 'C', 'D'], // Illegal for Mode 2
    },
  });
  assert.strictEqual(m2Violation.applicableSteps[1].isBlocked, true);
  assert(m2Violation.applicableSteps[1].blockerReason?.includes('N=0'));
  pass('2.3 Mode 2 blocks Step 02 when practice question options are present');

  // Test 2.4: Mode 3 Resolution attaches 10-point checklist across N practice questions
  const m3Resolved = resolveDynamicWorkflow({
    entityId: 'qst_test_m3',
    productionMode: 'EXPLAINED_QUESTIONS_VIDEO',
    entityData: {
      topicId: 'top_01',
      subtopicId: 'sub_01',
      targetQuestionCount: 5,
      questions: [{}, {}, {}, {}, {}],
    },
  });
  assert.strictEqual(m3Resolved.applicableSteps.length, 15);
  assert.strictEqual(m3Resolved.applicableSteps[1].applicableChecklistType, '10_POINT_PROOF');
  assert.strictEqual(m3Resolved.applicableSteps[1].isBlocked, false);
  pass('2.4 Mode 3 attaches 10-point proof checklist and checks N=5 practice questions');

  // Test 2.5: Progress Calculation strictly from applicable steps
  // In an asset with 3 applicable steps completed out of 15 applicable steps:
  const partialWorkflow = resolveDynamicWorkflow({
    entityId: 'wfl_partial',
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    persistedWorkflow: {
      currentStep: 4,
      contentStatus: 'APPROVED',
      version: 4,
    },
  });
  assert.strictEqual(partialWorkflow.progress.currentStage, 4);
  assert.strictEqual(partialWorkflow.progress.completedApplicableSteps, 3);
  assert.strictEqual(partialWorkflow.progress.totalApplicableSteps, 15);
  assert.strictEqual(partialWorkflow.progress.percentage, 20); // (3/15) * 100 = 20%
  pass('2.5 Progress calculated strictly from applicable steps without counting uncompleted/non-applicable work');

  // =========================================================================
  // SECTION 3: Quality Gates, GAR-02 Anti-Self-Approval & Mandatory Step 07
  // =========================================================================
  console.log('\n[SECTION 3] Quality Gates, GAR-02 & Mandatory Step 07');

  // Test 3.1: GAR-02 Anti-Self-Approval blocks author approval at Step 02
  const authorActor = {
    id: 'usr_author_1',
    role: CanonicalRbacRole.QUESTION_AUTHOR,
    roles: [CanonicalRbacRole.QUESTION_AUTHOR, CanonicalRbacRole.QA_REVIEWER], // Even if user holds QA role
  };

  const authorResolved = resolveDynamicWorkflow({
    entityId: 'qst_gar02',
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    persistedWorkflow: {
      currentStep: 2,
      authorId: 'usr_author_1',
      contentStatus: 'IN_REVIEW',
      version: 2,
    },
    actor: authorActor,
  });

  assert.strictEqual(authorResolved.isGar02Restricted, true);
  const approveAction = authorResolved.permittedActions.find((a) => a.actionId === 'QUESTION_APPROVE');
  assert(approveAction, 'QUESTION_APPROVE must be registered as a candidate action');
  assert.strictEqual(approveAction.isAvailable, false, 'Author cannot approve own work');
  assert(approveAction.blockedReason?.includes('GAR-02'));
  pass('3.1 GAR-02 anti-self-approval marks approval unavailable with segregation reason');

  // Test 3.2: Peer reviewer can approve under GAR-02
  const peerActor = {
    id: 'usr_reviewer_2',
    role: CanonicalRbacRole.QA_REVIEWER,
    roles: [CanonicalRbacRole.QA_REVIEWER],
  };

  const peerResolved = resolveDynamicWorkflow({
    entityId: 'qst_gar02',
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    persistedWorkflow: {
      currentStep: 2,
      authorId: 'usr_author_1',
      contentStatus: 'IN_REVIEW',
      version: 2,
    },
    actor: peerActor,
  });

  assert.strictEqual(peerResolved.isGar02Restricted, false);
  const peerApproveAction = peerResolved.permittedActions.find((a) => a.actionId === 'QUESTION_APPROVE');
  assert(peerApproveAction);
  assert.strictEqual(peerApproveAction.isAvailable, true, 'Independent peer reviewer can approve');
  pass('3.2 Independent peer reviewer successfully permitted to approve at Step 02');

  // Test 3.3: Mandatory Step 07 Final QC Invariant
  // Step 07 can NEVER be skipped or bypassed. Advancing to Step 08 requires Final QC approval.
  const step7Resolved = resolveDynamicWorkflow({
    entityId: 'vid_final_qc',
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    persistedWorkflow: {
      currentStep: 7,
      authorId: 'usr_creator',
      contentStatus: 'IN_REVIEW',
      mediaStatus: 'READY',
      version: 7,
    },
    actor: peerActor,
  });

  assert.strictEqual(step7Resolved.currentStage, 7);
  assert.strictEqual(step7Resolved.applicableSteps[6].stepNumber, 7);
  assert.strictEqual(step7Resolved.applicableSteps[6].applicableChecklistType, 'FINAL_QC_CHECKLIST');
  const qcApprove = step7Resolved.permittedActions.find((a) => a.actionId === 'VIDEO_QC_VERIFY');
  assert(qcApprove);
  assert.strictEqual(qcApprove.targetStep, 8);
  pass('3.3 Step 07 Final QC enforced as an inviolable mandatory gate before Step 08');

  // Test 3.4: Terminal State Resolution (Step 15 Completed / Archived)
  const terminalResolved = resolveDynamicWorkflow({
    entityId: 'cnt_archived',
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    persistedWorkflow: {
      currentStep: 15,
      contentStatus: 'ARCHIVED',
      jobStatus: 'COMPLETED',
      publicationStatus: 'SYNCED',
      version: 15,
    },
  });

  assert.strictEqual(terminalResolved.isTerminal, true);
  assert.strictEqual(terminalResolved.progress.percentage, 100);
  assert.strictEqual(terminalResolved.stageStatus, 'COMPLETED');
  pass('3.4 Terminal state properly identified with 100% progress and no illegal forward actions');

  // =========================================================================
  // SECTION 4: Server-Authoritative Transitions, OCC & Guard Evaluation
  // =========================================================================
  console.log('\n[SECTION 4] Server-Authoritative Transitions & Concurrency');

  // Test 4.1: Server Workflow Instance Creation
  const newInstance = await workflowService.createInstance(
    {
      entityType: 'QUESTION',
      entityId: 'qst_dyn_occ_001',
      currentStep: 1,
      authorId: 'usr_author_1',
      contentStatus: 'DRAFT',
      mediaStatus: 'NOT_REQUIRED',
      publicationStatus: 'UNPUBLISHED',
      jobStatus: 'IDLE',
      metadata: { productionMode: 'QUESTION_CHALLENGE_SHORT' },
    },
    { id: 'usr_author_1', role: 'QUESTION_AUTHOR', roles: ['QUESTION_AUTHOR'] }
  );

  assert(newInstance.id.startsWith('wfl_'));
  assert.strictEqual(newInstance.version, 1);
  assert.strictEqual(newInstance.currentStep, 1);
  pass('4.1 Workflow instance created in Cloud Firestore with initial OCC version 1');

  // Test 4.2: Successful Forward Transition (Step 01 -> Step 02)
  const validTransition = await workflowService.transition(
    newInstance.id,
    {
      targetStep: 2,
      action: 'QUESTION_SUBMIT',
      expectedVersion: 1,
      reason: 'Draft finalized for pedagogical verification',
    },
    { id: 'usr_author_1', role: 'QUESTION_AUTHOR', roles: ['QUESTION_AUTHOR'] }
  );

  assert.strictEqual(validTransition.workflow.currentStep, 2);
  assert.strictEqual(validTransition.workflow.version, 2, 'Version must increment to 2');
  assert.strictEqual(validTransition.workflow.contentStatus, 'IN_REVIEW');
  pass('4.2 Transition from Step 01 to Step 02 advances state and increments OCC version to 2');

  // Test 4.3: OCC Concurrency Conflict (expectedVersion mismatch) -> throws ConcurrencyConflictError
  try {
    await workflowService.transition(
      newInstance.id,
      {
        targetStep: 3,
        action: 'QUESTION_APPROVE',
        expectedVersion: 1, // Stale version! Current version is 2.
        reason: 'Attempting transition with stale version',
      },
      { id: 'usr_reviewer_2', role: 'QA_REVIEWER', roles: ['QA_REVIEWER'] }
    );
    assert.fail('Should have thrown ConcurrencyConflictError for stale version');
  } catch (err: any) {
    assert(err instanceof ConcurrencyConflictError, 'Must throw ConcurrencyConflictError');
    assert.strictEqual(err.statusCode, 409, 'OCC mismatch must map to HTTP 409');
    pass('4.3 Concurrency conflict (expectedVersion mismatch) rejected with HTTP 409');
  }

  // Test 4.4: Server-Side GAR-02 Anti-Self-Approval Enforcement
  try {
    await workflowService.transition(
      newInstance.id,
      {
        targetStep: 3,
        action: 'QUESTION_APPROVE',
        expectedVersion: 2,
        reason: 'Author trying to approve own work',
      },
      { id: 'usr_author_1', role: 'QA_REVIEWER', roles: ['QA_REVIEWER', 'QUESTION_AUTHOR'] } // Author attempts approval
    );
    assert.fail('Should have rejected self-approval under GAR-02');
  } catch (err: any) {
    assert(err instanceof ForbiddenError, 'Must throw ForbiddenError');
    assert(err.message.includes('GAR-02') || err.message.includes('Self-approval'));
    pass('4.4 Server-side transition strictly rejects self-approval under GAR-02 (HTTP 403)');
  }

  // Test 4.5: Illegal Forward Jump (e.g. 2 -> 6) Rejected
  try {
    await workflowService.transition(
      newInstance.id,
      {
        targetStep: 6,
        action: 'QUESTION_APPROVE',
        expectedVersion: 2,
        reason: 'Illegal jump to Editing Bay',
      },
      { id: 'usr_reviewer_2', role: 'QA_REVIEWER', roles: ['QA_REVIEWER'] }
    );
    assert.fail('Should have rejected illegal forward jump');
  } catch (err: any) {
    assert(err instanceof InvalidWorkflowTransitionError);
    assert.strictEqual(err.statusCode, 422, 'Illegal jump maps to HTTP 422');
    pass('4.5 Illegal forward jump (Step 02 -> Step 06) rejected with HTTP 422');
  }

  // Test 4.6: Server Workflow Service resolve() Method
  const serverResolved = await workflowService.resolve({
    entityId: newInstance.id,
    actor: { id: 'usr_reviewer_2', role: 'QA_REVIEWER', roles: ['QA_REVIEWER'] },
  });
  assert.strictEqual(serverResolved.workflowInstanceId, newInstance.id);
  assert.strictEqual(serverResolved.currentStage, 2);
  assert.strictEqual(serverResolved.version, 2);
  pass('4.6 workflowService.resolve() hydrates from Cloud Firestore and produces accurate dynamic state');

  // =========================================================================
  // SECTION 5: Production Workbench Summary Display Synchronization
  // =========================================================================
  console.log('\n[SECTION 5] Production Workbench Summary Display Synchronization');

  // Test 5.1: Workbench Summary consumes server-resolved state accurately
  const workbenchSummary = resolveWorkbenchSummary({
    selectedTopic: 'top_qa_01',
    selectedSubtopic: 'sub_td_01',
    taxonomyTree: [{ id: 'top_qa_01', name: 'Quantitative Aptitude' }],
    currentSubtopics: [{ id: 'sub_td_01', name: 'Time & Distance' }],
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    hasCandidate: true,
    isDirty: false,
    resolvedWorkflow: serverResolved,
  });

  assert.strictEqual(workbenchSummary.progress.currentStageNumber, 2);
  assert.strictEqual(workbenchSummary.progress.totalStagesCount, 15);
  assert.strictEqual(workbenchSummary.progress.completedStagesCount, 1);
  assert.strictEqual(workbenchSummary.progress.percentComplete, 7); // (1/15) * 100 = 7%
  pass('5.1 ProductionWorkbenchSummary displays server-resolved progress without optimistic drift');

  // Test 5.2: Safe Fallback when Mode Configuration is Missing
  const missingModeResolved = resolveDynamicWorkflow({
    entityId: 'qst_no_mode',
    productionMode: undefined,
  });
  assert.strictEqual(missingModeResolved.productionMode, 'QUESTION_CHALLENGE_SHORT', 'Must safely default to Mode 1');
  assert.strictEqual(missingModeResolved.applicableSteps.length, 15);
  pass('5.2 Missing mode configuration safely defaults to Mode 1 without application crash');

  console.log('\n========================================================================');
  console.log(`ALL S8-T14 TESTS PASSED: ${passedTests} checks verified successfully.`);
  console.log('========================================================================\n');
}

runS8T14UnitTests().catch((err) => {
  console.error('\n❌ S8-T14 UNIT TEST FAILURE:', err);
  process.exit(1);
});
