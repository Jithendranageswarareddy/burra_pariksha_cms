import { runPhase18Verification } from './phase18-thumbnail-intelligence';

async function main() {
  console.log('==================================================================');
  console.log('PHASE 18 — REAL AI THUMBNAIL INTELLIGENCE VERIFICATION SUITE');
  console.log('==================================================================');
  const result = await runPhase18Verification();
  console.log('------------------------------------------------------------------');
  console.log(`TOTAL CHECKS : ${result.totalChecks}`);
  console.log(`PASSED       : ${result.passedChecks}`);
  console.log(`FAILED       : ${result.failedChecks}`);
  console.log(`FINAL VERDICT: ${result.passed ? 'PASS' : 'FAIL'}`);
  console.log('==================================================================');
  if (!result.passed) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
