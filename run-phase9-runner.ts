import { runPhase9Verification } from './src/tests/phase9-verification';

async function main() {
  try {
    const result = await runPhase9Verification();
    console.log('Runner finished successfully:', result);
    process.exit(0);
  } catch (err: any) {
    console.error('Runner failed:', err);
    process.exit(1);
  }
}

main();
