# Stage 03 — Audience Script

## 3.1 Page Identity
- Shared route `/videos/:videoId?tab=script` redirects to `/videos/:videoId`;
  implementation is `ScriptWorkspace`/`VideoCreateScriptPage`; **Reviewed**.
- Related: FC-008, FC-005.
- Evidence: [`frontend/app/App.tsx`](../../frontend/app/App.tsx),
  [`frontend/components/video/ScriptWorkspace.tsx`](../../frontend/components/video/ScriptWorkspace.tsx),
  [`backend/features/production/services/script.service.ts`](../../backend/features/production/services/script.service.ts),
  [`docs/features/FC-008-AUDIENCE-SCRIPTING-VERSIONING.md`](../features/FC-008-AUDIENCE-SCRIPTING-VERSIONING.md),
  [`docs/architecture/07-CANONICAL-15-STEP-WORKFLOW.md`](../architecture/07-CANONICAL-15-STEP-WORKFLOW.md).

## 3.2 Purpose
- Turn a verified question into a timed presenter script. Verification and filming
  are outside the page.

## 3.3 Entry Condition
- Verified/locked question and Stage 03 eligibility. Shared production route may
  render a tab; exact gate enforcement is **UNVERIFIED**.

## 3.4 Required Data
- Verified question, script sections, Telugu delivery text, timing, CTA, version,
  and video identity.

## 3.5 GET Requests
- Video/question/script data are loaded through typed video/question APIs. Exact
  request list is **UNVERIFIED**; retry must not discard edits.

## 3.6 User Inputs
- Hook, problem, solution, speed trick, CTA, and script edits. Timing is derived;
  locked fields become read-only.

## 3.7 Defaults
- New script draft and standard section structure are application defaults;
  target timing is 45–58 seconds per the architecture.

## 3.8 Primary Action
- Save draft, validate pacing, and lock for filming. Lock is the workflow action;
  AI suggestions remain advisory.

## 3.9 API Request
- `frontend/api/videos.api.ts` and script service functions carry video/script
  payloads; server validation owns timing and authorization.

## 3.10 Backend Use Case
- Script service, production workflow, audit, and Firestore repository. No direct
  frontend persistence.

## 3.11 Response
- Save returns the script/version; lock returns `SCRIPT_READY` and Stage 04
  eligibility. Partial AI output must remain an uncommitted candidate.

## 3.12 Persistence
- Script and immutable versions are Firestore-backed; exact collection/version
  transaction semantics are **UNVERIFIED**.

## 3.13 Workflow State
- Stage 03 in progress → locked/completed → Stage 04. Timing/content failures
  remain in Stage 03.

## 3.14 Audit
- Lock and workflow transition require audit; exact events are **UNVERIFIED**.

## 3.15 Error States
- Missing verified question, invalid timing/content, OCC conflict, AI/network
  failure, unauthorized lock, and duplicate lock.

## 3.16 Empty States
- No eligible video: explain prerequisite Stage 02 approval. Empty script opens
  the section editor; loading and errors remain distinct.

## 3.17 Next Action
- Lock leads to recording workspace; unsaved or invalid scripts cannot progress.

## 3.18 Role Visibility
- Scriptwriter/content creator edits; content manager supervises. Lock capability
  is backend-enforced; read-only reviewers cannot edit.

## 3.19 Performance
- Load the selected video once, debounce derived timing, and avoid duplicate
  saves. Measurable target: **TBD**.

## 3.20 Acceptance Criteria
- Route and script service tests exist; timing, lock, audit, and E2E coverage are
  **UNVERIFIED**.
