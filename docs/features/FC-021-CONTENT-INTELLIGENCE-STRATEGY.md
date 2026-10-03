# FEATURE CONTRACT: FC-021-CONTENT-INTELLIGENCE-STRATEGY

## 1. Feature Identity
- **Feature ID**: FC-021
- **Feature Name**: Content Intelligence Loop & Topic Strategy
- **Business Area**: Content Strategy & Feedback / Intelligence Loop
- **Contract Version**: 1.0.0
- **Status**: APPROVED
- **Priority**: P2 (Analytics & Feedback)
- **Owner / Domain**: Content Strategy Context
- **Related Workflow Stage(s)**: Step 15 (Intelligence Loop) $\to$ Step 01 (Question Generation)

---

## 2. Requirement
- **Business Requirement**: BR-010 (Closed-Loop Content Intelligence) & Educational Objective EO-004 (Data-Driven Syllabus Mastery).
- **User Problem**: Content creation teams produce questions in an open loop without systematically learning which pedagogical angles, hook styles, or exam categories drive student engagement and retention.
- **Business Purpose**: Provide a closed-loop intelligence engine that analyzes performance deciles (D1..D10), correlates subject retention with syllabus categories, synthesizes actionable content recommendations, and feeds them directly into Step 01 (Question Ideation).
- **Expected Capability**:
  - Content Intelligence Synthesis Engine identifying high-ROI topics (Top deciles $D_1\dots D_3$) and underperforming topics ($D_8\dots D_{10}$).
  - Closed-loop recommendation generator proposing high-yield syllabus concepts for next week's authoring cycle.
  - Step 15 $\to$ Step 01 feedback loop: Approved recommendations appear directly in Questions Hub as *"Recommended Topics"*.
  - Strategy & Intelligence Hub UI (`/intelligence`, `/strategy`).
  - Workflow transition: Step 15 (`INTEL_ACTIONABLE`) completing the manufacturing cycle.
- **Scope**: Topic performance aggregation, recommendation engine, Step 01 feed integration, strategy dashboard.
- **Explicit Non-Scope**: Autonomous question generation without author review (FC-019).

---

## 3. Business Acceptance
- **Happy-Path Acceptance**:
  - Intelligence engine aggregates last 30 days of published video deciles.
  - System identifies that "Indian Polity: Fundamental Rights" achieves $D_1$ average retention, while "Medieval History: Dynasties" averages $D_9$.
  - Generates 5 topic recommendations for Step 01 with target hook angles.
  - Subject Matter Experts viewing `/questions/new` see high-priority topic suggestions with predicted engagement ratings.
  - Step 15 transitions to `INTEL_ACTIONABLE`.
- **Validation Acceptance**:
  - Recommendations require at least 10 published videos in the analyzed subject to prevent statistical skew.
- **Authorization Acceptance**:
  - Requires `TOPIC_STRATEGY` capability for managing topic priorities.
- **Audit Acceptance**:
  - `INTELLIGENCE_LOOP_SYNTHESIZED` and `TOPIC_RECOMMENDATIONS_DISPATCHED` logged with subject and target decile metrics.

---

## 4. Domain Entities
- **Entities Involved**: `ContentIntelligenceReport`, `TopicRecommendation`, `SubjectPerformanceProfile`.
- **Entity Ownership**: Content Strategy Context.
- **Relationships**: Synthesizes data across `PerformanceDecile`, `Question`, and `Script` entities.
- **Versions**: Schema v1.0.
- **Immutable Fields**: `id`, `reportPeriod`, `generatedAt`.
- **Mutable Fields**: `recommendationStatus` (`ACTIVE`, `ADOPTED`, `EXPIRED`), `priorityScore`.
- **Lifecycle**: `SYNTHESIZED` $\to$ `ACTIVE` $\to$ `ADOPTED`.

---

## 5. Database / Data Contract
- **Collections Involved**: `content_intelligence_reports`, `topic_recommendations`, `workflow_instances`.
- **Document Structure**:
  ```typescript
  export interface TopicRecommendationDocument extends BaseEntity {
    id: string; // rec_ + UUIDv4
    subject: string;
    topic: string;
    examCategory: string;
    rationale: string;
    historicalAverageDecile: number;
    recommendedHookStyle: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    status: 'ACTIVE' | 'ADOPTED' | 'EXPIRED';
    adoptedQuestionId?: string;
  }
  ```
- **Indexes**: Composite index on `(subject, status, priority DESC)`.
- **Source of Truth**: Firestore `topic_recommendations` collection.

---

## 6. API Contract
### 6.1 `GET /api/v1/intelligence/recommendations`
- **Authentication**: Required.
- **Required Capability**: `QUESTION_VIEW` or `TOPIC_STRATEGY`.
- **Query Params**: `subject`, `status`.
- **Response Schema**: `ApiResponseEnvelope<{ recommendations: TopicRecommendationDocument[] }>`.

### 6.2 `POST /api/v1/intelligence/recommendations/:id/adopt`
- **Authentication**: Required.
- **Required Capability**: `QUESTION_CREATE`.
- **Request Schema**: `{}`.
- **Response Schema**: `ApiResponseEnvelope<{ questionDraftUrl: string }>`.

---

## 7. Frontend Contract
- **Canonical Route**: `/strategy` (Strategy Hub), integrated into `/questions/new` (Recommendation Banner).
- **Allowed Roles / Capabilities**: `Admin`, `SubjectMatterExpert`, `ScriptWriter`, `SuperAdmin`.
- **UI Behavior**:
  - Heatmap matrix showing subject coverage vs. performance decile.
  - Interactive "Recommended Topics" carousel in Question Creator with *"Draft Question on This Topic"* one-click action.

---

## 8. RBAC / Capability Contract
- **`TOPIC_STRATEGY`**: Manage strategic priorities and override recommendations.
- **`QUESTION_CREATE`**: Adopt recommendations into new question drafts.

---

## 9. Workflow Contract
- **Step 15 Entry**: Performance evaluated in Step 14 (`PERF_EVALUATED`).
- **Step 15 Exit**: Insights fed back into Step 01 ideation queue, completing the canonical 15-step cycle.

---

## 10. Validation Contract
- **Priority Calculation**: Priority score based on historical retention ($70\%$) + syllabus weight ($30\%$).

---

## 11. Error Contract
- `404 NOT_FOUND`: Recommendation ID not found.
- `422 UNPROCESSABLE_ENTITY`: Recommendation already adopted or expired.

---

## 12. Audit Contract
- **Events**: `TOPIC_RECOMMENDATION_ADOPTED`, `STRATEGY_UPDATED`.
- **Payload**: `recommendationId`, `subject`, `adoptedBy`.

---

## 13. Realtime Contract
- **Applicable**: No.

---

## 14. Job / Async Contract
- **Weekly Strategy Synthesis**: Cloud Tasks cron job executing every Sunday at 00:00 UTC to refresh topic recommendations.

---

## 15. AI Contract
- **Insight Synthesis**: Optional Gemini 2.5 Flash analysis generating pedagogical explanations for why certain topics underperformed.

---

## 16. Media Contract
- **Applicable**: No.

---

## 17. Analytics Contract
- **Upstream Consumer**: Ingests normalized decile distributions from FC-020.

---

## 18. Security Contract
- **Syllabus Isolation**: Strategy rules prevent biased concentration on a single subject.

---

## 19. Observability Contract
- **Metrics**: Gauge `intelligence.adoption_rate_percentage`, counter `intelligence.recommendations_generated_total`.

---

## 20. Cost Contract
- **Cost**: ₹0.00. Weekly batch computation within Cloud Run and Firestore free tiers.

---

## 21. Migration Contract
- **Legacy Parity**: Current system has no closed-loop intelligence; entirely additive feature.

---

## 22. Test Contract
- **Unit Tests**:
  - `TC-INT-01`: Recommendation algorithm favors subjects with $D_1\dots D_3$ performance.
  - `TC-INT-02`: Adopting recommendation links new question to `adoptedQuestionId`.
- **API Tests**:
  - `TC-INT-03`: `GET /api/v1/intelligence/recommendations` returns active prioritized items.

---

## 23. Dependencies
- **Prerequisite Features**: FC-001, FC-002, FC-003, FC-005, FC-006, FC-020.
- **Stage 25 Node**: `D-28 (Content Intelligence)`.
- **Downstream Consumers**: FC-006 (Questions Hub Ideation Queue).

---

## 24. Implementation Sequence
1. Define Intelligence schemas (`src/types/intelligence.ts`).
2. Implement topic recommendation engine (`src/lib/intelligence/recommendation-engine.ts`).
3. Implement `/api/v1/intelligence/*` route handlers.
4. Build React Strategy Hub and Question Creator integration (`src/pages/strategy/`).
5. Verify against `TC-INT-01..03`.

---

## 25. Deployment Contract
- **Dependencies**: Code-only deployment.

---

## 26. Rollback Contract
- **Strategy**: Revert Cloud Run revision.

---

## 27. Feature Completion Criteria
- [ ] Topic recommendation engine identifies top and bottom performing subjects.
- [ ] Recommended topics appear in Question Creator UI.
- [ ] Adoption links recommendation to new question draft.
- [ ] Canonical 15-step loop closure verified.
- [ ] Zero lint or build errors.

---

## 28. Open Issues / Assumptions
- **None**: Fully specified in Stages 06, 07, 10, and 20.

---

## 29. Traceability
- **Stage 01**: BR-010, EO-004
- **Stage 02**: DAC-006
- **Stage 07**: Step 15 Specification (Loop Closure)
- **Stage 10**: Strategy Studio Hub Architecture
- **Stage 13**: `topic_recommendations` schema
- **Stage 15**: `/api/v1/intelligence/*`
- **Stage 20**: Closed-Loop Intelligence Architecture
- **Stage 24**: TC-WF15-01..09
- **Stage 25**: Node `D-28`
