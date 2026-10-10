/**
 * BURRA PARIKSHA CMS - Strategy Recommendation Repository
 * Phase 29: AI Content Strategy & Adaptive Generation Persistence
 *
 * Persists AI content strategy recommendations (BP-STR-######) to authoritative Cloud Firestore.
 */

import { BaseRepository } from './base.repository';
import { ContentStrategyRecommendation } from '../../types';

export class StrategyRecommendationRepository extends BaseRepository<ContentStrategyRecommendation> {
  private static instance: StrategyRecommendationRepository | null = null;

  private constructor() {
    super('content_strategy', 'BP-STR-');
  }

  public static getInstance(): StrategyRecommendationRepository {
    if (!StrategyRecommendationRepository.instance) {
      StrategyRecommendationRepository.instance = new StrategyRecommendationRepository();
    }
    return StrategyRecommendationRepository.instance;
  }

  public async getRecentRecommendations(limit: number = 20): Promise<ContentStrategyRecommendation[]> {
    const records = await this.findAll();
    return records
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
}

export const strategyRecommendationRepository = StrategyRecommendationRepository.getInstance();
