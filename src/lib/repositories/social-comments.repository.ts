/**
 * BURRA PARIKSHA CMS - Social Comments Repository
 * Phase 30: Audience Social Comments & Comment Intelligence
 * 
 * Manages audience social comments in the SEPARATE Analytics Google Sheet workbook
 * configured via ANALYTICS_SPREADSHEET_ID.
 * 
 * STRICT ARCHITECTURAL CONSTRAINTS:
 * - Operates exclusively on ANALYTICS_SPREADSHEET_ID.
 * - Zero write paths to production CMS workbook or production entities.
 * - Graceful fallback to isolated local store if ANALYTICS_SPREADSHEET_ID is unconfigured.
 * - Append-only and safe deduplication for audience feedback records.
 */

import { BaseRepository } from './base.repository';
import { SocialCommentRecord, SocialCommentQueryFilters } from '../../types';

export class SocialCommentsRepository extends BaseRepository<SocialCommentRecord> {
  private static instance: SocialCommentsRepository | null = null;

  private constructor() {
    super('social_comments', 'BP-CMT-');
  }

  public static getInstance(): SocialCommentsRepository {
    if (!SocialCommentsRepository.instance) {
      SocialCommentsRepository.instance = new SocialCommentsRepository();
    }
    return SocialCommentsRepository.instance;
  }

  /**
   * Finds all comment records for a canonical Content Master ID (BP-CNT-######).
   */
  public async findByContentId(contentId: string): Promise<SocialCommentRecord[]> {
    const all = await this.findAll();
    return all.filter((r) => r.contentId === contentId);
  }

  /**
   * Finds all comment records for a specific Video ID (BP-V-######).
   */
  public async findByVideoId(videoId: string): Promise<SocialCommentRecord[]> {
    const all = await this.findAll();
    return all.filter((r) => r.videoId === videoId);
  }

  /**
   * Finds all comment records for a specific Publishing ID.
   */
  public async findByPublishingId(publishingId: string): Promise<SocialCommentRecord[]> {
    const all = await this.findAll();
    return all.filter((r) => r.publishingId === publishingId);
  }

  /**
   * Finds all comment records for a given publishing platform (e.g. youtube, instagram, facebook).
   */
  public async findByPlatform(platform: string): Promise<SocialCommentRecord[]> {
    const all = await this.findAll();
    return all.filter((r) => r.platform.toLowerCase() === platform.toLowerCase());
  }

  /**
   * Finds all comment records for a given platform post ID.
   */
  public async findByPlatformPostId(platformPostId: string): Promise<SocialCommentRecord[]> {
    const all = await this.findAll();
    return all.filter((r) => r.platformPostId === platformPostId);
  }

  /**
   * Finds a comment by the natural composite key (platform, platformCommentId).
   * Used for provider-level deduplication.
   */
  public async findByPlatformCommentId(
    platform: string,
    platformCommentId: string
  ): Promise<SocialCommentRecord | null> {
    if (!platformCommentId) return null;
    const all = await this.findAll();
    const normalizedPlatform = platform.toLowerCase();
    const match = all.find(
      (r) =>
        r.platform.toLowerCase() === normalizedPlatform &&
        r.platformCommentId === platformCommentId
    );
    return match || null;
  }

  /**
   * Queries comments with multi-dimensional filtering.
   */
  public async query(filters: SocialCommentQueryFilters): Promise<SocialCommentRecord[]> {
    let records = await this.findAll();

    if (filters.contentId) {
      records = records.filter((r) => r.contentId === filters.contentId);
    }
    if (filters.videoId) {
      records = records.filter((r) => r.videoId === filters.videoId);
    }
    if (filters.publishingId) {
      records = records.filter((r) => r.publishingId === filters.publishingId);
    }
    if (filters.platform) {
      const p = filters.platform.toLowerCase();
      records = records.filter((r) => r.platform.toLowerCase() === p);
    }
    if (filters.platformPostId) {
      records = records.filter((r) => r.platformPostId === filters.platformPostId);
    }
    if (filters.platformCommentId) {
      records = records.filter((r) => r.platformCommentId === filters.platformCommentId);
    }
    if (filters.source) {
      records = records.filter((r) => r.source === filters.source);
    }
    if (filters.status) {
      records = records.filter((r) => r.status === filters.status);
    }
    if (filters.isReply !== undefined) {
      records = records.filter((r) => Boolean(r.isReply) === Boolean(filters.isReply));
    }
    if (filters.startDate) {
      const startMs = new Date(filters.startDate).getTime();
      if (!isNaN(startMs)) {
        records = records.filter((r) => {
          const dateStr = r.commentCreatedAt || r.capturedAt;
          const recMs = new Date(dateStr).getTime();
          return !isNaN(recMs) && recMs >= startMs;
        });
      }
    }
    if (filters.endDate) {
      const endMs = new Date(filters.endDate).getTime();
      if (!isNaN(endMs)) {
        records = records.filter((r) => {
          const dateStr = r.commentCreatedAt || r.capturedAt;
          const recMs = new Date(dateStr).getTime();
          return !isNaN(recMs) && recMs <= endMs;
        });
      }
    }

    return records;
  }
}

export const socialCommentsRepository = SocialCommentsRepository.getInstance();
