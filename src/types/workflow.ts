/**
 * BURRA PARIKSHA CMS — Canonical 15-Step Workflow State Machine Contract
 * Stage 27 Feature Contract: FC-005 (Canonical 15-Step Workflow State Machine)
 * Traced to:
 * - docs/features/FC-005-WORKFLOW-STATE-ENGINE.md
 * - docs/architecture/07-CANONICAL-15-STEP-WORKFLOW.md
 * - docs/architecture/08-STATE-MODEL.md
 *
 * Implements the authoritative backend workflow state machine governing the canonical 15-step
 * BP-CMS workflow, 5 decoupled state dimensions, and transition schemas.
 */

import { z } from 'zod';
import { BaseEntity } from '../lib/db/repository.interface';
import { CapabilityString } from './rbac-models';

// ============================================================================
// 1. CANONICAL 15 STEPS ENUMERATION (1..15)
// ============================================================================

export enum CanonicalWorkflowStep {
  QUESTION_GENERATION = 1,
  QUESTION_VERIFICATION = 2,
  AUDIENCE_SCRIPT = 3,
  TELEPROMPTER_FILMING = 4,
  RAW_VIDEO = 5,
  EDITING_BAY = 6,
  FINAL_QC = 7,
  THUMBNAIL = 8,
  SOCIAL_REVIEW = 9,
  PUBLISHING_SETUP = 10,
  PUBLISHED = 11,
  PLATFORM_SYNC = 12,
  ANALYTICS = 13,
  PERFORMANCE_REVIEW = 14,
  INTELLIGENCE_LOOP = 15,
}

export type WorkflowStepNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;

export interface WorkflowStepDefinition {
  step: WorkflowStepNumber;
  code: string;
  name: string;
  shortName: string;
  description: string;
  isVerificationStep: boolean; // GAR-02 gate enforced
  requiredCapability: CapabilityString | string;
  primaryRole: string;
  hub: string;
}

export const CANONICAL_WORKFLOW_STEPS: Record<WorkflowStepNumber, WorkflowStepDefinition> = {
  1: {
    step: 1,
    code: '01_QUESTION_GENERATION',
    name: 'Question Generation',
    shortName: '01 Q-Gen',
    description: 'AI drafting, taxonomy binding, Telugu distraction options, and mathematical proof formulation.',
    isVerificationStep: false,
    requiredCapability: 'QUESTION:SUBMIT',
    primaryRole: 'QUESTION_AUTHOR',
    hub: 'Curriculum & Question Studio',
  },
  2: {
    step: 2,
    code: '02_QUESTION_VERIFICATION',
    name: 'Question Verification',
    shortName: '02 Q-Verify',
    description: '10-point pedagogical audit, proof verification, editorial sign-off (GAR-02 Human Gate).',
    isVerificationStep: true,
    requiredCapability: 'QUESTION:APPROVE',
    primaryRole: 'QA_REVIEWER',
    hub: 'Question Verification Bay',
  },
  3: {
    step: 3,
    code: '03_AUDIENCE_SCRIPT',
    name: 'Audience Script',
    shortName: '03 Script',
    description: '60-second presenter script drafting with 3-second hook, pacing markers, and speed tricks.',
    isVerificationStep: false,
    requiredCapability: 'SCRIPT:SUBMIT',
    primaryRole: 'SCRIPTWRITER',
    hub: 'Script Studio',
  },
  4: {
    step: 4,
    code: '04_TELEPROMPTER_FILMING',
    name: 'Teleprompter & Filming',
    shortName: '04 Filming',
    description: 'Studio presenter recording session using interactive auto-scroll teleprompter and multi-take logging.',
    isVerificationStep: false,
    requiredCapability: 'VIDEO:EDIT',
    primaryRole: 'PRESENTER',
    hub: 'Teleprompter Console',
  },
  5: {
    step: 5,
    code: '05_RAW_VIDEO',
    name: 'Raw Video',
    shortName: '05 Raw Video',
    description: 'Raw camera footage ingestion, external Drive folder registration, and handoff to the editing bay.',
    isVerificationStep: false,
    requiredCapability: 'MEDIA_REFERENCE:UPLOAD',
    primaryRole: 'PRODUCER',
    hub: 'Raw Video Ingestion Bay',
  },
  6: {
    step: 6,
    code: '06_EDITING_BAY',
    name: 'Editing Bay',
    shortName: '06 Edit-Bay',
    description: 'Video master cut assembly, dynamic Telugu captions, sound effects, graphics, and timer overlays.',
    isVerificationStep: false,
    requiredCapability: 'VIDEO_EDIT:SUBMIT',
    primaryRole: 'VIDEO_EDITOR',
    hub: 'Editing Bay Console',
  },
  7: {
    step: 7,
    code: '07_FINAL_QC',
    name: 'Final QC',
    shortName: '07 Final QC',
    description: '6-point Master QC certification: safe-zones, audio LUFS, Telugu typo audit (GAR-02 Human Gate).',
    isVerificationStep: true,
    requiredCapability: 'VIDEO_EDIT:APPROVE',
    primaryRole: 'CONTENT_LEAD',
    hub: 'Final QC Theater',
  },
  8: {
    step: 8,
    code: '08_THUMBNAIL',
    name: 'Thumbnail',
    shortName: '08 Thumb',
    description: 'High-CTR curiosity-framing thumbnail artwork creation, mobile simulation, and approval.',
    isVerificationStep: false,
    requiredCapability: 'THUMBNAIL:SUBMIT',
    primaryRole: 'DESIGNER',
    hub: 'Thumbnail Studio',
  },
  9: {
    step: 9,
    code: '09_SOCIAL_REVIEW',
    name: 'Social Review',
    shortName: '09 Soc-Rev',
    description: '9:16 smartphone simulator inspection, copy packaging, hashtags, pinned comment (GAR-02 Human Gate).',
    isVerificationStep: true,
    requiredCapability: 'SOCIAL_REVIEW:APPROVE',
    primaryRole: 'PUBLISHING_LEAD',
    hub: 'Social Review Studio',
  },
  10: {
    step: 10,
    code: '10_PUBLISHING_SETUP',
    name: 'Publishing Setup',
    shortName: '10 Pub-Setup',
    description: 'Multi-platform scheduling, platform slot configuration, and pre-publish readiness confirmation.',
    isVerificationStep: false,
    requiredCapability: 'PUBLICATION:SCHEDULE',
    primaryRole: 'PUBLISHING_LEAD',
    hub: 'Publishing Console',
  },
  11: {
    step: 11,
    code: '11_PUBLISHED',
    name: 'Published',
    shortName: '11 Published',
    description: 'Live publication execution on YouTube Shorts, Instagram Reels, Facebook Video with URL verification.',
    isVerificationStep: false,
    requiredCapability: 'PUBLICATION:PUBLISH',
    primaryRole: 'PUBLISHING_LEAD',
    hub: 'Publishing Live Monitor',
  },
  12: {
    step: 12,
    code: '12_PLATFORM_SYNC',
    name: 'Platform Sync',
    shortName: '12 Sync',
    description: 'Cross-platform metadata reconciliation, URL verification, and post-publish status confirmation.',
    isVerificationStep: false,
    requiredCapability: 'PUBLICATION:SYNC',
    primaryRole: 'PUBLISHING_LEAD',
    hub: 'Platform Packages & Sync',
  },
  13: {
    step: 13,
    code: '13_ANALYTICS',
    name: 'Analytics',
    shortName: '13 Analytics',
    description: 'Scheduled ingestion of audience telemetry (views, retention curves, engagement metrics).',
    isVerificationStep: false,
    requiredCapability: 'ANALYTICS_SNAPSHOT:VIEW',
    primaryRole: 'ANALYST',
    hub: 'Social Analytics Studio',
  },
  14: {
    step: 14,
    code: '14_PERFORMANCE_REVIEW',
    name: 'Performance Review',
    shortName: '14 Perf-Rev',
    description: 'Retention drop-off analysis, student confusion pattern identification, and editorial critique.',
    isVerificationStep: false,
    requiredCapability: 'PERFORMANCE_RECORD:REVIEW',
    primaryRole: 'CONTENT_LEAD',
    hub: 'Performance & Retention Bay',
  },
  15: {
    step: 15,
    code: '15_INTELLIGENCE_LOOP',
    name: 'Intelligence Loop',
    shortName: '15 Intel-Loop',
    description: 'Pedagogical intelligence synthesis, topic recommendation extraction, directives seeding future cycle.',
    isVerificationStep: false,
    requiredCapability: 'INTELLIGENCE_INSIGHT:APPROVE',
    primaryRole: 'ADMIN',
    hub: 'Pedagogical Intelligence Console',
  },
};

// ============================================================================
// 2. FIVE DECOUPLED STATE DIMENSIONS
// Fundamental Axiom: workflowStep ≠ contentStatus ≠ mediaStatus ≠ publicationStatus ≠ jobStatus
// ============================================================================

export type ContentStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED' | 'ARCHIVED';
export type MediaStatus = 'NOT_REQUIRED' | 'PENDING_UPLOAD' | 'PROCESSING' | 'READY' | 'FAILED';
export type PublicationStatus = 'UNPUBLISHED' | 'SCHEDULED' | 'LIVE' | 'SYNCED' | 'ERROR';
export type JobStatus = 'IDLE' | 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export const CONTENT_STATUSES: readonly ContentStatus[] = ['DRAFT', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'ARCHIVED'];
export const MEDIA_STATUSES: readonly MediaStatus[] = ['NOT_REQUIRED', 'PENDING_UPLOAD', 'PROCESSING', 'READY', 'FAILED'];
export const PUBLICATION_STATUSES: readonly PublicationStatus[] = ['UNPUBLISHED', 'SCHEDULED', 'LIVE', 'SYNCED', 'ERROR'];
export const JOB_STATUSES: readonly JobStatus[] = ['IDLE', 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED'];

export interface FiveDimensionalState {
  workflowStep: WorkflowStepNumber;
  contentStatus: ContentStatus;
  mediaStatus: MediaStatus;
  publicationStatus: PublicationStatus;
  jobStatus: JobStatus;
}

// ============================================================================
// 3. WORKFLOW PERSISTENCE ENTITIES
// ============================================================================

export type WorkflowEntityType = 'QUESTION' | 'SCRIPT' | 'VIDEO' | 'PACKAGE' | 'CONTENT';

export interface WorkflowInstanceDocument extends BaseEntity {
  id: string; // e.g. wfl_xxxx
  entityType: WorkflowEntityType;
  entityId: string;
  currentStep: WorkflowStepNumber;
  contentStatus: ContentStatus;
  mediaStatus: MediaStatus;
  publicationStatus: PublicationStatus;
  jobStatus: JobStatus;
  authorId?: string; // Identity of initial author/creator for GAR-02 segregation checks
  lastTransitionAt: string;
  lastTransitionBy: string;
  metadata?: Record<string, unknown>;
}

export interface WorkflowHistoryEntry extends BaseEntity {
  id: string; // e.g. wfh_xxxx
  workflowId: string;
  entityId: string;
  entityType: WorkflowEntityType;
  fromStep: WorkflowStepNumber;
  toStep: WorkflowStepNumber;
  action: string;
  actorId: string;
  actorRole?: string;
  timestamp: string;
  version: number; // Item version after transition
  reason?: string;
  result: 'SUCCESS' | 'REJECTED' | 'FAILED';
  metadata?: Record<string, unknown>;
}

// ============================================================================
// 4. TRANSITION CONTRACTS & RULES
// ============================================================================

export type TransitionType = 'FORWARD' | 'REVISION' | 'REJECTION' | 'TERMINAL';

export interface TransitionRule {
  fromStep: WorkflowStepNumber;
  toStep: WorkflowStepNumber;
  action: string;
  type: TransitionType;
  requiredCapability: CapabilityString | string;
  isVerificationGate?: boolean; // Checks GAR-02: actor.id !== authorId
  resultingDimensions?: Partial<FiveDimensionalState>;
  description: string;
}

export interface ValidTransitionTarget {
  targetStep: WorkflowStepNumber;
  action: string;
  type: TransitionType;
  isAvailable: boolean;
  requiredCapability: string;
  blockedReason?: string;
}

export interface WorkflowActorContext {
  id: string;
  name?: string;
  role: string;
  roles?: string[];
  isAiAgent?: boolean;
}

export interface WorkflowTransitionInput {
  targetStep: number;
  action: string;
  reason?: string;
  expectedVersion: number;
  contentPayload?: Record<string, unknown>;
}

export interface WorkflowTransitionResult {
  success: boolean;
  workflow: WorkflowInstanceDocument;
  historyEntry: WorkflowHistoryEntry;
  auditAction: string;
  realtimeEvent: string;
}

// ============================================================================
// 5. ZOD SCHEMAS FOR API VALIDATION
// ============================================================================

export const WorkflowTransitionRequestSchema = z.object({
  targetStep: z.number().int().min(1).max(15),
  action: z.string().min(1, 'Transition action is required'),
  reason: z.string().optional(),
  expectedVersion: z.number().int().positive('expectedVersion must be a positive integer'),
  contentPayload: z.record(z.string(), z.unknown()).optional(),
});

export type WorkflowTransitionRequest = z.infer<typeof WorkflowTransitionRequestSchema>;

export const CreateWorkflowInstanceSchema = z.object({
  entityType: z.enum(['QUESTION', 'SCRIPT', 'VIDEO', 'PACKAGE', 'CONTENT']),
  entityId: z.string().min(1, 'entityId is required'),
  currentStep: z.number().int().min(1).max(15).default(1),
  contentStatus: z.enum(['DRAFT', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'ARCHIVED']).default('DRAFT'),
  mediaStatus: z.enum(['NOT_REQUIRED', 'PENDING_UPLOAD', 'PROCESSING', 'READY', 'FAILED']).default('NOT_REQUIRED'),
  publicationStatus: z.enum(['UNPUBLISHED', 'SCHEDULED', 'LIVE', 'SYNCED', 'ERROR']).default('UNPUBLISHED'),
  jobStatus: z.enum(['IDLE', 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED']).default('IDLE'),
  authorId: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type CreateWorkflowInstanceInput = z.input<typeof CreateWorkflowInstanceSchema>;
export type CreateWorkflowInstanceOutput = z.infer<typeof CreateWorkflowInstanceSchema>;
