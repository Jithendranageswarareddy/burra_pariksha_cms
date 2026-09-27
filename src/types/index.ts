/**
 * BURRA PARIKSHA CMS - Domain Types & Interfaces
 * Phase 1: Core Domain Foundations
 * 
 * NOTE: These types mirror the upcoming Google Sheets data architecture (Spreadsheet: "Burra Pariksha CMS - TEST").
 * Detailed schema formalization will occur in Phase 2 upon inspecting live sheet structures.
 */

import { AIProvenance } from './phase24-ai';

// ============================================================================
// 1. WORKFLOW & STATUS CONSTANTS / ENUMS
// ============================================================================

export enum QuestionStatus {
  DRAFT = 'DRAFT',
  GENERATED = 'GENERATED',
  EDITING = 'EDITING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ARCHIVED = 'ARCHIVED',
}

export enum QuestionValidationStatus {
  NOT_VALIDATED = 'NOT_VALIDATED',
  VALIDATING = 'VALIDATING',
  VALID = 'VALID',
  NEEDS_REVIEW = 'NEEDS_REVIEW',
  INVALID = 'INVALID',
}

export enum RenderValidationStatus {
  NOT_VALIDATED = 'NOT_VALIDATED',
  VALID = 'VALID',
  INVALID = 'INVALID',
  NEEDS_REVIEW = 'NEEDS_REVIEW',
}

export enum VideoProductionStatus {
  NOT_STARTED = 'NOT_STARTED',
  QUEUED = 'QUEUED',
  SCRIPT_REQUIRED = 'SCRIPT_REQUIRED',
  SCRIPT_READY = 'SCRIPT_READY',
  RECORDING = 'RECORDING',
  RECORDED = 'RECORDED',
  EDITING = 'EDITING',
  EDITED = 'EDITED',
  FINAL_REVIEW = 'FINAL_REVIEW',
  READY_TO_UPLOAD = 'READY_TO_UPLOAD',
  UPLOADED = 'UPLOADED',
  ON_HOLD = 'ON_HOLD',
  CANCELLED = 'CANCELLED',
}

export enum CanonicalProductionReadiness {
  RENDER_NOT_STARTED = 'RENDER_NOT_STARTED',
  RENDER_METADATA_INCOMPLETE = 'RENDER_METADATA_INCOMPLETE',
  RENDER_INVALID = 'RENDER_INVALID',
  RENDER_VALID_BUT_EDITING = 'RENDER_VALID_BUT_EDITING',
  EDITING_COMPLETE = 'EDITING_COMPLETE',
  READY_FOR_PUBLISHING = 'READY_FOR_PUBLISHING',
}

export enum DifficultyLevel {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export enum QuestionLanguage {
  ENGLISH = 'ENGLISH',
  TELUGU = 'TELUGU',
  HINGLISH = 'HINGLISH',
  TELUGU_ENGLISH = 'TELUGU_ENGLISH',
}

export enum PublishingPlatform {
  YOUTUBE = 'YOUTUBE',
  INSTAGRAM = 'INSTAGRAM',
  FACEBOOK = 'FACEBOOK',
}

export enum SocialPublishStatus {
  NOT_STARTED = 'NOT_STARTED',
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  UPLOADED = 'UPLOADED',
  PUBLISHED = 'PUBLISHED',
  FAILED = 'FAILED',
}

export enum QuestionStyle {
  REAL_WORLD_SCENARIO = 'Real-World Scenario',
  STORY_BASED = 'Story-Based Scenario',
  PUZZLE = 'Logical Puzzle',
  LOGICAL_PUZZLE = 'Logical Puzzle',
  TRICK_QUESTION = 'Trick Question / Misdirection Trap',
  SPEED_CHALLENGE = 'Speed Challenge / Fast Calculation',
  SPEED_MATH_TRICK = 'Speed Math / Mental Calculation',
  EXAM_STYLE = 'Standard Exam Style',
  LOGIC_CHALLENGE = 'Logic Challenge / Deductive Reasoning',
  COMMENT_CHALLENGE = 'Comment Challenge / Audience Brain Teaser',
  DATA_INTERPRETATION = 'Data Interpretation / Chart Analysis',
  VERBAL_TRAP = 'Verbal Trap / Ambiguity',
  CONCEPTUAL_PROBE = 'Conceptual Probe',
}

export enum PriorityLevel {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum ContentPlanStatus {
  DRAFT = 'DRAFT',
  APPROVED = 'APPROVED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum ContentBatchStatus {
  PLANNED = 'PLANNED',
  ACTIVE = 'ACTIVE',
  REVIEW = 'REVIEW',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum AssignmentStatus {
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  BLOCKED = 'BLOCKED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum UserRole {
  ADMIN = 'ADMIN',
  PUBLISHER = 'PUBLISHER',
  CONTENT_MANAGER = 'CONTENT_MANAGER',
  TOPIC_LEAD = 'TOPIC_LEAD',
  QUESTION_CREATOR = 'QUESTION_CREATOR',
  QUESTION_EDITOR = 'QUESTION_EDITOR',
  TELUGU_TRANSLATOR = 'TELUGU_TRANSLATOR',
  STUDIO_PRESENTER = 'STUDIO_PRESENTER',
  SCRIPT_WRITER = 'SCRIPT_WRITER',
  VIDEO_EDITOR = 'VIDEO_EDITOR',
  THUMBNAIL_DESIGNER = 'THUMBNAIL_DESIGNER',
  DESIGNER = 'DESIGNER',
  PUBLISHING_MANAGER = 'PUBLISHING_MANAGER',
  COMMUNITY_MANAGER = 'COMMUNITY_MANAGER',
  CREATOR = 'CREATOR',
  EDITOR = 'EDITOR',
  ANALYTICS_VIEWER = 'ANALYTICS_VIEWER',
  REVIEWER = 'REVIEWER',
  SPEAKER = 'SPEAKER',
  CONTENT_WRITER = 'CONTENT_WRITER',
}

export enum AssignmentRole {
  CONTENT_WRITER = 'CONTENT_WRITER',
  QUESTION_EDITOR = 'QUESTION_EDITOR',
  SCRIPT_WRITER = 'SCRIPT_WRITER',
  SPEAKER = 'SPEAKER',
  VIDEO_EDITOR = 'VIDEO_EDITOR',
  DESIGNER = 'DESIGNER',
  PUBLISHING_MANAGER = 'PUBLISHING_MANAGER',
  ADMIN = 'ADMIN',
  REVIEWER = 'REVIEWER',
  EDITOR = 'EDITOR',
}

export enum AssignmentEntityType {
  CONTENT_MASTER = 'CONTENT_MASTER',
  QUESTION = 'QUESTION',
  VIDEO = 'VIDEO',
  SCRIPT = 'SCRIPT',
  THUMBNAIL = 'THUMBNAIL',
  PUBLISHING = 'PUBLISHING',
  CONTENT_PLAN = 'CONTENT_PLAN',
  CONTENT_BATCH = 'CONTENT_BATCH',
}

export enum AssignmentTaskType {
  SCRIPTING = 'SCRIPTING',
  RECORDING = 'RECORDING',
  EDITING = 'EDITING',
  THUMBNAIL = 'THUMBNAIL',
  REVIEW = 'REVIEW',
  QUESTION_CREATION = 'QUESTION_CREATION',
  QUESTION_REVIEW = 'QUESTION_REVIEW',
  PUBLISHING = 'PUBLISHING',
  PLANNING = 'PLANNING',
  BATCH_PRODUCTION = 'BATCH_PRODUCTION',
}

// ============================================================================
// 2. DOMAIN ENTITY INTERFACES (Google Sheets Tabs Representation)
// ============================================================================

/**
 * USERS Sheet Tab
 * Represents the owner/admin or future production contributors.
 */
export interface User {
  id: string; // e.g. USR-001
  name: string;
  email: string;
  role: UserRole | string;
  roles?: (UserRole | string)[];
  avatarUrl?: string;
  isActive: boolean;
  password_hash?: string;
  last_login_at?: string;
  sessionVersion?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * CATEGORIES Sheet Tab
 * High-level aptitude categories (e.g., Quantitative Aptitude, Logical Reasoning).
 */
export interface Category {
  id: string; // e.g. CAT-01
  name: string;
  slug: string;
  description?: string;
  colorCode?: string;
  topicsCount?: number;
  questionsCount?: number;
  createdAt: string;
  // TODO: Verify exact column headers with Google Sheet in Phase 2
}

/**
 * TOPICS Sheet Tab
 * Subject domains (e.g., Time & Work, Number Series).
 * Can optionally belong to a Category for high-level grouping.
 */
export interface Topic {
  id: string; // e.g. TOP-101 or BP-TOP-001
  categoryId?: string; // Optional reference to Category.id
  name: string;
  slug: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
  subtopicsCount?: number;
  createdAt: string;
  updatedAt?: string;
}

/**
 * SUBTOPICS Sheet Tab
 * Granular sub-division (e.g., Pipes & Cisterns, Relative Speed).
 * Belongs to exactly one Topic.
 */
export interface Subtopic {
  id: string; // e.g. SUB-1001 or BP-SUB-0001
  topicId: string; // Reference to Topic.id
  name: string;
  slug: string;
  description?: string;
  notes?: string;
  displayOrder?: number;
  isActive?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export enum ContentMasterStatus {
  DRAFT = 'DRAFT',
  READY_FOR_REVIEW = 'READY_FOR_REVIEW',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
  APPROVED = 'APPROVED',
  SCHEDULED = 'SCHEDULED',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
  // Legacy/Compatibility Aliases
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
}

/**
 * CONTENT_MASTERS Sheet Tab
 * Root identity connecting a piece of content across its full lifecycle.
 */
export interface ContentMaster {
  id: string; // e.g. BP-CNT-000001 (or legacy BP-MST-000001)
  contentId?: string; // Canonical correlation identity BP-CNT-######
  title: string;
  status: ContentMasterStatus | string;
  primaryQuestionId?: string;
  categoryId?: string;
  topicId?: string;
  subtopicId?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  ownerId?: string;
  ownerName?: string;
  reviewerId?: string;
  reviewerName?: string;
  currentVersion?: number;
  approvedVersion?: number;
  reviewComments?: string; // Semicolon/JSON/newline separated list of comment records
}

export interface ContentMasterReadinessResult {
  isEligible: boolean;
  blockers: string[];
}

export interface ContentMasterCanonicalState {
  contentMasterId: string;
  status: ContentMasterStatus;
  primaryQuestion?: {
    id: string;
    status: string;
    validationStatus: string;
  };
  videoSummary: {
    totalVideos: number;
    videoIds: string[];
    statuses: string[];
    isAnyInProduction: boolean;
    areAllUploaded: boolean;
  };
  assetReadiness: {
    scriptReady: boolean;
    thumbnailApproved: boolean;
    pinnedCommentApproved: boolean;
  };
  socialReviewState: {
    status: string;
    isVersionHashMatching: boolean;
  };
  publishingState: {
    totalPlatformsCount: number;
    completedPlatformsCount: number;
    isAllPublished: boolean;
    isFinalized: boolean;
    platforms: {
      youtube: string;
      instagram: string;
      facebook: string;
    };
  };
  blockers: string[];
  isEligibleForCompletion: boolean;
  isEligibleForArchival: boolean;
}

/**
 * QUESTIONS Sheet Tab
 * Core question bank record with options, solutions, and production tags.
 */
export interface Question {
  id: string; // e.g. BP-Q-1042
  contentId?: string; // Canonical correlation identity BP-CNT-######
  contentMasterId?: string; // Reference to ContentMaster.id (BP-CNT-****** or legacy BP-MST-******)
  categoryId?: string; // Legacy/compatibility grouping; frozen production taxonomy is Topic -> Subtopic
  categoryName?: string;
  topicId: string;
  topicName: string;
  subtopicId: string;
  subtopicName: string;
  difficulty: DifficultyLevel | string;
  language?: QuestionLanguage | string;
  questionText: string;
  question?: string; // Production question contract alias
  options: {
    a: string;
    b: string;
    c: string;
    d: string;
  } | any;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  realWorldContext?: string;
  realLifeContext?: string;
  challengeType?: string;
  presentationType?: string;
  questionStyle?: QuestionStyle | string;
  status: QuestionStatus;
  videoStatus: VideoProductionStatus;
  tags?: string[];
  source?: string;
  aiPromptUsed?: string;
  aiModel?: string;
  aiPrompt?: string;
  originalityScore?: number;
  validationStatus?: QuestionValidationStatus | string;
  lastValidationId?: string;
  validationScore?: number;
  authorId?: string;
  author?: string; // Production question contract alias
  generationMode?: 'SUBTOPIC' | 'RANDOM' | string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// QUESTION_CONFIG Worksheet Data Models (Creator-Managed Studio Configuration)
// ============================================================================

export type QuestionConfigDimension = 'REAL_LIFE_CONTEXT' | 'QUESTION_STYLE';

export interface QuestionConfigEntry {
  id: string;
  dimension: QuestionConfigDimension | string;
  code: string;
  displayLabel: string;
  description?: string;
  aiPromptGuidance?: string;
  sortOrder: number;
  isActive: boolean;
  isDefault: boolean;
  updatedAt: string;
}

export interface GroupedQuestionConfig {
  realLifeContexts: QuestionConfigEntry[];
  questionStyles: QuestionConfigEntry[];
  defaultRealLifeContext: QuestionConfigEntry | null;
  defaultQuestionStyle: QuestionConfigEntry | null;
}

export interface QuestionStudioConfigResponse {
  realLifeContexts: QuestionConfigEntry[];
  questionStyles: QuestionConfigEntry[];
  defaults: {
    realLifeContext: string;
    questionStyle: string;
    difficulty?: string;
    language?: string;
    defaultRealLifeContext: QuestionConfigEntry | null;
    defaultQuestionStyle: QuestionConfigEntry | null;
  };
  defaultRealLifeContext: QuestionConfigEntry | null;
  defaultQuestionStyle: QuestionConfigEntry | null;
  difficulties?: Array<{ id: string; name: string; description?: string }>;
  challengeTypes?: Array<{ id: string; name: string; description?: string }>;
  presentationTypes?: Array<{ id: string; name: string; description?: string }>;
  languages?: Array<{ id: string; name: string; code: string }>;
}

// ============================================================================
// Phase 5: Question Validation Engine Data Models & Contracts
// ============================================================================

export type ValidationSource =
  | 'DETERMINISTIC'
  | 'AI_ASSISTED'
  | 'MULTI_MODEL_CONSENSUS'
  | 'HYBRID';

export interface ValidationCheckItem {
  id: string;
  name: string;
  category:
    | 'STRUCTURAL'
    | 'TAXONOMY'
    | 'OPTION'
    | 'MATHEMATICAL'
    | 'LOGICAL'
    | 'ANSWER'
    | 'EXPLANATION'
    | 'AMBIGUITY'
    | 'CONSISTENCY'
    | 'FAIRNESS'
    | 'MODEL_CONSENSUS';
  status: 'PASS' | 'WARN' | 'FAIL' | 'NEEDS_REVIEW' | 'NOT_APPLICABLE';
  message: string;
  details?: string;
  confidence?: number;
}

export interface AnswerVerificationResult {
  isConsistent: boolean;
  declaredAnswer: string;
  verifiedAnswer?: string;
  matchedOption?: string;
  details: string;
  contradictionDetected: boolean;
}

export interface ExplanationVerificationResult {
  isValid: boolean;
  contradictsAnswer: boolean;
  reachesDeclaredResult: boolean;
  substantiveLength: boolean;
  details: string;
}

export interface AmbiguityResult {
  isAmbiguous: boolean;
  ambiguityReasons: string[];
  confidence: number;
  details: string;
}

export interface MathematicalLogicalResult {
  status: 'PROVABLY_VALID' | 'CONTRADICTORY' | 'NOT_DETERMINISTICALLY_VERIFIED' | 'NOT_APPLICABLE';
  problemType?: string;
  calculatedValue?: number | string;
  expectedUnit?: string;
  matchedOption?: string;
  calculationSteps?: string[];
  details: string;
  reason?: string;
}

export interface ValidationEvidence {
  providerId: string;
  modelId: string;
  verdict: 'VALID' | 'NEEDS_REVIEW' | 'INVALID';
  confidence: number;
  reasoningSummary: string;
  detectedIssues: string[];
  answerAssessment?: {
    declaredAnswerCorrect: boolean;
    confidence: number;
    notes: string;
  };
  explanationAssessment?: {
    isClearAndAccurate: boolean;
    notes: string;
  };
  timestamp: string;
}

export interface ValidationResult {
  id: string;
  questionId: string;
  status: QuestionValidationStatus;
  confidenceScore: number;
  validatorVersion: string;
  validationRuleVersion: string;
  timestamp: string;
  source: ValidationSource;
  summary: string;
  checks: ValidationCheckItem[];
  errors: string[];
  warnings: string[];
  recommendations: string[];
  answerVerification: AnswerVerificationResult;
  explanationVerification: ExplanationVerificationResult;
  ambiguityResult: AmbiguityResult;
  mathematicalLogicalResult: MathematicalLogicalResult;
  modelEvidence?: ValidationEvidence[];
  isStale?: boolean;
  validatedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionValidatorProvider {
  readonly providerId: string;
  readonly modelId: string;
  validate(question: Question): Promise<ValidationEvidence>;
}

/**
 * QUESTION_VIDEOS Sheet Tab
 * Many-to-many or join mapping between Questions and Video assets.
 */
export interface QuestionVideo {
  id: string; // e.g. QV-001
  questionId: string;
  videoId: string;
  notes?: string;
  createdAt: string;
}

/**
 * VIDEOS Sheet Tab
 * Video production tracking metadata.
 */
export interface Video {
  id: string; // e.g. BP-V-000001
  contentId?: string; // Canonical correlation identity BP-CNT-######
  contentMasterId?: string; // Reference to ContentMaster.id (BP-CNT-****** or legacy BP-MST-******)
  questionId: string;
  title: string;
  targetDurationSeconds?: number;
  actualDurationSeconds?: number;
  status: VideoProductionStatus;
  priority: PriorityLevel;
  queuePosition?: number;
  assignedHost?: string;
  assignedEditor?: string;
  driveFolderUrl?: string;
  driveFileId?: string;
  driveFolderId?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
  version?: number;
  rawFootagePath?: string;
  finalRenderPath?: string;
  finalRenderWidth?: number;
  finalRenderHeight?: number;
  finalRenderFormat?: string;
  finalRenderAspectRatio?: string;
  finalRenderValidationStatus?: RenderValidationStatus;
  youtubeId?: string;
  scheduledRecordingDate?: string;
  scheduledPublishDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Augmented UI properties
  question?: Question;
  contentMaster?: ContentMaster;
  assignments?: Assignment[];
  workflowHistory?: Workflow[];
  auditLogs?: AuditLog[];
  rawAssets?: MediaAsset[];
  mediaAsset?: MediaAsset;
}

export interface ProductionStats {
  total: number;
  notStarted: number;
  queued: number;
  scriptRequired: number;
  scriptReady: number;
  recording: number;
  recorded: number;
  editing: number;
  edited: number;
  finalReview: number;
  readyToUpload: number;
  uploaded: number;
  onHold: number;
  cancelled: number;
  byPriority: {
    urgent: number;
    high: number;
    normal: number;
    low: number;
  };
}

/**
 * SCRIPT Sheet Tab
 * Short-form / long-form video script content.
 */
export interface Script {
  id: string; // e.g. SCR-204 or BP-S-000001
  contentId?: string; // Canonical correlation identity BP-CNT-######
  contentMasterId?: string; // Reference to ContentMaster.id (BP-CNT-****** or legacy BP-MST-******)
  videoId: string;
  questionId: string;
  hookText: string;
  problemStatement: string;
  stepByStepSolution: string;
  speedTrickOrTakeaway: string;
  callToAction: string;
  currentVersion: number;
  status?: 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';
  assignedReviewerId?: string;
  approvedBy?: string;
  approvedVersion?: number;
  approvedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // TODO: Formalize script schema in Phase 4
}

/**
 * SCRIPT_VERSIONS Sheet Tab
 * Revision history for scripts.
 */
export interface ScriptVersion {
  id: string; // e.g. BP-S-000001-V1
  scriptId: string;
  versionNumber: number;
  content?: string;
  contentJson?: any;
  editedBy: string;
  changeSummary?: string;
  createdAt: string;
}

/**
 * THUMBNAILS Sheet Tab
 * Thumbnail asset references and review status.
 */
export interface Thumbnail {
  id: string; // e.g. THM-204 or BP-T-000001
  contentId?: string; // Canonical correlation identity BP-CNT-######
  contentMasterId?: string; // Reference to ContentMaster.id (BP-CNT-****** or legacy BP-MST-******)
  videoId: string;
  hookHeadline: string;
  driveAssetUrl?: string;
  previewUrl?: string;
  status: 'PENDING' | 'DESIGNED' | 'APPROVED' | 'REJECTED';
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
  // Drive binary metadata fields
  driveFileId?: string;
  driveFolderId?: string;
  driveFolderUrl?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
}

export type MediaStage = 'RAW' | 'EDITED' | 'FINAL' | 'THUMBNAIL';

export interface MediaAsset {
  id: string;
  contentId: string;
  driveFileId: string;
  folderId: string;
  fileName: string;
  mimeType: string;
  fileSize: number;
  checksum?: string;
  md5Checksum?: string;
  createdAt: string;
  updatedAt: string;
  mediaStage: MediaStage;
  version: number;
}

/**
 * THUMBNAIL_VERSIONS Sheet Tab
 * Revision history for thumbnail designs.
 */
export interface ThumbnailVersion {
  id: string;
  thumbnailId: string;
  versionNumber: number;
  driveAssetUrl: string;
  designerNotes?: string;
  createdAt: string;
  // Drive binary metadata
  driveFileId?: string;
}

/**
 * Phase 18: AI Thumbnail Intelligence Models
 */
export interface AiThumbnailCuriosityFraming {
  curiosityAngle: string; // e.g. "Counter-intuitive logic trap"
  psychologicalTrigger: string; // e.g. "Ego challenge, urgency, mystery"
  hypothesis: string; // Conceptual engagement reasoning (no fake CTR claims)
}

export interface AiThumbnailVisualDirection {
  composition: string; // e.g. "Split screen with high contrast math statement"
  colorPalette: string[]; // High contrast palette e.g. ["#0B192C", "#FF6500", "#FFFFFF"]
  focalPoint: string; // Primary focal visual element
  emotionOrExpression: string; // Presenter facial cue / challenge pose
  brandingElements: string; // Signature Burra Pariksha branding placement
}

export interface AiThumbnailAudienceTargeting {
  primaryAudience: string; // e.g. "AP/TS Competitive Exam Aspirants"
  secondaryAudience: string; // e.g. "General Telugu Puzzle & Riddle Enthusiasts"
  languageStyle: 'TELUGU' | 'ENGLISH' | 'BILINGUAL';
  difficultyPerception: 'LOOKS_EASY_BUT_HARD' | 'CHALLENGE_FOR_GENIUSES' | 'FAST_TRICK';
}

export interface AiThumbnailConcept {
  id: string; // e.g. BP-TC-000001
  contentId: string; // Canonical Content ID (BP-CNT-######)
  questionId: string; // BP-Q-######
  scriptId?: string; // BP-S-######
  videoId?: string; // BP-V-######
  conceptName: string;
  hookHeadline: string; // Punchy mobile text (max 6-8 words)
  curiosityFraming: AiThumbnailCuriosityFraming;
  visualDirection: AiThumbnailVisualDirection;
  audienceTargeting: AiThumbnailAudienceTargeting;
  abVariant: 'A' | 'B' | 'C' | string;
  isAiGenerated: boolean;
  notes?: string;
  createdAt: string;
}

export interface ThumbnailCandidate {
  id: string; // e.g. BP-TC-000001
  contentId: string; // Canonical Content ID (BP-CNT-######)
  questionId: string; // BP-Q-######
  scriptId?: string; // BP-S-######
  videoId?: string; // BP-V-######
  conceptName: string;
  abVariant: string; // e.g. "A" or "B"
  hookHeadline: string;
  curiosityFraming: AiThumbnailCuriosityFraming;
  visualDirection: AiThumbnailVisualDirection;
  audienceTargeting: AiThumbnailAudienceTargeting;
  version: number;
  status: 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';
  assignedReviewerId?: string;
  approvedBy?: string;
  approvedVersion?: number;
  approvedAt?: string;
  rejectedReason?: string;
  isAiGenerated: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ThumbnailCandidateVersion {
  id: string; // e.g. BP-TCV-000001
  candidateId: string;
  versionNumber: number;
  contentSnapshot: Partial<ThumbnailCandidate>;
  editedBy: string;
  changeSummary?: string;
  createdAt: string;
}

export interface ThumbnailSafetyReport {
  isValid: boolean;
  leaksAnswer: boolean;
  isConcise: boolean;
  isRelevant: boolean;
  issues: string[];
  suggestions: string[];
}

export interface ThumbnailProductionHistory {
  contentId: string;
  questionId?: string;
  candidates: ThumbnailCandidate[];
  candidateVersions: ThumbnailCandidateVersion[];
  mediaAssets: MediaAsset[];
  approvedCandidate?: ThumbnailCandidate | null;
  activeThumbnailRecord?: Thumbnail | null;
}

/**
 * PINNED_COMMENTS Sheet Tab
 * Engagement and solution comments for social uploads.
 */
export interface PinnedComment {
  id: string; // e.g. PIN-204 or BP-PIN-000001
  contentId?: string; // Canonical correlation identity BP-CNT-######
  contentMasterId?: string; // Reference to ContentMaster.id (BP-CNT-****** or legacy BP-MST-******)
  videoId: string;
  commentText: string;
  solutionBreakdown: string;
  nextChallengeQuestion?: string;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * PINNED_COMMENT_VERSIONS Sheet Tab
 * Revisions for pinned comments.
 */
export interface PinnedCommentVersion {
  id: string;
  pinnedCommentId: string;
  versionNumber: number;
  commentText: string;
  createdAt: string;
}

export interface WorkflowActor {
  id: string;
  name: string;
  role?: string | UserRole;
  roles?: (string | UserRole)[];
}

/**
 * PHASE 19 — Pinned Comment & Conversation Intelligence
 */
export type PinnedCommentPackageStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';

export interface PinnedCommentPackage {
  id: string; // Separate technical ID: BP-PCP-######
  contentId: string; // Canonical correlation identity BP-CNT-######
  contentMasterId?: string; // Reference to ContentMaster.id
  questionId: string; // BP-Q-######
  scriptId?: string; // BP-S-######
  scriptVersion?: number; // Approved script version if applicable
  videoId?: string; // BP-V-######

  // The 4 core engagement package components:
  pinnedComment: string;
  answerDiscussionPrompt: string;
  followUpQuestions: string[];
  audienceParticipationPrompt: string;

  // Lifecycle and editorial status
  version: number;
  status: PinnedCommentPackageStatus;
  assignedReviewerId?: string;
  approvedBy?: string;
  approvedVersion?: number;
  approvedAt?: string;
  rejectedReason?: string;

  // AI and provenance metadata
  isAiGenerated: boolean;
  aiModelUsed?: string; // e.g. 'gemini-2.5-flash', 'deterministic-fallback', 'manual'
  notes?: string;

  createdAt: string;
  updatedAt: string;
}

export interface PinnedCommentPackageVersion {
  id: string; // e.g. BP-PCV-######-1
  packageId: string;
  versionNumber: number;
  contentSnapshot: Partial<PinnedCommentPackage>;
  editedBy: string;
  changeSummary?: string;
  createdAt: string;
}

export interface EngagementQualityReport {
  isValid: boolean;
  isMeaningful: boolean;
  hasBannedPlaceholders: boolean;
  leaksAnswer: boolean;
  encouragesDiscussion: boolean;
  encouragesParticipation: boolean;
  issues: string[];
  suggestions: string[];
}

export interface PinnedCommentPackageHistory {
  contentId: string;
  package: PinnedCommentPackage | null;
  versions: PinnedCommentPackageVersion[];
  approvedPackage?: PinnedCommentPackage | null;
  activePinnedCommentRecord?: PinnedComment | null;
}

/**
 * WORKFLOW Sheet Tab
 * Production state machine transitions log.
 */
export interface Workflow {
  id: string; // e.g. WF-901
  contentId?: string; // Canonical correlation identity BP-CNT-######
  contentMasterId?: string; // Reference to ContentMaster.id (BP-CNT-****** or legacy BP-MST-******)
  entityType: 'QUESTION' | 'VIDEO' | 'SCRIPT' | 'PUBLISHING';
  entityId: string;
  fromStatus: string;
  toStatus: string;
  triggeredBy: string;
  actorName?: string;
  remarks?: string;
  timestamp: string;
  // TODO: Formalize workflow lifecycle transitions in Phase 2
}

/**
 * ASSIGNMENTS Sheet Tab
 * Task assignments (filming, editing, scripting, thumbnail, planning, reviews).
 */
export interface Assignment {
  id: string; // e.g. BP-ASN-000001 or ASN-501
  contentId?: string; // Canonical correlation identity BP-CNT-######
  contentMasterId?: string; // Reference to ContentMaster.id (BP-CNT-****** or legacy BP-MST-******)
  entityType: AssignmentEntityType;
  entityId: string;
  videoId?: string; // Backwards compatibility for legacy records
  taskType: AssignmentTaskType | string;
  assignmentRole?: string;
  platform?: 'youtube' | 'instagram' | 'facebook';
  assigneeId: string;
  assigneeName: string;
  status: AssignmentStatus | string;
  priority: PriorityLevel;
  assignedAt?: string;
  dueDate?: string; // YYYY-MM-DD or ISO-8601
  dueAt?: string;   // ISO-8601
  completedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface UserWorkload {
  user: User;
  totalActiveAssignments: number;
  inProgressCount?: number;
  overdueCount?: number;
  completedCount?: number;
  urgentAssignments: number;
  highPriorityAssignments: number;
  normalPriorityAssignments: number;
  lowPriorityAssignments: number;
  overdueAssignments: number;
  dueTodayAssignments: number;
  dueTomorrowAssignments: number;
  blockedAssignments: number;
  completedAssignments: number;
  workloadScore: number;
  activeAssignments: Assignment[];
}

export interface TeamWorkloadSummary {
  users: UserWorkload[];
  workloads: UserWorkload[];
  totalMembers: number;
  totalActiveTasks: number;
  totalOverdueTasks: number;
  totalBlockedTasks: number;
  totalDueTodayTasks: number;
  highestWorkloadUser?: { id: string; name: string; score: number; taskCount: number };
  generatedAt: string;
}

export interface UnassignedWorkItem {
  id: string;
  entityType: AssignmentEntityType | string;
  entityId: string;
  title: string;
  currentStage: string;
  currentStatus?: string;
  priority: PriorityLevel;
  ageDays: number;
  recommendedRole: AssignmentTaskType | string;
  recommendedTaskType: AssignmentTaskType | string;
  reason?: string;
  createdAt: string;
  notes?: string;
}

export interface MyWorkSummary {
  user: User;
  overdue: Assignment[];
  dueToday: Assignment[];
  highPriority: Assignment[];
  inProgress: Assignment[];
  blocked: Assignment[];
  upcoming: Assignment[];
  recentlyCompleted: Assignment[];
  completedAssignments: Assignment[];
  activeAssignments?: Assignment[];
  activeCount?: number;
  overdueCount?: number;
  dueTodayCount?: number;
  completedRecentCount?: number;
  overdueAssignments?: Assignment[];
  dueTodayAssignments?: Assignment[];
  metrics: {
    totalActive: number;
    overdueCount: number;
    dueTodayCount: number;
    blockedCount: number;
    completedCount: number;
  };
}

export interface PlatformPublishInfo {
  status: SocialPublishStatus;
  videoUrl?: string;
  postUrl?: string;
  publishedAt?: string;
  scheduledAt?: string;
  notes?: string;
  lastFailureReason?: string;
  retryCount?: number;
  failedAt?: string;
}

/**
 * PUBLISHING Sheet Tab
 * Manual multi-platform upload tracking (YouTube, Instagram, Facebook).
 */
export interface Publishing {
  id: string; // e.g. PUB-204 or BP-PUB-000001
  contentId?: string; // Canonical correlation identity BP-CNT-######
  contentMasterId?: string; // Reference to ContentMaster.id (BP-CNT-****** or legacy BP-MST-******)
  videoId: string;
  videoTitle: string;
  questionId: string;
  finalVideoStatus: 'READY' | 'RENDERED' | 'VERIFIED';
  youtube: PlatformPublishInfo;
  instagram: PlatformPublishInfo;
  facebook: PlatformPublishInfo;
  youtubeScheduledAt?: string;
  instagramScheduledAt?: string;
  facebookScheduledAt?: string;
  youtubeLastFailureReason?: string;
  youtubeRetryCount?: number;
  youtubeFailedAt?: string;
  instagramLastFailureReason?: string;
  instagramRetryCount?: number;
  instagramFailedAt?: string;
  facebookLastFailureReason?: string;
  facebookRetryCount?: number;
  facebookFailedAt?: string;
  pinnedCommentReady: boolean;
  thumbnailReady: boolean;
  completedPlatformsCount: number;
  totalPlatformsCount: number;
  createdAt: string;
  updatedAt: string;
  // TODO: Verify manual publishing checklist format in Phase 7
}

export type PlatformType = 'youtube' | 'instagram' | 'facebook' | 'YOUTUBE' | 'INSTAGRAM' | 'FACEBOOK';

export const PlatformType = {
  YOUTUBE: 'YOUTUBE' as const,
  INSTAGRAM: 'INSTAGRAM' as const,
  FACEBOOK: 'FACEBOOK' as const,
};

/**
 * Phase 13.3: Read-only platform package projection derived from approved Social Review data.
 */
export interface PlatformPackageProjection {
  platform: PlatformType;
  videoId: string;
  videoTitle: string;
  questionId: string;
  contentMasterId?: string;
  title?: string;
  caption: string;
  hashtags: string[];
  tags?: string[];
  cta: string;
  pinnedComment: string;
  finalRenderAssetPath: string | null;
  isApprovedPackage: boolean;
  versionHash: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

/**
 * AUDIT_LOG Sheet Tab
 * Full administrative audit trail.
 */
export interface AuditLog {
  id: string; // e.g. LOG-8001
  actorId: string;
  actorName: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  timestamp: string;
  // TODO: Align logging schema with Google Sheets in Phase 2
}

// ============================================================================
// 3. UI HELPER & FILTER TYPES
// ============================================================================

export interface TabVerificationResult {
  tabName: string;
  exists: boolean;
  hasHeaders: boolean;
  actualHeaders: string[];
  missingHeaders: string[];
  duplicateHeaders: string[];
  status: 'VALID' | 'MISSING_TAB' | 'MISSING_HEADERS' | 'DUPLICATE_HEADERS';
  manualFixGuidance?: string;
}

export interface SpreadsheetHealthReport {
  isConfigured: boolean;
  isConnected: boolean;
  mode: 'LIVE_GOOGLE_SHEETS' | 'MOCK_DEVELOPMENT';
  spreadsheetId: string;
  spreadsheetTitle: string;
  totalTabsExpected: number;
  totalTabsFound: number;
  tabs: TabVerificationResult[];
  sequencesConfigured: boolean;
  missingSequences: string[];
  taxonomyIntegrity: {
    isValid: boolean;
    issues: string[];
  };
  overallStatus: 'READY' | 'WARNING' | 'ERROR';
  summaryMessage: string;
  diagnosticActionItems: string[];
}

// ============================================================================
// PHASE 8A: DATA INTEGRITY & OPERATIONAL INTELLIGENCE TYPES
// ============================================================================

export type IntegritySeverity = 'CRITICAL' | 'ERROR' | 'WARNING' | 'INFO';

export type IntegrityCategory =
  | 'ID_INTEGRITY'
  | 'QUESTION_INTEGRITY'
  | 'VIDEO_INTEGRITY'
  | 'SCRIPT_INTEGRITY'
  | 'THUMBNAIL_INTEGRITY'
  | 'PINNED_COMMENT_INTEGRITY'
  | 'PUBLISHING_INTEGRITY'
  | 'WORKFLOW_INTEGRITY'
  | 'AUDIT_LOG_INTEGRITY'
  | 'SEQUENCE_INTEGRITY'
  | 'SCHEMA_INTEGRITY'
  | 'ASSIGNMENT_INTEGRITY'
  | 'USER_INTEGRITY';

export interface IntegrityIssue {
  id: string;
  severity: IntegritySeverity;
  category: IntegrityCategory;
  entityType?: string;
  entityId?: string;
  worksheet: string;
  field?: string;
  message: string;
  recommendedAction: string;
}

export interface WorksheetHealthSummary {
  worksheet: string;
  totalRecords: number;
  validRecords: number;
  issuesCount: number;
  status: 'PASS' | 'WARNING' | 'ERROR';
}

export interface IntegrityCheckSummary {
  category: IntegrityCategory;
  name: string;
  description: string;
  status: 'PASS' | 'WARNING' | 'ERROR' | 'CRITICAL';
  totalChecked: number;
  passedCount: number;
  issueCount: number;
}

export interface SystemHealthReport {
  generatedAt: string;
  overallStatus: 'PASS' | 'WARNING' | 'ERROR' | 'CRITICAL';
  summary: string;
  worksheetHealth: WorksheetHealthSummary[];
  integrityChecks: IntegrityCheckSummary[];
  issueCounts: {
    critical: number;
    error: number;
    warning: number;
    info: number;
    total: number;
    passedChecks: number;
  };
  issues: IntegrityIssue[];
  isReadOnly: boolean;
  mode: 'LIVE_GOOGLE_SHEETS' | 'MOCK_DEVELOPMENT';
}

export interface QuestionFilterState {
  search: string;
  categoryId: string;
  topicId: string;
  difficulty: string;
  questionStatus: string;
  videoStatus: string;
}

export interface VideoFilterState {
  search: string;
  status: string;
  priority: string;
  assignedHost: string;
}

export interface DashboardMetrics {
  questions: {
    generated: number;
    editing: number;
    approved: number;
    rejected: number;
    total: number;
  };
  videos: {
    queued: number;
    scriptRequired: number;
    scriptReady: number;
    recording: number;
    recorded: number;
    editing: number;
    edited: number;
    finalReview: number;
    readyToUpload: number;
    uploaded: number;
    onHold: number;
    cancelled: number;
    totalActive: number;
  };
  publishing: {
    notStarted: number;
    ready: number;
    published: number;
    incomplete: number;
    total: number;
  };
  // Backward-compatible flat metrics
  questionsGenerated: number;
  questionsApproved: number;
  questionsQueued: number;
  videosInRecording: number;
  videosInEditing: number;
  finalReviewCount: number;
  readyToUploadCount: number;
  uploadedCount: number;
}

export interface TodaysWorkItem {
  id: string;
  entityType: 'QUESTION' | 'VIDEO';
  title: string;
  category: string;
  topic: string;
  currentStatus: string;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW' | 'NORMAL';
  ageDays: number;
  recommendedAction: string;
  actionUrl: string;
  reason: string;
}

export interface BottleneckStage {
  stage: string;
  label: string;
  count: number;
  isBottleneck: boolean;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  suggestion: string;
}

export interface StaleContentItem {
  id: string;
  entityType: 'QUESTION' | 'VIDEO';
  title: string;
  category: string;
  topic: string;
  currentStatus: string;
  daysInStage: number;
  statusCategory: 'FRESH' | 'WAITING' | 'STALE';
  lastUpdated: string;
  actionUrl: string;
}

export interface PublishingReadinessItem {
  videoId: string;
  title: string;
  category: string;
  topic: string;
  videoRenderReady: boolean;
  thumbnailApproved: boolean;
  pinnedCommentReady: boolean;
  publishingRecordExists: boolean;
  status: 'READY' | 'BLOCKED' | 'INCOMPLETE';
  missingItems: string[];
  platforms: {
    youtube: SocialPublishStatus;
    instagram: SocialPublishStatus;
    facebook: SocialPublishStatus;
  };
  actionUrl: string;
}

export interface GlobalSearchResult {
  id: string;
  type: 'QUESTION' | 'VIDEO' | 'SCRIPT' | 'THUMBNAIL' | 'PINNED_COMMENT' | 'ASSIGNMENT' | 'CONTENT_MASTER' | 'SOCIAL_REVIEW' | 'PUBLISHING';
  title: string;
  subtitle: string;
  category: string;
  topic: string;
  status: string;
  url: string;
}

export interface DashboardOverviewData {
  metrics: DashboardMetrics;
  todaysWork: TodaysWorkItem[];
  bottlenecks: BottleneckStage[];
  staleContent: StaleContentItem[];
  publishingReadiness: PublishingReadinessItem[];
  recentQuestions: Question[];
  recentVideos: Video[];
  recentAuditLogs: AuditLog[];
  teamOperations?: {
    totalActiveTasks: number;
    totalOverdueTasks: number;
    totalBlockedTasks: number;
    totalUnassignedTasks: number;
    unassignedWork: UnassignedWorkItem[];
    unassignedCount?: number;
    topWorkloadUser?: { name: string; score: number };
    workloadSummary?: TeamWorkloadSummary;
  };
}

// ============================================================================
// PHASE 9: CONTENT PLANNING, BATCH MANAGEMENT & QUESTION INTELLIGENCE
// ============================================================================

/**
 * CONTENT_PLANS Sheet Tab
 * Strategic content production target record.
 */
export interface ContentPlan {
  id: string; // e.g. BP-PLN-0001
  categoryId?: string; // Legacy/compatibility grouping; frozen production taxonomy is Topic -> Subtopic
  categoryName?: string;
  topicId: string;
  topicName: string;
  subtopicId: string;
  subtopicName: string;
  difficulty: DifficultyLevel;
  language: QuestionLanguage;
  targetQuestionCount: number;
  realWorldContext?: string;
  questionStyle?: QuestionStyle;
  priority: PriorityLevel;
  plannedDate: string; // YYYY-MM-DD
  status: ContentPlanStatus;
  notes?: string;
  currentQuestionCount?: number;
  remainingQuestionCount?: number;
  completionPercentage?: number;
  createdBatchesCount?: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * CONTENT_BATCHES Sheet Tab
 * Production batch record grouping questions for a targeted sprint.
 */
export interface ContentBatch {
  id: string; // e.g. BP-BCH-0001
  name: string;
  description?: string;
  planId: string; // Reference to ContentPlan.id
  targetCount: number;
  priority: PriorityLevel;
  plannedDate: string; // YYYY-MM-DD
  status: ContentBatchStatus;
  questionIds: string[]; // Explicit associated question IDs
  createdAt: string;
  updatedAt: string;
}

export interface BatchProgressMetrics {
  batchId: string;
  batchName: string;
  planId: string;
  status: ContentBatchStatus;
  targetCount: number;
  totalAssociated: number;
  generated: number;
  editing: number;
  approved: number;
  rejected: number;
  queued: number;
  inProduction: number;
  published: number;
  remainingToApprove: number;
  completionPercentage: number;
  isReadyForProduction: boolean;
}

export interface SubtopicCoverage {
  subtopicId: string;
  subtopicName: string;
  topicId: string;
  topicName: string;
  categoryId: string;
  categoryName: string;
  totalQuestions: number;
  byStatus: {
    draft: number;
    generated: number;
    editing: number;
    approved: number;
    rejected: number;
  };
  byDifficulty: {
    easy: number;
    medium: number;
    hard: number;
  };
  byLanguage: {
    english: number;
    telugu: number;
  };
  byProduction: {
    queued: number;
    inProduction: number;
    published: number;
  };
  isZeroCoverage: boolean;
  isLowCoverage: boolean;
}

export interface TopicCoverage {
  topicId: string;
  topicName: string;
  categoryId: string;
  categoryName: string;
  totalQuestions: number;
  subtopicsCount: number;
  activeSubtopicsCount: number;
  zeroSubtopicsCount: number;
  coveragePercentage: number;
  subtopics: SubtopicCoverage[];
}

export interface CategoryCoverage {
  categoryId: string;
  categoryName: string;
  colorCode?: string;
  totalQuestions: number;
  totalTopics: number;
  totalSubtopics: number;
  coveredSubtopics: number;
  coveragePercentage: number;
  topics: TopicCoverage[];
}

export interface CoverageOverviewData {
  totalQuestions: number;
  totalCategories: number;
  totalTopics: number;
  totalSubtopics: number;
  coveredSubtopicsCount: number;
  zeroCoverageSubtopicsCount: number;
  lowCoverageSubtopicsCount: number;
  overallTaxonomyCoveragePercentage: number;
  byDifficulty: {
    easy: number;
    medium: number;
    hard: number;
    easyPercentage: number;
    mediumPercentage: number;
    hardPercentage: number;
  };
  byLanguage: {
    english: number;
    telugu: number;
  };
  byStatus: {
    draft: number;
    generated: number;
    editing: number;
    approved: number;
    rejected: number;
  };
  categories: CategoryCoverage[];
}

export interface ContentGapAnalysis {
  zeroCoverageSubtopics: {
    subtopicId: string;
    subtopicName: string;
    topicName: string;
    categoryName: string;
  }[];
  lowCoverageSubtopics: {
    subtopicId: string;
    subtopicName: string;
    topicName: string;
    categoryName: string;
    currentCount: number;
  }[];
  difficultyGaps: {
    topicId: string;
    topicName: string;
    categoryName: string;
    missingDifficulties: DifficultyLevel[];
    recommendation: string;
  }[];
  languageGaps: {
    topicId: string;
    topicName: string;
    categoryName: string;
    missingLanguages: QuestionLanguage[];
    recommendation: string;
  }[];
  concentrationRisks: {
    topicId: string;
    topicName: string;
    categoryName: string;
    questionCount: number;
    percentageOfTotal: number;
    warning: string;
  }[];
}

export interface ContentDiversityWarning {
  type: 'SIMILARITY_CLUSTER' | 'STRUCTURAL_PATTERN' | 'SUBTOPIC_CONCENTRATION' | 'DIFFICULTY_SKEW' | 'STYLE_OVERUSE';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  description: string;
  affectedEntities: string[];
  recommendation: string;
}

export interface AiPlanRecommendationSubtopic {
  subtopicId: string;
  subtopicName: string;
  recommendedCount: number;
  difficultyBreakdown: {
    easy: number;
    medium: number;
    hard: number;
  };
  rationale: string;
  suggestedContexts: string[];
}

export interface AiPlanBatchSuggestion {
  batchName: string;
  targetCount: number;
  priority: PriorityLevel;
  rationale: string;
  subtopicIds: string[];
}

export interface AiContentPlanRecommendation {
  categoryId: string;
  categoryName: string;
  topicId?: string;
  topicName?: string;
  targetTotalCount: number;
  pedagogicalRationale: string;
  priorityFocusAreas: string[];
  recommendedDistribution: AiPlanRecommendationSubtopic[];
  suggestedBatchGrouping: AiPlanBatchSuggestion[];
  isAiGenerated: true;
  generatedAt: string;
}

// ----------------------------------------------------
// Task 3E.2.1: Unified Production Board Read Model
// ----------------------------------------------------
export interface ProductionBoardItem {
  videoId: string;
  questionId: string;
  title: string;
  questionText: string;
  category: string;
  topic: string;
  subtopic?: string;
  difficulty?: DifficultyLevel;
  videoStatus: VideoProductionStatus;
  assignee?: {
    id: string;
    name: string;
    email?: string;
    role?: string;
  };
  priority?: PriorityLevel;
  dueDate?: string;
  isOverdue?: boolean;
  scriptId?: string;
  scriptVersion?: number;
  thumbnailId?: string;
  thumbnailVersion?: number;
  thumbnailStatus?: 'PENDING' | 'DESIGNED' | 'APPROVED' | 'REJECTED';
  pinnedCommentId?: string;
  pinnedCommentApproval?: boolean;
  publishingId?: string;
  youtubeStatus?: SocialPublishStatus;
  instagramStatus?: SocialPublishStatus;
  facebookStatus?: SocialPublishStatus;
  completedPlatformsCount: number;
  totalPlatformsCount: number;
  publishingReadiness?: string;
  finalRenderWidth?: number;
  finalRenderHeight?: number;
  finalRenderFormat?: string;
  finalRenderAspectRatio?: string;
  actualDurationSeconds?: number;
  finalRenderPath?: string;
  finalRenderValidationStatus?: RenderValidationStatus;
  canonicalProductionReadiness?: CanonicalProductionReadiness;
}

// ============================================================================
// PHASE 8B: SOCIAL CONTENT DOMAIN & INVARIANCE CONTRACTS
// ============================================================================

export enum HookStyle {
  CURIOSITY = 'CURIOSITY',
  BRAIN_CHALLENGE = 'BRAIN_CHALLENGE',
  SPEED_CHALLENGE = 'SPEED_CHALLENGE',
  REAL_WORLD = 'REAL_WORLD',
  EXAM_CHALLENGE = 'EXAM_CHALLENGE',
}

export enum SocialPlatform {
  YOUTUBE_SHORTS = 'YOUTUBE_SHORTS',
  INSTAGRAM_REELS = 'INSTAGRAM_REELS',
  FACEBOOK_REELS = 'FACEBOOK_REELS',
}

export enum SocialEnhancementStatus {
  DRAFT = 'DRAFT',
  VALIDATED = 'VALIDATED',
  NEEDS_REVIEW = 'NEEDS_REVIEW',
  REJECTED = 'REJECTED',
}

export interface HookVariant {
  id: string;
  style: HookStyle;
  text: string;
  spokenTeluguText: string;
  onScreenOverlayText: string;
  estimatedDurationSeconds: number;
  invarianceCheckPassed?: boolean;
  answerLeakageDetected?: boolean;
  rationale?: string;
}

export interface PresentationStrategy {
  visualOpening: string;
  onScreenTitleOverlay: string;
  questionRevealTimingMs: number;
  optionRevealTimingMs: number;
  answerRevealTimingMs: number;
  explanationTimingMs: number;
  visualEmphasisNotes: string;
  diagramOrChartSuggestion?: string;
  pacingWpm: number;
}

export interface SocialCTA {
  callToActionText: string;
  spokenTeluguCta: string;
  commentChallengePrompt: string;
  sharePrompt: string;
}

export interface SocialCaption {
  title: string;
  description: string;
  hashtags: string[];
  pinnedCommentText: string;
}

export interface PlatformVariant {
  platform: SocialPlatform;
  maxDurationSeconds: number;
  formattedCaption: string;
  aspectRatio: '9:16' | '16:9' | '1:1';
  recommendedHashtags: string[];
}

export interface SocialInvarianceAnchor {
  type: 'NUMERIC' | 'PERCENTAGE' | 'CURRENCY' | 'UNIT' | 'OPTION_IDENTITY' | 'CORRECT_ANSWER' | 'DIRECTION_KEYWORD' | 'ORDERING_CONSTRAINT';
  originalValue: string;
  enhancedValue?: string;
  status: 'PRESERVED' | 'MUTATED' | 'MISSING';
  details?: string;
}

export interface SocialInvarianceViolation {
  anchorType: string;
  severity: 'CRITICAL' | 'WARNING';
  message: string;
  originalFragment: string;
  mutatedFragment: string;
}

export interface SocialInvarianceReport {
  status: 'VALID' | 'INVALID' | 'NEEDS_REVIEW';
  isValid: boolean;
  sourceQuestionValidationStatus: QuestionValidationStatus;
  preservedAnchorsCount: number;
  mutatedAnchorsCount: number;
  violations: SocialInvarianceViolation[];
  warnings: string[];
  anchors: SocialInvarianceAnchor[];
  checkedAt: string;
}

export enum TeleprompterSegmentSection {
  HOOK = 'HOOK',
  HOOK_TRANSITION = 'HOOK_TRANSITION',
  QUESTION = 'QUESTION',
  OPTIONS = 'OPTIONS',
  PAUSE_CHALLENGE = 'PAUSE_CHALLENGE',
  SOLUTION = 'SOLUTION',
  SPEED_TRICK = 'SPEED_TRICK',
  CTA = 'CTA',
}

export interface TeleprompterSegment {
  id: string;
  section: TeleprompterSegmentSection;
  spokenText: string;
  teleprompterText: string;
  estimatedDurationSeconds: number;
  pauseDurationSeconds?: number;
  pauseAfterMs?: number;
  emphasisWords?: string[];
  visualCardPrompt?: string;
  onScreenText?: string;
  onScreenOverlay?: string;
}

export interface SpokenTeleprompterScriptPayload {
  id: string;
  questionId: string;
  selectedHookStyle: HookStyle;
  selectedHookText: string;
  language: QuestionLanguage;
  totalEstimatedDurationSeconds: number;
  pacingWpm: number;
  segments: TeleprompterSegment[];
  invarianceReport?: SocialInvarianceReport;
  invarianceCheckPassed: boolean;
  answerLeakageDetected: boolean;
  status: SocialEnhancementStatus;
  generatedAt: string;
}

export interface SocialMetadataPayload {
  id: string;
  questionId: string;
  language: QuestionLanguage;
  shortTitle: string;
  socialCaption: string;
  extendedDescription: string;
  hashtags: string[];
  keywords: string[];
  topicLabel: string;
  subtopicLabel: string;
  difficultyLabel: string;
  challengeTypeLabel: string;
  cta: {
    primaryText: string;
    pinnedCommentPrompt: string;
  };
  invarianceReport?: SocialInvarianceReport;
  invarianceCheckPassed: boolean;
  answerLeakageDetected: boolean;
  status: SocialEnhancementStatus;
  generatedAt: string;
}

export interface SocialEnhancementPayload {
  id: string;
  questionId: string;
  videoId?: string;
  contentMasterId?: string;
  language: QuestionLanguage;
  status: SocialEnhancementStatus;
  selectedHookStyle: HookStyle;
  hooks: HookVariant[];
  presentationStrategy: PresentationStrategy;
  cta: SocialCTA;
  caption: SocialCaption;
  platformVariants: PlatformVariant[];
  teleprompterScript?: SpokenTeleprompterScriptPayload;
  metadata?: SocialMetadataPayload;
  invarianceReport?: SocialInvarianceReport;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// PHASE 8F: MULTI-PLATFORM ADAPTATION ENGINE CONTRACTS
// ============================================================================

export interface PlatformConfig {
  platform: SocialPlatform;
  displayName: string;
  supportsStandaloneTitle: boolean;
  maxTitleLength?: number;
  maxCaptionLength: number;
  maxDescriptionLength?: number;
  maxHashtagsCount: number;
  supportsPinnedComment: boolean;
  ctaFormat: 'DESCRIPTION_AND_PINNED_COMMENT' | 'INLINE_CAPTION_AND_COMMENT' | 'INLINE_CAPTION';
}

export const PLATFORM_ADAPTATION_CONFIG: Record<SocialPlatform, PlatformConfig> = {
  [SocialPlatform.YOUTUBE_SHORTS]: {
    platform: SocialPlatform.YOUTUBE_SHORTS,
    displayName: 'YouTube Shorts',
    supportsStandaloneTitle: true,
    maxTitleLength: 100,
    maxCaptionLength: 1000,
    maxDescriptionLength: 5000,
    maxHashtagsCount: 5,
    supportsPinnedComment: true,
    ctaFormat: 'DESCRIPTION_AND_PINNED_COMMENT',
  },
  [SocialPlatform.INSTAGRAM_REELS]: {
    platform: SocialPlatform.INSTAGRAM_REELS,
    displayName: 'Instagram Reels',
    supportsStandaloneTitle: false,
    maxCaptionLength: 2200,
    maxHashtagsCount: 8,
    supportsPinnedComment: true,
    ctaFormat: 'INLINE_CAPTION_AND_COMMENT',
  },
  [SocialPlatform.FACEBOOK_REELS]: {
    platform: SocialPlatform.FACEBOOK_REELS,
    displayName: 'Facebook Reels',
    supportsStandaloneTitle: false,
    maxCaptionLength: 2000,
    maxHashtagsCount: 5,
    supportsPinnedComment: false,
    ctaFormat: 'INLINE_CAPTION',
  },
};

export interface AdaptedPlatformPackage {
  platform: SocialPlatform;
  title?: string;
  caption: string;
  description?: string;
  hashtags: string[];
  keywords: string[];
  cta: {
    primaryText: string;
    pinnedCommentPrompt?: string;
  };
  characterCounts: {
    titleLength?: number;
    captionLength: number;
    descriptionLength?: number;
  };
  invarianceReport?: SocialInvarianceReport;
  invarianceCheckPassed: boolean;
  answerLeakageDetected: boolean;
  validationStatus: SocialEnhancementStatus;
  generatedAt: string;
}

export interface MultiPlatformAdaptationPayload {
  id: string;
  questionId: string;
  canonicalMetadataId: string;
  language: QuestionLanguage;
  variants: Record<SocialPlatform, AdaptedPlatformPackage>;
  isAllValid: boolean;
  aiCallsCount: number;
  status: SocialEnhancementStatus;
  generatedAt: string;
}

// ============================================================================
// PHASE 8G: SOCIAL CONTENT QUALITY / ENGAGEMENT INTELLIGENCE CONTRACTS
// ============================================================================

export enum SocialQualityDimension {
  CLARITY = 'CLARITY',
  CURIOSITY = 'CURIOSITY',
  CHALLENGE_QUALITY = 'CHALLENGE_QUALITY',
  COMMENTABILITY = 'COMMENTABILITY',
  RETENTION_POTENTIAL = 'RETENTION_POTENTIAL',
  REAL_LIFE_RELEVANCE = 'REAL_LIFE_RELEVANCE',
  SOCIAL_PRESENTATION = 'SOCIAL_PRESENTATION',
  LANGUAGE_QUALITY = 'LANGUAGE_QUALITY',
  ANSWER_INTEGRITY = 'ANSWER_INTEGRITY',
  AUDIENCE_SUITABILITY = 'AUDIENCE_SUITABILITY',
  REPETITION_RISK = 'REPETITION_RISK',
  AUDIENCE_APPEAL = 'AUDIENCE_APPEAL',
}

export enum SocialQualityStatus {
  EXCELLENT = 'EXCELLENT',
  GOOD = 'GOOD',
  NEEDS_IMPROVEMENT = 'NEEDS_IMPROVEMENT',
  REJECTED = 'REJECTED',
}

export enum SocialQualityFindingSeverity {
  BLOCKING = 'BLOCKING',
  ADVISORY = 'ADVISORY',
}

export interface SocialQualityFinding {
  id: string;
  dimension: SocialQualityDimension;
  severity: SocialQualityFindingSeverity;
  code: string;
  message: string;
  context?: string;
  suggestedFix?: string;
}

export type SocialQualityAssessmentMethod = 
  | 'DETERMINISTIC_ONLY' 
  | 'AI_HYBRID' 
  | 'DETERMINISTIC_FALLBACK';

export interface SocialQualityAssessmentPayload {
  id: string;
  questionId: string;
  overallScore: number;
  status: SocialQualityStatus;
  dimensionScores: Record<SocialQualityDimension, number>;
  blockingFindings: SocialQualityFinding[];
  advisoryFindings: SocialQualityFinding[];
  recommendations: string[];
  confidence: number;
  assessmentMethod: SocialQualityAssessmentMethod;
  aiCallsCount: number;
  invarianceReport?: SocialInvarianceReport;
  generatedAt: string;
}

// ============================================================================
// PHASE 8H: SOCIAL CONTENT REVIEW & HUMAN APPROVAL CONTRACTS
// ============================================================================

export enum SocialReviewStatus {
  PENDING_REVIEW = 'PENDING_REVIEW',
  APPROVED = 'APPROVED',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
  REJECTED = 'REJECTED',
  STALE_REVISION_REQUIRED = 'STALE_REVISION_REQUIRED',
}

export interface SocialReviewRecord {
  id: string;
  questionId: string;
  contentId?: string;
  contentMasterId?: string;
  reviewedVersionHash: string;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: UserRole | string;
  decision: SocialReviewStatus;
  previousStatus?: SocialReviewStatus;
  reason?: string;
  feedbackCategories?: string[];
  overallQualityScoreAtReview: number;
  qualityStatusAtReview: SocialQualityStatus;
  isAdminOverride?: boolean;
  reviewedAt: string;
}

export interface SocialReviewPackageBundle {
  question: Question;
  contentMaster?: any;
  validationStatus: QuestionValidationStatus;
  hook?: HookVariant;
  teleprompterScript?: SpokenTeleprompterScriptPayload;
  canonicalMetadata?: SocialMetadataPayload;
  multiPlatformAdaptations?: MultiPlatformAdaptationPayload;
  qualityAssessment?: SocialQualityAssessmentPayload;
  currentReviewStatus: SocialReviewStatus;
  currentVersionHash: string;
  isPublishingReady: boolean;
  blockers: string[];
  reviewHistory: SocialReviewRecord[];
  latestReviewRecord?: SocialReviewRecord;
}

export interface SubmitSocialReviewInput {
  versionHash: string;
  reason?: string;
  feedbackCategories?: string[];
}

// ============================================================================
// PHASE 27: SOCIAL ANALYTICS DATA LAYER CONTRACTS
// ============================================================================

export interface SocialAnalyticsRecord {
  id: string; // e.g. BP-ANL-000001
  contentId: string; // Canonical BP-CNT-######
  videoId?: string; // BP-V-######
  publishingId?: string; // PUB-######
  platformPostId?: string;
  platform: 'youtube' | 'instagram' | 'facebook' | string;
  postingTimestamp?: string;
  views: number;
  watchTime: number; // in seconds
  retentionRate: number; // percentage (e.g., 68.5)
  likes: number;
  comments: number;
  shares: number;
  subscribersGained: number;
  ctr: number; // percentage (e.g., 5.2)
  capturedAt: string; // ISO timestamp when metric snapshot was taken
  topicId?: string;
  subtopicId?: string;
  difficulty?: string;
  challengeType?: string;
  language?: string;
  presentationType?: string;
  notes?: string;
}

export interface CreateSocialAnalyticsInput {
  contentId: string;
  videoId?: string;
  publishingId?: string;
  platformPostId?: string;
  platform: 'youtube' | 'instagram' | 'facebook' | string;
  postingTimestamp?: string;
  views?: number;
  watchTime?: number;
  retentionRate?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  subscribersGained?: number;
  ctr?: number;
  capturedAt?: string;
  topicId?: string;
  subtopicId?: string;
  difficulty?: string;
  challengeType?: string;
  language?: string;
  presentationType?: string;
  notes?: string;
}

export interface ImportSocialAnalyticsInput {
  records: CreateSocialAnalyticsInput[];
}

export interface SocialAnalyticsQueryFilters {
  contentId?: string;
  videoId?: string;
  publishingId?: string;
  platformPostId?: string;
  platform?: string;
  startDate?: string;
  endDate?: string;
  topicId?: string;
  subtopicId?: string;
}

export interface SocialAnalyticsSummary {
  totalRecords: number;
  totalViews: number;
  totalWatchTime: number;
  averageRetentionRate: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalSubscribersGained: number;
  averageCtr: number;
  platformBreakdown: Record<string, {
    views: number;
    watchTime: number;
    likes: number;
    comments: number;
    shares: number;
    count: number;
  }>;
}

/**
 * PHASE 28: AI Social Performance Intelligence Types
 */

export interface DimensionMetricAggregate {
  dimension: string;
  value: string;
  sampleSize: number;
  avgViews: number;
  avgWatchTime: number;
  avgRetentionRate: number;
  avgLikes: number;
  avgComments: number;
  avgShares: number;
  avgSubscribersGained: number;
  avgCtr: number;
  insufficientData: boolean;
}

export interface PostingTimeMetricAggregate {
  timeWindow: string; // e.g. "18:00 - 21:00 UTC" or "SUNDAY 18:00 - 21:00 UTC"
  dayOfWeek?: string; // e.g. "SUNDAY", "MONDAY"
  hourOfDay?: number; // 0-23
  platform: string; // e.g. "youtube_shorts", "ALL"
  sampleSize: number;
  avgViews: number;
  avgWatchTime: number;
  avgRetentionRate: number;
  avgLikes: number;
  avgComments: number;
  avgShares: number;
  avgSubscribersGained: number;
  avgCtr: number;
  insufficientData: boolean;
}

export interface PostingTimeRecommendation {
  recommendedWindow: string; // e.g., "18:00 - 21:00 UTC" or "SUNDAY 18:00 - 21:00 UTC"
  platform: string; // e.g., "youtube_shorts"
  sampleSize: number;
  supportingEvidence: string;
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  dayOfWeek?: string;
  bestHourWindow?: string;
}

export interface SocialPerformanceIntelligenceRecord {
  id: string; // BP-SPI-######
  analyzedAt: string; // ISO string
  actorId: string;
  actorName: string;
  recordCount: number;
  dataSnapshotFilters?: SocialAnalyticsQueryFilters;
  deterministicSummary: SocialAnalyticsSummary;
  dimensionBreakdown: {
    byPlatform: DimensionMetricAggregate[];
    byTopic: DimensionMetricAggregate[];
    bySubtopic: DimensionMetricAggregate[];
    byDifficulty: DimensionMetricAggregate[];
    byChallengeType: DimensionMetricAggregate[];
    byLanguage: DimensionMetricAggregate[];
    byPresentationType: DimensionMetricAggregate[];
    postingTimeAnalysis?: {
      byHourOfDay: PostingTimeMetricAggregate[];
      byDayOfWeek: PostingTimeMetricAggregate[];
      byPlatformTimeWindow: PostingTimeMetricAggregate[];
    };
  };
  aiInsights: {
    overallVerdict: string;
    topPerformingDimensions: {
      dimension: string;
      value: string;
      sampleSize: number;
      avgViews: number;
      avgRetention: number;
      avgCtr: number;
      reason: string;
    }[];
    underperformingDimensions: {
      dimension: string;
      value: string;
      sampleSize: number;
      avgViews: number;
      avgRetention: number;
      avgCtr: number;
      reason: string;
    }[];
    platformSpecificRecommendations: {
      platform: string;
      sampleSize: number;
      keyTakeaways: string[];
      recommendedActions: string[];
    }[];
    contentStrategyRecommendations: {
      area: string;
      recommendation: string;
      supportingEvidence: string;
      sampleSize: number;
      confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
    }[];
    postingTimeRecommendations?: PostingTimeRecommendation[];
    dataConfidenceNotes: string[];
  };
  isFallbackMode: boolean;
  modelUsed: string;
  provenance?: AIProvenance;
  evidenceTraceability: {
    recordIdsUsed: string[];
    totalSamples: number;
    insufficientDataFlag: boolean;
    insufficientDimensions: string[];
  };
}

export interface GeneratePerformanceIntelligenceInput {
  contentId?: string;
  platform?: string;
  startDate?: string;
  endDate?: string;
  topicId?: string;
  subtopicId?: string;
  forceFallback?: boolean;
}


/**
 * PHASE 29A & 29B: Controlled AI Strategy & Posting-Time Integration into Question Studio Types
 */

export interface QuestionStudioStrategyRecommendation {
  id: string; // e.g. REC-SPI-000001-01
  reportId: string; // BP-SPI-######
  type: 'TOPIC_OPPORTUNITY' | 'SUBTOPIC_OPPORTUNITY' | 'DIFFICULTY_ADJUSTMENT' | 'CHALLENGE_TYPE_RECOMMENDATION' | 'FORMAT_OPTIMIZATION' | 'POSTING_TIME_OPTIMIZATION';
  title: string;
  description: string;
  suggestedParameters: {
    topicId?: string;
    subtopicId?: string;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    challengeType?: string;
    presentationType?: string;
    targetPlatform?: string;
    suggestedFormat?: string;
    recommendedPostingWindow?: string;
  };
  supportingEvidence: string;
  sampleSize: number;
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  isValidTaxonomy: boolean;
  taxonomyValidationMessage?: string;
}

export interface ApplyStrategyRecommendationInput {
  reportId: string;
  recommendationId: string;
  customOverrides?: {
    topicId?: string;
    subtopicId?: string;
    difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
    challengeType?: string;
  };
}

export interface ApplyStrategyRecommendationResult {
  success: boolean;
  appliedParameters?: QuestionStudioStrategyRecommendation['suggestedParameters'];
  recommendation?: QuestionStudioStrategyRecommendation;
  auditLogged: boolean;
  error?: string;
}

// ============================================================================
// PHASE 17: REAL VIDEO PRODUCTION WORKFLOW TYPES
// ============================================================================

export type VideoProductionWorkflowState = 'RAW' | 'EDITING' | 'EDITED' | 'FINAL';

export interface InitializeRawVideoInput {
  scriptId: string;
  expectedContentId?: string;
  rawBinaryBuffer: Buffer;
  fileName: string;
  mimeType: string;
}

export interface TransitionToEditingInput {
  videoId: string;
  expectedContentId?: string;
  assignedEditorId?: string;
}

export interface UploadEditedVideoInput {
  videoId: string;
  expectedContentId?: string;
  editedBinaryBuffer: Buffer;
  fileName: string;
  mimeType: string;
  advanceStatus?: boolean;
}

export interface ApproveFinalVideoInput {
  videoId: string;
  expectedContentId?: string;
  finalBinaryBuffer?: Buffer;
  fileName?: string;
  mimeType?: string;
}

export interface Phase17VideoWorkflowStateResult {
  video: Video;
  currentWorkflowState: VideoProductionWorkflowState;
  latestMediaAsset?: MediaAsset;
  scriptId: string;
  questionId: string;
  contentId: string;
}

// ============================================================================
// PHASE 20: SOCIAL REVIEW & QUALITY GATE TYPES
// ============================================================================

export type Phase20SocialReviewStatus = 'DRAFT' | 'IN_REVIEW' | 'PASS' | 'CHANGES_REQUIRED' | 'REJECTED';
export type Phase20ReviewDecision = 'PASS' | 'CHANGES_REQUIRED' | 'REJECTED';

export interface Phase20PackageArtifactHashes {
  questionHash: string;
  scriptHash: string;
  videoHash: string;
  thumbnailHash: string;
  pinnedCommentHash: string;
  metadataHash: string;
  packageOverallHash: string;
}

export interface Phase20PackageVersionLock {
  contentId: string;
  questionId: string;
  questionVersion: number;
  scriptId: string;
  scriptVersion: number;
  videoId: string;
  videoVersion: number;
  thumbnailId: string;
  thumbnailVersion: number;
  pinnedCommentPackageId: string;
  pinnedCommentVersion: number;
  hashes: Phase20PackageArtifactHashes;
}

export interface Phase20CompleteContentPackage {
  contentId: string;
  contentMaster: ContentMaster;
  question: Question;
  questionVersion: number;
  script: Script;
  scriptVersionNumber: number;
  video: Video;
  videoVersionNumber: number;
  videoAsset?: MediaAsset;
  thumbnail?: Thumbnail | ThumbnailCandidate;
  thumbnailVersionNumber: number;
  thumbnailAsset?: MediaAsset;
  pinnedCommentPackage?: PinnedCommentPackage;
  pinnedCommentVersionNumber: number;
  metadata: SocialMetadataPayload | Record<string, any>;
  platformAdaptations?: MultiPlatformAdaptationPayload;
  versionLock: Phase20PackageVersionLock;
}

export interface Phase20SocialReviewRecord {
  id: string;
  contentId: string;
  status: Phase20SocialReviewStatus;
  assignedReviewerId?: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedByRole?: string;
  reviewedAt?: string;
  decision?: Phase20ReviewDecision;
  decisionReason?: string;
  feedbackCategories?: string[];
  versionLock: Phase20PackageVersionLock;
  validationSummary: {
    isValid: boolean;
    issues: string[];
    warnings: string[];
    checksPassed: string[];
  };
  aiRecommendation?: {
    recommendedDecision: Phase20ReviewDecision;
    confidence: number;
    rationale: string;
    flaggedIssues: string[];
    isAiGenerated: boolean;
    modelUsed: string;
  };
  isInvalidated: boolean;
  invalidatedReason?: string;
  invalidatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Phase20ProductionReadinessResult {
  isProductionReady: boolean;
  contentId: string;
  reviewRecord?: Phase20SocialReviewRecord;
  issues: string[];
  hashesMatch: boolean;
}

export interface Phase20SocialQualityGateReport {
  isValid: boolean;
  contentId: string;
  issues: string[];
  warnings: string[];
  checksPassed: string[];
  invarianceValid: boolean;
  brandQualityValid: boolean;
  assetsValid: boolean;
  metadataValid: boolean;
  versionLockValid: boolean;
}

// ============================================================================
// PHASE 21: MULTI-PLATFORM CONTENT ADAPTATION TYPES
// ============================================================================

export enum PlatformAdaptationStatus {
  DRAFT = 'DRAFT',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  READY_TO_PUBLISH = 'READY_TO_PUBLISH',
  CHANGES_REQUIRED = 'CHANGES_REQUIRED',
  REJECTED = 'REJECTED',
}

export type AdaptationGenerationSource = 'MANUAL' | 'AI_GENERATED' | 'AI_ASSISTED' | 'DETERMINISTIC_FALLBACK';

export interface PlatformThumbnailConsideration {
  aspectRatioRecommendation?: string; // e.g. '9:16', '1:1', '16:9'
  safeZoneNotes?: string;
  cropNotes?: string;
  reelCoverNotes?: string;
  hookTextRecommendation?: string;
  approvedThumbnailRef?: {
    thumbnailId: string;
    version: number;
    driveFileId?: string;
  };
}

export interface PlatformSpecificWording {
  shortsOrReelsNote?: string;
  toneStyle?: string;
  audienceHookStyle?: string;
  platformSpecificKeywords?: string[];
  additionalPlatformNotes?: string;
}

export interface PlatformAdaptationVersion {
  versionNumber: number;
  adaptationId: string;
  contentId: string;
  platform: PlatformType;
  title: string;
  description: string;
  caption: string;
  hashtags: string[];
  callToAction: string;
  platformSpecificWording: PlatformSpecificWording;
  thumbnailConsiderations: PlatformThumbnailConsideration;
  status: PlatformAdaptationStatus;
  canonicalSourceVersionLock: {
    contentId: string;
    questionId: string;
    questionVersion: number;
    scriptId: string;
    scriptVersion: number;
    videoId: string;
    videoVersion: number;
    thumbnailId: string;
    thumbnailVersion: number;
    pinnedCommentPackageId: string;
    pinnedCommentVersion: number;
    packageOverallHash: string;
  };
  generationSource: AdaptationGenerationSource;
  aiProvenance?: {
    modelUsed?: string;
    isAiGenerated: boolean;
    confidence?: number;
    generatedAt: string;
    recommendationSnapshot?: Record<string, any>;
  };
  createdBy: string;
  createdByName?: string;
  createdByRole?: string;
  createdAt: string;
  approvalRecord?: {
    approvedBy: string;
    approvedByName: string;
    approvedByRole: string;
    approvedAt: string;
    reason?: string;
  };
  rejectionRecord?: {
    rejectedBy: string;
    rejectedByName: string;
    rejectedByRole: string;
    rejectedAt: string;
    reason: string;
  };
  changesRequiredRecord?: {
    requestedBy: string;
    requestedByName: string;
    requestedByRole: string;
    requestedAt: string;
    reason: string;
  };
}

export interface PlatformAdaptationRecord {
  id: string; // e.g. BP-ADP-000001
  contentId: string; // Canonical BP-CNT-######
  platform: PlatformType;
  title: string;
  description: string;
  caption: string;
  hashtags: string[];
  callToAction: string;
  platformSpecificWording: PlatformSpecificWording;
  thumbnailConsiderations: PlatformThumbnailConsideration;
  status: PlatformAdaptationStatus;
  currentVersion: number;
  canonicalSourceVersionLock: {
    contentId: string;
    questionId: string;
    questionVersion: number;
    scriptId: string;
    scriptVersion: number;
    videoId: string;
    videoVersion: number;
    thumbnailId: string;
    thumbnailVersion: number;
    pinnedCommentPackageId: string;
    pinnedCommentVersion: number;
    packageOverallHash: string;
  };
  generationSource: AdaptationGenerationSource;
  aiProvenance?: {
    modelUsed?: string;
    isAiGenerated: boolean;
    confidence?: number;
    generatedAt: string;
    recommendationSnapshot?: Record<string, any>;
  };
  createdBy: string;
  createdByName?: string;
  createdByRole?: string;
  createdAt: string;
  updatedAt: string;
  approvalRecord?: {
    approvedBy: string;
    approvedByName: string;
    approvedByRole: string;
    approvedAt: string;
    reason?: string;
  };
  rejectionRecord?: {
    rejectedBy: string;
    rejectedByName: string;
    rejectedByRole: string;
    rejectedAt: string;
    reason: string;
  };
  changesRequiredRecord?: {
    requestedBy: string;
    requestedByName: string;
    requestedByRole: string;
    requestedAt: string;
    reason: string;
  };
  isStaleSource?: boolean;
  staleReason?: string;
}

export interface PlatformAdaptationAuditEntry {
  id: string;
  adaptationId: string;
  contentId: string;
  platform: PlatformType;
  action: 'CREATE' | 'UPDATE' | 'SUBMIT_REVIEW' | 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES' | 'STALE_DETECTED' | 'INVALIDATE_APPROVAL';
  actorId: string;
  actorName: string;
  actorRole: string;
  fromVersion?: number;
  toVersion?: number;
  fromStatus?: PlatformAdaptationStatus;
  toStatus?: PlatformAdaptationStatus;
  reason?: string;
  timestamp: string;
}

export interface PlatformAdaptationSearchFilters {
  contentId?: string;
  platform?: PlatformType | string;
  status?: PlatformAdaptationStatus | string;
  version?: number;
  createdBy?: string;
  updatedAfter?: string;
  updatedBefore?: string;
}

export interface CreatePlatformAdaptationInput {
  contentId: string;
  platform: PlatformType | string;
  title?: string;
  description?: string;
  caption?: string;
  hashtags?: string[];
  callToAction?: string;
  platformSpecificWording?: PlatformSpecificWording;
  thumbnailConsiderations?: PlatformThumbnailConsideration;
  generationSource?: AdaptationGenerationSource;
}

export interface UpdatePlatformAdaptationInput {
  title?: string;
  description?: string;
  caption?: string;
  hashtags?: string[];
  callToAction?: string;
  platformSpecificWording?: PlatformSpecificWording;
  thumbnailConsiderations?: PlatformThumbnailConsideration;
  status?: PlatformAdaptationStatus;
}

export interface AiAdaptationRecommendation {
  platform: PlatformType;
  titleVariations: string[];
  captionVariations: string[];
  description: string;
  hashtags: string[];
  callToActionVariations: string[];
  platformSpecificWording: PlatformSpecificWording;
  thumbnailConsiderations: PlatformThumbnailConsideration;
  confidence: number;
  rationale: string;
  generationSource: AdaptationGenerationSource;
  modelUsed?: string;
}

/**
 * PHASE 22: PUBLISHING HUB TYPES & INTERFACES
 */

export type Phase22PublishingStatus =
  | 'NOT_READY'
  | 'READY_TO_PUBLISH'
  | 'PUBLISHING'
  | 'PUBLISHED'
  | 'FAILED'
  | 'MANUALLY_PUBLISHED'
  | 'PUBLISHED_CONFIRMED';

export type PublishingBlockerCode =
  | 'INVALID_CONTENT_ID_FORMAT'
  | 'CANONICAL_CONTENT_NOT_FOUND'
  | 'SOCIAL_REVIEW_NOT_APPROVED'
  | 'PLATFORM_ADAPTATION_MISSING'
  | 'PLATFORM_ADAPTATION_NOT_APPROVED'
  | 'PLATFORM_ADAPTATION_STALE'
  | 'CANONICAL_HASH_MISMATCH'
  | 'FINAL_VIDEO_MISSING'
  | 'FINAL_VIDEO_NOT_ACCESSIBLE'
  | 'THUMBNAIL_MISSING'
  | 'THUMBNAIL_NOT_APPROVED'
  | 'THUMBNAIL_NOT_ACCESSIBLE'
  | 'REQUIRED_TITLE_MISSING'
  | 'REQUIRED_DESCRIPTION_MISSING'
  | 'REQUIRED_HASHTAGS_MISSING'
  | 'REQUIRED_CTA_MISSING'
  | 'PINNED_COMMENT_NOT_APPROVED'
  | 'CAPTIONS_MISSING'
  | 'STALE_ADAPTATION_VERSION'
  | 'INVALID_METADATA'
  | 'UNRESOLVED_PRODUCTION_BLOCKER';

export interface PublishingReadinessEvaluation {
  contentId: string;
  platform: PlatformType;
  isReadyToPublish: boolean;
  blockers: PublishingBlockerCode[];
  evaluatedAt: string;
  checks: {
    canonicalContentExists: boolean;
    socialReviewApproved: boolean;
    platformAdaptationApproved: boolean;
    adaptationNotStale: boolean;
    canonicalHashMatches: boolean;
    finalVideoValidAndAccessible: boolean;
    thumbnailValidAndAccessible: boolean;
    requiredTitlePresent: boolean;
    requiredDescriptionPresent: boolean;
    requiredHashtagsPresent: boolean;
    requiredCtaPresent: boolean;
    pinnedCommentApprovedIfSupported: boolean;
    captionsAvailable: boolean;
    noUnresolvedProductionBlockers: boolean;
  };
}

export interface PublisherPackage {
  contentId: string;
  platform: PlatformType;
  readiness: {
    isReadyToPublish: boolean;
    blockers: PublishingBlockerCode[];
    evaluatedAt: string;
  };
  assets: {
    finalVideo: {
      videoId: string;
      productionStatus: VideoProductionStatus;
      finalRenderPath: string | null;
      driveFileId?: string;
      width?: number;
      height?: number;
      durationSeconds?: number;
      isAccessible: boolean;
    } | null;
    thumbnail: {
      thumbnailId: string;
      version: number;
      driveFileId?: string;
      candidateId?: string;
      aspectRatio?: string;
      isAccessible: boolean;
    } | null;
  };
  text: {
    title: string;
    description: string;
    caption: string;
    hashtags: string[];
    callToAction: string;
    pinnedComment: string | null;
    captions: string | null;
  };
  source: {
    adaptationId: string;
    adaptationVersion: number;
    canonicalSourceHash: string;
    adaptationHash: string;
    questionId: string;
    scriptId: string;
    scriptVersion: number;
    videoId: string;
    videoVersion: number;
    thumbnailId: string;
    thumbnailVersion: number;
    pinnedCommentPackageId?: string;
    pinnedCommentVersion?: number;
  };
  status: {
    adaptationStatus: PlatformAdaptationStatus;
    socialReviewStatus: SocialReviewStatus;
    publishingReadiness: 'READY_TO_PUBLISH' | 'NOT_READY';
    publishingStatus: Phase22PublishingStatus;
  };
}

export interface Phase22PublishingRecord {
  id: string; // e.g. BP-PUB-000001
  contentId: string;
  platform: PlatformType;
  platformAdaptationId: string;
  adaptationVersion: number;
  canonicalSourceHash: string;
  adaptationHash: string;
  videoId: string;
  videoVersion: number;
  thumbnailId: string;
  thumbnailVersion: number;
  pinnedCommentPackageId?: string;
  pinnedCommentVersion?: number;
  status: Phase22PublishingStatus;
  publishedAt?: string;
  publishedBy?: string;
  publishedByName?: string;
  publishedByRole?: string;
  externalUrl?: string;
  platformPostId?: string;
  publicationNotes?: string;
  failureReason?: string;
  failedAt?: string;
  failedBy?: string;
  retryCount: number;
  lastRetriedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PublisherPackageSearchFilters {
  contentId?: string;
  platform?: PlatformType | string;
  readiness?: boolean | 'READY_TO_PUBLISH' | 'NOT_READY';
  publishingStatus?: Phase22PublishingStatus | string;
  adaptationStatus?: PlatformAdaptationStatus | string;
}

export interface MarkManuallyPublishedInput {
  contentId: string;
  platform: PlatformType | string;
  externalUrl?: string;
  platformPostId?: string;
  publicationNotes?: string;
  publishedAt?: string;
}

export interface MarkPublishingFailedInput {
  contentId: string;
  platform: PlatformType | string;
  failureReason: string;
  notes?: string;
}

// ============================================================================
// Phase 23: Production Search, Queues & Dashboard Data Models
// ============================================================================

export type Phase23QueueType =
  | 'MY_WORK'
  | 'QUESTIONS'
  | 'SCRIPTS'
  | 'VIDEOS'
  | 'REVIEWS'
  | 'PUBLISHING';

export interface Phase23SearchOptions {
  contentId?: string;
  search?: string;
  topicId?: string;
  subtopicId?: string;
  difficulty?: string;
  language?: string;
  challengeType?: string;
  presentationType?: string;
  questionStyle?: string;
  status?: string;
  assigneeId?: string;
  page?: number;
  limit?: number;
  sortBy?: 'updatedAt' | 'createdAt' | 'contentId' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface Phase23SearchResultItem {
  contentId: string;
  masterId?: string;
  questionId?: string;
  videoId?: string;
  title: string;
  topicId: string;
  topicName: string;
  subtopicId: string;
  subtopicName: string;
  difficulty: string;
  language: string;
  challengeType: string;
  presentationType: string;
  questionStyle: string;
  status: string;
  workflowStage: string;
  assigneeId?: string;
  assigneeName?: string;
  questionStatus?: string;
  scriptStatus?: string;
  videoStatus?: string;
  reviewStatus?: string;
  socialReviewStatus?: string;
  platformAdaptationStatus?: string;
  publishingReadiness?: string;
  publishingStatus?: string;
  blockers: string[];
  updatedAt: string;
  createdAt: string;
}

export interface Phase23SearchResult {
  totalCount: number;
  returnedCount: number;
  page: number;
  limit: number;
  totalPages: number;
  items: Phase23SearchResultItem[];
}

export interface Phase23QueueItem {
  id: string;
  contentId: string;
  type: 'QUESTION' | 'SCRIPT' | 'VIDEO' | 'REVIEW' | 'PUBLISHING';
  title: string;
  topicName: string;
  subtopicName: string;
  difficulty: string;
  language: string;
  status: string;
  workflowStage: string;
  assigneeId?: string;
  assigneeName?: string;
  actionRequired: string;
  isActionableByCurrentActor: boolean;
  priority: string;
  blockers: string[];
  updatedAt: string;
}

export interface Phase23QueueResult {
  queueType: Phase23QueueType;
  totalCount: number;
  items: Phase23QueueItem[];
}

export interface Phase23DashboardMetrics {
  totalActiveProductionItems: number;
  myAssignedWork: number;
  questionsNeedingAction: number;
  scriptsNeedingAction: number;
  videosNeedingAction: number;
  reviewsPending: number;
  socialReviewsPending: number;
  publishingReadyItems: number;
  publishingBlockersCount: number;
  activeBlockersBreakdown: {
    reviewPending: number;
    changesRequested: number;
    missingAsset: number;
    staleAdaptation: number;
    unreadyPublishing: number;
    unassignedWork: number;
  };
  recentlyUpdatedItems: Phase23SearchResultItem[];
}

export interface Phase23ContentIdDetails {
  contentId: string;
  contentMaster?: any;
  question?: any;
  script?: any;
  video?: any;
  thumbnail?: any;
  pinnedComment?: any;
  socialReview?: any;
  platformAdaptations?: any[];
  publishing?: any;
  publishingReadiness?: any;
  aggregatedStatus: string;
  workflowStage: string;
  assignees: Array<{ role: string; userId: string; userName: string }>;
  blockers: string[];
  history: Array<{ timestamp: string; action: string; actorName: string; details: string }>;
}// ============================================================================
// PHASE 29: AI CONTENT STRATEGY & ADAPTIVE GENERATION TYPES
// ============================================================================

export type RecommendationStatus = 'ACTIVE' | 'APPLIED' | 'REJECTED' | 'STALE';

export interface ContentStrategyRecommendation {
  id: string; // e.g. BP-STR-######
  createdAt: string;
  sourceReportId?: string; // BP-SPI-###### if linked to Phase 28 performance intelligence
  topicId: string;
  subtopicId: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  questionStyle: string; // e.g. "NUMERICAL", "CONCEPTUAL"
  context: string; // e.g. "Real-life application of..."
  hook: string; // e.g. "Can you solve this tricky puzzle?"
  presentation: string; // e.g. "Vertical Short", "Horizontal Video"
  platformConsiderations?: string; // e.g. "Optimal for YouTube Shorts"
  status: RecommendationStatus;
  evidence: string;
  sampleSize: number;
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT_DATA';
  provenance?: AIProvenance;
  appliedAt?: string;
  appliedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  staleAt?: string;
  version: number;
}

// ============================================================================
// PHASE 30: AUDIENCE SOCIAL COMMENTS & COMMENT INTELLIGENCE DATA CONTRACTS
// (Strictly isolated to separate Analytics Workbook)
// ============================================================================

export type SocialCommentSource = 'MANUAL_PASTE' | 'CSV_IMPORT' | 'JSON_IMPORT' | 'API_SYNC';

export type SocialCommentStatus = 'UNPROCESSED' | 'ANALYZED' | 'FLAGGED' | 'IGNORED';

export interface SocialCommentRecord {
  id: string; // CMS-generated primary key: BP-CMT-######
  contentId: string; // Canonical Content Master reference: BP-CNT-######
  videoId?: string; // Optional: BP-V-######
  publishingId?: string; // Optional: PUB-###### or BP-PUB-######
  platform: 'youtube' | 'instagram' | 'facebook' | string;
  platformPostId?: string; // Optional provider-native post identifier
  platformCommentId?: string; // Optional provider-native comment identifier (for (platform, platformCommentId) deduplication)
  commentText: string;
  authorDisplayName?: string; // Public display context only
  commentCreatedAt?: string; // Provider timestamp (ISO-8601)
  capturedAt: string; // Capture timestamp (ISO-8601)
  likeCount?: number;
  replyCount?: number;
  parentCommentId?: string;
  isReply?: boolean;
  source: SocialCommentSource | string;
  status: SocialCommentStatus | string;
}

export interface CreateSocialCommentInput {
  contentId: string;
  videoId?: string;
  publishingId?: string;
  platform: 'youtube' | 'instagram' | 'facebook' | string;
  platformPostId?: string;
  platformCommentId?: string;
  commentText: string;
  authorDisplayName?: string;
  commentCreatedAt?: string;
  capturedAt?: string;
  likeCount?: number;
  replyCount?: number;
  parentCommentId?: string;
  isReply?: boolean;
  source?: SocialCommentSource | string;
  status?: SocialCommentStatus | string;
}

export interface ImportSocialCommentsInput {
  defaultContentId?: string;
  defaultPlatform?: 'youtube' | 'instagram' | 'facebook' | string;
  defaultSource?: SocialCommentSource | string;
  comments: Partial<CreateSocialCommentInput>[];
}

export interface SocialCommentQueryFilters {
  contentId?: string;
  videoId?: string;
  publishingId?: string;
  platform?: string;
  platformPostId?: string;
  platformCommentId?: string;
  source?: string;
  status?: string;
  isReply?: boolean;
  startDate?: string;
  endDate?: string;
}

export type CommentIntelligenceScope = 'CONTENT_MASTER' | 'VIDEO' | 'BATCH' | 'PLATFORM';

export interface CommentMisconceptionItem {
  misconception: string;
  frequencyEstimate?: 'HIGH' | 'MEDIUM' | 'LOW';
  sampleCommentQuotes: string[];
  explanationNeeded: string;
}

export interface ViewerQuestionItem {
  question: string;
  frequencyEstimate?: 'HIGH' | 'MEDIUM' | 'LOW';
  sampleCommentQuotes: string[];
  suggestedAnswer: string;
}

export interface ContentRequestItem {
  requestedTopicOrFormat: string;
  frequencyEstimate?: 'HIGH' | 'MEDIUM' | 'LOW';
  sampleCommentQuotes: string[];
}

export interface FactualCorrectionItem {
  issueReported: string;
  severity: 'CRITICAL' | 'MODERATE' | 'MINOR';
  sampleCommentQuotes: string[];
  verificationNeeded: string;
}

export interface CommentRecommendationItem {
  area: 'QUESTION_DESIGN' | 'EXPLANATION_CLARITY' | 'TOPIC_EXPANSION' | 'PACING' | 'PINNED_COMMENT';
  recommendation: string;
  supportingEvidence: string;
  suggestedAction: string;
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface CommentSentimentSummary {
  positivePercentage: number;
  negativePercentage: number;
  neutralPercentage: number;
  overallVerdict: 'OVERWHELMINGLY_POSITIVE' | 'POSITIVE' | 'MIXED' | 'NEGATIVE' | 'CONFUSED';
  summary: string;
}

export interface CommentIntelligenceRecord {
  id: string; // CMS-generated BP-CMI-######
  contentId: string; // Canonical Content Master reference BP-CNT-######
  videoId?: string; // Optional BP-V-######
  platform?: string; // 'youtube' | 'instagram' | 'facebook' | 'ALL'
  analysisScope: CommentIntelligenceScope | string;
  sourceCommentCount: number;
  sourceCommentIds: string[]; // List of BP-CMT-###### IDs analyzed in this run
  analyzedAt: string; // ISO-8601 timestamp
  actorId?: string;
  actorName?: string;
  overallSentiment: CommentSentimentSummary;
  misconceptions: CommentMisconceptionItem[];
  viewerQuestions: ViewerQuestionItem[];
  contentRequests: ContentRequestItem[];
  factualCorrections: FactualCorrectionItem[];
  recommendations: CommentRecommendationItem[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT_DATA';
  confidenceScore?: number;
  modelUsed: string; // e.g. 'gemini-2.5-flash', 'deterministic-fallback'
  promptVersion: string; // e.g. 'v1.0'
  isFallbackMode: boolean;
  provenance?: AIProvenance;
  evidenceTraceability: {
    commentIdsUsed: string[];
    totalCommentsAnalyzed: number;
    sampleSizeConfidence: 'HIGH' | 'MEDIUM' | 'LOW';
    platformBreakdown?: Record<string, number>;
  };
}

export interface GenerateCommentIntelligenceInput {
  contentId: string;
  videoId?: string;
  platform?: string;
  analysisScope?: CommentIntelligenceScope | string;
  commentIds?: string[];
  forceFallback?: boolean;
}



