/**
 * BURRA PARIKSHA CMS - Domain Types & Interfaces
 * Phase 1: Core Domain Foundations
 * 
 * NOTE: These types mirror the upcoming Google Sheets data architecture (Spreadsheet: "Burra Pariksha CMS - TEST").
 * Detailed schema formalization will occur in Phase 2 upon inspecting live sheet structures.
 */

// ============================================================================
// 1. WORKFLOW & STATUS CONSTANTS / ENUMS
// ============================================================================

export enum QuestionStatus {
  DRAFT = 'DRAFT',
  GENERATED = 'GENERATED',
  EDITING = 'EDITING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
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

export enum DifficultyLevel {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export enum QuestionLanguage {
  ENGLISH = 'ENGLISH',
  TELUGU = 'TELUGU',
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
  CONTENT_MANAGER = 'CONTENT_MANAGER',
  QUESTION_EDITOR = 'QUESTION_EDITOR',
  SCRIPT_WRITER = 'SCRIPT_WRITER',
  VIDEO_EDITOR = 'VIDEO_EDITOR',
  DESIGNER = 'DESIGNER',
  PUBLISHING_MANAGER = 'PUBLISHING_MANAGER',
  CREATOR = 'CREATOR',
  EDITOR = 'EDITOR',
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
  avatarUrl?: string;
  isActive: boolean;
  password_hash?: string;
  last_login_at?: string;
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
 * Specific subject areas under a Category (e.g., Time & Work, Number Series).
 */
export interface Topic {
  id: string; // e.g. TOP-101
  categoryId: string; // Reference to Category.id
  name: string;
  slug: string;
  description?: string;
  subtopicsCount?: number;
  createdAt: string;
  // TODO: Verify exact column headers with Google Sheet in Phase 2
}

/**
 * SUBTOPICS Sheet Tab
 * Granular sub-division (e.g., Pipes & Cisterns, Relative Speed).
 */
export interface Subtopic {
  id: string; // e.g. SUB-1001
  topicId: string; // Reference to Topic.id
  name: string;
  slug: string;
  notes?: string;
  createdAt: string;
  // TODO: Verify exact column headers with Google Sheet in Phase 2
}

/**
 * QUESTIONS Sheet Tab
 * Core question bank record with options, solutions, and production tags.
 */
export interface Question {
  id: string; // e.g. BP-Q-1042
  categoryId: string;
  categoryName: string;
  topicId: string;
  topicName: string;
  subtopicId: string;
  subtopicName: string;
  difficulty: DifficultyLevel;
  language?: QuestionLanguage;
  questionText: string;
  options: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  realWorldContext?: string;
  questionStyle?: QuestionStyle;
  status: QuestionStatus;
  videoStatus: VideoProductionStatus;
  tags?: string[];
  source?: string;
  aiPromptUsed?: string;
  authorId?: string;
  createdAt: string;
  updatedAt: string;
  // TODO: Sync field naming with QUESTIONS sheet tab in Phase 2
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
  // TODO: Formalize join cardinality in Phase 2
}

/**
 * VIDEOS Sheet Tab
 * Video production tracking metadata.
 */
export interface Video {
  id: string; // e.g. BP-V-000001
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
  rawFootagePath?: string;
  finalRenderPath?: string;
  youtubeId?: string;
  scheduledRecordingDate?: string;
  scheduledPublishDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Augmented UI properties
  question?: Question;
  assignments?: Assignment[];
  workflowHistory?: Workflow[];
  auditLogs?: AuditLog[];
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
  id: string; // e.g. SCR-204
  videoId: string;
  questionId: string;
  hookText: string;
  problemStatement: string;
  stepByStepSolution: string;
  speedTrickOrTakeaway: string;
  callToAction: string;
  currentVersion: number;
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
  id: string; // e.g. THM-204
  videoId: string;
  hookHeadline: string;
  driveAssetUrl?: string;
  previewUrl?: string;
  status: 'PENDING' | 'DESIGNED' | 'APPROVED' | 'REJECTED';
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
  // TODO: Link with Google Drive folder in Phase 3
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
}

/**
 * PINNED_COMMENTS Sheet Tab
 * Engagement and solution comments for social uploads.
 */
export interface PinnedComment {
  id: string; // e.g. PIN-204
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

/**
 * WORKFLOW Sheet Tab
 * Production state machine transitions log.
 */
export interface Workflow {
  id: string; // e.g. WF-901
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
  entityType: AssignmentEntityType;
  entityId: string;
  videoId?: string; // Backwards compatibility for legacy records
  taskType: AssignmentTaskType | string;
  assignmentRole?: string;
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

/**
 * PUBLISHING Sheet Tab
 * Manual multi-platform upload tracking (YouTube, Instagram, Facebook).
 */
export interface Publishing {
  id: string; // e.g. PUB-204
  videoId: string;
  videoTitle: string;
  questionId: string;
  finalVideoStatus: 'READY' | 'RENDERED' | 'VERIFIED';
  youtube: {
    status: SocialPublishStatus;
    videoUrl?: string;
    publishedAt?: string;
    notes?: string;
  };
  instagram: {
    status: SocialPublishStatus;
    postUrl?: string;
    publishedAt?: string;
    notes?: string;
  };
  facebook: {
    status: SocialPublishStatus;
    postUrl?: string;
    publishedAt?: string;
    notes?: string;
  };
  pinnedCommentReady: boolean;
  thumbnailReady: boolean;
  completedPlatformsCount: number;
  totalPlatformsCount: number;
  createdAt: string;
  updatedAt: string;
  // TODO: Verify manual publishing checklist format in Phase 7
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
  type: 'QUESTION' | 'VIDEO';
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
  categoryId: string;
  categoryName: string;
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
  difficulty?: QuestionDifficulty;
  videoStatus: VideoStatus;
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
  scriptStatus?: ScriptStatus;
  thumbnailId?: string;
  thumbnailVersion?: number;
  thumbnailStatus?: ThumbnailStatus;
  pinnedCommentId?: string;
  pinnedCommentVersion?: number;
  pinnedCommentApproval?: PinnedCommentStatus;
  publishingId?: string;
  youtubeStatus?: PlatformPublishStatus;
  instagramStatus?: PlatformPublishStatus;
  facebookStatus?: PlatformPublishStatus;
  completedPlatformsCount: number;
  totalPlatformsCount: number;
  publishingReadiness?: PublishingReadinessScore;
}

