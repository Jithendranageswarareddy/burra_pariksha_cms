# Final Database Baseline Specification

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 17 of 30  
**Document:** 39 of 39  

---

## 1. Master Architectural Baseline Summary

This baseline specification establishes the authoritative forensic record of the database and persistence architecture of Burra Pariksha CMS as of **2026-09-29**:

1. **Database Technology:**  
   Zero relational (PostgreSQL, MySQL, SQLite) or NoSQL (MongoDB, Firestore) databases exist in runtime. Google Sheets API v4 serves as the authoritative tabular database.
2. **Connection Architecture:**  
   RESTful HTTPS requests via `googleapis` using OAuth 2.0 JWT service account credentials. No persistent TCP connection pool.
3. **Environment Separation:**  
   Controlled via `SPREADSHEET_ID` and `ANALYTICS_SPREADSHEET_ID`. In-memory `Map` fallback activated when Google Cloud credentials are omitted.
4. **Schemas:**  
   25 authoritative schemas registered in `src/lib/schemas/google-sheets-schema.ts` (23 core + 2 planning).
5. **Tables:**  
   25 worksheet tabs in primary CMS spreadsheet, 5 worksheet tabs in secondary analytics spreadsheet.
6. **Columns:**  
   368 total columns across 25 schemas, storing primitives, dates, and stringified JSON.
7. **Primary Keys:**  
   Business formatted string sequences (e.g. `BP-Q-000001`) generated via application-tier `SequencesRepository`.
8. **Foreign Keys:**  
   32 logical relationships; zero storage-tier foreign keys or cascade constraints.
9. **Indexes:**  
   Zero storage-level B-tree or hash indexes. All queries execute as `O(N)` in-memory scans.
10. **Constraints:**  
    Zero database-level constraints. Enforced 100% via Zod schemas and application services.
11. **ORM Models:**  
    Zero ORM models. Custom `SheetSchemaContract` with `objectToRow` / `rowToObject` mapper.
12. **Migrations:**  
    Zero SQL migrations. Operational maintenance executed via standalone TypeScript scripts.
13. **Repositories:**  
    34 repository classes inheriting from `BaseRepository<T>`.
14. **Direct Access:**  
    Utilities (`deletionSafetyService`, `snapshotExporter`) bypass repositories to scan raw rows.
15. **Queries:**  
    Full worksheet fetches over HTTPS followed by in-memory filtering and sorting.
16. **Transactions:**  
    Zero ACID transactions. 19 multi-sheet cascade operations vulnerable to partial failure.
17. **State & Lifecycle:**  
    Conveyor driven by status columns (`QuestionStatus`, `VideoProductionStatus`, etc.) without database transition guards.
18. **Source of Truth:**  
    Google Sheets is authoritative for tabular data; Google Drive is authoritative for binary assets.
19. **Database ↔ Sheets Mapping:**  
    Google Sheets IS the database; no dual-system synchronization required.
20. **Record Conflicts:**  
    No SQL-to-Sheets record drift. Internal cross-sheet link drift exists between `QUESTIONS.video_ids` and `QUESTION_VIDEOS`.
21. **Schema Conflicts:**  
    Minor naming and type drift between TypeScript interfaces and Google Sheets contracts.
22. **Dual-Write Conflicts:**  
    Dual maintenance of `content_id` and `content_master_id` across multiple tabs.
23. **Read-Path Conflicts:**  
    Divergent read paths across draft repositories, live sheets, and drive asset folders.
24. **Duplicate Representations:**  
    `QUESTION_VIDEOS` table vs inline `video_ids` array; dual `CanonicalWorkflowState` enums.
25. **Unused Tables:**  
    `QUESTION_VIDEOS` and `PINNED_COMMENT_VERSIONS` exhibit near-zero consumer traffic.
26. **Duplicate Tables:**  
    No duplicate tables, but conceptual overlaps across planning, batching, and execution umbrellas.
27. **Test Database:**  
    Test suite relies on `TEST_SPREADSHEET_ID` or in-memory fallback; leak risk if env var unset.
28. **Production Database:**  
    Google Workspace Sheets infrastructure governed by strict 300 req/min API quota.
29. **Cloud Run Runtime:**  
    Stateless containers scale independently, causing in-memory lock maps and caches to desynchronize.
30. **Security Architecture:**  
    Single Service Account with broad editor permissions; zero row-level security in storage.
31. **Error Handling:**  
    `GoogleSheetsError` hierarchy with exponential backoff on HTTP 429/503.
32. **Cache Architecture:**  
    60s header cache, 30s row cache, in-process mutation locks.
33. **Data Integrity:**  
    5 primary integrity risks: orphaned records, PK collisions, JSON parsing failures, partial saves, and auto-coercion.
34. **Critical Findings:**  
    6 Critical and 12 High severity problems registered in Problem Register.
35. **Problem Register:**  
    28 classified issues documented in `database-problem-register.md`.
36. **Unknowns:**  
    Exact live row counts and latency distribution pending integration test verification.
37. **Evidence Limitations:**  
    Read-only static code and schema audit; no mutating stress tests or live data changes performed.
