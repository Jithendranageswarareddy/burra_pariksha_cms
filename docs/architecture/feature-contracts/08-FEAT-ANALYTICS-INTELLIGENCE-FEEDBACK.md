# Feature Contract: FEAT-08 Analytics & Feedback Closed-Loop

**Feature ID:** `FEAT-08`  
**Feature Name:** Analytics & Feedback Closed-Loop  
**Workflow Steps:** Step 13 (Analytics Ingestion), Step 14 (Performance Evaluation) & Step 15 (Feedback Loop to Step 01)  
**Primary Hub:** Intelligence Hub (`/intelligence/analytics`)  
**Status:** `ACCEPTED — COMPLETE — CLOSED`  
**Version:** `1.1.0`

---

### 1. Requirement & Business Objective
- **Problem Statement:** Ingest YouTube Shorts analytics (views, watch time, retention curve, CTR, likes, shares), evaluate topic/format performance, and feed quantitative signals back into Step 01 Question Authoring.
- **Goal:** Close the manufacturing loop with data-driven difficulty balancing and topic demand scoring.

### 2. Business Acceptance Criteria
- Automated ingestion of YouTube analytics snapshots every 24 hours.
- Performance scoring algorithm calculating Retention Factor ($R_f$) and Virality Index ($V_i$).
- Closed-loop feedback: generates recommended question topics and difficulty adjustments for Question Studio.

### 3. Domain Entities
- `AnalyticsSnapshotEntity`, `PerformanceScoreRecord`, `FeedbackSignalEntity`, `TopicDemandMetric`.

### 4. Database Persistence
- **Collection:** `analytics_snapshots`, `topic_metrics`, `feedback_signals`
- **Keys:** `snapshotId` (UUID v4), `videoId`, `topicId`
- **Indexes:** `videoId + period`, `topicId + score`
- **Concurrency:** Append-only time series; OCC for feedback aggregate records.

### 5. API Contract
- **Ingestion Path:** `POST /api/v1/analytics/sync` (Step 13)
- **Feedback Path:** `GET /api/v1/intelligence/signals` (Step 15)
- **Envelope:** `ApiResponseEnvelope<AnalyticsResponsePayload>`

### 6. Frontend Workspace
- **Hub:** Intelligence Hub (`/intelligence/analytics`)
- **Layout:** Retention curve chart, topic heatmap matrix, engagement leaderboards, and AI recommendations drawer.

### 7. RBAC & Access Control
- **Required Capability:** `analytics:view` (View metrics), `intelligence:admin` (Manage feedback rules)
- **Allowed Roles:** `ANALYST`, `PRODUCER`, `ADMIN`, `SUPER_ADMIN`

### 8. Workflow Transition
- **Step Sequence:** Step 12 (Published) $\to$ Step 13 (Analytics Ingested) $\to$ Step 14 (Evaluated) $\to$ Step 15 (Feedback Loop)
- **Initial Status:** `PUBLISHED`
- **Target Status:** `ANALYTICS_ACTIVE` / `FEEDBACK_EMITTED`
- **Human Gate:** Optional automated loop; executive review gate for systemic curriculum changes.

### 9. Validation Schemas
- **Schema:** `AnalyticsSnapshotSchema`, `FeedbackSignalSchema` (Zod)
- **Rules:** Non-negative views/likes, retention percentage between 0 and 100%, valid ISO dates.

### 10. Error Handling & Codes
- `ERR_ANALYTICS_API_UNAVAILABLE` (503 Service Unavailable)
- `ERR_METRIC_OUT_OF_BOUNDS` (422 Unprocessable Entity)
- `ERR_FEEDBACK_LOOP_CYCLE` (409 Conflict)

### 11. Audit & Observability
- **Audit Event:** `AUDIT_ANALYTICS_INGESTED`, `AUDIT_FEEDBACK_SIGNAL_GENERATED`
- **Severity:** `INFO`
- **Payload:** Video ID, View Count, Average View Duration, Topic ID, Signal Weight.

### 12. Realtime SSE Events
- **Topic:** `analytics.updated`
- **Payload:** `{ videoId, views: 12500, retentionPct: 78.4, timestamp: "2026-10-02T..." }`

### 13. Test Matrix Coverage
- 9 universal scenarios verified, including handling partial analytics records and metric aggregation recovery.

### 14. Deployment & Infrastructure
- Cloud Run Node.js service, YouTube Analytics API v2, Cloud Tasks recurring sync cron, Firestore Native mode.

### 15. Rollback Safety Net
- Delete invalid analytics snapshot, recalculate aggregate topic weights from previous good state.
