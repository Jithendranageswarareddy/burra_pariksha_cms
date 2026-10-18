# BURRA PARIKSHA CMS — HARDENING PASS 3 REPORT
## Firestore, Data Integrity, Concurrency, and Persistence

**Repository:** `Jithendranageswarareddy/burra_pariksha_cms`
**Authority:** `AGENTS.md`, Five-Pass Autonomous End-to-End Hardening Program
**Document Location:** `docs/quality/HARDENING-PASS-3.md`
**Date:** Post-Sprint 10 Release
**Status:** COMPLETE & VERIFIED

---

## 1. Executive Summary

Pass 3 inspected and verified the persistence layer, data integrity rules, multi-mode document schema storage, optimistic concurrency control, and datastore test isolation guards.

Cloud Firestore remains the sole authoritative transactional datastore in collection `question_drafts`. No competing or secondary databases exist. All test suites operate under strict fail-closed isolation guards ensuring live production data is never mutated during development.

---

## 2. Detailed Inspection & Hardening Areas

### A. Repository and Datastore Authority
- **Sole Transactional Datastore:**
  - Verified `FirestoreQuestionDraftRepository` in `backend/infrastructure/persistence/firestore/firestore-question-draft.repository.ts`.
  - Zero Google Sheets, SQLite, or secondary database persistence introduced.
- **Taxonomy Invariant:**
  - Strictly preserves two-tier `Topic -> Subtopic` canonical schema.
  - Category field remains obsolete and strictly excluded from all schemas and queries.
- **Stable Identifiers:**
  - All IDs generated via collision-resistant UUIDs from `shared/lib/id.service.ts`.
  - Sequential counters or custom allocation collections are strictly avoided.

### B. Persistence, Schema Integrity & Multi-Mode Mapping
- **Mode-Specific Payloads:**
  - **Mode 1 (`QUESTION_CHALLENGE_SHORT`):** Stores prompt, options, correct index, explanation, vertical aspect ratio `9:16`, duration $\le 58s$.
  - **Mode 2 (`TOPIC_INTRODUCTION`):** Stores title, concept hook, key takeaways array, aspect ratio (`9:16` or `16:9`), strictly $0$ questions.
  - **Mode 3 (`EXPLAINED_QUESTIONS_VIDEO`):** Stores question array with batch sizes $\{5, 10, 15, 20\}$, options, answer keys, explanations, landscape aspect ratio `16:9`.
- **Field Loss Prevention:**
  - Deserialization mappings preserve optional fields and mode-specific parameters without silent truncation.
- **Optimistic Concurrency Control (OCC):**
  - All write and transition methods check `draft.version === expectedVersion`.
  - If a concurrent actor has updated the record, the transaction throws `ConcurrencyConflictError` (HTTP 409).
  - Draft revision increments monotonically on every save.

### C. Queries and Operational Behavior
- **Query Bounding & Filtering:**
  - All collection queries enforce explicit limit constraints (max 50 per page).
  - Queries filter by tenant/topic and sort by `updatedAt DESC`.
- **Composite Index Requirements:**
  - Queries filtering by `mode + workflowState` and ordering by `updatedAt` require composite index definitions.
  - These definitions are fully documented in `firestore.indexes.json` for owner manual deployment.

### D. Datastore Isolation Guard (SEC-001)
- **Fail-Closed Protection:**
  - `evaluateDatastoreIsolation()` in `shared/lib/datastore-isolation.guard.ts` inspects Firebase Admin initialization.
  - Execution aborts immediately unless:
    1. `FIRESTORE_EMULATOR_HOST` is explicitly set to an active local emulator host.
    2. Project ID matches an approved synthetic test identifier (e.g., `demo-*` or `test-*`).
  - Production project IDs (e.g., `burra-pariksha-prod`) are rejected with fatal abort, preventing accidental test mutation of production records.

---

## 3. Issues Addressed in Pass 3

- **SEC-001:** Hardened datastore isolation guard to fail-closed on any non-emulator or production project configuration. (Status: Verified).
- **DAT-001:** Verified OCC concurrency checks in Firestore repository transactions. (Status: Verified).
- **DAT-002:** Verified multi-mode schema isolation across Modes 1, 2, and 3. (Status: Verified).

---

## 4. Verification Evidence

- `npm run test:isolation`: 8/8 tests pass (validates fail-closed behavior across missing emulator host, invalid project ID, and approved local emulator).
- `tests/integration/question-generation/s10-t18-multimode-persistence-isolation.integration.test.ts`: 6/6 tests pass (validates multi-mode persistence, isolation, and OCC).
- `tests/unit/question-generation/s9-t14-draft-resumption.unit.test.ts`: Passed (validates draft save and resumption cycles).

**Pass 3 Outcome:** PASS. Firestore persistence, concurrency control, and datastore isolation guards are completely verified.
