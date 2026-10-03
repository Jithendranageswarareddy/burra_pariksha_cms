# FEATURE CONTRACT: FC-008-AUDIENCE-SCRIPTING-VERSIONING

## 1. Feature Identity
- **Feature ID**: FC-008
- **Feature Name**: Audience Scripting & Versioning
- **Business Area**: Content Production / Scriptwriting
- **Contract Version**: 1.0.0
- **Status**: APPROVED
- **Priority**: P1 (Core Manufacturing)
- **Owner / Domain**: Script Domain Context
- **Related Workflow Stage(s)**: Step 03 (Audience Script)

---

## 2. Requirement
- **Business Requirement**: BR-003 (Audience-Engaging Script Adaptation) & NFR-002 (Immutable Version Tracking).
- **User Problem**: Educational questions copied directly to video result in dry, unengaging teleprompter reads that fail YouTube Shorts and Reels retention metrics.
- **Business Purpose**: Provide specialized authoring tools to translate verified questions into high-retention video scripts structured into Hook, Body, and Call to Action (CTA), complete with pacing calculators and version control.
- **Expected Capability**:
  - Script creation linked to an approved Question ID (`questionId`).
  - Structured sections: Hook (0–3s), Core Content / Question Breakdown, Explanation & Concept, Call-to-Action (CTA).
  - Real-time teleprompter timing calculator estimating duration based on Telugu/English spoken words per minute (WPM).
  - Version snapshotting into `script_versions` upon save.
  - Scripts Hub UI (`/scripts`, `/scripts/new`, `/scripts/:id`).
- **Scope**: Script CRUD, timing estimation, version snapshotting, authoring UI.
- **Explicit Non-Scope**: Teleprompter display playback (FC-009), raw video upload (FC-010).

---

## 3. Business Acceptance
- **Happy-Path Acceptance**:
  - Scriptwriter selects verified question, drafts script sections, observes real-time duration estimate (target 45–55 seconds), and submits. Script stored with `version = 1`.
  - Updating a script increments `version` and writes an immutable snapshot to `script_versions`.
- **Validation Acceptance**:
  - Script without an approved `questionId` is rejected with HTTP 422 `QUESTION_NOT_VERIFIED`.
  - Script exceeding 90 seconds estimated reading time displays a visual warning.
- **Authorization Acceptance**:
  - User without `SCRIPT_CREATE` or `SCRIPT_UPDATE` capability receives HTTP 403 `FORBIDDEN`.
- **Concurrency Acceptance**:
  - Stale version updates return HTTP 409 `CONCURRENCY_CONFLICT`.
- **Audit Acceptance**:
  - `SCRIPT_CREATED` and `SCRIPT_UPDATED` events dispatched with `scriptId`, `questionId`, and `version`.

---

## 4. Domain Entities
- **Entities Involved**: `Script`, `ScriptVersion`, `ScriptSection`, `PacingMetric`.
- **Entity Ownership**: Scriptwriting Bounded Context.
- **Relationships**: A `Script` is linked to exactly one `Question`. One `Script` has one or more `ScriptVersion` records.
- **Versions**: Schema v1.0.
- **Immutable Fields**: `id`, `questionId`, `authorId`, `createdAt`.
- **Mutable Fields**: `hookText`, `bodyText`, `ctaText`, `estimatedDurationSeconds`, `targetWpm`, `notes`.
- **Lifecycle**: `DRAFT` $\to$ `READY_FOR_FILMING` $\to$ `FILMED`.

---

## 5. Database / Data Contract
- **Collections Involved**: `scripts`, `script_versions`.
- **Document Structure**:
  ```typescript
  export interface ScriptDocument extends BaseEntity {
    id: string; // scr_ + UUIDv4
    questionId: string;
    authorId: string;
    hookTextTelugu: string;
    hookTextEnglish: string;
    bodyTextTelugu: string;
    bodyTextEnglish: string;
    ctaTextTelugu: string;
    ctaTextEnglish: string;
    estimatedDurationSeconds: number;
    wordCount: number;
    workflowId: string;
  }
  ```
- **Indexes**: Composite index on `(questionId, createdAt DESC)` and `(authorId, createdAt DESC)`.
- **Source of Truth**: Firestore `scripts` collection.

---

## 6. API Contract
### 6.1 `POST /api/v1/scripts`
- **Authentication**: Required.
- **Required Capability**: `SCRIPT_CREATE`.
- **Request Schema**: `ScriptCreateSchema` (Zod).
- **Business Rule**: Asserts `question.contentStatus === 'VERIFIED'`.
- **Response Schema**: `ApiResponseEnvelope<{ script: ScriptDocument }>`.

### 6.2 `GET /api/v1/scripts/:id`
- **Authentication**: Required.
- **Required Capability**: `SCRIPT_VIEW`.
- **Response Schema**: `ApiResponseEnvelope<{ script: ScriptDocument }>`.

### 6.3 `PUT /api/v1/scripts/:id`
- **Authentication**: Required.
- **Required Capability**: `SCRIPT_UPDATE`.
- **Request Schema**: `ScriptUpdateSchema` (with `expectedVersion`).
- **Response Schema**: `ApiResponseEnvelope<{ script: ScriptDocument }>`.

### 6.4 `GET /api/v1/scripts/:id/versions`
- **Authentication**: Required.
- **Required Capability**: `SCRIPT_VIEW`.
- **Response Schema**: `ApiResponseEnvelope<{ versions: ScriptVersionDocument[] }>`.

---

## 7. Frontend Contract
- **Canonical Route**: `/scripts` (Scripts Hub), `/scripts/new?questionId=...` (Script Studio), `/scripts/:id` (Detail/Edit).
- **Allowed Roles / Capabilities**: `ScriptWriter`, `Admin`, `SuperAdmin`.
- **UI Behavior**:
  - Three distinct section boxes: Hook, Body, CTA with real-time character and word count.
  - Dynamic duration badge: Green (40–60s), Amber (60–75s), Red (>75s or <30s).
  - Floating reference panel displaying the underlying verified Question text and explanation.

---

## 8. RBAC / Capability Contract
- **`SCRIPT_CREATE`**: Create new script.
- **`SCRIPT_UPDATE`**: Edit script draft.
- **`SCRIPT_VIEW`**: View scripts.

---

## 9. Workflow Contract
- **Step 03 Entry Condition**: Question verified in Step 02 (`Q_VERIFIED`).
- **Step 03 Completion Condition**: Writer clicks *"Submit Script for Filming"* $\to$ Workflow Engine transitions item to Step 04 (`F_READY`).

---

## 10. Validation Contract
- **Length Validation**: Hook text $\ge 5$ words; Body text $\ge 20$ words; CTA text $\ge 5$ words.
- **Duration Boundary**: Estimated duration must be between 20 and 120 seconds.

---

## 11. Error Contract
- `400 BAD_REQUEST`: Missing script sections or empty content.
- `409 CONFLICT`: Version mismatch during update.
- `422 UNPROCESSABLE_ENTITY`: Associated question is not in `VERIFIED` state.

---

## 12. Audit Contract
- **Events**: `SCRIPT_CREATED`, `SCRIPT_UPDATED`, `SCRIPT_SUBMITTED_FOR_FILMING`.
- **Payload**: `scriptId`, `questionId`, `authorId`, `duration`.

---

## 13. Realtime Contract
- **SSE Event**: `script.created`, `script.updated` broadcast to studio hub subscribers.

---

## 14. Job / Async Contract
- **Async Execution**: None. Real-time WPM calculation executed in client-side TypeScript.

---

## 15. AI Contract
- **Assistive Writing**: Integration with FC-019 for generating hook variations or compressing explanation length. Human author must review and accept changes.

---

## 16. Media Contract
- **Applicable**: No.

---

## 17. Analytics Contract
- **Metrics**: Script word count vs. final published watch time correlation.

---

## 18. Security Contract
- **Sanitization**: Script inputs sanitized for plain text; no script injection.

---

## 19. Observability Contract
- **Logs**: Structured logs recording script creation and word count metrics.

---

## 20. Cost Contract
- **Cost**: ₹0.00. Standard Firestore operations within Spark tier.

---

## 21. Migration Contract
- **Legacy Parity**: Existing scripts from Google Sheets imported with link to migrated questions.

---

## 22. Test Contract
- **Unit Tests**:
  - `TC-SCR-01`: WPM calculator correctly estimates duration for Telugu and English text.
  - `TC-SCR-02`: Script requires verified question prerequisite.
  - `TC-SCR-03`: Updates increment version and append to `script_versions`.
- **API Tests**:
  - `TC-SCR-04`: `POST /api/v1/scripts` creates script linked to `questionId`.
  - `TC-SCR-05`: `PUT /api/v1/scripts/:id` rejects stale OCC version.

---

## 23. Dependencies
- **Prerequisite Features**: FC-001, FC-002, FC-003, FC-005, FC-006, FC-007.
- **Stage 25 Node**: `D-08 (Scripts)`, `D-09 (Script Versions)`.
- **Downstream Consumers**: FC-009 (Teleprompter), FC-010 (Raw Video).

---

## 24. Implementation Sequence
1. Define Script schemas (`src/types/script.ts`).
2. Implement `ScriptRepository` and WPM calculator utility (`src/lib/script-timing.ts`).
3. Implement `ScriptService` with question state validation.
4. Implement `/api/v1/scripts` route handlers.
5. Create React Script Studio workspace (`src/pages/scripts/`).
6. Verify against `TC-SCR-01..05`.

---

## 25. Deployment Contract
- **Dependencies**: Code-only deployment.

---

## 26. Rollback Contract
- **Strategy**: Revert Cloud Run revision.

---

## 27. Feature Completion Criteria
- [ ] Script authoring UI renders and submits correctly.
- [ ] Real-time WPM calculator updates duration dynamically.
- [ ] Version history snapshots accurately on every update.
- [ ] Transition to Step 04 verified.
- [ ] Zero lint or build errors.

---

## 28. Open Issues / Assumptions
- **None**: Fully specified in Stages 06, 07, 10, and 13.

---

## 29. Traceability
- **Stage 01**: BR-003, NFR-002
- **Stage 02**: DAC-003
- **Stage 06**: Script Bounded Context
- **Stage 07**: Step 03 Specification
- **Stage 10**: Scripts Hub Architecture
- **Stage 13**: `scripts`, `script_versions` schemas
- **Stage 15**: `/api/v1/scripts/*`
- **Stage 24**: TC-WF03-01..09
- **Stage 25**: Nodes `D-08`, `D-09`
