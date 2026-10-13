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
- Human approves/rejects an insight. Approval seeds future Stage 01 context only;
  it must not create or publish content automatically.

## 3.9 API Request
- Analytics/intelligence service submits evidence-linked decision and directive;
  backend validates authorization and human-in-loop requirements.

## 3.10 Backend Use Case
- Social-performance intelligence/comment intelligence services, workflow, audit,
  repository, and advisory AI provider.

## 3.11 Response
- Returns insight status and directive; approved directives are available to the
  next generation cycle, with provenance preserved.

## 3.12 Persistence
- `IntelligenceInsight` and directives persist in Firestore; AI provider output is
  not authoritative until human action.

## 3.13 Workflow State
- Stage 15 in progress → approved insight; approved output loops to a future Stage
  01 context and does not bypass Stage 01.

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
- Approved directive becomes optional context for new Stage 01 generation; rejected
  or incomplete insight remains in review.

## 3.18 Role Visibility
- Intelligence/performance reviewers approve; AI cannot approve; authors consume
  approved directives. Backend enforces human-in-loop.

## 3.19 Performance
- Defer AI generation, cache evidence, show provenance/loading, and prevent
  duplicate approvals. Target: **TBD**.

## 3.20 Acceptance Criteria
- Intelligence services/routes exist. Human approval, directive loop, audit,
  provenance, and E2E assertions are **UNVERIFIED**.
