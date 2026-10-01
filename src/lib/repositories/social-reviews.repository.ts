/**
 * BURRA PARIKSHA CMS - Social Reviews Repository
 * Phase 8H: Social Content Review & Human Approval Workflow
 */

import { BaseRepository } from './base.repository';
import { SHEET_SCHEMAS, SHEET_TABS } from '../schemas/google-sheets-schema';
import { SocialReviewRecord, SocialQualityStatus, SocialReviewStatus } from '../../types';

export class SocialReviewsRepository extends BaseRepository<SocialReviewRecord> {
  private static instance: SocialReviewsRepository | null = null;
  private socialReviewStore = new Map<string, SocialReviewRecord>();

  private constructor() {
    super(SHEET_SCHEMAS[SHEET_TABS.SOCIAL_REVIEWS]);
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
      .sort((a, b) => new Date(b.reviewedAt).getTime() - new Date(a.reviewedAt).getTime());
  }

  public async getLatestByQuestion(questionId: string): Promise<SocialReviewRecord | null> {
    const reviews = await this.findByQuestion(questionId);
    return reviews.length > 0 ? reviews[0] : null;
  }

  // Canonical Phase 20 Social Review record support integrated into canonical repo
  public async createSocialReviewRecord(record: SocialReviewRecord): Promise<SocialReviewRecord> {
    this.socialReviewStore.set(record.id, { ...record });

    let decisionEnum = SocialReviewStatus.PENDING_REVIEW;
    const rawStatus = String(record.status || record.decision || '').toUpperCase();
    if (rawStatus === 'PASS' || rawStatus === 'APPROVED') {
      decisionEnum = SocialReviewStatus.APPROVED;
    } else if (rawStatus === 'CHANGES_REQUIRED' || rawStatus === 'CHANGES_REQUESTED') {
      decisionEnum = SocialReviewStatus.CHANGES_REQUESTED;
    } else if (rawStatus === 'REJECTED') {
      decisionEnum = SocialReviewStatus.REJECTED;
    }

    // Sync to Google Sheets SOCIAL_REVIEWS tab if applicable
    const mapped: SocialReviewRecord = {
      id: record.id,
      questionId: record.versionLock?.questionId || '',
      contentId: record.contentId,
      reviewedVersionHash: record.versionLock?.hashes?.packageOverallHash || '',
      reviewerId: record.assignedReviewerId || record.reviewedBy || 'SYSTEM',
      reviewerName: record.reviewedByName || 'System Validator',
      reviewerRole: record.reviewedByRole || 'REVIEWER',
      decision: decisionEnum,
      reason: record.decisionReason,
      feedbackCategories: record.feedbackCategories,
      overallQualityScoreAtReview: record.validationSummary?.isValid ? 100 : 50,
      qualityStatusAtReview: record.validationSummary?.isValid ? SocialQualityStatus.EXCELLENT : SocialQualityStatus.NEEDS_IMPROVEMENT,
      reviewedAt: record.reviewedAt || new Date().toISOString(),
    };
    try {
      await this.save(mapped);
    } catch {
      // In-memory fallback if sheet not configured
    }
    return { ...record };
  }

  public async findSocialReviewById(id: string): Promise<SocialReviewRecord | null> {
    const found = this.socialReviewStore.get(id);
    return found ? { ...found } : null;
  }

  public async findSocialReviewByContentId(contentId: string): Promise<SocialReviewRecord[]> {
    return Array.from(this.socialReviewStore.values())
      .filter((r) => r.contentId === contentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((r) => ({ ...r }));
  }

  public async getLatestSocialReviewByContentId(contentId: string): Promise<SocialReviewRecord | null> {
    const reviews = await this.findSocialReviewByContentId(contentId);
    return reviews.length > 0 ? { ...reviews[0] } : null;
  }

  public async getLatestByContentId(contentId: string): Promise<SocialReviewRecord | null> {
    return this.getLatestSocialReviewByContentId(contentId);
  }

  public async updateSocialReviewRecord(
    id: string,
    updates: Partial<SocialReviewRecord>
  ): Promise<SocialReviewRecord> {
    const existing = this.socialReviewStore.get(id);
    if (!existing) {
      throw new Error(`Social review record with ID "${id}" does not exist.`);
    }

    const updated: SocialReviewRecord = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.socialReviewStore.set(id, updated);
    return { ...updated };
  }

  public async invalidateSocialReviewsForContent(contentId: string, reason: string): Promise<number> {
    let count = 0;
    const now = new Date().toISOString();
    for (const [id, record] of this.socialReviewStore.entries()) {
      if (record.contentId === contentId && !record.isInvalidated && record.status === 'PASS') {
        this.socialReviewStore.set(id, {
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

  public async clearSocialReviewStore(): Promise<void> {
    this.socialReviewStore.clear();
  }
}

export const socialReviewsRepository = SocialReviewsRepository.getInstance();



