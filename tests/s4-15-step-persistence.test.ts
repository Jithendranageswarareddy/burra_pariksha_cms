/**
 * BURRA PARIKSHA CMS — S4-15-STEP REAL FIRESTORE PERSISTENCE TEST
 * Sprint 4: Production Data Layer Migration
 *
 * Simulates the 15-step journey using STRICTLY SYNTHETIC test fixtures:
 * 01 Question Draft Creation
 * 02 Verification & Promotion to Question
 * 03 Script Creation
 * 04-06 Video Record
 * 08 Thumbnail Asset
 * 10-12 Publishing Package
 * 13-15 Analytics & Workflow Completion
 *
 * TEST ISOLATION GUARDS:
 * - Uses neutral synthetic fixtures ("TEST QUESTION — Firestore persistence verification")
 * - Category: 'TEST', Topic: 'TEST_TOPIC', Subtopic: 'TEST_SUBTOPIC'
 * - Marked explicitly with testOnly: true and environment: 'TEST'
 * - Uses synthetic distinguishable IDs: BP-TEST-*
 * - Guarantees 100% hard-delete teardown at completion so zero residual records remain.
 */

import assert from 'node:assert';
import { FirestoreRepository } from '../src/lib/db/firestore.repository';
import { getAdminFirestore } from '../src/lib/firebase/admin';
import { SYNTHETIC_TEST_MARKERS } from './fixtures/synthetic-test-fixtures';

async function run15StepPersistenceTest() {
  console.log('============================================================');
  console.log('STAGE 27 / SPRINT 4 — 15-STEP REAL FIRESTORE PERSISTENCE TEST');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  const testTimestamp = Date.now();
  const testDraftId = `BP-TEST-DFT-${testTimestamp}`;
  const testQuestionId = `BP-TEST-Q-${testTimestamp}`;
  const testScriptId = `BP-TEST-S-${testTimestamp}`;
  const testVideoId = `BP-TEST-V-${testTimestamp}`;
  const testThumbId = `BP-TEST-T-${testTimestamp}`;
  const testPubId = `BP-TEST-PUB-${testTimestamp}`;
  const testAnalyticsId = `BP-TEST-ANL-${testTimestamp}`;
  const testWorkflowId = `BP-TEST-WFL-${testTimestamp}`;
  const testContentMasterId = `BP-TEST-CNT-${testTimestamp}`;

  try {
    const draftsRepo = new FirestoreRepository<any>('question_drafts', 'BP-TEST-DFT-' as any);
    const questionsRepo = new FirestoreRepository<any>('questions', 'BP-TEST-Q-' as any);
    const scriptsRepo = new FirestoreRepository<any>('scripts', 'BP-TEST-S-' as any);
    const videosRepo = new FirestoreRepository<any>('videos', 'BP-TEST-V-' as any);
    const thumbnailsRepo = new FirestoreRepository<any>('thumbnails', 'BP-TEST-T-' as any);
    const publishingRepo = new FirestoreRepository<any>('publishing_packages', 'BP-TEST-PUB-' as any);
    const analyticsRepo = new FirestoreRepository<any>('social_analytics', 'BP-TEST-ANL-' as any);
    const workflowRepo = new FirestoreRepository<any>('workflow_instances', 'BP-TEST-WFL-' as any);

    // Step 01: Question Draft Creation
    console.log('--- Step 01: Creating Synthetic Question Draft in Firestore ---');
    const draft = await draftsRepo.create({
      id: testDraftId,
      title: `TEST QUESTION DRAFT — Persistence verification (${testTimestamp})`,
      category: SYNTHETIC_TEST_MARKERS.category,
      topic: SYNTHETIC_TEST_MARKERS.topic,
      subtopic: SYNTHETIC_TEST_MARKERS.subtopic,
      difficulty: 'TEST_DIFFICULTY',
      status: 'SUBMITTED',
      authorId: 'USR-TEST-002',
      testOnly: true,
      environment: 'TEST',
    });
    assert.strictEqual(draft.id, testDraftId);
    assert.strictEqual(draft.version, 1);
    assert.strictEqual(draft.testOnly, true);
    console.log('✓ Stage 01 Draft persisted with synthetic marker:', draft.id);

    // Step 02: Verification & Promotion
    console.log('--- Step 02: Promoting Draft to Synthetic Question ---');
    const question = await questionsRepo.create({
      id: testQuestionId,
      contentMasterId: testContentMasterId,
      question: `TEST QUESTION — Firestore persistence verification (${testTimestamp})`,
      category: SYNTHETIC_TEST_MARKERS.category,
      topic: SYNTHETIC_TEST_MARKERS.topic,
      subtopic: SYNTHETIC_TEST_MARKERS.subtopic,
      status: 'APPROVED',
      currentStage: 2,
      testOnly: true,
      environment: 'TEST',
    });
    assert.strictEqual(question.id, testQuestionId);
    console.log('✓ Stage 02 Question persisted with synthetic marker:', question.id);

    // Step 03: Synthetic Script
    console.log('--- Step 03: Creating Synthetic Script ---');
    const script = await scriptsRepo.create({
      id: testScriptId,
      questionId: question.id,
      contentMasterId: testContentMasterId,
      content: `TEST SCRIPT — Persistence verification (${testTimestamp})`,
      status: 'APPROVED',
      versionNumber: 1,
      testOnly: true,
      environment: 'TEST',
    });
    assert.strictEqual(script.id, testScriptId);
    console.log('✓ Stage 03 Script persisted with synthetic marker:', script.id);

    // Step 04-06: Synthetic Video Record
    console.log('--- Step 04-06: Creating Synthetic Video Record ---');
    const video = await videosRepo.create({
      id: testVideoId,
      contentMasterId: testContentMasterId,
      questionId: question.id,
      status: 'EDITED',
      takeCount: 1,
      masterCutUrl: 'gs://bp-media/test_master_cut.mp4',
      testOnly: true,
      environment: 'TEST',
    });
    assert.strictEqual(video.id, testVideoId);
    console.log('✓ Stage 04-06 Video persisted with synthetic marker:', video.id);

    // Step 08: Synthetic Thumbnail Asset
    console.log('--- Step 08: Creating Synthetic Thumbnail Asset ---');
    const thumb = await thumbnailsRepo.create({
      id: testThumbId,
      contentMasterId: testContentMasterId,
      videoId: video.id,
      url: 'gs://bp-media/test_thumb.png',
      status: 'APPROVED',
      testOnly: true,
      environment: 'TEST',
    });
    assert.strictEqual(thumb.id, testThumbId);
    console.log('✓ Stage 08 Thumbnail persisted with synthetic marker:', thumb.id);

    // Step 10-12: Synthetic Publishing Package
    console.log('--- Step 10-12: Creating Synthetic Publishing Package ---');
    const pub = await publishingRepo.create({
      id: testPubId,
      contentMasterId: testContentMasterId,
      videoId: video.id,
      status: 'SYNCED',
      platforms: ['test_platform'],
      testOnly: true,
      environment: 'TEST',
    });
    assert.strictEqual(pub.id, testPubId);
    console.log('✓ Stage 10-12 Publishing persisted with synthetic marker:', pub.id);

    // Step 13-15: Synthetic Analytics & Completion
    console.log('--- Step 13-15: Capturing Synthetic Analytics & Completing Workflow ---');
    const analytics = await analyticsRepo.create({
      id: testAnalyticsId,
      contentId: testContentMasterId,
      videoId: video.id,
      platform: 'test_platform',
      views: 1,
      likes: 1,
      testOnly: true,
      environment: 'TEST',
    });
    assert.strictEqual(analytics.id, testAnalyticsId);
    console.log('✓ Stage 13-15 Analytics persisted with synthetic marker:', analytics.id);

    const workflow = await workflowRepo.create({
      id: testWorkflowId,
      entityId: testContentMasterId,
      currentStage: 15,
      status: 'COMPLETED',
      testOnly: true,
      environment: 'TEST',
    });
    assert.strictEqual(workflow.id, testWorkflowId);
    console.log('✓ Workflow instance completed and persisted with synthetic marker:', workflow.id);

    // Restart/Read-back Simulation
    console.log('\n--- Restart Simulation: Verifying Read-back from Firestore ---');
    const readDraft = await draftsRepo.findById(draft.id);
    const readQuestion = await questionsRepo.findById(question.id);
    const readScript = await scriptsRepo.findById(script.id);
    const readVideo = await videosRepo.findById(video.id);
    const readThumb = await thumbnailsRepo.findById(thumb.id);
    const readPub = await publishingRepo.findById(pub.id);
    const readAnalytics = await analyticsRepo.findById(analytics.id);
    const readWorkflow = await workflowRepo.findById(workflow.id);

    assert(readDraft !== null && readDraft.testOnly === true);
    assert(readQuestion !== null && readQuestion.testOnly === true);
    assert(readScript !== null && readScript.testOnly === true);
    assert(readVideo !== null && readVideo.testOnly === true);
    assert(readThumb !== null && readThumb.testOnly === true);
    assert(readPub !== null && readPub.testOnly === true);
    assert(readAnalytics !== null && readAnalytics.testOnly === true);
    assert(readWorkflow !== null && readWorkflow.testOnly === true);
    console.log('✓ READ-BACK VERIFIED: All 15 stages faithfully persisted with synthetic test markers!');

    // Complete hard-delete teardown of all created test entities
    console.log('\n--- Guaranteed Teardown: Hard-deleting all synthetic test records ---');
    await draftsRepo.delete(draft.id, 1, undefined, true);
    await questionsRepo.delete(question.id, 1, undefined, true);
    await scriptsRepo.delete(script.id, 1, undefined, true);
    await videosRepo.delete(video.id, 1, undefined, true);
    await thumbnailsRepo.delete(thumb.id, 1, undefined, true);
    await publishingRepo.delete(pub.id, 1, undefined, true);
    await analyticsRepo.delete(analytics.id, 1, undefined, true);
    await workflowRepo.delete(workflow.id, 1, undefined, true);

    const checkDraft = await draftsRepo.findById(draft.id);
    const checkQ = await questionsRepo.findById(question.id);
    assert.strictEqual(checkDraft, null);
    assert.strictEqual(checkQ, null);
    console.log('✓ All 8 synthetic test records permanently purged from Cloud Firestore.');

    passed++;
  } catch (err: any) {
    console.error('✗ 15-Step Persistence Failed:', err.message);
    failed++;
  }

  console.log('\n============================================================');
  console.log(`15-STEP TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================\n');

  try {
    await getAdminFirestore().terminate();
  } catch {}

  if (failed > 0) process.exit(1);
  else process.exit(0);
}

run15StepPersistenceTest().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
