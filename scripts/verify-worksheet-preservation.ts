import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

async function main() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

  if (!email || !privateKey || !spreadsheetId) {
    console.error('BLOCKED: Missing credentials');
    process.exit(1);
  }

  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  console.log('--- 1. LIVE SPREADSHEET GET METADATA ---');
  const metaRes = await sheets.spreadsheets.get({ spreadsheetId });
  const liveSheets = metaRes.data.sheets || [];
  const currentSheetList = liveSheets.map(s => ({
    sheetId: s.properties?.sheetId,
    title: s.properties?.title || '',
    index: s.properties?.index,
    rowCount: s.properties?.gridProperties?.rowCount,
    columnCount: s.properties?.gridProperties?.columnCount,
  }));

  console.log('Current Exact Worksheet Count:', currentSheetList.length);
  console.log('Current Sheet List:', JSON.stringify(currentSheetList, null, 2));

  const currentNames = currentSheetList.map(s => s.title);
  const sheet1Exists = currentNames.includes('Sheet1');
  console.log('Sheet1 Exists:', sheet1Exists);

  console.log('\n--- 2. READ ALL VALUES FROM EVERY SHEET ---');
  const ranges = currentNames.map(s => `'${s}'!A1:ZZ1000`);
  const batchRes = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges,
    valueRenderOption: 'UNFORMATTED_VALUE',
  });

  const perSheetStatus: Record<string, any> = {};
  let totalDataRowsRemaining = 0;

  currentNames.forEach((sName, idx) => {
    const vr = batchRes.data.valueRanges?.[idx];
    const vals = vr?.values || [];
    const headers = vals[0] || [];
    const dataRows = vals.slice(1);
    totalDataRowsRemaining += dataRows.length;
    perSheetStatus[sName] = {
      sheetId: currentSheetList[idx].sheetId,
      headersCount: headers.length,
      headersSample: headers.slice(0, 5),
      dataRowsCount: dataRows.length,
    };
  });

  console.log('Per Sheet Status:', JSON.stringify(perSheetStatus, null, 2));
  console.log('Total Data Rows Remaining:', totalDataRowsRemaining);

  console.log('\n--- 3. FORENSIC AUDIT OF BACKUP ARTIFACTS (TRACKING SHEET1) ---');
  const backupDir = path.join(process.cwd(), 'backups');
  const backupFiles = fs.readdirSync(backupDir).filter(f => f.endsWith('.json')).sort();
  for (const bf of backupFiles) {
    const p = path.join(backupDir, bf);
    const content = JSON.parse(fs.readFileSync(p, 'utf-8'));
    const wList = content.worksheets || (content.data ? Object.keys(content.data) : []);
    const hasSheet1 = Array.isArray(wList)
      ? wList.some((w: any) => (typeof w === 'string' ? w === 'Sheet1' : w.title === 'Sheet1'))
      : false;
    const count = Array.isArray(wList) ? wList.length : Object.keys(wList).length;
    console.log(`Backup: ${bf} | Worksheets Count: ${count} | Contains Sheet1: ${hasSheet1}`);
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
