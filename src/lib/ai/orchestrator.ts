/**
 * BURRA PARIKSHA CMS - AI Question Generation Orchestrator
 * Phase 6: Multi-Provider Question Generation Orchestrator
 */

import { AIProviderRegistry, aiProviderRegistry as defaultRegistry } from './registry';
import { GenerateCandidateInput, GenerationResult, AIProviderOptions } from './types';
import { DEFAULT_AI_CONFIG } from './config';
import { classifyAIError, AIProviderError, AIErrorClassification } from './error';

export interface OrchestratorOptions extends AIProviderOptions {
  primaryProviderId?: string;
  fallbackProviderIds?: string[];
}

export class AIOrchestrator {
  private registry: AIProviderRegistry;

  constructor(registry: AIProviderRegistry = defaultRegistry) {
    this.registry = registry;
  }

  /**
   * Generates a single question candidate through configured providers with bounded fallback.
   * Enforces strictly EXACTLY ONE candidate result.
   */
  public async generateQuestionCandidate(
    input: GenerateCandidateInput,
    options?: OrchestratorOptions
  ): Promise<GenerationResult> {
    const primaryId = (options?.primaryProviderId || DEFAULT_AI_CONFIG.defaultProvider).toLowerCase();
    const configuredFallbacks = options?.fallbackProviderIds || DEFAULT_AI_CONFIG.fallbackProviders || [];
    
    // Build ordered list of providers to attempt [primary, ...fallbacks]
    const providerChain: string[] = [primaryId, ...configuredFallbacks.map((f) => f.toLowerCase())].filter(
      (id, idx, arr) => arr.indexOf(id) === idx
    );

    const attemptedProviders: string[] = [];
    const errorsEncountered: Array<{ providerId: string; classification: AIErrorClassification; message: string }> = [];

    for (const providerId of providerChain) {
      const provider = this.registry.getProvider(providerId);

      if (!provider) {
        errorsEncountered.push({
          providerId,
          classification: 'UNKNOWN_ERROR',
          message: `Provider '${providerId}' is not registered in AIProviderRegistry.`,
        });
        continue;
      }

      if (!provider.isConfigured()) {
        errorsEncountered.push({
          providerId,
          classification: 'AUTH_ERROR',
          message: `Provider '${providerId}' is registered but not configured (missing API key or credentials).`,
        });
        continue;
      }

      attemptedProviders.push(providerId);
      const startTime = Date.now();

      try {
        const result = await provider.generateCandidate(input, options);
        const duration = Date.now() - startTime;

        // 1. Enforce EXACTLY ONE question candidate rule
        if (!result || !result.candidate || typeof result.candidate !== 'object') {
          throw new Error(`Provider '${providerId}' returned an invalid candidate structure.`);
        }

        // Reject if provider returned multiple candidates (e.g., array payload)
        if (Array.isArray(result.candidate) || Array.isArray((result.candidate as any).candidates) || Array.isArray((result.candidate as any).items)) {
          throw new Error(`Provider '${providerId}' returned multiple question candidates. Exactly ONE candidate is allowed.`);
        }

        const candidateContent = result.candidate.content;
        if (!candidateContent || typeof candidateContent !== 'string' || candidateContent.trim().length === 0) {
          throw new Error(`Provider '${providerId}' returned an empty or invalid candidate question content.`);
        }

        // 2. Enrich metadata with orchestrator telemetry
        const fallbackUsed = providerId !== primaryId;
        const enrichedResult: GenerationResult = {
          ...result,
          metadata: {
            ...result.metadata,
            providerId: provider.providerId,
            modelId: result.metadata.modelId || result.metadata.modelUsed || provider.defaultModelId,
            latencyMs: duration,
            attemptedProviders: [...attemptedProviders],
            fallbackUsed,
          },
        };

        return enrichedResult;
      } catch (err: any) {
        const classified = classifyAIError(err);
        errorsEncountered.push({
          providerId,
          classification: classified.classification,
          message: classified.sanitizedMessage,
        });

        // Bounded fallback: Continue to next fallback provider in providerChain
      }
    }

    // If all providers failed or no provider was available
    const lastErr = errorsEncountered[errorsEncountered.length - 1];
    const failureMsg = `All AI question generation providers failed. Attempted: [${attemptedProviders.join(', ')}]. Last error: ${lastErr?.message || 'No providers available'}`;

    throw new AIProviderError(
      failureMsg,
      attemptedProviders[attemptedProviders.length - 1] || primaryId,
      DEFAULT_AI_CONFIG.defaultModel,
      lastErr?.classification || 'UNKNOWN_ERROR',
      false,
      lastErr?.classification === 'QUOTA_EXHAUSTED' ? 429 : 500
    );
  }

  /**
   * Refines a candidate question using the selected or default provider.
   */
  public async refineQuestionCandidate(
    input: any,
    options?: OrchestratorOptions
  ): Promise<GenerationResult> {
    const providerId = (options?.primaryProviderId || DEFAULT_AI_CONFIG.defaultProvider).toLowerCase();
    const provider = this.registry.getRequiredProvider(providerId);
    return provider.refineCandidate(input, options);
  }
}

export const aiOrchestrator = new AIOrchestrator();
