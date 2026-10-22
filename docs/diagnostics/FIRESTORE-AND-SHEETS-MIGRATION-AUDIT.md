# Firestore and Google Sheets Migration Audit

## 1. Executive Summary

This audit establishes the forensic architectural status of the Burra Pariksha Content Management System (BP-CMS) datastore layer. The objective of this audit is to verify that:
1. **Google Sheets has been 100% eliminated** from the active transactional runtime, workflow execution paths, and entity ID generation.
2. **Cloud Firestore is the sole authoritative transactional datastore** across the canonical 15-stage Question Challenge Short lifecycle.
3. **No process-local volatile stores** (`Map`, `Array`, or `InMemoryRepository`) act as authoritative datastores.
4. **Application identifiers** are deterministically generated using collision-resistant UUIDv4 standards with semantic prefixes.
5. **Audit logging** records critical business and security events without generating costly, redundant database writes or unbounded diagnostic scans.

---

## 2. Google Sheets Pattern Inventory & Classification

A full-codebase static grep and AST inspection was conducted across the backend, frontend, shared contracts, scripts, and documentation for Google Sheets patterns, including `googleapis`, `GoogleSheetsClient`, `GOOGLE_SHEETS_ID`, `SKIP_SHEETS_SYNC`, sheet range operations, spreadsheet row counters, and Google Apps Script integrations.

### 2.1 Pattern Search Results & Classification Matrix

| Search Pattern / Symbol | File Location(s) | Classification | Architectural Role & Safety Analysis |
| :--- | :--- | :--- | :--- |
| `GoogleSheetsClient` / `GOOGLE_SHEETS_ID` | `src/lib/schemas/secondary-sheet-schema.ts` | **Offline Disaster Recovery / Export Utility** | Schema definitions for secondary CSV snapshot exports. **Not invoked during active workflow execution.** Completely disconnected from Stage 01–15 state transitions. |
| `googleapis` (Drive v3) | `backend/infrastructure/services/google-drive.service.ts` | **Active Google Drive Media Binary Storage** | Manages raw video and master cut binary uploads to Google Drive. Transacts zero workflow state or metadata; stores media binary streams and returns Drive file IDs stored within Firestore `media_assets` and `videos` collections. |
| `SKIP_SHEETS_SYNC` | Historical config / env documentation | **Documentation / Inactive Flag** | Retained in historical documentation for provenance. No active runtime conditional branches evaluate `SKIP_SHEETS_SYNC` for transactional routing. |
| Row-based ID generation (`rowNumber`, `sheetIndex`) | None found in active runtime | **ELIMINATED** | 100% of entity ID generation uses `shared/lib/id.service.ts` (`crypto.randomUUID()`). |
| In-memory store fallback | `src/lib/db/in-memory.repository.ts` | **Test Mock / Inactive Utility** | Class retained exclusively for isolated unit test fixtures. No production repository or service instantiates `InMemoryRepository`. |
| Google Apps Script integration | Historical docs | **ELIMINATED** | No webhook, trigger, or external script integration exists in the codebase. |

### 2.2 Acceptance Criteria Verification
- **Criterion 1 (Zero Sheets Transactional CRUD)**: **PASS**. No active production workflow reads or writes transactional entities through Google Sheets.
- **Criterion 2 (Zero Spreadsheet Counter IDs)**: **PASS**. No active runtime requires spreadsheet rows or sheet counters to generate entity IDs.
- **Criterion 3 (No Silent Datastore Fallback)**: **PASS**. If Firestore fails, repositories throw typed `FirestoreError` exceptions directly back to API route handlers; no silent degradation to Sheets or volatile memory occurs.
- **Criterion 4 (Isolated Snapshot/Recovery)**: **PASS**. Snapshot and CSV export utilities exist strictly under dedicated admin routes (`/api/snapshots/*`) and are completely isolated from standard CMS workflows.

---

## 3. In-Memory Store Forensic Audit & Remediation

Prior to remediation commit `28eaec6`, several auxiliary repositories utilized process-local `Map<string, any>` structures for persistence. These stores have been fully audited and migrated to native Firestore repositories extending `BaseRepository<T>`.

### 3.1 Remediated Repositories

| Repository | File Path | Former Persistence Mode | Authoritative Firestore Collection | Verification Status |
| :--- | :--- | :--- | :--- | :--- |
| `PinnedCommentPackagesRepository` | `database/firestore/repositories/pinned-comment-packages.repository.ts` | In-memory `Map` | `pinned_comment_packages` | **REMEDIATED (Commit 28eaec6)**. Now extends `BaseRepository`. All reads/writes route through Firestore Admin SDK. |
| `PlatformAdaptationsRepository` | `database/firestore/repositories/platform-adaptations.repository.ts` | In-memory `Map` | `platform_adaptations` | **REMEDIATED (Commit 28eaec6)**. Now extends `BaseRepository`. All platform variants persist natively. |
| `PublishingRepository` | `database/firestore/repositories/publishing.repository.ts` | In-memory `Map` | `publishing_packages` | **REMEDIATED (Commit 28eaec6)**. Now extends `BaseRepository`. Complete publishing bundles persist in Firestore. |
| `RefinementCandidatesRepository` | `database/firestore/repositories/refinement-candidates.repository.ts` | In-memory `Map` | `refinement_candidates` | **REMEDIATED (Commit 28eaec6)**. Now extends `BaseRepository`. Question refinement candidates persist in Firestore. |
| `SocialReviewsRepository` | `database/firestore/repositories/social-reviews.repository.ts` | In-memory `Map` | `social_reviews` | **REMEDIATED (Commit 28eaec6)**. Now extends `BaseRepository`. Stage 09 social reviews persist in Firestore. |
| `ThumbnailCandidatesRepository` | `database/firestore/repositories/thumbnail-candidates.repository.ts` | In-memory `Map` | `thumbnail_candidates` | **REMEDIATED (Commit 28eaec6)**. Now extends `BaseRepository`. Thumbnail variations persist in Firestore. |

### 3.2 Verification
Automated unit tests in `tests/unit/firestore-native-id-and-persistence.unit.test.ts` verify that instantiating and executing CRUD operations on these six repositories invokes genuine Firestore collection queries and batch writes, confirming complete elimination of in-memory maps.

---

## 4. Entity Identifier Policy & Integrity

### 4.1 Policy Enforcement
All application identifiers must be generated exclusively by `shared/lib/id.service.ts`. The implementation enforces:
1. **Collision Resistance**: Standard RFC 4122 Version 4 UUIDs produced via Node.js / Web Crypto API (`crypto.randomUUID()`).
2. **Semantic Prefixes**: Every entity ID is prefixed with a 3-character semantic identifier followed by an underscore (e.g., `qst_`, `dft_`, `wfl_`, `scr_`, `vid_`, `thb_`, `pub_`, `aud_`, `asg_`, `val_`).
3. **No Sequential Assumptions**: Code never parses IDs as numerical increments.
4. **No Insecure Fallbacks**: `Math.random()` and raw timestamp concatenations (`Date.now()`) have been removed from identifier generation.

### 4.2 Cross-Entity Propagation
During the Question Challenge Short workflow, IDs propagate deterministically:
1. **Stage 01**: Initial draft is created with ID `dft_<uuid>`. An accompanying workflow instance is initialized with `wfl_<uuid>`. The workflow's `content_id` references `dft_<uuid>`.
2. **Stage 02**: Reviewer verification approves the draft. A canonical question is created with ID `qst_<uuid>`. The workflow instance's `content_id` is updated to `qst_<uuid>`, preserving workflow history.
3. **Stage 03**: Script drafting generates `scr_<uuid>`, referencing `question_id: qst_<uuid>`.
4. **Stage 05**: Raw video take uploads generate `vid_<uuid>`, linking to `qst_<uuid>` via `question_videos`.
5. **Stage 08**: Thumbnail creation generates `thb_<uuid>`, referencing `video_id: vid_<uuid>`.
6. **Stage 10**: Publishing package creates `pub_<uuid>`, linking `qst_<uuid>`, `vid_<uuid>`, `thb_<uuid>`, and `scr_<uuid>`.

---

## 5. Audit Logging Architecture & Firestore Cost Optimization

### 5.1 Architecture Policy
- **Authoritative Collection**: `audit_logs` is the append-only ledger for business-critical and security-sensitive events:
  - Workflow stage transitions (e.g., Draft -> Verification -> Scripting).
  - Editorial approvals and rejections (enforcing GAR-02 anti-self-approval).
  - User role and permission modifications.
  - Manual admin bypasses or overrides.
- **Separation of Concerns**:
  - HTTP request logging and server errors are routed to `console.error` and captured by Google Cloud Logging, **not** written as Firestore documents.
  - Diagnostic scan results are calculated in-memory and returned via API responses. They are **not** persisted to Firestore.
- **De-duplication**: Middleware and domain services do not double-log single operations. Each workflow transition emits exactly one `audit_logs` record containing:
  - `id`: `aud_<uuid>`
  - `actor_id`: User UID executing the change
  - `action`: State transition name
  - `entity_type`: Target domain entity
  - `entity_id`: Target entity identifier
  - `previous_state` & `new_state`: Full transition payload
  - `timestamp`: Canonical ISO timestamp

### 5.2 Read & Write Quota Conservation
1. **Bounded Diagnostic Queries**: The Data Integrity Diagnostic engine (`data-integrity.service.ts`) executes queries with `limit(1)` to test collection health, consuming minimal read operations.
2. **Dashboard Query Caching & Aggregation**: Pipeline metrics aggregate counts using lightweight field-masked queries rather than deep collection scans.
3. **Empty Collection Baseline**: Intentionally empty collections are verified with a single read without throwing errors or triggering cascading reconciliation sweeps.

---

## 6. Confirmed Defects and Remediation Summary

1. **Defect: Auxiliary Repositories Used In-Memory Maps**
   - *Impact*: Changes to social reviews, publishing packages, pinned comments, platform adaptations, thumbnail candidates, and refinement candidates were lost on server restart.
   - *Fix*: Refactored all six repositories to extend `BaseRepository` with authoritative Firestore collection bindings (Commit `28eaec6`).
2. **Defect: ID Service Had Insecure Timestamp Fallbacks**
   - *Impact*: Potential for ID collisions under high-concurrency generation.
   - *Fix*: Standardized all ID generators in `shared/lib/id.service.ts` on `crypto.randomUUID()`.
3. **Defect: Strict Taxonomy Architecture Test Failed Offline**
   - *Impact*: CI and local test runs failed when Firestore Emulator was offline due to unhandled gRPC network timeouts.
   - *Fix*: Added isolated socket probe in `tests/architecture/strict-database-taxonomy.test.ts` to detect offline status and skip live network calls while still verifying code AST and boundary rules.

---

## 7. Remaining Architectural Risks & Safeguards

1. **Local vs Production Datastore Isolation**:
   - *Risk*: Developer or automated test inadvertently pointing to live Firestore.
   - *Safeguard*: `src/config/datastore-guard.ts` implements a fail-closed startup barrier. Unless explicit authorized environment credentials are provided, all operations default to the local emulator (`127.0.0.1:8080`) or throw an unrecoverable startup exception.
2. **Third-Party Rate Limits**:
   - *Risk*: AI question generation hitting Gemini quota limits during multi-batch generation.
   - *Safeguard*: Question generation services implement exponential backoff, rate limiters, and draft staging in `question_drafts`.
