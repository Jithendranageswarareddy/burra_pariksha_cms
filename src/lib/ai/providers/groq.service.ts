/**
 * BURRA PARIKSHA CMS - Groq Service Provider
 * Phase 22.6D: Real Secondary Generator Provider Integration
 * 
 * Implements AIProvider contract for Groq using POST /openai/v1/chat/completions.
 * Enforces strict JSON Schema constrained decoding, server-side validation, and telemetry.
 */

import { groqClient, GroqClient } from './groq.client';
import {
  AIProvider,
  AIProviderOptions,
  GenerateCandidateInput,
  GenerationResult,
  QuestionCandidate,
  RefineCandidateInput,
} from '../types';
import {
  BURRA_PARIKSHA_SYSTEM_INSTRUCTION,
  buildGenerationPrompt,
} from '../prompts/generation.prompt';
import { buildRefinementPrompt } from '../prompts/refinement.prompt';
import { QuestionCandidateZodSchema } from '../schemas/question-candidate.schema';
import { CandidateValidator } from '../validators/candidate.validator';
import { classifyAIError, AIProviderError } from '../error';
import { aiProviderRegistry } from '../registry';
import { recordUsageAttempt } from '../observability';
import { DifficultyLevel, QuestionLanguage } from '../../../types';

/**
 * Strict JSON Schema representation for QuestionCandidate output.
 * Fully compatible with QuestionCandidateZodSchema.
 */
export const GROQ_QUESTION_CANDIDATE_SCHEMA = {
  type: 'object',
  properties: {
    content: {
      type: 'string',
      description: 'The complete, precise problem statement of the aptitude question.',
    },
    option_a: {
      type: 'string',
      description: 'Option A value or text.',
    },
    option_b: {
      type: 'string',
      description: 'Option B value or text.',
    },
    option_c: {
      type: 'string',
      description: 'Option C value or text.',
    },
    option_d: {
      type: 'string',
      description: 'Option D value or text.',
    },
    correct_answer: {
      type: 'string',
      enum: ['A', 'B', 'C', 'D'],
      description: 'The single strictly correct option (must be exactly A, B, C, or D).',
    },
    explanation: {
      type: 'string',
      description: 'Step-by-step mathematical reasoning, verification of calculation, and speed trick/shortcut.',
    },
    difficulty: {
      type: 'string',
      enum: ['EASY', 'MEDIUM', 'HARD'],
      description: 'The difficulty tier of this question.',
    },
    language: {
      type: 'string',
      enum: ['ENGLISH', 'TELUGU'],
      description: 'The language of the question.',
    },
    real_world_context: {
      type: 'string',
      description: 'The real-world scenario or practical situation used as the question theme.',
    },
    question_style: {
      type: 'string',
      description: 'The stylistic category or pedagogical angle of the question.',
    },
  },
  required: [
    'content',
    'option_a',
    'option_b',
    'option_c',
    'option_d',
    'correct_answer',
    'explanation',
    'difficulty',
    'language',
    'real_world_context',
    'question_style',
  ],
  additionalProperties: false,
};

/**
 * Robust extractor for Groq Chat Completions API responses (POST /openai/v1/chat/completions).
 */
export function extractGroqCompletionText(body: any): string | null {
  if (!body) return null;

  if (Array.isArray(body.choices) && body.choices.length > 0) {
    const message = body.choices[0]?.message;
    if (message) {
      if (typeof message.content === 'string') {
        return message.content;
      }
      if (Array.isArray(message.content)) {
        for (const item of message.content) {
          if (typeof item === 'string') return item;
          if (item && typeof item.text === 'string') return item.text;
        }
      }
    }
  }

  if (typeof body.output_text === 'string') return body.output_text;
  if (typeof body.text === 'string') return body.text;

  return null;
}

export class GroqService implements AIProvider {
  public readonly providerId: string = 'groq';
  public readonly defaultModelId: string = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

  private client: GroqClient;
  private static instance: GroqService | null = null;

  constructor(client: GroqClient = groqClient) {
    this.client = client;
    aiProviderRegistry.registerProvider(this);
  }

  public static getInstance(): GroqService {
    if (!GrokServiceInstanceAvailable(GroqService.instance)) {
      GroqService.instance = new GroqService();
    }
    return GroqService.instance;
  }

  public isConfigured(): boolean {
    return this.client.isConfigured();
  }

  /**
   * Helper to execute Groq call with bounded retry for transient failures.
   * Quota (429) and Auth (401/403) are strictly non-retryable.
   */
  private async executeWithBoundedRetry(params: {
    model: string;
    systemInstruction: string;
    userPrompt: string;
    options?: AIProviderOptions;
  }): Promise<{ text: string; modelUsed: string; attempts: number }> {
    const model = params.options?.modelId || this.client.getModelName(this.defaultModelId);
    const maxRetries = 1; // Bounded: at most 1 retry for transient errors
    let attempts = 0;
    let lastError: any = null;

    const payload = {
      model,
      messages: [
        {
          role: 'system' as const,
          content: params.systemInstruction,
        },
        {
          role: 'user' as const,
          content: params.userPrompt,
        },
      ],
      response_format: {
        type: 'json_schema' as const,
        json_schema: {
          name: 'question_candidate',
          strict: true,
          schema: GROQ_QUESTION_CANDIDATE_SCHEMA,
        },
      },
      temperature: params.options?.temperature ?? 0.7,
    };

    while (attempts <= maxRetries) {
      attempts++;
      const attemptStartTime = Date.now();
      try {
        const responseBody = await this.client.generateChatCompletion(payload, {
          timeoutMs: params.options?.timeoutMs || 30000,
        });
        const latencyMs = Date.now() - attemptStartTime;

        const extracted = extractGroqCompletionText(responseBody);
        if (!extracted || extracted.trim().length === 0) {
          try {
            const usage = responseBody?.usage;
            recordUsageAttempt({
              operation: 'GENERATION',
              providerId: this.providerId,
              modelId: model,
              attemptNumber: attempts,
              fallbackUsed: !!params.options?.fallbackUsed,
              success: false,
              httpStatus: 400,
              errorCategory: 'INVALID_REQUEST',
              latencyMs,
              inputTokens: typeof usage?.prompt_tokens === 'number' ? usage.prompt_tokens : null,
              outputTokens: typeof usage?.completion_tokens === 'number' ? usage.completion_tokens : null,
              totalTokens: typeof usage?.total_tokens === 'number' ? usage.total_tokens : null,
              requestId: params.options?.requestId ?? null,
            });
          } catch {
            // Telemetry failure must never disrupt business operations
          }

          throw new AIProviderError(
            'Groq API returned an empty or unparseable output structure',
            this.providerId,
            model,
            'INVALID_REQUEST',
            false,
            400
          );
        }

        try {
          const usage = responseBody?.usage;
          recordUsageAttempt({
            operation: 'GENERATION',
            providerId: this.providerId,
            modelId: model,
            attemptNumber: attempts,
            fallbackUsed: !!params.options?.fallbackUsed,
            success: true,
            httpStatus: 200,
            latencyMs,
            inputTokens: typeof usage?.prompt_tokens === 'number' ? usage.prompt_tokens : null,
            outputTokens: typeof usage?.completion_tokens === 'number' ? usage.completion_tokens : null,
            totalTokens: typeof usage?.total_tokens === 'number' ? usage.total_tokens : null,
            requestId: params.options?.requestId ?? null,
          });
        } catch {
          // Telemetry failure must never disrupt business operations
        }

        return {
          text: extracted,
          modelUsed: model,
          attempts,
        };
      } catch (err: any) {
        const latencyMs = Date.now() - attemptStartTime;
        lastError = err;
        const classified = err instanceof AIProviderError
          ? { classification: err.classification, isRetryable: err.isRetryable, statusCode: err.statusCode }
          : classifyAIError(err);

        // Record failed attempt (only if not already recorded above for empty output)
        if (!(err instanceof AIProviderError && err.message.includes('empty or unparseable'))) {
          try {
            recordUsageAttempt({
              operation: 'GENERATION',
              providerId: this.providerId,
              modelId: model,
              attemptNumber: attempts,
              fallbackUsed: !!params.options?.fallbackUsed,
              success: false,
              httpStatus: classified.statusCode ?? (classified.classification === 'QUOTA_EXHAUSTED' ? 429 : (classified.classification === 'AUTH_ERROR' ? 401 : 500)),
              errorCategory: classified.classification,
              latencyMs,
              inputTokens: null,
              outputTokens: null,
              totalTokens: null,
              requestId: params.options?.requestId ?? null,
            });
          } catch {
            // Telemetry failure must never disrupt business operations
          }
        }

        // Quota and auth errors are strictly non-retryable
        if (
          !classified.isRetryable ||
          classified.classification === 'QUOTA_EXHAUSTED' ||
          classified.classification === 'RATE_LIMIT' ||
          classified.classification === 'AUTH_ERROR'
        ) {
          break;
        }

        if (attempts <= maxRetries) {
          // Brief exponential backoff before retry
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      }
    }

    if (lastError instanceof AIProviderError) {
      throw lastError;
    }

    const classified = classifyAIError(lastError);
    throw new AIProviderError(
      classified.sanitizedMessage,
      this.providerId,
      model,
      classified.classification,
      classified.isRetryable,
      classified.statusCode
    );
  }

  /**
   * Generates a single aptitude question candidate using Groq.
   */
  public async generateCandidate(
    input: GenerateCandidateInput,
    options?: AIProviderOptions
  ): Promise<GenerationResult> {
    const startTime = Date.now();
    const model = options?.modelId || this.client.getModelName(this.defaultModelId);

    if (!this.isConfigured()) {
      throw new AIProviderError(
        'Groq is not configured (missing GROQ_API_KEY)',
        this.providerId,
        model,
        'AUTH_ERROR',
        false,
        401
      );
    }

    const userPrompt = buildGenerationPrompt(input);
    const { text, modelUsed, attempts } = await this.executeWithBoundedRetry({
      model,
      systemInstruction: BURRA_PARIKSHA_SYSTEM_INSTRUCTION,
      userPrompt,
      options,
    });

    let rawCandidate: any;
    try {
      rawCandidate = JSON.parse(text);
    } catch {
      throw new AIProviderError(
        'Groq response contained invalid JSON payload',
        this.providerId,
        modelUsed,
        'INVALID_REQUEST',
        false,
        400
      );
    }

    const parsed = QuestionCandidateZodSchema.safeParse(rawCandidate);
    if (!parsed.success) {
      const parseIssues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
      throw new AIProviderError(
        `Groq candidate failed schema validation: ${parseIssues}`,
        this.providerId,
        modelUsed,
        'INVALID_REQUEST',
        false,
        400
      );
    }

    const validData = parsed.data;
    const candidate: QuestionCandidate = {
      content: validData.content,
      option_a: validData.option_a,
      option_b: validData.option_b,
      option_c: validData.option_c,
      option_d: validData.option_d,
      correct_answer: validData.correct_answer,
      explanation: validData.explanation,
      difficulty: (validData.difficulty as DifficultyLevel) || input.difficulty || DifficultyLevel.MEDIUM,
      language: (validData.language as QuestionLanguage) || input.language || QuestionLanguage.ENGLISH,
      real_world_context: validData.real_world_context || input.realWorldContext || '',
      question_style: validData.question_style || (input.questionStyle as string) || 'Real-World Scenario',
      taxonomy: {
        categoryId: input.categoryId,
        categoryName: input.categoryName,
        topicId: input.topicId,
        topicName: input.topicName,
        subtopicId: input.subtopicId,
        subtopicName: input.subtopicName,
      },
    };

    const validation = CandidateValidator.validate(candidate);
    const durationMs = Date.now() - startTime;

    return {
      candidate,
      metadata: {
        providerId: this.providerId,
        modelId: modelUsed,
        modelUsed,
        generationDurationMs: durationMs,
        latencyMs: durationMs,
        retryCount: Math.max(0, attempts - 1),
        isMockFallback: false,
        generatorType: 'GROQ_AI',
        requestId: options?.requestId,
      },
      validation,
    };
  }

  /**
   * Refines an existing question candidate using Groq.
   */
  public async refineCandidate(
    input: RefineCandidateInput,
    options?: AIProviderOptions
  ): Promise<GenerationResult> {
    const startTime = Date.now();
    const model = options?.modelId || this.client.getModelName(this.defaultModelId);

    if (!this.isConfigured()) {
      throw new AIProviderError(
        'Groq is not configured (missing GROQ_API_KEY)',
        this.providerId,
        model,
        'AUTH_ERROR',
        false,
        401
      );
    }

    const { systemInstruction, userPrompt } = buildRefinementPrompt(input);
    const { text, modelUsed, attempts } = await this.executeWithBoundedRetry({
      model,
      systemInstruction,
      userPrompt,
      options,
    });

    let rawCandidate: any;
    try {
      rawCandidate = JSON.parse(text);
    } catch {
      throw new AIProviderError(
        'Groq response contained invalid JSON payload during refinement',
        this.providerId,
        modelUsed,
        'INVALID_REQUEST',
        false,
        400
      );
    }

    const parsed = QuestionCandidateZodSchema.safeParse(rawCandidate);
    if (!parsed.success) {
      const parseIssues = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
      throw new AIProviderError(
        `Groq refined candidate failed schema validation: ${parseIssues}`,
        this.providerId,
        modelUsed,
        'INVALID_REQUEST',
        false,
        400
      );
    }

    const validData = parsed.data;
    const candidate: QuestionCandidate = {
      content: validData.content,
      option_a: validData.option_a,
      option_b: validData.option_b,
      option_c: validData.option_c,
      option_d: validData.option_d,
      correct_answer: validData.correct_answer,
      explanation: validData.explanation,
      difficulty: (validData.difficulty as DifficultyLevel) || input.targetDifficulty || input.currentCandidate.difficulty,
      language: (validData.language as QuestionLanguage) || input.targetLanguage || input.currentCandidate.language,
      real_world_context: validData.real_world_context || input.targetContext || input.currentCandidate.real_world_context || '',
      question_style: validData.question_style || input.currentCandidate.question_style || 'Real-World Scenario',
      taxonomy: input.currentCandidate.taxonomy,
    };

    const validation = CandidateValidator.validate(candidate);
    const durationMs = Date.now() - startTime;

    return {
      candidate,
      metadata: {
        providerId: this.providerId,
        modelId: modelUsed,
        modelUsed,
        generationDurationMs: durationMs,
        latencyMs: durationMs,
        retryCount: Math.max(0, attempts - 1),
        isMockFallback: false,
        generatorType: 'GROQ_AI',
        requestId: options?.requestId,
      },
      validation,
    };
  }
}

function GrokServiceInstanceAvailable(inst: GroqService | null): boolean {
  return inst !== null && inst !== undefined;
}

export const groqService = GroqService.getInstance();
