/**
 * BURRA PARIKSHA CMS - Social Reviews Repository
 * Phase 8H: Social Content Review & Human Approval Workflow
 */

import { BaseRepository } from './base.repository';
import { SHEET_SCHEMAS, SHEET_TABS } from '../schemas/google-sheets-schema';
import { SocialReviewRecord } from '../../types';

export class SocialReviewsRepository extends BaseRepository<SocialReviewRecord> {
  private static instance: SocialReviewsRepository | null = null;

  private constructor() {
    super(SHEET_SCHEMAS[SHEET_TABS.SOCIAL_REVIEWS]);
  }

  public static getInstance(): SocialReviewsRepository {
    if (!SocialReviewsRepository.instance) {
      SocialReviewsRepository.instance = new SocialReviewsRepository();
    }
    return SocialReviewsRepository.instance;
  }

  public async findByQuestion(questionId: string): Promise<SocialReviewRecord[]> {
    const all = await this.findAll();
    return all
      .filter((r) => r.questionId === questionId)
      .sort((a, b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime());
  }

  public async getLatestByQuestion(questionId: string): Promise<SocialReviewRecord | null> {
    const reviews = await this.findByQuestion(questionId);
    return reviews.length > 0 ? reviews[0] : null;
  }
}

export const socialReviewsRepository = SocialReviewsRepository.getInstance();
