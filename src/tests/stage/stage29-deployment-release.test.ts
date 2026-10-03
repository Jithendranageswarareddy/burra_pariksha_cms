/**
 * BURRA PARIKSHA CMS — Stage 29 Deployment & Release Architecture Test Suite
 *
 * Verifies:
 * 1. Coverage of all 8 steps in the canonical deployment pipeline.
 * 2. Complete validation of all 13 items in the Mandatory Release Checklist.
 * 3. Cloud Run serverless scale-to-zero configuration and COST-001 budget compliance.
 * 4. Production smoke test evaluation (healthy pass vs failure requiring rollback).
 * 5. Production workflow test gate verification.
 * 6. Automated rollback plan generation and command construction.
 * 7. Rejection of release if any checklist item fails.
 * 8. Zod schema validation across manifests, configs, and rollback plans.
 */

import {
  DeploymentPipelineStep,
  ReleaseChecklistItem,
  ReleaseStatus,
  RollbackTrigger,
  CloudRunDeployConfigSchema,
  CloudRunDeployConfig,
  SmokeTestResultSchema,
  SmokeTestResult,
  RollbackPlanSchema,
  RollbackPlan,
  DeploymentReleaseManifestSchema,
  DeploymentReleaseManifest,
  CANONICAL_DEPLOYMENT_PIPELINE,
  MANDATORY_RELEASE_CHECKLIST_ITEMS,
  validateReleaseChecklist,
  evaluateSmokeTest,
  generateRollbackExecutionPlan,
  validateCloudRunConfig,
} from '../../types/deployment-release';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runStage29DeploymentReleaseSuite() {
  console.log('================================================================================');
  console.log('STAGE 29: DEPLOYMENT & RELEASE ARCHITECTURE TEST SUITE');
  console.log('================================================================================\n');

  let passedTests = 0;

  // TEST 1: Full coverage and ordering of 8-step deployment pipeline
  console.log('Test 1: Verifying 8-step canonical deployment pipeline...');
  assert(CANONICAL_DEPLOYMENT_PIPELINE.length === 8, `Expected 8 deployment pipeline steps, got ${CANONICAL_DEPLOYMENT_PIPELINE.length}`);
  
  const expectedSteps: DeploymentPipelineStep[] = [
    DeploymentPipelineStep.STEP_1_GITHUB_COMMIT,
    DeploymentPipelineStep.STEP_2_REVIEW,
    DeploymentPipelineStep.STEP_3_MERGE,
    DeploymentPipelineStep.STEP_4_DEPLOY,
    DeploymentPipelineStep.STEP_5_CLOUD_RUN,
    DeploymentPipelineStep.STEP_6_SMOKE_TEST,
    DeploymentPipelineStep.STEP_7_WORKFLOW_TEST,
    DeploymentPipelineStep.STEP_8_RELEASE,
  ];

  for (let i = 0; i < 8; i++) {
    const stepDef = CANONICAL_DEPLOYMENT_PIPELINE[i];
    assert(stepDef.step === expectedSteps[i], `Step ${i + 1} mismatch: expected ${expectedSteps[i]}, got ${stepDef.step}`);
    assert(stepDef.stepNumber === i + 1, `Step number mismatch at index ${i}`);
    assert(stepDef.actor.length >= 2, `Step ${stepDef.name} must have valid actor`);
    assert(stepDef.description.length >= 10, `Step ${stepDef.name} must have valid description`);
  }
  console.log('  ✔ All 8 deployment pipeline steps registered in strict sequential order');
  passedTests++;

  // TEST 2: Complete validation of 13-item Mandatory Release Checklist
  console.log('\nTest 2: Verifying 13-item Mandatory Release Checklist registry...');
  assert(MANDATORY_RELEASE_CHECKLIST_ITEMS.length === 13, `Expected 13 checklist items, got ${MANDATORY_RELEASE_CHECKLIST_ITEMS.length}`);
  
  const expectedItems: ReleaseChecklistItem[] = [
    ReleaseChecklistItem.GITHUB_COMMIT,
    ReleaseChecklistItem.TESTS,
    ReleaseChecklistItem.ENVIRONMENT,
    ReleaseChecklistItem.DATABASE,
    ReleaseChecklistItem.API,
    ReleaseChecklistItem.FRONTEND,
    ReleaseChecklistItem.MEDIA,
    ReleaseChecklistItem.AUTHENTICATION,
    ReleaseChecklistItem.RBAC,
    ReleaseChecklistItem.WORKFLOW,
    ReleaseChecklistItem.CLOUD_RUN,
    ReleaseChecklistItem.PRODUCTION_SMOKE_TEST,
    ReleaseChecklistItem.ROLLBACK_PLAN,
  ];

  for (const item of expectedItems) {
    assert(MANDATORY_RELEASE_CHECKLIST_ITEMS.includes(item), `Missing mandatory checklist item: ${item}`);
  }
  console.log('  ✔ All 13 mandatory release checklist items verified');
  passedTests++;

  // TEST 3: Cloud Run configuration validation & cost ceiling check
  console.log('\nTest 3: Enforcing Cloud Run scale-to-zero and cost ceiling (AP-012, COST-001)...');
  const validConfig: CloudRunDeployConfig = {
    serviceName: 'burra-pariksha-cms',
    region: 'asia-south1',
    minInstances: 0, // Inviolable scale-to-zero
    maxInstances: 2,
    memoryLimit: '512Mi',
    cpuLimit: 1,
    port: 3000,
    monthlyBudgetInr: 0, // ₹0 free tier
    allowUnauthenticated: true,
  };

  const parsedConfig = CloudRunDeployConfigSchema.parse(validConfig);
  assert(parsedConfig.minInstances === 0, 'minInstances must be 0');
  
  const validEval = validateCloudRunConfig(validConfig);
  assert(validEval.valid && validEval.costCompliant, 'Valid config must pass evaluation');

  // Negative test: minInstances > 0 must fail
  const invalidScaleConfig: CloudRunDeployConfig = { ...validConfig, minInstances: 1 };
  const invalidScaleEval = validateCloudRunConfig(invalidScaleConfig);
  assert(!invalidScaleEval.valid && !invalidScaleEval.costCompliant, 'minInstances > 0 must be rejected');
  assert(invalidScaleEval.reason?.includes('COST-001'), 'Rejection must cite COST-001');

  // Negative test: budget > 100 must fail
  const invalidCostConfig: CloudRunDeployConfig = { ...validConfig, monthlyBudgetInr: 150 };
  const invalidCostEval = validateCloudRunConfig(invalidCostConfig);
  assert(!invalidCostEval.valid, 'Budget > ₹100 must be rejected');
  console.log('  ✔ Cloud Run scale-to-zero and ₹100 INR budget ceiling strictly enforced');
  passedTests++;

  // TEST 4: Production smoke test evaluation (success & failure cases)
  console.log('\nTest 4: Evaluating production smoke test conditions...');
  const passingSmokeTest: SmokeTestResult = {
    healthEndpointPassed: true,
    spaIndexPassed: true,
    dbConnectionPassed: true,
    authGuardPassed: true,
    latencyMs: 142,
    httpStatusCode: 200,
    timestamp: new Date().toISOString(),
  };

  const smokeEvalPass = evaluateSmokeTest(passingSmokeTest);
  assert(smokeEvalPass.passed && !smokeEvalPass.requiresRollback, 'Passing smoke test must not trigger rollback');

  const failingHealthTest: SmokeTestResult = {
    ...passingSmokeTest,
    healthEndpointPassed: false,
    httpStatusCode: 500,
  };
  const smokeEvalFail = evaluateSmokeTest(failingHealthTest);
  assert(!smokeEvalFail.passed && smokeEvalFail.requiresRollback, 'Failed health check must trigger rollback');
  assert(smokeEvalFail.failureReason?.includes('/api/health'), 'Failure reason must cite health endpoint');

  const highLatencyTest: SmokeTestResult = {
    ...passingSmokeTest,
    latencyMs: 6500,
  };
  const smokeEvalLatency = evaluateSmokeTest(highLatencyTest);
  assert(!smokeEvalLatency.passed && smokeEvalLatency.requiresRollback, 'High latency must trigger rollback');
  console.log('  ✔ Production smoke test evaluator correctly handles pass and rollback triggers');
  passedTests++;

  // TEST 5: Production workflow test gate verification
  console.log('\nTest 5: Verifying production workflow test gating...');
  const completeChecklist: Record<ReleaseChecklistItem, boolean> = {
    [ReleaseChecklistItem.GITHUB_COMMIT]: true,
    [ReleaseChecklistItem.TESTS]: true,
    [ReleaseChecklistItem.ENVIRONMENT]: true,
    [ReleaseChecklistItem.DATABASE]: true,
    [ReleaseChecklistItem.API]: true,
    [ReleaseChecklistItem.FRONTEND]: true,
    [ReleaseChecklistItem.MEDIA]: true,
    [ReleaseChecklistItem.AUTHENTICATION]: true,
    [ReleaseChecklistItem.RBAC]: true,
    [ReleaseChecklistItem.WORKFLOW]: true,
    [ReleaseChecklistItem.CLOUD_RUN]: true,
    [ReleaseChecklistItem.PRODUCTION_SMOKE_TEST]: true,
    [ReleaseChecklistItem.ROLLBACK_PLAN]: true,
  };

  const checklistEvalPass = validateReleaseChecklist(completeChecklist);
  assert(checklistEvalPass.allPassed && checklistEvalPass.missingItems.length === 0, 'Complete checklist must pass');
  console.log('  ✔ Complete 13-item checklist successfully validates release readiness');
  passedTests++;

  // TEST 6: Automated rollback plan generation
  console.log('\nTest 6: Verifying automated rollback execution plan generation...');
  const rollbackPlan = generateRollbackExecutionPlan(
    'burra-pariksha-cms',
    'rev-2026-10-02-002',
    'rev-2026-10-02-001',
    RollbackTrigger.SMOKE_TEST_FAILURE,
    'Health check failed with 500 Internal Server Error'
  );

  const parsedRollback = RollbackPlanSchema.parse(rollbackPlan);
  assert(parsedRollback.trafficPercentToPrevious === 100, 'Traffic to previous revision must be 100%');
  assert(parsedRollback.rollbackCommand.includes('--to-revisions=rev-2026-10-02-001=100'), 'Command must shift 100% traffic to previous revision');
  assert(parsedRollback.trigger === RollbackTrigger.SMOKE_TEST_FAILURE, 'Trigger must record smoke test failure');
  console.log('  ✔ Automated rollback plan and gcloud traffic command generated accurately');
  passedTests++;

  // TEST 7: Release checklist rejection on partial or missing items
  console.log('\nTest 7: Enforcing strict rejection on incomplete checklist items...');
  const incompleteChecklist = {
    ...completeChecklist,
    [ReleaseChecklistItem.ROLLBACK_PLAN]: false,
    [ReleaseChecklistItem.RBAC]: false,
  };

  const checklistEvalFail = validateReleaseChecklist(incompleteChecklist);
  assert(!checklistEvalFail.allPassed, 'Incomplete checklist must fail');
  assert(checklistEvalFail.missingItems.length === 2, 'Must report exactly 2 missing items');
  assert(checklistEvalFail.missingItems.includes(ReleaseChecklistItem.ROLLBACK_PLAN), 'Must cite missing ROLLBACK_PLAN');
  assert(checklistEvalFail.missingItems.includes(ReleaseChecklistItem.RBAC), 'Must cite missing RBAC');
  console.log('  ✔ Release blocked when checklist items are incomplete or missing');
  passedTests++;

  // TEST 8: Full Zod schema validation across complete Deployment Manifest
  console.log('\nTest 8: Validating full DeploymentReleaseManifest Zod schema...');
  const completeManifest: DeploymentReleaseManifest = {
    releaseId: 'REL-2026-10-02-001',
    version: 'v1.1.0',
    commitSha: 'f6525ed3052aeb27544b717f8d7663b89c346a21',
    status: ReleaseStatus.VERIFIED,
    cloudRunConfig: validConfig,
    checklistVerification: completeChecklist,
    smokeTestResult: passingSmokeTest,
    rollbackPlan,
  };

  const parsedManifest = DeploymentReleaseManifestSchema.parse(completeManifest);
  assert(parsedManifest.releaseId === 'REL-2026-10-02-001', 'Manifest releaseId mismatch');
  assert(parsedManifest.status === ReleaseStatus.VERIFIED, 'Manifest status must be VERIFIED');
  assert(parsedManifest.cloudRunConfig.minInstances === 0, 'Manifest Cloud Run minInstances must be 0');
  console.log('  ✔ DeploymentReleaseManifest Zod schema validated accurately');
  passedTests++;

  console.log('\n================================================================================');
  console.log(`STAGE 29 DEPLOYMENT & RELEASE COMPLETE: ${passedTests}/8 TEST SUITES PASSED`);
  console.log('================================================================================\n');
}

runStage29DeploymentReleaseSuite().catch((err) => {
  console.error('STAGE 29 TEST EXECUTION FAILED:', err);
  process.exit(1);
});
