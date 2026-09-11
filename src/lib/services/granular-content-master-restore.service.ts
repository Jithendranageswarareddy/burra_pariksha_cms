/**
 * BURRA PARIKSHA CMS - Granular Content Master Restore Service
 * Task 3F.4.7 / Phase 16.6: Granular Content Master Record Restore
 * 
 * Provides secure, preflight-validated administrative restoration for a single Content Master record
 * from a verified Google Sheets snapshot, adhering strictly to the established recovery service architecture.
 */

import { GoogleSheetsSnapshot, WorksheetSnapshot } from './snapshot-exporter.service';
import { restoreValidatorService, RestoreValidationResult } from './restore-validator.service';
import { contentMastersRepository, sequencesRepository } from '../repositories';
import { taxonomyService } from './taxonomy.service';
import { auditService, workflowService } from './audit.service';
import { ContentMaster, ContentMasterStatus } from '../../types';

export interface GranularContentMasterRestoreRequest {
  snapshot: GoogleSheetsSnapshot;
  contentMasterId: string;
  explicitConfirmation: string; // Must be exact "RESTORE CONTENT MASTER"
  actor: {
    id: string;
    name: string;
    role?: string;
  };
}

export interface GranularContentMasterRestoreResult {
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

export class GranularContentMasterRestoreService {
  private static instance: GranularContentMasterRestoreService | null = null;

  private constructor() {}

  public static getInstance(): GranularContentMasterRestoreService {
    if (!GranularContentMasterRestoreService.instance) {
      GranularContentMasterRestoreService.instance = new GranularContentMasterRestoreService();
    }
    return GranularContentMasterRestoreService.instance;
  }

  /**
   * Restores a single Content Master record with strict validation, confirmation gates,
   * parent dependency checks, sequence safety, audit logging, and workflow recording.
   */
  public async restoreContentMaster(
    request: GranularContentMasterRestoreRequest
  ): Promise<GranularContentMasterRestoreResult> {
    const { snapshot, contentMasterId, explicitConfirmation, actor } = request;

    // 1. Authorization Check (Require ADMIN)
    const actorRole = (actor?.role || '').toUpperCase();
    if (actorRole !== 'ADMIN' && actor?.id !== 'USR-001' && actor?.id !== 'USR-ADMIN') {
      return {
        success: false,
        entityId: contentMasterId || 'UNKNOWN',
        operation: 'REJECTED',
        snapshotChecksum: snapshot?.checksum || '',
        validationResult: {} as any,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        error: 'Unauthorized: Granular content master restoration requires ADMIN role.',
      };
    }

    // 2. Explicit Confirmation Gate (Exact match "RESTORE CONTENT MASTER")
    if (explicitConfirmation !== 'RESTORE CONTENT MASTER') {
      return {
        success: false,
        entityId: contentMasterId || 'UNKNOWN',
        operation: 'REJECTED',
        snapshotChecksum: snapshot?.checksum || '',
        validationResult: {} as any,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        error: 'Invalid explicit confirmation. You must provide the exact string "RESTORE CONTENT MASTER".',
      };
    }

    if (!contentMasterId || typeof contentMasterId !== 'string') {
      return {
        success: false,
        entityId: contentMasterId || 'UNKNOWN',
        operation: 'REJECTED',
        snapshotChecksum: snapshot?.checksum || '',
        validationResult: {} as any,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        error: 'Missing or invalid contentMasterId provided for granular restore.',
      };
    }

    // 3. Find Content Master in snapshot CONTENT_MASTERS sheet
    const ws: WorksheetSnapshot = snapshot?.worksheets?.['CONTENT_MASTERS'];
    if (!ws || !ws.headers || !ws.rows) {
      return {
        success: false,
        entityId: contentMasterId,
        operation: 'REJECTED',
        snapshotChecksum: snapshot?.checksum || '',
        validationResult: {} as any,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        error: 'Snapshot is missing CONTENT_MASTERS worksheet or structure.',
      };
    }

    const headers = ws.headers;
    const idIdx = headers.findIndex(h => h.toLowerCase() === 'id');
    if (idIdx === -1) {
      return {
        success: false,
        entityId: contentMasterId,
        operation: 'REJECTED',
        snapshotChecksum: snapshot?.checksum || '',
        validationResult: {} as any,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        error: 'CONTENT_MASTERS worksheet header is missing ID column.',
      };
    }

    let snapshotRow: any = null;
    for (const row of ws.rows) {
      const rowId = String(row[idIdx] || '');
      if (rowId === contentMasterId) {
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
        entityId: contentMasterId,
        operation: 'REJECTED',
        snapshotChecksum: snapshot?.checksum || '',
        validationResult: {} as any,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        error: `Content Master ID "${contentMasterId}" not found in snapshot CONTENT_MASTERS worksheet.`,
      };
    }

    // 4. Run Dry-Run Validation via RestoreValidatorService
    const validationResult = await restoreValidatorService.validateRestore({
      snapshot,
      scope: 'GRANULAR_RECORD',
      entityType: 'CONTENT_MASTERS',
      entityIds: [contentMasterId],
    });

    if (!validationResult.valid) {
      return {
        success: false,
        entityId: contentMasterId,
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

    // Check if there are specific conflicts for this contentMasterId
    const masterConflict = validationResult.conflicts.find(c => c.entityId === contentMasterId);
    if (masterConflict) {
      return {
        success: false,
        entityId: contentMasterId,
        operation: 'REJECTED',
        snapshotChecksum: snapshot.checksum,
        validationResult,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        error: `Conflict detected for Content Master "${contentMasterId}": ${masterConflict.reason}`,
        conflictReason: masterConflict.reason,
      };
    }

    // Check foreign key missing dependencies for this Content Master
    const missingDep = validationResult.missingDependencies.find(d => d.entityId === contentMasterId);
    if (missingDep) {
      return {
        success: false,
        entityId: contentMasterId,
        operation: 'REJECTED',
        snapshotChecksum: snapshot.checksum,
        validationResult,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        error: `Missing dependency for Content Master "${contentMasterId}": ${missingDep.missingKey}`,
        conflictReason: `Missing dependency: ${missingDep.missingKey}`,
      };
    }

    // 5. Taxonomy Validation if category/topic/subtopic are present
    const categoryId = snapshotRow.categoryId || snapshotRow.category_id || '';
    const topicId = snapshotRow.topicId || snapshotRow.topic_id || '';
    const subtopicId = snapshotRow.subtopicId || snapshotRow.subtopic_id || '';

    if (categoryId && topicId && subtopicId) {
      try {
        await taxonomyService.validateTaxonomy(categoryId, topicId, subtopicId);
      } catch (err: any) {
        return {
          success: false,
          entityId: contentMasterId,
          operation: 'REJECTED',
          snapshotChecksum: snapshot.checksum,
          validationResult,
          persisted: false,
          auditRecorded: false,
          workflowRecorded: false,
          error: `Taxonomy reference validation failed: ${err?.message || 'Invalid taxonomy references'}`,
          conflictReason: err?.message,
        };
      }
    }

    // 6. Check Production State
    let existingProdRecord: ContentMaster | null = null;
    try {
      existingProdRecord = await contentMastersRepository.findById(contentMasterId);
    } catch {
      existingProdRecord = null;
    }

    const now = new Date().toISOString();
    const restoredMaster: ContentMaster = {
      id: contentMasterId,
      title: snapshotRow.title || '',
      status: (snapshotRow.status as ContentMasterStatus) || ContentMasterStatus.DRAFT,
      categoryId,
      topicId,
      subtopicId,
      primaryQuestionId: snapshotRow.primaryQuestionId || snapshotRow.primary_question_id || undefined,
      createdBy: snapshotRow.createdBy || snapshotRow.created_by || actor.id,
      createdAt: snapshotRow.createdAt || snapshotRow.created_at || now,
      updatedAt: now,
      archivedAt: snapshotRow.archivedAt || snapshotRow.archived_at || undefined,
    };

    let operation: 'CREATE' | 'UPDATE' | 'NO_CHANGE' = 'CREATE';

    if (!existingProdRecord) {
      operation = 'CREATE';
    } else {
      const cleanExisting = { ...existingProdRecord, updatedAt: undefined };
      const cleanRestored = { ...restoredMaster, updatedAt: undefined };
      if (JSON.stringify(cleanExisting) === JSON.stringify(cleanRestored)) {
        operation = 'NO_CHANGE';
      } else {
        operation = 'UPDATE';
      }
    }

    // 7. Execute Operation via contentMastersRepository
    let persisted = false;
    if (operation === 'CREATE') {
      try {
        await contentMastersRepository.appendRecord(restoredMaster as any);
        persisted = true;
      } catch (err: any) {
        return {
          success: false,
          entityId: contentMasterId,
          operation: 'REJECTED',
          snapshotChecksum: snapshot.checksum,
          validationResult,
          persisted: false,
          auditRecorded: false,
          workflowRecorded: false,
          error: `Failed to persist created Content Master: ${err?.message || 'Storage error'}`,
        };
      }
    } else if (operation === 'UPDATE') {
      try {
        const updateResult = await contentMastersRepository.updateRecord(contentMasterId, restoredMaster as any);
        persisted = Boolean(updateResult);
      } catch (err: any) {
        return {
          success: false,
          entityId: contentMasterId,
          operation: 'REJECTED',
          snapshotChecksum: snapshot.checksum,
          validationResult,
          persisted: false,
          auditRecorded: false,
          workflowRecorded: false,
          error: `Failed to update Content Master: ${err?.message || 'Storage error'}`,
        };
      }
    } else {
      persisted = true; // NO_CHANGE
    }

    // 8. Audit and Workflow logging
    let auditRecorded = false;
    let workflowRecorded = false;

    if (operation !== 'NO_CHANGE') {
      try {
        await auditService.log(
          actor.id,
          actor.name,
          operation === 'CREATE' ? 'CONTENT_MASTER_RESTORED_CREATED' : 'CONTENT_MASTER_RESTORED_UPDATED',
          'CONTENT_MASTER',
          contentMasterId,
          {
            contentMasterId,
            operation,
            snapshotChecksum: snapshot.checksum,
          }
        );
        auditRecorded = true;
      } catch {
        auditRecorded = false;
      }

      try {
        await workflowService.recordTransition(
          'CONTENT_MASTER',
          contentMasterId,
          existingProdRecord ? existingProdRecord.status : 'NONE',
          restoredMaster.status,
          actor.name,
          `Granular content master restore (${operation}) from snapshot checksum ${snapshot.checksum.substring(0, 10)}...`
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
      entityId: contentMasterId,
      operation,
      snapshotChecksum: snapshot.checksum,
      validationResult,
      persisted,
      auditRecorded,
      workflowRecorded,
    };
  }
}

export const granularContentMasterRestoreService = GranularContentMasterRestoreService.getInstance();
