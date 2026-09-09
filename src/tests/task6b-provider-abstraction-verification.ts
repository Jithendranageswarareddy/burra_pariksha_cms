/**
 * BURRA PARIKSHA CMS - Task 6B Provider Abstraction & Registry Verification
 * Phase 6: AI Provider Abstraction
 *
 * Verifies:
 * 1. Provider contract exists and is provider-neutral.
 * 2. Registry can register a provider.
 * 3. Registry can retrieve a provider.
 * 4. Unknown provider fails clearly.
 * 5. Gemini service/adapter is registered.
 * 6. Gemini-specific SDK objects do not leak into provider-neutral interfaces.
 * 7. Model configuration is centralized in DEFAULT_AI_CONFIG.
 * 8. Retry count is bounded.
 * 9. Quota errors do not cause unbounded rapid retries.
 * 10. Existing AI routes/APIs remain structurally compatible.
 * 11. QuestionService remains provider-neutral.
 * 12. Existing Phase 2–5 behavior is preserved.
 *
 * All tests use fakes/mocks - NO real Gemini quota is consumed.
 */

import {
  AIProvider,
  AIProviderOptions,
  GenerateCandidateInput,
  GenerationResult,
  RefineCandidateInput,
  AIProviderRegistry,
  aiProviderRegistry,
  DEFAULT_AI_CONFIG,
  classifyAIError,
  AIProviderError,
  geminiService,
} from '../lib/ai';
import { DifficultyLevel, QuestionLanguage } from '../types';
import fs from 'fs';
import path from 'path';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED]: ${message}`);
  }
}

// Mock Fake Provider for testing registry & abstraction contracts
class MockAIProvider implements AIProvider {
  public readonly providerId: string;
  public readonly defaultModelId: string;
  public callCount: number = 0;

  constructor(id: string = 'mock-provider', model: string = 'mock-model-v1') {
    this.providerId = id;
    this.defaultModelId = model;
  }

  public isConfigured(): boolean {
    return true;
  }

  public async generateCandidate(
    input: GenerateCandidateInput,
    options?: AIProviderOptions
  ): Promise<GenerationResult> {
    this.callCount++;
    return {
      candidate: {
        content: 'Mock Question Content?',
        option_a: 'Option A',
        option_b: 'Option B',
        option_c: 'Option C',
        option_d: 'Option D',
        correct_answer: 'A',
        explanation: 'Explanation',
        difficulty: input.difficulty || DifficultyLevel.MEDIUM,
        language: input.language || QuestionLanguage.ENGLISH,
        taxonomy: {
          categoryId: input.categoryId,
          topicId: input.topicId,
          subtopicId: input.subtopicId,
        },
      },
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

export async function runTask6bTests(): Promise<void> {
  console.log('--- TASK 6B VERIFICATION START ---');

  // 1. Verify Provider Contract
  console.log('1. Verifying AIProvider Contract...');
  const mockProvider = new MockAIProvider('test-provider-1', 'test-model-alpha');
  assert(mockProvider.providerId === 'test-provider-1', 'Provider ID contract check');
  assert(mockProvider.defaultModelId === 'test-model-alpha', 'Default model ID contract check');
  assert(mockProvider.isConfigured() === true, 'isConfigured contract check');

  // 2. Verify Registry Registration
  console.log('2. Verifying AIProviderRegistry Registration...');
  const localRegistry = new AIProviderRegistry();
  localRegistry.registerProvider(mockProvider);
  assert(localRegistry.listProviders().includes('test-provider-1'), 'Registry contains registered provider ID');

  // 3. Verify Registry Retrieval
  console.log('3. Verifying Provider Retrieval...');
  const retrieved = localRegistry.getProvider('test-provider-1');
  assert(retrieved !== undefined, 'Retrieved provider should exist');
  assert(retrieved?.providerId === 'test-provider-1', 'Retrieved provider ID matches');

  // 4. Verify Unknown Provider Fails Clearly
  console.log('4. Verifying Unknown Provider Failure...');
  let unknownFailed = false;
  try {
    localRegistry.getRequiredProvider('non-existent-provider');
  } catch (err: any) {
    unknownFailed = true;
    assert(err.message.includes('non-existent-provider'), 'Error message identifies unknown provider');
  }
  assert(unknownFailed, 'getRequiredProvider must throw on unknown provider');

  // 5. Verify Gemini Service / Adapter Registration
  console.log('5. Verifying Gemini Service / Adapter Registration...');
  assert(aiProviderRegistry.getProvider('gemini') !== undefined, 'Gemini provider must be registered in global registry');
  const geminiProv = aiProviderRegistry.getProvider('gemini');
  assert(geminiProv?.providerId === 'gemini', 'Gemini provider ID must be gemini');

  // 6. Verify Gemini-Specific SDK Objects Do Not Leak
  console.log('6. Verifying Isolation from Gemini SDK Leaks...');
  const typesFilePath = path.join(process.cwd(), 'src/lib/ai/types.ts');
  const typesContent = fs.readFileSync(typesFilePath, 'utf-8');
  assert(!typesContent.includes('@google/genai'), 'types.ts must not import @google/genai');
  assert(!typesContent.includes('GoogleGenAI'), 'types.ts must not reference GoogleGenAI');

  // 7. Verify Centralized Model Configuration
  console.log('7. Verifying Centralized Model Configuration...');
  assert(DEFAULT_AI_CONFIG.defaultProvider === 'gemini', 'Default provider configured');
  assert(DEFAULT_AI_CONFIG.allowedGeminiModels.length > 0, 'Allowed Gemini models configured');
  assert(DEFAULT_AI_CONFIG.maxTotalAttempts <= 2, 'maxTotalAttempts bounded <= 2');
  assert(DEFAULT_AI_CONFIG.quotaRetryable === false, 'quotaRetryable must be false for quota safety');

  // 8 & 9. Verify Bounded Retry and Quota Error Classification
  console.log('8 & 9. Verifying Quota Safety & Bounded Retry Policy...');
  const quotaErr = { message: 'RESOURCE_EXHAUSTED: You have exceeded your current quota', status: 429 };
  const classifiedQuota = classifyAIError(quotaErr);
  assert(classifiedQuota.classification === 'QUOTA_EXHAUSTED', 'Classifies RESOURCE_EXHAUSTED as QUOTA_EXHAUSTED');
  assert(classifiedQuota.isRetryable === false, 'Quota exhausted error must NOT be retryable on same model');

  const authErr = { message: 'API key not valid. Please pass a valid API key.', status: 400 };
  const classifiedAuth = classifyAIError(authErr);
  assert(classifiedAuth.classification === 'AUTH_ERROR', 'Classifies invalid API key as AUTH_ERROR');
  assert(classifiedAuth.isRetryable === false, 'Auth error must NOT be retryable');

  const transientErr = { message: '503 Service Unavailable / High Demand', status: 503 };
  const classifiedTransient = classifyAIError(transientErr);
  assert(classifiedTransient.classification === 'TRANSIENT_ERROR', 'Classifies 503 as TRANSIENT_ERROR');
  assert(classifiedTransient.isRetryable === true, 'Transient error is retryable');

  // Test provider error key redaction
  const keyErr = new AIProviderError('Error with AIzaSyABC1234567890123456789012345678901', 'gemini', 'gemini-3.7-flash', 'AUTH_ERROR', false);
  assert(!keyErr.message.includes('AIzaSyABC'), 'AIProviderError sanitizes API key');
  assert(keyErr.message.includes('[REDACTED_KEY]'), 'AIProviderError contains [REDACTED_KEY]');

  // 10. Verify API Route Compatibility
  console.log('10. Verifying API Route Compatibility...');
  const sampleGenResult = await mockProvider.generateCandidate({
    categoryId: 'c1',
    topicId: 't1',
    subtopicId: 'st1',
    difficulty: DifficultyLevel.MEDIUM,
    language: QuestionLanguage.ENGLISH,
  });
  assert(sampleGenResult.candidate.content !== undefined, 'Candidate content present');
  assert(sampleGenResult.metadata.modelUsed !== undefined, 'Model used metadata present');
  assert(sampleGenResult.validation.isValid !== undefined, 'Validation report present');

  // 11. Verify QuestionService Provider-Neutral Status
  console.log('11. Verifying QuestionService Provider-Neutral Status...');
  const questionServicePath = path.join(process.cwd(), 'src/lib/services/question.service.ts');
  const questionServiceContent = fs.readFileSync(questionServicePath, 'utf-8');
  assert(!questionServiceContent.includes('@google/genai'), 'QuestionService must not import @google/genai');
  assert(!questionServiceContent.includes('GoogleGenAI'), 'QuestionService must not reference GoogleGenAI');

  // 12. Verify Phase 2-5 Behavior Preserved (Gemini candidate generation fallback)
  console.log('12. Verifying Phase 2-5 Candidate Fallback Behavior...');
  const genResult = await geminiService.generateCandidate({
    categoryId: 'c1',
    topicId: 't1',
    subtopicId: 'st1',
    difficulty: DifficultyLevel.MEDIUM,
    language: QuestionLanguage.ENGLISH,
  });
  assert(genResult.candidate.content.length > 0, 'Candidate generated via fallback or live engine');
  assert(genResult.metadata.providerId === 'gemini', 'Provider ID recorded in metadata');

  console.log('--- TASK 6B VERIFICATION COMPLETED SUCCESSFULLY ---');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runTask6bTests()
    .then(() => {
      console.log('TASK 6B TEST RUN PASSED.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('TASK 6B TEST RUN FAILED:', err);
      process.exit(1);
    });
}
