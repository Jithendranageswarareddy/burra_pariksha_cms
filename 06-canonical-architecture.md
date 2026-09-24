# STAGE 6 — CANONICAL ARCHITECTURE DESIGN
## Burra Pariksha CMS
**Authoritative Technical Constitution, Canonical System Design, and Refactoring Specification**

---

## 1. CANONICAL ARCHITECTURAL PRINCIPLES

This document establishes the **Technical Constitution** of the Burra Pariksha CMS. Every future modification, refactoring, and feature addition implemented in Stage 7 and beyond must strictly adhere to these architectural laws:

### 1.1 The Rule of Single Ownership
Every business operation, state concept, and persistent entity must have exactly **ONE** unambiguous owner:
$$\text{ONE Business Responsibility} \longrightarrow \text{ONE Workflow Step} \longrightarrow \text{ONE Canonical Page/Workspace} \longrightarrow \text{ONE Canonical Route} \longrightarrow \text{ONE Canonical API} \longrightarrow \text{ONE Domain Service} \longrightarrow \text{ONE Repository} \longrightarrow \text{ONE Authoritative Data Store}$$

### 1.2 Structural Invariants
1. **Single Source of Truth**: No business entity may have duplicate repositories writing to different storage media (e.g., Google Sheet vs. in-memory JavaScript `Map`). Google Sheets is the sole authoritative persistence tier for CMS production data.
2. **Strict Layered Separation**:
   - **Frontend UI** interacts strictly via `apiClient`. Direct Google Drive or Sheets API access from the client is prohibited.
   - **Route Handlers** (`routes.ts`) perform request parsing, Zod validation, and role enforcement, then immediately delegate to Domain Services. Business logic and repository queries in route handlers are prohibited.
   - **Domain Services** own business logic, state machines, workflow transitions, and orchestration. Services never execute direct spreadsheet API calls.
   - **Repositories** own data persistence, header mapping, schema parsing, and query caching. Repositories do not implement workflow state machine rules.
3. **Strict Production vs. Analytics Boundary**:
   - Production CMS data (`GOOGLE_SHEETS_SPREADSHEET_ID`) and Performance Analytics data (`ANALYTICS_SPREADSHEET_ID`) reside in separate workbooks.
   - Analytics services and repositories possess **zero write paths** into the Production CMS workbook.
   - Feedback from analytics into production (Step 15 $\rightarrow$ Step 01) occurs exclusively via user-approved parameter pre-population in the Question Studio UI.
4. **Authoritative Navigation Primacy**:
   - Global application navigation is owned exclusively by the Left Sidebar.
   - 15-step conveyor orchestration is owned exclusively by `ProductionJourneyBar` backed by `ProductionJourneyContext`.
   - Legacy stepper headers (`VideoWorkflowHeader`, `AssetWorkflowHeader`, `PublishingWorkflowHeader`, `QuestionWorkflowHeader`) are prohibited from competing with the conveyor and must be retired.
5. **Zero Sequence Contamination**:
   - Sequence generation is owned strictly by `SequencesRepository` via `IdService`.
   - Non-canonical identifiers (e.g., `TEST-*`, temporary IDs) must never affect sequence allocation or numeric cursors.
6. **Fail-Closed Security & Integrity**:
   - Missing required headers, schema mismatches, or unauthenticated operations must fail closed immediately with typed domain errors.

---

## 2. CANONICAL APPLICATION TOPOLOGY

The Burra Pariksha CMS top-level architecture is organized into four clean horizontal tiers:

```
┌────────────────────────────────────────────────────────────────────────┐
│                         PRESENTATION TIER                              │
│  • App Shell & Sidebar (Application Navigation)                        │
│  • ProductionJourneyBar (15-Step Conveyor Navigation)                  │
│  • 16 Canonical Pages & Workspaces (React 19 + TypeScript + Tailwind)  │
│  • ProductionJourneyContext (Active entity & step state)               │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ apiClient (Zod-typed requests)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                           API ROUTING TIER                             │
│  • Express Router (/api/*)                                             │
│  • Auth & RBAC Middleware (Bearer Token / Session Cookie)              │
│  • Zod Input Validation (Fail-closed request schema parsing)           │
│  • HTTP Error Mapping (DomainError -> HTTP status code)                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Domain Invocations
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         DOMAIN SERVICE TIER                            │
│  • 21 Canonical Domain Services (State machines, AI, validation)       │
│  • Workflow Orchestrator (State machine validation & audit logging)    │
│  • Multi-Layer Verification Engines & AI Grounding                     │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Data Operations
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        DATA PERSISTENCE TIER                           │
│  • 26 Canonical Repositories (Extending BaseRepository)                │
│  • Google Sheets Client (Rate-limited, exponential backoff, memoized)  │
├───────────────────────────────────┬────────────────────────────────────┤
│   Production CMS Google Sheet     │    Analytics Google Sheet          │
│   (23 Canonical Worksheets)       │    (5 Append-Only Worksheets)      │
│   QUESTIONS, VIDEOS, SCRIPT, etc. │    SOCIAL_ANALYTICS, COMMENTS, etc.│
└───────────────────────────────────┴────────────────────────────────────┘
```

---

## 3. CANONICAL NAVIGATION & DEEP-LINK ARCHITECTURE

### 3.1 Hierarchy of Navigation Systems

| Navigation Tier | Controlling Component | Authoritative Scope | State Owner |
|---|---|---|---|
| **Tier 1: Global Application Navigation** | `AppShell` / `Sidebar` | Hub-level navigation across major product domains (Questions, Production, Publishing, Analytics, Team, Settings). | URL Pathname |
| **Tier 2: Production Conveyor Navigation** | `ProductionJourneyBar` | Linear 15-stage workflow progression, step blockers, and intelligent Next Action dispatch. | `ProductionJourneyContext` + URL query `?tab=` |
| **Tier 3: In-Context Workspace Tabs** | `VideoDetailPage` tab switcher | Switching views within a single video entity (`?tab=script`, `recording`, `editing`, etc.). | URL query `?tab=` |
| **Tier 4: Entity Deep Links** | In-app links, action buttons | Direct navigation to specific items (e.g., `/videos/BP-V-000001?tab=editing`). | URL Route Params (`:id`) |

### 3.2 Canonical Sidebar Structure (7 Hubs)

```
[BURRA PARIKSHA CMS]
├── 1. QUESTION STUDIO       → /studio             (Step 01: Drafting & AI Generation)
├── 2. QUESTION DIRECTORY    → /questions          (Step 02: Verification & Catalog)
├── 3. VIDEO PRODUCTION      → /production         (Pipeline Overview & Step 03-08 Dispatch)
├── 4. SOCIAL REVIEW GATE    → /social-review      (Step 09: 9:16 Smartphone Simulator Gate)
├── 5. PUBLISHING HUB        → /publishing         (Steps 10-12: Multi-Platform Schedule & Live URL)
├── 6. ANALYTICS & INSIGHTS  → /analytics          (Steps 13-15: Performance, Retention, AI Strategy)
└── 7. OPERATIONS & SYSTEM   → /team, /settings    (Workload, Admin, System Diagnostics)
```

### 3.3 Deep-Link & Parameter Standards
- **Canonical Question Identifiers**: Always use route parameter `/questions/:id` or query parameter `?questionId=BP-Q-######`. Deprecate ambiguous `?id=`.
- **Canonical Video Identifiers**: Always use route parameter `/videos/:videoId` and tab parameter `?tab=[script|recording|editing|final-review|thumbnail]`.
- **Canonical Content Master Identifiers**: Always use route parameter `/content-masters/:id` or query parameter `?contentId=BP-CNT-######`.
- **Login Deep-Link Preservation**: `AuthGuard` must preserve `location.pathname + location.search` in a `redirect` query parameter upon login redirect.

### 3.4 Elimination of Competing Steppers
- **REMOVE** `VideoWorkflowHeader.tsx`: Legacy 5-step header links to deprecated standalone paths.
- **REMOVE** `AssetWorkflowHeader.tsx`: Hardcodes obsolete Phase 8 nomenclature.
- **REMOVE** `PublishingWorkflowHeader.tsx`: Links to dead route `/publishing-package`.
- **MERGE** `QuestionWorkflowHeader.tsx` into `ProductionJourneyBar.tsx`.

---

## 4. CANONICAL ROUTE CONSTITUTION

Every valid route in the application is explicitly specified below. Any route not listed here is unauthorized and subject to removal.

| Canonical Route Path | Purpose | Canonical Page Component | Step Span | Decision | Notes / Replacement |
|---|---|---|---|---|---|
| `/studio` | Question AI Generation, Taxonomy & Drafting | `QuestionStudioPage` | Step 01 | **KEEP** | Authoritative generator hub. |
| `/questions` | Question Catalog, Filtering & Status Overview | `QuestionLibraryPage` | Steps 01–02 | **KEEP** | Authoritative catalog. |
| `/questions/:id` | Unified Question Inspector & Refinement | `QuestionDetailPage` | Steps 01–02 | **MERGE** | Absorbs `QuestionImprovePage`. |
| `/questions/:id/verify` | 10-Point Pedagogical Verification & Approval Gate | `QuestionVerifyApprovePage` | Step 02 | **KEEP** | Authoritative verification gate. |
| `/questions/verify` | Verification Queue Dispatcher | `QuestionVerifyApprovePage` | Step 02 | **KEEP** | Loads first pending question. |
| `/production` | Production Pipeline Tracker & Global Kanban | `ProductionTrackerPage` | Steps 03–08 | **KEEP** | Authoritative production monitor. |
| `/videos/:videoId` | Unified Master Video Production Workspace | `VideoDetailPage` | Steps 03–08 | **KEEP** | Uses `?tab=` parameter. |
| `/social-review` | Social Review Queue | `SocialReviewPage` | Step 09 | **KEEP** | Authoritative social review list. |
| `/social-review/:reviewId` | 9:16 Interactive Review Simulator & Gate | `SocialReviewPage` | Step 09 | **KEEP** | Authoritative review gate. |
| `/publishing` | Publishing Tracker, Scheduling & Live URL Recording| `PublishingPage` | Steps 10–11 | **MERGE** | Absorbs `PublishingWorkspace`. |
| `/platform-packages` | Multi-Platform Adaptation Explorer (YT, IG, FB) | `PlatformPackagesPage` | Step 12 | **KEEP** | Authoritative platform adaptation. |
| `/social-analytics/:contentId` | Manual Metric Entry & Snapshot Ingestion | `SocialAnalyticsPage` | Step 13 | **KEEP** | Authoritative data entry hub. |
| `/analytics` | Comprehensive Analytics & AI Loopback | `AnalyticsExperiencePage` | Steps 14–15 | **KEEP** | Multi-tab analytics console. |
| `/planning` | Curriculum Planning, Batches & Gap Radar | `PlanningPage` | Pre-Prod | **KEEP** | Authoritative curriculum planner. |
| `/my-work` | Personal Task Inbox & Blocked Item Dispatcher | `MyWorkPage` | Operational | **KEEP** | Authoritative task queue. |
| `/team` | Workload Balancing & Member Administration | `TeamOperationsPage` | Operational | **KEEP** | Authoritative team operations. |
| `/content-masters/:id` | Content Master Graph Explorer & Lifecycle Audits | `ContentMasterPage` | Governance | **KEEP** | Authoritative entity tree viewer. |
| `/settings` | System Health, Taxonomy Editor & Recovery | `SettingsPage` | System Admin| **KEEP** | Restricted to Admin/Manager. |
| `/login` | Authentication Portal & Role Simulator | `LoginPage` | System Auth | **KEEP** | Session token creator. |
| `*` | 404 Catch-All Fallback | `NotFoundPage` | Fallback | **KEEP** | Safe fallback to `/dashboard`. |

### 4.1 Compatibility Redirect Registry (Stage 7 Implementation)
The following legacy routes must permanently issue HTTP 301 / React Router `<Navigate replace />` redirects to their canonical targets:

| Inbound Legacy Route | Canonical Redirect Target | Replacement Reason |
|---|---|---|
| `/questions/:id/improve` | `/questions/:id?mode=edit` | Consolidated into unified `QuestionDetailPage`. |
| `/videos/create-script` | `/production` | Legacy selector replaced by Production Tracker. |
| `/videos/:id/script` | `/videos/:id?tab=script` | Consolidated into unified `VideoDetailPage`. |
| `/videos/record` | `/production` | Standalone page superseded by tabbed workspace. |
| `/videos/:id/record` | `/videos/:id?tab=recording` | Consolidated into unified `VideoDetailPage`. |
| `/videos/edit-video` | `/production` | Standalone page superseded by tabbed workspace. |
| `/videos/:id/edit-video` | `/videos/:id?tab=editing` | Consolidated into unified `VideoDetailPage`. |
| `/videos/final-video` | `/production` | Standalone page superseded by tabbed workspace. |
| `/videos/:id/final-video` | `/videos/:id?tab=final-review` | Consolidated into unified `VideoDetailPage`. |
| `/videos/thumbnail` | `/production` | Standalone page superseded by tabbed workspace. |
| `/videos/:id/thumbnail` | `/videos/:id?tab=thumbnail` | Consolidated into unified `VideoDetailPage`. |
| `/videos/:id/pinned-comment`| `/videos/:id?tab=pinned-comment` | Consolidated into unified `VideoDetailPage`. |
| `/publishing-package` | `/platform-packages` | Dead route replaced by Platform Packages. |
| `/production-board` | `/production` | Dead route replaced by Production Tracker. |
| `/dashboard` | `/production` | Consolidated overview. |

---

## 5. CANONICAL PAGE ARCHITECTURE DECISIONS

### 5.1 Analysis and Classification of Pages

| Page Component | Canonical Responsibility | Decision | Justification & Refactoring Action |
|---|---|---|---|
| `QuestionStudioPage.tsx` | AI Question Generation, Taxonomy & Drafting (Step 01) | **KEEP** | Authoritative drafting workspace. Clean integration with AI services and loopback parameters. |
| `QuestionLibraryPage.tsx` | Question Catalog Browsing, Search & Filter | **KEEP** | Authoritative search and selection catalog. |
| `QuestionVerifyApprovePage.tsx` | 10-Point Pedagogical Verification & Approval Gate (Step 02) | **KEEP** | Authoritative gate for certification and automatic video queue allocation (`BP-V-######`). |
| `QuestionImprovePage.tsx` | Editorial Refinement & Math Checks | **MERGE** | **Merge into `QuestionDetailPage.tsx`**. Having two full question editing forms causes confusion. `QuestionDetailPage` becomes the single editing and inspection surface. |
| `QuestionDetailPage.tsx` | Comprehensive Question Inspector, History & Editor | **KEEP (ENHANCED)** | Absorbs editing logic from `QuestionImprovePage.tsx`. |
| `VideoDetailPage.tsx` | Master Unified Video Production Workspace (Steps 03–08) | **KEEP** | Authoritative container for production sub-workspaces (`ScriptWorkspace`, `RecordingWorkspace`, `EditingWorkspace`, `FinalReviewWorkspace`, `ThumbnailWorkspace`). |
| `SocialReviewPage.tsx` | 9:16 Smartphone Simulator Review Gate (Step 09) | **KEEP (CANONICAL GATE)** | **Authoritative home for Step 09**. Deprecate duplicate review gate inside `VideoDetailPage?tab=social`. `VideoDetailPage` should link directly to `/social-review/:id`. |
| `PublishingPage.tsx` | Publishing Tracker, Multi-Platform Schedule & Live URL (Steps 10–11) | **KEEP (CANONICAL HUB)** | **Authoritative home for Steps 10 & 11**. Deprecate duplicate URL entry form in `VideoDetailPage?tab=publishing`. |
| `PlatformPackagesPage.tsx` | Multi-Platform Package Adaptations & Sync (Step 12) | **KEEP** | Authoritative workspace for platform-specific character limits, hashtags, and diffs. |
| `SocialAnalyticsPage.tsx` | Manual Metric Entry & Snapshot Recording (Step 13) | **KEEP** | Authoritative data entry and audience comment review workspace. |
| `AnalyticsExperiencePage.tsx` | Performance Review & Strategy Loopback (Steps 14–15) | **KEEP** | Authoritative analytics console and AI strategy recommendation engine with loopback to Step 01. |
| `PlanningPage.tsx` | Curriculum Sprints, Batches & Syllabus Radar | **KEEP** | Authoritative pre-production planning hub. |
| `ProductionTrackerPage.tsx` | Production Pipeline Tracking & Kanban Board | **KEEP** | Authoritative global monitor for all videos. |
| `MyWorkPage.tsx` | Personalized User Task Queue | **KEEP** | Authoritative dispatcher for individual contributors. |
| `TeamOperationsPage.tsx` | Team Workload Balancing & Member Administration | **KEEP** | Authoritative resource allocation console. |
| `ContentMasterPage.tsx` | Content Master Graph Explorer & Lifecycle Audit | **KEEP** | Authoritative entity relationship inspector. |
| `Phase23ProductionDashboardPage.tsx`| Advanced Operations Search & Queues | **MERGE / DEPRECATE** | Subsume unique search filters into `ProductionTrackerPage.tsx`; deprecate standalone route. |
| `ProductionBoardPage.tsx` | Legacy Read-Model Production Board | **REMOVE** | **Dead code**. 859 lines unmounted in `App.tsx`. Permanently remove file. |
| `PublishingPackagePage.tsx` | Legacy Pre-Publish Checklist Page | **REMOVE** | **Dead code**. 803 lines unmounted in `App.tsx`. Permanently remove file. |
| `VideoReviewScriptPage.tsx` | Legacy Standalone Script Page | **REMOVE** | **Dead code**. Superseded by `ScriptWorkspace` in `VideoDetailPage`. |
| `VideoRecordPage.tsx` | Legacy Standalone Filming Page | **REMOVE** | **Dead code**. Superseded by `RecordingWorkspace` in `VideoDetailPage`. |
| `VideoEditPage.tsx` | Legacy Standalone Editing Bay | **REMOVE** | **Dead code**. Superseded by `EditingWorkspace` in `VideoDetailPage`. |
| `VideoFinalPage.tsx` | Legacy Standalone Final QC Page | **REMOVE** | **Dead code**. Superseded by `FinalReviewWorkspace` in `VideoDetailPage`. |
| `VideoThumbnailPage.tsx` | Legacy Standalone Thumbnail Page | **REMOVE** | **Dead code**. Superseded by `ThumbnailWorkspace` in `VideoDetailPage`. |
| `VideoPinnedCommentPage.tsx`| Legacy Standalone Pinned Comment Page | **REMOVE** | **Dead code**. Superseded by `PinnedCommentWorkspace` in `VideoDetailPage`. |
| `VideoCreateScriptPage.tsx` | Legacy Script Picker Shim | **REMOVE** | **Dead code**. Unnecessary redirect shim. |

---

## 6. CANONICAL 15-STEP WORKFLOW SPECIFICATION

This is the definitive production lifecycle specification. Every step defines its canonical page, route, lifecycle state transition, authoritative API, and exception handling:

| Step | Business Responsibility | Canonical Page | Canonical Route | Canonical Lifecycle State | Authoritative API Endpoint | Primary Domain Service | Completion Gate Condition | Forward Step | Rejection / Revision Route |
|---|---|---|---|---|---|---|---|---|---|
| **01** | **Question Generation** | `QuestionStudioPage` | `/studio` | `DRAFT` | `POST /api/questions` | `questionService` | Valid Question schema, math proof verified, record created (`BP-Q-######`). | Step 02 | N/A (Draft discard) |
| **02** | **Question Verification** | `QuestionVerifyApprovePage` | `/questions/:id/verify` | `IN_REVIEW` $\rightarrow$ `APPROVED` | `POST /api/questions/:id/approve` | `questionService` | 10-point pedagogical audit certified; Video queued (`BP-V-######`) in status `QUEUED`. | Step 03 | Return to Author (`/questions/:id?mode=edit`) with reviewer feedback notes. |
| **03** | **Audience Script** | `VideoDetailPage` (`ScriptWorkspace`) | `/videos/:id?tab=script` | `SCRIPT_REQUIRED` $\rightarrow$ `SCRIPT_READY` | `POST /api/videos/:id/script` | `scriptService` | Script text saved, word-count / teleprompter speed validated, status $\rightarrow$ `SCRIPT_READY`. | Step 04 | Revision in place (`v1` $\rightarrow$ `v2` diff tracked). |
| **04** | **Recording** | `VideoDetailPage` (`RecordingWorkspace`) | `/videos/:id?tab=recording` | `RECORDING` | `PATCH /api/videos/:id/status` | `videoService` | Host starts teleprompter rehearsal and filming session, status $\rightarrow$ `RECORDING`. | Step 05 | Re-take recorded locally. |
| **05** | **Raw Footage Handoff** | `VideoDetailPage` (`RecordingWorkspace`) | `/videos/:id?tab=recording` | `RECORDING` $\rightarrow$ `RECORDED` | `POST /api/videos/:id/upload` | `googleDriveService`, `videoService` | Raw video file uploaded to Drive or folder URL linked, status $\rightarrow$ `RECORDED`. | Step 06 | Missing footage blocks editing transition. |
| **06** | **Video Editing** | `VideoDetailPage` (`EditingWorkspace`) | `/videos/:id?tab=editing` | `EDITING` $\rightarrow$ `EDITED` | `PUT /api/videos/:id` | `videoService` | Master cut Google Drive URL linked, 6-point Shorts pacing checklist confirmed, status $\rightarrow$ `EDITED`. | Step 07 | Editorial rework in editing bay. |
| **07** | **Final QC** | `VideoDetailPage` (`FinalReviewWorkspace`) | `/videos/:id?tab=final-review` | `UNDER_REVIEW` $\rightarrow$ `QC_APPROVED` | `POST /api/videos/:id/qc-approve` | `videoService`, `workflowOrchestrator` | 6-point Master QC standards certified (audio, safe-zone, answer key), status $\rightarrow$ `QC_APPROVED`. | Step 08 | **REJECT**: Status returns to `EDITING`; Video editor notified with rejection reasons. |
| **08** | **Thumbnail** | `VideoDetailPage` (`ThumbnailWorkspace`) | `/videos/:id?tab=thumbnail` | `THUMBNAIL_READY` | `POST /api/thumbnails` | `thumbnailService`, `googleDriveService` | High-CTR curiosity headline set, graphic uploaded to Drive, linked to video. | Step 09 | Redesign uploaded as new version. |
| **09** | **Social Review** | `SocialReviewPage` | `/social-review/:reviewId` | `PENDING_REVIEW` $\rightarrow$ `APPROVED` | `POST /api/social-reviews/decision` | `socialReviewService` | 9:16 simulator audit passed, safe-zone verified, editorial signoff registered in `SOCIAL_REVIEWS`. | Step 10 | **REJECT**: Status returns to `CHANGES_REQUESTED`; returned to Creator. |
| **10** | **Publishing Setup** | `PublishingPage` | `/publishing` | `SCHEDULED` | `POST /api/publishing/schedule` | `publishingService` | Prerequisite assets confirmed (`QC_APPROVED`, Thumbnail ready), publication timestamp saved. | Step 11 | Reschedule publication time. |
| **11** | **Published / Live Verification** | `PublishingPage` | `/publishing` | `UPLOADED` / `PUBLISHED` | `POST /api/publishing/finalize` | `publishingService` | Live platform URLs (YouTube Shorts, IG Reels, FB Video) validated via regex and persisted. | Step 12 | Publication retry / URL correction. |
| **12** | **Platform Sync / Package** | `PlatformPackagesPage` | `/platform-packages/:videoId` | `SYNC_VERIFIED` | `GET /api/platform-packages/:videoId` | `platformAdaptationService` | Platform-specific adaptations (hashtags, character limits) verified against live posts. | Step 13 | Re-sync package metadata. |
| **13** | **Social Analytics** | `SocialAnalyticsPage` | `/social-analytics/:contentId` | `METRICS_RECORDED` | `POST /api/analytics` | `analyticsService` | Real 24h / 7d metrics (Views, Likes, Retention %, Audience comments) entered into analytics workbook. | Step 14 | Metric corrections appended. |
| **14** | **Performance Review** | `AnalyticsExperiencePage` | `/analytics/engagement` | `REVIEWED` | `GET /api/analytics/summary` | `analyticsService` | Retention curves, completion rates, and audience sentiment reviewed by Content Lead. | Step 15 | Additional metric filtering. |
| **15** | **Performance Intelligence Loopback**| `AnalyticsExperiencePage` | `/analytics/intelligence` | `STRATEGY_GENERATED` | `POST /api/content-strategy/recommendations/:id/apply` | `contentStrategyService` | AI insights generated; user applies strategy recommendation $\rightarrow$ redirects to Step 01 (`/studio`). | Step 01 | Regenerate recommendations. |

---

## 7. CANONICAL API ARCHITECTURE DECISIONS

### 7.1 Elimination of Duplicate & Competing Endpoints

| Business Domain | Competing Endpoints in `routes.ts` | Canonical API Endpoint | Decision | Architectural Rationale |
|---|---|---|---|---|
| **Social Review Decision** | 1. `POST /social-reviews/decision`<br>2. `POST /social-enhancement/review/:id/approve`<br>3. `POST /social-enhancement/review/:id/reject` | `POST /api/social-reviews/decision` | **KEEP #1, DEPRECATE #2 & #3** | Endpoint #1 is typed, supports granular decision payloads (APPROVE/REJECT/CHANGES_REQUESTED), and persists directly to `SOCIAL_REVIEWS` sheet. |
| **Publishing Scheduling** | 1. `POST /videos/:videoId/publishing/schedule`<br>2. `PUT /publishing/:id`<br>3. `POST /publishing/search` | `POST /api/videos/:videoId/publishing/schedule` | **KEEP #1, DEPRECATE #2** | Endpoint #1 enforces prerequisite readiness validation (`QC_APPROVED`) before allowing schedule updates. |
| **Publishing Finalize / Live URLs** | 1. `POST /videos/:videoId/publishing/finalize`<br>2. `POST /publishing/mark-published` | `POST /api/videos/:videoId/publishing/finalize` | **KEEP #1, REMOVE #2** | Endpoint #1 persists to `PUBLISHING` Google Sheet. Endpoint #2 writes to an ephemeral in-memory Map (`phase22PublishingRepository`) and causes data loss on restart. |
| **Script Saving** | 1. `POST /videos/:videoId/script`<br>2. `PUT /videos/:videoId/script`<br>3. `POST /phase16/script/:id/save` | `POST /api/videos/:videoId/script` | **KEEP #1, REMOVE #2 & #3** | Standardize on POST for script version creation with immutable version history in `SCRIPT_VERSIONS`. |
| **Question Ingestion** | 1. `POST /questions`<br>2. `POST /questions/create` | `POST /api/questions` | **KEEP #1, REMOVE #2** | Eliminate legacy `/create` suffix alias. |

### 7.2 Test Endpoint Policy
The 76 test and diagnostic endpoints currently mounted directly on `apiRouter` (e.g., `/tests/phase5`, `/tests/task3f4`, `/tests/deletion-safety`):
- **Decision**: **MOVE TO ISOLATED TEST ROUTER**.
- Test endpoints must never be registered on the production API router. They must be moved to `src/server/test-routes.ts` and mounted strictly under condition `process.env.NODE_ENV !== 'production' && process.env.ENABLE_TEST_HARNESS === 'true'` at `/api/internal/tests/*`.

---

## 8. CANONICAL SERVICE ARCHITECTURE DECISIONS

### 8.1 Resolution of Competing Core vs. Phase Services

| Domain Responsibility | Core Service | Phase Service | Canonical Owner | Decision | Action & Migration Direction |
|---|---|---|---|---|---|
| **Social Review Gate** | `social-review.service.ts` | `phase20-social-review.service.ts` | `social-review.service.ts` | **MERGE into Core, REMOVE Phase20** | Retain `social-review.service.ts` because it writes to Google Sheets (`SOCIAL_REVIEWS`). Port any unique 9:16 aspect ratio helper functions from Phase 20 into Core; eliminate Phase 20 service and its in-memory repository. |
| **Publishing Hub** | `publishing.service.ts` | `phase22-publishing-hub.service.ts` | `publishing.service.ts` | **MERGE into Core, REMOVE Phase22** | Retain `publishing.service.ts` because it persists to `PUBLISHING` Google Sheet. Port platform-specific package helpers from Phase 22 into Core; eliminate Phase 22 service and its in-memory repository. |
| **Platform Adaptation** | `platform-adaptation.service.ts` | `phase21-platform-adaptation.service.ts` | `platform-adaptation.service.ts` | **MERGE into Core, REMOVE Phase21** | Retain Core `platform-adaptation.service.ts`. Consolidate version-tracking logic; eliminate Phase 21 wrapper service. |
| **Script Production** | `script.service.ts` | `phase15-script-production.service.ts` | `script.service.ts` | **KEEP Core, REMOVE Phase15** | `phase15ScriptProductionService` is a redundant passthrough wrapper around `script.service.ts`. Remove wrapper. |
| **Video Production** | `video.service.ts` | `phase17-video-production.service.ts` | `video.service.ts` | **KEEP Core, REMOVE Phase17** | `phase17VideoProductionService` is a redundant wrapper around `video.service.ts`. Remove wrapper. |
| **Thumbnail Intelligence**| `thumbnail.service.ts` | `phase18-thumbnail-intelligence.service.ts`| `thumbnail.service.ts` | **MERGE into Core, REMOVE Phase18** | Merge AI prompt variant generation into `thumbnail.service.ts` as sub-methods; eliminate Phase 18. |
| **Pinned Comments** | `pinned-comment.service.ts` | `phase19-pinned-comment-intelligence.service.ts`| `pinned-comment.service.ts`| **MERGE into Core, REMOVE Phase19** | Merge engagement challenge generation into `pinned-comment.service.ts`; eliminate Phase 19. |
| **Workflow State Machine**| `workflow.service.ts` | `workflow-orchestration.service.ts` | `workflow-orchestration.service.ts` | **KEEP Orchestration, MERGE Core** | `workflow-orchestration.service.ts` possesses comprehensive state transition validation and audit logging. Consolidate `workflow.service.ts` audit helpers into it. |
| **Operations Dashboard** | `production-board.service.ts` | `phase23-production.service.ts` | `video.service.ts` + `dashboard.service.ts` | **MERGE into Core, REMOVE Phase23** | Discontinue standalone board read-model; standard queries in `video.service.ts` satisfy all pipeline views. |

---

## 9. CANONICAL REPOSITORY ARCHITECTURE DECISIONS

### 9.1 Resolution of In-Memory Data Loss Hazard

| Repository File | Persistence Backing | Canonical Decision | Rationale & Remediation |
|---|---|---|---|
| `social-reviews.repository.ts` | Google Sheets (`SOCIAL_REVIEWS`) | **KEEP (CANONICAL)** | Authoritative Google Sheets persistence for Step 09 review records. |
| `phase20-social-reviews.repository.ts` | In-Memory `Map` | **REMOVE** | **CRITICAL DATA LOSS HAZARD**. Discard in-memory store; redirect all review queries to `socialReviewsRepository`. |
| `publishing.repository.ts` | Google Sheets (`PUBLISHING`) | **KEEP (CANONICAL)** | Authoritative Google Sheets persistence for Step 10/11 publishing records. |
| `phase22-publishing.repository.ts` | In-Memory `Map` | **REMOVE** | **CRITICAL DATA LOSS HAZARD**. Discard in-memory store; redirect all publishing queries to `publishingRepository`. |
| `platform-adaptations.repository.ts` | In-Memory `Map` | **MERGE into `publishing.repository.ts`** | Platform adaptations represent platform-specific projections of publishing packages. Persist adaptations directly in `PUBLISHING` worksheet columns or as serialized JSON rather than an in-memory map. |
| `pinned-comment-packages.repository.ts` | In-Memory `Map` | **MERGE into `pinned-comments.repository.ts`** | Persist packages directly into `PINNED_COMMENTS` worksheet. |
| `thumbnail-candidates.repository.ts` | In-Memory `Map` | **DEPRECATE (Ephemeral Cache)** | Treat as an explicit ephemeral session cache during generation; permanent assets must reside in `thumbnails.repository.ts`. |
| `refinement-candidates.repository.ts` | In-Memory `Map` | **DEPRECATE (Ephemeral Cache)** | Treat as an explicit ephemeral session cache during AI question generation; approved drafts must reside in `questions.repository.ts`. |
| `question-videos.repository.ts` | Google Sheets (`QUESTION_VIDEOS`) | **KEEP** | Authoritative join table mapping Question $\leftrightarrow$ Video. |
| `users.repository.ts` | Google Sheets (`USERS`) | **KEEP** | Authoritative user and role credentials store. |

---

## 10. CANONICAL CONTEXT & STATE ARCHITECTURE

### 10.1 Authoritative State Ownership Matrix

| State Domain | Authoritative Owner | Secondary / Derived Consumers | Conflict Resolution Rule |
|---|---|---|---|
| **User Identity & Role** | `AuthContext` | All pages, `AuthGuard`, navigation | `AuthContext` state initialized from `/api/auth/me` is authoritative. |
| **Current Production Item** | URL Route Param (`:videoId` or `:id`) | `ProductionJourneyContext`, Workspaces | **URL ROUTE PARAM WINS**. If URL changes, `ProductionJourneyContext` must synchronize to match the URL. |
| **Current Production Step** | `VideoDetailPage` URL `?tab=` | `ProductionJourneyBar`, Workspaces | **URL QUERY PARAM WINS**. Tab param drives mounted workspace. `ProductionJourneyBar` indicates active tab. |
| **Entity Workflow Status** | Backend Google Sheets Record | UI Status Pills, Transition Guards | **BACKEND STATUS WINS**. UI optimistic updates must revert if backend rejects transition. |
| **Next Action Calculation** | `ProductionJourneyContext.computeStages()` | Intelligent Next Action button in conveyor | Deterministic calculation based on backend status and prerequisite asset presence. |

---

## 11. CANONICAL DATA RELATIONSHIP MODEL

### 11.1 Authoritative Entity Linkage Graph

```
                   ┌──────────────────────────────────────┐
                   │            CONTENT_MASTER            │
                   │           (BP-CNT-######)            │
                   │        Authoritative Content Root    │
                   └──────────┬───────────────────────────┘
                              │ 1:N
                              ▼
                   ┌──────────────────────────────────────┐
                   │              QUESTIONS               │
                   │           (BP-Q-######)              │
                   │    Foreign Key: contentId (BP-CNT)   │
                   └──────────┬───────────────────────────┘
                              │ 1:1 (Enforced by QUESTION_VIDEOS)
                              ▼
                   ┌──────────────────────────────────────┐
                   │                VIDEOS                │
                   │           (BP-V-######)              │
                   │   Foreign Keys: questionId (BP-Q)    │
                   │                 contentId (BP-CNT)   │
                   └────┬───────────┬──────────────┬──────┘
                        │ 1:1       │ 1:1          │ 1:1
                        ▼           ▼              ▼
           ┌────────────────┐ ┌───────────┐ ┌────────────────┐
           │     SCRIPT     │ │ THUMBNAIL │ │ PINNED_COMMENT │
           │  (BP-S-######) │ │(BP-T-####)│ │ (BP-PIN-#####) │
           └────────────────┘ └───────────┘ └────────────────┘
                        │           │              │
                        └─────┬─────┴──────────────┘
                              │ All assets certified in Step 07
                              ▼
                   ┌──────────────────────────────────────┐
                   │            SOCIAL_REVIEWS            │
                   │           (BP-REV-######)            │
                   │   Foreign Keys: questionId, videoId  │
                   └──────────┬───────────────────────────┘
                              │ Editorial Signoff Gate
                              ▼
                   ┌──────────────────────────────────────┐
                   │              PUBLISHING              │
                   │           (BP-PUB-######)            │
                   │    Foreign Keys: videoId, contentId  │
                   └──────────┬───────────────────────────┘
                              │ Live URLs Verified
                              ▼
=============================================================================
             STRICT BOUNDARY: PRODUCTION vs ANALYTICS WORKBOOK
=============================================================================
                              │
                              ▼ Read-Only Reference: contentId (BP-CNT-######)
                   ┌──────────────────────────────────────┐
                   │           SOCIAL_ANALYTICS           │
                   │           (BP-ANL-######)            │
                   │   Workbook: ANALYTICS_SPREADSHEET_ID │
                   │   Append-Only 24h/7d Metric Snapshots│
                   └──────────────────────────────────────┘
```

### 11.2 Resolution of `contentId` vs. `contentMasterId`
- **Standard**: All schemas and interfaces are standardized on **`contentId`** formatted as `BP-CNT-######`.
- **Remediation**: The property `contentMasterId` is formally deprecated. During Stage 7, all occurrences of `contentMasterId` must be normalized to `contentId`.

---

## 12. PRODUCTION VS. ANALYTICS BOUNDARY SPECIFICATION

1. **Physical Isolation**: Production CMS data and Analytics data are persisted in two distinct Google Spreadsheets governed by `GOOGLE_SHEETS_SPREADSHEET_ID` and `ANALYTICS_SPREADSHEET_ID`.
2. **Zero-Mutation Constraint**:
   - Analytics services (`AnalyticsService`, `SocialCommentsService`, `CommentIntelligenceService`, `SocialPerformanceIntelligenceService`) have **zero write access** to production worksheets.
   - Analytics services may read `CONTENT_MASTERS` strictly to validate content existence.
3. **Controlled Strategy Feedback Loop (Step 15 $\rightarrow$ Step 01)**:
   - When a strategy recommendation is applied in `AnalyticsExperiencePage`, the analytics service updates `CONTENT_STRATEGY.status = 'APPLIED'`.
   - The UI redirects the user's browser to `/studio?topicId=...&subtopicId=...&difficulty=...`.
   - The user inspects and triggers generation in Question Studio. **No background process creates questions automatically**.

---

## 13. CANONICAL ID & SEQUENCE ARCHITECTURE

### 13.1 Authoritative Identifiers & Formats

| Entity | Canonical ID Format | Regular Expression Pattern | Sequence Key in `SEQUENCES` Sheet |
|---|---|---|---|
| **Content Master** | `BP-CNT-######` | `^BP-CNT-\d{6}$` | `CONTENT_MASTER` |
| **Question** | `BP-Q-######` | `^BP-Q-\d{6}$` | `QUESTION` |
| **Video** | `BP-V-######` | `^BP-V-\d{6}$` | `VIDEO` |
| **Script** | `BP-S-######` | `^BP-S-\d{6}$` | `SCRIPT` |
| **Script Version** | `SVER-######` | `^SVER-\d{6}$` | `SCRIPT_VERSION` |
| **Thumbnail** | `BP-T-######` | `^BP-T-\d{6}$` | `THUMBNAIL` |
| **Thumbnail Version**| `TVER-######` | `^TVER-\d{6}$` | `THUMBNAIL_VERSION` |
| **Pinned Comment** | `BP-PIN-######` | `^BP-PIN-\d{6}$` | `PINNED_COMMENT` |
| **Social Review** | `BP-REV-######` | `^BP-REV-\d{6}$` | `SOCIAL_REVIEW` |
| **Publishing** | `BP-PUB-######` | `^BP-PUB-\d{6}$` | `PUBLISHING` |
| **Assignment** | `BP-ASN-######` | `^BP-ASN-\d{6}$` | `ASSIGNMENT` |
| **Social Analytics**| `BP-ANL-######` | `^BP-ANL-\d{6}$` | `SOCIAL_ANALYTICS` |
| **Social Comment** | `BP-CMT-######` | `^BP-CMT-\d{6}$` | `SOCIAL_COMMENT` |

### 13.2 Non-Interference Guarantee
- The sequence extractor strictly requires matching `^BP-[A-Z]+-(\d+)$`.
- Synthetic or automated test IDs (such as `TEST-REC-001`, `DEL-BAK-*`, `MOCK-*`) are completely filtered out and **cannot contaminate production sequence numbers**.

---

## 14. VALIDATION & AUTHORIZATION CONSTITUTION

### 14.1 Validation Layers
1. **API Boundary Validation (Zod)**: Every mutating endpoint must parse input using a strict Zod schema before invoking services. Unrecognized properties are stripped.
2. **Domain State Machine Validation**: Services enforce valid state transitions using `VALID_VIDEO_TRANSITIONS` and `VALID_QUESTION_TRANSITIONS`. Invalid transitions throw `TransitionError`.
3. **Status Patch Hardening**: Raw `PATCH /api/videos/:id/status` must validate incoming status strings against `VideoProductionStatusSchema`. Arbitrary strings are rejected with HTTP 400.

### 14.2 Authorization & RBAC Rules
- **Admin (`ADMIN`)**: Full access to all operations, settings, diagnostics, and recovery tools.
- **Content Manager (`CONTENT_MANAGER`)**: Full access to Question Verification (Step 02), Final QC (Step 07), and Social Review (Step 09) approval gates.
- **Creator / Scriptwriter (`CREATOR`)**: Access to Question Studio (Step 01) and Scripting (Step 03).
- **Video Editor (`VIDEO_EDITOR`)**: Access to Editing Workspace (Step 06).
- **Social Media Manager (`SOCIAL_MEDIA_MANAGER`)**: Access to Publishing (Steps 10–11) and Platform Packages (Step 12).
- **Auditor / SME (`REVIEWER`)**: Read-only inspection across all stages.

---

## 15. ERROR HANDLING ARCHITECTURE

Domain services throw typed subclasses of `DomainError` defined in `src/lib/google-sheets/errors.ts`:

| Domain Error Class | HTTP Status Code | Response Payload Structure | Client Handling |
|---|---|---|---|
| `ValidationError` | `400 Bad Request` | `{ success: false, error: message, validationErrors: [] }` | Displays form validation alerts. |
| `AuthenticationError` | `401 Unauthorized` | `{ success: false, error: 'Authentication required' }` | Redirects to `/login?redirect=...`. |
| `AuthorizationError` | `403 Forbidden` | `{ success: false, error: 'Insufficient permissions' }` | Displays permission banner. |
| `NotFoundError` | `404 Not Found` | `{ success: false, error: 'Entity not found' }` | Renders 404 entity state. |
| `StateTransitionError`| `409 Conflict` | `{ success: false, error: message, currentStatus: ... }` | Re-fetches fresh entity state. |
| `SequenceAllocationError`| `500 Internal Error`| `{ success: false, error: 'Sequence failure' }` | Notifies user to retry operation. |
| `GoogleSheetsAPIError`| `503 Service Unavailable`| `{ success: false, error: 'Spreadsheet unavailable' }` | Client initiates exponential retry. |

---

## 16. MASTER KEEP / MERGE / DEPRECATE / REMOVE MATRIX

This master table governs all code adjustments to be performed during Stage 7:

| System Area | Existing Implementation | Architectural Decision | Canonical Replacement | Migration Order | Detailed Rationale |
|---|---|---|---|---|---|
| **Page** | `QuestionStudioPage.tsx` | **KEEP** | `QuestionStudioPage.tsx` | N/A | Canonical Step 01 drafting workspace. |
| **Page** | `QuestionLibraryPage.tsx` | **KEEP** | `QuestionLibraryPage.tsx` | N/A | Canonical question catalog. |
| **Page** | `QuestionVerifyApprovePage.tsx`| **KEEP** | `QuestionVerifyApprovePage.tsx` | N/A | Canonical Step 02 verification gate. |
| **Page** | `QuestionImprovePage.tsx` | **MERGE** | `QuestionDetailPage.tsx` | Phase 2 | Merge form logic into QuestionDetail to unify post-draft editing. |
| **Page** | `QuestionDetailPage.tsx` | **KEEP (ENHANCED)** | `QuestionDetailPage.tsx` | Phase 2 | Single authoritative question inspection & edit hub. |
| **Page** | `VideoDetailPage.tsx` | **KEEP** | `VideoDetailPage.tsx` | Phase 1 | Unified container for Steps 03–08. |
| **Page** | `SocialReviewPage.tsx` | **KEEP (CANONICAL GATE)** | `SocialReviewPage.tsx` | Phase 2 | Canonical full-page 9:16 simulator gate for Step 09. |
| **Page** | `PublishingPage.tsx` | **KEEP (CANONICAL HUB)** | `PublishingPage.tsx` | Phase 2 | Canonical publishing hub for Steps 10 & 11. |
| **Page** | `PlatformPackagesPage.tsx` | **KEEP** | `PlatformPackagesPage.tsx` | Phase 2 | Canonical platform adaptation explorer for Step 12. |
| **Page** | `SocialAnalyticsPage.tsx` | **KEEP** | `SocialAnalyticsPage.tsx` | Phase 2 | Canonical data entry hub for Step 13. |
| **Page** | `AnalyticsExperiencePage.tsx` | **KEEP** | `AnalyticsExperiencePage.tsx` | Phase 2 | Canonical analytics & AI strategy console for Steps 14 & 15. |
| **Page** | `PlanningPage.tsx` | **KEEP** | `PlanningPage.tsx` | N/A | Pre-production planning hub. |
| **Page** | `ProductionTrackerPage.tsx` | **KEEP** | `ProductionTrackerPage.tsx` | N/A | Production pipeline tracker. |
| **Page** | `MyWorkPage.tsx` | **KEEP** | `MyWorkPage.tsx` | N/A | Personal assignment queue. |
| **Page** | `TeamOperationsPage.tsx` | **KEEP** | `TeamOperationsPage.tsx` | N/A | Team workload management. |
| **Page** | `ContentMasterPage.tsx` | **KEEP** | `ContentMasterPage.tsx` | N/A | Content governance explorer. |
| **Page** | `Phase23ProductionDashboardPage.tsx`| **MERGE / DEPRECATE** | `ProductionTrackerPage.tsx` | Phase 3 | Subsume multi-queue search into ProductionTracker. |
| **Page** | `ProductionBoardPage.tsx` | **REMOVE** | `ProductionTrackerPage.tsx` | Phase 4 | Dead unmounted file (859 lines). |
| **Page** | `PublishingPackagePage.tsx` | **REMOVE** | `PlatformPackagesPage.tsx` | Phase 4 | Dead unmounted file (803 lines). |
| **Page** | `VideoReviewScriptPage.tsx` | **REMOVE** | `VideoDetailPage.tsx?tab=script` | Phase 4 | Dead unmounted file (744 lines). |
| **Page** | `VideoRecordPage.tsx` | **REMOVE** | `VideoDetailPage.tsx?tab=recording` | Phase 4 | Dead unmounted file (1,064 lines). |
| **Page** | `VideoEditPage.tsx` | **REMOVE** | `VideoDetailPage.tsx?tab=editing` | Phase 4 | Dead unmounted file (855 lines). |
| **Page** | `VideoFinalPage.tsx` | **REMOVE** | `VideoDetailPage.tsx?tab=final-review` | Phase 4 | Dead unmounted file (699 lines). |
| **Page** | `VideoThumbnailPage.tsx` | **REMOVE** | `VideoDetailPage.tsx?tab=thumbnail` | Phase 4 | Dead unmounted file (918 lines). |
| **Page** | `VideoPinnedCommentPage.tsx`| **REMOVE** | `VideoDetailPage.tsx?tab=pinned-comment` | Phase 4 | Dead unmounted file (593 lines). |
| **Page** | `VideoCreateScriptPage.tsx` | **REMOVE** | `ProductionTrackerPage.tsx` | Phase 4 | Dead unmounted redirect shim (124 lines). |
| **Component** | `VideoWorkflowHeader.tsx` | **REMOVE** | `ProductionJourneyBar.tsx` | Phase 4 | Deprecated stepper pointing to obsolete standalone routes. |
| **Component** | `AssetWorkflowHeader.tsx` | **REMOVE** | `ProductionJourneyBar.tsx` | Phase 4 | Deprecated stepper with obsolete phase numbering. |
| **Component** | `PublishingWorkflowHeader.tsx`| **REMOVE** | `ProductionJourneyBar.tsx` | Phase 4 | Deprecated stepper linking to dead routes. |
| **Component** | `QuestionWorkflowHeader.tsx` | **MERGE** | `ProductionJourneyBar.tsx` | Phase 3 | Merge stage badges into global conveyor. |
| **Service** | `social-review.service.ts` | **KEEP (CANONICAL)** | `social-review.service.ts` | Phase 3 | Canonical service writing to `SOCIAL_REVIEWS` sheet. |
| **Service** | `phase20-social-review.service.ts`| **REMOVE** | `social-review.service.ts` | Phase 3 | Duplicates review gate using ephemeral in-memory map. |
| **Service** | `publishing.service.ts` | **KEEP (CANONICAL)** | `publishing.service.ts` | Phase 3 | Canonical service writing to `PUBLISHING` sheet. |
| **Service** | `phase22-publishing-hub.service.ts`| **REMOVE** | `publishing.service.ts` | Phase 3 | Duplicates publishing hub using ephemeral in-memory map. |
| **Service** | `platform-adaptation.service.ts` | **KEEP (CANONICAL)** | `platform-adaptation.service.ts` | Phase 3 | Canonical platform adaptation service. |
| **Service** | `phase21-platform-adaptation.service.ts`| **REMOVE** | `platform-adaptation.service.ts` | Phase 3 | Redundant wrapper service. |
| **Service** | `phase15-script-production.service.ts`| **REMOVE** | `script.service.ts` | Phase 3 | Redundant wrapper around ScriptService. |
| **Service** | `phase17-video-production.service.ts`| **REMOVE** | `video.service.ts` | Phase 3 | Redundant wrapper around VideoService. |
| **Service** | `phase18-thumbnail-intelligence.service.ts`| **MERGE** | `thumbnail.service.ts` | Phase 3 | Merge prompt variations into ThumbnailService. |
| **Service** | `phase19-pinned-comment-intelligence.service.ts`| **MERGE** | `pinned-comment.service.ts` | Phase 3 | Merge challenge generator into PinnedCommentService. |
| **Service** | `phase23-production.service.ts`| **REMOVE** | `video.service.ts` | Phase 3 | Redundant read-model queries. |
| **Repository**| `social-reviews.repository.ts` | **KEEP (CANONICAL)** | `social-reviews.repository.ts` | N/A | Persistent Google Sheets adapter (`BaseRepository`). |
| **Repository**| `phase20-social-reviews.repository.ts`| **REMOVE** | `social-reviews.repository.ts` | Phase 3 | Ephemeral in-memory Map data loss hazard. |
| **Repository**| `publishing.repository.ts` | **KEEP (CANONICAL)** | `publishing.repository.ts` | N/A | Persistent Google Sheets adapter (`BaseRepository`). |
| **Repository**| `phase22-publishing.repository.ts`| **REMOVE** | `publishing.repository.ts` | Phase 3 | Ephemeral in-memory Map data loss hazard. |
| **Repository**| `platform-adaptations.repository.ts`| **MERGE** | `publishing.repository.ts` | Phase 3 | Persist projections directly in Sheets. |
| **API** | 76 Test Endpoints in `routes.ts` | **MOVE TO TEST ROUTER** | `test-routes.ts` | Phase 2 | Isolate test endpoints behind non-production flags. |

---

## 17. CANONICAL SYSTEM ARCHITECTURE DIAGRAM

```
========================================================================================
                          BURRA PARIKSHA CMS — CANONICAL FLOW
========================================================================================

 [ USER / BROWSER ]
         │
         ▼
 ┌────────────────────────────────────────────────────────────────────────────────────┐
 │  CANONICAL FRONTEND SHELL                                                         │
 │  ├── AppShell (Left Sidebar Hubs: Studio, Questions, Production, Review, etc.)     │
 │  ├── ProductionJourneyBar (15-Stage Conveyor Navigation & Blocker Resolution)      │
 │  └── Canonical Workspaces:                                                         │
 │      • QuestionStudioPage      (Step 01)                                           │
 │      • QuestionVerifyApprove   (Step 02)                                           │
 │      • VideoDetailPage         (Steps 03-08 via ?tab=script,recording,editing...) │
 │      • SocialReviewPage        (Step 09: 9:16 Smartphone Simulator Gate)          │
 │      • PublishingPage          (Steps 10-11: Multi-Platform Schedule & Live URL)   │
 │      • PlatformPackagesPage    (Step 12: Adaptation Explorer)                      │
 │      • SocialAnalyticsPage     (Step 13: Metric Ingestion)                         │
 │      • AnalyticsExperiencePage (Steps 14-15: Retention Curves & Strategy Loop)     │
 └────────────────────────────────────────┬───────────────────────────────────────────┘
                                          │ apiClient.method()
                                          ▼
 ┌────────────────────────────────────────────────────────────────────────────────────┐
 │  EXPRESS ROUTING & MIDDLEWARE TIER (/api/*)                                        │
 │  ├── AuthMiddleware (Bearer token / session verification; role assignment)         │
 │  ├── Zod Request Validation (Strict body/param schema enforcement)                │
 │  └── Canonical Route Handlers (21 Clean Controllers; zero business logic)         │
 └────────────────────────────────────────┬───────────────────────────────────────────┘
                                          │ Typed Service Calls
                                          ▼
 ┌────────────────────────────────────────────────────────────────────────────────────┐
 │  CANONICAL DOMAIN SERVICE TIER                                                     │
 │  ├── questionService               ├── videoService & workflowOrchestrator         │
 │  ├── scriptService                 ├── thumbnailService & pinnedCommentService     │
 │  ├── socialReviewService           ├── publishingService & platformAdaptation      │
 │  ├── analyticsService              └── contentStrategyService (AI Loopback)        │
 └───────────────────┬────────────────────────────────────────────┬───────────────────┘
                     │ Persistent CRUD                            │ Isolated Snapshot
                     ▼                                            ▼
 ┌────────────────────────────────────────┐   ┌───────────────────────────────────────┐
 │ CANONICAL REPOSITORY TIER (CMS)        │   │ CANONICAL REPOSITORY TIER (ANALYTICS) │
 │ ├── questionsRepository                │   │ ├── analyticsRepository               │
 │ ├── videosRepository                   │   │ ├── socialCommentsRepository          │
 │ ├── scriptsRepository                  │   │ ├── commentIntelligenceRepository     │
 │ ├── thumbnailsRepository               │   │ └── strategyRecommendationRepository  │
 │ ├── socialReviewsRepository            │   └───────────────────┬───────────────────┘
 │ ├── publishingRepository               │                       │
 │ └── contentMastersRepository           │                       │
 └───────────────────┬────────────────────┘                       │
                     │ GoogleSheetsClient                         │ GoogleSheetsClient
                     ▼                                            ▼
 ┌────────────────────────────────────────┐   ┌───────────────────────────────────────┐
 │ PRODUCTION CMS WORKBOOK                │   │ PERFORMANCE ANALYTICS WORKBOOK        │
 │ (GOOGLE_SHEETS_SPREADSHEET_ID)         │   │ (ANALYTICS_SPREADSHEET_ID)            │
 │ 23 Canonical Worksheets                │   │ 5 Append-Only Analytical Worksheets   │
 └────────────────────────────────────────┘   └───────────────────────────────────────┘
```

---

## 18. 15-STEP CANONICAL ARCHITECTURE MAP

This definitive table serves as the primary technical specification for developers and automated systems:

| Step | Business Responsibility | Canonical Page | Canonical Route | Canonical API Endpoint | Canonical Service | Canonical Repository | Authoritative Data Source | Canonical State | Next Action |
|---|---|---|---|---|---|---|---|---|---|
| **01** | **Question Generation** | `QuestionStudioPage` | `/studio` | `POST /api/questions` | `questionService` | `questionsRepository` | `QUESTIONS` sheet | `DRAFT` | Navigate to Step 02 (`/questions/:id/verify`) |
| **02** | **Question Verification** | `QuestionVerifyApprovePage` | `/questions/:id/verify` | `POST /api/questions/:id/approve` | `questionService` | `questionsRepository`, `videosRepository` | `QUESTIONS`, `VIDEOS` sheets | `APPROVED` | Navigate to Step 03 (`/videos/:id?tab=script`) |
| **03** | **Audience Script** | `VideoDetailPage` (`ScriptWorkspace`) | `/videos/:id?tab=script` | `POST /api/videos/:id/script` | `scriptService` | `scriptsRepository`, `scriptVersionsRepository` | `SCRIPT`, `SCRIPT_VERSIONS` sheets | `SCRIPT_READY` | Navigate to Step 04 (`/videos/:id?tab=recording`) |
| **04** | **Recording** | `VideoDetailPage` (`RecordingWorkspace`) | `/videos/:id?tab=recording` | `PATCH /api/videos/:id/status` | `videoService` | `videosRepository` | `VIDEOS` sheet | `RECORDING` | Proceed to Step 05 handoff |
| **05** | **Raw Footage Handoff** | `VideoDetailPage` (`RecordingWorkspace`) | `/videos/:id?tab=recording` | `POST /api/videos/:id/upload` | `googleDriveService`, `videoService` | `videosRepository`, `mediaAssetsRepository` | `VIDEOS` sheet, Google Drive | `RECORDED` | Navigate to Step 06 (`/videos/:id?tab=editing`) |
| **06** | **Video Editing** | `VideoDetailPage` (`EditingWorkspace`) | `/videos/:id?tab=editing` | `PUT /api/videos/:id` | `videoService` | `videosRepository` | `VIDEOS` sheet | `EDITED` | Navigate to Step 07 (`/videos/:id?tab=final-review`) |
| **07** | **Final QC** | `VideoDetailPage` (`FinalReviewWorkspace`) | `/videos/:id?tab=final-review` | `POST /api/videos/:id/qc-approve`| `videoService`, `workflowOrchestrator` | `videosRepository` | `VIDEOS` sheet | `QC_APPROVED` | Navigate to Step 08 (`/videos/:id?tab=thumbnail`) |
| **08** | **Thumbnail** | `VideoDetailPage` (`ThumbnailWorkspace`) | `/videos/:id?tab=thumbnail` | `POST /api/thumbnails` | `thumbnailService`, `googleDriveService` | `thumbnailsRepository` | `THUMBNAILS` sheet, Google Drive | `THUMBNAIL_READY` | Navigate to Step 09 (`/social-review/:reviewId`) |
| **09** | **Social Review** | `SocialReviewPage` | `/social-review/:reviewId` | `POST /api/social-reviews/decision` | `socialReviewService` | `socialReviewsRepository` | `SOCIAL_REVIEWS` sheet | `APPROVED` | Navigate to Step 10 (`/publishing`) |
| **10** | **Publishing Setup** | `PublishingPage` | `/publishing` | `POST /api/publishing/schedule` | `publishingService` | `publishingRepository` | `PUBLISHING` sheet | `SCHEDULED` | Proceed to Step 11 on release |
| **11** | **Published / Live URL**| `PublishingPage` | `/publishing` | `POST /api/publishing/finalize` | `publishingService` | `publishingRepository`, `videosRepository` | `PUBLISHING`, `VIDEOS` sheets | `UPLOADED` | Navigate to Step 12 (`/platform-packages/:videoId`) |
| **12** | **Platform Sync** | `PlatformPackagesPage` | `/platform-packages/:videoId` | `GET /api/platform-packages/:videoId` | `platformAdaptationService` | `publishingRepository` | `PUBLISHING` sheet | `SYNC_VERIFIED` | Navigate to Step 13 (`/social-analytics/:contentId`) |
| **13** | **Social Analytics** | `SocialAnalyticsPage` | `/social-analytics/:contentId` | `POST /api/analytics` | `analyticsService` | `analyticsRepository` | `SOCIAL_ANALYTICS` (Analytics Sheet) | `METRICS_RECORDED` | Navigate to Step 14 (`/analytics/engagement`) |
| **14** | **Performance Review** | `AnalyticsExperiencePage` | `/analytics/engagement` | `GET /api/analytics/summary` | `analyticsService` | `analyticsRepository` | `SOCIAL_ANALYTICS` (Analytics Sheet) | `REVIEWED` | Navigate to Step 15 (`/analytics/intelligence`) |
| **15** | **Performance Intel** | `AnalyticsExperiencePage` | `/analytics/intelligence` | `POST /api/content-strategy/recommendations/:id/apply` | `contentStrategyService` | `strategyRecommendationRepository` | `CONTENT_STRATEGY` (Analytics Sheet) | `STRATEGY_APPLIED` | Closed loopback to Step 01 (`/studio?params...`) |

---

## 19. STAGE 7 IMPLEMENTATION EXECUTION PLAN

Stage 7 must implement this canonical design in 6 sequential phases, ensuring continuous compile and test passage at each phase boundary:

```
STAGE 7 IMPLEMENTATION PHASES
────────────────────────────────────────────────────────────────────────────
Phase 1: Routing & Navigation Convergence
  • Update App.tsx route table to match Section 4.
  • Wire compatibility redirects for legacy routes.
  • Clean up AppBreadcrumbs to reflect canonical names.
  • Verify deep links and login redirect preservation.

Phase 2: Page & Workspace Consolidation
  • Enhance QuestionDetailPage to absorb QuestionImprovePage editing.
  • Consolidate Step 09 review gate into SocialReviewPage.
  • Move 76 test endpoints out of routes.ts into test-routes.ts.

Phase 3: Service & Repository Layer Unification
  • Discontinue Phase 20 review service; route all traffic to social-review.service.ts.
  • Discontinue Phase 22 publishing service; route all traffic to publishing.service.ts.
  • Eliminate Phase 15, 17, 21 wrapper services.
  • Remove ephemeral in-memory repositories (Phase20, Phase22).

Phase 4: Dead Code & Legacy Stepper Deletion
  • Delete 8 unmounted legacy page files (ProductionBoardPage, PublishingPackagePage, Video* standalone pages).
  • Delete 3 legacy stepper headers (VideoWorkflowHeader, AssetWorkflowHeader, PublishingWorkflowHeader).

Phase 5: Verification & Safety Hardening
  • Run TypeScript compilation (0 errors).
  • Run entire automated test suite (157+ regression tests passing).
  • Validate sequence allocator with fail-closed rules.

Phase 6: Final Deployment & Audit Documentation
  • Document complete stabilization report.
────────────────────────────────────────────────────────────────────────────
```

---

## 20. NON-NEGOTIABLE ARCHITECTURAL INVARIANTS

The following invariants are permanent rules governing the Burra Pariksha CMS codebase:
1. **No Competing Workspaces**: For each production step, there is exactly one operational workspace component. Multiple pages performing the same workflow responsibility are strictly prohibited.
2. **Zero In-Memory Production Repositories**: Every production entity must persist to Google Sheets via `BaseRepository`. In-memory JavaScript `Map` repositories for persistent entities are banned.
3. **No Direct Google Sheets Access in Routes**: Route handlers must invoke domain services. Direct queries from routes to repositories or the Google Sheets client are prohibited.
4. **Isolated Test Harness**: Production route definitions must never mount automated test execution endpoints.
5. **Fail-Closed Sequences**: The sequence repository must fail closed when uninitialized. Non-canonical IDs must never increment production counters.
6. **Analytics Cannot Mutate Production**: The Performance Analytics subsystem is strictly read-only with respect to the Production CMS workbook.

---

## 21. OPEN ARCHITECTURAL DECISIONS

### 21.1 Confirmed Decisions
- All 15 canonical steps mapped to authoritative page components and routes.
- Dual-implementation collisions in Step 09 (Social Review) and Steps 10/11 (Publishing) resolved in favor of Google Sheets-backed core services.
- 8 unmounted dead page files slated for removal in Stage 7 Phase 4.
- 76 test endpoints slated for extraction into an isolated test router.

### 21.2 Potential Decisions (To be validated during Stage 7 Phase 2)
- **QuestionImprovePage Consolidation**: Whether `QuestionImprovePage` should be merged as a sub-component within `QuestionDetailPage` or retained as an alias route pointing to `QuestionDetailPage?mode=edit`.
- **Platform Packages Persistence**: Whether `PlatformAdaptation` projections should be stored as separate rows in a new worksheet or serialized as JSON within `PUBLISHING` worksheet columns.

### 21.3 Runtime Verification Required
- Verify Google Drive large-file upload performance when executed within an embedded iFrame in `RecordingWorkspace`.

---

## 22. STAGE 6 COMPLETION CHECKLIST

- [x] Stage 1 Product Truth read and used as business foundation
- [x] Stage 2 Repository Inventory read and referenced
- [x] Stage 3 Routing & Navigation Audit read and referenced
- [x] Stage 4 Page & Workflow Map read and referenced
- [x] Stage 5 Backend & Data Map read and referenced
- [x] Canonical architectural principles defined
- [x] Canonical application topology established
- [x] Canonical navigation and deep-link standards defined
- [x] Canonical route map and compatibility redirect registry completed
- [x] Canonical page architecture decisions recorded
- [x] Definitive 15-step workflow specification established
- [x] Canonical API decisions recorded (duplicate resolution & test endpoint isolation)
- [x] Canonical service architecture decisions recorded (core vs. phase resolution)
- [x] Canonical repository architecture decisions recorded (elimination of in-memory data loss hazard)
- [x] Canonical context and state ownership matrix completed
- [x] Authoritative entity relationship model documented
- [x] Production vs. Analytics boundary strictly formalized
- [x] Canonical ID and sequence rules defined
- [x] Validation and authorization constitution established
- [x] Error handling architecture specified
- [x] Master KEEP / MERGE / DEPRECATE / REMOVE matrix completed
- [x] Canonical system architecture ASCII diagram created
- [x] 15-Step final architecture map constructed
- [x] Stage 7 implementation sequence phased and planned
- [x] Non-negotiable architectural invariants declared
- [x] Open architectural decisions categorized
- [x] **NO application source code modified**
- [x] **NO routes, APIs, services, or repositories modified**
- [x] **NO Google Sheets, Google Drive, or production database records modified**
- [x] **ONLY `/06-canonical-architecture.md` created**
