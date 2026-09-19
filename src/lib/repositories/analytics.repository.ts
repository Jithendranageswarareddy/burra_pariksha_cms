/**
 * BURRA PARIKSHA CMS - Analytics Repository
 * Phase 27: Social Analytics Data Layer
 * 
 * Manages social analytics snapshots in a SEPARATE analytics Google Sheet workbook
 * configured via ANALYTICS_SPREADSHEET_ID.
 * 
 * STRICT ARCHITECTURAL CONSTRAINTS:
 * - Operates on ANALYTICS_SPREADSHEET_ID.
 * - Zero write paths to production CMS workbook or entities.
 * - Graceful fallback to local store if ANALYTICS_SPREADSHEET_ID is missing.
 * - Append-only historical snapshot preservation.
 */

import { BaseRepository } from './base.repository';
import { SOCIAL_ANALYTICS_SCHEMA } from '../schemas/google-sheets-schema';
import { SocialAnalyticsRecord, SocialAnalyticsQueryFilters } from '../../types';

export class AnalyticsRepository extends BaseRepository<SocialAnalyticsRecord> {
  private static instance: AnalyticsRepository | null = null;

  private constructor() {
    super(SOCIAL_ANALYTICS_SCHEMA);
  }

  public static getInstance(): AnalyticsRepository {
    if (!AnalyticsRepository.instance) {
      AnalyticsRepository.instance = new AnalyticsRepository();
    }
    return AnalyticsRepository.instance;
  }

  /**
   * Overrides target spreadsheet ID to use ANALYTICS_SPREADSHEET_ID environment variable.
   * If unconfigured, returns sentinel 'UNCONFIGURED_ANALYTICS_SPREADSHEET' to prevent
   * accidental fallback to production GOOGLE_SHEETS_ID.
   */
  protected override getTargetSpreadsheetId(): string | undefined {
    return process.env.ANALYTICS_SPREADSHEET_ID || undefined;
  }

  /**
   * Finds all analytics snapshot records for a canonical Content ID.
   */
  public async findByContentId(contentId: string): Promise<SocialAnalyticsRecord[]> {
    const all = await this.findAll();
    return all.filter((r) => r.contentId === contentId);
  }

  /**
   * Finds all analytics snapshot records for a given publishing platform.
   */
  public async findByPlatform(platform: string): Promise<SocialAnalyticsRecord[]> {
    const all = await this.findAll();
    return all.filter((r) => r.platform.toLowerCase() === platform.toLowerCase());
  }

  /**
   * Finds duplicate snapshots created for the same contentId, platform, and timeframe.
   */
  public async findDuplicateSnapshot(
    contentId: string,
    platform: string,
    postingTimestamp?: string,
    windowSeconds: number = 60
  ): Promise<SocialAnalyticsRecord | null> {
    const records = await this.findByContentId(contentId);
    const platformRecords = records.filter(
      (r) => r.platform.toLowerCase() === platform.toLowerCase()
    );

    const now = Date.now();
    for (const rec of platformRecords) {
      if (postingTimestamp && rec.postingTimestamp === postingTimestamp) {
        return rec;
      }
      if (rec.capturedAt) {
        const capturedMs = new Date(rec.capturedAt).getTime();
        if (!isNaN(capturedMs) && Math.abs(now - capturedMs) < windowSeconds * 1000) {
          return rec;
        }
      }
    }
    return null;
  }

  /**
   * Queries analytics records based on filter criteria.
   */
  public async query(filters: SocialAnalyticsQueryFilters): Promise<SocialAnalyticsRecord[]> {
    let records = await this.findAll();

    if (filters.contentId) {
      records = records.filter((r) => r.contentId === filters.contentId);
    }
    if (filters.platform) {
      records = records.filter((r) => r.platform.toLowerCase() === filters.platform!.toLowerCase());
    }
    if (filters.topicId) {
      records = records.filter((r) => r.topicId === filters.topicId);
    }
    if (filters.subtopicId) {
      records = records.filter((r) => r.subtopicId === filters.subtopicId);
    }
    if (filters.startDate) {
      const startMs = new Date(filters.startDate).getTime();
      if (!isNaN(startMs)) {
        records = records.filter((r) => {
          const dateStr = r.postingTimestamp || r.capturedAt;
          const recMs = new Date(dateStr).getTime();
          return !isNaN(recMs) && recMs >= startMs;
        });
      }
    }
    if (filters.endDate) {
      const endMs = new Date(filters.endDate).getTime();
      if (!isNaN(endMs)) {
        records = records.filter((r) => {
          const dateStr = r.postingTimestamp || r.capturedAt;
          const recMs = new Date(dateStr).getTime();
          return !isNaN(recMs) && recMs <= endMs;
        });
      }
    }

    return records;
  }
}

export const analyticsRepository = AnalyticsRepository.getInstance();
