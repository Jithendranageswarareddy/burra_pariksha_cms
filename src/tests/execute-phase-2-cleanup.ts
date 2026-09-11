import fs from 'fs';
import path from 'path';
import { googleSheetsClient } from '../lib/google-sheets/client';
import { SHEET_TABS } from '../lib/schemas/google-sheets-schema';

async function runPhase2Cleanup() {
  console.log('====================================================');
  console.log('BURRA PARIKSHA CMS - PHASE 2 FINAL CLEANUP');
  console.log('====================================================\n');

  googleSheetsClient.invalidateRowCache();

  // STEP 1: Read all target sheets for inspection
  const categoriesBefore = await googleSheetsClient.getRows(SHEET_TABS.CATEGORIES);
  const questionVideosBefore = await googleSheetsClient.getRows(SHEET_TABS.QUESTION_VIDEOS);
  const questionsBefore = await googleSheetsClient.getRows(SHEET_TABS.QUESTIONS);
  const videosBefore = await googleSheetsClient.getRows(SHEET_TABS.VIDEOS);
  const contentMastersBefore = await googleSheetsClient.getRows(SHEET_TABS.CONTENT_MASTERS);
  const topicsBefore = await googleSheetsClient.getRows(SHEET_TABS.TOPICS);
  const subtopicsBefore = await googleSheetsClient.getRows(SHEET_TABS.SUBTOPICS);
  const usersBefore = await googleSheetsClient.getRows(SHEET_TABS.USERS);

  console.log('--- BEFORE CLEANUP INSPECTION ---');
  console.log(`CATEGORIES rows (${categoriesBefore.rows.length}):`, JSON.stringify(categoriesBefore.rows, null, 2));
  console.log(`QUESTION_VIDEOS rows (${questionVideosBefore.rows.length}):`, JSON.stringify(questionVideosBefore.rows, null, 2));
  console.log(`QUESTIONS rows (${questionsBefore.rows.length}):`, JSON.stringify(questionsBefore.rows, null, 2));
  console.log(`VIDEOS rows (${videosBefore.rows.length}):`, JSON.stringify(videosBefore.rows, null, 2));
  console.log(`CONTENT_MASTERS rows (${contentMastersBefore.rows.length}):`, JSON.stringify(contentMastersBefore.rows, null, 2));
  console.log(`TOPICS rows count: ${topicsBefore.rows.length}`);
  console.log(`SUBTOPICS rows count: ${subtopicsBefore.rows.length}`);
  console.log(`USERS rows count: ${usersBefore.rows.length}`);

  // STEP 2: Backup before deletion
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupFilePath = path.join(backupDir, `phase-2-legacy-cleanup-backup-${timestamp}.json`);
  const backupData = {
    timestamp,
    categoriesBefore,
    questionVideosBefore,
    questionsBefore,
    videosBefore,
    contentMastersBefore,
    topicsBeforeCount: topicsBefore.rows.length,
    subtopicsBeforeCount: subtopicsBefore.rows.length,
    usersBefore: usersBefore.rows,
  };

  fs.writeFileSync(backupFilePath, JSON.stringify(backupData, null, 2), 'utf-8');
  console.log(`\n[PASS] Backup created successfully at: ${backupFilePath}`);

  // STEP 3: Clear obsolete data rows in affected legacy/mock worksheets
  console.log('\n--- EXECUTING CLEAR DATA ROWS ---');

  await googleSheetsClient.clearDataRows(SHEET_TABS.CATEGORIES);
  console.log(`[PASS] Cleared ${categoriesBefore.rows.length} rows from CATEGORIES worksheet.`);

  await googleSheetsClient.clearDataRows(SHEET_TABS.QUESTION_VIDEOS);
  console.log(`[PASS] Cleared ${questionVideosBefore.rows.length} rows from QUESTION_VIDEOS worksheet.`);

  await googleSheetsClient.clearDataRows(SHEET_TABS.QUESTIONS);
  console.log(`[PASS] Cleared ${questionsBefore.rows.length} rows from QUESTIONS worksheet.`);

  await googleSheetsClient.clearDataRows(SHEET_TABS.VIDEOS);
  console.log(`[PASS] Cleared ${videosBefore.rows.length} rows from VIDEOS worksheet.`);

  await googleSheetsClient.clearDataRows(SHEET_TABS.CONTENT_MASTERS);
  console.log(`[PASS] Cleared ${contentMastersBefore.rows.length} rows from CONTENT_MASTERS worksheet.`);

  // STEP 4: Invalidate cache & Verify post-state
  googleSheetsClient.invalidateRowCache();

  const categoriesAfter = await googleSheetsClient.getRows(SHEET_TABS.CATEGORIES);
  const questionVideosAfter = await googleSheetsClient.getRows(SHEET_TABS.QUESTION_VIDEOS);
  const questionsAfter = await googleSheetsClient.getRows(SHEET_TABS.QUESTIONS);
  const videosAfter = await googleSheetsClient.getRows(SHEET_TABS.VIDEOS);
  const contentMastersAfter = await googleSheetsClient.getRows(SHEET_TABS.CONTENT_MASTERS);
  const topicsAfter = await googleSheetsClient.getRows(SHEET_TABS.TOPICS);
  const subtopicsAfter = await googleSheetsClient.getRows(SHEET_TABS.SUBTOPICS);
  const usersAfter = await googleSheetsClient.getRows(SHEET_TABS.USERS);

  console.log('\n--- VERIFICATION AFTER CLEANUP ---');
  console.log(`CATEGORIES data rows: ${categoriesAfter.rows.length} (Expected: 0)`);
  console.log(`QUESTION_VIDEOS data rows: ${questionVideosAfter.rows.length} (Expected: 0)`);
  console.log(`QUESTIONS data rows: ${questionsAfter.rows.length} (Expected: 0)`);
  console.log(`VIDEOS data rows: ${videosAfter.rows.length} (Expected: 0)`);
  console.log(`CONTENT_MASTERS data rows: ${contentMastersAfter.rows.length} (Expected: 0)`);
  console.log(`TOPICS count: ${topicsAfter.rows.length} (Expected: 100)`);
  console.log(`SUBTOPICS count: ${subtopicsAfter.rows.length} (Expected: 100)`);
  console.log(`USERS count: ${usersAfter.rows.length} (Expected: 2)`);

  const pass1 = categoriesAfter.rows.length === 0;
  const pass2 = questionVideosAfter.rows.length === 0;
  const pass3 = questionsAfter.rows.length === 0;
  const pass4 = videosAfter.rows.length === 0;
  const pass5 = contentMastersAfter.rows.length === 0;
  const pass6 = topicsAfter.rows.length === 100;
  const pass7 = subtopicsAfter.rows.length === 100;
  const pass8 = usersAfter.rows.length === 2;

  const allPass = pass1 && pass2 && pass3 && pass4 && pass5 && pass6 && pass7 && pass8;

  if (allPass) {
    console.log('\n====================================================');
    console.log('PHASE 2 FINAL GATE: PASS');
    console.log('====================================================');
  } else {
    console.log('\n====================================================');
    console.log('PHASE 2 FINAL GATE: BLOCKED');
    console.log('====================================================');
    process.exit(1);
  }
}

runPhase2Cleanup().catch((err) => {
  console.error('Phase 2 cleanup error:', err);
  process.exit(1);
});
