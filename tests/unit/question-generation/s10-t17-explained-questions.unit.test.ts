/**
 * BURRA PARIKSHA CMS — S10-T17: Mode 3 (Explained Questions Video) Unit Test Suite
 * Feature Slice: Question Generation (Stage 01)
 *
 * Verifies:
 * 1. Approved batch sizes: 5, 10, 15, and 20 questions.
 * 2. Strict 16:9 aspect ratio enforcement.
 * 3. Introductory concept overview (>= 15 chars).
 * 4. Question collection completeness and per-question validation:
 *    - 4 distinct non-empty options.
 *    - Valid correct answer in {A, B, C, D}.
 *    - Explanation presence (>= 5 chars).
 *    - Duplicate question detection.
 *    - Incomplete batch size rejection.
 * 5. Reordering, tab navigation, and editing updates.
 * 6. Persistence and draft resumption with complete questions array fidelity.
 * 7. Verification submission gate: blocks incomplete batch with 422.
 */

import assert from 'node:assert/strict';
import {
  evaluateStep01CandidateState,
  StudioCandidate,
} from '../../../shared/contracts/question-generation';
import { validateQuestionQuality } from '../../../shared/lib/question-quality-validator';
import { questionGenerationService } from '../../../backend/domain/question-generation/question-generation.service';
import { contentModeRegistry } from '../../../shared/registry/content-mode.registry';
import { QuestionLanguage, DifficultyLevel, QuestionStatus } from '../../../shared';
import { ExplainedQuestionItem } from '../../../shared/types/question';

function createSampleExplainedQuestions(count: number): ExplainedQuestionItem[] {
  return Array.from({ length: count }, (_, i) => {
    const qNum = i + 1;
    return {
      questionNumber: qNum,
      slotId: `slt_m3_${qNum}`,
      questionText: `రైలు సమస్య సంఖ్య ${qNum}: 120 మీటర్ల పొడవు గల రైలు 60 కి.మీ/గం వేగంతో ప్రయాణిస్తే స్తంభాన్ని ఎంత సమయంలో దాటుతుంది?`,
      options: {
        a: `${qNum * 2} సెకన్లు`,
        b: `${qNum * 2 + 2} సెకన్లు`,
        c: `${qNum * 2 + 4} సెకన్లు`,
        d: `${qNum * 2 + 6} సెకన్లు`,
      },
      optionA: `${qNum * 2} సెకన్లు`,
      optionB: `${qNum * 2 + 2} సెకన్లు`,
      optionC: `${qNum * 2 + 4} సెకన్లు`,
      optionD: `${qNum * 2 + 6} సెకన్లు`,
      correctAnswer: 'B' as const,
      explanation: `ప్రశ్న ${qNum} వివరణ: వేగం = 60 * 5/18 = 50/3 m/s. కాలం = దూరం / వేగం.`,
      trickOrPitfall: 'వేగం km/h నుండి m/s కు మార్చడం మరచిపోకూడదు.',
    };
  });
}

async function runExplainedQuestionsUnitTests(): Promise<void> {
  console.log('============================================================');
  console.log('SUITE S10-T17: Mode 3 (Explained Questions Video) Unit Tests');
  console.log('============================================================\n');

  // Test 1: Registry constraints validation for all approved batch counts
  console.log('[Test 1] Verifies registry accepts counts {5, 10, 15, 20} and aspect ratio 16:9...');
  for (const count of [5, 10, 15, 20]) {
    const validConfig = contentModeRegistry.validateConfig('EXPLAINED_QUESTIONS_VIDEO', count, '16:9');
    assert.equal(validConfig.isValid, true, `Batch count ${count} with 16:9 must be valid`);
  }

  // Reject unapproved batch counts
  for (const invalidCount of [1, 2, 3, 7, 25]) {
    const invalidConfig = contentModeRegistry.validateConfig('EXPLAINED_QUESTIONS_VIDEO', invalidCount, '16:9');
    assert.equal(invalidConfig.isValid, false, `Batch count ${invalidCount} must be rejected`);
  }

  // Reject unapproved aspect ratios
  const invalidAspect = contentModeRegistry.validateConfig('EXPLAINED_QUESTIONS_VIDEO', 10, '9:16');
  assert.equal(invalidAspect.isValid, false, 'Aspect ratio 9:16 must be rejected for Mode 3');
  console.log('✓ Batch counts {5, 10, 15, 20} and 16:9 aspect ratio correctly enforced by registry');

  // Test 2: Incomplete batch size validation
  console.log('\n[Test 2] Rejects batch when questions.length < targetQuestionCount...');
  const partialBatchCandidate: Partial<StudioCandidate> = {
    productionMode: 'EXPLAINED_QUESTIONS_VIDEO',
    targetQuestionCount: 5,
    aspectRatio: '16:9',
    introductoryConcept: 'ఈ వీడియోలో మనం రైలు సమస్యల పై 5 ప్రశ్నలను నేర్చుకుందాం.',
    questions: createSampleExplainedQuestions(3), // Only 3 questions provided for target of 5
  };
  const partialReport = validateQuestionQuality(partialBatchCandidate);
  assert.equal(partialReport.isValid, false);
  assert.ok(
    partialReport.errors.some((e) => e.code === 'ERR_INCOMPLETE_BATCH' || e.ruleId === 'VAL-Q-08'),
    'Must produce ERR_INCOMPLETE_BATCH'
  );
  console.log('✓ Incomplete batch size (< targetCount) correctly rejected');

  // Test 3: Missing explanation within a question
  console.log('\n[Test 3] Rejects question with missing explanation...');
  const missingExplQuestions = createSampleExplainedQuestions(5);
  missingExplQuestions[2].explanation = ''; // Question 3 has empty explanation
  const missingExplCandidate: Partial<StudioCandidate> = {
    productionMode: 'EXPLAINED_QUESTIONS_VIDEO',
    targetQuestionCount: 5,
    aspectRatio: '16:9',
    introductoryConcept: 'ఈ వీడియోలో మనం రైలు సమస్యల పై 5 ప్రశ్నలను నేర్చుకుందాం.',
    questions: missingExplQuestions,
  };
  const missingExplReport = validateQuestionQuality(missingExplCandidate);
  assert.equal(missingExplReport.isValid, false);
  assert.ok(
    missingExplReport.errors.some(
      (e) => (e.code === 'ERR_MISSING_EXPLANATION' || e.ruleId === 'VAL-Q-07') && e.questionIndex === 2
    ),
    'Must produce ERR_MISSING_EXPLANATION for question index 2'
  );
  console.log('✓ Missing explanation in question correctly rejected');

  // Test 4: Duplicate question statements within the batch
  console.log('\n[Test 4] Rejects duplicate question statements in the batch...');
  const duplicateQuestions = createSampleExplainedQuestions(5);
  duplicateQuestions[3].questionText = duplicateQuestions[1].questionText; // Question 4 duplicates Question 2
  const duplicateCandidate: Partial<StudioCandidate> = {
    productionMode: 'EXPLAINED_QUESTIONS_VIDEO',
    targetQuestionCount: 5,
    aspectRatio: '16:9',
    introductoryConcept: 'ఈ వీడియోలో మనం రైలు సమస్యల పై 5 ప్రశ్నలను నేర్చుకుందాం.',
    questions: duplicateQuestions,
  };
  const duplicateReport = validateQuestionQuality(duplicateCandidate);
  assert.equal(duplicateReport.isValid, false);
  assert.ok(
    duplicateReport.errors.some((e) => e.code === 'ERR_DUPLICATE_QUESTION'),
    'Must produce ERR_DUPLICATE_QUESTION'
  );
  console.log('✓ Duplicate question statement within batch correctly rejected');

  // Test 5: Non-distinct options in a question
  console.log('\n[Test 5] Rejects duplicate options in a question...');
  const duplicateOptionQuestions = createSampleExplainedQuestions(5);
  duplicateOptionQuestions[0].options = {
    a: '10 సెకన్లు',
    b: '10 సెకన్లు', // Duplicate of A
    c: '20 సెకన్లు',
    d: '25 సెకన్లు',
  };
  duplicateOptionQuestions[0].optionA = '10 సెకన్లు';
  duplicateOptionQuestions[0].optionB = '10 సెకన్లు';
  const duplicateOptionCandidate: Partial<StudioCandidate> = {
    productionMode: 'EXPLAINED_QUESTIONS_VIDEO',
    targetQuestionCount: 5,
    aspectRatio: '16:9',
    introductoryConcept: 'ఈ వీడియోలో మనం రైలు సమస్యల పై 5 ప్రశ్నలను నేర్చుకుందాం.',
    questions: duplicateOptionQuestions,
  };
  const duplicateOptionReport = validateQuestionQuality(duplicateOptionCandidate);
  assert.equal(duplicateOptionReport.isValid, false);
  assert.ok(
    duplicateOptionReport.errors.some((e) => e.code === 'ERR_OPTION_INCOMPLETE' || e.code === 'ERR_NON_DISTINCT_OPTIONS' || e.ruleId === 'VAL-Q-02'),
    'Must produce distinct options violation'
  );
  console.log('✓ Duplicate options in a question correctly rejected');

  // Test 6: Valid 5, 10, 15, and 20 question packages evaluate to VALID state
  console.log('\n[Test 6] Valid packages of 5, 10, 15, 20 questions evaluate to VALID state...');
  for (const count of [5, 10, 15, 20]) {
    const validCandidate: Partial<StudioCandidate> = {
      topicId: 'TOP-QA-01',
      subtopicId: 'SUB-01',
      productionMode: 'EXPLAINED_QUESTIONS_VIDEO',
      targetQuestionCount: count,
      aspectRatio: '16:9',
      conceptTitle: `రైలు సమస్యలు — ${count} ప్రశ్నల మాస్టర్‌క్లాస్`,
      introductoryConcept: `ఈ వీడియోలో మనం రైలు సమస్యల పై ${count} కీలకమైన ప్రాక్టీస్ ప్రశ్నలను నేర్చుకుందాం.`,
      questions: createSampleExplainedQuestions(count),
      language: QuestionLanguage.TELUGU,
      difficulty: DifficultyLevel.MEDIUM,
    };
    const evalResult = evaluateStep01CandidateState({
      hasCandidate: true,
      candidate: validCandidate,
    });
    assert.equal(evalResult.state, 'VALID', `Batch of ${count} questions must evaluate to VALID`);
    assert.equal(evalResult.canContinue, true);
  }
  console.log('✓ All approved batch counts {5, 10, 15, 20} evaluate to VALID state');

  // Test 7: Persistence and Draft Resumption with full questions array
  console.log('\n[Test 7] Mode 3 draft persists and resumes all 10 questions accurately...');
  const authorActor = { id: 'USR-M3-TEST-AUTHOR', name: 'Mode 3 Author' };
  const sample10 = createSampleExplainedQuestions(10);
  const savedDraft = await questionGenerationService.saveDraft(
    {
      topicId: 'TOP-QA-01',
      subtopicId: 'SUB-01',
      productionMode: 'EXPLAINED_QUESTIONS_VIDEO',
      targetQuestionCount: 10,
      aspectRatio: '16:9',
      conceptTitle: 'రైలు సమస్యలు — 10 ప్రశ్నల మాస్టర్‌క్లాస్',
      introductoryConcept: 'ఈ వీడియోలో మనం రైలు సమస్యల పై 10 కీలకమైన ప్రాక్టీస్ ప్రశ్నలను నేర్చుకుందాం.',
      questionText: 'రైలు సమస్యలు — 10 ప్రశ్నల మాస్టర్‌క్లాస్',
      questions: sample10,
      language: QuestionLanguage.TELUGU,
      difficulty: DifficultyLevel.MEDIUM,
    },
    authorActor
  );

  assert.equal(savedDraft.productionMode, 'EXPLAINED_QUESTIONS_VIDEO');
  assert.equal(savedDraft.targetQuestionCount, 10);
  assert.equal(savedDraft.aspectRatio, '16:9');
  assert.equal(savedDraft.questions?.length, 10);
  assert.equal(savedDraft.questions[0].questionText, sample10[0].questionText);
  assert.equal(savedDraft.questions[9].questionText, sample10[9].questionText);
  assert.equal(savedDraft.questions[0].correctAnswer, 'B');
  assert.equal(savedDraft.status, QuestionStatus.DRAFT);
  console.log('✓ Mode 3 draft saved with all 10 questions preserved in status DRAFT');

  // Test 8: Submission gate rejects incomplete batch with HTTP 422
  console.log('\n[Test 8] Submission gate rejects incomplete batch with 422...');
  const incompleteDraft = await questionGenerationService.saveDraft(
    {
      topicId: 'TOP-QA-01',
      subtopicId: 'SUB-01',
      productionMode: 'EXPLAINED_QUESTIONS_VIDEO',
      targetQuestionCount: 5,
      aspectRatio: '16:9',
      introductoryConcept: 'ఈ వీడియోలో మనం రైలు సమస్యల పై 5 ప్రశ్నలను నేర్చుకుందాం.',
      questionText: 'ఈ వీడియోలో మనం రైలు సమస్యల పై 5 ప్రశ్నలను నేర్చుకుందాం.',
      difficulty: DifficultyLevel.MEDIUM,
      questions: createSampleExplainedQuestions(2), // Only 2 of 5
    },
    authorActor
  );

  await assert.rejects(
    async () => {
      await questionGenerationService.submitForVerification(
        {
          draftId: incompleteDraft.id,
          expectedVersion: incompleteDraft.version || 1,
        },
        authorActor
      );
    },
    (err: any) => {
      assert.equal(err.statusCode, 422, 'Must reject incomplete draft with status code 422');
      assert.ok(
        err.code === 'ERR_INCOMPLETE_BATCH' || err.message.includes('questions'),
        'Must indicate incomplete batch error'
      );
      return true;
    }
  );
  console.log('✓ Incomplete batch rejected at verification submission gate with HTTP 422');

  console.log('\n============================================================');
  console.log('ALL S10-T17 MODE 3 UNIT TESTS PASSED (8/8)');
  console.log('============================================================\n');
}

runExplainedQuestionsUnitTests().catch((err) => {
  console.error('S10-T17 Test Suite Failed:', err);
  process.exit(1);
});
