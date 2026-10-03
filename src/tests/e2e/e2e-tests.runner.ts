/**
 * BURRA PARIKSHA CMS — E2E Test Suite Runner
 *
 * Runs end-to-end user journeys for Question Studio, Team Operations, and Publishing.
 */

import { runPublishingWorkflowVerification } from '../integration/workflow/publishing-workflow.integration.test';

export async function runE2eTests(): Promise<void> {
  console.log('============================================================');
  console.log('RUNNING END-TO-END (E2E) TEST SUITE');
  console.log('============================================================\n');

  try {
    console.log('1. Running End-to-End Publishing Pipeline Tests...');
    await runPublishingWorkflowVerification();

    console.log('============================================================');
    console.log('ALL E2E TESTS PASSED SUCCESSFULLY! ✅');
    console.log('============================================================\n');
  } catch (err: any) {
    console.error('E2E Test Suite Failure:', err);
    throw err;
  }
}

const isDirectCli = Boolean(
  process.argv[1] &&
  (
    import.meta.url === `file://${process.argv[1]}` ||
    import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` ||
    process.argv[1].replace(/\\/g, '/').endsWith('e2e-tests.runner.ts')
  )
);

if (isDirectCli) {
  runE2eTests().catch((err) => {
    console.error('E2E Test Runner Failure:', err);
    process.exit(1);
  });
}
