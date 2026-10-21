/**
 * BURRA PARIKSHA CMS — Unit Test Suite: Dashboard WIP Aggregation & Stage Resolution
 *
 * Verifies:
 * 1. Single content item with video at Stage 04 (RECORDING) and lazily initialized publishing package (READY)
 *    is counted exactly ONCE in Total WIP and In Production (WIP = 1, NOT 2).
 * 2. Stage 04 (Teleprompter & Filming) is correctly assigned and Stage 10 count remains 0.
 * 3. Cross-collection deduplication prevents duplicate publishing package cards for active videos.
 * 4. Genuine Stage 10 scheduling properly transitions the item to Stage 10 without double counting.
 * 5. Standalone publishing packages are only admitted if genuinely scheduled/in setup.
 * 6. Soft-deleted and archived entities are excluded from active pipeline WIP.
 */

import assert from 'node:assert';
import {
  VideoProductionStatus,
  SocialPublishStatus,
  QuestionDraft,
  Question,
  Video,
  Publishing,
} from '../../shared';

// Extracted pure aggregation logic mirroring DashboardPage.tsx
export function computeDashboardWorkQueue(params: {
  drafts: QuestionDraft[];
  questions: Question[];
  videos: Video[];
  publishingList: Publishing[];
  userRole?: string;
  userId?: string;
}) {
  const { drafts, questions, videos, publishingList, userRole = 'ADMIN', userId = 'USR-001' } = params;
  const items: any[] = [];
  const isUserAdminOrReviewer = ['ADMIN', 'REVIEWER', 'CONTENT_MANAGER', 'QA_REVIEWER'].includes(userRole);

  const publishingByVideoId = new Map<string, Publishing>();
  for (const p of publishingList) {
    if (p.videoId) publishingByVideoId.set(p.videoId, p);
  }

  const seenVideoIds = new Set<string>();

  // 1. Ingest Question Drafts
  for (const d of drafts) {
    if (d.status === 'APPROVED' || (d as any).isDeleted) continue;
    const mode = ((d as any).contentMode || (d as any).productionMode || 'QUESTION_CHALLENGE_SHORT');
    const isSubmitted = d.status === 'SUBMITTED_FOR_REVIEW' || (d as any).workflowStage === 'STAGE_02_VERIFICATION';
    const isChangesRequested = d.status === 'CHANGES_REQUESTED';
    const isDraft = !isSubmitted && !isChangesRequested;

    let stageNum = 1;
    let stageName = 'Question Generation';

    if (isSubmitted) {
      stageNum = 2;
      stageName = 'Question Verification';
    } else if (isChangesRequested) {
      stageNum = 1;
      stageName = 'Question Generation (Revision)';
    } else if (isDraft) {
      stageNum = 1;
      stageName = 'Question Generation';
    }

    items.push({
      id: d.id,
      title: d.questionText || `Draft ${d.id}`,
      contentMode: mode,
      stageNumber: stageNum,
      stageName,
      status: d.status || 'DRAFT',
    });
  }

  // 2. Ingest Questions
  for (const q of questions) {
    if ((q as any).isDeleted || q.status === 'ARCHIVED' || q.status === 'APPROVED') continue;
    if (q.status === 'GENERATED' || q.status === 'DRAFT') {
      const stageNum = q.status === 'GENERATED' ? 2 : 1;
      items.push({
        id: q.id,
        title: q.questionText || `Question ${q.id}`,
        contentMode: ((q as any).contentMode || (q as any).productionMode || 'QUESTION_CHALLENGE_SHORT'),
        stageNumber: stageNum,
        stageName: stageNum === 2 ? 'Question Verification' : 'Question Generation',
        status: q.status,
      });
    }
  }

  // 3. Ingest Videos across stages 03 to 11
  for (const v of videos) {
    const vStatus = v.status as string;
    if (v.status === VideoProductionStatus.CANCELLED || vStatus === 'ARCHIVED' || (v as any).isDeleted) continue;
    seenVideoIds.add(v.id);

    const pub = publishingByVideoId.get(v.id);
    const isPubScheduled = pub && (
      (pub as any).status === 'SCHEDULED' ||
      pub.youtube?.status === SocialPublishStatus.SCHEDULED ||
      pub.instagram?.status === SocialPublishStatus.SCHEDULED ||
      pub.facebook?.status === SocialPublishStatus.SCHEDULED
    );
    const isPubLive = (pub && (
      pub.youtube?.status === SocialPublishStatus.PUBLISHED ||
      (pub.completedPlatformsCount || 0) >= (pub.totalPlatformsCount || 3)
    )) || vStatus === 'UPLOADED' || vStatus === 'PUBLISHED';

    let stageNum = 3;
    let stageName = 'Audience Script';

    switch (vStatus) {
      case 'QUEUED':
      case 'SCRIPT_REQUIRED':
        stageNum = 3;
        stageName = 'Audience Script';
        break;
      case 'SCRIPT_READY':
      case 'RECORDING':
        stageNum = 4;
        stageName = 'Teleprompter & Filming';
        break;
      case 'RECORDED':
        stageNum = 5;
        stageName = 'Raw Video Footage';
        break;
      case 'EDITING':
        stageNum = 6;
        stageName = 'Editing Bay';
        break;
      case 'EDITED':
      case 'FINAL_REVIEW':
        stageNum = 7;
        stageName = 'Final QC';
        break;
      case 'THUMBNAIL_REQUIRED':
        stageNum = 8;
        stageName = 'Thumbnail';
        break;
      case 'READY_TO_UPLOAD':
        if (isPubLive) {
          stageNum = 11;
          stageName = 'Published';
        } else if (isPubScheduled) {
          stageNum = 10;
          stageName = 'Publishing Setup';
        } else {
          stageNum = 9;
          stageName = 'Social Review';
        }
        break;
      case 'UPLOADED':
      case 'PUBLISHED':
        stageNum = 11;
        stageName = 'Published';
        break;
      default:
        stageNum = 3;
        stageName = 'Audience Script';
    }

    const mode = ((v as any).contentMode || (v as any).productionMode || 'QUESTION_CHALLENGE_SHORT');

    items.push({
      id: v.id,
      title: v.title || `Video Production: ${v.id}`,
      contentMode: mode,
      stageNumber: stageNum,
      stageName,
      status: v.status || 'IN_PROGRESS',
    });
  }

  // 4. Ingest Standalone Publishing Records (Stage 10)
  for (const p of publishingList) {
    if ((p as any).isDeleted || (p as any).status === 'ARCHIVED') continue;
    if (p.videoId && seenVideoIds.has(p.videoId)) continue;

    const isScheduled =
      (p as any).status === 'SCHEDULED' ||
      p.youtube?.status === SocialPublishStatus.SCHEDULED ||
      p.instagram?.status === SocialPublishStatus.SCHEDULED ||
      p.facebook?.status === SocialPublishStatus.SCHEDULED;
    const isInSetup =
      (p as any).status === 'IN_SETUP' ||
      (p as any).status === 'READY_TO_PUBLISH';

    if (isScheduled || isInSetup) {
      items.push({
        id: p.id,
        title: `Publishing Package ${p.videoId || p.id}`,
        contentMode: 'QUESTION_CHALLENGE_SHORT',
        stageNumber: 10,
        stageName: 'Publishing Setup',
        status: isScheduled ? 'SCHEDULED' : 'READY',
      });
    }
  }

  const inProductionCount = items.filter((i) => i.stageNumber <= 10).length;
  const stageCounts: Record<number, number> = {};
  for (let s = 1; s <= 15; s++) stageCounts[s] = 0;
  for (const item of items) {
    stageCounts[item.stageNumber] = (stageCounts[item.stageNumber] || 0) + 1;
  }
  const totalWip = Object.entries(stageCounts)
    .filter(([step]) => Number(step) <= 10)
    .reduce((sum, [, count]) => sum + count, 0);

  return {
    items,
    inProductionCount,
    totalWip,
    stageCounts,
  };
}

async function runDashboardWipTests() {
  console.log('============================================================');
  console.log('UNIT TEST: Dashboard WIP Aggregation & Deduplication');
  console.log('============================================================\n');

  let passed = 0;

  // --------------------------------------------------------------------------
  // TEST 1: Exact Production Scenario (Biryani Short: Stage 04 RECORDING + Lazily created Publishing Package)
  // --------------------------------------------------------------------------
  console.log('[Test 1] Production Scenario: Video in RECORDING + Lazy Publishing Package...');
  const prodVideo: any = {
    id: 'vid_262368df-e703-4234-83c5-17c4af6ab5cb',
    title: 'Short: ఒక ప్లేట్ బిర్యానీ ధర రూ. 120...',
    questionId: 'qst_cdd40ef2-8930-4fe7-aa01-16cae00bc48e',
    status: VideoProductionStatus.RECORDING,
    isDeleted: false,
  };

  const prodQuestion: any = {
    id: 'qst_cdd40ef2-8930-4fe7-aa01-16cae00bc48e',
    questionText: 'ఒక ప్లేట్ బిర్యానీ ధర రూ. 120...',
    status: 'APPROVED', // Approved question represented by video
    isDeleted: false,
  };

  const prodPublishing: any = {
    id: 'PUB-vid_262368df-e703-4234-83c5-17c4af6ab5cb',
    videoId: 'vid_262368df-e703-4234-83c5-17c4af6ab5cb',
    questionId: 'qst_cdd40ef2-8930-4fe7-aa01-16cae00bc48e',
    finalVideoStatus: 'READY',
    youtube: { status: 'NOT_STARTED' },
    instagram: { status: 'NOT_STARTED' },
    facebook: { status: 'NOT_STARTED' },
    completedPlatformsCount: 0,
    totalPlatformsCount: 3,
    isDeleted: false,
  };

  const res1 = computeDashboardWorkQueue({
    drafts: [],
    questions: [prodQuestion],
    videos: [prodVideo],
    publishingList: [prodPublishing],
  });

  assert.strictEqual(res1.items.length, 1, 'Exactly 1 work queue item must be returned (no double count)');
  assert.strictEqual(res1.inProductionCount, 1, 'In Production must be exactly 1');
  assert.strictEqual(res1.totalWip, 1, 'Total WIP must be exactly 1');
  assert.strictEqual(res1.stageCounts[4], 1, 'Stage 04 (Teleprompter & Filming) must have count 1');
  assert.strictEqual(res1.stageCounts[10], 0, 'Stage 10 (Publishing Setup) must have count 0');
  assert.strictEqual(res1.items[0].id, prodVideo.id);
  assert.strictEqual(res1.items[0].stageNumber, 4);
  console.log('  ✓ Production scenario resolved: In Production: 1, Total WIP: 1, Stage 04: 1, Stage 10: 0');
  passed++;

  // --------------------------------------------------------------------------
  // TEST 2: Genuine Stage 10 (Video READY_TO_UPLOAD with SCHEDULED publishing)
  // --------------------------------------------------------------------------
  console.log('\n[Test 2] Scheduled Publishing transitions video to Stage 10 without duplicate card...');
  const scheduledVideo: any = {
    id: 'vid_test_sched',
    title: 'Ready Video',
    status: VideoProductionStatus.READY_TO_UPLOAD,
    isDeleted: false,
  };

  const scheduledPublishing: any = {
    id: 'PUB-vid_test_sched',
    videoId: 'vid_test_sched',
    status: 'SCHEDULED',
    youtube: { status: 'SCHEDULED' },
    instagram: { status: 'SCHEDULED' },
    facebook: { status: 'NOT_STARTED' },
    completedPlatformsCount: 0,
    totalPlatformsCount: 3,
    isDeleted: false,
  };

  const res2 = computeDashboardWorkQueue({
    drafts: [],
    questions: [],
    videos: [scheduledVideo],
    publishingList: [scheduledPublishing],
  });

  assert.strictEqual(res2.items.length, 1, 'Exactly 1 item in queue');
  assert.strictEqual(res2.inProductionCount, 1, 'In Production is 1');
  assert.strictEqual(res2.totalWip, 1, 'Total WIP is 1');
  assert.strictEqual(res2.stageCounts[10], 1, 'Stage 10 has count 1');
  assert.strictEqual(res2.stageCounts[9], 0, 'Stage 09 has count 0');
  console.log('  ✓ Scheduled publishing resolves to Stage 10: In Production: 1, Stage 10: 1');
  passed++;

  // --------------------------------------------------------------------------
  // TEST 3: Standalone Publishing Package (No Video in local slice, scheduled)
  // --------------------------------------------------------------------------
  console.log('\n[Test 3] Standalone Scheduled Publishing Package without Video...');
  const standalonePub: any = {
    id: 'PUB-standalone-001',
    videoId: 'vid_missing_local',
    status: 'SCHEDULED',
    youtube: { status: 'SCHEDULED' },
    isDeleted: false,
  };

  const res3 = computeDashboardWorkQueue({
    drafts: [],
    questions: [],
    videos: [],
    publishingList: [standalonePub],
  });

  assert.strictEqual(res3.items.length, 1, 'Standalone scheduled publishing item admitted');
  assert.strictEqual(res3.stageCounts[10], 1);
  console.log('  ✓ Standalone scheduled package admitted at Stage 10');
  passed++;

  // --------------------------------------------------------------------------
  // TEST 4: Standalone Unscheduled / Not-Ready Publishing Package is Ignored
  // --------------------------------------------------------------------------
  console.log('\n[Test 4] Standalone Unscheduled Publishing Package ignored...');
  const standaloneIdlePub: any = {
    id: 'PUB-standalone-idle',
    videoId: 'vid_missing_idle',
    finalVideoStatus: 'READY',
    youtube: { status: 'NOT_STARTED' },
    instagram: { status: 'NOT_STARTED' },
    facebook: { status: 'NOT_STARTED' },
    isDeleted: false,
  };

  const res4 = computeDashboardWorkQueue({
    drafts: [],
    questions: [],
    videos: [],
    publishingList: [standaloneIdlePub],
  });

  assert.strictEqual(res4.items.length, 0, 'Idle standalone publishing must not be admitted');
  assert.strictEqual(res4.inProductionCount, 0);
  assert.strictEqual(res4.totalWip, 0);
  console.log('  ✓ Idle standalone publishing package correctly ignored');
  passed++;

  // --------------------------------------------------------------------------
  // TEST 5: Soft-Deleted and Archived Exclusion
  // --------------------------------------------------------------------------
  console.log('\n[Test 5] Soft-deleted and Archived records excluded from WIP...');
  const deletedVideo: any = {
    id: 'vid_deleted',
    status: VideoProductionStatus.RECORDING,
    isDeleted: true,
  };

  const archivedVideo: any = {
    id: 'vid_archived',
    status: 'ARCHIVED',
    isDeleted: false,
  };

  const approvedDraft: any = {
    id: 'dft_approved',
    status: 'APPROVED',
    isDeleted: false,
  };

  const res5 = computeDashboardWorkQueue({
    drafts: [approvedDraft],
    questions: [],
    videos: [deletedVideo, archivedVideo],
    publishingList: [],
  });

  assert.strictEqual(res5.items.length, 0, 'No deleted, archived, or approved draft items in active WIP');
  assert.strictEqual(res5.totalWip, 0);
  console.log('  ✓ Deleted, archived, and approved drafts properly excluded');
  passed++;

  console.log('\n============================================================');
  console.log(`ALL ${passed} DASHBOARD WIP TESTS PASSED!`);
  console.log('============================================================\n');
}

runDashboardWipTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
