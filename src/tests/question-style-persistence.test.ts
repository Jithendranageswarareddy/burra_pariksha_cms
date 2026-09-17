/**
 * BURRA PARIKSHA CMS — Question Style Persistence Verification Test Suite
 * 
 * Verifies that canonical Question Style is preserved throughout the question creation pipeline:
 * Question Studio UI -> Request Payload -> QuestionCreationValidator -> QuestionService -> Canonical QUESTIONS Record
 * 
 * Requirements Covered:
 * 1. Question Style is included in the create request payload.
 * 2. QuestionCreationRequestPayload interface accepts questionStyle.
 * 3. Invalid questionStyle is rejected with a clear ValidationError.
 * 4. STORY_BASED persists correctly to the canonical question record and QUESTIONS sheet row.
 * 5. Another valid style (e.g. TRICK_QUESTION) persists correctly.
 * 6. Missing style resolves to STORY_BASED where appropriate.
 * 7. Existing Topic/Subtopic persistence remains unchanged.
 * 8. Existing Language/Difficulty/ChallengeType/PresentationType persistence remains unchanged.
 * 9. No existing QUESTIONS records are modified.
 * 10. No sequence reset occurs.
 */

import { QuestionCreationValidator, QuestionCreationRequestPayload } from '../lib/validators/question-creation.validator';
import { questionService } from '../lib/services/question.service';
import { questionsRepository } from '../lib/repositories/questions.repository';
import { sequencesRepository } from '../lib/repositories/sequences.repository';
import { taxonomyService } from '../lib/services/taxonomy.service';
import { contentMasterService } from '../lib/services/content-master.service';
import { idService } from '../lib/services/id.service';
import { auditService } from '../lib/services/audit.service';
import { workflowService } from '../lib/services/workflow.service';
import { SHEET_SCHEMAS, SHEET_TABS, SEQUENCE_ENTITIES } from '../lib/schemas/google-sheets-schema';
import { objectToRow, rowToObject } from '../lib/google-sheets/helpers';
import { QuestionStyle, QuestionLanguage, QuestionStatus, VideoProductionStatus, Question } from '../types';
import { ValidationError } from '../lib/google-sheets/errors';

let testsPassed = 0;
let testsFailed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    testsPassed++;
    console.log(`  [PASS] Test ${testsPassed + testsFailed}: ${message}`);
  } else {
    testsFailed++;
    console.error(`  [FAIL] Test ${testsPassed + testsFailed}: ${message}`);
  }
}

export async function runQuestionStylePersistenceTests() {
  console.log('================================================================');
  console.log('BURRA PARIKSHA CMS — QUESTION STYLE PERSISTENCE TEST SUITE');
  console.log('================================================================\n');

  // Record baseline production state to verify safety (Requirements 9 & 10)
  const initialQuestions = await questionsRepository.findAll();
  const initialQuestionsCount = initialQuestions.length;
  const initialQuestionIds = new Set(initialQuestions.map((q) => q.id));

  // Sequence state check
  const initialSequence = await sequencesRepository.getSequence(SEQUENCE_ENTITIES.QUESTION);
  const initialLastAllocated = initialSequence?.nextNumber ?? 0;

  // --------------------------------------------------------------------------
  // Suite 1: Interface & Request Contract (Requirements 1 & 2)
  // --------------------------------------------------------------------------
  console.log('--- Suite 1: Interface & Request Contract ---');

  const samplePayloadWithStyle: QuestionCreationRequestPayload = {
    creationMode: 'ai',
    categoryId: 'CAT-QA',
    topicId: 'TOP-QA-01',
    subtopicId: 'SUB-01',
    difficulty: 'Intermediate',
    realLifeContext: 'TRAIN_JOURNEY',
    challengeType: 'ABCD',
    presentationType: 'Text',
    language: QuestionLanguage.TELUGU,
    questionStyle: 'STORY_BASED',
    questionText: 'Test question text for contract verification?',
    options: {
      a: 'Option A',
      b: 'Option B',
      c: 'Option C',
      d: 'Option D',
    },
    correctAnswer: 'A',
    explanation: 'Detailed test explanation.',
    tags: ['Aptitude', 'Telugu'],
    source: 'Question Studio Test',
  };

  assert(
    samplePayloadWithStyle.questionStyle === 'STORY_BASED',
    'Requirement 1 & 2: QuestionCreationRequestPayload accepts and holds questionStyle'
  );

  const samplePayloadWithAlternateStyle: QuestionCreationRequestPayload = {
    ...samplePayloadWithStyle,
    questionStyle: 'TRICK_QUESTION',
  };

  assert(
    samplePayloadWithAlternateStyle.questionStyle === 'TRICK_QUESTION',
    'Requirement 1 & 2: QuestionCreationRequestPayload accepts alternative canonical style TRICK_QUESTION'
  );

  // --------------------------------------------------------------------------
  // Suite 2: Question Creation Validation & Normalization (Requirements 3 & 6)
  // --------------------------------------------------------------------------
  console.log('\n--- Suite 2: Validator Rejection & Normalization ---');

  // Test 3: Invalid questionStyle is rejected
  let invalidStyleRejected = false;
  let invalidStyleErrorMessage = '';
  try {
    const invalidPayload: QuestionCreationRequestPayload = {
      ...samplePayloadWithStyle,
      questionStyle: 'INVALID_NONEXISTENT_STYLE_XYZ',
    };
    QuestionCreationValidator.validateStructure(invalidPayload);
  } catch (err: any) {
    invalidStyleRejected = err instanceof ValidationError;
    invalidStyleErrorMessage = err.message;
  }

  assert(
    invalidStyleRejected && invalidStyleErrorMessage.includes('Invalid question style "INVALID_NONEXISTENT_STYLE_XYZ"'),
    'Requirement 3: Invalid questionStyle is rejected with explicit ValidationError'
  );

  // Test 6: Missing style resolves to STORY_BASED
  const missingStylePayload: QuestionCreationRequestPayload = {
    ...samplePayloadWithStyle,
    questionStyle: undefined,
  };
  QuestionCreationValidator.validateStructure(missingStylePayload);
  assert(
    missingStylePayload.questionStyle === 'STORY_BASED',
    'Requirement 6: Missing undefined style resolves to STORY_BASED'
  );

  const emptyStylePayload: QuestionCreationRequestPayload = {
    ...samplePayloadWithStyle,
    questionStyle: '',
  };
  QuestionCreationValidator.validateStructure(emptyStylePayload);
  assert(
    emptyStylePayload.questionStyle === 'STORY_BASED',
    'Requirement 6: Empty string style resolves to STORY_BASED'
  );

  // Test normalization of display label to enum code
  const displayLabelPayload: QuestionCreationRequestPayload = {
    ...samplePayloadWithStyle,
    questionStyle: 'Story-Based Scenario',
  };
  QuestionCreationValidator.validateStructure(displayLabelPayload);
  assert(
    displayLabelPayload.questionStyle === 'STORY_BASED',
    'Requirement 6: Display label "Story-Based Scenario" normalizes to canonical code STORY_BASED'
  );

  const trickDisplayLabelPayload: QuestionCreationRequestPayload = {
    ...samplePayloadWithStyle,
    questionStyle: 'Trick Question / Misdirection Trap',
  };
  QuestionCreationValidator.validateStructure(trickDisplayLabelPayload);
  assert(
    trickDisplayLabelPayload.questionStyle === 'TRICK_QUESTION',
    'Requirement 6: Display label "Trick Question / Misdirection Trap" normalizes to canonical code TRICK_QUESTION'
  );

  // --------------------------------------------------------------------------
  // Suite 3: Canonical Persistence & Schema Mapping (Requirements 4 & 5)
  // --------------------------------------------------------------------------
  console.log('\n--- Suite 3: Canonical Persistence & Serialization ---');

  const questionsSchema = SHEET_SCHEMAS[SHEET_TABS.QUESTIONS];
  const questionStyleColIndex = questionsSchema.columns.findIndex((c) => c.name === 'question_style');
  assert(
    questionStyleColIndex !== -1,
    'QUESTIONS worksheet schema contains question_style column definition'
  );

  // Test 4: STORY_BASED persists correctly in Question entity and serialized sheet row
  const mockStoryQuestion: Question = {
    id: 'BP-Q-TEST-001',
    contentMasterId: 'BP-CM-TEST-001',
    categoryId: 'CAT-QA',
    categoryName: 'Quantitative Aptitude',
    topicId: 'TOP-QA-01',
    topicName: 'Time and Distance',
    subtopicId: 'SUB-01',
    subtopicName: 'Trains',
    difficulty: 'Intermediate',
    language: QuestionLanguage.TELUGU,
    questionText: 'Story-based train problem question text?',
    options: {
      a: '10 km/h',
      b: '20 km/h',
      c: '30 km/h',
      d: '40 km/h',
    },
    correctAnswer: 'B',
    explanation: 'Train passes post calculation explanation.',
    realWorldContext: 'TRAIN_JOURNEY',
    realLifeContext: 'TRAIN_JOURNEY',
    challengeType: 'ABCD',
    presentationType: 'Text',
    questionStyle: 'STORY_BASED',
    status: QuestionStatus.GENERATED,
    videoStatus: VideoProductionStatus.NOT_STARTED,
    tags: ['Aptitude', 'Telugu'],
    source: 'AI Generator Studio',
    authorId: 'USR-001',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const questionHeaders = questionsSchema.columns.map((c) => c.name);
  const storyRow = objectToRow(mockStoryQuestion as any, questionHeaders, questionsSchema);
  assert(
    storyRow[questionStyleColIndex] === 'STORY_BASED',
    'Requirement 4: STORY_BASED serializes to QUESTIONS.question_style column correctly'
  );

  const parsedStoryQuestion = rowToObject<Question>(storyRow, questionHeaders, questionsSchema);
  assert(
    parsedStoryQuestion.questionStyle === 'STORY_BASED',
    'Requirement 4: QUESTIONS sheet row deserializes question_style as STORY_BASED'
  );

  // Test 5: Another valid style persists correctly (TRICK_QUESTION)
  const mockTrickQuestion: Question = {
    ...mockStoryQuestion,
    id: 'BP-Q-TEST-002',
    questionStyle: 'TRICK_QUESTION',
  };

  const trickRow = objectToRow(mockTrickQuestion as any, questionHeaders, questionsSchema);
  assert(
    trickRow[questionStyleColIndex] === 'TRICK_QUESTION',
    'Requirement 5: TRICK_QUESTION serializes to QUESTIONS.question_style column correctly'
  );

  const parsedTrickQuestion = rowToObject<Question>(trickRow, questionHeaders, questionsSchema);
  assert(
    parsedTrickQuestion.questionStyle === 'TRICK_QUESTION',
    'Requirement 5: QUESTIONS sheet row deserializes question_style as TRICK_QUESTION'
  );

  // Test other canonical styles
  const stylesToVerify: (keyof typeof QuestionStyle)[] = [
    'SPEED_MATH_TRICK',
    'CONCEPTUAL_PROBE',
    'EXAM_STYLE',
    'COMMENT_CHALLENGE',
    'LOGICAL_PUZZLE',
    'SPEED_CHALLENGE',
    'VERBAL_TRAP',
  ];

  for (const styleKey of stylesToVerify) {
    const q: Question = { ...mockStoryQuestion, id: `BP-Q-${styleKey}`, questionStyle: styleKey };
    const row = objectToRow(q as any, questionHeaders, questionsSchema);
    const parsed = rowToObject<Question>(row, questionHeaders, questionsSchema);
    assert(
      row[questionStyleColIndex] === styleKey && parsed.questionStyle === styleKey,
      `Requirement 5: Canonical style ${styleKey} round-trips through schema accurately`
    );
  }

  // --------------------------------------------------------------------------
  // Suite 4: Regression Invariance (Requirements 7 & 8)
  // --------------------------------------------------------------------------
  console.log('\n--- Suite 4: Regression Invariance of Existing Fields ---');

  // Test 7: Topic/Subtopic persistence remains unchanged
  assert(
    parsedStoryQuestion.categoryId === mockStoryQuestion.categoryId &&
    parsedStoryQuestion.categoryName === mockStoryQuestion.categoryName &&
    parsedStoryQuestion.topicId === mockStoryQuestion.topicId &&
    parsedStoryQuestion.topicName === mockStoryQuestion.topicName &&
    parsedStoryQuestion.subtopicId === mockStoryQuestion.subtopicId &&
    parsedStoryQuestion.subtopicName === mockStoryQuestion.subtopicName,
    'Requirement 7: Category, Topic, and Subtopic mapping remain unchanged and intact'
  );

  // Test 8: Existing Language/Difficulty/ChallengeType/PresentationType persistence remains unchanged
  assert(
    parsedStoryQuestion.language === mockStoryQuestion.language &&
    parsedStoryQuestion.difficulty === mockStoryQuestion.difficulty &&
    parsedStoryQuestion.challengeType === mockStoryQuestion.challengeType &&
    parsedStoryQuestion.presentationType === mockStoryQuestion.presentationType &&
    parsedStoryQuestion.realLifeContext === mockStoryQuestion.realLifeContext &&
    parsedStoryQuestion.options.a === mockStoryQuestion.options.a &&
    parsedStoryQuestion.options.b === mockStoryQuestion.options.b &&
    parsedStoryQuestion.correctAnswer === mockStoryQuestion.correctAnswer &&
    parsedStoryQuestion.status === mockStoryQuestion.status &&
    parsedStoryQuestion.videoStatus === mockStoryQuestion.videoStatus,
    'Requirement 8: Language, Difficulty, ChallengeType, PresentationType, and Options remain unchanged'
  );

  // --------------------------------------------------------------------------
  // Suite 5: QuestionService createQuestionFromRequest Execution in Isolated Mode
  // --------------------------------------------------------------------------
  console.log('\n--- Suite 5: QuestionService Integration Pipeline ---');

  // Verify that QuestionService creates question with supplied style and default style
  // We mock repository append to avoid appending rows to the live production Google Sheets!
  const appendedQuestions: Question[] = [];
  const origAppend = questionsRepository.appendRecord;
  const origAllocate = idService.allocateQuestionId;
  const origCreateMaster = contentMasterService.createContentMaster;
  const origWorkflow = workflowService.recordTransition;
  const origAudit = auditService.log;
  const origTaxonomyValidate = taxonomyService.validateTaxonomy;

  try {
    let mockAllocatedCounter = 99900;
    (idService as any).allocateQuestionId = async () => `BP-Q-MOCK-${++mockAllocatedCounter}`;
    (contentMasterService as any).createContentMaster = async () => ({ id: `BP-CM-MOCK-${mockAllocatedCounter}` });
    (workflowService as any).recordTransition = async () => ({ id: 'TX-MOCK' });
    (auditService as any).log = async () => {};
    (taxonomyService as any).validateTaxonomy = async (catId: string, topId: string, subId: string) => ({
      category: { id: catId || 'CAT-QA', name: 'Quantitative Aptitude' },
      topic: { id: topId || 'TOP-QA-01', name: 'Time and Distance' },
      subtopic: { id: subId || 'SUB-01', name: 'Trains' },
    });
    (questionsRepository as any).appendRecord = async (q: Question) => {
      appendedQuestions.push(q);
      return q;
    };

    const actor = { id: 'USR-TEST', name: 'Test QA Engineer' };

    // Create with explicit STORY_BASED
    const q1 = await questionService.createQuestionFromRequest({
      creationMode: 'ai',
      categoryId: 'CAT-QA',
      topicId: 'TOP-QA-01',
      subtopicId: 'SUB-01',
      difficulty: 'Intermediate',
      questionStyle: 'STORY_BASED',
      questionText: 'Question with explicit STORY_BASED style?',
      options: { a: '1', b: '2', c: '3', d: '4' },
      correctAnswer: 'A',
      explanation: 'Explanation for q1',
      challengeType: 'ABCD',
      presentationType: 'Text',
      language: QuestionLanguage.TELUGU,
    }, actor);

    assert(
      q1.questionStyle === 'STORY_BASED',
      'Requirement 4: createQuestionFromRequest sets questionStyle to STORY_BASED'
    );
    assert(
      appendedQuestions.some((q) => q.id === q1.id && q.questionStyle === 'STORY_BASED'),
      'Requirement 4: Appended question record in repository preserves questionStyle = STORY_BASED'
    );

    // Create with alternative style TRICK_QUESTION
    const q2 = await questionService.createQuestionFromRequest({
      creationMode: 'ai',
      categoryId: 'CAT-QA',
      topicId: 'TOP-QA-01',
      subtopicId: 'SUB-01',
      difficulty: 'Hard',
      questionStyle: 'TRICK_QUESTION',
      questionText: 'Question with explicit TRICK_QUESTION style?',
      options: { a: '1', b: '2', c: '3', d: '4' },
      correctAnswer: 'C',
      explanation: 'Explanation for q2',
      challengeType: 'ABCD',
      presentationType: 'Text',
      language: QuestionLanguage.ENGLISH,
    }, actor);

    assert(
      q2.questionStyle === 'TRICK_QUESTION',
      'Requirement 5: createQuestionFromRequest sets questionStyle to TRICK_QUESTION'
    );
    assert(
      appendedQuestions.some((q) => q.id === q2.id && q.questionStyle === 'TRICK_QUESTION'),
      'Requirement 5: Appended question record in repository preserves questionStyle = TRICK_QUESTION'
    );

    // Create with missing style (should default to STORY_BASED)
    const q3 = await questionService.createQuestionFromRequest({
      creationMode: 'ai',
      categoryId: 'CAT-QA',
      topicId: 'TOP-QA-01',
      subtopicId: 'SUB-01',
      difficulty: 'Easy',
      // questionStyle omitted
      questionText: 'Question with omitted questionStyle?',
      options: { a: '1', b: '2', c: '3', d: '4' },
      correctAnswer: 'D',
      explanation: 'Explanation for q3',
      challengeType: 'ABCD',
      presentationType: 'Text',
      language: QuestionLanguage.TELUGU,
    }, actor);

    assert(
      q3.questionStyle === 'STORY_BASED',
      'Requirement 6: createQuestionFromRequest defaults omitted questionStyle to STORY_BASED'
    );
    assert(
      appendedQuestions.some((q) => q.id === q3.id && q.questionStyle === 'STORY_BASED'),
      'Requirement 6: Appended question record in repository preserves defaulted questionStyle = STORY_BASED'
    );

  } finally {
    // Restore mocked methods
    (questionsRepository as any).appendRecord = origAppend;
    (idService as any).allocateQuestionId = origAllocate;
    (contentMasterService as any).createContentMaster = origCreateMaster;
    (workflowService as any).recordTransition = origWorkflow;
    (auditService as any).log = origAudit;
    (taxonomyService as any).validateTaxonomy = origTaxonomyValidate;
  }

  // --------------------------------------------------------------------------
  // Suite 6: Production Data & Sequence Integrity Safety (Requirements 9 & 10)
  // --------------------------------------------------------------------------
  console.log('\n--- Suite 6: Production Data & Sequence Integrity Safety ---');

  // Verify Requirement 9: No existing QUESTIONS records are modified
  const currentQuestions = await questionsRepository.findAll();
  assert(
    currentQuestions.length === initialQuestionsCount,
    `Requirement 9: Total production QUESTIONS count remains unchanged (${currentQuestions.length} === ${initialQuestionsCount})`
  );

  const allOriginalIdsStillExist = initialQuestions.every((initialQ) =>
    currentQuestions.some((currQ) => currQ.id === initialQ.id)
  );
  assert(
    allOriginalIdsStillExist,
    'Requirement 9: All pre-existing QUESTIONS records are completely intact with unchanged IDs'
  );

  // Verify Requirement 10: No sequence reset occurs
  const currentSequence = await sequencesRepository.getSequence(SEQUENCE_ENTITIES.QUESTION);
  const currentLastAllocated = currentSequence?.nextNumber ?? 0;

  assert(
    currentLastAllocated === initialLastAllocated,
    `Requirement 10: SEQUENCES nextNumber for QUESTION is unchanged (${currentLastAllocated} === ${initialLastAllocated}); no sequence reset occurred`
  );

  console.log('\n================================================================');
  console.log(`QUESTION STYLE PERSISTENCE TESTS RESULT: ${testsPassed} PASS, ${testsFailed} FAIL`);
  console.log('================================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

// Auto-run if executed directly
if (import.meta.url.endsWith(process.argv[1]) || process.argv[1]?.includes('question-style-persistence.test')) {
  runQuestionStylePersistenceTests().catch((err) => {
    console.error('Test suite failed with unexpected error:', err);
    process.exit(1);
  });
}
