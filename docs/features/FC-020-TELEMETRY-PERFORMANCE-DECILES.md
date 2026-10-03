# FEATURE CONTRACT: FC-020-TELEMETRY-PERFORMANCE-DECILES

## 1. Feature Identity
- **Feature ID**: FC-020
- **Feature Name**: Platform Telemetry & Performance Deciles
- **Business Area**: Analytics & Business Intelligence / Performance Tracking
- **Contract Version**: 1.0.0
- **Status**: APPROVED
- **Priority**: P2 (Analytics & Feedback)
- **Owner / Domain**: Analytics Bounded Context
- **Related Workflow Stage(s)**: Steps 13 (Analytics) & 14 (Performance Review)

---

## 2. Requirement
- **Business Requirement**: BR-010 (Post-Publish Performance Telemetry) & NFR-008 (Strict Operational vs. Analytical Data Segregation).
- **User Problem**: Creators have no visibility into how published videos perform across platforms, making it impossible to identify high-retention question formats or underperforming topics.
- **Business Purpose**: Ingest performance metrics (views, watch time, likes, shares, average percentage viewed) from YouTube and Instagram APIs, store them in normalized timeseries collections, compute performance decile rankings (D1..D10), and present analytical dashboards.
- **Expected Capability**:
  - Scheduled telemetry harvester worker fetching metrics for published videos at 24h, 48h, 7d, and 30d milestones.
  - Timeseries datastore `analytics_timeseries` recording timestamped snapshots.
  - Normalization engine computing composite score and decile ranking ($D_1 = \text{Top 10\%}, \dots, D_{10} = \text{Bottom 10\%}$).
  - Analytics Hub UI (`/analytics`) with interactive metric charts and decile distribution tables.
  - Strict segregation: Analytical data is read-only for operational workflows.
  - Workflow transitions: Step 13 (`ANALYTICS_INGESTED`) $\to$ Step 14 (`PERF_EVALUATED`).
- **Scope**: Telemetry harvesting, timeseries persistence, decile calculation, analytics dashboard UI.
- **Explicit Non-Scope**: Closed-loop topic recommendations (FC-021).

---

## 3. Business Acceptance
- **Happy-Path Acceptance**:
  - Published video reaches 24h post-release. Harvester queries YouTube Analytics API and captures views, watch time, and retention.
  - Snapshot saved to `analytics_timeseries`. Item transitions to Step 13.
  - Batch decile job calculates relative rank across all videos in the same subject category and assigns decile $D_1 \dots D_{10}$.
  - Item transitions to Step 14 with `workflowStatus = PERF_EVALUATED`.
- **Segregation Acceptance**:
  - Analytics calculations can fail or be delayed without interrupting live question authoring, video editing, or publishing pipelines.
- **Cost Acceptance**:
  - Harvesting runs in daily batches, consuming $< 500$ YouTube API quota units/day, well within the 10,000 daily free limit.
- **Audit Acceptance**:
  - `METRICS_INGESTED` and `PERFORMANCE_DECILE_ASSIGNED` logged with video ID and decile rank.

---

## 4. Domain Entities
- **Entities Involved**: `Publication`, `AnalyticsSnapshot`, `PerformanceDecile`, `MetricAggregation`.
- **Entity Ownership**: Analytics Bounded Context.
- **Relationships**: A `Publication` has multiple historical `AnalyticsSnapshot` records and one active `PerformanceDecile`.
- **Versions**: Schema v1.0.
- **Immutable Fields**: `id`, `publicationId`, `capturedAt`, `views`, `watchTimeMinutes`.
- **Mutable Fields**: `currentDecile`, `retentionScore`, `lastCalculatedAt`.
- **Lifecycle**: `INGESTED` $\to$ `EVALUATED`.

---

## 5. Database / Data Contract
- **Collections Involved**: `analytics_timeseries`, `performance_deciles`, `workflow_instances`.
- **Document Structure**:
  ```typescript
  export interface AnalyticsSnapshotDocument extends BaseEntity {
    id: string; // tsm_ + UUIDv4
    publicationId: string;
    remoteVideoId: string;
    platform: 'YOUTUBE_SHORTS' | 'INSTAGRAM_REELS';
    views: number;
    watchTimeMinutes: number;
    averageViewDurationSeconds: number;
    averagePercentageViewed: number;
    likes: number;
    comments: number;
    shares: number;
    milestone: '24H' | '48H' | '7D' | '30D';
    capturedAt: string;
  }

  export interface PerformanceDecileDocument extends BaseEntity {
    id: string; // dec_ + UUIDv4
    publicationId: string;
    subject: string;
    compositeScore: number;
    decile: number; // 1 to 10
    evaluatedAt: string;
  }
  ```
- **Indexes**: Composite index on `(publicationId, capturedAt DESC)` and `(subject, decile ASC)`.
- **Source of Truth**: Firestore `analytics_timeseries` collection.

---

## 6. API Contract
### 6.1 `GET /api/v1/analytics/publications/:id`
- **Authentication**: Required.
- **Required Capability**: `ANALYTICS_VIEW`.
- **Response Schema**: `ApiResponseEnvelope<{ timeseries: AnalyticsSnapshotDocument[], decile: PerformanceDecileDocument }>`

### 6.2 `GET /api/v1/analytics/reports/overview`
- **Authentication**: Required.
- **Required Capability**: `ANALYTICS_VIEW`.
- **Query Params**: `startDate`, `endDate`, `subject`.
- **Response Schema**: `ApiResponseEnvelope<{ totalViews: number, avgRetention: number, topDecileVideos: any[] }>`.

---

## 7. Frontend Contract
- **Canonical Route**: `/analytics` (Analytics Hub), `/analytics/:id` (Video Performance Detail).
- **Allowed Roles / Capabilities**: `AnalyticsViewer`, `Publisher`, `Admin`, `SuperAdmin`.
- **UI Behavior**:
  - Interactive timeseries charts (Views over time, Retention curve).
  - Prominent Decile badge: $D_1$ (Gold, Top 10%), $D_2\dots D_4$ (Green), $D_5\dots D_7$ (Amber), $D_8\dots D_{10}$ (Gray).
  - Subject-level performance comparison leaderboard.

---

## 8. RBAC / Capability Contract
- **`ANALYTICS_VIEW`**: View analytics dashboards and performance reports.
- **`ANALYTICS_EXPORT`**: Download CSV/JSON metric reports.

---

## 9. Workflow Contract
- **Step 13 Entry**: Platform sync verified in Step 12 (`SYNC_OK`).
- **Step 13 Exit**: 24h metrics ingested $\to$ Transitions to Step 13 (`ANALYTICS_INGESTED`).
- **Step 14 Exit**: Decile ranking assigned $\to$ Transitions to Step 14 (`PERF_EVALUATED`).

---

## 10. Validation Contract
- **Metric Sanity**: Views $\ge 0$, retention percentage $\in [0, 100]$.

---

## 11. Error Contract
- `404 NOT_FOUND`: Publication ID not found.
- `502 BAD_GATEWAY`: External platform analytics API failure.

---

## 12. Audit Contract
- **Events**: `ANALYTICS_HARVEST_COMPLETED`, `DECILE_RECALCULATED`.
- **Payload**: `publicationId`, `views`, `decile`.

---

## 13. Realtime Contract
- **Applicable**: No. Analytics dashboards update via standard on-demand queries.

---

## 14. Job / Async Contract
- **Nightly Harvester**: Cloud Tasks cron job running daily at 02:00 UTC querying platform metrics for active publications.

---

## 15. AI Contract
- **Applicable**: No.

---

## 16. Media Contract
- **Applicable**: No.

---

## 17. Analytics Contract
- Self-referential: Implements the analytics ingestion subsystem.

---

## 18. Security Contract
- **Read-Only Invariant**: Analytics worker and endpoints cannot write to operational content collections (`questions`, `scripts`, `videos`).

---

## 19. Observability Contract
- **Metrics**: Counter `analytics.snapshots_ingested_total`, gauge `analytics.average_view_count`.

---

## 20. Cost Contract
- **Cost**: ₹0.00. Operates within YouTube API free quota and Firestore Spark daily limits.

---

## 21. Migration Contract
- **Legacy Parity**: Historical view counts from spreadsheets seeded into `analytics_timeseries`.

---

## 22. Test Contract
- **Unit Tests**:
  - `TC-AN-01`: Decile algorithm ranks distribution into 10 uniform buckets.
  - `TC-AN-02`: Segregation test: Analytics errors do not block operational workflows.
- **API Tests**:
  - `TC-AN-03`: `GET /api/v1/analytics/publications/:id` returns historical timeseries.

---

## 23. Dependencies
- **Prerequisite Features**: FC-001, FC-002, FC-003, FC-005, FC-016, FC-017.
- **Stage 25 Node**: `D-27 (Analytics Ingestion)`.
- **Downstream Consumers**: FC-021 (Content Intelligence Loop).

---

## 24. Implementation Sequence
1. Define Analytics schemas (`src/types/analytics.ts`).
2. Implement YouTube Analytics API harvester (`src/lib/analytics/harvester.ts`).
3. Implement decile calculation algorithm (`src/lib/analytics/decile.ts`).
4. Implement `/api/v1/analytics/*` route handlers.
5. Build React Analytics Hub with chart components (`src/pages/analytics/`).
6. Verify against `TC-AN-01..03`.

---

## 25. Deployment Contract
- **Dependencies**: Code-only deployment.

---

## 26. Rollback Contract
- **Strategy**: Revert Cloud Run revision. Analytical data remains in separate collection.

---

## 27. Feature Completion Criteria
- [ ] Telemetry harvester records platform snapshots.
- [ ] Decile scoring calculation verified.
- [ ] Operational workflow segregation proven.
- [ ] Transition to Step 14 verified.
- [ ] Zero lint or build errors.

---

## 28. Open Issues / Assumptions
- **None**: Fully specified in Stages 06, 07, 10, 13, 15, and 20.

---

## 29. Traceability
- **Stage 01**: BR-010, NFR-008
- **Stage 02**: DAC-006
- **Stage 07**: Steps 13 & 14 Specification
- **Stage 10**: Analytics Hub Architecture
- **Stage 13**: `analytics_timeseries`, `performance_deciles` schemas
- **Stage 15**: `/api/v1/analytics/*`
- **Stage 20**: Authoritative Analytics Architecture
- **Stage 24**: TC-WF13-01..09, TC-WF14-01..09
- **Stage 25**: Node `D-27`
