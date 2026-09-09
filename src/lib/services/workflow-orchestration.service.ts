/**
 * BURRA PARIKSHA CMS - Workflow Orchestration Service
 * Phase 9: Cross-Domain Workflow Orchestration & Hard Safety Gates
 *
 * Centralizes cross-domain lifecycle coordination and enforces hard safety gates
 * across Questions, Validation, Videos, Social Packages, Reviews, Publishing, and Archiving.
 */

import {
  Question,
  QuestionStatus,
  QuestionValidationStatus,
  Video,
  VideoProductionStatus,
  SocialReviewStatus,
  UserRole,
  ContentMaster,
  ContentMasterStatus,
  SocialPublishStatus,
} from '../../types';
import { questionsRepository } from '../repositories/questions.repository';
import { videosRepository } from '../repositories/videos.repository';
import { contentMastersRepository } from '../repositories/content-masters.repository';
import { assignmentsRepository } from '../repositories/assignments.repository';
import { ObjectAuthorizationService, ActorContext } from './object-auth.service';
import { SocialReviewService } from './social-review.service';
import { publishingService, PublishingService } from './publishing.service';
import { auditService } from './audit.service';
import { workflowService } from './workflow.service';
import { contentMasterService } from './content-master.service';
import { ValidationError, ReferenceIntegrityError } from '../google-sheets/errors';

export enum CanonicalWorkflowState {
  DRAFT = 'DRAFT',
  VALIDATED = 'VALIDATED',
  READY_FOR_REVIEW = 'READY_FOR_REVIEW',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
  APPROVED = 'APPROVED',
  SCHEDULED = 'SCHEDULED',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
  IN_PRODUCTION = 'IN_PRODUCTION',
  IN_REVIEW = 'IN_REVIEW',
  READY_TO_PUBLISH = 'READY_TO_PUBLISH',
}

export interface CanonicalWorkflowSummary {
  questionId: string;
  canonicalState: CanonicalWorkflowState;
  questionStatus: QuestionStatus;
  questionValidationStatus: QuestionValidationStatus;
  videoStatus: VideoProductionStatus | 'NONE';
  socialReviewStatus: SocialReviewStatus | 'NONE';
  isReadyToPublish: boolean;
  blockers: string[];
}

export class WorkflowOrchestrationService {
  private static instance: WorkflowOrchestrationService | null = null;
  private objectAuthService: ObjectAuthorizationService;
  private publishingService: PublishingService;

  private constructor() {
    this.objectAuthService = ObjectAuthorizationService.getInstance();
    this.publishingService = publishingService;
  }

  public static getInstance(): WorkflowOrchestrationService {
    if (!WorkflowOrchestrationService.instance) {
      WorkflowOrchestrationService.instance = new WorkflowOrchestrationService();
    }
    return WorkflowOrchestrationService.instance;
  }

  /**
   * Calculates the canonical aggregate workflow state for a question.
   */
  public async getCanonicalWorkflowState(questionId: string): Promise<CanonicalWorkflowSummary> {
    const question = await questionsRepository.findById(questionId);
    if (!question) {
      throw new ReferenceIntegrityError(`Question with ID "${questionId}" was not found.`);
    }

    const blockers: string[] = [];

    // 1. Check ContentMaster Archive Status
    if (question.contentMasterId) {
      const cm = await contentMastersRepository.findById(question.contentMasterId);
      if (cm && cm.status === 'ARCHIVED') {
        return {
          questionId,
          canonicalState: CanonicalWorkflowState.ARCHIVED,
          questionStatus: question.status,
          questionValidationStatus: (question.validationStatus as QuestionValidationStatus) || QuestionValidationStatus.NOT_VALIDATED,
          videoStatus: 'NONE',
          socialReviewStatus: 'NONE',
          isReadyToPublish: false,
          blockers: ['Parent ContentMaster is ARCHIVED.'],
        };
      }
    }

    // 2. Fetch linked videos
    const videos = await videosRepository.findByQuestionId(questionId);
    const video = videos.length > 0 ? videos[0] : null;
    const videoStatus = video ? video.status : 'NONE';

    // 3. Fetch Social Review status
    let socialReviewStatus: SocialReviewStatus | 'NONE' = 'NONE';
    let currentVersionHash = '';
    let isVersionHashMatching = false;
    let latestReviewRecord: any = null;

    try {
      const bundle = await SocialReviewService.getReviewPackageBundle(questionId, question);
      socialReviewStatus = bundle.currentReviewStatus;
      currentVersionHash = bundle.currentVersionHash;
      latestReviewRecord = bundle.latestReviewRecord;
      if (latestReviewRecord) {
        isVersionHashMatching = latestReviewRecord.reviewedVersionHash === currentVersionHash;
      }
    } catch {
      // Social bundle not generated yet
    }

    // 4. Evaluate Publishing Readiness if video exists
    let isReadyToPublish = false;
    if (video) {
      try {
        const readiness = await this.publishingService.validatePublishReadiness(video.id, { skipAudit: true });
        const isSocialApproved = socialReviewStatus === SocialReviewStatus.APPROVED && isVersionHashMatching;
        const isQuestionValid = question.validationStatus === QuestionValidationStatus.VALID;

        if (!isSocialApproved) {
          readiness.blockers.push(`Social review is not APPROVED (Current status: ${socialReviewStatus}).`);
        }
        if (!isQuestionValid) {
          readiness.blockers.push(`Source question validation is not VALID (Current status: ${question.validationStatus}).`);
        }

        readiness.isReady = readiness.blockers.length === 0;
        isReadyToPublish = readiness.isReady;
        blockers.push(...readiness.blockers);
      } catch (err: any) {
        blockers.push(`Publish readiness error: ${err?.message || 'Unknown error'}`);
      }
    }

    // 5. Derive aggregate Canonical State
    const hasSubmittedReview = !!latestReviewRecord;
    let canonicalState = CanonicalWorkflowState.DRAFT;

    let pub: any = null;
    if (video) {
      try {
        pub = await this.publishingService.getPublishingByVideoId(video.id);
      } catch {
        // Safe fallback
      }
    }

    const isPublished = (pub && (
      pub.youtube?.status === SocialPublishStatus.PUBLISHED ||
      pub.instagram?.status === SocialPublishStatus.PUBLISHED ||
      pub.facebook?.status === SocialPublishStatus.PUBLISHED
    )) || videoStatus === VideoProductionStatus.UPLOADED;

    const isScheduled = pub && (
      pub.youtube?.status === SocialPublishStatus.SCHEDULED ||
      pub.instagram?.status === SocialPublishStatus.SCHEDULED ||
      pub.facebook?.status === SocialPublishStatus.SCHEDULED
    );

    const isApproved = question.status === QuestionStatus.APPROVED &&
                       socialReviewStatus === SocialReviewStatus.APPROVED &&
                       isVersionHashMatching;

    const isChangesRequested = ((socialReviewStatus === SocialReviewStatus.CHANGES_REQUESTED) && hasSubmittedReview) ||
                               question.validationStatus === QuestionValidationStatus.NEEDS_REVIEW;

    const isReadyForReview = question.status !== QuestionStatus.APPROVED &&
                             question.validationStatus === QuestionValidationStatus.VALID &&
                             socialReviewStatus === SocialReviewStatus.PENDING_REVIEW &&
                             hasSubmittedReview;

    if (isPublished) {
      canonicalState = CanonicalWorkflowState.PUBLISHED;
    } else if (isScheduled) {
      canonicalState = CanonicalWorkflowState.SCHEDULED;
    } else if (isApproved) {
      canonicalState = CanonicalWorkflowState.APPROVED;
    } else if (isChangesRequested) {
      canonicalState = CanonicalWorkflowState.CHANGES_REQUESTED;
    } else if (isReadyForReview) {
      canonicalState = CanonicalWorkflowState.READY_FOR_REVIEW;
    } else if (isReadyToPublish) {
      canonicalState = CanonicalWorkflowState.READY_TO_PUBLISH;
    } else if (
      hasSubmittedReview &&
      (socialReviewStatus === SocialReviewStatus.PENDING_REVIEW || socialReviewStatus === SocialReviewStatus.CHANGES_REQUESTED)
    ) {
      canonicalState = CanonicalWorkflowState.IN_REVIEW;
    } else if (
      videoStatus === VideoProductionStatus.QUEUED ||
      videoStatus === VideoProductionStatus.SCRIPT_REQUIRED ||
      videoStatus === VideoProductionStatus.SCRIPT_READY ||
      videoStatus === VideoProductionStatus.RECORDING ||
      videoStatus === VideoProductionStatus.RECORDED ||
      videoStatus === VideoProductionStatus.EDITING ||
      videoStatus === VideoProductionStatus.EDITED ||
      videoStatus === VideoProductionStatus.FINAL_REVIEW ||
      videoStatus === VideoProductionStatus.READY_TO_UPLOAD
    ) {
      canonicalState = CanonicalWorkflowState.IN_PRODUCTION;
    } else if (question.status === QuestionStatus.APPROVED) {
      canonicalState = CanonicalWorkflowState.APPROVED;
    } else if (question.validationStatus === QuestionValidationStatus.VALID) {
      canonicalState = CanonicalWorkflowState.VALIDATED;
    } else {
      canonicalState = CanonicalWorkflowState.DRAFT;
    }

    return {
      questionId,
      canonicalState,
      questionStatus: question.status,
      questionValidationStatus: (question.validationStatus as QuestionValidationStatus) || QuestionValidationStatus.NOT_VALIDATED,
      videoStatus,
      socialReviewStatus,
      isReadyToPublish,
      blockers,
    };
  }

  /**
   * Validates Question approval with Gate A:
   * ValidationStatus MUST be VALID prior to approving.
   */
  public async validateQuestionTransition(
    actor: ActorContext,
    questionId: string,
    targetStatus: QuestionStatus,
    remarks?: string
  ): Promise<Question> {
    const question = await questionsRepository.findById(questionId);
    if (!question) {
      throw new ReferenceIntegrityError(`Question with ID "${questionId}" was not found.`);
    }

    // Idempotency: If already in target status, return existing
    if (question.status === targetStatus) {
      return question;
    }

    // Object-level authorization check
    const canAccess = await this.objectAuthService.canAccessQuestion(actor, question);
    if (!canAccess) {
      throw new ValidationError(`Forbidden: Actor "${actor.id}" lacks authorization on question "${questionId}".`);
    }

    // Self-approval restriction (non-admin authors cannot approve their own questions)
    const roleStr = String(actor.role).toUpperCase();
    if (targetStatus === QuestionStatus.APPROVED) {
      if (question.authorId === actor.id && roleStr !== UserRole.ADMIN) {
        throw new ValidationError(`Self-approval forbidden: Author "${actor.id}" cannot approve their own question.`);
      }

      // Gate A: Hard check for validation status == VALID
      if (question.validationStatus !== QuestionValidationStatus.VALID) {
        throw new ValidationError(
          `Cannot approve question "${questionId}". Question validation status must be "VALID" (Current validation status: "${question.validationStatus || 'NOT_VALIDATED'}").`
        );
      }
    }

    const previousStatus = question.status;
    const updatedRecord: Partial<Question> = {
      ...question,
      status: targetStatus,
      updatedAt: new Date().toISOString(),
    };

    const saved = await questionsRepository.updateRecord(questionId, updatedRecord);
    if (!saved) {
      throw new Error(`Failed to update status for question "${questionId}".`);
    }

    // Record Audit and Workflow Transitions
    await auditService.log(
      actor.id,
      actor.name || actor.id,
      'WORKFLOW_QUESTION_STATUS_TRANSITION',
      'QUESTION',
      questionId,
      {
        fromStatus: previousStatus,
        toStatus: targetStatus,
        remarks: remarks || 'Validated question workflow transition',
      }
    );

    await workflowService.recordTransition(
      'QUESTION',
      questionId,
      previousStatus,
      targetStatus,
      actor.id,
      actor.name || actor.id,
      remarks || 'Question workflow transition'
    );

    return saved;
  }

  /**
   * Validates Video Queueing with Gate B:
   * Source Question MUST be APPROVED or VALID prior to queueing video.
   */
  public async validateVideoTransition(
    actor: ActorContext,
    videoId: string,
    targetStatus: VideoProductionStatus,
    remarks?: string
  ): Promise<Video> {
    const video = await videosRepository.findById(videoId);
    if (!video) {
      throw new ReferenceIntegrityError(`Video with ID "${videoId}" was not found.`);
    }

    if (video.status === targetStatus) {
      return video;
    }

    // Gate B: If moving to QUEUED, verify question approval/validation
    if (targetStatus === VideoProductionStatus.QUEUED && video.questionId) {
      const question = await questionsRepository.findById(video.questionId);
      if (question) {
        const isApprovedAndValid =
          question.status === QuestionStatus.APPROVED &&
          question.validationStatus === QuestionValidationStatus.VALID;

        if (!isApprovedAndValid) {
          throw new ValidationError(
            `Cannot queue video "${videoId}". Source question "${video.questionId}" must be APPROVED and VALID (Current Question Status: "${question.status}", Validation Status: "${question.validationStatus || 'NOT_VALIDATED'}").`
          );
        }
      }
    }

    const previousStatus = video.status;
    const updatedRecord: Partial<Video> = {
      ...video,
      status: targetStatus,
      updatedAt: new Date().toISOString(),
    };

    const saved = await videosRepository.updateRecord(videoId, updatedRecord);
    if (!saved) {
      throw new Error(`Failed to update video status for "${videoId}".`);
    }

    await auditService.log(
      actor.id,
      actor.name || actor.id,
      'WORKFLOW_VIDEO_STATUS_TRANSITION',
      'VIDEO',
      videoId,
      {
        fromStatus: previousStatus,
        toStatus: targetStatus,
        remarks: remarks || 'Validated video workflow transition',
      }
    );

    await workflowService.recordTransition(
      'VIDEO',
      videoId,
      previousStatus,
      targetStatus,
      actor.id,
      actor.name || actor.id,
      remarks || 'Video workflow transition'
    );

    return saved;
  }

  /**
   * Validates Social Review decision submission with Gate C:
   * Reviewed version hash must match current content fingerprint.
   */
  public async validateSocialReviewTransition(
    actor: ActorContext,
    questionId: string,
    decision: SocialReviewStatus,
    versionHash: string,
    remarks?: string
  ): Promise<any> {
    // 1. Role verification (ADMIN, CONTENT_MANAGER, REVIEWER)
    const roleStr = String(actor.role).toUpperCase();
    const allowedRoles = [UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.REVIEWER];
    if (!allowedRoles.includes(roleStr as UserRole)) {
      throw new ValidationError(`Forbidden: Role "${actor.role}" is not authorized for social review approval.`);
    }

    const question = await questionsRepository.findById(questionId);
    if (!question) {
      throw new ReferenceIntegrityError(`Question with ID "${questionId}" was not found.`);
    }

    // 2. Self-approval check (ADMIN exception)
    if (question.authorId === actor.id && roleStr !== UserRole.ADMIN) {
      throw new ValidationError(`Self-approval forbidden: Actor "${actor.id}" is the author of question "${questionId}".`);
    }

    // 3. Gate C: Version Hash Fingerprint check & Question validation check
    const bundle = await SocialReviewService.getReviewPackageBundle(questionId, question);

    const currentValStatus = bundle.validationStatus || bundle.question.validationStatus;
    if (currentValStatus !== QuestionValidationStatus.VALID) {
      throw new ValidationError(
        `Cannot approve social review for question "${questionId}". Source question validation status must be "VALID" (Current: "${currentValStatus}").`
      );
    }

    if (versionHash !== bundle.currentVersionHash) {
      throw new ValidationError(
        `Version hash mismatch: Submitted hash "${versionHash}" does not match current content fingerprint "${bundle.currentVersionHash}". Content was modified.`
      );
    }

    // 4. Submit review decision via SocialReviewService
    const result = await SocialReviewService.submitReviewDecision(
      questionId,
      {
        decision,
        versionHash,
        reason: remarks,
        isAdminOverride: roleStr === UserRole.ADMIN,
      } as any,
      { id: actor.id, name: actor.name || actor.id, role: actor.role || 'USER' },
      question
    );

    return result.record;
  }

  /**
   * Validates Publishing readiness with Gate D & Gate F:
   * Must pass master render checks + Social Review APPROVED with matching version hash.
   */
  public async validatePublishingTransition(
    actor: ActorContext,
    videoId: string,
    platform?: string
  ): Promise<any> {
    // 1. Role check (ADMIN, CONTENT_MANAGER, PUBLISHING_MANAGER)
    const roleStr = String(actor.role).toUpperCase();
    const allowedRoles = [UserRole.ADMIN, UserRole.CONTENT_MANAGER, UserRole.PUBLISHING_MANAGER];
    if (!allowedRoles.includes(roleStr as UserRole)) {
      throw new ValidationError(`Forbidden: Role "${actor.role}" is not authorized to execute publishing actions.`);
    }

    const video = await videosRepository.findById(videoId);
    if (!video) {
      throw new ReferenceIntegrityError(`Video with ID "${videoId}" was not found.`);
    }

    // 2. Base Publishing Readiness check
    const readiness = await this.publishingService.validatePublishReadiness(videoId, { actor: { id: actor.id, name: actor.name || actor.id } });

    // 3. Gate D: Check linked Question & Social Review approval
    if (video.questionId) {
      const question = await questionsRepository.findById(video.questionId);
      if (!question) {
        readiness.blockers.push(`Linked source question "${video.questionId}" not found.`);
      } else {
        if (question.validationStatus !== QuestionValidationStatus.VALID) {
          readiness.blockers.push(`Source question validation status is "${question.validationStatus}" (must be VALID).`);
        }

        try {
          const bundle = await SocialReviewService.getReviewPackageBundle(question.id, question);
          if (bundle.currentReviewStatus !== SocialReviewStatus.APPROVED) {
            readiness.blockers.push(
              `Social review status is "${bundle.currentReviewStatus}" (must be APPROVED before publishing).`
            );
          } else if (bundle.latestReviewRecord?.reviewedVersionHash !== bundle.currentVersionHash) {
            readiness.blockers.push(
              `Approved social review is STALE: Reviewed version hash does not match current content fingerprint.`
            );
          }
        } catch (err: any) {
          readiness.blockers.push(`Failed to verify social review approval: ${err?.message || 'Unknown error'}`);
        }
      }
    } else {
      readiness.blockers.push(`Video "${videoId}" has no linked questionId.`);
    }

    readiness.isReady = readiness.blockers.length === 0;

    if (!readiness.isReady) {
      throw new ValidationError(
        `Publishing blocked for video "${videoId}": ${readiness.blockers.join(' | ')}`
      );
    }

    await auditService.log(
      actor.id,
      actor.name || actor.id,
      'VALIDATE_PUBLISHING_TRANSITION',
      'PUBLISHING',
      videoId,
      {
        platform: platform || 'ALL',
        isReady: readiness.isReady,
      }
    );

    return readiness;
  }

  /**
   * Validates ContentMaster archiving with Gate E:
   * Protects active production and active assignments from accidental archiving.
   */
  public async validateArchiveTransition(
    actor: ActorContext,
    contentMasterId: string
  ): Promise<ContentMaster> {
    const roleStr = String(actor.role).toUpperCase();
    if (roleStr !== UserRole.ADMIN && roleStr !== UserRole.CONTENT_MANAGER) {
      throw new ValidationError(`Forbidden: Role "${actor.role}" is not authorized to archive ContentMasters.`);
    }

    const cm = await contentMastersRepository.findById(contentMasterId);
    if (!cm) {
      throw new ReferenceIntegrityError(`ContentMaster with ID "${contentMasterId}" was not found.`);
    }

    if (cm.status === 'ARCHIVED') {
      return cm;
    }

    // 1. Gate E: Check child questions for active video production
    const questions = await questionsRepository.findByContentMasterId(contentMasterId);
    const activeVideoStatuses = [
      VideoProductionStatus.QUEUED,
      VideoProductionStatus.SCRIPT_REQUIRED,
      VideoProductionStatus.SCRIPT_READY,
      VideoProductionStatus.RECORDING,
      VideoProductionStatus.RECORDED,
      VideoProductionStatus.EDITING,
      VideoProductionStatus.EDITED,
      VideoProductionStatus.FINAL_REVIEW,
      VideoProductionStatus.READY_TO_UPLOAD,
    ];

    for (const q of questions) {
      const videos = await videosRepository.findByQuestionId(q.id);
      for (const v of videos) {
        if (activeVideoStatuses.includes(v.status)) {
          throw new ValidationError(
            `Cannot archive ContentMaster "${contentMasterId}": Linked video "${v.id}" is actively in production (Status: "${v.status}").`
          );
        }
      }
    }

    // 2. Gate E: Check active assignments
    const assignments = await assignmentsRepository.findByContentMasterId(contentMasterId);
    const activeAssignments = assignments.filter((a) => a.status === 'PENDING' || a.status === 'IN_PROGRESS');
    if (activeAssignments.length > 0) {
      throw new ValidationError(
        `Cannot archive ContentMaster "${contentMasterId}": Has ${activeAssignments.length} active assignment(s).`
      );
    }

    const previousStatus = cm.status;
    const updatedCM: Partial<ContentMaster> = {
      ...cm,
      status: 'ARCHIVED',
      updatedAt: new Date().toISOString(),
    };

    const saved = await contentMastersRepository.updateRecord(contentMasterId, updatedCM);
    if (!saved) {
      throw new Error(`Failed to archive ContentMaster "${contentMasterId}".`);
    }

    await auditService.log(
      actor.id,
      actor.name || actor.id,
      'WORKFLOW_ARCHIVE_CONTENT_MASTER',
      'CONTENT_MASTER',
      contentMasterId,
      {
        fromStatus: previousStatus,
        toStatus: 'ARCHIVED',
      }
    );

    await workflowService.recordTransition(
      'CONTENT_MASTER',
      contentMasterId,
      previousStatus,
      'ARCHIVED',
      actor.id,
      actor.name || actor.id,
      'ContentMaster archived'
    );

    return saved;
  }

  /**
   * Orchestrates and validates the transition of a question and its components to a target canonical state.
   */
  public async transitionToCanonicalState(
    actor: ActorContext,
    questionId: string,
    targetState: CanonicalWorkflowState,
    remarks?: string,
    options?: {
      versionHash?: string;
      platform?: 'youtube' | 'instagram' | 'facebook';
      postUrl?: string;
    }
  ): Promise<CanonicalWorkflowSummary> {
    const question = await questionsRepository.findById(questionId);
    if (!question) {
      throw new ReferenceIntegrityError(`Question with ID "${questionId}" was not found.`);
    }

    const summaryBefore = await this.getCanonicalWorkflowState(questionId);
    const previousState = summaryBefore.canonicalState;

    if (previousState === targetState) {
      // Idempotent: return current summary if already in target state
      return summaryBefore;
    }

    // Role-based authorization pre-check (Admin override is always permitted)
    const roleStr = String(actor.role).toUpperCase();

    // Any state -> ARCHIVED must use existing archive protection from Step 1
    if (targetState === CanonicalWorkflowState.ARCHIVED) {
      if (!question.contentMasterId) {
        throw new ValidationError(`Cannot archive question "${questionId}": Parent contentMasterId is missing.`);
      }
      await this.validateArchiveTransition(actor, question.contentMasterId);
    } else {
      // General state transition verification (reject invalid/backward/unrelated transitions)
      const allowedNext: Record<CanonicalWorkflowState, CanonicalWorkflowState[]> = {
        [CanonicalWorkflowState.DRAFT]: [CanonicalWorkflowState.READY_FOR_REVIEW, CanonicalWorkflowState.ARCHIVED],
        [CanonicalWorkflowState.VALIDATED]: [CanonicalWorkflowState.READY_FOR_REVIEW, CanonicalWorkflowState.ARCHIVED],
        [CanonicalWorkflowState.READY_FOR_REVIEW]: [CanonicalWorkflowState.APPROVED, CanonicalWorkflowState.CHANGES_REQUESTED, CanonicalWorkflowState.ARCHIVED],
        [CanonicalWorkflowState.CHANGES_REQUESTED]: [CanonicalWorkflowState.READY_FOR_REVIEW, CanonicalWorkflowState.ARCHIVED],
        [CanonicalWorkflowState.APPROVED]: [CanonicalWorkflowState.SCHEDULED, CanonicalWorkflowState.ARCHIVED],
        [CanonicalWorkflowState.SCHEDULED]: [CanonicalWorkflowState.PUBLISHED, CanonicalWorkflowState.ARCHIVED],
        [CanonicalWorkflowState.PUBLISHED]: [CanonicalWorkflowState.ARCHIVED],
        [CanonicalWorkflowState.ARCHIVED]: [],
        [CanonicalWorkflowState.IN_PRODUCTION]: [CanonicalWorkflowState.READY_FOR_REVIEW, CanonicalWorkflowState.ARCHIVED],
        [CanonicalWorkflowState.IN_REVIEW]: [CanonicalWorkflowState.APPROVED, CanonicalWorkflowState.CHANGES_REQUESTED, CanonicalWorkflowState.ARCHIVED],
        [CanonicalWorkflowState.READY_TO_PUBLISH]: [CanonicalWorkflowState.SCHEDULED, CanonicalWorkflowState.ARCHIVED],
      };

      const nextStates = allowedNext[previousState] || [];
      if (!nextStates.includes(targetState) && roleStr !== UserRole.ADMIN) {
        throw new ValidationError(`Invalid transition: Cannot transition from canonical state "${previousState}" to "${targetState}".`);
      }

      // Execute subsystem validations & state updates
      if (targetState === CanonicalWorkflowState.READY_FOR_REVIEW) {
        // DRAFT -> READY_FOR_REVIEW must require all actual prerequisites for human review readiness
        if (question.validationStatus !== QuestionValidationStatus.VALID) {
          throw new ValidationError(`Prerequisite failed: Question validation status must be "VALID" (Current: "${question.validationStatus || 'NOT_VALIDATED'}").`);
        }
        // Transition social review status to PENDING_REVIEW if not already
        if (summaryBefore.socialReviewStatus === 'NONE' || (summaryBefore.socialReviewStatus as string) === 'DRAFT') {
          const bundle = await SocialReviewService.getReviewPackageBundle(questionId, question);
          await SocialReviewService.submitReviewDecision(
            questionId,
            {
              decision: SocialReviewStatus.PENDING_REVIEW,
              versionHash: bundle.currentVersionHash,
              reason: remarks || 'Ready for review transition',
            } as any,
            { id: actor.id, name: actor.name || actor.id, role: actor.role || 'USER' },
            question
          );
        }
      } else if (targetState === CanonicalWorkflowState.APPROVED) {
        // READY_FOR_REVIEW -> APPROVED must require valid question/content approval AND current, non-stale human social review approval
        const bundle = await SocialReviewService.getReviewPackageBundle(questionId, question);
        const versionHash = options?.versionHash || bundle.currentVersionHash;

        // Perform Gates and role verification
        await this.validateQuestionTransition(actor, questionId, QuestionStatus.APPROVED, remarks);
        await this.validateSocialReviewTransition(actor, questionId, SocialReviewStatus.APPROVED, versionHash, remarks);
      } else if (targetState === CanonicalWorkflowState.CHANGES_REQUESTED) {
        const bundle = await SocialReviewService.getReviewPackageBundle(questionId, question);
        const versionHash = options?.versionHash || bundle.currentVersionHash;
        await this.validateSocialReviewTransition(actor, questionId, SocialReviewStatus.CHANGES_REQUESTED, versionHash, remarks);
      } else if (targetState === CanonicalWorkflowState.SCHEDULED) {
        // APPROVED -> SCHEDULED must require current publishing readiness
        const videos = await videosRepository.findByQuestionId(questionId);
        const video = videos.length > 0 ? videos[0] : null;
        if (!video) {
          throw new ValidationError(`Cannot schedule: Video record not found for question "${questionId}".`);
        }

        // Validate publishing readiness (Gate D & F)
        await this.validatePublishingTransition(actor, video.id);

        // Transition platform status to SCHEDULED
        const pub = await this.publishingService.getPublishingByVideoId(video.id);
        if (pub) {
          await this.publishingService.updatePublishingRecord(pub.id, {
            youtube: { ...pub.youtube, status: SocialPublishStatus.SCHEDULED },
            instagram: { ...pub.instagram, status: SocialPublishStatus.SCHEDULED },
            facebook: { ...pub.facebook, status: SocialPublishStatus.SCHEDULED },
          }, actor, { bypassStateValidation: true });
        }
      } else if (targetState === CanonicalWorkflowState.PUBLISHED) {
        // SCHEDULED -> PUBLISHED must require actual successful platform publication
        const videos = await videosRepository.findByQuestionId(questionId);
        const video = videos.length > 0 ? videos[0] : null;
        if (!video) {
          throw new ValidationError(`Cannot publish: Video record not found for question "${questionId}".`);
        }

        const platform = options?.platform || 'youtube';
        const postUrl = options?.postUrl || `https://${platform}.com/watch?v=BP-${video.id}`;
        await this.publishingService.markPlatformPublished(video.id, platform, postUrl, actor, remarks);
      }
    }

    // 5. Audit & Workflow Logging for the canonical transition
    await auditService.log(
      actor.id,
      actor.name || actor.id,
      'CANONICAL_WORKFLOW_STATE_TRANSITION',
      'QUESTION',
      questionId,
      {
        fromState: previousState,
        toState: targetState,
        remarks: remarks || `Canonical state transitioned to ${targetState}`,
      }
    );

    await workflowService.recordTransition(
      'QUESTION',
      questionId,
      previousState,
      targetState,
      actor.id,
      actor.name || actor.id,
      remarks || `Canonical state transitioned to ${targetState}`
    );

    return this.getCanonicalWorkflowState(questionId);
  }

  /**
   * Phase 16.2: Retrieve authoritative canonical lifecycle state for a Content Master.
   */
  public async getCanonicalContentMasterState(contentMasterId: string) {
    return contentMasterService.getCanonicalState(contentMasterId);
  }

  /**
   * Phase 16.2: Transition Content Master status via authoritative lifecycle rules.
   */
  public async transitionContentMasterStatus(
    actor: ActorContext,
    contentMasterId: string,
    targetStatus: ContentMasterStatus,
    remarks?: string
  ) {
    return contentMasterService.transitionStatus(contentMasterId, targetStatus, actor, remarks);
  }
}

export const workflowOrchestrationService = WorkflowOrchestrationService.getInstance();
