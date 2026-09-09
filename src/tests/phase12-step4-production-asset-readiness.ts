/**
 * BURRA PARIKSHA CMS - PHASE 12 STEP 4 TEST SUITE
 * Production Asset Readiness & UI Integration Verification
 */

import { ProductionAssetValidationService } from '../lib/services/production-asset-validation.service';
import { productionBoardService } from '../lib/services/production-board.service';
import { publishingService } from '../lib/services/publishing.service';
import { videosRepository } from '../lib/repositories/videos.repository';
import { questionsRepository } from '../lib/repositories/questions.repository';
import { googleSheetsClient } from '../lib/google-sheets/client';
import { VideoProductionStatus, RenderValidationStatus, CanonicalProductionReadiness, Video, UserRole } from '../types';

export async function runPhase12Step4Verification() {
  // Stub googleSheetsClient.isConfigured to always return false during the test
  // to ensure we run deterministically on the in-memory fallback store
  const originalIsConfigured = googleSheetsClient.isConfigured;
  googleSheetsClient.isConfigured = () => false;

  console.log('================================================================');
  console.log('BURRA PARIKSHA CMS - PHASE 12 STEP 4 VERIFICATION');
  console.log('Production Asset Readiness & UI Integration');
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
      throw new Error(`Phase 12 Step 4 Verification failed on Test ${totalTests}: ${testName} - ${detail || ''}`);
    }
  }

  // --- STAGE 1: Testing ProductionAssetValidationService.determineReadiness (Tests 1-11) ---
  console.log('\n--- Stage 1: State Mapping and Canonical Readiness ---');

  // Test 1: Video status is QUEUED
  const videoQueued = { status: VideoProductionStatus.QUEUED } as Video;
  assert(
    ProductionAssetValidationService.determineReadiness(videoQueued) === CanonicalProductionReadiness.RENDER_NOT_STARTED,
    'Video in QUEUED returns RENDER_NOT_STARTED'
  );

  // Test 2: Video status is EDITING but no finalRenderPath
  const videoEditingNoPath = { status: VideoProductionStatus.EDITING } as Video;
  assert(
    ProductionAssetValidationService.determineReadiness(videoEditingNoPath) === CanonicalProductionReadiness.RENDER_NOT_STARTED,
    'Video in EDITING with no render path returns RENDER_NOT_STARTED'
  );

  // Test 3: Video status is EDITING with finalRenderPath but width is missing
  const videoEditingIncomplete = {
    status: VideoProductionStatus.EDITING,
    finalRenderPath: 'gs://renders/v1.mp4',
    finalRenderHeight: 1920,
    finalRenderFormat: 'MP4'
  } as Video;
  assert(
    ProductionAssetValidationService.determineReadiness(videoEditingIncomplete) === CanonicalProductionReadiness.RENDER_METADATA_INCOMPLETE,
    'Video with missing width returns RENDER_METADATA_INCOMPLETE'
  );

  // Test 4: Video status is EDITING with finalRenderPath, format missing
  const videoEditingIncompleteFormat = {
    status: VideoProductionStatus.EDITING,
    finalRenderPath: 'gs://renders/v1.mp4',
    finalRenderWidth: 1080,
    finalRenderHeight: 1920,
    finalRenderAspectRatio: '9:16'
  } as Video;
  assert(
    ProductionAssetValidationService.determineReadiness(videoEditingIncompleteFormat) === CanonicalProductionReadiness.RENDER_METADATA_INCOMPLETE,
    'Video with missing format returns RENDER_METADATA_INCOMPLETE'
  );

  // Test 5: Video status is EDITING, metadata complete but invalid (landscape aspect ratio)
  const videoEditingInvalid = {
    status: VideoProductionStatus.EDITING,
    finalRenderPath: 'gs://renders/v1.mp4',
    finalRenderWidth: 1920,
    finalRenderHeight: 1080,
    finalRenderFormat: 'MP4',
    finalRenderAspectRatio: '16:9',
    actualDurationSeconds: 45
  } as Video;
  assert(
    ProductionAssetValidationService.determineReadiness(videoEditingInvalid) === CanonicalProductionReadiness.RENDER_INVALID,
    'Landscape video returns RENDER_INVALID'
  );

  // Test 6: Video status is EDITING, metadata complete and valid
  const videoEditingValid = {
    status: VideoProductionStatus.EDITING,
    finalRenderPath: 'gs://renders/v1.mp4',
    finalRenderWidth: 1080,
    finalRenderHeight: 1920,
    finalRenderFormat: 'MP4',
    finalRenderAspectRatio: '9:16',
    actualDurationSeconds: 45
  } as Video;
  assert(
    ProductionAssetValidationService.determineReadiness(videoEditingValid) === CanonicalProductionReadiness.RENDER_VALID_BUT_EDITING,
    'Valid render in EDITING status returns RENDER_VALID_BUT_EDITING'
  );

  // Test 7: Video status is EDITED
  const videoEdited = {
    status: VideoProductionStatus.EDITED,
    finalRenderPath: 'gs://renders/v1.mp4',
    finalRenderWidth: 1080,
    finalRenderHeight: 1920,
    finalRenderFormat: 'MP4',
    finalRenderAspectRatio: '9:16',
    actualDurationSeconds: 45
  } as Video;
  assert(
    ProductionAssetValidationService.determineReadiness(videoEdited) === CanonicalProductionReadiness.EDITING_COMPLETE,
    'Video in EDITED status returns EDITING_COMPLETE'
  );

  // Test 8: Video status is FINAL_REVIEW
  const videoFinalReview = {
    status: VideoProductionStatus.FINAL_REVIEW,
    finalRenderPath: 'gs://renders/v1.mp4',
    finalRenderWidth: 1080,
    finalRenderHeight: 1920,
    finalRenderFormat: 'MP4',
    finalRenderAspectRatio: '9:16',
    actualDurationSeconds: 45
  } as Video;
  assert(
    ProductionAssetValidationService.determineReadiness(videoFinalReview) === CanonicalProductionReadiness.EDITING_COMPLETE,
    'Video in FINAL_REVIEW status returns EDITING_COMPLETE'
  );

  // Test 9: Video status is READY_TO_UPLOAD but publish readiness has blockers (isReady: false)
  const videoReadyToUploadBlocked = {
    status: VideoProductionStatus.READY_TO_UPLOAD,
    finalRenderPath: 'gs://renders/v1.mp4',
    finalRenderWidth: 1080,
    finalRenderHeight: 1920,
    finalRenderFormat: 'MP4',
    finalRenderAspectRatio: '9:16',
    actualDurationSeconds: 45
  } as Video;
  assert(
    ProductionAssetValidationService.determineReadiness(videoReadyToUploadBlocked, { isReady: false }) === CanonicalProductionReadiness.EDITING_COMPLETE,
    'Video in READY_TO_UPLOAD with publish blockers returns EDITING_COMPLETE'
  );

  // Test 10: Video status is READY_TO_UPLOAD and publish readiness has NO blockers (isReady: true)
  const videoReadyToUploadReady = {
    status: VideoProductionStatus.READY_TO_UPLOAD,
    finalRenderPath: 'gs://renders/v1.mp4',
    finalRenderWidth: 1080,
    finalRenderHeight: 1920,
    finalRenderFormat: 'MP4',
    finalRenderAspectRatio: '9:16',
    actualDurationSeconds: 45
  } as Video;
  assert(
    ProductionAssetValidationService.determineReadiness(videoReadyToUploadReady, { isReady: true }) === CanonicalProductionReadiness.READY_FOR_PUBLISHING,
    'Video in READY_TO_UPLOAD with no publish blockers returns READY_FOR_PUBLISHING'
  );

  // Test 11: Video status is UPLOADED
  const videoUploaded = {
    status: VideoProductionStatus.UPLOADED,
    finalRenderPath: 'gs://renders/v1.mp4',
    finalRenderWidth: 1080,
    finalRenderHeight: 1920,
    finalRenderFormat: 'MP4',
    finalRenderAspectRatio: '9:16',
    actualDurationSeconds: 45
  } as Video;
  assert(
    ProductionAssetValidationService.determineReadiness(videoUploaded, { isReady: true }) === CanonicalProductionReadiness.READY_FOR_PUBLISHING,
    'Video in UPLOADED status returns READY_FOR_PUBLISHING'
  );


  // --- STAGE 2: Testing Render Validation Rules (Tests 12-16) ---
  console.log('\n--- Stage 2: Render Validation Rules & Short-Form Guidelines ---');

  // Test 12: Empty path produces NOT_VALIDATED status
  const emptyVal = ProductionAssetValidationService.validateMetadata({ finalRenderPath: '' } as any);
  assert(
    emptyVal.status === RenderValidationStatus.NOT_VALIDATED && emptyVal.errors.length === 0,
    'Empty final render path results in NOT_VALIDATED and no errors'
  );

  // Test 13: Aspect ratio check - 9:16 is valid vertical format
  const validVal = ProductionAssetValidationService.validateMetadata({
    finalRenderPath: 'gs://renders/valid.mp4',
    finalRenderWidth: 1080,
    finalRenderHeight: 1920,
    finalRenderFormat: 'MP4',
    finalRenderAspectRatio: '9:16',
    actualDurationSeconds: 45,
    targetDurationSeconds: 45
  } as any);
  assert(
    validVal.status === RenderValidationStatus.VALID && validVal.errors.length === 0,
    'Valid short-form portrait specs return VALID and 0 errors'
  );

  // Test 14: Non-portrait aspect ratio triggers error
  const invalidAspectVal = ProductionAssetValidationService.validateMetadata({
    finalRenderPath: 'gs://renders/invalid.mp4',
    finalRenderWidth: 1080,
    finalRenderHeight: 1080,
    finalRenderFormat: 'MP4',
    finalRenderAspectRatio: '1:1',
    actualDurationSeconds: 45,
    targetDurationSeconds: 45
  } as any);
  assert(
    invalidAspectVal.status === RenderValidationStatus.INVALID &&
    invalidAspectVal.errors.some(e => e.includes('vertical') || e.includes('Aspect ratio')),
    'Non-portrait aspect ratio (1:1) returns INVALID and ratio error'
  );

  // Test 15: Mismatched dimensions (width > height) triggers error
  const invalidDimensionsVal = ProductionAssetValidationService.validateMetadata({
    finalRenderPath: 'gs://renders/invalid.mp4',
    finalRenderWidth: 1920,
    finalRenderHeight: 1080,
    finalRenderFormat: 'MP4',
    finalRenderAspectRatio: '9:16',
    actualDurationSeconds: 45,
    targetDurationSeconds: 45
  } as any);
  assert(
    invalidDimensionsVal.status === RenderValidationStatus.INVALID &&
    invalidDimensionsVal.errors.some(e => e.includes('vertical') || e.includes('Height')),
    'Width greater than height returns INVALID and dimension error'
  );

  // Test 16: Mismatched actual vs target duration warning
  const warningDurationVal = ProductionAssetValidationService.validateMetadata({
    finalRenderPath: 'gs://renders/valid.mp4',
    finalRenderWidth: 1080,
    finalRenderHeight: 1920,
    finalRenderFormat: 'MP4',
    finalRenderAspectRatio: '9:16',
    actualDurationSeconds: 65,
    targetDurationSeconds: 45
  } as any);
  assert(
    warningDurationVal.status === RenderValidationStatus.VALID &&
    warningDurationVal.warnings.some(w => w.includes('exceeds')),
    'Actual duration exceeding target returns VALID status but adds exceeds warning'
  );


  // --- STAGE 3: Production Board & Publishing Service Integrations (Tests 17-21) ---
  console.log('\n--- Stage 3: Board & Publishing Service Integrations ---');

  // Ensure there is at least one question in the repository for the video mapping
  const existingQuestions = await questionsRepository.findAll();
  let targetQuestionId = 'Q-001';
  if (existingQuestions.length === 0) {
    await questionsRepository.appendRecord({
      id: 'Q-001',
      questionText: 'Mock verification question',
      categoryId: 'CAT-001',
      topicId: 'TOPIC-001',
      difficulty: 'NORMAL'
    } as any);
  } else {
    targetQuestionId = existingQuestions[0].id;
  }

  // Test 17: Append a mock video to check database queries and schema updates
  const testVideoId = `VID-TEST-P12S4-${Date.now()}`;
  console.log(`Appending test video ${testVideoId} with questionId ${targetQuestionId} to verify board service...`);
  const mockVideoRecord = {
    id: testVideoId,
    title: 'Verification Test Video',
    status: VideoProductionStatus.EDITING,
    questionId: targetQuestionId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    finalRenderPath: 'gs://renders/valid.mp4',
    finalRenderWidth: 1080,
    finalRenderHeight: 1920,
    finalRenderFormat: 'MP4',
    finalRenderAspectRatio: '9:16',
    actualDurationSeconds: 45,
    finalRenderValidationStatus: 'VALID'
  } as Video;

  const appendedVideo = await videosRepository.appendRecord(mockVideoRecord);
  assert(!!appendedVideo, 'Mock video appended successfully to repository');

  // Test 18: Fetch production board and verify augmented items
  const boardItems = await productionBoardService.getProductionBoard();
  const boardItem = boardItems.find(item => item.videoId === testVideoId);
  assert(
    !!boardItem,
    'Production Board returned the appended test video'
  );

  // Test 19: Check augmented fields on the board item
  if (boardItem) {
    assert(
      Number(boardItem.finalRenderWidth) === 1080 &&
      Number(boardItem.finalRenderHeight) === 1920 &&
      boardItem.finalRenderFormat === 'MP4' &&
      boardItem.finalRenderAspectRatio === '9:16' &&
      Number(boardItem.actualDurationSeconds) === 45,
      `Augmented board item contains correct final render specifications (width: ${boardItem.finalRenderWidth}, height: ${boardItem.finalRenderHeight}, format: ${boardItem.finalRenderFormat}, ratio: ${boardItem.finalRenderAspectRatio}, duration: ${boardItem.actualDurationSeconds})`
    );
    assert(
      boardItem.canonicalProductionReadiness === CanonicalProductionReadiness.RENDER_VALID_BUT_EDITING,
      'Augmented board item contains correct canonical production readiness'
    );
  }

  // Test 20: Evaluate publish readiness through PublishingService
  const publishReadiness = await publishingService.validatePublishReadiness(testVideoId, { skipAudit: true });
  assert(
    publishReadiness.renderValidationStatus === RenderValidationStatus.VALID,
    'Publish readiness response includes augmented renderValidationStatus'
  );

  // Test 21: Verify canonicalProductionReadiness is included in publish readiness response
  assert(
    publishReadiness.canonicalProductionReadiness === CanonicalProductionReadiness.RENDER_VALID_BUT_EDITING,
    'Publish readiness response includes augmented canonicalProductionReadiness'
  );

  // Clean up test video
  console.log(`\nCleaning up verification test video ${testVideoId}...`);
  await videosRepository.deleteRecord(testVideoId).catch(() => {});

  // Restore original googleSheetsClient.isConfigured method
  googleSheetsClient.isConfigured = originalIsConfigured;

  console.log('\n================================================================');
  console.log(`VERIFICATION COMPLETE: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('================================================================\n');
}
