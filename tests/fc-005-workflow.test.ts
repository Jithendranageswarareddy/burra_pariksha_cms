/**
 * BURRA PARIKSHA CMS — Stage 27 Implementation Verification
 * Feature Contract: FC-005 Canonical 15-Step Workflow State Machine
 *
 * Test Suite: TC-WF-01 through TC-WF-05 plus comprehensive guard rail tests:
 * - TC-WF-01: Deterministic sequential N -> N+1 progression (Stages 01 through 15)
 * - TC-WF-02: Illegal transitions (e.g. forward jump 1 -> 5) rejected with HTTP 422
 * - TC-WF-03: Rejection transitions route back to designated revision step
 * - TC-WF-04: Five state dimensions operate orthogonally without cross-conflation
 * - TC-WF-05: Persistence, API envelopes, OCC concurrency, GAR-02, audit & realtime integration
 */

import assert from 'node:assert';
import http from 'node:http';
import express from 'express';
import { apiRouter } from '../src/server/routes';
import { authService } from '../src/lib/services/auth.service';
import { usersRepository } from '../src/lib/repositories/users.repository';
import { workflowService, workflowEngine } from '../src/lib/workflow';
import { realtimeEventBus } from '../src/lib/realtime/event-bus';
import { auditDispatcher } from '../src/lib/audit';
import {
  CANONICAL_WORKFLOW_STEPS,
  WorkflowInstanceDocument,
  WorkflowHistoryEntry,
} from '../src/types/workflow';
import { assertStateDimensionsDecoupled } from '../src/types/state-models';
import { ConcurrencyConflictError, InvalidWorkflowTransitionError, ForbiddenError } from '../src/lib/errors';

async function runTests() {
  console.log('============================================================');
  console.log('STAGE 27 — FC-005 WORKFLOW STATE ENGINE TEST SUITE');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  // Set up Express test application mounting apiRouter
  const app = express();
  app.use(express.json());
  app.use('/api', apiRouter);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}/api`;

  // Seed test users with required roles
  const creatorUser = {
    id: 'USR-CREATOR-01',
    email: 'creator@burrapariksha.test',
    name: 'Suresh Creator',
    role: 'QUESTION_AUTHOR',
    roles: ['QUESTION_AUTHOR'],
    isActive: true,
    sessionVersion: 1,
  };
  const reviewerUser = {
    id: 'USR-REVIEWER-01',
    email: 'reviewer@burrapariksha.test',
    name: 'Ramesh QA SME',
    role: 'QA_REVIEWER',
    roles: ['QA_REVIEWER'],
    isActive: true,
    sessionVersion: 1,
  };
  const editorUser = {
    id: 'USR-EDITOR-01',
    email: 'editor@burrapariksha.test',
    name: 'Vikram Editor',
    role: 'VIDEO_EDITOR',
    roles: ['VIDEO_EDITOR'],
    isActive: true,
    sessionVersion: 1,
  };
  const leadUser = {
    id: 'USR-LEAD-01',
    email: 'lead@burrapariksha.test',
    name: 'Anitha Content Lead',
    role: 'CONTENT_LEAD',
    roles: ['CONTENT_LEAD'],
    isActive: true,
    sessionVersion: 1,
  };
  const publisherUser = {
    id: 'USR-PUB-01',
    email: 'publisher@burrapariksha.test',
    name: 'Priya Publisher',
    role: 'PUBLISHING_LEAD',
    roles: ['PUBLISHING_LEAD'],
    isActive: true,
    sessionVersion: 1,
  };
  const analystUser = {
    id: 'USR-ANALYST-01',
    email: 'analyst@burrapariksha.test',
    name: 'Kiran Analyst',
    role: 'ANALYST',
    roles: ['ANALYST'],
    isActive: true,
    sessionVersion: 1,
  };
  const adminUser = {
    id: 'USR-ADMIN-01',
    email: 'admin@burrapariksha.test',
    name: 'Executive Producer Admin',
    role: 'ADMIN',
    roles: ['ADMIN'],
    isActive: true,
    sessionVersion: 1,
  };

  // Seed user sessions into usersRepository in-memory cache
  [creatorUser, reviewerUser, editorUser, leadUser, publisherUser, analystUser, adminUser].forEach((u) => {
    (usersRepository as any).sessionCache?.set(u.id, {
      userId: u.id,
      role: u.role,
      roles: u.roles,
      sessionVersion: u.sessionVersion,
      isActive: u.isActive,
    });
  });

  const creatorToken = authService.generateSessionToken({
    userId: creatorUser.id,
    role: creatorUser.role,
    name: creatorUser.name,
    sessionVersion: 1,
  });

  const reviewerToken = authService.generateSessionToken({
    userId: reviewerUser.id,
    role: reviewerUser.role,
    name: reviewerUser.name,
    sessionVersion: 1,
  });

  const editorToken = authService.generateSessionToken({
    userId: editorUser.id,
    role: editorUser.role,
    name: editorUser.name,
    sessionVersion: 1,
  });

  const leadToken = authService.generateSessionToken({
    userId: leadUser.id,
    role: leadUser.role,
    name: leadUser.name,
    sessionVersion: 1,
  });

  const publisherToken = authService.generateSessionToken({
    userId: publisherUser.id,
    role: publisherUser.role,
    name: publisherUser.name,
    sessionVersion: 1,
  });

  const analystToken = authService.generateSessionToken({
    userId: analystUser.id,
    role: analystUser.role,
    name: analystUser.name,
    sessionVersion: 1,
  });

  const adminToken = authService.generateSessionToken({
    userId: adminUser.id,
    role: adminUser.role,
    name: adminUser.name,
    sessionVersion: 1,
  });

  try {
    // --------------------------------------------------------------------------
    // TC-WF-01: Deterministic Sequential Progression N -> N+1 (Steps 01 through 15)
    // --------------------------------------------------------------------------
    try {
      // 1. Initialize a workflow instance at Step 01
      const instance = await workflowService.createInstance(
        {
          entityType: 'QUESTION',
          entityId: 'qst_seq_test_001',
          currentStep: 1,
          authorId: creatorUser.id,
          contentStatus: 'DRAFT',
          mediaStatus: 'NOT_REQUIRED',
          publicationStatus: 'UNPUBLISHED',
          jobStatus: 'IDLE',
        },
        creatorUser
      );

      assert.strictEqual(instance.currentStep, 1, 'Initial step must be 1');
      assert.strictEqual(instance.version, 1, 'Initial version must be 1');
      assert.strictEqual(instance.contentStatus, 'DRAFT');

      // 2. Step 01 -> Step 02 (QUESTION_SUBMIT by creator)
      const res01 = await workflowService.transition(
        instance.id,
        {
          targetStep: 2,
          action: 'QUESTION_SUBMIT',
          reason: 'Question draft finalized with Telugu distraction options and proof',
          expectedVersion: 1,
        },
        creatorUser
      );
      assert.strictEqual(res01.workflow.currentStep, 2);
      assert.strictEqual(res01.workflow.contentStatus, 'IN_REVIEW');
      assert.strictEqual(res01.workflow.version, 2);

      // 3. Step 02 -> Step 03 (QUESTION_VERIFY by independent QA Reviewer - GAR-02 passes)
      const res02 = await workflowService.transition(
        instance.id,
        {
          targetStep: 3,
          action: 'QUESTION_VERIFY',
          reason: '10-point pedagogical audit passed',
          expectedVersion: 2,
        },
        reviewerUser
      );
      assert.strictEqual(res02.workflow.currentStep, 3);
      assert.strictEqual(res02.workflow.contentStatus, 'APPROVED');
      assert.strictEqual(res02.workflow.version, 3);

      // 4. Step 03 -> Step 04 (SCRIPT_SUBMIT by Admin / Lead)
      const res03 = await workflowService.transition(
        instance.id,
        {
          targetStep: 4,
          action: 'SCRIPT_SUBMIT',
          reason: 'Presenter script locked with 3-second hook',
          expectedVersion: 3,
        },
        leadUser
      );
      assert.strictEqual(res03.workflow.currentStep, 4);
      assert.strictEqual(res03.workflow.version, 4);

      // 5. Step 04 -> Step 05 (FILMING_COMPLETE)
      const res04 = await workflowService.transition(
        instance.id,
        {
          targetStep: 5,
          action: 'FILMING_COMPLETE',
          reason: 'Golden take captured',
          expectedVersion: 4,
        },
        adminUser
      );
      assert.strictEqual(res04.workflow.currentStep, 5);
      assert.strictEqual(res04.workflow.mediaStatus, 'PENDING_UPLOAD');
      assert.strictEqual(res04.workflow.version, 5);

      // 6. Step 05 -> Step 06 (VIDEO_INGEST)
      const res05 = await workflowService.transition(
        instance.id,
        {
          targetStep: 6,
          action: 'VIDEO_INGEST',
          reason: 'Raw footage streamed to Drive',
          expectedVersion: 5,
        },
        adminUser
      );
      assert.strictEqual(res05.workflow.currentStep, 6);
      assert.strictEqual(res05.workflow.mediaStatus, 'READY');
      assert.strictEqual(res05.workflow.version, 6);

      // 7. Step 06 -> Step 07 (VIDEO_EDIT_COMPLETE by editor)
      const res06 = await workflowService.transition(
        instance.id,
        {
          targetStep: 7,
          action: 'VIDEO_EDIT_COMPLETE',
          reason: 'Master cut exported with subtitles',
          expectedVersion: 6,
        },
        editorUser
      );
      assert.strictEqual(res06.workflow.currentStep, 7);
      assert.strictEqual(res06.workflow.contentStatus, 'IN_REVIEW');
      assert.strictEqual(res06.workflow.version, 7);

      // 8. Step 07 -> Step 08 (VIDEO_QC_VERIFY by Content Lead - GAR-02 passes)
      const res07 = await workflowService.transition(
        instance.id,
        {
          targetStep: 8,
          action: 'VIDEO_QC_VERIFY',
          reason: '6-point Master QC certified',
          expectedVersion: 7,
        },
        leadUser
      );
      assert.strictEqual(res07.workflow.currentStep, 8);
      assert.strictEqual(res07.workflow.contentStatus, 'APPROVED');
      assert.strictEqual(res07.workflow.version, 8);

      // 9. Step 08 -> Step 09 (THUMBNAIL_APPROVE)
      const res08 = await workflowService.transition(
        instance.id,
        {
          targetStep: 9,
          action: 'THUMBNAIL_APPROVE',
          reason: 'Curiosity thumbnail approved',
          expectedVersion: 8,
        },
        adminUser
      );
      assert.strictEqual(res08.workflow.currentStep, 9);
      assert.strictEqual(res08.workflow.version, 9);

      // 10. Step 09 -> Step 10 (SOCIAL_REVIEW_APPROVE by Publisher - GAR-02 passes)
      const res09 = await workflowService.transition(
        instance.id,
        {
          targetStep: 10,
          action: 'SOCIAL_REVIEW_APPROVE',
          reason: 'Smartphone safe-zone simulator verified',
          expectedVersion: 9,
        },
        publisherUser
      );
      assert.strictEqual(res09.workflow.currentStep, 10);
      assert.strictEqual(res09.workflow.publicationStatus, 'UNPUBLISHED');
      assert.strictEqual(res09.workflow.version, 10);

      // 11. Step 10 -> Step 11 (PUBLISH_SCHEDULE)
      const res10 = await workflowService.transition(
        instance.id,
        {
          targetStep: 11,
          action: 'PUBLISH_SCHEDULE',
          reason: 'Release scheduled for evening slot',
          expectedVersion: 10,
        },
        publisherUser
      );
      assert.strictEqual(res10.workflow.currentStep, 11);
      assert.strictEqual(res10.workflow.publicationStatus, 'SCHEDULED');
      assert.strictEqual(res10.workflow.version, 11);

      // 12. Step 11 -> Step 12 (PUBLISH_EXECUTE)
      const res11 = await workflowService.transition(
        instance.id,
        {
          targetStep: 12,
          action: 'PUBLISH_EXECUTE',
          reason: 'YouTube Shorts live ID confirmed',
          expectedVersion: 11,
        },
        publisherUser
      );
      assert.strictEqual(res11.workflow.currentStep, 12);
      assert.strictEqual(res11.workflow.publicationStatus, 'LIVE');
      assert.strictEqual(res11.workflow.version, 12);

      // 13. Step 12 -> Step 13 (PLATFORM_SYNC)
      const res12 = await workflowService.transition(
        instance.id,
        {
          targetStep: 13,
          action: 'PLATFORM_SYNC',
          reason: 'Metadata and pinned comments synced',
          expectedVersion: 12,
        },
        publisherUser
      );
      assert.strictEqual(res12.workflow.currentStep, 13);
      assert.strictEqual(res12.workflow.publicationStatus, 'SYNCED');
      assert.strictEqual(res12.workflow.version, 13);

      // 14. Step 13 -> Step 14 (ANALYTICS_INGEST by Analyst)
      const res13 = await workflowService.transition(
        instance.id,
        {
          targetStep: 14,
          action: 'ANALYTICS_INGEST',
          reason: '24h retention telemetry ingested',
          expectedVersion: 13,
        },
        analystUser
      );
      assert.strictEqual(res13.workflow.currentStep, 14);
      assert.strictEqual(res13.workflow.version, 14);

      // 15. Step 14 -> Step 15 (PERFORMANCE_INDEX by Lead)
      const res14 = await workflowService.transition(
        instance.id,
        {
          targetStep: 15,
          action: 'PERFORMANCE_INDEX',
          reason: 'Retention drop-off diagnostic compiled',
          expectedVersion: 14,
        },
        leadUser
      );
      assert.strictEqual(res14.workflow.currentStep, 15);
      assert.strictEqual(res14.workflow.version, 15);

      // 16. Step 15 -> 15 Terminal (INTELLIGENCE_LOOP_FEED)
      const res15 = await workflowService.transition(
        instance.id,
        {
          targetStep: 15,
          action: 'INTELLIGENCE_LOOP_FEED',
          reason: 'Curriculum directive approved; workflow completed',
          expectedVersion: 15,
        },
        adminUser
      );
      assert.strictEqual(res15.workflow.currentStep, 15);
      assert.strictEqual(res15.workflow.contentStatus, 'ARCHIVED');
      assert.strictEqual(res15.workflow.publicationStatus, 'SYNCED');
      assert.strictEqual(res15.workflow.jobStatus, 'COMPLETED');
      assert.strictEqual(res15.workflow.version, 16);

      console.log('✓ TC-WF-01 PASSED: Deterministic N -> N+1 sequential transition verified across all 15 stages.');
      passed++;
    } catch (err: any) {
      console.error('✗ TC-WF-01 FAILED:', err.message);
      failed++;
    }

    // --------------------------------------------------------------------------
    // TC-WF-02: Illegal Transitions (e.g. forward jump 1 -> 5) Strictly Rejected
    // --------------------------------------------------------------------------
    try {
      const inst = await workflowService.createInstance(
        {
          entityType: 'QUESTION',
          entityId: 'qst_illegal_jump_001',
          currentStep: 1,
          authorId: creatorUser.id,
        },
        creatorUser
      );

      // 1. Attempt non-sequential forward jump: Step 1 -> Step 5 directly
      let caughtIllegalJump = false;
      try {
        await workflowService.transition(
          inst.id,
          {
            targetStep: 5,
            action: 'FILMING_COMPLETE',
            expectedVersion: 1,
          },
          adminUser
        );
      } catch (err: any) {
        if (err instanceof InvalidWorkflowTransitionError && err.statusCode === 422) {
          caughtIllegalJump = true;
        }
      }
      assert.strictEqual(
        caughtIllegalJump,
        true,
        'Jumping from Step 01 to Step 05 directly must be rejected with HTTP 422 InvalidWorkflowTransitionError.'
      );

      // 2. HTTP Endpoint test for illegal jump
      const httpRes = await fetch(`${baseUrl}/v1/workflow/${inst.id}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          targetStep: 7,
          action: 'VIDEO_EDIT_COMPLETE',
          expectedVersion: 1,
        }),
      });

      assert.strictEqual(httpRes.status, 422, 'HTTP illegal jump must return 422');
      const body = await httpRes.json();
      assert.strictEqual(body.success, false);
      assert.strictEqual(body.error.code, 'INVALID_WORKFLOW_TRANSITION');

      console.log('✓ TC-WF-02 PASSED: Illegal forward jump (1 -> 5, 1 -> 7) rejected with HTTP 422.');
      passed++;
    } catch (err: any) {
      console.error('✗ TC-WF-02 FAILED:', err.message);
      failed++;
    }

    // --------------------------------------------------------------------------
    // TC-WF-03: Rejection Transitions Return to Designated Revision Step
    // --------------------------------------------------------------------------
    try {
      const inst = await workflowService.createInstance(
        {
          entityType: 'QUESTION',
          entityId: 'qst_rejection_test_001',
          currentStep: 1,
          authorId: creatorUser.id,
        },
        creatorUser
      );

      // Advance to Step 02
      await workflowService.transition(
        inst.id,
        {
          targetStep: 2,
          action: 'QUESTION_SUBMIT',
          expectedVersion: 1,
        },
        creatorUser
      );

      // SME in Step 02 rejects question with revision remarks -> returns to Step 01
      const rework = await workflowService.transition(
        inst.id,
        {
          targetStep: 1,
          action: 'QUESTION_REQUEST_CHANGES',
          reason: 'Ambiguous distractors in Option B and C; revise Telugu translation.',
          expectedVersion: 2,
        },
        reviewerUser
      );

      assert.strictEqual(rework.workflow.currentStep, 1, 'Rejection must route back to Step 01');
      assert.strictEqual(rework.workflow.contentStatus, 'DRAFT', 'Content status must return to DRAFT');
      assert.strictEqual(rework.historyEntry.fromStep, 2);
      assert.strictEqual(rework.historyEntry.toStep, 1);
      assert.strictEqual(
        rework.historyEntry.reason,
        'Ambiguous distractors in Option B and C; revise Telugu translation.'
      );

      console.log('✓ TC-WF-03 PASSED: Rejection routing returns item to designated authoring step with audit trail.');
      passed++;
    } catch (err: any) {
      console.error('✗ TC-WF-03 FAILED:', err.message);
      failed++;
    }

    // --------------------------------------------------------------------------
    // TC-WF-04: Five State Dimensions Remain Orthogonal
    // --------------------------------------------------------------------------
    try {
      // 1. Verify mathematical decoupling assertion
      const decoupled = assertStateDimensionsDecoupled();
      assert.strictEqual(decoupled, true, 'State dimensions must be strictly decoupled');

      // 2. Operational test: Mutating media status does NOT corrupt content or publication status
      const inst = await workflowService.createInstance(
        {
          entityType: 'VIDEO',
          entityId: 'vid_dim_test_001',
          currentStep: 4,
          authorId: creatorUser.id,
          contentStatus: 'APPROVED',
          mediaStatus: 'NOT_REQUIRED',
          publicationStatus: 'UNPUBLISHED',
          jobStatus: 'IDLE',
        },
        adminUser
      );

      const res = await workflowService.transition(
        inst.id,
        {
          targetStep: 5,
          action: 'FILMING_COMPLETE',
          expectedVersion: 1,
        },
        adminUser
      );

      // Step changed from 4 to 5, mediaStatus changed to PENDING_UPLOAD,
      // but contentStatus remains APPROVED and publicationStatus remains UNPUBLISHED!
      assert.strictEqual(res.workflow.currentStep, 5);
      assert.strictEqual(res.workflow.mediaStatus, 'PENDING_UPLOAD');
      assert.strictEqual(res.workflow.contentStatus, 'APPROVED', 'contentStatus must not be overwritten');
      assert.strictEqual(res.workflow.publicationStatus, 'UNPUBLISHED', 'publicationStatus must not be overwritten');
      assert.strictEqual(res.workflow.jobStatus, 'IDLE', 'jobStatus must remain IDLE');

      console.log('✓ TC-WF-04 PASSED: Five decoupled state dimensions operate orthogonally without cross-corruption.');
      passed++;
    } catch (err: any) {
      console.error('✗ TC-WF-04 FAILED:', err.message);
      failed++;
    }

    // --------------------------------------------------------------------------
    // TC-WF-05: API Endpoints, OCC Versioning, GAR-02 & Realtime Verification
    // --------------------------------------------------------------------------
    try {
      // 1. Unauthenticated Request -> HTTP 401
      const unauthRes = await fetch(`${baseUrl}/v1/workflow/wfl_dummy_001/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetStep: 2, action: 'QUESTION_SUBMIT', expectedVersion: 1 }),
      });
      assert.strictEqual(unauthRes.status, 401, 'Unauthenticated request must return 401');

      // 2. Create Instance via API
      const createRes = await fetch(`${baseUrl}/v1/workflow/instances`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${creatorToken}`,
        },
        body: JSON.stringify({
          entityType: 'QUESTION',
          entityId: 'qst_api_test_001',
          currentStep: 1,
          authorId: creatorUser.id,
        }),
      });
      assert.strictEqual(createRes.status, 201, 'POST /workflow/instances must return 201');
      const createBody = await createRes.json();
      assert.strictEqual(createBody.success, true);
      const wflId = createBody.data.workflow.id;
      assert.strictEqual(createBody.data.workflow.version, 1);

      // 3. Setup realtime listener for workflow.step_transitioned
      let realtimeEventReceived: any = null;
      const unsubscribeRealtime = realtimeEventBus.subscribe('workflow.step_transitioned', (payload) => {
        realtimeEventReceived = payload;
      });

      // 4. Advance Step 1 -> Step 2 via API
      const trans1Res = await fetch(`${baseUrl}/v1/workflow/${wflId}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${creatorToken}`,
        },
        body: JSON.stringify({
          targetStep: 2,
          action: 'QUESTION_SUBMIT',
          reason: 'Ready for verification',
          expectedVersion: 1,
        }),
      });
      assert.strictEqual(trans1Res.status, 200, 'Valid transition must return HTTP 200');
      const trans1Body = await trans1Res.json();
      assert.strictEqual(trans1Body.success, true);
      assert.strictEqual(trans1Body.data.workflow.currentStep, 2);
      assert.strictEqual(trans1Body.data.workflow.version, 2);

      // Verify Realtime event was broadcasted
      assert(realtimeEventReceived !== null, 'Realtime event must be emitted');
      assert.strictEqual(realtimeEventReceived.workflowId, wflId);
      assert.strictEqual(realtimeEventReceived.toStep, 2);
      unsubscribeRealtime();

      // 5. GAR-02 Anti-Self-Approval Verification:
      // Creator attempts to verify/approve their own question at Step 02 -> HTTP 403 FORBIDDEN
      const selfApprovalRes = await fetch(`${baseUrl}/v1/workflow/${wflId}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${creatorToken}`,
        },
        body: JSON.stringify({
          targetStep: 3,
          action: 'QUESTION_VERIFY',
          reason: 'Author trying to self-approve',
          expectedVersion: 2,
        }),
      });
      assert.strictEqual(
        selfApprovalRes.status,
        403,
        'Author attempting to approve own work at Step 02 must return HTTP 403 under GAR-02.'
      );
      const selfApprovalBody = await selfApprovalRes.json();
      assert.strictEqual(selfApprovalBody.success, false);
      assert.strictEqual(selfApprovalBody.error.code, 'FORBIDDEN_BY_SEGREGATION_OF_DUTIES');

      // 6. Optimistic Concurrency Control (OCC) Verification:
      // Client passes stale expectedVersion = 1 (current is 2) -> HTTP 409 CONFLICT
      const staleRes = await fetch(`${baseUrl}/v1/workflow/${wflId}/transition`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${reviewerToken}`,
        },
        body: JSON.stringify({
          targetStep: 3,
          action: 'QUESTION_VERIFY',
          reason: 'SME Approval',
          expectedVersion: 1, // Stale version! Current is 2
        }),
      });
      assert.strictEqual(staleRes.status, 409, 'Stale expectedVersion must return HTTP 409');
      const staleBody = await staleRes.json();
      assert.strictEqual(staleBody.success, false);
      assert.strictEqual(staleBody.error.code, 'CONCURRENCY_CONFLICT');

      // 7. Concurrent Transitions: Parallel requests with the same expectedVersion
      // Exactly ONE request must succeed; the other must receive HTTP 409 CONFLICT
      const [attemptA, attemptB] = await Promise.all([
        fetch(`${baseUrl}/v1/workflow/${wflId}/transition`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${reviewerToken}`,
          },
          body: JSON.stringify({
            targetStep: 3,
            action: 'QUESTION_VERIFY',
            reason: 'Concurrent Attempt A',
            expectedVersion: 2,
          }),
        }),
        fetch(`${baseUrl}/v1/workflow/${wflId}/transition`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${reviewerToken}`,
          },
          body: JSON.stringify({
            targetStep: 3,
            action: 'QUESTION_VERIFY',
            reason: 'Concurrent Attempt B',
            expectedVersion: 2,
          }),
        }),
      ]);

      const statuses = [attemptA.status, attemptB.status].sort();
      assert.deepStrictEqual(
        statuses,
        [200, 409],
        'Under parallel concurrency, exactly one request must succeed (200) and the other receive conflict (409).'
      );

      // 8. Retrieve History via GET /api/v1/workflow/:id/history
      const historyRes = await fetch(`${baseUrl}/v1/workflow/${wflId}/history`, {
        headers: { Authorization: `Bearer ${reviewerToken}` },
      });
      assert.strictEqual(historyRes.status, 200, 'GET /workflow/:id/history must return 200');
      const historyBody = await historyRes.json();
      assert.strictEqual(historyBody.success, true);
      assert(Array.isArray(historyBody.data.history), 'History must be an array');
      assert(historyBody.data.history.length >= 3, 'History must contain initialization and transitions');

      // 9. Fetch Workflow Details via GET /api/v1/workflow/:id
      const detailRes = await fetch(`${baseUrl}/v1/workflow/${wflId}`, {
        headers: { Authorization: `Bearer ${reviewerToken}` },
      });
      assert.strictEqual(detailRes.status, 200, 'GET /workflow/:id must return 200');
      const detailBody = await detailRes.json();
      assert.strictEqual(detailBody.data.workflow.currentStep, 3);
      assert(Array.isArray(detailBody.data.validTargets), 'validTargets must be populated');

      console.log('✓ TC-WF-05 PASSED: Persistence, OCC concurrency, GAR-02, audit and realtime integration verified.');
      passed++;
    } catch (err: any) {
      console.error('✗ TC-WF-05 FAILED:', err.message);
      failed++;
    }
  } finally {
    server.close();
  }

  console.log('\n============================================================');
  console.log(`FC-005 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================\n');
  process.exit(failed > 0 ? 1 : 0);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Unhandled test suite error:', err);
  process.exit(1);
});
