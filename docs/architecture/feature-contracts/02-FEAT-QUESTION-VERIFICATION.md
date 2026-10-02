# Feature Contract: FEAT-02 Question Verification & SME Approval

**Feature ID:** `FEAT-02`  
**Feature Name:** Question Verification & SME Approval  
**Workflow Step:** Step 02 (SME Verification & Review)  
**Primary Hub:** Question Studio (`/studio/questions`)  
**Status:** `ACCEPTED — COMPLETE — CLOSED`  
**Version:** `1.1.0`

---

### 1. Requirement & Business Objective
- **Problem Statement:** Enforce rigorous academic quality control and factual correctness on authored questions before downstream script generation.
- **Goal:** Provide Subject Matter Experts (SMEs) with an intuitive review workbench while strictly enforcing Anti-Self-Approval (`GAR-02`, `AP-009`).

### 2. Business Acceptance Criteria
- SME can approve, request edits, or reject a question with mandatory structured feedback.
- Anti-Self-Approval Invariant: The system MUST reject any approval request where `reviewerId == authorId` with HTTP `403 Forbidden`.
- Automated validation checks (bilingual match, math consistency, syllabus alignment) must be green prior to human sign-off.

### 3. Domain Entities
- `QuestionReviewRecord`, `SmeFeedback`, `ApprovalDecision`, `QuestionEntity`.

### 4. Database Persistence
- **Collection:** `question_reviews`, `questions` (status update)
- **Keys:** `reviewId` (UUID v4), `questionId`
- **Indexes:** `questionId + createdAt`, `reviewerId + decision`
- **Concurrency:** OCC `version` match on `questions` document.

### 5. API Contract
- **Method & Path:** `POST /api/v1/questions/:id/review`
- **Envelope:** `ApiResponseEnvelope<QuestionReviewResponsePayload>`
- **Request Body:** `SubmitQuestionReviewSchema`
- **Response Code:** `200 OK`

### 6. Frontend Workspace
- **Hub:** Question Studio (`/studio/questions/review`)
- **Layout:** Split-pane comparison (Author Content vs Review Checklist) with anti-self-approval disabled button state when author is current user.
- **Component:** `SmeReviewWorkbench`, `SelfApprovalWarningBanner`, `QualityChecklist`.

### 7. RBAC & Access Control
- **Required Capability:** `question:review`
- **Allowed Roles:** `REVIEWER`, `SME`, `ADMIN`, `SUPER_ADMIN`
- **Segregation of Duties:** `reviewerId != authorId` strictly enforced server-side.

### 8. Workflow Transition
- **Step Sequence:** Step 01 (Authored) $\to$ Step 02 (Approved / Rejected / Revision)
- **Initial Status:** `PENDING_REVIEW`
- **Target Status:** `APPROVED` (Proceeds to Step 03) or `REVISION_REQUIRED` (Returns to Step 01) or `REJECTED`
- **Human Gate:** Mandatory Human Review Gate (`AP-009`). AI cannot auto-approve.

### 9. Validation Schemas
- **Schema:** `SubmitQuestionReviewInputSchema` (Zod)
- **Rules:** `decision` in (`APPROVE`, `REVISE`, `REJECT`), `feedback` required if `decision != 'APPROVE'`.

### 10. Error Handling & Codes
- `ERR_SELF_APPROVAL_PROHIBITED` (403 Forbidden - `GAR-02` violation)
- `ERR_QUESTION_NOT_IN_REVIEW_STATE` (409 Conflict)
- `ERR_CONCURRENCY_CONFLICT` (412 Precondition Failed)

### 11. Audit & Observability
- **Audit Event:** `AUDIT_QUESTION_REVIEWED`
- **Severity:** `INFO` / `WARN` (if rejected)
- **Payload:** Reviewer ID, Author ID, Decision, Feedback, OCC Version.

### 12. Realtime SSE Events
- **Topic:** `question.reviewed`
- **Payload:** `{ questionId, decision, reviewerId, nextStep: "03_SCRIPTING" }`

### 13. Test Matrix Coverage
- 9 universal scenarios verified, with dedicated tests for Anti-Self-Approval rejection and concurrent reviewer race conditions.

### 14. Deployment & Infrastructure
- Cloud Run Node.js service, Firestore Native mode, Google Cloud Logging.

### 15. Rollback Safety Net
- Transition reversal to `PENDING_REVIEW`, review record invalidated, audit ledger logged.
