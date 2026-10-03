/**
 * BURRA PARIKSHA CMS — Acceptance Test Suite Runner
 *
 * Runs all business acceptance and security acceptance test suites.
 */

import { runStage02BusinessAcceptanceTests } from './business/business-acceptance.acceptance.test';
import { runStage07CanonicalWorkflowTests } from './business/canonical-workflow.acceptance.test';
import { runStage09RbacModelTests } from './security/rbac-capability.acceptance.test';
import { runPhase8iSecurityVerification } from './security/security-qa.acceptance.test';

export async function runAcceptanceTests(): Promise<void> {
  console.log('============================================================');
  console.log('RUNNING ACCEPTANCE TEST SUITE');
  console.log('============================================================\n');

  try {
    console.log('1. Running Business Acceptance Criteria Tests (Stage 02)...');
    await runStage02BusinessAcceptanceTests();

    console.log('2. Running Canonical 15-Step Workflow Acceptance Tests (Stage 07)...');
    await runStage07CanonicalWorkflowTests();

    console.log('3. Running RBAC Capability Acceptance Tests (Stage 09)...');
    await runStage09RbacModelTests();

    console.log('4. Running Security QA Acceptance Tests...');
    await runPhase8iSecurityVerification();

    console.log('============================================================');
    console.log('ALL ACCEPTANCE TESTS PASSED SUCCESSFULLY! ✅');
    console.log('============================================================\n');
  } catch (err: any) {
    console.error('Acceptance Test Suite Failure:', err);
    throw err;
  }
}

const isDirectCli = Boolean(
  process.argv[1] &&
  (
    import.meta.url === `file://${process.argv[1]}` ||
    import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` ||
    process.argv[1].replace(/\\/g, '/').endsWith('acceptance-tests.runner.ts')
  )
);

if (isDirectCli) {
  runAcceptanceTests().catch((err) => {
    console.error('Acceptance Test Runner Failure:', err);
    process.exit(1);
  });
}
