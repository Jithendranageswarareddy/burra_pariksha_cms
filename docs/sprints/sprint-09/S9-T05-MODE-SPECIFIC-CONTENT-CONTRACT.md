# S9-T05: Mode-Specific Content Contract Specification

**Milestone**: Sprint 9 — Question Challenge Short (Mode 1 Production Pipeline)<br>
**Task ID**: `S9-T05`<br>
**Effective Date**: October 18, 2026<br>
**Author**: Antigravity Software Architect & Systems Verification Engineer<br>
**Mode Identifier**: `QUESTION_CHALLENGE_SHORT` (Mode 1 Single & Batch Creation Series)<br>
**Status**: Authoritative Content Contract & Schema Proposal (Gate B Technical Design Baseline)

---

## 1. Purpose, Scope, Terminology & Source Authority

### 1.1 Purpose
This document establishes the authoritative, strongly typed content contract and data schema proposal for **Mode 1: Question Challenge Short (`QUESTION_CHALLENGE_SHORT`)**. It defines the canonical representation for single-question vertical shorts ($N=1$) and multi-question batch creation series ($N \in \{5, 10, 15, 20\}$) within the Burra Pariksha Content Management System (BP-CMS).

### 1.2 Scope & Boundaries
- **In-Scope**:
  - Root aggregate draft schema and metadata in `question_drafts`.
  - Ordered slot data model, slot lifecycle states, and slot revision tracking.
  - Question-level fields, nested 4-option MCQ representation, correct answer key, and explanation contracts.
  - Server-side validation schemas, stable error codes, and typed validation envelopes.
  - Compatibility shims for existing single-question drafts and legacy identifiers.
  - Persistence, transaction, and optimistic concurrency control (OCC) boundaries.
- **Explicit Non-Scope**:
  - Runtime implementation of the batch dispatcher runner (Open Decision **OD-02**).
  - Runtime Firestore DDL migrations or mutating existing production documents.
  - Modifying Mode 2 (`TOPIC_INTRODUCTION`) or Mode 3 (`EXPLAINED_QUESTIONS_VIDEO`) contracts.
  - Stage 07 Final Video QC review criteria ([FC-012](../../features/FC-012-FINAL-QC-REVIEW-GATE.md)).

### 1.3 Terminology Baseline
- **Content Package / Aggregate**: The root document in `question_drafts` representing the working authoring unit. For Mode 1, this aggregate holds either a single question ($N=1$) or an ordered collection of $N$ questions ($N \in \{5, 10, 15, 20\}$) sharing syllabus context ([ADR-011 DD-05](../../architecture/DECISION-LOG.md#L15)).
- **Question Slot**: A stable, ordered position ($k \in \{1 \dots N\}$) within a batch aggregate holding a specific question problem, options, answer, and explanation.
- **In-Range Slot vs. Overflow Candidate**: In-range slots populate indices $1 \dots N$. Candidates generated in excess of $N$ are held in `overflowBuffer` for optional manual swapping and do **not** inflate the configured count ([S9-T03](S9-T03-BATCH-GENERATION-REQUIREMENTS.md)).
- **Save Draft vs. Submit for Verification**: Saving persists partial progress without advancing workflow; submitting requires 100% complete, valid slots and transitions the aggregate to Stage 02 ([AGENTS.md §11](../../../AGENTS.md#11-save-vs-verify-operational-contract)).

### 1.4 Source Authority Hierarchy & Current Implementation Status
In strict adherence to [AGENTS.md §1](../../../AGENTS.md#1-source-of-truth-authority-hierarchy):
1. **Verified Current Runtime Reality (`main`)**:
   - Runtime `QuestionDraftService` and `QuestionGenerationService` operate strictly on single-question documents ($N=1$) using flat option aliases and root fields.
   - Batch series selection ($N \in \{5, 10, 15, 20\}$) is validated by `contentModeRegistry.validateConfig` ([`shared/registry/content-mode.registry.ts`](../../../shared/registry/content-mode.registry.ts)), but the batch dispatch runner, multi-slot persistence engine, and legacy hydration adapters remain **unbuilt future proposals** per the S9-T01 audit.
2. **Authoritative Architectural Contracts**:
   - [ADR-002](../../architecture/DECISION-LOG.md#L6): Principle 3 GAR-02 anti-self-approval invariant ($authorId \neq approverId$) across all stages with zero exceptions.
   - [ADR-009](../../architecture/DECISION-LOG.md#L13): Canonical 4-option MCQ schema (`a, b, c, d` in canonical `options` object) and single answer key (`A, B, C, D`).
   - [ADR-010](../../architecture/DECISION-LOG.md#L14): Conceptual approval of Mode 1 batch series ($N \in \{5, 10, 15, 20\}$) under Option A.
   - [ADR-011 (DD-05)](../../architecture/DECISION-LOG.md#L15): Multi-question drafts must be persisted as a **single atomic aggregate document in `question_drafts`**, avoiding premature document fan-out.
   - [S8-T05](../../sprints/sprint-08/S8-T05-PRODUCTION-CONTEXT-CONTRACT.md) & [S8-T06](../../sprints/sprint-08/S8-T06-CONTENT-MODE-REGISTRY-DESIGN.md): Authoritative mode registration, production context, and 9:16 aspect ratio constraints.
   - [S9-T02](S9-T02-QUESTION-CHALLENGE-SHORT-CONTENT-SPEC.md), [S9-T03](S9-T03-BATCH-GENERATION-REQUIREMENTS.md), and [S9-T04](S9-T04-EDITING-QUALITY-VERIFICATION-CRITERIA.md): Approved field-level matrices, completeness rules, and verification criteria.

---

## 2. Canonical Package & Aggregate Metadata

In compliance with ADR-011 DD-05, a Mode 1 authoring package is persisted as a single atomic document in the `question_drafts` collection.

### 2.1 Aggregate Document Interface

```typescript
import {
  DifficultyLevel,
  QuestionLanguage,
  QuestionStatus,
  QuestionStyle,
} from '../../shared/constants/enums';
import { Mode1QuestionSlot } from './mode1-slot.types';

export interface Mode1BatchDraftAggregate {
  // 1. Identity & Routing
  id: string; // Canonical Draft ID: dft_<uuid_v4> (or legacy BP-DFT-###)
  productionMode: 'QUESTION_CHALLENGE_SHORT'; // Immutable canonical mode discriminator

  // 2. Syllabus & Taxonomy Grounding (Two-Tier Hierarchy)
  topicId: string; // Canonical Topic ID: top_<uuid_v4> (legacy TOP-###)
  topicName?: string; // Human-readable syllabus topic title
  subtopicId: string; // Canonical Subtopic ID: sub_<uuid_v4> (legacy SUB-###)
  subtopicName?: string; // Human-readable syllabus subtopic title

  // 3. Mode Configuration Parameters (Immutable for Attempt)
  configuredQuestionCount: 1 | 5 | 10 | 15 | 20; // C_req: target count
  aspectRatio: '9:16'; // Strictly 9:16 vertical short
  language: QuestionLanguage; // TELUGU | ENGLISH | TELUGU_ENGLISH
  difficulty: DifficultyLevel; // Easy | Intermediate | Advanced
  questionStyle?: QuestionStyle | string; // e.g. SPEED_MATH_TRICK, STORY_BASED
  targetDurationSeconds?: number; // Hard ceiling <= 58s (default: 52s)

  // 4. Batch Lifecycle & Aggregate Status
  batchStatus: 'EMPTY' | 'GENERATING' | 'PARTIAL' | 'COMPLETE' | 'ACCEPTED' | 'FAILED';
  currentAttemptNumber: number; // Monotonically increasing generation attempt counter
  version: number; // Optimistic Concurrency Control (OCC) counter (starts at 1)

  // 5. Ordered Question Slots Collection (ADR-011 DD-05)
  slots: Mode1QuestionSlot[]; // Exactly configuredQuestionCount slots

  // 6. Candidate Overflow Buffer (Non-Destructive Quarantine)
  overflowBuffer?: Array<{
    candidateId: string; // cnd_<uuid_v4>
    questionText: string;
    options: { a: string; b: string; c: string; d: string };
    correctAnswer: 'A' | 'B' | 'C' | 'D';
    explanation: string;
    trickOrPitfall?: string;
    receivedAt: string;
  }>;

  // 7. Workflow & Ownership Tracking
  workflowStage: 'STAGE_01_QUESTION_STUDIO' | 'STAGE_02_VERIFICATION';
  status: QuestionStatus | 'DRAFT' | 'SUBMITTED_FOR_REVIEW';
  workflowInstanceId?: string; // wfl_<uuid_v4>
  authorId: string; // usr_<uuid_v4>
  authorName: string; // Human-readable author display name
  createdAt: string; // ISO-8601 UTC timestamp
  updatedAt: string; // ISO-8601 UTC timestamp

  // 8. Single-Question Compatibility Projections (Derived / Shims for N=1)
  questionText?: string;
  options?: { a: string; b: string; c: string; d: string };
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctAnswer?: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  realWorldContext?: string;
}
```

### 2.2 Aggregate Field Specifications

| Property Name | Canonical Type | Nullable / Optional | Description & Invariant | Contract Authority |
| :--- | :--- | :---: | :--- | :--- |
| `id` | `string` | No | Distributed collision-resistant UUID `dft_<uuid_v4>`. Legacy format `BP-DFT-###` supported for reading. | [AGENTS.md §6](../../../AGENTS.md#6-entity-id-architecture-uuid-based) |
| `productionMode`| `'QUESTION_CHALLENGE_SHORT'` | No | Discriminator for Mode 1. Prevents cross-mode schema pollution. | [S8-T05](../../sprints/sprint-08/S8-T05-PRODUCTION-CONTEXT-CONTRACT.md) |
| `topicId` | `string` | No | Autonomous root taxonomy reference (`top_<uuid_v4>`). Zero Category. | [AGENTS.md §5](../../../AGENTS.md#5-canonical-two-tier-taxonomy-architecture) |
| `subtopicId` | `string` | No | Mandatory child taxonomy reference (`sub_<uuid_v4>`). Must satisfy `subtopic.topicId === topic.id`. | [AGENTS.md §5](../../../AGENTS.md#5-canonical-two-tier-taxonomy-architecture) |
| `configuredQuestionCount` | `1 \| 5 \| 10 \| 15 \| 20` | No | Target valid question count $C_{\text{req}}$. Strictly immutable for that draft generation attempt. | [S9-T03](S9-T03-BATCH-GENERATION-REQUIREMENTS.md) |
| `aspectRatio` | `'9:16'` | No | Video framing aspect ratio. Strictly `'9:16'` vertical format. | [shared/registry/content-mode.registry.ts](../../../shared/registry/content-mode.registry.ts) |
| `batchStatus` | `enum` | No | Aggregate progress state (`EMPTY`, `GENERATING`, `PARTIAL`, `COMPLETE`, `ACCEPTED`, `FAILED`). | [S9-T03](S9-T03-BATCH-GENERATION-REQUIREMENTS.md) |
| `version` | `number` | No | Optimistic concurrency control atomic counter. Mismatch rejects write with HTTP 409. | [S9-T04](S9-T04-EDITING-QUALITY-VERIFICATION-CRITERIA.md) |
| `authorId` | `string` | No | User UUID of the author (`usr_<uuid_v4>`). Author cannot approve own draft (GAR-02). | [AGENTS.md §10](../../../AGENTS.md#10-workflow-authority-and-gar-02-rule) |
| `slots` | `Mode1QuestionSlot[]` | No | Array of ordered question slots. Length must equal `configuredQuestionCount`. | [ADR-011 DD-05](../../architecture/DECISION-LOG.md#L15) |

---

## 3. Ordered Question Collection & Slot Identity

### 3.1 Slot Data Model (`Mode1QuestionSlot`)

```typescript
export interface Mode1QuestionSlot {
  // Slot Identity & Ordering
  slotNumber: number; // Sequential index: 1 to N
  slotId: string; // Canonical slot UUID: slt_<uuid_v4>
  revisionNumber: number; // Monotonically increasing revision counter (starts at 1)

  // Slot Lifecycle State
  status: 'EMPTY' | 'GENERATING' | 'VALID' | 'INVALID' | 'MANUALLY_EDITED' | 'ACCEPTED';
  isManuallyEdited: boolean; // Flag protecting against automated batch overwrites

  // Canonical Question Payload
  questionText: string; // Problem statement (>= 5 chars)
  options: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string; // Mathematical solution proof (>= 5 chars)
  trickOrPitfall?: string; // Speed math shortcut or common student pitfall
  realWorldContext?: string; // Real-life problem hook / scenario

  // Backward Compatibility Flattened Projections (Derived)
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;

  // Transient / Cached Validation Findings (Informational Only)
  validationErrors?: string[]; // Cached validation errors (never authoritative)
  lastValidatedAt?: string; // ISO-8601 timestamp of last evaluation
}
```

### 3.2 Slot Identity, Ordering & Reordering Invariants
1. **Stable Slot Identity**: Each slot receives an immutable UUID (`slotId: slt_<uuid_v4>`) upon creation. Reordering slots alters `slotNumber`, but retains the question's underlying `slotId` and audit provenance.
2. **Contiguous Slot Indexing**: Slot numbers within an active batch of count $N$ must form a strictly contiguous sequence:
   $$\{1, 2, \dots, N\} \quad \text{with zero gaps and zero duplicates}$$
3. **Reordering Semantics**:
   - Reordering questions mutates the `slotNumber` permutation vector.
   - Reordering preserves the question text, options, answer key, and manual edit flags.
   - Emits a `BATCH_SLOTS_REORDERED` audit log record.
4. **Deletion Semantics**:
   - Deleting slot $k$ resets slot $k$ to status `'EMPTY'`; it does **not** shrink $C_{\text{req}}$.
   - Decrements $C_{\text{val\_slots}}$ and increments $C_{\text{rem\_gen}}$.
   - Prevents arbitrary count reduction ($N \notin \{1, 5, 10, 15, 20\}$).

### 3.3 Transient vs. Persisted Validation Results
- **Cached in Document**: `slot.validationErrors` is stored in the document solely to render studio error badges without executing client re-validation.
- **Authoritative Server Evaluation**: Stale cached validation results are **never** treated as authoritative. Whenever `submitForVerification` or `saveDraft` is invoked, the backend domain service re-executes pure validation against the active payload on-the-fly.

---

## 4. Question-Level Fields & Cross-Model Mapping

### 4.1 Field Contract & Quality Rules

1. **`questionText`**:
   - Mathematical challenge problem statement in Telugu or English.
   - Must be non-empty with trimmed $\text{length} \ge 5$ characters.
   - Must avoid unresolved template tokens (e.g. `[INSERT NUMBER]`, `TODO`, `N/A`).
2. **Canonical Four-Option MCQ (`options`)**:
   - Nested object containing strictly four non-empty keys: `a`, `b`, `c`, `d`.
   - Pairwise distinct invariant: $\text{options}[i] \neq \text{options}[j]$ (case-insensitive trimmed comparison).
   - Flat compatibility aliases (`optionA`, `optionB`, `optionC`, `optionD`) are populated as projections.
3. **`correctAnswer`**:
   - Single uppercase character matching strictly one of `'A'`, `'B'`, `'C'`, or `'D'`.
   - Must point to an option with non-empty text.
4. **`explanation`**:
   - Step-by-step mathematical proof and speed trick derivation.
   - Must be non-empty with trimmed $\text{length} \ge 5$ characters.

### 4.2 Cross-Model Mapping Matrix

The following matrix cross-references the proposed `Mode1QuestionSlot` against existing domain models in `shared/types/question.ts` and `shared/contracts/question-generation/`:

| Canonical Field | `Mode1QuestionSlot` (Proposed S9-T05) | `QuestionDraft` (Existing Model) | `Question` (Existing Production) | `ExplainedQuestionItem` (Mode 3 Item) | `StudioCandidate` (Contract DTO) | Mapping / Compatibility Behavior | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Slot Number** | `slotNumber: number` | N/A (Root draft) | N/A (Production Q) | `questionNumber: number` | N/A | Maps to `ExplainedQuestionItem.questionNumber` for batch display. | `[PROPOSED DESIGN]` |
| **Slot UUID** | `slotId: string` | N/A | N/A | N/A | N/A | Internal slot identifier (`slt_<uuid>`). | `[PROPOSED DESIGN]` |
| **Problem Text**| `questionText: string` | `questionText: string` | `questionText: string` | `questionText: string` | `questionText: string` | Direct 1:1 mapping across all models. | `[APPROVED CONTRACT]` |
| **Nested Options**| `options: { a, b, c, d }`| `options: { a, b, c, d }`| `options: { a, b, c, d }`| `options: { a, b, c, d }`| N/A (`optionA..D`) | Canonical source of truth for 4 MCQ choices. | `[APPROVED CONTRACT: ADR-009]`|
| **Flat Option A**| `optionA?: string` | `optionA?: string` | `optionA?: string` | `optionA?: string` | `optionA: string` | Derived compatibility alias from `options.a`. | `[VERIFIED RUNTIME BEHAVIOR]` |
| **Flat Option B**| `optionB?: string` | `optionB?: string` | `optionB?: string` | `optionB?: string` | `optionB: string` | Derived compatibility alias from `options.b`. | `[VERIFIED RUNTIME BEHAVIOR]` |
| **Flat Option C**| `optionC?: string` | `optionC?: string` | `optionC?: string` | `optionC?: string` | `optionC: string` | Derived compatibility alias from `options.c`. | `[VERIFIED RUNTIME BEHAVIOR]` |
| **Flat Option D**| `optionD?: string` | `optionD?: string` | `optionD?: string` | `optionD?: string` | `optionD: string` | Derived compatibility alias from `options.d`. | `[VERIFIED RUNTIME BEHAVIOR]` |
| **Answer Key** | `correctAnswer: 'A'\|'B'\|'C'\|'D'`| `correctAnswer: string`| `correctAnswer: string`| `correctAnswer: string`| `correctAnswer: string`| Strict union in Mode 1; string in legacy types. | `[APPROVED CONTRACT: ADR-009]`|
| **Explanation** | `explanation: string` | `explanation: string` | `explanation: string` | `explanation: string` | `explanation: string` | Mathematical derivation and shortcut proof. | `[APPROVED CONTRACT: S9-T02]` |
| **Speed Trick** | `trickOrPitfall?: string`| N/A | N/A | `trickOrPitfall?: string`| N/A | Reuses Mode 3 speed trick shortcut field. | `[PROPOSED DESIGN]` |
| **Real Context** | `realWorldContext?: string`| `realWorldContext?: string`| `realWorldContext?: string`| N/A | `realLifeContext: string` | Contextual hook / scenario prompt. | `[APPROVED CONTRACT: S9-T02]` |
| **Edit Flag** | `isManuallyEdited: boolean`| N/A | N/A | N/A | N/A | Guard protecting manual edits during batch retry. | `[PROPOSED DESIGN]` |
| **Slot Revision**| `revisionNumber: number` | N/A | N/A | N/A | N/A | Per-slot mutation tracking counter. | `[PROPOSED DESIGN]` |

---

## 5. Mode-Specific Configuration & Constraints

### 5.1 Mode 1 Registration Constraints
In strict alignment with `shared/registry/content-mode.registry.ts`:

$$\mathbf{Mode\ 1\ Configuration\ Space} = \left\{ (N, AR, D) \ \middle|\ N \in \{1, 5, 10, 15, 20\}, \ AR = \text{'9:16'}, \ D \le 58\text{s} \right\}$$

- **Allowed Counts**: Exactly $1$ (Single Short) OR $5, 10, 15, 20$ (Batch Creation Series).
- **Aspect Ratio**: Strictly `'9:16'`. Any other ratio (e.g. `'16:9'`) is rejected by `validateConfig`.
- **Duration Hard Ceiling**: $\le 58\text{s}$. (Target: 52s; Minimum: 30s).
- **Challenge Type**: Strictly `'ABCD'`.
- **Two-Tier Taxonomy**: Both `topicId` and `subtopicId` are required. Subtopic must be a verified child of Topic (`subtopic.topicId === topic.id`).

### 5.2 Mode Boundary Isolation
To guarantee zero cross-mode regression:
- **Mode 2 (`TOPIC_INTRODUCTION`)**: Governed by `introductoryConcept` statement ($\ge 15$ chars), $N=0$ questions, $60\text{--}180$s duration, supports 9:16 or 16:9. Unaffected by Mode 1 contracts.
- **Mode 3 (`EXPLAINED_QUESTIONS_VIDEO`)**: Governed by 1 conceptual overview + $N \in \{5, 10, 15, 20\}$ practice questions (`questions?: ExplainedQuestionItem[]`), 16:9 masterclass format ($12\text{--}52$ minutes). Unaffected by Mode 1 contracts.

---

## 6. Server-Side Validation Contract & Typed Envelopes

The server is the **authoritative gatekeeper** for quality and completeness. Frontend validation provides immediate UX feedback but is never trusted by API route handlers.

### 6.1 Typed Validation Envelope Interfaces

```typescript
export interface ValidationErrorItem {
  code: string; // Machine-readable stable error code (e.g. ERR_EMPTY_PROMPT)
  message: string; // Human-readable explanation
  path: string; // JSON dot-notation path (e.g. "slots[2].options.d")
  slotNumber?: number; // 1-based slot index (if slot-scoped)
  severity: 'BLOCKING'; // Blocks Submit for Verification
}

export interface ValidationWarningItem {
  code: string; // Machine-readable stable warning code (e.g. WARN_LENGTH_PACING)
  message: string; // Human-readable warning message
  path: string; // JSON dot-notation path
  slotNumber?: number; // 1-based slot index
  severity: 'WARNING'; // Advisory only; does NOT block submission
}

export interface Mode1ValidationResultEnvelope {
  isValid: boolean; // True if errors.length === 0
  configuredCount?: number; // Configured target count C_req (undefined if unconfigured/invalid)
  validSlotCount: number; // Distinct valid slots populated C_val_slots
  remainingCount?: number; // Remaining generation slots C_rem_gen (undefined if configuredCount is undefined)
  errors: ValidationErrorItem[]; // Array of blocking errors
  warnings: ValidationWarningItem[]; // Array of advisory warnings
  evaluatedAt: string; // ISO-8601 UTC timestamp
}
```

### 6.2 Stable Error & Warning Codes Inventory

| Code | Severity | Description | Triggers HTTP Status |
| :--- | :---: | :--- | :---: |
| `ERR_INVALID_MODE` | **BLOCKING** | `productionMode !== 'QUESTION_CHALLENGE_SHORT'` | HTTP 400 |
| `ERR_INVALID_COUNT` | **BLOCKING** | `configuredQuestionCount` not in $\{1, 5, 10, 15, 20\}$ | HTTP 400 |
| `ERR_INVALID_ASPECT_RATIO` | **BLOCKING** | `aspectRatio !== '9:16'` | HTTP 400 |
| `ERR_TAXONOMY_MISMATCH` | **BLOCKING** | `subtopic.topicId !== topic.id` or non-existent taxonomy IDs | HTTP 400 |
| `ERR_MISSING_AUTHOR_ID` | **BLOCKING** | Record lacks an author identifier (`authorId`) | HTTP 400 |
| `ERR_EMPTY_PROMPT` | **BLOCKING** | `questionText.trim().length < 5` | HTTP 422 |
| `ERR_OPTION_MISSING` | **BLOCKING** | Missing choice (`a`, `b`, `c`, or `d`) | HTTP 422 |
| `ERR_OPTION_INVALID_TYPE` | **BLOCKING** | Choice value is not a string (numbers/objects rejected) | HTTP 422 |
| `ERR_OPTION_DUPLICATE` | **BLOCKING** | Non-distinct options ($\text{opt}_i == \text{opt}_j$) | HTTP 422 |
| `ERR_INVALID_ANSWER_KEY` | **BLOCKING** | `correctAnswer` not in `['A', 'B', 'C', 'D']` | HTTP 422 |
| `ERR_MISSING_ANSWER_KEY` | **BLOCKING** | Correct answer key is missing or invalid; cannot be fabricated and requires human assignment | HTTP 422 |
| `ERR_MISSING_DRAFT_ID` | **BLOCKING** | Record lacks a valid draft identifier (`id` or `draftId`) | HTTP 400 |
| `ERR_SLOT_COUNT_MISMATCH` | **BLOCKING** | Number of slots in `slots` array does not match `configuredQuestionCount` | HTTP 422 |
| `ERR_MISSING_SLOT_ID` | **BLOCKING** | Existing slot lacks a canonical `slotId` | HTTP 422 |
| `ERR_DUPLICATE_SLOT_ID` | **BLOCKING** | Duplicate `slotId` found in slots array; IDs must be distinct | HTTP 422 |
| `ERR_SLOT_STATUS_INCONSISTENT` | **BLOCKING** | Slot is marked `VALID` or `ACCEPTED` but contains blocking validation errors | HTTP 422 |
| `ERR_BATCH_STATUS_INCONSISTENT` | **BLOCKING** | Batch is marked `COMPLETE` or `ACCEPTED` but contains incomplete or unreviewed slots | HTTP 422 |
| `ERR_INCOMPLETE_LEGACY_BATCH` | **BLOCKING** | Legacy record specified `targetQuestionCount > 1`, but contains only 1 question at root. Remaining slots are empty | HTTP 422 |
| `ERR_MISSING_EXPLANATION` | **BLOCKING** | `explanation.trim().length < 5` | HTTP 422 |
| `ERR_EXACT_DUPLICATE_QUESTION` | **BLOCKING** | Duplicate question text and options match an earlier slot or active question | HTTP 422 |
| `ERR_INCOMPLETE_BATCH_SLOTS` | **BLOCKING** | Slot status is `EMPTY`, `GENERATING`, or `INVALID` during submission | HTTP 422 |
| `ERR_DISCONTINUOUS_SLOTS` | **BLOCKING** | Slot numbering is non-contiguous or missing slot UUIDs | HTTP 422 |
| `ERR_OCC_VERSION_MISMATCH` | **BLOCKING** | `expectedVersion !== draft.version` | HTTP 409 |
| `ERR_UNAUTHORIZED_SUBMITTER` | **BLOCKING** | Submitter lacks `QUESTION:SUBMIT` capability or is not author/editor | HTTP 403 |
| `ERR_SELF_APPROVAL_PROHIBITED` | **BLOCKING** | Reviewer matches author during approval (`NEG-01` / GAR-02) | HTTP 403 |
| `WARN_MISSING_SLOT_ID` | **WARNING** | Legacy single-question record lacks a slotId; a canonical UUID will be generated upon save | N/A (Allowed) |
| `WARN_MISSING_VERSION` | **WARNING** | Record lacks persisted version; established during write | N/A (Allowed) |
| `WARN_MISSING_BATCH_STATUS` | **WARNING** | Record lacks persisted batchStatus; established during write | N/A (Allowed) |
| `WARN_LENGTH_PACING` | **WARNING** | `questionText.length > 180` characters (may exceed 58s duration) | N/A (Allowed) |
| `WARN_SEMANTIC_SIMILARITY` | **WARNING** | Semantic overlap $> 0.85$ with another candidate | N/A (Allowed) |

---

## 7. Representative Payloads & Expected Validation Results

The following payloads illustrate concrete request structures and the corresponding authoritative server validation responses.

### 7.1 Example 1: Valid Single-Question Mode 1 Draft ($N=1$)

#### Request Payload:
```json
{
  "id": "dft_a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
  "productionMode": "QUESTION_CHALLENGE_SHORT",
  "topicId": "top_8f9a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
  "subtopicId": "sub_1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
  "difficulty": "Intermediate",
  "language": "TELUGU",
  "aspectRatio": "9:16",
  "configuredQuestionCount": 1,
  "batchStatus": "ACCEPTED",
  "version": 1,
  "currentAttemptNumber": 1,
  "authorId": "usr_99887766-5544-3322-1100-aabbccddeeff",
  "authorName": "Ramesh Kumar",
  "workflowStage": "STAGE_01_QUESTION_STUDIO",
  "status": "DRAFT",
  "createdAt": "2026-10-18T00:00:00.000Z",
  "updatedAt": "2026-10-18T00:00:00.000Z",
  "slots": [
    {
      "slotNumber": 1,
      "slotId": "slt_11223344-5566-7788-99aa-bbccddeeff00",
      "revisionNumber": 1,
      "status": "ACCEPTED",
      "isManuallyEdited": false,
      "questionText": "ఒక వ్యాపారి ఒక వస్తువును 20% లాభంతో ₹720కి అమ్మితే, దాని కొన్న ఖరీదు ఎంత?",
      "options": {
        "a": "₹550",
        "b": "₹600",
        "c": "₹620",
        "d": "₹650"
      },
      "correctAnswer": "B",
      "explanation": "కొన్న ఖరీదు = 720 / 1.20 = ₹600. షార్ట్‌కట్: 20% లాభం అంటే 6/5 భాగాలు. 6 భాగాలు = 720, కాబట్టి 1 భాగం = 120, 5 భాగాలు = 600.",
      "trickOrPitfall": "20% అంటే 1/5. నేరుగా 720 * (5/6) చేయండి."
    }
  ]
}
```

#### Expected Server Validation Response:
- **Save Draft**: Allowed (HTTP 200). Draft state is persisted in `question_drafts` at Stage 01 (`status: 'DRAFT'`). `version` increments to 2.
- **Submit for Verification**: Allowed (HTTP 200). Because $C_{\text{rem\_gen}} == 0 \land C_{\text{rem\_accept}} == 0$ and `batchStatus === 'ACCEPTED'`, the package advances to `STAGE_02_VERIFICATION` (`status: 'SUBMITTED_FOR_REVIEW'`).
- **Lifecycle Invariant Distinction**: If this draft were saved immediately following generation where `slot[0].status === 'VALID'` and `batchStatus === 'COMPLETE'`, **Save Draft** would succeed, but **Submit for Verification** would be blocked ($C_{\text{rem\_accept}} = 1$) until the editor explicitly marks the slot as `'ACCEPTED'`.
- **Validation Envelope**:
  ```json
  {
    "isValid": true,
    "configuredCount": 1,
    "validSlotCount": 1,
    "remainingCount": 0,
    "errors": [],
    "warnings": [],
    "evaluatedAt": "2026-10-18T00:00:01.000Z"
  }
  ```

---

### 7.2 Example 2: Valid Proposed Batch Aggregate ($N=5$)

#### Request Payload Structure (Slots 1 to 5):
```json
{
  "id": "dft_b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e",
  "productionMode": "QUESTION_CHALLENGE_SHORT",
  "topicId": "top_8f9a2b3c-4d5e-6f7a-8b9c-0d1e2f3a4b5c",
  "subtopicId": "sub_1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d",
  "difficulty": "Intermediate",
  "language": "TELUGU",
  "aspectRatio": "9:16",
  "configuredQuestionCount": 5,
  "batchStatus": "ACCEPTED",
  "version": 4,
  "currentAttemptNumber": 1,
  "authorId": "usr_99887766-5544-3322-1100-aabbccddeeff",
  "authorName": "Ramesh Kumar",
  "workflowStage": "STAGE_01_QUESTION_STUDIO",
  "status": "DRAFT",
  "createdAt": "2026-10-18T00:05:00.000Z",
  "updatedAt": "2026-10-18T00:15:00.000Z",
  "slots": [
    {
      "slotNumber": 1,
      "slotId": "slt_d1e2f3a4-0001-4000-8000-000000000001",
      "revisionNumber": 1,
      "status": "ACCEPTED",
      "isManuallyEdited": false,
      "questionText": "ప్రశ్న 1: 15% లాభంతో ఒక వస్తువు అమ్మకపు ధర ₹460 అయితే కొన్న ఖరీదు ఎంత?",
      "options": { "a": "₹380", "b": "₹400", "c": "₹420", "d": "₹440" },
      "correctAnswer": "B",
      "explanation": "460 / 1.15 = 400."
    },
    {
      "slotNumber": 2,
      "slotId": "slt_d1e2f3a4-0002-4000-8000-000000000002",
      "revisionNumber": 2,
      "status": "ACCEPTED",
      "isManuallyEdited": true,
      "questionText": "ప్రశ్న 2: ఒక సంఖ్యలో 25% విలువ 75 అయితే, ఆ సంఖ్యలో 40% ఎంత?",
      "options": { "a": "100", "b": "110", "c": "120", "d": "130" },
      "correctAnswer": "C",
      "explanation": "సంఖ్య = 300, 300 లో 40% = 120."
    },
    {
      "slotNumber": 3,
      "slotId": "slt_d1e2f3a4-0003-4000-8000-000000000003",
      "revisionNumber": 1,
      "status": "ACCEPTED",
      "isManuallyEdited": false,
      "questionText": "ప్రశ్న 3: 20 మంది వ్యక్తులు ఒక పనిని 15 రోజుల్లో పూర్తి చేస్తే, 30 మంది ఎన్ని రోజుల్లో పూర్తి చేస్తారు?",
      "options": { "a": "8", "b": "10", "c": "12", "d": "14" },
      "correctAnswer": "B",
      "explanation": "M1*D1 = M2*D2 => 20*15 = 30*D => D = 10."
    },
    {
      "slotNumber": 4,
      "slotId": "slt_d1e2f3a4-0004-4000-8000-000000000004",
      "revisionNumber": 1,
      "status": "ACCEPTED",
      "isManuallyEdited": false,
      "questionText": "ప్రశ్న 4: వరుసగా 10, 20 మరియు 30 సరాసరి ఎంత?",
      "options": { "a": "15", "b": "20", "c": "25", "d": "30" },
      "correctAnswer": "B",
      "explanation": "(10+20+30)/3 = 20."
    },
    {
      "slotNumber": 5,
      "slotId": "slt_d1e2f3a4-0005-4000-8000-000000000005",
      "revisionNumber": 1,
      "status": "ACCEPTED",
      "isManuallyEdited": false,
      "questionText": "ప్రశ్న 5: ఒక రైలు 72 km/h వేగంతో ప్రయాణిస్తే, m/s లో దాని వేగం ఎంత?",
      "options": { "a": "15 m/s", "b": "20 m/s", "c": "25 m/s", "d": "30 m/s" },
      "correctAnswer": "B",
      "explanation": "72 * (5/18) = 20 m/s."
    }
  ]
}
```

#### Expected Server Validation Response:
- **Save Draft**: Allowed (HTTP 200). Draft state is saved in `question_drafts`, `version` advances from 4 to 5, workflow remains in Stage 01 (`status: 'DRAFT'`).
- **Submit for Verification**: Allowed (HTTP 200). All 5 slots are populated and editorially accepted ($C_{\text{rem\_gen}} == 0 \land C_{\text{rem\_accept}} == 0$). Advances aggregate to Stage 02 (`status: 'SUBMITTED_FOR_REVIEW'`). Slot 2 manual edits (`isManuallyEdited: true`) are confirmed and preserved.
- **Stage 02 Approval**: In Stage 02, an independent QA Reviewer (under GAR-02: $authorId \neq reviewerId$) verifies the 10-point checklist. Upon approval, `status` advances to `'APPROVED'` and 5 individual production `Question` entities are materialized into the `questions` collection.
- **Validation Envelope**:
  ```json
  {
    "isValid": true,
    "configuredCount": 5,
    "validSlotCount": 5,
    "remainingCount": 0,
    "errors": [],
    "warnings": [],
    "evaluatedAt": "2026-10-18T00:15:01.000Z"
  }
  ```

---

### 7.3 Example 3: Invalid Mode / Count / Aspect-Ratio Configuration

#### Request Configuration:
```json
{
  "productionMode": "QUESTION_CHALLENGE_SHORT",
  "configuredQuestionCount": 7,
  "aspectRatio": "16:9"
}
```

#### Expected Server Validation Response:
- **Save Draft / Generation**: **REJECTED** with HTTP 400 Bad Request.
- **Validation Envelope**:
  ```json
  {
    "isValid": false,
    "configuredCount": 7,
    "validSlotCount": 0,
    "remainingCount": 7,
    "errors": [
      {
        "code": "ERR_INVALID_COUNT",
        "message": "Mode 'Question Challenge Short' requires question count in [1, 5, 10, 15, 20], but received 7.",
        "path": "configuredQuestionCount",
        "severity": "BLOCKING"
      },
      {
        "code": "ERR_INVALID_ASPECT_RATIO",
        "message": "Mode 'Question Challenge Short' requires aspect ratio in ['9:16'], but received '16:9'.",
        "path": "aspectRatio",
        "severity": "BLOCKING"
      }
    ],
    "warnings": [],
    "evaluatedAt": "2026-10-18T00:16:00.000Z"
  }
  ```

---

### 7.4 Example 4: Invalid Question (Missing/Duplicate Options & Out-of-Range Answer Key)

#### Request Payload Snippet:
```json
{
  "slots": [
    {
      "slotNumber": 1,
      "questionText": "ప్రశ్న: 2 + 2 ఎంత?",
      "options": {
        "a": "4",
        "b": "4",
        "c": "5",
        "d": ""
      },
      "correctAnswer": "E",
      "explanation": "4"
    }
  ]
}
```

#### Expected Server Validation Response:
- **Save Draft**: Allowed (intermediate draft preservation).
- **Submit for Verification**: **REJECTED** with HTTP 422 Unprocessable Entity.
- **Validation Envelope**:
  ```json
  {
    "isValid": false,
    "configuredCount": 1,
    "validSlotCount": 0,
    "remainingCount": 1,
    "errors": [
      {
        "code": "ERR_OPTION_DUPLICATE",
        "message": "Option A and Option B have identical text ('4'). All choices must be distinct.",
        "path": "slots[0].options",
        "slotNumber": 1,
        "severity": "BLOCKING"
      },
      {
        "code": "ERR_OPTION_MISSING",
        "message": "Option D is required.",
        "path": "slots[0].options.d",
        "slotNumber": 1,
        "severity": "BLOCKING"
      },
      {
        "code": "ERR_INVALID_ANSWER_KEY",
        "message": "Correct answer must be specified (A, B, C, or D). Received 'E'.",
        "path": "slots[0].correctAnswer",
        "slotNumber": 1,
        "severity": "BLOCKING"
      },
      {
        "code": "ERR_MISSING_EXPLANATION",
        "message": "Explanation proof must be at least 5 characters.",
        "path": "slots[0].explanation",
        "slotNumber": 1,
        "severity": "BLOCKING"
      }
    ],
    "warnings": [],
    "evaluatedAt": "2026-10-18T00:17:00.000Z"
  }
  ```

---

### 7.5 Example 5: Incomplete Batch Aggregate (Empty / Invalid Slots)

#### Setup:
- Configured count $C_{\text{req}} = 5$.
- Slots 1, 2, 3: Valid and accepted.
- Slot 4: `status: 'EMPTY'`.
- Slot 5: `status: 'INVALID'` (missing options).

#### Expected Server Validation Response:
- **Save Draft**: Allowed (HTTP 200). Draft retains partial progress (`batchStatus: 'PARTIAL'`).
- **Submit for Verification**: **REJECTED** with HTTP 422 Unprocessable Entity.
- **Validation Envelope**:
  ```json
  {
    "isValid": false,
    "configuredCount": 5,
    "validSlotCount": 3,
    "remainingCount": 2,
    "errors": [
      {
        "code": "ERR_INCOMPLETE_BATCH_SLOTS",
        "message": "Slot 4 is empty. All 5 slots must be populated and valid before submission.",
        "path": "slots[3]",
        "slotNumber": 4,
        "severity": "BLOCKING"
      },
      {
        "code": "ERR_INCOMPLETE_BATCH_SLOTS",
        "message": "Slot 5 contains validation errors. All slots must be valid before submission.",
        "path": "slots[4]",
        "slotNumber": 5,
        "severity": "BLOCKING"
      }
    ],
    "warnings": [],
    "evaluatedAt": "2026-10-18T00:18:00.000Z"
  }
  ```

---

### 7.6 Example 6: Stale-Version / OCC Concurrency Lock Conflict

#### Setup:
- Editor B loads Draft `dft_123` at version 2.
- Editor A concurrently edits and saves Draft `dft_123`, advancing the Firestore server version from 2 to 3.
- Editor B attempts to submit:
  ```json
  {
    "draftId": "dft_123",
    "expectedVersion": 2
  }
  ```

#### Expected Server Response:
- **Response**: **REJECTED** with HTTP 409 Conflict.
- **Error Body**:
  ```json
  {
    "success": false,
    "error": {
      "code": "ERR_OCC_VERSION_MISMATCH",
      "message": "Draft 'dft_123' concurrency conflict: expected version 2, but current server version is 3.",
      "name": "ConcurrencyConflictError"
    }
  }
  ```
- **Client Behavior**: Editor B's local unsaved changes are preserved in browser memory. A conflict resolution modal surfaces to review server changes.

---

### 7.7 Example 7: Unsupported Mode-Specific Fields & Server Response

#### Request Payload:
Client attempts to inject Mode 2 / Mode 3 properties or arbitrary keys into a Mode 1 submission:
```json
{
  "productionMode": "QUESTION_CHALLENGE_SHORT",
  "configuredQuestionCount": 1,
  "introductoryConcept": "This concept overview belongs strictly to Mode 2",
  "unsupportedExtraKey": "Malicious payload injection"
}
```

#### Expected Server Response:
- **Zod Schema Validation Gate**:
  - Unrecognized properties are strictly stripped or rejected based on schema configuration (`.strict()` throws HTTP 400 Bad Request `ZodError`).
  - Mode 1 validator ignores or strips `introductoryConcept` because Mode 1 does not support concept overviews.
- **Error Response**:
  ```json
  {
    "success": false,
    "error": {
      "code": "ERR_UNSUPPORTED_PROPERTY",
      "message": "Unrecognized property 'unsupportedExtraKey' on Mode 1 content package.",
      "name": "ValidationError"
    }
  }
  ```

---

## 8. Existing-Record Compatibility, Migration & API Versioning

### 8.1 Schema Separation: Existing Persisted Fields vs. Proposed Aggregate Fields

The proposed Mode 1 contract strictly distinguishes between verified, currently persisted `QuestionDraft` entity fields and proposed aggregate-only extensions:

| Category | Field Name | Type | Current Runtime Persistence (`QuestionDraft`) | Proposed Aggregate (`Mode1BatchDraftAggregate`) | Architectural Authority |
| :--- | :--- | :--- | :---: | :---: | :--- |
| **Identity & Taxonomy** | `id` | `string` | **Persisted** (`dft_<uuid>` or `BP-DFT-###`) | **Persisted** (Root Aggregate ID) | `shared/types/question.ts` |
| | `topicId`, `subtopicId` | `string` | **Persisted** (`top_<uuid>`, `sub_<uuid>`) | **Persisted** (Root Syllabus Grounding) | `AGENTS.md §5` |
| **Creation Context** | `productionMode` | `string` | **Persisted** (`'QUESTION_CHALLENGE_SHORT'`) | **Persisted** (Mode Discriminator) | `shared/registry/content-mode.registry.ts` |
| | `targetQuestionCount` | `number` | **Persisted** (`1, 5, 10, 15, 20`) | **Projected** into `configuredQuestionCount` | `shared/types/question.ts` |
| | `configuredQuestionCount` | `1 \| 5 \| 10 \| 15 \| 20` | N/A (Field not in runtime schema) | **Proposed** (Canonical property name) | `S9-T03` |
| | `aspectRatio` | `string` | **Persisted** (`'9:16'`) | **Persisted** (Strict vertical) | `shared/registry/content-mode.registry.ts` |
| **Lifecycle & Concurrency** | `version` | `number` | **Persisted** (OCC counter) | **Persisted** (Atomic aggregate version) | `S9-T04` |
| | `workflowStage` | `string` | **Persisted** (`STAGE_01_QUESTION_STUDIO` etc.) | **Persisted** (Package workflow stage) | `07-CANONICAL-15-STEP-WORKFLOW.md` |
| | `status` | `QuestionStatus` | **Persisted** (`DRAFT`, `SUBMITTED_FOR_REVIEW`) | **Persisted** (Package submission status) | `shared/types/question.ts` |
| | `batchStatus` | `enum` | N/A (Field not in runtime schema) | **Proposed** (`EMPTY`, `COMPLETE`, `ACCEPTED`) | `S9-T03` |
| **Question Content** | `questionText` | `string` | **Persisted** (Single root question text) | **Projected** to `slots[0].questionText` | `ADR-009` |
| | `options` | `{ a, b, c, d }` | **Persisted** (Root nested 4 options) | **Projected** to `slots[0].options` | `ADR-009` |
| | `optionA`..`optionD` | `string` | **Persisted** (Derived compatibility aliases) | **Projected** to `slots[0].optionA..D` | `shared/types/question.ts` |
| | `correctAnswer` | `'A'\|'B'\|'C'\|'D'` | **Persisted** (Single answer key) | **Projected** to `slots[0].correctAnswer` | `ADR-009` |
| | `explanation` | `string` | **Persisted** (Single explanation derivation) | **Projected** to `slots[0].explanation` | `S9-T02` |
| | `realWorldContext` | `string` | **Persisted** (Contextual hook) | **Projected** to `slots[0].realWorldContext` | `S9-T02` |
| **Ordered Collection** | `slots` | `Mode1QuestionSlot[]` | N/A (Multi-slot persistence unbuilt) | **Proposed** (Ordered slot array) | `ADR-011 DD-05` |
| | `overflowBuffer` | `Array<...>` | N/A (Overflow quarantine unbuilt) | **Proposed** (Excess candidate tray) | `S9-T03` |

### 8.2 Safe Compatibility & Legacy Hydration Contract (Proposed Gate B Design)

> [!IMPORTANT]
> **Status: Proposed Gate B Architecture — Not Implemented in Current Runtime.**<br>
> The hydration adapter defined below represents a future Gate B design proposal for safely reading existing single-question drafts into the proposed batch aggregate structure. Current production services (`QuestionDraftService`, `question-generation.service.ts`) operate strictly on single-question documents. Zero-data-loss compatibility is not an automatic passive guarantee; it is achieved strictly by adhering to the following deterministic rules.

#### Deterministic Compatibility Invariants:
1. **Never Fabricate Semantic Content (Answer Key, Options, Proofs)**:
   - A missing or invalid answer key must **NEVER** be defaulted to `'A'` or any other choice. Defaulting to `'A'` fabricates an answer key and risks teaching incorrect mathematical concepts.
   - If `correctAnswer` is missing or invalid in a legacy record, it is preserved as `undefined` (or its raw invalid value) and surfaced as an explicit blocking validation error (`ERR_MISSING_ANSWER_KEY`), requiring authenticated human editorial review before submission.
   - Missing question text or options must never be populated with dummy synthetic text.
2. **Type-Safe Option Hydration (Zero Runtime Exceptions)**:
   - Every raw option value (`a`, `b`, `c`, `d`, or `optionA..D`) must be strictly validated as a string (`typeof val === 'string'`) before executing any string operations (`.trim()`, `.toLowerCase()`).
   - If an option is missing or null, it produces an explicit blocking finding (`ERR_OPTION_MISSING`).
   - If an option value is of an invalid type (e.g., number, boolean, array, object), it produces an explicit blocking finding (`ERR_OPTION_INVALID_TYPE`) rather than triggering an unhandled runtime `TypeError`.
   - Option distinctness is evaluated strictly across verified non-empty string choices.
3. **No Indirect Count Inference (No `raw.slots.length` Fallback)**:
   - If `configuredQuestionCount` (or legacy `targetQuestionCount`) is missing or invalid (not strictly in $\{1, 5, 10, 15, 20\}$), `configuredCount` remains `undefined` throughout hydration and validation.
   - The hydration adapter must **NEVER** infer `configuredCount` from `raw.slots.length` or default it to 1.
   - Completion and remaining counts ($C_{\text{rem\_gen}}$) must NOT be calculated against an inferred count; `remainingCount` remains `undefined`.
   - The validation envelope emits a blocking finding (`ERR_INVALID_COUNT`), requiring explicit user or administrative reconciliation.
4. **Never Derive `batchStatus: COMPLETE` or `ACCEPTED` from Hydration**:
   - Hydration is a read-time projection, not a workflow state machine transition or an editorial approval action.
   - Valid persisted `batchStatus` values (`'EMPTY'`, `'GENERATING'`, `'PARTIAL'`, `'COMPLETE'`, `'ACCEPTED'`, `'FAILED'`) are preserved as-is.
   - If `batchStatus` was not persisted in legacy single-question documents, it is preserved as `undefined` in the aggregate and surfaces an advisory warning (`WARN_MISSING_BATCH_STATUS`).
   - Any divergence between persisted status and actual slot validity (e.g., `batchStatus: 'COMPLETE'` when slots are incomplete or invalid, or `batchStatus: 'ACCEPTED'` without editorial review) produces an explicit blocking error (`ERR_BATCH_STATUS_INCONSISTENT`).
5. **Zero Metadata Fabrication During Hydration**:
   - Hydration must NEVER fabricate or default metadata attributes.
   - Author attribution (`authorId`, `authorName`), concurrency counter (`version`), `workflowStage`, `aspectRatio`, `status`, and timestamps (`createdAt`, `updatedAt`) must strictly reflect persisted source values.
   - If absent in the source document, they remain `undefined` (surfacing appropriate blocking findings like `ERR_MISSING_AUTHOR_ID` or advisory warnings like `WARN_MISSING_VERSION`).
   - Defaults applied during write operations are defined separately in Section 8.2.1.
6. **Safe Deterministic Identifier Handling**:
   - `draftId`: Must exist as `raw.id` or the Firestore document key. If missing, the record cannot establish aggregate identity and emits `ERR_MISSING_DRAFT_ID`. Legacy identifiers (`BP-DFT-###`) are read and validated without mutation.
   - `slotId`: If absent in legacy single-question records, the hydration layer does **not** invent synthetic identifiers. The property is left `undefined` (surfacing `WARN_MISSING_SLOT_ID`), and a canonical distributed UUID (`slt_<uuid_v4>`) is generated via `canonicalIdService.generateSlotId()` only when the draft is explicitly edited and persisted.
7. **Multi-Question Legacy Draft Handling (`targetQuestionCount > 1`)**:
   - If a legacy record specified a valid `targetQuestionCount > 1` (e.g. 5, 10, 15, 20), but contains only one root question, it **CANNOT hydrate into one slot while claiming to satisfy the configured count**.
   - The hydration adapter projects the root question into Slot 1, and initializes Slots 2 through $N$ as `'EMPTY'`.
   - The aggregate emits an explicit blocking validation error (`ERR_INCOMPLETE_LEGACY_BATCH`).
8. **Preservation of Unmapped Attributes (Document Passthrough)**:
   - Existing Firestore records contain legacy or mode-specific fields (e.g. `mathematicalVerification`, `tags`, `sourceModel`, `challengeType`, `introductoryConcept`, `syllabusScopeNotes`).
   - To prevent data loss when an aggregate is updated, the hydration layer retains all unmapped Firestore properties in an open document passthrough container (`rawAttributes` or root spread) rather than stripping them upon conversion.

#### Proposed Hydration Function Implementation:

```typescript
export interface HydratedMode1QuestionSlot {
  slotNumber: number;
  slotId?: string; // Undefined if legacy record lacked slotId; never fabricated
  revisionNumber?: number; // Undefined if unpersisted; established upon write
  status: 'EMPTY' | 'GENERATING' | 'VALID' | 'INVALID' | 'MANUALLY_EDITED' | 'ACCEPTED';
  isManuallyEdited?: boolean;
  questionText: string;
  options: {
    a: string;
    b: string;
    c: string;
    d: string;
  };
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctAnswer?: 'A' | 'B' | 'C' | 'D' | string; // Undefined or raw string if legacy record was invalid/missing
  explanation: string;
  trickOrPitfall?: string;
  realWorldContext?: string;
  validationErrors?: string[];
  lastValidatedAt?: string;
}

export interface HydratedMode1BatchAggregate {
  id?: string; // Undefined if record lacked id; never fabricated
  productionMode: 'QUESTION_CHALLENGE_SHORT';
  topicId?: string;
  subtopicId?: string;
  configuredQuestionCount?: 1 | 5 | 10 | 15 | 20; // Undefined if missing or invalid; never inferred from slots.length
  aspectRatio?: string; // Undefined if missing; never defaulted to '9:16'
  batchStatus?: 'EMPTY' | 'GENERATING' | 'PARTIAL' | 'COMPLETE' | 'ACCEPTED' | 'FAILED' | string; // Undefined if missing; never derived
  version?: number; // Undefined if missing; never fabricated as 1
  authorId?: string; // Undefined if missing; never fabricated as empty string
  authorName?: string; // Undefined if missing; never fabricated
  workflowStage?: string; // Undefined if missing; never fabricated
  status?: string; // Undefined if missing; never fabricated
  createdAt?: string; // Undefined if missing; never fabricated
  updatedAt?: string; // Undefined if missing; never fabricated
  slots: HydratedMode1QuestionSlot[];
  [unmappedProperty: string]: unknown; // Retains all unmapped Firestore properties to prevent data loss
}

export interface HydrationResult {
  aggregate: HydratedMode1BatchAggregate;
  findings: Mode1ValidationResultEnvelope;
  requiresReview: boolean;
}

/**
 * Type-safe option extractor and validator.
 * Validates that the raw option value is a string before trimming or comparing.
 * Emits blocking findings rather than throwing unhandled runtime TypeErrors.
 */
function hydrateOptionValue(
  rawVal: unknown,
  choiceKey: 'a' | 'b' | 'c' | 'd',
  slotNum: number,
  slotPath: string,
  errors: ValidationErrorItem[]
): string {
  if (rawVal === undefined || rawVal === null) {
    errors.push({
      code: 'ERR_OPTION_MISSING',
      message: `Slot ${slotNum}: Option '${choiceKey.toUpperCase()}' is missing.`,
      path: `${slotPath}.options.${choiceKey}`,
      slotNumber: slotNum,
      severity: 'BLOCKING',
    });
    return '';
  }

  if (typeof rawVal !== 'string') {
    errors.push({
      code: 'ERR_OPTION_INVALID_TYPE',
      message: `Slot ${slotNum}: Option '${choiceKey.toUpperCase()}' must be a string, but received ${typeof rawVal}.`,
      path: `${slotPath}.options.${choiceKey}`,
      slotNumber: slotNum,
      severity: 'BLOCKING',
    });
    return '';
  }

  const trimmed = rawVal.trim();
  if (trimmed.length === 0) {
    errors.push({
      code: 'ERR_OPTION_MISSING',
      message: `Slot ${slotNum}: Option '${choiceKey.toUpperCase()}' is empty.`,
      path: `${slotPath}.options.${choiceKey}`,
      slotNumber: slotNum,
      severity: 'BLOCKING',
    });
    return '';
  }

  return trimmed;
}

/**
 * Proposed Gate B Legacy Draft Hydration Adapter.
 * NOTE: PROPOSED DESIGN — NOT IMPLEMENTED IN CURRENT RUNTIME.
 * Converts legacy QuestionDraft documents into the Mode 1 batch aggregate structure
 * without fabricating semantic content, metadata, or batch completion status.
 * Enforces strict zero-inference validation on existing multi-slot aggregates.
 */
export function hydrateMode1Draft(raw: Record<string, any>): HydrationResult {
  const errors: ValidationErrorItem[] = [];
  const warnings: ValidationWarningItem[] = [];

  // 1. Identify Draft Aggregate ID (Never fabricate identifier)
  const draftId = typeof raw.id === 'string' && raw.id.trim()
    ? raw.id.trim()
    : (typeof raw.draftId === 'string' && raw.draftId.trim() ? raw.draftId.trim() : undefined);

  if (!draftId) {
    errors.push({
      code: 'ERR_MISSING_DRAFT_ID',
      message: 'Record lacks a valid draft identifier (id).',
      path: 'id',
      severity: 'BLOCKING',
    });
  }

  // 2. Metadata Validation (Preserve persisted values; never fabricate defaults)
  if (!raw.authorId || typeof raw.authorId !== 'string' || raw.authorId.trim() === '') {
    errors.push({
      code: 'ERR_MISSING_AUTHOR_ID',
      message: 'Record lacks an author identifier (authorId).',
      path: 'authorId',
      severity: 'BLOCKING',
    });
  }

  if (raw.version === undefined || raw.version === null || typeof raw.version !== 'number') {
    warnings.push({
      code: 'WARN_MISSING_VERSION',
      message: 'Record lacks persisted version counter; version 1 will be established upon explicit write.',
      path: 'version',
      severity: 'WARNING',
    });
  }

  if (raw.batchStatus === undefined || raw.batchStatus === null) {
    warnings.push({
      code: 'WARN_MISSING_BATCH_STATUS',
      message: 'Record lacks persisted batchStatus; will be established upon explicit write.',
      path: 'batchStatus',
      severity: 'WARNING',
    });
  }

  if (raw.aspectRatio !== undefined && raw.aspectRatio !== '9:16') {
    errors.push({
      code: 'ERR_INVALID_ASPECT_RATIO',
      message: `Mode 'Question Challenge Short' requires aspect ratio '9:16', but received '${raw.aspectRatio}'.`,
      path: 'aspectRatio',
      severity: 'BLOCKING',
    });
  }

  // 3. Existing Multi-Slot Aggregate Path
  if (Array.isArray(raw.slots) && raw.slots.length > 0) {
    // 3a. Validate Supported Configured Question Count (Strictly Do NOT infer from slots.length!)
    let configuredCount: (1 | 5 | 10 | 15 | 20) | undefined = undefined;
    const rawConfiguredCount = raw.configuredQuestionCount ?? raw.targetQuestionCount;

    if (typeof rawConfiguredCount === 'number' && [1, 5, 10, 15, 20].includes(rawConfiguredCount)) {
      configuredCount = rawConfiguredCount as 1 | 5 | 10 | 15 | 20;
    } else {
      errors.push({
        code: 'ERR_INVALID_COUNT',
        message: `Configured question count is missing or invalid (${rawConfiguredCount}). Mode 'Question Challenge Short' requires count in [1, 5, 10, 15, 20]. Cannot infer count from slots array length (${raw.slots.length}); explicit reconciliation required.`,
        path: 'configuredQuestionCount',
        severity: 'BLOCKING',
      });
    }

    // 3b. Validate Exact Slot Count (only if configuredCount is defined)
    if (configuredCount !== undefined && raw.slots.length !== configuredCount) {
      errors.push({
        code: 'ERR_SLOT_COUNT_MISMATCH',
        message: `Configured question count is ${configuredCount}, but slots array contains ${raw.slots.length} element(s). Exact slot count match is required.`,
        path: 'slots',
        severity: 'BLOCKING',
      });
    }

    // 3c. Validate Contiguous Slot Numbers & Unique Slot IDs
    const seenSlotNumbers = new Set<number>();
    const seenSlotIds = new Set<string>();
    let hasDiscontinuousSlots = false;

    for (let i = 0; i < raw.slots.length; i++) {
      const slot = raw.slots[i] || {};
      const expectedSlotNumber = i + 1;

      if (typeof slot.slotNumber !== 'number' || slot.slotNumber !== expectedSlotNumber || seenSlotNumbers.has(slot.slotNumber)) {
        hasDiscontinuousSlots = true;
      }
      if (typeof slot.slotNumber === 'number') {
        seenSlotNumbers.add(slot.slotNumber);
      }

      if (!slot.slotId || typeof slot.slotId !== 'string' || slot.slotId.trim() === '') {
        errors.push({
          code: 'ERR_MISSING_SLOT_ID',
          message: `Slot ${slot.slotNumber ?? expectedSlotNumber} lacks a canonical slotId.`,
          path: `slots[${i}].slotId`,
          slotNumber: slot.slotNumber ?? expectedSlotNumber,
          severity: 'BLOCKING',
        });
      } else if (seenSlotIds.has(slot.slotId)) {
        errors.push({
          code: 'ERR_DUPLICATE_SLOT_ID',
          message: `Duplicate slotId '${slot.slotId}' found in slot ${slot.slotNumber ?? expectedSlotNumber}. Every slot must possess a distinct identifier.`,
          path: `slots[${i}].slotId`,
          slotNumber: slot.slotNumber ?? expectedSlotNumber,
          severity: 'BLOCKING',
        });
      } else {
        seenSlotIds.add(slot.slotId);
      }
    }

    if (hasDiscontinuousSlots) {
      errors.push({
        code: 'ERR_DISCONTINUOUS_SLOTS',
        message: 'Slot numbers must form a strictly contiguous 1-based sequence (1 to N) with zero gaps and zero duplicates.',
        path: 'slots',
        severity: 'BLOCKING',
      });
    }

    // 3d. Validate Question Fields, Type-Safe Options, Answer Key & Explanation
    const hydratedSlots: HydratedMode1QuestionSlot[] = [];

    for (let i = 0; i < raw.slots.length; i++) {
      const slot = raw.slots[i] || {};
      const slotNum = slot.slotNumber ?? i + 1;
      const slotErrors: ValidationErrorItem[] = [];

      // Empty slots omit question payload during drafting
      if (slot.status === 'EMPTY') {
        hydratedSlots.push({
          slotNumber: slotNum,
          slotId: typeof slot.slotId === 'string' && slot.slotId.trim() ? slot.slotId.trim() : undefined,
          revisionNumber: typeof slot.revisionNumber === 'number' ? slot.revisionNumber : undefined,
          status: 'EMPTY',
          isManuallyEdited: Boolean(slot.isManuallyEdited),
          questionText: '',
          options: { a: '', b: '', c: '', d: '' },
          explanation: '',
        });
        continue;
      }

      // Question Text
      let qText = '';
      if (typeof slot.questionText === 'string') {
        qText = slot.questionText.trim();
      } else if (typeof slot.question === 'string') {
        qText = slot.question.trim();
      } else if (slot.questionText !== undefined) {
        slotErrors.push({
          code: 'ERR_EMPTY_PROMPT',
          message: `Slot ${slotNum}: Question text must be a string.`,
          path: `slots[${i}].questionText`,
          slotNumber: slotNum,
          severity: 'BLOCKING',
        });
      }

      if (!qText || qText.length < 5) {
        slotErrors.push({
          code: 'ERR_EMPTY_PROMPT',
          message: `Slot ${slotNum}: Question text is missing or less than 5 characters.`,
          path: `slots[${i}].questionText`,
          slotNumber: slotNum,
          severity: 'BLOCKING',
        });
      }

      // Type-Safe Options & Distinctness
      const sOpts = (typeof slot.options === 'object' && slot.options !== null) ? slot.options : {};
      const optA = hydrateOptionValue(sOpts.a ?? slot.optionA, 'a', slotNum, `slots[${i}]`, slotErrors);
      const optB = hydrateOptionValue(sOpts.b ?? slot.optionB, 'b', slotNum, `slots[${i}]`, slotErrors);
      const optC = hydrateOptionValue(sOpts.c ?? slot.optionC, 'c', slotNum, `slots[${i}]`, slotErrors);
      const optD = hydrateOptionValue(sOpts.d ?? slot.optionD, 'd', slotNum, `slots[${i}]`, slotErrors);

      const options = { a: optA, b: optB, c: optC, d: optD };

      if (optA && optB && optC && optD) {
        const optValues = [optA, optB, optC, optD].map((v) => v.toLowerCase());
        if (new Set(optValues).size < 4) {
          slotErrors.push({
            code: 'ERR_OPTION_DUPLICATE',
            message: `Slot ${slotNum}: Options must be pairwise distinct.`,
            path: `slots[${i}].options`,
            slotNumber: slotNum,
            severity: 'BLOCKING',
          });
        }
      }

      // Answer Key (Never fabricated!)
      let correctAnswer: 'A' | 'B' | 'C' | 'D' | string | undefined = undefined;
      if (typeof slot.correctAnswer === 'string') {
        const normalizedAnswer = slot.correctAnswer.trim().toUpperCase();
        if (['A', 'B', 'C', 'D'].includes(normalizedAnswer)) {
          correctAnswer = normalizedAnswer as 'A' | 'B' | 'C' | 'D';
        } else {
          correctAnswer = slot.correctAnswer;
          slotErrors.push({
            code: 'ERR_INVALID_ANSWER_KEY',
            message: `Slot ${slotNum}: Invalid answer key '${slot.correctAnswer}'. Must strictly be A, B, C, or D.`,
            path: `slots[${i}].correctAnswer`,
            slotNumber: slotNum,
            severity: 'BLOCKING',
          });
        }
      } else {
        slotErrors.push({
          code: 'ERR_MISSING_ANSWER_KEY',
          message: `Slot ${slotNum}: Missing answer key. An answer key must not be fabricated and requires human assignment.`,
          path: `slots[${i}].correctAnswer`,
          slotNumber: slotNum,
          severity: 'BLOCKING',
        });
      }

      // Explanation
      let expl = '';
      if (typeof slot.explanation === 'string') {
        expl = slot.explanation.trim();
      }
      if (!expl || expl.length < 5) {
        slotErrors.push({
          code: 'ERR_MISSING_EXPLANATION',
          message: `Slot ${slotNum}: Explanation derivation must be at least 5 characters.`,
          path: `slots[${i}].explanation`,
          slotNumber: slotNum,
          severity: 'BLOCKING',
        });
      }

      // Status consistency check
      let resolvedSlotStatus: HydratedMode1QuestionSlot['status'] = slot.status ?? 'INVALID';
      if (slotErrors.length > 0 && (resolvedSlotStatus === 'VALID' || resolvedSlotStatus === 'ACCEPTED')) {
        errors.push({
          code: 'ERR_SLOT_STATUS_INCONSISTENT',
          message: `Slot ${slotNum} is marked '${resolvedSlotStatus}' but contains blocking validation errors.`,
          path: `slots[${i}].status`,
          slotNumber: slotNum,
          severity: 'BLOCKING',
        });
        resolvedSlotStatus = 'INVALID';
      }

      errors.push(...slotErrors);

      hydratedSlots.push({
        slotNumber: slotNum,
        slotId: typeof slot.slotId === 'string' && slot.slotId.trim() ? slot.slotId.trim() : undefined,
        revisionNumber: typeof slot.revisionNumber === 'number' ? slot.revisionNumber : undefined,
        status: resolvedSlotStatus,
        isManuallyEdited: Boolean(slot.isManuallyEdited),
        questionText: qText,
        options,
        optionA: options.a || undefined,
        optionB: options.b || undefined,
        optionC: options.c || undefined,
        optionD: options.d || undefined,
        correctAnswer,
        explanation: expl,
        trickOrPitfall: typeof slot.trickOrPitfall === 'string' ? slot.trickOrPitfall : undefined,
        realWorldContext: typeof slot.realWorldContext === 'string' ? slot.realWorldContext : (typeof slot.realLifeContext === 'string' ? slot.realLifeContext : undefined),
        validationErrors: slotErrors.map((e) => e.message),
        lastValidatedAt: new Date().toISOString(),
      });
    }

    // 3e. Lifecycle Invariants & Status Consistency (NO indirect count inference)
    const validSlotCount = hydratedSlots.filter(
      (s) => (s.status === 'VALID' || s.status === 'ACCEPTED' || s.status === 'MANUALLY_EDITED') &&
             (!s.validationErrors || s.validationErrors.length === 0)
    ).length;

    let remainingCount: number | undefined = undefined;
    if (configuredCount !== undefined) {
      remainingCount = Math.max(0, configuredCount - validSlotCount);
    }

    const acceptedSlotCount = hydratedSlots.filter((s) => s.status === 'ACCEPTED').length;

    // Report batch status inconsistency against persisted status
    if (raw.batchStatus === 'COMPLETE') {
      if (configuredCount === undefined || remainingCount === undefined || remainingCount > 0) {
        errors.push({
          code: 'ERR_BATCH_STATUS_INCONSISTENT',
          message: `Batch status is marked 'COMPLETE', but ${remainingCount ?? 'unresolved'} slot(s) remain incomplete or invalid.`,
          path: 'batchStatus',
          severity: 'BLOCKING',
        });
      }
    }

    if (raw.batchStatus === 'ACCEPTED') {
      if (configuredCount === undefined || acceptedSlotCount < configuredCount) {
        errors.push({
          code: 'ERR_BATCH_STATUS_INCONSISTENT',
          message: `Batch status is marked 'ACCEPTED', but only ${acceptedSlotCount} of ${configuredCount ?? 'unresolved'} slots have attained editorial acceptance.`,
          path: 'batchStatus',
          severity: 'BLOCKING',
        });
      }
    }

    // Zero metadata fabrication: preserve source values exactly
    const aggregate: HydratedMode1BatchAggregate = {
      ...raw, // Retain all unmapped legacy attributes to prevent data loss
      id: draftId,
      productionMode: 'QUESTION_CHALLENGE_SHORT',
      topicId: typeof raw.topicId === 'string' ? raw.topicId : undefined,
      subtopicId: typeof raw.subtopicId === 'string' ? raw.subtopicId : undefined,
      configuredQuestionCount: configuredCount,
      aspectRatio: typeof raw.aspectRatio === 'string' ? raw.aspectRatio : undefined,
      batchStatus: typeof raw.batchStatus === 'string' ? raw.batchStatus : undefined,
      version: typeof raw.version === 'number' ? raw.version : undefined,
      authorId: typeof raw.authorId === 'string' && raw.authorId.trim() ? raw.authorId.trim() : undefined,
      authorName: typeof raw.authorName === 'string' && raw.authorName.trim() ? raw.authorName.trim() : undefined,
      workflowStage: typeof raw.workflowStage === 'string' ? raw.workflowStage : undefined,
      status: typeof raw.status === 'string' ? raw.status : undefined,
      createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : undefined,
      updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : undefined,
      slots: hydratedSlots,
    };

    const findings: Mode1ValidationResultEnvelope = {
      isValid: errors.length === 0,
      configuredCount,
      validSlotCount,
      remainingCount,
      errors,
      warnings,
      evaluatedAt: new Date().toISOString(),
    };

    return {
      aggregate,
      findings,
      requiresReview: !findings.isValid || warnings.length > 0,
    };
  }

  // 4. Legacy Single-Question Draft Path
  // 4a. Resolve Configured Question Count (Strictly Do NOT default or infer)
  const rawTargetCount = raw.configuredQuestionCount ?? raw.targetQuestionCount;
  let configuredCount: (1 | 5 | 10 | 15 | 20) | undefined = undefined;

  if (typeof rawTargetCount === 'number' && [1, 5, 10, 15, 20].includes(rawTargetCount)) {
    configuredCount = rawTargetCount as 1 | 5 | 10 | 15 | 20;
  } else {
    errors.push({
      code: 'ERR_INVALID_COUNT',
      message: `Configured question count is missing or invalid (${rawTargetCount}). Mode 'Question Challenge Short' requires count in [1, 5, 10, 15, 20]. Cannot infer count; explicit reconciliation required.`,
      path: 'configuredQuestionCount',
      severity: 'BLOCKING',
    });
  }

  // 4b. Hydrate Slot 1 from Root Question Fields (Type-safe options & zero semantic fabrication)
  const slot1Errors: ValidationErrorItem[] = [];

  let questionText = '';
  if (typeof raw.questionText === 'string') {
    questionText = raw.questionText.trim();
  } else if (typeof raw.question === 'string') {
    questionText = raw.question.trim();
  } else if (raw.questionText !== undefined) {
    slot1Errors.push({
      code: 'ERR_EMPTY_PROMPT',
      message: 'Question text must be a string.',
      path: 'slots[0].questionText',
      slotNumber: 1,
      severity: 'BLOCKING',
    });
  }

  if (!questionText || questionText.length < 5) {
    slot1Errors.push({
      code: 'ERR_EMPTY_PROMPT',
      message: 'Question text is missing or less than 5 characters.',
      path: 'slots[0].questionText',
      slotNumber: 1,
      severity: 'BLOCKING',
    });
  }

  // Type-Safe Options Extraction
  const rawOpts = (typeof raw.options === 'object' && raw.options !== null) ? raw.options : {};
  const optA = hydrateOptionValue(rawOpts.a ?? raw.optionA, 'a', 1, 'slots[0]', slot1Errors);
  const optB = hydrateOptionValue(rawOpts.b ?? raw.optionB, 'b', 1, 'slots[0]', slot1Errors);
  const optC = hydrateOptionValue(rawOpts.c ?? raw.optionC, 'c', 1, 'slots[0]', slot1Errors);
  const optD = hydrateOptionValue(rawOpts.d ?? raw.optionD, 'd', 1, 'slots[0]', slot1Errors);

  const options = { a: optA, b: optB, c: optC, d: optD };

  if (optA && optB && optC && optD) {
    const optValues = [optA, optB, optC, optD].map((v) => v.toLowerCase());
    if (new Set(optValues).size < 4) {
      slot1Errors.push({
        code: 'ERR_OPTION_DUPLICATE',
        message: 'Options must be pairwise distinct.',
        path: 'slots[0].options',
        slotNumber: 1,
        severity: 'BLOCKING',
      });
    }
  }

  // Answer Key: NEVER fabricate default 'A'!
  let correctAnswer: 'A' | 'B' | 'C' | 'D' | string | undefined = undefined;
  if (typeof raw.correctAnswer === 'string') {
    const normalizedAnswer = raw.correctAnswer.trim().toUpperCase();
    if (['A', 'B', 'C', 'D'].includes(normalizedAnswer)) {
      correctAnswer = normalizedAnswer as 'A' | 'B' | 'C' | 'D';
    } else {
      correctAnswer = raw.correctAnswer;
      slot1Errors.push({
        code: 'ERR_INVALID_ANSWER_KEY',
        message: `Legacy record contains invalid answer key '${raw.correctAnswer}'. Must strictly be A, B, C, or D.`,
        path: 'slots[0].correctAnswer',
        slotNumber: 1,
        severity: 'BLOCKING',
      });
    }
  } else {
    slot1Errors.push({
      code: 'ERR_MISSING_ANSWER_KEY',
      message: 'Legacy record has no answer key. An answer key must not be fabricated and requires human assignment.',
      path: 'slots[0].correctAnswer',
      slotNumber: 1,
      severity: 'BLOCKING',
    });
  }

  // Explanation
  let explanation = '';
  if (typeof raw.explanation === 'string') {
    explanation = raw.explanation.trim();
  }
  if (!explanation || explanation.length < 5) {
    slot1Errors.push({
      code: 'ERR_MISSING_EXPLANATION',
      message: 'Explanation derivation is missing or less than 5 characters.',
      path: 'slots[0].explanation',
      slotNumber: 1,
      severity: 'BLOCKING',
    });
  }

  // Slot Identity: Do not fabricate synthetic fallback strings
  const slotId = typeof raw.slotId === 'string' && raw.slotId.trim() ? raw.slotId.trim() : undefined;
  if (!slotId) {
    warnings.push({
      code: 'WARN_MISSING_SLOT_ID',
      message: 'Legacy single-question record lacks a slotId; a canonical UUID (slt_<uuid>) will be generated upon save.',
      path: 'slots[0].slotId',
      slotNumber: 1,
      severity: 'WARNING',
    });
  }

  const slot1Status: HydratedMode1QuestionSlot['status'] = slot1Errors.length > 0
    ? 'INVALID'
    : (questionText ? 'VALID' : 'EMPTY');

  errors.push(...slot1Errors);

  const slot1: HydratedMode1QuestionSlot = {
    slotNumber: 1,
    slotId,
    revisionNumber: typeof raw.revisionNumber === 'number' ? raw.revisionNumber : undefined,
    status: slot1Status,
    isManuallyEdited: Boolean(raw.isManuallyEdited ?? true),
    questionText,
    options,
    optionA: options.a || undefined,
    optionB: options.b || undefined,
    optionC: options.c || undefined,
    optionD: options.d || undefined,
    correctAnswer,
    explanation,
    trickOrPitfall: typeof raw.trickOrPitfall === 'string' ? raw.trickOrPitfall : undefined,
    realWorldContext: typeof raw.realWorldContext === 'string' ? raw.realWorldContext : (typeof raw.realLifeContext === 'string' ? raw.realLifeContext : undefined),
    validationErrors: slot1Errors.map((e) => e.message),
    lastValidatedAt: new Date().toISOString(),
  };

  // 4c. Construct Slots Array & Incomplete Batch Check for N > 1
  const slots: HydratedMode1QuestionSlot[] = [slot1];

  if (configuredCount !== undefined && configuredCount > 1) {
    for (let k = 2; k <= configuredCount; k++) {
      slots.push({
        slotNumber: k,
        slotId: undefined,
        revisionNumber: undefined,
        status: 'EMPTY',
        isManuallyEdited: false,
        questionText: '',
        options: { a: '', b: '', c: '', d: '' },
        correctAnswer: undefined,
        explanation: '',
      });
    }

    errors.push({
      code: 'ERR_INCOMPLETE_LEGACY_BATCH',
      message: `Legacy record specifies configured question count: ${configuredCount}, but contains only 1 question at root. Remaining ${configuredCount - 1} slots are empty and must be generated or authored.`,
      path: 'slots',
      severity: 'BLOCKING',
    });
  }

  // 4d. Completion & Inconsistency Checks (Never derive COMPLETE or ACCEPTED)
  const validSlotCount = slots.filter(
    (s) => (s.status === 'VALID' || s.status === 'ACCEPTED') &&
           (!s.validationErrors || s.validationErrors.length === 0)
  ).length;

  let remainingCount: number | undefined = undefined;
  if (configuredCount !== undefined) {
    remainingCount = Math.max(0, configuredCount - validSlotCount);
  }

  if (raw.batchStatus === 'COMPLETE') {
    if (configuredCount === undefined || remainingCount === undefined || remainingCount > 0) {
      errors.push({
        code: 'ERR_BATCH_STATUS_INCONSISTENT',
        message: `Batch status is marked 'COMPLETE', but ${remainingCount ?? 'unresolved'} slot(s) remain incomplete or invalid.`,
        path: 'batchStatus',
        severity: 'BLOCKING',
      });
    }
  }

  if (raw.batchStatus === 'ACCEPTED') {
    if (configuredCount === undefined || validSlotCount < configuredCount) {
      errors.push({
        code: 'ERR_BATCH_STATUS_INCONSISTENT',
        message: "Batch status is marked 'ACCEPTED', but slots have not attained editorial acceptance.",
        path: 'batchStatus',
        severity: 'BLOCKING',
      });
    }
  }

  // Zero metadata fabrication
  const aggregate: HydratedMode1BatchAggregate = {
    ...raw,
    id: draftId,
    productionMode: 'QUESTION_CHALLENGE_SHORT',
    topicId: typeof raw.topicId === 'string' ? raw.topicId : undefined,
    subtopicId: typeof raw.subtopicId === 'string' ? raw.subtopicId : undefined,
    configuredQuestionCount: configuredCount,
    aspectRatio: typeof raw.aspectRatio === 'string' ? raw.aspectRatio : undefined,
    batchStatus: typeof raw.batchStatus === 'string' ? raw.batchStatus : undefined,
    version: typeof raw.version === 'number' ? raw.version : undefined,
    authorId: typeof raw.authorId === 'string' && raw.authorId.trim() ? raw.authorId.trim() : undefined,
    authorName: typeof raw.authorName === 'string' && raw.authorName.trim() ? raw.authorName.trim() : undefined,
    workflowStage: typeof raw.workflowStage === 'string' ? raw.workflowStage : undefined,
    status: typeof raw.status === 'string' ? raw.status : undefined,
    createdAt: typeof raw.createdAt === 'string' ? raw.createdAt : undefined,
    updatedAt: typeof raw.updatedAt === 'string' ? raw.updatedAt : undefined,
    slots,
  };

  const findings: Mode1ValidationResultEnvelope = {
    isValid: errors.length === 0,
    configuredCount,
    validSlotCount,
    remainingCount,
    errors,
    warnings,
    evaluatedAt: new Date().toISOString(),
  };

  return {
    aggregate,
    findings,
    requiresReview: !findings.isValid || warnings.length > 0,
  };
}

### 8.2.1 Write-Time Defaults Contract (Explicit Save / Create Operations)

To maintain absolute separation between read hydration (non-destructive projection) and explicit mutations, the following defaults are governed strictly by write-path domain services (`QuestionDraftService.saveDraft`, `POST /api/v1/question-drafts`) and are **never** applied by the hydration layer:

1. **Identity & Concurrency Initialization**:
   - When a draft is newly created, the backend assigns a canonical distributed UUID (`dft_<uuid>`) via `canonicalIdService.generateDraftId()`.
   - Initial write establishes `version = 1`. Subsequent mutations require Optimistic Concurrency Control (`expectedVersion === draft.version`) and increment version by 1 atomically.
2. **Authenticated Session Attribution**:
   - The creating or updating user's identity is extracted from verified session credentials (`req.user.id`, `req.user.name`).
   - `authorId` and `authorName` are populated by the server write handler; client requests cannot write unauthenticated or blank author records.
3. **Mode-Specific Configuration Defaults**:
   - If `aspectRatio` is unspecified upon initial Mode 1 draft creation, the write handler assigns `'9:16'`.
   - `configuredQuestionCount` must be explicitly chosen from $\{1, 5, 10, 15, 20\}$; write requests with missing or invalid counts are rejected with HTTP 400 (`ERR_INVALID_COUNT`).
4. **Server Timestamping**:
   - `createdAt` is stamped using Cloud Firestore `FieldValue.serverTimestamp()` upon document insertion.
   - `updatedAt` is updated to `FieldValue.serverTimestamp()` on every write transaction.
5. **Batch Lifecycle Status Progression**:
   - A newly created, unpopulated draft is persisted with `workflowStage = 'STAGE_01_QUESTION_STUDIO'`, `status = 'DRAFT'`, and `batchStatus = 'EMPTY'`.
   - As generation completes and all $N$ slots achieve validity, batch generation services advance `batchStatus` to `'COMPLETE'`.
   - Advancing `batchStatus` to `'ACCEPTED'` strictly requires explicit human editorial approval of all $N$ slots ($C_{\text{rem\_accept}} == 0$).
   - Progression to `STAGE_02_VERIFICATION` (`status = 'SUBMITTED_FOR_REVIEW'`) is gated by explicit user action ("Submit for Verification") and cannot be triggered during read projection or intermediate draft saves.

### 8.3 Zero Database Migrations
- **No Batch Rewrites**: No batch database migration script is executed or required against Firestore collections.
- **Lazy Non-Destructive Reading**: Existing documents are lazily projected in memory upon retrieval.
- **Legacy Identifier Interoperability**: Both canonical distributed UUIDs (`dft_<uuid>`, `qst_<uuid>`, `slt_<uuid>`) and legacy identifiers (`BP-DFT-###`, `BP-Q-###`) remain fully supported by `canonicalIdService.validateCanonicalId`.

### 8.4 API Versioning Strategy
- **Universal API Envelope**: Existing routes utilize `ApiResponseEnvelope<T>` from `shared/contracts/api.ts`.
- **Additive Evolution**: Proposed extensions (`slots`, `batchStatus`, `configuredQuestionCount`) are additive optional fields on responses, maintaining full compatibility with existing frontend callers. No breaking URL prefix (e.g. `/api/v2`) is required.

---

## 9. Persistence & Transaction Boundaries

### 9.1 Sole Datastore Authority: Cloud Firestore
Cloud Firestore is the sole authoritative transactional datastore for BP-CMS ([AGENTS.md §3](../../../AGENTS.md#3-cloud-firestore-authority)). Google Sheets is strictly decommissioned from runtime persistence ([AGENTS.md §4](../../../AGENTS.md#4-google-sheets-decommissioning-rule)).

### 9.2 Transactional Lifecycle Stages

```text
  ┌────────────────────────────────────────────────────────────────────────────────────────┐
  │                            PERSISTENCE & TRANSACTION BOUNDARIES                        │
  └────────────────────────────────────────────────────────────────────────────────────────┘

  [1. SAVE WORKING DRAFT]
  Actor: Question Author / Editor
  Operation: Atomic Firestore set/update on question_drafts/{draftId}
  Boundary: Increments version, sets updatedAt. Does NOT touch questions or workflow tables.
  Stage: Remains in Stage 01.

                          │
                          │ (User explicitly clicks "Submit for Verification")
                          ▼

  [2. SUBMIT FOR VERIFICATION]
  Actor: Question Author / Editor
  Operation: Firestore Transaction on question_drafts/{draftId}
  Checks:
    - Pre-condition: C_rem_gen == 0 && C_rem_accept == 0 && all slots VALID/EDITED.
    - OCC Check: expectedVersion === draft.version.
    - RBAC Check: Actor possesses QUESTION:SUBMIT.
  Mutations:
    - Sets workflowStage = 'STAGE_02_VERIFICATION'.
    - Sets status = 'SUBMITTED_FOR_REVIEW'.
    - Increments version.
    - Appends AuditEvent to audit_logs ('QUESTION_DRAFT_SUBMITTED').
  Stage: Transitions to Stage 02.

                          │
                          │ (Independent QA Reviewer audits 10-point checklist)
                          ▼

  [3. APPROVE & MATERIALIZE PRODUCTION QUESTION]
  Actor: Independent QA Reviewer (authorId != reviewerId — GAR-02 Enforced)
  Operation: Firestore Atomic Batch / Transaction across 2 collections:
    1. Write to questions/{questionId} (permanent production entity).
    2. Update question_drafts/{draftId} (status: 'APPROVED', isTerminal: true).
    3. Append AuditEvent to audit_logs ('QUESTION_DRAFT_APPROVED').
  Stage: Advances WorkflowInstance to Stage 03 (Audience Script).
```

---

## 10. Acceptance Criteria, Unresolved Decisions & Explicit Non-Goals

### 10.1 Deterministic Acceptance Criteria Matrix

| ID | Category | Requirement / Criterion | Enforcement Mechanism |
| :---: | :--- | :--- | :--- |
| **AC-01** | **Discrete Counts** | System accepts strictly $N \in \{1, 5, 10, 15, 20\}$; rejects any other count with HTTP 400. | `contentModeRegistry.validateConfig` |
| **AC-02** | **Vertical Aspect Ratio** | System requires strictly `'9:16'` aspect ratio for Mode 1; rejects `'16:9'` with HTTP 400. | `contentModeRegistry.validateConfig` |
| **AC-03** | **MCQ Structure** | Every question slot must contain 4 distinct choices (`a, b, c, d`); missing or duplicate options reject submission with HTTP 422. | `validateCandidate` / `validateMode1Draft` |
| **AC-04** | **Answer Key** | Answer key must strictly be one of `'A'`, `'B'`, `'C'`, or `'D'`; invalid keys reject submission with HTTP 422. | `validateCandidate` |
| **AC-05** | **Proof Derivation** | Explanation must be non-empty with $\ge 5$ characters containing derivation; fails with HTTP 422. | `submitForVerification` |
| **AC-06** | **Batch Completeness** | Submitting a batch for verification requires $C_{\text{rem\_gen}} == 0 \land C_{\text{rem\_accept}} == 0$; partial batch rejected with HTTP 422. | `submitForVerification` |
| **AC-07** | **Save Draft Invariant**| Saving draft succeeds with intermediate/invalid content; never triggers Stage 02 verification. | `saveDraft` |
| **AC-08** | **OCC Concurrency** | Mismatched `expectedVersion` rejects write with HTTP 409 `ConcurrencyConflictError`; local changes preserved. | Firestore repository OCC adapter |
| **AC-09** | **GAR-02 Invariant** | Reviewer matching draft author is strictly rejected with HTTP 403 `NEG-01` with zero administrator bypass. | `approveDraft` |
| **AC-10** | **Legacy Record Compatibility** | Reading legacy single-question drafts projects root fields into Slot 1 without fabricating semantic content (no fabricated answer keys or slot IDs). Records with `targetQuestionCount > 1` are flagged as incomplete batches (`PARTIAL`) and require human review. | `hydrateMode1Draft` (Proposed Gate B Adapter) |

### 10.2 Open Architectural Decisions (Gate B Transition)

| Decision ID | Summary of Open Question | Current Baseline / Recommendation | Impact Area |
| :---: | :--- | :--- | :--- |
| **OD-02** | **Batch Execution Runner Engine** | Implementation of multi-slot batch prompt builder and streaming AI candidate dispatcher. | Backend Domain Services |
| **DEC-A-01**| **Atomic Aggregate Slot Schema** | Formal adoption of `Mode1BatchDraftAggregate` in `question_drafts` per ADR-011 DD-05. | Shared Contracts & Firestore Repositories |
| **DEC-A-02**| **Semantic Duplicate Threshold** | Confirming Levenshtein $> 0.85$ as an advisory warning threshold vs. exact matching only. | Quality Linter |
| **DEC-A-05**| **Downstream Fan-Out Architecture**| Mapping 1 approved batch draft into $N$ individual short scripts in Stage 03. | Studio Production (Stage 03) |

### 10.3 Explicit Non-Goals
1. **No Runtime Code Implementation**: This deliverable is a contract specification; it does not implement Express routes, React components, or AI prompts.
2. **No Database Migration**: Does not run batch migration scripts across Firestore collections.
3. **No Modification to Other Modes**: Does not alter Mode 2 (`TOPIC_INTRODUCTION`) or Mode 3 (`EXPLAINED_QUESTIONS_VIDEO`) contracts.
4. **No Direct Google Sheets Access**: Reaffirms total decommissioning of Google Sheets from runtime execution.

---

## 11. Specification Verdict & Next Action

- **Specification Status**: **`ACCEPTED AS AUTHORITATIVE CONTENT CONTRACT SPECIFICATION — GATE B BASELINE ESTABLISHED`**
- **Evidence-Based Verdict**:
  - Fully defines aggregate metadata, ordered slot identity, quality rules, and cross-model mappings.
  - Formulates typed server-side validation results with stable error codes and 7 concrete payload examples.
  - Establishes safe, non-fabricating backward compatibility for existing single-question drafts, preventing incomplete legacy batches from claiming completion and requiring human review for inconsistent records.
  - Aligns with ADR-002, ADR-009, ADR-010, ADR-011 (DD-05), and canonical Firestore persistence.
  - Strictly preserves GAR-02 anti-self-approval invariant with zero administrator bypass.
- **Single Next Action**: Deliverable established for Task `S9-T05`. **Do NOT start Task `S9-T06`**.
