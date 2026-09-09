/**
 * BURRA PARIKSHA CMS - PHASE 13.1 TEST SUITE
 * Publishing Scheduling Foundation Verification
 */

import { publishingService } from '../lib/services/publishing.service';
import { videosRepository } from '../lib/repositories/videos.repository';
import { questionsRepository } from '../lib/repositories/questions.repository';
import { publishingRepository } from '../lib/repositories/publishing.repository';
import { thumbnailsRepository } from '../lib/repositories/thumbnails.repository';
import { pinnedCommentsRepository } from '../lib/repositories/pinned-comments.repository';
import { scriptsRepository } from '../lib/repositories/scripts.repository';
import { socialReviewsRepository } from '../lib/repositories/social-reviews.repository';
import { googleSheetsClient } from '../lib/google-sheets/client';
import { workflowService } from '../lib/services/workflow.service';
import { auditService } from '../lib/services/audit.service';
import { SocialReviewService } from '../lib/services/social-review.service';
import {
  VideoProductionStatus,
  SocialPublishStatus,
  UserRole,
  Video,
  Question,
  Script,
  SocialReviewStatus,
  SocialQualityStatus,
  QuestionStatus,
  QuestionValidationStatus
} from '../types';

export async function runPhase13Step1Verification() {
  // Disable live Google Sheets sync to run deterministically on in-memory store
  googleSheetsClient.isConfigured = () => false;

  console.log('================================================================');
  console.log('BURRA PARIKSHA CMS - PHASE 13.1 VERIFICATION');
  console.log('Publishing Scheduling Foundation Verification');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] Test ${totalTests}: ${testName}`);
      passedTests++;
    } else {
      console.error(`[FAIL] Test ${totalTests}: ${testName} - Detail: ${detail || 'Assertion failed'}`);
      throw new Error(`Phase 13.1 Verification failed on Test ${totalTests}: ${testName} - ${detail || ''}`);
    }
  }

  const adminActor = { id: 'ADM-001', name: 'Admin Test User', role: UserRole.ADMIN };
  const managerActor = { id: 'MGR-001', name: 'Publishing Manager User', role: UserRole.PUBLISHING_MANAGER };
  const unauthorizedActor = { id: 'DES-001', name: 'Designer User', role: UserRole.DESIGNER };

  // Setup helper for a fully ready video matching Gate D
  async function createFullyReadyVideo(videoId: string, questionId: string) {
    const question: Question = {
      id: questionId,
      categoryId: 'CAT-1',
      categoryName: 'Math',
      topicId: 'TOP-1',
      topicName: 'Algebra',
      subtopicId: 'SUB-1',
      subtopicName: 'Equations',
      difficulty: 'MEDIUM',
      questionText: 'Solve 2x + 4 = 10',
      options: { a: 'x = 1', b: 'x = 2', c: 'x = 3', d: 'x = 4' },
      correctAnswer: 'C',
      explanation: '2x = 6 => x = 3',
      status: QuestionStatus.APPROVED,
      videoStatus: VideoProductionStatus.READY_TO_UPLOAD,
      validationStatus: QuestionValidationStatus.VALID,
      authorId: 'AUTH-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await questionsRepository.create(question);

    const video: Video = {
      id: videoId,
      questionId,
      title: `Video Title for ${videoId}`,
      status: VideoProductionStatus.READY_TO_UPLOAD,
      priority: 'MEDIUM' as any,
      finalRenderPath: `gs://renders/${videoId}.mp4`,
      finalRenderWidth: 1080,
      finalRenderHeight: 1920,
      finalRenderAspectRatio: '9:16',
      finalRenderFormat: 'MP4',
      actualDurationSeconds: 45,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await videosRepository.create(video);

    const script: Script = {
      id: `SCR-${videoId}`,
      videoId,
      questionId,
      hookText: 'Learn this quick math trick today!',
      problemStatement: '2x + 4 = 10',
      stepByStepSolution: '2x = 6 => x = 3',
      speedTrickOrTakeaway: 'Subtract 4 then divide by 2',
      callToAction: 'Subscribe for more math tips.',
      currentVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await scriptsRepository.create(script);

    // Get calculated review package bundle fingerprint
    const bundle = await SocialReviewService.getReviewPackageBundle(question.id, question);

    await socialReviewsRepository.create({
      id: `SR-${videoId}`,
      questionId,
      reviewedVersionHash: bundle.currentVersionHash,
      reviewerId: 'MGR-001',
      reviewerName: managerActor.name,
      reviewerRole: managerActor.role,
      decision: SocialReviewStatus.APPROVED,
      overallQualityScoreAtReview: 90,
      qualityStatusAtReview: SocialQualityStatus.EXCELLENT,
      reviewedAt: new Date().toISOString(),
    });

    await thumbnailsRepository.create({
      id: `TH-${videoId}`,
      videoId,
      status: 'APPROVED',
      hookHeadline: 'Quick Math Trick',
      currentVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await pinnedCommentsRepository.create({
      id: `PC-${videoId}`,
      videoId,
      commentText: 'Check out the solution!',
      solutionBreakdown: '2x + 4 = 10 => x = 3',
      isApproved: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    await publishingRepository.create({
      id: `PUB-${videoId}`,
      videoId,
      questionId,
      videoTitle: video.title,
      finalVideoStatus: 'READY',
      youtube: { status: SocialPublishStatus.NOT_STARTED },
      instagram: { status: SocialPublishStatus.NOT_STARTED },
      facebook: { status: SocialPublishStatus.NOT_STARTED },
      pinnedCommentReady: true,
      thumbnailReady: true,
      completedPlatformsCount: 0,
      totalPlatformsCount: 3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return video;
  }

  // --- STAGE 1: Valid Scheduling Operations ---
  console.log('\n--- Stage 1: Valid Platform Scheduling & Timestamp Normalization ---');

  const videoId1 = 'VID-P13-001';
  await createFullyReadyVideo(videoId1, 'Q-P13-001');

  // Test 1: Valid YouTube Future Schedule
  const futureDate1 = new Date(Date.now() + 86400000 * 5).toISOString(); // 5 days in future
  const sched1 = await publishingService.schedulePublishing(videoId1, 'youtube', futureDate1, managerActor);
  assert(
    sched1.youtube.status === SocialPublishStatus.SCHEDULED &&
    sched1.youtube.scheduledAt === futureDate1 &&
    sched1.youtubeScheduledAt === futureDate1,
    'Valid YouTube future schedule succeeds and persists ISO-8601 UTC timestamp'
  );

  // Test 2: Valid Instagram Future Schedule
  const futureDate2 = new Date(Date.now() + 86400000 * 6).toISOString();
  const sched2 = await publishingService.schedulePublishing(videoId1, 'instagram', futureDate2, managerActor);
  assert(
    sched2.instagram.status === SocialPublishStatus.SCHEDULED &&
    sched2.instagram.scheduledAt === futureDate2 &&
    sched2.instagramScheduledAt === futureDate2,
    'Valid Instagram future schedule succeeds'
  );

  // Test 3: Valid Facebook Future Schedule
  const futureDate3 = new Date(Date.now() + 86400000 * 7).toISOString();
  const sched3 = await publishingService.schedulePublishing(videoId1, 'facebook', futureDate3, managerActor);
  assert(
    sched3.facebook.status === SocialPublishStatus.SCHEDULED &&
    sched3.facebook.scheduledAt === futureDate3 &&
    sched3.facebookScheduledAt === futureDate3,
    'Valid Facebook future schedule succeeds'
  );

  // Test 4: Past Timestamp Rejected
  const pastDate = new Date(Date.now() - 3600000).toISOString(); // 1 hour in past
  let errorCaught = false;
  try {
    await publishingService.schedulePublishing(videoId1, 'youtube', pastDate, managerActor);
  } catch (err: any) {
    errorCaught = err?.message?.includes('must be in the future');
  }
  assert(errorCaught, 'Past scheduled timestamp is rejected with clear error');

  // Test 5: Invalid Timestamp Rejected
  errorCaught = false;
  try {
    await publishingService.schedulePublishing(videoId1, 'youtube', 'invalid-date-string', managerActor);
  } catch (err: any) {
    errorCaught = err?.message?.includes('Invalid ISO-8601 timestamp');
  }
  assert(errorCaught, 'Malformed timestamp is rejected');

  // Test 6: Offset Timestamp Normalized to UTC
  const offsetDateInput = '2026-09-10T20:00:00+05:30';
  const expectedUtc = '2026-09-10T14:30:00.000Z';
  const schedOffset = await publishingService.schedulePublishing(videoId1, 'youtube', offsetDateInput, managerActor);
  assert(
    schedOffset.youtube.scheduledAt === expectedUtc &&
    schedOffset.youtubeScheduledAt === expectedUtc,
    'Timestamp with offset (+05:30) is correctly normalized to UTC ISO-8601 string'
  );

  // Test 7: Scheduled Status Persisted in Repository
  const fetchedPub = await publishingRepository.findByVideoId(videoId1);
  assert(
    fetchedPub?.youtube.status === SocialPublishStatus.SCHEDULED &&
    fetchedPub?.youtube.scheduledAt === expectedUtc,
    'Scheduled status and normalized timestamp are persisted in publishing repository'
  );

  // Test 8: Platform-Specific Timestamp Field Persisted
  assert(
    fetchedPub?.youtubeScheduledAt === expectedUtc,
    'Top-level youtubeScheduledAt column is persisted'
  );

  // --- STAGE 2: Idempotency & Rescheduling ---
  console.log('\n--- Stage 2: Idempotency & Rescheduling Controls ---');

  const initialWorkflowCount = (await workflowService.getHistory('PUBLISHING', schedOffset.id)).length;

  // Test 9: Same Schedule Repeated is Idempotent
  const repeatSched = await publishingService.schedulePublishing(videoId1, 'youtube', offsetDateInput, managerActor);
  const postWorkflowCount = (await workflowService.getHistory('PUBLISHING', schedOffset.id)).length;

  assert(
    repeatSched.youtube.scheduledAt === expectedUtc &&
    postWorkflowCount === initialWorkflowCount,
    'Identical repeat scheduling is idempotent and does NOT generate duplicate workflow transitions'
  );

  // Test 10: Changed Future Schedule Updates Timestamp
  const updatedFutureDate = new Date(Date.now() + 86400000 * 12).toISOString();
  const rescheduled = await publishingService.schedulePublishing(videoId1, 'youtube', updatedFutureDate, managerActor);
  assert(
    rescheduled.youtube.scheduledAt === updatedFutureDate &&
    rescheduled.youtubeScheduledAt === updatedFutureDate,
    'Submitting a different future timestamp updates the platform schedule'
  );

  // Test 11: Published Platform Cannot be Scheduled
  await publishingService.markPlatformPublished(videoId1, 'youtube', 'https://youtube.com/shorts/live123', managerActor);
  errorCaught = false;
  try {
    await publishingService.schedulePublishing(videoId1, 'youtube', updatedFutureDate, managerActor);
  } catch (err: any) {
    errorCaught = err?.message?.includes('already PUBLISHED');
  }
  assert(errorCaught, 'Platform already marked as PUBLISHED cannot be scheduled');

  // --- STAGE 3: Gate D Readiness Safety Gates ---
  console.log('\n--- Stage 3: Safety Gates & Authorization ---');

  const videoIdBlocked = 'VID-P13-BLOCKED';
  await createFullyReadyVideo(videoIdBlocked, 'Q-P13-BLOCKED');

  // Test 12: Missing Thumbnail Blocks Scheduling
  await thumbnailsRepository.updateRecord(`TH-${videoIdBlocked}`, { status: 'REJECTED' });

  errorCaught = false;
  try {
    await publishingService.schedulePublishing(videoIdBlocked, 'youtube', futureDate1, managerActor);
  } catch (err: any) {
    errorCaught = err?.message?.includes('Publishing scheduling blocked');
  }
  assert(errorCaught, 'Unapproved thumbnail blocks scheduling via Gate D');

  // Fix thumbnail
  await thumbnailsRepository.updateRecord(`TH-${videoIdBlocked}`, { status: 'APPROVED' });

  // Test 13: Stale Social Review Blocks Scheduling
  await socialReviewsRepository.updateRecord(`SR-${videoIdBlocked}`, { reviewedVersionHash: 'STALE-HASH-123' });

  errorCaught = false;
  try {
    await publishingService.schedulePublishing(videoIdBlocked, 'youtube', futureDate1, managerActor);
  } catch (err: any) {
    errorCaught = err?.message?.includes('Social review is STALE') || err?.message?.includes('Publishing scheduling blocked');
  }
  assert(errorCaught, 'Stale social review blocks scheduling via Gate D');

  // Restore social review hash
  const questionBlocked = await questionsRepository.findById('Q-P13-BLOCKED');
  const bundleBlocked = await SocialReviewService.getReviewPackageBundle('Q-P13-BLOCKED', questionBlocked!);
  await socialReviewsRepository.updateRecord(`SR-${videoIdBlocked}`, { reviewedVersionHash: bundleBlocked.currentVersionHash });

  // Test 14: Unapproved Question Blocks Scheduling
  await questionsRepository.updateRecord('Q-P13-BLOCKED', { status: QuestionStatus.DRAFT });

  errorCaught = false;
  try {
    await publishingService.schedulePublishing(videoIdBlocked, 'youtube', futureDate1, managerActor);
  } catch (err: any) {
    errorCaught = err?.message?.includes('must be APPROVED') || err?.message?.includes('Publishing scheduling blocked');
  }
  assert(errorCaught, 'Unapproved question status blocks scheduling via Gate D');

  // Restore question status
  await questionsRepository.updateRecord('Q-P13-BLOCKED', { status: QuestionStatus.APPROVED });

  // Test 15: Invalid Question Validation Status Blocks Scheduling
  await questionsRepository.updateRecord('Q-P13-BLOCKED', { validationStatus: QuestionValidationStatus.INVALID });

  errorCaught = false;
  try {
    await publishingService.schedulePublishing(videoIdBlocked, 'youtube', futureDate1, managerActor);
  } catch (err: any) {
    errorCaught = err?.message?.includes('must be VALID') || err?.message?.includes('Publishing scheduling blocked');
  }
  assert(errorCaught, 'Invalid question validation status blocks scheduling via Gate D');

  // Restore question validation status
  await questionsRepository.updateRecord('Q-P13-BLOCKED', { validationStatus: QuestionValidationStatus.VALID });

  // Test 16: Unauthorized Actor Rejected
  errorCaught = false;
  try {
    await publishingService.schedulePublishing(videoIdBlocked, 'youtube', futureDate1, unauthorizedActor);
  } catch (err: any) {
    errorCaught = err?.message?.toLowerCase().includes('authorized') || err?.message?.toLowerCase().includes('forbidden') || err?.message?.toLowerCase().includes('permission');
  }
  assert(errorCaught, 'Unauthorized user role (DESIGNER) cannot schedule publishing');

  // --- STAGE 4: System Invariants & State Semantics ---
  console.log('\n--- Stage 4: Invariants, Legacy Compatibility & Semantics ---');

  // Test 17: Old PUBLISHING rows without schedule fields remain readable
  await publishingRepository.create({
    id: 'PUB-LEGACY-001',
    videoId: 'VID-LEGACY-001',
    questionId: 'Q-LEGACY-001',
    videoTitle: 'Legacy Video',
    finalVideoStatus: 'READY',
    youtube: { status: SocialPublishStatus.NOT_STARTED },
    instagram: { status: SocialPublishStatus.NOT_STARTED },
    facebook: { status: SocialPublishStatus.NOT_STARTED },
    pinnedCommentReady: true,
    thumbnailReady: true,
    completedPlatformsCount: 0,
    totalPlatformsCount: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  const readLegacy = await publishingService.getPublishingByVideoId('VID-LEGACY-001');
  assert(
    readLegacy?.id === 'PUB-LEGACY-001' && readLegacy.youtube.scheduledAt === undefined,
    'Legacy publishing records without schedule fields are read without errors'
  );

  // Test 18: No VideoProductionStatus Change Occurs Merely From Scheduling
  const videoIdSemantics = 'VID-P13-SEMANTICS';
  await createFullyReadyVideo(videoIdSemantics, 'Q-P13-SEMANTICS');
  const videoBefore = await videosRepository.findById(videoIdSemantics);
  assert(videoBefore?.status === VideoProductionStatus.READY_TO_UPLOAD, 'Video status before scheduling is READY_TO_UPLOAD');

  await publishingService.schedulePublishing(videoIdSemantics, 'instagram', futureDate1, managerActor);
  const videoAfterSched = await videosRepository.findById(videoIdSemantics);
  assert(
    videoAfterSched?.status === VideoProductionStatus.READY_TO_UPLOAD,
    'Video production status remains READY_TO_UPLOAD after scheduling (does NOT auto-advance to UPLOADED)'
  );

  // Test 19: Existing UPLOADED Semantics Remain Unchanged
  await publishingService.markPlatformPublished(videoIdSemantics, 'instagram', 'https://instagram.com/reel/live456', managerActor);
  const videoAfterPublish = await videosRepository.findById(videoIdSemantics);
  assert(
    videoAfterPublish?.status === VideoProductionStatus.UPLOADED,
    'Video production status advances to UPLOADED when at least one platform is published with a URL'
  );

  // Test 20: Workflow Transition Event Recorded
  const transitions = await workflowService.getHistory('PUBLISHING', `PUB-${videoIdSemantics}`);
  const scheduleTransition = transitions.find((t) => t.toStatus === SocialPublishStatus.SCHEDULED);
  assert(
    !!scheduleTransition && (scheduleTransition.actorName === managerActor.name || scheduleTransition.triggeredBy === managerActor.name),
    'Workflow transition to SCHEDULED was recorded with correct actor'
  );

  // Test 21: Audit Log Event Recorded
  const auditLogs = await auditService.getLogs('PUBLISHING', `PUB-${videoIdSemantics}`);
  const scheduleAudit = auditLogs.find((l) => l.action === 'SCHEDULE_PUBLISHING' || l.action === 'PUBLISHING_SCHEDULED');
  assert(
    !!scheduleAudit && scheduleAudit.actorId === managerActor.id,
    'Audit log for SCHEDULE_PUBLISHING was recorded with actor metadata'
  );

  console.log(`\n================================================================`);
  console.log(`PHASE 13.1 VERIFICATION COMPLETE: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log(`================================================================\n`);
}
