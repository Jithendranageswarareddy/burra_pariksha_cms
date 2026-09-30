# Hardcoded Drive References Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 28 of 40  

---

## 1. Codebase Scan for Hardcoded Drive Constants

A scan of all source and test files reveals several hardcoded Drive references:

| Reference / String | Location | Purpose / Usage | Risk Classification |
| :--- | :--- | :--- | :---: |
| `fixed_drive_file_id_12345` | `src/tests/qs14b-e2e-production-execution.ts` | Mock Drive File ID injected into Google Sheets | **HIGH (LEAKED TO PROD SHEETS)** |
| `https://drive.google.com/drive/folders/`| `src/lib/services/thumbnail.service.ts` | URL prefix for folder web links | **LOW (STANDARD URL)** |
| `https://drive.google.com/file/d/` | `src/lib/services/google-drive.service.ts` | URL prefix for file view links | **LOW (STANDARD URL)** |
| `Burra Pariksha` | `src/lib/services/google-drive.service.ts:333` | Default root folder name if env var is missing | **MEDIUM (HARDCODED FALLBACK)** |
| `Content` | `src/lib/services/google-drive.service.ts:335` | Hardcoded subfolder name in Phase 7 convention | **MEDIUM (FIXED CONVENTION)** |

---

## 2. Hardcoded Synthetic ID Contamination
The mock string `fixed_drive_file_id_12345` was hardcoded in test scripts and subsequently written into the live Google Spreadsheet during automated test execution, contaminating six active production rows in `VIDEOS` and `MEDIA_ASSETS`.
