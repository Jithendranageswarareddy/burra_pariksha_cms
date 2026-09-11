/**
 * BURRA PARIKSHA CMS - Grok / xAI Service Provider
 * Phase 22.6B: Real Secondary Generator Provider Integration
 * 
 * Implements AIProvider contract for xAI/Grok using POST /v1/responses.
 * Enforces structured JSON schema, server-side validation, and telemetry.
 */

import { xaiClient, XaiClient } from './xai.client';
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
import { classifyAIError, AIProviderError, AIErrorClassification } from '../error';
import { aiProviderRegistry } from '../registry';
import { DifficultyLevel, QuestionLanguage } from '../../../types';

/**
 * Strict JSON Schema representation for QuestionCandidate output.
 */
export const GROK_QUESTION_CANDIDATE_SCHEMA = {
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
      description: 'Step-by-step mathematical reasoning, verification of the calculation, and speed trick or shortcut formula.',
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
  ],
  additionalProperties: false,
};

/**
 * Robust extractor for xAI Responses API (POST /v1/responses).
 * Inspects body.output array looking for message type and text blocks.
 */
export function extractResponsesText(body: any): string | null {
  if (!body) return null;

  // 1. Responses API primary format: body.output array of typed items
  if (Array.isArray(body.output)) {
    for (const item of body.output) {
      if (item.type === 'message' && item.content) {
        if (Array.isArray(item.content)) {
          for (const c of item.content) {
            if (typeof c === 'string') return c;
            if (c && typeof c.text === 'string') return c.text;
          }
        } else if (typeof item.content === 'string') {
          return item.content;
        }
      }
    }

    // Fallback within output array if item.type is not explicitly 'message'
    for (const item of body.output) {
      if (typeof item.text === 'string') return item.text;
      if (item.content) {
        if (typeof item.content === 'string') return item.content;
        if (Array.isArray(item.content) && item.content[0]?.text) {
          return item.content[0].text;
        }
      }
    }
  }

  // 2. Direct output fields
  if (typeof body.output_text === 'string') return body.output_text;
  if (typeof body.text === 'string') return body.text;

  return null;
}

export class GrokService implements AIProvider {
  public readonly providerId: string = 'grok';
  public readonly defaultModelId: string = process.env.XAI_MODEL || 'grok-4.6';

  private client: XaiClient;
  private static instance: GrokService | null = null;

  constructor(client: XaiClient = xaiClient) {
    this.client = client;
    aiProviderRegistry.registerProvider(this);
  }

  public static getInstance(): GrokService {
    if (!GrokService.instance) {
      GrokService.instance = new GrokService();
    }
    return GrokService.instance;
  }

  public isConfigured(): boolean {
    return this.client.isConfigured();
  }

  /**
   * Helper to execute xAI call with bounded retry for transient failures.
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
      input: [
        {
          role: 'system' as const,
          content: params.systemInstruction,
        },
        {
          role: 'user' as const,
          content: params.userPrompt,
        },
      ],
      text: {
        format: {
          type: 'json_schema' as const,
          name: 'question_candidate',
          strict: true,
          schema: GROK_QUESTION_CANDIDATE_SCHEMA,
        },
      },
      temperature: params.options?.temperature ?? 0.7,
    };

    while (attempts <= maxRetries) {
      attempts++;
      try {
        const responseBody = await this.client.generateResponse(payload, {
          timeoutMs: params.options?.timeoutMs || 30000,
        });

        const extracted = extractResponsesText(responseBody);
        if (!extracted || extracted.trim().length === 0) {
          throw new AIProviderError(
            'xAI Responses API returned an empty or unparseable output structure',
            this.providerId,
            model,
            'INVALID_REQUEST',
            false,
            400
          );
        }

        return {
          text: extracted,
          modelUsed: model,
          attempts,
        };
      } catch (err: any) {
        lastError = err;
        const classified = err instanceof AIProviderError
          ? { classification: err.classification, isRetryable: err.isRetryable }
          : classifyAIError(err);

        // Quota and auth errors are strictly non-retryable
        if (!classified.isRetryable || classified.classification === 'QUOTA_EXHAUSTED' || classified.classification === 'RATE_LIMIT' || classified.classification === 'AUTH_ERROR') {
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
   * Generates a single aptitude question candidate using xAI Grok.
   */
  public async generateCandidate(
    input: GenerateCandidateInput,
    options?: AIProviderOptions
  ): Promise<GenerationResult> {
    const startTime = Date.now();
    const model = options?.modelId || this.client.getModelName(this.defaultModelId);

    if (!this.isConfigured()) {
      throw new AIProviderError(
        'xAI Grok is not configured (missing XAI_API_KEY)',
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
        'xAI Grok response contained invalid JSON payload',
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
        `xAI Grok candidate failed schema validation: ${parseIssues}`,
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
        generatorType: 'GROK_AI',
        requestId: options?.requestId,
      },
      validation,
    };
  }

  /**
   * Refines an existing question candidate using xAI Grok.
   */
  public async refineCandidate(
    input: RefineCandidateInput,
    options?: AIProviderOptions
  ): Promise<GenerationResult> {
    const startTime = Date.now();
    const model = options?.modelId || this.client.getModelName(this.defaultModelId);

    if (!this.isConfigured()) {
      throw new AIProviderError(
        'xAI Grok is not configured (missing XAI_API_KEY)',
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
        'xAI Grok response contained invalid JSON payload during refinement',
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
        `xAI Grok refined candidate failed schema validation: ${parseIssues}`,
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
        generatorType: 'GROK_AI',
        requestId: options?.requestId,
      },
      validation,
    };
  }
}

export const grokService = GrokService.getInstance();
