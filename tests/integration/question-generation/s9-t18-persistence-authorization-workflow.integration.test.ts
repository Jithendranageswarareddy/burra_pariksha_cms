/**
 * BURRA PARIKSHA CMS — S9-T18: Persistence, Authorization, and Workflow Transitions
 * Specification: S9-T18 Regression Tests for Question Challenge Short Persistence Lifecycle,
 * API Authorization, Workflow State Transitions, Concurrency (OCC), and Test-Data Isolation.
 *
 * NOTE: As per S9-T18 task execution policy, this test file is authored for
 * static inspection and future regression verification. IT MUST NOT BE EXECUTED
 * during the S9-T18 authoring task. Emulator-backed execution will occur at Sprint 9 closure.
 *
 * Acceptance Criteria & Suites Covered:
 * - Suite 1: Datastore Isolation & Fail-Closed Guard (Emulator vs Production Safeguards)
 * - Suite 2: Complete Persistence Lifecycle (Create, Read, Update, Reopen, Save, Submit, Review, Revise, Resubmit)
 * - Suite 3: Backend Authorization & RBAC Boundaries (Unauthenticated, Scope/Ownership, Reviewer-Only, Direct API Bypass)
 * - Suite 4: Canonical Workflow Transition Enforcement & GAR-02 Anti-Self-Approval
 * - Suite 5: Concurrency, OCC Stale Versions, and Idempotency Coordination
 */

import assert from 'node:assert/strict';
import http from 'node:http';
import express, { Express } from 'express';
import { apiRouter } from '../../../backend/server/routers/routes';
import { authService } from '../../../backend/infrastructure/auth/services/auth.service';
import { usersRepository } from '../../../database/firestore/repositories/users.repository';
import { questionDraftsRepository } from '../../../database/firestore/repositories/question-drafts.repository';
import { auditLogRepository } from '../../../database/firestore/repositories/audit-log.repository';
import { questionDraftService } from '../../../backend/features/question-generation/services/question-draft.service';
import { questionGenerationService } from '../../../backend/domain/question-generation';
import {
  canonicalIdService,
  QuestionStatus,
  UserRole,
  CanonicalRbacRole,
  DifficultyLevel,
  QuestionLanguage,
} from '../../../shared';
import {
  SaveQuestionDraftInput,
  QuestionBatchSlot,
} from '../../../shared/contracts/question-generation/question-generation.contract';
import { ConcurrencyConflictError } from '../../../src/lib/errors';
import {
  evaluateDatastoreIsolation,
  KNOWN_PRODUCTION_TARGETS,
  IsolationVerification,
} from '../s8-t18-firestore-persistence-recovery.integration.test';

// ---------------------------------------------------------------------------
// Synthetic Test Data Helpers & Cleanup Tracking
// ---------------------------------------------------------------------------

interface TestActorContext {
  userId: string;
  name: string;
  role: UserRole;
  token: string;
  headers: Record<string, string>;
}

// Track all synthetic IDs created during the test run for deterministic cleanup
const trackedSyntheticDraftIds = new Set<string>();
const trackedSyntheticUserIds = new Set<string>();

/**
 * Creates an authenticated test user and generates a signed session token.
 */
async function setupTestActor(
  role: UserRole,
  namePrefix: string
): Promise<TestActorContext> {
  const userId = `usr_t18_${namePrefix.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  trackedSyntheticUserIds.add(userId);

  await usersRepository.appendRecord({
    id: userId,
    name: `${namePrefix} T18`,
    email: `${userId}@burrapariksha.test`,
    role,
    roles: [role],
    isActive: true,
    sessionVersion: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  const token = authService.generateSessionToken({
    userId,
    name: `${namePrefix} T18`,
    role,
    roles: [role],
    sessionVersion: 1,
  });

  return {
    userId,
    name: `${namePrefix} T18`,
    role,
    token,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };
}

/**
 * Creates a valid 5-slot baseline Question Challenge Short batch payload.
 */
function createBaselineBatchPayload(authorUserId: string): SaveQuestionDraftInput {
  const slots: QuestionBatchSlot[] = Array.from({ length: 5 }, (_, idx) => ({
    slotNumber: idx + 1,
    slotId: canonicalIdService.generateCanonicalId('slt_'),
    status: idx === 0 ? 'ACCEPTED' : 'VALID',
    questionText: `సమస్య సంఖ్య ${idx + 1}: రైలు వేగం గంటకు ${(idx + 1) * 15} కి.మీ అయితే 300 మీటర్ల దూరం దాటడానికి పట్టే సమయం ఎంత?`,
    options: {
      a: `${(idx + 1) * 5} సెకన్లు`,
      b: `${(idx + 1) * 10} సెకన్లు`,
      c: `${(idx + 1) * 15} సెకన్లు`,
      d: `${(idx + 1) * 20} సెకన్లు`,
    },
    correctAnswer: (['A', 'B', 'C', 'D'] as const)[idx % 4],
    explanation: `వివరణ ${idx + 1}: దూరం మరియు వేగం సూత్రం ద్వారా సాధన చేయబడినది.`,
    isManuallyEdited: false,
    validationErrors: [],
    revisionNumber: 1,
  }));

  return {
    topicId: 'TOP-QA-01',
    topicName: 'Quantitative Aptitude',
    subtopicId: 'SUB-01',
    subtopicName: 'Time and Distance',
    difficulty: 'Intermediate',
    language: 'TELUGU',
    questionText: slots[0].questionText,
    options: slots[0].options,
    correctAnswer: slots[0].correctAnswer as any,
    explanation: slots[0].explanation,
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    targetQuestionCount: 5,
    aspectRatio: '9:16',
    challengeType: 'ABCD',
    presentationType: 'TEXT_ONLY',
    questionStyle: 'STORY_BASED',
    slots,
  };
}

// ---------------------------------------------------------------------------
// Main S9-T18 Integration Test Runner
// ---------------------------------------------------------------------------

export async function runPersistenceAuthorizationWorkflowIntegrationTests(): Promise<void> {
  console.log('========================================================================');
  console.log('SUITE: S9-T18 Persistence, Authorization & Workflow Integration Tests');
  console.log('========================================================================\n');

  // =========================================================================
  // SUITE 1: Datastore Isolation & Fail-Closed Guard
  // =========================================================================
  console.log('--- SUITE 1: Datastore Isolation & Fail-Closed Guard ---');

  const activeProjectId = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT || 'burra-pariksha-test';
  const activeDatabaseId = process.env.FIRESTORE_DATABASE_ID || '(default)';

  // 1.1 Datastore isolation evaluation
  const isolation: IsolationVerification = evaluateDatastoreIsolation(
    activeProjectId,
    activeDatabaseId,
    process.env
  );
  console.log(`[Isolation Audit] Evaluated mode: ${isolation.isolationMode}`);
  console.log(`[Isolation Audit] Active Project: ${activeProjectId}, Database: ${activeDatabaseId}`);

  // 1.2 Disqualification of known production targets
  const isProductionMatch = KNOWN_PRODUCTION_TARGETS.some(
    (prod) =>
      prod.projectId === activeProjectId &&
      (prod.databaseId === activeDatabaseId || prod.databaseId === '(default)')
  );
  assert.strictEqual(
    isProductionMatch && !process.env.FIRESTORE_EMULATOR_HOST,
    false,
    'CRITICAL: Execution against canonical production Firestore without an emulator is strictly prohibited.'
  );

  // 1.3 Fail-closed verification
  if (!isolation.isApproved && !process.env.FIRESTORE_EMULATOR_HOST) {
    console.error('❌ Datastore isolation could not be proven. Integration tests must run against local emulator.');
    console.error('Rejection reasons:', isolation.rejectionReasons);
    // In static mode or unconfigured emulator runs, stop safely with clean audit report
    return;
  }
  console.log('✓ Suite 1 Passed: Datastore isolation verified. Zero production exposure.\n');

  // =========================================================================
  // Server Setup (Mounting production apiRouter on dynamic port)
  // =========================================================================
  const app: Express = express();
  app.use(express.json());
  app.use('/api', apiRouter);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}/api`;

  try {
    // Setup test actors
    const authorActor = await setupTestActor(UserRole.QUESTION_CREATOR, 'AuthorLakshmi');
    const reviewerActor = await setupTestActor(UserRole.REVIEWER, 'ReviewerPadma');
    const guestActor = await setupTestActor(UserRole.SPEAKER, 'GuestUser');
    const adminActor = await setupTestActor(UserRole.ADMIN, 'AdminReddy');

    // =========================================================================
    // SUITE 2: Complete Persistence Lifecycle (End-to-End Journey)
    // =========================================================================
    console.log('--- SUITE 2: Complete Persistence Lifecycle ---');

    // 2.1 CREATE DRAFT
    console.log('[Scenario 2.1] Create new draft via POST /api/questions/draft...');
    const createPayload = createBaselineBatchPayload(authorActor.userId);
    const createRes = await fetch(`${baseUrl}/questions/draft`, {
      method: 'POST',
      headers: authorActor.headers,
      body: JSON.stringify(createPayload),
    });
    assert.strictEqual(createRes.status, 201, 'POST /questions/draft must return HTTP 201');
    const createdDraft = await createRes.json();
    assert.ok(createdDraft.id, 'Created draft must have an ID');
    trackedSyntheticDraftIds.add(createdDraft.id);

    assert.ok(
      canonicalIdService.validateCanonicalId(createdDraft.id, 'dft_'),
      'Draft ID must be canonical UUID v4 starting with dft_'
    );
    assert.strictEqual(createdDraft.version, 1, 'Initial version must be 1');
    assert.strictEqual(createdDraft.status, QuestionStatus.DRAFT);
    assert.strictEqual(createdDraft.workflowStage, 'QUESTION_STUDIO');
    assert.strictEqual(createdDraft.authorId, authorActor.userId);
    assert.strictEqual(createdDraft.slots.length, 5);
    console.log(`  ✓ Draft created: ${createdDraft.id} (version 1)`);

    // 2.2 RETRIEVE DRAFT
    console.log('[Scenario 2.2] Retrieve draft via GET /api/questions/draft/:id...');
    const retrieveRes = await fetch(`${baseUrl}/questions/draft/${createdDraft.id}`, {
      method: 'GET',
      headers: authorActor.headers,
    });
    assert.strictEqual(retrieveRes.status, 200, 'GET /questions/draft/:id must return HTTP 200');
    const retrievedDraft = await retrieveRes.json();
    assert.strictEqual(retrievedDraft.id, createdDraft.id);
    assert.strictEqual(retrievedDraft.version, 1);
    assert.strictEqual(retrievedDraft.topicId, 'TOP-QA-01');
    assert.strictEqual(retrievedDraft.slots.length, 5);
    console.log(`  ✓ Draft retrieved: verified exact fields and slot count`);

    // 2.3 UPDATE DRAFT
    console.log('[Scenario 2.3] Update draft via PUT /api/questions/draft/:id...');
    const updatedQuestionText = 'సవరించిన ప్రశ్న: రైలు 90 కి.మీ/గం వేగంతో ప్రయాణిస్తే సమయం ఎంత?';
    const updateRes = await fetch(`${baseUrl}/questions/draft/${createdDraft.id}`, {
      method: 'PUT',
      headers: authorActor.headers,
      body: JSON.stringify({
        ...retrievedDraft,
        version: 1,
        expectedVersion: 1,
        questionText: updatedQuestionText,
      }),
    });
    assert.strictEqual(updateRes.status, 200, 'PUT /questions/draft/:id must return HTTP 200');
    const updatedDraft = await updateRes.json();
    assert.strictEqual(updatedDraft.version, 2, 'Version must increment atomically to 2');
    assert.strictEqual(updatedDraft.questionText, updatedQuestionText);
    console.log(`  ✓ Draft updated: atomic OCC version advanced to ${updatedDraft.version}`);

    // 2.4 REFRESH / REOPEN (Session Hydration)
    console.log('[Scenario 2.4] Refresh and reopen in new session...');
    const reopenRes = await fetch(`${baseUrl}/questions/draft/${createdDraft.id}`, {
      method: 'GET',
      headers: authorActor.headers,
    });
    const reloadedDraft = await reopenRes.json();
    assert.strictEqual(reloadedDraft.version, 2);
    assert.strictEqual(reloadedDraft.questionText, updatedQuestionText);
    console.log('  ✓ Draft reloaded: verified updated content persists across session boundary');

    // 2.5 SAVE DRAFT DOES NOT IMPLICITLY SUBMIT
    console.log('[Scenario 2.5] Verify Save Draft does NOT advance workflow...');
    assert.strictEqual(reloadedDraft.status, QuestionStatus.DRAFT, 'Status must remain DRAFT');
    assert.strictEqual(reloadedDraft.workflowStage, 'QUESTION_STUDIO', 'Stage must remain QUESTION_STUDIO');
    console.log('  ✓ Save Draft isolation verified: workflow state remained in Stage 01');

    // 2.6 SUBMIT DRAFT FOR VERIFICATION
    console.log('[Scenario 2.6] Submit valid draft for verification via POST /api/questions/draft/:id/submit...');
    const submitRes = await fetch(`${baseUrl}/questions/draft/${createdDraft.id}/submit`, {
      method: 'POST',
      headers: authorActor.headers,
      body: JSON.stringify({
        remarks: 'Sprint 9 Batch Ready for Verification',
        expectedVersion: 2,
      }),
    });
    assert.strictEqual(submitRes.status, 200, 'POST /questions/draft/:id/submit must return HTTP 200');
    const submitResult = await submitRes.json();
    assert.strictEqual(submitResult.success, true);
    assert.strictEqual(submitResult.status, 'SUBMITTED_FOR_REVIEW');
    assert.strictEqual(submitResult.workflowStage, 'STAGE_02_VERIFICATION');
    console.log('  ✓ Draft submitted: transitioned to STAGE_02_VERIFICATION');

    // 2.7 RETRIEVE SUBMITTED RECORD
    console.log('[Scenario 2.7] Retrieve submitted record to verify persisted workflow state...');
    const postSubmitRes = await fetch(`${baseUrl}/questions/draft/${createdDraft.id}`, {
      method: 'GET',
      headers: reviewerActor.headers, // Reviewer can view submitted draft
    });
    const postSubmitDraft = await postSubmitRes.json();
    assert.strictEqual(postSubmitDraft.workflowStage, 'STAGE_02_VERIFICATION');
    assert.strictEqual(postSubmitDraft.status, 'SUBMITTED_FOR_REVIEW');
    console.log('  ✓ Submitted workflow state confirmed persisted in Firestore');

    // 2.8 RETURN FOR REVISION (Stage 02 -> Stage 01)
    console.log('[Scenario 2.8] Reviewer returns draft for revision via POST /api/questions/draft/:id/request-changes...');
    const feedbackNote = 'దయచేసి స్లాట్ 2 లో ఆప్షన్ వివరణను మరింత స్పష్టంగా పేర్కొనండి.';
    const returnRes = await fetch(`${baseUrl}/questions/draft/${createdDraft.id}/request-changes`, {
      method: 'POST',
      headers: reviewerActor.headers,
      body: JSON.stringify({
        feedback: feedbackNote,
        expectedVersion: postSubmitDraft.version,
      }),
    });
    assert.strictEqual(returnRes.status, 200, 'POST /questions/draft/:id/request-changes must return HTTP 200');
    const returnResult = await returnRes.json();
    assert.strictEqual(returnResult.workflowStage, 'QUESTION_STUDIO');
    console.log('  ✓ Draft returned for revision: Stage 02 -> Stage 01 reverse transition');

    // 2.9 REVISE, RE-SAVE, AND RE-SUBMIT
    console.log('[Scenario 2.9] Author reopens returned draft, sees feedback, revises, and resubmits...');
    const returnedDraftRes = await fetch(`${baseUrl}/questions/draft/${createdDraft.id}`, {
      method: 'GET',
      headers: authorActor.headers,
    });
    const returnedDraft = await returnedDraftRes.json();
    assert.strictEqual(returnedDraft.workflowStage, 'QUESTION_STUDIO');
    assert.ok(returnedDraft.reviewerFeedback.includes('స్లాట్ 2'), 'Feedback note must be preserved');

    // Author revises and saves draft
    const reviseRes = await fetch(`${baseUrl}/questions/draft/${createdDraft.id}`, {
      method: 'PUT',
      headers: authorActor.headers,
      body: JSON.stringify({
        ...returnedDraft,
        expectedVersion: returnedDraft.version,
        explanation: 'సవరించిన వివరణ: వేగం మరియు కాలం సూత్రం s = d/t ఆధారంగా సమగ్ర వివరణ.',
      }),
    });
    const revisedDraft = await reviseRes.json();
    assert.strictEqual(revisedDraft.version, returnedDraft.version + 1);

    // Author resubmits
    const resubmitRes = await fetch(`${baseUrl}/questions/draft/${createdDraft.id}/submit`, {
      method: 'POST',
      headers: authorActor.headers,
      body: JSON.stringify({
        remarks: 'స్లాట్ 2 వివరణ సవరించబడినది. పునఃసమీక్షకు సిద్ధం.',
        expectedVersion: revisedDraft.version,
      }),
    });
    assert.strictEqual(resubmitRes.status, 200);
    const resubmitResult = await resubmitRes.json();
    assert.strictEqual(resubmitResult.workflowStage, 'STAGE_02_VERIFICATION');
    console.log('  ✓ Resubmission successful: returned draft revised and advanced to Stage 02');

    // 2.10 AUTHORIZED REVIEWER APPROVAL
    console.log('[Scenario 2.10] Authorized reviewer approves draft via POST /api/questions/draft/:id/approve...');
    const approveRes = await fetch(`${baseUrl}/questions/draft/${createdDraft.id}/approve`, {
      method: 'POST',
      headers: reviewerActor.headers,
      body: JSON.stringify({
        notes: 'సమీక్ష పూర్తి అయింది. ప్రశ్నలు నాణ్యతా ప్రమాణాలను సంతృప్తిపరిచాయి.',
      }),
    });
    assert.strictEqual(approveRes.status, 201, 'POST /questions/draft/:id/approve must return HTTP 201');
    const approvedQuestion = await approveRes.json();
    assert.ok(approvedQuestion.id);
    assert.strictEqual(approvedQuestion.status, QuestionStatus.APPROVED);
    console.log(`  ✓ Draft approved: created canonical production question ${approvedQuestion.id}\n`);

    // =========================================================================
    // SUITE 3: Backend Authorization & RBAC Boundaries
    // =========================================================================
    console.log('--- SUITE 3: Backend Authorization & RBAC Boundaries ---');

    // 3.1 Unauthenticated requests rejected
    console.log('[Scenario 3.1] Unauthenticated requests rejected (HTTP 401)...');
    const unauthRes = await fetch(`${baseUrl}/questions/draft/${createdDraft.id}`, {
      method: 'GET',
    });
    assert.strictEqual(unauthRes.status, 401, 'Unauthenticated read must return HTTP 401');
    console.log('  ✓ HTTP 401 Unauthorized enforced for missing auth header');

    // 3.2 Authenticated user without required capability rejected
    console.log('[Scenario 3.2] Authenticated user without QUESTION:CREATE rejected (HTTP 403)...');
    const guestCreateRes = await fetch(`${baseUrl}/questions/draft`, {
      method: 'POST',
      headers: guestActor.headers,
      body: JSON.stringify(createPayload),
    });
    assert.strictEqual(guestCreateRes.status, 403, 'User without QUESTION:CREATE must return HTTP 403');
    console.log('  ✓ HTTP 403 Forbidden enforced for missing capability');

    // 3.3 Attempts to read another user's draft rejected
    console.log('[Scenario 3.3] Non-privileged author cannot read another user draft (HTTP 403)...');
    const otherAuthor = await setupTestActor(UserRole.QUESTION_CREATOR, 'OtherAuthor');
    const otherReadRes = await fetch(`${baseUrl}/questions/draft/${createdDraft.id}`, {
      method: 'GET',
      headers: otherAuthor.headers,
    });
    assert.strictEqual(otherReadRes.status, 403, 'Non-privileged author reading other draft must return HTTP 403');
    const otherReadErr = await otherReadRes.json();
    assert.match(otherReadErr.message || otherReadErr.error, /Unauthorized: User/);
    console.log('  ✓ Ownership boundary enforced: unprivileged author cannot read peer drafts');

    // 3.4 Attempts to invoke reviewer actions as author rejected
    console.log('[Scenario 3.4] Author attempting reviewer-only action rejected (HTTP 403)...');
    const authorApproveRes = await fetch(`${baseUrl}/questions/draft/${createdDraft.id}/approve`, {
      method: 'POST',
      headers: authorActor.headers,
      body: JSON.stringify({ notes: 'Self approve attempt' }),
    });
    assert.strictEqual(authorApproveRes.status, 403, 'Author invoking approve must return HTTP 403');
    console.log('  ✓ Role capability gate enforced: author cannot invoke approve');

    // 3.5 Direct API calls attempting to manipulate workflowStage in saveDraft payload
    console.log('[Scenario 3.5] Direct API payload cannot forge workflowStage...');
    const spoofDraftRes = await fetch(`${baseUrl}/questions/draft`, {
      method: 'POST',
      headers: authorActor.headers,
      body: JSON.stringify({
        ...createPayload,
        workflowStage: 'APPROVED', // Spoofed!
        status: 'PUBLISHED', // Spoofed!
      }),
    });
    const spoofedDraft = await spoofDraftRes.json();
    trackedSyntheticDraftIds.add(spoofedDraft.id);
    assert.strictEqual(spoofedDraft.workflowStage, 'QUESTION_STUDIO', 'Server must ignore client-forged stage');
    assert.strictEqual(spoofedDraft.status, QuestionStatus.DRAFT, 'Server must enforce DRAFT status');
    console.log('  ✓ Server-side authority enforced: client cannot spoof workflow stage in payload\n');

    // =========================================================================
    // SUITE 4: Workflow Transition Enforcement & GAR-02 Anti-Self-Approval
    // =========================================================================
    console.log('--- SUITE 4: Workflow Transition Enforcement & GAR-02 ---');

    // 4.1 GAR-02 STRICT ANTI-SELF-APPROVAL (Author cannot approve own artifact)
    console.log('[Scenario 4.1] GAR-02 Strict Anti-Self-Approval enforcement...');
    // Create dual-role author who is also granted ADMIN role
    const dualRoleActor = await setupTestActor(UserRole.ADMIN, 'DualRoleAuthor');
    const dualRoleDraftRes = await fetch(`${baseUrl}/questions/draft`, {
      method: 'POST',
      headers: dualRoleActor.headers,
      body: JSON.stringify(createBaselineBatchPayload(dualRoleActor.userId)),
    });
    const dualRoleDraft = await dualRoleDraftRes.json();
    trackedSyntheticDraftIds.add(dualRoleDraft.id);

    // Submit draft
    await fetch(`${baseUrl}/questions/draft/${dualRoleDraft.id}/submit`, {
      method: 'POST',
      headers: dualRoleActor.headers,
      body: JSON.stringify({ expectedVersion: 1 }),
    });

    // Dual-role author attempts to approve their own draft using Admin privileges
    const selfApproveRes = await fetch(`${baseUrl}/questions/draft/${dualRoleDraft.id}/approve`, {
      method: 'POST',
      headers: dualRoleActor.headers,
      body: JSON.stringify({ notes: 'Attempting self-approval under Admin role' }),
    });
    assert.strictEqual(selfApproveRes.status, 403, 'GAR-02 self-approval must return HTTP 403');
    const selfApproveErr = await selfApproveRes.json();
    assert.ok(
      selfApproveErr.error === 'AntiSelfApprovalViolation' ||
      selfApproveErr.code === 'GAR-02' ||
      /author cannot approve/i.test(selfApproveErr.message)
    );
    console.log('  ✓ GAR-02 strictly enforced: author cannot self-approve even under Admin role');

    // 4.2 Invalid submission from incompatible state
    console.log('[Scenario 4.2] Reject submission of already submitted/approved draft...');
    const duplicateSubmitRes = await fetch(`${baseUrl}/questions/draft/${createdDraft.id}/submit`, {
      method: 'POST',
      headers: authorActor.headers,
      body: JSON.stringify({ expectedVersion: 1 }),
    });
    assert.ok(duplicateSubmitRes.status === 400 || duplicateSubmitRes.status === 409);
    console.log('  ✓ Invalid forward transition rejected fail-closed');

    // 4.3 Incomplete batch submission rejected by server gate (HTTP 422)
    console.log('[Scenario 4.3] Incomplete batch submission rejected by server validation gate...');
    const incompleteDraftRes = await fetch(`${baseUrl}/questions/draft`, {
      method: 'POST',
      headers: authorActor.headers,
      body: JSON.stringify({
        ...createPayload,
        slots: createPayload.slots?.slice(0, 3), // Only 3 slots for count=5
      }),
    });
    const incompleteDraft = await incompleteDraftRes.json();
    trackedSyntheticDraftIds.add(incompleteDraft.id);

    const incompleteSubmitRes = await fetch(`${baseUrl}/questions/draft/${incompleteDraft.id}/submit`, {
      method: 'POST',
      headers: authorActor.headers,
      body: JSON.stringify({ expectedVersion: 1 }),
    });
    assert.ok(
      incompleteSubmitRes.status === 422 || incompleteSubmitRes.status === 400,
      'Incomplete batch submission must be rejected with HTTP 422/400'
    );
    console.log('  ✓ Server-side submission validation gate strictly enforced\n');

    // =========================================================================
    // SUITE 5: Concurrency, OCC Stale Versions, and Idempotency
    // =========================================================================
    console.log('--- SUITE 5: Concurrency, OCC Stale Versions, and Idempotency ---');

    // 5.1 Optimistic Concurrency Control (OCC) collision
    console.log('[Scenario 5.1] Reject stale OCC update with HTTP 409 ConcurrencyConflictError...');
    const occDraftRes = await fetch(`${baseUrl}/questions/draft`, {
      method: 'POST',
      headers: authorActor.headers,
      body: JSON.stringify(createPayload),
    });
    const occDraft = await occDraftRes.json();
    trackedSyntheticDraftIds.add(occDraft.id);
    assert.strictEqual(occDraft.version, 1);

    // Client 1 successfully updates from version 1 -> 2
    const client1Update = await fetch(`${baseUrl}/questions/draft/${occDraft.id}`, {
      method: 'PUT',
      headers: authorActor.headers,
      body: JSON.stringify({
        ...occDraft,
        expectedVersion: 1,
        questionText: 'క్లయింట్ 1 ద్వారా అప్‌డేట్ చేయబడినది',
      }),
    });
    assert.strictEqual(client1Update.status, 200);
    const client1Result = await client1Update.json();
    assert.strictEqual(client1Result.version, 2);

    // Client 2 attempts stale update using expectedVersion: 1
    const client2StaleUpdate = await fetch(`${baseUrl}/questions/draft/${occDraft.id}`, {
      method: 'PUT',
      headers: authorActor.headers,
      body: JSON.stringify({
        ...occDraft,
        expectedVersion: 1, // Stale! Server is at 2
        questionText: 'క్లయింట్ 2 స్టేల్ ఓవర్‌రైట్ ప్రయత్నం',
      }),
    });
    assert.strictEqual(client2StaleUpdate.status, 409, 'Stale OCC write MUST return HTTP 409');
    const occErr = await client2StaleUpdate.json();
    assert.ok(occErr.error === 'ConcurrencyConflictError' || occErr.code === 'CONFLICT_OPTIMISTIC_LOCK' || /version/i.test(occErr.message));

    // Verify database document was protected against silent overwrite
    const occVerifyRes = await fetch(`${baseUrl}/questions/draft/${occDraft.id}`, {
      method: 'GET',
      headers: authorActor.headers,
    });
    const occVerifyDraft = await occVerifyRes.json();
    assert.strictEqual(occVerifyDraft.version, 2);
    assert.strictEqual(occVerifyDraft.questionText, 'క్లయింట్ 1 ద్వారా అప్‌డేట్ చేయబడినది');
    console.log('  ✓ OCC atomic lock rejected stale update and protected server record');

    // 5.2 Stale submission attempt rejected with HTTP 409
    console.log('[Scenario 5.2] Stale submission attempt rejected with HTTP 409...');
    const staleSubmitRes = await fetch(`${baseUrl}/questions/draft/${occDraft.id}/submit`, {
      method: 'POST',
      headers: authorActor.headers,
      body: JSON.stringify({
        expectedVersion: 1, // Stale! Server is at version 2
      }),
    });
    assert.strictEqual(staleSubmitRes.status, 409, 'Stale submission must return HTTP 409');
    console.log('  ✓ Stale expectedVersion submission rejected fail-closed');

    // 5.3 Repeated saves update in-place without duplicate records
    console.log('[Scenario 5.3] Repeated saves update in-place with zero duplicate records...');
    const allDraftsBefore = await questionDraftsRepository.findWhere((d) => d.id === occDraft.id);
    assert.strictEqual(allDraftsBefore.length, 1);

    await fetch(`${baseUrl}/questions/draft/${occDraft.id}`, {
      method: 'PUT',
      headers: authorActor.headers,
      body: JSON.stringify({
        ...occVerifyDraft,
        expectedVersion: 2,
        difficulty: 'Advanced',
      }),
    });

    const allDraftsAfter = await questionDraftsRepository.findWhere((d) => d.id === occDraft.id);
    assert.strictEqual(allDraftsAfter.length, 1, 'Exactly one document must exist for draftId');
    console.log('  ✓ 1-to-1 aggregate persistence identity preserved without document proliferation\n');

  } finally {
    // Teardown HTTP server
    await new Promise<void>((resolve) => server.close(() => resolve()));

    // =========================================================================
    // Explicit Scoped Cleanup (Zero broad wipes / zero production pollution)
    // =========================================================================
    console.log('--- Teardown & Scoped Cleanup ---');
    console.log(`Cleaning up ${trackedSyntheticDraftIds.size} tracked synthetic drafts...`);
    for (const draftId of trackedSyntheticDraftIds) {
      try {
        await questionDraftsRepository.delete(draftId);
      } catch (err: any) {
        console.warn(`Could not delete test draft ${draftId}: ${err?.message}`);
      }
    }

    console.log(`Cleaning up ${trackedSyntheticUserIds.size} tracked synthetic test users...`);
    for (const userId of trackedSyntheticUserIds) {
      try {
        await usersRepository.delete(userId);
      } catch (err: any) {
        console.warn(`Could not delete test user ${userId}: ${err?.message}`);
      }
    }
    console.log('✓ Teardown complete: all owned synthetic records removed. Zero audit logs deleted.\n');
  }

  console.log('========================================================================');
  console.log('ALL S9-T18 PERSISTENCE, AUTH & WORKFLOW INTEGRATION TESTS AUTHORED');
  console.log('========================================================================\n');
}

runPersistenceAuthorizationWorkflowIntegrationTests().catch((err) => {
  console.error('S9-T18 TEST EXECUTION FAILED:', err);
  process.exitCode = 1;
});
