/**
 * BURRA PARIKSHA CMS - Mock AI Provider for Testing
 * Phase 6: Multi-Provider Question Generation Orchestrator
 */

import {
  AIProvider,
  AIProviderOptions,
  GenerateCandidateInput,
  GenerationResult,
  RefineCandidateInput,
} from '../types';
import { DifficultyLevel, QuestionLanguage } from '../../../types';

export type MockOutcome =
  | 'SUCCESS'
  | 'QUOTA_EXHAUSTED'
  | 'RATE_LIMIT'
  | 'AUTH_ERROR'
  | 'INVALID_REQUEST'
  | 'TIMEOUT'
  | 'TRANSIENT_ERROR'
  | 'MULTIPLE_CANDIDATES';

export class MockAIProvider implements AIProvider {
  public readonly providerId: string;
  public readonly defaultModelId: string;
  public outcome: MockOutcome;
  public configured: boolean;
  public callCount: number = 0;

  constructor(
    providerId: string = 'mock-provider',
    outcome: MockOutcome = 'SUCCESS',
    configured: boolean = true,
    modelId: string = 'mock-model-v1'
  ) {
    this.providerId = providerId;
    this.outcome = outcome;
    this.configured = configured;
    this.defaultModelId = modelId;
  }

  public isConfigured(): boolean {
    return this.configured;
  }

  public async generateCandidate(
    input: GenerateCandidateInput,
    options?: AIProviderOptions
  ): Promise<GenerationResult> {
    this.callCount++;

    switch (this.outcome) {
      case 'QUOTA_EXHAUSTED':
        throw { message: 'RESOURCE_EXHAUSTED: You have exceeded your current quota for model', status: 429 };
      case 'RATE_LIMIT':
        throw { message: '429 Too Many Requests: Rate limit exceeded', status: 429 };
      case 'AUTH_ERROR':
        throw { message: '401 Unauthorized: API key not valid', status: 401 };
      case 'INVALID_REQUEST':
        throw { message: '400 Bad Request: Invalid prompt format', status: 400 };
      case 'TIMEOUT':
        throw { message: '504 Gateway Timeout: Provider generation timed out', status: 504 };
      case 'TRANSIENT_ERROR':
        throw { message: '503 Service Unavailable: Server overloaded', status: 503 };
      case 'MULTIPLE_CANDIDATES':
        return {
          candidate: {
            content: 'Candidate 1',
            option_a: 'A',
            option_b: 'B',
            option_c: 'C',
            option_d: 'D',
            correct_answer: 'A',
            explanation: 'Exp',
            difficulty: input.difficulty || DifficultyLevel.MEDIUM,
            language: input.language || QuestionLanguage.ENGLISH,
            candidates: ['Candidate 1', 'Candidate 2'], // Violates single candidate rule
          } as any,
          metadata: {
            providerId: this.providerId,
            modelId: options?.modelId || this.defaultModelId,
            modelUsed: options?.modelId || this.defaultModelId,
            generationDurationMs: 10,
          },
          validation: { isValid: true, errors: [], warnings: [] },
        };
      case 'SUCCESS':
      default:
        return {
          candidate: {
            content: `Mock generated question for topic ${input.topicId || 'T1'}`,
            option_a: 'Option A',
            option_b: 'Option B',
            option_c: 'Option C',
            option_d: 'Option D',
            correct_answer: 'A',
            explanation: 'Mock explanation of correct choice.',
            difficulty: input.difficulty || DifficultyLevel.MEDIUM,
            language: input.language || QuestionLanguage.ENGLISH,
            real_world_context: input.realLifeContext || input.realWorldContext || '',
            question_style: input.questionStyle || '',
            challenge_type: input.challengeType || '',
            presentation_type: input.presentationType || '',
            taxonomy: {
              categoryId: input.categoryId,
              categoryName: input.categoryName,
              topicId: input.topicId,
              topicName: input.topicName,
              subtopicId: input.subtopicId,
              subtopicName: input.subtopicName,
            },
          },
          metadata: {
            providerId: this.providerId,
            modelId: options?.modelId || this.defaultModelId,
            modelUsed: options?.modelId || this.defaultModelId,
            generationDurationMs: 15,
            latencyMs: 15,
            retryCount: 0,
            isMockFallback: true,
            generatorType: 'MOCK_TEST_PROVIDER',
          },
          validation: {
            isValid: true,
            errors: [],
            warnings: [],
          },
        };
    }
  }

  public async refineCandidate(
    input: RefineCandidateInput,
    options?: AIProviderOptions
  ): Promise<GenerationResult> {
    this.callCount++;
    return {
      candidate: input.currentCandidate,
      metadata: {
        providerId: this.providerId,
        modelId: options?.modelId || this.defaultModelId,
        modelUsed: options?.modelId || this.defaultModelId,
        generationDurationMs: 10,
        latencyMs: 10,
        retryCount: 0,
        isMockFallback: true,
        generatorType: 'MOCK_TEST_PROVIDER',
      },
      validation: {
        isValid: true,
        errors: [],
        warnings: [],
      },
    };
  }
}
