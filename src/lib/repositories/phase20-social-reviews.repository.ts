/**
 * BURRA PARIKSHA CMS - Phase 20 Social Reviews Repository Adapter
 * Phase 20: Social Review & Quality Gate
 * 
 * Compatibility adapter delegating persistence to the canonical socialReviewsRepository.
 */

import { Phase20SocialReviewRecord } from '../../types';
import { socialReviewsRepository } from './social-reviews.repository';

export class Phase20SocialReviewsRepository {
  private static instance: Phase20SocialReviewsRepository | null = null;

  private constructor() {}

  public static getInstance(): Phase20SocialReviewsRepository {
    if (!Phase20SocialReviewsRepository.instance) {
      Phase20SocialReviewsRepository.instance = new Phase20SocialReviewsRepository();
    }
    return Phase20SocialReviewsRepository.instance;
  }

  public async create(record: Phase20SocialReviewRecord): Promise<Phase20SocialReviewRecord> {
    return socialReviewsRepository.createPhase20Record(record);
  }

  public async findById(id: string): Promise<Phase20SocialReviewRecord | null> {
    return socialReviewsRepository.findPhase20ById(id);
  }

  public async findByContentId(contentId: string): Promise<Phase20SocialReviewRecord[]> {
    return socialReviewsRepository.findPhase20ByContentId(contentId);
  }

  public async getLatestByContentId(contentId: string): Promise<Phase20SocialReviewRecord | null> {
    return socialReviewsRepository.getLatestPhase20ByContentId(contentId);
  }

  public async update(id: string, updates: Partial<Phase20SocialReviewRecord>): Promise<Phase20SocialReviewRecord> {
    return socialReviewsRepository.updatePhase20Record(id, updates);
  }

  public async invalidateReviewsForContent(contentId: string, reason: string): Promise<number> {
    return socialReviewsRepository.invalidatePhase20ReviewsForContent(contentId, reason);
  }

  public async clear(): Promise<void> {
    return socialReviewsRepository.clearPhase20Store();
  }
}

export const phase20SocialReviewsRepository = Phase20SocialReviewsRepository.getInstance();

