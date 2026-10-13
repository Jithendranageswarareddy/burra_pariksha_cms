# Stage 15 — Intelligence Loop

## 3.1 Page Identity
- The mounted frontend route is `/analytics/intelligence`; it renders
  `AnalyticsExperiencePage`. The backend also exposes report detail at
  `/api/analytics/intelligence/:id`; that is not a mounted frontend route.
  Contract status: **Reviewed**.
- Evidence: [`frontend/app/App.tsx`](../../frontend/app/App.tsx),
  [`frontend/pages/AnalyticsExperiencePage.tsx`](../../frontend/pages/AnalyticsExperiencePage.tsx),
  [`frontend/api/api-client.ts`](../../frontend/api/api-client.ts),
  [`backend/server/routers/routes.ts`](../../backend/server/routers/routes.ts),
  [`docs/features/FC-019-ASSISTIVE-AI-PIPELINE.md`](../features/FC-019-ASSISTIVE-AI-PIPELINE.md),
  [`docs/features/FC-021-CONTENT-INTELLIGENCE-STRATEGY.md`](../features/FC-021-CONTENT-INTELLIGENCE-STRATEGY.md).

## 3.2 Purpose
- Generate persisted social-performance intelligence reports and expose strategy
  recommendations. A human approval workflow for a separate `IntelligenceInsight`
  entity is **UNVERIFIED**; AI output remains advisory.

## 3.3 Entry Condition
- The verified API path requires authentication and intelligence capability.
  A finalized Performance Review prerequisite is an architecture requirement and
  is **UNVERIFIED** in the mounted page/API path.
  [`backend/server/routers/routes.ts`](../../backend/server/routers/routes.ts)

## 3.4 Required Data
- Report generation queries analytics records and accepts optional content,
  platform, date, topic, and subtopic filters. Reviewer decision and directive
  data are not runtime-proven inputs for this path.
  [`backend/features/analytics/services/social-performance-intelligence.service.ts`](../../backend/features/analytics/services/social-performance-intelligence.service.ts)

## 3.5 GET Requests
- `GET /api/analytics/intelligence?limit=...` returns report summaries.
  `GET /api/analytics/intelligence/:id` returns one report or 404.
  [`frontend/api/api-client.ts`](../../frontend/api/api-client.ts),
  [`backend/server/routers/routes.ts`](../../backend/server/routers/routes.ts)

## 3.6 User Inputs
- Verified inputs are report-generation filters. Editing directives,
  approving/rejecting insights, and linking future-cycle context are
  **UNVERIFIED** for this page.

## 3.7 Defaults
- The report-list API defaults `limit` to 20. Latest finalized performance
  selection and approval defaults are **UNVERIFIED**.
  [`frontend/api/api-client.ts`](../../frontend/api/api-client.ts),
  [`backend/server/routers/routes.ts`](../../backend/server/routers/routes.ts)

## 3.8 Primary Action
- The verified implementation generates a report with
  `POST /api/analytics/intelligence` and persists it. Human approval/rejection
  and context seeding are architecture requirements, not verified runtime
  actions.
  [`backend/server/routers/routes.ts`](../../backend/server/routers/routes.ts),
  [`backend/features/analytics/services/social-performance-intelligence.service.ts`](../../backend/features/analytics/services/social-performance-intelligence.service.ts)

## 3.9 API Request
- Verified requests are the report-list/detail GETs and report-generation POST.
  `/api/ai/strategy-recommendations/apply` applies parameters for Question
  Studio and does not create production records. Human-in-loop approval is
  **UNVERIFIED**.
  [`frontend/api/api-client.ts`](../../frontend/api/api-client.ts),
  [`backend/server/routers/routes.ts`](../../backend/server/routers/routes.ts),
  [`backend/features/analytics/services/social-performance-intelligence.service.ts`](../../backend/features/analytics/services/social-performance-intelligence.service.ts)

## 3.10 Backend Use Case
- `SocialPerformanceIntelligenceService` queries analytics, computes summaries,
  invokes advisory AI, constructs a `SocialPerformanceIntelligenceRecord`, and
  appends it through `IntelligenceRepository`. Comment intelligence is a
  separate service path. Workflow transition and approval use cases are
  **UNVERIFIED**.
  [`backend/features/analytics/services/social-performance-intelligence.service.ts`](../../backend/features/analytics/services/social-performance-intelligence.service.ts),
  [`database/firestore/repositories/intelligence.repository.ts`](../../database/firestore/repositories/intelligence.repository.ts)

## 3.11 Response
- Report generation returns `{ success, record }` on success and
  `{ success: false, error }` on service failure. List returns `{ success,
  count, reports }`; detail returns `{ success, report }` or 404.
  [`backend/server/routers/routes.ts`](../../backend/server/routers/routes.ts)
  Directive/approval response behavior is **UNVERIFIED**.

## 3.12 Persistence
- `SocialPerformanceIntelligenceRecord` is appended to the Firestore collection
  `social_performance_intelligence` and includes evidence traceability and AI
  provenance. A separate canonical `IntelligenceInsight` or durable directive
  entity is **UNVERIFIED**.
  [`database/firestore/repositories/intelligence.repository.ts`](../../database/firestore/repositories/intelligence.repository.ts),
  [`backend/features/analytics/services/social-performance-intelligence.service.ts`](../../backend/features/analytics/services/social-performance-intelligence.service.ts)

## 3.13 Workflow State
- The canonical workflow requires a future Stage 01 context loop without
  bypassing Stage 01. No verified Stage 14 → Stage 15 approval transition or
  Stage 15 → Stage 01 context transition was found in this path; runtime
  transition/loop behavior is **UNVERIFIED**.
  [`docs/architecture/07-CANONICAL-15-STEP-WORKFLOW.md`](../architecture/07-CANONICAL-15-STEP-WORKFLOW.md)

## 3.14 Audit
- Report generation emits `CREATE_INTELLIGENCE_REPORT`; comment intelligence
  emits `GENERATE_COMMENT_INTELLIGENCE`. Audit failures are explicitly
  non-blocking. Human decision, directive linkage, and provenance audit events
  are **UNVERIFIED**.
  [`backend/features/analytics/services/social-performance-intelligence.service.ts`](../../backend/features/analytics/services/social-performance-intelligence.service.ts),
  [`backend/features/analytics/services/comment-intelligence.service.ts`](../../backend/features/analytics/services/comment-intelligence.service.ts)

## 3.15 Error States
- Verified report generation handles no analytics records as an unsuccessful
  result and route failures as HTTP 400/500 responses. Other listed states,
  including self-approval, duplicate approval, and OCC conflicts, are
  **UNVERIFIED**.
  [`backend/features/analytics/services/social-performance-intelligence.service.ts`](../../backend/features/analytics/services/social-performance-intelligence.service.ts),
  [`backend/server/routers/routes.ts`](../../backend/server/routers/routes.ts)

## 3.16 Empty States
- No analytics records produces an unsuccessful generation result. A finalized
  review prerequisite, manual analysis action, and no-data approval behavior are
  **UNVERIFIED**.

## 3.17 Next Action
- The verified strategy-application path returns applied parameters for Question
  Studio and explicitly does not mutate questions or create production data.
  An approved Stage 15 directive becoming Stage 01 context is **UNVERIFIED**.
  [`backend/features/analytics/services/social-performance-intelligence.service.ts`](../../backend/features/analytics/services/social-performance-intelligence.service.ts)

## 3.18 Role Visibility
- Report list/generation routes require authentication and permit ADMIN,
  CONTENT_MANAGER, ANALYTICS_VIEWER, CREATOR, and PUBLISHING_MANAGER. The
  report-detail handler visibly requires authentication but has no visible
  `requireRole` call. Human approval roles and page button visibility are
  **UNVERIFIED**.
  [`backend/server/routers/routes.ts`](../../backend/server/routers/routes.ts)

## 3.19 Performance
- The service performs analytics aggregation and AI generation synchronously for
  the request. No measured target, caching proof, or duplicate-approval behavior
  was verified. Target: **TBD**.
  [`backend/features/analytics/services/social-performance-intelligence.service.ts`](../../backend/features/analytics/services/social-performance-intelligence.service.ts)

## 3.20 Acceptance Criteria
- Report generation, retrieval, Firestore persistence, provenance fields, and
  generation audit are implemented in the cited path. Human approval, durable
  directives, Stage 01 feedback, workflow completion, and end-to-end coverage
  remain **UNVERIFIED**.

### Claim-level evidence register
- Frontend route: [`frontend/app/App.tsx`](../../frontend/app/App.tsx) mounts
  `/analytics/intelligence`; it does not mount `:id` (**IMPLEMENTED**).
- Report API and handlers: [`frontend/api/api-client.ts`](../../frontend/api/api-client.ts)
  and [`backend/server/routers/routes.ts`](../../backend/server/routers/routes.ts)
  (**IMPLEMENTED**).
- Report generation, `social_performance_intelligence` persistence, provenance,
  and generation audit: [`backend/features/analytics/services/social-performance-intelligence.service.ts`](../../backend/features/analytics/services/social-performance-intelligence.service.ts)
  and [`database/firestore/repositories/intelligence.repository.ts`](../../database/firestore/repositories/intelligence.repository.ts)
  (**IMPLEMENTED**).
- Human approval/rejection, durable directives, canonical Stage 01 feedback,
  complete workflow transitions, and E2E coverage are **UNVERIFIED**. Intended
  requirements are [`docs/features/FC-019-ASSISTIVE-AI-PIPELINE.md`](../features/FC-019-ASSISTIVE-AI-PIPELINE.md),
  [`docs/features/FC-021-CONTENT-INTELLIGENCE-STRATEGY.md`](../features/FC-021-CONTENT-INTELLIGENCE-STRATEGY.md),
  and [`docs/architecture/07-CANONICAL-15-STEP-WORKFLOW.md`](../architecture/07-CANONICAL-15-STEP-WORKFLOW.md).
