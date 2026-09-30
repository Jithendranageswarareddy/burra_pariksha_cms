# Test Database Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 17 of 30  
**Document:** 29 of 39  

---

## 1. Test Data Isolation Architecture

A forensic inspection of the test suite (`src/tests/`) and maintenance scripts (`scripts/`) reveals:
- **Dedicated Test Database Server:** None.
- **Test Database Isolation Mechanism:**  
  Tests rely on either:
  1. `BaseRepository.fallbackStore` (In-memory `Map` when Google credentials are omitted).
  2. `TEST_SPREADSHEET_ID` environment variable.

---

## 2. Production Leak Risk in Integration Scripts

1. **Fallback to Production Spreadsheet:**  
   In several test scripts (e.g. `seed-100-questions-e2e-workflow.ts`, `test-task-3b2-ui-e2e.ts`), if `TEST_SPREADSHEET_ID` is not explicitly exported in the shell, the script falls back to `process.env.SPREADSHEET_ID`.
2. **Hazard:**  
   Executing an automated test script in an environment where `.env` has production credentials directly inserts 100 test rows (`BP-Q-TEST-*`) into the **live production Google Spreadsheet**, contaminating production analytics and reporting.
3. **Clean-up Scripts Required:**  
   The existence of scripts like `scripts/purge-test-data-for-production.ts` confirms that test data contamination of production sheets has occurred repeatedly in the past.
