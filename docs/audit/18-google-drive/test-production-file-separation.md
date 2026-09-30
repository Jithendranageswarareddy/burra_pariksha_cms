# Test vs Production File Storage Separation

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 29 of 40  

---

## 1. Storage Isolation Analysis

A forensic review of the Google Drive integration reveals:
- **Dedicated Test Drive Root Folder:** **NONE.**
- `GOOGLE_DRIVE_ROOT_FOLDER_ID` points to a single root folder in Google Drive.
- Both production assets and automated test assets are uploaded into the **same Google Drive root folder**.

---

## 2. Live Drive Evidence of Test Pollution

Inspection of the live Google Drive root folder reveals direct pollution from integration test runs:
- `BP-CNT-E2E17-1790513156435` (Test folder created during Phase 17 E2E tests)
- `BP-CNT-E2E17-1790514028670` (Test folder created during Phase 17 E2E tests)
- 40+ test files and folders currently residing in **Google Drive Trash** (`trashed = true`).

---

## 3. Risk Assessment: **NO CLEAR SEPARATION (HIGH RISK)**
Without environment-specific root folders (e.g. `PROD_ROOT_FOLDER_ID` vs `TEST_ROOT_FOLDER_ID`), running test suites directly clutters production Drive storage, increases Google API quota consumption, and risks accidental deletion of production media during test cleanup routines.
