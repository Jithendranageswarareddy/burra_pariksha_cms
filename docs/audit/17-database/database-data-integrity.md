# Database Data-Integrity Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 17 of 30  
**Document:** 35 of 39  

---

## 1. Forensic Integrity Vulnerabilities

A comprehensive static analysis of the persistence architecture reveals five critical data integrity vulnerability vectors:

### 1. Dangling Foreign Keys (Orphaned Rows)
- **Mechanism:** When a `Topic` is deleted, child `Questions` referencing `topic_id` are not automatically deleted because Google Sheets has no `ON DELETE CASCADE`.
- **Mitigation:** The application includes `deletion-safety.service.ts` which performs manual pre-deletion checks. If this service is bypassed (e.g. direct Sheet edits or utility scripts), orphaned rows accumulate.

### 2. Primary Key Collisions
- **Mechanism:** Sequence counter increment in `SequencesRepository` is not atomic across concurrent HTTP requests.
- **Result:** Two records generated with identical IDs (e.g. `BP-Q-000104`).

### 3. Corrupted Serialized JSON in Tabular Cells
- **Mechanism:** 28 columns store JSON strings (`QUESTIONS.video_ids`, `CONTENT_PLANS.target_dates`).
- **Result:** If a user edits a cell in Google Sheets and introduces a syntax error (e.g. missing quote), `JSON.parse()` throws an unhandled exception, causing 500 errors across entire list views.

### 4. Partial-Save Intermediate States
- **Mechanism:** A multi-step transaction fails at step 2 of 3.
- **Result:** Video marked as `READY_FOR_REVIEW`, but the corresponding review checklist in `SOCIAL_REVIEWS` was never created.

### 5. Type Coercion Drift
- **Mechanism:** Google Sheets automatically coerces strings that look like dates or numbers (e.g. `"12-04"` converted to a date serial number).
- **Result:** Code strings or identifiers unexpectedly transformed into floating-point numbers.
