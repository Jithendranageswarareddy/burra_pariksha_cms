/**
 * BURRA PARIKSHA CMS — Authoritative Workflow Transition Matrix & Guards
 * Stage 27 Feature Contract: FC-005 (Canonical 15-Step Workflow State Machine)
 * Traced to:
 * - docs/features/FC-005-WORKFLOW-STATE-ENGINE.md
 * - docs/architecture/07-CANONICAL-15-STEP-WORKFLOW.md (Sections 6 & 7)
 * - docs/architecture/08-STATE-MODEL.md
 */

import {
  TransitionRule,
  WorkflowStepNumber,
  CANONICAL_WORKFLOW_STEPS,
  WorkflowInstanceDocument,
} from '../../types/workflow';

/**
 * Authoritative Canonical Transition Rules Table.
 * Normal forward transitions are strictly N -> N+1 sequential.
 * Arbitrary forward jumps (e.g. 1 -> 5) are strictly prohibited.
 */
export const CANONICAL_TRANSITION_RULES: readonly TransitionRule[] = [
  // --------------------------------------------------------------------------
  // STEP 01 — Question Generation
  // --------------------------------------------------------------------------
  {
    fromStep: 1,
    toStep: 2,
    action: 'QUESTION_SUBMIT',
    type: 'FORWARD',
    requiredCapability: 'QUESTION:SUBMIT',
    resultingDimensions: {
      workflowStep: 2,
      contentStatus: 'IN_REVIEW',
    },
    description: 'Question schema and proof submitted for pedagogical verification.',
  },
  {
    fromStep: 1,
    toStep: 1,
    action: 'SAVE_DRAFT',
    type: 'FORWARD',
    requiredCapability: 'QUESTION:EDIT',
    resultingDimensions: {
      workflowStep: 1,
      contentStatus: 'DRAFT',
    },
    description: 'Working question draft saved in Step 01.',
  },

  // --------------------------------------------------------------------------
  // STEP 02 — Question Verification (GAR-02 Human Verification Gate)
  // --------------------------------------------------------------------------
  {
    fromStep: 2,
    toStep: 3,
    action: 'QUESTION_VERIFY',
    type: 'FORWARD',
    requiredCapability: 'QUESTION:APPROVE',
    isVerificationGate: true,
    resultingDimensions: {
      workflowStep: 3,
      contentStatus: 'APPROVED',
    },
    description: '10-point pedagogical audit certified and question locked for scripting.',
  },
  {
    fromStep: 2,
    toStep: 3,
    action: 'QUESTION_APPROVE',
    type: 'FORWARD',
    requiredCapability: 'QUESTION:APPROVE',
    isVerificationGate: true,
    resultingDimensions: {
      workflowStep: 3,
      contentStatus: 'APPROVED',
    },
    description: 'Question formally approved by independent SME reviewer.',
  },
  {
    fromStep: 2,
    toStep: 1,
    action: 'QUESTION_REQUEST_CHANGES',
    type: 'REVISION',
    requiredCapability: 'QUESTION:REJECT',
    isVerificationGate: true,
    resultingDimensions: {
      workflowStep: 1,
      contentStatus: 'DRAFT',
    },
    description: 'Changes requested by SME; returns to author in Step 01.',
  },
  {
    fromStep: 2,
    toStep: 1,
    action: 'QUESTION_REJECT',
    type: 'REVISION',
    requiredCapability: 'QUESTION:REJECT',
    isVerificationGate: true,
    resultingDimensions: {
      workflowStep: 1,
      contentStatus: 'DRAFT',
    },
    description: 'Question draft returned for revision.',
  },
  {
    fromStep: 2,
    toStep: 2,
    action: 'QUESTION_TERMINATE',
    type: 'TERMINAL',
    requiredCapability: 'QUESTION:REJECT',
    isVerificationGate: true,
    resultingDimensions: {
      workflowStep: 2,
      contentStatus: 'REJECTED',
    },
    description: 'Question permanently rejected with unrecoverable pedagogical flaw.',
  },

  // --------------------------------------------------------------------------
  // STEP 03 — Audience Script
  // --------------------------------------------------------------------------
  {
    fromStep: 3,
    toStep: 4,
    action: 'SCRIPT_SUBMIT',
    type: 'FORWARD',
    requiredCapability: 'SCRIPT:SUBMIT',
    resultingDimensions: {
      workflowStep: 4,
      contentStatus: 'APPROVED',
    },
    description: 'Script locked with 3s hook and 45-58s teleprompter timing.',
  },
  {
    fromStep: 3,
    toStep: 4,
    action: 'LOCK_SCRIPT',
    type: 'FORWARD',
    requiredCapability: 'SCRIPT:SUBMIT',
    resultingDimensions: {
      workflowStep: 4,
      contentStatus: 'APPROVED',
    },
    description: 'Script frozen and queued for studio teleprompter recording.',
  },
  {
    fromStep: 3,
    toStep: 3,
    action: 'SAVE_SCRIPT_DRAFT',
    type: 'FORWARD',
    requiredCapability: 'SCRIPT:EDIT',
    resultingDimensions: {
      workflowStep: 3,
      contentStatus: 'DRAFT',
    },
    description: 'Spoken dialogue draft saved.',
  },
  {
    fromStep: 3,
    toStep: 1,
    action: 'ESCALATE_QUESTION_DEFECT',
    type: 'REVISION',
    requiredCapability: 'QUESTION:EDIT',
    resultingDimensions: {
      workflowStep: 1,
      contentStatus: 'DRAFT',
    },
    description: 'Underlying question flaw escalated back to Question Author.',
  },

  // --------------------------------------------------------------------------
  // STEP 04 — Teleprompter & Filming
  // --------------------------------------------------------------------------
  {
    fromStep: 4,
    toStep: 5,
    action: 'FILMING_COMPLETE',
    type: 'FORWARD',
    requiredCapability: 'VIDEO:EDIT',
    resultingDimensions: {
      workflowStep: 5,
      mediaStatus: 'PENDING_UPLOAD',
    },
    description: 'Filming session concluded; golden take logged.',
  },
  {
    fromStep: 4,
    toStep: 4,
    action: 'LOG_TAKE',
    type: 'FORWARD',
    requiredCapability: 'VIDEO:EDIT',
    resultingDimensions: {
      workflowStep: 4,
      mediaStatus: 'PENDING_UPLOAD',
    },
    description: 'Presenter video take logged in studio console.',
  },
  {
    fromStep: 4,
    toStep: 3,
    action: 'REQUEST_SCRIPT_REVISION',
    type: 'REVISION',
    requiredCapability: 'SCRIPT:EDIT',
    resultingDimensions: {
      workflowStep: 3,
      contentStatus: 'DRAFT',
    },
    description: 'Script unreadable or tongue-twister in studio; unlocked for revision.',
  },

  // --------------------------------------------------------------------------
  // STEP 05 — Raw Video
  // --------------------------------------------------------------------------
  {
    fromStep: 5,
    toStep: 6,
    action: 'VIDEO_INGEST',
    type: 'FORWARD',
    requiredCapability: 'MEDIA_REFERENCE:UPLOAD',
    resultingDimensions: {
      workflowStep: 6,
      mediaStatus: 'READY',
      contentStatus: 'DRAFT',
    },
    description: 'Raw video verified on Drive and dispatched to editing bay.',
  },
  {
    fromStep: 5,
    toStep: 6,
    action: 'DISPATCH_EDITING',
    type: 'FORWARD',
    requiredCapability: 'MEDIA_REFERENCE:UPLOAD',
    resultingDimensions: {
      workflowStep: 6,
      mediaStatus: 'READY',
      contentStatus: 'DRAFT',
    },
    description: 'Handoff to editing bay confirmed.',
  },
  {
    fromStep: 5,
    toStep: 4,
    action: 'RE_SHOOT_REQUIRED',
    type: 'REVISION',
    requiredCapability: 'VIDEO:EDIT',
    resultingDimensions: {
      workflowStep: 4,
      mediaStatus: 'NOT_REQUIRED',
    },
    description: 'Raw camera footage corrupt or missing; re-shoot in studio.',
  },

  // --------------------------------------------------------------------------
  // STEP 06 — Editing Bay
  // --------------------------------------------------------------------------
  {
    fromStep: 6,
    toStep: 7,
    action: 'VIDEO_EDIT_COMPLETE',
    type: 'FORWARD',
    requiredCapability: 'VIDEO_EDIT:SUBMIT',
    resultingDimensions: {
      workflowStep: 7,
      contentStatus: 'IN_REVIEW',
      mediaStatus: 'READY',
    },
    description: 'Master cut rendered with Telugu subtitles and submitted for Final QC.',
  },
  {
    fromStep: 6,
    toStep: 7,
    action: 'SUBMIT_QC',
    type: 'FORWARD',
    requiredCapability: 'VIDEO_EDIT:SUBMIT',
    resultingDimensions: {
      workflowStep: 7,
      contentStatus: 'IN_REVIEW',
      mediaStatus: 'READY',
    },
    description: 'Video master cut dispatched to Master QC Theater.',
  },
  {
    fromStep: 6,
    toStep: 6,
    action: 'SAVE_EDIT_CUT',
    type: 'FORWARD',
    requiredCapability: 'VIDEO_EDIT:EDIT',
    resultingDimensions: {
      workflowStep: 6,
      contentStatus: 'DRAFT',
    },
    description: 'Working video cut saved.',
  },

  // --------------------------------------------------------------------------
  // STEP 07 — Final QC (GAR-02 Human Verification Gate)
  // --------------------------------------------------------------------------
  {
    fromStep: 7,
    toStep: 8,
    action: 'VIDEO_QC_VERIFY',
    type: 'FORWARD',
    requiredCapability: 'VIDEO_EDIT:APPROVE',
    isVerificationGate: true,
    resultingDimensions: {
      workflowStep: 8,
      contentStatus: 'APPROVED',
      mediaStatus: 'READY',
    },
    description: '6-point Master QC certified passed; safe-zones and audio approved.',
  },
  {
    fromStep: 7,
    toStep: 8,
    action: 'APPROVE_QC',
    type: 'FORWARD',
    requiredCapability: 'VIDEO_EDIT:APPROVE',
    isVerificationGate: true,
    resultingDimensions: {
      workflowStep: 8,
      contentStatus: 'APPROVED',
      mediaStatus: 'READY',
    },
    description: 'Master cut certified; ready for packaging & thumbnail creation.',
  },
  {
    fromStep: 7,
    toStep: 6,
    action: 'VIDEO_QC_REJECT',
    type: 'REVISION',
    requiredCapability: 'VIDEO_EDIT:REJECT',
    isVerificationGate: true,
    resultingDimensions: {
      workflowStep: 6,
      contentStatus: 'REJECTED',
    },
    description: 'QC failure (typo, audio clipping, safe-zone collision); returned to editor.',
  },

  // --------------------------------------------------------------------------
  // STEP 08 — Thumbnail
  // --------------------------------------------------------------------------
  {
    fromStep: 8,
    toStep: 9,
    action: 'THUMBNAIL_APPROVE',
    type: 'FORWARD',
    requiredCapability: 'THUMBNAIL:SUBMIT',
    resultingDimensions: {
      workflowStep: 9,
      contentStatus: 'APPROVED',
    },
    description: 'Primary thumbnail selected and verified legible on mobile.',
  },
  {
    fromStep: 8,
    toStep: 9,
    action: 'SUBMIT_THUMBNAIL',
    type: 'FORWARD',
    requiredCapability: 'THUMBNAIL:SUBMIT',
    resultingDimensions: {
      workflowStep: 9,
      contentStatus: 'APPROVED',
    },
    description: 'Thumbnail candidate approved for social review.',
  },

  // --------------------------------------------------------------------------
  // STEP 09 — Social Review (GAR-02 Human Verification Gate)
  // --------------------------------------------------------------------------
  {
    fromStep: 9,
    toStep: 10,
    action: 'SOCIAL_REVIEW_APPROVE',
    type: 'FORWARD',
    requiredCapability: 'SOCIAL_REVIEW:APPROVE',
    isVerificationGate: true,
    resultingDimensions: {
      workflowStep: 10,
      publicationStatus: 'UNPUBLISHED',
      contentStatus: 'APPROVED',
    },
    description: '9:16 mobile simulator audit passed; copy, hashtags, pinned comment signed off.',
  },
  {
    fromStep: 9,
    toStep: 10,
    action: 'APPROVE_SOCIAL',
    type: 'FORWARD',
    requiredCapability: 'SOCIAL_REVIEW:APPROVE',
    isVerificationGate: true,
    resultingDimensions: {
      workflowStep: 10,
      publicationStatus: 'UNPUBLISHED',
      contentStatus: 'APPROVED',
    },
    description: 'Social review bundle certified for distribution.',
  },
  {
    fromStep: 9,
    toStep: 8,
    action: 'REQUEST_THUMBNAIL_REVISION',
    type: 'REVISION',
    requiredCapability: 'SOCIAL_REVIEW:REJECT',
    isVerificationGate: true,
    resultingDimensions: {
      workflowStep: 8,
      contentStatus: 'DRAFT',
    },
    description: 'Thumbnail visual defect in simulator; return to designer in Step 08.',
  },
  {
    fromStep: 9,
    toStep: 6,
    action: 'REQUEST_VIDEO_REVISION',
    type: 'REVISION',
    requiredCapability: 'SOCIAL_REVIEW:REJECT',
    isVerificationGate: true,
    resultingDimensions: {
      workflowStep: 6,
      contentStatus: 'DRAFT',
    },
    description: 'UI collision with platform chrome; return to editor in Step 06.',
  },

  // --------------------------------------------------------------------------
  // STEP 10 — Publishing Setup
  // --------------------------------------------------------------------------
  {
    fromStep: 10,
    toStep: 11,
    action: 'PUBLISH_SCHEDULE',
    type: 'FORWARD',
    requiredCapability: 'PUBLICATION:SCHEDULE',
    resultingDimensions: {
      workflowStep: 11,
      publicationStatus: 'SCHEDULED',
    },
    description: 'Pre-publish checklist certified; slot scheduled or immediate publish set.',
  },
  {
    fromStep: 10,
    toStep: 11,
    action: 'SCHEDULE_PUBLISH',
    type: 'FORWARD',
    requiredCapability: 'PUBLICATION:SCHEDULE',
    resultingDimensions: {
      workflowStep: 11,
      publicationStatus: 'SCHEDULED',
    },
    description: 'Publishing package locked for execution.',
  },
  {
    fromStep: 10,
    toStep: 10,
    action: 'CONFIGURE_PLATFORMS',
    type: 'FORWARD',
    requiredCapability: 'PUBLISHING_PACKAGE:EDIT',
    resultingDimensions: {
      workflowStep: 10,
      publicationStatus: 'UNPUBLISHED',
    },
    description: 'Distribution channels and slot timing configured.',
  },
  {
    fromStep: 10,
    toStep: 9,
    action: 'REQUEST_COPY_REVISION',
    type: 'REVISION',
    requiredCapability: 'PUBLISHING_PACKAGE:EDIT',
    resultingDimensions: {
      workflowStep: 9,
      publicationStatus: 'UNPUBLISHED',
    },
    description: 'Social copy alteration needed; returned to Stage 09.',
  },

  // --------------------------------------------------------------------------
  // STEP 11 — Published
  // --------------------------------------------------------------------------
  {
    fromStep: 11,
    toStep: 12,
    action: 'PUBLISH_EXECUTE',
    type: 'FORWARD',
    requiredCapability: 'PUBLICATION:PUBLISH',
    resultingDimensions: {
      workflowStep: 12,
      publicationStatus: 'LIVE',
    },
    description: 'Video live on platforms; external platform ID and URL verified.',
  },
  {
    fromStep: 11,
    toStep: 12,
    action: 'CONFIRM_LIVE',
    type: 'FORWARD',
    requiredCapability: 'PUBLICATION:PUBLISH',
    resultingDimensions: {
      workflowStep: 12,
      publicationStatus: 'LIVE',
    },
    description: 'Live publication confirmed and recorded.',
  },
  {
    fromStep: 11,
    toStep: 10,
    action: 'CANCEL_SCHEDULE',
    type: 'REVISION',
    requiredCapability: 'PUBLICATION:SCHEDULE',
    resultingDimensions: {
      workflowStep: 10,
      publicationStatus: 'UNPUBLISHED',
    },
    description: 'Scheduled release cancelled prior to execution.',
  },

  // --------------------------------------------------------------------------
  // STEP 12 — Platform Sync
  // --------------------------------------------------------------------------
  {
    fromStep: 12,
    toStep: 13,
    action: 'PLATFORM_SYNC',
    type: 'FORWARD',
    requiredCapability: 'PUBLICATION:SYNC',
    resultingDimensions: {
      workflowStep: 13,
      publicationStatus: 'SYNCED',
    },
    description: 'Cross-platform metadata reconciled and pinned comment verified active.',
  },
  {
    fromStep: 12,
    toStep: 13,
    action: 'COMPLETE_SYNC',
    type: 'FORWARD',
    requiredCapability: 'PUBLICATION:SYNC',
    resultingDimensions: {
      workflowStep: 13,
      publicationStatus: 'SYNCED',
    },
    description: 'Platform synchronization logged.',
  },

  // --------------------------------------------------------------------------
  // STEP 13 — Analytics
  // --------------------------------------------------------------------------
  {
    fromStep: 13,
    toStep: 14,
    action: 'ANALYTICS_INGEST',
    type: 'FORWARD',
    requiredCapability: 'ANALYTICS_SNAPSHOT:VIEW',
    resultingDimensions: {
      workflowStep: 14,
    },
    description: '24h/7d audience telemetry and retention curve ingested.',
  },
  {
    fromStep: 13,
    toStep: 14,
    action: 'DISPATCH_PERF_REVIEW',
    type: 'FORWARD',
    requiredCapability: 'ANALYTICS_SNAPSHOT:VIEW',
    resultingDimensions: {
      workflowStep: 14,
    },
    description: 'Telemetry threshold met; dispatched for pedagogical performance review.',
  },

  // --------------------------------------------------------------------------
  // STEP 14 — Performance Review
  // --------------------------------------------------------------------------
  {
    fromStep: 14,
    toStep: 15,
    action: 'PERFORMANCE_INDEX',
    type: 'FORWARD',
    requiredCapability: 'PERFORMANCE_RECORD:REVIEW',
    resultingDimensions: {
      workflowStep: 15,
    },
    description: 'Retention drop-offs and confusion points mapped to script lines.',
  },
  {
    fromStep: 14,
    toStep: 15,
    action: 'FINALIZE_PERF_REVIEW',
    type: 'FORWARD',
    requiredCapability: 'PERFORMANCE_RECORD:REVIEW',
    resultingDimensions: {
      workflowStep: 15,
    },
    description: 'Performance diagnostic record finalized.',
  },

  // --------------------------------------------------------------------------
  // STEP 15 — Intelligence Loop (Terminal Complete)
  // --------------------------------------------------------------------------
  {
    fromStep: 15,
    toStep: 15,
    action: 'INTELLIGENCE_LOOP_FEED',
    type: 'TERMINAL',
    requiredCapability: 'INTELLIGENCE_INSIGHT:APPROVE',
    resultingDimensions: {
      workflowStep: 15,
      contentStatus: 'ARCHIVED',
      publicationStatus: 'SYNCED',
      jobStatus: 'COMPLETED',
    },
    description: 'Curriculum directive approved; current workflow closed and archived.',
  },
  {
    fromStep: 15,
    toStep: 15,
    action: 'COMPLETE_WORKFLOW',
    type: 'TERMINAL',
    requiredCapability: 'INTELLIGENCE_INSIGHT:APPROVE',
    resultingDimensions: {
      workflowStep: 15,
      contentStatus: 'ARCHIVED',
      publicationStatus: 'SYNCED',
      jobStatus: 'COMPLETED',
    },
    description: 'Lifecycle completed. Next production cycle begins in future instance at Step 01.',
  },
];

/**
 * Finds the canonical rule for a proposed transition.
 */
export function findTransitionRule(
  fromStep: WorkflowStepNumber,
  toStep: number,
  action: string
): TransitionRule | null {
  const normAction = action.toUpperCase().trim();
  const rule = CANONICAL_TRANSITION_RULES.find(
    (r) =>
      r.fromStep === fromStep &&
      r.toStep === toStep &&
      (r.action.toUpperCase() === normAction || normAction.includes(r.action.toUpperCase()))
  );
  return rule || null;
}

/**
 * Gets all allowed transitions out of the given current step.
 */
export function getRulesForStep(step: WorkflowStepNumber): TransitionRule[] {
  return CANONICAL_TRANSITION_RULES.filter((r) => r.fromStep === step);
}

/**
 * Validates domain content prerequisites for entering the target step.
 */
export function checkStepPrerequisites(
  item: WorkflowInstanceDocument,
  targetStep: number,
  action: string,
  contentPayload?: Record<string, unknown>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Step 02 Prerequisite: Complete question text, proof, and 4 options
  if (targetStep === 2) {
    if (contentPayload) {
      if (!contentPayload.questionText && !contentPayload.text) {
        errors.push('Question text is required before submitting for verification.');
      }
      if (Array.isArray(contentPayload.options) && contentPayload.options.length < 4) {
        errors.push('Question must have exactly 4 options before submitting for verification.');
      }
      if (contentPayload.proofRequired && !contentPayload.proofSteps && !contentPayload.proof) {
        errors.push('Mathematical proof is required before submitting for verification.');
      }
    }
  }

  // Step 04 Prerequisite: Script duration cannot exceed 60 seconds
  if (targetStep === 4) {
    if (contentPayload && typeof contentPayload.estimatedDurationSeconds === 'number') {
      if (contentPayload.estimatedDurationSeconds > 60) {
        errors.push('Script duration exceeds 60 seconds; teleprompter pacing gate failed.');
      }
    }
  }

  // Step 06 Prerequisite: Media must be ready or ingested
  if (targetStep === 6) {
    if (item.mediaStatus === 'FAILED') {
      errors.push('Raw media upload failed; cannot enter Editing Bay without usable footage.');
    }
  }

  // Step 08 Prerequisite: Final QC must be approved
  if (targetStep === 8) {
    if (action.includes('REJECT')) {
      errors.push('Cannot advance to Thumbnail while Master QC is rejected.');
    }
  }

  // Step 11 Prerequisite: Cannot publish if media failed
  if (targetStep === 11) {
    if (item.mediaStatus === 'FAILED') {
      errors.push('Media asset status is FAILED; cannot publish corrupted asset.');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
