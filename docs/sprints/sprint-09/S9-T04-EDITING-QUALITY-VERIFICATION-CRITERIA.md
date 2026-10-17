# S9-T04: Editing, Quality & Verification Acceptance Criteria Specification

**Milestone**: Sprint 9 — Question Challenge Short (Mode 1 Production Pipeline)<br>
**Task ID**: `S9-T04`<br>
**Effective Date**: October 18, 2026<br>
**Author**: Antigravity Software Architect & Systems Verification Engineer<br>
**Mode Identifier**: `QUESTION_CHALLENGE_SHORT` (Mode 1 Single & Batch Creation Series)<br>
**Status**: Authoritative Requirements & Quality Acceptance Specification (Gate A Approval Pending Authorized Owner Sign-Off)

---

## 1. Executive Summary & Governance Baseline

### 1.1 Objective
Deliver an authoritative, source-grounded requirements specification and deterministic acceptance matrix for **question editing, pedagogical quality validation, role authorization, and submission to Stage 02 verification** for Mode 1 (`QUESTION_CHALLENGE_SHORT`). This specification completes **Gate A (Requirements & System Baseline)** for Sprint 9.

### 1.2 Governance Authority Hierarchy & Source Grounding
In strict adherence to [AGENTS.md §1](../../../AGENTS.md#1-source-of-truth-authority-hierarchy), this specification reconciles verified runtime behavior with authoritative architecture:

1. **Current Runtime Evidence (`main`)**:
   - `QuestionDraftService` ([`backend/features/question-generation/services/question-draft.service.ts`](../../../backend/features/question-generation/services/question-draft.service.ts)): Verified implementation of `saveDraft`, `submitForVerification`, and `approveDraft`. Contains a runtime self-approval check (`NEG-01`), but retains a legacy administrator override (`isOverrideAllowed`) that violates the authoritative GAR-02 anti-self-approval invariant (see Section 4.3 and Section 7.1 for the documented runtime discrepancy).
   - `QuestionGenerationService` ([`backend/domain/question-generation/question-generation.service.ts`](../../../backend/domain/question-generation/question-generation.service.ts)): Verified in-memory candidate validator (`validateCandidate`), OCC version checks (HTTP 409), draft authorization checks (HTTP 403), and backend submission gate (HTTP 422).
2. **Authoritative Architecture Contracts**:
   - [07-CANONICAL-15-STEP-WORKFLOW.md](../../architecture/07-CANONICAL-15-STEP-WORKFLOW.md): Sequential business stages. Stage 01 (`Question Generation`) $\rightarrow$ Stage 02 (`Question Verification`). Strict separation of concerns.
   - [09-RBAC-CAPABILITY-MODEL.md](../../architecture/09-RBAC-CAPABILITY-MODEL.md): Atomic capability tokens (`QUESTION:EDIT`, `QUESTION:SUBMIT`, `QUESTION_REVIEW:VERIFY`, `QUESTION:APPROVE`), least-privilege scoping, and GAR-02 anti-self-approval invariant ($authorId \neq approverId$).
   - [shared/constants/roles.ts](../../../shared/constants/roles.ts): Authoritative canonical RBAC roles (`CanonicalRbacRole`).
   - [ADR-002, ADR-009, ADR-010, ADR-011](../../architecture/DECISION-LOG.md): Principle 3 GAR-02 anti-self-approval invariant across all stages with zero exceptions; strict 4-option MCQ schema; Mode 1 batch series counts $N \in \{5, 10, 15, 20\}$; atomic aggregate draft document in `question_drafts` (DD-05).
   - [AGENTS.md §10, §11](../../../AGENTS.md#10-workflow-authority-and-gar-02-rule): Mandatory invariants: `authorId !== approverId` and `SAVE DRAFT` $\neq$ `SUBMIT FOR VERIFICATION`.
3. **Explicit Scope Boundary: Video QC is NOT Question Verification**:
   - [FC-012-FINAL-QC-REVIEW-GATE.md](../../features/FC-012-FINAL-QC-REVIEW-GATE.md) governs **Stage 07 (Final Video QC)**, evaluating 9:16 smartphone safe-zones, audio LUFS normalization ($-14\text{LUFS}$), and video render artifacts.
   - Stage 02 **(Question Verification)** governs pedagogical correctness, mathematical solution proofs, Telugu distractor viability, and syllabus alignment. Stage 02 must **never** be conflated with Stage 07 video review.

---

## 2. Comprehensive Quality & Validation Matrix

The validation matrix defines every syntactic, structural, pedagogical, and operational check executed during draft authoring and verification handoff.

### 2.1 Severity Classifications
- **`BLOCKING`**: Hard architectural, schema, or uniqueness violation. Prevents submission to Stage 02 verification. Backend API rejects the submission with HTTP 422 `IncompleteBatchSubmissionError` or HTTP 400 `QuestionGenerationDomainError`. Saving as draft remains permitted.
- **`WARNING`**: Advisory pedagogical or formatting observation. Surfaces an inline alert or warning badge. Submission may proceed **without restriction** unless an explicit, owner-approved warning acknowledgement policy is active `[PROPOSED DEFAULT — Requires Owner Approval under OD-02]`. Warnings never silently become blockers.
- **`INFORMATIONAL`**: Informative metric (e.g. reading time, character count telemetry). Displayed in studio trays; zero impact on submission eligibility.

### 2.2 Validation Rules Matrix

| ID | Validation Check | Condition & Scope | Severity | Enforcement Layer | User-Visible Result | Remediation Action | Acceptance Test ID | Classification |
| :-: | :--- | :--- | :---: | :--- | :--- | :--- | :---: | :--- |
| **VAL-Q-01** | **Empty or Whitespace Prompt** | `trim(questionText).length < 5` characters. Applies to single short or any batch slot $k$. | **BLOCKING** | UI Form + Backend Service (`validateCandidate`) | Red input outline; toast: *"Question problem statement must be at least 5 characters."* | Enter a non-empty, complete mathematical problem statement ($\ge 5$ chars). | `TC-QC-01` | `[VERIFIED RUNTIME BEHAVIOR]` |
| **VAL-Q-02** | **Canonical 4-Option MCQ Contract** | Missing `optionA` or `optionB` or `optionC` or `optionD`, or any option empty, or duplicate option text ($\text{opt}_i == \text{opt}_j$). | **BLOCKING** | UI Matrix + Backend Service (`validateCandidate`) | Error badge on missing/duplicate option: *"All 4 options (A, B, C, D) are required and must be distinct."* | Supply four distinct, plausible multiple-choice options. | `TC-QC-02` | `[APPROVED CONTRACT: ADR-009]` |
| **VAL-Q-03** | **Invalid Correct Answer Key** | `correctAnswer` is not strictly one of `'A'`, `'B'`, `'C'`, `'D'`. | **BLOCKING** | UI Radio Group + Backend Service (`validateCandidate`) | Form error: *"Correct answer must be specified (A, B, C, or D)."* | Select an explicit radio button corresponding to the mathematically correct option. | `TC-QC-03` | `[VERIFIED RUNTIME BEHAVIOR]` |
| **VAL-Q-04** | **Missing Correct Answer Key** | `correctAnswer` is undefined, null, or empty string for Mode 1. | **BLOCKING** | UI Radio Group + Backend Service (`validateCandidate`) | Form validation error: *"Correct answer key is required for Question Challenge Short."* | Author must select the designated correct option before submission. | `TC-QC-03` | `[APPROVED CONTRACT: S9-T02]` |
| **VAL-Q-05** | **Malformed Schema & Metadata** | Invalid/missing `topicId`, `subtopicId`, `difficulty`, or non-canonical ID formats. Subtopic does not belong to Topic. | **BLOCKING** | API Zod Parser + Domain Service (`validateGenerationRequest`) | HTTP 400 error banner: *"Subtopic does not exist or does not belong to selected Topic."* | Select valid syllabus topic and child subtopic from taxonomy dropdown. | `TC-QC-05` | `[VERIFIED RUNTIME BEHAVIOR]` |
| **VAL-Q-06A**| **Exact Duplicate Question** | Identical `questionText` and options match an earlier slot in the batch or an active production question. | **BLOCKING** | UI Form + Backend Service + Batch Validator | Red error banner & blocking modal: *"Duplicate Question Error: Problem statement and options match Slot $j$ (or active Question). Submission blocked."* | Author must edit problem parameters or options to make question distinct, or regenerate slot. | `TC-QC-05` | `[APPROVED CONTRACT: S9-T03]` |
| **VAL-Q-06B**| **Semantic Topical Overlap** | Normalized textual similarity $> 0.85$ (Levenshtein/vector metric) with another candidate. | **WARNING** | Studio Advisory Linter | Amber badge: *"High similarity with Question $j$. Consider varying the mathematical angle."* | Advisory only: author may proceed or rephrase to introduce distinct pedagogical framing. | `TC-QC-04` | `[PROPOSED RULE Requires Owner Approval under OD-02]` |
| **VAL-Q-07** | **Missing or Invalid Proof/Explanation** | `trim(explanation).length < 5` characters, or missing step-by-step mathematical shortcut proof. | **BLOCKING** | UI Proof Field + Backend Service (`submitForVerification`) | Red input highlight: *"Mathematical solution proof and speed trick are required ($\ge 5$ chars)."* | Provide complete derivation showing how the shortcut arrives at the designated key. | `TC-QC-01` | `[APPROVED CONTRACT: S9-T02]` |
| **VAL-Q-08** | **Incomplete Batch Slots** | For batch count $N$, $C_{\text{rem\_gen}} > 0$ or any slot in status `EMPTY`, `GENERATING`, or `INVALID`. | **BLOCKING** | Batch Aggregate Validator + Submission Dispatcher | Button disabled; API returns HTTP 422: *"Requires $N$ valid questions (currently has $C_{\text{val\_slots}}$)."* | Complete all missing slots via generation or manual entry before submitting. | `TC-QC-07` | `[APPROVED CONTRACT: S9-T03]` |
| **VAL-Q-09** | **Mutation & Slot Integrity Violation** | Discontinuous slot numbering ($k \notin \{1 \dots N\}$) or missing internal `slotId`. | **BLOCKING** | Batch Repository Adapter | Error banner: *"Slot sequence integrity compromised. Reloading draft."* | System automatically re-indexes contiguous slots $1 \dots N$. | `TC-QC-08` | `[APPROVED CONTRACT: S9-T03]` |
| **VAL-Q-10** | **Concurrency Lock Conflict** | Stale update where client `expectedVersion !== draft.version`. | **BLOCKING** | Firestore Repository OCC Adapter | Concurrency modal: *"Draft modified in another session. Refresh to view changes."* (HTTP 409). | Author inspects server changes; chooses to merge or reload latest version. | `TC-QC-15` | `[VERIFIED RUNTIME BEHAVIOR]` |
| **VAL-Q-11** | **Prompt Length & Pacing Advisory** | `questionText.length > 180` characters (may exceed 58-second presentation window). | **WARNING** | UI Studio Linter | Amber badge: *"Problem statement is long for a 58s Short. Verify presenter can speak it in $\le 10$s."* | Author may edit text for conciseness or retain if delivery pacing permits. | `TC-QC-04` | `[PROPOSED RULE Requires Owner Approval under OD-02]` |
| **VAL-Q-12** | **Distractor Plausibility Advisory** | Numerical values of distractors do not correspond to common student arithmetic pitfalls. | **INFORMATIONAL** | Studio AI Copilot | Informational tooltip: *"Tip: Distractor C matches common formula error ($+1$ offset)."* | Advisory pedagogical insight; does not affect draft or submission status. | `TC-QC-04` | `[PROPOSED RULE Requires Owner Approval under OD-02]` |

---

## 3. Editing and Batch Mutation Rules

Batch editing operates under strict state invariants to ensure partial progress is never lost, slot identities remain stable, and manual edits are protected against automated overwrites.

### 3.1 Manual Edits and Save Draft Protocol
- **Save Draft Contract**:
  - Persists intermediate user input directly to the Firestore aggregate document (`question_drafts/{id}`).
  - Allowed at **any time**, regardless of validation errors, empty slots, or incomplete fields.
  - Generates or preserves a stable draft ID (`dft_<uuid_v4>`), updates `updatedAt`, and increments OCC `version`.
  - Clears the frontend dirty state (`isDirty === false`) and remains on the current `/studio` page.
  - **Strict Invariant**: Save Draft **never** transitions workflow stage and **never** initiates Stage 02 verification [AGENTS.md §11].

### 3.2 Reordering Questions Within a Batch
When an editor drags or reorders questions in a batch series ($N \in \{5, 10, 15, 20\}$):
1. **Stable Slot Identity**: Each question retains its canonical `slotId` (`slt_<uuid_v4>`) and underlying revision history.
2. **Sequential Slot Re-Indexing**: The system updates `slotNumber` sequentially ($1 \dots N$) to reflect the new pedagogical order.
3. **Preserved Invariant**: Reordering does not modify question text, choices, or validation status of any slot.
4. **Audit Requirement**: Emits `BATCH_SLOTS_REORDERED` audit event recording the before-and-after slot permutation vector.

### 3.3 Deleting a Question & Completeness Recalculation
When an editor deletes a question from slot $k$ in an active batch:
1. **Target Count Invariant ($C_{\text{req}}$ is Immutable)**:
   - Deleting slot $k$ from a configured 10-question batch **does NOT** change $C_{\text{req}}$ to 9.
   - Arbitrary counts ($N \notin \{5, 10, 15, 20\}$) are strictly prohibited.
2. **State Transition**:
   - The targeted slot $k$ transitions to status `'EMPTY'`.
   - Counters update immediately: $C_{\text{val\_slots}}$ decrements by 1; $C_{\text{rem\_gen}}$ increments by 1.
   - Batch status reverts from `'COMPLETE'` to `'PARTIAL'`.
3. **Submission Gate Effect**:
   - Submitting for verification is immediately **BLOCKED** ($C_{\text{rem\_gen}} > 0$).
   - The editor must either manually draft a replacement for slot $k$, generate a new candidate for slot $k$, or pull a candidate from `overflowBuffer`.

### 3.4 Single-Question Replacement & Regeneration
- **Target Scope**: Modifies exclusively slot $k$ ($1 \le k \le N$).
- **Zero Cross-Slot Side Effects**: Slots $j \neq k$ remain completely unaffected in content, status, and revision.
- **Slot Revision Tracking**:
  - Slot $k$ increments its `revisionNumber`.
  - Previous slot content is archived in `slotHistory` `[PROPOSED DEFAULT — Requires Owner Approval under OD-02]`.
- **Manual Edit Protection**: If slot $k$ has `status === 'ACCEPTED'`, the UI requires confirmation before regeneration.

### 3.5 Whole-Batch Regeneration & Accidental Overwrite Guard
If an author clicks "Regenerate Entire Batch":
1. **Detection of Manual Edits**:
   - The system scans all slots for `isManuallyEdited === true` or `status === 'ACCEPTED'`.
2. **Mandatory Confirmation Modal**:
   - If edited or accepted slots exist, the system blocks silent overwrites and surfaces an explicit confirmation dialog:
     > *"Warning: Slots 2, 4, and 7 contain manual edits or accepted status. Whole-batch regeneration will supersede these edits. How would you like to proceed?"*
3. **Authorized Branching Options**:
   - `Option A (Default & Recommended)`: Regenerate **only** un-edited and un-accepted slots (`isManuallyEdited === false && status !== 'ACCEPTED'`).
   - `Option B (New Revision Branch)`: Archive the current batch draft aggregate as Revision $R$ and create a completely fresh batch Revision $R+1$ `[PROPOSED DEFAULT — Requires Owner Approval under OD-02]`.

### 3.6 Persistence Failure, Resume & OCC Conflicts
- **Persistence Failure & In-Memory Recovery**:
  - If a Firestore write fails (e.g. HTTP 503 / network timeout), candidate state is retained in client memory.
  - Author clicks "Retry Save": the system retries persistence using retained memory state with zero re-calls to Gemini AI.
- **Resumption Idempotency**:
  - Opening `/studio?draftId=dft_...` hydrates persisted slots. Unresolved slots remain actionable.
  - Clicking "Generate Remaining Slots" requests strictly $C_{\text{rem\_gen}}$ items, passing negative constraints to prevent duplicates with existing slots.
- **Optimistic Concurrency Control (OCC)**:
  - Every update carries `expectedVersion`. If server `version !== expectedVersion`, the server rejects the write with HTTP 409 `ConcurrencyConflictError`.
  - Client preserves local edits in memory and offers a conflict resolution modal (Review Server Version vs. Overwrite).

---

## 4. Role and Action Authorization Matrix

Authorization enforces strict **least-privilege access, object-level ownership checks, and the absolute GAR-02 anti-self-approval rule** in accordance with [09-RBAC-CAPABILITY-MODEL.md](../../architecture/09-RBAC-CAPABILITY-MODEL.md) and [shared/constants/roles.ts](../../../shared/constants/roles.ts).

### 4.1 Canonical Roles Evaluated
In strict compliance with `shared/constants/roles.ts`, authorization operations are restricted to canonical RBAC roles (`CanonicalRbacRole`):
1. **`QUESTION_AUTHOR`**: Content writer responsible for drafting questions and generating candidates in Stage 01.
2. **`QUESTION_EDITOR`**: Senior editorial staff permitted to refine content, reorder slots, and resolve defects across any draft.
3. **`QA_REVIEWER`**: Independent verifier responsible for Stage 02 pedagogical verification and approval. (Editorial domain responsibilities such as "Lead SME" or "Subject Matter Expert" are performed by actors holding this canonical role; `LEAD_SME` is an editorial function, not an independent RBAC role).
4. **`CONTENT_LEAD`**: Supervisory content manager overseeing production schedules and quality audits across the curriculum domain.
5. **`ADMIN`**: Privileged system administrator managing system configurations, user roles, and maintenance workflows.

### 4.2 Role / Action Permissions Matrix

| Operational Action | Atomic Capability Token | `QUESTION_AUTHOR` | `QUESTION_EDITOR` | `QA_REVIEWER` | `CONTENT_LEAD` | `ADMIN` | Object-Level Preconditions & Constraints |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| **Generate AI Candidates** | `QUESTION:CREATE` / `GENERATE` | **ALLOW** | **ALLOW** | **DENY** | **ALLOW** | **ALLOW** | Stage 01 only. AI is strictly advisory; output requires human review. |
| **Edit Draft Content & Options** | `QUESTION:EDIT` | **ALLOW** (Own) | **ALLOW** (Any) | **DENY** | **ALLOW** (Any) | **ALLOW** (Any) | Stage 01 only. Draft must be in status `DRAFT` or `CHANGES_REQUESTED`. |
| **Reorder / Delete / Replace Slots** | `QUESTION:EDIT` | **ALLOW** (Own) | **ALLOW** (Any) | **DENY** | **ALLOW** (Any) | **ALLOW** (Any) | Stage 01 only. Slot deletions recalculate $C_{\text{rem\_gen}}$; $C_{\text{req}}$ is immutable. |
| **Save & Reopen Draft** | `QUESTION:CREATE` / `EDIT` | **ALLOW** (Own) | **ALLOW** (Any) | **ALLOW** (View) | **ALLOW** (Any) | **ALLOW** (Any) | Persists to Firestore `question_drafts`. Never advances workflow stage. |
| **Acknowledge Linter Warnings** | `QUESTION:EDIT` | **ALLOW** (Own) | **ALLOW** (Any) | **ALLOW** | **ALLOW** (Any) | **ALLOW** (Any) | Warnings do not block submission. Acknowledgment logged in audit trail. |
| **Submit for Verification** | `QUESTION:SUBMIT` | **ALLOW** (Own) | **ALLOW** (Any) | **DENY** | **ALLOW** (Any) | **ALLOW** (Any) | Requires $C_{\text{rem\_gen}} == 0 \land C_{\text{rem\_accept}} == 0 \land \text{draft.isDirty} == \text{false}$. |
| **Verify / Inspect Question** | `QUESTION_REVIEW:VERIFY` | **DENY** | **DENY** | **ALLOW** | **ALLOW** | **ALLOW** | Stage 02 only. Reviewer audits 10-point pedagogical criteria and proof. |
| **Approve Question Draft** | `QUESTION:APPROVE` | **DENY** | **DENY** | **ALLOW** | **ALLOW** | **ALLOW** | **GAR-02 ABSOLUTE INVARIANT**: Permitted ONLY if $authorId \neq reviewerId$. Advances to Stage 03. |
| **Request Changes (Return to 01)**| `QUESTION:REJECT` (`CHANGES_REQ`) | **DENY** | **DENY** | **ALLOW** | **ALLOW** | **ALLOW** | Stage 02 only. Requires mandatory structured feedback remarks ($\ge 10$ chars). |
| **Self-Approval Override Attempt**| `QUESTION:APPROVE` (`OVERRIDE`) | **DENY** | **DENY** | **DENY** | **DENY** | **DENY** | **GAR-02 STRICT RULE**: Zero self-approval exceptions, even for `ADMIN`. Throws HTTP 403 `NEG-01`. |

### 4.3 Anti-Self-Approval Enforcement (GAR-02 Rule — Zero Self-Approval Invariant)
Under Architecture Principle 3, ADR-002, and `NEG-01`:

$$\mathbf{authorId} \neq \mathbf{reviewerId} \quad (\text{Absolute Invariant Across All Roles, Including } \texttt{ADMIN})$$

1. **Zero Self-Approval Exceptions**:
   - The user who authored, drafted, or generated a question is **strictly prohibited from approving or verifying their own work**.
   - This rule is absolute and applies universally across all canonical roles: `QUESTION_AUTHOR`, `QUESTION_EDITOR`, `QA_REVIEWER`, `CONTENT_LEAD`, and `ADMIN`.
   - Administrators possess broad administrative capabilities (e.g. managing users, assigning tasks, verifying drafts authored by *others*), but **cannot approve drafts they authored themselves**.
2. **Backend Enforcement**:
   - Evaluated in `QuestionDraftService.approveDraft`.
   - If `draft.authorId === actor.id` (or author name match), the server strictly rejects the request with HTTP 403 `NEG-01 AntiSelfApprovalViolation`.
   - Every rejected self-approval attempt is logged in the append-only audit ledger (`QUESTION_DRAFT_APPROVAL_REJECTED`).
3. **Runtime Defect & Discrepancy Note**:
   - *Active Runtime Mismatch*: The brownfield implementation in `QuestionDraftService.approveDraft` ([`backend/features/question-generation/services/question-draft.service.ts:L142-L150`](../../../backend/features/question-generation/services/question-draft.service.ts#L142-L150)) currently contains legacy logic permitting an `ADMIN` self-approval override if an `overrideContext` with a 10-character reason is supplied.
   - *Architectural Conflict*: This override directly contradicts authoritative architecture (ADR-002 Principle 3: *"Author of an artifact cannot approve their own work under any circumstance ($authorId \neq approverId$)"* and [AGENTS.md §10](../../../AGENTS.md#10-workflow-authority-and-gar-02-rule)).
   - *Resolution Contract*: The authoritative requirement strictly disallows self-approval under any override payload. The existing runtime bypass is an identified implementation defect scheduled for removal in subsequent runtime tasks.

---

## 5. Workflow and Verification Mapping

The validation rules and editing capabilities map directly to the canonical 15-stage workflow:

```text
 ┌────────────────────────────────────────┐       Submit for Verification        ┌────────────────────────────────────────┐
 │   STAGE 01: QUESTION GENERATION        ├─────────────────────────────────────►│   STAGE 02: QUESTION VERIFICATION      │
 │   Workbench: /studio                   │   (Requires C_rem_gen == 0           │   Workbench: /questions/:id/verify     │
 │   Owner: Question Author / Editor      │    and all validation gates PASS)    │   Owner: Independent QA Reviewer       │
 └──────────────────┬─────────────────────┘                                      └──────────────────┬─────────────────────┘
                    │                                                                               │
                    │ Save Draft                                                                    │ Request Changes
                    │ (Does NOT advance stage)                                                      │ (Returns to Stage 01 with remarks)
                    ▼                                                                               ▼
 ┌────────────────────────────────────────┐                                      ┌────────────────────────────────────────┐
 │   Firestore: question_drafts           │◄─────────────────────────────────────┤   Stage Status: CHANGES_REQUESTED      │
 │   status: 'DRAFT', workflowStage: 01   │                                      │   Author modifies draft per feedback   │
 └────────────────────────────────────────┘                                      └────────────────────────────────────────┘
```

### 5.1 Stage 01 — Question Generation Workbench (`/studio`)
- **Authoring Responsibilities**:
  - Configure syllabus taxonomy (`topicId`, `subtopicId`, `difficulty`, `language`).
  - Generate advisory candidates via Gemini AI orchestrator.
  - Manually refine question statement, 4 distinct options, correct key, and speed trick explanation.
  - Save drafts freely without triggering verification gates.
- **Submission Gate Responsibilities**:
  - The author explicitly clicks "Submit for Verification".
  - The backend executes authoritative validation (`validateCandidate` across all $N$ slots).
  - If valid: transitions `workflowStage` to `STAGE_02_VERIFICATION` and `status` to `SUBMITTED_FOR_REVIEW`.
  - If invalid: rejects submission with HTTP 422, surfaces specific defect callouts, and keeps draft in Stage 01.

### 5.2 Stage 02 — Question Verification Workbench (`/questions/:id/verify`)
- **Verification Responsibilities**:
  - Independent reviewer inspects read-only question cards.
  - Reviewer certifies the 10-point pedagogical criteria:
    1. Syllabus alignment and difficulty calibration.
    2. Telugu language fidelity and grammatical accuracy.
    3. Mathematical correctness of question problem statement.
    4. Exactness and plausibility of distractor options (no ambiguous choices).
    5. Single correct answer verification.
    6. Mathematical proof validity and speed trick shortcut rigor.
    7. 58-second presentation suitability.
    8. Cultural sensitivity and neutrality.
    9. Absence of formatting relics or template placeholders.
    10. Complete metadata binding.
- **Workflow Advancement**:
  - **`APPROVE`**: Materializes verified Draft into permanent `Question` aggregate document in `questions` collection; advances `WorkflowInstance` to **Stage 03 (Audience Script)**.
  - **`REQUEST CHANGES`**: Sets `stageStatus = CHANGES_REQUESTED`, records feedback notes, returns batch to Stage 01 for author revision.
  - **`REJECT`**: Sets `stageStatus = REJECTED`, terminates draft progression, logs rejection audit remarks.

---

## 6. Deterministic Acceptance Test Scenarios

The following deterministic scenarios specify required verification behavior for implementation testing:

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             DETERMINISTIC ACCEPTANCE SCENARIOS                                   │
├───────────────┬─────────────────┬────────────────────────────────────────────────────────────────┤
│ Scenario ID   │ Test Case       │ Expected Actions, Assertions & Workflow Effects                │
├───────────────┼─────────────────┼────────────────────────────────────────────────────────────────┤
│ TC-QC-01      │ Empty Prompt /  │ Action: Author attempts to submit draft where questionText     │
│               │ Short Proof     │ is empty or explanation length < 5.                            │
│               │ (Blocking)      │ Result: Submission rejected with HTTP 422.                     │
│               │                 │ Persistence: Draft remains in question_drafts (status=DRAFT).  │
│               │                 │ Workflow: Stage remains 01. Stage 02 NOT reached.              │
├───────────────┼─────────────────┼────────────────────────────────────────────────────────────────┤
│ TC-QC-02      │ Missing Options │ Action: Author attempts to submit draft missing optionD.       │
│               │ (MCQ Contract)  │ Result: Submission rejected with HTTP 422: "Option D required".│
│               │                 │ Persistence: Draft remains in status DRAFT.                    │
│               │                 │ Workflow: Stage remains 01. Canonical 4-option gate enforced.  │
├───────────────┼─────────────────┼────────────────────────────────────────────────────────────────┤
│ TC-QC-03      │ Invalid Answer  │ Action: Author submits draft with correctAnswer = 'E' or null. │
│               │ Key (Out of Set)│ Result: Submission rejected with HTTP 422.                     │
│               │                 │ Persistence: Status remains DRAFT. Stage remains 01.           │
├───────────────┼─────────────────┼────────────────────────────────────────────────────────────────┤
│ TC-QC-04      │ Warning Findings│ Action: Author submits draft with questionText length = 190    │
│               │ Non-Blocking    │ (triggers VAL-Q-11 length warning). No blocking errors exist.  │
│               │                 │ Result: Submission SUCCEEDS (HTTP 200).                        │
│               │                 │ Persistence: Draft status transitions to SUBMITTED_FOR_REVIEW. │
│               │                 │ Workflow: Advances to Stage 02. Warning did NOT block submit.  │
├───────────────┼─────────────────┼────────────────────────────────────────────────────────────────┤
│ TC-QC-05      │ API Bypass &    │ Action: Client script calls POST /submit with missing topicId  │
│               │ Duplicate Block │ OR exact duplicate question text matching another slot.        │
│               │                 │ Result: Backend validates and rejects with HTTP 400 / 422.     │
│               │                 │ Workflow: Stage remains 01. Exact duplicates strictly blocked. │
├───────────────┼─────────────────┼────────────────────────────────────────────────────────────────┤
│ TC-QC-06      │ Save Draft vs.  │ Action: Author clicks "Save Draft" on valid draft.             │
│               │ Verify Gate     │ Result: Save succeeds (HTTP 200). version increments.          │
│               │                 │ Persistence: Saved to question_drafts. status remains DRAFT.   │
│               │                 │ Workflow: Stage remains 01. Verification NOT triggered.        │
├───────────────┼─────────────────┼────────────────────────────────────────────────────────────────┤
│ TC-QC-07      │ Incomplete Batch│ Action: Author attempts to submit batch of 10 where Slot 8     │
│               │ Submission      │ is EMPTY (C_rem_gen = 1).                                      │
│               │                 │ Result: Submission rejected with HTTP 422: "Requires 10 valid".│
│               │                 │ Workflow: Stage remains 01. Partial batch submission BLOCKED.  │
├───────────────┼─────────────────┼────────────────────────────────────────────────────────────────┤
│ TC-QC-08      │ Slot Reorder    │ Action: Editor drags Slot 4 to position 1 in 5-question batch. │
│               │ Preserves ID    │ Result: Slots re-indexed 1..5. Slot 4 retains its slotId UUID. │
│               │                 │ Audit: BATCH_SLOTS_REORDERED logged with permutation vector.   │
├───────────────┼─────────────────┼────────────────────────────────────────────────────────────────┤
│ TC-QC-09      │ Slot Deletion   │ Action: Editor deletes Slot 5 in configured batch of 5.        │
│               │ Recalculates    │ Result: Slot 5 becomes EMPTY. C_val_slots=4, C_rem_gen=1.      │
│               │ Completeness    │ Invariant: C_req remains strictly 5 (not reduced to 4).        │
│               │                 │ Submission for verification is BLOCKED until Slot 5 filled.    │
├───────────────┼─────────────────┼────────────────────────────────────────────────────────────────┤
│ TC-QC-10      │ Single Slot     │ Action: Editor replaces Slot 2 from question bank.             │
│               │ Replacement     │ Result: Slot 2 updated with new content; revision increments.  │
│               │                 │ Invariant: Slots 1, 3, 4, 5 and their history untouched.       │
├───────────────┼─────────────────┼────────────────────────────────────────────────────────────────┤
│ TC-QC-11      │ Whole Batch     │ Action: Batch has manual edits in Slot 2. Author clicks        │
│               │ Regeneration    │ "Regenerate Entire Batch" and selects Option A (Default).      │
│               │ Protection      │ Result: Only un-edited slots regenerated. Slot 2 preserved.    │
├───────────────┼─────────────────┼────────────────────────────────────────────────────────────────┤
│ TC-QC-12      │ Unauthorized    │ Action: QA_REVIEWER attempts to POST /generate or edit draft.  │
│               │ Role Denied     │ Result: API rejects with HTTP 403 Forbidden.                   │
│               │                 │ Audit: UNAUTHORIZED_CAPABILITY_ATTEMPT logged.                 │
├───────────────┼─────────────────┼────────────────────────────────────────────────────────────────┤
│ TC-QC-13      │ GAR-02 Self-    │ Action: Author attempts to approve their own draft (approveDraft│
│               │ Approval Denied │ where actor.id === draft.authorId).                            │
│               │                 │ Result: Rejected with HTTP 403 NEG-01 AntiSelfApprovalViolation│
│               │                 │ Audit: QUESTION_DRAFT_APPROVAL_REJECTED logged.                │
├───────────────┼─────────────────┼────────────────────────────────────────────────────────────────┤
│ TC-QC-14      │ Admin Self-     │ Action: Actor with ADMIN role who authored Draft dft_123       │
│               │ Approval Denied │ attempts approveDraft on dft_123 with overrideContext supplied.│
│               │ (GAR-02 Absolute│ Result: REJECTED with HTTP 403 NEG-01 AntiSelfApprovalViolation│
│               │ Invariant)      │ Persistence: Draft remains SUBMITTED_FOR_REVIEW; Question not  │
│               │                 │ materialized. GAR-02 cannot be overridden by ADMIN role.      │
├───────────────┼─────────────────┼────────────────────────────────────────────────────────────────┤
│ TC-QC-15      │ Concurrency OCC │ Action: Editor A and Editor B edit Draft v2 concurrently.      │
│               │ Lock Conflict   │ Editor A saves (v2->v3). Editor B attempts submit with v2.     │
│               │                 │ Result: Editor B rejected with HTTP 409 Conflict.              │
│               │                 │ Persistence: Editor B local edits preserved in client memory.  │
├───────────────┼─────────────────┼────────────────────────────────────────────────────────────────┤
│ TC-QC-16      │ Independent     │ Action: Independent QA_REVIEWER inspects submitted draft,      │
│               │ Approval        │ passes 10-point checklist, clicks "Approve".                   │
│               │ Workflow Gate   │ Result: Approval succeeds. Draft materializes as Question.     │
│               │                 │ Workflow: Advances to Stage 03 (Audience Script).              │
├───────────────┼─────────────────┼────────────────────────────────────────────────────────────────┤
│ TC-QC-17      │ Request Changes │ Action: Reviewer finds proof defect, enters feedback remarks   │
│               │ Workflow Loop   │ (>= 10 chars), clicks "Request Changes".                       │
│               │                 │ Result: Draft transitions to CHANGES_REQUESTED. Stage 01.      │
│               │                 │ Workflow: Returns to author for revision.                      │
└───────────────┴─────────────────┴────────────────────────────────────────────────────────────────┘
```

---

## 7. Governance, Classification & Gate A Decision Log

### 7.1 Rule Classification Inventory
Every rule within this specification is classified under the SDLC provenance baseline:

1. **Existing Approved Contracts**:
   - Discrete batch counts $N \in \{5, 10, 15, 20\}$ ([ADR-010](../../architecture/DECISION-LOG.md#L14)).
   - Canonical 4-option MCQ schema (`a, b, c, d` in canonical `options` object) and single answer key ([ADR-009](../../architecture/DECISION-LOG.md#L13)).
   - Cloud Firestore sole transactional datastore authority ([AGENTS.md §3](../../../AGENTS.md#3-cloud-firestore-authority)).
   - Single atomic aggregate document for batch drafts in `question_drafts` ([ADR-011 DD-05](../../architecture/DECISION-LOG.md#L15)).
   - Save Draft $\neq$ Submit for Verification ([AGENTS.md §11](../../../AGENTS.md#11-save-vs-verify-operational-contract)).
   - Canonical 15-stage sequential workflow ([07-CANONICAL-15-STEP-WORKFLOW.md](../../architecture/07-CANONICAL-15-STEP-WORKFLOW.md)).
   - Canonical RBAC roles ([shared/constants/roles.ts](../../../shared/constants/roles.ts)) & GAR-02 anti-self-approval rule ([ADR-002 Principle 3](../../architecture/DECISION-LOG.md#L6) and [09-RBAC-CAPABILITY-MODEL.md](../../architecture/09-RBAC-CAPABILITY-MODEL.md)).
2. **Verified Current Runtime Behavior**:
   - Backend candidate validator (`validateCandidate`) enforces question text length $\ge 5$, option presence, answer key in `['A', 'B', 'C', 'D']` ([`backend/domain/question-generation/question-generation.service.ts:L286-L302`](../../../backend/domain/question-generation/question-generation.service.ts#L286-L302)).
   - Backend submission gate enforces optimistic locking (`expectedVersion`) and draft status `DRAFT` ([`backend/domain/question-generation/question-generation.service.ts:L546-L623`](../../../backend/domain/question-generation/question-generation.service.ts#L546-L623)).
   - Anti-self-approval base enforcement in `approveDraft` ([`backend/features/question-generation/services/question-draft.service.ts:L131-L182`](../../../backend/features/question-generation/services/question-draft.service.ts#L131-L182)).
3. **Proposed Rules Requiring Owner Approval**:
   - Semantic duplicate similarity threshold (e.g. Levenshtein / vector metric $> 0.85$ under `VAL-Q-06B`).
   - Linter warning threshold for presentation length (`questionText > 180` chars under `VAL-Q-11`).
   - Whole-batch regeneration Revision $R \to R+1$ branching policy (`Option B`).
   - Slot revision history array persistence (`slotHistory`).
4. **Unresolved Implementation Gaps & Runtime Mismatches**:
   - **Runtime GAR-02 Override Defect**: `QuestionDraftService.approveDraft` ([`backend/features/question-generation/services/question-draft.service.ts:L142-L150`](../../../backend/features/question-generation/services/question-draft.service.ts#L142-L150)) currently contains brownfield code permitting an `ADMIN` self-approval override if `overrideContext` is supplied. This conflicts with authoritative ADR-002 Principle 3 and must be decommissioned.
   - **Multi-slot aggregate validation**: runtime `validateCandidate` currently processes single-question fields; slot-array traversal for Mode 1 batch drafts is unbuilt.
   - **Batch slot reordering & deletion endpoints**: runtime currently lacks dedicated Express routes for batch slot reordering.

---

### 7.2 Gate A Decision Checklist (Owner Sign-Off Pending)

To formally approve Gate A and transition to Gate B (Technical Design), the Authorized Project Owner must resolve the following five architectural decisions:

| Decision ID | Area | Question for Authorized Owner | Status | Default Recommendation |
| :---: | :--- | :--- | :---: | :--- |
| **DEC-A-01** | **Mode 1 Batch Dispatcher** | Confirm adoption of atomic aggregate slot model (`Mode1BatchDraftAggregate` in `question_drafts`) per ADR-011 DD-05 for runtime execution runner. | **PENDING** | **APPROVE**: Adopts atomic aggregate document to prevent premature multi-document proliferation. |
| **DEC-A-02** | **Semantic Deduplication** | Approve Levenshtein $> 0.85$ as an advisory `WARNING` threshold (VAL-Q-06B) or mandate exact-string matching only. | **PENDING** | **APPROVE AS WARNING**: Advisory alert without blocking submission. |
| **DEC-A-03** | **Warning Policy** | Confirm whether linter warnings require explicit user acknowledgement in the UI before submission or remain non-blocking advisories. | **PENDING** | **APPROVE AS ADVISORY**: Non-blocking advisories to minimize author friction. |
| **DEC-A-04** | **Slot Deletion Invariant** | Confirm that deleting a question in an active batch leaves the slot empty ($C_{\text{rem\_gen}}$ increments) rather than shrinking $C_{\text{req}}$. | **PENDING** | **APPROVE**: Preserves discrete count contract $N \in \{5, 10, 15, 20\}$. |
| **DEC-A-05** | **Downstream Fan-Out** | Confirm handoff mechanism from 1 approved batch draft to $N$ independent short videos in Stage 03 Studio Production. | **PENDING** | **DEFER TO GATE B**: Establish 1-to-N script generation mapper in S9-T05. |

---

## 8. Specification Verdict & Next Action

- **Specification Status**: **`ACCEPTED AS REQUIREMENTS SPECIFICATION — GATE A APPROVAL PENDING`**
- **Evidence-Based Verdict**:
  - Fully defines validation matrix (12 rules with severity, layer, and remediation).
  - Establishes batch mutation rules (Save Draft, reorder, delete, replace, whole-batch protection).
  - Details RBAC authorization matrix across canonical roles and operational actions with strict, absolute GAR-02 enforcement.
  - Documents runtime discrepancy regarding legacy administrative self-approval bypass.
  - Maps Stage 01 authoring to Stage 02 independent verification; decouples from Stage 07 Video QC (FC-012).
  - Supplies 17 deterministic acceptance scenarios, including `TC-QC-14` asserting admin self-approval denial.
  - Documents 5 pending Gate A decisions.
- **Single Next Action**: Deliverable established for Task `S9-T04`. **Do NOT start Task `S9-T05` or begin detailed runtime design**.
