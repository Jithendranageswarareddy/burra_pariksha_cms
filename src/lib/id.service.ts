/**
 * BURRA PARIKSHA CMS — Canonical ID Service
 * Stage 27 Feature Contract: FC-003 (Database Abstraction & Universal API Envelopes)
 *
 * Provides typed, prefix-based canonical entity identifiers:
 * - qst_ (Question)
 * - scr_ (Script)
 * - vid_ (Video)
 * - med_ (Media Asset)
 * - pub_ (Publishing)
 * - usr_ (User)
 * - rev_ (Review)
 * - aud_ (Audit Log)
 *
 * Implements deterministic RFC 4122 v4 UUID suffix generation and regex-based validation.
 * Bridges legacy sequence allocator for brownfield compatibility.
 */

import { randomUUID } from 'crypto';

export type CanonicalPrefix =
  | 'qst_'
  | 'scr_'
  | 'vid_'
  | 'med_'
  | 'pub_'
  | 'usr_'
  | 'rev_'
  | 'aud_';

export const CANONICAL_PREFIXES: readonly CanonicalPrefix[] = [
  'qst_',
  'scr_',
  'vid_',
  'med_',
  'pub_',
  'usr_',
  'rev_',
  'aud_',
] as const;

export const PREFIX_ENTITY_MAP: Record<CanonicalPrefix, string> = {
  'qst_': 'Question',
  'scr_': 'Script',
  'vid_': 'Video',
  'med_': 'MediaAsset',
  'pub_': 'Publishing',
  'usr_': 'User',
  'rev_': 'Review',
  'aud_': 'AuditLog',
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
  public generateCanonicalId(prefix: CanonicalPrefix): string {
    const uuid = randomUUID();
    return `${prefix}${uuid}`;
  }

  public generateQuestionId(): string {
    return this.generateCanonicalId('qst_');
  }

  public generateScriptId(): string {
    return this.generateCanonicalId('scr_');
  }

  public generateVideoId(): string {
    return this.generateCanonicalId('vid_');
  }

  public generateMediaId(): string {
    return this.generateCanonicalId('med_');
  }

  public generatePublishingId(): string {
    return this.generateCanonicalId('pub_');
  }

  public generateUserId(): string {
    return this.generateCanonicalId('usr_');
  }

  public generateReviewId(): string {
    return this.generateCanonicalId('rev_');
  }

  public generateAuditId(): string {
    return this.generateCanonicalId('aud_');
  }

  /**
   * Validates whether a candidate string is a valid canonical ID.
   * If expectedPrefix is provided, asserts prefix equality.
   */
  public validateCanonicalId(id: string, expectedPrefix?: CanonicalPrefix): boolean {
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
  public parseCanonicalId(id: string): { prefix: CanonicalPrefix; uuid: string } | null {
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

// Backward compatibility bridge to brownfield sequence service
export { IdService as LegacyIdService, idService as legacyIdService } from './services/id.service';
