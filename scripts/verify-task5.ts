import { questionService } from '../src/lib/services/question.service';
import { videoService } from '../src/lib/services/video.service';
import { scriptService } from '../src/lib/services/script.service';
import { taxonomyService } from '../src/lib/services/taxonomy.service';
import {
  questionsRepository,
  videosRepository,
  questionVideosRepository,
  scriptsRepository,
  scriptVersionsRepository,
  workflowRepository,
} from '../src/lib/repositories';
import {
  DifficultyLevel,
  PriorityLevel,
  QuestionStatus,
  QuestionStyle,
  VideoProductionStatus,
} from '../src/types';

async function delay(ms: number) {
  return new Promise((r) => setTimeout(r, Math.min(ms, 50)));
}

async function runTask5Verification() {
  console.log('================================================================');
  console.log('TASK 5: QUESTION TO VIDEO PIPELINE END-TO-END VERIFICATION');
  console.log('================================================================');

  const actor = { id: 'USR-PROD-01', name: 'Production Lead (Ravi)' };

  // STEP 1: Obtain a valid taxonomy leaf node
  console.log('\n--- 1. Fetching Taxonomy Tree ---');
  const tree = await taxonomyService.getTaxonomyTree();
  if (!tree || tree.length === 0) throw new Error('No categories found');
  const cat = tree[0];
  const topic = cat.topics[0];
  const subtopic = topic.subtopics[0];
  console.log(`Taxonomy selected: [${cat.id}] ${cat.name} > [${topic.id}] ${topic.name} > [${subtopic.id}] ${subtopic.name}`);

  // STEP 2: Create a fresh test question and approve it
  console.log('\n--- 2. Creating & Approving Test Question in QUESTIONS ---');
  const createdQ = await questionService.createQuestion(
    {
      categoryId: cat.id,
      topicId: topic.id,
      subtopicId: subtopic.id,
      difficulty: DifficultyLevel.HARD,
      questionText: 'A train 180 meters long running at 72 km/h crosses another train running in the opposite direction at 108 km/h in 6 seconds. What is the length of the second train?',
      options: {
        a: '120 meters',
        b: '150 meters',
        c: '160 meters',
        d: '180 meters',
      },
      correctAnswer: 'A',
      explanation: 'Relative speed = 72 + 108 = 180 km/h = 180 * (5/18) = 50 m/s. Total distance in 6s = 50 * 6 = 300m. Length of 2nd train = 300 - 180 = 120m.',
      realWorldContext: 'Vande Bharat vs Goods train crossing at Warangal junction',
      questionStyle: QuestionStyle.REAL_WORLD_SCENARIO,
      tags: ['TASK5_TEST', 'TRAINS', 'RELATIVE_SPEED'],
    },
    actor
  );
  console.log('Created Question ID:', createdQ.id, 'Status:', createdQ.status, 'VideoStatus:', createdQ.videoStatus);

  await delay(1000);

  // Approve question so it is legally eligible for video queueing
  const approvedQ = await questionService.updateStatus(createdQ.id, QuestionStatus.APPROVED, actor, 'Approved for Shorts production');
  console.log('Approved Question ID:', approvedQ.id, 'Status:', approvedQ.status);
  if (approvedQ.status !== QuestionStatus.APPROVED) {
    throw new Error('Question approval failed');
  }

  await delay(1000);

  // STEP 3: Queue Question for Video Production
  console.log('\n--- 3. Queueing Approved Question for Video Production ---');
  const queuedVideo = await videoService.queueApprovedQuestion(
    {
      questionId: approvedQ.id,
      title: 'Shorts: Vande Bharat Relative Speed Trick',
      priority: PriorityLevel.HIGH,
      assignedHost: 'Telugu Presenter (Swathi)',
      assignedEditor: 'Lead Editor (Kiran)',
      notes: 'Task 5 automated pipeline validation test video',
      targetDurationSeconds: 45,
    },
    actor
  );
  console.log('Queued Video ID:', queuedVideo.id);
  console.log('Video Title:', queuedVideo.title);
  console.log('Video Status:', queuedVideo.status);
  console.log('Video Priority:', queuedVideo.priority);
  console.log('Video Assigned Host:', queuedVideo.assignedHost);
  console.log('Video Assigned Editor:', queuedVideo.assignedEditor);

  // STEP 4: Transition to SCRIPT_REQUIRED
  console.log('\n--- 4. Transitioning Video to SCRIPT_REQUIRED ---');
  await delay(1000);
  const scriptReqVideo = await videoService.transitionStatus(
    queuedVideo.id,
    VideoProductionStatus.SCRIPT_REQUIRED,
    actor,
    'Moved to script drafting phase'
  );
  console.log('Video status updated to:', scriptReqVideo.status);

  // STEP 5: Create Initial Script (Version 1)
  console.log('\n--- 5. Generating & Saving Teleprompter Script (Version 1) ---');
  await delay(1000);
  const scriptPayloadV1 = {
    hookText: '🔥 Vande Bharat vs Goods train crossing! 95% students get trapped calculating this wrong.',
    problemStatement: 'A train 180m at 72km/h crosses an opposite train at 108km/h in 6s. What is the 2nd train length?',
    stepByStepSolution: 'Step 1: Add relative speeds (72+108=180 km/h).\nStep 2: Convert to m/s by * 5/18 = 50 m/s.\nStep 3: Total distance = 50 * 6 = 300m.\nStep 4: 2nd train = 300 - 180 = 120m.',
    speedTrickOrTakeaway: '💡 Burra Trick: 180 km/h is directly 50 m/s! Multiply by 6 to get 300m and subtract 180 in 5 seconds.',
    callToAction: 'Follow @BurraPariksha for daily Telugu aptitude shortcuts & save this reel!',
    notes: 'Teleprompter script V1 for Swathi',
    changeSummary: 'Initial script creation with Burra trick',
    editedBy: actor.name,
  };

  const v1Result = await scriptService.saveScript(queuedVideo.id, scriptPayloadV1, actor);
  console.log('Saved Script ID:', v1Result.script.id);
  console.log('Script Current Version:', v1Result.script.currentVersion);
  console.log('Version Snapshot ID:', v1Result.version?.id);

  // STEP 6: Save Revised Script (Version 2)
  console.log('\n--- 6. Saving Revised Script (Version 2) with Snapshot ---');
  await delay(1000);
  const scriptPayloadV2 = {
    ...scriptPayloadV1,
    hookText: '⚡ 6 సెకన్లలో రెండు రైళ్లు దాటుకుంటే రెండో రైలు పొడవు ఎంత? Burra Trick తో 5 సెకన్లలో చేయండి!',
    createNewVersion: true,
    changeSummary: 'Added bilingual Telugu punchy hook',
    editedBy: actor.name,
  };

  const v2Result = await scriptService.saveScript(queuedVideo.id, scriptPayloadV2, actor);
  console.log('Updated Script Current Version:', v2Result.script.currentVersion);
  console.log('Version 2 Snapshot ID:', v2Result.version?.id);

  // STEP 7: Finalize & Mark Script Ready
  console.log('\n--- 7. Finalizing Script & Transitioning Video to SCRIPT_READY ---');
  await delay(1000);
  const markReadyResult = await scriptService.markScriptReady(queuedVideo.id, actor, 'Approved by Content Lead for shoot');
  console.log('Mark Ready Result:', {
    scriptId: markReadyResult.script.id,
    videoStatus: markReadyResult.videoStatus,
  });

  // STEP 8: Deep Relationship & Foreign Key Verification across all 6 Entities
  console.log('\n--- 8. Verifying Referential Integrity & Entity Connections ---');
  await delay(1000);

  const [
    dbQuestion,
    dbVideo,
    dbQuestionVideos,
    dbScript,
    dbScriptVersions,
    dbWorkflows,
  ] = await Promise.all([
    questionsRepository.findById(approvedQ.id),
    videosRepository.findById(queuedVideo.id),
    questionVideosRepository.findByVideoId(queuedVideo.id),
    scriptsRepository.findByVideoId(queuedVideo.id),
    scriptVersionsRepository.findByScriptId(v1Result.script.id),
    workflowRepository.findByEntity('VIDEO', queuedVideo.id),
  ]);

  console.log('\nEntity Verification Inspection:');
  console.log('1. QUESTIONS entity:', {
    id: dbQuestion?.id,
    status: dbQuestion?.status,
    videoStatus: dbQuestion?.videoStatus,
    hasUpdatedTimestamp: Boolean(dbQuestion?.updatedAt),
  });

  console.log('2. VIDEOS entity:', {
    id: dbVideo?.id,
    questionId: dbVideo?.questionId,
    status: dbVideo?.status,
    priority: dbVideo?.priority,
    assignedHost: dbVideo?.assignedHost,
    assignedEditor: dbVideo?.assignedEditor,
    timestamps: { created: dbVideo?.createdAt, updated: dbVideo?.updatedAt },
  });

  console.log('3. QUESTION_VIDEOS join entity:', {
    count: dbQuestionVideos.length,
    records: dbQuestionVideos.map((qv) => ({ id: qv.id, qId: qv.questionId, vId: qv.videoId })),
  });

  console.log('4. SCRIPT entity:', {
    id: dbScript?.id,
    videoId: dbScript?.videoId,
    questionId: dbScript?.questionId,
    currentVersion: dbScript?.currentVersion,
    hookTextLength: dbScript?.hookText.length,
  });

  console.log('5. SCRIPT_VERSIONS entities:', {
    count: dbScriptVersions.length,
    versions: dbScriptVersions.map((sv) => ({ id: sv.id, versionNumber: sv.versionNumber, changeSummary: sv.changeSummary })),
  });

  console.log('6. WORKFLOW audit transitions:', {
    count: dbWorkflows.length,
    transitions: dbWorkflows.map((wf) => ({ from: wf.fromStatus, to: wf.toStatus, by: wf.triggeredBy, time: wf.timestamp })),
  });

  // Strict Assertions
  const checkQ = dbQuestion?.id === approvedQ.id && dbQuestion?.videoStatus === VideoProductionStatus.SCRIPT_READY;
  const checkV = dbVideo?.id === queuedVideo.id && dbVideo?.questionId === approvedQ.id && dbVideo?.status === VideoProductionStatus.SCRIPT_READY && dbVideo?.priority === PriorityLevel.HIGH;
  const checkQV = dbQuestionVideos.some((qv) => qv.questionId === approvedQ.id && qv.videoId === queuedVideo.id);
  const checkS = dbScript?.id === v1Result.script.id && dbScript?.videoId === queuedVideo.id && dbScript?.questionId === approvedQ.id && dbScript?.currentVersion === 2;
  const checkSV = dbScriptVersions.length >= 2 && dbScriptVersions.some((v) => v.versionNumber === 1) && dbScriptVersions.some((v) => v.versionNumber === 2);
  const checkWF = dbWorkflows.length >= 2 && dbWorkflows.some((w) => w.toStatus === VideoProductionStatus.QUEUED) && dbWorkflows.some((w) => w.toStatus === VideoProductionStatus.SCRIPT_READY);

  console.log('\nIntegrity Assertion Checks:');
  console.log('- [QUESTIONS] VideoStatus synced to SCRIPT_READY:', checkQ ? 'PASS' : 'FAIL');
  console.log('- [VIDEOS] Status SCRIPT_READY, Priority HIGH, correct questionId:', checkV ? 'PASS' : 'FAIL');
  console.log('- [QUESTION_VIDEOS] Foreign key pair (questionId <-> videoId) established:', checkQV ? 'PASS' : 'FAIL');
  console.log('- [SCRIPT] Linked to videoId & questionId with currentVersion 2:', checkS ? 'PASS' : 'FAIL');
  console.log('- [SCRIPT_VERSIONS] Immutable snapshots for V1 & V2 exist:', checkSV ? 'PASS' : 'FAIL');
  console.log('- [WORKFLOW] Stage transition history logged for VIDEO:', checkWF ? 'PASS' : 'FAIL');

  if (!checkQ || !checkV || !checkQV || !checkS || !checkSV || !checkWF) {
    throw new Error('Pipeline integrity assertions failed!');
  }

  // STEP 9: Verify Video Queue & Filtering APIs
  console.log('\n--- 9. Verifying Video Queue Retrieval & Filtering ---');
  await delay(1000);

  // 9a. General queue retrieval
  const allQueueVideos = await videoService.getVideos();
  const queueFound = allQueueVideos.find((v) => v.id === queuedVideo.id);
  console.log('Video Queue retrieval by ID:', queueFound ? 'PASS (Found in queue)' : 'FAIL');
  if (!queueFound) throw new Error('Created video not found in video queue');

  // Verify enrichment
  console.log('Video Queue item question enrichment:', {
    enrichedQuestionText: queueFound.question?.questionText?.slice(0, 50) + '...',
    categoryName: queueFound.question?.categoryName,
    topicName: queueFound.question?.topicName,
  });

  // 9b. Filter by Status: SCRIPT_READY
  const readyFilter = await videoService.getVideos({ status: VideoProductionStatus.SCRIPT_READY });
  const inReady = readyFilter.some((v) => v.id === queuedVideo.id);
  console.log(`Status Filter (SCRIPT_READY: ${readyFilter.length} items): ${inReady ? 'PASS' : 'FAIL'}`);

  // 9c. Filter by Priority: HIGH
  const highFilter = await videoService.getVideos({ priority: PriorityLevel.HIGH });
  const inHigh = highFilter.some((v) => v.id === queuedVideo.id);
  console.log(`Priority Filter (HIGH: ${highFilter.length} items): ${inHigh ? 'PASS' : 'FAIL'}`);

  // 9d. Search Query Filter
  const searchFilter = await videoService.getVideos({ search: 'Vande Bharat' });
  const inSearch = searchFilter.some((v) => v.id === queuedVideo.id);
  console.log(`Search Query Filter ("Vande Bharat": ${searchFilter.length} items): ${inSearch ? 'PASS' : 'FAIL'}`);

  // 9e. Kanban / Production Stats Aggregation
  const stats = await videoService.getProductionStats();
  console.log('\nProduction Kanban Aggregated Stats:', {
    total: stats.total,
    queued: stats.queued,
    scriptRequired: stats.scriptRequired,
    scriptReady: stats.scriptReady,
    byPriority: stats.byPriority,
  });
  const statsValid = stats.scriptReady >= 1 && stats.byPriority.high >= 1;
  console.log('Kanban Stats Calculation:', statsValid ? 'PASS' : 'FAIL');

  if (!inReady || !inHigh || !inSearch || !statsValid) {
    throw new Error('Filtering or queue retrieval assertion failed');
  }

  // 9f. Detailed Single Video Fetch
  const enrichedVideo = await videoService.getVideoById(queuedVideo.id);
  console.log('\nEnriched Video Record by ID:', {
    id: enrichedVideo?.id,
    title: enrichedVideo?.title,
    questionText: enrichedVideo?.question?.questionText?.slice(0, 40) + '...',
    workflowCount: enrichedVideo?.workflowHistory?.length,
    auditLogCount: enrichedVideo?.auditLogs?.length,
  });

  console.log('\n================================================================');
  console.log('TASK 5: ALL TESTS PASSED SUCCESSFULLY (PIPELINE INTEGRITY VERIFIED)');
  console.log('================================================================');
}

runTask5Verification().catch((err) => {
  console.error('TASK 5 FAILURE:', err);
  process.exit(1);
});
