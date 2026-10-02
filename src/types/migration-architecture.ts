/**
 * BURRA PARIKSHA CMS — Stage 23 Migration Architecture & Strangler Fig Strategy
 *
 * Defines the 7-phase migration methodology across 10 system dimensions,
 * dual-write reconciliation contracts, cutover gates, and rollback safety nets.
 */

import { z } from 'zod';

// ============================================================================
// 1. ENUMS & TAXONOMY
// ============================================================================

export enum MigrationPhase {
  CURRENT_SYSTEM = 'CURRENT_SYSTEM',
  STABILIZE = 'STABILIZE',
  ABSTRACT = 'ABSTRACT',
  MIGRATE = 'MIGRATE',
  VERIFY = 'VERIFY',
  SWITCH = 'SWITCH',
  RETIRE_LEGACY = 'RETIRE_LEGACY',
}

export enum MigrationDomain {
  FRONTEND = 'FRONTEND',
  ROUTES = 'ROUTES',
  BACKEND = 'BACKEND',
  SHEETS = 'SHEETS',
  DATABASE = 'DATABASE',
  MEDIA = 'MEDIA',
  AUTHENTICATION = 'AUTHENTICATION',
  WORKFLOW = 'WORKFLOW',
  SERVICES = 'SERVICES',
  TESTS = 'TESTS',
}

export enum MigrationStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  VERIFIED = 'VERIFIED',
  CUTOVER_COMPLETE = 'CUTOVER_COMPLETE',
  LEGACY_RETIRED = 'LEGACY_RETIRED',
  ROLLED_BACK = 'ROLLED_BACK',
}

export enum ReconciliationStatus {
  BALANCED = 'BALANCED',
  MISMATCH = 'MISMATCH',
  IN_PROGRESS = 'IN_PROGRESS',
  FAILED = 'FAILED',
}

// ============================================================================
// 2. SCHEMAS & INTERFACES
// ============================================================================

export const PhaseStepDefinitionSchema = z.object({
  phase: z.nativeEnum(MigrationPhase),
  description: z.string().min(1),
  deliverables: z.array(z.string().min(1)),
  exitCriteria: z.string().min(1),
  rollbackMechanism: z.string().min(1),
});

export type PhaseStepDefinition = z.infer<typeof PhaseStepDefinitionSchema>;

export const DomainMigrationBlueprintSchema = z.object({
  domain: z.nativeEnum(MigrationDomain),
  legacyBaseline: z.string().min(1),
  targetArchitecture: z.string().min(1),
  currentPhase: z.nativeEnum(MigrationPhase),
  status: z.nativeEnum(MigrationStatus),
  phases: z.record(z.nativeEnum(MigrationPhase), PhaseStepDefinitionSchema),
  riskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
});

export type DomainMigrationBlueprint = z.infer<typeof DomainMigrationBlueprintSchema>;

export const DualWriteReconciliationSchema = z.object({
  domain: z.nativeEnum(MigrationDomain),
  legacyRecordCount: z.number().int().nonnegative(),
  targetRecordCount: z.number().int().nonnegative(),
  discrepancyCount: z.number().int().nonnegative(),
  checksumMatch: z.boolean(),
  status: z.nativeEnum(ReconciliationStatus),
  lastReconciledAt: z.string().datetime(),
});

export type DualWriteReconciliation = z.infer<typeof DualWriteReconciliationSchema>;

export const CutoverGateCriteriaSchema = z.object({
  domain: z.nativeEnum(MigrationDomain),
  reconciliationPassed: z.boolean(),
  automatedTestsPassing: z.boolean(),
  rollbackPlanActive: z.boolean(),
  stakeholderApproval: z.boolean(),
  canExecuteSwitch: z.boolean(),
});

export type CutoverGateCriteria = z.infer<typeof CutoverGateCriteriaSchema>;

// ============================================================================
// 3. BLUEPRINT REGISTRY (ALL 10 DOMAINS ACROSS 7 PHASES)
// ============================================================================

const PHASE_SEQUENCE: MigrationPhase[] = [
  MigrationPhase.CURRENT_SYSTEM,
  MigrationPhase.STABILIZE,
  MigrationPhase.ABSTRACT,
  MigrationPhase.MIGRATE,
  MigrationPhase.VERIFY,
  MigrationPhase.SWITCH,
  MigrationPhase.RETIRE_LEGACY,
];

function generateDefaultPhases(domainName: string, rollbackDesc: string): Record<MigrationPhase, PhaseStepDefinition> {
  const map = {} as Record<MigrationPhase, PhaseStepDefinition>;
  for (const phase of PHASE_SEQUENCE) {
    map[phase] = {
      phase,
      description: `Execution of ${phase} for domain ${domainName}`,
      deliverables: [`Deliverable specification for ${domainName} ${phase}`],
      exitCriteria: `Criteria satisfied for ${domainName} ${phase}`,
      rollbackMechanism: rollbackDesc,
    };
  }
  return map;
}

export const CANONICAL_MIGRATION_BLUEPRINTS: Record<MigrationDomain, DomainMigrationBlueprint> = {
  [MigrationDomain.FRONTEND]: {
    domain: MigrationDomain.FRONTEND,
    legacyBaseline: '31 fragmented React pages with disparate layouts',
    targetArchitecture: '8 Canonical Stage 10 Hubs with Unified Studio',
    currentPhase: MigrationPhase.VERIFY,
    status: MigrationStatus.VERIFIED,
    phases: generateDefaultPhases('Frontend', 'Revert router aliases to brownfield page components'),
    riskLevel: 'MEDIUM',
  },
  [MigrationDomain.ROUTES]: {
    domain: MigrationDomain.ROUTES,
    legacyBaseline: '78 unstructured brownfield routes in App.tsx',
    targetArchitecture: '14 canonical production routes with 301 alias redirects',
    currentPhase: MigrationPhase.VERIFY,
    status: MigrationStatus.VERIFIED,
    phases: generateDefaultPhases('Routes', 'Re-enable legacy route table entries in router mapping'),
    riskLevel: 'LOW',
  },
  [MigrationDomain.BACKEND]: {
    domain: MigrationDomain.BACKEND,
    legacyBaseline: 'Monolithic server.ts and unstructured routes.ts',
    targetArchitecture: 'Modular Monolith domain controllers with universal envelopes',
    currentPhase: MigrationPhase.VERIFY,
    status: MigrationStatus.VERIFIED,
    phases: generateDefaultPhases('Backend', 'Fall back to legacy Express endpoint middleware'),
    riskLevel: 'HIGH',
  },
  [MigrationDomain.SHEETS]: {
    domain: MigrationDomain.SHEETS,
    legacyBaseline: '25 authoritative Google Sheets tabs',
    targetArchitecture: 'Historical ETL data extract and read-only backup',
    currentPhase: MigrationPhase.VERIFY,
    status: MigrationStatus.VERIFIED,
    phases: generateDefaultPhases('Sheets', 'Keep Google Sheets API write path active in dual-write mode'),
    riskLevel: 'CRITICAL',
  },
  [MigrationDomain.DATABASE]: {
    domain: MigrationDomain.DATABASE,
    legacyBaseline: 'Google Sheets as pseudo-database',
    targetArchitecture: 'Firestore Native Spark Mode (28 canonical collections with OCC)',
    currentPhase: MigrationPhase.VERIFY,
    status: MigrationStatus.VERIFIED,
    phases: generateDefaultPhases('Database', 'Set USE_FIRESTORE_REPOSITORIES=false to fallback to SheetsAdapter'),
    riskLevel: 'CRITICAL',
  },
  [MigrationDomain.MEDIA]: {
    domain: MigrationDomain.MEDIA,
    legacyBaseline: 'Raw unversioned Google Drive webContentLinks',
    targetArchitecture: 'Stage 14 Tri-Layer Media with SHA-256 integrity hash verification',
    currentPhase: MigrationPhase.VERIFY,
    status: MigrationStatus.VERIFIED,
    phases: generateDefaultPhases('Media', 'Serve direct Google Drive asset URLs without hash checks'),
    riskLevel: 'MEDIUM',
  },
  [MigrationDomain.AUTHENTICATION]: {
    domain: MigrationDomain.AUTHENTICATION,
    legacyBaseline: 'Mock user credentials and unprotected cookies',
    targetArchitecture: 'Stage 19 Zero-Trust Session & RBAC capability tokens',
    currentPhase: MigrationPhase.VERIFY,
    status: MigrationStatus.VERIFIED,
    phases: generateDefaultPhases('Authentication', 'Allow fallback mock credentials header authentication'),
    riskLevel: 'HIGH',
  },
  [MigrationDomain.WORKFLOW]: {
    domain: MigrationDomain.WORKFLOW,
    legacyBaseline: 'Free-text status columns without transition constraints',
    targetArchitecture: 'Stage 07 & 08 15-Step Canonical State Engine with OCC',
    currentPhase: MigrationPhase.VERIFY,
    status: MigrationStatus.VERIFIED,
    phases: generateDefaultPhases('Workflow', 'Permit unvalidated status string mutations in legacy mode'),
    riskLevel: 'HIGH',
  },
  [MigrationDomain.SERVICES]: {
    domain: MigrationDomain.SERVICES,
    legacyBaseline: '69 fragmented, unstructured utility services',
    targetArchitecture: '8 Clean Architecture Domain Workspaces with formal interfaces',
    currentPhase: MigrationPhase.VERIFY,
    status: MigrationStatus.VERIFIED,
    phases: generateDefaultPhases('Services', 'Directly import legacy helper modules'),
    riskLevel: 'LOW',
  },
  [MigrationDomain.TESTS]: {
    domain: MigrationDomain.TESTS,
    legacyBaseline: 'Ad-hoc disconnected unit tests',
    targetArchitecture: 'Unified Stage 02-23 deterministic regression suite with CI gates',
    currentPhase: MigrationPhase.VERIFY,
    status: MigrationStatus.VERIFIED,
    phases: generateDefaultPhases('Tests', 'Execute individual legacy test scripts'),
    riskLevel: 'LOW',
  },
};

// ============================================================================
// 4. EVALUATOR FUNCTIONS
// ============================================================================

/**
 * Validates sequential phase progression under the 7-phase Strangler Fig pattern.
 * Strictly forbids jumping from MIGRATE directly to SWITCH without passing VERIFY.
 */
export function canAdvanceMigrationPhase(
  currentPhase: MigrationPhase,
  targetPhase: MigrationPhase,
  isVerified: boolean
): { allowed: boolean; reason: string } {
  const currentIndex = PHASE_SEQUENCE.indexOf(currentPhase);
  const targetIndex = PHASE_SEQUENCE.indexOf(targetPhase);

  if (targetIndex === -1 || currentIndex === -1) {
    return { allowed: false, reason: 'Invalid migration phase specified.' };
  }

  // Cannot jump backwards in standard advancement
  if (targetIndex <= currentIndex) {
    return { allowed: false, reason: `Target phase ${targetPhase} is not ahead of current phase ${currentPhase}.` };
  }

  // Only 1-step forward progression allowed
  if (targetIndex > currentIndex + 1) {
    return {
      allowed: false,
      reason: `Illegal phase bypass: Cannot jump from ${currentPhase} directly to ${targetPhase}. Phases must be sequential.`,
    };
  }

  // Strict check on entering SWITCH: Must have isVerified === true
  if (targetPhase === MigrationPhase.SWITCH && !isVerified) {
    return {
      allowed: false,
      reason: 'Cannot transition to SWITCH without formal verification (isVerified === true).',
    };
  }

  return {
    allowed: true,
    reason: `Progression from ${currentPhase} to ${targetPhase} authorized.`,
  };
}

/**
 * Evaluates dual-write reconciliation parity between legacy and target data stores.
 */
export function evaluateReconciliation(
  legacyCount: number,
  targetCount: number,
  checksumMatch: boolean
): { status: ReconciliationStatus; balanced: boolean; diff: number } {
  const diff = Math.abs(legacyCount - targetCount);
  const balanced = diff === 0 && checksumMatch;

  if (balanced) {
    return {
      status: ReconciliationStatus.BALANCED,
      balanced: true,
      diff: 0,
    };
  }

  return {
    status: ReconciliationStatus.MISMATCH,
    balanced: false,
    diff,
  };
}

/**
 * Evaluates the 4 mandatory cutover gate conditions for production traffic switch.
 */
export function evaluateCutoverGate(
  criteria: Omit<z.infer<typeof CutoverGateCriteriaSchema>, 'canExecuteSwitch'>
): boolean {
  return (
    criteria.reconciliationPassed === true &&
    criteria.automatedTestsPassing === true &&
    criteria.rollbackPlanActive === true &&
    criteria.stakeholderApproval === true
  );
}
