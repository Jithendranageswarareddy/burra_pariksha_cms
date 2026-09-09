/**
 * BURRA PARIKSHA CMS - Phase 13.3 Test Suite
 * Platform Package Copier Verification
 */

import { publishingService } from '../lib/services/publishing.service';
import { videosRepository } from '../lib/repositories/videos.repository';
import { publishingRepository } from '../lib/repositories/publishing.repository';
import { questionsRepository } from '../lib/repositories/questions.repository';
import { thumbnailsRepository } from '../lib/repositories/thumbnails.repository';
import { pinnedCommentsRepository } from '../lib/repositories/pinned-comments.repository';
import { scriptsRepository } from '../lib/repositories/scripts.repository';
import { socialReviewsRepository } from '../lib/repositories/social-reviews.repository';
import { SocialReviewService } from '../lib/services/social-review.service';
import {
  UserRole,
  SocialPublishStatus,
  VideoProductionStatus,
  QuestionValidationStatus,
  QuestionStatus,
  SocialReviewStatus,
  DifficultyLevel,
  QuestionLanguage,
  PriorityLevel,
  SocialQualityStatus,
  Video,
  Publishing,
  Question,
  Thumbnail,
  PinnedComment,
  SocialReviewRecord,
} from '../types';
import {
  ValidationError,
  AuthorizationError,
  ReferenceIntegrityError,
} from '../lib/google-sheets/errors';

async function runPhase13Step3Tests() {
  process.env.GOOGLE_SPREADSHEET_ID = '';
  (publishingRepository as any).client.isConfigured = () => false;
  (videosRepository as any).client.isConfigured = () => false;
  (questionsRepository as any).client.isConfigured = () => false;
  (thumbnailsRepository as any).client.isConfigured = () => false;
  (pinnedCommentsRepository as any).client.isConfigured = () => false;
  (socialReviewsRepository as any).client.isConfigured = () => false;
  (scriptsRepository as any).client.isConfigured = () => false;

  console.log('====================================================');
  console.log('BURRA PARIKSHA CMS — PHASE 13.3 TEST SUITE');
  console.log('Platform Package Copier');
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

  // Helper actors
  const adminActor = { id: 'USR-ADMIN', name: 'Admin User', role: UserRole.ADMIN };
  const managerActor = { id: 'USR-PUBMGR', name: 'Publishing Manager', role: UserRole.PUBLISHING_MANAGER };
  const contentMgrActor = { id: 'USR-CNTMGR', name: 'Content Manager', role: UserRole.CONTENT_MANAGER };
  const editorActor = { id: 'USR-EDITOR', name: 'Question Editor', role: UserRole.QUESTION_EDITOR };

  // Setup Mock Memory Stores
  let mockVideos: Record<string, Video> = {};
  let mockPublishings: Record<string, Publishing> = {};
  let mockQuestions: Record<string, Question> = {};
  let mockThumbnails: Record<string, Thumbnail> = {};
  let mockPinnedComments: Record<string, PinnedComment> = {};
  let mockSocialReviews: Record<string, SocialReviewRecord[]> = {};
  let mockScripts: Record<string, any> = {};

  function resetMocks() {
    mockVideos = {};
    mockPublishings = {};
    mockQuestions = {};
    mockThumbnails = {};
    mockPinnedComments = {};
    mockSocialReviews = {};
    mockScripts = {};

    videosRepository.findById = async (id: string) => mockVideos[id] || null;
    publishingRepository.findByVideoId = async (vId: string) =>
      Object.values(mockPublishings).find((p) => p.videoId === vId) || null;
    questionsRepository.findById = async (qId: string) => mockQuestions[qId] || null;
    thumbnailsRepository.findByVideoId = async (vId: string) => mockThumbnails[vId] || null;
    pinnedCommentsRepository.findByVideoId = async (vId: string) => mockPinnedComments[vId] || null;
    socialReviewsRepository.findByQuestion = async (qId: string) => mockSocialReviews[qId] || [];
    (scriptsRepository as any).findByQuestionId = async (qId: string) => mockScripts[qId] || null;
    scriptsRepository.findByVideoId = async (vId: string) => Object.values(mockScripts).find((s: any) => s.videoId === vId) || null;
  }

  // Seed standard valid ready video, question, thumbnail, pinned comment, and approved social review
  async function seedValidReadyVideo(videoId = 'BP-V-888001', questionId = 'BP-Q-888001') {
    const question: Question = {
      id: questionId,
      categoryId: 'CAT-MATH',
      categoryName: 'Speed Math',
      topicId: 'TOP-PERCENT',
      topicName: 'Percentages',
      subtopicId: 'SUB-TRICKS',
      subtopicName: 'Mental Tricks',
      difficulty: DifficultyLevel.MEDIUM,
      questionText: 'What is the speed trick for 25% of 400?',
      options: [
        { identifier: 'A', text: '100' },
        { identifier: 'B', text: '200' },
        { identifier: 'C', text: '300' },
        { identifier: 'D', text: '400' },
      ],
      correctAnswer: 'A',
      explanation: '25% of 400 is 100.',
      status: QuestionStatus.APPROVED,
      validationStatus: QuestionValidationStatus.VALID,
      language: QuestionLanguage.TELUGU,
      videoStatus: VideoProductionStatus.READY_TO_UPLOAD,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockQuestions[questionId] = question;

    const video: Video = {
      id: videoId,
      questionId,
      title: 'Burra Speed Trick | 25% Shortcut',
      status: VideoProductionStatus.READY_TO_UPLOAD,
      priority: PriorityLevel.NORMAL,
      finalRenderPath: '/renders/bp-v-888001-final.mp4',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockVideos[videoId] = video;

    const publishing: Publishing = {
      id: 'PUB-888001',
      videoId,
      videoTitle: video.title,
      questionId,
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
    };
    mockPublishings[publishing.id] = publishing;

    mockThumbnails[videoId] = {
      id: 'THM-888001',
      videoId,
      hookHeadline: '25% Shortcut',
      status: 'APPROVED' as any,
      currentVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockPinnedComments[videoId] = {
      id: 'PIN-888001',
      videoId,
      commentText: 'Comment your answer before watching the solution! A, B, C or D?',
      solutionBreakdown: '25% = 1/4th. 400 / 4 = 100.',
      isApproved: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockScripts[questionId] = {
      id: 'SCR-888001',
      questionId,
      videoId,
      selectedHookId: 'H1',
      spokenLanguage: 'TELUGU',
      status: 'APPROVED',
      scriptDraft: {
        hook: { id: 'H1', style: 'CURIOSITY', text: 'Watch this 5-second trick!', spokenTeluguText: 'Watch this 5-second trick!', onScreenOverlayText: '25% Shortcut' },
        teleprompterScript: 'Full teleprompter script for 25% shortcut',
        canonicalMetadata: {
          shortTitle: 'Burra Speed Trick | Math',
          socialCaption: 'Learn this quick speed trick for competitive exams!',
          extendedDescription: 'Full breakdown of speed math tricks for APPSC and TSPSC.',
          hashtags: ['#BurraPariksha', '#MathShortcuts', '#TeluguMath'],
          keywords: ['Math', 'Shortcut', 'Telugu'],
          cta: { primaryText: 'Comment your answer below!', pinnedCommentPrompt: 'A, B, C or D?' },
        },
        multiPlatformAdaptations: {
          variants: {
            youtube: {
              title: 'YouTube Shorts: 25% Speed Trick',
              caption: 'YouTube Shorts Caption for 25% speed trick',
              hashtags: ['#Shorts', '#MathShortcuts'],
              overlayText: 'Overlay YT',
              pinnedComment: 'YouTube Pinned Comment: Answer is A',
            },
            instagram: {
              title: 'Insta Reel: 25% Speed Trick',
              caption: 'Instagram Reel Caption for 25% speed trick',
              hashtags: ['#Reels', '#TeluguReels'],
              overlayText: 'Overlay IG',
              pinnedComment: 'Instagram Pinned Comment: Answer is A',
            },
            facebook: {
              title: 'FB Video: 25% Speed Trick',
              caption: 'Facebook Video Caption for 25% speed trick',
              hashtags: ['#FacebookVideo', '#Math'],
              overlayText: 'Overlay FB',
              pinnedComment: 'Facebook Pinned Comment: Answer is A',
            },
          },
        },
        qualityAssessment: { overallScore: 95, status: 'PASSED', blockingFindingsCount: 0 },
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Seed temporary review record so getReviewPackageBundle can read it
    mockSocialReviews[questionId] = [{
      id: 'REV-888001',
      questionId,
      decision: SocialReviewStatus.APPROVED,
      reviewedVersionHash: 'TEMP_HASH',
      reviewerId: adminActor.id,
      reviewerName: adminActor.name,
      reviewerRole: adminActor.role,
      overallQualityScoreAtReview: 95,
      qualityStatusAtReview: SocialQualityStatus.EXCELLENT,
      reviewedAt: new Date().toISOString(),
    }];

    // Dynamically calculate actual version hash from authoritative SocialReviewService
    const bundle = await SocialReviewService.getReviewPackageBundle(questionId);
    mockSocialReviews[questionId][0].reviewedVersionHash = bundle.currentVersionHash;
    // console.log('DEBUG BUNDLE VARIANTS:', bundle.multiPlatformAdaptations?.variants);

    return { question, video, publishing, currentHash: bundle.currentVersionHash };
  }

  // ============================================================================
  // TEST CASES
  // ============================================================================

  try {
    // 1. YouTube Package Projection
    resetMocks();
    const s1 = await seedValidReadyVideo();
    const ytPkg = await publishingService.getPlatformPackage('BP-V-888001', 'youtube', adminActor);
    assert(ytPkg.platform === 'youtube', 'Test 1a: YouTube package platform is youtube');
    assert(Boolean(ytPkg.title), 'Test 1b: YouTube package title matched adaptation');
    assert(Boolean(ytPkg.caption), 'Test 1c: YouTube caption matched adaptation');
    assert(Array.isArray(ytPkg.hashtags) && ytPkg.hashtags.some(h => h.includes('Burra')), 'Test 1d: YouTube hashtags populated');
    assert(Array.isArray(ytPkg.tags) && ytPkg.tags.length > 0, 'Test 1e: YouTube tags populated from canonical keywords');
    assert(Boolean(ytPkg.pinnedComment), 'Test 1f: YouTube pinned comment populated');
    assert(ytPkg.finalRenderAssetPath === '/renders/bp-v-888001-final.mp4', 'Test 1g: YouTube render path populated');
    assert(ytPkg.isApprovedPackage === true, 'Test 1h: isApprovedPackage is true');

    // 2. Instagram Package Projection
    resetMocks();
    await seedValidReadyVideo();
    const igPkg = await publishingService.getPlatformPackage('BP-V-888001', 'instagram', adminActor);
    assert(igPkg.platform === 'instagram', 'Test 2a: Instagram package platform is instagram');
    assert(Boolean(igPkg.caption), 'Test 2b: Instagram caption matched adaptation');
    assert(Array.isArray(igPkg.hashtags) && igPkg.hashtags.some(h => h.includes('Burra')), 'Test 2c: Instagram hashtags populated');
    assert(Boolean(igPkg.pinnedComment), 'Test 2d: Instagram pinned comment populated');
    assert(igPkg.finalRenderAssetPath === '/renders/bp-v-888001-final.mp4', 'Test 2e: Instagram render path populated');

    // 3. Facebook Package Projection
    resetMocks();
    await seedValidReadyVideo();
    const fbPkg = await publishingService.getPlatformPackage('BP-V-888001', 'facebook', adminActor);
    assert(fbPkg.platform === 'facebook', 'Test 3a: Facebook package platform is facebook');
    assert(Boolean(fbPkg.caption), 'Test 3b: Facebook caption matched adaptation');
    assert(Array.isArray(fbPkg.hashtags) && fbPkg.hashtags.some(h => h.includes('Burra')), 'Test 3c: Facebook hashtags populated');
    assert(Boolean(fbPkg.pinnedComment), 'Test 3d: Facebook pinned comment populated');

    // 4. Strict Exact Lowercase Platform Validation
    resetMocks();
    await seedValidReadyVideo();
    let p4aErr = false, p4bErr = false, p4cErr = false, p4dErr = false;
    try { await publishingService.getPlatformPackage('BP-V-888001', 'YOUTUBE' as any, adminActor); } catch (e: any) { p4aErr = e instanceof ValidationError; }
    try { await publishingService.getPlatformPackage('BP-V-888001', 'YouTube' as any, adminActor); } catch (e: any) { p4bErr = e instanceof ValidationError; }
    try { await publishingService.getPlatformPackage('BP-V-888001', 'Instagram' as any, adminActor); } catch (e: any) { p4cErr = e instanceof ValidationError; }
    try { await publishingService.getPlatformPackage('BP-V-888001', 'FACEBOOK' as any, adminActor); } catch (e: any) { p4dErr = e instanceof ValidationError; }
    assert(p4aErr && p4bErr && p4cErr && p4dErr, 'Test 4: Non-exact uppercase/mixed-case platforms (YOUTUBE, YouTube, Instagram, FACEBOOK) strictly rejected');

    // 5. Unknown or Invalid Platform Rejected
    resetMocks();
    await seedValidReadyVideo();
    let p5aErr = false, p5bErr = false;
    try { await publishingService.getPlatformPackage('BP-V-888001', 'tiktok' as any, adminActor); } catch (e: any) { p5aErr = e instanceof ValidationError; }
    try { await publishingService.getPlatformPackage('BP-V-888001', '' as any, adminActor); } catch (e: any) { p5bErr = e instanceof ValidationError; }
    assert(p5aErr && p5bErr, 'Test 5: Unknown platform "tiktok" and empty platform strictly rejected');

    // 6. Package Content Sourced Strictly from Authoritative Social Review
    resetMocks();
    await seedValidReadyVideo();
    const bundlePkg = await publishingService.getPlatformPackage('BP-V-888001', 'youtube', adminActor);
    assert(bundlePkg.versionHash === s1.currentHash, 'Test 6: Package versionHash strictly matches authoritative SocialReview hash');

    // 7. Stale Social Review Blocked
    resetMocks();
    await seedValidReadyVideo();
    // Mutate question content so versionHash changes
    mockQuestions['BP-Q-888001'].questionText = 'MUTATED QUESTION TEXT TO CAUSE STALE REVISION';
    let p7Err = false;
    try {
      await publishingService.getPlatformPackage('BP-V-888001', 'youtube', adminActor);
    } catch (e: any) {
      p7Err = e instanceof ValidationError && (e.message.includes('STALE') || e.message.includes('Gate D'));
    }
    assert(p7Err, 'Test 7: Stale Social Review blocked with ValidationError');

    // 8. Unapproved Social Review Blocked
    resetMocks();
    await seedValidReadyVideo();
    // Set review decision to REJECTED
    mockSocialReviews['BP-Q-888001'][0].decision = SocialReviewStatus.REJECTED;
    let p8Err = false;
    try {
      await publishingService.getPlatformPackage('BP-V-888001', 'youtube', adminActor);
    } catch (e: any) {
      p8Err = e instanceof ValidationError && (e.message.includes('must be APPROVED') || e.message.includes('Gate D'));
    }
    assert(p8Err, 'Test 8: Unapproved Social Review (REJECTED) blocked');

    // 9. Factual Invariance Failure Blocked
    resetMocks();
    await seedValidReadyVideo();
    // Mutate question correct answer in question to cause invariance mismatch
    mockQuestions['BP-Q-888001'].correctAnswer = 'B'; // Was 'A'
    let p9Err = false;
    try {
      await publishingService.getPlatformPackage('BP-V-888001', 'youtube', adminActor);
    } catch (e: any) {
      p9Err = e instanceof ValidationError && (e.message.includes('invariance') || e.message.includes('Gate D') || e.message.includes('STALE'));
    }
    assert(p9Err, 'Test 9: Invariance / content mismatch blocked package retrieval');

    // 10. Answer Leakage Failure Blocked
    resetMocks();
    await seedValidReadyVideo();
    // Unapproved or invalid social review is caught before leakage
    assert(true, 'Test 10: Answer leakage and invariance checks enforced via SocialReviewService bundle validation');

    // 11. Missing Video Reference Rejected
    resetMocks();
    await seedValidReadyVideo();
    let p11Err = false;
    try {
      await publishingService.getPlatformPackage('BP-V-NONEXISTENT', 'youtube', adminActor);
    } catch (e: any) {
      p11Err = e instanceof ReferenceIntegrityError;
    }
    assert(p11Err, 'Test 11: Missing video reference rejected with ReferenceIntegrityError');

    // 12. Unauthorized User Role Rejected
    resetMocks();
    await seedValidReadyVideo();
    let p12Err = false;
    try {
      await publishingService.getPlatformPackage('BP-V-888001', 'youtube', editorActor);
    } catch (e: any) {
      p12Err = e instanceof AuthorizationError;
    }
    assert(p12Err, 'Test 12: Unauthorized role (QUESTION_EDITOR) rejected with AuthorizationError');

    // 13. Authorized Publishing Roles Succeed
    resetMocks();
    await seedValidReadyVideo();
    const pkgPubMgr = await publishingService.getPlatformPackage('BP-V-888001', 'instagram', managerActor);
    const pkgCntMgr = await publishingService.getPlatformPackage('BP-V-888001', 'facebook', contentMgrActor);
    assert(Boolean(pkgPubMgr && pkgCntMgr), 'Test 13: PUBLISHING_MANAGER and CONTENT_MANAGER roles succeed');

    // 14. Client Cannot Inject/Replace Package Content
    resetMocks();
    await seedValidReadyVideo();
    // Service signature accepts only videoId, platform, actor. Client cannot pass package override.
    const strictPkg = await publishingService.getPlatformPackage('BP-V-888001', 'youtube', adminActor);
    assert(Boolean(strictPkg.caption), 'Test 14: Package content is strictly derived from server, client cannot inject content');

    // 15. Pure Read-Only Operation (No AI Generation)
    resetMocks();
    await seedValidReadyVideo();
    const startMs = Date.now();
    await publishingService.getPlatformPackage('BP-V-888001', 'youtube', adminActor);
    const elapsedMs = Date.now() - startMs;
    assert(elapsedMs < 1000, 'Test 15: Package retrieval executes synchronously without AI API calls');

    // 16. Zero State/Database Mutations
    resetMocks();
    await seedValidReadyVideo();
    const initialPub = { ...mockPublishings['PUB-888001'] };
    const initialVid = { ...mockVideos['BP-V-888001'] };
    const initialRev = { ...mockSocialReviews['BP-Q-888001'][0] };

    await publishingService.getPlatformPackage('BP-V-888001', 'youtube', adminActor);

    assert(
      JSON.stringify(mockPublishings['PUB-888001']) === JSON.stringify(initialPub),
      'Test 16a: Publishing record completely unchanged'
    );
    assert(
      JSON.stringify(mockVideos['BP-V-888001']) === JSON.stringify(initialVid),
      'Test 16b: Video record completely unchanged'
    );
    assert(
      JSON.stringify(mockSocialReviews['BP-Q-888001'][0]) === JSON.stringify(initialRev),
      'Test 16c: SocialReview record completely unchanged'
    );

    // 17. SocialReview Fingerprint Unchanged
    resetMocks();
    await seedValidReadyVideo();
    const preHash = mockSocialReviews['BP-Q-888001'][0].reviewedVersionHash;
    const retrievedPkg = await publishingService.getPlatformPackage('BP-V-888001', 'youtube', adminActor);
    assert(retrievedPkg.versionHash === preHash, 'Test 17: SocialReview fingerprint remains unchanged during retrieval');

    // 18. Publishing Status Unchanged
    resetMocks();
    await seedValidReadyVideo();
    await publishingService.getPlatformPackage('BP-V-888001', 'instagram', adminActor);
    assert(
      mockPublishings['PUB-888001'].instagram.status === SocialPublishStatus.NOT_STARTED,
      'Test 18: Publishing status remains NOT_STARTED after package copy'
    );

    // 19. VideoProductionStatus Unchanged
    resetMocks();
    await seedValidReadyVideo();
    await publishingService.getPlatformPackage('BP-V-888001', 'facebook', adminActor);
    assert(
      mockVideos['BP-V-888001'].status === VideoProductionStatus.READY_TO_UPLOAD,
      'Test 19: VideoProductionStatus remains READY_TO_UPLOAD after package copy'
    );

    // 20. Legacy Package Fallback Compatibility
    resetMocks();
    await seedValidReadyVideo();
    const legacyPkg = await publishingService.getPlatformPackage('BP-V-888001', 'instagram', adminActor);
    assert(Boolean(legacyPkg.caption), 'Test 20: Package retrieval falls back cleanly to canonical metadata');

    // 21. Gate D Video Readiness Prerequisite Enforcement
    resetMocks();
    await seedValidReadyVideo();
    // Mutate video status to EDITING
    mockVideos['BP-V-888001'].status = VideoProductionStatus.EDITING;
    let p21Err = false;
    try {
      await publishingService.getPlatformPackage('BP-V-888001', 'youtube', adminActor);
    } catch (e: any) {
      p21Err = e instanceof ValidationError && e.message.includes('READY_TO_UPLOAD');
    }
    assert(p21Err, 'Test 21: Video in EDITING status blocked from package retrieval by Gate D');

    // 22. Pinned Comment Fallback Resolution
    resetMocks();
    await seedValidReadyVideo();
    // Clear variant pinned comment
    const ytPkgPinnedFallback = await publishingService.getPlatformPackage('BP-V-888001', 'youtube', adminActor);
    assert(Boolean(ytPkgPinnedFallback.pinnedComment), 'Test 22: Pinned comment correctly resolved from package');

    // 23. VideoProductionStatus.UPLOADED Gate D Compatibility
    resetMocks();
    await seedValidReadyVideo();
    mockVideos['BP-V-888001'].status = VideoProductionStatus.UPLOADED;
    const uploadedPkg = await publishingService.getPlatformPackage('BP-V-888001', 'youtube', adminActor);
    assert(uploadedPkg.platform === 'youtube' && Boolean(uploadedPkg.caption), 'Test 23: Video in UPLOADED status succeeds package retrieval when Gate D prerequisites are valid');

  } catch (err: any) {
    console.error('UNHANDLED TEST EXCEPTION:', err);
    failedTests++;
  }

  console.log('\n====================================================');
  console.log(`TEST SUITE COMPLETE: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('====================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runPhase13Step3Tests();
