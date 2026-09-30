# Database Problem Register

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 17 of 30  
**Document:** 36 of 39  

---

## 1. Problem Classification & Risk Distribution

A forensic analysis of the database architecture, persistence tier, and Google Sheets integration identified **28 distinct problem findings**:

| Risk Severity | Total Findings | Classification Summary |
| :--- | :---: | :--- |
| **CRITICAL** | **6** | Zero ACID transactions, PK collision race, missing storage FKs, multi-instance lock bypass, quota exhaustion, test data leakage |
| **HIGH** | **12** | Full-table `O(N)` scans, JSON string corruption risk, uncoordinated cache invalidation, missing row-level security, legacy column redundancy, unbounded memory consumption, missing optimistic locks, direct client bypasses, blind overwrites, dual canonical states, HTTP request timeouts, unindexed join queries |
| **MEDIUM** | **6** | Dormant join table (`QUESTION_VIDEOS`), type coercion in numeric cells, header reordering vulnerability, single service account bottleneck, hard-coded fallback store, lack of point-in-time recovery |
| **LOW** | **4** | Missing query pagination pushdown, redundant timestamp serializations, non-standard ID pad lengths, deprecated schema comments |

---

## 2. Complete Inventory of the 28 Database Problems

### Critical Severity (DB-CRIT-01 to DB-CRIT-06)
- **DB-CRIT-01 (Zero ACID Transactions):** 19 multi-sheet operations write sequentially across Google Sheets without rollback capability; failures leave entities in desynchronized intermediate states.
- **DB-CRIT-02 (Primary Key Sequence Collisions):** `SequencesRepository` read-modify-write cycle is not atomic; concurrent creation requests generate duplicate primary keys.
- **DB-CRIT-03 (Total Absence of Storage-Tier Foreign Keys):** 32 relational connections rely 100% on application checks; manual sheet edits or direct script deletions generate orphaned child records.
- **DB-CRIT-04 (Multi-Instance Lock Breakdown on Cloud Run):** `BaseRepository.recordLocks` is an in-memory process map; auto-scaled Cloud Run containers bypass locks, allowing race conditions.
- **DB-CRIT-05 (Google Sheets Quota Exhaustion):** Strict 300 req/min limit per project causes HTTP 429 service denial under moderate user activity.
- **DB-CRIT-06 (Test Data Contamination Risk):** Test scripts fallback to `SPREADSHEET_ID` if `TEST_SPREADSHEET_ID` is unset, writing test rows directly into production.

### High Severity (DB-HIGH-01 to DB-HIGH-12)
- **DB-HIGH-01 (Full-Table `O(N)` Scans):** Every `findById` or filter query downloads the entire worksheet over HTTPS, causing latency to degrade linearly with row count.
- **DB-HIGH-02 (JSON Cell Parsing Failures):** 28 columns store stringified JSON; syntax errors in cells cause catastrophic page-level 500 errors.
- **DB-HIGH-03 (Cache Incoherency Across Replicas):** Cloud Run containers do not share cache invalidation signals; stale rows served for up to 30 seconds.
- **DB-HIGH-04 (Zero Row-Level Security in Storage):** Service account possesses global editor rights over all sheets; no database-level user isolation.
- **DB-HIGH-05 (Active Column Redundancy):** Dual maintenance of `content_id` and `content_master_id` across multiple sheets.
- **DB-HIGH-06 (Unbounded Heap Consumption):** Deserializing thousands of rows into V8 memory on every query risks Node.js Out-Of-Memory crashes.
- **DB-HIGH-07 (Blind Last-Write-Wins Overwrites):** Updates overwrite entire rows without optimistic version tokens (`etag`/`versionHash`).
- **DB-HIGH-08 (Direct Client Access Bypasses):** Utilities and scripts invoke `googleSheetsClient` directly, bypassing schema contracts and lock maps.
- **DB-HIGH-09 (Dual Canonical Workflow Divergence):** UI conveyor stepper uses 7-state enum while orchestration repository uses 11-state enum.
- **DB-HIGH-10 (Unbounded HTTP Call Latency):** Google APIs client lacks explicit call timeouts, exposing server threads to hanging connections.
- **DB-HIGH-11 (Redundant Relational Join Tables):** `QUESTION_VIDEOS` duplicates associations stored in `QUESTIONS.video_ids`.
- **DB-HIGH-12 (In-Memory Join Bottlenecks):** Cross-table joins execute multiple sequential sheet downloads, multiplying network latency.

### Medium Severity (DB-MED-01 to DB-MED-06)
- **DB-MED-01 (Dormant Version Tables):** `PINNED_COMMENT_VERSIONS` and `THUMBNAIL_VERSIONS` accumulate rows with minimal consumer read traffic.
- **DB-MED-02 (Sheet Type Auto-Coercion):** Google Sheets auto-formats alphanumeric strings into dates or scientific notation.
- **DB-MED-03 (Header Renaming Vulnerability):** Modifying a column header in Google Sheets immediately triggers `MissingHeaderError`.
- **DB-MED-04 (Single Service Account Throughput Bottleneck):** All application traffic funnels through one Google Service Account.
- **DB-MED-05 (Ephemeral Fallback Store):** Local development data in `fallbackStore` is wiped on server restart.
- **DB-MED-06 (Absence of Point-in-Time Recovery):** Backups rely on manual snapshot exports rather than continuous WAL transaction logging.

### Low Severity (DB-LOW-01 to DB-LOW-04)
- **DB-LOW-01 (No Pagination Pushdown):** Pagination is evaluated via in-memory array slicing after full sheet fetch.
- **DB-LOW-02 (Redundant Timestamp Serialization):** Mixed ISO 8601 formatting across dates.
- **DB-LOW-03 (Non-Standard Sequence Pad Lengths):** Pad lengths vary between 3, 4, 5, 6, and 8 digits across entities.
- **DB-LOW-04 (Deprecated Schema Comments):** Outdated phase comments in `google-sheets-schema.ts`.
