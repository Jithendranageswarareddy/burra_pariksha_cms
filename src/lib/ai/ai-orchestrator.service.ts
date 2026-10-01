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
} from '../../types/ai';
import { GenerateCandidateInput, GenerationResult, QuestionCandidate, RefineCandidateInput } from './types';
import { MultiAIProviderRegistry, multiAIProviderRegistry } from './provider-registry';
import { questionConfigService } from '../services/question-config.service';
import { geminiService } from './gemini.service';
import { GenAiQuestionCandidateResponseSchema } from './schemas/question-candidate.schema';
import { buildGenerationPrompt, BURRA_PARIKSHA_SYSTEM_INSTRUCTION } from './prompts/generation.prompt';
import { QuestionCreationValidator } from '../validators/question-creation.validator';
import {
  AiContentPlanRecommendation,
  AiThumbnailConcept,
  HookStyle,
  Question,
  QuestionLanguage,
} from '../../types';
import { ScriptContentPayload } from '../services/script.service';

export interface OrchestratorTaskOptions {
  preferredProviderId?: AIProviderId;
  fallbackProviderIds?: AIProviderId[];
  timeoutMs?: number;
  allowDeterministicFallback?: boolean;
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
   * Helper to produce a deterministic fallback response clearly identified with DETERMINISTIC_FALLBACK provenance.
   */
  public createDeterministicFallbackResponse(
    task: AITaskType,
    text: string,
    data?: any,
    reason: string = 'Deterministic rule fallback executed'
  ): AINormalizedResponse {
    return {
      status: 'DETERMINISTIC_FALLBACK',
      text,
      data,
      provenance: {
        provider: 'DETERMINISTIC_FALLBACK',
        model: 'DETERMINISTIC_RULE_ENGINE',
        task,
        generationSource: 'DETERMINISTIC_FALLBACK',
        timestamp: new Date().toISOString(),
        fallbackUsed: true,
        attempts: [
          {
            providerId: 'DETERMINISTIC_FALLBACK',
            modelId: 'DETERMINISTIC_RULE_ENGINE',
            success: true,
            latencyMs: 0,
            errorMessage: reason,
            timestamp: new Date().toISOString(),
          },
        ],
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
      try {
        const activeContexts = await questionConfigService.getRealLifeContexts(true);
        if (activeContexts && activeContexts.length > 0) {
          const randIdx = Math.floor(Math.random() * activeContexts.length);
          const chosenCtx = activeContexts[randIdx].displayLabel || activeContexts[randIdx].code;
          resolvedInput.realWorldContext = chosenCtx;
          resolvedInput.realLifeContext = chosenCtx;
        }
      } catch {
        resolvedInput.realWorldContext = 'General Knowledge';
      }
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
    return this.registry.getConfiguredProviders().length > 0;
  }

  public async refineQuestionCandidate(
    input: RefineCandidateInput,
    options?: OrchestratorTaskOptions
  ): Promise<GenerationResult> {
    if (this.registry.getConfiguredProviders().length === 0) {
      const fallbackData = (geminiService as any).applyFallbackRefinement
        ? (geminiService as any).applyFallbackRefinement(input)
        : input.currentCandidate;
      return {
        candidate: {
          content: fallbackData.content || input.currentCandidate.content,
          option_a: fallbackData.option_a || input.currentCandidate.option_a,
          option_b: fallbackData.option_b || input.currentCandidate.option_b,
          option_c: fallbackData.option_c || input.currentCandidate.option_c,
          option_d: fallbackData.option_d || input.currentCandidate.option_d,
          correct_answer: fallbackData.correct_answer || input.currentCandidate.correct_answer,
          explanation: fallbackData.explanation || input.currentCandidate.explanation,
          difficulty: input.targetDifficulty || input.currentCandidate.difficulty,
          language: input.targetLanguage || input.currentCandidate.language,
          real_world_context: input.currentCandidate.real_world_context || '',
        },
        metadata: {
          modelUsed: 'DETERMINISTIC_FALLBACK',
          generationDurationMs: 0,
          providerId: 'DETERMINISTIC_FALLBACK',
          fallbackUsed: true,
          fallbackReason: 'No configured AI providers available',
          attemptedProviders: [],
        },
        validation: { isValid: true, errors: [], warnings: [] } as any,
      };
    }
    return geminiService.refineCandidate(input, options as any);
  }

  public async generateTeluguScript(
    question: Question,
    _options?: OrchestratorTaskOptions
  ): Promise<{
    scriptPayload: ScriptContentPayload;
    metadata: {
      modelUsed: string;
      generationDurationMs: number;
      isMockFallback: boolean;
    };
    validation: any;
  }> {
    return geminiService.generateTeluguScript(question);
  }

  public async generateThumbnailIntelligence(
    question: Question,
    contentId: string,
    options?: any
  ): Promise<AiThumbnailConcept[]> {
    return geminiService.generateThumbnailIntelligence(question, contentId, options);
  }

  public createFallbackThumbnailIntelligence(
    question: Question,
    contentId: string,
    options?: any
  ): AiThumbnailConcept[] {
    return geminiService.createFallbackThumbnailIntelligence(question, contentId, options);
  }

  public async generatePinnedCommentPackage(
    question: Question,
    contentId: string,
    options?: any
  ): Promise<any> {
    return geminiService.generatePinnedCommentPackage(question, contentId, options);
  }

  public createFallbackPinnedCommentPackage(
    question: Question,
    contentId: string,
    options?: any
  ): any {
    return geminiService.createFallbackPinnedCommentPackage(question, contentId, options);
  }

  public async generatePlatformAdaptation(
    question: Question,
    canonicalMetadata: any,
    language: QuestionLanguage,
    options?: any
  ): Promise<any> {
    return geminiService.generatePlatformAdaptation(question, canonicalMetadata, language, options);
  }

  public createFallbackPlatformAdaptation(
    question: Question,
    canonicalMetadata: any,
    language: QuestionLanguage
  ): any {
    return geminiService.createFallbackPlatformAdaptation(question, canonicalMetadata, language);
  }

  public async generateSocialQualityAssessment(
    question: Question,
    script?: any,
    platformAdaptations?: any,
    options?: any
  ): Promise<any> {
    return geminiService.assessSocialQuality(question, script, platformAdaptations, options);
  }

  public createFallbackSocialQualityAssessment(
    question: Question,
    enhancementPackage?: any
  ): any {
    return geminiService.createFallbackSocialQualityAssessment(question, enhancementPackage);
  }

  public async generateSocialHooksAndStrategy(
    question: Question,
    requestedStyles?: HookStyle[],
    language?: QuestionLanguage
  ): Promise<any> {
    return geminiService.generateSocialHooksAndStrategy(question, requestedStyles, language);
  }

  public async generateSpokenTeleprompterScript(
    question: Question,
    selectedHookText: string,
    style?: HookStyle,
    language?: QuestionLanguage,
    pacingWpm?: number
  ): Promise<any> {
    return geminiService.generateSpokenTeleprompterScript(question, selectedHookText, style, language, pacingWpm);
  }

  public async generateSocialMetadata(
    question: Partial<Question>,
    selectedHookText?: string,
    teleprompterScript?: any,
    language?: QuestionLanguage
  ): Promise<any> {
    return geminiService.generateSocialMetadata(question, selectedHookText, teleprompterScript, language);
  }

  public async generateContentPlanRecommendation(
    input: any
  ): Promise<AiContentPlanRecommendation> {
    return geminiService.generateContentPlanRecommendation(input);
  }
}

export const aiOrchestrator = new AIOrchestrationService();
export const aiOrchestratorService = aiOrchestrator;
export const aiOrchestrationService = aiOrchestrator;
