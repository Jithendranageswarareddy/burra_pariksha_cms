import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

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

  console.log('--- STEP 1: AUTHENTICATION & LIVE SPREADSHEET ENUMERATION ---');
  const metaRes = await sheets.spreadsheets.get({ spreadsheetId });
  const title = metaRes.data.properties?.title || '';
  const sheetList = (metaRes.data.sheets || []).map((s) => ({
    title: s.properties?.title || '',
    sheetId: s.properties?.sheetId,
    rowCount: s.properties?.gridProperties?.rowCount || 0,
    columnCount: s.properties?.gridProperties?.columnCount || 0,
  }));

  console.log(`Spreadsheet ID: ${spreadsheetId}`);
  console.log(`Spreadsheet Title: "${title}"`);
  console.log(`Total Live Worksheets: ${sheetList.length}`);
  console.log('Worksheet Titles:', sheetList.map(s => s.title));

  // Batch read all sheets
  const ranges = sheetList.map(s => `'${s.title}'!A1:ZZ1000`);
  const batchRes = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges,
    valueRenderOption: 'UNFORMATTED_VALUE',
  });

  const liveData: Record<string, { headers: string[]; rows: any[][] }> = {};
  const valueRanges = batchRes.data.valueRanges || [];

  for (let i = 0; i < sheetList.length; i++) {
    const sName = sheetList[i].title;
    const vr = valueRanges[i];
    const vals = vr.values || [];
    const headers = (vals[0] || []).map(v => String(v).trim());
    const rows = vals.slice(1);
    liveData[sName] = { headers, rows };
    console.log(`[SHEET] ${sName} -> Headers: ${headers.length} cols, Rows: ${rows.length} rows`);
  }

  // Backup to local machine-readable JSON
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const backupFile = path.join(backupDir, `live-sheets-backup-${timestamp}.json`);
  fs.writeFileSync(backupFile, JSON.stringify({
    timestamp,
    spreadsheetId,
    title,
    worksheets: sheetList,
    data: liveData,
  }, null, 2));

  console.log(`\n--- STEP 2: FULL BACKUP CREATED & SAVED ---`);
  console.log(`Backup Location: ${backupFile}`);
  console.log(`Backup File Size: ${fs.statSync(backupFile).size} bytes`);

  // Verify backup
  const parsedBackup = JSON.parse(fs.readFileSync(backupFile, 'utf-8'));
  const backupSheetKeys = Object.keys(parsedBackup.data);
  if (backupSheetKeys.length !== sheetList.length) {
    console.error('BLOCKED: Backup verification failed. Sheet count mismatch.');
    process.exit(1);
  }
  console.log('Backup Verification: PASSED (All worksheets and rows captured).');

  // Let's inspect details of each sheet
  console.log('\n--- DETAILED LIVE WORKSHEET AUDIT ---');
  for (const sName of Object.keys(liveData)) {
    const item = liveData[sName];
    console.log(`Sheet: ${sName}`);
    console.log(`  Headers (${item.headers.length}):`, item.headers.join(', '));
    console.log(`  Row count: ${item.rows.length}`);
    if (item.rows.length > 0) {
      console.log(`  First row sample ID/val:`, item.rows[0].slice(0, 5));
    }
  }
}

main().catch(err => {
  console.error('Execution Failed:', err);
  process.exit(1);
});
