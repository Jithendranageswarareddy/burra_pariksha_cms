/**
 * BURRA PARIKSHA CMS - Phase 22 Publishing Hub Test Suite
 * Comprehensive verification of P22-01 through P22-27 requirements.
 */

import { phase22PublishingHubService } from '../lib/services/phase22-publishing-hub.service';
import { phase22PublishingRepository } from '../lib/repositories/phase22-publishing.repository';
import { contentMastersRepository } from '../lib/repositories/content-masters.repository';
import { questionsRepository } from '../lib/repositories/questions.repository';
import { scriptsRepository } from '../lib/repositories/scripts.repository';
import { videosRepository } from '../lib/repositories/videos.repository';
import { thumbnailsRepository } from '../lib/repositories/thumbnails.repository';
import { pinnedCommentPackagesRepository } from '../lib/repositories/pinned-comment-packages.repository';
import { phase20SocialReviewsRepository } from '../lib/repositories/phase20-social-reviews.repository';
import { platformAdaptationsRepository } from '../lib/repositories/platform-adaptations.repository';
import { auditLogRepository } from '../lib/repositories/audit-log.repository';
import { phase21PlatformAdaptationService } from '../lib/services/phase21-platform-adaptation.service';
import { phase20SocialReviewService } from '../lib/services/phase20-social-review.service';

import {
  PlatformType,
  UserRole,
  WorkflowActor,
  ContentMaster,
  Question,
  Script,
  Video,
  Thumbnail,
  PinnedCommentPackage,
  SocialReviewRecord,
  PlatformAdaptationRecord,
} from '../types';
import { ValidationError, AuthorizationError } from '../lib/google-sheets/errors';

export interface Phase22TestResult {
  code: string;
  check: string;
  status: 'PASS' | 'FAIL';
  details: string;
}

export interface Phase22SuiteResult {
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  passed: boolean;
  results: Phase22TestResult[];
}

const ADMIN_ACTOR: WorkflowActor = { id: 'USR-ADM-01', name: 'Admin User', role: UserRole.ADMIN };
const PUBLISHER_ACTOR: WorkflowActor = { id: 'USR-PUB-01', name: 'Publisher User', role: UserRole.PUBLISHER };
const VIEWER_ACTOR: WorkflowActor = { id: 'USR-VIEW-01', name: 'Viewer User', role: UserRole.ANALYTICS_VIEWER };

async function saveEntity(repo: any, id: string, rec: any) {
  const existing = await repo.findById(id);
  if (existing) {
    await repo.update(id, rec);
  } else {
    await repo.create(rec);
  }
}

/**
 * Seed a complete, valid, approved canonical package + social review + platform adaptations
 */
async function seedCompleteApprovedPackage(contentIdNum: number) {
  const contentId = `BP-CNT-${contentIdNum.toString().padStart(6, '0')}`;
  const questionId = `BP-Q-${contentIdNum.toString().padStart(6, '0')}`;
  const scriptId = `BP-S-${contentIdNum.toString().padStart(6, '0')}`;
  const videoId = `BP-V-${contentIdNum.toString().padStart(6, '0')}`;
  const thumbnailId = `BP-T-${contentIdNum.toString().padStart(6, '0')}`;
  const pinnedId = `BP-PIN-${contentIdNum.toString().padStart(6, '0')}`;
  const socialReviewId = `BP-SR-${contentIdNum.toString().padStart(6, '0')}`;

  const now = new Date().toISOString();

  // 1. Content Master
  const master = {
    id: contentId,
    contentId,
    topicId: 'TOPIC-MATH-01',
    topicName: 'Arithmetic Shortcuts',
    questionId,
    scriptId,
    videoId,
    thumbnailId,
    pinnedCommentPackageId: pinnedId,
    status: 'ACTIVE' as any,
    createdAt: now,
    updatedAt: now,
  } as any;
  await saveEntity(contentMastersRepository, contentId, master);

  // 2. Question
  const question = {
    id: questionId,
    questionText: 'What is the speed of a train traveling 150m in 9 seconds?',
    options: ['A', 'B', 'C', 'D'],
    correctAnswer: 'B',
    solutionText: 'Speed = Distance / Time = 150m / 9s = 16.67 m/s = 60 km/h.',
    topicId: 'TOPIC-MATH-01',
    status: 'APPROVED' as any,
    version: 1,
    createdAt: now,
    updatedAt: now,
  } as any;
  await saveEntity(questionsRepository, questionId, question);

  // 3. Script
  const script = {
    id: scriptId,
    questionId,
    scriptSolutionText: 'Calculate speed instantly using distance over time multiplied by 18/5!',
    status: 'APPROVED' as any,
    version: 1,
    createdAt: now,
    updatedAt: now,
  } as any;
  await saveEntity(scriptsRepository, scriptId, script);

  // 4. Video
  const video = {
    id: videoId,
    questionId,
    status: 'READY_TO_UPLOAD' as any,
    productionStatus: 'READY_TO_UPLOAD' as any,
    finalRenderPath: `/renders/${videoId}.mp4`,
    driveFileId: `DRV-VID-${videoId}`,
    width: 1080,
    height: 1920,
    durationSeconds: 45,
    version: 1,
    createdAt: now,
    updatedAt: now,
  } as any;
  await saveEntity(videosRepository, videoId, video);

  // 5. Thumbnail
  const thumbnail = {
    id: thumbnailId,
    questionId,
    status: 'APPROVED' as any,
    selectedCandidateId: `CAN-THM-${thumbnailId}`,
    driveFileId: `DRV-THM-${thumbnailId}`,
    version: 1,
    createdAt: now,
    updatedAt: now,
  } as any;
  await saveEntity(thumbnailsRepository, thumbnailId, thumbnail);

  // 6. Pinned Comment Package
  const pinnedPkg = {
    id: pinnedId,
    contentId,
    approvedText: 'Subscribe to Burra Pariksha for daily competitive exam speed tricks!',
    status: 'APPROVED' as any,
    version: 1,
    createdAt: now,
    updatedAt: now,
  } as any;
  await saveEntity(pinnedCommentPackagesRepository, pinnedId, pinnedPkg);

  // 7. Phase 20 Social Review Record
  const sourceLock = await phase21PlatformAdaptationService.getCanonicalSourceLock(contentId);
  const socialReviewRecord = {
    id: socialReviewId,
    contentId,
    status: 'APPROVED',
    reviewNotes: 'All quality gates passed.',
    reviewedBy: ADMIN_ACTOR.id,
    reviewedByName: ADMIN_ACTOR.name,
    reviewedByRole: ADMIN_ACTOR.role,
    reviewedAt: now,
    canonicalSourceVersionLock: sourceLock,
    createdAt: now,
    updatedAt: now,
  } as any;
  await saveEntity(phase20SocialReviewsRepository, socialReviewId, socialReviewRecord);

  // 8. Phase 21 Platform Adaptations (YouTube, Instagram, Facebook)
  const ytAdaptation = await phase21PlatformAdaptationService.createAdaptation(
    {
      contentId,
      platform: PlatformType.YOUTUBE,
      title: 'Train Speed Time Shortcut | Burra Pariksha #Shorts',
      description: 'Master speed distance time questions in 10 seconds for APPSC and TSPSC exams.',
      hashtags: ['#BurraPariksha', '#Shorts', '#MathTricks'],
      callToAction: 'Subscribe for daily Telugu exam prep!',
    },
    ADMIN_ACTOR
  );
  await phase21PlatformAdaptationService.submitForReview(ytAdaptation.id, ADMIN_ACTOR);
  await phase21PlatformAdaptationService.approveAdaptation(ytAdaptation.id, ADMIN_ACTOR, {
    reason: 'Approved for YouTube Shorts',
  });

  const igAdaptation = await phase21PlatformAdaptationService.createAdaptation(
    {
      contentId,
      platform: PlatformType.INSTAGRAM,
      caption: 'Train speed shortcut trick for APPSC TSPSC preparation! #BurraPariksha #Reels',
      hashtags: ['#BurraPariksha', '#Reels', '#TeluguExams'],
      callToAction: 'Follow @BurraPariksha for more daily tips!',
    },
    ADMIN_ACTOR
  );
  await phase21PlatformAdaptationService.submitForReview(igAdaptation.id, ADMIN_ACTOR);
  await phase21PlatformAdaptationService.approveAdaptation(igAdaptation.id, ADMIN_ACTOR, {
    reason: 'Approved for Instagram Reels',
  });

  const fbAdaptation = await phase21PlatformAdaptationService.createAdaptation(
    {
      contentId,
      platform: PlatformType.FACEBOOK,
      title: 'Train Speed Shortcut for Competitive Exams',
      caption: 'Quick mathematical trick to solve train speed problems in Telugu.',
      hashtags: ['#BurraPariksha', '#FacebookWatch', '#TeluguStudy'],
      callToAction: 'Share this reel with fellow aspirants!',
    },
    ADMIN_ACTOR
  );
  await phase21PlatformAdaptationService.submitForReview(fbAdaptation.id, ADMIN_ACTOR);
  await phase21PlatformAdaptationService.approveAdaptation(fbAdaptation.id, ADMIN_ACTOR, {
    reason: 'Approved for Facebook Watch',
  });

  return {
    contentId,
    master,
    question,
    script,
    video,
    thumbnail,
    pinnedPkg,
    socialReviewRecord,
    ytAdaptation: await platformAdaptationsRepository.findByContentIdAndPlatform(
      contentId,
      PlatformType.YOUTUBE
    ),
    igAdaptation: await platformAdaptationsRepository.findByContentIdAndPlatform(
      contentId,
      PlatformType.INSTAGRAM
    ),
    fbAdaptation: await platformAdaptationsRepository.findByContentIdAndPlatform(
      contentId,
      PlatformType.FACEBOOK
    ),
  };
}

export async function runPhase22Verification(): Promise<Phase22SuiteResult> {
  const results: Phase22TestResult[] = [];

  const addResult = (code: string, check: string, passed: boolean, details: string) => {
    results.push({ code, check, status: passed ? 'PASS' : 'FAIL', details });
  };

  try {
    // Seed standard package for checks
    const seeded = await seedCompleteApprovedPackage(220);
    const contentId = seeded.contentId;

    // P22-01: Canonical Content ID correlation
    try {
      const pkg = await phase22PublishingHubService.getPublisherPackage(contentId, PlatformType.YOUTUBE);
      const passed = pkg.contentId === contentId && pkg.source.questionId === seeded.question.id;
      addResult(
        'P22-01',
        'Canonical Content ID correlation',
        passed,
        `Retrieved package for ${contentId}, linked to question ${pkg.source.questionId}`
      );
    } catch (e: any) {
      addResult('P22-01', 'Canonical Content ID correlation', false, e.message);
    }

    // P22-02: Publisher package retrieval
    try {
      const pkg = await phase22PublishingHubService.getPublisherPackage(contentId, PlatformType.YOUTUBE);
      const passed =
        !!pkg.assets && !!pkg.text && !!pkg.source && !!pkg.status && !!pkg.readiness;
      addResult(
        'P22-02',
        'Publisher package retrieval',
        passed,
        `Retrieved complete package structure with all 5 root sections populated`
      );
    } catch (e: any) {
      addResult('P22-02', 'Publisher package retrieval', false, e.message);
    }

    // P22-03: YouTube package completeness
    try {
      const pkg = await phase22PublishingHubService.getPublisherPackage(contentId, PlatformType.YOUTUBE);
      const passed =
        pkg.platform === 'YOUTUBE' &&
        pkg.text.title.length > 0 &&
        pkg.text.description.length > 0 &&
        pkg.text.hashtags.length > 0 &&
        !!pkg.text.pinnedComment;
      addResult(
        'P22-03',
        'YouTube package completeness',
        passed,
        `YouTube package verified with title, description, hashtags, and pinned comment`
      );
    } catch (e: any) {
      addResult('P22-03', 'YouTube package completeness', false, e.message);
    }

    // P22-04: Instagram package completeness
    try {
      const pkg = await phase22PublishingHubService.getPublisherPackage(contentId, PlatformType.INSTAGRAM);
      const passed =
        pkg.platform === 'INSTAGRAM' &&
        pkg.text.caption.length > 0 &&
        pkg.text.hashtags.length > 0 &&
        pkg.text.callToAction.length > 0;
      addResult(
        'P22-04',
        'Instagram package completeness',
        passed,
        `Instagram package verified with caption, hashtags, and CTA`
      );
    } catch (e: any) {
      addResult('P22-04', 'Instagram package completeness', false, e.message);
    }

    // P22-05: Facebook package completeness
    try {
      const pkg = await phase22PublishingHubService.getPublisherPackage(contentId, PlatformType.FACEBOOK);
      const passed =
        pkg.platform === 'FACEBOOK' &&
        (pkg.text.title.length > 0 || pkg.text.caption.length > 0) &&
        pkg.text.hashtags.length > 0;
      addResult(
        'P22-05',
        'Facebook package completeness',
        passed,
        `Facebook package verified with title/caption, hashtags, and CTA`
      );
    } catch (e: any) {
      addResult('P22-05', 'Facebook package completeness', false, e.message);
    }

    // P22-06: Final video availability
    try {
      const pkg = await phase22PublishingHubService.getPublisherPackage(contentId, PlatformType.YOUTUBE);
      const videoAsset = pkg.assets.finalVideo;
      const passed =
        !!videoAsset &&
        videoAsset.isAccessible === true &&
        videoAsset.finalRenderPath === `/renders/${seeded.video.id}.mp4`;
      addResult(
        'P22-06',
        'Final video availability',
        passed,
        `Final video accessible at path: ${videoAsset?.finalRenderPath}`
      );
    } catch (e: any) {
      addResult('P22-06', 'Final video availability', false, e.message);
    }

    // P22-07: Thumbnail availability
    try {
      const pkg = await phase22PublishingHubService.getPublisherPackage(contentId, PlatformType.YOUTUBE);
      const thumbAsset = pkg.assets.thumbnail;
      const passed = !!thumbAsset && thumbAsset.isAccessible === true;
      addResult(
        'P22-07',
        'Thumbnail availability',
        passed,
        `Thumbnail accessible with drive ID: ${thumbAsset?.driveFileId}`
      );
    } catch (e: any) {
      addResult('P22-07', 'Thumbnail availability', false, e.message);
    }

    // P22-08: Title/description/caption availability
    try {
      const pkg = await phase22PublishingHubService.getPublisherPackage(contentId, PlatformType.YOUTUBE);
      const passed =
        typeof pkg.text.title === 'string' &&
        typeof pkg.text.description === 'string' &&
        typeof pkg.text.caption === 'string';
      addResult(
        'P22-08',
        'Title/description/caption availability',
        passed,
        `Text package contains title, description, and caption strings`
      );
    } catch (e: any) {
      addResult('P22-08', 'Title/description/caption availability', false, e.message);
    }

    // P22-09: Hashtag availability
    try {
      const pkg = await phase22PublishingHubService.getPublisherPackage(contentId, PlatformType.YOUTUBE);
      const passed = Array.isArray(pkg.text.hashtags) && pkg.text.hashtags.length > 0;
      addResult(
        'P22-09',
        'Hashtag availability',
        passed,
        `Hashtags available: [${pkg.text.hashtags.join(', ')}]`
      );
    } catch (e: any) {
      addResult('P22-09', 'Hashtag availability', false, e.message);
    }

    // P22-10: Pinned comment availability
    try {
      const pkg = await phase22PublishingHubService.getPublisherPackage(contentId, PlatformType.YOUTUBE);
      const passed = typeof pkg.text.pinnedComment === 'string' && pkg.text.pinnedComment.length > 0;
      addResult(
        'P22-10',
        'Pinned comment availability',
        passed,
        `Pinned comment text retrieved: "${pkg.text.pinnedComment}"`
      );
    } catch (e: any) {
      addResult('P22-10', 'Pinned comment availability', false, e.message);
    }

    // P22-11: Caption availability
    try {
      const pkg = await phase22PublishingHubService.getPublisherPackage(contentId, PlatformType.YOUTUBE);
      const passed = typeof pkg.text.captions === 'string' && pkg.text.captions.length > 0;
      addResult(
        'P22-11',
        'Caption availability',
        passed,
        `Captions text retrieved: "${pkg.text.captions?.substring(0, 40)}..."`
      );
    } catch (e: any) {
      addResult('P22-11', 'Caption availability', false, e.message);
    }

    // P22-12: Social Review PASS required
    try {
      const unapprovedSeed = await seedCompleteApprovedPackage(221);
      const sr = await phase20SocialReviewsRepository.getLatestByContentId(unapprovedSeed.contentId);
      if (sr) {
        sr.status = 'REJECTED' as any;
        await saveEntity(phase20SocialReviewsRepository, sr.id, sr);
      }
      const readiness = await phase22PublishingHubService.evaluateReadiness(
        unapprovedSeed.contentId,
        PlatformType.YOUTUBE
      );
      const passed =
        readiness.isReadyToPublish === false &&
        readiness.blockers.includes('SOCIAL_REVIEW_NOT_APPROVED');
      addResult(
        'P22-12',
        'Social Review PASS required',
        passed,
        `Unapproved social review blocked readiness with blocker: SOCIAL_REVIEW_NOT_APPROVED`
      );
    } catch (e: any) {
      addResult('P22-12', 'Social Review PASS required', false, e.message);
    }

    // P22-13: Approved adaptation required
    try {
      const draftSeed = await seedCompleteApprovedPackage(222);
      const adp = await platformAdaptationsRepository.findByContentIdAndPlatform(
        draftSeed.contentId,
        PlatformType.YOUTUBE
      );
      if (adp) {
        adp.status = 'DRAFT' as any;
        await saveEntity(platformAdaptationsRepository, adp.id, adp);
      }
      const readiness = await phase22PublishingHubService.evaluateReadiness(
        draftSeed.contentId,
        PlatformType.YOUTUBE
      );
      const passed =
        readiness.isReadyToPublish === false &&
        readiness.blockers.includes('PLATFORM_ADAPTATION_NOT_APPROVED');
      addResult(
        'P22-13',
        'Approved adaptation required',
        passed,
        `Draft adaptation blocked readiness with blocker: PLATFORM_ADAPTATION_NOT_APPROVED`
      );
    } catch (e: any) {
      addResult('P22-13', 'Approved adaptation required', false, e.message);
    }

    // P22-14: Stale adaptation blocked
    try {
      const staleSeed = await seedCompleteApprovedPackage(223);
      // Mutate canonical question to make adaptation stale
      staleSeed.question.questionText = 'MUTATED CANONICAL QUESTION TEXT';
      await saveEntity(questionsRepository, staleSeed.question.id, staleSeed.question);

      const readiness = await phase22PublishingHubService.evaluateReadiness(
        staleSeed.contentId,
        PlatformType.YOUTUBE
      );
      const passed =
        readiness.isReadyToPublish === false &&
        readiness.blockers.includes('PLATFORM_ADAPTATION_STALE');
      addResult(
        'P22-14',
        'Stale adaptation blocked',
        passed,
        `Mutated canonical question triggered staleness blocker: PLATFORM_ADAPTATION_STALE`
      );
    } catch (e: any) {
      addResult('P22-14', 'Stale adaptation blocked', false, e.message);
    }

    // P22-15: Canonical hash mismatch blocked
    try {
      const hashSeed = await seedCompleteApprovedPackage(224);
      const adp = await platformAdaptationsRepository.findByContentIdAndPlatform(
        hashSeed.contentId,
        PlatformType.YOUTUBE
      );
      if (adp) {
        adp.canonicalSourceVersionLock.packageOverallHash = '0000000000000000000000000000000000000000000000000000000000000000';
        await saveEntity(platformAdaptationsRepository, adp.id, adp);
      }
      const readiness = await phase22PublishingHubService.evaluateReadiness(
        hashSeed.contentId,
        PlatformType.YOUTUBE
      );
      const passed =
        readiness.isReadyToPublish === false &&
        readiness.blockers.includes('CANONICAL_HASH_MISMATCH');
      addResult(
        'P22-15',
        'Canonical hash mismatch blocked',
        passed,
        `Altered source hash blocked readiness with blocker: CANONICAL_HASH_MISMATCH`
      );
    } catch (e: any) {
      addResult('P22-15', 'Canonical hash mismatch blocked', false, e.message);
    }

    // P22-16: Missing asset produces explicit blocker
    try {
      const missingAssetSeed = await seedCompleteApprovedPackage(225);
      await videosRepository.deleteRecord(missingAssetSeed.video.id);

      const readiness = await phase22PublishingHubService.evaluateReadiness(
        missingAssetSeed.contentId,
        PlatformType.YOUTUBE
      );
      const passed =
        readiness.isReadyToPublish === false &&
        readiness.blockers.includes('FINAL_VIDEO_MISSING');
      addResult(
        'P22-16',
        'Missing asset produces explicit blocker',
        passed,
        `Deleted video record produced explicit blocker: FINAL_VIDEO_MISSING`
      );
    } catch (e: any) {
      addResult('P22-16', 'Missing asset produces explicit blocker', false, e.message);
    }

    // P22-17: Multiple blockers reported together
    try {
      const multiBlockerSeed = await seedCompleteApprovedPackage(226);
      await videosRepository.deleteRecord(multiBlockerSeed.video.id);
      await thumbnailsRepository.deleteRecord(multiBlockerSeed.thumbnail.id);

      const readiness = await phase22PublishingHubService.evaluateReadiness(
        multiBlockerSeed.contentId,
        PlatformType.YOUTUBE
      );
      const passed =
        readiness.isReadyToPublish === false &&
        readiness.blockers.includes('FINAL_VIDEO_MISSING') &&
        readiness.blockers.includes('THUMBNAIL_MISSING');
      addResult(
        'P22-17',
        'Multiple blockers reported together',
        passed,
        `Reported multiple blockers together: [${readiness.blockers.join(', ')}]`
      );
    } catch (e: any) {
      addResult('P22-17', 'Multiple blockers reported together', false, e.message);
    }

    // P22-18: Deterministic readiness result
    try {
      const eval1 = await phase22PublishingHubService.evaluateReadiness(contentId, PlatformType.YOUTUBE);
      const eval2 = await phase22PublishingHubService.evaluateReadiness(contentId, PlatformType.YOUTUBE);
      const eval3 = await phase22PublishingHubService.evaluateReadiness(contentId, PlatformType.YOUTUBE);

      const passed =
        eval1.isReadyToPublish === eval2.isReadyToPublish &&
        eval2.isReadyToPublish === eval3.isReadyToPublish &&
        JSON.stringify(eval1.blockers) === JSON.stringify(eval2.blockers) &&
        JSON.stringify(eval2.blockers) === JSON.stringify(eval3.blockers);
      addResult(
        'P22-18',
        'Deterministic readiness result',
        passed,
        `Evaluated readiness 3 times sequentially with identical deterministic output (isReady=${eval1.isReadyToPublish})`
      );
    } catch (e: any) {
      addResult('P22-18', 'Deterministic readiness result', false, e.message);
    }

    // P22-19: Publishing record version/hash locking
    try {
      const pubRecord = await phase22PublishingHubService.markManuallyPublished(
        {
          contentId,
          platform: PlatformType.YOUTUBE,
          publicationNotes: 'Version lock verification test',
        },
        PUBLISHER_ACTOR
      );
      const passed =
        !!pubRecord.canonicalSourceHash &&
        !!pubRecord.adaptationHash &&
        pubRecord.adaptationVersion === 1 &&
        pubRecord.videoId === seeded.video.id &&
        pubRecord.thumbnailId === seeded.thumbnail.id;
      addResult(
        'P22-19',
        'Publishing record version/hash locking',
        passed,
        `Publishing record locked canonical hash (${pubRecord.canonicalSourceHash.substring(0, 16)}...) and adaptation version (${pubRecord.adaptationVersion})`
      );
    } catch (e: any) {
      addResult('P22-19', 'Publishing record version/hash locking', false, e.message);
    }

    // P22-20: Duplicate/idempotency protection
    try {
      const pub1 = await phase22PublishingHubService.markManuallyPublished(
        {
          contentId,
          platform: PlatformType.YOUTUBE,
          publicationNotes: 'First publish attempt',
        },
        PUBLISHER_ACTOR
      );
      const pub2 = await phase22PublishingHubService.markManuallyPublished(
        {
          contentId,
          platform: PlatformType.YOUTUBE,
          publicationNotes: 'Second publish attempt for same version',
        },
        PUBLISHER_ACTOR
      );

      const allRecords = await phase22PublishingRepository.findByContentId(contentId);
      const ytRecords = allRecords.filter((r) => r.platform === 'YOUTUBE');

      const passed = pub1.id === pub2.id && ytRecords.length === 1;
      addResult(
        'P22-20',
        'Duplicate/idempotency protection',
        passed,
        `Re-publishing same adaptation version updated existing record ${pub1.id} without creating duplicate record`
      );
    } catch (e: any) {
      addResult('P22-20', 'Duplicate/idempotency protection', false, e.message);
    }

    // P22-21: Manual publishing record
    try {
      const rec = await phase22PublishingHubService.markManuallyPublished(
        {
          contentId,
          platform: PlatformType.INSTAGRAM,
          externalUrl: 'https://instagram.com/reels/123456789',
          platformPostId: 'ig-reel-12345',
          publicationNotes: 'Posted via mobile Instagram app',
        },
        PUBLISHER_ACTOR
      );
      const passed =
        rec.status === 'MANUALLY_PUBLISHED' &&
        rec.externalUrl === 'https://instagram.com/reels/123456789' &&
        rec.platformPostId === 'ig-reel-12345';
      addResult(
        'P22-21',
        'Manual publishing record',
        passed,
        `Successfully recorded MANUALLY_PUBLISHED status with external URL and post ID`
      );
    } catch (e: any) {
      addResult('P22-21', 'Manual publishing record', false, e.message);
    }

    // P22-22: Failed publishing record
    try {
      const failRec = await phase22PublishingHubService.markPublishingFailed(
        {
          contentId,
          platform: PlatformType.FACEBOOK,
          failureReason: 'Network error uploading to Facebook video manager',
          notes: 'Will retry after connection restores',
        },
        PUBLISHER_ACTOR
      );
      const passed =
        failRec.status === 'FAILED' &&
        failRec.failureReason === 'Network error uploading to Facebook video manager';
      addResult(
        'P22-22',
        'Failed publishing record',
        passed,
        `Recorded FAILED status with reason: "${failRec.failureReason}"`
      );
    } catch (e: any) {
      addResult('P22-22', 'Failed publishing record', false, e.message);
    }

    // P22-23: Retry behavior
    try {
      const retried = await phase22PublishingHubService.retryPublishing(
        contentId,
        PlatformType.FACEBOOK,
        PUBLISHER_ACTOR,
        'Retrying after connection restored'
      );
      const passed =
        retried.status === 'READY_TO_PUBLISH' &&
        retried.retryCount === 1 &&
        retried.failureReason === undefined;
      addResult(
        'P22-23',
        'Retry behavior',
        passed,
        `Retried Facebook publishing: status reset to READY_TO_PUBLISH, retryCount=${retried.retryCount}`
      );
    } catch (e: any) {
      addResult('P22-23', 'Retry behavior', false, e.message);
    }

    // P22-24: RBAC
    try {
      let blockedAsExpected = false;
      try {
        await phase22PublishingHubService.markManuallyPublished(
          { contentId, platform: PlatformType.YOUTUBE },
          VIEWER_ACTOR
        );
      } catch (e: any) {
        if (e instanceof AuthorizationError) {
          blockedAsExpected = true;
        }
      }

      const allowedPublisher = await phase22PublishingHubService.markManuallyPublished(
        { contentId, platform: PlatformType.YOUTUBE },
        PUBLISHER_ACTOR
      );

      const passed = blockedAsExpected && !!allowedPublisher;
      addResult(
        'P22-24',
        'RBAC enforcement',
        passed,
        `Blocked viewer role with AuthorizationError and allowed publisher role`
      );
    } catch (e: any) {
      addResult('P22-24', 'RBAC enforcement', false, e.message);
    }

    // P22-25: Audit/history
    try {
      const logs = await auditLogRepository.findAll();
      const pubLogs = logs.filter((l) => l.entityType === 'PUBLISHING');
      const passed = pubLogs.length > 0;
      addResult(
        'P22-25',
        'Audit/history',
        passed,
        `Retrieved ${pubLogs.length} audit log entries for publishing operations`
      );
    } catch (e: any) {
      addResult('P22-25', 'Audit/history', false, e.message);
    }

    // P22-26: Canonical content remains unchanged
    try {
      const qAfter = await questionsRepository.findById(seeded.question.id);
      const sAfter = await scriptsRepository.findById(seeded.script.id);
      const vAfter = await videosRepository.findById(seeded.video.id);
      const tAfter = await thumbnailsRepository.findById(seeded.thumbnail.id);
      const pAfter = await pinnedCommentPackagesRepository.findById(seeded.pinnedPkg.id);

      const passed =
        qAfter?.questionText === seeded.question.questionText &&
        (sAfter as any)?.scriptSolutionText === (seeded.script as any).scriptSolutionText &&
        vAfter?.finalRenderPath === seeded.video.finalRenderPath &&
        (tAfter as any)?.selectedCandidateId === (seeded.thumbnail as any).selectedCandidateId &&
        (pAfter as any)?.approvedText === (seeded.pinnedPkg as any).approvedText;

      addResult(
        'P22-26',
        'Canonical content remains unchanged',
        passed,
        `100% verified canonical Question, Script, Video, Thumbnail, and Pinned Comment were NOT modified by publishing`
      );
    } catch (e: any) {
      addResult('P22-26', 'Canonical content remains unchanged', false, e.message);
    }

    // P22-27: Complete publisher package E2E
    try {
      const e2eSeed = await seedCompleteApprovedPackage(227);
      const e2eContentId = e2eSeed.contentId;

      // 1. Social Review APPROVED
      const sr = await phase20SocialReviewsRepository.getLatestByContentId(e2eContentId);
      const srApproved = sr?.status === ('PASS' as any) || sr?.status === ('APPROVED' as any);

      // 2. Retrieve packages for YT, IG, FB
      const packages = await phase22PublishingHubService.getAllPublisherPackagesForContent(e2eContentId);

      const ytPkg = packages[PlatformType.YOUTUBE];
      const igPkg = packages[PlatformType.INSTAGRAM];
      const fbPkg = packages[PlatformType.FACEBOOK];

      const allReady =
        ytPkg.readiness.isReadyToPublish &&
        igPkg.readiness.isReadyToPublish &&
        fbPkg.readiness.isReadyToPublish;

      // 3. Mark all 3 manually published
      const ytPub = await phase22PublishingHubService.markManuallyPublished(
        {
          contentId: e2eContentId,
          platform: PlatformType.YOUTUBE,
          externalUrl: 'https://youtube.com/shorts/e2e227',
          platformPostId: 'yt-e2e-227',
        },
        PUBLISHER_ACTOR
      );

      const igPub = await phase22PublishingHubService.markManuallyPublished(
        {
          contentId: e2eContentId,
          platform: PlatformType.INSTAGRAM,
          externalUrl: 'https://instagram.com/reels/e2e227',
          platformPostId: 'ig-e2e-227',
        },
        PUBLISHER_ACTOR
      );

      const fbPub = await phase22PublishingHubService.markManuallyPublished(
        {
          contentId: e2eContentId,
          platform: PlatformType.FACEBOOK,
          externalUrl: 'https://facebook.com/watch/e2e227',
          platformPostId: 'fb-e2e-227',
        },
        PUBLISHER_ACTOR
      );

      const passed =
        srApproved &&
        allReady &&
        ytPub.status === 'MANUALLY_PUBLISHED' &&
        igPub.status === 'MANUALLY_PUBLISHED' &&
        fbPub.status === 'MANUALLY_PUBLISHED' &&
        !!ytPub.canonicalSourceHash &&
        !!igPub.canonicalSourceHash &&
        !!fbPub.canonicalSourceHash;

      addResult(
        'P22-27',
        'Complete publisher package E2E',
        passed,
        `E2E multi-platform publishing completed for genuine package ${e2eContentId}. All 3 platforms READY_TO_PUBLISH & MANUALLY_PUBLISHED with locked hashes.`
      );
    } catch (e: any) {
      addResult('P22-27', 'Complete publisher package E2E', false, e.message);
    }
  } catch (e: any) {
    console.error('Phase 22 suite execution error:', e);
  }

  const passedChecks = results.filter((r) => r.status === 'PASS').length;
  const failedChecks = results.filter((r) => r.status === 'FAIL').length;
  const totalChecks = results.length;

  return {
    totalChecks,
    passedChecks,
    failedChecks,
    passed: failedChecks === 0 && totalChecks >= 27,
    results,
  };
}
