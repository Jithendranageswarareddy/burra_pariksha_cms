# Stage 13 — Analytics

## 3.1 Page Identity
- `/analytics` and `AnalyticsExperiencePage`; analytics services; **Reviewed**.
  Related FC-020.
- Evidence: [`frontend/app/App.tsx`](../../frontend/app/App.tsx),
  [`frontend/pages/AnalyticsExperiencePage.tsx`](../../frontend/pages/AnalyticsExperiencePage.tsx),
  [`backend/features/analytics/services/analytics.service.ts`](../../backend/features/analytics/services/analytics.service.ts),
  [`docs/features/FC-020-TELEMETRY-PERFORMANCE-DECILES.md`](../features/FC-020-TELEMETRY-PERFORMANCE-DECILES.md),
  [`docs/architecture/07-CANONICAL-15-STEP-WORKFLOW.md`](../architecture/07-CANONICAL-15-STEP-WORKFLOW.md).

## 3.2 Purpose
- Ingest and display audience telemetry for published content.

## 3.3 Entry Condition
- Published/reconciled content and analytics-view capability.

## 3.4 Required Data
- Content/publication IDs, 24h/7d metrics, retention, engagement, platform,
  ingestion status, and snapshots.

## 3.5 GET Requests
- Analytics APIs load snapshots and intelligence; exact endpoint details **UNVERIFIED**.

## 3.6 User Inputs
- Content/platform/date filters, refresh, and ingestion trigger where allowed.

## 3.7 Defaults
- Current content and standard 24h/7d windows per architecture; exact UI defaults
  **UNVERIFIED**.

## 3.8 Primary Action
- Refresh or ingest telemetry; analytics actions do not alter publication state.

## 3.9 API Request
- Analytics service functions request snapshots/ingestion; backend controls provider
  credentials, rate limits, and authorization.

## 3.10 Backend Use Case
- Analytics service, provider integrations, snapshot repository, audit/job handling.

## 3.11 Response
- Returns snapshot, freshness, partial-provider status, and metrics; stale data is
  labelled rather than presented as current.

## 3.12 Persistence
- `AnalyticsSnapshot` is Firestore-authoritative for application records; provider
  telemetry remains external until ingestion.

## 3.13 Workflow State
- Stage 13 ingested → Stage 14 eligible; missing/stale telemetry does not complete.

## 3.14 Audit
- Manual ingestion/configuration requires audit; scheduled job audit is **UNVERIFIED**.

## 3.15 Error States
- Provider outage/rate limit, partial data, invalid filters, stale snapshot, auth,
  and network failures.

## 3.16 Empty States
- No published content, no snapshot, and no matching filters are separate states.

## 3.17 Next Action
- Complete snapshot enables Performance Review; user may remain to inspect trends.

## 3.18 Role Visibility
- Analytics viewers/readers view; authorized analytics operators trigger ingestion.

## 3.19 Performance
- Paginate/aggregate large datasets, defer charts, cache snapshots, and show
  freshness. Target: **TBD**.

## 3.20 Acceptance Criteria
- Analytics page/services exist. Snapshot freshness, provider integration, audit,
  and performance assertions are **UNVERIFIED**.
