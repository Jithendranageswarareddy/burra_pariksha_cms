import { runPhase9WorkflowVerification } from './phase9-content-workflow-verification';

async function main() {
  const result = await runPhase9WorkflowVerification();
  console.log('=== PHASE 9 TEST RESULTS ===');
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.success ? 0 : 1);
}

main().catch((err) => {
  console.error('Phase 9 runner error:', err);
  process.exit(1);
});
