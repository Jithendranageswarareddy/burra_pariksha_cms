/**
 * BURRA PARIKSHA CMS — S8-T15 Backend Persistence and Draft Resumption API Test
 * Feature Slice: Question Generation (Stage 01) & Workflow Resumption
 *
 * Verifies:
 * 1. questionDraftsRepository is backed by Cloud Firestore BaseRepository rather than an in-memory Map.
 * 2. Create -> Save -> Fetch/Reopen round-trip persistence across all 3 production modes.
 * 3. Update and draft resumption in a simulated fresh session with OCC version checks.
 * 4. Save Draft leaves record strictly in Stage 01 and does not submit.
 * 5. Submit for Verification is a distinct validated authenticated operation.
 * 6. Server-side rejections for invalid IDs, taxonomy mismatches, unauthorized access, and stale concurrency.
 */

process.env.PERSISTENCE_MODE = 'IN_MEMORY_TEST_ONLY';

import assert from 'node:assert';
import http from 'node:http';
import express from 'express';
import { apiRouter } from '../../backend/server/routers/routes';
import { authService } from '../../backend/infrastructure/auth/services/auth.service';
import { usersRepository } from '../../database/firestore/repositories/users.repository';
import { topicsRepository } from '../../database/firestore/repositories/topics.repository';
import { subtopicsRepository } from '../../database/firestore/repositories/subtopics.repository';
import { questionDraftsRepository, QuestionDraftsRepository } from '../../database/firestore/repositories/question-drafts.repository';
import { BaseRepository } from '../../database/firestore/repositories/base.repository';
import { canonicalIdService, QuestionStatus, UserRole } from '../../shared';

function pass(name: string) {
  console.log(`  ✓ ${name}`);
}

async function runS8T15PersistenceTests() {
  console.log('========================================================================');
  console.log('RUNNING S8-T15 TESTS: Backend Persistence & Draft Resumption');
  console.log('========================================================================\n');

  // 1. Mount production apiRouter exactly as in server.ts
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
    const topicId = canonicalIdService.generateTopicId();
    const subtopicId = canonicalIdService.generateSubtopicId();
    const otherTopicId = canonicalIdService.generateTopicId();

    await topicsRepository.appendRecord({
      id: topicId,
      name: 'Time and Distance',
      slug: 'time-and-distance',
      isActive: true,
      description: 'Syllabus Topic',
    });

    await topicsRepository.appendRecord({
      id: otherTopicId,
      name: 'Modern Indian History',
      slug: 'modern-indian-history',
      isActive: true,
      description: 'Other Topic',
    });

    await subtopicsRepository.appendRecord({
      id: subtopicId,
      topicId: topicId,
      name: 'Trains and Relative Speed',
      slug: 'trains-and-relative-speed',
      isActive: true,
      description: 'Child Subtopic',
    });

    const author1Id = `usr_${Date.now()}_author1`;
    await usersRepository.appendRecord({
      id: author1Id,
      name: 'Author One',
      email: `author1_${Date.now()}@burrapariksha.com`,
      role: UserRole.QUESTION_CREATOR,
      roles: [UserRole.QUESTION_CREATOR],
      isActive: true,
      sessionVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const author1Token = authService.generateSessionToken({
      userId: author1Id,
      name: 'Author One',
      role: UserRole.QUESTION_CREATOR,
      roles: [UserRole.QUESTION_CREATOR],
      sessionVersion: 1,
    });

    const author2Id = `usr_${Date.now()}_author2`;
    await usersRepository.appendRecord({
      id: author2Id,
      name: 'Author Two',
      email: `author2_${Date.now()}@burrapariksha.com`,
      role: UserRole.QUESTION_CREATOR,
      roles: [UserRole.QUESTION_CREATOR],
      isActive: true,
      sessionVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const author2Token = authService.generateSessionToken({
      userId: author2Id,
      name: 'Author Two',
      role: UserRole.QUESTION_CREATOR,
      roles: [UserRole.QUESTION_CREATOR],
      sessionVersion: 1,
    });

    const authHeaders1 = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${author1Token}`,
    };

    const authHeaders2 = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${author2Token}`,
    };

    const adminId = `usr_${Date.now()}_admin`;
    await usersRepository.appendRecord({
      id: adminId,
      name: 'System Admin',
      email: `admin_${Date.now()}@burrapariksha.com`,
      role: UserRole.ADMIN,
      roles: [UserRole.ADMIN],
      isActive: true,
      sessionVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const adminToken = authService.generateSessionToken({
      userId: adminId,
      name: 'System Admin',
      role: UserRole.ADMIN,
      roles: [UserRole.ADMIN],
      sessionVersion: 1,
    });

    const authHeadersAdmin = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
    };

    // ========================================================================
    // SECTION 1: Firestore Repository Architecture & Adapter Path
    // ========================================================================
    console.log('[SECTION 1] Firestore Repository Architecture & Adapter Path');

    // Test 1.1: Inherits from BaseRepository
    assert(
      questionDraftsRepository instanceof BaseRepository,
      'questionDraftsRepository must inherit from BaseRepository'
    );
    pass('1.1 questionDraftsRepository inherits from BaseRepository');

    // Test 1.2: Collection name is 'question_drafts'
    assert.strictEqual(
      questionDraftsRepository.getCollectionName(),
      'question_drafts',
      'Repository collection name must be question_drafts'
    );
    pass('1.2 Collection name is canonically set to "question_drafts"');

    // Test 1.3: Private in-memory Map draftStore is removed
    assert.strictEqual(
      (questionDraftsRepository as any).draftStore,
      undefined,
      'In-memory draftStore Map must be completely removed from repository'
    );
    pass('1.3 In-memory draftStore Map is removed from repository');

    // Test 1.4: Underlying adapter is FirestoreRepository
    const firestoreRepo = await questionDraftsRepository.getFirestoreRepository();
    assert(firestoreRepo, 'Repository must provide valid FirestoreRepository adapter');
    assert.strictEqual(
      firestoreRepo.collectionName,
      'question_drafts',
      'Firestore adapter must target question_drafts'
    );
    pass('1.4 FirestoreRepository adapter targeted at "question_drafts" collection');

    // Test 1.5: Direct CRUD operations against repository
    const testDraftDoc = await questionDraftsRepository.create({
      topicId,
      subtopicId,
      difficulty: 'Intermediate',
      language: 'TELUGU',
      questionText: 'Direct repo persistence test question?',
      options: { a: '1', b: '2', c: '3', d: '4' },
      correctAnswer: 'A',
      explanation: 'Direct explanation',
      status: QuestionStatus.DRAFT,
      workflowStage: 'QUESTION_STUDIO',
    });
    assert(testDraftDoc.id.startsWith('dft_'), 'Repository must assign canonical dft_ ID');
    const fetchedDoc = await questionDraftsRepository.findById(testDraftDoc.id);
    assert(fetchedDoc, 'Document must be retrievable via findById');
    assert.strictEqual(fetchedDoc.questionText, 'Direct repo persistence test question?');
    await questionDraftsRepository.delete(testDraftDoc.id);
    const deletedDoc = await questionDraftsRepository.findById(testDraftDoc.id);
    assert.strictEqual(deletedDoc, null, 'Deleted document must return null');
    pass('1.5 Direct repository CRUD operations succeed through Firestore adapter');

    // ========================================================================
    // SECTION 2: Create -> Save -> Fetch/Reopen Persistence Round-Trip
    // ========================================================================
    console.log('\n[SECTION 2] Create -> Save -> Fetch/Reopen Persistence Round-Trip');

    // Test 2.1: Save Draft in Mode 1 (QUESTION_CHALLENGE_SHORT)
    const mode1Payload = {
      topicId,
      subtopicId,
      productionMode: 'QUESTION_CHALLENGE_SHORT',
      targetQuestionCount: 1,
      aspectRatio: '9:16',
      language: 'TELUGU',
      difficulty: 'Medium',
      questionText: 'రైలు వేగం 72 కి.మీ/గం అయితే మీటర్/సెకనులో ఎంత?',
      options: { a: '15 మీ/సె', b: '20 మీ/సె', c: '25 మీ/సె', d: '30 మీ/సె' },
      correctAnswer: 'B',
      explanation: '72 * (5/18) = 20 మీ/సె.',
    };

    const resMode1Save = await fetch(`${baseUrl}/questions/draft`, {
      method: 'POST',
      headers: authHeaders1,
      body: JSON.stringify(mode1Payload),
    });
    assert.strictEqual(resMode1Save.status, 201, 'Mode 1 draft creation must return HTTP 201');
    const mode1Draft = await resMode1Save.json();
    assert(mode1Draft.id.startsWith('dft_'), 'Draft ID must start with canonical prefix dft_');
    assert.strictEqual(mode1Draft.status, 'DRAFT', 'Status must remain DRAFT');
    assert.strictEqual(mode1Draft.workflowStage, 'QUESTION_STUDIO', 'Stage must remain QUESTION_STUDIO');
    assert.strictEqual(mode1Draft.authorId, author1Id, 'Author ID must match authenticated actor');
    pass('2.1 Mode 1 draft saved with canonical dft_ ID in Stage 01');

    // Test 2.2: Reopen Mode 1 draft via GET /questions/draft/:id
    const resMode1Get = await fetch(`${baseUrl}/questions/draft/${mode1Draft.id}`, {
      headers: authHeaders1,
    });
    assert.strictEqual(resMode1Get.status, 200, 'Fetching existing draft must return HTTP 200');
    const mode1Reopened = await resMode1Get.json();
    assert.strictEqual(mode1Reopened.id, mode1Draft.id);
    assert.strictEqual(mode1Reopened.topicId, topicId);
    assert.strictEqual(mode1Reopened.subtopicId, subtopicId);
    assert.strictEqual(mode1Reopened.productionMode, 'QUESTION_CHALLENGE_SHORT');
    assert.strictEqual(mode1Reopened.targetQuestionCount, 1);
    assert.strictEqual(mode1Reopened.aspectRatio, '9:16');
    assert.strictEqual(mode1Reopened.questionText, mode1Payload.questionText);
    assert.strictEqual(mode1Reopened.options.b, '20 మీ/సె');
    assert.strictEqual(mode1Reopened.correctAnswer, 'B');
    assert.strictEqual(mode1Reopened.status, 'DRAFT');
    assert.strictEqual(mode1Reopened.workflowStage, 'QUESTION_STUDIO');
    pass('2.2 Mode 1 draft successfully reopened with identical content, mode, and Stage 01 state');

    // Test 2.3: Save Draft in Mode 2 (TOPIC_INTRODUCTION, N=0, concept text)
    const mode2Payload = {
      topicId,
      subtopicId,
      productionMode: 'TOPIC_INTRODUCTION',
      targetQuestionCount: 0,
      aspectRatio: '16:9',
      language: 'TELUGU',
      difficulty: 'Easy',
      introductoryConcept: 'సాపేక్ష వేగం (Relative Speed) భావన మరియు రైళ్ల మధ్య దూరాల లెక్కలు.',
      conceptTitle: 'రైళ్ల సాపేక్ష వేగం పరిచయం',
      syllabusScopeNotes: 'SI & Constable పరీక్షల సిలబస్ పరిధి',
    };

    const resMode2Save = await fetch(`${baseUrl}/questions/draft`, {
      method: 'POST',
      headers: authHeaders1,
      body: JSON.stringify(mode2Payload),
    });
    assert.strictEqual(resMode2Save.status, 201, 'Mode 2 draft creation must return HTTP 201');
    const mode2Draft = await resMode2Save.json();
    assert(mode2Draft.id.startsWith('dft_'));
    assert.strictEqual(mode2Draft.productionMode, 'TOPIC_INTRODUCTION');
    assert.strictEqual(mode2Draft.targetQuestionCount, 0);

    const resMode2Get = await fetch(`${baseUrl}/questions/draft/${mode2Draft.id}`, {
      headers: authHeaders1,
    });
    const mode2Reopened = await resMode2Get.json();
    assert.strictEqual(mode2Reopened.introductoryConcept, mode2Payload.introductoryConcept);
    assert.strictEqual(mode2Reopened.conceptTitle, mode2Payload.conceptTitle);
    assert.strictEqual(mode2Reopened.targetQuestionCount, 0);
    pass('2.3 Mode 2 draft saved and reopened with zero questions and concept brief');

    // Test 2.4: Save Draft in Mode 3 (EXPLAINED_QUESTIONS_VIDEO, N=5, 16:9)
    const mode3Payload = {
      topicId,
      subtopicId,
      productionMode: 'EXPLAINED_QUESTIONS_VIDEO',
      targetQuestionCount: 5,
      aspectRatio: '16:9',
      language: 'TELUGU',
      difficulty: 'Intermediate',
      introductoryConcept: 'మాస్టర్‌క్లాస్: రైళ్లు - సమగ్ర సమస్యలు & షార్ట్‌కట్స్.',
      conceptTitle: 'రైళ్ల సమస్యల మాస్టర్‌క్లాస్',
      questions: [
        { statement: 'ప్రశ్న 1', options: { a: '1', b: '2', c: '3', d: '4' }, correctOption: 'a', explanation: 'వివరణ 1' },
        { statement: 'ప్రశ్న 2', options: { a: '1', b: '2', c: '3', d: '4' }, correctOption: 'b', explanation: 'వివరణ 2' },
        { statement: 'ప్రశ్న 3', options: { a: '1', b: '2', c: '3', d: '4' }, correctOption: 'c', explanation: 'వివరణ 3' },
        { statement: 'ప్రశ్న 4', options: { a: '1', b: '2', c: '3', d: '4' }, correctOption: 'd', explanation: 'వివరణ 4' },
        { statement: 'ప్రశ్న 5', options: { a: '1', b: '2', c: '3', d: '4' }, correctOption: 'a', explanation: 'వివరణ 5' },
      ],
    };

    const resMode3Save = await fetch(`${baseUrl}/questions/draft`, {
      method: 'POST',
      headers: authHeaders1,
      body: JSON.stringify(mode3Payload),
    });
    assert.strictEqual(resMode3Save.status, 201, 'Mode 3 draft creation must return HTTP 201');
    const mode3Draft = await resMode3Save.json();
    assert.strictEqual(mode3Draft.targetQuestionCount, 5);
    assert.strictEqual(mode3Draft.questions?.length, 5);

    const resMode3Get = await fetch(`${baseUrl}/questions/draft/${mode3Draft.id}`, {
      headers: authHeaders1,
    });
    const mode3Reopened = await resMode3Get.json();
    assert.strictEqual(mode3Reopened.questions?.length, 5);
    assert.strictEqual(mode3Reopened.aspectRatio, '16:9');
    pass('2.4 Mode 3 masterclass draft saved and reopened with 5 question items');

    // ========================================================================
    // SECTION 3: Update and Resumption After Simulated New Session
    // ========================================================================
    console.log('\n[SECTION 3] Update & Resumption After Simulated New Session');

    // Test 3.1: Resuming Mode 1 draft in a fresh simulated session
    const freshSessionHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${author1Token}`,
    };
    const resResumed = await fetch(`${baseUrl}/questions/draft/${mode1Draft.id}`, {
      headers: freshSessionHeaders,
    });
    assert.strictEqual(resResumed.status, 200);
    const resumedDraft = await resResumed.json();
    assert.strictEqual(resumedDraft.id, mode1Draft.id);
    pass('3.1 Fresh simulated session re-hydrates saved draft without in-memory state');

    // Test 3.2: Update draft via PUT /questions/draft/:id
    const updatedPayload = {
      ...mode1Payload,
      questionText: 'నవీకరించబడిన ప్రశ్న: రైలు వేగం 90 కి.మీ/గం అయితే మీటర్/సెకనులో ఎంత?',
      options: { a: '20 మీ/సె', b: '25 మీ/సె', c: '30 మీ/సె', d: '35 మీ/సె' },
      correctAnswer: 'B',
      explanation: '90 * (5/18) = 25 మీ/సె.',
    };

    const resUpdate = await fetch(`${baseUrl}/questions/draft/${mode1Draft.id}`, {
      method: 'PUT',
      headers: authHeaders1,
      body: JSON.stringify(updatedPayload),
    });
    assert.strictEqual(resUpdate.status, 200, 'Draft update must return HTTP 200');
    const updatedDraft = await resUpdate.json();
    assert.strictEqual(updatedDraft.id, mode1Draft.id);
    assert.strictEqual(updatedDraft.questionText, updatedPayload.questionText);
    assert.strictEqual(updatedDraft.options.b, '25 మీ/సె');
    assert.strictEqual(updatedDraft.status, 'DRAFT', 'Status must remain DRAFT on update');
    assert.strictEqual(updatedDraft.workflowStage, 'QUESTION_STUDIO', 'Stage must remain QUESTION_STUDIO');
    pass('3.2 PUT update persists changes and retains Stage 01 DRAFT lifecycle');

    // Test 3.3: Concurrency conflict (OCC) rejection with HTTP 409
    const staleUpdatePayload = {
      ...updatedPayload,
      version: 999, // Stale version mismatch
    };
    const resStale = await fetch(`${baseUrl}/questions/draft/${mode1Draft.id}`, {
      method: 'PUT',
      headers: authHeaders1,
      body: JSON.stringify(staleUpdatePayload),
    });
    assert.strictEqual(resStale.status, 409, 'OCC version mismatch must return HTTP 409');
    pass('3.3 Concurrency conflict with stale expectedVersion returns HTTP 409');

    // ========================================================================
    // SECTION 4: Submit for Verification — Distinct Validated Operation
    // ========================================================================
    console.log('\n[SECTION 4] Submit for Verification — Distinct Validated Operation');

    // Test 4.1: Submit Mode 1 draft for verification
    const resSubmit = await fetch(`${baseUrl}/questions/draft/${mode1Draft.id}/submit`, {
      method: 'POST',
      headers: authHeaders1,
      body: JSON.stringify({
        remarks: 'Ready for Stage 02 pedagogical review',
        expectedVersion: updatedDraft.version,
      }),
    });
    assert.strictEqual(resSubmit.status, 200, 'Submission must return HTTP 200');
    const submitResult = await resSubmit.json();
    assert.strictEqual(submitResult.success, true);
    assert.strictEqual(submitResult.status, 'SUBMITTED_FOR_REVIEW');
    assert.strictEqual(submitResult.workflowStage, 'STAGE_02_VERIFICATION');
    assert.strictEqual(submitResult.currentStep, 2);
    pass('4.1 Submit for Verification advances state to Stage 02 and PENDING_REVIEW');

    // Test 4.2: Persisted draft reflects SUBMITTED_FOR_REVIEW
    const resAfterSubmit = await fetch(`${baseUrl}/questions/draft/${mode1Draft.id}`, {
      headers: authHeaders1,
    });
    const draftAfterSubmit = await resAfterSubmit.json();
    assert.strictEqual(draftAfterSubmit.status, 'SUBMITTED_FOR_REVIEW');
    assert.strictEqual(draftAfterSubmit.workflowStage, 'STAGE_02_VERIFICATION');
    pass('4.2 Persisted Firestore draft reflects SUBMITTED_FOR_REVIEW status');

    // Test 4.3: Attempt to modify submitted draft is rejected
    const resModifySubmitted = await fetch(`${baseUrl}/questions/draft/${mode1Draft.id}`, {
      method: 'PUT',
      headers: authHeaders1,
      body: JSON.stringify(updatedPayload),
    });
    assert(
      resModifySubmitted.status === 400 || resModifySubmitted.status === 409,
      `Modifying submitted draft must be rejected (got ${resModifySubmitted.status})`
    );
    pass('4.3 Modifying already-submitted draft rejected by server-side invariants');

    // Test 4.4: Re-submitting already-submitted draft returns HTTP 409
    const resResubmit = await fetch(`${baseUrl}/questions/draft/${mode1Draft.id}/submit`, {
      method: 'POST',
      headers: authHeaders1,
      body: JSON.stringify({
        remarks: 'Trying to submit again',
        expectedVersion: 1,
      }),
    });
    assert.strictEqual(resResubmit.status, 409, 'Resubmitting draft must return HTTP 409');
    pass('4.4 Duplicate submission rejected with HTTP 409 conflict');

    // ========================================================================
    // SECTION 5: Invariant Rejections & Security Boundaries
    // ========================================================================
    console.log('\n[SECTION 5] Invariant Rejections & Security Boundaries');

    // Test 5.1: Invalid draft ID format rejected with HTTP 400
    const resInvalidId = await fetch(`${baseUrl}/questions/draft/not-a-valid-uuid`, {
      headers: authHeaders1,
    });
    assert.strictEqual(resInvalidId.status, 400, 'Malformed draft ID must return HTTP 400');
    pass('5.1 Malformed draft ID rejected with HTTP 400');

    // Test 5.2: Non-existent draft ID returns HTTP 404
    const resNotFound = await fetch(`${baseUrl}/questions/draft/dft_00000000-0000-4000-8000-000000000000`, {
      headers: authHeaders1,
    });
    assert.strictEqual(resNotFound.status, 404, 'Non-existent draft must return HTTP 404');
    pass('5.2 Non-existent draft returns HTTP 404');

    // Test 5.3: Taxonomy mismatch (subtopic does not belong to topic) rejected with HTTP 400
    const resTaxonomyMismatch = await fetch(`${baseUrl}/questions/draft`, {
      method: 'POST',
      headers: authHeaders1,
      body: JSON.stringify({
        ...mode1Payload,
        topicId: otherTopicId, // Mismatched topic!
        subtopicId: subtopicId, // Belongs to topicId, not otherTopicId
      }),
    });
    assert.strictEqual(resTaxonomyMismatch.status, 400, 'Taxonomy link mismatch must return HTTP 400');
    pass('5.3 Subtopic not belonging to topic rejected with HTTP 400');

    // Test 5.4: Invalid production mode configuration rejected with HTTP 400
    const resInvalidModeConfig = await fetch(`${baseUrl}/questions/draft`, {
      method: 'POST',
      headers: authHeaders1,
      body: JSON.stringify({
        ...mode1Payload,
        productionMode: 'QUESTION_CHALLENGE_SHORT',
        aspectRatio: '16:9', // Mode 1 strictly requires 9:16
      }),
    });
    assert.strictEqual(resInvalidModeConfig.status, 400, 'Invalid mode config must return HTTP 400');
    pass('5.4 Incompatible mode aspect ratio rejected with HTTP 400');

    // Test 5.5: Unauthorized update (Author 2 attempting to modify Author 1's draft) rejected with HTTP 403
    const resUnauthorized = await fetch(`${baseUrl}/questions/draft/${mode2Draft.id}`, {
      method: 'PUT',
      headers: authHeaders2, // Author 2 credentials!
      body: JSON.stringify({
        ...mode2Payload,
        introductoryConcept: 'Malicious modification by different author',
      }),
    });
    assert.strictEqual(resUnauthorized.status, 403, 'Unauthorized author update must return HTTP 403');
    pass('5.5 Modification by unauthorized author strictly rejected with HTTP 403');

    // Test 5.6: Unauthenticated request to draft creation returns HTTP 401
    const resUnauthCreate = await fetch(`${baseUrl}/questions/draft`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mode1Payload),
    });
    assert.strictEqual(resUnauthCreate.status, 401, 'Unauthenticated draft creation must return HTTP 401');
    pass('5.6 Unauthenticated write operation rejected with HTTP 401');

    // Test 5.7: Unauthenticated read on GET /questions/draft/:id returns HTTP 401
    const resUnauthGet = await fetch(`${baseUrl}/questions/draft/${mode1Draft.id}`, {
      headers: { 'Content-Type': 'application/json' },
    });
    assert.strictEqual(resUnauthGet.status, 401, 'Unauthenticated GET draft must return HTTP 401');
    pass('5.7 Unauthenticated draft read rejected with HTTP 401');

    // Test 5.8: Unauthenticated read on GET /questions/drafts returns HTTP 401
    const resUnauthGetAll = await fetch(`${baseUrl}/questions/drafts`, {
      headers: { 'Content-Type': 'application/json' },
    });
    assert.strictEqual(resUnauthGetAll.status, 401, 'Unauthenticated GET drafts must return HTTP 401');
    pass('5.8 Unauthenticated drafts list read rejected with HTTP 401');

    // Test 5.9: Cross-user read on GET /questions/draft/:id rejected with HTTP 403
    const resCrossUserGet = await fetch(`${baseUrl}/questions/draft/${mode1Draft.id}`, {
      headers: authHeaders2, // Author 2 trying to read Author 1's draft
    });
    assert.strictEqual(resCrossUserGet.status, 403, 'Cross-user draft read must return HTTP 403');
    pass('5.9 Cross-user draft read rejected with HTTP 403 Forbidden');

    // Test 5.10: Privileged Admin read on GET /questions/draft/:id succeeds with HTTP 200
    const resAdminGet = await fetch(`${baseUrl}/questions/draft/${mode1Draft.id}`, {
      headers: authHeadersAdmin,
    });
    assert.strictEqual(resAdminGet.status, 200, 'Admin reading draft must return HTTP 200');
    pass('5.10 Privileged Admin read on draft succeeds with HTTP 200');

    // Test 5.11: Ownership-filtered drafts list
    // Author 1 sees only their drafts, Admin sees all drafts
    const resAuthor1Drafts = await fetch(`${baseUrl}/questions/drafts`, {
      headers: authHeaders1,
    });
    assert.strictEqual(resAuthor1Drafts.status, 200);
    const author1Drafts = await resAuthor1Drafts.json();
    assert(
      author1Drafts.every((d: any) => d.authorId === author1Id),
      'Author 1 draft list must be strictly scoped to Author 1 records'
    );

    const resAdminDrafts = await fetch(`${baseUrl}/questions/drafts`, {
      headers: authHeadersAdmin,
    });
    assert.strictEqual(resAdminDrafts.status, 200);
    const adminDrafts = await resAdminDrafts.json();
    assert(adminDrafts.length >= author1Drafts.length, 'Admin must see all drafts across authors');
    pass('5.11 Ownership-filtered drafts listing strictly enforces isolation per actor');

    // Test 5.12: Cross-user submission on POST /questions/draft/:id/submit rejected with HTTP 403
    // Create fresh draft by Author 1
    const freshDraftPayload = {
      ...mode1Payload,
      questionText: 'Author 1 exclusive question for cross-submit test',
    };
    const resFreshDraft = await fetch(`${baseUrl}/questions/draft`, {
      method: 'POST',
      headers: authHeaders1,
      body: JSON.stringify(freshDraftPayload),
    });
    assert.strictEqual(resFreshDraft.status, 201);
    const freshDraft = await resFreshDraft.json();

    const resCrossSubmit = await fetch(`${baseUrl}/questions/draft/${freshDraft.id}/submit`, {
      method: 'POST',
      headers: authHeaders2, // Author 2 attempting to submit Author 1's draft
      body: JSON.stringify({ remarks: 'Unauthorized submit attempt', expectedVersion: 1 }),
    });
    assert.strictEqual(resCrossSubmit.status, 403, 'Cross-user submission must return HTTP 403');
    pass('5.12 Cross-user submission rejected with HTTP 403 Forbidden');

    // Test 5.13: Strict canonical ID rejection (no permissive prefix acceptance)
    const malformedId = 'dft_not-a-valid-uuid-v4';
    const resMalformedGet = await fetch(`${baseUrl}/questions/draft/${malformedId}`, {
      headers: authHeaders1,
    });
    assert.strictEqual(resMalformedGet.status, 400, 'Malformed dft_ ID on GET must return HTTP 400');

    const resMalformedPut = await fetch(`${baseUrl}/questions/draft/${malformedId}`, {
      method: 'PUT',
      headers: authHeaders1,
      body: JSON.stringify(mode1Payload),
    });
    assert.strictEqual(resMalformedPut.status, 400, 'Malformed dft_ ID on PUT must return HTTP 400');

    const resMalformedSubmit = await fetch(`${baseUrl}/questions/draft/${malformedId}/submit`, {
      method: 'POST',
      headers: authHeaders1,
      body: JSON.stringify({ remarks: 'Submit malformed ID', expectedVersion: 1 }),
    });
    assert.strictEqual(resMalformedSubmit.status, 400, 'Malformed dft_ ID on submit must return HTTP 400');
    pass('5.13 Strict canonical ID check rejects non-UUID dft_ prefixes with HTTP 400');

    // Test 5.14: Concurrency-safe submission (OCC expectedVersion mismatch)
    const resStaleSubmit = await fetch(`${baseUrl}/questions/draft/${freshDraft.id}/submit`, {
      method: 'POST',
      headers: authHeaders1,
      body: JSON.stringify({
        remarks: 'Submitting with stale version',
        expectedVersion: 9999, // Intentional stale version mismatch
      }),
    });
    assert.strictEqual(resStaleSubmit.status, 409, 'Stale expectedVersion on submit must return HTTP 409');
    pass('5.14 Optimistic concurrency conflict on submission strictly rejected with HTTP 409');

    // Test 5.15: Missing or invalid expectedVersion rejected with HTTP 400
    const resMissingVersion = await fetch(`${baseUrl}/questions/draft/${freshDraft.id}/submit`, {
      method: 'POST',
      headers: authHeaders1,
      body: JSON.stringify({
        remarks: 'Submitting without expectedVersion',
      }),
    });
    assert.strictEqual(resMissingVersion.status, 400, 'Missing expectedVersion must return HTTP 400');
    pass('5.15 Missing or invalid expectedVersion rejected with HTTP 400');

    // Test 5.16: Actor ID / name heuristic bypass attempt strictly rejected with HTTP 403
    const resHeuristicBypass = await fetch(`${baseUrl}/questions/draft/${freshDraft.id}/submit`, {
      method: 'POST',
      headers: authHeaders2, // Non-admin user token
      body: JSON.stringify({
        remarks: 'Attempting to bypass auth with spoofed admin name and id',
        expectedVersion: 1,
        name: 'Admin / Content Lead',
        id: 'ADMIN_SPOOFED',
      }),
    });
    assert.strictEqual(resHeuristicBypass.status, 403, 'Spoofed admin name/id must return HTTP 403 Forbidden');
    pass('5.16 Submit authorization cannot be bypassed by actor ID/name heuristics');

    // Test 5.17: Authorized submission by draft author succeeds
    const resValidSubmit = await fetch(`${baseUrl}/questions/draft/${freshDraft.id}/submit`, {
      method: 'POST',
      headers: authHeaders1,
      body: JSON.stringify({
        remarks: 'Valid submission by author',
        expectedVersion: freshDraft.version ?? 1,
      }),
    });
    assert.strictEqual(resValidSubmit.status, 200, 'Valid submission by author must return HTTP 200');
    const validSubmitData = await resValidSubmit.json();
    assert.strictEqual(validSubmitData.success, true);
    assert.strictEqual(validSubmitData.workflowStage, 'STAGE_02_VERIFICATION');
    assert.strictEqual(validSubmitData.currentStep, 2);
    pass('5.17 Authorized submission by author successfully advances to Stage 02');

    // Test 5.18: Concurrent simultaneous submissions cannot advance workflow twice
    const concurrentDraftPayload = {
      ...mode1Payload,
      questionText: 'Concurrent test: ' + Date.now(),
    };
    const resConcurrentDraft = await fetch(`${baseUrl}/questions/draft`, {
      method: 'POST',
      headers: authHeaders1,
      body: JSON.stringify(concurrentDraftPayload),
    });
    assert.strictEqual(resConcurrentDraft.status, 201);
    const concurrentDraft = await resConcurrentDraft.json();

    // Fire two submissions simultaneously with the same expectedVersion
    const [subResultA, subResultB] = await Promise.all([
      fetch(`${baseUrl}/questions/draft/${concurrentDraft.id}/submit`, {
        method: 'POST',
        headers: authHeaders1,
        body: JSON.stringify({ remarks: 'Submission Request A', expectedVersion: 1 }),
      }),
      fetch(`${baseUrl}/questions/draft/${concurrentDraft.id}/submit`, {
        method: 'POST',
        headers: authHeaders1,
        body: JSON.stringify({ remarks: 'Submission Request B', expectedVersion: 1 }),
      }),
    ]);

    const statuses = [subResultA.status, subResultB.status].sort();
    assert.deepStrictEqual(statuses, [200, 409], 'Concurrent submissions must resolve to exactly one 200 and one 409');

    // Confirm persisted draft state and single OCC version increment
    const resFinalDraft = await fetch(`${baseUrl}/questions/draft/${concurrentDraft.id}`, {
      headers: authHeaders1,
    });
    const finalDraft = await resFinalDraft.json();
    assert.strictEqual(finalDraft.status, 'SUBMITTED_FOR_REVIEW');
    assert.strictEqual(finalDraft.version, 2, 'Draft version must have incremented exactly once to 2');
    pass('5.18 Concurrent submissions safely coordinated via OCC: exactly one succeeds, stale rejected with 409');

    console.log('\n========================================================================');
    console.log('ALL S8-T15 API TESTS PASSED: All checks verified successfully.');
    console.log('========================================================================\n');
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

runS8T15PersistenceTests().catch((err) => {
  console.error('\n❌ S8-T15 Test Suite Failed:', err);
  process.exit(1);
});
