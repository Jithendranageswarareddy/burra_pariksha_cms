# Stage 15 — Intelligence Loop

## 3.1 Page Identity
- Analytics intelligence route `/analytics/intelligence/:id` and related analytics
  workspaces; **Reviewed**. Related FC-019/FC-021.
- Evidence: [`frontend/app/App.tsx`](../../frontend/app/App.tsx),
  [`frontend/pages/AnalyticsExperiencePage.tsx`](../../frontend/pages/AnalyticsExperiencePage.tsx),
  [`backend/features/analytics/services/social-performance-intelligence.service.ts`](../../backend/features/analytics/services/social-performance-intelligence.service.ts),
  [`backend/features/analytics/services/comment-intelligence.service.ts`](../../backend/features/analytics/services/comment-intelligence.service.ts),
  [`docs/features/FC-019-ASSISTIVE-AI-PIPELINE.md`](../features/FC-019-ASSISTIVE-AI-PIPELINE.md),
  [`docs/features/FC-021-CONTENT-INTELLIGENCE-STRATEGY.md`](../features/FC-021-CONTENT-INTELLIGENCE-STRATEGY.md),
  [`docs/architecture/07-CANONICAL-15-STEP-WORKFLOW.md`](../architecture/07-CANONICAL-15-STEP-WORKFLOW.md).

## 3.2 Purpose
- Synthesize performance evidence into approved pedagogical insights and future
  generation directives. AI remains advisory and human review is mandatory.

## 3.3 Entry Condition
- Finalized Performance Review and intelligence capability.

## 3.4 Required Data
- Performance record, analytics evidence, topic/subtopic context, AI proposal,
  reviewer decision, and directive status.

## 3.5 GET Requests
- Intelligence detail and analytics evidence use typed API/services; exact route
  composition is **UNVERIFIED**.

## 3.6 User Inputs
- Review AI insight, edit directive, approve/reject, and link future-cycle context.

## 3.7 Defaults
- Latest finalized performance record is the candidate; no insight is auto-approved.

## 3.8 Primary Action
- The architecture requires a human approval/rejection action and prohibits
  automatic content creation or publication
  ([`docs/features/FC-019-ASSISTIVE-AI-PIPELINE.md`](../features/FC-019-ASSISTIVE-AI-PIPELINE.md)).
  Runtime approval and context seeding are **UNVERIFIED**.

## 3.9 API Request
- Analytics/intelligence service integration is present in the cited services;
  authorization and human-in-loop enforcement are architecture requirements and
  runtime behavior is **UNVERIFIED**.

## 3.10 Backend Use Case
- Social-performance intelligence/comment intelligence services, workflow, audit,
  repository, and advisory AI provider.

## 3.11 Response
- Insight/directive response shape, availability to the next generation cycle,
  and provenance preservation are **UNVERIFIED**; the intended behavior is
  defined by [`docs/features/FC-021-CONTENT-INTELLIGENCE-STRATEGY.md`](../features/FC-021-CONTENT-INTELLIGENCE-STRATEGY.md).

## 3.12 Persistence
- Firestore persistence and the non-authoritative status of AI output are
  architecture requirements; exact collection/schema and runtime persistence are
  **UNVERIFIED**.

## 3.13 Workflow State
- The canonical workflow requires a future Stage 01 context loop without bypassing
  Stage 01. Runtime transition and loop behavior are **UNVERIFIED**.

## 3.14 Audit
- Proposal, human decision, actor, evidence, and directive linkage require an
  immutable audit record; exact event names **UNVERIFIED**.

## 3.15 Error States
- Missing review, AI outage, invalid evidence, unauthorized/self approval,
  duplicate decision, persistence/OCC/network failures.

## 3.16 Empty States
- No finalized review: explain prerequisite. No insight proposal: provide manual
  analysis or generation action; no data is not an approval.

## 3.17 Next Action
- The intended next action is optional Stage 01 context; the runtime behavior for
  approved, rejected, and incomplete insights is **UNVERIFIED**.

## 3.18 Role Visibility
- The architecture requires human approval and prohibits AI approval; page-level
  runtime enforcement is **UNVERIFIED**. See [`docs/architecture/09-RBAC-CAPABILITY-MODEL.md`](../architecture/09-RBAC-CAPABILITY-MODEL.md).

## 3.19 Performance
- Defer AI generation, cache evidence, show provenance/loading, and prevent
  duplicate approvals. Target: **TBD**.

## 3.20 Acceptance Criteria
- Intelligence services/routes exist. Human approval, directive loop, audit,
  provenance, and E2E assertions are **UNVERIFIED**.

### Claim-level evidence register
- Route/page: [`frontend/app/App.tsx`](../../frontend/app/App.tsx) and [`frontend/pages/AnalyticsExperiencePage.tsx`](../../frontend/pages/AnalyticsExperiencePage.tsx) (**IMPLEMENTED**).
- Intelligence services: [`backend/features/analytics/services/social-performance-intelligence.service.ts`](../../backend/features/analytics/services/social-performance-intelligence.service.ts), [`backend/features/analytics/services/comment-intelligence.service.ts`](../../backend/features/analytics/services/comment-intelligence.service.ts), and [`backend/features/analytics/services/pinned-comment-intelligence.service.ts`](../../backend/features/analytics/services/pinned-comment-intelligence.service.ts) (**IMPLEMENTED**); exact GET/response, directive persistence, provenance, and audit are **UNVERIFIED**.
- Human approval, Stage 01 context loop, workflow transition, and role visibility are requirements in [`docs/features/FC-019-ASSISTIVE-AI-PIPELINE.md`](../features/FC-019-ASSISTIVE-AI-PIPELINE.md), [`docs/features/FC-021-CONTENT-INTELLIGENCE-STRATEGY.md`](../features/FC-021-CONTENT-INTELLIGENCE-STRATEGY.md), and [`docs/architecture/07-CANONICAL-15-STEP-WORKFLOW.md`](../architecture/07-CANONICAL-15-STEP-WORKFLOW.md); runtime proof is **UNVERIFIED**.
