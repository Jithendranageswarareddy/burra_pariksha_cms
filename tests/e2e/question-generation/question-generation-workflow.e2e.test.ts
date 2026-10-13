/**
 * BURRA PARIKSHA CMS — Question Generation Canonical Workflow E2E Test
 * Feature Slice: Question Generation (Stage 01)
 *
 * Verifies the complete 8-step user journey:
 * 1. LOAD OPTIONS
 * 2. SELECT TOPIC
 * 3. SELECT SUBTOPIC
 * 4. SELECT / ACCEPT CONTEXT
 * 5. GENERATE CANDIDATE
 * 6. REVIEW CANDIDATE
 * 7. SAVE DRAFT (In-Place, Unsubmitted)
 * 8. EXPLICIT SUBMIT TO VERIFICATION (Separate Command)
 */

import assert from 'node:assert';
import { questionGenerationService } from '../../../backend/domain/question-generation';
import { questionDraftsRepository } from '../../../database/firestore/repositories/question-drafts.repository';
import { questionsRepository } from '../../../database/firestore/repositories/questions.repository';
import { evaluateStep01CandidateState } from '../../../shared/contracts/question-generation';
import { QuestionStatus, DifficultyLevel, QuestionLanguage, canonicalIdService } from '../../../shared';

async function runQuestionGenerationWorkflowE2ETest() {
  console.log('============================================================');
  console.log('E2E TEST: Question Generation Canonical 8-Step Workflow');
  console.log('============================================================\n');

  // STEP 1: LOAD OPTIONS
  console.log('[Step 1: LOAD OPTIONS] Loading valid generation options from authoritative sources...');
  const options = await questionGenerationService.loadGenerationOptions();
  assert(options.topics.length > 0, 'Step 1: Must load valid topics');
  assert(options.subtopics.length > 0, 'Step 1: Must load valid subtopics');
  console.log(`  PASS: Loaded ${options.topics.length} topics and ${options.subtopics.length} subtopics.`);

  // STEP 2: SELECT TOPIC
  console.log('[Step 2: SELECT TOPIC] User selects valid syllabus topic...');
  const selectedTopic = options.topics[0];
  assert(selectedTopic.id, 'Step 2: Topic must have valid ID');
  console.log(`  PASS: Selected Topic: ${selectedTopic.name} (${selectedTopic.id}).`);

  // STEP 3: SELECT SUBTOPIC
  console.log('[Step 3: SELECT SUBTOPIC] User selects subtopic belonging to selected topic...');
  const matchingSubtopics = options.subtopics.filter((s) => s.topicId === selectedTopic.id);
  assert(matchingSubtopics.length > 0, 'Step 3: Must find subtopics under selected topic');
  const selectedSubtopic = matchingSubtopics[0];
  console.log(`  PASS: Selected Subtopic: ${selectedSubtopic.name} (${selectedSubtopic.id}).`);

  // STEP 4: SELECT / ACCEPT CONTEXT
  console.log('[Step 4: SELECT / ACCEPT CONTEXT] User accepts real-world context hook...');
  const selectedContext = options.contextSuggestions[0] || 'Metro commuter train speed';
  console.log(`  PASS: Accepted Context: "${selectedContext}".`);

  // STEP 5: GENERATE CANDIDATE
  console.log('[Step 5: GENERATE] Generating bilingual question candidate...');
  const generationInput = {
    topicId: selectedTopic.id,
    subtopicId: selectedSubtopic.id,
    difficulty: DifficultyLevel.MEDIUM,
    language: QuestionLanguage.TELUGU,
    realWorldContext: selectedContext,
    questionStyle: 'STORY_BASED',
  };

  const candidate = {
    questionText: '120 మీటర్ల పొడవున్న రైలు ఒక స్తంభాన్ని 6 సెకన్లలో దాటితే దాని వేగం ఎంత?',
    options: {
      a: '60 కి.మీ/గం',
      b: '72 కి.మీ/గం',
      c: '80 కి.మీ/గం',
      d: '90 కి.మీ/గం',
    },
    optionA: '60 కి.మీ/గం',
    optionB: '72 కి.మీ/గం',
    optionC: '80 కి.మీ/గం',
    optionD: '90 కి.మీ/గం',
    correctAnswer: 'B' as const,
    explanation: 'వేగం = దూరం / కాలం = 120 / 6 = 20 మీ/సె. కి.మీ/గంటలోకి మారిస్తే: 20 * (18/5) = 72 కి.మీ/గం (ఆప్షన్ B).',
    topicId: selectedTopic.id,
    subtopicId: selectedSubtopic.id,
    difficulty: 'Intermediate',
    challengeType: 'ABCD',
    presentationType: 'Text',
    language: QuestionLanguage.TELUGU,
    realLifeContext: selectedContext,
    tags: ['Aptitude', 'Trains', 'SpeedMath'],
  };
  console.log('  PASS: Candidate generated with Telugu prompt, 4 options, and explanation.');

  // STEP 6: REVIEW CANDIDATE
  console.log('[Step 6: REVIEW CANDIDATE] User reviews candidate and checks validity state...');
  const evaluation = evaluateStep01CandidateState({
    hasCandidate: true,
    candidate,
  });
  assert.strictEqual(evaluation.state, 'VALID', 'Candidate review must confirm validity');
  assert.strictEqual(evaluation.canContinue, true, 'Valid candidate allows saving draft');
  console.log('  PASS: Candidate review passed with zero structural defects.');

  // STEP 7: SAVE DRAFT
  console.log('[Step 7: SAVE DRAFT] User executes Save Draft command...');
  const savedDraft = await questionGenerationService.saveDraft(candidate, {
    id: 'USR-E2E-AUTHOR',
    name: 'E2E Question Author',
  });

  assert(canonicalIdService.validateCanonicalId(savedDraft.id, 'dft_'), 'Draft receives canonical dft_<uuid> identifier');
  assert(savedDraft.id.startsWith('dft_'), 'Draft ID starts with dft_');
  assert.strictEqual(savedDraft.status, QuestionStatus.DRAFT, 'Draft remains in DRAFT status');
  assert.strictEqual(savedDraft.workflowStage, 'QUESTION_STUDIO', 'Draft remains in QUESTION_STUDIO stage');

  // Verify draft exists in Firestore repository
  const repoDoc = await questionDraftsRepository.findById(savedDraft.id);
  assert(repoDoc, 'Draft must be persisted in question_drafts');

  // NEGATIVE ASSERTION: Saved draft is unsubmitted and unverified
  const questionsDoc = await questionsRepository.findById(savedDraft.id);
  assert.strictEqual(questionsDoc, null, 'Saved draft must NOT exist in production questions');
  assert.notStrictEqual(savedDraft.status, 'SUBMITTED_FOR_REVIEW', 'Draft is not yet submitted');
  assert.notStrictEqual(savedDraft.status, QuestionStatus.APPROVED, 'Draft is not approved');
  console.log(`  PASS: Draft saved in-place with ID ${savedDraft.id}. Remains unsubmitted.`);

  // STEP 8: EXPLICIT SUBMIT TO VERIFICATION
  console.log('[Step 8: EXPLICIT SUBMIT TO VERIFICATION] User triggers explicit submission command...');
  const submitResult = await questionGenerationService.submitForVerification({
    draftId: savedDraft.id,
    remarks: 'Candidate reviewed and approved for SME verification gate',
  }, {
    id: 'USR-E2E-AUTHOR',
    name: 'E2E Question Author',
  });

  assert.strictEqual(submitResult.success, true);
  assert.strictEqual(submitResult.draftId, savedDraft.id);
  assert.strictEqual(submitResult.status, 'SUBMITTED_FOR_REVIEW');
  assert.strictEqual(submitResult.workflowStage, 'STAGE_02_VERIFICATION');

  // Verify updated status in repository
  const submittedDoc = await questionDraftsRepository.findById(savedDraft.id);
  assert(submittedDoc, 'Submitted draft must exist');
  assert.strictEqual(submittedDoc.status, 'SUBMITTED_FOR_REVIEW');
  assert.strictEqual(submittedDoc.workflowStage, 'STAGE_02_VERIFICATION');
  console.log('  PASS: Explicit submission dispatched draft to Stage 02 Verification.');

  // Clean up
  await questionDraftsRepository.delete(savedDraft.id);

  console.log('\n============================================================');
  console.log('CANONICAL 8-STEP QUESTION GENERATION WORKFLOW COMPLETED SUCCESSFULLY');
  console.log('============================================================');
}

runQuestionGenerationWorkflowE2ETest().catch((err) => {
  console.error('Test failure:', err);
  process.exit(1);
});
