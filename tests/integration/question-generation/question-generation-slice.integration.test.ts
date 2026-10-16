/**
 * BURRA PARIKSHA CMS — Question Generation Integration Test
 * Feature Slice: Question Generation (Stage 01)
 *
 * Verifies integration between:
 * - Domain service (questionGenerationService)
 * - Authoritative persistence (questionDraftsRepository)
 * - Taxonomy service (Two-tier Topic -> Subtopic)
 * - Save Draft vs. Verify isolation across boundaries
 */

import assert from 'node:assert';
import { questionGenerationService } from '../../../backend/domain/question-generation';
import { questionDraftsRepository } from '../../../database/firestore/repositories/question-drafts.repository';
import { questionsRepository } from '../../../database/firestore/repositories/questions.repository';
import { QuestionStatus, DifficultyLevel, QuestionLanguage, canonicalIdService } from '../../../shared';

async function runQuestionGenerationIntegrationTests() {
  console.log('============================================================');
  console.log('INTEGRATION TEST: Question Generation Feature Slice');
  console.log('============================================================\n');

  // Step 1: Loading generation options through domain boundary
  console.log('[Step 1] Loading generation options through domain boundary...');
  const options = await questionGenerationService.loadGenerationOptions();
  assert(options.topics.length > 0, 'Must load active topics from taxonomy');
  assert(options.subtopics.length > 0, 'Must load active subtopics from taxonomy');
  assert(options.difficultyLevels.includes(DifficultyLevel.MEDIUM), 'Must include difficulty levels');
  console.log(`  PASS: Loaded ${options.topics.length} topics and ${options.subtopics.length} subtopics.`);

  // Step 2: Topic and Subtopic validation across service boundary
  console.log('[Step 2] Validating Topic and Subtopic hierarchy alignment...');
  const firstTopic = options.topics[0];
  const firstSubtopic = options.subtopics.find((s) => s.topicId === firstTopic.id);
  assert(firstSubtopic, 'Must have at least one subtopic belonging to first topic');

  const validTaxonomy = await questionGenerationService.validateGenerationRequest({
    topicId: firstTopic.id,
    subtopicId: firstSubtopic.id,
    difficulty: DifficultyLevel.MEDIUM,
    language: QuestionLanguage.TELUGU,
  });
  assert.strictEqual(validTaxonomy.isValid, true, 'Aligned Topic and Subtopic must pass validation');

  // Invalid taxonomy: mismatched subtopic
  const mismatchedSub = options.subtopics.find((s) => s.topicId !== firstTopic.id);
  if (mismatchedSub) {
    const invalidTaxonomy = await questionGenerationService.validateGenerationRequest({
      topicId: firstTopic.id,
      subtopicId: mismatchedSub.id,
      difficulty: DifficultyLevel.MEDIUM,
      language: QuestionLanguage.TELUGU,
    });
    assert.strictEqual(invalidTaxonomy.isValid, false, 'Mismatched Topic and Subtopic must fail validation');
    console.log('  PASS: Topic/Subtopic hierarchy strictly enforced.');
  }

  // Step 3: Draft persistence through authoritative Firestore repository
  console.log('[Step 3] Persisting candidate draft into Firestore...');
  const testCandidate = {
    topicId: firstTopic.id,
    subtopicId: firstSubtopic.id,
    difficulty: 'Intermediate',
    language: 'TELUGU',
    questionText: 'ఒక రైలు 72 కి.మీ/గం వేగంతో ప్రయాణిస్తూ 200 మీటర్ల ప్లాట్‌ఫామ్‌ను 20 సెకన్లలో దాటితే, రైలు పొడవు ఎంత?',
    options: {
      a: '150 మీటర్లు',
      b: '200 మీటర్లు',
      c: '250 మీటర్లు',
      d: '300 మీటర్లు',
    },
    correctAnswer: 'B' as const,
    explanation: 'మొత్తం దూరం = వేగం * కాలం = 20 మీ/సె * 20 సె = 400 మీటర్లు. రైలు పొడవు = 400 - 200 = 200 మీటర్లు (ఆప్షన్ B).',
    realLifeContext: 'Train overtaking on parallel tracks',
  };

  const createdDraft = await questionGenerationService.saveDraft(testCandidate, {
    id: 'USR-INT-TEST',
    name: 'Integration Author',
  });

  // Verify in Firestore repository
  assert(canonicalIdService.validateCanonicalId(createdDraft.id, 'dft_'), 'Draft must be saved with canonical dft_<uuid> identifier');
  const repoDoc = await questionDraftsRepository.findById(createdDraft.id);
  assert(repoDoc, 'Draft document must exist in questionDraftsRepository');
  assert.strictEqual(repoDoc.id, createdDraft.id);
  assert.strictEqual(repoDoc.status, QuestionStatus.DRAFT);
  assert.strictEqual(repoDoc.workflowStage, 'QUESTION_STUDIO');
  console.log(`  PASS: Draft persisted to Firestore repository (${createdDraft.id}).`);

  // Step 4: CRITICAL NEGATIVE ASSERTION across Firestore collections
  console.log('[Step 4] NEGATIVE ASSERTION: Verifying draft is NOT in questions collection...');
  const questionsDoc = await questionsRepository.findById(createdDraft.id);
  assert.strictEqual(questionsDoc, null, 'Draft ID must NEVER exist in production questions collection');
  console.log('  PASS: Draft is strictly isolated in question_drafts collection.');

  // Step 5: Explicit Submission for Verification across boundary
  console.log('[Step 5] Explicit submission dispatches draft to Stage 02 Verification...');
  const submitResponse = await questionGenerationService.submitForVerification({
    draftId: createdDraft.id,
    remarks: 'Ready for Subject Matter Expert pedagogical audit',
    expectedVersion: createdDraft.version ?? 1,
  }, {
    id: 'USR-INT-TEST',
    name: 'Integration Author',
  });

  assert.strictEqual(submitResponse.success, true);
  assert.strictEqual(submitResponse.status, 'SUBMITTED_FOR_REVIEW');
  assert.strictEqual(submitResponse.workflowStage, 'STAGE_02_VERIFICATION');

  const submittedRepoDoc = await questionDraftsRepository.findById(createdDraft.id);
  assert(submittedRepoDoc, 'Draft must exist after submission');
  assert.strictEqual(submittedRepoDoc.status, 'SUBMITTED_FOR_REVIEW');
  assert.strictEqual(submittedRepoDoc.workflowStage, 'STAGE_02_VERIFICATION');
  console.log('  PASS: Draft successfully transitioned to Stage 02 Verification.');

  // Clean up test draft
  await questionDraftsRepository.delete(createdDraft.id);

  console.log('\n============================================================');
  console.log('QUESTION GENERATION SLICE INTEGRATION TESTS PASSED');
  console.log('============================================================');
}

runQuestionGenerationIntegrationTests().catch((err) => {
  console.error('Test failure:', err);
  process.exit(1);
});
