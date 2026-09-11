/**
 * BURRA PARIKSHA CMS — FIX 1: OPERATIONAL RBAC BLOCKERS VERIFICATION SUITE
 *
 * Verifies:
 * 1. REVIEWER can perform existing permitted final-review video status transitions (EDITING, FINAL_REVIEW, READY_TO_UPLOAD).
 * 2. Roles previously forbidden on video status remain forbidden (QUESTION_EDITOR, SCRIPT_WRITER, DESIGNER).
 *    Also verifies REVIEWER cannot perform non-review transitions (e.g., RECORDING, CANCELLED).
 * 3. DESIGNER can perform existing permitted thumbnail completion transition (status: DESIGNED).
 * 4. Roles previously forbidden on thumbnail status remain forbidden (QUESTION_EDITOR, VIDEO_EDITOR, SCRIPT_WRITER).
 *    Also verifies DESIGNER cannot approve or reject thumbnails (APPROVED, REJECTED).
 * 5. Object-level authorization still applies:
 *    - Unassigned REVIEWER is rejected with 403.
 *    - REVIEWER who is the video host/editor is rejected with 403 (self-approval protection).
 *    - Unassigned DESIGNER is rejected with 403.
 * 6. No unrelated route permissions changed across other endpoints.
 *
 * Strict ₹0 Constraint: Zero live AI calls, zero Google Sheets writes, zero GCS calls.
 */

import express from 'express';
import http from 'http';
import { apiRouter } from '../server/routes';
import { authService } from '../lib/services/auth.service';
import { videoService } from '../lib/services/video.service';
import { thumbnailService } from '../lib/services/thumbnail.service';
import { objectAuthService } from '../lib/services/object-auth.service';
import { videosRepository } from '../lib/repositories/videos.repository';
import { thumbnailsRepository } from '../lib/repositories/thumbnails.repository';
import { UserRole, VideoProductionStatus, Video, Thumbnail, PriorityLevel } from '../types';

interface CheckItem {
  id: number;
  name: string;
  pass: boolean;
  details: string;
}

export async function runCmsFix1RbacVerification(): Promise<{
  allPassed: boolean;
  total: number;
  passed: number;
  failed: number;
  checks: CheckItem[];
}> {
  console.log('\n===============================================================');
  console.log('CMS COMPLETION — FIX 1: OPERATIONAL RBAC BLOCKERS VERIFICATION');
  console.log('===============================================================\n');

  const checks: CheckItem[] = [];

  // In-memory mock data
  const mockVideo: Video = {
    id: 'BP-V-990001',
    contentMasterId: 'BP-CM-990001',
    questionId: 'BP-Q-990001',
    title: 'Test Video for Review',
    status: VideoProductionStatus.FINAL_REVIEW,
    priority: PriorityLevel.NORMAL,
    targetDurationSeconds: 45,
    assignedHost: 'USR-HOST-01',
    assignedEditor: 'USR-EDITOR-01',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockThumbnail: Thumbnail = {
    id: 'BP-THM-990001',
    videoId: 'BP-V-990001',
    hookHeadline: 'Catchy Thumbnail Title',
    driveAssetUrl: 'https://drive.google.com/thumbnail-asset',
    previewUrl: 'https://drive.google.com/thumbnail-preview',
    currentVersion: 1,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Mock repository methods
  const origFindVideoById = videosRepository.findById;
  const origFindThumbById = thumbnailsRepository.findById;
  const origTransitionStatus = videoService.transitionStatus;
  const origUpdateThumbStatus = thumbnailService.updateStatus;
  const origCanModifyVideo = objectAuthService.canModifyVideo;
  const origCanSubmitSocialReview = objectAuthService.canSubmitSocialReview;
  const origCanModifyThumbnail = objectAuthService.canModifyThumbnail;

  videosRepository.findById = async (id: string) => {
    if (id === mockVideo.id) return { ...mockVideo };
    return null;
  };

  thumbnailsRepository.findById = async (id: string) => {
    if (id === mockThumbnail.id) return { ...mockThumbnail };
    return null;
  };

  (videoService as any).transitionStatus = async (
    videoId: string,
    newStatus: VideoProductionStatus,
    actor: any,
    remarks?: string,
    actualDurationSeconds?: number
  ) => {
    return {
      ...mockVideo,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };
  };

  (thumbnailService as any).updateStatus = async (
    thumbnailId: string,
    newStatus: any,
    actor: any,
    remarks?: string
  ) => {
    return {
      ...mockThumbnail,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };
  };

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

  // Tokens
  const adminToken = authService.generateSessionToken({
    userId: 'USR-ADMIN',
    name: 'Admin User',
    role: UserRole.ADMIN,
  });

  const contentManagerToken = authService.generateSessionToken({
    userId: 'USR-MGR',
    name: 'Manager User',
    role: UserRole.CONTENT_MANAGER,
  });

  const videoEditorToken = authService.generateSessionToken({
    userId: 'USR-EDITOR-01',
    name: 'Editor User',
    role: UserRole.VIDEO_EDITOR,
  });

  const assignedReviewerToken = authService.generateSessionToken({
    userId: 'USR-REV-ASSIGNED',
    name: 'Assigned Reviewer User',
    role: UserRole.REVIEWER,
  });

  const unassignedReviewerToken = authService.generateSessionToken({
    userId: 'USR-REV-UNASSIGNED',
    name: 'Unassigned Reviewer User',
    role: UserRole.REVIEWER,
  });

  const conflictedReviewerToken = authService.generateSessionToken({
    userId: 'USR-HOST-01', // host of the video
    name: 'Host Acting as Reviewer',
    role: UserRole.REVIEWER,
  });

  const assignedDesignerToken = authService.generateSessionToken({
    userId: 'USR-DES-ASSIGNED',
    name: 'Assigned Designer User',
    role: UserRole.DESIGNER,
  });

  const unassignedDesignerToken = authService.generateSessionToken({
    userId: 'USR-DES-UNASSIGNED',
    name: 'Unassigned Designer User',
    role: UserRole.DESIGNER,
  });

  const questionEditorToken = authService.generateSessionToken({
    userId: 'USR-QE',
    name: 'Question Editor User',
    role: UserRole.QUESTION_EDITOR,
  });

  const scriptWriterToken = authService.generateSessionToken({
    userId: 'USR-SW',
    name: 'Script Writer User',
    role: UserRole.SCRIPT_WRITER,
  });

  try {
    // -------------------------------------------------------------
    // Mock Object Auth methods for fine-grained testing
    // -------------------------------------------------------------
    objectAuthService.canSubmitSocialReview = async (actor, videoId) => {
      if (actor.role === UserRole.ADMIN || actor.role === UserRole.CONTENT_MANAGER) return true;
      if (actor.id === 'USR-REV-ASSIGNED' && videoId === mockVideo.id) return true;
      // Conflicted reviewer (host of video) or unassigned returns false
      return false;
    };

    objectAuthService.canModifyVideo = async (actor, video) => {
      if (actor.role === UserRole.ADMIN || actor.role === UserRole.CONTENT_MANAGER) return true;
      if (actor.role === UserRole.VIDEO_EDITOR && actor.id === video.assignedEditor) return true;
      return false;
    };

    objectAuthService.canModifyThumbnail = async (actor, thumb) => {
      if (actor.role === UserRole.ADMIN || actor.role === UserRole.CONTENT_MANAGER) return true;
      if (actor.role === UserRole.DESIGNER && actor.id === 'USR-DES-ASSIGNED') return true;
      return false;
    };

    // =============================================================
    // TEST GROUP 1: REVIEWER PERMITTED FINAL-REVIEW VIDEO TRANSITIONS
    // =============================================================
    console.log('[GROUP 1] Reviewer Permitted Final-Review Video Transitions');

    // 1A. Reviewer transitions FINAL_REVIEW -> READY_TO_UPLOAD (Approval)
    const res1A = await request(`/videos/${mockVideo.id}/status`, 'PATCH', assignedReviewerToken, {
      status: VideoProductionStatus.READY_TO_UPLOAD,
      remarks: 'Approved by Reviewer',
    });
    checks.push({
      id: 1,
      name: 'Reviewer can approve video (FINAL_REVIEW -> READY_TO_UPLOAD)',
      pass: res1A.status === 200 && res1A.body?.status === VideoProductionStatus.READY_TO_UPLOAD,
      details: `Status: ${res1A.status}, Body: ${JSON.stringify(res1A.body)}`,
    });

    // 1B. Reviewer transitions FINAL_REVIEW -> EDITING (Return for revisions)
    const res1B = await request(`/videos/${mockVideo.id}/status`, 'PATCH', assignedReviewerToken, {
      status: VideoProductionStatus.EDITING,
      remarks: 'Audio needs adjustment in second 15-20',
    });
    checks.push({
      id: 2,
      name: 'Reviewer can request changes (FINAL_REVIEW -> EDITING)',
      pass: res1B.status === 200 && res1B.body?.status === VideoProductionStatus.EDITING,
      details: `Status: ${res1B.status}, Body: ${JSON.stringify(res1B.body)}`,
    });

    // 1C. Reviewer pulls to FINAL_REVIEW from EDITING
    const res1C = await request(`/videos/${mockVideo.id}/status`, 'PATCH', assignedReviewerToken, {
      status: VideoProductionStatus.FINAL_REVIEW,
      remarks: 'Pull to final review',
    });
    checks.push({
      id: 3,
      name: 'Reviewer can pull to review (EDITING -> FINAL_REVIEW)',
      pass: res1C.status === 200 && res1C.body?.status === VideoProductionStatus.FINAL_REVIEW,
      details: `Status: ${res1C.status}, Body: ${JSON.stringify(res1C.body)}`,
    });

    // =============================================================
    // TEST GROUP 2: FORBIDDEN ROLES & NON-REVIEW TRANSITIONS ON VIDEO STATUS
    // =============================================================
    console.log('\n[GROUP 2] Forbidden Roles & Non-Review Transitions on Video Status');

    // 2A. QUESTION_EDITOR forbidden on video status
    const res2A = await request(`/videos/${mockVideo.id}/status`, 'PATCH', questionEditorToken, {
      status: VideoProductionStatus.READY_TO_UPLOAD,
    });
    checks.push({
      id: 4,
      name: 'QUESTION_EDITOR forbidden on PATCH /videos/:id/status (403)',
      pass: res2A.status === 403,
      details: `Expected 403, got ${res2A.status}`,
    });

    // 2B. SCRIPT_WRITER forbidden on video status
    const res2B = await request(`/videos/${mockVideo.id}/status`, 'PATCH', scriptWriterToken, {
      status: VideoProductionStatus.READY_TO_UPLOAD,
    });
    checks.push({
      id: 5,
      name: 'SCRIPT_WRITER forbidden on PATCH /videos/:id/status (403)',
      pass: res2B.status === 403,
      details: `Expected 403, got ${res2B.status}`,
    });

    // 2C. DESIGNER forbidden on video status
    const res2C = await request(`/videos/${mockVideo.id}/status`, 'PATCH', assignedDesignerToken, {
      status: VideoProductionStatus.READY_TO_UPLOAD,
    });
    checks.push({
      id: 6,
      name: 'DESIGNER forbidden on PATCH /videos/:id/status (403)',
      pass: res2C.status === 403,
      details: `Expected 403, got ${res2C.status}`,
    });

    // 2D. Anonymous/unauthenticated forbidden (401)
    const res2D = await request(`/videos/${mockVideo.id}/status`, 'PATCH', null, {
      status: VideoProductionStatus.READY_TO_UPLOAD,
    });
    checks.push({
      id: 7,
      name: 'Anonymous forbidden on PATCH /videos/:id/status (401)',
      pass: res2D.status === 401,
      details: `Expected 401, got ${res2D.status}`,
    });

    // 2E. Reviewer CANNOT transition to non-review status (e.g. RECORDING)
    const res2E = await request(`/videos/${mockVideo.id}/status`, 'PATCH', assignedReviewerToken, {
      status: VideoProductionStatus.RECORDING,
    });
    checks.push({
      id: 8,
      name: 'Reviewer forbidden from transitioning to non-review status (RECORDING) (403)',
      pass: res2E.status === 403,
      details: `Expected 403, got ${res2E.status}`,
    });

    // 2F. Reviewer CANNOT transition to CANCELLED
    const res2F = await request(`/videos/${mockVideo.id}/status`, 'PATCH', assignedReviewerToken, {
      status: VideoProductionStatus.CANCELLED,
    });
    checks.push({
      id: 9,
      name: 'Reviewer forbidden from transitioning to CANCELLED (403)',
      pass: res2F.status === 403,
      details: `Expected 403, got ${res2F.status}`,
    });

    // =============================================================
    // TEST GROUP 3: DESIGNER PERMITTED THUMBNAIL COMPLETION TRANSITION
    // =============================================================
    console.log('\n[GROUP 3] Designer Permitted Thumbnail Completion Transition');

    // 3A. Designer transitions thumbnail to DESIGNED
    const res3A = await request(`/thumbnails/${mockThumbnail.id}/status`, 'PATCH', assignedDesignerToken, {
      status: 'DESIGNED',
      remarks: 'Thumbnail created and uploaded to Drive',
    });
    checks.push({
      id: 10,
      name: 'Designer can mark thumbnail as DESIGNED',
      pass: res3A.status === 200 && res3A.body?.status === 'DESIGNED',
      details: `Status: ${res3A.status}, Body: ${JSON.stringify(res3A.body)}`,
    });

    // =============================================================
    // TEST GROUP 4: FORBIDDEN ROLES & STATES ON THUMBNAIL STATUS
    // =============================================================
    console.log('\n[GROUP 4] Forbidden Roles & States on Thumbnail Status');

    // 4A. QUESTION_EDITOR forbidden on thumbnail status
    const res4A = await request(`/thumbnails/${mockThumbnail.id}/status`, 'PATCH', questionEditorToken, {
      status: 'DESIGNED',
    });
    checks.push({
      id: 11,
      name: 'QUESTION_EDITOR forbidden on PATCH /thumbnails/:id/status (403)',
      pass: res4A.status === 403,
      details: `Expected 403, got ${res4A.status}`,
    });

    // 4B. VIDEO_EDITOR forbidden on thumbnail status
    const res4B = await request(`/thumbnails/${mockThumbnail.id}/status`, 'PATCH', videoEditorToken, {
      status: 'DESIGNED',
    });
    checks.push({
      id: 12,
      name: 'VIDEO_EDITOR forbidden on PATCH /thumbnails/:id/status (403)',
      pass: res4B.status === 403,
      details: `Expected 403, got ${res4B.status}`,
    });

    // 4C. SCRIPT_WRITER forbidden on thumbnail status
    const res4C = await request(`/thumbnails/${mockThumbnail.id}/status`, 'PATCH', scriptWriterToken, {
      status: 'DESIGNED',
    });
    checks.push({
      id: 13,
      name: 'SCRIPT_WRITER forbidden on PATCH /thumbnails/:id/status (403)',
      pass: res4C.status === 403,
      details: `Expected 403, got ${res4C.status}`,
    });

    // 4D. Anonymous forbidden on thumbnail status (401)
    const res4D = await request(`/thumbnails/${mockThumbnail.id}/status`, 'PATCH', null, {
      status: 'DESIGNED',
    });
    checks.push({
      id: 14,
      name: 'Anonymous forbidden on PATCH /thumbnails/:id/status (401)',
      pass: res4D.status === 401,
      details: `Expected 401, got ${res4D.status}`,
    });

    // 4E. Designer CANNOT approve thumbnail (APPROVED)
    const res4E = await request(`/thumbnails/${mockThumbnail.id}/status`, 'PATCH', assignedDesignerToken, {
      status: 'APPROVED',
    });
    checks.push({
      id: 15,
      name: 'Designer forbidden from approving thumbnail (status: APPROVED) (403)',
      pass: res4E.status === 403,
      details: `Expected 403, got ${res4E.status}`,
    });

    // 4F. Designer CANNOT reject thumbnail (REJECTED)
    const res4F = await request(`/thumbnails/${mockThumbnail.id}/status`, 'PATCH', assignedDesignerToken, {
      status: 'REJECTED',
    });
    checks.push({
      id: 16,
      name: 'Designer forbidden from rejecting thumbnail (status: REJECTED) (403)',
      pass: res4F.status === 403,
      details: `Expected 403, got ${res4F.status}`,
    });

    // 4G. Admin CAN approve thumbnail (APPROVED)
    const res4G = await request(`/thumbnails/${mockThumbnail.id}/status`, 'PATCH', adminToken, {
      status: 'APPROVED',
      remarks: 'Admin approval verified',
    });
    checks.push({
      id: 17,
      name: 'Admin can approve thumbnail (status: APPROVED)',
      pass: res4G.status === 200 && res4G.body?.status === 'APPROVED',
      details: `Status: ${res4G.status}, Body: ${JSON.stringify(res4G.body)}`,
    });

    // =============================================================
    // TEST GROUP 5: OBJECT-LEVEL AUTHORIZATION ENFORCEMENT
    // =============================================================
    console.log('\n[GROUP 5] Object-Level Authorization Enforcement');

    // 5A. Unassigned Reviewer rejected with 403
    const res5A = await request(`/videos/${mockVideo.id}/status`, 'PATCH', unassignedReviewerToken, {
      status: VideoProductionStatus.READY_TO_UPLOAD,
    });
    checks.push({
      id: 18,
      name: 'Unassigned Reviewer blocked by object authorization (403)',
      pass: res5A.status === 403,
      details: `Expected 403, got ${res5A.status}`,
    });

    // 5B. Conflicted Reviewer (video host self-approval) rejected with 403
    const res5B = await request(`/videos/${mockVideo.id}/status`, 'PATCH', conflictedReviewerToken, {
      status: VideoProductionStatus.READY_TO_UPLOAD,
    });
    checks.push({
      id: 19,
      name: 'Conflicted Reviewer (self-approval) blocked by object authorization (403)',
      pass: res5B.status === 403,
      details: `Expected 403, got ${res5B.status}`,
    });

    // 5C. Unassigned Designer rejected with 403
    const res5C = await request(`/thumbnails/${mockThumbnail.id}/status`, 'PATCH', unassignedDesignerToken, {
      status: 'DESIGNED',
    });
    checks.push({
      id: 20,
      name: 'Unassigned Designer blocked by object authorization (403)',
      pass: res5C.status === 403,
      details: `Expected 403, got ${res5C.status}`,
    });

    // =============================================================
    // TEST GROUP 6: UNRELATED ROUTE PERMISSIONS UNCHANGED
    // =============================================================
    console.log('\n[GROUP 6] Unrelated Route Permissions Invariance');

    // 6A. POST /videos/:id/assignments still requires ADMIN or CONTENT_MANAGER (REVIEWER gets 403)
    const res6A = await request(`/videos/${mockVideo.id}/assignments`, 'POST', assignedReviewerToken, {
      assigneeId: 'USR-TEST',
    });
    checks.push({
      id: 21,
      name: 'POST /videos/:id/assignments still rejects REVIEWER (403)',
      pass: res6A.status === 403,
      details: `Expected 403, got ${res6A.status}`,
    });

    // 6B. PUT /videos/:id still requires ADMIN, CONTENT_MANAGER, or VIDEO_EDITOR (REVIEWER gets 403)
    const res6B = await request(`/videos/${mockVideo.id}`, 'PUT', assignedReviewerToken, {
      notes: 'Reviewer trying to edit metadata',
    });
    checks.push({
      id: 22,
      name: 'PUT /videos/:id still rejects REVIEWER (403)',
      pass: res6B.status === 403,
      details: `Expected 403, got ${res6B.status}`,
    });

    // 6C. POST /questions/:id/queue still requires ADMIN or CONTENT_MANAGER (REVIEWER gets 403)
    const res6C = await request(`/questions/BP-Q-001/queue`, 'POST', assignedReviewerToken, {});
    checks.push({
      id: 23,
      name: 'POST /questions/:id/queue still rejects REVIEWER (403)',
      pass: res6C.status === 403,
      details: `Expected 403, got ${res6C.status}`,
    });

    // 6D. POST /videos/:videoId/script still rejects DESIGNER (403)
    const res6D = await request(`/videos/${mockVideo.id}/script`, 'POST', assignedDesignerToken, {
      hookText: 'Designer writing script',
    });
    checks.push({
      id: 24,
      name: 'POST /videos/:videoId/script still rejects DESIGNER (403)',
      pass: res6D.status === 403,
      details: `Expected 403, got ${res6D.status}`,
    });

  } finally {
    // Teardown
    await new Promise<void>((resolve) => server.close(() => resolve()));

    videosRepository.findById = origFindVideoById;
    thumbnailsRepository.findById = origFindThumbById;
    videoService.transitionStatus = origTransitionStatus;
    thumbnailService.updateStatus = origUpdateThumbStatus;
    objectAuthService.canModifyVideo = origCanModifyVideo;
    objectAuthService.canSubmitSocialReview = origCanSubmitSocialReview;
    objectAuthService.canModifyThumbnail = origCanModifyThumbnail;
  }

  const passedCount = checks.filter((c) => c.pass).length;
  const failedCount = checks.filter((c) => !c.pass).length;

  console.log('\n===============================================================');
  console.log(`RESULTS: ${passedCount}/${checks.length} checks passed`);
  if (failedCount > 0) {
    console.log(`FAILED: ${failedCount} checks failed!`);
    checks.filter((c) => !c.pass).forEach((c) => {
      console.log(`  FAIL [Check ${c.id}] ${c.name}: ${c.details}`);
    });
  } else {
    console.log('ALL 24 FOCUSED RBAC CHECKS PASSED PERFECTLY!');
  }
  console.log('===============================================================\n');

  return {
    allPassed: failedCount === 0,
    total: checks.length,
    passed: passedCount,
    failed: failedCount,
    checks,
  };
}

// Direct execution
runCmsFix1RbacVerification()
  .then((res) => {
    process.exit(res.allPassed ? 0 : 1);
  })
  .catch((err) => {
    console.error('Fatal test error:', err);
    process.exit(1);
  });
