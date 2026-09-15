/**
 * BURRA PARIKSHA CMS - Phase 12 Review & Assignment Workflow Runner
 */

import { runPhase12Verification } from './phase12-review-assignment-verification';

async function main() {
  console.log('==================================================================');
  console.log('PHASE 12 — REVIEW & ASSIGNMENT WORKFLOW VERIFICATION SUITE');
  console.log('==================================================================\n');

  try {
    const result = await runPhase12Verification();

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
    console.error('CRITICAL UNHANDLED ERROR IN REVIEW & ASSIGNMENT WORKFLOW VERIFICATION SUITE:', err);
    process.exit(1);
  }
}

main();
