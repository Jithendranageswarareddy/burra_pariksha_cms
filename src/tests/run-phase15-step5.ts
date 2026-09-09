import { runPhase15Step5Verification } from './phase15-step5-verification';
import { runPhase15Step3Verification } from './phase15-step3-verification';
import { runPhase15Step2Verification } from './phase15-step2-verification';
import { runPhase14Step2Verification } from './phase14-step2-verification';
import { runPhase14Step3Verification } from './phase14-step3-verification';
import { runPhase14Step4Verification } from './phase14-step4-verification';

async function main() {
  console.log('========================================================');
  console.log('BURRA PARIKSHA CMS — PHASE 15.5 VERIFICATION & REGRESSION');
  console.log('========================================================\n');

  console.log('--- RUNNING PHASE 15.5 VERIFICATION ---');
  const res15_5 = await runPhase15Step5Verification();
  res15_5.results.forEach((r) => {
    console.log(`[${r.passed ? 'PASS' : 'FAIL'}] ${r.name}`);
    if (r.message) console.log(`       Note: ${r.message}`);
  });
  console.log(`Phase 15.5: ${res15_5.passedTests}/${res15_5.totalTests} passed.\n`);

  console.log('--- RUNNING PHASE 15.3 REGRESSION ---');
  const res15_3 = await runPhase15Step3Verification();
  console.log(`Phase 15.3: ${res15_3.passedTests}/${res15_3.totalTests} passed.\n`);

  console.log('--- RUNNING PHASE 15.2 REGRESSION ---');
  const res15_2 = await runPhase15Step2Verification();
  console.log(`Phase 15.2: ${res15_2.passedTests}/${res15_2.totalTests} passed.\n`);

  console.log('--- RUNNING PHASE 14.2 REGRESSION ---');
  const res14_2 = await runPhase14Step2Verification();
  console.log(`Phase 14.2: ${res14_2.passedTests}/${res14_2.totalTests} passed.\n`);

  console.log('--- RUNNING PHASE 14.3 REGRESSION ---');
  const res14_3 = await runPhase14Step3Verification();
  console.log(`Phase 14.3: ${res14_3.passedTests}/${res14_3.totalTests} passed.\n`);

  console.log('--- RUNNING PHASE 14.4 REGRESSION ---');
  const res14_4 = await runPhase14Step4Verification();
  console.log(`Phase 14.4: ${res14_4.passedTests}/${res14_4.totalTests} passed.\n`);

  const allPassed =
    res15_5.success &&
    res15_3.success &&
    res15_2.success &&
    res14_2.success &&
    res14_3.success &&
    res14_4.success;

  if (allPassed) {
    console.log('>>> ALL PHASE 15.5 AND REGRESSION TESTS PASSED! <<<');
    process.exit(0);
  } else {
    console.error('>>> SOME VERIFICATION TESTS FAILED! <<<');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal error during test run:', err);
  process.exit(1);
});
