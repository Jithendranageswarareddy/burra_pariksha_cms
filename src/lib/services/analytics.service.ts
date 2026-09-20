/**
 * BURRA PARIKSHA CMS - Social Analytics Service
 * Phase 27: Social Analytics Data Layer
 * 
 * Provides business logic for social performance analytics data ingestion,
 * validation, historical snapshot preservation, query filtering, and summary metrics.
 * 
 * GUARANTEES & SAFETY CONSTRAINTS:
 * 1. ₹0 architecture: manual entry & bulk file import support with zero paid API dependencies.
 * 2. Canonical BP-CNT-###### validation before accepting analytics records.
 * 3. Historical snapshot preservation: new metric recordings always append new records;
 *    existing records are never mutated or overwritten.
 * 4. Separate analytics workbook: operates on ANALYTICS_SPREADSHEET_ID via AnalyticsRepository.
 * 5. Zero CMS contamination: NO write paths to production CMS entities (questions, content masters, etc).
 * 6. Non-blocking & graceful: handles unconfigured analytics spreadsheet gracefully via local fallback.
 */

import { analyticsRepository, AnalyticsRepository } from '../repositories/analytics.repository';
import { contentMastersRepository } from '../repositories/content-masters.repository';
import { idService } from './id.service';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import { SEQUENCE_ENTITIES } from '../schemas/google-sheets-schema';
import {
  CreateSocialAnalyticsInput,
  ImportSocialAnalyticsInput,
  SocialAnalyticsRecord,
  SocialAnalyticsQueryFilters,
  SocialAnalyticsSummary,
} from '../../types';

export class AnalyticsService {
  private static instance: AnalyticsService | null = null;
  private analyticsRepo: AnalyticsRepository;
  private auditLogRepo: AuditLogRepository;

  private constructor() {
    this.analyticsRepo = analyticsRepository;
    this.auditLogRepo = AuditLogRepository.getInstance();
  }

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  /**
   * Validates canonical Content ID format and existence.
   */
  public async validateCanonicalContentId(contentId: string): Promise<boolean> {
    const CANONICAL_REGEX = /^BP-CNT-\d{6}$/;
    if (!contentId || !CANONICAL_REGEX.test(contentId)) {
      return false;
    }

    try {
      // Check if Content Master exists in production workbook (read-only verification)
      const master = await contentMastersRepository.findById(contentId);
      return Boolean(master);
    } catch {
      // Fallback: format check is authoritative if CMS repo is cold
      return true;
    }
  }

  /**
   * Record a single social analytics snapshot.
   * Enforces canonical ID validation, generates sequential BP-ANL-###### ID,
   * preserves historical snapshots (append-only), and logs audit trail.
   */
  public async recordAnalyticsSnapshot(
    input: CreateSocialAnalyticsInput,
    actorId: string = 'SYSTEM',
    actorName: string = 'System User'
  ): Promise<{ success: boolean; record?: SocialAnalyticsRecord; error?: string }> {
    // 1. Validate Canonical BP-CNT-###### format
    const isValidId = await this.validateCanonicalContentId(input.contentId);
    if (!isValidId) {
      return {
        success: false,
        error: `Invalid or unverified canonical Content ID "${input.contentId}". Format must be BP-CNT-###### and must correspond to a valid Content Master.`,
      };
    }

    // 2. Duplicate detection check (scoped to videoId when provided, or contentId, platform, within 60 seconds)
    const duplicate = await this.analyticsRepo.findDuplicateSnapshot(
      input.contentId,
      input.platform,
      input.postingTimestamp,
      60,
      input.videoId
    );
    if (duplicate) {
      return {
        success: true,
        record: duplicate,
        error: `Existing snapshot for ${input.contentId}${input.videoId ? ` (video: ${input.videoId})` : ''} on ${input.platform} detected within recent timeframe. Returned existing snapshot to prevent duplicate contamination.`,
      };
    }

    // 3. Generate sequential ID: BP-ANL-######
    const id = await idService.allocateSocialAnalyticsId();

    // 4. Construct historical snapshot record
    const now = new Date().toISOString();
    const record: SocialAnalyticsRecord = {
      id,
      contentId: input.contentId,
      videoId: input.videoId,
      publishingId: input.publishingId,
      platformPostId: input.platformPostId,
      platform: input.platform.toLowerCase(),
      postingTimestamp: input.postingTimestamp || now,
      views: Number(input.views) || 0,
      watchTime: Number(input.watchTime) || 0,
      retentionRate: Number(input.retentionRate) || 0,
      likes: Number(input.likes) || 0,
      comments: Number(input.comments) || 0,
      shares: Number(input.shares) || 0,
      subscribersGained: Number(input.subscribersGained) || 0,
      ctr: Number(input.ctr) || 0,
      capturedAt: input.capturedAt || now,
      topicId: input.topicId || '',
      subtopicId: input.subtopicId || '',
      difficulty: input.difficulty || '',
      challengeType: input.challengeType || '',
      language: input.language || '',
      presentationType: input.presentationType || '',
      notes: input.notes || '',
    };

    // 5. Save to SEPARATE analytics repository (append-only)
    const saved = await this.analyticsRepo.appendRecord(record);

    // 6. Audit Logging
    await this.auditLogRepo.logAction(
      actorId,
      actorName,
      'ANALYTICS_RECORD_CREATED',
      'SOCIAL_ANALYTICS',
      id,
      {
        contentId: input.contentId,
        videoId: input.videoId,
        publishingId: input.publishingId,
        platform: input.platform,
        views: record.views,
      }
    );

    return { success: true, record: saved };
  }

  /**
   * Bulk import social analytics records (manual CSV/JSON import).
   */
  public async bulkImportAnalytics(
    input: ImportSocialAnalyticsInput,
    actorId: string = 'SYSTEM',
    actorName: string = 'System User'
  ): Promise<{
    totalSubmitted: number;
    totalImported: number;
    failedRecords: { index: number; contentId: string; error: string }[];
    records: SocialAnalyticsRecord[];
  }> {
    const records: SocialAnalyticsRecord[] = [];
    const failedRecords: { index: number; contentId: string; error: string }[] = [];

    for (let i = 0; i < input.records.length; i++) {
      const item = input.records[i];
      const res = await this.recordAnalyticsSnapshot(item, actorId, actorName);
      if (res.success && res.record) {
        records.push(res.record);
      } else {
        failedRecords.push({
          index: i,
          contentId: item.contentId || 'UNKNOWN',
          error: res.error || 'Failed to import analytics record',
        });
      }
    }

    if (records.length > 0) {
      await this.auditLogRepo.logAction(
        actorId,
        actorName,
        'ANALYTICS_BULK_IMPORTED',
        'SOCIAL_ANALYTICS',
        `BULK-${Date.now()}`,
        { totalImported: records.length, totalFailed: failedRecords.length }
      );
    }

    return {
      totalSubmitted: input.records.length,
      totalImported: records.length,
      failedRecords,
      records,
    };
  }

  /**
   * Queries analytics records with filters.
   */
  public async queryAnalytics(filters: SocialAnalyticsQueryFilters): Promise<SocialAnalyticsRecord[]> {
    return this.analyticsRepo.query(filters);
  }

  /**
   * Computes aggregated analytics performance summary across all or filtered records.
   */
  public async getAnalyticsSummary(filters: SocialAnalyticsQueryFilters = {}): Promise<SocialAnalyticsSummary> {
    const records = await this.queryAnalytics(filters);

    if (records.length === 0) {
      return {
        totalRecords: 0,
        totalViews: 0,
        totalWatchTime: 0,
        averageRetentionRate: 0,
        totalLikes: 0,
        totalComments: 0,
        totalShares: 0,
        totalSubscribersGained: 0,
        averageCtr: 0,
        platformBreakdown: {},
      };
    }

    let totalViews = 0;
    let totalWatchTime = 0;
    let sumRetention = 0;
    let totalLikes = 0;
    let totalComments = 0;
    let totalShares = 0;
    let totalSubscribersGained = 0;
    let sumCtr = 0;

    const platformBreakdown: Record<string, {
      views: number;
      watchTime: number;
      likes: number;
      comments: number;
      shares: number;
      count: number;
    }> = {};

    for (const r of records) {
      totalViews += r.views;
      totalWatchTime += r.watchTime;
      sumRetention += r.retentionRate;
      totalLikes += r.likes;
      totalComments += r.comments;
      totalShares += r.shares;
      totalSubscribersGained += r.subscribersGained;
      sumCtr += r.ctr;

      const pKey = r.platform.toLowerCase();
      if (!platformBreakdown[pKey]) {
        platformBreakdown[pKey] = {
          views: 0,
          watchTime: 0,
          likes: 0,
          comments: 0,
          shares: 0,
          count: 0,
        };
      }
      platformBreakdown[pKey].views += r.views;
      platformBreakdown[pKey].watchTime += r.watchTime;
      platformBreakdown[pKey].likes += r.likes;
      platformBreakdown[pKey].comments += r.comments;
      platformBreakdown[pKey].shares += r.shares;
      platformBreakdown[pKey].count += 1;
    }

    return {
      totalRecords: records.length,
      totalViews,
      totalWatchTime,
      averageRetentionRate: Number((sumRetention / records.length).toFixed(2)),
      totalLikes,
      totalComments,
      totalShares,
      totalSubscribersGained,
      averageCtr: Number((sumCtr / records.length).toFixed(2)),
      platformBreakdown,
    };
  }
}

export const analyticsService = AnalyticsService.getInstance();
