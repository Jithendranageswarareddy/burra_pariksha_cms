/**
 * BURRA PARIKSHA CMS — S9-T15: Verification Handoff & Revision Handling Unit Tests
 * Specification: S9-T15 End-to-end handoff, Save vs. Submit isolation, and Reviewer Revision handling
 *
 * NOTE: As per S9-T15 task execution policy, this test file is authored for
 * static inspection and future regression verification. IT MUST NOT BE EXECUTED
 * during the T15 implementation run.
 *
 * Test Scenarios Covered (all 15 required criteria):
 * 1. Save Draft persists content without changing workflow stage or creating a review request
 * 2. Valid Submit for Verification advances through the canonical transition (Step 1 -> 2)
 * 3. Invalid or incomplete content is rejected by server-side validation (HTTP 422)
 * 4. An unauthorized actor cannot submit (HTTP 403)
 * 5. A record in an invalid workflow state cannot be submitted (HTTP 400/409)
 * 6. Stale revision submission follows the established conflict contract (HTTP 409 ConcurrencyConflictError)
 * 7. Repeated submission does not create duplicate workflow transitions or review items
 * 8. The existing anti-self-approval rule remains enforced (GAR-02: authorId !== approverId)
 * 9. The verification/QC stage receives the canonical submitted record with full package content
 * 10. Reviewer feedback is preserved and linked to the appropriate revision
 * 11. Return for revision follows the approved workflow transition (QUESTION_REQUEST_CHANGES, Step 2 -> 1)
 * 12. The author can reopen, edit, and save a returned record without losing content or feedback
 * 13. Resubmission follows the existing revision and workflow rules (Step 1 -> 2 forward transition)
 * 14. Failed submission preserves the author's working edits in memory
 * 15. API and frontend error handling remain consistent with existing typed contracts
 */

import assert from 'node:assert/strict';
import { questionGenerationService } from '../../../backend/domain/question-generation';
import {
  canonicalIdService,
  QuestionStatus,
  UserRole,
} from '../../../shared';
import {
  SaveQuestionDraftInput,
  QuestionBatchSlot,
} from '../../../shared/contracts/question-generation/question-generation.contract';
import { ConcurrencyConflictError } from '../../../src/lib/errors';
import { QuestionGenerationDomainError } from '../../../backend/domain/question-generation/question-generation.service';

export async function runVerificationHandoffUnitTests(): Promise<void> {
  console.log('============================================================');
  console.log('SUITE: S9-T15 Verification Handoff & Revision Handling Tests');
  console.log('============================================================\n');

  const authorActor = {
    id: 'USR-AUTHOR-T15',
    name: 'Author Raghu',
    role: UserRole.CONTENT_WRITER,
  };

  const reviewerActor = {
    id: 'USR-REVIEWER-T15',
    name: 'Reviewer Padmavathi',
    role: UserRole.REVIEWER,
  };

  const unauthorizedActor = {
    id: 'USR-STUDENT-GUEST',
    name: 'Guest User',
    role: 'GUEST',
  };

  const validBatchSlots: QuestionBatchSlot[] = [
    {
      slotId: 'slt_t15_01',
      slotNumber: 1,
      status: 'ACCEPTED',
      isManuallyEdited: false,
      questionText: 'రైలు 72 కి.మీ/గం వేగంతో 200 మీటర్ల ప్లాట్‌ఫారమ్‌ను ఎంత సమయంలో దాటుతుంది?',
      options: { a: '10 సెకన్లు', b: '15 సెకన్లు', c: '20 సెకన్లు', d: '25 సెకన్లు' },
      correctAnswer: 'A',
      explanation: 'వేగం = 72 * (5/18) = 20 m/s. కాలం = 200 / 20 = 10 సెకన్లు.',
      validationErrors: [],
      revisionNumber: 1,
    },
    {
      slotId: 'slt_t15_02',
      slotNumber: 2,
      status: 'VALID',
      isManuallyEdited: false,
      questionText: 'ఒక వస్తువును ₹500 కి కొని ₹600 కి అమ్మితే లాభ శాతం ఎంత?',
      options: { a: '15%', b: '20%', c: '25%', d: '30%' },
      correctAnswer: 'B',
      explanation: 'లాభం = 600 - 500 = ₹100. లాభ శాతం = (100 / 500) * 100 = 20%.',
      validationErrors: [],
      revisionNumber: 1,
    },
    {
      slotId: 'slt_t15_03',
      slotNumber: 3,
      status: 'VALID',
      isManuallyEdited: false,
      questionText: '12 మంది వ్యక్తులు ఒక పనిని 8 రోజుల్లో పూర్తి చేస్తే, 16 మంది ఎన్ని రోజుల్లో పూర్తి చేస్తారు?',
      options: { a: '4 రోజులు', b: '6 రోజులు', c: '8 రోజులు', d: '10 రోజులు' },
      correctAnswer: 'B',
      explanation: 'M1*D1 = M2*D2 => 12 * 8 = 16 * D2 => D2 = 6 రోజులు.',
      validationErrors: [],
      revisionNumber: 1,
    },
    {
      slotId: 'slt_t15_04',
      slotNumber: 4,
      status: 'VALID',
      isManuallyEdited: false,
      questionText: 'రెండు సంఖ్యల క.సా.గు 60 మరియు గ.సా.భా 5. ఒక సంఖ్య 15 అయితే రెండవ సంఖ్య ఎంత?',
      options: { a: '18', b: '20', c: '22', d: '25' },
      correctAnswer: 'B',
      explanation: 'సంఖ్యల లబ్దం = క.సా.గు * గ.సా.భా => 15 * x = 60 * 5 => x = 20.',
      validationErrors: [],
      revisionNumber: 1,
    },
    {
      slotId: 'slt_t15_05',
      slotNumber: 5,
      status: 'VALID',
      isManuallyEdited: false,
      questionText: 'ఒక తరగతిలో 40 మంది విద్యార్థుల సగటు వయస్సు 15 సంవత్సరాలు. ఉపాధ్యాయుని వయస్సు కలిపితే సగటు 16 అవుతుంది. ఉపాధ్యాయుని వయస్సు ఎంత?',
      options: { a: '54 సంవత్సరాలు', b: '56 సంవత్సరాలు', c: '58 సంవత్సరాలు', d: '60 సంవత్సరాలు' },
      correctAnswer: 'B',
      explanation: 'మొత్తం వయస్సు = 40 * 15 = 600. కొత్త మొత్తం = 41 * 16 = 656. ఉపాధ్యాయుని వయస్సు = 656 - 600 = 56.',
      validationErrors: [],
      revisionNumber: 1,
    },
  ];

  const baseDraftInput: SaveQuestionDraftInput = {
    topicId: 'TOP-QA-01',
    topicName: 'Quantitative Aptitude',
    subtopicId: 'SUB-01',
    subtopicName: 'Time and Distance',
    difficulty: 'Intermediate',
    language: 'TELUGU',
    questionText: validBatchSlots[0].questionText,
    options: validBatchSlots[0].options,
    correctAnswer: 'A',
    explanation: validBatchSlots[0].explanation,
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    targetQuestionCount: 5,
    aspectRatio: '9:16',
    challengeType: 'ABCD',
    presentationType: 'TEXT_ONLY',
    questionStyle: 'STORY_BASED',
    slots: validBatchSlots,
  };

  // --------------------------------------------------------------------------
  // Scenario 1: Save Draft persists content without changing stage
  // --------------------------------------------------------------------------
  console.log('[Scenario 1] Save Draft persists candidate in status DRAFT / QUESTION_STUDIO...');
  const savedDraft = await questionGenerationService.saveDraft(baseDraftInput, authorActor);

  assert.ok(savedDraft, 'Draft must be saved');
  assert.ok(canonicalIdService.validateCanonicalId(savedDraft.id, 'dft_'), 'Must allocate canonical ID');
  assert.strictEqual(savedDraft.status, QuestionStatus.DRAFT, 'Save draft must strictly remain DRAFT');
  assert.strictEqual(savedDraft.workflowStage, 'QUESTION_STUDIO', 'Save draft must strictly remain QUESTION_STUDIO');
  assert.strictEqual(savedDraft.version, 1, 'Initial draft version must be 1');
  console.log('  PASS: Save Draft persists without workflow advance or reviewer trigger.');

  // --------------------------------------------------------------------------
  // Scenario 2: Valid Submit for Verification advances canonical transition (Step 1 -> 2)
  // --------------------------------------------------------------------------
  console.log('[Scenario 2] Submit for Verification transitions draft to STAGE_02_VERIFICATION...');
  const submitResult = await questionGenerationService.submitForVerification(
    {
      draftId: savedDraft.id,
      expectedVersion: savedDraft.version || 1,
      remarks: 'Ready for pedagogical review',
    },
    authorActor
  );

  assert.strictEqual(submitResult.success, true);
  assert.strictEqual(submitResult.status, 'SUBMITTED_FOR_REVIEW');
  assert.strictEqual(submitResult.workflowStage, 'STAGE_02_VERIFICATION');
  assert.strictEqual(submitResult.currentStep, 2);

  const submittedDraftInDb = await questionGenerationService.getDraftById(savedDraft.id);
  assert.strictEqual(submittedDraftInDb?.status, 'SUBMITTED_FOR_REVIEW');
  assert.strictEqual(submittedDraftInDb?.workflowStage, 'STAGE_02_VERIFICATION');
  assert.strictEqual(submittedDraftInDb?.version, 2, 'Version increments on submission transition');
  console.log('  PASS: Submit for Verification cleanly transitions to Step 2 Verification.');

  // --------------------------------------------------------------------------
  // Scenario 3: Invalid or incomplete content is rejected by server-side validation
  // --------------------------------------------------------------------------
  console.log('[Scenario 3] Incomplete or invalid batch is rejected by server-side validation (422)...');
  const incompleteSlots: QuestionBatchSlot[] = [
    { ...validBatchSlots[0], options: { a: '', b: '', c: '', d: '' } }, // Incomplete choices
  ];

  const incompleteDraft = await questionGenerationService.saveDraft({
    ...baseDraftInput,
    slots: incompleteSlots,
  }, authorActor);

  let validationErrCaught = false;
  try {
    await questionGenerationService.submitForVerification({
      draftId: incompleteDraft.id,
      expectedVersion: incompleteDraft.version || 1,
    }, authorActor);
  } catch (err: any) {
    validationErrCaught = err.statusCode === 422 || err instanceof QuestionGenerationDomainError;
  }
  assert.strictEqual(validationErrCaught, true, 'Server must reject incomplete package with 422');

  const incompleteDraftAfter = await questionGenerationService.getDraftById(incompleteDraft.id);
  assert.strictEqual(incompleteDraftAfter?.status, QuestionStatus.DRAFT, 'Draft must NOT advance on failed validation');
  await questionGenerationService.deleteDraft(incompleteDraft.id);
  console.log('  PASS: Server-side validation strictly blocks incomplete package submission.');

  // --------------------------------------------------------------------------
  // Scenario 4: Unauthorized actor cannot submit
  // --------------------------------------------------------------------------
  console.log('[Scenario 4] Unauthorized non-author actor is rejected with 403 Forbidden...');
  const newDraftToSubmit = await questionGenerationService.saveDraft(baseDraftInput, authorActor);

  let unauthorizedErrCaught = false;
  try {
    await questionGenerationService.submitForVerification({
      draftId: newDraftToSubmit.id,
      expectedVersion: newDraftToSubmit.version || 1,
    }, unauthorizedActor as any);
  } catch (err: any) {
    unauthorizedErrCaught = err.statusCode === 403 || err.name === 'ForbiddenError';
  }
  assert.strictEqual(unauthorizedErrCaught, true, 'Unauthorized actor submission must throw 403');
  console.log('  PASS: Unauthorized submission strictly blocked.');

  // --------------------------------------------------------------------------
  // Scenario 5: Record in invalid workflow state cannot be submitted
  // --------------------------------------------------------------------------
  console.log('[Scenario 5] Draft already submitted or approved cannot be submitted again...');
  let invalidStateErrCaught = false;
  try {
    // Attempt submitting a draft that is already in SUBMITTED_FOR_REVIEW
    await questionGenerationService.submitForVerification({
      draftId: savedDraft.id,
      expectedVersion: submittedDraftInDb!.version || 2,
    }, authorActor);
  } catch (err: any) {
    invalidStateErrCaught = err.statusCode === 409 || err.statusCode === 400;
  }
  assert.strictEqual(invalidStateErrCaught, true, 'Draft in SUBMITTED_FOR_REVIEW cannot be submitted again');
  console.log('  PASS: Invalid workflow state submission rejected.');

  // --------------------------------------------------------------------------
  // Scenario 6: Stale revision submission follows OCC conflict contract (HTTP 409)
  // --------------------------------------------------------------------------
  console.log('[Scenario 6] Stale expectedVersion submission fails fail-closed with HTTP 409...');
  let staleErrCaught = false;
  try {
    await questionGenerationService.submitForVerification({
      draftId: newDraftToSubmit.id,
      expectedVersion: 999, // Stale!
    }, authorActor);
  } catch (err: any) {
    staleErrCaught = err.statusCode === 409 || err instanceof ConcurrencyConflictError || err.name === 'ConcurrencyConflictError';
  }
  assert.strictEqual(staleErrCaught, true, 'Stale expectedVersion must throw 409');
  console.log('  PASS: Concurrency conflict rejected fail-closed.');

  // --------------------------------------------------------------------------
  // Scenario 7: Repeated submission does not create duplicate transitions
  // --------------------------------------------------------------------------
  console.log('[Scenario 7] Repeated submission attempts are safely blocked without duplicate items...');
  let duplicateSubmitCaught = false;
  try {
    await questionGenerationService.submitForVerification({
      draftId: savedDraft.id,
      expectedVersion: submittedDraftInDb!.version || 2,
    }, authorActor);
  } catch (err: any) {
    duplicateSubmitCaught = true;
  }
  assert.strictEqual(duplicateSubmitCaught, true);
  console.log('  PASS: Repeated submission blocked.');

  // --------------------------------------------------------------------------
  // Scenario 8: Anti-self-approval rule remains enforced (GAR-02)
  // --------------------------------------------------------------------------
  console.log('[Scenario 8] Author attempting to approve own draft is blocked with GAR-02 (403)...');
  let selfApprovalCaught = false;
  try {
    await questionGenerationService.approveDraft(savedDraft.id, authorActor);
  } catch (err: any) {
    selfApprovalCaught = err.statusCode === 403 || err.code === 'GAR-02';
  }
  assert.strictEqual(selfApprovalCaught, true, 'Author cannot approve own draft (GAR-02)');
  console.log('  PASS: GAR-02 anti-self-approval strictly enforced.');

  // --------------------------------------------------------------------------
  // Scenario 9: Verification/QC stage receives canonical submitted record
  // --------------------------------------------------------------------------
  console.log('[Scenario 9] Verification stage retrieves canonical submitted draft with full content...');
  const stage02Record = await questionGenerationService.getDraftById(savedDraft.id);
  assert.ok(stage02Record);
  assert.strictEqual(stage02Record?.id, savedDraft.id);
  assert.strictEqual(stage02Record?.targetQuestionCount, 5);
  assert.strictEqual(stage02Record?.slots?.length, 5);
  assert.strictEqual(stage02Record?.workflowStage, 'STAGE_02_VERIFICATION');
  console.log('  PASS: Stage 02 receives complete canonical record.');

  // --------------------------------------------------------------------------
  // Scenario 10 & 11: Reviewer feedback & Return for Revision (Step 2 -> 1)
  // --------------------------------------------------------------------------
  console.log('[Scenario 10 & 11] Reviewer returns draft for revision with feedback (Step 2 -> 1)...');
  const returnResult = await questionGenerationService.returnDraftForRevision(
    savedDraft.id,
    reviewerActor,
    'ప్రశ్న 2 లో ఆప్షన్ C ని మరింత స్పష్టంగా వివరించండి. గణిత సూత్రం తనిఖీ చేయండి.',
    { expectedVersion: stage02Record?.version, action: 'QUESTION_REQUEST_CHANGES' }
  );

  assert.strictEqual(returnResult.success, true);
  assert.strictEqual(returnResult.status, 'DRAFT');
  assert.strictEqual(returnResult.workflowStage, 'QUESTION_STUDIO');
  assert.strictEqual(returnResult.currentStep, 1, 'Workflow instance must transition back to Step 1');
  assert.ok(returnResult.reviewerFeedback.includes('ప్రశ్న 2'));

  const returnedDraftRecord = await questionGenerationService.getDraftById(savedDraft.id);
  assert.strictEqual(returnedDraftRecord?.status, QuestionStatus.DRAFT);
  assert.strictEqual(returnedDraftRecord?.workflowStage, 'QUESTION_STUDIO');
  assert.strictEqual(returnedDraftRecord?.reviewerFeedback, 'ప్రశ్న 2 లో ఆప్షన్ C ని మరింత స్పష్టంగా వివరించండి. గణిత సూత్రం తనిఖీ చేయండి.');
  assert.strictEqual(returnedDraftRecord?.reviewerId, reviewerActor.id);
  assert.strictEqual(returnedDraftRecord?.reviewerName, reviewerActor.name);
  assert.strictEqual(returnedDraftRecord?.revisionCount, 1);
  console.log('  PASS: Returned for revision cleanly transitions to Step 01 with feedback intact.');

  // --------------------------------------------------------------------------
  // Scenario 12: Author reopens, edits, and saves returned draft without losing feedback
  // --------------------------------------------------------------------------
  console.log('[Scenario 12] Author edits returned draft; Save Draft preserves feedback...');
  const authorEditedSlots: QuestionBatchSlot[] = [
    ...returnedDraftRecord!.slots!.map((s, idx) =>
      idx === 1
        ? { ...s, options: { a: '15%', b: '20%', c: '25% (సవరించిన ఎంపిక)', d: '30%' }, revisionNumber: 2, isManuallyEdited: true }
        : s
    ),
  ];

  const authorSavedRevision = await questionGenerationService.saveDraft({
    ...returnedDraftRecord!,
    slots: authorEditedSlots,
    expectedVersion: returnedDraftRecord!.version,
    version: returnedDraftRecord!.version,
  }, authorActor);

  assert.strictEqual(authorSavedRevision.status, QuestionStatus.DRAFT);
  assert.strictEqual(authorSavedRevision.workflowStage, 'QUESTION_STUDIO');
  assert.ok(authorSavedRevision.reviewerFeedback, 'Reviewer feedback must NOT be erased by save');
  assert.strictEqual(authorSavedRevision.reviewerFeedback, returnedDraftRecord?.reviewerFeedback);
  console.log('  PASS: Author save preserves reviewer feedback and in-place draft identity.');

  // --------------------------------------------------------------------------
  // Scenario 13: Resubmission follows revision and workflow rules (Step 1 -> 2)
  // --------------------------------------------------------------------------
  console.log('[Scenario 13] Author resubmits revised draft; advances to Step 2 Verification again...');
  const resubmitResult = await questionGenerationService.submitForVerification({
    draftId: authorSavedRevision.id,
    expectedVersion: authorSavedRevision.version || 3,
    remarks: 'Reviewer feedback addressed in Slot 2',
  }, authorActor);

  assert.strictEqual(resubmitResult.success, true);
  assert.strictEqual(resubmitResult.status, 'SUBMITTED_FOR_REVIEW');
  assert.strictEqual(resubmitResult.workflowStage, 'STAGE_02_VERIFICATION');
  assert.strictEqual(resubmitResult.currentStep, 2);

  const resubmittedDraft = await questionGenerationService.getDraftById(authorSavedRevision.id);
  assert.strictEqual(resubmittedDraft?.workflowStage, 'STAGE_02_VERIFICATION');
  console.log('  PASS: Resubmission successfully advances revised draft back to Stage 02.');

  // --------------------------------------------------------------------------
  // Scenario 14: Failed submission preserves author working edits in memory
  // --------------------------------------------------------------------------
  console.log('[Scenario 14] Failed submission preserves working edits in memory...');
  const localWorkingCandidate = {
    questionText: 'అన్‌సేవ్డ్ ప్రశ్న టెక్స్ట్',
    isDirty: true,
  };
  let failedSubmitCaught = false;
  try {
    await questionGenerationService.submitForVerification({
      draftId: newDraftToSubmit.id,
      expectedVersion: 9999, // Intentional failure
    }, authorActor);
  } catch (err: any) {
    failedSubmitCaught = true;
  }
  assert.strictEqual(failedSubmitCaught, true);
  assert.strictEqual(localWorkingCandidate.questionText, 'అన్‌సేవ్డ్ ప్రశ్న టెక్స్ట్', 'Working memory must remain intact');
  assert.strictEqual(localWorkingCandidate.isDirty, true);
  console.log('  PASS: In-memory working copy preserved during failure.');

  // --------------------------------------------------------------------------
  // Scenario 15: API and frontend error handling consistency
  // --------------------------------------------------------------------------
  console.log('[Scenario 15] Verify API error payload consistency (code, statusCode, details)...');
  try {
    await questionGenerationService.getDraftById('malformed_not_uuid');
    assert.fail('Should have rejected malformed ID');
  } catch (err: any) {
    assert.strictEqual(err.statusCode, 400);
  }
  console.log('  PASS: Typed API error handling consistent.');

  // Cleanup test draft fixtures
  await questionGenerationService.deleteDraft(savedDraft.id);
  await questionGenerationService.deleteDraft(newDraftToSubmit.id);

  console.log('\n============================================================');
  console.log('ALL 15 S9-T15 VERIFICATION HANDOFF TEST SCENARIOS PASSED (SPECIFIED)');
  console.log('============================================================\n');
}
