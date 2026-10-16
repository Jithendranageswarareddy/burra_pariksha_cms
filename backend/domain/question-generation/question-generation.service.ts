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
  UserRole,
  canonicalIdService,
  ContentProductionMode,
  validateProductionModeConfig,
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
} from '../../../shared/contracts/question-generation';
import { questionDraftsRepository } from '../../../database/firestore/repositories/question-drafts.repository';
import { taxonomyService } from '../taxonomy/services/taxonomy.service';
import { aiOrchestrator } from '../../ai/orchestrator';
import { auditService } from '../../infrastructure/audit/services/audit.service';
import { questionService } from '../../features/question-generation/services/question.service';
import { type AdministrativeOverrideContext, resolveBrownfieldRole } from '../../../src/types/rbac-models';
import { CanonicalRbacRole } from '../../../shared';

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

    return { isValid: true };
  }

  /**
   * Orchestrates advisory AI question candidate generation.
   * AI output is strictly advisory and requires human review.
   */
  public async generateCandidate(input: GenerateCandidateInput): Promise<GenerationResult> {
    const validation = await this.validateGenerationRequest(input);
    if (!validation.isValid) {
      throw new QuestionGenerationDomainError(validation.error || 'Invalid generation request parameters.');
    }

    // Delegate to server-side AI orchestrator (AP-009 Human-in-the-Loop)
    const result = await aiOrchestrator.generateQuestionCandidate(input);
    return result as GenerationResult;
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
   * Validates a candidate in memory before saving as draft.
   */
  public validateCandidate(candidate: Partial<StudioCandidate>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const mode = (candidate.productionMode as ContentProductionMode) || 'QUESTION_CHALLENGE_SHORT';

    if (mode === 'TOPIC_INTRODUCTION') {
      const conceptText = (candidate.introductoryConcept || candidate.questionText || '').trim();
      if (!conceptText || conceptText.length < 15) {
        errors.push('Introductory concept statement must be at least 15 characters.');
      }
      return { isValid: errors.length === 0, errors };
    }

    if (mode === 'EXPLAINED_QUESTIONS_VIDEO') {
      const introText = (candidate.introductoryConcept || candidate.questionText || '').trim();
      if (!introText || introText.length < 15) {
        errors.push('Introductory concept overview must be at least 15 characters.');
      }
      const targetCount = candidate.targetQuestionCount || 5;
      const questions = candidate.questions || [];
      if (questions.length < targetCount) {
        errors.push(`Requires ${targetCount} explained questions (currently has ${questions.length}).`);
      }
      for (let i = 0; i < Math.min(questions.length, targetCount); i++) {
        const q = questions[i];
        const qIdx = q.questionNumber || i + 1;
        const qText = (q.questionText || '').trim();
        const a = (q.optionA || q.options?.a || '').trim();
        const b = (q.optionB || q.options?.b || '').trim();
        const c = (q.optionC || q.options?.c || '').trim();
        const d = (q.optionD || q.options?.d || '').trim();
        const ans = (q.correctAnswer || '').trim().toUpperCase();

        if (!qText || qText.length < 5) errors.push(`Question #${qIdx}: Statement must be at least 5 characters.`);
        if (!a) errors.push(`Question #${qIdx}: Option A is required.`);
        if (!b) errors.push(`Question #${qIdx}: Option B is required.`);
        if (!c) errors.push(`Question #${qIdx}: Option C is required.`);
        if (!d) errors.push(`Question #${qIdx}: Option D is required.`);
        if (!['A', 'B', 'C', 'D'].includes(ans)) errors.push(`Question #${qIdx}: Correct answer must be A, B, C, or D.`);
      }
      return { isValid: errors.length === 0, errors };
    }

    // Default Mode 1: QUESTION_CHALLENGE_SHORT
    const text = (candidate.questionText || '').trim();
    if (!text || text.length < 5) {
      errors.push('Question problem statement must be at least 5 characters.');
    }
    if (!candidate.optionA?.trim()) errors.push('Option A is required.');
    if (!candidate.optionB?.trim()) errors.push('Option B is required.');
    if (!candidate.optionC?.trim() && candidate.challengeType !== 'TRUE_FALSE' && candidate.challengeType !== 'YES_NO') {
      errors.push('Option C is required.');
    }
    if (!candidate.optionD?.trim() && candidate.challengeType !== 'TRUE_FALSE' && candidate.challengeType !== 'YES_NO') {
      errors.push('Option D is required.');
    }
    if (!candidate.correctAnswer || !['A', 'B', 'C', 'D'].includes(candidate.correctAnswer)) {
      errors.push('Correct answer must be specified (A, B, C, or D).');
    }
    return { isValid: errors.length === 0, errors };
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

    const draft: QuestionDraft = {
      id: draftId,
      topicId: input.topicId,
      subtopicId: input.subtopicId,
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
        existing.status === QuestionStatus.PENDING_REVIEW ||
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

      if (
        existing.authorId &&
        actor.id &&
        existing.authorId !== actor.id &&
        !actor.id.startsWith('ADMIN') &&
        actor.name !== 'Admin / Content Lead'
      ) {
        const { resolveBrownfieldRole } = await import('../../../src/types/rbac-models');
        const actorRole = (actor as any).role ? resolveBrownfieldRole((actor as any).role) : null;
        const actorRoles = ((actor as any).roles || []).map((r: any) => resolveBrownfieldRole(r));
        const isAdmin = actorRole === 'ADMIN' || actorRoles.includes('ADMIN') || actorRole === 'CONTENT_MANAGER' || actorRoles.includes('CONTENT_MANAGER');
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

      return questionDraftsRepository.update(draftId, updatedDraft, {
        expectedVersion: input.version ?? existing.version,
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
      input.expectedVersion < 1
    ) {
      throw new QuestionGenerationDomainError(
        'A valid numeric expectedVersion (>= 1) is required for concurrency-safe draft submission.',
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

    // Validate completeness before allowing submission
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
    });

    if (!validation.isValid) {
      throw new QuestionGenerationDomainError(
        `Draft cannot be submitted for verification: ${validation.errors.join(' ')}`,
        422
      );
    }

    const now = new Date().toISOString();
    const { workflowService, workflowInstancesRepository } = await import('../workflow');

    // 1. Coordinate with Workflow Service to transition or create workflow instance
    let workflowInstanceId: string | undefined = draft.workflowInstanceId;
    let existingWf: any = null;
    let newlyCreatedWfId: string | undefined = undefined;
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
        if (existingWf.currentStep === 1) {
          const transitionResult = await workflowService.transition(
            existingWf.id,
            {
              action: 'SUBMIT_FOR_REVIEW',
              actor: actorContext,
              targetStep: 2,
              reason: input.remarks || 'Submitted for pedagogical verification',
              expectedVersion: existingWf.version,
            },
            actorContext
          );
          resultingStep = transitionResult.resultingStep || 2;
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
              topicId: draft.topicId,
              subtopicId: draft.subtopicId,
              productionMode: draft.productionMode,
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
    // and will clean up any speculative workflow instance created.
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
      // COMPENSATION: If draft update fails (e.g. OCC conflict from concurrent submission),
      // clean up newly created workflow instance to prevent orphaned/duplicate workflow advancement.
      if (newlyCreatedWfId) {
        await (workflowInstancesRepository as any).delete(newlyCreatedWfId, 1, undefined, true).catch((cleanupErr: any) => {
          console.error(`[DraftSubmit:CleanupFailed] Failed to delete orphaned workflow instance ${newlyCreatedWfId}:`, cleanupErr);
        });
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
    const isSelfApproval = Boolean(
      (draft.authorId && actor.id && draft.authorId === actor.id) ||
      (draft.author && actor.name && draft.author.trim().toLowerCase() === actor.name.trim().toLowerCase() && (!draft.authorId || draft.authorId === actor.id))
    );

    const actorCanonicalRole = actor.role ? resolveBrownfieldRole(actor.role) : CanonicalRbacRole.QUESTION_AUTHOR;
    const actorCanonicalRoles = (actor.roles || [actorCanonicalRole]).map((r) => resolveBrownfieldRole(r));
    const isAdmin = actorCanonicalRole === CanonicalRbacRole.ADMIN || actorCanonicalRoles.includes(CanonicalRbacRole.ADMIN);

    const isOverrideAllowed = Boolean(
      isSelfApproval &&
      isAdmin &&
      overrideContext?.isOverride &&
      overrideContext?.confirmedByAdmin &&
      typeof overrideContext?.reason === 'string' &&
      overrideContext.reason.trim().length >= 10
    );

    if (isSelfApproval && !isOverrideAllowed) {
      try {
        await auditService.log(
          actor.id,
          actor.name,
          'QUESTION_DRAFT_APPROVAL_REJECTED',
          'QUESTION_DRAFT',
          draftId,
          {
            reason: 'GAR-02: Anti-Self-Approval constraint violation',
            authorId: draft.authorId,
            authorName: draft.authorName || draft.author,
            reviewerId: actor.id,
            reviewerName: actor.name,
            attemptedOverride: Boolean(overrideContext?.isOverride),
          }
        );
      } catch {
        // Safe fallback
      }

      const reasonMsg = overrideContext?.isOverride && (!overrideContext?.reason || overrideContext.reason.trim().length < 10)
        ? 'Administrative override requires a mandatory justification reason (minimum 10 characters).'
        : 'Self-approval prohibited (GAR-02): The author cannot verify or approve their own question draft into Step 02 production.';

      const err = new QuestionGenerationDomainError(reasonMsg, 403, 'NEG-01');
      throw err;
    }

    if (isOverrideAllowed) {
      try {
        await auditService.log(
          actor.id,
          actor.name,
          'QUESTION_DRAFT_APPROVAL_ADMIN_OVERRIDE',
          'QUESTION_DRAFT',
          draftId,
          {
            isOverride: true,
            overrideReason: overrideContext?.reason,
            overrideActionType: overrideContext?.overrideActionType || 'ADMIN_APPROVAL_OVERRIDE',
            authorId: draft.authorId,
            authorName: draft.authorName || draft.author,
            actorId: actor.id,
            previousState: draft.status,
            newState: 'APPROVED',
            confirmedByAdmin: true,
            timestamp: new Date().toISOString(),
          }
        );
      } catch {
        // Safe fallback
      }
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
        id: draft.authorId || actor.id,
        name: draft.authorName || draft.author || actor.name,
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

  public getCanonicalQuestionIdForDraft(draftId: string): string | undefined {
    return this.draftToCanonicalMap.get(draftId);
  }
}

export const questionGenerationService = QuestionGenerationService.getInstance();
