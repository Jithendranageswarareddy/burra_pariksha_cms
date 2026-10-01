/**
 * BURRA PARIKSHA CMS - Canonical 15-Step Production Workflow Architecture
 * Stage 7 — Phase 3: Workflow Convergence
 * 
 * Defines the single authoritative conceptual workflow state model,
 * step ownership metadata, transition rules, prerequisite gates, and
 * bidirectional mappings from backend statuses to canonical lifecycle states.
 */

import {
  Question,
  QuestionStatus,
  Video,
  VideoProductionStatus,
  Script,
  Thumbnail,
  Publishing,
  SocialPublishStatus,
  SocialReviewPackageBundle,
  SocialReviewStatus,
  ContentMaster,
} from '../../types';

// ============================================================================
// 1. CANONICAL WORKFLOW STATE MODEL
// ============================================================================

export enum CanonicalWorkflowState {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  REVISION_REQUIRED = 'REVISION_REQUIRED',
  REJECTED = 'REJECTED',
  BLOCKED = 'BLOCKED',
  ESCALATED = 'ESCALATED',
}

// ============================================================================
// 2. CANONICAL 15 STEPS METADATA & OWNERSHIP SPECIFICATION
// ============================================================================

export interface CanonicalStepDefinition {
  stepNumber: number; // 1 to 15
  id: string;
  label: string;
  shortLabel: string;
  responsibility: string;
  canonicalPage: string;
  canonicalRoute: string;
  tab?: string;
  responsibleRole: string;
  inputEntity: string;
  outputEntity: string;
  completionGate: string;
  forwardStep: number;
  revisionRoute?: string;
  rejectionRoute?: string;
  blockedCondition: string;
}

export const CANONICAL_15_STEPS: CanonicalStepDefinition[] = [
  {
    stepNumber: 1,
    id: 'question-generation',
    label: '01 Question Generation',
    shortLabel: 'Question Gen',
    responsibility: 'AI question generation, taxonomy mapping, distraction options & math proof drafting',
    canonicalPage: 'QuestionStudioPage',
    canonicalRoute: '/studio',
    responsibleRole: 'Content Creator / Subject Matter Expert',
    inputEntity: 'Topic Taxonomy & Prompt Configuration',
    outputEntity: 'Question Draft (BP-Q-######)',
    completionGate: 'Valid 4-option Question schema, mathematical proof verified, record created',
    forwardStep: 2,
    revisionRoute: '/studio',
    rejectionRoute: '/studio',
    blockedCondition: 'No topic taxonomy selected',
  },
  {
    stepNumber: 2,
    id: 'question-verification',
    label: '02 Question Verification',
    shortLabel: 'Verification',
    responsibility: '10-point pedagogical audit, solution proof check, editorial sign-off & video queueing',
    canonicalPage: 'QuestionVerifyApprovePage',
    canonicalRoute: '/questions/:id/verify',
    responsibleRole: 'Lead Subject Matter Expert / QA Reviewer',
    inputEntity: 'Question Draft (BP-Q-######)',
    outputEntity: 'Approved Question + Queued Video Project (BP-V-######)',
    completionGate: '10-point pedagogical audit certified; Video queued in status QUEUED',
    forwardStep: 3,
    revisionRoute: '/questions/:id?mode=edit',
    rejectionRoute: '/questions/:id?mode=edit',
    blockedCondition: 'Question draft missing or invalid',
  },
  {
    stepNumber: 3,
    id: 'audience-script',
    label: '03 Audience Script',
    shortLabel: 'Audience Script',
    responsibility: 'Short-form presenter script with 3-second hook, step-by-step solution & speed trick',
    canonicalPage: 'VideoDetailPage',
    canonicalRoute: '/videos/:id?tab=script',
    tab: 'script',
    responsibleRole: 'Scriptwriter / Content Creator',
    inputEntity: 'Approved Question (BP-Q-######)',
    outputEntity: 'Script Version (BP-SCR-######)',
    completionGate: 'Script text saved, teleprompter pacing certified, status SCRIPT_READY',
    forwardStep: 4,
    revisionRoute: '/videos/:id?tab=script',
    rejectionRoute: '/videos/:id?tab=script',
    blockedCondition: 'Question must be approved before scripting',
  },
  {
    stepNumber: 4,
    id: 'teleprompter-recording',
    label: '04 Teleprompter & Filming',
    shortLabel: 'Filming',
    responsibility: 'Presenter filming session with interactive auto-scroll teleprompter & multi-take recording',
    canonicalPage: 'VideoDetailPage',
    canonicalRoute: '/videos/:id?tab=recording',
    tab: 'recording',
    responsibleRole: 'Presenter / Host',
    inputEntity: 'Script Ready (BP-SCR-######)',
    outputEntity: 'Presenter Recording Session Notes & Take Metadata',
    completionGate: 'Presenter filming session active with take logged, status RECORDING',
    forwardStep: 5,
    revisionRoute: '/videos/:id?tab=recording',
    rejectionRoute: '/videos/:id?tab=recording',
    blockedCondition: 'Script must be approved before filming session',
  },
  {
    stepNumber: 5,
    id: 'raw-video-handoff',
    label: '05 Raw Video',
    shortLabel: 'Raw Video',
    responsibility: 'Raw camera video asset ingestion, Drive folder attachment & handoff to editing bay',
    canonicalPage: 'VideoDetailPage',
    canonicalRoute: '/videos/:id?tab=recording',
    tab: 'recording',
    responsibleRole: 'Camera Operator / Production Lead',
    inputEntity: 'Raw Footage File / Drive Share URL',
    outputEntity: 'Ingested Media Asset (driveFileId / rawFootagePath) in status RECORDED',
    completionGate: 'Raw video asset attached to video project, status RECORDED',
    forwardStep: 6,
    revisionRoute: '/videos/:id?tab=recording',
    rejectionRoute: '/videos/:id?tab=recording',
    blockedCondition: 'Filming session must be completed before uploading raw asset',
  },
  {
    stepNumber: 6,
    id: 'video-editing',
    label: '06 Editing Bay',
    shortLabel: 'Editing Bay',
    responsibility: 'Editing bay master cut, dynamic Telugu subtitles, sound effects & timer overlay',
    canonicalPage: 'VideoDetailPage',
    canonicalRoute: '/videos/:id?tab=editing',
    tab: 'editing',
    responsibleRole: 'Video Editor',
    inputEntity: 'Raw Video File (Drive URL)',
    outputEntity: 'Final Render Cut (finalRenderPath) in status EDITED',
    completionGate: 'Final master render linked, 6-point Shorts pacing confirmed, status EDITED',
    forwardStep: 7,
    revisionRoute: '/videos/:id?tab=editing',
    rejectionRoute: '/videos/:id?tab=editing',
    blockedCondition: 'Raw video asset must be uploaded before editing',
  },
  {
    stepNumber: 7,
    id: 'final-qc',
    label: '07 Final QC',
    shortLabel: 'Final QC',
    responsibility: '6-point Master QC certification (1080x1920 9:16 safe-zones, audio LUFS, Telugu typo check)',
    canonicalPage: 'VideoDetailPage',
    canonicalRoute: '/videos/:id?tab=final-review',
    tab: 'final-review',
    responsibleRole: 'Quality Control Lead / Producer',
    inputEntity: 'Final Render Cut (BP-V-######)',
    outputEntity: 'QC Certified Video Project in status READY_TO_UPLOAD',
    completionGate: 'All 6 Master QC points certified, status READY_TO_UPLOAD',
    forwardStep: 8,
    revisionRoute: '/videos/:id?tab=editing',
    rejectionRoute: '/videos/:id?tab=editing',
    blockedCondition: 'Edited video master cut must be submitted before Final QC',
  },
  {
    stepNumber: 8,
    id: 'thumbnail-studio',
    label: '08 Thumbnail',
    shortLabel: 'Thumbnail',
    responsibility: 'High-CTR curiosity framing thumbnail design with mobile preview and Drive asset link',
    canonicalPage: 'VideoDetailPage',
    canonicalRoute: '/videos/:id?tab=thumbnail',
    tab: 'thumbnail',
    responsibleRole: 'Graphic Designer / Thumbnail Artist',
    inputEntity: 'Approved Question + Hook Headline',
    outputEntity: 'Approved Thumbnail Asset (BP-THM-######) linked to Drive',
    completionGate: 'Thumbnail image uploaded to Drive, status APPROVED',
    forwardStep: 9,
    revisionRoute: '/videos/:id?tab=thumbnail',
    rejectionRoute: '/videos/:id?tab=thumbnail',
    blockedCondition: 'Script and hook finalized before designing thumbnail',
  },
  {
    stepNumber: 9,
    id: 'social-review',
    label: '09 Social Review',
    shortLabel: 'Social Review',
    responsibility: '9:16 smartphone simulator review, title/copy packaging, tags & pinned comment sign-off',
    canonicalPage: 'SocialReviewPage',
    canonicalRoute: '/social-review/:reviewId',
    tab: 'social',
    responsibleRole: 'Social Media Lead / Content Manager',
    inputEntity: 'QC Approved Video + Thumbnail Asset',
    outputEntity: 'Certified Social Review Package Bundle (status APPROVED)',
    completionGate: '9:16 simulator audit passed, safe-zone verified, editorial sign-off approved',
    forwardStep: 10,
    revisionRoute: '/videos/:id?tab=thumbnail',
    rejectionRoute: '/social-review/:reviewId',
    blockedCondition: 'Video must pass Final QC before approving social review package',
  },
  {
    stepNumber: 10,
    id: 'publishing-setup',
    label: '10 Publishing Setup',
    shortLabel: 'Publishing Setup',
    responsibility: 'Multi-platform scheduling, platform slot configuration & pre-publish readiness confirmation',
    canonicalPage: 'PublishingPage',
    canonicalRoute: '/publishing',
    tab: 'publishing',
    responsibleRole: 'Release Coordinator / Publisher',
    inputEntity: 'Approved Social Package + Media Assets',
    outputEntity: 'Publishing Schedule (status SCHEDULED)',
    completionGate: 'Prerequisite assets confirmed, scheduled publishing timestamp persisted',
    forwardStep: 11,
    revisionRoute: '/publishing',
    rejectionRoute: '/publishing',
    blockedCondition: 'Video must pass Final QC & Social Review before scheduling',
  },
  {
    stepNumber: 11,
    id: 'published-live',
    label: '11 Published',
    shortLabel: 'Published',
    responsibility: 'Live publication on YouTube Shorts, Instagram Reels & Facebook Video + regex URL verification',
    canonicalPage: 'PublishingPage',
    canonicalRoute: '/publishing',
    tab: 'publishing',
    responsibleRole: 'Distribution Specialist',
    inputEntity: 'Scheduled Publishing Record',
    outputEntity: 'Verified Live Platform URLs in status PUBLISHED / UPLOADED',
    completionGate: 'Live platform URLs validated via regex and persisted',
    forwardStep: 12,
    revisionRoute: '/publishing',
    rejectionRoute: '/publishing',
    blockedCondition: 'Publishing package must be scheduled or ready before marking published',
  },
  {
    stepNumber: 12,
    id: 'platform-sync',
    label: '12 Platform Sync',
    shortLabel: 'Platform Sync',
    responsibility: 'Cross-platform adaptation verification (character limits, hashtags, audio attribution)',
    canonicalPage: 'PlatformPackagesPage',
    canonicalRoute: '/platform-packages',
    responsibleRole: 'Social Operations Specialist',
    inputEntity: 'Live Published Video Post',
    outputEntity: 'Sync Verified Package Bundle',
    completionGate: 'Multi-platform live posts confirmed matching platform guidelines',
    forwardStep: 13,
    revisionRoute: '/platform-packages',
    rejectionRoute: '/platform-packages',
    blockedCondition: 'Content must be published on primary platform before verifying sync',
  },
  {
    stepNumber: 13,
    id: 'social-analytics',
    label: '13 Analytics',
    shortLabel: 'Analytics',
    responsibility: '24h / 7d engagement metrics collection (Views, Likes, Retention %, Audience comments)',
    canonicalPage: 'SocialAnalyticsPage',
    canonicalRoute: '/social-analytics/:contentId',
    responsibleRole: 'Analytics Specialist',
    inputEntity: 'Published Social Post Identifiers',
    outputEntity: 'Recorded Social Analytics Metric Rows',
    completionGate: 'Real audience performance metrics entered into analytics records',
    forwardStep: 14,
    revisionRoute: '/social-analytics/:contentId',
    rejectionRoute: '/social-analytics/:contentId',
    blockedCondition: 'Video must be published to record engagement and analytics',
  },
  {
    stepNumber: 14,
    id: 'performance-review',
    label: '14 Performance Review',
    shortLabel: 'Performance Review',
    responsibility: 'Retention curve drop-off review, student confusion identification & editorial critique',
    canonicalPage: 'AnalyticsExperiencePage',
    canonicalRoute: '/analytics/engagement',
    responsibleRole: 'Content Strategy Lead',
    inputEntity: 'Social Analytics Summary & Retention Curves',
    outputEntity: 'Performance Review Synthesis & Content Diagnostics',
    completionGate: 'Audience retention & drop-off analysis completed',
    forwardStep: 15,
    revisionRoute: '/analytics/engagement',
    rejectionRoute: '/analytics/engagement',
    blockedCondition: 'Audience metrics must be collected before performance review',
  },
  {
    stepNumber: 15,
    id: 'performance-intelligence',
    label: '15 Intelligence Loop',
    shortLabel: 'Intelligence Loop',
    responsibility: 'AI pedagogical insights synthesis, topic recommendation generation & loopback to Step 01',
    canonicalPage: 'AnalyticsExperiencePage',
    canonicalRoute: '/analytics/intelligence',
    responsibleRole: 'Executive Producer / AI Strategy Engine',
    inputEntity: 'Multi-dimensional Analytics Aggregations',
    outputEntity: 'Content Strategy Recommendation (applied to /studio)',
    completionGate: 'AI strategy recommendation generated and applied to Question Studio',
    forwardStep: 1, // Loopback to Step 01!
    revisionRoute: '/analytics/strategy',
    rejectionRoute: '/analytics/strategy',
    blockedCondition: 'Performance analysis required to generate strategy recommendation',
  },
];

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

  // Step 08: Thumbnail
  if (thumbnail?.status === 'APPROVED' || video.status === VideoProductionStatus.UPLOADED) {
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
  video: Video | null
): {
  step10State: CanonicalWorkflowState;
  step11State: CanonicalWorkflowState;
  step12State: CanonicalWorkflowState;
} {
  if (video?.status === VideoProductionStatus.UPLOADED) {
    return {
      step10State: CanonicalWorkflowState.COMPLETED,
      step11State: CanonicalWorkflowState.COMPLETED,
      step12State: CanonicalWorkflowState.COMPLETED,
    };
  }

  if (!publishing) {
    return {
      step10State: CanonicalWorkflowState.NOT_STARTED,
      step11State: CanonicalWorkflowState.NOT_STARTED,
      step12State: CanonicalWorkflowState.NOT_STARTED,
    };
  }

  const isYtScheduled = publishing.youtube?.status === SocialPublishStatus.SCHEDULED;
  const isYtPublished = publishing.youtube?.status === SocialPublishStatus.PUBLISHED;
  const isFullySynced =
    publishing.completedPlatformsCount >= publishing.totalPlatformsCount &&
    publishing.totalPlatformsCount > 0;

  let step10State = CanonicalWorkflowState.NOT_STARTED;
  let step11State = CanonicalWorkflowState.NOT_STARTED;
  let step12State = CanonicalWorkflowState.NOT_STARTED;

  if (isYtScheduled || isYtPublished) {
    step10State = CanonicalWorkflowState.COMPLETED;
  } else if (
    publishing.youtubeScheduledAt ||
    publishing.instagramScheduledAt ||
    publishing.facebookScheduledAt
  ) {
    step10State = CanonicalWorkflowState.IN_PROGRESS;
  }

  if (isYtPublished) {
    step11State = CanonicalWorkflowState.COMPLETED;
  } else if (isYtScheduled) {
    step11State = CanonicalWorkflowState.IN_PROGRESS;
  }

  if (isFullySynced) {
    step12State = CanonicalWorkflowState.COMPLETED;
  } else if (isYtPublished) {
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
  if (req.actor.isAiAgent) {
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
