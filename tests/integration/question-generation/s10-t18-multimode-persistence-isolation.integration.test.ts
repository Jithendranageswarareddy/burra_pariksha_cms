/**
 * BURRA PARIKSHA CMS — S10-T18: Multi-Mode Persistence, Permissions & Cross-Mode Isolation
 * Feature Slice: Question Generation (Stage 01) & Stage 02 Verification Gate
 *
 * Verifies:
 * 1. Complete persistence, retrieval, and schema isolation across all 3 modes:
 *    - Mode 1: QUESTION_CHALLENGE_SHORT
 *    - Mode 2: TOPIC_INTRODUCTION
 *    - Mode 3: EXPLAINED_QUESTIONS_VIDEO
 * 2. Cross-mode data hygiene: Mode 2 drafts do not contain MCQ slots; Mode 3 drafts contain ordered questions.
 * 3. Optimistic Concurrency Control (OCC): Stale expectedVersion produces HTTP 409 ConcurrencyConflictError.
 * 4. Strict GAR-02 anti-self-approval: Stage 02 approval by the author is strictly rejected with HTTP 403.
 * 5. Invariant: Save Draft retains status DRAFT; Submission transitions to Stage 02 and locks status.
 */

import assert from 'node:assert/strict';
import { questionGenerationService } from '../../../backend/domain/question-generation/question-generation.service';
import { questionDraftsRepository } from '../../../database/firestore/repositories/question-drafts.repository';
import {
  QuestionLanguage,
  DifficultyLevel,
  QuestionStatus,
  UserRole,
} from '../../../shared';

async function runMultimodeIsolationTests(): Promise<void> {
  console.log('============================================================');
  console.log('SUITE S10-T18: Multi-Mode Persistence & Isolation Integration Tests');
  console.log('============================================================\n');

  const authorActor = {
    id: 'USR-AUTH-ISOLATION-01',
    name: 'S10 Author Person',
    role: UserRole.QUESTION_CREATOR,
  };

  const reviewerActor = {
    id: 'USR-REV-ISOLATION-02',
    name: 'S10 Reviewer Person',
    role: UserRole.REVIEWER,
  };

  // --------------------------------------------------------------------------
  // TEST 1: Mode 1 (QUESTION_CHALLENGE_SHORT) Persistence & Resumption
  // --------------------------------------------------------------------------
  console.log('[Test 1] Mode 1: Saves and retrieves Question Challenge Short draft...');
  const m1Draft = await questionGenerationService.saveDraft(
    {
      topicId: 'TOP-QA-01',
      subtopicId: 'SUB-01',
      productionMode: 'QUESTION_CHALLENGE_SHORT',
      targetQuestionCount: 1,
      aspectRatio: '9:16',
      questionText: 'ఒక రైలు 90 కి.మీ/గం వేగంతో 200 మీటర్ల దూరాన్ని ఎంత సమయంలో దాటుతుంది?',
      optionA: '8 సెకన్లు',
      optionB: '10 సెకన్లు',
      optionC: '12 సెకన్లు',
      optionD: '15 సెకన్లు',
      correctAnswer: 'A',
      explanation: 'వేగం = 90 * 5/18 = 25 m/s. కాలం = 200 / 25 = 8 సెకన్లు.',
      language: QuestionLanguage.TELUGU,
      difficulty: DifficultyLevel.MEDIUM,
      realLifeContext: 'రైల్వే పరీక్షల్లో తరచుగా అడిగే వేగం లెక్క.',
    },
    authorActor
  );

  assert.equal(m1Draft.productionMode, 'QUESTION_CHALLENGE_SHORT');
  assert.equal(m1Draft.aspectRatio, '9:16');
  assert.equal(m1Draft.status, QuestionStatus.DRAFT);
  assert.equal(m1Draft.optionA, '8 సెకన్లు');
  console.log('✓ Mode 1 draft saved cleanly in Firestore repository');

  // --------------------------------------------------------------------------
  // TEST 2: Mode 2 (TOPIC_INTRODUCTION) Persistence & Zero-Question Isolation
  // --------------------------------------------------------------------------
  console.log('\n[Test 2] Mode 2: Saves Topic Introduction draft with strict zero-question isolation...');
  const m2Draft = await questionGenerationService.saveDraft(
    {
      topicId: 'TOP-QA-01',
      subtopicId: 'SUB-01',
      productionMode: 'TOPIC_INTRODUCTION',
      targetQuestionCount: 0,
      aspectRatio: '16:9',
      conceptTitle: 'వయసు సమస్యలు — సూత్ర విశ్లేషణ',
      introductoryConcept: 'ఈ విభాగంలో మనం వయసు లెక్కలను సమీకరణాలు లేకుండా నిష్పత్తుల వ్యత్యాసం పద్ధతితో నేర్చుకుందాం.',
      questionText: 'ఈ విభాగంలో మనం వయసు లెక్కలను సమీకరణాలు లేకుండా నిష్పత్తుల వ్యత్యాసం పద్ధతితో నేర్చుకుందాం.',
      syllabusScopeNotes: 'గ్రూప్ 2 మరియు ఎస్సై పరీక్షల సిలబస్ విశ్లేషణ.',
      language: QuestionLanguage.TELUGU,
      difficulty: DifficultyLevel.MEDIUM,
    },
    authorActor
  );

  assert.equal(m2Draft.productionMode, 'TOPIC_INTRODUCTION');
  assert.equal(m2Draft.targetQuestionCount, 0);
  assert.equal(m2Draft.aspectRatio, '16:9');
  assert.equal(m2Draft.conceptTitle, 'వయసు సమస్యలు — సూత్ర విశ్లేషణ');
  // Ensure no Mode 1 or Mode 3 leakage in Mode 2 draft
  assert.equal(m2Draft.questions?.length ?? 0, 0);
  assert.ok(!m2Draft.optionA, 'Option A should be empty in Mode 2');
  console.log('✓ Mode 2 draft saved cleanly with zero questions and no option leakage');

  // --------------------------------------------------------------------------
  // TEST 3: Mode 3 (EXPLAINED_QUESTIONS_VIDEO) Persistence & Collection Fidelity
  // --------------------------------------------------------------------------
  console.log('\n[Test 3] Mode 3: Saves Explained Questions Video draft with full 5-question collection...');
  const sampleM3Questions = [1, 2, 3, 4, 5].map((num) => ({
    questionNumber: num,
    slotId: `slt_t18_${num}`,
    questionText: `సమస్య సంఖ్య ${num}: వేగం మరియు దూరం లెక్క?`,
    options: { a: '10s', b: '20s', c: '30s', d: '40s' },
    optionA: '10s',
    optionB: '20s',
    optionC: '30s',
    optionD: '40s',
    correctAnswer: 'B' as const,
    explanation: `సమస్య ${num} సాధన వివరణ.`,
  }));

  const m3Draft = await questionGenerationService.saveDraft(
    {
      topicId: 'TOP-QA-01',
      subtopicId: 'SUB-01',
      productionMode: 'EXPLAINED_QUESTIONS_VIDEO',
      targetQuestionCount: 5,
      aspectRatio: '16:9',
      conceptTitle: 'రైలు లెక్కలు — 5 ప్రశ్నల ప్యాకేజీ',
      introductoryConcept: 'రైలు లెక్కల సాధనలో కీలకమైన 5 సూత్రాలు మరియు ప్రాక్టీస్ ప్రశ్నల సంకలనం.',
      questionText: 'రైలు లెక్కలు — 5 ప్రశ్నల ప్యాకేజీ',
      questions: sampleM3Questions,
      language: QuestionLanguage.TELUGU,
      difficulty: DifficultyLevel.MEDIUM,
    },
    authorActor
  );

  assert.equal(m3Draft.productionMode, 'EXPLAINED_QUESTIONS_VIDEO');
  assert.equal(m3Draft.targetQuestionCount, 5);
  assert.equal(m3Draft.aspectRatio, '16:9');
  assert.equal(m3Draft.questions?.length, 5);
  assert.equal(m3Draft.questions[0].questionText, sampleM3Questions[0].questionText);
  assert.equal(m3Draft.questions[4].questionText, sampleM3Questions[4].questionText);
  console.log('✓ Mode 3 draft saved cleanly with complete 5-question ordered array');

  // --------------------------------------------------------------------------
  // TEST 4: Optimistic Concurrency Control (OCC) Conflict on Stale Version
  // --------------------------------------------------------------------------
  console.log('\n[Test 4] OCC rejects verification submission with stale version (HTTP 409)...');
  const validM2Draft = await questionGenerationService.saveDraft(
    {
      topicId: 'TOP-QA-01',
      subtopicId: 'SUB-01',
      productionMode: 'TOPIC_INTRODUCTION',
      targetQuestionCount: 0,
      aspectRatio: '9:16',
      introductoryConcept: 'ఈ విభాగంలో మనం వయసు లెక్కలను 10 సెకన్లలో ఎలా సాధించవచ్చో నేర్చుకుందాం.',
      questionText: 'ఈ విభాగంలో మనం వయసు లెక్కలను 10 సెకన్లలో ఎలా సాధించవచ్చో నేర్చుకుందాం.',
      difficulty: DifficultyLevel.MEDIUM,
    },
    authorActor
  );

  // Attempt submission with a stale version
  const staleVersion = (validM2Draft.version || 1) + 99;
  await assert.rejects(
    async () => {
      await questionGenerationService.submitForVerification(
        {
          draftId: validM2Draft.id,
          expectedVersion: staleVersion,
        },
        authorActor
      );
    },
    (err: any) => {
      assert.equal(err.statusCode, 409, 'Must throw HTTP 409 Concurrency Conflict');
      return true;
    }
  );
  console.log('✓ OCC conflict correctly triggered with HTTP 409');

  // --------------------------------------------------------------------------
  // TEST 5: Successful Submission Advances to Stage 02 and Locks Status
  // --------------------------------------------------------------------------
  console.log('\n[Test 5] Valid submission advances draft to Stage 02 and locks status to SUBMITTED_FOR_REVIEW...');
  const submitResult = await questionGenerationService.submitForVerification(
    {
      draftId: validM2Draft.id,
      expectedVersion: validM2Draft.version,
    },
    authorActor
  );

  assert.ok(submitResult.workflowInstanceId);
  assert.equal(submitResult.status, 'SUBMITTED_FOR_REVIEW');

  // Verify status in repository
  const fetchedDraft = await questionDraftsRepository.findById(submitResult.draftId);
  assert.equal(fetchedDraft?.status, 'SUBMITTED_FOR_REVIEW');

  // Second submission attempt must be rejected with 409 conflict
  await assert.rejects(
    async () => {
      await questionGenerationService.submitForVerification(
        {
          draftId: validM2Draft.id,
          expectedVersion: fetchedDraft?.version || 2,
        },
        authorActor
      );
    },
    (err: any) => {
      assert.equal(err.statusCode, 409, 'Already submitted draft must reject re-submission with 409');
      return true;
    }
  );
  console.log('✓ Stage 02 transition and OCC submission lock verified');

  // --------------------------------------------------------------------------
  // TEST 6: Strict GAR-02 Anti-Self-Approval Enforcement
  // --------------------------------------------------------------------------
  console.log('\n[Test 6] GAR-02 strictly forbids author from approving their own candidate (HTTP 403)...');
  const { workflowService, workflowInstancesRepository } = await import('../../../backend/domain/workflow');
  const currentWf = await workflowInstancesRepository.findById(submitResult.workflowInstanceId!);

  await assert.rejects(
    async () => {
      // Author attempts to approve their own draft at Stage 02
      await workflowService.transition(
        submitResult.workflowInstanceId!,
        {
          action: 'QUESTION_APPROVE',
          targetStep: 3,
          reason: 'Author attempting self-approval',
          expectedVersion: currentWf?.version ?? 1,
        },
        {
          id: authorActor.id, // SAME ID as author -> GAR-02 violation!
          name: authorActor.name,
          role: UserRole.REVIEWER,
        }
      );
    },
    (err: any) => {
      assert.equal(err.statusCode, 403, 'Must reject self-approval with HTTP 403 Forbidden');
      assert.ok(
        err.message.includes('GAR-02') || err.message.includes('cannot approve'),
        'Must specify anti-self-approval violation'
      );
      return true;
    }
  );
  console.log('✓ Strict GAR-02 anti-self-approval verified (authorId !== approverId)');

  console.log('\n============================================================');
  console.log('ALL S10-T18 MULTI-MODE PERSISTENCE & ISOLATION TESTS PASSED (6/6)');
  console.log('============================================================\n');
}

runMultimodeIsolationTests().catch((err) => {
  console.error('S10-T18 Test Suite Failed:', err);
  process.exit(1);
});
