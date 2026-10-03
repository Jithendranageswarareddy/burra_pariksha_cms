# FEATURE CONTRACT: FC-006-QUESTION-GENERATION-VERSIONING

## 1. Feature Identity
- **Feature ID**: FC-006
- **Feature Name**: Question Generation & Versioning
- **Business Area**: Core Content / Question Authoring
- **Contract Version**: 1.0.0
- **Status**: APPROVED
- **Priority**: P1 (Core Manufacturing)
- **Owner / Domain**: Question Domain Context
- **Related Workflow Stage(s)**: Step 01 (Question Generation)

---

## 2. Requirement
- **Business Requirement**: BR-001 (Bilingual Question Authoring & Exam Alignment) & NFR-002 (Immutable Content Versioning).
- **User Problem**: Content authors lack structured tooling to draft, edit, and version bilingual multiple-choice questions with educational explanations, leading to translation desynchronization and untracked edits.
- **Business Purpose**: Provide authoring tools for bilingual questions (Telugu & English) with 4 options, explanations, subject/topic taxonomy, and immutable version tracking.
- **Expected Capability**:
  - Creation of question drafts with canonical `qst_` ID.
  - Bilingual fields: question text, 4 options, correct answer index, explanation, tags, difficulty, subject, and exam category.
  - Automatic version snapshotting into `question_versions` upon every modification.
  - Questions Studio Hub UI (`/questions`, `/questions/new`, `/questions/:id/edit`).
  - Search and filter by subject, difficulty, exam category, and author.
- **Scope**: Question CRUD, version snapshotting, search/filtering, authoring UI.
- **Explicit Non-Scope**: Verification and approval (FC-007), script writing (FC-008).

---

## 3. Business Acceptance
- **Happy-Path Acceptance**:
  - Author drafts a bilingual question, specifies 4 options with 1 correct answer, and saves. Question is stored with `version = 1` and `contentStatus = DRAFT`.
  - Updating an existing question increments `version` by 1 and creates an immutable snapshot in `question_versions`.
  - Author can view complete historical diffs across previous versions.
- **Validation Acceptance**:
  - Missing Telugu or English text, fewer or more than 4 options, or invalid correct answer index (not 0..3) returns HTTP 400 with descriptive error details.
- **Authorization Acceptance**:
  - User without `QUESTION_CREATE` or `QUESTION_UPDATE` capability receives HTTP 403 `FORBIDDEN`.
- **Concurrency Acceptance**:
  - Updates require matching `expectedVersion`; simultaneous edits return HTTP 409 `CONCURRENCY_CONFLICT`.
- **Performance Acceptance**:
  - Question creation and update round-trips complete in $< 100\text{ms}$.
- **Audit Acceptance**:
  - `QUESTION_CREATED` and `QUESTION_UPDATED` events dispatched with `version` and `actorId`.

---

## 4. Domain Entities
- **Entities Involved**: `Question`, `QuestionVersion`, `QuestionOption`, `SubjectTaxonomy`.
- **Entity Ownership**: Question Bounded Context.
- **Relationships**: One `Question` has one or more `QuestionVersion` records.
- **Versions**: Schema v1.0.
- **Immutable Fields**: `id`, `authorId`, `createdAt`.
- **Mutable Fields**: `textTelugu`, `textEnglish`, `options`, `correctOptionIndex`, `explanationTelugu`, `explanationEnglish`, `subject`, `topic`, `difficulty`, `examCategory`, `tags`.
- **References**: `authorId` references `users.id`.
- **Lifecycle**: `DRAFT` $\to$ `SUBMITTED_FOR_REVIEW` $\to$ `VERIFIED` | `REJECTED`.

---

## 5. Database / Data Contract
- **Collections Involved**: `questions`, `question_versions`.
- **Document Structure**:
  ```typescript
  export interface QuestionDocument extends BaseEntity {
    id: string; // qst_ + UUIDv4
    authorId: string;
    textTelugu: string;
    textEnglish: string;
    options: Array<{
      index: number; // 0..3
      textTelugu: string;
      textEnglish: string;
    }>;
    correctOptionIndex: number; // 0..3
    explanationTelugu: string;
    explanationEnglish: string;
    subject: string;
    topic: string;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    examCategory: string[];
    tags: string[];
    contentStatus: ContentStatus;
    workflowId: string;
  }
  ```
- **Indexes**: Composite indexes on `(subject, difficulty, createdAt DESC)` and `(authorId, createdAt DESC)`.
- **Source of Truth**: Firestore `questions` collection.

---

## 6. API Contract
### 6.1 `POST /api/v1/questions`
- **Authentication**: Required.
- **Required Capability**: `QUESTION_CREATE`.
- **Request Schema**: `QuestionCreateSchema` (Zod).
- **Response Schema**: `ApiResponseEnvelope<{ question: QuestionDocument }>`.

### 6.2 `GET /api/v1/questions`
- **Authentication**: Required.
- **Required Capability**: `QUESTION_VIEW`.
- **Query Params**: `subject`, `difficulty`, `status`, `page`, `limit`, `search`.
- **Response Schema**: `ApiResponseEnvelope<{ questions: QuestionDocument[] }>` with pagination meta.

### 6.3 `GET /api/v1/questions/:id`
- **Authentication**: Required.
- **Required Capability**: `QUESTION_VIEW`.
- **Response Schema**: `ApiResponseEnvelope<{ question: QuestionDocument }>`.

### 6.4 `PUT /api/v1/questions/:id`
- **Authentication**: Required.
- **Required Capability**: `QUESTION_UPDATE`.
- **Request Schema**: `QuestionUpdateSchema` (includes `expectedVersion`).
- **Response Schema**: `ApiResponseEnvelope<{ question: QuestionDocument }>`.

### 6.5 `GET /api/v1/questions/:id/versions`
- **Authentication**: Required.
- **Required Capability**: `QUESTION_VIEW`.
- **Response Schema**: `ApiResponseEnvelope<{ versions: QuestionVersionDocument[] }>`.

---

## 7. Frontend Contract
- **Canonical Route**: `/questions` (Hub), `/questions/new` (Authoring Form), `/questions/:id` (Detail/Edit).
- **Allowed Roles / Capabilities**: `SubjectMatterExpert`, `Admin`, `SuperAdmin`.
- **UI Behavior**:
  - Two-column bilingual editor with Telugu on the left and English on the right.
  - Interactive radio buttons for selecting correct option.
  - Auto-save draft capability with dirty state warning.
  - Historical version dropdown with visual inline diff highlighting.

---

## 8. RBAC / Capability Contract
- **`QUESTION_CREATE`**: Create drafts.
- **`QUESTION_UPDATE`**: Update existing drafts.
- **`QUESTION_VIEW`**: View questions and versions.
- **Ownership Rule**: Authors can always edit their own drafts; non-authors require `QUESTION_MANAGE_ALL` to edit.

---

## 9. Workflow Contract
- **Step 01 Entry Condition**: User initiates new question authoring.
- **Step 01 Completion Condition**: Author clicks *"Submit for Verification"* $\to$ Workflow Engine transitions question from Step 01 to Step 02 (`Q_IN_REVIEW`).

---

## 10. Validation Contract
- **Bilingual Validation**: Both Telugu and English strings must have length $\ge 10$ characters.
- **Options Validation**: Exactly 4 options; no duplicate option text; `correctOptionIndex` $\in \{0, 1, 2, 3\}$.
- **Subject Validation**: Subject must match authorized syllabus taxonomy.

---

## 11. Error Contract
- `400 BAD_REQUEST`: Failed bilingual text validation or invalid options count.
- `404 NOT_FOUND`: Question ID does not exist.
- `409 CONFLICT`: Version mismatch during save.

---

## 12. Audit Contract
- **Events**: `QUESTION_CREATED`, `QUESTION_UPDATED`, `QUESTION_VERSION_SNAPSHOTTED`.
- **Payload**: `questionId`, `version`, `authorId`, `subject`.

---

## 13. Realtime Contract
- **SSE Event**: `question.created`, `question.updated` broadcast to `/questions` hub subscribers.

---

## 14. Job / Async Contract
- **Async Processing**: None for standard authoring. Bulk spreadsheet question imports run via Cloud Tasks batch worker.

---

## 15. AI Contract
- **Assistive Drafting**: Optional integration with FC-019 (AI Prompt Engine) for translating English to Telugu or suggesting distractors. AI proposals are reviewed and explicitly accepted by the author before committing.

---

## 16. Media Contract
- **Applicable**: Optional image diagram attachment references (`mediaAssetId`).

---

## 17. Analytics Contract
- **Applicable**: Subject-wise authoring velocity metrics.

---

## 18. Security Contract
- **Input Sanitization**: HTML tags stripped; math formulas escaped via KaTeX/LaTeX formatting.

---

## 19. Observability Contract
- **Logs**: `question.authoring` logs with `questionId` and execution latency.

---

## 20. Cost Contract
- **Cost**: ₹0.00. 1 read/write per question operation in Firestore Spark tier.

---

## 21. Migration Contract
- **Legacy Compatibility**: Google Sheets historical questions imported via batch script with `version = 1`.

---

## 22. Test Contract
- **Unit Tests**:
  - `TC-QST-01`: Validation rejects questions with fewer than 4 options.
  - `TC-QST-02`: Updating question increments version and snapshots history.
  - `TC-QST-03`: Bilingual fields required in both Telugu and English.
- **API Tests**:
  - `TC-QST-04`: `POST /api/v1/questions` creates question with `qst_` ID.
  - `TC-QST-05`: `PUT /api/v1/questions/:id` rejects stale version with 409.

---

## 23. Dependencies
- **Prerequisite Features**: FC-001 (Auth), FC-002 (RBAC), FC-003 (Database & API envelope), FC-005 (Workflow State).
- **Stage 25 Node**: `D-05 (Questions)`, `D-06 (Question Versions)`.
- **Downstream Consumers**: FC-007 (Verification), FC-008 (Scripts), FC-019 (AI Assistance).

---

## 24. Implementation Sequence
1. Define Question schemas (`src/types/question.ts`).
2. Implement `QuestionRepository` extending `FirestoreRepository`.
3. Implement `QuestionService` with version snapshotting.
4. Implement `/api/v1/questions` route handlers.
5. Create React authoring form and version diff view (`src/pages/questions/`).
6. Verify against `TC-QST-01..05`.

---

## 25. Deployment Contract
- **Dependencies**: Code-only deployment.

---

## 26. Rollback Contract
- **Strategy**: Revert Cloud Run revision. Document schemas remain backward compatible.

---

## 27. Feature Completion Criteria
- [ ] Bilingual authoring UI renders and submits correctly.
- [ ] Version history snapshots accurately on every update.
- [ ] Concurrency version conflict verified.
- [ ] Question search and filter tests passing.
- [ ] Zero lint or build errors.

---

## 28. Open Issues / Assumptions
- **None**: Fully aligned with Stages 06, 07, 10, and 13.

---

## 29. Traceability
- **Stage 01**: BR-001, NFR-002
- **Stage 02**: DAC-001
- **Stage 06**: Question Aggregate Model
- **Stage 07**: Step 01 Specification
- **Stage 10**: Questions Hub Architecture
- **Stage 13**: `questions`, `question_versions` schemas
- **Stage 15**: `/api/v1/questions/*`
- **Stage 24**: TC-WF01-01..09
- **Stage 25**: Nodes `D-05`, `D-06`
