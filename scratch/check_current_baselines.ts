import 'dotenv/config';
import { googleSheetsClient } from '../src/lib/google-sheets/client';

async function checkBaselines() {
  const sheets = [
    'ASSIGNMENTS',
    'USERS',
    'QUESTIONS',
    'VIDEOS',
    'SCRIPT',
    'THUMBNAILS',
    'CONTENT_MASTERS',
    'CONTENT_PLANS',
    'CONTENT_BATCHES',
    'WORKFLOW',
    'AUDIT_LOG',
    'SEQUENCES',
    'CATEGORIES',
    'TOPICS',
    'SUBTOPICS',
  ];

  console.log('Current Google Sheets row counts:');
  for (const sheet of sheets) {
    const res = await googleSheetsClient.getRows(sheet);
    console.log(`  ${sheet}: ${res.rows.length}`);
    if (sheet === 'SEQUENCES') {
      const asnRow = res.rows.find((r) => r[0] === 'ASSIGNMENT');
      console.log(`    -> ASSIGNMENT sequence counter: ${asnRow ? asnRow[1] : 'not found'}`);
    }
  }
}

checkBaselines().catch(console.error);
