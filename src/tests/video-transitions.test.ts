/**
 * BURRA PARIKSHA CMS — Stage 02 Video Transitions & 15-Stage Workflow Regression Test Suite
 * 
 * Verifies the authoritative state machine, canonical 15-stage workflow alignment,
 * Google Drive asset upload safety, and UI status mapping.
 */

import { videoService } from '../lib/services/video.service';
import { googleDriveService } from '../lib/services/google-drive.service';
import { videosRepository } from '../lib/repositories/videos.repository';
import { questionsRepository } from '../lib/repositories/questions.repository';
import { mediaAssetsRepository } from '../lib/repositories/media-assets.repository';
import { contentMastersRepository } from '../lib/repositories/content-masters.repository';
import { VideoProductionStatus, UserRole, PriorityLevel, QuestionStatus } from '../types';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${msg}`);
  }
}

export async function runVideoTransitionTests() {
  console.log('============================================================');
  console.log('RUNNING STAGE 02 VIDEO STATE MACHINE & WORKFLOW REGRESSION TESTS');
  console.log('============================================================');

  // Clear or prepare initial test data
  videosRepository.clearFallbackData();
  questionsRepository.clearFallbackData();
  mediaAssetsRepository.clearFallbackData();
  contentMastersRepository.clearFallbackData();

  const mockActor = {
    id: 'USR-ADMIN',
    name: 'Admin User',
    role: UserRole.ADMIN,
  };

  const mockViewer = {
    id: 'USR-VIEWER',
    name: 'Analytics Viewer',
    role: 'ANALYTICS_VIEWER',
  };

  const rand = Math.floor(Math.random() * 1000000) + 100000;
  const qId = `BP-Q-${rand}`;
  const vId = `BP-V-${rand}`;
  const cntId = `BP-CNT-${rand}`;

  // Create mock parent Content Master record
  await contentMastersRepository.create({
    id: cntId,
    title: 'Test Content Master',
    status: 'ACTIVE' as any,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // Create a base source question (Approved & Valid)
  const question = await questionsRepository.create({
    id: qId,
    contentId: cntId,
    contentMasterId: cntId,
    status: QuestionStatus.APPROVED,
    validationStatus: 'VALID' as any,
    questionText: 'Test Telugu Question',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);

  // Create associated video in QUEUED state
  const video = await videosRepository.create({
    id: vId,
    contentId: cntId,
    contentMasterId: cntId,
    questionId: question.id,
    title: `Short Video for ${qId}`,
    status: VideoProductionStatus.QUEUED,
    priority: PriorityLevel.NORMAL,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // --------------------------------------------------------------------------
  // TEST 1: QUEUED -> EDITING must remain rejected
  // --------------------------------------------------------------------------
  try {
    await videoService.transitionStatus(
      video.id,
      VideoProductionStatus.EDITING,
      mockActor,
      'Direct transition from QUEUED to EDITING',
      undefined,
      true
    );
    assert(false, 'TEST 1 FAILED: Allowed transition from QUEUED to EDITING directly');
  } catch (err: any) {
    assert(
      err.message.includes('Illegal status transition') || err.message.includes('ValidationError'),
      `TEST 1 PASSED: Correctly rejected QUEUED -> EDITING with message: ${err.message}`
    );
  }

  // --------------------------------------------------------------------------
  // TEST 2: SCRIPT_READY -> RECORDED must work
  // --------------------------------------------------------------------------
  // Set video to SCRIPT_READY
  await videosRepository.update(video.id, { status: VideoProductionStatus.SCRIPT_READY });
  
  const transitionedToRecorded = await videoService.transitionStatus(
    video.id,
    VideoProductionStatus.RECORDED,
    mockActor,
    'Raw footage uploaded',
    undefined,
    true // bypass raw footage binary check
  );
  assert(
    transitionedToRecorded.status === VideoProductionStatus.RECORDED,
    `TEST 2: SCRIPT_READY -> RECORDED succeeded (actual: ${transitionedToRecorded.status})`
  );

  // --------------------------------------------------------------------------
  // TEST 3: RECORDING -> RECORDED must work
  // --------------------------------------------------------------------------
  // Reset video to RECORDING
  await videosRepository.update(video.id, { status: VideoProductionStatus.RECORDING });

  const recordingToRecorded = await videoService.transitionStatus(
    video.id,
    VideoProductionStatus.RECORDED,
    mockActor,
    'Ingestion completed',
    undefined,
    true
  );
  assert(
    recordingToRecorded.status === VideoProductionStatus.RECORDED,
    `TEST 3: RECORDING -> RECORDED succeeded (actual: ${recordingToRecorded.status})`
  );

  // --------------------------------------------------------------------------
  // TEST 4: RECORDED -> EDITING must work
  // --------------------------------------------------------------------------
  const recordedToEditing = await videoService.transitionStatus(
    video.id,
    VideoProductionStatus.EDITING,
    mockActor,
    'Ready for video editor cut',
    undefined,
    true
  );
  assert(
    recordedToEditing.status === VideoProductionStatus.EDITING,
    `TEST 4: RECORDED -> EDITING succeeded`
  );

  // --------------------------------------------------------------------------
  // TEST 6: Repeated clicking must be idempotent
  // --------------------------------------------------------------------------
  // Already in EDITING status. Transitioning again to EDITING must return same.
  const idempotentResult = await videoService.transitionStatus(
    video.id,
    VideoProductionStatus.EDITING,
    mockActor,
    'Click again',
    undefined,
    true
  );
  assert(
    idempotentResult.status === VideoProductionStatus.EDITING,
    'TEST 6: Transitioning same status is perfectly idempotent and does not fail'
  );

  // --------------------------------------------------------------------------
  // TEST 7: Uploading the same Drive asset twice must not create duplicate media records
  // --------------------------------------------------------------------------
  const buffer = Buffer.from('mock video binary content');
  
  // Reset video status to SCRIPT_READY to verify upload transitions it to RECORDED
  await videosRepository.update(video.id, { status: VideoProductionStatus.SCRIPT_READY });

  // Stub googleDriveService.uploadFile to return a fixed fileId for the duplicate test
  const originalUploadFile = googleDriveService.uploadFile;
  googleDriveService.uploadFile = async function (params) {
    return {
      fileId: 'fixed_drive_file_id_12345',
      name: params.fileName,
      mimeType: params.mimeType,
      size: 1024,
      webViewLink: 'https://drive.google.com/file/d/fixed_drive_file_id_12345/view',
    };
  };

  // Call upload twice for same file ID / content ID
  const upload1 = await videoService.uploadVideoAsset({
    contentId: cntId,
    videoId: video.id,
    fileName: 'test_raw.mp4',
    mimeType: 'video/mp4',
    size: buffer.length,
    fileStreamOrBuffer: buffer,
    actor: mockActor,
  });

  const upload2 = await videoService.uploadVideoAsset({
    contentId: cntId,
    videoId: video.id,
    fileName: 'test_raw.mp4',
    mimeType: 'video/mp4',
    size: buffer.length,
    fileStreamOrBuffer: buffer,
    actor: mockActor,
  });

  // Restore the original upload method
  googleDriveService.uploadFile = originalUploadFile;

  const allAssets = await mediaAssetsRepository.findByContentIdAndStage(cntId, 'RAW');
  // Check that the driveFileId reuse works
  assert(allAssets.length === 1, `TEST 7: Uploading same file did not create duplicate MediaAsset (found: ${allAssets.length})`);

  // --------------------------------------------------------------------------
  // TEST 8: Video status and Question.videoStatus must remain synchronized
  // --------------------------------------------------------------------------
  // After upload, status is updated. Let's verify associated Question.videoStatus is synchronized.
  const updatedQuestion = await questionsRepository.findById(question.id);
  assert(
    updatedQuestion?.videoStatus === VideoProductionStatus.RECORDED,
    `TEST 8: Question.videoStatus is synchronized with Video status (Expected RECORDED, found: ${updatedQuestion?.videoStatus})`
  );

  // --------------------------------------------------------------------------
  // TEST 9: An unauthorized actor must still be blocked
  // --------------------------------------------------------------------------
  try {
    await videoService.transitionStatus(
      video.id,
      VideoProductionStatus.EDITING,
      mockViewer,
      'Try transition with non-authorized role',
      undefined,
      true
    );
    assert(false, 'TEST 9 FAILED: Unauthorized role was allowed to transition status');
  } catch (err: any) {
    assert(
      err.message.includes('Unauthorized') || err.message.includes('not allowed'),
      `TEST 9 PASSED: Blocked unauthorized role successfully`
    );
  }

  // --------------------------------------------------------------------------
  // TEST 10: An invalid state transition must still be rejected by the backend
  // --------------------------------------------------------------------------
  // Reset video to QUEUED
  await videosRepository.update(video.id, { status: VideoProductionStatus.QUEUED });
  try {
    await videoService.transitionStatus(
      video.id,
      VideoProductionStatus.EDITED,
      mockActor,
      'Illegal skip from QUEUED to EDITED',
      undefined,
      true
    );
    assert(false, 'TEST 10 FAILED: Allowed transition of invalid step skip QUEUED -> EDITED');
  } catch (err: any) {
    assert(
      err.message.includes('Illegal status transition') || err.message.includes('ValidationError'),
      `TEST 10 PASSED: Successfully rejected illegal status skip`
    );
  }

  console.log('ALL TESTS PASSED SUCCESSFULLY! ✅');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runVideoTransitionTests().catch((err) => {
    console.error('Test Failed:', err);
    process.exit(1);
  });
}
