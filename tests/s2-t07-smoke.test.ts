/**
 * BURRA PARIKSHA CMS — Sprint 2 Stabilization & Golden Path
 * Task: S2-T07 Regression & Automated Smoke Test Suite
 *
 * Deterministic Release Gate covering:
 * Stage A: Identity & Authentication (FC-001: Scrypt, JWT HMAC, Sessions, Revocation)
 * Stage B: Roles & Capability Authorization (FC-002: RBAC Matrix, GAR-02, AP-009)
 * Stage C: Database Abstraction & Concurrency (FC-003: Canonical IDs, Repositories, OCC, AppError)
 * Stage D: Audit Ledger & Observability (FC-004: 7-Dim Audit, Redaction, Probes /healthz & /readyz)
 * Stage E: Workflow State Engine (FC-005: Canonical 15-Step State Machine, Rejections, Orthogonal States)
 * Stage F: Question Golden Path E2E (S2-T05: End-to-End Question Lifecycle, Creator/Reviewer, Google Sheets)
 * Stage G: Real Persistence & Datastore Verification (Google Sheets Production Mode, OCC, Multi-session)
 */

import { spawnSync } from 'node:child_process';
import path from 'node:path';

interface SuiteDefinition {
  id: string;
  name: string;
  category: string;
  scriptPath: string;
  env?: Record<string, string>;
}

const SUITES: SuiteDefinition[] = [
  {
    id: 'FC-001',
    name: 'System Foundation & Identity Authentication',
    category: 'AUTHENTICATION',
    scriptPath: 'tests/fc-001-auth.test.ts',
  },
  {
    id: 'FC-002',
    name: 'Roles & Capability Authorization Matrix (GAR-02 & AP-009)',
    category: 'RBAC_AUTHORIZATION',
    scriptPath: 'tests/fc-002-rbac.test.ts',
  },
  {
    id: 'FC-003',
    name: 'Database Abstraction, OCC Concurrency & API Envelopes',
    category: 'DATABASE_OCC_PERSISTENCE',
    scriptPath: 'tests/fc-003-db-api.test.ts',
  },
  {
    id: 'FC-004',
    name: 'Audit Ledger, Cloud Observability & System Probes',
    category: 'AUDIT_OBSERVABILITY',
    scriptPath: 'tests/fc-004-audit.test.ts',
  },
  {
    id: 'FC-005',
    name: 'Canonical 15-Step Workflow Engine & Transitions',
    category: 'WORKFLOW_STATE_MACHINE',
    scriptPath: 'tests/fc-005-workflow.test.ts',
  },
  {
    id: 'S2-T05',
    name: 'Live Question Golden Path & Google Sheets Persistence',
    category: 'GOLDEN_PATH_PERSISTENCE',
    scriptPath: 'tests/s2-t05-golden-path.test.ts',
  },
];

async function runSmokeGate() {
  console.log('============================================================');
  console.log('BURRA PARIKSHA CMS — SPRINT 2 REGRESSION & SMOKE GATE (S2-T07)');
  console.log('Deterministic Verification of Foundations & Golden Path');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log('============================================================\n');

  let passedSuites = 0;
  let failedSuites = 0;
  const results: { id: string; name: string; category: string; passed: boolean; durationMs: number }[] = [];

  for (const suite of SUITES) {
    console.log(`>>> [RUNNING] ${suite.id}: ${suite.name} (${suite.category})`);
    const startTime = Date.now();

    const mergedEnv = {
      ...process.env,
      ...(suite.env || {}),
    };

    const runResult = spawnSync('npx', ['tsx', suite.scriptPath], {
      cwd: process.cwd(),
      env: mergedEnv,
      stdio: 'inherit',
      shell: false,
    });

    const durationMs = Date.now() - startTime;
    const isSuccess = runResult.status === 0;

    if (isSuccess) {
      console.log(`✓ [PASSED] ${suite.id} completed successfully in ${(durationMs / 1000).toFixed(2)}s\n`);
      passedSuites++;
      results.push({ id: suite.id, name: suite.name, category: suite.category, passed: true, durationMs });
    } else {
      console.error(`✗ [FAILED] ${suite.id} exited with status code ${runResult.status} in ${(durationMs / 1000).toFixed(2)}s\n`);
      failedSuites++;
      results.push({ id: suite.id, name: suite.name, category: suite.category, passed: false, durationMs });
    }
  }

  console.log('============================================================');
  console.log('S2-T07 SMOKE GATE EXECUTION SUMMARY');
  console.log('============================================================');
  for (const r of results) {
    const icon = r.passed ? '✓ PASS' : '✗ FAIL';
    console.log(`  [${icon}] ${r.id.padEnd(8)} | ${r.category.padEnd(25)} | ${r.name} (${(r.durationMs / 1000).toFixed(2)}s)`);
  }
  console.log('------------------------------------------------------------');
  console.log(`Total Suites: ${SUITES.length} | Passed: ${passedSuites} | Failed: ${failedSuites}`);
  console.log('============================================================\n');

  if (failedSuites > 0) {
    console.error(`❌ S2-T07 SMOKE GATE FAILED: ${failedSuites} suite(s) did not pass.`);
    process.exit(1);
  } else {
    console.log('✅ S2-T07 SMOKE GATE PASSED: All foundational and golden-path regression suites verified.');
    process.exit(0);
  }
}

runSmokeGate().catch((err) => {
  console.error('Fatal error executing S2-T07 smoke gate:', err);
  process.exit(1);
});
