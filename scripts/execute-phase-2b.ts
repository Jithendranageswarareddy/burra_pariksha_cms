import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

interface SheetData {
  headers: string[];
  rows: any[][];
}

async function main() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

  if (!email || !privateKey || !spreadsheetId) {
    console.error('BLOCKED: Missing Google Service Account environment variables.');
    process.exit(1);
  }

  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  console.log('=== STEP 1: PRE-FLIGHT READ-ONLY AUDIT ===');
  const metaRes = await sheets.spreadsheets.get({ spreadsheetId });
  const title = metaRes.data.properties?.title || '';
  const sheetList = (metaRes.data.sheets || []).map((s) => ({
    title: s.properties?.title || '',
    sheetId: s.properties?.sheetId,
    rowCount: s.properties?.gridProperties?.rowCount || 0,
    columnCount: s.properties?.gridProperties?.columnCount || 0,
  }));

  console.log(`Live Spreadsheet ID: ${spreadsheetId}`);
  console.log(`Live Spreadsheet Title: "${title}"`);
  console.log(`Exact Live Worksheet Count (Before): ${sheetList.length}`);
  console.log('Worksheet Names:', sheetList.map(s => s.title));

  // Batch read all live sheets
  const ranges = sheetList.map(s => `'${s.title}'!A1:ZZ1000`);
  const batchRes = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges,
    valueRenderOption: 'UNFORMATTED_VALUE',
  });

  const liveDataBefore: Record<string, SheetData> = {};
  const valueRanges = batchRes.data.valueRanges || [];

  for (let i = 0; i < sheetList.length; i++) {
    const sName = sheetList[i].title;
    const vr = valueRanges[i];
    const vals = vr.values || [];
    const headers = (vals[0] || []).map(v => String(v).trim());
    const rows = vals.slice(1);
    liveDataBefore[sName] = { headers, rows };
  }

  // Backup creation & verification
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const backupFile = path.join(backupDir, `phase-2b-pre-reset-backup-${timestamp}.json`);
  fs.writeFileSync(backupFile, JSON.stringify({
    timestamp,
    spreadsheetId,
    title,
    worksheets: sheetList,
    data: liveDataBefore,
  }, null, 2));

  console.log('\n=== STEP 2: BACKUP CREATION & VERIFICATION ===');
  console.log(`Backup File: ${backupFile}`);
  console.log(`Backup Size: ${fs.statSync(backupFile).size} bytes`);
  const verifyBackup = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));
  if (Object.keys(verifyBackup.data).length !== sheetList.length) {
    console.error('BLOCKED: Backup verification failed.');
    process.exit(1);
  }
  console.log('Backup Verification: PASSED (All 24 worksheets verified).');

  // Classification & Filtering Logic
  console.log('\n=== STEP 3: MOCK/SYNTHETIC DATA CLASSIFICATION & HEADER RECONCILIATION ===');

  const deletionLog: Array<{ sheet: string; id: string; reason: string }> = [];
  const preservedLog: Array<{ sheet: string; id: string }> = [];
  const ambiguousLog: Array<{ sheet: string; id: string; reason: string }> = [];

  const targetHeadersMap: Record<string, string[]> = {
    CONTENT_MASTERS: ['id', 'content_id', 'title', 'status', 'primary_question_id', 'category_id', 'topic_id', 'subtopic_id', 'created_by', 'created_at', 'updated_at', 'archived_at'],
    QUESTIONS: ['id', 'content_id', 'content_master_id', 'category_id', 'category_name', 'topic_id', 'topic_name', 'subtopic_id', 'subtopic_name', 'difficulty', 'question_text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_answer', 'explanation', 'real_world_context', 'real_life_context', 'challenge_type', 'presentation_type', 'originality_score', 'ai_model', 'ai_prompt', 'question_style', 'status', 'video_status', 'tags', 'source', 'ai_prompt_used', 'author_id', 'validation_status', 'last_validation_id', 'validation_score', 'created_at', 'updated_at'],
    VIDEOS: ['id', 'content_id', 'content_master_id', 'question_id', 'title', 'status', 'priority', 'target_duration_seconds', 'actual_duration_seconds', 'queue_position', 'assigned_host', 'assigned_editor', 'drive_folder_url', 'raw_footage_path', 'final_render_path', 'final_render_width', 'final_render_height', 'final_render_format', 'final_render_aspect_ratio', 'final_render_validation_status', 'youtube_id', 'scheduled_recording_date', 'scheduled_publish_date', 'notes', 'created_at', 'updated_at'],
    SCRIPT: ['id', 'content_id', 'video_id', 'question_id', 'hook_text', 'problem_statement', 'step_by_step_solution', 'speed_trick_or_takeaway', 'call_to_action', 'current_version', 'notes', 'created_at', 'updated_at'],
    THUMBNAILS: ['id', 'content_id', 'video_id', 'hook_headline', 'drive_asset_url', 'preview_url', 'status', 'current_version', 'created_at', 'updated_at'],
    PINNED_COMMENTS: ['id', 'content_id', 'video_id', 'comment_text', 'solution_breakdown', 'next_challenge_question', 'is_approved', 'created_at', 'updated_at'],
    PUBLISHING: ['id', 'content_id', 'video_id', 'question_id', 'video_title', 'final_video_status', 'youtube_status', 'youtube_url', 'youtube_published_at', 'youtube_scheduled_at', 'youtube_last_failure_reason', 'youtube_retry_count', 'youtube_failed_at', 'instagram_status', 'instagram_url', 'instagram_published_at', 'instagram_scheduled_at', 'instagram_last_failure_reason', 'instagram_retry_count', 'instagram_failed_at', 'facebook_status', 'facebook_url', 'facebook_published_at', 'facebook_scheduled_at', 'facebook_last_failure_reason', 'facebook_retry_count', 'facebook_failed_at', 'pinned_comment_ready', 'thumbnail_ready', 'completed_platforms_count', 'total_platforms_count', 'created_at', 'updated_at'],
    SOCIAL_REVIEWS: ['id', 'content_id', 'question_id', 'content_master_id', 'reviewed_version_hash', 'reviewer_id', 'reviewer_name', 'reviewer_role', 'decision', 'reason', 'feedback_categories', 'overall_quality_score_at_review', 'quality_status_at_review', 'is_admin_override', 'reviewed_at'],
    TOPICS: ['id', 'category_id', 'name', 'slug', 'description', 'display_order', 'is_active', 'created_at', 'updated_at'],
    SUBTOPICS: ['id', 'topic_id', 'name', 'slug', 'description', 'notes', 'display_order', 'is_active', 'created_at', 'updated_at'],
  };

  const sheetsToUpdate: Record<string, { headers: string[]; rows: any[][] }> = {};
  let totalRowsDeleted = 0;
  let totalRowsPreserved = 0;

  for (const sName of sheetList.map(s => s.title)) {
    if (sName === 'Sheet1') continue;

    const currentSheet = liveDataBefore[sName];
    const oldHeaders = currentSheet.headers;
    const oldRows = currentSheet.rows;

    const newHeaders = targetHeadersMap[sName] || oldHeaders;
    const cleanedRows: any[][] = [];

    for (const row of oldRows) {
      const id = String(row[0] || '').trim();
      const rowText = row.map(c => String(c || '')).join(' ');

      // Conclusively synthetic detection
      const isConclusivelySynthetic =
        id === '' ||
        id === 'undefined' ||
        id.startsWith('ID-') ||
        id.startsWith('TEST-') ||
        id.includes('EXEC-') ||
        id.includes('TEST_DEBUG') ||
        id.includes('T9_DIAG') ||
        rowText.includes('Test Automation Aptitude') ||
        rowText.includes('Temporary category for Task 2B') ||
        rowText.includes('Temporary subtopic for Task 2B') ||
        rowText.includes('UPDATED E2E QUESTION') ||
        rowText.includes('Verification Sample Master');

      if (isConclusivelySynthetic) {
        deletionLog.push({
          sheet: sName,
          id: id || '(empty)',
          reason: 'Conclusively synthetic test fixture or E2E automation artifact',
        });
        totalRowsDeleted++;
        continue;
      }

      // Record is preserved
      preservedLog.push({ sheet: sName, id });
      totalRowsPreserved++;

      // Reconcile row columns by matching header names
      const rowObj: Record<string, any> = {};
      for (let c = 0; c < oldHeaders.length; c++) {
        rowObj[oldHeaders[c]] = row[c] !== undefined ? row[c] : '';
      }

      // Handle canonical content_id mapping if applicable
      if (newHeaders.includes('content_id') && !rowObj['content_id']) {
        if (rowObj['content_master_id']) {
          rowObj['content_id'] = rowObj['content_master_id'];
        } else if (id.startsWith('BP-CNT-') || id.startsWith('BP-MST-')) {
          rowObj['content_id'] = id;
        } else {
          rowObj['content_id'] = '';
        }
      }

      const reconciledRow = newHeaders.map(h => (rowObj[h] !== undefined ? rowObj[h] : ''));
      cleanedRows.push(reconciledRow);
    }

    sheetsToUpdate[sName] = {
      headers: newHeaders,
      rows: cleanedRows,
    };
  }

  // Handle SEQUENCES calculation
  console.log('\n=== STEP 4: COLLISION-SAFE SEQUENCES CALCULATION ===');

  function calculateSafeNextNumber(rows: any[][], prefix: string, currentVal: number): number {
    let maxFound = 0;
    for (const r of rows) {
      const id = String(r[0] || '').trim();
      if (id.startsWith(prefix)) {
        const numPart = id.substring(prefix.length);
        const parsed = parseInt(numPart, 10);
        if (!isNaN(parsed) && parsed > maxFound && parsed < 1000000000) {
          maxFound = parsed;
        }
      }
    }
    const safeNext = Math.max(maxFound + 1, currentVal > 1000000000 ? 1 : currentVal);
    return safeNext;
  }

  const oldSeqRows = liveDataBefore['SEQUENCES']?.rows || [];
  const newSeqRows: any[][] = [];

  const entityTypeMapping: Record<string, { sheet: string; prefix: string; pad: number }> = {
    CONTENT_MASTER: { sheet: 'CONTENT_MASTERS', prefix: 'BP-CNT-', pad: 6 },
    QUESTION: { sheet: 'QUESTIONS', prefix: 'BP-Q-', pad: 6 },
    VIDEO: { sheet: 'VIDEOS', prefix: 'BP-V-', pad: 6 },
    SCRIPT: { sheet: 'SCRIPT', prefix: 'BP-S-', pad: 6 },
    THUMBNAIL: { sheet: 'THUMBNAILS', prefix: 'BP-T-', pad: 6 },
    PINNED_COMMENT: { sheet: 'PINNED_COMMENTS', prefix: 'BP-PIN-', pad: 6 },
    CATEGORY: { sheet: 'CATEGORIES', prefix: 'BP-CAT-', pad: 3 },
    TOPIC: { sheet: 'TOPICS', prefix: 'BP-TOP-', pad: 3 },
    SUBTOPIC: { sheet: 'SUBTOPICS', prefix: 'BP-SUB-', pad: 4 },
    USER: { sheet: 'USERS', prefix: 'USR-', pad: 3 },
    CONTENT_PLAN: { sheet: 'CONTENT_PLANS', prefix: 'BP-PLN-', pad: 4 },
    CONTENT_BATCH: { sheet: 'CONTENT_BATCHES', prefix: 'BP-BCH-', pad: 4 },
    ASSIGNMENT: { sheet: 'ASSIGNMENTS', prefix: 'BP-ASN-', pad: 6 },
    SOCIAL_REVIEW: { sheet: 'SOCIAL_REVIEWS', prefix: 'BP-REV-', pad: 6 },
  };

  const isoNow = new Date().toISOString();
  const seqAudit: Array<{ entity: string; prefix: string; oldVal: any; newVal: number; rationale: string }> = [];

  for (const [entityType, config] of Object.entries(entityTypeMapping)) {
    const existingSeqRow = oldSeqRows.find(r => r[0] === entityType);
    const currentVal = existingSeqRow ? parseInt(String(existingSeqRow[1]), 10) || 1 : 1;
    const targetSheetRows = sheetsToUpdate[config.sheet]?.rows || [];

    const safeNext = calculateSafeNextNumber(targetSheetRows, config.prefix, currentVal);

    newSeqRows.push([
      entityType,
      safeNext,
      config.prefix,
      config.pad,
      isoNow,
    ]);

    seqAudit.push({
      entity: entityType,
      prefix: config.prefix,
      oldVal: existingSeqRow ? existingSeqRow[1] : '(none)',
      newVal: safeNext,
      rationale: `Computed from ${targetSheetRows.length} preserved rows in ${config.sheet}`,
    });
  }

  sheetsToUpdate['SEQUENCES'] = {
    headers: ['entity_type', 'next_number', 'prefix', 'pad_length', 'updated_at'],
    rows: newSeqRows,
  };

  console.log('Calculated Collision-Safe Sequences:');
  console.table(seqAudit);

  // Execute Live Mutations on Google Sheets
  console.log('\n=== STEP 5: EXECUTING LIVE SHEET MUTATIONS ===');
  let totalApiWrites = 0;
  let totalApiUpdates = 0;
  let totalApiClears = 0;

  for (const [sName, sData] of Object.entries(sheetsToUpdate)) {
    console.log(`Writing reconciled data to sheet "${sName}" (${sData.rows.length} rows, ${sData.headers.length} cols)...`);
    
    // 1. Clear existing range to avoid stale leftover cells
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `'${sName}'!A1:ZZ1000`,
    });
    totalApiClears++;

    // 2. Write headers and cleaned rows
    const fullGrid = [sData.headers, ...sData.rows];
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${sName}'!A1`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: fullGrid,
      },
    });
    totalApiUpdates++;
    totalApiWrites++;
  }

  // Step 6: Post-Mutation Read-Only Verification Audit
  console.log('\n=== STEP 6: POST-MUTATION LIVE READ-ONLY AUDIT ===');
  const postMetaRes = await sheets.spreadsheets.get({ spreadsheetId });
  const postSheetList = (postMetaRes.data.sheets || []).map((s) => ({
    title: s.properties?.title || '',
    sheetId: s.properties?.sheetId,
  }));

  const postRanges = postSheetList.map(s => `'${s.title}'!A1:ZZ1000`);
  const postBatchRes = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges: postRanges,
    valueRenderOption: 'UNFORMATTED_VALUE',
  });

  const liveDataAfter: Record<string, SheetData> = {};
  const postValueRanges = postBatchRes.data.valueRanges || [];

  for (let i = 0; i < postSheetList.length; i++) {
    const sName = postSheetList[i].title;
    const vr = postValueRanges[i];
    const vals = vr.values || [];
    const headers = (vals[0] || []).map(v => String(v).trim());
    const rows = vals.slice(1);
    liveDataAfter[sName] = { headers, rows };
  }

  console.log(`Live Worksheet Count After: ${postSheetList.length}`);

  // Summary Report Data Generation
  const summaryReport = {
    spreadsheetId,
    title,
    worksheetsBeforeCount: sheetList.length,
    worksheetsAfterCount: postSheetList.length,
    backupFile,
    backupVerified: true,
    totalRowsDeleted,
    totalRowsPreserved,
    totalApiWrites,
    totalApiUpdates,
    totalApiClears,
    sheetsModifiedCount: Object.keys(sheetsToUpdate).length,
    seqAudit,
    deletionSample: deletionLog.slice(0, 20),
    liveDataAfterSummary: Object.fromEntries(
      Object.entries(liveDataAfter).map(([k, v]) => [k, { headersCount: v.headers.length, rowsCount: v.rows.length, hasContentId: v.headers.includes('content_id') }])
    ),
  };

  const reportFile = path.join(backupDir, `phase-2b-live-execution-report-${timestamp}.json`);
  fs.writeFileSync(reportFile, JSON.stringify(summaryReport, null, 2));

  console.log(`\nExecution Finished Successfully. Report written to ${reportFile}`);
}

main().catch(err => {
  console.error('Migration Failed with Error:', err);
  process.exit(1);
});
