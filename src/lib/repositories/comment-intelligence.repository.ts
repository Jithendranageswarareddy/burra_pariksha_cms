/**
 * BURRA PARIKSHA CMS - Comment Intelligence Repository
 * Phase 30: Audience Social Comments & Comment Intelligence
 * 
 * Manages persistence for AI Comment Intelligence records (BP-CMI-######).
 * Stores data exclusively in the SEPARATE Analytics Workbook (COMMENT_INTELLIGENCE tab).
 * Enforces strict cross-workbook safeguards ensuring zero CMS production workbook mutation.
 */

import { BaseRepository } from './base.repository';
import { CommentIntelligenceRecord } from '../../types';
import { COMMENT_INTELLIGENCE_SCHEMA } from '../schemas/google-sheets-schema';

export class CommentIntelligenceRepository extends BaseRepository<CommentIntelligenceRecord> {
  private static instance: CommentIntelligenceRepository | null = null;

  private constructor() {
    super(COMMENT_INTELLIGENCE_SCHEMA);
  }

  public static getInstance(): CommentIntelligenceRepository {
    if (!CommentIntelligenceRepository.instance) {
      CommentIntelligenceRepository.instance = new CommentIntelligenceRepository();
    }
    return CommentIntelligenceRepository.instance;
  }

  /**
   * Overrides target spreadsheet ID to use ANALYTICS_SPREADSHEET_ID environment variable.
   * If unconfigured, returns sentinel 'UNCONFIGURED_ANALYTICS_SPREADSHEET' to prevent
   * accidental fallback to production GOOGLE_SHEETS_ID.
   */
  protected override getTargetSpreadsheetId(): string | undefined {
    if (this.client.isTestMode()) {
      return process.env.TEST_ANALYTICS_SPREADSHEET_ID || 'UNCONFIGURED_ANALYTICS_SPREADSHEET';
    }
    return process.env.ANALYTICS_SPREADSHEET_ID || 'UNCONFIGURED_ANALYTICS_SPREADSHEET';
  }

  /**
   * Seed fallback data for local memory mode testing.
   */
  protected getInitialFallbackData(): CommentIntelligenceRecord[] {
    return [];
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
