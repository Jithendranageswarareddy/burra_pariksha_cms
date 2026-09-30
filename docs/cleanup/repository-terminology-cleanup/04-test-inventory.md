# Repository Terminology Cleanup: 04 — Test Inventory & Normalization

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Document Type:** Test Suite Inventory & Classification  
**Status:** **AUTHORITATIVE INVENTORY**  
**Date:** 2026-09-29  

---

## 1. Test Categorization & Execution Model

All 225 test files in `src/tests/` have been audited and mapped to explicit domain purposes:

### 1.1 Core Canonical Regression Suites (KEEP)
- `stage01-draft-workflow-separation.test.ts` → Step 01 Draft creation & persistence test
- `stage02-video-transitions.test.ts` → Step 02/06 Video status transition validation
- `canonical-sequence-parsing.test.ts` → ID sequence allocation and sanitization
- `d01-concurrency-protection.test.ts` → Mutex locking & concurrent write safety
- `creation-compensation-resilience.test.ts` → Transaction compensation resilience
- `test-isolation-safety-gate.test.ts` → Production sheet write-isolation checks

### 1.2 Domain Test Commands in `package.json`
- `npm run test:unit` → Executes fast, non-mutating unit tests
- `npm run test:workflow` → Executes Step 01–06 workflow verification
- `npm run test:publishing` → Executes Step 10–12 publishing verification
- `npm run test:regression` → Executes full regression suite
- `npm run test:all` → Executes all active non-mutating tests

### 1.3 Historical Verification Scripts (RETAIN AS REGRESSION FIXTURES)
- Phase-named verification scripts (`src/tests/phase*.ts`, `task*.ts`) are preserved in `src/tests/` to prevent breaking existing verification runners, but are marked as historical test fixtures.
