/**
 * BURRA PARIKSHA CMS — S9-T13: Audience-Facing Preview Unit Tests
 * Specification: S9-T13 Audience-Facing Preview for QUESTION_CHALLENGE_SHORT
 *
 * NOTE: As per S9-T13 task execution policy, this test file is authored for
 * static inspection and future regression verification. IT MUST NOT BE EXECUTED
 * during the T13 implementation run.
 *
 * Test Scenarios Covered:
 * 1. Representative complete Question Challenge Short package projection
 * 2. Multiple questions with distinct prompts and choices (A/ఎ, B/బి, C/సి, D/డి)
 * 3. Canonical package presentation ordering (1..N sequence)
 * 4. Strict exclusion of correct answers and private explanations from audience projection
 * 5. Strict exclusion of workflow stage, internal IDs, reviewer notes, and production metadata
 * 6. Live unsaved edits reflected immediately in preview without persistence
 * 7. Saved preview reflects the current saved record, isolated from unsaved edits
 * 8. Reordering questions updates preview projection sequence immediately
 * 9. Incomplete or empty slots do not produce fabricated questions or choices
 * 10. Switching between saved and unsaved sources does not mutate either record
 * 11. Existing content records remain intact during preview projection
 */

import assert from 'node:assert/strict';
import {
  projectToAudiencePreview,
} from '../../../shared/lib/audience-preview-projection';
import {
  AudiencePreviewPackageProjection,
  AudiencePreviewSourceVersion,
  AudienceQuestionItemProjection,
} from '../../../shared/contracts/question-generation/audience-preview.contract';
import {
  QuestionBatchAssembly,
  QuestionBatchSlot,
  StudioCandidate,
} from '../../../shared/contracts/question-generation/question-generation.contract';
import { QuestionDraft } from '../../../shared/types/question';

export async function runAudiencePreviewUnitTests(): Promise<void> {
  console.log('============================================================');
  console.log('SUITE: S9-T13 Audience-Facing Preview Unit Tests');
  console.log('============================================================\n');

  // --------------------------------------------------------------------------
  // TEST FIXTURES
  // --------------------------------------------------------------------------

  const representativeBatchSlots: QuestionBatchSlot[] = [
    {
      slotId: 'slt_test_01',
      slotNumber: 1,
      status: 'ACCEPTED',
      isManuallyEdited: false,
      questionText: 'రైలు 72 కి.మీ/గం వేగంతో 200 మీటర్ల ప్లాట్‌ఫారమ్‌ను ఎంత సమయంలో దాటుతుంది?',
      options: {
        a: '10 సెకన్లు',
        b: '15 సెకన్లు',
        c: '20 సెకన్లు',
        d: '25 సెకన్లు',
      },
      correctAnswer: 'A',
      explanation: 'వేగం = 72 * (5/18) = 20 m/s. కాలం = 200 / 20 = 10 సెకన్లు. బుర్ర ట్రిక్: 18 * 4 = 72 కాబట్టి 5 * 4 = 20 m/s.',
      validationErrors: [],
      revisionNumber: 1,
    },
    {
      slotId: 'slt_test_02',
      slotNumber: 2,
      status: 'VALID',
      isManuallyEdited: false,
      questionText: 'ఒక వస్తువును ₹500 కి కొని ₹600 కి అమ్మితే లాభ శాతం ఎంత?',
      options: {
        a: '15%',
        b: '20%',
        c: '25%',
        d: '10%',
      },
      correctAnswer: 'B',
      explanation: 'లాభం = 600 - 500 = 100. లాభ శాతం = (100 / 500) * 100 = 20%.',
      validationErrors: [],
      revisionNumber: 1,
    },
    {
      slotId: 'slt_test_03',
      slotNumber: 3,
      status: 'MANUALLY_EDITED',
      isManuallyEdited: true,
      questionText: 'A ఒక పనిని 10 రోజుల్లో, B అదే పనిని 15 రోజుల్లో చేస్తే ఇద్దరూ కలిసి ఎన్ని రోజుల్లో చేస్తారు?',
      options: {
        a: '5 రోజులు',
        b: '6 రోజులు',
        c: '7 రోజులు',
        d: '8 రోజులు',
      },
      correctAnswer: 'B',
      explanation: 'కలిసి చేసే కాలం = (10 * 15) / (10 + 15) = 150 / 25 = 6 రోజులు.',
      validationErrors: [],
      revisionNumber: 1,
    },
  ];

  const representativeBatchAssembly: QuestionBatchAssembly = {
    requestedCount: 5,
    inMemoryValidCount: 3,
    persistedValidCount: 3,
    rejectedCount: 0,
    overflowCount: 0,
    batchStatus: 'PARTIAL',
    slots: representativeBatchSlots,
    rejectedItems: [],
  };

  const representativeCandidate: StudioCandidate = {
    questionText: 'రైలు 72 కి.మీ/గం వేగంతో 200 మీటర్ల ప్లాట్‌ఫారమ్‌ను ఎంత సమయంలో దాటుతుంది?',
    optionA: '10 సెకన్లు',
    optionB: '15 సెకన్లు',
    optionC: '20 సెకన్లు',
    optionD: '25 సెకన్లు',
    correctAnswer: 'A',
    explanation: 'వేగం = 72 * (5/18) = 20 m/s. కాలం = 200 / 20 = 10 సెకన్లు. బుర్ర ట్రిక్: 18 * 4 = 72 కాబట్టి 5 * 4 = 20 m/s.',
    topicId: 'top_arithmetic_01',
    subtopicId: 'sub_speed_distance_01',
    difficulty: 'MEDIUM',
    challengeType: 'ABCD',
    presentationType: 'TEXT',
    language: 'TELUGU',
    realLifeContext: 'Real-world speed problem',
    tags: ['Aptitude', 'Telugu'],
  };

  const representativeSavedDraft: QuestionDraft = {
    id: 'dft_saved_prod_001',
    version: 2,
    topicId: 'top_arithmetic_01',
    topicName: 'అంకగణితం (Arithmetic)',
    subtopicId: 'sub_speed_distance_01',
    subtopicName: 'కాలం & దూరం (Time & Distance)',
    difficulty: 'MEDIUM',
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    targetQuestionCount: 3,
    aspectRatio: '9:16',
    questionText: 'రైలు 72 కి.మీ/గం వేగంతో 200 మీటర్ల ప్లాట్‌ఫారమ్‌ను ఎంత సమయంలో దాటుతుంది?',
    options: {
      a: '10 సెకన్లు',
      b: '15 సెకన్లు',
      c: '20 సెకన్లు',
      d: '25 సెకన్లు',
    },
    correctAnswer: 'A',
    explanation: 'Saved draft internal speed trick proof.',
    workflowStage: 'STAGE_01_GENERATE',
    status: 'DRAFT',
    authorId: 'usr_internal_author_99',
    slots: representativeBatchSlots,
    createdAt: '2026-10-18T10:00:00.000Z',
    updatedAt: '2026-10-18T10:30:00.000Z',
  };

  // --------------------------------------------------------------------------
  // TEST 1: Representative Complete Package Projection
  // --------------------------------------------------------------------------
  console.log('[Test 1] Complete Question Challenge Short package projection...');
  const projection1 = projectToAudiencePreview({
    candidate: representativeCandidate,
    batchAssembly: representativeBatchAssembly,
    savedDraft: representativeSavedDraft,
    sourceVersion: 'UNSAVED_EDITS',
    topicName: 'అంకగణితం',
    subtopicName: 'కాలం & దూరం',
  });

  assert.equal(projection1.packageType, 'QUESTION_CHALLENGE_SHORT');
  assert.equal(projection1.aspectRatio, '9:16');
  assert.equal(projection1.durationSeconds, 58);
  assert.equal(projection1.channelBranding, 'బుర్ర పరీక్ష');
  assert.equal(projection1.participationInvitation, 'మీ బుర్రకి పరీక్ష! సరైన సమాధానం కామెంట్ చేయండి.');
  assert.equal(projection1.callToAction, 'లైక్ చేయండి, కామెంట్ చేయండి, సబ్‌స్క్రైబ్ చేసుకోండి!');
  assert.equal(projection1.pinnedCommentPrompt, 'సరైన సమాధానం పిన్ కామెంట్‌లో చూడండి!');
  assert.equal(projection1.topicTitle, 'అంకగణితం');
  assert.equal(projection1.subtopicTitle, 'కాలం & దూరం');
  assert.equal(projection1.questions.length, 3);
  console.log('✓ Package projection conforms to 9:16 vertical short specifications');

  // --------------------------------------------------------------------------
  // TEST 2: Multiple Questions with Distinct Prompts and Choices
  // --------------------------------------------------------------------------
  console.log('[Test 2] Multiple questions with distinct prompts and Telugu/English labels...');
  assert.equal(projection1.questions[0].questionText.includes('రైలు'), true);
  assert.equal(projection1.questions[1].questionText.includes('లాభ శాతం'), true);
  assert.equal(projection1.questions[2].questionText.includes('రోజుల్లో'), true);

  // Validate choice mapping for question 1
  const q1Choices = projection1.questions[0].choices;
  assert.equal(q1Choices.length, 4);
  assert.deepEqual(
    q1Choices.map((c) => ({ label: c.label, teluguLabel: c.teluguLabel, text: c.text })),
    [
      { label: 'A', teluguLabel: 'ఎ', text: '10 సెకన్లు' },
      { label: 'B', teluguLabel: 'బి', text: '15 సెకన్లు' },
      { label: 'C', teluguLabel: 'సి', text: '20 సెకన్లు' },
      { label: 'D', teluguLabel: 'డి', text: '25 సెకన్లు' },
    ]
  );
  console.log('✓ Distinct questions and 4-choice Telugu mapping verified');

  // --------------------------------------------------------------------------
  // TEST 3: Canonical Package Presentation Order
  // --------------------------------------------------------------------------
  console.log('[Test 3] Canonical package presentation ordering (1..N sequence)...');
  projection1.questions.forEach((q, idx) => {
    assert.equal(q.orderIndex, idx);
    assert.equal(q.questionNumber, idx + 1);
  });
  console.log('✓ Canonical order 1..3 strictly maintained in package');

  // --------------------------------------------------------------------------
  // TEST 4: Strict Separation — Correct Answers & Explanations Excluded
  // --------------------------------------------------------------------------
  console.log('[Test 4] Correct answers and private explanations strictly excluded from projection...');
  projection1.questions.forEach((q, idx) => {
    assert.equal((q as any).correctAnswer, undefined, `Slot ${idx} must not expose correctAnswer`);
    assert.equal((q as any).correct_answer, undefined, `Slot ${idx} must not expose correct_answer`);
    assert.equal((q as any).explanation, undefined, `Slot ${idx} must not expose explanation`);
    assert.equal((q as any).proof, undefined, `Slot ${idx} must not expose proof`);
    assert.equal((q as any).speedTrick, undefined, `Slot ${idx} must not expose speedTrick`);

    // Verify choice objects themselves do not contain isCorrect flags
    q.choices.forEach((choice) => {
      assert.equal((choice as any).isCorrect, undefined, `Choice ${choice.label} must not leak isCorrect`);
      assert.equal((choice as any).is_correct, undefined, `Choice ${choice.label} must not leak is_correct`);
    });
  });
  console.log('✓ Audience projection is completely free of answer keys and private explanations');

  // --------------------------------------------------------------------------
  // TEST 5: Strict Separation — Internal Workflow, IDs & Reviewer Metadata Excluded
  // --------------------------------------------------------------------------
  console.log('[Test 5] Internal IDs, reviewer notes, authoring metadata excluded from audience items...');
  projection1.questions.forEach((q, idx) => {
    assert.equal((q as any).workflowStage, undefined);
    assert.equal((q as any).status, undefined);
    assert.equal((q as any).authorId, undefined);
    assert.equal((q as any).reviewerId, undefined);
    assert.equal((q as any).reviewerNotes, undefined);
    assert.equal((q as any).validationErrors, undefined);
  });
  console.log('✓ Internal authoring metadata strictly isolated from audience items');

  // --------------------------------------------------------------------------
  // TEST 6: Unsaved Edits Reflected in Preview Without Persistence
  // --------------------------------------------------------------------------
  console.log('[Test 6] Unsaved in-memory edits immediately reflected in projection...');
  const editedBatchAssembly: QuestionBatchAssembly = {
    ...representativeBatchAssembly,
    slots: [
      {
        ...representativeBatchSlots[0],
        questionText: 'రైలు 90 కి.మీ/గం వేగంతో ప్రయాణిస్తోంది (Unsaved Live Edit)?',
        options: {
          ...representativeBatchSlots[0].options,
          a: '8 సెకన్లు (Modified Choice)',
        },
      },
      representativeBatchSlots[1],
      representativeBatchSlots[2],
    ],
  };

  const liveProjection = projectToAudiencePreview({
    candidate: representativeCandidate,
    batchAssembly: editedBatchAssembly,
    savedDraft: representativeSavedDraft,
    sourceVersion: 'UNSAVED_EDITS',
  });

  assert.equal(liveProjection.sourceVersion, 'UNSAVED_EDITS');
  assert.equal(liveProjection.questions[0].questionText, 'రైలు 90 కి.మీ/గం వేగంతో ప్రయాణిస్తోంది (Unsaved Live Edit)?');
  assert.equal(liveProjection.questions[0].choices[0].text, '8 సెకన్లు (Modified Choice)');
  // Ensure the underlying saved draft was NOT modified
  assert.equal(representativeSavedDraft.slots?.[0].questionText, representativeBatchSlots[0].questionText);
  console.log('✓ Unsaved edits reflect immediately in UNSAVED_EDITS projection without persisting');

  // --------------------------------------------------------------------------
  // TEST 7: Saved Preview Reflects Saved Record Isolated from Unsaved Edits
  // --------------------------------------------------------------------------
  console.log('[Test 7] SAVED_RECORD projection isolates saved state from unsaved edits...');
  const savedProjection = projectToAudiencePreview({
    candidate: representativeCandidate,
    batchAssembly: editedBatchAssembly, // has unsaved edits
    savedDraft: representativeSavedDraft, // has original saved record
    sourceVersion: 'SAVED_RECORD',
  });

  assert.equal(savedProjection.sourceVersion, 'SAVED_RECORD');
  assert.equal(savedProjection.hasSavedRecord, true);
  assert.equal(savedProjection.versionNumber, 2);
  assert.equal(savedProjection.draftId, 'dft_saved_prod_001');
  // Saved preview MUST show original saved prompt, not the unsaved edit
  assert.equal(savedProjection.questions[0].questionText, representativeBatchSlots[0].questionText);
  assert.equal(savedProjection.questions[0].choices[0].text, '10 సెకన్లు');
  console.log('✓ SAVED_RECORD projection accurately displays persisted draft independent of editor edits');

  // --------------------------------------------------------------------------
  // TEST 8: Reordering Questions Changes Preview Sequence
  // --------------------------------------------------------------------------
  console.log('[Test 8] Reordering batch slots updates preview projection order...');
  const reorderedSlots: QuestionBatchSlot[] = [
    representativeBatchSlots[2], // Question 3 becomes position 0
    representativeBatchSlots[0], // Question 1 becomes position 1
    representativeBatchSlots[1], // Question 2 becomes position 2
  ];

  const reorderedAssembly: QuestionBatchAssembly = {
    ...representativeBatchAssembly,
    slots: reorderedSlots,
  };

  const reorderedProjection = projectToAudiencePreview({
    candidate: representativeCandidate,
    batchAssembly: reorderedAssembly,
    savedDraft: representativeSavedDraft,
    sourceVersion: 'UNSAVED_EDITS',
  });

  assert.equal(reorderedProjection.questions[0].questionText.includes('రోజుల్లో'), true);
  assert.equal(reorderedProjection.questions[1].questionText.includes('రైలు'), true);
  assert.equal(reorderedProjection.questions[2].questionText.includes('లాభ శాతం'), true);
  assert.equal(reorderedProjection.questions[0].orderIndex, 0);
  assert.equal(reorderedProjection.questions[1].orderIndex, 1);
  assert.equal(reorderedProjection.questions[2].orderIndex, 2);
  console.log('✓ In-memory slot reordering immediately dictates audience presentation sequence');

  // --------------------------------------------------------------------------
  // TEST 9: Empty or Incomplete Slots Do Not Produce Fabricated Content
  // --------------------------------------------------------------------------
  console.log('[Test 9] Incomplete and empty slots handled without fabricating artificial content...');
  const emptySlotAssembly: QuestionBatchAssembly = {
    requestedCount: 5,
    inMemoryValidCount: 1,
    persistedValidCount: 1,
    rejectedCount: 0,
    overflowCount: 0,
    batchStatus: 'PARTIAL',
    slots: [
      representativeBatchSlots[0],
      {
        slotId: 'slt_empty_02',
        slotNumber: 2,
        status: 'EMPTY',
        isManuallyEdited: false,
        questionText: '',
        options: { a: '', b: '', c: '', d: '' },
        correctAnswer: '',
        explanation: '',
        validationErrors: [],
        revisionNumber: 1,
      },
    ],
    rejectedItems: [],
  };

  const incompleteProjection = projectToAudiencePreview({
    candidate: representativeCandidate,
    batchAssembly: emptySlotAssembly,
    savedDraft: null,
    sourceVersion: 'UNSAVED_EDITS',
  });

  assert.equal(incompleteProjection.questions.length, 2);
  assert.equal(incompleteProjection.questions[0].isComplete, true);
  assert.equal(incompleteProjection.questions[1].isComplete, false);
  assert.equal(incompleteProjection.questions[1].questionText, '');
  assert.equal(incompleteProjection.questions[1].choices.every((c) => c.text === ''), true);
  assert.equal(incompleteProjection.questions[1].incompleteNotice?.includes('empty'), true);
  assert.equal(incompleteProjection.isComplete, false);
  console.log('✓ Incomplete slots retain accurate empty state without fabricated questions');

  // --------------------------------------------------------------------------
  // TEST 10: Switching Between Saved and Unsaved Does Not Mutate Either Source
  // --------------------------------------------------------------------------
  console.log('[Test 10] Switching preview source version is non-mutating...');
  const originalSavedSnapshot = JSON.stringify(representativeSavedDraft);
  const originalEditedSnapshot = JSON.stringify(editedBatchAssembly);

  // Perform multiple alternating projections
  projectToAudiencePreview({
    candidate: representativeCandidate,
    batchAssembly: editedBatchAssembly,
    savedDraft: representativeSavedDraft,
    sourceVersion: 'SAVED_RECORD',
  });

  projectToAudiencePreview({
    candidate: representativeCandidate,
    batchAssembly: editedBatchAssembly,
    savedDraft: representativeSavedDraft,
    sourceVersion: 'UNSAVED_EDITS',
  });

  projectToAudiencePreview({
    candidate: representativeCandidate,
    batchAssembly: editedBatchAssembly,
    savedDraft: representativeSavedDraft,
    sourceVersion: 'SAVED_RECORD',
  });

  assert.equal(JSON.stringify(representativeSavedDraft), originalSavedSnapshot);
  assert.equal(JSON.stringify(editedBatchAssembly), originalEditedSnapshot);
  console.log('✓ Projection derivation is purely deterministic and side-effect free');

  // --------------------------------------------------------------------------
  // TEST 11: Single Question Draft Projection (Fallback / Target Count = 1)
  // --------------------------------------------------------------------------
  console.log('[Test 11] Single question candidate preview when target count is 1...');
  const singleCandidate: StudioCandidate = {
    questionText: 'ఒక సంఖ్యలో 30% విలువ 45 అయితే ఆ సంఖ్య ఏది?',
    optionA: '150',
    optionB: '120',
    optionC: '160',
    optionD: '140',
    correctAnswer: 'A',
    explanation: 'సంఖ్య = 45 / 0.30 = 150.',
    topicId: 'top_arithmetic_01',
    subtopicId: 'sub_percentages_01',
    difficulty: 'MEDIUM',
    challengeType: 'ABCD',
    presentationType: 'TEXT',
    language: 'TELUGU',
    realLifeContext: 'Commercial math percentage',
    tags: ['Arithmetic', 'Telugu'],
  };

  const singleProjection = projectToAudiencePreview({
    candidate: singleCandidate,
    batchAssembly: null,
    savedDraft: null,
    sourceVersion: 'UNSAVED_EDITS',
  });

  assert.equal(singleProjection.questions.length, 1);
  assert.equal(singleProjection.questions[0].questionText, 'ఒక సంఖ్యలో 30% విలువ 45 అయితే ఆ సంఖ్య ఏది?');
  assert.equal(singleProjection.questions[0].choices[0].text, '150');
  assert.equal((singleProjection.questions[0] as any).correctAnswer, undefined);
  assert.equal((singleProjection.questions[0] as any).explanation, undefined);
  console.log('✓ Single question candidate projection validated');

  console.log('\n============================================================');
  console.log('ALL 11 AUDIENCE PREVIEW UNIT TEST SCENARIOS DEFINED');
  console.log('============================================================');
}
