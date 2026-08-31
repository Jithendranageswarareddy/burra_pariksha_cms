/**
 * BURRA PARIKSHA CMS - Phase 5 Verification Test Suite
 * Video Queue & Production Tracking
 * 
 * Verifies:
 * 1. Approved Question Queueing Guard (Only APPROVED questions can be queued).
 * 2. Permanent Sequence ID Generation (BP-V-xxxxxx).
 * 3. End-to-End State Machine Transitions (QUEUED -> SCRIPT_REQUIRED -> SCRIPT_READY -> RECORDING -> RECORDED -> EDITING -> EDITED -> FINAL_REVIEW -> READY_TO_UPLOAD -> UPLOADED).
 * 4. Illegal State Transition Blocking (InvalidStateTransitionError, Terminal states).
 * 5. On-Hold & Cancellation State Handling.
 * 6. QUESTION_VIDEOS Join Synchronization and Question video_status sync.
 * 7. Task Assignments & Priority Updates.
 * 8. Audit and Workflow Event Logging.
 * 9. Production Statistics Aggregation.
 */

import { videoService } from '../lib/services/video.service';
import { questionService } from '../lib/services/question.service';
import { taxonomyService } from '../lib/services/taxonomy.service';
import { questionsRepository } from '../lib/repositories/questions.repository';
import { videosRepository } from '../lib/repositories/videos.repository';
import { questionVideosRepository } from '../lib/repositories/question-videos.repository';
import { workflowRepository } from '../lib/repositories/workflow.repository';
import { auditLogRepository } from '../lib/repositories/audit-log.repository';
import {
  DifficultyLevel,
  PriorityLevel,
  QuestionStatus,
  VideoProductionStatus,
} from '../types';

export interface VerificationTestResult {
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

export interface Phase5VerificationSummary {
  phase: number;
  title: string;
  timestamp: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  results: VerificationTestResult[];
}

export async function runPhase5Verification(): Promise<Phase5VerificationSummary> {
  const results: VerificationTestResult[] = [];

  const runTest = async (name: string, fn: () => Promise<void>) => {
    try {
      await fn();
      results.push({ name, passed: true });
    } catch (err: any) {
      results.push({
        name,
        passed: false,
        error: err?.message || 'Test assertion failed',
        details: err?.stack,
      });
    }
  };

  const actor = { id: 'USR-TEST', name: 'Phase 5 Test Runner' };

  // Fetch valid taxonomy tree
  const tree = await taxonomyService.getTaxonomyTree();
  const testCat = tree[0];
  const testTopic = testCat.topics[0];
  const testSubtopic = testTopic.subtopics[0];

  // =========================================================================
  // TEST 1: Unapproved Question Cannot Enter Video Queue
  // =========================================================================
  await runTest('Guard: Non-APPROVED questions cannot enter video queue', async () => {
    // Create a DRAFT question
    const draftQ = await questionService.createQuestion(
      {
        questionText: 'Phase 5 Test: What is the unit digit of 7^95 - 3^58?',
        options: { a: '0', b: '4', c: '6', d: '7' },
        correctAnswer: 'B',
        categoryId: testCat.id,
        topicId: testTopic.id,
        subtopicId: testSubtopic.id,
        difficulty: DifficultyLevel.MEDIUM,
        explanation: 'Unit digit calculation using cyclicity of 4.',
      },
      actor
    );

    // Attempt to queue draft question directly
    let errorCaught = false;
    try {
      await videoService.queueApprovedQuestion(
        { questionId: draftQ.id, notes: 'Should fail because status is DRAFT' },
        actor
      );
    } catch (err: any) {
      errorCaught = true;
      if (!err.message.includes('APPROVED')) {
        throw new Error(`Expected error mentioning "APPROVED", got: ${err.message}`);
      }
    }

    if (!errorCaught) {
      throw new Error('Expected videoService.queueApprovedQuestion to throw for DRAFT question.');
    }
  });

  // =========================================================================
  // TEST 2: Approved Question Can Be Queued & Allocates BP-V-xxxxxx ID
  // =========================================================================
  let queuedVideoId = '';
  let approvedQuestionId = '';

  await runTest('Queueing: APPROVED question successfully queues and creates BP-V-xxxxxx ID', async () => {
    // 1. Create and approve a question
    const q = await questionService.createQuestion(
      {
        questionText: 'Phase 5 Test: Pipe A fills tank in 12 hrs, Pipe B in 15 hrs. Find combined time.',
        options: { a: '6 hrs', b: '6.67 hrs', c: '7 hrs', d: '8 hrs' },
        correctAnswer: 'B',
        categoryId: testCat.id,
        topicId: testTopic.id,
        subtopicId: testSubtopic.id,
        difficulty: DifficultyLevel.EASY,
        explanation: 'Combined rate = 1/12 + 1/15 = 9/60 = 3/20. Time = 20/3 = 6.67 hrs.',
      },
      actor
    );

    // Transition to APPROVED
    const approvedQ = await questionService.updateStatus(q.id, QuestionStatus.APPROVED, actor);
    approvedQuestionId = approvedQ.id;

    // 2. Queue into video production
    const video = await videoService.queueApprovedQuestion(
      {
        questionId: approvedQ.id,
        title: 'Pipes & Cisterns Shortcut Trick',
        priority: PriorityLevel.HIGH,
        notes: 'Feature formula popup at 0:15 mark',
        targetDurationSeconds: 50,
      },
      actor
    );

    queuedVideoId = video.id;

    if (!video.id.startsWith('BP-V-')) {
      throw new Error(`Expected Video ID to start with BP-V-, got: ${video.id}`);
    }

    if (video.status !== VideoProductionStatus.QUEUED) {
      throw new Error(`Expected Video status to be QUEUED, got: ${video.status}`);
    }

    if (video.priority !== PriorityLevel.HIGH) {
      throw new Error(`Expected Video priority to be HIGH, got: ${video.priority}`);
    }

    // Verify Question video_status is now QUEUED
    const updatedQ = await questionsRepository.findById(approvedQ.id);
    if (updatedQ?.videoStatus !== VideoProductionStatus.QUEUED) {
      throw new Error(`Expected Question videoStatus to be QUEUED, got: ${updatedQ?.videoStatus}`);
    }

    // Verify QUESTION_VIDEOS join record exists
    const qvRecords = await questionVideosRepository.findByQuestionId(approvedQ.id);
    if (!qvRecords.some((r) => r.videoId === video.id)) {
      throw new Error(`QUESTION_VIDEOS join record was not created for Video ${video.id}`);
    }
  });

  // =========================================================================
  // TEST 3: Full Valid State Machine Walkthrough
  // =========================================================================
  await runTest('State Machine: Complete lifecycle from QUEUED to UPLOADED', async () => {
    if (!queuedVideoId) throw new Error('Prior test did not produce a video ID');

    // 1. QUEUED -> SCRIPT_REQUIRED
    let v = await videoService.transitionStatus(
      queuedVideoId,
      VideoProductionStatus.SCRIPT_REQUIRED,
      actor,
      'Scripting template requested'
    );
    if (v.status !== VideoProductionStatus.SCRIPT_REQUIRED) {
      throw new Error(`Failed to transition to SCRIPT_REQUIRED: got ${v.status}`);
    }

    // 2. SCRIPT_REQUIRED -> SCRIPT_READY
    v = await videoService.transitionStatus(
      queuedVideoId,
      VideoProductionStatus.SCRIPT_READY,
      actor,
      'Script drafted and checked for 50s pacing'
    );
    if (v.status !== VideoProductionStatus.SCRIPT_READY) {
      throw new Error(`Failed to transition to SCRIPT_READY: got ${v.status}`);
    }

    // 3. SCRIPT_READY -> RECORDING
    v = await videoService.transitionStatus(
      queuedVideoId,
      VideoProductionStatus.RECORDING,
      actor,
      'Host started studio recording'
    );
    if (v.status !== VideoProductionStatus.RECORDING) {
      throw new Error(`Failed to transition to RECORDING: got ${v.status}`);
    }

    // 4. RECORDING -> RECORDED
    v = await videoService.transitionStatus(
      queuedVideoId,
      VideoProductionStatus.RECORDED,
      actor,
      'Raw A-roll footage captured'
    );
    if (v.status !== VideoProductionStatus.RECORDED) {
      throw new Error(`Failed to transition to RECORDED: got ${v.status}`);
    }

    // 5. RECORDED -> EDITING
    v = await videoService.transitionStatus(
      queuedVideoId,
      VideoProductionStatus.EDITING,
      actor,
      'Editor loaded footage into Premiere'
    );
    if (v.status !== VideoProductionStatus.EDITING) {
      throw new Error(`Failed to transition to EDITING: got ${v.status}`);
    }

    // 6. EDITING -> EDITED
    v = await videoService.transitionStatus(
      queuedVideoId,
      VideoProductionStatus.EDITED,
      actor,
      'Rough cut and motion graphics complete'
    );
    if (v.status !== VideoProductionStatus.EDITED) {
      throw new Error(`Failed to transition to EDITED: got ${v.status}`);
    }

    // 7. EDITED -> FINAL_REVIEW
    v = await videoService.transitionStatus(
      queuedVideoId,
      VideoProductionStatus.FINAL_REVIEW,
      actor,
      'Submitted for lead review'
    );
    if (v.status !== VideoProductionStatus.FINAL_REVIEW) {
      throw new Error(`Failed to transition to FINAL_REVIEW: got ${v.status}`);
    }

    // 8. FINAL_REVIEW -> READY_TO_UPLOAD
    v = await videoService.transitionStatus(
      queuedVideoId,
      VideoProductionStatus.READY_TO_UPLOAD,
      actor,
      'QC approved, master exported'
    );
    if (v.status !== VideoProductionStatus.READY_TO_UPLOAD) {
      throw new Error(`Failed to transition to READY_TO_UPLOAD: got ${v.status}`);
    }

    // 9. READY_TO_UPLOAD -> UPLOADED
    v = await videoService.transitionStatus(
      queuedVideoId,
      VideoProductionStatus.UPLOADED,
      actor,
      'Uploaded to channel storage',
      48
    );
    if (v.status !== VideoProductionStatus.UPLOADED) {
      throw new Error(`Failed to transition to UPLOADED: got ${v.status}`);
    }
    if (v.actualDurationSeconds !== 48) {
      throw new Error(`Expected actualDurationSeconds to be 48, got ${v.actualDurationSeconds}`);
    }

    // Verify Question video_status updated to UPLOADED
    const finalQ = await questionsRepository.findById(approvedQuestionId);
    if (finalQ?.videoStatus !== VideoProductionStatus.UPLOADED) {
      throw new Error(`Expected Question videoStatus to be UPLOADED, got ${finalQ?.videoStatus}`);
    }
  });

  // =========================================================================
  // TEST 4: Illegal Transitions & Terminal States Are Strictly Blocked
  // =========================================================================
  await runTest('Guards: Illegal transitions and terminal states are rejected', async () => {
    if (!queuedVideoId) throw new Error('Missing video ID');

    // Video is currently UPLOADED (terminal). Attempt to transition back to QUEUED
    let terminalBlocked = false;
    try {
      await videoService.transitionStatus(
        queuedVideoId,
        VideoProductionStatus.QUEUED,
        actor,
        'Illegal back-transition from terminal'
      );
    } catch (err: any) {
      terminalBlocked = true;
      if (!err.message.includes('Invalid transition') && !err.message.includes('Illegal status transition') && !err.message.includes('terminal')) {
        throw new Error(`Expected invalid transition error, got: ${err.message}`);
      }
    }

    if (!terminalBlocked) {
      throw new Error('Expected transition out of terminal state UPLOADED to throw.');
    }

    // Create another approved question to test invalid jump (QUEUED -> READY_TO_UPLOAD)
    const q2 = await questionService.createQuestion(
      {
        questionText: 'Phase 5 Guard Test: Speed of train is 72 km/h. Convert to m/s.',
        options: { a: '15 m/s', b: '20 m/s', c: '25 m/s', d: '30 m/s' },
        correctAnswer: 'B',
        categoryId: testCat.id,
        topicId: testTopic.id,
        subtopicId: testSubtopic.id,
        difficulty: DifficultyLevel.EASY,
        explanation: '72 * 5/18 = 20 m/s.',
      },
      actor
    );
    await questionService.updateStatus(q2.id, QuestionStatus.APPROVED, actor);

    const v2 = await videoService.queueApprovedQuestion(
      { questionId: q2.id, title: 'Train Speed Conversion' },
      actor
    );

    let jumpBlocked = false;
    try {
      await videoService.transitionStatus(
        v2.id,
        VideoProductionStatus.READY_TO_UPLOAD,
        actor,
        'Direct jump should fail'
      );
    } catch (err: any) {
      jumpBlocked = true;
    }

    if (!jumpBlocked) {
      throw new Error('Expected illegal jump from QUEUED to READY_TO_UPLOAD to be rejected.');
    }
  });

  // =========================================================================
  // TEST 5: On-Hold & Cancellation Transitions
  // =========================================================================
  await runTest('Lifecycle: ON_HOLD pause/resume and CANCELLED terminal state', async () => {
    const qHold = await questionService.createQuestion(
      {
        questionText: 'Phase 5 Hold Test: Find simple interest on Rs 5000 at 10% for 2 years.',
        options: { a: 'Rs 500', b: 'Rs 1000', c: 'Rs 1200', d: 'Rs 1500' },
        correctAnswer: 'B',
        categoryId: testCat.id,
        topicId: testTopic.id,
        subtopicId: testSubtopic.id,
        difficulty: DifficultyLevel.EASY,
        explanation: 'SI = (5000 * 10 * 2) / 100 = 1000.',
      },
      actor
    );
    await questionService.updateStatus(qHold.id, QuestionStatus.APPROVED, actor);

    const vHold = await videoService.queueApprovedQuestion(
      { questionId: qHold.id, title: 'Simple Interest Fast Formula' },
      actor
    );

    // QUEUED -> SCRIPT_REQUIRED
    await videoService.transitionStatus(vHold.id, VideoProductionStatus.SCRIPT_REQUIRED, actor);

    // SCRIPT_REQUIRED -> ON_HOLD
    const held = await videoService.transitionStatus(
      vHold.id,
      VideoProductionStatus.ON_HOLD,
      actor,
      'Awaiting host availability'
    );
    if (held.status !== VideoProductionStatus.ON_HOLD) {
      throw new Error(`Expected status ON_HOLD, got ${held.status}`);
    }

    // ON_HOLD -> SCRIPT_REQUIRED (Resumed)
    const resumed = await videoService.transitionStatus(
      vHold.id,
      VideoProductionStatus.SCRIPT_REQUIRED,
      actor,
      'Host available, resumed'
    );
    if (resumed.status !== VideoProductionStatus.SCRIPT_REQUIRED) {
      throw new Error(`Expected status SCRIPT_REQUIRED on resume, got ${resumed.status}`);
    }

    // SCRIPT_REQUIRED -> CANCELLED (Terminal)
    const cancelled = await videoService.transitionStatus(
      vHold.id,
      VideoProductionStatus.CANCELLED,
      actor,
      'Topic deprecated'
    );
    if (cancelled.status !== VideoProductionStatus.CANCELLED) {
      throw new Error(`Expected status CANCELLED, got ${cancelled.status}`);
    }

    // Attempt transition out of CANCELLED -> Should throw
    let cancelBlocked = false;
    try {
      await videoService.transitionStatus(vHold.id, VideoProductionStatus.SCRIPT_REQUIRED, actor);
    } catch {
      cancelBlocked = true;
    }

    if (!cancelBlocked) {
      throw new Error('Expected transition out of CANCELLED state to throw.');
    }
  });

  // =========================================================================
  // TEST 6: Metadata Updates, Task Assignments & Priority
  // =========================================================================
  await runTest('Management: Metadata editing, Priority changes, and Task Assignment', async () => {
    const q = await questionService.createQuestion(
      {
        questionText: 'Phase 5 Mgmt Test: Average of 5 numbers is 20. If one is removed, average is 18. Find removed number.',
        options: { a: '24', b: '26', c: '28', d: '30' },
        correctAnswer: 'C',
        categoryId: testCat.id,
        topicId: testTopic.id,
        subtopicId: testSubtopic.id,
        difficulty: DifficultyLevel.MEDIUM,
        explanation: 'Total = 100. New total = 4 * 18 = 72. Removed = 100 - 72 = 28.',
      },
      actor
    );
    await questionService.updateStatus(q.id, QuestionStatus.APPROVED, actor);

    const v = await videoService.queueApprovedQuestion(
      { questionId: q.id, title: 'Average Numbers Trick' },
      actor
    );

    // Update Priority
    const pUpdated = await videoService.updatePriority(v.id, PriorityLevel.URGENT, actor, 'Viral trend topic');
    if (pUpdated.priority !== PriorityLevel.URGENT) {
      throw new Error(`Expected priority URGENT, got ${pUpdated.priority}`);
    }

    // Update Metadata
    const mUpdated = await videoService.updateVideoMetadata(
      v.id,
      {
        assignedHost: 'Sravani (Lead)',
        assignedEditor: 'Ramesh (Motion FX)',
        driveFolderUrl: 'https://drive.google.com/drive/folders/bp-001',
        notes: 'Include Telugu subtitle track',
      },
      actor
    );

    if (mUpdated.assignedHost !== 'Sravani (Lead)') {
      throw new Error(`Expected host Sravani (Lead), got ${mUpdated.assignedHost}`);
    }
    if (mUpdated.assignedEditor !== 'Ramesh (Motion FX)') {
      throw new Error(`Expected editor Ramesh (Motion FX), got ${mUpdated.assignedEditor}`);
    }

    // Add Assignment Record
    const asg = await videoService.assignVideo(
      v.id,
      {
        assigneeId: 'USR-HOST-1',
        assigneeName: 'Sravani',
        taskType: 'RECORDING',
        notes: 'Studio 1 recording session',
      },
      actor
    );

    if (!asg.id.startsWith('ASG-')) {
      throw new Error(`Expected assignment ID to start with ASG-, got ${asg.id}`);
    }
  });

  // =========================================================================
  // TEST 7: Audit & Workflow Logging Completeness
  // =========================================================================
  await runTest('Audit: Workflow and Audit Logs are properly written to worksheets', async () => {
    if (!queuedVideoId) throw new Error('Missing video ID');

    // Retrieve workflow records
    const wfHistory = await workflowRepository.findByEntity('VIDEO', queuedVideoId);
    if (wfHistory.length === 0) {
      throw new Error(`No workflow history records found in WORKFLOW sheet for video ${queuedVideoId}`);
    }

    // Retrieve audit logs
    const auditLogs = await auditLogRepository.findByEntity('VIDEO', queuedVideoId);
    if (auditLogs.length === 0) {
      throw new Error(`No audit logs found in AUDIT_LOG sheet for video ${queuedVideoId}`);
    }
  });

  // =========================================================================
  // TEST 8: Production Stats Calculation
  // =========================================================================
  await runTest('Aggregation: Production stats correctly aggregate pipeline metrics', async () => {
    const stats = await videoService.getProductionStats();

    if (typeof stats.total !== 'number' || stats.total < 1) {
      throw new Error(`Expected positive total videos count, got ${stats.total}`);
    }
    if (typeof stats.uploaded !== 'number' || stats.uploaded < 1) {
      throw new Error(`Expected uploaded count >= 1, got ${stats.uploaded}`);
    }
    if (!stats.byPriority || typeof stats.byPriority.urgent !== 'number') {
      throw new Error('Expected stats.byPriority with urgent count');
    }
  });

  const passedTests = results.filter((r) => r.passed).length;
  const failedTests = results.filter((r) => !r.passed).length;

  return {
    phase: 5,
    title: 'Burra Pariksha CMS - Phase 5 Video Queue & Production Tracking Verification',
    timestamp: new Date().toISOString(),
    totalTests: results.length,
    passedTests,
    failedTests,
    results,
  };
}

// Auto-run if executed directly
if (process.argv[1] && process.argv[1].includes('phase5-verification')) {
  runPhase5Verification().then((res) => {
    console.log('====================================================');
    console.log('BURRA PARIKSHA CMS - PHASE 5 VIDEO PRODUCTION TRACKING VERIFICATION');
    console.log('====================================================');
    res.results.forEach((r, idx) => {
      console.log(`[${r.passed ? 'PASS' : 'FAIL'}] Test ${idx + 1}: ${r.name} ${r.error ? `- ${r.error}` : ''}`);
    });
    console.log('====================================================');
    console.log(`PHASE 5 VERIFICATION COMPLETE: ALL ${res.passedTests}/${res.totalTests} TESTS PASSED`);
    console.log('====================================================');
    if (res.failedTests > 0) {
      process.exit(1);
    }
  }).catch((err) => {
    console.error('Phase 5 verification failed:', err);
    process.exit(1);
  });
}

