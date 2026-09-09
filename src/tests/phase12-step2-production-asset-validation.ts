/**
 * BURRA PARIKSHA CMS - PHASE 12 STEP 2 VERIFICATION TEST SUITE
 * Production Asset Metadata & Validation Foundation Tests
 */

import { ProductionAssetValidationService } from '../lib/services/production-asset-validation.service';
import { videoService } from '../lib/services/video.service';
import { videosRepository } from '../lib/repositories/videos.repository';
import { RenderValidationStatus, VideoProductionStatus, UserRole } from '../types';

export async function runPhase12Step2Verification() {
  console.log('====================================================');
  console.log('BURRA PARIKSHA CMS - PHASE 12 STEP 2 VERIFICATION');
  console.log('Production Asset Metadata & Validation Foundation');
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
      throw new Error(`Phase 12 Step 2 Verification failed on Test ${totalTests}: ${testName} - ${detail || ''}`);
    }
  }

  // ============================================================================
  // SECTION 1: TARGETED ASPECT RATIO & DIMENSIONS CASES
  // ============================================================================
  console.log('--- Section 1: Focused Dimensions & Aspect Ratio Cases ---');

  // Case 1: 1080x1920 => VALID
  const case1 = ProductionAssetValidationService.validateMetadata({
    finalRenderWidth: 1080,
    finalRenderHeight: 1920,
    finalRenderFormat: 'MP4',
    finalRenderAspectRatio: '9:16',
    actualDurationSeconds: 45,
    targetDurationSeconds: 45,
    finalRenderPath: 'gs://renders/video.mp4'
  });
  assert(case1.status === RenderValidationStatus.VALID, 'Case 1: 1080x1920 => VALID');
  console.log(` -> Case 1 (1080x1920) Result: ${case1.status}, Errors: ${JSON.stringify(case1.errors)}`);

  // Case 2: 720x1280 => VALID
  const case2 = ProductionAssetValidationService.validateMetadata({
    finalRenderWidth: 720,
    finalRenderHeight: 1280,
    finalRenderFormat: 'MP4',
    finalRenderAspectRatio: '9:16',
    actualDurationSeconds: 45,
    targetDurationSeconds: 45,
    finalRenderPath: 'gs://renders/video.mp4'
  });
  assert(case2.status === RenderValidationStatus.VALID, 'Case 2: 720x1280 => VALID');
  console.log(` -> Case 2 (720x1280) Result: ${case2.status}, Errors: ${JSON.stringify(case2.errors)}`);

  // Case 3: 1080x1919 => Result explicitly reported (Expect: VALID, ratio diff = 0.00029 < 0.02)
  const case3 = ProductionAssetValidationService.validateMetadata({
    finalRenderWidth: 1080,
    finalRenderHeight: 1919,
    finalRenderFormat: 'MP4',
    finalRenderAspectRatio: '9:16',
    actualDurationSeconds: 45,
    targetDurationSeconds: 45,
    finalRenderPath: 'gs://renders/video.mp4'
  });
  console.log(` -> Case 3 (1080x1919) Result: ${case3.status}, Errors: ${JSON.stringify(case3.errors)}`);
  assert(case3.status === RenderValidationStatus.VALID, 'Case 3: 1080x1919 => VALID');

  // Case 4: 1080x1900 => Result explicitly reported (Expect: VALID, ratio diff = 0.0059 < 0.02)
  const case4 = ProductionAssetValidationService.validateMetadata({
    finalRenderWidth: 1080,
    finalRenderHeight: 1900,
    finalRenderFormat: 'MP4',
    finalRenderAspectRatio: '9:16',
    actualDurationSeconds: 45,
    targetDurationSeconds: 45,
    finalRenderPath: 'gs://renders/video.mp4'
  });
  console.log(` -> Case 4 (1080x1900) Result: ${case4.status}, Errors: ${JSON.stringify(case4.errors)}`);
  assert(case4.status === RenderValidationStatus.VALID, 'Case 4: 1080x1900 => VALID');

  // Case 5: 1920x1080 => INVALID (Landscape layout)
  const case5 = ProductionAssetValidationService.validateMetadata({
    finalRenderWidth: 1920,
    finalRenderHeight: 1080,
    finalRenderFormat: 'MP4',
    finalRenderAspectRatio: '16:9',
    actualDurationSeconds: 45,
    targetDurationSeconds: 45,
    finalRenderPath: 'gs://renders/video.mp4'
  });
  assert(case5.status === RenderValidationStatus.INVALID, 'Case 5: 1920x1080 => INVALID');
  console.log(` -> Case 5 (1920x1080) Result: ${case5.status}, Errors: ${JSON.stringify(case5.errors)}`);

  // Case 6: width 0 => INVALID
  const case6 = ProductionAssetValidationService.validateMetadata({
    finalRenderWidth: 0,
    finalRenderHeight: 1920,
    finalRenderFormat: 'MP4',
    finalRenderAspectRatio: '9:16',
    actualDurationSeconds: 45,
    targetDurationSeconds: 45,
    finalRenderPath: 'gs://renders/video.mp4'
  });
  assert(case6.status === RenderValidationStatus.INVALID, 'Case 6: width 0 => INVALID');
  console.log(` -> Case 6 (width 0) Result: ${case6.status}, Errors: ${JSON.stringify(case6.errors)}`);

  // Case 7: height 0 => INVALID
  const case7 = ProductionAssetValidationService.validateMetadata({
    finalRenderWidth: 1080,
    finalRenderHeight: 0,
    finalRenderFormat: 'MP4',
    finalRenderAspectRatio: '9:16',
    actualDurationSeconds: 45,
    targetDurationSeconds: 45,
    finalRenderPath: 'gs://renders/video.mp4'
  });
  assert(case7.status === RenderValidationStatus.INVALID, 'Case 7: height 0 => INVALID');
  console.log(` -> Case 7 (height 0) Result: ${case7.status}, Errors: ${JSON.stringify(case7.errors)}`);

  // Case 8: negative width => INVALID
  const case8 = ProductionAssetValidationService.validateMetadata({
    finalRenderWidth: -1080,
    finalRenderHeight: 1920,
    finalRenderFormat: 'MP4',
    finalRenderAspectRatio: '9:16',
    actualDurationSeconds: 45,
    targetDurationSeconds: 45,
    finalRenderPath: 'gs://renders/video.mp4'
  });
  assert(case8.status === RenderValidationStatus.INVALID, 'Case 8: negative width => INVALID');
  console.log(` -> Case 8 (negative width) Result: ${case8.status}, Errors: ${JSON.stringify(case8.errors)}`);

  // Case 9: negative height => INVALID
  const case9 = ProductionAssetValidationService.validateMetadata({
    finalRenderWidth: 1080,
    finalRenderHeight: -1920,
    finalRenderFormat: 'MP4',
    finalRenderAspectRatio: '9:16',
    actualDurationSeconds: 45,
    targetDurationSeconds: 45,
    finalRenderPath: 'gs://renders/video.mp4'
  });
  assert(case9.status === RenderValidationStatus.INVALID, 'Case 9: negative height => INVALID');
  console.log(` -> Case 9 (negative height) Result: ${case9.status}, Errors: ${JSON.stringify(case9.errors)}`);


  // ============================================================================
  // SECTION 2: END-TO-END SERVICE & SERVER-SIDE INVARIANT TESTS
  // ============================================================================
  console.log('\n--- Section 2: End-to-End Service Validation, Overrides & State Invariants ---');

  const actor = { id: 'USR-EDIT-01', name: 'Ravi Editor', role: UserRole.VIDEO_EDITOR };

  // Create a temporary video in the repository for isolation
  const testVideoId = 'BP-V-999999';
  await videosRepository.create({
    id: testVideoId,
    questionId: 'BP-Q-000001',
    title: 'Phase 12 Step 2 Render Test Video',
    status: VideoProductionStatus.EDITING,
    priority: 'NORMAL' as any,
    targetDurationSeconds: 45,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as any);

  try {
    // Case 10: manipulated client aspect ratio with correct dimensions => server ignores/bypasses no validation
    // Sending width=1080, height=1920 but passing manipulated aspect ratio "16:9" - the server will DERIVE the ratio based on w/h (1080/1920 = 9:16) and mark it VALID
    const updatedAspect = await videoService.updateVideoMetadata(testVideoId, {
      finalRenderWidth: 1080,
      finalRenderHeight: 1920,
      finalRenderFormat: 'MP4',
      finalRenderAspectRatio: '16:9', // Manipulated
      actualDurationSeconds: 42,
      finalRenderPath: 'gs://renders/video_valid.mp4',
    }, actor);

    assert(updatedAspect.finalRenderValidationStatus === RenderValidationStatus.VALID, 'Case 10: manipulated client aspect ratio ignored, server derives based on w/h and marks VALID');
    console.log(` -> Case 10 (manipulated aspect ratio 16:9 with 1080x1920 specs) Result: ${updatedAspect.finalRenderValidationStatus}`);

    // Case 11: manipulated client validation status => server recomputes status
    // Client attempts to cheat by submitting finalRenderValidationStatus: VALID for a landscape (invalid) render
    const updatedOverride = await videoService.updateVideoMetadata(testVideoId, {
      finalRenderWidth: 1920, // Landscape (invalid)
      finalRenderHeight: 1080,
      finalRenderFormat: 'MP4',
      finalRenderAspectRatio: '16:9',
      actualDurationSeconds: 45,
      finalRenderPath: 'gs://renders/video_invalid.mp4',
      finalRenderValidationStatus: 'VALID' as any, // Client trying to cheat
    }, actor);

    assert(updatedOverride.finalRenderValidationStatus === RenderValidationStatus.INVALID, 'Case 11: server ignores client-provided validation status and recomputes to INVALID');
    console.log(` -> Case 11 (cheated client validation status override) Result: ${updatedOverride.finalRenderValidationStatus}`);

    // Case 12: STATE INVARIANT: Metadata validation does NOT automatically change state from EDITING -> EDITED
    assert(updatedOverride.status === VideoProductionStatus.EDITING, 'Case 12: State invariant holds, video remains EDITING during metadata save');
    console.log(` -> Case 12 (EDITING -> EDITED state invariant check) Video Status: ${updatedOverride.status}`);

  } finally {
    // Cleanup temporary test record
    await videosRepository.deleteRecord(testVideoId);
  }

  // ============================================================================
  // SECTION 3: FORMAT DETERMINISTIC MATCHING
  // ============================================================================
  console.log('\n--- Section 3: Format Deterministic Matching & Case Normalization ---');

  const mp4Check = ProductionAssetValidationService.validateMetadata({
    finalRenderWidth: 1080,
    finalRenderHeight: 1920,
    finalRenderFormat: 'mp4', // Lowercase
    finalRenderAspectRatio: '9:16',
    actualDurationSeconds: 45,
    finalRenderPath: 'gs://renders/video.mp4'
  });
  assert(mp4Check.status === RenderValidationStatus.VALID, 'Accepts lowercase format "mp4" through case-normalization');

  const movCheck = ProductionAssetValidationService.validateMetadata({
    finalRenderWidth: 1080,
    finalRenderHeight: 1920,
    finalRenderFormat: 'MoV', // Mixed case
    finalRenderAspectRatio: '9:16',
    actualDurationSeconds: 45,
    finalRenderPath: 'gs://renders/video.mov'
  });
  assert(movCheck.status === RenderValidationStatus.VALID, 'Accepts mixed-case format "MoV" through case-normalization');

  const m4vCheck = ProductionAssetValidationService.validateMetadata({
    finalRenderWidth: 1080,
    finalRenderHeight: 1920,
    finalRenderFormat: 'M4V',
    finalRenderAspectRatio: '9:16',
    actualDurationSeconds: 45,
    finalRenderPath: 'gs://renders/video.m4v'
  });
  assert(m4vCheck.status === RenderValidationStatus.VALID, 'Accepts format "M4V"');

  const missingFormatCheck = ProductionAssetValidationService.validateMetadata({
    finalRenderWidth: 1080,
    finalRenderHeight: 1920,
    finalRenderAspectRatio: '9:16',
    actualDurationSeconds: 45,
    finalRenderPath: 'gs://renders/video.m4v'
  });
  assert(missingFormatCheck.status === RenderValidationStatus.INVALID, 'Missing format => INVALID');

  console.log(`\n====================================================`);
  console.log(`Phase 12 Step 2 Targeted Verification Success: ${passedTests}/${totalTests}`);
  console.log(`====================================================\n`);
}
