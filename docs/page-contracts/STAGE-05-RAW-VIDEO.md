# Stage 05 — Raw Video

## 3.1 Page Identity
- Shared production/video detail workspace; canonical route is represented by
  `/videos/:videoId` with recording/raw context; **Reviewed**. Related FC-010.
- Evidence: [`frontend/app/App.tsx`](../../frontend/app/App.tsx),
  [`frontend/pages/VideoDetailPage.tsx`](../../frontend/pages/VideoDetailPage.tsx),
  [`backend/features/production/services/video.service.ts`](../../backend/features/production/services/video.service.ts),
  [`docs/features/FC-010-MEDIA-STORAGE-RAW-VIDEO.md`](../features/FC-010-MEDIA-STORAGE-RAW-VIDEO.md),
  [`docs/architecture/07-CANONICAL-15-STEP-WORKFLOW.md`](../architecture/07-CANONICAL-15-STEP-WORKFLOW.md).

## 3.2 Purpose
- Register and hand off raw footage and external media metadata to editing.

## 3.3 Entry Condition
- A recorded take exists and the actor has media-handoff capability.

## 3.4 Required Data
- Video/take identity, Drive file/folder references, upload state, checksum or
  metadata where available, and handoff status.

## 3.5 GET Requests
- Video and media metadata load through typed video APIs; exact endpoint list,
  download behavior, and retry policy are **UNVERIFIED**.

## 3.6 User Inputs
- Take selection, external file/folder registration, metadata, and handoff
  confirmation. Binary transfer is handled by backend/integrations.

## 3.7 Defaults
- Current recorded take is the default candidate; absent media has no valid
  default and blocks handoff.

## 3.8 Primary Action
- Register/confirm raw footage and hand off to editing; no QC or publishing side
  effect is permitted.

## 3.9 API Request
- Media/video API sends references and handoff command; backend validates ownership,
  file metadata, and workflow state.

## 3.10 Backend Use Case
- Video production service, Google Drive integration, workflow, audit, repository.

## 3.11 Response
- Returns registered media reference and Stage 05 completion/handoff state.

## 3.12 Persistence
- Media metadata is Firestore-authoritative; raw binary is externalized in Drive
  per architecture. Exact collection names are **UNVERIFIED**.

## 3.13 Workflow State
- Recorded/in progress → raw handoff completed → Stage 06. Missing reference blocks.

## 3.14 Audit
- Registration, handoff, and external integration outcome require audit; exact
  event names **UNVERIFIED**.

## 3.15 Error States
- Missing take, invalid file, Drive outage, upload timeout, stale entity,
  duplicate registration, and unauthorized handoff.

## 3.16 Empty States
- No recorded take: explain Stage 04 prerequisite. No media: provide registration
  action, not a false empty-success state.

## 3.17 Next Action
- Handoff opens editing context; failed external operations remain retryable when
  idempotent and do not advance workflow.

## 3.18 Role Visibility
- Media/production operators edit; editors consume; backend enforces capability.

## 3.19 Performance
- Show upload progress, avoid duplicate transfer requests, and load metadata
  before large binary operations. Target: **TBD**.

## 3.20 Acceptance Criteria
- Drive/media service and video routes are present. Handoff, checksum, audit, and
  integration tests are **UNVERIFIED**.
