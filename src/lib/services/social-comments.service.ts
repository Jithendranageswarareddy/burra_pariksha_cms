/**
 * BURRA PARIKSHA CMS - Social Comments Service
 * Phase 30: Audience Social Comments & Comment Intelligence
 * 
 * Provides business logic for audience social comment ingestion, validation,
 * deduplication, query filtering, and batch manual import.
 * 
 * STRICT ARCHITECTURAL CONSTRAINTS:
 * 1. Operates exclusively on ANALYTICS_SPREADSHEET_ID via SocialCommentsRepository.
 * 2. Zero write paths to production CMS workbook (questions, content_masters, etc).
 * 3. Authoritative server-side validation against C1 Zod schemas.
 * 4. Deduplication key: (platform, platformCommentId) when platformCommentId is provided.
 * 5. Manual comments without platformCommentId never fabricate provider IDs.
 * 6. Sequential ID generation: BP-CMT-###### via centralized IdService.
 * 7. Strictly NO AI analysis (reserved for C3).
 */

import { socialCommentsRepository, SocialCommentsRepository } from '../repositories/social-comments.repository';
import { contentMastersRepository } from '../repositories/content-masters.repository';
import { idService } from './id.service';
import { AuditLogRepository } from '../repositories/audit-log.repository';
import {
  CreateSocialCommentInputSchema,
  ImportSocialCommentsInputSchema,
} from '../schemas/google-sheets-schema';
import {
  CreateSocialCommentInput,
  ImportSocialCommentsInput,
  SocialCommentRecord,
  SocialCommentQueryFilters,
  SocialCommentStatus,
} from '../../types';

export interface CommentIngestionResult {
  success: boolean;
  record?: SocialCommentRecord;
  isDuplicate?: boolean;
  updated?: boolean;
  error?: string;
  details?: unknown;
}

export interface BatchImportCommentsResult {
  success: boolean;
  received: number;
  created: number;
  updated: number;
  duplicates: number;
  rejected: number;
  records: SocialCommentRecord[];
  errors: Array<{ index: number; commentText?: string; error: string }>;
}

export class SocialCommentsService {
  private static instance: SocialCommentsService | null = null;
  private commentsRepo: SocialCommentsRepository;
  private auditLogRepo: AuditLogRepository;

  private constructor() {
    this.commentsRepo = socialCommentsRepository;
    this.auditLogRepo = AuditLogRepository.getInstance();
  }

  public static getInstance(): SocialCommentsService {
    if (!SocialCommentsService.instance) {
      SocialCommentsService.instance = new SocialCommentsService();
    }
    return SocialCommentsService.instance;
  }

  /**
   * Validates canonical Content Master ID format (BP-CNT-######) and existence.
   */
  public async validateCanonicalContentId(contentId: string): Promise<boolean> {
    const CANONICAL_REGEX = /^BP-CNT-\d{6}$/;
    if (!contentId || !CANONICAL_REGEX.test(contentId)) {
      return false;
    }

    try {
      // Read-only existence check against production workbook
      const master = await contentMastersRepository.findById(contentId);
      return Boolean(master);
    } catch {
      // Format regex is authoritative if repo is cold
      return true;
    }
  }

  /**
   * Ingest a single audience social comment.
   * Enforces server-side Zod validation, platform normalization, deduplication,
   * sequential BP-CMT-###### ID generation, and audit logging.
   */
  public async createComment(
    input: CreateSocialCommentInput,
    actorId: string = 'SYSTEM',
    actorName: string = 'System User'
  ): Promise<CommentIngestionResult> {
    // 1. Authoritative Zod validation
    const parsed = CreateSocialCommentInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        error: 'Validation failed for social comment input',
        details: parsed.error.format(),
      };
    }

    const data = parsed.data;
    const normalizedPlatform = data.platform.toLowerCase();

    // 2. Deduplication check by (platform, platformCommentId) when platformCommentId is provided
    if (data.platformCommentId && data.platformCommentId.trim() !== '') {
      const existing = await this.commentsRepo.findByPlatformCommentId(
        normalizedPlatform,
        data.platformCommentId.trim()
      );

      if (existing) {
        // Check for mutable metric updates (likeCount, replyCount, status, commentText)
        let hasChanges = false;
        const updates: Partial<SocialCommentRecord> = {};

        if (data.likeCount !== undefined && data.likeCount !== existing.likeCount) {
          updates.likeCount = data.likeCount;
          hasChanges = true;
        }
        if (data.replyCount !== undefined && data.replyCount !== existing.replyCount) {
          updates.replyCount = data.replyCount;
          hasChanges = true;
        }
        if (data.status !== undefined && data.status !== existing.status) {
          updates.status = data.status;
          hasChanges = true;
        }
        if (data.commentText && data.commentText !== existing.commentText) {
          updates.commentText = data.commentText;
          hasChanges = true;
        }

        let resultRecord = existing;
        if (hasChanges) {
          const updatedRecord = await this.commentsRepo.update(existing.id, updates);
          if (updatedRecord) {
            resultRecord = updatedRecord;
          }
          await this.auditLogRepo.logAction(
            actorId,
            actorName,
            'UPDATE_SOCIAL_COMMENT_METRICS',
            'SOCIAL_COMMENTS',
            existing.id,
            { platform: existing.platform, platformCommentId: existing.platformCommentId, ...updates }
          );
        }

        return {
          success: true,
          record: resultRecord,
          isDuplicate: true,
          updated: hasChanges,
        };
      }
    }

    // 3. Allocate sequential ID: BP-CMT-######
    const id = await idService.allocateSocialCommentId();

    // 4. Construct audience comment record (preserves immutable fields)
    const now = new Date().toISOString();
    const record: SocialCommentRecord = {
      id,
      contentId: data.contentId,
      videoId: data.videoId,
      publishingId: data.publishingId,
      platform: normalizedPlatform as any,
      platformPostId: data.platformPostId,
      platformCommentId: data.platformCommentId,
      commentText: data.commentText,
      authorDisplayName: data.authorDisplayName,
      commentCreatedAt: data.commentCreatedAt || now,
      capturedAt: data.capturedAt || now,
      likeCount: data.likeCount ?? 0,
      replyCount: data.replyCount ?? 0,
      parentCommentId: data.parentCommentId,
      isReply: data.isReply ?? Boolean(data.parentCommentId),
      source: (data.source as any) || 'MANUAL_PASTE',
      status: (data.status as any) || 'UNPROCESSED',
    };

    // 5. Append to separate Analytics Workbook
    const saved = await this.commentsRepo.create(record);

    // 6. Audit Trail Logging
    await this.auditLogRepo.logAction(
      actorId,
      actorName,
      'CREATE_SOCIAL_COMMENT',
      'SOCIAL_COMMENTS',
      saved.id,
      {
        contentId: saved.contentId,
        videoId: saved.videoId,
        platform: saved.platform,
        source: saved.source,
      }
    );

    return {
      success: true,
      record: saved,
      isDuplicate: false,
      updated: false,
    };
  }

  /**
   * Bulk import multiple social comments (batch ingestion pipeline).
   */
  public async importComments(
    input: ImportSocialCommentsInput,
    actorId: string = 'SYSTEM',
    actorName: string = 'System User'
  ): Promise<BatchImportCommentsResult> {
    const parsed = ImportSocialCommentsInputSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        received: input?.comments?.length || 0,
        created: 0,
        updated: 0,
        duplicates: 0,
        rejected: input?.comments?.length || 0,
        records: [],
        errors: [{ index: -1, error: 'Overall batch schema validation failed: ' + JSON.stringify(parsed.error.format()) }],
      };
    }

    const { comments, defaultContentId, defaultPlatform, defaultSource } = parsed.data;
    const result: BatchImportCommentsResult = {
      success: true,
      received: comments.length,
      created: 0,
      updated: 0,
      duplicates: 0,
      rejected: 0,
      records: [],
      errors: [],
    };

    for (let i = 0; i < comments.length; i++) {
      const rawItem = comments[i];
      const mergedInput: CreateSocialCommentInput = {
        ...rawItem,
        commentText: rawItem.commentText || '',
        contentId: rawItem.contentId || defaultContentId || '',
        platform: (rawItem.platform || defaultPlatform || 'youtube') as any,
        source: (rawItem.source || defaultSource || 'MANUAL_PASTE') as any,
      };

      try {
        const ingestionResult = await this.createComment(mergedInput, actorId, actorName);
        if (ingestionResult.success && ingestionResult.record) {
          result.records.push(ingestionResult.record);
          if (ingestionResult.isDuplicate) {
            result.duplicates++;
            if (ingestionResult.updated) {
              result.updated++;
            }
          } else {
            result.created++;
          }
        } else {
          result.rejected++;
          result.errors.push({
            index: i,
            commentText: rawItem.commentText?.slice(0, 50),
            error: ingestionResult.error || 'Failed to ingest comment',
          });
        }
      } catch (err: any) {
        result.rejected++;
        result.errors.push({
          index: i,
          commentText: rawItem.commentText?.slice(0, 50),
          error: err?.message || 'Unexpected ingestion exception',
        });
      }
    }

    // Batch audit log
    if (result.created > 0 || result.updated > 0) {
      await this.auditLogRepo.logAction(
        actorId,
        actorName,
        'IMPORT_SOCIAL_COMMENTS_BATCH',
        'SOCIAL_COMMENTS',
        `BATCH-${Date.now()}`,
        {
          received: result.received,
          created: result.created,
          updated: result.updated,
          duplicates: result.duplicates,
          rejected: result.rejected,
        }
      );
    }

    return result;
  }

  /**
   * Query audience comments with filter criteria.
   */
  public async getComments(filters: SocialCommentQueryFilters = {}): Promise<SocialCommentRecord[]> {
    return this.commentsRepo.query(filters);
  }

  /**
   * Find a single comment by CMS ID (BP-CMT-######).
   */
  public async getCommentById(id: string): Promise<SocialCommentRecord | null> {
    return this.commentsRepo.findById(id);
  }

  /**
   * Find all comments for a canonical Content ID (BP-CNT-######).
   */
  public async getCommentsByContentId(contentId: string): Promise<SocialCommentRecord[]> {
    return this.commentsRepo.findByContentId(contentId);
  }

  /**
   * Update the processing status of a comment.
   */
  public async updateCommentStatus(
    id: string,
    status: SocialCommentStatus,
    actorId: string = 'SYSTEM',
    actorName: string = 'System User'
  ): Promise<SocialCommentRecord | null> {
    const updated = await this.commentsRepo.update(id, { status });
    if (updated) {
      await this.auditLogRepo.logAction(
        actorId,
        actorName,
        'UPDATE_SOCIAL_COMMENT_STATUS',
        'SOCIAL_COMMENTS',
        id,
        { status }
      );
    }
    return updated;
  }
}

export const socialCommentsService = SocialCommentsService.getInstance();
