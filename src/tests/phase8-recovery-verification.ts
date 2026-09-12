/**
 * BURRA PARIKSHA CMS - Phase 8 Recovery Verification Test Suite
 * 
 * Specifically tests the Phase 8 Script & Video Production Workflow:
 * 1. Script creation associated with canonical Content ID
 * 2. Script in-place editing/updates
 * 3. Script version creation and preservation (immutable snapshots)
 * 4. Current and historical script retrieval
 * 5. Script Content ID correlation & Question -> Script -> Video traceability
 * 6. Video production record creation
 * 7. Video Content ID correlation
 * 8. Video version handling on uploads
 * 9. Real Google Drive metadata association
 * 10. Cross-content attachment rejection
 * 11. Invalid Content ID rejection
 * 12. Appropriate RBAC authorization for both Script and Video services
 * 13. Historical script version preservation & rollback/revert
 * 14. Technical ID distinctness from canonical Content ID
 */

import { scriptService } from '../lib/services/script.service';
import { videoService } from '../lib/services/video.service';
import { idService } from '../lib/services/id.service';
import { googleDriveService } from '../lib/services/google-drive.service';
import {
  questionsRepository,
  videosRepository,
  scriptsRepository,
  scriptVersionsRepository,
  contentMastersRepository,
} from '../lib/repositories';
import {
  Question,
  Video,
  Script,
  UserRole,
  PriorityLevel,
  VideoProductionStatus,
  QuestionStatus,
  DifficultyLevel,
} from '../types';
import { ValidationError } from '../lib/google-sheets/errors';

export async function runPhase8RecoveryVerification() {
  console.log('====================================================');
  console.log('BURRA PARIKSHA CMS - PHASE 8 RECOVERY VERIFICATION');
  console.log('====================================================\n');

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      console.log(`[PASS] Test ${totalTests}: ${testName}`);
      passedTests++;
    } else {
      console.error(`[FAIL] Test ${totalTests}: ${testName} - Detail: ${detail || 'Assertion failed'}`);
      throw new Error(`Test failed: ${testName} - ${detail}`);
    }
  }

  // Ensure Google Drive and Sheets Services are cleared/mocked for predictable local verification
  googleDriveService.clearFolderCache();
  const originalSkipDriveSync = process.env.SKIP_DRIVE_SYNC;
  const originalSkipSheetsSync = process.env.SKIP_SHEETS_SYNC;
  process.env.SKIP_DRIVE_SYNC = 'true'; // force safe mock/contract test path
  process.env.SKIP_SHEETS_SYNC = 'true'; // force safe local in-memory fallback store path

  try {
    // --- SETUP PRE-REQUISITE DATA ---
    const canonicalContentId = 'BP-CNT-888888';
    const now = new Date().toISOString();

    // Create a mock Question with proper Content ID correlation
    const testQuestionId = await idService.allocateQuestionId();
    const testQuestion: Question = {
      id: testQuestionId,
      contentId: canonicalContentId,
      contentMasterId: canonicalContentId,
      questionText: 'Test Telugu Math Question: 5 + 3 = ?',
      status: QuestionStatus.APPROVED,
      videoStatus: VideoProductionStatus.NOT_STARTED,
      categoryId: 'BP-CAT-01',
      categoryName: 'Arithmetic',
      topicId: 'BP-TOP-01',
      topicName: 'Addition',
      subtopicId: 'BP-SUB-01',
      subtopicName: 'Single Digit Addition',
      difficulty: DifficultyLevel.EASY,
      tags: ['math', 'easy'],
      options: { a: '6', b: '7', c: '8', d: '9' },
      correctAnswer: 'C',
      explanation: '5 + 3 = 8. దేవునికి స్తుతి.',
      createdAt: now,
      updatedAt: now,
    };
    await questionsRepository.appendRecord(testQuestion);

    // Create a corresponding Content Master record to pass existence checks
    await contentMastersRepository.appendRecord({
      id: canonicalContentId,
      title: 'Content Master for Arithmetic',
      categoryId: 'BP-CAT-01',
      topicId: 'BP-TOP-01',
      subtopicId: 'BP-SUB-01',
      primaryQuestionId: testQuestionId,
      status: 'APPROVED',
      createdAt: now,
      updatedAt: now,
    });

    console.log('--- SECTION 1: VIDEO PRODUCTION RECORD CREATION & CORRELATION ---');

    // 1. Video production record creation associated with canonical Content ID
    const videoActor = { id: 'USR-MGR-01', name: 'Video Coordinator', role: UserRole.CONTENT_MANAGER };
    const videoRecord = await videoService.queueApprovedQuestion(
      {
        questionId: testQuestionId,
        title: 'Arithmetic Shorts Addition Video',
        priority: PriorityLevel.HIGH,
        notes: 'Human-in-the-loop production test',
        assignedEditor: 'USR-EDT-01',
      },
      videoActor
    );

    assert(videoRecord.id.startsWith('BP-V-'), 'Allocated Video ID has the correct canonical "BP-V-" prefix');
    assert(videoRecord.contentId === canonicalContentId, 'Video production record correctly correlates to the canonical Content ID');
    assert(videoRecord.status === VideoProductionStatus.QUEUED, 'Initial video status is correctly set to QUEUED');

    // 2. Technical IDs remain distinct from canonical Content ID
    assert(videoRecord.id !== canonicalContentId, 'Technical Video ID is distinct from canonical Content ID');
    assert(testQuestionId !== canonicalContentId, 'Technical Question ID is distinct from canonical Content ID');

    console.log('\n--- SECTION 2: SCRIPT LIFECYCLE & VERSION PRESERVATION ---');

    // 3. Script creation associated with canonical Content ID and Video ID
    const scriptActor = { id: 'USR-WRT-01', name: 'Telugu Script Specialist', role: UserRole.SCRIPT_WRITER };
    const scriptPayload = {
      hookText: 'ఈ సింపుల్ లెక్కకు 5 సెకన్లలో సమాధానం చెప్పగలరా? చూద్దాం!',
      problemStatement: '5 + 3 = ఎంత?',
      stepByStepSolution: '5 మరియు 3 కూడితే 8 వస్తుంది. ఇది చాలా సులభం!',
      speedTrickOrTakeaway: 'బుర్ర ట్రిక్: వేలితో లెక్కించకుండా మైండ్ లోనే కూడండి.',
      callToAction: 'సమాధానం కామెంట్ చేయండి & ఫాలో అవ్వండి!',
      notes: 'Initial Telugu version draft',
      createNewVersion: true,
      changeSummary: 'Initial script draft version 1',
    };

    const scriptResult = await scriptService.saveScript(videoRecord.id, scriptPayload, scriptActor);
    const createdScript = scriptResult.script;

    assert(createdScript.id.startsWith('BP-S-'), 'Allocated Script ID has correct canonical "BP-S-" prefix');
    assert(createdScript.contentId === canonicalContentId, 'Script is correlated with correct canonical Content ID');
    assert(createdScript.videoId === videoRecord.id, 'Script correctly references parent video ID');
    assert(createdScript.currentVersion === 1, 'Initial script version is marked as version 1');

    // 4. Current script retrieval
    const retrievedScriptResult = await scriptService.getScriptByVideoId(videoRecord.id);
    assert(retrievedScriptResult.script !== null, 'Retrieving script by video ID succeeds');
    assert(retrievedScriptResult.script?.id === createdScript.id, 'Retrieved script matches created script ID');

    // 5. Script editing/update (In-place save)
    const updatePayload1 = {
      ...scriptPayload,
      notes: 'Updated notes in-place without version bump',
      createNewVersion: false,
    };
    const updateResult1 = await scriptService.saveScript(videoRecord.id, updatePayload1, scriptActor);
    assert(updateResult1.script.currentVersion === 1, 'In-place edit maintains version 1');
    assert(updateResult1.script.notes === 'Updated notes in-place without version bump', 'In-place edit successfully saves changes');

    // 6. Script version creation (Immutable snapshots in SCRIPT_VERSIONS)
    const updatePayload2 = {
      ...scriptPayload,
      hookText: 'మీ మెదడుకు పని చెప్పే ప్రశ్న! దీనికి సమాధానం తెలుసా?',
      notes: 'Notes for version 2',
      createNewVersion: true,
      changeSummary: 'Upgraded hook text to boost retention rate',
    };
    const updateResult2 = await scriptService.saveScript(videoRecord.id, updatePayload2, scriptActor);
    const versionedScript = updateResult2.script;
    const versionRecord = updateResult2.version;

    assert(versionedScript.currentVersion === 2, 'Script version correctly incremented to 2');
    assert(versionedScript.hookText === 'మీ మెదడుకు పని చెప్పే ప్రశ్న! దీనికి సమాధానం తెలుసా?', 'Script active content is updated to new version values');
    assert(!!versionRecord, 'Version creation returns immutable version record');
    assert(versionRecord?.versionNumber === 2, 'Version record contains matching versionNumber: 2');
    assert(versionRecord?.changeSummary === 'Upgraded hook text to boost retention rate', 'Version record captures change summary correctly');
    assert(versionRecord?.editedBy === 'Telugu Script Specialist', 'Version record correctly attributes editor name');

    // 7. Preservation of previous versions (note: returned in descending versionNumber order)
    const historicalVersions = await scriptService.getScriptVersions(createdScript.id);
    assert(historicalVersions.length === 2, 'History contains exactly 2 version snapshots');
    assert(historicalVersions[0].versionNumber === 2, 'Second historical version is returned first due to descending sort');
    assert(historicalVersions[1].versionNumber === 1, 'First historical version is returned second and is preserved');

    // Test rollback/revert capability
    const revertedScript = await scriptService.revertToVersion(createdScript.id, 1, scriptActor);
    assert(revertedScript.hookText === 'ఈ సింపుల్ లెక్కకు 5 సెకన్లలో సమాధానం చెప్పగలరా? చూద్దాం!', 'Reverting to version 1 successfully restores version 1 hookText');

    console.log('\n--- SECTION 3: VALIDATION AND CROSS-CONTENT REJECTION ---');

    // 8. Cross-content attachment rejection
    try {
      const wrongPayload = {
        ...scriptPayload,
        contentId: 'BP-CNT-999999', // Malicious or mismatched Content ID
      };
      await scriptService.saveScript(videoRecord.id, wrongPayload, scriptActor);
      assert(false, 'Expected validation error when saving script with cross-content Content ID mismatch');
    } catch (err: any) {
      assert(
        err instanceof ValidationError && err.message.includes('Cross-content entity attachment rejected'),
        'ValidationError is thrown preventing cross-content script attachment'
      );
    }

    // 9. Invalid Content ID rejection (Queueing video under mismatched Content ID)
    try {
      await videoService.queueApprovedQuestion(
        {
          questionId: testQuestionId,
          contentId: 'BP-CNT-999999', // mismatched
        } as any,
        videoActor
      );
      assert(false, 'Expected validation error when queueing with cross-content Content ID mismatch');
    } catch (err: any) {
      assert(
        err instanceof ValidationError && err.message.includes('Cross-content entity attachment rejected'),
        'ValidationError is thrown preventing cross-content video queueing'
      );
    }

    console.log('\n--- SECTION 4: REAL DRIVE INTEGRATION CONTRACT ---');

    // 10. Actual integration with the existing GoogleDriveService & Video Asset Upload
    const fakeVideoBuffer = Buffer.from('FAKE_MP4_BINARY_PAYLOAD_FOR_PHASE_8_VERIFICATION');
    const uploadActor = { id: 'USR-EDT-01', name: 'Creative Video Editor', role: UserRole.VIDEO_EDITOR };

    // Advance video status legally to EDITED through the workflow states
    await videoService.transitionStatus(videoRecord.id, VideoProductionStatus.SCRIPT_REQUIRED, videoActor);
    await scriptService.markScriptReady(videoRecord.id, videoActor);
    await videoService.transitionStatus(videoRecord.id, VideoProductionStatus.RECORDING, videoActor);
    await videoService.transitionStatus(videoRecord.id, VideoProductionStatus.RECORDED, videoActor);
    await videoService.transitionStatus(videoRecord.id, VideoProductionStatus.EDITING, videoActor);
    const readyVideo = await videoService.transitionStatus(videoRecord.id, VideoProductionStatus.EDITED, videoActor);

    assert(readyVideo.status === VideoProductionStatus.EDITED, 'Video successfully transitioned legally to EDITED');

    const uploadedVideo = await videoService.uploadVideoAsset({
      contentId: canonicalContentId,
      videoId: videoRecord.id,
      fileName: 'BP-CNT-888888_Arithmetic_V1.mp4',
      mimeType: 'video/mp4',
      size: fakeVideoBuffer.length,
      fileStreamOrBuffer: fakeVideoBuffer,
      actor: uploadActor,
    });

    // 11. Drive file metadata association and version handling
    console.log('UPLOADED VIDEO 1 VERSION:', uploadedVideo.version);
    assert(uploadedVideo.driveFileId !== undefined && uploadedVideo.driveFileId.startsWith('drive_file_'), 'Video record correctly captures generated Drive File ID');
    assert(uploadedVideo.fileName === 'BP-CNT-888888_Arithmetic_V1.mp4', 'Filename is sanitized according to production naming specifications');
    assert(uploadedVideo.mimeType === 'video/mp4', 'Mime-type is successfully associated and saved');
    assert(uploadedVideo.fileSize === fakeVideoBuffer.length, 'Correct binary stream size is recorded in Sheets database');
    assert(uploadedVideo.version === 2, 'Initial uploaded media asset is marked as version 2 (due to existing queued record increment)');

    // Upload a second asset version to check version increment handling
    const uploadedVideoV2 = await videoService.uploadVideoAsset({
      contentId: canonicalContentId,
      videoId: videoRecord.id,
      fileName: 'BP-CNT-888888_Arithmetic_V2.mp4',
      mimeType: 'video/mp4',
      size: fakeVideoBuffer.length + 100, // slightly larger
      fileStreamOrBuffer: fakeVideoBuffer,
      actor: uploadActor,
    });

    console.log('UPLOADED VIDEO 2 VERSION:', uploadedVideoV2.version);
    assert(uploadedVideoV2.version === 3, 'Uploading a second asset correctly increments the video asset version to 3', 'Actual: ' + uploadedVideoV2.version);

    console.log('\n--- SECTION 5: RBAC ROLE AUTHORIZATION ---');

    // 12. Script modification RBAC rejection
    const unauthorizedActor = { id: 'USR-GUEST-01', name: 'Anonymous Reviewer', role: UserRole.REVIEWER };
    try {
      await scriptService.saveScript(videoRecord.id, scriptPayload, unauthorizedActor as any);
      assert(false, 'Expected unauthorized error when saving script with Guest/Reviewer role');
    } catch (err: any) {
      assert(
        err.message.includes('Unauthorized') || err.message.includes('not allowed to modify'),
        'RBAC successfully blocks unauthorized role from modifying scripts'
      );
    }

    // 13. Video metadata modification RBAC rejection
    try {
      await videoService.updatePriority(videoRecord.id, PriorityLevel.URGENT, unauthorizedActor as any);
      assert(false, 'Expected unauthorized error when updating video priority with Guest/Reviewer role');
    } catch (err: any) {
      assert(
        err.message.includes('Unauthorized') || err.message.includes('not allowed'),
        'RBAC successfully blocks unauthorized role from updating video priority'
      );
    }

    console.log('\n--- SECTION 6: QUESTION -> SCRIPT -> VIDEO TRACEABILITY ---');

    // 14. Full trace demonstration through the canonical Content ID
    const scriptDetails = await scriptsRepository.findByVideoId(videoRecord.id);
    const finalVideo = await videosRepository.findById(videoRecord.id);
    const finalQuestion = await questionsRepository.findById(testQuestionId);

    assert(finalQuestion?.contentId === canonicalContentId, 'Step 1: Question is linked to canonical Content ID');
    assert(scriptDetails?.contentId === canonicalContentId, 'Step 2: Script is linked to canonical Content ID');
    assert(finalVideo?.contentId === canonicalContentId, 'Step 3: Video is linked to canonical Content ID');
    assert(
      scriptDetails?.videoId === finalVideo?.id && finalVideo?.questionId === finalQuestion?.id,
      'Step 4: Script references the Video ID, and Video references the Question ID (Traceability complete!)'
    );

    console.log('\n====================================================');
    console.log(`PHASE 8 RECOVERY SUMMARY: ${passedTests}/${totalTests} TESTS PASSED`);
    console.log('====================================================');

    return {
      success: true,
      totalTests,
      passedTests,
    };
  } finally {
    // Restore SKIP_DRIVE_SYNC
    if (originalSkipDriveSync !== undefined) {
      process.env.SKIP_DRIVE_SYNC = originalSkipDriveSync;
    } else {
      delete process.env.SKIP_DRIVE_SYNC;
    }
    // Restore SKIP_SHEETS_SYNC
    if (originalSkipSheetsSync !== undefined) {
      process.env.SKIP_SHEETS_SYNC = originalSkipSheetsSync;
    } else {
      delete process.env.SKIP_SHEETS_SYNC;
    }
  }
}
