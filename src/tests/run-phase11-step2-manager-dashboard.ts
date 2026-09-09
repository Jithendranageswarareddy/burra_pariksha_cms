import { runPhase11Step2ManagerDashboardVerification } from './phase11-step2-manager-dashboard-verification';

async function run() {
  console.log('=== RUNNING PHASE 11 STEP 2 MANAGER DASHBOARD VERIFICATION ===\n');
  const result = await runPhase11Step2ManagerDashboardVerification();
  
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
