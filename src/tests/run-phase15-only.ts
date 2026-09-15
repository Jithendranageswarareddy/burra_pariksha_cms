/**
 * BURRA PARIKSHA CMS - Phase 15 AI Script & Hook Production Runner
 */

import { runPhase15Verification } from './phase15-script-production-verification';

async function main() {
  console.log('==================================================================');
  console.log('PHASE 15 — AI SCRIPT & HOOK PRODUCTION VERIFICATION SUITE');
  console.log('==================================================================\n');

  try {
    const result = await runPhase15Verification();

    console.log('\n--- PHASE 15 RESULTS OVERVIEW ---');
    console.log(`TOTAL CHECKS : ${result.totalChecks}`);
    console.log(`PASSED       : ${result.passedChecks}`);
    console.log(`FAILED       : ${result.failedChecks}`);
    console.log(`STATUS       : ${result.passed ? 'ALL PASSED' : 'SOME CHECKS FAILED'}`);
    console.log('------------------------------------------------------------------\n');

    if (!result.passed) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error('CRITICAL UNHANDLED ERROR IN SCRIPT PRODUCTION VERIFICATION SUITE:', err);
    process.exit(1);
  }
}

main();
