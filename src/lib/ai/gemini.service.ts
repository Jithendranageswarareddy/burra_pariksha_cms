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

    let rawScript: any = null;
    let fallbackUsed = false;

    if (client && geminiClient.isConfigured()) {
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
        const sanitizedMsg = (err?.message || 'Upstream service error').replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_KEY]');
        console.warn('[GeminiService] Live script generation failed, falling back to pedagogical Telugu script engine:', sanitizedMsg);
        rawScript = this.createFallbackTeluguScript(question);
        fallbackUsed = true;
      }
    } else {
      rawScript = this.createFallbackTeluguScript(question);
      fallbackUsed = true;
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
        modelUsed: fallbackUsed ? 'Pedagogical-Engine-Telugu-Fallback' : model,
        generationDurationMs: durationMs,
        fallbackUsed,
      },
      validation,
    };
  }

  /**
   * Deterministic, pedagogical conversational Telugu fallback script creator.
   * Guarantees natural spoken Telugu, 4 options formatted with Telugu identifiers (ఎ, బి, సి, డి), and interactive CTA.
   */
  private createFallbackTeluguScript(question: any): ScriptContentPayload {
    const content = question.questionText || question.content || 'ఆప్టిట్యూడ్ లెక్క';
    const optA = question.options?.a || question.option_a || 'ఆప్షన్ A';
    const optB = question.options?.b || question.option_b || 'ఆప్షన్ B';
    const optC = question.options?.c || question.option_c || 'ఆప్షన్ C';
    const optD = question.options?.d || question.option_d || 'ఆప్షన్ D';
    const correct = question.correctAnswer || question.correct_answer || 'B';
    const explanation = question.explanation || 'సరైన గణిత సూత్రం ప్రకారం లెక్కించిన సాధన.';
    const topic = question.topicName || question.taxonomy?.topicName || 'ఆప్టిట్యూడ్';
    const realWorld = question.realWorldContext || question.real_world_context || '';

    const hookText = realWorld
      ? `🔥 ${realWorld} — ఈ ${topic} ప్రశ్నను 10 సెకన్లలో సాల్వ్ చేయగలరా? 90% మంది పొరపాటు పడతారు!`
      : `⚡ ${topic} లో ఎక్కువ మంది తప్పు చేసే ప్రశ్న ఇది! 10 సెకన్లలో సరైన సమాధానం చెప్పండి చూద్దాం!`;

    const problemStatement = `ప్రశ్నను శ్రద్ధగా చూడండి:\n${content}\n\nఆప్షన్లు:\nఎ) ${optA}\nబి) ${optB}\nసి) ${optC}\nడి) ${optD}`;

    const stepByStepSolution = `సరైన సమాధానం: ఆప్షన్ (${correct})\n\nదశలవారీ సాధన:\n${explanation}`;

    const speedTrickOrTakeaway = `💡 బుర్ర ట్రిక్ (Speed Trick): పూర్తి లెక్క అవసరం లేకుండా, యూనిట్ డిజిట్ లేదా ఆప్షన్ ఎలిమినేషన్ మెథడ్ తో కేవలం 5 సెకన్లలో సరైన ఆప్షన్ (${correct}) గుర్తించవచ్చు!`;

    const callToAction = `మీరు ఏ ఆప్షన్ అనుకున్నారో ఇప్పుడే కామెంట్ చేయండి! మరిన్ని కాంపిటీటివ్ ఎగ్జామ్ షార్ట్‌కట్స్ కోసం @BurraPariksha ని ఫాలో అవ్వండి & ఈ రీల్ ని సేవ్ చేసుకోండి!`;

    return {
      hookText,
      problemStatement,
      stepByStepSolution,
      speedTrickOrTakeaway,
      callToAction,
      notes: `Conversational Telugu teleprompter script generated for ${topic}.`,
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

    let rawData: any = null;
    let fallbackUsed = false;

    // Enforce max 5 requested styles in a single bounded AI call
    const boundedStyles = requestedStyles.slice(0, 5);

    if (client && geminiClient.isConfigured()) {
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
        const sanitizedMsg = (err?.message || 'Upstream service error').replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_KEY]');
        console.warn('[GeminiService] Live social hook generation failed, falling back to pedagogical hook engine:', sanitizedMsg);
        rawData = this.createFallbackSocialHooksAndStrategy(question, boundedStyles, language);
        fallbackUsed = true;
      }
    } else {
      rawData = this.createFallbackSocialHooksAndStrategy(question, boundedStyles, language);
      fallbackUsed = true;
    }

    // Validate payload against Zod schema
    const parsed = SocialHookAndStrategyZodSchema.safeParse(rawData);
    const validData = parsed.success
      ? parsed.data
      : this.createFallbackSocialHooksAndStrategy(question, boundedStyles, language);

    const durationMs = Date.now() - startTime;

    return {
      hooks: validData.hooks,
      presentationStrategy: validData.presentationStrategy,
      metadata: {
        modelUsed: fallbackUsed ? 'Pedagogical-Engine-Hook-Fallback' : model,
        generationDurationMs: durationMs,
        fallbackUsed,
        aiCallsCount: 1, // Enforces strictly 1 AI call
      },
    };
  }

  /**
   * Deterministic pedagogical fallback for social hooks and presentation strategy.
   */
  private createFallbackSocialHooksAndStrategy(
    question: any,
    requestedStyles: HookStyle[],
    language: QuestionLanguage
  ) {
    const topic = question.topicName || question.taxonomy?.topicName || 'Quantitative Aptitude';
    const realWorld = question.realWorldContext || question.real_world_context || '';
    const presentationType = question.presentationType || 'Text';

    const hooks = requestedStyles.map((style, idx) => {
      let text = '';
      let spokenTeluguText = '';
      let onScreenOverlayText = '';

      switch (style) {
        case HookStyle.CURIOSITY:
          text = language === QuestionLanguage.TELUGU
            ? `🔥 చాలామంది పొరపాటు పడే ${topic} ప్రశ్న! సరైన సమాధానం చెప్పగలరా?`
            : `🔥 Most students fail this ${topic} challenge! Can you solve it?`;
          spokenTeluguText = `స్నేహితులారా, ${topic} లో అందరూ తప్పు చేసే ఈ సూపర్ ట్రిక్ ప్రశ్నను మీరు సాల్వ్ చేయగలరా చూద్దాం!`;
          onScreenOverlayText = `🔥 TRICKY EXAM CHALLENGE!`;
          break;

        case HookStyle.BRAIN_CHALLENGE:
          text = language === QuestionLanguage.TELUGU
            ? `🧠 మీ మైండ్ కి పదును పెట్టే ${topic} ఛాలెంజ్! ఎంత వేగంగా సాల్వ్ చేస్తారో చూద్దాం!`
            : `🧠 Brain Challenge: How fast can you solve this ${topic} problem?`;
          spokenTeluguText = `మీ మెదడుకు పదును పెట్టే బుర్ర పరీక్ష ఛాలెంజ్! ఈ ${topic} సమస్యను ఎంత వేగంగా సాధిస్తారో కామెంట్ చేయండి!`;
          onScreenOverlayText = `🧠 BRAIN CHALLENGE!`;
          break;

        case HookStyle.SPEED_CHALLENGE:
          text = language === QuestionLanguage.TELUGU
            ? `⚡ పెన్ను కాగితం లేకుండా సాల్వ్ చేసే బుర్ర ట్రిక్ తెలుసా?`
            : `⚡ Solve without pen or paper using this Burra Trick!`;
          spokenTeluguText = `పెన్ను కాగితం లేకుండా కేవలం మైండ్ తో సాల్వ్ చేసే బుర్ర ట్రిక్ ఇప్పుడు చూద్దాం!`;
          onScreenOverlayText = `⚡ SPEED TRICK!`;
          break;

        case HookStyle.REAL_WORLD:
          text = language === QuestionLanguage.TELUGU
            ? `🚀 ${realWorld || 'రియల్ వరల్డ్ ప్రాబ్లమ్'} ని ఆప్టిట్యూడ్ తో ఎలా సాల్వ్ చేయవచ్చో తెలుసా?`
            : `🚀 How ${realWorld || 'real world math'} translates into competitive exam speed!`;
          spokenTeluguText = `${realWorld || 'నిత్య జీవితంలో వాడే ఈ సూత్రాన్ని'} ఎగ్జామ్స్ లో ఎంత సులభంగా వాడొచ్చో చూడండి!`;
          onScreenOverlayText = `🚀 REAL WORLD MATH!`;
          break;

        case HookStyle.EXAM_CHALLENGE:
        default:
          text = language === QuestionLanguage.TELUGU
            ? `📚 APPSC / TSPSC ఎగ్జామ్స్ లో పదే పదే అడిగే రిపీటెడ్ క్వశ్చన్ మోడల్ ఇది!`
            : `📚 Top repeated exam question model for APPSC & TSPSC!`;
          spokenTeluguText = `కాphase కాంపిటీటివ్ ఎగ్జామ్స్ లో పదే పదే వచ్చే మోడల్ క్వశ్చన్ ఇది! మిస్ కాకుండా చూడండి!`;
          onScreenOverlayText = `📚 REPEATED EXAM MODEL!`;
          break;
      }

      return {
        id: `HOOK-${style}-${idx + 1}`,
        style,
        text,
        spokenTeluguText,
        onScreenOverlayText,
        estimatedDurationSeconds: 5,
        rationale: `Pedagogical ${style} hook designed for 30-60s vertical short video.`,
      };
    });

    const presentationStrategy = {
      visualOpening: `High-contrast vertical video layout featuring bold ${presentationType} question card with pulsing countdown timer.`,
      onScreenTitleOverlay: `BURRA PARIKSHA — ${topic.toUpperCase()} SHORTCUT`,
      questionRevealTimingMs: 1500,
      optionRevealTimingMs: 7500,
      answerRevealTimingMs: 18000,
      explanationTimingMs: 22000,
      visualEmphasisNotes: `Highlight correct option with neon green border accent; use yellow text for Burra Trick mental formula.`,
      diagramOrChartSuggestion: presentationType !== 'Text' ? `Render ${presentationType} graphic prominently in upper half of vertical canvas.` : '',
      pacingWpm: 140,
    };

    return { hooks, presentationStrategy };
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

    let rawData: any = null;
    let fallbackUsed = false;

    if (client && geminiClient.isConfigured()) {
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
        const sanitizedMsg = (err?.message || 'Upstream service error').replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_KEY]');
        console.warn('[GeminiService] Live teleprompter script generation failed, falling back to pedagogical engine:', sanitizedMsg);
        rawData = this.createFallbackTeleprompterScript(question, selectedHookText, selectedHookStyle, language, pacingWpm);
        fallbackUsed = true;
      }
    } else {
      rawData = this.createFallbackTeleprompterScript(question, selectedHookText, selectedHookStyle, language, pacingWpm);
      fallbackUsed = true;
    }

    // Validate payload against Zod schema
    const parsed = TeleprompterScriptZodSchema.safeParse(rawData);
    const validData = parsed.success
      ? parsed.data
      : this.createFallbackTeleprompterScript(question, selectedHookText, selectedHookStyle, language, pacingWpm);

    const durationMs = Date.now() - startTime;

    return {
      pacingWpm: validData.pacingWpm,
      totalEstimatedDurationSeconds: validData.totalEstimatedDurationSeconds,
      segments: validData.segments as TeleprompterSegment[],
      metadata: {
        modelUsed: fallbackUsed ? 'Pedagogical-Engine-Teleprompter-Fallback' : model,
        generationDurationMs: durationMs,
        fallbackUsed,
        aiCallsCount: 1, // Enforces strictly 1 AI call
      },
    };
  }

  /**
   * Deterministic pedagogical fallback for spoken teleprompter script.
   */
  private createFallbackTeleprompterScript(
    question: any,
    selectedHookText: string,
    selectedHookStyle: HookStyle,
    language: QuestionLanguage,
    pacingWpm: number
  ) {
    const content = question.questionText || question.content || 'ఆప్టిట్యూడ్ సమస్య';
    const optA = question.options?.a || question.option_a || '';
    const optB = question.options?.b || question.option_b || '';
    const optC = question.options?.c || question.option_c || '';
    const optD = question.options?.d || question.option_d || '';
    const correct = (question.correctAnswer || question.correct_answer || 'A').toUpperCase();
    const explanation = question.explanation || 'గణిత సూత్రం ప్రకారం సాధన.';

    const hookText = selectedHookText || `🔥 10 సెకన్లలో ఈ ఆప్టిట్యూడ్ లెక్క సాల్వ్ చేయగలరా?`;

    const segments: TeleprompterSegment[] = [
      {
        id: 'SEG-1-HOOK',
        section: TeleprompterSegmentSection.HOOK,
        spokenText: hookText,
        teleprompterText: hookText,
        estimatedDurationSeconds: 5,
        pauseDurationSeconds: 0,
        pauseAfterMs: 0,
        emphasisWords: ['సాల్వ్'],
        visualCardPrompt: 'Title card',
        onScreenText: '🔥 BURRA PARIKSHA CHALLENGE',
        onScreenOverlay: '🔥 BURRA PARIKSHA CHALLENGE',
      },
      {
        id: 'SEG-2-TRANSITION',
        section: TeleprompterSegmentSection.HOOK_TRANSITION,
        spokenText: 'రండి, అసలు క్వశ్చన్ ఏంటో చూద్దాం!',
        teleprompterText: 'రండి, అసలు క్వశ్చన్ ఏంటో చూద్దాం!',
        estimatedDurationSeconds: 3,
        pauseDurationSeconds: 0,
        pauseAfterMs: 0,
        emphasisWords: [],
        visualCardPrompt: 'Transition banner',
        onScreenText: 'రండి, క్వశ్చన్ చూద్దాం!',
        onScreenOverlay: 'రండి, క్వశ్చన్ చూద్దాం!',
      },
      {
        id: 'SEG-3-QUESTION',
        section: TeleprompterSegmentSection.QUESTION,
        spokenText: content,
        teleprompterText: content,
        estimatedDurationSeconds: 10,
        pauseDurationSeconds: 0,
        pauseAfterMs: 0,
        emphasisWords: ['మొత్తం', 'వేగం'],
        visualCardPrompt: 'Question card',
        onScreenText: content,
        onScreenOverlay: content,
      },
      {
        id: 'SEG-4-OPTIONS',
        section: TeleprompterSegmentSection.OPTIONS,
        spokenText: `ఆప్షన్స్: A) ${optA}, B) ${optB}, C) ${optC}, D) ${optD}`,
        teleprompterText: `A) ${optA}\nB) ${optB}\nC) ${optC}\nD) ${optD}`,
        estimatedDurationSeconds: 8,
        pauseDurationSeconds: 0,
        pauseAfterMs: 0,
        emphasisWords: ['A', 'B', 'C', 'D'],
        visualCardPrompt: 'Options grid',
        onScreenText: `A) ${optA}  B) ${optB}`,
        onScreenOverlay: `A) ${optA}  B) ${optB}`,
      },
      {
        id: 'SEG-5-PAUSE',
        section: TeleprompterSegmentSection.PAUSE_CHALLENGE,
        spokenText: 'వీడియో పాజ్ చేసి మీ ఆన్సర్ ఏంటో కామెంట్ చేయండి!',
        teleprompterText: 'వీడియో పాజ్ చేసి మీ ఆన్సర్ కామెంట్ చేయండి! [PAUSE 1.5s]',
        estimatedDurationSeconds: 4,
        pauseDurationSeconds: 1.5,
        pauseAfterMs: 1500,
        emphasisWords: ['పాజ్', 'కామెంట్'],
        visualCardPrompt: 'Pause prompt',
        onScreenText: '⏸️ PAUSE & COMMENT YOUR ANSWER',
        onScreenOverlay: '⏸️ PAUSE & COMMENT YOUR ANSWER',
      },
      {
        id: 'SEG-6-SOLUTION',
        section: TeleprompterSegmentSection.SOLUTION,
        spokenText: `సరైన సమాధానం ఆప్షన్ (${correct}). సాధన: ${explanation}`,
        teleprompterText: `సరైన సమాధానం: ఆప్షన్ (${correct})\n${explanation}`,
        estimatedDurationSeconds: 10,
        pauseDurationSeconds: 0,
        pauseAfterMs: 0,
        emphasisWords: [`ఆప్షన్ (${correct})`],
        visualCardPrompt: 'Solution card',
        onScreenText: `సరైన సమాధానం: (${correct})`,
        onScreenOverlay: `సరైన సమాధానం: (${correct})`,
      },
      {
        id: 'SEG-7-TRICK',
        section: TeleprompterSegmentSection.SPEED_TRICK,
        spokenText: `💡 బుర్ర ట్రిక్: పూర్తి లెక్క చేయకుండా కేవలం 5 సెకన్లలో ఆప్షన్ ఎలిమినేషన్ తో సాల్వ్ చేయవచ్చు!`,
        teleprompterText: `💡 బుర్ర ట్రిక్ (Speed Trick):\nఆప్షన్ ఎలిమినేషన్ తో 5s లో సాల్వ్ చేయండి!`,
        estimatedDurationSeconds: 5,
        pauseDurationSeconds: 0,
        pauseAfterMs: 0,
        emphasisWords: ['బుర్ర ట్రిక్', '5 సెకన్లలో'],
        visualCardPrompt: 'Trick highlight',
        onScreenText: '💡 BURRA SPEED TRICK',
        onScreenOverlay: '💡 BURRA SPEED TRICK',
      },
      {
        id: 'SEG-8-CTA',
        section: TeleprompterSegmentSection.CTA,
        spokenText: 'మరిన్ని కాంపిటీటివ్ ఎగ్జామ్ షార్ట్‌కట్స్ కోసం @BurraPariksha ని ఫాలో అవ్వండి!',
        teleprompterText: 'మరిన్ని ఎగ్జామ్ ట్రిక్స్ కోసం Subscribe & Share చేయండి!',
        estimatedDurationSeconds: 4,
        pauseDurationSeconds: 0,
        pauseAfterMs: 0,
        emphasisWords: ['Subscribe', 'Share'],
        visualCardPrompt: 'Subscribe card',
        onScreenText: 'Subscribe & Follow @BurraPariksha',
        onScreenOverlay: 'Subscribe & Follow @BurraPariksha',
      },
    ];

    const totalEstimatedDurationSeconds = segments.reduce((sum, s) => sum + s.estimatedDurationSeconds, 0);

    return {
      pacingWpm: pacingWpm || 140,
      totalEstimatedDurationSeconds,
      segments,
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

    let rawData: any = null;
    let fallbackUsed = false;
    let aiCallsCount = 1;

    if (client && geminiClient.isConfigured()) {
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
        const sanitizedMsg = (err?.message || 'Upstream service error').replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_KEY]');
        console.warn('[GeminiService] AI social metadata generation failed, falling back to deterministic metadata:', sanitizedMsg);
        rawData = this.createFallbackSocialMetadata(question, selectedHookText, language);
        fallbackUsed = true;
      }
    } else {
      rawData = this.createFallbackSocialMetadata(question, selectedHookText, language);
      fallbackUsed = true;
    }

    const parsed = SocialMetadataZodSchema.safeParse(rawData);
    const validData = parsed.success
      ? parsed.data
      : this.createFallbackSocialMetadata(question, selectedHookText, language);

    // Ensure mandatory hashtag #BurraPariksha exists in hashtags array
    if (!validData.hashtags.some((h) => h.toLowerCase() === '#burrapariksha')) {
      validData.hashtags.unshift('#BurraPariksha');
    }

    return {
      metadata: validData,
      aiCallsCount,
      metadataInfo: {
        providerId: fallbackUsed ? 'fallback' : 'gemini',
        modelId: fallbackUsed ? 'deterministic-fallback' : model,
        fallbackUsed,
      },
    };
  }

  /**
   * Phase 8E: Creates deterministic local fallback social metadata with ZERO AI calls.
   */
  public createFallbackSocialMetadata(
    question: any,
    selectedHookText?: string,
    language: QuestionLanguage = QuestionLanguage.TELUGU
  ): SocialMetadataAIResult {
    const isTelugu = language === QuestionLanguage.TELUGU;
    const topic = question.topic || 'General Aptitude';
    const subtopic = question.subtopic || 'Problem Solving';
    const challengeType = question.challengeType || 'SPEED_MATH';
    const difficulty = question.difficulty || 'MEDIUM';

    const shortTitle = isTelugu
      ? `🔥 10 సెకన్ల ఆప్టిట్యూడ్ ఛాలెంజ్!`
      : `🔥 10-Second Aptitude Challenge!`;

    const socialCaption = isTelugu
      ? `ఈ కాంపిటీటివ్ ఎగ్జామ్ క్వశ్చన్ ని మీరు ఎంత వేగంగా సాల్వ్ చేయగలరో కామెంట్ చేయండి! 👇`
      : `Can you solve this competitive exam challenge? Comment your answer below! 👇`;

    const extendedDescription = isTelugu
      ? `బుర్ర పరీక్ష షార్ట్ ఛాలెంజ్! ఈ ${topic} - ${subtopic} ప్రశ్నకు సరియైన సమాధానాన్ని కామెంట్ రూపంలో తెలపండి. పూర్తి వివరాల కోసం ఛానెల్ సబ్‌స్క్రైబ్ చేసుకోండి.`
      : `Burra Pariksha short challenge! Test your skills on ${topic} - ${subtopic}. Leave your answer in the comments and subscribe for daily practice!`;

    const topicHashtag = `#${topic.replace(/[^a-zA-Z0-9]/g, '')}`;
    const subtopicHashtag = `#${subtopic.replace(/[^a-zA-Z0-9]/g, '')}`;

    const hashtags = [
      '#BurraPariksha',
      topicHashtag !== '#' && topicHashtag.length > 1 ? topicHashtag : '#Aptitude',
      subtopicHashtag !== '#' && subtopicHashtag.length > 1 ? subtopicHashtag : '#MathTricks',
      '#CompetitiveExams',
      isTelugu ? '#TeluguExams' : '#GovernmentJobs',
      '#SpeedMath',
    ].filter((h, idx, arr) => arr.indexOf(h) === idx);

    const keywords = [
      topic,
      subtopic,
      'Aptitude',
      'Reasoning',
      'Competitive Exams',
      isTelugu ? 'తెలుగు మోడల్ పేపర్స్' : 'Exam Preparation',
      'Burra Pariksha',
    ];

    const cta = {
      primaryText: isTelugu ? 'మీ ఆన్సర్ ని కామెంట్ చేయండి! 👇' : 'Comment your answer below! 👇',
      pinnedCommentPrompt: isTelugu
        ? 'మీకు ఏ ఆప్షన్ వచ్చింది? A, B, C, or D? కామెంట్స్ లో చెప్పండి!'
        : 'Which option did you get — A, B, C, or D? Let us know below!',
    };

    return {
      shortTitle,
      socialCaption,
      extendedDescription,
      hashtags,
      keywords,
      topicLabel: topic,
      subtopicLabel: subtopic,
      difficultyLabel: difficulty,
      challengeTypeLabel: challengeType,
      cta,
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

    let rawData: any = null;
    let fallbackUsed = false;
    let aiCallsCount = 1;

    if (client && geminiClient.isConfigured()) {
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
        const sanitizedMsg = (err?.message || 'Upstream service error').replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_KEY]');
        console.warn('[GeminiService] AI platform adaptation failed, falling back:', sanitizedMsg);
        rawData = this.createFallbackPlatformAdaptation(question, canonicalMetadata, language);
        fallbackUsed = true;
      }
    } else {
      rawData = this.createFallbackPlatformAdaptation(question, canonicalMetadata, language);
      fallbackUsed = true;
    }

    const parsed = PlatformAdaptedVariantZodSchema.safeParse(rawData);
    const validData = parsed.success
      ? parsed.data
      : this.createFallbackPlatformAdaptation(question, canonicalMetadata, language);

    return {
      rawVariants: validData,
      aiCallsCount,
      info: {
        providerId: fallbackUsed ? 'fallback' : 'gemini',
        modelId: fallbackUsed ? 'deterministic-fallback' : model,
        fallbackUsed,
      },
    };
  }

  /**
   * Creates deterministic fallback multi-platform adapted variants.
   */
  public createFallbackPlatformAdaptation(
    question: any,
    canonicalMetadata: any,
    language: QuestionLanguage = QuestionLanguage.TELUGU
  ): any {
    const isTelugu = language === QuestionLanguage.TELUGU;
    const title = canonicalMetadata?.shortTitle || (isTelugu ? 'ఆప్టిట్యూడ్ ఛాలెంజ్' : 'Aptitude Challenge');
    const caption = canonicalMetadata?.socialCaption || (isTelugu ? 'జవాబు చెప్పండి' : 'Answer below');
    const description = canonicalMetadata?.extendedDescription || (isTelugu ? 'బుర్ర పరీక్ష షార్ట్ ఛాలెంజ్' : 'Burra Pariksha Short');
    const ctaText = canonicalMetadata?.cta?.primaryText || (isTelugu ? 'కామెంట్ చేయండి 👇' : 'Comment below 👇');
    const promptText = canonicalMetadata?.cta?.pinnedCommentPrompt || (isTelugu ? 'ఏ ఆప్షన్ వచ్చింది?' : 'Which option?');
    const hashtags = canonicalMetadata?.hashtags || ['#BurraPariksha', '#Aptitude'];
    const keywords = canonicalMetadata?.keywords || ['Aptitude', 'Burra Pariksha'];

    return {
      youtubeShorts: {
        title,
        description: `${description}\n\n👉 ${ctaText}\n\n#BurraPariksha`,
        hashtags: hashtags.slice(0, 5),
        keywords: keywords.slice(0, 10),
        primaryCta: ctaText,
        pinnedCommentPrompt: promptText,
      },
      instagramReels: {
        caption: `${title}\n\n${caption}\n\n👇 ${ctaText}\n💬 ${promptText}\n\n#BurraPariksha`,
        hashtags: hashtags.slice(0, 8),
        keywords: keywords.slice(0, 10),
        primaryCta: ctaText,
        commentPrompt: promptText,
      },
      facebookReels: {
        caption: `${title}\n\n${caption}\n\n👇 ${ctaText}\n\n#BurraPariksha`,
        hashtags: hashtags.slice(0, 5),
        keywords: keywords.slice(0, 10),
        primaryCta: ctaText,
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

    let rawData: any = null;
    let fallbackUsed = false;
    let aiCallsCount = 1;

    const language = question?.language || QuestionLanguage.TELUGU;

    if (client && geminiClient.isConfigured()) {
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
        const sanitizedMsg = (err?.message || 'Upstream service error').replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_KEY]');
        console.warn('[GeminiService] AI social quality assessment failed, falling back:', sanitizedMsg);
        rawData = this.createFallbackSocialQualityAssessment(question, enhancementPackage);
        fallbackUsed = true;
      }
    } else {
      rawData = this.createFallbackSocialQualityAssessment(question, enhancementPackage);
      fallbackUsed = true;
    }

    const parsed = SocialQualityAssessmentZodSchema.safeParse(rawData);
    const validData = parsed.success
      ? parsed.data
      : this.createFallbackSocialQualityAssessment(question, enhancementPackage);

    return {
      rawOutput: validData,
      aiCallsCount,
      info: {
        providerId: fallbackUsed ? 'fallback' : 'gemini',
        modelId: fallbackUsed ? 'deterministic-fallback' : model,
        fallbackUsed,
      },
    };
  }

  /**
   * Creates deterministic heuristic fallback for social quality assessment.
   */
  public createFallbackSocialQualityAssessment(
    question: any,
    enhancementPackage: any
  ): SocialQualityAssessmentAIOutput {
    const isTelugu = question?.language === QuestionLanguage.TELUGU;

    const hasHooks = enhancementPackage?.hooks && enhancementPackage.hooks.length > 0;
    const hasScript = !!enhancementPackage?.teleprompterScript;
    const hasMetadata = !!enhancementPackage?.metadata;

    const clarityScore = question?.questionText?.length > 20 ? 85 : 70;
    const curiosityScore = hasHooks ? 80 : 65;
    const challengeQualityScore = question?.options?.length === 4 ? 85 : 60;
    const commentabilityScore = hasMetadata ? 80 : 60;
    const retentionPotentialScore = hasScript ? 80 : 65;
    const realLifeRelevanceScore = 75;
    const socialPresentationScore = hasMetadata ? 85 : 60;
    const languageQualityScore = isTelugu ? 80 : 85;
    const audienceSuitabilityScore = 90;
    const repetitionRiskScore = 85;
    const audienceAppealScore = 90;

    return {
      scores: {
        clarity: clarityScore,
        curiosity: curiosityScore,
        challengeQuality: challengeQualityScore,
        commentability: commentabilityScore,
        retentionPotential: retentionPotentialScore,
        realLifeRelevance: realLifeRelevanceScore,
        socialPresentation: socialPresentationScore,
        languageQuality: languageQualityScore,
        audienceSuitability: audienceSuitabilityScore,
        repetitionRisk: repetitionRiskScore,
        audienceAppeal: audienceAppealScore,
      },
      findings: [
        {
          dimension: 'CURIOSITY',
          severity: 'ADVISORY',
          code: 'HEURISTIC_EVALUATION',
          message: 'Evaluation completed using deterministic heuristic scoring fallback.',
          context: question?.id,
          suggestedFix: 'Review hook intrigue and spoken delivery manually.',
        },
      ],
      recommendations: [
        'Ensure the hook creates a strong curiosity gap in the first 3 seconds.',
        'Include a direct prompt in the CTA inviting viewers to comment their chosen option.',
      ],
      confidence: 0.85,
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
    try {
      const prompt = buildThumbnailIntelligenceUserPrompt(question, options?.script);
      const systemInstruction = BURRA_PARIKSHA_THUMBNAIL_SYSTEM_INSTRUCTION;

      const { text } = await this.callGeminiWithRetryAndFallback({
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

      if (!text) {
        return this.createFallbackThumbnailIntelligence(question, contentId, options);
      }

      const parsedJson = JSON.parse(text);
      const validationResult = AiThumbnailIntelligenceResponseZodSchema.safeParse(parsedJson);

      if (!validationResult.success || !validationResult.data.concepts || validationResult.data.concepts.length === 0) {
        return this.createFallbackThumbnailIntelligence(question, contentId, options);
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
    } catch (error) {
      console.warn('Gemini generateThumbnailIntelligence encountered error, falling back to deterministic template:', error);
      return this.createFallbackThumbnailIntelligence(question, contentId, options);
    }
  }

  /**
   * Phase 18: Fallback Thumbnail Intelligence Generator
   * Generates deterministic, high-contrast, curiosity-optimized thumbnail concepts without external API calls.
   */
  public createFallbackThumbnailIntelligence(
    question: Question,
    contentId: string,
    options?: { script?: Script; video?: Video }
  ): AiThumbnailConcept[] {
    const now = new Date().toISOString();
    const contentNum = contentId.replace(/^BP-CNT-/, '');

    const topicLabel = question.topicName || 'Mathematics';

    const conceptA: AiThumbnailConcept = {
      id: `BP-TC-${contentNum}-A`,
      contentId,
      questionId: question.id,
      scriptId: options?.script?.id,
      videoId: options?.video?.id,
      conceptName: 'Concept A - High Stakes Ego Trap',
      hookHeadline: '99% WRONG! 🔥 Try in 10s?',
      curiosityFraming: {
        curiosityAngle: 'Immediate ego verification challenging fast mathematical intuition',
        psychologicalTrigger: 'Ego challenge, pride, and intellectual urgency',
        hypothesis: 'Viewers pause scrolling to prove they belong to the top 1% who can calculate without error',
      },
      visualDirection: {
        composition: 'Bold split-screen: prominent puzzle equation on top, presenter with curious questioning pose below',
        colorPalette: ['#0B192C', '#FF6500', '#FFFFFF', '#FFD700'],
        focalPoint: 'High-contrast question hook text in signature yellow on midnight blue background',
        emotionOrExpression: 'Intense, challenging eyebrow raise pointing towards the question statement',
        brandingElements: 'Burra Pariksha official badge top-left corner, vibrant red 10-second timer icon',
      },
      audienceTargeting: {
        primaryAudience: 'AP & TS SI/Constable/DSC/RRB Competitive Exam Aspirants',
        secondaryAudience: 'General Telugu social media users who love brain riddles',
        languageStyle: 'BILINGUAL',
        difficultyPerception: 'LOOKS_EASY_BUT_HARD',
      },
      abVariant: 'A',
      isAiGenerated: true,
      notes: `Deterministic concept variant A generated for ${topicLabel}`,
      createdAt: now,
    };

    const conceptB: AiThumbnailConcept = {
      id: `BP-TC-${contentNum}-B`,
      contentId,
      questionId: question.id,
      scriptId: options?.script?.id,
      videoId: options?.video?.id,
      conceptName: 'Concept B - Hidden Logic Shortcut',
      hookHeadline: 'SPEED METHOD in 5s! ⚡',
      curiosityFraming: {
        curiosityAngle: 'Unveiling a hidden calculation shortcut that traditional schooling overlooks',
        psychologicalTrigger: 'Exclusive knowledge discovery and FOMO',
        hypothesis: 'Students click to discover the speed-hack before competing test-takers do',
      },
      visualDirection: {
        composition: 'Clean center-stage equation with a bright crimson warning circle on the tricky step',
        colorPalette: ['#1E201E', '#3EC70B', '#F1F1F1', '#FF1E56'],
        focalPoint: 'Highlighted mathematical trap with glowing lightning icon',
        emotionOrExpression: 'Smiling, confident knowing look holding a smart shortcut cue card',
        brandingElements: 'Burra Pariksha logo watermark top-right, clean high-contrast title banner',
      },
      audienceTargeting: {
        primaryAudience: 'Speed-math students and competitive aspirants seeking calculation shortcuts',
        secondaryAudience: 'Parents and educators interested in fast mathematical pedagogy',
        languageStyle: 'BILINGUAL',
        difficultyPerception: 'FAST_TRICK',
      },
      abVariant: 'B',
      isAiGenerated: true,
      notes: `Deterministic concept variant B generated for ${topicLabel}`,
      createdAt: now,
    };

    return [conceptA, conceptB];
  }

  /**
   * Phase 19: Generate AI Pinned Comment & Conversation Intelligence Package
   * Generates structured pinned comment, discussion prompt, follow-up challenge questions, and audience engagement prompt.
   * If real Gemini succeeds: isAiGenerated = true, aiModelUsed = model.
   * If Gemini fails/unavailable: falls back to deterministic template with isAiGenerated = false, aiModelUsed = 'deterministic-fallback'.
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

      if (!text) {
        return this.createFallbackPinnedCommentPackage(question, contentId, options);
      }

      const parsedJson = JSON.parse(text);
      const validationResult = AiPinnedCommentPackageZodSchema.safeParse(parsedJson);

      if (!validationResult.success) {
        return this.createFallbackPinnedCommentPackage(question, contentId, options);
      }

      const data = validationResult.data;

      // Run safety validator on the AI output; if issues or answer leakage detected, sanitize or fallback
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
        return this.createFallbackPinnedCommentPackage(question, contentId, options);
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
    } catch (error) {
      console.warn('Gemini generatePinnedCommentPackage encountered error, falling back to deterministic template:', error);
      return this.createFallbackPinnedCommentPackage(question, contentId, options);
    }
  }

  /**
   * Phase 19: Fallback Pinned Comment Package Generator
   * Generates deterministic, high-engagement pinned comment package without external API calls.
   * Clearly identified as isAiGenerated: false, aiModelUsed: 'deterministic-fallback'.
   */
  public createFallbackPinnedCommentPackage(
    question: Question,
    contentId: string,
    options?: { script?: Script; video?: Video; approvedScriptVersion?: number }
  ): {
    pinnedComment: string;
    answerDiscussionPrompt: string;
    followUpQuestions: string[];
    audienceParticipationPrompt: string;
    isAiGenerated: boolean;
    aiModelUsed: string;
    notes?: string;
  } {
    const topicLabel = question.topicName || 'Mathematics';
    const subtopicLabel = question.subtopicName || 'Logical Reasoning';
    const cleanQ = (question.questionText || question.question || 'this brain teaser').trim();

    const pinnedComment = `🧠 **BURRA PARIKSHA CHALLENGE — ${topicLabel.toUpperCase()}** 🧠\n\n` +
      `Question: "${cleanQ}"\n\n` +
      `A) ${question.optionA || 'Option A'}\n` +
      `B) ${question.optionB || 'Option B'}\n` +
      `C) ${question.optionC || 'Option C'}\n` +
      `D) ${question.optionD || 'Option D'}\n\n` +
      `👇 **DO NOT SCROLL DOWN TILL YOU TRY!**\n` +
      `1️⃣ Pause the video & calculate.\n` +
      `2️⃣ Comment your option and how many seconds it took.\n` +
      `3️⃣ Read the full step-by-step logic in the replies below! ✨`;

    const answerDiscussionPrompt = `Which calculation method did you use first — did you test Option A, eliminate Option D, or use the direct formula? Explain your logic!`;

    const followUpQuestions = [
      `Level 2 Twist: If the values in this question were doubled, which option would be correct?`,
      `Mental Math Challenge: Can you solve this same problem without writing anything on paper in under 7 seconds?`
    ];

    const audienceParticipationPrompt = `Comment "BURRA CRACKED 🔥" if you solved this before the 10-second timer ended! Tag a friend preparing for AP/TS SI or DSC exams.`;

    return {
      pinnedComment,
      answerDiscussionPrompt,
      followUpQuestions,
      audienceParticipationPrompt,
      isAiGenerated: false,
      aiModelUsed: 'deterministic-fallback',
      notes: `Deterministic engagement package generated for ${topicLabel} (${subtopicLabel})`,
    };
  }
}

export const geminiService = GeminiService.getInstance();
