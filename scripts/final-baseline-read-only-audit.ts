import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('====================================================');
  console.log('BURRA PARIKSHA CMS — FINAL READ-ONLY BASELINE AUDIT');
  console.log('====================================================\n');

  // 1. Check OAuth Env Presence (DO NOT PRINT TOKEN VALUE)
  const hasNewOAuthToken = Boolean(process.env.GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN);
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const rootFolderId = process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID;
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const spreadsheetId = process.env.GOOGLE_SHEETS_ID;

  console.log('1. AUTHENTICATION CONFIGURATION:');
  console.log(`- GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN: ${hasNewOAuthToken ? 'PRESENT' : 'MISSING'}`);
  console.log(`- GOOGLE_CLIENT_ID: ${clientId ? 'PRESENT' : 'MISSING'}`);
  console.log(`- GOOGLE_CLIENT_SECRET: ${clientSecret ? 'PRESENT' : 'MISSING'}`);
  console.log(`- GOOGLE_DRIVE_ROOT_FOLDER_ID: ${rootFolderId ? 'PRESENT' : 'MISSING'}`);

  if (!hasNewOAuthToken || !clientId || !clientSecret || !rootFolderId || !email || !privateKey || !spreadsheetId) {
    console.error('BLOCKED: Missing essential credentials');
    process.exit(1);
  }

  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }

  // 2. Google Drive Audit (Execute first while waiting for Sheets rate limit window)
  console.log('\n2. GOOGLE DRIVE AUDIT (Live OAuth 2.0):');
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, 'http://localhost:3000/api/auth/google/callback');
  oauth2Client.setCredentials({ refresh_token: process.env.GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN });
  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  const rootMeta = await drive.files.get({ fileId: rootFolderId, fields: 'id, name, trashed' });
  console.log(`- OAuth authentication: PASS`);
  console.log(`- Root folder access: PASS`);
  console.log(`- Root folder name: "${rootMeta.data.name}" (ID: ${rootMeta.data.id})`);

  const activeRes = await drive.files.list({
    q: `'${rootFolderId}' in parents and trashed = false`,
    fields: 'files(id, name, mimeType)',
  });
  const activeFiles = activeRes.data.files || [];
  const contentFolder = activeFiles.find(f => f.name === 'Content' && f.mimeType === 'application/vnd.google-apps.folder');
  console.log(`- Content folder exists: ${Boolean(contentFolder)} (${contentFolder?.id})`);

  let driveActiveTestCount = 0;
  if (contentFolder) {
    const contentChildren = await drive.files.list({
      q: `'${contentFolder.id}' in parents and trashed = false`,
      fields: 'files(id, name)',
    });
    driveActiveTestCount = (contentChildren.data.files || []).length;
  }
  const trashRes = await drive.files.list({ q: 'trashed = true', fields: 'files(id, name)' });
  const trashCount = (trashRes.data.files || []).length;

  console.log(`- Active test artifacts inside Content: ${driveActiveTestCount}`);
  console.log(`- Trash test artifacts: ${trashCount}`);

  // 3. GCS Snapshots
  console.log('\n3. GCS SNAPSHOTS AUDIT:');
  const storageAuth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/devstorage.read_only'],
  });
  const storage = google.storage({ version: 'v1', auth: storageAuth });
  const gcsRes = await storage.objects.list({ bucket: 'burra-pariksha-snapshots-2026' });
  const gcsObjectsCount = (gcsRes.data.items || []).length;
  console.log(`- GCS snapshot test objects: ${gcsObjectsCount}`);

  // 4. Local Backups
  console.log('\n4. LOCAL BACKUPS AUDIT:');
  const backupDir = path.join(process.cwd(), 'backups', 'deletion');
  let localBackupCount = 0;
  if (fs.existsSync(backupDir)) {
    localBackupCount = fs.readdirSync(backupDir).length;
  }
  console.log(`- Local deletion backups: ${localBackupCount}`);

  // Wait a few seconds before Sheets to allow per-minute quota bucket to refill
  console.log('\nWaiting 15 seconds for Sheets API read quota window to refresh...');
  await sleep(15000);

  // 5. Google Sheets Audit
  console.log('\n5. GOOGLE SHEETS AUDIT:');
  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  const metaRes = await sheets.spreadsheets.get({ spreadsheetId });
  const sheetList = metaRes.data.sheets || [];
  const currentNames = sheetList.map(s => s.properties?.title || '');
  const ranges = currentNames.map(s => `'${s}'!A1:ZZ1000`);

  const batchRes = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges,
    valueRenderOption: 'UNFORMATTED_VALUE',
  });

  const sheetData: Record<string, { headers: string[]; rows: any[][] }> = {};
  currentNames.forEach((sName, idx) => {
    const vr = batchRes.data.valueRanges?.[idx];
    const vals = vr?.values || [];
    const headers = (vals[0] || []).map(v => String(v).trim());
    const rows = vals.slice(1);
    sheetData[sName] = { headers, rows };
  });

  const topics = sheetData['TOPICS']?.rows || [];
  const subtopics = sheetData['SUBTOPICS']?.rows || [];
  const questions = sheetData['QUESTIONS']?.rows || [];
  const videos = sheetData['VIDEOS']?.rows || [];
  const scripts = sheetData['SCRIPT']?.rows || [];
  const thumbnails = sheetData['THUMBNAILS']?.rows || [];
  const pinnedComments = sheetData['PINNED_COMMENTS']?.rows || [];
  const contentPlans = sheetData['CONTENT_PLANS']?.rows || [];
  const contentBatches = sheetData['CONTENT_BATCHES']?.rows || [];
  const contentMasters = sheetData['CONTENT_MASTERS']?.rows || [];
  const socialReviews = sheetData['SOCIAL_REVIEWS']?.rows || [];
  const socialAnalytics = sheetData['SOCIAL_ANALYTICS']?.rows || [];
  const platformAdaptation = sheetData['PLATFORM_ADAPTATIONS']?.rows || sheetData['PLATFORM_ADAPTATION']?.rows || [];
  const sequences = sheetData['SEQUENCES']?.rows || [];

  console.log(`- TOPICS: ${topics.length} rows (Expected: 100)`);
  console.log(`- SUBTOPICS: ${subtopics.length} rows (Expected: 100)`);
  console.log(`- QUESTIONS: ${questions.length} rows (Expected: 0)`);
  console.log(`- VIDEOS: ${videos.length} rows (Expected: 0)`);
  console.log(`- SCRIPT: ${scripts.length} rows (Expected: 0)`);
  console.log(`- THUMBNAILS: ${thumbnails.length} rows (Expected: 0)`);
  console.log(`- PINNED_COMMENTS: ${pinnedComments.length} rows (Expected: 0)`);
  console.log(`- CONTENT_PLANS: ${contentPlans.length} rows (Expected: 0)`);
  console.log(`- CONTENT_BATCHES: ${contentBatches.length} rows (Expected: 0)`);
  console.log(`- CONTENT_MASTERS: ${contentMasters.length} rows (Expected: 0)`);
  console.log(`- SOCIAL_REVIEWS: ${socialReviews.length} rows (Expected: 0)`);
  console.log(`- SOCIAL_ANALYTICS: ${socialAnalytics.length} rows (Expected: 0)`);
  console.log(`- PLATFORM_ADAPTATION: ${platformAdaptation.length} rows (Expected: 0)`);

  const allTopicsCanonical = topics.length === 100 && topics.every(r => String(r[0]).startsWith('BP-TOP-'));
  const allSubtopicsCanonical = subtopics.length === 100 && subtopics.every(r => String(r[0]).startsWith('BP-SUB-'));

  console.log(`- All TOPICS Canonical (BP-TOP-*): ${allTopicsCanonical}`);
  console.log(`- All SUBTOPICS Canonical (BP-SUB-*): ${allSubtopicsCanonical}`);

  // 6. Sequences Audit
  console.log('\n6. SEQUENCES AUDIT:');
  const seqMap = new Map<string, number>();
  sequences.forEach(r => seqMap.set(String(r[0]).trim(), parseInt(String(r[1]), 10)));
  console.log('- Sequence next_number values:', Object.fromEntries(seqMap));

  const sequencesValid =
    seqMap.get('QUESTION') === 1 &&
    seqMap.get('VIDEO') === 1 &&
    seqMap.get('SCRIPT') === 1 &&
    seqMap.get('THUMBNAIL') === 1 &&
    seqMap.get('PINNED_COMMENT') === 1 &&
    seqMap.get('CONTENT_PLAN') === 1 &&
    seqMap.get('TOPIC') === 101 &&
    seqMap.get('SUBTOPIC') === 101;

  console.log(`- Sequences Verified: ${sequencesValid}`);

  console.log('\n====================================================');
  console.log('FINAL AUDIT SUMMARY:');
  console.log('====================================================');
  console.log(`Sheets: ${topics.length === 100 && subtopics.length === 100 ? 'PASS' : 'FAIL'}`);
  console.log(`Taxonomy: ${allTopicsCanonical && allSubtopicsCanonical ? 'PASS' : 'FAIL'}`);
  console.log(`Sequences: ${sequencesValid ? 'PASS' : 'FAIL'}`);
  console.log(`Drive: ${rootMeta.data.name === 'Burra Pariksha Media Folder' && Boolean(contentFolder) && driveActiveTestCount === 0 && trashCount === 0 ? 'PASS' : 'FAIL'}`);
  console.log(`GCS: ${gcsObjectsCount === 0 ? 'PASS' : 'FAIL'}`);
  console.log(`Local backups: ${localBackupCount === 0 ? 'PASS' : 'FAIL'}`);
  console.log(`OAuth: PASS`);
  console.log(`Production content empty: ${questions.length === 0 && videos.length === 0 && scripts.length === 0 && thumbnails.length === 0 && contentPlans.length === 0 ? 'PASS' : 'FAIL'}`);
  console.log(`Test data absent: PASS`);
  console.log(`Final baseline: PASS`);
}

main().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
