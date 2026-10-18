/**
 * BURRA PARIKSHA CMS — Sprint 9 + Sprint 10 Functional Launch Closure Regression Tests
 *
 * Covers:
 * 1. Mode 3 (EXPLAINED_QUESTIONS_VIDEO): candidate.questions array preservation through mapping & persistence.
 * 2. Mode 1 (QUESTION_CHALLENGE_SHORT): Multi-slot batch generation, buffering, bounded retry, slot edit preservation.
 * 3. Server-side validation gate: Incomplete or invalid batch rejection on verification submission.
 * 4. Mode 2 (TOPIC_INTRODUCTION): Zero-question enforcement, concept retention, save/reopen fidelity.
 * 5. Mode isolation and strict non-negotiables (GAR-02, Save Draft != Verify).
 */

import assert from 'node:assert/strict';
import { questionGenerationService } from '../../../backend/domain/question-generation/question-generation.service';
import {
  canonicalIdService,
  QuestionStatus,
  QuestionLanguage,
  DifficultyLevel,
} from '../../../shared';
import {
  GenerateCandidateInput,
  GenerationResult,
  QuestionBatchSlot,
} from '../../../shared/contracts/question-generation';

async function runLaunchClosureTests(): Promise<void> {
  console.log('============================================================');
  console.log('REGRESSION SUITE: Sprint 9 + Sprint 10 Functional Launch Closure');
  console.log('============================================================\n');

  // --------------------------------------------------------------------------
  // TEST 1: Mode 3 (EXPLAINED_QUESTIONS_VIDEO) Candidate Questions Preservation
  // --------------------------------------------------------------------------
  console.log('[Test 1] Mode 3: candidate.questions array is preserved without loss...');
  const sampleQuestions = [
    {
      questionNumber: 1,
      slotId: 'slt_test_1',
      questionText: 'ఒక రైలు 60 కి.మీ/గం వేగంతో ప్రయాణిస్తోంది. 300 మీటర్ల దూరాన్ని ఎంత సమయంలో దాటుతుంది?',
      options: { a: '15 సెకన్లు', b: '18 సెకన్లు', c: '20 సెకన్లు', d: '25 సెకన్లు' },
      optionA: '15 సెకన్లు',
      optionB: '18 సెకన్లు',
      optionC: '20 సెకన్లు',
      optionD: '25 సెకన్లు',
      correctAnswer: 'B' as const,
      explanation: 'వేగం = 60 * 5/18 = 50/3 m/s. కాలం = 300 / (50/3) = 18 సెకన్లు.',
      trickOrPitfall: 'km/h నుండి m/s మార్పిడి 5/18 తో గుణించాలి.',
    },
    {
      questionNumber: 2,
      slotId: 'slt_test_2',
      questionText: 'రెండు రైళ్లు వ్యతిరేక దిశలలో ప్రయాణిస్తున్నప్పుడు వాటి సాపేక్ష వేగం ఎంత?',
      options: { a: 'వేగాల మొత్తం', b: 'వేగాల వ్యత్యాసం', c: 'వేగాల గుణకారం', d: 'వేగాల సగటు' },
      optionA: 'వేగాల మొత్తం',
      optionB: 'వేగాల వ్యత్యాసం',
      optionC: 'వేగాల గుణకారం',
      optionD: 'వేగాల సగటు',
      correctAnswer: 'A' as const,
      explanation: 'వ్యతిరేక దిశల్లో సాపేక్ష వేగం v1 + v2 అవుతుంది.',
      trickOrPitfall: 'ఒకే దిశలో ప్రయాణిస్తేనే వేగాల వ్యత్యాసం తీసుకోవాలి.',
    },
    {
      questionNumber: 3,
      slotId: 'slt_test_3',
      questionText: '120 మీటర్ల పొడవు గల రైలు స్తంభాన్ని 6 సెకన్లలో దాటితే దాని వేగం ఎంత?',
      options: { a: '54 కి.మీ/గం', b: '72 కి.మీ/గం', c: '90 కి.మీ/గం', d: '36 కి.మీ/గం' },
      optionA: '54 కి.మీ/గం',
      optionB: '72 కి.మీ/గం',
      optionC: '90 కి.మీ/గం',
      optionD: '36 కి.మీ/గం',
      correctAnswer: 'B' as const,
      explanation: 'వేగం = 120/6 = 20 m/s = 20 * 18/5 = 72 km/h.',
      trickOrPitfall: 'm/s నుండి km/h కు మార్చడానికి 18/5 తో గుణించండి.',
    },
    {
      questionNumber: 4,
      slotId: 'slt_test_4',
      questionText: 'ప్లాట్‌ఫారమ్‌ను దాటడానికి పట్టే సమయం లెక్కించేటప్పుడు రైలు పొడవుతో పాటు ఏమి కలపాలి?',
      options: { a: 'ట్రాక్ పొడవు', b: 'ప్లాట్‌ఫారమ్ పొడవు', c: 'సిగ్నల్ దూరం', d: 'ఇంజన్ బరువు' },
      optionA: 'ట్రాక్ పొడవు',
      optionB: 'ప్లాట్‌ఫారమ్ పొడవు',
      optionC: 'సిగ్నల్ దూరం',
      optionD: 'ఇంజన్ బరువు',
      correctAnswer: 'B' as const,
      explanation: 'మొత్తం దూరం = రైలు పొడవు + ప్లాట్‌ఫారమ్ పొడవు.',
      trickOrPitfall: 'స్తంభం అయితే కేవలం రైలు పొడవే తీసుకుంటాం.',
    },
    {
      questionNumber: 5,
      slotId: 'slt_test_5',
      questionText: 'ఒక రైలు టన్నెల్‌ను దాటడానికి పట్టే సమయం 30 సెకన్లు. రైలు పొడవు 200 మీ, టన్నెల్ 400 మీ అయితే వేగం ఎంత?',
      options: { a: '60 కి.మీ/గం', b: '72 కి.మీ/గం', c: '80 కి.మీ/గం', d: '90 కి.మీ/గం' },
      optionA: '60 కి.మీ/గం',
      optionB: '72 కి.మీ/గం',
      optionC: '80 కి.మీ/గం',
      optionD: '90 కి.మీ/గం',
      correctAnswer: 'B' as const,
      explanation: 'మొత్తం దూరం = 600 మీ. వేగం = 600/30 = 20 m/s = 72 km/h.',
      trickOrPitfall: 'దూరాల కూడిక 200 + 400 = 600 మీ.',
    },
  ];

  // Save Mode 3 draft and verify complete payload preservation
  const mode3Draft = await questionGenerationService.saveDraft({
    topicId: 'TOP-QA-01',
    subtopicId: 'SUB-01',
    productionMode: 'EXPLAINED_QUESTIONS_VIDEO',
    targetQuestionCount: 5,
    aspectRatio: '16:9',
    questionText: 'రైలు సమస్యలు మాస్టర్‌క్లాస్ - 5 వివరించిన ప్రశ్నలు',
    introductoryConcept: 'ఈ వీడియోలో మనం రైలు సమస్యల (Trains Problems) పై 5 కీలకమైన ప్రాక్టీస్ ప్రశ్నలను నేర్చుకుందాం.',
    conceptTitle: 'రైలు సమస్యలు — మాస్టర్‌క్లాస్',
    syllabusScopeNotes: 'APPSC/TSPSC మరియు బ్యాంక్ పరీక్షల కోసం పూర్తి విశ్లేషణ.',
    questions: sampleQuestions,
    explanation: 'పూర్తి వివరణలు మరియు షార్ట్‌కట్ ట్రిక్స్.',
    language: QuestionLanguage.TELUGU,
    difficulty: DifficultyLevel.MEDIUM,
  }, { id: 'USR-M3-AUTHOR', name: 'Mode 3 Author' });

  assert.equal(mode3Draft.productionMode, 'EXPLAINED_QUESTIONS_VIDEO');
  assert.equal(mode3Draft.targetQuestionCount, 5);
  assert.equal(mode3Draft.aspectRatio, '16:9');
  assert.equal(mode3Draft.questions?.length, 5, 'Must persist all 5 questions');
  assert.equal(mode3Draft.questions[0].questionText, sampleQuestions[0].questionText);
  assert.equal(mode3Draft.questions[0].correctAnswer, 'B');
  assert.equal(mode3Draft.questions[0].trickOrPitfall, sampleQuestions[0].trickOrPitfall);
  assert.equal(mode3Draft.conceptTitle, 'రైలు సమస్యలు — మాస్టర్‌క్లాస్');
  console.log('✓ Mode 3 questions array correctly preserved in persistence');

  // --------------------------------------------------------------------------
  // TEST 2: Mode 1 (QUESTION_CHALLENGE_SHORT) Batch Generation Runner
  // --------------------------------------------------------------------------
  console.log('\n[Test 2] Mode 1: Batch runner generates 5 multiple question candidates with bounded retries...');
  let callCount = 0;
  const mockOrchestrator = {
    async generateQuestionCandidate(input: any) {
      callCount++;
      return {
        candidate: {
          content: `Batch Question Statement ${callCount}`,
          questionText: `Batch Question Statement ${callCount}`,
          option_a: 'Option A value',
          option_b: 'Option B value',
          option_c: 'Option C value',
          option_d: 'Option D value',
          correct_answer: 'A',
          explanation: `Explanation for question ${callCount}`,
          difficulty: 'MEDIUM',
          language: QuestionLanguage.TELUGU,
        },
        metadata: {
          modelUsed: 'mock-gemini',
          generationDurationMs: 10,
        },
      } as GenerationResult;
    },
  };

  const batchResult = await questionGenerationService.generateCandidate(
    {
      topicId: 'TOP-QA-01',
      subtopicId: 'SUB-01',
      productionMode: 'QUESTION_CHALLENGE_SHORT',
      targetQuestionCount: 5,
      aspectRatio: '9:16',
      language: QuestionLanguage.TELUGU,
      difficulty: DifficultyLevel.MEDIUM,
    },
    undefined,
    mockOrchestrator
  );

  assert(batchResult.batchAssembly, 'Must return batchAssembly');
  assert.equal(batchResult.batchAssembly.requestedCount, 5);
  assert.equal(batchResult.batchAssembly.slots.length, 5);
  assert.equal(batchResult.batchAssembly.batchStatus, 'COMPLETE');
  assert.equal(batchResult.batchAssembly.inMemoryValidCount, 5);
  assert.equal(new Set(batchResult.batchAssembly.slots.map((s) => s.slotId)).size, 5);
  console.log('✓ Mode 1 batch generation runner produces complete 5-question batch');

  // --------------------------------------------------------------------------
  // TEST 3: Preservation of Manually Edited and Accepted Slots on Batch Regen
  // --------------------------------------------------------------------------
  console.log('\n[Test 3] Mode 1: Regeneration preserves manually edited and accepted slots...');
  const existingSlots: QuestionBatchSlot[] = [
    {
      ...batchResult.batchAssembly.slots[0],
      isManuallyEdited: true,
      status: 'MANUALLY_EDITED',
      questionText: 'Human Edited Question 1',
    },
    {
      ...batchResult.batchAssembly.slots[1],
      status: 'ACCEPTED',
      questionText: 'Human Accepted Question 2',
    },
    {
      ...batchResult.batchAssembly.slots[2],
      status: 'EMPTY',
      questionText: '',
      options: { a: '', b: '', c: '', d: '' },
      correctAnswer: 'A',
      explanation: '',
      isManuallyEdited: false,
      validationErrors: [],
      revisionNumber: 0,
    },
    {
      ...batchResult.batchAssembly.slots[3],
      status: 'EMPTY',
      questionText: '',
      options: { a: '', b: '', c: '', d: '' },
      correctAnswer: 'A',
      explanation: '',
      isManuallyEdited: false,
      validationErrors: [],
      revisionNumber: 0,
    },
    {
      ...batchResult.batchAssembly.slots[4],
      status: 'EMPTY',
      questionText: '',
      options: { a: '', b: '', c: '', d: '' },
      correctAnswer: 'A',
      explanation: '',
      isManuallyEdited: false,
      validationErrors: [],
      revisionNumber: 0,
    },
  ];

  const regenResult = await questionGenerationService.generateCandidate(
    {
      topicId: 'TOP-QA-01',
      subtopicId: 'SUB-01',
      productionMode: 'QUESTION_CHALLENGE_SHORT',
      targetQuestionCount: 5,
      aspectRatio: '9:16',
      language: QuestionLanguage.TELUGU,
      difficulty: DifficultyLevel.MEDIUM,
      existingSlots,
    },
    undefined,
    mockOrchestrator
  );

  assert(regenResult.batchAssembly);
  assert.equal(regenResult.batchAssembly.slots[0].questionText, 'Human Edited Question 1');
  assert.equal(regenResult.batchAssembly.slots[0].status, 'MANUALLY_EDITED');
  assert.equal(regenResult.batchAssembly.slots[1].questionText, 'Human Accepted Question 2');
  assert.equal(regenResult.batchAssembly.slots[1].status, 'ACCEPTED');
  assert(regenResult.batchAssembly.slots[2].questionText.length > 0);
  assert.equal(regenResult.batchAssembly.slots[2].status, 'VALID');
  console.log('✓ Human edited and accepted slots are strictly preserved during batch regeneration');

  // --------------------------------------------------------------------------
  // TEST 4: Server-Side Validation Rejects Incomplete Batches from Submission
  // --------------------------------------------------------------------------
  console.log('\n[Test 4] Server-side validation gate rejects incomplete or invalid batches...');
  const incompleteSlots: QuestionBatchSlot[] = [
    {
      ...batchResult.batchAssembly.slots[0],
      status: 'VALID',
    },
    {
      ...batchResult.batchAssembly.slots[1],
      status: 'EMPTY',
      questionText: '',
    },
  ];

  // Validate candidate directly
  const incompleteValidation = questionGenerationService.validateCandidate({
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    targetQuestionCount: 5,
    slots: incompleteSlots,
  } as any);

  assert.equal(incompleteValidation.isValid, false);
  assert(incompleteValidation.errors.some((e) => /requires 5 slots/i.test(e) || /unfilled/i.test(e)));

  // Save an incomplete draft
  const incompleteDraft = await questionGenerationService.saveDraft({
    topicId: 'TOP-QA-01',
    subtopicId: 'SUB-01',
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    targetQuestionCount: 5,
    aspectRatio: '9:16',
    questionText: 'Sample batch draft text',
    slots: incompleteSlots,
    language: QuestionLanguage.TELUGU,
    difficulty: DifficultyLevel.MEDIUM,
  }, { id: 'USR-BATCH-AUTHOR', name: 'Batch Author' });

  // Attempt to submit for verification -> Must throw 422
  await assert.rejects(
    () => questionGenerationService.submitForVerification({
      draftId: incompleteDraft.id,
      expectedVersion: incompleteDraft.version || 1,
    }, { id: 'USR-BATCH-AUTHOR', name: 'Batch Author' }),
    (err: any) => err.statusCode === 422 && /Draft cannot be submitted for verification/i.test(err.message)
  );
  console.log('✓ Incomplete batch submission is strictly rejected with 422 by server-side verification gate');

  // --------------------------------------------------------------------------
  // TEST 5: Mode 2 (TOPIC_INTRODUCTION) Zero-Question Enforcement & Preservation
  // --------------------------------------------------------------------------
  console.log('\n[Test 5] Mode 2: Zero-question enforcement, concept retention, and draft saving...');
  const mode2Payload = {
    topicId: 'TOP-QA-01',
    subtopicId: 'SUB-01',
    productionMode: 'TOPIC_INTRODUCTION' as const,
    targetQuestionCount: 0,
    aspectRatio: '9:16' as const,
    questionText: 'కాలం మరియు దూరం అధ్యాయంలో వేగం అనేది ప్రాథమిక భావన. వేగం అంటే యూనిట్ కాలంలో ప్రయాణించిన దూరం.',
    introductoryConcept: 'కాలం మరియు దూరం అధ్యాయంలో వేగం అనేది ప్రాథమిక భావన. వేగం అంటే యూనిట్ కాలంలో ప్రయాణించిన దూరం.',
    conceptTitle: 'కాలం — దూరం పరిచయం',
    syllabusScopeNotes: 'రైలు లెక్కలు, పడవల లెక్కలు మరియు సాపేక్ష వేగం ప్రాథమిక భావనలు.',
    language: QuestionLanguage.TELUGU,
    difficulty: DifficultyLevel.EASY,
  };

  const mode2Draft = await questionGenerationService.saveDraft(mode2Payload, {
    id: 'USR-M2-AUTHOR',
    name: 'Mode 2 Author',
  });

  assert.equal(mode2Draft.productionMode, 'TOPIC_INTRODUCTION');
  assert.equal(mode2Draft.targetQuestionCount, 0);
  assert.equal(mode2Draft.questions?.length || 0, 0, 'Mode 2 must enforce 0 questions');
  assert.equal(mode2Draft.conceptTitle, 'కాలం — దూరం పరిచయం');
  assert.equal(mode2Draft.status, QuestionStatus.DRAFT, 'Save draft must remain in DRAFT status');
  assert.equal(mode2Draft.workflowStage, 'QUESTION_STUDIO', 'Save draft must remain in Stage 01 QUESTION_STUDIO');

  // Reopen draft by ID and verify exact fields restored
  const reopened = await questionGenerationService.getDraftById(mode2Draft.id);
  assert(reopened);
  assert.equal(reopened.conceptTitle, 'కాలం — దూరం పరిచయం');
  assert.equal(reopened.introductoryConcept, mode2Payload.introductoryConcept);
  assert.equal(reopened.syllabusScopeNotes, mode2Payload.syllabusScopeNotes);
  assert.equal(reopened.aspectRatio, '9:16');
  console.log('✓ Mode 2 draft persists and reopens with 0 questions and complete concept retention');

  // Short concept validation failure test (< 15 chars)
  const shortConceptValidation = questionGenerationService.validateCandidate({
    productionMode: 'TOPIC_INTRODUCTION',
    targetQuestionCount: 0,
    introductoryConcept: 'Too short',
  });
  assert.equal(shortConceptValidation.isValid, false);
  assert(shortConceptValidation.errors.some((e) => /at least 15 characters/i.test(e)));
  console.log('✓ Mode 2 content-length validation correctly enforces >= 15 characters');

  console.log('\n============================================================');
  console.log('ALL SPRINT 9 + SPRINT 10 CLOSURE REGRESSION TESTS PASSED!');
  console.log('============================================================');
}

runLaunchClosureTests().catch((err) => {
  console.error('Launch closure regression tests failed:', err);
  process.exit(1);
});
