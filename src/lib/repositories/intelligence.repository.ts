/**
 * BURRA PARIKSHA CMS - Intelligence Repository
 * Phase 28: AI Social Performance Intelligence Storage
 * 
 * Manages persistence for AI Social Performance Intelligence records (BP-SPI-######).
 * Stores data exclusively in the SEPARATE Analytics Workbook (ANALYTICS_INTELLIGENCE tab).
 * Inherits strict cross-workbook safeguards ensuring zero CMS production workbook mutation.
 */

import { BaseRepository } from './base.repository';
import { SocialPerformanceIntelligenceRecord } from '../../types';
import { SOCIAL_PERFORMANCE_INTELLIGENCE_SCHEMA } from '../schemas/google-sheets-schema';

export class IntelligenceRepository extends BaseRepository<SocialPerformanceIntelligenceRecord> {
  private static instance: IntelligenceRepository | null = null;

  private constructor() {
    super(SOCIAL_PERFORMANCE_INTELLIGENCE_SCHEMA);
  }

  public static getInstance(): IntelligenceRepository {
    if (!IntelligenceRepository.instance) {
      IntelligenceRepository.instance = new IntelligenceRepository();
    }
    return IntelligenceRepository.instance;
  }

  /**
   * Overrides target spreadsheet ID to use ANALYTICS_SPREADSHEET_ID environment variable.
   * If unconfigured, returns sentinel 'UNCONFIGURED_ANALYTICS_SPREADSHEET' to prevent
   * accidental fallback to production GOOGLE_SHEETS_ID.
   */
  protected getTargetSpreadsheetId(): string | undefined {
    return process.env.ANALYTICS_SPREADSHEET_ID || 'UNCONFIGURED_ANALYTICS_SPREADSHEET';
  }

  /**
   * Find recent intelligence records ordered by analyzedAt descending.
   */
  public async getRecentIntelligence(limit: number = 20): Promise<SocialPerformanceIntelligenceRecord[]> {
    const records = await this.findAll();
    return records
      .sort((a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime())
      .slice(0, limit);
  }
}

export const intelligenceRepository = IntelligenceRepository.getInstance();
