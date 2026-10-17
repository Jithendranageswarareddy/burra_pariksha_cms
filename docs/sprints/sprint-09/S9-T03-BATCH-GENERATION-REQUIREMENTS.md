# S9-T03: Mode 1 Batch Generation & Completeness Requirements Specification

**Milestone**: Sprint 9 — Question Challenge Short (Mode 1 Production Pipeline)<br>
**Task ID**: `S9-T03`<br>
**Effective Date**: October 17, 2026<br>
**Author**: Antigravity Software Architect & Systems Verification Engineer<br>
**Mode Identifier**: `QUESTION_CHALLENGE_SHORT` (Mode 1 Batch Creation Series)<br>
**Status**: Authoritative Requirements & Completeness Specification (Runtime Implementation Outstanding under OD-02)

---

## 1. Executive Summary & Governance Baseline

### 1.1 Objective
Deliver an authoritative, deterministic requirements specification and failure/recovery matrix for **Mode 1 Batch Creation Series (`QUESTION_CHALLENGE_SHORT` for counts $N \in \{5, 10, 15, 20\}$)**. This specification defines exact completeness invariants, dual remaining counters, slot lifecycle states, retry boundaries, partial persistence protocols, and regression acceptance scenarios.

### 1.2 Governance Authority & Implementation Boundaries
1. **Architectural Authority**:
   - [ADR-010](../../architecture/DECISION-LOG.md#L14): Conceptual approval of Mode 1 batch generation series for counts $>1$ (Option A), with the batch execution runner formally classified as an Open Decision (**OD-02**).
   - [ADR-011 (DD-05)](../../architecture/DECISION-LOG.md#L15): Mandates a **single atomic aggregate document in `question_drafts`** for multi-question sets, avoiding premature fanned-out document proliferation.
   - [ADR-009](../../architecture/DECISION-LOG.md#L13): Strict 4-option MCQ invariant (`a, b, c, d` in canonical `options` object) and single correct answer key (`A, B, C, D`) across every question slot.
   - [ADR-002](../../architecture/DECISION-LOG.md#L6) / Principle 3: Canonical 15-stage workflow progression and GAR-02 anti-self-approval rule ($authorId \neq approverId$).
   - [AGENTS.md §3, §11](../../../AGENTS.md): Cloud Firestore as the sole authoritative datastore; strict separation between `SAVE DRAFT` and `SUBMIT FOR VERIFICATION`.
2. **Contract Classification Rule**:
   - Parameters with verified architecture baseline backing are labeled `[APPROVED CONTRACT: <citation>]`.
   - Operational parameters awaiting runtime implementation or owner confirmation are labeled `[PROPOSED DEFAULT — Requires Owner Approval under OD-02]`.
3. **Current Runtime Status**:
   - **Specification Only**: This deliverable defines the testable behavioral contract. The actual batch dispatch runner and multi-slot execution engine remain **unbuilt** per the S9-T01 audit and OD-02.
   - **Zero Code Mutations**: Does not alter runtime application code, database schemas, production Firestore records, or Google Sheets.

---

## 2. Count and Completeness Contract

### 2.1 Supported Batch Counts & Invariants
Mode 1 Batch Creation Series supports **strictly four discrete batch counts** `[APPROVED CONTRACT: ADR-010, ContentModeRegistry]`:

$$\mathbf{N} \in \{5, 10, 15, 20\}$$

- **Arbitrary Counts Prohibited**: Question counts such as $0, 2, 3, 4, 6, 7, 12, 25$, negative integers, or non-integers are strictly rejected by `validateProductionModeConfig` and `contentModeRegistry.validateConfig`.
- **Target Valid Questions**: A batch request configured with count $N$ expects **exactly $N$ distinct, valid questions**.
- **Pedagogical Relationship**: All $N$ questions in a batch share identical taxonomy context (`topicId`, `subtopicId`, `language`, `difficulty`), but each represents a standalone vertical short ($\le 58\text{s}$) with a unique mathematical problem, distinct options, and specific shortcut explanation.

### 2.2 Canonical Valid Question Definition
A question candidate occupying slot $k$ ($1 \le k \le N$) is deemed **`VALID`** if and only if it satisfies all of the following canonical contract requirements `[APPROVED CONTRACT: ADR-009, shared/types/question.ts]`:
1. **Statement**: Non-empty `questionText` with $\text{length} \ge 5$ characters.
2. **Four Distinct Options**: Contains strictly 4 non-empty choices (`a`, `b`, `c`, `d` in the canonical `options` object). Pairwise option text comparisons must be distinct ($\text{text}_i \neq \text{text}_j$ case-insensitive).
3. **Correct Answer Key**: Exactly one declared answer matching one of `'A'`, `'B'`, `'C'`, or `'D'`.
4. **Mathematical Proof / Explanation**: Non-empty `explanation` with $\text{length} \ge 5$ characters containing mathematical derivation.
5. **Taxonomy & Mode Grounding**: Valid `topicId` and `subtopicId` matching the active syllabus hierarchy (`subtopic.topicId === topic.id`), with `productionMode === 'QUESTION_CHALLENGE_SHORT'`.
6. **No Placeholder Content**: No unresolved template tokens (e.g. `[INSERT FORMULA]`, `TODO`, `N/A`, `Option text here`).

### 2.3 Distinct Count Categories & Telemetry
To avoid ambiguous progress reporting, every batch generation attempt maintains explicit counters distinguishing candidate evaluation, slot occupancy, editorial state, and remaining work:

| Counter Symbol | Name | Definition | Invariant & Classification |
| :---: | :--- | :--- | :--- |
| $\mathbf{C_{\text{req}}}$ | **Configured Count** | The configured target count ($5, 10, 15, 20$). Immutable for that batch draft generation attempt. | $C_{\text{req}} \in \{5, 10, 15, 20\}$ `[APPROVED CONTRACT: ADR-010]` |
| $\mathbf{C_{\text{gen}}}$ | **Raw Generated Candidates** | Total raw question candidate objects returned by the AI provider in response to the prompt. | $C_{\text{gen}} \ge 0$ |
| $\mathbf{C_{\text{val\_slots}}}$ | **Valid In-Range Slots** | Number of distinct, valid questions successfully assigned to in-range slots $1 \dots N$. | $0 \le C_{\text{val\_slots}} \le C_{\text{req}}$ `[APPROVED CONTRACT]` |
| $\mathbf{C_{\text{inv}}}$ | **Invalid Candidates** | Number of generated candidate objects that fail schema, option, answer, or proof validation. | $C_{\text{inv}} \ge 0$ |
| $\mathbf{C_{\text{dup}}}$ | **Duplicate Candidates** | Number of generated candidates rejected due to semantic or textual collision with another candidate or existing slot. | $C_{\text{dup}} \ge 0$ |
| $\mathbf{C_{\text{overflow}}}$ | **Overflow Candidates** | Candidates returned by the AI provider in excess of $C_{\text{req}}$ ($C_{\text{overflow}} = \max(0, C_{\text{gen}} - C_{\text{req}})$ in an un-deduplicated response). Overflow candidates may be valid or invalid; they are **never classified as invalid merely because they exceed $C_{\text{req}}$**. | $C_{\text{overflow}} \ge 0$ `[PROPOSED DEFAULT — Requires Owner Approval under OD-02]` |
| $\mathbf{C_{\text{edit}}}$ | **Manually Edited Slots** | Number of valid in-range slots whose content has been modified by the human editor. | $0 \le C_{\text{edit}} \le C_{\text{val\_slots}}$ `[APPROVED CONTRACT]` |
| $\mathbf{C_{\text{acc}}}$ | **Accepted Slots** | Number of valid/edited in-range slots explicitly approved by the editor for verification. | $0 \le C_{\text{acc}} \le C_{\text{val\_slots}}$ `[APPROVED CONTRACT]` |
| $\mathbf{C_{\text{rem\_gen}}}$ | **Remaining Generation Count** | Number of distinct valid slots still required to reach generation completeness ($C_{\text{rem\_gen}} = C_{\text{req}} - C_{\text{val\_slots}}$). | $0 \le C_{\text{rem\_gen}} \le C_{\text{req}}$ `[APPROVED CONTRACT]` |
| $\mathbf{C_{\text{rem\_accept}}}$ | **Remaining Acceptance Count** | Number of valid slots still awaiting editorial acceptance ($C_{\text{rem\_accept}} = C_{\text{req}} - C_{\text{acc}}$). | $0 \le C_{\text{rem\_accept}} \le C_{\text{req}}$ `[APPROVED CONTRACT]` |

#### Candidate Accounting Decomposition:
$$C_{\text{gen}} = C_{\text{val\_slots}} + C_{\text{inv}} + C_{\text{dup}} + C_{\text{overflow}}$$

- **No False Invalidation**: Valid overflow candidates are isolated in an overflow quarantine buffer (`overflowBuffer`) and must **never** be added to $C_{\text{inv}}$.
- **Immutable Target Invariant**: Extra candidate generation ($C_{\text{overflow}} > 0$) must **never** silently inflate $C_{\text{req}}$.

---

### 2.4 Lifecycle Progression: Generation, Acceptance & Verification Readiness

Batch authoring enforces three strictly separated milestones. No incomplete or invalid batch may ever be presented or submitted as complete:

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
|                                  BATCH LIFECYCLE MILESTONES                                      |
├───────────────────────────────┬──────────────────────────────────┬───────────────────────────────┤
| 1. Generation Completeness     | 2. Editorial Acceptance          | 3. Submit for Verification     |
| (C_rem_gen == 0)              | (C_rem_accept == 0)              | (Stage 01 -> Stage 02 Hand-off)|
├───────────────────────────────┼──────────────────────────────────┼───────────────────────────────┤
| • Exactly N distinct slots    | • Human reviews each slot        | • BATCH IS 100% COMPLETE      |
| • All N slots VALID or EDITED | • Slots marked ACCEPTED          | • All N slots ACCEPTED/EDITED |
| • Zero EMPTY or INVALID slots | • C_acc == C_req                 | • Save Draft committed to DB  |
| • batchStatus = 'COMPLETE'    | • batchStatus = 'ACCEPTED'       | • AuthorId != ApproverId      |
└───────────────────────────────┴──────────────────────────────────┴───────────────────────────────┘
```

#### Milestone 1: Generation Completeness (`batchStatus: 'COMPLETE'`)
A batch attains **Generation Completeness** if and only if:

$$\mathbf{C_{\text{val\_slots}}} == \mathbf{C_{\text{req}}} \quad \land \quad \mathbf{C_{\text{distinct\_slots}}} == \mathbf{C_{\text{req}}} \quad \land \quad \mathbf{C_{\text{rem\_gen}}} == 0$$

- All $N$ configured slots ($1 \dots N$) are filled with distinct, canonical questions in status `'VALID'` or `'MANUALLY_EDITED'`.
- Zero slots remain in `'EMPTY'`, `'GENERATING'`, or `'INVALID'` status.
- *Crucial Rule*: Generation completeness indicates only that AI synthesis succeeded; it does **not** imply editorial sign-off or permit automatic submission.

#### Milestone 2: Editorial Acceptance (`batchStatus: 'ACCEPTED'`)
A batch attains **Editorial Acceptance** if and only if:

$$\mathbf{C_{\text{acc}}} == \mathbf{C_{\text{req}}} \quad \land \quad \mathbf{C_{\text{rem\_accept}}} == 0$$

- The authenticated human editor has reviewed every slot and marked it as approved (`status: 'ACCEPTED'`) or confirmed acceptable manual edits (`status: 'MANUALLY_EDITED'`).
- No pending review flags or validation warnings remain.

#### Milestone 3: Eligibility for Submit for Verification (Stage 01 $\rightarrow$ Stage 02 Gate)
A batch is eligible for **Submit for Verification** if and only if:
1. **Full Completeness**: $C_{\text{val\_slots}} == C_{\text{req}}$ and $C_{\text{rem\_gen}} == 0$.
2. **Editorial Sign-Off**: $C_{\text{rem\_accept}} == 0$ (all $N$ slots are accepted or confirmed edited).
3. **Persisted State**: All changes are committed to the Firestore aggregate draft document (`isDirty === false`).
4. **Human Action Mandatory**: Submit must be initiated by an authenticated human editor; AI cannot self-submit [ADR-002, Principle 3].
5. **Anti-Self-Approval Enforcement (GAR-02)**: The author cannot approve their own batch during Stage 02 ($authorId \neq approverId$).
6. **Strict Prohibition**: An incomplete ($C_{\text{rem\_gen}} > 0$), invalid ($C_{\text{inv}} > 0$ occupying a slot), or un-reviewed batch must **never** be presented as complete or submitted for verification. Attempting submission on an incomplete batch throws HTTP 422 `IncompleteBatchSubmissionError`.

---

## 3. Failure and Recovery Matrix

The following matrix documents detection, persisted state, user feedback, recovery, retry bounds, and audit rules across all 10 operational failure modes.

| # | Failure Scenario | Detection Mechanism | Persisted Firestore State | User-Visible Status | Permitted Recovery Action | Retry & Boundary Behavior | Audit Log Requirement |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **AI returns fewer questions than requested** ($C_{\text{gen}} < C_{\text{req}}$) | Array length check: `candidates.length < targetCount`. | Incremental save: valid slots $1 \dots C_{\text{val\_slots}}$ saved as `VALID`; slots $C_{\text{val\_slots}}+1 \dots C_{\text{req}}$ remain `EMPTY`. | `PARTIAL_SUCCESS`: "Generated $C_{\text{val\_slots}}$ of $C_{\text{req}}$ questions." | User clicks "Generate Remaining Slots" or manually drafts missing slots. | Bounded retry: 1 automated attempt requesting exactly $C_{\text{rem\_gen}}$ items `[PROPOSED DEFAULT — Requires Owner Approval under OD-02]`. Terminal if retry fails. | `BATCH_GENERATION_SHORTFALL` (records $C_{\text{req}}, C_{\text{gen}}, C_{\text{val\_slots}}$). |
| **2** | **AI returns malformed or schema-invalid questions** | Per-slot validator: `validateCandidate()` fails on missing options, short text, or bad answer key. | Valid slots saved as `VALID`; failing slots saved as `INVALID` with error array in `slotValidationErrors`. | `VALIDATION_FAILED`: Warning badge on invalid slot card with specific error message. | 1. Click "Regenerate Slot".<br>2. Manually fix invalid fields in Studio editor. | Bounded slot retry: max 2 automated attempts per slot `[PROPOSED DEFAULT — Requires Owner Approval under OD-02]`. Retries only targeted slot. | `BATCH_SLOT_VALIDATION_FAILED` (records slot index and error codes). |
| **3** | **AI returns duplicate questions or duplicate slot IDs** | Deduplication check: exact string/option match `[APPROVED CONTRACT: ADR-009]` or Levenshtein $> 0.85$ `[PROPOSED DEFAULT — Requires Owner Approval under OD-02]`. | First instance retained as `VALID`; subsequent duplicate marked `DUPLICATE_REJECTED`. | `DUPLICATE_DETECTED`: "Question $j$ is duplicate of Question $i$." | Click "Regenerate Duplicate" to fetch a distinct candidate. | Prompt modifier appended: `excludeConcepts: [concept_i]`. Max 2 automated retries `[PROPOSED DEFAULT — Requires Owner Approval under OD-02]`. | `BATCH_DUPLICATE_DETECTED` (records conflicting slot indices). |
| **4** | **AI returns more questions than requested** ($C_{\text{gen}} > C_{\text{req}}$) | Array length check: `candidates.length > targetCount`. | First $C_{\text{req}}$ valid questions accepted into slots $1 \dots N$. Overflow items quarantined in `overflowBuffer`. | `COMPLETE` (or `PARTIAL_SUCCESS`): "Generated $N$ questions. $M$ overflow candidates buffered." | Extra items can be viewed in "Buffer Tray" to swap with invalid slots. | Extra items never automatically increment $C_{\text{req}}$ `[APPROVED CONTRACT: ADR-010]`. Quarantined items expire on batch close `[PROPOSED DEFAULT — Requires Owner Approval under OD-02]`. | `BATCH_OVERFLOW_TRUNCATED` (records excess count $C_{\text{overflow}}$). |
| **5** | **Generation fails or times out partway through** | HTTP 504 / network abort / stream disconnect before response completion. | Transaction rollback or save of last validated partial chunk with batch status `INCOMPLETE`. | `GENERATION_TIMEOUT`: "Generation timed out after slot $k$." | User clicks "Resume Batch Generation" to generate remaining $C_{\text{rem\_gen}}$ slots. | Bounded timeout: client aborts at 45s `[PROPOSED DEFAULT — Requires Owner Approval under OD-02]`. Marks batch `FAILED_RECOVERABLE`. No runaway retries. | `BATCH_GENERATION_TIMEOUT` (records elapsed ms and last valid slot). |
| **6** | **Persistence fails after generation** | Firestore write error (e.g. quota limit, network glitch, OCC conflict). | Aggregate write rolled back; in-memory candidates retained in client state. | `PERSISTENCE_ERROR`: "Failed to save batch. Retry save?" | In-place "Retry Save" button using retained client state. Zero re-generation. | Client retries Firestore write with exponential backoff (1s, 2s, 4s). Max 3 attempts `[PROPOSED DEFAULT — Requires Owner Approval under OD-02]`. | `BATCH_PERSISTENCE_FAILED` (records Firestore error code). |
| **7** | **User leaves and resumes partial batch** | User reopens workspace via `?draftId=dft_...`. | Document hydrated from `question_drafts/{id}` containing persisted slots $1 \dots N$. | `RESUMED_DRAFT`: Displays completed slots as green, unresolved slots as empty/actionable. | User reviews existing slots and clicks "Generate Remaining" for unresolved slots. | Idempotent: restores existing slot IDs and versions; zero re-generation of valid slots `[APPROVED CONTRACT]`. | `BATCH_WORKBENCH_RESUMED` (records draftId and hydrated count). |
| **8** | **Retry returns questions already persisted** | Deduplication check against all existing persisted slots in the batch aggregate. | Duplicate candidate discarded; slot remains in `RETRYING` state. | `DUPLICATE_SUPPRESSED`: Background warning; prompts AI with explicit negative constraints. | AI prompt re-issued with negative keywords from persisted questions. | Bounded to 2 attempts before surfacing manual intervention prompt `[PROPOSED DEFAULT — Requires Owner Approval under OD-02]`. | `BATCH_RETRY_DEDUP_TRIGGERED` (records duplicate text snippet). |
| **9** | **Retry/regeneration conflicts with concurrent edits** | OCC check: Firestore document `version !== expectedVersion`. | Write rejected with HTTP 409 `ConcurrencyConflictError`. State preserved. | `CONCURRENCY_CONFLICT`: "Batch was modified in another session. Refresh to view changes." | Prompt user to resolve conflicts (Keep Server Version vs. Overwrite Slot). | Server update rejected fail-closed; local changes not silently discarded `[APPROVED CONTRACT]`. | `BATCH_CONCURRENCY_CONFLICT` (records version mismatch). |
| **10** | **One question fails while other slots are valid** | Granular per-slot validation: Slot $k$ has invalid options, slots $1 \dots k-1, k+1 \dots N$ are valid. | Valid slots persisted as `VALID`; slot $k$ persisted as `INVALID` within aggregate. | `MIXED_READINESS`: "9 of 10 slots valid. 1 slot requires correction." | User edits Slot $k$ directly in editor or clicks "Regenerate Slot $k$". | Isolated slot retry: only Slot $k$ prompt sent to AI provider. Valid slots untouched `[APPROVED CONTRACT]`. | `BATCH_SLOT_REPAIR_TRIGGERED` (records target slot index). |

---

## 4. Regeneration and Replacement Policy

### 4.1 Granular Operations
Batch authoring defines three distinct mutation operations:

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                         BATCH REGENERATION & REPLACEMENT OPERATIONS                              │
├───────────────────────────────┬──────────────────────────────────┬───────────────────────────────┤
│ Operation                     │ Target Scope                     │ Impact on Remaining Slots     │
├───────────────────────────────┼──────────────────────────────────┼───────────────────────────────┤
│ 1. Regenerate Single Slot     │ Slot k (where status != ACCEPTED)│ Zero impact on slots j ≠ k    │
│ 2. Replace Single Question    │ Slot k (manual input or bank)    │ Zero impact on slots j ≠ k    │
│ 3. Regenerate Entire Batch    │ All slots 1 … N                  │ Requires explicit confirmation│
└───────────────────────────────┴──────────────────────────────────┴───────────────────────────────┘
```

### 4.2 Slot Identity, Revision & Version Control
1. **Stable Slot Number**: Every question occupies a fixed index `slotNumber: 1..N`.
2. **Stable Slot Identifier**: Each slot receives an internal UUID `slotId: slt_<uuid_v4>`. Regenerating a slot updates the slot contents but preserves `slotNumber`.
3. **Slot Revision Tracking**: Each slot maintains a `revisionNumber` incremented whenever its contents change. Prior slot content is archived in `slotHistory` `[PROPOSED DEFAULT — Requires Owner Approval under OD-02]`.
4. **Aggregate OCC Versioning**: Every write to the aggregate draft document increments the root `version` field. Mismatches throw HTTP 409 `ConcurrencyConflictError`.

### 4.3 Preservation of Manual Edits Invariant
- **Protection Rule**: Any slot where `isManuallyEdited === true` or `status === 'ACCEPTED'` is **immutable to automated batch operations by default**.
- **Accidental Overwrite Guard**:
  - Clicking "Regenerate Entire Batch" prompts an explicit confirmation modal listing all manually edited or accepted slots:
    > *"Warning: Slots 2, 4, and 7 contain manual edits or accepted status. Regenerating the batch will supersede these edits. Create new revision?"*
  - The user must explicitly choose:
    - `Option A (Default)`: Regenerate only un-edited, un-accepted slots (`isManuallyEdited === false && status !== 'ACCEPTED'`).
    - `Option B`: Archive current aggregate as Revision $R$ and generate a completely fresh Revision $R+1$ in Firestore history `[PROPOSED DEFAULT — Requires Owner Approval under OD-02]`.

---

## 5. Partial Persistence and Resume Architecture

### 5.1 Firestore Persistence Model (ADR-011 DD-05)
Under ADR-011 DD-05, a batch is persisted as a **single atomic aggregate document** in the `question_drafts` collection `[APPROVED CONTRACT: ADR-011]`:

$$\text{Document Path: } \texttt{question\_drafts/dft\_<uuid\_v4>}$$

```typescript
export interface Mode1BatchDraftAggregate {
  id: string; // dft_<uuid_v4>
  productionMode: 'QUESTION_CHALLENGE_SHORT';
  topicId: string;
  subtopicId: string;
  language: QuestionLanguage;
  difficulty: DifficultyLevel;
  configuredQuestionCount: 5 | 10 | 15 | 20; // C_req (immutable)
  batchStatus: 'EMPTY' | 'GENERATING' | 'PARTIAL' | 'COMPLETE' | 'ACCEPTED' | 'FAILED';
  version: number; // OCC atomic counter
  currentAttemptNumber: number;
  authorId: string;
  createdAt: string;
  updatedAt: string;

  // Granular slot state
  slots: Array<{
    slotNumber: number; // 1 to N
    slotId: string; // slt_<uuid_v4>
    status: 'EMPTY' | 'GENERATING' | 'VALID' | 'INVALID' | 'MANUALLY_EDITED' | 'ACCEPTED';
    questionText: string;
    options: { a: string; b: string; c: string; d: string };
    correctAnswer: 'A' | 'B' | 'C' | 'D';
    explanation: string;
    trickOrPitfall?: string;
    isManuallyEdited: boolean;
    validationErrors: string[];
    revisionNumber: number;
  }>;

  // Overflow buffer for non-destructive candidate quarantine [PROPOSED DEFAULT]
  overflowBuffer?: Array<{
    candidateId: string;
    questionText: string;
    options: { a: string; b: string; c: string; d: string };
    correctAnswer: 'A' | 'B' | 'C' | 'D';
    explanation: string;
  }>;
}
```

### 5.2 Incremental Persistence Protocol
1. Validated candidates are written atomically to the aggregate document in Firestore.
2. If generation aborts at slot $k$, the aggregate document retains slots $1 \dots k$ as persisted state with `batchStatus: 'PARTIAL'`.
3. Valid slots are never discarded due to downstream failures.

### 5.3 Resume Protocol
1. **Hydration**: When the author reloads `/studio?draftId=dft_...`, the frontend hydrates from the aggregate document.
2. **Readiness Evaluation**: The workbench inspects all slots:
   - Slots with `status === 'VALID'`, `'MANUALLY_EDITED'`, or `'ACCEPTED'` are rendered with existing content.
   - Slots with `status === 'INVALID'` display validation error badges.
   - Slots with `status === 'EMPTY'` display "Pending Generation" cards.
3. **Targeted Completion**: Clicking "Generate Remaining Slots" sends a generation request scoped strictly to the missing slot count ($C_{\text{rem\_gen}}$), supplying negative constraints to prevent duplicates with existing slots.

### 5.4 Save Draft vs. Submit for Verification Boundary
- **Save Draft**: Allowed at any time, including when the batch is empty, partial, or contains invalid slots. Clears dirty state and updates OCC `version`. Does not advance workflow stage.
- **Submit for Verification**: Strictly **blocked** unless:
  $$\mathbf{C_{\text{val\_slots}}} == \mathbf{C_{\text{req}}} \quad \land \quad \mathbf{C_{\text{rem\_gen}}} == 0 \quad \land \quad \mathbf{C_{\text{rem\_accept}}} == 0$$
  A partial batch can **never** be submitted to Stage 02. Attempting submission on an incomplete batch throws HTTP 422 `IncompleteBatchSubmissionError`.

---

## 6. Deterministic Acceptance Test Scenarios

The following deterministic scenarios specify required test behavior for future implementation verification:

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             DETERMINISTIC ACCEPTANCE SCENARIOS                                   │
├───────────────┬─────────────────┬────────────────────────────────────────────────────────────────┤
│ Scenario ID   │ Test Case       │ Expected Counts, Asserted States & Invariants                  │
├───────────────┼─────────────────┼────────────────────────────────────────────────────────────────┤
│ TC-BATCH-01   │ Counts 5,10,15,20│ Given valid prompt, AI returns N items.                        │
│               │ (Happy Path)    │ Expected: C_req=N, C_gen=N, C_val_slots=N, C_inv=0, C_rem_gen=0│
│               │                 │ BatchStatus = COMPLETE. All N slots VALID.                     │
├───────────────┼─────────────────┼────────────────────────────────────────────────────────────────┤
│ TC-BATCH-02   │ Fewer results   │ Given C_req=10, AI returns 7 items.                            │
│               │ (Shortfall)     │ Expected: C_req=10, C_gen=7, C_val_slots=7, C_inv=0,           │
│               │                 │ C_rem_gen=3. BatchStatus = PARTIAL. Slots 1-7 VALID, 8-10 EMPTY│
│               │                 │ Submitting for verification is BLOCKED (HTTP 422).             │
├───────────────┼─────────────────┼────────────────────────────────────────────────────────────────┤
│ TC-BATCH-03   │ Malformed item  │ Given C_req=5, AI returns 5 items, but Slot 3 missing optD.   │
│               │ (Invalid slot)  │ Expected: C_req=5, C_gen=5, C_val_slots=4, C_inv=1,            │
│               │                 │ C_rem_gen=1. Slot 3 status = INVALID. Error = "Missing optD". │
│               │                 │ BatchStatus = PARTIAL. Verification submission BLOCKED.        │
├───────────────┼─────────────────┼────────────────────────────────────────────────────────────────┤
│ TC-BATCH-04   │ Extra results   │ Given C_req=5, AI returns 7 valid items.                       │
│               │ (Overflow)      │ Expected: C_req=5, C_gen=7, C_val_slots=5, C_overflow=2,       │
│               │                 │ C_inv=0, C_rem_gen=0. Slots 1-5 populated. Extra 2 items NOT   │
│               │                 │ added to batch slots. C_req strictly 5. C_inv is 0 (not 2).    │
├───────────────┼─────────────────┼────────────────────────────────────────────────────────────────┤
│ TC-BATCH-05   │ Duplicate items │ Given C_req=10, Slot 4 text identical to Slot 1 text.          │
│               │ (Collision)     │ Expected: Slot 1 = VALID; Slot 4 = DUPLICATE_REJECTED.         │
│               │                 │ C_dup=1, C_val_slots=9, C_rem_gen=1. BatchStatus = PARTIAL.    │
├───────────────┼─────────────────┼────────────────────────────────────────────────────────────────┤
│ TC-BATCH-06   │ Network timeout │ Given C_req=10, stream terminates after slot 4.                │
│               │ (Interruption)  │ Expected: Slots 1-4 persisted as VALID; Slots 5-10 EMPTY.      │
│               │                 │ BatchStatus = PARTIAL. Error toast surfaces with Resume button.│
├───────────────┼─────────────────┼────────────────────────────────────────────────────────────────┤
│ TC-BATCH-07   │ Resume batch    │ Given persisted partial batch (4 valid of 10), user resumes.   │
│               │ (Idempotency)   │ Action: User clicks "Generate Remaining Slots".                │
│               │                 │ Expected: AI prompt requests ONLY 6 items. Slots 1-4 untouched.│
│               │                 │ Zero duplicate slots generated; zero overwrites of valid slots.│
│               │                 │ On success: Slots 5-10 populated. BatchStatus = COMPLETE.      │
├───────────────┼─────────────────┼────────────────────────────────────────────────────────────────┤
│ TC-BATCH-08   │ Slot repair     │ Given partial batch with Slot 3 INVALID, user edits Slot 3.    │
│               │ (Manual edit)   │ Action: User fills missing Option D and saves.                 │
│               │                 │ Expected: Slot 3 status = MANUALLY_EDITED. C_edit=1,           │
│               │                 │ C_val_slots increments to 5. C_rem_gen = 0.                    │
│               │                 │ BatchStatus transitions to COMPLETE.                           │
├───────────────┼─────────────────┼────────────────────────────────────────────────────────────────┤
│ TC-BATCH-09   │ Single slot     │ Given batch of 5, user clicks "Regenerate Slot 2".             │
│               │ regeneration    │ Expected: Only Slot 2 sent to AI. Slots 1, 3, 4, 5 unchanged.  │
│               │                 │ Slot 2 revisionNumber increments; previous slot state archived.│
├───────────────┼─────────────────┼────────────────────────────────────────────────────────────────┤
│ TC-BATCH-10   │ Replace single  │ Given batch of 10, user replaces Slot 4 from question bank.    │
│               │ question        │ Expected: Slot 4 updated with new content; status = VALID.     │
│               │                 │ All other 9 slots and prior revisions strictly preserved.      │
├───────────────┼─────────────────┼────────────────────────────────────────────────────────────────┤
│ TC-BATCH-11   │ Whole-batch     │ Given batch with manual edit in Slot 2 and accepted in Slot 4. │
│               │ regeneration &  │ Action: User clicks "Regenerate Entire Batch".                 │
│               │ edit protection │ Expected: Confirmation modal displays warning. Default option  │
│               │                 │ regenerates only un-edited/un-accepted slots. Option B archives│
│               │                 │ Revision R and generates fresh Revision R+1. No silent loss.   │
├───────────────┼─────────────────┼────────────────────────────────────────────────────────────────┤
│ TC-BATCH-12   │ Persistence     │ Given AI returns 5 valid items, Firestore write fails (503).   │
│               │ failure & retry │ Expected: Items retained in memory. User clicks "Retry Save".  │
│               │ without regen   │ Write succeeds without re-calling AI. C_gen unchanged.         │
├───────────────┼─────────────────┼────────────────────────────────────────────────────────────────┤
│ TC-BATCH-13   │ Concurrent edit │ Editor A and Editor B edit Draft dft_123 concurrently.        │
│               │ OCC conflict    │ Editor A saves (version 1 -> 2). Editor B attempts save (v1).  │
│               │                 │ Expected: Editor B write rejected with HTTP 409 Conflict.      │
│               │                 │ Conflict modal surfaces; Editor B local changes preserved.     │
├───────────────┼─────────────────┼────────────────────────────────────────────────────────────────┤
│ TC-BATCH-14   │ Incomplete      │ Given batch with C_val_slots=9 of 10 (C_rem_gen=1).            │
│               │ submission gate │ Action: User attempts "Submit for Verification".               │
│               │                 │ Expected: Action disabled in UI; API rejects with HTTP 422     │
│               │                 │ IncompleteBatchSubmissionError. Workflow stage remains 01.     │
├───────────────┼─────────────────┼────────────────────────────────────────────────────────────────┤
│ TC-BATCH-15   │ Full editorial  │ Given C_val_slots=10, editor accepts all slots (C_rem_accept=0)│
│               │ acceptance &    │ Action: Author clicks "Submit for Verification".               │
│               │ verification    │ Expected: Batch advances to Stage 02. GAR-02 enforces that     │
│               │ handoff         │ approverId != authorId during Stage 02 verification.           │
└───────────────┴─────────────────┴────────────────────────────────────────────────────────────────┘
```

---

## 7. Governance, Schema Gaps & Implementation Boundary

### 7.1 Outstanding Implementation Boundary
- **Batch Dispatcher Unimplemented**: Neither `question-generation.service.ts` nor `question-draft.service.ts` contains the logic to dispatch multi-question batch prompts for Mode 1 or manage aggregate slots.
- **Current Behavior**: Selecting $N > 1$ in the UI is approved by configuration validation, but the runtime currently processes only single drafts ($N=1$).
- **Requirement for Future Sprints**: Implementing this specification requires a dedicated runtime implementation task (`S9-BATCH-RUNTIME` or downstream equivalent) to introduce the batch prompt builder, slot validator, and aggregate repository adapter.

### 7.2 Schema Gap Analysis
1. **Aggregate Document Structure**: `QuestionDraft` in `shared/types/question.ts` currently contains `questions?: ExplainedQuestionItem[]` (designed for Mode 3). Mode 1 batch generation requires extending this aggregate or adopting a typed `slots` schema as specified in Section 5.1.
2. **Downstream Video Fan-Out**: Mode 1 batch authoring produces $N$ independent short videos. The mechanism for fanning out an approved batch draft ($1 \text{ draft} \to N \text{ questions} \to N \text{ videos}$) requires formal Project Owner approval under OD-02 before Stage 02 verification handoff can be automated.

---

## 8. Specification Verdict & Next Action

- **Specification Status**: **`ACCEPTED AS AUTHORITATIVE REQUIREMENTS SPECIFICATION`**
- **Evidence-Based Verdict**:
  - Fully defines count semantics, dual remaining counters, valid question rules, failure matrix, recovery protocols, and 15 acceptance test cases.
  - Aligns with ADR-010, ADR-011 (DD-05), and canonical Firestore architecture.
  - Distinguishes approved contracts from proposed defaults requiring owner confirmation under OD-02.
  - Zero runtime application code, schemas, or production records mutated.
- **Single Next Action**: Deliverable established for Task `S9-T03`. **Do NOT start Task `S9-T04`**.
