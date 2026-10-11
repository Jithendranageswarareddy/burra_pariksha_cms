/**
 * BURRA PARIKSHA CMS - AI Question Studio Types
 * Phase 4: Gemini AI Question Studio
 */

import { DifficultyLevel, QuestionLanguage, QuestionStyle } from '../../../shared';
import { CandidateValidationReport } from '../validators/candidate.validator';
import { AIErrorClassification } from '../errors';
import { MathVerificationResult } from '../validators/mathematical.validator';

import { AiRefinementAction, GenerateCandidateInput, QuestionCandidate, RefineCandidateInput, GenerationMetadata, GenerationResult } from '../../../shared';

export { AiRefinementAction };
export type {
  GenerateCandidateInput,
  QuestionCandidate,
  RefineCandidateInput,
  GenerationMetadata,
  GenerationResult,
};




export interface AIProviderOptions {
  modelId?: string;
  temperature?: number;
  timeoutMs?: number;
  maxRetries?: number;
  requestId?: string;
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

