/**
 * BURRA PARIKSHA CMS - Phase 14 Google Drive Production Infrastructure Runner
 */

import { runPhase14Verification } from './phase14-production-drive-verification';

async function main() {
  console.log('==================================================================');
  console.log('PHASE 14 — GOOGLE DRIVE PRODUCTION INFRASTRUCTURE VERIFICATION SUITE');
  console.log('==================================================================\n');

  try {
    const result = await runPhase14Verification();

    console.log('--- TEST RESULTS ---');
    for (const r of result.results) {
      console.log(`[${r.status}] ${r.check}`);
      console.log(`      Details: ${r.details}\n`);
    }

    console.log('------------------------------------------------------------------');
    console.log(`TOTAL CHECKS : ${result.totalChecks}`);
    console.log(`PASSED       : ${result.passedChecks}`);
    console.log(`FAILED       : ${result.failedChecks}`);
    console.log(`STATUS       : ${result.passed ? 'ALL PASSED' : 'SOME CHECKS FAILED'}`);
    console.log('------------------------------------------------------------------\n');

    if (!result.passed) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error('CRITICAL UNHANDLED ERROR IN GOOGLE DRIVE INFRASTRUCTURE VERIFICATION SUITE:', err);
    process.exit(1);
  }
}

main();
