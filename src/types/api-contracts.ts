/**
 * BURRA PARIKSHA CMS — Stage 15 API Architecture & Contracts
 *
 * Implements the authoritative backend API contracts for BP-CMS:
 * - Universal API Response & Error Envelopes
 * - Standardized Error Codes Dictionary & HTTP Status Code Mappings
 * - Request Context & Authentication Contracts (Zero-Trust Bearer tokens)
 * - 15 Canonical Workflow Step API Contracts (Zod runtime schemas & metadata)
 * - Supporting Domain API Contracts (Workflow Transitions, Media Asset Hashing/Archiving, RBAC, Audit)
 * - Security & Business Rules Governance:
 *     - Segregation of Duties (GAR-02 Anti-Self-Approval)
 *     - Human-Gated Boundaries (AP-009 AI Restriction)
 *     - Optimistic Concurrency Control (OCC AP-005)
 *     - Audit Event Emission Specification (AP-014)
 *
 * Grounded in:
 * - Stage 04 Architecture Principles (AP-001 through AP-014)
 * - Stage 07 Canonical 15-Step Workflow
 * - Stage 08 State Model (5 State Dimensions & OCC Preconditions)
 * - Stage 09 RBAC & Capability Matrix (RESOURCE:ACTION Capability Syntax)
 * - Stage 12 Database Decision & Stage 13 Data Contracts
 * - Stage 14 Media Architecture (Tri-Layer Media Ingestion & Hashing)
 */

import { z } from 'zod';
import {
  AuthorizationResource,
  AuthorizationAction,
  CapabilityString,
  CanonicalRbacRole,
  HUMAN_GATED_STAGES,
  HUMAN_GATED_CAPABILITIES,
} from './rbac-models';
import { BusinessWorkflowStepNumber } from './state-models';
import { CanonicalCollection } from './data-contracts';
import { MediaType } from './media-architecture';

// ============================================================================
// 1. UNIVERSAL RESPONSE & ERROR ENVELOPES (FC-003 CANONICAL CONTRACT)
// ============================================================================

export interface ResponsePaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponseMeta {
  requestId: string;
  timestamp: string;
  pagination?: ResponsePaginationMeta;
  executionDurationMs?: number;
  version?: number;
  [key: string]: unknown;
}

export type ApiSuccessMeta = ApiResponseMeta;

export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: Array<{ field: string; issue: string }> | Record<string, unknown> | null;
  timestamp?: string;
  requestId?: string;
}

export type ApiErrorDetails = ApiErrorPayload;

/**
 * Authoritative FC-003 Universal REST API Response Envelope
 */
export interface ApiResponseEnvelope<T = unknown> {
  success: boolean;
  data?: T;
  error?: ApiErrorPayload;
  meta?: ApiResponseMeta;
}

export interface ApiSuccessResponse<T> {
  readonly success: true;
  readonly data: T;
  readonly meta: ApiResponseMeta;
}

export interface ApiErrorResponse {
  readonly success: false;
  readonly error: ApiErrorPayload;
  readonly meta?: ApiResponseMeta;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export function createSuccessResponse<T>(
  data: T,
  requestId: string,
  extraMeta?: Partial<ApiResponseMeta>
): ApiSuccessResponse<T> {
  const timestamp = new Date().toISOString();
  return {
    success: true,
    data,
    meta: {
      timestamp,
      requestId,
      ...extraMeta,
    },
  };
}

export function createErrorResponse(
  code: ApiErrorCode | string,
  message: string,
  requestId: string,
  details?: Array<{ field: string; issue: string }> | Record<string, unknown> | null
): ApiErrorResponse {
  const timestamp = new Date().toISOString();
  return {
    success: false,
    error: {
      code,
      message,
      details: details ?? null,
      timestamp,
      requestId,
    },
    meta: {
      requestId,
      timestamp,
    },
  };
}

// ============================================================================
// 2. STANDARDIZED ERROR CODES & HTTP STATUS MAPPING
// ============================================================================

export enum ApiErrorCode {
  UNAUTHENTICATED = 'UNAUTHENTICATED',
  FORBIDDEN_LACKS_CAPABILITY = 'FORBIDDEN_LACKS_CAPABILITY',
  FORBIDDEN_BY_SEGREGATION_OF_DUTIES = 'FORBIDDEN_BY_SEGREGATION_OF_DUTIES',
  FORBIDDEN_BY_AI_GATING = 'FORBIDDEN_BY_AI_GATING',
  FORBIDDEN_BY_BUSINESS_RULE = 'FORBIDDEN_BY_BUSINESS_RULE',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  CONFLICT_OPTIMISTIC_LOCK = 'CONFLICT_OPTIMISTIC_LOCK',
  CONCURRENCY_CONFLICT = 'CONCURRENCY_CONFLICT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
}

export const API_ERROR_HTTP_STATUS: Record<ApiErrorCode, number> = {
  [ApiErrorCode.UNAUTHENTICATED]: 401,
  [ApiErrorCode.FORBIDDEN_LACKS_CAPABILITY]: 403,
  [ApiErrorCode.FORBIDDEN_BY_SEGREGATION_OF_DUTIES]: 403,
  [ApiErrorCode.FORBIDDEN_BY_AI_GATING]: 403,
  [ApiErrorCode.FORBIDDEN_BY_BUSINESS_RULE]: 400,
  [ApiErrorCode.VALIDATION_ERROR]: 400, // FC-003 standardizes Zod validation error to 400 BAD_REQUEST
  [ApiErrorCode.RESOURCE_NOT_FOUND]: 404,
  [ApiErrorCode.CONFLICT_OPTIMISTIC_LOCK]: 409,
  [ApiErrorCode.CONCURRENCY_CONFLICT]: 409,
  [ApiErrorCode.RATE_LIMIT_EXCEEDED]: 429,
  [ApiErrorCode.INTERNAL_SERVER_ERROR]: 500,
};

// ============================================================================
// 3. REQUEST CONTEXT & SECURITY HEADERS
// ============================================================================

export interface ApiRequestContext {
  readonly requestId: string;
  readonly clientTimestamp: string;
  readonly actorUserId: string;
  readonly actorRole: CanonicalRbacRole;
  readonly actorCapabilities: readonly CapabilityString[];
  readonly isAiAgent: boolean;
  readonly ipAddress: string;
  readonly userAgent: string;
}

export const RequestHeadersSchema = z.object({
  authorization: z.string().regex(/^Bearer\s+[\w-.]+$/, 'Must be a valid Bearer token'),
  'x-request-id': z.string().regex(/^REQ-[a-f0-9]{8,16}$/i, 'Must be a valid REQ- identifier').optional(),
  'x-client-timestamp': z.string().datetime().optional(),
});

// ============================================================================
// 4. CANONICAL 15-STEP WORKFLOW API SCHEMAS & CONTRACTS
// ============================================================================

// --- STEP 01: Question Generation / Drafting ---
export const Step01CreateQuestionRequestSchema = z.object({
  promptTelugu: z.string().min(5, 'Telugu prompt must be at least 5 characters').max(500),
  optionA: z.string().min(1).max(200),
  optionB: z.string().min(1).max(200),
  optionC: z.string().min(1).max(200),
  optionD: z.string().min(1).max(200),
  correctOptionIndex: z.number().int().min(0).max(3),
  subject: z.enum(['MATHEMATICS', 'PHYSICAL_SCIENCE', 'BIOLOGICAL_SCIENCE', 'SOCIAL_STUDIES']),
  classGrade: z.number().int().min(6).max(10),
  curriculumStandard: z.string().min(2).max(50),
  difficultyLevel: z.enum(['EASY', 'MEDIUM', 'HARD']),
  aiDrafted: z.boolean().default(false),
  aiPromptContext: z.string().nullable().optional(),
});
export type Step01CreateQuestionRequest = z.infer<typeof Step01CreateQuestionRequestSchema>;

// --- STEP 02: Question Verification / Pedagogical Review (Human-Gated, Anti-Self-Approval) ---
export const Step02QuestionReviewRequestSchema = z.object({
  expectedVersion: z.number().int().min(1),
  checklistAccuracy: z.boolean(),
  checklistTeluguGrammar: z.boolean(),
  checklistOptionDistractors: z.boolean(),
  checklistSingleCorrectAnswer: z.boolean(),
  checklistExplanationQuality: z.boolean(),
  checklistSyllabusAlignment: z.boolean(),
  checklistAgeAppropriate: z.boolean(),
  checklistMathematicalRigour: z.boolean(),
  checklistDiagramClarity: z.boolean(),
  checklistBiasFree: z.boolean(),
  verdict: z.enum(['APPROVED', 'REVISION_REQUIRED', 'REJECTED']),
  reviewNotes: z.string().min(5, 'Review notes must provide actionable feedback').max(1000),
});
export type Step02QuestionReviewRequest = z.infer<typeof Step02QuestionReviewRequestSchema>;

// --- STEP 03: Audience Script Creation & Versioning ---
export const Step03CreateScriptRequestSchema = z.object({
  contentId: z.string().regex(/^BP-CNT-[0-9]{6}$/),
  expectedVersion: z.number().int().min(1),
  hookCopyTelugu: z.string().min(5).max(300),
  bodyCopyTelugu: z.string().min(10).max(2000),
  callToActionTelugu: z.string().min(5).max(300),
  targetPacingWpm: z.number().int().min(80).max(180).default(120),
  estimatedDurationSeconds: z.number().int().min(20).max(75),
});
export type Step03CreateScriptRequest = z.infer<typeof Step03CreateScriptRequestSchema>;

// --- STEP 04: Teleprompter & Filming Session Setup ---
export const Step04CreateVideoSessionRequestSchema = z.object({
  contentId: z.string().regex(/^BP-CNT-[0-9]{6}$/),
  scriptId: z.string().regex(/^BP-S-[0-9]{6}$/),
  presenterUserId: z.string().regex(/^USR-[0-9]{6}$/),
  studioLocation: z.string().min(2).max(100),
  cameraSetupNotes: z.string().max(500).optional(),
});
export type Step04CreateVideoSessionRequest = z.infer<typeof Step04CreateVideoSessionRequestSchema>;

// --- STEP 05: Raw Video Camera Take Ingestion ---
export const Step05IngestVideoTakeRequestSchema = z.object({
  videoId: z.string().regex(/^BP-V-[0-9]{6}$/),
  takeNumber: z.number().int().min(1).max(50),
  durationSeconds: z.number().min(5).max(300),
  mediaAssetId: z.string().regex(/^MED-[0-9]{6}$/),
  driveFileId: z.string().min(5).max(100),
  cameraAngle: z.enum(['PRIMARY_FRONT', 'SECONDARY_CLOSEUP', 'OVERHEAD_DESK']),
  isPreferredTake: z.boolean().default(false),
  takeNotes: z.string().max(500).optional(),
});
export type Step05IngestVideoTakeRequest = z.infer<typeof Step05IngestVideoTakeRequestSchema>;

// --- STEP 06: Editing Bay Cut / Master MP4 Submission ---
export const Step06SubmitVideoEditRequestSchema = z.object({
  videoId: z.string().regex(/^BP-V-[0-9]{6}$/),
  cutNumber: z.number().int().min(1).max(20),
  mediaAssetId: z.string().regex(/^MED-[0-9]{6}$/),
  driveFileId: z.string().min(5).max(100),
  resolutionWidth: z.literal(1080),
  resolutionHeight: z.literal(1920),
  durationSeconds: z.number().min(15).max(70),
  hasBurraParikshaWatermark: z.boolean(),
  hasTeluguSubtitlesBurned: z.boolean(),
  hasAudioNormalisation: z.boolean(),
  editNotes: z.string().max(1000).optional(),
});
export type Step06SubmitVideoEditRequest = z.infer<typeof Step06SubmitVideoEditRequestSchema>;

// --- STEP 07: Final Video QC Audit Sign-off (Human-Gated, Anti-Self-Approval) ---
export const Step07VideoQcRequestSchema = z.object({
  videoEditId: z.string().regex(/^BP-VE-[0-9]{6}-C[0-9]{2}$/),
  expectedVersion: z.number().int().min(1),
  audioLoudnessCompliant: z.boolean(),
  audioClippingAbsent: z.boolean(),
  syncTimingAccurate: z.boolean(),
  visualArtifactsAbsent: z.boolean(),
  subtitleTimingAligned: z.boolean(),
  brandingOverlayCompliant: z.boolean(),
  verdict: z.enum(['APPROVED', 'REVISION_REQUIRED']),
  rejectionReason: z.string().max(1000).optional(),
});
export type Step07VideoQcRequest = z.infer<typeof Step07VideoQcRequestSchema>;

// --- STEP 08: Thumbnail Artwork Variant Registration ---
export const Step08CreateThumbnailRequestSchema = z.object({
  contentId: z.string().regex(/^BP-CNT-[0-9]{6}$/),
  variant: z.enum(['A', 'B']),
  mediaAssetId: z.string().regex(/^MED-[0-9]{6}$/),
  driveFileId: z.string().min(5).max(100),
  width: z.literal(1080),
  height: z.literal(1920),
  teluguHeadline: z.string().min(2).max(100),
  designerUserId: z.string().regex(/^USR-[0-9]{6}$/),
});
export type Step08CreateThumbnailRequest = z.infer<typeof Step08CreateThumbnailRequestSchema>;

// --- STEP 09: Social Review & 9:16 Mobile Framing Simulator Sign-off (Human-Gated) ---
export const Step09SocialReviewRequestSchema = z.object({
  contentId: z.string().regex(/^BP-CNT-[0-9]{6}$/),
  expectedVersion: z.number().int().min(1),
  youtubeShortsUiSafeZonePassed: z.boolean(),
  instagramReelsUiSafeZonePassed: z.boolean(),
  facebookReelsUiSafeZonePassed: z.boolean(),
  teluguTextLegibilityScore: z.number().int().min(1).max(5),
  hookVisibilityUnderHeaderPassed: z.boolean(),
  verdict: z.enum(['APPROVED', 'REVISION_REQUIRED']),
  reviewNotes: z.string().min(5).max(500),
});
export type Step09SocialReviewRequest = z.infer<typeof Step09SocialReviewRequestSchema>;

// --- STEP 10: Publishing Package Staging & Release Assembly (Human-Gated) ---
export const Step10CreatePublishingPackageRequestSchema = z.object({
  contentId: z.string().regex(/^BP-CNT-[0-9]{6}$/),
  selectedVideoEditId: z.string().regex(/^BP-VE-[0-9]{6}-C[0-9]{2}$/),
  selectedThumbnailId: z.string().regex(/^BP-TH-[0-9]{6}$/),
  platforms: z.array(z.enum(['YOUTUBE_SHORTS', 'INSTAGRAM_REELS', 'FACEBOOK_REELS'])).min(1),
  scheduledPublishTime: z.string().datetime(),
  titleTelugu: z.string().min(5).max(100),
  descriptionTelugu: z.string().min(10).max(2000),
  tags: z.array(z.string().min(2).max(40)).min(3).max(25),
});
export type Step10CreatePublishingPackageRequest = z.infer<typeof Step10CreatePublishingPackageRequestSchema>;

// --- STEP 11: Release / Distribution Dispatch ---
export const Step11DispatchPublishRequestSchema = z.object({
  publishingPackageId: z.string().regex(/^PKG-[0-9]{6}$/),
  expectedVersion: z.number().int().min(1),
  publishImmediately: z.boolean().default(false),
  confirmationToken: z.string().min(10),
});
export type Step11DispatchPublishRequest = z.infer<typeof Step11DispatchPublishRequestSchema>;

// --- STEP 12: Platform Sync & Publication Verification ---
export const Step12SyncPublicationRequestSchema = z.object({
  publicationId: z.string().regex(/^PUB-[0-9]{6}$/),
  platformPostId: z.string().min(3).max(100),
  platformUrl: z.string().url(),
  syncStatus: z.enum(['LIVE', 'PROCESSING', 'FAILED']),
  failureReason: z.string().max(500).optional(),
});
export type Step12SyncPublicationRequest = z.infer<typeof Step12SyncPublicationRequestSchema>;

// --- STEP 13: Analytics Snapshot Ingestion ---
export const Step13IngestAnalyticsRequestSchema = z.object({
  publicationId: z.string().regex(/^PUB-[0-9]{6}$/),
  viewsCount: z.number().int().min(0),
  watchTimeSeconds: z.number().min(0),
  averageViewDurationSeconds: z.number().min(0),
  retentionAt3sPercent: z.number().min(0).max(100),
  completionRatePercent: z.number().min(0).max(100),
  likesCount: z.number().int().min(0),
  sharesCount: z.number().int().min(0),
  commentsCount: z.number().int().min(0),
  retentionCurvePoints: z.array(z.number().min(0).max(100)).min(10).max(100),
  snapshotTime: z.string().datetime(),
});
export type Step13IngestAnalyticsRequest = z.infer<typeof Step13IngestAnalyticsRequestSchema>;

// --- STEP 14: Content Performance Scorecard Audit Sign-off (Human-Gated) ---
export const Step14PerformanceReviewRequestSchema = z.object({
  contentId: z.string().regex(/^BP-CNT-[0-9]{6}$/),
  expectedVersion: z.number().int().min(1),
  pedagogicalResonanceScore: z.number().int().min(1).max(100),
  studentEngagementScore: z.number().int().min(1).max(100),
  conceptMasteryConfirmed: z.boolean(),
  verdict: z.enum(['PROVEN_PEDAGOGY', 'RETRY_TOPIC', 'INCONCLUSIVE']),
  evaluatorNotes: z.string().min(5).max(1000),
});
export type Step14PerformanceReviewRequest = z.infer<typeof Step14PerformanceReviewRequestSchema>;

// --- STEP 15: AI Intelligence Loop Insights & Curriculum Recommendations (Human-Gated) ---
export const Step15IntelligenceInsightRequestSchema = z.object({
  contentId: z.string().regex(/^BP-CNT-[0-9]{6}$/),
  curriculumTopic: z.string().min(3).max(100),
  identifiedLearningFrictionPoint: z.string().min(5).max(500),
  recommendedFollowupQuestionType: z.string().min(5).max(300),
  recommendedDifficultyAdjustment: z.enum(['DECREASE_DIFFICULTY', 'MAINTAIN_DIFFICULTY', 'INCREASE_DIFFICULTY']),
  approvedForNextCycle: z.boolean(),
  approvedByUserId: z.string().regex(/^USR-[0-9]{6}$/),
});
export type Step15IntelligenceInsightRequest = z.infer<typeof Step15IntelligenceInsightRequestSchema>;

// ============================================================================
// 5. SUPPORTING DOMAIN API SCHEMAS (Workflow Transitions, Media Hashing, RBAC, Audit)
// ============================================================================

// Workflow Instance State Transition
export const WorkflowTransitionRequestSchema = z.object({
  workflowInstanceId: z.string().regex(/^WF-[0-9]{6}$/),
  expectedCurrentStep: z.number().int().min(1).max(15),
  targetStep: z.number().int().min(1).max(15),
  reason: z.string().min(3).max(500),
  isReworkTransition: z.boolean().default(false),
  transitionMetadata: z.record(z.string(), z.unknown()).optional(),
});
export type WorkflowTransitionRequest = z.infer<typeof WorkflowTransitionRequestSchema>;

// Media Asset Ingestion & Tamper Verification
export const RegisterMediaAssetRequestSchema = z.object({
  name: z.string().min(1).max(255),
  mediaType: z.nativeEnum(MediaType),
  mimeType: z.string().regex(/^[a-z]+\/[a-z0-9.+-]+$/i),
  sizeBytes: z.number().int().positive(),
  sha256Hash: z.string().regex(/^[a-f0-9]{64}$/i, 'Must be valid 64-character lowercase SHA-256 hash'),
  driveFileId: z.string().min(5).max(100),
  driveFolderId: z.string().min(5).max(100),
  folderHierarchyPath: z.string().startsWith('/BP-Production/'),
  webViewLink: z.string().url(),
  webContentLink: z.string().url(),
});
export type RegisterMediaAssetRequest = z.infer<typeof RegisterMediaAssetRequestSchema>;

export const VerifyMediaHashRequestSchema = z.object({
  mediaAssetId: z.string().regex(/^MED-[0-9]{6}$/),
  currentSha256Hash: z.string().regex(/^[a-f0-9]{64}$/i),
});
export type VerifyMediaHashRequest = z.infer<typeof VerifyMediaHashRequestSchema>;

export const ArchiveMediaAssetRequestSchema = z.object({
  mediaAssetId: z.string().regex(/^MED-[0-9]{6}$/),
  archiveProvider: z.enum(['GCS_COLDLINE', 'EXTERNAL_ARCHIVE']),
  bucketName: z.string().min(3).max(63),
  objectPath: z.string().min(5).max(500),
  manifestId: z.string().regex(/^MAN-[0-9]{6}$/),
});
export type ArchiveMediaAssetRequest = z.infer<typeof ArchiveMediaAssetRequestSchema>;

// ============================================================================
// 6. CANONICAL API ENDPOINT SPECIFICATION REGISTRY
// ============================================================================

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface ApiEndpointContract {
  readonly endpointId: string;
  readonly path: string;
  readonly method: HttpMethod;
  readonly canonicalStepNumber?: BusinessWorkflowStepNumber;
  readonly requiredCapability: CapabilityString;
  readonly isHumanGated: boolean;
  readonly enforcesSegregationOfDuties: boolean;
  readonly requestSchema?: z.ZodType<unknown>;
  readonly primaryCollection: CanonicalCollection;
  readonly auditEventType: string;
  readonly description: string;
}

export const CANONICAL_API_REGISTRY: readonly ApiEndpointContract[] = [
  // --- 15 CANONICAL WORKFLOW STEP CONTRACTS ---
  {
    endpointId: 'API-STEP-01-CREATE-QUESTION',
    path: '/api/v1/questions',
    method: 'POST',
    canonicalStepNumber: 1,
    requiredCapability: 'QUESTION:CREATE',
    isHumanGated: false,
    enforcesSegregationOfDuties: false,
    requestSchema: Step01CreateQuestionRequestSchema,
    primaryCollection: CanonicalCollection.QUESTIONS,
    auditEventType: 'QUESTION_CREATED',
    description: 'Generates or drafts a new curriculum question in Telugu',
  },
  {
    endpointId: 'API-STEP-02-VERIFY-QUESTION',
    path: '/api/v1/questions/:id/reviews',
    method: 'POST',
    canonicalStepNumber: 2,
    requiredCapability: 'QUESTION_REVIEW:VERIFY',
    isHumanGated: true,
    enforcesSegregationOfDuties: true,
    requestSchema: Step02QuestionReviewRequestSchema,
    primaryCollection: CanonicalCollection.QUESTION_REVIEWS,
    auditEventType: 'QUESTION_VERIFIED',
    description: 'Human-gated 10-point pedagogical audit of question (anti-self-approval enforced)',
  },
  {
    endpointId: 'API-STEP-03-CREATE-SCRIPT',
    path: '/api/v1/contents/:id/scripts',
    method: 'POST',
    canonicalStepNumber: 3,
    requiredCapability: 'SCRIPT:CREATE',
    isHumanGated: false,
    enforcesSegregationOfDuties: false,
    requestSchema: Step03CreateScriptRequestSchema,
    primaryCollection: CanonicalCollection.SCRIPTS,
    auditEventType: 'SCRIPT_CREATED',
    description: 'Drafts or revisions teleprompter script hook and body in Telugu',
  },
  {
    endpointId: 'API-STEP-04-SETUP-VIDEO-SESSION',
    path: '/api/v1/videos',
    method: 'POST',
    canonicalStepNumber: 4,
    requiredCapability: 'VIDEO:CREATE',
    isHumanGated: false,
    enforcesSegregationOfDuties: false,
    requestSchema: Step04CreateVideoSessionRequestSchema,
    primaryCollection: CanonicalCollection.VIDEOS,
    auditEventType: 'VIDEO_SESSION_SCHEDULED',
    description: 'Sets up studio teleprompter and filming session configuration',
  },
  {
    endpointId: 'API-STEP-05-INGEST-VIDEO-TAKE',
    path: '/api/v1/videos/:id/takes',
    method: 'POST',
    canonicalStepNumber: 5,
    requiredCapability: 'VIDEO_TAKE:UPLOAD',
    isHumanGated: false,
    enforcesSegregationOfDuties: false,
    requestSchema: Step05IngestVideoTakeRequestSchema,
    primaryCollection: CanonicalCollection.VIDEO_TAKES,
    auditEventType: 'VIDEO_TAKE_INGESTED',
    description: 'Ingests camera raw take reference and links to Drive',
  },
  {
    endpointId: 'API-STEP-06-SUBMIT-VIDEO-EDIT',
    path: '/api/v1/videos/:id/edits',
    method: 'POST',
    canonicalStepNumber: 6,
    requiredCapability: 'VIDEO_EDIT:CREATE',
    isHumanGated: false,
    enforcesSegregationOfDuties: false,
    requestSchema: Step06SubmitVideoEditRequestSchema,
    primaryCollection: CanonicalCollection.VIDEO_EDITS,
    auditEventType: 'VIDEO_EDIT_SUBMITTED',
    description: 'Submits rendered 1080x1920 master cut for QC review',
  },
  {
    endpointId: 'API-STEP-07-QC-VIDEO-EDIT',
    path: '/api/v1/video-edits/:id/qc',
    method: 'POST',
    canonicalStepNumber: 7,
    requiredCapability: 'VIDEO_EDIT:APPROVE',
    isHumanGated: true,
    enforcesSegregationOfDuties: true,
    requestSchema: Step07VideoQcRequestSchema,
    primaryCollection: CanonicalCollection.VIDEO_EDITS,
    auditEventType: 'VIDEO_QC_DECIDED',
    description: 'Final video post-production QC audit sign-off (anti-self-approval enforced)',
  },
  {
    endpointId: 'API-STEP-08-REGISTER-THUMBNAIL',
    path: '/api/v1/contents/:id/thumbnails',
    method: 'POST',
    canonicalStepNumber: 8,
    requiredCapability: 'THUMBNAIL:CREATE',
    isHumanGated: false,
    enforcesSegregationOfDuties: false,
    requestSchema: Step08CreateThumbnailRequestSchema,
    primaryCollection: CanonicalCollection.THUMBNAILS,
    auditEventType: 'THUMBNAIL_REGISTERED',
    description: 'Registers 9:16 vertical thumbnail artwork variant',
  },
  {
    endpointId: 'API-STEP-09-AUDIT-SOCIAL-REVIEW',
    path: '/api/v1/contents/:id/social-reviews',
    method: 'POST',
    canonicalStepNumber: 9,
    requiredCapability: 'SOCIAL_REVIEW:APPROVE',
    isHumanGated: true,
    enforcesSegregationOfDuties: false,
    requestSchema: Step09SocialReviewRequestSchema,
    primaryCollection: CanonicalCollection.SOCIAL_REVIEWS,
    auditEventType: 'SOCIAL_REVIEW_DECIDED',
    description: 'Audits video & thumbnail safe zones across YouTube, Instagram, and Facebook',
  },
  {
    endpointId: 'API-STEP-10-STAGE-PUBLISHING-PACKAGE',
    path: '/api/v1/publishing-packages',
    method: 'POST',
    canonicalStepNumber: 10,
    requiredCapability: 'PUBLISHING_PACKAGE:CREATE',
    isHumanGated: true,
    enforcesSegregationOfDuties: false,
    requestSchema: Step10CreatePublishingPackageRequestSchema,
    primaryCollection: CanonicalCollection.PUBLISHING_PACKAGES,
    auditEventType: 'PUBLISHING_PACKAGE_STAGED',
    description: 'Assembles multi-platform distribution package with metadata and scheduled release',
  },
  {
    endpointId: 'API-STEP-11-DISPATCH-PUBLISH',
    path: '/api/v1/publishing-packages/:id/publish',
    method: 'POST',
    canonicalStepNumber: 11,
    requiredCapability: 'PUBLICATION:PUBLISH',
    isHumanGated: false,
    enforcesSegregationOfDuties: false,
    requestSchema: Step11DispatchPublishRequestSchema,
    primaryCollection: CanonicalCollection.PUBLICATIONS,
    auditEventType: 'PUBLICATION_DISPATCHED',
    description: 'Dispatches staged package to target social platform distribution queues',
  },
  {
    endpointId: 'API-STEP-12-SYNC-PUBLICATION',
    path: '/api/v1/publications/:id/sync',
    method: 'POST',
    canonicalStepNumber: 12,
    requiredCapability: 'PUBLICATION:SYNC',
    isHumanGated: false,
    enforcesSegregationOfDuties: false,
    requestSchema: Step12SyncPublicationRequestSchema,
    primaryCollection: CanonicalCollection.PUBLICATIONS,
    auditEventType: 'PUBLICATION_SYNCED',
    description: 'Syncs live external platform post ID, permalink URL, and distribution status',
  },
  {
    endpointId: 'API-STEP-13-INGEST-ANALYTICS',
    path: '/api/v1/publications/:id/analytics-snapshots',
    method: 'POST',
    canonicalStepNumber: 13,
    requiredCapability: 'ANALYTICS_SNAPSHOT:CREATE',
    isHumanGated: false,
    enforcesSegregationOfDuties: false,
    requestSchema: Step13IngestAnalyticsRequestSchema,
    primaryCollection: CanonicalCollection.ANALYTICS_SNAPSHOTS,
    auditEventType: 'ANALYTICS_INGESTED',
    description: 'Ingests retention curve and viewer engagement performance metrics',
  },
  {
    endpointId: 'API-STEP-14-AUDIT-PERFORMANCE-REVIEW',
    path: '/api/v1/contents/:id/performance-reviews',
    method: 'POST',
    canonicalStepNumber: 14,
    requiredCapability: 'PERFORMANCE_RECORD:REVIEW',
    isHumanGated: true,
    enforcesSegregationOfDuties: false,
    requestSchema: Step14PerformanceReviewRequestSchema,
    primaryCollection: CanonicalCollection.PERFORMANCE_RECORDS,
    auditEventType: 'PERFORMANCE_REVIEWED',
    description: 'Evaluates pedagogical resonance and educational concept comprehension',
  },
  {
    endpointId: 'API-STEP-15-INTELLIGENCE-INSIGHTS',
    path: '/api/v1/contents/:id/intelligence-insights',
    method: 'POST',
    canonicalStepNumber: 15,
    requiredCapability: 'INTELLIGENCE_INSIGHT:APPROVE',
    isHumanGated: true,
    enforcesSegregationOfDuties: false,
    requestSchema: Step15IntelligenceInsightRequestSchema,
    primaryCollection: CanonicalCollection.INTELLIGENCE_INSIGHTS,
    auditEventType: 'INTELLIGENCE_LOOP_CLOSED',
    description: 'Closes intelligence loop by feeding student friction points back to curriculum creation',
  },

  // --- SUPPORTING DOMAIN ENDPOINTS ---
  {
    endpointId: 'API-DOMAIN-WORKFLOW-TRANSITION',
    path: '/api/v1/workflow-instances/:id/transitions',
    method: 'POST',
    requiredCapability: 'WORKFLOW_TRANSITION:TRANSITION',
    isHumanGated: false,
    enforcesSegregationOfDuties: false,
    requestSchema: WorkflowTransitionRequestSchema,
    primaryCollection: CanonicalCollection.WORKFLOW_TRANSITIONS,
    auditEventType: 'WORKFLOW_STATE_TRANSITIONED',
    description: 'Executes atomic ACID transition between workflow steps with OCC check',
  },
  {
    endpointId: 'API-DOMAIN-REGISTER-MEDIA-ASSET',
    path: '/api/v1/media-assets',
    method: 'POST',
    requiredCapability: 'MEDIA_ASSET:CREATE',
    isHumanGated: false,
    enforcesSegregationOfDuties: false,
    requestSchema: RegisterMediaAssetRequestSchema,
    primaryCollection: CanonicalCollection.MEDIA_ASSETS,
    auditEventType: 'MEDIA_ASSET_REGISTERED',
    description: 'Registers media asset metadata and SHA-256 checksum in Firestore',
  },
  {
    endpointId: 'API-DOMAIN-VERIFY-MEDIA-HASH',
    path: '/api/v1/media-assets/:id/verify-hash',
    method: 'POST',
    requiredCapability: 'MEDIA_ASSET:VERIFY',
    isHumanGated: false,
    enforcesSegregationOfDuties: false,
    requestSchema: VerifyMediaHashRequestSchema,
    primaryCollection: CanonicalCollection.MEDIA_ASSETS,
    auditEventType: 'MEDIA_HASH_VERIFIED',
    description: 'Verifies tamper-evidence checksum against registered SHA-256 hash',
  },
  {
    endpointId: 'API-DOMAIN-ARCHIVE-MEDIA-ASSET',
    path: '/api/v1/media-assets/:id/archive',
    method: 'POST',
    requiredCapability: 'MEDIA_ASSET:ARCHIVE',
    isHumanGated: false,
    enforcesSegregationOfDuties: false,
    requestSchema: ArchiveMediaAssetRequestSchema,
    primaryCollection: CanonicalCollection.ARCHIVE_REFERENCES,
    auditEventType: 'MEDIA_ASSET_ARCHIVED',
    description: 'Executes pre-retirement cold storage transition to deep preservation archive',
  },
  {
    endpointId: 'API-DOMAIN-GET-SESSION',
    path: '/api/v1/auth/session',
    method: 'GET',
    requiredCapability: 'USER:VIEW',
    isHumanGated: false,
    enforcesSegregationOfDuties: false,
    primaryCollection: CanonicalCollection.USERS,
    auditEventType: 'SESSION_VERIFIED',
    description: 'Retrieves authenticated user session, role, and authorized capabilities',
  },
  {
    endpointId: 'API-DOMAIN-LIST-AUDIT-EVENTS',
    path: '/api/v1/audit-events',
    method: 'GET',
    requiredCapability: 'AUDIT_EVENT:VIEW',
    isHumanGated: false,
    enforcesSegregationOfDuties: false,
    primaryCollection: CanonicalCollection.AUDIT_EVENTS,
    auditEventType: 'AUDIT_LEDGER_ACCESSED',
    description: 'Queries immutable append-only audit event ledger',
  },
];

// ============================================================================
// 7. GOVERNANCE & BUSINESS RULE VALIDATION HELPERS
// ============================================================================

/**
 * Segregation of Duties (GAR-02 Anti-Self-Approval)
 * Creators / authors are strictly forbidden from approving or verifying their own assets.
 */
export function validateSegregationOfDuties(
  actorUserId: string,
  authorUserId: string,
  actionDescription = 'audit verification'
): { isValid: boolean; errorResponse?: ApiErrorResponse } {
  if (actorUserId === authorUserId) {
    return {
      isValid: false,
      errorResponse: createErrorResponse(
        ApiErrorCode.FORBIDDEN_BY_SEGREGATION_OF_DUTIES,
        `Self-approval prohibited: Creator (${authorUserId}) cannot perform ${actionDescription} on their own asset (GAR-02).`,
        `REQ-ERR-SOD-${Date.now().toString(36)}`,
        { authorUserId, actorUserId }
      ),
    };
  }
  return { isValid: true };
}

/**
 * AI-Gating Boundary Rule (AP-009)
 * Steps 02, 07, 09, 10, 14, 15 are human-gated checkpoints.
 * AI agents are strictly prohibited from approving or executing human-gated steps.
 */
export function validateAiGatingBoundary(
  stageNumber: BusinessWorkflowStepNumber,
  isAiAgent: boolean
): { isValid: boolean; errorResponse?: ApiErrorResponse } {
  const isHumanGated = HUMAN_GATED_STAGES.includes(stageNumber as any);
  if (isHumanGated && isAiAgent) {
    return {
      isValid: false,
      errorResponse: createErrorResponse(
        ApiErrorCode.FORBIDDEN_BY_AI_GATING,
        `AI-Gating Boundary Violation: Stage ${stageNumber} is strictly human-gated (AP-009). AI agents are prohibited from executing approval decisions.`,
        `REQ-ERR-AIGATE-${Date.now().toString(36)}`,
        { stageNumber, isAiAgent }
      ),
    };
  }
  return { isValid: true };
}

/**
 * Optimistic Concurrency Control (OCC AP-005)
 * Compares current document version with expected version.
 */
export function validateOptimisticLock(
  expectedVersion: number,
  currentVersion: number
): { isValid: boolean; errorResponse?: ApiErrorResponse } {
  if (expectedVersion !== currentVersion) {
    return {
      isValid: false,
      errorResponse: createErrorResponse(
        ApiErrorCode.CONFLICT_OPTIMISTIC_LOCK,
        `Optimistic concurrency violation: Document version changed from expected ${expectedVersion} to current ${currentVersion}. Refresh and retry.`,
        `REQ-ERR-OCC-${Date.now().toString(36)}`,
        { expectedVersion, currentVersion }
      ),
    };
  }
  return { isValid: true };
}

/**
 * Capability-Based Access Control Verification (AP-004)
 * Verifies that the actor holds the required capability string.
 */
export function validateCapability(
  actorCapabilities: readonly CapabilityString[],
  requiredCapability: CapabilityString
): { isValid: boolean; errorResponse?: ApiErrorResponse } {
  if (!actorCapabilities.includes(requiredCapability)) {
    return {
      isValid: false,
      errorResponse: createErrorResponse(
        ApiErrorCode.FORBIDDEN_LACKS_CAPABILITY,
        `Access forbidden: Actor lacks required capability '${requiredCapability}'.`,
        `REQ-ERR-CAP-${Date.now().toString(36)}`,
        { requiredCapability, actorCapabilitiesCount: actorCapabilities.length }
      ),
    };
  }
  return { isValid: true };
}
