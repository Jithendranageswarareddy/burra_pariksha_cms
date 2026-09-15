/**
 * BURRA PARIKSHA CMS - Phase 13 AI Question Refinement Runner
 */

import { runPhase13Verification } from './phase13-ai-refinement-verification';

async function main() {
  console.log('==================================================================');
  console.log('PHASE 13 — AI QUESTION REFINEMENT & IMPROVEMENT VERIFICATION SUITE');
  console.log('==================================================================\n');

  try {
    const result = await runPhase13Verification();

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
    console.error('CRITICAL UNHANDLED ERROR IN AI QUESTION REFINEMENT VERIFICATION SUITE:', err);
    process.exit(1);
  }
}

main();
