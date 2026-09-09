import { runPhase12Step2Verification } from './phase12-step2-production-asset-validation';

async function main() {
  try {
    await runPhase12Step2Verification();
    process.exit(0);
  } catch (err: any) {
    console.error('Test execution failed:', err);
    process.exit(1);
  }
}

main();
