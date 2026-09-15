import { runPhase17Verification } from './phase17-video-workflow-verification';

async function main() {
  console.log('==================================================================');
  console.log('PHASE 17 — REAL VIDEO PRODUCTION WORKFLOW VERIFICATION SUITE');
  console.log('==================================================================');
  const result = await runPhase17Verification();
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
