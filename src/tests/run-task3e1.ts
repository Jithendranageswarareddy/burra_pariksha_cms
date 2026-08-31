import { runTask3E1Verification } from './task3e1-my-work-operations-verification';

async function main() {
  try {
    const report = await runTask3E1Verification();
    console.log('\n--- Final Verification Summary ---');
    console.log(JSON.stringify(report.summary, null, 2));
    process.exit(0);
  } catch (err: any) {
    console.error('\nVerification Run Aborted with Error:', err);
    process.exit(1);
  }
}

main();
