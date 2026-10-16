/**
 * BURRA PARIKSHA CMS — Authoritative Shared Dynamic Workflow Resolver
 * Location: shared/lib/workflow-resolver.ts
 *
 * Implements specifications from:
 * - docs/sprints/sprint-08/S8-T06-CONTENT-MODE-REGISTRY-DESIGN.md
 * - docs/sprints/sprint-08/S8-T07-WORKFLOW-RESOLUTION-TRANSITION-DESIGN.md
 *
 * Integrates:
 * 1. Approved Content-Mode Registry (Modes 1, 2, 3)
 * 2. Canonical 15-Step Workflow State Machine
 * 3. Mode-specific applicability & checklist gating
 * 4. GAR-02 Anti-Self-Approval enforcement
 * 5. Deterministic progress calculation strictly from applicable steps
 * 6. Multi-dimensional orthogonal state decoupling
 */

import {
  WorkflowStepNumber,
  CANONICAL_WORKFLOW_STEPS,
  WorkflowStageStatus,
} from '../constants/workflow';
import { CanonicalRbacRole } from '../constants/roles';
import {
  WorkflowResolutionInput,
  ResolvedWorkflowState,
  ResolvedWorkflowStep,
  ResolvedWorkflowProgress,
  ResolvedWorkflowAction,
} from '../contracts/workflow';
import { contentModeRegistry } from '../registry/content-mode.registry';
import { ContentProductionMode } from '../types/production-context';

/**
 * Standard routing map for canonical stages
 */
export function getStandardStageRoute(stepNumber: WorkflowStepNumber, entityId?: string): string {
  const idParam = entityId ? encodeURIComponent(entityId) : ':id';
  switch (stepNumber) {
    case 1:
      return entityId ? `/studio?draftId=${idParam}` : '/studio';
    case 2:
      return entityId ? `/questions/${idParam}/verify` : '/questions/verify';
    case 3:
      return `/videos/${idParam}?tab=script`;
    case 4:
      return `/videos/${idParam}?tab=recording`;
    case 5:
      return `/videos/${idParam}?tab=media`;
    case 6:
      return `/videos/${idParam}?tab=editing`;
    case 7:
      return `/videos/${idParam}?tab=final-review`;
    case 8:
      return `/videos/${idParam}?tab=thumbnail`;
    case 9:
      return `/videos/${idParam}?tab=social`;
    case 10:
      return `/publishing?tab=setup&id=${idParam}`;
    case 11:
      return `/publishing?tab=live&id=${idParam}`;
    case 12:
      return `/publishing?tab=sync&id=${idParam}`;
    case 13:
      return `/analytics?id=${idParam}`;
    case 14:
      return `/analytics?tab=performance&id=${idParam}`;
    case 15:
      return `/intelligence?id=${idParam}`;
    default:
      return '/studio';
  }
}

/**
 * Evaluates actor capability possession
 */
function actorHasCapability(
  roles: string[] | undefined,
  requiredCapability: string
): boolean {
  if (!roles || roles.length === 0) return false;
  if (roles.includes(CanonicalRbacRole.ADMIN) || roles.includes('ADMIN')) return true;

  // Role-to-capability mappings
  const capabilityRoleMap: Record<string, string[]> = {
    'QUESTION:CREATE': [CanonicalRbacRole.QUESTION_AUTHOR, CanonicalRbacRole.ADMIN],
    'QUESTION:EDIT': [CanonicalRbacRole.QUESTION_AUTHOR, CanonicalRbacRole.ADMIN],
    'QUESTION:SUBMIT': [CanonicalRbacRole.QUESTION_AUTHOR, CanonicalRbacRole.ADMIN],
    'QUESTION:APPROVE': [CanonicalRbacRole.QA_REVIEWER, CanonicalRbacRole.ADMIN],
    'QUESTION:REJECT': [CanonicalRbacRole.QA_REVIEWER, CanonicalRbacRole.ADMIN],
    'SCRIPT:SUBMIT': [CanonicalRbacRole.SCRIPTWRITER, CanonicalRbacRole.ADMIN],
    'SCRIPT:EDIT': [CanonicalRbacRole.SCRIPTWRITER, CanonicalRbacRole.ADMIN],
    'VIDEO:RECORD': [CanonicalRbacRole.PRESENTER, CanonicalRbacRole.ADMIN],
    'VIDEO:UPLOAD': [CanonicalRbacRole.VIDEO_EDITOR, CanonicalRbacRole.ADMIN],
    'MEDIA_REFERENCE:UPLOAD': [CanonicalRbacRole.VIDEO_EDITOR, CanonicalRbacRole.ADMIN],
    'VIDEO:EDIT': [CanonicalRbacRole.VIDEO_EDITOR, CanonicalRbacRole.ADMIN],
    'VIDEO_EDIT:EDIT': [CanonicalRbacRole.VIDEO_EDITOR, CanonicalRbacRole.ADMIN],
    'VIDEO_EDIT:SUBMIT': [CanonicalRbacRole.VIDEO_EDITOR, CanonicalRbacRole.ADMIN],
    'VIDEO:APPROVE': [CanonicalRbacRole.QA_REVIEWER, CanonicalRbacRole.ADMIN],
    'VIDEO_EDIT:APPROVE': [CanonicalRbacRole.QA_REVIEWER, CanonicalRbacRole.ADMIN],
    'VIDEO_EDIT:REJECT': [CanonicalRbacRole.QA_REVIEWER, CanonicalRbacRole.ADMIN],
    'THUMBNAIL:SUBMIT': [CanonicalRbacRole.DESIGNER, CanonicalRbacRole.ADMIN],
    'CONTENT:APPROVE': [CanonicalRbacRole.CONTENT_LEAD, CanonicalRbacRole.ADMIN],
    'SOCIAL_REVIEW:APPROVE': [CanonicalRbacRole.CONTENT_LEAD, CanonicalRbacRole.ADMIN],
    'SOCIAL_REVIEW:REJECT': [CanonicalRbacRole.CONTENT_LEAD, CanonicalRbacRole.ADMIN],
    'PUBLICATION:SCHEDULE': [CanonicalRbacRole.PUBLISHING_LEAD, CanonicalRbacRole.ADMIN],
    'PUBLISHING_PACKAGE:EDIT': [CanonicalRbacRole.PUBLISHING_LEAD, CanonicalRbacRole.ADMIN],
    'PUBLICATION:PUBLISH': [CanonicalRbacRole.PUBLISHING_LEAD, CanonicalRbacRole.ADMIN],
    'PLATFORM:SYNC': [CanonicalRbacRole.PUBLISHING_LEAD, CanonicalRbacRole.ADMIN],
    'PUBLICATION:SYNC': [CanonicalRbacRole.PUBLISHING_LEAD, CanonicalRbacRole.ADMIN],
    'ANALYTICS:VIEW': [CanonicalRbacRole.ANALYST, CanonicalRbacRole.ADMIN],
    'ANALYTICS_SNAPSHOT:VIEW': [CanonicalRbacRole.ANALYST, CanonicalRbacRole.ADMIN],
    'PERFORMANCE:ANALYZE': [CanonicalRbacRole.CONTENT_LEAD, CanonicalRbacRole.ADMIN],
    'PERFORMANCE_RECORD:REVIEW': [CanonicalRbacRole.CONTENT_LEAD, CanonicalRbacRole.ADMIN],
    'INTELLIGENCE:CLOSE_LOOP': [CanonicalRbacRole.CONTENT_LEAD, CanonicalRbacRole.ADMIN],
    'INTELLIGENCE_INSIGHT:APPROVE': [CanonicalRbacRole.CONTENT_LEAD, CanonicalRbacRole.ADMIN],
  };

  const allowedRoles = capabilityRoleMap[requiredCapability] || [];
  return roles.some((r) => allowedRoles.includes(r));
}

/**
 * Pure function: Resolves dynamic workflow state for an asset and content production mode.
 */
export function resolveDynamicWorkflow(input: WorkflowResolutionInput): ResolvedWorkflowState {
  const entityId = input.entityId || 'temp_entity';
  const entityType = input.entityType || 'QUESTION';
  const persisted = input.persistedWorkflow || {};
  const entityData = input.entityData || {};
  const actor = input.actor;

  // 1. Resolve Mode & Registry Definition safely
  let rawMode = (
    input.productionMode ||
    (persisted.metadata?.productionMode as string) ||
    (entityData.productionMode as string) ||
    'QUESTION_CHALLENGE_SHORT'
  ).trim();

  let mode: ContentProductionMode = 'QUESTION_CHALLENGE_SHORT';
  if (contentModeRegistry.hasDefinition(rawMode)) {
    mode = rawMode as ContentProductionMode;
  } else {
    // Graceful fallback for unknown mode
    mode = 'QUESTION_CHALLENGE_SHORT';
  }

  const modeDef = contentModeRegistry.getDefinition(mode);

  // 2. Resolve Multi-Dimensional Persisted State
  const contentStatus = (
    persisted.contentStatus ||
    (entityData.contentStatus as string) ||
    (entityData.status as string) ||
    'DRAFT'
  ).toUpperCase();

  const mediaStatus = (
    persisted.mediaStatus ||
    (entityData.mediaStatus as string) ||
    'NOT_REQUIRED'
  ).toUpperCase();

  const publicationStatus = (
    persisted.publicationStatus ||
    (entityData.publicationStatus as string) ||
    'UNPUBLISHED'
  ).toUpperCase();

  const jobStatus = (
    persisted.jobStatus ||
    (entityData.jobStatus as string) ||
    'IDLE'
  ).toUpperCase();

  const version = typeof persisted.version === 'number' ? persisted.version : 1;
  const ownerId = persisted.authorId || (entityData.authorId as string) || (entityData.authorUserId as string) || '';
  const lastTransitionAt = persisted.lastTransitionAt || new Date().toISOString();
  const lastTransitionBy = persisted.lastTransitionBy || '';

  // 3. Resolve Authoritative Current Step
  let currentStep: WorkflowStepNumber = 1;
  if (typeof persisted.currentStep === 'number') {
    currentStep = Math.min(15, Math.max(1, persisted.currentStep)) as WorkflowStepNumber;
  } else if (typeof entityData.currentStep === 'number') {
    currentStep = Math.min(15, Math.max(1, entityData.currentStep)) as WorkflowStepNumber;
  } else {
    // Derive step from entity status if no workflow record exists
    if (publicationStatus === 'LIVE' || publicationStatus === 'SYNCED') {
      currentStep = publicationStatus === 'SYNCED' ? 13 : 12;
    } else if (publicationStatus === 'SCHEDULED') {
      currentStep = 11;
    } else if (contentStatus === 'APPROVED') {
      currentStep = 3;
    } else if (contentStatus === 'IN_REVIEW' || contentStatus === 'PENDING_REVIEW') {
      currentStep = 2;
    } else {
      currentStep = 1;
    }
  }

  // 4. Resolve Stage Status and Terminal State
  let isTerminal = false;
  let stageStatus: WorkflowStageStatus = 'IN_PROGRESS';

  if (currentStep === 1) {
    if (contentStatus === 'DRAFT') stageStatus = 'DRAFT';
    else if (contentStatus === 'IN_REVIEW') stageStatus = 'PENDING_REVIEW';
    else stageStatus = 'DRAFT';
  } else if (currentStep === 2) {
    if (contentStatus === 'APPROVED') stageStatus = 'APPROVED';
    else if (contentStatus === 'REJECTED' || contentStatus === 'CHANGES_REQUESTED') stageStatus = 'CHANGES_REQUESTED';
    else stageStatus = 'PENDING_REVIEW';
  } else if (currentStep === 7) {
    if (mediaStatus === 'READY' && contentStatus === 'APPROVED') stageStatus = 'APPROVED';
    else if (contentStatus === 'REJECTED') stageStatus = 'CHANGES_REQUESTED';
    else stageStatus = 'PENDING_REVIEW';
  } else if (currentStep === 9) {
    if (contentStatus === 'APPROVED') stageStatus = 'APPROVED';
    else stageStatus = 'PENDING_REVIEW';
  } else if (currentStep === 11) {
    stageStatus = publicationStatus === 'LIVE' ? 'PUBLISHED' : 'SCHEDULED';
  } else if (currentStep === 12) {
    stageStatus = publicationStatus === 'SYNCED' ? 'SYNCED' : 'IN_PROGRESS';
  } else if (currentStep === 15) {
    if (contentStatus === 'ARCHIVED' || jobStatus === 'COMPLETED' || publicationStatus === 'SYNCED') {
      stageStatus = 'COMPLETED';
      isTerminal = true;
    }
  }

  if (contentStatus === 'TERMINATED' || contentStatus === 'ARCHIVED') {
    isTerminal = true;
    if (contentStatus === 'TERMINATED') stageStatus = 'TERMINATED';
    if (contentStatus === 'ARCHIVED') stageStatus = 'COMPLETED';
  }

  // 5. Evaluate Step Prerequisites and Applicability across all 15 Canonical Steps
  const applicableStepNumbers = modeDef.applicableStages || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];

  const resolvedSteps: ResolvedWorkflowStep[] = [];
  for (let s = 1; s <= 15; s++) {
    const stepNum = s as WorkflowStepNumber;
    const def = CANONICAL_WORKFLOW_STEPS[stepNum];
    const isApplicable = applicableStepNumbers.includes(stepNum);
    const isCurrent = !isTerminal && stepNum === currentStep;

    let isCompleted = false;
    if (isTerminal) {
      isCompleted = isApplicable;
    } else {
      isCompleted = isApplicable && stepNum < currentStep;
      if (stepNum === 1 && currentStep === 1 && (contentStatus === 'IN_REVIEW' || contentStatus === 'APPROVED')) {
        isCompleted = true;
      }
      if (stepNum === 2 && (contentStatus === 'APPROVED' || currentStep > 2)) {
        isCompleted = true;
      }
    }

    let isBlocked = false;
    let blockerReason: string | undefined = undefined;

    // Prerequisite evaluations per mode
    if (stepNum === 1) {
      const topicId = (entityData.topicId as string) || '';
      const subtopicId = (entityData.subtopicId as string) || '';
      if (!topicId || !subtopicId) {
        isBlocked = true;
        blockerReason = 'Two-tier taxonomy (Topic and Subtopic) must be selected before authoring.';
      }
    } else if (stepNum === 2) {
      // Step 02 Question Verification Gate
      if (mode === 'QUESTION_CHALLENGE_SHORT') {
        const questionText = (entityData.questionText as string) || (entityData.text as string) || '';
        const options = Array.isArray(entityData.options) ? entityData.options : [];
        const correctAnswer = (entityData.correctAnswer as string) || (entityData.answer as string) || '';
        const proof = (entityData.proof as string) || (entityData.proofSteps as string) || '';

        if (!questionText.trim()) {
          isBlocked = true;
          blockerReason = 'Question text is required before submitting for verification.';
        } else if (options.length < 4) {
          isBlocked = true;
          blockerReason = 'Exactly 4 distinct MCQ options (a, b, c, d) are required for Question Challenge Short.';
        } else if (!correctAnswer) {
          isBlocked = true;
          blockerReason = 'Correct answer key is required.';
        } else if (!proof.trim()) {
          isBlocked = true;
          blockerReason = 'Mathematical derivation proof is mandatory.';
        }
      } else if (mode === 'TOPIC_INTRODUCTION') {
        const conceptTitle = (entityData.conceptTitle as string) || '';
        const introductoryConcept = (entityData.introductoryConcept as string) || (entityData.questionText as string) || '';
        const options = Array.isArray(entityData.options) ? entityData.options : [];

        if (options.length > 0) {
          isBlocked = true;
          blockerReason = 'Topic Introduction mode strictly prohibits practice question options (N=0).';
        } else if (!conceptTitle.trim() && !introductoryConcept.trim()) {
          isBlocked = true;
          blockerReason = 'Concept overview title and introductory concept notes are required.';
        }
      } else if (mode === 'EXPLAINED_QUESTIONS_VIDEO') {
        const questions = Array.isArray(entityData.questions) ? entityData.questions : [];
        const targetCount = typeof entityData.targetQuestionCount === 'number' ? entityData.targetQuestionCount : 10;
        if (![5, 10, 15, 20].includes(targetCount)) {
          isBlocked = true;
          blockerReason = 'Explained Questions Video requires strictly 5, 10, 15, or 20 questions.';
        } else if (questions.length < targetCount) {
          isBlocked = true;
          blockerReason = `Explained Questions Video requires all ${targetCount} practice questions before verification (found ${questions.length}).`;
        }
      }
    } else if (stepNum === 3) {
      if (contentStatus !== 'APPROVED' && currentStep < 3) {
        isBlocked = true;
        blockerReason = 'Content must pass Step 02 verification before audience script can be drafted.';
      }
    } else if (stepNum === 4) {
      if (currentStep < 4) {
        isBlocked = true;
        blockerReason = 'Audience script must be approved before studio filming.';
      }
    } else if (stepNum === 6) {
      if (mediaStatus === 'FAILED') {
        isBlocked = true;
        blockerReason = 'Raw video footage upload failed; unusable media.';
      } else if (currentStep < 6) {
        isBlocked = true;
        blockerReason = 'Raw video takes must be logged before entering editing bay.';
      }
    } else if (stepNum === 7) {
      // Step 07 Final QC is a mandatory gate across all modes
      if (currentStep < 7) {
        isBlocked = true;
        blockerReason = 'Final master video cut must be rendered before Final QC.';
      }
    } else if (stepNum === 8) {
      if (currentStep < 8 && stageStatus !== 'APPROVED') {
        isBlocked = true;
        blockerReason = 'Final QC approval is mandatory before thumbnail locking.';
      }
    } else if (stepNum === 10) {
      if (currentStep < 10) {
        isBlocked = true;
        blockerReason = 'Social package review must be approved before configuring publishing schedule.';
      }
    } else if (stepNum === 11) {
      if (publicationStatus === 'FAILED' || mediaStatus === 'FAILED') {
        isBlocked = true;
        blockerReason = 'Cannot publish: asset media status is failed.';
      } else if (currentStep < 11) {
        isBlocked = true;
        blockerReason = 'Publishing package must be configured and scheduled before live publication.';
      }
    }

    // Determine checklist type for verification stages
    let applicableChecklistType: string | undefined = undefined;
    if (stepNum === 2) {
      applicableChecklistType = modeDef.verification.checklistType;
    } else if (stepNum === 7) {
      applicableChecklistType = 'FINAL_QC_CHECKLIST';
    } else if (stepNum === 9) {
      applicableChecklistType = 'SOCIAL_REVIEW_CHECKLIST';
    }

    resolvedSteps.push({
      stepNumber: stepNum,
      code: def.code,
      name: def.name,
      shortName: def.shortName,
      description: def.description,
      isApplicable,
      isConditional: !isApplicable,
      isCurrent,
      isCompleted,
      isBlocked,
      blockerReason,
      applicableChecklistType,
      route: getStandardStageRoute(stepNum, entityId),
    });
  }

  // 6. Calculate Progress STRICTLY from Applicable Steps
  // Non-applicable steps are never counted in total or completed!
  const applicableSteps = resolvedSteps.filter((s) => s.isApplicable);
  const totalApplicableSteps = applicableSteps.length;
  const completedApplicableSteps = isTerminal
    ? totalApplicableSteps
    : applicableSteps.filter((s) => s.isCompleted).length;

  const percentage = totalApplicableSteps > 0
    ? Math.min(100, Math.round((completedApplicableSteps / totalApplicableSteps) * 100))
    : 0;

  const currentDef = CANONICAL_WORKFLOW_STEPS[currentStep];

  const progress: ResolvedWorkflowProgress = {
    currentStage: currentStep,
    currentStageCode: currentDef.code,
    currentStageName: currentDef.name,
    stageStatus,
    completedApplicableSteps,
    totalApplicableSteps,
    percentage,
  };

  // 7. Resolve Permitted Actions & Next Permitted Action
  const actorId = actor?.id?.trim() || '';
  const actorRoles = actor?.roles || (actor?.role ? [actor.role] : []);
  const isAuthor = Boolean(ownerId && actorId && ownerId.trim() === actorId);

  const candidateActions: ResolvedWorkflowAction[] = [];
  let isGar02Restricted = false;

  if (!isTerminal) {
    if (currentStep === 1) {
      // Step 01: Save Draft and Submit for Verification
      const canCreate = actorHasCapability(actorRoles, 'QUESTION:CREATE');
      const canSubmit = actorHasCapability(actorRoles, 'QUESTION:SUBMIT');
      const step1Blocked = resolvedSteps[0].isBlocked;
      const step2Blocked = resolvedSteps[1].isBlocked;

      candidateActions.push({
        actionId: 'SAVE_DRAFT',
        label: 'Save Draft',
        actionType: 'FORWARD',
        targetStep: 1,
        isAvailable: canCreate,
        requiredCapability: 'QUESTION:CREATE',
        blockedReason: !canCreate ? 'Requires capability QUESTION:CREATE' : undefined,
        route: getStandardStageRoute(1, entityId),
      });

      candidateActions.push({
        actionId: 'QUESTION_SUBMIT',
        label: 'Submit for Verification',
        actionType: 'FORWARD',
        targetStep: 2,
        isAvailable: canSubmit && !step1Blocked && !step2Blocked,
        requiredCapability: 'QUESTION:SUBMIT',
        blockedReason: !canSubmit
          ? 'Requires capability QUESTION:SUBMIT'
          : step2Blocked
            ? resolvedSteps[1].blockerReason
            : undefined,
        route: getStandardStageRoute(2, entityId),
      });
    } else if (currentStep === 2) {
      // Step 02: Verification (Human Gate with GAR-02 Segregation of Duties)
      const canApprove = actorHasCapability(actorRoles, 'QUESTION:APPROVE');
      const canReject = actorHasCapability(actorRoles, 'QUESTION:REJECT');

      // GAR-02 Rule: authorId !== approverId
      if (isAuthor) {
        isGar02Restricted = true;
      }

      candidateActions.push({
        actionId: 'QUESTION_APPROVE',
        label: 'Approve & Unlock Production',
        actionType: 'FORWARD',
        targetStep: 3,
        isAvailable: canApprove && !isAuthor,
        requiredCapability: 'QUESTION:APPROVE',
        isGar02Restricted: isAuthor,
        blockedReason: isAuthor
          ? 'Self-approval strictly prohibited under GAR-02 segregation of duties: Author cannot approve own work.'
          : !canApprove
            ? 'Requires capability QUESTION:APPROVE'
            : undefined,
        route: getStandardStageRoute(3, entityId),
      });

      candidateActions.push({
        actionId: 'QUESTION_REQUEST_CHANGES',
        label: 'Request Changes',
        actionType: 'REVISION',
        targetStep: 1,
        isAvailable: canReject,
        requiredCapability: 'QUESTION:REJECT',
        blockedReason: !canReject ? 'Requires capability QUESTION:REJECT' : undefined,
        route: getStandardStageRoute(1, entityId),
      });

      candidateActions.push({
        actionId: 'QUESTION_TERMINATE',
        label: 'Terminate Unrecoverable Item',
        actionType: 'TERMINAL',
        targetStep: 2,
        isAvailable: canReject,
        requiredCapability: 'QUESTION:REJECT',
        blockedReason: !canReject ? 'Requires capability QUESTION:REJECT' : undefined,
      });
    } else if (currentStep === 3) {
      const canEdit = actorHasCapability(actorRoles, 'SCRIPT:EDIT');
      const canSubmit = actorHasCapability(actorRoles, 'SCRIPT:SUBMIT');

      candidateActions.push({
        actionId: 'SAVE_SCRIPT_DRAFT',
        label: 'Save Script Draft',
        actionType: 'FORWARD',
        targetStep: 3,
        isAvailable: canEdit,
        requiredCapability: 'SCRIPT:EDIT',
        blockedReason: !canEdit ? 'Requires capability SCRIPT:EDIT' : undefined,
      });

      candidateActions.push({
        actionId: 'SCRIPT_SUBMIT',
        label: 'Lock Script & Dispatch Filming',
        actionType: 'FORWARD',
        targetStep: 4,
        isAvailable: canSubmit,
        requiredCapability: 'SCRIPT:SUBMIT',
        blockedReason: !canSubmit ? 'Requires capability SCRIPT:SUBMIT' : undefined,
        route: getStandardStageRoute(4, entityId),
      });
    } else if (currentStep === 4) {
      const canRecord = actorHasCapability(actorRoles, 'VIDEO:RECORD');

      candidateActions.push({
        actionId: 'FILMING_COMPLETE',
        label: 'Complete Filming & Ingest Footage',
        actionType: 'FORWARD',
        targetStep: 5,
        isAvailable: canRecord,
        requiredCapability: 'VIDEO:RECORD',
        blockedReason: !canRecord ? 'Requires capability VIDEO:RECORD' : undefined,
        route: getStandardStageRoute(5, entityId),
      });

      candidateActions.push({
        actionId: 'REQUEST_SCRIPT_REVISION',
        label: 'Return for Script Revision',
        actionType: 'REVISION',
        targetStep: 3,
        isAvailable: canRecord,
        requiredCapability: 'VIDEO:RECORD',
        blockedReason: !canRecord ? 'Requires capability VIDEO:RECORD' : undefined,
      });
    } else if (currentStep === 5) {
      const canUpload = actorHasCapability(actorRoles, 'VIDEO:UPLOAD');

      candidateActions.push({
        actionId: 'DISPATCH_EDITING',
        label: 'Accept Raw Take & Enter Editing Bay',
        actionType: 'FORWARD',
        targetStep: 6,
        isAvailable: canUpload && mediaStatus !== 'FAILED',
        requiredCapability: 'VIDEO:UPLOAD',
        blockedReason: mediaStatus === 'FAILED'
          ? 'Media upload failed'
          : !canUpload
            ? 'Requires capability VIDEO:UPLOAD'
            : undefined,
        route: getStandardStageRoute(6, entityId),
      });
    } else if (currentStep === 6) {
      const canEdit = actorHasCapability(actorRoles, 'VIDEO:EDIT');

      candidateActions.push({
        actionId: 'SUBMIT_QC',
        label: 'Submit Cut for Final QC',
        actionType: 'FORWARD',
        targetStep: 7,
        isAvailable: canEdit,
        requiredCapability: 'VIDEO:EDIT',
        blockedReason: !canEdit ? 'Requires capability VIDEO:EDIT' : undefined,
        route: getStandardStageRoute(7, entityId),
      });
    } else if (currentStep === 7) {
      // Step 07 Final QC (Mandatory Quality Gate with GAR-02)
      const canApprove = actorHasCapability(actorRoles, 'VIDEO:APPROVE');
      const canReject = actorHasCapability(actorRoles, 'VIDEO_EDIT:REJECT') || canApprove;

      if (isAuthor) {
        isGar02Restricted = true;
      }

      candidateActions.push({
        actionId: 'VIDEO_QC_VERIFY',
        label: 'Approve Master Cut (Final QC Certified)',
        actionType: 'FORWARD',
        targetStep: 8,
        isAvailable: canApprove && !isAuthor,
        requiredCapability: 'VIDEO:APPROVE',
        isGar02Restricted: isAuthor,
        blockedReason: isAuthor
          ? 'Self-approval strictly prohibited under GAR-02 segregation of duties: Author cannot approve own work at Final QC.'
          : !canApprove
            ? 'Requires capability VIDEO:APPROVE'
            : undefined,
        route: getStandardStageRoute(8, entityId),
      });

      candidateActions.push({
        actionId: 'VIDEO_QC_REJECT',
        label: 'Reject Cut with Defect Notes',
        actionType: 'REVISION',
        targetStep: 6,
        isAvailable: canReject,
        requiredCapability: 'VIDEO_EDIT:REJECT',
        blockedReason: !canReject ? 'Requires reviewer capability' : undefined,
      });
    } else if (currentStep === 8) {
      const canDesign = actorHasCapability(actorRoles, 'THUMBNAIL:SUBMIT');

      candidateActions.push({
        actionId: 'SUBMIT_THUMBNAIL',
        label: 'Submit Thumbnail for Social Review',
        actionType: 'FORWARD',
        targetStep: 9,
        isAvailable: canDesign,
        requiredCapability: 'THUMBNAIL:SUBMIT',
        blockedReason: !canDesign ? 'Requires capability THUMBNAIL:SUBMIT' : undefined,
        route: getStandardStageRoute(9, entityId),
      });
    } else if (currentStep === 9) {
      // Step 09 Social Review Gate
      const canApprove = actorHasCapability(actorRoles, 'CONTENT:APPROVE');

      if (isAuthor) {
        isGar02Restricted = true;
      }

      candidateActions.push({
        actionId: 'SOCIAL_REVIEW_APPROVE',
        label: 'Approve Social Package & Lock Publishing',
        actionType: 'FORWARD',
        targetStep: 10,
        isAvailable: canApprove && !isAuthor,
        requiredCapability: 'CONTENT:APPROVE',
        isGar02Restricted: isAuthor,
        blockedReason: isAuthor
          ? 'Self-approval prohibited under GAR-02: Author cannot approve social package.'
          : !canApprove
            ? 'Requires capability CONTENT:APPROVE'
            : undefined,
        route: getStandardStageRoute(10, entityId),
      });
    } else if (currentStep === 10) {
      const canSchedule = actorHasCapability(actorRoles, 'PUBLICATION:SCHEDULE');

      candidateActions.push({
        actionId: 'PUBLISH_SCHEDULE',
        label: 'Schedule Target Platform Releases',
        actionType: 'FORWARD',
        targetStep: 11,
        isAvailable: canSchedule,
        requiredCapability: 'PUBLICATION:SCHEDULE',
        blockedReason: !canSchedule ? 'Requires capability PUBLICATION:SCHEDULE' : undefined,
        route: getStandardStageRoute(11, entityId),
      });
    } else if (currentStep === 11) {
      const canPublish = actorHasCapability(actorRoles, 'PUBLICATION:PUBLISH');

      candidateActions.push({
        actionId: 'CONFIRM_LIVE',
        label: 'Confirm Live Broadcast & Sync',
        actionType: 'FORWARD',
        targetStep: 12,
        isAvailable: canPublish,
        requiredCapability: 'PUBLICATION:PUBLISH',
        blockedReason: !canPublish ? 'Requires capability PUBLICATION:PUBLISH' : undefined,
        route: getStandardStageRoute(12, entityId),
      });
    } else if (currentStep === 12) {
      const canSync = actorHasCapability(actorRoles, 'PLATFORM:SYNC');

      candidateActions.push({
        actionId: 'COMPLETE_SYNC',
        label: 'Complete Platform Sync & Open Telemetry',
        actionType: 'FORWARD',
        targetStep: 13,
        isAvailable: canSync,
        requiredCapability: 'PLATFORM:SYNC',
        blockedReason: !canSync ? 'Requires capability PLATFORM:SYNC' : undefined,
        route: getStandardStageRoute(13, entityId),
      });
    } else if (currentStep === 13) {
      const canView = actorHasCapability(actorRoles, 'ANALYTICS:VIEW');

      candidateActions.push({
        actionId: 'DISPATCH_PERF_REVIEW',
        label: 'Dispatch Performance Review',
        actionType: 'FORWARD',
        targetStep: 14,
        isAvailable: canView,
        requiredCapability: 'ANALYTICS:VIEW',
        blockedReason: !canView ? 'Requires capability ANALYTICS:VIEW' : undefined,
        route: getStandardStageRoute(14, entityId),
      });
    } else if (currentStep === 14) {
      const canReview = actorHasCapability(actorRoles, 'PERFORMANCE:ANALYZE');

      candidateActions.push({
        actionId: 'FINALIZE_PERF_REVIEW',
        label: 'Finalize Pedagogical Review',
        actionType: 'FORWARD',
        targetStep: 15,
        isAvailable: canReview,
        requiredCapability: 'PERFORMANCE:ANALYZE',
        blockedReason: !canReview ? 'Requires capability PERFORMANCE:ANALYZE' : undefined,
        route: getStandardStageRoute(15, entityId),
      });
    } else if (currentStep === 15) {
      const canClose = actorHasCapability(actorRoles, 'INTELLIGENCE:CLOSE_LOOP');

      candidateActions.push({
        actionId: 'COMPLETE_WORKFLOW',
        label: 'Archive & Complete Lifecycle',
        actionType: 'TERMINAL',
        targetStep: 15,
        isAvailable: canClose,
        requiredCapability: 'INTELLIGENCE:CLOSE_LOOP',
        blockedReason: !canClose ? 'Requires capability INTELLIGENCE:CLOSE_LOOP' : undefined,
      });
    }
  }

  // Determine Primary Next Action
  let primaryNextAction: ResolvedWorkflowAction | null = null;
  const availableAction = candidateActions.find((a) => a.isAvailable && a.actionType === 'FORWARD');
  if (availableAction) {
    primaryNextAction = availableAction;
  } else if (candidateActions.length > 0) {
    primaryNextAction = candidateActions[0];
  }

  const workflowInstanceId = persisted.id || `wfl_${entityId}`;

  return {
    workflowInstanceId,
    entityId,
    entityType,
    productionMode: mode,
    currentStage: currentStep,
    stageCode: currentDef.code,
    stageStatus,
    multiDimensionalState: {
      contentStatus,
      mediaStatus,
      publicationStatus,
      jobStatus,
    },
    version,
    assignment: {
      ownerId,
      stageAssigneeId: undefined,
    },
    applicableSteps: resolvedSteps,
    progress,
    permittedActions: candidateActions,
    primaryNextAction,
    isGar02Restricted,
    isTerminal,
    lastTransitionAt,
    lastTransitionBy,
    metadata: persisted.metadata || {},
  };
}
