/**
 * BURRA PARIKSHA CMS - Comment Intelligence Repository
 * Phase 30: Audience Social Comments & Comment Intelligence
 *
 * Persists AI Comment Intelligence records (BP-CMI-######) to authoritative Cloud Firestore.
 */

import { BaseRepository } from './base.repository';
import { CommentIntelligenceRecord } from '../../types';

export class CommentIntelligenceRepository extends BaseRepository<CommentIntelligenceRecord> {
  private static instance: CommentIntelligenceRepository | null = null;

  private constructor() {
    super('comment_intelligence', 'BP-CMI-');
  }

  public static getInstance(): CommentIntelligenceRepository {
    if (!CommentIntelligenceRepository.instance) {
      CommentIntelligenceRepository.instance = new CommentIntelligenceRepository();
    }
    return CommentIntelligenceRepository.instance;
  }

  /**
   * Finds all intelligence reports for a given Content Master ID (BP-CNT-######).
   */
  public async findByContentId(contentId: string): Promise<CommentIntelligenceRecord[]> {
    const all = await this.findAll();
    return all.filter((r) => r.contentId === contentId);
  }

  /**
   * Finds all intelligence reports for a specific Video ID (BP-V-######).
   */
  public async findByVideoId(videoId: string): Promise<CommentIntelligenceRecord[]> {
    const all = await this.findAll();
    return all.filter((r) => r.videoId === videoId);
  }

  /**
   * Find recent intelligence records ordered by analyzedAt descending.
   */
  public async getRecentIntelligence(limit: number = 20): Promise<CommentIntelligenceRecord[]> {
    const records = await this.findAll();
    return records
      .sort((a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime())
      .slice(0, limit);
  }
}

export const commentIntelligenceRepository = CommentIntelligenceRepository.getInstance();
