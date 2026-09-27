/**
 * BURRA PARIKSHA CMS — Sequence Reset Audit & Execution Script
 * 
 * Safely audits and resets canonical production sequence counters in SEQUENCES sheet tab.
 * Enforces strict safety checks:
 *  - Only resets sequences where active canonical production records = 0
 *  - Does NOT alter audit history, users, categories, topics, subtopics, or non-production sequences
 *  - Verifies exact canonical ID patterns (^BP-XXX-\d{N}$)
 *  - Performs a complete dry-run first
 */

import { sequencesRepository } from '../src/lib/repositories/sequences.repository';
import {
  questionsRepository,
  videosRepository,
  scriptsRepository,
  thumbnailsRepository,
  pinnedCommentsRepository,
  contentMastersRepository,
  assignmentsRepository,
  socialReviewsRepository,
  contentPlansRepository,
  contentBatchesRepository,
  categoriesRepository,
  topicsRepository,
  subtopicsRepository,
  usersRepository,
  analyticsRepository,
  intelligenceRepository,
  socialCommentsRepository,
  commentIntelligenceRepository,
} from '../src/lib/repositories';
import { sequenceSafetyService } from '../src/lib/services/sequence-safety.service';
import { dataIntegrityService } from '../src/lib/services/data-integrity.service';
import { ID_PREFIX_MAP, SEQUENCE_ENTITIES, SequenceEntityType } from '../src/lib/schemas/google-sheets-schema';

interface SequenceAuditRow {
  entityType: string;
  prefix: string;
  padLength: number;
  currentNextNumber: number | null;
  activeRecordCount: number;
  canonicalActiveRecordCount: number;
  highestActiveCanonicalId: string;
  highestActiveCanonicalNumber: number;
  proposedNextNumber: number;
  firstGeneratedId: string;
  isProductionEntity: boolean;
  safeToReset: boolean;
  reason: string;
}

export async function runSequenceAudit(executeReset = false) {
  console.log('========================================================================');
  console.log(`BP-CMS SEQUENCE AUDIT & ${executeReset ? 'EXECUTION' : 'DRY-RUN'} REPORT`);
  console.log('========================================================================\n');

  const entities = Object.values(SEQUENCE_ENTITIES) as SequenceEntityType[];
  const auditTable: SequenceAuditRow[] = [];

  // Production entities intended for stage 1 fresh test sequence reset
  const PRODUCTION_RESET_ENTITIES = new Set([
    SEQUENCE_ENTITIES.CONTENT_MASTER,
    SEQUENCE_ENTITIES.QUESTION,
    SEQUENCE_ENTITIES.VIDEO,
    SEQUENCE_ENTITIES.SCRIPT,
    SEQUENCE_ENTITIES.THUMBNAIL,
    SEQUENCE_ENTITIES.PINNED_COMMENT,
    SEQUENCE_ENTITIES.ASSIGNMENT,
    SEQUENCE_ENTITIES.SOCIAL_REVIEW,
  ]);

  for (const entityType of entities) {
    const config = ID_PREFIX_MAP[entityType] || { prefix: 'BP-', padLength: 6 };
    const prefix = config.prefix;
    const padLength = config.padLength;
    const isProdEntity = PRODUCTION_RESET_ENTITIES.has(entityType);

    // Get current record from SEQUENCES tab
    const seqRecord = await sequencesRepository.getSequence(entityType);
    const currentNextNumber = seqRecord ? Number(seqRecord.nextNumber) : null;

    // Fetch active records from repository
    let activeRecords: any[] = [];
    try {
      switch (entityType) {
        case SEQUENCE_ENTITIES.CONTENT_MASTER:
          activeRecords = await contentMastersRepository.findAll();
          break;
        case SEQUENCE_ENTITIES.QUESTION:
          activeRecords = await questionsRepository.findAll();
          break;
        case SEQUENCE_ENTITIES.VIDEO:
          activeRecords = await videosRepository.findAll();
          break;
        case SEQUENCE_ENTITIES.SCRIPT:
          activeRecords = await scriptsRepository.findAll();
          break;
        case SEQUENCE_ENTITIES.THUMBNAIL:
          activeRecords = await thumbnailsRepository.findAll();
          break;
        case SEQUENCE_ENTITIES.PINNED_COMMENT:
          activeRecords = await pinnedCommentsRepository.findAll();
          break;
        case SEQUENCE_ENTITIES.ASSIGNMENT:
          activeRecords = await assignmentsRepository.findAll();
          break;
        case SEQUENCE_ENTITIES.SOCIAL_REVIEW:
          activeRecords = await socialReviewsRepository.findAll();
          break;
        case SEQUENCE_ENTITIES.CONTENT_PLAN:
          activeRecords = await contentPlansRepository.findAll();
          break;
        case SEQUENCE_ENTITIES.CONTENT_BATCH:
          activeRecords = await contentBatchesRepository.findAll();
          break;
        case SEQUENCE_ENTITIES.CATEGORY:
          activeRecords = await categoriesRepository.findAll();
          break;
        case SEQUENCE_ENTITIES.TOPIC:
          activeRecords = await topicsRepository.findAll();
          break;
        case SEQUENCE_ENTITIES.SUBTOPIC:
          activeRecords = await subtopicsRepository.findAll();
          break;
        case SEQUENCE_ENTITIES.USER:
          activeRecords = await usersRepository.findAll();
          break;
        case SEQUENCE_ENTITIES.SOCIAL_ANALYTICS:
          activeRecords = await analyticsRepository.findAll();
          break;
        case SEQUENCE_ENTITIES.SOCIAL_PERFORMANCE_INTELLIGENCE:
          activeRecords = await intelligenceRepository.findAll();
          break;
        case SEQUENCE_ENTITIES.SOCIAL_COMMENT:
          activeRecords = await socialCommentsRepository.findAll();
          break;
        case SEQUENCE_ENTITIES.COMMENT_INTELLIGENCE:
          activeRecords = await commentIntelligenceRepository.findAll();
          break;
      }
    } catch {
      activeRecords = [];
    }

    const activeRecordCount = activeRecords.length;

    // Filter canonical IDs using strict regex: ^<escapedPrefix>(\d{padLength})$
    const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const canonicalRegex = new RegExp(`^${escapedPrefix}(\\d{${padLength}})$`);

    let maxCanonicalNum = 0;
    let canonicalCount = 0;

    for (const rec of activeRecords) {
      if (!rec) continue;
      const id = rec.id || rec.contentId || rec.contentMasterId;
      if (!id || typeof id !== 'string') continue;

      const match = id.match(canonicalRegex);
      if (match) {
        canonicalCount++;
        const num = parseInt(match[1], 10);
        if (num > maxCanonicalNum) {
          maxCanonicalNum = num;
        }
      }
    }

    const highestActiveCanonicalId = maxCanonicalNum > 0
      ? `${prefix}${String(maxCanonicalNum).padStart(padLength, '0')}`
      : 'none';

    let safeToReset = false;
    let reason = '';
    let proposedNextNumber = currentNextNumber ?? 1;

    if (!isProdEntity) {
      safeToReset = false;
      reason = 'Taxonomy / User / System sequence — non-production scope, skip reset.';
    } else if (canonicalCount > 0) {
      safeToReset = false;
      reason = `Active canonical records exist (${canonicalCount} records, highest ${highestActiveCanonicalId}). Cannot reset to 1.`;
    } else if (activeRecordCount > 0 && canonicalCount === 0) {
      safeToReset = false;
      reason = `Non-canonical active records exist (${activeRecordCount} total). Safety precaution prevents reset.`;
    } else {
      safeToReset = true;
      proposedNextNumber = 1;
      reason = '0 active production records. Safe for Stage 1 fresh test sequence reset to 1.';
    }

    const firstGeneratedId = `${prefix}${String(proposedNextNumber).padStart(padLength, '0')}`;

    auditTable.push({
      entityType,
      prefix,
      padLength,
      currentNextNumber,
      activeRecordCount,
      canonicalActiveRecordCount: canonicalCount,
      highestActiveCanonicalId,
      highestActiveCanonicalNumber: maxCanonicalNum,
      proposedNextNumber,
      firstGeneratedId,
      isProductionEntity: isProdEntity,
      safeToReset,
      reason,
    });
  }

  console.table(
    auditTable.map((row) => ({
      Sequence: row.entityType,
      Prefix: row.prefix,
      Padding: row.padLength,
      Current: row.currentNextNumber,
      ActiveRecs: row.activeRecordCount,
      HighestActiveID: row.highestActiveCanonicalId,
      ProposedNext: row.proposedNextNumber,
      FirstGenID: row.firstGeneratedId,
      SafeToReset: row.safeToReset ? 'YES' : 'NO',
      Reason: row.reason,
    }))
  );

  const resetCandidates = auditTable.filter((r) => r.safeToReset);
  console.log(`\nFound ${resetCandidates.length} production sequences safe for reset to 1.`);

  if (executeReset) {
    console.log('\n========================================================================');
    console.log('EXECUTING SAFE SEQUENCE RESET');
    console.log('========================================================================');

    for (const row of resetCandidates) {
      console.log(`\nResetting sequence for "${row.entityType}"...`);
      console.log(`  Prefix: ${row.prefix}, PadLength: ${row.padLength}`);
      console.log(`  Before: nextNumber = ${row.currentNextNumber}`);

      // Reset sequence nextNumber to 1
      await sequencesRepository.updateRecord(row.entityType, {
        nextNumber: 1,
        prefix: row.prefix,
        padLength: row.padLength,
        updatedAt: new Date().toISOString(),
      });

      const updated = await sequencesRepository.getSequence(row.entityType);
      console.log(`  After:  nextNumber = ${updated?.nextNumber}`);
      console.log(`  First expected generated ID: ${row.firstGeneratedId}`);
    }

    console.log('\n========================================================================');
    console.log('RUNNING POST-RESET SAFETY & DATA INTEGRITY DIAGNOSTICS');
    console.log('========================================================================');

    const safetyReport = await sequenceSafetyService.auditSequences();
    console.log(`\nSequence Safety Report Status: ${safetyReport.overallStatus}`);
    console.log(`Total Checked: ${safetyReport.totalChecked}, Healthy: ${safetyReport.healthyCount}, Anomalies: ${safetyReport.anomalyCount}`);

    if (safetyReport.anomalies.length > 0) {
      console.log('\nSequence Anomalies Detected:');
      console.table(
        safetyReport.anomalies.map((a) => ({
          Severity: a.severity,
          Entity: a.entityType,
          Anomaly: a.anomalyType,
          NextNumber: a.currentNextNumber,
          MaxAllocated: a.detectedMaxAllocatedId,
          Message: a.message,
        }))
      );
    }

    const integrityReport = await dataIntegrityService.runFullIntegrityCheck();
    console.log(`\nSystem Data Integrity Check Status: ${integrityReport.systemStatus}`);
    console.log(`Total Issues: ${integrityReport.totalIssuesCount}`);

    const seqIssues = integrityReport.issues.filter((i) => i.category === 'SEQUENCE_INTEGRITY');
    if (seqIssues.length > 0) {
      console.log('\nSequence Integrity Diagnostic Issues:');
      console.table(
        seqIssues.map((i) => ({
          Severity: i.severity,
          Worksheet: i.worksheet,
          Entity: i.entityType,
          Message: i.message,
        }))
      );
    } else {
      console.log('Zero sequence integrity issues reported by Data Integrity Service!');
    }
  }

  return auditTable;
}

const executeFlag = process.argv.includes('--execute');
runSequenceAudit(executeFlag)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Sequence audit failed:', err);
    process.exit(1);
  });
