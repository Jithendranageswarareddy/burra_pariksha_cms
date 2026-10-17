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
Deliver an authoritative, deterministic requirements specification and failure/recovery matrix for **Mode 1 Batch Creation Series (`QUESTION_CHALLENGE_SHORT` for counts $N \in \{5, 10, 15, 20\}$)**. This specification defines exact completeness invariants, slot lifecycle states, retry boundaries, partial persistence protocols, and regression acceptance scenarios.

### 1.2 Governance & Implementation Boundaries
1. **Architectural Authority**:
   - [ADR-010](../../architecture/DECISION-LOG.md#L14): Conceptual approval of Mode 1 batch generation series for counts $>1$ (Option A), with the batch execution runner formally classified as an Open Decision (**OD-02**).
   - [ADR-011 (DD-05)](../../architecture/DECISION-LOG.md#L15): Mandates a **single atomic aggregate document in `question_drafts`** for multi-question sets, avoiding premature fanned-out document proliferation.
   - [ADR-009](../../architecture/DECISION-LOG.md#L13): Strict 4-option MCQ invariant (`a, b, c, d`) and single correct answer key (`A, B, C, D`) across every question slot.
   - [ADR-002](../../architecture/DECISION-LOG.md#L6) / Principle 3: Canonical 15-stage workflow progression and GAR-02 anti-self-approval rule ($authorId \neq approverId$).
2. **Current Runtime Status**:
   - **Specification Only**: This deliverable defines the testable behavioral contract. The actual batch dispatch runner and multi-slot execution engine remain **unbuilt** per the S9-T01 audit.
   - **Zero Code Mutations**: Does not alter runtime code, database schemas, production Firestore records, or Google Sheets.

---

## 2. Count and Completeness Contract

### 2.1 Supported Batch Counts & Invariants
Mode 1 Batch Creation Series supports **strictly four discrete batch counts**:

$$\mathbf{N} \in \{5, 10, 15, 20\}$$

- **Arbitrary Counts Prohibited**: Question counts such as $0, 2, 3, 4, 6, 7, 12, 25$, negative integers, or non-integers are strictly rejected by `validateProductionModeConfig` and `contentModeRegistry.validateConfig`.
- **Target Valid Questions**: A batch request configured with count $N$ expects **exactly $N$ valid, distinct questions**.
- **Pedagogical Relationship**: All $N$ questions in a batch share identical taxonomy context (`topicId`, `subtopicId`, `language`, `difficulty`), but each represents a standalone vertical short ($\le 58\text{s}$) with a unique mathematical problem, distinct options, and specific shortcut explanation.

### 2.2 Canonical Valid Question Definition
A question occupying slot $k$ ($1 \le k \le N$) is deemed **`VALID`** if and only if it satisfies all of the following canonical contract requirements:
1. **Statement**: Non-empty `questionText` with $\text{length} \ge 5$ characters.
2. **Four Distinct Options**: Contains strictly 4 non-empty choices (`a`, `b`, `c`, `d` in the canonical `options` object). Pairwise option text comparisons must be distinct ($\text{text}_i \neq \text{text}_j$ case-insensitive).
3. **Correct Answer Key**: Exactly one declared answer matching one of `'A'`, `'B'`, `'C'`, or `'D'`.
4. **Mathematical Proof / Explanation**: Non-empty `explanation` with $\text{length} \ge 5$ characters containing mathematical derivation.
5. **Taxonomy & Mode Grounding**: Valid `topicId` and `subtopicId` matching the active syllabus hierarchy (`subtopic.topicId === topic.id`), with `productionMode === 'QUESTION_CHALLENGE_SHORT'`.
6. **No Placeholder Content**: No unresolved template tokens (e.g. `[INSERT FORMULA]`, `TODO`, `N/A`, `Option text here`).

### 2.3 Distinct Count Categories & Telemetry
To avoid ambiguous progress reporting, every batch generation attempt maintains explicit counters:

| Counter Symbol | Name | Definition | Invariant |
| :---: | :--- | :--- | :--- |
| $\mathbf{C_{\text{req}}}$ | **Requested Count** | The configured target count ($5, 10, 15, 20$). Immutable for that generation attempt. | $C_{\text{req}} \in \{5, 10, 15, 20\}$ |
| $\mathbf{C_{\text{gen}}}$ | **Generated Count** | Raw question candidate objects returned by the AI provider in response to the prompt. | $C_{\text{gen}} \ge 0$ |
| $\mathbf{C_{\text{val}}}$ | **Valid Count** | Number of generated questions satisfying 100% of canonical validation rules. | $0 \le C_{\text{val}} \le C_{\text{req}}$ |
| $\mathbf{C_{\text{inv}}}$ | **Invalid Count** | Number of generated items failing schema, option, answer, or proof validation. | $C_{\text{inv}} = C_{\text{gen}} - C_{\text{val}}$ |
| $\mathbf{C_{\text{edit}}}$ | **Manually Edited Count** | Number of valid questions that have been modified by human editor. | $0 \le C_{\text{edit}} \le C_{\text{val}}$ |
| $\mathbf{C_{\text{acc}}}$ | **Accepted Count** | Number of valid/edited questions explicitly approved by the editor for verification. | $0 \le C_{\text{acc}} \le C_{\text{val}}$ |
| $\mathbf{C_{\text{rem}}}$ | **Remaining Count** | Number of slots still required to reach batch completeness. | $C_{\text{rem}} = C_{\text{req}} - C_{\text{acc}}$ |

### 2.4 Completeness Invariant
A batch is authoritatively **`COMPLETE`** if and only if:

$$\mathbf{C_{\text{val}}} == \mathbf{C_{\text{req}}} \quad \land \quad \mathbf{C_{\text{distinct\_slots}}} == \mathbf{C_{\text{req}}}$$

- **Zero Tolerance for Partial Completion**: A partial batch ($C_{\text{val}} < C_{\text{req}}$) must **never** be reported as complete.
- **No Silent Count Inflation**: Extra questions returned by an AI provider ($C_{\text{gen}} > C_{\text{req}}$) must never increase $C_{\text{req}}$.
- **No Invalid Slot Masking**: Malformed or invalid slots ($C_{\text{inv}} > 0$) must never be counted toward completeness.

---

## 3. Failure and Recovery Matrix

The following matrix documents the system behavior across all 10 operational failure modes during batch generation.

| # | Failure Scenario | Detection Mechanism | Persisted Firestore State | User-Visible Status | Permitted Recovery Action | Retry & Boundary Behavior | Audit Log Requirement |
| :-: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | **AI returns fewer questions than requested** ($C_{\text{gen}} < C_{\text{req}}$) | Array length check: `candidates.length < targetCount`. | Incremental save: valid slots $1 \dots C_{\text{val}}$ saved with status `VALID`; slots $C_{\text{val}}+1 \dots C_{\text{req}}$ remain `EMPTY`. | `PARTIAL_SUCCESS`: "Generated $C_{\text{val}}$ of $C_{\text{req}}$ questions." | User clicks "Retry Missing Slots" or manually drafts remaining slots. | Automated retry: 1 bounded attempt requesting exactly $C_{\text{rem}}$ items. Terminal if retry fails. | `BATCH_GENERATION_SHORTFALL` (records $C_{\text{req}}, C_{\text{gen}}, C_{\text{val}}$). |
| **2** | **AI returns malformed or schema-invalid questions** | Per-slot validator: `validateCandidate()` fails on missing options, short text, or bad answer key. | Valid slots saved as `VALID`; failing slots saved as `INVALID` with error array in `slotValidationErrors`. | `VALIDATION_FAILED`: Warning badge on invalid slot card with specific error message. | 1. Click "Regenerate Slot".<br>2. Manually fix invalid fields in Studio editor. | Bounded slot retry: max 2 automated attempts per slot. Retries only targeted slot. | `BATCH_SLOT_VALIDATION_FAILED` (records slot index and error codes). |
| **3** | **AI returns duplicate questions or duplicate slot IDs** | Pairwise deduplication: string similarity metric (Levenshtein $> 0.85$ or identical `options`). | First instance retained as `VALID`; subsequent duplicate marked `DUPLICATE_REJECTED`. | `DUPLICATE_DETECTED`: "Question $j$ is duplicate of Question $i$." | Click "Regenerate Duplicate" to fetch a distinct candidate. | Prompt modifier appended: `excludeConcepts: [concept_i]`. Max 2 automated retries. | `BATCH_DUPLICATE_DETECTED` (records conflicting slot indices). |
| **4** | **AI returns more questions than requested** ($C_{\text{gen}} > C_{\text{req}}$) | Array length check: `candidates.length > targetCount`. | First $C_{\text{req}}$ valid questions accepted into slots $1 \dots N$. Overflow items quarantined in `overflowBuffer`. | `COMPLETE` (or `PARTIAL_SUCCESS`): "Generated $N$ questions. $M$ extra discarded/buffered." | Extra items can be viewed in "Buffer Tray" to swap with invalid slots. | Extra items never automatically increment $C_{\text{req}}$. Quarantined items expire on batch close. | `BATCH_OVERFLOW_TRUNCATED` (records excess count). |
| **5** | **Generation fails or times out partway through** | HTTP 504 / network abort / stream disconnect before response completion. | Transaction rollback or save of last validated partial chunk with batch status `INCOMPLETE`. | `GENERATION_TIMEOUT`: "Generation timed out after slot $k$." | User clicks "Resume Batch Generation" to generate remaining $C_{\text{rem}}$ slots. | Bounded timeout: client aborts at 45s; marks batch `FAILED_RECOVERABLE`. No runaway retries. | `BATCH_GENERATION_TIMEOUT` (records elapsed ms and last valid slot). |
| **6** | **Persistence fails after generation** | Firestore write error (e.g. quota limit, network glitch, OCC conflict). | Aggregate write rolled back; in-memory candidates retained in client state. | `PERSISTENCE_ERROR`: "Failed to save batch. Retry save?" | In-place "Retry Save" button using retained client state. No re-generation needed. | Client retries Firestore write with exponential backoff (1s, 2s, 4s). Max 3 attempts. | `BATCH_PERSISTENCE_FAILED` (records Firestore error code). |
| **7** | **User leaves and resumes partial batch** | User reopens workspace via `?draftId=dft_...`. | Document hydrated from `question_drafts/{id}` containing persisted slots $1 \dots N$. | `RESUMED_DRAFT`: Displays completed slots as green, unresolved slots as empty/actionable. | User reviews existing slots and clicks "Generate Remaining" for unresolved slots. | Idempotent: restores existing slot IDs and versions; zero re-generation of valid slots. | `BATCH_WORKBENCH_RESUMED` (records draftId and hydrated count). |
| **8** | **Retry returns questions already persisted** | Deduplication check against all existing persisted slots in the batch aggregate. | Duplicate candidate discarded; slot remains in `RETRYING` state. | `DUPLICATE_SUPPRESSED`: Background warning; prompts AI with explicit negative constraints. | AI prompt re-issued with negative keywords from persisted questions. | Bounded to 2 attempts before surfacing manual intervention prompt. | `BATCH_RETRY_DEDUP_TRIGGERED` (records duplicate text snippet). |
| **9** | **Retry/regeneration conflicts with concurrent edits** | OCC check: Firestore document `version !== expectedVersion`. | Write rejected with HTTP 409 `ConcurrencyConflictError`. State preserved. | `CONCURRENCY_CONFLICT`: "Batch was modified in another session. Refresh to view changes." | Prompt user to resolve conflicts (Keep Server Version vs. Overwrite Slot). | Server update rejected fail-closed; local changes not silently discarded. | `BATCH_CONCURRENCY_CONFLICT` (records version mismatch). |
| **10** | **One question fails while other slots are valid** | Granular per-slot validation: Slot $k$ has invalid options, slots $1 \dots k-1, k+1 \dots N$ are valid. | Valid slots persisted as `VALID`; slot $k$ persisted as `INVALID` within aggregate. | `MIXED_READINESS`: "9 of 10 slots valid. 1 slot requires correction." | User edits Slot $k$ directly in editor or clicks "Regenerate Slot $k$". | Isolated slot retry: only Slot $k$ prompt sent to AI provider. Valid slots untouched. | `BATCH_SLOT_REPAIR_TRIGGERED` (records target slot index). |

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
│ 2. Replace Single Question    │ Slot k (manual input or search)  │ Zero impact on slots j ≠ k    │
│ 3. Regenerate Entire Batch    │ All slots 1 … N                  │ Requires explicit confirmation│
└───────────────────────────────┴──────────────────────────────────┴───────────────────────────────┘
```

### 4.2 Slot Identity & Versioning
1. **Stable Slot Number**: Every question occupies a fixed index `slotNumber: 1..N`.
2. **Stable Slot Identifier**: Each slot receives an internal UUID `slotId: slt_<uuid_v4>`. Regenerating a slot updates the slot contents but preserves `slotNumber`.
3. **Slot Revision Tracking**: Each slot maintains a `revisionNumber` incremented whenever its contents change.

### 4.3 Preservation of Manual Edits Invariant
- **Protection Rule**: Any slot where `isManuallyEdited === true` is **immutable to automated batch operations by default**.
- **Accidental Overwrite Guard**:
  - Clicking "Regenerate Entire Batch" prompts an explicit confirmation modal listing all manually edited slots:
    > *"Warning: Slots 2, 4, and 7 contain manual edits. Regenerating the batch will supersede these edits. Create new revision?"*
  - The user must explicitly choose:
    - `Option A (Recommended)`: Regenerate only un-edited slots (`isManuallyEdited === false`).
    - `Option B`: Archive current aggregate as Revision $R$ and generate a completely fresh Revision $R+1$.

---

## 5. Partial Persistence and Resume Architecture

### 5.1 Firestore Persistence Model (ADR-011 DD-05)
Under ADR-011 DD-05, a batch is persisted as a **single atomic aggregate document** in the `question_drafts` collection:

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
  batchStatus: 'EMPTY' | 'GENERATING' | 'PARTIAL' | 'COMPLETE' | 'FAILED';
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
}
```

### 5.2 Incremental Persistence Protocol
1. As candidates are generated and validated, they are written to the aggregate document in Firestore.
2. If generation aborts at slot $k$, the aggregate document retains slots $1 \dots k$ as persisted state with `batchStatus: 'PARTIAL'`.
3. Valid slots are never discarded due to downstream failures.

### 5.3 Resume Protocol
1. **Hydration**: When the author reloads `/studio?draftId=dft_...`, the frontend hydrates from the aggregate document.
2. **Readiness Evaluation**: The workbench inspects all slots:
   - Slots with `status === 'VALID'` or `'MANUALLY_EDITED'` are displayed in green/read-only mode.
   - Slots with `status === 'INVALID'` display validation error badges.
   - Slots with `status === 'EMPTY'` display "Pending Generation" cards.
3. **Targeted Completion**: Clicking "Complete Batch" sends a generation request scoped strictly to the missing slot indices ($\text{slots where status} \in \{\text{'EMPTY'}, \text{'INVALID'}\}$).

### 5.4 Save Draft vs. Submit for Verification Boundary
- **Save Draft**: Allowed at any time, including when the batch is empty, partial, or contains invalid slots. Clears dirty state and updates OCC `version`.
- **Submit for Verification**: Strictly **blocked** unless:
  $$\mathbf{C_{\text{val}}} == \mathbf{C_{\text{req}}} \quad \land \quad \forall s \in \text{slots}: s.\text{status} \in \{\text{'VALID'}, \text{'MANUALLY\_EDITED'}, \text{'ACCEPTED'}\}$$
  A partial batch can **never** be submitted to Stage 02. Attempting submission on an incomplete batch throws HTTP 422 `IncompleteBatchSubmissionError`.

---

## 6. Deterministic Acceptance Test Scenarios

The following deterministic scenarios specify required test behavior for future implementation verification:

```text
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             DETERMINISTIC ACCEPTANCE SCENARIOS                                   │
├───────────────┬─────────────────┬────────────────────────────────────────────────────────────────┤
│ Scenario ID   │ Test Case       │ Expected Counts & Asserted State                               │
├───────────────┼─────────────────┼────────────────────────────────────────────────────────────────┤
│ TC-BATCH-01   │ Counts 5,10,15,20│ Given valid prompt, AI returns N items.                        │
│               │ (Happy Path)    │ Expected: C_req=N, C_gen=N, C_val=N, C_inv=0, C_rem=0.         │
│               │                 │ BatchStatus = COMPLETE. All N slots VALID.                     │
├───────────────┼─────────────────┼────────────────────────────────────────────────────────────────┤
│ TC-BATCH-02   │ Fewer results   │ Given C_req=10, AI returns 7 items.                            │
│               │ (Shortfall)     │ Expected: C_req=10, C_gen=7, C_val=7, C_inv=0, C_rem=3.        │
│               │                 │ BatchStatus = PARTIAL. Slots 1-7 VALID, Slots 8-10 EMPTY.      │
│               │                 │ Submitting for verification is BLOCKED (HTTP 422).             │
├───────────────┼─────────────────┼────────────────────────────────────────────────────────────────┤
│ TC-BATCH-03   │ Malformed item  │ Given C_req=5, AI returns 5 items, but Slot 3 missing optD.   │
│               │ (Invalid slot)  │ Expected: C_req=5, C_gen=5, C_val=4, C_inv=1, C_rem=1.         │
│               │                 │ Slot 3 status = INVALID. Error = "Option D is required."       │
│               │                 │ BatchStatus = PARTIAL.                                         │
├───────────────┼─────────────────┼────────────────────────────────────────────────────────────────┤
│ TC-BATCH-04   │ Extra results   │ Given C_req=5, AI returns 7 valid items.                       │
│               │ (Overflow)      │ Expected: C_req=5, C_gen=7, C_val=5, C_rem=0. Slots 1-5 saved. │
│               │                 │ Extra 2 items NOT added to batch. C_req remains strictly 5.    │
├───────────────┼─────────────────┼────────────────────────────────────────────────────────────────┤
│ TC-BATCH-05   │ Duplicate items │ Given C_req=10, Slot 4 text identical to Slot 1 text.          │
│               │ (Collision)     │ Expected: Slot 1 = VALID; Slot 4 = DUPLICATE_REJECTED.         │
│               │                 │ C_val=9, C_rem=1. BatchStatus = PARTIAL.                       │
├───────────────┼─────────────────┼────────────────────────────────────────────────────────────────┤
│ TC-BATCH-06   │ Network timeout │ Given C_req=10, stream terminates after slot 4.                │
│               │ (Interruption)  │ Expected: Slots 1-4 persisted as VALID; Slots 5-10 EMPTY.      │
│               │                 │ BatchStatus = PARTIAL. Error toast surfaces with Resume button.│
├───────────────┼─────────────────┼────────────────────────────────────────────────────────────────┤
│ TC-BATCH-07   │ Resume batch    │ Given persisted partial batch (4 valid of 10), user resumes.   │
│               │ (Idempotency)   │ Action: User clicks "Complete Batch".                          │
│               │                 │ Expected: AI prompt requests ONLY 6 items. Slots 1-4 untouched.│
│               │                 │ On success: Slots 5-10 populated. BatchStatus = COMPLETE.      │
├───────────────┼─────────────────┼────────────────────────────────────────────────────────────────┤
│ TC-BATCH-08   │ Slot repair     │ Given partial batch with Slot 3 INVALID, user edits Slot 3.    │
│               │ (Manual edit)   │ Action: User fills missing Option D and saves.                 │
│               │                 │ Expected: Slot 3 status = MANUALLY_EDITED. C_val increments.   │
│               │                 │ If all other slots valid, BatchStatus transitions to COMPLETE. │
├───────────────┼─────────────────┼────────────────────────────────────────────────────────────────┤
│ TC-BATCH-09   │ Single slot     │ Given batch of 5, user clicks "Regenerate Slot 2".             │
│               │ regeneration    │ Expected: Only Slot 2 sent to AI. Slots 1, 3, 4, 5 unchanged.  │
│               │                 │ Slot 2 revisionNumber increments.                              │
├───────────────┼─────────────────┼────────────────────────────────────────────────────────────────┤
│ TC-BATCH-10   │ Manual edit     │ Given batch with manual edits in Slot 2, user clicks           │
│               │ protection      │ "Regenerate Entire Batch".                                     │
│               │                 │ Expected: Confirmation modal displays warning. Automated       │
│               │                 │ overwrite strictly prevented without explicit confirmation.    │
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
  - Fully defines count semantics, valid question rules, failure matrix, recovery protocols, and acceptance test cases.
  - Aligns with ADR-010, ADR-011 (DD-05), and canonical Firestore architecture.
  - Zero runtime application code, schemas, or production records mutated.
- **Single Next Action**: Deliverable established for Task `S9-T03`. **Do NOT start Task `S9-T04`**.
