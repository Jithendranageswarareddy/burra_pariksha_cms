/**
 * BURRA PARIKSHA CMS — Master Unified Test Runner
 *
 * Executes unit, integration, acceptance, e2e, regression, security, and stage test suites.
 */

import { runUnitTests } from './unit/unit-tests.runner';
import { runIntegrationTests } from './integration/integration-tests.runner';
import { runAcceptanceTests } from './acceptance/acceptance-tests.runner';
import { runE2eTests } from './e2e/e2e-tests.runner';
import { runRegressionTests } from './regression/regression-tests.runner';
import { runSecurityTests } from './security/security-tests.runner';
import { runAllStageTests } from './stage/stages.runner';

export async function runMasterTestSuite(): Promise<void> {
  console.log('============================================================');
  console.log('BURRA PARIKSHA CMS — MASTER TEST SUITE EXECUTION');
  console.log('============================================================\n');

  let passedSuites = 0;
  let totalSuites = 7;

  try {
    console.log('[SUITE 1/7] UNIT TESTS');
    await runUnitTests();
    passedSuites++;

    console.log('[SUITE 2/7] INTEGRATION TESTS');
    await runIntegrationTests();
    passedSuites++;

    console.log('[SUITE 3/7] ACCEPTANCE TESTS');
    await runAcceptanceTests();
    passedSuites++;

    console.log('[SUITE 4/7] E2E TESTS');
    await runE2eTests();
    passedSuites++;

    console.log('[SUITE 5/7] REGRESSION TESTS');
    await runRegressionTests();
    passedSuites++;

    console.log('[SUITE 6/7] SECURITY TESTS');
    await runSecurityTests();
    passedSuites++;

    console.log('[SUITE 7/7] SDLC STAGE VERIFICATION TESTS (STAGES 01–30)');
    await runAllStageTests();
    passedSuites++;

    console.log('============================================================');
    console.log(`MASTER TEST SUITE COMPLETE: ALL ${passedSuites}/${totalSuites} SUITES PASSED ✅`);
    console.log('============================================================\n');
  } catch (err: any) {
    console.error(`Master Test Suite Execution Halted: ${err?.message || String(err)}`);
    process.exit(1);
  }
}

const isDirectCli = Boolean(
  process.argv[1] &&
  (
    import.meta.url === `file://${process.argv[1]}` ||
    import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` ||
    process.argv[1].replace(/\\/g, '/').endsWith('runner.ts')
  )
);

if (isDirectCli) {
  runMasterTestSuite().catch((err) => {
    console.error('Master Test Runner Failure:', err);
    process.exit(1);
  });
}
