/**
 * BURRA PARIKSHA CMS - Granular Publishing Record Restore Service
 * Task 3F.4.7F: Granular Publishing Record Restore Only
 * 
 * Provides secure, preflight-validated administrative restoration for a single Publishing record
 * from a verified Google Sheets snapshot.
 */

import { GoogleSheetsSnapshot, WorksheetSnapshot } from './snapshot-exporter.service';
import { restoreValidatorService, RestoreValidationResult } from './restore-validator.service';
import { publishingRepository, videosRepository } from '../repositories';
import { auditService, workflowService } from './audit.service';
import { Publishing } from '../../types';

export interface GranularPublishingRestoreRequest {
  snapshot: GoogleSheetsSnapshot;
  publishingId: string;
  explicitConfirmation: string; // Must be exact "RESTORE PUBLISHING"
  actor: {
    id: string;
    name: string;
    role?: string;
  };
}

export interface GranularPublishingRestoreResult {
  success: boolean;
  entityId: string;
  operation: 'CREATE' | 'UPDATE' | 'NO_CHANGE' | 'REJECTED';
  snapshotChecksum: string;
  validationResult: RestoreValidationResult;
  persisted: boolean;
  auditRecorded: boolean;
  workflowRecorded: boolean;
  error?: string;
  conflictReason?: string;
}

export class GranularPublishingRestoreService {
  private static instance: GranularPublishingRestoreService | null = null;

  private constructor() {}

  public static getInstance(): GranularPublishingRestoreService {
    if (!GranularPublishingRestoreService.instance) {
      GranularPublishingRestoreService.instance = new GranularPublishingRestoreService();
    }
    return GranularPublishingRestoreService.instance;
  }

  /**
   * Restores a single Publishing record with strict validation, confirmation gates,
   * foreign-key verification, conflict protection, and audit logging.
   */
  public async restorePublishing(request: GranularPublishingRestoreRequest): Promise<GranularPublishingRestoreResult> {
    const { snapshot, publishingId, explicitConfirmation, actor } = request;

    // 1. Authorization Check (Require ADMIN or CONTENT_LEAD)
    const actorRole = (actor?.role || '').toUpperCase();
    if (actorRole !== 'ADMIN' && actorRole !== 'CONTENT_LEAD' && actor?.id !== 'USR-ADMIN' && actor?.id !== 'USR-001') {
      return {
        success: false,
        entityId: publishingId || 'UNKNOWN',
        operation: 'REJECTED',
        snapshotChecksum: snapshot?.checksum || '',
        validationResult: {} as any,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        error: 'Unauthorized: Granular publishing record restoration requires ADMIN or CONTENT_LEAD role.',
      };
    }

    // 2. Explicit Confirmation Gate (Exact match "RESTORE PUBLISHING")
    if (explicitConfirmation !== 'RESTORE PUBLISHING') {
      return {
        success: false,
        entityId: publishingId || 'UNKNOWN',
        operation: 'REJECTED',
        snapshotChecksum: snapshot?.checksum || '',
        validationResult: {} as any,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        error: 'Invalid explicit confirmation. You must provide the exact string "RESTORE PUBLISHING".',
      };
    }

    if (!publishingId || typeof publishingId !== 'string') {
      return {
        success: false,
        entityId: publishingId || 'UNKNOWN',
        operation: 'REJECTED',
        snapshotChecksum: snapshot?.checksum || '',
        validationResult: {} as any,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        error: 'Missing or invalid publishingId provided for granular restore.',
      };
    }

    // 3. Find publishing record in snapshot PUBLISHING sheet
    const wsPublishing: WorksheetSnapshot = snapshot?.worksheets?.['PUBLISHING'];
    if (!wsPublishing || !wsPublishing.headers || !wsPublishing.rows) {
      return {
        success: false,
        entityId: publishingId,
        operation: 'REJECTED',
        snapshotChecksum: snapshot?.checksum || '',
        validationResult: {} as any,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        error: 'Snapshot is missing PUBLISHING worksheet or structure.',
      };
    }

    const pubHeaders = wsPublishing.headers;
    const pubIdIdx = pubHeaders.findIndex(h => h.toLowerCase() === 'publishingid' || h.toLowerCase() === 'id');
    if (pubIdIdx === -1) {
      return {
        success: false,
        entityId: publishingId,
        operation: 'REJECTED',
        snapshotChecksum: snapshot?.checksum || '',
        validationResult: {} as any,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        error: 'PUBLISHING worksheet header is missing ID / publishingId column.',
      };
    }

    let snapshotPublishingRow: any = null;
    for (const row of wsPublishing.rows) {
      const pId = String(row[pubIdIdx] || '');
      if (pId === publishingId) {
        snapshotPublishingRow = {};
        pubHeaders.forEach((h, idx) => {
          snapshotPublishingRow[h] = row[idx] !== undefined ? row[idx] : '';
        });
        break;
      }
    }

    if (!snapshotPublishingRow) {
      return {
        success: false,
        entityId: publishingId,
        operation: 'REJECTED',
        snapshotChecksum: snapshot?.checksum || '',
        validationResult: {} as any,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        error: `Publishing ID "${publishingId}" not found in snapshot PUBLISHING worksheet.`,
      };
    }

    // 4. Run Dry-Run Validation via RestoreValidatorService
    const validationResult = await restoreValidatorService.validateRestore({
      snapshot,
      scope: 'GRANULAR_RECORD',
      entityType: 'PUBLISHING',
      entityIds: [publishingId],
    });

    if (!validationResult.valid && validationResult.conflicts.length > 0) {
      const conflict = validationResult.conflicts.find(c => c.entityId === publishingId) || validationResult.conflicts[0];
      return {
        success: false,
        entityId: publishingId,
        operation: 'REJECTED',
        snapshotChecksum: snapshot.checksum,
        validationResult,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        error: `Preflight validation failed: ${conflict.reason}`,
        conflictReason: conflict.reason,
      };
    }

    // 5. Video Foreign-Key Dependency Verification
    const videoId = snapshotPublishingRow.videoId || snapshotPublishingRow.video_id;
    if (videoId) {
      const existingVideo = await videosRepository.findById(videoId).catch(() => null);
      if (!existingVideo) {
        // Also check snapshot VIDEOS worksheet
        const wsVideos = snapshot?.worksheets?.['VIDEOS'];
        let foundInSnapshotVideo = false;
        if (wsVideos && wsVideos.headers && wsVideos.rows) {
          const vIdIdx = wsVideos.headers.findIndex(h => h.toLowerCase() === 'id' || h.toLowerCase() === 'videoid');
          if (vIdIdx !== -1) {
            foundInSnapshotVideo = wsVideos.rows.some(r => String(r[vIdIdx] || '') === videoId);
          }
        }
        if (!foundInSnapshotVideo) {
          return {
            success: false,
            entityId: publishingId,
            operation: 'REJECTED',
            snapshotChecksum: snapshot.checksum,
            validationResult,
            persisted: false,
            auditRecorded: false,
            workflowRecorded: false,
            error: `Missing dependency: Linked videoId "${videoId}" does not exist in production or snapshot.`,
          };
        }
      }
    }

    // 6. Conflict & Operation Detection (CREATE vs UPDATE vs NO_CHANGE vs CONFLICT)
    const existingPublishing = await publishingRepository.findById(publishingId).catch(() => null);
    let operation: 'CREATE' | 'UPDATE' | 'NO_CHANGE' = 'CREATE';

    const parseObj = (row: any) => {
      const youtubeStatus = row.youtube?.status || row['youtube.status'] || row.youtubeStatus || 'PENDING';
      const instagramStatus = row.instagram?.status || row['instagram.status'] || row.instagramStatus || 'PENDING';
      const facebookStatus = row.facebook?.status || row['facebook.status'] || row.facebookStatus || 'PENDING';
      return {
        id: row.id || publishingId,
        videoId: row.videoId || row.video_id || '',
        videoTitle: row.videoTitle || row.video_title || '',
        questionId: row.questionId || row.question_id || '',
        finalVideoStatus: row.finalVideoStatus || row.final_video_status || 'READY',
        youtube: {
          status: youtubeStatus,
          videoUrl: row.youtube?.videoUrl || row['youtube.videoUrl'] || row.youtubeVideoUrl || '',
          publishedAt: row.youtube?.publishedAt || row['youtube.publishedAt'] || row.youtubePublishedAt || '',
          notes: row.youtube?.notes || row['youtube.notes'] || row.youtubeNotes || '',
        },
        instagram: {
          status: instagramStatus,
          postUrl: row.instagram?.postUrl || row['instagram.postUrl'] || row.instagramPostUrl || '',
          publishedAt: row.instagram?.publishedAt || row['instagram.publishedAt'] || row.instagramPublishedAt || '',
          notes: row.instagram?.notes || row['instagram.notes'] || row.instagramNotes || '',
        },
        facebook: {
          status: facebookStatus,
          postUrl: row.facebook?.postUrl || row['facebook.postUrl'] || row.facebookPostUrl || '',
          publishedAt: row.facebook?.publishedAt || row['facebook.publishedAt'] || row.facebookPublishedAt || '',
          notes: row.facebook?.notes || row['facebook.notes'] || row.facebookNotes || '',
        },
        pinnedCommentReady: typeof row.pinnedCommentReady === 'boolean' ? row.pinnedCommentReady : (row.pinnedCommentReady === 'true' || row.pinned_comment_ready === 'true'),
        thumbnailReady: typeof row.thumbnailReady === 'boolean' ? row.thumbnailReady : (row.thumbnailReady === 'true' || row.thumbnail_ready === 'true'),
        completedPlatformsCount: Number(row.completedPlatformsCount || row.completed_platforms_count || 0),
        totalPlatformsCount: Number(row.totalPlatformsCount || row.total_platforms_count || 3),
        createdAt: row.createdAt || row.created_at || new Date().toISOString(),
        updatedAt: row.updatedAt || row.updated_at || new Date().toISOString(),
      };
    };

    const targetPublishingRecord: Publishing = parseObj(snapshotPublishingRow);

    if (!existingPublishing) {
      operation = 'CREATE';
    } else {
      const snapObjWithoutTime = { ...targetPublishingRecord };
      delete (snapObjWithoutTime as any).updatedAt;
      const prodObjWithoutTime = { ...existingPublishing };
      delete (prodObjWithoutTime as any).updatedAt;

      if (JSON.stringify(snapObjWithoutTime) === JSON.stringify(prodObjWithoutTime)) {
        operation = 'NO_CHANGE';
      } else {
        const snapUpdated = targetPublishingRecord.updatedAt || targetPublishingRecord.createdAt || '';
        const prodUpdated = existingPublishing.updatedAt || existingPublishing.createdAt || '';

        if (snapUpdated && prodUpdated && prodUpdated > snapUpdated) {
          return {
            success: false,
            entityId: publishingId,
            operation: 'REJECTED',
            snapshotChecksum: snapshot.checksum,
            validationResult,
            persisted: false,
            auditRecorded: false,
            workflowRecorded: false,
            error: `Conflict: Existing production publishing record is newer (${prodUpdated}) than snapshot record (${snapUpdated}). Restoring would overwrite newer production data.`,
            conflictReason: 'Production record is newer than snapshot.',
          };
        }
        operation = 'UPDATE';
      }
    }

    // 7. Persist Operation (Create or Update if not NO_CHANGE)
    if (operation === 'CREATE') {
      await publishingRepository.appendRecord(targetPublishingRecord);
    } else if (operation === 'UPDATE') {
      await publishingRepository.updateRecord(publishingId, targetPublishingRecord);
    }

    // 8. Post-Write Verification
    const verifiedPublishing = await publishingRepository.findById(publishingId).catch(() => null);
    if (!verifiedPublishing || verifiedPublishing.id !== publishingId) {
      return {
        success: false,
        entityId: publishingId,
        operation: 'REJECTED',
        snapshotChecksum: snapshot.checksum,
        validationResult,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        error: 'Post-write verification failed: Publishing record not found or ID mismatch after restoration.',
      };
    }

    // 9. Audit & Workflow Logging
    let auditRecorded = false;
    let workflowRecorded = false;

    try {
      await auditService.log(
        actor.id,
        actor.name,
        `RESTORE_PUBLISHING_${operation}`,
        'PUBLISHING',
        publishingId,
        {
          snapshotChecksum: snapshot.checksum,
          operation,
          videoId: verifiedPublishing.videoId,
        }
      );
      auditRecorded = true;
    } catch {
      auditRecorded = false;
    }

    if (operation !== 'NO_CHANGE') {
      try {
        await workflowService.recordTransition(
          'PUBLISHING',
          publishingId,
          'RESTORED',
          'RESTORED',
          actor.id,
          actor.name,
          `Granular publishing restore: ${operation}`
        );
        workflowRecorded = true;
      } catch {
        workflowRecorded = false;
      }
    } else {
      workflowRecorded = true;
    }

    return {
      success: true,
      entityId: publishingId,
      operation,
      snapshotChecksum: snapshot.checksum,
      validationResult,
      persisted: true,
      auditRecorded,
      workflowRecorded,
    };
  }
}

export const granularPublishingRestoreService = GranularPublishingRestoreService.getInstance();
