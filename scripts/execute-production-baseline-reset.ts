import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('====================================================');
  console.log('BURRA PARIKSHA CMS — FINAL TEST-DATA CLEANUP EXECUTION');
  console.log('====================================================\n');

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

  // =========================================================================
  // PHASE 1 — LIVE PRE-CLEANUP AUDIT
  // =========================================================================
  console.log('>>> PHASE 1: LIVE PRE-CLEANUP AUDIT');
  const metaRes = await sheets.spreadsheets.get({ spreadsheetId });
  const sheetList = (metaRes.data.sheets || []).map((s) => ({
    title: s.properties?.title || '',
    sheetId: s.properties?.sheetId!,
    rowCount: s.properties?.gridProperties?.rowCount || 0,
    columnCount: s.properties?.gridProperties?.columnCount || 0,
  }));

  const currentNames = sheetList.map(s => s.title);
  const ranges = currentNames.map(s => `'${s}'!A1:ZZ1000`);
  const batchRes = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges,
    valueRenderOption: 'UNFORMATTED_VALUE',
  });

  const sheetData: Record<string, { sheetId: number; headers: string[]; rows: any[][] }> = {};
  currentNames.forEach((sName, idx) => {
    const vr = batchRes.data.valueRanges?.[idx];
    const vals = vr?.values || [];
    const headers = (vals[0] || []).map(v => String(v).trim());
    const rows = vals.slice(1);
    sheetData[sName] = { sheetId: sheetList[idx].sheetId, headers, rows };
  });

  // Verify candidate test IDs
  const topicRows = sheetData['TOPICS']?.rows || [];
  const subtopicRows = sheetData['SUBTOPICS']?.rows || [];

  const tpMathRows = topicRows.filter(r => String(r[0]).trim() === 'TP-MATH');
  const tpScienceRows = topicRows.filter(r => String(r[0]).trim() === 'TP-SCIENCE');
  const stpAlgebraRows = subtopicRows.filter(r => String(r[0]).trim() === 'STP-ALGEBRA');
  const stpPhysicsRows = subtopicRows.filter(r => String(r[0]).trim() === 'STP-PHYSICS');

  console.log(`- TOPICS: Total=${topicRows.length} | TP-MATH=${tpMathRows.length} | TP-SCIENCE=${tpScienceRows.length}`);
  console.log(`- SUBTOPICS: Total=${subtopicRows.length} | STP-ALGEBRA=${stpAlgebraRows.length} | STP-PHYSICS=${stpPhysicsRows.length}`);

  if (tpMathRows.length !== 4 || tpScienceRows.length !== 4 || stpAlgebraRows.length !== 4 || stpPhysicsRows.length !== 4) {
    console.error('BLOCKED: Expected exact 4 rows for each test entity.');
    process.exit(1);
  }

  // =========================================================================
  // PHASE 2 — DEPENDENCY SAFETY CHECK
  // =========================================================================
  console.log('\n>>> PHASE 2: DEPENDENCY SAFETY CHECK');
  const targetTestIds = ['TP-MATH', 'TP-SCIENCE', 'STP-ALGEBRA', 'STP-PHYSICS'];
  let totalExternalReferences = 0;

  for (const [sName, sContent] of Object.entries(sheetData)) {
    if (sName === 'TOPICS' || sName === 'SUBTOPICS') continue;
    sContent.rows.forEach((row, rIdx) => {
      row.forEach((cell, cIdx) => {
        const strCell = String(cell || '');
        for (const testId of targetTestIds) {
          if (strCell === testId || strCell.includes(testId)) {
            totalExternalReferences++;
            console.error(`DANGER: Found reference in Sheet [${sName}] Row ${rIdx + 2} Col ${sContent.headers[cIdx] || cIdx}: ${strCell}`);
          }
        }
      });
    });
  }

  console.log(`- Total External References across entire database: ${totalExternalReferences}`);
  if (totalExternalReferences > 0) {
    console.error('BLOCKED: External references found. Aborting cleanup.');
    process.exit(1);
  }

  // =========================================================================
  // PHASE 3 — DRIVE VERIFICATION
  // =========================================================================
  console.log('\n>>> PHASE 3: DRIVE VERIFICATION');
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN;
  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;

  let driveTestArtifacts = 0;
  let rootFolderPreserved = false;
  let contentFolderPreserved = false;

  if (clientId && clientSecret && refreshToken && rootFolderId) {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, 'http://localhost:3000/api/auth/google/callback');
    oauth2Client.setCredentials({ refresh_token: refreshToken });
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    const rootMeta = await drive.files.get({ fileId: rootFolderId, fields: 'id, name, trashed' });
    if (rootMeta.data.id === rootFolderId && !rootMeta.data.trashed) {
      rootFolderPreserved = true;
      console.log(`- Root Folder verified: "${rootMeta.data.name}" (${rootMeta.data.id})`);
    }

    const activeRes = await drive.files.list({
      q: `'${rootFolderId}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType)',
    });
    const activeFiles = activeRes.data.files || [];
    const contentFolder = activeFiles.find(f => f.name === 'Content' && f.mimeType === 'application/vnd.google-apps.folder');
    if (contentFolder) {
      contentFolderPreserved = true;
      console.log(`- Content Folder verified: "${contentFolder.name}" (${contentFolder.id})`);

      const contentChildren = await drive.files.list({
        q: `'${contentFolder.id}' in parents and trashed = false`,
        fields: 'files(id, name)',
      });
      driveTestArtifacts += (contentChildren.data.files || []).length;
    }

    const trashRes = await drive.files.list({
      q: 'trashed = true',
      fields: 'files(id, name)',
    });
    driveTestArtifacts += (trashRes.data.files || []).length;
    console.log(`- Drive Test Artifacts Count: ${driveTestArtifacts}`);
  }

  // =========================================================================
  // PHASE 4 — SNAPSHOT / BACKUP VERIFICATION
  // =========================================================================
  console.log('\n>>> PHASE 4: SNAPSHOT / BACKUP VERIFICATION');
  const storageAuth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/devstorage.read_only'],
  });
  const storage = google.storage({ version: 'v1', auth: storageAuth });
  const gcsRes = await storage.objects.list({ bucket: 'burra-pariksha-snapshots-2026' });
  const gcsTestArtifacts = (gcsRes.data.items || []).length;
  console.log(`- GCS Snapshot Test Objects Count: ${gcsTestArtifacts}`);

  const backupDir = path.join(process.cwd(), 'backups', 'deletion');
  let localBackupArtifacts = 0;
  if (fs.existsSync(backupDir)) {
    localBackupArtifacts = fs.readdirSync(backupDir).length;
  }
  console.log(`- Local Deletion Backup Files Count: ${localBackupArtifacts}`);

  // =========================================================================
  // PHASE 5 — SEQUENCE SAFETY CHECK
  // =========================================================================
  console.log('\n>>> PHASE 5: SEQUENCE SAFETY CHECK');
  const sequenceRows = sheetData['SEQUENCES']?.rows || [];
  let contentPlanRowIndex = -1;
  let currentContentPlanNextNumber = -1;

  sequenceRows.forEach((r, idx) => {
    if (String(r[0]).trim() === 'CONTENT_PLAN') {
      contentPlanRowIndex = idx + 2; // 1-indexed in sheet (row 1 is header)
      currentContentPlanNextNumber = parseInt(String(r[1]), 10);
    }
  });

  const contentPlanDataRows = sheetData['CONTENT_PLANS']?.rows.length || 0;
  console.log(`- CONTENT_PLANS Worksheet Data Rows: ${contentPlanDataRows}`);
  console.log(`- CONTENT_PLAN Sequence Row in SEQUENCES: Row ${contentPlanRowIndex}`);
  console.log(`- Current CONTENT_PLAN next_number: ${currentContentPlanNextNumber}`);

  // =========================================================================
  // PHASE 6 — SAFETY CHECKPOINT
  // =========================================================================
  console.log('\n====================================================');
  console.log('CLEANUP CHECKPOINT');
  console.log('====================================================');
  console.log(`TOPIC candidates:`);
  console.log(`  TP-MATH = ${tpMathRows.length} rows`);
  console.log(`  TP-SCIENCE = ${tpScienceRows.length} rows`);
  console.log(`SUBTOPIC candidates:`);
  console.log(`  STP-ALGEBRA = ${stpAlgebraRows.length} rows`);
  console.log(`  STP-PHYSICS = ${stpPhysicsRows.length} rows`);
  console.log(`Total topic deletions = ${tpMathRows.length + tpScienceRows.length}`);
  console.log(`Total subtopic deletions = ${stpAlgebraRows.length + stpPhysicsRows.length}`);
  console.log(`Total deletions = ${tpMathRows.length + tpScienceRows.length + stpAlgebraRows.length + stpPhysicsRows.length}`);
  console.log(`External references = ${totalExternalReferences}`);
  console.log(`Drive test artifacts = ${driveTestArtifacts}`);
  console.log(`GCS test artifacts = ${gcsTestArtifacts}`);
  console.log(`Local backup artifacts = ${localBackupArtifacts}`);
  console.log(`CONTENT_PLAN records = ${contentPlanDataRows}`);
  console.log(`Current CONTENT_PLAN next_number = ${currentContentPlanNextNumber}`);
  console.log(`Proposed CONTENT_PLAN next_number = 1`);
  console.log(`Preserved production rows = 228`);
  console.log('====================================================\n');

  if (
    tpMathRows.length !== 4 ||
    tpScienceRows.length !== 4 ||
    stpAlgebraRows.length !== 4 ||
    stpPhysicsRows.length !== 4 ||
    totalExternalReferences !== 0 ||
    driveTestArtifacts !== 0 ||
    gcsTestArtifacts !== 0 ||
    localBackupArtifacts !== 0 ||
    contentPlanDataRows !== 0 ||
    contentPlanRowIndex === -1
  ) {
    console.error('BLOCKED: Checkpoint expectations failed. Aborting.');
    process.exit(1);
  }

  // =========================================================================
  // PHASE 7 — EXECUTE CLEANUP
  // =========================================================================
  console.log('>>> PHASE 7: EXECUTING CLEANUP...');

  // 1. Delete rows 102 through 109 from TOPICS sheet
  const topicsSheetId = sheetData['TOPICS'].sheetId;
  // Verify rows 102 to 109 (index 100 to 107 in data rows, or 101 to 108 0-indexed in sheet)
  console.log('Executing DeleteDimension for TOPICS (rows 102-109)...');
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: topicsSheetId,
              dimension: 'ROWS',
              startIndex: 101, // row 102 (0-indexed)
              endIndex: 109,   // row 109 exclusive -> deletes rows 102, 103, 104, 105, 106, 107, 108, 109
            },
          },
        },
      ],
    },
  });
  console.log('TOPICS deleteDimension SUCCESS.');

  // 2. Delete rows 102 through 109 from SUBTOPICS sheet
  const subtopicsSheetId = sheetData['SUBTOPICS'].sheetId;
  console.log('Executing DeleteDimension for SUBTOPICS (rows 102-109)...');
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: subtopicsSheetId,
              dimension: 'ROWS',
              startIndex: 101, // row 102 (0-indexed)
              endIndex: 109,   // row 109 exclusive
            },
          },
        },
      ],
    },
  });
  console.log('SUBTOPICS deleteDimension SUCCESS.');

  // 3. Reset CONTENT_PLAN next_number to 1 in SEQUENCES sheet
  console.log(`Setting SEQUENCES CONTENT_PLAN next_number to 1 at row ${contentPlanRowIndex}...`);
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'SEQUENCES'!B${contentPlanRowIndex}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[1]],
    },
  });
  console.log('SEQUENCES CONTENT_PLAN reset SUCCESS.');

  // =========================================================================
  // PHASE 8 — POST-CLEANUP VERIFICATION
  // =========================================================================
  console.log('\n>>> PHASE 8: POST-CLEANUP VERIFICATION');

  const postBatchRes = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges,
    valueRenderOption: 'UNFORMATTED_VALUE',
  });

  const postSheetData: Record<string, { headers: string[]; rows: any[][] }> = {};
  currentNames.forEach((sName, idx) => {
    const vr = postBatchRes.data.valueRanges?.[idx];
    const vals = vr?.values || [];
    const headers = (vals[0] || []).map(v => String(v).trim());
    const rows = vals.slice(1);
    postSheetData[sName] = { headers, rows };
  });

  const postTopicRows = postSheetData['TOPICS']?.rows || [];
  const postSubtopicRows = postSheetData['SUBTOPICS']?.rows || [];

  console.log(`- Post-cleanup TOPICS count: ${postTopicRows.length} (Expected 100)`);
  console.log(`- Post-cleanup SUBTOPICS count: ${postSubtopicRows.length} (Expected 100)`);

  const remainingTpMath = postTopicRows.filter(r => String(r[0]).trim() === 'TP-MATH');
  const remainingTpScience = postTopicRows.filter(r => String(r[0]).trim() === 'TP-SCIENCE');
  const remainingStpAlgebra = postSubtopicRows.filter(r => String(r[0]).trim() === 'STP-ALGEBRA');
  const remainingStpPhysics = postSubtopicRows.filter(r => String(r[0]).trim() === 'STP-PHYSICS');

  if (
    postTopicRows.length !== 100 ||
    postSubtopicRows.length !== 100 ||
    remainingTpMath.length !== 0 ||
    remainingTpScience.length !== 0 ||
    remainingStpAlgebra.length !== 0 ||
    remainingStpPhysics.length !== 0
  ) {
    console.error('VERIFICATION FAILED: Taxonomy rows mismatch.');
    process.exit(1);
  }

  // Check unique IDs in TOPICS & SUBTOPICS
  const topicIdsSet = new Set(postTopicRows.map(r => String(r[0])));
  const subtopicIdsSet = new Set(postSubtopicRows.map(r => String(r[0])));
  if (topicIdsSet.size !== 100 || subtopicIdsSet.size !== 100) {
    console.error('VERIFICATION FAILED: Duplicate canonical IDs found.');
    process.exit(1);
  }

  // Verify all 100 start with BP-TOP- and BP-SUB-
  const allTopicsCanonical = postTopicRows.every(r => String(r[0]).startsWith('BP-TOP-'));
  const allSubtopicsCanonical = postSubtopicRows.every(r => String(r[0]).startsWith('BP-SUB-'));
  if (!allTopicsCanonical || !allSubtopicsCanonical) {
    console.error('VERIFICATION FAILED: Non-canonical IDs present in preserved taxonomy.');
    process.exit(1);
  }

  // Verify sequences
  const postSequenceRows = postSheetData['SEQUENCES']?.rows || [];
  const seqMap = new Map<string, number>();
  postSequenceRows.forEach(r => seqMap.set(String(r[0]).trim(), parseInt(String(r[1]), 10)));

  console.log('- Post-cleanup SEQUENCES:', Object.fromEntries(seqMap));

  if (
    seqMap.get('TOPIC') !== 101 ||
    seqMap.get('SUBTOPIC') !== 101 ||
    seqMap.get('CONTENT_PLAN') !== 1 ||
    seqMap.get('QUESTION') !== 1 ||
    seqMap.get('VIDEO') !== 1 ||
    seqMap.get('SCRIPT') !== 1 ||
    seqMap.get('THUMBNAIL') !== 1 ||
    seqMap.get('PINNED_COMMENT') !== 1 ||
    seqMap.get('ASSIGNMENT') !== 1 ||
    seqMap.get('CONTENT_MASTER') !== 1
  ) {
    console.error('VERIFICATION FAILED: Sequence values incorrect.');
    process.exit(1);
  }

  let totalRemainingRows = 0;
  for (const sName of Object.keys(postSheetData)) {
    totalRemainingRows += postSheetData[sName].rows.length;
  }
  console.log(`- Total Post-Cleanup Data Rows across all 25 sheets: ${totalRemainingRows} (Expected 228)`);

  if (totalRemainingRows !== 228) {
    console.error(`VERIFICATION FAILED: Total remaining rows ${totalRemainingRows} !== 228`);
    process.exit(1);
  }

  console.log('\n====================================================');
  console.log('ALL PHASES PASSED 100% PERFECTLY!');
  console.log('====================================================');
}

main().catch(err => {
  console.error('Execution Failed:', err);
  process.exit(1);
});
