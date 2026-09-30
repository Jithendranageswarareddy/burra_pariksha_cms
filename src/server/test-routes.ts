/**
 * BURRA PARIKSHA CMS - Isolated Test Harness Routes
 * Stage 7 Phase 4: API Convergence & Test Route Isolation
 *
 * Houses all diagnostic, verification, and test execution endpoints.
 * Mounts strictly in non-production environments or when ENABLE_TEST_HARNESS=true.
 */

import express, { Request, Response } from 'express';

export const testRouter = express.Router();

// Early-exit guard for production
testRouter.use((req: Request, res: Response, next) => {
  if (process.env.NODE_ENV === 'production' && process.env.ENABLE_TEST_HARNESS !== 'true') {
    res.status(404).json({
      success: false,
      error: 'Test runner endpoints are disabled in production environment.',
    });
    return;
  }
  next();
});

// ----------------------------------------------------
// Diagnostic & Legacy Test Verification Endpoints
// ----------------------------------------------------

testRouter.all('/test/task4', async (req: Request, res: Response) => {
  try {
    const { runTask4QuestionCreationEngineVerification } = await import('../tests/task4-question-creation-engine-verification');
    const report = await runTask4QuestionCreationEngineVerification();
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: 'Task 4 verification failed', message: err?.message || 'Unknown error' });
  }
});

testRouter.all('/test/phase5', async (req: Request, res: Response) => {
  try {
    const { runPhase05QuestionContractVerification } = await import('../tests/phase-5-question-model');
    const report = await runPhase05QuestionContractVerification();
    res.json(report);
  } catch (err: any) {
    res.status(500).json({ error: 'Phase 05 verification failed', message: err?.message || 'Unknown error' });
  }
});

testRouter.get('/tests/task3f4', async (req: Request, res: Response) => {
  try {
    const { runTask3F4SnapshotVerification } = await import('../tests/task3f4-snapshot-exporter-verification');
    const result = await runTask3F4SnapshotVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 3F.4 tests failed' });
  }
});

testRouter.get('/tests/phase5', async (req: Request, res: Response) => {
  try {
    const { runPhase05QuestionContractVerification } = await import('../tests/phase-5-question-model');
    const result = await runPhase05QuestionContractVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Phase 05 tests failed' });
  }
});

testRouter.get('/tests/task3f46', async (req: Request, res: Response) => {
  try {
    const { runTask3F46RestoreValidatorVerification } = await import('../tests/task3f4-restore-validator-verification');
    const result = await runTask3F46RestoreValidatorVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 3F.4.6 tests failed' });
  }
});

testRouter.get('/tests/task3f47a', async (req: Request, res: Response) => {
  try {
    const { runTask3F47AGranularRestoreVerification } = await import('../tests/task3f47a-granular-question-restore-verification');
    const result = await runTask3F47AGranularRestoreVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 3F.4.7A tests failed' });
  }
});

testRouter.get('/tests/task3f47b', async (req: Request, res: Response) => {
  try {
    const { runTask3F47BGranularVideoRestoreVerification } = await import('../tests/task3f47b-granular-video-restore-verification');
    const result = await runTask3F47BGranularVideoRestoreVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 3F.4.7B tests failed' });
  }
});

testRouter.get('/tests/task3f47c', async (req: Request, res: Response) => {
  try {
    const { runTask3F47CGranularScriptRestoreVerification } = await import('../tests/task3f47c-granular-script-restore-verification');
    const result = await runTask3F47CGranularScriptRestoreVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 3F.4.7C tests failed' });
  }
});

testRouter.get('/tests/task3f47d', async (req: Request, res: Response) => {
  try {
    const { runTask3F47DGranularThumbnailRestoreVerification } = await import('../tests/task3f47d-granular-thumbnail-restore-verification');
    const result = await runTask3F47DGranularThumbnailRestoreVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 3F.4.7D tests failed' });
  }
});

testRouter.get('/tests/task2', async (req: Request, res: Response) => {
  try {
    const { runTask2Verification } = await import('../tests/task2-content-master-verification');
    const result = await runTask2Verification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 2 tests failed' });
  }
});

testRouter.get('/tests/phase8b', async (req: Request, res: Response) => {
  try {
    const { runPhase8bVerification } = await import('../tests/phase8b-verification');
    const result = await runPhase8bVerification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Phase 8b tests failed' });
  }
});

testRouter.get('/tests/phase9', async (req: Request, res: Response) => {
  try {
    const { runPhase9Verification } = await import('../tests/phase9-verification');
    const result = await runPhase9Verification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Phase 9 tests failed' });
  }
});

testRouter.get('/tests/phase10', async (req: Request, res: Response) => {
  try {
    const { runPhase10Verification } = await import('../tests/phase10-verification');
    const result = await runPhase10Verification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Phase 10 tests failed' });
  }
});

testRouter.get('/tests/phase11b', async (req: Request, res: Response) => {
  try {
    const { runPhase11bAuthVerification } = await import('../tests/phase11b-auth-verification');
    const result = await runPhase11bAuthVerification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Phase 11b tests failed' });
  }
});

testRouter.get('/tests/task9', async (req: Request, res: Response) => {
  try {
    const { runTask9AuthVerification } = await import('../tests/task9-auth-verification');
    const result = await runTask9AuthVerification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 9 tests failed' });
  }
});

testRouter.get('/tests/task2b', async (req: Request, res: Response) => {
  try {
    const { runTask2bTaxonomyVerification } = await import('../tests/task2b-taxonomy-verification');
    const result = await runTask2bTaxonomyVerification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 2b tests failed' });
  }
});

testRouter.get('/tests/a0232b', async (req: Request, res: Response) => {
  try {
    const { runIdempotencyConcurrencyResilienceTests } = await import('../tests/idempotency-concurrency-resilience.test');
    const result = await runIdempotencyConcurrencyResilienceTests();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'A0232B tests failed' });
  }
});

testRouter.get('/tests/task2c', async (req: Request, res: Response) => {
  try {
    const { runTask2cQuestionVerification } = await import('../tests/task2c-question-verification');
    const result = await runTask2cQuestionVerification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 2c tests failed' });
  }
});

testRouter.get('/tests/task3d1', async (req: Request, res: Response) => {
  try {
    const { runTask3D1Verification } = await import('../tests/task3d1-assignment-verification');
    const result = await runTask3D1Verification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 3D.1 tests failed' });
  }
});

testRouter.get('/tests/task3d2', async (req: Request, res: Response) => {
  try {
    const { runTask3D2Verification } = await import('../tests/task3d2-rbac-verification');
    const result = await runTask3D2Verification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 3D.2 tests failed' });
  }
});

testRouter.get('/tests/task3d3', async (req: Request, res: Response) => {
  try {
    const { runTask3D3Verification } = await import('../tests/task3d3-review-workflow-verification');
    const result = await runTask3D3Verification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 3D.3 tests failed' });
  }
});

testRouter.get('/tests/task3d4', async (req: Request, res: Response) => {
  try {
    const { runTask3D4Verification } = await import('../tests/task3d4-script-designer-workflow-verification');
    const result = await runTask3D4Verification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 3D.4 tests failed' });
  }
});

testRouter.get('/tests/task3d5', async (req: Request, res: Response) => {
  try {
    const { runTask3D5Verification } = await import('../tests/task3d5-workload-dashboard-verification');
    const result = await runTask3D5Verification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 3D.5 tests failed' });
  }
});

testRouter.get('/tests/task5', async (req: Request, res: Response) => {
  try {
    const { runTask5QuestionValidationEngineVerification } = await import('../tests/task5-question-validation-engine-verification');
    const result = await runTask5QuestionValidationEngineVerification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 5 tests failed' });
  }
});

testRouter.get('/tests/task7b', async (req: Request, res: Response) => {
  try {
    const { runTask7bVerification } = await import('../tests/task7b-unified-studio-verification');
    const result = await runTask7bVerification();
    res.json({ success: true, passed: result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 7b tests failed' });
  }
});

testRouter.get('/tests/task7c', async (req: Request, res: Response) => {
  try {
    const { runTask7CVerificationSuite } = await import('../tests/task7c-question-studio-quality-verification');
    const result = await runTask7CVerificationSuite();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 7c tests failed' });
  }
});

testRouter.get('/tests/task8b', async (req: Request, res: Response) => {
  try {
    const { runTask8BVerificationSuite } = await import('../tests/task8b-social-content-foundation-verification');
    const result = await runTask8BVerificationSuite();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 8b tests failed' });
  }
});

testRouter.get('/tests/task8c', async (req: Request, res: Response) => {
  try {
    const { runTask8CVerificationSuite } = await import('../tests/task8c-hook-presentation-engine-verification');
    const result = await runTask8CVerificationSuite();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 8c tests failed' });
  }
});

testRouter.get('/tests/task8e', async (req: Request, res: Response) => {
  try {
    const { runTask8EVerificationSuite } = await import('../tests/task8e-social-metadata-generator-verification');
    const result = await runTask8EVerificationSuite();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 8e tests failed' });
  }
});

testRouter.get('/tests/task8f', async (req: Request, res: Response) => {
  try {
    const { runTask8FVerificationSuite } = await import('../tests/task8f-multi-platform-adaptation-verification');
    const result = await runTask8FVerificationSuite();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 8f tests failed' });
  }
});

testRouter.get('/tests/task8d', async (req: Request, res: Response) => {
  try {
    const { runTask8dTeleprompterSpokenEnhancerVerification } = await import('../tests/task8d-teleprompter-spoken-enhancer-verification');
    const result = await runTask8dTeleprompterSpokenEnhancerVerification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 8d tests failed' });
  }
});

testRouter.get('/tests/task8g', async (req: Request, res: Response) => {
  try {
    const { runTask8GVerificationSuite } = await import('../tests/task8g-social-quality-engagement-verification');
    const result = await runTask8GVerificationSuite();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 8g tests failed' });
  }
});

testRouter.get('/tests/task8h', async (req: Request, res: Response) => {
  try {
    const { runTask8hVerification } = await import('../tests/task8h-social-review-workflow-verification');
    const result = await runTask8hVerification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 8h tests failed' });
  }
});

testRouter.get('/tests/task8i', async (req: Request, res: Response) => {
  try {
    const { runPhase8iSecurityVerification } = await import('../tests/phase8i-security-qa-verification');
    const result = await runPhase8iSecurityVerification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Phase 8i tests failed' });
  }
});

testRouter.get('/tests/phase9-workflow', async (req: Request, res: Response) => {
  try {
    const { runPhase9WorkflowVerification } = await import('../tests/phase9-content-workflow-verification');
    const result = await runPhase9WorkflowVerification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Phase 9 workflow tests failed' });
  }
});

testRouter.get('/tests/phase13-step4', async (req: Request, res: Response) => {
  try {
    const { runPhase13Step4Tests } = await import('../tests/phase13-step4-publishing-assignments');
    const result = await runPhase13Step4Tests();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Phase 13.4 tests failed' });
  }
});

testRouter.get('/tests/task3f55', async (req: Request, res: Response) => {
  try {
    const { runTask3F55GlobalSearchVerification } = await import('../tests/task3f55-global-search-routing-verification');
    const result = await runTask3F55GlobalSearchVerification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 3F.5.5 verification failed' });
  }
});

testRouter.get('/tests/phase2', async (req: Request, res: Response) => {
  try {
    const { runPhase2Verification } = await import('../tests/phase2-verification');
    const result = await runPhase2Verification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Phase 2 tests failed' });
  }
});

testRouter.get('/tests/phase3', async (req: Request, res: Response) => {
  try {
    const { runPhase3Verification } = await import('../tests/phase3-verification');
    const result = await runPhase3Verification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Phase 3 tests failed' });
  }
});

testRouter.get('/tests/phase4', async (req: Request, res: Response) => {
  try {
    const { runPhase4Verification } = await import('../tests/phase4-verification');
    const result = await runPhase4Verification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Phase 4 tests failed' });
  }
});

testRouter.all('/tests/phase04-verification', async (req: Request, res: Response) => {
  try {
    const { runPhase04TaxonomyVerification } = await import('../tests/phase04-taxonomy-verification');
    const result = await runPhase04TaxonomyVerification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Phase 04 taxonomy verification failed' });
  }
});

testRouter.get('/tests/phase04-taxonomy', async (req: Request, res: Response) => {
  try {
    const { runPhase04TaxonomyVerification } = await import('../tests/phase04-taxonomy-verification');
    const result = await runPhase04TaxonomyVerification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Phase 04 taxonomy verification failed' });
  }
});

testRouter.get('/tests/phase6', async (req: Request, res: Response) => {
  try {
    const { runPhase6Verification } = await import('../tests/phase6-verification');
    const result = await runPhase6Verification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Phase 6 tests failed' });
  }
});

testRouter.get('/tests/phase7', async (req: Request, res: Response) => {
  try {
    const { runPhase7Verification } = await import('../tests/phase7-verification');
    const result = await runPhase7Verification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Phase 7 tests failed' });
  }
});

testRouter.get('/tests/phase8a', async (req: Request, res: Response) => {
  try {
    const { runPhase8aVerification } = await import('../tests/phase8a-verification');
    const result = await runPhase8aVerification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Phase 8A tests failed' });
  }
});

testRouter.get('/tests/task7', async (req: Request, res: Response) => {
  try {
    const { runTask7Verification } = await import('../tests/task7-video-queue-verification');
    const result = await runTask7Verification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 7 tests failed' });
  }
});

testRouter.get('/tests/task8', async (req: Request, res: Response) => {
  try {
    const { runTask8Verification } = await import('../tests/task8-publishing-verification');
    const result = await runTask8Verification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 8 tests failed' });
  }
});

testRouter.get('/tests/task3e1', async (req: Request, res: Response) => {
  try {
    const { runTask3E1Verification } = await import('../tests/task3e1-my-work-operations-verification');
    const result = await runTask3E1Verification();
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Task 3E.1 tests failed' });
  }
});

testRouter.get('/tests/task3e2', async (req: Request, res: Response) => {
  try {
    const { runTask3E2Verification } = await import('../tests/task3e2-production-board-api');
    const result = await runTask3E2Verification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

testRouter.get('/tests/task3f47e', async (req: Request, res: Response) => {
  try {
    const { runTask3F47E1GranularPinnedCommentRestoreVerification } = await import('../tests/task3f47e-granular-pinned-comment-restore-verification');
    const result = await runTask3F47E1GranularPinnedCommentRestoreVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

testRouter.get('/tests/task3f47f', async (req: Request, res: Response) => {
  try {
    const { runTask3F47FGranularPublishingRestoreVerification } = await import('../tests/task3f47f-granular-publishing-restore-verification');
    const result = await runTask3F47FGranularPublishingRestoreVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

testRouter.get('/tests/task3f47g', async (req: Request, res: Response) => {
  try {
    const { runTask3F47GGranularAssignmentRestoreVerification } = await import('../tests/task3f47g-granular-assignment-restore-verification');
    const result = await runTask3F47GGranularAssignmentRestoreVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

testRouter.get('/tests/task3f48', async (req: Request, res: Response) => {
  try {
    const { runTask3F48FullSnapshotRestorePlannerVerification } = await import('../tests/task3f48-full-snapshot-restore-planner-verification');
    const result = await runTask3F48FullSnapshotRestorePlannerVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

testRouter.get('/tests/task3f48b', async (req: Request, res: Response) => {
  try {
    const { runTask3F48FullSnapshotPreflightVerification } = await import('../tests/task3f48-full-snapshot-preflight-verification');
    const result = await runTask3F48FullSnapshotPreflightVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

testRouter.get('/tests/task3f48c', async (req: Request, res: Response) => {
  try {
    const { runTask3F48FullSnapshotRestorePlanVerification } = await import('../tests/task3f48-full-snapshot-restore-plan-verification');
    const result = await runTask3F48FullSnapshotRestorePlanVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

testRouter.get('/tests/task3f48d', async (req: Request, res: Response) => {
  try {
    const { runTask3F48FullSnapshotRestoreExecutionVerification } = await import('../tests/task3f48-full-snapshot-restore-execution-verification');
    const result = await runTask3F48FullSnapshotRestoreExecutionVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

testRouter.get('/tests/task3f49', async (req: Request, res: Response) => {
  try {
    const { runTask3F49RecoveryStatusApiVerification } = await import('../tests/task3f49-recovery-status-api-verification');
    const result = await runTask3F49RecoveryStatusApiVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

testRouter.get('/tests/task3f49-snapshot-history', async (req: Request, res: Response) => {
  try {
    const { runTask3F49RecoverySnapshotHistoryUiVerification } = await import('../tests/task3f49-recovery-snapshot-history-ui-verification');
    const result = await runTask3F49RecoverySnapshotHistoryUiVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

testRouter.get('/tests/task3f49-dry-run', async (req: Request, res: Response) => {
  try {
    const { runTask3F49RecoveryDryRunApiVerification } = await import('../tests/task3f49-recovery-dry-run-api-verification');
    const result = await runTask3F49RecoveryDryRunApiVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

testRouter.get('/tests/task3f49-recovery-dry-run-ui-verification', async (req: Request, res: Response) => {
  try {
    const { runTask3F49RecoveryDryRunUiVerification } = await import('../tests/task3f49-recovery-dry-run-ui-verification');
    const result = await runTask3F49RecoveryDryRunUiVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

testRouter.get('/tests/task3f49-granular-restore-ui-verification', async (req: Request, res: Response) => {
  try {
    const { runTask3F49GranularRestoreUiVerification } = await import('../tests/task3f49-granular-restore-ui-verification');
    const result = await runTask3F49GranularRestoreUiVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

testRouter.get('/tests/task3f49-granular-restore', async (req: Request, res: Response) => {
  try {
    const { runTask3F49GranularRestoreApiVerification } = await import('../tests/task3f49-granular-restore-api-verification');
    const result = await runTask3F49GranularRestoreApiVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

testRouter.get('/tests/task3f49-full-restore', async (req: Request, res: Response) => {
  try {
    const { runTask3F49FullRestoreApiVerification } = await import('../tests/task3f49-full-restore-api-verification');
    const result = await runTask3F49FullRestoreApiVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

testRouter.get('/tests/task3f49-security', async (req: Request, res: Response) => {
  try {
    const { runTask3F49RecoverySecurityVerification } = await import('../tests/task3f49-recovery-security-verification');
    const result = await runTask3F49RecoverySecurityVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

testRouter.get('/tests/task3f49-ui', async (req: Request, res: Response) => {
  try {
    const { runTask3F49RecoveryAdminStatusUiVerification } = await import('../tests/task3f49-recovery-admin-status-ui-verification');
    const result = await runTask3F49RecoveryAdminStatusUiVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

testRouter.get('/tests/task3f410d', async (req: Request, res: Response) => {
  try {
    const { runTask3F410DRecoveryArchiveUiVerification } = await import('../tests/task3f410d-recovery-archive-ui-verification');
    const result = await runTask3F410DRecoveryArchiveUiVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

testRouter.get('/tests/task3f410e', async (req: Request, res: Response) => {
  try {
    const { runTask3F410EGcsSmokeTest } = await import('../tests/task3f410e-gcs-smoke-test');
    const result = await runTask3F410EGcsSmokeTest();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

testRouter.get('/tests/task3', async (req: Request, res: Response) => {
  try {
    const { runTask3TaxonomyEngineVerification } = await import('../tests/task3-taxonomy-engine-verification');
    const result = await runTask3TaxonomyEngineVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

testRouter.get('/tests/task3f410f', async (req: Request, res: Response) => {
  try {
    const { runTask3F410FSchedulerVerification } = await import('../tests/task3f410f-scheduler-verification');
    const result = await runTask3F410FSchedulerVerification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

testRouter.get('/tests/phase15-step6', async (req: Request, res: Response) => {
  try {
    const { runPhase15Step6Verification } = await import('../tests/phase15-step6-assignment-deduplication-verification');
    const result = await runPhase15Step6Verification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

testRouter.get('/tests/comment-intelligence', async (req: Request, res: Response) => {
  try {
    const { commentIntelligenceService } = await import('../lib/services/comment-intelligence.service');
    res.json({ success: true, isConfigured: true });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

testRouter.get('/tests/consensus', async (req: Request, res: Response) => {
  try {
    const { consensusService } = await import('../lib/services/consensus.service');
    res.json({ success: true, serviceActive: !!consensusService });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});

testRouter.get('/tests/phase29', async (req: Request, res: Response) => {
  try {
    const { runPhase29Verification } = await import('../tests/phase29-controlled-strategy-integration-verification');
    const result = await runPhase29Verification();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message });
  }
});
