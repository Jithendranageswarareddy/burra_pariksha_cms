# Stage 01 — Question Generation

## 3.1 Page Identity
- Route: `/studio`; legacy `/questions/new` redirects here.
- Owner: `frontend/features/question-generation`; status: **Reviewed**.
- Evidence: FC-006, FC-005, `frontend/features/question-generation/README.md`,
  `frontend/features/question-generation/pages/QuestionStudioPage.tsx`,
  [`frontend/app/App.tsx`](../../frontend/app/App.tsx),
  [`frontend/api/questions.api.ts`](../../frontend/api/questions.api.ts),
  [`backend/features/question-generation/services/question-draft.service.ts`](../../backend/features/question-generation/services/question-draft.service.ts),
  [`docs/architecture/07-CANONICAL-15-STEP-WORKFLOW.md`](../architecture/07-CANONICAL-15-STEP-WORKFLOW.md).

## 3.2 Purpose
- Author bilingual candidates bound to the Topic → Subtopic taxonomy.
- The page owns generation, candidate editing, validation, draft save, and
  explicit submission. Verification, approval, and downstream production are
  outside its scope.

## 3.3 Entry Condition
- Authenticated user with question-author capability; the backend remains
  authoritative for authorization.
- A new cycle or an existing draft may be opened. Missing taxonomy/context
  blocks generation and is shown as an actionable validation state.

## 3.4 Required Data
- Topic/subtopic options, generation context, bilingual text, exactly four
  options, correct answer, explanation/proof, difficulty, and draft identity.
- Configuration comes from the question API and taxonomy API; candidates are
  advisory AI output and require human review.

## 3.5 GET Requests
- Studio configuration and taxonomy are loaded through the typed API clients
  ([`frontend/api/questions.api.ts`](../../frontend/api/questions.api.ts),
  [`frontend/api/api-client.ts`](../../frontend/api/api-client.ts)).
- Existing drafts use `questionsApi.getDraft`/`getDrafts`; authentication,
  loading, failure, and retry states are implemented by the feature hook.
- Exact transport routes are delegated to `frontend/api/api-client.ts`;
  undocumented route details are a **DOCUMENTATION GAP**, not invented here.

## 3.6 User Inputs
- Topic, subtopic, context, generation prompt, bilingual question, four
  distinct options, correct option, explanation/proof, and difficulty.
- Dirty state is retained until save. Invalid taxonomy, missing fields,
  duplicate options, or malformed candidates cannot be saved/submitted.

## 3.7 Defaults
- Studio configuration supplies available taxonomy and generation defaults.
- No valid topic/subtopic means no generation default; the user must select
  both. This is **IMPLEMENTED** in the feature contract.

## 3.8 Primary Action
- **Save Draft** validates the minimum shape, persists in place, clears dirty
  state, and retains the canonical draft ID.
- **Submit for Verification** is a separate explicit action requiring a saved
  draft. Neither action approves, verifies, or silently navigates.

## 3.9 API Request
- Typed functions: `questionsApi.saveDraft`, `validateCandidate`,
  `generateAiQuestion`, `refineAiQuestion`, and `submitForVerification`.
- Payload validation and authorization are server-side; submit carries the
  draft ID and optional remarks. Duplicate submit behavior is backend-owned and
  otherwise **UNVERIFIED**.

## 3.10 Backend Use Case
- Routes delegate to question draft, question generation, validation, workflow,
  and repository services ([`backend/server/routers/routes.ts`](../../backend/server/routers/routes.ts),
  [`backend/features/question-generation/services/question-draft.service.ts`](../../backend/features/question-generation/services/question-draft.service.ts)).
  Firestore authority and advisory AI are architectural requirements
  ([`AGENTS.md`](../../AGENTS.md)); this contract does not claim every gate is
  runtime-verified.
- Frontend → API client → backend/domain service → repository is preserved.

## 3.11 Response
- Save returns the draft and ID; success stays on the page.
- Submit returns the transition result and resulting Stage 02 state. Failures
  remain visible without converting a successful save into a failed submission.

## 3.12 Persistence
- Collection: `question_drafts` and canonical ID generation are evidenced by
  [`backend/features/question-generation/services/question-draft.service.ts`](../../backend/features/question-generation/services/question-draft.service.ts),
  [`database/firestore/repositories/question-drafts.repository.ts`](../../database/firestore/repositories/question-drafts.repository.ts),
  and [`shared/lib/id.service.ts`](../../shared/lib/id.service.ts). Existing
  draft identity is implemented; OCC behavior for every draft path is
  **UNVERIFIED**.
- No Google Sheets runtime persistence is permitted.

## 3.13 Workflow State
- Entry: Stage 01 authoring/in progress. Submit performs the backend-authorized
  01 → 02 transition; save performs no transition.
- Invalid transitions, stale drafts, and rejected candidates remain in the
  appropriate authoring/revision state.

## 3.14 Audit
- Save, submission, and workflow transition audit behavior is required by the
  architecture. Exact event names and failure policy are **UNVERIFIED** in the
  inspected page slice; record this as a **DOCUMENTATION GAP**.

## 3.15 Error States
- Cover 401/403, invalid taxonomy/candidate, stale draft/OCC conflict, AI
  outage, network failure, and invalid transition. Save is retryable only when
  the operation is safe; submit must not be blindly retried.

## 3.16 Empty States
- No topics/subtopics: explain missing reference data and disable generation.
- No draft: present first-use authoring. No candidate: present generation and
  manual-entry actions. Loading and unauthorized states are distinct.

## 3.17 Next Action
- After a valid explicit submit, navigate or link to `/questions/:id/verify`.
- Without a saved valid draft, progression is blocked and the user remains in
  Stage 01.

## 3.18 Role Visibility
- Question authors can create/edit drafts; SMEs and authorized managers may
  supervise according to the canonical capability matrix. Verification actions
  are not exposed as Stage 01 controls.

## 3.19 Performance
- Prevent duplicate generation/save requests, show loading indicators, and
  defer AI work until requested. No repository-wide measurable page target is
  established; target is **TBD**.

## 3.20 Acceptance Criteria
- Evidence: question-generation unit/integration/E2E tests cover taxonomy,
  save-vs-submit, route registration, and workflow behavior.
- Missing coverage: audit event assertions, duplicate submit semantics, and
  measured performance are **UNVERIFIED**.
