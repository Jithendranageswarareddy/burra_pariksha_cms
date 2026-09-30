# Migration vs Current Schema Comparison

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 17 of 30  
**Document:** 14 of 39  

---

## 1. Schema Drift Analysis

Because migrations are not tracked via an automated schema migration engine, schema drift between development environments, test fixtures, and live spreadsheets is common:

| Domain Entity | Schema Contract Expectation | Live Google Sheets Implementation | Discrepancy / Drift Status |
| :--- | :--- | :--- | :---: |
| **QUESTIONS** | 38 columns (including `validation_score`) | In older test sheets, `validation_score` is absent | **RESOLVED VIA COMPATIBILITY CODE** |
| **VIDEOS** | Contains both `content_id` and `content_master_id` | Both columns present in live sheet; duplicate data | **ACTIVE SCHEMA REDUNDANCY** |
| **CONTENT_MASTERS** | 12 columns | Tab added in Phase 12; older spreadsheets lack tab | **TAB VERIFICATION REQUIRED** |
| **QUESTION_CONFIG** | 10 columns | Tab added in Phase 14 for runtime config | **PRESENT IN LATEST BASELINE** |
| **MEDIA_ASSETS** | 12 columns | Tab added in Phase 18 for Google Drive asset tracking | **PRESENT IN LATEST BASELINE** |

---

## 2. Dynamic Schema Validation (`validateWorksheetHeaders`)

To prevent catastrophic runtime failures from schema drift, `BaseRepository` calls `validateWorksheetHeaders` on initialization:
- Fetches Row 1 headers from Google Sheets.
- Compares fetched headers against `schema.columns.map(c => c.name)`.
- If a required column is missing from the sheet, throws `MissingHeaderError(missingHeaders, sheetName)`.
- If extra columns exist in the sheet, they are ignored if `allowUnknownColumns === true`.
