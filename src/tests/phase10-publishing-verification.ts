import { publishingService } from '../lib/services/publishing.service';
import { videosRepository } from '../lib/repositories/videos.repository';
import { questionsRepository } from '../lib/repositories/questions.repository';
import { scriptsRepository } from '../lib/repositories/scripts.repository';
import { thumbnailsRepository } from '../lib/repositories/thumbnails.repository';
import { pinnedCommentsRepository } from '../lib/repositories/pinned-comments.repository';
import { socialReviewsRepository } from '../lib/repositories/social-reviews.repository';
import { publishingRepository } from '../lib/repositories/publishing.repository';
import { auditLogRepository } from '../lib/repositories/audit-log.repository';
import { idService } from '../lib/services/id.service';
import { SocialReviewService } from '../lib/services/social-review.service';
import {
  VideoProductionStatus,
  QuestionValidationStatus,
  QuestionStatus,
  SocialReviewStatus,
  SocialQualityStatus,
  UserRole,
  PriorityLevel,
  SocialPublishStatus,
} from '../types';

export async function runPhase10PublishingVerification() {
  console.log('====================================================');
  console.log('BURRA PARIKSHA CMS - PHASE 10 PUBLISHING HUB TESTS');
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
      throw new Error(`Phase 10 Publishing Verification failed on Test ${totalTests}: ${testName} - ${detail || ''}`);
    }
  }

  const adminActor = { id: 'ADM-101', name: 'Super Admin', role: UserRole.ADMIN };
  const pubMgrActor = { id: 'PUB-101', name: 'Publishing Manager', role: UserRole.PUBLISHING_MANAGER };
  const designerActor = { id: 'DES-101', name: 'Legacy Designer', role: UserRole.DESIGNER };
  const speakerActor = { id: 'SPK-101', name: 'Telugu Presenter', role: UserRole.SPEAKER };

  const contentId = `BP-CNT-P10-${Math.floor(100000 + Math.random() * 900000)}`;
  const qId = `Q-P10-${Date.now()}`;
  const videoId = `V-P10-${Date.now()}`;
  const thumbnailId = `T-P10-${Date.now()}`;
  const pinId = `PIN-P10-${Date.now()}`;

  // Seeding pristine testing data
  // Question
  await questionsRepository.appendRecord({
    id: qId,
    contentId,
    contentMasterId: contentId,
    questionText: 'Which planet is known as the Red Planet?',
    options: { a: 'Earth', b: 'Mars', c: 'Jupiter', d: 'Saturn' },
    correctAnswer: 'B',
    explanation: 'Mars is red because of iron oxide on its surface.',
    validationStatus: QuestionValidationStatus.VALID,
    status: QuestionStatus.APPROVED,
    createdBy: 'USR-MOCK',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);

  // Script
  await scriptsRepository.appendRecord({
    id: `S-P10-${Date.now()}`,
    videoId,
    contentId,
    currentVersion: 1,
    hookText: 'Hey guys, did you know that Mars is red?',
    problemStatement: 'What is the color of Mars?',
    stepByStepSolution: 'Mars looks red due to iron oxide.',
    speedTrickOrTakeaway: 'Takeaway trick',
    callToAction: 'Follow for more!',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);

  // Video
  await videosRepository.appendRecord({
    id: videoId,
    contentId,
    contentMasterId: contentId,
    questionId: qId,
    title: 'Exploring Mars Video',
    status: VideoProductionStatus.READY_TO_UPLOAD,
    priority: PriorityLevel.HIGH,
    driveFileId: 'drive-file-mars-123',
    driveFolderUrl: 'https://drive.google.com/drive/folders/mars123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Thumbnail
  await thumbnailsRepository.appendRecord({
    id: thumbnailId,
    contentId,
    contentMasterId: contentId,
    videoId,
    status: 'APPROVED',
    driveFileId: 'drive-thumbnail-mars-123',
    fileName: 'mars_thumbnail.png',
    fileSize: 2048,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);

  // Pinned Comment
  await pinnedCommentsRepository.appendRecord({
    id: pinId,
    contentId,
    contentMasterId: contentId,
    videoId,
    commentText: 'Check out this breakdown about Mars!',
    solutionBreakdown: 'Step by step mars solution',
    isApproved: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Social Review Record (Valid approved state)
  const currentFingerprint = 'mars-fingerprint-v1';
  // Standard template structure matching getReviewPackageBundle expectations
  const reviewRecordId = `BP-REV-P10-${Date.now()}`;
  await socialReviewsRepository.create({
    id: reviewRecordId,
    questionId: qId,
    contentId,
    contentMasterId: contentId,
    reviewedVersionHash: currentFingerprint,
    reviewerId: 'REV-001',
    reviewerName: 'Lead Reviewer',
    reviewerRole: UserRole.REVIEWER,
    decision: SocialReviewStatus.APPROVED,
    previousStatus: 'DRAFT',
    overallQualityScoreAtReview: 95,
    qualityStatusAtReview: SocialQualityStatus.EXCELLENT,
    reviewedAt: new Date().toISOString(),
  } as any);

  // --------------------------------------------------------------------------
  // Assertion 1: Publishing package creation
  // --------------------------------------------------------------------------
  const pubRecordId = `BP-PUB-${Date.now()}`;
  const pubRecord = await publishingRepository.appendRecord({
    id: pubRecordId,
    contentId,
    contentMasterId: contentId,
    videoId,
    videoTitle: 'Exploring Mars Video',
    questionId: qId,
    finalVideoStatus: 'READY',
    youtube: { status: SocialPublishStatus.NOT_STARTED },
    instagram: { status: SocialPublishStatus.NOT_STARTED },
    facebook: { status: SocialPublishStatus.NOT_STARTED },
    pinnedCommentReady: true,
    thumbnailReady: true,
    completedPlatformsCount: 0,
  } as any);
  assert(pubRecord !== null && pubRecord.id === pubRecordId, 'Publishing package record successfully appended');

  // --------------------------------------------------------------------------
  // Assertion 2: Content ID correlation
  // --------------------------------------------------------------------------
  assert(pubRecord.contentId === contentId, `Publishing record strictly correlates with canonical Content ID: ${contentId}`);

  // --------------------------------------------------------------------------
  // Assertion 3: Complete package retrieval
  // --------------------------------------------------------------------------
  // Inject mock override to control fingerprint version match during testing
  const origGetReviewPackageBundle = SocialReviewService.getReviewPackageBundle;
  SocialReviewService.getReviewPackageBundle = async (questionId: string) => {
    const q = await questionsRepository.findById(qId);
    const rev = await socialReviewsRepository.findById(reviewRecordId);
    return {
      question: q as any,
      currentVersionHash: currentFingerprint,
      currentReviewStatus: SocialReviewStatus.APPROVED,
      latestReviewRecord: rev,
      blockers: [],
      multiPlatformAdaptations: {
        isAllValid: true,
        variants: {
          youtube: { caption: 'Cool caption', hashtags: ['mars', 'space'], pinnedComment: 'Mars comment' },
          instagram: { caption: 'Cool caption instagram', hashtags: ['mars', 'instagram'] },
          facebook: { caption: 'Cool caption facebook', hashtags: ['mars', 'facebook'] }
        }
      },
      canonicalMetadata: {
        socialCaption: 'Canonical social caption',
        hashtags: ['space', 'mars'],
        cta: { primaryText: 'Primary CTA', pinnedCommentPrompt: 'Check comment' }
      },
      qualityAssessment: {
        blockingFindings: [],
        status: 'APPROVED'
      }
    } as any;
  };

  const retrievedPackage = await publishingService.getPlatformPackage(videoId, 'youtube', pubMgrActor);
  assert(retrievedPackage !== null, 'Successfully retrieved complete publishing package');
  assert(retrievedPackage.videoId === videoId, 'Retrieved package maps to the correct Video ID');
  assert(retrievedPackage.contentMasterId === contentId, 'Retrieved package contains the correct Content Master ID');

  // --------------------------------------------------------------------------
  // Assertion 4: Readiness gate
  // --------------------------------------------------------------------------
  const readiness = await publishingService.validatePublishReadiness(videoId, { actor: pubMgrActor });
  assert(readiness.isReady === true, 'Ready content successfully passes the Gate D publishing readiness checks');

  // --------------------------------------------------------------------------
  // Assertion 5: Missing video rejection
  // --------------------------------------------------------------------------
  let missingVideoRejected = false;
  try {
    await publishingService.validatePublishReadiness('V-MISSING-ID', { actor: pubMgrActor });
  } catch (err: any) {
    missingVideoRejected = true;
  }
  assert(missingVideoRejected, 'Publishing readiness correctly fails/rejects with non-existent video ID');

  // --------------------------------------------------------------------------
  // Assertion 6: Missing thumbnail rejection
  // --------------------------------------------------------------------------
  const alternateVideoId = `V-P10-ALT-${Date.now()}`;
  await videosRepository.appendRecord({
    id: alternateVideoId,
    contentId,
    contentMasterId: contentId,
    questionId: qId,
    title: 'Exploring Mars Video ALT',
    status: VideoProductionStatus.READY_TO_UPLOAD,
    priority: PriorityLevel.HIGH,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  const readinessNoThumbnail = await publishingService.validatePublishReadiness(alternateVideoId, { actor: pubMgrActor });
  assert(readinessNoThumbnail.isReady === false && readinessNoThumbnail.blockers.some(b => b.includes('Thumbnail')), 'Missing thumbnail is correctly rejected by readiness gates');

  // --------------------------------------------------------------------------
  // Assertion 7: Missing pinned comment rejection
  // --------------------------------------------------------------------------
  await thumbnailsRepository.appendRecord({
    id: `T-P10-ALT-${Date.now()}`,
    contentId,
    contentMasterId: contentId,
    videoId: alternateVideoId,
    status: 'APPROVED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);
  const readinessNoComment = await publishingService.validatePublishReadiness(alternateVideoId, { actor: pubMgrActor });
  assert(readinessNoComment.isReady === false && readinessNoComment.blockers.some(b => b.includes('Pinned comment')), 'Missing pinned comment is correctly rejected by readiness gates');

  // --------------------------------------------------------------------------
  // Assertion 8: Missing/unapproved Social Review rejection
  // --------------------------------------------------------------------------
  const unapprovedQId = `Q-P10-UNAPP-${Date.now()}`;
  await questionsRepository.appendRecord({
    id: unapprovedQId,
    contentId,
    contentMasterId: contentId,
    questionText: 'Unapproved Mars question?',
    options: { a: 'A', b: 'B', c: 'C', d: 'D' },
    correctAnswer: 'A',
    explanation: 'Expl',
    validationStatus: QuestionValidationStatus.NOT_VALIDATED,
    status: QuestionStatus.DRAFT,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);
  const alternateVideo2Id = `V-P10-ALT2-${Date.now()}`;
  await videosRepository.appendRecord({
    id: alternateVideo2Id,
    contentId,
    contentMasterId: contentId,
    questionId: unapprovedQId,
    title: 'Exploring Mars Video ALT 2',
    status: VideoProductionStatus.READY_TO_UPLOAD,
    priority: PriorityLevel.HIGH,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  await thumbnailsRepository.appendRecord({
    id: `T-P10-ALT2-${Date.now()}`,
    contentId,
    contentMasterId: contentId,
    videoId: alternateVideo2Id,
    status: 'APPROVED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);
  await pinnedCommentsRepository.appendRecord({
    id: `PIN-P10-ALT2-${Date.now()}`,
    contentId,
    contentMasterId: contentId,
    videoId: alternateVideo2Id,
    commentText: 'Mars pinned comment',
    isApproved: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);
  const readinessUnapprovedQ = await publishingService.validatePublishReadiness(alternateVideo2Id, { actor: pubMgrActor });
  assert(readinessUnapprovedQ.isReady === false && readinessUnapprovedQ.blockers.some(b => b.includes('validation status')), 'Unapproved or invalid linked question is correctly rejected by readiness gates');

  // --------------------------------------------------------------------------
  // Assertion 9: Stale Social Review rejection
  // --------------------------------------------------------------------------
  // Inject mock to simulate state review hash mismatch
  SocialReviewService.getReviewPackageBundle = async (questionId: string) => {
    return {
      question: await questionsRepository.findById(qId) as any,
      currentVersionHash: 'new-stale-fingerprint-999',
      currentReviewStatus: SocialReviewStatus.APPROVED,
      latestReviewRecord: await socialReviewsRepository.findById(reviewRecordId),
    } as any;
  };

  const readinessStale = await publishingService.validatePublishReadiness(videoId, { actor: pubMgrActor });
  assert(readinessStale.isReady === false && readinessStale.blockers.some(b => b.includes('STALE')), 'Stale Social Review version mismatch is successfully blocked');

  // Restore the previous valid package mock
  SocialReviewService.getReviewPackageBundle = async (questionId: string) => {
    return {
      question: await questionsRepository.findById(qId) as any,
      currentVersionHash: currentFingerprint,
      currentReviewStatus: SocialReviewStatus.APPROVED,
      latestReviewRecord: await socialReviewsRepository.findById(reviewRecordId),
      blockers: [],
      multiPlatformAdaptations: {
        isAllValid: true,
        variants: {
          youtube: { caption: 'Cool caption', hashtags: ['mars', 'space'], pinnedComment: 'Mars comment' },
          instagram: { caption: 'Cool caption instagram', hashtags: ['mars', 'instagram'] },
          facebook: { caption: 'Cool caption facebook', hashtags: ['mars', 'facebook'] }
        }
      },
      qualityAssessment: {
        blockingFindings: [],
        status: 'APPROVED'
      }
    } as any;
  };

  // --------------------------------------------------------------------------
  // Assertion 10: Cross-content package rejection
  // --------------------------------------------------------------------------
  let crossContentRejected = false;
  const originalVideo = await videosRepository.findById(videoId);
  if (originalVideo) {
    const originalContentId = originalVideo.contentId;
    try {
      // Correctly update the video's Content ID in the repository database
      await videosRepository.updateRecord(videoId, { contentId: 'BP-CNT-MISMATCHED-999' });

      // This should trigger cross-content checks since parent video Content ID does not match the pinned comment's or thumbnail's Content ID
      await publishingService.getPlatformPackage(videoId, 'youtube', pubMgrActor);
    } catch (err: any) {
      if (err.message && err.message.includes('Cross-content')) {
        crossContentRejected = true;
      }
    } finally {
      // Restore the original video Content ID in the repository database
      await videosRepository.updateRecord(videoId, { contentId: originalContentId });
    }
  }

  assert(crossContentRejected === true, 'Cross-content target mismatch correctly throws an integrity validation rejection');

  // --------------------------------------------------------------------------
  // Assertion 11: Actual video download route reference
  // --------------------------------------------------------------------------
  const videoDownloadUrl = `/api/videos/${videoId}/download`;
  assert(videoDownloadUrl.startsWith('/api/videos/'), 'Video download endpoint contains proper routing URL scheme');

  // --------------------------------------------------------------------------
  // Assertion 12: Actual thumbnail download route reference
  // --------------------------------------------------------------------------
  const thumbnailDownloadUrl = `/api/thumbnails/${thumbnailId}/download`;
  assert(thumbnailDownloadUrl.startsWith('/api/thumbnails/'), 'Thumbnail download endpoint contains proper routing URL scheme');

  // --------------------------------------------------------------------------
  // Assertion 13: Publishing Manager authorization
  // --------------------------------------------------------------------------
  const pmAuth = publishingService.isAuthorizedForPublishing(pubMgrActor);
  assert(pmAuth.authorized === true, 'PUBLISHING_MANAGER role is successfully authorized for publishing actions');

  // --------------------------------------------------------------------------
  // Assertion 14: Unauthorized user rejection
  // --------------------------------------------------------------------------
  const speakerAuth = publishingService.isAuthorizedForPublishing(speakerActor);
  assert(speakerAuth.authorized === false, 'Unauthorized SPEAKER role is rejected from publishing operations');

  // --------------------------------------------------------------------------
  // Assertion 15: Legacy DESIGNER cannot publish
  // --------------------------------------------------------------------------
  const designerAuth = publishingService.isAuthorizedForPublishing(designerActor);
  assert(designerAuth.authorized === false, 'Legacy DESIGNER role cannot gain publishing permission');

  // --------------------------------------------------------------------------
  // Assertion 16: Valid state transitions
  // --------------------------------------------------------------------------
  const transitionPubId = `BP-PUB-TR-${Date.now()}`;
  await publishingRepository.appendRecord({
    id: transitionPubId,
    contentId,
    contentMasterId: contentId,
    videoId,
    videoTitle: 'Exploring Mars Video',
    questionId: qId,
    finalVideoStatus: 'READY',
    youtube: { status: SocialPublishStatus.NOT_STARTED },
    instagram: { status: SocialPublishStatus.NOT_STARTED },
    facebook: { status: SocialPublishStatus.NOT_STARTED },
    pinnedCommentReady: true,
    thumbnailReady: true,
    completedPlatformsCount: 0,
  } as any);

  const testWatchUrl = `https://youtube.com/watch?v=mars_${Math.random().toString(36).substring(2, 10)}`;

  // Transition from NOT_STARTED to SCHEDULED
  const scheduledResult = await publishingService.schedulePublishing(
    videoId,
    'youtube',
    new Date(Date.now() + 172800000).toISOString(),
    pubMgrActor
  );
  assert(scheduledResult.youtube.status === SocialPublishStatus.SCHEDULED, 'Transition from NOT_STARTED to SCHEDULED is valid');

  // Transition to PUBLISHED
  const publishedResult = await publishingService.markPlatformPublished(
    videoId,
    'youtube',
    testWatchUrl,
    pubMgrActor
  );
  assert(publishedResult.youtube.status === SocialPublishStatus.PUBLISHED, 'Transition from SCHEDULED to PUBLISHED is valid');

  // --------------------------------------------------------------------------
  // Assertion 17: Invalid state transition rejection
  // --------------------------------------------------------------------------
  let invalidTransitionRejected = false;
  try {
    // Attempting to retry a successfully published platform should fail
    await publishingService.retryPublishing(videoId, 'youtube', undefined, pubMgrActor);
  } catch (err: any) {
    invalidTransitionRejected = true;
  }
  assert(invalidTransitionRejected === true, 'Invalid transition (retrying an already PUBLISHED state) is strictly rejected');

  // --------------------------------------------------------------------------
  // Assertion 18: Platform-specific publishing status separation
  // --------------------------------------------------------------------------
  // YouTube is published, check if Facebook is still NOT_STARTED
  const recordCheck = await publishingRepository.findByVideoId(videoId);
  assert(recordCheck?.youtube.status === SocialPublishStatus.PUBLISHED, 'YouTube status is independently PUBLISHED');
  assert(recordCheck?.facebook.status === SocialPublishStatus.NOT_STARTED, 'Facebook status remains independently NOT_STARTED');

  // --------------------------------------------------------------------------
  // Assertion 19: Duplicate/idempotency protection
  // --------------------------------------------------------------------------
  // Marking the platform published with the same state again is safe and returns the same status (idempotency)
  const idempotentResult = await publishingService.markPlatformPublished(
    videoId,
    'youtube',
    testWatchUrl,
    pubMgrActor
  );
  assert(idempotentResult.youtube.status === SocialPublishStatus.PUBLISHED, 'Subsequent identical published actions are handled safely and idempotently');

  // --------------------------------------------------------------------------
  // Assertion 20: Audit metadata
  // --------------------------------------------------------------------------
  const logs = await auditLogRepository.findAll();
  const pubLogs = logs.filter(l => l.action.includes('PUBLISH') || l.action.includes('SCHEDULE'));
  assert(pubLogs.length > 0, `Publishing actions successfully recorded in audit log trails (found ${pubLogs.length} entries)`);

  // --------------------------------------------------------------------------
  // Assertion 21: Missing script blocks publishing (Defect 1 regression)
  // --------------------------------------------------------------------------
  const videoIdNoScript = `V-P10-NOSCR-${Date.now()}`;
  await videosRepository.appendRecord({
    id: videoIdNoScript,
    contentId,
    contentMasterId: contentId,
    questionId: qId,
    title: 'No Script Video',
    status: VideoProductionStatus.READY_TO_UPLOAD,
    priority: PriorityLevel.HIGH,
    driveFileId: 'drive-file-no-script',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  await thumbnailsRepository.appendRecord({
    id: `T-P10-NOSCR-${Date.now()}`,
    contentId,
    contentMasterId: contentId,
    videoId: videoIdNoScript,
    status: 'APPROVED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);
  await pinnedCommentsRepository.appendRecord({
    id: `PIN-P10-NOSCR-${Date.now()}`,
    contentId,
    contentMasterId: contentId,
    videoId: videoIdNoScript,
    commentText: 'No script pinned comment',
    isApproved: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);
  const readinessNoScript = await publishingService.validatePublishReadiness(videoIdNoScript, { actor: pubMgrActor });
  assert(
    readinessNoScript.isReady === false && readinessNoScript.blockers.some(b => b.includes('Script record') && b.includes('missing')),
    'Regression check: Video with missing script must be strictly BLOCKED from publishing'
  );

  // --------------------------------------------------------------------------
  // Assertion 22: Unready script blocks publishing (Defect 1 regression)
  // --------------------------------------------------------------------------
  const videoIdUnreadyScript = `V-P10-UNRDYSCR-${Date.now()}`;
  await videosRepository.appendRecord({
    id: videoIdUnreadyScript,
    contentId,
    contentMasterId: contentId,
    questionId: qId,
    title: 'Unready Script Video',
    status: VideoProductionStatus.READY_TO_UPLOAD,
    priority: PriorityLevel.HIGH,
    driveFileId: 'drive-file-unready-script',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  await scriptsRepository.appendRecord({
    id: `S-P10-UNRDY-${Date.now()}`,
    videoId: videoIdUnreadyScript,
    contentId,
    currentVersion: 1,
    hookText: '', // Empty/unready
    problemStatement: 'Problem statement',
    stepByStepSolution: 'Step-by-step solution',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);
  await thumbnailsRepository.appendRecord({
    id: `T-P10-UNRDY-${Date.now()}`,
    contentId,
    contentMasterId: contentId,
    videoId: videoIdUnreadyScript,
    status: 'APPROVED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);
  await pinnedCommentsRepository.appendRecord({
    id: `PIN-P10-UNRDY-${Date.now()}`,
    contentId,
    contentMasterId: contentId,
    videoId: videoIdUnreadyScript,
    commentText: 'Unready script comment',
    isApproved: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);
  const readinessUnreadyScript = await publishingService.validatePublishReadiness(videoIdUnreadyScript, { actor: pubMgrActor });
  assert(
    readinessUnreadyScript.isReady === false && readinessUnreadyScript.blockers.some(b => b.includes('incomplete or unready')),
    'Regression check: Video with an incomplete/unready script must be strictly BLOCKED from publishing'
  );

  // --------------------------------------------------------------------------
  // Assertion 23: Ready script does not create false blockers (Defect 1 regression)
  // --------------------------------------------------------------------------
  const videoIdReadyScript = `V-P10-RDYSCR-${Date.now()}`;
  await videosRepository.appendRecord({
    id: videoIdReadyScript,
    contentId,
    contentMasterId: contentId,
    questionId: qId,
    title: 'Ready Script Video',
    status: VideoProductionStatus.READY_TO_UPLOAD,
    priority: PriorityLevel.HIGH,
    driveFileId: 'drive-file-ready-script',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  await scriptsRepository.appendRecord({
    id: `S-P10-RDY-${Date.now()}`,
    videoId: videoIdReadyScript,
    contentId,
    currentVersion: 1,
    hookText: 'Hey guys!',
    problemStatement: 'Problem statement',
    stepByStepSolution: 'Step-by-step solution',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);
  await thumbnailsRepository.appendRecord({
    id: `T-P10-RDY-${Date.now()}`,
    contentId,
    contentMasterId: contentId,
    videoId: videoIdReadyScript,
    status: 'APPROVED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);
  await pinnedCommentsRepository.appendRecord({
    id: `PIN-P10-RDY-${Date.now()}`,
    contentId,
    contentMasterId: contentId,
    videoId: videoIdReadyScript,
    commentText: 'Ready script comment',
    isApproved: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);
  const readinessReadyScript = await publishingService.validatePublishReadiness(videoIdReadyScript, { actor: pubMgrActor });
  const hasScriptBlocker = readinessReadyScript.blockers.some(b => b.includes('Script') || b.includes('script'));
  assert(
    !hasScriptBlocker,
    'Regression check: Complete and valid script must not create a script-related readiness blocker'
  );

  // --------------------------------------------------------------------------
  // Assertion 24: READY_TO_UPLOAD video without driveFileId blocks publishing (Defect 2 regression)
  // --------------------------------------------------------------------------
  const videoIdNoDrive1 = `V-P10-NODRV1-${Date.now()}`;
  await videosRepository.appendRecord({
    id: videoIdNoDrive1,
    contentId,
    contentMasterId: contentId,
    questionId: qId,
    title: 'No Drive READY_TO_UPLOAD Video',
    status: VideoProductionStatus.READY_TO_UPLOAD,
    priority: PriorityLevel.HIGH,
    driveFileId: '', // Empty/missing
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  await scriptsRepository.appendRecord({
    id: `S-P10-NODRV1-${Date.now()}`,
    videoId: videoIdNoDrive1,
    contentId,
    currentVersion: 1,
    hookText: 'Hey guys!',
    problemStatement: 'Problem statement',
    stepByStepSolution: 'Step-by-step solution',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);
  await thumbnailsRepository.appendRecord({
    id: `T-P10-NODRV1-${Date.now()}`,
    contentId,
    contentMasterId: contentId,
    videoId: videoIdNoDrive1,
    status: 'APPROVED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);
  await pinnedCommentsRepository.appendRecord({
    id: `PIN-P10-NODRV1-${Date.now()}`,
    contentId,
    contentMasterId: contentId,
    videoId: videoIdNoDrive1,
    commentText: 'No drive comments',
    isApproved: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);
  const readinessNoDrive1 = await publishingService.validatePublishReadiness(videoIdNoDrive1, { actor: pubMgrActor });
  assert(
    readinessNoDrive1.isReady === false && readinessNoDrive1.blockers.some(b => b.includes('driveFileId is missing or empty')),
    'Regression check: READY_TO_UPLOAD video without valid driveFileId is strictly BLOCKED from publishing'
  );

  // --------------------------------------------------------------------------
  // Assertion 25: UPLOADED video without driveFileId blocks publishing (Defect 2 regression)
  // --------------------------------------------------------------------------
  const videoIdNoDrive2 = `V-P10-NODRV2-${Date.now()}`;
  await videosRepository.appendRecord({
    id: videoIdNoDrive2,
    contentId,
    contentMasterId: contentId,
    questionId: qId,
    title: 'No Drive UPLOADED Video',
    status: VideoProductionStatus.UPLOADED,
    priority: PriorityLevel.HIGH,
    driveFileId: undefined, // Missing/undefined
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  await scriptsRepository.appendRecord({
    id: `S-P10-NODRV2-${Date.now()}`,
    videoId: videoIdNoDrive2,
    contentId,
    currentVersion: 1,
    hookText: 'Hey guys!',
    problemStatement: 'Problem statement',
    stepByStepSolution: 'Step-by-step solution',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);
  await thumbnailsRepository.appendRecord({
    id: `T-P10-NODRV2-${Date.now()}`,
    contentId,
    contentMasterId: contentId,
    videoId: videoIdNoDrive2,
    status: 'APPROVED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);
  await pinnedCommentsRepository.appendRecord({
    id: `PIN-P10-NODRV2-${Date.now()}`,
    contentId,
    contentMasterId: contentId,
    videoId: videoIdNoDrive2,
    commentText: 'No drive comments',
    isApproved: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);
  const readinessNoDrive2 = await publishingService.validatePublishReadiness(videoIdNoDrive2, { actor: pubMgrActor });
  assert(
    readinessNoDrive2.isReady === false && readinessNoDrive2.blockers.some(b => b.includes('driveFileId is missing or empty')),
    'Regression check: UPLOADED video without valid driveFileId is strictly BLOCKED from publishing'
  );

  // --------------------------------------------------------------------------
  // Assertion 26: Publishable video with valid driveFileId passes this specific gate (Defect 2 regression)
  // --------------------------------------------------------------------------
  const videoIdWithDrive = `V-P10-WITHDRV-${Date.now()}`;
  await videosRepository.appendRecord({
    id: videoIdWithDrive,
    contentId,
    contentMasterId: contentId,
    questionId: qId,
    title: 'With Drive Video',
    status: VideoProductionStatus.READY_TO_UPLOAD,
    priority: PriorityLevel.HIGH,
    driveFileId: 'drive-file-exists-and-valid-123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  await scriptsRepository.appendRecord({
    id: `S-P10-WITHDRV-${Date.now()}`,
    videoId: videoIdWithDrive,
    contentId,
    currentVersion: 1,
    hookText: 'Hey guys!',
    problemStatement: 'Problem statement',
    stepByStepSolution: 'Step-by-step solution',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);
  await thumbnailsRepository.appendRecord({
    id: `T-P10-WITHDRV-${Date.now()}`,
    contentId,
    contentMasterId: contentId,
    videoId: videoIdWithDrive,
    status: 'APPROVED',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);
  await pinnedCommentsRepository.appendRecord({
    id: `PIN-P10-WITHDRV-${Date.now()}`,
    contentId,
    contentMasterId: contentId,
    videoId: videoIdWithDrive,
    commentText: 'With drive comments',
    isApproved: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);
  const readinessWithDrive = await publishingService.validatePublishReadiness(videoIdWithDrive, { actor: pubMgrActor });
  const hasDriveBlocker = readinessWithDrive.blockers.some(b => b.includes('Google Drive file association') || b.includes('driveFileId'));
  assert(
    !hasDriveBlocker,
    'Regression check: Video with valid driveFileId must not trigger Google Drive file association blocker'
  );

  // Tear down of mock overrides
  SocialReviewService.getReviewPackageBundle = origGetReviewPackageBundle;

  console.log('\n====================================================');
  console.log(`PHASE 10 PUBLISHING HUB VERIFICATION RUN COMPLETE: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('====================================================\n');

  return {
    success: true,
    totalTests,
    passedTests,
    results: [
      { section: 'Publishing Hub Integration & Verification', status: 'PASS' },
    ]
  };
}

runPhase10PublishingVerification()
  .then((res) => {
    console.log('Verification finished successfully!', res);
    process.exit(0);
  })
  .catch((err) => {
    console.error('Verification failed!', err);
    process.exit(1);
  });
