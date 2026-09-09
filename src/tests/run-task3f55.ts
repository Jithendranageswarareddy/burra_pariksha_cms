import { runTask3F55GlobalSearchVerification } from './task3f55-global-search-routing-verification';

async function main() {
  console.log('Running Task 3F.5.5 Global Search Entity Routing & QA Verification...\n');
  const summary = await runTask3F55GlobalSearchVerification();
  console.log('Test Summary:');
  console.log(`Passed: ${summary.passedTests} / ${summary.totalTests}`);
  console.log(`Success: ${summary.success}\n`);
  for (const r of summary.results) {
    console.log(`${r.passed ? '✅' : '❌'} ${r.name}: ${r.message}`);
  }
  if (!summary.success) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
