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
import { ExplainedQuestionItem, QuestionCandidate } from '../../types/question';

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
  productionMode?: string;
  targetQuestionCount?: number;
  questionCount?: number;
  aspectRatio?: '9:16' | '16:9' | string;
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

export type QuestionBatchStatus =
  | 'EMPTY'
  | 'GENERATING'
  | 'PARTIAL'
  | 'COMPLETE'
  | 'ACCEPTED'
  | 'FAILED';

export type QuestionBatchSlotStatus =
  | 'EMPTY'
  | 'GENERATING'
  | 'VALID'
  | 'INVALID'
  | 'MANUALLY_EDITED'
  | 'ACCEPTED';

export interface QuestionBatchSlot {
  slotNumber: number;
  slotId: string;
  status: QuestionBatchSlotStatus;
  questionText: string;
  options: { a: string; b: string; c: string; d: string };
  correctAnswer: 'A' | 'B' | 'C' | 'D' | '';
  explanation: string;
  isManuallyEdited: boolean;
  validationErrors: string[];
  revisionNumber: number;
}

export interface QuestionBatchRejectedItem {
  candidateIndex: number;
  reason: string;
}

export interface QuestionBatchAssembly {
  requestedCount: 5 | 10 | 15 | 20;
  inMemoryValidCount: number;
  persistedValidCount: number | null;
  rejectedCount: number;
  overflowCount: number;
  batchStatus: QuestionBatchStatus;
  slots: QuestionBatchSlot[];
  rejectedItems: QuestionBatchRejectedItem[];
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
  productionMode?: string;
  targetQuestionCount?: number;
  aspectRatio?: string;
  introductoryConcept?: string;
  conceptTitle?: string;
  syllabusScopeNotes?: string;
  questions?: ExplainedQuestionItem[];
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
 * Polymorphic across Mode 1 (QUESTION_CHALLENGE_SHORT), Mode 2 (TOPIC_INTRODUCTION), and Mode 3 (EXPLAINED_QUESTIONS_VIDEO).
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

  // --- MODE 2: TOPIC_INTRODUCTION ---
  if (candidate.productionMode === 'TOPIC_INTRODUCTION') {
    const conceptText = (candidate.introductoryConcept || candidate.questionText || '').trim();
    if (!hasCandidate || !conceptText) {
      return {
        state: 'EMPTY',
        canContinue: false,
        reason: 'Topic Introduction concept workspace is empty. Provide an introductory concept statement.',
        errors: [],
        warnings: [],
      };
    }

    const errors: string[] = [];
    if (conceptText.length < 15) {
      errors.push('Introductory concept text must be at least 15 characters.');
    }
    if (candidate.aspectRatio && candidate.aspectRatio !== '9:16' && candidate.aspectRatio !== '16:9') {
      errors.push('Topic Introduction aspect ratio must be either 9:16 or 16:9.');
    }

    if (errors.length > 0) {
      return {
        state: 'INCOMPLETE',
        canContinue: false,
        reason: errors[0],
        errors,
        warnings: [],
      };
    }

    return {
      state: 'VALID',
      canContinue: true,
      errors: [],
      warnings: [],
    };
  }

  // --- MODE 3: EXPLAINED_QUESTIONS_VIDEO ---
  if (candidate.productionMode === 'EXPLAINED_QUESTIONS_VIDEO') {
    const introText = (candidate.introductoryConcept || candidate.questionText || '').trim();
    if (!hasCandidate && !introText && (!candidate.questions || candidate.questions.length === 0)) {
      return {
        state: 'EMPTY',
        canContinue: false,
        reason: 'Explained questions workspace is empty.',
        errors: [],
        warnings: [],
      };
    }

    const targetCount = candidate.targetQuestionCount || 5;
    const errors: string[] = [];

    if (!introText || introText.length < 15) {
      errors.push('Introductory concept/overview must be at least 15 characters.');
    }

    if (candidate.aspectRatio && candidate.aspectRatio !== '16:9') {
      errors.push('Explained Questions Video must use 16:9 aspect ratio.');
    }

    const questions = candidate.questions || [];
    if (questions.length < targetCount) {
      errors.push(`Requires ${targetCount} explained questions (currently has ${questions.length}).`);
    }

    for (let i = 0; i < Math.min(questions.length, targetCount); i++) {
      const q = questions[i];
      const qIdx = q.questionNumber || i + 1;
      const qText = (q.questionText || '').trim();
      const a = (q.optionA || q.options?.a || '').trim();
      const b = (q.optionB || q.options?.b || '').trim();
      const c = (q.optionC || q.options?.c || '').trim();
      const d = (q.optionD || q.options?.d || '').trim();
      const ans = (q.correctAnswer || '').trim().toUpperCase();

      if (!qText || qText.length < 5) {
        errors.push(`Question #${qIdx}: Question statement must be at least 5 characters.`);
      }
      if (!a) errors.push(`Question #${qIdx}: Option A is required.`);
      if (!b) errors.push(`Question #${qIdx}: Option B is required.`);
      if (!c) errors.push(`Question #${qIdx}: Option C is required.`);
      if (!d) errors.push(`Question #${qIdx}: Option D is required.`);
      if (!['A', 'B', 'C', 'D'].includes(ans)) {
        errors.push(`Question #${qIdx}: Correct answer must be A, B, C, or D.`);
      }
    }

    if (errors.length > 0) {
      return {
        state: 'INCOMPLETE',
        canContinue: false,
        reason: errors[0],
        errors,
        warnings: [],
      };
    }

    return {
      state: 'VALID',
      canContinue: true,
      errors: [],
      warnings: [],
    };
  }

  // --- MODE 1: QUESTION_CHALLENGE_SHORT (Default) ---
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
  correctAnswer?: 'A' | 'B' | 'C' | 'D' | string;
  explanation?: string;
  realWorldContext?: string;
  realLifeContext?: string;
  challengeType?: string;
  presentationType?: string;
  questionStyle?: QuestionStyle | string;
  generationMode?: 'SUBTOPIC' | 'RANDOM' | string;
  productionMode?: string;
  targetQuestionCount?: number;
  aspectRatio?: string;
  introductoryConcept?: string;
  conceptTitle?: string;
  syllabusScopeNotes?: string;
  questions?: ExplainedQuestionItem[];
  tags?: string[];
  source?: string;
  sourceModel?: string;
  generationLatencyMs?: number;
  isFallback?: boolean;
  mathematicalVerification?: MathVerificationSummary;
  version?: number;
  workflowInstanceId?: string;
  batchStatus?: QuestionBatchStatus;
  persistedValidCount?: number;
  rejectedCount?: number;
  overflowCount?: number;
  slots?: QuestionBatchSlot[];
  rejectedItems?: QuestionBatchRejectedItem[];
}

/**
 * Explicit command payload to submit a saved draft to Stage 02 Verification.
 */
export interface SubmitForVerificationInput {
  draftId: string;
  actorId?: string;
  actorName?: string;
  remarks?: string;
  expectedVersion: number; // Required positive integer for concurrency-safe draft submission
}

/**
 * Response resulting from an explicit submission to verification.
 */
export interface SubmitForVerificationResult {
  success: boolean;
  draftId: string;
  status: 'SUBMITTED_FOR_REVIEW';
  workflowStage: 'STAGE_02_VERIFICATION';
  workflowInstanceId?: string;
  currentStep?: number;
  message: string;
  submittedAt: string;
}
