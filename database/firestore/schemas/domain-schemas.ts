/**
 * BURRA PARIKSHA CMS — Authoritative Domain & Firestore Schemas
 * Sprint 6: Complete Removal of Entity ID Sequence Infrastructure
 *
 * Single Source of Truth for Firestore Collections and Domain Entity Definitions.
 *
 * Architecture:
 * React -> Express API -> Domain Services -> Domain Repositories -> FirestoreRepository -> Firebase Admin SDK -> Cloud Firestore
 * All entity IDs are generated via CanonicalIdService (UUID v4 with typed prefixes).
 */

import { CanonicalPrefix } from '../../../src/lib/id.service';

export interface FirestoreCollectionDefinition {
  collectionName: string;
  defaultPrefix?: CanonicalPrefix;
  primaryKey?: string;
  description?: string;
}

export const DOMAIN_COLLECTIONS = {
  QUESTIONS: 'questions',
  CONTENT_MASTERS: 'content_masters',
  QUESTION_DRAFTS: 'question_drafts',
  SCRIPTS: 'scripts',
  SCRIPT_VERSIONS: 'script_versions',
  VIDEOS: 'videos',
  THUMBNAILS: 'thumbnails',
  THUMBNAIL_VERSIONS: 'thumbnail_versions',
  PINNED_COMMENTS: 'pinned_comments',
  PINNED_COMMENT_VERSIONS: 'pinned_comment_versions',
  PUBLISHING_PACKAGES: 'publishing_packages',
  SOCIAL_POSTS: 'social_posts',
  SOCIAL_COMMENTS: 'social_comments',
  SOCIAL_REVIEWS: 'social_reviews',
  SOCIAL_ANALYTICS: 'social_analytics',
  COMMENT_INTELLIGENCE: 'comment_intelligence',
  SOCIAL_PERFORMANCE_INTELLIGENCE: 'social_performance_intelligence',
  CONTENT_STRATEGY: 'content_strategy',
  WORKFLOW_INSTANCES: 'workflow_instances',
  WORKFLOW_HISTORY: 'workflow_history',
  ASSIGNMENTS: 'assignments',
  TOPICS: 'topics',
  SUBTOPICS: 'subtopics',
  USERS: 'users',
  QUESTION_CONFIG: 'question_config',
  AUDIT_LOGS: 'audit_logs',
  VALIDATIONS: 'validations',
  CONTENT_PLANS: 'content_plans',
  CONTENT_BATCHES: 'content_batches',
  MEDIA_ASSETS: 'media_assets',
  PLATFORM_ADAPTATIONS: 'platform_adaptations',
  REFINEMENT_CANDIDATES: 'refinement_candidates',
  THUMBNAIL_CANDIDATES: 'thumbnail_candidates',
  PINNED_COMMENT_PACKAGES: 'pinned_comment_packages',
} as const;

export type DomainCollectionName = typeof DOMAIN_COLLECTIONS[keyof typeof DOMAIN_COLLECTIONS];
