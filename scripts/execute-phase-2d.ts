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

  console.log('=== STEP 1: ENUMERATE LIVE WORKSHEETS ===');
  const metaRes = await sheets.spreadsheets.get({ spreadsheetId });
  const title = metaRes.data.properties?.title || '';
  const sheetList = (metaRes.data.sheets || []).map((s) => ({
    title: s.properties?.title || '',
    sheetId: s.properties?.sheetId,
    rowCount: s.properties?.gridProperties?.rowCount || 0,
    columnCount: s.properties?.gridProperties?.columnCount || 0,
  }));

  const sheetNames = sheetList.map(s => s.title);
  console.log(`Live Spreadsheet Title: "${title}"`);
  console.log(`Live Worksheet Count Before Wipe: ${sheetList.length}`);
  console.log('Live Worksheet Names:', sheetNames);

  // Read all live data
  const ranges = sheetNames.map(s => `'${s}'!A1:ZZ1000`);
  const batchRes = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges,
    valueRenderOption: 'UNFORMATTED_VALUE',
  });

  const liveDataBefore: Record<string, SheetData> = {};
  const valueRanges = batchRes.data.valueRanges || [];
  let totalDataRowsBefore = 0;

  for (let i = 0; i < sheetNames.length; i++) {
    const sName = sheetNames[i];
    const vr = valueRanges[i];
    const vals = vr.values || [];
    const headers = (vals[0] || []).map(v => String(v).trim());
    const rows = vals.slice(1);
    liveDataBefore[sName] = { headers, rows };
    totalDataRowsBefore += rows.length;
    console.log(`[BEFORE] Sheet: "${sName}" -> Headers: ${headers.length} cols, Data Rows: ${rows.length}`);
  }

  console.log(`\nTotal Live Data Rows Before Wipe: ${totalDataRowsBefore}`);

  // STEP 2: CREATE & VERIFY TIMESTAMPED BACKUP
  console.log('\n=== STEP 2: CREATE MANDATORY PRE-WIPE BACKUP ===');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const backupFile = path.join(backupDir, `phase-2d-pre-clean-slate-backup-${timestamp}.json`);
  fs.writeFileSync(backupFile, JSON.stringify({
    timestamp,
    spreadsheetId,
    title,
    worksheets: sheetList,
    data: liveDataBefore,
  }, null, 2));

  const backupSize = fs.statSync(backupFile).size;
  console.log(`Backup File: ${backupFile}`);
  console.log(`Backup Size: ${backupSize} bytes`);

  // Deserialization verification
  const verifyBackup = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));
  const backupKeys = Object.keys(verifyBackup.data);
  if (backupKeys.length !== sheetNames.length) {
    console.error('BLOCKED: Backup verification failed. Sheet count mismatch.');
    process.exit(1);
  }
  let verifiedRows = 0;
  for (const k of backupKeys) {
    verifiedRows += verifyBackup.data[k].rows.length;
  }
  if (verifiedRows !== totalDataRowsBefore) {
    console.error('BLOCKED: Backup verification failed. Row count mismatch.');
    process.exit(1);
  }
  console.log(`Backup Verification: PASSED (${backupKeys.length}/${sheetNames.length} sheets, ${verifiedRows}/${totalDataRowsBefore} rows verified).`);

  // STEP 3: EXECUTE ZERO-ROW CLEAN SLATE
  console.log('\n=== STEP 3: EXECUTING ZERO-ROW CLEAN SLATE RESET ===');
  let clearOps = 0;
  let updateOps = 0;
  let totalRowsCleared = 0;

  for (const sName of sheetNames) {
    const sData = liveDataBefore[sName];
    const headers = sData.headers;
    const oldRowCount = sData.rows.length;

    if (sName === 'Sheet1' && headers.length === 0) {
      console.log(`Sheet "${sName}" is default empty tab. Leaving unchanged.`);
      continue;
    }

    console.log(`Wiping sheet "${sName}": Clearing ${oldRowCount} data rows and retaining ${headers.length} headers...`);

    // 1. Clear everything from row 1 to bottom
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `'${sName}'!A1:ZZ1000`,
    });
    clearOps++;

    // 2. Write ONLY the header row at A1
    if (headers.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${sName}'!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [headers],
        },
      });
      updateOps++;
    }

    totalRowsCleared += oldRowCount;
  }

  console.log(`\nWipe Operations Completed. Total Clears: ${clearOps}, Header Writes: ${updateOps}, Rows Cleared: ${totalRowsCleared}`);

  // STEP 4: POST-WIPE LIVE READ-ONLY VERIFICATION
  console.log('\n=== STEP 4: FIRST POST-WIPE LIVE VERIFICATION ===');
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

  const liveDataAfter: Record<string, { headers: string[]; rowsCount: number; headersPreserved: boolean }> = {};
  let totalDataRowsRemaining = 0;

  for (let i = 0; i < postSheetList.length; i++) {
    const sName = postSheetList[i].title;
    const vr = postBatchRes.data.valueRanges?.[i];
    const vals = vr?.values || [];
    const headers = (vals[0] || []).map(v => String(v).trim());
    const rows = vals.slice(1);

    const origHeaders = liveDataBefore[sName]?.headers || [];
    const headersPreserved = sName === 'Sheet1' && origHeaders.length === 0 ? true : (
      headers.length === origHeaders.length &&
      headers.every((h, idx) => h === origHeaders[idx])
    );

    liveDataAfter[sName] = {
      headers,
      rowsCount: rows.length,
      headersPreserved,
    };

    totalDataRowsRemaining += rows.length;
    console.log(`[VERIFY 1] Sheet: "${sName}" -> Headers Preserved: ${headersPreserved ? 'YES' : 'NO'} (${headers.length} cols), Data Rows: ${rows.length}`);
  }

  console.log(`Total Data Rows Remaining: ${totalDataRowsRemaining}`);

  if (totalDataRowsRemaining > 0) {
    console.error(`BLOCKED: First verification failed. ${totalDataRowsRemaining} data rows still present.`);
    process.exit(1);
  }

  // STEP 5: SECOND LIVE VERIFICATION (Confirm stability & zero reseeding)
  console.log('\n=== STEP 5: SECOND LIVE VERIFICATION (RE-READ) ===');
  const verify2BatchRes = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges: postRanges,
    valueRenderOption: 'UNFORMATTED_VALUE',
  });

  let totalDataRowsRemaining2 = 0;
  for (let i = 0; i < postSheetList.length; i++) {
    const sName = postSheetList[i].title;
    const vr = verify2BatchRes.data.valueRanges?.[i];
    const vals = vr?.values || [];
    const rows = vals.slice(1);
    totalDataRowsRemaining2 += rows.length;
    console.log(`[VERIFY 2] Sheet: "${sName}" -> Data Rows: ${rows.length}`);
  }

  console.log(`Total Data Rows Remaining (2nd Verification): ${totalDataRowsRemaining2}`);

  if (totalDataRowsRemaining2 > 0) {
    console.error(`BLOCKED: Second verification failed. ${totalDataRowsRemaining2} data rows detected.`);
    process.exit(1);
  }

  // Generate Report
  const finalReport = {
    worksheetsBeforeCount: sheetList.length,
    worksheetsAfterCount: postSheetList.length,
    sheetNames,
    backupFile,
    backupSize,
    backupVerified: true,
    totalDataRowsBefore,
    totalRowsCleared,
    totalDataRowsRemaining: totalDataRowsRemaining2,
    perSheetSummary: Object.fromEntries(
      sheetNames.map(s => [
        s,
        {
          rowsBefore: liveDataBefore[s]?.rows?.length || 0,
          rowsAfter: liveDataAfter[s]?.rowsCount || 0,
          headersCount: liveDataAfter[s]?.headers?.length || 0,
          headersPreserved: liveDataAfter[s]?.headersPreserved || false,
        }
      ])
    ),
    worksheetsDeleted: 0,
    worksheetsRenamed: 0,
    clearOps,
    updateOps,
    timestamp,
  };

  const reportFile = path.join(backupDir, `phase-2d-clean-slate-report-${timestamp}.json`);
  fs.writeFileSync(reportFile, JSON.stringify(finalReport, null, 2));
  console.log(`\nPhase 2D Reset Completed Successfully. Report written to ${reportFile}`);
}

main().catch(err => {
  console.error('Phase 2D Reset Failed:', err);
  process.exit(1);
});
