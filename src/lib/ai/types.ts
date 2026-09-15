/**
 * BURRA PARIKSHA CMS - AI Question Studio Types
 * Phase 4: Gemini AI Question Studio
 */

import { DifficultyLevel, QuestionLanguage, QuestionStyle } from '../../types';
import { CandidateValidationReport } from './validators/candidate.validator';
import { AIErrorClassification } from './error';
import { MathVerificationResult } from './validators/mathematical.validator';

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
  categoryId: string;
  categoryName?: string;
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
  content: string; // The question text / problem statement
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
    categoryId: string;
    categoryName?: string;
    topicId: string;
    topicName?: string;
    subtopicId: string;
    subtopicName?: string;
  };
  mathematicalVerification?: MathVerificationResult;
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
  isMockFallback?: boolean;
  generatorType?: string;
  fallbackReason?: string;
  errorClassification?: AIErrorClassification;
  fallbackUsed?: boolean;
  attemptedProviders?: string[];
}

export interface GenerationResult {
  candidate: QuestionCandidate;
  metadata: GenerationMetadata;
  validation: CandidateValidationReport;
}

export interface AIProviderOptions {
  modelId?: string;
  temperature?: number;
  timeoutMs?: number;
  maxRetries?: number;
  requestId?: string;
  allowMockFallback?: boolean;
}

export interface ScriptGenerationResult {
  scriptPayload: any;
  metadata: GenerationMetadata;
  validation?: any;
}

/**
 * Provider-Neutral AI Provider Interface.
 * Implementations must remain completely isolated from client-side or provider-specific SDK leaks.
 */
export interface AIProvider {
  readonly providerId: string;
  readonly defaultModelId: string;
  isConfigured(): boolean;
  generateCandidate(input: GenerateCandidateInput, options?: AIProviderOptions): Promise<GenerationResult>;
  refineCandidate(input: RefineCandidateInput, options?: AIProviderOptions): Promise<GenerationResult>;
  generateTeluguScript?(question: QuestionCandidate | any, options?: AIProviderOptions): Promise<ScriptGenerationResult>;
  generateContentPlanRecommendation?(input: any, options?: AIProviderOptions): Promise<any>;
}

