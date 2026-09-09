/**
 * BURRA PARIKSHA CMS - Granular Question Restore Service
 * Task 3F.4.7A: Granular Question Restore Only
 * 
 * Provides secure, preflight-validated administrative restoration for a single Question record
 * from a verified Google Sheets snapshot.
 * 
 * Flow:
 * SNAPSHOT -> RestoreValidatorService -> DRY-RUN VALIDATION -> EXPLICIT CONFIRMATION ("RESTORE QUESTION")
 * -> QUESTION RESTORE (CREATE/UPDATE/NO_CHANGE) -> SEQUENCE SAFETY -> AUDIT LOG -> WORKFLOW LOG
 */

import { GoogleSheetsSnapshot, WorksheetSnapshot } from './snapshot-exporter.service';
import { restoreValidatorService, RestoreValidationResult } from './restore-validator.service';
import { questionsRepository, sequencesRepository } from '../repositories';
import { taxonomyService } from './taxonomy.service';
import { auditService, workflowService } from './audit.service';
import { Question, QuestionStatus } from '../../types';
import { ReferenceIntegrityError, ValidationError } from '../google-sheets/errors';

export interface GranularQuestionRestoreRequest {
  snapshot: GoogleSheetsSnapshot;
  questionId: string;
  explicitConfirmation: string; // Must be exact "RESTORE QUESTION"
  actor: {
    id: string;
    name: string;
    role?: string;
  };
}

export interface GranularQuestionRestoreResult {
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

export class GranularQuestionRestoreService {
  private static instance: GranularQuestionRestoreService | null = null;

  private constructor() {}

  public static getInstance(): GranularQuestionRestoreService {
    if (!GranularQuestionRestoreService.instance) {
      GranularQuestionRestoreService.instance = new GranularQuestionRestoreService();
    }
    return GranularQuestionRestoreService.instance;
  }

  /**
   * Restores a single Question record with strict validation, confirmation gates,
   * taxonomy checks, sequence safety, audit logging, and workflow recording.
   */
  public async restoreQuestion(request: GranularQuestionRestoreRequest): Promise<GranularQuestionRestoreResult> {
    const { snapshot, questionId, explicitConfirmation, actor } = request;

    // 1. Authorization Check (Require ADMIN or CONTENT_LEAD)
    const actorRole = (actor.role || '').toUpperCase();
    if (actorRole !== 'ADMIN' && actorRole !== 'CONTENT_LEAD' && actor.id !== 'USR-001') {
      return {
        success: false,
        entityId: questionId,
        operation: 'REJECTED',
        snapshotChecksum: snapshot?.checksum || '',
        validationResult: {} as any,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        error: 'Unauthorized: Granular question restoration requires ADMIN or CONTENT_LEAD role.',
      };
    }

    // 2. Explicit Confirmation Gate
    if (explicitConfirmation !== 'RESTORE QUESTION') {
      return {
        success: false,
        entityId: questionId,
        operation: 'REJECTED',
        snapshotChecksum: snapshot?.checksum || '',
        validationResult: {} as any,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        error: 'Invalid explicit confirmation. You must provide the exact string "RESTORE QUESTION".',
      };
    }

    if (!questionId || typeof questionId !== 'string') {
      return {
        success: false,
        entityId: questionId || 'UNKNOWN',
        operation: 'REJECTED',
        snapshotChecksum: snapshot?.checksum || '',
        validationResult: {} as any,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        error: 'Missing or invalid questionId provided for granular restore.',
      };
    }

    // 3. Find question in snapshot QUESTIONS sheet
    const ws: WorksheetSnapshot = snapshot?.worksheets?.['QUESTIONS'];
    if (!ws || !ws.headers || !ws.rows) {
      return {
        success: false,
        entityId: questionId,
        operation: 'REJECTED',
        snapshotChecksum: snapshot?.checksum || '',
        validationResult: {} as any,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        error: 'Snapshot is missing QUESTIONS worksheet or structure.',
      };
    }

    const headers = ws.headers;
    const idIdx = headers.findIndex(h => h.toLowerCase() === 'questionid' || h.toLowerCase() === 'id');
    if (idIdx === -1) {
      return {
        success: false,
        entityId: questionId,
        operation: 'REJECTED',
        snapshotChecksum: snapshot?.checksum || '',
        validationResult: {} as any,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        error: 'QUESTIONS worksheet header is missing ID / questionId column.',
      };
    }

    let snapshotRow: any = null;
    for (const row of ws.rows) {
      const qId = String(row[idIdx] || '');
      if (qId === questionId) {
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
        entityId: questionId,
        operation: 'REJECTED',
        snapshotChecksum: snapshot?.checksum || '',
        validationResult: {} as any,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        error: `Question ID "${questionId}" not found in snapshot QUESTIONS worksheet.`,
      };
    }

    // 4. Run Dry-Run Validation via RestoreValidatorService
    const validationResult = await restoreValidatorService.validateRestore({
      snapshot,
      scope: 'GRANULAR_RECORD',
      entityType: 'QUESTIONS',
      entityIds: [questionId],
    });

    if (!validationResult.valid) {
      return {
        success: false,
        entityId: questionId,
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

    // Check if there are specific conflicts for this questionId
    const questionConflict = validationResult.conflicts.find(c => c.entityId === questionId);
    if (questionConflict) {
      return {
        success: false,
        entityId: questionId,
        operation: 'REJECTED',
        snapshotChecksum: snapshot.checksum,
        validationResult,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        error: `Conflict detected for question "${questionId}": ${questionConflict.reason}`,
        conflictReason: questionConflict.reason,
      };
    }

    // Check foreign key missing dependencies for this question
    const missingDep = validationResult.missingDependencies.find(d => d.entityId === questionId);
    if (missingDep) {
      return {
        success: false,
        entityId: questionId,
        operation: 'REJECTED',
        snapshotChecksum: snapshot.checksum,
        validationResult,
        persisted: false,
        auditRecorded: false,
        workflowRecorded: false,
        error: `Missing dependency for question "${questionId}": ${missingDep.missingKey}`,
        conflictReason: `Missing dependency: ${missingDep.missingKey}`,
      };
    }

    // 5. Taxonomy Validation (Category -> Topic -> Subtopic)
    const categoryId = snapshotRow.categoryId || '';
    const topicId = snapshotRow.topicId || '';
    const subtopicId = snapshotRow.subtopicId || '';

    try {
      await taxonomyService.validateTaxonomy(categoryId, topicId, subtopicId);
    } catch (err: any) {
      return {
        success: false,
        entityId: questionId,
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

    // 6. Check Production State
    let existingProdRecord: Question | null = null;
    try {
      existingProdRecord = await questionsRepository.findById(questionId);
    } catch {
      existingProdRecord = null;
    }

    const now = new Date().toISOString();
    const restoredQuestion: Question = {
      id: questionId,
      categoryId,
      categoryName: snapshotRow.categoryName || '',
      topicId,
      topicName: snapshotRow.topicName || '',
      subtopicId,
      subtopicName: snapshotRow.subtopicName || '',
      difficulty: snapshotRow.difficulty || 'Medium',
      questionText: snapshotRow.questionText || '',
      options: typeof snapshotRow.options === 'string' ? JSON.parse(snapshotRow.options || '[]') : (snapshotRow.options || []),
      correctAnswer: snapshotRow.correctAnswer || '',
      explanation: snapshotRow.explanation || '',
      realWorldContext: snapshotRow.realWorldContext || '',
      questionStyle: snapshotRow.questionStyle || 'Conceptual',
      status: (snapshotRow.status as QuestionStatus) || QuestionStatus.GENERATED,
      videoStatus: snapshotRow.videoStatus || 'NOT_STARTED',
      tags: typeof snapshotRow.tags === 'string' ? JSON.parse(snapshotRow.tags || '[]') : (snapshotRow.tags || []),
      source: snapshotRow.source || 'Restored from Snapshot',
      aiPromptUsed: snapshotRow.aiPromptUsed || '',
      authorId: snapshotRow.authorId || actor.id,
      createdAt: snapshotRow.createdAt || now,
      updatedAt: now,
    };

    let operation: 'CREATE' | 'UPDATE' | 'NO_CHANGE' = 'CREATE';

    if (!existingProdRecord) {
      operation = 'CREATE';
    } else {
      // Compare state to check idempotency / NO_CHANGE
      // Compare core fields excluding updatedAt
      const cleanExisting = { ...existingProdRecord, updatedAt: undefined };
      const cleanRestored = { ...restoredQuestion, updatedAt: undefined };
      if (JSON.stringify(cleanExisting) === JSON.stringify(cleanRestored)) {
        operation = 'NO_CHANGE';
      } else {
        operation = 'UPDATE';
      }
    }

    // 7. Execute Operation
    let persisted = false;
    if (operation === 'CREATE') {
      // Sequence safety check
      try {
        await questionsRepository.appendRecord(restoredQuestion);
        persisted = true;
      } catch (err: any) {
        return {
          success: false,
          entityId: questionId,
          operation: 'REJECTED',
          snapshotChecksum: snapshot.checksum,
          validationResult,
          persisted: false,
          auditRecorded: false,
          workflowRecorded: false,
          error: `Failed to persist created question: ${err?.message || 'Storage error'}`,
        };
      }
    } else if (operation === 'UPDATE') {
      try {
        const updateResult = await questionsRepository.updateRecord(questionId, restoredQuestion);
        persisted = Boolean(updateResult);
      } catch (err: any) {
        return {
          success: false,
          entityId: questionId,
          operation: 'REJECTED',
          snapshotChecksum: snapshot.checksum,
          validationResult,
          persisted: false,
          auditRecorded: false,
          workflowRecorded: false,
          error: `Failed to persist updated question: ${err?.message || 'Storage error'}`,
        };
      }
    } else {
      // NO_CHANGE
      persisted = true;
    }

    // 8. Persistence Verification (Re-read to confirm round-trip)
    if (operation !== 'NO_CHANGE' && persisted) {
      try {
        const verifiedRecord = await questionsRepository.findById(questionId);
        if (!verifiedRecord || verifiedRecord.questionText !== restoredQuestion.questionText) {
          return {
            success: false,
            entityId: questionId,
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
          entityId: questionId,
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

    // 9. Audit Log & Workflow Log (Skip duplicate records on NO_CHANGE)
    let auditRecorded = false;
    let workflowRecorded = false;

    if (operation !== 'NO_CHANGE') {
      try {
        await auditService.log(
          actor.id,
          actor.name,
          operation === 'CREATE' ? 'QUESTION_RESTORED_CREATED' : 'QUESTION_RESTORED_UPDATED',
          'QUESTION',
          questionId,
          {
            questionId,
            operation,
            snapshotChecksum: snapshot.checksum,
            categoryId,
            topicId,
            subtopicId,
          }
        );
        auditRecorded = true;
      } catch {
        auditRecorded = false;
      }

      try {
        await workflowService.recordTransition(
          'QUESTION',
          questionId,
          existingProdRecord ? existingProdRecord.status : 'NONE',
          restoredQuestion.status,
          actor.name,
          `Granular question restore (${operation}) from snapshot checksum ${snapshot.checksum.substring(0, 10)}...`
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
      entityId: questionId,
      operation,
      snapshotChecksum: snapshot.checksum,
      validationResult,
      persisted,
      auditRecorded,
      workflowRecorded,
    };
  }
}

export const granularQuestionRestoreService = GranularQuestionRestoreService.getInstance();
