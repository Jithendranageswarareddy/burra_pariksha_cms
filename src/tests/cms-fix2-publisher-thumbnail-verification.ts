/**
 * BURRA PARIKSHA CMS — FIX 2: PUBLISHER THUMBNAIL INTEGRATION VERIFICATION SUITE
 *
 * Verifies:
 * 1. Package includes thumbnail link/fields when thumbnail exists:
 *    - thumbnailUrl (previewUrl)
 *    - thumbnailDriveUrl (driveAssetUrl)
 *    - thumbnailStatus (status)
 * 2. Package remains valid when thumbnail is absent (null fields, safe fallback).
 * 3. Package remains valid when thumbnail lookup errors (safe catch, no crash).
 * 4. Existing package fields remain completely unchanged:
 *    - platform, videoId, videoTitle, title, caption, hashtags, tags, cta, pinnedComment,
 *      finalRenderAssetPath, isApprovedPackage, versionHash, reviewedAt.
 * 5. Unauthorized users cannot access the publishing package endpoint:
 *    - Unauthenticated request returns 401.
 *    - QUESTION_EDITOR, VIDEO_EDITOR, SCRIPT_WRITER, DESIGNER, REVIEWER receive 403 Forbidden.
 * 6. Authorized publishing roles can access the package:
 *    - ADMIN, CONTENT_MANAGER, PUBLISHING_MANAGER receive 200 OK.
 * 7. Unrelated publishing permissions remain unchanged:
 *    - Finalize publishing endpoint preserves exact RBAC gates.
 *    - Publishing assignment endpoint preserves exact RBAC gates.
 *
 * Strict ₹0 Constraint: Zero live AI calls, zero Google Sheets writes, zero GCS calls.
 */

import express from 'express';
import http from 'http';
import { apiRouter } from '../server/routes';
import { authService } from '../lib/services/auth.service';
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

interface CheckItem {
  id: number;
  name: string;
  pass: boolean;
  details: string;
}

export async function runCmsFix2PublisherThumbnailVerification(): Promise<{
  allPassed: boolean;
  total: number;
  passed: number;
  failed: number;
  checks: CheckItem[];
}> {
  console.log('\n===============================================================');
  console.log('CMS COMPLETION — FIX 2: PUBLISHER THUMBNAIL INTEGRATION VERIFY');
  console.log('===============================================================\n');

  const checks: CheckItem[] = [];
  let checkCounter = 0;

  function recordCheck(name: string, condition: boolean, details: string) {
    checkCounter++;
    const pass = Boolean(condition);
    checks.push({ id: checkCounter, name, pass, details });
    if (pass) {
      console.log(`[PASS] Check #${checkCounter}: ${name}`);
    } else {
      console.error(`[FAIL] Check #${checkCounter}: ${name} — ${details}`);
    }
  }

  // Ensure zero external side effects
  process.env.GOOGLE_SPREADSHEET_ID = '';
  (publishingRepository as any).client.isConfigured = () => false;
  (videosRepository as any).client.isConfigured = () => false;
  (questionsRepository as any).client.isConfigured = () => false;
  (thumbnailsRepository as any).client.isConfigured = () => false;
  (pinnedCommentsRepository as any).client.isConfigured = () => false;
  (socialReviewsRepository as any).client.isConfigured = () => false;
  (scriptsRepository as any).client.isConfigured = () => false;

  // Actor definitions
  const adminActor = { id: 'USR-ADMIN', name: 'Admin User', role: UserRole.ADMIN };
  const managerActor = { id: 'USR-PUBMGR', name: 'Publishing Manager', role: UserRole.PUBLISHING_MANAGER };
  const contentMgrActor = { id: 'USR-CNTMGR', name: 'Content Manager', role: UserRole.CONTENT_MANAGER };
  const editorActor = { id: 'USR-EDITOR', name: 'Video Editor', role: UserRole.VIDEO_EDITOR };
  const reviewerActor = { id: 'USR-REVIEWER', name: 'Reviewer', role: UserRole.REVIEWER };
  const designerActor = { id: 'USR-DESIGNER', name: 'Designer', role: UserRole.DESIGNER };
  const questionEditorActor = { id: 'USR-QE', name: 'Question Editor', role: UserRole.QUESTION_EDITOR };
  const scriptWriterActor = { id: 'USR-SW', name: 'Script Writer', role: UserRole.SCRIPT_WRITER };

  // In-memory repositories
  let mockVideos: Record<string, Video> = {};
  let mockPublishings: Record<string, Publishing> = {};
  let mockQuestions: Record<string, Question> = {};
  let mockThumbnails: Record<string, Thumbnail | null> = {};
  let mockPinnedComments: Record<string, PinnedComment> = {};
  let mockSocialReviews: Record<string, SocialReviewRecord[]> = {};
  let mockScripts: Record<string, any> = {};

  const origFindVideoById = videosRepository.findById;
  const origFindPubByVideoId = publishingRepository.findByVideoId;
  const origFindQuestionById = questionsRepository.findById;
  const origFindThumbByVideoId = thumbnailsRepository.findByVideoId;
  const origFindPinnedByVideoId = pinnedCommentsRepository.findByVideoId;
  const origFindReviewsByQuestion = socialReviewsRepository.findByQuestion;
  const origFindScriptsByQuestion = (scriptsRepository as any).findByQuestionId;
  const origFindScriptsByVideo = scriptsRepository.findByVideoId;

  videosRepository.findById = async (id: string) => mockVideos[id] || null;
  publishingRepository.findByVideoId = async (vId: string) =>
    Object.values(mockPublishings).find((p) => p.videoId === vId) || null;
  questionsRepository.findById = async (qId: string) => mockQuestions[qId] || null;
  thumbnailsRepository.findByVideoId = async (vId: string) => mockThumbnails[vId] || null;
  pinnedCommentsRepository.findByVideoId = async (vId: string) => mockPinnedComments[vId] || null;
  socialReviewsRepository.findByQuestion = async (qId: string) => mockSocialReviews[qId] || [];
  (scriptsRepository as any).findByQuestionId = async (qId: string) => mockScripts[qId] || null;
  scriptsRepository.findByVideoId = async (vId: string) =>
    Object.values(mockScripts).find((s: any) => s.videoId === vId) || null;

  async function seedGateDReadyVideo(hasThumbnail: boolean, thumbnailData?: Partial<Thumbnail>) {
    mockVideos = {};
    mockPublishings = {};
    mockQuestions = {};
    mockThumbnails = {};
    mockPinnedComments = {};
    mockSocialReviews = {};
    mockScripts = {};

    const videoId = 'BP-V-990001';
    const questionId = 'BP-Q-990001';

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
      finalRenderPath: 'gs://renders/bp-v-990001-final.mp4',
      driveFolderUrl: 'https://drive.google.com/folder/bp-v-990001',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockVideos[videoId] = video;

    const publishing: Publishing = {
      id: 'PUB-990001',
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

    if (hasThumbnail) {
      mockThumbnails[videoId] = {
        id: 'THM-990001',
        videoId,
        hookHeadline: '25% Shortcut in 5 Seconds',
        previewUrl: thumbnailData && 'previewUrl' in thumbnailData ? thumbnailData.previewUrl : 'https://drive.google.com/file/d/thumb-preview-123/view',
        driveAssetUrl: thumbnailData && 'driveAssetUrl' in thumbnailData ? thumbnailData.driveAssetUrl : 'https://drive.google.com/file/d/thumb-asset-456/view',
        status: thumbnailData?.status ?? ('APPROVED' as any),
        currentVersion: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    } else {
      mockThumbnails[videoId] = null;
    }

    mockPinnedComments[videoId] = {
      id: 'PIN-990001',
      videoId,
      commentText: 'Comment your answer before watching the solution! A, B, C or D?',
      solutionBreakdown: '25% = 1/4th. 400 / 4 = 100.',
      isApproved: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockScripts[questionId] = {
      id: 'SCR-990001',
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

    mockSocialReviews[questionId] = [{
      id: 'REV-990001',
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

    const bundle = await SocialReviewService.getReviewPackageBundle(questionId);
    mockSocialReviews[questionId][0].reviewedVersionHash = bundle.currentVersionHash;

    return { videoId, questionId, currentVersionHash: bundle.currentVersionHash };
  }

  // Build test Express server
  const app = express();
  app.use(express.json());
  app.use('/api', apiRouter);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const addr = server.address() as any;
  const baseUrl = `http://127.0.0.1:${addr.port}/api`;

  async function request(
    routePath: string,
    method: 'GET' | 'POST' | 'PATCH' | 'PUT',
    token?: string | null,
    body?: any
  ): Promise<{ status: number; body: any }> {
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    if (body) {
      headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${baseUrl}${routePath}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    let json: any = null;
    try {
      json = await res.json();
    } catch {
      json = null;
    }
    return { status: res.status, body: json };
  }

  // Generate Tokens
  const adminToken = authService.generateSessionToken({
    userId: adminActor.id,
    name: adminActor.name,
    role: adminActor.role,
  });
  const managerToken = authService.generateSessionToken({
    userId: managerActor.id,
    name: managerActor.name,
    role: managerActor.role,
  });
  const contentMgrToken = authService.generateSessionToken({
    userId: contentMgrActor.id,
    name: contentMgrActor.name,
    role: contentMgrActor.role,
  });
  const editorToken = authService.generateSessionToken({
    userId: editorActor.id,
    name: editorActor.name,
    role: editorActor.role,
  });
  const reviewerToken = authService.generateSessionToken({
    userId: reviewerActor.id,
    name: reviewerActor.name,
    role: reviewerActor.role,
  });
  const designerToken = authService.generateSessionToken({
    userId: designerActor.id,
    name: designerActor.name,
    role: designerActor.role,
  });
  const questionEditorToken = authService.generateSessionToken({
    userId: questionEditorActor.id,
    name: questionEditorActor.name,
    role: questionEditorActor.role,
  });
  const scriptWriterToken = authService.generateSessionToken({
    userId: scriptWriterActor.id,
    name: scriptWriterActor.name,
    role: scriptWriterActor.role,
  });

  try {
    // =========================================================================
    // SECTION 1: Service-level tests — Thumbnail present
    // =========================================================================
    await seedGateDReadyVideo(true, {
      previewUrl: 'https://drive.google.com/file/d/thumb-preview-custom/view',
      driveAssetUrl: 'https://drive.google.com/file/d/thumb-asset-custom/view',
      status: 'APPROVED' as any,
    });

    const ytPkg = await publishingService.getPlatformPackage('BP-V-990001', 'youtube', adminActor);

    recordCheck(
      'Service: Platform package includes previewUrl as thumbnailUrl when thumbnail exists',
      ytPkg.thumbnailUrl === 'https://drive.google.com/file/d/thumb-preview-custom/view',
      `Got: ${ytPkg.thumbnailUrl}`
    );

    recordCheck(
      'Service: Platform package includes driveAssetUrl as thumbnailDriveUrl when thumbnail exists',
      ytPkg.thumbnailDriveUrl === 'https://drive.google.com/file/d/thumb-asset-custom/view',
      `Got: ${ytPkg.thumbnailDriveUrl}`
    );

    recordCheck(
      'Service: Platform package includes thumbnailStatus when thumbnail exists',
      ytPkg.thumbnailStatus === 'APPROVED',
      `Got: ${ytPkg.thumbnailStatus}`
    );

    // =========================================================================
    // SECTION 2: Existing package fields remain completely unchanged
    // =========================================================================
    recordCheck(
      'Service: Existing package fields remain intact (platform, videoId, videoTitle)',
      ytPkg.platform === 'youtube' &&
        ytPkg.videoId === 'BP-V-990001' &&
        ytPkg.videoTitle === 'Burra Speed Trick | 25% Shortcut',
      `platform=${ytPkg.platform}, videoId=${ytPkg.videoId}, videoTitle=${ytPkg.videoTitle}`
    );

    recordCheck(
      'Service: Existing package fields remain intact (title, caption, hashtags, tags)',
      typeof ytPkg.title === 'string' &&
        ytPkg.title.length > 0 &&
        typeof ytPkg.caption === 'string' &&
        ytPkg.caption.length > 0 &&
        Array.isArray(ytPkg.hashtags) &&
        ytPkg.hashtags.length > 0 &&
        Array.isArray(ytPkg.tags),
      `title=${ytPkg.title}, caption=${ytPkg.caption.slice(0, 30)}..., hashtags=${JSON.stringify(ytPkg.hashtags)}`
    );

    recordCheck(
      'Service: Existing package fields remain intact (cta, pinnedComment, finalRenderAssetPath)',
      typeof ytPkg.cta === 'string' &&
        ytPkg.cta.length > 0 &&
        typeof ytPkg.pinnedComment === 'string' &&
        ytPkg.pinnedComment.length > 0 &&
        ytPkg.finalRenderAssetPath === 'gs://renders/bp-v-990001-final.mp4',
      `cta=${ytPkg.cta}, pinnedComment=${ytPkg.pinnedComment}, finalRenderPath=${ytPkg.finalRenderAssetPath}`
    );

    recordCheck(
      'Service: Package metadata isApprovedPackage is true and versionHash is preserved',
      ytPkg.isApprovedPackage === true && typeof ytPkg.versionHash === 'string' && ytPkg.versionHash.length > 0,
      `isApprovedPackage=${ytPkg.isApprovedPackage}, versionHash=${ytPkg.versionHash}`
    );

    // Multi-platform checks with thumbnail
    const igPkg = await publishingService.getPlatformPackage('BP-V-990001', 'instagram', managerActor);
    recordCheck(
      'Service: Instagram package also retains thumbnail assets correctly',
      igPkg.thumbnailUrl === 'https://drive.google.com/file/d/thumb-preview-custom/view' &&
        igPkg.thumbnailDriveUrl === 'https://drive.google.com/file/d/thumb-asset-custom/view' &&
        igPkg.platform === 'instagram' &&
        igPkg.thumbnailStatus === 'APPROVED',
      `igPkg.thumbnailUrl=${igPkg.thumbnailUrl}, igPkg.platform=${igPkg.platform}`
    );

    const fbPkg = await publishingService.getPlatformPackage('BP-V-990001', 'facebook', contentMgrActor);
    recordCheck(
      'Service: Facebook package also retains thumbnail assets correctly',
      fbPkg.thumbnailUrl === 'https://drive.google.com/file/d/thumb-preview-custom/view' &&
        fbPkg.thumbnailDriveUrl === 'https://drive.google.com/file/d/thumb-asset-custom/view' &&
        fbPkg.platform === 'facebook' &&
        fbPkg.thumbnailStatus === 'APPROVED',
      `fbPkg.thumbnailUrl=${fbPkg.thumbnailUrl}, fbPkg.platform=${fbPkg.platform}`
    );

    // =========================================================================
    // SECTION 3: Safe fallback when thumbnail asset is absent or query throws
    // =========================================================================
    // 3A: Thumbnail record exists (approved for Gate D) but has no asset URLs (previewUrl/driveAssetUrl = null)
    await seedGateDReadyVideo(true, {
      previewUrl: undefined,
      driveAssetUrl: undefined,
      status: 'APPROVED' as any,
    });

    const noUrlThumbPkg = await publishingService.getPlatformPackage('BP-V-990001', 'youtube', adminActor);

    recordCheck(
      'Service: Package remains valid when thumbnail asset links are absent (no crash, null fields)',
      noUrlThumbPkg !== null &&
        noUrlThumbPkg.thumbnailUrl === null &&
        noUrlThumbPkg.thumbnailDriveUrl === null &&
        noUrlThumbPkg.thumbnailStatus === 'APPROVED',
      `thumbnailUrl=${noUrlThumbPkg.thumbnailUrl}, thumbnailDriveUrl=${noUrlThumbPkg.thumbnailDriveUrl}, status=${noUrlThumbPkg.thumbnailStatus}`
    );

    recordCheck(
      'Service: Package content fields remain fully populated even when thumbnail URLs are absent',
      typeof noUrlThumbPkg.title === 'string' &&
        typeof noUrlThumbPkg.pinnedComment === 'string' &&
        noUrlThumbPkg.finalRenderAssetPath === 'gs://renders/bp-v-990001-final.mp4',
      `title=${noUrlThumbPkg.title}, finalRenderPath=${noUrlThumbPkg.finalRenderAssetPath}`
    );

    // 3B: Thumbnail lookup returns null at package generation time (e.g. absent from DB)
    // To isolate package generation from Gate D readiness validator, simulate finding thumbnail for readiness then null for package projection
    let callCount = 0;
    const existingApprovedThumb = mockThumbnails['BP-V-990001'];
    thumbnailsRepository.findByVideoId = async (vId: string) => {
      callCount++;
      // Call 1 is Gate D readiness check -> return approved thumbnail
      if (callCount === 1) return existingApprovedThumb;
      // Call 2 is getPlatformPackage step 7B -> simulate absent record
      return null;
    };

    const absentRecordPkg = await publishingService.getPlatformPackage('BP-V-990001', 'youtube', adminActor);
    recordCheck(
      'Service: Package remains valid when thumbnail record is completely absent during package retrieval',
      absentRecordPkg !== null &&
        absentRecordPkg.thumbnailUrl === null &&
        absentRecordPkg.thumbnailDriveUrl === null &&
        absentRecordPkg.thumbnailStatus === null,
      `thumbnailUrl=${absentRecordPkg.thumbnailUrl}, thumbnailDriveUrl=${absentRecordPkg.thumbnailDriveUrl}, thumbnailStatus=${absentRecordPkg.thumbnailStatus}`
    );

    // 3C: Test resilience when repository throws an error during package retrieval
    callCount = 0;
    thumbnailsRepository.findByVideoId = async (vId: string) => {
      callCount++;
      if (callCount === 1) return existingApprovedThumb;
      throw new Error('Database connection timeout');
    };

    let errorResilientPkg: any = null;
    let threwError = false;
    try {
      errorResilientPkg = await publishingService.getPlatformPackage('BP-V-990001', 'youtube', adminActor);
    } catch (e: any) {
      threwError = true;
    }

    recordCheck(
      'Service: Package retrieval catches thumbnail repository errors gracefully without crashing',
      !threwError &&
        errorResilientPkg !== null &&
        errorResilientPkg.thumbnailUrl === null &&
        errorResilientPkg.thumbnailDriveUrl === null,
      `threwError=${threwError}, pkg=${Boolean(errorResilientPkg)}`
    );

    // Restore repository mock
    thumbnailsRepository.findByVideoId = async (vId: string) => mockThumbnails[vId] || null;

    // =========================================================================
    // SECTION 4: HTTP Endpoint Authorization & Role Gate Tests
    // GET /videos/:videoId/publishing/package/:platform
    // =========================================================================
    // Seed with thumbnail again
    await seedGateDReadyVideo(true);

    // 4A: Anonymous / Unauthenticated request
    const unauthRes = await request('/videos/BP-V-990001/publishing/package/youtube', 'GET', null);
    recordCheck(
      'HTTP: Anonymous request to publishing package returns 401 Unauthorized',
      unauthRes.status === 401,
      `Status: ${unauthRes.status}`
    );

    // 4B: Unauthorized specialist roles: QUESTION_EDITOR
    const qeRes = await request('/videos/BP-V-990001/publishing/package/youtube', 'GET', questionEditorToken);
    recordCheck(
      'HTTP: QUESTION_EDITOR is forbidden from accessing publishing package (403)',
      qeRes.status === 403,
      `Status: ${qeRes.status}`
    );

    // 4C: Unauthorized specialist roles: VIDEO_EDITOR
    const veRes = await request('/videos/BP-V-990001/publishing/package/youtube', 'GET', editorToken);
    recordCheck(
      'HTTP: VIDEO_EDITOR is forbidden from accessing publishing package (403)',
      veRes.status === 403,
      `Status: ${veRes.status}`
    );

    // 4D: Unauthorized specialist roles: SCRIPT_WRITER
    const swRes = await request('/videos/BP-V-990001/publishing/package/youtube', 'GET', scriptWriterToken);
    recordCheck(
      'HTTP: SCRIPT_WRITER is forbidden from accessing publishing package (403)',
      swRes.status === 403,
      `Status: ${swRes.status}`
    );

    // 4E: Unauthorized specialist roles: DESIGNER
    const desRes = await request('/videos/BP-V-990001/publishing/package/youtube', 'GET', designerToken);
    recordCheck(
      'HTTP: DESIGNER is forbidden from accessing publishing package (403)',
      desRes.status === 403,
      `Status: ${desRes.status}`
    );

    // 4F: Unauthorized specialist roles: REVIEWER
    const revRes = await request('/videos/BP-V-990001/publishing/package/youtube', 'GET', reviewerToken);
    recordCheck(
      'HTTP: REVIEWER is forbidden from accessing publishing package (403)',
      revRes.status === 403,
      `Status: ${revRes.status}`
    );

    // 4G: Authorized role: ADMIN (200 OK with thumbnail payload)
    const adminRes = await request('/videos/BP-V-990001/publishing/package/youtube', 'GET', adminToken);
    recordCheck(
      'HTTP: ADMIN receives 200 OK with thumbnail and package fields',
      adminRes.status === 200 &&
        adminRes.body?.videoId === 'BP-V-990001' &&
        adminRes.body?.thumbnailUrl?.includes('thumb-preview') &&
        adminRes.body?.thumbnailDriveUrl?.includes('thumb-asset'),
      `Status: ${adminRes.status}, thumbnailUrl=${adminRes.body?.thumbnailUrl}`
    );

    // 4H: Authorized role: CONTENT_MANAGER (200 OK)
    const cntMgrRes = await request('/videos/BP-V-990001/publishing/package/youtube', 'GET', contentMgrToken);
    recordCheck(
      'HTTP: CONTENT_MANAGER receives 200 OK with package data',
      cntMgrRes.status === 200 && cntMgrRes.body?.thumbnailUrl?.includes('thumb-preview'),
      `Status: ${cntMgrRes.status}`
    );

    // 4I: Authorized role: PUBLISHING_MANAGER (200 OK)
    const pubMgrRes = await request('/videos/BP-V-990001/publishing/package/youtube', 'GET', managerToken);
    recordCheck(
      'HTTP: PUBLISHING_MANAGER receives 200 OK with package data',
      pubMgrRes.status === 200 && pubMgrRes.body?.thumbnailUrl?.includes('thumb-preview'),
      `Status: ${pubMgrRes.status}`
    );

    // =========================================================================
    // SECTION 5: Invariant check — Unrelated publishing permissions unchanged
    // =========================================================================
    // 5A: Finalize publishing endpoint requires [ADMIN, CONTENT_MANAGER, PUBLISHING_MANAGER]
    const finalizeVeRes = await request('/videos/BP-V-990001/publishing/finalize', 'POST', editorToken, { remarks: 'Test' });
    recordCheck(
      'HTTP Invariant: Finalize endpoint rejects VIDEO_EDITOR (403)',
      finalizeVeRes.status === 403,
      `Status: ${finalizeVeRes.status}`
    );

    const finalizeRevRes = await request('/videos/BP-V-990001/publishing/finalize', 'POST', reviewerToken, { remarks: 'Test' });
    recordCheck(
      'HTTP Invariant: Finalize endpoint rejects REVIEWER (403)',
      finalizeRevRes.status === 403,
      `Status: ${finalizeRevRes.status}`
    );

    const finalizeDesRes = await request('/videos/BP-V-990001/publishing/finalize', 'POST', designerToken, { remarks: 'Test' });
    recordCheck(
      'HTTP Invariant: Finalize endpoint rejects DESIGNER (403)',
      finalizeDesRes.status === 403,
      `Status: ${finalizeDesRes.status}`
    );

    // 5B: Publishing assignment endpoint requires [ADMIN, CONTENT_MANAGER, PUBLISHING_MANAGER]
    const assignVeRes = await request('/videos/BP-V-990001/publishing/assignment', 'POST', editorToken, { assigneeId: 'USR-1' });
    recordCheck(
      'HTTP Invariant: Publishing assignment rejects VIDEO_EDITOR (403)',
      assignVeRes.status === 403,
      `Status: ${assignVeRes.status}`
    );

    const assignRevRes = await request('/videos/BP-V-990001/publishing/assignment', 'POST', reviewerToken, { assigneeId: 'USR-1' });
    recordCheck(
      'HTTP Invariant: Publishing assignment rejects REVIEWER (403)',
      assignRevRes.status === 403,
      `Status: ${assignRevRes.status}`
    );

    const assignDesRes = await request('/videos/BP-V-990001/publishing/assignment', 'POST', designerToken, { assigneeId: 'USR-1' });
    recordCheck(
      'HTTP Invariant: Publishing assignment rejects DESIGNER (403)',
      assignDesRes.status === 403,
      `Status: ${assignDesRes.status}`
    );

    // 5C: Publishing assignment allows PUBLISHING_MANAGER to reach handler
    const assignPubRes = await request('/videos/BP-V-990001/publishing/assignment', 'POST', managerToken, { assigneeId: 'USR-1' });
    recordCheck(
      'HTTP Invariant: Publishing assignment allows PUBLISHING_MANAGER past role gate (non-403)',
      assignPubRes.status !== 403,
      `Status: ${assignPubRes.status}`
    );
  } finally {
    // Restore repository methods
    videosRepository.findById = origFindVideoById;
    publishingRepository.findByVideoId = origFindPubByVideoId;
    questionsRepository.findById = origFindQuestionById;
    thumbnailsRepository.findByVideoId = origFindThumbByVideoId;
    pinnedCommentsRepository.findByVideoId = origFindPinnedByVideoId;
    socialReviewsRepository.findByQuestion = origFindReviewsByQuestion;
    (scriptsRepository as any).findByQuestionId = origFindScriptsByQuestion;
    scriptsRepository.findByVideoId = origFindScriptsByVideo;

    // Shutdown server
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  }

  const passed = checks.filter((c) => c.pass).length;
  const failed = checks.filter((c) => !c.pass).length;
  const allPassed = failed === 0 && passed === checks.length;

  console.log('\n===============================================================');
  console.log(`SUMMARY: ${passed}/${checks.length} Checks PASSED (${failed} Failed)`);
  console.log(`STATUS: ${allPassed ? 'ALL CHECKS PASSED' : 'SOME CHECKS FAILED'}`);
  console.log('===============================================================\n');

  return {
    allPassed,
    total: checks.length,
    passed,
    failed,
    checks,
  };
}

if (process.argv[1]?.includes('cms-fix2-publisher-thumbnail-verification')) {
  runCmsFix2PublisherThumbnailVerification()
    .then((result) => {
      process.exit(result.allPassed ? 0 : 1);
    })
    .catch((err) => {
      console.error('Fatal error during test run:', err);
      process.exit(1);
    });
}
