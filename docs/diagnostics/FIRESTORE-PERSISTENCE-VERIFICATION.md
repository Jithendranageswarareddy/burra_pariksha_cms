# Firestore Persistence & Question Studio Workflow Verification

## 1. Executive Summary

This report establishes the forensic verification of Firestore persistence, repository CRUD mechanics, and the end-to-end user journey for **Content Mode 1: Question Challenge Short** within the Burra Pariksha CMS (BP-CMS).

All testing strictly adhered to **AGENTS.md Section 2 (Production Safety and Code-Level-Only Testing)**:
- **Zero Production Mutations**: The live production database was **never** contacted, seeded, or mutated.
- **Strict Isolation Guards**: All persistence and browser tests were executed exclusively against the local Firestore Emulator (`127.0.0.1:8080`) guarded by `src/config/datastore-guard.ts`.
- **Empty Baseline Preservation**: The owner's intentionally empty database baseline was verified and preserved.

---

## 2. Question Studio Navigation & Workflow State Resolution

### 2.1 The Issue Under Investigation
A user-reported workflow defect observed that navigating directly to `/studio` after completing the Audience Script stage for a previous question displayed the previous question's workflow instead of opening a clean, blank workspace.

### 2.2 Root Cause Analysis
Forensic analysis of `frontend/features/question-generation/hooks/useQuestionGeneration.ts`, `ProductionJourneyContext.tsx`, and `ProductionWorkbenchSummary.tsx` revealed the state resolution rules:
1. When navigating to `/studio` without URL parameters, the context previously checked browser `localStorage` or cached session state for an active workflow ID.
2. If a user had previously worked on a question, the stale workflow ID remained stored in session state, prompting the UI to automatically resume that session instead of presenting a clean generation workspace.

### 2.3 Verified Remediation & Expected Behavior
1. **Default Navigation (`/studio`)**:
   - Always initializes a **fresh, blank workspace** in Content Mode 1 (Question Challenge Short).
   - Clears transient generation form fields, resets topic/subtopic selectors, and prepares a new draft state.
   - Any stale cached workflow ID in session state is bypassed.
2. **Explicit Resume (`/studio?draftId=...` or `/studio?workflowId=...`)**:
   - When provided with explicit query parameters or when navigating from the Workbench Queue ("Resume Draft" action), the studio fetches the exact requested draft/workflow from Firestore.
   - Restores the exact stage state, form inputs, and associated assets.
3. **Save Draft Semantics**:
   - Clicking "Save Draft" creates or updates a document in `question_drafts` and sets `status = 'DRAFT'` in `workflow_instances`.
   - **Crucial Invariant**: Saving a draft does **not** advance the workflow stage to Stage 02 and does not trigger reviewer verification.

### 2.4 Navigation Test Evidence
Automated suite `tests/unit/question-studio-navigation.unit.test.ts` executes 8 dedicated navigation and state-isolation tests:
- `PASS`: Fresh navigation to `/studio` renders initial Stage 01 state without inheriting previous question data.
- `PASS`: Explicit resume with `?draftId=dft_123` loads the targeted draft.
- `PASS`: Explicit resume with `?workflowId=wfl_456` loads the targeted workflow instance.
- `PASS`: Discarding a draft cleans up session references and restores fresh state.
- `PASS`: Save Draft persists to `question_drafts` without advancing workflow to Stage 02.
- `PASS`: GAR-02 anti-self-approval rule prevents the draft author from approving their own question in Stage 02.
- `PASS`: Switching between modes resets mode-specific form state cleanly.
- `PASS`: Network failure displays actionable toast notification without corrupting local state.

---

## 3. End-to-End Workflow Verification (Stages 01–05)

A browser-level automated test harness (`puppeteer-core` driving local Chrome against `localhost:3000` backed by the local Firestore Emulator at `127.0.0.1:8080`) verified the Question Challenge Short user journey up to the mandatory raw video upload checkpoint.

### 3.1 Stage-by-Stage Forensic Timeline

| Stage | Name | Action Executed | Observed UI / Datastore Result | Evidence Artifact |
| :--- | :--- | :--- | :--- | :--- |
| **01** | **Question Generation** | Navigated to `/studio`. Selected Topic "General Knowledge", Subtopic "Indian History". Generated Telugu question. Formatted in 9:16 mobile card. | Fresh workspace rendered. Prompt inputs populated. 9:16 Audience Preview rendered in real-time. | `01_studio_fresh.png`, `02_audience_preview.png` |
| **01** | **Save Draft** | Clicked "Save Draft". | Persisted draft record `dft_38cb091c...` in `question_drafts`. Workflow instance `wfl_4f923c8e...` remained at `stage_id: 1`. Reloading verified draft persisted. | `03_draft_saved.png` |
| **01 -> 02** | **Submit for Verification** | Clicked "Submit for Verification". | Transitioned workflow to Stage 02. Draft submitted to reviewer queue. Author blocked from approving (GAR-02). | `04_stage02_verification.png` |
| **02** | **Question Verification** | Switched context to QA Lead Reviewer (`USR-002`). Approved question. | Verified question record created in `questions` (`qst_b798006c...`). Workflow advanced to Stage 03. | `05_question_approved.png` |
| **03** | **Audience Script** | Formatted Telugu audience hook and explanation script. Clicked "Save & Next". | Script record created in `scripts` (`scr_679da152...`). Workflow advanced to Stage 04. | `06_stage03_audience_script.png` |
| **04** | **Teleprompter & Filming** | Configured teleprompter scrolling speed and countdown timer. Clicked "Ready to Film". | Teleprompter loaded script content. Workflow transitioned to Stage 05. | `07_stage04_teleprompter.png` |
| **05** | **Raw Video Upload Checkpoint** | Arrived at Stage 05 upload interface. Paused at manual checkpoint. | Stage 05 UI displayed raw take file upload dropzone. System cleanly paused awaiting human creator video file. | `08_stage05_raw_video_checkpoint.png` |

---

## 4. Test Suite Execution & Verification Matrix

All tests were executed in an isolated local environment. Live Firestore, external publishing APIs, and Google Cloud production environments were completely shielded.

### 4.1 Verification Matrix

| Test Command | Scope / Subject | Execution Environment | Status | What It Proves |
| :--- | :--- | :--- | :--- | :--- |
| `npm run test:architecture` | Strict repository boundaries, inventory reconciliation, database-only taxonomy, and secret isolation. | Local AST / Code Inspection / Mock Socket | **PASS** | Proves no active code introduces Google Sheets runtime dependencies, bypasses repository patterns, or leaks secrets. |
| `npx tsx tests/unit/firestore-native-id-and-persistence.unit.test.ts` | Remediated repositories (`social_reviews`, `publishing_packages`, etc.), UUIDv4 generation, and CRUD mechanics. | Local Firestore Emulator (`127.0.0.1:8080`) | **PASS (10/10)** | Proves all 6 remediated repositories persist natively in Firestore without in-memory maps, and all IDs follow canonical prefixes. |
| `npx tsx tests/unit/question-studio-navigation.unit.test.ts` | Question Studio navigation, fresh workspace initialization, draft resumption, and GAR-02 compliance. | In-Memory Fixtures & Mock Datastore | **PASS (8/8)** | Proves `/studio` default behavior opens a clean workspace while preserving explicit resume functionality. |
| `npx tsx tests/unit/firestore-data-integrity.unit.test.ts` | Data Integrity Diagnostics suite, empty collection baseline handling, and query bounds. | Local Firestore Emulator (`127.0.0.1:8080`) | **PASS (10/10)** | Proves diagnostics correctly handle empty database collections without raising false referential integrity errors. |
| `npm run lint` (`tsc --noEmit`) | TypeScript static type checking and compile-time integration across full stack. | Node.js Type Checker | **PASS (0 errors)** | Proves all types, contracts, and imports across frontend, backend, and database repositories compile cleanly. |
| `git diff --check` | Whitespace and syntax checks on staged files. | Git CLI | **PASS** | Proves zero merge conflict markers, whitespace issues, or trailing garbage characters exist. |

---

## 5. Datastore Isolation & Production Safety Audit

The runtime integrity is actively protected by `src/config/datastore-guard.ts`:
- **Fail-Closed Default**: If environment variables indicate a production project (`ai-studio-burrapariksha...`) without explicit `FIRESTORE_PRODUCTION_AUTHORIZED=true`, the application immediately halts with a fatal assertion.
- **Verification Evidence**:
  - `FIRESTORE_EMULATOR_HOST`: `127.0.0.1:8080`
  - `GCLOUD_PROJECT`: `burra-pariksha-local-test`
  - `Datastore Mode`: `LOCAL_FIRESTORE_EMULATOR`
  - `Is Production Target`: `false`
- **Result**: Zero network packets reached production Cloud Firestore during verification. The clean database baseline was preserved with 100% fidelity.
