/**
 * BURRA PARIKSHA CMS - Social Reviews Repository
 * Phase 8H: Social Content Review & Human Approval Workflow
 */

import { BaseRepository } from './base.repository';
import { SHEET_SCHEMAS, SHEET_TABS } from '../schemas/google-sheets-schema';
import { SocialReviewRecord, Phase20SocialReviewRecord, SocialQualityStatus, SocialReviewStatus } from '../../types';

export class SocialReviewsRepository extends BaseRepository<SocialReviewRecord> {
  private static instance: SocialReviewsRepository | null = null;
  private phase20ReviewStore = new Map<string, Phase20SocialReviewRecord>();

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

  // Canonical Phase 20 Social Review record support integrated into canonical repo
  public async createPhase20Record(record: Phase20SocialReviewRecord): Promise<Phase20SocialReviewRecord> {
    this.phase20ReviewStore.set(record.id, { ...record });
    // Also sync to Google Sheets SOCIAL_REVIEWS tab if applicable
    const mapped: SocialReviewRecord = {
      id: record.id,
      questionId: record.versionLock?.questionId || '',
      contentId: record.contentId,
      reviewedVersionHash: record.versionLock?.hashes?.packageHash || '',
      reviewerId: record.assignedReviewerId || record.reviewedBy || 'SYSTEM',
      reviewerName: record.reviewedByName || 'System Validator',
      reviewerRole: record.reviewedByRole || 'REVIEWER',
      decision: (record.status as unknown as SocialReviewStatus) || ('PENDING' as SocialReviewStatus),
      reason: record.decisionReason,
      feedbackCategories: record.feedbackCategories,
      overallQualityScoreAtReview: record.validationSummary?.isValid ? 100 : 50,
      qualityStatusAtReview: record.validationSummary?.isValid ? SocialQualityStatus.EXCELLENT : SocialQualityStatus.NEEDS_IMPROVEMENT,
      reviewedAt: record.reviewedAt || new Date().toISOString(),
    };
    try {
      await this.create(mapped);
    } catch {
      // In-memory fallback if sheet not configured
    }
    return { ...record };
  }

  public async findPhase20ById(id: string): Promise<Phase20SocialReviewRecord | null> {
    const found = this.phase20ReviewStore.get(id);
    return found ? { ...found } : null;
  }

  public async findPhase20ByContentId(contentId: string): Promise<Phase20SocialReviewRecord[]> {
    return Array.from(this.phase20ReviewStore.values())
      .filter((r) => r.contentId === contentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((r) => ({ ...r }));
  }

  public async getLatestPhase20ByContentId(contentId: string): Promise<Phase20SocialReviewRecord | null> {
    const reviews = await this.findPhase20ByContentId(contentId);
    return reviews.length > 0 ? { ...reviews[0] } : null;
  }

  public async updatePhase20Record(
    id: string,
    updates: Partial<Phase20SocialReviewRecord>
  ): Promise<Phase20SocialReviewRecord> {
    const existing = this.phase20ReviewStore.get(id);
    if (!existing) {
      throw new Error(`Social review record with ID "${id}" does not exist.`);
    }

    const updated: Phase20SocialReviewRecord = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.phase20ReviewStore.set(id, updated);
    return { ...updated };
  }

  public async invalidatePhase20ReviewsForContent(contentId: string, reason: string): Promise<number> {
    let count = 0;
    const now = new Date().toISOString();
    for (const [id, record] of this.phase20ReviewStore.entries()) {
      if (record.contentId === contentId && !record.isInvalidated && record.status === 'PASS') {
        this.phase20ReviewStore.set(id, {
          ...record,
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

  public async clearPhase20Store(): Promise<void> {
    this.phase20ReviewStore.clear();
  }
}

export const socialReviewsRepository = SocialReviewsRepository.getInstance();


