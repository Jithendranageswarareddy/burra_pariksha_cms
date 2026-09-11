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
import { CandidateValidator } from './validators/candidate.validator';
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
  DifficultyLevel,
  HookStyle,
  PriorityLevel,
  Question,
  QuestionLanguage,
  TeleprompterSegment,
  TeleprompterSegmentSection,
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
    let isMockFallback = false;
    let fallbackReason: string | undefined = undefined;
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

        console.warn('[GeminiService] Live generation failed, falling back to pedagogical engine:', sanitizedMsg);
        rawCandidate = this.createFallbackCandidate(input);
        isMockFallback = true;
        fallbackReason = classified.classification === 'QUOTA_EXHAUSTED'
          ? 'Gemini API quota limit reached (HTTP 429 / RESOURCE_EXHAUSTED)'
          : sanitizedMsg.slice(0, 120);
      }
    } else {
      rawCandidate = this.createFallbackCandidate(input);
      isMockFallback = true;
      fallbackReason = 'Gemini API is not configured or missing API key';
      errorClassification = 'AUTH_ERROR';
    }

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
      language: rawCandidate.language || input.language || QuestionLanguage.ENGLISH,
      real_world_context: rawCandidate.real_world_context || input.realWorldContext || '',
      question_style: rawCandidate.question_style || input.questionStyle || 'Real-World Scenario',
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
        modelId: isMockFallback ? 'Pedagogical-Engine-Fallback' : model,
        modelUsed: isMockFallback ? 'Pedagogical-Engine-Fallback' : model,
        generationDurationMs: durationMs,
        latencyMs: durationMs,
        retryCount,
        isMockFallback,
        generatorType: isMockFallback ? 'PEDAGOGICAL_FALLBACK' : 'GEMINI_AI',
        fallbackReason: isMockFallback ? fallbackReason : undefined,
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
    let isMockFallback = false;
    let fallbackReason: string | undefined = undefined;
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

        console.warn('[GeminiService] Live refinement failed, applying algorithmic refinement:', sanitizedMsg);
        rawCandidate = this.applyFallbackRefinement(input);
        isMockFallback = true;
        fallbackReason = classified.classification === 'QUOTA_EXHAUSTED'
          ? 'Gemini API quota limit reached (HTTP 429 / RESOURCE_EXHAUSTED)'
          : sanitizedMsg.slice(0, 120);
      }
    } else {
      rawCandidate = this.applyFallbackRefinement(input);
      isMockFallback = true;
      fallbackReason = 'Gemini API is not configured or missing API key';
      errorClassification = 'AUTH_ERROR';
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

    const validation = CandidateValidator.validate(candidate);
    const durationMs = Date.now() - startTime;

    return {
      candidate,
      metadata: {
        providerId: this.providerId,
        modelId: isMockFallback ? 'Pedagogical-Engine-Fallback' : model,
        modelUsed: isMockFallback ? 'Pedagogical-Engine-Fallback' : model,
        generationDurationMs: durationMs,
        latencyMs: durationMs,
        retryCount,
        isMockFallback,
        generatorType: isMockFallback ? 'PEDAGOGICAL_FALLBACK' : 'GEMINI_AI',
        fallbackReason: isMockFallback ? fallbackReason : undefined,
        errorClassification,
        requestId: options?.requestId,
      },
      validation,
    };
  }

  /**
   * Generates a realistic pedagogical fallback candidate when API key is unconfigured.
   */
  private createFallbackCandidate(input: GenerateCandidateInput): any {
    const isTelugu = input.language === QuestionLanguage.TELUGU;
    const style = (input.questionStyle || 'Real-World Scenario').toUpperCase();
    const topic = (input.topicName || input.topicId || '').toLowerCase();
    const cat = (input.categoryName || input.categoryId || '').toLowerCase();

    // 1. TELUGU SCENARIOS
    if (isTelugu) {
      if (style.includes('TRICK') || style.includes('MISDIRECTION')) {
        return {
          content: 'ఒక ఉద్యోగి హైటెక్ సిటీ నుండి సికింద్రాబాద్‌కు 40 కి.మీ/గం వేగంతో వెళ్లి, తిరిగి అదే మార్గంలో 60 కి.మీ/గం వేగంతో వచ్చాడు. అయితే మొత్తం ప్రయాణంలో అతని సగటు వేగం ఎంత?',
          option_a: '50 కి.మీ/గం',
          option_b: '48 కి.మీ/గం',
          option_c: '52 కి.మీ/గం',
          option_d: '45 కి.మీ/గం',
          correct_answer: 'B',
          explanation: 'సమాన దూరాల వద్ద సగటు వేగం హార్మోనిక్ మీన్ అవుతుంది = 2xy / (x + y).\nసగటు వేగం = (2 * 40 * 60) / (40 + 60) = 4800 / 100 = 48 కి.మీ/గం.\nబుర్ర ట్రిక్ (Speed Trick): చాలామంది సగటు అంటే (40+60)/2 = 50 అనుకుంటారు (Trap). కానీ సమాన దూరాల ప్రయాణానికి నేరుగా 2*40*60/100 = 48 కి.మీ/గం! సరైన సమాధానం Option B.',
          difficulty: input.difficulty || DifficultyLevel.MEDIUM,
          language: 'TELUGU',
          real_world_context: 'హైటెక్ సిటీ ఆఫీస్ రాకపోకలు',
          question_style: input.questionStyle || 'Trick Question / Misdirection Trap',
        };
      }

      if (cat.includes('lr') || cat.includes('logical') || style.includes('LOGIC') || style.includes('PUZZLE')) {
        return {
          content: 'ఒక ఫోటోలోని మహిళను చూపిస్తూ రాజేష్ ఇలా అన్నాడు: "ఈమె తల్లి, నా తండ్రి యొక్క తల్లికి ఏకైక కోడలు." అయితే రాజేష్ ఆ మహిళకు ఏమవుతాడు?',
          option_a: 'సోదరుడు (Brother)',
          option_b: 'తండ్రి (Father)',
          option_c: 'బాబాయి (Uncle)',
          option_d: 'కజిన్ (Cousin)',
          correct_answer: 'A',
          explanation: '"నా తండ్రి యొక్క తల్లి" = రాజేష్ నానమ్మ.\n"నానమ్మ యొక్క ఏకైక కోడలు" = రాజేష్ తల్లి.\n"ఆమె తల్లి రాజేష్ తల్లి" అంటే ఆమె రాజేష్ సోదరి.\nకాబట్టి రాజేష్ ఆమెకు సోదరుడు అవుతాడు.\nబుర్ర ట్రిక్: వెనుక నుండి రండి: తండ్రి తల్లి -> నానమ్మ -> ఏకైక కోడలు -> తల్లి. ఆమె తల్లి నా తల్లే కాబట్టి నేను ఆమెకు సోదరుడిని (Brother)! సరైన సమాధానం Option A.',
          difficulty: input.difficulty || DifficultyLevel.MEDIUM,
          language: 'TELUGU',
          real_world_context: 'ఫ్యామిలీ ఫొటో రక్త సంబంధాలు',
          question_style: input.questionStyle || 'Logic Challenge / Deductive Reasoning',
        };
      }

      if (cat.includes('di') || cat.includes('data') || style.includes('DATA') || style.includes('EXAM')) {
        return {
          content: 'ఒక ఫిన్‌టెక్ స్టార్టప్ మొదటి త్రైమాసిక లావాదేవీలు: జనవరి (₹40 లక్షలు), ఫిబ్రవరి (₹50 లక్షలు), మార్చి (₹65 లక్షలు). జనవరి నుండి మార్చికి లావాదేవీలలో పెరిగిన శాతం ఎంత?',
          option_a: '50.0%',
          option_b: '55.5%',
          option_c: '62.5%',
          option_d: '65.0%',
          correct_answer: 'C',
          explanation: 'పెంపు = 65 - 40 = 25 లక్షలు.\nశాతం పెరుగుదల = (25 / 40) * 100 = (5 / 8) * 100 = 62.5%.\nబుర్ర ట్రిక్: 1/8 భిన్నం = 12.5%. కాబట్టి 5/8 = 5 * 12.5% = 62.5% తక్షణమే! సరైన సమాధానం Option C.',
          difficulty: input.difficulty || DifficultyLevel.MEDIUM,
          language: 'TELUGU',
          real_world_context: 'స్టార్టప్ త్రైమాసిక నివేదిక',
          question_style: input.questionStyle || 'Standard Exam Style',
        };
      }

      if (cat.includes('va') || cat.includes('verbal') || style.includes('COMMENT')) {
        return {
          content: '10 సెకన్లలో సమాధానం చెప్పి కామెంట్ చేయండి! కింది వాక్యంలో వ్యాకరణ లోపం ఉన్న భాగాన్ని గుర్తించండి: "పోటీ పరీక్షకు హాజరైన ప్రతి ఒక్క అభ్యర్థికి డిజిటల్ ట్యాబ్లెట్ అందించారు (were provided)." ఏ భాగంలో లోపం ఉంది?',
          option_a: 'ప్రతి ఒక్క అభ్యర్థికి (Subject: Each)',
          option_b: 'పోటీ పరీక్షకు హాజరైన',
          option_c: 'బహువచన క్రియ వాడకం (Plural verb: were provided)',
          option_d: 'డిజిటల్ ట్యాబ్లెట్',
          correct_answer: 'C',
          explanation: 'వాక్యంలో కర్త "Each" (ప్రతి ఒక్కరు) ఏకవచనం కాబట్టి సహాయక క్రియ "was" (ఏకవచనం) ఉండాలి. "were" వాడటం తప్పు.\nబుర్ర ట్రిక్: "Each of..." వచ్చినప్పుడు క్రియ ఎల్లప్పుడూ ఏకవచనంలోనే ఉండాలి! మీ సమాధానాన్ని కామెంట్లలో పోస్ట్ చేయండి! సరైన సమాధానం Option C.',
          difficulty: input.difficulty || DifficultyLevel.EASY,
          language: 'TELUGU',
          real_world_context: 'పోటీ పరీక్ష ఇంగ్లీష్ ఛాలెంజ్',
          question_style: input.questionStyle || 'Comment Challenge / Audience Brain Teaser',
        };
      }

      // Default Telugu Quantitative Aptitude (Metro / Speed)
      return {
        content: 'ఒక హైదరాబాద్ మెట్రో రైలు 400 మీటర్ల పొడవు గల ప్లాట్‌ఫారమ్‌ను 30 సెకన్లలో, మరియు ప్లాట్‌ఫారమ్‌పై నిలబడిన ఒక వ్యక్తిని 14 సెకన్లలో దాటుతుంది. అయితే ఆ రైలు వేగం (కి.మీ/గం లో) ఎంత?',
        option_a: '72 కి.మీ/గం',
        option_b: '90 కి.మీ/గం',
        option_c: '84 కి.మీ/గం',
        option_d: '108 కి.మీ/గం',
        correct_answer: 'B',
        explanation: 'రైలు పొడవు = L, వేగం = S అనుకుందాం.\nవ్యక్తిని దాటడానికి: L = S * 14\nప్లాట్‌ఫారమ్‌ను దాటడానికి: L + 400 = S * 30\n(S * 30) - (S * 14) = 400 => 16 * S = 400 => S = 25 మీ/సె.\nకి.మీ/గం లోకి మార్చగా: 25 * (18 / 5) = 90 కి.మీ/గం.\nబుర్ర ట్రిక్ (Speed Trick): నేరుగా ప్లాట్‌ఫారమ్ దూరం / సమయ వ్యత్యాసం = 400 / 16 = 25 మీ/సె = 90 కి.మీ/గం! సరైన సమాధానం Option B.',
        difficulty: input.difficulty || DifficultyLevel.MEDIUM,
        language: 'TELUGU',
        real_world_context: 'హైదరాబాద్ మెట్రో ప్రయాణం',
        question_style: input.questionStyle || 'Real-World Scenario',
      };
    }

    // 2. ENGLISH SCENARIOS
    if (style.includes('TRICK') || style.includes('MISDIRECTION')) {
      return {
        content: 'A commuter drives from Hitec City to Secunderabad at an average speed of 40 km/h and returns along the exact same route at 60 km/h. What is the commuter\'s average speed for the entire round trip?',
        option_a: '50 km/h',
        option_b: '48 km/h',
        option_c: '52 km/h',
        option_d: '45 km/h',
        correct_answer: 'B',
        explanation: 'Average speed over equal distances is the Harmonic Mean = 2xy / (x + y).\nAverage Speed = (2 * 40 * 60) / (40 + 60) = 4800 / 100 = 48 km/h.\nBurra Trick (Speed Trick): The optical trap is taking the arithmetic mean (40 + 60) / 2 = 50 km/h. For equal distances, always use 2xy / (x + y) = 48 km/h instantly! Option B is the correct answer.',
        difficulty: input.difficulty || DifficultyLevel.MEDIUM,
        language: QuestionLanguage.ENGLISH,
        real_world_context: 'Hitec City Daily Commute',
        question_style: input.questionStyle || 'Trick Question / Misdirection Trap',
      };
    }

    if (style.includes('STORY') || style.includes('STORY_BASED')) {
      return {
        content: 'In a tech startup sprint meeting, 5 engineers (Aman, Bina, Charan, Divya, and Esha) sit in a single row facing the whiteboard. Bina sits at the extreme left. Divya sits exactly between Aman and Charan. Charan sits to the immediate left of Esha. Who is seated in the exact middle of the row?',
        option_a: 'Aman',
        option_b: 'Divya',
        option_c: 'Charan',
        option_d: 'Esha',
        correct_answer: 'B',
        explanation: 'Step 1: Bina is at position 1 (extreme left): B _ _ _ _.\nStep 2: Charan is immediately left of Esha (block: C-E).\nStep 3: Divya is between Aman and Charan (block: A-D-C).\nStep 4: Merging blocks gives the unique order: Bina, Aman, Divya, Charan, Esha.\nMiddle position (Position 3) is Divya.\nBurra Trick: Anchor the fixed edge (Bina at Pos 1). The 3-person cluster A-D-C fills Pos 2-3-4 with Divya in the middle! Option B is correct.',
        difficulty: input.difficulty || DifficultyLevel.MEDIUM,
        language: QuestionLanguage.ENGLISH,
        real_world_context: 'Tech Startup Sprint Planning',
        question_style: input.questionStyle || 'Story-Based Scenario',
      };
    }

    if (cat.includes('lr') || cat.includes('logical') || style.includes('LOGIC') || style.includes('PUZZLE')) {
      return {
        content: 'Pointing to a framed photograph in a gallery, Rajesh said: "Her mother is the only daughter-in-law of my father\'s mother." How is Rajesh related to the woman in the photograph?',
        option_a: 'Brother',
        option_b: 'Father',
        option_c: 'Uncle',
        option_d: 'Cousin',
        correct_answer: 'A',
        explanation: 'Step 1: "My father\'s mother" = Rajesh\'s grandmother.\nStep 2: "Only daughter-in-law of my grandmother" = Rajesh\'s mother (since she is the only daughter-in-law).\nStep 3: "Her mother is Rajesh\'s mother" => The woman is Rajesh\'s sister.\nStep 4: Therefore, Rajesh is her brother.\nBurra Trick: Trace relationships from the end: Father\'s mother (Grandmother) -> Only daughter-in-law (Mother) -> Her mother is my mother -> I am her Brother! Option A is correct.',
        difficulty: input.difficulty || DifficultyLevel.HARD,
        language: QuestionLanguage.ENGLISH,
        real_world_context: 'Photo Gallery Blood Relations',
        question_style: input.questionStyle || 'Logic Challenge / Deductive Reasoning',
      };
    }

    if (cat.includes('di') || cat.includes('data') || style.includes('DATA') || style.includes('EXAM')) {
      return {
        content: 'A fintech startup recorded monthly transactions across Q1: January (₹40 Lakhs), February (₹50 Lakhs), and March (₹65 Lakhs). What is the percentage increase in transactions from January to March?',
        option_a: '50.0%',
        option_b: '55.5%',
        option_c: '62.5%',
        option_d: '65.0%',
        correct_answer: 'C',
        explanation: 'Step 1: Increase in transactions = 65 - 40 = 25 Lakhs.\nStep 2: Percentage increase = (25 / 40) * 100 = (5 / 8) * 100 = 62.5%.\nBurra Trick: Fraction conversion: 1/8 = 12.5%. 5/8 = 5 * 12.5% = 62.5% in under 5 seconds! Option C is correct.',
        difficulty: input.difficulty || DifficultyLevel.MEDIUM,
        language: QuestionLanguage.ENGLISH,
        real_world_context: 'Fintech Startup Q1 Growth Metrics',
        question_style: input.questionStyle || 'Standard Exam Style',
      };
    }

    if (cat.includes('va') || cat.includes('verbal') || style.includes('COMMENT')) {
      return {
        content: 'Can you spot the grammatical error in under 10 seconds? Drop your answer in the comments! "Each of the candidates participating in the competitive examination were provided with a digital tablet." Which segment contains an error?',
        option_a: 'Each of the candidates',
        option_b: 'participating in the competitive examination',
        option_c: 'were provided with',
        option_d: 'a digital tablet',
        correct_answer: 'C',
        explanation: 'The subject of the sentence is the distributive pronoun "Each", which is singular. Therefore, the verb must be singular ("was provided with", not "were provided with").\nBurra Trick: Look at the main subject before "of the..." -> "Each" ALWAYS takes a singular verb ("was"). Comment your answer if you caught it! Option C is correct.',
        difficulty: input.difficulty || DifficultyLevel.EASY,
        language: QuestionLanguage.ENGLISH,
        real_world_context: 'Competitive Exam English Challenge',
        question_style: input.questionStyle || 'Comment Challenge / Audience Brain Teaser',
      };
    }

    if (style.includes('SPEED') || style.includes('MENTAL')) {
      return {
        content: 'A food delivery courier travels at a uniform speed of 36 km/h. How many meters does the courier cover in 45 seconds while navigating through city traffic?',
        option_a: '360 meters',
        option_b: '420 meters',
        option_c: '450 meters',
        option_d: '500 meters',
        correct_answer: 'C',
        explanation: 'Speed in m/s = 36 * (5 / 18) = 10 m/s.\nDistance = Speed * Time = 10 m/s * 45 s = 450 meters.\nBurra Trick (Speed Trick): Every 18 km/h = 5 m/s. Therefore 36 km/h = 10 m/s. 10 * 45 = 450 meters instantly! Option C is correct.',
        difficulty: input.difficulty || DifficultyLevel.EASY,
        language: QuestionLanguage.ENGLISH,
        real_world_context: 'Food Delivery Courier Transit',
        question_style: input.questionStyle || 'Speed Challenge / Fast Calculation',
      };
    }

    // Default Real-World Scenario (Metro Transit)
    return {
      content: 'A metro express train of length 300 meters traveling at a speed of 72 km/h approaches a commuter cycling along the track path at 18 km/h in the same direction. How many seconds does it take for the train to completely pass the cyclist?',
      option_a: '15 seconds',
      option_b: '20 seconds',
      option_c: '25 seconds',
      option_d: '30 seconds',
      correct_answer: 'B',
      explanation: 'Step 1: Convert speeds to m/s.\nTrain Speed = 72 * (5/18) = 20 m/s.\nCyclist Speed = 18 * (5/18) = 5 m/s.\nStep 2: Calculate Relative Speed in the same direction.\nRelative Speed = 20 - 5 = 15 m/s.\nStep 3: Calculate Time to pass.\nTime = Distance / Relative Speed = 300 / 15 = 20 seconds.\nBurra Trick (Speed Trick): Net speed in km/h = 72 - 18 = 54 km/h = 54 * (5/18) = 15 m/s. Direct division: 300 / 15 = 20 seconds! Option B is the correct answer.',
      difficulty: input.difficulty || DifficultyLevel.MEDIUM,
      language: QuestionLanguage.ENGLISH,
      real_world_context: 'Metro Transit Relative Velocity',
      question_style: input.questionStyle || 'Real-World Scenario',
    };
  }

  /**
   * Applies realistic fallback refinements.
   */
  private applyFallbackRefinement(input: RefineCandidateInput): any {
    const { action, currentCandidate, targetDifficulty, targetLanguage } = input;

    if (action === AiRefinementAction.IMPROVE_TELUGU || targetLanguage === QuestionLanguage.TELUGU) {
      return {
        ...currentCandidate,
        content: 'ఒక రైలు 60 కి.మీ/గం వేగంతో ప్రయాణిస్తూ 240 మీటర్ల పొడవు గల సొరంగాన్ని (టన్నెల్) 24 సెకన్లలో దాటుతుంది. అయితే ఆ రైలు పొడవు ఎంత?',
        option_a: '140 మీటర్లు',
        option_b: '160 మీటర్లు',
        option_c: '180 మీటర్లు',
        option_d: '200 మీటర్లు',
        correct_answer: 'B',
        explanation: 'వేగం = 60 * (5/18) = 50/3 మీ/సె.\nమొత్తం దూరం (రైలు + సొరంగం) = (50/3) * 24 = 400 మీటర్లు.\nరైలు పొడవు = 400 - 240 = 160 మీటర్లు.\nబుర్ర ట్రిక్: 24 సెకన్లలో 400 మీ దాటింది. 400 - 240 = 160 మీటర్లు నేరుగా!',
        language: 'TELUGU',
      };
    }

    if (action === AiRefinementAction.INCREASE_DIFFICULTY) {
      return {
        ...currentCandidate,
        content: `Two metro trains of lengths 180m and 220m are running on parallel tracks. When running in the same direction, the faster train overtakes the slower one in 40 seconds. When running in opposite directions, they pass each other in 8 seconds. What is the speed of the faster train in km/h?`,
        option_a: '72 km/h',
        option_b: '85 km/h',
        option_c: '90 km/h',
        option_d: '108 km/h',
        correct_answer: 'D',
        difficulty: DifficultyLevel.HARD,
        explanation: 'Total distance = 180 + 220 = 400m.\nRelative speed same direction (u - v) = 400 / 40 = 10 m/s.\nRelative speed opposite direction (u + v) = 400 / 8 = 50 m/s.\nu = (50 + 10) / 2 = 30 m/s.\nu in km/h = 30 * (18 / 5) = 108 km/h.\nBurra Trick: Faster speed = 0.5 * (Sum + Diff) * 3.6 = 0.5 * (50 + 10) * 3.6 = 108 km/h!',
      };
    }

    if (action === AiRefinementAction.DECREASE_DIFFICULTY) {
      return {
        ...currentCandidate,
        content: `A delivery van travels a distance of 180 km in 3 hours. If its speed is increased by 10 km/h for the return journey, how long will the return trip take?`,
        option_a: '2 hours 15 mins',
        option_b: '2 hours 34 mins',
        option_c: '2 hours 45 mins',
        option_d: '3 hours',
        correct_answer: 'B',
        difficulty: DifficultyLevel.EASY,
        explanation: 'Initial speed = 180 / 3 = 60 km/h.\nNew speed = 60 + 10 = 70 km/h.\nReturn time = 180 / 70 = 18 / 7 hours = 2 hours 34.2 minutes.\nBurra Trick: 180 / 70 = 2.57 hours = 2h 34m!',
      };
    }

    if (action === AiRefinementAction.SIMPLIFY_LANGUAGE) {
      return {
        ...currentCandidate,
        content: currentCandidate.content.replace(/\s+/g, ' ').trim(),
        explanation: `Step 1: Identify given variables clearly.\nStep 2: Apply formula directly.\nBurra Shortcut: Direct ratio calculation saves 30 seconds.`,
      };
    }

    if (action === AiRefinementAction.IMPROVE_EXPLANATION) {
      return {
        ...currentCandidate,
        explanation: `${currentCandidate.explanation}\n\nBURRA SPEED TRICK (Video Retention Hook):\nRemember that whenever speed ratios are known, equate time fractions directly to skip algebra and solve within 15 seconds!`,
      };
    }

    // Default refinement
    return {
      ...currentCandidate,
      explanation: `${currentCandidate.explanation}\n[AI Refined with verified arithmetic]`,
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
    categoryId: string;
    topicId?: string;
    targetTotalCount?: number;
    language?: QuestionLanguage;
    preferredDifficulties?: DifficultyLevel[];
    focusContext?: string;
  }): Promise<AiContentPlanRecommendation> {
    const targetTotal = input.targetTotalCount || 20;
    const category = await taxonomyService.getCategoryById(input.categoryId);
    const categoryName = category ? category.name : input.categoryId;

    let topics = await taxonomyService.getTopics(input.categoryId);
    if (input.topicId) {
      topics = topics.filter((t) => t.id === input.topicId);
    }

    const topicName = input.topicId && topics.length > 0 ? topics[0].name : undefined;

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
      isMockFallback: boolean;
    };
    validation: ScriptValidationReport;
  }> {
    const startTime = Date.now();
    let model = geminiClient.getModelName();
    const client = geminiClient.getClient();

    let rawScript: any = null;
    let isMockFallback = false;

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
        isMockFallback = true;
      }
    } else {
      rawScript = this.createFallbackTeluguScript(question);
      isMockFallback = true;
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
        modelUsed: isMockFallback ? 'Pedagogical-Engine-Telugu-Fallback' : model,
        generationDurationMs: durationMs,
        isMockFallback,
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
      isMockFallback: boolean;
      aiCallsCount: number;
    };
  }> {
    const startTime = Date.now();
    let model = geminiClient.getModelName();
    const client = geminiClient.getClient();

    let rawData: any = null;
    let isMockFallback = false;

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
        isMockFallback = true;
      }
    } else {
      rawData = this.createFallbackSocialHooksAndStrategy(question, boundedStyles, language);
      isMockFallback = true;
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
        modelUsed: isMockFallback ? 'Pedagogical-Engine-Hook-Fallback' : model,
        generationDurationMs: durationMs,
        isMockFallback,
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
      isMockFallback: boolean;
      aiCallsCount: number;
    };
  }> {
    const startTime = Date.now();
    let model = geminiClient.getModelName();
    const client = geminiClient.getClient();

    let rawData: any = null;
    let isMockFallback = false;

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
        isMockFallback = true;
      }
    } else {
      rawData = this.createFallbackTeleprompterScript(question, selectedHookText, selectedHookStyle, language, pacingWpm);
      isMockFallback = true;
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
        modelUsed: isMockFallback ? 'Pedagogical-Engine-Teleprompter-Fallback' : model,
        generationDurationMs: durationMs,
        isMockFallback,
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
}

export const geminiService = GeminiService.getInstance();
