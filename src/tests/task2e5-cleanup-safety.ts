/**
 * BURRA PARIKSHA CMS - Task 2E.5.1 Cleanup & Safety Verification Script
 */

import {
  questionsRepository,
  videosRepository,
  scriptsRepository,
  thumbnailsRepository,
  pinnedCommentsRepository,
  publishingRepository,
  sequencesRepository,
  auditLogRepository,
} from '../lib/repositories';
import { publishingService } from '../lib/services/publishing.service';
import { SocialPublishStatus, VideoProductionStatus, QuestionStatus, UserRole } from '../types';

async function runCleanupAndSafety() {
  console.log('======================================================================');
  console.log('TASK 2E.5.1 — CLEAN UP PUBLISHING TEST DATA & HARDEN TEST SAFETY');
  console.log('======================================================================\n');

  const TARGET_VIDEO_ID = 'BP-V-000018';
  const TARGET_PUB_ID = 'PUB-000018';
  const TARGET_QUESTION_ID = 'BP-Q-000003';
  const TARGET_SCRIPT_ID = 'BP-S-000005';
  const TARGET_THUMB_ID = 'BP-T-000008';
  const TARGET_PIN_ID = 'BP-PIN-000008';

  const ACTOR = {
    id: 'USR-001',
    name: 'Content Lead',
    role: UserRole.PUBLISHING_MANAGER,
  };

  // STEP 1 — INSPECT CURRENT PUB-000018 RECORD
  console.log('--- STEP 1: INSPECT CURRENT PUBLISHING RECORD PUB-000018 ---');
  const pub = await publishingRepository.findById(TARGET_PUB_ID);
  if (!pub) {
    throw new Error(`Publishing record "${TARGET_PUB_ID}" not found.`);
  }

  console.log(`- Record ID: ${pub.id}`);
  console.log(`- Video ID: ${pub.videoId}`);
  console.log(`- Question ID: ${pub.questionId}`);
  console.log(`- Current YouTube Status: ${pub.youtube?.status} (URL: "${pub.youtube?.videoUrl || ''}")`);
  console.log(`- Current Instagram Status: ${pub.instagram?.status} (URL: "${pub.instagram?.postUrl || ''}")`);
  console.log(`- Current Facebook Status: ${pub.facebook?.status} (URL: "${pub.facebook?.postUrl || ''}")`);
  console.log(`- Current Completed Platforms: ${pub.completedPlatformsCount} / ${pub.totalPlatformsCount}`);

  const hasTestUrls =
    pub.youtube?.videoUrl?.includes('test-') ||
    pub.instagram?.postUrl?.includes('test-') ||
    pub.facebook?.postUrl?.includes('test-');
  console.log(`- Contains Test URLs from Task 2E.5: ${hasTestUrls}`);

  // STEP 2 & 4 — CLEAN UP TEST DATA
  console.log('\n--- STEP 4: RESET PUB-000018 TO CLEAN UNPUBLISHED STATE ---');
  const thumbnail = await thumbnailsRepository.findByVideoId(TARGET_VIDEO_ID);
  const pinnedComment = await pinnedCommentsRepository.findByVideoId(TARGET_VIDEO_ID);

  const resetPayload = {
    youtube: {
      status: SocialPublishStatus.NOT_STARTED,
      videoUrl: undefined,
      publishedAt: undefined,
      notes: undefined,
    },
    instagram: {
      status: SocialPublishStatus.NOT_STARTED,
      postUrl: undefined,
      publishedAt: undefined,
      notes: undefined,
    },
    facebook: {
      status: SocialPublishStatus.NOT_STARTED,
      postUrl: undefined,
      publishedAt: undefined,
      notes: undefined,
    },
    thumbnailReady: thumbnail?.status === 'APPROVED',
    pinnedCommentReady: Boolean(pinnedComment?.isApproved),
    completedPlatformsCount: 0,
    totalPlatformsCount: 3,
    finalVideoStatus: 'READY' as const,
  };

  const updatedPub = await publishingService.updatePublishingRecord(
    TARGET_PUB_ID,
    resetPayload,
    ACTOR
  );

  console.log(`- Cleaned PUB-000018:`);
  console.log(`  * YouTube: ${updatedPub.youtube?.status} (URL: "${updatedPub.youtube?.videoUrl || ''}")`);
  console.log(`  * Instagram: ${updatedPub.instagram?.status} (URL: "${updatedPub.instagram?.postUrl || ''}")`);
  console.log(`  * Facebook: ${updatedPub.facebook?.status} (URL: "${updatedPub.facebook?.postUrl || ''}")`);
  console.log(`  * Completed Platforms: ${updatedPub.completedPlatformsCount} / ${updatedPub.totalPlatformsCount}`);
  console.log(`  * Thumbnail Ready: ${updatedPub.thumbnailReady}`);
  console.log(`  * Pinned Comment Ready: ${updatedPub.pinnedCommentReady}`);

  // STEP 5 — VERIFY NORMAL MANUAL PUBLISHING INTEGRITY & VALIDATION
  console.log('\n--- STEP 5: VERIFY NORMAL MANUAL PUBLISHING FUNCTIONALITY ---');
  const readiness = await publishingService.validatePublishReadiness(TARGET_VIDEO_ID, {
    skipAudit: true,
    actor: ACTOR,
  });
  console.log(`- Readiness Check Working:`);
  console.log(`  * Video Status: ${readiness.videoStatus}`);
  console.log(`  * Script Ready: ${readiness.checklist.scriptReady}`);
  console.log(`  * Thumbnail Ready: ${readiness.checklist.thumbnailReady}`);
  console.log(`  * Pinned Comment Ready: ${readiness.checklist.pinnedCommentReady}`);
  console.log(`  * Video Ready: ${readiness.checklist.videoReady} (Correctly false while in SCRIPT_READY)`);

  // STEP 6 — VERIFY DATA INTEGRITY
  console.log('\n--- DATA INTEGRITY VERIFICATION ---');
  const q = await questionsRepository.findById(TARGET_QUESTION_ID);
  console.log(`- Question ${TARGET_QUESTION_ID} Intact: ${q?.status === QuestionStatus.APPROVED}`);

  const v = await videosRepository.findById(TARGET_VIDEO_ID);
  console.log(`- Video ${TARGET_VIDEO_ID} Intact: ${v?.status === VideoProductionStatus.SCRIPT_READY}`);

  const s = await scriptsRepository.findById(TARGET_SCRIPT_ID);
  console.log(`- Script ${TARGET_SCRIPT_ID} Intact: ${s?.currentVersion === 2}`);

  const t = await thumbnailsRepository.findById(TARGET_THUMB_ID);
  console.log(`- Thumbnail ${TARGET_THUMB_ID} Intact: ${t?.status === 'APPROVED' && t?.currentVersion === 2}`);

  const p = await pinnedCommentsRepository.findById(TARGET_PIN_ID);
  console.log(`- Pinned Comment ${TARGET_PIN_ID} Intact: ${p?.isApproved === true}`);

  const seqs = await sequencesRepository.findAll();
  console.log(`- Sequences Count Preserved: ${seqs.length}`);

  console.log('\n======================================================================');
  console.log('TASK 2E.5.1 CLEANUP & SAFETY VERIFICATION COMPLETE');
  console.log('======================================================================');
}

runCleanupAndSafety().catch((err) => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
