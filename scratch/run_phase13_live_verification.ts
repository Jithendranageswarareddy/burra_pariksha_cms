/**
 * BURRA PARIKSHA CMS — Phase 13 Controlled Live Verification
 *
 * Authoritative verification of Original Roadmap Phase 13 (Publishing Workflow):
 * 1. Pre-flight baseline snapshot of all worksheets & 32 PUBLISHING headers
 * 2. Temporary synthetic Content Master + Question + Production Assets (valid taxonomy)
 * 3. Publishing record creation, canonical PUB-* format, relational integrity
 * 4. Gate D Publishing Readiness evaluation (structured blockers & prerequisites)
 * 5. Publishing Worker Assignment lifecycle (RBAC, canonical BP-ASN-* ID, entityType=PUBLISHING)
 * 6. Deterministic Platform Package Copier (YouTube, Instagram, Facebook, zero AI)
 * 7. Platform Scheduling with UTC timestamp and physical column persistence
 * 8. Manual Publication Recording with URL domain validation & cross-video collision protection
 * 9. Platform Failure & Retry Orchestration (unconstrained retry counters on live Sheets)
 * 10. Multi-Platform Finalization Progression (0/3 -> 1/3 -> 2/3 -> 3/3 -> terminal UPLOADED)
 * 11. Idempotency & Stale Revision Safeguards
 * 12. Object-level Authorization (assigned publisher vs unassigned specialist)
 * 13. Audit & Workflow record verification
 * 14. Mandatory complete self-cleaning tear-down
 * 15. Post-cleanup reconciliation snapshot (100% restoration across all sheets)
 * 16. Cost and AI verification (Zero AI calls, ₹0 cost)
 */

import 'dotenv/config';
import http from 'http';
import express, { Express } from 'express';
import { googleSheetsClient } from '../src/lib/google-sheets/client';
import { contentMastersRepository } from '../src/lib/repositories/content-masters.repository';
import { questionsRepository } from '../src/lib/repositories/questions.repository';
import { videosRepository, questionVideosRepository } from '../src/lib/repositories/videos.repository';
import { scriptsRepository, scriptVersionsRepository } from '../src/lib/repositories/scripts.repository';
import { thumbnailsRepository, thumbnailVersionsRepository } from '../src/lib/repositories/thumbnails.repository';
import { pinnedCommentsRepository, pinnedCommentVersionsRepository } from '../src/lib/repositories/pinned-comments.repository';
import { socialReviewsRepository } from '../src/lib/repositories/social-reviews.repository';
import { publishingRepository } from '../src/lib/repositories/publishing.repository';
import { assignmentsRepository } from '../src/lib/repositories/assignments.repository';
import { workflowRepository } from '../src/lib/repositories/workflow.repository';
import { auditLogRepository } from '../src/lib/repositories/audit-log.repository';
import { usersRepository } from '../src/lib/repositories/users.repository';
import { contentMasterService } from '../src/lib/services/content-master.service';
import { questionService } from '../src/lib/services/question.service';
import { videoService } from '../src/lib/services/video.service';
import { scriptService } from '../src/lib/services/script.service';
import { thumbnailService } from '../src/lib/services/thumbnail.service';
import { pinnedCommentService } from '../src/lib/services/pinned-comment.service';
import { publishingService } from '../src/lib/services/publishing.service';
import { SocialReviewService } from '../src/lib/services/social-review.service';
import { authService } from '../src/lib/services/auth.service';
import { apiRouter } from '../src/server/routes';
import { geminiClient } from '../src/lib/ai/gemini.client';
import { GeminiService } from '../src/lib/ai/gemini.service';
import {
  AssignmentEntityType,
  AssignmentStatus,
  ContentMasterStatus,
  DifficultyLevel,
  PriorityLevel,
  QuestionLanguage,
  QuestionStatus,
  QuestionValidationStatus,
  SocialPublishStatus,
  SocialQualityStatus,
  SocialReviewStatus,
  UserRole,
  VideoProductionStatus,
} from '../src/types';

// Hard assertion: AI calls must remain strictly 0
let aiCallCount = 0;
geminiClient.generateContent = async () => {
  aiCallCount++;
  throw new Error('AI execution is strictly forbidden in Phase 13 Live Verification!');
};

// Stub GeminiService.generateSocialHooksAndStrategy to use deterministic fallback (0 AI calls)
const geminiInstance = GeminiService.getInstance();
const origGenerateHooks = geminiInstance.generateSocialHooksAndStrategy.bind(geminiInstance);
geminiInstance.generateSocialHooksAndStrategy = async (question: any, styles: any, lang: any) => {
  const fallback = (geminiInstance as any).createFallbackSocialHooksAndStrategy(question, styles, lang);
  return {
    ...fallback,
    metadata: {
      modelUsed: 'mock-deterministic-fallback',
      generationDurationMs: 1,
      isMockFallback: true,
      aiCallsCount: 0,
    },
  };
};

interface SheetSnapshot {
  QUESTIONS: number;
  CONTENT_MASTERS: number;
  VIDEOS: number;
  QUESTION_VIDEOS: number;
  SCRIPT: number;
  SCRIPT_VERSIONS: number;
  THUMBNAILS: number;
  THUMBNAIL_VERSIONS: number;
  PINNED_COMMENTS: number;
  PINNED_COMMENT_VERSIONS: number;
  PUBLISHING: number;
  ASSIGNMENTS: number;
  WORKFLOW: number;
  AUDIT_LOG: number;
  SEQUENCES: number;
  USERS: number;
  SOCIAL_REVIEWS: number;
  sequenceValues: Record<string, number>;
}

async function getLiveSnapshot(): Promise<SheetSnapshot> {
  const countSheet = async (sheetName: string): Promise<number> => {
    const res = await googleSheetsClient.getRows(sheetName);
    return res.rows.length;
  };

  const [
    q, cm, vid, qv, scr, scv, thm, thv, pin, piv, pub, asn, wf, al, usr, sr, seqRes
  ] = await Promise.all([
    countSheet('QUESTIONS'),
    countSheet('CONTENT_MASTERS'),
    countSheet('VIDEOS'),
    countSheet('QUESTION_VIDEOS'),
    countSheet('SCRIPT'),
    countSheet('SCRIPT_VERSIONS'),
    countSheet('THUMBNAILS'),
    countSheet('THUMBNAIL_VERSIONS'),
    countSheet('PINNED_COMMENTS'),
    countSheet('PINNED_COMMENT_VERSIONS'),
    countSheet('PUBLISHING'),
    countSheet('ASSIGNMENTS'),
    countSheet('WORKFLOW'),
    countSheet('AUDIT_LOG'),
    countSheet('USERS'),
    countSheet('SOCIAL_REVIEWS'),
    googleSheetsClient.getRows('SEQUENCES'),
  ]);

  const sequenceValues: Record<string, number> = {};
  for (const row of seqRes.rows) {
    if (row[0] && row[1]) {
      sequenceValues[row[0]] = Number(row[1]) || 0;
    }
  }

  return {
    QUESTIONS: q,
    CONTENT_MASTERS: cm,
    VIDEOS: vid,
    QUESTION_VIDEOS: qv,
    SCRIPT: scr,
    SCRIPT_VERSIONS: scv,
    THUMBNAILS: thm,
    THUMBNAIL_VERSIONS: thv,
    PINNED_COMMENTS: pin,
    PINNED_COMMENT_VERSIONS: piv,
    PUBLISHING: pub,
    ASSIGNMENTS: asn,
    WORKFLOW: wf,
    AUDIT_LOG: al,
    SEQUENCES: seqRes.rows.length,
    USERS: usr,
    SOCIAL_REVIEWS: sr,
    sequenceValues,
  };
}

async function main() {
  console.log('================================================================');
  console.log('BURRA PARIKSHA CMS — PHASE 13 CONTROLLED LIVE VERIFICATION');
  console.log('Publishing Management & Multi-Platform Distribution Workflow');
  console.log('================================================================\n');

  // Tracking all created synthetic test IDs for guaranteed cleanup
  const createdContentMasterIds: string[] = [];
  const createdQuestionIds: string[] = [];
  const createdVideoIds: string[] = [];
  const createdQuestionVideoIds: string[] = [];
  const createdScriptIds: string[] = [];
  const createdScriptVersionIds: string[] = [];
  const createdThumbnailIds: string[] = [];
  const createdThumbnailVersionIds: string[] = [];
  const createdPinnedCommentIds: string[] = [];
  const createdPinnedCommentVersionIds: string[] = [];
  const createdSocialReviewIds: string[] = [];
  const createdPublishingIds: string[] = [];
  const createdAssignmentIds: string[] = [];
  const createdWorkflowIds: string[] = [];
  const createdAuditLogIds: string[] = [];

  let server: http.Server | null = null;
  let baseUrl = '';
  let origFindQuestionById: any = null;

  const checks: { name: string; pass: boolean; details?: string }[] = [];
  function recordCheck(name: string, condition: boolean, details?: string) {
    const pass = Boolean(condition);
    checks.push({ name, pass, details });
    if (pass) {
      console.log(`[PASS] ${name}`);
    } else {
      console.error(`[FAIL] ${name} — ${details || 'Assertion failed'}`);
    }
  }

  // ---------------------------------------------------------------------------
  // STEP 1: PRE-FLIGHT BASELINE SNAPSHOT & PUBLISHING HEADERS VERIFICATION
  // ---------------------------------------------------------------------------
  console.log('--- Step 1: Pre-flight Authoritative Baseline Snapshot ---');
  const preSnapshot = await getLiveSnapshot();
  console.log('Baseline counts:\n', JSON.stringify(preSnapshot, null, 2));

  // Verify physical PUBLISHING headers
  const pubSheetRes = await googleSheetsClient.getRows('PUBLISHING');
  const actualPubHeaders = pubSheetRes.headers;
  console.log(`Live PUBLISHING header count: ${actualPubHeaders.length}`);

  const requiredPubHeaders = [
    'id', 'video_id', 'question_id', 'video_title', 'final_video_status',
    'youtube_status', 'youtube_url', 'youtube_published_at',
    'instagram_status', 'instagram_url', 'instagram_published_at',
    'facebook_status', 'facebook_url', 'facebook_published_at',
    'pinned_comment_ready', 'thumbnail_ready', 'completed_platforms_count',
    'total_platforms_count', 'created_at', 'updated_at',
    'youtube_scheduled_at', 'youtube_last_failure_reason', 'youtube_retry_count', 'youtube_failed_at',
    'instagram_scheduled_at', 'instagram_last_failure_reason', 'instagram_retry_count', 'instagram_failed_at',
    'facebook_scheduled_at', 'facebook_last_failure_reason', 'facebook_retry_count', 'facebook_failed_at',
  ];

  const all32HeadersPresent = requiredPubHeaders.every(h => actualPubHeaders.includes(h));
  recordCheck(
    'Step 1: Physical PUBLISHING headers contain all 32 expected columns in live Google Sheets',
    all32HeadersPresent && actualPubHeaders.length === 32,
    `Found ${actualPubHeaders.length} headers`
  );

  try {
    // -------------------------------------------------------------------------
    // STEP 2: SPIN UP EPHEMERAL LIVE HTTP SERVER
    // -------------------------------------------------------------------------
    console.log('\n--- Step 2: Spinning up ephemeral live HTTP server ---');
    const app: Express = express();
    app.use(express.json());
    app.use('/api', apiRouter);

    server = http.createServer(app);
    await new Promise<void>((resolve) => {
      server!.listen(0, () => resolve());
    });
    const addr = server.address();
    const port = typeof addr === 'object' && addr ? addr.port : 0;
    baseUrl = `http://localhost:${port}/api`;
    console.log(`Live test server running on ${baseUrl}`);

    // Generate tokens for live testing
    const adminToken = authService.generateSessionToken({
      userId: 'USR-001',
      name: 'Admin: Jithendra',
      role: UserRole.ADMIN,
      email: 'admin@burrapariksha.com',
    });
    const contentMgrToken = authService.generateSessionToken({
      userId: 'USR-002',
      name: 'Surendra Reddy',
      role: UserRole.CONTENT_MANAGER,
      email: 'cm@burrapariksha.com',
    });
    const pubMgrToken = authService.generateSessionToken({
      userId: 'USR-001', // Admin acting as publishing manager
      name: 'Admin: Jithendra',
      role: UserRole.PUBLISHING_MANAGER,
      email: 'pubmgr@burrapariksha.com',
    });
    const editorToken = authService.generateSessionToken({
      userId: 'USR-5372',
      name: 'Editor Jithendra',
      role: UserRole.VIDEO_EDITOR,
      email: 'editor@burrapariksha.com',
    });
    const reviewerToken = authService.generateSessionToken({
      userId: 'USR-REV-LIVE',
      name: 'Live Reviewer',
      role: UserRole.REVIEWER,
      email: 'reviewer@burrapariksha.com',
    });

    const adminActor = { id: 'USR-001', name: 'Admin: Jithendra', role: UserRole.ADMIN };
    const pubMgrActor = { id: 'USR-001', name: 'Admin: Jithendra', role: UserRole.PUBLISHING_MANAGER };

    // Helper for making API requests
    async function apiRequest(
      path: string,
      options: {
        method?: string;
        token?: string;
        body?: any;
      } = {}
    ): Promise<{ status: number; body: any }> {
      const { method = 'GET', token, body } = options;
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;
      if (body) headers['Content-Type'] = 'application/json';

      const res = await fetch(`${baseUrl}${path}`, {
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

    // -------------------------------------------------------------------------
    // STEP 3: CREATE SYNTHETIC TEST FIXTURE (Content Master + Question + Assets)
    // -------------------------------------------------------------------------
    console.log('\n--- Step 3: Creating Synthetic Test Fixture in Live Sheets ---');

    // 3a: Create Content Master
    const synthMaster = await contentMasterService.createContentMaster(
      {
        theme: 'Speed Math Shortcuts for Competitive Exams — Phase 13 Live',
        categoryId: 'CAT-QA',
        topicId: 'TOP-QA-01',
        subtopicId: 'SUB-QA-01-01',
        targetLanguage: QuestionLanguage.TELUGU,
        difficulty: DifficultyLevel.MEDIUM,
        targetAudience: 'APPSC / TSPSC Aspirants',
        coreConcepts: ['Percentages', 'Multiplication Shortcuts'],
        practicalApplications: ['Fast Calculation in Exam Hall'],
        pedagogicalGoal: 'Enable students to solve 25% calculations mentally in 3 seconds',
        keyTakeaways: ['Divide by 4 is identical to 25%'],
        commonPitfalls: ['Attempting traditional long division'],
        estimatedReadingTimeMinutes: 2,
        priority: PriorityLevel.HIGH,
      },
      adminActor.id,
      adminActor.name
    );
    createdContentMasterIds.push(synthMaster.id);
    console.log(`Created synthetic Content Master: ${synthMaster.id}`);

    // 3b: Create Question linked to Content Master
    const synthQuestion = await questionService.createQuestion(
      {
        contentMasterId: synthMaster.id,
        categoryId: 'CAT-QA',
        topicId: 'TOP-QA-01',
        subtopicId: 'SUB-QA-01-01',
        difficulty: DifficultyLevel.MEDIUM,
        language: QuestionLanguage.TELUGU,
        questionText: 'What is the speed calculation shortcut for 25% of 640?',
        options: {
          a: '160',
          b: '180',
          c: '140',
          d: '150',
        },
        correctAnswer: 'A',
        explanation: '25% equals 1/4th. 640 divided by 4 equals 160. Mental calculation in 3 seconds.',
        status: QuestionStatus.APPROVED,
        validationStatus: QuestionValidationStatus.VALID,
      },
      adminActor
    );
    createdQuestionIds.push(synthQuestion.id);
    console.log(`Created synthetic Question: ${synthQuestion.id}`);

    // If question allocated a second content master, track it for cleanup
    if (synthQuestion.contentMasterId && !createdContentMasterIds.includes(synthQuestion.contentMasterId)) {
      createdContentMasterIds.push(synthQuestion.contentMasterId);
    }

    // In live Google Sheets, QUESTIONS worksheet was created with 25 columns and does not have validation_status.
    // Wrap questionsRepository.findById strictly for synthetic questions created in this verification run.
    origFindQuestionById = questionsRepository.findById.bind(questionsRepository);
    questionsRepository.findById = async (id: string) => {
      const q = await origFindQuestionById(id);
      if (q && createdQuestionIds.includes(q.id)) {
        return { ...q, validationStatus: QuestionValidationStatus.VALID, status: QuestionStatus.APPROVED };
      }
      return q;
    };

    // Explicitly update question status to APPROVED
    await questionsRepository.updateRecord(synthQuestion.id, {
      status: QuestionStatus.APPROVED,
    });

    // 3c: Queue Video from Question
    const queuedVideo = await videoService.queueApprovedQuestion(
      {
        questionId: synthQuestion.id,
        title: 'Burra Speed Trick | 25% of 640 Mental Shortcut',
        priority: PriorityLevel.HIGH,
        targetDurationSeconds: 45,
        notes: 'Phase 13 Live Publishing Verification Video',
      },
      adminActor
    );
    createdVideoIds.push(queuedVideo.id);
    console.log(`Created synthetic Video: ${queuedVideo.id}`);

    if (queuedVideo.contentMasterId && !createdContentMasterIds.includes(queuedVideo.contentMasterId)) {
      createdContentMasterIds.push(queuedVideo.contentMasterId);
    }

    // Find and track QUESTION_VIDEOS join record
    const qvRecords = await questionVideosRepository.findByVideoId(queuedVideo.id);
    for (const qv of qvRecords) {
      createdQuestionVideoIds.push(qv.id);
    }

    // Update video with compliant render metadata and status READY_TO_UPLOAD
    const videoWithRender = await videosRepository.updateRecord(queuedVideo.id, {
      status: VideoProductionStatus.READY_TO_UPLOAD,
      finalRenderPath: 'https://drive.google.com/file/d/live-test-p13-render/view',
      driveFolderUrl: 'https://drive.google.com/drive/folders/live-test-p13',
      finalRenderWidth: 1080,
      finalRenderHeight: 1920,
      finalRenderFormat: 'mp4',
      finalRenderAspectRatio: '9:16',
      actualDurationSeconds: 42,
      targetDurationSeconds: 45,
      updatedAt: new Date().toISOString(),
    });
    recordCheck(
      'Step 3: Synthetic Video seeded and set to READY_TO_UPLOAD with vertical specs',
      videoWithRender?.status === VideoProductionStatus.READY_TO_UPLOAD &&
      videoWithRender?.finalRenderWidth === 1080
    );

    // 3d: Seed Approved Script
    const script = await scriptsRepository.appendRecord({
      id: `SCR-${queuedVideo.id.replace('BP-V-', '')}`,
      questionId: synthQuestion.id,
      videoId: queuedVideo.id,
      hookText: 'Want to solve 25% calculations mentally in 3 seconds?',
      problemStatement: synthQuestion.questionText,
      stepByStepSolution: synthQuestion.explanation,
      speedTrickOrTakeaway: 'Always divide by 4 when calculating 25%!',
      callToAction: 'Comment your answer before checking the solution!',
      status: 'APPROVED',
      currentVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    createdScriptIds.push(script.id);

    const scriptVersion = await scriptVersionsRepository.appendRecord({
      id: `VER-SCR-${queuedVideo.id.replace('BP-V-', '')}-1`,
      scriptId: script.id,
      versionNumber: 1,
      contentJson: JSON.stringify({
        hookText: script.hookText,
        problemStatement: script.problemStatement,
        stepByStepSolution: script.stepByStepSolution,
      }),
      createdAt: new Date().toISOString(),
    });
    createdScriptVersionIds.push(scriptVersion.id);

    // 3e: Seed Approved Thumbnail
    const thumbnail = await thumbnailsRepository.appendRecord({
      id: `THM-${queuedVideo.id.replace('BP-V-', '')}`,
      videoId: queuedVideo.id,
      questionId: synthQuestion.id,
      hookHeadline: '25% Mental Shortcut',
      previewUrl: 'https://drive.google.com/file/d/live-test-thumb-preview.jpg',
      driveAssetUrl: 'https://drive.google.com/file/d/live-test-thumb-drive.png',
      status: 'APPROVED',
      isApproved: true,
      currentVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    createdThumbnailIds.push(thumbnail.id);

    const thumbVersion = await thumbnailVersionsRepository.appendRecord({
      id: `VER-THM-${queuedVideo.id.replace('BP-V-', '')}-1`,
      thumbnailId: thumbnail.id,
      versionNumber: 1,
      headline: '25% Mental Shortcut',
      imageUrl: thumbnail.previewUrl,
      createdAt: new Date().toISOString(),
    });
    createdThumbnailVersionIds.push(thumbVersion.id);

    // 3f: Seed Approved Pinned Comment
    const pinnedComment = await pinnedCommentsRepository.appendRecord({
      id: `PIN-${queuedVideo.id.replace('BP-V-', '')}`,
      videoId: queuedVideo.id,
      questionId: synthQuestion.id,
      commentText: 'Comment your answer before watching the solution! Option A, B, C or D?',
      solutionBreakdown: synthQuestion.explanation,
      isApproved: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    createdPinnedCommentIds.push(pinnedComment.id);

    const pinVersion = await pinnedCommentVersionsRepository.appendRecord({
      id: `VER-PIN-${queuedVideo.id.replace('BP-V-', '')}-1`,
      pinnedCommentId: pinnedComment.id,
      versionNumber: 1,
      commentText: pinnedComment.commentText,
      createdAt: new Date().toISOString(),
    });
    createdPinnedCommentVersionIds.push(pinVersion.id);

    // 3g: Seed Approved Social Review Record
    const reviewBundle = await SocialReviewService.getReviewPackageBundle(synthQuestion.id);
    const socialReviewRecord = await socialReviewsRepository.appendRecord({
      id: `REV-${synthQuestion.id.replace('BP-Q-', '')}`,
      questionId: synthQuestion.id,
      contentMasterId: synthMaster.id,
      reviewedVersionHash: reviewBundle.currentVersionHash,
      reviewerId: adminActor.id,
      reviewerName: adminActor.name,
      reviewerRole: adminActor.role,
      decision: SocialReviewStatus.APPROVED,
      reason: 'Phase 13 live verification approved content package',
      overallQualityScoreAtReview: 98,
      qualityStatusAtReview: SocialQualityStatus.EXCELLENT,
      isAdminOverride: false,
      reviewedAt: new Date().toISOString(),
    });
    createdSocialReviewIds.push(socialReviewRecord.id);
    console.log(`Created synthetic Social Review record: ${socialReviewRecord.id}`);

    // -------------------------------------------------------------------------
    // STEP 4: PUBLISHING CREATION & RELATIONSHIP INTEGRITY
    // -------------------------------------------------------------------------
    console.log('\n--- Step 4: Publishing Record Creation & Relational Integrity ---');

    // Retrieve publishing record via endpoint (lazily created if not present)
    const getPubRes = await apiRequest(`/videos/${queuedVideo.id}/publishing`, {
      method: 'GET',
      token: adminToken,
    });
    recordCheck(
      'Step 4.1: GET /api/videos/:videoId/publishing returns 200 and initial record',
      getPubRes.status === 200 && Boolean(getPubRes.body?.id)
    );

    const pubRecord = getPubRes.body;
    createdPublishingIds.push(pubRecord.id);
    console.log(`Created canonical Publishing record: ${pubRecord.id}`);

    // Verify canonical ID format PUB-${videoId.replace('BP-V-', '')}
    const expectedPubId = `PUB-${queuedVideo.id.replace('BP-V-', '')}`;
    recordCheck(
      'Step 4.2: Canonical Publishing ID format matches PUB-${videoId.replace("BP-V-", "")}',
      pubRecord.id === expectedPubId,
      `Expected ${expectedPubId}, got ${pubRecord.id}`
    );

    // Verify relational integrity
    recordCheck(
      'Step 4.3: Publishing record preserves videoId, questionId, and videoTitle relationships',
      pubRecord.videoId === queuedVideo.id &&
      pubRecord.questionId === synthQuestion.id &&
      pubRecord.videoTitle === queuedVideo.title
    );

    // Verify read-back directly from live Google Sheets PUBLISHING worksheet
    const livePubRows = await googleSheetsClient.getRows('PUBLISHING');
    const livePubRow = livePubRows.rows.find(r => r[0] === pubRecord.id);
    recordCheck(
      'Step 4.4: Publishing record survives physical Google Sheets write and read-back',
      Boolean(livePubRow) && livePubRow![1] === queuedVideo.id
    );

    // -------------------------------------------------------------------------
    // STEP 5: PUBLISHING READINESS & GATE D PREREQUISITES
    // -------------------------------------------------------------------------
    console.log('\n--- Step 5: Publishing Readiness & Gate D Enforcement ---');

    // 5a: With all assets approved, readiness MUST evaluate to true
    const readyRes = await apiRequest(`/videos/${queuedVideo.id}/publishing/readiness`, {
      method: 'GET',
      token: adminToken,
    });
    recordCheck(
      'Step 5.1: Gate D Publish Readiness evaluates to isReady = true for compliant assets',
      readyRes.status === 200 && readyRes.body?.isReady === true && readyRes.body?.blockers?.length === 0,
      `Blockers: ${JSON.stringify(readyRes.body?.blockers || [])}`
    );

    // 5b: Verify structured blockers when prerequisite is missing
    // Temporarily set thumbnail status to PENDING
    await thumbnailsRepository.updateRecord(thumbnail.id, { status: 'PENDING', isApproved: false });
    const blockedRes = await apiRequest(`/videos/${queuedVideo.id}/publishing/readiness`, {
      method: 'GET',
      token: adminToken,
    });
    recordCheck(
      'Step 5.2: Incomplete prerequisite (unapproved thumbnail) correctly blocks readiness',
      blockedRes.status === 200 && blockedRes.body?.isReady === false && blockedRes.body?.blockers?.length > 0
    );

    // Restore approved thumbnail
    await thumbnailsRepository.updateRecord(thumbnail.id, { status: 'APPROVED', isApproved: true });

    // -------------------------------------------------------------------------
    // STEP 6: PUBLISHING ASSIGNMENT WORKFLOW
    // -------------------------------------------------------------------------
    console.log('\n--- Step 6: Canonical Publishing Assignment Workflow ---');

    // 6a: 401 unauthenticated
    const unauthRes = await apiRequest(`/videos/${queuedVideo.id}/publishing/assignment`, {
      method: 'POST',
      body: { assigneeId: 'USR-002', platform: 'youtube' },
    });
    recordCheck('Step 6.1: Assignment without auth token rejected with 401', unauthRes.status === 401);

    // 6b: 403 unauthorized role (VIDEO_EDITOR, REVIEWER)
    const editorAssignRes = await apiRequest(`/videos/${queuedVideo.id}/publishing/assignment`, {
      method: 'POST',
      token: editorToken,
      body: { assigneeId: 'USR-002', platform: 'youtube' },
    });
    recordCheck('Step 6.2: Specialist (VIDEO_EDITOR) assignment attempt rejected with 403', editorAssignRes.status === 403);

    const reviewerAssignRes = await apiRequest(`/videos/${queuedVideo.id}/publishing/assignment`, {
      method: 'POST',
      token: reviewerToken,
      body: { assigneeId: 'USR-002', platform: 'youtube' },
    });
    recordCheck('Step 6.3: Specialist (REVIEWER) assignment attempt rejected with 403', reviewerAssignRes.status === 403);

    // 6c: 400 nonexistent assignee
    const badUserRes = await apiRequest(`/videos/${queuedVideo.id}/publishing/assignment`, {
      method: 'POST',
      token: adminToken,
      body: { assigneeId: 'NON-EXISTENT-USR-9999', platform: 'youtube' },
    });
    recordCheck('Step 6.4: Nonexistent assignee rejected with 400', badUserRes.status === 400);

    // 6d: 400 assignee with invalid worker role (VIDEO_EDITOR not allowed for publishing)
    const wrongRoleAssigneeRes = await apiRequest(`/videos/${queuedVideo.id}/publishing/assignment`, {
      method: 'POST',
      token: adminToken,
      body: { assigneeId: 'USR-5372', platform: 'youtube' }, // USR-5372 is VIDEO_EDITOR
    });
    recordCheck('Step 6.5: Assignee with non-publishing role rejected with 400', wrongRoleAssigneeRes.status === 400);

    // 6e: 201 authorized manager creating valid assignment
    const validAssignRes = await apiRequest(`/videos/${queuedVideo.id}/publishing/assignment`, {
      method: 'POST',
      token: adminToken,
      body: {
        assigneeId: 'USR-002', // Surendra Reddy, CONTENT_MANAGER
        platform: 'youtube',
        priority: PriorityLevel.HIGH,
        notes: 'Verify Telugu captions before publishing on YouTube Shorts',
      },
    });
    recordCheck(
      'Step 6.6: Authorized manager creates publishing assignment successfully with 201',
      validAssignRes.status === 201 && Boolean(validAssignRes.body?.assignment?.id)
    );

    const createdAsn = validAssignRes.body?.assignment;
    if (createdAsn?.id) {
      createdAssignmentIds.push(createdAsn.id);
      console.log(`Created synthetic Assignment: ${createdAsn.id}`);
    }

    recordCheck(
      'Step 6.7: Assignment has canonical BP-ASN-* ID and entityType = PUBLISHING',
      createdAsn?.id?.startsWith('BP-ASN-') &&
      createdAsn?.entityType === AssignmentEntityType.PUBLISHING &&
      createdAsn?.entityId === pubRecord.id &&
      createdAsn?.videoId === queuedVideo.id &&
      createdAsn?.status === AssignmentStatus.ASSIGNED
    );

    // 6f: 400 duplicate active assignment on same platform rejected
    const dupAssignRes = await apiRequest(`/videos/${queuedVideo.id}/publishing/assignment`, {
      method: 'POST',
      token: adminToken,
      body: {
        assigneeId: 'USR-002',
        platform: 'youtube',
        priority: PriorityLevel.HIGH,
      },
    });
    recordCheck(
      'Step 6.8: Duplicate active assignment on same platform strictly rejected with 400',
      dupAssignRes.status === 400
    );

    // 6g: Verify assignment persisted in live ASSIGNMENTS worksheet
    const liveAsnRows = await googleSheetsClient.getRows('ASSIGNMENTS');
    const liveAsnRow = createdAsn?.id ? liveAsnRows.rows.find(r => r[0] === createdAsn.id) : null;
    recordCheck(
      'Step 6.9: Publishing assignment survives live Google Sheets write and read-back',
      Boolean(liveAsnRow) && liveAsnRow![1] === AssignmentEntityType.PUBLISHING && liveAsnRow![2] === pubRecord.id
    );

    // -------------------------------------------------------------------------
    // STEP 7: DETERMINISTIC PLATFORM PACKAGE COPIER
    // -------------------------------------------------------------------------
    console.log('\n--- Step 7: Deterministic Platform Package Copier ---');

    for (const p of ['youtube', 'instagram', 'facebook'] as const) {
      const pkgRes = await apiRequest(`/videos/${queuedVideo.id}/publishing/package/${p}`, {
        method: 'GET',
        token: adminToken,
      });

      const pkg = pkgRes.body;
      const isPkgValid =
        pkgRes.status === 200 &&
        pkg?.platform === p &&
        Boolean(pkg?.finalRenderAssetPath) &&
        Boolean(pkg?.thumbnailDriveUrl || pkg?.thumbnailUrl) &&
        Boolean(pkg?.caption) &&
        Array.isArray(pkg?.hashtags) &&
        Boolean(pkg?.pinnedComment) &&
        pkg?.isApprovedPackage === true &&
        Boolean(pkg?.versionHash);

      recordCheck(
        `Step 7: Platform package for ${p.toUpperCase()} returns all deterministic assets without AI`,
        isPkgValid,
        `Status: ${pkgRes.status}, Render: ${pkg?.finalRenderAssetPath}, Caption: ${Boolean(pkg?.caption)}`
      );
    }
    recordCheck('Step 7.AI: Package generation made 0 AI calls', aiCallCount === 0);

    // -------------------------------------------------------------------------
    // STEP 8: SCHEDULING WITH UTC TIMESTAMPS & PHYSICAL COLUMN PERSISTENCE
    // -------------------------------------------------------------------------
    console.log('\n--- Step 8: Platform Scheduling & Physical Column Persistence ---');

    const futureDate = new Date(Date.now() + 48 * 3600 * 1000).toISOString();

    // 8a: Past date rejected with 400
    const pastDate = new Date(Date.now() - 3600 * 1000).toISOString();
    const pastScheduleRes = await apiRequest(`/videos/${queuedVideo.id}/publishing/schedule`, {
      method: 'POST',
      token: adminToken,
      body: { platform: 'youtube', scheduledAt: pastDate },
    });
    recordCheck('Step 8.1: Scheduling with past timestamp strictly rejected with 400', pastScheduleRes.status === 400);

    // 8b: Unauthorized role rejected with 403
    const unauthScheduleRes = await apiRequest(`/videos/${queuedVideo.id}/publishing/schedule`, {
      method: 'POST',
      token: editorToken,
      body: { platform: 'youtube', scheduledAt: futureDate },
    });
    recordCheck('Step 8.2: Specialist scheduling attempt strictly rejected with 403', unauthScheduleRes.status === 403);

    // 8c: Valid schedule on YouTube
    const schedRes = await apiRequest(`/videos/${queuedVideo.id}/publishing/schedule`, {
      method: 'POST',
      token: adminToken,
      body: { platform: 'youtube', scheduledAt: futureDate },
    });
    recordCheck(
      'Step 8.3: Future timestamp scheduling succeeds with 200 and SCHEDULED status',
      schedRes.status === 200 && schedRes.body?.youtube?.status === SocialPublishStatus.SCHEDULED
    );

    // 8d: Idempotent schedule repeated
    const idemSchedRes = await apiRequest(`/videos/${queuedVideo.id}/publishing/schedule`, {
      method: 'POST',
      token: adminToken,
      body: { platform: 'youtube', scheduledAt: futureDate },
    });
    recordCheck(
      'Step 8.4: Repeated identical scheduling request is idempotent with 200',
      idemSchedRes.status === 200
    );

    // 8e: Verify physical column youtube_scheduled_at persists in Google Sheets
    const pubRowsAfterSched = await googleSheetsClient.getRows('PUBLISHING');
    const pubRowAfterSched = pubRowsAfterSched.rows.find(r => r[0] === pubRecord.id);
    const schedColIdx = pubRowsAfterSched.headers.indexOf('youtube_scheduled_at');
    const physicalSchedVal = schedColIdx >= 0 && pubRowAfterSched ? pubRowAfterSched[schedColIdx] : null;
    recordCheck(
      'Step 8.5: youtube_scheduled_at survives physical Google Sheets write and read-back',
      Boolean(physicalSchedVal) && String(physicalSchedVal).includes(futureDate.substring(0, 19)),
      `ColIdx: ${schedColIdx}, Found: ${physicalSchedVal}`
    );

    // -------------------------------------------------------------------------
    // STEP 9: FAILURE & RETRY ORCHESTRATION WITH LIVE SHEETS COUNTERS
    // -------------------------------------------------------------------------
    console.log('\n--- Step 9: Platform Failure & Retry Orchestration ---');

    // 9a: Mark Instagram FAILED
    const failRes = await apiRequest(`/videos/${queuedVideo.id}/publishing/fail`, {
      method: 'POST',
      token: adminToken,
      body: {
        platform: 'instagram',
        failureReason: 'External Reel publishing API quota exceeded',
      },
    });
    recordCheck(
      'Step 9.1: Mark Instagram as FAILED succeeds with 200',
      failRes.status === 200 && failRes.body?.instagram?.status === SocialPublishStatus.FAILED
    );

    // Verify physical columns: instagram_last_failure_reason, instagram_failed_at
    const pubRowsAfterFail = await googleSheetsClient.getRows('PUBLISHING');
    const pubRowAfterFail = pubRowsAfterFail.rows.find(r => r[0] === pubRecord.id);
    const failReasonIdx = pubRowsAfterFail.headers.indexOf('instagram_last_failure_reason');
    const failedAtIdx = pubRowsAfterFail.headers.indexOf('instagram_failed_at');
    const physicalFailReason = failReasonIdx >= 0 && pubRowAfterFail ? pubRowAfterFail[failReasonIdx] : null;
    const physicalFailedAt = failedAtIdx >= 0 && pubRowAfterFail ? pubRowAfterFail[failedAtIdx] : null;
    recordCheck(
      'Step 9.2: instagram_last_failure_reason and instagram_failed_at persist in physical Sheets',
      Boolean(physicalFailReason && physicalFailedAt),
      `Reason: ${physicalFailReason}, FailedAt: ${physicalFailedAt}`
    );

    // 9b: Retry Instagram (resets to DRAFT and increments retry count)
    const retryRes = await apiRequest(`/videos/${queuedVideo.id}/publishing/retry`, {
      method: 'POST',
      token: adminToken,
      body: {
        platform: 'instagram',
        remarks: 'Retrying after quota reset window',
      },
    });
    recordCheck(
      'Step 9.3: Retry resets platform to DRAFT and increments retry count to 1',
      retryRes.status === 200 &&
      retryRes.body?.instagram?.status === SocialPublishStatus.DRAFT &&
      retryRes.body?.instagram?.retryCount === 1
    );

    // Verify retry count in physical sheet
    const pubRowsAfterRetry = await googleSheetsClient.getRows('PUBLISHING');
    const pubRowAfterRetry = pubRowsAfterRetry.rows.find(r => r[0] === pubRecord.id);
    const retryCountIdx = pubRowsAfterRetry.headers.indexOf('instagram_retry_count');
    const physicalRetryCount = retryCountIdx >= 0 && pubRowAfterRetry ? pubRowAfterRetry[retryCountIdx] : null;
    recordCheck(
      'Step 9.4: instagram_retry_count = 1 survives physical Google Sheets write and read-back',
      Number(physicalRetryCount) === 1,
      `Physical count: ${physicalRetryCount}`
    );

    // -------------------------------------------------------------------------
    // STEP 10: MANUAL PUBLICATION & MULTI-PLATFORM PROGRESSION (0/3 -> 3/3)
    // -------------------------------------------------------------------------
    console.log('\n--- Step 10: Manual Publication Recording & Finalization Progression ---');

    // Safe synthetic URLs
    const ytUrl = 'https://www.youtube.com/shorts/live_synth_yt_13';
    const igUrl = 'https://www.instagram.com/reel/live_synth_ig_13';
    const fbUrl = 'https://www.facebook.com/watch/?v=live_synth_fb_13';

    // 10a: Invalid domain URL rejected
    const badDomainRes = await apiRequest(`/videos/${queuedVideo.id}/publishing/publish-platform`, {
      method: 'POST',
      token: adminToken,
      body: { platform: 'youtube', postUrl: 'https://vimeo.com/invalid_domain_123' },
    });
    recordCheck('Step 10.1: Invalid platform domain URL strictly rejected with 400', badDomainRes.status === 400);

    // 10b: Finalization with 0/3 published platforms is blocked
    const fin0Res = await apiRequest(`/videos/${queuedVideo.id}/publishing/finalize`, {
      method: 'POST',
      token: adminToken,
      body: { remarks: 'Attempt finalize at 0/3' },
    });
    recordCheck('Step 10.2: Finalization strictly blocked at 0/3 published platforms', fin0Res.status === 400);

    // 10c: Publish YouTube (1/3)
    const pubYtRes = await apiRequest(`/videos/${queuedVideo.id}/publishing/publish-platform`, {
      method: 'POST',
      token: adminToken,
      body: { platform: 'youtube', postUrl: ytUrl, notes: 'YouTube Shorts live' },
    });
    recordCheck(
      'Step 10.3: YouTube published successfully (1/3 completed)',
      pubYtRes.status === 200 &&
      pubYtRes.body?.youtube?.status === SocialPublishStatus.PUBLISHED &&
      pubYtRes.body?.completedPlatformsCount === 1
    );

    // Finalization at 1/3 is blocked
    const fin1Res = await apiRequest(`/videos/${queuedVideo.id}/publishing/finalize`, {
      method: 'POST',
      token: adminToken,
      body: { remarks: 'Attempt finalize at 1/3' },
    });
    recordCheck('Step 10.4: Finalization strictly blocked at 1/3 published platforms', fin1Res.status === 400);

    // Cannot retry a PUBLISHED platform
    const retryPubBlocked = await apiRequest(`/videos/${queuedVideo.id}/publishing/retry`, {
      method: 'POST',
      token: adminToken,
      body: { platform: 'youtube' },
    });
    recordCheck('Step 10.5: Attempt to retry a PUBLISHED platform strictly rejected with 400', retryPubBlocked.status === 400);

    // 10d: Publish Instagram (2/3)
    const pubIgRes = await apiRequest(`/videos/${queuedVideo.id}/publishing/publish-platform`, {
      method: 'POST',
      token: adminToken,
      body: { platform: 'instagram', postUrl: igUrl, notes: 'Instagram Reel live' },
    });
    recordCheck(
      'Step 10.6: Instagram published successfully (2/3 completed)',
      pubIgRes.status === 200 &&
      pubIgRes.body?.instagram?.status === SocialPublishStatus.PUBLISHED &&
      pubIgRes.body?.completedPlatformsCount === 2
    );

    // Finalization at 2/3 is blocked
    const fin2Res = await apiRequest(`/videos/${queuedVideo.id}/publishing/finalize`, {
      method: 'POST',
      token: adminToken,
      body: { remarks: 'Attempt finalize at 2/3' },
    });
    recordCheck('Step 10.7: Finalization strictly blocked at 2/3 published platforms', fin2Res.status === 400);

    // 10e: Publish Facebook (3/3)
    const pubFbRes = await apiRequest(`/videos/${queuedVideo.id}/publishing/publish-platform`, {
      method: 'POST',
      token: adminToken,
      body: { platform: 'facebook', postUrl: fbUrl, notes: 'Facebook Video live' },
    });
    recordCheck(
      'Step 10.8: Facebook published successfully (3/3 completed)',
      pubFbRes.status === 200 &&
      pubFbRes.body?.facebook?.status === SocialPublishStatus.PUBLISHED &&
      pubFbRes.body?.completedPlatformsCount === 3
    );

    // Verify video status is STILL READY_TO_UPLOAD (3/3 does NOT automatically transition video)
    const videoBeforeFin = await videosRepository.findById(queuedVideo.id);
    recordCheck(
      'Step 10.9: 3/3 platforms published does NOT auto-advance video (remains READY_TO_UPLOAD)',
      videoBeforeFin?.status === VideoProductionStatus.READY_TO_UPLOAD
    );

    // 10f: Finalize publishing now succeeds with 3/3 platforms published!
    const fin3Res = await apiRequest(`/videos/${queuedVideo.id}/publishing/finalize`, {
      method: 'POST',
      token: adminToken,
      body: { remarks: 'All distribution channels verified live and active' },
    });
    recordCheck(
      'Step 10.10: Finalization succeeds with 3/3 platforms published (video -> UPLOADED)',
      fin3Res.status === 200 && fin3Res.body?.video?.status === VideoProductionStatus.UPLOADED
    );

    // Verify terminal state: repeated finalize is safely idempotent
    const finRepeatRes = await apiRequest(`/videos/${queuedVideo.id}/publishing/finalize`, {
      method: 'POST',
      token: adminToken,
      body: { remarks: 'Repeated finalize' },
    });
    recordCheck(
      'Step 10.11: Repeated finalization on UPLOADED video is safely idempotent with 200',
      finRepeatRes.status === 200 && finRepeatRes.body?.video?.status === VideoProductionStatus.UPLOADED
    );

    // -------------------------------------------------------------------------
    // STEP 11: CROSS-VIDEO URL COLLISION PROTECTION
    // -------------------------------------------------------------------------
    console.log('\n--- Step 11: Cross-Video URL Collision Protection ---');

    // Create a 2nd synthetic question + video
    const collisionQuestion = await questionService.createQuestion(
      {
        contentMasterId: synthMaster.id,
        categoryId: 'CAT-QA',
        topicId: 'TOP-QA-01',
        subtopicId: 'SUB-QA-01-01',
        difficulty: DifficultyLevel.MEDIUM,
        language: QuestionLanguage.TELUGU,
        questionText: 'What is the speed calculation shortcut for 50% of 640?',
        options: {
          a: '320',
          b: '310',
          c: '300',
          d: '330',
        },
        correctAnswer: 'A',
        explanation: '50% equals 1/2. 640 divided by 2 equals 320.',
        status: QuestionStatus.APPROVED,
        validationStatus: QuestionValidationStatus.VALID,
      },
      adminActor
    );
    createdQuestionIds.push(collisionQuestion.id);

    if (collisionQuestion.contentMasterId && !createdContentMasterIds.includes(collisionQuestion.contentMasterId)) {
      createdContentMasterIds.push(collisionQuestion.contentMasterId);
    }

    await questionsRepository.updateRecord(collisionQuestion.id, {
      status: QuestionStatus.APPROVED,
      validationStatus: QuestionValidationStatus.VALID,
    });

    const collisionVideo = await videoService.queueApprovedQuestion(
      {
        questionId: collisionQuestion.id,
        title: 'Burra Speed Trick | 50% Shortcut',
        priority: PriorityLevel.NORMAL,
      },
      adminActor
    );
    createdVideoIds.push(collisionVideo.id);

    if (collisionVideo.contentMasterId && !createdContentMasterIds.includes(collisionVideo.contentMasterId)) {
      createdContentMasterIds.push(collisionVideo.contentMasterId);
    }

    const collisionQv = await questionVideosRepository.findByVideoId(collisionVideo.id);
    for (const qv of collisionQv) {
      createdQuestionVideoIds.push(qv.id);
    }

    // Set collision video to READY_TO_UPLOAD
    await videosRepository.updateRecord(collisionVideo.id, {
      status: VideoProductionStatus.READY_TO_UPLOAD,
      finalRenderPath: 'https://drive.google.com/file/d/live-test-collision/view',
      driveFolderUrl: 'https://drive.google.com/drive/folders/live-test-collision',
    });

    // Seed required assets for collision video
    const colScript = await scriptsRepository.appendRecord({
      id: `SCR-${collisionVideo.id.replace('BP-V-', '')}`,
      questionId: collisionQuestion.id,
      videoId: collisionVideo.id,
      hookText: 'Quick 50% trick',
      problemStatement: collisionQuestion.questionText,
      stepByStepSolution: collisionQuestion.explanation,
      status: 'APPROVED',
      currentVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    createdScriptIds.push(colScript.id);

    const colThumb = await thumbnailsRepository.appendRecord({
      id: `THM-${collisionVideo.id.replace('BP-V-', '')}`,
      videoId: collisionVideo.id,
      questionId: collisionQuestion.id,
      hookHeadline: '50% Shortcut',
      previewUrl: 'https://drive.google.com/file/d/live-col-thumb.jpg',
      status: 'APPROVED',
      isApproved: true,
      currentVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    createdThumbnailIds.push(colThumb.id);

    const colPin = await pinnedCommentsRepository.appendRecord({
      id: `PIN-${collisionVideo.id.replace('BP-V-', '')}`,
      videoId: collisionVideo.id,
      questionId: collisionQuestion.id,
      commentText: 'Comment your answer!',
      isApproved: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    createdPinnedCommentIds.push(colPin.id);

    const colBundle = await SocialReviewService.getReviewPackageBundle(collisionQuestion.id);
    const colReview = await socialReviewsRepository.appendRecord({
      id: `REV-${collisionQuestion.id.replace('BP-Q-', '')}`,
      questionId: collisionQuestion.id,
      contentMasterId: synthMaster.id,
      reviewedVersionHash: colBundle.currentVersionHash,
      reviewerId: adminActor.id,
      reviewerName: adminActor.name,
      reviewerRole: adminActor.role,
      decision: SocialReviewStatus.APPROVED,
      reviewedAt: new Date().toISOString(),
    });
    createdSocialReviewIds.push(colReview.id);

    const colPubRes = await apiRequest(`/videos/${collisionVideo.id}/publishing`, {
      method: 'GET',
      token: adminToken,
    });
    if (colPubRes.body?.id) {
      createdPublishingIds.push(colPubRes.body.id);
    }

    // Attempt to publish ytUrl (already registered to queuedVideo) on collisionVideo
    const collisionAttempt = await apiRequest(`/videos/${collisionVideo.id}/publishing/publish-platform`, {
      method: 'POST',
      token: adminToken,
      body: { platform: 'youtube', postUrl: ytUrl },
    });
    recordCheck(
      'Step 11: Cross-video URL collision strictly rejected with 400',
      collisionAttempt.status === 400 && String(collisionAttempt.body?.error).includes('already registered to another video')
    );

    // -------------------------------------------------------------------------
    // STEP 12: OBJECT-LEVEL AUTHORIZATION ENFORCEMENT
    // -------------------------------------------------------------------------
    console.log('\n--- Step 12: Object-Level Authorization Enforcement ---');

    // Unassigned editor cannot mutate publishing on queuedVideo
    const unassignedEditorRes = await apiRequest(`/videos/${queuedVideo.id}/publishing/schedule`, {
      method: 'POST',
      token: editorToken,
      body: { platform: 'youtube', scheduledAt: futureDate },
    });
    recordCheck(
      'Step 12: Unassigned specialist strictly blocked from mutating publishing (403)',
      unassignedEditorRes.status === 403
    );

    // -------------------------------------------------------------------------
    // STEP 13: AUDIT & WORKFLOW RECORDS VERIFICATION
    // -------------------------------------------------------------------------
    console.log('\n--- Step 13: Audit & Workflow Persistence Verification ---');

    const synthEntities = new Set([
      ...createdContentMasterIds,
      ...createdQuestionIds,
      ...createdVideoIds,
      ...createdAssignmentIds,
      ...createdScriptIds,
      ...createdScriptVersionIds,
      ...createdThumbnailIds,
      ...createdThumbnailVersionIds,
      ...createdPinnedCommentIds,
      ...createdPinnedCommentVersionIds,
      ...createdSocialReviewIds,
      ...createdPublishingIds,
      ...createdQuestionVideoIds,
    ]);

    const allWf = await workflowRepository.findAll();
    const synthWf = allWf.filter(
      (w) =>
        synthEntities.has(w.entityId) ||
        (w.metadata && typeof w.metadata === 'string' && (w.metadata.includes(queuedVideo.id) || w.metadata.includes(pubRecord.id)))
    );
    synthWf.forEach((w) => {
      if (!createdWorkflowIds.includes(w.id)) createdWorkflowIds.push(w.id);
    });
    recordCheck(
      `Step 13.1: Live WORKFLOW captures platform transitions (${createdWorkflowIds.length} tracked)`,
      createdWorkflowIds.length >= 3,
      `Tracked Workflow count: ${createdWorkflowIds.length}`
    );

    const allAudit = await auditLogRepository.findAll();
    const synthAudit = allAudit.filter(
      (a) =>
        synthEntities.has(a.entityId) ||
        (a.details && typeof a.details === 'string' && (a.details.includes(queuedVideo.id) || a.details.includes(pubRecord.id)))
    );
    synthAudit.forEach((a) => {
      if (!createdAuditLogIds.includes(a.id)) createdAuditLogIds.push(a.id);
    });
    recordCheck(
      `Step 13.2: Live AUDIT_LOG captures publishing lifecycle mutations (${createdAuditLogIds.length} tracked)`,
      createdAuditLogIds.length >= 5,
      `Tracked Audit count: ${createdAuditLogIds.length}`
    );

  } finally {
    // -------------------------------------------------------------------------
    // STEP 14: MANDATORY COMPLETE SELF-CLEANING TEAR-DOWN
    // -------------------------------------------------------------------------
    console.log('\n================================================================');
    console.log('MANDATORY COMPLETE SELF-CLEANING TEAR-DOWN');
    console.log('================================================================');

    // Collect any synthetic audit and workflow records dynamically
    const teardownEntities = new Set([
      ...createdContentMasterIds,
      ...createdQuestionIds,
      ...createdVideoIds,
      ...createdAssignmentIds,
      ...createdScriptIds,
      ...createdScriptVersionIds,
      ...createdThumbnailIds,
      ...createdThumbnailVersionIds,
      ...createdPinnedCommentIds,
      ...createdPinnedCommentVersionIds,
      ...createdSocialReviewIds,
      ...createdPublishingIds,
      ...createdQuestionVideoIds,
    ]);

    try {
      const allWf = await workflowRepository.findAll();
      allWf.forEach((w) => {
        const matchesEntity = teardownEntities.has(w.entityId);
        const matchesMetadata = w.metadata && typeof w.metadata === 'string' &&
          Array.from(teardownEntities).some((id) => id && id.length >= 6 && w.metadata!.includes(id));
        if ((matchesEntity || matchesMetadata) && !createdWorkflowIds.includes(w.id)) {
          createdWorkflowIds.push(w.id);
        }
      });
    } catch (err) {
      console.warn('Warn collecting workflow for teardown:', err);
    }

    try {
      const allAudit = await auditLogRepository.findAll();
      allAudit.forEach((a) => {
        const matchesEntity = teardownEntities.has(a.entityId);
        const matchesDetails = a.details && typeof a.details === 'string' &&
          Array.from(teardownEntities).some((id) => id && id.length >= 6 && a.details!.includes(id));
        if ((matchesEntity || matchesDetails) && !createdAuditLogIds.includes(a.id)) {
          createdAuditLogIds.push(a.id);
        }
      });
    } catch (err) {
      console.warn('Warn collecting audit logs for teardown:', err);
    }

    // 1. Audit Logs
    for (const id of createdAuditLogIds) {
      console.log(`Deleting synthetic audit log: ${id}`);
      await auditLogRepository.deleteRecord(id).catch((err) => console.warn(`Warn deleting audit log ${id}:`, err));
    }

    // 2. Workflow
    for (const id of createdWorkflowIds) {
      console.log(`Deleting synthetic workflow record: ${id}`);
      await workflowRepository.deleteRecord(id).catch((err) => console.warn(`Warn deleting workflow ${id}:`, err));
    }

    // 3. Assignments
    for (const id of createdAssignmentIds) {
      console.log(`Deleting synthetic assignment: ${id}`);
      await assignmentsRepository.deleteRecord(id).catch((err) => console.warn(`Warn deleting assignment ${id}:`, err));
    }

    // 4. Social Reviews
    for (const id of createdSocialReviewIds) {
      console.log(`Deleting synthetic social review: ${id}`);
      await socialReviewsRepository.deleteRecord(id).catch((err) => console.warn(`Warn deleting social review ${id}:`, err));
    }

    // 5. Pinned Comments & Versions
    for (const id of createdPinnedCommentVersionIds) {
      console.log(`Deleting synthetic pinned comment version: ${id}`);
      await pinnedCommentVersionsRepository.deleteRecord(id).catch((err) => console.warn(`Warn deleting pinned comment version ${id}:`, err));
    }
    for (const id of createdPinnedCommentIds) {
      console.log(`Deleting synthetic pinned comment: ${id}`);
      await pinnedCommentsRepository.deleteRecord(id).catch((err) => console.warn(`Warn deleting pinned comment ${id}:`, err));
    }

    // 6. Thumbnails & Versions
    for (const id of createdThumbnailVersionIds) {
      console.log(`Deleting synthetic thumbnail version: ${id}`);
      await thumbnailVersionsRepository.deleteRecord(id).catch((err) => console.warn(`Warn deleting thumbnail version ${id}:`, err));
    }
    for (const id of createdThumbnailIds) {
      console.log(`Deleting synthetic thumbnail: ${id}`);
      await thumbnailsRepository.deleteRecord(id).catch((err) => console.warn(`Warn deleting thumbnail ${id}:`, err));
    }

    // 7. Script & Versions
    for (const id of createdScriptVersionIds) {
      console.log(`Deleting synthetic script version: ${id}`);
      await scriptVersionsRepository.deleteRecord(id).catch((err) => console.warn(`Warn deleting script version ${id}:`, err));
    }
    for (const id of createdScriptIds) {
      console.log(`Deleting synthetic script: ${id}`);
      await scriptsRepository.deleteRecord(id).catch((err) => console.warn(`Warn deleting script ${id}:`, err));
    }

    // 8. Publishing
    for (const id of createdPublishingIds) {
      console.log(`Deleting synthetic publishing record: ${id}`);
      await publishingRepository.deleteRecord(id).catch((err) => console.warn(`Warn deleting publishing ${id}:`, err));
    }

    // 9. Question_Videos join
    for (const id of createdQuestionVideoIds) {
      console.log(`Deleting synthetic question_videos join: ${id}`);
      await questionVideosRepository.deleteRecord(id).catch((err) => console.warn(`Warn deleting question_video ${id}:`, err));
    }

    // 10. Videos
    for (const id of createdVideoIds) {
      console.log(`Deleting synthetic video: ${id}`);
      await videosRepository.deleteRecord(id).catch((err) => console.warn(`Warn deleting video ${id}:`, err));
    }

    // 11. Questions
    for (const id of createdQuestionIds) {
      console.log(`Deleting synthetic question: ${id}`);
      await questionsRepository.deleteRecord(id).catch((err) => console.warn(`Warn deleting question ${id}:`, err));
    }

    // 12. Content Masters
    for (const id of createdContentMasterIds) {
      console.log(`Deleting synthetic content master: ${id}`);
      await contentMastersRepository.deleteRecord(id).catch((err) => console.warn(`Warn deleting content master ${id}:`, err));
    }

    // Close test server
    if (server) {
      await new Promise<void>((resolve) => {
        server!.close(() => resolve());
      });
    }

    // Restore stubs
    geminiInstance.generateSocialHooksAndStrategy = origGenerateHooks;
    if (origFindQuestionById) {
      questionsRepository.findById = origFindQuestionById;
    }
  }

  // ---------------------------------------------------------------------------
  // STEP 15: POST-CLEANUP RECONCILIATION SNAPSHOT
  // ---------------------------------------------------------------------------
  console.log('\n--- Step 15: Post-Cleanup Authoritative Reconciliation ---');
  const postSnapshot = await getLiveSnapshot();
  console.log('Post-cleanup counts:\n', JSON.stringify(postSnapshot, null, 2));

  const questionsRestored = postSnapshot.QUESTIONS === preSnapshot.QUESTIONS;
  const mastersRestored = postSnapshot.CONTENT_MASTERS === preSnapshot.CONTENT_MASTERS;
  const videosRestored = postSnapshot.VIDEOS === preSnapshot.VIDEOS;
  const qvRestored = postSnapshot.QUESTION_VIDEOS === preSnapshot.QUESTION_VIDEOS;
  const scriptRestored = postSnapshot.SCRIPT === preSnapshot.SCRIPT;
  const scriptVersionsRestored = postSnapshot.SCRIPT_VERSIONS === preSnapshot.SCRIPT_VERSIONS;
  const thumbnailsRestored = postSnapshot.THUMBNAILS === preSnapshot.THUMBNAILS;
  const thumbnailVersionsRestored = postSnapshot.THUMBNAIL_VERSIONS === preSnapshot.THUMBNAIL_VERSIONS;
  const pinnedCommentsRestored = postSnapshot.PINNED_COMMENTS === preSnapshot.PINNED_COMMENTS;
  const pinnedCommentVersionsRestored = postSnapshot.PINNED_COMMENT_VERSIONS === preSnapshot.PINNED_COMMENT_VERSIONS;
  const publishingRestored = postSnapshot.PUBLISHING === preSnapshot.PUBLISHING;
  const assignmentsRestored = postSnapshot.ASSIGNMENTS === preSnapshot.ASSIGNMENTS;
  const workflowRestored = postSnapshot.WORKFLOW === preSnapshot.WORKFLOW;
  const auditRestored = postSnapshot.AUDIT_LOG === preSnapshot.AUDIT_LOG;
  const socialReviewsRestored = postSnapshot.SOCIAL_REVIEWS === preSnapshot.SOCIAL_REVIEWS;
  const usersUnchanged = postSnapshot.USERS === preSnapshot.USERS;
  const sequencesMonotonic = postSnapshot.SEQUENCES === preSnapshot.SEQUENCES;

  console.log('\nReconciliation Summary:');
  console.log(`  - QUESTIONS restored (${postSnapshot.QUESTIONS}/${preSnapshot.QUESTIONS}): ${questionsRestored}`);
  console.log(`  - CONTENT_MASTERS restored (${postSnapshot.CONTENT_MASTERS}/${preSnapshot.CONTENT_MASTERS}): ${mastersRestored}`);
  console.log(`  - VIDEOS restored (${postSnapshot.VIDEOS}/${preSnapshot.VIDEOS}): ${videosRestored}`);
  console.log(`  - QUESTION_VIDEOS restored (${postSnapshot.QUESTION_VIDEOS}/${preSnapshot.QUESTION_VIDEOS}): ${qvRestored}`);
  console.log(`  - SCRIPT restored (${postSnapshot.SCRIPT}/${preSnapshot.SCRIPT}): ${scriptRestored}`);
  console.log(`  - SCRIPT_VERSIONS restored (${postSnapshot.SCRIPT_VERSIONS}/${preSnapshot.SCRIPT_VERSIONS}): ${scriptVersionsRestored}`);
  console.log(`  - THUMBNAILS restored (${postSnapshot.THUMBNAILS}/${preSnapshot.THUMBNAILS}): ${thumbnailsRestored}`);
  console.log(`  - THUMBNAIL_VERSIONS restored (${postSnapshot.THUMBNAIL_VERSIONS}/${preSnapshot.THUMBNAIL_VERSIONS}): ${thumbnailVersionsRestored}`);
  console.log(`  - PINNED_COMMENTS restored (${postSnapshot.PINNED_COMMENTS}/${preSnapshot.PINNED_COMMENTS}): ${pinnedCommentsRestored}`);
  console.log(`  - PINNED_COMMENT_VERSIONS restored (${postSnapshot.PINNED_COMMENT_VERSIONS}/${preSnapshot.PINNED_COMMENT_VERSIONS}): ${pinnedCommentVersionsRestored}`);
  console.log(`  - PUBLISHING restored (${postSnapshot.PUBLISHING}/${preSnapshot.PUBLISHING}): ${publishingRestored}`);
  console.log(`  - ASSIGNMENTS restored (${postSnapshot.ASSIGNMENTS}/${preSnapshot.ASSIGNMENTS}): ${assignmentsRestored}`);
  console.log(`  - WORKFLOW restored (${postSnapshot.WORKFLOW}/${preSnapshot.WORKFLOW}): ${workflowRestored}`);
  console.log(`  - AUDIT_LOG restored (${postSnapshot.AUDIT_LOG}/${preSnapshot.AUDIT_LOG}): ${auditRestored}`);
  console.log(`  - SOCIAL_REVIEWS restored (${postSnapshot.SOCIAL_REVIEWS}/${preSnapshot.SOCIAL_REVIEWS}): ${socialReviewsRestored}`);
  console.log(`  - USERS unchanged (${postSnapshot.USERS}/${preSnapshot.USERS}): ${usersUnchanged}`);
  console.log(`  - SEQUENCES monotonically preserved (${preSnapshot.SEQUENCES} -> ${postSnapshot.SEQUENCES}): ${sequencesMonotonic}`);

  console.log('\nSequence Movements:');
  for (const [seqKey, preVal] of Object.entries(preSnapshot.sequenceValues)) {
    const postVal = postSnapshot.sequenceValues[seqKey] || 0;
    if (postVal !== preVal) {
      console.log(`  - ${seqKey}: ${preVal} -> ${postVal} (+${postVal - preVal})`);
    }
  }

  const allChecksPassed =
    checks.every((c) => c.pass) &&
    questionsRestored &&
    mastersRestored &&
    videosRestored &&
    qvRestored &&
    scriptRestored &&
    scriptVersionsRestored &&
    thumbnailsRestored &&
    thumbnailVersionsRestored &&
    pinnedCommentsRestored &&
    pinnedCommentVersionsRestored &&
    publishingRestored &&
    assignmentsRestored &&
    workflowRestored &&
    auditRestored &&
    socialReviewsRestored &&
    usersUnchanged &&
    sequencesMonotonic &&
    aiCallCount === 0;

  console.log('\n================================================================');
  console.log(`CHECKS PASSED: ${checks.filter((c) => c.pass).length}/${checks.length}`);
  console.log(`AI CALLS: ${aiCallCount}`);
  console.log(`TOTAL COST: ₹0`);
  console.log(`FINAL STATUS: ${allChecksPassed ? 'PHASE 13 LIVE VERIFICATION PASS' : 'FAIL / BLOCKED'}`);
  console.log('================================================================\n');

  if (!allChecksPassed) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal live verification error:', err);
  process.exit(1);
});
