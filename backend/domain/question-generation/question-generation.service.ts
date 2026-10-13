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
    const rawText = (input.questionText || input.question || '').trim();
    if (!rawText) {
      throw new QuestionGenerationDomainError('Question statement cannot be empty when saving draft.', 400);
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

    const optA = (input.options?.a || input.optionA || '').trim();
    const optB = (input.options?.b || input.optionB || '').trim();
    const optC = (input.options?.c || input.optionC || '').trim();
    const optD = (input.options?.d || input.optionD || '').trim();

    const draftId = input.id && input.id.startsWith('BP-DFT-')
      ? input.id
      : `BP-DFT-${Date.now().toString().slice(-6)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const now = new Date().toISOString();

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
      correctAnswer: input.correctAnswer || 'A',
      explanation: (input.explanation || '').trim(),
      realWorldContext: input.realLifeContext || input.realWorldContext,
      realLifeContext: input.realLifeContext || input.realWorldContext,
      challengeType: input.challengeType || 'ABCD',
      presentationType: input.presentationType ? (input.presentationType === 'Text' ? 'TEXT_ONLY' : input.presentationType) : 'TEXT_ONLY',
      questionStyle: (input.questionStyle as any) || 'STORY_BASED',
      generationMode: (input.generationMode as any) || 'SUBTOPIC',
      tags: input.tags || ['Aptitude', 'Draft'],
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

    return questionDraftsRepository.create(draft);
  }

  /**
   * Retrieves a draft by ID.
   */
  public async getDraftById(id: string): Promise<QuestionDraft | null> {
    return questionDraftsRepository.findById(id);
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
    return questionDraftsRepository.delete(id);
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
    actor: { id: string; name: string } = { id: 'USR-001', name: 'Author' }
  ): Promise<SubmitForVerificationResult> {
    if (!input.draftId) {
      throw new QuestionGenerationDomainError('draftId is required to submit for verification.', 400);
    }

    const draft = await questionDraftsRepository.findById(input.draftId);
    if (!draft) {
      throw new QuestionGenerationDomainError(`Draft with ID "${input.draftId}" not found for verification submission.`, 404);
    }

    // Pre-submission lifecycle eligibility checks
    if (draft.status === 'SUBMITTED_FOR_REVIEW' || draft.workflowStage === 'STAGE_02_VERIFICATION') {
      throw new QuestionGenerationDomainError(`Draft "${input.draftId}" has already been submitted for verification.`, 409);
    }
    if (draft.status === QuestionStatus.APPROVED || draft.status === 'APPROVED') {
      throw new QuestionGenerationDomainError(`Draft "${input.draftId}" has already been approved and cannot be resubmitted.`, 400);
    }
    if (draft.status === 'PUBLISHED') {
      throw new QuestionGenerationDomainError(`Draft "${input.draftId}" has already been published.`, 400);
    }
    if (draft.status !== QuestionStatus.DRAFT && draft.status !== 'DRAFT') {
      throw new QuestionGenerationDomainError(
        `Draft "${input.draftId}" is in status "${draft.status}" and is not eligible for verification submission. Expected status DRAFT.`,
        400
      );
    }

    // Validate completeness before allowing submission
    const validation = this.validateCandidate({
      questionText: draft.questionText || draft.question,
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

    // Transition draft into submitted state
    const updatedDraft: QuestionDraft = {
      ...draft,
      status: 'SUBMITTED_FOR_REVIEW' as any,
      workflowStage: 'STAGE_02_VERIFICATION',
      updatedAt: now,
    };

    await questionDraftsRepository.update(draft.id, updatedDraft);

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
          timestamp: now,
        }
      );
    } catch {
      // Safe fallback for audit logging
    }

    return {
      success: true,
      draftId: draft.id,
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

    // Materialize into canonical Question
    const createdQuestion = await questionService.createQuestionFromRequest(
      {
        creationMode: 'ai',
        topicId: draft.topicId,
        subtopicId: draft.subtopicId,
        difficulty: draft.difficulty as any,
        language: draft.language as any,
        questionText: draft.questionText,
        question: draft.questionText,
        options: draft.options,
        correctAnswer: draft.correctAnswer,
        explanation: draft.explanation,
        realLifeContext: draft.realLifeContext,
        challengeType: draft.challengeType,
        presentationType: draft.presentationType,
        questionStyle: draft.questionStyle as any,
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
