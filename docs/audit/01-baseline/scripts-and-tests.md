# Scripts & Tests Baseline

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 01 — Repository & Environment Baseline  
**Audit Date:** 2026-09-28  
**Audit Mode:** Read-Only Forensic Inventory  
**Total Scripts Audited:** 22 (in `scripts/`) + 3 Root Test Runners  
**Total Tests Audited:** 252 (249 in `src/tests/` + 3 Root Runners)  

---

## 1. Script Inventory (`scripts/`)

The repository contains 22 standalone TypeScript utility and diagnostic scripts under `/scripts/`. None were executed during this read-only audit.

| Script Path | Purpose | Invocation Method | Systems Affected | Mutating? | Test/Ops Classification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `scripts/audit-and-clean-bp-cnt-000001.ts` | Diagnostic and cleanup script targeting canonical first content record `BP-CNT-000001` | `npx tsx scripts/audit-and-clean-bp-cnt-000001.ts` | Google Sheets, Repositories | Mutating | Data Maintenance |
| `scripts/clean-audit-log.ts` | Prunes excessive audit log entries from `AUDIT_LOG` Google Sheet | `npx tsx scripts/clean-audit-log.ts` | Google Sheets (`AUDIT_LOG`) | Mutating | Maintenance |
| `scripts/cleanup-and-migrate-users.ts` | Migrates legacy user structures and resets admin credentials to match schema | `npx tsx scripts/cleanup-and-migrate-users.ts` | Google Sheets (`USERS`) | Mutating | Migration / Admin |
| `scripts/comprehensive-audit.ts` | Complete read-only audit of all 21 operational Google Sheets worksheets | `npx tsx scripts/comprehensive-audit.ts` | Google Sheets API | **Read-Only** | Audit / Diagnostics |
| `scripts/execute-phase-2b.ts` | Executes Phase 2b batch initialization and taxonomy population | `npx tsx scripts/execute-phase-2b.ts` | Google Sheets | Mutating | Phase Execution / Legacy |
| `scripts/execute-phase-2c.ts` | Executes Phase 2c question creation verification | `npx tsx scripts/execute-phase-2c.ts` | Google Sheets, Repositories | Mutating | Phase Execution / Legacy |
| `scripts/execute-phase-2d.ts` | Executes Phase 2d Gemini AI question generation pipeline | `npx tsx scripts/execute-phase-2d.ts` | Google Sheets, Gemini API | Mutating | Phase Execution / Legacy |
| `scripts/execute-production-baseline-reset.ts` | Wipes transactional test rows while strictly preserving taxonomy, admin users, and sequences | `npx tsx scripts/execute-production-baseline-reset.ts` | Google Sheets, Google Drive | Mutating (Heavy) | Operational Reset |
| `scripts/final-baseline-read-only-audit.ts` | Forensic read-only row count verifier ensuring zero test data rows exist in Google Sheets | `npx tsx scripts/final-baseline-read-only-audit.ts` | Google Sheets API | **Read-Only** | Verification |
| `scripts/google-oauth-setup.ts` | Local CLI OAuth flow helper to obtain `GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN` | `npx tsx scripts/google-oauth-setup.ts` | Google OAuth 2.0 | Read-Only | Configuration / Setup |
| `scripts/live-audit-and-reset.ts` | Interactive CLI for live operational audit and conditional reset | `npx tsx scripts/live-audit-and-reset.ts` | Google Sheets | Mutating | Maintenance |
| `scripts/phase-b-launch-reset.ts` | Full reset script executed prior to Stage B production launch | `npx tsx scripts/phase-b-launch-reset.ts` | Google Sheets | Mutating (Heavy) | Operational Reset |
| `scripts/purge-test-data-for-production.ts` | Authoritative test data purger executed on 2026-09-26 before final freeze | `npx tsx scripts/purge-test-data-for-production.ts` | Google Sheets, Google Drive Trash | Mutating (Heavy) | Operational Reset |
| `scripts/restore-sequences-phase-e.ts` | Recalibrates auto-increment ID counters in the `SEQUENCES` worksheet | `npx tsx scripts/restore-sequences-phase-e.ts` | Google Sheets (`SEQUENCES`) | Mutating | Data Maintenance |
| `scripts/seed-100-questions-e2e-workflow.ts` | E2E load-testing seed script creating 100 complete questions through all stages | `npx tsx scripts/seed-100-questions-e2e-workflow.ts` | Google Sheets, Repositories | Mutating (Load) | Test / Simulation |
| `scripts/taxonomy-cross-audit.ts` | Verifies foreign-key integrity between Categories, Topics, and Subtopics | `npx tsx scripts/taxonomy-cross-audit.ts` | Google Sheets (Taxonomy) | **Read-Only** | Integrity Audit |
| `scripts/test-task-3b2-ui-e2e.ts` | Headless simulation of UI workflows for Task 3b2 | `npx tsx scripts/test-task-3b2-ui-e2e.ts` | In-Memory / Repositories | Mutating | Test / E2E |
| `scripts/verify-canonical-content-id.ts` | Validates format and sequence continuity of `BP-CNT-######` IDs | `npx tsx scripts/verify-canonical-content-id.ts` | Google Sheets | **Read-Only** | Verification |
| `scripts/verify-drive-state.ts` | Queries Google Drive folder hierarchy (`Burra Pariksha/Content/...`) and checks trash | `npx tsx scripts/verify-drive-state.ts` | Google Drive API | **Read-Only** | Verification |
| `scripts/verify-gcs-state.ts` | Verifies existence, permissions, and snapshot objects in GCS snapshot bucket | `npx tsx scripts/verify-gcs-state.ts` | Google Cloud Storage API | **Read-Only** | Verification |
| `scripts/verify-task5.ts` | Verifies Task 5 question validation engine rules | `npx tsx scripts/verify-task5.ts` | In-Memory / Engine | **Read-Only** | Verification |
| `scripts/verify-worksheet-preservation.ts` | Verifies all 25 sheet headers and schema integrity against `google-sheets-schema.ts` | `npx tsx scripts/verify-worksheet-preservation.ts` | Google Sheets API | **Read-Only** | Schema Verification |

---

## 2. Test Files Baseline (`src/tests/` & Root Runners)

The test suite consists of **252 files** executing via `tsx` TypeScript runtime. Tests use custom assertion engines (`assert()`), mock state resets, in-memory repository fallbacks, and real external API verification when credentials are provided.

### A. Test Categorization by Scope

| Test Scope | File Count | Representative Files | Purpose & Touched Systems |
| :--- | :--- | :--- | :--- |
| **Phase Verification Suites** | 82 | `phase03-...` to `phase32-...`, `phase7-real-drive-e2e.ts` | Validates domain deliverables for each of the 32 architectural phases. Touches Sheets, Drive, AI, and Repositories. |
| **Task Verification Suites** | 78 | `task2-...` to `task9-...`, `task3f4...` (32 snapshot tests) | Granular component, service, and algorithm verification. Touches GCS, Gemini, RBAC, and State Machine. |
| **Stage & Workflow Regressions** | 34 | `stage01-...`, `stage02-video-transitions.test.ts`, `step01-...` | Verifies stage transitions, state idempotency, and foreign key cascading. In-memory & Google Sheets. |
| **Mathematical & Safety Gates** | 18 | `qs18b-blind-math-...`, `qs21b-mathematical-safety-...`, `test-isolation-...` | Enforces zero hallucinated math, verified arithmetic steps, Telugu font correctness, and test sheet isolation. |
| **Phase & Task Test Runners** | 32 | `run-phase*-only.ts`, `run-all-regressions.ts`, root `run-*-runner.ts` | Orchestrates batch runs of test suites with `SKIP_SHEETS_SYNC=true` or live flags. |
| **Test Fixtures & Helpers** | 8 | `qa-user.fixture.ts`, `purge-test-artifacts.ts`, `surgical-repair.ts` | Provides standardized user profiles, mock tokens, and artifact cleanup. |

---

## 3. Root Test Runners

Three test runner scripts reside directly at the project root for rapid execution from CLI:
1. `/run-stage8-runner.ts` (445 bytes) — Orchestrates Stage 8 continuous workflow regression tests.
2. `/run-phase9-runner.ts` (336 bytes) — Executes Phase 9 publishing and distribution verification suite.
3. `/run-phase10-runner.ts` (370 bytes) — Executes Phase 10 analytics and performance intelligence verification.

---

## 4. Test Safety Architecture & Isolation Gates

The codebase contains an explicit **Test Isolation Safety Gate** (`src/tests/test-isolation-safety-gate.test.ts`) enforcing:
- Prevention of accidental writes to production Google Sheets (`GOOGLE_SHEETS_ID`) during automated testing.
- Requirement for `CMS_TEST_ISOLATION=true` or `TEST_GOOGLE_SHEETS_ID` when running live spreadsheet tests.
- Mock fallback repository mode (`SKIP_SHEETS_SYNC=true` and `SKIP_DRIVE_SYNC=true`) configured across `package.json` test scripts (`npm run test:phase14` through `npm run test:phase30`).
