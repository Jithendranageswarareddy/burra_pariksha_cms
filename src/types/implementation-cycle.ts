/**
 * BURRA PARIKSHA CMS — Stage 27 Implementation Governance & Cycle Pipeline
 *
 * Enforces the 11-step implementation pipeline, sequential progression gates,
 * pre-execution verification, blast radius & cost ceiling guards, and the
 * Mandatory Stop rule (STOP-001).
 */

import { z } from 'zod';

// ============================================================================
// 1. PIPELINE ENUMS & IDENTIFIERS
// ============================================================================

export enum ImplementationCycleStep {
  REQUIREMENT = 'REQUIREMENT',
  ACCEPTANCE = 'ACCEPTANCE',
  ARCHITECTURE_IMPACT = 'ARCHITECTURE_IMPACT',
  DESIGN = 'DESIGN',
  DATA_CONTRACT = 'DATA_CONTRACT',
  API_CONTRACT = 'API_CONTRACT',
  UI_CONTRACT = 'UI_CONTRACT',
  SECURITY_CONTRACT = 'SECURITY_CONTRACT',
  TEST_STRATEGY = 'TEST_STRATEGY',
  IMPLEMENTATION_SPEC = 'IMPLEMENTATION_SPEC',
  GOOGLE_AI_STUDIO = 'GOOGLE_AI_STUDIO',
  VERIFICATION_STOP = 'VERIFICATION_STOP',
}

export enum CycleExecutionState {
  IN_SPECIFICATION = 'IN_SPECIFICATION',
  READY_FOR_STUDIO = 'READY_FOR_STUDIO',
  CODE_GENERATED = 'CODE_GENERATED',
  VERIFYING = 'VERIFYING',
  ACCEPTED_AND_STOPPED = 'ACCEPTED_AND_STOPPED',
  BLOCKED = 'BLOCKED',
}

// ============================================================================
// 2. SCHEMAS & DATA STRUCTURES
// ============================================================================

export const CycleStepDefinitionSchema = z.object({
  stepNumber: z.number().int().min(1).max(12),
  step: z.nativeEnum(ImplementationCycleStep),
  name: z.string().min(3),
  requiredArtifacts: z.array(z.string().min(2)).min(1),
  exitCriteria: z.string().min(10),
});

export type CycleStepDefinition = z.infer<typeof CycleStepDefinitionSchema>;

export const ArchitectureImpactSchema = z.object({
  blastRadius: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  costImpactINR: z.number().min(0).max(100), // Inviolable ₹100 INR/month constraint
  freeTierSafe: z.boolean(),
});

export const FeatureImplementationPackageSchema = z.object({
  featureId: z.string().min(3),
  featureName: z.string().min(5),
  currentStep: z.nativeEnum(ImplementationCycleStep),
  executionState: z.nativeEnum(CycleExecutionState),
  requirementSummary: z.string().min(10),
  acceptanceCriteria: z.array(z.string().min(5)).min(1),
  architectureImpact: ArchitectureImpactSchema,
  dataContractVerified: z.boolean(),
  apiContractVerified: z.boolean(),
  uiContractVerified: z.boolean(),
  securityContractVerified: z.boolean(),
  testStrategyVerified: z.boolean(),
  implementationSpecReady: z.boolean(),
  isHalted: z.boolean(),
});

export type FeatureImplementationPackage = z.infer<typeof FeatureImplementationPackageSchema>;

// ============================================================================
// 3. CANONICAL 11-STEP PIPELINE REGISTRY
// ============================================================================

export const CANONICAL_11_CYCLE_STEPS: CycleStepDefinition[] = [
  {
    stepNumber: 1,
    step: ImplementationCycleStep.REQUIREMENT,
    name: 'Business Requirement Definition',
    requiredArtifacts: ['Problem Statement', 'User Persona', 'Functional Scope'],
    exitCriteria: 'Explicit problem statement with measurable user outcome approved by Product Lead.',
  },
  {
    stepNumber: 2,
    step: ImplementationCycleStep.ACCEPTANCE,
    name: 'Acceptance Criteria Sign-Off',
    requiredArtifacts: ['Acceptance Checklist', 'Success Metrics', 'Signing Authority'],
    exitCriteria: 'Formal sign-off authority assigned and testable criteria documented.',
  },
  {
    stepNumber: 3,
    step: ImplementationCycleStep.ARCHITECTURE_IMPACT,
    name: 'Architecture & Cost Impact Assessment',
    requiredArtifacts: ['Blast Radius Analysis', 'Touched Collections', 'Free-Tier Budget Check'],
    exitCriteria: 'Verified within ₹0.00–₹100.00 INR/month cloud budget ceiling (COST-001, AP-012).',
  },
  {
    stepNumber: 4,
    step: ImplementationCycleStep.DESIGN,
    name: 'Technical Architecture & State Design',
    requiredArtifacts: ['Component Architecture', 'State Machine Diagram', 'Lifecycle Mapping'],
    exitCriteria: 'Decoupled state model (AP-002) and modular monolith boundaries verified.',
  },
  {
    stepNumber: 5,
    step: ImplementationCycleStep.DATA_CONTRACT,
    name: 'Database & Persistence Contract',
    requiredArtifacts: ['Firestore Schemas', 'Index Definitions', 'OCC Version Field'],
    exitCriteria: 'Data schema formalized with Optimistic Concurrency Control (AP-005).',
  },
  {
    stepNumber: 6,
    step: ImplementationCycleStep.API_CONTRACT,
    name: 'Interface & Endpoint Contract',
    requiredArtifacts: ['HTTP Endpoints', 'Zod Payload Schemas', 'ApiResponseEnvelope', 'Error Codes'],
    exitCriteria: 'Standardized ApiResponseEnvelope and unique error codes defined.',
  },
  {
    stepNumber: 7,
    step: ImplementationCycleStep.UI_CONTRACT,
    name: 'Frontend & User Experience Contract',
    requiredArtifacts: ['Hub Placement', 'Route Path', '5-State UI Specifications'],
    exitCriteria: 'Unified Studio layout adhering to Anti-AI Slop design constitution.',
  },
  {
    stepNumber: 8,
    step: ImplementationCycleStep.SECURITY_CONTRACT,
    name: 'RBAC & Segregation of Duties Contract',
    requiredArtifacts: ['Required Capabilities', 'Role Matrix', 'Session Version Validation'],
    exitCriteria: 'Anti-Self-Approval (GAR-02) and Non-Authoritative AI (AP-009) locked.',
  },
  {
    stepNumber: 9,
    step: ImplementationCycleStep.TEST_STRATEGY,
    name: 'Comprehensive Quality Assurance Plan',
    requiredArtifacts: ['9-Scenario Matrix Coverage', 'Unit/Integration/E2E Specifications'],
    exitCriteria: '9 canonical failure/recovery scenarios explicitly accounted for.',
  },
  {
    stepNumber: 10,
    step: ImplementationCycleStep.IMPLEMENTATION_SPEC,
    name: 'Exact Code Modification Plan',
    requiredArtifacts: ['File-by-file ADD / MODIFY / REMOVE Manifest', 'Pristine File Content'],
    exitCriteria: 'Pristine, non-placeholder file specifications authored.',
  },
  {
    stepNumber: 11,
    step: ImplementationCycleStep.GOOGLE_AI_STUDIO,
    name: 'Execution Prompt Generation & Code Modification',
    requiredArtifacts: ['Execution Prompt', 'Modified Code', 'Zero-Error Production Build'],
    exitCriteria: 'Code modified, compiled with 0 errors, and committed to repository.',
  },
  {
    stepNumber: 12,
    step: ImplementationCycleStep.VERIFICATION_STOP,
    name: 'Mandatory Stop & Independent Verification',
    requiredArtifacts: ['Verification Test Suite', 'Product Owner Acceptance Report'],
    exitCriteria: 'Execution halts; wait for explicit human command before next feature.',
  },
];

// Map step enums to step numbers for sequence validation
const STEP_ORDER: Record<ImplementationCycleStep, number> = {
  [ImplementationCycleStep.REQUIREMENT]: 1,
  [ImplementationCycleStep.ACCEPTANCE]: 2,
  [ImplementationCycleStep.ARCHITECTURE_IMPACT]: 3,
  [ImplementationCycleStep.DESIGN]: 4,
  [ImplementationCycleStep.DATA_CONTRACT]: 5,
  [ImplementationCycleStep.API_CONTRACT]: 6,
  [ImplementationCycleStep.UI_CONTRACT]: 7,
  [ImplementationCycleStep.SECURITY_CONTRACT]: 8,
  [ImplementationCycleStep.TEST_STRATEGY]: 9,
  [ImplementationCycleStep.IMPLEMENTATION_SPEC]: 10,
  [ImplementationCycleStep.GOOGLE_AI_STUDIO]: 11,
  [ImplementationCycleStep.VERIFICATION_STOP]: 12,
};

// ============================================================================
// 4. EVALUATOR & GOVERNANCE FUNCTIONS
// ============================================================================

/**
 * Validates whether a feature implementation package can advance from currentStep to targetStep.
 * Enforces sequential progression and blocks entry to GOOGLE_AI_STUDIO without all prerequisite contracts verified.
 */
export function canAdvanceCycleStep(
  currentStep: ImplementationCycleStep,
  targetStep: ImplementationCycleStep,
  pkg: FeatureImplementationPackage
): { allowed: boolean; violationReason?: string } {
  const currentOrder = STEP_ORDER[currentStep];
  const targetOrder = STEP_ORDER[targetStep];

  // 1. Prevent reverse transition unless explicitly resetting
  if (targetOrder < currentOrder) {
    return { allowed: false, violationReason: `Cannot transition backward from step ${currentOrder} to step ${targetOrder}` };
  }

  // 2. Prevent skipping steps (must advance exactly +1)
  if (targetOrder > currentOrder + 1) {
    return {
      allowed: false,
      violationReason: `Illegal step skip: Cannot jump from ${currentStep} (${currentOrder}) directly to ${targetStep} (${targetOrder}). Must follow sequential pipeline.`,
    };
  }

  // 3. Cost and Budget Ceiling Invariant (<= ₹100 INR/month)
  if (pkg.architectureImpact.costImpactINR > 100 || !pkg.architectureImpact.freeTierSafe) {
    return {
      allowed: false,
      violationReason: `Cost ceiling violation: Feature exceeds ₹100 INR/month limit (cost: ₹${pkg.architectureImpact.costImpactINR}) or breaches free-tier safety.`,
    };
  }

  // 4. Strict Pre-Execution Readiness Gate before GOOGLE_AI_STUDIO (Step 11)
  if (targetStep === ImplementationCycleStep.GOOGLE_AI_STUDIO) {
    const readiness = validateImplementationReadiness(pkg);
    if (!readiness.isReadyForStudio) {
      return {
        allowed: false,
        violationReason: `Cannot enter GOOGLE_AI_STUDIO. Missing verified gates: ${readiness.missingGates.join(', ')}`,
      };
    }
  }

  return { allowed: true };
}

/**
 * Checks all prerequisite contracts and readiness indicators for Google AI Studio execution.
 */
export function validateImplementationReadiness(pkg: FeatureImplementationPackage): {
  isReadyForStudio: boolean;
  missingGates: string[];
} {
  const missingGates: string[] = [];

  if (!pkg.dataContractVerified) missingGates.push('DATA_CONTRACT');
  if (!pkg.apiContractVerified) missingGates.push('API_CONTRACT');
  if (!pkg.uiContractVerified) missingGates.push('UI_CONTRACT');
  if (!pkg.securityContractVerified) missingGates.push('SECURITY_CONTRACT');
  if (!pkg.testStrategyVerified) missingGates.push('TEST_STRATEGY');
  if (!pkg.implementationSpecReady) missingGates.push('IMPLEMENTATION_SPEC');

  if (pkg.architectureImpact.costImpactINR > 100 || !pkg.architectureImpact.freeTierSafe) {
    missingGates.push('COST_CEILING_FREE_TIER');
  }

  return {
    isReadyForStudio: missingGates.length === 0,
    missingGates,
  };
}

/**
 * Enforces the Mandatory Stop rule (STOP-001).
 * Sets isHalted = true and returns a formal stop directive to prevent automated feature chaining.
 */
export function enforceMandatoryStop(pkg: FeatureImplementationPackage): {
  isHalted: boolean;
  executionState: CycleExecutionState;
  nextActionMessage: string;
} {
  return {
    isHalted: true,
    executionState: CycleExecutionState.ACCEPTED_AND_STOPPED,
    nextActionMessage: `MANDATORY STOP: Feature ${pkg.featureId} (${pkg.featureName}) execution complete. Awaiting independent local verification and Product Owner approval before next cycle.`,
  };
}
