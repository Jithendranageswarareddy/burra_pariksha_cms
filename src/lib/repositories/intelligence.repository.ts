/**
 * BURRA PARIKSHA CMS - Intelligence Repository
 * Phase 28: AI Social Performance Intelligence Storage
 *
 * Persists AI Social Performance Intelligence records (BP-SPI-######) to authoritative Cloud Firestore.
 */

import { BaseRepository } from './base.repository';
import { SocialPerformanceIntelligenceRecord } from '../../types';

export class IntelligenceRepository extends BaseRepository<SocialPerformanceIntelligenceRecord> {
  private static instance: IntelligenceRepository | null = null;

  private constructor() {
    super('social_performance_intelligence', 'BP-SPI-');
  }

  public static getInstance(): IntelligenceRepository {
    if (!IntelligenceRepository.instance) {
      IntelligenceRepository.instance = new IntelligenceRepository();
    }
    return IntelligenceRepository.instance;
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
