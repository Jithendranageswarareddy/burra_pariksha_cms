/**
 * BURRA PARIKSHA CMS — Security Test Suite Runner
 *
 * Runs authentication, RBAC, CSRF/CORS, and test isolation safety checks.
 */

import { runPhase8iSecurityVerification } from '../acceptance/security/security-qa.acceptance.test';
import { runStage09RbacModelTests } from '../acceptance/security/rbac-capability.acceptance.test';

export async function runSecurityTests(): Promise<void> {
  console.log('============================================================');
  console.log('RUNNING SECURITY TEST SUITE');
  console.log('============================================================\n');

  try {
    console.log('1. Running Security QA Verification...');
    await runPhase8iSecurityVerification();

    console.log('2. Running RBAC Capability Matrix Verification...');
    await runStage09RbacModelTests();

    console.log('============================================================');
    console.log('ALL SECURITY TESTS PASSED SUCCESSFULLY! ✅');
    console.log('============================================================\n');
  } catch (err: any) {
    console.error('Security Test Suite Failure:', err);
    throw err;
  }
}

const isDirectCli = Boolean(
  process.argv[1] &&
  (
    import.meta.url === `file://${process.argv[1]}` ||
    import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` ||
    process.argv[1].replace(/\\/g, '/').endsWith('security-tests.runner.ts')
  )
);

if (isDirectCli) {
  runSecurityTests().catch((err) => {
    console.error('Security Test Runner Failure:', err);
    process.exit(1);
  });
}
