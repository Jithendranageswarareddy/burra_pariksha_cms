/**
 * BURRA PARIKSHA CMS — Question Generation Contracts & DTOs
 * Feature Slice: Question Generation (Stage 01)
 *
 * Defines explicit contracts for:
 * - Generation options and taxonomy selection
 * - Advisory AI candidate generation & refinement
 * - Candidate review and validation
 * - Isolated Draft persistence (Save Draft != Verify)
 * - Explicit Submission for Verification
 */

import {
  AiRefinementAction,
  DifficultyLevel,
  QuestionLanguage,
  QuestionStatus,
  QuestionStyle,
} from '../../constants/enums';
import { QuestionCandidate } from '../../types/question';

/**
 * Valid options for generating a question.
 */
export interface QuestionGenerationOptions {
  topics: Array<{ id: string; name: string }>;
  subtopics: Array<{ id: string; name: string; topicId: string }>;
  difficultyLevels: DifficultyLevel[];
  languages: QuestionLanguage[];
  questionStyles: string[];
  contextSuggestions: string[];
}

/**
 * Payload sent to trigger AI candidate question generation.
 */
export interface GenerateCandidateInput {
  topicId: string;
  topicName?: string;
  subtopicId: string;
  subtopicName?: string;
  difficulty: DifficultyLevel | string;
  language: QuestionLanguage;
  questionStyle?: QuestionStyle | string;
  realWorldContext?: string;
  realLifeContext?: string;
  challengeType?: string;
  presentationType?: string;
  customInstructions?: string;
  generationMode?: 'SUBTOPIC' | 'RANDOM';
}

/**
 * Payload sent to refine an existing candidate question.
 */
export interface RefineCandidateInput {
  action: AiRefinementAction | string;
  currentCandidate: QuestionCandidate;
  promptModifier?: string;
  targetDifficulty?: DifficultyLevel | string;
  targetLanguage?: QuestionLanguage | string;
  targetContext?: string;
}

/**
 * Telemetry and provenance metadata for an AI generation operation.
 */
export interface GenerationMetadata {
  modelUsed: string;
  generationDurationMs: number;
  providerId?: string;
  modelId?: string;
  requestId?: string;
  latencyMs?: number;
  retryCount?: number;
  promptTokens?: number;
  outputTokens?: number;
  generatorType?: string;
  fallbackReason?: string;
  fallbackUsed?: boolean;
  attemptedProviders?: string[];
  errorClassification?: any;
}

/**
 * Mathematical/logical verification summary returned with generated candidates.
 */
export interface MathVerificationSummary {
  status: 'PROVABLY_VALID' | 'CONTRADICTORY' | 'NOT_DETERMINISTICALLY_VERIFIED' | 'UNVERIFIED' | 'NOT_APPLICABLE' | 'FAILED' | string;
  calculatedValue?: number | string;
  matchedOption?: string;
  details?: string;
  reason?: string;
}

/**
 * Result returned from a candidate question generation request.
 */
export interface GenerationResult {
  candidate: QuestionCandidate;
  metadata: GenerationMetadata;
  validation?: any;
}

/**
 * Candidate data held in the Question Studio workspace.
 */
export interface StudioCandidate {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  topicId: string;
  subtopicId: string;
  difficulty: string;
  challengeType: string;
  presentationType: string;
  language: QuestionLanguage | string;
  realLifeContext: string;
  questionStyle?: string;
  generationMode?: string;
  tags: string[];
  // AI Provenance & Verification
  sourceModel?: string;
  generationLatencyMs?: number;
  isFallback?: boolean;
  mathematicalVerification?: MathVerificationSummary;
}

/**
 * Discrete state machine values for Stage 01 workspace.
 */
export type Step01WorkflowState = 'EMPTY' | 'INCOMPLETE' | 'VALID' | 'INVALID';

/**
 * Evaluated state of the current question candidate in the workspace.
 */
export interface Step01StateEvaluation {
  state: Step01WorkflowState;
  canContinue: boolean;
  reason?: string;
  errors: string[];
  warnings: string[];
}

/**
 * Pure evaluation function for Step 01 candidate completeness.
 */
export function evaluateStep01CandidateState({
  hasCandidate,
  candidate,
  configError,
}: {
  hasCandidate: boolean;
  candidate: Partial<StudioCandidate>;
  configError?: string | null;
}): Step01StateEvaluation {
  if (configError) {
    return {
      state: 'INVALID',
      canContinue: false,
      reason: 'Configuration unavailable: ' + configError,
      errors: [configError],
      warnings: [],
    };
  }

  const qText = (candidate.questionText || '').trim();
  if (!hasCandidate || !qText) {
    return {
      state: 'EMPTY',
      canContinue: false,
      reason: 'Question workspace is empty. Generate a candidate or draft manually.',
      errors: [],
      warnings: [],
    };
  }

  const optA = (candidate.optionA || '').trim();
  const optB = (candidate.optionB || '').trim();
  const optC = (candidate.optionC || '').trim();
  const optD = (candidate.optionD || '').trim();
  const declaredAnswer = (candidate.correctAnswer || '').trim().toUpperCase();
  const challengeType = candidate.challengeType || 'ABCD';

  const missingFieldErrors: string[] = [];
  if (qText.length < 5) {
    missingFieldErrors.push('Question statement must be at least 5 characters.');
  }
  if (!optA) missingFieldErrors.push('Option A is required.');
  if (!optB) missingFieldErrors.push('Option B is required.');
  if (challengeType === 'ABCD') {
    if (!optC) missingFieldErrors.push('Option C is required.');
    if (!optD) missingFieldErrors.push('Option D is required.');
  }

  if (missingFieldErrors.length > 0) {
    return {
      state: 'INCOMPLETE',
      canContinue: false,
      reason: missingFieldErrors[0],
      errors: missingFieldErrors,
      warnings: [],
    };
  }

  if (!['A', 'B', 'C', 'D'].includes(declaredAnswer)) {
    return {
      state: 'INVALID',
      canContinue: false,
      reason: `Invalid correct answer choice '${declaredAnswer}'. Must be A, B, C, or D.`,
      errors: [`Invalid correct answer choice '${declaredAnswer}'.`],
      warnings: [],
    };
  }

  // Check for duplicate options
  const rawOptions = [
    { key: 'A', text: optA.toLowerCase() },
    { key: 'B', text: optB.toLowerCase() },
    ...(challengeType === 'ABCD'
      ? [
          { key: 'C', text: optC.toLowerCase() },
          { key: 'D', text: optD.toLowerCase() },
        ]
      : []),
  ];

  for (let i = 0; i < rawOptions.length; i++) {
    for (let j = i + 1; j < rawOptions.length; j++) {
      if (rawOptions[i].text && rawOptions[i].text === rawOptions[j].text) {
        return {
          state: 'INVALID',
          canContinue: false,
          reason: `Duplicate options: Option ${rawOptions[i].key} and Option ${rawOptions[j].key} are identical.`,
          errors: [`Duplicate options: Option ${rawOptions[i].key} and Option ${rawOptions[j].key} are identical.`],
          warnings: [],
        };
      }
    }
  }

  return {
    state: 'VALID',
    canContinue: true,
    errors: [],
    warnings: [],
  };
}

/**
 * Payload for persisting a question draft (Stage 01 only).
 * Crucial: Persisting a draft does NOT verify or approve the question.
 */
export interface SaveQuestionDraftInput {
  id?: string;
  topicId: string;
  topicName?: string;
  subtopicId: string;
  subtopicName?: string;
  difficulty: DifficultyLevel | string;
  language?: QuestionLanguage | string;
  questionText: string;
  question?: string;
  options?: {
    a: string;
    b: string;
    c?: string;
    d?: string;
  };
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  realWorldContext?: string;
  realLifeContext?: string;
  challengeType?: string;
  presentationType?: string;
  questionStyle?: QuestionStyle | string;
  generationMode?: 'SUBTOPIC' | 'RANDOM' | string;
  tags?: string[];
  source?: string;
  sourceModel?: string;
  generationLatencyMs?: number;
  isFallback?: boolean;
  mathematicalVerification?: MathVerificationSummary;
}

/**
 * Explicit command payload to submit a saved draft to Stage 02 Verification.
 */
export interface SubmitForVerificationInput {
  draftId: string;
  actorId?: string;
  actorName?: string;
  remarks?: string;
}

/**
 * Response resulting from an explicit submission to verification.
 */
export interface SubmitForVerificationResult {
  success: boolean;
  draftId: string;
  status: 'SUBMITTED_FOR_REVIEW';
  workflowStage: 'STAGE_02_VERIFICATION';
  message: string;
  submittedAt: string;
}
