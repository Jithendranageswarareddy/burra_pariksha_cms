import { runPhase19Verification } from './phase19-pinned-comment-intelligence';

async function main() {
  console.log('==================================================================');
  console.log('PHASE 19 — PINNED COMMENT & CONVERSATION INTELLIGENCE VERIFICATION');
  console.log('==================================================================');
  const result = await runPhase19Verification();

  for (const r of result.results) {
    const icon = r.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} [${r.code}] ${r.check}`);
    console.log(`   └─ ${r.details}`);
  }

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
