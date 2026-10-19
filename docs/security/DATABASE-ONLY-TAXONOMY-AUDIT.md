# BP-CMS — STRICT DATABASE-ONLY TAXONOMY AUDIT AND REMEDIATION REPORT

**Author:** Antigravity Engineering  
**Date:** 2026-10-19  
**Status:** COMPLETE & VERIFIED  
**Classification:** Security & Architecture Audit  

---

## 1. Executive Summary

This audit enforces Cloud Firestore as the **sole authoritative runtime source of truth** for all Topics and Subtopics in the Burra Pariksha Content Management System (BP-CMS). 

Previously, certain parts of the codebase contained legacy hardcoded default IDs (`BP-TOP-001`, `BP-SUB-0001`), static counts (`100 Topics Complete`), and dynamic fallback imports to `src/lib/data/production-taxonomy.ts` in Question Generation and Smart Randomization backend services.

Through this remediation:
1. **All runtime fallbacks to static taxonomy arrays were eliminated** from both backend and frontend.
2. **All hardcoded fallback IDs in UI components were removed**, ensuring UI selectors derive options strictly from live API responses.
3. **Database initialization/seed data was strictly quarantined** from runtime execution paths.
4. **Zero production data was modified**; live verification was performed against the configured development/test Firestore database (`burra-pariksha-cms`, db: `ai-studio-burraparikshacon-f592ca42-39af-4d83-aff2-6870ba939b0e`).
5. **Architectural regression tests were added** and verified to prove zero frontend/backend runtime imports of seed data and complete adherence to database-only data flows.

---

## 2. Inventory of Taxonomy Sources & Classification

Every occurrence of taxonomy references across the repository was audited and classified:

| Path / Location | Classification | Description & Remediation |
|---|---|---|
| `backend/domain/question-generation/question-generation.service.ts` | **Runtime fallback (REMEDIATED)** | Contained dynamic fallback imports to `PRODUCTION_TOPICS` and `PRODUCTION_SUBTOPICS` when topics/subtopics were not found in Firestore. **Remediated**: Removed all fallbacks; now throws explicit domain errors (`Topic ${id} not found in database taxonomy`) and returns strictly what Firestore contains. |
| `backend/infrastructure/services/smart-random.service.ts` | **Runtime fallback (REMEDIATED)** | Had fallback to `PRODUCTION_TOPICS` when resolving topic names. **Remediated**: Replaced with clean `topicName: topic.name || options.topicId` without static imports or fabricated taxonomy. |
| `backend/domain/taxonomy/services/taxonomy.service.ts` | **Runtime logic (REMEDIATED)** | Metric calculation hardcoded topic completeness against `100`. **Remediated**: Now dynamically checks whether each active topic has configured subtopics (`t.subtopicsCount > 0`). |
| `frontend/pages/QuestionDetailPage.tsx` | **UI fallback (REMEDIATED)** | Had fallback `q.topicId || 'BP-TOP-001'` and `question.subtopicId || 'BP-SUB-0001'`. **Remediated**: Now uses dynamic question IDs or empty strings; navigation links point cleanly to `/studio` or dynamic parameters. |
| `frontend/components/questions/QuestionTable.tsx` | **UI fallback (REMEDIATED)** | Used fallback `q.topicId || 'BP-TOP-001'` in studio creation link. **Remediated**: Changed to `/studio` without fabricating a topic ID. |
| `frontend/components/dashboard/OperationalDispatch.tsx` | **UI fallback (REMEDIATED)** | Hardcoded studio link `/studio?topicId=BP-TOP-001&subtopicId=BP-SUB-0002`. **Remediated**: Replaced with clean `/studio` link. |
| `frontend/pages/QuestionLibraryPage.tsx` | **UI placeholder (REMEDIATED)** | Included hardcoded filter option `(BP-TOP-001...)`. **Remediated**: Filter options now populate strictly from dynamic `topics` query. |
| `frontend/pages/SettingsPage.tsx` | **UI metric/placeholder (REMEDIATED)** | Initialized subtopic form with `BP-TOP-001` and hardcoded "100 Topics Complete" in status banner. **Remediated**: Form defaults to empty string `''`; banner now dynamically reads database metric values. |
| `frontend/pages/PlanningPage.tsx` | **Planning target (REMEDIATED)** | Displayed curriculum structure. **Remediated**: Explicitly labeled banner as "Target Planning Model (Future Roadmap)" to distinguish from actual live database inventory. |
| `src/lib/data/production-taxonomy.ts` | **Database initialization / Architecture fixture (PERMITTED)** | Contains the 100-topic reference catalog. **Quarantined**: File header updated to declare it exclusively for database seeding tooling and architectural contract tests. Zero production code imports this file. |
| `scripts/seed-launch-taxonomy.ts` | **Database initialization tooling (PERMITTED)** | Explicit offline CLI script (`npm run seed:taxonomy`) used by administrators to populate Firestore. Does not run during normal startup. |
| `tests/fixtures/taxonomy.fixture.ts` | **Test fixture (PERMITTED)** | Isolated synthetic test mocks used exclusively inside unit test runners. |
| `docs/sprints/*` | **Historical record (PERMITTED)** | Immutable sprint specifications retained for provenance only. |

---

## 3. Authoritative Runtime Architecture & Data Flow

The canonical runtime data flow is strictly database-driven:

```
[Question Studio / UI Selectors]
         │
         ▼  (authenticated HTTP GET)
[Backend Express API Routes]
  • GET /api/taxonomy/pure-tree
  • GET /api/taxonomy/topics
  • GET /api/taxonomy/topics/:topicId/subtopics
         │
         ▼  (in-memory delegation)
[TaxonomyDomainService]
         │
         ▼  (typed domain queries)
[FirestoreTopicRepository / FirestoreSubtopicRepository]
         │
         ▼  (Firestore Admin SDK)
[Cloud Firestore Database]
  • Collection: "topics"
  • Collection: "subtopics"
```

### Guarantees Enforced:
1. **Topic derivation:** Options in Question Studio (`/studio`) and Settings (`/settings?tab=taxonomy`) are derived exclusively from the backend response.
2. **Subtopic derivation:** Subtopic options are derived strictly by querying the selected Topic's ID. When a user changes the Topic selector, the previously selected Subtopic is immediately cleared.
3. **No silent fallbacks:** If Firestore has no Topics, the API returns an empty array `[]`. The UI displays an explicit empty state: *"No topics available in database. An administrator must configure or seed taxonomy first."*
4. **Error handling:** If the backend API fails (HTTP 500 / network error), the UI transitions to an explicit error banner with a retry action, rather than substituting fallback topics.
5. **Security boundaries:** Frontend code never imports Firestore Admin SDK, server secrets, or seed files.

---

## 4. Firestore Database Verification (Configured Nonproduction Database)

Direct verification was performed against the active nonproduction Firestore instance configured in the environment:

- **Firebase Project ID:** `burra-pariksha-cms`
- **Database ID:** `ai-studio-burraparikshacon-f592ca42-39af-4d83-aff2-6870ba939b0e`
- **Topic Collection:** `topics`
  - Total Active Documents: **2**
  - Topic 1: `Aptitude` (ID: `top_ae4e76a9-8d7d-4ba6-8671-55ef6d8e87d4`, Status: `active`, Subtopics Count: 18)
  - Topic 2: `Reasoning` (ID: `top_25d9eeae-b3ff-4cf4-aa3c-ea1be742d139`, Status: `active`, Subtopics Count: 18)
- **Subtopic Collection:** `subtopics`
  - Total Active Documents: **36** (18 for Aptitude, 18 for Reasoning)
  - References: Every subtopic document carries a valid `topicId` pointing to its parent topic document.
- **Production Data Safety:** Verified zero mutations or deletes were executed against production environments.

---

## 5. Architectural Verification & Automated Tests

A dedicated architectural test suite was created in `tests/architecture/strict-database-taxonomy.test.ts` and integrated into `npm run test:architecture`.

### Test Execution Output:

```
========================================================================
STRICT DATABASE-ONLY TAXONOMY ARCHITECTURAL TEST SUITE
Goal: Cloud Firestore as Sole Authoritative Source of Truth
========================================================================

[PASS] 1. Zero production frontend or backend files import production-taxonomy seed data
[PASS] 2. Normal application startup script does not invoke database seeding
[PASS] 3. questionGenerationService resolves taxonomy strictly from Firestore without seed fallbacks
[PASS] 4. smartRandomService does not silently fall back when topic is not found
[PASS] 5. UI validation guard prevents generation when database taxonomy is empty
[PASS] 6. UI validation guard prevents generation when API reports error
[PASS] 7. Switching Topics clears stale Subtopic selections
[PASS] 8. Cloud Firestore database contains exactly 2 active Topics and 36 Subtopics

========================================================================
STRICT DATABASE TAXONOMY SUITE COMPLETE: 8 PASSED, 0 FAILED
========================================================================
```

---

## 6. Conclusion & Definition of Done Verification

| Requirement | Status | Evidence |
|---|---|---|
| Topics and Subtopics originate exclusively from Firestore via API | **PASS** | Verified in `question-generation.service.ts`, `smart-random.service.ts`, and `tests/architecture/strict-database-taxonomy.test.ts` |
| Empty database produces empty-state UI, no fabricated options | **PASS** | `QuestionStudioPage.tsx` and unit tests verify `topics.length === 0` renders empty state message |
| API errors display error state instead of fallback | **PASS** | UI state machine checks `error` before options |
| Stale subtopic cleared on topic switch | **PASS** | State handler in `QuestionStudioPage.tsx` sets `subtopicId: ""` upon topic change |
| Seed script isolated from runtime | **PASS** | AST search confirms 0 runtime imports of `production-taxonomy.ts` |
| Zero production data modified | **PASS** | All read validations executed read-only against nonproduction Firestore |
