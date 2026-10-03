/**
 * BURRA PARIKSHA CMS - Strategy Recommendation Repository
 * Phase 29: AI Content Strategy & Adaptive Generation Persistence
 * 
 * Manages persistence for Phase 29 AI content strategy recommendations (BP-STR-######).
 * Stores data exclusively in the SEPARATE Analytics Workbook (STRATEGY_RECOMMENDATIONS tab).
 * Enforces strict isolation with zero CMS production workbook mutation.
 */

import { BaseRepository } from './base.repository';
import { ContentStrategyRecommendation } from '../../types';
import { STRATEGY_RECOMMENDATION_SCHEMA } from '../schemas/google-sheets-schema';

export class StrategyRecommendationRepository extends BaseRepository<ContentStrategyRecommendation> {
  private static instance: StrategyRecommendationRepository | null = null;

  private constructor() {
    super(STRATEGY_RECOMMENDATION_SCHEMA);
  }

  public static getInstance(): StrategyRecommendationRepository {
    if (!StrategyRecommendationRepository.instance) {
      StrategyRecommendationRepository.instance = new StrategyRecommendationRepository();
    }
    return StrategyRecommendationRepository.instance;
  }

  /**
   * Overrides target spreadsheet ID to use ANALYTICS_SPREADSHEET_ID environment variable.
   * If unconfigured, returns sentinel to prevent accidental fallback to production GOOGLE_SHEETS_ID.
   */
  protected getTargetSpreadsheetId(): string | undefined {
    return process.env.ANALYTICS_SPREADSHEET_ID || 'UNCONFIGURED_ANALYTICS_SPREADSHEET';
  }

  public async getRecentRecommendations(limit: number = 20): Promise<ContentStrategyRecommendation[]> {
    const records = await this.findAll();
    return records
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
}

export const strategyRecommendationRepository = StrategyRecommendationRepository.getInstance();
