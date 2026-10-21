/**
 * BURRA PARIKSHA CMS - Question Draft Service
 * Stage 01: Question Generation & Draft Handoff Pipeline
 * 
 * Manages transient/editable question drafts. Allows Stage 01 to persist
 * and hand off candidates to Stage 02 without executing permanent Question ID
 * allocation, Content Master creation, or multi-layer verification blocking save gates.
 */

import { QuestionDraft, QuestionStatus, UserRole, SaveQuestionDraftInput } from '../../../../shared';
import { questionDraftsRepository } from '../../../../database/firestore/repositories/question-drafts.repository';
import { taxonomyService } from '../../../domain/taxonomy/services/taxonomy.service';
import { questionService } from './question.service';
import { auditService } from '../../../infrastructure/audit/services/audit.service';
import { CanonicalRbacRole } from '../../../../shared';
import { type AdministrativeOverrideContext, resolveBrownfieldRole } from '../../../../src/types/rbac-models';

export type SaveDraftInput = SaveQuestionDraftInput;

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

  public async deleteDraft(id: string, actor?: { id: string; name?: string }): Promise<boolean> {
    const { questionGenerationService } = await import('../../../domain/question-generation/question-generation.service');
    return questionGenerationService.deleteDraft(id, actor);
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
   * Returns a submitted question draft for revision (Stage 02 reviewer decision).
   */
  public async returnDraftForRevision(
    draftId: string,
    actor: { id: string; name: string; role?: any; roles?: string[] } = { id: 'USR-001', name: 'Reviewer / Admin' },
    feedback: string,
    options?: { expectedVersion?: number; action?: 'QUESTION_REQUEST_CHANGES' | 'QUESTION_REJECT' }
  ) {
    const { questionGenerationService } = await import('../../../domain/question-generation/question-generation.service');
    return questionGenerationService.returnDraftForRevision(draftId, actor, feedback, options);
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
      const canonicalId = this.draftToCanonicalMap.get(draftId);
      if (canonicalId) {
        const existingQuestion = await questionService.getQuestionById(canonicalId);
        if (existingQuestion) {
          return existingQuestion;
        }
      }
      const err = new Error(`Draft with ID "${draftId}" not found for approval.`);
      (err as any).statusCode = 404;
      throw err;
    }

    // GAR-02: Anti-Self-Approval Constraint Enforcement
    // Canonical author user ID must be resolved strictly from trusted persisted ID fields (authorId or createdBy).
    // Human display names (author, authorName) MUST NOT be used as identity keys.
    const canonicalAuthorId = draft.authorId?.trim() || (draft as any).createdBy?.trim();
    if (!canonicalAuthorId) {
      const err = new Error(
        'Author identity cannot be verified (missing authoritative authorId). Segregation of duties (GAR-02) requires an established author user ID before approval/verification. An administrator must reconcile the author record via POST /api/v1/questions/draft/:id/reconcile-author or assign it for independent review.'
      );
      (err as any).statusCode = 403;
      (err as any).name = 'MissingAuthorIdentityError';
      (err as any).code = 'GAR-02';
      throw err;
    }

    // An author who created or drafted the question is strictly prohibited from approving/verifying their own draft into production
    // unless an authenticated System Administrator executes an explicit, confirmed administrative override with valid justification.
    const isSelfApproval = Boolean(actor.id && canonicalAuthorId === actor.id.trim());

    if (isSelfApproval) {
      const canonicalRole = resolveBrownfieldRole(actor.role || (actor.roles && actor.roles[0]));
      const actorRoles = (actor.roles || [actor.role]).map((r: any) => resolveBrownfieldRole(r));
      const isAdmin = canonicalRole === CanonicalRbacRole.ADMIN || actorRoles.includes(CanonicalRbacRole.ADMIN);

      const reason = String(overrideContext?.reason || (overrideContext as any)?.overrideReason || '').trim();
      const isOverrideValid =
        isAdmin &&
        overrideContext?.isOverride === true &&
        overrideContext?.confirmedByAdmin === true &&
        reason.length >= 10;

      if (!isOverrideValid) {
        // Record rejected audit event in authoritative audit ledger
        try {
          await auditService.log(
            actor.id,
            actor.name,
            'QUESTION_DRAFT_APPROVAL_REJECTED',
            'QUESTION_DRAFT',
            draftId,
            {
              reason: !isAdmin
                ? 'GAR-02: Anti-Self-Approval constraint violation (strict zero-bypass for non-administrators)'
                : !overrideContext?.confirmedByAdmin
                  ? 'GAR-02: Missing administrative override confirmation'
                  : 'GAR-02: Override reason must be at least 10 characters',
              authorId: canonicalAuthorId,
              authorName: draft.authorName || draft.author,
              reviewerId: actor.id,
              reviewerName: actor.name,
            }
          );
        } catch {
          // Safe fallback for audit logging
        }

        const msg = !isAdmin
          ? 'Self-approval strictly prohibited (GAR-02): The author cannot verify or approve their own question draft into Step 02 production. An independent reviewer or administrator must verify this item.'
          : !overrideContext?.confirmedByAdmin
            ? 'Self-approval requires explicit administrative override confirmation (GAR-02).'
            : 'Administrative override requires a meaningful justification of at least 10 characters.';

        const err = new Error(msg);
        (err as any).statusCode = 403;
        (err as any).name = 'AntiSelfApprovalViolation';
        (err as any).code = 'GAR-02';
        throw err;
      }

      // Record successful administrative override audit event
      try {
        await auditService.log(
          actor.id,
          actor.name,
          'ADMIN_APPROVAL_OVERRIDE',
          'QUESTION_DRAFT',
          draftId,
          {
            reason: reason,
            authorId: canonicalAuthorId,
            authorName: draft.authorName || draft.author,
            approverId: actor.id,
            approverName: actor.name,
            isOverride: true,
            confirmedByAdmin: true,
            overrideActionType: overrideContext?.overrideActionType || 'ADMIN_APPROVAL_OVERRIDE',
            previousState: draft.status || 'SUBMITTED_FOR_REVIEW',
            resultingState: 'APPROVED',
          }
        );
      } catch {
        // Safe fallback for audit logging
      }
    }
    // Call canonical question creation with verified payload attributed to draft author
    const createdQuestion = await questionService.createQuestionFromRequest(
      {
        creationMode: 'ai',
        idempotencyKey: `draft-approval-${draft.id}`,
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
        id: canonicalAuthorId,
        name: draft.authorName || draft.author || 'Author',
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

    // Reconcile associated workflow instance:
    // When a draft is approved into a canonical Question, any workflow instance tracking this draft
    // must have its entityId updated to the approved Question ID (and contentStatus to 'APPROVED')
    // so that the workflow points to the materialized canonical Question rather than dangling.
    const { workflowInstancesRepository } = await import('../../../domain/workflow');
    let wfToReconcile: any = null;
    if (draft.workflowInstanceId) {
      wfToReconcile = await workflowInstancesRepository.findById(draft.workflowInstanceId).catch(() => null);
    }
    if (!wfToReconcile) {
      const found = await workflowInstancesRepository.findMany({
        where: { entityId: draftId },
        limit: 1,
      }).catch(() => []);
      if (found && found.length > 0) {
        wfToReconcile = found[0];
      }
    }

    if (wfToReconcile) {
      // Must not swallow workflow reconciliation errors. If OCC or update fails, abort before deleting draft!
      await workflowInstancesRepository.update(
        wfToReconcile.id,
        wfToReconcile.version,
        {
          entityId: approvedQuestion.id,
          entityType: 'QUESTION',
          contentStatus: 'APPROVED',
          lastTransitionAt: new Date().toISOString(),
          lastTransitionBy: actor.id,
        },
        {
          actorId: actor.id,
          timestamp: new Date().toISOString(),
        }
      );
    }

    // Remove draft only AFTER workflow instance has been successfully reconciled
    await questionDraftsRepository.delete(draftId);

    // Maintain draft-to-canonical ID alias for seamless continuity
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
      const err = new Error('Unauthorized: Only System Administrators can reconcile legacy draft author identities.');
      (err as any).statusCode = 403;
      throw err;
    }

    if (!authorUserId || !authorUserId.trim()) {
      const err = new Error('authorUserId is required to reconcile draft author identity.');
      (err as any).statusCode = 400;
      throw err;
    }

    const draft = await questionDraftsRepository.findById(draftId);
    if (!draft) {
      const err = new Error(`Draft with ID "${draftId}" not found for author reconciliation.`);
      (err as any).statusCode = 404;
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
      // Safe fallback for audit logging
    }

    return updated;
  }
}

export const questionDraftService = QuestionDraftService.getInstance();
