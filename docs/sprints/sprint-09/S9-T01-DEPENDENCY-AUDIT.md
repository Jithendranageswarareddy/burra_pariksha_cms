# S9-T01: Sprint 8 Dependency Audit & Acceptance for Sprint 9

**Milestone**: Sprint 9 — Question Challenge Short (Mode 1 Production Pipeline)<br>
**Task ID**: `S9-T01`<br>
**Effective Date**: October 17, 2026<br>
**Auditor**: Antigravity Software Architect & Systems Verification Engineer<br>
**Inspected Commit**: `2a6924444a83b4e96156d1cc31623ce73678ac55` (`origin/main`)<br>
**Scope**: Verification of GitHub `main` foundation and dependencies for Sprint 9 (Question Challenge Short). Identification of concrete blockers, discrepancies, batch runner boundaries, and architecture compliance.

---

## 1. Executive Verdict & Readiness Summary

| Metric | Verdict | Detail |
| :--- | :---: | :--- |
| **Sprint 8 Foundation Status** | **ACCEPTED** | All core foundational capabilities (Taxonomy, Mode Registry, OCC, Persistence, Workflow Resolver, Authorization) verified. |
| **Readiness for S9-T02** | **READY** | Zero blocking defects prevent Sprint 9 Question Challenge Short Stage 01 authoring ($N=1$) from proceeding. |
| **Mode 1 Supported Runtime Scope** | **SINGLE-SHORT ($N=1$)** | Single vertical short authoring ($N=1$) is fully operational. Batch series ($N \in \{5, 10, 15, 20\}$) is supported at configuration/validation level; batch runner execution engine is unbuilt (OD-02). |
| **Datastore Authority** | **COMPLIANT** | Cloud Firestore sole transactional datastore; zero Google Sheets runtime persistence. |
| **Invariant Compliance** | **COMPLIANT** | Save Draft $\neq$ Submit for Verification; GAR-02 ($authorId \neq approverId$) enforced without bypass. |
| **Next Action** | **S9-T02** | Advance to Task `S9-T02` (Question Challenge Short Authoring / Stage 01 Mode 1 Dedicated Polish). |

---

## 2. Comprehensive Dependency Audit Matrix

| Dependency Domain | Status | Exact Source Paths & Functions | API Routes & Contracts | Existing Test Evidence | Audit Notes |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **1. Two-Tier Taxonomy & Cascading Selection** | **PASS** | `backend/domain/taxonomy/services/taxonomy.service.ts`<br>`frontend/features/question-generation/hooks/useQuestionGeneration.ts` (`SubtopicSelectionController`)<br>`frontend/features/question-generation/components/GenerationConfigPanel.tsx` | `GET /api/v1/taxonomy/topics`<br>`GET /api/v1/taxonomy/subtopics?topicId=:id`<br>Contract: `shared/contracts/taxonomy.ts` | `npm run test:s8-t10` (9/9 pass)<br>`npm run test:s8-t11` (12/12 pass) | Strictly two-tier (`Topic` $\to$ `Subtopic`). Zero legacy `Category` references. Out-of-order race conditions guarded by request sequence ID counter. |
| **2. Content Mode Registry (Mode 1)** | **PASS (Config) / BOUNDARY (Batch)** | `shared/registry/content-mode.registry.ts` (`ContentModeRegistry`)<br>`frontend/features/question-generation/components/ProductionModeModal.tsx` (`ModeSelectionManager`)<br>`shared/types/production-context.ts` | `shared/types/content-mode-registry.ts`<br>`shared/contracts/production-mode.ts` | `npm run test:s8-t12` (29/29 assertions pass)<br>`npm run test:s8-t14` (21/21 checks pass)<br>`npm run test:s8-t16` (21/21 checks pass) | `QUESTION_CHALLENGE_SHORT` registered: allowed counts `[1, 5, 10, 15, 20]`, default `1`; fixed `9:16` aspect ratio; duration $30-58\text{s}$ (target $52\text{s}$); requires 4 MCQ options and declared correct answer.<br>**Critical Scope Distinction**: Configuration validation for counts $\{5, 10, 15, 20\}$ is verified; however, multi-instance batch dispatch runner / independent workflow creation is not implemented. Single short ($N=1$) is the sole verified runtime path. |
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

### 3.2 Content Mode 1 (`QUESTION_CHALLENGE_SHORT`) Configuration & Execution Scope
- **Registry Grounding**: `ContentModeRegistry.getInstance().getDefinition('QUESTION_CHALLENGE_SHORT')`:
  - `allowedCounts: [1, 5, 10, 15, 20]`, default `1`.
  - `allowedAspects: ['9:16']`, fixed aspect ratio.
  - `inputs`: requires taxonomy, 4 MCQ options, declared correct answer, proof explanation, real-world context.
  - `verification`: `10_POINT_PROOF` checklist (`S8-M1-01` to `S8-M1-10`).
  - `duration`: $30-58\text{s}$ hard ceiling.
- **UI Interaction**: `ProductionModeModal.tsx` renders Mode 1 card with question count dropdown (`1, 5, 10, 15, 20`) and fixed `9:16` badge. Validated via `validateProductionModeConfig()`.
- **Runtime Scope Boundary**: While configuration accepts counts `[1, 5, 10, 15, 20]`, Question Studio (`QuestionStudioPage.tsx` and `useQuestionGeneration.ts`) authors and persists a **single candidate question** (`POST /api/v1/question-drafts`). Batch dispatch execution ($N > 1$) is not implemented in runtime code.

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

### 4.1 Mode 1 Question-Count Contract Reconciliation (Resolved)
- **Previous Inconsistency**:
  - `shared/types/production-context.ts` (`validateProductionModeConfig`) and `ProductionModeModal.tsx` allowed question counts `[1, 5, 10, 15, 20]` (distinguishing single short $N=1$ from batch series $\{5, 10, 15, 20\}$).
  - Conversely, `shared/registry/content-mode.registry.ts` declared `allowedValues: [1]` with `isConfigurable: false`, causing `contentModeRegistry.validateConfig` to reject batch counts $5, 10, 15, 20$.
- **Authoritative Rule (ADR-010 & S8-T03 §5.2, OD-02)**:
  - $N = 1$: Default single-question vertical short ($\le 58\text{s}$, 9:16 portrait).
  - $N \in \{5, 10, 15, 20\}$: Batch creation series producing $N$ standalone single-question Shorts sharing syllabus taxonomy context.
  - Arbitrary counts ($0, 2, 3, 4, 6, 7, 12, 25$, negative, non-integer): Strictly rejected.
- **Reconciliation Applied**:
  - `shared/registry/content-mode.registry.ts`: Updated `QUESTION_CHALLENGE_SHORT` definition to `allowedValues: [1, 5, 10, 15, 20]`, `defaultValue: 1`, `isConfigurable: true`, with description explicitly documenting the single-short vs. batch-series distinction.
  - `shared/types/content-mode-registry.ts`: Updated `QuestionCountConstraint.allowedValues` type documentation.
  - `contentModeRegistry.validateConfig` and `validateProductionModeConfig` now produce identical validation results for all supported and unsupported question counts.

### 4.2 Mode 1 Configuration Validation vs. Batch Execution Engine (Architecture Boundary)
- **Current State of Implementation**:
  - Configuration acceptance and registry validation for `QUESTION_CHALLENGE_SHORT` correctly support question counts `[1, 5, 10, 15, 20]` across `validateProductionModeConfig` and `contentModeRegistry.validateConfig`.
  - However, the actual application runtime, Question Studio hook (`useQuestionGeneration`), backend service (`question-draft.service.ts` / `question-generation.service.ts`), and workflow engine only support authoring, persisting, and submitting a **single question draft** ($N=1$, canonical `dft_<uuid_v4>`) linked to a single workflow instance.
  - A batch dispatch runner, fanned-out generation worker, and creation of $N$ independent workflow instances for batch series ($N \in \{5, 10, 15, 20\}$) are **not demonstrated or implemented in code or test fixtures**.
- **Reconciliation with ADR-010 and Sprint 8 Architecture**:
  - In [ADR-010](../../architecture/DECISION-LOG.md) and [S8-T03 §5.2 / §6 OD-02](../sprint-08/S8-T03-CONTENT-MODE-REQUIREMENTS.md), selecting counts $>1$ was conceptually defined as a "Batch Creation Series" producing $N$ standalone single-question Shorts sharing syllabus taxonomy context.
  - However, ADR-010 explicitly classified the batch execution engine as **"Proposed—Approval Required & Open Decision (OD-02)"** and confirmed: *"Mode 1 defaults strictly to one question per published video ($N=1$). Proposed batch runner generation remains an unapproved open decision and is not approved runtime functionality"* (see also [S8-T05 §1.2](../sprint-08/S8-T05-PRODUCTION-CONTEXT-CONTRACT.md) and [S8-T06 §7](../sprint-08/S8-T06-CONTENT-MODE-REGISTRY-DESIGN.md)).
  - Therefore, the absence of a batch runner is an intentional architectural boundary, not an unhandled regression. End-to-end batch production must **not** be claimed without code and test evidence.
- **Impact on S9-T02 (Is it a Blocker?)**:
  - **Does NOT block S9-T02**. Task `S9-T02` is scoped to "Question Challenge Short Stage 01 Authoring & Mode 1 Workbench Polish", which focuses on the primary, approved single-question authoring pipeline ($N=1$, vertical 9:16 short $\le 58\text{s}$). Single-question authoring, Firestore draft persistence (`POST /api/v1/question-drafts`), OCC, and Stage 02 submission are fully functional and tested.
  - **Supported Scope for S9-T02**: Single-question vertical short ($N=1$).
  - **Downstream Dependency**: If end-to-end batch creation series ($N \in \{5, 10, 15, 20\}$) is scheduled for implementation, it must be assigned as an explicit downstream architectural task (batch dispatcher, queue manager, and multi-instance workflow coordinator) before batch execution can be advertised to users or executed at runtime.

### 4.3 Sprint 8 Inventory Tracking
- `tests/architecture/s7-t01-inventory-reconciliation.test.ts` tracks post-S7 additions via `AUTHORITATIVE_APPROVED_POST_S7_ADDITIONS`.
- `docs/sprints/sprint-09/S9-T01-DEPENDENCY-AUDIT.md` is registered in the manifest; inventory verification passes (713 S7 baseline + 33 post-S7 approved files = 746 tracked files).

### 4.4 Orphaned Legacy Pages (ADR-011 DD-07)
- 8 unmounted page files identified in Sprint 8 inventory (e.g., `VideoReviewQCPage.tsx`, `VideoReviewScriptPage.tsx`) remain scheduled for physical retirement during Sprint 9 maintenance. They do not impede Mode 1 Question Challenge Short authoring.

---

## 5. Verification Evidence & Test Execution Record

The following commands were executed directly against the committed codebase (`2a6924444a83b4e96156d1cc31623ce73678ac55`):

| Verification Suite / Command | Scope & Purpose | Exit Code | Result Summary |
| :--- | :--- | :---: | :--- |
| `npm run lint` (`tsc --noEmit`) | Full-repository static typecheck across all 746 files | `0` | **Clean exit (0 errors)**. Zero TypeScript compilation or contract violations. |
| `npm run build` (`vite build` + `esbuild`) | Production frontend bundle and Node.js server bundle | `0` | **Clean build** in 17.21s (`dist/index.html`, `dist/assets/index-DaEV_3LU.css` [180.18 kB], `dist/assets/index-atWM2EL4.js` [3,235.83 kB], `dist/server.cjs` [2.4mb]). |
| `npx tsx tests/unit/s8-t12-content-mode-configuration.unit.test.ts` | Unit & integration tests for mode selection, configuration, and registry parity | `0` | **29/29 assertions passed across 8 sections**. Mode 1 validated for counts `1, 5, 10, 15, 20` across both `validateProductionModeConfig` and `contentModeRegistry.validateConfig`. |
| `npx tsx tests/unit/s8-t14-dynamic-workflow-resolution.unit.test.ts` | Dynamic workflow state resolution & registry validation integration | `0` | **21/21 checks passed across 5 sections**. Validated Mode 1 registered definition, batch config validation, and step progression. |
| `npx tsx tests/unit/s8-t16-content-mode-workflow-rules.unit.test.ts` | Content-mode workflow rules and boundary enforcement | `0` | **21/21 checks passed across 5 sections**. Verified all Mode 1 approved counts `[1, 5, 10, 15, 20]` and rejection of invalid counts `[0, 2, 3, 4, 6, 7, 12, 25, -1, 1.5, NaN]`. |
| `npm run test:architecture` | Layer isolation boundaries and inventory manifest reconciliation | `0` | **5/5 test suites passed**. Tracked files verified: 713 S7 + 33 post-S7 = 746 files. Zero layer leaks. |

---

## 6. Concrete Blockers

**Zero blocking defects for S9-T02.**
- All dependencies, mode registry contracts, validation helpers, and UI configurations are reconciled, functional, and verified by automated test suites.
- The absence of a batch runner execution engine is an explicit architectural boundary (ADR-010 / OD-02) that applies to batch series generation ($N > 1$), but does **not** block single-question vertical short ($N=1$) authoring in Task `S9-T02`.

---

## 7. Exact Files Changed

1. `shared/registry/content-mode.registry.ts`: Updated `QUESTION_CHALLENGE_SHORT` questionCount definition (`allowedValues: [1, 5, 10, 15, 20]`, `isConfigurable: true`, documentation).
2. `shared/types/content-mode-registry.ts`: Updated interface documentation for `QuestionCountConstraint.allowedValues`.
3. `tests/unit/s8-t12-content-mode-configuration.unit.test.ts`: Added assertions verifying parity between `validateProductionModeConfig` and `contentModeRegistry.validateConfig`.
4. `tests/unit/s8-t14-dynamic-workflow-resolution.unit.test.ts`: Updated assertions for Mode 1 `allowedValues` and valid batch counts.
5. `tests/unit/s8-t16-content-mode-workflow-rules.unit.test.ts`: Updated test suite to validate all approved Mode 1 counts (`1, 5, 10, 15, 20`) and rejection of invalid counts.
6. `docs/sprints/sprint-09/S9-T01-DEPENDENCY-AUDIT.md`: Published reconciled audit findings, test evidence, batch runner boundary distinction, and readiness verdict.

---

## 8. Readiness Verdict & Next Action

- **Verdict**: **`READY` FOR S9-T02 (Single-Question Vertical Short Authoring)**
- **Evidence-Based Rationale**:
  - The Mode 1 question count contract is fully reconciled across the registry, validator, UI, and test suites.
  - Live execution of `npm run lint` (`tsc --noEmit`) passed with 0 errors across all 746 files.
  - Live execution of `npm run build` compiled both frontend and backend bundles cleanly (exit code 0).
  - Live execution of `npm run test:architecture` passed with 0 boundary violations (exit code 0).
  - Focused content-mode unit test suites (`s8-t12`, `s8-t14`, `s8-t16`) passed cleanly with 100% assertions satisfied (exit code 0).
  - The batch runner execution engine is clearly documented as an unbuilt architectural boundary under ADR-010 (OD-02) that does not block single-short authoring.
  - Cloud Firestore datastore authority, canonical UUID IDs, two-tier taxonomy, and GAR-02 invariants are strictly preserved.
- **Supported Scope for S9-T02**: Single-question vertical short ($N=1$, 9:16 portrait, $\le 58\text{s}$) Stage 01 authoring, Firestore draft persistence, and Stage 02 submission handoff.
- **Single Next Action**: Proceed with **Task `S9-T02`** (Question Challenge Short Stage 01 Authoring & Mode 1 Workbench Polish). S9-T02 will not be started during this task.
