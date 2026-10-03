# FEATURE CONTRACT: FC-007-QUESTION-VERIFICATION-REVIEWS

## 1. Feature Identity
- **Feature ID**: FC-007
- **Feature Name**: Question Verification & Reviews with GAR-02
- **Business Area**: Core Content / Quality Assurance & Review
- **Contract Version**: 1.0.0
- **Status**: APPROVED
- **Priority**: P1 (Core Manufacturing)
- **Owner / Domain**: Review & Verification Context
- **Related Workflow Stage(s)**: Step 02 (Question Verification)

---

## 2. Requirement
- **Business Requirement**: BR-002 (Educational Fact-Checking & Syllabus Alignment) & NFR-004 (Anti-Self-Approval GAR-02 Rule).
- **User Problem**: Content creators verifying their own questions introduces factual inaccuracies, bias, syllabus deviations, and lack of editorial oversight.
- **Business Purpose**: Provide a rigorous, backend-governed verification workflow where independent Subject Matter Experts (SMEs) inspect questions for accuracy, provide structured review feedback, and approve or reject submissions under strict anti-self-approval enforcement.
- **Expected Capability**:
  - Independent SME review queue (`/questions/review`).
  - Strict enforcement of GAR-02 (`authorId !== reviewerId`).
  - Structured review decisions: `APPROVE` or `REJECT` with mandatory rejection categorization and revision notes.
  - Automatic workflow state transition: Approval moves item to Step 03 (`S_READY`); rejection returns item to Step 01 (`Q_REJECTED`) with author notified.
  - Immutable persistence of all review actions in `question_reviews` collection.
- **Scope**: Question verification review submission, GAR-02 validation, review history, approval/rejection state transitions.
- **Explicit Non-Scope**: Authoring question drafts (FC-006), audience scripting (FC-008).

---

## 3. Business Acceptance
- **Happy-Path Acceptance**:
  - Independent SME reviews a submitted question, selects `APPROVE`, and submits. Question transitions to Step 03 with `contentStatus = VERIFIED`.
  - Rejection with comments transitions question back to Step 01 with `contentStatus = REJECTED`, locking Step 03 until resubmission.
- **GAR-02 Anti-Self-Approval Acceptance**:
  - Question author attempting to approve their own question receives HTTP 403 `SELF_APPROVAL_FORBIDDEN`.
- **Validation Acceptance**:
  - Submitting a rejection without explanatory notes ($< 15$ characters) returns HTTP 400 `REJECTION_REASON_REQUIRED`.
- **Concurrency Acceptance**:
  - If another SME verifies or rejects the question concurrently, second reviewer receives HTTP 409 `CONCURRENCY_CONFLICT`.
- **Audit Acceptance**:
  - `QUESTION_VERIFIED` or `QUESTION_REJECTED` audit event logged with `reviewerId`, `questionId`, `decision`, and `notes`.

---

## 4. Domain Entities
- **Entities Involved**: `Question`, `QuestionReview`, `ReviewDecision`, `ReviewComment`.
- **Entity Ownership**: Quality & Review Bounded Context.
- **Relationships**: A `Question` has zero or more `QuestionReview` records.
- **Versions**: Schema v1.0.
- **Immutable Fields**: `id`, `questionId`, `reviewerId`, `decision`, `comments`, `createdAt`.
- **Mutable Fields**: None (Reviews are append-only audit records).
- **References**: `reviewerId` references `users.id`; `questionId` references `questions.id`.
- **Lifecycle**: `Recorded`.

---

## 5. Database / Data Contract
- **Collections Involved**: `question_reviews`, `questions`, `workflow_instances`.
- **Document Structure**:
  ```typescript
  export interface QuestionReviewDocument extends BaseEntity {
    id: string; // rev_ + UUIDv4
    questionId: string;
    questionVersion: number;
    reviewerId: string;
    decision: 'APPROVE' | 'REJECT';
    rejectionCategory?: 'FACTUAL_ERROR' | 'SYLLABUS_MISMATCH' | 'GRAMMAR_TRANSLATION' | 'FORMATTING';
    comments: string;
    createdAt: string;
  }
  ```
- **Indexes**: Composite index on `(questionId, createdAt DESC)` and `(reviewerId, createdAt DESC)`.
- **Source of Truth**: Firestore `question_reviews` collection.

---

## 6. API Contract
### 6.1 `POST /api/v1/questions/:id/reviews`
- **Authentication**: Required.
- **Required Capability**: `QUESTION_VERIFY`.
- **Request Schema**:
  ```typescript
  {
    decision: z.enum(['APPROVE', 'REJECT']),
    rejectionCategory: z.enum(['FACTUAL_ERROR', 'SYLLABUS_MISMATCH', 'GRAMMAR_TRANSLATION', 'FORMATTING']).optional(),
    comments: z.string().min(10),
    expectedVersion: z.number().int().positive()
  }
  ```
- **Business Rule (GAR-02)**: Asserts `req.user.id !== question.authorId`.
- **Response Schema**: `ApiResponseEnvelope<{ review: QuestionReviewDocument, question: QuestionDocument }>`
- **Error Codes**: `400 INVALID_INPUT`, `403 SELF_APPROVAL_FORBIDDEN`, `409 CONCURRENCY_CONFLICT`, `422 INVALID_WORKFLOW_STATE`.
- **Audit Event**: `QUESTION_VERIFIED` or `QUESTION_REJECTED`.

### 6.2 `GET /api/v1/questions/:id/reviews`
- **Authentication**: Required.
- **Required Capability**: `QUESTION_VIEW`.
- **Response Schema**: `ApiResponseEnvelope<{ reviews: QuestionReviewDocument[] }>`.

---

## 7. Frontend Contract
- **Canonical Route**: `/questions/review` (SME Review Queue), `/questions/:id/verify` (Review Workspace).
- **Allowed Roles / Capabilities**: `SubjectMatterExpert`, `Admin`, `SuperAdmin`.
- **UX Behavior**:
  - Review queue displays questions in `Q_IN_REVIEW` status.
  - If the logged-in user is the question's author, the action buttons are replaced with a persistent amber warning: *"GAR-02 Rule: You authored this question and cannot review it."*
  - Approve action opens confirmation dialog.
  - Reject action opens modal requiring selection of rejection category and structured revision feedback.

---

## 8. RBAC / Capability Contract
- **Capability Required**: `QUESTION_VERIFY`.
- **Strict Constraint (GAR-02)**: Author cannot review their own question. Even `SuperAdmin` cannot approve a question they authored.

---

## 9. Workflow Contract
- **Workflow Step**: Step 02 (Question Verification).
- **Entry Condition**: Question in Step 01 submitted for review (`Q_IN_REVIEW`).
- **Exit Condition**:
  - On `APPROVE`: Transitions to Step 03 (Audience Script, `S_READY`).
  - On `REJECT`: Transitions to Step 01 (`Q_REJECTED`) for author revision.

---

## 10. Validation Contract
- **Comment Validation**: Comments required (minimum 10 characters).
- **Rejection Category**: Mandatory if decision is `REJECT`.
- **Version Check**: Review must evaluate against the exact latest `questionVersion`.

---

## 11. Error Contract
- `400 BAD_REQUEST`: Empty review comments or missing rejection category on reject.
- `403 FORBIDDEN`: Attempted self-approval or missing `QUESTION_VERIFY` capability.
- `409 CONFLICT`: Question modified by another actor while review was being drafted.
- `422 UNPROCESSABLE_ENTITY`: Attempting review on a question not in `Q_IN_REVIEW` state.

---

## 12. Audit Contract
- **Events**: `QUESTION_VERIFIED`, `QUESTION_REJECTED`, `GAR02_VIOLATION_ATTEMPT`.
- **Payload**: `questionId`, `reviewerId`, `authorId`, `decision`, `comments`.

---

## 13. Realtime Contract
- **SSE Event**: `question.reviewed` broadcast to notify author of approval or rejection.

---

## 14. Job / Async Contract
- **Async Execution**: Synchronous verification. Notification email/alert sent asynchronously.

---

## 15. AI Contract
- **Fact-Checking Aid**: Read-only reference assistance from Gemini 2.5 Flash to highlight verified syllabus facts. AI does not submit reviews or make decisions.

---

## 16. Media Contract
- **Applicable**: No.

---

## 17. Analytics Contract
- **Metrics**: SME review turnaround time, subject rejection ratios.

---

## 18. Security Contract
- **Double-Blind Integrity**: Reviewer cannot modify question text directly; must reject with feedback.

---

## 19. Observability Contract
- **Metrics**: Counter `reviews.submitted_total{decision, subject}`.

---

## 20. Cost Contract
- **Cost**: ₹0.00. Standard Firestore read/write operations within Spark free tier.

---

## 21. Migration Contract
- **Historical Parity**: Legacy Google Sheets questions marked "Approved" get an initial synthetic verification record attributed to `SYSTEM_MIGRATION`.

---

## 22. Test Contract
- **Unit Tests**:
  - `TC-REV-01`: GAR-02 validator blocks review when `reviewerId === authorId`.
  - `TC-REV-02`: Approval updates workflow step to 03 and status to `VERIFIED`.
  - `TC-REV-03`: Rejection updates workflow step to 01 and status to `REJECTED`.
- **API Tests**:
  - `TC-REV-04`: `POST /api/v1/questions/:id/reviews` enforces capability and outputs envelope.
  - `TC-REV-05`: Self-approval attempt returns HTTP 403 `SELF_APPROVAL_FORBIDDEN`.

---

## 23. Dependencies
- **Prerequisite Features**: FC-001, FC-002, FC-003, FC-005, FC-006.
- **Stage 25 Node**: `D-07 (Reviews / GAR-02 Rule)`.
- **Downstream Consumers**: FC-008 (Audience Scripting).

---

## 24. Implementation Sequence
1. Define `QuestionReview` types (`src/types/review.ts`).
2. Implement `QuestionReviewRepository`.
3. Implement `QuestionReviewService` with GAR-02 rule and workflow transition.
4. Implement `/api/v1/questions/:id/reviews` route handlers.
5. Build React review workspace (`src/pages/questions/QuestionVerifyPage.tsx`).
6. Verify against `TC-REV-01..05`.

---

## 25. Deployment Contract
- **Dependencies**: Code-only deployment.

---

## 26. Rollback Contract
- **Strategy**: Revert Cloud Run revision. Review documents remain immutable.

---

## 27. Feature Completion Criteria
- [ ] GAR-02 anti-self-approval rule proven with unit and API tests.
- [ ] Approval transitions question to Step 03.
- [ ] Rejection returns question to Step 01 with author notifications.
- [ ] Review history viewable in UI.
- [ ] Zero lint or build errors.

---

## 28. Open Issues / Assumptions
- **None**: Fully specified in Stages 02, 07, 09, and 19.

---

## 29. Traceability
- **Stage 01**: BR-002, NFR-004
- **Stage 02**: DAC-002
- **Stage 07**: Step 02 Specification
- **Stage 09**: GAR-02 Rule Invariant
- **Stage 13**: `question_reviews` collection schema
- **Stage 15**: `/api/v1/questions/:id/reviews`
- **Stage 19**: Anti-Self-Approval Authorization
- **Stage 24**: TC-WF02-01..09
- **Stage 25**: Node `D-07`
