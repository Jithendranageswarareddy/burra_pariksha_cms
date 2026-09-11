/**
 * PHASE 18 — CONTENT MASTER DOWNSTREAM TERMINAL-STATE GUARDRAILS
 *
 * Test suite verifying:
 * 1. Queue video on COMPLETED CM -> rejected with ValidationError.
 * 2. Queue video on ARCHIVED CM -> rejected with ValidationError.
 * 3. Advance existing active video on COMPLETED CM -> allowed.
 * 4. Advance existing active video on ARCHIVED CM -> rejected with ValidationError.
 * 5. Cancel/on-hold video on COMPLETED CM -> allowed.
 * 6. Cancel/on-hold video on ARCHIVED CM -> allowed.
 * 7. Schedule publishing on ARCHIVED CM -> rejected with ValidationError.
 * 8. Finalize publishing on ARCHIVED CM -> rejected with ValidationError.
 * 9. Create assignment on COMPLETED CM -> rejected with ValidationError.
 * 10. Create assignment on ARCHIVED CM -> rejected with ValidationError.
 * 11. Verify rejected operations do not mutate the target entity.
 * 12. Verify existing valid non-terminal behavior remains unchanged.
 */

import { videoService } from '../lib/services/video.service';
import { publishingService } from '../lib/services/publishing.service';
import { assignmentService } from '../lib/services/assignment.service';
import {
  contentMastersRepository,
  questionsRepository,
  videosRepository,
  publishingRepository,
  assignmentsRepository,
  usersRepository,
  auditLogRepository,
} from '../lib/repositories';
import {
  Assignment,
  AssignmentEntityType,
  AssignmentStatus,
  AssignmentTaskType,
  ContentMaster,
  ContentMasterStatus,
  DifficultyLevel,
  PriorityLevel,
  Publishing,
  Question,
  QuestionLanguage,
  QuestionStatus,
  SocialPublishStatus,
  User,
  UserRole,
  Video,
  VideoProductionStatus,
} from '../types';
import { ValidationError } from '../lib/google-sheets/errors';

export interface TestResult {
  testId: number;
  name: string;
  status: 'PASS' | 'FAIL';
  details: string;
}

export async function runPhase18ContentMasterGuardrailsVerification(): Promise<{
  passed: boolean;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  results: TestResult[];
}> {
  console.log('\n===============================================================');
  console.log('PHASE 18: CONTENT MASTER DOWNSTREAM TERMINAL-STATE GUARDRAILS');
  console.log('===============================================================\n');

  const results: TestResult[] = [];

  // In-memory backing maps
  const contentMastersMap = new Map<string, ContentMaster>();
  const questionsMap = new Map<string, Question>();
  const videosMap = new Map<string, Video>();
  const publishingMap = new Map<string, Publishing>();
  const assignmentsMap = new Map<string, Assignment>();
  const usersMap = new Map<string, User>();
  const auditLogs: any[] = [];

  // Preserve original repository methods
  const origCMFindById = contentMastersRepository.findById;
  const origQFindById = questionsRepository.findById;
  const origQUpdate = questionsRepository.updateRecord;
  const origVFindById = videosRepository.findById;
  const origVFindByQuestionId = videosRepository.findByQuestionId;
  const origVAppend = videosRepository.appendRecord;
  const origVUpdate = videosRepository.updateRecord;
  const origPubFindByVideoId = publishingRepository.findByVideoId;
  const origPubAppend = publishingRepository.appendRecord;
  const origPubUpdate = publishingRepository.updateRecord;
  const origAsnFindById = assignmentsRepository.findById;
  const origAsnFindActive = assignmentsRepository.findActiveByEntity;
  const origAsnAppend = assignmentsRepository.appendRecord;
  const origUserFindById = usersRepository.findById;
  const origAuditLog = auditLogRepository.logAction;

  // Setup in-memory mock repositories
  contentMastersRepository.findById = async (id: string) => contentMastersMap.get(id) || null;
  questionsRepository.findById = async (id: string) => questionsMap.get(id) || null;
  questionsRepository.updateRecord = async (id: string, updates: Partial<Question>) => {
    const existing = questionsMap.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    questionsMap.set(id, updated);
    return updated;
  };
  videosRepository.findById = async (id: string) => videosMap.get(id) || null;
  videosRepository.findByQuestionId = async (qId: string) => {
    return Array.from(videosMap.values()).filter((v) => v.questionId === qId);
  };
  videosRepository.appendRecord = async (video: Video) => {
    videosMap.set(video.id, video);
    return video;
  };
  videosRepository.updateRecord = async (id: string, updates: Partial<Video>) => {
    const existing = videosMap.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    videosMap.set(id, updated);
    return updated;
  };
  publishingRepository.findByVideoId = async (vId: string) => publishingMap.get(vId) || null;
  publishingRepository.appendRecord = async (pub: Publishing) => {
    publishingMap.set(pub.videoId, pub);
    return pub;
  };
  publishingRepository.updateRecord = async (vId: string, updates: Partial<Publishing>) => {
    const existing = publishingMap.get(vId);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    publishingMap.set(vId, updated);
    return updated;
  };
  assignmentsRepository.findById = async (id: string) => assignmentsMap.get(id) || null;
  assignmentsRepository.findActiveByEntity = async (type: any, entityId: string) => {
    return Array.from(assignmentsMap.values()).filter(
      (a) =>
        a.entityType === type &&
        a.entityId === entityId &&
        a.status !== AssignmentStatus.COMPLETED &&
        a.status !== AssignmentStatus.CANCELLED
    );
  };
  assignmentsRepository.appendRecord = async (asn: Assignment) => {
    assignmentsMap.set(asn.id, asn);
    return asn;
  };
  usersRepository.findById = async (id: string) => usersMap.get(id) || null;
  auditLogRepository.logAction = async (actorId, actorName, action, entityType, entityId, changes) => {
    const record = { id: `LOG-${Date.now()}`, actorId, actorName, action, entityType, entityId, changes };
    auditLogs.push(record);
    return record as any;
  };

  // Seed test users
  const adminActor = { id: 'USR-ADMIN-01', name: 'Admin Lead', role: UserRole.ADMIN };
  const pubManagerActor = { id: 'USR-PUB-01', name: 'Publishing Lead', role: UserRole.PUBLISHING_MANAGER };
  const editorUser: User = {
    id: 'USR-EDITOR-01',
    name: 'Video Editor',
    email: 'editor@test.com',
    role: UserRole.VIDEO_EDITOR,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  usersMap.set(editorUser.id, editorUser);

  // Helper seed functions
  const seedCM = (id: string, status: ContentMasterStatus): ContentMaster => {
    const cm: ContentMaster = {
      id,
      title: `Content Master ${id}`,
      status,
      categoryId: 'BP-CAT-TEST01',
      topicId: 'BP-TOP-TEST01',
      subtopicId: 'BP-SUB-TEST01',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: adminActor.id,
    };
    contentMastersMap.set(id, cm);
    return cm;
  };

  const seedQuestion = (id: string, cmId: string): Question => {
    const q: Question = {
      id,
      contentMasterId: cmId,
      categoryId: 'BP-CAT-TEST01',
      categoryName: 'Category',
      topicId: 'BP-TOP-TEST01',
      topicName: 'Topic',
      subtopicId: 'BP-SUB-TEST01',
      subtopicName: 'Subtopic',
      questionText: `Question ${id}`,
      options: { a: '1', b: '2', c: '3', d: '4' },
      correctAnswer: 'A',
      explanation: 'Explanation',
      difficulty: DifficultyLevel.MEDIUM,
      language: QuestionLanguage.TELUGU,
      status: QuestionStatus.APPROVED,
      videoStatus: VideoProductionStatus.NOT_STARTED,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    questionsMap.set(id, q);
    return q;
  };

  const seedVideo = (id: string, cmId: string, qId: string, status: VideoProductionStatus): Video => {
    const v: Video = {
      id,
      contentMasterId: cmId,
      questionId: qId,
      title: `Video ${id}`,
      status,
      priority: PriorityLevel.NORMAL,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    videosMap.set(id, v);
    return v;
  };

  const seedPublishing = (videoId: string, questionId: string = 'BP-Q-000001'): Publishing => {
    const pub: Publishing = {
      id: `PUB-${videoId}`,
      videoId,
      videoTitle: `Video ${videoId}`,
      questionId,
      finalVideoStatus: 'READY',
      completedPlatformsCount: 0,
      totalPlatformsCount: 3,
      youtube: { status: SocialPublishStatus.NOT_STARTED },
      instagram: { status: SocialPublishStatus.NOT_STARTED },
      facebook: { status: SocialPublishStatus.NOT_STARTED },
      pinnedCommentReady: false,
      thumbnailReady: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    publishingMap.set(videoId, pub);
    return pub;
  };

  try {
    // Seed test Content Masters
    seedCM('BP-MST-COMPLETED-01', ContentMasterStatus.COMPLETED);
    seedCM('BP-MST-ARCHIVED-01', ContentMasterStatus.ARCHIVED);
    seedCM('BP-MST-ACTIVE-01', ContentMasterStatus.ACTIVE);

    // -------------------------------------------------------------------------
    // TEST 1: Queue video on COMPLETED CM -> rejected with ValidationError
    // -------------------------------------------------------------------------
    seedQuestion('BP-Q-CMP-01', 'BP-MST-COMPLETED-01');
    let t1Rejected = false;
    let t1ErrorMsg = '';
    try {
      await videoService.queueVideoForProduction(
        { questionId: 'BP-Q-CMP-01', title: 'Video for Completed CM' },
        adminActor
      );
    } catch (err: any) {
      if (err instanceof ValidationError || err?.name === 'ValidationError') {
        t1Rejected = true;
        t1ErrorMsg = err.message;
      }
    }
    results.push({
      testId: 1,
      name: 'Queue video on COMPLETED CM rejected with ValidationError',
      status: t1Rejected ? 'PASS' : 'FAIL',
      details: t1Rejected
        ? `Correctly threw ValidationError: "${t1ErrorMsg}".`
        : 'Failed: Video queue was permitted on COMPLETED Content Master!',
    });

    // -------------------------------------------------------------------------
    // TEST 2: Queue video on ARCHIVED CM -> rejected with ValidationError
    // -------------------------------------------------------------------------
    seedQuestion('BP-Q-ARC-01', 'BP-MST-ARCHIVED-01');
    let t2Rejected = false;
    let t2ErrorMsg = '';
    try {
      await videoService.queueVideoForProduction(
        { questionId: 'BP-Q-ARC-01', title: 'Video for Archived CM' },
        adminActor
      );
    } catch (err: any) {
      if (err instanceof ValidationError || err?.name === 'ValidationError') {
        t2Rejected = true;
        t2ErrorMsg = err.message;
      }
    }
    results.push({
      testId: 2,
      name: 'Queue video on ARCHIVED CM rejected with ValidationError',
      status: t2Rejected ? 'PASS' : 'FAIL',
      details: t2Rejected
        ? `Correctly threw ValidationError: "${t2ErrorMsg}".`
        : 'Failed: Video queue was permitted on ARCHIVED Content Master!',
    });

    // -------------------------------------------------------------------------
    // TEST 3: Advance existing active video on COMPLETED CM -> allowed
    // -------------------------------------------------------------------------
    seedQuestion('BP-Q-CMP-02', 'BP-MST-COMPLETED-01');
    seedVideo('BP-V-CMP-02', 'BP-MST-COMPLETED-01', 'BP-Q-CMP-02', VideoProductionStatus.EDITING);
    let t3Allowed = false;
    try {
      const advanced = await videoService.transitionStatus(
        'BP-V-CMP-02',
        VideoProductionStatus.EDITED,
        adminActor
      );
      t3Allowed = advanced.status === VideoProductionStatus.EDITED;
    } catch (err: any) {
      t3Allowed = false;
    }
    results.push({
      testId: 3,
      name: 'Advance existing active video on COMPLETED CM is allowed to finish in-flight work',
      status: t3Allowed ? 'PASS' : 'FAIL',
      details: t3Allowed
        ? 'Successfully transitioned active video from EDITING to EDITED on COMPLETED CM.'
        : 'Failed: In-flight video transition was blocked on COMPLETED Content Master!',
    });

    // -------------------------------------------------------------------------
    // TEST 4: Advance existing active video on ARCHIVED CM -> rejected with ValidationError
    // -------------------------------------------------------------------------
    seedQuestion('BP-Q-ARC-02', 'BP-MST-ARCHIVED-01');
    seedVideo('BP-V-ARC-02', 'BP-MST-ARCHIVED-01', 'BP-Q-ARC-02', VideoProductionStatus.EDITING);
    let t4Rejected = false;
    let t4ErrorMsg = '';
    try {
      await videoService.transitionStatus(
        'BP-V-ARC-02',
        VideoProductionStatus.EDITED,
        adminActor
      );
    } catch (err: any) {
      if (err instanceof ValidationError || err?.name === 'ValidationError') {
        t4Rejected = true;
        t4ErrorMsg = err.message;
      }
    }
    results.push({
      testId: 4,
      name: 'Advance existing active video on ARCHIVED CM rejected with ValidationError',
      status: t4Rejected ? 'PASS' : 'FAIL',
      details: t4Rejected
        ? `Correctly threw ValidationError: "${t4ErrorMsg}".`
        : 'Failed: Active video forward progress was allowed on ARCHIVED Content Master!',
    });

    // -------------------------------------------------------------------------
    // TEST 5: Cancel / on-hold video on COMPLETED CM -> allowed
    // -------------------------------------------------------------------------
    seedQuestion('BP-Q-CMP-03', 'BP-MST-COMPLETED-01');
    seedVideo('BP-V-CMP-03', 'BP-MST-COMPLETED-01', 'BP-Q-CMP-03', VideoProductionStatus.EDITING);
    let t5Allowed = false;
    try {
      const cancelled = await videoService.transitionStatus(
        'BP-V-CMP-03',
        VideoProductionStatus.CANCELLED,
        adminActor
      );
      t5Allowed = cancelled.status === VideoProductionStatus.CANCELLED;
    } catch (err: any) {
      t5Allowed = false;
    }
    results.push({
      testId: 5,
      name: 'Cancel/on-hold video on COMPLETED CM is allowed for cleanup/cancellation',
      status: t5Allowed ? 'PASS' : 'FAIL',
      details: t5Allowed
        ? 'Successfully transitioned video to CANCELLED on COMPLETED Content Master.'
        : 'Failed: Cancellation transition was blocked on COMPLETED Content Master!',
    });

    // -------------------------------------------------------------------------
    // TEST 6: Cancel / on-hold video on ARCHIVED CM -> allowed
    // -------------------------------------------------------------------------
    seedQuestion('BP-Q-ARC-03', 'BP-MST-ARCHIVED-01');
    seedVideo('BP-V-ARC-03', 'BP-MST-ARCHIVED-01', 'BP-Q-ARC-03', VideoProductionStatus.EDITING);
    let t6Allowed = false;
    try {
      const cancelled = await videoService.transitionStatus(
        'BP-V-ARC-03',
        VideoProductionStatus.CANCELLED,
        adminActor
      );
      t6Allowed = cancelled.status === VideoProductionStatus.CANCELLED;
    } catch (err: any) {
      t6Allowed = false;
    }
    results.push({
      testId: 6,
      name: 'Cancel/on-hold video on ARCHIVED CM is allowed for retirement/cleanup',
      status: t6Allowed ? 'PASS' : 'FAIL',
      details: t6Allowed
        ? 'Successfully transitioned in-flight video to CANCELLED on ARCHIVED Content Master.'
        : 'Failed: Cleanup cancellation was blocked on ARCHIVED Content Master!',
    });

    // -------------------------------------------------------------------------
    // TEST 7: Schedule publishing on ARCHIVED CM -> rejected with ValidationError
    // -------------------------------------------------------------------------
    seedQuestion('BP-Q-ARC-04', 'BP-MST-ARCHIVED-01');
    seedVideo('BP-V-ARC-04', 'BP-MST-ARCHIVED-01', 'BP-Q-ARC-04', VideoProductionStatus.READY_TO_UPLOAD);
    seedPublishing('BP-V-ARC-04');
    let t7Rejected = false;
    let t7ErrorMsg = '';
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    try {
      await publishingService.schedulePublishing(
        'BP-V-ARC-04',
        'youtube',
        futureDate,
        pubManagerActor
      );
    } catch (err: any) {
      if (err instanceof ValidationError || err?.name === 'ValidationError') {
        t7Rejected = true;
        t7ErrorMsg = err.message;
      }
    }
    results.push({
      testId: 7,
      name: 'Schedule publishing on ARCHIVED CM rejected with ValidationError',
      status: t7Rejected ? 'PASS' : 'FAIL',
      details: t7Rejected
        ? `Correctly threw ValidationError: "${t7ErrorMsg}".`
        : 'Failed: Publishing scheduling was permitted on ARCHIVED Content Master!',
    });

    // -------------------------------------------------------------------------
    // TEST 8: Finalize publishing on ARCHIVED CM -> rejected with ValidationError
    // -------------------------------------------------------------------------
    seedQuestion('BP-Q-ARC-05', 'BP-MST-ARCHIVED-01');
    seedVideo('BP-V-ARC-05', 'BP-MST-ARCHIVED-01', 'BP-Q-ARC-05', VideoProductionStatus.READY_TO_UPLOAD);
    seedPublishing('BP-V-ARC-05');
    let t8Rejected = false;
    let t8ErrorMsg = '';
    try {
      await publishingService.finalizePublishing('BP-V-ARC-05', pubManagerActor);
    } catch (err: any) {
      if (err instanceof ValidationError || err?.name === 'ValidationError') {
        t8Rejected = true;
        t8ErrorMsg = err.message;
      }
    }
    results.push({
      testId: 8,
      name: 'Finalize publishing on ARCHIVED CM rejected with ValidationError',
      status: t8Rejected ? 'PASS' : 'FAIL',
      details: t8Rejected
        ? `Correctly threw ValidationError: "${t8ErrorMsg}".`
        : 'Failed: Publishing finalization was permitted on ARCHIVED Content Master!',
    });

    // -------------------------------------------------------------------------
    // TEST 9: Create assignment on COMPLETED CM -> rejected with ValidationError
    // -------------------------------------------------------------------------
    let t9Rejected = false;
    let t9ErrorMsg = '';
    try {
      await assignmentService.createAssignment(
        {
          entityType: AssignmentEntityType.CONTENT_MASTER,
          entityId: 'BP-MST-COMPLETED-01',
          taskType: AssignmentTaskType.REVIEW,
          assigneeId: editorUser.id,
          priority: PriorityLevel.MEDIUM,
        },
        adminActor
      );
    } catch (err: any) {
      if (err instanceof ValidationError || err?.name === 'ValidationError') {
        t9Rejected = true;
        t9ErrorMsg = err.message;
      }
    }
    results.push({
      testId: 9,
      name: 'Create assignment on COMPLETED CM rejected with ValidationError',
      status: t9Rejected ? 'PASS' : 'FAIL',
      details: t9Rejected
        ? `Correctly threw ValidationError: "${t9ErrorMsg}".`
        : 'Failed: Assignment creation was permitted on COMPLETED Content Master!',
    });

    // -------------------------------------------------------------------------
    // TEST 10: Create assignment on ARCHIVED CM -> rejected with ValidationError
    // -------------------------------------------------------------------------
    let t10Rejected = false;
    let t10ErrorMsg = '';
    try {
      await assignmentService.createAssignment(
        {
          entityType: AssignmentEntityType.CONTENT_MASTER,
          entityId: 'BP-MST-ARCHIVED-01',
          taskType: AssignmentTaskType.REVIEW,
          assigneeId: editorUser.id,
          priority: PriorityLevel.MEDIUM,
        },
        adminActor
      );
    } catch (err: any) {
      if (err instanceof ValidationError || err?.name === 'ValidationError') {
        t10Rejected = true;
        t10ErrorMsg = err.message;
      }
    }
    results.push({
      testId: 10,
      name: 'Create assignment on ARCHIVED CM rejected with ValidationError',
      status: t10Rejected ? 'PASS' : 'FAIL',
      details: t10Rejected
        ? `Correctly threw ValidationError: "${t10ErrorMsg}".`
        : 'Failed: Assignment creation was permitted on ARCHIVED Content Master!',
    });

    // -------------------------------------------------------------------------
    // TEST 11: Verify rejected operations do not mutate target entity
    // -------------------------------------------------------------------------
    // Check v4 (video tested in test 4) status: still EDITING
    const vArc2 = videosMap.get('BP-V-ARC-02');
    // Check vArc4 (publishing tested in test 7) youtube scheduled: undefined
    const pubArc4 = publishingMap.get('BP-V-ARC-04');
    // Check assignment count for COMPLETED CM: 0
    const cmpAssignments = Array.from(assignmentsMap.values()).filter(
      (a) => a.entityId === 'BP-MST-COMPLETED-01'
    );
    // Check assignment count for ARCHIVED CM: 0
    const arcAssignments = Array.from(assignmentsMap.values()).filter(
      (a) => a.entityId === 'BP-MST-ARCHIVED-01'
    );

    const passed11 =
      vArc2?.status === VideoProductionStatus.EDITING &&
      pubArc4?.youtube?.status === SocialPublishStatus.NOT_STARTED &&
      cmpAssignments.length === 0 &&
      arcAssignments.length === 0;

    results.push({
      testId: 11,
      name: 'Rejected operations zero-mutation guarantee: target entities remain untouched',
      status: passed11 ? 'PASS' : 'FAIL',
      details: passed11
        ? 'Verified: Video remained EDITING, publishing record unmutated, zero assignments persisted for terminal CMs.'
        : `Failed: Entity state leaked: videoStatus=${vArc2?.status}, cmpAssignments=${cmpAssignments.length}, arcAssignments=${arcAssignments.length}`,
    });

    // -------------------------------------------------------------------------
    // TEST 12: Verify existing valid non-terminal behavior remains unchanged
    // -------------------------------------------------------------------------
    seedQuestion('BP-Q-ACT-01', 'BP-MST-ACTIVE-01');
    // 12a. Queue video on ACTIVE CM succeeds
    const queued = await videoService.queueVideoForProduction(
      { questionId: 'BP-Q-ACT-01', title: 'Active CM Video' },
      adminActor
    );
    // 12b. Advance video on ACTIVE CM succeeds
    const advanced = await videoService.transitionStatus(
      queued.id,
      VideoProductionStatus.SCRIPT_REQUIRED,
      adminActor
    );
    // 12c. Create assignment on ACTIVE CM succeeds
    const assignment = await assignmentService.createAssignment(
      {
        entityType: AssignmentEntityType.CONTENT_MASTER,
        entityId: 'BP-MST-ACTIVE-01',
        taskType: AssignmentTaskType.REVIEW,
        assigneeId: editorUser.id,
        priority: PriorityLevel.MEDIUM,
      },
      adminActor
    );

    const passed12 =
      queued.status === VideoProductionStatus.QUEUED &&
      advanced.status === VideoProductionStatus.SCRIPT_REQUIRED &&
      assignment.id.startsWith('BP-ASN-');

    results.push({
      testId: 12,
      name: 'Existing valid non-terminal operations remain fully intact on ACTIVE Content Masters',
      status: passed12 ? 'PASS' : 'FAIL',
      details: passed12
        ? `Successfully queued video "${queued.id}", advanced to SCRIPT_REQUIRED, and created assignment "${assignment.id}" on ACTIVE CM.`
        : 'Failed: Normal non-terminal workflows failed on ACTIVE Content Master!',
    });
  } finally {
    // Restore repository methods
    contentMastersRepository.findById = origCMFindById;
    questionsRepository.findById = origQFindById;
    questionsRepository.updateRecord = origQUpdate;
    videosRepository.findById = origVFindById;
    videosRepository.findByQuestionId = origVFindByQuestionId;
    videosRepository.appendRecord = origVAppend;
    videosRepository.updateRecord = origVUpdate;
    publishingRepository.findByVideoId = origPubFindByVideoId;
    publishingRepository.appendRecord = origPubAppend;
    publishingRepository.updateRecord = origPubUpdate;
    assignmentsRepository.findById = origAsnFindById;
    assignmentsRepository.findActiveByEntity = origAsnFindActive;
    assignmentsRepository.appendRecord = origAsnAppend;
    usersRepository.findById = origUserFindById;
    auditLogRepository.logAction = origAuditLog;
  }

  // Print Summary
  const totalChecks = results.length;
  const passedChecks = results.filter((r) => r.status === 'PASS').length;
  const failedChecks = totalChecks - passedChecks;
  const passed = failedChecks === 0;

  console.log('Test Results:');
  console.log('---------------------------------------------------------------');
  results.forEach((r) => {
    const icon = r.status === 'PASS' ? '✅ PASS' : '❌ FAIL';
    console.log(`[${String(r.testId).padStart(2, ' ')}] ${icon} - ${r.name}`);
    console.log(`     Details: ${r.details}\n`);
  });

  console.log('===============================================================');
  console.log(`TOTAL: ${totalChecks} | PASSED: ${passedChecks} | FAILED: ${failedChecks}`);
  console.log(`RESULT: ${passed ? 'ALL PHASE 18 CHECKS PASSED' : 'VERIFICATION FAILED'}`);
  console.log('===============================================================\n');

  return {
    passed,
    totalChecks,
    passedChecks,
    failedChecks,
    results,
  };
}

const isDirectRun = process.argv[1] && (
  import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` ||
  import.meta.url.endsWith('phase18-content-master-guardrails.ts')
);

if (isDirectRun) {
  runPhase18ContentMasterGuardrailsVerification()
    .then((res) => {
      process.exit(res.passed ? 0 : 1);
    })
    .catch((err) => {
      console.error('Fatal test error:', err);
      process.exit(1);
    });
}
