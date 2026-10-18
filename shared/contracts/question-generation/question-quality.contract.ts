/**
 * BURRA PARIKSHA CMS — Question Quality Validation Contract
 * Specification: S9-T04 / S9-T12 Deterministic Question Quality Verification
 *
 * Defines canonical data contracts for deterministic question quality validation:
 * - 12 Quality Verification Criteria (VAL-Q-01 through VAL-Q-12)
 * - Mode 1 (Question Challenge Short), Mode 2 (Topic Introduction), Mode 3 (Explained Questions Video)
 * - Structured errors (BLOCKING) and warnings (WARNING)
 * - Field references, slot references, and actionable remediation messages
 */

export type QuestionQualityIssueSeverity = 'BLOCKING' | 'WARNING';

export type QuestionQualityRuleId =
  | 'VAL-Q-01'
  | 'VAL-Q-02'
  | 'VAL-Q-03'
  | 'VAL-Q-04'
  | 'VAL-Q-05'
  | 'VAL-Q-06A'
  | 'VAL-Q-06B'
  | 'VAL-Q-07'
  | 'VAL-Q-08'
  | 'VAL-Q-09'
  | 'VAL-Q-10'
  | 'VAL-Q-11'
  | 'VAL-Q-12';

export interface QuestionQualityIssue {
  code: string;
  ruleId: QuestionQualityRuleId | string;
  severity: QuestionQualityIssueSeverity;
  field: string;
  message: string;
  slotNumber?: number;
  slotId?: string;
  questionIndex?: number;
  metadata?: Record<string, any>;
}

export interface QuestionQualityValidationResult {
  isValid: boolean;
  hasErrors: boolean;
  hasWarnings: boolean;
  errors: QuestionQualityIssue[];
  warnings: QuestionQualityIssue[];
  issues: QuestionQualityIssue[];
  summary: {
    blockingCount: number;
    warningCount: number;
    totalIssues: number;
  };
  errorMessages: string[];
  warningMessages: string[];
}

export interface QuestionQualityValidationOptions {
  batchAssembly?: any | null;
  targetQuestionCount?: number;
  requireExplanation?: boolean;
  skipTaxonomyLookup?: boolean;
  skipDuplicateCheck?: boolean;
  activeSlotIndex?: number;
}
