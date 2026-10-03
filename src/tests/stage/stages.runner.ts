/**
 * BURRA PARIKSHA CMS — SDLC Stage Verification Test Runner
 *
 * Runs all SDLC Stage verification test suites (Stages 01–30) in isolated execution processes.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export async function runAllStageTests(): Promise<void> {
  console.log('============================================================');
  console.log('RUNNING ALL SDLC STAGE VERIFICATION TEST SUITES (01–30)');
  console.log('============================================================\n');

  const stageDir = path.resolve(process.cwd(), 'src/tests/stage');
  const files = fs.readdirSync(stageDir).filter((f) => f.startsWith('stage') && f.endsWith('.test.ts')).sort();

  let passedCount = 0;
  let failedCount = 0;

  for (const file of files) {
    const filePath = path.join(stageDir, file);
    try {
      console.log(`Executing ${file}...`);
      execSync(`npx tsx ${filePath}`, { stdio: 'inherit', encoding: 'utf-8' });
      passedCount++;
      console.log(`  -> PASS: ${file}\n`);
    } catch (err: any) {
      failedCount++;
      console.error(`  -> FAIL: ${file} — ${err?.message || String(err)}\n`);
    }
  }

  console.log('============================================================');
  console.log(`STAGE VERIFICATION SUMMARY: ${passedCount} PASSED, ${failedCount} FAILED out of ${files.length} total stages.`);
  console.log('============================================================\n');

  if (failedCount > 0) {
    throw new Error(`${failedCount} stage verification test(s) failed.`);
  }
}

const isDirectCli = Boolean(
  process.argv[1] &&
  (
    import.meta.url === `file://${process.argv[1]}` ||
    import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` ||
    process.argv[1].replace(/\\/g, '/').endsWith('stages.runner.ts')
  )
);

if (isDirectCli) {
  runAllStageTests().catch((err) => {
    console.error('Stage Runner Failure:', err);
    process.exit(1);
  });
}
