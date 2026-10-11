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

// ============================================================================
// CANONICAL WORKFLOW STATE MODEL & 15 STEPS UI SPECIFICATION
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
    canonicalRoute: '/platform-packages/:videoId',
    responsibleRole: 'Social Operations Specialist',
    inputEntity: 'Live Published Video Post',
    outputEntity: 'Sync Verified Package Bundle',
    completionGate: 'Multi-platform live posts confirmed matching platform guidelines',
    forwardStep: 13,
    revisionRoute: '/platform-packages/:videoId',
    rejectionRoute: '/platform-packages/:videoId',
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
