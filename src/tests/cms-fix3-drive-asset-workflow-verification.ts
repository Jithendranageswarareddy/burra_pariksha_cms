/**
 * BURRA PARIKSHA CMS — FIX 3: DRIVE ASSET WORKFLOW UX VERIFICATION SUITE
 *
 * Verifies:
 * 1. Raw Drive asset & folder links are correctly exposed and updatable for Video Editors:
 *    - driveFolderUrl and rawFootagePath stored, validated, and retrievable.
 * 2. Final render asset link & technical render specifications are exposed for Final Review:
 *    - finalRenderPath, width, height, format, duration exposed on Video model.
 * 3. Publisher package projection exposes final render asset link:
 *    - finalRenderAssetPath correctly resolved in PlatformPackageProjection alongside thumbnails.
 * 4. Missing asset links are handled safely across models and services:
 *    - No crashes, null/undefined safety, zero invented URLs.
 * 5. Unauthorized users cannot gain new access to video metadata:
 *    - Unauthenticated request -> 401.
 *    - QUESTION_EDITOR, SCRIPT_WRITER, DESIGNER, REVIEWER -> 403 Forbidden.
 *    - Unassigned VIDEO_EDITOR -> 403 Forbidden.
 * 6. Authorized roles succeed:
 *    - Assigned VIDEO_EDITOR -> 200 OK.
 *    - ADMIN & CONTENT_MANAGER -> 200 OK.
 * 7. Invariant check: Fix 1 & Fix 2 RBAC boundaries remain completely unchanged:
 *    - REVIEWER can perform final review transitions (EDITING, FINAL_REVIEW, READY_TO_UPLOAD).
 *    - REVIEWER cannot modify video metadata.
 *    - Publishing package endpoint preserves exact allowed roles.
 *
 * Strict ₹0 Constraint: Zero live AI calls, zero Google Sheets writes, zero GCS mutations.
 */

import express from 'express';
import http from 'http';
import { apiRouter } from '../server/routes';
import { authService } from '../lib/services/auth.service';
import { videoService } from '../lib/services/video.service';
import { publishingService } from '../lib/services/publishing.service';
import { objectAuthService } from '../lib/services/object-auth.service';
import { videosRepository } from '../lib/repositories/videos.repository';
import { publishingRepository } from '../lib/repositories/publishing.repository';
import { questionsRepository } from '../lib/repositories/questions.repository';
import { thumbnailsRepository } from '../lib/repositories/thumbnails.repository';
import { pinnedCommentsRepository } from '../lib/repositories/pinned-comments.repository';
import { scriptsRepository } from '../lib/repositories/scripts.repository';
import { socialReviewsRepository } from '../lib/repositories/social-reviews.repository';
import { SocialReviewService } from '../lib/services/social-review.service';
import { ProductionAssetValidationService } from '../lib/services/production-asset-validation.service';
import {
  UserRole,
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
  SocialPublishStatus,
} from '../types';

interface CheckItem {
  id: number;
  name: string;
  pass: boolean;
  details: string;
}

export async function runCmsFix3DriveAssetWorkflowVerification(): Promise<{
  allPassed: boolean;
  total: number;
  passed: number;
  failed: number;
  checks: CheckItem[];
}> {
  console.log('\n===============================================================');
  console.log('CMS COMPLETION — FIX 3: DRIVE ASSET WORKFLOW UX VERIFICATION');
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
  const contentMgrActor = { id: 'USR-CNTMGR', name: 'Content Manager', role: UserRole.CONTENT_MANAGER };
  const pubMgrActor = { id: 'USR-PUBMGR', name: 'Publishing Manager', role: UserRole.PUBLISHING_MANAGER };
  const assignedEditorActor = { id: 'USR-EDITOR-ASSIGNED', name: 'Assigned Editor', role: UserRole.VIDEO_EDITOR };
  const unassignedEditorActor = { id: 'USR-EDITOR-UNASSIGNED', name: 'Unassigned Editor', role: UserRole.VIDEO_EDITOR };
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
  const origUpdateVideoRecord = videosRepository.updateRecord;
  const origFindPubByVideoId = publishingRepository.findByVideoId;
  const origFindQuestionById = questionsRepository.findById;
  const origFindThumbByVideoId = thumbnailsRepository.findByVideoId;
  const origFindPinnedByVideoId = pinnedCommentsRepository.findByVideoId;
  const origFindReviewsByQuestion = socialReviewsRepository.findByQuestion;
  const origFindScriptsByQuestion = (scriptsRepository as any).findByQuestionId;
  const origFindScriptsByVideo = scriptsRepository.findByVideoId;

  videosRepository.findById = async (id: string) => mockVideos[id] || null;
  videosRepository.updateRecord = async (id: string, updates: Partial<Video>) => {
    if (!mockVideos[id]) return null;
    mockVideos[id] = { ...mockVideos[id], ...updates, updatedAt: new Date().toISOString() };
    return mockVideos[id];
  };
  publishingRepository.findByVideoId = async (vId: string) =>
    Object.values(mockPublishings).find((p) => p.videoId === vId) || null;
  questionsRepository.findById = async (qId: string) => mockQuestions[qId] || null;
  thumbnailsRepository.findByVideoId = async (vId: string) => mockThumbnails[vId] || null;
  pinnedCommentsRepository.findByVideoId = async (vId: string) => mockPinnedComments[vId] || null;
  socialReviewsRepository.findByQuestion = async (qId: string) => mockSocialReviews[qId] || [];
  (scriptsRepository as any).findByQuestionId = async (qId: string) => mockScripts[qId] || null;
  scriptsRepository.findByVideoId = async (vId: string) =>
    Object.values(mockScripts).find((s: any) => s.videoId === vId) || null;

  async function seedVideo(overrides?: Partial<Video>) {
    const videoId = 'BP-V-993001';
    const questionId = 'BP-Q-993001';

    const question: Question = {
      id: questionId,
      categoryId: 'CAT-MATH',
      categoryName: 'Speed Math',
      topicId: 'TOP-PERCENT',
      topicName: 'Percentages',
      subtopicId: 'SUB-TRICKS',
      subtopicName: 'Mental Tricks',
      difficulty: DifficultyLevel.MEDIUM,
      questionText: 'What is 30% of 500 in quick mental math?',
      options: [
        { identifier: 'A', text: '150' },
        { identifier: 'B', text: '200' },
        { identifier: 'C', text: '250' },
        { identifier: 'D', text: '300' },
      ],
      correctAnswer: 'A',
      explanation: '10% of 500 is 50. 50 * 3 = 150.',
      status: QuestionStatus.APPROVED,
      validationStatus: QuestionValidationStatus.VALID,
      language: QuestionLanguage.TELUGU,
      videoStatus: VideoProductionStatus.EDITING,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockQuestions[questionId] = question;

    const video: Video = {
      id: videoId,
      questionId,
      title: 'Mental Math | 30% Shortcut',
      status: VideoProductionStatus.EDITING,
      priority: PriorityLevel.NORMAL,
      assignedEditor: assignedEditorActor.id,
      driveFolderUrl: overrides?.driveFolderUrl ?? 'https://drive.google.com/drive/folders/bp-v-993001-raw-folder',
      rawFootagePath: overrides?.rawFootagePath ?? 'https://drive.google.com/file/d/bp-raw-footage-take1/view',
      finalRenderPath: overrides?.finalRenderPath ?? 'https://drive.google.com/file/d/bp-final-render-1080p/view',
      finalRenderWidth: overrides?.finalRenderWidth ?? 1080,
      finalRenderHeight: overrides?.finalRenderHeight ?? 1920,
      finalRenderFormat: overrides?.finalRenderFormat ?? 'MP4',
      finalRenderAspectRatio: overrides?.finalRenderAspectRatio ?? '9:16',
      actualDurationSeconds: overrides?.actualDurationSeconds ?? 42,
      targetDurationSeconds: 45,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...overrides,
    };
    mockVideos[videoId] = video;

    const publishing: Publishing = {
      id: 'PUB-993001',
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
      id: 'THM-993001',
      videoId,
      hookHeadline: '30% Shortcut',
      previewUrl: 'https://drive.google.com/file/d/thumb-prev/view',
      driveAssetUrl: 'https://drive.google.com/file/d/thumb-drive/view',
      status: 'APPROVED' as any,
      currentVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockPinnedComments[videoId] = {
      id: 'PIN-993001',
      videoId,
      commentText: 'Comment your answer!',
      solutionBreakdown: '50 * 3 = 150',
      isApproved: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockSocialReviews[questionId] = [{
      id: 'REV-993001',
      questionId,
      decision: SocialReviewStatus.APPROVED,
      reviewedVersionHash: 'TEMP_HASH',
      reviewerId: adminActor.id,
      reviewerName: adminActor.name,
      reviewerRole: adminActor.role,
      overallQualityScoreAtReview: 96,
      qualityStatusAtReview: SocialQualityStatus.EXCELLENT,
      reviewedAt: new Date().toISOString(),
    }];

    const bundle = await SocialReviewService.getReviewPackageBundle(questionId);
    mockSocialReviews[questionId][0].reviewedVersionHash = bundle.currentVersionHash;

    return { videoId, questionId };
  }

  // Build Express server
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

  // Tokens
  const adminToken = authService.generateSessionToken({
    userId: adminActor.id,
    name: adminActor.name,
    role: adminActor.role,
  });
  const contentMgrToken = authService.generateSessionToken({
    userId: contentMgrActor.id,
    name: contentMgrActor.name,
    role: contentMgrActor.role,
  });
  const assignedEditorToken = authService.generateSessionToken({
    userId: assignedEditorActor.id,
    name: assignedEditorActor.name,
    role: assignedEditorActor.role,
  });
  const unassignedEditorToken = authService.generateSessionToken({
    userId: unassignedEditorActor.id,
    name: unassignedEditorActor.name,
    role: unassignedEditorActor.role,
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
  const qeToken = authService.generateSessionToken({
    userId: questionEditorActor.id,
    name: questionEditorActor.name,
    role: questionEditorActor.role,
  });
  const swToken = authService.generateSessionToken({
    userId: scriptWriterActor.id,
    name: scriptWriterActor.name,
    role: scriptWriterActor.role,
  });
  const pubMgrToken = authService.generateSessionToken({
    userId: pubMgrActor.id,
    name: pubMgrActor.name,
    role: pubMgrActor.role,
  });

  try {
    // =========================================================================
    // GROUP 1: Video Editor Drive Asset & Raw Footage Exposure
    // =========================================================================
    await seedVideo();

    // 1A. Assigned Editor can update driveFolderUrl and rawFootagePath
    const updatedByEditor = await videoService.updateVideoMetadata(
      'BP-V-993001',
      {
        driveFolderUrl: 'https://drive.google.com/drive/folders/bp-v-993001-updated',
        rawFootagePath: 'https://drive.google.com/file/d/bp-raw-take2-updated/view',
      },
      assignedEditorActor
    );

    recordCheck(
      'Editor: Assigned editor can update driveFolderUrl via updateVideoMetadata',
      updatedByEditor.driveFolderUrl === 'https://drive.google.com/drive/folders/bp-v-993001-updated',
      `Got: ${updatedByEditor.driveFolderUrl}`
    );

    recordCheck(
      'Editor: Assigned editor can update rawFootagePath via updateVideoMetadata',
      updatedByEditor.rawFootagePath === 'https://drive.google.com/file/d/bp-raw-take2-updated/view',
      `Got: ${updatedByEditor.rawFootagePath}`
    );

    // 1B. Editor can retrieve updated video details with existing asset fields
    const fetchedForEditor = await videoService.getVideoById('BP-V-993001');
    recordCheck(
      'Editor: getVideoById correctly exposes updated driveFolderUrl and rawFootagePath',
      fetchedForEditor?.driveFolderUrl === 'https://drive.google.com/drive/folders/bp-v-993001-updated' &&
        fetchedForEditor?.rawFootagePath === 'https://drive.google.com/file/d/bp-raw-take2-updated/view',
      `drive=${fetchedForEditor?.driveFolderUrl}, raw=${fetchedForEditor?.rawFootagePath}`
    );

    // =========================================================================
    // GROUP 2: Final Reviewer Asset Link & Technical Spec Exposure
    // =========================================================================
    // 2A. Final Render Path and Specifications are exposed for review
    const updatedFinalRender = await videoService.updateVideoMetadata(
      'BP-V-993001',
      {
        finalRenderPath: 'https://drive.google.com/file/d/bp-master-render-1080p/view',
        finalRenderWidth: 1080,
        finalRenderHeight: 1920,
        finalRenderFormat: 'MP4',
        finalRenderAspectRatio: '9:16',
        actualDurationSeconds: 42,
      },
      assignedEditorActor
    );

    recordCheck(
      'Reviewer: Final render asset path is stored and exposed for reviewer inspection',
      updatedFinalRender.finalRenderPath === 'https://drive.google.com/file/d/bp-master-render-1080p/view',
      `finalRenderPath=${updatedFinalRender.finalRenderPath}`
    );

    recordCheck(
      'Reviewer: Technical render specs are stored and validated (width, height, format, duration, status)',
      updatedFinalRender.finalRenderWidth === 1080 &&
        updatedFinalRender.finalRenderHeight === 1920 &&
        updatedFinalRender.finalRenderFormat === 'MP4' &&
        updatedFinalRender.actualDurationSeconds === 42 &&
        updatedFinalRender.finalRenderValidationStatus === 'VALID',
      `specs=${updatedFinalRender.finalRenderWidth}x${updatedFinalRender.finalRenderHeight} ${updatedFinalRender.finalRenderFormat}, status=${updatedFinalRender.finalRenderValidationStatus}`
    );

    // 2B. Reviewer role CANNOT tamper with or modify video metadata
    let reviewerTamperBlocked = false;
    try {
      await videoService.updateVideoMetadata(
        'BP-V-993001',
        { title: 'Reviewer Tampered Title' },
        reviewerActor
      );
    } catch (err: any) {
      reviewerTamperBlocked = err.message.includes('REVIEWER');
    }

    recordCheck(
      'Reviewer: REVIEWER role is strictly barred from modifying video metadata (read-only verification)',
      reviewerTamperBlocked,
      `reviewerTamperBlocked=${reviewerTamperBlocked}`
    );

    // =========================================================================
    // GROUP 3: Publisher Package Projection Final Render & Thumbnail Links
    // =========================================================================
    // Set video to READY_TO_UPLOAD so Gate D readiness succeeds
    mockVideos['BP-V-993001'].status = VideoProductionStatus.READY_TO_UPLOAD;

    const pubPackage = await publishingService.getPlatformPackage(
      'BP-V-993001',
      'youtube',
      pubMgrActor
    );

    recordCheck(
      'Publisher: Package projection exposes finalRenderAssetPath',
      pubPackage.finalRenderAssetPath === 'https://drive.google.com/file/d/bp-master-render-1080p/view',
      `finalRenderAssetPath=${pubPackage.finalRenderAssetPath}`
    );

    recordCheck(
      'Publisher: Package projection simultaneously exposes thumbnail asset links',
      pubPackage.thumbnailUrl === 'https://drive.google.com/file/d/thumb-prev/view' &&
        pubPackage.thumbnailDriveUrl === 'https://drive.google.com/file/d/thumb-drive/view',
      `thumbnailUrl=${pubPackage.thumbnailUrl}, thumbnailDriveUrl=${pubPackage.thumbnailDriveUrl}`
    );

    // =========================================================================
    // GROUP 4: Safe Empty States & No Invented URLs
    // =========================================================================
    // 4A. Video with no driveFolderUrl, no rawFootagePath, no finalRenderPath
    await seedVideo({
      driveFolderUrl: undefined,
      rawFootagePath: undefined,
      finalRenderPath: undefined,
      finalRenderWidth: undefined,
      finalRenderHeight: undefined,
      status: VideoProductionStatus.EDITING,
    });

    const emptyVideo = await videoService.getVideoById('BP-V-993001');
    recordCheck(
      'Safe Empty: Video correctly returns undefined for empty asset fields without throwing',
      emptyVideo !== null &&
        emptyVideo.driveFolderUrl === undefined &&
        emptyVideo.rawFootagePath === undefined &&
        emptyVideo.finalRenderPath === undefined,
      `driveFolderUrl=${emptyVideo?.driveFolderUrl}, rawFootagePath=${emptyVideo?.rawFootagePath}, finalRenderPath=${emptyVideo?.finalRenderPath}`
    );

    // 4B. Validation service handles missing paths safely without throwing
    const emptyValidation = ProductionAssetValidationService.validateMetadata({
      finalRenderPath: '',
    } as any);

    recordCheck(
      'Safe Empty: ProductionAssetValidationService safely handles absent render path without crashing',
      emptyValidation !== null && typeof emptyValidation.status === 'string',
      `Validation status=${emptyValidation.status}`
    );

    // 4C. Package projection returns null for finalRenderAssetPath when both render and drive path are empty
    // Mark as READY_TO_UPLOAD with approved thumbnail
    mockVideos['BP-V-993001'].status = VideoProductionStatus.READY_TO_UPLOAD;
    mockVideos['BP-V-993001'].finalRenderPath = undefined;
    mockVideos['BP-V-993001'].driveFolderUrl = undefined;

    const emptyPkg = await publishingService.getPlatformPackage(
      'BP-V-993001',
      'youtube',
      adminActor
    );

    recordCheck(
      'Safe Empty: Platform package returns null for finalRenderAssetPath when absent (zero invented URLs)',
      emptyPkg.finalRenderAssetPath === null,
      `finalRenderAssetPath=${emptyPkg.finalRenderAssetPath}`
    );

    // =========================================================================
    // GROUP 5: HTTP Endpoint Authorization & Role Gate Tests (PUT /videos/:id)
    // =========================================================================
    await seedVideo();

    // 5A. Unauthenticated request
    const unauthRes = await request('/videos/BP-V-993001', 'PUT', null, {
      driveFolderUrl: 'https://evil.com',
    });
    recordCheck(
      'HTTP Auth: Anonymous PUT /videos/:id returns 401 Unauthorized',
      unauthRes.status === 401,
      `Status: ${unauthRes.status}`
    );

    // 5B. QUESTION_EDITOR forbidden
    const qeRes = await request('/videos/BP-V-993001', 'PUT', qeToken, {
      driveFolderUrl: 'https://drive.google.com/test',
    });
    recordCheck(
      'HTTP Auth: QUESTION_EDITOR cannot modify video assets/metadata (403)',
      qeRes.status === 403,
      `Status: ${qeRes.status}`
    );

    // 5C. SCRIPT_WRITER forbidden
    const swRes = await request('/videos/BP-V-993001', 'PUT', swToken, {
      driveFolderUrl: 'https://drive.google.com/test',
    });
    recordCheck(
      'HTTP Auth: SCRIPT_WRITER cannot modify video assets/metadata (403)',
      swRes.status === 403,
      `Status: ${swRes.status}`
    );

    // 5D. DESIGNER forbidden
    const desRes = await request('/videos/BP-V-993001', 'PUT', designerToken, {
      driveFolderUrl: 'https://drive.google.com/test',
    });
    recordCheck(
      'HTTP Auth: DESIGNER cannot modify video assets/metadata (403)',
      desRes.status === 403,
      `Status: ${desRes.status}`
    );

    // 5E. REVIEWER forbidden on metadata update
    const revRes = await request('/videos/BP-V-993001', 'PUT', reviewerToken, {
      driveFolderUrl: 'https://drive.google.com/test',
    });
    recordCheck(
      'HTTP Auth: REVIEWER cannot modify video assets/metadata (403)',
      revRes.status === 403,
      `Status: ${revRes.status}`
    );

    // 5F. Unassigned VIDEO_EDITOR forbidden by object-level auth
    const unassignedEditorRes = await request('/videos/BP-V-993001', 'PUT', unassignedEditorToken, {
      driveFolderUrl: 'https://drive.google.com/test',
    });
    recordCheck(
      'HTTP Auth: Unassigned VIDEO_EDITOR is forbidden from modifying video assets (403)',
      unassignedEditorRes.status === 403,
      `Status: ${unassignedEditorRes.status}`
    );

    // 5G. Assigned VIDEO_EDITOR succeeds
    const assignedEditorRes = await request('/videos/BP-V-993001', 'PUT', assignedEditorToken, {
      driveFolderUrl: 'https://drive.google.com/drive/folders/assigned-editor-verified',
      rawFootagePath: 'https://drive.google.com/file/d/assigned-editor-raw/view',
    });
    recordCheck(
      'HTTP Auth: Assigned VIDEO_EDITOR successfully updates asset links (200 OK)',
      assignedEditorRes.status === 200 &&
        assignedEditorRes.body?.driveFolderUrl === 'https://drive.google.com/drive/folders/assigned-editor-verified' &&
        assignedEditorRes.body?.rawFootagePath === 'https://drive.google.com/file/d/assigned-editor-raw/view',
      `Status: ${assignedEditorRes.status}, driveFolderUrl=${assignedEditorRes.body?.driveFolderUrl}`
    );

    // 5H. ADMIN succeeds
    const adminRes = await request('/videos/BP-V-993001', 'PUT', adminToken, {
      driveFolderUrl: 'https://drive.google.com/drive/folders/admin-verified',
    });
    recordCheck(
      'HTTP Auth: ADMIN successfully updates asset links (200 OK)',
      adminRes.status === 200 &&
        adminRes.body?.driveFolderUrl === 'https://drive.google.com/drive/folders/admin-verified',
      `Status: ${adminRes.status}`
    );

    // 5I. CONTENT_MANAGER succeeds
    const cntMgrRes = await request('/videos/BP-V-993001', 'PUT', contentMgrToken, {
      driveFolderUrl: 'https://drive.google.com/drive/folders/cntmgr-verified',
    });
    recordCheck(
      'HTTP Auth: CONTENT_MANAGER successfully updates asset links (200 OK)',
      cntMgrRes.status === 200 &&
        cntMgrRes.body?.driveFolderUrl === 'https://drive.google.com/drive/folders/cntmgr-verified',
      `Status: ${cntMgrRes.status}`
    );

    // =========================================================================
    // GROUP 6: Invariant Checks — Existing RBAC Boundaries from Fix 1 & 2
    // =========================================================================
    // 6A. Reviewer permitted final-review video status transitions
    mockVideos['BP-V-993001'].status = VideoProductionStatus.FINAL_REVIEW;

    // Allow reviewer in objectAuthService
    const origCanSubmit = objectAuthService.canSubmitSocialReview;
    objectAuthService.canSubmitSocialReview = async () => true;

    const revTransitionRes = await request('/videos/BP-V-993001/status', 'PATCH', reviewerToken, {
      status: VideoProductionStatus.READY_TO_UPLOAD,
      remarks: 'Approved by final reviewer after asset inspection',
    });

    recordCheck(
      'Invariant: REVIEWER can transition video to READY_TO_UPLOAD (Fix 1 preserved)',
      revTransitionRes.status === 200 && revTransitionRes.body?.status === VideoProductionStatus.READY_TO_UPLOAD,
      `Status: ${revTransitionRes.status}`
    );

    objectAuthService.canSubmitSocialReview = origCanSubmit;

    // 6B. Reviewer cannot perform non-review transitions (e.g. RECORDING)
    const revInvalidTransitionRes = await request('/videos/BP-V-993001/status', 'PATCH', reviewerToken, {
      status: VideoProductionStatus.RECORDING,
    });

    recordCheck(
      'Invariant: REVIEWER cannot perform non-review transitions like RECORDING (Fix 1 preserved)',
      revInvalidTransitionRes.status === 400 || revInvalidTransitionRes.status === 403,
      `Status: ${revInvalidTransitionRes.status}`
    );

    // 6C. Package copier endpoint preserves exact role gate
    const packageViewerRes = await request('/videos/BP-V-993001/publishing/package/youtube', 'GET', pubMgrToken);
    recordCheck(
      'Invariant: PUBLISHING_MANAGER can access publishing package (Fix 2 preserved)',
      packageViewerRes.status === 200 &&
        packageViewerRes.body?.videoId === 'BP-V-993001' &&
        packageViewerRes.body?.thumbnailUrl !== undefined,
      `Status: ${packageViewerRes.status}`
    );

    const editorPackageRes = await request('/videos/BP-V-993001/publishing/package/youtube', 'GET', assignedEditorToken);
    recordCheck(
      'Invariant: VIDEO_EDITOR cannot access publishing package (Fix 2 preserved)',
      editorPackageRes.status === 403,
      `Status: ${editorPackageRes.status}`
    );
  } finally {
    // Restore repositories
    videosRepository.findById = origFindVideoById;
    videosRepository.updateRecord = origUpdateVideoRecord;
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

if (process.argv[1]?.includes('cms-fix3-drive-asset-workflow-verification')) {
  runCmsFix3DriveAssetWorkflowVerification()
    .then((result) => {
      process.exit(result.allPassed ? 0 : 1);
    })
    .catch((err) => {
      console.error('Fatal error during test run:', err);
      process.exit(1);
    });
}
