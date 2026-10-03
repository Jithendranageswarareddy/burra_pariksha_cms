/**
 * BURRA PARIKSHA CMS — Regression Test Suite Runner
 *
 * Runs all targeted bugfix and workflow regression test suites.
 */

import { runDraftSeparationTests } from '../integration/workflow/question-workflow.integration.test';
import { runVideoTransitionTests } from '../integration/workflow/video-workflow.integration.test';

export async function runRegressionTests(): Promise<void> {
  console.log('============================================================');
  console.log('RUNNING REGRESSION TEST SUITE');
  console.log('============================================================\n');

  try {
    console.log('1. Running Draft Workflow Separation Regressions...');
    await runDraftSeparationTests();

    console.log('2. Running Video Transitions State Machine Regressions...');
    await runVideoTransitionTests();

    console.log('============================================================');
    console.log('ALL REGRESSION TESTS PASSED SUCCESSFULLY! ✅');
    console.log('============================================================\n');
  } catch (err: any) {
    console.error('Regression Test Suite Failure:', err);
    throw err;
  }
}

const isDirectCli = Boolean(
  process.argv[1] &&
  (
    import.meta.url === `file://${process.argv[1]}` ||
    import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` ||
    process.argv[1].replace(/\\/g, '/').endsWith('regression-tests.runner.ts')
  )
);

if (isDirectCli) {
  runRegressionTests().catch((err) => {
    console.error('Regression Test Runner Failure:', err);
    process.exit(1);
  });
}
