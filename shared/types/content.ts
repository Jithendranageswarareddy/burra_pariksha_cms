/**
 * BURRA PARIKSHA CMS — Content & Production Entity Types
 * Multi-dimensional production assets across the 15-step workflow
 */

import {
  ContentMasterStatus,
  DifficultyLevel,
  PlatformType,
  PriorityLevel,
  RenderValidationStatus,
  SocialPublishStatus,
  SocialQualityStatus,
  SocialReviewDecision,
  SocialReviewStatus,
  VideoProductionStatus,
} from '../constants/enums';
import { Question } from './question';

export interface ContentMaster {
  id: string; // e.g. BP-CNT-000001
  contentId?: string; // Canonical correlation identity BP-CNT-######
  title: string;
  status: ContentMasterStatus | string;
  primaryQuestionId?: string;
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
  reviewComments?: string;
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
    hasScript?: boolean;
    isScriptApproved?: boolean;
    hasVideo?: boolean;
    isVideoApproved?: boolean;
    hasThumbnail?: boolean;
    isThumbnailApproved?: boolean;
    hasPinnedComment?: boolean;
    isPinnedCommentApproved?: boolean;
    hasSocialReview?: boolean;
    isSocialReviewApproved?: boolean;
  };
  socialReviewState?: {
    status: string;
    isVersionHashMatching: boolean;
  };
  publishingState?: {
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

export interface Video {
  id: string; // e.g. vid_uuid or BP-V-000001
  contentId?: string; // Canonical correlation identity BP-CNT-######
  contentMasterId?: string;
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
  question?: Question;
  contentMaster?: ContentMaster;
  assignments?: any[];
  workflowHistory?: any[];
  auditLogs?: any[];
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

export interface QuestionVideo {
  id: string;
  questionId: string;
  videoId: string;
  notes?: string;
  createdAt: string;
}

export interface Script {
  id: string; // e.g. scr_uuid or SCR-204
  contentId?: string;
  contentMasterId?: string;
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
}

export interface ScriptVersion {
  id: string;
  scriptId: string;
  versionNumber: number;
  content?: string;
  contentJson?: any;
  editedBy: string;
  changeSummary?: string;
  createdAt: string;
}

export interface Thumbnail {
  id: string; // e.g. thm_uuid or THM-204
  contentId?: string;
  contentMasterId?: string;
  videoId: string;
  hookHeadline: string;
  driveAssetUrl?: string;
  previewUrl?: string;
  status: 'PENDING' | 'DESIGNED' | 'APPROVED' | 'REJECTED';
  currentVersion: number;
  createdAt: string;
  updatedAt: string;
  driveFileId?: string;
  driveFolderId?: string;
  driveFolderUrl?: string;
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
}

export interface ThumbnailVersion {
  id: string;
  thumbnailId: string;
  versionNumber: number;
  driveAssetUrl: string;
  designerNotes?: string;
  createdAt: string;
  driveFileId?: string;
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

export interface AiThumbnailCuriosityFraming {
  curiosityAngle: string;
  psychologicalTrigger: string;
  hypothesis: string;
}

export interface AiThumbnailVisualDirection {
  composition: string;
  colorPalette: string[];
  focalPoint: string;
  emotionOrExpression: string;
  brandingElements: string;
}

export interface AiThumbnailAudienceTargeting {
  primaryAudience: string;
  secondaryAudience: string;
  languageStyle: 'TELUGU' | 'ENGLISH' | 'BILINGUAL';
  difficultyPerception: 'LOOKS_EASY_BUT_HARD' | 'CHALLENGE_FOR_GENIUSES' | 'FAST_TRICK';
}

export interface ThumbnailCandidate {
  id: string;
  contentId: string;
  questionId: string;
  scriptId?: string;
  videoId?: string;
  conceptName: string;
  abVariant: string;
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
  id: string;
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

export interface PinnedComment {
  id: string; // e.g. pcm_uuid or PIN-204
  contentId?: string;
  contentMasterId?: string;
  videoId: string;
  commentText: string;
  solutionBreakdown: string;
  nextChallengeQuestion?: string;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PinnedCommentVersion {
  id: string;
  pinnedCommentId: string;
  versionNumber: number;
  commentText: string;
  createdAt: string;
}

export type PinnedCommentPackageStatus = 'DRAFT' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';

export interface PinnedCommentPackage {
  id: string;
  contentId: string;
  contentMasterId?: string;
  questionId: string;
  scriptId?: string;
  scriptVersion?: number;
  videoId?: string;
  pinnedComment: string;
  answerDiscussionPrompt: string;
  followUpQuestions: string[];
  audienceParticipationPrompt: string;
  version: number;
  status: PinnedCommentPackageStatus;
  assignedReviewerId?: string;
  approvedBy?: string;
  approvedVersion?: number;
  approvedAt?: string;
  rejectedReason?: string;
  isAiGenerated: boolean;
  aiModelUsed?: string;
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

export interface Publishing {
  id: string; // e.g. pub_uuid or PUB-204
  contentId?: string;
  contentMasterId?: string;
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
}

export type PublishingPlatformStatus = 'READY' | 'SCHEDULED' | 'PUBLISHING' | 'PUBLISHED' | 'FAILED' | 'RETRY_PENDING' | string;

export interface PublishingPlatformRecord {
  id: string; // e.g. BP-PUB-000001
  contentId: string;
  platform: PlatformType | string;
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
  status?: PublishingPlatformStatus;
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
  retryCount?: number;
  lastRetriedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlatformPackageProjection {
  platform: string;
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

export interface SocialReviewRecord {
  id: string;
  questionId?: string;
  contentId?: string;
  contentMasterId?: string;
  status?: SocialReviewStatus | string;
  reviewedVersionHash?: string;
  reviewerId?: string;
  reviewerName?: string;
  reviewerRole?: string;
  decision?: SocialReviewStatus | SocialReviewDecision | string;
  previousStatus?: SocialReviewStatus;
  reason?: string;
  decisionReason?: string;
  feedbackCategories?: string[];
  overallQualityScoreAtReview?: number;
  qualityStatusAtReview?: SocialQualityStatus;
  isAdminOverride?: boolean;
  reviewedAt?: string;
  assignedReviewerId?: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedByRole?: string;
  versionLock?: any;
  validationSummary?: {
    isValid: boolean;
    issues: string[];
    warnings: string[];
    checksPassed: string[];
  };
  aiRecommendation?: any;
  isInvalidated?: boolean;
  invalidatedReason?: string;
  invalidatedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProductionBoardItem {
  id?: string;
  videoId: string;
  questionId: string;
  title: string;
  questionText: string;
  topic?: string;
  topicName?: string;
  subtopic?: string;
  subtopicName?: string;
  difficulty?: DifficultyLevel | string;
  videoStatus: VideoProductionStatus;
  priority?: PriorityLevel;
  assignee?: {
    id: string;
    name: string;
    email?: string;
    role?: string;
  };
  dueDate?: string;
  isOverdue?: boolean;
  scriptId?: string;
  scriptVersion?: number;
  thumbnailId?: string;
  thumbnailVersion?: number;
  thumbnailStatus?: 'PENDING' | 'DESIGNED' | 'APPROVED' | 'REJECTED' | string;
  pinnedCommentId?: string;
  pinnedCommentApproval?: boolean;
  publishingId?: string;
  youtubeStatus?: any;
  instagramStatus?: any;
  facebookStatus?: any;
  completedPlatformsCount?: number;
  totalPlatformsCount?: number;
  publishingReadiness?: string;
  finalRenderWidth?: number;
  finalRenderHeight?: number;
  finalRenderFormat?: string;
  finalRenderAspectRatio?: string;
  actualDurationSeconds?: number;
  finalRenderPath?: string;
  finalRenderValidationStatus?: RenderValidationStatus;
  canonicalProductionReadiness?: any;
  scheduledRecordingDate?: string;
  assignedHost?: string;
  assignedEditor?: string;
  hasScript?: boolean;
  hasThumbnail?: boolean;
  hasPinnedComment?: boolean;
  updatedAt?: string;
  contentId?: string;
  contentMasterId?: string;
}


export interface ContentPlan {
  id: string; // e.g. BP-PLN-0001
  topicId: string;
  topicName: string;
  subtopicId: string;
  subtopicName: string;
  difficulty: DifficultyLevel;
  language: any;
  targetQuestionCount: number;
  realWorldContext?: string;
  questionStyle?: any;
  priority: PriorityLevel;
  plannedDate: string;
  status: any;
  notes?: string;
  currentQuestionCount?: number;
  remainingQuestionCount?: number;
  completionPercentage?: number;
  createdBatchesCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ContentBatch {
  id: string;
  name: string;
  description?: string;
  planId: string;
  targetCount: number;
  priority: PriorityLevel;
  plannedDate: string;
  status: any;
  questionIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BatchProgressMetrics {
  batchId: string;
  batchName: string;
  planId: string;
  status: any;
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
  totalQuestions: number;
  subtopicsCount: number;
  activeSubtopicsCount: number;
  zeroSubtopicsCount: number;
  coveragePercentage: number;
  subtopics: SubtopicCoverage[];
}

export interface CoverageOverviewData {
  totalQuestions: number;
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
  topics: TopicCoverage[];
}

export interface ContentGapAnalysis {
  zeroCoverageSubtopics: {
    subtopicId: string;
    subtopicName: string;
    topicName: string;
  }[];
  lowCoverageSubtopics: {
    subtopicId: string;
    subtopicName: string;
    topicName: string;
    currentCount: number;
  }[];
  difficultyGaps: {
    topicId: string;
    topicName: string;
    missingDifficulties: DifficultyLevel[];
    recommendation: string;
  }[];
  languageGaps: {
    topicId: string;
    topicName: string;
    missingLanguages: any[];
    recommendation: string;
  }[];
  concentrationRisks: {
    topicId: string;
    topicName: string;
    questionCount: number;
    percentageOfTotal: number;
    warning: string;
  }[];
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
  topicId: string;
  topicName: string;
  targetTotalCount: number;
  pedagogicalRationale: string;
  priorityFocusAreas: string[];
  recommendedDistribution: AiPlanRecommendationSubtopic[];
  suggestedBatchGrouping: AiPlanBatchSuggestion[];
  isAiGenerated: true;
  generatedAt: string;
}

export interface SocialReviewPackageBundle {
  question: Question;
  contentMaster?: any;
  validationStatus: any;
  hook?: any;
  teleprompterScript?: any;
  canonicalMetadata?: any;
  multiPlatformAdaptations?: any;
  qualityAssessment?: any;
  currentReviewStatus: any;
  currentVersionHash: string;
  isPublishingReady: boolean;
  blockers: string[];
  reviewHistory: SocialReviewRecord[];
  latestReviewRecord?: SocialReviewRecord;
}

export interface SocialAnalyticsRecord {
  id: string;
  contentId: string;
  videoId?: string;
  publishingId?: string;
  platformPostId?: string;
  platform: 'youtube' | 'instagram' | 'facebook' | string;
  postingTimestamp?: string;
  views: number;
  watchTime: number;
  retentionRate: number;
  likes: number;
  comments: number;
  shares: number;
  subscribersGained: number;
  ctr: number;
  capturedAt: string;
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
  timeWindow: string;
  dayOfWeek?: string;
  hourOfDay?: number;
  platform: string;
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
  recommendedWindow: string;
  platform: string;
  sampleSize: number;
  supportingEvidence: string;
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  dayOfWeek?: string;
  bestHourWindow?: string;
}

export interface SocialPerformanceIntelligenceRecord {
  id: string;
  analyzedAt: string;
  actorId: string;
  actorName: string;
  recordCount: number;
  dataSnapshotFilters?: any;
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
  postingTimeBreakdown?: PostingTimeMetricAggregate[];
  recommendations?: {
    postingTimes: PostingTimeRecommendation[];
  };
  aiInsights?: {
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
  isFallbackMode?: boolean;
  modelUsed?: string;
  provenance?: any;
  evidenceTraceability?: {
    recordIdsUsed: string[];
    totalSamples: number;
    insufficientDataFlag: boolean;
    insufficientDimensions: string[];
  };
}

export interface SocialCommentRecord {
  id: string;
  contentId: string;
  videoId?: string;
  publishingId?: string;
  platform: 'youtube' | 'instagram' | 'facebook' | string;
  platformPostId?: string;
  platformCommentId?: string;
  commentText: string;
  authorDisplayName?: string;
  commentCreatedAt?: string;
  capturedAt: string;
  likeCount?: number;
  replyCount?: number;
  parentCommentId?: string;
  isReply?: boolean;
  source: string;
  status: string;
}

export interface CommentIntelligenceRecord {
  id: string;
  contentId: string;
  videoId?: string;
  platform?: string;
  analysisScope: string;
  sourceCommentCount: number;
  sourceCommentIds: string[];
  analyzedAt: string;
  actorId?: string;
  actorName?: string;
  overallSentiment: any;
  misconceptions: any[];
  viewerQuestions: any[];
  contentRequests: any[];
  factualCorrections: any[];
  recommendations: any[];
  confidence: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT_DATA';
  confidenceScore?: number;
  modelUsed: string;
  promptVersion: string;
  isFallbackMode: boolean;
  provenance?: any;
  evidenceTraceability?: any;
}

export type RecommendationStatus = 'ACTIVE' | 'APPLIED' | 'REJECTED' | 'STALE' | string;

export interface ContentStrategyRecommendation {
  id: string;
  createdAt: string;
  sourceReportId?: string;
  topicId: string;
  subtopicId: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | string;
  questionStyle: string;
  context: string;
  hook: string;
  presentation: string;
  platformConsiderations?: string;
  status: RecommendationStatus;
  evidence: string;
  sampleSize: number;
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW' | 'INSUFFICIENT_DATA' | string;
  provenance?: any;
  appliedAt?: string;
  appliedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  staleAt?: string;
  version?: number;
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
  topic: string;
  videoRenderReady: boolean;
  thumbnailApproved: boolean;
  pinnedCommentReady: boolean;
  publishingRecordExists: boolean;
  status: 'READY' | 'BLOCKED' | 'INCOMPLETE';
  missingItems: string[];
  platforms: {
    youtube: any;
    instagram: any;
    facebook: any;
  };
  actionUrl: string;
  canonicalProductionReadiness?: any;
}

export interface GlobalSearchResult {
  id: string;
  type: 'QUESTION' | 'VIDEO' | 'SCRIPT' | 'THUMBNAIL' | 'PINNED_COMMENT' | 'ASSIGNMENT' | 'CONTENT_MASTER' | 'SOCIAL_REVIEW' | 'PUBLISHING' | string;
  title: string;
  subtitle: string;
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
  recentAuditLogs: any[];
  teamOperations?: any;
}

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

export type SocialCommentSource = 'API_SYNC' | 'MANUAL_IMPORT' | 'WEBHOOK' | string;
export type SocialCommentStatus = 'UNREAD' | 'ANALYZED' | 'FLAGGED' | 'ACTIONED' | string;

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

export interface GenerateCommentIntelligenceInput {
  contentId: string;
  videoId?: string;
  platform?: string;
  analysisScope?: CommentIntelligenceScope | string;
  commentIds?: string[];
}
