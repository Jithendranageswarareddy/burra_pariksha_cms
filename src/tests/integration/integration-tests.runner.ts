/**
 * BURRA PARIKSHA CMS — Integration Test Suite Runner
 *
 * Runs all API, persistence, workflow, and external integration test suites in isolated processes.
 */

import { execSync } from 'child_process';
import path from 'path';

export async function runIntegrationTests(): Promise<void> {
  console.log('============================================================');
  console.log('RUNNING INTEGRATION TEST SUITE');
  console.log('============================================================\n');

  const tests = [
    { name: 'Question Workflow Integration', file: 'src/tests/draft-workflow-separation.test.ts' },
    { name: 'Video Workflow Integration', file: 'src/tests/video-transitions.test.ts' },
    { name: 'Publishing Workflow Integration', file: 'src/tests/publishing-workflow.test.ts' },
  ];

  for (const t of tests) {
    console.log(`Executing ${t.name} (${t.file})...`);
    execSync(`npx tsx ${path.resolve(process.cwd(), t.file)}`, { stdio: 'inherit', encoding: 'utf-8' });
    console.log(`  -> PASS: ${t.name}\n`);
  }

  console.log('============================================================');
  console.log('ALL INTEGRATION TESTS PASSED SUCCESSFULLY! ✅');
  console.log('============================================================\n');
}

const isDirectCli = Boolean(
  process.argv[1] &&
  (
    import.meta.url === `file://${process.argv[1]}` ||
    import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` ||
    process.argv[1].replace(/\\/g, '/').endsWith('integration-tests.runner.ts')
  )
);

if (isDirectCli) {
  runIntegrationTests().catch((err) => {
    console.error('Integration Test Runner Failure:', err);
    process.exit(1);
  });
}
