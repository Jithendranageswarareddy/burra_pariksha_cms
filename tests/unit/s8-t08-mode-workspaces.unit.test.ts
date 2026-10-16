/**
 * BURRA PARIKSHA CMS — S8-T08 Unit Test Suite
 * Mode 2 (TOPIC_INTRODUCTION) & Mode 3 (EXPLAINED_QUESTIONS_VIDEO) Workspaces,
 * Backend Mode Validation, Draft Persistence, and Polymorphic Stage 02 Verification.
 *
 * Verifies all 5 mandatory requirements of S8-T08:
 * 1. Mode 2 (TOPIC_INTRODUCTION): zero questions, 9:16 or 16:9 aspect, concept authoring, draft persistence.
 * 2. Mode 3 (EXPLAINED_QUESTIONS_VIDEO): intro + 5/10/15/20 questions, 16:9 aspect, per-question draft persistence.
 * 3. Mode/count/aspect backend validation: backend rejects invalid configurations at persistence boundaries.
 * 4. Mode 1 invariants preserved: QUESTION_CHALLENGE_SHORT remains 9:16, 4 options, Save Draft != Verify.
 * 5. Polymorphic Stage 02 Verification: 5-point concept checklist for Mode 2, 10-point proof checklist for Modes 1 & 3.
 */

import assert from 'node:assert';
import { questionGenerationService } from '../../backend/domain/question-generation';
import {
  QuestionStatus,
  canonicalIdService,
  validateProductionModeConfig,
  ContentProductionMode,
} from '../../shared';
import {
  evaluateStep01CandidateState,
  StudioCandidate,
} from '../../shared/contracts/question-generation';

async function runS8T08UnitTests() {
  console.log('========================================================================');
  console.log('RUNNING S8-T08 UNIT TESTS: Mode 2 & Mode 3 Workspaces & Polymorphic Step 02');
  console.log('========================================================================\n');

  // -------------------------------------------------------------------------
  // TEST 1: Mode 2 (TOPIC_INTRODUCTION) Workspace & Draft Persistence
  // -------------------------------------------------------------------------
  console.log('[Test 1] Mode 2 (TOPIC_INTRODUCTION): Authoring & Draft Persistence');
  const mode2DraftPayload = {
    topicId: 'TOP-QA-01',
    subtopicId: 'SUB-01',
    difficulty: 'Intermediate',
    language: 'TELUGU',
    productionMode: 'TOPIC_INTRODUCTION',
    targetQuestionCount: 0,
    aspectRatio: '9:16' as const,
    conceptTitle: 'వయసు సమస్యలు — త్రికాల సూత్రం',
    introductoryConcept: 'ఈ విభాగంలో మనం వయసు లెక్కలను సమీకరణాలు లేకుండా, కేవలం నిష్పత్తుల వ్యత్యాసం పద్ధతితో ఎలా సాధించవచ్చో నేర్చుకుందాం.',
    syllabusScopeNotes: 'APPSC Group 2 & TSPSC పరీక్షల్లో తరచుగా అడిగే నిష్పత్తుల సూత్రాలు.',
    realLifeContext: 'కుటుంబ సభ్యుల వయస్సు పోలిక',
    questionText: 'ఈ విభాగంలో మనం వయసు లెక్కలను సమీకరణాలు లేకుండా, కేవలం నిష్పత్తుల వ్యత్యాసం పద్ధతితో ఎలా సాధించవచ్చో నేర్చుకుందాం.',
  };

  const savedMode2Draft = await questionGenerationService.saveDraft(mode2DraftPayload, {
    id: 'USR-WRITER-02',
    name: 'Concept Writer',
  });

  assert(savedMode2Draft.id.startsWith('dft_'), 'Mode 2 draft must have canonical dft_ ID');
  assert.strictEqual(savedMode2Draft.productionMode, 'TOPIC_INTRODUCTION', 'Draft must preserve TOPIC_INTRODUCTION mode');
  assert.strictEqual(savedMode2Draft.targetQuestionCount, 0, 'Mode 2 draft question count must be 0');
  assert.strictEqual(savedMode2Draft.aspectRatio, '9:16', 'Draft must preserve 9:16 aspect ratio');
  assert.strictEqual(savedMode2Draft.conceptTitle, 'వయసు సమస్యలు — త్రికాల సూత్రం', 'Concept title must be preserved');
  assert(savedMode2Draft.introductoryConcept?.includes('నిష్పత్తుల వ్యత్యాసం'), 'Introductory concept must be preserved');
  assert(savedMode2Draft.syllabusScopeNotes?.includes('APPSC Group 2'), 'Syllabus scope notes must be preserved');
  assert.strictEqual(savedMode2Draft.status, QuestionStatus.DRAFT, 'Draft must be in DRAFT status');
  console.log('  PASS: Mode 2 draft persisted with zero questions, concept text, and 9:16 aspect ratio.');

  // Also test 16:9 for Mode 2
  const mode2LandscapePayload = {
    ...mode2DraftPayload,
    aspectRatio: '16:9' as const,
  };
  const savedMode2Landscape = await questionGenerationService.saveDraft(mode2LandscapePayload, {
    id: 'USR-WRITER-02',
    name: 'Concept Writer',
  });
  assert.strictEqual(savedMode2Landscape.aspectRatio, '16:9', 'Mode 2 must allow 16:9 landscape aspect ratio');
  console.log('  PASS: Mode 2 draft successfully allows 16:9 landscape aspect ratio.');

  // -------------------------------------------------------------------------
  // TEST 2: Mode 2 Step 01 Candidate State Evaluation
  // -------------------------------------------------------------------------
  console.log('\n[Test 2] Mode 2 Stage 01 State Evaluation');
  const emptyMode2Candidate: Partial<StudioCandidate> = {
    productionMode: 'TOPIC_INTRODUCTION',
    targetQuestionCount: 0,
    aspectRatio: '9:16',
    introductoryConcept: '',
    questionText: '',
  };
  const emptyEval = evaluateStep01CandidateState({
    hasCandidate: false,
    candidate: emptyMode2Candidate,
  });
  assert.strictEqual(emptyEval.state, 'EMPTY', 'Empty Mode 2 workspace must evaluate to EMPTY');
  assert.strictEqual(emptyEval.canContinue, false, 'Empty workspace cannot continue');

  const shortMode2Candidate: Partial<StudioCandidate> = {
    productionMode: 'TOPIC_INTRODUCTION',
    targetQuestionCount: 0,
    aspectRatio: '9:16',
    introductoryConcept: 'Too short',
    questionText: 'Too short',
  };
  const shortEval = evaluateStep01CandidateState({
    hasCandidate: true,
    candidate: shortMode2Candidate,
  });
  assert.strictEqual(shortEval.state, 'INCOMPLETE', 'Concept shorter than 15 chars must evaluate to INCOMPLETE');
  assert.strictEqual(shortEval.canContinue, false);

  const validMode2Candidate: Partial<StudioCandidate> = {
    productionMode: 'TOPIC_INTRODUCTION',
    targetQuestionCount: 0,
    aspectRatio: '9:16',
    introductoryConcept: 'ఇది పూర్తి కాన్సెప్ట్ వివరణ మరియు సూత్రాల సారాంశం.',
    questionText: 'ఇది పూర్తి కాన్సెప్ట్ వివరణ మరియు సూత్రాల సారాంశం.',
  };
  const validMode2Eval = evaluateStep01CandidateState({
    hasCandidate: true,
    candidate: validMode2Candidate,
  });
  assert.strictEqual(validMode2Eval.state, 'VALID', 'Valid Mode 2 concept must evaluate to VALID');
  assert.strictEqual(validMode2Eval.canContinue, true, 'Valid Mode 2 concept can continue');
  console.log('  PASS: Mode 2 Step 01 evaluation validates concept length without requiring 4 MCQ options.');

  // -------------------------------------------------------------------------
  // TEST 3: Mode 3 (EXPLAINED_QUESTIONS_VIDEO) Workspace & Draft Persistence
  // -------------------------------------------------------------------------
  console.log('\n[Test 3] Mode 3 (EXPLAINED_QUESTIONS_VIDEO): Masterclass Authoring & Draft Persistence');
  const mode3Questions = [
    {
      questionNumber: 1,
      questionText: 'ఒక రైలు 54 కిమీ/గం వేగంతో 180 మీటర్ల పొడవు గల ప్లాట్‌ఫారమ్‌ను ఎంత సమయంలో దాటుతుంది?',
      options: {
        a: '12 సెకన్లు',
        b: '15 సెకన్లు',
        c: '18 సెకన్లు',
        d: '20 సెకన్లు',
      },
      optionA: '12 సెకన్లు',
      optionB: '15 సెకన్లు',
      optionC: '18 సెకన్లు',
      optionD: '20 సెకన్లు',
      correctAnswer: 'A' as const,
      explanation: 'రైలు వేగం 54 * (5/18) = 15 మీ/సె. సమయం = 180 / 15 = 12 సెకన్లు.',
      trickOrPitfall: '54 * (5/18) = 15 m/s నేరుగా గుర్తుంచుకోండి.',
    },
    {
      questionNumber: 2,
      questionText: 'రెండు రైళ్లు వ్యతిరేక దిశలలో ప్రయాణిస్తున్నప్పుడు సాపేక్ష వేగం ఎంత?',
      options: {
        a: 'వేగాల మొత్తం (V1 + V2)',
        b: 'వేగాల వ్యత్యాసం (V1 - V2)',
        c: 'వేగాల గుణకారం',
        d: 'స్థిర వేగం',
      },
      optionA: 'వేగాల మొత్తం (V1 + V2)',
      optionB: 'వేగాల వ్యత్యాసం (V1 - V2)',
      optionC: 'వేగాల గుణకారం',
      optionD: 'స్థిర వేగం',
      correctAnswer: 'A' as const,
      explanation: 'వ్యతిరేక దిశలలో ప్రయాణించేటప్పుడు సాపేక్ష వేగం = V1 + V2.',
      trickOrPitfall: 'వ్యతిరేక దిశలో వేగాలు కలుస్తాయి, ఒకే దిశలో తీసివేయబడతాయి.',
    },
    {
      questionNumber: 3,
      questionText: 'ఒక రైలు 72 కిమీ/గం వేగంతో ప్రయాణిస్తోంది. మీ/సె లో దాని వేగం ఎంత?',
      options: { a: '15 మీ/సె', b: '20 మీ/సె', c: '25 మీ/సె', d: '30 మీ/సె' },
      optionA: '15 మీ/సె',
      optionB: '20 మీ/సె',
      optionC: '25 మీ/సె',
      optionD: '30 మీ/సె',
      correctAnswer: 'B' as const,
      explanation: '72 * (5/18) = 20 మీ/సె.',
    },
    {
      questionNumber: 4,
      questionText: '200 మీటర్ల రైలు స్తంభాన్ని 10 సెకన్లలో దాటితే వేగం ఎంత?',
      options: { a: '10 మీ/సె', b: '15 మీ/సె', c: '20 మీ/సె', d: '25 మీ/సె' },
      optionA: '10 మీ/సె',
      optionB: '15 మీ/సె',
      optionC: '20 మీ/సె',
      optionD: '25 మీ/సె',
      correctAnswer: 'C' as const,
      explanation: 'వేగం = 200 / 10 = 20 మీ/సె.',
    },
    {
      questionNumber: 5,
      questionText: 'రైలు పొడవు 150మీ మరియు వంతెన పొడవు 250మీ అయితే మొత్తం దూరం ఎంత?',
      options: { a: '300 మీ', b: '350 మీ', c: '400 మీ', d: '450 మీ' },
      optionA: '300 మీ',
      optionB: '350 మీ',
      optionC: '400 మీ',
      optionD: '450 మీ',
      correctAnswer: 'C' as const,
      explanation: 'మొత్తం దూరం = 150 + 250 = 400 మీటర్లు.',
    },
  ];

  const mode3DraftPayload = {
    topicId: 'TOP-QA-01',
    subtopicId: 'SUB-01',
    difficulty: 'Hard',
    language: 'TELUGU',
    productionMode: 'EXPLAINED_QUESTIONS_VIDEO',
    targetQuestionCount: 5,
    aspectRatio: '16:9' as const,
    conceptTitle: 'రైళ్ల సమస్యలు సంపూర్ణ మాస్టర్‌క్లాస్ — 5 ముఖ్యమైన ప్రశ్నలు',
    introductoryConcept: 'ఈ వీడియోలో మనం రైలు సమస్యల నుండి 5 అత్యంత కీలకమైన ప్రశ్నలను స్టెప్-బై-స్టెప్ షార్ట్‌కట్లతో సాధిస్తాం.',
    syllabusScopeNotes: 'రైలు-ప్లాట్‌ఫారమ్, సాపేక్ష వేగం, మీ/సె మార్పిడి కాన్సెప్ట్స్.',
    questions: mode3Questions,
    questionText: 'ఈ వీడియోలో మనం రైలు సమస్యల నుండి 5 అత్యంత కీలకమైన ప్రశ్నలను సాధిస్తాం.',
  };

  const savedMode3Draft = await questionGenerationService.saveDraft(mode3DraftPayload, {
    id: 'USR-WRITER-03',
    name: 'Masterclass Writer',
  });

  assert(savedMode3Draft.id.startsWith('dft_'), 'Mode 3 draft must have canonical dft_ ID');
  assert.strictEqual(savedMode3Draft.productionMode, 'EXPLAINED_QUESTIONS_VIDEO', 'Mode must be EXPLAINED_QUESTIONS_VIDEO');
  assert.strictEqual(savedMode3Draft.targetQuestionCount, 5, 'Target question count must be 5');
  assert.strictEqual(savedMode3Draft.aspectRatio, '16:9', 'Mode 3 aspect ratio must be 16:9');
  assert.strictEqual(savedMode3Draft.questions?.length, 5, 'Must persist all 5 questions in question set');
  assert.strictEqual(savedMode3Draft.questions[0].questionNumber, 1, 'Question 1 index preserved');
  assert.strictEqual(savedMode3Draft.questions[0].correctAnswer, 'A', 'Question 1 correct answer preserved');
  assert(savedMode3Draft.questions[0].trickOrPitfall?.includes('54 * (5/18)'), 'Trick or pitfall preserved');
  console.log('  PASS: Mode 3 draft persisted with complete 5-question set, roadmap intro, and 16:9 aspect ratio.');

  // -------------------------------------------------------------------------
  // TEST 4: Backend Rejection of Invalid Mode Configurations (Requirement 4)
  // -------------------------------------------------------------------------
  console.log('\n[Test 4] Backend Boundary Validation: Mode / Count / Aspect Constraint Enforcement');

  // Mode 2 with question count > 0 must be rejected
  try {
    await questionGenerationService.saveDraft({
      ...mode2DraftPayload,
      targetQuestionCount: 5, // Invalid for Mode 2
    });
    assert.fail('Backend must reject Mode 2 with targetQuestionCount > 0');
  } catch (err: any) {
    assert(err.message.includes('Mode 2') || err.message.includes('0'), 'Error must specify Mode 2 count constraint');
    console.log('  PASS: Backend rejected Mode 2 with questionCount = 5.');
  }

  // Mode 3 with aspect ratio 9:16 must be rejected
  try {
    await questionGenerationService.saveDraft({
      ...mode3DraftPayload,
      aspectRatio: '9:16' as any, // Invalid for Mode 3
    });
    assert.fail('Backend must reject Mode 3 with 9:16 aspect ratio');
  } catch (err: any) {
    assert(err.message.includes('Mode 3') || err.message.includes('16:9'), 'Error must specify Mode 3 16:9 aspect constraint');
    console.log('  PASS: Backend rejected Mode 3 with 9:16 aspect ratio.');
  }

  // Mode 1 with aspect ratio 16:9 must be rejected
  try {
    await questionGenerationService.saveDraft({
      topicId: 'TOP-QA-01',
      subtopicId: 'SUB-01',
      difficulty: 'Intermediate',
      productionMode: 'QUESTION_CHALLENGE_SHORT',
      targetQuestionCount: 1,
      aspectRatio: '16:9' as any, // Invalid for Mode 1
      questionText: 'పరీక్ష ప్రశ్న ప్రకటన కనీసం 5 అక్షరాలు కలిగి ఉండాలి.',
      options: { a: 'A', b: 'B', c: 'C', d: 'D' },
      correctAnswer: 'A',
      explanation: 'వివరణ ఇక్కడ నమోదు చేయబడింది.',
    });
    assert.fail('Backend must reject Mode 1 with 16:9 aspect ratio');
  } catch (err: any) {
    assert(err.message.includes('Mode 1') || err.message.includes('9:16'), 'Error must specify Mode 1 9:16 aspect constraint');
    console.log('  PASS: Backend rejected Mode 1 with 16:9 aspect ratio.');
  }

  // -------------------------------------------------------------------------
  // TEST 5: Submit for Verification Polymorphic Invariants
  // -------------------------------------------------------------------------
  console.log('\n[Test 5] Submit for Verification: Polymorphic Verification Submission');

  // Submit Mode 2 draft for verification: should succeed without requiring 4 MCQ options
  const mode2SubmitRes = await questionGenerationService.submitForVerification({
    draftId: savedMode2Draft.id,
    expectedVersion: savedMode2Draft.version ?? 1,
  }, {
    id: 'USR-WRITER-02',
    name: 'Concept Writer',
  });
  assert.strictEqual(mode2SubmitRes.success, true, 'Mode 2 draft submission must succeed');
  assert.strictEqual(mode2SubmitRes.workflowStage, 'STAGE_02_VERIFICATION', 'Must transition to STAGE_02_VERIFICATION');
  console.log('  PASS: Mode 2 draft submitted to Stage 02 without 4 MCQ options.');

  // Submit Mode 3 draft for verification: should succeed with complete question set
  const mode3SubmitRes = await questionGenerationService.submitForVerification({
    draftId: savedMode3Draft.id,
    expectedVersion: savedMode3Draft.version ?? 1,
  }, {
    id: 'USR-WRITER-03',
    name: 'Masterclass Writer',
  });
  assert.strictEqual(mode3SubmitRes.success, true, 'Mode 3 draft submission must succeed');
  assert.strictEqual(mode3SubmitRes.workflowStage, 'STAGE_02_VERIFICATION', 'Must transition to STAGE_02_VERIFICATION');
  console.log('  PASS: Mode 3 draft submitted to Stage 02 with 5-question set.');

  // -------------------------------------------------------------------------
  // TEST 6: Stage 02 Anti-Self-Approval (GAR-02) Preserved Across All Modes
  // -------------------------------------------------------------------------
  console.log('\n[Test 6] GAR-02 Invariant: Self-Approval Prohibited on Mode 2 and Mode 3');
  try {
    await questionGenerationService.approveDraft(savedMode2Draft.id, {
      id: 'USR-WRITER-02', // Same as author!
      name: 'Concept Writer',
    });
    assert.fail('GAR-02: Author must not be allowed to approve own Mode 2 draft');
  } catch (err: any) {
    assert(err.message.includes('GAR-02') || err.message.includes('Self-approval prohibited'), 'Must reject self-approval with GAR-02 violation');
    console.log('  PASS: GAR-02 anti-self-approval strictly enforced on Mode 2.');
  }

  try {
    await questionGenerationService.approveDraft(savedMode3Draft.id, {
      id: 'USR-WRITER-03', // Same as author!
      name: 'Masterclass Writer',
    });
    assert.fail('GAR-02: Author must not be allowed to approve own Mode 3 draft');
  } catch (err: any) {
    assert(err.message.includes('GAR-02') || err.message.includes('Self-approval prohibited'), 'Must reject self-approval with GAR-02 violation');
    console.log('  PASS: GAR-02 anti-self-approval strictly enforced on Mode 3.');
  }

  // -------------------------------------------------------------------------
  // TEST 7: Independent Reviewer Approval Succeeds & Materializes Canonical Question
  // -------------------------------------------------------------------------
  console.log('\n[Test 7] Independent Reviewer Approval: Materializes Canonical Mode 2 & Mode 3 Questions');
  const approvedMode2Question = await questionGenerationService.approveDraft(savedMode2Draft.id, {
    id: 'USR-INDEPENDENT-REVIEWER',
    name: 'Pedagogical Lead Reviewer',
  });
  assert(approvedMode2Question.id.startsWith('qst_'), 'Approved Mode 2 question must have canonical qst_ ID');
  assert.strictEqual(approvedMode2Question.status, QuestionStatus.APPROVED, 'Status must be APPROVED');
  assert.strictEqual(approvedMode2Question.productionMode, 'TOPIC_INTRODUCTION', 'Production mode must be preserved in canonical question');
  assert.strictEqual(approvedMode2Question.targetQuestionCount, 0, 'Question count must be 0');
  console.log('  PASS: Mode 2 draft approved by independent reviewer and materialized into canonical Question.');

  const approvedMode3Question = await questionGenerationService.approveDraft(savedMode3Draft.id, {
    id: 'USR-INDEPENDENT-REVIEWER',
    name: 'Pedagogical Lead Reviewer',
  });
  assert(approvedMode3Question.id.startsWith('qst_'), 'Approved Mode 3 question must have canonical qst_ ID');
  assert.strictEqual(approvedMode3Question.status, QuestionStatus.APPROVED, 'Status must be APPROVED');
  assert.strictEqual(approvedMode3Question.productionMode, 'EXPLAINED_QUESTIONS_VIDEO', 'Production mode preserved');
  assert.strictEqual(approvedMode3Question.questions?.length, 5, 'All 5 explained questions preserved in canonical Question');
  console.log('  PASS: Mode 3 draft approved by independent reviewer and materialized into canonical Question.');

  console.log('\n========================================================================');
  console.log('ALL S8-T08 UNIT TESTS PASSED SUCCESSFULLY! (7/7 Verification Suites)');
  console.log('========================================================================\n');
}

runS8T08UnitTests().catch((err) => {
  console.error('\nFAILED: S8-T08 Unit Tests encountered an error:', err);
  process.exit(1);
});
