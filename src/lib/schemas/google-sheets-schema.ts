/**
 * BURRA PARIKSHA CMS - Google Sheets Database Schema Contract
 * Phase 2: Google Sheets Database Architecture & Persistence
 * 
 * Google Sheets is the authoritative persistent data store.
 * Each worksheet/tab corresponds to an entity or workflow domain.
 * Column mapping uses header-based lookups rather than fixed column indices.
 */

import { z } from 'zod';
import {
  AssignmentEntityType,
  ContentBatchStatus,
  ContentMasterStatus,
  ContentPlanStatus,
  DifficultyLevel,
  PriorityLevel,
  QuestionLanguage,
  QuestionStatus,
  QuestionStyle,
  SocialPublishStatus,
  VideoProductionStatus,
} from '../../types';

// ============================================================================
// 1. AUTHORITATIVE WORKSHEET NAMES (18 Authoritative Tabs)
// ============================================================================

export const SHEET_TABS = {
  USERS: 'USERS',
  CATEGORIES: 'CATEGORIES',
  TOPICS: 'TOPICS',
  SUBTOPICS: 'SUBTOPICS',
  QUESTIONS: 'QUESTIONS',
  QUESTION_VIDEOS: 'QUESTION_VIDEOS',
  VIDEOS: 'VIDEOS',
  SCRIPT: 'SCRIPT',
  SCRIPT_VERSIONS: 'SCRIPT_VERSIONS',
  THUMBNAILS: 'THUMBNAILS',
  THUMBNAIL_VERSIONS: 'THUMBNAIL_VERSIONS',
  PINNED_COMMENTS: 'PINNED_COMMENTS',
  PINNED_COMMENT_VERSIONS: 'PINNED_COMMENT_VERSIONS',
  WORKFLOW: 'WORKFLOW',
  ASSIGNMENTS: 'ASSIGNMENTS',
  PUBLISHING: 'PUBLISHING',
  AUDIT_LOG: 'AUDIT_LOG',
  SEQUENCES: 'SEQUENCES',
  CONTENT_MASTERS: 'CONTENT_MASTERS',
  QUESTION_VALIDATIONS: 'QUESTION_VALIDATIONS',
  SOCIAL_REVIEWS: 'SOCIAL_REVIEWS',
  QUESTION_CONFIG: 'QUESTION_CONFIG',
} as const;

// Phase 9 Extended Planning Worksheet Names
export const PLANNING_SHEET_TABS = {
  CONTENT_PLANS: 'CONTENT_PLANS',
  CONTENT_BATCHES: 'CONTENT_BATCHES',
} as const;

export type PlanningSheetTabName = typeof PLANNING_SHEET_TABS[keyof typeof PLANNING_SHEET_TABS];
export type SheetTabName = typeof SHEET_TABS[keyof typeof SHEET_TABS] | PlanningSheetTabName;

export const ALL_SHEET_TABS: SheetTabName[] = [
  SHEET_TABS.USERS,
  SHEET_TABS.CATEGORIES,
  SHEET_TABS.TOPICS,
  SHEET_TABS.SUBTOPICS,
  SHEET_TABS.QUESTIONS,
  SHEET_TABS.QUESTION_VIDEOS,
  SHEET_TABS.VIDEOS,
  SHEET_TABS.SCRIPT,
  SHEET_TABS.SCRIPT_VERSIONS,
  SHEET_TABS.THUMBNAILS,
  SHEET_TABS.THUMBNAIL_VERSIONS,
  SHEET_TABS.PINNED_COMMENTS,
  SHEET_TABS.PINNED_COMMENT_VERSIONS,
  SHEET_TABS.WORKFLOW,
  SHEET_TABS.ASSIGNMENTS,
  SHEET_TABS.PUBLISHING,
  SHEET_TABS.AUDIT_LOG,
  SHEET_TABS.SEQUENCES,
  SHEET_TABS.CONTENT_MASTERS,
  SHEET_TABS.SOCIAL_REVIEWS,
  SHEET_TABS.QUESTION_VALIDATIONS,
  SHEET_TABS.QUESTION_CONFIG,
  PLANNING_SHEET_TABS.CONTENT_PLANS,
  PLANNING_SHEET_TABS.CONTENT_BATCHES,
];

// ============================================================================
// 2. ID PREFIXES FOR SEQUENCES
// ============================================================================

export const SEQUENCE_ENTITIES = {
  QUESTION: 'QUESTION',
  VIDEO: 'VIDEO',
  SCRIPT: 'SCRIPT',
  THUMBNAIL: 'THUMBNAIL',
  PINNED_COMMENT: 'PINNED_COMMENT',
  CATEGORY: 'CATEGORY',
  TOPIC: 'TOPIC',
  SUBTOPIC: 'SUBTOPIC',
  USER: 'USER',
  CONTENT_PLAN: 'CONTENT_PLAN',
  CONTENT_BATCH: 'CONTENT_BATCH',
  ASSIGNMENT: 'ASSIGNMENT',
  CONTENT_MASTER: 'CONTENT_MASTER',
  CONTENT_ID: 'CONTENT_ID',
  SOCIAL_REVIEW: 'SOCIAL_REVIEW',
  SOCIAL_ANALYTICS: 'SOCIAL_ANALYTICS',
  SOCIAL_PERFORMANCE_INTELLIGENCE: 'SOCIAL_PERFORMANCE_INTELLIGENCE',
} as const;

export type SequenceEntityType = typeof SEQUENCE_ENTITIES[keyof typeof SEQUENCE_ENTITIES];

export const ID_PREFIX_MAP: Record<SequenceEntityType, { prefix: string; padLength: number }> = {
  [SEQUENCE_ENTITIES.QUESTION]: { prefix: 'BP-Q-', padLength: 6 },
  [SEQUENCE_ENTITIES.VIDEO]: { prefix: 'BP-V-', padLength: 6 },
  [SEQUENCE_ENTITIES.SCRIPT]: { prefix: 'BP-S-', padLength: 6 },
  [SEQUENCE_ENTITIES.THUMBNAIL]: { prefix: 'BP-T-', padLength: 6 },
  [SEQUENCE_ENTITIES.PINNED_COMMENT]: { prefix: 'BP-PIN-', padLength: 6 },
  [SEQUENCE_ENTITIES.CATEGORY]: { prefix: 'BP-CAT-', padLength: 3 },
  [SEQUENCE_ENTITIES.TOPIC]: { prefix: 'BP-TOP-', padLength: 3 },
  [SEQUENCE_ENTITIES.SUBTOPIC]: { prefix: 'BP-SUB-', padLength: 4 },
  [SEQUENCE_ENTITIES.USER]: { prefix: 'USR-', padLength: 3 },
  [SEQUENCE_ENTITIES.CONTENT_PLAN]: { prefix: 'BP-PLN-', padLength: 4 },
  [SEQUENCE_ENTITIES.CONTENT_BATCH]: { prefix: 'BP-BCH-', padLength: 4 },
  [SEQUENCE_ENTITIES.ASSIGNMENT]: { prefix: 'BP-ASN-', padLength: 6 },
  [SEQUENCE_ENTITIES.CONTENT_MASTER]: { prefix: 'BP-CNT-', padLength: 6 },
  [SEQUENCE_ENTITIES.CONTENT_ID]: { prefix: 'BP-CNT-', padLength: 6 },
  [SEQUENCE_ENTITIES.SOCIAL_REVIEW]: { prefix: 'BP-REV-', padLength: 6 },
  [SEQUENCE_ENTITIES.SOCIAL_ANALYTICS]: { prefix: 'BP-ANL-', padLength: 6 },
  [SEQUENCE_ENTITIES.SOCIAL_PERFORMANCE_INTELLIGENCE]: { prefix: 'BP-SPI-', padLength: 6 },
};

// ============================================================================
// 3. EXPLICIT COLUMN DEFINITIONS PER SHEET
// ============================================================================

export interface ColumnDefinition {
  name: string; // Exact Header in Google Sheet
  propertyKey: string; // Corresponding Object Property
  type: 'string' | 'number' | 'boolean' | 'json' | 'date';
  required: boolean;
  isPrimaryKey?: boolean;
  isForeignKey?: boolean;
  foreignKeyTarget?: { sheet: SheetTabName; column: string };
  allowedValues?: string[];
  description?: string;
}

export interface SheetSchemaContract {
  sheetName: SheetTabName;
  purpose: string;
  primaryKey: string;
  columns: ColumnDefinition[];
}

export const SHEET_SCHEMAS: Record<SheetTabName, SheetSchemaContract> = {
  // 0. CONTENT_MASTERS
  [SHEET_TABS.CONTENT_MASTERS]: {
    sheetName: SHEET_TABS.CONTENT_MASTERS,
    purpose: 'Root Content Master identity tracking logical content across downstream production',
    primaryKey: 'id',
    columns: [
      { name: 'id', propertyKey: 'id', type: 'string', required: true, isPrimaryKey: true },
      { name: 'content_id', propertyKey: 'contentId', type: 'string', required: false },
      { name: 'title', propertyKey: 'title', type: 'string', required: true },
      { name: 'status', propertyKey: 'status', type: 'string', required: true },
      { name: 'primary_question_id', propertyKey: 'primaryQuestionId', type: 'string', required: false, isForeignKey: true, foreignKeyTarget: { sheet: SHEET_TABS.QUESTIONS, column: 'id' } },
      { name: 'category_id', propertyKey: 'categoryId', type: 'string', required: false, isForeignKey: true, foreignKeyTarget: { sheet: SHEET_TABS.CATEGORIES, column: 'id' } },
      { name: 'topic_id', propertyKey: 'topicId', type: 'string', required: false, isForeignKey: true, foreignKeyTarget: { sheet: SHEET_TABS.TOPICS, column: 'id' } },
      { name: 'subtopic_id', propertyKey: 'subtopicId', type: 'string', required: false, isForeignKey: true, foreignKeyTarget: { sheet: SHEET_TABS.SUBTOPICS, column: 'id' } },
      { name: 'created_by', propertyKey: 'createdBy', type: 'string', required: false },
      { name: 'created_at', propertyKey: 'createdAt', type: 'date', required: true },
      { name: 'updated_at', propertyKey: 'updatedAt', type: 'date', required: true },
      { name: 'archived_at', propertyKey: 'archivedAt', type: 'date', required: false },
    ],
  },

  // 1. USERS
  [SHEET_TABS.USERS]: {
    sheetName: SHEET_TABS.USERS,
    purpose: 'Administrative and production team user directory',
    primaryKey: 'id',
    columns: [
      { name: 'id', propertyKey: 'id', type: 'string', required: true, isPrimaryKey: true },
      { name: 'name', propertyKey: 'name', type: 'string', required: true },
      { name: 'email', propertyKey: 'email', type: 'string', required: true },
      {
        name: 'role',
        propertyKey: 'role',
        type: 'string',
        required: true,
        allowedValues: [
          'ADMIN',
          'CONTENT_MANAGER',
          'QUESTION_EDITOR',
          'SCRIPT_WRITER',
          'VIDEO_EDITOR',
          'DESIGNER',
          'PUBLISHING_MANAGER',
          'CREATOR',
          'EDITOR',
          'REVIEWER',
        ],
      },
      { name: 'avatar_url', propertyKey: 'avatarUrl', type: 'string', required: false },
      { name: 'is_active', propertyKey: 'isActive', type: 'boolean', required: true },
      { name: 'password_hash', propertyKey: 'password_hash', type: 'string', required: false },
      { name: 'last_login_at', propertyKey: 'last_login_at', type: 'date', required: false },
      { name: 'created_at', propertyKey: 'createdAt', type: 'date', required: true },
      { name: 'updated_at', propertyKey: 'updatedAt', type: 'date', required: true },
    ],
  },

  // 2. CATEGORIES
  [SHEET_TABS.CATEGORIES]: {
    sheetName: SHEET_TABS.CATEGORIES,
    purpose: 'Top-level aptitude domains (e.g. Quantitative Aptitude, Logical Reasoning)',
    primaryKey: 'id',
    columns: [
      { name: 'id', propertyKey: 'id', type: 'string', required: true, isPrimaryKey: true },
      { name: 'name', propertyKey: 'name', type: 'string', required: true },
      { name: 'slug', propertyKey: 'slug', type: 'string', required: true },
      { name: 'description', propertyKey: 'description', type: 'string', required: false },
      { name: 'color_code', propertyKey: 'colorCode', type: 'string', required: false },
      { name: 'created_at', propertyKey: 'createdAt', type: 'date', required: true },
      { name: 'updated_at', propertyKey: 'updatedAt', type: 'date', required: true },
    ],
  },

  // 3. TOPICS
  [SHEET_TABS.TOPICS]: {
    sheetName: SHEET_TABS.TOPICS,
    purpose: 'Subject domains nested under categories (e.g. Time & Work, Number Series)',
    primaryKey: 'id',
    columns: [
      { name: 'id', propertyKey: 'id', type: 'string', required: true, isPrimaryKey: true },
      { name: 'category_id', propertyKey: 'categoryId', type: 'string', required: false, isForeignKey: true, foreignKeyTarget: { sheet: SHEET_TABS.CATEGORIES, column: 'id' } },
      { name: 'name', propertyKey: 'name', type: 'string', required: true },
      { name: 'slug', propertyKey: 'slug', type: 'string', required: true },
      { name: 'description', propertyKey: 'description', type: 'string', required: false },
      { name: 'display_order', propertyKey: 'displayOrder', type: 'number', required: false },
      { name: 'is_active', propertyKey: 'isActive', type: 'boolean', required: false },
      { name: 'created_at', propertyKey: 'createdAt', type: 'date', required: true },
      { name: 'updated_at', propertyKey: 'updatedAt', type: 'date', required: false },
    ],
  },

  // 4. SUBTOPICS
  [SHEET_TABS.SUBTOPICS]: {
    sheetName: SHEET_TABS.SUBTOPICS,
    purpose: 'Granular sub-skills nested under topics (e.g. Pipes & Cisterns, Relative Speed)',
    primaryKey: 'id',
    columns: [
      { name: 'id', propertyKey: 'id', type: 'string', required: true, isPrimaryKey: true },
      { name: 'topic_id', propertyKey: 'topicId', type: 'string', required: true, isForeignKey: true, foreignKeyTarget: { sheet: SHEET_TABS.TOPICS, column: 'id' } },
      { name: 'name', propertyKey: 'name', type: 'string', required: true },
      { name: 'slug', propertyKey: 'slug', type: 'string', required: true },
      { name: 'description', propertyKey: 'description', type: 'string', required: false },
      { name: 'notes', propertyKey: 'notes', type: 'string', required: false },
      { name: 'display_order', propertyKey: 'displayOrder', type: 'number', required: false },
      { name: 'is_active', propertyKey: 'isActive', type: 'boolean', required: false },
      { name: 'created_at', propertyKey: 'createdAt', type: 'date', required: true },
      { name: 'updated_at', propertyKey: 'updatedAt', type: 'date', required: false },
    ],
  },

  // 5. QUESTIONS
  [SHEET_TABS.QUESTIONS]: {
    sheetName: SHEET_TABS.QUESTIONS,
    purpose: 'Authoritative question bank repository',
    primaryKey: 'id',
    columns: [
      { name: 'id', propertyKey: 'id', type: 'string', required: true, isPrimaryKey: true },
      { name: 'content_id', propertyKey: 'contentId', type: 'string', required: false },
      { name: 'content_master_id', propertyKey: 'contentMasterId', type: 'string', required: false, isForeignKey: true, foreignKeyTarget: { sheet: SHEET_TABS.CONTENT_MASTERS, column: 'id' } },
      { name: 'category_id', propertyKey: 'categoryId', type: 'string', required: false, isForeignKey: true, foreignKeyTarget: { sheet: SHEET_TABS.CATEGORIES, column: 'id' } },
      { name: 'category_name', propertyKey: 'categoryName', type: 'string', required: false },
      { name: 'topic_id', propertyKey: 'topicId', type: 'string', required: true, isForeignKey: true, foreignKeyTarget: { sheet: SHEET_TABS.TOPICS, column: 'id' } },
      { name: 'topic_name', propertyKey: 'topicName', type: 'string', required: true },
      { name: 'subtopic_id', propertyKey: 'subtopicId', type: 'string', required: true, isForeignKey: true, foreignKeyTarget: { sheet: SHEET_TABS.SUBTOPICS, column: 'id' } },
      { name: 'subtopic_name', propertyKey: 'subtopicName', type: 'string', required: true },
      { name: 'difficulty', propertyKey: 'difficulty', type: 'string', required: true },
      { name: 'language', propertyKey: 'language', type: 'string', required: false },
      { name: 'question_text', propertyKey: 'questionText', type: 'string', required: true },
      { name: 'option_a', propertyKey: 'optionA', type: 'string', required: true },
      { name: 'option_b', propertyKey: 'optionB', type: 'string', required: true },
      { name: 'option_c', propertyKey: 'optionC', type: 'string', required: true },
      { name: 'option_d', propertyKey: 'optionD', type: 'string', required: true },
      { name: 'correct_answer', propertyKey: 'correctAnswer', type: 'string', required: true, allowedValues: ['A', 'B', 'C', 'D'] },
      { name: 'explanation', propertyKey: 'explanation', type: 'string', required: true },
      { name: 'real_world_context', propertyKey: 'realWorldContext', type: 'string', required: false },
      { name: 'real_life_context', propertyKey: 'realLifeContext', type: 'string', required: false },
      { name: 'challenge_type', propertyKey: 'challengeType', type: 'string', required: false },
      { name: 'presentation_type', propertyKey: 'presentationType', type: 'string', required: false },
      { name: 'originality_score', propertyKey: 'originalityScore', type: 'number', required: false },
      { name: 'ai_model', propertyKey: 'aiModel', type: 'string', required: false },
      { name: 'ai_prompt', propertyKey: 'aiPrompt', type: 'string', required: false },
      { name: 'question_style', propertyKey: 'questionStyle', type: 'string', required: false, allowedValues: [...Object.values(QuestionStyle), ...Object.keys(QuestionStyle)] },
      { name: 'status', propertyKey: 'status', type: 'string', required: true, allowedValues: Object.values(QuestionStatus) },
      { name: 'video_status', propertyKey: 'videoStatus', type: 'string', required: true, allowedValues: Object.values(VideoProductionStatus) },
      { name: 'tags', propertyKey: 'tags', type: 'string', required: false }, // stored as comma-separated or JSON string
      { name: 'source', propertyKey: 'source', type: 'string', required: false },
      { name: 'ai_prompt_used', propertyKey: 'aiPromptUsed', type: 'string', required: false },
      { name: 'author_id', propertyKey: 'authorId', type: 'string', required: false },
      { name: 'validation_status', propertyKey: 'validationStatus', type: 'string', required: false },
      { name: 'last_validation_id', propertyKey: 'lastValidationId', type: 'string', required: false },
      { name: 'validation_score', propertyKey: 'validationScore', type: 'number', required: false },
      { name: 'generation_mode', propertyKey: 'generationMode', type: 'string', required: false },
      { name: 'created_at', propertyKey: 'createdAt', type: 'date', required: true },
      { name: 'updated_at', propertyKey: 'updatedAt', type: 'date', required: true },
    ],
  },

  // 6. QUESTION_VIDEOS
  [SHEET_TABS.QUESTION_VIDEOS]: {
    sheetName: SHEET_TABS.QUESTION_VIDEOS,
    purpose: 'Join relationship between Questions and Produced Video Assets',
    primaryKey: 'id',
    columns: [
      { name: 'id', propertyKey: 'id', type: 'string', required: true, isPrimaryKey: true },
      { name: 'question_id', propertyKey: 'questionId', type: 'string', required: true, isForeignKey: true, foreignKeyTarget: { sheet: SHEET_TABS.QUESTIONS, column: 'id' } },
      { name: 'video_id', propertyKey: 'videoId', type: 'string', required: true, isForeignKey: true, foreignKeyTarget: { sheet: SHEET_TABS.VIDEOS, column: 'id' } },
      { name: 'notes', propertyKey: 'notes', type: 'string', required: false },
      { name: 'created_at', propertyKey: 'createdAt', type: 'date', required: true },
    ],
  },

  // 7. VIDEOS
  [SHEET_TABS.VIDEOS]: {
    sheetName: SHEET_TABS.VIDEOS,
    purpose: 'Video production lifecycle and metadata tracking',
    primaryKey: 'id',
    columns: [
      { name: 'id', propertyKey: 'id', type: 'string', required: true, isPrimaryKey: true },
      { name: 'content_id', propertyKey: 'contentId', type: 'string', required: false },
      { name: 'content_master_id', propertyKey: 'contentMasterId', type: 'string', required: false, isForeignKey: true, foreignKeyTarget: { sheet: SHEET_TABS.CONTENT_MASTERS, column: 'id' } },
      { name: 'question_id', propertyKey: 'questionId', type: 'string', required: true, isForeignKey: true, foreignKeyTarget: { sheet: SHEET_TABS.QUESTIONS, column: 'id' } },
      { name: 'title', propertyKey: 'title', type: 'string', required: true },
      { name: 'status', propertyKey: 'status', type: 'string', required: true, allowedValues: Object.values(VideoProductionStatus) },
      { name: 'priority', propertyKey: 'priority', type: 'string', required: true, allowedValues: Object.values(PriorityLevel) },
      { name: 'target_duration_seconds', propertyKey: 'targetDurationSeconds', type: 'number', required: false },
      { name: 'actual_duration_seconds', propertyKey: 'actualDurationSeconds', type: 'number', required: false },
      { name: 'queue_position', propertyKey: 'queuePosition', type: 'number', required: false },
      { name: 'assigned_host', propertyKey: 'assignedHost', type: 'string', required: false },
      { name: 'assigned_editor', propertyKey: 'assignedEditor', type: 'string', required: false },
      { name: 'drive_folder_url', propertyKey: 'driveFolderUrl', type: 'string', required: false },
      { name: 'drive_file_id', propertyKey: 'driveFileId', type: 'string', required: false },
      { name: 'drive_folder_id', propertyKey: 'driveFolderId', type: 'string', required: false },
      { name: 'file_name', propertyKey: 'fileName', type: 'string', required: false },
      { name: 'mime_type', propertyKey: 'mimeType', type: 'string', required: false },
      { name: 'file_size', propertyKey: 'fileSize', type: 'number', required: false },
      { name: 'version', propertyKey: 'version', type: 'number', required: false },
      { name: 'raw_footage_path', propertyKey: 'rawFootagePath', type: 'string', required: false },
      { name: 'final_render_path', propertyKey: 'finalRenderPath', type: 'string', required: false },
      { name: 'final_render_width', propertyKey: 'finalRenderWidth', type: 'number', required: false },
      { name: 'final_render_height', propertyKey: 'finalRenderHeight', type: 'number', required: false },
      { name: 'final_render_format', propertyKey: 'finalRenderFormat', type: 'string', required: false },
      { name: 'final_render_aspect_ratio', propertyKey: 'finalRenderAspectRatio', type: 'string', required: false },
      { name: 'final_render_validation_status', propertyKey: 'finalRenderValidationStatus', type: 'string', required: false },
      { name: 'youtube_id', propertyKey: 'youtubeId', type: 'string', required: false },
      { name: 'scheduled_recording_date', propertyKey: 'scheduledRecordingDate', type: 'string', required: false },
      { name: 'scheduled_publish_date', propertyKey: 'scheduledPublishDate', type: 'string', required: false },
      { name: 'notes', propertyKey: 'notes', type: 'string', required: false },
      { name: 'created_at', propertyKey: 'createdAt', type: 'date', required: true },
      { name: 'updated_at', propertyKey: 'updatedAt', type: 'date', required: true },
    ],
  },

  // 8. SCRIPT
  [SHEET_TABS.SCRIPT]: {
    sheetName: SHEET_TABS.SCRIPT,
    purpose: 'Current active teleprompter script for video production',
    primaryKey: 'id',
    columns: [
      { name: 'id', propertyKey: 'id', type: 'string', required: true, isPrimaryKey: true },
      { name: 'content_id', propertyKey: 'contentId', type: 'string', required: false },
      { name: 'video_id', propertyKey: 'videoId', type: 'string', required: true, isForeignKey: true, foreignKeyTarget: { sheet: SHEET_TABS.VIDEOS, column: 'id' } },
      { name: 'question_id', propertyKey: 'questionId', type: 'string', required: true, isForeignKey: true, foreignKeyTarget: { sheet: SHEET_TABS.QUESTIONS, column: 'id' } },
      { name: 'hook_text', propertyKey: 'hookText', type: 'string', required: true },
      { name: 'problem_statement', propertyKey: 'problemStatement', type: 'string', required: true },
      { name: 'step_by_step_solution', propertyKey: 'stepByStepSolution', type: 'string', required: true },
      { name: 'speed_trick_or_takeaway', propertyKey: 'speedTrickOrTakeaway', type: 'string', required: true },
      { name: 'call_to_action', propertyKey: 'callToAction', type: 'string', required: true },
      { name: 'current_version', propertyKey: 'currentVersion', type: 'number', required: true },
      { name: 'notes', propertyKey: 'notes', type: 'string', required: false },
      { name: 'created_at', propertyKey: 'createdAt', type: 'date', required: true },
      { name: 'updated_at', propertyKey: 'updatedAt', type: 'date', required: true },
    ],
  },

  // 9. SCRIPT_VERSIONS
  [SHEET_TABS.SCRIPT_VERSIONS]: {
    sheetName: SHEET_TABS.SCRIPT_VERSIONS,
    purpose: 'Immutable revision history for scripts',
    primaryKey: 'id',
    columns: [
      { name: 'id', propertyKey: 'id', type: 'string', required: true, isPrimaryKey: true },
      { name: 'script_id', propertyKey: 'scriptId', type: 'string', required: true, isForeignKey: true, foreignKeyTarget: { sheet: SHEET_TABS.SCRIPT, column: 'id' } },
      { name: 'version_number', propertyKey: 'versionNumber', type: 'number', required: true },
      { name: 'content_json', propertyKey: 'contentJson', type: 'json', required: true },
      { name: 'edited_by', propertyKey: 'editedBy', type: 'string', required: true },
      { name: 'change_summary', propertyKey: 'changeSummary', type: 'string', required: false },
      { name: 'created_at', propertyKey: 'createdAt', type: 'date', required: true },
    ],
  },

  // 10. THUMBNAILS
  [SHEET_TABS.THUMBNAILS]: {
    sheetName: SHEET_TABS.THUMBNAILS,
    purpose: 'Current thumbnail asset record and review state',
    primaryKey: 'id',
    columns: [
      { name: 'id', propertyKey: 'id', type: 'string', required: true, isPrimaryKey: true },
      { name: 'content_id', propertyKey: 'contentId', type: 'string', required: false },
      { name: 'video_id', propertyKey: 'videoId', type: 'string', required: true, isForeignKey: true, foreignKeyTarget: { sheet: SHEET_TABS.VIDEOS, column: 'id' } },
      { name: 'hook_headline', propertyKey: 'hookHeadline', type: 'string', required: true },
      { name: 'drive_asset_url', propertyKey: 'driveAssetUrl', type: 'string', required: false },
      { name: 'preview_url', propertyKey: 'previewUrl', type: 'string', required: false },
      { name: 'status', propertyKey: 'status', type: 'string', required: true, allowedValues: ['PENDING', 'DESIGNED', 'APPROVED', 'REJECTED'] },
      { name: 'current_version', propertyKey: 'currentVersion', type: 'number', required: true },
      { name: 'created_at', propertyKey: 'createdAt', type: 'date', required: true },
      { name: 'updated_at', propertyKey: 'updatedAt', type: 'date', required: true },
      // Drive binary metadata columns
      { name: 'drive_file_id', propertyKey: 'driveFileId', type: 'string', required: false },
      { name: 'drive_folder_id', propertyKey: 'driveFolderId', type: 'string', required: false },
      { name: 'drive_folder_url', propertyKey: 'driveFolderUrl', type: 'string', required: false },
      { name: 'file_name', propertyKey: 'fileName', type: 'string', required: false },
      { name: 'mime_type', propertyKey: 'mimeType', type: 'string', required: false },
      { name: 'file_size', propertyKey: 'fileSize', type: 'number', required: false },
    ],
  },

  // 11. THUMBNAIL_VERSIONS
  [SHEET_TABS.THUMBNAIL_VERSIONS]: {
    sheetName: SHEET_TABS.THUMBNAIL_VERSIONS,
    purpose: 'Immutable revision history for thumbnail mockups',
    primaryKey: 'id',
    columns: [
      { name: 'id', propertyKey: 'id', type: 'string', required: true, isPrimaryKey: true },
      { name: 'thumbnail_id', propertyKey: 'thumbnailId', type: 'string', required: true, isForeignKey: true, foreignKeyTarget: { sheet: SHEET_TABS.THUMBNAILS, column: 'id' } },
      { name: 'version_number', propertyKey: 'versionNumber', type: 'number', required: true },
      { name: 'drive_asset_url', propertyKey: 'driveAssetUrl', type: 'string', required: true },
      { name: 'designer_notes', propertyKey: 'designerNotes', type: 'string', required: false },
      { name: 'created_at', propertyKey: 'createdAt', type: 'date', required: true },
      // Drive binary metadata columns
      { name: 'drive_file_id', propertyKey: 'driveFileId', type: 'string', required: false },
    ],
  },

  // 12. PINNED_COMMENTS
  [SHEET_TABS.PINNED_COMMENTS]: {
    sheetName: SHEET_TABS.PINNED_COMMENTS,
    purpose: 'Current pinned solution and engagement comment for social platforms',
    primaryKey: 'id',
    columns: [
      { name: 'id', propertyKey: 'id', type: 'string', required: true, isPrimaryKey: true },
      { name: 'content_id', propertyKey: 'contentId', type: 'string', required: false },
      { name: 'video_id', propertyKey: 'videoId', type: 'string', required: true, isForeignKey: true, foreignKeyTarget: { sheet: SHEET_TABS.VIDEOS, column: 'id' } },
      { name: 'comment_text', propertyKey: 'commentText', type: 'string', required: true },
      { name: 'solution_breakdown', propertyKey: 'solutionBreakdown', type: 'string', required: true },
      { name: 'next_challenge_question', propertyKey: 'nextChallengeQuestion', type: 'string', required: false },
      { name: 'is_approved', propertyKey: 'isApproved', type: 'boolean', required: true },
      { name: 'created_at', propertyKey: 'createdAt', type: 'date', required: true },
      { name: 'updated_at', propertyKey: 'updatedAt', type: 'date', required: true },
    ],
  },

  // 13. PINNED_COMMENT_VERSIONS
  [SHEET_TABS.PINNED_COMMENT_VERSIONS]: {
    sheetName: SHEET_TABS.PINNED_COMMENT_VERSIONS,
    purpose: 'Revision history for pinned comments',
    primaryKey: 'id',
    columns: [
      { name: 'id', propertyKey: 'id', type: 'string', required: true, isPrimaryKey: true },
      { name: 'pinned_comment_id', propertyKey: 'pinnedCommentId', type: 'string', required: true, isForeignKey: true, foreignKeyTarget: { sheet: SHEET_TABS.PINNED_COMMENTS, column: 'id' } },
      { name: 'version_number', propertyKey: 'versionNumber', type: 'number', required: true },
      { name: 'comment_text', propertyKey: 'commentText', type: 'string', required: true },
      { name: 'created_at', propertyKey: 'createdAt', type: 'date', required: true },
    ],
  },

  // 14. WORKFLOW
  [SHEET_TABS.WORKFLOW]: {
    sheetName: SHEET_TABS.WORKFLOW,
    purpose: 'State machine lifecycle transitions log',
    primaryKey: 'id',
    columns: [
      { name: 'id', propertyKey: 'id', type: 'string', required: true, isPrimaryKey: true },
      { name: 'entity_type', propertyKey: 'entityType', type: 'string', required: true, allowedValues: ['QUESTION', 'VIDEO', 'SCRIPT', 'PUBLISHING'] },
      { name: 'entity_id', propertyKey: 'entityId', type: 'string', required: true },
      { name: 'from_status', propertyKey: 'fromStatus', type: 'string', required: true },
      { name: 'to_status', propertyKey: 'toStatus', type: 'string', required: true },
      { name: 'triggered_by', propertyKey: 'triggeredBy', type: 'string', required: true },
      { name: 'remarks', propertyKey: 'remarks', type: 'string', required: false },
      { name: 'timestamp', propertyKey: 'timestamp', type: 'date', required: true },
    ],
  },

  // 15. ASSIGNMENTS
  [SHEET_TABS.ASSIGNMENTS]: {
    sheetName: SHEET_TABS.ASSIGNMENTS,
    purpose: 'Task assignments for filming, editing, scripting, thumbnail, planning, reviews, and publishing',
    primaryKey: 'id',
    columns: [
      { name: 'id', propertyKey: 'id', type: 'string', required: true, isPrimaryKey: true },
      { name: 'entity_type', propertyKey: 'entityType', type: 'string', required: false, allowedValues: ['QUESTION', 'VIDEO', 'SCRIPT', 'THUMBNAIL', 'PUBLISHING', 'CONTENT_PLAN', 'CONTENT_BATCH'] },
      { name: 'entity_id', propertyKey: 'entityId', type: 'string', required: false },
      { name: 'video_id', propertyKey: 'videoId', type: 'string', required: false },
      { name: 'task_type', propertyKey: 'taskType', type: 'string', required: true },
      { name: 'assignment_role', propertyKey: 'assignmentRole', type: 'string', required: false },
      { name: 'assignee_id', propertyKey: 'assigneeId', type: 'string', required: true },
      { name: 'assignee_name', propertyKey: 'assigneeName', type: 'string', required: true },
      { name: 'status', propertyKey: 'status', type: 'string', required: true, allowedValues: ['ASSIGNED', 'IN_PROGRESS', 'BLOCKED', 'COMPLETED', 'CANCELLED', 'PENDING'] },
      { name: 'priority', propertyKey: 'priority', type: 'string', required: false, allowedValues: ['LOW', 'NORMAL', 'MEDIUM', 'HIGH', 'URGENT'] },
      { name: 'assigned_at', propertyKey: 'assignedAt', type: 'date', required: false },
      { name: 'due_date', propertyKey: 'dueDate', type: 'string', required: false },
      { name: 'completed_at', propertyKey: 'completedAt', type: 'date', required: false },
      { name: 'notes', propertyKey: 'notes', type: 'string', required: false },
      { name: 'created_at', propertyKey: 'createdAt', type: 'date', required: true },
      { name: 'updated_at', propertyKey: 'updatedAt', type: 'date', required: false },
    ],
  },

  // 16. PUBLISHING
  [SHEET_TABS.PUBLISHING]: {
    sheetName: SHEET_TABS.PUBLISHING,
    purpose: 'Multi-platform manual distribution status tracking (YouTube, Instagram, Facebook)',
    primaryKey: 'id',
    columns: [
      { name: 'id', propertyKey: 'id', type: 'string', required: true, isPrimaryKey: true },
      { name: 'content_id', propertyKey: 'contentId', type: 'string', required: false },
      { name: 'video_id', propertyKey: 'videoId', type: 'string', required: true, isForeignKey: true, foreignKeyTarget: { sheet: SHEET_TABS.VIDEOS, column: 'id' } },
      { name: 'question_id', propertyKey: 'questionId', type: 'string', required: true, isForeignKey: true, foreignKeyTarget: { sheet: SHEET_TABS.QUESTIONS, column: 'id' } },
      { name: 'video_title', propertyKey: 'videoTitle', type: 'string', required: true },
      { name: 'final_video_status', propertyKey: 'finalVideoStatus', type: 'string', required: true, allowedValues: ['READY', 'RENDERED', 'VERIFIED'] },
      { name: 'youtube_status', propertyKey: 'youtubeStatus', type: 'string', required: true, allowedValues: Object.values(SocialPublishStatus) },
      { name: 'youtube_url', propertyKey: 'youtubeUrl', type: 'string', required: false },
      { name: 'youtube_published_at', propertyKey: 'youtubePublishedAt', type: 'string', required: false },
      { name: 'youtube_scheduled_at', propertyKey: 'youtubeScheduledAt', type: 'string', required: false },
      { name: 'youtube_last_failure_reason', propertyKey: 'youtubeLastFailureReason', type: 'string', required: false },
      { name: 'youtube_retry_count', propertyKey: 'youtubeRetryCount', type: 'number', required: false },
      { name: 'youtube_failed_at', propertyKey: 'youtubeFailedAt', type: 'string', required: false },
      { name: 'instagram_status', propertyKey: 'instagramStatus', type: 'string', required: true, allowedValues: Object.values(SocialPublishStatus) },
      { name: 'instagram_url', propertyKey: 'instagramUrl', type: 'string', required: false },
      { name: 'instagram_published_at', propertyKey: 'instagramPublishedAt', type: 'string', required: false },
      { name: 'instagram_scheduled_at', propertyKey: 'instagramScheduledAt', type: 'string', required: false },
      { name: 'instagram_last_failure_reason', propertyKey: 'instagramLastFailureReason', type: 'string', required: false },
      { name: 'instagram_retry_count', propertyKey: 'instagramRetryCount', type: 'number', required: false },
      { name: 'instagram_failed_at', propertyKey: 'instagramFailedAt', type: 'string', required: false },
      { name: 'facebook_status', propertyKey: 'facebookStatus', type: 'string', required: true, allowedValues: Object.values(SocialPublishStatus) },
      { name: 'facebook_url', propertyKey: 'facebookUrl', type: 'string', required: false },
      { name: 'facebook_published_at', propertyKey: 'facebookPublishedAt', type: 'string', required: false },
      { name: 'facebook_scheduled_at', propertyKey: 'facebookScheduledAt', type: 'string', required: false },
      { name: 'facebook_last_failure_reason', propertyKey: 'facebookLastFailureReason', type: 'string', required: false },
      { name: 'facebook_retry_count', propertyKey: 'facebookRetryCount', type: 'number', required: false },
      { name: 'facebook_failed_at', propertyKey: 'facebookFailedAt', type: 'string', required: false },
      { name: 'pinned_comment_ready', propertyKey: 'pinnedCommentReady', type: 'boolean', required: true },
      { name: 'thumbnail_ready', propertyKey: 'thumbnailReady', type: 'boolean', required: true },
      { name: 'completed_platforms_count', propertyKey: 'completedPlatformsCount', type: 'number', required: true },
      { name: 'total_platforms_count', propertyKey: 'totalPlatformsCount', type: 'number', required: true },
      { name: 'created_at', propertyKey: 'createdAt', type: 'date', required: true },
      { name: 'updated_at', propertyKey: 'updatedAt', type: 'date', required: true },
    ],
  },

  // 17. AUDIT_LOG
  [SHEET_TABS.AUDIT_LOG]: {
    sheetName: SHEET_TABS.AUDIT_LOG,
    purpose: 'Administrative audit trail recording mutations and state changes',
    primaryKey: 'id',
    columns: [
      { name: 'id', propertyKey: 'id', type: 'string', required: true, isPrimaryKey: true },
      { name: 'timestamp', propertyKey: 'timestamp', type: 'date', required: true },
      { name: 'actor_id', propertyKey: 'actorId', type: 'string', required: true },
      { name: 'actor_name', propertyKey: 'actorName', type: 'string', required: true },
      { name: 'action', propertyKey: 'action', type: 'string', required: true },
      { name: 'entity_type', propertyKey: 'entityType', type: 'string', required: true },
      { name: 'entity_id', propertyKey: 'entityId', type: 'string', required: true },
      { name: 'details', propertyKey: 'details', type: 'string', required: false },
    ],
  },

  // 18. SOCIAL_REVIEWS
  [SHEET_TABS.SOCIAL_REVIEWS]: {
    sheetName: SHEET_TABS.SOCIAL_REVIEWS,
    purpose: 'Human review decisions and feedback history for social content packages',
    primaryKey: 'id',
    columns: [
      { name: 'id', propertyKey: 'id', type: 'string', required: true, isPrimaryKey: true },
      { name: 'content_id', propertyKey: 'contentId', type: 'string', required: false },
      { name: 'question_id', propertyKey: 'questionId', type: 'string', required: true, isForeignKey: true, foreignKeyTarget: { sheet: SHEET_TABS.QUESTIONS, column: 'id' } },
      { name: 'content_master_id', propertyKey: 'contentMasterId', type: 'string', required: false },
      { name: 'reviewed_version_hash', propertyKey: 'reviewedVersionHash', type: 'string', required: true },
      { name: 'reviewer_id', propertyKey: 'reviewerId', type: 'string', required: true },
      { name: 'reviewer_name', propertyKey: 'reviewerName', type: 'string', required: true },
      { name: 'reviewer_role', propertyKey: 'reviewerRole', type: 'string', required: true },
      { name: 'decision', propertyKey: 'decision', type: 'string', required: true },
      { name: 'reason', propertyKey: 'reason', type: 'string', required: false },
      { name: 'feedback_categories', propertyKey: 'feedbackCategories', type: 'json', required: false },
      { name: 'overall_quality_score_at_review', propertyKey: 'overallQualityScoreAtReview', type: 'number', required: false },
      { name: 'quality_status_at_review', propertyKey: 'qualityStatusAtReview', type: 'string', required: false },
      { name: 'is_admin_override', propertyKey: 'isAdminOverride', type: 'boolean', required: false },
      { name: 'reviewed_at', propertyKey: 'reviewedAt', type: 'date', required: true },
    ],
  },

  // 18. SEQUENCES
  [SHEET_TABS.SEQUENCES]: {
    sheetName: SHEET_TABS.SEQUENCES,
    purpose: 'Source of truth for permanent unique auto-incrementing domain IDs',
    primaryKey: 'entity_type',
    columns: [
      { name: 'entity_type', propertyKey: 'entityType', type: 'string', required: true, isPrimaryKey: true },
      { name: 'next_number', propertyKey: 'nextNumber', type: 'number', required: true },
      { name: 'prefix', propertyKey: 'prefix', type: 'string', required: false },
      { name: 'pad_length', propertyKey: 'padLength', type: 'number', required: false },
      { name: 'updated_at', propertyKey: 'updatedAt', type: 'date', required: false },
    ],
  },

  // 19. CONTENT_PLANS (Phase 9)
  [PLANNING_SHEET_TABS.CONTENT_PLANS]: {
    sheetName: PLANNING_SHEET_TABS.CONTENT_PLANS,
    purpose: 'Strategic content production target records',
    primaryKey: 'id',
    columns: [
      { name: 'id', propertyKey: 'id', type: 'string', required: true, isPrimaryKey: true },
      { name: 'category_id', propertyKey: 'categoryId', type: 'string', required: false },
      { name: 'category_name', propertyKey: 'categoryName', type: 'string', required: false },
      { name: 'topic_id', propertyKey: 'topicId', type: 'string', required: true },
      { name: 'topic_name', propertyKey: 'topicName', type: 'string', required: true },
      { name: 'subtopic_id', propertyKey: 'subtopicId', type: 'string', required: true },
      { name: 'subtopic_name', propertyKey: 'subtopicName', type: 'string', required: true },
      { name: 'difficulty', propertyKey: 'difficulty', type: 'string', required: true, allowedValues: ['EASY', 'MEDIUM', 'HARD'] },
      { name: 'language', propertyKey: 'language', type: 'string', required: true, allowedValues: ['ENGLISH', 'TELUGU'] },
      { name: 'target_question_count', propertyKey: 'targetQuestionCount', type: 'number', required: true },
      { name: 'real_world_context', propertyKey: 'realWorldContext', type: 'string', required: false },
      { name: 'question_style', propertyKey: 'questionStyle', type: 'string', required: false },
      { name: 'priority', propertyKey: 'priority', type: 'string', required: true, allowedValues: ['LOW', 'NORMAL', 'MEDIUM', 'HIGH', 'URGENT'] },
      { name: 'planned_date', propertyKey: 'plannedDate', type: 'string', required: true },
      { name: 'status', propertyKey: 'status', type: 'string', required: true, allowedValues: ['DRAFT', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] },
      { name: 'notes', propertyKey: 'notes', type: 'string', required: false },
      { name: 'created_at', propertyKey: 'createdAt', type: 'date', required: true },
      { name: 'updated_at', propertyKey: 'updatedAt', type: 'date', required: true },
    ],
  },

  // 20. CONTENT_BATCHES (Phase 9)
  [PLANNING_SHEET_TABS.CONTENT_BATCHES]: {
    sheetName: PLANNING_SHEET_TABS.CONTENT_BATCHES,
    purpose: 'Production batch sprints grouping questions for execution',
    primaryKey: 'id',
    columns: [
      { name: 'id', propertyKey: 'id', type: 'string', required: true, isPrimaryKey: true },
      { name: 'name', propertyKey: 'name', type: 'string', required: true },
      { name: 'description', propertyKey: 'description', type: 'string', required: false },
      { name: 'plan_id', propertyKey: 'planId', type: 'string', required: true },
      { name: 'target_count', propertyKey: 'targetCount', type: 'number', required: true },
      { name: 'priority', propertyKey: 'priority', type: 'string', required: true, allowedValues: ['LOW', 'NORMAL', 'MEDIUM', 'HIGH', 'URGENT'] },
      { name: 'planned_date', propertyKey: 'plannedDate', type: 'string', required: true },
      { name: 'status', propertyKey: 'status', type: 'string', required: true, allowedValues: ['PLANNED', 'ACTIVE', 'REVIEW', 'COMPLETED', 'CANCELLED'] },
      { name: 'question_ids', propertyKey: 'questionIds', type: 'json', required: false },
      { name: 'created_at', propertyKey: 'createdAt', type: 'date', required: true },
      { name: 'updated_at', propertyKey: 'updatedAt', type: 'date', required: true },
    ],
  },

  // 21. QUESTION_VALIDATIONS (Phase 5: Question Validation Engine)
  [SHEET_TABS.QUESTION_VALIDATIONS]: {
    sheetName: SHEET_TABS.QUESTION_VALIDATIONS,
    purpose: 'Question verification and quality gate audit records',
    primaryKey: 'id',
    columns: [
      { name: 'id', propertyKey: 'id', type: 'string', required: true, isPrimaryKey: true },
      { name: 'question_id', propertyKey: 'questionId', type: 'string', required: true, isForeignKey: true, foreignKeyTarget: { sheet: SHEET_TABS.QUESTIONS, column: 'id' } },
      { name: 'status', propertyKey: 'status', type: 'string', required: true },
      { name: 'confidence_score', propertyKey: 'confidenceScore', type: 'number', required: true },
      { name: 'validator_version', propertyKey: 'validatorVersion', type: 'string', required: true },
      { name: 'validation_rule_version', propertyKey: 'validationRuleVersion', type: 'string', required: true },
      { name: 'source', propertyKey: 'source', type: 'string', required: true },
      { name: 'summary', propertyKey: 'summary', type: 'string', required: true },
      { name: 'checks_json', propertyKey: 'checksJson', type: 'string', required: false },
      { name: 'errors_json', propertyKey: 'errorsJson', type: 'string', required: false },
      { name: 'warnings_json', propertyKey: 'warningsJson', type: 'string', required: false },
      { name: 'recommendations_json', propertyKey: 'recommendationsJson', type: 'string', required: false },
      { name: 'details_json', propertyKey: 'detailsJson', type: 'string', required: false },
      { name: 'is_stale', propertyKey: 'isStale', type: 'boolean', required: false },
      { name: 'validated_by', propertyKey: 'validatedBy', type: 'string', required: false },
      { name: 'created_at', propertyKey: 'createdAt', type: 'date', required: true },
      { name: 'updated_at', propertyKey: 'updatedAt', type: 'date', required: true },
    ],
  },

  // 22. QUESTION_CONFIG (Question Studio Creator-Managed Configuration)
  [SHEET_TABS.QUESTION_CONFIG]: {
    sheetName: SHEET_TABS.QUESTION_CONFIG,
    purpose: 'Creator-managed configuration catalogue and prompt guidance metadata',
    primaryKey: 'id',
    columns: [
      { name: 'id', propertyKey: 'id', type: 'string', required: true, isPrimaryKey: true },
      { name: 'dimension', propertyKey: 'dimension', type: 'string', required: true },
      { name: 'code', propertyKey: 'code', type: 'string', required: true },
      { name: 'display_label', propertyKey: 'displayLabel', type: 'string', required: true },
      { name: 'description', propertyKey: 'description', type: 'string', required: false },
      { name: 'ai_prompt_guidance', propertyKey: 'aiPromptGuidance', type: 'string', required: false },
      { name: 'sort_order', propertyKey: 'sortOrder', type: 'number', required: true },
      { name: 'is_active', propertyKey: 'isActive', type: 'boolean', required: true },
      { name: 'is_default', propertyKey: 'isDefault', type: 'boolean', required: true },
      { name: 'updated_at', propertyKey: 'updatedAt', type: 'date', required: true },
    ],
  },
};

// ============================================================================
// 4. ZOD RUNTIME VALIDATION SCHEMAS
// ============================================================================

export const QuestionConfigEntryZodSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  dimension: z.enum(['REAL_LIFE_CONTEXT', 'QUESTION_STYLE']),
  code: z.string().min(1, 'Code is required'),
  displayLabel: z.string().min(1, 'Display label is required'),
  description: z.string().optional(),
  aiPromptGuidance: z.string().optional(),
  sortOrder: z.number().int().default(0),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  updatedAt: z.string().optional(),
});

export type QuestionConfigEntryZodInput = z.infer<typeof QuestionConfigEntryZodSchema>;

export const CreateQuestionInputSchema = z.object({
  contentId: z.string().optional(),
  contentMasterId: z.string().optional(),
  categoryId: z.string().optional(),
  categoryName: z.string().optional(),
  topicId: z.string().min(1, 'Topic ID is required'),
  topicName: z.string().optional(),
  subtopicId: z.string().min(1, 'Subtopic ID is required'),
  subtopicName: z.string().optional(),
  difficulty: z.union([z.nativeEnum(DifficultyLevel), z.string()]),
  language: z.string().optional().default('TELUGU'),
  questionText: z.string().min(5, 'Question text must be at least 5 characters'),
  options: z.object({
    a: z.string().min(1, 'Option A is required'),
    b: z.string().min(1, 'Option B is required'),
    c: z.string().min(1, 'Option C is required'),
    d: z.string().min(1, 'Option D is required'),
  }),
  correctAnswer: z.enum(['A', 'B', 'C', 'D']),
  explanation: z.string().min(5, 'Explanation must be at least 5 characters'),
  realWorldContext: z.string().optional(),
  realLifeContext: z.string().optional(),
  challengeType: z.string().optional(),
  presentationType: z.string().optional(),
  questionStyle: z.union([z.nativeEnum(QuestionStyle), z.string()]).optional(),
  status: z.nativeEnum(QuestionStatus).optional().default(QuestionStatus.GENERATED),
  videoStatus: z.nativeEnum(VideoProductionStatus).optional().default(VideoProductionStatus.NOT_STARTED),
  tags: z.array(z.string()).optional().default([]),
  source: z.string().optional(),
  aiPromptUsed: z.string().optional(),
  aiModel: z.string().optional(),
  aiPrompt: z.string().optional(),
  originalityScore: z.number().optional(),
  authorId: z.string().optional(),
  generationMode: z.string().optional(),
});

export type CreateQuestionInput = z.input<typeof CreateQuestionInputSchema>;
export type CreateQuestionOutput = z.infer<typeof CreateQuestionInputSchema>;

export const UpdateQuestionInputSchema = CreateQuestionInputSchema.partial().extend({
  id: z.string().min(1, 'Question ID is required for updates'),
});

export type UpdateQuestionInput = z.infer<typeof UpdateQuestionInputSchema>;

export const QuestionFilterSchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  topicId: z.string().optional(),
  subtopicId: z.string().optional(),
  difficulty: z.nativeEnum(DifficultyLevel).optional(),
  status: z.nativeEnum(QuestionStatus).optional(),
  videoStatus: z.nativeEnum(VideoProductionStatus).optional(),
});

export type QuestionFilterInput = z.infer<typeof QuestionFilterSchema>;

// Video Validation Schemas (Phase 5)
export const QueueVideoInputSchema = z.object({
  questionId: z.string().min(1, 'Question ID is required'),
  title: z.string().optional(),
  priority: z.nativeEnum(PriorityLevel).optional().default(PriorityLevel.NORMAL),
  assignedHost: z.string().optional(),
  assignedEditor: z.string().optional(),
  notes: z.string().optional(),
  targetDurationSeconds: z.number().positive().optional().default(45),
});

export type QueueVideoInput = z.infer<typeof QueueVideoInputSchema>;

export const UpdateVideoStatusInputSchema = z.object({
  status: z.nativeEnum(VideoProductionStatus),
  remarks: z.string().optional(),
  actualDurationSeconds: z.number().positive().optional(),
});

export type UpdateVideoStatusInput = z.infer<typeof UpdateVideoStatusInputSchema>;

export const UpdateVideoPriorityInputSchema = z.object({
  priority: z.nativeEnum(PriorityLevel),
  remarks: z.string().optional(),
});

export type UpdateVideoPriorityInput = z.infer<typeof UpdateVideoPriorityInputSchema>;

export const AssignVideoInputSchema = z.object({
  assigneeId: z.string().min(1, 'Assignee ID is required'),
  assigneeName: z.string().min(1, 'Assignee Name is required'),
  taskType: z.enum(['SCRIPTING', 'RECORDING', 'EDITING', 'THUMBNAIL', 'REVIEW']).optional().default('RECORDING'),
  dueDate: z.string().optional(),
  notes: z.string().optional(),
});

export type AssignVideoInput = z.infer<typeof AssignVideoInputSchema>;

export const UpdateVideoMetadataInputSchema = z.object({
  title: z.string().min(1).optional(),
  notes: z.string().optional(),
  targetDurationSeconds: z.number().positive().optional(),
  actualDurationSeconds: z.number().positive().optional(),
  assignedHost: z.string().optional(),
  assignedEditor: z.string().optional(),
  driveFolderUrl: z.string().optional(),
  rawFootagePath: z.string().optional(),
  finalRenderPath: z.string().optional(),
  finalRenderWidth: z.number().positive().optional(),
  finalRenderHeight: z.number().positive().optional(),
  finalRenderFormat: z.string().optional(),
  finalRenderAspectRatio: z.string().optional(),
  finalRenderValidationStatus: z.enum(['NOT_VALIDATED', 'VALID', 'INVALID', 'NEEDS_REVIEW']).optional(),
  youtubeId: z.string().optional(),
  scheduledRecordingDate: z.string().optional(),
  scheduledPublishDate: z.string().optional(),
});

export type UpdateVideoMetadataInput = z.infer<typeof UpdateVideoMetadataInputSchema>;

export const VideoFilterSchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  topicId: z.string().optional(),
  difficulty: z.nativeEnum(DifficultyLevel).optional(),
  status: z.nativeEnum(VideoProductionStatus).optional(),
  priority: z.nativeEnum(PriorityLevel).optional(),
  assignedHost: z.string().optional(),
  assignedEditor: z.string().optional(),
});

export type VideoFilterInput = z.infer<typeof VideoFilterSchema>;

// ============================================================================
// 5. PHASE 6 VALIDATION SCHEMAS (Script, Thumbnail, Pinned Comment, Publishing)
// ============================================================================

export const SaveScriptInputSchema = z.object({
  hookText: z.string().default(''),
  problemStatement: z.string().default(''),
  stepByStepSolution: z.string().default(''),
  speedTrickOrTakeaway: z.string().default(''),
  callToAction: z.string().default(''),
  notes: z.string().optional(),
  createNewVersion: z.boolean().optional().default(false),
  changeSummary: z.string().optional(),
  editedBy: z.string().optional(),
});

export type SaveScriptInput = z.infer<typeof SaveScriptInputSchema>;

export const SaveThumbnailInputSchema = z.object({
  hookHeadline: z.string().min(1, 'Hook headline is required'),
  driveAssetUrl: z.string().optional(),
  previewUrl: z.string().optional(),
  status: z.enum(['PENDING', 'DESIGNED', 'APPROVED', 'REJECTED']).optional().default('PENDING'),
  createNewVersion: z.boolean().optional().default(false),
  designerNotes: z.string().optional(),
});

export type SaveThumbnailInput = z.infer<typeof SaveThumbnailInputSchema>;

export const SavePinnedCommentInputSchema = z.object({
  commentText: z.string().min(1, 'Comment text is required'),
  solutionBreakdown: z.string().min(1, 'Solution breakdown is required'),
  nextChallengeQuestion: z.string().optional(),
  isApproved: z.boolean().optional().default(false),
});

export type SavePinnedCommentInput = z.infer<typeof SavePinnedCommentInputSchema>;

export const UpdatePublishingInputSchema = z.object({
  youtube: z.object({
    status: z.nativeEnum(SocialPublishStatus).optional(),
    videoUrl: z.string().optional(),
    publishedAt: z.string().optional(),
    notes: z.string().optional(),
  }).optional(),
  instagram: z.object({
    status: z.nativeEnum(SocialPublishStatus).optional(),
    postUrl: z.string().optional(),
    publishedAt: z.string().optional(),
    notes: z.string().optional(),
  }).optional(),
  facebook: z.object({
    status: z.nativeEnum(SocialPublishStatus).optional(),
    postUrl: z.string().optional(),
    publishedAt: z.string().optional(),
    notes: z.string().optional(),
  }).optional(),
  pinnedCommentReady: z.boolean().optional(),
  thumbnailReady: z.boolean().optional(),
});

export type UpdatePublishingInput = z.infer<typeof UpdatePublishingInputSchema>;

// ============================================================================
// 6. PHASE 9 VALIDATION SCHEMAS (Content Planning, Batches, AI Assistant)
// ============================================================================

export const CreateContentPlanInputSchema = z.object({
  categoryId: z.string().min(1, 'Category ID is required'),
  categoryName: z.string().optional(),
  topicId: z.string().min(1, 'Topic ID is required'),
  topicName: z.string().optional(),
  subtopicId: z.string().min(1, 'Subtopic ID is required'),
  subtopicName: z.string().optional(),
  difficulty: z.nativeEnum(DifficultyLevel),
  language: z.nativeEnum(QuestionLanguage).optional().default(QuestionLanguage.TELUGU),
  targetQuestionCount: z.number().int().min(1, 'Target question count must be at least 1').max(500, 'Target question count cannot exceed 500'),
  realWorldContext: z.string().optional(),
  questionStyle: z.nativeEnum(QuestionStyle).optional(),
  priority: z.nativeEnum(PriorityLevel).optional().default(PriorityLevel.NORMAL),
  plannedDate: z.string().min(1, 'Planned date is required'),
  notes: z.string().optional(),
});

export type CreateContentPlanInput = z.infer<typeof CreateContentPlanInputSchema>;

export const UpdateContentPlanInputSchema = z.object({
  targetQuestionCount: z.number().int().min(1).max(500).optional(),
  difficulty: z.nativeEnum(DifficultyLevel).optional(),
  language: z.nativeEnum(QuestionLanguage).optional(),
  realWorldContext: z.string().optional(),
  questionStyle: z.nativeEnum(QuestionStyle).optional(),
  priority: z.nativeEnum(PriorityLevel).optional(),
  plannedDate: z.string().optional(),
  status: z.nativeEnum(ContentPlanStatus).optional(),
  notes: z.string().optional(),
});

export type UpdateContentPlanInput = z.infer<typeof UpdateContentPlanInputSchema>;

export const CreateContentBatchInputSchema = z.object({
  name: z.string().min(1, 'Batch name is required'),
  description: z.string().optional(),
  planId: z.string().min(1, 'Linked content plan ID is required'),
  targetCount: z.number().int().min(1, 'Target count must be at least 1').max(200, 'Target count cannot exceed 200'),
  priority: z.nativeEnum(PriorityLevel).optional().default(PriorityLevel.NORMAL),
  plannedDate: z.string().min(1, 'Planned date is required'),
  questionIds: z.array(z.string()).optional().default([]),
});

export type CreateContentBatchInput = z.infer<typeof CreateContentBatchInputSchema>;

export const UpdateContentBatchInputSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  targetCount: z.number().int().min(1).max(200).optional(),
  priority: z.nativeEnum(PriorityLevel).optional(),
  plannedDate: z.string().optional(),
  status: z.nativeEnum(ContentBatchStatus).optional(),
  questionIds: z.array(z.string()).optional(),
});

export type UpdateContentBatchInput = z.infer<typeof UpdateContentBatchInputSchema>;

export const LinkBatchQuestionsInputSchema = z.object({
  questionIds: z.array(z.string()).min(1, 'At least one Question ID is required'),
  action: z.enum(['ADD', 'REMOVE', 'SET']).optional().default('ADD'),
});

export type LinkBatchQuestionsInput = z.infer<typeof LinkBatchQuestionsInputSchema>;

export const AiContentPlanRequestSchema = z.object({
  categoryId: z.string().min(1, 'Category ID is required'),
  topicId: z.string().optional(),
  targetTotalCount: z.number().int().min(5, 'Target total count must be at least 5').max(100, 'Target count capped at 100 per recommendation').default(20),
  language: z.nativeEnum(QuestionLanguage).optional().default(QuestionLanguage.TELUGU),
  preferredDifficulties: z.array(z.nativeEnum(DifficultyLevel)).optional(),
  focusContext: z.string().optional(),
});

export type AiContentPlanRequest = z.infer<typeof AiContentPlanRequestSchema>;

// ============================================================================
// 7. PHASE 10 VALIDATION SCHEMAS (Team Operations & Assignments)
// ============================================================================

export const AssignmentEntityTypeSchema = z.enum([
  'QUESTION',
  'VIDEO',
  'SCRIPT',
  'THUMBNAIL',
  'PUBLISHING',
  'CONTENT_PLAN',
  'CONTENT_BATCH',
]);

export const CreateAssignmentInputSchema = z.object({
  entityType: z.union([z.nativeEnum(AssignmentEntityType), AssignmentEntityTypeSchema, z.string()]),
  entityId: z.string().min(1, 'Entity ID is required'),
  assigneeId: z.string().min(1, 'Assignee ID is required'),
  assignmentRole: z.string().optional(),
  taskType: z.string().min(1, 'Task type is required'),
  priority: z.nativeEnum(PriorityLevel).optional().default(PriorityLevel.NORMAL),
  dueDate: z.string().optional(),
  dueAt: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateAssignmentInput = z.infer<typeof CreateAssignmentInputSchema>;

export const UpdateAssignmentInputSchema = z.object({
  taskType: z.string().optional(),
  status: z.string().optional(),
  priority: z.nativeEnum(PriorityLevel).optional(),
  dueDate: z.string().optional(),
  dueAt: z.string().optional(),
  notes: z.string().optional(),
});

export type UpdateAssignmentInput = z.infer<typeof UpdateAssignmentInputSchema>;

export const ReassignAssignmentInputSchema = z.object({
  newAssigneeId: z.string().min(1, 'New assignee ID is required'),
  notes: z.string().optional(),
});

export type ReassignAssignmentInput = z.infer<typeof ReassignAssignmentInputSchema>;

export const CompleteAssignmentInputSchema = z.object({
  notes: z.string().optional(),
});

export type CompleteAssignmentInput = z.infer<typeof CompleteAssignmentInputSchema>;

export const CancelAssignmentInputSchema = z.object({
  reason: z.string().optional(),
});

export type CancelAssignmentInput = z.infer<typeof CancelAssignmentInputSchema>;

export const CreateUserInputSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  role: z.string().optional(),
  roles: z.array(z.string()).optional(),
  avatarUrl: z.string().optional(),
  isActive: z.boolean().optional().default(true),
  password_hash: z.string().optional(),
  last_login_at: z.string().optional(),
}).refine((data) => data.role || (data.roles && data.roles.length > 0), {
  message: 'At least one role or roles array is required',
  path: ['roles'],
});

export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;

export const UpdateUserInputSchema = z.object({
  name: z.string().optional(),
  email: z.string().email().optional(),
  role: z.string().optional(),
  roles: z.array(z.string()).optional(),
  avatarUrl: z.string().optional(),
  isActive: z.boolean().optional(),
  password_hash: z.string().optional(),
  last_login_at: z.string().optional(),
});

export type UpdateUserInput = z.infer<typeof UpdateUserInputSchema>;

export const CreateContentMasterInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  status: z.union([z.nativeEnum(ContentMasterStatus), z.string()]).optional().default(ContentMasterStatus.ACTIVE),
  primaryQuestionId: z.string().optional(),
  categoryId: z.string().optional(),
  topicId: z.string().optional(),
  subtopicId: z.string().optional(),
  createdBy: z.string().optional(),
});

export type CreateContentMasterInput = z.input<typeof CreateContentMasterInputSchema>;

export const UpdateContentMasterInputSchema = CreateContentMasterInputSchema.partial().extend({
  id: z.string().min(1, 'Content Master ID is required for update'),
  archivedAt: z.string().optional(),
});

export type UpdateContentMasterInput = z.infer<typeof UpdateContentMasterInputSchema>;

// ----------------------------------------------------
// Taxonomy Zod Input Schemas (Task 3 Canonical Taxonomy Engine)
// ----------------------------------------------------

export const CreateTopicInputSchema = z.object({
  name: z.string().min(1, 'Topic name is required'),
  categoryId: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  displayOrder: z.number().optional(),
  isActive: z.boolean().optional().default(true),
});

export type CreateTopicInput = z.input<typeof CreateTopicInputSchema>;

export const UpdateTopicInputSchema = z.object({
  id: z.string().min(1, 'Topic ID is required for update'),
  name: z.string().min(1).optional(),
  categoryId: z.string().optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  displayOrder: z.number().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateTopicInput = z.infer<typeof UpdateTopicInputSchema>;

export const CreateSubtopicInputSchema = z.object({
  topicId: z.string().min(1, 'Parent Topic ID is required'),
  name: z.string().min(1, 'Subtopic name is required'),
  slug: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  displayOrder: z.number().optional(),
  isActive: z.boolean().optional().default(true),
});

export type CreateSubtopicInput = z.input<typeof CreateSubtopicInputSchema>;

export const UpdateSubtopicInputSchema = z.object({
  id: z.string().min(1, 'Subtopic ID is required for update'),
  topicId: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  slug: z.string().optional(),
  description: z.string().optional(),
  notes: z.string().optional(),
  displayOrder: z.number().optional(),
  isActive: z.boolean().optional(),
});

export type UpdateSubtopicInput = z.infer<typeof UpdateSubtopicInputSchema>;

export const BulkImportTaxonomyItemSchema = z.object({
  name: z.string().min(1, 'Topic name is required'),
  slug: z.string().optional(),
  categoryId: z.string().optional(),
  description: z.string().optional(),
  displayOrder: z.number().optional(),
  subtopics: z.array(
    z.object({
      name: z.string().min(1, 'Subtopic name is required'),
      slug: z.string().optional(),
      description: z.string().optional(),
      notes: z.string().optional(),
      displayOrder: z.number().optional(),
    })
  ).optional().default([]),
});

export const BulkImportTaxonomyInputSchema = z.object({
  topics: z.array(BulkImportTaxonomyItemSchema).min(1, 'At least one topic must be provided for import'),
});

export type BulkImportTaxonomyInput = z.infer<typeof BulkImportTaxonomyInputSchema>;

// ============================================================================
// PHASE 27: SOCIAL ANALYTICS SCHEMA CONTRACT & INPUT VALIDATION SCHEMAS
// ============================================================================

export const ANALYTICS_SHEET_TABS = {
  SOCIAL_ANALYTICS: 'SOCIAL_ANALYTICS',
} as const;

export type AnalyticsSheetTabName = typeof ANALYTICS_SHEET_TABS[keyof typeof ANALYTICS_SHEET_TABS];

export const SOCIAL_ANALYTICS_SCHEMA: SheetSchemaContract = {
  sheetName: 'SOCIAL_ANALYTICS' as any,
  purpose: 'Stores historical social analytics performance metric snapshots for published content in a separate analytics workbook',
  primaryKey: 'id',
  columns: [
    { name: 'ID', propertyKey: 'id', type: 'string', required: true, isPrimaryKey: true },
    { name: 'CONTENT_ID', propertyKey: 'contentId', type: 'string', required: true, isForeignKey: true },
    { name: 'PLATFORM', propertyKey: 'platform', type: 'string', required: true },
    { name: 'POSTING_TIMESTAMP', propertyKey: 'postingTimestamp', type: 'string', required: false },
    { name: 'VIEWS', propertyKey: 'views', type: 'number', required: true },
    { name: 'WATCH_TIME', propertyKey: 'watchTime', type: 'number', required: true },
    { name: 'RETENTION_RATE', propertyKey: 'retentionRate', type: 'number', required: true },
    { name: 'LIKES', propertyKey: 'likes', type: 'number', required: true },
    { name: 'COMMENTS', propertyKey: 'comments', type: 'number', required: true },
    { name: 'SHARES', propertyKey: 'shares', type: 'number', required: true },
    { name: 'SUBSCRIBERS_GAINED', propertyKey: 'subscribersGained', type: 'number', required: true },
    { name: 'CTR', propertyKey: 'ctr', type: 'number', required: true },
    { name: 'CAPTURED_AT', propertyKey: 'capturedAt', type: 'string', required: true },
    { name: 'TOPIC_ID', propertyKey: 'topicId', type: 'string', required: false },
    { name: 'SUBTOPIC_ID', propertyKey: 'subtopicId', type: 'string', required: false },
    { name: 'DIFFICULTY', propertyKey: 'difficulty', type: 'string', required: false },
    { name: 'CHALLENGE_TYPE', propertyKey: 'challengeType', type: 'string', required: false },
    { name: 'LANGUAGE', propertyKey: 'language', type: 'string', required: false },
    { name: 'PRESENTATION_TYPE', propertyKey: 'presentationType', type: 'string', required: false },
    { name: 'NOTES', propertyKey: 'notes', type: 'string', required: false },
  ],
};

export const CreateSocialAnalyticsInputSchema = z.object({
  contentId: z.string().regex(/^BP-CNT-\d{6}$/, 'Invalid content ID format (must be BP-CNT-######)'),
  platform: z.string().min(1, 'Platform is required'),
  postingTimestamp: z.string().optional(),
  views: z.number().min(0, 'Views must be non-negative').optional().default(0),
  watchTime: z.number().min(0, 'Watch time must be non-negative').optional().default(0),
  retentionRate: z.number().min(0).max(100, 'Retention rate must be between 0 and 100').optional().default(0),
  likes: z.number().min(0).optional().default(0),
  comments: z.number().min(0).optional().default(0),
  shares: z.number().min(0).optional().default(0),
  subscribersGained: z.number().optional().default(0),
  ctr: z.number().min(0).max(100, 'CTR must be between 0 and 100').optional().default(0),
  capturedAt: z.string().optional(),
  topicId: z.string().optional(),
  subtopicId: z.string().optional(),
  difficulty: z.string().optional(),
  challengeType: z.string().optional(),
  language: z.string().optional(),
  presentationType: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateSocialAnalyticsInput = z.infer<typeof CreateSocialAnalyticsInputSchema>;

export const ImportSocialAnalyticsInputSchema = z.object({
  records: z.array(CreateSocialAnalyticsInputSchema).min(1, 'At least one analytics record is required'),
});

export type ImportSocialAnalyticsInput = z.infer<typeof ImportSocialAnalyticsInputSchema>;

/**
 * Phase 28: SOCIAL_PERFORMANCE_INTELLIGENCE Schema
 * Stored in separate Analytics Workbook under ANALYTICS_INTELLIGENCE sheet tab.
 */
export const SOCIAL_PERFORMANCE_INTELLIGENCE_SCHEMA: SheetSchemaContract = {
  sheetName: 'ANALYTICS_INTELLIGENCE' as any,
  purpose: 'Stores AI Social Performance Intelligence reports in separate analytics workbook',
  primaryKey: 'id',
  columns: [
    { name: 'ID', propertyKey: 'id', type: 'string', required: true },
    { name: 'ANALYZED_AT', propertyKey: 'analyzedAt', type: 'string', required: true },
    { name: 'ACTOR_ID', propertyKey: 'actorId', type: 'string', required: true },
    { name: 'ACTOR_NAME', propertyKey: 'actorName', type: 'string', required: true },
    { name: 'RECORD_COUNT', propertyKey: 'recordCount', type: 'number', required: true },
    { name: 'DATA_SNAPSHOT_FILTERS', propertyKey: 'dataSnapshotFilters', type: 'json', required: false },
    { name: 'DETERMINISTIC_SUMMARY', propertyKey: 'deterministicSummary', type: 'json', required: true },
    { name: 'DIMENSION_BREAKDOWN', propertyKey: 'dimensionBreakdown', type: 'json', required: true },
    { name: 'AI_INSIGHTS', propertyKey: 'aiInsights', type: 'json', required: true },
    { name: 'IS_FALLBACK_MODE', propertyKey: 'isFallbackMode', type: 'boolean', required: true },
    { name: 'MODEL_USED', propertyKey: 'modelUsed', type: 'string', required: true },
    { name: 'EVIDENCE_TRACEABILITY', propertyKey: 'evidenceTraceability', type: 'json', required: true },
  ],
};





