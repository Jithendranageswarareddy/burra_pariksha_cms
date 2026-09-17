import assert from 'assert';
import { authService } from '../lib/services/auth.service';
import { usersRepository } from '../lib/repositories/users.repository';
import { contentMastersRepository } from '../lib/repositories/content-masters.repository';
import { questionsRepository } from '../lib/repositories/questions.repository';
import { videosRepository } from '../lib/repositories/videos.repository';
import { scriptsRepository } from '../lib/repositories/scripts.repository';
import { thumbnailsRepository } from '../lib/repositories/thumbnails.repository';
import { pinnedCommentsRepository } from '../lib/repositories/pinned-comments.repository';
import { socialReviewsRepository } from '../lib/repositories/social-reviews.repository';
import { publishingRepository } from '../lib/repositories/publishing.repository';
import { topicsRepository } from '../lib/repositories/topics.repository';
import { subtopicsRepository } from '../lib/repositories/subtopics.repository';
import { UserRole } from '../types';

async function runComprehensiveE2ESuite() {
  console.log('=== STARTING COMPREHENSIVE E2E & NEGATIVE TEST SUITE ===');

  const BASE_URL = 'http://localhost:3000/api';

  // Step 1: Data Counts BEFORE
  const countsBefore = {
    CONTENT_MASTERS: (await contentMastersRepository.findAll()).length,
    QUESTIONS: (await questionsRepository.findAll()).length,
    VIDEOS: (await videosRepository.findAll()).length,
    SCRIPTS: (await scriptsRepository.findAll()).length,
    THUMBNAILS: (await thumbnailsRepository.findAll()).length,
    PINNED_COMMENTS: (await pinnedCommentsRepository.findAll()).length,
    SOCIAL_REVIEWS: (await socialReviewsRepository.findAll()).length,
    PUBLISHING: (await publishingRepository.findAll()).length,
    USERS: (await usersRepository.findAll()).length,
    TOPICS: (await topicsRepository.findAll()).length,
    SUBTOPICS: (await subtopicsRepository.findAll()).length,
  };
  console.log('COUNTS BEFORE:', JSON.stringify(countsBefore, null, 2));

  // Step 2: Authenticate Admin User (Jithendra ADMIN / USR-001)
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

  // Step 3: Run Validation Endpoint for Candidate (/api/questions/validate-candidate)
  console.log('\n--- 1. Testing Candidate Validation Endpoint ---');
  const candidateValidationPayload = {
    question: {
      questionText: '18ను 6తో భాగిస్తే భాగఫలం ఎంత?',
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
      realLifeContext: 'Daily Commute & Public Transit',
      questionStyle: 'STORY_BASED',
    },
  };

  const valRes = await fetch(`${BASE_URL}/questions/validate-candidate`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(candidateValidationPayload),
  });

  const valJson = await valRes.json();
  console.log('Validation Status:', valRes.status);
  console.log('Validation Result Status:', valJson.data?.status, 'Confidence:', valJson.data?.confidenceScore);
  assert.strictEqual(valRes.status, 200, 'Candidate validation endpoint returned 200');
  assert.strictEqual(valJson.success, true, 'Validation success is true');
  assert.strictEqual(valJson.data?.status, 'VALID', 'Candidate validation status is VALID');

  // Step 4: Real Save Test (/api/questions/create)
  console.log('\n--- 2. Testing Real Question Save (/api/questions/create) ---');
  const savePayload = {
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
    idempotencyKey: `e2e-studio-manual-${Date.now()}`,
  };

  const saveRes = await fetch(`${BASE_URL}/questions/create`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(savePayload),
  });

  const saveJson = await saveRes.json();
  console.log('Save Status:', saveRes.status);
  console.log('Save Response:', JSON.stringify(saveJson, null, 2));

  assert([200, 201].includes(saveRes.status), `Question creation returned status ${saveRes.status}`);
  assert(saveJson.id, 'Returned question must have an ID');
  const createdQuestionId = saveJson.id;
  const createdContentMasterId = saveJson.contentMasterId;
  console.log(`Created Question ID: ${createdQuestionId}, Content Master ID: ${createdContentMasterId}`);

  // Step 5: Verify Saved Question in Question Library / API
  console.log('\n--- 3. Verifying Saved Question Retrieval ---');
  const getRes = await fetch(`${BASE_URL}/questions/${encodeURIComponent(createdQuestionId)}`, {
    headers: authHeaders,
  });
  const getJson = await getRes.json();
  assert.strictEqual(getRes.status, 200, 'Fetching created question returned 200');
  assert.strictEqual(getJson.id, createdQuestionId, 'Question ID matches');
  assert.strictEqual(getJson.questionText, '18ను 6తో భాగిస్తే భాగఫలం ఎంత?', 'Question text matches Telugu string');
  assert.strictEqual(getJson.correctAnswer, 'B', 'Correct answer matches B');

  // Step 6: Negative Tests
  console.log('\n--- 4. Running Negative Tests ---');

  // Negative Test 1: Empty Question
  console.log('Negative 1: Empty Question');
  const emptyRes = await fetch(`${BASE_URL}/questions/create`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ ...savePayload, questionText: '', question: '', idempotencyKey: `neg1-${Date.now()}` }),
  });
  const emptyJson = await emptyRes.json();
  console.log('Empty Question Status:', emptyRes.status, emptyJson.message || emptyJson.error);
  assert.strictEqual(emptyRes.status, 400, 'Empty question must be rejected with 400');

  // Negative Test 2: Short Question (<5 chars)
  console.log('Negative 2: Question Shorter than 5 Characters');
  const shortRes = await fetch(`${BASE_URL}/questions/create`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ ...savePayload, questionText: '1+1=', question: '1+1=', idempotencyKey: `neg2-${Date.now()}` }),
  });
  const shortJson = await shortRes.json();
  console.log('Short Question Status:', shortRes.status, shortJson.message || shortJson.error);
  assert.strictEqual(shortRes.status, 400, 'Short question must be rejected with 400');

  // Negative Test 3: Invalid Authentication
  console.log('Negative 3: Invalid Authentication');
  const unauthRes = await fetch(`${BASE_URL}/questions/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer INVALID_TOKEN_XYZ' },
    body: JSON.stringify({ ...savePayload, idempotencyKey: `neg3-${Date.now()}` }),
  });
  const unauthJson = await unauthRes.json();
  console.log('Invalid Auth Status:', unauthRes.status, unauthJson.error || unauthJson.message);
  assert.strictEqual(unauthRes.status, 401, 'Invalid token must return 401');

  // Negative Test 4: Invalid Taxonomy ID
  console.log('Negative 4: Invalid Taxonomy ID');
  const invalidTaxRes = await fetch(`${BASE_URL}/questions/create`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ ...savePayload, subtopicId: 'BP-SUB-NONEXISTENT', idempotencyKey: `neg4-${Date.now()}` }),
  });
  const invalidTaxJson = await invalidTaxRes.json();
  console.log('Invalid Taxonomy Status:', invalidTaxRes.status, invalidTaxJson.message || invalidTaxJson.error);
  assert.strictEqual(invalidTaxRes.status, 400, 'Nonexistent subtopic must return 400');

  // Negative Test 5: Deterministically Contradictory Question Validation
  console.log('Negative 5: Contradictory Question');
  const contraRes = await fetch(`${BASE_URL}/questions/validate-candidate`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      question: {
        ...candidateValidationPayload.question,
        questionText: '18ను 6తో భాగిస్తే భాగఫలం ఎంత? (18 / 6 = 3)',
        options: { a: '2', b: '3', c: '4', d: '6' },
        correctAnswer: 'A', // Incorrect declared answer (declares 2 when 18/6=3)
        explanation: '18ను 6తో భాగిస్తే 3 వస్తుంది.',
      },
    }),
  });
  const contraJson = await contraRes.json();
  console.log('Contradictory Question Validation Status:', contraJson.data?.status, contraJson.data?.checks?.find((c: any) => c.id === 'CHK_STAGE_3_MATH'));
  assert.strictEqual(contraJson.data?.status, 'INVALID', 'Contradictory question must be INVALID');

  // Step 7: Data Counts AFTER
  console.log('\n--- 5. Verifying Database Counts After E2E Run ---');
  const countsAfter = {
    CONTENT_MASTERS: (await contentMastersRepository.findAll()).length,
    QUESTIONS: (await questionsRepository.findAll()).length,
    VIDEOS: (await videosRepository.findAll()).length,
    SCRIPTS: (await scriptsRepository.findAll()).length,
    THUMBNAILS: (await thumbnailsRepository.findAll()).length,
    PINNED_COMMENTS: (await pinnedCommentsRepository.findAll()).length,
    SOCIAL_REVIEWS: (await socialReviewsRepository.findAll()).length,
    PUBLISHING: (await publishingRepository.findAll()).length,
    USERS: (await usersRepository.findAll()).length,
    TOPICS: (await topicsRepository.findAll()).length,
    SUBTOPICS: (await subtopicsRepository.findAll()).length,
  };
  console.log('COUNTS AFTER:', JSON.stringify(countsAfter, null, 2));

  // Verify delta
  assert.strictEqual(countsAfter.QUESTIONS, countsBefore.QUESTIONS + 1, 'Exactly 1 new question was created');
  assert.strictEqual(countsAfter.CONTENT_MASTERS, countsBefore.CONTENT_MASTERS + 1, 'Exactly 1 new content master was created');
  assert.strictEqual(countsAfter.VIDEOS, countsBefore.VIDEOS, 'No videos modified');
  assert.strictEqual(countsAfter.TOPICS, countsBefore.TOPICS, 'Topics unchanged');
  assert.strictEqual(countsAfter.SUBTOPICS, countsBefore.SUBTOPICS, 'Subtopics unchanged');
  assert.strictEqual(countsAfter.USERS, countsBefore.USERS, 'Users unchanged');

  console.log('\n=== ALL E2E AND NEGATIVE TESTS PASSED WITH 100% SUCCESS ===');
}

runComprehensiveE2ESuite().catch((err) => {
  console.error('FAILED E2E SUITE:', err);
  process.exit(1);
});
