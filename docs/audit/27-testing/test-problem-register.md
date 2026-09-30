# Step 27: Test Problem Register

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Document Type:** Classified Test Problem Register  
**Status:** **AUTHORITATIVE AUDIT**  
**Date:** 2026-09-29  

---

## 1. Test Problem Classification Matrix

| Problem ID | Category | Component | Severity | Description & Root Cause | Impact | Affected Environment |
| :--- | :--- | :--- | :---: | :--- | :--- | :--- |
| **TEST-CRIT-01** | `MUTATION_RISK` | `phase09-publishing-workflow-verification.ts` | **CRITICAL** | Test seeds rows directly to live Google Sheets without cleanup or transaction rollback. | Persistent test artifact pollution (`1789891450880`) | Production / Live Sheets |
| **TEST-HIGH-01** | `FRAMEWORK` | `package.json` | **HIGH** | Absence of unified test runner (Vitest/Jest); tests execute as disjointed `tsx` node scripts without consolidated coverage reporting. | Difficult CI integration and test discovery | Local / CI |
| **TEST-HIGH-02** | `COVERAGE` | Social Publishing & Analytics | **HIGH** | Stages 11–15 rely heavily on mocked responses or manual UI verification scripts rather than automated end-to-end integration tests. | Undetected regression risk in publishing pipeline | Production |
| **TEST-MED-01** | `DUPLICATION` | Phase Verification Scripts | **MEDIUM** | Over 120 scripts across `run-phase*.ts` and `task*.ts` duplicate identical setup routines and assertion logic. | Maintenance overhead and developer confusion | Local |
| **TEST-LOW-01** | `ISOLATION` | In-memory Map Fallback | **LOW** | Tests running with `SKIP_SHEETS_SYNC=true` operate on volatile in-memory Maps that do not validate Google Sheets API network constraints. | False-positive test pass on API errors | Local / CI |

---

## 2. Definitive Operational State

No test scripts were executed in mutating mode, no test files were deleted or renamed, and no production data was modified during this read-only forensic audit.
