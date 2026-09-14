import { questionService } from '../lib/services';
import { DataIntegrityService } from '../lib/services/data-integrity.service';

console.log('========================================================================');
console.log('BURRA PARIKSHA CMS — QUESTION LIBRARY & DETAIL READ INTEGRATION TEST');
console.log('========================================================================');

async function runLibraryTest() {
  const targetQId = 'BP-Q-000029';
  const targetCId = 'BP-CNT-000044';

  // 1. Fetch all questions via Service and filter for Content ID
  console.log('[INFO] Fetching questions list from live database...');
  const questionsList = await questionService.getQuestions({});
  
  console.log(`[INFO] Filtering question list for Content ID: ${targetCId}...`);
  const matchedList = questionsList.filter(q => q.contentId === targetCId || q.id === targetQId);

  console.log(`- Total questions fetched: ${questionsList.length}`);
  console.log(`- Matching questions found: ${matchedList.length}`);

  if (matchedList.length === 0) {
    console.error(`[FAIL] No matching questions found for Content ID "${targetCId}"!`);
    process.exit(1);
  }

  const listQuestion = matchedList[0] as any;
  console.log('[PASS] Question found in index list successfully:');
  console.log(`- Question ID: "${listQuestion.id}"`);
  console.log(`- Content ID: "${listQuestion.contentId}"`);
  console.log(`- Topic: "${listQuestion.topicId}"`);
  console.log(`- Subtopic: "${listQuestion.subtopicId}"`);
  console.log(`- Option A: "${listQuestion.optionA || listQuestion.options?.a}"`);
  console.log(`- Option B: "${listQuestion.optionB || listQuestion.options?.b}"`);
  console.log(`- Option C: "${listQuestion.optionC || listQuestion.options?.c}"`);
  console.log(`- Option D: "${listQuestion.optionD || listQuestion.options?.d}"`);

  // 2. Fetch specific question by ID (simulating Question Detail page load)
  console.log(`[INFO] Retrieving specific question ${targetQId} by ID...`);
  const detailQuestion = await questionService.getQuestionById(targetQId) as any;

  if (!detailQuestion) {
    console.error(`[FAIL] Failed to retrieve question ${targetQId} via getQuestionById!`);
    process.exit(1);
  }

  console.log('[PASS] Question Detail retrieved successfully:');
  console.log(`- Option A: "${detailQuestion.optionA || detailQuestion.options?.a}" (Expected: "4/6")`);
  console.log(`- Option B: "${detailQuestion.optionB || detailQuestion.options?.b}" (Expected: "5/8")`);
  console.log(`- Option C: "${detailQuestion.optionC || detailQuestion.options?.c}" (Expected: "3/5")`);
  console.log(`- Option D: "${detailQuestion.optionD || detailQuestion.options?.d}" (Expected: "7/10")`);

  let success = true;

  const assertEqual = (actual: any, expected: any, label: string) => {
    if (actual === expected) {
      console.log(`[PASS] ${label}: "${actual}" matches expected.`);
    } else {
      console.error(`[FAIL] ${label}: Expected "${expected}", got "${actual}"`);
      success = false;
    }
  };

  const getOptValue = (obj: any, key: string) => {
    return obj[key] || obj.options?.[key.replace('option', '').toLowerCase()];
  };

  assertEqual(getOptValue(detailQuestion, 'optionA'), '4/6', 'Option A');
  assertEqual(getOptValue(detailQuestion, 'optionB'), '5/8', 'Option B');
  assertEqual(getOptValue(detailQuestion, 'optionC'), '3/5', 'Option C');
  assertEqual(getOptValue(detailQuestion, 'optionD'), '7/10', 'Option D');
  assertEqual(detailQuestion.id, targetQId, 'Question ID');
  assertEqual(detailQuestion.contentId, targetCId, 'Content ID');

  // 3. Check for duplicates
  if (matchedList.length === 1) {
    console.log('[PASS] Checked ID uniqueness: No duplicate results found in index list.');
  } else {
    console.error(`[FAIL] Duplicate results found! Total count: ${matchedList.length}`);
    success = false;
  }

  // 4. Run Data Integrity check
  console.log('[INFO] Executing Data Integrity report...');
  await DataIntegrityService.getInstance().runFullIntegrityCheck();
  console.log(`[PASS] Full health check passed.`);

  if (success) {
    console.log('========================================================================');
    console.log('QUESTION LIBRARY INTEGRATION TEST SUCCESSFUL — ALL CHECKS GREEN');
    console.log('========================================================================');
    process.exit(0);
  } else {
    console.error('========================================================================');
    console.error('QUESTION LIBRARY INTEGRATION TEST FAILED');
    console.error('========================================================================');
    process.exit(1);
  }
}

runLibraryTest().catch(err => {
  console.error('[FATAL] Integration test threw unhandled exception:', err);
  process.exit(1);
});
