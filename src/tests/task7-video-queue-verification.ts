/**
 * BURRA PARIKSHA CMS — END-TO-END VERIFICATION
 * TASK 7: VIDEO QUEUE AND WORKFLOW VERIFICATION SUITE
 * 
 * Verifies:
 * 1. Complete Video Lifecycle:
 *    Created (QUEUED) -> Script Ready -> Recording -> Editing -> Post Production (Final Review) -> Ready (Ready to Upload) -> Published (Uploaded)
 * 2. Transition permissions & legal state machine rules
 * 3. Rejection of invalid / illegal transitions (including terminal states)
 * 4. Google Sheets persistence across all lifecycle stages (VIDEOS, WORKFLOW, AUDIT_LOG, ASSIGNMENTS)
 * 5. Video Queue state reflection
 * 6. Production Tracker stats & state reflection
 * 7. Audit log action recording with actor ownership & metadata
 * 8. Priority updating and priority-based sorting (URGENT > HIGH > NORMAL > LOW)
 * 9. Search capabilities (Video ID, Title, Question ID, Topic, Category)
 * 10. Filter capabilities (Status, Priority, Host, Editor, Category, Difficulty)
 * 11. Staff assignments (Host, Editor) and workflow ownership attribution
 */

import { videoService, VALID_VIDEO_TRANSITIONS } from '../lib/services/video.service';
import { questionService } from '../lib/services/question.service';
import { taxonomyService } from '../lib/services/taxonomy.service';
import { workflowService } from '../lib/services/workflow.service';
import { auditService } from '../lib/services/audit.service';
import { videosRepository } from '../lib/repositories/videos.repository';
import { questionsRepository } from '../lib/repositories/questions.repository';
import { assignmentsRepository } from '../lib/repositories/assignments.repository';
import { workflowRepository } from '../lib/repositories/workflow.repository';
import { auditLogRepository } from '../lib/repositories/audit-log.repository';
import {
  DifficultyLevel,
  PriorityLevel,
  QuestionStatus,
  VideoProductionStatus,
  AssignmentTaskType,
  Video,
} from '../types';

export async function runTask7Verification() {
  console.log('========================================================================');
  console.log('BURRA PARIKSHA CMS — TASK 7: VIDEO QUEUE & WORKFLOW VERIFICATION');
  console.log('========================================================================\n');

  let passedTests = 0;
  let totalTests = 0;
  const results: { test: string; passed: boolean; detail?: string }[] = [];

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] Test ${totalTests.toString().padStart(2, '0')}: ${testName}`);
      passedTests++;
      results.push({ test: testName, passed: true });
    } else {
      console.error(`[FAIL] Test ${totalTests.toString().padStart(2, '0')}: ${testName} - Detail: ${detail || 'Assertion failed'}`);
      results.push({ test: testName, passed: false, detail });
      throw new Error(`Test failed: ${testName} - ${detail || ''}`);
    }
  }

  const primaryActor = { id: 'USR-PROD-01', name: 'Lead Video Producer' };
  const hostActor = { id: 'USR-HOST-01', name: 'Sravan Telugu Host' };
  const editorActor = { id: 'USR-EDIT-01', name: 'Ravi Visual Editor' };
  const reviewerActor = { id: 'USR-REV-01', name: 'Senior Quality Reviewer' };

  // =========================================================================
  // SETUP: Create and Approve a Dedicated Test Question
  // =========================================================================
  console.log('--- Step 0: Setting Up Temporary Test Question ---');
  const tree = await taxonomyService.getTaxonomyTree();
  const testCat = tree[0];
  const testTopic = testCat?.topics?.[0] || { id: 'TOP-101', name: 'Time and Distance', subtopics: [{ id: 'SUB-101', name: 'Relative Speed' }] };
  const testSubtopic = testTopic?.subtopics?.[0] || { id: 'SUB-101', name: 'Relative Speed' };

  const testQuestion = await questionService.createQuestion(
    {
      questionText: 'Task 7 Verification Question: A boat covers 24 km upstream and 36 km downstream in 6 hours. Find the speed of current.',
      options: { a: '2 km/h', b: '3 km/h', c: '4 km/h', d: '5 km/h' },
      correctAnswer: 'A',
      categoryId: testCat.id,
      topicId: testTopic.id,
      subtopicId: testSubtopic.id,
      difficulty: DifficultyLevel.HARD,
      explanation: 'Using relative upstream and downstream boat speed equations.',
    },
    primaryActor
  );

  // Approve question so it is legally eligible for video queue
  await questionService.updateStatus(testQuestion.id, QuestionStatus.APPROVED, primaryActor);
  console.log(`Approved Test Question: ${testQuestion.id}`);

  // =========================================================================
  // STAGE 1: CREATION (QUEUED)
  // =========================================================================
  console.log('\n--- Stage 1: Video Creation & Queueing (Created -> QUEUED) ---');
  const initialStats = await videoService.getProductionStats();

  const createdVideo = await videoService.queueApprovedQuestion(
    {
      questionId: testQuestion.id,
      title: 'Boats & Streams Speed Formula Shortcut',
      priority: PriorityLevel.NORMAL,
      notes: 'Initial production record created for Task 7 verification',
      targetDurationSeconds: 45,
    },
    primaryActor
  );

  assert(Boolean(createdVideo.id && createdVideo.id.startsWith('BP-V-')), 'Video record created with valid ID (BP-V-xxxxxx)');
  assert(createdVideo.status === VideoProductionStatus.QUEUED, 'Initial video status is QUEUED (Created)');

  // 1. Check persistence in Google Sheets (VIDEOS)
  const persistedVideo1 = await videosRepository.findById(createdVideo.id);
  assert(persistedVideo1 !== null && persistedVideo1.status === VideoProductionStatus.QUEUED, 'Status persisted as QUEUED in Google Sheets (VIDEOS table)');

  // 2. Check Video Queue reflects new status
  const queueList1 = await videoService.getVideos({ status: VideoProductionStatus.QUEUED });
  const foundInQueue1 = queueList1.some((v) => v.id === createdVideo.id);
  assert(foundInQueue1, 'Video Queue reflects the created video in QUEUED status');

  // 3. Check Production Tracker reflects new status
  const statsAfterCreate = await videoService.getProductionStats();
  assert(statsAfterCreate.queued === initialStats.queued + 1, 'Production Tracker stats reflect incremented QUEUED count');

  // 4. Check Workflow & Audit log
  const workflowHist1 = await workflowService.getHistory('VIDEO', createdVideo.id);
  assert(workflowHist1.length > 0 && workflowHist1[0].toStatus === VideoProductionStatus.QUEUED, 'Workflow records transition to QUEUED with actor attribution');
  assert(workflowHist1[0].triggeredBy === primaryActor.name, 'Workflow records correct actor name');

  const auditLogs1 = await auditService.getLogs('VIDEO', createdVideo.id);
  assert(auditLogs1.some((l) => l.action === 'VIDEO_QUEUED'), 'Audit log records VIDEO_QUEUED action');

  // =========================================================================
  // INVALID TRANSITION TEST: Illegal jump from QUEUED to UPLOADED
  // =========================================================================
  console.log('\n--- Testing Invalid Transition Rejection from QUEUED ---');
  let invalidTransitionCaught1 = false;
  try {
    await videoService.transitionStatus(createdVideo.id, VideoProductionStatus.UPLOADED, primaryActor);
  } catch (err: any) {
    invalidTransitionCaught1 = true;
  }
  assert(invalidTransitionCaught1, 'Invalid transition directly from QUEUED to UPLOADED is strictly rejected');

  // =========================================================================
  // STAGE 2: TRANSITION TO SCRIPT READY (SCRIPT_READY)
  // =========================================================================
  console.log('\n--- Stage 2: Transition to SCRIPT READY ---');
  const videoScriptReady = await videoService.transitionStatus(
    createdVideo.id,
    VideoProductionStatus.SCRIPT_READY,
    primaryActor,
    'Telugu pedagogical script completed and verified'
  );

  assert(videoScriptReady.status === VideoProductionStatus.SCRIPT_READY, 'Transition to SCRIPT_READY is allowed and successful');

  // Check persistence
  const persistedVideo2 = await videosRepository.findById(createdVideo.id);
  assert(persistedVideo2?.status === VideoProductionStatus.SCRIPT_READY, 'Status SCRIPT_READY persisted to Google Sheets');

  // Check Video Queue reflection
  const scriptReadyQueue = await videoService.getVideos({ status: VideoProductionStatus.SCRIPT_READY });
  assert(scriptReadyQueue.some((v) => v.id === createdVideo.id), 'Video Queue reflects SCRIPT_READY status');

  // Check Production Tracker reflection
  const statsScriptReady = await videoService.getProductionStats();
  assert(statsScriptReady.scriptReady >= 1, 'Production Tracker reflects SCRIPT_READY count');

  // Check Workflow & Audit
  const workflowHist2 = await workflowService.getHistory('VIDEO', createdVideo.id);
  const scriptReadyWf = workflowHist2.find((w) => w.toStatus === VideoProductionStatus.SCRIPT_READY);
  assert(Boolean(scriptReadyWf), 'Workflow recorded transition to SCRIPT_READY');

  // Invalid transition test from SCRIPT_READY
  let invalidJumpFromScript = false;
  try {
    await videoService.transitionStatus(createdVideo.id, VideoProductionStatus.READY_TO_UPLOAD, primaryActor);
  } catch {
    invalidJumpFromScript = true;
  }
  assert(invalidJumpFromScript, 'Invalid transition from SCRIPT_READY skipping recording/editing is rejected');

  // =========================================================================
  // STAGE 3: TRANSITION TO RECORDING (RECORDING)
  // =========================================================================
  console.log('\n--- Stage 3: Transition to RECORDING ---');
  const videoRecording = await videoService.transitionStatus(
    createdVideo.id,
    VideoProductionStatus.RECORDING,
    hostActor,
    'Camera shoot and Telugu audio narration in progress'
  );

  assert(videoRecording.status === VideoProductionStatus.RECORDING, 'Transition to RECORDING is allowed');

  // Check persistence
  const persistedVideo3 = await videosRepository.findById(createdVideo.id);
  assert(persistedVideo3?.status === VideoProductionStatus.RECORDING, 'Status RECORDING persisted to Google Sheets');

  // Check Video Queue reflection
  const recordingQueue = await videoService.getVideos({ status: VideoProductionStatus.RECORDING });
  assert(recordingQueue.some((v) => v.id === createdVideo.id), 'Video Queue reflects RECORDING status');

  // Check Production Tracker reflection
  const statsRecording = await videoService.getProductionStats();
  assert(statsRecording.recording >= 1, 'Production Tracker reflects RECORDING count');

  // Check Workflow & Audit
  const workflowHist3 = await workflowService.getHistory('VIDEO', createdVideo.id);
  assert(workflowHist3.some((w) => w.toStatus === VideoProductionStatus.RECORDING && w.triggeredBy === hostActor.name), 'Workflow recorded RECORDING transition with host actor attribution');

  // =========================================================================
  // STAGE 4: TRANSITION TO EDITING (EDITING)
  // =========================================================================
  console.log('\n--- Stage 4: Transition to EDITING ---');
  const videoEditing = await videoService.transitionStatus(
    createdVideo.id,
    VideoProductionStatus.EDITING,
    editorActor,
    'Raw footage imported; adding motion graphics, speed timer, and sound FX'
  );

  assert(videoEditing.status === VideoProductionStatus.EDITING, 'Transition to EDITING is allowed');

  // Check persistence
  const persistedVideo4 = await videosRepository.findById(createdVideo.id);
  assert(persistedVideo4?.status === VideoProductionStatus.EDITING, 'Status EDITING persisted to Google Sheets');

  // Check Video Queue reflection
  const editingQueue = await videoService.getVideos({ status: VideoProductionStatus.EDITING });
  assert(editingQueue.some((v) => v.id === createdVideo.id), 'Video Queue reflects EDITING status');

  // Check Production Tracker reflection
  const statsEditing = await videoService.getProductionStats();
  assert(statsEditing.editing >= 1, 'Production Tracker reflects EDITING count');

  // Check Workflow & Audit
  const workflowHist4 = await workflowService.getHistory('VIDEO', createdVideo.id);
  assert(workflowHist4.some((w) => w.toStatus === VideoProductionStatus.EDITING), 'Workflow recorded EDITING transition');

  // =========================================================================
  // STAGE 5: TRANSITION TO POST PRODUCTION / FINAL REVIEW (FINAL_REVIEW)
  // =========================================================================
  console.log('\n--- Stage 5: Transition to POST PRODUCTION (FINAL_REVIEW) ---');
  const videoPostProd = await videoService.transitionStatus(
    createdVideo.id,
    VideoProductionStatus.FINAL_REVIEW,
    reviewerActor,
    'Video cut complete with thumbnail and captions; undergoing QA review'
  );

  assert(videoPostProd.status === VideoProductionStatus.FINAL_REVIEW, 'Transition to FINAL_REVIEW (Post Production) is allowed');

  // Check persistence
  const persistedVideo5 = await videosRepository.findById(createdVideo.id);
  assert(persistedVideo5?.status === VideoProductionStatus.FINAL_REVIEW, 'Status FINAL_REVIEW persisted to Google Sheets');

  // Check Video Queue reflection
  const postProdQueue = await videoService.getVideos({ status: VideoProductionStatus.FINAL_REVIEW });
  assert(postProdQueue.some((v) => v.id === createdVideo.id), 'Video Queue reflects FINAL_REVIEW status');

  // Check Production Tracker reflection
  const statsPostProd = await videoService.getProductionStats();
  assert(statsPostProd.finalReview >= 1, 'Production Tracker reflects FINAL_REVIEW count');

  // Check Workflow & Audit
  const workflowHist5 = await workflowService.getHistory('VIDEO', createdVideo.id);
  assert(workflowHist5.some((w) => w.toStatus === VideoProductionStatus.FINAL_REVIEW), 'Workflow recorded FINAL_REVIEW transition');

  // =========================================================================
  // STAGE 6: TRANSITION TO READY (READY_TO_UPLOAD)
  // =========================================================================
  console.log('\n--- Stage 6: Transition to READY (READY_TO_UPLOAD) ---');
  const videoReady = await videoService.transitionStatus(
    createdVideo.id,
    VideoProductionStatus.READY_TO_UPLOAD,
    reviewerActor,
    'Quality standards passed; master 1080x1920 MP4 rendered and staged for upload',
    48 // actual duration
  );

  assert(videoReady.status === VideoProductionStatus.READY_TO_UPLOAD, 'Transition to READY_TO_UPLOAD (Ready) is allowed');
  assert(videoReady.actualDurationSeconds === 48, 'Actual duration recorded');

  // Check persistence
  const persistedVideo6 = await videosRepository.findById(createdVideo.id);
  assert(persistedVideo6?.status === VideoProductionStatus.READY_TO_UPLOAD, 'Status READY_TO_UPLOAD persisted to Google Sheets');

  // Check Video Queue reflection
  const readyQueue = await videoService.getVideos({ status: VideoProductionStatus.READY_TO_UPLOAD });
  assert(readyQueue.some((v) => v.id === createdVideo.id), 'Video Queue reflects READY_TO_UPLOAD status');

  // Check Production Tracker reflection
  const statsReady = await videoService.getProductionStats();
  assert(statsReady.readyToUpload >= 1, 'Production Tracker reflects READY_TO_UPLOAD count');

  // Check Workflow & Audit
  const workflowHist6 = await workflowService.getHistory('VIDEO', createdVideo.id);
  assert(workflowHist6.some((w) => w.toStatus === VideoProductionStatus.READY_TO_UPLOAD), 'Workflow recorded READY_TO_UPLOAD transition');

  // =========================================================================
  // STAGE 7: TRANSITION TO PUBLISHED (UPLOADED)
  // =========================================================================
  console.log('\n--- Stage 7: Transition to PUBLISHED (UPLOADED) ---');
  const videoPublished = await videoService.transitionStatus(
    createdVideo.id,
    VideoProductionStatus.UPLOADED,
    primaryActor,
    'Staged video metadata compiled and packaged'
  );

  assert(videoPublished.status === VideoProductionStatus.UPLOADED, 'Transition to UPLOADED (Published) is allowed');

  // Check persistence
  const persistedVideo7 = await videosRepository.findById(createdVideo.id);
  assert(persistedVideo7?.status === VideoProductionStatus.UPLOADED, 'Status UPLOADED persisted to Google Sheets');

  // Check Video Queue reflection
  const publishedQueue = await videoService.getVideos({ status: VideoProductionStatus.UPLOADED });
  assert(publishedQueue.some((v) => v.id === createdVideo.id), 'Video Queue reflects UPLOADED status');

  // Check Production Tracker reflection
  const statsPublished = await videoService.getProductionStats();
  assert(statsPublished.uploaded >= 1, 'Production Tracker reflects UPLOADED count');

  // Check Workflow & Audit
  const workflowHist7 = await workflowService.getHistory('VIDEO', createdVideo.id);
  assert(workflowHist7.some((w) => w.toStatus === VideoProductionStatus.UPLOADED), 'Workflow recorded UPLOADED transition');

  const auditLogsPublished = await auditService.getLogs('VIDEO', createdVideo.id);
  assert(auditLogsPublished.some((l) => l.action === 'VIDEO_MARKED_UPLOADED'), 'Audit log recorded VIDEO_MARKED_UPLOADED');

  // Terminal state check: UPLOADED cannot transition back
  console.log('\n--- Testing Terminal State Protection for UPLOADED ---');
  let terminalStateBlocked = false;
  try {
    await videoService.transitionStatus(createdVideo.id, VideoProductionStatus.RECORDING, primaryActor);
  } catch (err: any) {
    terminalStateBlocked = true;
    assert(err.message.includes('terminal'), 'Terminal state error message is descriptive');
  }
  assert(terminalStateBlocked, 'Terminal state protection blocks transitions out of UPLOADED');

  // =========================================================================
  // VERIFICATION: PRIORITY MANAGEMENT & SORTING
  // =========================================================================
  console.log('\n--- Testing Priority Management & Priority-Weighted Sorting ---');
  
  // Create a second video with LOW priority and a third with URGENT priority
  const testQuestion2 = await questionService.createQuestion(
    {
      questionText: 'Priority Test Q2: Speed math calculation of 98 x 97.',
      options: { a: '9506', b: '9406', c: '9606', d: '9306' },
      correctAnswer: 'A',
      categoryId: testCat.id,
      topicId: testTopic.id,
      subtopicId: testSubtopic.id,
      difficulty: DifficultyLevel.EASY,
      explanation: 'Base 100 method: (98-3)(100) + (-2 x -3) = 9506.',
    },
    primaryActor
  );
  await questionService.updateStatus(testQuestion2.id, QuestionStatus.APPROVED, primaryActor);

  const urgentVideo = await videoService.queueApprovedQuestion(
    {
      questionId: testQuestion2.id,
      title: 'Urgent Speed Math Trick 98x97',
      priority: PriorityLevel.URGENT,
      notes: 'High demand exam topic for tomorrow',
    },
    primaryActor
  );

  assert(urgentVideo.priority === PriorityLevel.URGENT, 'Urgent priority set on creation');

  // Update priority of test video and check audit log
  const updatedUrgent = await videoService.updatePriority(
    urgentVideo.id,
    PriorityLevel.HIGH,
    primaryActor,
    'Downgrading priority after schedule adjustment'
  );
  assert(updatedUrgent.priority === PriorityLevel.HIGH, 'Priority successfully updated to HIGH');

  const priorityAudit = await auditService.getLogs('VIDEO', urgentVideo.id);
  assert(priorityAudit.some((l) => l.action === 'VIDEO_PRIORITY_CHANGED'), 'Audit log recorded VIDEO_PRIORITY_CHANGED');

  // Re-elevate to URGENT
  await videoService.updatePriority(urgentVideo.id, PriorityLevel.URGENT, primaryActor);

  // Verify Sorting: URGENT items must appear before NORMAL/LOW items
  const sortedVideos = await videoService.getVideos();
  const urgentIndex = sortedVideos.findIndex((v) => v.id === urgentVideo.id);
  const normalIndex = sortedVideos.findIndex((v) => v.priority === PriorityLevel.NORMAL);
  
  if (normalIndex !== -1 && urgentIndex !== -1) {
    assert(urgentIndex < normalIndex, 'Sorting properly orders URGENT videos before NORMAL priority videos');
  } else {
    assert(sortedVideos.length > 0, 'Sorted videos returned');
  }

  // =========================================================================
  // VERIFICATION: SEARCH CAPABILITIES
  // =========================================================================
  console.log('\n--- Testing Search Capabilities ---');

  // Search by Video ID
  const searchById = await videoService.getVideos({ search: createdVideo.id });
  assert(searchById.length === 1 && searchById[0].id === createdVideo.id, 'Search by Video ID successfully finds exact record');

  // Search by Video Title keyword
  const searchByTitle = await videoService.getVideos({ search: 'Boats & Streams' });
  assert(searchByTitle.some((v) => v.id === createdVideo.id), 'Search by title keywords finds matching video');

  // Search by Linked Question ID
  const searchByQId = await videoService.getVideos({ search: testQuestion.id });
  assert(searchByQId.some((v) => v.id === createdVideo.id), 'Search by linked Question ID finds associated video');

  // Search with non-existent string
  const searchNonExistent = await videoService.getVideos({ search: 'XYZ_NON_EXISTENT_QUERY_99999' });
  assert(searchNonExistent.length === 0, 'Search with non-matching query returns empty list');

  // =========================================================================
  // VERIFICATION: FILTER CAPABILITIES
  // =========================================================================
  console.log('\n--- Testing Filter Capabilities ---');

  // Filter by Status
  const filterByStatus = await videoService.getVideos({ status: VideoProductionStatus.UPLOADED });
  assert(filterByStatus.every((v) => v.status === VideoProductionStatus.UPLOADED), 'Filter by status returns only videos matching that status');

  // Filter by Priority
  const filterByPriority = await videoService.getVideos({ priority: PriorityLevel.URGENT });
  assert(filterByPriority.every((v) => v.priority === PriorityLevel.URGENT), 'Filter by priority returns only URGENT videos');

  // Filter by Category
  const filterByCategory = await videoService.getVideos({ categoryId: testCat.id });
  assert(filterByCategory.some((v) => v.id === createdVideo.id), 'Filter by category returns videos in category');

  // Filter by Difficulty
  const filterByDifficulty = await videoService.getVideos({ difficulty: DifficultyLevel.HARD });
  assert(filterByDifficulty.some((v) => v.id === createdVideo.id), 'Filter by question difficulty returns matching videos');

  // =========================================================================
  // VERIFICATION: ASSIGNMENT & WORKFLOW OWNERSHIP
  // =========================================================================
  console.log('\n--- Testing Staff Assignments & Workflow Ownership ---');

  // Assign Host
  const hostAssignment = await videoService.assignVideo(
    createdVideo.id,
    {
      assigneeId: hostActor.id,
      assigneeName: hostActor.name,
      taskType: AssignmentTaskType.RECORDING,
      dueDate: '2026-09-01',
      notes: 'Please record on main studio stage',
    },
    primaryActor
  );

  assert(Boolean(hostAssignment.id), 'Host assignment record created');
  assert(hostAssignment.assigneeName === hostActor.name, 'Host assignee name set correctly');

  // Assign Editor
  const editorAssignment = await videoService.assignVideo(
    createdVideo.id,
    {
      assigneeId: editorActor.id,
      assigneeName: editorActor.name,
      taskType: AssignmentTaskType.EDITING,
      dueDate: '2026-09-02',
      notes: 'Apply Telugu caption presets and animated timer',
    },
    primaryActor
  );

  assert(Boolean(editorAssignment.id), 'Editor assignment record created');

  // Verify Video record updated with assignedHost & assignedEditor
  const enrichedVideo = await videoService.getVideoById(createdVideo.id);
  assert(enrichedVideo?.assignedHost === hostActor.name, 'Video object reflects assigned host');
  assert(enrichedVideo?.assignedEditor === editorActor.name, 'Video object reflects assigned editor');
  assert(enrichedVideo?.assignments?.length! >= 2, 'Video object loads full assignments array');

  // Verify Audit log for assignment
  const assignmentAudit = await auditService.getLogs('VIDEO', createdVideo.id);
  assert(assignmentAudit.some((l) => l.action === 'VIDEO_ASSIGNMENT_CHANGED'), 'Audit log records VIDEO_ASSIGNMENT_CHANGED');

  // Filter by assignedHost
  const hostFilter = await videoService.getVideos({ assignedHost: 'Sravan' });
  assert(hostFilter.some((v) => v.id === createdVideo.id), 'Filter by assigned host returns assigned video');

  // Filter by assignedEditor
  const editorFilter = await videoService.getVideos({ assignedEditor: 'Ravi' });
  assert(editorFilter.some((v) => v.id === createdVideo.id), 'Filter by assigned editor returns assigned video');

  // =========================================================================
  // COMPLETE LIFECYCLE SUMMARY
  // =========================================================================
  console.log('\n========================================================================');
  console.log(`TASK 7 VERIFICATION COMPLETE: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('========================================================================\n');

  return { passedTests, totalTests, results };
}

// Auto-run
runTask7Verification()
  .then((res) => {
    console.log(`Task 7 verification execution passed with ${res.passedTests}/${res.totalTests} tests.`);
    process.exit(0);
  })
  .catch((err) => {
    console.error('Task 7 verification error:', err);
    process.exit(1);
  });
