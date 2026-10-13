# Stage 10 — Publishing Setup

## 3.1 Page Identity
- Routes `/publishing` and `/platform-packages/:videoId`; publishing/package
  components and services; **Reviewed**. Related FC-015.
- Evidence: [`frontend/app/App.tsx`](../../frontend/app/App.tsx),
  [`frontend/pages/PublishingPage.tsx`](../../frontend/pages/PublishingPage.tsx),
  [`frontend/pages/PlatformPackagesPage.tsx`](../../frontend/pages/PlatformPackagesPage.tsx),
  [`backend/features/publishing/services/publishing.service.ts`](../../backend/features/publishing/services/publishing.service.ts),
  [`docs/features/FC-015-PUBLISHING-PACKAGE-SCHEDULING.md`](../features/FC-015-PUBLISHING-PACKAGE-SCHEDULING.md),
  [`docs/architecture/07-CANONICAL-15-STEP-WORKFLOW.md`](../architecture/07-CANONICAL-15-STEP-WORKFLOW.md).

## 3.2 Purpose
- Prepare platform-specific metadata, assignments, and schedule after social approval.

## 3.3 Entry Condition
- Approved social review and required media/package assets.

## 3.4 Required Data
- Video, thumbnail, platform package fields, schedule, channel/account, status,
  and assignment.

## 3.5 GET Requests
- Publishing APIs load packages and schedules; exact route list **UNVERIFIED**.

## 3.6 User Inputs
- Platform metadata, schedule, assignments, and readiness confirmation.

## 3.7 Defaults
- Platform presets and existing package values; exact defaults **UNVERIFIED**.

## 3.8 Primary Action
- Finalize/schedule package. It must not mark a publication live.

## 3.9 API Request
- Publishing service APIs send package/schedule payload and expected version;
  server validates platform requirements and permissions.

## 3.10 Backend Use Case
- Publishing service, platform adaptation, workflow, audit, repository.

## 3.11 Response
- Returns scheduled package/status; invalid platforms return field-level errors.

## 3.12 Persistence
- `PublishingPackage` metadata persists in Firestore; external platform calls are
  integrations. Exact transaction semantics **UNVERIFIED**.

## 3.13 Workflow State
- Setup → scheduled/Stage 10 complete → Stage 11; incomplete packages remain setup.

## 3.14 Audit
- Package finalization, schedule, and assignment require audit; event names **UNVERIFIED**.

## 3.15 Error States
- Missing approvals, invalid platform fields, duplicate schedule, external API,
  OCC/network failure, and unauthorized publish preparation.

## 3.16 Empty States
- No packages: explain Social Review prerequisite; no platform selection is not
  a failed API response.

## 3.17 Next Action
- Scheduled package proceeds to publication execution; user remains for correction
  when validation fails.

## 3.18 Role Visibility
- Publishing manager configures; reviewers may view; backend gates scheduling.

## 3.19 Performance
- Load packages by video, debounce edits, and prevent duplicate schedule calls.
  Target: **TBD**.

## 3.20 Acceptance Criteria
- Publishing/package routes and services exist. Schedule idempotency, audit, and
  platform integration tests are **UNVERIFIED**.

### Claim-level evidence register
- Route/pages: [`frontend/app/App.tsx`](../../frontend/app/App.tsx) and [`frontend/pages/PublishingPackagePage.tsx`](../../frontend/pages/PublishingPackagePage.tsx) (**IMPLEMENTED**).
- Publishing service/API: [`backend/features/publishing/services/publishing.service.ts`](../../backend/features/publishing/services/publishing.service.ts) (**IMPLEMENTED**); exact GET/response, schedule persistence, and idempotency are **UNVERIFIED**.
- Scheduling, roles, workflow, audit, and platform requirements: [`shared/constants/workflow.ts`](../../shared/constants/workflow.ts) and [`docs/features/FC-015-PUBLISHING-PACKAGE-SCHEDULING.md`](../features/FC-015-PUBLISHING-PACKAGE-SCHEDULING.md); runtime enforcement is **UNVERIFIED**.
