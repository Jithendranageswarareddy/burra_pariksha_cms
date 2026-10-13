# Stage 04 — Teleprompter & Filming

## 3.1 Page Identity
- Shared route `/videos/:videoId?tab=recording`; `RecordingWorkspace`/video
  production services; **Reviewed**. Related FC-009.
- Evidence: [`frontend/app/App.tsx`](../../frontend/app/App.tsx),
  [`frontend/components/video/RecordingWorkspace.tsx`](../../frontend/components/video/RecordingWorkspace.tsx),
  [`backend/features/production/services/video-production.service.ts`](../../backend/features/production/services/video-production.service.ts),
  [`docs/features/FC-009-TELEPROMPTER-FILMING-STUDIO.md`](../features/FC-009-TELEPROMPTER-FILMING-STUDIO.md),
  [`docs/architecture/07-CANONICAL-15-STEP-WORKFLOW.md`](../architecture/07-CANONICAL-15-STEP-WORKFLOW.md).

## 3.2 Purpose
- Present the locked script and record/log multiple takes. Editing is out of scope.

## 3.3 Entry Condition
- Stage 03 script ready and authenticated studio operator.

## 3.4 Required Data
- Locked script, video, take list, recording state, and media metadata.

## 3.5 GET Requests
- Typed video APIs load script/video/takes; exact endpoints and polling model are
  **UNVERIFIED**.

## 3.6 User Inputs
- Teleprompter controls, take start/stop, take notes, and selected take. Raw
  binary storage is not a frontend responsibility.

## 3.7 Defaults
- First take and configured scroll/pacing defaults; exact values **UNVERIFIED**.

## 3.8 Primary Action
- Record and finalize a take. Finalization must not imply edit/QC/publish.

## 3.9 API Request
- Video production API sends take metadata and status transitions; authentication,
  validation, and duplicate handling are backend-owned.

## 3.10 Backend Use Case
- Video production service, media integration, workflow service, and repository.

## 3.11 Response
- Take metadata and recording state return; completed recording enables Stage 05.

## 3.12 Persistence
- `VideoTake`/video metadata and external media references persist in Firestore;
  binary media remains externalized. Exact transaction behavior **UNVERIFIED**.

## 3.13 Workflow State
- Recording in progress → recorded → Stage 05. Missing take blocks progression.

## 3.14 Audit
- Take creation/finalization and stage transition require audit; event names
  **UNVERIFIED**.

## 3.15 Error States
- Missing script, device/media failure, upload failure, unauthorized transition,
  duplicate finalization, and network/OCC errors.

## 3.16 Empty States
- No takes: first-take guidance. No eligible script: prerequisite explanation.

## 3.17 Next Action
- Finalized take proceeds to raw-video handoff; user remains on page after a
  recoverable take/upload failure.

## 3.18 Role Visibility
- Studio operator records; production leads supervise; backend controls transition.

## 3.19 Performance
- Avoid polling duplicates, show recording/upload progress, and defer take history.
  Target: **TBD**.

## 3.20 Acceptance Criteria
- Recording route/workspace exists. Multi-take, media failure, audit, and E2E
  assertions are **UNVERIFIED**.
