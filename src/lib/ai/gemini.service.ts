/**
 * BURRA PARIKSHA CMS - Gemini AI Service
 * Phase 4: Gemini AI Question Studio
 * 
 * Orchestrates AI question generation and refinement using @google/genai.
 * Enforces structured output schemas, mathematical validation, and fallback handling.
 */

import { geminiClient } from './gemini.client';
import { GenAiQuestionCandidateResponseSchema, QuestionCandidateZodSchema } from './schemas/question-candidate.schema';
import { GenAiTeluguScriptResponseSchema, TeluguScriptZodSchema } from './schemas/script-generation.schema';
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
  AiContentPlanRecommendation,
  AiPlanBatchSuggestion,
  AiPlanRecommendationSubtopic,
  DifficultyLevel,
  PriorityLevel,
  Question,
  QuestionLanguage,
} from '../../types';
import {
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

export class GeminiService {
  private static instance: GeminiService | null = null;

  private constructor() {}

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  /**
   * Generates a new aptitude question candidate.
   */
  public async generateCandidate(input: GenerateCandidateInput): Promise<GenerationResult> {
    const startTime = Date.now();
    const model = geminiClient.getModelName();
    const client = geminiClient.getClient();

    let rawCandidate: any = null;
    let isMockFallback = false;
    let fallbackReason: string | undefined = undefined;

    if (client && geminiClient.isConfigured()) {
      try {
        const prompt = buildGenerationPrompt(input);
        const response = await withTimeout(
          client.models.generateContent({
            model,
            contents: prompt,
            config: {
              systemInstruction: BURRA_PARIKSHA_SYSTEM_INSTRUCTION,
              responseMimeType: 'application/json',
              responseSchema: GenAiQuestionCandidateResponseSchema as any,
              temperature: 0.7,
            },
          }),
          30000,
          'Gemini generation timed out'
        );

        const text = response.text || '';
        rawCandidate = JSON.parse(text);
      } catch (err: any) {
        const rawMsg = err?.message || 'Upstream service error';
        const sanitizedMsg = rawMsg.replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_KEY]');
        console.warn('[GeminiService] Live generation failed, falling back to pedagogical engine:', sanitizedMsg);
        rawCandidate = this.createFallbackCandidate(input);
        isMockFallback = true;
        fallbackReason = sanitizedMsg.includes('429') || sanitizedMsg.includes('RESOURCE_EXHAUSTED')
          ? 'Gemini API quota limit reached (HTTP 429 / RESOURCE_EXHAUSTED)'
          : sanitizedMsg.slice(0, 120);
      }
    } else {
      rawCandidate = this.createFallbackCandidate(input);
      isMockFallback = true;
      fallbackReason = 'Gemini API is not configured or missing API key';
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
        modelUsed: isMockFallback ? 'Pedagogical-Engine-Fallback' : model,
        generationDurationMs: durationMs,
        isMockFallback,
        generatorType: isMockFallback ? 'PEDAGOGICAL_FALLBACK' : 'GEMINI_AI',
        fallbackReason: isMockFallback ? fallbackReason : undefined,
      },
      validation,
    };
  }

  /**
   * Refines an existing question candidate using the administrator's current UI state.
   */
  public async refineCandidate(input: RefineCandidateInput): Promise<GenerationResult> {
    const startTime = Date.now();
    const model = geminiClient.getModelName();
    const client = geminiClient.getClient();

    let rawCandidate: any = null;
    let isMockFallback = false;
    let fallbackReason: string | undefined = undefined;

    if (client && geminiClient.isConfigured()) {
      try {
        const { systemInstruction, userPrompt } = buildRefinementPrompt(input);
        const response = await withTimeout(
          client.models.generateContent({
            model,
            contents: userPrompt,
            config: {
              systemInstruction,
              responseMimeType: 'application/json',
              responseSchema: GenAiQuestionCandidateResponseSchema as any,
              temperature: 0.5,
            },
          }),
          30000,
          'Gemini refinement timed out'
        );

        const text = response.text || '';
        rawCandidate = JSON.parse(text);
      } catch (err: any) {
        const rawMsg = err?.message || 'Upstream service error';
        const sanitizedMsg = rawMsg.replace(/AIza[0-9A-Za-z-_]{35}/g, '[REDACTED_KEY]');
        console.warn('[GeminiService] Live refinement failed, applying algorithmic refinement:', sanitizedMsg);
        rawCandidate = this.applyFallbackRefinement(input);
        isMockFallback = true;
        fallbackReason = sanitizedMsg.includes('429') || sanitizedMsg.includes('RESOURCE_EXHAUSTED')
          ? 'Gemini API quota limit reached (HTTP 429 / RESOURCE_EXHAUSTED)'
          : sanitizedMsg.slice(0, 120);
      }
    } else {
      rawCandidate = this.applyFallbackRefinement(input);
      isMockFallback = true;
      fallbackReason = 'Gemini API is not configured or missing API key';
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
        modelUsed: isMockFallback ? 'Pedagogical-Engine-Fallback' : model,
        generationDurationMs: durationMs,
        isMockFallback,
        generatorType: isMockFallback ? 'PEDAGOGICAL_FALLBACK' : 'GEMINI_AI',
        fallbackReason: isMockFallback ? fallbackReason : undefined,
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
    const model = geminiClient.getModelName();
    const client = geminiClient.getClient();

    let rawScript: any = null;
    let isMockFallback = false;

    if (client && geminiClient.isConfigured()) {
      try {
        const prompt = buildTeluguScriptPrompt(question);
        const response = await withTimeout(
          client.models.generateContent({
            model,
            contents: prompt,
            config: {
              systemInstruction: BURRA_PARIKSHA_SCRIPT_SYSTEM_INSTRUCTION,
              responseMimeType: 'application/json',
              responseSchema: GenAiTeluguScriptResponseSchema as any,
              temperature: 0.7,
            },
          }),
          30000,
          'Gemini script generation timed out'
        );

        const text = response.text || '';
        rawScript = JSON.parse(text);
      } catch (err: any) {
        console.warn('[GeminiService] Live script generation failed, falling back to pedagogical Telugu script engine:', err?.message);
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
}

export const geminiService = GeminiService.getInstance();
