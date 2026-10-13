# Stage 06 — Editing Bay

## 3.1 Page Identity
- Shared route `/videos/:videoId?tab=editing`; `EditingWorkspace`; **Reviewed**.
  Related FC-011.
- Evidence: [`frontend/app/App.tsx`](../../frontend/app/App.tsx),
  [`frontend/components/video/EditingWorkspace.tsx`](../../frontend/components/video/EditingWorkspace.tsx),
  [`backend/features/production/services/video-production.service.ts`](../../backend/features/production/services/video-production.service.ts),
  [`docs/features/FC-011-EDITING-BAY-TIMELINE.md`](../features/FC-011-EDITING-BAY-TIMELINE.md),
  [`docs/architecture/07-CANONICAL-15-STEP-WORKFLOW.md`](../architecture/07-CANONICAL-15-STEP-WORKFLOW.md).

## 3.2 Purpose
- Assemble the master cut and production overlays from raw media.

## 3.3 Entry Condition
- Raw handoff completed and editor capability granted.

## 3.4 Required Data
- Raw media references, timeline/edit metadata, captions, graphics, audio, and
  current video status.

## 3.5 GET Requests
- Typed video APIs load the video and edit context; exact endpoints/polling are
  **UNVERIFIED**.

## 3.6 User Inputs
- Timeline metadata, captions, overlays, audio settings, preview, and save/submit
  controls. Source binaries remain outside the frontend datastore.

## 3.7 Defaults
- Existing raw asset and edit preset where configured; exact preset values **UNVERIFIED**.

## 3.8 Primary Action
- Save edit metadata and submit a master cut for Final QC; submission does not
  certify QC or publish.

## 3.9 API Request
- Video API/update service sends edit metadata and expected version; backend validates.

## 3.10 Backend Use Case
- Video service, media integration, workflow, repository, and audit.

## 3.11 Response
- Returns edit version/status; valid master cut enables Stage 07.

## 3.12 Persistence
- `VideoEdit` metadata/version is Firestore-backed; rendered media is external.
  Transaction details **UNVERIFIED**.

## 3.13 Workflow State
- Editing → edited/master cut → final review; invalid or missing raw media blocks.

## 3.14 Audit
- Master-cut submission and transition require audit; exact events **UNVERIFIED**.

## 3.15 Error States
- Missing raw asset, render failure, invalid media, OCC/network errors, and
  unauthorized status change.

## 3.16 Empty States
- No raw asset: prerequisite explanation. Empty timeline: editor starter state;
  loading and render failure are distinct.

## 3.17 Next Action
- Submit leads to Final QC; failed render remains in editing.

## 3.18 Role Visibility
- Editors modify; production leads/reviewers view; QC approval is separate.

## 3.19 Performance
- Defer previews/renders, prevent duplicate saves, and show render progress.
  Target: **TBD**.

## 3.20 Acceptance Criteria
- Editing workspace/status route exists. Render, persistence, audit, and E2E
  coverage are **UNVERIFIED**.
