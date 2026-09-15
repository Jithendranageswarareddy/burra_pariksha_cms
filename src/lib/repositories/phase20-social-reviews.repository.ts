/**
 * BURRA PARIKSHA CMS - Phase 20 Social Reviews Repository
 * Phase 20: Social Review & Quality Gate
 * 
 * Manages persistence of social review records, audit locks, version hashes,
 * and review invalidations.
 */

import { Phase20SocialReviewRecord, Phase20SocialReviewStatus } from '../../types';

export class Phase20SocialReviewsRepository {
  private static instance: Phase20SocialReviewsRepository | null = null;
  private reviewStore = new Map<string, Phase20SocialReviewRecord>();

  private constructor() {}

  public static getInstance(): Phase20SocialReviewsRepository {
    if (!Phase20SocialReviewsRepository.instance) {
      Phase20SocialReviewsRepository.instance = new Phase20SocialReviewsRepository();
    }
    return Phase20SocialReviewsRepository.instance;
  }

  public async create(record: Phase20SocialReviewRecord): Promise<Phase20SocialReviewRecord> {
    this.reviewStore.set(record.id, { ...record });
    return { ...record };
  }

  public async findById(id: string): Promise<Phase20SocialReviewRecord | null> {
    const found = this.reviewStore.get(id);
    return found ? { ...found } : null;
  }

  public async findByContentId(contentId: string): Promise<Phase20SocialReviewRecord[]> {
    return Array.from(this.reviewStore.values())
      .filter((r) => r.contentId === contentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((r) => ({ ...r }));
  }

  public async getLatestByContentId(contentId: string): Promise<Phase20SocialReviewRecord | null> {
    const reviews = await this.findByContentId(contentId);
    return reviews.length > 0 ? { ...reviews[0] } : null;
  }

  public async update(id: string, updates: Partial<Phase20SocialReviewRecord>): Promise<Phase20SocialReviewRecord> {
    const existing = this.reviewStore.get(id);
    if (!existing) {
      throw new Error(`Social review record with ID "${id}" does not exist.`);
    }

    const updated: Phase20SocialReviewRecord = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.reviewStore.set(id, updated);
    return { ...updated };
  }

  public async invalidateReviewsForContent(contentId: string, reason: string): Promise<number> {
    let count = 0;
    const now = new Date().toISOString();
    for (const [id, record] of this.reviewStore.entries()) {
      if (record.contentId === contentId && !record.isInvalidated && record.status === 'PASS') {
        this.reviewStore.set(id, {
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

  public async clear(): Promise<void> {
    this.reviewStore.clear();
  }
}

export const phase20SocialReviewsRepository = Phase20SocialReviewsRepository.getInstance();
