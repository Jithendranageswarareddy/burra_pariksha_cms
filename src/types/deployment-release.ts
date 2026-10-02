/**
 * BURRA PARIKSHA CMS — Stage 29 Deployment & Release Architecture
 *
 * Formally codifies:
 * 1. The Post-Acceptance Deployment Pipeline (GitHub -> Commit -> Review -> Merge -> Deploy -> Cloud Run -> Smoke Test -> Workflow Test -> Release).
 * 2. The 13-Item Mandatory Release Checklist.
 * 3. Cloud Run Serverless Configuration & Cost Ceiling Controls.
 * 4. Production Smoke Testing & Instant Rollback Automation.
 */

import { z } from 'zod';

// ============================================================================
// 1. ENUMS & IDENTIFIERS
// ============================================================================

export enum DeploymentPipelineStep {
  STEP_1_GITHUB_COMMIT = 'STEP_1_GITHUB_COMMIT',
  STEP_2_REVIEW = 'STEP_2_REVIEW',
  STEP_3_MERGE = 'STEP_3_MERGE',
  STEP_4_DEPLOY = 'STEP_4_DEPLOY',
  STEP_5_CLOUD_RUN = 'STEP_5_CLOUD_RUN',
  STEP_6_SMOKE_TEST = 'STEP_6_SMOKE_TEST',
  STEP_7_WORKFLOW_TEST = 'STEP_7_WORKFLOW_TEST',
  STEP_8_RELEASE = 'STEP_8_RELEASE',
}

export enum ReleaseChecklistItem {
  GITHUB_COMMIT = 'GITHUB_COMMIT',
  TESTS = 'TESTS',
  ENVIRONMENT = 'ENVIRONMENT',
  DATABASE = 'DATABASE',
  API = 'API',
  FRONTEND = 'FRONTEND',
  MEDIA = 'MEDIA',
  AUTHENTICATION = 'AUTHENTICATION',
  RBAC = 'RBAC',
  WORKFLOW = 'WORKFLOW',
  CLOUD_RUN = 'CLOUD_RUN',
  PRODUCTION_SMOKE_TEST = 'PRODUCTION_SMOKE_TEST',
  ROLLBACK_PLAN = 'ROLLBACK_PLAN',
}

export enum ReleaseStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  VERIFIED = 'VERIFIED',
  FAILED = 'FAILED',
  ROLLED_BACK = 'ROLLED_BACK',
}

export enum RollbackTrigger {
  SMOKE_TEST_FAILURE = 'SMOKE_TEST_FAILURE',
  WORKFLOW_REGRESSION = 'WORKFLOW_REGRESSION',
  HIGH_ERROR_RATE = 'HIGH_ERROR_RATE',
  LATENCY_SPIKE = 'LATENCY_SPIKE',
  MANUAL_ABORT = 'MANUAL_ABORT',
}

// ============================================================================
// 2. SCHEMAS & INTERFACES
// ============================================================================

export const CloudRunDeployConfigSchema = z.object({
  serviceName: z.string().min(3),
  region: z.string().min(3),
  minInstances: z.number().int().min(0).max(0), // Scale-to-zero invariant (AP-012, COST-001)
  maxInstances: z.number().int().min(1).max(5),
  memoryLimit: z.string().regex(/^(256Mi|512Mi|1Gi|2Gi)$/),
  cpuLimit: z.number().min(0.5).max(2),
  port: z.number().int().min(1024).max(65535),
  monthlyBudgetInr: z.number().max(100), // Max ₹100 INR/month
  allowUnauthenticated: z.boolean(),
});

export type CloudRunDeployConfig = z.infer<typeof CloudRunDeployConfigSchema>;

export const SmokeTestResultSchema = z.object({
  healthEndpointPassed: z.boolean(),
  spaIndexPassed: z.boolean(),
  dbConnectionPassed: z.boolean(),
  authGuardPassed: z.boolean(),
  latencyMs: z.number().nonnegative(),
  httpStatusCode: z.number().int(),
  timestamp: z.string().datetime(),
});

export type SmokeTestResult = z.infer<typeof SmokeTestResultSchema>;

export const RollbackPlanSchema = z.object({
  serviceName: z.string().min(3),
  targetRevision: z.string().min(3),
  previousRevision: z.string().min(3),
  trigger: z.nativeEnum(RollbackTrigger),
  reason: z.string().min(5),
  trafficPercentToPrevious: z.number().int().min(100).max(100),
  rollbackCommand: z.string().min(10),
  timestamp: z.string().datetime(),
});

export type RollbackPlan = z.infer<typeof RollbackPlanSchema>;

export const DeploymentReleaseManifestSchema = z.object({
  releaseId: z.string().min(3),
  version: z.string().regex(/^v\d+\.\d+\.\d+$/),
  commitSha: z.string().length(40),
  status: z.nativeEnum(ReleaseStatus),
  cloudRunConfig: CloudRunDeployConfigSchema,
  checklistVerification: z.record(z.nativeEnum(ReleaseChecklistItem), z.boolean()),
  smokeTestResult: SmokeTestResultSchema.optional(),
  rollbackPlan: RollbackPlanSchema.optional(),
});

export type DeploymentReleaseManifest = z.infer<typeof DeploymentReleaseManifestSchema>;

export interface DeploymentPipelineStepDefinition {
  stepNumber: number;
  step: DeploymentPipelineStep;
  name: string;
  description: string;
  actor: string;
}

// ============================================================================
// 3. CANONICAL REGISTRIES
// ============================================================================

export const CANONICAL_DEPLOYMENT_PIPELINE: DeploymentPipelineStepDefinition[] = [
  { stepNumber: 1, step: DeploymentPipelineStep.STEP_1_GITHUB_COMMIT, name: 'GitHub Commit', description: 'Deterministic commit SHA with clean git tree', actor: 'Developer / AI' },
  { stepNumber: 2, step: DeploymentPipelineStep.STEP_2_REVIEW, name: 'Review', description: 'Independent forensic audit and SME review', actor: 'Antigravity / SME' },
  { stepNumber: 3, step: DeploymentPipelineStep.STEP_3_MERGE, name: 'Merge', description: 'Fast-forward merge to protected main branch with release tag', actor: 'Product Owner' },
  { stepNumber: 4, step: DeploymentPipelineStep.STEP_4_DEPLOY, name: 'Deploy', description: 'Trigger container build via multi-stage Dockerfile', actor: 'CI/CD / Developer' },
  { stepNumber: 5, step: DeploymentPipelineStep.STEP_5_CLOUD_RUN, name: 'Cloud Run', description: 'Serverless container deployment with scale-to-zero', actor: 'Google Cloud Platform' },
  { stepNumber: 6, step: DeploymentPipelineStep.STEP_6_SMOKE_TEST, name: 'Smoke Test', description: 'Automated live HTTP health and precondition verification', actor: 'Automated Suite' },
  { stepNumber: 7, step: DeploymentPipelineStep.STEP_7_WORKFLOW_TEST, name: 'Workflow Test', description: 'Live Telugu educational workflow telemetry audit', actor: 'Product Owner / SME' },
  { stepNumber: 8, step: DeploymentPipelineStep.STEP_8_RELEASE, name: 'Release', description: '100% production traffic routing and formal stage closure', actor: 'Product Owner' },
];

export const MANDATORY_RELEASE_CHECKLIST_ITEMS: ReleaseChecklistItem[] = [
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

// ============================================================================
// 4. EVALUATOR & GOVERNANCE FUNCTIONS
// ============================================================================

/**
 * Validates that all 13 Release Checklist items are satisfied (true).
 */
export function validateReleaseChecklist(
  checklist: Record<ReleaseChecklistItem, boolean>
): {
  allPassed: boolean;
  missingItems: ReleaseChecklistItem[];
} {
  const missingItems: ReleaseChecklistItem[] = [];

  for (const item of MANDATORY_RELEASE_CHECKLIST_ITEMS) {
    if (!checklist[item]) {
      missingItems.push(item);
    }
  }

  return {
    allPassed: missingItems.length === 0,
    missingItems,
  };
}

/**
 * Evaluates live production smoke test results.
 * If any critical endpoint fails or latency is excessive, flags failure and requests rollback.
 */
export function evaluateSmokeTest(result: SmokeTestResult): {
  passed: boolean;
  requiresRollback: boolean;
  failureReason?: string;
} {
  if (!result.healthEndpointPassed) {
    return { passed: false, requiresRollback: true, failureReason: 'Health endpoint /api/health failed' };
  }
  if (!result.spaIndexPassed) {
    return { passed: false, requiresRollback: true, failureReason: 'SPA index / failed to load production HTML bundle' };
  }
  if (!result.dbConnectionPassed) {
    return { passed: false, requiresRollback: true, failureReason: 'Firestore database connectivity precondition failed' };
  }
  if (!result.authGuardPassed) {
    return { passed: false, requiresRollback: true, failureReason: 'Authentication guard precondition failed (unauthorized access permitted)' };
  }
  if (result.httpStatusCode !== 200) {
    return { passed: false, requiresRollback: true, failureReason: `Unexpected HTTP status: ${result.httpStatusCode}` };
  }
  if (result.latencyMs > 5000) {
    return { passed: false, requiresRollback: true, failureReason: `Smoke test latency exceeded 5000ms threshold: ${result.latencyMs}ms` };
  }

  return { passed: true, requiresRollback: false };
}

/**
 * Generates an automated Cloud Run rollback execution plan.
 */
export function generateRollbackExecutionPlan(
  serviceName: string,
  currentRevision: string,
  previousRevision: string,
  trigger: RollbackTrigger,
  reason: string
): RollbackPlan {
  const rollbackCommand = `gcloud run services update-traffic ${serviceName} --to-revisions=${previousRevision}=100`;

  return {
    serviceName,
    targetRevision: currentRevision,
    previousRevision,
    trigger,
    reason,
    trafficPercentToPrevious: 100,
    rollbackCommand,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Validates Cloud Run deployment parameters against cost invariants (AP-012, COST-001).
 */
export function validateCloudRunConfig(config: CloudRunDeployConfig): {
  valid: boolean;
  costCompliant: boolean;
  reason?: string;
} {
  if (config.minInstances > 0) {
    return {
      valid: false,
      costCompliant: false,
      reason: `Violation of COST-001 and AP-012: minInstances must be 0 for serverless scale-to-zero. Configured: ${config.minInstances}`,
    };
  }

  if (config.monthlyBudgetInr > 100) {
    return {
      valid: false,
      costCompliant: false,
      reason: `Violation of COST-001: monthlyBudgetInr cannot exceed ₹100 INR. Configured: ₹${config.monthlyBudgetInr}`,
    };
  }

  return { valid: true, costCompliant: true };
}
