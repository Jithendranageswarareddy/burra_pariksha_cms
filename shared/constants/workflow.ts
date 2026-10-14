/**
 * BURRA PARIKSHA CMS — Shared Workflow Constants
 * Canonical 15-Step Workflow & State Dimensions
 */

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

export type WorkflowStageStatus =
  | 'NOT_STARTED'
  | 'DRAFT'
  | 'IN_PROGRESS'
  | 'PENDING_REVIEW'
  | 'CHANGES_REQUESTED'
  | 'APPROVED'
  | 'BLOCKED'
  | 'SCHEDULED'
  | 'PUBLISHED'
  | 'SYNCED'
  | 'COMPLETED'
  | 'TERMINATED';

export interface WorkflowStepDefinition {
  step: WorkflowStepNumber;
  code: string;
  name: string;
  shortName: string;
  description: string;
  isVerificationStep: boolean;
  requiredCapability: string;
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
    description: '15-second hook, fast mental solution, speed math trick, and CTA script formulation.',
    isVerificationStep: false,
    requiredCapability: 'SCRIPT:SUBMIT',
    primaryRole: 'SCRIPTWRITER',
    hub: 'Scriptwriting Bay',
  },
  4: {
    step: 4,
    code: '04_TELEPROMPTER_FILMING',
    name: 'Teleprompter & Filming',
    shortName: '04 Shoot',
    description: 'Studio capture session, live teleprompter execution, multi-take video acquisition.',
    isVerificationStep: false,
    requiredCapability: 'VIDEO:RECORD',
    primaryRole: 'PRESENTER',
    hub: 'Studio Recording Bay',
  },
  5: {
    step: 5,
    code: '05_RAW_VIDEO',
    name: 'Raw Video',
    shortName: '05 Raw Footage',
    description: 'Cloud Drive sync, raw file SHA-256 ingestion, presenter take selection.',
    isVerificationStep: false,
    requiredCapability: 'VIDEO:UPLOAD',
    primaryRole: 'VIDEO_EDITOR',
    hub: 'Media Ingestion Bay',
  },
  6: {
    step: 6,
    code: '06_EDITING_BAY',
    name: 'Editing Bay',
    shortName: '06 Edit',
    description: 'Motion graphics insertion, sound design, sound FX, Telugu on-screen captions.',
    isVerificationStep: false,
    requiredCapability: 'VIDEO:EDIT',
    primaryRole: 'VIDEO_EDITOR',
    hub: 'Editing Studio',
  },
  7: {
    step: 7,
    code: '07_FINAL_QC',
    name: 'Final QC',
    shortName: '07 Final QC',
    description: 'Audio levels normalization (-14 LUFS), 9:16 aspect ratio audit, render approval (GAR-02 Human Gate).',
    isVerificationStep: true,
    requiredCapability: 'VIDEO:APPROVE',
    primaryRole: 'QA_REVIEWER',
    hub: 'Quality Control Bay',
  },
  8: {
    step: 8,
    code: '08_THUMBNAIL',
    name: 'Thumbnail',
    shortName: '08 Thumbnail',
    description: 'High-contrast CTR typography, split-screen curiosity frame design, asset lock.',
    isVerificationStep: false,
    requiredCapability: 'THUMBNAIL:SUBMIT',
    primaryRole: 'DESIGNER',
    hub: 'Design & Visual Bay',
  },
  9: {
    step: 9,
    code: '09_SOCIAL_REVIEW',
    name: 'Social Review',
    shortName: '09 Social QC',
    description: 'Triple-asset package check (Render + Thumbnail + Pinned Comment), brand gate (GAR-02 Human Gate).',
    isVerificationStep: true,
    requiredCapability: 'CONTENT:APPROVE',
    primaryRole: 'CONTENT_LEAD',
    hub: 'Editorial Review Desk',
  },
  10: {
    step: 10,
    code: '10_PUBLISHING_SETUP',
    name: 'Publishing Setup',
    shortName: '10 Setup',
    description: 'Multi-platform package generation, schedule slot assignment, platform metadata adaptation.',
    isVerificationStep: false,
    requiredCapability: 'PUBLICATION:SCHEDULE',
    primaryRole: 'PUBLISHING_LEAD',
    hub: 'Publishing Operations',
  },
  11: {
    step: 11,
    code: '11_PUBLISHED',
    name: 'Published',
    shortName: '11 Live',
    description: 'Live publication confirmation, social platform permalink extraction.',
    isVerificationStep: false,
    requiredCapability: 'PUBLICATION:PUBLISH',
    primaryRole: 'PUBLISHING_LEAD',
    hub: 'Publishing Operations',
  },
  12: {
    step: 12,
    code: '12_PLATFORM_SYNC',
    name: 'Platform Sync',
    shortName: '12 Sync',
    description: 'Platform API synchronization, video permalink verification, pinned comment posting.',
    isVerificationStep: false,
    requiredCapability: 'PLATFORM:SYNC',
    primaryRole: 'PUBLISHING_LEAD',
    hub: 'Publishing Operations',
  },
  13: {
    step: 13,
    code: '13_ANALYTICS',
    name: 'Analytics',
    shortName: '13 Telemetry',
    description: '24-hour and 7-day social telemetry ingestion (Views, Watch Time, CTR, Engagement).',
    isVerificationStep: false,
    requiredCapability: 'ANALYTICS:VIEW',
    primaryRole: 'ANALYST',
    hub: 'Analytics Center',
  },
  14: {
    step: 14,
    code: '14_PERFORMANCE_REVIEW',
    name: 'Performance Review',
    shortName: '14 Review',
    description: 'Target KPI benchmarking, retention drop-off analysis, editorial feedback collation.',
    isVerificationStep: false,
    requiredCapability: 'PERFORMANCE:ANALYZE',
    primaryRole: 'CONTENT_LEAD',
    hub: 'Analytics Center',
  },
  15: {
    step: 15,
    code: '15_INTELLIGENCE_LOOP',
    name: 'Intelligence Loop',
    shortName: '15 Intelligence',
    description: 'High-performing hook taxonomy ingestion, prompt tuning recommendation feedback.',
    isVerificationStep: false,
    requiredCapability: 'INTELLIGENCE:CLOSE_LOOP',
    primaryRole: 'CONTENT_LEAD',
    hub: 'Intelligence Hub',
  },
};

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

// Decoupled 5 State Dimensions
export enum EditorialStatus {
  DRAFT = 'DRAFT',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  REVISED = 'REVISED',
}

export enum ValidationStatus {
  UNVALIDATED = 'UNVALIDATED',
  VALIDATING = 'VALIDATING',
  VALID = 'VALID',
  INVALID = 'INVALID',
  NEEDS_REVIEW = 'NEEDS_REVIEW',
}

export enum AssetStatus {
  MISSING = 'MISSING',
  IN_PRODUCTION = 'IN_PRODUCTION',
  UPLOADED = 'UPLOADED',
  APPROVED = 'APPROVED',
}

export enum PublishStatus {
  UNSCHEDULED = 'UNSCHEDULED',
  SCHEDULED = 'SCHEDULED',
  PUBLISHED = 'PUBLISHED',
  FAILED = 'FAILED',
}

export enum AnalyticsStatus {
  NOT_TRACKED = 'NOT_TRACKED',
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  ARCHIVED = 'ARCHIVED',
}

// Five Decoupled State Dimensions
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

// UI Workflow Step Indicator Types
export type StepState = 'completed' | 'current' | 'upcoming' | 'blocked';

export interface ProductionWorkflowStep {
  stepNumber: number;
  id: string;
  label: string;
  shortLabel?: string;
  description?: string;
  path: string;
  state?: StepState;
}
