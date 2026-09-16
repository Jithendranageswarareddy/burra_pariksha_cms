/**
 * BURRA PARIKSHA CMS - Benchmark Suite Type Contracts
 * Phase A: Semantic Validation Benchmark Architecture
 *
 * Formal data contracts for measuring real AI semantic reasoning capabilities
 * against human-annotated ground truth.
 */

export type BenchmarkCategory =
  | 'ARITHMETIC_MATH'
  | 'PERCENTAGE_PROFIT_LOSS'
  | 'RATIO_AVERAGE_AGES'
  | 'TIME_WORK_DISTANCE'
  | 'NUMBER_SYSTEM_LCM_HCF'
  | 'LOGICAL_REASONING'
  | 'VERBAL_REASONING'
  | 'TELUGU_APTITUDE'
  | 'AMBIGUOUS_ADVERSARIAL'
  | 'WRONG_ANSWER_AND_EXPLANATION';

export type BenchmarkVerdict = 'VALID' | 'INVALID' | 'NEEDS_REVIEW';

export type BenchmarkIssueType =
  | 'HALLUCINATED_EXPLANATION'
  | 'ILLOGICAL_CONCLUSION'
  | 'AMBIGUOUS_PHRASING'
  | 'PLAUSIBLE_DISTRACTOR'
  | 'POOR_TRANSLATION'
  | 'NONE';

/**
 * Human-established ground truth expectations for a benchmark question.
 */
export interface BenchmarkGroundTruth {
  expectedVerdict: BenchmarkVerdict;
  isDeclaredAnswerCorrect: boolean;
  isExplanationLogicallySound: boolean;
  isAmbiguous: boolean;
  isTeluguLinguisticallyAccurate?: boolean;
  expectedIssues: BenchmarkIssueType[];
  humanRationale: string;
}

/**
 * Benchmark question entity representing an evaluated curriculum item.
 */
export interface BenchmarkQuestionItem {
  id: string; // e.g. "BM-CAT01-001"
  category: BenchmarkCategory;
  questionText: string;
  language: 'ENGLISH' | 'TELUGU';
  options: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  declaredAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  groundTruth: BenchmarkGroundTruth;
}

/**
 * Prediction emitted by an AI reasoning provider during benchmark execution.
 */
export interface BenchmarkPrediction {
  verdict: BenchmarkVerdict;
  confidence: number;
  detectedIssues: BenchmarkIssueType[];
  reasoningSummary: string;
  modelId: string;
  providerId: string;
  latencyMs: number;
  timestamp: string;
  rawResponse?: unknown;
}

/**
 * Individual evaluation result comparing model prediction with ground truth.
 */
export interface BenchmarkResult {
  questionId: string;
  category: BenchmarkCategory;
  groundTruth: BenchmarkGroundTruth;
  prediction: BenchmarkPrediction;
  isCorrectVerdict: boolean;
  isFalseValid: boolean; // Model predicted VALID, but ground truth is INVALID or NEEDS_REVIEW
  isFalseInvalid: boolean; // Model predicted INVALID, but ground truth is VALID
  isAmbiguityCorrectlyDetected: boolean;
  isExplanationSoundnessCorrectlyDetected: boolean;
  isTeluguCorrectlyEvaluated?: boolean;
}

/**
 * Confusion matrix mapping ground truth verdicts against predicted verdicts.
 */
export interface BenchmarkConfusionMatrix {
  matrix: {
    expectedValid: { predictedValid: number; predictedInvalid: number; predictedNeedsReview: number };
    expectedInvalid: { predictedValid: number; predictedInvalid: number; predictedNeedsReview: number };
    expectedNeedsReview: { predictedValid: number; predictedInvalid: number; predictedNeedsReview: number };
  };
}

/**
 * Category-level statistical performance breakdown.
 */
export interface BenchmarkCategoryMetrics {
  category: BenchmarkCategory;
  total: number;
  correct: number;
  accuracy: number;
  falseValidCount: number;
  falseInvalidCount: number;
  needsReviewCount: number;
  meanConfidence: number;
}

/**
 * Full aggregate metrics across the benchmark run.
 */
export interface BenchmarkMetrics {
  total: number;
  correctPredictions: number;
  incorrectPredictions: number;
  overallAccuracy: number;
  falseValid: number; // Critical safety risk (hallucinations/errors marked valid)
  falseInvalid: number; // Editorial friction (good items marked invalid)
  confusionMatrix: BenchmarkConfusionMatrix;
  categoryAccuracy: Record<BenchmarkCategory, BenchmarkCategoryMetrics>;
  ambiguityDetection: {
    totalAmbiguousQuestions: number;
    correctlyFlaggedAmbiguous: number;
    precision: number;
    recall: number;
  };
  explanationDetection: {
    totalFlawedExplanations: number;
    correctlyFlaggedFlawed: number;
    precision: number;
    recall: number;
  };
  teluguAccuracy: {
    totalTeluguQuestions: number;
    correctPredictions: number;
    accuracy: number;
  };
  confidenceStatistics: {
    meanConfidenceOverall: number;
    meanConfidenceCorrect: number;
    meanConfidenceIncorrect: number;
    confidenceBuckets: {
      highConfidenceAbove90: { count: number; accuracy: number };
      mediumConfidence80To90: { count: number; accuracy: number };
      lowConfidenceBelow80: { count: number; accuracy: number };
    };
  };
}
