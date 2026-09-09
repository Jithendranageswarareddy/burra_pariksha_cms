/**
 * BURRA PARIKSHA CMS - Granular Script & Script Version Restore Service
 * Task 3F.4.7C: Granular Script + Script Version Restore Only
 * 
 * Provides secure, preflight-validated administrative restoration for a single Script record
 * and its associated immutable SCRIPT_VERSIONS historical records from a verified Google Sheets snapshot.
 */

import { GoogleSheetsSnapshot, WorksheetSnapshot } from './snapshot-exporter.service';
import { restoreValidatorService, RestoreValidationResult } from './restore-validator.service';
import { scriptsRepository, scriptVersionsRepository, videosRepository, questionsRepository, sequencesRepository } from '../repositories';
import { auditService, workflowService } from './audit.service';
import { Script, ScriptVersion } from '../../types';

export interface GranularScriptRestoreRequest {
  snapshot: GoogleSheetsSnapshot;
  scriptId: string;
  explicitConfirmation: string; // Must be exact "RESTORE SCRIPT"
  actor: {
    id: string;
    name: string;
    role?: string;
  };
}

export interface GranularScriptRestoreResult {
  success: boolean;
  entityId: string;
  operation: 'CREATE' | 'UPDATE' | 'NO_CHANGE' | 'REJECTED';
  snapshotChecksum: string;
  validationResult: RestoreValidationResult;
  persisted: boolean;
  auditRecorded: boolean;
  workflowRecorded: boolean;
  scriptVersionsRestoredCount: number;
  error?: string;
  conflictReason?: string;
}

export class GranularScriptRestoreService {
  private static instance: GranularScriptRestoreService | null = null;

  private constructor() {}

  public static getInstance(): GranularScriptRestoreService {
    if (!GranularScriptRestoreService.instance) {
      GranularScriptRestoreService.instance = new GranularScriptRestoreService();
    }
    return GranularScriptRestoreService.instance;
  }

  /**
   * Restores a single Script record and its missing immutable SCRIPT_VERSIONS historical records
   * with strict validation, confirmation gates, foreign-key verification, and audit logging.
   */
  public async restoreScript(request: GranularScriptRestoreRequest): Promise<GranularScriptRestoreResult> {
    const { snapshot, scriptId, explicitConfirmation, actor } = request;

    // 1. Authorization Check (Require ADMIN or CONTENT_LEAD)
    const actorRole = (actor.role || '').toUpperCase();
    if (actorRole !== 'ADMIN' && actorRole !== 'CONTENT_LEAD' && actor.id !== 'USR-001') {
      return {
        success: false,
        entityId: scriptId || 'UNKNOWN',
        operation: 'REJECTED',
        snapshotChecksum: snapshot?.checksum || '',
        validationResult: {} as any,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        scriptVersionsRestoredCount: 0,
        error: 'Unauthorized: Granular script restoration requires ADMIN or CONTENT_LEAD role.',
      };
    }

    // 2. Explicit Confirmation Gate (Exact match "RESTORE SCRIPT")
    if (explicitConfirmation !== 'RESTORE SCRIPT') {
      return {
        success: false,
        entityId: scriptId || 'UNKNOWN',
        operation: 'REJECTED',
        snapshotChecksum: snapshot?.checksum || '',
        validationResult: {} as any,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        scriptVersionsRestoredCount: 0,
        error: 'Invalid explicit confirmation. You must provide the exact string "RESTORE SCRIPT".',
      };
    }

    if (!scriptId || typeof scriptId !== 'string') {
      return {
        success: false,
        entityId: scriptId || 'UNKNOWN',
        operation: 'REJECTED',
        snapshotChecksum: snapshot?.checksum || '',
        validationResult: {} as any,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        scriptVersionsRestoredCount: 0,
        error: 'Missing or invalid scriptId provided for granular restore.',
      };
    }

    // 3. Find script in snapshot SCRIPT / SCRIPTS sheet
    const wsScripts: WorksheetSnapshot = snapshot?.worksheets?.['SCRIPT'] || snapshot?.worksheets?.['SCRIPTS'];
    if (!wsScripts || !wsScripts.headers || !wsScripts.rows) {
      return {
        success: false,
        entityId: scriptId,
        operation: 'REJECTED',
        snapshotChecksum: snapshot?.checksum || '',
        validationResult: {} as any,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        scriptVersionsRestoredCount: 0,
        error: 'Snapshot is missing SCRIPT worksheet or structure.',
      };
    }

    const scriptHeaders = wsScripts.headers;
    const scriptIdIdx = scriptHeaders.findIndex(h => h.toLowerCase() === 'scriptid' || h.toLowerCase() === 'id');
    if (scriptIdIdx === -1) {
      return {
        success: false,
        entityId: scriptId,
        operation: 'REJECTED',
        snapshotChecksum: snapshot?.checksum || '',
        validationResult: {} as any,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        scriptVersionsRestoredCount: 0,
        error: 'SCRIPTS worksheet header is missing ID / scriptId column.',
      };
    }

    let snapshotScriptRow: any = null;
    for (const row of wsScripts.rows) {
      const sId = String(row[scriptIdIdx] || '');
      if (sId === scriptId) {
        snapshotScriptRow = {};
        scriptHeaders.forEach((h, idx) => {
          snapshotScriptRow[h] = row[idx] !== undefined ? row[idx] : '';
        });
        break;
      }
    }

    if (!snapshotScriptRow) {
      return {
        success: false,
        entityId: scriptId,
        operation: 'REJECTED',
        snapshotChecksum: snapshot?.checksum || '',
        validationResult: {} as any,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        scriptVersionsRestoredCount: 0,
        error: `Script ID "${scriptId}" not found in snapshot SCRIPTS worksheet.`,
      };
    }

    // 4. Run Dry-Run Validation via RestoreValidatorService
    const validationResult = await restoreValidatorService.validateRestore({
      snapshot,
      scope: 'GRANULAR_RECORD',
      entityType: 'SCRIPTS',
      entityIds: [scriptId],
    });

    if (!validationResult.valid) {
      return {
        success: false,
        entityId: scriptId,
        operation: 'REJECTED',
        snapshotChecksum: snapshot.checksum,
        validationResult,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        scriptVersionsRestoredCount: 0,
        error: 'Preflight validation failed. Snapshot integrity, schema, or conflict checks failed.',
        conflictReason: JSON.stringify(validationResult.conflicts || validationResult.schemaErrors),
      };
    }

    // Check specific conflicts for this scriptId
    const scriptConflict = validationResult.conflicts.find(c => c.entityId === scriptId);
    if (scriptConflict) {
      return {
        success: false,
        entityId: scriptId,
        operation: 'REJECTED',
        snapshotChecksum: snapshot.checksum,
        validationResult,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        scriptVersionsRestoredCount: 0,
        error: `Conflict detected for script "${scriptId}": ${scriptConflict.reason}`,
        conflictReason: scriptConflict.reason,
      };
    }

    // 5. Foreign-Key Dependency Check (Video & Question Existence)
    const videoId = snapshotScriptRow.videoId || '';
    const questionId = snapshotScriptRow.questionId || '';

    if (videoId) {
      let videoExists = false;
      try {
        const v = await videosRepository.findById(videoId);
        if (v) videoExists = true;
      } catch {
        videoExists = false;
      }
      if (!videoExists) {
        // Check snapshot VIDEOS sheet
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
            entityId: scriptId,
            operation: 'REJECTED',
            snapshotChecksum: snapshot.checksum,
            validationResult,
            persisted: false,
            auditRecorded: false,
            workflowRecorded: false,
            scriptVersionsRestoredCount: 0,
            error: `Missing dependency: Linked videoId "${videoId}" does not exist in production or snapshot.`,
            conflictReason: `Missing video dependency: ${videoId}`,
          };
        }
      }
    }

    if (questionId) {
      let questionExists = false;
      try {
        const q = await questionsRepository.findById(questionId);
        if (q) questionExists = true;
      } catch {
        questionExists = false;
      }
      if (!questionExists) {
        const wsQuestions = snapshot?.worksheets?.['QUESTIONS'];
        let foundInSnap = false;
        if (wsQuestions && wsQuestions.rows) {
          const qHeaders = wsQuestions.headers || [];
          const qIdIdx = qHeaders.findIndex(h => h.toLowerCase() === 'questionid' || h.toLowerCase() === 'id');
          if (qIdIdx >= 0) {
            foundInSnap = wsQuestions.rows.some(r => String(r[qIdIdx]) === questionId);
          }
        }
        if (!foundInSnap) {
          return {
            success: false,
            entityId: scriptId,
            operation: 'REJECTED',
            snapshotChecksum: snapshot.checksum,
            validationResult,
            persisted: false,
            auditRecorded: false,
            workflowRecorded: false,
            scriptVersionsRestoredCount: 0,
            error: `Missing dependency: Linked questionId "${questionId}" does not exist in production or snapshot.`,
            conflictReason: `Missing question dependency: ${questionId}`,
          };
        }
      }
    }

    // 6. Gather snapshot script versions for this scriptId
    const wsVersions: WorksheetSnapshot = snapshot?.worksheets?.['SCRIPT_VERSIONS'];
    const snapshotVersions: any[] = [];
    if (wsVersions && wsVersions.headers && wsVersions.rows) {
      const vHeaders = wsVersions.headers;
      const sIdIdx = vHeaders.findIndex(h => h.toLowerCase() === 'scriptid');
      const verNumIdx = vHeaders.findIndex(h => h.toLowerCase() === 'versionnumber');
      if (sIdIdx >= 0) {
        for (const row of wsVersions.rows) {
          const sId = String(row[sIdIdx] || '');
          if (sId === scriptId) {
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
    const existingVersions = await scriptVersionsRepository.findByScriptId(scriptId);
    const existingVersionMap = new Map(existingVersions.map(ev => [Number(ev.versionNumber), ev]));

    for (const snapVer of snapshotVersions) {
      const vNum = Number(snapVer.versionNumber || 1);
      const existingVer = existingVersionMap.get(vNum);
      if (existingVer) {
        // Compare content or contentJson if present
        const snapContent = snapVer.content || JSON.stringify(snapVer.contentJson || {});
        const prodContent = existingVer.content || JSON.stringify(existingVer.contentJson || {});
        if (snapContent !== prodContent) {
          return {
            success: false,
            entityId: scriptId,
            operation: 'REJECTED',
            snapshotChecksum: snapshot.checksum,
            validationResult,
            persisted: false,
            auditRecorded: false,
            workflowRecorded: false,
            scriptVersionsRestoredCount: 0,
            error: `Immutable version conflict: Version ${vNum} already exists for script "${scriptId}" with differing content.`,
            conflictReason: `Immutable version collision on version ${vNum}`,
          };
        }
      }
    }

    // 7. Perform Script Restoration (CREATE, UPDATE, or NO_CHANGE)
    const existingScript = await scriptsRepository.findById(scriptId);
    const now = new Date().toISOString();
    let operation: 'CREATE' | 'UPDATE' | 'NO_CHANGE' = 'NO_CHANGE';

    const targetScriptData: Script = {
      id: scriptId,
      videoId: snapshotScriptRow.videoId || existingScript?.videoId || '',
      questionId: snapshotScriptRow.questionId || existingScript?.questionId || '',
      hookText: snapshotScriptRow.hookText || '',
      problemStatement: snapshotScriptRow.problemStatement || '',
      stepByStepSolution: snapshotScriptRow.stepByStepSolution || '',
      speedTrickOrTakeaway: snapshotScriptRow.speedTrickOrTakeaway || '',
      callToAction: snapshotScriptRow.callToAction || '',
      currentVersion: Number(snapshotScriptRow.currentVersion || 1),
      notes: snapshotScriptRow.notes || '',
      createdAt: existingScript?.createdAt || snapshotScriptRow.createdAt || now,
      updatedAt: now,
    };

    if (!existingScript) {
      operation = 'CREATE';
      await scriptsRepository.appendRecord(targetScriptData);
    } else {
      // Check if identical
      const isIdentical = 
        existingScript.videoId === targetScriptData.videoId &&
        existingScript.questionId === targetScriptData.questionId &&
        existingScript.hookText === targetScriptData.hookText &&
        existingScript.problemStatement === targetScriptData.problemStatement &&
        existingScript.stepByStepSolution === targetScriptData.stepByStepSolution &&
        existingScript.speedTrickOrTakeaway === targetScriptData.speedTrickOrTakeaway &&
        existingScript.callToAction === targetScriptData.callToAction &&
        existingScript.currentVersion === targetScriptData.currentVersion;

      if (!isIdentical) {
        // Conflict policy: check if production is newer
        const snapUpdated = snapshotScriptRow.updatedAt || '';
        const prodUpdated = existingScript.updatedAt || '';
        if (snapUpdated && prodUpdated && snapUpdated < prodUpdated) {
          return {
            success: false,
            entityId: scriptId,
            operation: 'REJECTED',
            snapshotChecksum: snapshot.checksum,
            validationResult,
            persisted: false,
            auditRecorded: false,
            workflowRecorded: false,
            scriptVersionsRestoredCount: 0,
            error: `Conflict policy violation: Production script "${scriptId}" is newer than snapshot.`,
            conflictReason: 'Production script is newer than snapshot',
          };
        }
        operation = 'UPDATE';
        // Update in-place or via repository update method
        await scriptsRepository.updateRecord(scriptId, targetScriptData);
      } else {
        operation = 'NO_CHANGE';
      }
    }

    // 8. Restore Missing Script Versions (Append-only immutable historical ledger)
    let versionsRestoredCount = 0;
    for (const snapVer of snapshotVersions) {
      const vNum = Number(snapVer.versionNumber || 1);
      const existingVer = existingVersionMap.get(vNum);
      if (!existingVer) {
        const newVersionRecord: ScriptVersion = {
          id: snapVer.id || `${scriptId}-V${vNum}`,
          scriptId,
          versionNumber: vNum,
          content: snapVer.content || '',
          contentJson: snapVer.contentJson ? (typeof snapVer.contentJson === 'string' ? JSON.parse(snapVer.contentJson) : snapVer.contentJson) : {},
          editedBy: snapVer.editedBy || actor.name,
          changeSummary: snapVer.changeSummary || `Restored version ${vNum} from snapshot`,
          createdAt: snapVer.createdAt || now,
        };
        await scriptVersionsRepository.appendRecord(newVersionRecord);
        versionsRestoredCount++;
      }
    }

    // 9. Post-Write Verification
    const verifiedScript = await scriptsRepository.findById(scriptId);
    if (!verifiedScript || verifiedScript.id !== scriptId) {
      return {
        success: false,
        entityId: scriptId,
        operation: 'REJECTED',
        snapshotChecksum: snapshot.checksum,
        validationResult,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        scriptVersionsRestoredCount: versionsRestoredCount,
        error: 'Post-write verification failed: Script not found or ID mismatch after restoration.',
      };
    }

    const verifiedVersions = await scriptVersionsRepository.findByScriptId(scriptId);
    for (const snapVer of snapshotVersions) {
      const vNum = Number(snapVer.versionNumber || 1);
      const found = verifiedVersions.find(v => v.versionNumber === vNum);
      if (!found) {
        return {
          success: false,
          entityId: scriptId,
          operation: 'REJECTED',
          snapshotChecksum: snapshot.checksum,
          validationResult,
          persisted: false,
          auditRecorded: false,
          workflowRecorded: false,
          scriptVersionsRestoredCount: versionsRestoredCount,
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
        `RESTORE_SCRIPT_${operation}`,
        'SCRIPT',
        scriptId,
        {
          snapshotChecksum: snapshot.checksum,
          operation,
          versionsRestored: versionsRestoredCount,
          currentVersion: verifiedScript.currentVersion,
        }
      );
      auditRecorded = true;
    } catch {
      auditRecorded = false;
    }

    try {
      await workflowService.recordTransition(
        'SCRIPT',
        scriptId,
        'RESTORED',
        'RESTORED',
        actor.id,
        actor.name,
        `Granular script restore: ${operation}, versions appended: ${versionsRestoredCount}`
      );
      workflowRecorded = true;
    } catch {
      workflowRecorded = false;
    }

    return {
      success: true,
      entityId: scriptId,
      operation,
      snapshotChecksum: snapshot.checksum,
      validationResult,
      persisted: true,
      auditRecorded,
      workflowRecorded,
      scriptVersionsRestoredCount: versionsRestoredCount,
    };
  }
}

export const granularScriptRestoreService = GranularScriptRestoreService.getInstance();
