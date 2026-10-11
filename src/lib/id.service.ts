/**
 * BURRA PARIKSHA CMS — Canonical ID Service
 * Sprint 6: Complete Removal of Entity ID Sequence Infrastructure
 *
 * Single Source of Truth for UUID-based Canonical Entity Identifiers.
 * Pure in-memory RFC 4122 v4 UUID suffix generation with stable entity prefixes.
 *
 * Architecture:
 * Entity Service -> CanonicalIdService -> UUID-based unique ID -> Firestore
 * Zero database-backed counters, zero sequences collection, zero sequence locks.
 */

import { randomUUID } from 'crypto';

export type CanonicalPrefix =
  | 'qst_' // Question
  | 'scr_' // Script
  | 'vid_' // Video
  | 'thm_' // Thumbnail
  | 'pin_' // Pinned Comment
  | 'top_' // Topic
  | 'sub_' // Subtopic
  | 'usr_' // User
  | 'cnt_' // Content Master
  | 'pln_' // Content Plan
  | 'bch_' // Content Batch
  | 'asn_' // Assignment
  | 'anl_' // Social Analytics
  | 'spi_' // Social Performance Intelligence
  | 'adp_' // Platform Adaptation
  | 'str_' // Content Strategy
  | 'cmt_' // Social Comment
  | 'cmi_' // Comment Intelligence
  | 'wfl_' // Workflow Instance
  | 'wfh_' // Workflow History
  | 'aud_' // Audit Log
  | 'med_' // Media Asset
  | 'pub_' // Publishing
  | 'rev_' // Review
  | 'cfg_' // Question Config
  | 'val_' // Validation
  | (string & {});

export const CANONICAL_PREFIXES: readonly CanonicalPrefix[] = [
  'qst_',
  'scr_',
  'vid_',
  'thm_',
  'pin_',
  'top_',
  'sub_',
  'usr_',
  'cnt_',
  'pln_',
  'bch_',
  'asn_',
  'anl_',
  'spi_',
  'adp_',
  'str_',
  'cmt_',
  'cmi_',
  'wfl_',
  'wfh_',
  'aud_',
  'med_',
  'pub_',
  'rev_',
  'cfg_',
  'val_',
] as const;

export const PREFIX_ENTITY_MAP: Record<string, string> = {
  'qst_': 'Question',
  'scr_': 'Script',
  'vid_': 'Video',
  'thm_': 'Thumbnail',
  'pin_': 'PinnedComment',
  'top_': 'Topic',
  'sub_': 'Subtopic',
  'usr_': 'User',
  'cnt_': 'ContentMaster',
  'pln_': 'ContentPlan',
  'bch_': 'ContentBatch',
  'asn_': 'Assignment',
  'anl_': 'SocialAnalytics',
  'spi_': 'SocialPerformanceIntelligence',
  'adp_': 'PlatformAdaptation',
  'str_': 'ContentStrategy',
  'cmt_': 'SocialComment',
  'cmi_': 'CommentIntelligence',
  'wfl_': 'WorkflowInstance',
  'wfh_': 'WorkflowHistory',
  'aud_': 'AuditLog',
  'med_': 'MediaAsset',
  'pub_': 'PublishingPackage',
  'rev_': 'Review',
  'cfg_': 'QuestionConfig',
  'val_': 'Validation',
};

// UUID v4 format pattern: 8-4-4-4-12 hex characters
const UUID_V4_PATTERN = '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

export class CanonicalIdService {
  private static instance: CanonicalIdService | null = null;

  private constructor() {}

  public static getInstance(): CanonicalIdService {
    if (!CanonicalIdService.instance) {
      CanonicalIdService.instance = new CanonicalIdService();
    }
    return CanonicalIdService.instance;
  }

  /**
   * Generates a typed canonical ID composed of the registered prefix and a v4 UUID.
   * Example: generateCanonicalId('qst_') => 'qst_550e8400-e29b-41d4-a716-446655440000'
   */
  public generateCanonicalId(prefix: CanonicalPrefix | string): string {
    const uuid = randomUUID();
    return `${prefix}${uuid}`;
  }

  // --- Entity Generator Methods ---

  public generateQuestionId(): string {
    return this.generateCanonicalId('qst_');
  }

  public generateScriptId(): string {
    return this.generateCanonicalId('scr_');
  }

  public generateVideoId(): string {
    return this.generateCanonicalId('vid_');
  }

  public generateThumbnailId(): string {
    return this.generateCanonicalId('thm_');
  }

  public generatePinnedCommentId(): string {
    return this.generateCanonicalId('pin_');
  }

  public generateTopicId(): string {
    return this.generateCanonicalId('top_');
  }

  public generateSubtopicId(): string {
    return this.generateCanonicalId('sub_');
  }

  public generateUserId(): string {
    return this.generateCanonicalId('usr_');
  }

  public generateContentMasterId(): string {
    return this.generateCanonicalId('cnt_');
  }

  public generateContentPlanId(): string {
    return this.generateCanonicalId('pln_');
  }

  public generateContentBatchId(): string {
    return this.generateCanonicalId('bch_');
  }

  public generateAssignmentId(): string {
    return this.generateCanonicalId('asn_');
  }

  public generateSocialAnalyticsId(): string {
    return this.generateCanonicalId('anl_');
  }

  public generateIntelligenceId(): string {
    return this.generateCanonicalId('spi_');
  }

  public generatePlatformAdaptationId(): string {
    return this.generateCanonicalId('adp_');
  }

  public generateContentStrategyId(): string {
    return this.generateCanonicalId('str_');
  }

  public generateSocialCommentId(): string {
    return this.generateCanonicalId('cmt_');
  }

  public generateCommentIntelligenceId(): string {
    return this.generateCanonicalId('cmi_');
  }

  public generateWorkflowId(): string {
    return this.generateCanonicalId('wfl_');
  }

  public generateWorkflowHistoryId(): string {
    return this.generateCanonicalId('wfh_');
  }

  public generateAuditId(): string {
    return this.generateCanonicalId('aud_');
  }

  public generateMediaId(): string {
    return this.generateCanonicalId('med_');
  }

  public generatePublishingId(): string {
    return this.generateCanonicalId('pub_');
  }

  public generateReviewId(): string {
    return this.generateCanonicalId('rev_');
  }

  public generateQuestionConfigId(): string {
    return this.generateCanonicalId('cfg_');
  }

  public generateValidationId(): string {
    return this.generateCanonicalId('val_');
  }

  // --- Async Compatibility Aliases (Promise-returning, zero database access) ---

  public async allocateQuestionId(): Promise<string> {
    return this.generateQuestionId();
  }

  public async allocateVideoId(): Promise<string> {
    return this.generateVideoId();
  }

  public async allocateScriptId(): Promise<string> {
    return this.generateScriptId();
  }

  public async allocateThumbnailId(): Promise<string> {
    return this.generateThumbnailId();
  }

  public async allocatePinnedCommentId(): Promise<string> {
    return this.generatePinnedCommentId();
  }

  public async allocateTopicId(): Promise<string> {
    return this.generateTopicId();
  }

  public async allocateSubtopicId(): Promise<string> {
    return this.generateSubtopicId();
  }

  public async allocateUserId(): Promise<string> {
    return this.generateUserId();
  }

  public async allocateContentMasterId(): Promise<string> {
    return this.generateContentMasterId();
  }

  public async allocateContentPlanId(): Promise<string> {
    return this.generateContentPlanId();
  }

  public async allocateContentBatchId(): Promise<string> {
    return this.generateContentBatchId();
  }

  public async allocateAssignmentId(): Promise<string> {
    return this.generateAssignmentId();
  }

  public async allocateSocialAnalyticsId(): Promise<string> {
    return this.generateSocialAnalyticsId();
  }

  public async allocateIntelligenceId(): Promise<string> {
    return this.generateIntelligenceId();
  }

  public async allocatePlatformAdaptationId(): Promise<string> {
    return this.generatePlatformAdaptationId();
  }

  public async allocateContentStrategyId(): Promise<string> {
    return this.generateContentStrategyId();
  }

  public async allocateSocialCommentId(): Promise<string> {
    return this.generateSocialCommentId();
  }

  public async allocateCommentIntelligenceId(): Promise<string> {
    return this.generateCommentIntelligenceId();
  }

  // --- Validation & Parsing ---

  /**
   * Validates whether a candidate string is a valid canonical ID.
   * If expectedPrefix is provided, asserts prefix equality.
   */
  public validateCanonicalId(id: string, expectedPrefix?: CanonicalPrefix | string): boolean {
    if (!id || typeof id !== 'string') {
      return false;
    }

    if (expectedPrefix) {
      if (!id.startsWith(expectedPrefix)) {
        return false;
      }
      const suffix = id.slice(expectedPrefix.length);
      return new RegExp(UUID_V4_PATTERN, 'i').test(suffix);
    }

    const matchedPrefix = CANONICAL_PREFIXES.find((p) => id.startsWith(p));
    if (!matchedPrefix) {
      return false;
    }

    const suffix = id.slice(matchedPrefix.length);
    return new RegExp(UUID_V4_PATTERN, 'i').test(suffix);
  }

  /**
   * Parses prefix and uuid parts from a canonical ID string.
   */
  public parseCanonicalId(id: string): { prefix: string; uuid: string } | null {
    if (!id || typeof id !== 'string') {
      return null;
    }

    const matchedPrefix = CANONICAL_PREFIXES.find((p) => id.startsWith(p));
    if (!matchedPrefix) {
      return null;
    }

    const uuid = id.slice(matchedPrefix.length);
    if (!new RegExp(UUID_V4_PATTERN, 'i').test(uuid)) {
      return null;
    }

    return { prefix: matchedPrefix, uuid };
  }
}

export const canonicalIdService = CanonicalIdService.getInstance();
