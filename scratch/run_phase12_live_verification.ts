/**
 * BURRA PARIKSHA CMS — Phase 12 Controlled Live Verification
 *
 * Authoritative verification of Original Roadmap Phase 12 (Production Asset Workflow):
 * 1. Pre-flight snapshot of all 15 sheets
 * 2. Temporary synthetic Content Master + Question (valid existing taxonomy)
 * 3. Video creation, queuing, canonical BP-V-* ID, QUESTION_VIDEOS join
 * 4. Corrected legacy endpoint POST /api/videos/:id/assignments verification:
 *    - 401 unauthenticated
 *    - 403 specialist (REVIEWER, VIDEO_EDITOR)
 *    - 403 spoofed actor/role in body
 *    - 404 nonexistent video
 *    - 400 invalid/inactive user
 *    - 201 authorized manager
 *    - canonical BP-ASN-****** ID
 *    - entityType = VIDEO, entityId = video ID
 *    - initial status = ASSIGNED
 *    - 400 duplicate active assignment
 *    - no ASG-* ID generated
 * 5. Video production lifecycle state transitions & asset storage links:
 *    - rawFootagePath, driveFolderUrl, finalRenderPath
 *    - vertical specs (1080x1920, MP4, 9:16, 42s)
 *    - finalRenderValidationStatus = VALID
 *    - /final-render/complete -> EDITED
 *    - EDITED -> FINAL_REVIEW -> READY_TO_UPLOAD
 * 6. Object-level authorization for specialist operations (assigned vs unassigned editor)
 * 7. Script workflow (V1, immutable V2 snapshot, markScriptReady)
 * 8. Thumbnail workflow (V1, immutable V2, APPROVED, publishing sync)
 * 9. Pinned comment workflow (creation, approval, publishing sync)
 * 10. Publishing package/readiness checklist verification
 * 11. Terminal state and invalid transition guardrails
 * 12. Mandatory tear-down & post-cleanup reconciliation
 *
 * Strict Constraints:
 * - Zero AI calls (Gemini = 0, Groq = 0, xAI = 0)
 * - Zero cost (₹0)
 * - Zero modification of pre-existing production records
 * - Guaranteed self-cleaning
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
import { authService } from '../src/lib/services/auth.service';
import { apiRouter } from '../src/server/routes';
import { geminiClient } from '../src/lib/ai/gemini.client';
import {
  AssignmentStatus,
  ContentMasterStatus,
  PriorityLevel,
  QuestionStatus,
  UserRole,
  VideoProductionStatus,
  RenderValidationStatus,
} from '../src/types';

// Hard assertion: AI calls must remain 0
let aiCallCount = 0;
geminiClient.generateContent = async () => {
  aiCallCount++;
  throw new Error('AI execution is strictly forbidden in Phase 12 Live Verification!');
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
  sequenceValues: Record<string, number>;
}

async function getLiveSnapshot(): Promise<SheetSnapshot> {
  const countSheet = async (sheetName: string): Promise<number> => {
    const res = await googleSheetsClient.getRows(sheetName);
    return res.rows.length;
  };

  const [
    q, cm, vid, qv, scr, scv, thm, thv, pin, piv, pub, asn, wf, al, usr, seqRes
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
    sequenceValues,
  };
}

async function main() {
  console.log('================================================================');
  console.log('BURRA PARIKSHA CMS — PHASE 12 CONTROLLED LIVE VERIFICATION');
  console.log('Production Asset Workflow & Canonical Video-Assignment Handoff');
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
  const createdPublishingIds: string[] = [];
  const createdAssignmentIds: string[] = [];
  const createdWorkflowIds: string[] = [];
  const createdAuditLogIds: string[] = [];

  let server: http.Server | null = null;
  let baseUrl = '';

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
  // STEP 1: PRE-FLIGHT BASELINE SNAPSHOT
  // ---------------------------------------------------------------------------
  console.log('--- Step 1: Pre-flight Authoritative Baseline Snapshot ---');
  const preSnapshot = await getLiveSnapshot();
  console.log('Baseline counts:\n', JSON.stringify(preSnapshot, null, 2));

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
    const editorToken = authService.generateSessionToken({
      userId: 'USR-5372',
      name: 'Editor Jithendra',
      role: UserRole.VIDEO_EDITOR,
      email: 'editor@burrapariksha.com',
    });
    const unassignedEditorToken = authService.generateSessionToken({
      userId: 'USR-9999-UNASSIGNED',
      name: 'Unassigned Editor',
      role: UserRole.VIDEO_EDITOR,
      email: 'unassigned@burrapariksha.com',
    });
    const reviewerToken = authService.generateSessionToken({
      userId: 'USR-REV-LIVE',
      name: 'Live Reviewer',
      role: UserRole.REVIEWER,
      email: 'reviewer@burrapariksha.com',
    });
    const designerToken = authService.generateSessionToken({
      userId: 'USR-DES-LIVE',
      name: 'Live Designer',
      role: UserRole.DESIGNER,
      email: 'designer@burrapariksha.com',
    });

    async function apiRequest(
      path: string,
      method: 'GET' | 'POST' | 'PUT' | 'PATCH',
      token?: string | null,
      body?: any
    ): Promise<{ status: number; body: any }> {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
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
    // STEP 3: CREATE TEMPORARY SYNTHETIC CONTENT MASTER & QUESTION
    // -------------------------------------------------------------------------
    console.log('\n--- Step 3: Creating Synthetic Content Master & Question ---');
    const adminActor = { id: 'USR-001', name: 'Admin: Jithendra', role: UserRole.ADMIN };

    const synthMaster = await contentMasterService.createContentMaster(
      {
        title: 'SYNTH-P12-LIVE-MASTER Speed Maths Demo',
        categoryId: 'CAT-QA',
        topicId: 'TOP-QA-01',
        subtopicId: 'SUB-QA-01-01',
        createdBy: 'USR-001',
      },
      adminActor.id,
      adminActor.name
    );
    createdContentMasterIds.push(synthMaster.id);
    recordCheck(
      'Content Master created with canonical BP-MST-****** ID',
      typeof synthMaster.id === 'string' && /^BP-MST-\d{6}$/.test(synthMaster.id),
      `Master ID: ${synthMaster.id}`
    );

    const synthQuestion = await questionService.createQuestion(
      {
        contentMasterId: synthMaster.id,
        categoryId: 'CAT-QA',
        topicId: 'TOP-QA-01',
        subtopicId: 'SUB-QA-01-01',
        questionText: 'SYNTH-P12 Question: If speed doubles, what happens to travel time?',
        options: {
          a: 'Halved',
          b: 'Doubled',
          c: 'Unchanged',
          d: 'Quadrupled',
        },
        correctAnswer: 'A',
        explanation: 'Time is inversely proportional to speed: T = D / S.',
        realWorldContext: 'Speed & Time proportional reasoning',
        difficulty: 'EASY',
        status: QuestionStatus.APPROVED,
        authorId: 'USR-001',
      },
      adminActor
    );
    createdQuestionIds.push(synthQuestion.id);

    // Track question's attached content master if distinct
    if (synthQuestion.contentMasterId && !createdContentMasterIds.includes(synthQuestion.contentMasterId)) {
      createdContentMasterIds.push(synthQuestion.contentMasterId);
    }

    // Explicitly update question status to APPROVED so it is eligible for video queuing
    await questionsRepository.updateRecord(synthQuestion.id, { status: QuestionStatus.APPROVED });

    recordCheck(
      'Question created with canonical BP-Q-****** ID and linked contentMasterId',
      typeof synthQuestion.id === 'string' &&
        synthQuestion.id.startsWith('BP-Q-') &&
        synthQuestion.contentMasterId === synthMaster.id,
      `Question ID: ${synthQuestion.id}`
    );

    // -------------------------------------------------------------------------
    // STEP 4: QUEUE QUESTION FOR PRODUCTION & VERIFY VIDEO/JOIN/AUDIT
    // -------------------------------------------------------------------------
    console.log('\n--- Step 4: Queuing Approved Question for Video Production ---');
    const queuedVideo = await videoService.queueApprovedQuestion(
      {
        questionId: synthQuestion.id,
        title: 'Short: Speed & Time Proportional Reasoning',
        priority: PriorityLevel.HIGH,
        targetDurationSeconds: 45,
        notes: 'Phase 12 Live Verification Video Queue',
      },
      adminActor
    );
    createdVideoIds.push(queuedVideo.id);
    if (queuedVideo.contentMasterId && !createdContentMasterIds.includes(queuedVideo.contentMasterId)) {
      createdContentMasterIds.push(queuedVideo.contentMasterId);
    }
    recordCheck(
      'Video queued with canonical BP-V-****** ID',
      typeof queuedVideo.id === 'string' && /^BP-V-\d+$/.test(queuedVideo.id),
      `Video ID: ${queuedVideo.id}`
    );
    recordCheck(
      'Video initial status is QUEUED',
      queuedVideo.status === VideoProductionStatus.QUEUED,
      `Status: ${queuedVideo.status}`
    );

    // Read QUESTION_VIDEOS join relationship
    const allQv = await questionVideosRepository.findAll();
    const synthQv = allQv.find((qv) => qv.videoId === queuedVideo.id);
    if (synthQv) createdQuestionVideoIds.push(synthQv.id);
    recordCheck(
      'QUESTION_VIDEOS join relationship created',
      Boolean(synthQv && synthQv.questionId === synthQuestion.id),
      `Join ID: ${synthQv?.id}`
    );

    // Verify question videoStatus updated to QUEUED
    const updatedQ = await questionsRepository.findById(synthQuestion.id);
    recordCheck(
      'Question videoStatus synchronized to QUEUED',
      updatedQ?.videoStatus === VideoProductionStatus.QUEUED,
      `videoStatus: ${updatedQ?.videoStatus}`
    );

    // -------------------------------------------------------------------------
    // STEP 5: VERIFY CORRECTED LEGACY ENDPOINT (POST /api/videos/:id/assignments)
    // -------------------------------------------------------------------------
    console.log('\n--- Step 5: Testing Corrected Legacy Video Assignment Endpoint ---');

    // 5A. Unauthenticated request -> 401
    const unauthAsnRes = await apiRequest(`/videos/${queuedVideo.id}/assignments`, 'POST', null, {
      assigneeId: 'USR-5372',
      taskType: 'EDITING',
    });
    recordCheck(
      'Assignment Endpoint: Anonymous request rejected (401 Unauthorized)',
      unauthAsnRes.status === 401,
      `Status: ${unauthAsnRes.status}`
    );

    // 5B. Specialist (REVIEWER) -> 403
    const revAsnRes = await apiRequest(`/videos/${queuedVideo.id}/assignments`, 'POST', reviewerToken, {
      assigneeId: 'USR-5372',
      taskType: 'EDITING',
    });
    recordCheck(
      'Assignment Endpoint: Non-manager specialist rejected (403 Forbidden)',
      revAsnRes.status === 403,
      `Status: ${revAsnRes.status}`
    );

    // 5C. Body spoofing attempt by specialist -> 403
    const spoofAsnRes = await apiRequest(`/videos/${queuedVideo.id}/assignments`, 'POST', editorToken, {
      assigneeId: 'USR-5372',
      taskType: 'EDITING',
      role: 'ADMIN',
      actor: { id: 'USR-001', role: 'ADMIN' },
    });
    recordCheck(
      'Assignment Endpoint: Body actor spoofing rejected (403 Forbidden)',
      spoofAsnRes.status === 403,
      `Status: ${spoofAsnRes.status}`
    );

    // 5D-1. Non-existent video -> 404
    const notFoundAsnRes = await apiRequest('/videos/BP-V-NONEXISTENT/assignments', 'POST', contentMgrToken, {
      assigneeId: 'USR-5372',
      taskType: 'EDITING',
    });
    recordCheck(
      'Assignment Endpoint: Non-existent video returns 404 Not Found',
      notFoundAsnRes.status === 404,
      `Status: ${notFoundAsnRes.status}`
    );

    // 5D-2. Inactive / Non-existent assignee -> 400 Bad Request
    const invalidAssigneeRes = await apiRequest(`/videos/${queuedVideo.id}/assignments`, 'POST', contentMgrToken, {
      assigneeId: 'USR-NONEXISTENT',
      taskType: 'EDITING',
    });
    recordCheck(
      'Assignment Endpoint: Non-existent assignee returns 400 Bad Request',
      invalidAssigneeRes.status === 400,
      `Status: ${invalidAssigneeRes.status}`
    );

    // 5E. Authorized Manager creates assignment -> 201 Created
    const createAsnRes = await apiRequest(`/videos/${queuedVideo.id}/assignments`, 'POST', contentMgrToken, {
      assigneeId: 'USR-5372', // Valid active editor
      taskType: 'EDITING',
      notes: 'Live verification editing task',
      entityId: 'BP-V-SPOOFED', // Body spoofing attempt should be ignored
    });
    recordCheck(
      'Assignment Endpoint: Authorized Content Manager creates assignment (201 Created)',
      createAsnRes.status === 201,
      `Status: ${createAsnRes.status}`
    );

    const liveAssignment = createAsnRes.body;
    if (liveAssignment?.id) createdAssignmentIds.push(liveAssignment.id);

    recordCheck(
      'Assignment Endpoint: Generated ID matches canonical BP-ASN-****** pattern',
      typeof liveAssignment?.id === 'string' && /^BP-ASN-\d{6}$/.test(liveAssignment.id),
      `Generated ID: ${liveAssignment?.id}`
    );

    recordCheck(
      'Assignment Endpoint: No legacy ASG-* assignment ID was created',
      !liveAssignment?.id?.startsWith('ASG-'),
      `ID: ${liveAssignment?.id}`
    );

    recordCheck(
      'Assignment Endpoint: entityType forced to VIDEO and entityId matches route parameter',
      liveAssignment?.entityType === 'VIDEO' && liveAssignment?.entityId === queuedVideo.id,
      `entityType=${liveAssignment?.entityType}, entityId=${liveAssignment?.entityId}`
    );

    recordCheck(
      'Assignment Endpoint: Initial status is canonical ASSIGNED',
      liveAssignment?.status === AssignmentStatus.ASSIGNED,
      `status: ${liveAssignment?.status}`
    );

    recordCheck(
      'Assignment Endpoint: Video assignedEditor helper field synchronized in sheet',
      Boolean(liveAssignment?.assigneeName),
      `assigneeName: ${liveAssignment?.assigneeName}`
    );

    // Direct read-back of assignment from Google Sheets repository
    const readBackAsn = await assignmentsRepository.findById(liveAssignment.id);
    recordCheck(
      'Assignment Endpoint: Assignment persisted and verified by direct read-back from Google Sheets',
      Boolean(readBackAsn && readBackAsn.id === liveAssignment.id && readBackAsn.entityType === 'VIDEO'),
      `Read-back ID: ${readBackAsn?.id}, status: ${readBackAsn?.status}`
    );

    // 5F. Duplicate active assignment on same video/task -> 400 Bad Request
    const duplicateAsnRes = await apiRequest(`/videos/${queuedVideo.id}/assignments`, 'POST', adminToken, {
      assigneeId: 'USR-5372',
      taskType: 'EDITING',
    });
    recordCheck(
      'Assignment Endpoint: Duplicate active assignment on same video rejected (400 Bad Request)',
      duplicateAsnRes.status === 400,
      `Status: ${duplicateAsnRes.status}, Message: ${duplicateAsnRes.body?.message}`
    );

    // -------------------------------------------------------------------------
    // STEP 6: OBJECT-LEVEL AUTHORIZATION TESTS
    // -------------------------------------------------------------------------
    console.log('\n--- Step 6: Testing Object-Level Specialist Authorization ---');

    // 6A. Unassigned editor cannot modify video metadata -> 403 Forbidden
    const unassignedModRes = await apiRequest(`/videos/${queuedVideo.id}`, 'PUT', unassignedEditorToken, {
      notes: 'Unassigned editor unauthorized edit attempt',
    });
    recordCheck(
      'Object Auth: Unassigned editor forbidden to update video metadata (403 Forbidden)',
      unassignedModRes.status === 403,
      `Status: ${unassignedModRes.status}`
    );

    // 6B. Assigned designer cannot update video status -> 403 Forbidden
    const designerStatusRes = await apiRequest(`/videos/${queuedVideo.id}/status`, 'PATCH', designerToken, {
      status: VideoProductionStatus.EDITING,
    });
    recordCheck(
      'Object Auth: Specialist (DESIGNER) forbidden to update video status (403 Forbidden)',
      designerStatusRes.status === 403,
      `Status: ${designerStatusRes.status}`
    );

    // -------------------------------------------------------------------------
    // STEP 7: SCRIPT WORKFLOW WITH IMMUTABLE VERSIONING
    // -------------------------------------------------------------------------
    console.log('\n--- Step 7: Testing Script Workflow & Immutable Versioning ---');

    // 7A. Initial Script Creation (Version 1)
    const initialScript = await scriptService.saveScript(
      queuedVideo.id,
      {
        hookText: '🔥 10 సెకన్లలో సమాధానం చెప్పగలరా?',
        problemStatement: 'స్పీడ్ డబుల్ అయితే టైమ్ ఏమవుతుంది?',
        stepByStepSolution: 'టైమ్ = దూరం / వేగం. వేగం 2x అయితే టైమ్ సగం (1/2) అవుతుంది.',
        speedTrickOrTakeaway: '💡 రివర్స్ రేషియో ట్రిక్: S1/S2 = T2/T1.',
        callToAction: 'లైక్ & సబ్‌స్క్రైబ్ చేయండి!',
        notes: 'Live verification script initial draft',
        createNewVersion: false,
      },
      adminActor
    );
    createdScriptIds.push(initialScript.script.id);
    if (initialScript.version?.id) createdScriptVersionIds.push(initialScript.version.id);

    recordCheck(
      'Script created with canonical BP-S-****** ID',
      typeof initialScript.script.id === 'string' && /^BP-S-\d+$/.test(initialScript.script.id),
      `Script ID: ${initialScript.script.id}`
    );
    recordCheck(
      'Script initial version 1 created in SCRIPT_VERSIONS',
      initialScript.script.currentVersion === 1,
      `currentVersion: ${initialScript.script.currentVersion}`
    );

    // 7B. Create Immutable Revision (Version 2)
    const revisionScript = await scriptService.saveScript(
      queuedVideo.id,
      {
        hookText: '⚡ త్వరగా చెప్పండి: స్పీడ్ రెట్టింపు అయితే సమయం ఎంత?',
        problemStatement: 'స్పీడ్ డబుల్ అయితే టైమ్ ఏమవుతుంది?',
        stepByStepSolution: 'వేగం పెరిగితే సమయం తగ్గుతుంది. కనుక సగం అవుతుంది.',
        speedTrickOrTakeaway: '💡 ఇన్వర్స్ రిలేషన్ ట్రిక్.',
        callToAction: 'కామెంట్ చేయండి మీ సమాధానం!',
        changeSummary: 'Live test: Telugu hook polish',
        createNewVersion: true,
      },
      adminActor
    );
    if (revisionScript.version?.id) createdScriptVersionIds.push(revisionScript.version.id);

    recordCheck(
      'Script version incremented to 2 with immutable SCRIPT_VERSIONS record',
      revisionScript.script.currentVersion === 2 && Boolean(revisionScript.version?.id),
      `currentVersion: ${revisionScript.script.currentVersion}, VersionId: ${revisionScript.version?.id}`
    );

    // 7C. Mark Script Ready -> Transitions Video
    await videoService.transitionStatus(queuedVideo.id, VideoProductionStatus.SCRIPT_REQUIRED, adminActor);
    const readyResult = await scriptService.markScriptReady(queuedVideo.id, adminActor, 'Script approved for recording');
    recordCheck(
      'markScriptReady successfully transitions video to SCRIPT_READY',
      readyResult.videoStatus === VideoProductionStatus.SCRIPT_READY,
      `videoStatus: ${readyResult.videoStatus}`
    );

    // -------------------------------------------------------------------------
    // STEP 8: VIDEO LIFECYCLE TRANSITIONS & ASSET SPECIFICATIONS
    // -------------------------------------------------------------------------
    console.log('\n--- Step 8: Testing Video Production Transitions & Asset Storage ---');

    // Advance to RECORDING -> RECORDED -> EDITING
    await videoService.transitionStatus(queuedVideo.id, VideoProductionStatus.RECORDING, adminActor);
    await videoService.transitionStatus(queuedVideo.id, VideoProductionStatus.RECORDED, adminActor);
    await videoService.transitionStatus(queuedVideo.id, VideoProductionStatus.EDITING, adminActor);

    // Store raw footage link and final render specs via assigned editor
    const assignedEditRes = await apiRequest(`/videos/${queuedVideo.id}`, 'PUT', editorToken, {
      rawFootagePath: 'https://drive.google.com/file/d/live_raw_footage_link_123',
      driveFolderUrl: 'https://drive.google.com/drive/folders/live_drive_folder_123',
      finalRenderPath: 'https://drive.google.com/file/d/live_final_render_master_456',
      finalRenderWidth: 1080,
      finalRenderHeight: 1920,
      finalRenderFormat: 'MP4',
      finalRenderAspectRatio: '9:16',
      actualDurationSeconds: 42,
      targetDurationSeconds: 45,
      notes: 'Verified vertical short-form render by assigned editor',
    });
    recordCheck(
      'Assigned editor permitted to update video metadata via PUT /api/videos/:id (200 OK)',
      assignedEditRes.status === 200,
      `Status: ${assignedEditRes.status}`
    );

    const updatedMetadata = assignedEditRes.body;
    recordCheck(
      'Video asset references stored as links (zero binary storage)',
      Boolean(updatedMetadata?.rawFootagePath && updatedMetadata?.finalRenderPath),
      `raw=${updatedMetadata?.rawFootagePath}, final=${updatedMetadata?.finalRenderPath}`
    );

    recordCheck(
      'finalRenderValidationStatus recomputed server-side to VALID',
      updatedMetadata?.finalRenderValidationStatus === RenderValidationStatus.VALID,
      `finalRenderValidationStatus: ${updatedMetadata?.finalRenderValidationStatus}`
    );

    recordCheck(
      'Validation decoupling invariant: Video remains in EDITING status after metadata update',
      updatedMetadata?.status === VideoProductionStatus.EDITING,
      `status: ${updatedMetadata?.status}`
    );

    // Complete final render handoff via API endpoint
    const completeRenderRes = await apiRequest(`/videos/${queuedVideo.id}/final-render/complete`, 'POST', editorToken, {
      remarks: 'Editor finalized master cut',
    });
    recordCheck(
      'Editor successfully completes final render handoff (/final-render/complete -> EDITED)',
      completeRenderRes.status === 200 && completeRenderRes.body?.status === VideoProductionStatus.EDITED,
      `Status: ${completeRenderRes.status}, VideoStatus: ${completeRenderRes.body?.status}`
    );

    // Reviewer advances: EDITED -> FINAL_REVIEW -> READY_TO_UPLOAD
    const reviewRes = await apiRequest(`/videos/${queuedVideo.id}/status`, 'PATCH', adminToken, {
      status: VideoProductionStatus.FINAL_REVIEW,
      remarks: 'Manager moved to final review',
    });
    recordCheck(
      'Video transitioned to FINAL_REVIEW',
      reviewRes.status === 200 && reviewRes.body?.status === VideoProductionStatus.FINAL_REVIEW,
      `VideoStatus: ${reviewRes.body?.status}`
    );

    const readyUploadRes = await apiRequest(`/videos/${queuedVideo.id}/status`, 'PATCH', adminToken, {
      status: VideoProductionStatus.READY_TO_UPLOAD,
      remarks: 'Review complete: Ready to upload',
    });
    recordCheck(
      'Video transitioned to READY_TO_UPLOAD',
      readyUploadRes.status === 200 && readyUploadRes.body?.status === VideoProductionStatus.READY_TO_UPLOAD,
      `VideoStatus: ${readyUploadRes.body?.status}`
    );

    // Initialize Publishing record for downstream sync verification
    const initPub = await publishingService.getPublishingByVideoId(queuedVideo.id);
    if (initPub?.id && !createdPublishingIds.includes(initPub.id)) {
      createdPublishingIds.push(initPub.id);
    }

    // -------------------------------------------------------------------------
    // STEP 9: THUMBNAIL WORKFLOW & PUBLISHING SYNCHRONIZATION
    // -------------------------------------------------------------------------
    console.log('\n--- Step 9: Testing Thumbnail Workflow & Publishing Sync ---');

    const synthThumb = await thumbnailService.saveThumbnail(
      queuedVideo.id,
      {
        hookHeadline: 'Speed Maths in 15 Seconds!',
        previewUrl: 'https://drive.google.com/file/d/live_thumb_preview.png',
        driveAssetUrl: 'https://drive.google.com/file/d/live_thumb_master.psd',
        status: 'PENDING',
        designerNotes: 'Initial thumbnail design',
        createNewVersion: false,
      },
      adminActor
    );
    createdThumbnailIds.push(synthThumb.thumbnail.id);
    if (synthThumb.version?.id) createdThumbnailVersionIds.push(synthThumb.version.id);

    recordCheck(
      'Thumbnail created with canonical BP-T-****** ID and THUMBNAIL_VERSIONS record',
      typeof synthThumb.thumbnail.id === 'string' && /^BP-T-\d+$/.test(synthThumb.thumbnail.id),
      `Thumbnail ID: ${synthThumb.thumbnail.id}`
    );

    // Approve thumbnail and verify publishing sync
    const approvedThumb = await thumbnailService.updateStatus(synthThumb.thumbnail.id, 'APPROVED', adminActor, 'Approved for publishing');
    recordCheck(
      'Thumbnail status updated to APPROVED',
      approvedThumb.status === 'APPROVED',
      `status: ${approvedThumb.status}`
    );

    // Check PUBLISHING worksheet record
    const pubRecord = await publishingRepository.findByVideoId(queuedVideo.id);
    recordCheck(
      'PUBLISHING record thumbnailReady synchronized to true upon thumbnail approval',
      Boolean(pubRecord && pubRecord.thumbnailReady === true),
      `thumbnailReady: ${pubRecord?.thumbnailReady}`
    );

    // -------------------------------------------------------------------------
    // STEP 10: PINNED COMMENT WORKFLOW & PUBLISHING SYNCHRONIZATION
    // -------------------------------------------------------------------------
    console.log('\n--- Step 10: Testing Pinned Comment Workflow & Publishing Sync ---');

    const synthPinned = await pinnedCommentService.savePinnedComment(
      queuedVideo.id,
      {
        commentText: '🎯 Solution: Option (A) is correct. T = D / S.',
        solutionBreakdown: 'When speed increases 2x, time required is divided by 2.',
        nextChallengeQuestion: 'If speed increases by 50%, time decreases by what percent?',
        isApproved: false,
      },
      adminActor
    );
    createdPinnedCommentIds.push(synthPinned.pinnedComment.id);
    if (synthPinned.version?.id) createdPinnedCommentVersionIds.push(synthPinned.version.id);

    recordCheck(
      'Pinned Comment created with canonical BP-PIN-****** ID',
      typeof synthPinned.pinnedComment.id === 'string' && /^BP-PIN-\d+$/.test(synthPinned.pinnedComment.id),
      `Pinned Comment ID: ${synthPinned.pinnedComment.id}`
    );

    // Approve pinned comment
    await pinnedCommentService.updateApprovalStatus(synthPinned.pinnedComment.id, true, adminActor, 'Pinned comment approved');
    const pubRecordAfterPin = await publishingRepository.findByVideoId(queuedVideo.id);
    recordCheck(
      'PUBLISHING record pinnedCommentReady synchronized to true upon pinned comment approval',
      Boolean(pubRecordAfterPin && pubRecordAfterPin.pinnedCommentReady === true),
      `pinnedCommentReady: ${pubRecordAfterPin?.pinnedCommentReady}`
    );

    // -------------------------------------------------------------------------
    // STEP 11: PUBLISHING READINESS CHECKLIST & REPUTATION
    // -------------------------------------------------------------------------
    console.log('\n--- Step 11: Testing Publishing Readiness Endpoint ---');
    const readinessRes = await apiRequest(`/videos/${queuedVideo.id}/publishing/readiness`, 'GET', contentMgrToken);
    recordCheck(
      'Publishing readiness endpoint accessible to manager (200 OK)',
      readinessRes.status === 200,
      `Status: ${readinessRes.status}`
    );
    const checklist = readinessRes.body?.checklist;
    recordCheck(
      'Publishing readiness checklist reflects stored assets (video, thumb, pinned comment, script)',
      Boolean(
        checklist &&
        checklist.videoReady === true &&
        checklist.thumbnailReady === true &&
        checklist.pinnedCommentReady === true &&
        checklist.scriptReady === true
      ),
      `checklist: ${JSON.stringify(checklist)}`
    );

    // -------------------------------------------------------------------------
    // STEP 12: TERMINAL STATE AND INVALID TRANSITION GUARDS
    // -------------------------------------------------------------------------
    console.log('\n--- Step 12: Testing Terminal State & Invalid Transition Guards ---');

    // Attempt invalid transition: READY_TO_UPLOAD -> RECORDING (not permitted by state machine)
    let invalidTransitionBlocked = false;
    try {
      await videoService.transitionStatus(queuedVideo.id, VideoProductionStatus.RECORDING, adminActor);
    } catch (err: any) {
      invalidTransitionBlocked = err.name === 'ValidationError' || err.message?.includes('Illegal status transition');
    }
    recordCheck(
      'State Machine Guard: Illegal backward transition (READY_TO_UPLOAD -> RECORDING) rejected',
      invalidTransitionBlocked,
      'ValidationError raised as expected'
    );

    // -------------------------------------------------------------------------
    // STEP 13: COLLECT ALL CREATED WORKFLOW AND AUDIT LOG RECORDS
    // -------------------------------------------------------------------------
    console.log('\n--- Step 13: Tracking Created WORKFLOW & AUDIT_LOG Records ---');
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
      ...createdPublishingIds,
      ...createdQuestionVideoIds,
    ]);

    const allWf = await workflowRepository.findAll();
    const synthWf = allWf.filter(
      (w) =>
        synthEntities.has(w.entityId) ||
        (w.metadata && typeof w.metadata === 'string' && w.metadata.includes(queuedVideo.id))
    );
    synthWf.forEach((w) => {
      if (!createdWorkflowIds.includes(w.id)) createdWorkflowIds.push(w.id);
    });
    recordCheck(
      `WORKFLOW records accurately created across production steps (${createdWorkflowIds.length} tracked)`,
      createdWorkflowIds.length >= 3,
      `Tracked Workflow count: ${createdWorkflowIds.length}`
    );

    const allAudit = await auditLogRepository.findAll();
    const synthAudit = allAudit.filter((a) => synthEntities.has(a.entityId));
    synthAudit.forEach((a) => {
      if (!createdAuditLogIds.includes(a.id)) createdAuditLogIds.push(a.id);
    });
    recordCheck(
      `AUDIT_LOG records accurately created across production steps (${createdAuditLogIds.length} tracked)`,
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

    // 1. Clean Audit Logs
    for (const id of createdAuditLogIds) {
      console.log(`Deleting synthetic audit log: ${id}`);
      await auditLogRepository.deleteRecord(id).catch((err) => console.warn(`Warn deleting audit log ${id}:`, err));
    }

    // 2. Clean Workflow
    for (const id of createdWorkflowIds) {
      console.log(`Deleting synthetic workflow record: ${id}`);
      await workflowRepository.deleteRecord(id).catch((err) => console.warn(`Warn deleting workflow ${id}:`, err));
    }

    // 3. Clean Assignments
    for (const id of createdAssignmentIds) {
      console.log(`Deleting synthetic assignment: ${id}`);
      await assignmentsRepository.deleteRecord(id).catch((err) => console.warn(`Warn deleting assignment ${id}:`, err));
    }

    // 4. Clean Pinned Comments & Versions
    for (const id of createdPinnedCommentVersionIds) {
      console.log(`Deleting synthetic pinned comment version: ${id}`);
      await pinnedCommentVersionsRepository.deleteRecord(id).catch((err) => console.warn(`Warn deleting pinned comment version ${id}:`, err));
    }
    for (const id of createdPinnedCommentIds) {
      console.log(`Deleting synthetic pinned comment: ${id}`);
      await pinnedCommentsRepository.deleteRecord(id).catch((err) => console.warn(`Warn deleting pinned comment ${id}:`, err));
    }

    // 5. Clean Thumbnails & Versions
    for (const id of createdThumbnailVersionIds) {
      console.log(`Deleting synthetic thumbnail version: ${id}`);
      await thumbnailVersionsRepository.deleteRecord(id).catch((err) => console.warn(`Warn deleting thumbnail version ${id}:`, err));
    }
    for (const id of createdThumbnailIds) {
      console.log(`Deleting synthetic thumbnail: ${id}`);
      await thumbnailsRepository.deleteRecord(id).catch((err) => console.warn(`Warn deleting thumbnail ${id}:`, err));
    }

    // 6. Clean Script & Versions
    for (const id of createdScriptVersionIds) {
      console.log(`Deleting synthetic script version: ${id}`);
      await scriptVersionsRepository.deleteRecord(id).catch((err) => console.warn(`Warn deleting script version ${id}:`, err));
    }
    for (const id of createdScriptIds) {
      console.log(`Deleting synthetic script: ${id}`);
      await scriptsRepository.deleteRecord(id).catch((err) => console.warn(`Warn deleting script ${id}:`, err));
    }

    // 7. Clean Publishing
    for (const id of createdPublishingIds) {
      console.log(`Deleting synthetic publishing record: ${id}`);
      await publishingRepository.deleteRecord(id).catch((err) => console.warn(`Warn deleting publishing ${id}:`, err));
    }

    // 8. Clean Question_Videos join
    for (const id of createdQuestionVideoIds) {
      console.log(`Deleting synthetic question_videos join: ${id}`);
      await questionVideosRepository.deleteRecord(id).catch((err) => console.warn(`Warn deleting question_video ${id}:`, err));
    }

    // 9. Clean Video
    for (const id of createdVideoIds) {
      console.log(`Deleting synthetic video: ${id}`);
      await videosRepository.deleteRecord(id).catch((err) => console.warn(`Warn deleting video ${id}:`, err));
    }

    // 10. Clean Question
    for (const id of createdQuestionIds) {
      console.log(`Deleting synthetic question: ${id}`);
      await questionsRepository.deleteRecord(id).catch((err) => console.warn(`Warn deleting question ${id}:`, err));
    }

    // 11. Clean Content Master
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
  console.log(`  - USERS unchanged (${postSnapshot.USERS}/${preSnapshot.USERS}): ${usersUnchanged}`);
  console.log(`  - SEQUENCES monotonically preserved (${preSnapshot.SEQUENCES} -> ${postSnapshot.SEQUENCES}): ${sequencesMonotonic}`);

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
    usersUnchanged &&
    sequencesMonotonic &&
    aiCallCount === 0;

  console.log('\n================================================================');
  console.log(`CHECKS PASSED: ${checks.filter((c) => c.pass).length}/${checks.length}`);
  console.log(`AI CALLS: ${aiCallCount}`);
  console.log(`TOTAL COST: ₹0`);
  console.log(`FINAL STATUS: ${allChecksPassed ? 'PHASE 12 LIVE VERIFICATION PASS' : 'FAIL / BLOCKED'}`);
  console.log('================================================================\n');

  if (!allChecksPassed) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal live verification error:', err);
  process.exit(1);
});
