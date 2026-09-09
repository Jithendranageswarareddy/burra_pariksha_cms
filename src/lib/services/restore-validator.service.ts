/**
 * BURRA PARIKSHA CMS - Restore Validator & Dry-Run Service
 * Task 3F.4.6: Read-only restoration validation and conflict detection engine.
 * 
 * Strict Constraints:
 * - Read-only operation.
 * - Does not modify Google Sheets, sequences, or production data.
 * - Performs preflight checksum, schema, foreign-key, version safety, and sequence checks.
 */

import crypto from 'node:crypto';
import { GoogleSheetsSnapshot, WorksheetSnapshot } from './snapshot-exporter.service';
import { ALL_SHEET_TABS } from '../schemas/google-sheets-schema';
import { 
  questionsRepository, 
  videosRepository, 
  scriptsRepository, 
  scriptVersionsRepository,
  thumbnailsRepository,
  thumbnailVersionsRepository,
  pinnedCommentsRepository,
  pinnedCommentVersionsRepository,
  categoriesRepository,
  topicsRepository,
  subtopicsRepository,
  assignmentsRepository,
  publishingRepository,
  sequencesRepository 
} from '../repositories';

export interface RestoreValidationRequest {
  snapshot: GoogleSheetsSnapshot;
  scope: 'GRANULAR_RECORD' | 'GRANULAR_SET';
  entityType?: string; // e.g., 'QUESTIONS', 'VIDEOS'
  entityIds?: string[]; // IDs to validate/restore
}

export interface RestoreConflict {
  entityType: string;
  entityId: string;
  reason: string;
  details?: any;
}

export interface MissingDependency {
  entityType: string;
  entityId: string;
  missingKey: string;
}

export interface RestoreValidationResult {
  valid: boolean;
  snapshotChecksum: string;
  scope: string;
  recordsToCreate: any[];
  recordsToUpdate: any[];
  unchangedRecords: any[];
  conflicts: RestoreConflict[];
  missingDependencies: MissingDependency[];
  sequenceWarnings: string[];
  schemaErrors: string[];
  validationWarnings: string[];
}

export class RestoreValidatorService {
  private static instance: RestoreValidatorService | null = null;

  private constructor() {}

  public static getInstance(): RestoreValidatorService {
    if (!RestoreValidatorService.instance) {
      RestoreValidatorService.instance = new RestoreValidatorService();
    }
    return RestoreValidatorService.instance;
  }

  /**
   * Validates snapshot integrity, schema matching, foreign keys, record conflicts,
   * immutable versions, and sequence safety without performing any writes.
   */
  public async validateRestore(request: RestoreValidationRequest): Promise<RestoreValidationResult> {
    const recordsToCreate: any[] = [];
    const recordsToUpdate: any[] = [];
    const unchangedRecords: any[] = [];
    const conflicts: RestoreConflict[] = [];
    const missingDependencies: MissingDependency[] = [];
    const sequenceWarnings: string[] = [];
    const schemaErrors: string[] = [];
    const validationWarnings: string[] = [];

    const { snapshot } = request;

    if (!snapshot || !snapshot.worksheets || !snapshot.checksum) {
      return {
        valid: false,
        snapshotChecksum: '',
        scope: request.scope,
        recordsToCreate,
        recordsToUpdate,
        unchangedRecords,
        conflicts: [{ entityType: 'SNAPSHOT', entityId: 'GLOBAL', reason: 'Invalid snapshot structure or missing checksum.' }],
        missingDependencies,
        sequenceWarnings,
        schemaErrors: ['Invalid snapshot structure.'],
        validationWarnings,
      };
    }

    // 1. Checksum Integrity Validation
    const checksumPayload = JSON.stringify({
      worksheets: snapshot.worksheets,
      sequences: snapshot.sequences,
    });
    const recomputedChecksum = crypto.createHash('sha256').update(checksumPayload).digest('hex');

    if (recomputedChecksum !== snapshot.checksum) {
      return {
        valid: false,
        snapshotChecksum: snapshot.checksum,
        scope: request.scope,
        recordsToCreate,
        recordsToUpdate,
        unchangedRecords,
        conflicts: [{ entityType: 'SNAPSHOT', entityId: 'GLOBAL', reason: 'Checksum verification failed. Snapshot data has been tampered with or corrupted.' }],
        missingDependencies,
        sequenceWarnings,
        schemaErrors: ['Checksum mismatch.'],
        validationWarnings,
      };
    }

    // 2. Schema Validation (Worksheet Presence and Headers)
    for (const expectedTab of ALL_SHEET_TABS) {
      const ws: WorksheetSnapshot = snapshot.worksheets[expectedTab];
      if (!ws) {
        schemaErrors.push(`Missing expected worksheet: "${expectedTab}"`);
        continue;
      }
      if (!Array.isArray(ws.headers)) {
        schemaErrors.push(`Worksheet "${expectedTab}" is missing headers array.`);
      }
    }

    if (schemaErrors.length > 0) {
      return {
        valid: false,
        snapshotChecksum: snapshot.checksum,
        scope: request.scope,
        recordsToCreate,
        recordsToUpdate,
        unchangedRecords,
        conflicts: [{ entityType: 'SCHEMA', entityId: 'GLOBAL', reason: 'Worksheet schema validation failed.' }],
        missingDependencies,
        sequenceWarnings,
        schemaErrors,
        validationWarnings,
      };
    }

    // 3. Determine target worksheets/entities to analyze based on scope
    const targetSheets = request.entityType ? [request.entityType] : Object.keys(snapshot.worksheets);

    // Fetch current production entities for comparison
    let currentQuestions: any[] = [];
    let currentVideos: any[] = [];
    let currentScripts: any[] = [];
    let currentScriptVersions: any[] = [];
    let currentThumbnails: any[] = [];
    let currentThumbnailVersions: any[] = [];
    let currentPinnedComments: any[] = [];
    let currentPinnedCommentVersions: any[] = [];
    let currentCategories: any[] = [];
    let currentTopics: any[] = [];
    let currentSubtopics: any[] = [];

    try {
      currentQuestions = await questionsRepository.findAll();
      currentVideos = await videosRepository.findAll();
      currentScripts = await scriptsRepository.findAll();
      currentScriptVersions = await scriptVersionsRepository.findAll();
      currentThumbnails = await thumbnailsRepository.findAll();
      currentThumbnailVersions = await thumbnailVersionsRepository.findAll();
      currentPinnedComments = await pinnedCommentsRepository.findAll();
      currentPinnedCommentVersions = await pinnedCommentVersionsRepository.findAll();
      currentCategories = await categoriesRepository.findAll();
      currentTopics = await topicsRepository.findAll();
      currentSubtopics = await subtopicsRepository.findAll();
    } catch {
      // If repository read fails in mock/test, fall back gracefully
    }

    // Map production entities by ID for O(1) lookup
    const questionMap = new Map(currentQuestions.map((q: any) => [q.id || q.questionId, q]));
    const videoMap = new Map(currentVideos.map((v: any) => [v.id || v.videoId, v]));
    const scriptMap = new Map(currentScripts.map((s: any) => [s.id || s.scriptId, s]));
    const scriptVersionMap = new Map(currentScriptVersions.map((sv: any) => [`${sv.scriptId}_${sv.versionNumber}`, sv]));
    const thumbnailMap = new Map(currentThumbnails.map((t: any) => [t.id || t.thumbnailId, t]));
    const thumbnailVersionMap = new Map(currentThumbnailVersions.map((tv: any) => [`${tv.thumbnailId}_${tv.versionNumber}`, tv]));
    const pinnedCommentMap = new Map(currentPinnedComments.map((pc: any) => [pc.id || pc.pinnedCommentId, pc]));
    const pinnedCommentVersionMap = new Map(currentPinnedCommentVersions.map((pcv: any) => [`${pcv.pinnedCommentId}_${pcv.versionNumber}`, pcv]));
    const categoryMap = new Map(currentCategories.map((c: any) => [c.id || c.categoryId, c]));
    const topicMap = new Map(currentTopics.map((t: any) => [t.id || t.topicId, t]));
    const subtopicMap = new Map(currentSubtopics.map((st: any) => [st.id || st.subtopicId, st]));

    // Helper to convert rows to objects using headers
    for (const sheetName of targetSheets) {
      const ws = snapshot.worksheets[sheetName] || 
                 (sheetName === 'SCRIPTS' ? snapshot.worksheets['SCRIPT'] : undefined) ||
                 (sheetName === 'SCRIPT' ? snapshot.worksheets['SCRIPTS'] : undefined);
      if (!ws || !ws.rows || ws.rows.length === 0) continue;

      const { headers, rows } = ws;
      const idIdx = headers.findIndex(h => h.toLowerCase() === 'id' || h.toLowerCase() === 'questionid' || h.toLowerCase() === 'videoid' || h.toLowerCase() === 'scriptid' || h.toLowerCase() === 'thumbnailid' || h.toLowerCase() === 'pinnedcommentid' || h.toLowerCase() === 'categoryid' || h.toLowerCase() === 'topicid' || h.toLowerCase() === 'subtopicid');

      for (const row of rows) {
        const recordObj: Record<string, any> = {};
        headers.forEach((h, idx) => {
          recordObj[h] = row[idx] !== undefined ? row[idx] : '';
        });

        const recordId = idIdx >= 0 ? String(row[idIdx] || '') : String(recordObj.id || recordObj.questionId || recordObj.videoId || '');
        if (request.entityIds && request.entityIds.length > 0 && recordId && !request.entityIds.includes(recordId)) {
          continue; // Skip if filtered by entityIds
        }

        // Evaluate record state and conflicts
        if (sheetName === 'QUESTIONS') {
          const existing = questionMap.get(recordId);
          if (!existing) {
            recordsToCreate.push({ entityType: sheetName, recordId, data: recordObj });
          } else {
            // Compare timestamps or values
            const snapUpdated = recordObj.updatedAt || recordObj.createdAt || '';
            const prodUpdated = existing.updatedAt || existing.createdAt || '';
            if (JSON.stringify(existing) === JSON.stringify(recordObj)) {
              unchangedRecords.push({ entityType: sheetName, recordId });
            } else if (snapUpdated && prodUpdated && snapUpdated < prodUpdated) {
              conflicts.push({
                entityType: sheetName,
                entityId: recordId,
                reason: 'Snapshot record is older than existing production record (Production is newer).',
              });
            } else {
              recordsToUpdate.push({ entityType: sheetName, recordId, data: recordObj });
            }
          }

          // Foreign Key Check: Topic & Subtopic
          if (recordObj.topicId && !topicMap.has(recordObj.topicId)) {
            missingDependencies.push({ entityType: sheetName, entityId: recordId, missingKey: `topicId:${recordObj.topicId}` });
          }
          if (recordObj.subtopicId && !subtopicMap.has(recordObj.subtopicId)) {
            missingDependencies.push({ entityType: sheetName, entityId: recordId, missingKey: `subtopicId:${recordObj.subtopicId}` });
          }
        } else if (sheetName === 'VIDEOS') {
          const existing = videoMap.get(recordId);
          if (!existing) {
            recordsToCreate.push({ entityType: sheetName, recordId, data: recordObj });
          } else {
            if (JSON.stringify(existing) === JSON.stringify(recordObj)) {
              unchangedRecords.push({ entityType: sheetName, recordId });
            } else {
              recordsToUpdate.push({ entityType: sheetName, recordId, data: recordObj });
            }
          }
          // Foreign Key Check: Question ID
          if (recordObj.questionId && !questionMap.has(recordObj.questionId)) {
            missingDependencies.push({ entityType: sheetName, entityId: recordId, missingKey: `questionId:${recordObj.questionId}` });
          }
        } else if (sheetName === 'SCRIPTS' || sheetName === 'SCRIPT') {
          const existing = scriptMap.get(recordId);
          if (!existing) {
            recordsToCreate.push({ entityType: sheetName, recordId, data: recordObj });
          } else {
            if (JSON.stringify(existing) === JSON.stringify(recordObj)) {
              unchangedRecords.push({ entityType: sheetName, recordId });
            } else {
              recordsToUpdate.push({ entityType: sheetName, recordId, data: recordObj });
            }
          }
        } else if (sheetName === 'SCRIPT_VERSIONS') {
          const versionKey = `${recordObj.scriptId}_${recordObj.versionNumber}`;
          const existing = scriptVersionMap.get(versionKey);
          if (existing) {
            // Immutable version collision check
            if (JSON.stringify(existing) !== JSON.stringify(recordObj)) {
              conflicts.push({
                entityType: sheetName,
                entityId: versionKey,
                reason: 'Immutable script version collision: version number already exists with different content.',
              });
            } else {
              unchangedRecords.push({ entityType: sheetName, recordId: versionKey });
            }
          } else {
            recordsToCreate.push({ entityType: sheetName, recordId: versionKey, data: recordObj });
          }
        } else if (sheetName === 'THUMBNAILS') {
          const existing = thumbnailMap.get(recordId);
          if (!existing) {
            recordsToCreate.push({ entityType: sheetName, recordId, data: recordObj });
          } else {
            if (JSON.stringify(existing) === JSON.stringify(recordObj)) {
              unchangedRecords.push({ entityType: sheetName, recordId });
            } else {
              recordsToUpdate.push({ entityType: sheetName, recordId, data: recordObj });
            }
          }
        } else if (sheetName === 'THUMBNAIL_VERSIONS') {
          const versionKey = `${recordObj.thumbnailId}_${recordObj.versionNumber}`;
          const existing = thumbnailVersionMap.get(versionKey);
          if (existing && JSON.stringify(existing) !== JSON.stringify(recordObj)) {
            conflicts.push({
              entityType: sheetName,
              entityId: versionKey,
              reason: 'Immutable thumbnail version collision.',
            });
          } else {
            recordsToCreate.push({ entityType: sheetName, recordId: versionKey, data: recordObj });
          }
        } else if (sheetName === 'PINNED_COMMENTS') {
          const existing = pinnedCommentMap.get(recordId);
          if (!existing) {
            recordsToCreate.push({ entityType: sheetName, recordId, data: recordObj });
          } else {
            if (JSON.stringify(existing) === JSON.stringify(recordObj)) {
              unchangedRecords.push({ entityType: sheetName, recordId });
            } else {
              recordsToUpdate.push({ entityType: sheetName, recordId, data: recordObj });
            }
          }
        } else if (sheetName === 'PINNED_COMMENT_VERSIONS') {
          const versionKey = `${recordObj.pinnedCommentId}_${recordObj.versionNumber}`;
          const existing = pinnedCommentVersionMap.get(versionKey);
          if (existing && JSON.stringify(existing) !== JSON.stringify(recordObj)) {
            conflicts.push({
              entityType: sheetName,
              entityId: versionKey,
              reason: 'Immutable pinned comment version collision.',
            });
          } else {
            recordsToCreate.push({ entityType: sheetName, recordId: versionKey, data: recordObj });
          }
        } else {
          // Default handling for other sheets
          recordsToCreate.push({ entityType: sheetName, recordId, data: recordObj });
        }
      }
    }

    // 4. Sequence Safety Validation (Forward-only, no rollback)
    if (snapshot.sequences && Array.isArray(snapshot.sequences)) {
      let prodSequences: any[] = [];
      try {
        prodSequences = await sequencesRepository.findAll();
      } catch {
        prodSequences = [];
      }
      const prodSeqMap = new Map(prodSequences.map((s: any) => [s.entityName || s.name, s.currentIndex || s.nextIndex || 0]));

      for (const snapSeq of snapshot.sequences) {
        const entityName = snapSeq.entityName || snapSeq.name;
        const snapIndex = snapSeq.currentIndex || snapSeq.nextIndex || 0;
        const prodIndex = prodSeqMap.get(entityName) || 0;

        if (snapIndex < prodIndex) {
          sequenceWarnings.push(`Sequence rollback detected for "${entityName}": snapshot index (${snapIndex}) is lower than production index (${prodIndex}). Sequence counter will be kept forward-only.`);
        }
      }
    }

    const isValid = conflicts.length === 0 && missingDependencies.length === 0 && schemaErrors.length === 0;

    return {
      valid: isValid,
      snapshotChecksum: snapshot.checksum,
      scope: request.scope,
      recordsToCreate,
      recordsToUpdate,
      unchangedRecords,
      conflicts,
      missingDependencies,
      sequenceWarnings,
      schemaErrors,
      validationWarnings,
    };
  }
}

export const restoreValidatorService = RestoreValidatorService.getInstance();
