import { google } from 'googleapis';

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

  const metaRes = await sheets.spreadsheets.get({ spreadsheetId });
  const liveSheets = metaRes.data.sheets || [];
  const currentNames = liveSheets.map(s => s.properties?.title || '');

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

  console.log('====================================================');
  console.log('1. DETAILED INSPECTION OF TOPICS TABLE');
  console.log('====================================================');
  const topicHeaders = sheetData['TOPICS']?.headers || [];
  const topicRows = sheetData['TOPICS']?.rows || [];
  console.log('TOPIC Headers:', topicHeaders);
  console.log(`Total Topic Rows: ${topicRows.length}`);

  const testTopicRows: Array<{ rowIndex: number; row: any[] }> = [];
  const canonicalTopicRows: Array<{ rowIndex: number; row: any[] }> = [];

  topicRows.forEach((row, idx) => {
    const id = String(row[0] || '');
    if (id === 'TP-MATH' || id === 'TP-SCIENCE' || id.startsWith('TP-') || !id.startsWith('BP-TOP-')) {
      testTopicRows.push({ rowIndex: idx + 2, row });
    } else {
      canonicalTopicRows.push({ rowIndex: idx + 2, row });
    }
  });

  console.log(`Canonical Topics Count (BP-TOP-*): ${canonicalTopicRows.length}`);
  console.log(`Test/Duplicate Topics Count: ${testTopicRows.length}`);
  console.log('\n--- Duplicate / Test Topic Details ---');
  testTopicRows.forEach(item => {
    console.log(`Row ${item.rowIndex}: ID=${item.row[0]}, ParentCategory=${item.row[1]}, Name="${item.row[2]}", Slug="${item.row[3]}", CreatedAt=${item.row[7]}, UpdatedAt=${item.row[8]}`);
  });

  console.log('\n====================================================');
  console.log('2. DETAILED INSPECTION OF SUBTOPICS TABLE');
  console.log('====================================================');
  const subtopicHeaders = sheetData['SUBTOPICS']?.headers || [];
  const subtopicRows = sheetData['SUBTOPICS']?.rows || [];
  console.log('SUBTOPIC Headers:', subtopicHeaders);
  console.log(`Total Subtopic Rows: ${subtopicRows.length}`);

  const testSubtopicRows: Array<{ rowIndex: number; row: any[] }> = [];
  const canonicalSubtopicRows: Array<{ rowIndex: number; row: any[] }> = [];

  subtopicRows.forEach((row, idx) => {
    const id = String(row[0] || '');
    if (id === 'STP-ALGEBRA' || id === 'STP-PHYSICS' || id.startsWith('STP-') || !id.startsWith('BP-SUB-')) {
      testSubtopicRows.push({ rowIndex: idx + 2, row });
    } else {
      canonicalSubtopicRows.push({ rowIndex: idx + 2, row });
    }
  });

  console.log(`Canonical Subtopics Count (BP-SUB-*): ${canonicalSubtopicRows.length}`);
  console.log(`Test/Duplicate Subtopics Count: ${testSubtopicRows.length}`);
  console.log('\n--- Duplicate / Test Subtopic Details ---');
  testSubtopicRows.forEach(item => {
    console.log(`Row ${item.rowIndex}: ID=${item.row[0]}, ParentTopic=${item.row[1]}, Name="${item.row[2]}", Slug="${item.row[3]}", CreatedAt=${item.row[8]}, UpdatedAt=${item.row[9]}`);
  });

  console.log('\n====================================================');
  console.log('3. CROSS-SHEET REFERENCE AUDIT');
  console.log('====================================================');
  // Check every other sheet for occurrences of test IDs: TP-MATH, TP-SCIENCE, STP-ALGEBRA, STP-PHYSICS, CAT-MATH, CAT-SCIENCE
  const targetTestIds = ['TP-MATH', 'TP-SCIENCE', 'STP-ALGEBRA', 'STP-PHYSICS', 'CAT-MATH', 'CAT-SCIENCE'];

  for (const [sName, sContent] of Object.entries(sheetData)) {
    if (sName === 'TOPICS' || sName === 'SUBTOPICS') continue;
    let referencesFound = 0;
    const matchDetails: string[] = [];

    sContent.rows.forEach((row, rIdx) => {
      row.forEach((cell, cIdx) => {
        const strCell = String(cell || '');
        for (const testId of targetTestIds) {
          if (strCell === testId || strCell.includes(testId)) {
            referencesFound++;
            matchDetails.push(`Row ${rIdx + 2}, Col ${sContent.headers[cIdx] || cIdx}: "${strCell}" matches ${testId}`);
          }
        }
      });
    });

    console.log(`Sheet [${sName}]: ${referencesFound} reference(s) to test taxonomy IDs.`);
    if (matchDetails.length > 0) {
      matchDetails.forEach(m => console.log(`   ${m}`));
    }
  }
}

main().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
