/**
 * BURRA PARIKSHA CMS - AI Abstraction & Multi-Provider Contracts
 * Backward compatibility re-export shim: canonical definitions reside in backend/ai/orchestrator/types.
 */

export type {
  AIProviderId,
  AITaskType,
  AIProviderHealthState,
  AIFailureCategory,
  AIGenerationSource,
  AIRetryPolicy,
  AIRateLimitState,
  AIProviderMetadata,
  AIRequest,
  AIAttemptDetail,
  AIProvenance,
  AINormalizedResponse,
  AIProviderHealth,
  IAIProvider,
} from '../../backend/ai/orchestrator/types';


import { DifficultyLevel, QuestionLanguage, QuestionStyle } from './index';

export enum AiRefinementAction {
  REGENERATE = 'REGENERATE',
  IMPROVE_OPTIONS = 'IMPROVE_OPTIONS',
  MAKE_REALISTIC = 'MAKE_REALISTIC',
  SIMPLIFY_LANGUAGE = 'SIMPLIFY_LANGUAGE',
  IMPROVE_TELUGU = 'IMPROVE_TELUGU',
  INCREASE_DIFFICULTY = 'INCREASE_DIFFICULTY',
  DECREASE_DIFFICULTY = 'DECREASE_DIFFICULTY',
  IMPROVE_EXPLANATION = 'IMPROVE_EXPLANATION',
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

export interface QuestionCandidate {
  content: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  difficulty: DifficultyLevel;
  language: QuestionLanguage;
  real_world_context?: string;
  question_style?: string;
  challenge_type?: string;
  presentation_type?: string;
  taxonomy?: {
    topicId: string;
    topicName?: string;
    subtopicId: string;
    subtopicName?: string;
  };
  mathematicalVerification?: any;
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
  validation: any;
}
