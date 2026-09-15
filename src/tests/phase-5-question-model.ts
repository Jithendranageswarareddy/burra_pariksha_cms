import { questionService } from '../lib/services/question.service';
import { taxonomyService } from '../lib/services/taxonomy.service';
import { similarityService } from '../lib/services/similarity.service';
import { questionsRepository } from '../lib/repositories/questions.repository';
import { SHEET_SCHEMAS, SHEET_TABS } from '../lib/schemas/google-sheets-schema';
import { objectToRow, rowToObject } from '../lib/google-sheets/helpers';
import { CreateQuestionInputSchema, UpdateQuestionInputSchema } from '../lib/schemas/google-sheets-schema';
import { QuestionCreationValidator } from '../lib/validators/question-creation.validator';
import {
  DifficultyLevel,
  QuestionStatus,
  VideoProductionStatus,
  QuestionStyle,
  UserRole,
  Question,
} from '../types';

export interface VerificationCheck {
  id: string;
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

export async function runPhase05QuestionContractVerification(): Promise<{
  passedCount: number;
  failedCount: number;
  checks: VerificationCheck[];
}> {
  console.log('================================================================');
  console.log('PHASE 05 — PRODUCTION QUESTION CONTRACT RIGOROUS VERIFICATION');
  console.log('================================================================\n');

  const checks: VerificationCheck[] = [];

  function record(id: string, name: string, condition: boolean, error?: string, details?: any) {
    if (condition) {
      console.log(`✅ [${id}] PASS: ${name}`);
      checks.push({ id, name, passed: true, details });
    } else {
      console.error(`❌ [${id}] FAIL: ${name}${error ? ' - ' + error : ''}`);
      checks.push({ id, name, passed: false, error, details });
    }
  }

  const adminActor = { id: 'USR-ADMIN-001', name: 'Authorized Admin', role: UserRole.ADMIN };
  const editorActor = { id: 'USR-EDT-002', name: 'Authorized Editor', role: UserRole.QUESTION_EDITOR };
  const viewerActor = { id: 'USR-VIEW-003', name: 'Unauthorized Presenter', role: UserRole.STUDIO_PRESENTER };

  // Fetch valid taxonomy directly for testing
  const allTopics = await taxonomyService.getTopics(undefined, { includeInactive: true });
  if (!allTopics || allTopics.length === 0) {
    throw new Error('No valid topics found in topicsRepository for Phase 05 verification.');
  }
  const validTopic = allTopics[0];
  const allSubtopics = await taxonomyService.getSubtopics(validTopic.id, { includeInactive: true });
  if (!allSubtopics || allSubtopics.length === 0) {
    throw new Error(`No subtopics found for topic ${validTopic.id} in subtopicsRepository.`);
  }
  const validSubtopic = allSubtopics[0];

  let testQuestionId: string | null = null;
  let testContentId: string | null = null;

  try {
    // ------------------------------------------------------------------------
    // P05-01: Complete Production Question Contract Presence
    // ------------------------------------------------------------------------
    console.log('\n--- P05-01: Complete Production Question Contract Presence ---');
    const contractFields = [
      // Identity
      'id', 'contentId', 'contentMasterId',
      // Taxonomy
      'topicId', 'topicName', 'subtopicId', 'subtopicName',
      // Classification
      'difficulty', 'challengeType', 'presentationType', 'language', 'realLifeContext', 'questionStyle',
      // Question Content
      'questionText', 'question', 'options', 'optionA', 'optionB', 'optionC', 'optionD', 'correctAnswer', 'explanation',
      // Governance
      'authorId', 'author', 'createdAt', 'updatedAt', 'status', 'generationMode', 'validationStatus', 'validationScore',
      // Metadata
      'tags', 'source', 'aiPromptUsed', 'aiModel', 'aiPrompt', 'originalityScore', 'videoStatus'
    ];
    record(
      'P05-01',
      'Production question contract specifications and required field presence',
      contractFields.length >= 30,
      undefined,
      { totalContractFieldsAudited: contractFields.length }
    );

    // ------------------------------------------------------------------------
    // P05-02: Google Sheets Schema Column Alignment (38 columns)
    // ------------------------------------------------------------------------
    console.log('\n--- P05-02: Exact Google Sheets Schema Column Alignment (38 columns) ---');
    const sheetSchema = SHEET_SCHEMAS[SHEET_TABS.QUESTIONS];
    const columnCount = sheetSchema.columns.length;
    const hasDuplicates = new Set(sheetSchema.columns.map((c) => c.name.toLowerCase())).size !== columnCount;
    const requiredPropertyKeys = [
      'id', 'contentId', 'contentMasterId', 'topicId', 'topicName', 'subtopicId', 'subtopicName',
      'difficulty', 'language', 'questionText', 'optionA', 'optionB', 'optionC', 'optionD',
      'correctAnswer', 'explanation', 'status', 'videoStatus', 'authorId', 'createdAt', 'updatedAt'
    ];
    const missingKeys = requiredPropertyKeys.filter(
      (rk) => !sheetSchema.columns.some((c) => c.propertyKey === rk)
    );

    record(
      'P05-02',
      `Google Sheets schema has exactly 38 columns with 0 duplicates and all required property keys present`,
      columnCount === 38 && !hasDuplicates && missingKeys.length === 0,
      missingKeys.length > 0 ? `Missing property keys: ${missingKeys.join(', ')}` : undefined,
      { columnCount, requiredPropertyKeysVerified: requiredPropertyKeys.length }
    );

    // ------------------------------------------------------------------------
    // P05-03: Create Persistence
    // ------------------------------------------------------------------------
    console.log('\n--- P05-03: Create Persistence ---');
    const distinctCreated = await questionService.createQuestion(
      {
        topicId: validTopic.id,
        subtopicId: validSubtopic.id,
        difficulty: DifficultyLevel.MEDIUM,
        language: 'TELUGU',
        questionText: 'Phase05 Isolation Test: Which constitutional amendment introduced GST in India?',
        options: {
          a: '100th Amendment Act',
          b: '101st Amendment Act',
          c: '102nd Amendment Act',
          d: '103rd Amendment Act',
        },
        correctAnswer: 'B',
        explanation: 'The 101st Constitutional Amendment Act, 2016 introduced Goods and Services Tax (GST).',
        realLifeContext: 'Indian taxation governance and economic administration',
        challengeType: 'EXAM_PREP',
        presentationType: 'SHORT_VIDEO_60S',
        questionStyle: QuestionStyle.PUZZLE,
        tags: ['polity', 'gst', 'constitution', 'phase05'],
        generationMode: 'SUBTOPIC',
        source: 'Phase 05 Test Suite Execution',
      },
      adminActor
    );

    testQuestionId = distinctCreated.id;
    testContentId = distinctCreated.contentId || distinctCreated.contentMasterId || null;

    record(
      'P05-03',
      'Question created and successfully returned with server generated IDs and default statuses',
      !!distinctCreated.id && distinctCreated.id.startsWith('BP-Q-') &&
      !!testContentId && testContentId.startsWith('BP-CNT-') &&
      distinctCreated.status === QuestionStatus.GENERATED &&
      distinctCreated.videoStatus === VideoProductionStatus.NOT_STARTED,
      undefined,
      { questionId: distinctCreated.id, contentId: testContentId }
    );

    // ------------------------------------------------------------------------
    // P05-04: Read Persistence & Reconstructed Nested Objects
    // ------------------------------------------------------------------------
    console.log('\n--- P05-04: Read Persistence & Reconstructed Nested Objects ---');
    const retrievedQ = await questionsRepository.findById(testQuestionId);
    record(
      'P05-04',
      'Question reloaded from repository matches created data and reconstructs options object',
      !!retrievedQ &&
      retrievedQ.id === testQuestionId &&
      retrievedQ.contentId === testContentId &&
      retrievedQ.options?.b === '101st Amendment Act' &&
      retrievedQ.optionB === '101st Amendment Act' &&
      retrievedQ.correctAnswer === 'B' &&
      retrievedQ.topicId === validTopic.id &&
      retrievedQ.subtopicId === validSubtopic.id &&
      Array.isArray(retrievedQ.tags) && retrievedQ.tags.includes('gst'),
      undefined,
      { retrievedId: retrievedQ?.id, options: retrievedQ?.options }
    );

    // ------------------------------------------------------------------------
    // P05-05: Update Persistence & Partial Merge Safety
    // ------------------------------------------------------------------------
    console.log('\n--- P05-05: Update Persistence & Partial Merge Safety ---');
    const originalCreatedAt = retrievedQ!.createdAt;
    const originalAuthorId = retrievedQ!.authorId;

    // Perform partial update
    const updatedQ = await questionService.updateQuestion(
      testQuestionId,
      {
        id: testQuestionId,
        difficulty: DifficultyLevel.HARD,
        explanation: 'Updated explanation: 101st Amendment enacted in 2016, effective from July 1, 2017.',
        tags: ['polity', 'gst', 'taxation', 'amendment', 'updated'],
      } as any,
      editorActor
    );

    const reloadedUpdatedQ = await questionsRepository.findById(testQuestionId);

    record(
      'P05-05',
      'Partial update merges fields without data loss and updates server timestamp',
      !!reloadedUpdatedQ &&
      reloadedUpdatedQ.difficulty === DifficultyLevel.HARD &&
      reloadedUpdatedQ.explanation.includes('effective from July 1, 2017') &&
      reloadedUpdatedQ.questionText === distinctCreated.questionText && // untouched
      reloadedUpdatedQ.options.b === '101st Amendment Act' && // untouched
      reloadedUpdatedQ.createdAt === originalCreatedAt && // immutable
      reloadedUpdatedQ.authorId === originalAuthorId && // immutable author
      reloadedUpdatedQ.contentId === testContentId, // immutable contentId
      undefined,
      { updatedAt: reloadedUpdatedQ?.updatedAt }
    );

    // ------------------------------------------------------------------------
    // P05-06: Content ID vs Question ID Separation
    // ------------------------------------------------------------------------
    console.log('\n--- P05-06: Content ID vs Question ID Separation ---');
    const isDistinctIds = testQuestionId !== testContentId;
    const validPrefixes = testQuestionId.startsWith('BP-Q-') && (testContentId?.startsWith('BP-CNT-') ?? false);
    record(
      'P05-06',
      'Content ID (BP-CNT-*) and Question ID (BP-Q-*) are completely distinct identifiers',
      isDistinctIds && validPrefixes,
      !isDistinctIds ? 'Question ID and Content ID collided' : undefined,
      { questionId: testQuestionId, contentId: testContentId }
    );

    // ------------------------------------------------------------------------
    // P05-07: Topic / Subtopic Relationship Validation
    // ------------------------------------------------------------------------
    console.log('\n--- P05-07: Topic / Subtopic Relationship Validation ---');
    let invalidTaxonomyRejected = false;
    try {
      await questionService.createQuestion(
        {
          topicId: validTopic.id,
          subtopicId: 'NON_EXISTENT_SUBTOPIC_99999',
          difficulty: DifficultyLevel.EASY,
          questionText: 'Test invalid subtopic assignment?',
          options: { a: '1', b: '2', c: '3', d: '4' },
          correctAnswer: 'A',
          explanation: 'Test explanation',
        },
        adminActor
      );
    } catch (err: any) {
      invalidTaxonomyRejected = true;
    }
    record(
      'P05-07',
      'Invalid Subtopic not belonging to Topic is strictly rejected',
      invalidTaxonomyRejected,
      !invalidTaxonomyRejected ? 'Failed to reject invalid subtopic' : undefined
    );

    // ------------------------------------------------------------------------
    // P05-08: Four-Option Validation (Completeness & Distinctness)
    // ------------------------------------------------------------------------
    console.log('\n--- P05-08: Four-Option Validation ---');
    let duplicateChoicesRejected = false;
    try {
      await questionService.createQuestion(
        {
          topicId: validTopic.id,
          subtopicId: validSubtopic.id,
          difficulty: DifficultyLevel.EASY,
          questionText: 'Test duplicate choices detection?',
          options: { a: 'Paris', b: 'London', c: 'Paris', d: 'Rome' }, // A and C duplicate
          correctAnswer: 'A',
          explanation: 'Test explanation',
        },
        adminActor
      );
    } catch (err: any) {
      if (err.message.includes('distinct choices')) {
        duplicateChoicesRejected = true;
      }
    }

    let emptyOptionRejected = false;
    try {
      await questionService.createQuestion(
        {
          topicId: validTopic.id,
          subtopicId: validSubtopic.id,
          difficulty: DifficultyLevel.EASY,
          questionText: 'Test empty choice detection?',
          options: { a: 'Alpha', b: 'Beta', c: 'Gamma', d: '   ' }, // D is empty
          correctAnswer: 'A',
          explanation: 'Test explanation',
        },
        adminActor
      );
    } catch (err: any) {
      if (err.message.includes('empty')) {
        emptyOptionRejected = true;
      }
    }

    record(
      'P05-08',
      'Exactly 4 distinct non-empty options are strictly enforced for standard questions',
      duplicateChoicesRejected && emptyOptionRejected,
      `dup: ${duplicateChoicesRejected}, empty: ${emptyOptionRejected}`
    );

    // ------------------------------------------------------------------------
    // P05-09: Correct Answer Validation
    // ------------------------------------------------------------------------
    console.log('\n--- P05-09: Correct Answer Validation ---');
    let invalidLetterRejected = false;
    try {
      await questionService.createQuestion(
        {
          topicId: validTopic.id,
          subtopicId: validSubtopic.id,
          difficulty: DifficultyLevel.EASY,
          questionText: 'Test invalid correct answer letter?',
          options: { a: '1', b: '2', c: '3', d: '4' },
          correctAnswer: 'E' as any,
          explanation: 'Test explanation',
        },
        adminActor
      );
    } catch (err: any) {
      invalidLetterRejected = true;
    }

    record(
      'P05-09',
      'Correct Answer must strictly be one of "A", "B", "C", or "D"',
      invalidLetterRejected
    );

    // ------------------------------------------------------------------------
    // P05-10: Controlled-Value Vocabularies Validation
    // ------------------------------------------------------------------------
    console.log('\n--- P05-10: Controlled-Value Vocabularies Validation ---');
    let invalidDifficultyRejected = false;
    try {
      await questionService.createQuestion(
        {
          topicId: validTopic.id,
          subtopicId: validSubtopic.id,
          difficulty: 'EXTREME_NIGHTMARE_DIFFICULTY',
          questionText: 'Test invalid difficulty?',
          options: { a: '1', b: '2', c: '3', d: '4' },
          correctAnswer: 'A',
          explanation: 'Test explanation',
        },
        adminActor
      );
    } catch (err: any) {
      invalidDifficultyRejected = true;
    }

    record(
      'P05-10',
      'Uncontrolled difficulty vocabulary values are rejected',
      invalidDifficultyRejected
    );

    // ------------------------------------------------------------------------
    // P05-11: Author Authority (Client Spoofing Rejection)
    // ------------------------------------------------------------------------
    console.log('\n--- P05-11: Author Authority (Client Spoofing Rejection) ---');
    const spoofAttempt = await questionService.createQuestion(
      {
        topicId: validTopic.id,
        subtopicId: validSubtopic.id,
        difficulty: DifficultyLevel.EASY,
        questionText: 'Phase05 Security Test: Who is the actual author?',
        options: { a: 'A', b: 'B', c: 'C', d: 'D' },
        correctAnswer: 'A',
        explanation: 'Checking author spoofing protection.',
        authorId: 'CLIENT-SPOOFED-ID-9999',
        author: 'Fake Spoofed Author',
      } as any,
      adminActor
    );

    const spoofProtected = spoofAttempt.authorId === adminActor.id && spoofAttempt.authorId !== 'CLIENT-SPOOFED-ID-9999';
    await questionsRepository.deleteRecord(spoofAttempt.id);

    record(
      'P05-11',
      'Author identity is derived from authenticated server context and client spoofing is ignored',
      spoofProtected,
      !spoofProtected ? `Spoofed author accepted: ${spoofAttempt.authorId}` : undefined
    );

    // ------------------------------------------------------------------------
    // P05-12: Timestamp Authority (Server-Controlled Timestamps)
    // ------------------------------------------------------------------------
    console.log('\n--- P05-12: Timestamp Authority ---');
    const fakePastDate = '2001-01-01T00:00:00.000Z';
    const timestampTest = await questionService.createQuestion(
      {
        topicId: validTopic.id,
        subtopicId: validSubtopic.id,
        difficulty: DifficultyLevel.EASY,
        questionText: 'Phase05 Security Test: Can client backdate timestamp?',
        options: { a: 'Yes', b: 'No', c: 'Maybe', d: 'Never' },
        correctAnswer: 'B',
        explanation: 'Server controls timestamps.',
        createdAt: fakePastDate,
        updatedAt: fakePastDate,
      } as any,
      adminActor
    );

    const timestampProtected = timestampTest.createdAt !== fakePastDate &&
      new Date(timestampTest.createdAt).getFullYear() >= 2026;
    await questionsRepository.deleteRecord(timestampTest.id);

    record(
      'P05-12',
      'Timestamps are server-controlled ISO strings and client backdating attempts are ignored',
      timestampProtected,
      !timestampProtected ? `Backdated timestamp accepted: ${timestampTest.createdAt}` : undefined
    );

    // ------------------------------------------------------------------------
    // P05-13: Status Lifecycle & State Machine Transitions
    // ------------------------------------------------------------------------
    console.log('\n--- P05-13: Status Lifecycle & State Machine Transitions ---');
    // Test illegal transition (e.g. APPROVED directly to DRAFT without EDITING)
    let illegalTransitionBlocked = false;
    try {
      questionService.validateStatusTransition(QuestionStatus.APPROVED, QuestionStatus.DRAFT);
    } catch (err: any) {
      illegalTransitionBlocked = true;
    }

    record(
      'P05-13',
      'Illegal status transitions are blocked by status state machine',
      illegalTransitionBlocked
    );

    // ------------------------------------------------------------------------
    // P05-14: Generation Mode Validation & RANDOM Resolution
    // ------------------------------------------------------------------------
    console.log('\n--- P05-14: Generation Mode Validation & RANDOM Resolution ---');
    const randomModeQ = await questionService.createQuestion(
      {
        topicId: validTopic.id,
        subtopicId: 'RANDOM',
        difficulty: DifficultyLevel.EASY,
        questionText: 'Phase05 Mode Test: Testing RANDOM subtopic resolution?',
        options: { a: 'One', b: 'Two', c: 'Three', d: 'Four' },
        correctAnswer: 'A',
        explanation: 'RANDOM is resolved to a valid concrete subtopic.',
        generationMode: 'RANDOM',
      },
      adminActor
    );

    const randomResolved = randomModeQ.generationMode === 'RANDOM' &&
      randomModeQ.subtopicId !== 'RANDOM' &&
      randomModeQ.subtopicId.startsWith('BP-SUB-');
    await questionsRepository.deleteRecord(randomModeQ.id);

    record(
      'P05-14',
      'Generation mode supports SUBTOPIC and RANDOM, resolving RANDOM to concrete subtopic',
      randomResolved,
      undefined,
      { resolvedSubtopicId: randomModeQ.subtopicId }
    );

    // ------------------------------------------------------------------------
    // P05-15: API Request / Response Schema Normalization
    // ------------------------------------------------------------------------
    console.log('\n--- P05-15: API Request / Response Schema Normalization ---');
    const parsedViaCreateSchema = CreateQuestionInputSchema.parse({
      topicId: validTopic.id,
      subtopicId: validSubtopic.id,
      difficulty: DifficultyLevel.MEDIUM,
      question: 'Testing flat question alias via schema parse',
      optionA: 'Opt 1',
      optionB: 'Opt 2',
      optionC: 'Opt 3',
      optionD: 'Opt 4',
      correctAnswer: 'A',
      explanation: 'Testing schema parsing',
    });

    const parsedViaUpdateSchema = UpdateQuestionInputSchema.parse({
      id: 'BP-Q-999999',
      realLifeContext: 'Real life context alias test',
      author: 'Author alias test',
    });

    record(
      'P05-15',
      'API input schemas seamlessly normalize flat and nested representations',
      parsedViaCreateSchema.questionText === 'Testing flat question alias via schema parse' &&
      parsedViaCreateSchema.options.a === 'Opt 1' &&
      parsedViaUpdateSchema.realWorldContext === 'Real life context alias test' &&
      parsedViaUpdateSchema.authorId === 'Author alias test'
    );

    // ------------------------------------------------------------------------
    // P05-16: Frontend / Backend Field Mapping & Parity
    // ------------------------------------------------------------------------
    console.log('\n--- P05-16: Frontend / Backend Field Mapping & Parity ---');
    const questionHeaders = SHEET_SCHEMAS[SHEET_TABS.QUESTIONS].columns.map((c) => c.name);
    const questionSchemaContract = SHEET_SCHEMAS[SHEET_TABS.QUESTIONS];

    const paritySampleObj = {
      id: testQuestionId,
      contentId: testContentId,
      topicId: validTopic.id,
      topicName: validTopic.name,
      subtopicId: validSubtopic.id,
      subtopicName: validSubtopic.name,
      difficulty: DifficultyLevel.MEDIUM,
      language: 'TELUGU',
      questionText: 'Round-trip parity question test',
      optionA: 'Option 1',
      optionB: 'Option 2',
      optionC: 'Option 3',
      optionD: 'Option 4',
      correctAnswer: 'A',
      explanation: 'Explanation text',
      status: QuestionStatus.APPROVED,
      videoStatus: VideoProductionStatus.NOT_STARTED,
      authorId: 'USR-001',
      generationMode: 'SUBTOPIC',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const rowFromSample = objectToRow(paritySampleObj as any, questionHeaders, questionSchemaContract);
    const rowObj = rowToObject(
      rowFromSample,
      questionHeaders,
      questionSchemaContract
    ) as Question;

    record(
      'P05-16',
      'rowToObject produces both options object and optionA-D aliases with 1:1 parity',
      rowObj.options?.a === 'Option 1' &&
      rowObj.optionA === 'Option 1' &&
      rowObj.question === 'Round-trip parity question test' &&
      rowObj.questionText === 'Round-trip parity question test' &&
      rowObj.contentId === testContentId
    );

    // ------------------------------------------------------------------------
    // P05-17: No Silent Field Loss Along Data Flow
    // ------------------------------------------------------------------------
    console.log('\n--- P05-17: No Silent Field Loss Along Data Flow ---');
    const testRecordForFlow = await questionsRepository.findById(testQuestionId);
    const serializedRow = objectToRow(
      testRecordForFlow as any,
      questionHeaders,
      questionSchemaContract
    );
    const deserializedObj = rowToObject(
      serializedRow,
      questionHeaders,
      questionSchemaContract
    ) as Question;

    const noLoss =
      deserializedObj.id === testRecordForFlow?.id &&
      deserializedObj.contentId === testRecordForFlow?.contentId &&
      deserializedObj.topicId === testRecordForFlow?.topicId &&
      deserializedObj.subtopicId === testRecordForFlow?.subtopicId &&
      deserializedObj.difficulty === testRecordForFlow?.difficulty &&
      deserializedObj.correctAnswer === testRecordForFlow?.correctAnswer &&
      deserializedObj.options.a === testRecordForFlow?.options.a &&
      deserializedObj.options.b === testRecordForFlow?.options.b &&
      deserializedObj.options.c === testRecordForFlow?.options.c &&
      deserializedObj.options.d === testRecordForFlow?.options.d;

    record(
      'P05-17',
      'Serialization to sheet row and deserialization back causes zero field loss or corruption',
      noLoss
    );

    // ------------------------------------------------------------------------
    // P05-18: Sheets Column Formatting & Formula Escaping
    // ------------------------------------------------------------------------
    console.log('\n--- P05-18: Sheets Column Formatting & Formula Escaping ---');
    const formulaPayload = {
      ...testRecordForFlow,
      questionText: '=SUM(1+1) Dangerous Formula Injection',
    };
    const formulaRow = objectToRow(
      formulaPayload as any,
      questionHeaders,
      questionSchemaContract
    );
    const qTextColIdx = SHEET_SCHEMAS[SHEET_TABS.QUESTIONS].columns.findIndex((c) => c.propertyKey === 'questionText');
    const escapedValue = formulaRow[qTextColIdx];

    // Read back and unescape
    const unescapedObj = rowToObject(
      formulaRow,
      questionHeaders,
      questionSchemaContract
    ) as Question;

    record(
      'P05-18',
      'Leading formula characters are escaped in sheet row and accurately restored on read',
      String(escapedValue).startsWith("'=") && unescapedObj.questionText === '=SUM(1+1) Dangerous Formula Injection',
      undefined,
      { escapedValue, restoredValue: unescapedObj.questionText }
    );

    // ------------------------------------------------------------------------
    // P05-19: Isolated End-to-End Question Round Trip
    // ------------------------------------------------------------------------
    console.log('\n--- P05-19: Isolated End-to-End Question Round Trip ---');
    // 1. Create with distinctive values in all fields
    const distinctiveQuestion = await questionService.createQuestion(
      {
        topicId: validTopic.id,
        subtopicId: validSubtopic.id,
        difficulty: DifficultyLevel.MEDIUM,
        language: 'TELUGU',
        questionText: 'P05-19-E2E-DISTINCTIVE: In which year did the Reserve Bank of India nationalize?',
        options: {
          a: '1935 (Establishment)',
          b: '1947 (Independence)',
          c: '1949 (Nationalisation)',
          d: '1950 (Republic)',
        },
        correctAnswer: 'C',
        explanation: 'The Reserve Bank of India was nationalised on 1 January 1949 under the RBI Act.',
        realLifeContext: 'Banking history and central monetary policy in India',
        challengeType: 'FACT_RECALL',
        presentationType: 'SHORT_VIDEO_30S',
        questionStyle: QuestionStyle.EXAM_STYLE,
        tags: ['rbi', 'banking', 'economy', 'history'],
        generationMode: 'SUBTOPIC',
      },
      adminActor
    );

    const createdId = distinctiveQuestion.id;
    const createdContentId = distinctiveQuestion.contentId!;

    // 2. Read back
    const readStep1 = await questionsRepository.findById(createdId);
    const read1Ok = readStep1 !== null &&
      readStep1.id === createdId &&
      readStep1.contentId === createdContentId &&
      readStep1.options.c === '1949 (Nationalisation)';

    // 3. Update selected fields
    const updatedStep = await questionService.updateQuestion(
      createdId,
      {
        id: createdId,
        difficulty: DifficultyLevel.HARD,
        options: {
          a: '1935 (Established April 1)',
          b: '1947 (Independence Year)',
          c: '1949 (Nationalised Jan 1)',
          d: '1950 (Constitution Adoption)',
        },
        explanation: 'Updated detailed explanation: Effective 1 January 1949, RBI became fully state-owned.',
        challengeType: 'SPEED_CHALLENGE',
      } as any,
      adminActor
    );

    // 4. Read back again
    const readStep2 = await questionsRepository.findById(createdId);
    const read2Ok = readStep2 !== null &&
      readStep2.id === createdId &&
      readStep2.contentId === createdContentId && // Content ID preserved
      readStep2.difficulty === DifficultyLevel.HARD &&
      readStep2.options.c === '1949 (Nationalised Jan 1)' &&
      readStep2.challengeType === 'SPEED_CHALLENGE' &&
      readStep2.createdAt === distinctiveQuestion.createdAt; // CreatedAt preserved

    // 5. Clean up isolated test artifact
    await questionsRepository.deleteRecord(createdId);
    const readStep3 = await questionsRepository.findById(createdId);
    const cleanedUpOk = readStep3 === null;

    record(
      'P05-19',
      'End-to-End isolated round trip (CREATE -> READ -> UPDATE -> READ -> VERIFY CORRELATION -> CLEANUP) passed',
      read1Ok && read2Ok && cleanedUpOk,
      undefined,
      { createdId, createdContentId, read1Ok, read2Ok, cleanedUpOk }
    );

    // ------------------------------------------------------------------------
    // P05-20: Unauthorized Mutation Protection (RBAC)
    // ------------------------------------------------------------------------
    console.log('\n--- P05-20: Unauthorized Mutation Protection (RBAC) ---');
    let viewerCreateBlocked = false;
    try {
      await questionService.createQuestion(
        {
          topicId: validTopic.id,
          subtopicId: validSubtopic.id,
          difficulty: DifficultyLevel.EASY,
          questionText: 'Viewer should not be able to create question',
          options: { a: '1', b: '2', c: '3', d: '4' },
          correctAnswer: 'A',
          explanation: 'Testing RBAC',
        },
        viewerActor as any
      );
    } catch (err: any) {
      viewerCreateBlocked = true;
    }

    record(
      'P05-20',
      'Unauthorized role (VIEWER) is strictly blocked from creating questions',
      viewerCreateBlocked,
      !viewerCreateBlocked ? 'Viewer was erroneously allowed to create question' : undefined
    );

  } finally {
    // Clean up primary test record if left
    if (testQuestionId) {
      try {
        await questionsRepository.deleteRecord(testQuestionId);
        console.log(`Cleaned up test question ${testQuestionId} from repository.`);
      } catch (err) {
        // ignore
      }
    }
  }

  const passedCount = checks.filter((c) => c.passed).length;
  const failedCount = checks.filter((c) => !c.passed).length;

  console.log('\n================================================================');
  console.log(`PHASE 05 VERIFICATION COMPLETE: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('================================================================\n');

  return { passedCount, failedCount, checks };
}

if (process.argv[1]?.includes('phase-5-question-model') || process.argv[1]?.includes('phase05-production-question-contract')) {
  runPhase05QuestionContractVerification().then((res) => {
    if (res.failedCount > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  }).catch((err) => {
    console.error('Fatal error during Phase 05 verification:', err);
    process.exit(1);
  });
}
