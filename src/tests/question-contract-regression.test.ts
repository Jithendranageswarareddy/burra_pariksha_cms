/**
 * Regression Test: Question Creation Contract Alignment
 *
 * Verifies:
 * 1. QuestionCreationValidator accepts payloads with `question` or `content` alias (without `questionText`).
 * 2. Empty questionText or alias is strictly rejected (< 5 chars).
 * 3. Specific Telugu math question: "18ను 6తో భాగిస్తే భాగఫలం ఎంత?"
 *    passes structural validation and createQuestionFromRequest successfully.
 * 4. QuestionService.createQuestionFromRequest canonicalizes aliases to questionText.
 * 5. Deterministic mathematical contradiction is still rejected.
 * 6. No production data is touched (GOOGLE_SHEETS_ID disabled).
 */

import { QuestionCreationValidator } from '../lib/validators/question-creation.validator';
import { questionService } from '../lib/services/question.service';
import { taxonomyService } from '../lib/services/taxonomy.service';
import { questionConfigRepository } from '../lib/repositories/question-config.repository';
import { QuestionLanguage, UserRole } from '../types';

async function runRegressionSuite() {
  console.log('=== STARTING QUESTION CONTRACT REGRESSION SUITE ===\n');

  // Ensure sheets sync is mocked/isolated so zero production data is mutated
  process.env.GOOGLE_SHEETS_ID = '';
  process.env.SKIP_SHEETS_SYNC = 'true';

  // Populate QUESTION_CONFIG fallback store for offline/isolated tests
  const configStore = (questionConfigRepository as any).constructor?.fallbackStore?.get('QUESTION_CONFIG');
  if (configStore) {
    const defaultEntries = [
      {
        id: 'CFG-CTX-001',
        dimension: 'REAL_LIFE_CONTEXT',
        code: 'HYDERABAD_METRO',
        displayLabel: 'Hyderabad Metro Travel',
        description: 'Scenarios based on Hyderabad Metro commutes',
        sortOrder: 1,
        isActive: true,
        isDefault: true,
      },
      {
        id: 'CFG-STYLE-001',
        dimension: 'QUESTION_STYLE',
        code: 'STORY_BASED',
        displayLabel: 'Story Based',
        description: 'Narrative storytelling question style',
        sortOrder: 1,
        isActive: true,
        isDefault: true,
      },
    ];
    for (const entry of defaultEntries) {
      configStore.set(entry.id, entry);
    }
  }

  let passedTests = 0;
  let failedTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`[FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
      failedTests++;
    }
  }

  // -------------------------------------------------------------
  // Test 1: QuestionCreationValidator with `question` alias only
  // -------------------------------------------------------------
  try {
    const payloadWithQuestionOnly: any = {
      creationMode: 'manual',
      topicId: 'TOPIC-TEST',
      subtopicId: 'SUBTOPIC-TEST',
      difficulty: 'Medium',
      question: 'What is the sum of angles in a triangle in degrees?',
      options: { a: '90', b: '180', c: '270', d: '360' },
      correctAnswer: 'B',
      explanation: 'The sum of internal angles of any planar triangle is always 180 degrees.',
    };

    QuestionCreationValidator.validateStructure(payloadWithQuestionOnly);
    assert(
      payloadWithQuestionOnly.questionText === 'What is the sum of angles in a triangle in degrees?',
      'Test 1: Validator accepts `question` alias and canonicalizes `questionText`'
    );
  } catch (err: any) {
    assert(false, 'Test 1: Validator accepts `question` alias', err.message);
  }

  // -------------------------------------------------------------
  // Test 2: QuestionCreationValidator with `content` alias only
  // -------------------------------------------------------------
  try {
    const payloadWithContentOnly: any = {
      creationMode: 'manual',
      topicId: 'TOPIC-TEST',
      subtopicId: 'SUBTOPIC-TEST',
      difficulty: 'Easy',
      content: 'Which planet is known as the Red Planet in our solar system?',
      options: { a: 'Venus', b: 'Mars', c: 'Jupiter', d: 'Saturn' },
      correctAnswer: 'B',
      explanation: 'Mars is called the Red Planet because of iron oxide on its surface.',
    };

    QuestionCreationValidator.validateStructure(payloadWithContentOnly);
    assert(
      payloadWithContentOnly.questionText === 'Which planet is known as the Red Planet in our solar system?',
      'Test 2: Validator accepts `content` alias and canonicalizes `questionText`'
    );
  } catch (err: any) {
    assert(false, 'Test 2: Validator accepts `content` alias', err.message);
  }

  // -------------------------------------------------------------
  // Test 3: Rejection of empty question text
  // -------------------------------------------------------------
  try {
    const emptyPayload: any = {
      creationMode: 'manual',
      topicId: 'TOPIC-TEST',
      subtopicId: 'SUBTOPIC-TEST',
      difficulty: 'Easy',
      questionText: '   ',
      options: { a: 'A', b: 'B', c: 'C', d: 'D' },
      correctAnswer: 'A',
      explanation: 'Explanation text here.',
    };
    QuestionCreationValidator.validateStructure(emptyPayload);
    assert(false, 'Test 3: Empty questionText should be rejected');
  } catch (err: any) {
    assert(
      err.message.includes('Question text is required'),
      'Test 3: Empty questionText is rejected with validation message',
      err.message
    );
  }

  // -------------------------------------------------------------
  // Test 4: Rejection of questionText shorter than 5 characters
  // -------------------------------------------------------------
  try {
    const shortPayload: any = {
      creationMode: 'manual',
      topicId: 'TOPIC-TEST',
      subtopicId: 'SUBTOPIC-TEST',
      difficulty: 'Easy',
      questionText: '1+1?',
      options: { a: '2', b: '3', c: '4', d: '5' },
      correctAnswer: 'A',
      explanation: 'Explanation text here.',
    };
    QuestionCreationValidator.validateStructure(shortPayload);
    assert(false, 'Test 4: Short questionText (<5 chars) should be rejected');
  } catch (err: any) {
    assert(
      err.message.includes('at least 5 characters long'),
      'Test 4: Short questionText (<5 chars) rejected with validation message',
      err.message
    );
  }

  // -------------------------------------------------------------
  // Test 5: Rejection of short `question` alias (<5 chars)
  // -------------------------------------------------------------
  try {
    const shortAliasPayload: any = {
      creationMode: 'manual',
      topicId: 'TOPIC-TEST',
      subtopicId: 'SUBTOPIC-TEST',
      difficulty: 'Easy',
      question: 'Why?',
      options: { a: '2', b: '3', c: '4', d: '5' },
      correctAnswer: 'A',
      explanation: 'Explanation text here.',
    };
    QuestionCreationValidator.validateStructure(shortAliasPayload);
    assert(false, 'Test 5: Short question alias (<5 chars) should be rejected');
  } catch (err: any) {
    assert(
      err.message.includes('at least 5 characters long'),
      'Test 5: Short question alias (<5 chars) rejected',
      err.message
    );
  }

  // -------------------------------------------------------------
  // Test 6: Telugu Example Verification with QuestionCreationValidator
  // Question: "18ను 6తో భాగిస్తే భాగఫలం ఎంత?"
  // Options: A: 2, B: 3, C: 4, D: 6
  // Correct: B
  // Explanation: "18ను 6తో భాగిస్తే 3 వస్తుంది."
  // -------------------------------------------------------------
  try {
    const teluguPayload: any = {
      creationMode: 'manual',
      topicId: 'TOPIC-MATH',
      subtopicId: 'SUBTOPIC-ARITHMETIC',
      difficulty: 'Easy',
      questionText: '18ను 6తో భాగిస్తే భాగఫలం ఎంత?',
      options: {
        a: '2',
        b: '3',
        c: '4',
        d: '6',
      },
      correctAnswer: 'B',
      explanation: '18ను 6తో భాగిస్తే 3 వస్తుంది.',
      language: QuestionLanguage.TELUGU,
      challengeType: 'ABCD',
      presentationType: 'Text',
    };

    QuestionCreationValidator.validateStructure(teluguPayload);
    assert(true, 'Test 6: Telugu question passes QuestionCreationValidator.validateStructure');
  } catch (err: any) {
    assert(false, 'Test 6: Telugu question structural validation', err.message);
  }

  // -------------------------------------------------------------
  // Test 7: Full Pipeline via QuestionService.createQuestionFromRequest
  // Testing with in-memory taxonomy fixture
  // -------------------------------------------------------------
  try {
    const actor = { id: 'USR-TEST', name: 'Regression Runner', role: UserRole.ADMIN };
    const testCategory = await taxonomyService.createCategory(
      {
        name: `Regression Category ${Date.now()}`,
        description: 'Test category for regression',
        colorCode: '#10B981',
      },
      actor
    );
    const catId = testCategory.id;

    const testTopic = await taxonomyService.createTopic({
      categoryId: catId,
      name: `Regression Topic ${Date.now()}`,
      slug: `reg-topic-${Date.now()}`,
    });

    const testSubtopic = await taxonomyService.createSubtopic({
      topicId: testTopic.id,
      name: `Regression Subtopic ${Date.now()}`,
      slug: `reg-subtopic-${Date.now()}`,
    });

    // 7A: Create with `question` alias only
    const createdFromQuestionAlias = await questionService.createQuestionFromRequest(
      {
        creationMode: 'manual',
        categoryId: catId,
        topicId: testTopic.id,
        subtopicId: testSubtopic.id,
        difficulty: 'Easy',
        question: 'If a car travels 60 km in 1 hour, what is its speed in km/h?',
        options: { a: '40 km/h', b: '60 km/h', c: '80 km/h', d: '100 km/h' },
        correctAnswer: 'B',
        explanation: 'Speed is distance divided by time: 60 km / 1 hr = 60 km/h.',
      } as any,
      { id: 'USR-TEST', name: 'Regression Runner', role: UserRole.ADMIN }
    );

    assert(
      Boolean(createdFromQuestionAlias.id) &&
        createdFromQuestionAlias.questionText === 'If a car travels 60 km in 1 hour, what is its speed in km/h?' &&
        createdFromQuestionAlias.question === 'If a car travels 60 km in 1 hour, what is its speed in km/h?',
      'Test 7A: createQuestionFromRequest successfully persists payload with `question` alias'
    );

    // 7B: Create with `content` alias only
    const createdFromContentAlias = await questionService.createQuestionFromRequest(
      {
        creationMode: 'manual',
        categoryId: catId,
        topicId: testTopic.id,
        subtopicId: testSubtopic.id,
        difficulty: 'Medium',
        content: 'Calculate the perimeter of a square with side length 5 meters.',
        options: { a: '15 m', b: '20 m', c: '25 m', d: '30 m' },
        correctAnswer: 'B',
        explanation: 'Perimeter of a square = 4 * side = 4 * 5 = 20 meters.',
      } as any,
      { id: 'USR-TEST', name: 'Regression Runner', role: UserRole.ADMIN }
    );

    assert(
      Boolean(createdFromContentAlias.id) &&
        createdFromContentAlias.questionText === 'Calculate the perimeter of a square with side length 5 meters.',
      'Test 7B: createQuestionFromRequest successfully persists payload with `content` alias'
    );

    // 7C: Telugu Question creation end-to-end
    const createdTelugu = await questionService.createQuestionFromRequest(
      {
        creationMode: 'manual',
        categoryId: catId,
        topicId: testTopic.id,
        subtopicId: testSubtopic.id,
        difficulty: 'Easy',
        questionText: '18ను 6తో భాగిస్తే భాగఫలం ఎంత?',
        options: {
          a: '2',
          b: '3',
          c: '4',
          d: '6',
        },
        correctAnswer: 'B',
        explanation: '18ను 6తో భాగిస్తే 3 వస్తుంది.',
        language: QuestionLanguage.TELUGU,
        challengeType: 'ABCD',
        presentationType: 'Text',
      },
      { id: 'USR-TEST', name: 'Regression Runner', role: UserRole.ADMIN }
    );

    assert(
      Boolean(createdTelugu.id) &&
        createdTelugu.questionText === '18ను 6తో భాగిస్తే భాగఫలం ఎంత?' &&
        createdTelugu.correctAnswer === 'B',
      'Test 7C: Telugu question creates successfully via questionService.createQuestionFromRequest'
    );

  } catch (err: any) {
    assert(false, 'Test 7: createQuestionFromRequest pipeline execution', err.message);
  }

  // -------------------------------------------------------------
  // Test 8: Deterministic mathematical contradiction is still rejected
  // -------------------------------------------------------------
  try {
    const actor = { id: 'USR-TEST', name: 'Regression Runner', role: UserRole.ADMIN };
    const testCategory = await taxonomyService.createCategory(
      {
        name: `Math Contradiction Category ${Date.now()}`,
        description: 'Test category for math contradiction',
        colorCode: '#EF4444',
      },
      actor
    );
    const catId = testCategory.id;

    const testTopic = await taxonomyService.createTopic({
      categoryId: catId,
      name: `Math Contradiction Topic ${Date.now()}`,
      slug: `math-contra-${Date.now()}`,
    });

    const testSubtopic = await taxonomyService.createSubtopic({
      topicId: testTopic.id,
      name: `Math Contradiction Subtopic ${Date.now()}`,
      slug: `math-contra-sub-${Date.now()}`,
    });

    // 10 + 20 = 30. Declaring Answer A (999) should trigger mathematical contradiction failure.
    await questionService.createQuestionFromRequest(
      {
        creationMode: 'manual',
        categoryId: catId,
        topicId: testTopic.id,
        subtopicId: testSubtopic.id,
        difficulty: 'Easy',
        questionText: 'What is 10 + 20?',
        options: { a: '999', b: '30', c: '40', d: '50' },
        correctAnswer: 'A', // Deliberately wrong
        explanation: '10 plus 20 is 30, but answer is set to A (999).',
      },
      { id: 'USR-TEST', name: 'Regression Runner', role: UserRole.ADMIN }
    );
    assert(false, 'Test 8: Mathematical contradiction should have been rejected by save gate');
  } catch (err: any) {
    assert(
      err.message.includes('Backend Save Gate') || err.message.includes('CONTRADICTORY') || err.message.includes('verification failure'),
      'Test 8: Mathematical contradiction is strictly rejected by save gate',
      err.message
    );
  }

  console.log(`\n=== REGRESSION SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED ===`);
  if (failedTests > 0) {
    process.exit(1);
  }
}

runRegressionSuite().catch((err) => {
  console.error('Unhandled error in regression suite:', err);
  process.exit(1);
});
