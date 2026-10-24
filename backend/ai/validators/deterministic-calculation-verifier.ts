/**
 * Deterministic verification for structured calculation evidence.
 *
 * This helper deliberately accepts structured operands instead of attempting to
 * infer truth from AI-generated prose. Natural-language explanations remain
 * advisory and must still pass the existing human verification workflow.
 */

export type DeterministicOperation =
  | 'ADD'
  | 'SUBTRACT'
  | 'MULTIPLY'
  | 'DIVIDE'
  | 'PERCENT_OF'
  | 'PERCENT_CHANGE';

export type DeterministicVerificationStatus =
  | 'VERIFIED'
  | 'FAILED'
  | 'NEEDS_REVIEW'
  | 'NOT_APPLICABLE';

export interface DeterministicCalculationInput {
  operation: DeterministicOperation;
  operands: readonly number[];
  claimedResult: number;
  steps?: readonly string[];
  requiredStepCount?: number;
  options?: readonly number[];
  declaredOptionIndex?: number;
  contentMode?: 'QUESTION_CHALLENGE_SHORT' | 'WORKED_EXAMPLES' | 'TOPIC_INTRODUCTION';
}

export interface DeterministicCalculationResult {
  status: DeterministicVerificationStatus;
  expectedResult?: number;
  claimedResult?: number;
  matchedOptionIndexes: number[];
  calculationSteps: string[];
  issues: string[];
  details: string;
}

const DEFAULT_RELATIVE_TOLERANCE = 1e-9;
const MIN_ABSOLUTE_TOLERANCE = 1e-9;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function withinTolerance(actual: number, expected: number): boolean {
  const tolerance = Math.max(MIN_ABSOLUTE_TOLERANCE, Math.abs(expected) * DEFAULT_RELATIVE_TOLERANCE);
  return Math.abs(actual - expected) <= tolerance;
}

function calculate(operation: DeterministicOperation, operands: readonly number[]): number | null {
  switch (operation) {
    case 'ADD':
      return operands[0] + operands[1];
    case 'SUBTRACT':
      return operands[0] - operands[1];
    case 'MULTIPLY':
      return operands[0] * operands[1];
    case 'DIVIDE':
      return operands[1] === 0 ? null : operands[0] / operands[1];
    case 'PERCENT_OF':
      return (operands[0] * operands[1]) / 100;
    case 'PERCENT_CHANGE':
      return operands[0] === 0 ? null : ((operands[1] - operands[0]) / operands[0]) * 100;
  }
}

function expectedOperandCount(operation: DeterministicOperation): number {
  return operation === 'PERCENT_OF' || operation === 'PERCENT_CHANGE' ? 2 : 2;
}

/**
 * Verifies only arithmetic that is explicitly represented in the input.
 * Ambiguous option sets and incomplete worked steps never produce VERIFIED.
 */
export function verifyDeterministicCalculation(
  input: DeterministicCalculationInput
): DeterministicCalculationResult {
  const issues: string[] = [];
  const steps = (input.steps ?? []).map((step) => step.trim()).filter(Boolean);
  const options = input.options ?? [];

  if (input.contentMode === 'TOPIC_INTRODUCTION' && input.operands.length === 0) {
    return {
      status: 'NOT_APPLICABLE',
      matchedOptionIndexes: [],
      calculationSteps: steps,
      issues: [],
      details: 'No deterministic calculation claim was supplied for non-MCQ Topic Introduction content.',
    };
  }

  if (!Object.prototype.hasOwnProperty.call({
    ADD: true,
    SUBTRACT: true,
    MULTIPLY: true,
    DIVIDE: true,
    PERCENT_OF: true,
    PERCENT_CHANGE: true,
  }, input.operation)) {
    issues.push('Unsupported deterministic operation.');
  }

  if (input.operands.length !== expectedOperandCount(input.operation)) {
    issues.push(`Operation ${input.operation} requires exactly ${expectedOperandCount(input.operation)} operands.`);
  }

  if (!input.operands.every(isFiniteNumber) || !isFiniteNumber(input.claimedResult)) {
    issues.push('Operands and claimedResult must be finite numbers.');
  }

  if (input.requiredStepCount !== undefined && (
    !Number.isInteger(input.requiredStepCount) ||
    input.requiredStepCount < 1 ||
    steps.length < input.requiredStepCount
  )) {
    issues.push('Worked calculation evidence is incomplete.');
  }

  if (issues.length > 0) {
    return {
      status: 'FAILED',
      claimedResult: input.claimedResult,
      matchedOptionIndexes: [],
      calculationSteps: steps,
      issues,
      details: issues.join(' '),
    };
  }

  const expectedResult = calculate(input.operation, input.operands);
  if (expectedResult === null || !Number.isFinite(expectedResult)) {
    return {
      status: 'FAILED',
      claimedResult: input.claimedResult,
      matchedOptionIndexes: [],
      calculationSteps: steps,
      issues: ['The calculation is undefined, including division or percentage change from zero.'],
      details: 'The supplied operands do not define a finite result.',
    };
  }

  const matchedOptionIndexes = options
    .map((option, index) => (isFiniteNumber(option) && withinTolerance(option, expectedResult) ? index : -1))
    .filter((index) => index >= 0);

  if (options.length > 0 && matchedOptionIndexes.length !== 1) {
    const issue = matchedOptionIndexes.length === 0
      ? 'No option matches the deterministic result.'
      : 'Multiple options match the deterministic result.';
    return {
      status: 'NEEDS_REVIEW',
      expectedResult,
      claimedResult: input.claimedResult,
      matchedOptionIndexes,
      calculationSteps: steps,
      issues: [issue],
      details: issue,
    };
  }

  if (input.declaredOptionIndex !== undefined && input.declaredOptionIndex !== matchedOptionIndexes[0]) {
    return {
      status: 'FAILED',
      expectedResult,
      claimedResult: input.claimedResult,
      matchedOptionIndexes,
      calculationSteps: steps,
      issues: ['Declared answer does not match the uniquely calculated option.'],
      details: 'The deterministic result contradicts the declared answer.',
    };
  }

  if (!withinTolerance(input.claimedResult, expectedResult)) {
    return {
      status: 'FAILED',
      expectedResult,
      claimedResult: input.claimedResult,
      matchedOptionIndexes,
      calculationSteps: steps,
      issues: ['Claimed result does not match the deterministic result.'],
      details: `Expected ${expectedResult}, received ${input.claimedResult}.`,
    };
  }

  return {
    status: 'VERIFIED',
    expectedResult,
    claimedResult: input.claimedResult,
    matchedOptionIndexes,
    calculationSteps: steps,
    issues: [],
    details: 'Structured calculation matches the deterministic result.',
  };
}
