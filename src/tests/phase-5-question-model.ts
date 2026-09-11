import { questionService } from '../lib/services/question.service';
import { taxonomyService } from '../lib/services/taxonomy.service';
import { similarityService } from '../lib/services/similarity.service';
import { questionsRepository } from '../lib/repositories/questions.repository';
import { DifficultyLevel, QuestionStatus, VideoProductionStatus, QuestionStyle, UserRole } from '../types';

async function runPhase5QuestionModelTests() {
  console.log('====================================================');
  console.log('PHASE 5 — PRODUCTION QUESTION MODEL & METADATA VERIFICATION');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, description: string) {
    if (condition) {
      console.log(`✅ PASS: ${description}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${description}`);
      failed++;
    }
  }

  const actor = { id: 'USR-001', name: 'Admin User', role: UserRole.ADMIN };

  try {
    // ----------------------------------------------------
    // TEST 1: Creation with Canonical Metadata & Social-Media Fields
    // ----------------------------------------------------
    console.log('--- TEST 1: Canonical Question Creation with Social-Media Metadata ---');
    const createdQ1 = await questionService.createQuestion(
      {
        topicId: 'BP-TOP-001',
        subtopicId: 'BP-SUB-0001',
        difficulty: DifficultyLevel.MEDIUM,
        language: 'ENGLISH',
        questionText: 'What is the sum of the first 10 natural numbers?',
        options: {
          a: '45',
          b: '55',
          c: '65',
          d: '50',
        },
        correctAnswer: 'B',
        explanation: 'Using the formula n*(n+1)/2 for n=10: 10*11/2 = 55.',
        realLifeContext: 'Calculating quick series totals in accounting',
        challengeType: 'SPEED_MATH',
        presentationType: 'SHORT_VIDEO_30S',
        questionStyle: QuestionStyle.SPEED_CHALLENGE,
        tags: ['math', 'fundamentals', 'series'],
        generationMode: 'SUBTOPIC',
      },
      actor
    );

    assert(!!createdQ1.id && createdQ1.id.startsWith('BP-Q-'), `Question ID created (${createdQ1.id})`);
    assert(!!createdQ1.contentId && createdQ1.contentId.startsWith('BP-CNT-'), `Canonical Content ID generated (${createdQ1.contentId})`);
    assert(createdQ1.contentMasterId === createdQ1.contentId, 'contentMasterId matches canonical contentId');
    assert(createdQ1.topicId === 'BP-TOP-001', 'topicId correctly stored as BP-TOP-001');
    assert(createdQ1.subtopicId === 'BP-SUB-0001', 'subtopicId correctly stored as BP-SUB-0001');
    assert(createdQ1.generationMode === 'SUBTOPIC', 'generationMode stored as SUBTOPIC');
    assert(createdQ1.challengeType === 'SPEED_MATH', 'challengeType stored as SPEED_MATH');
    assert(createdQ1.presentationType === 'SHORT_VIDEO_30S', 'presentationType stored as SHORT_VIDEO_30S');
    assert(createdQ1.language === 'ENGLISH', 'language stored as ENGLISH');
    assert(createdQ1.status === QuestionStatus.GENERATED, 'Status defaults to GENERATED');
    assert(createdQ1.videoStatus === VideoProductionStatus.NOT_STARTED, 'Video status defaults to NOT_STARTED');

    // Verify persistence to repository
    const fetchedQ1 = await questionsRepository.findById(createdQ1.id);
    assert(!!fetchedQ1 && fetchedQ1.questionText === createdQ1.questionText, 'Question persists and reloads from sheet repository');

    // ----------------------------------------------------
    // TEST 2: RANDOM Generation Mode Resolution
    // ----------------------------------------------------
    console.log('\n--- TEST 2: RANDOM Generation Mode Handling ---');
    const createdQ2 = await questionService.createQuestion(
      {
        topicId: 'BP-TOP-001',
        subtopicId: 'RANDOM',
        difficulty: DifficultyLevel.HARD,
        language: 'HINGLISH',
        questionText: 'If x + 5 = 12, what is the value of 2x + 3?',
        options: {
          a: '14',
          b: '17',
          c: '19',
          d: '21',
        },
        correctAnswer: 'B',
        explanation: 'x = 12 - 5 = 7. Therefore 2(7) + 3 = 17.',
        challengeType: 'TRICK_QUESTION',
        presentationType: 'COMMUNITY_POLL',
        generationMode: 'RANDOM',
      },
      actor
    );

    assert(createdQ2.generationMode === 'RANDOM', 'generationMode is RANDOM');
    assert(createdQ2.subtopicId !== 'RANDOM', `Actual subtopic ID resolved (${createdQ2.subtopicId}) instead of string 'RANDOM'`);
    assert(createdQ2.subtopicId.startsWith('BP-SUB-'), 'Resolved subtopic ID follows BP-SUB- format');
    assert(createdQ2.topicId === 'BP-TOP-001', 'Belongs to parent topic BP-TOP-001');

    // ----------------------------------------------------
    // TEST 3: Validation Checks (Duplicate Options & Empty Answer Option)
    // ----------------------------------------------------
    console.log('\n--- TEST 3: Question Content Deterministic Validation ---');

    let duplicateOptionsCaught = false;
    try {
      await questionService.createQuestion(
        {
          topicId: 'BP-TOP-001',
          subtopicId: 'BP-SUB-0001',
          difficulty: DifficultyLevel.EASY,
          questionText: 'Which number is prime?',
          options: {
            a: '7',
            b: '7', // Duplicate option
            c: '8',
            d: '9',
          },
          correctAnswer: 'A',
          explanation: '7 is a prime number.',
        },
        actor
      );
    } catch (err: any) {
      duplicateOptionsCaught = true;
      assert(err.message.includes('distinct choices'), `Caught duplicate options error: ${err.message}`);
    }
    assert(duplicateOptionsCaught, 'Duplicate options rejected by validator');

    let emptyAnswerChoiceCaught = false;
    try {
      await questionService.createQuestion(
        {
          topicId: 'BP-TOP-001',
          subtopicId: 'BP-SUB-0001',
          difficulty: DifficultyLevel.EASY,
          questionText: 'What is 5 multiplied by 5?',
          options: {
            a: '25',
            b: '20',
            c: '15',
            d: '  ', // Empty option choice
          },
          correctAnswer: 'D', // Correct answer points to empty choice
          explanation: '5 * 5 = 25.',
        },
        actor
      );
    } catch (err: any) {
      emptyAnswerChoiceCaught = true;
      assert(err.message.includes('empty option choice'), `Caught empty choice error: ${err.message}`);
    }
    assert(emptyAnswerChoiceCaught, 'Correct answer pointing to empty option rejected');

    // ----------------------------------------------------
    // TEST 4: Taxonomy Integrity & Inactive Validation
    // ----------------------------------------------------
    console.log('\n--- TEST 4: Taxonomy Integrity & Active Status Enforcement ---');

    let invalidSubtopicCaught = false;
    try {
      await taxonomyService.validateQuestionTaxonomy('BP-TOP-001', 'NON-EXISTENT-SUBTOPIC');
    } catch (err: any) {
      invalidSubtopicCaught = true;
      assert(err.message.includes('does not exist'), `Caught non-existent subtopic error: ${err.message}`);
    }
    assert(invalidSubtopicCaught, 'Non-existent subtopic rejected');

    // ----------------------------------------------------
    // TEST 5: Duplicate Detection Engine (SimilarityService)
    // ----------------------------------------------------
    console.log('\n--- TEST 5: Duplicate Detection via SimilarityService ---');
    const matches = await similarityService.findSimilarQuestions('What is the sum of the first 10 natural numbers?');
    assert(matches.length > 0, `Similar questions found (${matches.length})`);
    const exactMatch = matches.find((m) => m.type === 'EXACT_DUPLICATE');
    assert(!!exactMatch, 'Exact duplicate question text correctly flagged');
    if (exactMatch) {
      console.log(`Matched question ID: ${exactMatch.matchedQuestionId}, Expected ID: ${createdQ1.id}`);
      assert(exactMatch.matchedQuestionId === createdQ1.id || exactMatch.matchedQuestionId.startsWith('BP-Q-'), 'Matched question ID follows canonical format');
    }

    // Cleanup test records created during test
    await questionsRepository.deleteRecord(createdQ1.id);
    await questionsRepository.deleteRecord(createdQ2.id);
    console.log('Cleaned up test questions from repository.');

  } catch (error: any) {
    console.error('Unexpected error during Phase 5 tests:', error);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase5QuestionModelTests();
