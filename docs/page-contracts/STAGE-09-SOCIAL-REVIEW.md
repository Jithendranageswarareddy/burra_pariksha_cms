# Stage 09 — Social Review

## 3.1 Page Identity
- Routes `/social-review` and `/social-review/:reviewId`; `SocialReviewPage` and
  `SocialReviewWorkspace`; **Reviewed**. Related FC-014.
- Evidence: [`frontend/app/App.tsx`](../../frontend/app/App.tsx),
  [`frontend/pages/SocialReviewPage.tsx`](../../frontend/pages/SocialReviewPage.tsx),
  [`frontend/components/social/SocialReviewWorkspace.tsx`](../../frontend/components/social/SocialReviewWorkspace.tsx),
  [`backend/features/analytics/services/social-review.service.ts`](../../backend/features/analytics/services/social-review.service.ts),
  [`docs/features/FC-014-SOCIAL-REVIEW-COMPLIANCE.md`](../features/FC-014-SOCIAL-REVIEW-COMPLIANCE.md),
  [`docs/architecture/07-CANONICAL-15-STEP-WORKFLOW.md`](../architecture/07-CANONICAL-15-STEP-WORKFLOW.md).

## 3.2 Purpose
- Review mobile presentation, copy, hashtags, and pinned comment before scheduling.

## 3.3 Entry Condition
- Package/assets are available and reviewer is authorized.

## 3.4 Required Data
- Review bundle, video/thumbnail references, platform copy, hashtags, pinned
  comment, checklist, status, and reviewer.

## 3.5 GET Requests
- Social-review APIs load queue/bundle; exact request routes **UNVERIFIED**.

## 3.6 User Inputs
- Platform copy, hashtags, pinned comment, checklist, remarks, approve/changes.

## 3.7 Defaults
- Existing package metadata and platform presets; exact defaults **UNVERIFIED**.

## 3.8 Primary Action
- Approve or request changes. Approval does not schedule/publish.

## 3.9 API Request
- Social review service accepts review ID, checklist, remarks, and expected state.

## 3.10 Backend Use Case
- Analytics/social review service, workflow, authorization, audit, repository.

## 3.11 Response
- Returns review status; approved package enables Publishing Setup.

## 3.12 Persistence
- `SocialReviewPackageBundle`/review metadata persists in Firestore; exact schema
  **UNVERIFIED**.

## 3.13 Workflow State
- Pending → approved or changes requested; backend maps status to Stage 09 state.

## 3.14 Audit
- Decision, actor, package, and changes must be audited; exact events **UNVERIFIED**.

## 3.15 Error States
- Missing asset, invalid copy, unauthorized decision, stale review, network/API
  failure, and duplicate decision.

## 3.16 Empty States
- Empty review queue is distinct from unavailable package data and unauthorized access.

## 3.17 Next Action
- Approval proceeds to `/publishing`/package setup; changes remain in review.

## 3.18 Role Visibility
- Social/content managers review; publishers consume; backend enforces capabilities.

## 3.19 Performance
- Paginate review queue, defer previews, prevent duplicate loads. Target: **TBD**.

## 3.20 Acceptance Criteria
- Routes and workspace exist. Checklist persistence, audit, permissions, and E2E
  coverage are **UNVERIFIED**.
