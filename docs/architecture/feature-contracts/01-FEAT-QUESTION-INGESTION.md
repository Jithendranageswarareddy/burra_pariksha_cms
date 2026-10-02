# Feature Contract: FEAT-01 Question Ingestion & Authoring

**Feature ID:** `FEAT-01`  
**Feature Name:** Question Ingestion & Authoring  
**Workflow Step:** Step 01 (Question Authoring / Ingestion)  
**Primary Hub:** Question Studio (`/studio/questions`)  
**Status:** `ACCEPTED — COMPLETE — CLOSED`  
**Version:** `1.1.0`

---

### 1. Requirement & Business Objective
- **Problem Statement:** Ingest, parse, and author bilingual Telugu/English questions across 5 examination categories (General Studies, Arithmetic & Reasoning, Current Affairs, Science & Technology, History & Culture) with mathematical precision.
- **Goal:** Enable Authors and AI Copilots to draft validated questions with zero schema deviation and automated duplicate detection.

### 2. Business Acceptance Criteria
- Complete question creation with bilingual prompt, 4 choices, single correct answer index, explanation, difficulty tier, and taxonomy tags.
- LaTeX / Unicode mathematical expression validation with bracket and fraction balancing.
- Duplicate detection threshold $\ge 85\%$ triggers warning; $100\%$ exact hash match blocks ingestion.

### 3. Domain Entities
- `QuestionEntity`, `QuestionOption`, `TaxonomyMetadata`, `BilingualText`, `MathematicalExpression`.

### 4. Database Persistence
- **Collection:** `questions`
- **Keys:** `questionId` (UUID v4)
- **Indexes:** `category + difficulty`, `status + createdAt`, `contentHash` (unique)
- **Concurrency:** OCC `version` integer increment.

### 5. API Contract
- **Method & Path:** `POST /api/v1/questions`
- **Envelope:** `ApiResponseEnvelope<QuestionResponsePayload>`
- **Request Body:** `CreateQuestionRequestSchema`
- **Response Code:** `201 Created`

### 6. Frontend Workspace
- **Hub:** Question Studio (`/studio/questions`)
- **Layout:** Unified Studio with live bilingual preview, LaTeX math renderer, and duplicate checker panel.
- **Component:** `QuestionAuthoringForm`, `MathExpressionPreview`, `DuplicateDetectorBadge`.

### 7. RBAC & Access Control
- **Required Capability:** `question:create`
- **Allowed Roles:** `AUTHOR`, `ADMIN`, `SUPER_ADMIN`
- **Segregation of Duties:** An Author cannot approve their own question in Step 02 (`GAR-02`).

### 8. Workflow Transition
- **Step Sequence:** Step 00 (Draft/New) $\to$ Step 01 (Authored / Ingested)
- **Initial Status:** `DRAFT` / `INGESTED`
- **Target Status:** `PENDING_REVIEW` (Step 02 Gate)
- **Human Gate:** Yes — requires manual submission to queue.

### 9. Validation Schemas
- **Schema:** `CreateQuestionInputSchema` (Zod)
- **Rules:** Telugu script presence in bilingual fields, exactly 4 distinct options, valid correct option index (0..3), non-empty explanation.

### 10. Error Handling & Codes
- `ERR_QUESTION_DUPLICATE` (409 Conflict)
- `ERR_MATH_SYNTAX_INVALID` (422 Unprocessable Entity)
- `ERR_BILINGUAL_PARSING_FAILED` (400 Bad Request)

### 11. Audit & Observability
- **Audit Event:** `AUDIT_QUESTION_CREATED`
- **Severity:** `INFO`
- **Payload:** Actor ID, Question ID, Category, Content Hash, Initial State.

### 12. Realtime SSE Events
- **Topic:** `question.created`
- **Payload:** `{ questionId, category, authorId, timestamp }`

### 13. Test Matrix Coverage
- Verified across all 9 universal test scenarios: Happy Path, Validation Failure, Auth Failure, Invalid Transition, Missing Data, Concurrency Conflict, Media Failure (N/A), Network Timeout, Rollback Recovery.

### 14. Deployment & Infrastructure
- Cloud Run Node.js service, Firestore Native mode, Google Cloud Logging.

### 15. Rollback Safety Net
- Soft delete / state reversal to `DRAFT_CORRUPTED`, compensation event emission, Firestore transaction abort.
