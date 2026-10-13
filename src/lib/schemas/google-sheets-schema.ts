/**
 * BURRA PARIKSHA CMS - Secondary Sheet Export & Disaster Recovery Archive Tab Definitions
 * DEPRECATED RUNTIME PERSISTENCE CONTRACT
 * 
 * Cloud Firestore is the sole authoritative transactional datastore for BP-CMS.
 * Google Sheets is NOT the transactional database and is permanently decommissioned
 * for runtime application state.
 * 
 * Retained strictly for secondary CSV/Sheets export formatting, disaster recovery
 * snapshot archive inspection (data-integrity / full-snapshot-restore services),
 * and backward-compatible shim re-exports of canonical request validation schemas.
 */

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

// Re-export canonical HTTP request validation schemas from backend server validation
export * from '../../../backend/server/validation/request-schemas';

// ============================================================================
// 1. DISASTER RECOVERY & SECONDARY EXPORT TAB NAMES
// Used exclusively by data-integrity, full-snapshot-restore, and export tools.
// ============================================================================

export const SHEET_TABS = {
  USERS: 'USERS',
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
  CONTENT_MASTERS: 'CONTENT_MASTERS',
  QUESTION_VALIDATIONS: 'QUESTION_VALIDATIONS',
  SOCIAL_REVIEWS: 'SOCIAL_REVIEWS',
  QUESTION_CONFIG: 'QUESTION_CONFIG',
  MEDIA_ASSETS: 'MEDIA_ASSETS',
} as const;

// Extended Planning Worksheet Names for Archives
export const PLANNING_SHEET_TABS = {
  CONTENT_PLANS: 'CONTENT_PLANS',
  CONTENT_BATCHES: 'CONTENT_BATCHES',
} as const;

export type PlanningSheetTabName = typeof PLANNING_SHEET_TABS[keyof typeof PLANNING_SHEET_TABS];
export type SheetTabName = typeof SHEET_TABS[keyof typeof SHEET_TABS] | PlanningSheetTabName;

export const ALL_SHEET_TABS: SheetTabName[] = [
  SHEET_TABS.USERS,
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
  SHEET_TABS.CONTENT_MASTERS,
  SHEET_TABS.SOCIAL_REVIEWS,
  SHEET_TABS.QUESTION_VALIDATIONS,
  SHEET_TABS.QUESTION_CONFIG,
  SHEET_TABS.MEDIA_ASSETS,
  PLANNING_SHEET_TABS.CONTENT_PLANS,
  PLANNING_SHEET_TABS.CONTENT_BATCHES,
];

// ============================================================================
// 2. SECONDARY EXPORT COLUMN INTERFACES
// ============================================================================

export interface ColumnDefinition {
  name: string;
  propertyKey: string;
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
