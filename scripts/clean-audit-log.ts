import { google } from 'googleapis';

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

  console.log('=== STEP 1: CLEAR AUDIT_LOG DATA ROWS (A2:ZZ1000) ===');
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `'AUDIT_LOG'!A2:ZZ1000`,
  });
  console.log('AUDIT_LOG data rows cleared successfully. Header at row 1 preserved.');

  console.log('\n=== STEP 2: LIVE READ-ONLY VERIFICATION OF ALL 23 SHEETS ===');
  const targetSheets = [
    'USERS',
    'CATEGORIES',
    'TOPICS',
    'SUBTOPICS',
    'QUESTIONS',
    'QUESTION_VIDEOS',
    'VIDEOS',
    'SCRIPT',
    'SCRIPT_VERSIONS',
    'THUMBNAILS',
    'THUMBNAIL_VERSIONS',
    'PINNED_COMMENTS',
    'PINNED_COMMENT_VERSIONS',
    'WORKFLOW',
    'ASSIGNMENTS',
    'PUBLISHING',
    'AUDIT_LOG',
    'SEQUENCES',
    'CONTENT_PLANS',
    'CONTENT_BATCHES',
    'CONTENT_MASTERS',
    'QUESTION_VALIDATIONS',
    'SOCIAL_REVIEWS',
  ];

  const ranges = targetSheets.map(s => `'${s}'!A1:ZZ1000`);
  const batchRes = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges,
    valueRenderOption: 'UNFORMATTED_VALUE',
  });

  let totalRemainingRows = 0;
  const verificationResults: Record<string, any> = {};

  targetSheets.forEach((sName, idx) => {
    const vr = batchRes.data.valueRanges?.[idx];
    const vals = vr?.values || [];
    const headers = vals[0] || [];
    const dataRows = vals.slice(1);
    totalRemainingRows += dataRows.length;

    verificationResults[sName] = {
      headerCount: headers.length,
      headersSample: headers.slice(0, 4),
      headerPreserved: headers.length > 0,
      dataRowsRemaining: dataRows.length,
    };
  });

  console.log('Verification Results:', JSON.stringify(verificationResults, null, 2));
  console.log(`\nTOTAL REMAINING DATA ROWS ACROSS ALL 23 SHEETS: ${totalRemainingRows}`);

  if (totalRemainingRows === 0) {
    console.log('\nSUCCESS: All 23 worksheets contain zero data rows with headers preserved.');
  } else {
    console.error(`\nFAILURE: ${totalRemainingRows} data rows remain.`);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Error during final cleanup:', err);
  process.exit(1);
});
