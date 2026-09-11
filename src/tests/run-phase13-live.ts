import { runPhase13LiveVerification } from './phase13-live-verification';

async function main() {
  try {
    const result = await runPhase13LiveVerification();
    console.log('\n--- VERIFICATION OUTPUT JSON ---');
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.status === 'PASS' ? 0 : 1);
  } catch (err: any) {
    console.error('\nPhase 13 Live Verification threw an error:', err);
    process.exit(1);
  }
}

main();
