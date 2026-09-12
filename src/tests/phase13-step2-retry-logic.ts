/**
 * BURRA PARIKSHA CMS - Phase 13.2 Test Suite
 * Publishing Failure, Retry & Rescheduling Verification
 */

import { publishingService } from '../lib/services/publishing.service';
import { videosRepository } from '../lib/repositories/videos.repository';
import { publishingRepository } from '../lib/repositories/publishing.repository';
import { questionsRepository } from '../lib/repositories/questions.repository';
import { thumbnailsRepository } from '../lib/repositories/thumbnails.repository';
import { pinnedCommentsRepository } from '../lib/repositories/pinned-comments.repository';
import { socialReviewsRepository } from '../lib/repositories/social-reviews.repository';
import { scriptsRepository } from '../lib/repositories/scripts.repository';
import { SocialReviewService } from '../lib/services/social-review.service';
import { SHEET_SCHEMAS, SHEET_TABS } from '../lib/schemas/google-sheets-schema';
import {
  UserRole,
  SocialPublishStatus,
  VideoProductionStatus,
  CanonicalProductionReadiness,
  QuestionValidationStatus,
  QuestionStatus,
  SocialReviewStatus,
  Video,
  Publishing,
  Question,
  Thumbnail,
  PinnedComment,
} from '../types';
import {
  ValidationError,
  AuthorizationError,
  ReferenceIntegrityError,
} from '../lib/google-sheets/errors';
import { rowToObject, objectToRow } from '../lib/google-sheets/helpers';

async function runPhase13Step2Tests() {
  process.env.GOOGLE_SPREADSHEET_ID = '';
  (publishingRepository as any).client.isConfigured = () => false;
  (videosRepository as any).client.isConfigured = () => false;
  (questionsRepository as any).client.isConfigured = () => false;
  (thumbnailsRepository as any).client.isConfigured = () => false;
  (pinnedCommentsRepository as any).client.isConfigured = () => false;
  (socialReviewsRepository as any).client.isConfigured = () => false;

  console.log('====================================================');
  console.log('BURRA PARIKSHA CMS — PHASE 13.2 TEST SUITE');
  console.log('Publishing Failure, Retry & Rescheduling');
  console.log('====================================================\n');

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

  // Actors
  const adminActor = { id: 'usr-admin-01', name: 'Super Admin', role: UserRole.ADMIN };
  const pubManagerActor = { id: 'usr-pubmgr-01', name: 'Pub Manager', role: UserRole.PUBLISHING_MANAGER };
  const contentMgrActor = { id: 'usr-cntmgr-01', name: 'Content Mgr', role: UserRole.CONTENT_MANAGER };
  const unauthorizedActor = { id: 'usr-editor-01', name: 'Question Editor', role: UserRole.QUESTION_EDITOR };

  const testVideoId = 'vid-test-phase13-2';
  const testPubId = 'pub-test-phase13-2';
  const testQuestionId = 'q-test-132';

  // Setup mock records in repositories
  const mockQuestion: Question = {
    id: testQuestionId,
    contentMasterId: 'cm-test-132',
    categoryId: 'cat-01',
    categoryName: 'Arithmetic',
    topicId: 'top-01',
    topicName: 'Percentages',
    subtopicId: 'sub-01',
    subtopicName: 'Basics',
    difficulty: 'EASY',
    questionText: 'What is Phase 13.2 test question?',
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correctAnswer: 'A',
    explanation: 'Phase 13.2 test explanation',
    validationStatus: QuestionValidationStatus.VALID,
    status: QuestionStatus.APPROVED,
    videoStatus: 'READY_TO_UPLOAD' as any,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockVideo: Video = {
    id: testVideoId,
    contentMasterId: 'cm-test-132',
    questionId: testQuestionId,
    title: 'Phase 13.2 Test Video',
    status: VideoProductionStatus.READY_TO_UPLOAD,
    driveFileId: 'drive-file-123',
    priority: 'HIGH' as any,
    targetDurationSeconds: 45,
    actualDurationSeconds: 42,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockThumbnail: Thumbnail = {
    id: 'thumb-test-132',
    videoId: testVideoId,
    hookHeadline: 'Test Hook Headline',
    currentVersion: 1,
    status: 'APPROVED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockPinnedComment: PinnedComment = {
    id: 'pin-test-132',
    videoId: testVideoId,
    commentText: 'Pinned comment text for Phase 13.2 test',
    solutionBreakdown: 'Solution breakdown for test',
    isApproved: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockPublishing: Publishing = {
    id: testPubId,
    videoId: testVideoId,
    videoTitle: 'Phase 13.2 Test Video',
    questionId: testQuestionId,
    finalVideoStatus: 'READY',
    youtube: { status: SocialPublishStatus.DRAFT, retryCount: 0 },
    instagram: { status: SocialPublishStatus.DRAFT, retryCount: 0 },
    facebook: { status: SocialPublishStatus.NOT_STARTED, retryCount: 0 },
    pinnedCommentReady: true,
    thumbnailReady: true,
    completedPlatformsCount: 0,
    totalPlatformsCount: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    // Stub SocialReviewService.getReviewPackageBundle for fast deterministic testing without AI/network latency
    const originalGetReviewPackageBundle = SocialReviewService.getReviewPackageBundle;
    SocialReviewService.getReviewPackageBundle = async (qId: string, overrideQ?: any) => {
      if (qId === 'vid-not-ready-132' || qId === 'q-not-ready-132') {
        return {
          question: overrideQ || mockQuestion,
          currentReviewStatus: SocialReviewStatus.APPROVED,
          currentVersionHash: 'hash-test-132',
          latestReviewRecord: {
            reviewedVersionHash: 'hash-test-132',
            decision: SocialReviewStatus.APPROVED,
          },
          blockers: [],
          multiPlatformAdaptations: { isAllValid: true },
          qualityAssessment: { blockingFindings: [], status: 'APPROVED' },
        } as any;
      }
      return {
        question: overrideQ || mockQuestion,
        currentReviewStatus: SocialReviewStatus.APPROVED,
        currentVersionHash: 'hash-test-132',
        latestReviewRecord: {
          reviewedVersionHash: 'hash-test-132',
          decision: SocialReviewStatus.APPROVED,
        },
        blockers: [],
        multiPlatformAdaptations: { isAllValid: true },
        qualityAssessment: { blockingFindings: [], status: 'APPROVED' },
      } as any;
    };

    // 0. Seed test records into repositories
    await questionsRepository.create(mockQuestion);
    await thumbnailsRepository.create(mockThumbnail);
    await pinnedCommentsRepository.create(mockPinnedComment);
    await videosRepository.create(mockVideo);
    await publishingRepository.create(mockPublishing);
    await scriptsRepository.create({
      id: `SCR-${testVideoId}`,
      videoId: testVideoId,
      questionId: testQuestionId,
      hookText: 'Test hook text',
      problemStatement: 'Test problem',
      stepByStepSolution: 'Test solution',
      currentVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any);

    console.log('--- 1. MARK PLATFORM FAILED TESTS ---');

    // Test 1: markPlatformFailed successfully updates platform status, reason, failedAt, retryCount
    try {
      const updated = await publishingService.markPlatformFailed(
        testVideoId,
        'youtube',
        'Upload API returned 500 Internal Server Error',
        adminActor
      );

      assert(
        updated.youtube?.status === SocialPublishStatus.FAILED &&
          updated.youtube?.lastFailureReason === 'Upload API returned 500 Internal Server Error' &&
          typeof updated.youtube?.failedAt === 'string' &&
          updated.youtube?.retryCount === 0,
        'Test 1: markPlatformFailed correctly sets FAILED status, failure reason, failedAt timestamp, and preserves retryCount'
      );
    } catch (err: any) {
      assert(false, 'Test 1: markPlatformFailed failed with unexpected error', err.message);
    }

    // Test 2: markPlatformFailed rejects empty/blank failure reason
    try {
      await publishingService.markPlatformFailed(testVideoId, 'youtube', '   ', adminActor);
      assert(false, 'Test 2: markPlatformFailed should reject empty failure reason');
    } catch (err: any) {
      assert(
        err instanceof ValidationError && err.message.includes('non-empty failure reason'),
        'Test 2: markPlatformFailed correctly throws ValidationError for empty failure reason'
      );
    }

    // Test 3: markPlatformFailed rejects invalid platform string
    try {
      await publishingService.markPlatformFailed(testVideoId, 'tiktok' as any, 'Failed', adminActor);
      assert(false, 'Test 3: markPlatformFailed should reject unsupported platform');
    } catch (err: any) {
      assert(
        err instanceof ValidationError && err.message.includes('Invalid publishing platform'),
        'Test 3: markPlatformFailed correctly throws ValidationError for invalid platform'
      );
    }

    // Test 4: markPlatformFailed rejects non-existent videoId
    try {
      await publishingService.markPlatformFailed('vid-nonexistent-999', 'youtube', 'Failed', adminActor);
      assert(false, 'Test 4: markPlatformFailed should reject non-existent videoId');
    } catch (err: any) {
      assert(
        err instanceof ReferenceIntegrityError || err.message.includes('not found'),
        'Test 4: markPlatformFailed correctly throws ReferenceIntegrityError for missing videoId'
      );
    }

    // Test 5: markPlatformFailed rejects marking an already PUBLISHED platform as FAILED
    try {
      // First mark instagram as published
      await publishingService.markPlatformPublished(
        testVideoId,
        'instagram',
        'https://instagram.com/reel/test132',
        adminActor,
        undefined,
        { skipReadinessCheck: true, forceRePublish: true }
      );

      await publishingService.markPlatformFailed(testVideoId, 'instagram', 'Network error', adminActor);
      assert(false, 'Test 5: markPlatformFailed should reject marking PUBLISHED platform as FAILED');
    } catch (err: any) {
      assert(
        err instanceof ValidationError && err.message.includes('already PUBLISHED'),
        'Test 5: markPlatformFailed correctly throws ValidationError when platform is already PUBLISHED'
      );
    }

    // Test 6: Idempotent failure handling (same failure reason on FAILED platform returns existing record)
    try {
      const failReason = 'Upload API returned 500 Internal Server Error';
      const firstFail = await publishingService.getPublishingByVideoId(testVideoId);
      const secondFail = await publishingService.markPlatformFailed(testVideoId, 'youtube', failReason, adminActor);

      assert(
        secondFail.youtube?.status === SocialPublishStatus.FAILED &&
          secondFail.youtube?.lastFailureReason === failReason &&
          secondFail.youtube?.failedAt === firstFail?.youtube?.failedAt,
        'Test 6: Idempotent failure call returns unchanged record without duplicate mutation'
      );
    } catch (err: any) {
      assert(false, 'Test 6: Idempotent failure handling failed', err.message);
    }

    console.log('\n--- 2. RETRY PUBLISHING TESTS ---');

    // Test 7: retryPublishing transitions FAILED -> DRAFT and increments retryCount from 0 to 1
    try {
      const retried = await publishingService.retryPublishing(testVideoId, 'youtube', undefined, adminActor);

      assert(
        retried.youtube?.status === SocialPublishStatus.DRAFT &&
          retried.youtube?.retryCount === 1 &&
          retried.youtube?.lastFailureReason === 'Upload API returned 500 Internal Server Error',
        'Test 7: retryPublishing transitions FAILED -> DRAFT, increments retryCount to 1, and preserves historical failure reason'
      );
    } catch (err: any) {
      assert(false, 'Test 7: retryPublishing FAILED -> DRAFT failed', err.message);
    }

    // Test 8: retryPublishing with valid future scheduledAt transitions FAILED/DRAFT -> SCHEDULED
    // First mark youtube as failed again to simulate second failure
    await publishingService.markPlatformFailed(testVideoId, 'youtube', 'Second attempt timed out', adminActor);

    const futureDate = new Date(Date.now() + 86400000).toISOString(); // +24 hours
    try {
      const scheduledRetry = await publishingService.retryPublishing(
        testVideoId,
        'youtube',
        { scheduledAt: futureDate, remarks: 'Rescheduled for tomorrow morning' },
        pubManagerActor
      );

      assert(
        scheduledRetry.youtube?.status === SocialPublishStatus.SCHEDULED &&
          scheduledRetry.youtube?.scheduledAt === futureDate &&
          scheduledRetry.youtube?.retryCount === 2,
        'Test 8: retryPublishing with valid future scheduledAt transitions to SCHEDULED and increments retryCount to 2'
      );
    } catch (err: any) {
      assert(false, 'Test 8: retryPublishing FAILED -> SCHEDULED failed', err.message);
    }

    // Test 9: retryPublishing rejects past scheduledAt timestamp
    await publishingService.markPlatformFailed(testVideoId, 'youtube', 'Third attempt network break', adminActor);
    const pastDate = new Date(Date.now() - 3600000).toISOString(); // -1 hour
    try {
      await publishingService.retryPublishing(
        testVideoId,
        'youtube',
        { scheduledAt: pastDate },
        adminActor
      );
      assert(false, 'Test 9: retryPublishing should reject past scheduledAt timestamp');
    } catch (err: any) {
      assert(
        err instanceof ValidationError && err.message.includes('must be in the future'),
        'Test 9: retryPublishing correctly throws ValidationError for past scheduling time'
      );
    }

    // Test 10: retryPublishing rejects invalid/malformed scheduledAt string
    try {
      await publishingService.retryPublishing(
        testVideoId,
        'youtube',
        { scheduledAt: 'not-a-valid-date' },
        adminActor
      );
      assert(false, 'Test 10: retryPublishing should reject malformed date string');
    } catch (err: any) {
      assert(
        err instanceof ValidationError && err.message.includes('Invalid ISO-8601 timestamp'),
        'Test 10: retryPublishing correctly throws ValidationError for malformed timestamp'
      );
    }

    // Test 11: retryPublishing rejects retrying an already PUBLISHED platform
    try {
      await publishingService.retryPublishing(testVideoId, 'instagram', undefined, adminActor);
      assert(false, 'Test 11: retryPublishing should reject retrying PUBLISHED platform');
    } catch (err: any) {
      assert(
        err instanceof ValidationError && err.message.includes('already PUBLISHED'),
        'Test 11: retryPublishing correctly throws ValidationError when platform is already PUBLISHED'
      );
    }

    // Test 12: Idempotent retry handling (retry when already in target state)
    try {
      // First retry to DRAFT
      const firstRetry = await publishingService.retryPublishing(testVideoId, 'youtube', undefined, adminActor);
      const retryCountBefore = firstRetry.youtube?.retryCount;

      // Second retry to DRAFT with same options
      const secondRetry = await publishingService.retryPublishing(testVideoId, 'youtube', undefined, adminActor);

      assert(
        secondRetry.youtube?.status === SocialPublishStatus.DRAFT &&
          secondRetry.youtube?.retryCount === retryCountBefore,
        'Test 12: Idempotent retry call returns existing record without duplicate retry increment'
      );
    } catch (err: any) {
      assert(false, 'Test 12: Idempotent retry handling failed', err.message);
    }

    console.log('\n--- 3. UNRESTRICTED RETRY POLICY & INTEGRITY TESTS ---');

    // Test 13: High retry count test (e.g. retryCount = 10, confirming NO maximum retry cap policy)
    try {
      let currentPub = await publishingService.getPublishingByVideoId(testVideoId);
      // Simulate multiple failure/retry cycles
      for (let i = 0; i < 5; i++) {
        await publishingService.markPlatformFailed(testVideoId, 'facebook', `Failure iteration ${i + 1}`, adminActor);
        currentPub = await publishingService.retryPublishing(testVideoId, 'facebook', undefined, adminActor);
      }

      assert(
        currentPub?.facebook?.status === SocialPublishStatus.DRAFT &&
          (currentPub?.facebook?.retryCount || 0) >= 5,
        `Test 13: High retry count (${currentPub?.facebook?.retryCount}) succeeded with NO maximum retry limit enforcement`
      );
    } catch (err: any) {
      assert(false, 'Test 13: High retry count test failed', err.message);
    }

    // Test 14: State dimension isolation (VideoProductionStatus remains isolated from publish failures & retries)
    const currentVideo = await videosRepository.findById(testVideoId);
    assert(
      currentVideo?.status === VideoProductionStatus.UPLOADED ||
        currentVideo?.status === VideoProductionStatus.READY_TO_UPLOAD,
      'Test 14: VideoProductionStatus remains isolated (UPLOADED / READY_TO_UPLOAD) after publish failure and retry cycles'
    );

    // Test 15: Multi-platform independence (retrying facebook does not affect youtube or instagram)
    const latestPub = await publishingService.getPublishingByVideoId(testVideoId);
    assert(
      latestPub?.instagram?.status === SocialPublishStatus.PUBLISHED &&
        latestPub?.youtube?.status === SocialPublishStatus.DRAFT,
      'Test 15: Multi-platform state isolation preserved across platform-specific failure and retry operations'
    );

    console.log('\n--- 4. RBAC & SECURITY CONSTRAINT TESTS ---');

    // Test 16: Unauthorized role rejected for markPlatformFailed
    try {
      await publishingService.markPlatformFailed(testVideoId, 'facebook', 'Failure', unauthorizedActor);
      assert(false, 'Test 16: Unauthorized role should be rejected for markPlatformFailed');
    } catch (err: any) {
      assert(
        err instanceof AuthorizationError,
        'Test 16: Unauthorized role correctly throws AuthorizationError for markPlatformFailed'
      );
    }

    // Test 17: Unauthorized role rejected for retryPublishing
    try {
      await publishingService.retryPublishing(testVideoId, 'facebook', undefined, unauthorizedActor);
      assert(false, 'Test 17: Unauthorized role should be rejected for retryPublishing');
    } catch (err: any) {
      assert(
        err instanceof AuthorizationError,
        'Test 17: Unauthorized role correctly throws AuthorizationError for retryPublishing'
      );
    }

    // Test 18: Authorized roles (ADMIN, CONTENT_MANAGER, PUBLISHING_MANAGER) permitted
    try {
      await publishingService.markPlatformFailed(testVideoId, 'facebook', 'Manager test fail', contentMgrActor);
      const res1 = await publishingService.retryPublishing(testVideoId, 'facebook', undefined, contentMgrActor);
      assert(
        res1.facebook?.status === SocialPublishStatus.DRAFT,
        'Test 18: Authorized role CONTENT_MANAGER successfully executes failure and retry operations'
      );
    } catch (err: any) {
      assert(false, 'Test 18: Authorized role CONTENT_MANAGER failed', err.message);
    }

    console.log('\n--- 5. SPREADSHEET SCHEMA & SERIALIZATION TESTS ---');

    // Test 19: rowToObject and objectToRow correctly map failure reason, failedAt, and retryCount columns
    const pubSchema = SHEET_SCHEMAS[SHEET_TABS.PUBLISHING];
    const pubHeaders = pubSchema.columns.map((c) => c.name);

    const mockRowArray = pubHeaders.map((colName) => {
      if (colName === 'publishing_id') return 'pub-sheet-test';
      if (colName === 'video_id') return 'vid-sheet-test';
      if (colName === 'content_master_id') return 'cm-sheet-test';
      if (colName === 'question_id') return 'q-sheet-test';
      if (colName === 'video_title') return 'Test Video';
      if (colName === 'final_video_status') return 'READY';
      if (colName === 'youtube_status') return 'FAILED';
      if (colName === 'youtube_last_failure_reason') return 'Quota exceeded for YouTube Data API v3';
      if (colName === 'youtube_failed_at') return '2026-09-06T12:00:00.000Z';
      if (colName === 'youtube_retry_count') return 3;
      if (colName === 'instagram_status') return 'DRAFT';
      if (colName === 'facebook_status') return 'NOT_STARTED';
      if (colName === 'completed_platforms_count') return 0;
      if (colName === 'total_platforms_count') return 3;
      if (colName === 'created_at') return '2026-09-06T12:00:00.000Z';
      if (colName === 'updated_at') return '2026-09-06T12:00:00.000Z';
      return '';
    });

    const deserializedPub = rowToObject<Publishing>(mockRowArray, pubHeaders, pubSchema);
    assert(
      deserializedPub.youtube?.status === SocialPublishStatus.FAILED &&
        deserializedPub.youtube?.lastFailureReason === 'Quota exceeded for YouTube Data API v3' &&
        deserializedPub.youtube?.failedAt === '2026-09-06T12:00:00.000Z' &&
        deserializedPub.youtube?.retryCount === 3,
      'Test 19: rowToObject correctly deserializes _last_failure_reason, _failed_at, and _retry_count columns'
    );

    // Test 20: objectToRow correctly serializes failure fields back into sheet row representation
    const serializedRowArray = objectToRow(deserializedPub as any, pubHeaders, pubSchema);
    const ytReasonIdx = pubHeaders.indexOf('youtube_last_failure_reason');
    const ytFailedAtIdx = pubHeaders.indexOf('youtube_failed_at');
    const ytRetryCountIdx = pubHeaders.indexOf('youtube_retry_count');

    assert(
      serializedRowArray[ytReasonIdx] === 'Quota exceeded for YouTube Data API v3' &&
        serializedRowArray[ytFailedAtIdx] === '2026-09-06T12:00:00.000Z' &&
        serializedRowArray[ytRetryCountIdx] === 3,
      'Test 20: objectToRow correctly serializes failure fields into spreadsheet column keys'
    );

    // Test 21: Gate D readiness check in retryPublishing blocks retry if video loses readiness
    try {
      // Temporarily set video status to EDITING (failing Gate D readiness)
      await videosRepository.create({
        ...mockVideo,
        id: 'vid-not-ready-132',
        status: VideoProductionStatus.EDITING,
      });
      await publishingRepository.create({
        ...mockPublishing,
        id: 'pub-not-ready-132',
        videoId: 'vid-not-ready-132',
        youtube: { status: SocialPublishStatus.FAILED, retryCount: 1, lastFailureReason: 'Draft failed' },
      });

      await publishingService.retryPublishing('vid-not-ready-132', 'youtube', undefined, adminActor);
      assert(false, 'Test 21: retryPublishing should be blocked by Gate D when video is not READY_TO_PUBLISH');
    } catch (err: any) {
      assert(
        err instanceof ValidationError && err.message.includes('Missing mandatory requirements'),
        'Test 21: retryPublishing correctly enforced Gate D prerequisite checks and blocked unready video'
      );
    }

    // Test 22: Failure reason length constraint (> 1000 chars rejected)
    try {
      const longReason = 'A'.repeat(1005);
      await publishingService.markPlatformFailed(testVideoId, 'facebook', longReason, adminActor);
      assert(false, 'Test 22: markPlatformFailed should reject failure reasons longer than 1000 characters');
    } catch (err: any) {
      assert(
        err instanceof ValidationError && err.message.includes('maximum allowable length'),
        'Test 22: markPlatformFailed correctly rejected over-length failure reason'
      );
    }

  } catch (globalErr: any) {
    console.error('Global Error in Phase 13.2 Test Suite:', globalErr);
  } finally {
    // Clean up mock records
    try {
      await videosRepository.deleteRecord(testVideoId);
      await publishingRepository.deleteRecord(testPubId);
      await questionsRepository.deleteRecord(testQuestionId);
      await thumbnailsRepository.deleteRecord('thumb-test-132');
      await pinnedCommentsRepository.deleteRecord('pin-test-132');
      await videosRepository.deleteRecord('vid-not-ready-132');
      await publishingRepository.deleteRecord('pub-not-ready-132');
    } catch (cleanupErr) {
      // ignore
    }

    console.log('\n====================================================');
    console.log(`PHASE 13.2 TEST SUITE SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
    console.log('====================================================');

    if (failedTests > 0) {
      process.exit(1);
    }
  }
}

runPhase13Step2Tests().catch((err) => {
  console.error('Fatal error running Phase 13.2 test suite:', err);
  process.exit(1);
});
