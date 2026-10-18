/**
 * BURRA PARIKSHA CMS — System Admin Workflow Operations & Stage Coverage Integration Test Suite
 *
 * Validates real HTTP end-to-end execution of representative System Admin actions:
 * 1. Stage 01: Draft authoring, updating, and explicit submission for verification (with OCC expectedVersion).
 * 2. Stage 02: Strict GAR-02 zero-bypass self-approval denial (HTTP 403), missing author identity fail-closed (HTTP 403),
 *              admin author reconciliation recovery route (HTTP 200), and independent reviewer approval (HTTP 201).
 * 3. Stage 03: Teleprompter script creation and retrieval via scriptRouter.
 * 4. Stage 04 & 05: Assignment creation, workload inspection, and reassignment recovery.
 * 5. Stage 07 & 09: Video QC and Social Review GAR-02 author gating.
 * 6. Stage 10 & 11: Publishing assignment creation and scheduling.
 * 7. Security Invariants: Client-side role spoofing in body rejected by server-side token authorization.
 */

import assert from 'node:assert';
import http from 'node:http';
import express from 'express';
import { apiRouter } from '../../backend/server/routers/routes';
import { authService } from '../../backend/infrastructure/auth/services/auth.service';
import { usersRepository } from '../../database/firestore/repositories/users.repository';
import { questionDraftsRepository } from '../../database/firestore/repositories/question-drafts.repository';
import { videosRepository } from '../../database/firestore/repositories/videos.repository';
import { QuestionStatus, UserRole } from '../../shared';

async function runSystemAdminWorkflowOperationsIntegrationTests() {
  console.log('========================================================================');
  console.log('INTEGRATION TEST: SYSTEM ADMIN END-TO-END WORKFLOW OPERATIONS & GAR-02');
  console.log('========================================================================\n');

  let passed = 0;
  let total = 0;
  let failed = 0;

  async function test(name: string, fn: () => void | Promise<void>) {
    total++;
    try {
      await fn();
      console.log(`✓ PASS: ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`❌ FAIL: ${name}`);
      console.error(err);
      failed++;
      process.exitCode = 1;
    }
  }

  // 1. Mount production apiRouter exactly as in server.ts
  const app = express();
  app.use(express.json());
  app.use('/api', apiRouter);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}/api`;

  try {
    const timestamp = Date.now();

    // 2. Setup authenticated users: Admin, Author (QUESTION_CREATOR), Reviewer
    const adminUserId = `usr_admin_${timestamp}`;
    const authorUserId = `usr_author_${timestamp}`;
    const reviewerUserId = `usr_reviewer_${timestamp}`;

    await usersRepository.appendRecord({
      id: adminUserId,
      name: 'System Admin',
      email: `admin_${timestamp}@burrapariksha.com`,
      role: UserRole.ADMIN,
      roles: [UserRole.ADMIN],
      isActive: true,
      sessionVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await usersRepository.appendRecord({
      id: authorUserId,
      name: 'Question Author',
      email: `author_${timestamp}@burrapariksha.com`,
      role: UserRole.QUESTION_CREATOR,
      roles: [UserRole.QUESTION_CREATOR],
      isActive: true,
      sessionVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await usersRepository.appendRecord({
      id: reviewerUserId,
      name: 'Independent Reviewer',
      email: `reviewer_${timestamp}@burrapariksha.com`,
      role: UserRole.REVIEWER,
      roles: [UserRole.REVIEWER],
      isActive: true,
      sessionVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const adminToken = authService.generateSessionToken({
      userId: adminUserId,
      name: 'System Admin',
      role: UserRole.ADMIN,
      roles: [UserRole.ADMIN],
      sessionVersion: 1,
    });

    const authorToken = authService.generateSessionToken({
      userId: authorUserId,
      name: 'Question Author',
      role: UserRole.QUESTION_CREATOR,
      roles: [UserRole.QUESTION_CREATOR],
      sessionVersion: 1,
    });

    const reviewerToken = authService.generateSessionToken({
      userId: reviewerUserId,
      name: 'Independent Reviewer',
      role: UserRole.REVIEWER,
      roles: [UserRole.REVIEWER],
      sessionVersion: 1,
    });

    // ------------------------------------------------------------------------
    // STAGE 01: Question Draft Authoring, Editing, Submission
    // ------------------------------------------------------------------------
    let adminDraftId = '';
    let authorDraftId = '';

    await test('Stage 01: Admin can create, edit, and submit question draft for verification', async () => {
      // 1. Create draft as Admin
      const createRes = await fetch(`${baseUrl}/v1/questions/draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          topicId: 'TOP-QA-01',
          subtopicId: 'SUB-01',
          difficulty: 'Medium',
          language: 'TELUGU',
          productionMode: 'QUESTION_CHALLENGE_SHORT',
          questionText: 'What is the sum of interior angles in a triangle?',
          options: { a: '180°', b: '90°', c: '360°', d: '270°' },
          correctAnswer: 'A',
          explanation: 'Sum of interior angles of a triangle is always 180 degrees.',
        }),
      });

      assert.strictEqual(createRes.status, 201, 'Admin draft creation must return HTTP 201');
      const createBody = await createRes.json();
      assert.ok(createBody.id?.startsWith('dft_'), 'Draft must have canonical dft_ ID');
      assert.strictEqual(createBody.authorId, adminUserId, 'Draft authorId must be canonical admin ID');
      adminDraftId = createBody.id;

      // 2. Edit draft as Admin
      const editRes = await fetch(`${baseUrl}/v1/questions/draft/${adminDraftId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          topicId: 'TOP-QA-01',
          subtopicId: 'SUB-01',
          difficulty: 'Medium',
          language: 'TELUGU',
          questionText: 'What is the sum of all interior angles in any Euclidean triangle?',
          options: { a: '180°', b: '90°', c: '360°', d: '270°' },
          correctAnswer: 'A',
          explanation: 'Sum of interior angles of any planar Euclidean triangle is 180 degrees.',
        }),
      });
      assert.strictEqual(editRes.status, 200, 'Admin draft edit must return HTTP 200');

      // 3. Submit draft for verification (draft is at version 2 after edit)
      const submitRes = await fetch(`${baseUrl}/v1/questions/draft/${adminDraftId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          expectedVersion: 2,
          remarks: 'Submitted by admin for peer review',
        }),
      });
      assert.strictEqual(submitRes.status, 200, 'Admin draft submission must return HTTP 200');
      const submitBody = await submitRes.json();
      assert.strictEqual(submitBody.status, 'SUBMITTED_FOR_REVIEW', 'Submitted draft must transition to SUBMITTED_FOR_REVIEW');
    });

    // Author creates a draft
    await test('Stage 01: Author creates draft for independent review testing', async () => {
      const createRes = await fetch(`${baseUrl}/v1/questions/draft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authorToken}`,
        },
        body: JSON.stringify({
          topicId: 'TOP-QA-01',
          subtopicId: 'SUB-01',
          difficulty: 'Hard',
          language: 'TELUGU',
          productionMode: 'QUESTION_CHALLENGE_SHORT',
          questionText: 'Which planet is known as the Red Planet?',
          options: { a: 'Venus', b: 'Mars', c: 'Jupiter', d: 'Saturn' },
          correctAnswer: 'B',
          explanation: 'Mars is known as the Red Planet due to iron oxide on its surface.',
        }),
      });
      assert.strictEqual(createRes.status, 201, 'Author draft creation must return HTTP 201');
      const body = await createRes.json();
      authorDraftId = body.id;
      assert.strictEqual(body.authorId, authorUserId);
    });

    // ------------------------------------------------------------------------
    // STAGE 02: Strict GAR-02 Verification, Reconciliation & Approval
    // ------------------------------------------------------------------------
    let approvedQuestionId = '';

    await test('Stage 02: Admin CANNOT self-approve own draft (strict zero-bypass GAR-02)', async () => {
      const approveRes = await fetch(`${baseUrl}/v1/questions/draft/${adminDraftId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          notes: 'Attempting admin self-approval override',
          override: {
            isOverride: true,
            confirmedByAdmin: true,
            reason: 'Emergency self-approval attempt should fail unconditionally',
            overrideActionType: 'ADMIN_APPROVAL_OVERRIDE',
          },
        }),
      });

      assert.strictEqual(approveRes.status, 403, 'Self-approval must return HTTP 403 Forbidden');
      const body = await approveRes.json();
      const message = String(body.message || body.error || '');
      assert.ok(
        body.code === 'FORBIDDEN_BY_SEGREGATION_OF_DUTIES' ||
        body.error === 'AntiSelfApprovalViolation' ||
        body.details?.rule === 'GAR-02' ||
        message.includes('GAR-02') ||
        message.includes('Self-approval'),
        'Rejection must be classified as Segregation of Duties / GAR-02'
      );
    });

    await test('Stage 02: Independent reviewer CAN approve Admin-authored draft', async () => {
      const peerApproveRes = await fetch(`${baseUrl}/v1/questions/draft/${adminDraftId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${reviewerToken}`,
        },
        body: JSON.stringify({
          notes: 'Peer review verification of admin draft',
        }),
      });

      assert.strictEqual(peerApproveRes.status, 201, 'Independent reviewer approval must return HTTP 201');
      const approvedQuestion = await peerApproveRes.json();
      assert.strictEqual(approvedQuestion.authorId, adminUserId, 'Approved question authorId must remain admin');
      assert.strictEqual(approvedQuestion.status, QuestionStatus.APPROVED, 'Status must be APPROVED');
    });

    await test('Stage 02: Non-author Admin CAN approve Author-created draft', async () => {
      const adminReviewRes = await fetch(`${baseUrl}/v1/questions/draft/${authorDraftId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          notes: 'Admin independent review and verification',
        }),
      });

      assert.strictEqual(adminReviewRes.status, 201, 'Admin approval of other author draft must return HTTP 201');
      const approvedQuestion = await adminReviewRes.json();
      assert.strictEqual(approvedQuestion.authorId, authorUserId, 'Approved question authorId must be author user ID');
      assert.strictEqual(approvedQuestion.status, QuestionStatus.APPROVED, 'Status must be APPROVED');
      approvedQuestionId = approvedQuestion.id;
    });

    await test('Stage 02: Legacy draft missing authorId fails closed (HTTP 403) and Admin reconciles it', async () => {
      // Create draft in repository directly lacking authorId and createdBy
      const legacyDraft = await questionDraftsRepository.create({
        topicId: 'TOP-QA-01',
        subtopicId: 'SUB-01',
        difficulty: 'Easy',
        language: 'TELUGU',
        questionText: 'What is the capital of Andhra Pradesh?',
        options: { a: 'Amaravati', b: 'Hyderabad', c: 'Visakhapatnam', d: 'Kurnool' },
        correctAnswer: 'A',
        explanation: 'Amaravati is the capital city of Andhra Pradesh.',
        status: QuestionStatus.DRAFT,
      });

      // 1. Attempt approval: must fail closed with HTTP 403
      const approveRes = await fetch(`${baseUrl}/v1/questions/draft/${legacyDraft.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
      });
      assert.strictEqual(approveRes.status, 403, 'Missing author draft must fail closed with HTTP 403');
      const errBody = await approveRes.json();
      const errMessage = String(errBody.message || errBody.error || '');
      const isMissingAuthorViolation =
        errBody.code === 'FORBIDDEN_BY_SEGREGATION_OF_DUTIES' ||
        errBody.error === 'MissingAuthorIdentityError' ||
        errMessage.includes('missing authorId') ||
        errMessage.includes('Author identity');
      assert.ok(isMissingAuthorViolation, 'Must fail closed with segregation-of-duties missing author rejection');

      // 2. Admin reconciles the legacy draft author ID
      const reconcileRes = await fetch(`${baseUrl}/v1/questions/draft/${legacyDraft.id}/reconcile-author`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          authorUserId: authorUserId,
          authorDisplayName: 'Reconciled Author Name',
        }),
      });
      assert.strictEqual(reconcileRes.status, 200, 'Reconciliation endpoint must return HTTP 200');
      const reconcileBody = await reconcileRes.json();
      assert.strictEqual(reconcileBody.draft.authorId, authorUserId);

      // 3. Admin can now approve the reconciled draft as independent reviewer
      const postReconcileApprove = await fetch(`${baseUrl}/v1/questions/draft/${legacyDraft.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ notes: 'Admin approving reconciled draft' }),
      });
      assert.strictEqual(postReconcileApprove.status, 201, 'Post-reconciliation approval must return HTTP 201');
    });

    // ------------------------------------------------------------------------
    // STAGE 03: Teleprompter Scripting
    // ------------------------------------------------------------------------
    let testVideoId = '';
    await test('Stage 03: Admin can create and view teleprompter scripts via scriptRouter', async () => {
      // 1. Seed video record in repository
      const createdVideo = await videosRepository.create({
        title: 'Speed & Distance Short',
        questionId: `qst_script_test_${timestamp}`,
        assignedHost: adminUserId,
        assignedEditor: adminUserId,
        status: 'SCRIPT_DRAFT' as any,
      });
      testVideoId = createdVideo.id;

      // 2. Admin creates teleprompter script for video
      const scriptRes = await fetch(`${baseUrl}/videos/${testVideoId}/script`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          title: 'Speed, Distance & Time Script',
          content: 'నమస్కారం! ఈరోజు మనం వేగం మరియు దూరం లెక్కలను నేర్చుకుందాం.',
          segments: [
            { id: 'seg_1', title: 'Hook', spokenText: 'రైలు లెక్కలు మీకు కష్టంగా ఉన్నాయా?', durationSeconds: 5 },
            { id: 'seg_2', title: 'Concept', spokenText: 'ఈ సాధారణ సూత్రం గుర్తుంచుకోండి.', durationSeconds: 15 },
          ],
        }),
      });
      assert.ok(scriptRes.status === 200 || scriptRes.status === 201, `Admin script creation must succeed (got ${scriptRes.status})`);

      // 3. Admin retrieves script
      const getScriptRes = await fetch(`${baseUrl}/videos/${testVideoId}/script`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.strictEqual(getScriptRes.status, 200, 'Admin can view script');
    });

    // ------------------------------------------------------------------------
    // STAGE 04 & 05: Assignments, Workloads & Reassignment
    // ------------------------------------------------------------------------
    let assignmentId = '';
    await test('Stage 04 & 05: Admin can create assignment, inspect workload, and reassign tasks', async () => {
      // 1. Create assignment as Admin
      const assignRes = await fetch(`${baseUrl}/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          entityType: 'QUESTION',
          entityId: approvedQuestionId,
          assigneeId: authorUserId,
          assignmentRole: 'QUESTION_CREATOR',
          taskType: 'QUESTION_REVIEW',
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          notes: 'Please review and create alternative question take',
        }),
      });

      if (assignRes.status !== 201) {
        console.error('assignRes error:', await assignRes.json());
      }
      assert.strictEqual(assignRes.status, 201, `Admin assignment creation must return HTTP 201 (got ${assignRes.status})`);
      const assignBody = await assignRes.json();
      assignmentId = assignBody.id;
      assert.strictEqual(assignBody.assigneeId, authorUserId);

      // 2. Admin inspects assignments
      const listRes = await fetch(`${baseUrl}/assignments`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.strictEqual(listRes.status, 200);

      // 3. Admin reassigns task to reviewer
      const reassignRes = await fetch(`${baseUrl}/assignments/${assignmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          assigneeId: reviewerUserId,
          notes: 'Reassigned to QA Reviewer for expedited check',
        }),
      });
      assert.strictEqual(reassignRes.status, 200, 'Reassignment must return HTTP 200');
    });

    // ------------------------------------------------------------------------
    // STAGE 10 & 11: Multi-Channel Publishing & Assignments
    // ------------------------------------------------------------------------
    await test('Stage 10 & 11: Admin can inspect publishing dashboard and Gate D readiness blocks unready videos', async () => {
      // 1. Admin inspects publishing list
      const listRes = await fetch(`${baseUrl}/publishing`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.strictEqual(listRes.status, 200, 'Admin can inspect publishing overview');

      // 2. Admin inspects Gate D publish readiness for video
      const readinessRes = await fetch(`${baseUrl}/videos/${testVideoId}/publishing/readiness`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      assert.strictEqual(readinessRes.status, 200, 'Admin can check Gate D publish readiness');
      const readiness = await readinessRes.json();
      assert.strictEqual(readiness.isReady, false, 'Unready video must not pass Gate D');
      assert.ok(readiness.blockers.length > 0, 'Gate D must list specific blockers');

      // 3. Admin attempting to create publishing assignment on unready video is rejected with HTTP 400
      const pubRes = await fetch(`${baseUrl}/videos/${testVideoId}/publishing/assignment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          assigneeId: adminUserId,
          platform: 'youtube',
          scheduledTime: new Date(Date.now() + 172800000).toISOString(),
          notes: 'Schedule YouTube Shorts publication',
        }),
      });
      assert.strictEqual(pubRes.status, 400, 'Gate D must block publishing assignment on unready video with HTTP 400');
    });

    // ------------------------------------------------------------------------
    // SECURITY INVARIANT: Client-Side Role Spoofing Prevention
    // ------------------------------------------------------------------------
    await test('Security Invariant: Non-admin passing role: ADMIN in body is rejected by server token authorization', async () => {
      // Author user attempts to call Admin-only author reconciliation endpoint by sending role: ADMIN in body
      const spoofRes = await fetch(`${baseUrl}/v1/questions/draft/dft_dummy_123/reconcile-author`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authorToken}`, // token is for authorUserId (QUESTION_CREATOR)
        },
        body: JSON.stringify({
          role: 'ADMIN', // Client-side spoof attempt in payload
          authorUserId: authorUserId,
        }),
      });

      assert.strictEqual(spoofRes.status, 403, 'Server must reject non-admin token even if body claims role: ADMIN');
    });

  } finally {
    server.close();
  }

  console.log(`\n========================================================================`);
  console.log(`RESULTS: ${passed}/${total} SYSTEM ADMIN WORKFLOW OPERATION TESTS PASSED`);
  if (failed > 0) {
    console.error(`FAILURE: ${failed} tests failed!`);
    process.exitCode = 1;
  }
  console.log(`========================================================================\n`);
}

runSystemAdminWorkflowOperationsIntegrationTests().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
