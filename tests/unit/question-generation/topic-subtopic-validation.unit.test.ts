/**
 * BURRA PARIKSHA CMS — Question Generation Unit Tests: Topic/Subtopic & Candidate Validation
 * Feature Slice: Question Generation (Stage 01)
 *
 * Verifies:
 * 1. Topic & Subtopic validation constraints.
 * 2. Candidate generation request validation.
 * 3. Candidate completeness and state evaluation (getStep01WorkflowState).
 * 4. Duplicate option detection and required option validation.
 */

import assert from 'node:assert';
import {
  evaluateStep01CandidateState,
  GenerateCandidateInput,
} from '../../../shared/contracts/question-generation';
import { questionGenerationService } from '../../../backend/domain/question-generation';
import { DifficultyLevel, QuestionLanguage, canonicalIdService } from '../../../shared';

async function runTopicSubtopicValidationTests() {
  const VALID_TOPIC_ID = 'top_10000000-0000-4000-8000-000000000001';
  const VALID_SUBTOPIC_ID = 'sub_10000000-0000-4000-8000-000000000101';
  const MISMATCHED_TOPIC_ID = 'top_20000000-0000-4000-8000-000000000002';

  console.log('============================================================');
  console.log('UNIT TEST: Topic/Subtopic & Candidate Validation');
  console.log('============================================================\n');

  // Test 1: evaluateStep01CandidateState - Empty state
  console.log('[Test 1] Candidate state evaluation on empty workspace...');
  const emptyEval = evaluateStep01CandidateState({
    hasCandidate: false,
    candidate: {},
  });
  assert.strictEqual(emptyEval.state, 'EMPTY', 'Empty candidate should evaluate to EMPTY');
  assert.strictEqual(emptyEval.canContinue, false, 'Empty candidate should not allow continue');
  console.log('  PASS: Empty candidate correctly evaluated.');

  // Test 2: evaluateStep01CandidateState - Incomplete state
  console.log('[Test 2] Candidate state evaluation on incomplete options...');
  const incompleteEval = evaluateStep01CandidateState({
    hasCandidate: true,
    candidate: {
      questionText: 'రైలు వేగం ఎంత?',
      optionA: '60 km/h',
      optionB: '', // Missing option B
      optionC: '80 km/h',
      optionD: '90 km/h',
      correctAnswer: 'A',
    },
  });
  assert.strictEqual(incompleteEval.state, 'INCOMPLETE', 'Missing option B should evaluate to INCOMPLETE');
  assert.strictEqual(incompleteEval.canContinue, false, 'Incomplete candidate should not allow continue');
  assert(incompleteEval.errors.some((e) => e.includes('Option B')), 'Should report missing Option B');
  console.log('  PASS: Incomplete options correctly flagged.');

  // Test 3: evaluateStep01CandidateState - Invalid correct answer
  console.log('[Test 3] Candidate state evaluation on invalid correct answer...');
  const invalidKeyEval = evaluateStep01CandidateState({
    hasCandidate: true,
    candidate: {
      questionText: 'రైలు వేగం లెక్కించండి...',
      optionA: '50 km/h',
      optionB: '60 km/h',
      optionC: '70 km/h',
      optionD: '80 km/h',
      correctAnswer: 'E' as any, // Invalid choice
    },
  });
  assert.strictEqual(invalidKeyEval.state, 'INVALID', 'Invalid answer key should evaluate to INVALID');
  assert.strictEqual(invalidKeyEval.canContinue, false);
  console.log('  PASS: Invalid answer key correctly rejected.');

  // Test 4: evaluateStep01CandidateState - Duplicate options
  console.log('[Test 4] Candidate state evaluation on duplicate option values...');
  const duplicateOptionEval = evaluateStep01CandidateState({
    hasCandidate: true,
    candidate: {
      questionText: 'రైలు వేగం ఎంత?',
      optionA: '60 km/h',
      optionB: '60 km/h', // Duplicate of A
      optionC: '70 km/h',
      optionD: '80 km/h',
      correctAnswer: 'A',
    },
  });
  assert.strictEqual(duplicateOptionEval.state, 'INVALID', 'Duplicate options should evaluate to INVALID');
  assert(duplicateOptionEval.errors.some((e) => e.includes('Duplicate options')), 'Should detect duplicate values');
  console.log('  PASS: Duplicate options correctly flagged.');

  // Test 5: evaluateStep01CandidateState - Valid complete candidate
  console.log('[Test 5] Candidate state evaluation on valid complete candidate...');
  const validEval = evaluateStep01CandidateState({
    hasCandidate: true,
    candidate: {
      questionText: '150 మీటర్ల పొడవున్న రైలు 9 సెకన్లలో స్తంభాన్ని దాటితే దాని వేగం ఎంత?',
      optionA: '50 కి.మీ/గం',
      optionB: '60 కి.మీ/గం',
      optionC: '70 కి.మీ/గం',
      optionD: '80 కి.మీ/గం',
      correctAnswer: 'B',
    },
  });
  assert.strictEqual(validEval.state, 'VALID', 'Complete candidate should evaluate to VALID');
  assert.strictEqual(validEval.canContinue, true, 'Valid candidate must allow saving draft');
  assert.strictEqual(validEval.errors.length, 0);
  console.log('  PASS: Valid candidate approved.');

  // Test 6: Generation request validation - missing topic
  console.log('[Test 6] Domain generation request validation: missing topic...');
  const invalidReq = await questionGenerationService.validateGenerationRequest({
    topicId: '',
    subtopicId: 'SUB-01',
    difficulty: DifficultyLevel.MEDIUM,
    language: QuestionLanguage.TELUGU,
  });
  assert.strictEqual(invalidReq.isValid, false, 'Missing topicId must fail validation');
  console.log('  PASS: Missing topicId rejected.');

  // Test 7: Domain candidate validation
  console.log('[Test 7] Domain candidate validation method...');
  const domainVal = questionGenerationService.validateCandidate({
    questionText: 'Short',
    optionA: 'Opt A',
    optionB: 'Opt B',
    optionC: 'Opt C',
    optionD: 'Opt D',
    correctAnswer: 'A',
  });
  assert.strictEqual(domainVal.isValid, true, 'Valid domain candidate satisfies criteria');

  const domainValInvalid = questionGenerationService.validateCandidate({
    questionText: '',
    optionA: '',
    optionB: '',
    correctAnswer: 'A',
  });
  assert.strictEqual(domainValInvalid.isValid, false, 'Incomplete candidate fails domain validation');
  console.log('  PASS: Domain candidate validation operational.');

  // Test 8: Reject a supplied Subtopic that cannot be resolved from authoritative taxonomy
  console.log('[Test 8] Rejecting supplied unresolvable Subtopic...');
  const unresolvableSubReq = await questionGenerationService.validateGenerationRequest({
    topicId: VALID_TOPIC_ID,
    subtopicId: 'SUB-NON-EXISTENT-999',
    difficulty: DifficultyLevel.MEDIUM,
    language: QuestionLanguage.TELUGU,
  });
  assert.strictEqual(unresolvableSubReq.isValid, false, 'Unresolvable subtopic must fail validation');
  assert(unresolvableSubReq.error?.includes('does not exist in authoritative taxonomy'), 'Must explain subtopic non-existence');
  console.log('  PASS: Unresolvable Subtopic rejected with clear error.');

  // Test 9: Reject a Subtopic that does not belong to the selected Topic
  console.log('[Test 9] Rejecting Subtopic that does not belong to selected Topic...');
  const mismatchedSubReq = await questionGenerationService.validateGenerationRequest({
    topicId: MISMATCHED_TOPIC_ID, // Reasoning
    subtopicId: VALID_SUBTOPIC_ID, // Belongs to Aptitude
    difficulty: DifficultyLevel.MEDIUM,
    language: QuestionLanguage.TELUGU,
  });
  assert.strictEqual(mismatchedSubReq.isValid, false, 'Mismatched subtopic must fail validation');
  assert(mismatchedSubReq.error?.includes('does not belong to Topic'), 'Must identify relationship mismatch');
  console.log('  PASS: Mismatched Subtopic rejected with clear error.');

  // Test 10: Reject an unresolvable Topic
  console.log('[Test 10] Rejecting unresolvable Topic...');
  const unresolvableTopReq = await questionGenerationService.validateGenerationRequest({
    topicId: 'TOP-INVALID-999',
    subtopicId: VALID_SUBTOPIC_ID,
    difficulty: DifficultyLevel.MEDIUM,
    language: QuestionLanguage.TELUGU,
  });
  assert.strictEqual(unresolvableTopReq.isValid, false, 'Unresolvable topic must fail validation');
  assert(unresolvableTopReq.error?.includes('does not exist in authoritative taxonomy'), 'Must report topic non-existence');
  console.log('  PASS: Unresolvable Topic rejected with clear error.');

  // Test 11: Preserve documented RANDOM mode exception without requiring explicit subtopic
  console.log('[Test 11] Preserving RANDOM mode generation without specific subtopic...');
  const randomModeReq = await questionGenerationService.validateGenerationRequest({
    topicId: VALID_TOPIC_ID,
    subtopicId: 'RANDOM',
    generationMode: 'RANDOM',
    difficulty: DifficultyLevel.MEDIUM,
    language: QuestionLanguage.TELUGU,
  });
  assert.strictEqual(randomModeReq.isValid, true, 'Random mode must succeed without explicit subtopic');
  console.log('  PASS: Documented RANDOM mode exception preserved.');

  // Test 12: Regression — Nonexistent ID beginning with BP-TOP- is rejected
  console.log('[Test 12] Regression: Nonexistent ID beginning with BP-TOP- is rejected...');
  const bpTopGenReq = await questionGenerationService.validateGenerationRequest({
    topicId: 'BP-TOP-999',
    subtopicId: VALID_SUBTOPIC_ID,
    difficulty: DifficultyLevel.MEDIUM,
    language: QuestionLanguage.TELUGU,
  });
  assert.strictEqual(bpTopGenReq.isValid, false, 'Generation request with nonexistent BP-TOP- must be rejected');
  assert(bpTopGenReq.error?.includes('does not exist in authoritative taxonomy'), 'Must flag non-existence');

  let bpTopDraftError = false;
  try {
    await questionGenerationService.saveDraft({
      topicId: 'BP-TOP-999',
      subtopicId: VALID_SUBTOPIC_ID,
      difficulty: 'Intermediate',
      language: 'TELUGU',
      questionText: 'ప్రశ్న వివరాలు...',
      options: { a: 'A', b: 'B', c: 'C', d: 'D' },
      correctAnswer: 'A',
    });
  } catch (err: any) {
    bpTopDraftError = true;
    assert.strictEqual(err?.statusCode, 400, 'Must throw 400 on nonexistent BP-TOP- draft save');
    assert(err.message.includes('does not exist in authoritative taxonomy'), 'Must report taxonomy error');
  }
  assert(bpTopDraftError, 'Expected saveDraft to throw 400 for nonexistent BP-TOP- ID');
  console.log('  PASS: Nonexistent BP-TOP-* rejected in both generation validation and draft saving.');

  // Test 13: Regression — Nonexistent ID beginning with BP-SUB- is rejected
  console.log('[Test 13] Regression: Nonexistent ID beginning with BP-SUB- is rejected...');
  const bpSubGenReq = await questionGenerationService.validateGenerationRequest({
    topicId: VALID_TOPIC_ID,
    subtopicId: 'BP-SUB-999',
    difficulty: DifficultyLevel.MEDIUM,
    language: QuestionLanguage.TELUGU,
  });
  assert.strictEqual(bpSubGenReq.isValid, false, 'Generation request with nonexistent BP-SUB- must be rejected');
  assert(bpSubGenReq.error?.includes('does not exist in authoritative taxonomy'), 'Must flag non-existence');

  let bpSubDraftError = false;
  try {
    await questionGenerationService.saveDraft({
      topicId: VALID_TOPIC_ID,
      subtopicId: 'BP-SUB-999',
      difficulty: 'Intermediate',
      language: 'TELUGU',
      questionText: 'ప్రశ్న వివరాలు...',
      options: { a: 'A', b: 'B', c: 'C', d: 'D' },
      correctAnswer: 'A',
    });
  } catch (err: any) {
    bpSubDraftError = true;
    assert.strictEqual(err?.statusCode, 400, 'Must throw 400 on nonexistent BP-SUB- draft save');
    assert(err.message.includes('does not exist in authoritative taxonomy'), 'Must report taxonomy error');
  }
  assert(bpSubDraftError, 'Expected saveDraft to throw 400 for nonexistent BP-SUB- ID');
  console.log('  PASS: Nonexistent BP-SUB-* rejected in both generation validation and draft saving.');

  // Test 14: Regression — Valid canonical Topic/Subtopic pair succeeds
  console.log('[Test 14] Regression: Valid canonical Topic/Subtopic pair succeeds...');
  const canonicalGenReq = await questionGenerationService.validateGenerationRequest({
    topicId: VALID_TOPIC_ID,
    subtopicId: VALID_SUBTOPIC_ID,
    difficulty: DifficultyLevel.MEDIUM,
    language: QuestionLanguage.TELUGU,
  });
  assert.strictEqual(canonicalGenReq.isValid, true, 'Valid canonical pair must pass validation');

  const canonicalDraft = await questionGenerationService.saveDraft({
    topicId: VALID_TOPIC_ID,
    subtopicId: VALID_SUBTOPIC_ID,
    difficulty: 'Intermediate',
    language: 'TELUGU',
    questionText: 'రైలు మరియు ప్లాట్‌ఫామ్ సమస్య...',
    options: { a: '10 మీ/సె', b: '15 మీ/సె', c: '20 మీ/సె', d: '25 మీ/సె' },
    correctAnswer: 'B',
  });
  assert(canonicalIdService.validateCanonicalId(canonicalDraft.id, 'dft_'), 'Draft must be saved with canonical UUID ID (dft_<uuid>)');
  assert(canonicalDraft.id.startsWith('dft_'), 'Draft must receive a canonical draft ID starting with dft_');
  assert.strictEqual(canonicalDraft.topicId, VALID_TOPIC_ID);
  assert.strictEqual(canonicalDraft.subtopicId, VALID_SUBTOPIC_ID);
  await questionGenerationService.deleteDraft(canonicalDraft.id);
  console.log('  PASS: Valid canonical Topic/Subtopic pair succeeds for generation and draft saving.');

  // Test 15: Regression — Real Subtopic assigned to wrong Topic is rejected
  console.log('[Test 15] Regression: Real Subtopic assigned to wrong Topic is rejected...');
  const mismatchedPairGenReq = await questionGenerationService.validateGenerationRequest({
    topicId: MISMATCHED_TOPIC_ID,
    subtopicId: VALID_SUBTOPIC_ID,
    difficulty: DifficultyLevel.MEDIUM,
    language: QuestionLanguage.TELUGU,
  });
  assert.strictEqual(mismatchedPairGenReq.isValid, false, 'Mismatched pair must be rejected');
  assert(mismatchedPairGenReq.error?.includes('does not belong to Topic'), 'Must specify mismatch error');

  let mismatchedDraftError = false;
  try {
    await questionGenerationService.saveDraft({
      topicId: MISMATCHED_TOPIC_ID,
      subtopicId: VALID_SUBTOPIC_ID,
      difficulty: 'Intermediate',
      language: 'TELUGU',
      questionText: 'తప్పు సంబంధిత టాపిక్ డ్రాఫ్ట్...',
      options: { a: 'A', b: 'B', c: 'C', d: 'D' },
      correctAnswer: 'A',
    });
  } catch (err: any) {
    mismatchedDraftError = true;
    assert.strictEqual(err?.statusCode, 400, 'Must throw 400 on mismatched topic/subtopic');
    assert(err.message.includes('does not belong to Topic'), 'Must specify mismatch error');
  }
  assert(mismatchedDraftError, 'Expected saveDraft to throw 400 on mismatched topic/subtopic');
  console.log('  PASS: Mismatched Topic/Subtopic rejected for generation and draft saving.');

  // Test 16: Regression — RANDOM mode continues to work according to existing contract
  console.log('[Test 16] Regression: RANDOM mode continues to work according to contract...');
  const randomGenReq = await questionGenerationService.validateGenerationRequest({
    topicId: VALID_TOPIC_ID,
    subtopicId: 'RANDOM',
    generationMode: 'RANDOM',
    difficulty: DifficultyLevel.MEDIUM,
    language: QuestionLanguage.TELUGU,
  });
  assert.strictEqual(randomGenReq.isValid, true, 'Random mode generation request must be valid');

  const randomDraft = await questionGenerationService.saveDraft({
    topicId: VALID_TOPIC_ID,
    subtopicId: 'RANDOM',
    generationMode: 'RANDOM',
    difficulty: 'Intermediate',
    language: 'TELUGU',
    questionText: 'యాదృచ్ఛిక ఉప-టాపిక్ ప్రశ్న...',
    options: { a: 'A', b: 'B', c: 'C', d: 'D' },
    correctAnswer: 'A',
  });
  assert(canonicalIdService.validateCanonicalId(randomDraft.id, 'dft_'), 'Draft must be saved in RANDOM mode with canonical UUID ID (dft_<uuid>)');
  assert(randomDraft.id.startsWith('dft_'), 'Draft in RANDOM mode must receive a canonical draft ID starting with dft_');
  assert.strictEqual(randomDraft.subtopicId, 'RANDOM');
  await questionGenerationService.deleteDraft(randomDraft.id);
  console.log('  PASS: RANDOM mode persists drafts and validates without requiring specific subtopic.');

  console.log('\n============================================================');
  console.log('ALL TOPIC/SUBTOPIC & CANDIDATE VALIDATION TESTS PASSED');
  console.log('============================================================');
}

runTopicSubtopicValidationTests().catch((err) => {
  console.error('Test failure:', err);
  process.exit(1);
});
