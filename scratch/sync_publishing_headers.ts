import 'dotenv/config';
import { googleSheetsClient } from '../src/lib/google-sheets/client';
import { SHEET_SCHEMAS, SHEET_TABS, SheetTabName } from '../src/lib/schemas/google-sheets-schema';

const EXPECTED_EXISTING_20_HEADERS = [
  'id',
  'video_id',
  'question_id',
  'video_title',
  'final_video_status',
  'youtube_status',
  'youtube_url',
  'youtube_published_at',
  'instagram_status',
  'instagram_url',
  'instagram_published_at',
  'facebook_status',
  'facebook_url',
  'facebook_published_at',
  'pinned_comment_ready',
  'thumbnail_ready',
  'completed_platforms_count',
  'total_platforms_count',
  'created_at',
  'updated_at',
];

const REQUIRED_12_MISSING_HEADERS = [
  'youtube_scheduled_at',          // U1
  'youtube_last_failure_reason',   // V1
  'youtube_retry_count',           // W1
  'youtube_failed_at',             // X1
  'instagram_scheduled_at',        // Y1
  'instagram_last_failure_reason', // Z1
  'instagram_retry_count',         // AA1
  'instagram_failed_at',           // AB1
  'facebook_scheduled_at',         // AC1
  'facebook_last_failure_reason',  // AD1
  'facebook_retry_count',          // AE1
  'facebook_failed_at',            // AF1
];

const EXPECTED_32_HEADERS = [
  ...EXPECTED_EXISTING_20_HEADERS,
  ...REQUIRED_12_MISSING_HEADERS,
];

async function getSheetCounts(): Promise<Record<string, number>> {
  const tabs: SheetTabName[] = [
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
  ];

  const counts: Record<string, number> = {};
  for (const tab of tabs) {
    const res = await googleSheetsClient.getRows(tab);
    counts[tab] = res.rows.length;
  }
  return counts;
}

async function main() {
  console.log('================================================================');
  console.log('PHASE 13 — PRE-LIVE PUBLISHING WORKSHEET HEADER SYNCHRONIZATION');
  console.log('================================================================\n');

  // Step 1: Baseline row counts across all worksheets
  console.log('--- Step 1: Baseline Row Counts (Pre-Sync) ---');
  const preCounts = await getSheetCounts();
  console.log('Pre-sync sheet counts:', JSON.stringify(preCounts, null, 2));

  // Step 2: Read current PUBLISHING headers
  console.log('\n--- Step 2: Reading Current PUBLISHING Row 1 Headers ---');
  googleSheetsClient.invalidateRowCache('PUBLISHING');
  const currentHeaders = await googleSheetsClient.getHeaders('PUBLISHING');
  console.log(`Current PUBLISHING header count: ${currentHeaders.length}`);
  console.log('Current headers:', currentHeaders);

  // Step 3: Validate existing 20 headers match expected layout
  console.log('\n--- Step 3: Validating Existing 20 Headers ---');
  if (currentHeaders.length < 20) {
    throw new Error(`UNEXPECTED: PUBLISHING sheet has only ${currentHeaders.length} headers, expected at least 20.`);
  }

  const existing20 = currentHeaders.slice(0, 20).map((h) => h.trim());
  const existingMatches = EXPECTED_EXISTING_20_HEADERS.every(
    (exp, idx) => exp.toLowerCase() === existing20[idx]?.toLowerCase()
  );
  if (!existingMatches) {
    console.error('Mismatch in existing 20 headers:');
    console.error('Expected:', EXPECTED_EXISTING_20_HEADERS);
    console.error('Found:   ', existing20);
    throw new Error('STOP: Existing 20 headers do not match expected schema order!');
  }
  console.log('[PASS] Existing 20 headers match expected schema and order exactly.');

  // Step 4: Check if any of the 12 missing headers already exist
  console.log('\n--- Step 4: Checking Required 12 Extension Headers ---');
  const lowerCurrent = currentHeaders.map((h) => h.toLowerCase());
  const toAdd = REQUIRED_12_MISSING_HEADERS.filter((h) => !lowerCurrent.includes(h.toLowerCase()));
  console.log(`Headers to append: ${toAdd.length} of ${REQUIRED_12_MISSING_HEADERS.length}`);
  console.log('To append:', toAdd);

  if (toAdd.length === 0) {
    console.log('All 12 extension headers are already present in PUBLISHING worksheet!');
  } else if (toAdd.length !== 12) {
    console.warn(`WARNING: Partial headers present. Missing: ${toAdd.length}`);
  }

  // Step 5: Construct new full header row (exactly 32 columns)
  const newHeaders = [...currentHeaders, ...toAdd];
  console.log(`\nNew total header count will be: ${newHeaders.length} (Expected: ${EXPECTED_32_HEADERS.length})`);

  // Verify all 32 expected headers match position by position
  const exact32Match =
    newHeaders.length === EXPECTED_32_HEADERS.length &&
    newHeaders.every((h, idx) => h.toLowerCase() === EXPECTED_32_HEADERS[idx].toLowerCase());

  if (!exact32Match) {
    console.error('Prepared headers do not match expected 32 layout:');
    console.error('Prepared:', newHeaders);
    console.error('Expected:', EXPECTED_32_HEADERS);
    throw new Error('STOP: Prepared headers do not match expected 32-column order!');
  }

  // Also verify that every column defined in SHEET_SCHEMAS[SHEET_TABS.PUBLISHING] is present
  const schemaExpectedCols = SHEET_SCHEMAS[SHEET_TABS.PUBLISHING].columns.map((c) => c.name.toLowerCase());
  const missingFromSchema = schemaExpectedCols.filter((col) => !newHeaders.map((h) => h.toLowerCase()).includes(col));
  if (missingFromSchema.length > 0) {
    throw new Error(`STOP: Missing columns from application schema: ${missingFromSchema.join(', ')}`);
  }
  console.log('[PASS] Prepared headers contain all 32 columns defined in application schema.');

  // Step 6: Safely update Row 1
  if (toAdd.length > 0) {
    console.log('\n--- Step 6: Updating Row 1 in Google Sheets PUBLISHING Worksheet ---');
    googleSheetsClient.invalidateRowCache('PUBLISHING');
    await googleSheetsClient.updateRow('PUBLISHING', 1, newHeaders);
    googleSheetsClient.invalidateRowCache('PUBLISHING');
    console.log('[PASS] Row 1 updated successfully in Google Sheets.');
  }

  // Step 7: Re-read Row 1 after update
  console.log('\n--- Step 7: Verifying Row 1 After Update ---');
  googleSheetsClient.invalidateRowCache('PUBLISHING');
  const verifiedHeaders = await googleSheetsClient.getHeaders('PUBLISHING');
  console.log(`Verified header count: ${verifiedHeaders.length}`);
  console.log('Verified headers:', verifiedHeaders);

  const postMatch =
    verifiedHeaders.length === EXPECTED_32_HEADERS.length &&
    verifiedHeaders.every((h, idx) => h.toLowerCase() === EXPECTED_32_HEADERS[idx].toLowerCase());

  if (!postMatch) {
    throw new Error('STOP: Post-update headers do not match expected 32-column layout!');
  }
  console.log('[PASS] All 32 columns verified in physical Google Sheet in exact expected order.');

  // Step 8: Verify row counts across all 16 sheets (zero drift, PUBLISHING data rows unchanged)
  console.log('\n--- Step 8: Post-Sync Row Count & Non-Interference Verification ---');
  const postCounts = await getSheetCounts();
  console.log('Post-sync sheet counts:', JSON.stringify(postCounts, null, 2));

  let countIssues = 0;
  for (const [tab, preCount] of Object.entries(preCounts)) {
    const postCount = postCounts[tab];
    if (preCount !== postCount) {
      console.error(`[FAIL] Row count changed on tab ${tab}: pre=${preCount}, post=${postCount}`);
      countIssues++;
    } else {
      console.log(`[PASS] Tab ${tab} count strictly preserved: ${postCount}`);
    }
  }

  if (countIssues > 0) {
    throw new Error(`STOP: Row count mismatch on ${countIssues} worksheets!`);
  }

  console.log('\n================================================================');
  console.log('RESULT: PASS — PUBLISHING ROW 1 HEADER SYNCHRONIZATION COMPLETE');
  console.log(`  - Previous Headers: ${currentHeaders.length}`);
  console.log(`  - New Headers: ${verifiedHeaders.length} (all 32 schema columns present in expected order)`);
  console.log(`  - PUBLISHING Rows: ${postCounts.PUBLISHING} (strictly unchanged at ${postCounts.PUBLISHING})`);
  console.log('  - Other Sheets Modified: 0 (all 16 sheet counts strictly preserved)');
  console.log('================================================================\n');
}

main().catch((err) => {
  console.error('\nFatal header synchronization error:', err);
  process.exit(1);
});
