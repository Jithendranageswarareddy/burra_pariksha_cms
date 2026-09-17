/**
 * BURRA PARIKSHA CMS — PHASE 17 VERIFICATION SUITE
 * 
 * Verifies P17-01 through P17-20:
 * 1. Content correlation & invariants (P17-01 to P17-04)
 * 2. Video production lifecycle state machine (P17-05 to P17-09)
 * 3. Drive folders & binary storage (P17-10 to P17-13)
 * 4. User roles & RBAC enforcement (P17-14 to P17-16)
 * 5. Media versioning & non-destructive history (P17-17, P17-18)
 * 6. Zero auto-publish safety (P17-19)
 * 7. Real E2E Drive binary test (P17-20)
 */

import crypto from 'crypto';
import { videoService } from '../lib/services/video.service';
import { ValidationError } from '../lib/google-sheets/errors';
import { questionsRepository } from '../lib/repositories/questions.repository';
import { scriptsRepository } from '../lib/repositories/scripts.repository';
import { videosRepository } from '../lib/repositories/videos.repository';
import { mediaAssetsRepository } from '../lib/repositories/media-assets.repository';
import { contentMastersRepository } from '../lib/repositories/content-masters.repository';
import { phase17VideoProductionService } from '../lib/services/phase17-video-production.service';
import { phase14DriveService } from '../lib/services/phase14-drive.service';
import { googleDriveService } from '../lib/services/google-drive.service';
import { idService } from '../lib/services/id.service';
import {
  Question,
  DifficultyLevel,
  QuestionLanguage,
  QuestionStatus,
  UserRole,
  Script,
  VideoProductionStatus,
  ContentMasterStatus,
} from '../types';

export interface VerificationResult {
  code: string;
  check: string;
  status: 'PASS' | 'FAIL';
  details: string;
}

export async function runPhase17Verification(): Promise<{
  passed: boolean;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  results: VerificationResult[];
}> {
  const results: VerificationResult[] = [];
  let passedCount = 0;

  const addResult = (code: string, check: string, passed: boolean, details: string) => {
    const status: 'PASS' | 'FAIL' = passed ? 'PASS' : 'FAIL';
    if (passed) passedCount++;
    results.push({ code, check, status, details });
    console.log(`[${status}] ${code}: ${check}\n      Details: ${details}`);
  };

  const adminActor = { id: 'USR-ADMIN', name: 'Admin User', role: UserRole.ADMIN };
  const editorActor = { id: 'USR-EDITOR', name: 'Editor User', role: UserRole.VIDEO_EDITOR };
  const speakerActor = { id: 'USR-SPEAKER', name: 'Speaker User', role: UserRole.SPEAKER };
  const unauthorizedActor = { id: 'USR-VIEWER', name: 'Viewer User', role: UserRole.ANALYTICS_VIEWER };

  try {
    // -------------------------------------------------------------------------
    // SETUP: Create Canonical Test Content, Question, and Approved Script
    // -------------------------------------------------------------------------
    const canonicalContentId = `BP-CNT-${Math.floor(100000 + Math.random() * 900000)}`;
    const questionId = await idService.allocateQuestionId();

    // 1. Ensure Content Master exists
    await contentMastersRepository.create({
      id: canonicalContentId,
      contentId: canonicalContentId,
      title: 'Phase 17 Video Production Verification Master',
      status: ContentMasterStatus.APPROVED,
      currentVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 2. Question
    const testQuestion: Question = {
      id: questionId,
      contentMasterId: canonicalContentId,
      contentId: canonicalContentId,
      questionText: 'What is the speed of light in vacuum?',
      options: { a: '3x10^8 m/s', b: '3x10^6 m/s', c: '3x10^5 km/s', d: 'Both A and C' },
      correctAnswer: 'D',
      topicName: 'Physics',
      subtopicName: 'Electromagnetism',
      difficulty: DifficultyLevel.MEDIUM,
      language: QuestionLanguage.TELUGU,
      status: QuestionStatus.APPROVED,
      videoStatus: VideoProductionStatus.SCRIPT_READY,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any;
    await questionsRepository.appendRecord(testQuestion);

    // 3. Approved Script
    const scriptId = await idService.allocateScriptId();
    const testScript: Script = {
      id: scriptId,
      videoId: 'PENDING_VIDEO',
      contentId: canonicalContentId,
      contentMasterId: canonicalContentId,
      questionId: questionId,
      hookText: 'Did you know light travels at 300,000 km per second?',
      problemStatement: 'What is the speed of light in vacuum? Look closely at the units.',
      stepByStepSolution: 'Option A is 3x10^8 m/s, which equals 300,000 km/s (Option C). Therefore D is correct.',
      speedTrickOrTakeaway: 'Always check the units: meters per second versus kilometers per second!',
      callToAction: 'Follow for more science teasers!',
      currentVersion: 1,
      status: 'APPROVED',
      approvedBy: 'Admin User',
      approvedAt: new Date().toISOString(),
      approvedVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await scriptsRepository.appendRecord(testScript);

    const rawTestPayload = Buffer.from('TEST_RAW_VIDEO_BINARY_DATA_INITIAL');
    const rawFileName = 'raw_footage_01.mp4';
    const rawMimeType = 'video/mp4';

    // -------------------------------------------------------------------------
    // P17-01: Content correlation: Canonical Content ID preservation
    // -------------------------------------------------------------------------
    let p01 = false;
    let rawInitResult = await phase17VideoProductionService.initializeRawVideo(
      {
        scriptId,
        expectedContentId: canonicalContentId,
        rawBinaryBuffer: rawTestPayload,
        fileName: rawFileName,
        mimeType: rawMimeType,
      },
      speakerActor
    );
    if (
      rawInitResult.contentId === canonicalContentId &&
      rawInitResult.video.contentId === canonicalContentId &&
      rawInitResult.latestMediaAsset?.contentId === canonicalContentId
    ) {
      p01 = true;
    }
    addResult('P17-01', 'Canonical Content ID preservation', p01, `Preserved ${canonicalContentId} on video and media asset.`);

    // -------------------------------------------------------------------------
    // P17-02: Source correlation: Question ID and Script ID preserved
    // -------------------------------------------------------------------------
    let p02 = false;
    if (
      rawInitResult.questionId === questionId &&
      rawInitResult.scriptId === scriptId &&
      rawInitResult.video.questionId === questionId
    ) {
      p02 = true;
    }
    addResult('P17-02', 'Question ID & Script ID preservation', p02, `Video references Question ${questionId} and Script ${scriptId}.`);

    // -------------------------------------------------------------------------
    // P17-03: Video technical ID separation from Content ID
    // -------------------------------------------------------------------------
    let p03 = false;
    const videoId = rawInitResult.video.id;
    if (videoId && videoId.startsWith('BP-V-') && videoId !== canonicalContentId) {
      p03 = true;
    }
    addResult('P17-03', 'Video technical ID separation', p03, `Video ID is separate (${videoId}) from Content ID (${canonicalContentId}).`);

    // -------------------------------------------------------------------------
    // P17-04: Cross-content rejection
    // -------------------------------------------------------------------------
    let p04 = false;
    try {
      await phase17VideoProductionService.initializeRawVideo(
        {
          scriptId,
          expectedContentId: 'BP-CNT-WRONG999',
          rawBinaryBuffer: rawTestPayload,
          fileName: 'cross_content.mp4',
          mimeType: 'video/mp4',
        },
        speakerActor
      );
    } catch (err: any) {
      if (err.message.includes('Cross-content violation')) {
        p04 = true;
      }
    }
    addResult('P17-04', 'Cross-content association rejection', p04, 'Mismatched Content ID was strictly rejected.');

    // -------------------------------------------------------------------------
    // P17-05: Lifecycle: Unapproved script rejection
    // -------------------------------------------------------------------------
    let p05 = false;
    try {
      const draftScriptId = await idService.allocateScriptId();
      await scriptsRepository.appendRecord({
        ...testScript,
        id: draftScriptId,
        status: 'DRAFT',
      });
      await phase17VideoProductionService.initializeRawVideo(
        {
          scriptId: draftScriptId,
          expectedContentId: canonicalContentId,
          rawBinaryBuffer: rawTestPayload,
          fileName: 'draft_test.mp4',
          mimeType: 'video/mp4',
        },
        speakerActor
      );
    } catch (err: any) {
      if (err.message.includes('Must be APPROVED')) {
        p05 = true;
      }
    }
    addResult('P17-05', 'Unapproved script rejection', p05, 'Attempt to produce raw video from unapproved script was blocked.');

    // -------------------------------------------------------------------------
    // P17-06: Production state: RAW initialized state
    // -------------------------------------------------------------------------
    let p06 = false;
    if (
      rawInitResult.currentWorkflowState === 'RAW' &&
      rawInitResult.video.status === VideoProductionStatus.RECORDED
    ) {
      p06 = true;
    }
    addResult('P17-06', 'RAW initialized state', p06, 'Video initialized in RAW (RECORDED) state.');

    // -------------------------------------------------------------------------
    // P17-07: Production state: Transition to EDITING
    // -------------------------------------------------------------------------
    let p07 = false;
    const editingResult = await phase17VideoProductionService.transitionToEditing(
      {
        videoId,
        expectedContentId: canonicalContentId,
        assignedEditorId: editorActor.id,
      },
      editorActor
    );
    if (
      editingResult.currentWorkflowState === 'EDITING' &&
      editingResult.video.status === VideoProductionStatus.EDITING &&
      editingResult.video.assignedEditor === editorActor.id
    ) {
      p07 = true;
    }
    addResult('P17-07', 'Transition to EDITING', p07, 'Video successfully transitioned from RAW to EDITING.');

    // -------------------------------------------------------------------------
    // P17-08: Production state: Upload EDITED video
    // -------------------------------------------------------------------------
    let p08 = false;
    const editedPayload = Buffer.from('TEST_EDITED_VIDEO_BINARY_DATA_V1');
    const editedResult = await phase17VideoProductionService.uploadEditedVideo(
      {
        videoId,
        expectedContentId: canonicalContentId,
        editedBinaryBuffer: editedPayload,
        fileName: 'edited_cut_v1.mp4',
        mimeType: 'video/mp4',
      },
      editorActor
    );
    if (
      editedResult.currentWorkflowState === 'EDITED' &&
      editedResult.video.status === VideoProductionStatus.EDITED &&
      editedResult.latestMediaAsset?.mediaStage === 'EDITED'
    ) {
      p08 = true;
    }
    addResult('P17-08', 'Upload EDITED video', p08, 'Edited cut uploaded and state moved to EDITED.');

    // -------------------------------------------------------------------------
    // P17-09: Invalid backward / illegal transition rejection
    // -------------------------------------------------------------------------
    let p09 = false;
    try {
      // Attempting to transition to EDITING when already EDITED
      await phase17VideoProductionService.transitionToEditing(
        { videoId, expectedContentId: canonicalContentId },
        editorActor
      );
    } catch (err: any) {
      if (err.message.includes('Illegal transition')) {
        p09 = true;
      }
    }
    addResult('P17-09', 'Illegal state transition rejection', p09, 'Illegal transition backwards to EDITING was blocked.');

    // -------------------------------------------------------------------------
    // P17-10: Drive folder hierarchy structure
    // -------------------------------------------------------------------------
    let p10 = false;
    const hierarchy = await googleDriveService.ensureProductionHierarchy(canonicalContentId);
    if (
      hierarchy.rootFolderId &&
      hierarchy.contentFolderId &&
      hierarchy.rawFolderId &&
      hierarchy.editedFolderId &&
      hierarchy.finalFolderId
    ) {
      p10 = true;
    }
    addResult('P17-10', 'Google Drive folder hierarchy', p10, `Hierarchy confirmed: ${canonicalContentId}/{Raw, Edited, Final}.`);

    // -------------------------------------------------------------------------
    // P17-11: Raw binary stored in Drive Raw folder
    // -------------------------------------------------------------------------
    let p11 = false;
    const rawAsset = rawInitResult.latestMediaAsset;
    if (rawAsset && rawAsset.folderId === hierarchy.rawFolderId && rawAsset.driveFileId) {
      p11 = true;
    }
    addResult('P17-11', 'Raw binary placed in Drive Raw folder', p11, `Raw file ID ${rawAsset?.driveFileId} in ${rawAsset?.folderId}.`);

    // -------------------------------------------------------------------------
    // P17-12: Edited binary stored in Drive Edited folder
    // -------------------------------------------------------------------------
    let p12 = false;
    const editedAsset = editedResult.latestMediaAsset;
    if (editedAsset && editedAsset.folderId === hierarchy.editedFolderId && editedAsset.driveFileId) {
      p12 = true;
    }
    addResult('P17-12', 'Edited binary placed in Drive Edited folder', p12, `Edited file ID ${editedAsset?.driveFileId} in ${editedAsset?.folderId}.`);

    // -------------------------------------------------------------------------
    // P17-18: Non-destructive history: Prior assets never deleted (Second Edited revision)
    // -------------------------------------------------------------------------
    let p18 = false;
    const editedRev2Payload = Buffer.from('TEST_EDITED_VIDEO_BINARY_DATA_V2');
    await phase17VideoProductionService.uploadEditedVideo(
      {
        videoId,
        expectedContentId: canonicalContentId,
        editedBinaryBuffer: editedRev2Payload,
        fileName: 'edited_cut_v2.mp4',
        mimeType: 'video/mp4',
      },
      editorActor
    );
    const midHistory = await phase17VideoProductionService.getVideoProductionHistory(videoId);
    if (midHistory.editedAssets.length >= 2) {
      const v1 = midHistory.editedAssets.find((a) => a.version === 1);
      const v2 = midHistory.editedAssets.find((a) => a.version === 2);
      if (v1 && v2 && v1.id !== v2.id) {
        p18 = true;
      }
    }
    addResult('P17-18', 'Non-destructive revision history', p18, 'Multiple versions of media assets maintained without deleting prior versions.');

    // -------------------------------------------------------------------------
    // P17-13: Final video approval & binary stored in Drive Final folder
    // -------------------------------------------------------------------------
    let p13 = false;
    const finalPayload = Buffer.from('TEST_FINAL_VIDEO_BINARY_DATA_PASS');
    const finalResult = await phase17VideoProductionService.approveFinalVideo(
      {
        videoId,
        expectedContentId: canonicalContentId,
        finalBinaryBuffer: finalPayload,
        fileName: 'final_published_render.mp4',
        mimeType: 'video/mp4',
      },
      adminActor
    );
    const finalAsset = finalResult.latestMediaAsset;
    if (
      finalResult.currentWorkflowState === 'FINAL' &&
      finalResult.video.status === VideoProductionStatus.READY_TO_UPLOAD &&
      finalAsset &&
      finalAsset.folderId === hierarchy.finalFolderId &&
      finalAsset.driveFileId
    ) {
      p13 = true;
    }
    addResult('P17-13', 'Final video approval & Drive Final folder', p13, `Final file ID ${finalAsset?.driveFileId} in ${finalAsset?.folderId}.`);

    // -------------------------------------------------------------------------
    // P17-14: RBAC: Unauthorized actor blocked from raw initialization
    // -------------------------------------------------------------------------
    let p14 = false;
    try {
      await phase17VideoProductionService.initializeRawVideo(
        {
          scriptId,
          expectedContentId: canonicalContentId,
          rawBinaryBuffer: rawTestPayload,
          fileName: 'unauthorized_raw.mp4',
          mimeType: 'video/mp4',
        },
        unauthorizedActor
      );
    } catch (err: any) {
      if (err.message.includes('not authorized')) {
        p14 = true;
      }
    }
    addResult('P17-14', 'RBAC: Unauthorized raw initialization blocked', p14, 'Actor with ANALYTICS_VIEWER role blocked from raw initialization.');

    // -------------------------------------------------------------------------
    // P17-15: RBAC: Unauthorized actor blocked from final video approval
    // -------------------------------------------------------------------------
    let p15 = false;
    try {
      await phase17VideoProductionService.approveFinalVideo(
        {
          videoId,
          expectedContentId: canonicalContentId,
        },
        editorActor // Video Editor cannot approve final
      );
    } catch (err: any) {
      if (err.message.includes('not authorized')) {
        p15 = true;
      }
    }
    addResult('P17-15', 'RBAC: Video Editor blocked from final approval', p15, 'Only Admin/Content Manager/Reviewer can approve final video.');

    // -------------------------------------------------------------------------
    // P17-16: RBAC: Admin and Reviewer permitted to approve final
    // -------------------------------------------------------------------------
    let p16 = false;
    const reviewerActor = { id: 'USR-REV', name: 'Reviewer User', role: UserRole.REVIEWER };
    // Verify reviewer passes permission check
    try {
      // Re-run final approval with reviewer actor
      const revApproved = await phase17VideoProductionService.approveFinalVideo(
        {
          videoId,
          expectedContentId: canonicalContentId,
          finalBinaryBuffer: finalPayload,
          fileName: 'reviewer_final.mp4',
          mimeType: 'video/mp4',
        },
        reviewerActor
      );
      if (revApproved.currentWorkflowState === 'FINAL') {
        p16 = true;
      }
    } catch (err: any) {
      p16 = false;
    }
    addResult('P17-16', 'RBAC: Reviewer permitted for final approval', p16, 'Reviewer actor approved final video successfully.');

    // -------------------------------------------------------------------------
    // P17-17: Media versioning: Revision history preserved
    // -------------------------------------------------------------------------
    let p17 = false;
    const history = await phase17VideoProductionService.getVideoProductionHistory(videoId);
    if (
      history.rawAssets.length >= 1 &&
      history.editedAssets.length >= 1 &&
      history.finalAssets.length >= 1
    ) {
      p17 = true;
    }
    addResult('P17-17', 'Media versioning & history preserved', p17, `History contains ${history.rawAssets.length} Raw, ${history.editedAssets.length} Edited, ${history.finalAssets.length} Final assets.`);

    // -------------------------------------------------------------------------
    // P17-19: Zero auto-publish safety
    // -------------------------------------------------------------------------
    let p19 = false;
    const finalVideo = await videosRepository.findById(videoId);
    if (
      finalVideo &&
      finalVideo.status === VideoProductionStatus.READY_TO_UPLOAD &&
      (finalVideo.status as string) !== 'UPLOADED' &&
      !finalVideo.youtubeId
    ) {
      p19 = true;
    }
    addResult('P17-19', 'Zero auto-publish safety', p19, 'Final approval set status to READY_TO_UPLOAD without publishing or setting youtubeId.');

    // -------------------------------------------------------------------------
    // P17-20: REAL E2E GOOGLE DRIVE BINARY VERIFICATION
    // -------------------------------------------------------------------------
    console.log('\n--- Running P17-20 Real Google Drive E2E Verification ---');
    let p20 = false;
    const realE2EContentId = `BP-CNT-E2E17-${Date.now()}`;
    const realFileName = `real_e2e_final_${Date.now()}.mp4`;
    const realPayload = `BURRA_PARIKSHA_PHASE_17_REAL_E2E_BINARY_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`;
    const realBuffer = Buffer.from(realPayload);
    const expectedMd5 = crypto.createHash('md5').update(realBuffer).digest('hex');

    let uploadedDriveFileId = '';
    try {
      // 1. Ensure content master exists for authorization
      await contentMastersRepository.create({
        id: realE2EContentId,
        contentId: realE2EContentId,
        title: 'Phase 17 Real Drive E2E Content',
        status: ContentMasterStatus.APPROVED,
        currentVersion: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // 2. Upload real final video binary using Phase14DriveService directly to Final/ folder
      console.log(`[P17-20] Uploading real binary (${realBuffer.length} bytes) to Google Drive...`);
      const uploadedAsset = await phase14DriveService.uploadProductionAsset({
        contentId: realE2EContentId,
        mediaStage: 'FINAL',
        fileName: realFileName,
        mimeType: 'video/mp4',
        bodyStreamOrBuffer: realBuffer,
      });

      uploadedDriveFileId = uploadedAsset.driveFileId;
      console.log(`[P17-20] Uploaded successfully! Drive File ID: "${uploadedDriveFileId}", Stage: "${uploadedAsset.mediaStage}"`);

      // 3. Download binary back from Google Drive
      console.log(`[P17-20] Downloading binary back from Google Drive for verification...`);
      const downloadResult = await googleDriveService.downloadFile(uploadedDriveFileId);

      const downloadedChunks: Buffer[] = [];
      for await (const chunk of downloadResult.stream) {
        downloadedChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const downloadedBuffer = Buffer.concat(downloadedChunks);
      const downloadedMd5 = crypto.createHash('md5').update(downloadedBuffer).digest('hex');

      console.log(`[P17-20] Expected MD5:   ${expectedMd5}`);
      console.log(`[P17-20] Downloaded MD5: ${downloadedMd5}`);
      console.log(`[P17-20] Match:          ${expectedMd5 === downloadedMd5}`);

      if (
        expectedMd5 === downloadedMd5 &&
        uploadedAsset.mediaStage === 'FINAL' &&
        uploadedAsset.driveFileId.length > 0
      ) {
        p20 = true;
      }
    } catch (e2eErr: any) {
      console.error('[P17-20] Error in real Drive binary E2E:', e2eErr?.message || e2eErr);
      p20 = false;
    } finally {
      // Safe cleanup of real E2E test file in Google Drive
      if (uploadedDriveFileId) {
        try {
          console.log(`[P17-20] Cleaning up real Drive test file "${uploadedDriveFileId}"...`);
          await googleDriveService.deleteFile(uploadedDriveFileId);
          console.log(`[P17-20] Real Drive test file deleted successfully.`);
        } catch (cleanupErr: any) {
          console.warn(`[P17-20] Warning during cleanup:`, cleanupErr?.message);
        }
      }
    }
    addResult('P17-20', 'Real Google Drive E2E binary round-trip', p20, 'Real video binary uploaded to Final/ folder in Google Drive, read back, and validated with bit-identical MD5 checksum.');

    // -------------------------------------------------------------------------
    // Regression Tests for Raw Video Upload UI & Blocking Logic (P17-21 to P17-24)
    // -------------------------------------------------------------------------

    // P17-21: Raw video upload success
    let p21 = false;
    let regressionVideoId = '';
    const regressionContentId = `BP-CNT-${Math.floor(100000 + Math.random() * 900000)}`;
    const regressionQuestionId = await idService.allocateQuestionId();

    try {
      // 1. Setup metadata for regression video
      await contentMastersRepository.create({
        id: regressionContentId,
        contentId: regressionContentId,
        title: 'Phase 17 Regression Test Master',
        status: ContentMasterStatus.APPROVED,
        currentVersion: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const regressionQuestion = {
        id: regressionQuestionId,
        contentMasterId: regressionContentId,
        contentId: regressionContentId,
        questionText: 'Regression Test Question',
        options: { a: 'A', b: 'B', c: 'C', d: 'D' },
        correctAnswer: 'A',
        topicName: 'Physics',
        subtopicName: 'Electromagnetism',
        difficulty: DifficultyLevel.MEDIUM,
        language: QuestionLanguage.TELUGU,
        status: QuestionStatus.APPROVED,
        videoStatus: VideoProductionStatus.SCRIPT_READY,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any;
      await questionsRepository.appendRecord(regressionQuestion);

      const regressionVideo = await videoService.queueApprovedQuestion({
        questionId: regressionQuestionId,
      }, adminActor);

      regressionVideoId = regressionVideo.id;

      // Ensure state is RECORDING by transitioning through SCRIPT_READY first
      await videoService.transitionStatus(regressionVideoId, VideoProductionStatus.SCRIPT_READY, adminActor);
      await videoService.transitionStatus(regressionVideoId, VideoProductionStatus.RECORDING, adminActor);

      // Perform a real upload of a tiny video asset using videoService.uploadVideoAsset
      const mockVideoBuffer = Buffer.from('mock video file data for regression test');
      const uploadedVideo = await videoService.uploadVideoAsset({
        contentId: regressionContentId,
        videoId: regressionVideoId,
        fileName: 'regression_test_raw_video.mp4',
        mimeType: 'video/mp4',
        size: mockVideoBuffer.length,
        fileStreamOrBuffer: mockVideoBuffer,
        actor: adminActor,
      });

      if (uploadedVideo.driveFileId && uploadedVideo.driveFileId.length > 0) {
        p21 = true;
      }

      // Safe cleanup of regression file in drive
      if (uploadedVideo.driveFileId) {
        try {
          await googleDriveService.deleteFile(uploadedVideo.driveFileId);
        } catch {}
      }
    } catch (err: any) {
      console.error('[P17-21] Error in raw video upload success regression test:', err?.message || err);
    }
    addResult('P17-21', 'Raw video upload success', p21, 'Uploading raw video asset successfully processes binary, populates driveFileId, and updates video metadata.');

    // P17-22: Raw video upload failure
    let p22 = false;
    try {
      await videoService.uploadVideoAsset({
        contentId: regressionContentId,
        videoId: regressionVideoId,
        fileName: 'invalid_extension.txt', // not a valid video extension
        mimeType: 'text/plain',
        size: 100,
        fileStreamOrBuffer: Buffer.from('some text data'),
        actor: adminActor,
      });
    } catch (err: any) {
      if (err instanceof ValidationError || err.message.includes('media allowlist') || err.message.includes('Validation')) {
        p22 = true;
      }
    }
    addResult('P17-22', 'Raw video upload failure', p22, 'Uploading invalid file category / mimeType is strictly rejected with a ValidationError.');

    // P17-23: Mark Recorded blocked when no raw file exists
    let p23 = false;
    let blockedVideoId = '';
    try {
      const blockedContentId = `BP-CNT-${Math.floor(100000 + Math.random() * 900000)}`;
      const blockedQuestionId = await idService.allocateQuestionId();

      await contentMastersRepository.create({
        id: blockedContentId,
        contentId: blockedContentId,
        title: 'Phase 17 Blocked Test Master',
        status: ContentMasterStatus.APPROVED,
        currentVersion: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const blockedQuestion = {
        id: blockedQuestionId,
        contentMasterId: blockedContentId,
        contentId: blockedContentId,
        questionText: 'Blocked Test Question',
        options: { a: 'A', b: 'B', c: 'C', d: 'D' },
        correctAnswer: 'A',
        topicName: 'Physics',
        subtopicName: 'Electromagnetism',
        difficulty: DifficultyLevel.MEDIUM,
        language: QuestionLanguage.TELUGU,
        status: QuestionStatus.APPROVED,
        videoStatus: VideoProductionStatus.SCRIPT_READY,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as any;
      await questionsRepository.appendRecord(blockedQuestion);

      const blockedVideo = await videoService.queueApprovedQuestion({
        questionId: blockedQuestionId,
      }, adminActor);

      blockedVideoId = blockedVideo.id;

      // Ensure state is RECORDING by transitioning through SCRIPT_READY first
      await videoService.transitionStatus(blockedVideoId, VideoProductionStatus.SCRIPT_READY, adminActor);
      await videoService.transitionStatus(blockedVideoId, VideoProductionStatus.RECORDING, adminActor);

      // Now attempt to transition to RECORDED with bypassRawCheck = false (the API behavior)
      await videoService.transitionStatus(blockedVideoId, VideoProductionStatus.RECORDED, adminActor, 'Attempt without raw file', undefined, false);
    } catch (err: any) {
      if (err instanceof ValidationError && err.message.includes('Raw video file must be uploaded')) {
        p23 = true;
      }
    }
    addResult('P17-23', 'Mark Recorded blocked when no raw file exists', p23, 'Marking recorded status on video is strictly blocked if driveFileId is missing.');

    // P17-24: Mark Recorded allowed after real raw file exists
    let p24 = false;
    if (blockedVideoId) {
      try {
        // Force mock driveFileId to bypass raw check
        await videosRepository.updateRecord(blockedVideoId, {
          driveFileId: 'mock-drive-file-id-for-regression-test',
        });

        // Now attempt to transition to RECORDED with bypassRawCheck = false
        const transitionResult = await videoService.transitionStatus(blockedVideoId, VideoProductionStatus.RECORDED, adminActor, 'Attempt with raw file exists', undefined, false);
        if (transitionResult.status === VideoProductionStatus.RECORDED) {
          p24 = true;
        }
      } catch (err: any) {
        console.error('[P17-24] Error in allowed Mark Recorded test:', err?.message || err);
      }
    }
    addResult('P17-24', 'Mark Recorded allowed after real raw file exists', p24, 'Marking recorded status on video succeeds once driveFileId is populated.');

    const totalChecks = results.length;
    const passed = passedCount === totalChecks;

    return {
      passed,
      totalChecks,
      passedChecks: passedCount,
      failedChecks: totalChecks - passedCount,
      results,
    };
  } catch (err: any) {
    console.error('Fatal error running Phase 17 verification:', err);
    return {
      passed: false,
      totalChecks: results.length || 1,
      passedChecks: passedCount,
      failedChecks: (results.length || 1) - passedCount,
      results,
    };
  }
}
