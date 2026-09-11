/**
 * BURRA PARIKSHA CMS - AI Question Generation Orchestrator
 * Phase 6: Multi-Provider Question Generation Orchestrator
 */

import { AIProviderRegistry, aiProviderRegistry as defaultRegistry } from './registry';
import { GenerateCandidateInput, GenerationResult, AIProviderOptions, QuestionCandidate } from './types';
import { DEFAULT_AI_CONFIG } from './config';
import { classifyAIError, AIProviderError, AIErrorClassification } from './error';
import { BlindVerifierRegistry, blindVerifierRegistry as defaultVerifierRegistry } from './verifier/blind-verifier.registry';
import { BlindVerifierInputDTO, BlindVerifierOutputDTO, BlindVerificationArbitrationResult } from './verifier/types';
import { VerifierArbitrationEngine } from './verifier/arbitration';
import { CandidateValidationReport } from './validators/candidate.validator';
import { CandidateDeterministicAdapter } from './verifier/deterministic-adapter';
import { recordLogicalRequest } from './observability';

export interface OrchestratorOptions extends AIProviderOptions {
  primaryProviderId?: string;
  fallbackProviderIds?: string[];
  enableBlindVerification?: boolean;
  verifierProviderId?: string;
  fallbackVerifierProviderIds?: string[];
}

export class AIOrchestrator {
  private registry: AIProviderRegistry;
  private verifierRegistry: BlindVerifierRegistry;

  constructor(
    registry: AIProviderRegistry = defaultRegistry,
    verifierRegistry: BlindVerifierRegistry = defaultVerifierRegistry
  ) {
    this.registry = registry;
    this.verifierRegistry = verifierRegistry;
  }

  /**
   * Generates a single question candidate through configured providers with bounded fallback.
   * Enforces strictly EXACTLY ONE candidate result.
   */
  public async generateQuestionCandidate(
    input: GenerateCandidateInput,
    options?: OrchestratorOptions
  ): Promise<GenerationResult> {
    const requestId = options?.requestId || `req_gen_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
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
      const fallbackUsed = providerId !== primaryId;

      try {
        const providerOptions: AIProviderOptions = {
          ...options,
          requestId,
          fallbackUsed,
          propagateProviderErrors: true,
        };
        const result = await provider.generateCandidate(input, providerOptions);
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
        const enrichedResult: GenerationResult = {
          ...result,
          metadata: {
            ...result.metadata,
            requestId,
            providerId: provider.providerId,
            modelId: result.metadata.modelId || result.metadata.modelUsed || provider.defaultModelId,
            latencyMs: duration,
            attemptedProviders: [...attemptedProviders],
            fallbackUsed,
          },
        };

        // Record logical request success
        try {
          recordLogicalRequest('GENERATION', true, requestId);
        } catch {
          // Telemetry failure must never disrupt business operations
        }

        // 3. Optional Blind Verification & Server-Side Arbitration
        if (options?.enableBlindVerification) {
          enrichedResult.arbitration = await this.verifyAndArbitrateCandidate(
            enrichedResult.candidate,
            enrichedResult.validation,
            {
              ...options,
              requestId,
            }
          );
        }

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
    try {
      recordLogicalRequest('GENERATION', false, requestId);
    } catch {
      // Telemetry failure must never disrupt business operations
    }

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
   * Generates a question candidate AND performs independent blind verification with server arbitration.
   */
  public async generateAndVerifyQuestionCandidate(
    input: GenerateCandidateInput,
    options?: OrchestratorOptions
  ): Promise<GenerationResult> {
    return this.generateQuestionCandidate(input, {
      ...options,
      enableBlindVerification: true,
    });
  }

  /**
   * Performs blind verification and server arbitration for an existing candidate.
   * Enforces compile-time and runtime blindness guarantees.
   *
   * Strict Execution Order:
   * 1. Structural check -> if invalid, short-circuit to INVALID (0 AI verifier calls)
   * 2. Canonical deterministic validation -> runs MathematicalLogicalEngine exactly once
   * 3. Deterministic contradiction -> if CONTRADICTORY, short-circuit to INVALID (0 AI verifier calls)
   * 4. Blind Verifier -> independently solves candidate (1 AI call)
   * 5. Server Arbitration -> synthesizes final verdict under Option B policy
   */
  public async verifyAndArbitrateCandidate(
    candidate: QuestionCandidate,
    validation?: CandidateValidationReport,
    options?: OrchestratorOptions
  ): Promise<BlindVerificationArbitrationResult> {
    // 1. Structural failure short-circuit: Do NOT call Blind Verifier
    if (validation && !validation.isValid) {
      return VerifierArbitrationEngine.arbitrate({
        candidate,
        candidateValidation: validation,
        verifierOutput: null,
      });
    }

    // 2. Canonical Deterministic Validation (executed exactly once)
    const deterministicResult = CandidateDeterministicAdapter.verifyCandidate(candidate);

    // 3. Deterministic Contradiction short-circuit: Do NOT call Blind Verifier
    if (deterministicResult.status === 'CONTRADICTORY') {
      return VerifierArbitrationEngine.arbitrate({
        candidate,
        candidateValidation: validation,
        deterministicResult,
        deterministicContradiction: true,
        verifierOutput: null,
      });
    }

    // 4. Blind Verifier Input construction (strict leak-proof)
    const verifierInput: BlindVerifierInputDTO = {
      questionText: candidate.content,
      options: {
        a: candidate.option_a,
        b: candidate.option_b,
        c: candidate.option_c,
        d: candidate.option_d,
      },
      language: candidate.language,
      categoryName: candidate.taxonomy?.categoryName,
      topicName: candidate.taxonomy?.topicName,
      subtopicName: candidate.taxonomy?.subtopicName,
    };

    let verifierOutput: BlindVerifierOutputDTO | null = null;
    let verifierError: string | null = null;

    const verifierRequestId = options?.requestId || `req_v_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const verifierOptions: OrchestratorOptions = {
      ...options,
      requestId: verifierRequestId,
    };

    const primaryVerifierId = (options?.verifierProviderId || this.verifierRegistry.getDefaultProviderId()).toLowerCase();
    const fallbackVerifierIds = options?.fallbackVerifierProviderIds || DEFAULT_AI_CONFIG.fallbackVerifierProviders || [];
    const verifierChain: string[] = [primaryVerifierId, ...fallbackVerifierIds.map((f) => f.toLowerCase())].filter(
      (id, idx, arr) => arr.indexOf(id) === idx
    );

    const attemptedVerifiers: string[] = [];
    const verifierErrorsEncountered: string[] = [];

    for (const verifierId of verifierChain) {
      const verifierProvider = this.verifierRegistry.getProvider(verifierId);

      if (!verifierProvider) {
        verifierErrorsEncountered.push(`Verifier provider '${verifierId}' is not registered`);
        continue;
      }

      if (!verifierProvider.isConfigured()) {
        verifierErrorsEncountered.push(`Verifier provider '${verifierId}' is not configured`);
        continue;
      }

      attemptedVerifiers.push(verifierId);

      try {
        const output = await verifierProvider.verifyCandidateBlind(verifierInput, verifierOptions);
        if (output && output.solvedOption) {
          verifierOutput = output;
          verifierError = null;
          try {
            recordLogicalRequest('VERIFICATION', true, verifierRequestId);
          } catch {
            // Telemetry failure must never disrupt business operations
          }
          break; // Stop immediately on first successful normalized output
        } else {
          verifierErrorsEncountered.push(`Verifier provider '${verifierId}' returned an invalid response structure`);
        }
      } catch (err: any) {
        verifierErrorsEncountered.push(`Verifier provider '${verifierId}' failed: ${err?.message || 'Unknown error'}`);
      }
    }

    if (!verifierOutput) {
      try {
        recordLogicalRequest('VERIFICATION', false, verifierRequestId);
      } catch {
        // Telemetry failure must never disrupt business operations
      }
      verifierError = verifierErrorsEncountered.length > 0
        ? `All verifier providers failed. Attempted: [${attemptedVerifiers.join(', ')}]. Errors: ${verifierErrorsEncountered.join('; ')}`
        : 'No configured verifier providers available';
    }

    // 5. Server Arbitration
    return VerifierArbitrationEngine.arbitrate({
      candidate,
      candidateValidation: validation,
      deterministicResult,
      verifierOutput,
      verifierError,
    });
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
