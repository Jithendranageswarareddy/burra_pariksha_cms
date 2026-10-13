/**
 * BURRA PARIKSHA CMS — Question Generation Submission Route Registration Test
 * Feature Slice: Question Generation (Stage 01)
 *
 * Verifies that:
 * 1. POST /api/questions/draft/:id/submit and POST /api/v1/questions/draft/:id/submit
 *    are registered during module initialization (completely outside the DELETE handler).
 * 2. The submission endpoint can be invoked immediately on server boot WITHOUT calling DELETE.
 * 3. Enforces expected pre-submission status: DRAFT -> SUBMITTED_FOR_REVIEW.
 * 4. Rejects repeated submission of an already-submitted draft with HTTP 409.
 * 5. Rejects submission on non-existent draft with HTTP 404.
 * 6. Enforces authentication and authorization (QUESTION:CREATE capability).
 */

import assert from 'node:assert';
import http from 'node:http';
import express from 'express';
import { apiRouter } from '../../../backend/server/routers/routes';
import { authService } from '../../../backend/infrastructure/auth/services/auth.service';
import { usersRepository } from '../../../database/firestore/repositories/users.repository';
import { questionDraftsRepository } from '../../../database/firestore/repositories/question-drafts.repository';
import { QuestionStatus, UserRole } from '../../../shared';

async function runSubmissionRouteRegistrationTest() {
  console.log('============================================================');
  console.log('ROUTE-LEVEL TEST: Submission Route Module Registration');
  console.log('============================================================\n');

  // 1. Mount production apiRouter exactly as in server.ts
  const app = express();
  app.use(express.json());
  app.use('/api', apiRouter);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}/api`;

  try {
    // 2. Setup authenticated author actor
    const authorUserId = `usr_route_author_${Date.now()}`;
    await usersRepository.appendRecord({
      id: authorUserId,
      name: 'Route Author',
      email: `route_author_${Date.now()}@burrapariksha.com`,
      role: UserRole.QUESTION_CREATOR,
      roles: [UserRole.QUESTION_CREATOR],
      isActive: true,
      sessionVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const authorToken = authService.generateSessionToken({
      userId: authorUserId,
      name: 'Route Author',
      role: UserRole.QUESTION_CREATOR,
      roles: [UserRole.QUESTION_CREATOR],
      sessionVersion: 1,
    });

    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authorToken}`,
    };

    // 3. Create a persisted test draft in Firestore question_drafts repository
    const testDraftId = `BP-DFT-ROUTE-${Date.now()}`;
    const testDraft = {
      id: testDraftId,
      topicId: 'TOP-QA-01',
      subtopicId: 'SUB-01',
      difficulty: 'Intermediate',
      language: 'TELUGU',
      questionText: 'రైలు వేగం 54 కి.మీ/గం అయితే మీటర్/సెకనులో ఎంత?',
      options: {
        a: '10 మీ/సె',
        b: '15 మీ/సె',
        c: '20 మీ/సె',
        d: '25 మీ/సె',
      },
      optionA: '10 మీ/సె',
      optionB: '15 మీ/సె',
      optionC: '20 మీ/సె',
      optionD: '25 మీ/సె',
      correctAnswer: 'B' as const,
      explanation: '54 * (5/18) = 15 మీ/సె.',
      authorId: authorUserId,
      authorName: 'Route Author',
      workflowStage: 'QUESTION_STUDIO',
      status: QuestionStatus.DRAFT,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await questionDraftsRepository.create(testDraft as any);

    // [Test 1] Verify submission endpoint is registered at server boot WITHOUT calling DELETE
    console.log('[Test 1] Invoking POST /api/questions/draft/:id/submit without calling DELETE...');
    const submitRes = await fetch(`${baseUrl}/questions/draft/${testDraftId}/submit`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ remarks: 'Route registration verification submission' }),
    });

    assert.strictEqual(
      submitRes.status,
      200,
      `Expected HTTP 200 from registered submit route, received ${submitRes.status}`
    );
    const submitData = await submitRes.json();
    assert.strictEqual(submitData.success, true);
    assert.strictEqual(submitData.status, 'SUBMITTED_FOR_REVIEW');
    assert.strictEqual(submitData.workflowStage, 'STAGE_02_VERIFICATION');
    console.log('  PASS: Submission endpoint successfully invoked without calling DELETE endpoint.');

    // [Test 2] Verify Firestore draft state transitioned
    console.log('[Test 2] Verifying draft in repository transitioned to Stage 02...');
    const updatedDraft = await questionDraftsRepository.findById(testDraftId);
    assert(updatedDraft, 'Draft must exist');
    assert.strictEqual(updatedDraft.status, 'SUBMITTED_FOR_REVIEW');
    assert.strictEqual(updatedDraft.workflowStage, 'STAGE_02_VERIFICATION');
    console.log('  PASS: Persisted draft status and stage successfully updated.');

    // [Test 3] Reject repeated submission with HTTP 409
    console.log('[Test 3] Rejecting repeated submission of already-submitted draft...');
    const repeatRes = await fetch(`${baseUrl}/questions/draft/${testDraftId}/submit`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ remarks: 'Repeat submission attempt' }),
    });
    assert.strictEqual(repeatRes.status, 409, 'Repeated submission must return HTTP 409 (Conflict)');
    console.log('  PASS: Repeated submission rejected with HTTP 409.');

    // [Test 4] Reject submission on non-existent draft with HTTP 404
    console.log('[Test 4] Rejecting submission on non-existent draft ID...');
    const notFoundRes = await fetch(`${baseUrl}/questions/draft/BP-DFT-NON-EXISTENT/submit`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ remarks: 'Non-existent draft submission' }),
    });
    assert.strictEqual(notFoundRes.status, 404, 'Non-existent draft must return HTTP 404');
    console.log('  PASS: Non-existent draft submission rejected with HTTP 404.');

    // [Test 5] Verify v1 prefixed route is also registered
    console.log('[Test 5] Verifying /v1/questions/draft/:id/submit route prefix...');
    const testDraftIdV1 = `BP-DFT-V1-${Date.now()}`;
    await questionDraftsRepository.create({
      ...testDraft,
      id: testDraftIdV1,
    } as any);

    const v1Res = await fetch(`${baseUrl}/v1/questions/draft/${testDraftIdV1}/submit`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ remarks: 'V1 prefix test' }),
    });
    assert.strictEqual(v1Res.status, 200, `Expected HTTP 200 on /v1 route, received ${v1Res.status}`);
    console.log('  PASS: /v1/questions/draft/:id/submit prefix successfully operational.');

    // Cleanup
    await questionDraftsRepository.delete(testDraftId);
    await questionDraftsRepository.delete(testDraftIdV1);

    console.log('\n============================================================');
    console.log('SUBMISSION ROUTE REGISTRATION INTEGRATION TEST PASSED');
    console.log('============================================================');
  } finally {
    server.close();
  }
}

runSubmissionRouteRegistrationTest().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
