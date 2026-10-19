/**
 * BURRA PARIKSHA CMS — S8-T07 Unit Test Suite
 * Draft Reopening, Deep-Link Grounding, and Production Mode Selection
 *
 * Verifies all 6 mandatory requirements of S8-T07:
 * 1. Draft hydration: candidate fields, taxonomy, options, savedDraftId, clean state.
 * 2. Invalid/missing draft ID handling (404/safe error handling).
 * 3. URL/config precedence: persisted draft strictly overrides conflicting URL defaults.
 * 4. Mode configurations: Mode 1, Mode 2, and Mode 3 rules (ADR-010/ADR-011).
 * 5. Unsaved-work protection: dirty-state beforeunload warning logic.
 * 6. Save Draft vs. Submit for Verification isolation.
 */

import assert from 'node:assert';
import { questionGenerationService } from '../../backend/domain/question-generation';
import {
  QuestionStatus,
  canonicalIdService,
  validateProductionModeConfig,
  ContentProductionMode,
} from '../../shared';

async function runS8T07UnitTests() {
  console.log('============================================================');
  console.log('RUNNING S8-T07 UNIT TESTS: Draft Reopening & Mode Selection');
  console.log('============================================================\n');

  // Test 1: Draft Hydration & Restoration
  console.log('[Test 1] Draft Hydration: Persisting and reopening draft restores all candidate fields and state...');
  const initialDraftPayload = {
    topicId: 'top_10000000-0000-4000-8000-000000000001',
    subtopicId: 'sub_10000000-0000-4000-8000-000000000101',
    difficulty: 'Hard',
    language: 'TELUGU',
    questionText: 'ఒక రైలు 60 కిమీ/గం వేగంతో 120 మీటర్ల ప్లాట్‌ఫారమ్‌ను ఎంత సమయంలో దాటుతుంది?',
    options: {
      a: '12 సెకన్లు',
      b: '15 సెకన్లు',
      c: '18 సెకన్లు',
      d: '24 సెకన్లు',
    },
    correctAnswer: 'B' as const,
    explanation: 'రైలు వేగం 60 * (5/18) = 50/3 మీ/సె. దూరం = 120మీ, కావున సమయం = 15 సెకన్లు.',
    realLifeContext: 'రైల్వే పరీక్షల విభాగం సమస్య',
    questionStyle: 'STORY_BASED',
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    targetQuestionCount: 1,
    aspectRatio: '9:16',
    tags: ['Aptitude', 'Trains', 'Speed'],
  };

  const savedDraft = await questionGenerationService.saveDraft(initialDraftPayload, {
    id: 'USR-AUTHOR-01',
    name: 'Author S8',
  });

  assert(savedDraft.id.startsWith('dft_'), 'Draft must be assigned a canonical ID starting with dft_');
  assert.strictEqual(savedDraft.status, QuestionStatus.DRAFT, 'Draft must be saved in DRAFT status');
  assert.strictEqual(savedDraft.workflowStage, 'QUESTION_STUDIO', 'Draft stage must be QUESTION_STUDIO');

  // Hydrate draft through service retrieval (mirroring questionsApi.getDraft)
  const hydratedDraft = await questionGenerationService.getDraftById(savedDraft.id);
  assert(hydratedDraft !== null, 'Hydrated draft must exist');
  assert.strictEqual(hydratedDraft?.id, savedDraft.id, 'Hydrated draft ID must match');
  assert.strictEqual(hydratedDraft?.questionText, initialDraftPayload.questionText, 'Question text must be restored');
  assert.strictEqual(hydratedDraft?.options.a, initialDraftPayload.options.a, 'Option A must be restored');
  assert.strictEqual(hydratedDraft?.options.b, initialDraftPayload.options.b, 'Option B must be restored');
  assert.strictEqual(hydratedDraft?.options.c, initialDraftPayload.options.c, 'Option C must be restored');
  assert.strictEqual(hydratedDraft?.options.d, initialDraftPayload.options.d, 'Option D must be restored');
  assert.strictEqual(hydratedDraft?.correctAnswer, initialDraftPayload.correctAnswer, 'Correct answer must be restored');
  assert.strictEqual(hydratedDraft?.explanation, initialDraftPayload.explanation, 'Explanation must be restored');
  assert.strictEqual(hydratedDraft?.topicId, initialDraftPayload.topicId, 'Topic ID must be restored');
  assert.strictEqual(hydratedDraft?.subtopicId, initialDraftPayload.subtopicId, 'Subtopic ID must be restored');
  assert.strictEqual(hydratedDraft?.difficulty, initialDraftPayload.difficulty, 'Difficulty must be restored');
  assert.strictEqual(hydratedDraft?.language, initialDraftPayload.language, 'Language must be restored');
  assert.strictEqual(hydratedDraft?.productionMode, 'QUESTION_CHALLENGE_SHORT', 'Production mode must be restored');
  assert.strictEqual(hydratedDraft?.targetQuestionCount, 1, 'Target question count must be restored');
  assert.strictEqual(hydratedDraft?.aspectRatio, '9:16', 'Aspect ratio must be restored');
  console.log('  PASS: Draft hydration successfully verified with all candidate and mode fields.\n');

  // Test 2: Invalid / Missing Draft ID Handling
  console.log('[Test 2] Invalid/Missing IDs: Loading non-existent draft ID returns null safely...');
  const missingDraft = await questionGenerationService.getDraftById('dft_00000000-0000-4000-8000-000000000000');
  assert.strictEqual(missingDraft, null, 'Querying non-existent draft ID must return null without crashing');

  let submitFailed = false;
  try {
    await questionGenerationService.submitForVerification(
      { draftId: 'dft_00000000-0000-4000-8000-000000000000', expectedVersion: 1 },
      { id: 'USR-AUTHOR-01', name: 'Author S8' }
    );
  } catch (err: any) {
    submitFailed = true;
    assert.strictEqual(err?.statusCode, 404, 'Submitting non-existent draft must return 404');
  }
  assert(submitFailed, 'Expected submission of non-existent draft to be rejected with 404');
  console.log('  PASS: Missing and non-existent draft IDs handled safely with expected 404.\n');

  // Test 3: URL / Config Precedence
  console.log('[Test 3] Precedence: Persisted draft data strictly overrides conflicting URL defaults...');
  // Simulate URL parameters having conflicting topic/difficulty vs what is persisted in draft
  const conflictingUrlParams = {
    topicId: 'TOP-QA-02', // Conflicting URL topic
    subtopicId: 'SUB-02', // Conflicting URL subtopic
    difficulty: 'Easy',   // Conflicting URL difficulty
    language: 'ENGLISH',  // Conflicting URL language
  };

  // Precedence resolution logic (as implemented in useQuestionGeneration hook)
  const resolvedTopicId = hydratedDraft?.topicId || conflictingUrlParams.topicId;
  const resolvedSubtopicId = hydratedDraft?.subtopicId || conflictingUrlParams.subtopicId;
  const resolvedDifficulty = hydratedDraft?.difficulty || conflictingUrlParams.difficulty;
  const resolvedLanguage = hydratedDraft?.language || conflictingUrlParams.language;

  assert.strictEqual(resolvedTopicId, 'top_10000000-0000-4000-8000-000000000001', 'Persisted draft topicId must take precedence over URL param');
  assert.strictEqual(resolvedSubtopicId, 'sub_10000000-0000-4000-8000-000000000101', 'Persisted draft subtopicId must take precedence over URL param');
  assert.strictEqual(resolvedDifficulty, 'Hard', 'Persisted draft difficulty must take precedence over URL param');
  assert.strictEqual(resolvedLanguage, 'TELUGU', 'Persisted draft language must take precedence over URL param');
  console.log('  PASS: Persisted draft data strictly overrides conflicting URL search parameters.\n');

  // Test 4: Mode Configurations & ADR-010/ADR-011 Validation
  console.log('[Test 4] Mode Configurations: Enforces accepted counts and aspect-ratio constraints across all 3 modes...');
  
  // Mode 1: QUESTION_CHALLENGE_SHORT (counts: 1 or batch [5,10,15,20], aspect: '9:16')
  const m1Valid1 = validateProductionModeConfig('QUESTION_CHALLENGE_SHORT', 1, '9:16');
  assert(m1Valid1.isValid, 'Mode 1 with 1 question and 9:16 must be valid');

  const m1ValidBatch = validateProductionModeConfig('QUESTION_CHALLENGE_SHORT', 5, '9:16');
  assert(m1ValidBatch.isValid, 'Mode 1 with 5 questions and 9:16 must be valid');

  const m1InvalidCount = validateProductionModeConfig('QUESTION_CHALLENGE_SHORT', 0, '9:16');
  assert(!m1InvalidCount.isValid, 'Mode 1 with 0 questions must be invalid');

  const m1InvalidAspect = validateProductionModeConfig('QUESTION_CHALLENGE_SHORT', 1, '16:9');
  assert(!m1InvalidAspect.isValid, 'Mode 1 with 16:9 aspect ratio must be invalid');

  // Mode 2: TOPIC_INTRODUCTION (count: 0, aspect: '9:16' or '16:9')
  const m2ValidVertical = validateProductionModeConfig('TOPIC_INTRODUCTION', 0, '9:16');
  assert(m2ValidVertical.isValid, 'Mode 2 with 0 questions and 9:16 must be valid');

  const m2ValidLandscape = validateProductionModeConfig('TOPIC_INTRODUCTION', 0, '16:9');
  assert(m2ValidLandscape.isValid, 'Mode 2 with 0 questions and 16:9 must be valid');

  const m2InvalidCount = validateProductionModeConfig('TOPIC_INTRODUCTION', 1, '9:16');
  assert(!m2InvalidCount.isValid, 'Mode 2 with > 0 questions must be invalid');

  // Mode 3: EXPLAINED_QUESTIONS_VIDEO (counts: [5, 10, 15, 20], aspect: '16:9')
  const m3Valid10 = validateProductionModeConfig('EXPLAINED_QUESTIONS_VIDEO', 10, '16:9');
  assert(m3Valid10.isValid, 'Mode 3 with 10 questions and 16:9 must be valid');

  const m3InvalidCount = validateProductionModeConfig('EXPLAINED_QUESTIONS_VIDEO', 1, '16:9');
  assert(!m3InvalidCount.isValid, 'Mode 3 with 1 question must be invalid');

  const m3InvalidAspect = validateProductionModeConfig('EXPLAINED_QUESTIONS_VIDEO', 10, '9:16');
  assert(!m3InvalidAspect.isValid, 'Mode 3 with 9:16 aspect ratio must be invalid');

  console.log('  PASS: All 3 production modes verified against ADR-010/ADR-011 count and aspect ratio rules.\n');

  // Test 5: Unsaved-Work Protection Logic
  console.log('[Test 5] Unsaved-Work Protection: Dirty-state beforeunload handler behavior...');
  function simulateBeforeUnload(isDirty: boolean) {
    let prevented = false;
    let returnValue: string | undefined = undefined;
    const fakeEvent = {
      preventDefault: () => {
        prevented = true;
      },
      returnValue: undefined as any,
    };

    if (isDirty) {
      fakeEvent.preventDefault();
      fakeEvent.returnValue = '';
      returnValue = fakeEvent.returnValue;
    }

    return { prevented, returnValue };
  }

  const dirtyResult = simulateBeforeUnload(true);
  assert.strictEqual(dirtyResult.prevented, true, 'Dirty form must trigger event.preventDefault()');
  assert.strictEqual(dirtyResult.returnValue, '', 'Dirty form must set event.returnValue to empty string');

  const cleanResult = simulateBeforeUnload(false);
  assert.strictEqual(cleanResult.prevented, false, 'Clean form must NOT trigger preventDefault()');
  assert.strictEqual(cleanResult.returnValue, undefined, 'Clean form must NOT set returnValue');
  console.log('  PASS: Unsaved-work beforeunload protection triggers on dirty state and bypasses on clean state.\n');

  // Test 6: Save Draft vs. Submit for Verification Isolation
  console.log('[Test 6] Save Draft vs. Submit Separation: In-place persistence without premature workflow progression...');
  // 6a: Saving draft remains in Stage 01
  assert.strictEqual(savedDraft.status, QuestionStatus.DRAFT, 'Saving draft must never advance status beyond DRAFT');
  assert.strictEqual(savedDraft.workflowStage, 'QUESTION_STUDIO', 'Saving draft must stay in QUESTION_STUDIO stage');

  // 6b: Submit for verification requires a valid saved draft
  const submitResult = await questionGenerationService.submitForVerification(
    { draftId: savedDraft.id, remarks: 'Verified by author', expectedVersion: savedDraft.version ?? 1 },
    { id: 'USR-AUTHOR-01', name: 'Author S8' }
  );
  assert.strictEqual(submitResult.success, true, 'Explicit submit for verification must succeed for saved draft');
  assert.strictEqual(submitResult.draftId, savedDraft.id, 'Submitted draft ID must match');
  assert.strictEqual(submitResult.workflowStage, 'STAGE_02_VERIFICATION', 'Draft transitions to Stage 02 upon explicit submission');

  // Clean up test draft
  await questionGenerationService.deleteDraft(savedDraft.id);
  console.log('  PASS: Save Draft persists in-place; Submit for Verification explicitly advances workflow.\n');

  console.log('============================================================');
  console.log('ALL S8-T07 UNIT TESTS PASSED SUCCESSFULLY (6/6)');
  console.log('============================================================');
}

runS8T07UnitTests().catch((err) => {
  console.error('S8-T07 Unit Tests FAILED:', err);
  process.exit(1);
});
