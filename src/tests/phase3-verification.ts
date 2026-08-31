/**
 * PHASE 3 QUESTION MANAGEMENT SYSTEM VERIFICATION TEST SUITE
 * 
 * 22 comprehensive test cases covering:
 * 1. Valid Question Creation with mandatory fields
 * 2. Auto-generation of Question ID (QST-XXXXXX format)
 * 3. Default Status Assignment (GENERATED and NOT_STARTED)
 * 4. Initial Workflow Event Creation (WORKFLOW sheet event)
 * 5. Initial Audit Log Event Creation (AUDIT_LOG sheet event)
 * 6. Missing Mandatory Field Rejection (empty statement)
 * 7. Invalid Option Format Rejection (missing options)
 * 8. Invalid Correct Answer Identifier Rejection (invalid identifier)
 * 9. Invalid Taxonomy Reference Rejection (non-existent category/topic/subtopic)
 * 10. Valid Status Transition Execution (GENERATED -> EDITING)
 * 11. State Machine Invalid Transition Rejection (DRAFT -> APPROVED)
 * 12. Workflow Event Log on Status Transition
 * 13. Audit Log on Status Transition
 * 14. Content Update in Editable Status
 * 15. Status Transition to APPROVED
 * 16. Queue Question Rejection on Non-APPROVED Question
 * 17. Queue Question Execution on APPROVED Question (videoStatus=QUEUED)
 * 18. Multi-Field Search Query Execution
 * 19. Category & Topic Filter Query Execution
 * 20. Difficulty Filter Query Execution
 * 21. Status Filter Query Execution
 * 22. Normalized Jaccard Duplicate Detection Warning
 */

import { questionService } from '../lib/services/question.service';
import { taxonomyService } from '../lib/services/taxonomy.service';
import { workflowService } from '../lib/services/workflow.service';
import { auditService } from '../lib/services/audit.service';
import { DifficultyLevel, QuestionStatus, QuestionStyle, VideoProductionStatus } from '../types';

export async function runPhase3Verification() {
  console.log('====================================================');
  console.log('BURRA PARIKSHA CMS - PHASE 3 QUESTION MANAGEMENT VERIFICATION');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] Test ${totalTests}: ${testName}`);
      passedTests++;
    } else {
      console.error(`[FAIL] Test ${totalTests}: ${testName} - Detail: ${detail || 'Assertion failed'}`);
      throw new Error(`Test failed: ${testName}`);
    }
  }

  // Fetch baseline taxonomy
  const tree = await taxonomyService.getTaxonomyTree();
  assert(tree.length > 0, 'Taxonomy tree loaded successfully');
  const testCat = tree[0];
  const testTopic = testCat.topics[0];
  const testSubtopic = testTopic.subtopics[0];

  const testActor = { id: 'USR-001', name: 'Test Editor' };

  // TEST 1: Valid Question Creation with mandatory fields
  const newQuestion = await questionService.createQuestion(
    {
      categoryId: testCat.id,
      categoryName: testCat.name,
      topicId: testTopic.id,
      topicName: testTopic.name,
      subtopicId: testSubtopic.id,
      subtopicName: testSubtopic.name,
      difficulty: DifficultyLevel.MEDIUM,
      questionStyle: QuestionStyle.SPEED_MATH_TRICK,
      questionText: 'If 15% of a number is 45, what is 40% of the same number?',
      options: {
        a: '100',
        b: '120',
        c: '150',
        d: '180',
      },
      correctAnswer: 'B',
      explanation: 'Step 1: 15% = 45 => 1% = 3 => Number = 300.\nStep 2: 40% of 300 = 120.',
      realWorldContext: 'Retail profit calculation speed shortcut',
      tags: ['percentage', 'speed-math', 'shortcuts'],
      authorId: 'USR-001',
    },
    testActor
  );

  assert(Boolean(newQuestion), 'Valid question created successfully');

  // TEST 2: Auto-generation of Question ID format (BP-Q-XXXXXX)
  assert(/^(BP-Q|QST)-\d{6}$/.test(newQuestion.id), `Question ID matches pattern BP-Q-XXXXXX or QST-XXXXXX: received ${newQuestion.id}`);

  // TEST 3: Default Status Assignment (GENERATED and NOT_STARTED)
  assert(newQuestion.status === QuestionStatus.GENERATED, `Default status is GENERATED: received ${newQuestion.status}`);
  assert(newQuestion.videoStatus === VideoProductionStatus.NOT_STARTED, `Default videoStatus is NOT_STARTED: received ${newQuestion.videoStatus}`);

  // TEST 4: Initial Workflow Event Creation
  const wfEvents = await workflowService.getHistory('QUESTION', newQuestion.id);
  assert(wfEvents.length > 0, 'Initial workflow event created');
  assert(wfEvents[0].toStatus === QuestionStatus.GENERATED, 'Workflow event records initial transition to GENERATED');

  // TEST 5: Initial Audit Log Creation
  const auditLogs = await auditService.getLogs('QUESTION', newQuestion.id);
  assert(auditLogs.length > 0, 'Initial audit log created');
  assert(auditLogs[0].action === 'QUESTION_CREATED', 'Audit log action is QUESTION_CREATED');

  // TEST 6: Missing Mandatory Field Rejection (Empty statement)
  let failedEmptyText = false;
  try {
    await questionService.createQuestion({
      categoryId: testCat.id,
      topicId: testTopic.id,
      subtopicId: testSubtopic.id,
      difficulty: DifficultyLevel.EASY,
      questionText: '   ',
      options: { a: '1', b: '2', c: '3', d: '4' },
      correctAnswer: 'A',
      explanation: 'Test',
    });
  } catch (err) {
    failedEmptyText = true;
  }
  assert(failedEmptyText, 'Rejects creation with empty questionText');

  // TEST 7: Invalid Option Format Rejection (Missing option D)
  let failedMissingOption = false;
  try {
    await questionService.createQuestion({
      categoryId: testCat.id,
      topicId: testTopic.id,
      subtopicId: testSubtopic.id,
      difficulty: DifficultyLevel.EASY,
      questionText: 'What is 2 + 2?',
      options: { a: '1', b: '2', c: '3', d: '' },
      correctAnswer: 'A',
      explanation: 'Test',
    });
  } catch (err) {
    failedMissingOption = true;
  }
  assert(failedMissingOption, 'Rejects creation with missing/empty option D');

  // TEST 8: Invalid Correct Answer Identifier Rejection (Option 'E')
  let failedInvalidAnswer = false;
  try {
    await questionService.createQuestion({
      categoryId: testCat.id,
      topicId: testTopic.id,
      subtopicId: testSubtopic.id,
      difficulty: DifficultyLevel.EASY,
      questionText: 'What is 2 + 2?',
      options: { a: '1', b: '2', c: '3', d: '4' },
      correctAnswer: 'E' as any,
      explanation: 'Test',
    });
  } catch (err) {
    failedInvalidAnswer = true;
  }
  assert(failedInvalidAnswer, 'Rejects invalid correctAnswer option');

  // TEST 9: Invalid Taxonomy Reference Rejection (Non-existent category)
  let failedInvalidTaxonomy = false;
  try {
    await questionService.createQuestion({
      categoryId: 'CAT-NONEXISTENT',
      topicId: testTopic.id,
      subtopicId: testSubtopic.id,
      difficulty: DifficultyLevel.EASY,
      questionText: 'What is 2 + 2?',
      options: { a: '1', b: '2', c: '3', d: '4' },
      correctAnswer: 'D',
      explanation: 'Test',
    });
  } catch (err) {
    failedInvalidTaxonomy = true;
  }
  assert(failedInvalidTaxonomy, 'Rejects creation with non-existent taxonomy references');

  // TEST 10: Valid Status Transition (GENERATED -> EDITING)
  const editingQuestion = await questionService.updateStatus(
    newQuestion.id,
    QuestionStatus.EDITING,
    testActor,
    'Author refining speed trick'
  );
  assert(editingQuestion.status === QuestionStatus.EDITING, 'Valid status transition GENERATED -> EDITING succeeded');

  // TEST 11: State Machine Invalid Transition Rejection (DRAFT -> APPROVED directly without GENERATED)
  let failedInvalidTransition = false;
  try {
    questionService.validateStatusTransition(QuestionStatus.DRAFT, QuestionStatus.APPROVED);
  } catch (err) {
    failedInvalidTransition = true;
  }
  assert(failedInvalidTransition, 'State machine rejects illegal transition DRAFT -> APPROVED');

  // TEST 12: Workflow Event Log on Status Transition
  const updatedWf = await workflowService.getHistory('QUESTION', newQuestion.id);
  assert(updatedWf.length >= 2, 'New workflow event logged on status transition');
  assert(updatedWf[updatedWf.length - 1].toStatus === QuestionStatus.EDITING, 'Latest workflow event records toStatus=EDITING');

  // TEST 13: Audit Log on Status Transition
  const updatedAudits = await auditService.getLogs('QUESTION', newQuestion.id);
  assert(updatedAudits.some((a) => a.action === 'QUESTION_STATUS_CHANGED'), 'Audit log contains QUESTION_STATUS_CHANGED');

  // TEST 14: Content Update on Allowed Status
  const updatedContent = await questionService.updateQuestion(
    newQuestion.id,
    {
      explanation: 'Revised: 15% is 45 -> 1% is 3 -> 40% is 3 * 40 = 120.',
      realWorldContext: 'Speed mental math in competitive exams',
    },
    testActor
  );
  assert(updatedContent.explanation.includes('Revised'), 'Content successfully updated in EDITING status');

  // TEST 15: Transition to APPROVED
  const approvedQuestion = await questionService.updateStatus(
    newQuestion.id,
    QuestionStatus.APPROVED,
    { id: 'USR-001', name: 'Lead Reviewer' },
    'Editorial review completed and approved'
  );
  assert(approvedQuestion.status === QuestionStatus.APPROVED, 'Transitioned to APPROVED status');

  // TEST 16: Queue Question requires APPROVED status check (Try queueing non-approved question)
  const draftQ = await questionService.createQuestion({
    categoryId: testCat.id,
    topicId: testTopic.id,
    subtopicId: testSubtopic.id,
    difficulty: DifficultyLevel.EASY,
    questionText: 'Draft question test for queue rejection constraint',
    options: { a: '1', b: '2', c: '3', d: '4' },
    correctAnswer: 'A',
    explanation: 'Draft test',
  });
  let failedQueueNonApproved = false;
  try {
    await questionService.queueQuestion(draftQ.id, testActor, 'Should fail because status is GENERATED');
  } catch (err) {
    failedQueueNonApproved = true;
  }
  assert(failedQueueNonApproved, 'Queue question rejects non-APPROVED questions');

  // TEST 17: Successfully Queue APPROVED Question
  const queuedQuestion = await questionService.queueQuestion(
    approvedQuestion.id,
    { id: 'USR-001', name: 'Production Producer' },
    'Queued for vertical shorts video production'
  );
  assert(queuedQuestion.videoStatus === VideoProductionStatus.QUEUED, 'Approved question successfully queued (videoStatus=QUEUED)');

  // TEST 18: Full Multi-Field Search Query Execution
  const searchResults = await questionService.getQuestions({
    search: 'mental math',
  });
  assert(searchResults.some((q) => q.id === newQuestion.id), 'Multi-field search found question by realWorldContext');

  // TEST 19: Category & Topic Filter Query
  const catResults = await questionService.getQuestions({
    categoryId: testCat.id,
    topicId: testTopic.id,
  });
  assert(catResults.length > 0, 'Category and topic filter query returned matching questions');

  // TEST 20: Difficulty Filter Query
  const diffResults = await questionService.getQuestions({
    difficulty: DifficultyLevel.MEDIUM,
  });
  assert(diffResults.some((q) => q.id === newQuestion.id), 'Difficulty filter query matched MEDIUM questions');

  // TEST 21: Status Filter Query
  const statusResults = await questionService.getQuestions({
    status: QuestionStatus.APPROVED,
  });
  assert(statusResults.some((q) => q.id === newQuestion.id), 'Status filter query matched APPROVED questions');

  // TEST 22: Duplicate Detection Warning
  const duplicateMatches = await questionService.detectDuplicates(
    'If 15% of a number is 45 what is 40% of the same number?'
  );
  assert(duplicateMatches.length > 0, 'Duplicate detection flagged high similarity question');
  assert(duplicateMatches.some((m) => m.questionId === newQuestion.id), 'Duplicate match points to existing question ID');

  console.log(`\n====================================================`);
  console.log(`PHASE 3 VERIFICATION COMPLETE: ALL ${passedTests}/${totalTests} TESTS PASSED`);
  console.log(`====================================================\n`);

  return {
    passed: true,
    success: true,
    total: totalTests,
    passedCount: passedTests,
    totalTests,
    passedTests,
  };
}

// Auto-run if executed directly
if (process.argv[1] && process.argv[1].includes('phase3-verification')) {
  runPhase3Verification().catch((err) => {
    console.error('Phase 3 verification failed:', err);
    process.exit(1);
  });
}

