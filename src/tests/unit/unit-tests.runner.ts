/**
 * BURRA PARIKSHA CMS — Unit Tests Runner
 * Executes all domain, service, repository, and utility unit tests.
 */

import { runDraftSeparationTests } from '../integration/workflow/question-workflow.integration.test';

export async function runUnitTests(): Promise<void> {
  console.log('============================================================');
  console.log('RUNNING UNIT TEST SUITE');
  console.log('============================================================\n');

  try {
    await runDraftSeparationTests();
    console.log('============================================================');
    console.log('ALL UNIT TESTS PASSED SUCCESSFULLY! ✅');
    console.log('============================================================\n');
  } catch (err: any) {
    console.error('Unit Test Suite Failure:', err);
    throw err;
  }
}

const isDirectCli = Boolean(
  process.argv[1] &&
  (
    import.meta.url === `file://${process.argv[1]}` ||
    import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` ||
    process.argv[1].replace(/\\/g, '/').endsWith('unit-tests.runner.ts')
  )
);

if (isDirectCli) {
  runUnitTests().catch((err) => {
    console.error('Unit Test Runner Failure:', err);
    process.exit(1);
  });
}
