/**
 * BURRA PARIKSHA CMS — S8-T16 Unit & Integration Test Suite
 * Content-Mode and Workflow Rule Tests
 *
 * Verifies that all three production modes obey:
 * 1. Approved Content-Mode Registry (valid & invalid configs, required inputs, question counts, aspect ratios, checklists, durations).
 * 2. Shared Dynamic Workflow Resolver (canonical 15 steps preserved, mode-specific checklists, progress calculation).
 * 3. Authoritative Transition Matrix & Guards (N -> N+1 sequential progression, forward jump prohibition, prerequisite checks, revision routes).
 * 4. Role-Based Authorization & Verification Gates (capability boundaries, GAR-02 anti-self-approval, AP-009 AI prohibition, non-mutation on failure).
 * 5. Deterministic behavioral simulation across Mode 1, Mode 2, and Mode 3.
 */

process.env.PERSISTENCE_MODE = 'IN_MEMORY_TEST_ONLY';

import assert from 'node:assert';
import {
  contentModeRegistry,
  resolveDynamicWorkflow,
  CANONICAL_WORKFLOW_STEPS,
  CanonicalRbacRole,
  WorkflowStepNumber,
  WorkflowInstanceDocument,
  ContentProductionMode,
} from '../../shared';
import {
  workflowService,
  workflowEngine,
  findTransitionRule,
  getRulesForStep,
  checkStepPrerequisites,
  CANONICAL_TRANSITION_RULES,
} from '../../backend/domain/workflow';
import { workflowInstancesRepository } from '../../backend/domain/workflow/workflow.repository';
import {
  ConcurrencyConflictError,
  ForbiddenError,
  InvalidWorkflowTransitionError,
  ValidationError,
  NotFoundError,
} from '../../src/lib/errors';
import { evaluateStep01CandidateState } from '../../shared/contracts/question-generation/question-generation.contract';

async function runS8T16WorkflowRuleTests() {
  console.log('========================================================================');
  console.log('RUNNING S8-T16 TESTS: Content-Mode and Workflow Rule Verification');
  console.log('========================================================================\n');

  let passedTests = 0;
  const pass = (name: string) => {
    passedTests++;
    console.log(`  ✓ ${name}`);
  };

  // =========================================================================
  // SECTION 1: Content-Mode Registry Behavior Across All Three Modes
  // =========================================================================
  console.log('[SECTION 1] Content-Mode Registry Behavior Across All Three Modes');

  // Test 1.1: Mode 1 (QUESTION_CHALLENGE_SHORT) configuration rules
  const m1Valid = contentModeRegistry.validateConfig('QUESTION_CHALLENGE_SHORT', 1, '9:16');
  assert.strictEqual(m1Valid.isValid, true, 'Mode 1 with count=1 and aspect=9:16 must be valid');

  const m1InvalidCounts = [0, 2, 5, 10, -1, 1.5, NaN];
  for (const count of m1InvalidCounts) {
    const res = contentModeRegistry.validateConfig('QUESTION_CHALLENGE_SHORT', count, '9:16');
    assert.strictEqual(res.isValid, false, `Mode 1 must reject invalid question count ${count}`);
    assert(res.error?.includes("requires question count in [1]"), 'Error must specify allowed count [1]');
  }

  const m1InvalidAspects = ['16:9', '4:3', '1:1', ''];
  for (const aspect of m1InvalidAspects) {
    const res = contentModeRegistry.validateConfig('QUESTION_CHALLENGE_SHORT', 1, aspect);
    assert.strictEqual(res.isValid, false, `Mode 1 must reject aspect ratio '${aspect}'`);
    assert(res.error?.includes("requires aspect ratio in [9:16]"), 'Error must specify allowed aspect [9:16]');
  }

  const m1Def = contentModeRegistry.getDefinition('QUESTION_CHALLENGE_SHORT');
  assert.strictEqual(m1Def.inputs.requiresTaxonomy, true);
  assert.strictEqual(m1Def.inputs.requiresMCQOptions, true);
  assert.strictEqual(m1Def.inputs.requiresCorrectAnswer, true);
  assert.strictEqual(m1Def.inputs.requiresIntroductoryConcept, false);
  assert.strictEqual(m1Def.inputs.requiresProofExplanation, true);
  assert.strictEqual(m1Def.verification.checklistType, '10_POINT_PROOF');
  assert.strictEqual(m1Def.verification.totalCheckpoints, 10);
  assert.strictEqual(m1Def.verification.evaluatesMathematicalProof, true);
  assert.strictEqual(m1Def.duration.minSeconds, 30);
  assert.strictEqual(m1Def.duration.maxSeconds, 58);
  pass('1.1 Mode 1: Enforces questionCount=[1], aspect=[9:16], 10-point proof checklist, duration [30-58s]');

  // Test 1.2: Mode 2 (TOPIC_INTRODUCTION) configuration rules
  const m2ValidVertical = contentModeRegistry.validateConfig('TOPIC_INTRODUCTION', 0, '9:16');
  assert.strictEqual(m2ValidVertical.isValid, true, 'Mode 2 with count=0 and aspect=9:16 must be valid');

  const m2ValidLandscape = contentModeRegistry.validateConfig('TOPIC_INTRODUCTION', 0, '16:9');
  assert.strictEqual(m2ValidLandscape.isValid, true, 'Mode 2 with count=0 and aspect=16:9 must be valid');

  const m2InvalidCounts = [1, 2, 5, 10, -1, 100];
  for (const count of m2InvalidCounts) {
    const res = contentModeRegistry.validateConfig('TOPIC_INTRODUCTION', count, '9:16');
    assert.strictEqual(res.isValid, false, `Mode 2 must reject question count ${count} > 0`);
    assert(res.error?.includes("requires question count in [0]"), 'Error must state count strictly 0');
  }

  const m2InvalidAspects = ['4:3', '1:1', 'vertical', ''];
  for (const aspect of m2InvalidAspects) {
    const res = contentModeRegistry.validateConfig('TOPIC_INTRODUCTION', 0, aspect);
    assert.strictEqual(res.isValid, false, `Mode 2 must reject aspect ratio '${aspect}'`);
  }

  const m2Def = contentModeRegistry.getDefinition('TOPIC_INTRODUCTION');
  assert.strictEqual(m2Def.inputs.requiresTaxonomy, true);
  assert.strictEqual(m2Def.inputs.requiresMCQOptions, false);
  assert.strictEqual(m2Def.inputs.requiresCorrectAnswer, false);
  assert.strictEqual(m2Def.inputs.requiresIntroductoryConcept, true);
  assert.strictEqual(m2Def.inputs.requiresProofExplanation, false);
  assert.strictEqual(m2Def.verification.checklistType, '5_POINT_CONCEPT');
  assert.strictEqual(m2Def.verification.totalCheckpoints, 5);
  assert.strictEqual(m2Def.verification.evaluatesMathematicalProof, false);
  assert.strictEqual(m2Def.duration.minSeconds, 60);
  assert.strictEqual(m2Def.duration.maxSeconds, 180);
  pass('1.2 Mode 2: Enforces questionCount=[0], aspect=[9:16, 16:9], 5-point concept checklist, duration [60-180s]');

  // Test 1.3: Mode 3 (EXPLAINED_QUESTIONS_VIDEO) configuration rules
  const m3ApprovedCounts = [5, 10, 15, 20];
  for (const count of m3ApprovedCounts) {
    const res = contentModeRegistry.validateConfig('EXPLAINED_QUESTIONS_VIDEO', count, '16:9');
    assert.strictEqual(res.isValid, true, `Mode 3 with approved count ${count} must be valid`);
  }

  const m3InvalidCounts = [0, 1, 2, 3, 4, 6, 7, 12, 25, -5];
  for (const count of m3InvalidCounts) {
    const res = contentModeRegistry.validateConfig('EXPLAINED_QUESTIONS_VIDEO', count, '16:9');
    assert.strictEqual(res.isValid, false, `Mode 3 must reject non-approved count ${count}`);
    assert(res.error?.includes("requires question count in [5, 10, 15, 20]"));
  }

  const m3InvalidAspects = ['9:16', '4:3', '1:1', ''];
  for (const aspect of m3InvalidAspects) {
    const res = contentModeRegistry.validateConfig('EXPLAINED_QUESTIONS_VIDEO', 10, aspect);
    assert.strictEqual(res.isValid, false, `Mode 3 must reject non-16:9 aspect ratio '${aspect}'`);
    assert(res.error?.includes("requires aspect ratio in [16:9]"));
  }

  const m3Def = contentModeRegistry.getDefinition('EXPLAINED_QUESTIONS_VIDEO');
  assert.strictEqual(m3Def.inputs.requiresTaxonomy, true);
  assert.strictEqual(m3Def.inputs.requiresMCQOptions, true);
  assert.strictEqual(m3Def.inputs.requiresCorrectAnswer, true);
  assert.strictEqual(m3Def.inputs.requiresIntroductoryConcept, true);
  assert.strictEqual(m3Def.inputs.requiresProofExplanation, true);
  assert.strictEqual(m3Def.verification.checklistType, '10_POINT_PROOF');
  assert.strictEqual(m3Def.verification.totalCheckpoints, 10);
  assert.strictEqual(m3Def.verification.evaluatesMathematicalProof, true);
  assert.strictEqual(m3Def.duration.minSeconds, 720);
  assert.strictEqual(m3Def.duration.maxSeconds, 3120);
  pass('1.3 Mode 3: Enforces questionCount=[5, 10, 15, 20], aspect=[16:9], 10-point proof checklist, duration [12-52min]');

  // Test 1.4: Unsupported modes explicitly rejected; valid modes retain canonical stages
  assert.strictEqual(contentModeRegistry.hasDefinition('UNSUPPORTED_MODE'), false);
  assert.throws(
    () => contentModeRegistry.getDefinition('UNSUPPORTED_MODE'),
    /Unregistered content production mode: 'UNSUPPORTED_MODE'/
  );
  const unknownValidation = contentModeRegistry.validateConfig('UNSUPPORTED_MODE', 1, '9:16');
  assert.strictEqual(unknownValidation.isValid, false);
  assert(unknownValidation.error?.includes("Invalid production mode: 'UNSUPPORTED_MODE'"));

  // Unsupported mode must fail explicitly when requesting applicable stages (no silent 15-stage fallback)
  assert.throws(
    () => contentModeRegistry.getApplicableStages('UNKNOWN_MODE'),
    /Unregistered content production mode: 'UNKNOWN_MODE'/
  );

  // Proving all three registered production modes retain their correct canonical stages
  const registeredModes: ContentProductionMode[] = [
    'QUESTION_CHALLENGE_SHORT',
    'TOPIC_INTRODUCTION',
    'EXPLAINED_QUESTIONS_VIDEO',
  ];
  for (const registeredMode of registeredModes) {
    const stages = contentModeRegistry.getApplicableStages(registeredMode);
    assert.strictEqual(stages.length, 15, `${registeredMode} must retain all 15 canonical stages`);
    assert.deepStrictEqual(
      stages,
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
      `${registeredMode} applicable stages must match canonical sequence 1..15`
    );
  }
  pass('1.4 Unsupported modes explicitly rejected without silent fallback; valid modes retain canonical stages');

  // =========================================================================
  // SECTION 2: Workflow Resolver & Conditional-Step Resolution Across All Modes
  // =========================================================================
  console.log('\n[SECTION 2] Workflow Resolver & Conditional-Step Resolution Across All Modes');

  // Test 2.1: Preservation of Canonical 15 Stages Across All Modes
  const modes: ContentProductionMode[] = [
    'QUESTION_CHALLENGE_SHORT',
    'TOPIC_INTRODUCTION',
    'EXPLAINED_QUESTIONS_VIDEO',
  ];

  for (const mode of modes) {
    const resolved = resolveDynamicWorkflow({
      entityId: `qst_${mode.toLowerCase()}`,
      productionMode: mode,
    });

    assert.strictEqual(resolved.productionMode, mode);
    assert.strictEqual(resolved.applicableSteps.length, 15, `${mode} must preserve exactly 15 stages`);
    for (let i = 0; i < 15; i++) {
      const stepNum = (i + 1) as WorkflowStepNumber;
      assert.strictEqual(resolved.applicableSteps[i].stepNumber, stepNum);
      assert.strictEqual(resolved.applicableSteps[i].name, CANONICAL_WORKFLOW_STEPS[stepNum].name);
    }
  }
  pass('2.1 Canonical 15-stage sequence strictly preserved for all three production modes without omissions');

  // Test 2.2: Mode-Specific Checklist and Verification Metadata Attachment
  const m1Resolved = resolveDynamicWorkflow({
    entityId: 'qst_m1_meta',
    productionMode: 'QUESTION_CHALLENGE_SHORT',
  });
  const m1Step2 = m1Resolved.applicableSteps.find((s) => s.stepNumber === 2)!;
  assert.strictEqual(m1Step2.applicableChecklistType, '10_POINT_PROOF');
  assert.strictEqual(m1Def.verification.totalCheckpoints, 10);
  assert.strictEqual(m1Def.verification.evaluatesMathematicalProof, true);

  const m2Resolved = resolveDynamicWorkflow({
    entityId: 'qst_m2_meta',
    productionMode: 'TOPIC_INTRODUCTION',
  });
  const m2Step2 = m2Resolved.applicableSteps.find((s) => s.stepNumber === 2)!;
  assert.strictEqual(m2Step2.applicableChecklistType, '5_POINT_CONCEPT');
  assert.strictEqual(m2Def.verification.totalCheckpoints, 5);
  assert.strictEqual(m2Def.verification.evaluatesMathematicalProof, false);

  const m3Resolved = resolveDynamicWorkflow({
    entityId: 'qst_m3_meta',
    productionMode: 'EXPLAINED_QUESTIONS_VIDEO',
  });
  const m3Step2 = m3Resolved.applicableSteps.find((s) => s.stepNumber === 2)!;
  assert.strictEqual(m3Step2.applicableChecklistType, '10_POINT_PROOF');
  assert.strictEqual(m3Def.verification.totalCheckpoints, 10);
  assert.strictEqual(m3Def.verification.evaluatesMathematicalProof, true);
  pass('2.2 Step 02 attaches polymorphic checklist metadata: 10-pt proof for Modes 1 & 3; 5-pt concept for Mode 2');

  // Test 2.3: Mode 2 Zero-Question Concept Evaluation & N=0 Blocker Resolution
  const m2CandidateValid = evaluateStep01CandidateState({
    hasCandidate: true,
    candidate: {
      productionMode: 'TOPIC_INTRODUCTION',
      topicId: 'top_1',
      subtopicId: 'sub_1',
      conceptTitle: 'Speed & Time Fundamentals',
      introductoryConcept: 'Overview of speed, velocity, and relative motion principles without practice questions.',
      aspectRatio: '9:16',
    },
  });
  assert.strictEqual(m2CandidateValid.canContinue, true, 'Mode 2 candidate with concept notes and no questions must be complete');
  assert.strictEqual(m2CandidateValid.state, 'VALID');
  assert.strictEqual(m2CandidateValid.errors.length, 0);

  const m2CandidateShort = evaluateStep01CandidateState({
    hasCandidate: true,
    candidate: {
      productionMode: 'TOPIC_INTRODUCTION',
      topicId: 'top_1',
      subtopicId: 'sub_1',
      conceptTitle: 'Speed & Time Fundamentals',
      introductoryConcept: 'Too short',
      aspectRatio: '9:16',
    },
  });
  assert.strictEqual(m2CandidateShort.canContinue, false);
  assert.strictEqual(m2CandidateShort.state, 'INCOMPLETE');
  assert(m2CandidateShort.errors.some((e) => e.includes('at least 15 characters')));

  // Resolver N=0 invariant: blocks step 2 if options are provided for Mode 2
  const m2ResolvedWithOptions = resolveDynamicWorkflow({
    entityId: 'qst_m2_illegal_options',
    productionMode: 'TOPIC_INTRODUCTION',
    entityData: {
      topicId: 'top_1',
      subtopicId: 'sub_1',
      conceptTitle: 'Speed & Time Fundamentals',
      options: ['A', 'B', 'C', 'D'],
    },
  });
  assert.strictEqual(m2ResolvedWithOptions.applicableSteps[1].isBlocked, true);
  assert(m2ResolvedWithOptions.applicableSteps[1].blockerReason?.includes('N=0'));
  pass('2.3 Mode 2 Stage 01 state evaluates concept completeness and rejects extraneous practice question options');

  // Test 2.4: Deterministic Progress Calculation Across Modes
  const progressTestCases = [
    { step: 1, expectedPercent: 0, completedCount: 0 },
    { step: 2, expectedPercent: 7, completedCount: 1 },
    { step: 3, expectedPercent: 13, completedCount: 2 },
    { step: 7, expectedPercent: 40, completedCount: 6 },
    { step: 11, expectedPercent: 67, completedCount: 10 },
    { step: 15, expectedPercent: 93, completedCount: 14 },
  ];

  for (const tc of progressTestCases) {
    const res = resolveDynamicWorkflow({
      entityId: 'qst_progress_check',
      persistedWorkflow: {
        currentStep: tc.step as WorkflowStepNumber,
        contentStatus: 'IN_PROGRESS',
      },
    });
    assert.strictEqual(res.progress.completedApplicableSteps, tc.completedCount);
    assert.strictEqual(res.progress.percentage, tc.expectedPercent);
    assert.strictEqual(res.progress.totalApplicableSteps, 15);
  }

  // Terminal state completed check
  const terminalWorkflow = resolveDynamicWorkflow({
    entityId: 'qst_terminal_check',
    persistedWorkflow: {
      currentStep: 15,
      contentStatus: 'ARCHIVED',
    },
  });
  assert.strictEqual(terminalWorkflow.isTerminal, true);
  assert.strictEqual(terminalWorkflow.progress.percentage, 100);
  assert.strictEqual(terminalWorkflow.progress.completedApplicableSteps, 15);
  assert.strictEqual(terminalWorkflow.permittedActions.filter((a) => a.isAvailable).length, 0, 'Terminal workflow has no forward next actions');
  pass('2.4 Deterministic progress calculation strictly reflects applicable steps; terminal stage reaches 100%');

  // =========================================================================
  // SECTION 3: Transition Matrix Restrictions, Prerequisites & Invariant Enforcement
  // =========================================================================
  console.log('\n[SECTION 3] Transition Matrix Restrictions, Prerequisites & Invariants');

  // Test 3.1: Strict Sequential Progression (N -> N+1) and Forward Jump Prohibitions
  const illegalForwardJumps = [
    { from: 1, to: 3, action: 'QUESTION_SUBMIT' },
    { from: 1, to: 5, action: 'QUESTION_SUBMIT' },
    { from: 2, to: 6, action: 'QUESTION_APPROVE' },
    { from: 3, to: 7, action: 'SCRIPT_SUBMIT' },
    { from: 7, to: 10, action: 'VIDEO_EDIT_APPROVE' },
    { from: 10, to: 15, action: 'PUBLICATION_SCHEDULE' },
  ];

  for (const jump of illegalForwardJumps) {
    const dummyInstance: WorkflowInstanceDocument = {
      id: `wfl_jump_test_${jump.from}`,
      entityType: 'QUESTION',
      entityId: `qst_jump_${jump.from}`,
      currentStep: jump.from as WorkflowStepNumber,
      contentStatus: 'IN_PROGRESS',
      mediaStatus: 'PENDING',
      publicationStatus: 'UNPUBLISHED',
      jobStatus: 'IDLE',
      authorId: 'usr_author_1',
      lastTransitionAt: new Date().toISOString(),
      isDeleted: false,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    assert.throws(
      () =>
        workflowEngine.evaluateTransition(
          dummyInstance,
          jump.to,
          jump.action,
          { id: 'usr_admin', role: CanonicalRbacRole.ADMIN, roles: [CanonicalRbacRole.ADMIN] }
        ),
      (err: any) => {
        assert(err instanceof InvalidWorkflowTransitionError);
        assert.strictEqual(err.statusCode, 422);
        assert(err.message.includes('strictly N -> N+1'));
        return true;
      },
      `Forward jump from Step ${jump.from} to Step ${jump.to} must be rejected with 422`
    );
  }
  pass('3.1 Arbitrary forward jumps strictly rejected with HTTP 422 InvalidWorkflowTransitionError');

  // Test 3.2: Wrong Source Step and Illegal Action Rejections
  const invalidActionCases = [
    { step: 1, target: 2, action: 'QUESTION_APPROVE' }, // QUESTION_APPROVE valid only from step 2
    { step: 2, target: 3, action: 'SCRIPT_SUBMIT' },     // SCRIPT_SUBMIT valid only from step 3
    { step: 3, target: 4, action: 'QUESTION_SUBMIT' },   // QUESTION_SUBMIT valid only from step 1
    { step: 1, target: 2, action: 'UNKNOWN_RANDOM_ACTION' },
  ];

  for (const tc of invalidActionCases) {
    const dummyInstance: WorkflowInstanceDocument = {
      id: `wfl_invalid_action_${tc.step}`,
      entityType: 'QUESTION',
      entityId: `qst_action_${tc.step}`,
      currentStep: tc.step as WorkflowStepNumber,
      contentStatus: 'IN_PROGRESS',
      mediaStatus: 'PENDING',
      publicationStatus: 'UNPUBLISHED',
      jobStatus: 'IDLE',
      authorId: 'usr_author_1',
      lastTransitionAt: new Date().toISOString(),
      isDeleted: false,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    assert.throws(
      () =>
        workflowEngine.evaluateTransition(
          dummyInstance,
          tc.target,
          tc.action,
          { id: 'usr_admin', role: CanonicalRbacRole.ADMIN, roles: [CanonicalRbacRole.ADMIN] }
        ),
      (err: any) => {
        assert(err instanceof InvalidWorkflowTransitionError);
        assert.strictEqual(err.statusCode, 422);
        return true;
      },
      `Action '${tc.action}' from step ${tc.step} to ${tc.target} must be rejected`
    );
  }
  pass('3.2 Wrong source steps and unrecognized action names rejected with HTTP 422');

  // Test 3.3: Mode-Specific Step 02 Content Prerequisites
  const testWfInstance: WorkflowInstanceDocument = {
    id: 'wfl_prereq_test',
    entityType: 'QUESTION',
    entityId: 'qst_prereq_test',
    currentStep: 1,
    contentStatus: 'DRAFT',
    mediaStatus: 'PENDING',
    publicationStatus: 'UNPUBLISHED',
    jobStatus: 'IDLE',
    authorId: 'usr_author_1',
    lastTransitionAt: new Date().toISOString(),
    isDeleted: false,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 3.3a: Mode 1 requires questionText and 4 options
  const m1MissingText = checkStepPrerequisites(testWfInstance, 2, 'QUESTION_SUBMIT', {
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    questionText: '',
    options: ['A', 'B', 'C', 'D'],
  });
  assert.strictEqual(m1MissingText.valid, false);
  assert(m1MissingText.errors.some((e) => e.includes('Question text is required')));

  const m1TooFewOptions = checkStepPrerequisites(testWfInstance, 2, 'QUESTION_SUBMIT', {
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    questionText: 'What is 5 + 5?',
    options: ['10', '11'], // Only 2 options
  });
  assert.strictEqual(m1TooFewOptions.valid, false);
  assert(m1TooFewOptions.errors.some((e) => e.includes('exactly 4 options')));

  const m1ValidPrereq = checkStepPrerequisites(testWfInstance, 2, 'QUESTION_SUBMIT', {
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    questionText: 'What is 5 + 5?',
    options: ['10', '11', '12', '13'],
  });
  assert.strictEqual(m1ValidPrereq.valid, true);

  // 3.3b: Mode 2 prohibits options and requires concept overview
  const m2ProhibitedOptions = checkStepPrerequisites(testWfInstance, 2, 'QUESTION_SUBMIT', {
    productionMode: 'TOPIC_INTRODUCTION',
    conceptTitle: 'Algebra Foundations',
    introductoryConcept: 'Overview of variables',
    options: ['Option A', 'Option B'],
  });
  assert.strictEqual(m2ProhibitedOptions.valid, false);
  assert(m2ProhibitedOptions.errors.some((e) => e.includes('strictly prohibits practice question options (N=0)')));

  const m2MissingConceptNotes = checkStepPrerequisites(testWfInstance, 2, 'QUESTION_SUBMIT', {
    productionMode: 'TOPIC_INTRODUCTION',
    conceptTitle: '',
    introductoryConcept: '',
  });
  assert.strictEqual(m2MissingConceptNotes.valid, false);
  assert(m2MissingConceptNotes.errors.some((e) => e.includes('Concept overview title or introductory concept notes are required')));

  const m2ValidPrereq = checkStepPrerequisites(testWfInstance, 2, 'QUESTION_SUBMIT', {
    productionMode: 'TOPIC_INTRODUCTION',
    conceptTitle: 'Time and Distance',
    introductoryConcept: 'Understanding speed, distance, and acceleration.',
  });
  assert.strictEqual(m2ValidPrereq.valid, true);

  // 3.3c: Mode 3 requires target count in [5, 10, 15, 20] and matching questions array
  const m3InvalidCountPrereq = checkStepPrerequisites(testWfInstance, 2, 'QUESTION_SUBMIT', {
    productionMode: 'EXPLAINED_QUESTIONS_VIDEO',
    targetQuestionCount: 3, // Not approved
  });
  assert.strictEqual(m3InvalidCountPrereq.valid, false);
  assert(m3InvalidCountPrereq.errors.some((e) => e.includes('strictly 5, 10, 15, or 20 questions')));

  const m3MissingQuestions = checkStepPrerequisites(testWfInstance, 2, 'QUESTION_SUBMIT', {
    productionMode: 'EXPLAINED_QUESTIONS_VIDEO',
    targetQuestionCount: 5,
    questions: [{ id: 'q1' }, { id: 'q2' }], // Only 2 provided out of 5
  });
  assert.strictEqual(m3MissingQuestions.valid, false);
  assert(m3MissingQuestions.errors.some((e) => e.includes('All 5 practice questions must be provided')));

  const m3ValidPrereq = checkStepPrerequisites(testWfInstance, 2, 'QUESTION_SUBMIT', {
    productionMode: 'EXPLAINED_QUESTIONS_VIDEO',
    targetQuestionCount: 5,
    questions: [{ id: 'q1' }, { id: 'q2' }, { id: 'q3' }, { id: 'q4' }, { id: 'q5' }],
  });
  assert.strictEqual(m3ValidPrereq.valid, true);
  pass('3.3 Step 02 content prerequisites verified across Modes 1, 2, and 3');

  // Test 3.4: Step 04 Teleprompter Pacing Duration Prerequisites
  // Mode 1: <= 58s / 60s
  const m1PacingExceeded = checkStepPrerequisites(testWfInstance, 4, 'LOCK_SCRIPT', {
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    estimatedDurationSeconds: 75,
  });
  assert.strictEqual(m1PacingExceeded.valid, false);
  assert(m1PacingExceeded.errors.some((e) => e.includes('Script duration exceeds 60 seconds; teleprompter pacing gate failed')));

  const m1PacingValid = checkStepPrerequisites(testWfInstance, 4, 'LOCK_SCRIPT', {
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    estimatedDurationSeconds: 52,
  });
  assert.strictEqual(m1PacingValid.valid, true);

  // Mode 2: <= 180s
  const m2PacingValid120s = checkStepPrerequisites(testWfInstance, 4, 'LOCK_SCRIPT', {
    productionMode: 'TOPIC_INTRODUCTION',
    estimatedDurationSeconds: 120,
  });
  assert.strictEqual(m2PacingValid120s.valid, true, 'Mode 2 with 120s must pass (ceiling is 180s)');

  const m2PacingExceeded200s = checkStepPrerequisites(testWfInstance, 4, 'LOCK_SCRIPT', {
    productionMode: 'TOPIC_INTRODUCTION',
    estimatedDurationSeconds: 200,
  });
  assert.strictEqual(m2PacingExceeded200s.valid, false);
  assert(m2PacingExceeded200s.errors.some((e) => e.includes('Script duration exceeds 180 seconds')));
  pass('3.4 Step 04 Teleprompter pacing gate enforces <= 60s for Mode 1 and <= 180s for Mode 2');

  // Test 3.5: Step 06 Media Prerequisite & Step 11 Publishing Prerequisite
  const failedMediaInstance: WorkflowInstanceDocument = {
    ...testWfInstance,
    currentStep: 5,
    mediaStatus: 'FAILED',
  };
  const step6Prereq = checkStepPrerequisites(failedMediaInstance, 6, 'SUBMIT_RAW_VIDEO');
  assert.strictEqual(step6Prereq.valid, false);
  assert(step6Prereq.errors.some((e) => e.includes('Raw media upload failed')));

  const step11FailedMediaInstance: WorkflowInstanceDocument = {
    ...testWfInstance,
    currentStep: 10,
    mediaStatus: 'FAILED',
  };
  const step11Prereq = checkStepPrerequisites(step11FailedMediaInstance, 11, 'EXECUTE_PUBLICATION');
  assert.strictEqual(step11Prereq.valid, false);
  assert(step11Prereq.errors.some((e) => e.includes('Media asset status is FAILED; cannot publish corrupted asset')));
  pass('3.5 Step 06 and Step 11 prerequisites strictly block advance when mediaStatus is FAILED');

  // Test 3.6: Revision and Rejection Routing
  // Step 2 -> Step 1 (QUESTION_REQUEST_CHANGES)
  const step2Instance: WorkflowInstanceDocument = {
    ...testWfInstance,
    currentStep: 2,
    contentStatus: 'IN_REVIEW',
  };
  const evalRevision = workflowEngine.evaluateTransition(
    step2Instance,
    1,
    'QUESTION_REQUEST_CHANGES',
    { id: 'usr_qa_reviewer', role: CanonicalRbacRole.QA_REVIEWER, roles: [CanonicalRbacRole.QA_REVIEWER] }
  );
  assert.strictEqual(evalRevision.rule.toStep, 1);
  assert.strictEqual(evalRevision.rule.type, 'REVISION');
  assert.strictEqual(evalRevision.resultingDimensions.workflowStep, 1);
  assert.strictEqual(evalRevision.resultingDimensions.contentStatus, 'DRAFT');

  // Step 2 -> Step 2 (QUESTION_TERMINATE)
  const evalTerminal = workflowEngine.evaluateTransition(
    step2Instance,
    2,
    'QUESTION_TERMINATE',
    { id: 'usr_qa_reviewer', role: CanonicalRbacRole.QA_REVIEWER, roles: [CanonicalRbacRole.QA_REVIEWER] }
  );
  assert.strictEqual(evalTerminal.rule.toStep, 2);
  assert.strictEqual(evalTerminal.rule.type, 'TERMINAL');
  assert.strictEqual(evalTerminal.resultingDimensions.contentStatus, 'REJECTED');

  // Step 7 -> Step 6 (VIDEO_QC_REJECT)
  const step7Instance: WorkflowInstanceDocument = {
    ...testWfInstance,
    currentStep: 7,
    contentStatus: 'IN_REVIEW',
  };
  const evalQcRevision = workflowEngine.evaluateTransition(
    step7Instance,
    6,
    'VIDEO_QC_REJECT',
    { id: 'usr_content_lead', role: CanonicalRbacRole.CONTENT_LEAD, roles: [CanonicalRbacRole.CONTENT_LEAD] }
  );
  assert.strictEqual(evalQcRevision.rule.toStep, 6);
  assert.strictEqual(evalQcRevision.resultingDimensions.contentStatus, 'REJECTED');
  pass('3.6 Revision routes (Step 02 -> Step 01, Step 07 -> Step 06) and terminal rejections verified');

  // =========================================================================
  // SECTION 4: Role-Based Authorization, Verification Gates & Anti-Self-Approval (GAR-02)
  // =========================================================================
  console.log('\n[SECTION 4] Role-Based Authorization, Verification Gates & GAR-02');

  // Test 4.1: Representative Capability Boundaries Across Workflow Roles
  const capabilityTestMatrix = [
    {
      step: 1,
      target: 2,
      action: 'QUESTION_SUBMIT',
      requiredCap: 'QUESTION:SUBMIT',
      authorizedRole: CanonicalRbacRole.QUESTION_AUTHOR,
      unauthorizedRole: CanonicalRbacRole.PRESENTER,
    },
    {
      step: 2,
      target: 3,
      action: 'QUESTION_APPROVE',
      requiredCap: 'QUESTION:APPROVE',
      authorizedRole: CanonicalRbacRole.QA_REVIEWER,
      unauthorizedRole: CanonicalRbacRole.QUESTION_AUTHOR,
    },
    {
      step: 3,
      target: 4,
      action: 'SCRIPT_SUBMIT',
      requiredCap: 'SCRIPT:SUBMIT',
      authorizedRole: CanonicalRbacRole.SCRIPTWRITER,
      unauthorizedRole: CanonicalRbacRole.ANALYST,
    },
    {
      step: 4,
      target: 5,
      action: 'FILMING_COMPLETE',
      requiredCap: 'VIDEO:EDIT',
      authorizedRole: CanonicalRbacRole.PRESENTER,
      unauthorizedRole: CanonicalRbacRole.QUESTION_AUTHOR,
    },
    {
      step: 6,
      target: 7,
      action: 'VIDEO_EDIT_COMPLETE',
      requiredCap: 'VIDEO_EDIT:SUBMIT',
      authorizedRole: CanonicalRbacRole.VIDEO_EDITOR,
      unauthorizedRole: CanonicalRbacRole.QUESTION_AUTHOR,
    },
    {
      step: 7,
      target: 8,
      action: 'VIDEO_QC_VERIFY',
      requiredCap: 'VIDEO_EDIT:APPROVE',
      authorizedRole: CanonicalRbacRole.CONTENT_LEAD,
      unauthorizedRole: CanonicalRbacRole.VIDEO_EDITOR,
    },
    {
      step: 9,
      target: 10,
      action: 'SOCIAL_REVIEW_APPROVE',
      requiredCap: 'SOCIAL_REVIEW:APPROVE',
      authorizedRole: CanonicalRbacRole.CONTENT_LEAD,
      unauthorizedRole: CanonicalRbacRole.DESIGNER,
    },
    {
      step: 10,
      target: 11,
      action: 'PUBLISH_SCHEDULE',
      requiredCap: 'PUBLICATION:SCHEDULE',
      authorizedRole: CanonicalRbacRole.PUBLISHING_LEAD,
      unauthorizedRole: CanonicalRbacRole.VIDEO_EDITOR,
    },
    {
      step: 15,
      target: 15,
      action: 'COMPLETE_WORKFLOW',
      requiredCap: 'INTELLIGENCE_INSIGHT:APPROVE',
      authorizedRole: CanonicalRbacRole.CONTENT_LEAD,
      unauthorizedRole: CanonicalRbacRole.QUESTION_AUTHOR,
    },
  ];

  for (const tc of capabilityTestMatrix) {
    const item: WorkflowInstanceDocument = {
      id: `wfl_rbac_${tc.step}`,
      entityType: 'QUESTION',
      entityId: `qst_rbac_${tc.step}`,
      currentStep: tc.step as WorkflowStepNumber,
      contentStatus: 'IN_REVIEW',
      mediaStatus: 'PENDING',
      publicationStatus: 'UNPUBLISHED',
      jobStatus: 'IDLE',
      authorId: 'usr_original_author',
      lastTransitionAt: new Date().toISOString(),
      isDeleted: false,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Unauthorized actor must be rejected with 403 ForbiddenError
    assert.throws(
      () =>
        workflowEngine.evaluateTransition(
          item,
          tc.target,
          tc.action,
          { id: 'usr_unauthorized', role: tc.unauthorizedRole, roles: [tc.unauthorizedRole] }
        ),
      (err: any) => {
        assert(err instanceof ForbiddenError, `Expected ForbiddenError for unauthorized ${tc.unauthorizedRole}`);
        assert.strictEqual(err.statusCode, 403);
        assert(err.message.includes(`Actor lacks required capability '${tc.requiredCap}'`));
        return true;
      },
      `Actor with role ${tc.unauthorizedRole} must be rejected at Step ${tc.step}`
    );

    // 2. Authorized actor must be accepted
    const evalResult = workflowEngine.evaluateTransition(
      item,
      tc.target,
      tc.action,
      { id: 'usr_authorized_independent', role: tc.authorizedRole, roles: [tc.authorizedRole] }
    );
    assert.strictEqual(evalResult.rule.toStep, tc.target);
  }
  pass('4.1 Capability boundaries strictly enforced across all 9 distinct operational roles');

  // Test 4.2: Verification Gates & GAR-02 Segregation of Duties
  const authorUserId = 'usr_author_123';
  const gateWfInstance: WorkflowInstanceDocument = {
    id: 'wfl_gar02_test',
    entityType: 'QUESTION',
    entityId: 'qst_gar02_test',
    currentStep: 2,
    contentStatus: 'IN_REVIEW',
    mediaStatus: 'PENDING',
    publicationStatus: 'UNPUBLISHED',
    jobStatus: 'IDLE',
    authorId: authorUserId,
    lastTransitionAt: new Date().toISOString(),
    isDeleted: false,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 4.2a: Author trying to approve own question at Step 02 (even if they possess QA_REVIEWER or ADMIN role)
  assert.throws(
    () =>
      workflowEngine.evaluateTransition(
        gateWfInstance,
        3,
        'QUESTION_APPROVE',
        { id: authorUserId, role: CanonicalRbacRole.QA_REVIEWER, roles: [CanonicalRbacRole.QA_REVIEWER] }
      ),
    (err: any) => {
      assert(err instanceof ForbiddenError);
      assert.strictEqual(err.statusCode, 403);
      assert(err.message.includes('Self-approval strictly prohibited under GAR-02'));
      return true;
    },
    'Author self-approval at Step 02 must be rejected under GAR-02'
  );

  // Even Admin cannot self-approve their own author record under strict GAR-02
  assert.throws(
    () =>
      workflowEngine.evaluateTransition(
        gateWfInstance,
        3,
        'QUESTION_APPROVE',
        { id: authorUserId, role: CanonicalRbacRole.ADMIN, roles: [CanonicalRbacRole.ADMIN] }
      ),
    (err: any) => {
      assert(err instanceof ForbiddenError);
      assert.strictEqual(err.statusCode, 403);
      assert(err.message.includes('GAR-02'));
      return true;
    },
    'Admin who is also author cannot self-approve own work at Step 02'
  );

  // 4.2b: Independent QA Reviewer succeeds
  const evalIndependent = workflowEngine.evaluateTransition(
    gateWfInstance,
    3,
    'QUESTION_APPROVE',
    { id: 'usr_different_qa_reviewer', role: CanonicalRbacRole.QA_REVIEWER, roles: [CanonicalRbacRole.QA_REVIEWER] }
  );
  assert.strictEqual(evalIndependent.rule.toStep, 3);
  assert.strictEqual(evalIndependent.resultingDimensions.contentStatus, 'APPROVED');
  pass('4.2 GAR-02 anti-self-approval strictly enforced at verification gates; independent reviewer approved');

  // Test 4.3: Autonomous AI Decision Prohibition (AP-009)
  assert.throws(
    () =>
      workflowEngine.evaluateTransition(
        gateWfInstance,
        3,
        'QUESTION_APPROVE',
        { id: 'ai_gemini_agent', role: CanonicalRbacRole.QA_REVIEWER, isAiAgent: true }
      ),
    (err: any) => {
      assert(err instanceof ForbiddenError);
      assert.strictEqual(err.statusCode, 403);
      assert(err.message.includes('Autonomous AI transition prohibited'));
      return true;
    },
    'AI agent must be prohibited from making workflow transition decisions'
  );
  pass('4.3 Autonomous AI agents strictly blocked from workflow state decisions under AP-009');

  // Test 4.4: Non-Mutation Invariant on Failed Transitions
  // Create real persisted workflow instance
  const persistedWf = await workflowService.createInstance(
    {
      entityType: 'QUESTION',
      entityId: 'qst_non_mutation_check',
      currentStep: 2,
      contentStatus: 'IN_REVIEW',
      authorId: 'usr_author_preserve',
      mediaStatus: 'NOT_REQUIRED',
      publicationStatus: 'UNPUBLISHED',
      jobStatus: 'IDLE',
      metadata: { productionMode: 'QUESTION_CHALLENGE_SHORT' },
    },
    { id: 'usr_author_preserve', role: CanonicalRbacRole.QUESTION_AUTHOR }
  );
  assert.strictEqual(persistedWf.currentStep, 2);
  assert.strictEqual(persistedWf.version, 1);

  // Attempt 1: Unauthorized actor
  try {
    await workflowService.transition(
      persistedWf.id,
      {
        targetStep: 3,
        action: 'QUESTION_APPROVE',
        expectedVersion: 1,
        reason: 'Unauthorized attempt',
      },
      { id: 'usr_unauth', role: CanonicalRbacRole.PRESENTER, roles: [CanonicalRbacRole.PRESENTER] }
    );
    assert.fail('Should have failed authorization');
  } catch (err: any) {
    assert(err instanceof ForbiddenError);
  }

  // Verify datastore state unchanged
  let check1 = await workflowService.getInstance(persistedWf.id);
  assert.strictEqual(check1.currentStep, 2, 'currentStep must not mutate on authorization failure');
  assert.strictEqual(check1.version, 1, 'version must not mutate on authorization failure');
  assert.strictEqual(check1.contentStatus, 'IN_REVIEW', 'contentStatus must not mutate on failure');

  // Attempt 2: GAR-02 Self-Approval
  try {
    await workflowService.transition(
      persistedWf.id,
      {
        targetStep: 3,
        action: 'QUESTION_APPROVE',
        expectedVersion: 1,
        reason: 'Author self-approval attempt',
      },
      { id: 'usr_author_preserve', role: CanonicalRbacRole.QA_REVIEWER, roles: [CanonicalRbacRole.QA_REVIEWER] }
    );
    assert.fail('Should have failed GAR-02');
  } catch (err: any) {
    assert(err instanceof ForbiddenError);
  }

  let check2 = await workflowService.getInstance(persistedWf.id);
  assert.strictEqual(check2.currentStep, 2, 'currentStep must not mutate on GAR-02 failure');
  assert.strictEqual(check2.version, 1, 'version must not mutate on GAR-02 failure');

  // Attempt 3: Illegal forward jump (2 -> 6)
  try {
    await workflowService.transition(
      persistedWf.id,
      {
        targetStep: 6,
        action: 'QUESTION_APPROVE',
        expectedVersion: 1,
        reason: 'Illegal jump',
      },
      { id: 'usr_reviewer_ind', role: CanonicalRbacRole.QA_REVIEWER, roles: [CanonicalRbacRole.QA_REVIEWER] }
    );
    assert.fail('Should have failed illegal jump');
  } catch (err: any) {
    assert(err instanceof InvalidWorkflowTransitionError);
  }

  let check3 = await workflowService.getInstance(persistedWf.id);
  assert.strictEqual(check3.currentStep, 2, 'currentStep must not mutate on illegal jump');
  assert.strictEqual(check3.version, 1, 'version must not mutate on illegal jump');

  // Attempt 4: Stale OCC version conflict
  try {
    await workflowService.transition(
      persistedWf.id,
      {
        targetStep: 3,
        action: 'QUESTION_APPROVE',
        expectedVersion: 999, // Stale version
        reason: 'Stale version attempt',
      },
      { id: 'usr_reviewer_ind', role: CanonicalRbacRole.QA_REVIEWER, roles: [CanonicalRbacRole.QA_REVIEWER] }
    );
    assert.fail('Should have failed OCC check');
  } catch (err: any) {
    assert(err instanceof ConcurrencyConflictError);
  }

  let check4 = await workflowService.getInstance(persistedWf.id);
  assert.strictEqual(check4.currentStep, 2, 'currentStep must not mutate on OCC conflict');
  assert.strictEqual(check4.version, 1, 'version must not mutate on OCC conflict');
  pass('4.4 Non-mutation invariant verified: workflow state and version strictly preserved on all failure modes');

  // =========================================================================
  // SECTION 5: End-to-End Multi-Mode Workflow Lifecycle Simulation
  // =========================================================================
  console.log('\n[SECTION 5] End-to-End Multi-Mode Workflow Lifecycle Simulation');

  // 5.1 Mode 1 E2E Sequential Lifecycle Advance
  const m1Wf = await workflowService.createInstance(
    {
      entityType: 'QUESTION',
      entityId: 'qst_sim_mode_1',
      currentStep: 1,
      contentStatus: 'DRAFT',
      authorId: 'usr_m1_author',
      metadata: { productionMode: 'QUESTION_CHALLENGE_SHORT' },
    },
    { id: 'usr_m1_author', role: CanonicalRbacRole.QUESTION_AUTHOR }
  );

  // Advance Step 1 -> 2
  const m1Step2Res = await workflowService.transition(
    m1Wf.id,
    {
      targetStep: 2,
      action: 'QUESTION_SUBMIT',
      expectedVersion: 1,
      reason: 'Mode 1 submitted for verification',
    },
    { id: 'usr_m1_author', role: CanonicalRbacRole.QUESTION_AUTHOR }
  );
  assert.strictEqual(m1Step2Res.workflow.currentStep, 2);
  assert.strictEqual(m1Step2Res.workflow.version, 2);

  // Advance Step 2 -> 3 with independent reviewer
  const m1Step3Res = await workflowService.transition(
    m1Wf.id,
    {
      targetStep: 3,
      action: 'QUESTION_APPROVE',
      expectedVersion: 2,
      reason: 'Mode 1 approved with 10-point proof checklist',
    },
    { id: 'usr_m1_qa_reviewer', role: CanonicalRbacRole.QA_REVIEWER, roles: [CanonicalRbacRole.QA_REVIEWER] }
  );
  assert.strictEqual(m1Step3Res.workflow.currentStep, 3);
  assert.strictEqual(m1Step3Res.workflow.version, 3);
  assert.strictEqual(m1Step3Res.workflow.contentStatus, 'APPROVED');
  pass('5.1 Mode 1 sequential advance through Step 01 -> Step 02 -> Step 03 verified');

  // 5.2 Mode 2 E2E Sequential Lifecycle Advance with Revision Cycle
  const m2Wf = await workflowService.createInstance(
    {
      entityType: 'QUESTION',
      entityId: 'qst_sim_mode_2',
      currentStep: 1,
      contentStatus: 'DRAFT',
      authorId: 'usr_m2_author',
      metadata: { productionMode: 'TOPIC_INTRODUCTION' },
    },
    { id: 'usr_m2_author', role: CanonicalRbacRole.QUESTION_AUTHOR }
  );

  // Submit Step 1 -> 2
  await workflowService.transition(
    m2Wf.id,
    {
      targetStep: 2,
      action: 'QUESTION_SUBMIT',
      expectedVersion: 1,
      reason: 'Mode 2 concept submitted',
    },
    { id: 'usr_m2_author', role: CanonicalRbacRole.QUESTION_AUTHOR }
  );

  // Reviewer requests revision at Step 02 (Step 2 -> 1)
  const m2RevisionRes = await workflowService.transition(
    m2Wf.id,
    {
      targetStep: 1,
      action: 'QUESTION_REQUEST_CHANGES',
      expectedVersion: 2,
      reason: 'Concept explanation needs more real-world context examples',
    },
    { id: 'usr_m2_qa_reviewer', role: CanonicalRbacRole.QA_REVIEWER, roles: [CanonicalRbacRole.QA_REVIEWER] }
  );
  assert.strictEqual(m2RevisionRes.workflow.currentStep, 1, 'Must return to Step 1 on revision request');
  assert.strictEqual(m2RevisionRes.workflow.contentStatus, 'DRAFT');
  assert.strictEqual(m2RevisionRes.workflow.version, 3);

  // Author fixes concept and re-submits Step 1 -> 2
  await workflowService.transition(
    m2Wf.id,
    {
      targetStep: 2,
      action: 'QUESTION_SUBMIT',
      expectedVersion: 3,
      reason: 'Re-submitted with enhanced context notes',
    },
    { id: 'usr_m2_author', role: CanonicalRbacRole.QUESTION_AUTHOR }
  );

  // Independent QA approves Step 2 -> 3
  const m2ApproveRes = await workflowService.transition(
    m2Wf.id,
    {
      targetStep: 3,
      action: 'QUESTION_APPROVE',
      expectedVersion: 4,
      reason: 'Mode 2 5-point concept checklist certified',
    },
    { id: 'usr_m2_qa_reviewer', role: CanonicalRbacRole.QA_REVIEWER, roles: [CanonicalRbacRole.QA_REVIEWER] }
  );
  assert.strictEqual(m2ApproveRes.workflow.currentStep, 3);
  assert.strictEqual(m2ApproveRes.workflow.contentStatus, 'APPROVED');
  pass('5.2 Mode 2 revision cycle (Step 02 -> Step 01 -> Step 02 -> Step 03) verified with OCC version increments');

  // 5.3 Mode 3 Masterclass Multi-Question Lifecycle Advance
  const m3Wf = await workflowService.createInstance(
    {
      entityType: 'QUESTION',
      entityId: 'qst_sim_mode_3',
      currentStep: 1,
      contentStatus: 'DRAFT',
      authorId: 'usr_m3_author',
      metadata: { productionMode: 'EXPLAINED_QUESTIONS_VIDEO', targetQuestionCount: 5 },
    },
    { id: 'usr_m3_author', role: CanonicalRbacRole.QUESTION_AUTHOR }
  );

  // Submit Step 1 -> 2 with valid prerequisites (5 questions)
  await workflowService.transition(
    m3Wf.id,
    {
      targetStep: 2,
      action: 'QUESTION_SUBMIT',
      expectedVersion: 1,
      reason: 'Mode 3 masterclass draft submitted with 5 questions',
      contentPayload: {
        productionMode: 'EXPLAINED_QUESTIONS_VIDEO',
        targetQuestionCount: 5,
        questions: [{ id: 'q1' }, { id: 'q2' }, { id: 'q3' }, { id: 'q4' }, { id: 'q5' }],
      },
    },
    { id: 'usr_m3_author', role: CanonicalRbacRole.QUESTION_AUTHOR }
  );

  // Independent reviewer approves Step 2 -> 3
  const m3ApproveRes = await workflowService.transition(
    m3Wf.id,
    {
      targetStep: 3,
      action: 'QUESTION_APPROVE',
      expectedVersion: 2,
      reason: 'Masterclass set approved for multi-part teleprompter scripting',
    },
    { id: 'usr_m3_qa_reviewer', role: CanonicalRbacRole.QA_REVIEWER, roles: [CanonicalRbacRole.QA_REVIEWER] }
  );
  assert.strictEqual(m3ApproveRes.workflow.currentStep, 3);
  assert.strictEqual(m3ApproveRes.workflow.contentStatus, 'APPROVED');
  pass('5.3 Mode 3 multi-question masterclass verified with prerequisite validation and independent approval');

  console.log('\n========================================================================');
  console.log(`ALL S8-T16 TESTS PASSED: ${passedTests} checks verified successfully.`);
  console.log('========================================================================\n');
}

runS8T16WorkflowRuleTests().catch((err) => {
  console.error('\n❌ S8-T16 TEST SUITE FAILURE:', err);
  process.exit(1);
});
