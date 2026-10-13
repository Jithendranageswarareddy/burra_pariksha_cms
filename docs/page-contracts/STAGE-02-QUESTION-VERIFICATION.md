# Stage 02 — Question Verification

## 3.1 Page Identity
- Route: `/questions/:id/verify`; owner: question-verification feature; **Reviewed**.
- Related: FC-007, FC-005, page-route contract.
- Evidence: [`frontend/app/App.tsx`](../../frontend/app/App.tsx),
  [`frontend/api/questions.api.ts`](../../frontend/api/questions.api.ts),
  [`backend/features/question-generation/services/question-draft.service.ts`](../../backend/features/question-generation/services/question-draft.service.ts),
  [`docs/features/FC-007-QUESTION-VERIFICATION-REVIEWS.md`](../features/FC-007-QUESTION-VERIFICATION-REVIEWS.md),
  [`docs/architecture/07-CANONICAL-15-STEP-WORKFLOW.md`](../architecture/07-CANONICAL-15-STEP-WORKFLOW.md).

## 3.2 Purpose
- Review a submitted question, complete pedagogical/proof checks, and approve,
  request changes, or reject it. Authoring and script creation are out of scope.

## 3.3 Entry Condition
- Authenticated reviewer, submitted question, and current Stage 02 review state.
- Missing or unauthorized entities are rejected by the backend.

## 3.4 Required Data
- Locked candidate, taxonomy, author identity, review checklist, remarks, and
  current workflow/OCC version. Data source is question and review services.

## 3.5 GET Requests
- Question detail and review context are loaded through typed question APIs.
- Exact endpoint composition is **UNVERIFIED**; loading/error/retry must be
  distinguished from 403 and missing-record states.

## 3.6 User Inputs
- Checklist decisions, proof findings, decision, and mandatory remarks for
  changes/rejection. Submitted question fields are read-only.

## 3.7 Defaults
- Pending review is the application-defined initial state; no decision is
  selected until the reviewer completes the checklist.

## 3.8 Primary Action
- Approve, request changes, or reject. Approval is disabled until all gates pass;
  GAR-02 prohibits author self-approval.

## 3.9 API Request
- Typed question status/approval functions submit the question ID, decision, and
  remarks. Zod validation and capability checks are server-side.

## 3.10 Backend Use Case
- Question validation service, workflow engine, audit dispatcher, and repository
  enforce checklist, authorization, anti-self-approval, and OCC.

## 3.11 Response
- Success returns the decision and workflow state; changes route back to Stage 01,
  approval advances to Stage 03, and rejection halts/archives as specified.

## 3.12 Persistence
- `QuestionReview` and question/version state are persisted in Firestore;
  approval locks the version. Exact collection names beyond the feature contract
  are **UNVERIFIED**.

## 3.13 Workflow State
- Entry `PENDING_REVIEW`; approve 02 → 03; changes 02 → 01; rejection is terminal
  per the workflow contract. Frontend presents; backend decides.

## 3.14 Audit
- Review decision, actor, subject, and transition must be append-only audited.
  Exact event coverage is **UNVERIFIED** and is a **DOCUMENTATION GAP**.

## 3.15 Error States
- 401/403 including GAR-02, 404, failed checklist, missing remarks, OCC conflict,
  network failure, and invalid transition. No blind retry for decisions.

## 3.16 Empty States
- No pending review: show an empty queue, not an error. Missing question is a
  not-found state; unavailable review data is a retryable failure.

## 3.17 Next Action
- Approved: `/videos/:id?tab=script` or the shared production route.
- Changes requested: return to `/studio`; rejection prevents progression.

## 3.18 Role Visibility
- SME/content-manager review capability; the author may view but cannot approve
  their own item. Backend enforcement is mandatory.

## 3.19 Performance
- Load one review context, avoid duplicate requests, and show checklist loading.
  Pagination belongs to the queue; page-level target is **TBD**.

## 3.20 Acceptance Criteria
- Existing FC-002/FC-005 tests cover authorization, GAR-02, and transitions.
- Checklist persistence, exact audit events, and reviewer-page E2E coverage are
  **UNVERIFIED**.

### Claim-level evidence register
- Route: [`frontend/app/App.tsx`](../../frontend/app/App.tsx) (**IMPLEMENTED**).
- API and backend approval path: [`frontend/api/questions.api.ts`](../../frontend/api/questions.api.ts)
  and [`backend/features/question-generation/services/question-draft.service.ts`](../../backend/features/question-generation/services/question-draft.service.ts)
  (**IMPLEMENTED**); exact verification-page GET behavior is **UNVERIFIED**.
- GAR-02 and transition requirements: [`docs/architecture/07-CANONICAL-15-STEP-WORKFLOW.md`](../architecture/07-CANONICAL-15-STEP-WORKFLOW.md)
  and [`docs/architecture/09-RBAC-CAPABILITY-MODEL.md`](../architecture/09-RBAC-CAPABILITY-MODEL.md)
  (**architecture requirement**); runtime checklist enforcement is **UNVERIFIED**.
- Persistence/audit/roles: [`backend/features/question-generation/services/question-draft.service.ts`](../../backend/features/question-generation/services/question-draft.service.ts)
  provides approval/audit code; complete review persistence and role matrix coverage are **UNVERIFIED**.
