/**
 * BURRA PARIKSHA CMS - Data Ownership Governance & Safety Helpers
 * Phase 7: Data Ownership Architecture & Single Source of Truth
 */

import { SHEET_TABS, SheetTabName } from '../schemas/google-sheets-schema';

// ============================================================================
// 1. SEMANTIC FIELD ROLE CLASSIFICATION
// ============================================================================

export enum FieldSemanticRole {
  AUTHORITATIVE = 'AUTHORITATIVE',   // Single source of truth field
  DERIVED = 'DERIVED',               // Computationally generated from authoritative source
  CACHE = 'CACHE',                   // Temporary fast-access copy of authoritative field
  SNAPSHOT = 'SNAPSHOT',             // Point-in-time frozen copy bound to a release/publication
  HISTORY_AUDIT = 'HISTORY_AUDIT',   // Immutable historical event or version log
  COMPATIBILITY = 'COMPATIBILITY'    // Alias field preserved for backwards integration
}

// ============================================================================
// 2. CANONICAL CONTENT IDENTITY RESOLUTION
// ============================================================================

/**
 * Resolves the canonical Content Master ID (BP-CNT-######) from any record containing
 * either contentId, contentMasterId, or both.
 */
export function resolveContentMasterId(record: { contentId?: string; contentMasterId?: string; id?: string }): string | null {
  if (!record) return null;
  if (record.contentMasterId && record.contentMasterId.startsWith('BP-CNT-')) {
    return record.contentMasterId;
  }
  if (record.contentId && record.contentId.startsWith('BP-CNT-')) {
    return record.contentId;
  }
  if (record.id && record.id.startsWith('BP-CNT-')) {
    return record.id;
  }
  return record.contentMasterId || record.contentId || null;
}

/**
 * Asserts that a string matches canonical domain ID patterns.
 */
export function isCanonicalDomainId(id: string, prefix?: string): boolean {
  if (!id || typeof id !== 'string') return false;
  if (prefix) {
    return id.startsWith(prefix);
  }
  return /^(BP-CNT-\d{6}|BP-Q-\d{6}|BP-V-\d{6}|BP-S-\d{6}|BP-T-\d{6}|BP-PIN-\d{6}|BP-REV-\d{6}|BP-ADP-\d{6}|BP-PUB-\d{6}|USR-\d{3}|BP-CAT-\d{3}|BP-TOP-\d{4}|BP-SUB-\d{6}|BP-ASN-\d{6}|BP-PLN-\d{4}|BP-BCH-\d{4})$/.test(id);
}

// ============================================================================
// 3. ENTITY DATA OWNERSHIP MATRIX DEFINITION
// ============================================================================

export interface EntityOwnershipContract {
  entityName: string;
  canonicalIdPrefix: string;
  parentEntity: string | null;
  authoritativeWorksheet: SheetTabName;
  authoritativeRepository: string;
  owningService: string;
  mutatingApi: string;
  readApis: string[];
  derivedCopies: string[];
  historicalStore: string | null;
  auditStore: string;
  contentIdRelationship: 'PRIMARY_KEY' | 'FOREIGN_KEY' | 'CORRELATED_IDENTITY';
}

export const ENTITY_OWNERSHIP_MATRIX: Record<string, EntityOwnershipContract> = {
  ContentMaster: {
    entityName: 'ContentMaster',
    canonicalIdPrefix: 'BP-CNT-',
    parentEntity: null,
    authoritativeWorksheet: SHEET_TABS.CONTENT_MASTERS,
    authoritativeRepository: 'contentMastersRepository',
    owningService: 'contentMasterService',
    mutatingApi: '/api/content-masters',
    readApis: ['/api/content-masters', '/api/content-masters/:id', '/api/content-masters/dashboard'],
    derivedCopies: ['questions.content_master_id', 'videos.content_master_id', 'social_reviews.content_master_id'],
    historicalStore: null,
    auditStore: SHEET_TABS.AUDIT_LOG,
    contentIdRelationship: 'PRIMARY_KEY',
  },
  Question: {
    entityName: 'Question',
    canonicalIdPrefix: 'BP-Q-',
    parentEntity: 'ContentMaster',
    authoritativeWorksheet: SHEET_TABS.QUESTIONS,
    authoritativeRepository: 'questionsRepository',
    owningService: 'questionService',
    mutatingApi: '/api/questions',
    readApis: ['/api/questions', '/api/questions/:id'],
    derivedCopies: ['videos.question_id', 'scripts.question_id', 'social_reviews.question_id'],
    historicalStore: SHEET_TABS.QUESTION_VALIDATIONS,
    auditStore: SHEET_TABS.AUDIT_LOG,
    contentIdRelationship: 'FOREIGN_KEY',
  },
  Script: {
    entityName: 'Script',
    canonicalIdPrefix: 'BP-S-',
    parentEntity: 'Question',
    authoritativeWorksheet: SHEET_TABS.SCRIPT,
    authoritativeRepository: 'scriptsRepository',
    owningService: 'scriptService',
    mutatingApi: '/api/scripts',
    readApis: ['/api/scripts', '/api/scripts/question/:questionId'],
    derivedCopies: ['script_versions.content_json'],
    historicalStore: SHEET_TABS.SCRIPT_VERSIONS,
    auditStore: SHEET_TABS.AUDIT_LOG,
    contentIdRelationship: 'CORRELATED_IDENTITY',
  },
  Video: {
    entityName: 'Video',
    canonicalIdPrefix: 'BP-V-',
    parentEntity: 'Question',
    authoritativeWorksheet: SHEET_TABS.VIDEOS,
    authoritativeRepository: 'videosRepository',
    owningService: 'videoService',
    mutatingApi: '/api/videos',
    readApis: ['/api/videos', '/api/videos/:id'],
    derivedCopies: ['publishing.video_id', 'media_assets.video_id'],
    historicalStore: null,
    auditStore: SHEET_TABS.AUDIT_LOG,
    contentIdRelationship: 'CORRELATED_IDENTITY',
  },
  Thumbnail: {
    entityName: 'Thumbnail',
    canonicalIdPrefix: 'BP-T-',
    parentEntity: 'Video',
    authoritativeWorksheet: SHEET_TABS.THUMBNAILS,
    authoritativeRepository: 'thumbnailsRepository',
    owningService: 'thumbnailService',
    mutatingApi: '/api/thumbnails',
    readApis: ['/api/thumbnails', '/api/thumbnails/:id'],
    derivedCopies: ['thumbnail_versions.drive_asset_url'],
    historicalStore: SHEET_TABS.THUMBNAIL_VERSIONS,
    auditStore: SHEET_TABS.AUDIT_LOG,
    contentIdRelationship: 'CORRELATED_IDENTITY',
  },
  PinnedComment: {
    entityName: 'PinnedComment',
    canonicalIdPrefix: 'BP-PIN-',
    parentEntity: 'Video',
    authoritativeWorksheet: SHEET_TABS.PINNED_COMMENTS,
    authoritativeRepository: 'pinnedCommentsRepository',
    owningService: 'pinnedCommentService',
    mutatingApi: '/api/pinned-comments',
    readApis: ['/api/pinned-comments', '/api/pinned-comments/:id'],
    derivedCopies: ['pinned_comment_versions.comment_text'],
    historicalStore: SHEET_TABS.PINNED_COMMENT_VERSIONS,
    auditStore: SHEET_TABS.AUDIT_LOG,
    contentIdRelationship: 'CORRELATED_IDENTITY',
  },
  SocialReview: {
    entityName: 'SocialReview',
    canonicalIdPrefix: 'BP-REV-',
    parentEntity: 'ContentMaster',
    authoritativeWorksheet: SHEET_TABS.SOCIAL_REVIEWS,
    authoritativeRepository: 'socialReviewsRepository',
    owningService: 'socialReviewService',
    mutatingApi: '/api/social-reviews',
    readApis: ['/api/social-reviews', '/api/social-reviews/:id'],
    derivedCopies: ['publishing_readiness_checks'],
    historicalStore: SHEET_TABS.SOCIAL_REVIEWS,
    auditStore: SHEET_TABS.AUDIT_LOG,
    contentIdRelationship: 'CORRELATED_IDENTITY',
  },
  PlatformAdaptation: {
    entityName: 'PlatformAdaptation',
    canonicalIdPrefix: 'BP-ADP-',
    parentEntity: 'ContentMaster',
    authoritativeWorksheet: SHEET_TABS.MEDIA_ASSETS,
    authoritativeRepository: 'platformAdaptationsRepository',
    owningService: 'platformAdaptationService',
    mutatingApi: '/api/platform-adaptations',
    readApis: ['/api/platform-adaptations', '/api/platform-adaptations/:id'],
    derivedCopies: ['publisher_packages'],
    historicalStore: 'platformAdaptationsRepository (versions)',
    auditStore: SHEET_TABS.AUDIT_LOG,
    contentIdRelationship: 'CORRELATED_IDENTITY',
  },
  PublishingRecord: {
    entityName: 'PublishingRecord',
    canonicalIdPrefix: 'BP-PUB-',
    parentEntity: 'ContentMaster',
    authoritativeWorksheet: SHEET_TABS.PUBLISHING,
    authoritativeRepository: 'publishingRepository',
    owningService: 'publishingService',
    mutatingApi: '/api/publishing',
    readApis: ['/api/publishing', '/api/publishing/:id'],
    derivedCopies: ['social_analytics'],
    historicalStore: null,
    auditStore: SHEET_TABS.AUDIT_LOG,
    contentIdRelationship: 'CORRELATED_IDENTITY',
  },
  User: {
    entityName: 'User',
    canonicalIdPrefix: 'USR-',
    parentEntity: null,
    authoritativeWorksheet: SHEET_TABS.USERS,
    authoritativeRepository: 'usersRepository',
    owningService: 'authService',
    mutatingApi: '/api/users',
    readApis: ['/api/users', '/api/users/me'],
    derivedCopies: ['assignments.assignee_name', 'social_reviews.reviewer_name'],
    historicalStore: null,
    auditStore: SHEET_TABS.AUDIT_LOG,
    contentIdRelationship: 'CORRELATED_IDENTITY',
  },
};
