/**
 * BURRA PARIKSHA CMS — Question Generation Domain Service
 * Feature Slice: Question Generation (Stage 01)
 *
 * Owns Question Generation domain behavior, validation, generation orchestration,
 * draft persistence, and explicit submission to Stage 02 verification.
 *
 * Critical Invariants Enforced:
 * 1. Cloud Firestore (question_drafts) is the authoritative datastore.
 * 2. Save Draft != Verify: Saving a draft only persists working state in status DRAFT.
 * 3. Submit for Verification is an explicit command requiring a saved, valid draft.
 * 4. Human-in-the-Loop (AP-009): AI generation is strictly advisory.
 * 5. Two-Tier Taxonomy: Topic -> Subtopic validation is strictly enforced.
 */

import {
  DifficultyLevel,
  QuestionDraft,
  QuestionStatus,
  QuestionLanguage,
  UserRole,
  canonicalIdService,
  ContentProductionMode,
  validateProductionModeConfig,
  WorkflowStepNumber,
  recalculateQuestionBatchState,
  validateQuestionQuality,
} from '../../../shared';
import {
  GenerateCandidateInput,
  GenerationResult,
  QuestionGenerationOptions,
  RefineCandidateInput,
  SaveQuestionDraftInput,
  StudioCandidate,
  SubmitForVerificationInput,
  SubmitForVerificationResult,
  QuestionBatchAssembly,
  QuestionBatchRejectedItem,
  QuestionBatchSlot,
  QuestionQualityIssue,
  QuestionQualityValidationOptions,
  QuestionQualityValidationResult,
} from '../../../shared/contracts/question-generation';
import { questionDraftsRepository } from '../../../database/firestore/repositories/question-drafts.repository';
import { taxonomyService } from '../taxonomy/services/taxonomy.service';
import { aiOrchestrator } from '../../ai/orchestrator';
import { auditService } from '../../infrastructure/audit/services/audit.service';
import { questionService } from '../../features/question-generation/services/question.service';
import { type AdministrativeOverrideContext, resolveBrownfieldRole } from '../../../src/types/rbac-models';
import { CanonicalRbacRole } from '../../../shared';
import { AIOrchestrator, OrchestratorOptions } from '../../ai/orchestrator';
import { AIProviderError } from '../../ai/errors';

export class QuestionGenerationDomainError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode = 400, code = 'QUESTION_GENERATION_DOMAIN_ERROR') {
    super(message);
    this.name = 'QuestionGenerationDomainError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Explicit documented compatibility path for historical/legacy brownfield draft identifiers.
 */
export function isLegacyDraftId(id: string): boolean {
  return /^BP-DFT-\d+$/i.test(id);
}

export function validateGenerationResult(
  result: GenerationResult,
  input: GenerateCandidateInput
): { isValid: boolean; error?: string } {
  const supportedModes = [
    'QUESTION_CHALLENGE_SHORT',
    'TOPIC_INTRODUCTION',
    'EXPLAINED_QUESTIONS_VIDEO',
  ];
  if (!input.productionMode || !supportedModes.includes(input.productionMode)) {
    return { isValid: false, error: 'The AI provider request has an unsupported production mode.' };
  }

  const metadata = result?.metadata as any;
  if (
    !metadata ||
    typeof metadata.modelUsed !== 'string' ||
    metadata.modelUsed.trim().length === 0 ||
    typeof metadata.generationDurationMs !== 'number' ||
    !Number.isFinite(metadata.generationDurationMs) ||
    metadata.generationDurationMs < 0
  ) {
    return { isValid: false, error: 'The AI provider returned incomplete generation metadata.' };
  }

  const candidate = result?.candidate as any;
  if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
    return { isValid: false, error: 'The AI provider returned an invalid candidate.' };
  }

  const content = typeof candidate.content === 'string' ? candidate.content.trim() : '';
  if (!content) {
    return { isValid: false, error: 'The AI provider returned empty candidate content.' };
  }

  if (input.productionMode === 'QUESTION_CHALLENGE_SHORT') {
    const optionKeys = ['option_a', 'option_b', 'option_c', 'option_d'];
    const options = optionKeys.map((key) => candidate[key]);
    if (options.some((value) => typeof value !== 'string' || value.trim().length === 0)) {
      return { isValid: false, error: 'The AI provider returned incomplete question options.' };
    }
    if (new Set(options.map((value) => value.trim())).size !== 4) {
      return { isValid: false, error: 'The AI provider returned duplicate question options.' };
    }
    if (!['A', 'B', 'C', 'D'].includes(candidate.correct_answer)) {
      return { isValid: false, error: 'The AI provider returned an invalid answer key.' };
    }
    if (typeof candidate.explanation !== 'string' || candidate.explanation.trim().length === 0) {
      return { isValid: false, error: 'The AI provider returned an empty explanation.' };
    }
  } else if (input.productionMode === 'TOPIC_INTRODUCTION') {
    if (content.length < 15) {
      return { isValid: false, error: 'The AI provider returned an incomplete topic introduction.' };
    }
  } else if (input.productionMode === 'EXPLAINED_QUESTIONS_VIDEO') {
    if (content.length < 15) {
      return { isValid: false, error: 'The AI provider returned an incomplete explained-questions overview.' };
    }

    const targetCount = input.targetQuestionCount;
    const questions = candidate.questions;
    if (
      !Array.isArray(questions) ||
      ![5, 10, 15, 20].includes(targetCount || 0) ||
      questions.length !== targetCount
    ) {
      return { isValid: false, error: 'The AI provider returned an incomplete explained-questions collection.' };
    }

    for (let index = 0; index < questions.length; index += 1) {
      const question = questions[index];
      const options = question?.options;
      const optionValues = [options?.a, options?.b, options?.c, options?.d];
      if (
        !question ||
        typeof question.questionNumber !== 'number' ||
        question.questionNumber !== index + 1 ||
        typeof question.questionText !== 'string' ||
        question.questionText.trim().length === 0 ||
        optionValues.some((value) => typeof value !== 'string' || value.trim().length === 0) ||
        new Set(optionValues.map((value) => value.trim())).size !== 4 ||
        !['A', 'B', 'C', 'D'].includes(question.correctAnswer) ||
        typeof question.explanation !== 'string' ||
        question.explanation.trim().length === 0
      ) {
        return {
          isValid: false,
          error: `The AI provider returned an invalid explained question at position ${index + 1}.`,
        };
      }
    }
  }

  return { isValid: true };
}

function readBatchCandidate(candidate: any) {
  return {
    questionText: String(candidate?.questionText || candidate?.content || candidate?.question || '').trim(),
    options: {
      a: String(candidate?.options?.a || candidate?.option_a || candidate?.optionA || '').trim(),
      b: String(candidate?.options?.b || candidate?.option_b || candidate?.optionB || '').trim(),
      c: String(candidate?.options?.c || candidate?.option_c || candidate?.optionC || '').trim(),
      d: String(candidate?.options?.d || candidate?.option_d || candidate?.optionD || '').trim(),
    },
    correctAnswer: ['A', 'B', 'C', 'D'].includes(candidate?.correctAnswer || candidate?.correct_answer)
      ? (candidate.correctAnswer || candidate.correct_answer)
      : '',
    explanation: String(candidate?.explanation || '').trim(),
  };
}

function validateBatchCandidate(candidate: any): string[] {
  const value = readBatchCandidate(candidate);
  const errors: string[] = [];
  if (value.questionText.length < 5) errors.push('Question text must contain at least 5 characters.');
  const options = Object.values(value.options);
  if (options.some((option) => option.length === 0)) errors.push('Exactly four non-empty options are required.');
  if (new Set(options.map((option) => option.toLowerCase())).size !== 4) errors.push('Options must be distinct.');
  if (!value.correctAnswer) errors.push('Correct answer must be A, B, C, or D.');
  if (value.explanation.length < 5) errors.push('Explanation must contain at least 5 characters.');
  if (/(TODO|N\/A|\{\{|\}\})/i.test(`${value.questionText} ${options.join(' ')} ${value.explanation}`)) {
    errors.push('Placeholder content is not allowed.');
  }
  return errors;
}

/**
 * Assembles provider candidates into the approved Mode 1 aggregate shape.
 * This function intentionally does not invoke a provider or persist directly.
 */
export function assembleQuestionBatch(
  requestedCount: 5 | 10 | 15 | 20,
  candidates: any[],
  existingSlots: QuestionBatchSlot[] = []
): QuestionBatchAssembly {
  const slots: QuestionBatchSlot[] = Array.from({ length: requestedCount }, (_, index) => {
    const previous = existingSlots.find((slot) => slot.slotNumber === index + 1);
    return previous || {
      slotNumber: index + 1,
      slotId: canonicalIdService.generateCanonicalId('slt_'),
      status: 'EMPTY' as const,
      questionText: '',
      options: { a: '', b: '', c: '', d: '' },
      correctAnswer: '' as const,
      explanation: '',
      isManuallyEdited: false,
      validationErrors: [],
      revisionNumber: 0,
    };
  });
  const rejectedItems: QuestionBatchRejectedItem[] = [];
  const seen = new Set(
    slots
      .filter((slot) => slot.status !== 'EMPTY')
      .map((slot) => `${slot.questionText.toLowerCase()}|${Object.values(slot.options).join('|').toLowerCase()}`)
  );
  let overflowCount = 0;

  candidates.forEach((candidate, candidateIndex) => {
    const value = readBatchCandidate(candidate);
    const errors = validateBatchCandidate(candidate);
    const signature = `${value.questionText.toLowerCase()}|${Object.values(value.options).join('|').toLowerCase()}`;
    const target = slots.find((slot) =>
      !slot.isManuallyEdited && slot.status !== 'ACCEPTED' && (slot.status === 'EMPTY' || slot.status === 'INVALID')
    );
    if (!target || seen.has(signature)) {
      if (!target && errors.length === 0 && !seen.has(signature)) overflowCount += 1;
      else rejectedItems.push({ candidateIndex, reason: 'Duplicate candidate.' });
      return;
    }
    if (errors.length > 0) {
      rejectedItems.push({ candidateIndex, reason: errors.join(' ') });
      return;
    }
    seen.add(signature);
    target.status = 'VALID';
    target.questionText = value.questionText;
    target.options = value.options;
    target.correctAnswer = value.correctAnswer as 'A' | 'B' | 'C' | 'D';
    target.explanation = value.explanation;
    target.validationErrors = [];
    target.revisionNumber += 1;
  });

  const persistedValidCount = slots.filter((slot) =>
    slot.status === 'VALID' || slot.status === 'MANUALLY_EDITED' || slot.status === 'ACCEPTED'
  ).length;
  const batchStatus = persistedValidCount === requestedCount
    ? 'COMPLETE'
    : persistedValidCount > 0
      ? 'PARTIAL'
      : candidates.length > 0
        ? 'FAILED'
        : 'EMPTY';
  return {
    requestedCount,
    inMemoryValidCount: persistedValidCount,
    persistedValidCount,
    rejectedCount: rejectedItems.length,
    overflowCount,
    batchStatus,
    slots,
    rejectedItems,
  };
}

export class QuestionGenerationService {
  private static instance: QuestionGenerationService | null = null;
  private draftToCanonicalMap = new Map<string, string>();

  private constructor() {}

  public static getInstance(): QuestionGenerationService {
    if (!QuestionGenerationService.instance) {
      QuestionGenerationService.instance = new QuestionGenerationService();
    }
    return QuestionGenerationService.instance;
  }

  /**
   * Loads the authoritative generation options from taxonomy and system configurations.
   */
  public async loadGenerationOptions(): Promise<QuestionGenerationOptions> {
    let topicTree: any[] = [];
    try {
      topicTree = await taxonomyService.getTaxonomyTree();
    } catch {
      topicTree = [];
    }

    const topics: Array<{ id: string; name: string }> = [];
    const subtopics: Array<{ id: string; name: string; topicId: string }> = [];

    if (topicTree && topicTree.length > 0) {
      for (const top of topicTree) {
        topics.push({ id: top.id, name: top.name });
        for (const sub of top.subtopics || []) {
          subtopics.push({ id: sub.id, name: sub.name, topicId: top.id });
        }
      }
    } else {
      // Fallback to canonical production taxonomy
      const { PRODUCTION_TOPICS, PRODUCTION_SUBTOPICS } = await import('../../../src/lib/data/production-taxonomy');
      for (const top of PRODUCTION_TOPICS) {
        topics.push({ id: top.id, name: top.name });
      }
      for (const sub of PRODUCTION_SUBTOPICS) {
        subtopics.push({ id: sub.id, name: sub.name, topicId: sub.topicId });
      }
    }

    return {
      topics,
      subtopics,
      difficultyLevels: [
        DifficultyLevel.EASY,
        DifficultyLevel.MEDIUM,
        DifficultyLevel.HARD,
      ],
      languages: [
        'TELUGU' as any,
        'ENGLISH' as any,
      ],
      questionStyles: [
        'STORY_BASED',
        'REAL_WORLD_APPLICATION',
        'CONCEPTUAL_ANALYSIS',
        'SPEED_MATH',
        'LOGICAL_PUZZLE',
      ],
      contextSuggestions: [
        'Metro escalator commuter rush hour',
        'UPI festive shopping cashback',
        'Cricket run-rate chase in last 5 overs',
        'E-commerce delivery courier speed',
        'Monthly salary savings vs inflation',
        'Train overtaking on parallel tracks',
        'Water tank leakage & dual pump refill',
      ],
    };
  }

  /**
   * Resolves a topic against the authoritative taxonomy with fallback to canonical production seeds.
   */
  public async resolveTaxonomyTopic(topicId: string): Promise<{ id: string; name: string } | null> {
    if (!topicId || typeof topicId !== 'string') return null;
    try {
      const top = await taxonomyService.getTopicById(topicId);
      if (top) return { id: top.id, name: top.name };
    } catch {
      // Fallback below
    }

    const { PRODUCTION_TOPICS } = await import('../../../src/lib/data/production-taxonomy');
    const fallback = (PRODUCTION_TOPICS as any[]).find((t) => t.id === topicId);
    if (fallback) return { id: fallback.id, name: fallback.name };

    return null;
  }

  /**
   * Resolves a subtopic against the authoritative taxonomy with fallback to canonical production seeds.
   */
  public async resolveTaxonomySubtopic(subtopicId: string): Promise<{ id: string; name: string; topicId: string } | null> {
    if (!subtopicId || typeof subtopicId !== 'string') return null;
    try {
      const sub = await taxonomyService.getSubtopicById(subtopicId);
      if (sub) return { id: sub.id, name: sub.name, topicId: sub.topicId };
    } catch {
      // Fallback below
    }

    const { PRODUCTION_SUBTOPICS } = await import('../../../src/lib/data/production-taxonomy');
    const fallback = (PRODUCTION_SUBTOPICS as any[]).find((s) => s.id === subtopicId);
    if (fallback) return { id: fallback.id, name: fallback.name, topicId: fallback.topicId };

    return null;
  }

  /**
   * Validates a candidate generation request against taxonomy and structural constraints.
   */
  public async validateGenerationRequest(input: GenerateCandidateInput): Promise<{ isValid: boolean; error?: string }> {
    if (!input.topicId || typeof input.topicId !== 'string') {
      return { isValid: false, error: 'A valid topicId is required for question generation.' };
    }

    const topic = await this.resolveTaxonomyTopic(input.topicId);
    if (!topic) {
      return { isValid: false, error: `Topic with ID "${input.topicId}" does not exist in authoritative taxonomy.` };
    }

    // Subtopic validation (unless random mode)
    const isRandomMode =
      input.generationMode === 'RANDOM' ||
      input.subtopicId === 'RANDOM' ||
      input.subtopicId === 'SUB-GEN';

    if (!isRandomMode) {
      if (!input.subtopicId) {
        return { isValid: false, error: 'A valid subtopicId is required for non-random question generation.' };
      }
      const subtopic = await this.resolveTaxonomySubtopic(input.subtopicId);
      if (!subtopic) {
        return { isValid: false, error: `Subtopic with ID "${input.subtopicId}" does not exist in authoritative taxonomy.` };
      }
      if (subtopic.topicId !== input.topicId) {
        return {
          isValid: false,
          error: `Subtopic "${input.subtopicId}" does not belong to Topic "${input.topicId}".`,
        };
      }
    }

    // Mode-specific configuration validation (S9-T08)
    const mode = input.productionMode as ContentProductionMode | undefined;
    if (mode) {
      const allowedModes: ContentProductionMode[] = [
        'QUESTION_CHALLENGE_SHORT',
        'TOPIC_INTRODUCTION',
        'EXPLAINED_QUESTIONS_VIDEO',
      ];
      if (!allowedModes.includes(mode)) {
        return { isValid: false, error: `Invalid production mode: '${mode}'.` };
      }

      const count = input.targetQuestionCount !== undefined
        ? input.targetQuestionCount
        : (input.questionCount !== undefined
            ? input.questionCount
            : (mode === 'TOPIC_INTRODUCTION' ? 0 : (mode === 'EXPLAINED_QUESTIONS_VIDEO' ? 10 : 1)));
      const aspect = (input.aspectRatio as '9:16' | '16:9') || (mode === 'EXPLAINED_QUESTIONS_VIDEO' ? '16:9' : '9:16');

      const modeValidation = validateProductionModeConfig(mode, count, aspect);
      if (!modeValidation.isValid) {
        return { isValid: false, error: modeValidation.error || 'Invalid mode configuration.' };
      }

      if (mode === 'QUESTION_CHALLENGE_SHORT') {
        const validLangs = ['TELUGU', 'ENGLISH', 'TELUGU_ENGLISH'];
        if (!input.language) {
          return { isValid: false, error: 'Language is required for Question Challenge Short.' };
        }
        if (!validLangs.includes(String(input.language).toUpperCase())) {
          return { isValid: false, error: `Invalid language '${input.language}' for Question Challenge Short.` };
        }
        const validDifficulties = ['EASY', 'MEDIUM', 'HARD', 'BASIC', 'INTERMEDIATE', 'ADVANCED'];
        if (!input.difficulty) {
          return { isValid: false, error: 'Difficulty is required for Question Challenge Short.' };
        }
        if (!validDifficulties.includes(String(input.difficulty).toUpperCase())) {
          return { isValid: false, error: `Invalid difficulty '${input.difficulty}' for Question Challenge Short.` };
        }
      }
    }

    return { isValid: true };
  }

  /**
   * Generates a batch of candidates for Mode 1 (QUESTION_CHALLENGE_SHORT) with bounded retries.
   * Dispatches provider requests, buffers candidates, handles duplicates and shortfalls,
   * preserves accepted and manually edited slots, and returns an assembled QuestionBatchAssembly.
   */
  public async generateBatch(
    input: GenerateCandidateInput,
    options?: OrchestratorOptions,
    orchestrator: Pick<AIOrchestrator, 'generateQuestionCandidate'> = aiOrchestrator
  ): Promise<GenerationResult> {
    const requestedCount = (input.targetQuestionCount || 5) as 5 | 10 | 15 | 20;
    const existingSlots = input.existingSlots || [];

    // Identify preserved slots (accepted or manually edited)
    const preservedSlots = existingSlots.filter(
      (slot) => slot.isManuallyEdited || slot.status === 'ACCEPTED'
    );
    const slotsNeeded = Math.max(0, requestedCount - preservedSlots.length);

    const collectedCandidates: any[] = [];
    let shortfallRetriesRemaining = 1; // At most 1 shortfall retry round
    let invalidityRetriesRemaining = 2; // At most 2 slot-invalidity retries
    const singleInput: GenerateCandidateInput = {
      ...input,
      targetQuestionCount: 1,
      questionCount: 1,
    };

    let totalDurationMs = 0;
    let modelUsed = 'gemini-1.5-pro';
    let promptTokensUsed = 0;
    let completionTokensUsed = 0;

    const dispatchBatchCalls = async (count: number) => {
      if (count <= 0) return;
      const promises = Array.from({ length: count }, () =>
        orchestrator.generateQuestionCandidate(singleInput, options)
      );
      const settled = await Promise.allSettled(promises);
      for (const res of settled) {
        if (res.status === 'fulfilled' && res.value?.candidate) {
          const val = res.value;
          collectedCandidates.push(val.candidate);
          if (val.metadata?.modelUsed || (val.metadata as any)?.modelId) {
            modelUsed = val.metadata.modelUsed || (val.metadata as any).modelId;
          }
          if (typeof val.metadata?.generationDurationMs === 'number') {
            totalDurationMs += val.metadata.generationDurationMs;
          }
          if (typeof (val.metadata as any)?.promptTokensUsed === 'number') {
            promptTokensUsed += (val.metadata as any).promptTokensUsed;
          }
          if (typeof (val.metadata as any)?.completionTokensUsed === 'number') {
            completionTokensUsed += (val.metadata as any).completionTokensUsed;
          }
        }
      }
    };

    const startBatchTime = Date.now();
    await dispatchBatchCalls(slotsNeeded);

    let assembly = assembleQuestionBatch(requestedCount, collectedCandidates, existingSlots);

    // Shortfall retry (at most 1 automated retry round)
    const currentValid = assembly.slots.filter(
      (s) => s.status === 'VALID' || s.status === 'MANUALLY_EDITED' || s.status === 'ACCEPTED'
    ).length;
    const shortfall = requestedCount - currentValid;
    if (shortfall > 0 && shortfallRetriesRemaining > 0) {
      shortfallRetriesRemaining--;
      await dispatchBatchCalls(shortfall);
      assembly = assembleQuestionBatch(requestedCount, collectedCandidates, existingSlots);
    }

    // Invalidity retry (at most 2 automated retry rounds)
    while (invalidityRetriesRemaining > 0) {
      const unfilledOrInvalid = assembly.slots.filter(
        (s) => !s.isManuallyEdited && s.status !== 'ACCEPTED' && (s.status === 'EMPTY' || s.status === 'INVALID')
      ).length;
      if (unfilledOrInvalid <= 0 || assembly.rejectedItems.length === 0) {
        break;
      }
      invalidityRetriesRemaining--;
      await dispatchBatchCalls(Math.min(unfilledOrInvalid, 5));
      assembly = assembleQuestionBatch(requestedCount, collectedCandidates, existingSlots);
    }

    if (totalDurationMs === 0) {
      totalDurationMs = Date.now() - startBatchTime;
    }

    const firstValidSlot = assembly.slots.find(
      (s) => s.status === 'VALID' || s.status === 'MANUALLY_EDITED' || s.status === 'ACCEPTED'
    ) || assembly.slots[0];

    const primaryCandidate: any = {
      content: firstValidSlot?.questionText || '',
      questionText: firstValidSlot?.questionText || '',
      option_a: firstValidSlot?.options?.a || '',
      option_b: firstValidSlot?.options?.b || '',
      option_c: firstValidSlot?.options?.c || '',
      option_d: firstValidSlot?.options?.d || '',
      correct_answer: firstValidSlot?.correctAnswer || 'A',
      explanation: firstValidSlot?.explanation || '',
      real_world_context: input.realWorldContext || input.realLifeContext || '',
      difficulty: input.difficulty || 'Intermediate',
      language: input.language || 'TELUGU',
      productionMode: 'QUESTION_CHALLENGE_SHORT',
      targetQuestionCount: requestedCount,
      aspectRatio: '9:16',
    };

    return {
      candidate: primaryCandidate,
      candidates: assembly.slots.map((s) => ({
        content: s.questionText,
        questionText: s.questionText,
        option_a: s.options?.a || '',
        option_b: s.options?.b || '',
        option_c: s.options?.c || '',
        option_d: s.options?.d || '',
        correct_answer: (s.correctAnswer as any) || 'A',
        explanation: s.explanation,
        difficulty: (input.difficulty as any) || 'Intermediate',
        language: (input.language as any) || QuestionLanguage.TELUGU,
        slotNumber: s.slotNumber,
        slotId: s.slotId,
        status: s.status,
      })),
      batchAssembly: assembly,
      metadata: {
        modelUsed,
        generationDurationMs: totalDurationMs,
        promptTokens: promptTokensUsed,
        outputTokens: completionTokensUsed,
      },
    };
  }

  /**
   * Orchestrates advisory AI question candidate generation.
   * AI output is strictly advisory and requires human review.
   */
  public async generateCandidate(
    input: GenerateCandidateInput,
    options?: OrchestratorOptions,
    orchestrator: Pick<AIOrchestrator, 'generateQuestionCandidate'> = aiOrchestrator
  ): Promise<GenerationResult> {
    const validation = await this.validateGenerationRequest(input);
    if (!validation.isValid) {
      throw new QuestionGenerationDomainError(validation.error || 'Invalid generation request parameters.');
    }

    const isMode1Batch =
      (input.productionMode === 'QUESTION_CHALLENGE_SHORT' || !input.productionMode) &&
      input.targetQuestionCount !== undefined &&
      input.targetQuestionCount > 1 &&
      [5, 10, 15, 20].includes(input.targetQuestionCount);

    if (isMode1Batch) {
      return this.generateBatch(input, options, orchestrator);
    }

    const maxRetries = Math.min(Math.max(options?.maxRetries ?? 2, 0), 2);
    let attempt = 0;

    while (true) {
      try {
        // Delegate to server-side AI orchestrator (AP-009 Human-in-the-Loop).
        const result = await orchestrator.generateQuestionCandidate(input, options);
        const resultValidation = validateGenerationResult(result as GenerationResult, input);
        if (!resultValidation.isValid) {
          throw new QuestionGenerationDomainError(
            resultValidation.error || 'The AI provider returned an invalid candidate.',
            502,
            'INVALID_PROVIDER_OUTPUT'
          );
        }

        const candidateObj = (result as GenerationResult).candidate as any;
        if (input.productionMode === 'TOPIC_INTRODUCTION') {
          if (!candidateObj.introductoryConcept) {
            candidateObj.introductoryConcept = candidateObj.content || candidateObj.questionText || '';
          }
          if (!candidateObj.conceptTitle && input.conceptTitle) {
            candidateObj.conceptTitle = input.conceptTitle;
          }
          candidateObj.questions = [];
        } else if (input.productionMode === 'EXPLAINED_QUESTIONS_VIDEO') {
          if (!candidateObj.introductoryConcept) {
            candidateObj.introductoryConcept = candidateObj.content || candidateObj.questionText || '';
          }
          if (!Array.isArray(candidateObj.questions)) {
            candidateObj.questions = [];
          }
        }

        return result as GenerationResult;
      } catch (err) {
        if (
          err instanceof AIProviderError &&
          (err.classification === 'TIMEOUT' || err.classification === 'TRANSIENT_ERROR') &&
          attempt < maxRetries
        ) {
          attempt += 1;
          continue;
        }
        if (err instanceof QuestionGenerationDomainError) {
          throw err;
        }
        throw new QuestionGenerationDomainError(
          'Question generation is temporarily unavailable. Please try again.',
          503,
          'AI_GENERATION_UNAVAILABLE'
        );
      }
    }
  }

  /**
   * Orchestrates candidate refinement using advisory AI.
   */
  public async refineCandidate(input: RefineCandidateInput): Promise<GenerationResult> {
    if (!input.currentCandidate || !input.currentCandidate.content) {
      throw new QuestionGenerationDomainError('Current candidate content is required for refinement.');
    }
    const result = await aiOrchestrator.refineQuestionCandidate(input);
    return result as GenerationResult;
  }

  /**
   * Authoritative deterministic validation for a candidate in memory, batch assembly, or draft payload.
   * Leverages canonical validateQuestionQuality (S9-T04 / S9-T12).
   */
  public validateCandidate(
    candidate: Partial<StudioCandidate>,
    options?: QuestionQualityValidationOptions
  ): { isValid: boolean; errors: string[]; qualityReport?: QuestionQualityValidationResult } {
    const result = validateQuestionQuality(candidate, options);
    return {
      isValid: result.isValid,
      errors: result.errorMessages,
      qualityReport: result,
    };
  }

  /**
   * Saves a question candidate as a draft.
   *
   * CRITICAL INVARIANT: SAVE DRAFT IS NOT VERIFY.
   * - Persists only to question_drafts collection.
   * - Sets contentStatus = DRAFT.
   * - Sets workflowStage = QUESTION_STUDIO.
   * - Does NOT create a permanent Question document.
   * - Does NOT advance workflow to Stage 02.
   * - Does NOT invoke verification gates.
   */
  public async saveDraft(
    input: SaveQuestionDraftInput,
    actor: { id: string; name: string } = { id: 'USR-001', name: 'Author' }
  ): Promise<QuestionDraft> {
    const mode = input.productionMode as ContentProductionMode | undefined;
    if (mode) {
      const count = input.targetQuestionCount !== undefined
        ? input.targetQuestionCount
        : (mode === 'TOPIC_INTRODUCTION' ? 0 : (mode === 'EXPLAINED_QUESTIONS_VIDEO' ? 5 : 1));
      const aspect = (input.aspectRatio as '9:16' | '16:9') || (mode === 'EXPLAINED_QUESTIONS_VIDEO' ? '16:9' : '9:16');
      const modeValidation = validateProductionModeConfig(mode, count, aspect);
      if (!modeValidation.isValid) {
        throw new QuestionGenerationDomainError(modeValidation.error || 'Invalid production mode configuration.', 400);
      }
    }

    const rawText = (input.questionText || input.question || input.introductoryConcept || '').trim();
    if (!rawText) {
      throw new QuestionGenerationDomainError(
        mode === 'TOPIC_INTRODUCTION'
          ? 'Introductory concept statement cannot be empty when saving draft.'
          : 'Question statement cannot be empty when saving draft.',
        400
      );
    }

    if (!input.topicId || typeof input.topicId !== 'string') {
      throw new QuestionGenerationDomainError('A valid topicId is required when saving draft.', 400);
    }

    const topic = await this.resolveTaxonomyTopic(input.topicId);
    if (!topic) {
      throw new QuestionGenerationDomainError(`Topic with ID "${input.topicId}" does not exist in authoritative taxonomy.`, 400);
    }

    const isRandomSubtopic =
      input.subtopicId === 'RANDOM' ||
      input.subtopicId === 'SUB-GEN' ||
      input.generationMode === 'RANDOM';

    if (!isRandomSubtopic) {
      if (!input.subtopicId || typeof input.subtopicId !== 'string') {
        throw new QuestionGenerationDomainError('A valid subtopicId is required when saving draft.', 400);
      }
      const subtopic = await this.resolveTaxonomySubtopic(input.subtopicId);
      if (!subtopic) {
        throw new QuestionGenerationDomainError(`Subtopic with ID "${input.subtopicId}" does not exist in authoritative taxonomy.`, 400);
      }
      if (subtopic.topicId !== input.topicId) {
        throw new QuestionGenerationDomainError(
          `Subtopic "${input.subtopicId}" does not belong to Topic "${input.topicId}".`,
          400
        );
      }
    }

    const firstInputQ = input.questions && input.questions.length > 0 ? input.questions[0] : null;
    const optA = (input.options?.a || input.optionA || firstInputQ?.options?.a || firstInputQ?.optionA || '').trim();
    const optB = (input.options?.b || input.optionB || firstInputQ?.options?.b || firstInputQ?.optionB || '').trim();
    const optC = (input.options?.c || input.optionC || firstInputQ?.options?.c || firstInputQ?.optionC || '').trim();
    const optD = (input.options?.d || input.optionD || firstInputQ?.options?.d || firstInputQ?.optionD || '').trim();

    if (input.id) {
      const trimmedId = input.id.trim();
      if (!canonicalIdService.validateCanonicalId(trimmedId, 'dft_') && !isLegacyDraftId(trimmedId)) {
        throw new QuestionGenerationDomainError(`Invalid draft ID "${trimmedId}". Expected canonical draft ID format (dft_<uuid_v4>).`, 400);
      }
    }

    const draftId = input.id && typeof input.id === 'string' && input.id.trim()
      ? input.id.trim()
      : canonicalIdService.generateDraftId();

    const now = new Date().toISOString();

    const resolvedExplanation = (input.explanation || '').trim() ||
      (firstInputQ?.explanation || '').trim() ||
      (input.introductoryConcept || '').trim();
    const batchCount = input.targetQuestionCount as 5 | 10 | 15 | 20;
    const persistedBatchState =
      input.productionMode === 'QUESTION_CHALLENGE_SHORT' &&
      [5, 10, 15, 20].includes(batchCount) &&
      Array.isArray(input.slots)
        ? recalculateQuestionBatchState(
            batchCount,
            input.slots,
            input.rejectedItems || [],
            input.overflowCount || 0
          )
        : null;

    const draft: QuestionDraft = {
      id: draftId,
      topicId: input.topicId,
      topicName: input.topicName || topic?.name,
      subtopicId: input.subtopicId,
      subtopicName: input.subtopicName || (subtopic as any)?.name,
      difficulty: input.difficulty || 'Intermediate',
      language: input.language || 'TELUGU',
      questionText: rawText,
      question: rawText,
      options: {
        a: optA,
        b: optB,
        c: optC,
        d: optD,
      },
      optionA: optA,
      optionB: optB,
      optionC: optC,
      optionD: optD,
      correctAnswer: (input.correctAnswer as any) || (firstInputQ?.correctAnswer) || (mode === 'TOPIC_INTRODUCTION' ? '' : 'A'),
      explanation: resolvedExplanation,
      realWorldContext: input.realLifeContext || input.realWorldContext,
      realLifeContext: input.realLifeContext || input.realWorldContext,
      challengeType: input.challengeType || 'ABCD',
      presentationType: input.presentationType ? (input.presentationType === 'Text' ? 'TEXT_ONLY' : input.presentationType) : 'TEXT_ONLY',
      questionStyle: (input.questionStyle as any) || 'STORY_BASED',
      generationMode: (input.generationMode as any) || 'SUBTOPIC',
      tags: input.tags || ['Aptitude', 'Draft'],
      productionMode: input.productionMode,
      targetQuestionCount: input.targetQuestionCount,
      aspectRatio: input.aspectRatio,
      introductoryConcept: input.introductoryConcept || (mode === 'TOPIC_INTRODUCTION' ? rawText : undefined),
      conceptTitle: input.conceptTitle,
      syllabusScopeNotes: input.syllabusScopeNotes,
      questions: input.questions || [],
      batchStatus: persistedBatchState?.batchStatus || input.batchStatus,
      persistedValidCount: persistedBatchState?.persistedValidCount ?? input.persistedValidCount,
      rejectedCount: persistedBatchState?.rejectedCount ?? input.rejectedCount,
      overflowCount: persistedBatchState?.overflowCount ?? input.overflowCount,
      slots: input.slots,
      rejectedItems: input.rejectedItems,
      source: input.source || 'AI Question Studio',
      sourceModel: input.sourceModel,
      generationLatencyMs: input.generationLatencyMs,
      isFallback: input.isFallback,
      mathematicalVerification: input.mathematicalVerification,
      authorId: actor.id,
      authorName: actor.name,
      author: actor.name,
      workflowStage: 'QUESTION_STUDIO',
      status: QuestionStatus.DRAFT,
      createdAt: now,
      updatedAt: now,
    };

    const existing = await questionDraftsRepository.findById(draftId);
    if (existing) {
      if (
        existing.status === 'SUBMITTED_FOR_REVIEW' ||
        existing.status === QuestionStatus.APPROVED ||
        existing.status === 'APPROVED' ||
        existing.status === 'PUBLISHED' ||
        existing.workflowStage === 'STAGE_02_VERIFICATION'
      ) {
        throw new QuestionGenerationDomainError(
          `Draft "${draftId}" is in status "${existing.status}" / stage "${existing.workflowStage}" and cannot be modified.`,
          409,
          'DRAFT_LOCKED'
        );
      }

      if (existing.authorId && actor.id && existing.authorId !== actor.id) {
        const { resolveBrownfieldRole } = await import('../../../src/types/rbac-models');
        const actorRole = (actor as any).role ? resolveBrownfieldRole((actor as any).role) : null;
        const actorRoles = (((actor as any).roles || []) as string[]).map((r: any) => resolveBrownfieldRole(r));
        const isAdmin =
          actorRole === CanonicalRbacRole.ADMIN ||
          actorRoles.includes(CanonicalRbacRole.ADMIN) ||
          actorRole === CanonicalRbacRole.CONTENT_LEAD ||
          actorRoles.includes(CanonicalRbacRole.CONTENT_LEAD);
        if (!isAdmin) {
          const forbiddenErr = new Error(`Unauthorized: User "${actor.id}" cannot modify draft authored by "${existing.authorId}".`);
          (forbiddenErr as any).statusCode = 403;
          (forbiddenErr as any).name = 'ForbiddenError';
          throw forbiddenErr;
        }
      }

      const updatedDraft: QuestionDraft = {
        ...existing,
        ...draft,
        id: draftId,
        authorId: existing.authorId || actor.id,
        authorName: existing.authorName || actor.name,
        author: existing.author || actor.name,
        createdAt: existing.createdAt,
        updatedAt: now,
        version: existing.version,
      };

      const expectedVersionToUse =
        (input as any).expectedVersion !== undefined
          ? (input as any).expectedVersion
          : input.version !== undefined
          ? input.version
          : existing.version;

      return questionDraftsRepository.update(draftId, updatedDraft, {
        expectedVersion: expectedVersionToUse,
      });
    }

    return questionDraftsRepository.create(draft);
  }

  /**
   * Retrieves a draft by ID.
   */
  public async getDraftById(id: string): Promise<QuestionDraft | null> {
    if (!id || typeof id !== 'string') {
      return null;
    }
    const trimmed = id.trim();
    if (!canonicalIdService.validateCanonicalId(trimmed, 'dft_') && !isLegacyDraftId(trimmed)) {
      throw new QuestionGenerationDomainError(`Invalid draft ID "${trimmed}". Expected canonical draft ID format (dft_<uuid_v4>).`, 400);
    }
    return questionDraftsRepository.findById(trimmed);
  }

  /**
   * Retrieves all drafts.
   */
  public async getAllDrafts(): Promise<QuestionDraft[]> {
    return questionDraftsRepository.findAll();
  }

  /**
   * Deletes a draft.
   */
  public async deleteDraft(id: string): Promise<boolean> {
    if (!id || typeof id !== 'string') {
      return false;
    }
    const trimmed = id.trim();
    if (!canonicalIdService.validateCanonicalId(trimmed, 'dft_') && !isLegacyDraftId(trimmed)) {
      throw new QuestionGenerationDomainError(`Invalid draft ID "${trimmed}". Expected canonical draft ID format (dft_<uuid_v4>).`, 400);
    }
    return questionDraftsRepository.delete(trimmed);
  }

  /**
   * SUBMIT FOR VERIFICATION: Separate, explicit user command.
   *
   * Validates that the draft is persisted, complete, and eligible for Stage 02.
   * Updates draft workflow stage to STAGE_02_VERIFICATION.
   * Does NOT approve the draft (approval requires Stage 02 independent human review).
   */
  public async submitForVerification(
    input: SubmitForVerificationInput,
    actor: { id: string; name: string; role?: any; roles?: string[] } = { id: 'USR-001', name: 'Author' }
  ): Promise<SubmitForVerificationResult> {
    if (!input.draftId || typeof input.draftId !== 'string') {
      throw new QuestionGenerationDomainError('draftId is required to submit for verification.', 400);
    }

    if (
      input.expectedVersion === undefined ||
      input.expectedVersion === null ||
      typeof input.expectedVersion !== 'number' ||
      isNaN(input.expectedVersion) ||
      !Number.isInteger(input.expectedVersion) ||
      input.expectedVersion < 1
    ) {
      throw new QuestionGenerationDomainError(
        'A valid positive integer expectedVersion (>= 1) is required for concurrency-safe draft submission.',
        400
      );
    }

    const trimmedDraftId = input.draftId.trim();
    if (!canonicalIdService.validateCanonicalId(trimmedDraftId, 'dft_') && !isLegacyDraftId(trimmedDraftId)) {
      throw new QuestionGenerationDomainError(
        `Invalid draft ID "${trimmedDraftId}". Expected canonical draft ID format (dft_<uuid_v4>).`,
        400
      );
    }

    const draft = await questionDraftsRepository.findById(trimmedDraftId);
    if (!draft) {
      throw new QuestionGenerationDomainError(`Draft with ID "${trimmedDraftId}" not found for verification submission.`, 404);
    }

    // Ownership / authorization check on submission:
    // Only the draft author or an authorized role (ADMIN, CONTENT_LEAD, QA_REVIEWER, QUESTION_EDITOR) can submit.
    // Strictly evaluated without actor ID or name heuristics.
    if (draft.authorId && actor.id && draft.authorId !== actor.id) {
      const { resolveBrownfieldRole } = await import('../../../src/types/rbac-models');
      const actorRole = (actor as any).role ? resolveBrownfieldRole((actor as any).role) : null;
      const actorRoles = (((actor as any).roles || []) as string[]).map((r) => resolveBrownfieldRole(r));
      const isAuthorizedSubmitter =
        actorRole === CanonicalRbacRole.ADMIN ||
        actorRoles.includes(CanonicalRbacRole.ADMIN) ||
        actorRole === CanonicalRbacRole.CONTENT_LEAD ||
        actorRoles.includes(CanonicalRbacRole.CONTENT_LEAD) ||
        actorRole === CanonicalRbacRole.QUESTION_EDITOR ||
        actorRoles.includes(CanonicalRbacRole.QUESTION_EDITOR);

      if (!isAuthorizedSubmitter) {
        const forbiddenErr = new Error(`Unauthorized: User "${actor.id}" cannot submit draft authored by "${draft.authorId}".`);
        (forbiddenErr as any).statusCode = 403;
        (forbiddenErr as any).name = 'ForbiddenError';
        throw forbiddenErr;
      }
    }

    // Pre-submission lifecycle eligibility and OCC checks
    if (draft.status === 'SUBMITTED_FOR_REVIEW' || draft.workflowStage === 'STAGE_02_VERIFICATION') {
      const conflictErr = new Error(`Draft "${draft.id}" has already been submitted for verification.`);
      (conflictErr as any).statusCode = 409;
      (conflictErr as any).name = 'ConcurrencyConflictError';
      throw conflictErr;
    }
    if (draft.status === QuestionStatus.APPROVED || draft.status === 'APPROVED') {
      throw new QuestionGenerationDomainError(`Draft "${trimmedDraftId}" has already been approved and cannot be resubmitted.`, 400);
    }
    if (draft.status === 'PUBLISHED') {
      throw new QuestionGenerationDomainError(`Draft "${trimmedDraftId}" has already been published.`, 400);
    }
    if (draft.status !== QuestionStatus.DRAFT && draft.status !== 'DRAFT') {
      throw new QuestionGenerationDomainError(
        `Draft "${trimmedDraftId}" is in status "${draft.status}" and is not eligible for verification submission. Expected status DRAFT.`,
        400
      );
    }

    if (draft.version !== undefined && input.expectedVersion !== draft.version) {
      const conflictErr = new Error(
        `Draft "${draft.id}" concurrency conflict: expected version ${input.expectedVersion}, but current version is ${draft.version}.`
      );
      (conflictErr as any).statusCode = 409;
      (conflictErr as any).name = 'ConcurrencyConflictError';
      throw conflictErr;
    }

    // Validate completeness before allowing submission (VAL-Q-01 through VAL-Q-12)
    const validation = this.validateCandidate({
      questionText: draft.questionText || draft.question,
      introductoryConcept: draft.introductoryConcept,
      conceptTitle: draft.conceptTitle,
      syllabusScopeNotes: draft.syllabusScopeNotes,
      questions: draft.questions,
      productionMode: draft.productionMode,
      targetQuestionCount: draft.targetQuestionCount,
      aspectRatio: draft.aspectRatio,
      optionA: draft.options?.a || draft.optionA,
      optionB: draft.options?.b || draft.optionB,
      optionC: draft.options?.c || draft.optionC,
      optionD: draft.options?.d || draft.optionD,
      correctAnswer: draft.correctAnswer as any,
      challengeType: draft.challengeType,
      slots: draft.slots,
      explanation: draft.explanation,
    } as any, { requireExplanation: true });

    if (!validation.isValid) {
      const firstError = validation.qualityReport?.errors[0];
      const errorCode = firstError?.code || 'ERR_INCOMPLETE_BATCH';
      const domainErr = new QuestionGenerationDomainError(
        `Draft cannot be submitted for verification: ${validation.errors.join(' ')}`,
        422,
        errorCode
      );
      (domainErr as any).validationErrors = validation.errors;
      (domainErr as any).qualityReport = validation.qualityReport;
      throw domainErr;
    }

    const now = new Date().toISOString();
    const { workflowService, workflowInstancesRepository } = await import('../workflow');

    // 1. Coordinate with Workflow Service to transition or create workflow instance
    let workflowInstanceId: string | undefined = draft.workflowInstanceId;
    let existingWf: any = null;
    let newlyCreatedWfId: string | undefined = undefined;
    let advancedExistingWf = false;
    let priorWorkflowVersion = 1;
    let priorCurrentStep: WorkflowStepNumber = 1;
    let priorContentStatus = 'DRAFT';
    let resultingStep = 2;

    const actorContext = {
      id: actor.id,
      name: actor.name,
      role: (actor as any).role || UserRole.QUESTION_CREATOR,
    };

    if (workflowInstanceId) {
      existingWf = await workflowInstancesRepository.findById(workflowInstanceId).catch(() => null);
    }
    if (!existingWf) {
      const found = await workflowInstancesRepository.findMany({
        where: { entityId: draft.id },
        limit: 1,
      }).catch(() => []);
      if (found && found.length > 0) {
        existingWf = found[0];
      }
    }

    try {
      if (existingWf) {
        workflowInstanceId = existingWf.id;
        priorWorkflowVersion = existingWf.version ?? 1;
        priorCurrentStep = (existingWf.currentStep ?? 1) as WorkflowStepNumber;
        priorContentStatus = existingWf.contentStatus ?? 'DRAFT';

        if (existingWf.currentStep === 1) {
          const transitionResult = await workflowService.transition(
            existingWf.id,
            {
              action: 'QUESTION_SUBMIT',
              targetStep: 2,
              reason: input.remarks || 'Submitted for pedagogical verification',
              expectedVersion: existingWf.version,
            },
            actorContext
          );
          advancedExistingWf = true;
          resultingStep = transitionResult.workflow?.currentStep || 2;
        } else if (existingWf.currentStep >= 2) {
          resultingStep = existingWf.currentStep;
        }
      } else {
        const wf = await workflowService.createInstance(
          {
            entityId: draft.id,
            entityType: 'QUESTION',
            currentStep: 2,
            contentStatus: 'IN_REVIEW',
            authorId: draft.authorId || actor.id,
            metadata: {
              ...(draft.topicId ? { topicId: draft.topicId } : {}),
              ...(draft.subtopicId ? { subtopicId: draft.subtopicId } : {}),
              ...(draft.productionMode ? { productionMode: draft.productionMode } : {}),
            },
          },
          actorContext
        );
        workflowInstanceId = wf.id;
        newlyCreatedWfId = wf.id;
        resultingStep = 2;
      }
    } catch (wfErr: any) {
      throw new QuestionGenerationDomainError(
        `Workflow transition failed during submission: ${wfErr?.message || 'Workflow transition error'}`,
        wfErr?.statusCode || 500
      );
    }

    // 2. Optimistic Concurrency Control (OCC) Lock on Draft:
    // Atomically transition the draft to SUBMITTED_FOR_REVIEW with OCC check in a single update.
    // Competing concurrent submissions will fail here with HTTP 409 (ConcurrencyConflictError)
    // and will clean up any speculative workflow instance created or reconcile existing workflow back to prior state.
    const preSubmissionDraft: QuestionDraft = {
      ...draft,
      status: 'SUBMITTED_FOR_REVIEW' as any,
      workflowStage: 'STAGE_02_VERIFICATION',
      workflowInstanceId,
      updatedAt: now,
    };

    try {
      await questionDraftsRepository.update(draft.id, preSubmissionDraft, {
        expectedVersion: input.expectedVersion,
      });
    } catch (occErr: any) {
      // COMPENSATION & RECONCILIATION:
      // If draft update fails (e.g. OCC conflict from concurrent submission or stale draft version),
      // reconcile workflow state to ensure draft and workflow never contradict each other.

      // Case A: Newly created workflow instance -> hard delete to prevent orphaned advance
      if (newlyCreatedWfId) {
        try {
          await (workflowInstancesRepository as any).delete(newlyCreatedWfId, 1, undefined, true);
        } catch (cleanupErr: any) {
          console.error(`[DraftSubmit:CleanupFailed] Failed to delete orphaned workflow instance ${newlyCreatedWfId}:`, cleanupErr);
          throw new QuestionGenerationDomainError(
            `Submission failed and cleanup of orphaned workflow instance failed: ${cleanupErr?.message}`,
            500
          );
        }
      }

      // Case B: Existing workflow instance that was advanced from Step 1 to Step 2 ->
      // Revert back to prior step and content status using version-checked OCC
      if (advancedExistingWf && existingWf) {
        try {
          await workflowInstancesRepository.update(
            existingWf.id,
            priorWorkflowVersion + 1, // OCC version check on the workflow instance
            {
              currentStep: priorCurrentStep,
              contentStatus: priorContentStatus,
              lastTransitionAt: new Date().toISOString(),
              lastTransitionBy: actorContext.id,
            },
            {
              actorId: actorContext.id,
              timestamp: new Date().toISOString(),
            }
          );
        } catch (reconcileErr: any) {
          console.error(
            `[DraftSubmit:ReconciliationFailed] Critical failure reconciling workflow ${existingWf.id} back to step ${priorCurrentStep}:`,
            reconcileErr
          );
          throw new QuestionGenerationDomainError(
            `Submission failed and workflow reconciliation failed: ${reconcileErr?.message || 'Reconciliation error'}`,
            500
          );
        }
      }

      throw occErr;
    }

    // Record immutable audit event
    try {
      await auditService.log(
        actor.id,
        actor.name,
        'QUESTION_DRAFT_SUBMITTED_FOR_VERIFICATION',
        'QUESTION_DRAFT',
        draft.id,
        {
          topicId: draft.topicId,
          subtopicId: draft.subtopicId,
          submittedBy: actor.id,
          remarks: input.remarks || 'Submitted for pedagogical verification',
          workflowInstanceId,
          timestamp: now,
        }
      );
    } catch {
      // Safe fallback for audit logging
    }

    return {
      success: true,
      draftId: draft.id,
      workflowInstanceId,
      currentStep: resultingStep,
      status: 'SUBMITTED_FOR_REVIEW',
      workflowStage: 'STAGE_02_VERIFICATION',
      message: 'Question draft submitted successfully for Stage 02 Verification.',
      submittedAt: now,
    };
  }

  /**
   * Materializes a verified Draft into a permanent production Question.
   * Invoked ONLY at Stage 02 approval gate.
   * Enforces GAR-02 Anti-Self-Approval constraint (Author cannot approve own draft).
   */
  public async approveDraft(
    draftId: string,
    actor: { id: string; name: string; role?: any; roles?: string[] } = { id: 'USR-001', name: 'Reviewer / Admin' },
    approvalNotes?: string,
    overrideContext?: AdministrativeOverrideContext
  ) {
    const draft = await questionDraftsRepository.findById(draftId);
    if (!draft) {
      const err = new QuestionGenerationDomainError(`Draft with ID "${draftId}" not found for approval.`, 404);
      throw err;
    }

    // GAR-02: Anti-Self-Approval Constraint Enforcement
    // Canonical author user ID must be resolved strictly from trusted persisted ID fields (authorId or createdBy).
    // Human display names (author, authorName) MUST NOT be used as identity keys.
    const canonicalAuthorId = draft.authorId?.trim() || (draft as any).createdBy?.trim();
    if (!canonicalAuthorId) {
      const err = new QuestionGenerationDomainError(
        'Author identity cannot be verified (missing authoritative authorId). Segregation of duties (GAR-02) requires an established author user ID before approval/verification. An administrator must reconcile the author record via POST /api/v1/questions/draft/:id/reconcile-author or assign it for independent review.',
        403,
        'GAR-02'
      );
      throw err;
    }

    // An author who created or drafted the question is strictly prohibited from approving/verifying their own draft into production.
    // Zero administrative override bypass: even an ADMIN cannot self-approve their own authored content.
    const isSelfApproval = Boolean(actor.id && canonicalAuthorId === actor.id.trim());

    if (isSelfApproval) {
      try {
        await auditService.log(
          actor.id,
          actor.name,
          'QUESTION_DRAFT_APPROVAL_REJECTED',
          'QUESTION_DRAFT',
          draftId,
          {
            reason: 'GAR-02: Anti-Self-Approval constraint violation (strict zero-bypass)',
            authorId: canonicalAuthorId,
            authorName: draft.authorName || draft.author,
            reviewerId: actor.id,
            reviewerName: actor.name,
          }
        );
      } catch {
        // Safe fallback
      }

      const err = new QuestionGenerationDomainError('Self-approval strictly prohibited (GAR-02): The author cannot verify or approve their own question draft into Step 02 production. An independent reviewer or administrator must verify this item.', 403, 'GAR-02');
      throw err;
    }
    const firstQuestion = draft.questions && draft.questions.length > 0 ? draft.questions[0] : null;
    const resolvedQuestionText = draft.questionText || draft.introductoryConcept || firstQuestion?.questionText || '';
    const resolvedExplanation = draft.explanation || firstQuestion?.explanation || draft.introductoryConcept || '';
    const hasDraftOptions = draft.options && (draft.options.a || draft.options.b || draft.options.c || draft.options.d);
    const resolvedOptions = hasDraftOptions ? draft.options : (firstQuestion?.options || { a: '', b: '', c: '', d: '' });
    const resolvedCorrectAnswer = (draft.productionMode === 'TOPIC_INTRODUCTION')
      ? ''
      : (draft.correctAnswer || firstQuestion?.correctAnswer || 'A');

    // Materialize into canonical Question
    const createdQuestion = await questionService.createQuestionFromRequest(
      {
        creationMode: 'ai',
        topicId: draft.topicId,
        subtopicId: draft.subtopicId,
        difficulty: draft.difficulty as any,
        language: draft.language as any,
        questionText: resolvedQuestionText,
        question: resolvedQuestionText,
        options: resolvedOptions,
        correctAnswer: resolvedCorrectAnswer,
        explanation: resolvedExplanation,
        realLifeContext: draft.realLifeContext,
        challengeType: draft.challengeType,
        presentationType: draft.presentationType,
        questionStyle: draft.questionStyle as any,
        productionMode: draft.productionMode,
        targetQuestionCount: draft.targetQuestionCount,
        aspectRatio: draft.aspectRatio,
        introductoryConcept: draft.introductoryConcept,
        conceptTitle: draft.conceptTitle,
        syllabusScopeNotes: draft.syllabusScopeNotes,
        questions: draft.questions,
        tags: draft.tags,
        source: draft.source || 'AI Question Studio',
        mathematicalVerification: draft.mathematicalVerification,
        skipDuplicateCheck: true,
      },
      {
        id: canonicalAuthorId,
        name: draft.authorName || draft.author || 'Author',
        role: UserRole.CONTENT_WRITER,
      }
    );

    const approvedQuestion = await questionService.updateStatus(
      createdQuestion.id,
      QuestionStatus.APPROVED,
      {
        id: actor.id,
        name: actor.name,
        role: actor.role || UserRole.ADMIN,
        roles: actor.roles,
      },
      approvalNotes || 'Approved from draft in Stage 02'
    );

    await questionDraftsRepository.delete(draftId);
    this.draftToCanonicalMap.set(draftId, approvedQuestion.id);

    return approvedQuestion;
  }

  /**
   * Reconciles the authoritative author user ID for a legacy draft lacking an established authorId.
   * Administrative recovery path strictly restricted to System Administrators.
   */
  public async reconcileDraftAuthor(
    draftId: string,
    authorUserId: string,
    actor: { id: string; name: string; role: UserRole | string; roles?: string[] },
    authorDisplayName?: string
  ): Promise<QuestionDraft> {
    const isAuthorized =
      actor.role === UserRole.ADMIN ||
      actor.role === 'ADMIN' ||
      (Array.isArray(actor.roles) && actor.roles.includes('ADMIN'));

    if (!isAuthorized) {
      const err = new QuestionGenerationDomainError('Unauthorized: Only System Administrators can reconcile legacy draft author identities.', 403);
      throw err;
    }

    if (!authorUserId || !authorUserId.trim()) {
      const err = new QuestionGenerationDomainError('authorUserId is required to reconcile draft author identity.', 400);
      throw err;
    }

    const draft = await questionDraftsRepository.findById(draftId);
    if (!draft) {
      const err = new QuestionGenerationDomainError(`Draft with ID "${draftId}" not found for author reconciliation.`, 404);
      throw err;
    }

    const updated = await questionDraftsRepository.update(draftId, {
      authorId: authorUserId.trim(),
      ...(authorDisplayName ? { author: authorDisplayName.trim(), authorName: authorDisplayName.trim() } : {}),
      updatedAt: new Date().toISOString(),
    });

    try {
      await auditService.log(
        actor.id,
        actor.name,
        'DRAFT_AUTHOR_RECONCILED',
        'QUESTION_DRAFT',
        draftId,
        {
          previousAuthorId: draft.authorId,
          newAuthorId: authorUserId.trim(),
          reconciledBy: actor.id,
        }
      );
    } catch {
      // Safe fallback
    }

    return updated;
  }

  public getCanonicalQuestionIdForDraft(draftId: string): string | undefined {
    return this.draftToCanonicalMap.get(draftId);
  }
}

export const questionGenerationService = QuestionGenerationService.getInstance();
