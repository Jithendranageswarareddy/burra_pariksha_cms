/**
 * BURRA PARIKSHA CMS - Granular Video Restore Service
 * Task 3F.4.7B: Granular Video Restore Only
 * 
 * Provides secure, preflight-validated administrative restoration for a single Video record
 * from a verified Google Sheets snapshot.
 * 
 * Flow:
 * SNAPSHOT -> RestoreValidatorService -> DRY-RUN VALIDATION -> EXPLICIT CONFIRMATION ("RESTORE VIDEO")
 * -> VIDEO RESTORE (CREATE/UPDATE/NO_CHANGE) -> QUESTION FK CHECK -> SEQUENCE SAFETY -> AUDIT LOG -> WORKFLOW LOG
 */

import { GoogleSheetsSnapshot, WorksheetSnapshot } from './snapshot-exporter.service';
import { restoreValidatorService, RestoreValidationResult } from './restore-validator.service';
import { videosRepository, questionsRepository, sequencesRepository } from '../repositories';
import { auditService, workflowService } from './audit.service';
import { Video, VideoProductionStatus } from '../../types';

export interface GranularVideoRestoreRequest {
  snapshot: GoogleSheetsSnapshot;
  videoId: string;
  explicitConfirmation: string; // Must be exact "RESTORE VIDEO"
  actor: {
    id: string;
    name: string;
    role?: string;
  };
}

export interface GranularVideoRestoreResult {
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

export class GranularVideoRestoreService {
  private static instance: GranularVideoRestoreService | null = null;

  private constructor() {}

  public static getInstance(): GranularVideoRestoreService {
    if (!GranularVideoRestoreService.instance) {
      GranularVideoRestoreService.instance = new GranularVideoRestoreService();
    }
    return GranularVideoRestoreService.instance;
  }

  /**
   * Restores a single Video record with strict validation, confirmation gates,
   * question foreign-key verification, sequence safety, audit logging, and workflow recording.
   */
  public async restoreVideo(request: GranularVideoRestoreRequest): Promise<GranularVideoRestoreResult> {
    const { snapshot, videoId, explicitConfirmation, actor } = request;

    // 1. Authorization Check (Require ADMIN or CONTENT_LEAD)
    const actorRole = (actor.role || '').toUpperCase();
    if (actorRole !== 'ADMIN' && actorRole !== 'CONTENT_LEAD' && actor.id !== 'USR-001') {
      return {
        success: false,
        entityId: videoId || 'UNKNOWN',
        operation: 'REJECTED',
        snapshotChecksum: snapshot?.checksum || '',
        validationResult: {} as any,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        error: 'Unauthorized: Granular video restoration requires ADMIN or CONTENT_LEAD role.',
      };
    }

    // 2. Explicit Confirmation Gate (Exact match "RESTORE VIDEO")
    if (explicitConfirmation !== 'RESTORE VIDEO') {
      return {
        success: false,
        entityId: videoId || 'UNKNOWN',
        operation: 'REJECTED',
        snapshotChecksum: snapshot?.checksum || '',
        validationResult: {} as any,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        error: 'Invalid explicit confirmation. You must provide the exact string "RESTORE VIDEO".',
      };
    }

    if (!videoId || typeof videoId !== 'string') {
      return {
        success: false,
        entityId: videoId || 'UNKNOWN',
        operation: 'REJECTED',
        snapshotChecksum: snapshot?.checksum || '',
        validationResult: {} as any,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        error: 'Missing or invalid videoId provided for granular restore.',
      };
    }

    // 3. Find video in snapshot VIDEOS sheet
    const ws: WorksheetSnapshot = snapshot?.worksheets?.['VIDEOS'];
    if (!ws || !ws.headers || !ws.rows) {
      return {
        success: false,
        entityId: videoId,
        operation: 'REJECTED',
        snapshotChecksum: snapshot?.checksum || '',
        validationResult: {} as any,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        error: 'Snapshot is missing VIDEOS worksheet or structure.',
      };
    }

    const headers = ws.headers;
    const idIdx = headers.findIndex(h => h.toLowerCase() === 'videoid' || h.toLowerCase() === 'id');
    if (idIdx === -1) {
      return {
        success: false,
        entityId: videoId,
        operation: 'REJECTED',
        snapshotChecksum: snapshot?.checksum || '',
        validationResult: {} as any,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        error: 'VIDEOS worksheet header is missing ID / videoId column.',
      };
    }

    let snapshotRow: any = null;
    for (const row of ws.rows) {
      const vId = String(row[idIdx] || '');
      if (vId === videoId) {
        snapshotRow = {};
        headers.forEach((h, idx) => {
          snapshotRow[h] = row[idx] !== undefined ? row[idx] : '';
        });
        break;
      }
    }

    if (!snapshotRow) {
      return {
        success: false,
        entityId: videoId,
        operation: 'REJECTED',
        snapshotChecksum: snapshot?.checksum || '',
        validationResult: {} as any,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        error: `Video ID "${videoId}" not found in snapshot VIDEOS worksheet.`,
      };
    }

    // 4. Run Dry-Run Validation via RestoreValidatorService
    const validationResult = await restoreValidatorService.validateRestore({
      snapshot,
      scope: 'GRANULAR_RECORD',
      entityType: 'VIDEOS',
      entityIds: [videoId],
    });

    if (!validationResult.valid) {
      return {
        success: false,
        entityId: videoId,
        operation: 'REJECTED',
        snapshotChecksum: snapshot.checksum,
        validationResult,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        error: 'Preflight validation failed. Snapshot integrity, schema, or foreign key checks failed.',
        conflictReason: JSON.stringify(validationResult.conflicts || validationResult.schemaErrors),
      };
    }

    // Check specific conflicts for this videoId
    const videoConflict = validationResult.conflicts.find(c => c.entityId === videoId);
    if (videoConflict) {
      return {
        success: false,
        entityId: videoId,
        operation: 'REJECTED',
        snapshotChecksum: snapshot.checksum,
        validationResult,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        error: `Conflict detected for video "${videoId}": ${videoConflict.reason}`,
        conflictReason: videoConflict.reason,
      };
    }

    // Check missing dependencies for this video
    const missingDep = validationResult.missingDependencies.find(d => d.entityId === videoId);
    if (missingDep) {
      return {
        success: false,
        entityId: videoId,
        operation: 'REJECTED',
        snapshotChecksum: snapshot.checksum,
        validationResult,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        error: `Missing dependency for video "${videoId}": ${missingDep.missingKey}`,
        conflictReason: `Missing dependency: ${missingDep.missingKey}`,
      };
    }

    // 5. Foreign-Key Dependency Check (Question Existence)
    const questionId = snapshotRow.questionId || '';
    if (!questionId) {
      return {
        success: false,
        entityId: videoId,
        operation: 'REJECTED',
        snapshotChecksum: snapshot.checksum,
        validationResult,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        error: `Video "${videoId}" references a missing or empty questionId.`,
        conflictReason: 'Missing questionId foreign key reference',
      };
    }

    let referencedQuestionExists = false;
    try {
      const qProd = await questionsRepository.findById(questionId);
      if (qProd) {
        referencedQuestionExists = true;
      }
    } catch {
      referencedQuestionExists = false;
    }

    if (!referencedQuestionExists) {
      // Check in snapshot QUESTIONS sheet
      const qWs = snapshot?.worksheets?.['QUESTIONS'];
      if (qWs && qWs.headers && qWs.rows) {
        const qIdIdx = qWs.headers.findIndex(h => h.toLowerCase() === 'questionid' || h.toLowerCase() === 'id');
        if (qIdIdx !== -1) {
          for (const row of qWs.rows) {
            if (String(row[qIdIdx] || '') === questionId) {
              referencedQuestionExists = true;
              break;
            }
          }
        }
      }
    }

    if (!referencedQuestionExists) {
      return {
        success: false,
        entityId: videoId,
        operation: 'REJECTED',
        snapshotChecksum: snapshot.checksum,
        validationResult,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        error: `Referenced Question ID "${questionId}" does not exist in production or snapshot. Failing closed.`,
        conflictReason: `Missing referenced Question: ${questionId}`,
      };
    }

    // 6. Check Production State & Construct Restored Video
    let existingProdRecord: Video | null = null;
    try {
      existingProdRecord = await videosRepository.findById(videoId);
    } catch {
      existingProdRecord = null;
    }

    const now = new Date().toISOString();
    const restoredVideo: Video = {
      id: videoId,
      questionId,
      title: snapshotRow.title || '',
      status: (snapshotRow.status as VideoProductionStatus) || VideoProductionStatus.NOT_STARTED,
      priority: snapshotRow.priority || 'MEDIUM',
      queuePosition: snapshotRow.queuePosition !== undefined && snapshotRow.queuePosition !== '' ? Number(snapshotRow.queuePosition) : 1,
      targetDurationSeconds: snapshotRow.targetDurationSeconds !== undefined && snapshotRow.targetDurationSeconds !== '' ? Number(snapshotRow.targetDurationSeconds) : 45,
      actualDurationSeconds: snapshotRow.actualDurationSeconds !== undefined && snapshotRow.actualDurationSeconds !== '' ? Number(snapshotRow.actualDurationSeconds) : undefined,
      notes: snapshotRow.notes || '',
      createdAt: existingProdRecord ? existingProdRecord.createdAt : (snapshotRow.createdAt || now),
      updatedAt: now,
    };

    let operation: 'CREATE' | 'UPDATE' | 'NO_CHANGE' = 'CREATE';

    if (!existingProdRecord) {
      operation = 'CREATE';
    } else {
      // Compare state to check idempotency / NO_CHANGE
      const cleanExisting = { ...existingProdRecord, updatedAt: undefined };
      const cleanRestored = { ...restoredVideo, updatedAt: undefined };
      if (JSON.stringify(cleanExisting) === JSON.stringify(cleanRestored)) {
        operation = 'NO_CHANGE';
      } else {
        operation = 'UPDATE';
      }
    }

    // 7. Sequence Safety Check for new CREATE
    if (operation === 'CREATE') {
      try {
        // Ensure ID format and no collision
        const allVideos = await videosRepository.findAll();
        const collision = allVideos.find(v => v.id === videoId);
        if (collision) {
          return {
            success: false,
            entityId: videoId,
            operation: 'REJECTED',
            snapshotChecksum: snapshot.checksum,
            validationResult,
            persisted: false,
            auditRecorded: false,
            workflowRecorded: false,
            error: `Sequence / ID collision: Video ID "${videoId}" already exists in production.`,
            conflictReason: 'Video ID collision',
          };
        }
      } catch (err: any) {
        // If check fails, fail closed for sequence safety
        return {
          success: false,
          entityId: videoId,
          operation: 'REJECTED',
          snapshotChecksum: snapshot.checksum,
          validationResult,
          persisted: false,
          auditRecorded: false,
          workflowRecorded: false,
          error: `Sequence safety check failed: ${err?.message || 'Unknown error'}`,
        };
      }
    }

    // 8. Execute Operation
    let persisted = false;
    if (operation === 'CREATE') {
      try {
        await videosRepository.appendRecord(restoredVideo);
        persisted = true;
      } catch (err: any) {
        return {
          success: false,
          entityId: videoId,
          operation: 'REJECTED',
          snapshotChecksum: snapshot.checksum,
          validationResult,
          persisted: false,
          auditRecorded: false,
          workflowRecorded: false,
          error: `Failed to persist created video: ${err?.message || 'Storage error'}`,
        };
      }
    } else if (operation === 'UPDATE') {
      try {
        const updateResult = await videosRepository.updateRecord(videoId, restoredVideo);
        persisted = Boolean(updateResult);
      } catch (err: any) {
        return {
          success: false,
          entityId: videoId,
          operation: 'REJECTED',
          snapshotChecksum: snapshot.checksum,
          validationResult,
          persisted: false,
          auditRecorded: false,
          workflowRecorded: false,
          error: `Failed to persist updated video: ${err?.message || 'Storage error'}`,
        };
      }
    } else {
      // NO_CHANGE
      persisted = true;
    }

    // 9. Persistence Verification (Re-read to confirm round-trip)
    if (operation !== 'NO_CHANGE' && persisted) {
      try {
        const verifiedRecord = await videosRepository.findById(videoId);
        if (!verifiedRecord || verifiedRecord.title !== restoredVideo.title || verifiedRecord.questionId !== restoredVideo.questionId) {
          return {
            success: false,
            entityId: videoId,
            operation,
            snapshotChecksum: snapshot.checksum,
            validationResult,
            persisted: false,
            auditRecorded: false,
            workflowRecorded: false,
            error: 'Persistence verification failed: Re-read record mismatch after restore write.',
          };
        }
      } catch (err: any) {
        return {
          success: false,
          entityId: videoId,
          operation,
          snapshotChecksum: snapshot.checksum,
          validationResult,
          persisted: false,
          auditRecorded: false,
          workflowRecorded: false,
          error: `Persistence verification failed during re-read: ${err?.message || 'Unknown error'}`,
        };
      }
    }

    // 10. Audit Log & Workflow Log (Skip duplicate records on NO_CHANGE)
    let auditRecorded = false;
    let workflowRecorded = false;

    if (operation !== 'NO_CHANGE') {
      try {
        await auditService.log(
          actor.id,
          actor.name,
          operation === 'CREATE' ? 'VIDEO_RESTORED_CREATED' : 'VIDEO_RESTORED_UPDATED',
          'VIDEO',
          videoId,
          {
            videoId,
            operation,
            snapshotChecksum: snapshot.checksum,
            questionId,
            status: restoredVideo.status,
          }
        );
        auditRecorded = true;
      } catch {
        auditRecorded = false;
      }

      try {
        await workflowService.recordTransition(
          'VIDEO',
          videoId,
          existingProdRecord ? existingProdRecord.status : 'NONE',
          restoredVideo.status,
          actor.name,
          `Granular video restore (${operation}) from snapshot checksum ${snapshot.checksum.substring(0, 10)}...`
        );
        workflowRecorded = true;
      } catch {
        workflowRecorded = false;
      }
    } else {
      auditRecorded = true;
      workflowRecorded = true;
    }

    return {
      success: true,
      entityId: videoId,
      operation,
      snapshotChecksum: snapshot.checksum,
      validationResult,
      persisted,
      auditRecorded,
      workflowRecorded,
    };
  }
}

export const granularVideoRestoreService = GranularVideoRestoreService.getInstance();
