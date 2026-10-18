/**
 * BURRA PARIKSHA CMS - Question Draft Service
 * Stage 01: Question Generation & Draft Handoff Pipeline
 * 
 * Manages transient/editable question drafts. Allows Stage 01 to persist
 * and hand off candidates to Stage 02 without executing permanent Question ID
 * allocation, Content Master creation, or multi-layer verification blocking save gates.
 */

import { QuestionDraft, QuestionStatus, UserRole } from '../../../../shared';
import { questionDraftsRepository } from '../../../../database/firestore/repositories/question-drafts.repository';
import { taxonomyService } from '../../../domain/taxonomy/services/taxonomy.service';
import { questionService } from './question.service';
import { auditService } from '../../../infrastructure/audit/services/audit.service';
import { CanonicalRbacRole } from '../../../../shared';
import { type AdministrativeOverrideContext, resolveBrownfieldRole } from '../../../../src/types/rbac-models';

export interface SaveDraftInput {
  id?: string;
  topicId: string;
  subtopicId: string;
  difficulty: string;
  language?: string;
  questionText: string;
  question?: string;
  options?: {
    a: string;
    b: string;
    c?: string;
    d?: string;
  };
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctAnswer?: 'A' | 'B' | 'C' | 'D' | string;
  explanation?: string;
  realWorldContext?: string;
  realLifeContext?: string;
  challengeType?: string;
  presentationType?: string;
  questionStyle?: string;
  generationMode?: 'SUBTOPIC' | 'RANDOM' | string;
  productionMode?: string;
  targetQuestionCount?: number;
  aspectRatio?: string;
  introductoryConcept?: string;
  conceptTitle?: string;
  syllabusScopeNotes?: string;
  questions?: any[];
  tags?: string[];
  source?: string;
  sourceModel?: string;
  generationLatencyMs?: number;
  isFallback?: boolean;
  mathematicalVerification?: any;
}

export class QuestionDraftService {
  private static instance: QuestionDraftService | null = null;
  private draftToCanonicalMap = new Map<string, string>();

  private constructor() {}

  public static getInstance(): QuestionDraftService {
    if (!QuestionDraftService.instance) {
      QuestionDraftService.instance = new QuestionDraftService();
    }
    return QuestionDraftService.instance;
  }

  public getCanonicalQuestionIdForDraft(draftId: string): string | undefined {
    return this.draftToCanonicalMap.get(draftId);
  }

  /**
   * Delegates to authoritative QuestionGenerationService for draft persistence.
   */
  public async saveDraft(
    input: SaveDraftInput,
    actor: { id: string; name: string } = { id: 'USR-001', name: 'Admin / Content Lead' }
  ): Promise<QuestionDraft> {
    const { questionGenerationService } = await import('../../../domain/question-generation/question-generation.service');
    return questionGenerationService.saveDraft(input, actor);
  }

  public async getDraftById(id: string): Promise<QuestionDraft | null> {
    const { questionGenerationService } = await import('../../../domain/question-generation/question-generation.service');
    return questionGenerationService.getDraftById(id);
  }

  public async getAllDrafts(): Promise<QuestionDraft[]> {
    const { questionGenerationService } = await import('../../../domain/question-generation/question-generation.service');
    return questionGenerationService.getAllDrafts();
  }

  public async deleteDraft(id: string): Promise<boolean> {
    const { questionGenerationService } = await import('../../../domain/question-generation/question-generation.service');
    return questionGenerationService.deleteDraft(id);
  }

  /**
   * Explicitly submits an eligible saved draft for Stage 02 Verification.
   */
  public async submitForVerification(
    input: { draftId: string; remarks?: string; expectedVersion: number },
    actor: { id: string; name: string; role?: any; roles?: string[] } = { id: 'USR-001', name: 'Author' }
  ) {
    const { questionGenerationService } = await import('../../../domain/question-generation/question-generation.service');
    return questionGenerationService.submitForVerification(input, actor);
  }

  /**
   * Materializes a verified Draft into a permanent production Question.
   * Invoked ONLY at Stage 02 approval gate.
   * Enforces NEG-01 Anti-Self-Approval constraint (Author cannot verify own draft).
   */
  public async approveDraft(
    draftId: string,
    actor: { id: string; name: string; role?: any; roles?: string[] } = { id: 'USR-001', name: 'Reviewer / Admin' },
    approvalNotes?: string,
    overrideContext?: AdministrativeOverrideContext
  ) {
    const draft = await questionDraftsRepository.findById(draftId);
    if (!draft) {
      const err = new Error(`Draft with ID "${draftId}" not found for approval.`);
      (err as any).statusCode = 404;
      throw err;
    }

    // GAR-02: Anti-Self-Approval Constraint Enforcement
    // Missing legacy authorId values must fail closed (cannot enable silent self-approval).
    const authorIdentifier = draft.authorId?.trim() || draft.author?.trim();
    if (!authorIdentifier) {
      const err = new Error('Author identity cannot be verified (missing authorId). Segregation of duties (GAR-02) requires an identifiable author before approval/verification.');
      (err as any).statusCode = 403;
      (err as any).name = 'MissingAuthorIdentityError';
      (err as any).code = 'GAR-02';
      throw err;
    }

    // An author who created or drafted the question is strictly prohibited from approving/verifying their own draft into production.
    const isSelfApproval = Boolean(
      (draft.authorId && actor.id && draft.authorId.trim() === actor.id.trim()) ||
      (draft.author && actor.name && draft.author.trim().toLowerCase() === actor.name.trim().toLowerCase() && (!draft.authorId || draft.authorId.trim() === actor.id.trim()))
    );

    if (isSelfApproval) {
      // Record rejected audit event in authoritative audit ledger
      try {
        await auditService.log(
          actor.id,
          actor.name,
          'QUESTION_DRAFT_APPROVAL_REJECTED',
          'QUESTION_DRAFT',
          draftId,
          {
            reason: 'GAR-02: Anti-Self-Approval constraint violation (strict zero-bypass)',
            authorId: draft.authorId,
            authorName: draft.authorName || draft.author,
            reviewerId: actor.id,
            reviewerName: actor.name,
          }
        );
      } catch {
        // Safe fallback for audit logging
      }

      const err = new Error('Self-approval strictly prohibited (GAR-02): The author cannot verify or approve their own question draft into Step 02 production. An independent reviewer or administrator must verify this item.');
      (err as any).statusCode = 403;
      (err as any).name = 'AntiSelfApprovalViolation';
      (err as any).code = 'GAR-02';
      throw err;
    }
    // Call canonical question creation with verified payload attributed to draft author
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
        skipDuplicateCheck: true, // reviewed by human verifier
      },
      {
        id: draft.authorId || actor.id,
        name: draft.authorName || draft.author || actor.name,
        role: UserRole.CONTENT_WRITER,
      }
    );

    // Mark question as APPROVED upon draft approval
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

    // Remove draft once materialized
    await questionDraftsRepository.delete(draftId);

    // Maintain draft-to-canonical ID alias for seamless continuity
    this.draftToCanonicalMap.set(draftId, approvedQuestion.id);

    return approvedQuestion;
  }
}

export const questionDraftService = QuestionDraftService.getInstance();
