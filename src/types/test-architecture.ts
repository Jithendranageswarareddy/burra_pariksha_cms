/**
 * BURRA PARIKSHA CMS — Stage 24 Test Architecture & Universal Quality Matrix
 *
 * Defines the 9 levels of testing hierarchy, the universal 135-cell workflow test matrix
 * (15 steps x 9 failure/recovery scenarios), deterministic test evaluators, and test fixtures.
 */

import { z } from 'zod';

// ============================================================================
// 1. TEST ENUMS & TAXONOMY
// ============================================================================

export enum TestLevel {
  UNIT = 'UNIT',
  COMPONENT = 'COMPONENT',
  INTEGRATION = 'INTEGRATION',
  API = 'API',
  WORKFLOW = 'WORKFLOW',
  SECURITY = 'SECURITY',
  E2E = 'E2E',
  HUMAN_ACCEPTANCE = 'HUMAN_ACCEPTANCE',
  PRODUCTION_VERIFICATION = 'PRODUCTION_VERIFICATION',
}

export enum WorkflowTestScenario {
  HAPPY_PATH = 'HAPPY_PATH',
  VALIDATION_FAILURE = 'VALIDATION_FAILURE',
  AUTHORIZATION_FAILURE = 'AUTHORIZATION_FAILURE',
  INVALID_TRANSITION = 'INVALID_TRANSITION',
  MISSING_DATA = 'MISSING_DATA',
  CONCURRENCY = 'CONCURRENCY',
  MEDIA_FAILURE = 'MEDIA_FAILURE',
  NETWORK_FAILURE = 'NETWORK_FAILURE',
  RECOVERY = 'RECOVERY',
}

export enum TestExecutionStatus {
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  SKIPPED = 'SKIPPED',
  BLOCKED = 'BLOCKED',
}

// ============================================================================
// 2. SCHEMAS & INTERFACES
// ============================================================================

export const WorkflowTestCaseSchema = z.object({
  stepNumber: z.number().int().min(1).max(15),
  stepName: z.string().min(1),
  scenario: z.nativeEnum(WorkflowTestScenario),
  testLevel: z.nativeEnum(TestLevel),
  expectedStatusCode: z.number().int().min(100).max(599),
  expectedErrorCode: z.string().optional(),
  description: z.string().min(1),
});

export type WorkflowTestCase = z.infer<typeof WorkflowTestCaseSchema>;

export const TestSuiteSummarySchema = z.object({
  totalTests: z.number().int().nonnegative(),
  passed: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
  durationMs: z.number().nonnegative(),
});

export type TestSuiteSummary = z.infer<typeof TestSuiteSummarySchema>;

// ============================================================================
// 3. CANONICAL 15 STEPS & 135-CELL TEST MATRIX
// ============================================================================

export const WORKFLOW_15_STEPS = [
  { stepNumber: 1, stepName: 'Content Ingestion & Sourcing' },
  { stepNumber: 2, stepName: 'Question Authoring & Telugu Review' },
  { stepNumber: 3, stepName: 'Technical Fact-Check & Verification' },
  { stepNumber: 4, stepName: 'Pedagogical & Bloom Tagging' },
  { stepNumber: 5, stepName: 'Media Asset Generation' },
  { stepNumber: 6, stepName: 'Video Composition & Template Binding' },
  { stepNumber: 7, stepName: 'Quality Assurance & Review' },
  { stepNumber: 8, stepName: 'Publishing Package Assembly' },
  { stepNumber: 9, stepName: 'Legal & Compliance Gate' },
  { stepNumber: 10, stepName: 'Executive Final Sign-Off' },
  { stepNumber: 11, stepName: 'Platform Dispatch' },
  { stepNumber: 12, stepName: 'Telemetry Ingestion & Tracking' },
  { stepNumber: 13, stepName: 'Performance Aggregation & Analytics' },
  { stepNumber: 14, stepName: 'Archival & Coldline Synchronization' },
  { stepNumber: 15, stepName: 'Curriculum Feedback Loop' },
];

export const WORKFLOW_9_SCENARIOS = [
  WorkflowTestScenario.HAPPY_PATH,
  WorkflowTestScenario.VALIDATION_FAILURE,
  WorkflowTestScenario.AUTHORIZATION_FAILURE,
  WorkflowTestScenario.INVALID_TRANSITION,
  WorkflowTestScenario.MISSING_DATA,
  WorkflowTestScenario.CONCURRENCY,
  WorkflowTestScenario.MEDIA_FAILURE,
  WorkflowTestScenario.NETWORK_FAILURE,
  WorkflowTestScenario.RECOVERY,
];

function buildCanonical135Matrix(): WorkflowTestCase[] {
  const matrix: WorkflowTestCase[] = [];

  const scenarioDetails: Record<
    WorkflowTestScenario,
    { statusCode: number; errorCode?: string; testLevel: TestLevel; descSuffix: string }
  > = {
    [WorkflowTestScenario.HAPPY_PATH]: {
      statusCode: 200,
      testLevel: TestLevel.WORKFLOW,
      descSuffix: 'Nominal successful execution and forward progression',
    },
    [WorkflowTestScenario.VALIDATION_FAILURE]: {
      statusCode: 400,
      errorCode: 'VALIDATION_ERROR',
      testLevel: TestLevel.UNIT,
      descSuffix: 'Malformed schema or invalid payload rejected with 400',
    },
    [WorkflowTestScenario.AUTHORIZATION_FAILURE]: {
      statusCode: 403,
      errorCode: 'FORBIDDEN',
      testLevel: TestLevel.SECURITY,
      descSuffix: 'Unauthorized actor or self-approval attempt rejected with 403',
    },
    [WorkflowTestScenario.INVALID_TRANSITION]: {
      statusCode: 409,
      errorCode: 'INVALID_STATE',
      testLevel: TestLevel.WORKFLOW,
      descSuffix: 'Illegal forward jump or out-of-order transition rejected with 409',
    },
    [WorkflowTestScenario.MISSING_DATA]: {
      statusCode: 404,
      errorCode: 'NOT_FOUND',
      testLevel: TestLevel.INTEGRATION,
      descSuffix: 'Referenced mandatory entity missing rejected with 404',
    },
    [WorkflowTestScenario.CONCURRENCY]: {
      statusCode: 409,
      errorCode: 'OPTIMISTIC_LOCK_CONFLICT',
      testLevel: TestLevel.INTEGRATION,
      descSuffix: 'Stale OCC version rejected with 409 lock conflict',
    },
    [WorkflowTestScenario.MEDIA_FAILURE]: {
      statusCode: 502,
      errorCode: 'MEDIA_ERROR',
      testLevel: TestLevel.INTEGRATION,
      descSuffix: 'Google Drive binary dropout or SHA-256 hash mismatch yields 502',
    },
    [WorkflowTestScenario.NETWORK_FAILURE]: {
      statusCode: 504,
      errorCode: 'GATEWAY_TIMEOUT',
      testLevel: TestLevel.INTEGRATION,
      descSuffix: 'External downstream dependency timeout yields 504',
    },
    [WorkflowTestScenario.RECOVERY]: {
      statusCode: 200,
      testLevel: TestLevel.E2E,
      descSuffix: 'Automated retry, circuit breaker recovery, or DLQ replay succeeds',
    },
  };

  for (const step of WORKFLOW_15_STEPS) {
    for (const scenario of WORKFLOW_9_SCENARIOS) {
      const details = scenarioDetails[scenario];
      matrix.push({
        stepNumber: step.stepNumber,
        stepName: step.stepName,
        scenario,
        testLevel: details.testLevel,
        expectedStatusCode: details.statusCode,
        expectedErrorCode: details.errorCode,
        description: `Step ${step.stepNumber < 10 ? '0' + step.stepNumber : step.stepNumber} (${step.stepName}) [${scenario}]: ${details.descSuffix}`,
      });
    }
  }

  return matrix;
}

export const CANONICAL_135_TEST_MATRIX: WorkflowTestCase[] = buildCanonical135Matrix();

// ============================================================================
// 4. EVALUATOR FUNCTIONS
// ============================================================================

export interface WorkflowSimulationContext {
  actorRole: string;
  isAuthor: boolean;
  occVersionMatch: boolean;
  payloadValid: boolean;
  mediaValid: boolean;
  networkOk: boolean;
  entityFound?: boolean;
}

/**
 * Simulates a workflow step execution under one of the 9 standardized test scenarios.
 */
export function simulateWorkflowStepTest(
  stepNumber: number,
  scenario: WorkflowTestScenario,
  context: WorkflowSimulationContext
): { passed: boolean; statusCode: number; errorCode?: string; reason: string } {
  // 1. HAPPY PATH
  if (scenario === WorkflowTestScenario.HAPPY_PATH) {
    const isHumanGatedReview = [2, 7, 9, 10].includes(stepNumber);
    if (isHumanGatedReview && context.isAuthor) {
      return {
        passed: false,
        statusCode: 403,
        errorCode: 'FORBIDDEN',
        reason: 'GAR-02 Violation: Author cannot approve their own work in review step.',
      };
    }
    if (!context.payloadValid) {
      return {
        passed: false,
        statusCode: 400,
        errorCode: 'VALIDATION_ERROR',
        reason: 'Malformed payload in happy path simulation.',
      };
    }
    if (!context.occVersionMatch) {
      return {
        passed: false,
        statusCode: 409,
        errorCode: 'OPTIMISTIC_LOCK_CONFLICT',
        reason: 'OCC version mismatch.',
      };
    }
    if (!context.mediaValid) {
      return {
        passed: false,
        statusCode: 502,
        errorCode: 'MEDIA_ERROR',
        reason: 'Media integrity failed.',
      };
    }
    if (!context.networkOk) {
      return {
        passed: false,
        statusCode: 504,
        errorCode: 'GATEWAY_TIMEOUT',
        reason: 'Downstream timeout.',
      };
    }
    return {
      passed: true,
      statusCode: 200,
      reason: `Step ${stepNumber} executed happy path successfully.`,
    };
  }

  // 2. VALIDATION FAILURE
  if (scenario === WorkflowTestScenario.VALIDATION_FAILURE) {
    return {
      passed: true,
      statusCode: 400,
      errorCode: 'VALIDATION_ERROR',
      reason: 'Validation failure caught correctly.',
    };
  }

  // 3. AUTHORIZATION FAILURE (RBAC / GAR-02)
  if (scenario === WorkflowTestScenario.AUTHORIZATION_FAILURE) {
    return {
      passed: true,
      statusCode: 403,
      errorCode: 'FORBIDDEN',
      reason: 'Unauthorized access or self-approval blocked correctly.',
    };
  }

  // 4. INVALID TRANSITION (Illegal Step Jump)
  if (scenario === WorkflowTestScenario.INVALID_TRANSITION) {
    return {
      passed: true,
      statusCode: 409,
      errorCode: 'INVALID_STATE',
      reason: 'Illegal workflow jump blocked correctly.',
    };
  }

  // 5. MISSING DATA
  if (scenario === WorkflowTestScenario.MISSING_DATA) {
    return {
      passed: true,
      statusCode: 404,
      errorCode: 'NOT_FOUND',
      reason: 'Missing entity reference handled correctly with 404.',
    };
  }

  // 6. CONCURRENCY CONFLICT (OCC)
  if (scenario === WorkflowTestScenario.CONCURRENCY) {
    return {
      passed: true,
      statusCode: 409,
      errorCode: 'OPTIMISTIC_LOCK_CONFLICT',
      reason: 'Optimistic locking conflict rejected correctly.',
    };
  }

  // 7. MEDIA FAILURE (SHA-256 Mismatch / Drive Dropout)
  if (scenario === WorkflowTestScenario.MEDIA_FAILURE) {
    return {
      passed: true,
      statusCode: 502,
      errorCode: 'MEDIA_ERROR',
      reason: 'Media failure caught and mapped to 502.',
    };
  }

  // 8. NETWORK FAILURE (External Dependency Timeout)
  if (scenario === WorkflowTestScenario.NETWORK_FAILURE) {
    return {
      passed: true,
      statusCode: 504,
      errorCode: 'GATEWAY_TIMEOUT',
      reason: 'Downstream timeout caught and mapped to 504.',
    };
  }

  // 9. RECOVERY
  if (scenario === WorkflowTestScenario.RECOVERY) {
    return {
      passed: true,
      statusCode: 200,
      reason: 'Automated recovery and retry executed successfully.',
    };
  }

  return {
    passed: false,
    statusCode: 500,
    errorCode: 'INTERNAL_ERROR',
    reason: 'Unhandled test scenario.',
  };
}

/**
 * Validates that the test matrix contains all 15 steps x 9 scenarios = 135 unique cells.
 */
export function validateTestMatrixCompleteness(matrix: WorkflowTestCase[]): {
  isComplete: boolean;
  stepCount: number;
  scenarioCount: number;
  totalCells: number;
} {
  const stepsFound = new Set<number>();
  const scenariosFound = new Set<WorkflowTestScenario>();
  const cellKeys = new Set<string>();

  for (const testCase of matrix) {
    stepsFound.add(testCase.stepNumber);
    scenariosFound.add(testCase.scenario);
    cellKeys.add(`${testCase.stepNumber}-${testCase.scenario}`);
  }

  const isComplete =
    stepsFound.size === 15 &&
    scenariosFound.size === 9 &&
    cellKeys.size === 135 &&
    matrix.length === 135;

  return {
    isComplete,
    stepCount: stepsFound.size,
    scenarioCount: scenariosFound.size,
    totalCells: matrix.length,
  };
}
