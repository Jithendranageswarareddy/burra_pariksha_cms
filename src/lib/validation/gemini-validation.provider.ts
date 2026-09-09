/**
 * BURRA PARIKSHA CMS - Gemini Question Validation Provider Adapter
 * Phase 6: Multi-Model Validation Adapters & Consensus Integration
 *
 * Implements QuestionValidatorProvider interface for Gemini models.
 * Isolates Gemini SDK details within the adapter and returns structured ValidationEvidence.
 */

import { Question, QuestionValidatorProvider, ValidationEvidence } from '../../types';
import { DEFAULT_AI_CONFIG } from '../ai/config';
import { geminiClient } from '../ai/gemini.client';
import { classifyAIError } from '../ai/error';
import {
  BURRA_PARIKSHA_VALIDATION_SYSTEM_INSTRUCTION,
  buildQuestionValidationPrompt,
} from '../ai/prompts/validation.prompt';
import { GenAiValidationResponseSchema } from '../ai/schemas/validation.schema';

export class GeminiValidationProvider implements QuestionValidatorProvider {
  public readonly providerId: string = 'gemini';
  public readonly modelId: string;

  constructor(modelId?: string) {
    this.modelId = modelId || DEFAULT_AI_CONFIG.defaultModel;
  }

  public async validate(question: Question): Promise<ValidationEvidence> {
    const timestamp = new Date().toISOString();

    if (!geminiClient.isConfigured()) {
      return {
        providerId: this.providerId,
        modelId: this.modelId,
        verdict: 'NEEDS_REVIEW',
        confidence: 0,
        reasoningSummary: 'Gemini API client is not configured (missing API key).',
        detectedIssues: ['PROVIDER_NOT_CONFIGURED'],
        timestamp,
      };
    }

    const client = geminiClient.getClient();
    if (!client) {
      return {
        providerId: this.providerId,
        modelId: this.modelId,
        verdict: 'NEEDS_REVIEW',
        confidence: 0,
        reasoningSummary: 'Failed to initialize Gemini API client instance.',
        detectedIssues: ['PROVIDER_EXCEPTION'],
        timestamp,
      };
    }

    const prompt = buildQuestionValidationPrompt(question);

    try {
      const response = await client.models.generateContent({
        model: this.modelId,
        contents: prompt,
        config: {
          systemInstruction: BURRA_PARIKSHA_VALIDATION_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: GenAiValidationResponseSchema,
          temperature: 0.1,
        },
      });

      const text = response.text || '';
      if (!text) {
        throw new Error('Empty response received from Gemini validation engine.');
      }

      const parsed = JSON.parse(text);
      const rawVerdict = (parsed.verdict || '').toUpperCase();
      const verdict: 'VALID' | 'NEEDS_REVIEW' | 'INVALID' =
        rawVerdict === 'VALID' ? 'VALID' : rawVerdict === 'INVALID' ? 'INVALID' : 'NEEDS_REVIEW';

      const confidence =
        typeof parsed.confidence === 'number'
          ? Math.max(0, Math.min(1, parsed.confidence))
          : 0.8;

      const detectedIssues = Array.isArray(parsed.detectedIssues)
        ? parsed.detectedIssues.map((i: any) => String(i))
        : [];

      return {
        providerId: this.providerId,
        modelId: this.modelId,
        verdict,
        confidence,
        reasoningSummary: parsed.reasoningSummary || 'AI validation analysis completed.',
        detectedIssues,
        answerAssessment: {
          declaredAnswerCorrect: parsed.declaredAnswerCorrect !== false,
          confidence,
          notes: parsed.reasoningSummary || '',
        },
        explanationAssessment: {
          isClearAndAccurate: parsed.explanationIsClearAndAccurate !== false,
          notes: parsed.reasoningSummary || '',
        },
        timestamp,
      };
    } catch (err: any) {
      const classified = classifyAIError(err);
      return {
        providerId: this.providerId,
        modelId: this.modelId,
        verdict: 'NEEDS_REVIEW',
        confidence: 0,
        reasoningSummary: `Gemini validation error: ${classified.sanitizedMessage}`,
        detectedIssues: ['PROVIDER_EXCEPTION'],
        timestamp,
      };
    }
  }
}

export const geminiValidationProvider = new GeminiValidationProvider();
