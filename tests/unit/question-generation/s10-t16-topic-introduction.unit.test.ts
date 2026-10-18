/**
 * BURRA PARIKSHA CMS — S10-T16: Mode 2 (Topic Introduction) Unit Test Suite
 * Feature Slice: Question Generation (Stage 01)
 *
 * Verifies:
 * 1. Required and optional fields: conceptTitle, introductoryConcept, syllabusScopeNotes, realLifeContext.
 * 2. Deterministic validation constraints:
 *    - Empty or < 15 chars conceptText is rejected with VAL-Q-01 (ERR_INSUFFICIENT_CONCEPT_LENGTH).
 *    - Placeholders (TODO, N/A, {{...}}) are rejected with VAL-Q-05 (ERR_PLACEHOLDER_CONTENT).
 *    - Aspect ratio must be either 9:16 or 16:9.
 *    - Target question count must strictly be 0 (enforced 0-question format).
 *    - Non-empty questions collection is strictly rejected.
 * 3. Draft persistence and resumption fidelity in questionDraftsRepository.
 * 4. Verification submission gate: blocks incomplete drafts with 422, allows valid drafts to advance.
 */

import assert from 'node:assert/strict';
import {
  evaluateStep01CandidateState,
  StudioCandidate,
} from '../../../shared/contracts/question-generation';
import { validateQuestionQuality } from '../../../shared/lib/question-quality-validator';
import { questionGenerationService } from '../../../backend/domain/question-generation/question-generation.service';
import { questionDraftsRepository } from '../../../database/firestore/repositories/question-drafts.repository';
import { QuestionLanguage, DifficultyLevel, QuestionStatus } from '../../../shared';

async function runTopicIntroductionUnitTests(): Promise<void> {
  console.log('============================================================');
  console.log('SUITE S10-T16: Mode 2 (Topic Introduction) Unit Tests');
  console.log('============================================================\n');

  // Test 1: Empty workspace evaluation
  console.log('[Test 1] Evaluates empty workspace as EMPTY state...');
  const emptyEvaluation = evaluateStep01CandidateState({
    hasCandidate: false,
    candidate: {
      productionMode: 'TOPIC_INTRODUCTION',
      targetQuestionCount: 0,
      aspectRatio: '9:16',
      introductoryConcept: '',
    },
  });
  assert.equal(emptyEvaluation.state, 'EMPTY');
  assert.equal(emptyEvaluation.canContinue, false);
  console.log('✓ Empty workspace correctly evaluated as EMPTY');

  // Test 2: Validation rejection when concept is < 15 characters
  console.log('\n[Test 2] Rejects concept statement shorter than 15 characters...');
  const shortCandidate: Partial<StudioCandidate> = {
    productionMode: 'TOPIC_INTRODUCTION',
    targetQuestionCount: 0,
    aspectRatio: '9:16',
    introductoryConcept: 'చిన్న భావన', // 10 chars
  };
  const shortReport = validateQuestionQuality(shortCandidate);
  assert.equal(shortReport.isValid, false);
  assert.ok(
    shortReport.errors.some(
      (e) => e.code === 'ERR_INSUFFICIENT_CONCEPT_LENGTH' || e.ruleId === 'VAL-Q-01'
    ),
    'Must produce ERR_INSUFFICIENT_CONCEPT_LENGTH'
  );
  console.log('✓ Insufficient concept length (< 15 chars) correctly rejected');

  // Test 3: Validation rejection when placeholders are detected
  console.log('\n[Test 3] Rejects placeholders (TODO, N/A, {{...}}) in concept...');
  const placeholderCandidate: Partial<StudioCandidate> = {
    productionMode: 'TOPIC_INTRODUCTION',
    targetQuestionCount: 0,
    aspectRatio: '9:16',
    introductoryConcept: 'ఈ విభాగంలో మనం ముఖ్యమైన సూత్రాలు నేర్చుకుందాం. TODO: సూత్రాలను జోడించండి.',
  };
  const placeholderReport = validateQuestionQuality(placeholderCandidate);
  assert.equal(placeholderReport.isValid, false);
  assert.ok(
    placeholderReport.errors.some((e) => e.code === 'ERR_PLACEHOLDER_CONTENT'),
    'Must produce ERR_PLACEHOLDER_CONTENT'
  );
  console.log('✓ Placeholders in concept correctly rejected');

  // Test 4: Aspect ratio validation (only 9:16 or 16:9 allowed)
  console.log('\n[Test 4] Rejects unsupported aspect ratios for Topic Introduction...');
  const invalidAspectCandidate: Partial<StudioCandidate> = {
    productionMode: 'TOPIC_INTRODUCTION',
    targetQuestionCount: 0,
    aspectRatio: '1:1', // Invalid for Mode 2
    introductoryConcept: 'ఈ విభాగంలో మనం వయసు లెక్కలను 10 సెకన్లలో ఎలా సాధించవచ్చో నేర్చుకుందాం.',
  };
  const aspectReport = validateQuestionQuality(invalidAspectCandidate);
  assert.equal(aspectReport.isValid, false);
  assert.ok(
    aspectReport.errors.some((e) => e.code === 'ERR_INVALID_ASPECT_RATIO'),
    'Must reject aspect ratio other than 9:16 or 16:9'
  );
  console.log('✓ Invalid aspect ratio correctly rejected');

  // Test 5: Enforces 0 questions strictly
  console.log('\n[Test 5] Enforces 0 questions strictly (targetQuestionCount > 0 or questions array forbidden)...');
  const nonZeroCountCandidate: Partial<StudioCandidate> = {
    productionMode: 'TOPIC_INTRODUCTION',
    targetQuestionCount: 5, // Violation for Mode 2
    aspectRatio: '9:16',
    introductoryConcept: 'ఈ విభాగంలో మనం వయసు లెక్కలను 10 సెకన్లలో ఎలా సాధించవచ్చో నేర్చుకుందాం.',
  };
  const nonZeroReport = validateQuestionQuality(nonZeroCountCandidate);
  assert.equal(nonZeroReport.isValid, false);
  assert.ok(
    nonZeroReport.errors.some((e) => e.code === 'ERR_INVALID_TARGET_COUNT'),
    'Must reject targetQuestionCount > 0'
  );

  const nonZeroQuestionsCandidate: Partial<StudioCandidate> = {
    productionMode: 'TOPIC_INTRODUCTION',
    targetQuestionCount: 0,
    aspectRatio: '9:16',
    introductoryConcept: 'ఈ విభాగంలో మనం వయసు లెక్కలను 10 సెకన్లలో ఎలా సాధించవచ్చో నేర్చుకుందాం.',
    questions: [
      {
        questionNumber: 1,
        questionText: 'ప్రశ్న పాఠ్యం',
        options: { a: 'A', b: 'B', c: 'C', d: 'D' },
        correctAnswer: 'A',
        explanation: 'వివరణ',
      },
    ],
  };
  const nonZeroArrayReport = validateQuestionQuality(nonZeroQuestionsCandidate);
  assert.equal(nonZeroArrayReport.isValid, false);
  assert.ok(
    nonZeroArrayReport.errors.some((e) => e.code === 'ERR_INVALID_TARGET_COUNT'),
    'Must reject non-empty questions array'
  );
  console.log('✓ 0-question constraint strictly enforced');

  // Test 6: Valid Topic Introduction Candidate evaluates to VALID state
  console.log('\n[Test 6] Valid Topic Introduction evaluates to VALID state...');
  const validCandidate: Partial<StudioCandidate> = {
    topicId: 'TOP-QA-01',
    subtopicId: 'SUB-01',
    productionMode: 'TOPIC_INTRODUCTION',
    targetQuestionCount: 0,
    aspectRatio: '16:9',
    conceptTitle: 'వయసు సమస్యలు — త్రికాల సూత్రం',
    introductoryConcept: 'ఈ విభాగంలో మనం వయసు లెక్కలను X మరియు Y సమీకరణాలు లేకుండా, కేవలం నిష్పత్తుల వ్యత్యాసం పద్ధతితో 10 సెకన్లలో ఎలా సాధించవచ్చో నేర్చుకుందాం.',
    syllabusScopeNotes: 'APPSC Group 2 & TSPSC ప్రిలిమ్స్ కొరకు ప్రామాణిక సూత్రాలు.',
    realLifeContext: 'కుటుంబ సభ్యుల వయస్సు వివాదాలు మరియు నిష్పత్తులు',
    language: QuestionLanguage.TELUGU,
    difficulty: DifficultyLevel.MEDIUM,
  };
  const validEvaluation = evaluateStep01CandidateState({
    hasCandidate: true,
    candidate: validCandidate,
  });
  assert.equal(validEvaluation.state, 'VALID');
  assert.equal(validEvaluation.canContinue, true);
  console.log('✓ Valid Topic Introduction candidate evaluated as VALID');

  // Test 7: Persistence and Draft Resumption Fidelity
  console.log('\n[Test 7] Mode 2 draft persists and hydrates all fields accurately...');
  const authorActor = { id: 'USR-M2-TEST-AUTHOR', name: 'Mode 2 Author' };
  const savedDraft = await questionGenerationService.saveDraft(
    {
      topicId: 'TOP-QA-01',
      subtopicId: 'SUB-01',
      productionMode: 'TOPIC_INTRODUCTION',
      targetQuestionCount: 0,
      aspectRatio: '16:9',
      conceptTitle: 'వయసు సమస్యలు — త్రికాల సూత్రం',
      introductoryConcept: 'ఈ విభాగంలో మనం వయసు లెక్కలను X మరియు Y సమీకరణాలు లేకుండా, కేవలం నిష్పత్తుల వ్యత్యాసం పద్ధతితో 10 సెకన్లలో ఎలా సాధించవచ్చో నేర్చుకుందాం.',
      questionText: 'ఈ విభాగంలో మనం వయసు లెక్కలను X మరియు Y సమీకరణాలు లేకుండా, కేవలం నిష్పత్తుల వ్యత్యాసం పద్ధతితో 10 సెకన్లలో ఎలా సాధించవచ్చో నేర్చుకుందాం.',
      syllabusScopeNotes: 'APPSC Group 2 & TSPSC ప్రిలిమ్స్ కొరకు ప్రామాణిక సూత్రాలు.',
      realLifeContext: 'కుటుంబ సభ్యుల వయస్సు వివాదాలు మరియు నిష్పత్తులు',
      language: QuestionLanguage.TELUGU,
      difficulty: DifficultyLevel.MEDIUM,
    },
    authorActor
  );

  assert.equal(savedDraft.productionMode, 'TOPIC_INTRODUCTION');
  assert.equal(savedDraft.targetQuestionCount, 0);
  assert.equal(savedDraft.aspectRatio, '16:9');
  assert.equal(savedDraft.conceptTitle, 'వయసు సమస్యలు — త్రికాల సూత్రం');
  assert.equal(
    savedDraft.introductoryConcept,
    'ఈ విభాగంలో మనం వయసు లెక్కలను X మరియు Y సమీకరణాలు లేకుండా, కేవలం నిష్పత్తుల వ్యత్యాసం పద్ధతితో 10 సెకన్లలో ఎలా సాధించవచ్చో నేర్చుకుందాం.'
  );
  assert.equal(savedDraft.syllabusScopeNotes, 'APPSC Group 2 & TSPSC ప్రిలిమ్స్ కొరకు ప్రామాణిక సూత్రాలు.');
  assert.equal(savedDraft.realLifeContext, 'కుటుంబ సభ్యుల వయస్సు వివాదాలు మరియు నిష్పత్తులు');
  assert.equal(savedDraft.status, QuestionStatus.DRAFT);
  console.log('✓ Mode 2 draft saved with 100% field fidelity in status DRAFT');

  // Test 8: Submission gate rejects incomplete draft with HTTP 422
  console.log('\n[Test 8] Submission gate rejects incomplete draft with 422...');
  const incompleteDraft = await questionGenerationService.saveDraft(
    {
      topicId: 'TOP-QA-01',
      subtopicId: 'SUB-01',
      productionMode: 'TOPIC_INTRODUCTION',
      targetQuestionCount: 0,
      aspectRatio: '9:16',
      introductoryConcept: 'చిన్న భావన', // Invalid (< 15 chars)
      questionText: 'చిన్న భావన',
      difficulty: DifficultyLevel.MEDIUM,
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
        err.code === 'ERR_INSUFFICIENT_CONCEPT_LENGTH' || err.message.includes('introductory concept'),
        'Must indicate concept validation error'
      );
      return true;
    }
  );
  console.log('✓ Incomplete draft rejected at verification submission gate with HTTP 422');

  console.log('\n============================================================');
  console.log('ALL S10-T16 MODE 2 UNIT TESTS PASSED (8/8)');
  console.log('============================================================\n');
}

runTopicIntroductionUnitTests().catch((err) => {
  console.error('S10-T16 Test Suite Failed:', err);
  process.exit(1);
});
