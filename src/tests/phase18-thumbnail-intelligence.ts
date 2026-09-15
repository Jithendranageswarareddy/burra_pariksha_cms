/**
 * BURRA PARIKSHA CMS — PHASE 18 VERIFICATION SUITE
 * 
 * Verifies P18-01 through P18-21:
 * 1. Content correlation & canonical ID preservation (P18-01 to P18-04)
 * 2. AI thumbnail intelligence & safety validation (P18-05 to P18-07)
 * 3. Candidate separation & human workflow lifecycle (P18-08 to P18-10)
 * 4. Review, approval & rejection state machine (P18-11 to P18-14)
 * 5. RBAC enforcement & sheets synchronization (P18-15, P18-16)
 * 6. Drive MIME/size validation & real storage (P18-17 to P18-19)
 * 7. AI fallback safety & real Google Drive E2E round-trip (P18-20, P18-21)
 */

import crypto from 'crypto';
import { questionsRepository } from '../lib/repositories/questions.repository';
import { scriptsRepository } from '../lib/repositories/scripts.repository';
import { videosRepository } from '../lib/repositories/videos.repository';
import { mediaAssetsRepository } from '../lib/repositories/media-assets.repository';
import { contentMastersRepository } from '../lib/repositories/content-masters.repository';
import { thumbnailsRepository } from '../lib/repositories/thumbnails.repository';
import { thumbnailCandidatesRepository } from '../lib/repositories/thumbnail-candidates.repository';
import { phase18ThumbnailIntelligenceService } from '../lib/services/phase18-thumbnail-intelligence.service';
import { phase14DriveService } from '../lib/services/phase14-drive.service';
import { googleDriveService } from '../lib/services/google-drive.service';
import { geminiService } from '../lib/ai/gemini.service';
import { ThumbnailSafetyValidator } from '../lib/validators/thumbnail-safety.validator';
import { idService } from '../lib/services/id.service';
import {
  Question,
  DifficultyLevel,
  QuestionLanguage,
  QuestionStatus,
  UserRole,
  Script,
  Video,
  VideoProductionStatus,
  ContentMasterStatus,
} from '../types';

export interface VerificationResult {
  code: string;
  check: string;
  status: 'PASS' | 'FAIL';
  details: string;
}

export async function runPhase18Verification(): Promise<{
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
  const managerActor = { id: 'USR-MGR', name: 'Content Manager', role: UserRole.CONTENT_MANAGER };
  const designerActor = { id: 'USR-DSGN', name: 'Thumbnail Designer', role: UserRole.THUMBNAIL_DESIGNER };
  const reviewerActor = { id: 'USR-REV', name: 'Reviewer User', role: UserRole.REVIEWER };
  const unauthorizedActor = { id: 'USR-VIEWER', name: 'Viewer User', role: UserRole.ANALYTICS_VIEWER };

  try {
    // -------------------------------------------------------------------------
    // SETUP: Create Canonical Content Master, Question, Script, and Video
    // -------------------------------------------------------------------------
    const canonicalContentId = `BP-CNT-${Math.floor(100000 + Math.random() * 900000)}`;
    const questionId = await idService.allocateQuestionId();
    const scriptId = await idService.allocateScriptId();
    const videoId = `BP-V-${canonicalContentId.replace(/^BP-CNT-/, '')}`;

    // 1. Content Master
    await contentMastersRepository.create({
      id: canonicalContentId,
      contentId: canonicalContentId,
      title: 'Phase 18 Thumbnail Intelligence Master Test',
      status: ContentMasterStatus.APPROVED,
      primaryQuestionId: questionId,
      currentVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 2. Question
    const testQuestion: Question = {
      id: questionId,
      contentMasterId: canonicalContentId,
      contentId: canonicalContentId,
      questionText: 'Which planet has the highest surface gravity?',
      options: { a: 'Mars', b: 'Earth', c: 'Jupiter', d: 'Venus' },
      correctAnswer: 'C',
      topicName: 'Astronomy',
      subtopicName: 'Solar System',
      difficulty: DifficultyLevel.MEDIUM,
      language: QuestionLanguage.TELUGU,
      status: QuestionStatus.APPROVED,
      videoStatus: VideoProductionStatus.READY_TO_UPLOAD,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any;
    await questionsRepository.appendRecord(testQuestion);

    // 3. Script
    const testScript: Script = {
      id: scriptId,
      contentId: canonicalContentId,
      contentMasterId: canonicalContentId,
      questionId,
      videoId,
      hookText: 'You think Earth has high gravity? Think again!',
      problemStatement: 'Comparing planetary gravity levels',
      stepByStepSolution: 'Jupiter has 2.4 times Earth gravity.',
      speedTrickOrTakeaway: 'Massive mass means intense gravity.',
      callToAction: 'Follow Burra Pariksha for daily space facts!',
      currentVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await scriptsRepository.appendRecord(testScript);

    // 4. Video
    const testVideo: Video = {
      id: videoId,
      contentId: canonicalContentId,
      contentMasterId: canonicalContentId,
      questionId,
      title: 'Planetary Gravity Challenge',
      status: VideoProductionStatus.READY_TO_UPLOAD,
      priority: 'MEDIUM' as any,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await videosRepository.appendRecord(testVideo);

    // =========================================================================
    // P18-01: Content correlation (BP-CNT-######)
    // =========================================================================
    let p1 = false;
    const generatedCandidates = await phase18ThumbnailIntelligenceService.generateConceptsForContent(
      canonicalContentId,
      designerActor,
      { numberOfVariants: 2 }
    );
    if (
      generatedCandidates.length >= 2 &&
      generatedCandidates.every((c) => c.contentId === canonicalContentId)
    ) {
      p1 = true;
    }
    addResult('P18-01', 'Canonical Content ID correlation preserved', p1, `Generated ${generatedCandidates.length} concepts; all match ${canonicalContentId}`);

    // =========================================================================
    // P18-02: Preserves related Question ID, Script ID, and Video ID
    // =========================================================================
    let p2 = false;
    const candidateA = generatedCandidates[0];
    if (
      candidateA.questionId === questionId &&
      candidateA.scriptId === scriptId &&
      candidateA.videoId === videoId
    ) {
      p2 = true;
    }
    addResult('P18-02', 'Related Question, Script, and Video IDs preserved', p2, `candidate.questionId: ${candidateA.questionId}, scriptId: ${candidateA.scriptId}, videoId: ${candidateA.videoId}`);

    // =========================================================================
    // P18-03: Separate Technical ID Architecture
    // =========================================================================
    let p3 = false;
    const expectedPrefix = `BP-TC-${canonicalContentId.replace(/^BP-CNT-/, '')}`;
    if (
      candidateA.id.startsWith(expectedPrefix) &&
      candidateA.id !== canonicalContentId &&
      !candidateA.id.startsWith('BP-T-')
    ) {
      p3 = true;
    }
    addResult('P18-03', 'Separate technical ID architecture', p3, `Candidate technical ID ${candidateA.id} is distinct from Content ID ${canonicalContentId}`);

    // =========================================================================
    // P18-04: Cross-content rejection
    // =========================================================================
    let p4 = false;
    const otherContentId = 'BP-CNT-999999';
    try {
      await phase18ThumbnailIntelligenceService.updateCandidate(
        candidateA.id,
        { contentId: otherContentId },
        designerActor
      );
      p4 = false;
    } catch (crossErr: any) {
      if (crossErr.message.includes('Cross-content modification rejected')) {
        p4 = true;
      }
    }
    addResult('P18-04', 'Rejection of cross-content associations', p4, 'Attempting to reassign candidate to another Content ID rejected cleanly');

    // =========================================================================
    // P18-05: Structured AI recommendations
    // =========================================================================
    let p5 = false;
    if (
      candidateA.hookHeadline &&
      candidateA.curiosityFraming &&
      candidateA.curiosityFraming.curiosityAngle &&
      candidateA.visualDirection &&
      candidateA.visualDirection.composition &&
      candidateA.visualDirection.colorPalette &&
      candidateA.audienceTargeting &&
      candidateA.abVariant
    ) {
      p5 = true;
    }
    addResult('P18-05', 'Structured AI recommendation outputs', p5, `Concept contains hookHeadline ("${candidateA.hookHeadline}"), curiosity, visual, and audience targeting`);

    // =========================================================================
    // P18-06: Editorial Safety — Answer Leakage Detection
    // =========================================================================
    let p6 = false;
    const leakingHeadline = 'THE ANSWER IS JUPITER! 🔥';
    const leakageCheck = ThumbnailSafetyValidator.validate(leakingHeadline, testQuestion);
    if (!leakageCheck.isValid && leakageCheck.leaksAnswer) {
      p6 = true;
    }
    addResult('P18-06', 'Answer leakage detection and prevention', p6, `Leaking headline correctly flagged: ${leakageCheck.issues.join(', ')}`);

    // =========================================================================
    // P18-07: Editorial Safety — Mobile Brevity Validation
    // =========================================================================
    let p7 = false;
    const verboseHeadline = 'THIS IS AN EXTREMELY LONG HEADLINE THAT WOULD BE IMPOSSIBLE TO READ ON A MOBILE PHONE SCREEN';
    const brevityCheck = ThumbnailSafetyValidator.validate(verboseHeadline, testQuestion);
    if (!brevityCheck.isValid && !brevityCheck.isConcise) {
      p7 = true;
    }
    addResult('P18-07', 'Mobile brevity and readability validation', p7, `Excessive character count rejected: ${brevityCheck.issues.join(', ')}`);

    // =========================================================================
    // P18-08: Candidate Separation Architecture (AI outputs DRAFT)
    // =========================================================================
    let p8 = false;
    if (candidateA.status === 'DRAFT' && candidateA.isAiGenerated === true) {
      p8 = true;
    }
    addResult('P18-08', 'AI candidate separation (DRAFT state)', p8, `AI candidate instantiated in status: ${candidateA.status}, isAiGenerated: ${candidateA.isAiGenerated}`);

    // =========================================================================
    // P18-09: Human Editability & Version Incrementing
    // =========================================================================
    let p9 = false;
    const updatedCandidate = await phase18ThumbnailIntelligenceService.updateCandidate(
      candidateA.id,
      {
        hookHeadline: 'HEAVIEST GRAVITY? 🪐',
        conceptName: 'Space Mystery Variant A Updated',
      },
      designerActor
    );
    const versionsAfterUpdate = await thumbnailCandidatesRepository.getCandidateVersions(candidateA.id);
    if (
      updatedCandidate.version === 2 &&
      updatedCandidate.hookHeadline === 'HEAVIEST GRAVITY? 🪐' &&
      versionsAfterUpdate.length === 1 &&
      versionsAfterUpdate[0].versionNumber === 2
    ) {
      p9 = true;
    }
    addResult('P18-09', 'Human editability and version history incrementing', p9, `Candidate updated to V${updatedCandidate.version}, snapshot recorded in history`);

    // =========================================================================
    // P18-10: State Invalidation on Edit (Approved -> Draft on edit)
    // =========================================================================
    let p10 = false;
    // Approve candidate first
    await phase18ThumbnailIntelligenceService.submitForReview(candidateA.id, designerActor, reviewerActor.id);
    await phase18ThumbnailIntelligenceService.approveCandidate(candidateA.id, 2, reviewerActor, canonicalContentId);
    let approvedState = await thumbnailCandidatesRepository.findById(candidateA.id);

    if (approvedState?.status === 'APPROVED') {
      // Now edit it as designer
      const invalidated = await phase18ThumbnailIntelligenceService.updateCandidate(
        candidateA.id,
        { hookHeadline: 'NEW MYSTERY REVEALED!' },
        designerActor
      );
      if (
        invalidated.status === 'DRAFT' &&
        invalidated.approvedBy === undefined &&
        invalidated.version === 3
      ) {
        p10 = true;
      }
    }
    addResult('P18-10', 'Approval state invalidation on subsequent edit', p10, 'Editing an approved candidate resets status to DRAFT and clears approval metadata');

    // =========================================================================
    // P18-11: Review Workflow State Machine (DRAFT -> IN_REVIEW)
    // =========================================================================
    let p11 = false;
    const submittedCandidate = await phase18ThumbnailIntelligenceService.submitForReview(
      candidateA.id,
      designerActor,
      reviewerActor.id
    );
    if (
      submittedCandidate.status === 'IN_REVIEW' &&
      submittedCandidate.assignedReviewerId === reviewerActor.id
    ) {
      p11 = true;
    }
    addResult('P18-11', 'Review workflow state machine (DRAFT -> IN_REVIEW)', p11, `Candidate moved to ${submittedCandidate.status}, reviewer assigned: ${submittedCandidate.assignedReviewerId}`);

    // =========================================================================
    // P18-12: Human Approval Workflow (IN_REVIEW -> APPROVED)
    // =========================================================================
    let p12 = false;
    const approvalResult = await phase18ThumbnailIntelligenceService.approveCandidate(
      candidateA.id,
      3, // Current version is 3
      reviewerActor,
      canonicalContentId
    );
    if (
      approvalResult.candidate.status === 'APPROVED' &&
      approvalResult.candidate.approvedBy === reviewerActor.name &&
      approvalResult.candidate.approvedVersion === 3
    ) {
      p12 = true;
    }
    addResult('P18-12', 'Human approval workflow and metadata recording', p12, `Candidate approved by ${approvalResult.candidate.approvedBy} for V${approvalResult.candidate.approvedVersion}`);

    // =========================================================================
    // P18-13: Stale Version Approval Protection
    // =========================================================================
    let p13 = false;
    try {
      await phase18ThumbnailIntelligenceService.approveCandidate(
        candidateA.id,
        99, // Stale version
        reviewerActor,
        canonicalContentId
      );
      p13 = false;
    } catch (staleErr: any) {
      if (staleErr.message.includes('Stale version rejection')) {
        p13 = true;
      }
    }
    addResult('P18-13', 'Stale version approval protection', p13, 'Approval with mismatched version number rejected');

    // =========================================================================
    // P18-14: Human Rejection Workflow with Reason Tracking
    // =========================================================================
    let p14 = false;
    const candidateB = generatedCandidates[1];
    const rejectedCandidate = await phase18ThumbnailIntelligenceService.rejectCandidate(
      candidateB.id,
      'Colors lack contrast for mobile feed prominence',
      reviewerActor
    );
    if (
      rejectedCandidate.status === 'REJECTED' &&
      rejectedCandidate.rejectedReason === 'Colors lack contrast for mobile feed prominence'
    ) {
      p14 = true;
    }
    addResult('P18-14', 'Human rejection workflow with reason tracking', p14, `Candidate B rejected: "${rejectedCandidate.rejectedReason}"`);

    // =========================================================================
    // P18-15: RBAC Role Verification
    // =========================================================================
    let p15 = false;
    try {
      await phase18ThumbnailIntelligenceService.createCandidateManual(
        {
          contentId: canonicalContentId,
          conceptName: 'Unauthorized Proposal',
          hookHeadline: 'DO NOT ALLOW',
        },
        unauthorizedActor as any
      );
      p15 = false;
    } catch (rbacErr: any) {
      if (rbacErr.message.includes('Forbidden') || rbacErr.statusCode === 403) {
        p15 = true;
      }
    }
    addResult('P18-15', 'RBAC role verification rejects unauthorized actor', p15, 'Viewer role blocked from creating or modifying thumbnail candidates');

    // =========================================================================
    // P18-16: Sheets Synchronization
    // =========================================================================
    let p16 = false;
    const technicalThumbnailId = `BP-T-${canonicalContentId.replace(/^BP-CNT-/, '')}`;
    const syncedThumb = await thumbnailsRepository.findById(technicalThumbnailId);
    if (
      syncedThumb &&
      syncedThumb.status === 'APPROVED' &&
      syncedThumb.contentId === canonicalContentId
    ) {
      p16 = true;
    }
    addResult('P18-16', 'Thumbnails sheet synchronization on approval', p16, `Thumbnails sheet record ${syncedThumb?.id} synchronized with status ${syncedThumb?.status}`);

    // =========================================================================
    // P18-17: Google Drive MIME Type & Size Limit Enforcement
    // =========================================================================
    let p17 = false;
    const invalidBuffer = Buffer.from('This is not an image');
    try {
      await phase18ThumbnailIntelligenceService.uploadThumbnailBinary(
        {
          contentId: canonicalContentId,
          fileName: 'invalid.txt',
          mimeType: 'text/plain',
          fileBuffer: invalidBuffer,
        },
        designerActor
      );
      p17 = false;
    } catch (mimeErr: any) {
      if (mimeErr.message.includes('MIME type') || mimeErr.message.includes('image')) {
        p17 = true;
      }
    }
    addResult('P18-17', 'MIME type and size validation enforcement', p17, 'Disallowed MIME types cleanly rejected prior to upload');

    // =========================================================================
    // P18-18: Real Google Drive Binary Storage (Phase 14 Infrastructure)
    // =========================================================================
    let p18 = false;
    const realPngBuffer = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
      0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
      0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
      0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
      0x42, 0x60, 0x82,
    ]);
    const expectedMd5 = crypto.createHash('md5').update(realPngBuffer).digest('hex');

    let uploadResult: any;
    try {
      uploadResult = await phase18ThumbnailIntelligenceService.uploadThumbnailBinary(
        {
          contentId: canonicalContentId,
          fileName: `${canonicalContentId}-thumbnail.png`,
          mimeType: 'image/png',
          fileBuffer: realPngBuffer,
          candidateId: candidateA.id,
          designerNotes: 'Initial production thumbnail binary',
        },
        designerActor
      );
      if (
        uploadResult.mediaAsset &&
        uploadResult.mediaAsset.driveFileId &&
        uploadResult.mediaAsset.mediaStage === 'THUMBNAIL'
      ) {
        p18 = true;
      }
    } catch (uploadErr: any) {
      console.error('Binary upload failed:', uploadErr);
      p18 = false;
    }
    addResult('P18-18', 'Real Google Drive binary storage integration', p18, `Uploaded to Drive ID: ${uploadResult?.mediaAsset?.driveFileId}, stage: ${uploadResult?.mediaAsset?.mediaStage}`);

    // =========================================================================
    // P18-19: MediaAsset Registration & Checksum Integrity
    // =========================================================================
    let p19 = false;
    if (
      uploadResult?.mediaAsset &&
      uploadResult.mediaAsset.md5Checksum === expectedMd5 &&
      uploadResult.mediaAsset.version === 1
    ) {
      p19 = true;
    }
    addResult('P18-19', 'MediaAsset registration and MD5 checksum integrity', p19, `MediaAsset MD5 (${uploadResult?.mediaAsset?.md5Checksum}) matches expected (${expectedMd5})`);

    // =========================================================================
    // P18-20: AI Failure Graceful Fallback
    // =========================================================================
    let p20 = false;
    const fallbackConcepts = geminiService.createFallbackThumbnailIntelligence(
      testQuestion,
      canonicalContentId,
      { script: testScript, video: testVideo }
    );
    if (
      fallbackConcepts.length >= 2 &&
      fallbackConcepts.every((c) => c.hookHeadline.length > 0 && !c.hookHeadline.includes('C'))
    ) {
      p20 = true;
    }
    addResult('P18-20', 'AI failure safety and deterministic fallback', p20, `Generated ${fallbackConcepts.length} safe pedagogical fallback concepts`);

    // =========================================================================
    // P18-21: Real Google Drive E2E Round-Trip Verification
    // =========================================================================
    let p21 = false;
    let driveFileIdToClean: string | undefined;
    try {
      const e2eContentId = `BP-CNT-${Math.floor(100000 + Math.random() * 900000)}`;
      await contentMastersRepository.create({
        id: e2eContentId,
        contentId: e2eContentId,
        title: 'Phase 18 Real Drive E2E Round-Trip Test',
        status: ContentMasterStatus.APPROVED,
        currentVersion: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      console.log(`[P18-21] Uploading real image binary (${realPngBuffer.length} bytes) to Google Drive...`);
      const e2eUploaded = await phase14DriveService.uploadProductionAsset({
        contentId: e2eContentId,
        mediaStage: 'THUMBNAIL',
        fileName: `${e2eContentId}-e2e-thumbnail.png`,
        mimeType: 'image/png',
        bodyStreamOrBuffer: realPngBuffer,
      });

      driveFileIdToClean = e2eUploaded.driveFileId;
      console.log(`[P18-21] Uploaded to Drive: ${driveFileIdToClean}. Downloading back for verification...`);

      const downloadStream = await googleDriveService.downloadFile(driveFileIdToClean);
      const chunks: Buffer[] = [];
      for await (const chunk of downloadStream.stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      const downloadedBuffer = Buffer.concat(chunks);
      const downloadedMd5 = crypto.createHash('md5').update(downloadedBuffer).digest('hex');

      console.log(`[P18-21] Expected MD5:   ${expectedMd5}`);
      console.log(`[P18-21] Downloaded MD5: ${downloadedMd5}`);
      if (downloadedMd5 === expectedMd5 && e2eUploaded.mediaStage === 'THUMBNAIL') {
        p21 = true;
      }
    } catch (e2eErr: any) {
      console.error('[P18-21] Error in real Drive round-trip:', e2eErr);
      p21 = false;
    } finally {
      if (driveFileIdToClean) {
        try {
          console.log(`[P18-21] Cleaning up test file "${driveFileIdToClean}"...`);
          await googleDriveService.deleteFile(driveFileIdToClean);
          console.log(`[P18-21] Cleaned up successfully.`);
        } catch (cleanupErr: any) {
          console.warn(`[P18-21] Cleanup warning:`, cleanupErr);
        }
      }
      if (uploadResult?.mediaAsset?.driveFileId) {
        try {
          await googleDriveService.deleteFile(uploadResult.mediaAsset.driveFileId);
        } catch (_) {}
      }
    }
    addResult('P18-21', 'Real Google Drive E2E round-trip verification', p21, 'Real PNG uploaded to Thumbnail/ hierarchy, downloaded back, bit-identical MD5 checksum verified');

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
    console.error('Fatal error during Phase 18 verification:', err);
    return {
      passed: false,
      totalChecks: results.length || 1,
      passedChecks: passedCount,
      failedChecks: (results.length || 1) - passedCount,
      results,
    };
  }
}
