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
import {
  QuestionQualityIssue,
  QuestionQualityValidationResult,
} from './question-quality.contract';
import { validateQuestionQuality } from '../../lib/question-quality-validator';

export * from './question-quality.contract';
export * from './audience-preview.contract';

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
  introductoryConcept?: string;
  conceptTitle?: string;
  syllabusScopeNotes?: string;
  existingSlots?: QuestionBatchSlot[];
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
  candidates?: QuestionCandidate[];
  batchAssembly?: QuestionBatchAssembly;
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
  qualityReport?: QuestionQualityValidationResult;
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
  candidate: Partial<StudioCandidate> & { batchAssembly?: QuestionBatchAssembly | null; slots?: any[] };
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

    const qualityReport = validateQuestionQuality(candidate);
    if (!qualityReport.isValid) {
      return {
        state: 'INCOMPLETE',
        canContinue: false,
        reason: qualityReport.errorMessages[0],
        errors: qualityReport.errorMessages,
        warnings: qualityReport.warningMessages,
        qualityReport,
      };
    }

    return {
      state: 'VALID',
      canContinue: true,
      errors: [],
      warnings: qualityReport.warningMessages,
      qualityReport,
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

    const qualityReport = validateQuestionQuality(candidate);
    if (!qualityReport.isValid) {
      return {
        state: 'INCOMPLETE',
        canContinue: false,
        reason: qualityReport.errorMessages[0],
        errors: qualityReport.errorMessages,
        warnings: qualityReport.warningMessages,
        qualityReport,
      };
    }

    return {
      state: 'VALID',
      canContinue: true,
      errors: [],
      warnings: qualityReport.warningMessages,
      qualityReport,
    };
  }

  // --- MODE 1: QUESTION_CHALLENGE_SHORT (Default) ---
  const candidateBatchSlots = (candidate as any).batchAssembly?.slots || (candidate as any).slots;
  if (candidate.targetQuestionCount && candidate.targetQuestionCount > 1 && Array.isArray(candidateBatchSlots) && candidateBatchSlots.length > 0) {
    const hasAnySlotContent = candidateBatchSlots.some(
      (s: any) => s && (s.questionText?.trim() || (s.status && s.status !== 'EMPTY'))
    );
    if (!hasCandidate && !hasAnySlotContent) {
      return {
        state: 'EMPTY',
        canContinue: false,
        reason: 'Question workspace is empty. Generate a candidate or draft manually.',
        errors: [],
        warnings: [],
      };
    }

    const qualityReport = validateQuestionQuality(candidate);
    if (!qualityReport.isValid) {
      return {
        state: 'INCOMPLETE',
        canContinue: false,
        reason: qualityReport.errorMessages[0],
        errors: qualityReport.errorMessages,
        warnings: qualityReport.warningMessages,
        qualityReport,
      };
    }

    return {
      state: 'VALID',
      canContinue: true,
      errors: [],
      warnings: qualityReport.warningMessages,
      qualityReport,
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

  const qualityReport = validateQuestionQuality(candidate);
  if (!qualityReport.isValid) {
    const isHardInvalid = qualityReport.errors.some(
      (e) => e.code === 'ERR_INVALID_ANSWER_KEY' || e.code === 'ERR_OPTION_DUPLICATE'
    );
    return {
      state: isHardInvalid ? 'INVALID' : 'INCOMPLETE',
      canContinue: false,
      reason: qualityReport.errorMessages[0],
      errors: qualityReport.errorMessages,
      warnings: qualityReport.warningMessages,
      qualityReport,
    };
  }

  return {
    state: 'VALID',
    canContinue: true,
    errors: [],
    warnings: qualityReport.warningMessages,
    qualityReport,
  };
}


/**
 * Payload for persisting a question draft (Stage 01 only).
 * Crucial: Persisting a draft does NOT verify or approve the question.
 */
export interface SaveQuestionDraftInput {
  id?: string;
  /** Optional relationship to the authoritative, submitted LearningUnit. */
  learningUnitId?: string;
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
  expectedVersion?: number;
  workflowInstanceId?: string;
  batchStatus?: QuestionBatchStatus;
  persistedValidCount?: number;
  rejectedCount?: number;
  overflowCount?: number;
  slots?: QuestionBatchSlot[];
  rejectedItems?: QuestionBatchRejectedItem[];
  reviewerFeedback?: string;
  reviewerId?: string;
  reviewerName?: string;
  returnedAt?: string;
  returnReason?: string;
  revisionCount?: number;
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

/**
 * Reviewer command payload to return a submitted draft for revision (Stage 02 reviewer decision).
 */
export interface ReturnDraftForRevisionInput {
  draftId: string;
  feedback: string;
  expectedVersion?: number;
  action?: 'QUESTION_REQUEST_CHANGES' | 'QUESTION_REJECT';
}

/**
 * Result of returning a draft for revision back to Question Studio (Step 01).
 */
export interface ReturnDraftForRevisionResult {
  success: boolean;
  draftId: string;
  workflowInstanceId?: string;
  currentStep: number;
  status: 'DRAFT';
  workflowStage: 'QUESTION_STUDIO';
  reviewerFeedback: string;
  returnedAt: string;
  message: string;
}
