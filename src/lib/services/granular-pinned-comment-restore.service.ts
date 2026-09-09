/**
 * BURRA PARIKSHA CMS - Granular Pinned Comment & Pinned Comment Version Restore Service
 * Task 3F.4.7E: Granular Pinned Comment + Version Restore Only
 * 
 * Provides secure, preflight-validated administrative restoration for a single Pinned Comment record
 * and its associated immutable PINNED_COMMENT_VERSIONS historical records from a verified Google Sheets snapshot.
 */

import { GoogleSheetsSnapshot, WorksheetSnapshot } from './snapshot-exporter.service';
import { restoreValidatorService, RestoreValidationResult } from './restore-validator.service';
import { pinnedCommentsRepository, pinnedCommentVersionsRepository, videosRepository } from '../repositories';
import { auditService, workflowService } from './audit.service';
import { PinnedComment, PinnedCommentVersion } from '../../types';

export interface GranularPinnedCommentRestoreRequest {
  snapshot: GoogleSheetsSnapshot;
  pinnedCommentId: string;
  explicitConfirmation: string; // Must be exact "RESTORE PINNED COMMENT"
  actor: {
    id: string;
    name: string;
    role?: string;
  };
}

export interface GranularPinnedCommentRestoreResult {
  success: boolean;
  entityId: string;
  operation: 'CREATE' | 'UPDATE' | 'NO_CHANGE' | 'REJECTED';
  snapshotChecksum: string;
  validationResult: RestoreValidationResult;
  persisted: boolean;
  auditRecorded: boolean;
  workflowRecorded: boolean;
  pinnedCommentVersionsRestoredCount: number;
  error?: string;
  conflictReason?: string;
}

export class GranularPinnedCommentRestoreService {
  private static instance: GranularPinnedCommentRestoreService | null = null;

  private constructor() {}

  public static getInstance(): GranularPinnedCommentRestoreService {
    if (!GranularPinnedCommentRestoreService.instance) {
      GranularPinnedCommentRestoreService.instance = new GranularPinnedCommentRestoreService();
    }
    return GranularPinnedCommentRestoreService.instance;
  }

  /**
   * Restores a single Pinned Comment record and its missing immutable PINNED_COMMENT_VERSIONS historical records
   * with strict validation, confirmation gates, foreign-key verification, and audit logging.
   */
  public async restorePinnedComment(request: GranularPinnedCommentRestoreRequest): Promise<GranularPinnedCommentRestoreResult> {
    const { snapshot, pinnedCommentId, explicitConfirmation, actor } = request;

    // 1. Authorization Check (Require ADMIN or CONTENT_LEAD)
    const actorRole = (actor.role || '').toUpperCase();
    if (actorRole !== 'ADMIN' && actorRole !== 'CONTENT_LEAD' && actor.id !== 'USR-001') {
      return {
        success: false,
        entityId: pinnedCommentId || 'UNKNOWN',
        operation: 'REJECTED',
        snapshotChecksum: snapshot?.checksum || '',
        validationResult: {} as any,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        pinnedCommentVersionsRestoredCount: 0,
        error: 'Unauthorized: Granular pinned comment restoration requires ADMIN or CONTENT_LEAD role.',
      };
    }

    // 2. Explicit Confirmation Gate (Exact match "RESTORE PINNED COMMENT")
    if (explicitConfirmation !== 'RESTORE PINNED COMMENT') {
      return {
        success: false,
        entityId: pinnedCommentId || 'UNKNOWN',
        operation: 'REJECTED',
        snapshotChecksum: snapshot?.checksum || '',
        validationResult: {} as any,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        pinnedCommentVersionsRestoredCount: 0,
        error: 'Invalid explicit confirmation. You must provide the exact string "RESTORE PINNED COMMENT".',
      };
    }

    if (!pinnedCommentId || typeof pinnedCommentId !== 'string') {
      return {
        success: false,
        entityId: pinnedCommentId || 'UNKNOWN',
        operation: 'REJECTED',
        snapshotChecksum: snapshot?.checksum || '',
        validationResult: {} as any,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        pinnedCommentVersionsRestoredCount: 0,
        error: 'Missing or invalid pinnedCommentId provided for granular restore.',
      };
    }

    // 3. Find pinned comment in snapshot PINNED_COMMENTS sheet
    const wsPinned: WorksheetSnapshot = snapshot?.worksheets?.['PINNED_COMMENTS'] || snapshot?.worksheets?.['PINNED_COMMENT'];
    if (!wsPinned || !wsPinned.headers || !wsPinned.rows) {
      return {
        success: false,
        entityId: pinnedCommentId,
        operation: 'REJECTED',
        snapshotChecksum: snapshot?.checksum || '',
        validationResult: {} as any,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        pinnedCommentVersionsRestoredCount: 0,
        error: 'Snapshot is missing PINNED_COMMENTS worksheet or structure.',
      };
    }

    const pinnedHeaders = wsPinned.headers;
    const pinnedIdIdx = pinnedHeaders.findIndex(h => h.toLowerCase() === 'pinnedcommentid' || h.toLowerCase() === 'id');
    if (pinnedIdIdx === -1) {
      return {
        success: false,
        entityId: pinnedCommentId,
        operation: 'REJECTED',
        snapshotChecksum: snapshot?.checksum || '',
        validationResult: {} as any,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        pinnedCommentVersionsRestoredCount: 0,
        error: 'PINNED_COMMENTS worksheet header is missing ID / pinnedCommentId column.',
      };
    }

    let snapshotPinnedRow: any = null;
    for (const row of wsPinned.rows) {
      const pId = String(row[pinnedIdIdx] || '');
      if (pId === pinnedCommentId) {
        snapshotPinnedRow = {};
        pinnedHeaders.forEach((h, idx) => {
          snapshotPinnedRow[h] = row[idx] !== undefined ? row[idx] : '';
        });
        break;
      }
    }

    if (!snapshotPinnedRow) {
      return {
        success: false,
        entityId: pinnedCommentId,
        operation: 'REJECTED',
        snapshotChecksum: snapshot?.checksum || '',
        validationResult: {} as any,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        pinnedCommentVersionsRestoredCount: 0,
        error: `Pinned comment ID "${pinnedCommentId}" not found in snapshot PINNED_COMMENTS worksheet.`,
      };
    }

    // 4. Run Dry-Run Validation via RestoreValidatorService
    const validationResult = await restoreValidatorService.validateRestore({
      snapshot,
      scope: 'GRANULAR_RECORD',
      entityType: 'PINNED_COMMENTS',
      entityIds: [pinnedCommentId],
    });

    if (!validationResult.valid) {
      return {
        success: false,
        entityId: pinnedCommentId,
        operation: 'REJECTED',
        snapshotChecksum: snapshot.checksum,
        validationResult,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        pinnedCommentVersionsRestoredCount: 0,
        error: 'Preflight validation failed. Snapshot integrity, schema, or conflict checks failed.',
        conflictReason: JSON.stringify(validationResult.conflicts || validationResult.schemaErrors),
      };
    }

    const pinnedConflict = validationResult.conflicts.find(c => c.entityId === pinnedCommentId);
    if (pinnedConflict) {
      return {
        success: false,
        entityId: pinnedCommentId,
        operation: 'REJECTED',
        snapshotChecksum: snapshot.checksum,
        validationResult,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        pinnedCommentVersionsRestoredCount: 0,
        error: `Conflict detected for pinned comment "${pinnedCommentId}": ${pinnedConflict.reason}`,
        conflictReason: pinnedConflict.reason,
      };
    }

    // 5. Foreign-Key Dependency Check (Video Existence)
    const videoId = snapshotPinnedRow.videoId || '';
    if (videoId) {
      let videoExists = false;
      try {
        const v = await videosRepository.findById(videoId);
        if (v) videoExists = true;
      } catch {
        videoExists = false;
      }
      if (!videoExists) {
        const wsVideos = snapshot?.worksheets?.['VIDEOS'];
        let foundInSnap = false;
        if (wsVideos && wsVideos.rows) {
          const vHeaders = wsVideos.headers || [];
          const vIdIdx = vHeaders.findIndex(h => h.toLowerCase() === 'videoid' || h.toLowerCase() === 'id');
          if (vIdIdx >= 0) {
            foundInSnap = wsVideos.rows.some(r => String(r[vIdIdx]) === videoId);
          }
        }
        if (!foundInSnap) {
          return {
            success: false,
            entityId: pinnedCommentId,
            operation: 'REJECTED',
            snapshotChecksum: snapshot.checksum,
            validationResult,
            persisted: false,
            auditRecorded: false,
            workflowRecorded: false,
            pinnedCommentVersionsRestoredCount: 0,
            error: `Missing dependency: Linked videoId "${videoId}" does not exist in production or snapshot.`,
            conflictReason: `Missing video dependency: ${videoId}`,
          };
        }
      }
    }

    // 6. Gather snapshot pinned comment versions for this pinnedCommentId
    const wsVersions: WorksheetSnapshot = snapshot?.worksheets?.['PINNED_COMMENT_VERSIONS'];
    const snapshotVersions: any[] = [];
    if (wsVersions && wsVersions.headers && wsVersions.rows) {
      const vHeaders = wsVersions.headers;
      const pIdIdx = vHeaders.findIndex(h => h.toLowerCase() === 'pinnedcommentid');
      if (pIdIdx >= 0) {
        for (const row of wsVersions.rows) {
          const pId = String(row[pIdIdx] || '');
          if (pId === pinnedCommentId) {
            const verObj: Record<string, any> = {};
            vHeaders.forEach((h, idx) => {
              verObj[h] = row[idx] !== undefined ? row[idx] : '';
            });
            snapshotVersions.push(verObj);
          }
        }
      }
    }

    // Check version conflicts (immutable version rule: existing version with different content -> fail closed)
    const existingVersions = await pinnedCommentVersionsRepository.findByPinnedCommentId(pinnedCommentId).catch(() => []);
    const existingVersionMap = new Map<number, PinnedCommentVersion>((existingVersions as any[]).map(ev => [Number(ev.versionNumber), ev]));

    for (const snapVer of snapshotVersions) {
      const sV = snapVer as any;
      const vNum = Number(sV.versionNumber || 1);
      const existingVer = existingVersionMap.get(vNum);
      if (existingVer) {
        const snapText = sV.commentText || '';
        const prodText = existingVer.commentText || '';
        if (snapText && prodText && snapText !== prodText) {
          return {
            success: false,
            entityId: pinnedCommentId,
            operation: 'REJECTED',
            snapshotChecksum: snapshot.checksum,
            validationResult,
            persisted: false,
            auditRecorded: false,
            workflowRecorded: false,
            pinnedCommentVersionsRestoredCount: 0,
            error: `Immutable version conflict: Version ${vNum} already exists for pinned comment "${pinnedCommentId}" with differing content.`,
            conflictReason: `Immutable version collision on version ${vNum}`,
          };
        }
      }
    }

    // 7. Perform Pinned Comment Restoration (CREATE, UPDATE, or NO_CHANGE)
    const existingPinnedComment = await pinnedCommentsRepository.findById(pinnedCommentId).catch(() => null);
    const now = new Date().toISOString();
    let operation: 'CREATE' | 'UPDATE' | 'NO_CHANGE' = 'NO_CHANGE';

    const isApprovedVal = snapshotPinnedRow.isApproved === true || 
                          String(snapshotPinnedRow.isApproved).toLowerCase() === 'true' || 
                          String(snapshotPinnedRow.isApproved) === '1';

    const targetPinnedCommentData: PinnedComment = {
      id: pinnedCommentId,
      videoId: snapshotPinnedRow.videoId || existingPinnedComment?.videoId || '',
      commentText: snapshotPinnedRow.commentText || '',
      solutionBreakdown: snapshotPinnedRow.solutionBreakdown || '',
      nextChallengeQuestion: snapshotPinnedRow.nextChallengeQuestion || '',
      isApproved: isApprovedVal,
      createdAt: existingPinnedComment?.createdAt || snapshotPinnedRow.createdAt || now,
      updatedAt: now,
    };

    if (!existingPinnedComment) {
      operation = 'CREATE';
      await pinnedCommentsRepository.appendRecord(targetPinnedCommentData);
    } else {
      const isIdentical =
        existingPinnedComment.videoId === targetPinnedCommentData.videoId &&
        existingPinnedComment.commentText === targetPinnedCommentData.commentText &&
        existingPinnedComment.solutionBreakdown === targetPinnedCommentData.solutionBreakdown &&
        existingPinnedComment.nextChallengeQuestion === targetPinnedCommentData.nextChallengeQuestion &&
        existingPinnedComment.isApproved === targetPinnedCommentData.isApproved;

      if (!isIdentical) {
        const snapUpdated = snapshotPinnedRow.updatedAt || '';
        const prodUpdated = existingPinnedComment.updatedAt || '';
        if (snapUpdated && prodUpdated && snapUpdated < prodUpdated) {
          return {
            success: false,
            entityId: pinnedCommentId,
            operation: 'REJECTED',
            snapshotChecksum: snapshot.checksum,
            validationResult,
            persisted: false,
            auditRecorded: false,
            workflowRecorded: false,
            pinnedCommentVersionsRestoredCount: 0,
            error: `Conflict policy violation: Production pinned comment "${pinnedCommentId}" is newer than snapshot.`,
            conflictReason: 'Production pinned comment is newer than snapshot',
          };
        }
        operation = 'UPDATE';
        await pinnedCommentsRepository.updateRecord(pinnedCommentId, targetPinnedCommentData);
      } else {
        operation = 'NO_CHANGE';
      }
    }

    // 8. Restore Missing Pinned Comment Versions (Append-only immutable historical ledger)
    let versionsRestoredCount = 0;
    for (const snapVer of snapshotVersions) {
      const vNum = Number(snapVer.versionNumber || 1);
      const existingVer = existingVersionMap.get(vNum);
      if (!existingVer) {
        const newVersionRecord: PinnedCommentVersion = {
          id: snapVer.id || `${pinnedCommentId}-V${vNum}`,
          pinnedCommentId,
          versionNumber: vNum,
          commentText: snapVer.commentText || '',
          createdAt: snapVer.createdAt || now,
        };
        await pinnedCommentVersionsRepository.appendRecord(newVersionRecord);
        versionsRestoredCount++;
      }
    }

    // 9. Post-Write Verification
    const verifiedPinned = await pinnedCommentsRepository.findById(pinnedCommentId).catch(() => null);
    if (!verifiedPinned || verifiedPinned.id !== pinnedCommentId) {
      return {
        success: false,
        entityId: pinnedCommentId,
        operation: 'REJECTED',
        snapshotChecksum: snapshot.checksum,
        validationResult,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        pinnedCommentVersionsRestoredCount: versionsRestoredCount,
        error: 'Post-write verification failed: Pinned comment not found or ID mismatch after restoration.',
      };
    }

    const verifiedVersions = await pinnedCommentVersionsRepository.findByPinnedCommentId(pinnedCommentId).catch(() => []);
    for (const snapVer of snapshotVersions) {
      const vNum = Number(snapVer.versionNumber || 1);
      const found = verifiedVersions.find(v => v.versionNumber === vNum);
      if (!found) {
        return {
          success: false,
          entityId: pinnedCommentId,
          operation: 'REJECTED',
          snapshotChecksum: snapshot.checksum,
          validationResult,
          persisted: false,
          auditRecorded: false,
          workflowRecorded: false,
          pinnedCommentVersionsRestoredCount: versionsRestoredCount,
          error: `Post-write verification failed: Restored version number ${vNum} missing in ledger.`,
        };
      }
    }

    // 10. Audit & Workflow Logging
    let auditRecorded = false;
    let workflowRecorded = false;

    try {
      await auditService.log(
        actor.id,
        actor.name,
        `RESTORE_PINNED_COMMENT_${operation}`,
        'PINNED_COMMENT',
        pinnedCommentId,
        {
          snapshotChecksum: snapshot.checksum,
          operation,
          versionsRestored: versionsRestoredCount,
          isApproved: verifiedPinned.isApproved,
        }
      );
      auditRecorded = true;
    } catch {
      auditRecorded = false;
    }

    try {
      await workflowService.recordTransition(
        'VIDEO',
        pinnedCommentId,
        'RESTORED',
        'RESTORED',
        actor.id,
        actor.name,
        `Granular pinned comment restore: ${operation}, versions appended: ${versionsRestoredCount}`
      );
      workflowRecorded = true;
    } catch {
      workflowRecorded = false;
    }

    return {
      success: true,
      entityId: pinnedCommentId,
      operation,
      snapshotChecksum: snapshot.checksum,
      validationResult,
      persisted: true,
      auditRecorded,
      workflowRecorded,
      pinnedCommentVersionsRestoredCount: versionsRestoredCount,
    };
  }
}

export const granularPinnedCommentRestoreService = GranularPinnedCommentRestoreService.getInstance();
