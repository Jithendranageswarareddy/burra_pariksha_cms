# Stage 14 — Performance Review

## 3.1 Page Identity
- Analytics/social analytics workspaces (`/analytics` and `/social-analytics`);
  service ownership is shared; **Reviewed**. Related FC-020/FC-021.

## 3.2 Purpose
- Interpret retention and engagement, identify confusion/drop-off patterns, and
  record editorial review.

## 3.3 Entry Condition
- Stage 13 snapshot and reviewer capability.

## 3.4 Required Data
- Metrics, retention curves, comments/quality signals, review notes, directives,
  and content/workflow identity.

## 3.5 GET Requests
- Analytics and intelligence APIs load metrics/comments; exact endpoint list
  **UNVERIFIED**.

## 3.6 User Inputs
- Review findings, classifications, notes, and finalize/request-follow-up action.

## 3.7 Defaults
- Latest available snapshot and standard review window; exact defaults **UNVERIFIED**.

## 3.8 Primary Action
- Finalize a performance record; this does not silently create or approve future
  content.

## 3.9 API Request
- Analytics/review service submits notes and evidence IDs; backend validates actor
  and snapshot freshness.

## 3.10 Backend Use Case
- Performance/intelligence services, analytics repository, workflow, audit.

## 3.11 Response
- Returns finalized review and identified recommendations; partial analytics remain
  explicitly partial.

## 3.12 Persistence
- `PerformanceRecord` and review evidence persist in Firestore; exact collection
  and transaction semantics **UNVERIFIED**.

## 3.13 Workflow State
- Stage 14 in progress → finalized → Stage 15; stale/missing evidence blocks.

## 3.14 Audit
- Finalization, reviewer, evidence, and recommendations require audit; exact events
  **UNVERIFIED**.

## 3.15 Error States
- Missing snapshot, stale metrics, invalid notes, unauthorized finalization,
  OCC/network failure, and duplicate finalize.

## 3.16 Empty States
- No content/snapshot/no signals are distinct explanations; no signal is not a
  failed request.

## 3.17 Next Action
- Finalized review feeds Intelligence Loop; unresolved evidence stays in Stage 14.

## 3.18 Role Visibility
- Analytics/performance reviewers edit; broader authorized users view; backend gates.

## 3.19 Performance
- Aggregate server-side, defer heavy charts/comments, and cache snapshots. Target: **TBD**.

## 3.20 Acceptance Criteria
- Analytics/social services provide related operations. Review persistence, audit,
  and end-to-end coverage are **UNVERIFIED**.
