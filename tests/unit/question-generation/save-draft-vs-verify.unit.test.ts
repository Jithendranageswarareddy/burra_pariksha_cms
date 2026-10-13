/**
 * BURRA PARIKSHA CMS — Question Generation Unit Tests: Save Draft vs. Verify Isolation
 * Feature Slice: Question Generation (Stage 01)
 *
 * Mandatory Verification Invariant:
 * SAVE DRAFT != VERIFY
 *
 * Enforces negative assertions proving:
 * 1. Saving a draft does NOT advance workflow to VERIFIED or APPROVED.
 * 2. Saving a draft does NOT invoke Stage 02 verification gates.
 * 3. Saving a draft does NOT create a canonical Question or ContentMaster.
 * 4. Submit for verification is an explicit command requiring a persisted draft.
 * 5. Submit for verification transitions draft to Stage 02 without performing self-approval.
 */

import assert from 'node:assert';
import { questionGenerationService } from '../../../backend/domain/question-generation';
import { QuestionStatus, canonicalIdService } from '../../../shared';

async function runSaveDraftVsVerifyUnitTests() {
  console.log('============================================================');
  console.log('UNIT TEST: Save Draft vs. Verify Isolation & Invariants');
  console.log('============================================================\n');

  // Test 1: Save Draft persistence behavior
  console.log('[Test 1] Saving a draft persists working candidate in status DRAFT...');
  const testDraftPayload = {
    topicId: 'TOP-QA-01',
    subtopicId: 'SUB-01',
    difficulty: 'Intermediate',
    language: 'TELUGU',
    questionText: 'రైలు వేగం లెక్కించే సూత్రం ఏమిటి?',
    options: {
      a: 'వేగం = దూరం * కాలం',
      b: 'వేగం = దూరం / కాలం',
      c: 'వేగం = కాలం / దూరం',
      d: 'వేగం = దూరం + కాలం',
    },
    correctAnswer: 'B' as const,
    explanation: 'వేగం = దూరం / కాలం ప్రాథమిక భౌతిక సూత్రం.',
  };

  const draft = await questionGenerationService.saveDraft(testDraftPayload, {
    id: 'USR-TEST-AUTHOR',
    name: 'Author Alice',
  });

  assert(canonicalIdService.validateCanonicalId(draft.id, 'dft_'), 'Draft must receive a canonical UUID ID (dft_<uuid>)');
  assert(draft.id.startsWith('dft_'), 'Draft must receive a draft ID starting with dft_');
  assert.strictEqual(draft.status, QuestionStatus.DRAFT, 'Draft status must strictly be DRAFT');
  assert.strictEqual(draft.workflowStage, 'QUESTION_STUDIO', 'Draft stage must strictly be QUESTION_STUDIO');

  // Verify uniqueness: saving another draft allocates a different UUID
  const draft2 = await questionGenerationService.saveDraft(testDraftPayload, {
    id: 'USR-TEST-AUTHOR',
    name: 'Author Alice',
  });
  assert(canonicalIdService.validateCanonicalId(draft2.id, 'dft_'), 'Second draft must also be valid canonical UUID');
  assert.notStrictEqual(draft.id, draft2.id, 'Subsequent draft saves must generate unique collision-resistant IDs');
  await questionGenerationService.deleteDraft(draft2.id);

  // Verify ID preservation: updating existing draft retains the same ID
  const updatedExistingDraft = await questionGenerationService.saveDraft({
    ...testDraftPayload,
    id: draft.id,
    questionText: 'రైలు వేగం లెక్కించే సవరించిన సూత్రం ఏమిటి?',
  }, {
    id: 'USR-TEST-AUTHOR',
    name: 'Author Alice',
  });
  assert.strictEqual(updatedExistingDraft.id, draft.id, 'Updating an existing draft must preserve its draft ID');
  console.log(`  PASS: Canonical draft ID ${draft.id} validated for format, uniqueness, and ID preservation.`);

  // Test 2: NEGATIVE ASSERTIONS on Save Draft
  console.log('[Test 2] NEGATIVE ASSERTIONS: Saving draft does NOT verify or approve...');
  assert.notStrictEqual(draft.status, QuestionStatus.APPROVED, 'Saving draft must NEVER set status to APPROVED');
  assert.notStrictEqual(draft.status, 'VERIFIED', 'Saving draft must NEVER set status to VERIFIED');
  assert.notStrictEqual(draft.workflowStage, 'STAGE_02_VERIFICATION', 'Saving draft must NEVER advance to Stage 02');

  const canonicalId = questionGenerationService.getCanonicalQuestionIdForDraft(draft.id);
  assert.strictEqual(canonicalId, undefined, 'Draft must NOT have a canonical question ID allocated upon saving');
  console.log('  PASS: Negative assertions verified. Save Draft did not trigger verification.');

  // Test 3: Submitting non-existent draft throws 404
  console.log('[Test 3] Explicit submit for verification on non-existent draft...');
  let didThrowNotFound = false;
  try {
    await questionGenerationService.submitForVerification(
      { draftId: 'BP-DFT-NON-EXISTENT' },
      { id: 'USR-TEST-AUTHOR', name: 'Author Alice' }
    );
  } catch (err: any) {
    didThrowNotFound = true;
    assert.strictEqual(err?.statusCode, 404, 'Must throw 404 on missing draft');
  }
  assert(didThrowNotFound, 'Expected 404 error when submitting non-existent draft');
  console.log('  PASS: Non-existent draft submission rejected with 404.');

  // Test 4: Submitting an incomplete draft throws 422
  console.log('[Test 4] Submitting incomplete draft throws validation error...');
  const incompleteDraft = await questionGenerationService.saveDraft({
    topicId: 'TOP-QA-01',
    subtopicId: 'SUB-01',
    difficulty: 'Basic',
    language: 'TELUGU',
    questionText: 'Test', // too short (< 5 chars)
    options: { a: 'A', b: 'B', c: '', d: '' },
    correctAnswer: 'A' as const,
  }, { id: 'USR-TEST-AUTHOR', name: 'Author Alice' });

  let didThrowValidationError = false;
  try {
    await questionGenerationService.submitForVerification(
      { draftId: incompleteDraft.id },
      { id: 'USR-TEST-AUTHOR', name: 'Author Alice' }
    );
  } catch (err: any) {
    didThrowValidationError = true;
    assert.strictEqual(err?.statusCode, 422, 'Must throw 422 when draft has validation defects');
  }
  assert(didThrowValidationError, 'Expected 422 error on incomplete draft submission');
  console.log('  PASS: Incomplete draft submission rejected with 422.');

  // Test 5: Explicit Submit for Verification on valid draft
  console.log('[Test 5] Explicit Submit for Verification transitions draft into Stage 02...');
  const submitResult = await questionGenerationService.submitForVerification(
    { draftId: draft.id, remarks: 'Ready for pedagogical review' },
    { id: 'USR-TEST-AUTHOR', name: 'Author Alice' }
  );

  assert.strictEqual(submitResult.success, true);
  assert.strictEqual(submitResult.draftId, draft.id);
  assert.strictEqual(submitResult.status, 'SUBMITTED_FOR_REVIEW');
  assert.strictEqual(submitResult.workflowStage, 'STAGE_02_VERIFICATION');

  // Verify updated draft state in datastore
  const updatedDraft = await questionGenerationService.getDraftById(draft.id);
  assert(updatedDraft, 'Draft must exist after submission');
  assert.strictEqual(updatedDraft.workflowStage, 'STAGE_02_VERIFICATION');
  assert.strictEqual(updatedDraft.status, 'SUBMITTED_FOR_REVIEW');

  // NEGATIVE ASSERTION on explicit submission: Submit != Approve
  assert.notStrictEqual(updatedDraft.status, QuestionStatus.APPROVED, 'Submission must NOT approve the question');
  const postSubmitCanonicalId = questionGenerationService.getCanonicalQuestionIdForDraft(draft.id);
  assert.strictEqual(postSubmitCanonicalId, undefined, 'Submission must NOT allocate canonical question ID');
  console.log('  PASS: Explicit submission advanced draft to Stage 02 without approving.');

  // Test 6: Repeated submission of already-submitted draft throws 409
  console.log('[Test 6] Repeated submission of already submitted draft throws 409 Conflict...');
  let didThrowConflict = false;
  try {
    await questionGenerationService.submitForVerification(
      { draftId: draft.id, remarks: 'Second submission attempt' },
      { id: 'USR-TEST-AUTHOR', name: 'Author Alice' }
    );
  } catch (err: any) {
    didThrowConflict = true;
    assert.strictEqual(err?.statusCode, 409, 'Must throw 409 on duplicate submission');
  }
  assert(didThrowConflict, 'Expected 409 Conflict on repeated submission');
  console.log('  PASS: Repeated submission rejected with HTTP 409.');

  // Test 7: Submitting an already approved/published draft throws 400
  console.log('[Test 7] Submitting an already approved draft throws 400...');
  const approvedDraft = await questionGenerationService.saveDraft({
    topicId: 'TOP-QA-01',
    subtopicId: 'SUB-01',
    difficulty: 'Intermediate',
    language: 'TELUGU',
    questionText: 'ఆమోదించబడిన ప్రశ్న పత్రం...',
    options: { a: 'A', b: 'B', c: 'C', d: 'D' },
    correctAnswer: 'A' as const,
  }, { id: 'USR-TEST-AUTHOR', name: 'Author Alice' });

  // Simulate draft having progressed to approved status
  (approvedDraft as any).status = QuestionStatus.APPROVED;
  const { questionDraftsRepository } = await import('../../../database/firestore/repositories/question-drafts.repository');
  await questionDraftsRepository.update(approvedDraft.id, approvedDraft);

  let didThrowApprovedError = false;
  try {
    await questionGenerationService.submitForVerification(
      { draftId: approvedDraft.id },
      { id: 'USR-TEST-AUTHOR', name: 'Author Alice' }
    );
  } catch (err: any) {
    didThrowApprovedError = true;
    assert.strictEqual(err?.statusCode, 400, 'Must throw 400 when draft is already approved');
  }
  assert(didThrowApprovedError, 'Expected 400 error when submitting already approved draft');
  console.log('  PASS: Approved draft submission rejected with HTTP 400.');

  // Test 8: Submitting with empty/unsaved candidate does NOT invoke save or create draft
  console.log('[Test 8] Attempting submission without persisted draftId does NOT create draft...');
  const initialDrafts = await questionGenerationService.getAllDrafts();
  let didThrowEmptyDraftId = false;
  try {
    await questionGenerationService.submitForVerification({ draftId: '' });
  } catch (err: any) {
    didThrowEmptyDraftId = true;
    assert.strictEqual(err?.statusCode, 400);
  }
  assert(didThrowEmptyDraftId, 'Expected validation error on empty draftId');
  const postDrafts = await questionGenerationService.getAllDrafts();
  assert.strictEqual(postDrafts.length, initialDrafts.length, 'Submission attempt must NEVER create a draft document');
  console.log('  PASS: Attempting submission without persisted draft does not create a draft.');

  // Clean up test drafts
  await questionGenerationService.deleteDraft(draft.id);
  await questionGenerationService.deleteDraft(incompleteDraft.id);
  await questionGenerationService.deleteDraft(approvedDraft.id);

  console.log('\n============================================================');
  console.log('ALL SAVE DRAFT VS. VERIFY UNIT TESTS PASSED');
  console.log('============================================================');
}

runSaveDraftVsVerifyUnitTests().catch((err) => {
  console.error('Test failure:', err);
  process.exit(1);
});
