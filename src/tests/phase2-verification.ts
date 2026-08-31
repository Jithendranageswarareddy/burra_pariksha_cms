/**
 * PHASE 2 SCHEMA & DOMAIN INTEGRATION VERIFICATION TEST SUITE
 * 
 * Verifies all 18 worksheet schema contracts, ID generation, taxonomy constraints,
 * and service operations.
 */

import {
  ALL_SHEET_TABS,
  SHEET_SCHEMAS,
  SHEET_TABS,
  SEQUENCE_ENTITIES,
  ID_PREFIX_MAP,
} from '../lib/schemas/google-sheets-schema';
import { idService } from '../lib/services/id.service';
import { questionService } from '../lib/services/question.service';
import { spreadsheetVerificationService } from '../lib/services/spreadsheet-verification.service';
import { DifficultyLevel, QuestionStatus, VideoProductionStatus } from '../types';

export async function runPhase2Verification() {
  console.log('====================================================');
  console.log('BURRA PARIKSHA CMS - PHASE 2 VERIFICATION SUITE');
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

  // 1. Authoritative 18 Worksheets
  assert(ALL_SHEET_TABS.length === 18, 'Exactly 18 authoritative worksheets exist');
  assert(ALL_SHEET_TABS.includes('SCRIPT'), 'SCRIPT worksheet exists (NOT SCRIPTS)');
  assert(!ALL_SHEET_TABS.includes('SCRIPTS' as any), 'SCRIPTS does NOT exist in sheet tabs');

  const EXPECTED_18_TABS = [
    'USERS',
    'CATEGORIES',
    'TOPICS',
    'SUBTOPICS',
    'QUESTIONS',
    'QUESTION_VIDEOS',
    'VIDEOS',
    'SCRIPT',
    'SCRIPT_VERSIONS',
    'THUMBNAILS',
    'THUMBNAIL_VERSIONS',
    'PINNED_COMMENTS',
    'PINNED_COMMENT_VERSIONS',
    'WORKFLOW',
    'ASSIGNMENTS',
    'PUBLISHING',
    'AUDIT_LOG',
    'SEQUENCES',
  ];

  for (const tab of EXPECTED_18_TABS) {
    assert(ALL_SHEET_TABS.includes(tab as any), `Tab ${tab} is defined in authoritative list`);
    assert(!!SHEET_SCHEMAS[tab as any], `Tab ${tab} has a formal schema contract`);
  }

  // 2. Canonical ID format definitions
  assert(ID_PREFIX_MAP[SEQUENCE_ENTITIES.QUESTION].prefix === 'BP-Q-', 'Question ID prefix is BP-Q-');
  assert(ID_PREFIX_MAP[SEQUENCE_ENTITIES.QUESTION].padLength === 6, 'Question ID pad length is 6 (BP-Q-000001)');
  assert(ID_PREFIX_MAP[SEQUENCE_ENTITIES.VIDEO].prefix === 'BP-V-', 'Video ID prefix is BP-V-');
  assert(ID_PREFIX_MAP[SEQUENCE_ENTITIES.VIDEO].padLength === 6, 'Video ID pad length is 6 (BP-V-000001)');
  assert(ID_PREFIX_MAP[SEQUENCE_ENTITIES.SCRIPT].prefix === 'BP-S-', 'Script ID prefix is BP-S-');
  assert(ID_PREFIX_MAP[SEQUENCE_ENTITIES.SCRIPT].padLength === 6, 'Script ID pad length is 6 (BP-S-000001)');
  assert(ID_PREFIX_MAP[SEQUENCE_ENTITIES.THUMBNAIL].prefix === 'BP-T-', 'Thumbnail ID prefix is BP-T-');
  assert(ID_PREFIX_MAP[SEQUENCE_ENTITIES.THUMBNAIL].padLength === 6, 'Thumbnail ID pad length is 6 (BP-T-000001)');

  // 3. Question Schema video_status column
  const questionsCols = SHEET_SCHEMAS[SHEET_TABS.QUESTIONS].columns;
  const videoStatusCol = questionsCols.find(c => c.name === 'video_status');
  assert(!!videoStatusCol, 'QUESTIONS schema has column named video_status (snake_case)');
  const wrongVideoStatusCol = questionsCols.find(c => c.name === 'videoStatus');
  assert(!wrongVideoStatusCol, 'QUESTIONS schema does NOT have column named videoStatus');

  // 4. SEQUENCES ID Allocation
  const qId1 = await idService.allocateQuestionId();
  const qId2 = await idService.allocateQuestionId();
  assert(qId1.startsWith('BP-Q-'), `Allocated Question ID has BP-Q- prefix: ${qId1}`);
  assert(qId2.startsWith('BP-Q-'), `Second Allocated Question ID has BP-Q- prefix: ${qId2}`);
  assert(qId1 !== qId2, `Allocated IDs are distinct: ${qId1} vs ${qId2}`);

  const vId = await idService.allocateVideoId();
  assert(vId.startsWith('BP-V-'), `Allocated Video ID has BP-V- prefix: ${vId}`);

  const sId = await idService.allocateScriptId();
  assert(sId.startsWith('BP-S-'), `Allocated Script ID has BP-S- prefix: ${sId}`);

  const tId = await idService.allocateThumbnailId();
  assert(tId.startsWith('BP-T-'), `Allocated Thumbnail ID has BP-T- prefix: ${tId}`);

  // 5. Taxonomy Validation: Invalid Category -> Topic -> Subtopic relationship rejected
  let invalidTaxonomyThrew = false;
  try {
    await questionService.createQuestion({
      categoryId: 'CAT-QA',
      topicId: 'TOP-LR-01', // Mismatched topic (Logical Reasoning topic under QA)
      subtopicId: 'SUB-01',
      difficulty: DifficultyLevel.MEDIUM,
      questionText: 'Test question text for verification',
      options: { a: '1', b: '2', c: '3', d: '4' },
      correctAnswer: 'A',
      explanation: 'Explanation text',
    });
  } catch (err: any) {
    invalidTaxonomyThrew = true;
    assert(err.message.includes('Taxonomy integrity violation') || err.message.includes('belongs to Category'), 'Rejects mismatched Topic/Category relationship');
  }
  assert(invalidTaxonomyThrew, 'Invalid taxonomy relationship properly threw an error');

  // 6. Question Creation with Default Statuses
  const createdQuestion = await questionService.createQuestion({
    categoryId: 'CAT-QA',
    topicId: 'TOP-QA-01',
    subtopicId: 'SUB-02',
    difficulty: DifficultyLevel.MEDIUM,
    questionText: 'Verification test question: If train A crosses train B in 30 seconds, what is relative speed?',
    options: {
      a: '36 km/h',
      b: '54 km/h',
      c: '72 km/h',
      d: '90 km/h',
    },
    correctAnswer: 'C',
    explanation: 'Relative speed = distance / time = 600m / 30s = 20 m/s = 72 km/h.',
  });

  assert(createdQuestion.id.startsWith('BP-Q-'), `Created question has canonical ID: ${createdQuestion.id}`);
  assert(createdQuestion.status === QuestionStatus.GENERATED, `Default question status is GENERATED: ${createdQuestion.status}`);
  assert(createdQuestion.videoStatus === VideoProductionStatus.NOT_STARTED, `Default video status is NOT_STARTED: ${createdQuestion.videoStatus}`);

  // 7. Question Update
  const updatedQuestion = await questionService.updateQuestion(
    createdQuestion.id,
    {
      status: QuestionStatus.APPROVED,
      videoStatus: VideoProductionStatus.QUEUED,
    }
  );

  assert(updatedQuestion.status === QuestionStatus.APPROVED, 'Updated status to APPROVED');
  assert(updatedQuestion.videoStatus === VideoProductionStatus.QUEUED, 'Updated videoStatus to QUEUED');

  // 8. Health Verification Diagnostics
  const health = await spreadsheetVerificationService.verifySpreadsheet();
  assert(health.mode === 'MOCK_DEVELOPMENT', 'Reports MOCK_DEVELOPMENT when env credentials are unset');
  assert(health.tabs.length === 18, `Evaluated all 18 tabs (count: ${health.tabs.length})`);
  assert(health.tabs.some(t => t.tabName === 'SCRIPT'), 'Diagnostic covers SCRIPT tab');

  console.log('\n====================================================');
  console.log(`ALL ${passedTests} OF ${totalTests} VERIFICATION ASSERTIONS PASSED!`);
  console.log('====================================================\n');

  return { passedTests, totalTests };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runPhase2Verification().catch((err) => {
    console.error('Verification failed:', err);
    process.exit(1);
  });
}
