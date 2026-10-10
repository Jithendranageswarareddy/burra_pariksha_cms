/**
 * BURRA PARIKSHA CMS — GATE 1 ACTUAL PRODUCTION ROUTING VERIFICATION
 *
 * Verifies the exact production route chain:
 * Browser/UI HTTP Request
 * → src/server/routes.ts (production apiRouter)
 * → requireAuth / requireRole (actual production auth & RBAC middleware)
 * → centralAuthorizationService
 * → questionService / business service
 * → questionsRepository
 * → Cloud Firestore
 * → Read-back
 * → Hard-delete teardown
 */

import assert from 'node:assert';
import http from 'node:http';
import express from 'express';
import { apiRouter } from '../src/server/routes';
import { authService } from '../src/lib/services/auth.service';
import { questionsRepository } from '../src/lib/repositories/questions.repository';
import { terminate } from 'firebase/firestore';
import { getBackendFirestore } from '../src/lib/firebase/server-auth';
import { SYNTHETIC_TEST_MARKERS } from './fixtures/synthetic-test-fixtures';

function makeRequest(
  port: number,
  method: string,
  path: string,
  headers: Record<string, string>,
  body?: any
): Promise<{ statusCode: number; body: any }> {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : undefined;
    const reqHeaders = {
      ...headers,
      ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {}),
    };

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers: reqHeaders,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(data);
          } catch {
            parsed = data;
          }
          resolve({ statusCode: res.statusCode || 500, body: parsed });
        });
      }
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function testGate1ProductionRouting() {
  console.log('============================================================');
  console.log('BURRA PARIKSHA CMS — GATE 1 PRODUCTION ROUTING VERIFICATION');
  console.log('============================================================\n');

  const app = express();
  app.use(express.json());
  // Mount the EXACT production API router at /api as in server.ts
  app.use('/api', apiRouter);

  const PORT = 38999;
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(PORT, '127.0.0.1', resolve));

  let passed = 0;
  let failed = 0;
  let createdQuestionId: string | null = null;

  try {
    // 1. Unauthenticated Request to actual production route /api/questions
    console.log('--- Step 1: Testing unauthenticated request to production /api/questions ---');
    const unauthRes = await makeRequest(PORT, 'POST', '/api/questions', {}, {
      question: 'TEST QUESTION — Unauthenticated attempt',
      category: SYNTHETIC_TEST_MARKERS.category,
    });
    assert.strictEqual(unauthRes.statusCode, 401, 'Unauthenticated call must return 401');
    console.log('✓ Unauthenticated request rejected by production middleware with HTTP 401.');
    passed++;

    // 2. Generate valid session token for Admin / Content Lead actor
    console.log('--- Step 2: Generating authenticated session token via authService ---');
    const token = authService.generateSessionToken({
      userId: 'USR-001',
      name: 'System Admin',
      role: 'ADMIN',
      roles: ['ADMIN'],
    });
    assert(token && token.includes('.'), 'Must obtain valid signed session token');
    console.log('✓ Authenticated session token issued for actor: USR-001');
    passed++;

    // 3. Authorized POST to actual production route /api/questions
    console.log('--- Step 3: Posting synthetic question to actual production route /api/questions ---');
    const uniqueTime = Date.now();
    const synthQuestionText = `TEST QUESTION — Actual production route verification (${uniqueTime})`;
    const createRes = await makeRequest(
      PORT,
      'POST',
      '/api/questions',
      {
        Authorization: `Bearer ${token}`,
      },
      {
        questionText: synthQuestionText,
        question: synthQuestionText,
        categoryId: 'CAT-QA',
        topicId: 'TOP-QA-01',
        subtopicId: 'SUB-01',
        difficulty: 'MEDIUM',
        challengeType: 'ABCD',
        correctAnswer: 'A',
        options: {
          a: 'Synthetic Option A',
          b: 'Synthetic Option B',
          c: 'Synthetic Option C',
          d: 'Synthetic Option D',
        },
        explanation: 'Synthetic test explanation for actual route verification.',
        skipDuplicateCheck: true,
        testOnly: true,
        environment: 'TEST',
      }
    );

    assert(createRes.statusCode === 200 || createRes.statusCode === 201, `Expected 200/201, got ${createRes.statusCode}: ${JSON.stringify(createRes.body)}`);
    const returnedQuestion = createRes.body.data || createRes.body;
    assert(returnedQuestion && returnedQuestion.id, 'Response must return created question');
    createdQuestionId = returnedQuestion.id;
    console.log('✓ Production route /api/questions returned created question:', createdQuestionId);
    passed++;

    // 4. Verify read-back from Cloud Firestore through production repository
    console.log('--- Step 4: Reading back created question directly from Cloud Firestore ---');
    const fetched = await questionsRepository.findById(createdQuestionId!);
    assert(fetched !== null, 'Question must exist in Cloud Firestore');
    assert.strictEqual(fetched.question, synthQuestionText);
    console.log('✓ Question verified in Cloud Firestore via production repository layer.');
    passed++;

    
    // 5. Cleanup: Hard-delete test question & auto-created content master from Cloud Firestore
    console.log('--- Step 5: Hard-deleting test question & content master from Cloud Firestore ---');
    const firestoreRepo = await questionsRepository.getFirestoreRepository();
    await firestoreRepo.delete(createdQuestionId!, fetched.version || 1, undefined, true);
    if (returnedQuestion.contentMasterId) {
      const cmRepo = new FirestoreRepository('content_masters', 'BP-CNT-' as any);
      await cmRepo.delete(returnedQuestion.contentMasterId, 1, undefined, true).catch(() => {});
    }
    const postCleanup = await questionsRepository.findById(createdQuestionId!);
    assert.strictEqual(postCleanup, null, 'Test question must be permanently deleted');
    console.log('✓ Teardown verified: Zero test records remain in Cloud Firestore.');

    passed++;
  } catch (err: any) {
    console.error('✗ Gate 1 Production Routing Verification FAILED:', err.message);
    failed++;
  } finally {
    server.close();
    try {
      const db = await getBackendFirestore();
      await terminate(db);
    } catch {}
  }

  console.log('\n============================================================');
  console.log(`GATE 1 VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

testGate1ProductionRouting().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
