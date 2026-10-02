/**
 * BURRA PARIKSHA CMS — Canonical Domain Models (Stage 06)
 *
 * Defines the 27 authoritative business domain entities, relationships,
 * lifecycles, and immutable fields across the 15-step production pipeline.
 *
 * NOTE: These are business domain models, completely decoupled from physical
 * database schemas, Google Sheets rows, or API transport DTOs.
 */

// ============================================================================
// DOMAIN IDENTIFIERS & ENUMS
// ============================================================================

export type DomainName =
  | 'Identity'
  | 'Roles'
  | 'Capabilities'
  | 'Questions'
  | 'Content'
  | 'Scripts'
  | 'Production'
  | 'Media'
  | 'Creative'
  | 'Reviews'
  | 'Publishing'
  | 'Analytics'
  | 'Intelligence'
  | 'Workflow'
  | 'Operations'
  | 'Audit';

// ============================================================================
// 1. IDENTITY & ACCESS ENTITIES
// ============================================================================

export type UserStatus = 'PROVISIONED' | 'ACTIVE' | 'SUSPENDED' | 'DEACTIVATED';

export interface UserEntity {
  readonly businessId: string; // USR-xxxxxx (Immutable)
  readonly domainOwner: 'Identity';
  readonly createdAt: string; // ISO 8601 (Immutable)
  email: string;
  displayName: string;
  status: UserStatus;
  phone?: string;
  avatarUrl?: string;
  assignedSubjectSpecialties?: string[];
  roleCodes: string[]; // References RoleEntity
  googleSubId?: string; // External Reference
}

export interface RoleEntity {
  readonly roleCode: string; // ROLE_xxxx (Immutable)
  readonly domainOwner: 'Roles';
  readonly isSystemRole: boolean; // Immutable
  roleName: string;
  description: string;
  capabilityCodes: string[]; // References CapabilityEntity
  workflowStageAuthorizations?: number[];
}

export interface CapabilityEntity {
  readonly capabilityCode: string; // RESOURCE:ACTION (Immutable)
  readonly domainOwner: 'Capabilities';
  readonly resource: string;
  readonly action: string;
  description: string;
}

// ============================================================================
// 2. QUESTION DOMAIN ENTITIES
// ============================================================================

export type QuestionLifecycle = 'DRAFT' | 'PENDING_VERIFICATION' | 'APPROVED' | 'REVISIONS_REQUESTED' | 'REJECTED';

export interface QuestionEntity {
  readonly businessId: string; // BP-Q-xxxxxx (Immutable)
  readonly domainOwner: 'Questions';
  readonly createdAt: string; // Immutable
  readonly authorUserId: string; // Immutable reference to User
  questionTextTelugu: string;
  questionTextEnglish?: string;
  options: [string, string, string, string]; // 4 required options
  correctOptionIndex: 0 | 1 | 2 | 3;
  solutionExplanationTelugu: string;
  solutionExplanationEnglish?: string;
  syllabusClass: string; // e.g. "Class 10"
  subject: string; // e.g. "Mathematics"
  topic: string;
  subtopic?: string;
  difficultyLevel: 'EASY' | 'MEDIUM' | 'HARD';
  lifecycle: QuestionLifecycle;
  currentVersionNumber: number;
}

export interface QuestionVersionEntity {
  readonly versionId: string; // BP-QV-xxxxxx-Vxx (Immutable)
  readonly questionBusinessId: string; // Immutable reference to Question
  readonly versionNumber: number; // Immutable
  readonly createdAt: string; // Immutable
  readonly createdByUserId: string; // Immutable
  snapshotQuestionTextTelugu: string;
  snapshotOptions: [string, string, string, string];
  snapshotCorrectOptionIndex: 0 | 1 | 2 | 3;
  snapshotExplanation: string;
  changeLogReason: string;
}

export interface QuestionReviewEntity {
  readonly reviewId: string; // QRV-xxxxxx (Immutable)
  readonly questionBusinessId: string; // Immutable
  readonly reviewerUserId: string; // Immutable (AP-009 human reviewer)
  readonly createdAt: string; // Immutable
  verdict: 'APPROVED' | 'REVISIONS_REQUESTED' | 'REJECTED';
  rubricScore: number; // 1-10
  feedbackRemarks: string;
  factualAccuracyConfirmed: boolean;
  pedagogicalClarityConfirmed: boolean;
  teluguNuanceConfirmed: boolean;
}

// ============================================================================
// 3. CONTENT & PRODUCTION ENTITIES
// ============================================================================

export interface ContentEntity {
  readonly businessId: string; // BP-C-xxxxxx (Immutable master project)
  readonly domainOwner: 'Content';
  readonly createdAt: string; // Immutable
  title: string;
  canonicalWorkflowStage: number; // 1..15 (AP-001)
  questionBusinessId: string; // 1:1 Link to Question
  scriptBusinessId?: string; // 1:1 Link to Script
  videoBusinessId?: string; // 1:1 Link to Video
  thumbnailBusinessId?: string; // 1:1 Link to Thumbnail
  publishingPackageId?: string; // 1:1 Link to PublishingPackage
}

export type ScriptLifecycle = 'DRAFT' | 'READY_FOR_TELEPROMPTER' | 'LOCKED_FOR_RECORDING' | 'ARCHIVED';

export interface ScriptEntity {
  readonly businessId: string; // BP-SCR-xxxxxx (Immutable)
  readonly contentMasterId: string; // Immutable link to Content
  readonly domainOwner: 'Scripts';
  readonly createdAt: string; // Immutable
  threeSecondHookTelugu: string;
  teleprompterBodyTelugu: string;
  callToActionTelugu: string;
  targetDurationSeconds: number; // 30-60s
  lifecycle: ScriptLifecycle;
  currentVersionNumber: number;
  speedTrickCallout?: string;
}

export interface ScriptVersionEntity {
  readonly versionId: string; // BP-SCRV-xxxxxx-Vxx (Immutable)
  readonly scriptBusinessId: string; // Immutable
  readonly versionNumber: number; // Immutable
  readonly createdAt: string; // Immutable
  snapshotBodyText: string;
  changeSummary: string;
}

export type VideoLifecycle = 'QUEUED' | 'RECORDING' | 'RECORDED' | 'EDITING' | 'EDITED' | 'QC_PASSED' | 'READY_TO_UPLOAD' | 'UPLOADED';

export interface VideoEntity {
  readonly businessId: string; // BP-V-xxxxxx (Immutable)
  readonly contentMasterId: string; // Immutable link to Content
  readonly domainOwner: 'Production';
  readonly createdAt: string; // Immutable
  aspectRatio: '9:16'; // Vertical Short
  lifecycle: VideoLifecycle;
  assignedHostUserId?: string;
  assignedEditorUserId?: string;
  rawFootageMediaAssetId?: string; // Reference to MediaAsset
  masterCutMediaAssetId?: string; // Reference to MediaAsset
}

export interface VideoTakeEntity {
  readonly takeId: string; // VTK-xxxxxx (Immutable)
  readonly videoBusinessId: string; // Immutable
  readonly takeNumber: number; // Immutable
  readonly recordedAt: string; // Immutable
  hostUserId: string;
  durationSeconds: number;
  isAcceptedTake: boolean;
  notes?: string;
  rawMediaAssetId: string; // Reference to MediaAsset
}

export interface VideoEditEntity {
  readonly editId: string; // VED-xxxxxx (Immutable)
  readonly videoBusinessId: string; // Immutable
  readonly editorUserId: string; // Immutable
  readonly createdAt: string; // Immutable
  masterCutMediaAssetId: string; // Reference to MediaAsset
  editVersionNumber: number;
  subtitlesSynced: boolean;
  audioLufsTargetMet: boolean; // -14 LUFS
  colorGradingApplied: boolean;
}

// ============================================================================
// 4. MEDIA ENTITIES (AP-007, AP-008)
// ============================================================================

export interface MediaAssetEntity {
  readonly businessId: string; // MED-xxxxxx (Immutable)
  readonly domainOwner: 'Media';
  readonly createdAt: string; // Immutable
  readonly entityType: 'QUESTION' | 'SCRIPT' | 'VIDEO' | 'THUMBNAIL';
  readonly entityId: string; // Associated business ID
  fileName: string;
  mimeType: string;
  byteSize: number;
  sha256: string;
  storageProvider: 'GOOGLE_DRIVE' | 'CLOUD_STORAGE';
  externalStorageId: string; // driveFileId (AP-008 reference)
  externalUrl: string; // webViewLink
  // NOTE: AP-007 strictly forbids rawBinaryData or base64 streams here
}

export interface MediaReferenceEntity {
  readonly referenceId: string; // MREF-xxxxxx (Immutable)
  readonly mediaAssetId: string; // Immutable
  readonly consumerEntityId: string; // Immutable
  relationshipType: 'RAW_FOOTAGE' | 'MASTER_CUT' | 'THUMBNAIL_VARIANT' | 'AUDIO_STEM';
}

export interface ArchiveReferenceEntity {
  readonly archiveId: string; // ARC-xxxxxx (Immutable)
  readonly mediaAssetId: string; // Immutable
  vaultProvider: 'COLD_STORAGE_VAULT' | 'DRIVE_ARCHIVE';
  vaultIdentifier: string;
  archivedAt: string;
  checksumVerified: boolean;
}

// ============================================================================
// 5. REVIEW & CREATIVE ASSETS
// ============================================================================

export interface ThumbnailEntity {
  readonly businessId: string; // THM-xxxxxx (Immutable)
  readonly contentMasterId: string; // Immutable
  readonly domainOwner: 'Creative';
  readonly createdAt: string; // Immutable
  variantCode: 'VARIANT_A' | 'VARIANT_B' | 'VARIANT_C';
  headlineHookTelugu: string;
  mediaAssetId: string; // Reference to MediaAsset
  isPrimaryVariant: boolean;
}

export interface SocialReviewEntity {
  readonly reviewId: string; // SRV-xxxxxx (Immutable)
  readonly contentMasterId: string; // Immutable
  readonly reviewerUserId: string; // Immutable (AP-009 human reviewer)
  readonly reviewedAt: string; // Immutable
  aspectRatio9x16Approved: boolean;
  mobileSafeZoneChecked: boolean;
  hookThreeSecondPunchRating: number; // 1-5
  verdict: 'APPROVED' | 'REVISIONS_REQUESTED';
  reviewerNotes?: string;
}

// ============================================================================
// 6. PUBLISHING & DISTRIBUTION ENTITIES
// ============================================================================

export type PublishingLifecycle = 'DRAFT' | 'SCHEDULED' | 'DISPATCHED' | 'PUBLISHED' | 'FAILED_RETRYABLE';

export interface PublishingPackageEntity {
  readonly businessId: string; // PUB-xxxxxx (Immutable)
  readonly contentMasterId: string; // Immutable
  readonly domainOwner: 'Publishing';
  readonly createdAt: string; // Immutable
  scheduledPublishTime: string; // ISO 8601
  lifecycle: PublishingLifecycle;
  youtubeShortTitle: string; // <= 100 chars
  youtubeDescription: string;
  youtubeTags: string[];
  pinnedCommentCopy: string;
  instagramCaption: string;
  instagramHashtags: string[];
}

export interface PublicationEntity {
  readonly publicationId: string; // PLIVE-xxxxxx (Immutable)
  readonly publishingPackageId: string; // Immutable
  readonly platformId: string; // Reference to PlatformEntity
  readonly publishedAt: string; // Immutable
  externalContentId: string; // e.g. YouTube Video ID
  livePermalink: string; // URL
  dispatchStatus: 'SUCCESS' | 'PARTIAL_SYNC' | 'FAILED';
}

export interface PlatformEntity {
  readonly platformCode: 'YOUTUBE' | 'INSTAGRAM' | 'FACEBOOK'; // Immutable
  readonly platformName: string;
  isActive: boolean;
  apiAdapterName: string;
}

// ============================================================================
// 7. ANALYTICS & INTELLIGENCE ENTITIES
// ============================================================================

export interface AnalyticsSnapshotEntity {
  readonly snapshotId: string; // ASN-xxxxxx (Immutable)
  readonly publicationId: string; // Immutable
  readonly capturedAt: string; // Immutable
  viewsCount: number;
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  averageWatchDurationSeconds: number;
}

export interface PerformanceRecordEntity {
  readonly recordId: string; // PERF-xxxxxx (Immutable)
  readonly contentMasterId: string; // Immutable
  readonly evaluationPeriod: 'DAY_1' | 'DAY_7' | 'DAY_30';
  normalizedViewIndex: number; // Normalized across platform algorithms
  engagementRateRatio: number;
  retentionCurveBenchmark: 'VIRAL' | 'HIGH' | 'AVERAGE' | 'UNDERPERFORMING';
}

export interface IntelligenceInsightEntity {
  readonly insightId: string; // INS-xxxxxx (Immutable)
  readonly domainOwner: 'Intelligence';
  readonly generatedAt: string; // Immutable
  syllabusSubject: string;
  syllabusTopic: string;
  insightCategory: 'HIGH_DROPOFF_TOPIC' | 'CONFUSION_SIGNAL' | 'HIGH_DEMAND_CURRICULUM';
  recommendationSummary: string;
  suggestedActionForQuestionStudio: string; // Feeds back to Step 01
  isArchived: boolean;
}

// ============================================================================
// 8. WORKFLOW & AUDIT ENTITIES
// ============================================================================

export interface WorkflowInstanceEntity {
  readonly instanceId: string; // WFI-xxxxxx (Immutable)
  readonly contentMasterId: string; // Immutable
  readonly domainOwner: 'Workflow';
  currentStageNumber: number; // 1..15
  isBlocked: boolean;
  blockReason?: string;
  activeAssigneeUserId?: string;
}

export interface WorkflowTransitionEntity {
  readonly transitionId: string; // WFT-xxxxxx (Immutable, AP-014)
  readonly workflowInstanceId: string; // Immutable
  readonly fromStageNumber: number; // Immutable
  readonly toStageNumber: number; // Immutable
  readonly actorUserId: string; // Immutable (AP-004)
  readonly transitionTimestamp: string; // Immutable
  readonly humanSignOff: boolean; // AP-009
  remarks?: string;
}

export interface NotificationEntity {
  readonly notificationId: string; // NOTIF-xxxxxx (Immutable)
  readonly recipientUserId: string; // Immutable
  readonly createdAt: string; // Immutable
  readonly domainOwner: 'Operations';
  alertType: 'ASSIGNMENT' | 'QC_REVISION' | 'APPROVAL_NEEDED' | 'SYSTEM_ALERT';
  messageText: string;
  targetEntityUrl: string;
  isRead: boolean;
}

export interface AuditEventEntity {
  readonly auditEventId: string; // AUD-xxxxxx (Immutable, AP-014)
  readonly domainOwner: 'Audit';
  readonly timestamp: string; // Immutable
  readonly actorUserId: string; // Immutable
  readonly actorRole: string; // Immutable
  readonly actionVerb: string; // Immutable (e.g. "QUESTION_VERIFIED")
  readonly targetEntityType: string; // Immutable
  readonly targetEntityId: string; // Immutable
  readonly beforeStateJson?: string; // Immutable diff
  readonly afterStateJson?: string; // Immutable diff
}

// ============================================================================
// AUTHORITATIVE DOMAIN ENTITY REGISTRY (27 ENTITIES)
// ============================================================================

export interface EntityMetadata {
  entityName: string;
  domainOwner: DomainName;
  purpose: string;
  relationships: string[];
  lifecycleStates: string[];
  requiredFields: string[];
  optionalFields: string[];
  immutableFields: string[];
  references: string[];
}

export const DOMAIN_ENTITY_REGISTRY: Record<string, EntityMetadata> = {
  User: {
    entityName: 'User',
    domainOwner: 'Identity',
    purpose: 'Represents verified human participants in the content production pipeline.',
    relationships: ['1:N Role', '1:N Question', '1:N Script', '1:N VideoTake', '1:N AuditEvent'],
    lifecycleStates: ['PROVISIONED', 'ACTIVE', 'SUSPENDED', 'DEACTIVATED'],
    requiredFields: ['businessId', 'email', 'displayName', 'status', 'createdAt', 'roleCodes'],
    optionalFields: ['phone', 'avatarUrl', 'assignedSubjectSpecialties', 'googleSubId'],
    immutableFields: ['businessId', 'createdAt'],
    references: ['RoleEntity', 'Google OAuth subId'],
  },
  Role: {
    entityName: 'Role',
    domainOwner: 'Roles',
    purpose: 'Bundles functional capabilities and workflow stage transition permissions.',
    relationships: ['N:M User', '1:N Capability'],
    lifecycleStates: ['DEFINED', 'ACTIVE', 'DEPRECATED'],
    requiredFields: ['roleCode', 'roleName', 'description', 'isSystemRole', 'capabilityCodes'],
    optionalFields: ['workflowStageAuthorizations'],
    immutableFields: ['roleCode', 'isSystemRole'],
    references: ['CapabilityEntity'],
  },
  Capability: {
    entityName: 'Capability',
    domainOwner: 'Capabilities',
    purpose: 'Fine-grained server-side permission flag governing discrete operations.',
    relationships: ['N:1 Role'],
    lifecycleStates: ['ACTIVE', 'DEPRECATED'],
    requiredFields: ['capabilityCode', 'resource', 'action', 'description'],
    optionalFields: [],
    immutableFields: ['capabilityCode'],
    references: [],
  },
  Question: {
    entityName: 'Question',
    domainOwner: 'Questions',
    purpose: 'Core educational intellectual property atom: question text, options, and proof.',
    relationships: ['1:N QuestionVersion', '1:N QuestionReview', '1:1 Content'],
    lifecycleStates: ['DRAFT', 'PENDING_VERIFICATION', 'APPROVED', 'REVISIONS_REQUESTED', 'REJECTED'],
    requiredFields: ['businessId', 'authorUserId', 'questionTextTelugu', 'options', 'correctOptionIndex', 'solutionExplanationTelugu', 'syllabusClass', 'subject', 'topic', 'difficultyLevel', 'lifecycle', 'createdAt'],
    optionalFields: ['questionTextEnglish', 'solutionExplanationEnglish', 'subtopic'],
    immutableFields: ['businessId', 'createdAt', 'authorUserId'],
    references: ['UserEntity'],
  },
  QuestionVersion: {
    entityName: 'QuestionVersion',
    domainOwner: 'Questions',
    purpose: 'Immutable historical snapshot of question copy and solutions.',
    relationships: ['N:1 Question'],
    lifecycleStates: ['IMMUTABLE_SNAPSHOT'],
    requiredFields: ['versionId', 'questionBusinessId', 'versionNumber', 'createdAt', 'createdByUserId', 'snapshotQuestionTextTelugu', 'snapshotOptions', 'snapshotCorrectOptionIndex', 'snapshotExplanation', 'changeLogReason'],
    optionalFields: [],
    immutableFields: ['versionId', 'questionBusinessId', 'versionNumber', 'createdAt'],
    references: ['QuestionEntity', 'UserEntity'],
  },
  QuestionReview: {
    entityName: 'QuestionReview',
    domainOwner: 'Reviews',
    purpose: 'Formal human SME verification sign-off record (AP-009).',
    relationships: ['N:1 Question', 'N:1 User'],
    lifecycleStates: ['SUBMITTED', 'RECORDED'],
    requiredFields: ['reviewId', 'questionBusinessId', 'reviewerUserId', 'verdict', 'rubricScore', 'feedbackRemarks', 'factualAccuracyConfirmed', 'pedagogicalClarityConfirmed', 'teluguNuanceConfirmed', 'createdAt'],
    optionalFields: [],
    immutableFields: ['reviewId', 'questionBusinessId', 'reviewerUserId', 'createdAt'],
    references: ['QuestionEntity', 'UserEntity'],
  },
  Content: {
    entityName: 'Content',
    domainOwner: 'Content',
    purpose: 'Aggregate master project coordinating Question, Script, Video, Thumbnail, and Publishing.',
    relationships: ['1:1 Question', '1:1 Script', '1:1 Video', '1:1 Thumbnail', '1:1 PublishingPackage', '1:1 WorkflowInstance'],
    lifecycleStates: ['IN_PRODUCTION', 'READY_FOR_DISTRIBUTION', 'PUBLISHED', 'ARCHIVED'],
    requiredFields: ['businessId', 'title', 'canonicalWorkflowStage', 'questionBusinessId', 'createdAt'],
    optionalFields: ['scriptBusinessId', 'videoBusinessId', 'thumbnailBusinessId', 'publishingPackageId'],
    immutableFields: ['businessId', 'createdAt'],
    references: ['QuestionEntity', 'ScriptEntity', 'VideoEntity', 'ThumbnailEntity', 'PublishingPackageEntity'],
  },
  Script: {
    entityName: 'Script',
    domainOwner: 'Scripts',
    purpose: 'Vertical short-form presenter spoken narrative and visual cue instructions.',
    relationships: ['1:1 Content', '1:N ScriptVersion'],
    lifecycleStates: ['DRAFT', 'READY_FOR_TELEPROMPTER', 'LOCKED_FOR_RECORDING', 'ARCHIVED'],
    requiredFields: ['businessId', 'contentMasterId', 'threeSecondHookTelugu', 'teleprompterBodyTelugu', 'callToActionTelugu', 'targetDurationSeconds', 'lifecycle', 'createdAt'],
    optionalFields: ['speedTrickCallout'],
    immutableFields: ['businessId', 'contentMasterId', 'createdAt'],
    references: ['ContentEntity'],
  },
  ScriptVersion: {
    entityName: 'ScriptVersion',
    domainOwner: 'Scripts',
    purpose: 'Immutable snapshot of teleprompter body copy revisions.',
    relationships: ['N:1 Script'],
    lifecycleStates: ['IMMUTABLE_SNAPSHOT'],
    requiredFields: ['versionId', 'scriptBusinessId', 'versionNumber', 'snapshotBodyText', 'changeSummary', 'createdAt'],
    optionalFields: [],
    immutableFields: ['versionId', 'scriptBusinessId', 'versionNumber', 'createdAt'],
    references: ['ScriptEntity'],
  },
  Video: {
    entityName: 'Video',
    domainOwner: 'Production',
    purpose: 'Multimedia project managing camera takes, cut master, and render specs.',
    relationships: ['1:1 Content', '1:N VideoTake', '1:1 VideoEdit'],
    lifecycleStates: ['QUEUED', 'RECORDING', 'RECORDED', 'EDITING', 'EDITED', 'QC_PASSED', 'READY_TO_UPLOAD', 'UPLOADED'],
    requiredFields: ['businessId', 'contentMasterId', 'aspectRatio', 'lifecycle', 'createdAt'],
    optionalFields: ['assignedHostUserId', 'assignedEditorUserId', 'rawFootageMediaAssetId', 'masterCutMediaAssetId'],
    immutableFields: ['businessId', 'contentMasterId', 'createdAt'],
    references: ['ContentEntity', 'UserEntity', 'MediaAssetEntity'],
  },
  VideoTake: {
    entityName: 'VideoTake',
    domainOwner: 'Production',
    purpose: 'Individual camera take recording metadata and raw footage link.',
    relationships: ['N:1 Video', 'N:1 User'],
    lifecycleStates: ['RECORDED', 'ACCEPTED', 'REJECTED'],
    requiredFields: ['takeId', 'videoBusinessId', 'takeNumber', 'hostUserId', 'durationSeconds', 'isAcceptedTake', 'rawMediaAssetId', 'recordedAt'],
    optionalFields: ['notes'],
    immutableFields: ['takeId', 'videoBusinessId', 'takeNumber', 'recordedAt'],
    references: ['VideoEntity', 'UserEntity', 'MediaAssetEntity'],
  },
  VideoEdit: {
    entityName: 'VideoEdit',
    domainOwner: 'Production',
    purpose: 'Final cut master render verification (subtitles, LUFS audio).',
    relationships: ['1:1 Video', 'N:1 User'],
    lifecycleStates: ['SUBMITTED_FOR_QC', 'QC_APPROVED', 'QC_REJECTED'],
    requiredFields: ['editId', 'videoBusinessId', 'editorUserId', 'masterCutMediaAssetId', 'editVersionNumber', 'subtitlesSynced', 'audioLufsTargetMet', 'colorGradingApplied', 'createdAt'],
    optionalFields: [],
    immutableFields: ['editId', 'videoBusinessId', 'editorUserId', 'createdAt'],
    references: ['VideoEntity', 'UserEntity', 'MediaAssetEntity'],
  },
  MediaAsset: {
    entityName: 'MediaAsset',
    domainOwner: 'Media',
    purpose: 'Metadata descriptor and pointer to external binary storage (AP-007, AP-008).',
    relationships: ['1:N MediaReference', '1:1 ArchiveReference'],
    lifecycleStates: ['REGISTERED', 'VERIFIED', 'ARCHIVED', 'SOFT_DELETED'],
    requiredFields: ['businessId', 'entityType', 'entityId', 'fileName', 'mimeType', 'byteSize', 'sha256', 'storageProvider', 'externalStorageId', 'externalUrl', 'createdAt'],
    optionalFields: [],
    immutableFields: ['businessId', 'entityType', 'entityId', 'createdAt'],
    references: ['Google Drive FileId / Cloud Storage URI'],
  },
  MediaReference: {
    entityName: 'MediaReference',
    domainOwner: 'Media',
    purpose: 'Links a MediaAsset to consuming domain entities.',
    relationships: ['N:1 MediaAsset'],
    lifecycleStates: ['ACTIVE', 'DETACHED'],
    requiredFields: ['referenceId', 'mediaAssetId', 'consumerEntityId', 'relationshipType'],
    optionalFields: [],
    immutableFields: ['referenceId', 'mediaAssetId', 'consumerEntityId'],
    references: ['MediaAssetEntity'],
  },
  ArchiveReference: {
    entityName: 'ArchiveReference',
    domainOwner: 'Media',
    purpose: 'Cold storage / disaster recovery tier pointer for raw footage.',
    relationships: ['N:1 MediaAsset'],
    lifecycleStates: ['PENDING_ARCHIVAL', 'ARCHIVED', 'CHECKSUM_CONFIRMED'],
    requiredFields: ['archiveId', 'mediaAssetId', 'vaultProvider', 'vaultIdentifier', 'archivedAt', 'checksumVerified'],
    optionalFields: [],
    immutableFields: ['archiveId', 'mediaAssetId', 'archivedAt'],
    references: ['MediaAssetEntity'],
  },
  Thumbnail: {
    entityName: 'Thumbnail',
    domainOwner: 'Creative',
    purpose: 'Click-through graphics packaging and A/B test variants.',
    relationships: ['N:1 Content', '1:1 MediaAsset'],
    lifecycleStates: ['DRAFT', 'RENDERED', 'APPROVED_PRIMARY'],
    requiredFields: ['businessId', 'contentMasterId', 'variantCode', 'headlineHookTelugu', 'mediaAssetId', 'isPrimaryVariant', 'createdAt'],
    optionalFields: [],
    immutableFields: ['businessId', 'contentMasterId', 'createdAt'],
    references: ['ContentEntity', 'MediaAssetEntity'],
  },
  SocialReview: {
    entityName: 'SocialReview',
    domainOwner: 'Reviews',
    purpose: '9:16 smartphone preview simulator and hook-punch rating sign-off.',
    relationships: ['N:1 Content', 'N:1 User'],
    lifecycleStates: ['IN_REVIEW', 'APPROVED', 'REVISIONS_REQUESTED'],
    requiredFields: ['reviewId', 'contentMasterId', 'reviewerUserId', 'aspectRatio9x16Approved', 'mobileSafeZoneChecked', 'hookThreeSecondPunchRating', 'verdict', 'reviewedAt'],
    optionalFields: ['reviewerNotes'],
    immutableFields: ['reviewId', 'contentMasterId', 'reviewerUserId', 'reviewedAt'],
    references: ['ContentEntity', 'UserEntity'],
  },
  PublishingPackage: {
    entityName: 'PublishingPackage',
    domainOwner: 'Publishing',
    purpose: 'Multi-platform packaging, tag configuration, and release schedule.',
    relationships: ['1:1 Content', '1:N Publication'],
    lifecycleStates: ['DRAFT', 'SCHEDULED', 'DISPATCHED', 'PUBLISHED', 'FAILED_RETRYABLE'],
    requiredFields: ['businessId', 'contentMasterId', 'scheduledPublishTime', 'lifecycle', 'youtubeShortTitle', 'youtubeDescription', 'youtubeTags', 'pinnedCommentCopy', 'instagramCaption', 'instagramHashtags', 'createdAt'],
    optionalFields: [],
    immutableFields: ['businessId', 'contentMasterId', 'createdAt'],
    references: ['ContentEntity'],
  },
  Publication: {
    entityName: 'Publication',
    domainOwner: 'Publishing',
    purpose: 'Live publication instance on a specific distribution channel.',
    relationships: ['N:1 PublishingPackage', 'N:1 Platform', '1:N AnalyticsSnapshot'],
    lifecycleStates: ['DISPATCHING', 'LIVE', 'DELISTED', 'ERROR'],
    requiredFields: ['publicationId', 'publishingPackageId', 'platformId', 'externalContentId', 'livePermalink', 'dispatchStatus', 'publishedAt'],
    optionalFields: [],
    immutableFields: ['publicationId', 'publishingPackageId', 'platformId', 'publishedAt'],
    references: ['PublishingPackageEntity', 'PlatformEntity', 'External Platform Video ID'],
  },
  Platform: {
    entityName: 'Platform',
    domainOwner: 'Publishing',
    purpose: 'Target broadcast channel configuration (YouTube, Instagram, Facebook).',
    relationships: ['1:N Publication'],
    lifecycleStates: ['ACTIVE', 'INACTIVE'],
    requiredFields: ['platformCode', 'platformName', 'isActive', 'apiAdapterName'],
    optionalFields: [],
    immutableFields: ['platformCode'],
    references: [],
  },
  AnalyticsSnapshot: {
    entityName: 'AnalyticsSnapshot',
    domainOwner: 'Analytics',
    purpose: 'Point-in-time metrics ingestion from external platforms.',
    relationships: ['N:1 Publication'],
    lifecycleStates: ['RECORDED'],
    requiredFields: ['snapshotId', 'publicationId', 'viewsCount', 'likesCount', 'commentsCount', 'sharesCount', 'averageWatchDurationSeconds', 'capturedAt'],
    optionalFields: [],
    immutableFields: ['snapshotId', 'publicationId', 'capturedAt'],
    references: ['PublicationEntity'],
  },
  PerformanceRecord: {
    entityName: 'PerformanceRecord',
    domainOwner: 'Analytics',
    purpose: 'Cross-platform normalized engagement scoring and retention benchmark.',
    relationships: ['N:1 Content'],
    lifecycleStates: ['COMPUTED', 'ARCHIVED'],
    requiredFields: ['recordId', 'contentMasterId', 'evaluationPeriod', 'normalizedViewIndex', 'engagementRateRatio', 'retentionCurveBenchmark'],
    optionalFields: [],
    immutableFields: ['recordId', 'contentMasterId'],
    references: ['ContentEntity'],
  },
  IntelligenceInsight: {
    entityName: 'IntelligenceInsight',
    domainOwner: 'Intelligence',
    purpose: 'Pedagogical curriculum intelligence feedback loop (Step 15 -> Step 01).',
    relationships: ['1:N Content (Referenced in Question Studio ideation)'],
    lifecycleStates: ['ACTIVE', 'APPLIED', 'ARCHIVED'],
    requiredFields: ['insightId', 'syllabusSubject', 'syllabusTopic', 'insightCategory', 'recommendationSummary', 'suggestedActionForQuestionStudio', 'isArchived', 'generatedAt'],
    optionalFields: [],
    immutableFields: ['insightId', 'generatedAt'],
    references: [],
  },
  WorkflowInstance: {
    entityName: 'WorkflowInstance',
    domainOwner: 'Workflow',
    purpose: 'Active state machine instance tracking a content item across the 15 steps.',
    relationships: ['1:1 Content', '1:N WorkflowTransition'],
    lifecycleStates: ['ACTIVE', 'COMPLETED', 'BLOCKED', 'ABORTED'],
    requiredFields: ['instanceId', 'contentMasterId', 'currentStageNumber', 'isBlocked'],
    optionalFields: ['blockReason', 'activeAssigneeUserId'],
    immutableFields: ['instanceId', 'contentMasterId'],
    references: ['ContentEntity', 'UserEntity'],
  },
  WorkflowTransition: {
    entityName: 'WorkflowTransition',
    domainOwner: 'Workflow',
    purpose: 'Immutable audit record of a verified stage advancement or revision (AP-003, AP-014).',
    relationships: ['N:1 WorkflowInstance', 'N:1 User'],
    lifecycleStates: ['COMMITTED'],
    requiredFields: ['transitionId', 'workflowInstanceId', 'fromStageNumber', 'toStageNumber', 'actorUserId', 'humanSignOff', 'transitionTimestamp'],
    optionalFields: ['remarks'],
    immutableFields: ['transitionId', 'workflowInstanceId', 'fromStageNumber', 'toStageNumber', 'actorUserId', 'transitionTimestamp'],
    references: ['WorkflowInstanceEntity', 'UserEntity'],
  },
  Notification: {
    entityName: 'Notification',
    domainOwner: 'Operations',
    purpose: 'In-app team coordination alerts to eliminate handoff wait times.',
    relationships: ['N:1 User'],
    lifecycleStates: ['UNREAD', 'READ', 'DISMISSED'],
    requiredFields: ['notificationId', 'recipientUserId', 'alertType', 'messageText', 'targetEntityUrl', 'isRead', 'createdAt'],
    optionalFields: [],
    immutableFields: ['notificationId', 'recipientUserId', 'createdAt'],
    references: ['UserEntity'],
  },
  AuditEvent: {
    entityName: 'AuditEvent',
    domainOwner: 'Audit',
    purpose: 'Tamper-evident, immutable business transaction ledger (AP-014).',
    relationships: ['N:1 User'],
    lifecycleStates: ['COMMITTED_IMMUTABLE'],
    requiredFields: ['auditEventId', 'timestamp', 'actorUserId', 'actorRole', 'actionVerb', 'targetEntityType', 'targetEntityId'],
    optionalFields: ['beforeStateJson', 'afterStateJson'],
    immutableFields: ['auditEventId', 'timestamp', 'actorUserId', 'actorRole', 'actionVerb', 'targetEntityType', 'targetEntityId'],
    references: ['UserEntity'],
  },
};
