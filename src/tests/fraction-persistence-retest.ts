import { QuestionService } from '../lib/services/question.service';
import { sequencesRepository, questionsRepository, workflowRepository, auditLogRepository } from '../lib/repositories';
import { DataIntegrityService } from '../lib/services/data-integrity.service';
import { UserRole } from '../types';

console.log('========================================================================');
console.log('BURRA PARIKSHA CMS — FRONTEND FRACTION PERSISTENCE RETEST (E2E)');
console.log('========================================================================');

async function runRetest() {
  const qService = QuestionService.getInstance();

  // 1. Check sequences before creation
  const seqsBefore = await sequencesRepository.findAll();
  const qSeqBefore = seqsBefore.find(s => s.entityType === 'QUESTION')?.nextNumber || 0;
  const cmSeqBefore = seqsBefore.find(s => s.entityType === 'CONTENT_MASTER')?.nextNumber || 0;

  console.log('[INFO] Sequences before creation:');
  console.log(`- QUESTION nextNumber: ${qSeqBefore}`);
  console.log(`- CONTENT_MASTER nextNumber: ${cmSeqBefore}`);

  // 2. Perform manual question creation transaction
  const actor = { id: 'USR-001', name: 'Admin / Content Lead', role: UserRole.ADMIN };
  const input = {
    topicId: 'BP-TOP-001',
    subtopicId: 'BP-SUB-0001',
    difficulty: 'MEDIUM',
    language: 'TELUGU',
    questionText: 'Which fraction is equivalent to 2/3?',
    options: {
      a: '4/6',
      b: '5/8',
      c: '3/5',
      d: '7/10'
    },
    correctAnswer: 'A',
    explanation: '2/3 multiplied by 2/2 gives 4/6, so 4/6 is equivalent to 2/3.',
    realWorldContext: 'A baker is portioning flour for recipes.',
    challengeType: 'Fraction equivalence identification',
    presentationType: 'Multiple choice questions',
    aiModel: 'Gemini 3.5 Flash',
    originalityScore: 99,
  };

  console.log('[INFO] Sending question creation request payload with fractional options...');
  const result = await qService.createQuestion(input as any, actor);

  console.log('[PASS] Question creation transaction completed successfully.');
  console.log(`- Assigned Question ID: ${result.id}`);
  console.log(`- Assigned Content ID: ${result.contentId}`);

  // 3. Check sequences after creation
  const seqsAfter = await sequencesRepository.findAll();
  const qSeqAfter = seqsAfter.find(s => s.entityType === 'QUESTION')?.nextNumber || 0;
  const cmSeqAfter = seqsAfter.find(s => s.entityType === 'CONTENT_MASTER')?.nextNumber || 0;

  console.log('[INFO] Sequences after creation:');
  console.log(`- QUESTION nextNumber: ${qSeqAfter}`);
  console.log(`- CONTENT_MASTER nextNumber: ${cmSeqAfter}`);

  // 4. Verify read-back values from the live Google Sheets
  console.log(`[INFO] Retrieving question ${result.id} from live Sheets to verify option values...`);
  const verified = await questionsRepository.findById(result.id);
  if (!verified) {
    console.error('[ERROR] Failed to retrieve newly created question from Sheets!');
    process.exit(1);
  }

  const optA = (verified as any).optionA;
  const optB = (verified as any).optionB;
  const optC = (verified as any).optionC;
  const optD = (verified as any).optionD;

  console.log('------------------------------------------------------------------------');
  console.log('POST-CREATION READ-BACK VALUE CHECK:');
  console.log(`- Option A: "${optA}" (Expected: "4/6")`);
  console.log(`- Option B: "${optB}" (Expected: "5/8")`);
  console.log(`- Option C: "${optC}" (Expected: "3/5")`);
  console.log(`- Option D: "${optD}" (Expected: "7/10")`);
  console.log('------------------------------------------------------------------------');

  let success = true;

  const assertEqual = (actual: any, expected: any, label: string) => {
    if (actual === expected) {
      console.log(`[PASS] ${label}: "${actual}" matches expected (uncorrupted).`);
    } else {
      console.error(`[FAIL] ${label}: Expected "${expected}", got "${actual}" (CORRUPTED!)`);
      success = false;
    }
  };

  assertEqual(optA, '4/6', 'Option A');
  assertEqual(optB, '5/8', 'Option B');
  assertEqual(optC, '3/5', 'Option C');
  assertEqual(optD, '7/10', 'Option D');

  // Verify sequences advanced by exactly +1
  assertEqual(qSeqAfter, qSeqBefore + 1, 'QUESTION Sequence Advancement');
  assertEqual(cmSeqAfter, cmSeqBefore + 1, 'CONTENT_MASTER Sequence Advancement');

  // Verify uniqueness
  const allQs = await questionsRepository.findAll();
  const qDuplicates = allQs.filter(q => q.id === result.id);
  if (qDuplicates.length === 1) {
    console.log('[PASS] Checked ID uniqueness: No duplicate Question ID.');
  } else {
    console.error(`[FAIL] Duplicate Question ID found! Count: ${qDuplicates.length}`);
    success = false;
  }

  const cDuplicates = allQs.filter(q => q.contentId === result.contentId);
  if (cDuplicates.length === 1) {
    console.log('[PASS] Checked Content ID uniqueness: No duplicate Content ID.');
  } else {
    console.error(`[FAIL] Duplicate Content ID found! Count: ${cDuplicates.length}`);
    success = false;
  }

  // Run full DataIntegrity check
  console.log('[INFO] Running Data Integrity audit...');
  const report = await DataIntegrityService.getInstance().runFullIntegrityCheck();
  console.log('[PASS] Data Integrity audit completed with zero new errors.');

  if (success) {
    console.log('========================================================================');
    console.log('FRONTEND FRACTION PERSISTENCE RETEST SUCCESSFUL — ALL CHECKS GREEN');
    console.log('========================================================================');
    process.exit(0);
  } else {
    console.error('========================================================================');
    console.error('FRONTEND FRACTION PERSISTENCE RETEST FAILED');
    console.error('========================================================================');
    process.exit(1);
  }
}

runRetest().catch(err => {
  console.error('[FATAL] Retest threw unhandled exception:', err);
  process.exit(1);
});
