import assert from 'assert';
import { authService } from '../lib/services/auth.service';
import { usersRepository } from '../lib/repositories/users.repository';

async function runNegativeTests() {
  console.log('=== RUNNING NEGATIVE TEST SUITE ===');
  const BASE_URL = 'http://localhost:3000/api';

  const adminUser = await usersRepository.findById('USR-001');
  assert(adminUser, 'Admin user USR-001 must exist');

  const adminToken = authService.generateSessionToken({
    userId: adminUser.id,
    name: adminUser.name,
    role: adminUser.role,
    roles: adminUser.roles || [adminUser.role],
    sessionVersion: adminUser.sessionVersion,
  });

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`,
  };

  const baseValidPayload = {
    creationMode: 'manual',
    categoryId: 'CAT-QA',
    topicId: 'BP-TOP-001',
    subtopicId: 'BP-SUB-0001',
    difficulty: 'Intermediate',
    challengeType: 'ABCD',
    presentationType: 'Text',
    language: 'TELUGU',
    realLifeContext: 'Daily Commute & Public Transit',
    generationMode: 'SUBTOPIC',
    questionStyle: 'STORY_BASED',
    questionText: '18ను 6తో భాగిస్తే భాగఫలం ఎంత?',
    question: '18ను 6తో భాగిస్తే భాగఫలం ఎంత?',
    options: {
      a: '2',
      b: '3',
      c: '4',
      d: '6',
    },
    correctAnswer: 'B',
    explanation: '18ను 6తో భాగిస్తే 3 వస్తుంది.',
    tags: ['Aptitude', 'SpeedMath'],
  };

  // 1. Empty question -> must reject
  const emptyRes = await fetch(`${BASE_URL}/questions/create`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ ...baseValidPayload, questionText: '', question: '', idempotencyKey: `neg-empty-${Date.now()}` }),
  });
  const emptyJson = await emptyRes.json();
  console.log('1. Empty question rejected:', emptyRes.status, emptyJson.message || emptyJson.error);
  assert.strictEqual(emptyRes.status, 400);

  // 2. Question shorter than 5 characters -> must reject
  const shortRes = await fetch(`${BASE_URL}/questions/create`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ ...baseValidPayload, questionText: '1+1=', question: '1+1=', idempotencyKey: `neg-short-${Date.now()}` }),
  });
  const shortJson = await shortRes.json();
  console.log('2. Short question (<5 chars) rejected:', shortRes.status, shortJson.message || shortJson.error);
  assert.strictEqual(shortRes.status, 400);

  // 3. Invalid authentication -> must return authentication error
  const unauthRes = await fetch(`${BASE_URL}/questions/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer INVALID_TOKEN_XYZ' },
    body: JSON.stringify({ ...baseValidPayload, idempotencyKey: `neg-unauth-${Date.now()}` }),
  });
  const unauthJson = await unauthRes.json();
  console.log('3. Invalid authentication rejected:', unauthRes.status, unauthJson.error || unauthJson.message);
  assert.strictEqual(unauthRes.status, 401);

  // 4. Invalid/nonexistent taxonomy ID -> must reject
  const invalidTaxRes = await fetch(`${BASE_URL}/questions/create`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ ...baseValidPayload, subtopicId: 'BP-SUB-NONEXISTENT', idempotencyKey: `neg-tax-${Date.now()}` }),
  });
  const invalidTaxJson = await invalidTaxRes.json();
  console.log('4. Invalid taxonomy ID rejected:', invalidTaxRes.status, invalidTaxJson.message || invalidTaxJson.error);
  assert.strictEqual(invalidTaxRes.status, 400);

  // 5. Deterministically contradictory question -> must remain INVALID
  const contraRes = await fetch(`${BASE_URL}/questions/validate-candidate`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      question: {
        questionText: 'If 2 + 2 = 4, what is 2 + 2?',
        options: { a: '2', b: '3', c: '4', d: '5' },
        correctAnswer: 'A', // Contradictory: declares A (2) when question states 2+2=4
        explanation: '2 + 2 is 4.',
        categoryId: 'CAT-QA',
        topicId: 'BP-TOP-001',
        subtopicId: 'BP-SUB-0001',
        difficulty: 'Intermediate',
        challengeType: 'ABCD',
        presentationType: 'Text',
        language: 'TELUGU',
        questionStyle: 'STORY_BASED',
      },
    }),
  });
  const contraJson = await contraRes.json();
  console.log('5. Contradictory question validated as:', contraJson.data?.status);
  assert.strictEqual(contraJson.data?.status, 'INVALID');

  // 6. Valid Telugu question -> reaches valid or non-failing status and can be saved
  const validCandidateRes = await fetch(`${BASE_URL}/questions/validate-candidate`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      question: {
        questionText: '18ను 6తో భాగిస్తే భాగఫలం ఎంత? (18 / 6 = ?)',
        options: { a: '2', b: '3', c: '4', d: '6' },
        correctAnswer: 'B',
        explanation: '18ను 6తో భాగిస్తే 3 వస్తుంది.',
        categoryId: 'CAT-QA',
        topicId: 'BP-TOP-001',
        subtopicId: 'BP-SUB-0001',
        difficulty: 'Intermediate',
        challengeType: 'ABCD',
        presentationType: 'Text',
        language: 'TELUGU',
        questionStyle: 'STORY_BASED',
      },
      skipDuplicateCheck: true,
    }),
  });
  const validCandidateJson = await validCandidateRes.json();
  console.log('6. Valid Telugu question validation status:', validCandidateJson.data?.status);
  assert(['VALID', 'NEEDS_REVIEW'].includes(validCandidateJson.data?.status), 'Valid question must be VALID or NEEDS_REVIEW, not INVALID');
  assert.strictEqual(validCandidateJson.data?.errors?.length || 0, 0, 'Valid question must have 0 fatal errors');

  console.log('=== ALL NEGATIVE AND VALIDATION TESTS PASSED ===');
}

runNegativeTests().catch((err) => {
  console.error('NEGATIVE TESTS FAILED:', err);
  process.exit(1);
});
