/**
 * BURRA PARIKSHA CMS - Phase 12 Review & Assignment Workflow Service
 */

import {
  contentMastersRepository,
  assignmentsRepository,
  usersRepository,
  auditLogRepository,
  workflowRepository,
  questionsRepository,
  videosRepository,
  scriptsRepository,
  thumbnailsRepository,
  pinnedCommentsRepository,
} from '../repositories';
import {
  ContentMaster,
  ContentMasterStatus,
  UserRole,
  Assignment,
  AssignmentStatus,
  Workflow,
  AuditLog,
} from '../../types';
import { ValidationError, ReferenceIntegrityError } from '../google-sheets/errors';

export interface WorkflowTransitionInput {
  contentMasterId: string;
  targetStatus: ContentMasterStatus;
  actor: { id: string; name: string; role: string };
  remarks?: string;
  versionHashOrNumber?: number; // Must match currentVersion for approval
}

export interface ReviewCommentInput {
  contentMasterId: string;
  actor: { id: string; name: string; role: string };
  commentText: string;
}

export class ContentWorkflowService {
  private static instance: ContentWorkflowService | null = null;

  private constructor() {}

  public static getInstance(): ContentWorkflowService {
    if (!ContentWorkflowService.instance) {
      ContentWorkflowService.instance = new ContentWorkflowService();
    }
    return ContentWorkflowService.instance;
  }

  /**
   * Helper: enforce that the actor has permission to perform workflow tasks.
   */
  public enforceRole(actorRole: string, allowedRoles: string[]) {
    const norm = String(actorRole).toUpperCase().trim();
    const normalizedAllowed = allowedRoles.map((r) => r.toUpperCase().trim());
    if (!normalizedAllowed.includes(norm)) {
      throw new ValidationError(`Unauthorized: Role "${actorRole}" is not authorized for this workflow action.`);
    }
  }

  /**
   * Initialize a newly created content master with default versioning properties.
   */
  public async initializeContentMaster(masterId: string): Promise<ContentMaster> {
    const master = await contentMastersRepository.findById(masterId);
    if (!master) {
      throw new ReferenceIntegrityError(`Content Master "${masterId}" not found.`);
    }

    const updated: ContentMaster = {
      ...master,
      status: ContentMasterStatus.DRAFT,
      currentVersion: master.currentVersion ?? 1,
      approvedVersion: master.approvedVersion ?? undefined,
      reviewComments: master.reviewComments ?? '',
    };

    return contentMastersRepository.update(masterId, updated);
  }

  /**
   * Assigns ownership of a content item to a real team member.
   */
  public async assignOwnership(
    contentMasterId: string,
    ownerId: string,
    actor: { id: string; name: string; role: string }
  ): Promise<ContentMaster> {
    // Enforce authorization
    this.enforceRole(actor.role, [UserRole.ADMIN, UserRole.CONTENT_MANAGER]);

    const master = await contentMastersRepository.findById(contentMasterId);
    if (!master) {
      throw new ReferenceIntegrityError(`Content Master "${contentMasterId}" not found.`);
    }

    const user = await usersRepository.findById(ownerId);
    if (!user) {
      throw new ReferenceIntegrityError(`User "${ownerId}" not found in USERS directory.`);
    }
    if (!user.isActive) {
      throw new ValidationError(`Cannot assign ownership to inactive user "${user.name}".`);
    }

    const previousOwnerId = master.ownerId;
    const previousOwnerName = master.ownerName;

    const updated: ContentMaster = {
      ...master,
      ownerId: user.id,
      ownerName: user.name,
      updatedAt: new Date().toISOString(),
    };

    const saved = await contentMastersRepository.update(contentMasterId, updated);

    // Audit log ownership change
    await auditLogRepository.logAction(
      actor.id,
      actor.name,
      'OWNERSHIP_CHANGE',
      'CONTENT_MASTER',
      contentMasterId,
      {
        previousOwnerId,
        previousOwnerName,
        newOwnerId: user.id,
        newOwnerName: user.name,
        timestamp: new Date().toISOString(),
      }
    );

    return saved;
  }

  /**
   * Assigns a reviewer to a content item.
   */
  public async assignReviewer(
    contentMasterId: string,
    reviewerId: string,
    actor: { id: string; name: string; role: string }
  ): Promise<ContentMaster> {
    // Enforce authorization (only Admin or Content Manager can assign reviewers)
    this.enforceRole(actor.role, [UserRole.ADMIN, UserRole.CONTENT_MANAGER]);

    const master = await contentMastersRepository.findById(contentMasterId);
    if (!master) {
      throw new ReferenceIntegrityError(`Content Master "${contentMasterId}" not found.`);
    }

    const user = await usersRepository.findById(reviewerId);
    if (!user) {
      throw new ReferenceIntegrityError(`Reviewer user "${reviewerId}" not found in USERS directory.`);
    }
    if (!user.isActive) {
      throw new ValidationError(`Cannot assign reviewer to inactive user "${user.name}".`);
    }

    // Verify reviewer's role permits reviewing
    this.enforceRole(user.role, [UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.REVIEWER]);

    const previousReviewerId = master.reviewerId;
    const previousReviewerName = master.reviewerName;

    const updated: ContentMaster = {
      ...master,
      reviewerId: user.id,
      reviewerName: user.name,
      updatedAt: new Date().toISOString(),
    };

    const saved = await contentMastersRepository.update(contentMasterId, updated);

    // Audit log reviewer change
    await auditLogRepository.logAction(
      actor.id,
      actor.name,
      'REVIEWER_ASSIGNMENT_CHANGE',
      'CONTENT_MASTER',
      contentMasterId,
      {
        previousReviewerId,
        previousReviewerName,
        newReviewerId: user.id,
        newReviewerName: user.name,
        timestamp: new Date().toISOString(),
      }
    );

    return saved;
  }

  /**
   * Creates an assignment for a content item. Enforces that any specified technical entities
   * are valid and do not belong to a different Content ID (cross-content protection).
   */
  public async createAssignment(
    contentMasterId: string,
    assigneeId: string,
    taskType: string,
    actor: { id: string; name: string; role: string },
    technicalEntity?: { entityType: string; entityId: string }
  ): Promise<Assignment> {
    // Enforce authorization
    this.enforceRole(actor.role, [UserRole.ADMIN, UserRole.CONTENT_MANAGER]);

    const master = await contentMastersRepository.findById(contentMasterId);
    if (!master) {
      throw new ReferenceIntegrityError(`Content Master "${contentMasterId}" not found.`);
    }

    const user = await usersRepository.findById(assigneeId);
    if (!user) {
      throw new ReferenceIntegrityError(`Assignee user "${assigneeId}" not found in USERS directory.`);
    }
    if (!user.isActive) {
      throw new ValidationError(`Cannot assign work to inactive user "${user.name}".`);
    }

    // Cross-content protection
    if (technicalEntity) {
      let entityContentId: string | undefined;

      switch (technicalEntity.entityType) {
        case 'QUESTION': {
          const q = await questionsRepository.findById(technicalEntity.entityId);
          if (q) entityContentId = q.contentId || q.contentMasterId;
          break;
        }
        case 'VIDEO': {
          const v = await videosRepository.findById(technicalEntity.entityId);
          if (v) entityContentId = v.contentId || v.contentMasterId;
          break;
        }
        case 'SCRIPT': {
          const s = await scriptsRepository.findById(technicalEntity.entityId);
          if (s) entityContentId = s.contentId || s.contentMasterId;
          break;
        }
        case 'THUMBNAIL': {
          const t = await thumbnailsRepository.findById(technicalEntity.entityId);
          if (t) entityContentId = t.contentId || t.contentMasterId;
          break;
        }
      }

      if (entityContentId && entityContentId !== contentMasterId) {
        throw new ValidationError(
          `Cross-content protection: Technical entity "${technicalEntity.entityId}" of type "${technicalEntity.entityType}" belongs to Content ID "${entityContentId}" which does not match assignment Content ID "${contentMasterId}".`
        );
      }
    }

    const assignmentId = `BP-ASN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();

    const assignment: Assignment = {
      id: assignmentId,
      contentId: contentMasterId,
      contentMasterId: contentMasterId,
      entityType: technicalEntity?.entityType as any,
      entityId: technicalEntity?.entityId,
      taskType: taskType,
      assigneeId: user.id,
      assigneeName: user.name,
      status: AssignmentStatus.ASSIGNED,
      priority: 'NORMAL' as any,
      assignedAt: now,
      createdAt: now,
    };

    const saved = await assignmentsRepository.create(assignment);

    // Audit assignment creation
    await auditLogRepository.logAction(
      actor.id,
      actor.name,
      'ASSIGNMENT_CREATION',
      'CONTENT_MASTER',
      contentMasterId,
      {
        assignmentId,
        assigneeId: user.id,
        assigneeName: user.name,
        taskType,
        entityType: technicalEntity?.entityType,
        entityId: technicalEntity?.entityId,
        timestamp: now,
      }
    );

    return saved;
  }

  /**
   * Adds a review comment that persists on the canonical Content ID.
   */
  public async addReviewComment(input: ReviewCommentInput): Promise<ContentMaster> {
    const master = await contentMastersRepository.findById(input.contentMasterId);
    if (!master) {
      throw new ReferenceIntegrityError(`Content Master "${input.contentMasterId}" not found.`);
    }

    const timestamp = new Date().toISOString();
    const commentRecord = {
      actorId: input.actor.id,
      actorName: input.actor.name,
      actorRole: input.actor.role,
      comment: input.commentText,
      timestamp,
    };

    const currentComments = master.reviewComments || '';
    const updatedComments = currentComments
      ? `${currentComments}\n--- COMMENT ---\n${JSON.stringify(commentRecord)}`
      : `--- COMMENT ---\n${JSON.stringify(commentRecord)}`;

    const updated: ContentMaster = {
      ...master,
      reviewComments: updatedComments,
      updatedAt: timestamp,
    };

    const saved = await contentMastersRepository.update(input.contentMasterId, updated);

    // Audit comment addition
    await auditLogRepository.logAction(
      input.actor.id,
      input.actor.name,
      'REVIEW_COMMENT_ADDED',
      'CONTENT_MASTER',
      input.contentMasterId,
      {
        comment: input.commentText,
        timestamp,
      }
    );

    return saved;
  }

  /**
   * Modifies the content of a ContentMaster (e.g., updates title or fields),
   * which automatically increments the currentVersion and invalidates previous approvals.
   */
  public async modifyContent(
    contentMasterId: string,
    updates: Partial<ContentMaster>,
    actor: { id: string; name: string; role: string }
  ): Promise<ContentMaster> {
    const master = await contentMastersRepository.findById(contentMasterId);
    if (!master) {
      throw new ReferenceIntegrityError(`Content Master "${contentMasterId}" not found.`);
    }

    const previousVersion = master.currentVersion ?? 1;
    const nextVersion = previousVersion + 1;
    const now = new Date().toISOString();

    // If previously approved, modify reverts it to DRAFT to enforce re-review
    const previousStatus = master.status;
    let targetStatus = master.status;
    if (master.status === ContentMasterStatus.APPROVED) {
      targetStatus = ContentMasterStatus.DRAFT;
    }

    const updated: ContentMaster = {
      ...master,
      ...updates,
      status: targetStatus,
      currentVersion: nextVersion,
      approvedVersion: undefined, // Clear approved version
      updatedAt: now,
    };

    const saved = await contentMastersRepository.update(contentMasterId, updated);

    // Audit content modification
    await auditLogRepository.logAction(
      actor.id,
      actor.name,
      'CONTENT_MODIFICATION_INCREMENT',
      'CONTENT_MASTER',
      contentMasterId,
      {
        previousStatus,
        newStatus: targetStatus,
        previousVersion,
        newVersion: nextVersion,
        timestamp: now,
      }
    );

    return saved;
  }

  /**
   * Performs workflow state transitions with rigid rules, auditing, and version tracking.
   */
  public async transitionWorkflowState(input: WorkflowTransitionInput): Promise<ContentMaster> {
    const { contentMasterId, targetStatus, actor, remarks, versionHashOrNumber } = input;

    // 1. Fetch Master
    const master = await contentMastersRepository.findById(contentMasterId);
    if (!master) {
      throw new ReferenceIntegrityError(`Content Master "${contentMasterId}" not found.`);
    }

    const currentStatus = master.status as ContentMasterStatus;
    const currentVersion = master.currentVersion ?? 1;

    // 2. Reject uncontrolled/invalid status values
    const validStatuses = [
      ContentMasterStatus.DRAFT,
      ContentMasterStatus.READY_FOR_REVIEW,
      ContentMasterStatus.CHANGES_REQUESTED,
      ContentMasterStatus.APPROVED,
    ];
    if (!validStatuses.includes(targetStatus)) {
      throw new ValidationError(`Invalid target status "${targetStatus}".`);
    }

    // 3. Strict State Transition Logic
    const ALLOWED: Record<ContentMasterStatus, ContentMasterStatus[]> = {
      [ContentMasterStatus.DRAFT]: [ContentMasterStatus.READY_FOR_REVIEW],
      [ContentMasterStatus.READY_FOR_REVIEW]: [ContentMasterStatus.CHANGES_REQUESTED, ContentMasterStatus.APPROVED],
      [ContentMasterStatus.CHANGES_REQUESTED]: [ContentMasterStatus.READY_FOR_REVIEW, ContentMasterStatus.DRAFT],
      [ContentMasterStatus.APPROVED]: [], // Approved is terminal for this core lifecycle flow
      // Aliases
      [ContentMasterStatus.ACTIVE]: [ContentMasterStatus.READY_FOR_REVIEW],
      [ContentMasterStatus.COMPLETED]: [],
      [ContentMasterStatus.SCHEDULED]: [],
      [ContentMasterStatus.PUBLISHED]: [],
      [ContentMasterStatus.ARCHIVED]: [],
    };

    const allowedNext = ALLOWED[currentStatus] || [];
    if (!allowedNext.includes(targetStatus)) {
      throw new ValidationError(
        `Invalid status transition: cannot move Content Master "${contentMasterId}" from "${currentStatus}" to "${targetStatus}".`
      );
    }

    // 4. APPROVED must not silently revert without explicit workflow actions
    if (currentStatus === ContentMasterStatus.APPROVED && targetStatus !== ContentMasterStatus.APPROVED) {
      throw new ValidationError(`Cannot revert an APPROVED Content Master status except through explicit modification.`);
    }

    // 5. Authorizations / RBAC Enforcements
    if (targetStatus === ContentMasterStatus.READY_FOR_REVIEW) {
      // Submitting for review is typically done by the owner, Content Manager, or Admin
      // But let's check roles
      this.enforceRole(actor.role, [UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.REVIEWER, UserRole.QUESTION_CREATOR, UserRole.CREATOR]);
    }

    if (targetStatus === ContentMasterStatus.CHANGES_REQUESTED || targetStatus === ContentMasterStatus.APPROVED) {
      // Reviewer operations require authorized roles: REVIEWER, CONTENT_MANAGER, or ADMIN
      this.enforceRole(actor.role, [UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.REVIEWER]);

      // Enforce assigned reviewer check if set
      if (master.reviewerId && master.reviewerId !== actor.id) {
        // Only the assigned reviewer (or Admin/Content Manager override) can perform review transitions
        const isAuthorizedOverride = actor.role === UserRole.ADMIN || actor.role === UserRole.CONTENT_MANAGER;
        if (!isAuthorizedOverride) {
          throw new ValidationError(
            `Unauthorized review action: User "${actor.id}" is not the assigned reviewer "${master.reviewerId}".`
          );
        }
      }

      // 6. Version Integrity checks
      if (versionHashOrNumber === undefined) {
        throw new ValidationError(`Version context is required to perform review approvals or request changes.`);
      }

      if (versionHashOrNumber !== currentVersion) {
        if (versionHashOrNumber < currentVersion) {
          throw new ValidationError(
            `Stale reviewer action: The review action was targeted at version ${versionHashOrNumber}, but the current version is ${currentVersion}.`
          );
        } else {
          throw new ValidationError(
            `Invalid version: Cannot approve version ${versionHashOrNumber} which exceeds current content version ${currentVersion}.`
          );
        }
      }
    }

    // 7. Apply updates
    const now = new Date().toISOString();
    const updated: ContentMaster = {
      ...master,
      status: targetStatus,
      updatedAt: now,
      ...(targetStatus === ContentMasterStatus.APPROVED ? { approvedVersion: currentVersion } : {}),
    };

    const saved = await contentMastersRepository.update(contentMasterId, updated);

    // 8. Log audit history
    await auditLogRepository.logAction(
      actor.id,
      actor.name,
      `WORKFLOW_TRANSITION_${targetStatus}`,
      'CONTENT_MASTER',
      contentMasterId,
      {
        previousStatus: currentStatus,
        newStatus: targetStatus,
        version: currentVersion,
        remarks: remarks || `Transitioned to ${targetStatus}`,
        timestamp: now,
      }
    );

    await workflowRepository.create({
      id: `WF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      contentId: contentMasterId,
      contentMasterId: contentMasterId,
      entityType: 'QUESTION', // For backward compatibility / schema enforcement
      entityId: master.primaryQuestionId || contentMasterId,
      fromStatus: currentStatus,
      toStatus: targetStatus,
      triggeredBy: actor.id,
      remarks: remarks || `Transitioned to ${targetStatus} for version ${currentVersion}`,
      timestamp: now,
    });

    return saved;
  }
}

export const contentWorkflowService = ContentWorkflowService.getInstance();
export const phase12WorkflowService = contentWorkflowService;
export type Phase12WorkflowService = ContentWorkflowService;
