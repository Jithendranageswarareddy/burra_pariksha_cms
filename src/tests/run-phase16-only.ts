import { runPhase16Verification } from './phase16-human-script-workflow-verification';

async function main() {
  console.log('==================================================================');
  console.log('PHASE 16 — HUMAN SCRIPT WORKFLOW VERIFICATION SUITE');
  console.log('==================================================================');
  const result = await runPhase16Verification();
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
