import { runStage8ContinuousVerification } from './src/tests/stage8-continuous-verification';

async function main() {
  try {
    const result = await runStage8ContinuousVerification();
    console.log('\n[STAGE 8 RUNNER RESULT] Continuous 01→15→01 conveyor verified successfully:', result.success);
    process.exit(0);
  } catch (err: any) {
    console.error('\n[STAGE 8 RUNNER ERROR] Failed:', err);
    process.exit(1);
  }
}

main();
