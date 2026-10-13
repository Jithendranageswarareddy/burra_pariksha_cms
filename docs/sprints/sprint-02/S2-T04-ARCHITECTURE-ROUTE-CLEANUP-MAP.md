# S2-T04 — Architecture & Route Cleanup Map
## Burra Pariksha Content Management System (BP-CMS)
### Sprint 2 System Stabilization & Golden Path — Authoritative Forensic Route & Architecture Audit

---

## 1. Scope & Objectives

This document delivers the authoritative, evidence-based forensic architecture and route audit for the Burra Pariksha Content Management System (BP-CMS) as part of **Sprint 2 — Task S2-T04**.

### Mandatory Constraint & Anti-Refactoring Principle
**No application code, routing, services, repositories, or UI components were modified, deleted, moved, or refactored during this task.**
This artifact establishes the ground-truth evidence and cleanup map required for subsequent tasks, notably **S2-T05 (Question Golden Path)**, without introducing destabilizing premature refactors.

---

## 2. Evidence Sources & Inspection Methodology

All findings in this report derive directly from static and dynamic analysis of the executable codebase at baseline commit `c5b335e8816f41df9fc31a3be3a5d04d3c0b19d4`:
1. **Frontend Routing Shell**: `src/App.tsx` (Route hierarchy, dynamic redirect components, route guards).
2. **Page Components**: `src/pages/*.tsx` (31 total page components inspected).
3. **Global Navigation & Information Architecture**: `src/config/navigation.ts`, `src/components/layout/Sidebar.tsx`, `src/components/layout/Layout.tsx`, `src/design-system/components/AppBreadcrumbs.tsx`.
4. **Authoritative Workflow Engines**: `src/lib/workflow/canonical-workflow.ts` (15 canonical stages), `src/lib/workflow/transition-matrix.ts` (FC-005 state engine).
5. **Backend Route Definitions**: `src/server/routes.ts` (279 HTTP API endpoints), `src/server/health.routes.ts`.
6. **Frontend API Client**: `src/lib/api-client.ts` (148 endpoint calls).
7. **Service & Repository Layer**: `src/lib/services/*.ts` (68 services), `src/lib/repositories/*.ts` (38 repositories).

---

## 3. Frontend Route Inventory

`src/App.tsx` defines 40 route patterns under the root `<Layout />`:

| Route Path | Component / Handler | Classification | Purpose & Evidence |
| :--- | :--- | :--- | :--- |
| `/` | `<Navigate to={landingRoute} replace />` | CANONICAL | Dynamic role-based landing redirection based on user capabilities. |
| `/dashboard` | `DashboardPage` | CANONICAL | System pulse, daily metrics, and activity feed (Home Hub). |
| `/planning` | `PlanningPage` | CANONICAL | Syllabus coverage, topic/subtopic batch planning, similarity radar. |
| `/questions` | `QuestionLibraryPage` | CANONICAL | Master question library with topic/subtopic filtering and bulk actions. |
| `/content-masters` | `ContentMasterPage` | CANONICAL | Universal content master entity explorer and cross-stage lifecycle tracker. |
| `/content-masters/:id` | `ContentMasterPage` | CANONICAL | Individual content master detail view. |
| `/social-review` | `SocialReviewPage` | CANONICAL | Step 09 9:16 smartphone simulator, copy packaging, and pinned comment signoff. |
| `/social-review/:reviewId` | `SocialReviewPage` | CANONICAL | Specific social review bundle audit and approval. |
| `/studio` | `QuestionStudioPage` | CANONICAL | Step 01 Question authoring workspace with AI generation and math proof. |
| `/questions/new` | `<Navigate to="/studio" replace />` | SUPPORTING REDIRECT | Legacy alias redirecting to canonical `/studio`. |
| `/questions/improve` | `QuestionImprovePage` | LEGACY / OVERLAPPING | Standalone selector for question improvement; duplicates `/questions/:id?mode=edit`. |
| `/questions/:id/improve` | `<QuestionImproveRedirect />` | SUPPORTING REDIRECT | Dynamically redirects to `/questions/:id?mode=edit`. |
| `/questions/verify` | `QuestionVerifyApprovePage` | CANONICAL | Step 02 Question verification workspace (unassigned/pending queue view). |
| `/questions/:id/verify` | `QuestionVerifyApprovePage` | CANONICAL | Step 02 10-point pedagogical audit and human approval gate (GAR-02). |
| `/questions/:id` | `QuestionDetailPage` | CANONICAL | Deep resource view for question metadata, edit form, versions, and audit history. |
| `/generate` | `<Navigate to="/studio" replace />` | SUPPORTING REDIRECT | Legacy alias redirecting to canonical `/studio`. |
| `/queue` | `QueuePage` | CANONICAL | Studio recording intake schedule and queue of approved questions. |
| `/production` | `ProductionTrackerPage` | CANONICAL | Production Pipeline hub (Kanban/table views of video lifecycle). |
| `/production-tracker` | `<Navigate to="/production" replace />` | SUPPORTING REDIRECT | Legacy alias redirecting to canonical `/production`. |
| `/production-board` | `<Navigate to="/production?status=EDITING" />`| SUPPORTING REDIRECT | Legacy alias redirecting to `/production` with filter. |
| `/videos/create-script` | `VideoCreateScriptPage` | SUPPORTING / SELECTOR | Selector page redirecting to `/videos/:id?tab=script` once item is chosen. |
| `/videos/:videoId/script` | `<VideoTabRedirect tab="script" />` | SUPPORTING REDIRECT | Canonical deep-link redirecting to `/videos/:videoId?tab=script`. |
| `/production/:videoId/script` | `<VideoTabRedirect tab="script" />` | SUPPORTING REDIRECT | Production-prefix alias redirecting to tabbed workbench. |
| `/videos/:videoId/create-script`| `<VideoTabRedirect tab="script" />` | SUPPORTING REDIRECT | Legacy alias redirecting to tabbed workbench. |
| `/production/:videoId/create-script`| `<VideoTabRedirect tab="script" />` | SUPPORTING REDIRECT | Legacy alias redirecting to tabbed workbench. |
| `/videos/review-script` | `<Navigate to="/production?status=SCRIPT_READY" />`| SUPPORTING REDIRECT | Status redirect to production board. |
| `/videos/:videoId/review-script`| `<VideoTabRedirect tab="script" />` | SUPPORTING REDIRECT | Redirects to script tab on workbench. |
| `/production/:videoId/review-script`| `<VideoTabRedirect tab="script" />` | SUPPORTING REDIRECT | Redirects to script tab on workbench. |
| `/videos/record` | `<Navigate to="/production?status=RECORDING" />` | SUPPORTING REDIRECT | Status redirect to production board. |
| `/videos/:videoId/record` | `<VideoTabRedirect tab="recording" />` | SUPPORTING REDIRECT | Redirects to teleprompter/recording tab on workbench. |
| `/production/:videoId/record` | `<VideoTabRedirect tab="recording" />` | SUPPORTING REDIRECT | Redirects to teleprompter/recording tab on workbench. |
| `/videos/edit-video` | `<Navigate to="/production?status=EDITING" />` | SUPPORTING REDIRECT | Status redirect to production board. |
| `/videos/:videoId/edit-video` | `<VideoTabRedirect tab="editing" />` | SUPPORTING REDIRECT | Redirects to editing tab on workbench. |
| `/production/:videoId/edit-video` | `<VideoTabRedirect tab="editing" />` | SUPPORTING REDIRECT | Redirects to editing tab on workbench. |
| `/videos/final-video` | `<Navigate to="/production?status=FINAL_REVIEW" />` | SUPPORTING REDIRECT | Status redirect to production board. |
| `/videos/:videoId/final-video`| `<VideoTabRedirect tab="final-review" />`| SUPPORTING REDIRECT | Redirects to final QC review tab on workbench. |
| `/production/:videoId/final-video`| `<VideoTabRedirect tab="final-review" />`| SUPPORTING REDIRECT | Redirects to final QC review tab on workbench. |
| `/videos/thumbnail` | `<Navigate to="/production?status=READY_TO_UPLOAD" />`| SUPPORTING REDIRECT | Status redirect to production board. |
| `/videos/:videoId/thumbnail` | `<VideoTabRedirect tab="thumbnail" />` | SUPPORTING REDIRECT | Redirects to thumbnail tab on workbench. |
| `/production/:videoId/thumbnail` | `<VideoTabRedirect tab="thumbnail" />` | SUPPORTING REDIRECT | Redirects to thumbnail tab on workbench. |
| `/videos/pinned-comment` | `<Navigate to="/production" replace />` | SUPPORTING REDIRECT | Redirects to production board. |
| `/videos/:videoId/pinned-comment`| `<VideoTabRedirect tab="pinned-comment" />`| SUPPORTING REDIRECT | Redirects to pinned-comment tab on workbench. |
| `/production/:videoId/pinned-comment`| `<VideoTabRedirect tab="pinned-comment" />`| SUPPORTING REDIRECT | Redirects to pinned-comment tab on workbench. |
| `/videos/:videoId/social-review`| `<VideoTabRedirect tab="social" />` | SUPPORTING REDIRECT | Redirects to social tab on workbench. |
| `/production/:videoId/social-review`| `<VideoTabRedirect tab="social" />` | SUPPORTING REDIRECT | Redirects to social tab on workbench. |
| `/production/:videoId` | `<VideoTabRedirect />` | SUPPORTING REDIRECT | Redirects to `/videos/:videoId`. |
| `/videos/:videoId` | `VideoDetailPage` | CANONICAL | Multi-tab Video Production Workbench (Tabs: script, recording, editing, final-review, thumbnail, pinned-comment, social, publishing, overview). |
| `/platform-packages` | `PlatformPackagesPage` | CANONICAL | Multi-platform package assembler and Step 12 sync verification. |
| `/videos/platform-packages` | `PlatformPackagesPage` | SUPPORTING REDIRECT | Alias for platform packages. |
| `/videos/:videoId/platform-packages`| `PlatformPackagesPage` | SUPPORTING | Direct package view for specific video. |
| `/production/:videoId/platform-packages`| `PlatformPackagesPage` | SUPPORTING | Alias for video platform package. |
| `/publishing-package` | `<Navigate to="/platform-packages" replace />` | SUPPORTING REDIRECT | Deprecated naming alias. |
| `/videos/publishing-package`| `<Navigate to="/platform-packages" replace />` | SUPPORTING REDIRECT | Deprecated naming alias. |
| `/videos/:videoId/publishing-package`| `<Navigate to="/platform-packages" replace />` | SUPPORTING REDIRECT | Deprecated naming alias. |
| `/production/:videoId/publishing-package`| `<Navigate to="/platform-packages" replace />` | SUPPORTING REDIRECT | Deprecated naming alias. |
| `/publishing` | `PublishingPage` | CANONICAL | Multi-platform publishing manager (YouTube Shorts, Instagram Reels, Facebook). |
| `/videos/:videoId/publish` | `<VideoTabRedirect tab="publishing" />` | SUPPORTING REDIRECT | Redirects to publishing tab on video workbench. |
| `/production/:videoId/publish`| `<VideoTabRedirect tab="publishing" />` | SUPPORTING REDIRECT | Redirects to publishing tab on video workbench. |
| `/analytics` | `<Navigate to="/analytics/overview" replace />` | SUPPORTING REDIRECT | Root analytics redirect. |
| `/analytics/overview` | `AnalyticsExperiencePage` | CANONICAL | Multi-dimensional analytics dashboard (views, retention, topics). |
| `/analytics/video` | `AnalyticsExperiencePage` | SUPPORTING | Contextual sub-view of analytics experience. |
| `/analytics/platform` | `AnalyticsExperiencePage` | SUPPORTING | Contextual sub-view of analytics experience. |
| `/analytics/topic` | `AnalyticsExperiencePage` | SUPPORTING | Contextual sub-view of analytics experience. |
| `/analytics/subtopic` | `AnalyticsExperiencePage` | SUPPORTING | Contextual sub-view of analytics experience. |
| `/analytics/difficulty` | `AnalyticsExperiencePage` | SUPPORTING | Contextual sub-view of analytics experience. |
| `/analytics/engagement` | `AnalyticsExperiencePage` | CANONICAL | Step 14 Performance Review & drop-off retention curves. |
| `/analytics/retention` | `AnalyticsExperiencePage` | SUPPORTING | Contextual sub-view of analytics experience. |
| `/analytics/intelligence` | `AnalyticsExperiencePage` | CANONICAL | Step 15 Intelligence Loop & AI topic recommendations. |
| `/analytics/strategy` | `AnalyticsExperiencePage` | SUPPORTING | Contextual sub-view of analytics experience. |
| `/social-analytics` | `SocialAnalyticsPage` | CANONICAL | Step 13 Raw social engagement telemetry ingestion. |
| `/social-analytics/:contentId` | `SocialAnalyticsPage` | CANONICAL | Specific video engagement metrics collection. |
| `/my-work` | `MyWorkPage` | CANONICAL | Personal queue of assigned tasks across workflow stages. |
| `/team` | `TeamOperationsPage` | CANONICAL | Team workload distribution, capacity, and reassignment hub. |
| `/team-work` | `TeamOperationsPage` | SUPPORTING REDIRECT | Legacy alias for team workload. |
| `/settings` | `SettingsPage` | CANONICAL | System health, taxonomy configuration, and database connection. |
| `/recovery` | `RecoveryAdminPage` | CANONICAL | Disaster recovery, snapshot archive, and restore dry-run console. |
| `/admin` | `RecoveryAdminPage` | SUPPORTING REDIRECT | Alias for recovery/admin hub. |
| `*` | `NotFoundPage` | CANONICAL | Standard 404 fallback page. |

---

## 4. Page Inventory & Orphan Detection

A total of **31 page components** exist in `src/pages/`:

### Active Mounted Pages (23 Components)
1. `AnalyticsExperiencePage.tsx` — Mounted at `/analytics/*` (Steps 14 & 15).
2. `ContentMasterPage.tsx` — Mounted at `/content-masters` & `/content-masters/:id`.
3. `DashboardPage.tsx` — Mounted at `/dashboard` (Home Overview).
4. `LoginPage.tsx` — Mounted when unauthenticated.
5. `MyWorkPage.tsx` — Mounted at `/my-work` (Personal task queue).
6. `NotFoundPage.tsx` — Mounted at `*` (404 Error Shell).
7. `PlanningPage.tsx` — Mounted at `/planning` (Batch syllabus planning).
8. `PlatformPackagesPage.tsx` — Mounted at `/platform-packages` (Step 12).
9. `ProductionTrackerPage.tsx` — Mounted at `/production` (Kanban/Table pipeline).
10. `PublishingPage.tsx` — Mounted at `/publishing` (Steps 10 & 11).
11. `QuestionDetailPage.tsx` — Mounted at `/questions/:id` (Resource view & inline edit).
12. `QuestionImprovePage.tsx` — Mounted at `/questions/improve` (Overlapping legacy standalone).
13. `QuestionLibraryPage.tsx` — Mounted at `/questions` (Master catalog).
14. `QuestionStudioPage.tsx` — Mounted at `/studio` (Step 01 Question Generation).
15. `QuestionVerifyApprovePage.tsx` — Mounted at `/questions/:id/verify` (Step 02 Verification).
16. `QueuePage.tsx` — Mounted at `/queue` (Recording Intake Queue).
17. `RecoveryAdminPage.tsx` — Mounted at `/recovery` (Disaster recovery).
18. `SettingsPage.tsx` — Mounted at `/settings` (Taxonomy & System health).
19. `SocialAnalyticsPage.tsx` — Mounted at `/social-analytics` (Step 13 Telemetry).
20. `SocialReviewPage.tsx` — Mounted at `/social-review` (Step 09 Smartphone review).
21. `TeamOperationsPage.tsx` — Mounted at `/team` (Team capacity & workload).
22. `VideoCreateScriptPage.tsx` — Mounted at `/videos/create-script` (Selector page).
23. `VideoDetailPage.tsx` — Mounted at `/videos/:videoId` (Unified multi-tab video workbench).

### Unmounted / Dead / Orphaned Page Components (8 Components)
These 8 files exist in `src/pages/`, consume significant lines of code, but are **never imported in `src/App.tsx` or any active component**:

| Orphaned Page File | Lines of Code | Original Responsibility | How App.tsx Currently Handles Route |
| :--- | :--- | :--- | :--- |
| `ProductionBoardPage.tsx` | 895 lines | Kanban board for video production | Route `/production-board` redirects to `/production?status=EDITING` |
| `PublishingPackagePage.tsx` | 802 lines | Standalone publishing package builder | Route `/publishing-package` redirects to `/platform-packages` |
| `VideoEditPage.tsx` | 854 lines | Video editing master cut workspace | Route `/videos/:id/edit-video` redirects to `/videos/:id?tab=editing` |
| `VideoFinalPage.tsx` | 698 lines | Final video QC checklist | Route `/videos/:id/final-video` redirects to `/videos/:id?tab=final-review` |
| `VideoPinnedCommentPage.tsx` | 592 lines | Pinned comment generator & approvals | Route `/videos/:id/pinned-comment` redirects to `/videos/:id?tab=pinned-comment` |
| `VideoRecordPage.tsx` | 1,101 lines | Teleprompter & recording take logger | Route `/videos/:id/record` redirects to `/videos/:id?tab=recording` |
| `VideoReviewScriptPage.tsx` | 743 lines | Script review & signoff | Route `/videos/:id/review-script` redirects to `/videos/:id?tab=script` |
| `VideoThumbnailPage.tsx` | 917 lines | Thumbnail concept review & upload | Route `/videos/:id/thumbnail` redirects to `/videos/:id?tab=thumbnail` |

**Total Dead Page Code**: **6,602 lines** of unmounted code residing in `src/pages/`.
*Finding*: The functionality of the 6 standalone video pages was successfully consolidated into `VideoDetailPage.tsx` (using tabs), and `App.tsx` redirects legacy URLs to the tabbed workbench. However, the old page files were left on disk.

---

## 5. Navigation Analysis & Cognitive Duplication

### The 6 Frozen Navigation Hubs (`src/config/navigation.ts`)
The primary desktop sidebar and mobile drawer strictly follow the 6-Hub Information Architecture:
1. **HOME**: Overview (`/dashboard`), My Work (`/my-work`)
2. **QUESTIONS**: Question Library (`/questions`), Question Studio (`/studio`)
3. **PRODUCTION**: Recording Queue (`/queue`), Production Pipeline (`/production`)
4. **PUBLISHING**: Quality Signoff (`/social-review`), Publishing Manager (`/publishing`)
5. **ANALYTICS**: Analytics Hub (`/analytics/overview`)
6. **MANAGEMENT & SYSTEM**: Planning & Batches (`/planning`), Team Workload (`/team`), Content Explorer (`/content-masters`), System Health (`/settings`), Disaster Recovery (`/recovery`)

### Cognitive Duplication Findings (Tri-Layered Navigation)
When navigating into a workflow item (e.g., editing a question or video), a user experiences three simultaneous navigation systems on a single screen:
1. **Global Sidebar**: Persistent on the left with 13 hub items.
2. **Global Breadcrumb Sub-Header** (`AppBreadcrumbs.tsx`): Displays `Questions > Question Studio > Verify & Approve`.
3. **Page-Level Stepper / Journey Header**:
   - `QuestionWorkflowHeader.tsx`: Displays Step 01 (Question Gen) & Step 02 (Verification) pills at the top of the content area.
   - `ProductionJourneyBar.tsx`: Displays a horizontal 10-stage stepper across the page.
   - `VideoDetailPage.tsx`: Displays an internal 9-tab bar (`script`, `recording`, `editing`, `final-review`, `thumbnail`, `pinned-comment`, `social`, `publishing`, `overview`).

*Assessment*: While having a stepper inside a workbench provides immediate step context, having three layers of navigation bars stacked vertically consumes 180px–220px of vertical viewport before the actual workspace content begins. In S2-T05 and subsequent UI tasks, the internal stepper should be compact and strictly aligned with the canonical 15-step sequence.

---

## 6. Canonical 15-Stage Workflow Mapping

The application maps against the canonical 15-step workflow as follows:

| Step | Canonical Step Name | Primary Active UI Page | Canonical Route | Workflow State / Code | UI Coverage Status |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **01** | Question Generation | `QuestionStudioPage.tsx` | `/studio` | `DRAFT` / `GENERATED` | **ONE CANONICAL UI** |
| **02** | Question Verification | `QuestionVerifyApprovePage.tsx` | `/questions/:id/verify` | `IN_REVIEW` $\rightarrow$ `APPROVED` | **ONE CANONICAL UI** (GAR-02 gate) |
| **03** | Audience Script | `VideoDetailPage.tsx` (Tab: script) | `/videos/:id?tab=script` | `SCRIPT_READY` | **ONE CANONICAL UI** (Tabbed) |
| **04** | Teleprompter & Filming | `VideoDetailPage.tsx` (Tab: recording) | `/videos/:id?tab=recording` | `RECORDING` | **ONE CANONICAL UI** (Tabbed) |
| **05** | Raw Video Ingestion | `VideoDetailPage.tsx` (Tab: recording) | `/videos/:id?tab=recording` | `RECORDED` | **ONE CANONICAL UI** (Tabbed) |
| **06** | Editing Bay | `VideoDetailPage.tsx` (Tab: editing) | `/videos/:id?tab=editing` | `EDITING` $\rightarrow$ `EDITED` | **ONE CANONICAL UI** (Tabbed) |
| **07** | Final QC Certification | `VideoDetailPage.tsx` (Tab: final-review) | `/videos/:id?tab=final-review` | `FINAL_REVIEW` $\rightarrow$ `READY_TO_UPLOAD` | **ONE CANONICAL UI** (Tabbed) |
| **08** | Thumbnail Studio | `VideoDetailPage.tsx` (Tab: thumbnail) | `/videos/:id?tab=thumbnail` | `THUMBNAIL_READY` | **ONE CANONICAL UI** (Tabbed) |
| **09** | Social Review Simulator | `SocialReviewPage.tsx` | `/social-review/:reviewId` | `SOCIAL_APPROVED` | **ONE CANONICAL UI** (Simulator) |
| **10** | Publishing Setup | `PublishingPage.tsx` | `/publishing` | `SCHEDULED` | **ONE CANONICAL UI** |
| **11** | Published Live | `PublishingPage.tsx` | `/publishing` | `PUBLISHED` / `UPLOADED` | **ONE CANONICAL UI** |
| **12** | Platform Sync Verification | `PlatformPackagesPage.tsx` | `/platform-packages` | `SYNC_VERIFIED` | **ONE CANONICAL UI** |
| **13** | Social Analytics Ingestion | `SocialAnalyticsPage.tsx` | `/social-analytics/:contentId` | `ANALYTICS_COLLECTED` | **ONE CANONICAL UI** |
| **14** | Performance Review | `AnalyticsExperiencePage.tsx` | `/analytics/engagement` | `REVIEW_COMPLETED` | **ONE CANONICAL UI** |
| **15** | Intelligence Loop | `AnalyticsExperiencePage.tsx` | `/analytics/intelligence` | `STRATEGY_GENERATED` | **ONE CANONICAL UI** (Loops back to 01) |

*Finding*: Every one of the 15 canonical steps has an active, mounted UI component in the executable frontend. However, Steps 03 through 08 are unified into tabs within `VideoDetailPage.tsx` rather than separate individual top-level page components.

---

## 7. Workflow State Authority Analysis

### Architectural Finding: Dual Workflow Systems
The codebase currently contains **two parallel workflow models**:

1. **The Canonical 15-Stage State Machine (FC-005)**:
   - File: `src/lib/workflow/transition-matrix.ts` and `src/server/routes.ts` (`POST /api/v1/workflow/:id/transition`).
   - Models 5 orthogonal dimensions (`workflowStep`: 1..15, `contentStatus`, `mediaAssetStatus`, `reviewStatus`, `distributionStatus`).
   - Enforces strict N $\rightarrow$ N+1 transitions, GAR-02 anti-self-approval, and AP-009 AI gate.
   - Comprehensive test suite in `tests/fc-005-workflow.test.ts` passing 5/5.

2. **The Brownfield Domain Status Flow**:
   - Entities have independent string statuses:
     - Questions: `DRAFT`, `GENERATED`, `EDITING`, `VALIDATED`, `APPROVED`, `REJECTED`, `QUEUED` (`QuestionStatus` enum).
     - Videos: `QUEUED`, `SCRIPT_REQUIRED`, `SCRIPT_READY`, `RECORDING`, `RECORDED`, `EDITING`, `EDITED`, `FINAL_REVIEW`, `READY_TO_UPLOAD`, `UPLOADED`, `PUBLISHED` (`VideoProductionStatus` enum).
   - Endpoints: `PATCH /api/questions/:id/status`, `POST /api/questions/:id/queue`, `POST /api/videos/:id/status`.
   - UI integration: `QuestionStudioPage.tsx` and `QuestionVerifyApprovePage.tsx` currently mutate domain status using `apiClient.updateQuestionStatus()` and `apiClient.approveQuestionDraft()`, rather than calling `apiClient.transitionWorkflow()`.

*Risk & Verdict*: **Safely mediated but partially duplicated.**
`src/lib/workflow/canonical-workflow.ts` contains bidirectional adapter functions (`mapQuestionToWorkflowState`, `mapVideoToWorkflowState`) that compute canonical step numbers and states from domain statuses on the fly. However, the frontend UI has not yet been wired to call the FC-005 `POST /api/v1/workflow/:id/transition` endpoint as the primary mutation path.

---

## 8. API Route Domain Map

The 279 API endpoints in `src/server/routes.ts` fall into 16 logical domains:

1. **Authentication & Identity (12 endpoints)**: `/api/v1/auth/login`, `/api/v1/auth/logout`, `/api/v1/auth/me`, `/api/v1/auth/session`, `/api/auth/google/*`.
2. **Users & RBAC (8 endpoints)**: `/api/users`, `/api/v1/users/:id`, `/api/v1/users/:id/capabilities`, `/api/v1/users/:id/role`.
3. **Questions & Drafts (24 endpoints)**: `/api/questions`, `/api/questions/draft`, `/api/questions/:id`, `/api/questions/:id/status`, `/api/questions/:id/queue`, `/api/questions/:id/validate`.
4. **Canonical Workflow Engine (FC-005) (6 endpoints)**: `POST /api/v1/workflow/instances`, `GET /api/v1/workflow/:id`, `POST /api/v1/workflow/:id/transition`, `GET /api/v1/workflow/:id/history`.
5. **Auditing & Observability (FC-004) (4 endpoints)**: `/api/v1/audit/events`, `/api/audit-logs`.
6. **Video Production (28 endpoints)**: `/api/videos`, `/api/videos/:id`, `/api/videos/:id/status`, `/api/videos/:id/priority`, `/api/videos/:id/final-render/complete`.
7. **Scripts & Teleprompter (14 endpoints)**: `/api/scripts`, `/api/videos/:id/script`, `/api/videos/:id/script/generate`, `/api/videos/:id/script/mark-ready`.
8. **Thumbnails (20 endpoints)**: `/api/thumbnails/generate-concepts`, `/api/thumbnails/candidates/:id/approve`, `/api/videos/:id/thumbnail`.
9. **Social Review & Enhancements (16 endpoints)**: `/api/social-reviews`, `/api/social-reviews/decision`, `/api/social-enhancement/review/:id`.
10. **Publishing & Distribution (22 endpoints)**: `/api/publishing`, `/api/videos/:id/publishing/publish-platform`, `/api/publishing/readiness/:id/:platform`.
11. **Platform Adaptations (12 endpoints)**: `/api/adaptations`, `/api/adaptations/:id/approve`.
12. **Analytics & Retention (14 endpoints)**: `/api/analytics`, `/api/analytics/content/:contentId`, `/api/analytics/summary`.
13. **Social Comments & Intelligence (12 endpoints)**: `/api/social-comments`, `/api/comment-intelligence/analyze`.
14. **Content Strategy & Planning (20 endpoints)**: `/api/planning/plans`, `/api/planning/batches`, `/api/content-strategy/recommendations`.
15. **System Health & Disaster Recovery (24 endpoints)**: `/api/health`, `/healthz`, `/readyz`, `/api/recovery/*`, `/api/system/restore/*`.
16. **AI Orchestration & Copilot (29 endpoints)**: `/api/ai/*`, `/api/copilot/*`.

---

## 9. Service & Repository Dependency Map

### Question Workflow Tracing (Golden Path Scope)
The architectural chain for the Question domain is:

```text
[QuestionStudioPage] / [QuestionVerifyApprovePage]
        │ (HTTP via api-client.ts)
        ▼
[src/server/routes.ts]
  ├── POST /api/questions/draft      ──> questionDraftService   ──> questionDraftsRepository
  ├── POST /api/questions            ──> questionService        ──> questionsRepository
  ├── POST /api/questions/validate   ──> questionValidationService
  ├── POST /api/questions/verify     ──> multiLayerVerificationEngine
  ├── POST /api/questions/:id/queue  ──> videoProductionService ──> videosRepository
  ├── POST /api/v1/workflow/transition ──> workflowOrchestrationService ──> workflowRepository
  └── (Post-Commit Audit Trigger)    ──> auditService / firestoreAuditDispatcher
        │
        ▼
[src/lib/google-sheets/client.ts] (Authoritative Sheets Persistence)
```

### Dependency Findings:
- `questionsRepository` and `questionDraftsRepository` extend `BaseRepository` and adhere to optimistic concurrency control (`OCC`).
- `auditService` automatically records sensitive-redacted immutable event entries for state transitions.
- `workflowOrchestrationService` validates permissions and rules against `CANONICAL_TRANSITION_RULES`.

---

## 10. Legacy, Duplicate, and Orphan Classification

| Component / Artifact | Type | Canonical? | Classification | Recommended Future Action |
| :--- | :--- | :---: | :--- | :--- |
| `src/pages/VideoEditPage.tsx` | Page File | NO | ORPHANED | **RETIRE / DELETE** after verifying VideoDetailPage tab. |
| `src/pages/VideoFinalPage.tsx` | Page File | NO | ORPHANED | **RETIRE / DELETE** after verifying VideoDetailPage tab. |
| `src/pages/VideoPinnedCommentPage.tsx`| Page File | NO | ORPHANED | **RETIRE / DELETE** after verifying VideoDetailPage tab. |
| `src/pages/VideoRecordPage.tsx` | Page File | NO | ORPHANED | **RETIRE / DELETE** after verifying VideoDetailPage tab. |
| `src/pages/VideoReviewScriptPage.tsx` | Page File | NO | ORPHANED | **RETIRE / DELETE** after verifying VideoDetailPage tab. |
| `src/pages/VideoThumbnailPage.tsx` | Page File | NO | ORPHANED | **RETIRE / DELETE** after verifying VideoDetailPage tab. |
| `src/pages/ProductionBoardPage.tsx` | Page File | NO | ORPHANED | **RETIRE / DELETE** (Superceded by ProductionTrackerPage). |
| `src/pages/PublishingPackagePage.tsx`| Page File | NO | ORPHANED | **RETIRE / DELETE** (Superceded by PlatformPackagesPage). |
| `src/pages/QuestionImprovePage.tsx` | Page File | NO | OVERLAPPING | **CONSOLIDATE** into QuestionDetailPage inline edit. |
| `src/pages/VideoCreateScriptPage.tsx`| Page File | PARTIAL | SUPPORTING SELECTOR | **CONSOLIDATE** into a modal/launcher on Production board. |
| `/phase16/*`, `/phase17/*`, `/phase18/*`| API Aliases | NO | LEGACY ALIASES | **DEPRECATE** after frontend client verified. |
| `/publishing-package` routes | Frontend Route | NO | DUPLICATE ROUTE | **REDIRECT** to `/platform-packages`. |

---

## 11. Question Golden Path Map (Baseline for S2-T05)

The exact execution chain to be exercised in **S2-T05** is mapped below:

1. **Authentication**:
   - Route: `/` $\rightarrow$ `LoginPage.tsx` (if unauthenticated).
   - API: `POST /api/v1/auth/login` (Sets signed `bp_session` cookie).
   - Actor: `jithendrareddy629@gmail.com` (`USR-001`, Role: `ADMIN` / `CONTENT_LEAD`).
2. **Landing**:
   - Redirect: `/` $\rightarrow$ `/studio` or `/dashboard`.
3. **Question Authoring (Step 01)**:
   - Route: `/studio` (`QuestionStudioPage.tsx`).
   - Action: Select Topic & Subtopic, enter question text, 4 options, correct answer, and explanation.
   - Validation: Mathematical verification engine checks solution; 4-option schema enforced.
   - Save: Click "Save & Continue" $\rightarrow$ calls `POST /api/questions/draft` (or `POST /api/questions`).
4. **Transition to Verification (Step 02)**:
   - Seamless Navigation: Navigates to `/questions/:id/verify` (`QuestionVerifyApprovePage.tsx`).
5. **Question Verification Audit (Step 02 Gate)**:
   - Route: `/questions/:id/verify`.
   - Inspection: 10-point pedagogical audit checklist rendered.
   - Human Sign-Off (GAR-02): Author cannot self-approve; reviewer clicks "Approve Question".
6. **State Mutation & Queueing**:
   - API: `POST /api/questions/draft/:id/approve` and `POST /api/questions/:id/queue`.
   - Result: Question status $\rightarrow$ `APPROVED`; Video project auto-created in status `QUEUED`.
7. **Audit Ledger & Realtime**:
   - Event recorded: `QUESTION.APPROVE` in audit ledger with actor and timestamp.
8. **Catalog Visibility & Read-Back**:
   - Route: `/questions` (`QuestionLibraryPage.tsx`).
   - Verification: Approved question visible in master table with correct topic, difficulty, and status badges.
9. **Detail Inspection**:
   - Route: `/questions/:id` (`QuestionDetailPage.tsx`).
   - Read-back: Full data verified from Google Sheets persistence.

---

## 12. Architectural Risks & Recommendations

### Known Risks
1. **Dual State Mutation Paths**: As identified in Section 7, the UI currently mutates domain status rather than triggering the FC-005 universal transition endpoint. In S2-T05, we must verify that domain approval properly synchronizes with workflow persistence without state mismatch.
2. **Large Dead Code Footprint**: The 6,602 lines of unmounted page code in `src/pages/` do not execute at runtime, but can cause confusion during maintenance and code audits.
3. **Legacy Redirection Bloat in `App.tsx`**: Over 20 routes in `App.tsx` exist purely to redirect old phase-based URLs (`/videos/:id/record`, `/production/:id/script`) to the tabbed workbench.

### Summary of Recommended Future Actions (For Sprint 3 / Stabilization)
- **Do not refactor now**: Maintain existing routes and redirect helpers so existing bookmarks and tests remain 100% operational.
- **In Sprint 3**: Safely prune the 8 unmounted page files after verifying test coverage.
- **In S2-T05**: Proceed directly with verifying the Question Golden Path using the canonical `/studio` $\rightarrow$ `/questions/:id/verify` $\rightarrow$ `/questions` flow.

---

## 13. Anti-Overclaim & Integrity Confirmation

**No application source code, API contracts, routing logic, or database behavior was altered in this task. This analysis represents the verified as-built state of the executable system.**
