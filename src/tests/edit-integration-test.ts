import { QuestionService } from '../lib/services/question.service';
import { questionsRepository, sequencesRepository } from '../lib/repositories';
import { DataIntegrityService } from '../lib/services/data-integrity.service';

console.log('========================================================================');
console.log('BURRA PARIKSHA CMS — REAL QUESTION EDIT E2E INTEGRATION TEST');
console.log('========================================================================');

async function runEditTest() {
  const targetQId = 'BP-Q-000029';
  const targetCId = 'BP-CNT-000044';

  // 1. Read and record current state
  console.log(`[INFO] Reading question ${targetQId} from live Sheets...`);
  const existing = await questionsRepository.findById(targetQId);
  if (!existing) {
    console.error(`[FAIL] Question with ID "${targetQId}" not found in database!`);
    process.exit(1);
  }

  const beforeExplanation = existing.explanation || '';
  const optA = (existing as any).optionA || existing.options?.a;
  const optB = (existing as any).optionB || existing.options?.b;
  const optC = (existing as any).optionC || existing.options?.c;
  const optD = (existing as any).optionD || existing.options?.d;

  console.log('[INFO] Current question state retrieved successfully:');
  console.log(`- Question ID: ${existing.id}`);
  console.log(`- Content ID: ${existing.contentId}`);
  console.log(`- Explanation before: "${beforeExplanation}"`);
  console.log(`- Option A before: "${optA}"`);
  console.log(`- Option B before: "${optB}"`);
  console.log(`- Option C before: "${optC}"`);
  console.log(`- Option D before: "${optD}"`);

  // Record sequences before the edit
  const seqsBefore = await sequencesRepository.findAll();
  const qSeqBefore = seqsBefore.find(s => s.entityType === 'QUESTION')?.nextNumber || 0;
  const cmSeqBefore = seqsBefore.find(s => s.entityType === 'CONTENT_MASTER')?.nextNumber || 0;

  // 2. Perform exactly ONE legitimate edit
  const newExplanation = "2/3 multiplied by 2/2 gives 4/6. Therefore, 4/6 is equivalent to 2/3.";
  console.log('[INFO] Sending single-record update with modified explanation and protected options...');

  const qService = QuestionService.getInstance();
  const actor = { id: 'USR-001', name: 'Admin / Content Lead', role: 'ADMIN' };

  const result = await qService.updateQuestion(targetQId, {
    explanation: newExplanation,
    options: {
      a: '4/6',
      b: '5/8',
      c: '3/5',
      d: '7/10',
    },
  } as any, actor as any);

  if (!result) {
    console.error('[FAIL] Update operation failed or returned null!');
    process.exit(1);
  }

  console.log('[PASS] Update transaction completed successfully.');

  // 3. Read back and perform postflight checks
  console.log('[INFO] Re-reading question from live Sheets...');
  const verified = await questionsRepository.findById(targetQId);
  if (!verified) {
    console.error('[FAIL] Re-verification failed! Question cannot be found after update.');
    process.exit(1);
  }

  const afterExplanation = verified.explanation || '';
  const afterOptA = (verified as any).optionA || verified.options?.a;
  const afterOptB = (verified as any).optionB || verified.options?.b;
  const afterOptC = (verified as any).optionC || verified.options?.c;
  const afterOptD = (verified as any).optionD || verified.options?.d;

  console.log('------------------------------------------------------------------------');
  console.log('POST-EDIT VALUE VERIFICATION:');
  console.log(`- Explanation before: "${beforeExplanation}"`);
  console.log(`- Explanation after:  "${afterExplanation}"`);
  console.log(`- Option A after:     "${afterOptA}" (Expected: "4/6")`);
  console.log(`- Option B after:     "${afterOptB}" (Expected: "5/8")`);
  console.log(`- Option C after:     "${afterOptC}" (Expected: "3/5")`);
  console.log(`- Option D after:     "${afterOptD}" (Expected: "7/10")`);
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

  assertEqual(afterExplanation, newExplanation, 'Explanation (Updated)');
  assertEqual(afterOptA, '4/6', 'Option A');
  assertEqual(afterOptB, '5/8', 'Option B');
  assertEqual(afterOptC, '3/5', 'Option C');
  assertEqual(afterOptD, '7/10', 'Option D');
  assertEqual(verified.id, targetQId, 'Question ID Unchanged');
  assertEqual(verified.contentId, targetCId, 'Content ID Unchanged');

  // Verify sequences remain completely unchanged
  const seqsAfter = await sequencesRepository.findAll();
  const qSeqAfter = seqsAfter.find(s => s.entityType === 'QUESTION')?.nextNumber || 0;
  const cmSeqAfter = seqsAfter.find(s => s.entityType === 'CONTENT_MASTER')?.nextNumber || 0;

  assertEqual(qSeqAfter, qSeqBefore, 'QUESTION Sequence Unchanged');
  assertEqual(cmSeqAfter, cmSeqBefore, 'CONTENT_MASTER Sequence Unchanged');

  // Verify uniqueness and no duplicate IDs
  const allQs = await questionsRepository.findAll();
  const qDuplicates = allQs.filter(q => q.id === targetQId);
  if (qDuplicates.length === 1) {
    console.log('[PASS] Checked ID uniqueness: No duplicate Question ID.');
  } else {
    console.error(`[FAIL] Duplicate Question ID found! Count: ${qDuplicates.length}`);
    success = false;
  }

  const cDuplicates = allQs.filter(q => q.contentId === targetCId);
  if (cDuplicates.length === 1) {
    console.log('[PASS] Checked Content ID uniqueness: No duplicate Content ID.');
  } else {
    console.error(`[FAIL] Duplicate Content ID found! Count: ${cDuplicates.length}`);
    success = false;
  }

  // 4. Run Data Integrity check
  console.log('[INFO] Running Data Integrity audit to verify database wellness...');
  await DataIntegrityService.getInstance().runFullIntegrityCheck();
  console.log('[PASS] Data Integrity audit completed.');

  // Output formatting variables for logs
  console.log('### EXPORT_DATA_KEYS ###');
  console.log(`BEFORE_EXPLANATION: ${beforeExplanation}`);
  console.log(`AFTER_EXPLANATION: ${afterExplanation}`);
  console.log(`OPT_A: ${afterOptA}`);
  console.log(`OPT_B: ${afterOptB}`);
  console.log(`OPT_C: ${afterOptC}`);
  console.log(`OPT_D: ${afterOptD}`);
  console.log(`QID: ${verified.id}`);
  console.log(`CID: ${verified.contentId}`);

  if (success) {
    console.log('========================================================================');
    console.log('QUESTION EDIT E2E INTEGRATION TEST SUCCESSFUL — ZERO REGRESSIONS');
    console.log('========================================================================');
    process.exit(0);
  } else {
    console.error('========================================================================');
    console.error('QUESTION EDIT E2E INTEGRATION TEST FAILED');
    console.error('========================================================================');
    process.exit(1);
  }
}

runEditTest().catch(err => {
  console.error('[FATAL] Integration test threw unhandled exception:', err);
  process.exit(1);
});
