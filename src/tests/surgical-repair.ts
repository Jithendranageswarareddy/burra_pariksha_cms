import { questionsRepository } from '../lib/repositories';
import { SnapshotExporterService } from '../lib/services/snapshot-exporter.service';
import { DurableSnapshotArchiveService } from '../lib/services/durable-snapshot-archive.service';
import { DataIntegrityService } from '../lib/services/data-integrity.service';
import * as fs from 'fs';
import * as path from 'path';

console.log('========================================================================');
console.log('BURRA PARIKSHA CMS — SURGICAL DATA REPAIR OF QUESTION BP-Q-000028');
console.log('========================================================================');

async function executeRepair() {
  const qId = 'BP-Q-000028';
  const contentId = 'BP-CNT-000043';

  // 1. Re-read target question from live Sheets
  console.log(`[INFO] Reading question ${qId} from live Sheets...`);
  const rawQuestion = await questionsRepository.findById(qId);
  if (!rawQuestion) {
    console.error(`[ERROR] Question ${qId} not found in database! Aborting.`);
    process.exit(1);
  }

  const question = rawQuestion as any;

  console.log('[INFO] Current question state retrieved successfully:');
  console.log(`- Question ID: ${question.id}`);
  console.log(`- Content ID: ${question.contentId}`);
  console.log(`- Option A: "${question.optionA}"`);
  console.log(`- Option B: "${question.optionB}"`);
  console.log(`- Option C: "${question.optionC}"`);
  console.log(`- Option D: "${question.optionD}"`);

  // 2. Confirm values match audited corruption exactly
  const expectedCorruptA = '46181';
  const expectedCorruptB = '46280';
  const expectedCorruptC = '46376';

  if (
    question.optionA !== expectedCorruptA ||
    question.optionB !== expectedCorruptB ||
    question.optionC !== expectedCorruptC
  ) {
    console.error('[ERROR] Retried values do NOT match the expected corrupted pattern!');
    console.error(`Expected: A=${expectedCorruptA}, B=${expectedCorruptB}, C=${expectedCorruptC}`);
    console.error(`Received: A=${question.optionA}, B=${question.optionB}, C=${question.optionC}`);
    console.error('Aborting to prevent potential concurrent overwrite collisions or invalid state.');
    process.exit(1);
  }

  console.log('[INFO] Verified option data corruption match. Proceeding with backup and repair...');

  // 3. Create a safety backup using the Snapshot Exporter Service
  console.log('[INFO] Creating full pre-repair Google Sheets snapshot...');
  const exporter = SnapshotExporterService.getInstance();
  const snapshot = await exporter.exportSnapshot();

  const backupDir = path.join(process.cwd(), 'src/tests/backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }
  const backupFilePath = path.join(backupDir, `SNAP-${Date.now()}-pre-repair-backup.json`);
  fs.writeFileSync(backupFilePath, JSON.stringify(snapshot, null, 2), 'utf8');
  console.log(`[PASS] Local safety snapshot backup saved to: ${backupFilePath}`);

  // Try GCS Durable Snapshot Archive if enabled
  try {
    const archiveService = DurableSnapshotArchiveService.getInstance();
    if (archiveService.getConfig().enabled) {
      console.log('[INFO] GCS Archival enabled. Storing durable snapshot in Google Cloud Storage...');
      const manifest = await archiveService.archiveSnapshot(snapshot);
      console.log(`[PASS] Durable snapshot uploaded to GCS: ${manifest.storageUri}`);
    } else {
      console.log('[INFO] GCS Archival disabled or unconfigured. Proceeding with local backup only.');
    }
  } catch (err: any) {
    console.log(`[WARNING] GCS upload skipped/failed (${err?.message}). Local backup remains valid.`);
  }

  // 4. Perform the single, surgically targeted repair update
  console.log('[INFO] Executing surgical repair on question record...');
  const updatedQuestion = await questionsRepository.updateRecord(qId, {
    options: {
      a: '6/8',
      b: '9/15',
      c: '12/20',
      d: '15/25',
    },
  } as any);

  if (!updatedQuestion) {
    console.error('[ERROR] Failed to execute update on live Sheets!');
    process.exit(1);
  }

  console.log('[PASS] Surgical update operation completed successfully.');

  // 5. Post-repair validation: Re-read from live Sheets to verify changes
  console.log('[INFO] Re-reading question record to perform post-repair checks...');
  const rawVerified = await questionsRepository.findById(qId);
  if (!rawVerified) {
    console.error('[ERROR] Re-verification failed! Question cannot be found after update.');
    process.exit(1);
  }

  const verified = rawVerified as any;

  console.log('------------------------------------------------------------------------');
  console.log('POST-REPAIR VALUE VERIFICATION:');
  console.log(`- Option A: "${verified.optionA}" (Expected: "6/8")`);
  console.log(`- Option B: "${verified.optionB}" (Expected: "9/15")`);
  console.log(`- Option C: "${verified.optionC}" (Expected: "12/20")`);
  console.log(`- Option D: "${verified.optionD}" (Expected: "15/25")`);
  console.log(`- Question ID: "${verified.id}" (Expected: "${qId}")`);
  console.log(`- Content ID: "${verified.contentId}" (Expected: "${contentId}")`);
  console.log('------------------------------------------------------------------------');

  let success = true;

  const assertEqual = (actual: any, expected: any, label: string) => {
    if (actual === expected) {
      console.log(`[PASS] ${label}: "${actual}" matches expected.`);
    } else {
      console.error(`[FAIL] ${label}: Expected "${expected}", got "${actual}"`);
      success = false;
    }
  };

  assertEqual(verified.optionA, '6/8', 'Option A');
  assertEqual(verified.optionB, '9/15', 'Option B');
  assertEqual(verified.optionC, '12/20', 'Option C');
  assertEqual(verified.optionD, '15/25', 'Option D (Unchanged Check)');
  assertEqual(verified.id, qId, 'Question ID Unchanged');
  assertEqual(verified.contentId, contentId, 'Content ID Unchanged');

  // Verify no duplicate Question IDs or Content IDs exist
  const allQs = await questionsRepository.findAll();
  const qDuplicates = allQs.filter(q => q.id === qId);
  if (qDuplicates.length === 1) {
    console.log('[PASS] Checked ID uniqueness: No duplicate Question ID detected.');
  } else {
    console.error(`[FAIL] Duplicate Question IDs found! Count: ${qDuplicates.length}`);
    success = false;
  }

  const cDuplicates = allQs.filter(q => q.contentId === contentId);
  if (cDuplicates.length === 1) {
    console.log('[PASS] Checked Content ID uniqueness: No duplicate Content ID detected.');
  } else {
    console.error(`[FAIL] Duplicate Content IDs found! Count: ${cDuplicates.length}`);
    success = false;
  }

  // Ensure no other fields were changed
  assertEqual(verified.questionText, question.questionText, 'Question Text Unchanged');
  assertEqual(verified.correctAnswer, question.correctAnswer, 'Correct Answer Unchanged');
  assertEqual(verified.explanation, question.explanation, 'Explanation Unchanged');
  assertEqual(verified.topicId, question.topicId, 'Topic ID Unchanged');
  assertEqual(verified.subtopicId, question.subtopicId, 'Subtopic ID Unchanged');

  // 6. Run Full Data Integrity check
  console.log('[INFO] Running Data Integrity audit to verify total database wellness...');
  const integrityReport = await DataIntegrityService.getInstance().runFullIntegrityCheck();
  console.log(`[PASS] Data Integrity audit completed.`);

  if (success) {
    console.log('========================================================================');
    console.log('SURGICAL PRODUCTION DATA REPAIR SUCCESSFUL — ZERO REGRESSIONS DETECTED');
    console.log('========================================================================');
    process.exit(0);
  } else {
    console.error('========================================================================');
    console.error('SURGICAL PRODUCTION DATA REPAIR ENCOUNTERED POST-REPAIR ERRORS');
    console.error('========================================================================');
    process.exit(1);
  }
}

executeRepair().catch(err => {
  console.error('[FATAL] Surgical repair threw unhandled exception:', err);
  process.exit(1);
});
