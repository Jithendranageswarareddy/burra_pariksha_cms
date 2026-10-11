/**
 * BURRA PARIKSHA CMS — Question API Contracts & DTOs
 * Request/response shapes for creation, AI generation, and multi-layer verification
 */

import {
  AiRefinementAction,
  DifficultyLevel,
  QuestionLanguage,
  QuestionStatus,
  QuestionStyle,
  QuestionValidationStatus,
  VideoProductionStatus,
} from '../constants/enums';
import { QuestionCandidate } from '../types/question';

export interface CreateQuestionInput {
  id?: string;
  contentId?: string;
  contentMasterId?: string;
  topicId: string;
  topicName?: string;
  subtopicId: string;
  subtopicName?: string;
  difficulty: DifficultyLevel | string;
  language?: string;
  questionText: string;
  question?: string;
  content?: string;
  options: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  realWorldContext?: string;
  realLifeContext?: string;
  challengeType?: string;
  presentationType?: string;
  questionStyle?: QuestionStyle | string;
  status?: QuestionStatus;
  videoStatus?: VideoProductionStatus;
  tags?: string[];
  source?: string;
  aiPromptUsed?: string;
  aiModel?: string;
  aiPrompt?: string;
  originalityScore?: number;
  authorId?: string;
  author?: string;
  generationMode?: string;
  createdAt?: string;
  updatedAt?: string;
  validationStatus?: string;
  validationScore?: number;
  lastValidationId?: string;
}

export interface UpdateQuestionInput {
  topicId?: string;
  topicName?: string;
  subtopicId?: string;
  subtopicName?: string;
  difficulty?: DifficultyLevel | string;
  language?: string;
  questionText?: string;
  question?: string;
  options?: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  correctAnswer?: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  realWorldContext?: string;
  realLifeContext?: string;
  challengeType?: string;
  presentationType?: string;
  questionStyle?: QuestionStyle | string;
  status?: QuestionStatus;
  videoStatus?: VideoProductionStatus;
  tags?: string[];
  source?: string;
  updatedAt?: string;
}

export interface SaveQuestionDraftInput {
  id?: string;
  topicId: string;
  subtopicId: string;
  difficulty: DifficultyLevel | string;
  questionText: string;
  options: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  realWorldContext?: string;
  questionStyle?: QuestionStyle | string;
  tags?: string[];
}

export interface SubmitForVerificationInput {
  draftId?: string;
  questionId?: string;
  actorId?: string;
  remarks?: string;
}

export interface GenerateCandidateInput {
  topicId: string;
  topicName?: string;
  subtopicId: string;
  subtopicName?: string;
  difficulty: DifficultyLevel;
  language: QuestionLanguage;
  questionStyle?: QuestionStyle | string;
  realWorldContext?: string;
  realLifeContext?: string;
  challengeType?: string;
  presentationType?: string;
  customInstructions?: string;
  generationMode?: 'SUBTOPIC' | 'RANDOM';
}

export interface RefineCandidateInput {
  action: AiRefinementAction | string;
  currentCandidate: QuestionCandidate;
  promptModifier?: string;
  targetDifficulty?: DifficultyLevel;
  targetLanguage?: QuestionLanguage;
  targetContext?: string;
}

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
  errorClassification?: any;
  fallbackUsed?: boolean;
  attemptedProviders?: string[];
}

export interface GenerationResult {
  candidate: QuestionCandidate;
  metadata: GenerationMetadata;
  validation?: any;
}

export type ValidationSource =
  | 'DETERMINISTIC'
  | 'AI_ASSISTED'
  | 'MULTI_MODEL_CONSENSUS'
  | 'HYBRID';

export interface ValidationCheckItem {
  id: string;
  name: string;
  category:
    | 'STRUCTURAL'
    | 'TAXONOMY'
    | 'OPTION'
    | 'MATHEMATICAL'
    | 'LOGICAL'
    | 'ANSWER'
    | 'EXPLANATION'
    | 'AMBIGUITY'
    | 'CONSISTENCY'
    | 'FAIRNESS'
    | 'MODEL_CONSENSUS';
  status: 'PASS' | 'WARN' | 'FAIL' | 'NEEDS_REVIEW' | 'NOT_APPLICABLE';
  message: string;
  details?: string;
  confidence?: number;
}

export interface AnswerVerificationResult {
  isConsistent: boolean;
  declaredAnswer: string;
  verifiedAnswer?: string;
  matchedOption?: string;
  details: string;
  contradictionDetected: boolean;
}

export interface ExplanationVerificationResult {
  isValid: boolean;
  contradictsAnswer: boolean;
  reachesDeclaredResult: boolean;
  substantiveLength: boolean;
  details: string;
}

export interface AmbiguityResult {
  isAmbiguous: boolean;
  ambiguityReasons: string[];
  confidence: number;
  details: string;
}

export interface MathematicalLogicalResult {
  status: 'PROVABLY_VALID' | 'CONTRADICTORY' | 'NOT_DETERMINISTICALLY_VERIFIED' | 'NOT_APPLICABLE';
  problemType?: string;
  calculatedValue?: number | string;
  expectedUnit?: string;
  matchedOption?: string;
  calculationSteps?: string[];
  details: string;
  reason?: string;
}

export interface ValidationEvidence {
  providerId: string;
  modelId: string;
  verdict: 'VALID' | 'NEEDS_REVIEW' | 'INVALID';
  confidence: number;
  reasoningSummary: string;
  detectedIssues: string[];
  timestamp: string;
}

export interface ValidationResult {
  id: string;
  questionId: string;
  status: QuestionValidationStatus;
  confidenceScore: number;
  validatorVersion: string;
  validationRuleVersion: string;
  timestamp: string;
  source: ValidationSource;
  summary: string;
  checks: ValidationCheckItem[];
  errors: string[];
  warnings: string[];
  recommendations: string[];
  answerVerification: AnswerVerificationResult;
  explanationVerification: ExplanationVerificationResult;
  ambiguityResult: AmbiguityResult;
  mathematicalLogicalResult: MathematicalLogicalResult;
  modelEvidence?: ValidationEvidence[];
  layers?: Record<string, any>;
  layerList?: any[];
  isStale?: boolean;
  validatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type MathVerificationStatus = 'VERIFIED' | 'FAILED' | 'UNVERIFIED' | 'NOT_APPLICABLE';

export interface MathVerificationResult {
  status: MathVerificationStatus;
  problemType?: string;
  expectedValue?: number | string;
  expectedUnit?: string;
  matchedOption?: 'A' | 'B' | 'C' | 'D';
  allMatchedOptions?: ('A' | 'B' | 'C' | 'D')[];
  reason?: string;
  details?: string;
  calculationSteps?: string[];
}

export interface CandidateValidationReport {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  metrics?: {
    charCount: number;
    explanationCharCount: number;
    hasBurraTrick: boolean;
    hasTeluguScript: boolean;
    isNumericProblem: boolean;
  };
  mathematicalVerification?: MathVerificationResult;
}
