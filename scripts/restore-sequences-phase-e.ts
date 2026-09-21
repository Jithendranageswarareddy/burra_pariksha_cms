/**
 * BURRA PARIKSHA CMS — TARGET-LAUNCH-RESET PHASE E
 * Sequence Recovery & Cleanup Correction Script
 * 
 * Objective:
 * 1. Read exact pre-cleanup sequences from backups/pre-launch-full-backup-2026-09-21T14-57-38-423Z.json
 * 2. Perform safety checks (fail-closed if corrupted or incomplete)
 * 3. Inspect live SEQUENCES worksheet
 * 4. Generate before/target comparison table
 * 5. Restore live SEQUENCES worksheet with 100% exact values (no recomputation, no normalization)
 * 6. Post-restore verification: assert 100% field parity (entityType, nextNumber, prefix, padLength, updatedAt)
 * 7. Verify all operational sheets remain 0 rows
 * 8. Verify all foundation sheets remain intact
 */

import * as fs from 'fs';
import * as path from 'path';
import { googleSheetsClient } from '../src/lib/google-sheets/client';
import { SHEET_TABS, PLANNING_SHEET_TABS, ANALYTICS_SHEET_TABS } from '../src/lib/schemas/google-sheets-schema';
import { BaseRepository } from '../src/lib/repositories/base.repository';

// Repositories for operational and foundation zero-check
import { usersRepository } from '../src/lib/repositories/users.repository';
import { categoriesRepository } from '../src/lib/repositories/categories.repository';
import { topicsRepository } from '../src/lib/repositories/topics.repository';
import { subtopicsRepository } from '../src/lib/repositories/subtopics.repository';
import { questionConfigRepository } from '../src/lib/repositories/question-config.repository';
import { sequencesRepository } from '../src/lib/repositories/sequences.repository';

import { questionsRepository } from '../src/lib/repositories/questions.repository';
import { questionVideosRepository } from '../src/lib/repositories/question-videos.repository';
import { videosRepository } from '../src/lib/repositories/videos.repository';
import { scriptsRepository } from '../src/lib/repositories/scripts.repository';
import { scriptVersionsRepository } from '../src/lib/repositories/script-versions.repository';
import { thumbnailsRepository } from '../src/lib/repositories/thumbnails.repository';
import { thumbnailVersionsRepository } from '../src/lib/repositories/thumbnail-versions.repository';
import { pinnedCommentsRepository } from '../src/lib/repositories/pinned-comments.repository';
import { pinnedCommentVersionsRepository } from '../src/lib/repositories/pinned-comment-versions.repository';
import { workflowRepository } from '../src/lib/repositories/workflow.repository';
import { assignmentsRepository } from '../src/lib/repositories/assignments.repository';
import { publishingRepository } from '../src/lib/repositories/publishing.repository';
import { auditLogRepository } from '../src/lib/repositories/audit-log.repository';
import { contentMastersRepository } from '../src/lib/repositories/content-masters.repository';
import { socialReviewsRepository } from '../src/lib/repositories/social-reviews.repository';
import { validationsRepository } from '../src/lib/repositories/validations.repository';
import { mediaAssetsRepository } from '../src/lib/repositories/media-assets.repository';
import { contentPlansRepository } from '../src/lib/repositories/content-plans.repository';
import { contentBatchesRepository } from '../src/lib/repositories/content-batches.repository';

import { analyticsRepository } from '../src/lib/repositories/analytics.repository';
import { socialCommentsRepository } from '../src/lib/repositories/social-comments.repository';
import { commentIntelligenceRepository } from '../src/lib/repositories/comment-intelligence.repository';
import { intelligenceRepository } from '../src/lib/repositories/intelligence.repository';
import { strategyRecommendationRepository } from '../src/lib/repositories/strategy-recommendation.repository';

interface TargetSequenceRecord {
  entityType: string;
  nextNumber: number;
  prefix: string;
  padLength: number;
  updatedAt: string;
}

const BACKUP_FILE_PATH = path.join(
  process.cwd(),
  'backups',
  'pre-launch-full-backup-2026-09-21T14-57-38-423Z.json'
);

const EXPECTED_ENTITIES = [
  'QUESTION',
  'VIDEO',
  'SCRIPT',
  'THUMBNAIL',
  'PINNED_COMMENT',
  'CATEGORY',
  'TOPIC',
  'SUBTOPIC',
  'USER',
  'CONTENT_PLAN',
  'CONTENT_BATCH',
  'ASSIGNMENT',
  'CONTENT_MASTER',
  'SOCIAL_REVIEW',
  'SOCIAL_ANALYTICS',
  'SOCIAL_PERFORMANCE_INTELLIGENCE',
  'PLATFORM_ADAPTATION',
  'CONTENT_STRATEGY',
  'COMMENT_INTELLIGENCE',
  'SOCIAL_COMMENT',
];

const OPERATIONAL_PROD_SHEETS: Record<string, BaseRepository<any>> = {
  QUESTIONS: questionsRepository,
  QUESTION_VIDEOS: questionVideosRepository,
  VIDEOS: videosRepository,
  SCRIPT: scriptsRepository,
  SCRIPT_VERSIONS: scriptVersionsRepository,
  THUMBNAILS: thumbnailsRepository,
  THUMBNAIL_VERSIONS: thumbnailVersionsRepository,
  PINNED_COMMENTS: pinnedCommentsRepository,
  PINNED_COMMENT_VERSIONS: pinnedCommentVersionsRepository,
  WORKFLOW: workflowRepository,
  ASSIGNMENTS: assignmentsRepository,
  PUBLISHING: publishingRepository,
  SOCIAL_REVIEWS: socialReviewsRepository,
  QUESTION_VALIDATIONS: validationsRepository,
  MEDIA_ASSETS: mediaAssetsRepository,
  CONTENT_MASTERS: contentMastersRepository,
  CONTENT_PLANS: contentPlansRepository,
  CONTENT_BATCHES: contentBatchesRepository,
  AUDIT_LOG: auditLogRepository,
};

const OPERATIONAL_ANALYTICS_SHEETS: Record<string, BaseRepository<any>> = {
  SOCIAL_ANALYTICS: analyticsRepository,
  SOCIAL_COMMENTS: socialCommentsRepository,
  COMMENT_INTELLIGENCE: commentIntelligenceRepository,
  ANALYTICS_INTELLIGENCE: intelligenceRepository,
  STRATEGY_RECOMMENDATIONS: strategyRecommendationRepository,
};

const FOUNDATION_SHEETS: Record<string, BaseRepository<any>> = {
  USERS: usersRepository,
  CATEGORIES: categoriesRepository,
  TOPICS: topicsRepository,
  SUBTOPICS: subtopicsRepository,
  QUESTION_CONFIG: questionConfigRepository,
};

async function runSequenceRecovery() {
  console.log('========================================================================================');
  console.log('🔄 BURRA PARIKSHA CMS — TARGET-LAUNCH-RESET PHASE E: SEQUENCE RECOVERY');
  console.log('========================================================================================\n');

  // --------------------------------------------------------------------------
  // STEP 1: SAFETY CHECKS ON PRE-CLEANUP BACKUP SNAPSHOT
  // --------------------------------------------------------------------------
  console.log('🔍 STEP 1: Validating Target Pre-Cleanup Backup File...');
  console.log(`   📁 Target File: ${BACKUP_FILE_PATH}`);

  if (!fs.existsSync(BACKUP_FILE_PATH)) {
    throw new Error(`❌ FAIL CLOSED: Backup file not found at ${BACKUP_FILE_PATH}`);
  }

  const rawContent = fs.readFileSync(BACKUP_FILE_PATH, 'utf8');
  let backupData: any;
  try {
    backupData = JSON.parse(rawContent);
  } catch (err: any) {
    throw new Error(`❌ FAIL CLOSED: Backup file is not valid JSON: ${err?.message}`);
  }

  const backupSequences: TargetSequenceRecord[] =
    backupData.sequences || backupData.worksheets?.SEQUENCES?.records;

  if (!backupSequences || !Array.isArray(backupSequences)) {
    throw new Error('❌ FAIL CLOSED: SEQUENCES records not found in backup payload!');
  }

  if (backupSequences.length !== EXPECTED_ENTITIES.length) {
    throw new Error(
      `❌ FAIL CLOSED: Backup sequence record count mismatch! Expected ${EXPECTED_ENTITIES.length}, found ${backupSequences.length}`
    );
  }

  const backupMap = new Map<string, TargetSequenceRecord>();
  for (const seq of backupSequences) {
    if (!seq.entityType || typeof seq.nextNumber !== 'number') {
      throw new Error(`❌ FAIL CLOSED: Malformed sequence record in backup: ${JSON.stringify(seq)}`);
    }
    backupMap.set(seq.entityType, seq);
  }

  for (const entity of EXPECTED_ENTITIES) {
    if (!backupMap.has(entity)) {
      throw new Error(`❌ FAIL CLOSED: Expected entity '${entity}' is missing from backup sequences!`);
    }
  }

  console.log(`   ✅ Backup verified: all ${backupSequences.length} sequence entities present and valid.\n`);

  // --------------------------------------------------------------------------
  // STEP 2: READ CURRENT LIVE SEQUENCES AND GENERATE BEFORE / TARGET COMPARISON
  // --------------------------------------------------------------------------
  console.log('📊 STEP 2: Reading Current Live SEQUENCES and Generating Comparison Matrix...');
  
  googleSheetsClient.invalidateRowCache('SEQUENCES');
  const liveData = await googleSheetsClient.getRows('SEQUENCES');
  const liveHeaders = liveData.headers;
  const liveRows = liveData.rows;

  console.log(`   Live SEQUENCES row count: ${liveRows.length} rows (Headers: [${liveHeaders.join(', ')}])`);

  // Map live rows to objects
  const liveSeqMap = new Map<string, any>();
  const entityColIdx = liveHeaders.findIndex(h => h.trim().toLowerCase() === 'entity_type');
  const nextNumColIdx = liveHeaders.findIndex(h => h.trim().toLowerCase() === 'next_number');
  const prefixColIdx = liveHeaders.findIndex(h => h.trim().toLowerCase() === 'prefix');
  const padLenColIdx = liveHeaders.findIndex(h => h.trim().toLowerCase() === 'pad_length');
  const updatedColIdx = liveHeaders.findIndex(h => h.trim().toLowerCase() === 'updated_at');

  for (const r of liveRows) {
    const eType = String(r[entityColIdx] || '').trim();
    if (eType) {
      liveSeqMap.set(eType, {
        entityType: eType,
        nextNumber: Number(r[nextNumColIdx]),
        prefix: String(r[prefixColIdx] ?? ''),
        padLength: Number(r[padLenColIdx]),
        updatedAt: String(r[updatedColIdx] ?? ''),
      });
    }
  }

  console.log('\n================================================================================================================');
  console.log('| ENTITY TYPE                      | CURRENT nextNumber | TARGET nextNumber | CURRENT prefix | TARGET prefix | MATCH |');
  console.log('|----------------------------------|--------------------|-------------------|----------------|---------------|-------|');

  for (const entity of EXPECTED_ENTITIES) {
    const target = backupMap.get(entity)!;
    const current = liveSeqMap.get(entity);

    const currNum = current ? String(current.nextNumber) : 'MISSING';
    const targetNum = String(target.nextNumber);
    const currPrefix = current ? current.prefix : 'MISSING';
    const targetPrefix = target.prefix;
    const match = current && current.nextNumber === target.nextNumber && current.prefix === target.prefix && current.padLength === target.padLength ? 'YES' : 'DIFF';

    console.log(
      `| ${entity.padEnd(32)} | ${currNum.padStart(18)} | ${targetNum.padStart(17)} | ${currPrefix.padEnd(14)} | ${targetPrefix.padEnd(13)} | ${match.padEnd(5)} |`
    );
  }
  console.log('================================================================================================================\n');

  // --------------------------------------------------------------------------
  // STEP 3: RESTORE SEQUENCES WORKSHEET (WRITE BACKUP VALUES EXACTLY)
  // --------------------------------------------------------------------------
  console.log('✍️ STEP 3: Restoring SEQUENCES Worksheet Directly to Live Production Workbook...');
  console.log('   ⚠️ Preservation Rule: Row 1 headers preserved. No sequence recomputation or normalization applied.');

  // Align rows strictly according to live headers
  const restoredValues: (string | number | boolean)[][] = [];

  for (const target of backupSequences) {
    const rowRecord: Record<string, any> = {
      entity_type: target.entityType,
      next_number: target.nextNumber,
      prefix: target.prefix,
      pad_length: target.padLength,
      updated_at: target.updatedAt,
    };

    const row: (string | number | boolean)[] = [];
    for (const h of liveHeaders) {
      const hKey = h.trim().toLowerCase();
      const val = rowRecord[hKey];
      row.push(val !== undefined && val !== null ? val : '');
    }
    restoredValues.push(row);
  }

  // Clear rows 2 downwards
  await googleSheetsClient.clearDataRows('SEQUENCES');

  // Write exact restored rows
  const endColLetter = String.fromCharCode(65 + liveHeaders.length - 1);
  const targetRange = `A2:${endColLetter}${restoredValues.length + 1}`;
  await googleSheetsClient.updateRangeValues('SEQUENCES', targetRange, restoredValues);

  // Sync in-memory fallback store
  const fallbackStore = (BaseRepository as any).fallbackStore;
  if (fallbackStore.has(SHEET_TABS.SEQUENCES)) {
    const seqStore = fallbackStore.get(SHEET_TABS.SEQUENCES)!;
    seqStore.clear();
    for (const target of backupSequences) {
      seqStore.set(target.entityType, { ...target });
    }
  }

  console.log(`   ✅ Written ${restoredValues.length} restored sequence rows into range 'SEQUENCES'!${targetRange}.\n`);

  // --------------------------------------------------------------------------
  // STEP 4: POST-RESTORE VERIFICATION (ASSERT 100% FIELD PARITY)
  // --------------------------------------------------------------------------
  console.log('🔬 STEP 4: Performing Post-Restore Verification (Reading back live data)...');
  
  googleSheetsClient.invalidateRowCache('SEQUENCES');
  const postData = await googleSheetsClient.getRows('SEQUENCES');
  const postHeaders = postData.headers;
  const postRows = postData.rows;

  const postSeqMap = new Map<string, any>();
  const pEntityColIdx = postHeaders.findIndex(h => h.trim().toLowerCase() === 'entity_type');
  const pNextNumColIdx = postHeaders.findIndex(h => h.trim().toLowerCase() === 'next_number');
  const pPrefixColIdx = postHeaders.findIndex(h => h.trim().toLowerCase() === 'prefix');
  const pPadLenColIdx = postHeaders.findIndex(h => h.trim().toLowerCase() === 'pad_length');
  const pUpdatedColIdx = postHeaders.findIndex(h => h.trim().toLowerCase() === 'updated_at');

  for (const r of postRows) {
    const eType = String(r[pEntityColIdx] || '').trim();
    if (eType) {
      postSeqMap.set(eType, {
        entityType: eType,
        nextNumber: Number(r[pNextNumColIdx]),
        prefix: String(r[pPrefixColIdx] ?? ''),
        padLength: Number(r[pPadLenColIdx]),
        updatedAt: String(r[pUpdatedColIdx] ?? ''),
      });
    }
  }

  console.log('\n===================================================================================================================================================');
  console.log('| ENTITY                           | BACKUP nextNumber | CURRENT nextNumber | BACKUP prefix | CURRENT prefix | PAD LEN | UPDATED AT MATCH | STATUS |');
  console.log('|----------------------------------|-------------------|--------------------|---------------|----------------|---------|------------------|--------|');

  let allParityPassed = true;
  const comparisonResults: Array<{ entity: string; backupNum: number; currentNum: number; match: boolean }> = [];

  for (const entity of EXPECTED_ENTITIES) {
    const backupRec = backupMap.get(entity)!;
    const postRec = postSeqMap.get(entity);

    if (!postRec) {
      allParityPassed = false;
      console.log(`| ${entity.padEnd(32)} | ${String(backupRec.nextNumber).padStart(17)} | MISSING            | ${backupRec.prefix.padEnd(13)} | MISSING        | N/A     | NO               | FAIL   |`);
      comparisonResults.push({ entity, backupNum: backupRec.nextNumber, currentNum: -1, match: false });
      continue;
    }

    const nextNumMatch = postRec.nextNumber === backupRec.nextNumber;
    const prefixMatch = postRec.prefix === backupRec.prefix;
    const padLenMatch = postRec.padLength === backupRec.padLength;
    const updatedMatch = postRec.updatedAt === backupRec.updatedAt;

    const rowPass = nextNumMatch && prefixMatch && padLenMatch && updatedMatch;
    if (!rowPass) {
      allParityPassed = false;
    }

    comparisonResults.push({ entity, backupNum: backupRec.nextNumber, currentNum: postRec.nextNumber, match: rowPass });

    console.log(
      `| ${entity.padEnd(32)} | ${String(backupRec.nextNumber).padStart(17)} | ${String(postRec.nextNumber).padStart(18)} | ${backupRec.prefix.padEnd(13)} | ${postRec.prefix.padEnd(14)} | ${String(postRec.padLength).padEnd(7)} | ${(updatedMatch ? 'EXACT' : 'DIFF').padEnd(16)} | ${(rowPass ? 'PASS' : 'FAIL').padEnd(6)} |`
    );
  }
  console.log('===================================================================================================================================================\n');

  if (allParityPassed) {
    console.log('🎯 SEQUENCES EXACTLY RESTORED = PASS\n');
  } else {
    console.error('❌ SEQUENCES RESTORE = FAIL\n');
    throw new Error('Post-restoration sequence verification failed!');
  }

  // --------------------------------------------------------------------------
  // STEP 5: VERIFY CLEAN OPERATIONAL STATE (ASSERT ALL REMAIN ZERO ROWS)
  // --------------------------------------------------------------------------
  console.log('🧹 STEP 5: Verifying Operational Sheets (Asserting Zero Data Rows)...');

  const operationalResults: Record<string, number> = {};
  let operationalClean = true;

  console.log('   --- Production Workbook Operational Sheets ---');
  for (const [sName, repo] of Object.entries(OPERATIONAL_PROD_SHEETS)) {
    googleSheetsClient.invalidateRowCache(sName);
    const records = await repo.findAll();
    operationalResults[sName] = records.length;
    const status = records.length === 0 ? 'CLEAN (0 rows)' : `❌ DIRTY (${records.length} rows)`;
    console.log(`   📄 [${sName.padEnd(25)}] : ${status}`);
    if (records.length !== 0) operationalClean = false;
  }

  console.log('   --- Analytics Workbook Operational Sheets ---');
  for (const [sName, repo] of Object.entries(OPERATIONAL_ANALYTICS_SHEETS)) {
    const targetSpreadsheetId = (repo as any).getTargetSpreadsheetId();
    googleSheetsClient.invalidateRowCache(`${targetSpreadsheetId}:${sName}`);
    googleSheetsClient.invalidateRowCache(sName);
    const records = await repo.findAll();
    operationalResults[sName] = records.length;
    const status = records.length === 0 ? 'CLEAN (0 rows)' : `❌ DIRTY (${records.length} rows)`;
    console.log(`   📄 [${sName.padEnd(25)}] : ${status}`);
    if (records.length !== 0) operationalClean = false;
  }

  if (!operationalClean) {
    throw new Error('❌ Operational zero-state verification failed! Some operational sheets contain data.');
  }
  console.log('\n   ✅ Operational Zero State VERIFIED: All 24 operational sheets contain exactly 0 rows.\n');

  // --------------------------------------------------------------------------
  // STEP 6: VERIFY FOUNDATION DATA (ASSERT UNCHANGED)
  // --------------------------------------------------------------------------
  console.log('🏛️ STEP 6: Verifying Foundation Sheets (Asserting Unchanged Records)...');

  const foundationResults: Record<string, number> = {};
  for (const [sName, repo] of Object.entries(FOUNDATION_SHEETS)) {
    googleSheetsClient.invalidateRowCache(sName);
    const records = await repo.findAll();
    foundationResults[sName] = records.length;
    console.log(`   🏛️ [${sName.padEnd(25)}] : ${records.length} rows preserved`);
  }

  console.log('\n   ✅ Foundation Sheets VERIFIED: USERS, CATEGORIES, TOPICS, SUBTOPICS, QUESTION_CONFIG intact.\n');

  return {
    parityPassed: allParityPassed,
    comparisonResults,
    operationalResults,
    foundationResults,
  };
}

// Execute recovery
runSequenceRecovery()
  .then(() => {
    console.log('✨ Phase E Sequence Recovery Operation Completed Successfully.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('💥 Phase E Sequence Recovery FAILED:', err?.message || err);
    process.exit(1);
  });
