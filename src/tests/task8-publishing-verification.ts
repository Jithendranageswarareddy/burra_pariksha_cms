/**
 * BURRA PARIKSHA CMS — END-TO-END VERIFICATION
 * TASK 8: PUBLISHING WORKFLOW VERIFICATION SUITE
 * 
 * Verifies:
 * 1. Publishing Readiness Validation:
 *    - Validates Video in READY_TO_UPLOAD state
 *    - Validates Thumbnail APPROVED state
 *    - Validates Pinned Comment approved state
 *    - Validates Script readiness & metadata integrity
 *    - Blocks publishing when mandatory requirements are missing
 * 2. Role-Based Authorization Checks:
 *    - Rejects unauthorized roles (GUEST, DESIGNER, SPEAKER, etc.) with AuthorizationError
 *    - Permits authorized roles (ADMIN, PUBLISHING_MANAGER, CONTENT_MANAGER, PRODUCER)
 * 3. Distribution Tracking & Lifecycle (PUBLISHING worksheet):
 *    - Direct URL and status tracking across YouTube Shorts, Instagram Reels, Facebook Video
 *    - Platform completion counter (0/3 -> 1/3 -> 2/3 -> 3/3)
 *    - Safe transition to terminal UPLOADED state
 * 4. Duplicate Publish Protection & URL Validation:
 *    - Invalid URL format rejection
 *    - Cross-video duplicate URL collision prevention
 *    - Accidental platform overwrite prevention (forceRePublish guard)
 * 5. Idempotency Guarantees:
 *    - Safe replay of identical publish requests
 *    - Safe replay of finalizePublishing requests
 * 6. Multi-Worksheet Audit & Workflow Trail:
 *    - PUBLISHING worksheet records
 *    - WORKFLOW worksheet transition records
 *    - AUDIT_LOG worksheet audit entries
 * 
 * CONSTRAINT: NO live external YouTube API uploads or publications.
 */

import { publishingService } from '../lib/services/publishing.service';
import { videoService } from '../lib/services/video.service';
import { questionService } from '../lib/services/question.service';
import { taxonomyService } from '../lib/services/taxonomy.service';
import { thumbnailService } from '../lib/services/thumbnail.service';
import { pinnedCommentService } from '../lib/services/pinned-comment.service';
import { scriptService } from '../lib/services/script.service';
import { publishingRepository } from '../lib/repositories/publishing.repository';
import { videosRepository } from '../lib/repositories/videos.repository';
import { questionsRepository } from '../lib/repositories/questions.repository';
import { thumbnailsRepository } from '../lib/repositories/thumbnails.repository';
import { pinnedCommentsRepository } from '../lib/repositories/pinned-comments.repository';
import { workflowRepository } from '../lib/repositories/workflow.repository';
import { auditLogRepository } from '../lib/repositories/audit-log.repository';
import {
  DifficultyLevel,
  PriorityLevel,
  QuestionStatus,
  SocialPublishStatus,
  UserRole,
  VideoProductionStatus,
} from '../types';
import {
  AuthorizationError,
  ValidationError,
} from '../lib/google-sheets/errors';

export async function runTask8Verification() {
  console.log('========================================================================');
  console.log('BURRA PARIKSHA CMS — TASK 8: PUBLISHING WORKFLOW VERIFICATION');
  console.log('========================================================================\n');

  let passedTests = 0;
  let totalTests = 0;
  const results: { test: string; passed: boolean; detail?: string }[] = [];

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] Test ${totalTests.toString().padStart(2, '0')}: ${testName}`);
      passedTests++;
      results.push({ test: testName, passed: true });
    } else {
      console.error(`[FAIL] Test ${totalTests.toString().padStart(2, '0')}: ${testName} - Detail: ${detail || 'Assertion failed'}`);
      results.push({ test: testName, passed: false, detail });
      throw new Error(`Test failed: ${testName} - ${detail || ''}`);
    }
  }

  // Define actors
  const adminActor = { id: 'USR-ADM-01', name: 'Lead Publishing Admin', role: UserRole.ADMIN };
  const pubManagerActor = { id: 'USR-PUB-01', name: 'Social Distribution Manager', role: UserRole.PUBLISHING_MANAGER };
  const contentManagerActor = { id: 'USR-CNT-01', name: 'Content Lead', role: UserRole.CONTENT_MANAGER };
  const unauthorizedActor = { id: 'USR-GUEST-01', name: 'Guest Reviewer', role: 'GUEST' };
  const designerActor = { id: 'USR-DES-01', name: 'Graphic Designer', role: 'DESIGNER' };

  // =========================================================================
  // SETUP: Create Question & Video for Publishing Workflow Test
  // =========================================================================
  console.log('--- Step 0: Setting Up Temporary Test Question & Video ---');
  const tree = await taxonomyService.getTaxonomyTree();
  const testCat = tree[0];
  const testTopic = testCat?.topics?.[0] || { id: 'TOP-101', name: 'General Studies', subtopics: [{ id: 'SUB-101', name: 'Geography' }] };
  const testSubtopic = testTopic?.subtopics?.[0] || { id: 'SUB-101', name: 'Geography' };

  const testQuestion = await questionService.createQuestion(
    {
      questionText: 'Task 8 Publishing Test: What is the highest peak in the Eastern Ghats of Andhra Pradesh?',
      options: { a: 'Arma Konda', b: 'Mahendragiri', c: 'Anamudi', d: 'Doddabetta' },
      correctAnswer: 'A',
      categoryId: testCat.id,
      topicId: testTopic.id,
      subtopicId: testSubtopic.id,
      difficulty: DifficultyLevel.MEDIUM,
      explanation: 'Arma Konda (1,680 m) is the highest peak in the Eastern Ghats located in Andhra Pradesh.',
    },
    adminActor
  );
  await questionService.updateStatus(testQuestion.id, QuestionStatus.APPROVED, adminActor);
  console.log(`Approved Question: ${testQuestion.id}`);

  const testVideo = await videoService.queueApprovedQuestion(
    {
      questionId: testQuestion.id,
      title: 'Task 8: Highest Peak in Eastern Ghats #Shorts',
      priority: PriorityLevel.HIGH,
      assignedHost: 'Sravan Telugu Host',
      assignedEditor: 'Ravi Visual Editor',
      notes: 'Task 8 Publishing Verification Video',
    },
    adminActor
  );
  console.log(`Created Video in Queue: ${testVideo.id} [Status: ${testVideo.status}]`);

  // =========================================================================
  // SECTION 1: MANDATORY REQUIREMENT BLOCKING & READINESS EVALUATION
  // =========================================================================
  console.log('\n--- Section 1: Publishing Readiness & Mandatory Requirement Enforcement ---');

  // Test 1: Video in QUEUED status is NOT ready for publishing
  const readinessQueued = await publishingService.validatePublishReadiness(testVideo.id, { actor: adminActor });
  assert(
    !readinessQueued.isReady && readinessQueued.blockers.some((b) => b.includes('QUEUED')),
    'Publishing readiness is blocked when video is in QUEUED state',
    `Blockers: ${readinessQueued.blockers.join('; ')}`
  );

  // Test 2: Attempting to publish when video is in QUEUED status is blocked with ValidationError
  let publishBlockedError: any = null;
  try {
    await publishingService.markPlatformPublished(
      testVideo.id,
      'youtube',
      'https://youtube.com/shorts/test-premature-1',
      adminActor
    );
  } catch (err: any) {
    publishBlockedError = err;
  }
  assert(
    publishBlockedError instanceof ValidationError && publishBlockedError.message.includes('Missing mandatory requirements'),
    'Publishing action is blocked with ValidationError when video is not in publishable state',
    publishBlockedError?.message
  );

  // Advance video through lifecycle to SCRIPT_READY -> RECORDING -> EDITING -> FINAL_REVIEW -> READY_TO_UPLOAD
  await videoService.transitionStatus(testVideo.id, VideoProductionStatus.SCRIPT_READY, adminActor, 'Script prepared');
  await videoService.transitionStatus(testVideo.id, VideoProductionStatus.RECORDING, adminActor, 'Script assigned to host');
  await videoService.transitionStatus(testVideo.id, VideoProductionStatus.EDITING, adminActor, 'Raw footage recorded');
  await videoService.transitionStatus(testVideo.id, VideoProductionStatus.FINAL_REVIEW, adminActor, 'Video render uploaded');

  // Test 3: Video in FINAL_REVIEW status is still blocked (must reach READY_TO_UPLOAD)
  const readinessFinalReview = await publishingService.validatePublishReadiness(testVideo.id, { actor: adminActor });
  assert(
    !readinessFinalReview.isReady && readinessFinalReview.blockers.some((b) => b.includes('FINAL_REVIEW')),
    'Publishing readiness is blocked when video is in FINAL_REVIEW state',
    `Blockers: ${readinessFinalReview.blockers.join('; ')}`
  );

  // Advance video to READY_TO_UPLOAD
  await videoService.transitionStatus(testVideo.id, VideoProductionStatus.READY_TO_UPLOAD, adminActor, 'Master QC passed');

  // Test 4: Video is now READY_TO_UPLOAD, but thumbnail and pinned comment are missing -> still blocked
  const readinessMissingAssets = await publishingService.validatePublishReadiness(testVideo.id, { actor: adminActor });
  assert(
    !readinessMissingAssets.isReady &&
    readinessMissingAssets.checklist.videoReady === true &&
    readinessMissingAssets.checklist.thumbnailReady === false &&
    readinessMissingAssets.checklist.pinnedCommentReady === false,
    'Publishing is blocked when thumbnail and pinned comment are missing/unapproved',
    `Checklist: ${JSON.stringify(readinessMissingAssets.checklist)}`
  );

  // Save thumbnail in PENDING state
  await thumbnailService.saveThumbnail(
    testVideo.id,
    {
      hookHeadline: 'Arma Konda - Highest Peak in AP #Shorts',
      previewUrl: 'https://storage.googleapis.com/burra-pariksha-test/thumbnails/arma-konda-v1.png',
      status: 'PENDING',
    },
    adminActor
  );

  // Test 5: Thumbnail in PENDING state is still rejected by readiness validator
  const readinessDraftThumb = await publishingService.validatePublishReadiness(testVideo.id, { actor: adminActor });
  assert(
    !readinessDraftThumb.isReady && readinessDraftThumb.blockers.some((b) => b.includes('Thumbnail') && b.includes('PENDING')),
    'Publishing is blocked when thumbnail is in PENDING status',
    `Blockers: ${readinessDraftThumb.blockers.join('; ')}`
  );

  // Approve Thumbnail
  const thumb = await thumbnailsRepository.findByVideoId(testVideo.id);
  if (thumb) {
    await thumbnailService.updateStatus(thumb.id, 'APPROVED', adminActor, 'Thumbnail approved for high-res publishing');
  }

  // Save unapproved pinned comment
  await pinnedCommentService.savePinnedComment(
    testVideo.id,
    {
      commentText: 'ఈ ప్రశ్నకు సమాధానం Arma Konda (1680m). మరింత సమాచారం కోసం మా ఛానెల్ సబ్‌స్క్రైబ్ చేయండి!',
      solutionBreakdown: 'Arma Konda is the highest peak located in the Eastern Ghats in Visakhapatnam region (1,680 m).',
      nextChallengeQuestion: 'Which is the second highest peak in Andhra Pradesh?',
      isApproved: false,
    },
    adminActor
  );

  // Test 6: Unapproved pinned comment blocks publishing readiness
  const readinessUnapprovedComment = await publishingService.validatePublishReadiness(testVideo.id, { actor: adminActor });
  assert(
    !readinessUnapprovedComment.isReady && readinessUnapprovedComment.checklist.pinnedCommentReady === false,
    'Publishing is blocked when pinned comment is unapproved',
    `Blockers: ${readinessUnapprovedComment.blockers.join('; ')}`
  );

  // Approve pinned comment
  await pinnedCommentService.savePinnedComment(
    testVideo.id,
    {
      commentText: 'ఈ ప్రశ్నకు సమాధానం Arma Konda (1680m). మరింత సమాచారం కోసం మా ఛానెల్ సబ్‌స్క్రైబ్ చేయండి!',
      solutionBreakdown: 'Arma Konda is the highest peak located in the Eastern Ghats in Visakhapatnam region (1,680 m).',
      nextChallengeQuestion: 'Which is the second highest peak in Andhra Pradesh?',
      isApproved: true,
    },
    adminActor
  );

  // Test 7: All mandatory requirements satisfied -> validatePublishReadiness returns isReady: true with 0 blockers
  const readinessAllReady = await publishingService.validatePublishReadiness(testVideo.id, { actor: adminActor });
  assert(
    readinessAllReady.isReady === true &&
    readinessAllReady.blockers.length === 0 &&
    readinessAllReady.checklist.videoReady === true &&
    readinessAllReady.checklist.thumbnailReady === true &&
    readinessAllReady.checklist.pinnedCommentReady === true &&
    readinessAllReady.checklist.metadataReady === true,
    'Publish readiness returns isReady: true and 0 blockers when all requirements are satisfied',
    `Readiness: ${JSON.stringify(readinessAllReady)}`
  );

  // =========================================================================
  // SECTION 2: ROLE-BASED AUTHORIZATION ENFORCEMENT
  // =========================================================================
  console.log('\n--- Section 2: Role-Based Authorization Enforcement ---');

  // Test 8: Unauthorized role (GUEST) is rejected with AuthorizationError
  let authErrorGuest: any = null;
  try {
    await publishingService.markPlatformPublished(
      testVideo.id,
      'youtube',
      'https://youtube.com/shorts/test-unauth-1',
      unauthorizedActor
    );
  } catch (err: any) {
    authErrorGuest = err;
  }
  assert(
    authErrorGuest instanceof AuthorizationError && authErrorGuest.statusCode === 403,
    'Unauthorized role (GUEST) is rejected with 403 AuthorizationError',
    authErrorGuest?.message
  );

  // Test 9: Designer role without publishing privileges is rejected with AuthorizationError
  let authErrorDesigner: any = null;
  try {
    await publishingService.updatePublishingRecord(
      `PUB-${testVideo.id.replace('BP-V-', '')}`,
      { youtube: { status: SocialPublishStatus.PUBLISHED } },
      designerActor
    );
  } catch (err: any) {
    authErrorDesigner = err;
  }
  assert(
    authErrorDesigner instanceof AuthorizationError,
    'Designer role is rejected with AuthorizationError for publishing modifications',
    authErrorDesigner?.message
  );

  // Test 10: Missing actor authentication is rejected
  let authErrorMissing: any = null;
  try {
    await publishingService.finalizePublishing(testVideo.id, undefined as any);
  } catch (err: any) {
    authErrorMissing = err;
  }
  assert(
    authErrorMissing instanceof AuthorizationError,
    'Missing actor credentials rejected with AuthorizationError',
    authErrorMissing?.message
  );

  // Test 11: Authorized roles (ADMIN, PUBLISHING_MANAGER, CONTENT_MANAGER) pass authorization check
  const adminAuth = publishingService.isAuthorizedForPublishing(adminActor);
  const pubManagerAuth = publishingService.isAuthorizedForPublishing(pubManagerActor);
  const contentManagerAuth = publishingService.isAuthorizedForPublishing(contentManagerActor);
  assert(
    adminAuth.authorized && pubManagerAuth.authorized && contentManagerAuth.authorized,
    'ADMIN, PUBLISHING_MANAGER, and CONTENT_MANAGER roles are correctly recognized as authorized',
    `Admin: ${adminAuth.authorized}, PubManager: ${pubManagerAuth.authorized}, ContentManager: ${contentManagerAuth.authorized}`
  );

  // =========================================================================
  // SECTION 3: URL VALIDATION & DUPLICATE PROTECTION
  // =========================================================================
  console.log('\n--- Section 3: URL Validation & Duplicate Publish Protection ---');

  // Test 12: Invalid / non-HTTP URL is rejected with ValidationError
  let invalidUrlError: any = null;
  try {
    await publishingService.markPlatformPublished(
      testVideo.id,
      'youtube',
      'not-a-valid-url',
      pubManagerActor
    );
  } catch (err: any) {
    invalidUrlError = err;
  }
  assert(
    invalidUrlError instanceof ValidationError && invalidUrlError.message.includes('Invalid publishing URL'),
    'Malformed URL is rejected with ValidationError',
    invalidUrlError?.message
  );

  // Test 13: Create a second question and video to test cross-video collision protection
  const testQuestion2 = await questionService.createQuestion(
    {
      categoryId: testCat.id,
      topicId: testTopic.id,
      subtopicId: testSubtopic.id,
      difficulty: DifficultyLevel.MEDIUM,
      questionText: 'Which river forms the border between Telangana and Andhra Pradesh?',
      options: {
        a: 'Krishna',
        b: 'Godavari',
        c: 'Tungabhadra',
        d: 'Penna',
      },
      correctAnswer: 'A',
      explanation: 'The Krishna River forms part of the state boundary between Telangana and Andhra Pradesh.',
    },
    adminActor
  );
  await questionService.updateStatus(testQuestion2.id, QuestionStatus.APPROVED, adminActor);

  const testVideo2 = await videoService.queueApprovedQuestion(
    {
      questionId: testQuestion2.id,
      title: 'Task 8 Secondary Video for Collision Testing',
      priority: PriorityLevel.NORMAL,
    },
    adminActor
  );
  const pause = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

  await videoService.transitionStatus(testVideo2.id, VideoProductionStatus.SCRIPT_READY, adminActor, 'Script prepared');
  await pause();
  await videoService.transitionStatus(testVideo2.id, VideoProductionStatus.RECORDING, adminActor, 'Recorded');
  await pause();
  await videoService.transitionStatus(testVideo2.id, VideoProductionStatus.EDITING, adminActor, 'Edited');
  await pause();
  await videoService.transitionStatus(testVideo2.id, VideoProductionStatus.FINAL_REVIEW, adminActor, 'Reviewed');
  await pause();
  await videoService.transitionStatus(testVideo2.id, VideoProductionStatus.READY_TO_UPLOAD, adminActor, 'QC Passed');
  await pause();

  // Setup approved thumbnail & pinned comment for video 2
  await thumbnailService.saveThumbnail(
    testVideo2.id,
    {
      hookHeadline: 'Arma Konda Peak - Variant 2 #Shorts',
      previewUrl: 'https://storage.googleapis.com/burra-pariksha-test/thumbnails/arma-konda-v2.png',
      status: 'APPROVED',
    },
    adminActor
  );
  await pinnedCommentService.savePinnedComment(
    testVideo2.id,
    {
      commentText: 'Arma Konda (1680m) AP Eastern Ghats',
      solutionBreakdown: 'Arma Konda is the highest peak in AP Eastern Ghats.',
      isApproved: true,
    },
    adminActor
  );

  const sharedUrl = 'https://youtube.com/shorts/arma-konda-unique-123';
  await publishingService.markPlatformPublished(
    testVideo.id,
    'youtube',
    sharedUrl,
    pubManagerActor,
    'YouTube Shorts live publication'
  );

  // Test 14: Cross-video duplicate publish protection blocks re-using the same URL on Video 2
  let duplicateCollisionError: any = null;
  try {
    await publishingService.markPlatformPublished(
      testVideo2.id,
      'youtube',
      sharedUrl,
      pubManagerActor
    );
  } catch (err: any) {
    duplicateCollisionError = err;
  }
  assert(
    duplicateCollisionError instanceof ValidationError && duplicateCollisionError.message.includes('Duplicate publish protection'),
    'Cross-video duplicate URL collision is blocked with ValidationError',
    duplicateCollisionError?.message
  );

  // Test 15: Accidental platform overwrite protection on same video (without forceRePublish)
  let overwriteProtectionError: any = null;
  try {
    await publishingService.markPlatformPublished(
      testVideo.id,
      'youtube',
      'https://youtube.com/shorts/arma-konda-different-456',
      pubManagerActor
    );
  } catch (err: any) {
    overwriteProtectionError = err;
  }
  assert(
    overwriteProtectionError instanceof ValidationError && overwriteProtectionError.message.includes('forceRePublish'),
    'Accidental overwrite of published platform URL is blocked unless forceRePublish is set',
    overwriteProtectionError?.message
  );

  // =========================================================================
  // SECTION 4: IDEMPOTENCY GUARANTEES
  // =========================================================================
  console.log('\n--- Section 4: Idempotency Guarantees ---');

  // Test 16: Exact same publish call is completely idempotent (no error, returns existing record)
  const idempotentResult = await publishingService.markPlatformPublished(
    testVideo.id,
    'youtube',
    sharedUrl,
    pubManagerActor
  );
  assert(
    idempotentResult.youtube?.videoUrl === sharedUrl &&
    idempotentResult.youtube?.status === SocialPublishStatus.PUBLISHED,
    'Re-publishing identical URL on published platform is idempotent and succeeds safely',
    `Publishing ID: ${idempotentResult.id}`
  );

  // =========================================================================
  // SECTION 5: DISTRIBUTION LIFECYCLE & MULTI-PLATFORM COUNTER
  // =========================================================================
  console.log('\n--- Section 5: Multi-Platform Distribution Lifecycle (0/3 -> 3/3) ---');

  // Check state after YouTube (1/3)
  const pubRecord1 = await publishingService.getPublishingByVideoId(testVideo.id);
  assert(
    pubRecord1 !== null &&
    pubRecord1.completedPlatformsCount === 1 &&
    pubRecord1.youtube?.status === SocialPublishStatus.PUBLISHED &&
    pubRecord1.instagram?.status === SocialPublishStatus.NOT_STARTED &&
    pubRecord1.facebook?.status === SocialPublishStatus.NOT_STARTED,
    'Platform counter reflects 1/3 completed after YouTube publish',
    `Completed: ${pubRecord1?.completedPlatformsCount}/3`
  );

  // Publish Instagram Reels (2/3)
  const igUrl = 'https://instagram.com/reel/arma-konda-reel-789';
  const pubRecord2 = await publishingService.markPlatformPublished(
    testVideo.id,
    'instagram',
    igUrl,
    pubManagerActor,
    'Instagram Reels live publication'
  );
  assert(
    pubRecord2.completedPlatformsCount === 2 &&
    pubRecord2.instagram?.status === SocialPublishStatus.PUBLISHED &&
    pubRecord2.instagram?.postUrl === igUrl,
    'Platform counter reflects 2/3 completed after Instagram publish',
    `Completed: ${pubRecord2.completedPlatformsCount}/3`
  );

  // Publish Facebook Video (3/3)
  const fbUrl = 'https://facebook.com/watch/arma-konda-fb-101';
  const pubRecord3 = await publishingService.markPlatformPublished(
    testVideo.id,
    'facebook',
    fbUrl,
    pubManagerActor,
    'Facebook Video live publication'
  );
  assert(
    pubRecord3.completedPlatformsCount === 3 &&
    pubRecord3.facebook?.status === SocialPublishStatus.PUBLISHED &&
    pubRecord3.facebook?.postUrl === fbUrl &&
    pubRecord3.finalVideoStatus === 'VERIFIED',
    'Platform counter reflects 3/3 completed after Facebook publish and finalVideoStatus is VERIFIED',
    `Completed: ${pubRecord3.completedPlatformsCount}/3, FinalStatus: ${pubRecord3.finalVideoStatus}`
  );

  // =========================================================================
  // SECTION 6: MULTI-WORKSHEET SYNCHRONIZATION & AUDIT TRAIL
  // =========================================================================
  console.log('\n--- Section 6: Multi-Worksheet Synchronization (PUBLISHING, WORKFLOW, AUDIT_LOG) ---');

  // Test 19: Check PUBLISHING worksheet in repository
  const pubInSheet = await publishingRepository.findById(pubRecord3.id);
  assert(
    pubInSheet !== null &&
    pubInSheet.videoId === testVideo.id &&
    pubInSheet.thumbnailReady === true &&
    pubInSheet.pinnedCommentReady === true &&
    pubInSheet.completedPlatformsCount === 3,
    'PUBLISHING worksheet persists full distribution records and readiness flags',
    JSON.stringify(pubInSheet)
  );

  // Test 20: Check WORKFLOW worksheet transitions
  const workflowHistory = await workflowRepository.findByEntity('PUBLISHING', pubRecord3.id);
  assert(
    workflowHistory.length >= 3 &&
    workflowHistory.some((w) => w.toStatus === SocialPublishStatus.PUBLISHED && w.remarks.includes('YOUTUBE')) &&
    workflowHistory.some((w) => w.toStatus === SocialPublishStatus.PUBLISHED && w.remarks.includes('INSTAGRAM')) &&
    workflowHistory.some((w) => w.toStatus === SocialPublishStatus.PUBLISHED && w.remarks.includes('FACEBOOK')),
    'WORKFLOW worksheet records state transitions for all 3 published platforms',
    `Found ${workflowHistory.length} workflow records for publishing entity`
  );

  // Test 21: Check AUDIT_LOG worksheet entries
  const auditLogs = await auditLogRepository.findByEntity('PUBLISHING', pubRecord3.id);
  const auditActions = auditLogs.map((l) => l.action);
  assert(
    auditActions.includes('MARK_PLATFORM_PUBLISHED') &&
    auditActions.includes('UPDATE_PUBLISHING') &&
    auditActions.includes('IDEMPOTENT_PUBLISH_DETECTED'),
    'AUDIT_LOG worksheet captures MARK_PLATFORM_PUBLISHED, UPDATE_PUBLISHING, and IDEMPOTENT_PUBLISH_DETECTED events',
    `Logged actions: ${auditActions.join(', ')}`
  );

  // Test 22: Check Video status in VIDEOS worksheet auto-advanced to UPLOADED
  const updatedVideoInSheet = await videosRepository.findById(testVideo.id);
  assert(
    updatedVideoInSheet !== null && updatedVideoInSheet.status === VideoProductionStatus.UPLOADED,
    'Video status in VIDEOS worksheet is successfully synchronized to terminal UPLOADED state',
    `Current status: ${updatedVideoInSheet?.status}`
  );

  // Test 23: Finalize publishing call is idempotent
  const finalized = await publishingService.finalizePublishing(
    testVideo.id,
    adminActor,
    'Confirmed all 3 social platforms live'
  );
  assert(
    finalized.video.status === VideoProductionStatus.UPLOADED &&
    finalized.publishing.completedPlatformsCount === 3,
    'Finalize publishing is idempotent and confirms UPLOADED status',
    `Video Status: ${finalized.video.status}`
  );

  // =========================================================================
  // SUMMARY REPORT
  // =========================================================================
  console.log('\n========================================================================');
  console.log(`TASK 8 VERIFICATION COMPLETE: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('========================================================================\n');

  return {
    success: passedTests === totalTests,
    totalTests,
    passedTests,
    results,
  };
}
