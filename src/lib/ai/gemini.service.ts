/**
 * BURRA PARIKSHA CMS - Gemini AI Service
 * Phase 4: Gemini AI Question Studio
 * 
 * Orchestrates AI question generation and refinement using @google/genai.
 * Enforces structured output schemas, mathematical validation, and fallback handling.
 */

import { geminiClient } from './gemini.client';
import { DEFAULT_AI_CONFIG } from './config';
import { classifyAIError, sanitizeKeyInMessage, AIProviderError, AIErrorClassification } from './error';
import { aiProviderRegistry } from './registry';
import { GenAiQuestionCandidateResponseSchema, QuestionCandidateZodSchema } from './schemas/question-candidate.schema';
import { GenAiTeluguScriptResponseSchema, TeluguScriptZodSchema } from './schemas/script-generation.schema';
import { GenAiSocialHookResponseSchema, SocialHookAndStrategyZodSchema } from './schemas/social-hook.schema';
import { GenAiTeleprompterScriptResponseSchema, TeleprompterScriptZodSchema } from './schemas/teleprompter-script.schema';
import { SocialMetadataGenAISchema, SocialMetadataZodSchema, SocialMetadataAIResult } from './schemas/social-metadata.schema';
import { PlatformAdaptedVariantGenAISchema, PlatformAdaptedVariantZodSchema } from './schemas/platform-adaptation.schema';
import { SocialQualityAssessmentGenAISchema, SocialQualityAssessmentZodSchema, SocialQualityAssessmentAIOutput } from './schemas/social-quality.schema';
import { GenAiThumbnailIntelligenceResponseSchema, AiThumbnailIntelligenceResponseZodSchema } from './schemas/thumbnail-intelligence.schema';
import { BURRA_PARIKSHA_THUMBNAIL_SYSTEM_INSTRUCTION, buildThumbnailIntelligenceUserPrompt } from './prompts/thumbnail-intelligence.prompt';
import { GenAiPinnedCommentPackageResponseSchema, AiPinnedCommentPackageZodSchema } from './schemas/pinned-comment.schema';
import { BURRA_PARIKSHA_PINNED_COMMENT_SYSTEM_INSTRUCTION, buildPinnedCommentUserPrompt } from './prompts/pinned-comment.prompt';
import { ThumbnailSafetyValidator } from '../validators/thumbnail-safety.validator';
import { PinnedCommentSafetyValidator } from '../validators/pinned-comment-safety.validator';
import { CandidateValidator } from './validators/candidate.validator';
import { GeminiBlindVerifierProvider } from './validators/blind-verifier';
import { ScriptValidator, ScriptValidationReport } from './validators/script.validator';
import {
  BURRA_PARIKSHA_SYSTEM_INSTRUCTION,
  buildGenerationPrompt,
} from './prompts/generation.prompt';
import { buildRefinementPrompt } from './prompts/refinement.prompt';
import {
  BURRA_PARIKSHA_SCRIPT_SYSTEM_INSTRUCTION,
  buildTeluguScriptPrompt,
} from './prompts/script-generation.prompt';
import {
  BURRA_PARIKSHA_SOCIAL_HOOK_SYSTEM_INSTRUCTION,
  buildSocialHookPrompt,
} from './prompts/social-hook.prompt';
import {
  BURRA_PARIKSHA_TELEPROMPTER_SCRIPT_SYSTEM_INSTRUCTION,
  buildTeleprompterScriptPrompt,
} from './prompts/teleprompter-script.prompt';
import {
  BURRA_PARIKSHA_SOCIAL_METADATA_SYSTEM_INSTRUCTION,
  buildSocialMetadataPrompt,
} from './prompts/social-metadata.prompt';
import {
  buildPlatformAdaptationSystemPrompt,
  buildPlatformAdaptationUserPrompt,
} from './prompts/platform-adaptation.prompt';
import {
  buildSocialQualitySystemPrompt,
  buildSocialQualityUserPrompt,
} from './prompts/social-quality.prompt';
import {
  AiContentPlanRecommendation,
  AiPlanBatchSuggestion,
  AiPlanRecommendationSubtopic,
  AiThumbnailConcept,
  DifficultyLevel,
  HookStyle,
  PriorityLevel,
  Question,
  QuestionLanguage,
  Script,
  TeleprompterSegment,
  TeleprompterSegmentSection,
  Video,
} from '../../types';
import {
  AIProvider,
  AIProviderOptions,
  AiRefinementAction,
  GenerateCandidateInput,
  GenerationResult,
  QuestionCandidate,
  RefineCandidateInput,
} from './types';
import { taxonomyService } from '../services/taxonomy.service';
import { questionsRepository } from '../repositories/questions.repository';
import { ScriptContentPayload } from '../services/script.service';

async function withTimeout<T>(promise: Promise<T>, ms: number = 30000, errorMsg: string = 'Gemini API call timed out'): Promise<T> {
  const effectiveMs = process.env.GEMINI_API_KEY ? ms : 200;
  let timeoutId: any;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(errorMsg)), effectiveMs);
  });

  return Promise.race([
    promise.then((res) => {
      clearTimeout(timeoutId);
      return res;
    }),
    timeoutPromise,
  ]);
}

export class GeminiService implements AIProvider {
  public readonly providerId: string = 'gemini';
  public readonly defaultModelId: string = DEFAULT_AI_CONFIG.defaultModel;

  private static instance: GeminiService | null = null;

  private constructor() {
    aiProviderRegistry.registerProvider(this);
  }

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  public isConfigured(): boolean {
    return geminiClient.isConfigured();
  }

  /**
   * Helper method to call Gemini API with bounded retry logic and fallback models when experiencing transient errors.
   */
  private async callGeminiWithRetryAndFallback(params: {
    contents: any;
    config: any;
    timeoutMs?: number;
    timeoutMsg?: string;
    options?: AIProviderOptions;
  }): Promise<{
    text: string;
    modelUsed: string;
    totalAttempts: number;
    errorClassification?: AIErrorClassification;
  }> {
    const client = geminiClient.getClient();
    if (!client || !geminiClient.isConfigured()) {
      throw new AIProviderError(
        'Gemini API is not configured or missing API key',
        this.providerId,
        geminiClient.getModelName(),
        'AUTH_ERROR',
        false,
        401
      );
    }

    const primaryModel = params.options?.modelId || geminiClient.getModelName();
    const candidateModels = [
      primaryModel,
      ...DEFAULT_AI_CONFIG.allowedGeminiModels,
    ].filter((m, idx, arr) => arr.indexOf(m) === idx);

    let lastError: any = null;
    let lastClassification: AIErrorClassification = 'UNKNOWN_ERROR';
    let totalAttempts = 0;
    const maxTotalAttempts = Math.min(
      DEFAULT_AI_CONFIG.maxTotalAttempts,
      params.options?.maxRetries !== undefined
        ? params.options.maxRetries + 1
        : DEFAULT_AI_CONFIG.maxTotalAttempts
    );

    for (const model of candidateModels) {
      if (totalAttempts >= maxTotalAttempts) break;

      for (let attempt = 0; attempt <= DEFAULT_AI_CONFIG.maxRetriesPerModel; attempt++) {
        if (totalAttempts >= maxTotalAttempts) break;
        totalAttempts++;

        try {
          if (attempt > 0) {
            await new Promise((res) => setTimeout(res, DEFAULT_AI_CONFIG.backoffMs * attempt));
          }

          const response = await withTimeout(
            client.models.generateContent({
              model,
              contents: params.contents,
              config: params.config,
            }),
            params.timeoutMs || params.options?.timeoutMs || DEFAULT_AI_CONFIG.timeoutMs,
            params.timeoutMsg || `Gemini generation timed out for model ${model}`
          );

          const text = response.text || '';
          if (text) {
            return { text, modelUsed: model, totalAttempts };
          }
        } catch (err: any) {
          lastError = err;
          const classified = classifyAIError(err);
          lastClassification = classified.classification;

          // CRITICAL COST & QUOTA SAFETY MANDATE:
          // Non-retryable errors (QUOTA_EXHAUSTED, AUTH_ERROR, INVALID_REQUEST) break immediately!
          // Unbounded or rapid hammering on an exhausted model is strictly forbidden.
          // Also, if a model is experiencing high demand (503 / UNAVAILABLE), immediately fall back
          // to the next candidate model rather than repeating calls to the same overloaded model.
          const rawErrStr = (err?.message || (typeof err === 'object' ? JSON.stringify(err) : '')).toLowerCase();
          const isHighDemandOrOverloaded =
            classified.classification === 'QUOTA_EXHAUSTED' ||
            rawErrStr.includes('503') ||
            rawErrStr.includes('high demand') ||
            rawErrStr.includes('unavailable');

          if (!classified.isRetryable || isHighDemandOrOverloaded) {
            break;
          }
        }
      }
    }

    const rawMsg = lastError?.message || (typeof lastError === 'object' ? JSON.stringify(lastError) : 'Upstream API error');
    const sanitizedMsg = sanitizeKeyInMessage(rawMsg);
    throw new AIProviderError(
      sanitizedMsg,
      this.providerId,
      primaryModel,
      lastClassification,
      false,
      lastClassification === 'QUOTA_EXHAUSTED' ? 429 : 500
    );
  }

  /**
   * Generates a new aptitude question candidate.
   */
  public async generateCandidate(
    input: GenerateCandidateInput,
    options?: AIProviderOptions
  ): Promise<GenerationResult> {
    const startTime = Date.now();
    let model = options?.modelId || geminiClient.getModelName();
    const client = geminiClient.getClient();

    let rawCandidate: any = null;
    let retryCount = 0;
    let errorClassification: AIErrorClassification | undefined = undefined;

    if (client && geminiClient.isConfigured()) {
      try {
        const prompt = buildGenerationPrompt(input);
        const { text, modelUsed, totalAttempts } = await this.callGeminiWithRetryAndFallback({
          contents: prompt,
          config: {
            systemInstruction: BURRA_PARIKSHA_SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: GenAiQuestionCandidateResponseSchema as any,
            temperature: options?.temperature ?? 0.7,
          },
          timeoutMs: options?.timeoutMs || 30000,
          timeoutMsg: 'Gemini generation timed out',
          options,
        });

        model = modelUsed;
        retryCount = Math.max(0, totalAttempts - 1);
        rawCandidate = JSON.parse(text);
      } catch (err: any) {
        const classified = classifyAIError(err);
        errorClassification = classified.classification;
        const sanitizedMsg = classified.sanitizedMessage;

        throw err instanceof AIProviderError
          ? err
          : new AIProviderError(
              `Gemini generation failed: ${sanitizedMsg}`,
              this.providerId,
              model,
              classified.classification,
              false,
              classified.classification === 'QUOTA_EXHAUSTED' ? 429 : 500
            );
      }
    } else {
      throw new AIProviderError(
        'Gemini API is not configured or missing API key',
        this.providerId,
        geminiClient.getModelName(),
        'AUTH_ERROR',
        false,
        401
      );
    }

    const contextVal = input.realLifeContext || input.realWorldContext || '';

    // Attach taxonomy context
    const candidate: QuestionCandidate = {
      content: rawCandidate.content || '',
      option_a: rawCandidate.option_a || '',
      option_b: rawCandidate.option_b || '',
      option_c: rawCandidate.option_c || '',
      option_d: rawCandidate.option_d || '',
      correct_answer: rawCandidate.correct_answer || 'A',
      explanation: rawCandidate.explanation || '',
      difficulty: rawCandidate.difficulty || input.difficulty || DifficultyLevel.MEDIUM,
      language: rawCandidate.language || input.language || QuestionLanguage.TELUGU,
      real_world_context:
        (rawCandidate.real_world_context && rawCandidate.real_world_context.toUpperCase() !== 'RANDOM')
          ? rawCandidate.real_world_context
          : (contextVal && contextVal.toUpperCase() !== 'RANDOM'
              ? contextVal
              : (input.language === QuestionLanguage.TELUGU ? 'హైదరాబాద్ మెట్రో ప్రయాణం' : 'Daily Commute & Public Transit')),
      question_style: rawCandidate.question_style || input.questionStyle || 'Real-World Scenario',
      challenge_type: rawCandidate.challenge_type || input.challengeType || 'Standard Challenge',
      presentation_type: rawCandidate.presentation_type || input.presentationType || 'Standard Text',
      taxonomy: {
        categoryId: input.categoryId,
        categoryName: input.categoryName,
        topicId: input.topicId,
        topicName: input.topicName,
        subtopicId: input.subtopicId,
        subtopicName: input.subtopicName,
      },
    };

    let validation = CandidateValidator.validate(candidate);
    if (geminiClient.isConfigured() && validation.mathematicalVerification?.status === 'UNVERIFIED') {
      try {
        validation = await CandidateValidator.validateAsync(candidate, new GeminiBlindVerifierProvider(model));
      } catch (err) {
        console.warn('[GeminiService] Blind verification failed, keeping sync report:', err);
      }
    }
    const durationMs = Date.now() - startTime;

    return {
      candidate,
      metadata: {
        providerId: this.providerId,
        modelId: model,
        modelUsed: model,
        generationDurationMs: durationMs,
        latencyMs: durationMs,
        retryCount,
        fallbackUsed: false,
        generatorType: 'GEMINI_AI',
        errorClassification,
        requestId: options?.requestId,
      },
      validation,
    };
  }

  /**
   * Refines an existing question candidate using the administrator's current UI state.
   */
  public async refineCandidate(
    input: RefineCandidateInput,
    options?: AIProviderOptions
  ): Promise<GenerationResult> {
    const startTime = Date.now();
    let model = options?.modelId || geminiClient.getModelName();
    const client = geminiClient.getClient();

    let rawCandidate: any = null;
    let retryCount = 0;
    let errorClassification: AIErrorClassification | undefined = undefined;

    if (client && geminiClient.isConfigured()) {
      try {
        const { systemInstruction, userPrompt } = buildRefinementPrompt(input);
        const { text, modelUsed, totalAttempts } = await this.callGeminiWithRetryAndFallback({
          contents: userPrompt,
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
            responseSchema: GenAiQuestionCandidateResponseSchema as any,
            temperature: options?.temperature ?? 0.5,
          },
          timeoutMs: options?.timeoutMs || 30000,
          timeoutMsg: 'Gemini refinement timed out',
          options,
        });

        model = modelUsed;
        retryCount = Math.max(0, totalAttempts - 1);
        rawCandidate = JSON.parse(text);
      } catch (err: any) {
        const classified = classifyAIError(err);
        errorClassification = classified.classification;
        const sanitizedMsg = classified.sanitizedMessage;

        throw err instanceof AIProviderError
          ? err
          : new AIProviderError(
              `Gemini refinement failed: ${sanitizedMsg}`,
              this.providerId,
              model,
              classified.classification,
              false,
              classified.classification === 'QUOTA_EXHAUSTED' ? 429 : 500
            );
      }
    } else {
      throw new AIProviderError(
        'Gemini API is not configured or missing API key',
        this.providerId,
        geminiClient.getModelName(),
        'AUTH_ERROR',
        false,
        401
      );
    }

    const candidate: QuestionCandidate = {
      content: rawCandidate.content || input.currentCandidate.content,
      option_a: rawCandidate.option_a || input.currentCandidate.option_a,
      option_b: rawCandidate.option_b || input.currentCandidate.option_b,
      option_c: rawCandidate.option_c || input.currentCandidate.option_c,
      option_d: rawCandidate.option_d || input.currentCandidate.option_d,
      correct_answer: rawCandidate.correct_answer || input.currentCandidate.correct_answer,
      explanation: rawCandidate.explanation || input.currentCandidate.explanation,
      difficulty: rawCandidate.difficulty || input.targetDifficulty || input.currentCandidate.difficulty,
      language: rawCandidate.language || input.targetLanguage || input.currentCandidate.language,
      real_world_context: rawCandidate.real_world_context || input.currentCandidate.real_world_context || '',
      question_style: rawCandidate.question_style || input.currentCandidate.question_style || '',
      taxonomy: input.currentCandidate.taxonomy,
    };

    let validation = CandidateValidator.validate(candidate);
    if (geminiClient.isConfigured() && validation.mathematicalVerification?.status === 'UNVERIFIED') {
      try {
        validation = await CandidateValidator.validateAsync(candidate, new GeminiBlindVerifierProvider(model));
      } catch (err) {
        console.warn('[GeminiService] Blind verification in refinement failed, keeping sync report:', err);
      }
    }
    const durationMs = Date.now() - startTime;

    return {
      candidate,
      metadata: {
        providerId: this.providerId,
        modelId: model,
        modelUsed: model,
        generationDurationMs: durationMs,
        latencyMs: durationMs,
        retryCount,
        fallbackUsed: false,
        generatorType: 'GEMINI_AI',
        errorClassification,
        requestId: options?.requestId,
      },
      validation,
    };
  }

  /**
   * Phase 9: AI Content Planning Assistant
   * Generates pedagogical distribution and batch recommendations based on taxonomy coverage.
   * 
   * NOTE: This returns an unapproved advisory proposal. The administrator must explicitly
   * confirm/approve the recommendation before any plan or batch is created.
   */
  public async generateContentPlanRecommendation(input: {
    categoryId?: string;
    topicId?: string;
    targetTotalCount?: number;
    language?: QuestionLanguage;
    preferredDifficulties?: DifficultyLevel[];
    focusContext?: string;
  }): Promise<AiContentPlanRecommendation> {
    const targetTotal = input.targetTotalCount || 20;
    let categoryName = 'Aptitude Content';
    if (input.categoryId) {
      const category = await taxonomyService.getCategoryById(input.categoryId);
      categoryName = category ? category.name : input.categoryId;
    }

    let topics = await taxonomyService.getTopics(input.categoryId);
    if (input.topicId) {
      topics = topics.filter((t) => t.id === input.topicId);
    }

    const topicName = input.topicId && topics.length > 0 ? topics[0].name : undefined;
    if (topicName && (!input.categoryId || categoryName === 'Aptitude Content')) {
      categoryName = topicName;
    }

    // Fetch existing questions to detect zero/low coverage
    const allQuestions = await questionsRepository.findAll();
    const subtopicRecommendations: AiPlanRecommendationSubtopic[] = [];

    // Collect all eligible subtopics
    const allEligibleSubtopics: { id: string; name: string; topicId: string; topicName: string; existingCount: number }[] = [];

    for (const t of topics) {
      const subs = await taxonomyService.getSubtopics(t.id);
      for (const s of subs) {
        const existingCount = allQuestions.filter((q) => q.subtopicId === s.id).length;
        allEligibleSubtopics.push({
          id: s.id,
          name: s.name,
          topicId: t.id,
          topicName: t.name,
          existingCount,
        });
      }
    }

    // Sort by fewest existing questions (highest priority for coverage)
    allEligibleSubtopics.sort((a, b) => a.existingCount - b.existingCount);

    const selectedSubtopics = allEligibleSubtopics.slice(0, Math.min(5, allEligibleSubtopics.length));
    const subtopicCount = selectedSubtopics.length || 1;
    const countPerSubtopic = Math.max(1, Math.floor(targetTotal / subtopicCount));
    let distributedCount = 0;

    selectedSubtopics.forEach((sub, index) => {
      const isLast = index === selectedSubtopics.length - 1;
      const count = isLast ? targetTotal - distributedCount : countPerSubtopic;
      distributedCount += count;

      const easy = Math.max(1, Math.round(count * 0.3));
      const hard = Math.max(1, Math.round(count * 0.2));
      const medium = Math.max(0, count - easy - hard);

      subtopicRecommendations.push({
        subtopicId: sub.id,
        subtopicName: sub.name,
        recommendedCount: count,
        difficultyBreakdown: {
          easy,
          medium,
          hard,
        },
        rationale:
          sub.existingCount === 0
            ? `Critical Zero-Coverage subtopic. Immediate ${count}-question sprint recommended to establish baseline syllabus bank.`
            : `Low-Coverage subtopic (${sub.existingCount} existing questions). Expanding depth across progressive difficulty tiers.`,
        suggestedContexts: [
          'Telugu State competitive exams (APPSC/TSPSC Group 1, 2)',
          'Modern workplace and daily financial arithmetic scenarios',
          'Fast 30-second elimination tricks for high-retention shorts',
        ],
      });
    });

    const batchSuggestions: AiPlanBatchSuggestion[] = [
      {
        batchName: `${categoryName} Sprint A — Foundational Mastery`,
        targetCount: Math.ceil(targetTotal / 2),
        priority: PriorityLevel.HIGH,
        rationale: 'Focuses on core speed tricks and high-frequency exam patterns with visual explanations.',
        subtopicIds: subtopicRecommendations.slice(0, Math.ceil(subtopicRecommendations.length / 2)).map((s) => s.subtopicId),
      },
      {
        batchName: `${categoryName} Sprint B — Advanced Edge Cases`,
        targetCount: Math.floor(targetTotal / 2),
        priority: PriorityLevel.NORMAL,
        rationale: 'Multi-step calculation traps, deceptive distractors, and rapid mental math shortcuts.',
        subtopicIds: subtopicRecommendations.slice(Math.ceil(subtopicRecommendations.length / 2)).map((s) => s.subtopicId),
      },
    ];

    return {
      categoryId: input.categoryId,
      categoryName,
      topicId: input.topicId,
      topicName,
      targetTotalCount: targetTotal,
      pedagogicalRationale: `Targeting high-yield topics under ${categoryName} with balanced 30% Easy / 50% Medium / 20% Hard cognitive load, closing ${subtopicRecommendations.filter((s) => s.rationale.includes('Zero-Coverage')).length} zero-coverage gap(s).`,
      priorityFocusAreas: [
        'Prioritize zero-coverage subtopics to ensure comprehensive syllabus breadth',
        'Incorporate practical real-world scenarios to boost viewer retention',
        'Standardize 4-option MCQs with mathematically plausible distractor explanations',
      ],
      recommendedDistribution: subtopicRecommendations,
      suggestedBatchGrouping: batchSuggestions,
      isAiGenerated: true,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Generates a conversational Telugu teleprompter script for short-form video production.
   * Produces a 5-part script (Hook, Problem + Options ఎ/బి/సి/డి, Solution, Burra Trick, CTA).
   */
  public async generateTeluguScript(
    question: Question | QuestionCandidate | {
      questionText?: string;
      content?: string;
      options?: { a: string; b: string; c: string; d: string };
      option_a?: string;
      option_b?: string;
      option_c?: string;
      option_d?: string;
      correctAnswer?: string;
      correct_answer?: string;
      explanation?: string;
      categoryName?: string;
      topicName?: string;
      realWorldContext?: string;
      real_world_context?: string;
    }
  ): Promise<{
    scriptPayload: ScriptContentPayload;
    metadata: {
      modelUsed: string;
      generationDurationMs: number;
      fallbackUsed: boolean;
    };
    validation: ScriptValidationReport;
  }> {
    const startTime = Date.now();
    let model = geminiClient.getModelName();
    const client = geminiClient.getClient();

    if (!client || !geminiClient.isConfigured()) {
      throw new AIProviderError(
        'Gemini API is not configured or missing API key',
        this.providerId,
        geminiClient.getModelName(),
        'AUTH_ERROR',
        false,
        401
      );
    }

    let rawScript: any = null;

    try {
      const prompt = buildTeluguScriptPrompt(question);
      const { text, modelUsed } = await this.callGeminiWithRetryAndFallback({
        contents: prompt,
        config: {
          systemInstruction: BURRA_PARIKSHA_SCRIPT_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: GenAiTeluguScriptResponseSchema as any,
          temperature: 0.7,
        },
        timeoutMs: 30000,
        timeoutMsg: 'Gemini script generation timed out',
      });

      model = modelUsed;
      rawScript = JSON.parse(text);
    } catch (err: any) {
      const classified = classifyAIError(err);
      const sanitizedMsg = classified.sanitizedMessage;

      throw err instanceof AIProviderError
        ? err
        : new AIProviderError(
            `Gemini script generation failed: ${sanitizedMsg}`,
            this.providerId,
            model,
            classified.classification,
            false,
            classified.classification === 'QUOTA_EXHAUSTED' ? 429 : 500
          );
    }

    const scriptPayload: ScriptContentPayload = {
      hookText: rawScript.hookText || '',
      problemStatement: rawScript.problemStatement || '',
      stepByStepSolution: rawScript.stepByStepSolution || '',
      speedTrickOrTakeaway: rawScript.speedTrickOrTakeaway || '',
      callToAction: rawScript.callToAction || '',
      notes: rawScript.notes || 'Conversational Telugu teleprompter script generated for Burra Pariksha.',
    };

    const validation = ScriptValidator.validate(scriptPayload);
    const durationMs = Date.now() - startTime;

    return {
      scriptPayload,
      metadata: {
        modelUsed: model,
        generationDurationMs: durationMs,
        fallbackUsed: false,
      },
      validation,
    };
  }

  /**
   * Phase 8C: Multi-Hook & Presentation Strategy Generator
   * Generates multiple hook variants (bounded up to 5) and presentation strategy in a SINGLE AI call.
   */
  public async generateSocialHooksAndStrategy(
    question: any,
    requestedStyles: HookStyle[] = [
      HookStyle.CURIOSITY,
      HookStyle.BRAIN_CHALLENGE,
      HookStyle.SPEED_CHALLENGE,
      HookStyle.REAL_WORLD,
      HookStyle.EXAM_CHALLENGE,
    ],
    language: QuestionLanguage = QuestionLanguage.TELUGU
  ): Promise<{
    hooks: Array<{
      id: string;
      style: HookStyle;
      text: string;
      spokenTeluguText: string;
      onScreenOverlayText: string;
      estimatedDurationSeconds: number;
      rationale?: string;
    }>;
    presentationStrategy: {
      visualOpening: string;
      onScreenTitleOverlay: string;
      questionRevealTimingMs: number;
      optionRevealTimingMs: number;
      answerRevealTimingMs: number;
      explanationTimingMs: number;
      visualEmphasisNotes: string;
      diagramOrChartSuggestion?: string;
      pacingWpm: number;
    };
    metadata: {
      modelUsed: string;
      generationDurationMs: number;
      fallbackUsed: boolean;
      aiCallsCount: number;
    };
  }> {
    const startTime = Date.now();
    let model = geminiClient.getModelName();
    const client = geminiClient.getClient();

    if (!client || !geminiClient.isConfigured()) {
      throw new AIProviderError(
        'Gemini API is not configured or missing API key',
        this.providerId,
        geminiClient.getModelName(),
        'AUTH_ERROR',
        false,
        401
      );
    }

    let rawData: any = null;

    // Enforce max 5 requested styles in a single bounded AI call
    const boundedStyles = requestedStyles.slice(0, 5);

    try {
      const prompt = buildSocialHookPrompt(question, boundedStyles, language);
      const { text, modelUsed } = await this.callGeminiWithRetryAndFallback({
        contents: prompt,
        config: {
          systemInstruction: BURRA_PARIKSHA_SOCIAL_HOOK_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: GenAiSocialHookResponseSchema as any,
          temperature: 0.7,
        },
        timeoutMs: 30000,
        timeoutMsg: 'Gemini social hook generation timed out',
      });

      model = modelUsed;
      rawData = JSON.parse(text);
    } catch (err: any) {
      const classified = classifyAIError(err);
      const sanitizedMsg = classified.sanitizedMessage;

      throw err instanceof AIProviderError
        ? err
        : new AIProviderError(
            `Gemini social hook generation failed: ${sanitizedMsg}`,
            this.providerId,
            model,
            classified.classification,
            false,
            classified.classification === 'QUOTA_EXHAUSTED' ? 429 : 500
          );
    }

    // Validate payload against Zod schema
    const parsed = SocialHookAndStrategyZodSchema.safeParse(rawData);
    if (!parsed.success) {
      throw new AIProviderError(
        `Invalid social hook output schema: ${parsed.error.message}`,
        this.providerId,
        model,
        'INVALID_REQUEST',
        false,
        502
      );
    }
    const validData = parsed.data;

    const durationMs = Date.now() - startTime;

    return {
      hooks: validData.hooks,
      presentationStrategy: validData.presentationStrategy,
      metadata: {
        modelUsed: model,
        generationDurationMs: durationMs,
        fallbackUsed: false,
        aiCallsCount: 1, // Enforces strictly 1 AI call
      },
    };
  }

  /**
   * Phase 8D: Teleprompter & Spoken Telugu Script Generator
   * Transforms a validated Question, selected Hook, and Strategy into an ordered teleprompter script in a SINGLE AI call.
   */
  public async generateSpokenTeleprompterScript(
    question: any,
    selectedHookText: string,
    selectedHookStyle: HookStyle = HookStyle.CURIOSITY,
    language: QuestionLanguage = QuestionLanguage.TELUGU,
    pacingWpm: number = 140
  ): Promise<{
    pacingWpm: number;
    totalEstimatedDurationSeconds: number;
    segments: TeleprompterSegment[];
    metadata: {
      modelUsed: string;
      generationDurationMs: number;
      fallbackUsed: boolean;
      aiCallsCount: number;
    };
  }> {
    const startTime = Date.now();
    let model = geminiClient.getModelName();
    const client = geminiClient.getClient();

    if (!client || !geminiClient.isConfigured()) {
      throw new AIProviderError(
        'Gemini API is not configured or missing API key',
        this.providerId,
        geminiClient.getModelName(),
        'AUTH_ERROR',
        false,
        401
      );
    }

    let rawData: any = null;

    try {
      const prompt = buildTeleprompterScriptPrompt(
        question,
        selectedHookText,
        selectedHookStyle,
        language,
        pacingWpm
      );
      const { text, modelUsed } = await this.callGeminiWithRetryAndFallback({
        contents: prompt,
        config: {
          systemInstruction: BURRA_PARIKSHA_TELEPROMPTER_SCRIPT_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: GenAiTeleprompterScriptResponseSchema as any,
          temperature: 0.7,
        },
        timeoutMs: 30000,
        timeoutMsg: 'Gemini teleprompter script generation timed out',
      });

      model = modelUsed;
      rawData = JSON.parse(text);
    } catch (err: any) {
      const classified = classifyAIError(err);
      const sanitizedMsg = classified.sanitizedMessage;

      throw err instanceof AIProviderError
        ? err
        : new AIProviderError(
            `Gemini teleprompter script generation failed: ${sanitizedMsg}`,
            this.providerId,
            model,
            classified.classification,
            false,
            classified.classification === 'QUOTA_EXHAUSTED' ? 429 : 500
          );
    }

    // Validate payload against Zod schema
    const parsed = TeleprompterScriptZodSchema.safeParse(rawData);
    if (!parsed.success) {
      throw new AIProviderError(
        `Invalid teleprompter script output schema: ${parsed.error.message}`,
        this.providerId,
        model,
        'INVALID_REQUEST',
        false,
        502
      );
    }
    const validData = parsed.data;

    const durationMs = Date.now() - startTime;

    return {
      pacingWpm: validData.pacingWpm,
      totalEstimatedDurationSeconds: validData.totalEstimatedDurationSeconds,
      segments: validData.segments as TeleprompterSegment[],
      metadata: {
        modelUsed: model,
        generationDurationMs: durationMs,
        fallbackUsed: false,
        aiCallsCount: 1, // Enforces strictly 1 AI call
      },
    };
  }

  /**
   * Phase 8E: Generates social metadata (title, caption, description, hashtags, keywords, CTA) in ONE AI call.
   */
  public async generateSocialMetadata(
    question: any,
    selectedHookText?: string,
    teleprompterScript?: any,
    language: QuestionLanguage = QuestionLanguage.TELUGU,
    options?: AIProviderOptions
  ): Promise<{
    metadata: SocialMetadataAIResult;
    aiCallsCount: number;
    metadataInfo: { providerId: string; modelId: string; fallbackUsed: boolean };
  }> {
    let model = geminiClient.getModelName();
    const client = geminiClient.getClient();

    if (!client || !geminiClient.isConfigured()) {
      throw new AIProviderError(
        'Gemini API is not configured or missing API key',
        this.providerId,
        geminiClient.getModelName(),
        'AUTH_ERROR',
        false,
        401
      );
    }

    let rawData: any = null;
    let aiCallsCount = 1;

    try {
      const prompt = buildSocialMetadataPrompt(question, selectedHookText, language);
      const { text, modelUsed, totalAttempts } = await this.callGeminiWithRetryAndFallback({
        contents: prompt,
        config: {
          systemInstruction: BURRA_PARIKSHA_SOCIAL_METADATA_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          responseSchema: SocialMetadataGenAISchema as any,
          temperature: 0.7,
        },
        timeoutMs: 30000,
        timeoutMsg: 'Gemini social metadata generation timed out',
        options,
      });

      model = modelUsed;
      aiCallsCount = totalAttempts;
      rawData = JSON.parse(text);
    } catch (err: any) {
      const classified = classifyAIError(err);
      const sanitizedMsg = classified.sanitizedMessage;

      throw err instanceof AIProviderError
        ? err
        : new AIProviderError(
            `Gemini social metadata generation failed: ${sanitizedMsg}`,
            this.providerId,
            model,
            classified.classification,
            false,
            classified.classification === 'QUOTA_EXHAUSTED' ? 429 : 500
          );
    }

    const parsed = SocialMetadataZodSchema.safeParse(rawData);
    if (!parsed.success) {
      throw new AIProviderError(
        `Invalid social metadata output schema: ${parsed.error.message}`,
        this.providerId,
        model,
        'INVALID_REQUEST',
        false,
        502
      );
    }
    const validData = parsed.data;

    // Ensure mandatory hashtag #BurraPariksha exists in hashtags array
    if (!validData.hashtags.some((h) => h.toLowerCase() === '#burrapariksha')) {
      validData.hashtags.unshift('#BurraPariksha');
    }

    return {
      metadata: validData,
      aiCallsCount,
      metadataInfo: {
        providerId: 'gemini',
        modelId: model,
        fallbackUsed: false,
      },
    };
  }

  /**
   * Phase 8F: Generates multi-platform adapted variants (YouTube Shorts, Instagram Reels, Facebook Reels)
   * in ONE single AI call.
   */
  public async generatePlatformAdaptation(
    question: any,
    canonicalMetadata: any,
    language: QuestionLanguage = QuestionLanguage.TELUGU,
    options?: AIProviderOptions
  ): Promise<{
    rawVariants: any;
    aiCallsCount: number;
    info: { providerId: string; modelId: string; fallbackUsed: boolean };
  }> {
    let model = geminiClient.getModelName();
    const client = geminiClient.getClient();

    if (!client || !geminiClient.isConfigured()) {
      throw new AIProviderError(
        'Gemini API is not configured or missing API key',
        this.providerId,
        geminiClient.getModelName(),
        'AUTH_ERROR',
        false,
        401
      );
    }

    let rawData: any = null;
    let aiCallsCount = 1;

    try {
      const sysPrompt = buildPlatformAdaptationSystemPrompt(language);
      const userPrompt = buildPlatformAdaptationUserPrompt(question, canonicalMetadata);

      const { text, modelUsed, totalAttempts } = await this.callGeminiWithRetryAndFallback({
        contents: userPrompt,
        config: {
          systemInstruction: sysPrompt,
          responseMimeType: 'application/json',
          responseSchema: PlatformAdaptedVariantGenAISchema as any,
          temperature: 0.7,
        },
        timeoutMs: 30000,
        timeoutMsg: 'Gemini platform adaptation timed out',
        options,
      });

      model = modelUsed;
      aiCallsCount = totalAttempts;
      rawData = JSON.parse(text);
    } catch (err: any) {
      const classified = classifyAIError(err);
      const sanitizedMsg = classified.sanitizedMessage;

      throw err instanceof AIProviderError
        ? err
        : new AIProviderError(
            `Gemini platform adaptation generation failed: ${sanitizedMsg}`,
            this.providerId,
            model,
            classified.classification,
            false,
            classified.classification === 'QUOTA_EXHAUSTED' ? 429 : 500
          );
    }

    const parsed = PlatformAdaptedVariantZodSchema.safeParse(rawData);
    if (!parsed.success) {
      throw new AIProviderError(
        `Invalid platform adaptation output schema: ${parsed.error.message}`,
        this.providerId,
        model,
        'INVALID_REQUEST',
        false,
        502
      );
    }

    return {
      rawVariants: parsed.data,
      aiCallsCount,
      info: {
        providerId: 'gemini',
        modelId: model,
        fallbackUsed: false,
      },
    };
  }

  /**
   * Evaluates social content quality across semantic dimensions in ONE single AI call.
   */
  public async assessSocialQuality(
    question: any,
    enhancementPackage: any,
    platformAdaptations?: any,
    options?: AIProviderOptions
  ): Promise<{
    rawOutput: SocialQualityAssessmentAIOutput;
    aiCallsCount: number;
    info: { providerId: string; modelId: string; fallbackUsed: boolean };
  }> {
    let model = geminiClient.getModelName();
    const client = geminiClient.getClient();

    if (!client || !geminiClient.isConfigured()) {
      throw new AIProviderError(
        'Gemini API is not configured or missing API key',
        this.providerId,
        geminiClient.getModelName(),
        'AUTH_ERROR',
        false,
        401
      );
    }

    let rawData: any = null;
    let aiCallsCount = 1;

    const language = question?.language || QuestionLanguage.TELUGU;

    try {
      const sysPrompt = buildSocialQualitySystemPrompt(language);
      const userPrompt = buildSocialQualityUserPrompt(question, enhancementPackage, platformAdaptations);

      const { text, modelUsed, totalAttempts } = await this.callGeminiWithRetryAndFallback({
        contents: userPrompt,
        config: {
          systemInstruction: sysPrompt,
          responseMimeType: 'application/json',
          responseSchema: SocialQualityAssessmentGenAISchema as any,
          temperature: 0.2,
        },
        timeoutMs: 30000,
        timeoutMsg: 'Gemini social quality assessment timed out',
        options,
      });

      model = modelUsed;
      aiCallsCount = totalAttempts;
      rawData = JSON.parse(text);
    } catch (err: any) {
      const classified = classifyAIError(err);
      const sanitizedMsg = classified.sanitizedMessage;

      throw err instanceof AIProviderError
        ? err
        : new AIProviderError(
            `Gemini social quality assessment failed: ${sanitizedMsg}`,
            this.providerId,
            model,
            classified.classification,
            false,
            classified.classification === 'QUOTA_EXHAUSTED' ? 429 : 500
          );
    }

    const parsed = SocialQualityAssessmentZodSchema.safeParse(rawData);
    if (!parsed.success) {
      throw new AIProviderError(
        `Invalid social quality assessment output schema: ${parsed.error.message}`,
        this.providerId,
        model,
        'INVALID_REQUEST',
        false,
        502
      );
    }

    return {
      rawOutput: parsed.data,
      aiCallsCount,
      info: {
        providerId: 'gemini',
        modelId: model,
        fallbackUsed: false,
      },
    };
  }

  /**
   * Phase 18: Generate AI Thumbnail Intelligence Concepts
   * Generates structured A/B thumbnail concepts with curiosity framing, visual directions, and audience targeting.
   * Enforces answer-leakage protection and mobile readability.
   */
  public async generateThumbnailIntelligence(
    question: Question,
    contentId: string,
    options?: { script?: Script; video?: Video; numberOfVariants?: number }
  ): Promise<AiThumbnailConcept[]> {
    const client = geminiClient.getClient();
    let model = geminiClient.getModelName();

    if (!client || !geminiClient.isConfigured()) {
      throw new AIProviderError(
        'Gemini API is not configured or missing API key',
        this.providerId,
        geminiClient.getModelName(),
        'AUTH_ERROR',
        false,
        401
      );
    }

    try {
      const prompt = buildThumbnailIntelligenceUserPrompt(question, options?.script);
      const systemInstruction = BURRA_PARIKSHA_THUMBNAIL_SYSTEM_INSTRUCTION;

      const { text, modelUsed } = await this.callGeminiWithRetryAndFallback({
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: GenAiThumbnailIntelligenceResponseSchema as any,
          temperature: 0.7,
        },
        timeoutMs: 30000,
        timeoutMsg: 'Gemini thumbnail intelligence generation timed out',
      });

      model = modelUsed;

      if (!text) {
        throw new AIProviderError(
          'Gemini returned empty response for thumbnail intelligence',
          this.providerId,
          model,
          'INVALID_REQUEST',
          false,
          502
        );
      }

      const parsedJson = JSON.parse(text);
      const validationResult = AiThumbnailIntelligenceResponseZodSchema.safeParse(parsedJson);

      if (!validationResult.success || !validationResult.data.concepts || validationResult.data.concepts.length === 0) {
        throw new AIProviderError(
          `Invalid thumbnail intelligence schema: ${validationResult.success ? 'no concepts returned' : validationResult.error.message}`,
          this.providerId,
          model,
          'INVALID_REQUEST',
          false,
          502
        );
      }

      const now = new Date().toISOString();
      return validationResult.data.concepts.map((concept, index) => {
        // Enforce answer-leakage safety check
        let safeHeadline = concept.hookHeadline;
        const safetyCheck = ThumbnailSafetyValidator.validate(safeHeadline, question);
        if (!safetyCheck.isValid || safetyCheck.leaksAnswer) {
          safeHeadline = `99% DID THIS MISTAKE! 🔥`;
        }

        const variantLetter = String.fromCharCode(65 + index); // A, B, C...
        const conceptId = `BP-TC-${contentId.replace(/^BP-CNT-/, '')}-${variantLetter}`;

        return {
          id: conceptId,
          contentId,
          questionId: question.id,
          scriptId: options?.script?.id,
          videoId: options?.video?.id,
          conceptName: concept.conceptName,
          hookHeadline: safeHeadline,
          curiosityFraming: concept.curiosityFraming,
          visualDirection: concept.visualDirection,
          audienceTargeting: {
            primaryAudience: concept.audienceTargeting.primaryAudience,
            secondaryAudience: concept.audienceTargeting.secondaryAudience,
            languageStyle: concept.audienceTargeting.languageStyle as any,
            difficultyPerception: concept.audienceTargeting.difficultyPerception as any,
          },
          abVariant: concept.abVariant || variantLetter,
          isAiGenerated: true,
          notes: concept.notes,
          createdAt: now,
        };
      });
    } catch (error: any) {
      if (error instanceof AIProviderError) throw error;
      const classified = classifyAIError(error);
      throw new AIProviderError(
        `Gemini thumbnail intelligence generation failed: ${classified.sanitizedMessage}`,
        this.providerId,
        model,
        classified.classification,
        false,
        classified.classification === 'QUOTA_EXHAUSTED' ? 429 : 500
      );
    }
  }

  /**
   * Phase 19: Generate AI Pinned Comment & Conversation Intelligence Package
   * Generates structured pinned comment, discussion prompt, follow-up challenge questions, and audience engagement prompt.
   */
  public async generatePinnedCommentPackage(
    question: Question,
    contentId: string,
    options?: { script?: Script; video?: Video; approvedScriptVersion?: number }
  ): Promise<{
    pinnedComment: string;
    answerDiscussionPrompt: string;
    followUpQuestions: string[];
    audienceParticipationPrompt: string;
    isAiGenerated: boolean;
    aiModelUsed: string;
    notes?: string;
  }> {
    const client = geminiClient.getClient();
    let model = geminiClient.getModelName();

    if (!client || !geminiClient.isConfigured()) {
      throw new AIProviderError(
        'Gemini API is not configured or missing API key',
        this.providerId,
        geminiClient.getModelName(),
        'AUTH_ERROR',
        false,
        401
      );
    }

    try {
      const prompt = buildPinnedCommentUserPrompt(question, options?.script);
      const systemInstruction = BURRA_PARIKSHA_PINNED_COMMENT_SYSTEM_INSTRUCTION;

      const { text, modelUsed } = await this.callGeminiWithRetryAndFallback({
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: GenAiPinnedCommentPackageResponseSchema as any,
          temperature: 0.7,
        },
        timeoutMs: 30000,
        timeoutMsg: 'Gemini pinned comment package generation timed out',
      });

      model = modelUsed;

      if (!text) {
        throw new AIProviderError(
          'Gemini returned empty response for pinned comment package',
          this.providerId,
          model,
          'INVALID_REQUEST',
          false,
          502
        );
      }

      const parsedJson = JSON.parse(text);
      const validationResult = AiPinnedCommentPackageZodSchema.safeParse(parsedJson);

      if (!validationResult.success) {
        throw new AIProviderError(
          `Invalid pinned comment package schema: ${validationResult.error.message}`,
          this.providerId,
          model,
          'INVALID_REQUEST',
          false,
          502
        );
      }

      const data = validationResult.data;

      // Run safety validator on the AI output
      const safetyCheck = PinnedCommentSafetyValidator.validate(
        {
          pinnedComment: data.pinnedComment,
          answerDiscussionPrompt: data.answerDiscussionPrompt,
          followUpQuestions: data.followUpQuestions,
          audienceParticipationPrompt: data.audienceParticipationPrompt,
        },
        question
      );

      if (!safetyCheck.isValid || safetyCheck.leaksAnswer || safetyCheck.hasBannedPlaceholders) {
        throw new AIProviderError(
          `Pinned comment package failed safety validation: ${safetyCheck.issues?.join(', ') || 'Safety violation or answer leak detected'}`,
          this.providerId,
          model,
          'INVALID_REQUEST',
          false,
          422
        );
      }

      return {
        pinnedComment: data.pinnedComment,
        answerDiscussionPrompt: data.answerDiscussionPrompt,
        followUpQuestions: data.followUpQuestions,
        audienceParticipationPrompt: data.audienceParticipationPrompt,
        isAiGenerated: true,
        aiModelUsed: modelUsed || 'gemini-2.5-flash',
        notes: data.notes || 'Generated with Gemini conversational AI',
      };
    } catch (error: any) {
      if (error instanceof AIProviderError) throw error;
      const classified = classifyAIError(error);
      throw new AIProviderError(
        `Gemini pinned comment generation failed: ${classified.sanitizedMessage}`,
        this.providerId,
        model,
        classified.classification,
        false,
        classified.classification === 'QUOTA_EXHAUSTED' ? 429 : 500
      );
    }
  }
}

export const geminiService = GeminiService.getInstance();
