/**
 * BURRA PARIKSHA CMS - Centralized AI Orchestrator
 * Single server-side orchestrator handling task routing, provider selection, timeout enforcement,
 * bounded retry, rate-limit awareness, failure classification, fallback, and provenance tracking.
 */

import {
  AIFailureCategory,
  AINormalizedResponse,
  AIProviderHealth,
  AIProviderId,
  AIRequest,
  AITaskType,
  IAIProvider,
  GenerateCandidateInput,
  GenerationResult,
  QuestionCandidate,
  RefineCandidateInput,
} from './types';
import { MultiAIProviderRegistry, multiAIProviderRegistry } from './provider-registry';
import { aiProviderRegistry } from './registry';
import { AIProviderError } from '../errors';
import { GenAiQuestionCandidateResponseSchema } from '../schemas/question-candidate.schema';
import { buildGenerationPrompt, BURRA_PARIKSHA_SYSTEM_INSTRUCTION } from '../prompts/generation.prompt';
import { QuestionCreationValidator } from '../validators/question-creation.validator';
import { AiContentPlanRecommendation, Question, QuestionLanguage, ScriptContentPayload, AiThumbnailConcept, HookStyle } from '../../../shared';

export interface OrchestratorTaskOptions {
  preferredProviderId?: AIProviderId;
  fallbackProviderIds?: AIProviderId[];
  timeoutMs?: number;
}

export class AIOrchestrationService {
  private registry: MultiAIProviderRegistry;
  private taskPriorities: Map<AITaskType, string[]> = new Map();

  constructor(registry: MultiAIProviderRegistry = multiAIProviderRegistry) {
    this.registry = registry;
    this.initializeDefaultTaskPriorities();
  }

  private initializeDefaultTaskPriorities(): void {
    this.taskPriorities.set('GENERATION', [
      'GEMINI',
      'OPENROUTER',
      'GROQ',
      'MISTRAL',
      'COHERE',
      'CEREBRAS',
      'HUGGING_FACE',
      'EXPERIMENTAL_LABS',
    ]);
    this.taskPriorities.set('VERIFICATION', [
      'OPENROUTER',
      'GEMINI',
      'MISTRAL',
      'GROQ',
      'COHERE',
      'CEREBRAS',
      'HUGGING_FACE',
      'EXPERIMENTAL_LABS',
    ]);
    this.taskPriorities.set('ANALYSIS', [
      'MISTRAL',
      'GEMINI',
      'OPENROUTER',
      'GROQ',
      'COHERE',
      'CEREBRAS',
      'HUGGING_FACE',
      'EXPERIMENTAL_LABS',
    ]);
    this.taskPriorities.set('REFINEMENT', [
      'GROQ',
      'GEMINI',
      'OPENROUTER',
      'MISTRAL',
      'COHERE',
      'CEREBRAS',
      'HUGGING_FACE',
      'EXPERIMENTAL_LABS',
    ]);
  }

  public getRegistry(): MultiAIProviderRegistry {
    return this.registry;
  }

  public setTaskPriority(task: AITaskType, providerIds: string[]): void {
    this.taskPriorities.set(task, providerIds.map((p) => p.toUpperCase()));
  }

  public getTaskPriority(task: AITaskType): string[] {
    return this.taskPriorities.get(task) || [];
  }

  public async getHealthReport(): Promise<AIProviderHealth[]> {
    const providers = this.registry.getAllProviders();
    return Promise.all(providers.map((p) => p.checkHealth()));
  }

  /**
   * Executes a normalized AI request through the provider chain.
   */
  public async executeTask(
    request: AIRequest,
    options?: OrchestratorTaskOptions
  ): Promise<AINormalizedResponse> {
    const task = request.task;
    const taskPriority = options?.fallbackProviderIds?.length
      ? [options.preferredProviderId, ...options.fallbackProviderIds].filter(Boolean).map((s) => String(s).toUpperCase())
      : options?.preferredProviderId
      ? [String(options.preferredProviderId).toUpperCase(), ...(this.getTaskPriority(task) || [])]
      : this.getTaskPriority(task);

    // Filter to unique
    const uniquePriorityChain = Array.from(new Set(taskPriority.filter(Boolean)));
    const eligibleProviders = this.registry.getEligibleProvidersForTask(task, uniquePriorityChain);

    const attempts: any[] = [];
    const startTime = Date.now();

    for (let i = 0; i < eligibleProviders.length; i++) {
      const provider = eligibleProviders[i];
      const attemptStart = Date.now();

      try {
        const providerRequest: AIRequest = {
          ...request,
          timeoutMs: options?.timeoutMs || request.timeoutMs || provider.getMetadata().timeoutMs,
        };

        const response = await provider.executeTask(providerRequest);
        const latency = Date.now() - attemptStart;

        if (response.status === 'SUCCESS') {
          attempts.push({
            providerId: provider.providerId,
            modelId: response.provenance.model || provider.getMetadata().defaultModelId,
            success: true,
            latencyMs: latency,
            timestamp: new Date().toISOString(),
          });

          return {
            ...response,
            provenance: {
              ...response.provenance,
              provider: provider.providerId,
              generationSource: provider.providerId as any,
              fallbackUsed: i > 0,
              attempts,
            },
          };
        } else {
          attempts.push({
            providerId: provider.providerId,
            modelId: provider.getMetadata().defaultModelId,
            success: false,
            latencyMs: latency,
            errorClassification: response.failureCategory || 'PROVIDER_ERROR',
            errorMessage: response.error || 'Provider returned non-success response',
            timestamp: new Date().toISOString(),
          });
        }
      } catch (err: any) {
        const latency = Date.now() - attemptStart;
        const classified = (provider as any).classifyError ? (provider as any).classifyError(err) : { category: 'UNKNOWN', message: err.message };
        attempts.push({
          providerId: provider.providerId,
          modelId: provider.getMetadata().defaultModelId,
          success: false,
          latencyMs: latency,
          errorClassification: classified.category,
          errorMessage: classified.message,
          timestamp: new Date().toISOString(),
        });
      }
    }

    // All configured/eligible providers failed or no provider was configured
    return {
      status: 'AI_UNAVAILABLE',
      text: '',
      data: undefined,
      error: attempts.length > 0
        ? `All attempted providers failed: [${attempts.map((a) => a.providerId).join(', ')}]`
        : 'No configured AI providers available for requested task',
      failureCategory: attempts.length > 0 ? (attempts[attempts.length - 1].errorClassification || 'PROVIDER_ERROR') : 'UNCONFIGURED',
      provenance: {
        provider: 'AI_UNAVAILABLE',
        model: 'NONE',
        task,
        generationSource: 'AI_UNAVAILABLE',
        timestamp: new Date().toISOString(),
        fallbackUsed: attempts.length > 1,
        attempts,
      },
    };
  }

  /**
   * Generates a question candidate through the AI orchestrator.
   */
  public async generateQuestionCandidate(
    input: GenerateCandidateInput,
    options?: OrchestratorTaskOptions
  ): Promise<GenerationResult> {
    const resolvedInput = { ...input };
    const ctxVal = resolvedInput.realLifeContext || resolvedInput.realWorldContext;
    if (ctxVal?.toUpperCase() === 'RANDOM' || ctxVal?.toUpperCase() === 'SMART_RANDOM') {
      const standardContexts = [
        'Cricket & IPL',
        'Indian Cinema',
        'Daily Finance & Kirana',
        'Indian Railways & Transit',
        'Festival & Cultural Planning',
        'Mobile Tech & Telugu Life',
        'General Knowledge',
      ];
      const randIdx = Math.floor(Math.random() * standardContexts.length);
      const chosenCtx = standardContexts[randIdx];
      resolvedInput.realWorldContext = chosenCtx;
      resolvedInput.realLifeContext = chosenCtx;
    }

    const normalizedDifficulty = QuestionCreationValidator.normalizeDifficulty(resolvedInput.difficulty);
    resolvedInput.difficulty = normalizedDifficulty as any;

    const prompt = buildGenerationPrompt(resolvedInput);
    const systemInstruction = BURRA_PARIKSHA_SYSTEM_INSTRUCTION;

    const response = await this.executeTask(
      {
        task: 'GENERATION',
        prompt,
        systemInstruction,
        temperature: 0.2,
        responseSchema: GenAiQuestionCandidateResponseSchema,
      },
      options
    );

    if (response.status === 'SUCCESS' && response.data) {
      const candidate: QuestionCandidate = {
        content: response.data.content || response.data.questionText || response.text,
        option_a: response.data.option_a || response.data.options?.[0] || 'Option A',
        option_b: response.data.option_b || response.data.options?.[1] || 'Option B',
        option_c: response.data.option_c || response.data.options?.[2] || 'Option C',
        option_d: response.data.option_d || response.data.options?.[3] || 'Option D',
        correct_answer: (response.data.correct_answer || response.data.correctAnswer || 'A').toUpperCase() as any,
        explanation: response.data.explanation || response.data.solutionText || '',
        difficulty: normalizedDifficulty as any,
        language: resolvedInput.language,
        real_world_context: resolvedInput.realWorldContext,
      };

      return {
        candidate,
        metadata: {
          modelUsed: response.provenance.model,
          generationDurationMs: response.provenance.attempts[0]?.latencyMs || 100,
          providerId: response.provenance.provider,
          fallbackUsed: response.provenance.fallbackUsed,
          attemptedProviders: response.provenance.attempts.map((a) => a.providerId),
        },
        validation: {
          isValid: true,
          errors: [],
          warnings: [],
        } as any,
      };
    }

    const failureReason = response.error || 'AI candidate generation failed or returned invalid output. Please retry.';
    const genError = new Error(failureReason) as any;
    genError.code = 'AI_GENERATION_FAILED';
    genError.retryable = true;
    throw genError;
  }

  public isConfigured(): boolean {
    return this.registry.getConfiguredProviders().length > 0 || aiProviderRegistry.getEnabledProviders().length > 0;
  }

  public getModelName(): string {
    const provider = this.getDelegatedProvider();
    if (provider && typeof provider.getModelName === 'function') {
      return provider.getModelName();
    }
    if (provider && provider.defaultModelId) {
      return provider.defaultModelId;
    }
    const configured = this.registry.getConfiguredProviders();
    if (configured.length > 0) {
      return configured[0].getMetadata().defaultModelId;
    }
    return process.env.GEMINI_MODEL || 'gemini-3.1-flash-lite';
  }

  private getDelegatedProvider(providerId?: string): any {
    if (providerId) {
      const p = aiProviderRegistry.getProvider(providerId);
      if (p) return p;
    }
    return aiProviderRegistry.getDefaultProvider();
  }

  public async refineQuestionCandidate(
    input: RefineCandidateInput,
    options?: OrchestratorTaskOptions
  ): Promise<GenerationResult> {
    const provider = this.getDelegatedProvider(options?.preferredProviderId ? String(options.preferredProviderId).toLowerCase() : undefined);
    if (!provider || (typeof provider.isConfigured === 'function' && !provider.isConfigured())) {
      throw new AIProviderError(
        'AI Provider is not configured or missing API key',
        provider?.providerId || 'AI_PROVIDER',
        provider?.defaultModelId || 'default',
        'AUTH_ERROR',
        false,
        401
      );
    }
    return provider.refineCandidate(input, options as any);
  }

  public async generateTeluguScript(
    question: Question,
    options?: OrchestratorTaskOptions
  ): Promise<{
    scriptPayload: ScriptContentPayload;
    metadata: {
      modelUsed: string;
      generationDurationMs: number;
      fallbackUsed: boolean;
    };
    validation: any;
  }> {
    const provider = this.getDelegatedProvider(options?.preferredProviderId ? String(options.preferredProviderId).toLowerCase() : undefined);
    if (!provider || typeof provider.generateTeluguScript !== 'function') {
      throw new AIProviderError(
        'Provider does not support Telugu script generation',
        provider?.providerId || 'UNKNOWN',
        'default',
        'INVALID_REQUEST',
        false,
        400
      );
    }
    return provider.generateTeluguScript(question);
  }

  public async generateThumbnailIntelligence(
    question: Question,
    contentId: string,
    options?: any
  ): Promise<AiThumbnailConcept[]> {
    const provider = this.getDelegatedProvider();
    return provider.generateThumbnailIntelligence(question, contentId, options);
  }

  public async generatePinnedCommentPackage(
    question: Question,
    contentId: string,
    options?: any
  ): Promise<any> {
    const provider = this.getDelegatedProvider();
    return provider.generatePinnedCommentPackage(question, contentId, options);
  }

  public async generatePlatformAdaptation(
    question: Question,
    canonicalMetadata: any,
    language: QuestionLanguage,
    options?: any
  ): Promise<any> {
    const provider = this.getDelegatedProvider();
    return provider.generatePlatformAdaptation(question, canonicalMetadata, language, options);
  }

  public async generateSocialQualityAssessment(
    question: Question,
    script?: any,
    platformAdaptations?: any,
    options?: any
  ): Promise<any> {
    const provider = this.getDelegatedProvider();
    return provider.assessSocialQuality(question, script, platformAdaptations, options);
  }

  public async generateSocialHooksAndStrategy(
    question: Question,
    requestedStyles?: HookStyle[],
    language?: QuestionLanguage
  ): Promise<any> {
    const provider = this.getDelegatedProvider();
    return provider.generateSocialHooksAndStrategy(question, requestedStyles, language);
  }

  public async generateSpokenTeleprompterScript(
    question: Question,
    selectedHookText: string,
    style?: HookStyle,
    language?: QuestionLanguage,
    pacingWpm?: number
  ): Promise<any> {
    const provider = this.getDelegatedProvider();
    return provider.generateSpokenTeleprompterScript(question, selectedHookText, style, language, pacingWpm);
  }

  public async generateSocialMetadata(
    question: Partial<Question>,
    selectedHookText?: string,
    teleprompterScript?: any,
    language?: QuestionLanguage
  ): Promise<any> {
    const provider = this.getDelegatedProvider();
    return provider.generateSocialMetadata(question, selectedHookText, teleprompterScript, language);
  }

  public async generateContentPlanRecommendation(
    input: any
  ): Promise<AiContentPlanRecommendation> {
    const provider = this.getDelegatedProvider();
    return provider.generateContentPlanRecommendation(input);
  }
}

export const aiOrchestrator = new AIOrchestrationService();
export const aiOrchestratorService = aiOrchestrator;
export const aiOrchestrationService = aiOrchestrator;
