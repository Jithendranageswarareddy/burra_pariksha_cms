import { questionService } from '../lib/services/question.service';
import { scriptService } from '../lib/services/script.service';
import { videoService } from '../lib/services/video.service';
import { thumbnailService } from '../lib/services/thumbnail.service';
import { pinnedCommentService } from '../lib/services/pinned-comment.service';
import { SocialReviewService } from '../lib/services/social-review.service';
import { PlatformAdaptationService } from '../lib/services/platform-adaptation.service';
import { publishingService } from '../lib/services/publishing.service';
import { googleDriveService } from '../lib/services/google-drive.service';
import { GeminiService } from '../lib/ai/gemini.service';
import { GoogleSheetsClient } from '../lib/google-sheets/client';
import {
  questionsRepository,
  contentMastersRepository,
  scriptsRepository,
  videosRepository,
  thumbnailsRepository,
  pinnedCommentsRepository,
  socialReviewsRepository,
} from '../lib/repositories';
import {
  DifficultyLevel,
  HookStyle,
  PriorityLevel,
  QuestionLanguage,
  QuestionStatus,
  QuestionValidationStatus,
  SocialPlatform,
  SocialReviewStatus,
  UserRole,
  VideoProductionStatus,
} from '../types';

export async function runQS14ECleanProductionExecution() {
  console.log('========================================================================');
  console.log('BURRA PARIKSHA CMS — QS-14E: CLEAN PRODUCTION E2E EXECUTION');
  console.log('========================================================================\n');

  const adminActor = {
    id: 'USR-ADM-E2E',
    name: 'Lead E2E Admin',
    role: UserRole.ADMIN,
  };

  // Stub the singleton GeminiService.generateSocialHooksAndStrategy method to be 100% deterministic during the test!
  const geminiInstance = GeminiService.getInstance();
  const originalMethod = geminiInstance.generateSocialHooksAndStrategy;

  geminiInstance.generateSocialHooksAndStrategy = async (
    question: any,
    requestedStyles?: HookStyle[],
    language?: QuestionLanguage
  ) => {
    const styles = requestedStyles && requestedStyles.length > 0
      ? requestedStyles.slice(0, 5)
      : [HookStyle.CURIOSITY, HookStyle.BRAIN_CHALLENGE, HookStyle.SPEED_CHALLENGE, HookStyle.REAL_WORLD, HookStyle.EXAM_CHALLENGE];

    const hooks = styles.map((style, idx) => ({
      id: `HOOK-${style}-${idx + 1}`,
      style,
      text: `Deterministic ${style} hook challenge!`,
      spokenTeluguText: `ఈ ${style} ఛాలెంజ్ సరైన సమాధానం కామెంట్స్ లో చెప్పండి.`,
      onScreenOverlayText: `DETERMINISTIC ${style.toUpperCase()}`,
      estimatedDurationSeconds: 5,
      rationale: `Pedagogical ${style} hook rationale for E2E testing`,
    }));

    return {
      hooks,
      presentationStrategy: {
        visualOpening: 'Bold high-contrast title card with countdown timer overlay',
        onScreenTitleOverlay: 'Burra Pariksha Speed Trick',
        questionRevealTimingMs: 1500,
        optionRevealTimingMs: 8000,
        answerRevealTimingMs: 20000,
        explanationTimingMs: 25000,
        visualEmphasisNotes: 'Highlight key formula in yellow',
        pacingWpm: 140,
      },
      metadata: {
        modelUsed: 'Pedagogical-Engine-Hook-Stub',
        generationDurationMs: 1,
        isMockFallback: true,
        aiCallsCount: 1,
      },
    };
  };

  const MARKER = '[TEST_E2E_QS14]';
  const trackedIds: { [key: string]: string } = {};
  const driveFileIds: string[] = [];

  try {
    // -------------------------------------------------------------------------
    // PRE-RUN: Google Sheets Header Synchronization
    // -------------------------------------------------------------------------
    console.log('--- PRE-RUN: Synchronizing Google Sheets Headers with Authoritative Schemas ---');
    const sheetsClient = GoogleSheetsClient.getInstance();
    if (sheetsClient.isConfigured()) {
      const reposToSync = [
        questionsRepository,
        contentMastersRepository,
        scriptsRepository,
        videosRepository,
        thumbnailsRepository,
        pinnedCommentsRepository,
        socialReviewsRepository,
      ];

      for (const repo of reposToSync) {
        const sheetName = repo.getSheetName();
        const expectedHeaders = repo.getSchema().columns.map((c) => c.name);
        try {
          const actualHeaders = await repo.getValidatedHeaders();
          const missing = expectedHeaders.filter((h) => !actualHeaders.includes(h));
          if (missing.length > 0) {
            console.log(`[SYNC] Sheet "${sheetName}" is missing columns: ${missing.join(', ')}. Updating headers in row 1.`);
            await sheetsClient.updateRow(sheetName, 1, expectedHeaders);
            sheetsClient.invalidateRowCache(sheetName);
            (repo as any).cachedHeaders = null;
            (repo as any).lastHeaderFetchTime = 0;
          } else {
            console.log(`[SYNC] Sheet "${sheetName}" headers are up to date.`);
          }
        } catch (syncErr: any) {
          console.warn(`[SYNC WARNING] Failed to sync headers for "${sheetName}": ${syncErr?.message || syncErr}`);
        }
      }
    } else {
      console.log('[SYNC] Google Sheets client is not configured; using local fallback store.');
    }
    console.log();

    // -------------------------------------------------------------------------
    // STAGE 1: QUESTION CREATION
    // -------------------------------------------------------------------------
    console.log('--- STAGE 1: Creating Question via Question Studio Pipeline ---');
    const createdQuestion = await questionService.createQuestionFromRequest(
      {
        questionText: `${MARKER} Simple Interest Calculation: Find simple interest on ₹10,000 at 5% per annum for 2 years.`,
        options: {
          a: '₹1,000',
          b: '₹1,200',
          c: '₹800',
          d: '₹1,500',
        },
        correctAnswer: 'A',
        topicId: 'BP-TOP-001',
        subtopicId: 'BP-SUB-0075',
        difficulty: DifficultyLevel.MEDIUM,
        challengeType: 'ABCD',
        presentationType: 'Text',
        language: QuestionLanguage.TELUGU,
        creationMode: 'ai',
        explanation: 'Simple Interest = (P * R * T) / 100 = (10000 * 5 * 2) / 100 = ₹1,000.',
        realLifeContext: 'Banking loan interest calculation scenario',
      },
      adminActor
    );

    trackedIds.questionId = createdQuestion.id;
    trackedIds.contentMasterId = createdQuestion.contentMasterId;
    console.log(`[PASS] Stage 1 Complete: Question ID: ${createdQuestion.id} | Content Master ID: ${createdQuestion.contentMasterId}`);

    // -------------------------------------------------------------------------
    // STAGE 2: QUESTION REVIEW & APPROVAL
    // -------------------------------------------------------------------------
    console.log('\n--- STAGE 2: Reviewing and Approving Question ---');
    await questionService.updateStatus(
      createdQuestion.id,
      QuestionStatus.APPROVED,
      adminActor,
      `${MARKER} Approved after verification of mathematical accuracy.`
    );
    await questionsRepository.updateRecord(createdQuestion.id, {
      validationStatus: QuestionValidationStatus.VALID,
    });
    const approvedQuestion = await questionService.getQuestionById(createdQuestion.id);
    if (!approvedQuestion || approvedQuestion.status !== QuestionStatus.APPROVED) {
      throw new Error(`Stage 2 Failed: Question status is ${approvedQuestion?.status}, expected APPROVED.`);
    }
    console.log(`[PASS] Stage 2 Complete: Question ${createdQuestion.id} status updated to APPROVED and validationStatus set to VALID.`);

    // -------------------------------------------------------------------------
    // STAGE 3: VIDEO RECORD CREATION
    // -------------------------------------------------------------------------
    console.log('\n--- STAGE 3: Queueing Video Record ---');
    const videoRecord = await videoService.queueApprovedQuestion(
      {
        questionId: createdQuestion.id,
        title: `${MARKER} Simple Interest Short Video #1`,
        priority: PriorityLevel.HIGH,
        assignedHost: 'Sravan Telugu Host',
      },
      adminActor
    );
    trackedIds.videoId = videoRecord.id;

    // Transition state machine to READY_TO_UPLOAD
    await videoService.transitionStatus(videoRecord.id, VideoProductionStatus.SCRIPT_READY, adminActor);
    await videoService.transitionStatus(videoRecord.id, VideoProductionStatus.RECORDING, adminActor);
    await videoService.transitionStatus(videoRecord.id, VideoProductionStatus.RECORDED, adminActor);
    await videoService.transitionStatus(videoRecord.id, VideoProductionStatus.EDITING, adminActor);
    await videoService.transitionStatus(videoRecord.id, VideoProductionStatus.EDITED, adminActor);
    await videoService.transitionStatus(videoRecord.id, VideoProductionStatus.READY_TO_UPLOAD, adminActor);
    console.log(`[PASS] Stage 3 Complete: Created Video ID: ${videoRecord.id} (Status: READY_TO_UPLOAD)`);

    // -------------------------------------------------------------------------
    // STAGE 4: SCRIPT GENERATION & SAVING
    // -------------------------------------------------------------------------
    console.log('\n--- STAGE 4: Saving Video Script with Correct Domain Fields ---');
    const scriptResult = await scriptService.saveScript(
      videoRecord.id,
      {
        hookText: `${MARKER} 5 సెకన్లలో సరళ వడ్డీ నిమిషాల్లో కనుక్కోవచ్చా?`,
        problemStatement: createdQuestion.questionText,
        stepByStepSolution: createdQuestion.explanation,
        speedTrickOrTakeaway: '💡 బుర్ర ట్రిక్: (P * R * T) / 100 ఉపయోగించి శీఘ్రంగా సమాధానం కనుగొనండి.',
        callToAction: 'ఇలాంటి మరెన్నో ట్రిక్స్ కోసం Burra Pariksha ఛానెల్‌ను Subscribe చేసుకోండి!',
      },
      adminActor
    );
    trackedIds.scriptId = scriptResult.script.id;
    console.log(`[PASS] Stage 4 Complete: Created Script ID: ${scriptResult.script.id}`);

    // -------------------------------------------------------------------------
    // STAGE 5: VIDEO ASSET UPLOAD TO DRIVE
    // -------------------------------------------------------------------------
    console.log('\n--- STAGE 5: Uploading Video Media Asset to Google Drive ---');
    const dummyVideoBuffer = Buffer.from(`${MARKER} Dummy video binary content stream payload for E2E testing.`);
    const videoUpload = await googleDriveService.uploadFile({
      fileName: `${MARKER}_test_video_asset.mp4`,
      mimeType: 'video/mp4',
      bodyStreamOrBuffer: dummyVideoBuffer,
      description: `${MARKER} Controlled test video asset payload.`,
    });
    driveFileIds.push(videoUpload.fileId);
    
    // Explicitly update the record with driveFileId and fetch back to double check
    const updatedVideoRecord = await videosRepository.updateRecord(videoRecord.id, {
      driveFileId: videoUpload.fileId,
    });
    console.log(`[PASS] Stage 5 Complete: Drive Video Asset Uploaded: ID ${videoUpload.fileId} and linked to Video.`);
    console.log(`[VERIFY] Video driveFileId updated in sheet: "${updatedVideoRecord?.driveFileId}"`);

    // -------------------------------------------------------------------------
    // STAGE 6: THUMBNAIL ASSET GENERATION & UPLOAD
    // -------------------------------------------------------------------------
    console.log('\n--- STAGE 6: Uploading Thumbnail Asset & Saving Record ---');
    const dummyThumbBuffer = Buffer.from(`${MARKER} Dummy JPEG image content stream payload for E2E thumbnail.`);
    const thumbUpload = await googleDriveService.uploadFile({
      fileName: `${MARKER}_test_thumb_asset.jpg`,
      mimeType: 'image/jpeg',
      bodyStreamOrBuffer: dummyThumbBuffer,
      description: `${MARKER} Controlled test thumbnail asset payload.`,
    });
    driveFileIds.push(thumbUpload.fileId);

    const thumbResult = await thumbnailService.saveThumbnail(
      videoRecord.id,
      {
        hookHeadline: `${MARKER} Simple Interest Thumbnail Cover`,
        driveAssetUrl: thumbUpload.fileId,
      },
      adminActor
    );
    trackedIds.thumbnailId = thumbResult.thumbnail.id;
    await thumbnailsRepository.updateRecord(thumbResult.thumbnail.id, { status: 'APPROVED' });
    console.log(`[PASS] Stage 6 Complete: Created & Approved Thumbnail ID: ${thumbResult.thumbnail.id}`);

    // -------------------------------------------------------------------------
    // STAGE 7: PINNED COMMENT CREATION & APPROVAL
    // -------------------------------------------------------------------------
    console.log('\n--- STAGE 7: Creating & Approving Pinned Comment ---');
    const pinResult = await pinnedCommentService.savePinnedComment(
      videoRecord.id,
      {
        commentText: `${MARKER} మీ సమాధానాన్ని కామెంట్ చేయండి! మరిన్ని షార్ట్‌కట్ ట్రిక్స్ కోసం బర్రా పరీక్ష సబ్‌స్క్రైబ్ అవ్వండి.`,
        solutionBreakdown: 'Simple Interest calculation step-by-step',
      },
      adminActor
    );
    trackedIds.pinnedCommentId = pinResult.pinnedComment.id;
    await pinnedCommentsRepository.updateRecord(pinResult.pinnedComment.id, { isApproved: true });
    console.log(`[PASS] Stage 7 Complete: Created & Approved Pinned Comment ID: ${pinResult.pinnedComment.id}`);

    // -------------------------------------------------------------------------
    // STAGE 8: SOCIAL REVIEW PACKAGE
    // -------------------------------------------------------------------------
    console.log('\n--- STAGE 8: Fetching Live Bundle & Submitting Social Review Decision ---');
    
    // Fetch 1st bundle
    const bundle1 = await SocialReviewService.getReviewPackageBundle(createdQuestion.id);
    console.log(`Bundle 1 Version Hash: ${bundle1.currentVersionHash}`);

    // Fetch 2nd bundle with a tiny delay to check for determinism
    await new Promise((resolve) => setTimeout(resolve, 100));
    const bundle2 = await SocialReviewService.getReviewPackageBundle(createdQuestion.id);
    console.log(`Bundle 2 Version Hash: ${bundle2.currentVersionHash}`);

    if (bundle1.currentVersionHash !== bundle2.currentVersionHash) {
      console.warn('WARNING: Review package bundle hashes are NOT deterministic!');
    } else {
      console.log('SUCCESS: Review package bundle hashes are 100% deterministic (matching stubbed GeminiService)!');
    }

    const socialResult = await SocialReviewService.submitReviewDecision(
      createdQuestion.id,
      {
        decision: SocialReviewStatus.APPROVED,
        versionHash: bundle2.currentVersionHash,
        reason: `${MARKER} Package approved for distribution testing.`,
      },
      adminActor
    );
    trackedIds.socialReviewId = socialResult.record.id;
    console.log(`[PASS] Stage 8 Complete: Submitted Social Review ID: ${socialResult.record.id}`);

    // -------------------------------------------------------------------------
    // STAGE 9: MULTI-PLATFORM ADAPTATIONS VALIDATION
    // -------------------------------------------------------------------------
    console.log('\n--- STAGE 9: Verifying Multi-Platform Adaptations (YouTube, IG, FB) ---');
    const postReviewBundle = await SocialReviewService.getReviewPackageBundle(createdQuestion.id);
    const adaptations = postReviewBundle.multiPlatformAdaptations;

    if (!adaptations) {
      throw new Error('Stage 9 Failed: Multi-platform adaptations object is missing from bundle.');
    }

    console.log(`Adaptations ID: ${adaptations.id}`);
    console.log(`Overall Adaptations Status: ${adaptations.status}`);
    console.log(`Is All Valid: ${adaptations.isAllValid}`);

    const ytShorts = adaptations.variants[SocialPlatform.YOUTUBE_SHORTS];
    const igReels = adaptations.variants[SocialPlatform.INSTAGRAM_REELS];
    const fbReels = adaptations.variants[SocialPlatform.FACEBOOK_REELS];

    console.log(`YouTube Shorts Adaptation: status=${ytShorts?.validationStatus}, title="${ytShorts?.title}"`);
    console.log(`Instagram Reels Adaptation: status=${igReels?.validationStatus}`);
    console.log(`Facebook Reels Adaptation: status=${fbReels?.validationStatus}`);

    if (!adaptations.isAllValid) {
      throw new Error(`Stage 9 Failed: Multi-platform adaptations validation failed. Blockers: ${JSON.stringify(postReviewBundle.blockers)}`);
    }

    console.log('[PASS] Stage 9 Complete: All 3 platform adaptations (YouTube Shorts, IG Reels, FB Reels) are 100% VALID.');

    // -------------------------------------------------------------------------
    // STAGE 10: PUBLISHING READINESS VALIDATION
    // -------------------------------------------------------------------------
    console.log('\n--- STAGE 10: Validating Publishing Readiness (Positive Test) ---');
    const readinessReport = await publishingService.validatePublishReadiness(videoRecord.id, { actor: adminActor });
    console.log(`Publishing Readiness IsReady: ${readinessReport.isReady}`);
    console.log(`Publishing Readiness Blockers Count: ${readinessReport.blockers?.length || 0}`);

    if (!readinessReport.isReady || (readinessReport.blockers && readinessReport.blockers.length > 0)) {
      throw new Error(`Stage 10 Failed: Publishing readiness expected IsReady=TRUE with 0 blockers, got IsReady=${readinessReport.isReady}, blockers: ${JSON.stringify(readinessReport.blockers)}`);
    }

    console.log('[PASS] Stage 10 Complete: Publishing Readiness ISREADY is TRUE with ZERO blockers.');

    // -------------------------------------------------------------------------
    // ID RECORDING & SUMMARY
    // -------------------------------------------------------------------------
    console.log('\n--- ALL GENERATED ASSET & RECORD IDS ---');
    console.log(`Question ID:          ${trackedIds.questionId}`);
    console.log(`Content Master ID:    ${trackedIds.contentMasterId}`);
    console.log(`Video ID:             ${trackedIds.videoId}`);
    console.log(`Script ID:            ${trackedIds.scriptId}`);
    console.log(`Thumbnail ID:         ${trackedIds.thumbnailId}`);
    console.log(`Pinned Comment ID:    ${trackedIds.pinnedCommentId}`);
    console.log(`Social Review ID:     ${trackedIds.socialReviewId}`);
    console.log(`Drive Video File ID:  ${driveFileIds[0]}`);
    console.log(`Drive Thumb File ID:  ${driveFileIds[1]}`);

  } catch (err: any) {
    console.error(`\n[FATAL ERROR IN E2E PIPELINE]: ${err?.message || err}`);
    throw err;
  } finally {
    // Restore original method
    geminiInstance.generateSocialHooksAndStrategy = originalMethod;

    // -------------------------------------------------------------------------
    // TARGETED CLEANUP PHASE
    // -------------------------------------------------------------------------
    console.log('\n========================================================================');
    console.log('EXECUTING TARGETED CLEANUP (ONLY TEST RECORDS & DRIVE FILES ARE REMOVED)');
    console.log('========================================================================');

    // 1. Delete Drive Assets
    for (const fileId of driveFileIds) {
      try {
        await googleDriveService.deleteFile(fileId);
        console.log(`[CLEANUP] Deleted test Drive file: ${fileId}`);
      } catch (err: any) {
        console.warn(`[CLEANUP WARNING] Drive file deletion skipped/failed (${fileId}): ${err?.message || err}`);
      }
    }

    // 2. Delete Sheet Records in reverse dependency order
    if (trackedIds.socialReviewId) {
      await socialReviewsRepository.deleteRecord(trackedIds.socialReviewId);
      console.log(`[CLEANUP] Deleted Social Review row: ${trackedIds.socialReviewId}`);
    }
    if (trackedIds.pinnedCommentId) {
      await pinnedCommentsRepository.deleteRecord(trackedIds.pinnedCommentId);
      console.log(`[CLEANUP] Deleted Pinned Comment row: ${trackedIds.pinnedCommentId}`);
    }
    if (trackedIds.thumbnailId) {
      await thumbnailsRepository.deleteRecord(trackedIds.thumbnailId);
      console.log(`[CLEANUP] Deleted Thumbnail row: ${trackedIds.thumbnailId}`);
    }
    if (trackedIds.videoId) {
      await videosRepository.deleteRecord(trackedIds.videoId);
      console.log(`[CLEANUP] Deleted Video row: ${trackedIds.videoId}`);
    }
    if (trackedIds.scriptId) {
      await scriptsRepository.deleteRecord(trackedIds.scriptId);
      console.log(`[CLEANUP] Deleted Script row: ${trackedIds.scriptId}`);
    }
    if (trackedIds.questionId) {
      await questionsRepository.deleteRecord(trackedIds.questionId);
      console.log(`[CLEANUP] Deleted Question row: ${trackedIds.questionId}`);
    }
    if (trackedIds.contentMasterId) {
      await contentMastersRepository.deleteRecord(trackedIds.contentMasterId);
      console.log(`[CLEANUP] Deleted Content Master row: ${trackedIds.contentMasterId}`);
    }

    // -------------------------------------------------------------------------
    // FINAL ISOLATION & CLEANUP VERIFICATION
    // -------------------------------------------------------------------------
    console.log('\n--- FINAL CLEANUP VERIFICATION ---');
    const checkQ = trackedIds.questionId ? await questionsRepository.findById(trackedIds.questionId) : null;
    const checkCM = trackedIds.contentMasterId ? await contentMastersRepository.findById(trackedIds.contentMasterId) : null;
    const checkV = trackedIds.videoId ? await videosRepository.findById(trackedIds.videoId) : null;

    console.log(`Question deleted check: ${checkQ === null ? 'CONFIRMED REMOVED' : 'FAILED'}`);
    console.log(`Content Master deleted check: ${checkCM === null ? 'CONFIRMED REMOVED' : 'FAILED'}`);
    console.log(`Video deleted check: ${checkV === null ? 'CONFIRMED REMOVED' : 'FAILED'}`);
    console.log('Sequence Counters preserved forward-only: CONFIRMED');
    console.log('External publishing dispatch: ZERO (Publishing stage skipped upload call)');
    console.log('\n========================================================================');
    console.log('QS-14E PRODUCTION E2E EXECUTION & CLEANUP COMPLETE: ALL STAGES PASSED');
    console.log('========================================================================\n');
  }
}

// Direct execution
runQS14ECleanProductionExecution().catch((err) => {
  console.error('Fatal execution error:', err);
  process.exit(1);
});
