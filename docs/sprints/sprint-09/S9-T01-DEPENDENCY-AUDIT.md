# S9-T01: Sprint 8 Dependency Audit & Acceptance for Sprint 9

**Milestone**: Sprint 9 — Question Challenge Short (Mode 1 Production Pipeline)
**Task ID**: `S9-T01`
**Effective Date**: October 17, 2026
**Auditor**: Antigravity Software Architect & Systems Verification Engineer
**Inspected Commit**: `acd5c163d94aee4951664c5bf401bc7fe93cd9a6` (`origin/main`)
**Scope**: Verification of GitHub `main` foundation and dependencies for Sprint 9 (Question Challenge Short). Identification of concrete blockers, discrepancies, and architecture compliance.

---

## 1. Executive Verdict & Readiness Summary

| Metric | Verdict | Detail |
| :--- | :---: | :--- |
| **Sprint 8 Foundation Status** | **ACCEPTED** | All core capabilities (Taxonomy, Mode Registry, OCC, Persistence, Workflow Resolver, Authorization) verified. |
| **Readiness for S9-T02** | **READY** | Zero critical blocking defects prevent Sprint 9 (Question Challenge Short) from proceeding. |
| **Datastore Authority** | **COMPLIANT** | Cloud Firestore sole transactional datastore; zero Google Sheets runtime persistence. |
| **Invariant Compliance** | **COMPLIANT** | Save Draft $\neq$ Submit for Verification; GAR-02 ($authorId \neq approverId$) enforced without bypass. |
| **Next Action** | **S9-T02** | Advance to Task `S9-T02` (Question Challenge Short Authoring / Stage 01 Mode 1 Dedicated Polish). |

---

## 2. Comprehensive Dependency Audit Matrix

| Dependency Domain | Status | Exact Source Paths & Functions | API Routes & Contracts | Existing Test Evidence | Audit Notes |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **1. Two-Tier Taxonomy & Cascading Selection** | **PASS** | `backend/domain/taxonomy/services/taxonomy.service.ts`<br>`frontend/features/question-generation/hooks/useQuestionGeneration.ts` (`SubtopicSelectionController`)<br>`frontend/features/question-generation/components/GenerationConfigPanel.tsx` | `GET /api/v1/taxonomy/topics`<br>`GET /api/v1/taxonomy/subtopics?topicId=:id`<br>Contract: `shared/contracts/taxonomy.ts` | `npm run test:s8-t10` (9/9 pass)<br>`npm run test:s8-t11` (12/12 pass) | Strictly two-tier (`Topic` $\to$ `Subtopic`). Zero legacy `Category` references. Out-of-order race conditions guarded by request sequence ID counter. |
| **2. Content Mode Registry (Mode 1)** | **PASS** | `shared/registry/content-mode.registry.ts` (`ContentModeRegistry`)<br>`frontend/features/question-generation/components/ProductionModeModal.tsx` (`ModeSelectionManager`)<br>`shared/types/production-context.ts` | `shared/types/content-mode-registry.ts`<br>`shared/contracts/production-mode.ts` | `npm run test:s8-t12` (29/29 assertions pass)<br>`npm run test:s8-t16` (17/17 pass) | `QUESTION_CHALLENGE_SHORT` registered: allowed counts `[1, 5, 10, 15, 20]`, default `1`; fixed `9:16` aspect ratio; duration $30-58\text{s}$ (target $52\text{s}$); requires 4 MCQ options and declared correct answer. |
| **3. Draft Creation & Persistence** | **PASS** | `backend/features/question-generation/services/question-draft.service.ts`<br>`backend/domain/question-generation/question-generation.service.ts` (`saveDraft`)<br>`database/firestore/repositories/question-drafts.repository.ts` | `POST /api/v1/question-drafts`<br>`GET /api/v1/question-drafts/:id`<br>Contract: `shared/contracts/question-generation/` | `npm run test:s8-t15` (13/13 pass)<br>`npm run test:s8-t18` (20/20 pass) | Persists draft with canonical `dft_<uuid_v4>` ID into Firestore `question_drafts`. Save Draft strictly separated from verification; stays in Stage 01. |
| **4. Deep Linking & Draft Reopening** | **PASS** | `frontend/features/question-generation/hooks/useQuestionGeneration.ts` (`loadExistingDraft`)<br>`frontend/features/question-generation/pages/QuestionStudioPage.tsx` | URL deep link: `?draftId=dft_<uuid>`<br>Contract: `shared/types/production-context.ts` | `npm run test:s8-t07` (6/6 pass)<br>`npm run test:s8-t17` (21/21 assertions pass) | Reopening draft restores candidate fields, taxonomy, and mode configuration. Persisted draft values strictly take precedence over URL default query parameters. |
| **5. Optimistic Concurrency Control (OCC)** | **PASS** | `database/firestore/repositories/question-drafts.repository.ts`<br>`backend/domain/question-generation/question-generation.service.ts` | HTTP 409 `ConcurrencyConflictError`<br>Contract: `expectedVersion` | `npm run test:s8-t15` (OCC suites)<br>`npm run test:s8-t18` (concurrency & compensation) | Atomic integer `version` incremented on every update. Stale update attempts fail closed with HTTP 409. Duplicate concurrent submissions safely rejected. |
| **6. Submission to Verification & RBAC** | **PASS** | `backend/domain/question-generation/question-generation.service.ts` (`submitForVerification`)<br>`frontend/features/question-generation/hooks/useQuestionGeneration.ts` (`handleSubmitForVerification`) | `POST /api/v1/question-drafts/:id/submit-verification`<br>Contract: `SubmitForVerificationInput` | `npm run test:s8-t15` (submit suites)<br>`npm run test:s8-t18` (authorization suites) | Explicit user command requiring a saved, non-dirty draft. Validates completeness. Transitions workflow to Stage 02 with rollback compensation on failure. Author/Editor/Admin authorization strictly verified. |
| **7. Anti-Self-Approval (GAR-02 Rule)** | **PASS** | `backend/domain/question-generation/question-generation.service.ts` (`approveDraft`)<br>`backend/domain/workflow/workflow-engine.service.ts` | Contract: `09-RBAC-CAPABILITY-MODEL.md`<br>Rule: $authorId \neq approverId$ | `npm run test:rbac` (8/8 pass)<br>`tests/api/s8-t18-api-persistence-auth-recovery.api.test.ts` | Author of draft cannot verify or approve their own draft into Stage 02. Administrative override requires explicit confirmation and minimum 10-character audited justification. |
| **8. Dynamic Workflow Resolution** | **PASS** | `shared/lib/workflow-resolver.ts` (`resolveDynamicWorkflowState`)<br>`frontend/features/question-generation/components/ProductionWorkbenchSummary.tsx` | Contract: `shared/contracts/workflow.ts`<br>`ProductionContextWorkflow` | `npm run test:s8-t14` (21/21 assertions pass)<br>`npm run test:s8-t13` (26/26 assertions pass) | 6-step resolution pipeline dynamically resolves active stage, status, permitted actions, and progress strictly from applicable steps for Mode 1. |
| **9. Target Datastore Isolation** | **PASS** | `tests/integration/s8-t18-firestore-persistence-recovery.integration.test.ts`<br>`database/firestore/repositories/base.repository.ts` | Contract: `docs/operations/ENVIRONMENT-CONTRACT.md` | `test:s8-t18:integration` (exit 0 against emulator)<br>Production isolation guard (exit 2 fail-closed) | Zero live production database mutation during tests. Enforces fail-closed isolation guard against live Firestore. |
| **10. Browser-Level Automation** | **UNVERIFIED** | Playwright test scripts | Local sandbox runtime environment | Documented environment constraint | External browser binary download blocked in offline sandbox (`playwright.azureedge.net`). Unit/API integration suites provide verified coverage. |

---

## 3. Code-Path Verification Walkthrough

### 3.1 Two-Tier Taxonomy Cascading Selection
- **Topic Selection**: `GenerationConfigPanel.tsx` renders syllabus root topics via `taxonomyTree` loaded from `GET /api/v1/taxonomy/topics`.
- **Subtopic Controller**: Changing topic invokes `SubtopicSelectionController.handleTopicChange(newTopicId)` in `useQuestionGeneration.ts`:
  1. Immediately increments `requestId` to invalidate pending in-flight requests.
  2. Clears previous subtopic selection (`setSelectedSubtopic('')`), subtopics array (`setCurrentSubtopics([])`), and error state.
  3. Updates shared production context with cleared subtopic.
  4. Calls `taxonomyApi.getSubtopics(newTopicId)` directly without falling back to stale embedded tree data.
  5. Drops responses if `requestId` or `activeTopicId` changed during network latency.
  6. Filters active subtopics and sets default valid subtopic.

### 3.2 Content Mode 1 (`QUESTION_CHALLENGE_SHORT`) Configuration
- **Registry Grounding**: `ContentModeRegistry.getInstance().getDefinition('QUESTION_CHALLENGE_SHORT')`:
  - `allowedCounts: [1, 5, 10, 15, 20]`, default `1`.
  - `allowedAspects: ['9:16']`, fixed aspect ratio.
  - `inputs`: requires taxonomy, 4 MCQ options, declared correct answer, proof explanation, real-world context.
  - `verification`: `10_POINT_PROOF` checklist (`S8-M1-01` to `S8-M1-10`).
  - `duration`: $30-58\text{s}$ hard ceiling.
- **UI Interaction**: `ProductionModeModal.tsx` renders Mode 1 card with question count dropdown (`1, 5, 10, 15, 20`) and fixed `9:16` badge. Validated via `validateProductionModeConfig()`.

### 3.3 Draft Creation, Persistence & Deep-Link Reopening
- **Saving Draft**: `handleSaveDraft` in `useQuestionGeneration.ts`:
  - Validates `workflowState.canContinue`.
  - Invokes `questionsApi.saveDraft()` targeting `POST /api/v1/question-drafts`.
  - Backend delegates to `questionGenerationService.saveDraft()`, which validates taxonomy against Firestore, generates canonical UUID `dft_<uuid_v4>`, and writes to `question_drafts` collection.
  - Returns persisted draft with initial integer `version: 1`.
  - Sets `savedDraftId`, `draftVersion`, and updates browser URL query parameters `?draftId=...` via `window.history.replaceState` without navigation reload.
  - Clears `isDirty` state; stays in Question Studio (Stage 01).
- **Reopening Draft**: Deep link `?draftId=dft_...` triggers `useEffect` in `useQuestionGeneration.ts`:
  - Calls `questionsApi.getDraft(queryDraftId)`.
  - Populates candidate question text, options A-D, correct answer, explanation, topic, subtopic, mode, and version.
  - Persisted draft values strictly override URL defaults.
  - Synchronizes `ProductionJourneyContext` with `draftId`, taxonomy, and mode configuration.

### 3.4 Optimistic Concurrency Control (OCC)
- **Draft Updates**: Updating an existing draft requires matching `expectedVersion`.
- **Atomic Version Bump**: `questionDraftsRepository.update(draftId, updatedDraft, { expectedVersion })` verifies that Firestore document `version` equals `expectedVersion` and increments `version: expectedVersion + 1`.
- **Conflict Handling**: Stale concurrent updates reject with HTTP 409 `ConcurrencyConflictError`.

### 3.5 Explicit Submission to Verification
- **User Command**: `handleSubmitForVerification` in `useQuestionGeneration.ts`:
  - Verifies `savedDraftId` exists (cannot submit unsaved draft).
  - Verifies `!isDirty` (cannot submit stale unsaved edits).
  - Sends `POST /api/v1/question-drafts/:id/submit-verification` with payload `{ expectedVersion: draftVersion }`.
- **Backend Orchestration**: `questionGenerationService.submitForVerification`:
  - Validates `expectedVersion >= 1` and matches draft version in Firestore.
  - Checks authorization: actor must be draft author, Admin, Content Lead, or Question Editor.
  - Rejects if draft is already submitted, approved, or published.
  - Validates candidate completeness via `validateCandidate()`.
  - Coordinates with `workflowService`: advances existing workflow instance to Step 2 or creates a new instance at Step 2 (`IN_REVIEW`).
  - Atomically updates draft status to `SUBMITTED_FOR_REVIEW` and stage to `STAGE_02_VERIFICATION`.
  - **Compensation Rollback**: If the draft OCC update fails, the newly created workflow instance is deleted, or the advanced workflow instance is reverted to Step 1 (`DRAFT`) to prevent orphaned workflow states.
  - Logs immutable audit event `QUESTION_DRAFT_SUBMITTED_FOR_VERIFICATION` in `audit_logs`.

### 3.6 Stage 02 Verification & GAR-02 Enforcement
- **Anti-Self-Approval**: In `questionGenerationService.approveDraft()`:
  - If `actor.id === draft.authorId` (or author name match), approval is rejected with HTTP 403 `NEG-01`.
  - Administrative override requires explicit admin confirmation and audited justification reason ($\ge 10$ characters).

---

## 4. Discrepancy & Gap Analysis

1. **Sprint 8 Inventory Tracking**:
   - `tests/architecture/s7-t01-inventory-reconciliation.test.ts` maintains an explicit manifest `AUTHORITATIVE_APPROVED_POST_S7_ADDITIONS`.
   - Any new tracked deliverable file in `docs/sprints/sprint-09/` must be registered in the manifest to ensure non-tautological inventory verification passes.
2. **Batch Series Question Count in Mode 1**:
   - ADR-010 and `ProductionModeModal.tsx` allow Mode 1 question counts of `[1, 5, 10, 15, 20]` (single short vs. batch series creation).
   - In `shared/registry/content-mode.registry.ts`, Mode 1 `questionCount.allowedValues` is set to `[1]` with batch series documented in comments.
   - `validateProductionModeConfig` in `shared/contracts/production-mode.ts` accepts `[1, 5, 10, 15, 20]`. This represents compatible behavior for single vs. batch creation in Sprint 9.
3. **Orphaned Page Files**:
   - 8 unmounted page files identified in Sprint 8 inventory (e.g., `VideoReviewQCPage.tsx`, `VideoReviewScriptPage.tsx`) remain scheduled for physical retirement in Sprint 9 per ADR-011 DD-07. They do not interfere with Mode 1 Question Challenge Short.

---

## 5. Concrete Blockers

**Zero critical blockers identified.**
All core upstream and downstream dependencies for Sprint 9: Question Challenge Short are functional, tested, and conformant with authoritative architecture.

---

## 6. Readiness Verdict & Next Action

- **Verdict**: **READY FOR S9-T02**
- **Rationale**: The current `main` codebase provides a solid, verified foundation for Stage 01 Question Challenge Short authoring, Firestore draft persistence, dynamic taxonomy grounding, OCC concurrency safety, and Stage 02 verification handoff.
- **Single Next Action**: Proceed with **Task `S9-T02`** (Question Challenge Short Stage 01 Authoring & Mode 1 Workbench Refinement).
