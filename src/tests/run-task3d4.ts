import { runTask3D4Verification } from './task3d4-script-designer-workflow-verification';

async function main() {
  try {
    const report = await runTask3D4Verification();
    console.log('\n--- Final Verification Summary ---');
    console.log(JSON.stringify(report.summary, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Test execution failed:', err);
    process.exit(1);
  }
}

main();
