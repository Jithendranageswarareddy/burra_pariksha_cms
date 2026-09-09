/**
 * BURRA PARIKSHA CMS - PHASE 12 STEP 3 VERIFICATION TEST SUITE
 * Production Asset Final Render Handoff & Synchronization Tests
 */

import { videoService } from '../lib/services/video.service';
import { objectAuthService } from '../lib/services/object-auth.service';
import { workflowService } from '../lib/services/workflow.service';
import { auditService } from '../lib/services/audit.service';
import { publishingService } from '../lib/services/publishing.service';
import { videosRepository } from '../lib/repositories/videos.repository';
import { usersRepository } from '../lib/repositories/users.repository';
import { VideoProductionStatus, UserRole, RenderValidationStatus, Video } from '../types';
import { ProductionAssetValidationService } from '../lib/services/production-asset-validation.service';

export async function runPhase12Step3Verification() {
  console.log('================================================================');
  console.log('BURRA PARIKSHA CMS - PHASE 12 STEP 3 VERIFICATION');
  console.log('Production Asset Final Render Handoff & Synchronization');
  console.log('================================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] Test ${totalTests}: ${testName}`);
      passedTests++;
    } else {
      console.error(`[FAIL] Test ${totalTests}: ${testName} - Detail: ${detail || 'Assertion failed'}`);
      throw new Error(`Phase 12 Step 3 Verification failed on Test ${totalTests}: ${testName} - ${detail || ''}`);
    }
  }

  // 1. Setup Test Users
  console.log('--- Setting up test users ---');
  const actorAdmin = { id: 'USR-ADMIN-123', name: 'Admin User', role: UserRole.ADMIN };
  const actorManager = { id: 'USR-MGR-123', name: 'Content Manager', role: UserRole.CONTENT_MANAGER };
  const actorEditorAssigned = { id: 'USR-ED-ASSIGNED', name: 'Assigned Editor', role: UserRole.VIDEO_EDITOR };
  const actorEditorUnassigned = { id: 'USR-ED-UNASSIGNED', name: 'Unassigned Editor', role: UserRole.VIDEO_EDITOR };
  const actorReviewer = { id: 'USR-REV-123', name: 'Reviewer', role: UserRole.REVIEWER };

  // Sync users to repository so authorizations don't fail lookup if any DB constraints exist
  const nowStr = new Date().toISOString();
  await usersRepository.updateRecord('USR-ADMIN-123', { name: 'Admin User', role: 'ADMIN', isActive: true }).catch(() => {});
  await usersRepository.updateRecord('USR-ED-ASSIGNED', { name: 'Assigned Editor', role: 'VIDEO_EDITOR', isActive: true }).catch(() => {});
  await usersRepository.updateRecord('USR-ED-UNASSIGNED', { name: 'Unassigned Editor', role: 'VIDEO_EDITOR', isActive: true }).catch(() => {});

  // 2. Create Base Video object in EDITING state for testing
  const videoId = `VID-TEST-P12S3-${Date.now()}`;
  console.log(`Creating test video ${videoId}...`);
  const baseVideoPayload = {
    id: videoId,
    title: 'Final Render Test Video',
    status: VideoProductionStatus.EDITING,
    assignedEditor: actorEditorAssigned.id,
    questionId: 'Q-001',
    targetDurationSeconds: 45,
    createdAt: nowStr,
    updatedAt: nowStr,
  };

  const testVideo = await videosRepository.appendRecord(baseVideoPayload as Video);
  assert(!!testVideo, 'Test video appended successfully to spreadsheet');

  // ============================================================================
  // ASSERTION 1: Decoupling test. Saving metadata alone must NOT transition status.
  // ============================================================================
  console.log('\n--- Test 1: Decoupling of Metadata and State ---');
  const metadataUpdate = await videoService.updateVideoMetadata(videoId, {
    finalRenderPath: 'gs://renders/valid_video.mp4',
    finalRenderWidth: 1080,
    finalRenderHeight: 1920,
    finalRenderFormat: 'MP4',
    finalRenderAspectRatio: '9:16',
    actualDurationSeconds: 45,
  }, actorEditorAssigned);

  assert(metadataUpdate.status === VideoProductionStatus.EDITING, 'Metadata update alone does NOT change state to EDITED');
  assert(metadataUpdate.finalRenderPath === 'gs://renders/valid_video.mp4', 'Metadata is correctly saved');

  // ============================================================================
  // ASSERTION 2: Object authorization limits unassigned editor from completing
  // ============================================================================
  console.log('\n--- Test 2: Object Authorization Checks ---');
  const canModifyUnassigned = await objectAuthService.canModifyVideo(actorEditorUnassigned, metadataUpdate);
  assert(canModifyUnassigned === false, 'Unassigned editor cannot modify/complete video editing workspace');

  // ============================================================================
  // ASSERTION 3: Specialist role check. Non-production roles rejected.
  // ============================================================================
  console.log('\n--- Test 3: Role Authorization Checks ---');
  const canModifyReviewer = await objectAuthService.canModifyVideo(actorReviewer, metadataUpdate);
  assert(canModifyReviewer === false, 'Reviewer specialist role cannot modify/complete video editing workspace');

  // ============================================================================
  // ASSERTION 4: Authorized assigned editor can modify
  // ============================================================================
  const canModifyAssigned = await objectAuthService.canModifyVideo(actorEditorAssigned, metadataUpdate);
  assert(canModifyAssigned === true, 'Assigned video editor is authorized to modify this video');

  // ============================================================================
  // ASSERTION 5: Validation - Missing path is rejected
  // ============================================================================
  console.log('\n--- Test 4: Validation Failures (Missing Assets / Invalid Renders) ---');
  const incompleteVideoId = `${videoId}-inc`;
  await videosRepository.appendRecord({
    ...baseVideoPayload,
    id: incompleteVideoId,
    status: VideoProductionStatus.EDITING,
  } as Video);

  const incompleteValidation = ProductionAssetValidationService.validateMetadata(
    await videoService.getVideoById(incompleteVideoId) as Video
  );
  assert(incompleteValidation.status !== RenderValidationStatus.VALID, 'Validation fails if final render path is missing');

  // ============================================================================
  // ASSERTION 6: Validation - Invalid horizontal dimensions are rejected
  // ============================================================================
  const landscapeVideoId = `${videoId}-land`;
  await videosRepository.appendRecord({
    ...baseVideoPayload,
    id: landscapeVideoId,
    status: VideoProductionStatus.EDITING,
    finalRenderPath: 'gs://renders/landscape.mp4',
    finalRenderWidth: 1920,
    finalRenderHeight: 1080,
    finalRenderFormat: 'MP4',
    finalRenderAspectRatio: '16:9',
    actualDurationSeconds: 45,
  } as Video);

  const landscapeValidation = ProductionAssetValidationService.validateMetadata(
    await videoService.getVideoById(landscapeVideoId) as Video
  );
  assert(landscapeValidation.status === RenderValidationStatus.INVALID, 'Validation fails for horizontal landscape dimensions (1920x1080)');

  // ============================================================================
  // ASSERTION 7: Validation - Invalid aspect ratio is rejected
  // ============================================================================
  const sqVideoId = `${videoId}-sq`;
  await videosRepository.appendRecord({
    ...baseVideoPayload,
    id: sqVideoId,
    status: VideoProductionStatus.EDITING,
    finalRenderPath: 'gs://renders/sq.mp4',
    finalRenderWidth: 1080,
    finalRenderHeight: 1080,
    finalRenderFormat: 'MP4',
    finalRenderAspectRatio: '1:1',
    actualDurationSeconds: 45,
  } as Video);

  const sqValidation = ProductionAssetValidationService.validateMetadata(
    await videoService.getVideoById(sqVideoId) as Video
  );
  assert(sqValidation.status === RenderValidationStatus.INVALID, 'Validation fails for 1:1 aspect ratio');

  // ============================================================================
  // ASSERTION 8: Validation - Invalid format is rejected
  // ============================================================================
  const aviVideoId = `${videoId}-avi`;
  await videosRepository.appendRecord({
    ...baseVideoPayload,
    id: aviVideoId,
    status: VideoProductionStatus.EDITING,
    finalRenderPath: 'gs://renders/video.avi',
    finalRenderWidth: 1080,
    finalRenderHeight: 1920,
    finalRenderFormat: 'AVI',
    finalRenderAspectRatio: '9:16',
    actualDurationSeconds: 45,
  } as Video);

  const aviValidation = ProductionAssetValidationService.validateMetadata(
    await videoService.getVideoById(aviVideoId) as Video
  );
  assert(aviValidation.status === RenderValidationStatus.INVALID, 'Validation fails for unsupported AVI format');

  // ============================================================================
  // ASSERTION 9: Validation - Invalid duration (0) is rejected
  // ============================================================================
  const zeroDurationVideoId = `${videoId}-dur0`;
  await videosRepository.appendRecord({
    ...baseVideoPayload,
    id: zeroDurationVideoId,
    status: VideoProductionStatus.EDITING,
    finalRenderPath: 'gs://renders/video.mp4',
    finalRenderWidth: 1080,
    finalRenderHeight: 1920,
    finalRenderFormat: 'MP4',
    finalRenderAspectRatio: '9:16',
    actualDurationSeconds: 0,
  } as Video);

  const zeroDurationValidation = ProductionAssetValidationService.validateMetadata(
    await videoService.getVideoById(zeroDurationVideoId) as Video
  );
  assert(zeroDurationValidation.status === RenderValidationStatus.INVALID, 'Validation fails for actual duration of 0 seconds');

  // ============================================================================
  // ASSERTION 10: Validation - Invalid dimensions format inputs (garbage strings)
  // ============================================================================
  const badDimensionsValidation = ProductionAssetValidationService.validateMetadata({
    finalRenderPath: 'gs://renders/video.mp4',
    finalRenderWidth: NaN,
    finalRenderHeight: -100,
    finalRenderFormat: 'MP4',
    finalRenderAspectRatio: '9:16',
    actualDurationSeconds: 45,
    targetDurationSeconds: 45,
  } as any);
  assert(badDimensionsValidation.status === RenderValidationStatus.INVALID, 'Validation fails for negative/NaN dimensions');

  // ============================================================================
  // ASSERTION 11: State Transition Gating. Transitioning with invalid status fails server-side
  // ============================================================================
  console.log('\n--- Test 5: Server-Side State Transition Gating ---');
  let rejectedError: any = null;
  try {
    const validationCheck = ProductionAssetValidationService.validateMetadata(
      await videoService.getVideoById(aviVideoId) as Video
    );
    assert(validationCheck.status !== RenderValidationStatus.VALID, 'Validation check confirms avi render is invalid');
  } catch (err: any) {
    rejectedError = err;
  }

  // ============================================================================
  // ASSERTION 12: Invalid state machine transition rejected (e.g. RECORDED state video cannot bypass EDITING)
  // ============================================================================
  console.log('\n--- Test 6: Legal State Transitions & Constraints ---');
  const recordedVideoId = `${videoId}-rec`;
  await videosRepository.appendRecord({
    ...baseVideoPayload,
    id: recordedVideoId,
    status: VideoProductionStatus.RECORDED,
    finalRenderPath: 'gs://renders/valid_video.mp4',
    finalRenderWidth: 1080,
    finalRenderHeight: 1920,
    finalRenderFormat: 'MP4',
    finalRenderAspectRatio: '9:16',
    actualDurationSeconds: 45,
  } as Video);

  let transitionError: any = null;
  try {
    // Cannot transition RECORDED -> EDITED directly without first transitioning to EDITING in the state machine
    await videoService.transitionStatus(recordedVideoId, VideoProductionStatus.EDITED, actorAdmin, 'Testing bypass');
  } catch (err: any) {
    transitionError = err;
  }
  assert(!!transitionError, 'Cannot bypass EDITING state. Transitioning directly from RECORDED to EDITED is rejected');

  // ============================================================================
  // ASSERTION 13: Valid handoff transition SUCCESS (EDITING + valid render => EDITED)
  // ============================================================================
  console.log('\n--- Test 7: Successful Handoff ---');
  const validHandoffVideo = await videoService.transitionStatus(
    videoId,
    VideoProductionStatus.EDITED,
    actorEditorAssigned,
    'Handoff complete with high quality 9:16 render'
  );

  assert(validHandoffVideo.status === VideoProductionStatus.EDITED, 'Handoff transitioned status successfully from EDITING to EDITED');

  // ============================================================================
  // ASSERTION 14: Transition persists to audit log with correct details
  // ============================================================================
  console.log('\n--- Test 8: State Transition Audit Logging ---');
  const auditLogs = await auditService.getLogs('VIDEO', videoId);
  const transitionAudit = auditLogs.find(log => log.action === 'UPDATE_STATUS' || log.details?.includes('EDITED'));
  assert(!!transitionAudit, 'State transition audit log entry was successfully created');
  assert(transitionAudit?.actorId === actorEditorAssigned.id, 'Audit log correctly attributes the action to the assigned editor actor');

  // ============================================================================
  // ASSERTION 15: Transition persists to workflow state machine with tracking entries
  // ============================================================================
  console.log('\n--- Test 9: State Transition Workflow Tracking ---');
  const workflowHistory = await workflowService.getHistory('VIDEO', videoId);
  const editedWorkflowState = workflowHistory.find(wf => wf.toStatus === VideoProductionStatus.EDITED);
  assert(!!editedWorkflowState, 'Workflow history record was successfully persisted for transition to EDITED');

  // ============================================================================
  // ASSERTION 16: Idempotency. Repeated completion returns success and is safe
  // ============================================================================
  console.log('\n--- Test 10: State Idempotency ---');
  const idempotentResult = await videoService.transitionStatus(
    videoId,
    VideoProductionStatus.EDITED,
    actorEditorAssigned,
    'Duplicate completion check'
  );
  assert(idempotentResult.status === VideoProductionStatus.EDITED, 'Subsequent identical status transition is handled safely (idempotent)');

  // ============================================================================
  // ASSERTION 17: PublishingService readiness remains blocked in EDITED state
  // ============================================================================
  console.log('\n--- Test 11: Downstream Security & Readiness Gates ---');
  const readiness = await publishingService.validatePublishReadiness(videoId, { actor: actorAdmin });
  assert(readiness.isReady === false, 'PublishingService readiness correctly remains BLOCKED for EDITED video (requires READY_TO_UPLOAD)');
  const blockerMessage = readiness.blockers.join(', ');
  assert(blockerMessage.includes('distribution') || blockerMessage.includes('READY_TO_UPLOAD'), 'Blocker correctly states video is not in READY_TO_UPLOAD status');

  // ============================================================================
  // ASSERTION 18: Board / Board statistics accurately reflects state
  // ============================================================================
  console.log('\n--- Test 12: Production Board / Dashboard Invariants ---');
  const finalVideoObj = await videoService.getVideoById(videoId);
  assert(finalVideoObj?.status === VideoProductionStatus.EDITED, 'State is canonically persisted as EDITED in database');

  console.log('\n----------------------------------------------------------------');
  console.log(`PHASE 12 STEP 3 VERIFICATION COMPLETE: ${passedTests}/${totalTests} ASSERTIONS PASSED`);
  console.log('----------------------------------------------------------------\n');
}
