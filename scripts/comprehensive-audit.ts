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
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  const metaRes = await sheets.spreadsheets.get({ spreadsheetId });
  const sheetList = (metaRes.data.sheets || []).map((s) => ({
    title: s.properties?.title || '',
    sheetId: s.properties?.sheetId,
    rowCount: s.properties?.gridProperties?.rowCount || 0,
    columnCount: s.properties?.gridProperties?.columnCount || 0,
  }));

  console.log('=== SPREADSHEET AUDIT SUMMARY ===');
  console.log(`Spreadsheet ID: ${spreadsheetId}`);
  console.log(`Total Worksheets: ${sheetList.length}`);

  const ranges = sheetList.map(s => `'${s.title}'!A1:ZZ1000`);
  const batchRes = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges,
    valueRenderOption: 'UNFORMATTED_VALUE',
  });

  const sheetData: Record<string, { headers: string[]; rows: any[][] }> = {};
  const valueRanges = batchRes.data.valueRanges || [];

  for (let i = 0; i < sheetList.length; i++) {
    const sName = sheetList[i].title;
    const vr = valueRanges[i];
    const vals = vr.values || [];
    const headers = (vals[0] || []).map(v => String(v).trim());
    const rows = vals.slice(1);
    sheetData[sName] = { headers, rows };
  }

  // 1. Audit categories, topics, subtopics
  console.log('\n=== TAXONOMY DETAILED AUDIT ===');
  const categories = sheetData['CATEGORIES']?.rows || [];
  console.log(`CATEGORIES: ${categories.length} rows`);
  categories.forEach(r => console.log('  CAT:', r.slice(0, 5)));

  const topics = sheetData['TOPICS']?.rows || [];
  console.log(`TOPICS: ${topics.length} rows`);
  const mathTopics = topics.filter(r => String(r[0]).includes('MATH') || String(r[1]).includes('MATH') || String(r[2]).toLowerCase().includes('math'));
  console.log(`  Matching MATH topics: ${mathTopics.length}`);
  mathTopics.forEach(r => console.log('    ', r.slice(0, 6)));

  const scienceTopics = topics.filter(r => String(r[0]).includes('SCIENCE') || String(r[1]).includes('SCIENCE') || String(r[2]).toLowerCase().includes('science'));
  console.log(`  Matching SCIENCE topics: ${scienceTopics.length}`);
  scienceTopics.forEach(r => console.log('    ', r.slice(0, 6)));

  // Check duplicate IDs or duplicate (Name + Parent) in TOPICS
  const topicIdCounts = new Map<string, number>();
  const topicNameCounts = new Map<string, number>();
  topics.forEach(r => {
    const id = String(r[0] || '').trim();
    const name = String(r[2] || '').trim();
    topicIdCounts.set(id, (topicIdCounts.get(id) || 0) + 1);
    topicNameCounts.set(name, (topicNameCounts.get(name) || 0) + 1);
  });
  const dupTopicIds = Array.from(topicIdCounts.entries()).filter(([k, v]) => v > 1);
  const dupTopicNames = Array.from(topicNameCounts.entries()).filter(([k, v]) => v > 1);
  console.log('Duplicate Topic IDs in Live Sheet:', dupTopicIds);
  console.log('Duplicate Topic Names in Live Sheet:', dupTopicNames);

  // Subtopics
  const subtopics = sheetData['SUBTOPICS']?.rows || [];
  console.log(`SUBTOPICS: ${subtopics.length} rows`);
  const algebraSubtopics = subtopics.filter(r => String(r[0]).includes('ALGEBRA') || String(r[2]).toLowerCase().includes('algebra'));
  console.log(`  Matching ALGEBRA subtopics: ${algebraSubtopics.length}`);
  algebraSubtopics.forEach(r => console.log('    ', r.slice(0, 6)));

  const physicsSubtopics = subtopics.filter(r => String(r[0]).includes('PHYSICS') || String(r[2]).toLowerCase().includes('physics'));
  console.log(`  Matching PHYSICS subtopics: ${physicsSubtopics.length}`);
  physicsSubtopics.forEach(r => console.log('    ', r.slice(0, 6)));

  const subtopicIdCounts = new Map<string, number>();
  const subtopicNameCounts = new Map<string, number>();
  subtopics.forEach(r => {
    const id = String(r[0] || '').trim();
    const name = String(r[2] || '').trim();
    subtopicIdCounts.set(id, (subtopicIdCounts.get(id) || 0) + 1);
    subtopicNameCounts.set(name, (subtopicNameCounts.get(name) || 0) + 1);
  });
  const dupSubtopicIds = Array.from(subtopicIdCounts.entries()).filter(([k, v]) => v > 1);
  const dupSubtopicNames = Array.from(subtopicNameCounts.entries()).filter(([k, v]) => v > 1);
  console.log('Duplicate Subtopic IDs in Live Sheet:', dupSubtopicIds);
  console.log('Duplicate Subtopic Names in Live Sheet:', dupSubtopicNames);

  // 2. Audit all other sheets for rows and test patterns
  console.log('\n=== ALL WORKSHEETS ROW COUNTS & PATTERNS ===');
  let totalDataRows = 0;
  for (const sName of Object.keys(sheetData)) {
    const { headers, rows } = sheetData[sName];
    totalDataRows += rows.length;
    console.log(`Worksheet: [${sName}] -> Header columns: ${headers.length} | Data rows: ${rows.length}`);
    if (rows.length > 0 && !['USERS', 'CATEGORIES', 'TOPICS', 'SUBTOPICS', 'QUESTION_CONFIG', 'SEQUENCES'].includes(sName)) {
      console.log(`  NON-FOUNDATION ROWS FOUND in ${sName}:`, rows.length);
    }
  }
  console.log(`\nTOTAL DATA ROWS ACROSS ALL SHEETS: ${totalDataRows}`);

  // 3. Sequences
  console.log('\n=== SEQUENCES TABLE AUDIT ===');
  const sequences = sheetData['SEQUENCES']?.rows || [];
  sequences.forEach(s => {
    console.log(`  Entity: ${s[0]} | next_number: ${s[1]} | prefix: ${s[2]} | pad_length: ${s[3]}`);
  });
}

main().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
