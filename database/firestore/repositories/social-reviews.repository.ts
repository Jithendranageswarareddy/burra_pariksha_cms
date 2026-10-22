/**
 * BURRA PARIKSHA CMS - Social Reviews Repository
 * Authoritative Firestore persistence
 */

import { BaseRepository } from './base.repository';
import { SocialReviewRecord, SocialReviewStatus, SocialQualityStatus } from '../../../shared';

export class SocialReviewsRepository extends BaseRepository<SocialReviewRecord> {
  private static instance: SocialReviewsRepository | null = null;

  private constructor() {
    super('social_reviews', 'rev_');
  }

  public static getInstance(): SocialReviewsRepository {
    if (!SocialReviewsRepository.instance) {
      SocialReviewsRepository.instance = new SocialReviewsRepository();
    }
    return SocialReviewsRepository.instance;
  }

  public async save(record: SocialReviewRecord): Promise<SocialReviewRecord> {
    const existing = await this.findById(record.id);
    if (existing) {
      const updated = await this.updateRecord(record.id, record);
      if (updated) return updated;
    }
    return this.create(record);
  }

  public async findByQuestion(questionId: string): Promise<SocialReviewRecord[]> {
    const all = await this.findAll();
    return all
      .filter((r) => r.questionId === questionId)
      .sort((a, b) => new Date(b.reviewedAt || 0).getTime() - new Date(a.reviewedAt || 0).getTime());
  }

  public async getLatestByQuestion(questionId: string): Promise<SocialReviewRecord | null> {
    const reviews = await this.findByQuestion(questionId);
    return reviews.length > 0 ? reviews[0] : null;
  }

  public async createSocialReviewRecord(record: SocialReviewRecord): Promise<SocialReviewRecord> {
    const existing = await this.findById(record.id);
    if (existing) {
      const updated = await this.updateRecord(record.id, record);
      return updated || record;
    }
    return this.appendRecord(record);
  }

  public async findSocialReviewById(id: string): Promise<SocialReviewRecord | null> {
    return this.findById(id);
  }

  public async findSocialReviewByContentId(contentId: string): Promise<SocialReviewRecord[]> {
    const all = await this.findAll();
    return all
      .filter((r) => r.contentId === contentId)
      .sort(
        (a, b) =>
          new Date(b.createdAt || b.reviewedAt || 0).getTime() -
          new Date(a.createdAt || a.reviewedAt || 0).getTime()
      );
  }

  public async getLatestSocialReviewByContentId(contentId: string): Promise<SocialReviewRecord | null> {
    const reviews = await this.findSocialReviewByContentId(contentId);
    return reviews.length > 0 ? reviews[0] : null;
  }

  public async getLatestByContentId(contentId: string): Promise<SocialReviewRecord | null> {
    return this.getLatestSocialReviewByContentId(contentId);
  }

  public async updateSocialReviewRecord(
    id: string,
    updates: Partial<SocialReviewRecord>
  ): Promise<SocialReviewRecord> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Social review record with ID "${id}" does not exist.`);
    }

    const updated = await this.updateRecord(id, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });

    return updated || { ...existing, ...updates };
  }

  public async invalidateSocialReviewsForContent(contentId: string, reason: string): Promise<number> {
    const reviews = await this.findSocialReviewByContentId(contentId);
    let count = 0;
    const now = new Date().toISOString();

    for (const record of reviews) {
      if (!record.isInvalidated && (record.status === 'PASS' || record.decision === SocialReviewStatus.APPROVED)) {
        await this.updateRecord(record.id, {
          isInvalidated: true,
          invalidatedReason: reason,
          invalidatedAt: now,
          updatedAt: now,
        });
        count++;
      }
    }
    return count;
  }

  public async clearSocialReviewStore(): Promise<void> {
    const all = await this.findAll();
    await Promise.all(all.map((r) => this.deleteRecord(r.id)));
  }
}

export const socialReviewsRepository = SocialReviewsRepository.getInstance();
