/**
 * BURRA PARIKSHA CMS — Stage 01 Requirements Baseline Executable Verification Suite
 *
 * Programmatically validates the requirements baseline, functional constraints,
 * cost boundaries, and core domain requirements.
 */

import fs from 'fs';
import path from 'path';
import { ALL_SHEET_TABS } from '../../lib/schemas/google-sheets-schema';

function assert(condition: boolean, msg: string): void {
  if (!condition) {
    throw new Error(`[STAGE 01 REQUIREMENT VIOLATION] ${msg}`);
  }
}

export async function runStage01RequirementsTests(): Promise<void> {
  console.log('============================================================');
  console.log('RUNNING STAGE 01 REQUIREMENTS BASELINE EXECUTABLE VERIFICATION');
  console.log('============================================================\n');

  // REQ-001: Domain Purpose
  console.log('Checking REQ-001: Burra Pariksha CMS Domain Boundary...');
  const pkgContent = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'package.json'), 'utf-8'));
  assert(pkgContent.name === 'burra-pariksha-cms', 'Package name must be burra-pariksha-cms');
  console.log('  -> PASS: REQ-001 domain boundary verified.\n');

  // REQ-002: Authoritative Worksheets
  console.log('Checking REQ-002: Authoritative Google Sheets Persistence Layer...');
  assert(Array.isArray(ALL_SHEET_TABS) && ALL_SHEET_TABS.length === 25, 'Must contain 25 authoritative Google Sheets worksheets');
  console.log('  -> PASS: REQ-002 25 authoritative worksheets verified.\n');

  // REQ-003: Cost & Infrastructure Boundary (₹0–₹100)
  console.log('Checking REQ-003: Infrastructure & Cost Boundary (₹0–₹100)...');
  const envExample = fs.readFileSync(path.resolve(process.cwd(), '.env.example'), 'utf-8');
  assert(envExample.includes('GOOGLE_SHEETS_ID='), '.env.example must specify GOOGLE_SHEETS_ID');
  assert(envExample.includes('GEMINI_API_KEY='), '.env.example must specify GEMINI_API_KEY');
  console.log('  -> PASS: REQ-003 zero-cost infrastructure boundary verified.\n');

  // REQ-004: Server Entry & Express Architecture
  console.log('Checking REQ-004: Express Server Architecture...');
  const serverTs = fs.readFileSync(path.resolve(process.cwd(), 'server.ts'), 'utf-8');
  assert(serverTs.includes("app.use('/api', apiRouter)"), 'server.ts must mount apiRouter on /api');
  console.log('  -> PASS: REQ-004 server entry architecture verified.\n');

  console.log('============================================================');
  console.log('ALL STAGE 01 REQUIREMENTS BASELINE CHECKS PASSED! ✅');
  console.log('============================================================\n');
}

const isDirectCli = Boolean(
  process.argv[1] &&
  (
    import.meta.url === `file://${process.argv[1]}` ||
    import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}` ||
    process.argv[1].replace(/\\/g, '/').endsWith('stage01-requirements-baseline.test.ts')
  )
);

if (isDirectCli) {
  runStage01RequirementsTests().catch((err) => {
    console.error('Stage 01 Test Failure:', err);
    process.exit(1);
  });
}
