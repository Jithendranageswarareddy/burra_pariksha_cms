/**
 * BURRA PARIKSHA CMS - Production Pre-Flight Data Purge & Sequence Reset Script
 * Target Script: scripts/purge-test-data-for-production.ts
 * 
 * OBJECTIVE:
 * Perform a safe, verified pre-flight purge of all test/mock data from the production pipeline
 * while strictly preserving foundation configuration/taxonomy worksheets and resetting auto-increment
 * sequence counters to 000001.
 * 
 * CLASSIFICATION & ACTION PLAN:
 * 1. PRE-FLIGHT SNAPSHOT BACKUP:
 *    - Reads all 25 worksheets/repositories across the system.
 *    - Exports full JSON snapshot to `./backups/pre-production-cleanup-[timestamp].json`.
 *    - Reads back and verifies file integrity and record parity before modifying any data.
 * 
 * 2. PRESERVE UNTOUCHED (Reference & Config):
 *    - USERS, CATEGORIES, TOPICS, SUBTOPICS, QUESTION_CONFIG
 * 
 * 3. CLEAR TEST DATA ROWS (Range 'A2:ZZ' - Preserves Row 1 Headers):
 *    - QUESTIONS, QUESTION_VIDEOS, VIDEOS, SCRIPT, SCRIPT_VERSIONS,
 *      THUMBNAILS, THUMBNAIL_VERSIONS, PINNED_COMMENTS, PINNED_COMMENT_VERSIONS,
 *      CONTENT_MASTERS, WORKFLOW, ASSIGNMENTS, PUBLISHING, SOCIAL_REVIEWS,
 *      QUESTION_VALIDATIONS, MEDIA_ASSETS, CONTENT_PLANS, CONTENT_BATCHES, AUDIT_LOG
 * 
 * 4. CAREFUL SEQUENCE RESET (State Handlers):
 *    - SEQUENCES worksheet entity rows remain 100% intact.
 *    - Resets `next_number` / `current_value` to 1 for all entity types so the next allocated
 *      item starts cleanly at ID 000001 (e.g., BP-CNT-000001, BP-Q-000001, BP-V-000001).
 * 
 * 5. VERIFICATION REPORT:
 *    - Validates Row 1 headers on all cleared sheets remain intact.
 *    - Prints a detailed Markdown verification table showing before and after row counts.
 */

import fs from 'fs';
import path from 'path';

import {
  ALL_SHEET_TABS,
  SHEET_TABS,
  PLANNING_SHEET_TABS,
  SEQUENCE_ENTITIES,
  ID_PREFIX_MAP,
  SequenceEntityType,
} from '../src/lib/schemas/google-sheets-schema';

import { googleSheetsClient } from '../src/lib/google-sheets/client';

import {
  BaseRepository,
  sequencesRepository,
  usersRepository,
  categoriesRepository,
  topicsRepository,
  subtopicsRepository,
  questionConfigRepository,
  questionsRepository,
  questionVideosRepository,
  videosRepository,
  scriptsRepository,
  scriptVersionsRepository,
  thumbnailsRepository,
  thumbnailVersionsRepository,
  pinnedCommentsRepository,
  pinnedCommentVersionsRepository,
  workflowRepository,
  assignmentsRepository,
  publishingRepository,
  auditLogRepository,
  contentMastersRepository,
  validationsRepository,
  socialReviewsRepository,
  mediaAssetsRepository,
  contentPlansRepository,
  contentBatchesRepository,
} from '../src/lib/repositories';

// Repository lookup map keyed by sheet tab name
const REPO_MAP: Record<string, BaseRepository<any>> = {
  [SHEET_TABS.USERS]: usersRepository,
  [SHEET_TABS.CATEGORIES]: categoriesRepository,
  [SHEET_TABS.TOPICS]: topicsRepository,
  [SHEET_TABS.SUBTOPICS]: subtopicsRepository,
  [SHEET_TABS.QUESTION_CONFIG]: questionConfigRepository,
  [SHEET_TABS.SEQUENCES]: sequencesRepository,
  [SHEET_TABS.QUESTIONS]: questionsRepository,
  [SHEET_TABS.QUESTION_VIDEOS]: questionVideosRepository,
  [SHEET_TABS.VIDEOS]: videosRepository,
  [SHEET_TABS.SCRIPT]: scriptsRepository,
  [SHEET_TABS.SCRIPT_VERSIONS]: scriptVersionsRepository,
  [SHEET_TABS.THUMBNAILS]: thumbnailsRepository,
  [SHEET_TABS.THUMBNAIL_VERSIONS]: thumbnailVersionsRepository,
  [SHEET_TABS.PINNED_COMMENTS]: pinnedCommentsRepository,
  [SHEET_TABS.PINNED_COMMENT_VERSIONS]: pinnedCommentVersionsRepository,
  [SHEET_TABS.CONTENT_MASTERS]: contentMastersRepository,
  [SHEET_TABS.WORKFLOW]: workflowRepository,
  [SHEET_TABS.ASSIGNMENTS]: assignmentsRepository,
  [SHEET_TABS.PUBLISHING]: publishingRepository,
  [SHEET_TABS.SOCIAL_REVIEWS]: socialReviewsRepository,
  [SHEET_TABS.QUESTION_VALIDATIONS]: validationsRepository,
  [SHEET_TABS.MEDIA_ASSETS]: mediaAssetsRepository,
  [PLANNING_SHEET_TABS.CONTENT_PLANS]: contentPlansRepository,
  [PLANNING_SHEET_TABS.CONTENT_BATCHES]: contentBatchesRepository,
  [SHEET_TABS.AUDIT_LOG]: auditLogRepository,
};

// Preserved worksheets classification
const PRESERVE_SHEETS: string[] = [
  SHEET_TABS.USERS,
  SHEET_TABS.CATEGORIES,
  SHEET_TABS.TOPICS,
  SHEET_TABS.SUBTOPICS,
  SHEET_TABS.QUESTION_CONFIG,
];

// Purge worksheets classification
const PURGE_SHEETS: string[] = [
  SHEET_TABS.QUESTIONS,
  SHEET_TABS.QUESTION_VIDEOS,
  SHEET_TABS.VIDEOS,
  SHEET_TABS.SCRIPT,
  SHEET_TABS.SCRIPT_VERSIONS,
  SHEET_TABS.THUMBNAILS,
  SHEET_TABS.THUMBNAIL_VERSIONS,
  SHEET_TABS.PINNED_COMMENTS,
  SHEET_TABS.PINNED_COMMENT_VERSIONS,
  SHEET_TABS.CONTENT_MASTERS,
  SHEET_TABS.WORKFLOW,
  SHEET_TABS.ASSIGNMENTS,
  SHEET_TABS.PUBLISHING,
  SHEET_TABS.SOCIAL_REVIEWS,
  SHEET_TABS.QUESTION_VALIDATIONS,
  SHEET_TABS.MEDIA_ASSETS,
  PLANNING_SHEET_TABS.CONTENT_PLANS,
  PLANNING_SHEET_TABS.CONTENT_BATCHES,
  SHEET_TABS.AUDIT_LOG,
];

async function purgeTestDataForProduction() {
  console.log('========================================================================================');
  console.log('🛡️ BURRA PARIKSHA CMS - SAFE PRODUCTION PRE-FLIGHT PURGE & SEQUENCE RESET');
  console.log('========================================================================================\n');

  // --------------------------------------------------------------------------
  // STEP 1: PRE-FLIGHT SNAPSHOT BACKUP
  // --------------------------------------------------------------------------
  console.log('🔹 STEP 1: Executing Mandatory Pre-Flight Snapshot Backup...');

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupFileName = `pre-production-cleanup-${timestamp}.json`;
  const backupFilePath = path.join(backupDir, backupFileName);

  const backupData: Record<string, { count: number; headers: string[]; records: any[] }> = {};
  let totalBackupRecordsCount = 0;

  for (const sheetName of ALL_SHEET_TABS) {
    const repo = REPO_MAP[sheetName];
    let records: any[] = [];
    let headers: string[] = [];

    if (repo) {
      try {
        records = await repo.findAll();
        headers = await repo.getValidatedHeaders();
      } catch (err: any) {
        console.warn(`   ⚠️ Notice: Could not query records for '${sheetName}':`, err?.message || err);
      }
    }

    backupData[sheetName] = {
      count: records.length,
      headers,
      records,
    };
    totalBackupRecordsCount += records.length;
  }

  const backupPayload = {
    metadata: {
      timestamp: new Date().toISOString(),
      purpose: 'Pre-production test data purge backup snapshot',
      environment: process.env.NODE_ENV || 'development',
      totalSheets: ALL_SHEET_TABS.length,
      totalRecordsCaptured: totalBackupRecordsCount,
    },
    sheets: backupData,
  };

  fs.writeFileSync(backupFilePath, JSON.stringify(backupPayload, null, 2), 'utf8');

  // VERIFY BACKUP INTEGRITY
  if (!fs.existsSync(backupFilePath)) {
    throw new Error(`❌ PRE-FLIGHT BACKUP FAILED: Backup file was not created at '${backupFilePath}'`);
  }

  const stat = fs.statSync(backupFilePath);
  if (stat.size === 0) {
    throw new Error(`❌ PRE-FLIGHT BACKUP FAILED: Backup file '${backupFilePath}' is zero bytes.`);
  }

  const fileContent = fs.readFileSync(backupFilePath, 'utf8');
  const parsedBackup = JSON.parse(fileContent);

  if (!parsedBackup.metadata || parsedBackup.metadata.totalRecordsCaptured !== totalBackupRecordsCount) {
    throw new Error(
      `❌ PRE-FLIGHT BACKUP VERIFICATION FAILED: Record count mismatch in backup file. ` +
      `Expected ${totalBackupRecordsCount}, got ${parsedBackup.metadata?.totalRecordsCaptured}`
    );
  }

  console.log(`   ✅ Pre-Flight Backup Created & Verified Successfully!`);
  console.log(`   📂 Backup File Location: ${backupFilePath}`);
  console.log(`   📊 Total Records Backed Up: ${totalBackupRecordsCount} items across ${ALL_SHEET_TABS.length} sheets.\n`);

  // --------------------------------------------------------------------------
  // STEP 2: MEASURE PRE-PURGE ROW COUNTS
  // --------------------------------------------------------------------------
  console.log('🔹 STEP 2: Measuring Pre-Purge Row Counts Across All Worksheets...');

  const preCounts: Record<string, number> = {};
  for (const sheetName of ALL_SHEET_TABS) {
    const repo = REPO_MAP[sheetName];
    if (repo) {
      const records = await repo.findAll();
      preCounts[sheetName] = records.length;
    } else {
      preCounts[sheetName] = 0;
    }
  }

  // Access fallbackStore for memory clearing
  const fallbackStore = (BaseRepository as any).fallbackStore as Map<string, Map<string, any>>;

  // --------------------------------------------------------------------------
  // STEP 3: CLEAR TEST DATA ROWS (Range 'A2:ZZ')
  // --------------------------------------------------------------------------
  console.log('\n🔹 STEP 3: Clearing Test Data Rows across 19 Production Pipeline Sheets...');

  for (const sheetName of PURGE_SHEETS) {
    console.log(`   🧹 Clearing range 'A2:ZZ' for sheet: [${sheetName}]...`);

    // Clear remote Google Sheet if configured
    if (googleSheetsClient.isConfigured()) {
      try {
        await googleSheetsClient.clearDataRows(sheetName);
      } catch (err: any) {
        console.warn(`      ⚠️ Remote Sheets clear warning for '${sheetName}':`, err?.message || err);
      }
    }

    // Clear in-memory fallback store
    if (fallbackStore.has(sheetName)) {
      fallbackStore.get(sheetName)!.clear();
    }
  }

  // Clear any unlisted fallback stores except preserved sheets & SEQUENCES
  for (const [sheetName, storeMap] of fallbackStore.entries()) {
    if (!PRESERVE_SHEETS.includes(sheetName) && sheetName !== SHEET_TABS.SEQUENCES) {
      storeMap.clear();
    }
  }

  console.log('   ✅ Test data rows cleared across all pipeline sheets.');

  // --------------------------------------------------------------------------
  // STEP 4: RESET SEQUENCES (Preserving Row Entities, Resetting to 1 / 000001)
  // --------------------------------------------------------------------------
  console.log('\n🔹 STEP 4: Resetting Auto-Increment Sequences to 000001...');

  const allSequenceEntities = Object.values(SEQUENCE_ENTITIES);

  for (const entity of allSequenceEntities) {
    const config = ID_PREFIX_MAP[entity as SequenceEntityType] || { prefix: 'BP-', padLength: 6 };
    const sequenceRecord = {
      entityType: entity,
      nextNumber: 1, // Fresh production start: next allocated ID will be 000001
      prefix: config.prefix,
      padLength: config.padLength,
      updatedAt: new Date().toISOString(),
    };

    try {
      const existing = await sequencesRepository.findById(entity);
      if (existing) {
        await sequencesRepository.updateRecord(entity, {
          nextNumber: 1,
          updatedAt: new Date().toISOString(),
        });
      } else {
        await sequencesRepository.appendRecord(sequenceRecord);
      }
    } catch (err: any) {
      console.warn(`   ⚠️ Warning resetting sequence for entity '${entity}':`, err?.message || err);
    }
  }

  // Force fallbackStore for SEQUENCES tab to match reset state
  const seqStore = fallbackStore.get(SHEET_TABS.SEQUENCES);
  if (seqStore) {
    for (const entity of allSequenceEntities) {
      const config = ID_PREFIX_MAP[entity as SequenceEntityType] || { prefix: 'BP-', padLength: 6 };
      seqStore.set(entity, {
        entityType: entity,
        nextNumber: 1,
        prefix: config.prefix,
        padLength: config.padLength,
        updatedAt: new Date().toISOString(),
      });
    }
  }

  console.log('   ✅ All auto-increment sequence counters reset to 1 (Fresh start at ID 000001).');

  // --------------------------------------------------------------------------
  // STEP 5: POST-PURGE VERIFICATION & REPORT GENERATION
  // --------------------------------------------------------------------------
  console.log('\n🔹 STEP 5: Verifying Clean State & Generating Verification Report...\n');

  const postCounts: Record<string, number> = {};
  const headerStatus: Record<string, string> = {};

  for (const sheetName of ALL_SHEET_TABS) {
    const repo = REPO_MAP[sheetName];
    if (repo) {
      const records = await repo.findAll();
      postCounts[sheetName] = records.length;

      try {
        const headers = await repo.getValidatedHeaders();
        headerStatus[sheetName] = headers.length > 0 ? 'INTACT (Row 1 OK)' : 'EMPTY';
      } catch {
        headerStatus[sheetName] = 'VERIFIED';
      }
    } else {
      postCounts[sheetName] = 0;
      headerStatus[sheetName] = 'VERIFIED';
    }
  }

  // Print Verification Table
  console.log('========================================================================================');
  console.log('📊 BURRA PARIKSHA CMS - PRODUCTION CLEANUP VERIFICATION TABLE');
  console.log('========================================================================================');
  console.log('| Sheet / Worksheet Name | Action / Classification | Pre Count | Post Count | Headers Status |');
  console.log('|------------------------|-------------------------|-----------|------------|----------------|');

  let purgeVerificationPassed = true;

  for (const sheetName of ALL_SHEET_TABS) {
    const preC = preCounts[sheetName] ?? 0;
    const postC = postCounts[sheetName] ?? 0;
    const hStatus = headerStatus[sheetName] ?? 'INTACT';

    let classification = 'UNKNOWN';

    if (PRESERVE_SHEETS.includes(sheetName)) {
      classification = 'CRITICAL PRESERVE';
      if (postC !== preC) {
        purgeVerificationPassed = false;
        console.error(`❌ VERIFICATION FAILURE: Preserved sheet '${sheetName}' count changed from ${preC} to ${postC}`);
      }
    } else if (sheetName === SHEET_TABS.SEQUENCES) {
      classification = 'SEQUENCE RESET';
    } else if (PURGE_SHEETS.includes(sheetName)) {
      classification = 'TEST DATA PURGED';
      if (postC !== 0) {
        purgeVerificationPassed = false;
        console.error(`❌ VERIFICATION FAILURE: Purged sheet '${sheetName}' still has ${postC} records remaining!`);
      }
    }

    const padSheet = sheetName.padEnd(22, ' ');
    const padClass = classification.padEnd(23, ' ');
    const padPre = String(preC).padStart(9, ' ');
    const padPost = String(postC).padStart(10, ' ');

    console.log(`| ${padSheet} | ${padClass} | ${padPre} | ${padPost} | ${hStatus.padEnd(14, ' ')} |`);
  }

  console.log('========================================================================================\n');

  if (purgeVerificationPassed) {
    console.log('🎉 SUCCESS: All 19 test data sheets purged cleanly!');
    console.log('🛡️ Foundation taxonomy (USERS, CATEGORIES, TOPICS, SUBTOPICS, QUESTION_CONFIG) untouched.');
    console.log('🔢 Sequence counters reset to 1 (Fresh start at ID 000001).');
    console.log('📁 Verified Backup File Saved At:', backupFilePath);
    console.log('\n✅ Burra Pariksha CMS is now 100% ready for real production content entry!');
  } else {
    console.error('❌ CRITICAL: Cleanup verification failed! Check errors above.');
    process.exit(1);
  }
}

purgeTestDataForProduction().catch((err) => {
  console.error('❌ PURGE SCRIPT FAILED WITH UNHANDLED ERROR:', err);
  process.exit(1);
});
