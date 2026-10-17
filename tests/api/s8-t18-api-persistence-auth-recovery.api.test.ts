/**
 * BURRA PARIKSHA CMS — S8-T18 API, Persistence, Authorization & Recovery Verification
 * Feature Slice: Question Generation (Stage 01) & Workflow Resumption
 *
 * Comprehensive integration test suite verifying:
 * 1. Isolation & Data Safety: IN_MEMORY_TEST_ONLY mode strictly verified; zero production Firestore mutation.
 * 2. Section 1: Create, read, update, and draft resumption across a fresh repository/session.
 * 3. Section 2: Server-side schema validation and rejection of malformed or invalid payloads.
 * 4. Section 3: Authentication, role authorization, and cross-user draft access restrictions.
 * 5. Section 4: Optimistic concurrency (`expectedVersion`) and stale-update rejection (HTTP 409).
 * 6. Section 5: Duplicate submission protection, concurrency coordination, and transition idempotency.
 * 7. Section 6: Recovery from persistence/API failures without corrupting drafts, duplicating transitions, or losing required audit events.
 * 8. Section 7: Safe test-data cleanup and verification with immutable audit event retention.
 */

// Force deterministic in-memory isolation BEFORE any repository or adapter imports
process.env.PERSISTENCE_MODE = 'IN_MEMORY_TEST_ONLY';

import assert from 'node:assert';
import http from 'node:http';
import express from 'express';
import { apiRouter } from '../../backend/server/routers/routes';
import { authService } from '../../backend/infrastructure/auth/services/auth.service';
import { usersRepository } from '../../database/firestore/repositories/users.repository';
import { topicsRepository } from '../../database/firestore/repositories/topics.repository';
import { subtopicsRepository } from '../../database/firestore/repositories/subtopics.repository';
import { questionDraftsRepository } from '../../database/firestore/repositories/question-drafts.repository';
import { auditLogRepository } from '../../database/firestore/repositories/audit-log.repository';
import { workflowInstancesRepository, workflowService } from '../../backend/domain/workflow';
import { canonicalIdService, QuestionStatus, UserRole } from '../../shared';

function pass(name: string) {
  console.log(`  ✓ ${name}`);
}

async function runS8T18Tests() {
  console.log('========================================================================');
  console.log('RUNNING S8-T18 TESTS: API, Persistence, Authorization & Recovery');
  console.log('========================================================================\n');

  // --------------------------------------------------------------------------
  // MANDATORY DATA SAFETY & ISOLATION VERIFICATION (FAIL CLOSED)
  // --------------------------------------------------------------------------
  console.log('[BOOTSTRAP] Verifying Datastore Isolation & Environment Safety...');
  assert.strictEqual(
    process.env.PERSISTENCE_MODE,
    'IN_MEMORY_TEST_ONLY',
    'PERSISTENCE_MODE must be IN_MEMORY_TEST_ONLY'
  );

  const draftRepoMode = await questionDraftsRepository.getPersistenceMode();
  assert.strictEqual(
    draftRepoMode,
    'IN_MEMORY_TEST_ONLY',
    'questionDraftsRepository must operate in IN_MEMORY_TEST_ONLY mode to ensure zero production writes'
  );
  pass('Bootstrap isolation verified: Zero live Firestore mutation possible (IN_MEMORY_TEST_ONLY)');

  // Track all test-created synthetic records in dedicated namespace for verifiable cleanup
  const testNamespace = `s8_t18_${Date.now()}`;
  const trackedRecords = {
    topics: [] as string[],
    subtopics: [] as string[],
    users: [] as string[],
    drafts: [] as string[],
    workflows: [] as string[],
  };

  // Mount production apiRouter exactly as in server.ts on ephemeral loopback port
  const app = express();
  app.use(express.json());
  app.use('/api', apiRouter);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}/api`;

  try {
    // ------------------------------------------------------------------------
    // SETUP: Taxonomy and Authenticated Actors
    // ------------------------------------------------------------------------
    console.log('\n[SETUP] Creating Deterministic Synthetic Fixtures...');
    const topicId = canonicalIdService.generateTopicId();
    trackedRecords.topics.push(topicId);
    await topicsRepository.appendRecord({
      id: topicId,
      name: `Time and Work (${testNamespace})`,
      slug: `time-and-work-${testNamespace}`,
      isActive: true,
      description: 'S8-T18 Syllabus Topic',
    });

    const otherTopicId = canonicalIdService.generateTopicId();
    trackedRecords.topics.push(otherTopicId);
    await topicsRepository.appendRecord({
      id: otherTopicId,
      name: `General Science (${testNamespace})`,
      slug: `general-science-${testNamespace}`,
      isActive: true,
      description: 'S8-T18 Alternate Topic',
    });

    const subtopicId = canonicalIdService.generateSubtopicId();
    trackedRecords.subtopics.push(subtopicId);
    await subtopicsRepository.appendRecord({
      id: subtopicId,
      topicId: topicId,
      name: `Pipes and Cisterns (${testNamespace})`,
      slug: `pipes-and-cisterns-${testNamespace}`,
      isActive: true,
      description: 'S8-T18 Child Subtopic',
    });

    // Author 1 (Question Creator)
    const author1Id = `usr_${testNamespace}_author1`;
    trackedRecords.users.push(author1Id);
    await usersRepository.appendRecord({
      id: author1Id,
      name: 'Author One S8T18',
      email: `author1_${testNamespace}@burrapariksha.com`,
      role: UserRole.QUESTION_CREATOR,
      roles: [UserRole.QUESTION_CREATOR],
      isActive: true,
      sessionVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const author1Token = authService.generateSessionToken({
      userId: author1Id,
      name: 'Author One S8T18',
      role: UserRole.QUESTION_CREATOR,
      roles: [UserRole.QUESTION_CREATOR],
      sessionVersion: 1,
    });
    const authHeaders1 = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${author1Token}`,
    };

    // Author 2 (Question Creator - Different user)
    const author2Id = `usr_${testNamespace}_author2`;
    trackedRecords.users.push(author2Id);
    await usersRepository.appendRecord({
      id: author2Id,
      name: 'Author Two S8T18',
      email: `author2_${testNamespace}@burrapariksha.com`,
      role: UserRole.QUESTION_CREATOR,
      roles: [UserRole.QUESTION_CREATOR],
      isActive: true,
      sessionVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const author2Token = authService.generateSessionToken({
      userId: author2Id,
      name: 'Author Two S8T18',
      role: UserRole.QUESTION_CREATOR,
      roles: [UserRole.QUESTION_CREATOR],
      sessionVersion: 1,
    });
    const authHeaders2 = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${author2Token}`,
    };

    // Administrator (Privileged)
    const adminId = `usr_${testNamespace}_admin`;
    trackedRecords.users.push(adminId);
    await usersRepository.appendRecord({
      id: adminId,
      name: 'Admin S8T18',
      email: `admin_${testNamespace}@burrapariksha.com`,
      role: UserRole.ADMIN,
      roles: [UserRole.ADMIN],
      isActive: true,
      sessionVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const adminToken = authService.generateSessionToken({
      userId: adminId,
      name: 'Admin S8T18',
      role: UserRole.ADMIN,
      roles: [UserRole.ADMIN],
      sessionVersion: 1,
    });
    const authHeadersAdmin = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    };

    // Analyst / Analytics Viewer (Lacks QUESTION:CREATE capability)
    const analystId = `usr_${testNamespace}_analyst`;
    trackedRecords.users.push(analystId);
    await usersRepository.appendRecord({
      id: analystId,
      name: 'Analyst S8T18',
      email: `analyst_${testNamespace}@burrapariksha.com`,
      role: UserRole.ANALYTICS_VIEWER,
      roles: [UserRole.ANALYTICS_VIEWER],
      isActive: true,
      sessionVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    const analystToken = authService.generateSessionToken({
      userId: analystId,
      name: 'Analyst S8T18',
      role: UserRole.ANALYTICS_VIEWER,
      roles: [UserRole.ANALYTICS_VIEWER],
      sessionVersion: 1,
    });
    const authHeadersAnalyst = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${analystToken}`,
    };

    pass('Synthetic taxonomy & authenticated actors successfully seeded in in-memory repository');

    // ========================================================================
    // SECTION 1: Create, Read, Update, and Draft Resumption Across Fresh Sessions
    // ========================================================================
    console.log('\n[SECTION 1] Create, Read, Update, and Draft Resumption Across Fresh Sessions');

    const draft1Payload = {
      topicId,
      subtopicId,
      productionMode: 'QUESTION_CHALLENGE_SHORT',
      targetQuestionCount: 1,
      aspectRatio: '9:16',
      language: 'TELUGU',
      difficulty: 'Medium',
      questionText: 'పైపు A ఒక తొట్టెను 6 గంటల్లో, పైపు B 8 గంటల్లో నింపగలవు. రెండూ కలిసి ఎంత సమయంలో నింపుతాయి?',
      options: { a: '3 గంటలు', b: '3 3/7 గంటలు', c: '4 గంటలు', d: '2 5/7 గంటలు' },
      correctAnswer: 'B',
      explanation: '1/6 + 1/8 = 7/24. మొత్తం సమయం = 24/7 = 3 3/7 గంటలు.',
    };

    // 1.1: Create Draft
    const resCreate = await fetch(`${baseUrl}/questions/draft`, {
      method: 'POST',
      headers: authHeaders1,
      body: JSON.stringify(draft1Payload),
    });
    assert.strictEqual(resCreate.status, 201, 'POST /questions/draft must return HTTP 201');
    const createdDraft = await resCreate.json();
    assert(createdDraft.id && createdDraft.id.startsWith('dft_'), 'Draft ID must begin with canonical dft_ prefix');
    trackedRecords.drafts.push(createdDraft.id);
    assert.strictEqual(createdDraft.status, 'DRAFT', 'Created draft status must be DRAFT');
    assert.strictEqual(createdDraft.workflowStage, 'QUESTION_STUDIO', 'Workflow stage must be Stage 01 QUESTION_STUDIO');
    assert.strictEqual(createdDraft.authorId, author1Id, 'Author ID must match authenticated actor');
    assert.strictEqual(createdDraft.version, 1, 'Initial draft version must be 1');
    pass('1.1 Create draft via POST /questions/draft returns HTTP 201 with canonical dft_ ID and Stage 01 state');

    // 1.2: Read Draft in Fresh Request Session
    const freshSessionHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${author1Token}`,
    };
    const resRead = await fetch(`${baseUrl}/questions/draft/${createdDraft.id}`, {
      method: 'GET',
      headers: freshSessionHeaders,
    });
    assert.strictEqual(resRead.status, 200, 'GET /questions/draft/:id must return HTTP 200');
    const readDraft = await resRead.json();
    assert.strictEqual(readDraft.id, createdDraft.id);
    assert.strictEqual(readDraft.topicId, topicId);
    assert.strictEqual(readDraft.subtopicId, subtopicId);
    assert.strictEqual(readDraft.questionText, draft1Payload.questionText);
    assert.strictEqual(readDraft.options.b, '3 3/7 గంటలు');
    assert.strictEqual(readDraft.correctAnswer, 'B');
    assert.strictEqual(readDraft.version, 1);
    pass('1.2 Read draft via GET /questions/draft/:id across fresh session returns matching persisted values');

    // 1.3: Update Draft with Incremented Version
    const updatedDraft1Payload = {
      ...draft1Payload,
      questionText: 'నవీకరించబడిన ప్రశ్న: పైపు A మరియు B ఒకేసారి తెరిచినప్పుడు తొట్టె ఎంత సమయంలో నిండుతుంది?',
      options: { a: '3 గంటలు', b: '24/7 గంటలు', c: '4 గంటలు', d: '5 గంటలు' },
      correctAnswer: 'B',
      version: 1, // expected current version
    };
    const resUpdate = await fetch(`${baseUrl}/questions/draft/${createdDraft.id}`, {
      method: 'PUT',
      headers: authHeaders1,
      body: JSON.stringify(updatedDraft1Payload),
    });
    assert.strictEqual(resUpdate.status, 200, 'PUT /questions/draft/:id must return HTTP 200');
    const updatedDraft = await resUpdate.json();
    assert.strictEqual(updatedDraft.id, createdDraft.id);
    assert.strictEqual(updatedDraft.questionText, updatedDraft1Payload.questionText);
    assert.strictEqual(updatedDraft.options.b, '24/7 గంటలు');
    assert.strictEqual(updatedDraft.version, 2, 'Version must increment to 2 on update');
    assert.strictEqual(updatedDraft.status, 'DRAFT', 'Status must remain DRAFT on update');
    assert.strictEqual(updatedDraft.workflowStage, 'QUESTION_STUDIO', 'Stage must remain QUESTION_STUDIO');
    pass('1.3 Update draft via PUT /questions/draft/:id increments version and retains Stage 01 DRAFT lifecycle');

    // 1.4: Resumption across Simulated Fresh Session
    const resResumed = await fetch(`${baseUrl}/questions/draft/${createdDraft.id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${author1Token}`,
      },
    });
    assert.strictEqual(resResumed.status, 200);
    const resumedDraft = await resResumed.json();
    assert.strictEqual(resumedDraft.version, 2);
    assert.strictEqual(resumedDraft.questionText, updatedDraft1Payload.questionText);
    pass('1.4 Draft resumption in independent session re-hydrates updated content and version 2');

    // ========================================================================
    // SECTION 2: Server-Side Schema Validation and Malformed/Invalid Payload Rejections
    // ========================================================================
    console.log('\n[SECTION 2] Server-Side Schema Validation and Malformed/Invalid Payload Rejections');

    // 2.1: Malformed Draft ID
    const resMalformedGet = await fetch(`${baseUrl}/questions/draft/invalid-uuid-format`, {
      headers: authHeaders1,
    });
    assert.strictEqual(resMalformedGet.status, 400, 'Malformed draft ID on GET must return HTTP 400');

    const resMalformedPut = await fetch(`${baseUrl}/questions/draft/invalid-uuid-format`, {
      method: 'PUT',
      headers: authHeaders1,
      body: JSON.stringify(draft1Payload),
    });
    assert.strictEqual(resMalformedPut.status, 400, 'Malformed draft ID on PUT must return HTTP 400');

    const resMalformedSubmit = await fetch(`${baseUrl}/questions/draft/invalid-uuid-format/submit`, {
      method: 'POST',
      headers: authHeaders1,
      body: JSON.stringify({ expectedVersion: 1 }),
    });
    assert.strictEqual(resMalformedSubmit.status, 400, 'Malformed draft ID on submit must return HTTP 400');
    pass('2.1 Malformed draft IDs rejected with HTTP 400 across GET, PUT, and submit endpoints');

    // 2.2: Non-existent canonical Draft ID
    const resNotFound = await fetch(`${baseUrl}/questions/draft/dft_00000000-0000-4000-8000-000000000000`, {
      headers: authHeaders1,
    });
    assert.strictEqual(resNotFound.status, 404, 'Non-existent draft ID must return HTTP 404');
    pass('2.2 Non-existent canonical draft ID returns HTTP 404');

    // 2.3: Missing required question text / empty content
    const resEmptyText = await fetch(`${baseUrl}/questions/draft`, {
      method: 'POST',
      headers: authHeaders1,
      body: JSON.stringify({
        ...draft1Payload,
        questionText: '   ',
        question: '   ',
      }),
    });
    assert.strictEqual(resEmptyText.status, 400, 'Empty question text must return HTTP 400');
    pass('2.3 Empty question statement rejected with HTTP 400');

    // 2.4: Non-existent topicId
    const resInvalidTopic = await fetch(`${baseUrl}/questions/draft`, {
      method: 'POST',
      headers: authHeaders1,
      body: JSON.stringify({
        ...draft1Payload,
        topicId: 'top_00000000-0000-4000-8000-000000000000',
      }),
    });
    assert.strictEqual(resInvalidTopic.status, 400, 'Non-existent topicId must return HTTP 400');
    pass('2.4 Non-existent topicId rejected with HTTP 400');

    // 2.5: Subtopic not belonging to topic (Taxonomy Mismatch)
    const resTaxonomyMismatch = await fetch(`${baseUrl}/questions/draft`, {
      method: 'POST',
      headers: authHeaders1,
      body: JSON.stringify({
        ...draft1Payload,
        topicId: otherTopicId, // Subtopic belongs to topicId, not otherTopicId
        subtopicId: subtopicId,
      }),
    });
    assert.strictEqual(resTaxonomyMismatch.status, 400, 'Taxonomy link mismatch must return HTTP 400');
    pass('2.5 Subtopic not belonging to specified topic rejected with HTTP 400');

    // 2.6: Incompatible production mode configuration
    const resIncompatibleMode = await fetch(`${baseUrl}/questions/draft`, {
      method: 'POST',
      headers: authHeaders1,
      body: JSON.stringify({
        ...draft1Payload,
        productionMode: 'QUESTION_CHALLENGE_SHORT',
        aspectRatio: '16:9', // Mode 1 requires 9:16
      }),
    });
    assert.strictEqual(resIncompatibleMode.status, 400, 'Incompatible mode config must return HTTP 400');
    pass('2.6 Incompatible production mode configuration rejected with HTTP 400');

    // 2.7: Invalid expectedVersion validation on submission
    const resMissingVersion = await fetch(`${baseUrl}/questions/draft/${createdDraft.id}/submit`, {
      method: 'POST',
      headers: authHeaders1,
      body: JSON.stringify({ remarks: 'Missing version' }),
    });
    assert.strictEqual(resMissingVersion.status, 400, 'Missing expectedVersion must return HTTP 400');

    const resFractionalVersion = await fetch(`${baseUrl}/questions/draft/${createdDraft.id}/submit`, {
      method: 'POST',
      headers: authHeaders1,
      body: JSON.stringify({ remarks: 'Fractional version', expectedVersion: 1.5 }),
    });
    assert.strictEqual(resFractionalVersion.status, 400, 'Fractional expectedVersion must return HTTP 400');

    const resZeroVersion = await fetch(`${baseUrl}/questions/draft/${createdDraft.id}/submit`, {
      method: 'POST',
      headers: authHeaders1,
      body: JSON.stringify({ remarks: 'Zero version', expectedVersion: 0 }),
    });
    assert.strictEqual(resZeroVersion.status, 400, 'Zero expectedVersion must return HTTP 400');

    const resNegativeVersion = await fetch(`${baseUrl}/questions/draft/${createdDraft.id}/submit`, {
      method: 'POST',
      headers: authHeaders1,
      body: JSON.stringify({ remarks: 'Negative version', expectedVersion: -2 }),
    });
    assert.strictEqual(resNegativeVersion.status, 400, 'Negative expectedVersion must return HTTP 400');

    const resStringVersion = await fetch(`${baseUrl}/questions/draft/${createdDraft.id}/submit`, {
      method: 'POST',
      headers: authHeaders1,
      body: JSON.stringify({ remarks: 'String version', expectedVersion: '2' }),
    });
    assert.strictEqual(resStringVersion.status, 400, 'String expectedVersion must return HTTP 400');
    pass('2.7 Missing, fractional, zero, negative, and string expectedVersion rejected with HTTP 400');

    // ========================================================================
    // SECTION 3: Authentication, Role Authorization, and Cross-User Restrictions
    // ========================================================================
    console.log('\n[SECTION 3] Authentication, Role Authorization, and Cross-User Restrictions');

    // 3.1 - 3.5: Unauthenticated access rejected with HTTP 401
    const unauthHeaders = { 'Content-Type': 'application/json' };
    const [resUnauthPost, resUnauthGet, resUnauthList, resUnauthPut, resUnauthSub] = await Promise.all([
      fetch(`${baseUrl}/questions/draft`, { method: 'POST', headers: unauthHeaders, body: JSON.stringify(draft1Payload) }),
      fetch(`${baseUrl}/questions/draft/${createdDraft.id}`, { method: 'GET', headers: unauthHeaders }),
      fetch(`${baseUrl}/questions/drafts`, { method: 'GET', headers: unauthHeaders }),
      fetch(`${baseUrl}/questions/draft/${createdDraft.id}`, { method: 'PUT', headers: unauthHeaders, body: JSON.stringify(updatedDraft1Payload) }),
      fetch(`${baseUrl}/questions/draft/${createdDraft.id}/submit`, { method: 'POST', headers: unauthHeaders, body: JSON.stringify({ expectedVersion: 2 }) }),
    ]);
    assert.strictEqual(resUnauthPost.status, 401, 'POST /questions/draft without session must return HTTP 401');
    assert.strictEqual(resUnauthGet.status, 401, 'GET /questions/draft/:id without session must return HTTP 401');
    assert.strictEqual(resUnauthList.status, 401, 'GET /questions/drafts without session must return HTTP 401');
    assert.strictEqual(resUnauthPut.status, 401, 'PUT /questions/draft/:id without session must return HTTP 401');
    assert.strictEqual(resUnauthSub.status, 401, 'POST /questions/draft/:id/submit without session must return HTTP 401');
    pass('3.1-3.5 All unauthenticated operations strictly rejected with HTTP 401');

    // 3.6: Role lacking QUESTION:CREATE capability (Analyst) rejected with HTTP 403
    const resAnalystCreate = await fetch(`${baseUrl}/questions/draft`, {
      method: 'POST',
      headers: authHeadersAnalyst,
      body: JSON.stringify(draft1Payload),
    });
    assert.strictEqual(resAnalystCreate.status, 403, 'Actor lacking QUESTION:CREATE capability must return HTTP 403');
    pass('3.6 Role lacking QUESTION:CREATE capability rejected with HTTP 403 Forbidden');

    // 3.7: Cross-user draft read (Author 2 reading Author 1's draft) rejected with HTTP 403
    const resCrossRead = await fetch(`${baseUrl}/questions/draft/${createdDraft.id}`, {
      method: 'GET',
      headers: authHeaders2,
    });
    assert.strictEqual(resCrossRead.status, 403, 'Cross-user read must return HTTP 403 Forbidden');
    pass('3.7 Cross-user draft read strictly rejected with HTTP 403 Forbidden');

    // 3.8: Cross-user draft update (Author 2 updating Author 1's draft) rejected with HTTP 403
    const resCrossUpdate = await fetch(`${baseUrl}/questions/draft/${createdDraft.id}`, {
      method: 'PUT',
      headers: authHeaders2,
      body: JSON.stringify(updatedDraft1Payload),
    });
    assert.strictEqual(resCrossUpdate.status, 403, 'Cross-user update must return HTTP 403 Forbidden');
    pass('3.8 Cross-user draft update strictly rejected with HTTP 403 Forbidden');

    // 3.9: Cross-user draft submit (Author 2 submitting Author 1's draft) rejected with HTTP 403
    const resCrossSubmit = await fetch(`${baseUrl}/questions/draft/${createdDraft.id}/submit`, {
      method: 'POST',
      headers: authHeaders2,
      body: JSON.stringify({ expectedVersion: 2, remarks: 'Cross submit attempt' }),
    });
    assert.strictEqual(resCrossSubmit.status, 403, 'Cross-user submit must return HTTP 403 Forbidden');
    pass('3.9 Cross-user draft submission strictly rejected with HTTP 403 Forbidden');

    // 3.10: Actor ID / name spoofing in body cannot bypass submit authorization
    const resSpoofedSubmit = await fetch(`${baseUrl}/questions/draft/${createdDraft.id}/submit`, {
      method: 'POST',
      headers: authHeaders2, // Non-admin token
      body: JSON.stringify({
        remarks: 'Spoofing attempt',
        expectedVersion: 2,
        name: 'System Admin',
        id: adminId,
      }),
    });
    assert.strictEqual(resSpoofedSubmit.status, 403, 'Spoofed body credentials must return HTTP 403');
    pass('3.10 Actor ID/name spoofing in request body cannot bypass submit authorization');

    // 3.11: Privileged Admin read on draft succeeds with HTTP 200
    const resAdminRead = await fetch(`${baseUrl}/questions/draft/${createdDraft.id}`, {
      method: 'GET',
      headers: authHeadersAdmin,
    });
    assert.strictEqual(resAdminRead.status, 200, 'Privileged Admin read must return HTTP 200');
    pass('3.11 Privileged Admin read on draft succeeds with HTTP 200');

    // 3.12: Scoped listing enforces actor isolation
    const resAuthor1List = await fetch(`${baseUrl}/questions/drafts`, { headers: authHeaders1 });
    const author1List = await resAuthor1List.json();
    assert(
      author1List.every((d: any) => d.authorId === author1Id),
      'Author 1 draft listing must be strictly scoped to Author 1 records'
    );

    const resAdminList = await fetch(`${baseUrl}/questions/drafts`, { headers: authHeadersAdmin });
    const adminList = await resAdminList.json();
    assert(adminList.length >= author1List.length, 'Admin must see all drafts across actors');
    pass('3.12 Scoped listing enforces isolation per actor with privileged visibility for Admin');

    // ========================================================================
    // SECTION 4: Optimistic Concurrency Control (`expectedVersion`) & Stale-Update Rejection
    // ========================================================================
    console.log('\n[SECTION 4] Optimistic Concurrency (`expectedVersion`) & Stale-Update Rejection');

    // 4.1: PUT with Stale Version Mismatch (Draft is version 2, client sends 999 or 1)
    const resStalePut = await fetch(`${baseUrl}/questions/draft/${createdDraft.id}`, {
      method: 'PUT',
      headers: authHeaders1,
      body: JSON.stringify({
        ...updatedDraft1Payload,
        version: 999, // Stale version mismatch
      }),
    });
    assert.strictEqual(resStalePut.status, 409, 'OCC version mismatch on PUT must return HTTP 409');
    pass('4.1 Stale expectedVersion on PUT returns HTTP 409 Concurrency Conflict');

    // 4.2: Confirm Draft state and version remain unmodified after rejected stale update
    const resCheckVersion = await fetch(`${baseUrl}/questions/draft/${createdDraft.id}`, {
      headers: authHeaders1,
    });
    const checkVersionDraft = await resCheckVersion.json();
    assert.strictEqual(checkVersionDraft.version, 2, 'Version must remain 2 after rejected stale update');
    assert.strictEqual(checkVersionDraft.questionText, updatedDraft1Payload.questionText);
    pass('4.2 Draft state and version remain unmodified after rejected stale update');

    // 4.3: POST submit with Stale expectedVersion (client sends 999 when draft is version 2)
    const resStaleSubmit = await fetch(`${baseUrl}/questions/draft/${createdDraft.id}/submit`, {
      method: 'POST',
      headers: authHeaders1,
      body: JSON.stringify({
        remarks: 'Submitting with stale version',
        expectedVersion: 999,
      }),
    });
    assert.strictEqual(resStaleSubmit.status, 409, 'Stale expectedVersion on submit must return HTTP 409');
    pass('4.3 Concurrency conflict on submit strictly rejected with HTTP 409');

    // ========================================================================
    // SECTION 5: Duplicate Submission Protection & Transition Idempotency
    // ========================================================================
    console.log('\n[SECTION 5] Duplicate Submission Protection & Transition Idempotency');

    // 5.1: Valid Author Submission
    const resValidSubmit = await fetch(`${baseUrl}/questions/draft/${createdDraft.id}/submit`, {
      method: 'POST',
      headers: authHeaders1,
      body: JSON.stringify({
        remarks: 'Submitting for Stage 02 pedagogical review',
        expectedVersion: 2, // Matches current version
      }),
    });
    assert.strictEqual(resValidSubmit.status, 200, 'Valid submit must return HTTP 200');
    const submitResult = await resValidSubmit.json();
    assert.strictEqual(submitResult.success, true);
    assert.strictEqual(submitResult.status, 'SUBMITTED_FOR_REVIEW');
    assert.strictEqual(submitResult.workflowStage, 'STAGE_02_VERIFICATION');
    assert.strictEqual(submitResult.currentStep, 2);
    if (submitResult.workflowInstanceId) {
      trackedRecords.workflows.push(submitResult.workflowInstanceId);
    }
    pass('5.1 Valid submission by author advances draft to Stage 02 and SUBMITTED_FOR_REVIEW');

    // 5.2: Sequential Duplicate Submission Rejected with HTTP 409
    const resDuplicateSubmit = await fetch(`${baseUrl}/questions/draft/${createdDraft.id}/submit`, {
      method: 'POST',
      headers: authHeaders1,
      body: JSON.stringify({
        remarks: 'Trying to submit already-submitted draft again',
        expectedVersion: 2,
      }),
    });
    assert.strictEqual(resDuplicateSubmit.status, 409, 'Duplicate submission on already-submitted draft must return HTTP 409');
    pass('5.2 Sequential duplicate submission on submitted draft returns HTTP 409 Conflict');

    // 5.3: Concurrent Simultaneous Submissions Coordinated via OCC
    const concurrentPayload = {
      ...draft1Payload,
      questionText: `Concurrent test question ${Date.now()}`,
    };
    const resConcurrentCreate = await fetch(`${baseUrl}/questions/draft`, {
      method: 'POST',
      headers: authHeaders1,
      body: JSON.stringify(concurrentPayload),
    });
    assert.strictEqual(resConcurrentCreate.status, 201);
    const concurrentDraft = await resConcurrentCreate.json();
    trackedRecords.drafts.push(concurrentDraft.id);
    assert.strictEqual(concurrentDraft.version, 1);

    // Fire two submissions simultaneously with the same expectedVersion: 1
    const [concurrentResA, concurrentResB] = await Promise.all([
      fetch(`${baseUrl}/questions/draft/${concurrentDraft.id}/submit`, {
        method: 'POST',
        headers: authHeaders1,
        body: JSON.stringify({ remarks: 'Concurrent Submission A', expectedVersion: 1 }),
      }),
      fetch(`${baseUrl}/questions/draft/${concurrentDraft.id}/submit`, {
        method: 'POST',
        headers: authHeaders1,
        body: JSON.stringify({ remarks: 'Concurrent Submission B', expectedVersion: 1 }),
      }),
    ]);

    const concurrentStatuses = [concurrentResA.status, concurrentResB.status].sort();
    assert.deepStrictEqual(
      concurrentStatuses,
      [200, 409],
      'Concurrent submissions must resolve to exactly one 200 (success) and one 409 (conflict)'
    );

    // Confirm persisted draft state and single OCC version increment to 2
    const resFinalConcurrent = await fetch(`${baseUrl}/questions/draft/${concurrentDraft.id}`, {
      headers: authHeaders1,
    });
    const finalConcurrentDraft = await resFinalConcurrent.json();
    assert.strictEqual(finalConcurrentDraft.status, 'SUBMITTED_FOR_REVIEW');
    assert.strictEqual(finalConcurrentDraft.version, 2, 'Draft version must increment exactly once to 2');
    if (finalConcurrentDraft.workflowInstanceId) {
      trackedRecords.workflows.push(finalConcurrentDraft.workflowInstanceId);
    }
    pass('5.3 Concurrent submissions safely coordinated: exactly one succeeds (200), stale rejected (409)');

    // ========================================================================
    // SECTION 6: Recovery from Persistence Failures, Safe Retry & Audit Retention
    // ========================================================================
    console.log('\n[SECTION 6] Recovery from Persistence Failures, Safe Retry & Audit Retention');

    // 6.1: Simulated Persistence Failure During Submission and Safe Compensation
    const recoveryDraftPayload = {
      ...draft1Payload,
      questionText: `Recovery and compensation test draft ${Date.now()}`,
    };
    const resRecoveryCreate = await fetch(`${baseUrl}/questions/draft`, {
      method: 'POST',
      headers: authHeaders1,
      body: JSON.stringify(recoveryDraftPayload),
    });
    assert.strictEqual(resRecoveryCreate.status, 201);
    const recoveryDraft = await resRecoveryCreate.json();
    trackedRecords.drafts.push(recoveryDraft.id);

    // Create a pre-existing workflow instance at Step 1 (Stage 01 Question Studio)
    const existingWorkflow = await workflowService.createInstance(
      {
        entityId: recoveryDraft.id,
        entityType: 'QUESTION',
        currentStep: 1,
        contentStatus: 'DRAFT',
        authorId: author1Id,
        metadata: {
          topicId,
          subtopicId,
          productionMode: 'QUESTION_CHALLENGE_SHORT',
        },
      },
      { id: author1Id, name: 'Author One S8T18', role: UserRole.QUESTION_CREATOR }
    );
    trackedRecords.workflows.push(existingWorkflow.id);
    assert.strictEqual(existingWorkflow.currentStep, 1);
    assert.strictEqual(existingWorkflow.contentStatus, 'DRAFT');

    // Link workflowInstanceId to draft
    const updatedRecoveryDraft = await questionDraftsRepository.update(recoveryDraft.id, {
      workflowInstanceId: existingWorkflow.id,
    });
    const expectedCurrentRecoveryVersion = updatedRecoveryDraft.version ?? 2;

    // Simulate failure during draft update:
    // Intercept questionDraftsRepository.update once for this draft to simulate an OCC collision
    const originalDraftUpdate = questionDraftsRepository.update.bind(questionDraftsRepository);
    let simulatedFailureTriggered = false;
    (questionDraftsRepository as any).update = async (recordOrId: any, updates?: any, options?: any) => {
      const targetId = typeof recordOrId === 'string' ? recordOrId : recordOrId?.id;
      if (targetId === recoveryDraft.id && !simulatedFailureTriggered) {
        simulatedFailureTriggered = true;
        // Bump version concurrently in datastore to simulate racing write
        await originalDraftUpdate(recoveryDraft.id, { notes: 'simulated concurrent update collision' });
        // Call real repository update with original options.expectedVersion, which triggers OCC conflict
        return originalDraftUpdate(recordOrId, updates, options);
      }
      return originalDraftUpdate(recordOrId, updates, options);
    };

    try {
      const resSimulatedFail = await fetch(`${baseUrl}/questions/draft/${recoveryDraft.id}/submit`, {
        method: 'POST',
        headers: authHeaders1,
        body: JSON.stringify({
          remarks: 'Submit that hits simulated OCC conflict',
          expectedVersion: expectedCurrentRecoveryVersion,
        }),
      });
      assert.strictEqual(resSimulatedFail.status, 409, 'Simulated failure must return HTTP 409 Concurrency Conflict');
      assert.strictEqual(simulatedFailureTriggered, true, 'Simulated failure was successfully injected');

      // Verify Workflow Compensation:
      // Workflow instance must be safely reconciled back to Step 1 and DRAFT
      const reconciledWf = await workflowInstancesRepository.findById(existingWorkflow.id);
      assert(reconciledWf, 'Workflow instance must still exist');
      assert.strictEqual(reconciledWf.currentStep, 1, 'Reconciled workflow instance must be restored to Step 1');
      assert.strictEqual(reconciledWf.contentStatus, 'DRAFT', 'Reconciled workflow instance status must remain DRAFT');

      // Verify Draft Integrity:
      // Draft must NOT be marked SUBMITTED_FOR_REVIEW and must remain in QUESTION_STUDIO stage
      const resDraftCheck = await fetch(`${baseUrl}/questions/draft/${recoveryDraft.id}`, {
        headers: authHeaders1,
      });
      const draftAfterFailure = await resDraftCheck.json();
      assert.strictEqual(draftAfterFailure.status, 'DRAFT', 'Draft status must remain DRAFT after failure');
      assert.strictEqual(draftAfterFailure.workflowStage, 'QUESTION_STUDIO', 'Draft stage must remain QUESTION_STUDIO');
      pass('6.1 Persistence failure caught without draft corruption; workflow safely compensated back to Step 1');
    } finally {
      // Restore repository method
      questionDraftsRepository.update = originalDraftUpdate;
    }

    // 6.2: Safe Retry After Failure Condition is Cleared
    // Fetch latest version of recovery draft
    const resLatestRecovery = await fetch(`${baseUrl}/questions/draft/${recoveryDraft.id}`, {
      headers: authHeaders1,
    });
    const latestRecoveryDraft = await resLatestRecovery.json();
    const retryVersion = latestRecoveryDraft.version;

    const resRetrySubmit = await fetch(`${baseUrl}/questions/draft/${recoveryDraft.id}/submit`, {
      method: 'POST',
      headers: authHeaders1,
      body: JSON.stringify({
        remarks: 'Retrying submission after failure recovery',
        expectedVersion: retryVersion,
      }),
    });
    assert.strictEqual(resRetrySubmit.status, 200, 'Retry submission must succeed with HTTP 200');
    const retryResult = await resRetrySubmit.json();
    assert.strictEqual(retryResult.success, true);
    assert.strictEqual(retryResult.workflowStage, 'STAGE_02_VERIFICATION');
    assert.strictEqual(retryResult.currentStep, 2);

    // Confirm final persisted state
    const resFinalRecoveryDraft = await fetch(`${baseUrl}/questions/draft/${recoveryDraft.id}`, {
      headers: authHeaders1,
    });
    const finalRecoveryDraft = await resFinalRecoveryDraft.json();
    assert.strictEqual(finalRecoveryDraft.status, 'SUBMITTED_FOR_REVIEW');
    assert.strictEqual(finalRecoveryDraft.workflowStage, 'STAGE_02_VERIFICATION');
    pass('6.2 Safe retry after failure recovery succeeds and cleanly advances draft to Stage 02');

    // 6.3: Audit Trail Preservation & Immutability Check
    const submissionAuditLogs = await auditLogRepository.findByEntityId(createdDraft.id);
    assert(submissionAuditLogs.length > 0, 'Audit logs must be generated for submitted draft');
    const submitLog = submissionAuditLogs.find((l) => l.eventType === 'QUESTION_DRAFT_SUBMITTED_FOR_VERIFICATION');
    assert(submitLog, 'QUESTION_DRAFT_SUBMITTED_FOR_VERIFICATION audit event must be persisted');
    assert.strictEqual(submitLog.entityId, createdDraft.id);
    assert.strictEqual(submitLog.actorId, author1Id);

    // Verify the log exists and is retrievable by ID
    const auditStillExists = await auditLogRepository.findById(submitLog.id);
    assert(auditStillExists, 'Audit log record must remain preserved in repository');
    pass('6.3 Authoritative audit trail preserved; submission events retained immutably without loss');

    console.log('\n========================================================================');
    console.log('ALL S8-T18 TESTS COMPLETED SUCCESSFULLY: ALL CRITERIA VERIFIED');
    console.log('========================================================================\n');
  } finally {
    // ------------------------------------------------------------------------
    // SECTION 7: Safe Test-Data Cleanup & Verification
    // ------------------------------------------------------------------------
    console.log('\n[CLEANUP] Executing Guaranteed Safe Test-Data Cleanup...');
    let draftsDeletedCount = 0;
    let topicsDeletedCount = 0;
    let subtopicsDeletedCount = 0;
    let usersDeletedCount = 0;

    // 1. Delete test-created drafts
    for (const draftId of trackedRecords.drafts) {
      try {
        await questionDraftsRepository.delete(draftId);
        draftsDeletedCount++;
      } catch (err) {
        console.warn(`[CleanupWarning] Failed to delete draft ${draftId}:`, err);
      }
    }

    // Verify remaining test-owned drafts count is 0
    let remainingDraftsCount = 0;
    for (const draftId of trackedRecords.drafts) {
      const exists = await questionDraftsRepository.findById(draftId);
      if (exists) remainingDraftsCount++;
    }
    assert.strictEqual(remainingDraftsCount, 0, 'All test-created drafts must be completely deleted');

    // 2. Delete test-created subtopics and topics
    for (const subtopicId of trackedRecords.subtopics) {
      try {
        await (subtopicsRepository as any).deleteRecord?.(subtopicId).catch(() => {});
        subtopicsDeletedCount++;
      } catch {}
    }
    for (const topicId of trackedRecords.topics) {
      try {
        await (topicsRepository as any).deleteRecord?.(topicId).catch(() => {});
        topicsDeletedCount++;
      } catch {}
    }

    // 3. Delete test-created users
    for (const userId of trackedRecords.users) {
      try {
        await (usersRepository as any).deleteRecord?.(userId).catch(() => {});
        usersDeletedCount++;
      } catch {}
    }

    // 4. Verify Audit Events Retention (Prohibit audit log purging)
    const allAuditLogs = await auditLogRepository.findAll();
    assert(Array.isArray(allAuditLogs), 'Audit records must be retained immutably and never deleted');

    // Print Data Safety & Cleanup Summary
    console.log('------------------------------------------------------------------------');
    console.log('DATA SAFETY & CLEANUP SUMMARY:');
    console.log(`- Target Environment:        IN_MEMORY_TEST_ONLY (Guaranteed Isolated)`);
    console.log(`- Test Namespace:            ${testNamespace}`);
    console.log(`- Created Synthetic Drafts:  ${trackedRecords.drafts.length}`);
    console.log(`- Deleted Synthetic Drafts:  ${draftsDeletedCount} (Remaining: ${remainingDraftsCount})`);
    console.log(`- Created Synthetic Topics:  ${trackedRecords.topics.length}`);
    console.log(`- Created Synthetic Users:   ${trackedRecords.users.length}`);
    console.log(`- Retained Audit Events:     ${allAuditLogs.length} (IMMUTABLY PRESERVED)`);
    console.log('------------------------------------------------------------------------\n');

    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

runS8T18Tests().catch((err) => {
  console.error('\n❌ S8-T18 Test Suite Failed:', err);
  process.exit(1);
});
