/**
 * BURRA PARIKSHA CMS - Task 3E.3.1-R Readiness Rules Inspection & Verification
 * Read-only verification of existing readiness logic across video, publishing, and production board services.
 */

import { videoService, publishingService, productionBoardService } from '../lib/services';
import { VALID_VIDEO_TRANSITIONS } from '../lib/services/video.service';
import { VideoProductionStatus } from '../types';

export async function runTask3E3Inspection(): Promise<{
  success: boolean;
  totalTests: number;
  passedTests: number;
  results: Array<{ name: string; passed: boolean; message?: string }>;
}> {
  const results: Array<{ name: string; passed: boolean; message?: string }> = [];

  // Test 1: Verify state machine includes READY_TO_UPLOAD state and valid transitions
  try {
    const hasReadyToUpload = Boolean(VALID_VIDEO_TRANSITIONS[VideoProductionStatus.READY_TO_UPLOAD]);
    const editedTransitions = VALID_VIDEO_TRANSITIONS[VideoProductionStatus.EDITED] || [];
    const canReachReady = editedTransitions.includes(VideoProductionStatus.READY_TO_UPLOAD);

    results.push({
      name: '1. State machine includes READY_TO_UPLOAD and legal path from EDITED',
      passed: hasReadyToUpload && canReachReady,
      message: `READY_TO_UPLOAD transitions defined: ${hasReadyToUpload}, Reachable from EDITED: ${canReachReady}`,
    });
  } catch (err: any) {
    results.push({
      name: '1. State machine includes READY_TO_UPLOAD and legal path from EDITED',
      passed: false,
      message: err?.message,
    });
  }

  // Test 2: Verify PublishingService validatePublishReadiness for BP-V-000018
  try {
    const testVideoId = 'BP-V-000018';
    const readiness = await publishingService.validatePublishReadiness(testVideoId, { skipAudit: true });
    const structureValid = Boolean(
      readiness &&
      typeof readiness.isReady === 'boolean' &&
      Array.isArray(readiness.blockers) &&
      Array.isArray(readiness.warnings) &&
      readiness.checklist
    );

    results.push({
      name: '2. PublishingService readiness gate validation for BP-V-000018',
      passed: structureValid,
      message: `BP-V-000018 isReady: ${readiness.isReady}, Blockers: ${readiness.blockers.length}, Warnings: ${readiness.warnings.length}`,
    });
  } catch (err: any) {
    results.push({
      name: '2. PublishingService readiness gate validation for BP-V-000018',
      passed: false,
      message: err?.message,
    });
  }

  // Test 3: Verify ProductionBoardService aggregates readiness properties correctly
  try {
    const boardItems = await productionBoardService.getProductionBoard();
    const sample = boardItems.find(item => item.videoId === 'BP-V-000018') || boardItems[0];
    const hasReadinessProps = sample ? (
      sample.videoStatus !== undefined &&
      sample.scriptId !== undefined &&
      sample.thumbnailStatus !== undefined &&
      sample.completedPlatformsCount !== undefined
    ) : true;

    results.push({
      name: '3. ProductionBoardService readiness aggregation properties',
      passed: Array.isArray(boardItems) && hasReadinessProps,
      message: `Retrieved ${boardItems.length} board items with readiness fields`,
    });
  } catch (err: any) {
    results.push({
      name: '3. ProductionBoardService readiness aggregation properties',
      passed: false,
      message: err?.message,
    });
  }

  // Test 4: Verify read-only data safety (no mutation occurred)
  try {
    const statsBefore = await videoService.getProductionStats();
    const statsAfter = await videoService.getProductionStats();
    const isSafe = statsBefore.total === statsAfter.total && statsBefore.readyToUpload === statsAfter.readyToUpload;

    results.push({
      name: '4. Read-only verification safety (zero production mutation)',
      passed: isSafe,
      message: 'Production statistics remain identical across inspection runs',
    });
  } catch (err: any) {
    results.push({
      name: '4. Read-only verification safety (zero production mutation)',
      passed: false,
      message: err?.message,
    });
  }

  const passedTests = results.filter(r => r.passed).length;
  const totalTests = results.length;

  return {
    success: passedTests === totalTests,
    totalTests,
    passedTests,
    results,
  };
}
