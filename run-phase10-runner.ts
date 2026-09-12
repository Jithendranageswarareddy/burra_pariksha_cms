import { runPhase10PublishingVerification } from './src/tests/phase10-publishing-verification';

async function main() {
  try {
    const result = await runPhase10PublishingVerification();
    console.log('Runner finished successfully:', result);
    process.exit(0);
  } catch (err: any) {
    console.error('Runner failed:', err);
    process.exit(1);
  }
}

main();
