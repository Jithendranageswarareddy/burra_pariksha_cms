/**
 * BURRA PARIKSHA CMS - Phase 09 Publishing Workflow Verification Test
 * 
 * Verifies Production Steps 13–15:
 * Step 13: Platform Packages (YouTube Shorts, Instagram Reels, Facebook Video adaptations, diffs, invariance)
 * Step 14: Publishing Package (Gate D pre-flight verification, asset bundling, checklist)
 * Step 15: Publish (Manual upload tracking, scheduling, retries, URL verification, finalization)
 */

// Force offline mode for zero-network deterministic test execution
process.env.SKIP_SHEETS_SYNC = 'true';
process.env.NODE_ENV = 'test';

import { publishingService } from '../lib/services/publishing.service';
import { videosRepository } from '../lib/repositories/videos.repository';
import { questionsRepository } from '../lib/repositories/questions.repository';
import { thumbnailsRepository } from '../lib/repositories/thumbnails.repository';
import { pinnedCommentsRepository } from '../lib/repositories/pinned-comments.repository';
import { socialReviewsRepository } from '../lib/repositories/social-reviews.repository';
import { scriptsRepository } from '../lib/repositories/scripts.repository';
import { SocialReviewService } from '../lib/services/social-review.service';
import {
  VideoProductionStatus,
  SocialPublishStatus,
  PlatformType,
  PriorityLevel,
  SocialReviewStatus,
  QuestionValidationStatus,
  QuestionStatus,
} from '../types';

export interface VerificationResult {
  step: string;
  name: string;
  passed: boolean;
  details: string;
}

export async function runPhase09Verification(): Promise<{
  success: boolean;
  total: number;
  passed: number;
  failed: number;
  results: VerificationResult[];
}> {
  const results: VerificationResult[] = [];

  const addResult = (step: string, name: string, passed: boolean, details: string) => {
    results.push({ step, name, passed, details });
    const mark = passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${mark} [${step}] ${name}: ${details}`);
  };

  console.log('\n======================================================');
  console.log('🚀 RUNNING PHASE 09: PUBLISHING WORKFLOW VERIFICATION');
  console.log('======================================================\n');

  const testActor = {
    id: 'USR-001',
    name: 'Admin',
    role: 'ADMIN',
  };

  try {
    // ------------------------------------------------------------------------
    // SETUP TEST FIXTURES
    // ------------------------------------------------------------------------
    const testQId = `TEST-P09-Q-${Date.now()}`;
    const testVId = `TEST-P09-V-${Date.now()}`;

    // 1. Seed Question
    await questionsRepository.create({
      id: testQId,
      questionText: 'What is the sum of angles in a triangle?',
      topicId: 'TOP-101',
      topicName: 'Geometry',
      subtopicId: 'SUB-101',
      subtopicName: 'Triangles',
      options: { a: '90°', b: '180°', c: '270°', d: '360°' },
      correctAnswer: 'B',
      explanation: 'The sum of angles in any Euclidean triangle is always 180 degrees.',
      status: QuestionStatus.APPROVED,
      validationStatus: QuestionValidationStatus.VALID,
      videoStatus: VideoProductionStatus.READY_TO_UPLOAD,
      difficulty: 'EASY' as any,
      language: 'ENGLISH' as any,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any);

    // 2. Seed Video
    await videosRepository.create({
      id: testVId,
      questionId: testQId,
      title: 'Triangle Angles Speed Trick | Burra Pariksha',
      status: VideoProductionStatus.READY_TO_UPLOAD,
      priority: PriorityLevel.HIGH,
      driveFileId: 'DRV-P09-TEST-FILE',
      driveFolderUrl: 'https://drive.google.com/drive/folders/test-p09-folder',
      finalRenderPath: '/renders/master_cut.mp4',
      finalRenderWidth: 1080,
      finalRenderHeight: 1920,
      finalRenderAspectRatio: '9:16',
      finalRenderFormat: 'MP4',
      actualDurationSeconds: 52,
      targetDurationSeconds: 60,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any);

    // 3. Seed Script
    await scriptsRepository.create({
      id: `SCR-${testVId}`,
      videoId: testVId,
      questionId: testQId,
      hookText: 'What if you could solve any triangle question in 5 seconds?',
      problemStatement: 'Sum of internal angles in a planar triangle',
      stepByStepSolution: 'Add angles A + B + C to always equal 180 degrees.',
      speedTrickOrTakeaway: 'Sum of angles is always 180.',
      callToAction: 'Comment your answer below and subscribe!',
      status: 'APPROVED' as any,
      currentVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any);

    // 4. Seed Thumbnail
    await thumbnailsRepository.create({
      id: `THM-${testVId}`,
      videoId: testVId,
      hookHeadline: 'Triangle Angle Secret Revealed!',
      driveAssetUrl: 'https://drive.google.com/file/d/test-thumbnail-p09/view',
      status: 'APPROVED',
      currentVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any);

    // 5. Seed Pinned Comment
    await pinnedCommentsRepository.create({
      id: `PIN-${testVId}`,
      videoId: testVId,
      commentText: 'Challenge: What is the third angle if two angles are 50° and 60°? Drop your answer below!',
      solutionBreakdown: '180 - (50 + 60) = 70 degrees.',
      isApproved: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any);

    // 6. Seed Social Review
    const initialBundle = await SocialReviewService.getReviewPackageBundle(testQId);
    await socialReviewsRepository.create({
      id: `REV-${testVId}`,
      questionId: testQId,
      decision: SocialReviewStatus.APPROVED,
      reviewedVersionHash: initialBundle.currentVersionHash,
      reviewerId: testActor.id,
      reviewerName: testActor.name,
      reviewerRole: testActor.role,
      overallQualityScoreAtReview: 95,
      qualityStatusAtReview: 'EXCELLENT' as any,
      reviewedAt: new Date().toISOString(),
    } as any);

    // ------------------------------------------------------------------------
    // VERIFY STEP 13: PLATFORM PACKAGES
    // ------------------------------------------------------------------------
    console.log('\n--- Step 13: Platform Packages ---');

    // 13.1 YouTube Shorts Adaptation
    const ytPkg = await publishingService.getPlatformPackage(testVId, 'youtube', testActor);
    const ytPassed =
      Boolean(ytPkg) &&
      ytPkg.platform.toLowerCase() === 'youtube' &&
      Boolean(ytPkg.title) &&
      Boolean(ytPkg.caption) &&
      Array.isArray(ytPkg.hashtags) &&
      Boolean(ytPkg.pinnedComment);
    addResult(
      'Step 13',
      'YouTube Shorts Package Projection',
      ytPassed,
      ytPassed ? `Generated Shorts package with title "${ytPkg?.title}" and ${ytPkg?.hashtags?.length} hashtags` : 'Failed to generate YouTube package'
    );

    // 13.2 Instagram Reels Adaptation
    const igPkg = await publishingService.getPlatformPackage(testVId, 'instagram', testActor);
    const igPassed =
      Boolean(igPkg) &&
      igPkg.platform.toLowerCase() === 'instagram' &&
      Boolean(igPkg.caption) &&
      Array.isArray(igPkg.hashtags) &&
      igPkg.hashtags.length > 0;
    addResult(
      'Step 13',
      'Instagram Reels Package Projection',
      igPassed,
      igPassed ? `Generated Instagram caption with ${igPkg?.hashtags?.length} hashtags` : 'Failed to generate Instagram package'
    );

    // 13.3 Facebook Video Adaptation
    const fbPkg = await publishingService.getPlatformPackage(testVId, 'facebook', testActor);
    const fbPassed =
      Boolean(fbPkg) &&
      fbPkg.platform.toLowerCase() === 'facebook' &&
      Boolean(fbPkg.caption) &&
      Array.isArray(fbPkg.hashtags);
    addResult(
      'Step 13',
      'Facebook Video Package Projection',
      fbPassed,
      fbPassed ? `Generated Facebook post package with ${fbPkg?.hashtags?.length} hashtags` : 'Failed to generate Facebook package'
    );

    // 13.4 Invariance & Version Hash Consistency
    const hashPassed =
      Boolean(ytPkg?.versionHash) &&
      ytPkg?.versionHash === igPkg?.versionHash &&
      ytPkg?.versionHash === fbPkg?.versionHash;
    addResult(
      'Step 13',
      'Invariance Fingerprint Hash Locking',
      hashPassed,
      hashPassed ? `All 3 platform packages share locked invariance hash: ${ytPkg?.versionHash?.slice(0, 12)}...` : 'Version hashes diverged across platforms'
    );

    // ------------------------------------------------------------------------
    // VERIFY STEP 14: PUBLISHING PACKAGE
    // ------------------------------------------------------------------------
    console.log('\n--- Step 14: Publishing Package ---');

    // 14.1 Gate D Pre-flight Readiness Analysis
    const videoReadiness = await publishingService.validatePublishReadiness(testVId, { actor: testActor });
    const readinessPassed = Boolean(videoReadiness) && videoReadiness.isReady;
    addResult(
      'Step 14',
      'Gate D Pre-Flight Readiness Checker',
      readinessPassed,
      readinessPassed ? `Readiness evaluated for ${testVId}: isReady=${videoReadiness.isReady}, Thumbnail=${videoReadiness.checklist.thumbnailReady}, Pinned=${videoReadiness.checklist.pinnedCommentReady}` : 'Readiness check failed'
    );

    // 14.2 Consolidated Package Assembly
    const pubRecord = await publishingService.getPublishingByVideoId(testVId);
    const assemblyPassed =
      Boolean(pubRecord) &&
      pubRecord?.videoId === testVId &&
      pubRecord?.questionId === testQId;
    addResult(
      'Step 14',
      'Consolidated Publishing Package Assembly',
      assemblyPassed,
      assemblyPassed ? `Consolidated record ID ${pubRecord?.id} created with canonical correlation to ${testQId}` : 'Failed to assemble publishing package'
    );

    // ------------------------------------------------------------------------
    // VERIFY STEP 15: PUBLISH
    // ------------------------------------------------------------------------
    console.log('\n--- Step 15: Publish ---');

    // 15.1 Schedule Platform Publication
    const schedDate = new Date(Date.now() + 86400000).toISOString();
    const schedRes = await publishingService.schedulePublishing(testVId, 'youtube', schedDate, {
      id: 'USR-001',
      name: 'Admin',
      role: 'ADMIN',
    });
    const schedPassed =
      schedRes.youtube?.status === SocialPublishStatus.SCHEDULED &&
      Boolean(schedRes.youtube?.scheduledAt);
    addResult(
      'Step 15',
      'Manual Publishing Scheduling Orchestration',
      schedPassed,
      schedPassed ? `YouTube Shorts successfully scheduled for ${schedRes.youtube?.scheduledAt}` : 'Scheduling failed'
    );

    // 15.2 Record Live Public URLs (Manual Uploads)
    const runId = Date.now();
    const ytLiveUrl = `https://youtube.com/shorts/test_p09_${runId}`;
    const igLiveUrl = `https://instagram.com/reel/test_p09_${runId}`;
    const fbLiveUrl = `https://facebook.com/watch/test_p09_${runId}`;

    const pubYtRes = await publishingService.markPlatformPublished(testVId, 'youtube', ytLiveUrl, {
      id: 'USR-001',
      name: 'Admin',
      role: 'ADMIN',
    });
    const pubIgRes = await publishingService.markPlatformPublished(testVId, 'instagram', igLiveUrl, {
      id: 'USR-001',
      name: 'Admin',
      role: 'ADMIN',
    });
    const pubFbRes = await publishingService.markPlatformPublished(testVId, 'facebook', fbLiveUrl, {
      id: 'USR-001',
      name: 'Admin',
      role: 'ADMIN',
    });

    const liveRecordPassed =
      pubFbRes.youtube?.status === SocialPublishStatus.PUBLISHED &&
      pubFbRes.youtube?.videoUrl === ytLiveUrl &&
      pubFbRes.instagram?.status === SocialPublishStatus.PUBLISHED &&
      pubFbRes.instagram?.postUrl === igLiveUrl &&
      pubFbRes.facebook?.status === SocialPublishStatus.PUBLISHED &&
      pubFbRes.facebook?.postUrl === fbLiveUrl &&
      pubFbRes.completedPlatformsCount === 3;
    addResult(
      'Step 15',
      'Live Public URL Recording (YouTube, IG, FB)',
      liveRecordPassed,
      liveRecordPassed ? `All 3 platforms recorded live URLs (completedPlatformsCount = ${pubFbRes.completedPlatformsCount}/3)` : 'Live URL recording failed'
    );

    // 15.3 Finalize Publishing Workflow
    const finalizeRes = await publishingService.finalizePublishing(testVId, {
      id: 'USR-001',
      name: 'Admin',
      role: 'ADMIN',
    });
    const updatedVideo = await videosRepository.findById(testVId);
    const finalPassed =
      Boolean(finalizeRes?.video) &&
      updatedVideo?.status === VideoProductionStatus.UPLOADED;
    addResult(
      'Step 15',
      'Publishing Finalization (Transition Video to UPLOADED)',
      finalPassed,
      finalPassed ? `Video ${testVId} successfully transitioned to status UPLOADED upon 3-platform publication` : 'Finalization failed'
    );

    // ------------------------------------------------------------------------
    // CLEANUP TEST FIXTURES
    // ------------------------------------------------------------------------
    try {
      await questionsRepository.deleteRecord(testQId);
      await videosRepository.deleteRecord(testVId);
      await thumbnailsRepository.deleteRecord(`THM-${testVId}`);
      await pinnedCommentsRepository.deleteRecord(`PIN-${testVId}`);
      await socialReviewsRepository.deleteRecord(`REV-${testVId}`);
    } catch {
      // Ignore cleanup error in test
    }
  } catch (err: any) {
    addResult('Error', 'Fatal Test Exception', false, err?.message || String(err));
  }

  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  const totalCount = results.length;
  const success = failedCount === 0 && totalCount > 0;

  console.log('\n======================================================');
  console.log(`📊 PHASE 09 VERIFICATION COMPLETE: ${passedCount}/${totalCount} PASSED`);
  console.log('======================================================\n');

  return {
    success,
    total: totalCount,
    passed: passedCount,
    failed: failedCount,
    results,
  };
}

// Run verification suite
runPhase09Verification().then((res) => {
  if (!res.success) {
    process.exit(1);
  }
});
