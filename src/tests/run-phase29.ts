import { runPhase29Verification } from './phase29-controlled-strategy-integration-verification';
import { runPhase29BVerification } from './phase29b-posting-time-intelligence-verification';

async function main() {
  console.log('=== RUNNING PHASE 29A VERIFICATION ===');
  const resultA = await runPhase29Verification();
  console.log(JSON.stringify(resultA, null, 2));

  console.log('=== RUNNING PHASE 29B VERIFICATION ===');
  const resultB = await runPhase29BVerification();
  console.log(JSON.stringify(resultB, null, 2));

  const overallSuccess = resultA.success && resultB.success;
  process.exit(overallSuccess ? 0 : 1);
}

main().catch((err) => {
  console.error('Phase 29 runner error:', err);
  process.exit(1);
});
