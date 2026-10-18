/**
 * BURRA PARIKSHA CMS — S9-T12: Deterministic Question Quality Validation Unit Tests
 * Specification: S9-T04 / S9-T12 Quality Verification Criteria (VAL-Q-01 through VAL-Q-12)
 *
 * NOTE: As per S9-T12 task execution instructions, this test file is authored for
 * static inspection and future regression verification. IT MUST NOT BE EXECUTED
 * during the T12 implementation run.
 *
 * Test Scenarios Covered:
 * 1. Valid single question and valid batch (all QVC criteria satisfied)
 * 2. Missing required fields (VAL-Q-01 prompt, VAL-Q-02 options, VAL-Q-04 answer key)
 * 3. Invalid choice/answer combinations (VAL-Q-03 answer out-of-set, duplicate options)
 * 4. Configured-count mismatch and incomplete batch (VAL-Q-08 incomplete slots)
 * 5. Duplicate questions (VAL-Q-06A exact batch duplicates and VAL-Q-06B semantic overlap)
 * 6. Unsupported enum or allowed value / placeholder content (VAL-Q-05 TODO/placeholder detection)
 * 7. Error (BLOCKING) versus warning (WARNING) classification (VAL-Q-11 length, VAL-Q-12 brevity)
 * 8. Generated vs manually edited questions evaluated under identical deterministic rules
 * 9. Deterministic idempotency (identical inputs yield strictly identical validation outputs)
 * 10. Authoritative server-side submission gate (HTTP 422 rejection when client validation is bypassed)
 * 11. Valid submission proceeds through the existing workflow
 * 12. Slot mutation preservation (accepted and manually edited slots remain intact)
 */

import assert from 'node:assert/strict';
import {
  validateQuestionQuality,
  formatValidationErrors,
} from '../../../shared/lib/question-quality-validator';
import {
  QuestionQualityIssue,
  QuestionQualityValidationResult,
  QuestionBatchSlot,
  StudioCandidate,
  DifficultyLevel,
  QuestionLanguage,
  QuestionStatus,
} from '../../../shared';
import { questionGenerationService } from '../../../backend/domain/question-generation/question-generation.service';

export async function runDeterministicQualityValidationTests(): Promise<void> {
  console.log('============================================================');
  console.log('SUITE: S9-T12 Deterministic Question Quality Validation');
  console.log('============================================================\n');

  // --------------------------------------------------------------------------
  // TEST 1: Valid Single Question and Valid Batch (All Criteria Satisfied)
  // --------------------------------------------------------------------------
  console.log('[Test 1] Valid single question and valid batch passing all QVC rules...');
  const validSingleQuestion = {
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    questionText: 'రైలు 72 కి.మీ/గం వేగంతో ప్రయాణిస్తూ 200 మీటర్ల ప్లాట్‌ఫారమ్‌ను ఎంత సమయంలో దాటుతుంది?',
    optionA: '10 సెకన్లు',
    optionB: '15 సెకన్లు',
    optionC: '20 సెకన్లు',
    optionD: '25 సెకన్లు',
    correctAnswer: 'A' as const,
    explanation: 'వేగం = 72 * (5/18) = 20 m/s. కాలం = 200 / 20 = 10 సెకన్లు. బుర్ర ట్రిక్: 18 * 4 = 72 కాబట్టి 5 * 4 = 20 m/s.',
    difficulty: DifficultyLevel.MEDIUM,
    language: QuestionLanguage.TELUGU,
  };

  const singleResult = validateQuestionQuality(validSingleQuestion, { requireExplanation: true });
  assert.equal(singleResult.isValid, true, 'Valid single question must pass validation');
  assert.equal(singleResult.hasErrors, false);
  assert.equal(singleResult.errors.length, 0);

  const validBatchSlots: QuestionBatchSlot[] = Array.from({ length: 5 }, (_, idx) => ({
    slotNumber: idx + 1,
    slotId: `slt_valid_${idx + 1}`,
    status: 'VALID',
    questionText: `గణిత సమస్య ప్రశ్న సంఖ్య ${idx + 1}: దూరం మరియు వేగం గణన.`,
    options: {
      a: `జవాబు ఎంపిక ఎ ${idx + 1}`,
      b: `జవాబు ఎంపిక బి ${idx + 1}`,
      c: `జవాబు ఎంపిక సి ${idx + 1}`,
      d: `జవాబు ఎంపిక డి ${idx + 1}`,
    },
    correctAnswer: 'B',
    explanation: `వివరణ మరియు బుర్ర వేగవంతమైన సాధన విధానం సంఖ్య ${idx + 1}.`,
    isManuallyEdited: false,
    validationErrors: [],
    revisionNumber: 1,
  }));

  const batchResult = validateQuestionQuality({
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    targetQuestionCount: 5,
    slots: validBatchSlots,
  }, { requireExplanation: true });
  assert.equal(batchResult.isValid, true, 'Valid 5-slot batch must pass validation');
  assert.equal(batchResult.errors.length, 0);
  console.log('✓ Valid question and valid batch pass without errors');

  // --------------------------------------------------------------------------
  // TEST 2: Missing Required Fields (VAL-Q-01, VAL-Q-02, VAL-Q-04)
  // --------------------------------------------------------------------------
  console.log('[Test 2] Missing required fields caught with blocking errors...');
  const missingPromptResult = validateQuestionQuality({
    ...validSingleQuestion,
    questionText: '   ',
  });
  assert.equal(missingPromptResult.isValid, false);
  assert(missingPromptResult.errors.some((e) => e.ruleId === 'VAL-Q-01' && e.code === 'ERR_EMPTY_PROMPT'));

  const missingOptionResult = validateQuestionQuality({
    ...validSingleQuestion,
    optionD: '',
  });
  assert.equal(missingOptionResult.isValid, false);
  assert(missingOptionResult.errors.some((e) => e.ruleId === 'VAL-Q-02' && e.code === 'ERR_OPTION_INCOMPLETE' && e.field === 'optionD'));

  const missingAnswerKeyResult = validateQuestionQuality({
    ...validSingleQuestion,
    correctAnswer: '',
  });
  assert.equal(missingAnswerKeyResult.isValid, false);
  assert(missingAnswerKeyResult.errors.some((e) => e.ruleId === 'VAL-Q-04' && e.code === 'ERR_MISSING_ANSWER_KEY'));
  console.log('✓ VAL-Q-01, VAL-Q-02, VAL-Q-04 blocking errors correctly generated');

  // --------------------------------------------------------------------------
  // TEST 3: Invalid Choice/Answer Combinations (VAL-Q-03 & Duplicate Options)
  // --------------------------------------------------------------------------
  console.log('[Test 3] Invalid answer key out-of-set and duplicate options detected...');
  const invalidKeyResult = validateQuestionQuality({
    ...validSingleQuestion,
    correctAnswer: 'E',
  });
  assert.equal(invalidKeyResult.isValid, false);
  assert(invalidKeyResult.errors.some((e) => e.ruleId === 'VAL-Q-03' && e.code === 'ERR_INVALID_ANSWER_KEY'));

  const duplicateOptionsResult = validateQuestionQuality({
    ...validSingleQuestion,
    optionA: '10 సెకన్లు',
    optionC: '10 సెకన్లు',
  });
  assert.equal(duplicateOptionsResult.isValid, false);
  assert(duplicateOptionsResult.errors.some((e) => e.ruleId === 'VAL-Q-02' && e.code === 'ERR_OPTION_DUPLICATE'));
  console.log('✓ Invalid answer keys and duplicate options blocked with VAL-Q-03/VAL-Q-02');

  // --------------------------------------------------------------------------
  // TEST 4: Configured Count Mismatch and Incomplete Batch (VAL-Q-08)
  // --------------------------------------------------------------------------
  console.log('[Test 4] Incomplete batch slots and count mismatches strictly blocked...');
  const incompleteSlots: QuestionBatchSlot[] = [
    validBatchSlots[0],
    validBatchSlots[1],
    {
      slotNumber: 3,
      slotId: 'slt_empty_3',
      status: 'EMPTY',
      questionText: '',
      options: { a: '', b: '', c: '', d: '' },
      correctAnswer: '',
      explanation: '',
      isManuallyEdited: false,
      validationErrors: [],
      revisionNumber: 0,
    },
    validBatchSlots[3],
    validBatchSlots[4],
  ];

  const incompleteBatchResult = validateQuestionQuality({
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    targetQuestionCount: 5,
    slots: incompleteSlots,
  });
  assert.equal(incompleteBatchResult.isValid, false);
  assert(incompleteBatchResult.errors.some((e) => e.ruleId === 'VAL-Q-08' && e.code === 'ERR_INCOMPLETE_BATCH'));
  console.log('✓ Incomplete batch rejected with VAL-Q-08 ERR_INCOMPLETE_BATCH');

  // --------------------------------------------------------------------------
  // TEST 5: Duplicate Questions (VAL-Q-06A Exact & VAL-Q-06B Semantic Overlap)
  // --------------------------------------------------------------------------
  console.log('[Test 5] Duplicate questions (exact blocking, semantic warning)...');
  const duplicateBatchSlots: QuestionBatchSlot[] = [
    validBatchSlots[0],
    {
      ...validBatchSlots[1],
      questionText: validBatchSlots[0].questionText, // Exact duplicate
    },
    validBatchSlots[2],
    validBatchSlots[3],
    validBatchSlots[4],
  ];

  const duplicateBatchResult = validateQuestionQuality({
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    targetQuestionCount: 5,
    slots: duplicateBatchSlots,
  });
  assert.equal(duplicateBatchResult.isValid, false);
  assert(duplicateBatchResult.errors.some((e) => e.ruleId === 'VAL-Q-06A' && e.code === 'ERR_DUPLICATE_QUESTION'));

  // Semantic similarity overlap > 0.85 (Advisory Warning, non-blocking)
  const highSimilaritySlots: QuestionBatchSlot[] = [
    {
      ...validBatchSlots[0],
      questionText: 'ఒక రైలు 60 కిమీ వేగంతో ప్రయాణిస్తూ బ్రిడ్జిని 30 సెకన్లలో దాటుతుంది.',
    },
    {
      ...validBatchSlots[1],
      questionText: 'రైలు 60 కిమీ వేగంతో ప్రయాణిస్తూ అదే బ్రిడ్జిని 30 సెకన్లలో దాటుతుంది.',
    },
    validBatchSlots[2],
    validBatchSlots[3],
    validBatchSlots[4],
  ];

  const overlapResult = validateQuestionQuality({
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    targetQuestionCount: 5,
    slots: highSimilaritySlots,
  });
  // Should have warning VAL-Q-06B
  assert(overlapResult.warnings.some((w) => w.ruleId === 'VAL-Q-06B' && w.code === 'WARN_TOPICAL_OVERLAP'));
  console.log('✓ Exact duplicate question triggers blocking error; similarity triggers warning');

  // --------------------------------------------------------------------------
  // TEST 6: Placeholder Content Detection (VAL-Q-05)
  // --------------------------------------------------------------------------
  console.log('[Test 6] Placeholder content detected and blocked (VAL-Q-05)...');
  const placeholderQuestion = {
    ...validSingleQuestion,
    explanation: 'TODO: Add Burra speed trick explanation here',
  };
  const placeholderResult = validateQuestionQuality(placeholderQuestion, { requireExplanation: true });
  assert.equal(placeholderResult.isValid, false);
  assert(placeholderResult.errors.some((e) => e.ruleId === 'VAL-Q-05' && e.code === 'ERR_PLACEHOLDER_CONTENT'));
  console.log('✓ Placeholder content blocked under VAL-Q-05 ERR_PLACEHOLDER_CONTENT');

  // --------------------------------------------------------------------------
  // TEST 7: Error versus Warning Classification
  // --------------------------------------------------------------------------
  console.log('[Test 7] Classification of blocking errors vs non-blocking warnings...');
  const longPromptQuestion = {
    ...validSingleQuestion,
    // > 180 characters to trigger VAL-Q-11 warning
    questionText: 'ఒక రైలు ఏ బి స్టేషన్ల మధ్య ప్రతిరోజు ఉదయం మరియు సాయంత్రం ప్రయాణిస్తూ మార్గమధ్యంలో ఉన్న అన్ని చిన్న మరియు పెద్ద రైల్వే స్టేషన్లను మరియు ప్లాట్‌ఫారమ్‌లను దాటడానికి అవసరమైన సమయం మరియు వేగం లెక్కించండి.',
    explanation: 'వేగం = 20 m/s.', // < 20 chars but >= 5 to trigger VAL-Q-12 brevity warning
  };
  assert(longPromptQuestion.questionText.length > 180);

  const advisoryResult = validateQuestionQuality(longPromptQuestion, { requireExplanation: true });
  assert.equal(advisoryResult.isValid, true, 'Advisory warnings must NOT block validity');
  assert.equal(advisoryResult.hasWarnings, true);
  assert(advisoryResult.warnings.some((w) => w.ruleId === 'VAL-Q-11' && w.code === 'WARN_PROMPT_LENGTH'));
  assert(advisoryResult.warnings.some((w) => w.ruleId === 'VAL-Q-12' && w.code === 'WARN_EXPLANATION_BREVITY'));
  console.log('✓ Warnings (VAL-Q-11, VAL-Q-12) correctly classified as non-blocking');

  // --------------------------------------------------------------------------
  // TEST 8: Generated vs Manually Edited Questions Use Same Rules
  // --------------------------------------------------------------------------
  console.log('[Test 8] Generated candidate and manual draft evaluated under identical rules...');
  const generatedCandidatePayload: StudioCandidate = {
    ...validSingleQuestion,
    tags: [],
    realLifeContext: '',
    challengeType: 'ABCD',
    presentationType: 'TEXT',
    topicId: 'TOP-QA-01',
    subtopicId: 'SUB-01',
  };

  const manualDraftPayload: StudioCandidate = {
    ...validSingleQuestion,
    tags: [],
    realLifeContext: '',
    challengeType: 'ABCD',
    presentationType: 'TEXT',
    topicId: 'TOP-QA-01',
    subtopicId: 'SUB-01',
  };

  const genVal = validateQuestionQuality(generatedCandidatePayload);
  const manVal = validateQuestionQuality(manualDraftPayload);
  assert.equal(genVal.isValid, manVal.isValid);
  assert.deepEqual(genVal.errorMessages, manVal.errorMessages);
  assert.deepEqual(genVal.warningMessages, manVal.warningMessages);
  console.log('✓ Identical deterministic results between generated and manual questions');

  // --------------------------------------------------------------------------
  // TEST 9: Deterministic Idempotency (Same Inputs -> Same Outputs)
  // --------------------------------------------------------------------------
  console.log('[Test 9] Deterministic idempotency across repeated runs...');
  const run1 = validateQuestionQuality(validSingleQuestion);
  const run2 = validateQuestionQuality(validSingleQuestion);
  assert.deepEqual(run1, run2, 'Repeated executions must produce byte-for-byte identical results');
  console.log('✓ Validation service is completely pure and deterministic');

  // --------------------------------------------------------------------------
  // TEST 10: Server-Side Verification Gate (Rejects Bypassed Invalid Submission)
  // --------------------------------------------------------------------------
  console.log('[Test 10] Server-side submission gate enforces validation (HTTP 422)...');
  const invalidDraft = await questionGenerationService.saveDraft({
    topicId: 'TOP-QA-01',
    subtopicId: 'SUB-01',
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    questionText: '   ', // Invalid empty prompt
    optionA: '',
    optionB: 'B',
    correctAnswer: 'A',
    difficulty: DifficultyLevel.MEDIUM,
    language: QuestionLanguage.TELUGU,
  }, { id: 'USR-TEST-AUTHOR', name: 'Author' });

  // Direct server submission bypass attempt -> Must be caught and rejected with HTTP 422
  await assert.rejects(
    () => questionGenerationService.submitForVerification({
      draftId: invalidDraft.id,
      expectedVersion: invalidDraft.version || 1,
    }, { id: 'USR-TEST-AUTHOR', name: 'Author' }),
    (err: any) => {
      assert.equal(err.statusCode, 422, 'Server must reject invalid submission with HTTP 422');
      assert(/Draft cannot be submitted for verification/i.test(err.message));
      return true;
    }
  );
  console.log('✓ Server-side submission gate authoritatively blocks invalid submissions with 422');

  // --------------------------------------------------------------------------
  // TEST 11: Valid Submission Proceeds Through Existing Workflow
  // --------------------------------------------------------------------------
  console.log('[Test 11] Valid submission transitions draft to Stage 02...');
  const validDraft = await questionGenerationService.saveDraft({
    topicId: 'TOP-QA-01',
    subtopicId: 'SUB-01',
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    questionText: validSingleQuestion.questionText,
    optionA: validSingleQuestion.optionA,
    optionB: validSingleQuestion.optionB,
    optionC: validSingleQuestion.optionC,
    optionD: validSingleQuestion.optionD,
    correctAnswer: validSingleQuestion.correctAnswer,
    explanation: validSingleQuestion.explanation,
    difficulty: DifficultyLevel.MEDIUM,
    language: QuestionLanguage.TELUGU,
  }, { id: 'USR-TEST-AUTHOR-2', name: 'Author 2' });

  const submissionResult = await questionGenerationService.submitForVerification({
    draftId: validDraft.id,
    expectedVersion: validDraft.version || 1,
    remarks: 'Valid pedagogical submission',
  }, { id: 'USR-TEST-AUTHOR-2', name: 'Author 2' });

  assert.equal(submissionResult.success, true);
  assert.equal(submissionResult.status, 'SUBMITTED_FOR_REVIEW');
  assert.equal(submissionResult.workflowStage, 'STAGE_02_VERIFICATION');
  console.log('✓ Valid draft successfully transitions to STAGE_02_VERIFICATION');

  // --------------------------------------------------------------------------
  // TEST 12: Existing Accepted and Manual-Edited Slots Remain Intact
  // --------------------------------------------------------------------------
  console.log('[Test 12] Accepted and manually edited slots remain intact during revalidation...');
  const mixedSlots: QuestionBatchSlot[] = [
    {
      ...validBatchSlots[0],
      status: 'ACCEPTED',
      isManuallyEdited: true,
      questionText: 'ప్రత్యేకంగా ఆమోదించబడిన మొదటి ప్రశ్న.',
    },
    {
      ...validBatchSlots[1],
      status: 'MANUALLY_EDITED',
      isManuallyEdited: true,
      questionText: 'మానవీయంగా సవరించబడిన రెండవ ప్రశ్న.',
    },
    validBatchSlots[2],
    validBatchSlots[3],
    validBatchSlots[4],
  ];

  const mixedBatchValidation = validateQuestionQuality({
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    targetQuestionCount: 5,
    slots: mixedSlots,
  });
  assert.equal(mixedBatchValidation.isValid, true);
  // Verify slot integrity and manual status preservation
  assert.equal(mixedSlots[0].status, 'ACCEPTED');
  assert.equal(mixedSlots[0].isManuallyEdited, true);
  assert.equal(mixedSlots[1].status, 'MANUALLY_EDITED');
  assert.equal(mixedSlots[1].isManuallyEdited, true);
  console.log('✓ Accepted and manually edited slots preserved without mutation');

  console.log('\n============================================================');
  console.log('ALL 12 DETERMINISTIC QUESTION QUALITY TEST SCENARIOS DEFINED');
  console.log('============================================================');
}
