# 20 — ANALYTICS ARCHITECTURE
## Burra Pariksha Content Management System (BP-CMS)
### Stage 20 of 30-Stage Modernization Program — Authoritative Telemetry Ingestion, Metric Normalization, Aggregations & Pedagogical Intelligence Loop

```
================================================================================
Document ID:       BP-ARCH-20-ANALYTICS
Version:           20.0.0-SDLC-RESTART
Status:            APPROVED / AUTHORITATIVE ARCHITECTURAL SPECIFICATION
Scope:             Operational vs. Analytical State Separation, 5-Stage Analytics Pipeline,
                   Metric Normalization, Retention Curve Taxonomy, Performance Scoring,
                   Closed-Loop Pedagogical Intelligence (Step 15 -> Step 01),
                   Storage Decoupling, API Read Models & Free-Tier Budget Compliance
Upstream Inputs:   01-REQUIREMENTS-BASELINE.md
                   02-BUSINESS-ACCEPTANCE-CRITERIA.md
                   03-CURRENT-SYSTEM-BASELINE.md
                   04-ARCHITECTURE-PRINCIPLES.md (AP-002, AP-009, AP-010, AP-011, AP-012)
                   05-TARGET-SYSTEM-BOUNDARY.md
                   06-DOMAIN-MODEL.md
                   07-CANONICAL-15-STEP-WORKFLOW.md (Step 13 Telemetry, Step 15 Intelligence)
                   08-STATE-MODEL.md (State Dimension Separation)
                   09-RBAC-CAPABILITY-MODEL.md (ANALYTICS_SNAPSHOT Capabilities)
                   10-FRONTEND-INFORMATION-ARCHITECTURE.md (Analytics Hub)
                   11-PAGE-ROUTE-CONTRACT.md (Canonical Route /analytics/engagement)
                   12-DATABASE-ARCHITECTURE.md (Firestore Native Hybrid)
                   13-DATA-MODEL-DATA-CONTRACT.md (AnalyticsSnapshot Entity)
                   14-MEDIA-ARCHITECTURE.md
                   15-API-CONTRACT.md (REST Read Models & Envelopes)
                   16-REALTIME-ARCHITECTURE.md (ANALYTICS_REFRESHED SSE Signals)
                   17-JOB-ASYNC-ARCHITECTURE.md (Scheduled Polling & Cloud Tasks)
                   18-AI-ARCHITECTURE.md (Human-Gated Misconception Synthesis)
                   19-SECURITY-ARCHITECTURE.md (Read-Only RBAC & Tenant Isolation)
Downstream Stages: 21-AUDIT-OBSERVABILITY.md
                   22-COST-ARCHITECTURE.md
                   23-MIGRATION-ARCHITECTURE.md
                   24-TEST-ARCHITECTURE.md
                   25-IMPLEMENTATION-DEPENDENCY-PLAN.md
                   26-FEATURE-CONTRACTS.md
                   27-IMPLEMENTATION.md
                   28-INTEGRATION-HUMAN-TESTING.md
Master Axiom:      Operational data answers: "What is happening in the content-production system?"
                   Analytical data answers: "How is the published content performing?"
Budget Invariant:  Hard Initial Infrastructure Ceiling: ₹0–₹100 / month (Firestore Free Tier)
================================================================================
```

---

## 1. Analytics Objectives

The analytical subsystem in BP-CMS serves three primary strategic objectives:
1. **Audience Reach & Impact Telemetry:** Ingest, normalize, and track viewer interaction metrics across multiple distribution destinations (YouTube Shorts, Instagram Reels, Facebook Video).
2. **Pedagogical Verification & Drop-Off Diagnostics:** Diagnose exactly where students lose engagement or misunderstand concepts by analyzing second-by-second audience retention curves on vertical educational shorts.
3. **The Step 15 $\to$ Step 01 Closed-Loop Feedback Engine:** Transform social telemetry and audience comments into structured pedagogical intelligence. Misconceptions detected in published videos loop back directly into Step 01 (Question Ideation) to guide future question authoring.

---

## 2. Operational vs. Analytical Boundary

A foundational architectural requirement is the **strict, immutable physical and logical separation between operational data and analytical data**:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              OPERATIONAL VS. ANALYTICAL DIVIDE                         │
├───────────────────────────────────────────┬────────────────────────────────────────────┤
│ Operational Domain (Authoritative Core)   │ Analytical Domain (Derived Insights)       │
├───────────────────────────────────────────┼────────────────────────────────────────────┤
│ Questions: "What is happening in studio?" │ Answers: "How is published content doing?" │
│ • `Question`, `Script`, `VideoTake`       │ • `viewsCount`, `likesCount`, `sharesCount`│
│ • `WorkflowInstance`, `QuestionReview`    │ • `averageWatchDurationSeconds`            │
│ • `Publication`, `PublishingPackage`      │ • `retentionCurve` ($0\% \dots 100\%$)     │
│ • `User`, `SecuritySessionRecord`         │ • `AggregatedMetricsSummary`               │
│ • Authoritative source of business truth  │ • Derived, historical, and recalculable    │
│ • Transactional consistency (ACID)        │ • Read-heavy, eventual consistency         │
│ • Never mutated by background analytics   │ • Never mutates operational entity status  │
└───────────────────────────────────────────┴────────────────────────────────────────────┘
```

### The Separation Invariant
$$\mathbf{ANALYTICAL\ DATA\ MUST\ NEVER\ BECOME\ THE\ AUTHORITY\ FOR\ OPERATIONAL\ STATE.}$$
Under no circumstances may a background analytics sync job or performance calculation modify a `Question.lifecycleState`, alter a `WorkflowInstance.currentStep`, approve a content review, change a user's role, or trigger publishing dispatch. Analytical data is purely observational and advisory.

---

## 3. Analytical Domain Model

The analytical subsystem consists of five decoupled domain entities:

```text
  ┌─────────────────────────┐
  │  RawPlatformTelemetry   │  <<Layer 1: Raw Observation>>
  └────────────┬────────────┘
               │ Normalization Hook
               ▼
  ┌─────────────────────────┐
  │ NormalizedAnalyticsRec. │  <<Layer 2: Standardized Snapshot>>
  └────────────┬────────────┘
               │ Aggregation Engine
               ▼
  ┌─────────────────────────┐
  │ AggregatedMetricsSummary│  <<Layer 3: Time & Topic Cohorts>>
  └────────────┬────────────┘
               │ Benchmark Scoring
               ▼
  ┌─────────────────────────┐
  │    PerformanceRecord    │  <<Layer 4: Engagement & Retention Rating>>
  └────────────┬────────────┘
               │ Assistive AI Synthesis (Stage 18)
               ▼
  ┌─────────────────────────┐
  │   IntelligenceInsight   │  <<Layer 5: Closed-Loop Pedagogical Feedback>>
  └─────────────────────────┘
```

---

## 4. Raw Metric Model

Raw metrics represent immutable, direct observations harvested from external social distribution APIs (YouTube Data API v3, Meta Graph API):

```typescript
export interface RawPlatformTelemetry {
  readonly rawTelemetryId: string; // RAW-TEL-YYYYMMDD-XXXXXX
  readonly publicationId: string;   // Link to operational Publication
  readonly platform: PlatformId;    // YOUTUBE | INSTAGRAM | FACEBOOK
  readonly rawPayload: Record<string, unknown>; // Unmodified platform JSON
  readonly harvestedAt: string;     // ISO-8601 timestamp of harvest
  readonly statusCode: number;      // HTTP status from platform API (e.g. 200)
}
```

Raw telemetry records are append-only. They are preserved for 90 days to permit re-normalization if platform API contracts or normalization formulas are updated.

---

## 5. Normalized Metric Model

Raw telemetry is normalized into the canonical `NormalizedAnalyticsRecord` schema, eliminating platform-specific terminology differences:

```typescript
export interface NormalizedAnalyticsRecord {
  readonly snapshotId: string;      // ASN-YYYYMMDD-XXXXXX
  readonly publicationId: string;
  readonly contentId: string;        // Canonical Content/Video identifier
  readonly platform: PlatformId;
  readonly viewsCount: number;       // Canonical view count
  readonly likesCount: number;
  readonly commentsCount: number;
  readonly sharesCount: number;
  readonly averageWatchDurationSeconds: number;
  readonly completionRateRatio: number; // 0.0 to 1.0
  readonly retentionCurve: readonly RetentionCurvePoint[];
  readonly capturedAt: string;
}

export interface RetentionCurvePoint {
  readonly percentile: number;     // 0 to 100 (percentage of video duration)
  readonly retentionRatio: number;  // 0.0 to 1.0 (fraction of audience watching)
}
```

---

## 6. Metric Taxonomy & Definitions

```text
┌──────────────────────────────┬──────────────┬──────────────────────────────────────────┐
│ Canonical Metric Name        │ Unit         │ Formal Definition                        │
├──────────────────────────────┼──────────────┼──────────────────────────────────────────┤
│ `viewsCount`                 │ Count (int)  │ Verified video playback starts           │
│ `likesCount`                 │ Count (int)  │ Positive reaction / thumbs-up events     │
│ `commentsCount`              │ Count (int)  │ User comments and reply interactions     │
│ `sharesCount`                │ Count (int)  │ Link shares, reposts, and story reshares │
│ `averageWatchDurationSec`    │ Seconds      │ Total watch time divided by total views  │
│ `completionRateRatio`        │ Ratio (0..1) │ Fraction of viewers reaching 100% mark   │
│ `hookRetentionRatio`         │ Ratio (0..1) │ Audience retained at 10% video duration  │
│ `dropOffSlope`               │ Ratio / sec  │ Rate of audience loss in body section    │
│ `weightedEngagementRate`     │ Ratio (float)│ (Likes + 2*Comments + 3*Shares) / Views  │
└──────────────────────────────┴──────────────┴──────────────────────────────────────────┘
```

---

## 7. Platform / Source Mapping Matrix

```text
┌──────────────────────┬────────────────────────────┬────────────────────────────┐
│ Canonical BP-CMS     │ YouTube Shorts API Source  │ Instagram Reels API Source │
├──────────────────────┼────────────────────────────┼────────────────────────────┤
│ `viewsCount`         │ `statistics.viewCount`     │ `insights.views`           │
│ `likesCount`         │ `statistics.likeCount`     │ `insights.likes`           │
│ `commentsCount`      │ `statistics.commentCount`  │ `insights.comments`        │
│ `sharesCount`        │ (Estimated / Custom API)   │ `insights.shares`          │
│ `averageWatchSec`    │ `contentDetails.avgWatch`  │ `insights.total_time / view`│
│ `retentionCurve`     │ `analytics.audienceRetent.`│ Normalized from sample pts │
└──────────────────────┴────────────────────────────┴────────────────────────────┘
```

---

## 8. Metric Normalization Engine

The normalization engine operates as a deterministic, pure pipeline:
1. **Type Coercion & Bounds Verification:** Ensures all counts are non-negative integers; handles platform string representations safely.
2. **Missing Value Fallbacks:** If a platform withholds a metric (e.g. YouTube shares count not exposed on standard user endpoints), defaults safely to `0` without corrupting other metrics.
3. **Retention Interpolation:** Normalizes varying platform curve resolutions into standardized 5-point percentiles ($0\%, 25\%, 50\%, 75\%, 100\%$) for uniform comparison.

---

## 9. Aggregation Architecture

To prevent heavy on-the-fly calculations when creators open dashboards, metrics are pre-aggregated across standard temporal and curriculum dimensions:

```typescript
export interface AggregatedMetricsSummary {
  readonly aggregationId: string;    // AGG-YYYYMMDD-XXXXXX
  readonly window: AnalyticsWindow;  // DAY_1 | DAY_7 | DAY_30 | LIFETIME
  readonly subject?: string;         // e.g. "Physical Science"
  readonly topic?: string;           // e.g. "Acids, Bases and Salts"
  readonly totalViews: number;
  readonly totalLikes: number;
  readonly totalComments: number;
  readonly totalShares: number;
  readonly avgEngagementRate: number;
  readonly avgCompletionRate: number;
  readonly cohortSize: number;       // Number of published videos in cohort
  readonly computedAt: string;
}
```

---

## 10. Performance Architecture & Scoring Formulas

Performance scoring is computed strictly via authoritative formulas:

### 10.1 Weighted Engagement Rate Formula
$$\mathbf{EngagementRate} = \frac{\text{Likes} + (\text{Comments} \times 2) + (\text{Shares} \times 3)}{\max(1, \text{Views})}$$
*Rationale:* Shares represent the highest-intent student endorsement, followed by comments (active discussion) and likes (passive endorsement).

### 10.2 Retention Benchmark Classification
```text
┌──────────────────────┬──────────────────────┬──────────────────────────────────────────┐
│ Benchmark Level      │ Completion Ratio     │ Diagnostic Meaning                       │
├──────────────────────┼──────────────────────┼──────────────────────────────────────────┤
│ `VIRAL`              │ $\ge 70\%$           │ Exceptional retention; high distribution │
│ `HIGH`               │ $50\% - 69\%$        │ Solid pedagogical hold; strong clarity   │
│ `AVERAGE`            │ $30\% - 49\%$        │ Standard student engagement              │
│ `UNDERPERFORMING`    │ $< 30\%$ OR          │ Pedagogical failure; hook dropped $>50\%$│
│                      │ Hook $< 50\%$ at 10% │ of viewers within first 6 seconds.       │
└──────────────────────┴──────────────────────┴──────────────────────────────────────────┘
```

---

## 11. Intelligence Architecture (The Step 15 $\to$ Step 01 Loop)

The crowning capability of BP-CMS analytics is the closed-loop feedback engine connecting **Step 15 (Performance Intelligence)** back to **Step 01 (Question Ideation)**.

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                      STEP 15 -> STEP 01 CLOSED-LOOP INTELLIGENCE                       │
 └────────────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │ Step 13 Telemetry Harvest │  • Pulls views & retention curves
                        └─────────────┬─────────────┘
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │ Step 15 Drop-Off Analysis │  • Identifies videos with drop-off > 60%
                        └─────────────┬─────────────┘  • Aggregates student comments
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │  Gemini Misconception AI  │  • Analyzes confusing question options
                        │        (Stage 18)         │  • Synthesizes pedagogical insight
                        └─────────────┬─────────────┘
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │   Curriculum Lead Review  │  • Human verifies misconception validity
                        │        (GAR-02)           │  • Approves insight for loopback
                        └─────────────┬─────────────┘
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │ Step 01 Authoring Context │  • Injected into Question Studio
                        │       (Next Cycle)        │  • Prompts authors: "Students struggled
                        └───────────────────────────┘    with this; author clarifying Q."
```

---

## 12. Content-Level Analytics

Content-level analytics aggregate performance across all platforms for a single educational asset:
- Tracks total cross-platform views (`YouTube + Instagram + Facebook`).
- Highlights which platform drove the highest student completion rate.
- Links directly to the canonical `contentId` and `questionId`.

---

## 13. Platform-Level Analytics

Enables comparative distribution efficiency audits:
- Determines whether 9:16 vertical shorts perform better on YouTube Shorts or Instagram Reels for specific SSC subjects (e.g. Mathematics vs. Social Studies).
- Informs publisher scheduling decisions in Step 11.

---

## 14. Time-Series Analytics & Velocity

- Tracks viewing velocity: Day 1 (0–24h), Day 7 (first week), and Day 30 (long-tail educational search).
- Distinguishes "flash viral" content from "evergreen exam preparation" content that gains steady views ahead of 10th Class Board Exams.

---

## 15. Retention Analytics & Second-by-Second Profiling

Retention curves reveal critical pedagogical friction:
- **0s – 6s (The Hook):** If retention drops below $50\%$ in the first 6 seconds, flags `HOOK_FAILURE` (teleprompter script hook was ineffective).
- **6s – 45s (The Explanation Body):** Sudden downward cliffs indicate complex Telugu phrasing, unclear mathematical steps, or confusing graphics.
- **45s – 60s (The Outro / CTA):** Measures student willingness to subscribe or attempt the quiz.

---

## 16. Click-Through Rate (CTR) Analytics

- Measures thumbnail and title effectiveness across platform feeds.
- Correlates Step 08 thumbnail artwork choices with initial view velocity.

---

## 17. Engagement Analytics

- Evaluates comment density: High comment volume with low completion often indicates controversial or disputed question answer keys, triggering an automatic verification alert.

---

## 18. Trend Detection & Anomaly Recognition

The aggregation engine monitors rolling 7-day averages. A statistical anomaly ($\ge 2.5$ standard deviations above topic mean) triggers a notification to studio leads highlighting an emerging high-interest board exam topic.

---

## 19. Data Freshness & Ingestion Schedules

Telemetry harvesting runs as a scheduled background job (Stage 17):
```text
┌──────────────────────┬────────────────────────┬────────────────────────────────────────┐
│ Content Age          │ Ingestion Frequency    │ Target Quota Impact                    │
├──────────────────────┼────────────────────────┼────────────────────────────────────────┤
│ 0 – 48 hours         │ Every 6 hours          │ High-priority tracking window          │
│ 3 – 14 days          │ Every 12 hours         │ Secondary tracking window              │
│ 15 – 60 days         │ Daily (once per 24h)   │ Long-tail stabilization                │
│ > 60 days            │ Weekly (once per 7d)   │ Archival baseline                      │
└──────────────────────┴────────────────────────┴────────────────────────────────────────┘
```

---

## 20. Duplicate Handling & Deduplication

- Every normalized snapshot is uniquely keyed:
  $$\text{SnapshotKey} = \text{ASN}-{publicationId}-{platform}-{YYYYMMDDHH}$$
- Duplicate telemetry payloads received within the same measurement window overwrite the transient snapshot idempotently, preventing double-counting in aggregations.

---

## 21. Missing and Invalid Metric Handling

- Network timeouts or platform 5xx errors log a transient telemetry harvest failure without deleting prior historical snapshots.
- Missing platform metrics default safely to `0`; invalid non-numeric values are rejected by Zod schema validation.

---

## 22. Historical Metric Corrections

Social platforms retroactively adjust metrics (e.g. YouTube removing bot views). The analytics storage architecture accepts authoritative restatements: when a platform restates views for day $T$, the nightly aggregation worker recalculates aggregates from the latest snapshot.

---

## 23. Analytics Storage Architecture

Analytics data is partitioned into dedicated Firestore collections, completely isolated from operational tables:
- `/raw_platform_telemetry/{rawId}`: Raw unparsed JSON payloads (90-day TTL).
- `/analytics_snapshots/{snapshotId}`: Normalized point-in-time snapshots.
- `/analytics_aggregations/{aggregationId}`: Pre-computed temporal summaries.
- `/content_intelligence/{insightId}`: Human-reviewed pedagogical insights.

*Zero analytical data is written to the root `/questions` or `/publications` documents.*

---

## 24. Analytics API Boundaries (Stage 15 Integration)

All analytics endpoints are strictly **read-only** for standard clients:
- `GET /api/v1/analytics/overview`: High-level studio KPIs and aggregation summaries.
- `GET /api/v1/analytics/content/:contentId`: Detailed cross-platform metrics and retention curves for a specific video.
- `GET /api/v1/analytics/intelligence`: Active pedagogical misconception recommendations.
- `POST /api/v1/analytics/intelligence/:id/review`: Authorized human action approving insight loopback to Step 01.

---

## 25. Frontend Read-Model Requirements

The Analytics Hub (`/analytics/engagement`) consumes pre-computed read models:
- **Executive Card Strip:** Total Views, Average Completion Rate, 7-Day Growth Index.
- **Interactive Retention Chart:** SVG/Canvas rendering of the 5-point percentile curve.
- **Topic Misconception Matrix:** Prioritized table of topics needing remedial questions.

---

## 26. Relationship with Operational Firestore Data

- Foreign keys (`publicationId`, `contentId`, `subjectId`) link analytics to operations.
- The operational database remains 100% functional and transactionally sound even if the analytics subsystem is completely disabled or offline.

---

## 27. Relationship with Publishing & Platform Sync

- Step 11 (`PublishingService`) creates the `Publication` record and records external platform video IDs (`youtubeVideoId`, `instagramMediaId`).
- Once publication status transitions to `LIVE`, the publishing service registers the publication ID with the analytics telemetry scheduler.

---

## 28. Relationship with Stage 18 AI Subsystem

- Telemetry summaries and audience comments are passed to Gemini 2.5 Pro via `AsyncJobType.AI_GENERATION` to identify conceptual misunderstandings.
- Generated insights adhere strictly to the **Stage 18 Human-Gated Lifecycle**: insights must be reviewed and approved by a Curriculum Lead before appearing in Step 01 Question Studio.

---

## 29. Security & RBAC Implications (Stage 19 Alignment)

- Viewing analytics requires `ANALYTICS_SNAPSHOT:VIEW`.
- Exporting raw CSV telemetry requires `ANALYTICS_SNAPSHOT:EXPORT`.
- Approving pedagogical loopback recommendations requires `CURRICULUM_LEAD` or `ADMIN` role.

---

## 30. Audit & Observability Integration (Stage 21 Alignment)

- Telemetry harvesting job completions are logged to Cloud Monitoring.
- Human review decisions on intelligence insights emit immutable audit records to `/audit_events`.

---

## 31. Cost Architecture & Budget Invariant

BP-CMS enforces a hard budget ceiling: **₹0 to ₹100 / month**.
- **Telemetry Ingestion:** Scheduled Cloud Tasks HTTP requests within the 1M free-tier tasks = **₹0.00 / month**.
- **Firestore Operations:** Batching telemetry into 6-hour windows consumes $< 1,000$ writes/day (well within the 20,000 daily free write quota) = **₹0.00 / month**.
- **Total Analytics Infrastructure Cost:** **₹0.00 / month** (100% Free-Tier Compliant).

---

## 32. Migration & Brownfield Implications

- Replaces legacy in-component mock timers in `SocialAnalyticsPage.tsx` with queries against the normalized read models.
- Retains existing historical analytics records in Google Sheets, providing a read-only adapter during migration.

---

## 33. Comprehensive Analytics Testing Requirements

Stage 24 and Stage 28 must implement the following 12 analytical test suites:
1. `TEST-ANA-01`: Raw platform JSON maps accurately to normalized `viewsCount` and `likesCount`.
2. `TEST-ANA-02`: Weighted engagement rate calculates with exact decimal precision.
3. `TEST-ANA-03`: Retention curves correctly classify `VIRAL`, `HIGH`, `AVERAGE`, and `UNDERPERFORMING`.
4. `TEST-ANA-04`: Videos with $>50\%$ drop in first 6 seconds flagged as `HOOK_FAILURE`.
5. `TEST-ANA-05`: Duplicate telemetry payloads within same window update idempotently without double-counting.
6. `TEST-ANA-06`: Missing platform fields default safely to zero without throwing schema errors.
7. `TEST-ANA-07`: Analytics sync job cannot mutate `Question.lifecycleState` or `WorkflowInstance.currentStep`.
8. `TEST-ANA-08`: Intelligence insights require explicit human review before Step 01 availability.
9. `TEST-ANA-09`: Read models return cached aggregations in $< 200\,\text{ms}$.
10. `TEST-ANA-10`: Unauthorized users blocked from accessing `/api/v1/analytics/*`.
11. `TEST-ANA-11`: Realtime `ANALYTICS_REFRESHED` SSE event triggers frontend cache invalidation.
12. `TEST-ANA-12`: Daily Firestore write volume stays strictly within free-tier quotas.

---

## 34. Open Architectural Decisions & Decision Register

### 34.1 Analytics Decision Register (ADR-ANA)
- **ADR-ANA-01:** Strictly separate operational and analytical data stores in Firestore.
- **ADR-ANA-02:** Standardize all audience retention curves on 5-point percentiles ($0\%, 25\%, 50\%, 75\%, 100\%$).
- **ADR-ANA-03:** Enforce human review gating on all AI-synthesized pedagogical recommendations before Step 01 loopback.
- **ADR-ANA-04:** Adopt scheduled 6-hour batch telemetry harvesting to maintain ₹0.00 operational cost.

### 34.2 Conflict Register (JACR-ANA)
- **JACR-ANA-01 (Resolved):** *Real-Time Social Webhooks vs. Scheduled Batch Polling.*
  - **Resolution:** Scheduled batch polling (every 6 hours) is selected. Social webhooks require persistent public ingress endpoints with complex signature management, whereas batch polling operates entirely within free-tier Cloud Tasks.

---

## 35. Stage 20 Acceptance Criteria & Anti-Overclaim Confirmation

### 35.1 Acceptance Criteria Checklist
- [x] Operational vs. Analytical boundary strictly defined.
- [x] Canonical 5-stage analytical flow ($\text{Raw} \to \text{Normalized} \to \text{Aggregated} \to \text{Performance} \to \text{Intelligence}$) specified.
- [x] Metric taxonomy, formulas, and retention benchmark levels documented.
- [x] Step 15 $\to$ Step 01 closed-loop feedback engine specified with Stage 18 human gating.
- [x] Time-series, retention, CTR, and engagement analytics models defined.
- [x] Storage isolation, deduplication, and error-handling architectures established.
- [x] Cost compliance proven under ₹0–₹100/mo ceiling.
- [x] Zero runtime code files modified during Stage 20.

### 35.2 Final Anti-Overclaim Statement
**Stage 20 analytics architecture is documented and contractually defined; runtime telemetry harvesting connectors, normalization pipelines, and aggregation workers remain for later implementation stages.**
