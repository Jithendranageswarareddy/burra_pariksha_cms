/**
 * BURRA PARIKSHA CMS - Gemini Blind Verifier Provider
 * Phase 22.3: Blind Independent Verifier Architecture (Option C)
 * 
 * Implements the BlindVerifierProvider contract using Gemini models (default: DEFAULT_AI_CONFIG.defaultModel).
 * Reuses existing client, error classification, and bounded retry infrastructure without leaks.
 */

import { geminiClient } from '../gemini.client';
import { DEFAULT_AI_CONFIG } from '../config';
import { classifyAIError, sanitizeKeyInMessage, AIProviderError } from '../error';
import { recordUsageAttempt } from '../observability';
import {
  BlindVerifierInputDTO,
  BlindVerifierOutputDTO,
  BlindVerifierProvider,
  VerifierProviderOptions,
} from './types';
import {
  BURRA_PARIKSHA_BLIND_SOLVER_SYSTEM_INSTRUCTION,
  buildBlindSolvingPrompt,
} from '../prompts/blind-verifier.prompt';
import {
  GenAiBlindVerifierResponseSchema,
  BlindVerifierOutputZodSchema,
} from '../schemas/blind-verifier.schema';

async function withTimeout<T>(promise: Promise<T>, ms: number = 30000, errorMsg: string = 'Verifier API call timed out'): Promise<T> {
  let timeoutId: any;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(errorMsg)), ms);
  });

  return Promise.race([
    promise.then((res) => {
      clearTimeout(timeoutId);
      return res;
    }),
    timeoutPromise,
  ]);
}

export class GeminiBlindVerifierProvider implements BlindVerifierProvider {
  public readonly providerId: string = 'gemini-blind-verifier';
  public readonly modelId: string;

  constructor(modelId: string = DEFAULT_AI_CONFIG.defaultModel) {
    this.modelId = modelId;
  }

  public isConfigured(): boolean {
    return geminiClient.isConfigured();
  }

  /**
   * Performs an independent, blind solve of a question candidate.
   * Enforces strict timeout, bounded transient retries, zero quota retries,
   * and runtime Zod validation.
   */
  public async verifyCandidateBlind(
    input: BlindVerifierInputDTO,
    options?: VerifierProviderOptions
  ): Promise<BlindVerifierOutputDTO> {
    const client = geminiClient.getClient();
    const targetModel = options?.modelId || this.modelId;

    if (!client || !geminiClient.isConfigured()) {
      throw new AIProviderError(
        'Gemini API client is not configured (missing GEMINI_API_KEY)',
        this.providerId,
        targetModel,
        'AUTH_ERROR',
        false,
        401
      );
    }

    const promptText = buildBlindSolvingPrompt(input);
    const timeoutMs = options?.timeoutMs || DEFAULT_AI_CONFIG.timeoutMs || 30000;
    const maxRetries = options?.maxRetries !== undefined ? options.maxRetries : 1; // at most 1 retry for transient

    let lastError: any = null;
    let attempts = 0;

    while (attempts <= maxRetries) {
      attempts++;
      const attemptStartTime = Date.now();
      try {
        if (attempts > 1) {
          await new Promise((res) => setTimeout(res, DEFAULT_AI_CONFIG.backoffMs * (attempts - 1)));
        }

        const response = await withTimeout(
          client.models.generateContent({
            model: targetModel,
            contents: promptText,
            config: {
              systemInstruction: BURRA_PARIKSHA_BLIND_SOLVER_SYSTEM_INSTRUCTION,
              responseMimeType: 'application/json',
              responseSchema: GenAiBlindVerifierResponseSchema as any,
              temperature: options?.temperature ?? 0.1, // Low temperature for deterministic derivation
            },
          }),
          timeoutMs,
          `Gemini blind verification timed out on model ${targetModel}`
        );
        const latencyMs = Date.now() - attemptStartTime;

        const text = response.text || '';
        if (!text || text.trim().length === 0) {
          try {
            const usage = response.usageMetadata;
            recordUsageAttempt({
              operation: 'VERIFICATION',
              providerId: this.providerId,
              modelId: targetModel,
              attemptNumber: attempts,
              fallbackUsed: false,
              success: false,
              httpStatus: 500,
              errorCategory: 'INVALID_REQUEST',
              latencyMs,
              inputTokens: typeof usage?.promptTokenCount === 'number' ? usage.promptTokenCount : null,
              outputTokens: typeof usage?.candidatesTokenCount === 'number' ? usage.candidatesTokenCount : null,
              totalTokens: typeof usage?.totalTokenCount === 'number' ? usage.totalTokenCount : null,
              requestId: options?.requestId ?? null,
            });
          } catch {}

          throw new Error('Empty response received from Gemini blind verifier');
        }

        const parsedJson = JSON.parse(text);
        const validatedOutput = BlindVerifierOutputZodSchema.parse(parsedJson);

        try {
          const usage = response.usageMetadata;
          recordUsageAttempt({
            operation: 'VERIFICATION',
            providerId: this.providerId,
            modelId: targetModel,
            attemptNumber: attempts,
            fallbackUsed: false,
            success: true,
            httpStatus: 200,
            latencyMs,
            inputTokens: typeof usage?.promptTokenCount === 'number' ? usage.promptTokenCount : null,
            outputTokens: typeof usage?.candidatesTokenCount === 'number' ? usage.candidatesTokenCount : null,
            totalTokens: typeof usage?.totalTokenCount === 'number' ? usage.totalTokenCount : null,
            requestId: options?.requestId ?? null,
          });
        } catch {
          // Telemetry failure must never disrupt business operations
        }

        return {
          solvedOption: validatedOutput.solvedOption,
          derivedValue: validatedOutput.derivedValue,
          independentProof: validatedOutput.independentProof,
          confidence: validatedOutput.confidence,
          isSolvable: validatedOutput.isSolvable,
          hasMultipleValidOptions: validatedOutput.hasMultipleValidOptions,
          validOptions: validatedOutput.validOptions,
          notes: validatedOutput.notes,
        };
      } catch (err: any) {
        const latencyMs = Date.now() - attemptStartTime;
        lastError = err;
        const classified = classifyAIError(err);

        // Record failed attempt (only if not already recorded above for empty text)
        if (!err?.message?.includes('Empty response received')) {
          try {
            recordUsageAttempt({
              operation: 'VERIFICATION',
              providerId: this.providerId,
              modelId: targetModel,
              attemptNumber: attempts,
              fallbackUsed: false,
              success: false,
              httpStatus: classified.statusCode ?? (classified.classification === 'QUOTA_EXHAUSTED' ? 429 : (classified.classification === 'AUTH_ERROR' ? 401 : 500)),
              errorCategory: classified.classification,
              latencyMs,
              inputTokens: null,
              outputTokens: null,
              totalTokens: null,
              requestId: options?.requestId ?? null,
            });
          } catch {
            // Telemetry failure must never disrupt business operations
          }
        }

        // CRITICAL QUOTA MANDATE: Quota exhaustion or auth error MUST NOT retry!
        if (!classified.isRetryable || classified.classification === 'QUOTA_EXHAUSTED' || classified.classification === 'AUTH_ERROR') {
          throw new AIProviderError(
            classified.sanitizedMessage,
            this.providerId,
            targetModel,
            classified.classification,
            false,
            classified.statusCode || 500
          );
        }
      }
    }

    const classified = classifyAIError(lastError);
    throw new AIProviderError(
      classified.sanitizedMessage,
      this.providerId,
      targetModel,
      classified.classification,
      false,
      classified.statusCode || 500
    );
  }
}

export const geminiBlindVerifier = new GeminiBlindVerifierProvider();
