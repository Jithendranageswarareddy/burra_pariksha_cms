/**
 * BURRA PARIKSHA CMS — Shared Enums & Status Constants
 * Authoritative constants used across both Frontend and Backend
 */

export enum DifficultyLevel {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export type QuestionDifficulty = DifficultyLevel;


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

export type PlatformType = 'youtube' | 'instagram' | 'facebook' | 'YOUTUBE' | 'INSTAGRAM' | 'FACEBOOK';

export const PlatformType = {
  YOUTUBE: 'YOUTUBE' as const,
  INSTAGRAM: 'INSTAGRAM' as const,
  FACEBOOK: 'FACEBOOK' as const,
};

export enum SocialPublishStatus {
  NOT_STARTED = 'NOT_STARTED',
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  UPLOADED = 'UPLOADED',
  PUBLISHED = 'PUBLISHED',
  FAILED = 'FAILED',
}

export enum SocialReviewStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  IN_REVIEW = 'IN_REVIEW',
  PASS = 'PASS',
  APPROVED = 'APPROVED',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
  CHANGES_REQUIRED = 'CHANGES_REQUIRED',
  REJECTED = 'REJECTED',
  STALE_REVISION_REQUIRED = 'STALE_REVISION_REQUIRED',
}

export type SocialReviewDecision = 'PASS' | 'APPROVED' | 'CHANGES_REQUIRED' | 'CHANGES_REQUESTED' | 'REJECTED';

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

export enum ContentMasterStatus {
  DRAFT = 'DRAFT',
  READY_FOR_REVIEW = 'READY_FOR_REVIEW',
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
  APPROVED = 'APPROVED',
  SCHEDULED = 'SCHEDULED',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
  // Compatibility Aliases
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
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

export enum AiRefinementAction {
  REGENERATE = 'REGENERATE',
  IMPROVE_OPTIONS = 'IMPROVE_OPTIONS',
  MAKE_REALISTIC = 'MAKE_REALISTIC',
  SIMPLIFY_LANGUAGE = 'SIMPLIFY_LANGUAGE',
  IMPROVE_TELUGU = 'IMPROVE_TELUGU',
  INCREASE_DIFFICULTY = 'INCREASE_DIFFICULTY',
  DECREASE_DIFFICULTY = 'DECREASE_DIFFICULTY',
  IMPROVE_EXPLANATION = 'IMPROVE_EXPLANATION',
}

export enum SocialPlatform {
  YOUTUBE_SHORTS = 'YOUTUBE_SHORTS',
  INSTAGRAM_REELS = 'INSTAGRAM_REELS',
  FACEBOOK_REELS = 'FACEBOOK_REELS',
}

export enum SocialQualityStatus {
  EXCELLENT = 'EXCELLENT',
  GOOD = 'GOOD',
  NEEDS_IMPROVEMENT = 'NEEDS_IMPROVEMENT',
  REJECTED = 'REJECTED',
}

