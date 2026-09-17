/**
 * BURRA PARIKSHA CMS — QS-04: LANGUAGE DEFAULT VERIFICATION TEST SUITE
 *
 * Verifies that:
 * 1. Omitted language defaults to TELUGU across services and validators.
 * 2. Explicit ENGLISH requests preserve QuestionLanguage.ENGLISH.
 * 3. Explicit TELUGU requests preserve QuestionLanguage.TELUGU.
 * 4. Existing saved questions retain their stored language without mutation.
 */

import { QuestionLanguage, UserRole } from '../types';
import { questionService } from '../lib/services/question.service';
import { taxonomyService } from '../lib/services/taxonomy.service';
import { QuestionCandidateZodSchema } from '../lib/ai/schemas/question-candidate.schema';
import { generateQaUserToken } from './qa-user.fixture';

export async function runLanguageDefaultVerification() {
  console.log('========================================================================');
  console.log('BURRA PARIKSHA CMS — QS-04: TELUGU DEFAULT LANGUAGE VERIFICATION');
  console.log('========================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] Test ${String(totalTests).padStart(2, '0')}: ${testName}`);
      passedTests++;
    } else {
      console.error(`[FAIL] Test ${String(totalTests).padStart(2, '0')}: ${testName} - ${detail || ''}`);
      throw new Error(`Language Default Verification failed on Test ${totalTests}: ${testName}`);
    }
  }

  // 1. Zod Candidate Schema Defaults
  console.log('--- Step 1: AI Candidate Schema Defaults ---');
  const baseCandidate = {
    content: 'ఈ క్రింది సంఖ్యలలో ప్రధాన సంఖ్య ఏది? (Which of the following is a prime number?)',
    option_a: '4',
    option_b: '7',
    option_c: '9',
    option_d: '12',
    correct_answer: 'B' as const,
    explanation: '7 అనేది కేవలం 1 మరియు 7 లతో మాత్రమే భాగించబడుతుంది కాబట్టి అది ప్రధాన సంఖ్య. (7 is divisible only by 1 and 7).',
  };

  const parsedOmitted = QuestionCandidateZodSchema.parse(baseCandidate);
  assert(
    parsedOmitted.language === QuestionLanguage.TELUGU,
    'Omitted language in Candidate Schema defaults to QuestionLanguage.TELUGU'
  );

  const parsedExplicitEnglish = QuestionCandidateZodSchema.parse({
    ...baseCandidate,
    language: QuestionLanguage.ENGLISH,
  });
  assert(
    parsedExplicitEnglish.language === QuestionLanguage.ENGLISH,
    'Explicit ENGLISH in Candidate Schema preserves QuestionLanguage.ENGLISH'
  );

  const parsedExplicitTelugu = QuestionCandidateZodSchema.parse({
    ...baseCandidate,
    language: QuestionLanguage.TELUGU,
  });
  assert(
    parsedExplicitTelugu.language === QuestionLanguage.TELUGU,
    'Explicit TELUGU in Candidate Schema preserves QuestionLanguage.TELUGU'
  );

  // 2. Question Creation Engine Fallbacks
  console.log('\n--- Step 2: Question Creation Service Language Processing ---');
  const tree = await taxonomyService.getTaxonomyTree();
  const validTopic = tree[0]?.topics[0]?.id || 'TP-MATH-01';
  const validSubtopic = tree[0]?.topics[0]?.subtopics[0]?.id || 'STP-PERCENT-01';

  // Test 2a: Omitted language payload -> TELUGU
  const createdOmitted = await questionService.createQuestion(
    {
      creationMode: 'ai',
      topicId: validTopic,
      subtopicId: validSubtopic,
      difficulty: 'Intermediate',
      questionText: 'తెలంగాణ రాజధాని ఏది? (What is the capital of Telangana?)',
      options: { a: 'హైదరాబాద్', b: 'వరంగల్', c: 'కరీంనగర్', d: 'నిజామాబాద్' },
      correctAnswer: 'A',
      explanation: 'తెలంగాణ రాష్ట్ర రాజధాని హైదరాబాద్. (Hyderabad is the capital city of Telangana state).',
    } as any,
    { id: 'USR-QA-001', name: 'QA User', role: 'ADMIN' }
  );

  assert(
    createdOmitted.language === 'TELUGU',
    'Omitted language payload in questionService defaults to TELUGU',
    `Received: ${createdOmitted.language}`
  );

  // Test 2b: Explicit ENGLISH payload -> ENGLISH
  const createdEnglish = await questionService.createQuestion(
    {
      creationMode: 'ai',
      topicId: validTopic,
      subtopicId: validSubtopic,
      difficulty: 'Intermediate',
      language: QuestionLanguage.ENGLISH,
      questionText: 'What is the speed of light in vacuum?',
      options: { a: '3x10^8 m/s', b: '3x10^6 m/s', c: '1500 m/s', d: '300 m/s' },
      correctAnswer: 'A',
      explanation: 'The speed of light in vacuum is approximately 3x10^8 meters per second.',
    } as any,
    { id: 'USR-QA-001', name: 'QA User', role: 'ADMIN' }
  );

  assert(
    createdEnglish.language === QuestionLanguage.ENGLISH,
    'Explicit ENGLISH payload preserves QuestionLanguage.ENGLISH',
    `Received: ${createdEnglish.language}`
  );

  // Test 2c: Explicit TELUGU payload -> TELUGU
  const createdTelugu = await questionService.createQuestion(
    {
      creationMode: 'ai',
      topicId: validTopic,
      subtopicId: validSubtopic,
      difficulty: 'Intermediate',
      language: QuestionLanguage.TELUGU,
      questionText: 'ఆంధ్రప్రదేశ్ రాజధాని ఏది?',
      options: { a: 'అమరావతి', b: 'విశాఖపట్నం', c: 'కర్నూలు', d: 'తిరుపతి' },
      correctAnswer: 'A',
      explanation: 'ఆంధ్రప్రదేశ్ రాష్ట్ర రాజధాని అమరావతి.',
    } as any,
    { id: 'USR-QA-001', name: 'QA User', role: 'ADMIN' }
  );

  assert(
    createdTelugu.language === QuestionLanguage.TELUGU,
    'Explicit TELUGU payload preserves QuestionLanguage.TELUGU',
    `Received: ${createdTelugu.language}`
  );

  // 3. Saved Records Language Immutability Check
  console.log('\n--- Step 3: Existing Saved Record Language Immutability Check ---');
  const fetchedEnglish = await questionService.getQuestionById(createdEnglish.id);
  assert(
    fetchedEnglish?.language === QuestionLanguage.ENGLISH,
    'Previously created ENGLISH question retains language = ENGLISH upon retrieval'
  );

  const fetchedTelugu = await questionService.getQuestionById(createdTelugu.id);
  assert(
    fetchedTelugu?.language === QuestionLanguage.TELUGU,
    'Previously created TELUGU question retains language = TELUGU upon retrieval'
  );

  console.log('\n========================================================================');
  console.log(`LANGUAGE DEFAULT VERIFICATION SUCCESSFUL: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('========================================================================\n');
}

runLanguageDefaultVerification().catch((err) => {
  console.error('Language Default Verification Exception:', err);
  process.exit(1);
});
