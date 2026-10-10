/**
 * BURRA PARIKSHA CMS — Authoritative Domain & Firestore Schemas
 *
 * Single Source of Truth for Firestore Collections, Canonical Prefixes,
 * Sequence Entities, and Domain Entity Definitions.
 *
 * Architecture:
 * React -> Express API -> Domain Services -> Domain Repositories -> FirestoreRepository -> Firebase Admin SDK -> Cloud Firestore
 */

import { CanonicalPrefix } from '../id.service';

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
  CATEGORIES: 'categories',
  TOPICS: 'topics',
  SUBTOPICS: 'subtopics',
  USERS: 'users',
  QUESTION_CONFIG: 'question_config',
  SEQUENCES: 'sequences',
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
  SOCIAL_REVIEW: 'SOCIAL_REVIEW',
  SOCIAL_ANALYTICS: 'SOCIAL_ANALYTICS',
  SOCIAL_PERFORMANCE_INTELLIGENCE: 'SOCIAL_PERFORMANCE_INTELLIGENCE',
  PLATFORM_ADAPTATION: 'PLATFORM_ADAPTATION',
  CONTENT_STRATEGY: 'CONTENT_STRATEGY',
  SOCIAL_COMMENT: 'SOCIAL_COMMENT',
  COMMENT_INTELLIGENCE: 'COMMENT_INTELLIGENCE',
} as const;

export type SequenceEntityType = typeof SEQUENCE_ENTITIES[keyof typeof SEQUENCE_ENTITIES];

export const ID_PREFIX_MAP: Record<SequenceEntityType, { prefix: string; padLength: number }> = {
  [SEQUENCE_ENTITIES.QUESTION]: { prefix: 'BP-Q-', padLength: 6 },
  [SEQUENCE_ENTITIES.VIDEO]: { prefix: 'BP-V-', padLength: 6 },
  [SEQUENCE_ENTITIES.SCRIPT]: { prefix: 'BP-S-', padLength: 6 },
  [SEQUENCE_ENTITIES.THUMBNAIL]: { prefix: 'BP-T-', padLength: 6 },
  [SEQUENCE_ENTITIES.PINNED_COMMENT]: { prefix: 'BP-PIN-', padLength: 6 },
  [SEQUENCE_ENTITIES.CATEGORY]: { prefix: 'BP-CAT-', padLength: 3 },
  [SEQUENCE_ENTITIES.TOPIC]: { prefix: 'BP-TOP-', padLength: 4 },
  [SEQUENCE_ENTITIES.SUBTOPIC]: { prefix: 'BP-SUB-', padLength: 6 },
  [SEQUENCE_ENTITIES.USER]: { prefix: 'USR-', padLength: 3 },
  [SEQUENCE_ENTITIES.CONTENT_PLAN]: { prefix: 'BP-PLN-', padLength: 4 },
  [SEQUENCE_ENTITIES.CONTENT_BATCH]: { prefix: 'BP-BCH-', padLength: 4 },
  [SEQUENCE_ENTITIES.ASSIGNMENT]: { prefix: 'BP-ASN-', padLength: 6 },
  [SEQUENCE_ENTITIES.CONTENT_MASTER]: { prefix: 'BP-CNT-', padLength: 6 },
  [SEQUENCE_ENTITIES.SOCIAL_REVIEW]: { prefix: 'BP-REV-', padLength: 6 },
  [SEQUENCE_ENTITIES.SOCIAL_ANALYTICS]: { prefix: 'BP-ANL-', padLength: 6 },
  [SEQUENCE_ENTITIES.SOCIAL_PERFORMANCE_INTELLIGENCE]: { prefix: 'BP-SPI-', padLength: 6 },
  [SEQUENCE_ENTITIES.PLATFORM_ADAPTATION]: { prefix: 'BP-ADP-', padLength: 6 },
  [SEQUENCE_ENTITIES.CONTENT_STRATEGY]: { prefix: 'BP-STR-', padLength: 6 },
  [SEQUENCE_ENTITIES.SOCIAL_COMMENT]: { prefix: 'BP-CMT-', padLength: 6 },
  [SEQUENCE_ENTITIES.COMMENT_INTELLIGENCE]: { prefix: 'BP-CMI-', padLength: 6 },
};
