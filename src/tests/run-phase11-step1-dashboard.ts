import { runPhase11Step1DashboardVerification } from './phase11-step1-dashboard-verification';

async function run() {
  console.log('=== RUNNING PHASE 11 STEP 1 DASHBOARD VERIFICATION ===\n');
  const result = await runPhase11Step1DashboardVerification();
  
  console.log(`Results: ${result.passed}/${result.total} Passed`);
  console.log(`Success Status: ${result.success ? 'PASS' : 'FAIL'}\n`);
  
  result.results.forEach((r, idx) => {
    console.log(`[${idx + 1}/${result.total}] ${r.testName}: ${r.passed ? '✓ PASS' : '✗ FAIL'}`);
    if (r.details) {
      console.log(`   Detail: ${r.details}`);
    }
  });

  process.exit(result.success ? 0 : 1);
}

run().catch((err) => {
  console.error('Execution failed:', err);
  process.exit(1);
});
