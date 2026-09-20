/**
 * BURRA PARIKSHA CMS - Sequence Safety & Anomaly Detection Service
 * Phase 8B: Operational Reliability, Recovery & Production Hardening
 * 
 * Read-only diagnostic service that validates SEQUENCES table integrity
 * against domain entity tables to detect desynchronization, corrupted next_numbers,
 * or sequence allocation lag.
 * 
 * GUARANTEE: This service is strictly read-only and never automatically mutates sequences.
 */

import { sequencesRepository } from '../repositories/sequences.repository';
import {
  categoriesRepository,
  contentMastersRepository,
  pinnedCommentsRepository,
  questionsRepository,
  scriptsRepository,
  subtopicsRepository,
  thumbnailsRepository,
  topicsRepository,
  videosRepository,
} from '../repositories';
import { ID_PREFIX_MAP, SEQUENCE_ENTITIES, SequenceEntityType } from '../schemas/google-sheets-schema';

export interface SequenceAnomaly {
  id: string;
  entityType: string;
  anomalyType:
    | 'MISSING_SEQUENCE_ROW'
    | 'INVALID_NEXT_NUMBER'
    | 'INVALID_PREFIX'
    | 'INVALID_PAD_LENGTH'
    | 'SEQUENCE_BEHIND_MAX_ID'
    | 'MALFORMED_CONFIG';
  severity: 'CRITICAL' | 'ERROR' | 'WARNING';
  currentNextNumber: number | null;
  detectedMaxAllocatedId: number | null;
  configuredPrefix: string | null;
  expectedPrefix: string;
  configuredPadLength: number | null;
  expectedPadLength: number;
  message: string;
  remediationGuidance: string;
}

export interface SequenceSafetyReport {
  generatedAt: string;
  overallStatus: 'HEALTHY' | 'WARNING' | 'ANOMALY_DETECTED';
  totalChecked: number;
  healthyCount: number;
  anomalyCount: number;
  anomalies: SequenceAnomaly[];
  sequences: Array<{
    entityType: string;
    nextNumber: number;
    prefix: string;
    padLength: number;
    detectedMaxIdNumber: number;
    status: 'HEALTHY' | 'ANOMALY';
  }>;
  isReadOnly: true;
  concurrencyLimitationNote: string;
}

export class SequenceSafetyService {
  private static instance: SequenceSafetyService | null = null;

  private constructor() {}

  public static getInstance(): SequenceSafetyService {
    if (!SequenceSafetyService.instance) {
      SequenceSafetyService.instance = new SequenceSafetyService();
    }
    return SequenceSafetyService.instance;
  }

  /**
   * Helper to parse numeric part of permanent ID string (e.g. "BP-Q-000042" -> 42).
   */
  private extractNumericId(idString: string, prefix: string): number | null {
    if (!idString || typeof idString !== 'string') return null;
    if (idString.startsWith(prefix)) {
      const rest = idString.slice(prefix.length);
      const parsed = parseInt(rest, 10);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  }

  /**
   * Scans entity repositories to discover the highest allocated ID number.
   */
  public async getMaxAllocatedIdForEntity(entityType: SequenceEntityType): Promise<number> {
    const config = ID_PREFIX_MAP[entityType];
    const prefix = config?.prefix || 'BP-';

    try {
      let ids: string[] = [];
      switch (entityType) {
        case SEQUENCE_ENTITIES.QUESTION: {
          const items = await questionsRepository.findAll();
          ids = items.map((q) => q.id);
          break;
        }
        case SEQUENCE_ENTITIES.VIDEO: {
          const items = await videosRepository.findAll();
          ids = items.map((v) => v.id);
          break;
        }
        case SEQUENCE_ENTITIES.SCRIPT: {
          const items = await scriptsRepository.findAll();
          ids = items.map((s) => s.id);
          break;
        }
        case SEQUENCE_ENTITIES.THUMBNAIL: {
          const items = await thumbnailsRepository.findAll();
          ids = items.map((t) => t.id);
          break;
        }
        case SEQUENCE_ENTITIES.PINNED_COMMENT: {
          const items = await pinnedCommentsRepository.findAll();
          ids = items.map((p) => p.id);
          break;
        }
        case SEQUENCE_ENTITIES.CATEGORY: {
          const items = await categoriesRepository.findAll();
          ids = items.map((c) => c.id);
          break;
        }
        case SEQUENCE_ENTITIES.TOPIC: {
          const items = await topicsRepository.findAll();
          ids = items.map((t) => t.id);
          break;
        }
        case SEQUENCE_ENTITIES.CONTENT_MASTER: {
          const items = await contentMastersRepository.findAll();
          ids = items.map((m) => m.id);
          break;
        }
        case SEQUENCE_ENTITIES.SUBTOPIC: {
          const items = await subtopicsRepository.findAll();
          ids = items.map((s) => s.id);
          break;
        }
        default:
          return 0;
      }

      let maxNum = 0;
      for (const id of ids) {
        const num = this.extractNumericId(id, prefix);
        if (num !== null && num > maxNum) {
          maxNum = num;
        }
      }
      return maxNum;
    } catch {
      return 0;
    }
  }

  /**
   * Performs read-only diagnostic safety audit on SEQUENCES worksheet.
   */
  public async auditSequences(): Promise<SequenceSafetyReport> {
    const anomalies: SequenceAnomaly[] = [];
    const sequenceSummaries: SequenceSafetyReport['sequences'] = [];
    const entityTypes = Object.values(SEQUENCE_ENTITIES) as SequenceEntityType[];

    let sequences: any[] = [];
    try {
      sequences = await sequencesRepository.findAll();
    } catch (err: any) {
      anomalies.push({
        id: 'SEQ-ANOMALY-FETCH-FAIL',
        entityType: 'ALL',
        anomalyType: 'MALFORMED_CONFIG',
        severity: 'CRITICAL',
        currentNextNumber: null,
        detectedMaxAllocatedId: null,
        configuredPrefix: null,
        expectedPrefix: 'BP-',
        configuredPadLength: null,
        expectedPadLength: 6,
        message: `Failed to read SEQUENCES worksheet: ${err?.message || 'Unknown error'}`,
        remediationGuidance: 'Check that the SEQUENCES sheet tab exists in Google Sheets with valid headers.',
      });
    }

    const sequenceMap = new Map<string, any>();
    for (const seq of sequences) {
      if (seq.entityType) {
        sequenceMap.set(seq.entityType, seq);
      }
    }

    for (const entityType of entityTypes) {
      const expectedConfig = ID_PREFIX_MAP[entityType] || { prefix: 'BP-', padLength: 6 };
      const seqRecord = sequenceMap.get(entityType);
      const maxAllocated = await this.getMaxAllocatedIdForEntity(entityType);

      if (!seqRecord) {
        anomalies.push({
          id: `SEQ-MISSING-${entityType}`,
          entityType,
          anomalyType: 'MISSING_SEQUENCE_ROW',
          severity: 'CRITICAL',
          currentNextNumber: null,
          detectedMaxAllocatedId: maxAllocated,
          configuredPrefix: null,
          expectedPrefix: expectedConfig.prefix,
          configuredPadLength: null,
          expectedPadLength: expectedConfig.padLength,
          message: `Missing sequence configuration row in SEQUENCES tab for entity "${entityType}".`,
          remediationGuidance: `Add row to SEQUENCES sheet: entity_type="${entityType}", next_number=${maxAllocated + 1}, prefix="${expectedConfig.prefix}", pad_length=${expectedConfig.padLength}.`,
        });

        sequenceSummaries.push({
          entityType,
          nextNumber: 0,
          prefix: expectedConfig.prefix,
          padLength: expectedConfig.padLength,
          detectedMaxIdNumber: maxAllocated,
          status: 'ANOMALY',
        });
        continue;
      }

      const nextNum = Number(seqRecord.nextNumber);
      const prefix = seqRecord.prefix || expectedConfig.prefix;
      const padLength = Number(seqRecord.padLength) || expectedConfig.padLength;
      let hasEntityAnomaly = false;

      // 1. Validate nextNumber format
      if (isNaN(nextNum) || nextNum <= 0 || !Number.isInteger(nextNum)) {
        hasEntityAnomaly = true;
        anomalies.push({
          id: `SEQ-INVALID-NUM-${entityType}`,
          entityType,
          anomalyType: 'INVALID_NEXT_NUMBER',
          severity: 'CRITICAL',
          currentNextNumber: isNaN(nextNum) ? null : nextNum,
          detectedMaxAllocatedId: maxAllocated,
          configuredPrefix: prefix,
          expectedPrefix: expectedConfig.prefix,
          configuredPadLength: padLength,
          expectedPadLength: expectedConfig.padLength,
          message: `Invalid next_number value "${seqRecord.nextNumber}" for entity "${entityType}". Must be a positive integer.`,
          remediationGuidance: `Update next_number in SEQUENCES sheet for "${entityType}" to ${maxAllocated + 1}.`,
        });
      }

      // 2. Validate prefix matches expected standard
      if (seqRecord.prefix && seqRecord.prefix !== expectedConfig.prefix) {
        hasEntityAnomaly = true;
        anomalies.push({
          id: `SEQ-INVALID-PREFIX-${entityType}`,
          entityType,
          anomalyType: 'INVALID_PREFIX',
          severity: 'WARNING',
          currentNextNumber: nextNum,
          detectedMaxAllocatedId: maxAllocated,
          configuredPrefix: seqRecord.prefix,
          expectedPrefix: expectedConfig.prefix,
          configuredPadLength: padLength,
          expectedPadLength: expectedConfig.padLength,
          message: `Prefix mismatch for "${entityType}": found "${seqRecord.prefix}", expected "${expectedConfig.prefix}".`,
          remediationGuidance: `Verify and update prefix column in SEQUENCES sheet to "${expectedConfig.prefix}".`,
        });
      }

      // 3. Validate pad_length range (1 to 12)
      if (padLength < 1 || padLength > 12) {
        hasEntityAnomaly = true;
        anomalies.push({
          id: `SEQ-INVALID-PAD-${entityType}`,
          entityType,
          anomalyType: 'INVALID_PAD_LENGTH',
          severity: 'ERROR',
          currentNextNumber: nextNum,
          detectedMaxAllocatedId: maxAllocated,
          configuredPrefix: prefix,
          expectedPrefix: expectedConfig.prefix,
          configuredPadLength: padLength,
          expectedPadLength: expectedConfig.padLength,
          message: `Invalid pad_length "${padLength}" for "${entityType}". Must be between 1 and 12.`,
          remediationGuidance: `Update pad_length column in SEQUENCES sheet to ${expectedConfig.padLength}.`,
        });
      }

      // 4. Validate next_number is NOT behind existing allocated IDs
      // If nextNumber <= maxAllocated, allocating next ID would produce collisions!
      if (!isNaN(nextNum) && nextNum <= maxAllocated) {
        hasEntityAnomaly = true;
        anomalies.push({
          id: `SEQ-BEHIND-${entityType}`,
          entityType,
          anomalyType: 'SEQUENCE_BEHIND_MAX_ID',
          severity: 'CRITICAL',
          currentNextNumber: nextNum,
          detectedMaxAllocatedId: maxAllocated,
          configuredPrefix: prefix,
          expectedPrefix: expectedConfig.prefix,
          configuredPadLength: padLength,
          expectedPadLength: expectedConfig.padLength,
          message: `CRITICAL SEQUENCE DRIFT: next_number (${nextNum}) is <= highest allocated ID in database (${maxAllocated}) for "${entityType}". Next allocation will cause ID collision.`,
          remediationGuidance: `Synchronize SEQUENCES tab: set next_number for "${entityType}" to ${maxAllocated + 1}.`,
        });
      }

      sequenceSummaries.push({
        entityType,
        nextNumber: nextNum,
        prefix,
        padLength,
        detectedMaxIdNumber: maxAllocated,
        status: hasEntityAnomaly ? 'ANOMALY' : 'HEALTHY',
      });
    }

    const hasCritical = anomalies.some((a) => a.severity === 'CRITICAL');
    const hasError = anomalies.some((a) => a.severity === 'ERROR');
    const overallStatus: SequenceSafetyReport['overallStatus'] =
      hasCritical || hasError ? 'ANOMALY_DETECTED' : anomalies.length > 0 ? 'WARNING' : 'HEALTHY';

    return {
      generatedAt: new Date().toISOString(),
      overallStatus,
      totalChecked: entityTypes.length,
      healthyCount: sequenceSummaries.filter((s) => s.status === 'HEALTHY').length,
      anomalyCount: anomalies.length,
      anomalies,
      sequences: sequenceSummaries,
      isReadOnly: true,
      concurrencyLimitationNote:
        'Promise queue serialization protects concurrency within a single Node.js instance. Multi-instance distributed locking is not provided by the Google Sheets REST API.',
    };
  }
}

export const sequenceSafetyService = SequenceSafetyService.getInstance();
