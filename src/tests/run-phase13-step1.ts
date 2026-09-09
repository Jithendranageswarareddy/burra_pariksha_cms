import { runPhase13Step1Verification } from './phase13-step1-publishing-scheduling';

async function main() {
  try {
    await runPhase13Step1Verification();
    console.log('Phase 13.1 verification script finished successfully.');
    process.exit(0);
  } catch (err) {
    console.error('Phase 13.1 verification script failed:', err);
    process.exit(1);
  }
}

main();
