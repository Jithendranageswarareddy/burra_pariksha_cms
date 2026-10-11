/**
 * BURRA PARIKSHA CMS - Canonical 15-Step Production Workflow Architecture
 * Stage 7 — Phase 3: Workflow Convergence
 * 
 * Defines the single authoritative conceptual workflow state model,
 * step ownership metadata, transition rules, prerequisite gates, and
 * bidirectional mappings from backend statuses to canonical lifecycle states.
 */

import { Question, QuestionStatus, Video, VideoProductionStatus, Script, Thumbnail, Publishing, SocialPublishStatus, SocialReviewPackageBundle, SocialReviewStatus, ContentMaster } from '../../../shared';

// ============================================================================
// 1. CANONICAL WORKFLOW STATE MODEL
// ============================================================================

import { CanonicalStepDefinition, CANONICAL_15_STEPS } from '../../../shared';
import { CanonicalWorkflowState } from '../../../src/types/workflow';

export {
  CanonicalWorkflowState,
  CANONICAL_15_STEPS,
};
export type { CanonicalStepDefinition };

// ============================================================================
// 3. CANONICAL WORKFLOW STATE MAPPERS
// ============================================================================

export function mapQuestionToWorkflowState(question: Question | null): {
  step01State: CanonicalWorkflowState;
  step02State: CanonicalWorkflowState;
} {
  if (!question) {
    return {
      step01State: CanonicalWorkflowState.NOT_STARTED,
      step02State: CanonicalWorkflowState.NOT_STARTED,
    };
  }

  switch (question.status) {
    case QuestionStatus.APPROVED:
      return {
        step01State: CanonicalWorkflowState.COMPLETED,
        step02State: CanonicalWorkflowState.COMPLETED,
      };
    case QuestionStatus.GENERATED:
    case QuestionStatus.EDITING:
      return {
        step01State: CanonicalWorkflowState.COMPLETED,
        step02State: CanonicalWorkflowState.IN_PROGRESS,
      };
    case QuestionStatus.REJECTED:
      return {
        step01State: CanonicalWorkflowState.REVISION_REQUIRED,
        step02State: CanonicalWorkflowState.REJECTED,
      };
    case QuestionStatus.DRAFT:
    default:
      return {
        step01State: CanonicalWorkflowState.IN_PROGRESS,
        step02State: CanonicalWorkflowState.NOT_STARTED,
      };
  }
}

export function mapVideoToWorkflowState(
  video: Video | null,
  script?: Script | null,
  thumbnail?: Thumbnail | null
): Record<number, CanonicalWorkflowState> {
  const result: Record<number, CanonicalWorkflowState> = {
    3: CanonicalWorkflowState.NOT_STARTED,
    4: CanonicalWorkflowState.NOT_STARTED,
    5: CanonicalWorkflowState.NOT_STARTED,
    6: CanonicalWorkflowState.NOT_STARTED,
    7: CanonicalWorkflowState.NOT_STARTED,
    8: CanonicalWorkflowState.NOT_STARTED,
  };

  if (!video) return result;

  // Step 03: Script
  if (
    script?.status === 'APPROVED' ||
    video.status === VideoProductionStatus.SCRIPT_READY ||
    [
      VideoProductionStatus.RECORDING,
      VideoProductionStatus.RECORDED,
      VideoProductionStatus.EDITING,
      VideoProductionStatus.EDITED,
      VideoProductionStatus.FINAL_REVIEW,
      VideoProductionStatus.READY_TO_UPLOAD,
      VideoProductionStatus.UPLOADED,
    ].includes(video.status)
  ) {
    result[3] = CanonicalWorkflowState.COMPLETED;
  } else if (
    video.status === VideoProductionStatus.SCRIPT_REQUIRED ||
    video.status === VideoProductionStatus.QUEUED ||
    script
  ) {
    result[3] = CanonicalWorkflowState.IN_PROGRESS;
  }

  // Step 04: Filming
  if (
    [
      VideoProductionStatus.RECORDED,
      VideoProductionStatus.EDITING,
      VideoProductionStatus.EDITED,
      VideoProductionStatus.FINAL_REVIEW,
      VideoProductionStatus.READY_TO_UPLOAD,
      VideoProductionStatus.UPLOADED,
    ].includes(video.status)
  ) {
    result[4] = CanonicalWorkflowState.COMPLETED;
  } else if (video.status === VideoProductionStatus.RECORDING) {
    result[4] = CanonicalWorkflowState.IN_PROGRESS;
  } else if (result[3] === CanonicalWorkflowState.COMPLETED) {
    result[4] = CanonicalWorkflowState.NOT_STARTED;
  } else {
    result[4] = CanonicalWorkflowState.BLOCKED;
  }

  // Step 05: Raw Video Handoff
  const hasRawAsset = Boolean(video.driveFileId || video.rawFootagePath || video.driveFolderUrl);
  if (
    [
      VideoProductionStatus.RECORDED,
      VideoProductionStatus.EDITING,
      VideoProductionStatus.EDITED,
      VideoProductionStatus.FINAL_REVIEW,
      VideoProductionStatus.READY_TO_UPLOAD,
      VideoProductionStatus.UPLOADED,
    ].includes(video.status) ||
    hasRawAsset
  ) {
    result[5] = CanonicalWorkflowState.COMPLETED;
  } else if (video.status === VideoProductionStatus.RECORDING) {
    result[5] = CanonicalWorkflowState.IN_PROGRESS;
  } else {
    result[5] = CanonicalWorkflowState.BLOCKED;
  }

  // Step 06: Editing
  if (
    [
      VideoProductionStatus.EDITED,
      VideoProductionStatus.FINAL_REVIEW,
      VideoProductionStatus.READY_TO_UPLOAD,
      VideoProductionStatus.UPLOADED,
    ].includes(video.status)
  ) {
    result[6] = CanonicalWorkflowState.COMPLETED;
  } else if (video.status === VideoProductionStatus.EDITING) {
    result[6] = CanonicalWorkflowState.IN_PROGRESS;
  } else if (result[5] === CanonicalWorkflowState.COMPLETED) {
    result[6] = CanonicalWorkflowState.NOT_STARTED;
  } else {
    result[6] = CanonicalWorkflowState.BLOCKED;
  }

  // Step 07: Final QC
  if (
    [
      VideoProductionStatus.READY_TO_UPLOAD,
      VideoProductionStatus.UPLOADED,
    ].includes(video.status)
  ) {
    result[7] = CanonicalWorkflowState.COMPLETED;
  } else if (
    video.status === VideoProductionStatus.FINAL_REVIEW ||
    video.status === VideoProductionStatus.EDITED
  ) {
    result[7] = CanonicalWorkflowState.IN_PROGRESS;
  } else if (result[6] === CanonicalWorkflowState.COMPLETED) {
    result[7] = CanonicalWorkflowState.NOT_STARTED;
  } else {
    result[7] = CanonicalWorkflowState.BLOCKED;
  }

  // Step 08: Thumbnail (Stage N completion must be derived from Stage N evidence, not later status)
  if (thumbnail?.status === 'APPROVED' || (thumbnail as any)?.isApproved) {
    result[8] = CanonicalWorkflowState.COMPLETED;
  } else if (thumbnail) {
    result[8] = CanonicalWorkflowState.IN_PROGRESS;
  } else if (result[3] === CanonicalWorkflowState.COMPLETED) {
    result[8] = CanonicalWorkflowState.NOT_STARTED;
  } else {
    result[8] = CanonicalWorkflowState.BLOCKED;
  }

  return result;
}

export function mapSocialReviewToWorkflowState(
  bundle: SocialReviewPackageBundle | null
): CanonicalWorkflowState {
  if (!bundle) return CanonicalWorkflowState.NOT_STARTED;
  switch (bundle.currentReviewStatus) {
    case SocialReviewStatus.APPROVED:
      return CanonicalWorkflowState.COMPLETED;
    case SocialReviewStatus.CHANGES_REQUESTED:
      return CanonicalWorkflowState.REVISION_REQUIRED;
    case SocialReviewStatus.REJECTED:
      return CanonicalWorkflowState.REJECTED;
    case SocialReviewStatus.PENDING_REVIEW:
    default:
      return CanonicalWorkflowState.IN_PROGRESS;
  }
}

export function mapPublishingToWorkflowState(
  publishing: Publishing | null,
  _video: Video | null
): {
  step10State: CanonicalWorkflowState;
  step11State: CanonicalWorkflowState;
  step12State: CanonicalWorkflowState;
} {
  // S3-T14.4: Derive stage states strictly from publishing evidence, never infer from later video status
  if (!publishing) {
    return {
      step10State: CanonicalWorkflowState.NOT_STARTED,
      step11State: CanonicalWorkflowState.NOT_STARTED,
      step12State: CanonicalWorkflowState.NOT_STARTED,
    };
  }

  const isYtScheduled = publishing.youtube?.status === SocialPublishStatus.SCHEDULED;
  const isYtPublished = publishing.youtube?.status === SocialPublishStatus.PUBLISHED;
  const isAnyPublished = Boolean(
    isYtPublished ||
    publishing.instagram?.status === SocialPublishStatus.PUBLISHED ||
    publishing.facebook?.status === SocialPublishStatus.PUBLISHED ||
    (publishing.completedPlatformsCount > 0 &&
      Boolean(
        publishing.youtube?.postUrl ||
        publishing.youtube?.videoUrl ||
        publishing.instagram?.postUrl ||
        publishing.facebook?.postUrl
      ))
  );

  const isConfigured = Boolean(
    isYtScheduled ||
    isYtPublished ||
    publishing.youtubeScheduledAt ||
    publishing.instagramScheduledAt ||
    publishing.facebookScheduledAt ||
    publishing.youtube?.scheduledAt
  );

  const isFullySynced = Boolean(
    publishing.completedPlatformsCount >= publishing.totalPlatformsCount &&
    publishing.totalPlatformsCount > 0 &&
    publishing.youtube?.status === SocialPublishStatus.PUBLISHED &&
    publishing.instagram?.status === SocialPublishStatus.PUBLISHED &&
    publishing.facebook?.status === SocialPublishStatus.PUBLISHED
  );

  let step10State = CanonicalWorkflowState.NOT_STARTED;
  let step11State = CanonicalWorkflowState.NOT_STARTED;
  let step12State = CanonicalWorkflowState.NOT_STARTED;

  if (isConfigured) {
    step10State = CanonicalWorkflowState.COMPLETED;
  } else if (
    publishing.youtubeScheduledAt ||
    publishing.instagramScheduledAt ||
    publishing.facebookScheduledAt
  ) {
    step10State = CanonicalWorkflowState.IN_PROGRESS;
  }

  if (isAnyPublished) {
    step11State = CanonicalWorkflowState.COMPLETED;
  } else if (isYtScheduled || publishing.youtubeScheduledAt) {
    step11State = CanonicalWorkflowState.IN_PROGRESS;
  }

  if (isFullySynced) {
    step12State = CanonicalWorkflowState.COMPLETED;
  } else if (isAnyPublished) {
    step12State = CanonicalWorkflowState.IN_PROGRESS;
  }

  return { step10State, step11State, step12State };
}

export function getCanonicalStep(stepNumber: number): CanonicalStepDefinition | undefined {
  return CANONICAL_15_STEPS.find((s) => s.stepNumber === stepNumber);
}

// ============================================================================
// 4. STAGE 04 ARCHITECTURE ENFORCEMENT: CANONICAL 15-STAGE ENGINE (AP-001..AP-006, AP-009)
// ============================================================================

export type CanonicalStageNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;

/**
 * Single authoritative type-safe stage identifier derived directly from CANONICAL_15_STEPS.
 * Enforces AP-001 (One canonical 15-step business workflow) and AP-010 (No duplicate ownership of business state).
 */
export const CanonicalStageIdentifier = {
  STAGE_01_QUESTION_GENERATION: CANONICAL_15_STEPS[0].id,
  STAGE_02_QUESTION_VERIFICATION: CANONICAL_15_STEPS[1].id,
  STAGE_03_AUDIENCE_SCRIPT: CANONICAL_15_STEPS[2].id,
  STAGE_04_TELEPROMPTER_FILMING: CANONICAL_15_STEPS[3].id,
  STAGE_05_RAW_VIDEO: CANONICAL_15_STEPS[4].id,
  STAGE_06_EDITING_BAY: CANONICAL_15_STEPS[5].id,
  STAGE_07_FINAL_QC: CANONICAL_15_STEPS[6].id,
  STAGE_08_THUMBNAIL: CANONICAL_15_STEPS[7].id,
  STAGE_09_SOCIAL_REVIEW: CANONICAL_15_STEPS[8].id,
  STAGE_10_PUBLISHING_SETUP: CANONICAL_15_STEPS[9].id,
  STAGE_11_PUBLISHED: CANONICAL_15_STEPS[10].id,
  STAGE_12_PLATFORM_SYNC: CANONICAL_15_STEPS[11].id,
  STAGE_13_ANALYTICS: CANONICAL_15_STEPS[12].id,
  STAGE_14_PERFORMANCE_REVIEW: CANONICAL_15_STEPS[13].id,
  STAGE_15_INTELLIGENCE_LOOP: CANONICAL_15_STEPS[14].id,
} as const;

export type CanonicalStageIdentifier = (typeof CanonicalStageIdentifier)[keyof typeof CanonicalStageIdentifier];

export interface StageTransitionActor {
  id: string;
  name?: string;
  role: string;
  isAiAgent?: boolean;
}

export interface StageTransitionRequest {
  contentMasterId: string;
  currentStage: CanonicalStageNumber;
  targetStage: CanonicalStageNumber;
  actor: StageTransitionActor;
  prerequisitesMet?: boolean;
  humanSignOff?: boolean;
  remarks?: string;
}

export interface StageTransitionValidationResult {
  allowed: boolean;
  error?: string;
  violatedPrinciple?: string;
  targetStage?: CanonicalStageNumber;
}

/**
 * AP-001 & AP-003: Authoritative server-side transition validator.
 * Validates stage boundaries, actor credentials, AI human-in-the-loop requirements,
 * and business prerequisites.
 */
export function validateCanonicalWorkflowTransition(
  req: StageTransitionRequest
): StageTransitionValidationResult {
  // AP-004: Backend Authorization Authority
  if (!req.actor || !req.actor.id || req.actor.id.trim() === '') {
    return {
      allowed: false,
      error: 'Unauthenticated actor: Transition requires an authenticated actor context.',
      violatedPrinciple: 'AP-004',
    };
  }

  // AP-009: AI Governance (AI cannot silently approve or mutate controlled business state)
  const isAiActor = Boolean(
    req.actor.isAiAgent ||
    req.actor.role === 'AI_BOT' ||
    req.actor.role === 'AI_AGENT' ||
    req.actor.id.startsWith('AI-')
  );
  if (isAiActor) {
    const humanGatedStages: CanonicalStageNumber[] = [2, 7, 9, 10, 14, 15];
    if (humanGatedStages.includes(req.targetStage) && !req.humanSignOff) {
      return {
        allowed: false,
        error: `AI safety policy violation: AI agent cannot advance content to Stage ${req.targetStage} without explicit human sign-off.`,
        violatedPrinciple: 'AP-009',
      };
    }
  }

  // AP-001 & AP-003: Sequential stage enforcement
  if (req.targetStage < 1 || req.targetStage > 15) {
    return {
      allowed: false,
      error: `Invalid target stage: ${req.targetStage}. Must be between 1 and 15.`,
      violatedPrinciple: 'AP-001',
    };
  }

  if (req.currentStage < 1 || req.currentStage > 15) {
    return {
      allowed: false,
      error: `Invalid current stage: ${req.currentStage}. Must be between 1 and 15.`,
      violatedPrinciple: 'AP-001',
    };
  }

  // Allow backward revision (e.g. Stage 7 QC reject back to Stage 6 Editing)
  const isBackwardRevision = req.targetStage < req.currentStage;
  const isDirectNextStep = req.targetStage === req.currentStage + 1;
  const isIdempotentSame = req.targetStage === req.currentStage;
  const isLoopback = req.currentStage === 15 && req.targetStage === 1;

  if (!isDirectNextStep && !isBackwardRevision && !isIdempotentSame && !isLoopback) {
    return {
      allowed: false,
      error: `Illegal workflow jump: Cannot jump directly from Stage ${req.currentStage} to Stage ${req.targetStage}. Must proceed sequentially.`,
      violatedPrinciple: 'AP-001',
    };
  }

  // AP-005 & AP-006: Server-side business rule validation
  if (isDirectNextStep && req.prerequisitesMet === false) {
    return {
      allowed: false,
      error: `Prerequisites not satisfied for advancing to Stage ${req.targetStage}.`,
      violatedPrinciple: 'AP-005',
    };
  }

  return {
    allowed: true,
    targetStage: req.targetStage,
  };
}
