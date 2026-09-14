import { questionService } from '../lib/services';
import { questionsRepository, contentMastersRepository, sequencesRepository } from '../lib/repositories';
import { DataIntegrityService } from '../lib/services/data-integrity.service';
import { QuestionValidationEngine } from '../lib/validation/question-validation.engine';

console.log('========================================================================');
console.log('BURRA PARIKSHA CMS — QUESTION STUDIO E2E CREATION INTEGRATION TEST');
console.log('========================================================================');

async function runStudioE2ETest() {
  // 1. Check existing sequence counts
  console.log('[INFO] Fetching initial sequence numbers from live Google Sheets...');
  const seqsBefore = await sequencesRepository.findAll();
  const qSeqBeforeObj = seqsBefore.find(s => s.entityType === 'QUESTION');
  const cmSeqBeforeObj = seqsBefore.find(s => s.entityType === 'CONTENT_MASTER');

  const qSeqBefore = qSeqBeforeObj ? qSeqBeforeObj.nextNumber : 0;
  const cmSeqBefore = cmSeqBeforeObj ? cmSeqBeforeObj.nextNumber : 0;

  console.log(`- QUESTION Sequence Before: ${qSeqBefore}`);
  console.log(`- CONTENT_MASTER Sequence Before: ${cmSeqBefore}`);

  // 2. Formulate realistic mathematics aptitude question payload
  const topicId = 'BP-TOP-001';
  const subtopicId = 'BP-SUB-0001';
  const categoryId = 'CAT-QA';

  const newCandidate = {
    creationMode: 'manual',
    categoryId,
    topicId,
    subtopicId,
    difficulty: 'EASY',
    challengeType: 'ABCD',
    presentationType: 'Text',
    language: 'ENGLISH',
    realLifeContext: 'Shopping discounts and selling prices',
    generationMode: 'SUBTOPIC',
    questionStyle: 'STORY_BASED',
    questionText: 'An item with list price ₹1000 has a 10% discount. What is the selling price?',
    options: {
      a: '₹900',
      b: '₹950',
      c: '₹980',
      d: '₹920'
    },
    correctAnswer: 'A',
    explanation: '10% of ₹1000 is ₹100, so the selling price is ₹1000 - ₹100 = ₹900.',
    tags: ['Aptitude', 'Discount', 'Percentage'],
    idempotencyKey: `studio-manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  };

  // 3. Client and Server-Side Pre-Save Validation Simulation
  console.log('[INFO] Executing automated pre-save validation engine...');
  const validationResult = await QuestionValidationEngine.validate({
    ...newCandidate,
    optionA: newCandidate.options.a,
    optionB: newCandidate.options.b,
    optionC: newCandidate.options.c,
    optionD: newCandidate.options.d,
    status: 'DRAFT',
  } as any, { skipTaxonomyLookup: true });

  console.log(`- Pre-save status: ${validationResult.status}`);
  console.log(`- Confidence score: ${validationResult.confidenceScore !== undefined ? Math.round(validationResult.confidenceScore * 100) : 100}%`);
  console.log(`- Mathematical Status: ${validationResult.mathematicalLogicalResult?.status || 'VALID'}`);

  const isValid = validationResult.mathematicalLogicalResult?.status === 'PROVABLY_VALID' && validationResult.status === 'VALID';
  if (!isValid) {
    console.error(`[FAIL] Pre-save mathematical validation failed! Status: ${validationResult.status}`);
    process.exit(1);
  }
  console.log('[PASS] Pre-save mathematical and structural validation checks passed.');

  // 4. Save/Create Action Pipeline Execution
  console.log('[INFO] Executing production Question Studio createQuestionFromRequest pipeline...');
  const actor = { id: 'USR-001', name: 'Admin / Content Lead', role: 'ADMIN' };
  
  const createdQuestion = await questionService.createQuestionFromRequest(newCandidate as any, actor as any);
  
  const newQuestionId = createdQuestion.id;
  const newContentId = createdQuestion.contentMasterId || createdQuestion.contentId;

  console.log(`[PASS] Saved successfully. Created details:`);
  console.log(`- New Question ID: "${newQuestionId}"`);
  console.log(`- New Content ID: "${newContentId}"`);

  // 5. Read back from database to verify persistence and detail rendering
  console.log('[INFO] Fetching created question from live Sheets...');
  const refetched = await questionsRepository.findById(newQuestionId);

  if (!refetched) {
    console.error(`[FAIL] Question with ID "${newQuestionId}" not found in database!`);
    process.exit(1);
  }

  console.log('[PASS] Question successfully retrieved.');

  const optA = (refetched as any).optionA || refetched.options?.a;
  const optB = (refetched as any).optionB || refetched.options?.b;
  const optC = (refetched as any).optionC || refetched.options?.c;
  const optD = (refetched as any).optionD || refetched.options?.d;
  const refetchedContentId = refetched.contentMasterId || refetched.contentId;

  console.log('------------------------------------------------------------------------');
  console.log('CREATED RECORD READ-BACK DETAIL:');
  console.log(`- Question ID:  "${refetched.id}"`);
  console.log(`- Content ID:   "${refetchedContentId}"`);
  console.log(`- Topic:        "${refetched.topicId}"`);
  console.log(`- Subtopic:     "${refetched.subtopicId}"`);
  console.log(`- Option A:     "${optA}" (Expected: "₹900")`);
  console.log(`- Option B:     "${optB}" (Expected: "₹950")`);
  console.log(`- Option C:     "${optC}" (Expected: "₹980")`);
  console.log(`- Option D:     "${optD}" (Expected: "₹920")`);
  console.log(`- Explanation:  "${refetched.explanation}"`);
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

  assertEqual(refetched.id, newQuestionId, 'Question ID Matches');
  assertEqual(refetchedContentId, newContentId, 'Content ID Matches');
  assertEqual(optA, '₹900', 'Option A Value');
  assertEqual(optB, '₹950', 'Option B Value');
  assertEqual(optC, '₹980', 'Option C Value');
  assertEqual(optD, '₹920', 'Option D Value');
  assertEqual(refetched.explanation, newCandidate.explanation, 'Explanation String');

  // 6. Sequence advancement check
  console.log('[INFO] Re-checking sequence counters...');
  const seqsAfter = await sequencesRepository.findAll();
  const qSeqAfterObj = seqsAfter.find(s => s.entityType === 'QUESTION');
  const cmSeqAfterObj = seqsAfter.find(s => s.entityType === 'CONTENT_MASTER');

  const qSeqAfter = qSeqAfterObj ? qSeqAfterObj.nextNumber : 0;
  const cmSeqAfter = cmSeqAfterObj ? cmSeqAfterObj.nextNumber : 0;

  console.log(`- QUESTION Sequence After: ${qSeqAfter} (Expected: ${qSeqBefore + 1})`);
  console.log(`- CONTENT_MASTER Sequence After: ${cmSeqAfter} (Expected: ${cmSeqBefore + 1})`);

  assertEqual(qSeqAfter, qSeqBefore + 1, 'QUESTION Sequence Advanced By Exactly 1');
  assertEqual(cmSeqAfter, cmSeqBefore + 1, 'CONTENT_MASTER Sequence Advanced By Exactly 1');

  // 7. Uniqueness / Duplicate check
  console.log('[INFO] Scanning database for duplicate IDs...');
  const allQs = await questionsRepository.findAll();
  const qDuplicates = allQs.filter(q => q.id === newQuestionId);
  const cDuplicates = allQs.filter(q => (q.contentMasterId || q.contentId) === newContentId);

  assertEqual(qDuplicates.length, 1, 'Uniqueness of Question ID');
  assertEqual(cDuplicates.length, 1, 'Uniqueness of Content ID');

  // 8. Full data integrity validation (specifically check for any issues with our newly created IDs)
  console.log('[INFO] Executing Data Integrity Service to verify system-wide stability...');
  const integrityReport = await DataIntegrityService.getInstance().runFullIntegrityCheck();
  
  const relevantIssues = (integrityReport.issues || []).filter(issue => 
    issue.entityId === newQuestionId || 
    issue.entityId === newContentId ||
    issue.message?.includes(newQuestionId) || 
    issue.message?.includes(newContentId)
  );

  console.log(`- Total system issues: ${integrityReport.issueCounts?.total ?? 0}`);
  console.log(`- Total issues related to our created record: ${relevantIssues.length}`);
  if (relevantIssues.length > 0) {
    console.error('[FAIL] Found data integrity issues with our created record:', relevantIssues);
  }
  assertEqual(relevantIssues.length, 0, 'No data integrity issues found for the created question and content master');

  console.log('\n### RETEST_SUMMARY_KEYS ###');
  console.log(`CREATED_QUESTION_ID: ${newQuestionId}`);
  console.log(`CREATED_CONTENT_ID: ${newContentId}`);
  console.log(`OPT_A: ${optA}`);
  console.log(`OPT_B: ${optB}`);
  console.log(`OPT_C: ${optC}`);
  console.log(`OPT_D: ${optD}`);
  console.log(`Q_SEQ_BEFORE: ${qSeqBefore}`);
  console.log(`Q_SEQ_AFTER: ${qSeqAfter}`);
  console.log(`CM_SEQ_BEFORE: ${cmSeqBefore}`);
  console.log(`CM_SEQ_AFTER: ${cmSeqAfter}`);

  if (success) {
    console.log('========================================================================');
    console.log('QUESTION STUDIO CREATION & E2E SAVE INTEGRATION TEST SUCCESSFUL');
    console.log('========================================================================');
    process.exit(0);
  } else {
    console.error('========================================================================');
    console.error('QUESTION STUDIO CREATION & E2E SAVE INTEGRATION TEST FAILED');
    console.error('========================================================================');
    process.exit(1);
  }
}

runStudioE2ETest().catch(err => {
  console.error('[FATAL] Studio E2E test threw unhandled exception:', err);
  process.exit(1);
});
