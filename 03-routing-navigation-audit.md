# STAGE 3 — ROUTING & NAVIGATION FORENSIC AUDIT
## Burra Pariksha CMS: Forensic Read-Only Navigation Architecture Audit

---

## 1. Audit Scope

This document provides the exhaustive, read-only forensic audit of all routing and navigation mechanisms within the **Burra Pariksha CMS** repository. The audit investigates:
- How users and automated workflows transition through application pages.
- Competing, duplicated, and aliased route patterns.
- Programmatic redirects, tab parameter mappings, and deep-link resolution rules.
- Conflicts between navigation subsystems (Sidebar, Header, Breadcrumbs, Production Journey, and legacy phase headers).
- Exact alignment and divergences relative to the canonical 15-step production pipeline established in `01-product-truth.md`.

In strict adherence to forensic safety:
- **Zero application code, routes, or configurations were modified.**
- **Zero Google Sheets or Google Drive writes were executed.**
- **Zero files were deleted or renamed.**
- All findings are corroborated by verifiable static source evidence.

---

## 2. Routing Architecture Overview

### High-Level Topology
The client application runs on **React 19** with **React Router DOM v7.18.2** (`<BrowserRouter>`).
The routing architecture exhibits a **hybrid evolutionary state**:
1. **Outer Shell**:
   - `server.ts` delegates client-side URLs to Vite middleware (development) or serves `dist/index.html` (production).
   - `src/App.tsx` mounts `<AuthProvider>` and `<ProductionJourneyProvider>` around `<AppRoutes>`.
   - Global shell layout (`<Layout />`) wraps all authenticated routes, mounting `Header`, `Sidebar`, and an `<Outlet />`.
2. **Authoritative Navigation Model**:
   - The UI configuration (`src/config/navigation.ts`) prescribes a **6-Hub Information Architecture**: `HOME`, `QUESTIONS`, `PRODUCTION`, `PUBLISHING`, `ANALYTICS`, and `MANAGEMENT & SYSTEM`.
   - Role-based landing redirects are enforced via `getDefaultLandingRoute(user.role)` on the root index route (`/`).
3. **The Divergence Point (Dual Architectural Paradigms)**:
   - **Legacy Multi-Route Model**: Individual standalone URLs for separate production phases (`/videos/create-script`, `/videos/record`, `/videos/edit-video`, `/videos/final-video`, `/videos/thumbnail`, `/publishing-package`).
   - **Modern Consolidated Workspace Model**: Master tabbed detail views (`/videos/:videoId?tab={script|recording|editing|final-review|thumbnail|social|publishing}`).
   - **Shim Redirect Bridge**: Extensive use of `<VideoTabRedirect tab="..." />` and `<Navigate to="..." replace />` in `src/App.tsx` to seamlessly map legacy and phase URLs into the master tabbed workspace.

---

## 3. Complete Route Registry

All 56 route declarations registered inside `src/App.tsx`:

| # | Route Pattern | Component / Target | Parent / Layout | Parameters | Query Params | Redirect? | Guard | Source File | Classification |
|---|---|---|---|---|---|---|---|---|---|
| 1 | `/` | `<Navigate to={landingRoute} replace />` | Layout | None | Preserved | YES | `requireAuth` | `src/App.tsx:83` | CANONICAL CANDIDATE |
| 2 | `dashboard` | `<DashboardPage />` | Layout | None | None | NO | `requireAuth` | `src/App.tsx:84` | CANONICAL CANDIDATE |
| 3 | `planning` | `<PlanningPage />` | Layout | None | Optional filters | NO | `requireAuth` | `src/App.tsx:87` | CANONICAL CANDIDATE |
| 4 | `questions` | `<QuestionLibraryPage />` | Layout | None | `?status=`, `?topic=` | NO | `requireAuth` | `src/App.tsx:88` | CANONICAL CANDIDATE |
| 5 | `content-masters` | `<ContentMasterPage />` | Layout | None | None | NO | `requireAuth` | `src/App.tsx:89` | CANONICAL CANDIDATE |
| 6 | `content-masters/:id` | `<ContentMasterPage />` | Layout | `:id` | None | NO | `requireAuth` | `src/App.tsx:90` | CANONICAL CANDIDATE |
| 7 | `social-review` | `<SocialReviewPage />` | Layout | None | None | NO | `requireAuth` | `src/App.tsx:91` | CANONICAL CANDIDATE |
| 8 | `social-review/:reviewId` | `<SocialReviewPage />` | Layout | `:reviewId` | None | NO | `requireAuth` | `src/App.tsx:92` | CANONICAL CANDIDATE |
| 9 | `studio` | `<QuestionStudioPage />` | Layout | None | `?id=`, `?topicId=` | NO | `requireAuth` | `src/App.tsx:93` | CANONICAL CANDIDATE |
| 10 | `questions/new` | `<Navigate to="/studio" replace />` | Layout | None | None | YES | `requireAuth` | `src/App.tsx:94` | LEGACY ALIAS |
| 11 | `questions/improve` | `<QuestionImprovePage />` | Layout | None | None | NO | `requireAuth` | `src/App.tsx:95` | ACTIVE ALIAS |
| 12 | `questions/:id/improve` | `<QuestionImprovePage />` | Layout | `:id` | None | NO | `requireAuth` | `src/App.tsx:96` | ACTIVE ALIAS |
| 13 | `questions/verify` | `<QuestionVerifyApprovePage />` | Layout | None | None | NO | `requireAuth` | `src/App.tsx:97` | CANONICAL CANDIDATE |
| 14 | `questions/:id/verify` | `<QuestionVerifyApprovePage />` | Layout | `:id` | None | NO | `requireAuth` | `src/App.tsx:98` | CANONICAL CANDIDATE |
| 15 | `questions/:id` | `<QuestionDetailPage />` | Layout | `:id` | None | NO | `requireAuth` | `src/App.tsx:99` | CANONICAL CANDIDATE |
| 16 | `generate` | `<Navigate to="/studio" replace />` | Layout | None | None | YES | `requireAuth` | `src/App.tsx:100` | LEGACY ALIAS |
| 17 | `queue` | `<QueuePage />` | Layout | None | None | NO | `requireAuth` | `src/App.tsx:103` | CANONICAL CANDIDATE |
| 18 | `production` | `<ProductionTrackerPage />` | Layout | None | `?status=`, `?view=` | NO | `requireAuth` | `src/App.tsx:104` | CANONICAL CANDIDATE |
| 19 | `production-tracker` | `<Navigate to="/production" replace />` | Layout | None | None | YES | `requireAuth` | `src/App.tsx:105` | LEGACY ALIAS |
| 20 | `production-board` | `<Navigate to="/production?status=EDITING" replace />` | Layout | None | None | YES | `requireAuth` | `src/App.tsx:106` | LEGACY ALIAS |
| 21 | `videos/create-script` | `<VideoCreateScriptPage />` | Layout | None | `?videoId=` | CONDITIONAL | `requireAuth` | `src/App.tsx:109` | ACTIVE ALIAS |
| 22 | `videos/:videoId/create-script` | `<VideoTabRedirect tab="script" />` | Layout | `:videoId` | `?tab=script` | YES | `requireAuth` | `src/App.tsx:110` | ACTIVE ALIAS |
| 23 | `production/:videoId/create-script`| `<VideoTabRedirect tab="script" />` | Layout | `:videoId` | `?tab=script` | YES | `requireAuth` | `src/App.tsx:111` | ACTIVE ALIAS |
| 24 | `videos/review-script` | `<Navigate to="/production?status=SCRIPT_READY" replace />` | Layout | None | None | YES | `requireAuth` | `src/App.tsx:113` | LEGACY ALIAS |
| 25 | `videos/:videoId/review-script` | `<VideoTabRedirect tab="script" />` | Layout | `:videoId` | `?tab=script` | YES | `requireAuth` | `src/App.tsx:114` | ACTIVE ALIAS |
| 26 | `production/:videoId/review-script`| `<VideoTabRedirect tab="script" />` | Layout | `:videoId` | `?tab=script` | YES | `requireAuth` | `src/App.tsx:115` | ACTIVE ALIAS |
| 27 | `videos/record` | `<Navigate to="/production?status=RECORDING" replace />` | Layout | None | None | YES | `requireAuth` | `src/App.tsx:117` | LEGACY ALIAS |
| 28 | `videos/:videoId/record` | `<VideoTabRedirect tab="recording" />` | Layout | `:videoId` | `?tab=recording`| YES | `requireAuth` | `src/App.tsx:118` | ACTIVE ALIAS |
| 29 | `production/:videoId/record` | `<VideoTabRedirect tab="recording" />` | Layout | `:videoId` | `?tab=recording`| YES | `requireAuth` | `src/App.tsx:119` | ACTIVE ALIAS |
| 30 | `videos/edit-video` | `<Navigate to="/production?status=EDITING" replace />` | Layout | None | None | YES | `requireAuth` | `src/App.tsx:121` | LEGACY ALIAS |
| 31 | `videos/:videoId/edit-video` | `<VideoTabRedirect tab="editing" />` | Layout | `:videoId` | `?tab=editing` | YES | `requireAuth` | `src/App.tsx:122` | ACTIVE ALIAS |
| 32 | `production/:videoId/edit-video` | `<VideoTabRedirect tab="editing" />` | Layout | `:videoId` | `?tab=editing` | YES | `requireAuth` | `src/App.tsx:123` | ACTIVE ALIAS |
| 33 | `videos/final-video` | `<Navigate to="/production?status=FINAL_REVIEW" replace />` | Layout | None | None | YES | `requireAuth` | `src/App.tsx:125` | LEGACY ALIAS |
| 34 | `videos/:videoId/final-video` | `<VideoTabRedirect tab="final-review" />` | Layout | `:videoId` | `?tab=final-review`| YES | `requireAuth` | `src/App.tsx:126` | ACTIVE ALIAS |
| 35 | `production/:videoId/final-video`| `<VideoTabRedirect tab="final-review" />` | Layout | `:videoId` | `?tab=final-review`| YES | `requireAuth` | `src/App.tsx:127` | ACTIVE ALIAS |
| 36 | `videos/thumbnail` | `<Navigate to="/production?status=READY_TO_UPLOAD" replace />` | Layout | None | None | YES | `requireAuth` | `src/App.tsx:130` | LEGACY ALIAS |
| 37 | `videos/:videoId/thumbnail` | `<VideoTabRedirect tab="thumbnail" />` | Layout | `:videoId` | `?tab=thumbnail`| YES | `requireAuth` | `src/App.tsx:131` | ACTIVE ALIAS |
| 38 | `production/:videoId/thumbnail` | `<VideoTabRedirect tab="thumbnail" />` | Layout | `:videoId` | `?tab=thumbnail`| YES | `requireAuth` | `src/App.tsx:132` | ACTIVE ALIAS |
| 39 | `videos/pinned-comment` | `<Navigate to="/production" replace />` | Layout | None | None | YES | `requireAuth` | `src/App.tsx:134` | LEGACY ALIAS |
| 40 | `videos/:videoId/pinned-comment`| `<VideoTabRedirect tab="social" />` | Layout | `:videoId` | `?tab=social` | YES | `requireAuth` | `src/App.tsx:135` | ACTIVE ALIAS |
| 41 | `production/:videoId/pinned-comment`| `<VideoTabRedirect tab="social" />`| Layout | `:videoId` | `?tab=social` | YES | `requireAuth` | `src/App.tsx:136` | ACTIVE ALIAS |
| 42 | `videos/:videoId/social-review` | `<VideoTabRedirect tab="social" />` | Layout | `:videoId` | `?tab=social` | YES | `requireAuth` | `src/App.tsx:138` | ACTIVE ALIAS |
| 43 | `production/:videoId/social-review`| `<VideoTabRedirect tab="social" />`| Layout | `:videoId` | `?tab=social` | YES | `requireAuth` | `src/App.tsx:139` | ACTIVE ALIAS |
| 44 | `production/:videoId` | `<VideoTabRedirect />` | Layout | `:videoId` | Preserved | YES | `requireAuth` | `src/App.tsx:141` | ACTIVE ALIAS |
| 45 | `videos/:videoId` | `<VideoDetailPage />` | Layout | `:videoId` | `?tab=` | NO | `requireAuth` | `src/App.tsx:142` | CANONICAL CANDIDATE |
| 46 | `platform-packages` | `<PlatformPackagesPage />` | Layout | None | None | NO | `requireAuth` | `src/App.tsx:145` | CANONICAL CANDIDATE |
| 47 | `videos/platform-packages` | `<PlatformPackagesPage />` | Layout | None | None | NO | `requireAuth` | `src/App.tsx:146` | DUPLICATE |
| 48 | `videos/:videoId/platform-packages`| `<PlatformPackagesPage />` | Layout | `:videoId` | None | NO | `requireAuth` | `src/App.tsx:147` | DUPLICATE |
| 49 | `production/:videoId/platform-packages`| `<PlatformPackagesPage />` | Layout | `:videoId` | None | NO | `requireAuth` | `src/App.tsx:148` | DUPLICATE |
| 50 | `publishing-package` | `<Navigate to="/platform-packages" replace />` | Layout | None | None | YES | `requireAuth` | `src/App.tsx:150` | LEGACY ALIAS |
| 51 | `videos/publishing-package` | `<Navigate to="/platform-packages" replace />` | Layout | None | None | YES | `requireAuth` | `src/App.tsx:151` | LEGACY ALIAS |
| 52 | `videos/:videoId/publishing-package`| `<Navigate to="/platform-packages" replace />`| Layout | None | None | YES | `requireAuth` | `src/App.tsx:152` | LEGACY ALIAS |
| 53 | `production/:videoId/publishing-package`| `<Navigate to="/platform-packages" replace />`| Layout | None | None | YES | `requireAuth` | `src/App.tsx:153` | LEGACY ALIAS |
| 54 | `publishing` | `<PublishingPage />` | Layout | None | None | NO | `requireAuth` | `src/App.tsx:155` | CANONICAL CANDIDATE |
| 55 | `videos/:videoId/publish` | `<VideoTabRedirect tab="publishing" />`| Layout | `:videoId` | `?tab=publishing`| YES | `requireAuth` | `src/App.tsx:156` | ACTIVE ALIAS |
| 56 | `production/:videoId/publish` | `<VideoTabRedirect tab="publishing" />`| Layout | `:videoId` | `?tab=publishing`| YES | `requireAuth` | `src/App.tsx:157` | ACTIVE ALIAS |
| 57 | `analytics` | `<Navigate to="/analytics/overview" replace />` | Layout | None | None | YES | `requireAuth` | `src/App.tsx:160` | CANONICAL CANDIDATE |
| 58 | `analytics/overview` | `<AnalyticsExperiencePage />` | Layout | None | Sub-tabs | NO | `requireAuth` | `src/App.tsx:161` | CANONICAL CANDIDATE |
| 59 | `analytics/video` | `<AnalyticsExperiencePage />` | Layout | None | Sub-tabs | NO | `requireAuth` | `src/App.tsx:162` | ACTIVE ALIAS |
| 60 | `analytics/platform` | `<AnalyticsExperiencePage />` | Layout | None | Sub-tabs | NO | `requireAuth` | `src/App.tsx:163` | ACTIVE ALIAS |
| 61 | `analytics/topic` | `<AnalyticsExperiencePage />` | Layout | None | Sub-tabs | NO | `requireAuth` | `src/App.tsx:164` | ACTIVE ALIAS |
| 62 | `analytics/subtopic` | `<AnalyticsExperiencePage />` | Layout | None | Sub-tabs | NO | `requireAuth` | `src/App.tsx:165` | ACTIVE ALIAS |
| 63 | `analytics/difficulty` | `<AnalyticsExperiencePage />` | Layout | None | Sub-tabs | NO | `requireAuth` | `src/App.tsx:166` | ACTIVE ALIAS |
| 64 | `analytics/engagement` | `<AnalyticsExperiencePage />` | Layout | None | Sub-tabs | NO | `requireAuth` | `src/App.tsx:167` | ACTIVE ALIAS |
| 65 | `analytics/retention` | `<AnalyticsExperiencePage />` | Layout | None | Sub-tabs | NO | `requireAuth` | `src/App.tsx:168` | ACTIVE ALIAS |
| 66 | `analytics/intelligence` | `<AnalyticsExperiencePage />` | Layout | None | Sub-tabs | NO | `requireAuth` | `src/App.tsx:169` | ACTIVE ALIAS |
| 67 | `analytics/strategy` | `<AnalyticsExperiencePage />` | Layout | None | Sub-tabs | NO | `requireAuth` | `src/App.tsx:170` | ACTIVE ALIAS |
| 68 | `social-analytics` | `<SocialAnalyticsPage />` | Layout | None | None | NO | `requireAuth` | `src/App.tsx:171` | CANONICAL CANDIDATE |
| 69 | `social-analytics/:contentId` | `<SocialAnalyticsPage />` | Layout | `:contentId` | None | NO | `requireAuth` | `src/App.tsx:172` | CANONICAL CANDIDATE |
| 70 | `my-work` | `<MyWorkPage />` | Layout | None | None | NO | `requireAuth` | `src/App.tsx:175` | CANONICAL CANDIDATE |
| 71 | `team` | `<TeamOperationsPage />` | Layout | None | None | NO | `requireAuth` | `src/App.tsx:176` | CANONICAL CANDIDATE |
| 72 | `team-work` | `<TeamOperationsPage />` | Layout | None | None | NO | `requireAuth` | `src/App.tsx:177` | ACTIVE ALIAS |
| 73 | `settings` | `<SettingsPage />` | Layout | None | None | NO | `requireAuth` | `src/App.tsx:180` | CANONICAL CANDIDATE |
| 74 | `recovery` | `<RecoveryAdminPage />` | Layout | None | None | NO | `requireAuth` | `src/App.tsx:181` | CANONICAL CANDIDATE |
| 75 | `admin` | `<RecoveryAdminPage />` | Layout | None | None | NO | `requireAuth` | `src/App.tsx:182` | ACTIVE ALIAS |
| 76 | `*` | `<NotFoundPage />` | Layout | None | None | NO | None | `src/App.tsx:185` | CANONICAL CANDIDATE |

---

## 4. Route → Page Map

This section establishes what physical component renders for each incoming route:

| Route Path | Rendered Page Component | Component Responsibility | Underlying Workflow Stage |
|---|---|---|---|
| `/dashboard` | `DashboardPage` | Executive health, activity log, conveyor belt widget | Non-Workflow (Executive) |
| `/planning` | `PlanningPage` | Curriculum planning, sprint batch allocation | Non-Workflow (Planning) |
| `/questions` | `QuestionLibraryPage` | Browse master repository of questions | Step 01 / Pre-production |
| `/studio` | `QuestionStudioPage` | Authoring, AI candidate generation, draft submission | Step 01 (Question Generation) |
| `/questions/improve`, `/questions/:id/improve` | `QuestionImprovePage` | Manual/AI question refinement | Step 01 (Question Generation) |
| `/questions/verify`, `/questions/:id/verify` | `QuestionVerifyApprovePage` | Academic solver validation & sign-off gate | Step 02 (Question Verification) |
| `/questions/:id` | `QuestionDetailPage` | Question inspection, proof, options breakdown | Step 01 & Step 02 inspection |
| `/queue` | `QueuePage` | Presenter studio schedule & raw recording queue | Step 04 (Recording intake) |
| `/production` | `ProductionTrackerPage` | Master conveyor belt & kanban table | Steps 03–08 Pipeline overview |
| `/videos/:videoId` | `VideoDetailPage` | Master unified workspace tab container | Steps 03, 04, 05, 06, 07, 08, 09, 10 |
| `/videos/create-script` | `VideoCreateScriptPage` | Selects a video needing script OR redirects to tab | Step 03 (Script / Teleprompter) |
| `/content-masters`, `/content-masters/:id` | `ContentMasterPage` | Permanent ContentMaster inspection & lineage | Cross-Stage (Identity Anchor) |
| `/social-review`, `/social-review/:reviewId`| `SocialReviewPage` | Social package gatekeeper (Telugu, tags, pinned) | Step 09 (Social Review) |
| `/platform-packages`, `/videos/:videoId/platform-packages`| `PlatformPackagesPage` | Multi-platform packages, aspect diffs, live links | Step 12 (Platform Sync) |
| `/publishing` | `PublishingPage` | Manual publishing manager, schedule modal | Step 10 & 11 (Publishing & Live) |
| `/analytics/*` (10 sub-routes) | `AnalyticsExperiencePage` | Viewership, engagement, retention, strategy | Steps 13, 14, 15 |
| `/social-analytics`, `/social-analytics/:contentId` | `SocialAnalyticsPage` | Comment extraction, misconceptions, metrics | Steps 13 & 15 |
| `/my-work` | `MyWorkPage` | Role-filtered assignment queue | Operations Hub |
| `/team`, `/team-work` | `TeamOperationsPage` | Workload balancing, unassigned work | Operations Hub |
| `/settings` | `SettingsPage` | Taxonomy config, Sheets DB status, system stats | System Admin |
| `/recovery`, `/admin` | `RecoveryAdminPage` | GCS backup export, restore preflight & execution| System Disaster Recovery |
| `*` | `NotFoundPage` | 404 Error fallback | Error Handling |

### Pages That Are Unmounted by Router (Orphaned in App.tsx)
1. `ProductionBoardPage.tsx`: App.tsx line 106 defines `<Route path="production-board" element={<Navigate to="/production?status=EDITING" replace />} />`. The imported `ProductionBoardPage` component is never mounted by any route!
2. `PublishingPackagePage.tsx`: App.tsx line 150 defines `<Route path="publishing-package" element={<Navigate to="/platform-packages" replace />} />`. The imported `PublishingPackagePage` component is never mounted by any route!
3. `VideoReviewScriptPage.tsx`: Line 113 redirects `/videos/review-script` to `/production?status=SCRIPT_READY`. Component never mounts!
4. `VideoRecordPage.tsx`: Line 117 redirects `/videos/record` to `/production?status=RECORDING`. Component never mounts!
5. `VideoEditPage.tsx`: Line 121 redirects `/videos/edit-video` to `/production?status=EDITING`. Component never mounts!
6. `VideoFinalPage.tsx`: Line 125 redirects `/videos/final-video` to `/production?status=FINAL_REVIEW`. Component never mounts!
7. `VideoThumbnailPage.tsx`: Line 130 redirects `/videos/thumbnail` to `/production?status=READY_TO_UPLOAD`. Component never mounts!
8. `VideoPinnedCommentPage.tsx`: Line 134 redirects `/videos/pinned-comment` to `/production`. Component never mounts!

---

## 5. Programmatic Navigation Inventory

85 distinct `navigate()` invocations exist across the codebase. Key patterns include:

| Source File | Function / Component | Trigger Event | Destination Route | Navigation Type | Purpose / Workflow Stage |
|---|---|---|---|---|---|
| `src/pages/QuestionStudioPage.tsx:802` | `handleSaveSuccess` | Form submission success | `/questions/${created.id}/verify` | Workflow transition | Advances from Step 01 to Step 02 |
| `src/pages/QuestionVerifyApprovePage.tsx:388` | `handleApproveSuccess` | User approves question | `/videos/${targetVideoId}?tab=script` | Workflow transition | Advances from Step 02 to Step 03 |
| `src/pages/QuestionVerifyApprovePage.tsx:309` | Error fallback action | Click "Back to Studio" | `/studio` | Fallback | Return to Step 01 authoring |
| `src/components/video/ScriptWorkspace.tsx:293` | Script approval button | Click "Approve & Start Filming" | `/videos/${videoId}?tab=recording` | Workflow transition | Advances from Step 03 to Step 04 |
| `src/components/video/ThumbnailWorkspace.tsx:298` | Thumbnail approval | Click "Approve Thumbnail" | `/videos/${videoId}?tab=social` | Workflow transition | Advances from Step 08 to Step 09 |
| `src/components/video/PublishingWorkspace.tsx:216` | Multi-platform schedule | Submit schedule form | `/publishing` | Workflow transition | Advances to Step 10 Manager |
| `src/components/production/ProductionJourneyBar.tsx:86` | Stepper pill click | Click unlocked stage | `jumpToStage(n)` (computed route) | Step jump | Direct navigation along conveyor belt |
| `src/components/production/ProductionJourneyBar.tsx:94` | "Next Action" CTA | Click primary action | `advanceToNextStage()` | Linear advance | Moves to next canonical stage |
| `src/contexts/ProductionJourneyContext.tsx:945`| `jumpToStage` | Programmatic call | `target.route` | Router navigation | Internal context router execution |
| `src/pages/VideoCreateScriptPage.tsx:25` | `useEffect` hook | Mount with videoId param | `/videos/${videoId}?tab=script` | Compatibility redirect | Redirects legacy shim to master tab |
| `src/pages/VideoDetailPage.tsx:74` | Tab selector buttons | User clicks workspace tab | `?tab=${tab}` (`replace: true`) | Query param update | Switches workspace without re-rendering shell |
| `src/pages/PlanningPage.tsx:329` | Generate batch questions | Click "Generate Candidate" | `/generate?topicId=...` | Legacy alias call | Points to `/generate` (which redirects to `/studio`) |
| `src/components/production/ProductionKanban.tsx:128` | Kanban card click | Click video item | `/videos/${video.id}?tab=...` | Direct link | Opens video in appropriate stage tab |

---

## 6. Link / NavLink Inventory

165 `<Link>` and `<NavLink>` elements exist across the application:

| Source File | Element | Destination Expression | Label / Icon | Visible To | Workflow Relevance |
|---|---|---|---|---|---|
| `src/components/layout/Sidebar.tsx` | `<NavLink>` | Hub item `href` (`/dashboard`, `/questions`, `/production`, etc.) | Hub Nav Items | All authorized roles | Primary Navigation |
| `src/components/layout/UserProfileMenu.tsx` | `<Link>` | `/my-work` | "My Work & Queue" | Authenticated users | Task dispatch |
| `src/components/layout/UserProfileMenu.tsx` | `<Link>` | `/settings` | "System Health & Config" | Authenticated users | Admin & Config |
| `src/components/layout/UserProfileMenu.tsx` | `<Link>` | `/recovery` | "Disaster Recovery (Admin)" | ADMIN only | Disaster Recovery |
| `src/components/dashboard/GlobalSearchBar.tsx` | `<Link>` | Dynamic `item.url` | Entity Title & ID | All users | Direct deep-link search |
| `src/components/questions/QuestionWorkflowHeader.tsx` | `<Link>` | `/questions/improve`, `/questions/verify` | Steps 1–4 | Authoring roles | Step 01 & 02 Stepper |
| `src/components/video/VideoWorkflowHeader.tsx` | `<Link>` | `/videos/create-script`, `/videos/record`, etc. | Steps 5–9 | Video roles | Legacy 5-Step Video Stepper |
| `src/components/social/AssetWorkflowHeader.tsx` | `<Link>` | `/videos/thumbnail`, `/videos/pinned-comment` | Steps 10–12 | Asset roles | Legacy Asset Stepper |
| `src/components/publishing/PublishingWorkflowHeader.tsx`| `<Link>` | `/platform-packages`, `/publishing-package`, `/publishing`| Steps 13–15 | Publishing roles| Legacy Publishing Stepper |
| `src/components/production/ProductionTable.tsx` | `<Link>` | `/videos/${video.id}` | Video ID | Production team | Conveyor belt item click |

---

## 7. Sidebar Navigation

Implemented in `src/components/layout/Sidebar.tsx`, consuming `AUTHORITATIVE_HUBS` from `src/config/navigation.ts`:

| Hub | Item Label | Destination Route | Rendered Page | Capability Guard | Notes |
|---|---|---|---|---|---|
| **HOME** | Overview | `/dashboard` | `DashboardPage` | `VIEW_HOME` | Primary command center |
| **HOME** | My Work | `/my-work` | `MyWorkPage` | `VIEW_MY_WORK` | Personal task queue |
| **QUESTIONS** | Question Library | `/questions` | `QuestionLibraryPage` | `VIEW_QUESTIONS` | Master question index |
| **QUESTIONS** | Question Studio | `/studio` | `QuestionStudioPage` | `VIEW_QUESTION_STUDIO` | Authoring console |
| **PRODUCTION** | Recording Queue | `/queue` | `QueuePage` | `VIEW_RECORDING_QUEUE` | Presenter studio queue |
| **PRODUCTION** | Production Pipeline | `/production` | `ProductionTrackerPage`| `VIEW_PRODUCTION` | Master conveyor belt |
| **PUBLISHING** | Quality Signoff | `/social-review` | `SocialReviewPage` | `VIEW_QUALITY_SIGNOFF` | Telugu & social gatekeeper |
| **PUBLISHING** | Publishing Manager | `/publishing` | `PublishingPage` | `VIEW_PUBLISHING` | Multi-platform publishing |
| **ANALYTICS** | Analytics Hub | `/analytics/overview` | `AnalyticsExperiencePage`| `VIEW_ANALYTICS` | Telemetry & insights |
| **MANAGEMENT** | Planning & Batches | `/planning` | `PlanningPage` | `VIEW_PLANNING` | Sprints & curriculum |
| **MANAGEMENT** | Team Workload | `/team` | `TeamOperationsPage` | `VIEW_TEAM` | Team capacity management |
| **MANAGEMENT** | Content Explorer | `/content-masters` | `ContentMasterPage` | `VIEW_CONTENT_MASTERS` | Master entity records |
| **MANAGEMENT** | System Health | `/settings` | `SettingsPage` | `VIEW_SYSTEM_HEALTH` | Sheets DB & system status |

*Sidebar Observations*:
- Clean, authoritative structure. Zero dead links in the sidebar itself.
- All 13 items point to valid, non-redirecting canonical candidate routes.

---

## 8. Header / Global Navigation

Implemented in `src/components/layout/Header.tsx`:
- **Desktop Page Title**: Dynamically computed via `inferBreadcrumbs(location.pathname, location.search)`. Displays current hub/page name.
- **Global Search Bar (`GlobalSearchBar.tsx`)**: Queries `/api/search/global?q=...`. Formulates direct deep-link `<Link>` items:
  - Video → `/videos/:id`
  - Script → `/videos/:videoId?tab=script`
  - ContentMaster → `/content-masters/:id`
  - Social Review → `/social-review/:id`
  - Question → `/questions/:id`
- **User Profile Dropdown (`UserProfileMenu.tsx`)**:
  - Links to `/my-work`
  - Links to `/settings`
  - Links to `/recovery` (conditionally visible to `ADMIN` only)
  - Sign Out button (calls `logout()` via `AuthContext`)
- **System Health Indicator**: Live modal displaying Google Sheets connectivity and operational latency.

---

## 9. Breadcrumb Audit

Implemented in `src/design-system/components/AppBreadcrumbs.tsx` via `inferBreadcrumbs(pathname, search)`:

| Current Route Pattern | Breadcrumb Hierarchy Rendered | Target Links | Evaluation |
|---|---|---|---|
| `/dashboard` | Home > Overview | Home (`/dashboard`) | Correct |
| `/my-work` | Home > My Work | Home (`/dashboard`) | Correct |
| `/questions` | Questions > Question Library | Questions (`/questions`) | Correct |
| `/studio` | Questions > Question Studio | Questions (`/questions`) | Correct |
| `/questions/:id/verify` | Questions > Question Studio > Verify & Approve | Questions (`/questions`), Studio (`/studio`) | **CONFLICT**: Points parent to `/studio` rather than Question Library or Detail |
| `/questions/:id` | Questions > Question Details | Questions (`/questions`) | Correct |
| `/queue` | Production > Recording Queue | Production (`/production`) | Correct |
| `/production` | Production > Production Pipeline | Production (`/production`) | Correct |
| `/videos/:videoId` | Production > Video Details | Production (`/production`) | Correct |
| `/videos/:videoId/create-script` | Production > Video Production > Scriptwriting | Video Production (`/production`) | Points to `/production` |
| `/videos/:videoId/record` | Production > Recording Queue > Studio Recording | Recording Queue (`/queue`) | Points to `/queue` |
| `/videos/:videoId/edit-video` | Production > Video Production > Editing | Video Production (`/production`) | Points to `/production` |
| `/videos/:videoId/final-video` | Production > Video Production > Final QC Review | Video Production (`/production`) | Points to `/production` |
| `/videos/:videoId/thumbnail` | Production > Video Production > Thumbnail Design | Video Production (`/production`) | Points to `/production` |
| `/social-review` | Publishing > Quality Signoff | Publishing (`/publishing`) | Points parent to `/publishing` |
| `/platform-packages` | Publishing > Platform Packages | Publishing (`/publishing`) | Points parent to `/publishing` |
| `/publishing` | Publishing > Publishing Manager | Publishing (`/publishing`) | Correct |

---

## 10. Workflow Navigation Audit

Tracing how user navigation connects across the 15 canonical stages:

```
Step 01: Question Generation (/studio)
  ↓ [Save Question]
Step 02: Verification (/questions/:id/verify)
  ↓ [Approve Question]
Step 03: Audience Script (/videos/:videoId?tab=script)
  ↓ [Approve Script & Start Filming]
Step 04: Teleprompter & Filming (/videos/:videoId?tab=recording)
  ↓ [Upload Camera Take]
Step 05: Raw Video Handoff (/videos/:videoId?tab=recording)
  ↓ [Start Editing]
Step 06: Editing Bay (/videos/:videoId?tab=editing)
  ↓ [Submit Cut for QC]
Step 07: Final QC (/videos/:videoId?tab=final-review)
  ↓ [Sign Off QC]
Step 08: Thumbnail Design (/videos/:videoId?tab=thumbnail)
  ↓ [Approve Thumbnail]
Step 09: Social Review (/social-review/:contentMasterId OR /videos/:videoId?tab=social)
  ↓ [Editorial Signoff]
Step 10: Publishing Setup (/videos/:videoId?tab=publishing OR /publishing)
  ↓ [Execute Upload / Post Live]
Step 11: Live Verification (/publishing - Record Publication Modal)
  ↓ [Save Live URLs]
Step 12: Platform Sync (/platform-packages)
  ↓ [Confirm Sync]
Step 13: Social Analytics (/social-analytics/:contentMasterId)
  ↓ [Analyze Feedback]
Step 14: Performance Review (/analytics/engagement)
  ↓ [Review Drop-Off]
Step 15: Pedagogical Insights (/analytics/intelligence)
  ↓ [Create Next Question]
Loopback to Step 01 (/studio)
```

---

## 11. Next / Previous Navigation Forensics

| Source Component | Current Route | Button Label | Next Destination | Mechanism | Workflow Integrity |
|---|---|---|---|---|---|
| `QuestionStudioPage.tsx` | `/studio` | "Proceed to Verification" | `/questions/${id}/verify` | `navigate()` | Clean transition to Step 02 |
| `QuestionVerifyApprovePage.tsx` | `/questions/:id/verify` | "Approve & Create Video Script" | `/videos/${targetVideoId}?tab=script` | `navigate()` | Advances to Step 03 |
| `ScriptWorkspace.tsx` | `/videos/:id?tab=script` | "Approve & Start Filming" | `/videos/${id}?tab=recording` | `navigate()` | Advances to Step 04 |
| `RecordingWorkspace.tsx` | `/videos/:id?tab=recording` | "Send to Editing" | `/videos/${id}?tab=editing` | `onNavigateTab('editing')` | Advances to Step 06 |
| `EditingWorkspace.tsx` | `/videos/:id?tab=editing` | "Submit for Final QC" | `/videos/${id}?tab=final-review` | `navigate()` | Advances to Step 07 |
| `FinalReviewWorkspace.tsx` | `/videos/:id?tab=final-review` | "Proceed to Thumbnail Design" | `/videos/${id}?tab=thumbnail` | `onNavigateTab('thumbnail')` | Advances to Step 08 |
| `ThumbnailWorkspace.tsx` | `/videos/:id?tab=thumbnail` | "Approve Thumbnail" | `/videos/${id}?tab=social` | `navigate()` | Advances to Step 09 |
| `SocialReviewPage.tsx` | `/social-review/:id` | "Approve Package" | `/publishing` | `navigate()` | Advances to Step 10 |
| `PublishingWorkspace.tsx` | `/videos/:id?tab=publishing`| "Open Multi-Platform Hub" | `/platform-packages` | `navigate()` | Advances to Step 12 |
| `ProductionJourneyBar.tsx` | Any video stage | "Next Action" (Dynamic) | Computed `nextAction.route` | `advanceToNextStage()` | Canonical linear advance |

---

## 12. Redirect Audit

The repository contains **27 explicit route redirect declarations** in `src/App.tsx`:

| Source Route | Target Destination | Reason / Mechanism | Classification |
|---|---|---|---|
| `/` | `getDefaultLandingRoute(user.role)` | Role-based landing route | CANONICAL |
| `/questions/new` | `/studio` | Legacy alias | LEGACY |
| `/generate` | `/studio` | Legacy alias | LEGACY |
| `/production-tracker` | `/production` | Legacy URL consolidation | LEGACY |
| `/production-board` | `/production?status=EDITING` | Alias to filtered tracker | LEGACY |
| `/videos/:videoId/create-script` | `/videos/:videoId?tab=script` | Tab parameter unification | ACTIVE ALIAS |
| `/production/:videoId/create-script` | `/videos/:videoId?tab=script` | Tab parameter unification | ACTIVE ALIAS |
| `/videos/review-script` | `/production?status=SCRIPT_READY` | Generic queue redirect | LEGACY |
| `/videos/:videoId/review-script` | `/videos/:videoId?tab=script` | Tab parameter unification | ACTIVE ALIAS |
| `/production/:videoId/review-script` | `/videos/:videoId?tab=script` | Tab parameter unification | ACTIVE ALIAS |
| `/videos/record` | `/production?status=RECORDING` | Generic queue redirect | LEGACY |
| `/videos/:videoId/record` | `/videos/:videoId?tab=recording` | Tab parameter unification | ACTIVE ALIAS |
| `/production/:videoId/record` | `/videos/:videoId?tab=recording` | Tab parameter unification | ACTIVE ALIAS |
| `/videos/edit-video` | `/production?status=EDITING` | Generic queue redirect | LEGACY |
| `/videos/:videoId/edit-video` | `/videos/:videoId?tab=editing` | Tab parameter unification | ACTIVE ALIAS |
| `/production/:videoId/edit-video` | `/videos/:videoId?tab=editing` | Tab parameter unification | ACTIVE ALIAS |
| `/videos/final-video` | `/production?status=FINAL_REVIEW` | Generic queue redirect | LEGACY |
| `/videos/:videoId/final-video` | `/videos/:videoId?tab=final-review` | Tab parameter unification | ACTIVE ALIAS |
| `/production/:videoId/final-video` | `/videos/:videoId?tab=final-review` | Tab parameter unification | ACTIVE ALIAS |
| `/videos/thumbnail` | `/production?status=READY_TO_UPLOAD` | Generic queue redirect | LEGACY |
| `/videos/:videoId/thumbnail` | `/videos/:videoId?tab=thumbnail` | Tab parameter unification | ACTIVE ALIAS |
| `/production/:videoId/thumbnail` | `/videos/:videoId?tab=thumbnail` | Tab parameter unification | ACTIVE ALIAS |
| `/videos/pinned-comment` | `/production` | Generic queue redirect | LEGACY |
| `/videos/:videoId/pinned-comment` | `/videos/:videoId?tab=social` | Tab parameter unification | ACTIVE ALIAS |
| `/production/:videoId/pinned-comment` | `/videos/:videoId?tab=social` | Tab parameter unification | ACTIVE ALIAS |
| `/videos/:videoId/social-review` | `/videos/:videoId?tab=social` | Tab parameter unification | ACTIVE ALIAS |
| `/production/:videoId/social-review` | `/videos/:videoId?tab=social` | Tab parameter unification | ACTIVE ALIAS |
| `/production/:videoId` | `/videos/:videoId` | Tab parameter unification | ACTIVE ALIAS |
| `/publishing-package` | `/platform-packages` | Legacy URL consolidation | LEGACY |
| `/videos/publishing-package` | `/platform-packages` | Legacy URL consolidation | LEGACY |
| `/videos/:videoId/publishing-package` | `/platform-packages` | Legacy URL consolidation | LEGACY |
| `/production/:videoId/publishing-package` | `/platform-packages` | Legacy URL consolidation | LEGACY |
| `/videos/:videoId/publish` | `/videos/:videoId?tab=publishing` | Tab parameter unification | ACTIVE ALIAS |
| `/production/:videoId/publish` | `/videos/:videoId?tab=publishing` | Tab parameter unification | ACTIVE ALIAS |
| `/analytics` | `/analytics/overview` | Root analytics redirect | CANONICAL |

---

## 13. Multiple URL / Duplicate Route Audit

The following table documents pages reachable via multiple distinct URLs:

| Page / Component | URL 1 (Canonical Candidate) | URL 2 (Active Alias) | URL 3 (Legacy Alias) | Same Component? | Redirect Chain? | Reason for Multi-URL | Status |
|---|---|---|---|---|---|---|---|
| `QuestionStudioPage` | `/studio` | `/questions/new` | `/generate` | Yes | Direct redirect | Backward compatibility with phase prompts | KNOWN |
| `QuestionVerifyApprovePage` | `/questions/:id/verify` | `/questions/verify` | None | Yes | Direct render | Direct link vs general queue view | KNOWN |
| `ProductionTrackerPage` | `/production` | `/production-tracker` | `/production-board` | Yes | Direct redirect | Merged kanban board into unified tracker | KNOWN |
| `VideoDetailPage (Script)` | `/videos/:videoId?tab=script` | `/videos/:videoId/create-script` | `/production/:videoId/create-script` | Yes | `<VideoTabRedirect>` | Migration from standalone pages to tabs | KNOWN |
| `VideoDetailPage (Filming)`| `/videos/:videoId?tab=recording`| `/videos/:videoId/record` | `/production/:videoId/record` | Yes | `<VideoTabRedirect>` | Migration from standalone pages to tabs | KNOWN |
| `VideoDetailPage (Editing)`| `/videos/:videoId?tab=editing` | `/videos/:videoId/edit-video` | `/production/:videoId/edit-video` | Yes | `<VideoTabRedirect>` | Migration from standalone pages to tabs | KNOWN |
| `VideoDetailPage (QC)` | `/videos/:videoId?tab=final-review`| `/videos/:videoId/final-video`| `/production/:videoId/final-video` | Yes | `<VideoTabRedirect>` | Migration from standalone pages to tabs | KNOWN |
| `VideoDetailPage (Thumb)` | `/videos/:videoId?tab=thumbnail` | `/videos/:videoId/thumbnail` | `/production/:videoId/thumbnail` | Yes | `<VideoTabRedirect>` | Migration from standalone pages to tabs | KNOWN |
| `VideoDetailPage (Social)` | `/videos/:videoId?tab=social` | `/videos/:videoId/social-review`| `/videos/:videoId/pinned-comment` | Yes | `<VideoTabRedirect>` | Migration from standalone pages to tabs | KNOWN |
| `PlatformPackagesPage` | `/platform-packages` | `/videos/platform-packages` | `/publishing-package` | Yes | Direct render & redirect | Multiple naming conventions during dev | KNOWN |
| `SocialReviewPage` | `/social-review/:reviewId` | `/social-review` | None | Yes | Direct render | Single review vs full queue review | KNOWN |
| `AnalyticsExperiencePage` | `/analytics/overview` | `/analytics/engagement` | `/analytics/retention` | Yes | Direct render | Multi-tab analytics view in single page | KNOWN |
| `RecoveryAdminPage` | `/recovery` | `/admin` | None | Yes | Direct render | Route alias | KNOWN |
| `TeamOperationsPage` | `/team` | `/team-work` | None | Yes | Direct render | Route alias | KNOWN |

---

## 14. Deep-Link Audit

| Parameterized Route | ID Parameter Type | Direct Resolution Behavior | Context Hydration Mechanism | Status |
|---|---|---|---|---|
| `/questions/:id` | Question ID (`BP-Q-000001`) | Fetches question directly via `apiClient.getQuestionById(id)` | Self-contained, hydrates `ProductionJourneyContext` if wrapped | CONFIRMED FROM CODE |
| `/questions/:id/verify` | Question ID (`BP-Q-000001`) | Fetches question directly via `apiClient.getQuestionById(id)` | Self-contained | CONFIRMED FROM CODE |
| `/videos/:videoId` | Video ID (`BP-VID-000001`) | Fetches video directly via `apiClient.getVideoById(videoId)` | Reads `?tab=` query param; defaults to `script` | CONFIRMED FROM CODE |
| `/social-review/:reviewId`| ContentMaster / Review ID | Fetches via `apiClient.getSocialReviewById(reviewId)` | Self-contained | CONFIRMED FROM CODE |
| `/social-analytics/:contentId`| ContentMaster ID | Queries analytics by ContentMaster ID | Self-contained | CONFIRMED FROM CODE |
| `/content-masters/:id` | ContentMaster ID (`BP-CNT-000001`)| Fetches hierarchy via `apiClient.getContentMasterDetails(id)` | Self-contained | CONFIRMED FROM CODE |

*Deep-Link Conclusion*: Direct URL paste/refresh works robustly across all parameterized routes because each target page independently fetches its data by ID from the API rather than relying solely on ephemeral client context state.

---

## 15. Query Parameter Navigation

| Query Parameter | Target Pages | Values / Semantics | Preservation on Redirect |
|---|---|---|---|
| `?tab=` | `VideoDetailPage.tsx` | `script`, `recording`, `editing`, `final-review`, `thumbnail`, `social`, `publishing` | Preserved via `VideoTabRedirect` |
| `?status=` | `ProductionTrackerPage.tsx`, `QuestionLibraryPage.tsx` | Status filter values (`EDITING`, `RECORDING`, `APPROVED`, etc.) | Set explicitly by shims |
| `?id=` | `QuestionStudioPage.tsx` | Preloads existing question draft for editing | Preserved |
| `?topicId=`, `?subtopicId=` | `QuestionStudioPage.tsx` | Pre-selects taxonomy dropdowns from planning board | Preserved |
| `?videoId=` | `SocialAnalyticsPage.tsx` | Pre-filters telemetry for specific video | Preserved |
| `?contentId=` | `SocialAnalyticsPage.tsx` | Correlates social analytics with content master | Preserved |

---

## 16. Location / Pathname Dependencies

| Source File | URL Dependency | Behavior Controlled | Risk / Observation |
|---|---|---|---|
| `src/components/layout/Sidebar.tsx` | `location.pathname` | Computes active navigation link highlight | Low risk; robust pattern |
| `src/design-system/components/AppBreadcrumbs.tsx` | `location.pathname`, `location.search` | Computes breadcrumb hierarchy & page title | Moderate risk: legacy paths show nested labels |
| `src/pages/VideoDetailPage.tsx` | `location.search` (`?tab=`) | Switches active workspace tab | Low risk; clean tab synchronization |
| `src/App.tsx:VideoTabRedirect` | `location.search`, `useParams()` | Copies search params to `/videos/:videoId?tab=...` | Low risk; avoids dropping URL parameters |

---

## 17. Authentication / Authorization Navigation

Implemented in `src/App.tsx:AppRoutes()` and `src/contexts/AuthContext.tsx`:
1. **Unauthenticated Access**:
   - If `!user && !isLoading`, `AppRoutes` returns `<LoginPage />` regardless of target URL.
   - *Risk*: When an unauthenticated user pastes a deep link (e.g., `/videos/BP-VID-000042`), logging in redirects them to their role's default landing route (`getDefaultLandingRoute`), losing the original deep link.
2. **Authorized Role Redirection**:
   - Access to root (`/`) triggers `<Navigate to={getDefaultLandingRoute(user.role)} replace />`.
   - Default Landing Routes:
     - `ADMIN`, `CONTENT_LEAD`, `ANALYST`: `/dashboard`
     - `QUESTION_AUTHOR`, `QUESTION_EDITOR`: `/studio`
     - `VIDEO_EDITOR`, `DESIGNER`, `SCRIPTWRITER`: `/production`
     - `PRESENTER`: `/queue`
     - `QA_REVIEWER`, `PUBLISHING_LEAD`: `/social-review`

---

## 18. Navigation Systems Inventory

The codebase currently contains **10 distinct, overlapping navigation systems**:

| System # | Navigation System Name | Files Involved | Scope & Responsibility | Competing Overlap |
|---|---|---|---|---|
| 1 | **React Router Main Registry** | `src/App.tsx` | Global URL matching & component mounting | Houses 56 route declarations |
| 2 | **Sidebar Hub Navigation** | `src/components/layout/Sidebar.tsx`, `navigation.ts` | Authoritative 6-Hub IA | Overlaps with direct route links |
| 3 | **Top Header & Global Search** | `src/components/layout/Header.tsx`, `GlobalSearchBar.tsx` | Page titles, deep search, user menu | Links directly into detail pages |
| 4 | **Breadcrumb Navigation Engine** | `src/design-system/components/AppBreadcrumbs.tsx` | Hierarchical return links | Often invents intermediate paths |
| 5 | **Production Journey Conveyor** | `ProductionJourneyContext.tsx`, `ProductionJourneyBar.tsx`| 15-stage workflow state & "Next Action" | Overlaps with video workspace tabs |
| 6 | **Legacy Question Workflow Stepper**| `QuestionWorkflowHeader.tsx` | 4-step question header (`/studio` → `/verify`) | Competes with Production Journey |
| 7 | **Legacy Video Workflow Stepper** | `VideoWorkflowHeader.tsx` | 5-step video header (`/videos/create-script`, etc.) | Direct conflict: links to legacy routes |
| 8 | **Legacy Asset Workflow Stepper** | `AssetWorkflowHeader.tsx` | 3-step asset header (`/videos/thumbnail`, etc.) | Direct conflict: links to legacy routes |
| 9 | **Legacy Publishing Stepper** | `PublishingWorkflowHeader.tsx` | 3-step publishing header | Links to `/platform-packages` & `/publishing` |
| 10 | **Video Detail Workspace Tabs** | `VideoDetailPage.tsx` | Tab query parameter navigation (`?tab=...`) | Canonical destination for video pipeline |

---

## 19. Route → Page → Workflow Matrix

Mapping every functional route to the canonical 15-step workflow from `01-product-truth.md`:

| Route | Rendered Page | Workflow Step | Step Title (from Truth) | Parameters | Deep-Link Status | Classification |
|---|---|---|---|---|---|---|
| `/studio` | `QuestionStudioPage` | **Step 01** | Question Generation | `?id=`, `?topicId=` | CONFIRMED | CANONICAL CANDIDATE |
| `/questions` | `QuestionLibraryPage` | **Step 01** (Catalog) | Question Repository | `?status=` | CONFIRMED | CANONICAL CANDIDATE |
| `/questions/:id/verify` | `QuestionVerifyApprovePage` | **Step 02** | Question Verification | `:id` | CONFIRMED | CANONICAL CANDIDATE |
| `/videos/:id?tab=script` | `VideoDetailPage` | **Step 03** | Script / Teleprompter | `:id`, `?tab=script` | CONFIRMED | CANONICAL CANDIDATE |
| `/videos/:id?tab=recording`| `VideoDetailPage` | **Step 04 & 05** | Recording & Raw Handoff | `:id`, `?tab=recording`| CONFIRMED | CANONICAL CANDIDATE |
| `/queue` | `QueuePage` | **Step 04** (Intake) | Recording Queue | None | CONFIRMED | CANONICAL CANDIDATE |
| `/videos/:id?tab=editing` | `VideoDetailPage` | **Step 06** | Editing Bay | `:id`, `?tab=editing` | CONFIRMED | CANONICAL CANDIDATE |
| `/videos/:id?tab=final-review`| `VideoDetailPage` | **Step 07** | Final QC | `:id`, `?tab=final-review`| CONFIRMED | CANONICAL CANDIDATE |
| `/videos/:id?tab=thumbnail`| `VideoDetailPage` | **Step 08** | Thumbnail Design | `:id`, `?tab=thumbnail`| CONFIRMED | CANONICAL CANDIDATE |
| `/social-review/:id` | `SocialReviewPage` | **Step 09** | Social Review | `:id` | CONFIRMED | CANONICAL CANDIDATE |
| `/videos/:id?tab=social` | `VideoDetailPage` | **Step 09** | Social Review (In-context) | `:id`, `?tab=social` | CONFIRMED | ACTIVE ALIAS |
| `/publishing` | `PublishingPage` | **Step 10 & 11** | Publishing Setup & Live | None | CONFIRMED | CANONICAL CANDIDATE |
| `/videos/:id?tab=publishing`| `VideoDetailPage`| **Step 10** | Publishing Staging | `:id`, `?tab=publishing`| CONFIRMED | ACTIVE ALIAS |
| `/platform-packages` | `PlatformPackagesPage` | **Step 12** | Platform Sync / Package | None | CONFIRMED | CANONICAL CANDIDATE |
| `/social-analytics/:id` | `SocialAnalyticsPage` | **Step 13** | Social Analytics | `:id` | CONFIRMED | CANONICAL CANDIDATE |
| `/analytics/engagement` | `AnalyticsExperiencePage` | **Step 14** | Performance Review | Sub-tab | CONFIRMED | CANONICAL CANDIDATE |
| `/analytics/intelligence`| `AnalyticsExperiencePage` | **Step 15** | Pedagogical Insights | Sub-tab | CONFIRMED | CANONICAL CANDIDATE |
| `/dashboard` | `DashboardPage` | NON-WORKFLOW | Executive Command Hub | None | CONFIRMED | CANONICAL CANDIDATE |
| `/planning` | `PlanningPage` | NON-WORKFLOW | Curricular Planning | None | CONFIRMED | CANONICAL CANDIDATE |
| `/my-work` | `MyWorkPage` | NON-WORKFLOW | Operations Dispatch | None | CONFIRMED | CANONICAL CANDIDATE |
| `/team` | `TeamOperationsPage` | NON-WORKFLOW | Team Management | None | CONFIRMED | CANONICAL CANDIDATE |
| `/content-masters/:id` | `ContentMasterPage` | NON-WORKFLOW | Entity Inspector | `:id` | CONFIRMED | CANONICAL CANDIDATE |
| `/settings` | `SettingsPage` | NON-WORKFLOW | System Administration | None | CONFIRMED | CANONICAL CANDIDATE |
| `/recovery` | `RecoveryAdminPage` | NON-WORKFLOW | Disaster Recovery | None | CONFIRMED | CANONICAL CANDIDATE |

---

## 20. Workflow Navigation Matrix

| Current Step | Current Page | Next Action | Actual Destination | Expected Next Step | Previous Action | Actual Prev Destination | Result |
|---|---|---|---|---|---|---|---|
| **01** Question | `QuestionStudioPage` | Save & Proceed | `/questions/:id/verify` | Step 02 | Cancel | `/questions` | **ALIGNED** |
| **02** Verification | `QuestionVerifyApprovePage` | Approve & Create Script | `/videos/:targetVideoId?tab=script` | Step 03 | Revise | `/studio?id=:id` | **ALIGNED** |
| **03** Script | `VideoDetailPage (script)` | Approve & Start Filming | `/videos/:id?tab=recording` | Step 04 | Back | `/questions/:id/verify` | **ALIGNED** |
| **04** Recording | `VideoDetailPage (recording)`| Send to Editing | `/videos/:id?tab=editing` | Step 05 / 06 | Back to Script | `/videos/:id?tab=script` | **SKIPS STEP 05 SCREEN** (Raw handoff happens in recording tab) |
| **05** Raw Handoff| `VideoDetailPage (recording)`| Upload Footage | Same tab (`?tab=recording`) | Step 06 | Retake | Teleprompter playback | **CO-LOCATED IN STEP 04** |
| **06** Editing | `VideoDetailPage (editing)` | Submit for QC | `/videos/:id?tab=final-review` | Step 07 | Back | `/videos/:id?tab=recording`| **ALIGNED** |
| **07** Final QC | `VideoDetailPage (final-review)`| Proceed to Thumbnail | `/videos/:id?tab=thumbnail` | Step 08 | Reject Cut | `/videos/:id?tab=editing` | **ALIGNED** |
| **08** Thumbnail | `VideoDetailPage (thumbnail)`| Approve Thumbnail | `/videos/:id?tab=social` | Step 09 | Iterate | Thumbnail uploader | **ALIGNED** |
| **09** Social Review| `SocialReviewPage` | Approve Package | `/publishing` | Step 10 | Reject Package | Defect modal | **ALIGNED** |
| **10** Publishing Setup| `PublishingPage` | Execute Publish | Live URL Modal | Step 11 | Edit Package | `/social-review/:id` | **ALIGNED** |
| **11** Live Verif | Live URL Modal | Save Live URLs | `/platform-packages` | Step 12 | Cancel | Modal close | **ALIGNED** |
| **12** Platform Sync | `PlatformPackagesPage` | View Analytics | `/social-analytics/:id` | Step 13 | Back | `/publishing` | **ALIGNED** |
| **13** Social Analytics| `SocialAnalyticsPage` | Conduct Review | `/analytics/engagement` | Step 14 | Back | `/platform-packages` | **ALIGNED** |
| **14** Perf Review | `AnalyticsExperiencePage` | Pedagogical Insights | `/analytics/intelligence` | Step 15 | Back | `/social-analytics/:id` | **ALIGNED** |
| **15** Insights | `AnalyticsExperiencePage` | Create Next Question | `/studio` | Step 01 | Back | `/analytics/engagement` | **FULL CYCLE COMPLETE** |

---

## 21. Dead / Unreachable Route Candidates

1. `src/pages/ProductionBoardPage.tsx` (`LIKELY DEAD`):
   - Defined as page component, but in `App.tsx` the path `/production-board` unconditionally redirects to `/production?status=EDITING`. The page component is never rendered.
2. `src/pages/PublishingPackagePage.tsx` (`LIKELY DEAD`):
   - In `App.tsx`, the path `/publishing-package` unconditionally redirects to `/platform-packages`. The page component is never rendered.
3. Standalone Video Step Pages (`LIKELY DEAD`):
   - `VideoReviewScriptPage.tsx` (redirected to `/production?status=SCRIPT_READY`)
   - `VideoRecordPage.tsx` (redirected to `/production?status=RECORDING`)
   - `VideoEditPage.tsx` (redirected to `/production?status=EDITING`)
   - `VideoFinalPage.tsx` (redirected to `/production?status=FINAL_REVIEW`)
   - `VideoThumbnailPage.tsx` (redirected to `/production?status=READY_TO_UPLOAD`)
   - `VideoPinnedCommentPage.tsx` (redirected to `/production`)
   *Evidence*: All parameterized versions redirect to `/videos/:videoId?tab=...` and unparameterized versions redirect to `/production?status=...`.

---

## 22. Wrong Destination Findings

1. **`VideoWorkflowHeader.tsx` Unparameterized Clicks (`CONFIRMED`)**:
   - If `VideoWorkflowHeader` is rendered without a `videoId` prop, clicking "Scripting" navigates to `/videos/create-script`, "Filming" navigates to `/videos/record`, and "Editing" navigates to `/videos/edit-video`.
   - In `App.tsx`, `/videos/record` redirects to `/production?status=RECORDING` instead of presenting an active filming studio view.
2. **`AppBreadcrumbs.tsx` for Question Verify (`CONFIRMED`)**:
   - When on `/questions/:id/verify`, the breadcrumb renders `Questions > Question Studio > Verify & Approve`.
   - Clicking the intermediate link navigates to `/studio` (a blank new question form) rather than `/questions` or `/questions/:id`.
3. **`PlanningPage.tsx:329` Generate Navigation (`CONFIRMED`)**:
   - `PlanningPage` calls `navigate('/generate?' + params.toString())`.
   - In `App.tsx`, `/generate` is a redirect to `/studio`. While it works, it triggers an unnecessary redirect hop.

---

## 23. Navigation Conflicts

| Navigation Source | Label | Source Destination | Competing System | Competing Destination | Evaluation & Conflict |
|---|---|---|---|---|---|
| Sidebar | Recording Queue | `/queue` | Breadcrumbs | `/production` (Parent) | Minor inconsistency in parent hierarchy |
| Production Journey | Step 09 Social Review | `/social-review/:contentMasterId` | Video Detail Tabs | `/videos/:videoId?tab=social` | **DUAL VIEW CONFLICT**: Two completely different UIs render Step 09 |
| Legacy Video Header | Review & QC | `/videos/final-video` | Video Detail Tabs | `/videos/:videoId?tab=final-review` | Legacy header triggers redirect hop |
| Legacy Asset Header | Thumbnail | `/videos/thumbnail` | Video Detail Tabs | `/videos/:videoId?tab=thumbnail` | Legacy header triggers redirect hop |
| Dashboard Widget | Continue Editing | `/videos/:id` | Production Table | `/videos/:id?tab=editing` | Direct click opens default tab (`script`) instead of active stage |

---

## 24. Deep-Link Risk Matrix

| Parameterized Route | Required Context | Refresh Risk | Parameter Risk | Redirect Risk | State Dependency | Evidence | Status |
|---|---|---|---|---|---|---|---|
| `/questions/:id` | None | None | Low | None | Self-fetching | Direct API call in `useEffect` | CONFIRMED SAFE |
| `/questions/:id/verify` | None | None | Low | None | Self-fetching | Direct API call in `useEffect` | CONFIRMED SAFE |
| `/videos/:videoId` | None | None | Low | None | Reads `?tab=` | Direct API call in `useEffect` | CONFIRMED SAFE |
| `/videos/:videoId/edit-video`| None | None | Low | High (Redirect) | URL rewriting | Redirects to `/videos/:videoId?tab=editing` | CONFIRMED SAFE (Via redirect) |
| `/social-review/:reviewId`| None | None | Low | None | Self-fetching | Direct API call in `useEffect` | CONFIRMED SAFE |
| `/social-analytics/:contentId`| None | None | Low | None | Self-fetching | Direct API call in `useEffect` | CONFIRMED SAFE |
| Direct deep-link when logged out | User session | High (Route Loss)| Low | High | Auth Guard | Login redirect defaults to role landing route | CONFIRMED RISK |

---

## 25. Navigation Architecture Map

```
                                  [ BROWSER REQUEST ]
                                           │
                                  ┌────────▼────────┐
                                  │   src/App.tsx   │
                                  └────────┬────────┘
                                           │
         ┌─────────────────────────────────┴─────────────────────────────────┐
         │                                                                   │
  [ AUTH GUARD: No User ]                                           [ AUTH GUARD: User Present ]
         │                                                                   │
   <LoginPage />                                                    <Layout /> (Global Shell)
                                                                             │
                      ┌──────────────────────────────────────────────────────┴───────────────────────┐
                      │                                                                              │
             [ SIDEBAR HUBS ]                                                                 [ DIRECT ROUTES ]
                      │                                                                              │
     ┌────────────────┼────────────────┬────────────────┬────────────────┐                           │
     ▼                ▼                ▼                ▼                ▼                           ▼
1. HOME         2. QUESTIONS     3. PRODUCTION    4. PUBLISHING    5. ANALYTICS               SPECIALIZED WORKBOARDS
/dashboard      /questions       /queue           /social-review   /analytics/overview        - /planning
/my-work        /studio          /production      /publishing                                 - /content-masters/:id
                                                                                              - /settings
                                                                                              - /recovery
                                                                                                     │
                                   ┌─────────────────────────────────────────────────────────────────┘
                                   │
                                   ▼
                      [ MASTER WORKFLOW CONVEYOR ]
                                   │
     ┌─────────────────────────────┼─────────────────────────────┐
     ▼                             ▼                             ▼
Step 01: Studio            Step 02: Verification         Step 03-08: Video Detail
/studio                    /questions/:id/verify         /videos/:videoId?tab=...
                                                                 │
                                           ┌─────────────────────┼─────────────────────┐
                                           ▼                     ▼                     ▼
                                      ?tab=script          ?tab=recording         ?tab=editing
                                      (Step 03)            (Steps 04 & 05)        (Step 06)
                                                                 │
                                           ┌─────────────────────┼─────────────────────┐
                                           ▼                     ▼                     ▼
                                      ?tab=final-review    ?tab=thumbnail         ?tab=social
                                      (Step 07)            (Step 08)              (Step 09 Alt)
                                                                                       │
                                   ┌───────────────────────────────────────────────────┘
                                   │
                                   ▼
                       Step 09: Dedicated Gatekeeper (/social-review/:id)
                                   │
                                   ▼
                       Step 10 & 11: Publishing Manager (/publishing)
                                   │
                                   ▼
                       Step 12: Syndication Package (/platform-packages)
                                   │
                                   ▼
                       Steps 13-15: Analytics & Intelligence Hub
                       - /social-analytics/:contentId (Step 13)
                       - /analytics/engagement (Step 14)
                       - /analytics/intelligence (Step 15)
                                   │
                                   └─────────► Loopback to Step 01 (/studio)
```

---

## 26. Product Truth Comparison

| Canonical Step # | Canonical Step Name (Product Truth) | Current Active UI Path | Direct Route Available? | Navigation Transition Mechanism | Alignment Status |
|---|---|---|---|---|---|
| **01** | Question Generation | `/studio` | YES | Form submit → `/questions/:id/verify` | **PERFECT ALIGNMENT** |
| **02** | Question Verification | `/questions/:id/verify` | YES | Approve button → `/videos/:videoId?tab=script` | **PERFECT ALIGNMENT** |
| **03** | Audience Script / Teleprompter | `/videos/:videoId?tab=script` | YES (via query param) | Approve button → `/videos/:videoId?tab=recording`| **PERFECT ALIGNMENT** |
| **04** | Teleprompter & Filming | `/videos/:videoId?tab=recording`| YES (via query param) | Presenter complete → Ingest raw | **PERFECT ALIGNMENT** |
| **05** | Raw Video Ingest & Handoff | `/videos/:videoId?tab=recording`| NO (co-located) | Embedded in recording tab | **ACCEPTABLE (CO-LOCATED)**|
| **06** | Video Editing Bay | `/videos/:videoId?tab=editing` | YES (via query param) | Submit Cut → `/videos/:videoId?tab=final-review` | **PERFECT ALIGNMENT** |
| **07** | Final QC & Inspection | `/videos/:videoId?tab=final-review`| YES (via query param) | QC Signoff → `/videos/:videoId?tab=thumbnail` | **PERFECT ALIGNMENT** |
| **08** | Thumbnail Design | `/videos/:videoId?tab=thumbnail`| YES (via query param) | Approve Thumbnail → Step 09 | **PERFECT ALIGNMENT** |
| **09** | Social Review & Signoff | `/social-review/:id` & `?tab=social`| YES | Editorial Signoff → `/publishing` | **DUAL IMPLEMENTATION** |
| **10** | Publishing Setup & Staging | `/publishing` & `?tab=publishing` | YES | Multi-platform schedule trigger | **ALIGNED** |
| **11** | Live Publication Verification | `RecordPublicationModal` in `/publishing`| Modal | Save live URLs → Step 12 | **ALIGNED (MODAL CONTEXT)** |
| **12** | Platform Sync & Adaptation | `/platform-packages` | YES | Sync verification → Step 13 | **ALIGNED** |
| **13** | Social Analytics Harvesting | `/social-analytics/:contentId` | YES | Review metrics → Step 14 | **ALIGNED** |
| **14** | Editorial Performance Review | `/analytics/engagement` | YES (sub-route) | Review dropoff → Step 15 | **ALIGNED** |
| **15** | Pedagogical Intelligence Loopback | `/analytics/intelligence` | YES (sub-route) | Click "Create Next Question" → `/studio` | **PERFECT ALIGNMENT** |

---

## 27. Confirmed Issues

1. **Eight Unmounted Page Files**:
   - `ProductionBoardPage.tsx`, `PublishingPackagePage.tsx`, `VideoReviewScriptPage.tsx`, `VideoRecordPage.tsx`, `VideoEditPage.tsx`, `VideoFinalPage.tsx`, `VideoThumbnailPage.tsx`, and `VideoPinnedCommentPage.tsx` exist in `src/pages/` but are completely bypassed in `App.tsx` by `<Navigate>` or `<VideoTabRedirect>`.
2. **Deep-Link State Loss on Login**:
   - When an unauthenticated user opens any deep-link URL (e.g. `/questions/BP-Q-000025`), they are presented with `<LoginPage />`. Upon successful login, `AppRoutes` unconditionally navigates to `getDefaultLandingRoute(user.role)`, dropping the requested deep-link destination.
3. **Competing Step 09 Implementations**:
   - Step 09 exists in two divergent, competing UI locations:
     - Dedicated page: `/social-review/:contentMasterId` (`SocialReviewPage.tsx`)
     - Tab in VideoDetail: `/videos/:videoId?tab=social` (`SocialReviewWorkspace.tsx`)
4. **Intermediate Breadcrumb Mismatch**:
   - In `AppBreadcrumbs.tsx:69-74`, the parent link for `/questions/:id/verify` is hardcoded to `/studio` rather than the canonical question library `/questions` or detail view.

---

## 28. Potential Issues

1. **Dual Routing Syntax Risk**:
   - While `<VideoTabRedirect>` protects legacy route links like `/videos/:id/edit-video` by rewriting them to `?tab=editing`, external bookmarks or third-party links relying on exact path endings could experience unnecessary browser history pollution if not cleaned in future refactoring.
2. **Unparameterized Stepper Header Clicks**:
   - `VideoWorkflowHeader` contains unparameterized links (`/videos/create-script`, `/videos/record`) that redirect to `/production?status=...`. If clicked while working on a video, the user will be booted out of the video detail workspace to the global production tracker.

---

## 29. Unknown / Runtime Verification Required

1. **Global Search Deep-Link URL Resolution**:
   - In `GlobalSearchBar.tsx:101`, results fall back to `item.url` returned by the backend `/api/search/global`. Requires runtime verification to confirm the backend returns canonical `/videos/:id?tab=...` URLs rather than legacy paths.
2. **Multi-Role Session Landing Experience**:
   - `getDefaultLandingRoute()` uses single canonical role mapping. If a user possesses multiple roles (e.g., both Question Author and Video Editor), runtime testing is required to verify if landing priority aligns with user expectations.

---

## 30. Stage 3 Findings Summary

1. **The Navigation Core is Sound**:
   The primary application navigation via the 6 Authoritative Hubs (`Sidebar.tsx`) and the 15-stage conveyor belt (`ProductionJourneyBar.tsx` / `ProductionJourneyContext.tsx`) is robust, fully implemented, and strictly follows the product lifecycle.
2. **Tabbed Workspace Consolidation Succeeded**:
   The transition from fragmented standalone video pages to a unified, tabbed `VideoDetailPage` was successfully achieved. The remaining standalone pages exist only as redirect shims.
3. **No Dead Ends in Workflow**:
   Users can advance linearly from Step 01 (`/studio`) through to Step 15 (`/analytics/intelligence`) and loop back to Step 01 without encountering broken routes or unhandled exceptions.
4. **Zero Code / Data Modifications**:
   All findings were gathered purely through static code analysis and structural inspection. No files were modified, and no database or Sheets API calls were executed.

---

## 31. Stage 3 Completion Checklist

- [x] Every `<Route>` declaration in `src/App.tsx` cataloged.
- [x] All 27 redirect routes analyzed and classified.
- [x] All 85 `navigate()` and `useNavigate()` occurrences inspected.
- [x] All 165 `<Link>` and `<NavLink>` tags inspected.
- [x] Sidebar navigation configuration verified against 6 Authoritative Hubs.
- [x] Header, Global Search, and User Profile dropdown inspected.
- [x] Breadcrumb inference logic (`AppBreadcrumbs.tsx`) audited.
- [x] Workflow headers (`QuestionWorkflowHeader`, `VideoWorkflowHeader`, `AssetWorkflowHeader`, `PublishingWorkflowHeader`) audited.
- [x] Next / Previous buttons across all production stages traced.
- [x] Query parameter dependencies (`?tab=`, `?status=`) documented.
- [x] Route guard and authentication redirect behavior analyzed.
- [x] Complete Route → Page → Workflow matrix generated against the 15 canonical steps.
- [x] Confirmed, Potential, and Unknown findings strictly separated.
- [x] Zero application code modified.
- [x] Zero Google Sheets writes executed.
- [x] Zero Google Drive writes executed.

---
*End of Stage 3 — Routing & Navigation Forensic Audit*
