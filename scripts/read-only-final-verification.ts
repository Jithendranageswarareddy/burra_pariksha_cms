import {
  sequencesRepository,
  contentMastersRepository,
  questionsRepository,
  videosRepository,
  mediaAssetsRepository,
  scriptsRepository,
  scriptVersionsRepository,
  thumbnailsRepository,
  thumbnailVersionsRepository,
  pinnedCommentsRepository,
  pinnedCommentVersionsRepository,
  workflowRepository,
  assignmentsRepository,
  publishingRepository,
  socialReviewsRepository,
  validationsRepository,
  auditLogRepository,
} from '../src/lib/repositories';
import { sequenceSafetyService } from '../src/lib/services/sequence-safety.service';
import { dataIntegrityService } from '../src/lib/services/data-integrity.service';
import { googleDriveService } from '../src/lib/services/google-drive.service';
import { ID_PREFIX_MAP, SequenceEntityType } from '../src/lib/schemas/google-sheets-schema';

async function runReadOnlyVerification() {
  console.log('=== BURRA PARIKSHA CMS: READ-ONLY FINAL VERIFICATION ===\n');

  // 1. Verify SEQUENCES
  console.log('--- 1. SEQUENCES Worksheet Check ---');
  const targetEntities = [
    'CONTENT_MASTER',
    'QUESTION',
    'VIDEO',
    'SCRIPT',
    'THUMBNAIL',
    'PINNED_COMMENT',
    'ASSIGNMENT',
    'SOCIAL_REVIEW',
  ];

  const sequencesState: Record<string, number | null> = {};
  for (const entity of targetEntities) {
    const record = await sequencesRepository.getSequence(entity);
    sequencesState[entity] = record ? Number(record.nextNumber) : null;
    console.log(`  ${entity}: next_number = ${sequencesState[entity]}`);
  }

  // 2. Verify Active Production Records
  console.log('\n--- 2. Active Production Records Check ---');
  const activeCounts: Record<string, number> = {
    CONTENT_MASTERS: (await contentMastersRepository.findAll()).length,
    QUESTIONS: (await questionsRepository.findAll()).length,
    VIDEOS: (await videosRepository.findAll()).length,
    MEDIA_ASSETS: (await mediaAssetsRepository.findAll()).length,
    SCRIPTS: (await scriptsRepository.findAll()).length,
    SCRIPT_VERSIONS: (await scriptVersionsRepository.findAll()).length,
    THUMBNAILS: (await thumbnailsRepository.findAll()).length,
    THUMBNAIL_VERSIONS: (await thumbnailVersionsRepository.findAll()).length,
    PINNED_COMMENTS: (await pinnedCommentsRepository.findAll()).length,
    PINNED_COMMENT_VERSIONS: (await pinnedCommentVersionsRepository.findAll()).length,
    WORKFLOW: (await workflowRepository.findAll()).length,
    ASSIGNMENTS: (await assignmentsRepository.findAll()).length,
    PUBLISHING: (await publishingRepository.findAll()).length,
    SOCIAL_REVIEWS: (await socialReviewsRepository.findAll()).length,
    QUESTION_VALIDATIONS: (await validationsRepository.findAll()).length,
  };

  let totalActive = 0;
  for (const [entity, count] of Object.entries(activeCounts)) {
    console.log(`  ${entity}: ${count} active records`);
    totalActive += count;
  }
  console.log(`  TOTAL Active Production Records: ${totalActive}`);

  // 3. Verify Canonical ID Integrity
  console.log('\n--- 3. Canonical ID Integrity Check ---');
  const targetIDs = [
    'BP-CNT-000001',
    'BP-Q-000001',
    'BP-V-000001',
    'BP-S-000001',
    'BP-T-000001',
    'BP-PIN-000001',
    'BP-ASN-000001',
    'BP-REV-000001',
  ];

  const conflictingRecords: Array<{ id: string; entity: string }> = [];

  const checkCollection = (items: any[], idField: string, entityName: string) => {
    for (const item of items) {
      if (item && targetIDs.includes(item[idField])) {
        conflictingRecords.push({ id: item[idField], entity: entityName });
      }
    }
  };

  checkCollection(await contentMastersRepository.findAll(), 'id', 'CONTENT_MASTERS');
  checkCollection(await questionsRepository.findAll(), 'id', 'QUESTIONS');
  checkCollection(await videosRepository.findAll(), 'id', 'VIDEOS');
  checkCollection(await mediaAssetsRepository.findAll(), 'id', 'MEDIA_ASSETS');
  checkCollection(await scriptsRepository.findAll(), 'id', 'SCRIPTS');
  checkCollection(await scriptVersionsRepository.findAll(), 'id', 'SCRIPT_VERSIONS');
  checkCollection(await thumbnailsRepository.findAll(), 'id', 'THUMBNAILS');
  checkCollection(await thumbnailVersionsRepository.findAll(), 'id', 'THUMBNAIL_VERSIONS');
  checkCollection(await pinnedCommentsRepository.findAll(), 'id', 'PINNED_COMMENTS');
  checkCollection(await pinnedCommentVersionsRepository.findAll(), 'id', 'PINNED_COMMENT_VERSIONS');
  checkCollection(await workflowRepository.findAll(), 'id', 'WORKFLOW');
  checkCollection(await assignmentsRepository.findAll(), 'id', 'ASSIGNMENTS');
  checkCollection(await publishingRepository.findAll(), 'id', 'PUBLISHING');
  checkCollection(await socialReviewsRepository.findAll(), 'id', 'SOCIAL_REVIEWS');
  checkCollection(await validationsRepository.findAll(), 'id', 'QUESTION_VALIDATIONS');

  console.log(`  Conflicting Active Records for baseline IDs: ${conflictingRecords.length}`);
  if (conflictingRecords.length > 0) {
    conflictingRecords.forEach((c) => console.log(`    CONFLICT: ${c.id} in ${c.entity}`));
  }

  // 4. Verify Google Drive
  console.log('\n--- 4. Google Drive Verification ---');
  let driveAssetsFound = 0;
  try {
    const driveItems = await googleDriveService.listContentFoldersAndFiles('BP-CNT-000001');
    driveAssetsFound = driveItems.length;
    console.log(`  Production Drive Folders/Files for BP-CNT-000001: ${driveAssetsFound}`);
  } catch (err: any) {
    console.log(`  Drive check skipped or offline: ${err?.message || err}`);
  }

  // 5. Verify Audit History
  console.log('\n--- 5. Audit History Check ---');
  const allLogs = await auditLogRepository.findAll();
  const historicalRefs = allLogs.filter((log) => {
    const str = JSON.stringify(log);
    return targetIDs.some((id) => str.includes(id));
  });
  console.log(`  Immutable Audit Log Records: ${allLogs.length}`);
  console.log(`  Historical references to baseline IDs in AUDIT_LOG: ${historicalRefs.length}`);

  // 6. Verify Sequence Diagnostics
  console.log('\n--- 6. Sequence Safety Diagnostics ---');
  const seqSafetyReport = await sequenceSafetyService.auditSequences();
  console.log(`  Overall Status: ${seqSafetyReport.overallStatus}`);
  console.log(`  Total Anomalies: ${seqSafetyReport.anomalies.length}`);

  // 7. Verify General Data Integrity Service
  console.log('\n--- 7. Data Integrity Service Diagnostics ---');
  const integrityReport = await dataIntegrityService.runFullIntegrityCheck();
  console.log(`  Overall Status: ${integrityReport.overallStatus}`);
  console.log(`  Total Issues (issueCounts.total): ${integrityReport.issueCounts.total}`);
  console.log(`  Critical Issues: ${integrityReport.issueCounts.critical}`);
  console.log(`  Error Issues: ${integrityReport.issueCounts.error}`);
  console.log(`  Warning Issues: ${integrityReport.issueCounts.warning}`);
  console.log(`  Passed Checks: ${integrityReport.issueCounts.passedChecks}`);

  // 8. Allocation Semantics
  console.log('\n--- 8. Allocation Semantics Check ---');
  for (const entity of targetEntities) {
    const config = ID_PREFIX_MAP[entity as SequenceEntityType] || { prefix: 'BP-', padLength: 6 };
    const seq = sequencesState[entity] || 1;
    const formatted = `${config.prefix}${String(seq).padStart(config.padLength, '0')}`;
    console.log(`  ${entity}: next_number=${seq} => Formatted ID = ${formatted}`);
  }
}

runReadOnlyVerification().catch((err) => {
  console.error('Error during verification:', err);
  process.exit(1);
});
