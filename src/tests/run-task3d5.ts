import { runTask3D5Verification } from './task3d5-workload-dashboard-verification';

async function main() {
  try {
    const report = await runTask3D5Verification();
    console.log('\n--- Final Verification Summary ---');
    console.log(JSON.stringify(report.summary, null, 2));
    process.exit(0);
  } catch (err: any) {
    console.error('\nVerification Run Aborted with Error:', err);
    process.exit(1);
  }
}

main();
