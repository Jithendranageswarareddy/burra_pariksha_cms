/**
 * BURRA PARIKSHA CMS — Question Draft Approval & Workflow Lifecycle Unit Tests
 * Verification of Draft-to-Question Materialization and Workflow Instance Entity Reconciliation
 *
 * Isolation Guarantee:
 * Strictly isolated in-memory unit tests (PERSISTENCE_MODE = 'IN_MEMORY_TEST_ONLY').
 * Zero network access, zero external calls, zero Firestore mutations.
 */

process.env.PERSISTENCE_MODE = 'IN_MEMORY_TEST_ONLY';

import assert from 'node:assert/strict';

async function runWorkflowDraftLifecycleUnitTests() {
  const { questionGenerationService } = await import('../../../backend/domain/question-generation');
  const { questionDraftService } = await import('../../../backend/features/question-generation/services/question-draft.service');
  const { workflowInstancesRepository } = await import('../../../backend/domain/workflow/workflow.repository');
  const { questionDraftsRepository } = await import('../../../database/firestore/repositories/question-drafts.repository');
  const { questionsRepository } = await import('../../../database/firestore/repositories/questions.repository');
  const { topicsRepository, subtopicsRepository } = await import('../../../database/firestore/repositories');
  const { dataIntegrityService } = await import('../../../backend/features/recovery/services/data-integrity.service');
  const { QuestionStatus, UserRole, canonicalIdService } = await import('../../../shared');

  console.log('============================================================');
  console.log('UNIT TEST: Draft-to-Question Approval & Workflow Reconciliation');
  console.log('============================================================\n');

  const VALID_TOPIC_ID = 'top_10000000-0000-4000-8000-000000000001';
  const VALID_SUBTOPIC_ID = 'sub_10000000-0000-4000-8000-000000000101';

  // Seed in-memory taxonomy fixtures
  await topicsRepository.create({
    id: VALID_TOPIC_ID,
    name: 'Aptitude',
    slug: 'aptitude',
    status: 'ACTIVE',
  } as any);

  await subtopicsRepository.create({
    id: VALID_SUBTOPIC_ID,
    topicId: VALID_TOPIC_ID,
    name: 'Time and Distance',
    slug: 'time-and-distance',
    status: 'ACTIVE',
  } as any);

  const authorActor = {
    id: 'USR-AUTHOR-001',
    name: 'Author Alice',
    role: UserRole.QUESTION_CREATOR,
  };

  const reviewerActor = {
    id: 'USR-REVIEWER-002',
    name: 'Reviewer Bob',
    role: UserRole.REVIEWER,
  };

  const adminActor = {
    id: 'USR-ADMIN-003',
    name: 'System Admin',
    role: UserRole.ADMIN,
    roles: [UserRole.ADMIN],
  };

  const draftPayload = {
    topicId: VALID_TOPIC_ID,
    subtopicId: VALID_SUBTOPIC_ID,
    difficulty: 'Intermediate' as const,
    language: 'TELUGU' as const,
    questionText: 'రైలు 72 కి.మీ/గం వేగంతో 200 మీటర్ల ప్లాట్‌ఫారమ్‌ను ఎంత సమయంలో దాటుతుంది?',
    options: {
      a: '10 సెకన్లు',
      b: '15 సెకన్లు',
      c: '20 సెకన్లు',
      d: '25 సెకన్లు',
    },
    correctAnswer: 'A' as const,
    explanation: 'వేగం = 72 * (5/18) = 20 m/s. కాలం = 200 / 20 = 10 సెకన్లు.',
  };

  // --------------------------------------------------------------------------
  // TEST 1: Draft Creation & Submission Creates Workflow with entityId = draft.id
  // --------------------------------------------------------------------------
  console.log('[Test 1] Draft creation & submission creates workflow pointing to draft ID...');
  const savedDraft = await questionGenerationService.saveDraft(draftPayload, authorActor);
  assert.ok(canonicalIdService.validateCanonicalId(savedDraft.id, 'dft_'), 'Draft must have dft_ ID');

  const submitResult = await questionGenerationService.submitForVerification(
    { draftId: savedDraft.id, expectedVersion: savedDraft.version || 1 },
    authorActor
  );
  assert.strictEqual(submitResult.success, true);
  assert.strictEqual(submitResult.status, 'SUBMITTED_FOR_REVIEW');

  // Verify workflow instance was created with entityId === savedDraft.id
  const matchingWorkflows = await workflowInstancesRepository.findMany({
    where: { entityId: savedDraft.id },
    limit: 1,
  });
  assert.strictEqual(matchingWorkflows.length, 1, 'Workflow instance must exist for submitted draft');
  const initialWf = matchingWorkflows[0];
  assert.strictEqual(initialWf.entityId, savedDraft.id);
  assert.strictEqual(initialWf.currentStep, 2);
  assert.strictEqual(initialWf.contentStatus, 'IN_REVIEW');
  console.log('  PASS: Workflow created in Step 02 with entityId = draft ID.');

  // --------------------------------------------------------------------------
  // TEST 2: Failed Approval (GAR-02 Anti-Self-Approval) Preserves Workflow Atomically
  // --------------------------------------------------------------------------
  console.log('[Test 2] Failed approval (GAR-02 anti-self-approval) does not corrupt or partially mutate workflow...');
  let selfApprovalFailed = false;
  try {
    // Author attempts to self-approve without admin override
    await questionGenerationService.approveDraft(savedDraft.id, authorActor);
  } catch (err: any) {
    selfApprovalFailed = true;
  }
  assert.strictEqual(selfApprovalFailed, true, 'Self-approval must fail closed with 403');

  // Workflow must remain untouched at Step 2 with original entityId and version
  const wfAfterFailedApproval = await workflowInstancesRepository.findById(initialWf.id);
  assert.ok(wfAfterFailedApproval);
  assert.strictEqual(wfAfterFailedApproval.entityId, savedDraft.id, 'entityId must remain draftId after failed approval');
  assert.strictEqual(wfAfterFailedApproval.version, initialWf.version, 'version must not advance on failed approval');
  assert.strictEqual(wfAfterFailedApproval.contentStatus, 'IN_REVIEW');
  console.log('  PASS: Atomic failure guarantee verified; no partial workflow mutation.');

  // --------------------------------------------------------------------------
  // TEST 3: Successful Approval Reconciles Workflow entityId to Canonical Question ID
  // --------------------------------------------------------------------------
  console.log('[Test 3] Reviewer approves draft -> workflow entityId reconciled to materialized question ID...');
  const approvedQuestion = await questionGenerationService.approveDraft(
    savedDraft.id,
    reviewerActor,
    'Pedagogical verification passed.'
  );

  assert.ok(approvedQuestion.id.startsWith('qst_'), 'Materialized question must have canonical qst_ ID');
  assert.strictEqual(approvedQuestion.status, QuestionStatus.APPROVED);

  // Draft must be removed from question_drafts collection
  const draftInRepo = await questionDraftsRepository.findById(savedDraft.id);
  assert.strictEqual(draftInRepo, null, 'Draft must be deleted from question_drafts upon materialization');

  // Workflow instance must now point to the new canonical question ID!
  const wfAfterApproval = await workflowInstancesRepository.findById(initialWf.id);
  assert.ok(wfAfterApproval);
  assert.strictEqual(
    wfAfterApproval.entityId,
    approvedQuestion.id,
    'Workflow entityId must be updated to the canonical Question ID (qst_...)'
  );
  assert.strictEqual(wfAfterApproval.contentStatus, 'APPROVED', 'Workflow contentStatus must be updated to APPROVED');
  assert.strictEqual(wfAfterApproval.version, initialWf.version + 1, 'Workflow OCC version must increment');
  console.log(`  PASS: Workflow ${wfAfterApproval.id} entityId successfully reconciled from ${savedDraft.id} to ${approvedQuestion.id}.`);

  // --------------------------------------------------------------------------
  // TEST 4: Data Diagnostics Verification of Reconciled Workflow
  // --------------------------------------------------------------------------
  console.log('[Test 4] Data Diagnostics validates reconciled workflow with ZERO issues...');
  const report = await dataIntegrityService.runFullIntegrityCheck({
    snapshot: {
      workflows: [wfAfterApproval],
      questions: [approvedQuestion as any],
      questionDrafts: [],
      videos: [],
      contentMasters: [],
      scripts: [],
      publishingRecords: [],
      users: [],
      topics: [],
      subtopics: [],
      thumbnails: [],
      pinnedComments: [],
      scriptVersions: [],
      thumbnailVersions: [],
      pinnedCommentVersions: [],
      assignments: [],
      auditLogs: [],
      socialReviews: [],
      validations: [],
      questionConfig: [],
      mediaAssets: [],
      contentPlans: [],
      contentBatches: [],
    },
  });

  const issuesForWf = report.issues.filter(
    (i: any) => i.category === 'WORKFLOW_INTEGRITY' && i.entityId === wfAfterApproval.id
  );
  assert.strictEqual(issuesForWf.length, 0, `Expected 0 workflow integrity issues, got: ${JSON.stringify(issuesForWf)}`);
  console.log('  PASS: Data Diagnostics reports 0 issues for reconciled workflow.');

  // --------------------------------------------------------------------------
  // TEST 5: Discarded/Deleted Draft Soft-Archives Linked Workflow
  // --------------------------------------------------------------------------
  console.log('[Test 5] Discarding/deleting draft soft-archives linked workflow instance...');
  const draftToDiscard = await questionGenerationService.saveDraft(
    { ...draftPayload, questionText: 'రద్దైన చిత్తుప్రతి ప్రశ్న' },
    authorActor
  );
  await questionGenerationService.submitForVerification(
    { draftId: draftToDiscard.id, expectedVersion: draftToDiscard.version || 1 },
    authorActor
  );

  const wfForDiscarded = (await workflowInstancesRepository.findMany({
    where: { entityId: draftToDiscard.id },
    limit: 1,
  }))[0];
  assert.ok(wfForDiscarded, 'Workflow must exist prior to deletion');

  // Author or admin deletes the draft
  const deleteResult = await questionGenerationService.deleteDraft(draftToDiscard.id);
  assert.strictEqual(deleteResult, true);

  // Workflow must be soft-archived to prevent active orphan warning
  const wfAfterDiscard = await workflowInstancesRepository.findById(wfForDiscarded.id);
  assert.ok(wfAfterDiscard);
  assert.strictEqual(wfAfterDiscard.contentStatus, 'ARCHIVED', 'Discarded draft workflow must be ARCHIVED');
  assert.strictEqual(wfAfterDiscard.jobStatus, 'COMPLETED');
  console.log('  PASS: Discarded draft workflow correctly soft-archived.');

  // --------------------------------------------------------------------------
  // TEST 6: QuestionDraftService.approveDraft Also Reconciles Workflow
  // --------------------------------------------------------------------------
  console.log('[Test 6] QuestionDraftService.approveDraft reconciles workflow instance...');
  const draft2 = await questionDraftService.saveDraft(
    { ...draftPayload, questionText: 'రెండవ పరీక్ష చిత్తుప్రతి' },
    authorActor
  );
  await questionGenerationService.submitForVerification(
    { draftId: draft2.id, expectedVersion: draft2.version || 1 },
    authorActor
  );

  const wf2 = (await workflowInstancesRepository.findMany({
    where: { entityId: draft2.id },
    limit: 1,
  }))[0];
  assert.ok(wf2);

  const approvedQ2 = await questionDraftService.approveDraft(
    draft2.id,
    reviewerActor,
    'Verified via QuestionDraftService'
  );
  assert.ok(approvedQ2.id.startsWith('qst_'));

  const wf2Reconciled = await workflowInstancesRepository.findById(wf2.id);
  assert.ok(wf2Reconciled);
  assert.strictEqual(wf2Reconciled.entityId, approvedQ2.id, 'Workflow entityId must be updated to canonical question ID');
  assert.strictEqual(wf2Reconciled.contentStatus, 'APPROVED');
  console.log('  PASS: QuestionDraftService workflow reconciliation confirmed.');

  console.log('\n============================================================');
  console.log('ALL 6 WORKFLOW-DRAFT APPROVAL LIFECYCLE TESTS PASSED CLEANLY');
  console.log('============================================================\n');
}

runWorkflowDraftLifecycleUnitTests().catch((err) => {
  console.error('TEST RUNNER FAILED:', err);
  process.exit(1);
});
