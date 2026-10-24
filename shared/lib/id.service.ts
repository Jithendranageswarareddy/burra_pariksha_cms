/**
 * BURRA PARIKSHA CMS — Canonical ID Service
 * Sprint 6 & 7: Pure Collision-Resistant UUID-based Canonical Entity Identifiers
 *
 * Single Source of Truth for UUID-based Canonical Entity Identifiers.
 * Pure in-memory RFC 4122 v4 UUID suffix generation with stable entity prefixes.
 *
 * Architecture:
 * Entity Service -> CanonicalIdService -> UUID-based unique ID -> Firestore
 * Zero database-backed counters, zero sequences collection, zero sequence locks.
 */

function generateUuidV4(): string {
  if (typeof globalThis !== 'undefined' && globalThis.crypto && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodeCrypto = require('node:crypto');
    if (typeof nodeCrypto?.randomUUID === 'function') {
      return nodeCrypto.randomUUID();
    }
  } catch {
    // continue to getRandomValues check
  }
  if (typeof globalThis !== 'undefined' && globalThis.crypto && typeof globalThis.crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // RFC 4122 v4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 1
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  }
  throw new Error('Cryptographically secure random number generator is unavailable. Math.random fallback is prohibited for canonical production identifiers.');
}

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
  | 'dft_' // Question Draft
  | 'lnu_' // Learning Unit
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
  'dft_',
  'lnu_',
] as const;

export const PREFIX_ENTITY_MAP: Record<string, string> = {
  'lnu_': 'LearningUnit',
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
  'dft_': 'QuestionDraft',
};

export const UUID_V4_PATTERN = '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$';

export class CanonicalIdService {
  private static instance: CanonicalIdService;

  public static getInstance(): CanonicalIdService {
    if (!CanonicalIdService.instance) {
      CanonicalIdService.instance = new CanonicalIdService();
    }
    return CanonicalIdService.instance;
  }

  public generateId(prefix: CanonicalPrefix): string {
    return `${prefix}${generateUuidV4()}`;
  }

  public generateCanonicalId(prefix: CanonicalPrefix | string): string {
    return `${prefix}${generateUuidV4()}`;
  }

  public generateQuestionId(): string {
    return this.generateId('qst_');
  }

  public generateDraftId(): string {
    return this.generateId('dft_');
  }

  public generateScriptId(): string {
    return this.generateId('scr_');
  }

  public generateVideoId(): string {
    return this.generateId('vid_');
  }

  public generateThumbnailId(): string {
    return this.generateId('thm_');
  }

  public generatePinnedCommentId(): string {
    return this.generateId('pin_');
  }

  public generateTopicId(): string {
    return this.generateId('top_');
  }

  public generateSubtopicId(): string {
    return this.generateId('sub_');
  }

  public generateUserId(): string {
    return this.generateId('usr_');
  }

  public generateContentMasterId(): string {
    return this.generateId('cnt_');
  }

  public generateContentPlanId(): string {
    return this.generateId('pln_');
  }

  public generateContentBatchId(): string {
    return this.generateId('bch_');
  }

  public generateAssignmentId(): string {
    return this.generateId('asn_');
  }

  public generateSocialAnalyticsId(): string {
    return this.generateId('anl_');
  }

  public generateSocialPerformanceIntelligenceId(): string {
    return this.generateId('spi_');
  }

  public generateIntelligenceId(): string {
    return this.generateId('spi_');
  }

  public generatePlatformAdaptationId(): string {
    return this.generateId('adp_');
  }

  public generateContentStrategyId(): string {
    return this.generateId('str_');
  }

  public generateSocialCommentId(): string {
    return this.generateId('cmt_');
  }

  public generateCommentIntelligenceId(): string {
    return this.generateId('cmi_');
  }

  public generateWorkflowInstanceId(): string {
    return this.generateId('wfl_');
  }

  public generateWorkflowId(): string {
    return this.generateId('wfl_');
  }

  public generateWorkflowHistoryId(): string {
    return this.generateId('wfh_');
  }

  public generateAuditLogId(): string {
    return this.generateId('aud_');
  }

  public generateAuditId(): string {
    return this.generateId('aud_');
  }

  public generateMediaAssetId(): string {
    return this.generateId('med_');
  }

  public generateMediaId(): string {
    return this.generateId('med_');
  }

  public generatePublishingId(): string {
    return this.generateId('pub_');
  }

  public generateReviewId(): string {
    return this.generateId('rev_');
  }

  public generateQuestionConfigId(): string {
    return this.generateId('cfg_');
  }

  public generateValidationId(): string {
    return this.generateId('val_');
  }

  public generateLearningUnitId(): string {
    return this.generateId('lnu_');
  }

  public validateCanonicalId(id: string, expectedPrefix?: CanonicalPrefix | string): boolean {
    return this.isValidCanonicalId(id, expectedPrefix as any);
  }

  public isValidCanonicalId(id: string, expectedPrefix?: CanonicalPrefix): boolean {
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
