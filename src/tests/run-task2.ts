/**
 * BURRA PARIKSHA CMS - Task 2 Standalone Verification Execution Runner
 */

import { runTask2Verification } from './task2-content-master-verification';

async function main() {
  console.log('====================================================');
  console.log('TASK 2 — CANONICAL CONTENT MASTER VERIFICATION SUITE');
  console.log('====================================================\n');

  try {
    const result = await runTask2Verification();

    console.log('--- TEST RESULTS ---');
    for (const r of result.results) {
      console.log(`[${r.status}] ${r.check}: ${r.details}`);
    }

    console.log('\n----------------------------------------------------');
    console.log(`TOTAL CHECKS : ${result.totalChecks}`);
    console.log(`PASSED       : ${result.passedChecks}`);
    console.log(`FAILED       : ${result.failedChecks}`);
    console.log(`STATUS       : ${result.passed ? 'ALL PASSED' : 'FAILED'}`);
    console.log('----------------------------------------------------\n');

    if (!result.passed) {
      process.exit(1);
    }
  } catch (err: any) {
    console.error('CRITICAL UNHANDLED ERROR IN VERIFICATION SUITE:', err);
    process.exit(1);
  }
}

main();
