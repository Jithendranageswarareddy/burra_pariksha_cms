/**
 * BURRA PARIKSHA CMS — Stage 28 Verification & Human Testing Architecture
 *
 * Formally codifies:
 * 1. The Tri-Partite Verification Architecture (Automated, Independent Audit, Human SME Testing).
 * 2. The 20-Step Canonical Execution Process.
 * 3. The Human Testing Protocol ("Observe -> Record -> Continue if safe").
 * 4. The Anti-Patching Invariant prohibiting continuous micro-patching during active testing.
 */

import { z } from 'zod';

// ============================================================================
// 1. ENUMS & IDENTIFIERS
// ============================================================================

export enum VerificationPillar {
  AUTOMATED = 'AUTOMATED',
  INDEPENDENT_AUDIT = 'INDEPENDENT_AUDIT',
  HUMAN_TESTING = 'HUMAN_TESTING',
}

export enum DefectSeverity {
  BLOCKER = 'BLOCKER',
  MAJOR = 'MAJOR',
  MINOR = 'MINOR',
  COSMETIC = 'COSMETIC',
}

export enum HumanTestingAction {
  OBSERVE = 'OBSERVE',
  RECORD = 'RECORD',
  CONTINUE_SAFE = 'CONTINUE_SAFE',
  HALT_UNSAFE = 'HALT_UNSAFE',
}

export enum ExecutionProcessStep {
  STEP_01_REQ_SUBMISSION = 'STEP_01_REQ_SUBMISSION',
  STEP_02_FORENSIC_AUDIT = 'STEP_02_FORENSIC_AUDIT',
  STEP_03_PRINCIPLES_CHECK = 'STEP_03_PRINCIPLES_CHECK',
  STEP_04_DOMAIN_MODELING = 'STEP_04_DOMAIN_MODELING',
  STEP_05_SECURITY_BOUNDARIES = 'STEP_05_SECURITY_BOUNDARIES',
  STEP_06_DATA_CONTRACTS = 'STEP_06_DATA_CONTRACTS',
  STEP_07_API_CONTRACTS = 'STEP_07_API_CONTRACTS',
  STEP_08_UI_CONTRACTS = 'STEP_08_UI_CONTRACTS',
  STEP_09_TEST_STRATEGY = 'STEP_09_TEST_STRATEGY',
  STEP_10_COST_GUARD = 'STEP_10_COST_GUARD',
  STEP_11_IMPLEMENTATION_SPEC = 'STEP_11_IMPLEMENTATION_SPEC',
  STEP_12_AI_PROMPT_AUTHORING = 'STEP_12_AI_PROMPT_AUTHORING',
  STEP_13_STUDIO_EXECUTION = 'STEP_13_STUDIO_EXECUTION',
  STEP_14_GITHUB_PUSH = 'STEP_14_GITHUB_PUSH',
  STEP_15_LOCAL_PULL_SYNC = 'STEP_15_LOCAL_PULL_SYNC',
  STEP_16_STATIC_COMPILE_CHECK = 'STEP_16_STATIC_COMPILE_CHECK',
  STEP_17_STAGE_TEST_EXECUTION = 'STEP_17_STAGE_TEST_EXECUTION',
  STEP_18_REGRESSION_EXECUTION = 'STEP_18_REGRESSION_EXECUTION',
  STEP_19_HUMAN_SME_TESTING = 'STEP_19_HUMAN_SME_TESTING',
  STEP_20_GATE_CERTIFICATION_STOP = 'STEP_20_GATE_CERTIFICATION_STOP',
}

// ============================================================================
// 2. SCHEMAS & INTERFACES
// ============================================================================

export const DefectRecordSchema = z.object({
  defectId: z.string().min(3),
  title: z.string().min(5),
  severity: z.nativeEnum(DefectSeverity),
  observedBehavior: z.string().min(10),
  expectedBehavior: z.string().min(10),
  workspaceHub: z.string().min(3),
  stepNumber: z.number().int().min(1).max(20),
  isSessionHalting: z.boolean(),
  remediationAction: z.enum(['BATCH_POST_SESSION', 'IMMEDIATE_HALT']),
});

export type DefectRecord = z.infer<typeof DefectRecordSchema>;

export const HumanTestSessionSchema = z.object({
  sessionId: z.string().min(3),
  testerName: z.string().min(2),
  testerRole: z.string().min(2),
  sessionActive: z.boolean(),
  defectsObserved: z.array(DefectRecordSchema),
  sessionStatus: z.enum(['IN_PROGRESS', 'COMPLETED_SAFE', 'HALTED_BLOCKED']),
});

export type HumanTestSession = z.infer<typeof HumanTestSessionSchema>;

export const TriPartiteVerificationReportSchema = z.object({
  stageOrFeatureId: z.string().min(3),
  automatedTestsPassed: z.boolean(),
  independentReviewCertified: z.boolean(),
  humanTestingApproved: z.boolean(),
  isFullyCertified: z.boolean(),
});

export type TriPartiteVerificationReport = z.infer<typeof TriPartiteVerificationReportSchema>;

export interface ExecutionStepDefinition {
  stepNumber: number;
  step: ExecutionProcessStep;
  name: string;
  primaryActor: string;
  description: string;
}

// ============================================================================
// 3. CANONICAL 20-STEP EXECUTION PROCESS REGISTRY
// ============================================================================

export const CANONICAL_20_EXECUTION_STEPS: ExecutionStepDefinition[] = [
  { stepNumber: 1, step: ExecutionProcessStep.STEP_01_REQ_SUBMISSION, name: 'Requirement Submission', primaryActor: 'Product Owner', description: 'Business brief, problem scope, and user outcomes' },
  { stepNumber: 2, step: ExecutionProcessStep.STEP_02_FORENSIC_AUDIT, name: 'Forensic Audit & Context Pull', primaryActor: 'Antigravity', description: 'Inspection of codebase, schemas, and live context synthesis' },
  { stepNumber: 3, step: ExecutionProcessStep.STEP_03_PRINCIPLES_CHECK, name: 'Principles & Boundary Check', primaryActor: 'Antigravity', description: 'Verification against AP-001 through AP-015 and boundary maps' },
  { stepNumber: 4, step: ExecutionProcessStep.STEP_04_DOMAIN_MODELING, name: 'Domain & State Modeling', primaryActor: 'Antigravity', description: 'Entity relationships, lifecycle states decoupled from technical status' },
  { stepNumber: 5, step: ExecutionProcessStep.STEP_05_SECURITY_BOUNDARIES, name: 'Security & RBAC Capabilities', primaryActor: 'Antigravity', description: 'Capability definitions, sessionVersion checks, GAR-02 anti-self-approval' },
  { stepNumber: 6, step: ExecutionProcessStep.STEP_06_DATA_CONTRACTS, name: 'Data Contracts & OCC', primaryActor: 'Antigravity', description: 'Firestore schemas, indexes, mandatory OCC versioning' },
  { stepNumber: 7, step: ExecutionProcessStep.STEP_07_API_CONTRACTS, name: 'API Contracts & Envelopes', primaryActor: 'Antigravity', description: 'REST routes, ApiResponseEnvelope, Zod payload schemas' },
  { stepNumber: 8, step: ExecutionProcessStep.STEP_08_UI_CONTRACTS, name: 'UI Contracts & State Matrix', primaryActor: 'Antigravity', description: 'Workspace hub placement, route path, 5-state UI model' },
  { stepNumber: 9, step: ExecutionProcessStep.STEP_09_TEST_STRATEGY, name: 'Test Strategy (9-Scenario Matrix)', primaryActor: 'Antigravity', description: '9 canonical failure/recovery scenario test matrix' },
  { stepNumber: 10, step: ExecutionProcessStep.STEP_10_COST_GUARD, name: 'Cost & Budget Ceiling Guard', primaryActor: 'Antigravity', description: 'Mathematical verification of <= ₹100 INR/month cloud budget ceiling' },
  { stepNumber: 11, step: ExecutionProcessStep.STEP_11_IMPLEMENTATION_SPEC, name: 'Implementation Spec Authoring', primaryActor: 'Antigravity', description: 'File-by-file ADD / MODIFY / REMOVE manifest authoring' },
  { stepNumber: 12, step: ExecutionProcessStep.STEP_12_AI_PROMPT_AUTHORING, name: 'External AI Studio Prompt Generation', primaryActor: 'Antigravity', description: 'Pristine, copy-paste prompt generation for AI Studio' },
  { stepNumber: 13, step: ExecutionProcessStep.STEP_13_STUDIO_EXECUTION, name: 'External Code Execution', primaryActor: 'Google AI Studio', description: 'Physical code changes created/edited with 0 errors' },
  { stepNumber: 14, step: ExecutionProcessStep.STEP_14_GITHUB_PUSH, name: 'Git Commit & Push to GitHub', primaryActor: 'Google AI Studio / User', description: 'Code changes committed and pushed to origin/main' },
  { stepNumber: 15, step: ExecutionProcessStep.STEP_15_LOCAL_PULL_SYNC, name: 'Local Pull & Workspace Sync', primaryActor: 'Antigravity', description: 'Workspace updated from GitHub origin/main' },
  { stepNumber: 16, step: ExecutionProcessStep.STEP_16_STATIC_COMPILE_CHECK, name: 'Automated Static & Compile Check', primaryActor: 'Automated / Antigravity', description: 'tsc --noEmit and npm run build verify 0 errors' },
  { stepNumber: 17, step: ExecutionProcessStep.STEP_17_STAGE_TEST_EXECUTION, name: 'Target Stage Test Execution', primaryActor: 'Automated / Antigravity', description: 'npm run test:stageXX 100% pass' },
  { stepNumber: 18, step: ExecutionProcessStep.STEP_18_REGRESSION_EXECUTION, name: 'Complete Regression Suite Execution', primaryActor: 'Automated / Antigravity', description: 'All historical stage tests pass with 0 regressions' },
  { stepNumber: 19, step: ExecutionProcessStep.STEP_19_HUMAN_SME_TESTING, name: 'Human SME Testing Session', primaryActor: 'Product Owner / SME', description: 'Observe -> Record -> Continue if safe protocol' },
  { stepNumber: 20, step: ExecutionProcessStep.STEP_20_GATE_CERTIFICATION_STOP, name: 'Final Gate Certification & Mandatory Stop', primaryActor: 'Antigravity & PO', description: 'Formal stage closure and execution halt' },
];

// ============================================================================
// 4. EVALUATOR & GOVERNANCE FUNCTIONS
// ============================================================================

/**
 * Evaluates an observation during a human testing session.
 * Enforces the "Observe -> Record -> Continue if safe" protocol.
 * Only BLOCKER severity defects halt the session; MAJOR, MINOR, and COSMETIC defects
 * are recorded and the session continues safely without mid-session AI patching.
 */
export function evaluateHumanTestingObservation(
  defect: DefectRecord,
  session: HumanTestSession
): {
  action: HumanTestingAction;
  canContinue: boolean;
  rationale: string;
} {
  if (defect.severity === DefectSeverity.BLOCKER) {
    return {
      action: HumanTestingAction.HALT_UNSAFE,
      canContinue: false,
      rationale: 'Blocker defect halts testing session immediately. White-screen, crash, or data loss detected.',
    };
  }

  return {
    action: HumanTestingAction.CONTINUE_SAFE,
    canContinue: true,
    rationale: 'Observe -> Record -> Continue if safe. Defect logged in observation ledger. Mid-session AI micro-patching is blocked.',
  };
}

/**
 * Enforces the Anti-Patching Rule during active testing sessions.
 * Blocks developers or AI agents from triggering reactive code patches while
 * a human tester is actively evaluating the system, unless it is an explicit BLOCKER.
 */
export function canTriggerImmediatePatch(
  sessionActive: boolean,
  severity: DefectSeverity
): {
  allowed: boolean;
  reason: string;
} {
  if (sessionActive && severity !== DefectSeverity.BLOCKER) {
    return {
      allowed: false,
      reason: 'Anti-patching rule active: Reactive micro-patching during an active human test session causes context thrashing and masks regressions. Patches must be batched post-session.',
    };
  }

  return {
    allowed: true,
    reason: severity === DefectSeverity.BLOCKER ? 'Immediate hotfix permitted for blocker defect.' : 'Test session inactive; batch remediation permitted.',
  };
}

/**
 * Validates the Tri-Partite Verification Gate.
 * A feature or stage is only certified if all 3 pillars (Automated, Independent, Human) pass.
 */
export function validateTriPartiteGate(
  automatedPassed: boolean,
  independentPassed: boolean,
  humanPassed: boolean
): {
  certified: boolean;
  missingPillars: VerificationPillar[];
} {
  const missingPillars: VerificationPillar[] = [];

  if (!automatedPassed) missingPillars.push(VerificationPillar.AUTOMATED);
  if (!independentPassed) missingPillars.push(VerificationPillar.INDEPENDENT_AUDIT);
  if (!humanPassed) missingPillars.push(VerificationPillar.HUMAN_TESTING);

  return {
    certified: missingPillars.length === 0,
    missingPillars,
  };
}
