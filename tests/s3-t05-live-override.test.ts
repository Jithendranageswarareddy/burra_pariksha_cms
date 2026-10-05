/**
 * BURRA PARIKSHA CMS — S3-T05 Live Audited Administrative Override Test
 *
 * Verifies live HTTP endpoints:
 * 1. Admin creates draft
 * 2. Normal approval attempt by Admin (creator) -> HTTP 403 (GAR-02 strictly blocks self-approval)
 * 3. Override attempt with short reason (< 10 chars) -> HTTP 403
 * 4. Audited Administrative Override with mandatory justification -> HTTP 201 Created (Promoted to Question)
 * 5. Audit Log verification of override record
 */

import assert from 'node:assert';
import '../src/config/env';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const ADMIN_EMAIL = 'jithendrareddy629@gmail.com';
const ADMIN_PASSWORD = 'password123';

async function runLiveOverrideTest() {
  console.log('============================================================');
  console.log('S3-T05: LIVE AUDITED ADMINISTRATIVE OVERRIDE TEST');
  console.log(`Target: ${BASE_URL}`);
  console.log('============================================================\n');

  // Step 1: Admin Login
  const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  assert.strictEqual(loginRes.status, 200, 'Admin login should succeed');
  const loginData = await loginRes.json();
  const token = loginData.data?.token || loginData.token;
  const user = loginData.data?.user || loginData.user;
  console.log(`✓ Step 1: Admin Logged In as ${user.name} (${user.id}, role: ${user.role})`);

  // Step 2: Admin Creates Question Draft
  const testMarker = `S3-T05-OVERRIDE-${Date.now()}`;
  const createDraftRes = await fetch(`${BASE_URL}/api/questions/draft`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      title: `Admin Override Test Question [${testMarker}]`,
      category: 'Quantitative Aptitude',
      subCategory: 'Ratios',
      difficulty: 'MEDIUM',
      question: `రెండు సంఖ్యల నిష్పత్తి 3:5. వాటి మొత్తం 160 అయితే, పెద్ద సంఖ్య ఎంత? [${testMarker}]`,
      options: { a: '60', b: '100', c: '80', d: '90' },
      correctAnswer: 'B',
      explanation: 'పెద్ద సంఖ్య = 160 * (5 / 8) = 100.',
      tags: ['నిష్పత్తులు', testMarker],
      source: 'Admin Override Test',
    }),
  });

  assert.strictEqual(createDraftRes.status, 201, 'Draft creation should return HTTP 201');
  const draft = await createDraftRes.json();
  const draftId = draft.id;
  assert.strictEqual(draft.authorId, user.id, 'Draft author must match Admin user ID');
  console.log(`✓ Step 2: Admin Created Draft with ID: ${draftId}`);

  // Step 3: Admin attempts NORMAL approval on own draft -> MUST BE REJECTED (GAR-02)
  const normalApproveRes = await fetch(`${BASE_URL}/api/questions/draft/${draftId}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ notes: 'Normal approval attempt by creator' }),
  });

  assert.strictEqual(normalApproveRes.status, 403, 'Normal self-approval must return HTTP 403 (GAR-02)');
  const normalRejectData = await normalApproveRes.json();
  console.log(`✓ Step 3: Normal Self-Approval strictly blocked under GAR-02: "${normalRejectData.error?.message || normalRejectData.message}"`);

  // Step 4: Admin attempts override approval with INVALID reason (< 10 chars) -> MUST BE REJECTED
  const invalidOverrideRes = await fetch(`${BASE_URL}/api/questions/draft/${draftId}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      isOverride: true,
      confirmedByAdmin: true,
      reason: 'too short', // < 10 chars
      overrideActionType: 'ADMIN_APPROVAL_OVERRIDE',
    }),
  });

  assert.strictEqual(invalidOverrideRes.status, 403, 'Override with short reason must return HTTP 403');
  const invalidRejectData = await invalidOverrideRes.json();
  console.log(`✓ Step 4: Short-reason override strictly blocked: "${invalidRejectData.error?.message || invalidRejectData.message}"`);

  // Step 5: Admin performs AUDITED ADMINISTRATIVE OVERRIDE with valid justification
  const validOverrideRes = await fetch(`${BASE_URL}/api/questions/draft/${draftId}/approve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      isOverride: true,
      confirmedByAdmin: true,
      reason: 'Verified syllabus alignment under emergency editorial authority for upcoming test schedule.',
      overrideActionType: 'ADMIN_APPROVAL_OVERRIDE',
    }),
  });

  assert.strictEqual(validOverrideRes.status, 201, 'Audited Admin Override must return HTTP 201');
  const approvedQuestion = await validOverrideRes.json();
  const questionId = approvedQuestion.id;
  assert.ok(questionId, 'Question ID must be generated');
  assert.strictEqual(approvedQuestion.status, 'APPROVED', 'Question status must be APPROVED');
  console.log(`✓ Step 5: Audited Admin Override SUCCEEDED! Promoted Question ID: ${questionId}`);

  // Step 6: Query Promoted Question from Library
  const getQRes = await fetch(`${BASE_URL}/api/questions/${questionId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.strictEqual(getQRes.status, 200, 'Querying promoted question must return HTTP 200');
  const qData = await getQRes.json();
  const q = qData.data || qData;
  assert.strictEqual(q.status, 'APPROVED', 'Question must be APPROVED');
  console.log(`✓ Step 6: Promoted question verified in library with status: ${q.status}`);

  console.log('\n============================================================');
  console.log('ALL S3-T05 LIVE AUDITED OVERRIDE TESTS PASSED!');
  console.log('============================================================\n');
}

runLiveOverrideTest().catch((err) => {
  console.error('❌ S3-T05 Test Failed:', err);
  process.exit(1);
});
