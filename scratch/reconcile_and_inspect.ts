import 'dotenv/config';
import { googleSheetsClient } from '../src/lib/google-sheets/client';
import { SHEET_SCHEMAS, SHEET_TABS } from '../src/lib/schemas/google-sheets-schema';

async function main() {
  console.log('=== READING AUTHORITATIVE GOOGLE SHEETS STATE ===\n');

  const sheetsToInspect = [
    'QUESTIONS',
    'CONTENT_MASTERS',
    'VIDEOS',
    'QUESTION_VIDEOS',
    'SCRIPT',
    'SCRIPT_VERSIONS',
    'THUMBNAILS',
    'THUMBNAIL_VERSIONS',
    'PINNED_COMMENTS',
    'PINNED_COMMENT_VERSIONS',
    'PUBLISHING',
    'ASSIGNMENTS',
    'WORKFLOW',
    'AUDIT_LOG',
    'SEQUENCES',
    'USERS',
    'SOCIAL_REVIEWS',
  ];

  const counts: Record<string, number> = {};
  for (const sheet of sheetsToInspect) {
    try {
      const res = await googleSheetsClient.getRows(sheet);
      counts[sheet] = res.rows.length;
    } catch (e: any) {
      counts[sheet] = -1;
      console.error(`Error reading ${sheet}:`, e.message);
    }
  }

  console.log('AUTHORITATIVE ROW COUNTS:');
  console.log(JSON.stringify(counts, null, 2));

  // Inspect QUESTIONS physical headers
  console.log('\n=== INSPECTING QUESTIONS WORKSHEET HEADERS ===');
  const qRes = await googleSheetsClient.getRows('QUESTIONS');
  const physicalQHeaders = qRes.headers;
  console.log(`Physical header count: ${physicalQHeaders.length}`);
  console.log('Physical headers:', physicalQHeaders);

  const schemaQ = SHEET_SCHEMAS[SHEET_TABS.QUESTIONS];
  const schemaColNames = schemaQ.columns.map((c) => c.name);
  console.log(`Schema column count: ${schemaColNames.length}`);
  console.log('Schema column names:', schemaColNames);

  const missingInPhysical = schemaColNames.filter((c) => !physicalQHeaders.includes(c));
  const extraInPhysical = physicalQHeaders.filter((c) => !schemaColNames.includes(c));
  console.log('Schema columns missing in physical sheet:', missingInPhysical);
  console.log('Physical columns not in schema:', extraInPhysical);

  // validation_status check
  const valColIdx = physicalQHeaders.indexOf('validation_status');
  console.log(`validation_status physical column index: ${valColIdx}`);

  // Sample values in physical QUESTIONS for validation_status
  const statusValuesCount: Record<string, number> = {};
  if (valColIdx >= 0) {
    for (const r of qRes.rows) {
      const val = r[valColIdx] || '(empty)';
      statusValuesCount[val] = (statusValuesCount[val] || 0) + 1;
    }
    console.log('Existing question rows validation_status distribution:', statusValuesCount);
  } else {
    console.log('Physical sheet does NOT have a validation_status column!');
  }

  // Inspect last 5 rows of QUESTIONS to see what they look like
  console.log('\nLast 3 question rows:');
  for (let i = Math.max(0, qRes.rows.length - 3); i < qRes.rows.length; i++) {
    const r = qRes.rows[i];
    console.log(`Row ${i + 2}: ID=${r[0]}, contentMasterId=${r[1]}, status=${r[24]}, valStatus=${valColIdx >= 0 ? r[valColIdx] : 'N/A'}`);
  }

  // Check SEQUENCES values
  const seqRes = await googleSheetsClient.getRows('SEQUENCES');
  console.log('\n=== SEQUENCES CURRENT STATE ===');
  for (const r of seqRes.rows) {
    console.log(`  ${r[0]}: ${r[1]}`);
  }

  // Check for any potential synthetic records in any sheet
  console.log('\n=== CHECKING FOR RESIDUAL SYNTHETIC RECORDS ===');
  const syntheticKeywords = ['1000005', '1000006', '1788718410580', '1788718410581', 'live-test', 'Speed Math Shortcuts'];
  for (const sheet of sheetsToInspect) {
    const res = await googleSheetsClient.getRows(sheet);
    let found = 0;
    for (let i = 0; i < res.rows.length; i++) {
      const rowStr = JSON.stringify(res.rows[i]);
      if (syntheticKeywords.some((k) => rowStr.includes(k))) {
        console.log(`[RESIDUAL DETECTED] Sheet ${sheet}, Row ${i + 2}: ${rowStr.substring(0, 120)}...`);
        found++;
      }
    }
    if (found === 0) {
      // Clean
    }
  }
  console.log('Residual scan complete.');
}

main().catch(console.error);
