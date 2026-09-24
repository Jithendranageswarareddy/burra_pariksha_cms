# STAGE 4 — PAGE & WORKFLOW ARCHITECTURE FORENSIC AUDIT
## Burra Pariksha CMS
**Authoritative Architectural Mapping of Pages, Workspaces, and 15-Step Production Responsibilities**

---

## 1. AUDIT SCOPE & METHODOLOGY

### 1.1 Objective
The central inquiry of Stage 4 is to establish an authoritative, forensic mapping answering:
> *"For one workflow step, there are many pages/workflows. Exactly which page or workspace owns each production responsibility in the codebase?"*

This audit bridges **Product & Workflow Truth** (`01-product-truth.md`), **Repository Inventory** (`02-repository-inventory.md`), and **Routing & Navigation Truth** (`03-routing-navigation-audit.md`) by examining the concrete component implementation of every page in `src/pages/` and workspace in `src/components/`.

### 1.2 Strict Forensic Non-Interference Rules
In accordance with Stage 4 directives:
- **No application code, routing, schemas, or UI were modified**.
- **No Google Sheets or Google Drive writes were executed**.
- **No files were deleted, moved, or renamed**.
- Every finding is categorized into **CONFIRMED** (directly proven by source code), **POTENTIAL** (strong architectural indication requiring runtime verification), or **UNKNOWN** (cannot be statically determined).

---

## 2. SOURCE FILES INSPECTED

### 2.1 Authoritative Baseline Documents
- `01-product-truth.md` (The 15-Step Canonical Production Lifecycle)
- `02-repository-inventory.md` (Forensic Repository Inventory)
- `03-routing-navigation-audit.md` (Routing, Redirect, and Navigation Registry)

### 2.2 Primary Page Source Files (`src/pages/*.tsx`) — 32 Pages
1. `src/pages/QuestionStudioPage.tsx` (1,710 lines)
2. `src/pages/QuestionLibraryPage.tsx` (606 lines)
3. `src/pages/QuestionImprovePage.tsx` (989 lines)
4. `src/pages/QuestionVerifyApprovePage.tsx` (826 lines)
5. `src/pages/QuestionDetailPage.tsx` (952 lines)
6. `src/pages/VideoDetailPage.tsx` (656 lines)
7. `src/pages/VideoCreateScriptPage.tsx` (124 lines)
8. `src/pages/VideoReviewScriptPage.tsx` (744 lines)
9. `src/pages/VideoRecordPage.tsx` (1,064 lines)
10. `src/pages/VideoEditPage.tsx` (855 lines)
11. `src/pages/VideoFinalPage.tsx` (699 lines)
12. `src/pages/VideoThumbnailPage.tsx` (918 lines)
13. `src/pages/VideoPinnedCommentPage.tsx` (593 lines)
14. `src/pages/SocialReviewPage.tsx` (554 lines)
15. `src/pages/PlatformPackagesPage.tsx` (664 lines)
16. `src/pages/PublishingPage.tsx` (802 lines)
17. `src/pages/PublishingPackagePage.tsx` (803 lines)
18. `src/pages/SocialAnalyticsPage.tsx` (1,484 lines)
19. `src/pages/AnalyticsExperiencePage.tsx` (1,149 lines)
20. `src/pages/PlanningPage.tsx` (2,583 lines)
21. `src/pages/ProductionTrackerPage.tsx` (479 lines)
22. `src/pages/ProductionBoardPage.tsx` (859 lines)
23. `src/pages/QueuePage.tsx` (433 lines)
24. `src/pages/MyWorkPage.tsx` (1,083 lines)
25. `src/pages/TeamOperationsPage.tsx` (1,077 lines)
26. `src/pages/ContentMasterPage.tsx` (1,393 lines)
27. `src/pages/Phase23ProductionDashboardPage.tsx` (912 lines)
28. `src/pages/SettingsPage.tsx` (2,537 lines)
29. `src/pages/RecoveryAdminPage.tsx` (2,102 lines)
30. `src/pages/DashboardPage.tsx` (366 lines)
31. `src/pages/LoginPage.tsx` (260 lines)
32. `src/pages/NotFoundPage.tsx` (105 lines)

### 2.3 Workflow Workspace Components (`src/components/*`)
- `src/components/video/ScriptWorkspace.tsx` (1,010 lines)
- `src/components/video/RecordingWorkspace.tsx` (1,024 lines)
- `src/components/video/EditingWorkspace.tsx` (768 lines)
- `src/components/video/FinalReviewWorkspace.tsx` (490 lines)
- `src/components/video/ThumbnailWorkspace.tsx` (953 lines)
- `src/components/video/PinnedCommentWorkspace.tsx` (295 lines)
- `src/components/video/PublishingWorkspace.tsx` (1,023 lines)
- `src/components/social/SocialReviewWorkspace.tsx` (1,118 lines)
- `src/components/production/ProductionJourneyBar.tsx` (291 lines)
- `src/components/questions/QuestionWorkflowHeader.tsx` (164 lines)
- `src/components/video/VideoWorkflowHeader.tsx` (225 lines)
- `src/components/social/AssetWorkflowHeader.tsx` (226 lines)
- `src/components/publishing/PublishingWorkflowHeader.tsx` (232 lines)

### 2.4 Workflow Contexts & Configuration
- `src/contexts/ProductionJourneyContext.tsx` (1,003 lines)
- `src/contexts/AuthContext.tsx` (310 lines)
- `src/config/navigation.ts` (210 lines)
- `src/App.tsx` (204 lines)

---

## 3. COMPLETE PAGE INVENTORY (32 PAGES)

| # | Filename | Component Name | Route(s) Mounting | Reachable? | Primary Responsibility | Step(s) | Inputs | Outputs | State Consumed | State Produced | API / Service Dependencies | Page Type & Classification |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | `QuestionStudioPage.tsx` | `QuestionStudioPage` | `/studio` | Yes | Question AI generation, taxonomy selection & drafting | Step 01 | Topic/Subtopic taxonomy, difficulty, mode | Question candidate, persisted Question draft | Query params (`topicId`, `subtopicId`, `difficulty`), ProductionJourney | Created Question (`BP-Q-######`), Journey state | `apiClient.generateQuestionCandidates()`, `createQuestion()`, `getTopics()` | **Operational Workspace** (Canonical Candidate for Step 01) |
| 2 | `QuestionLibraryPage.tsx` | `QuestionLibraryPage` | `/questions` | Yes | Question catalog browsing, filtering & selection | Step 01 / 02 | Status, topic, search query filters | Selected Question for edit/verify | Query params, Local filter state | URL search params (`status`, `search`) | `apiClient.getQuestions()`, `getTopics()` | **Operational Catalog** (Inspection & selection hub) |
| 3 | `QuestionImprovePage.tsx` | `QuestionImprovePage` | `/questions/:id/improve`, `/questions/improve` | Yes | Human editorial refinement of question & math verification | Step 01 (Aux) | Question record, manual edits | Updated Question draft | Route param `id`, Query `id`, Local form state | Modified question fields, validation status | `apiClient.getQuestionById()`, `updateQuestion()`, `refineQuestionCandidate()` | **Operational Workspace** (Editorial improvement) |
| 4 | `QuestionVerifyApprovePage.tsx` | `QuestionVerifyApprovePage` | `/questions/:id/verify`, `/questions/verify` | Yes | 10-point pedagogical verification, proof audit & approval gate | Step 02 | Question draft, math engine checks | Approved Question, Video queue record (`BP-V-######`) | Route param `id`, Journey context | Status `APPROVED` / `REJECTED`, Queued Video | `apiClient.verifyQuestion()`, `approveQuestion()`, `rejectQuestion()` | **Approval Gate Workspace** (Canonical Candidate for Step 02) |
| 5 | `QuestionDetailPage.tsx` | `QuestionDetailPage` | `/questions/:id` | Yes | Comprehensive question inspector, audit logs, metadata editor | Step 01 / 02 | Question ID | Updated Question metadata | Route param `id`, Journey context | Updated question record, assignments | `apiClient.getQuestionById()`, `updateQuestion()`, `queueVideo()` | **Inspection / Detail Page** (Overlaps with Verify & Improve) |
| 6 | `VideoDetailPage.tsx` | `VideoDetailPage` | `/videos/:videoId` | Yes | Master tabbed video production workspace (Tabs: script, recording, editing, final-review, social, overview, thumbnail, pinned-comment, publishing) | Steps 03, 04, 05, 06, 07, 08, 09, 10, 11 | Video ID, Query param `?tab=` | Sub-workspace actions across production lifecycle | Route param `videoId`, Query param `?tab=`, Journey context | Video status transitions, metadata, assignments | `apiClient.getVideoById()`, `updateVideoStatus()`, `updateVideoMetadata()`, sub-components | **Master Operational Workspace** (Unified Container for Steps 03–11) |
| 7 | `VideoCreateScriptPage.tsx` | `VideoCreateScriptPage` | `/videos/create-script` | Yes (Redirects if videoId present) | Legacy script creation hub; renders picker or redirects | Step 03 | Video list | Redirect to `/videos/:id?tab=script` | Query params (`videoId`, `id`) | Programmatic redirect | `apiClient.getVideos()` | **Legacy Shim / Selection Page** (Redirects to VideoDetail) |
| 8 | `VideoReviewScriptPage.tsx` | `VideoReviewScriptPage` | `/videos/:videoId/script`, `/videos/script` | **No** (Redirected in `App.tsx`) | Legacy script editing and versioning page | Step 03 | Video ID, Script draft | Script updates | Route params, Local form state | Unmounted / Bypassed | `apiClient.getVideoById()`, `getScript()`, `saveScript()` | **Dead / Orphaned Page** (Bypassed by router redirect to `?tab=script`) |
| 9 | `VideoRecordPage.tsx` | `VideoRecordPage` | `/videos/:videoId/record`, `/videos/record` | **No** (Redirected in `App.tsx`) | Legacy recording studio & teleprompter page | Step 04 / 05 | Video ID, Script record | Raw footage upload, Take metadata | Route params, Journey context | Unmounted / Bypassed | `apiClient.getVideoById()`, `uploadVideoFile()` | **Dead / Orphaned Page** (Bypassed by router redirect to `?tab=recording`) |
| 10 | `VideoEditPage.tsx` | `VideoEditPage` | `/videos/:videoId/edit-video`, `/videos/edit-video` | **No** (Redirected in `App.tsx`) | Legacy video editing bay and safe-zone checker | Step 06 | Video ID, Raw footage | Edited video cut Drive URL, status `EDITING_COMPLETE` | Route params, Journey context | Unmounted / Bypassed | `apiClient.getVideoById()`, `updateVideoStatus()` | **Dead / Orphaned Page** (Bypassed by router redirect to `?tab=editing`) |
| 11 | `VideoFinalPage.tsx` | `VideoFinalPage` | `/videos/:videoId/final-video`, `/videos/final-video` | **No** (Redirected in `App.tsx`) | Legacy 4-dimensional QC verification page | Step 07 | Video ID, Edited cut | Final QC approval, status `QC_APPROVED` | Route params, Local QC state | Unmounted / Bypassed | `apiClient.getVideoById()`, `updateVideoStatus()` | **Dead / Orphaned Page** (Bypassed by router redirect to `?tab=final-review`) |
| 12 | `VideoThumbnailPage.tsx` | `VideoThumbnailPage` | `/videos/:videoId/thumbnail`, `/videos/thumbnail` | **No** (Redirected in `App.tsx`) | Legacy thumbnail design & upload page | Step 08 | Video ID, Image files | Thumbnail record & Drive URL | Route params, Local upload state | Unmounted / Bypassed | `apiClient.getThumbnail()`, `uploadThumbnail()` | **Dead / Orphaned Page** (Bypassed by router redirect to `?tab=thumbnail`) |
| 13 | `VideoPinnedCommentPage.tsx` | `VideoPinnedCommentPage` | `/videos/:videoId/pinned-comment`, `/videos/pinned-comment` | **No** (Redirected in `App.tsx`) | Legacy pinned comment drafting & preview page | Step 09 / 10 | Video ID, Solution text | Pinned comment record | Route params, Local form state | Unmounted / Bypassed | `apiClient.getPinnedComment()`, `savePinnedComment()` | **Dead / Orphaned Page** (Bypassed by router redirect to `?tab=pinned-comment`) |
| 14 | `SocialReviewPage.tsx` | `SocialReviewPage` | `/social-review`, `/social-review/:reviewId` | Yes | Dedicated social review queue & 9:16 simulator gate | Step 09 | Question ID, Video ID, Content ID | Approved Social Review Record | Route param `reviewId`, Query `questionId`/`videoId` | Social review approval, one-click copy bundles | `apiClient.getSocialReviewItem()`, `submitSocialReview()`, `getReviews()` | **Dedicated Approval Gate Workspace** (Canonical Candidate for Step 09) |
| 15 | `PlatformPackagesPage.tsx` | `PlatformPackagesPage` | `/platform-packages`, `/platform-packages/:videoId` | Yes | Multi-platform package adaptations (YT, IG, FB) & sync check | Step 12 | Video ID, Content ID, Platform bundles | Verified multi-platform projections | Route param `videoId`, Query `videoId`, Journey context | Platform copy clipboard, projection status | `apiClient.getVideos()`, `getPublishing()`, `getSocialReviewItem()` | **Operational Workspace** (Canonical Candidate for Step 12) |
| 16 | `PublishingPage.tsx` | `PublishingPage` | `/publishing`, `/publishing/:videoId` | Yes | Publishing tracker, platform scheduling, live URL recorder | Step 10 / 11 | Publishing records, Video list | Scheduled posts, Live URLs, status `PUBLISHED` | Query params (`videoId`, `searchQuery`), Local modal states | Live video URLs (YouTube, Instagram, Facebook) | `apiClient.getPublishing()`, `updatePublishing()`, `schedulePublishing()` | **Operational Workspace** (Canonical Candidate for Steps 10 & 11) |
| 17 | `PublishingPackagePage.tsx` | `PublishingPackagePage` | `/publishing-package` | **No** (Redirected in `App.tsx`) | Pre-publish checklist and asset bundle inspector | Step 10 / 12 | Video ID, Asset records | Pre-flight validation | Route params, Asset bundle state | Unmounted / Bypassed | `apiClient.getPublishing()`, `getVideos()` | **Dead / Orphaned Page** (Bypassed by router redirect to `/platform-packages`) |
| 18 | `SocialAnalyticsPage.tsx` | `SocialAnalyticsPage` | `/social-analytics`, `/social-analytics/:contentId` | Yes | Manual metric entry, historical snapshots & audience comments | Step 13 | Content ID (`BP-CNT-######`), Video ID, Publishing ID | Analytics snapshots, comments, comment intelligence | Route param `contentId`, Query params (`videoId`, `publishingId`) | Metric records (Views, Likes, Comments, Retention) | `apiClient.getSocialAnalytics()`, `createSocialAnalytics()`, `analyzeComments()` | **Operational Data Entry & Review Workspace** (Canonical Candidate for Step 13) |
| 19 | `AnalyticsExperiencePage.tsx` | `AnalyticsExperiencePage` | `/analytics`, `/analytics/*` (10 sub-paths) | Yes | Comprehensive performance analytics & AI strategy loopback | Step 14 / 15 | Analytics snapshots, historical trends | Performance insights, Strategy recommendations | Pathname (`/analytics/:tab`), Summary data | Strategy recommendations applied & routed to `/studio` | `apiClient.getSocialAnalyticsSummary()`, `getIntelligence()`, `applyStrategyRecommendation()` | **Master Analytics & Strategy Workspace** (Canonical Candidate for Steps 14 & 15) |
| 20 | `PlanningPage.tsx` | `PlanningPage` | `/planning` | Yes | Curriculum sprints, syllabus batches, gap analysis & radar | Pre-production / Curriculum Planning | Curriculum topics, content batches | Content plans, batch assignments | Tab state (`plans`, `batches`, `coverage`, `gaps`, `radar`), Local form | Content sprint records, batch progress | `apiClient.getContentPlans()`, `getContentBatches()`, `taxonomyService` | **Operational Planning Hub** (Curriculum Strategy) |
| 21 | `ProductionTrackerPage.tsx` | `ProductionTrackerPage` | `/production` | Yes | Production Kanban & tabular tracking of all videos | Pipeline Overview (Steps 03–11) | Video production records, status filters | Selected video navigated to `/videos/:id?tab=...` | URL search params (`status`, `searchQuery`, `priority`) | Filtered video query state | `apiClient.getVideos()`, `getProductionStats()` | **Operational Pipeline Hub** (Global video pipeline monitor) |
| 22 | `ProductionBoardPage.tsx` | `ProductionBoardPage` | `/production-board` | **No** (Redirected in `App.tsx`) | Legacy read-model production board & readiness inspector | Pipeline Overview | Board items | Filtered items | URL search params | Unmounted / Bypassed | `apiClient.getProductionBoard()` | **Dead / Orphaned Page** (Bypassed by router redirect to `/production`) |
| 23 | `QueuePage.tsx` | `QueuePage` | `/queue` | Yes | Rapid filming queue & host task prioritization | Step 04 / Pipeline | Videos ready to film or needing script | Video selection for filming | Local filter state, User identity | Selected video launched into `/videos/:id?tab=recording` | `apiClient.getVideos()`, `getProductionStats()` | **Operational Queue** (Fast host filming dispatcher) |
| 24 | `MyWorkPage.tsx` | `MyWorkPage` | `/my-work` | Yes | Personalized task inbox, blocked alerts & task completion | Team Dispatcher | User assignments, entity links | Assignment status transitions (`IN_PROGRESS`, `DONE`) | Selected work bucket, User ID | Assignment lifecycle updates | `apiClient.getMyWork()`, `updateAssignmentStatus()` | **Operational Task Workspace** (Personal execution console) |
| 25 | `TeamOperationsPage.tsx` | `TeamOperationsPage` | `/team` | Yes | Workload balancing, unassigned work dispatcher, directory | Team Management | All assignments, team capacity | New task assignments, role updates | Active tab (`WORKLOAD`, `UNASSIGNED`, `ALL_ASSIGNMENTS`), Modals | Assignment records, user management | `apiClient.getTeamWorkload()`, `createAssignment()`, `getUsers()` | **Operational Management Hub** (Resource allocation) |
| 26 | `ContentMasterPage.tsx` | `ContentMasterPage` | `/content-masters`, `/content-masters/:id` | Yes | Canonical entity relationship explorer & lifecycle transitions | Content Governance | Content Master ID (`BP-CNT-######`) | Content Master status transitions, relationship audit | Route param `id`, Entity details | Content Master status (`ACTIVE`, `COMPLETED`, `ARCHIVED`) | `apiClient.getContentMasterDetails()`, `transitionStatus()` | **Governance & Relationship Explorer** (Authoritative entity tree) |
| 27 | `Phase23ProductionDashboardPage.tsx` | `Phase23ProductionDashboardPage` | `/production-dashboard` | Yes | Advanced multi-dimensional production search & queues | Pipeline Overview | Search query, queue selection | Filtered production entities | Tab state (`SEARCH`, `QUEUES`, `DASHBOARD`) | Drilldown modal state | `phase23ProductionService.search()`, `getQueues()`, `getMetrics()` | **Inspection & Operational Search Console** (Advanced ops search) |
| 28 | `SettingsPage.tsx` | `SettingsPage` | `/settings` | Yes | Google Sheets health, taxonomy editor, AI config, system health | Admin / System | Sheet schemas, environment config | Schema repairs, taxonomy updates, recovery triggers | Query param `?tab=`, Admin role | Diagnostic and configuration state | `apiClient.getSystemHealth()`, `getTaxonomy()`, `repairSpreadsheet()` | **Technical Admin Workspace** (Configuration & diagnostics) |
| 29 | `RecoveryAdminPage.tsx` | `RecoveryAdminPage` | `/admin/recovery` | Yes | Snapshot history, durable archives, dry-run & granular restore | Admin / System | Backup snapshots, entity IDs | Database restorations, rollback operations | Admin role, Snapshot selection | Restored database records | `apiClient.getRecoveryStatus()`, `restoreSnapshot()`, `createArchive()` | **Technical Admin Console** (Disaster recovery) |
| 30 | `DashboardPage.tsx` | `DashboardPage` | `/dashboard` | Yes | High-level executive KPI overview, recent alerts & quick actions | Executive Overview | Production statistics, recent activity | Navigation to operational hubs | User role, Global stats | Visual summary state | `apiClient.getProductionStats()`, `getRecentActivity()` | **Executive Dashboard** (Non-production monitoring) |
| 31 | `LoginPage.tsx` | `LoginPage` | `/login` | Yes | Role-switching authentication simulator | System Access | Role selector | Authenticated session token | AuthContext state | Logged-in user profile | `authService.login()` | **System Access Surface** (Authentication) |
| 32 | `NotFoundPage.tsx` | `NotFoundPage` | `*` (Catch-all) | Yes | 404 Error handler & fallback navigation | System Fallback | Unmatched URL | Navigation to `/dashboard` | URL pathname | Fallback state | None | **Error Page** (Catch-all) |

---

## 4. COMPLETE WORKFLOW WORKSPACE INVENTORY

### 4.1 Steppers, Workflow Headers, and Journey Bars

| Component | File Path | Business Responsibility Owned | Step Span | Current Usage Status | Overlap / Collision With |
|---|---|---|---|---|---|
| **ProductionJourneyBar** | `src/components/production/ProductionJourneyBar.tsx` | Global 15-stage conveyor orchestration; intelligent Next Action dispatching; prerequisite blocker display. | Steps 01–15 | **ACTIVE & AUTHORITATIVE** | Used on 7 active pages (`QuestionStudioPage`, `QuestionVerifyApprovePage`, `VideoDetailPage`, `PlatformPackagesPage`, etc.). Cleanly aligns with `01-product-truth.md`. |
| **QuestionWorkflowHeader** | `src/components/questions/QuestionWorkflowHeader.tsx` | Question creation stepper (Generate → Library → Improve → Approve). | Steps 01–02 | **LEGACY / LOCAL STEPPER** | Overlaps with `ProductionJourneyBar`. Defines 4 question steps that conflict with the global 15-step model. Used on `QuestionImprovePage`, `QuestionDetailPage`. |
| **VideoWorkflowHeader** | `src/components/video/VideoWorkflowHeader.tsx` | 5-step video stepper (Scripting → Filming → Editing → Review → Social). | Steps 03–07, 09 | **LEGACY / COMPATIBILITY SHIM** | Points to old standalone paths (`/videos/create-script`, `/videos/record`, `/videos/edit-video`, `/videos/final-video`, `/videos/social-packaging`). Kept inside orphaned video pages and shims. |
| **AssetWorkflowHeader** | `src/components/social/AssetWorkflowHeader.tsx` | 3-step asset stepper (Thumbnail → Pinned Comment → Social Review). | Steps 08–09 | **LEGACY / COMPATIBILITY SHIM** | Hardcodes steps 10, 11, 12 from old Phase 8 nomenclature. Points to bypassed routes (`/videos/thumbnail`, `/videos/pinned-comment`). |
| **PublishingWorkflowHeader** | `src/components/publishing/PublishingWorkflowHeader.tsx` | 3-step publishing stepper (Platform Adaptations → Pre-Publish Check → Publish & Links). | Steps 10–12 | **LEGACY / COMPATIBILITY SHIM** | Hardcodes steps 13, 14, 15 from old Phase 8 nomenclature. Points to `/platform-packages`, `/publishing-package` (dead route), and `/publishing`. |

### 4.2 Production Workspaces (Inside `VideoDetailPage` and Standalone)

| Component | File Path | Business Responsibility Owned | Canonical Step | Dual Implementation? | Evidence & Analysis |
|---|---|---|---|---|---|
| **ScriptWorkspace** | `src/components/video/ScriptWorkspace.tsx` | Short-form audience script drafting, teleprompter word counter, speed trick, script versioning, diff viewer, and status transition to `SCRIPT_READY`. | **Step 03** | **No** (Consolidated) | Mounted exclusively inside `VideoDetailPage` under `?tab=script`. Completely supersedes `VideoReviewScriptPage`. |
| **RecordingWorkspace** | `src/components/video/RecordingWorkspace.tsx` | Dual-mode teleprompter, audio/video recording controls, take tracker, raw video asset upload to Google Drive, Drive folder URL linking, and status transition to `RECORDED`. | **Steps 04 & 05** | **No** (Consolidated) | Mounted inside `VideoDetailPage` under `?tab=recording`. Directly co-locates filming execution (Step 04) with raw footage handoff (Step 05). Supersedes `VideoRecordPage`. |
| **EditingWorkspace** | `src/components/video/EditingWorkspace.tsx` | Video editing bay, Shorts Master 6-point pacing checklist, aspect ratio selector, edited cut Drive URL linking, duration verification, and status transition to `EDITED`. | **Step 06** | **No** (Consolidated) | Mounted inside `VideoDetailPage` under `?tab=editing`. Completely supersedes `VideoEditPage`. |
| **FinalReviewWorkspace** | `src/components/video/FinalReviewWorkspace.tsx` | 6-point Master Video QC certification, compliance checklist, editorial notes, rejection with return to editing, and approval transition to `QC_APPROVED`. | **Step 07** | **No** (Consolidated) | Mounted inside `VideoDetailPage` under `?tab=final-review`. Completely supersedes `VideoFinalPage`. |
| **ThumbnailWorkspace** | `src/components/video/ThumbnailWorkspace.tsx` | Curiosity framing text presets, high-CTR headline composer, thumbnail graphic upload to Google Drive, 9:16 vs 16:9 preview toggle, and version history. | **Step 08** | **No** (Consolidated) | Mounted inside `VideoDetailPage` under `?tab=thumbnail`. Completely supersedes `VideoThumbnailPage`. |
| **PinnedCommentWorkspace** | `src/components/video/PinnedCommentWorkspace.tsx` | Solution breakdown drafting, curiosity challenge question composer, pinned comment approval flag, and one-click clipboard copy. | **Step 09 (Aux)** | **Yes** (Overlaps with SocialReviewWorkspace) | Mounted inside `VideoDetailPage` under `?tab=pinned-comment`. Also duplicated in full inside `SocialReviewWorkspace` and `PublishingWorkspace`. |
| **SocialReviewWorkspace** | `src/components/social/SocialReviewWorkspace.tsx` | 9:16 interactive smartphone simulator (YouTube Shorts, Instagram Reels, Facebook Video), safe-zone boundary overlay, tactile one-click copy bundles, AI quality checks, and editorial signoff gate. | **Step 09** | **YES (CRITICAL COLLISION)** | **Dual-Mount**: Mounted inside `SocialReviewPage` (`/social-review/:reviewId`) AND inside `VideoDetailPage` (`/videos/:id?tab=social`). Both perform identical review gate signoffs. |
| **PublishingWorkspace** | `src/components/video/PublishingWorkspace.tsx` | Platform scheduling (YouTube, Instagram, Facebook), live publication URL entry, retry counters, and video status transition to `UPLOADED`. | **Steps 10 & 11** | **YES (COLLISION)** | Mounted inside `VideoDetailPage` (`?tab=publishing`) AND duplicated in functionality by the standalone `PublishingPage.tsx` (`/publishing`). |

---

## 5. PRODUCTION JOURNEY ARCHITECTURE

Forensic inspection of `src/contexts/ProductionJourneyContext.tsx` and `src/components/production/ProductionJourneyBar.tsx` reveals the exact runtime orchestration model:

### 5.1 Context State & Transition Table

| Stage | Context Stage ID | Context Stage Label | Context Default Route | Rendered Page / Workspace | Primary Action Trigger | Next Target Stage & Route | Product Truth Alignment |
|---|---|---|---|---|---|---|---|
| **01** | `question` | `01 Question` | `/studio` | `QuestionStudioPage` | Generate & Save Draft Question | Stage 2 (`/questions/:id/verify`) | **ALIGNED** (Step 01 Question Generation) |
| **02** | `verification` | `02 Verification` | `/questions/verify` | `QuestionVerifyApprovePage` | Pedagogical Verification & Approve | Stage 3 (`/videos/:id?tab=script`) | **ALIGNED** (Step 02 Question Verification) |
| **03** | `script` | `03 Audience Script` | `/studio` (overridden to `/videos/:id?tab=script`) | `VideoDetailPage` (`?tab=script`) | Draft & Approve Audience Script | Stage 4 (`/videos/:id?tab=recording`) | **ALIGNED** (Step 03 Audience Script) |
| **04** | `recording` | `04 Teleprompter & Filming` | `/production` (overridden to `/videos/:id?tab=recording`) | `VideoDetailPage` (`?tab=recording`) | Complete Filming Session | Stage 5 (`/videos/:id?tab=recording`) | **ALIGNED** (Step 04 Teleprompter / Recording) |
| **05** | `raw-video` | `05 Raw Video` | `/production` (overridden to `/videos/:id?tab=recording`) | `VideoDetailPage` (`?tab=recording`) | Upload Raw Footage to Drive | Stage 6 (`/videos/:id?tab=editing`) | **ALIGNED** (Step 05 Raw Footage Handoff) |
| **06** | `editing` | `06 Editing` | `/production` (overridden to `/videos/:id?tab=editing`) | `VideoDetailPage` (`?tab=editing`) | Complete Cuts & Link Drive Cut | Stage 7 (`/videos/:id?tab=final-review`) | **ALIGNED** (Step 06 Editing) |
| **07** | `final-qc` | `07 Final QC` | `/production` (overridden to `/videos/:id?tab=final-review`) | `VideoDetailPage` (`?tab=final-review`) | Certify 6-Point Master QC | Stage 8 (`/videos/:id?tab=thumbnail`) | **ALIGNED** (Step 07 Final QC) |
| **08** | `thumbnail` | `08 Thumbnail` | `/production` (overridden to `/videos/:id?tab=thumbnail`) | `VideoDetailPage` (`?tab=thumbnail`) | Upload Approved Thumbnail | Stage 9 (`/social-review/:contentMasterId`) | **ALIGNED** (Step 08 Thumbnail) |
| **09** | `social-review` | `09 Social Review` | `/social-review` | `SocialReviewPage` (or `VideoDetailPage?tab=social`) | Editorial Signoff on Social Package | Stage 10 (`/videos/:id?tab=publishing`) | **ALIGNED** (Step 09 Social Review) |
| **10** | `publishing-setup` | `10 Publishing Setup` | `/publishing` (overridden to `/videos/:id?tab=publishing`) | `VideoDetailPage` (`?tab=publishing`) or `PublishingPage` | Schedule Release Date & Platform Config | Stage 11 (`/publishing` or `?tab=publishing`) | **ALIGNED** (Step 10 Publishing Setup) |
| **11** | `published` | `11 Published` | `/publishing` | `PublishingPage` or `VideoDetailPage?tab=publishing` | Record Live Platform URLs | Stage 12 (`/platform-packages`) | **ALIGNED** (Step 11 Live Publication) |
| **12** | `platform-sync` | `12 Platform Sync` | `/platform-packages` | `PlatformPackagesPage` | Verify Cross-Platform Projection Sync | Stage 13 (`/social-analytics/:contentId`) | **ALIGNED** (Step 12 Platform Sync) |
| **13** | `analytics` | `13 Analytics` | `/social-analytics` | `SocialAnalyticsPage` | Input Real 24h/7d Metric Snapshots | Stage 14 (`/analytics/engagement`) | **ALIGNED** (Step 13 Social Analytics) |
| **14** | `performance-review` | `14 Performance Review` | `/analytics/engagement` | `AnalyticsExperiencePage` (`tab=engagement`) | Review Dropoff Curves & Comments | Stage 15 (`/analytics/intelligence`) | **ALIGNED** (Step 14 Performance Review) |
| **15** | `insights` | `15 Insights` | `/analytics/intelligence` | `AnalyticsExperiencePage` (`tab=intelligence`) | Generate Pedagogical Strategy & Loop Back | Loop back to Stage 1 (`/studio`) | **ALIGNED** (Step 15 Performance Intelligence) |

### 5.2 Intelligent Next Action Engine
`ProductionJourneyContext` calculates exactly one high-priority forward action via `computeStages()`:
- `nextAction.stageNumber` points directly to the next sequential stage.
- `advanceToNextStage()` executes programmatic navigation using deep-linked identifiers (`videoId`, `questionId`, `contentMasterId`).
- `jumpToStage(n)` evaluates prerequisite blockers (e.g., blocking Step 06 Editing if raw video has not been uploaded in Step 05).
- Stage 15 explicitly features a closed loopback to Stage 01: `getNextStage(15)` returns Stage 1 (`/studio`), and `AnalyticsExperiencePage.handleApplyStrategy()` pre-populates `/studio?topicId=...&difficulty=...`.

---

## 6. VIDEO WORKFLOW DUPLICATION AUDIT

A critical source of past user confusion was the coexistence of standalone video pages and tabbed video pages.

### 6.1 Concrete Duplication & Routing Matrix

| Production Responsibility | Standalone Page (File) | In-Context Workspace (File) | Router Target in `App.tsx` | Status in Production |
|---|---|---|---|---|
| **Step 03: Scripting** | `src/pages/VideoReviewScriptPage.tsx` | `src/components/video/ScriptWorkspace.tsx` in `VideoDetailPage.tsx` | Unconditional redirect to `/videos/:videoId?tab=script` | **Bypassed / Dead Page**; In-context tab owns 100% of live traffic. |
| **Step 04: Filming / Teleprompter** | `src/pages/VideoRecordPage.tsx` | `src/components/video/RecordingWorkspace.tsx` in `VideoDetailPage.tsx` | Unconditional redirect to `/videos/:videoId?tab=recording` | **Bypassed / Dead Page**; In-context tab owns 100% of live traffic. |
| **Step 05: Raw Video Handoff** | `src/pages/VideoRecordPage.tsx` | `src/components/video/RecordingWorkspace.tsx` in `VideoDetailPage.tsx` | Unconditional redirect to `/videos/:videoId?tab=recording` | **Bypassed / Dead Page**; Co-located in `RecordingWorkspace`. |
| **Step 06: Editing Bay** | `src/pages/VideoEditPage.tsx` | `src/components/video/EditingWorkspace.tsx` in `VideoDetailPage.tsx` | Unconditional redirect to `/videos/:videoId?tab=editing` | **Bypassed / Dead Page**; In-context tab owns 100% of live traffic. |
| **Step 07: Final QC** | `src/pages/VideoFinalPage.tsx` | `src/components/video/FinalReviewWorkspace.tsx` in `VideoDetailPage.tsx` | Unconditional redirect to `/videos/:videoId?tab=final-review` | **Bypassed / Dead Page**; In-context tab owns 100% of live traffic. |
| **Step 08: Thumbnail Studio** | `src/pages/VideoThumbnailPage.tsx` | `src/components/video/ThumbnailWorkspace.tsx` in `VideoDetailPage.tsx` | Unconditional redirect to `/videos/:videoId?tab=thumbnail` | **Bypassed / Dead Page**; In-context tab owns 100% of live traffic. |
| **Step 09: Pinned Comment** | `src/pages/VideoPinnedCommentPage.tsx` | `src/components/video/PinnedCommentWorkspace.tsx` in `VideoDetailPage.tsx` | Unconditional redirect to `/videos/:videoId?tab=pinned-comment` | **Bypassed / Dead Page**; In-context tab owns 100% of live traffic. |

### 6.2 Key Architectural Finding: 7 Dead Standalone Video Pages
The router in `src/App.tsx` contains 27 redirect definitions. Specifically:
```tsx
<Route path="/videos/record" element={<Navigate to="/production" replace />} />
<Route path="/videos/:videoId/record" element={<VideoTabRedirect tab="recording" />} />
<Route path="/videos/edit-video" element={<Navigate to="/production" replace />} />
<Route path="/videos/:videoId/edit-video" element={<VideoTabRedirect tab="editing" />} />
<Route path="/videos/final-video" element={<Navigate to="/production" replace />} />
<Route path="/videos/:videoId/final-video" element={<VideoTabRedirect tab="final-review" />} />
<Route path="/videos/thumbnail" element={<Navigate to="/production" replace />} />
<Route path="/videos/:videoId/thumbnail" element={<VideoTabRedirect tab="thumbnail" />} />
```
Because of these router redirects, the standalone page components (`VideoReviewScriptPage`, `VideoRecordPage`, `VideoEditPage`, `VideoFinalPage`, `VideoThumbnailPage`, `VideoPinnedCommentPage`) are **never mounted**. However, they remain in `src/pages/` containing duplicated versions of form logic, teleprompter engines, and API calls.

---

## 7. QUESTION WORKFLOW DUPLICATION AUDIT

| Responsibility | Page | Route | State Handled | Primary Action | Duplicate / Overlap Analysis |
|---|---|---|---|---|---|
| **Question Generation (Step 01)** | `QuestionStudioPage.tsx` | `/studio` | Candidate generation, AI prompt, math proof | Generate, refine, save draft question | **CANONICAL OWNER**. Owns initial drafting and Gemini AI generation. |
| **Question Verification (Step 02)** | `QuestionVerifyApprovePage.tsx` | `/questions/:id/verify`, `/questions/verify` | 10-point pedagogical verification, proof audit, approve/reject | Certify accuracy, queue video (`BP-V-######`) | **CANONICAL OWNER**. Owns pedagogical gatekeeping and video queue creation. |
| **Question Editorial Refinement** | `QuestionImprovePage.tsx` | `/questions/:id/improve` | Human manual editing, taxonomy re-assignment | In-place question modification | **OVERLAPPING WORKSPACE**. Performs manual edits on draft questions. Accessible via `/questions/:id/improve` and `QuestionWorkflowHeader`. |
| **Question Entity Inspection** | `QuestionDetailPage.tsx` | `/questions/:id` | Full question details, audit log, workflow transitions | View history, assign editors, edit fields | **OVERLAPPING DETAIL VIEW**. Contains another full edit form with duplicate taxonomy dropdowns and status transition buttons. |
| **Question Catalog** | `QuestionLibraryPage.tsx` | `/questions` | Question list, status pills, search query | Filter, search, launch into verify or detail | **SELECTION CATALOG**. Valid operational list for selecting questions. |

### Architectural Insight:
Step 01 (`QuestionStudioPage`) and Step 02 (`QuestionVerifyApprovePage`) have completely clear canonical ownership. The overlap exists between `QuestionImprovePage` and `QuestionDetailPage`, both of which offer full-form manual question editing outside the canonical pipeline.

---

## 8. SOCIAL REVIEW & PUBLISHING DUPLICATION AUDIT

### 8.1 Step 09: Social Review Dual Implementation Collision
Step 09 is currently implemented in **two separate live surfaces**:
1. **Dedicated Full-Page Gateway**: `SocialReviewPage.tsx` (`/social-review/:reviewId` or `/social-review?questionId=...`)
   - Embeds `SocialReviewWorkspace`.
   - Features a global review queue banner, filter bar, safe-zone smartphone simulator, copy bars, and editorial approval buttons.
2. **Tabbed Workspace in VideoDetail**: `VideoDetailPage.tsx` (`/videos/:videoId?tab=social`)
   - Also embeds `SocialReviewWorkspace`.
   - Receives `questionId` and `driveFolderUrl` from the parent video record.

**Collision Impact**: A reviewer navigating from `ProductionJourneyBar` on `VideoDetailPage` stays inside `?tab=social`, while a reviewer clicking the sidebar navigation under "Social Review" lands on `SocialReviewPage.tsx`. Both update the same `SocialReviewRecord` via `apiClient.submitSocialReview()`.

### 8.2 Steps 10 & 11: Publishing Setup & Live Publication Collision
Steps 10 and 11 are also implemented in **two live surfaces**:
1. **Publishing Workspace Tab**: `VideoDetailPage.tsx` (`/videos/:videoId?tab=publishing`)
   - Embeds `src/components/video/PublishingWorkspace.tsx`.
   - Allows scheduling publish time, entering YouTube/Instagram/Facebook live URLs, and updating video status to `UPLOADED`.
2. **Dedicated Publishing Hub**: `PublishingPage.tsx` (`/publishing`)
   - Full-page table with quick URL entry inputs, readiness checklists, and modal launchers (`RecordPublicationModal`, `PublishScheduleModal`).
3. **Dead Pre-Publish Page**: `PublishingPackagePage.tsx` (`/publishing-package`)
   - Router unconditionally redirects to `/platform-packages`. The file remains orphaned.

### 8.3 Step 12: Platform Sync & Multi-Platform Adaptation
- **Canonical Owner**: `PlatformPackagesPage.tsx` (`/platform-packages` or `/platform-packages/:videoId`).
- Manages YouTube Shorts, Instagram Reels, and Facebook Video packaging diffs, character limit checks, and projection verification.
- Actively integrated into `ProductionJourneyBar` (`activeStage="PLATFORM_SYNC"`).

---

## 9. ANALYTICS WORKFLOW AUDIT (STEPS 13, 14, 15)

The analytics architecture was audited across `SocialAnalyticsPage.tsx` and `AnalyticsExperiencePage.tsx`.

### 9.1 Separation of Responsibilities

| Production Step | Authoritative Page | Mounted Route | Component State & View | Implementation Status |
|---|---|---|---|---|
| **Step 13: Social Analytics** | `SocialAnalyticsPage.tsx` | `/social-analytics/:contentId` | Real manual metric entry (Views, Likes, Comments, Retention %), snapshot history, audience comments table, and comment sentiment analysis. | **IMPLEMENTED** (Operational manual data entry & history) |
| **Step 14: Performance Review** | `AnalyticsExperiencePage.tsx` | `/analytics/engagement`, `/analytics/retention`, `/analytics/video` | Aggregate retention curves, engagement benchmarks, video comparison charts, and editorial feedback review. | **IMPLEMENTED** (Operational aggregate dashboard) |
| **Step 15: Performance Intelligence** | `AnalyticsExperiencePage.tsx` | `/analytics/intelligence`, `/analytics/strategy` | Gemini AI-powered pedagogical insight generation, difficulty correlation analysis, and content strategy recommendations. | **IMPLEMENTED** (AI strategy generation) |

### 9.2 Verification of the Step 15 → Step 01 Feedback Loop
A critical requirement in `01-product-truth.md` is that Step 15 feeds directly back into Step 01.
**Forensic Proof**:
In `src/pages/AnalyticsExperiencePage.tsx` (lines 301–322):
```tsx
const handleApplyStrategy = async (id: string) => {
  const res = await apiClient.applyStrategyRecommendation(id);
  if (res.success) {
    const rec = strategyRecs.find((r) => r.id === id);
    if (rec) {
      const params = new URLSearchParams({
        topicId: rec.topicId || '',
        subtopicId: rec.subtopicId || '',
        difficulty: rec.difficulty || '',
        questionStyle: rec.questionStyle || '',
        context: rec.hook || '',
      });
      navigate(`/studio?${params.toString()}`);
    }
  }
};
```
And in `src/pages/QuestionStudioPage.tsx` (lines 98–110):
```tsx
const queryTopic = searchParams.get('topicId') || searchParams.get('topic');
const querySubtopic = searchParams.get('subtopicId') || searchParams.get('subtopic');
const queryDifficulty = searchParams.get('difficulty');
```
**Conclusion**: The feedback loop from Step 15 (`AnalyticsExperiencePage`) back to Step 01 (`QuestionStudioPage`) is **FULLY IMPLEMENTED and OPERATIONAL** via structured query parameters.

---

## 10. CONTEXT & STATE DUPLICATION AUDIT

Forensic analysis of the state architecture was conducted across contexts, URL structures, and components.

### 10.1 Workflow State Fragmentation Matrix

| State Concept | Primary Source | Current Owner | Consumers | Secondary / Duplicate Sources | Conflict Risk |
|---|---|---|---|---|---|
| **Active Production Step / Stage** | `ProductionJourneyContext.tsx` | `ProductionJourneyProvider` | `ProductionJourneyBar`, Next Action Engine | 1. URL path (e.g. `/studio`)<br>2. URL query param `?tab=script`<br>3. `VideoDetailPage.activeTab`<br>4. Legacy headers (`VideoWorkflowHeader.currentStep`) | **CONFIRMED**: If URL has `?tab=editing` but context has cached Stage 4 (`recording`), UI displays tab 6 while conveyor shows stage 4 until refreshed. |
| **Active Video Identity** | URL Route Param | `react-router-dom` (`useParams`) | Page components (`VideoDetailPage`, `VideoRecordPage`) | 1. `ProductionJourneyContext.videoId`<br>2. URL query param `?videoId=...` | **POTENTIAL**: Navigating between video pages without updating context can cause `ProductionJourneyBar` to display previous video metadata. |
| **Active Question Identity** | URL Route Param | `react-router-dom` (`useParams`) | `QuestionStudioPage`, `QuestionVerifyApprovePage` | 1. `ProductionJourneyContext.questionId`<br>2. URL query param `?id=...` or `?questionId=...` | **POTENTIAL**: Triple query parameter convention (`id` vs `questionId` vs path param). |
| **Video Production Status** | Google Sheets / Cache | `backend` / `apiClient` | Video detail, trackers, kanban | 1. Component local state `video.status`<br>2. Local optimistic state in workspace | **CONFIRMED**: Local status transition can complete in UI before backend sequence sync finishes if network lags. |
| **Canonical Content Master ID** | `BP-CNT-######` | Google Sheets / Cache | ContentMasterPage, SocialReview, Analytics | 1. `video.contentId`<br>2. `question.contentId`<br>3. `ProductionJourneyContext.contentMasterId` | **POTENTIAL**: Videos without linked ContentMaster fall back to Question ID or Video ID. |

---

## 11. PAGE-STATE VS ROUTE-STATE CONFLICT AUDIT

### 11.1 Case 1: Tab Param vs Video Status Mismatch
- **Location**: `src/pages/VideoDetailPage.tsx`
- **Scenario**: A user opens `/videos/BP-V-000001?tab=final-review`.
- **Condition**: In the backend Google Sheet, `BP-V-000001` has status `SCRIPT_READY`.
- **Behavior**: The page loads and renders `FinalReviewWorkspace` (tab state driven by URL). However, inside `FinalReviewWorkspace`, the master cut Drive URL is empty and raw footage is missing.
- **Classification**: **CONFIRMED**. The page allows arbitrary tab switching regardless of backend lifecycle status, though action buttons enforce prerequisite guards.

### 11.2 Case 2: Deep Link Loss on Login
- **Location**: `src/components/auth/AuthGuard.tsx`
- **Scenario**: An unauthenticated user clicks a deep link (e.g., `/videos/BP-V-000001?tab=editing`).
- **Behavior**: The user is redirected to `/login`. Upon successful authentication, `LoginPage.tsx` redirects the user to `getDefaultLandingRoute(user.role)` (e.g., `/dashboard` or `/studio`), completely dropping the target deep link.
- **Classification**: **CONFIRMED**.

### 11.3 Case 3: Dual Parameter Inconsistency (`id` vs `questionId`)
- **Location**: `QuestionImprovePage.tsx` and `QuestionVerifyApprovePage.tsx`
- **Scenario**: URL can be `/questions/BP-Q-000001/verify`, `/questions/verify?id=BP-Q-000001`, or `/questions/verify?questionId=BP-Q-000001`.
- **Behavior**: Components implement fallback chains: `const activeQuestionId = id || searchParams.get('questionId') || searchParams.get('id') || '';`.
- **Classification**: **CONFIRMED**. While functional due to defensive code, this represents parameter fragmentation.

---

## 12. WRONG PAGE / WRONG RESPONSIBILITY AUDIT

| Case ID | Symptom / Inconsistency | Files Involved | Forensic Root Cause | Classification |
|---|---|---|---|---|
| **WPR-01** | Stage 05 (Raw Video Handoff) has no dedicated page or tab. | `ProductionJourneyContext.tsx`, `VideoDetailPage.tsx`, `RecordingWorkspace.tsx` | Stage 05 is mapped to route `/videos/:videoId?tab=recording`. It is co-located inside `RecordingWorkspace` as a file upload card rather than having its own dedicated workspace. | **CONFIRMED** |
| **WPR-02** | `/publishing-package` exists as a file and route but renders nothing. | `PublishingPackagePage.tsx`, `App.tsx` | `App.tsx` redirects `/publishing-package` to `/platform-packages`. The 803-line `PublishingPackagePage` component is dead code. | **CONFIRMED** |
| **WPR-03** | Production Board route `/production-board` redirects to `/production`. | `ProductionBoardPage.tsx`, `App.tsx` | `App.tsx` redirects `/production-board` to `/production`. The 859-line `ProductionBoardPage` component is dead code. | **CONFIRMED** |
| **WPR-04** | Breadcrumb for `/platform-packages` says "Publishing Package". | `src/design-system/components/AppBreadcrumbs.tsx` | Breadcrumb inference hardcodes `/platform-packages` to "Publishing Package" instead of "Platform Adaptations". | **CONFIRMED** |
| **WPR-05** | Question Improve page is separate from Question Studio. | `QuestionStudioPage.tsx`, `QuestionImprovePage.tsx` | `QuestionStudioPage` creates and refines candidates during generation; `QuestionImprovePage` performs post-draft human edits. This splits Step 01 drafting across two distinct pages. | **CONFIRMED** |

---

## 13. LEGACY WORKFLOW SYSTEMS INVENTORY

The audit identified **4 distinct legacy workflow systems** remaining in the codebase:

| Legacy System | Files Involved | Original Purpose | Current Replacement | Risk / Overhead |
|---|---|---|---|---|
| **Legacy Standalone Video Pages** | 1. `VideoReviewScriptPage.tsx`<br>2. `VideoRecordPage.tsx`<br>3. `VideoEditPage.tsx`<br>4. `VideoFinalPage.tsx`<br>5. `VideoThumbnailPage.tsx`<br>6. `VideoPinnedCommentPage.tsx`<br>7. `VideoCreateScriptPage.tsx` | Standalone individual route for every video production phase. | Unified `VideoDetailPage.tsx` tabbed workspace (`?tab=...`). | **HIGH CODE DEBT**: 5,000+ lines of unmounted code maintaining duplicate copies of production forms and logic. |
| **Legacy Workflow Stepper Headers** | 1. `VideoWorkflowHeader.tsx`<br>2. `AssetWorkflowHeader.tsx`<br>3. `PublishingWorkflowHeader.tsx`<br>4. `QuestionWorkflowHeader.tsx` | Fragmented 3-to-5 step local navigation bars above individual phase pages. | Global `ProductionJourneyBar.tsx` (15-stage unified conveyor). | **NAVIGATION MISMATCH**: Headers link to deprecated standalone paths instead of canonical tabbed URLs. |
| **Legacy Read-Model Production Board** | `src/pages/ProductionBoardPage.tsx` | Dedicated read-model table for production readiness auditing. | `src/pages/ProductionTrackerPage.tsx` (`/production`). | **DEAD CODE**: 859 lines unmounted due to router redirect in `App.tsx`. |
| **Legacy Publishing Package Page** | `src/pages/PublishingPackagePage.tsx` | Standalone checklist for pre-publish asset readiness. | `src/pages/PlatformPackagesPage.tsx` (`/platform-packages`). | **DEAD CODE**: 803 lines unmounted due to router redirect in `App.tsx`. |

---

## 14. TECHNICAL PAGE EXPOSURE AUDIT

The repository contains several technical surfaces. This section audits whether they represent intentional administrative tools or accidental exposure of technical internals:

| Page / Component | Route | Target Audience | Primary Function | Nature of Exposure |
|---|---|---|---|---|
| **RecoveryAdminPage** | `/admin/recovery` | System Administrators | Snapshot restoration, durable archives, dry-run simulations, granular rollback. | **INTENTIONAL ADMIN SURFACE**. Strictly guarded by `UserRole.ADMIN`. |
| **SettingsPage** | `/settings` (Tabs: recovery, integrity, sheets, taxonomy, ai, drive, publishing) | Administrators & Content Managers | Google Sheets health diagnostics, schema repairs, taxonomy configuration, API diagnostics. | **INTENTIONAL ADMIN SURFACE**. Recovery and Integrity tabs restricted to `UserRole.ADMIN`. |
| **Phase23ProductionDashboardPage** | `/production-dashboard` | Operations Leads | Multi-dimensional search across questions, scripts, videos, reviews; queue dispatcher. | **OPERATIONAL WORKSPACE**. Advanced operations tool; not technical internal noise. |
| **ContentMasterPage** | `/content-masters/:id` | Content Governance Leads | Authoritative entity graph inspector linking Question ↔ Video ↔ Assets ↔ Publishing ↔ Analytics. | **OPERATIONAL GOVERNANCE SURFACE**. Essential for multi-entity relationship auditing. |

---

## 15. 15-STEP CANONICAL PAGE MAP

This table represents the core authoritative deliverable of Stage 4. Every step in the 15-step production lifecycle is mapped to its canonical page candidate, route, responsible role, primary action, and completion conditions.

| Step | Business Responsibility | Canonical Page Candidate | Canonical Route | Canonical Workflow State | Responsible Role | Entry Conditions | Primary Action | Completion Condition | Next Step | Confidence |
|---|---|---|---|---|---|---|---|---|---|---|
| **01** | **Question Generation** | `QuestionStudioPage.tsx` | `/studio` | `DRAFT` | Content Creator / Scriptwriter | Topic/Subtopic selected or strategy recommendation loaded | Generate AI candidate, verify math proof, save draft | Question record created (`BP-Q-######`) in status `DRAFT` | Step 02 | **CONFIRMED** |
| **02** | **Question Verification** | `QuestionVerifyApprovePage.tsx` | `/questions/:id/verify` | `IN_REVIEW` → `APPROVED` | SME Reviewer | Question draft exists in status `DRAFT` or `IN_REVIEW` | Execute 10-point pedagogical audit, proof solution, certify | Question status = `APPROVED`, Video queued (`BP-V-######`) in status `QUEUED` | Step 03 | **CONFIRMED** |
| **03** | **Audience Script** | `VideoDetailPage.tsx` (`ScriptWorkspace`) | `/videos/:id?tab=script` | `SCRIPT_REQUIRED` → `SCRIPT_READY` | Scriptwriter / Host | Question approved; Video queued | Compose hook, problem statement, speed trick, teleprompter text | Script saved & marked ready; Video status = `SCRIPT_READY` | Step 04 | **CONFIRMED** |
| **04** | **Recording** | `VideoDetailPage.tsx` (`RecordingWorkspace`) | `/videos/:id?tab=recording` | `RECORDING` | Presenter / Host | Video status = `SCRIPT_READY`; Script finalized | Rehearse with teleprompter, record video takes | Host filming session completed; Video status = `RECORDING` | Step 05 | **CONFIRMED** |
| **05** | **Raw Footage Handoff** | `VideoDetailPage.tsx` (`RecordingWorkspace`) | `/videos/:id?tab=recording` | `RECORDING` → `RECORDED` | Presenter / Production Assistant | Filming completed; Raw video file or Drive URL ready | Upload raw video to Drive or link Google Drive footage folder | Raw footage linked; Video status = `RECORDED` | Step 06 | **CONFIRMED** |
| **06** | **Editing** | `VideoDetailPage.tsx` (`EditingWorkspace`) | `/videos/:id?tab=editing` | `EDITING` → `EDITED` | Video Editor | Raw footage uploaded (`RECORDED`) | Apply cuts, motion graphics, captions, verify safe zone | Edited master cut Drive URL linked; Video status = `EDITED` | Step 07 | **CONFIRMED** |
| **07** | **Final QC** | `VideoDetailPage.tsx` (`FinalReviewWorkspace`) | `/videos/:id?tab=final-review` | `UNDER_REVIEW` → `QC_APPROVED` | Quality Lead / SME Reviewer | Edited video cut submitted (`EDITED`) | Audit 6-point QC standards (audio, text, safe zone, answer key) | 6 QC points certified; Video status = `QC_APPROVED` | Step 08 | **CONFIRMED** |
| **08** | **Thumbnail** | `VideoDetailPage.tsx` (`ThumbnailWorkspace`) | `/videos/:id?tab=thumbnail` | `THUMBNAIL_REQUIRED` → `THUMBNAIL_READY` | Thumbnail Designer | Script approved and video cut in QC | Design high-CTR curiosity framing graphic, upload to Drive | Approved thumbnail graphic linked in Google Drive | Step 09 | **CONFIRMED** |
| **09** | **Social Review** | `SocialReviewPage.tsx` | `/social-review/:reviewId` | `PENDING_REVIEW` → `APPROVED` | Content Manager | Video passed Final QC (`QC_APPROVED`); Assets ready | Audit 9:16 simulator, safe zones, copy, approve social bundle | Social Review Record status = `APPROVED` | Step 10 | **CONFIRMED** |
| **10** | **Publishing Setup** | `PublishingPage.tsx` | `/publishing` | `SCHEDULED` | Social Media Manager | Social Review approved; Video QC approved | Configure release schedule, select platforms, copy metadata | Scheduled date/time saved for all target platforms | Step 11 | **CONFIRMED** |
| **11** | **Published / Live Verification** | `PublishingPage.tsx` | `/publishing` | `UPLOADED` / `PUBLISHED` | Social Media Manager | Publication time reached; Video posted to platforms | Record live URLs (YouTube Shorts, IG Reels, FB Video) | Live platform URLs verified; Video status = `UPLOADED` | Step 12 | **CONFIRMED** |
| **12** | **Platform Sync / Package** | `PlatformPackagesPage.tsx` | `/platform-packages/:videoId` | `SYNC_VERIFIED` | Social Media Manager | Video live on at least one platform | Verify metadata adaptations across YouTube, IG, FB | Cross-platform projections verified and synced | Step 13 | **CONFIRMED** |
| **13** | **Social Analytics** | `SocialAnalyticsPage.tsx` | `/social-analytics/:contentId` | `METRICS_RECORDED` | Performance Analyst | Content live for >= 24 hours | Input views, likes, shares, retention %, and audience comments | Analytical snapshot persisted in analytics database | Step 14 | **CONFIRMED** |
| **14** | **Performance Review** | `AnalyticsExperiencePage.tsx` | `/analytics/engagement` | `REVIEWED` | Performance Lead / Content Manager | Analytical snapshots recorded | Evaluate retention curves, answer distribution, drop-offs | Performance assessment recorded | Step 15 | **CONFIRMED** |
| **15** | **Performance Intelligence** | `AnalyticsExperiencePage.tsx` | `/analytics/intelligence` | `STRATEGY_GENERATED` | Pedagogical Lead / Content Manager | Performance reviews completed | Review AI insights, generate strategy recommendations, loop to `/studio` | Strategy recommendation applied; Redirects to Step 01 (`/studio`) | Step 01 | **CONFIRMED** |

---

## 16. RESPONSIBILITY COLLISION MATRIX

| Production Responsibility | Surface 1 | Surface 2 | Surface 3 | Collision Type | Forensic Evidence & Details |
|---|---|---|---|---|---|
| **Scripting (Step 03)** | `VideoDetailPage?tab=script` | `VideoReviewScriptPage` | `VideoCreateScriptPage` | **LEGACY ALIAS / DUPLICATE** | `ScriptWorkspace` in `VideoDetailPage` is active; `VideoReviewScriptPage` is bypassed by router; `VideoCreateScriptPage` is a legacy selector that redirects. |
| **Filming (Step 04)** | `VideoDetailPage?tab=recording` | `VideoRecordPage` | `QueuePage` | **PAGE VS TAB / ALIAS** | `RecordingWorkspace` in `VideoDetailPage` is active; `VideoRecordPage` is bypassed by router; `QueuePage` is a selection queue launching into `?tab=recording`. |
| **Raw Video Handoff (Step 05)** | `VideoDetailPage?tab=recording` | `VideoRecordPage` | — | **CO-LOCATED SUB-STEP** | No separate tab exists for Step 05; it is co-located inside the recording workspace. |
| **Editing (Step 06)** | `VideoDetailPage?tab=editing` | `VideoEditPage` | — | **LEGACY ALIAS** | `EditingWorkspace` in `VideoDetailPage` is active; `VideoEditPage` is bypassed by router. |
| **Final QC (Step 07)** | `VideoDetailPage?tab=final-review` | `VideoFinalPage` | — | **LEGACY ALIAS** | `FinalReviewWorkspace` in `VideoDetailPage` is active; `VideoFinalPage` is bypassed by router. |
| **Thumbnail (Step 08)** | `VideoDetailPage?tab=thumbnail` | `VideoThumbnailPage` | — | **LEGACY ALIAS** | `ThumbnailWorkspace` in `VideoDetailPage` is active; `VideoThumbnailPage` is bypassed by router. |
| **Social Review (Step 09)** | `SocialReviewPage` (`/social-review`) | `VideoDetailPage?tab=social` | — | **DUPLICATE LIVE WORKSPACE** | Both surfaces embed `SocialReviewWorkspace` and can execute editorial approval. Navigation paths diverge between sidebar and journey bar. |
| **Publishing Setup (Step 10)** | `PublishingPage` (`/publishing`) | `VideoDetailPage?tab=publishing` | `PublishingPackagePage` | **DUPLICATE LIVE WORKSPACE / DEAD PAGE** | `PublishingPage` manages table & modals; `VideoDetailPage?tab=publishing` manages single-video publishing; `PublishingPackagePage` is dead code. |
| **Published (Step 11)** | `PublishingPage` (`/publishing`) | `VideoDetailPage?tab=publishing` | — | **DUPLICATE LIVE WORKSPACE** | Live URLs can be entered on both the standalone publishing page and inside the video detail publishing tab. |
| **Question Editing (Aux)** | `QuestionImprovePage` | `QuestionDetailPage` | `QuestionStudioPage` | **DUPLICATE EDIT FORM** | Full question editing form implemented in both `QuestionImprovePage` and `QuestionDetailPage`. |

---

## 17. PAGE OWNERSHIP MATRIX

| Page File | Primary Responsibility | Secondary Responsibility | Workflow Step(s) | Canonical Candidate? | Duplicate / Overlap Of | Current Status |
|---|---|---|---|---|---|---|
| `QuestionStudioPage.tsx` | AI Question Generation & Drafting | Real-world hook & taxonomy selection | 01 | **YES** | None | **ACTIVE** |
| `QuestionLibraryPage.tsx` | Question Catalog Browsing & Filter | Status audit & selection | 01, 02 | No (Catalog Hub) | None | **ACTIVE** |
| `QuestionImprovePage.tsx` | Human Editorial Refinement | Math validation checks | 01 (Aux) | No | `QuestionDetailPage.tsx` | **ACTIVE (OVERLAPPING)** |
| `QuestionVerifyApprovePage.tsx` | 10-Point Pedagogical Verification | Video Queue Creation | 02 | **YES** | None | **ACTIVE** |
| `QuestionDetailPage.tsx` | Question Inspection & Audit Logs | Assignment & Metadata editing | 01, 02 | No (Inspection Page) | `QuestionImprovePage.tsx` | **ACTIVE (OVERLAPPING)** |
| `VideoDetailPage.tsx` | Unified Video Production Workspace | Script, Film, Edit, QC, Thumb, Publish | 03, 04, 05, 06, 07, 08, 10, 11 | **YES** | Standalone Video Pages | **ACTIVE (CANONICAL CONTAINER)** |
| `VideoCreateScriptPage.tsx` | Script Video Picker | Redirect to `?tab=script` | 03 | No (Redirect Shim) | `VideoDetailPage.tsx` | **LEGACY SHIM** |
| `VideoReviewScriptPage.tsx` | Script Review & Versioning | Hook & solution editing | 03 | No | `VideoDetailPage.tsx` | **ORPHANED / DEAD** |
| `VideoRecordPage.tsx` | Filming & Teleprompter | Raw video upload | 04, 05 | No | `VideoDetailPage.tsx` | **ORPHANED / DEAD** |
| `VideoEditPage.tsx` | Video Editing Bay | Safe zone & pacing check | 06 | No | `VideoDetailPage.tsx` | **ORPHANED / DEAD** |
| `VideoFinalPage.tsx` | Final QC Certification | 4-point QC matrix | 07 | No | `VideoDetailPage.tsx` | **ORPHANED / DEAD** |
| `VideoThumbnailPage.tsx` | Thumbnail Design & Upload | Drive asset sync | 08 | No | `VideoDetailPage.tsx` | **ORPHANED / DEAD** |
| `VideoPinnedCommentPage.tsx` | Pinned Comment Drafting | Solution breakdown | 09 (Aux) | No | `VideoDetailPage.tsx` | **ORPHANED / DEAD** |
| `SocialReviewPage.tsx` | Social Package Review & 9:16 Simulator | Platform copy bundles | 09 | **YES** | `VideoDetailPage?tab=social` | **ACTIVE (CANONICAL GATE)** |
| `PlatformPackagesPage.tsx` | Multi-Platform Package Adaptations | Cross-platform sync verification | 12 | **YES** | None | **ACTIVE** |
| `PublishingPage.tsx` | Publishing Tracker & URL Entry | Platform scheduling | 10, 11 | **YES** | `VideoDetailPage?tab=publishing` | **ACTIVE** |
| `PublishingPackagePage.tsx` | Pre-flight Publishing Check | Asset checklist | 10, 12 | No | `PlatformPackagesPage.tsx` | **ORPHANED / DEAD** |
| `SocialAnalyticsPage.tsx` | Manual Metric Entry & Snapshots | Audience comments intelligence | 13 | **YES** | None | **ACTIVE** |
| `AnalyticsExperiencePage.tsx` | Performance Review & AI Insights | Strategy recommendation loopback | 14, 15 | **YES** | None | **ACTIVE** |
| `PlanningPage.tsx` | Curriculum Planning & Batches | Gap analysis & similarity radar | Pre-Prod | Yes (Planning Hub) | None | **ACTIVE** |
| `ProductionTrackerPage.tsx` | Pipeline Kanban & Tabular Tracking | Filter & video dispatcher | Pipeline | Yes (Pipeline Hub) | `ProductionBoardPage.tsx` | **ACTIVE** |
| `ProductionBoardPage.tsx` | Read-Model Production Board | Readiness inspection | Pipeline | No | `ProductionTrackerPage.tsx` | **ORPHANED / DEAD** |
| `QueuePage.tsx` | Filming Task Dispatcher | Priority host queue | 04 | No (Queue Hub) | `ProductionTrackerPage.tsx` | **ACTIVE** |
| `MyWorkPage.tsx` | Personal Work Inbox | Blocked task reporting | Dispatcher | Yes (Personal Hub) | None | **ACTIVE** |
| `TeamOperationsPage.tsx` | Team Workload Balancing | Task assignment & user admin | Management | Yes (Management Hub) | None | **ACTIVE** |
| `ContentMasterPage.tsx` | Content Master Graph Explorer | Lifecycle state transitions | Governance | Yes (Governance Hub) | None | **ACTIVE** |
| `Phase23ProductionDashboardPage.tsx` | Production Search & Queues | Drilldown inspector | Ops Search | Yes (Ops Console) | None | **ACTIVE** |
| `SettingsPage.tsx` | System Diagnostics & Config | Sheets repair, taxonomy | Admin | Yes (System Hub) | None | **ACTIVE** |
| `RecoveryAdminPage.tsx` | Disaster Recovery & Rollback | Snapshot restoration | Admin | Yes (System Hub) | None | **ACTIVE** |
| `DashboardPage.tsx` | Executive Dashboard | KPI overview | Executive | Yes (Executive Hub) | None | **ACTIVE** |
| `LoginPage.tsx` | Role Authentication Simulator | Session creation | Auth | Yes (Auth Surface) | None | **ACTIVE** |
| `NotFoundPage.tsx` | 404 Catch-All Handler | Fallback routing | Fallback | Yes (Error Page) | None | **ACTIVE** |

---

## 18. WORKFLOW STATE MATRIX

| Step | UI State Concept | URL State | Context State (`ProductionJourneyContext`) | Backend Entity State (`VideoProductionStatus` / `QuestionStatus`) | Agreement Status | Potential Conflict / Gap |
|---|---|---|---|---|---|---|
| **01** | Candidate form inputs | `/studio` | Stage 1 (`question`) | `Question.status = DRAFT` | **ALIGNED** | Query params (`topicId`, `subtopicId`) populate initial form correctly. |
| **02** | 10-point audit checklist | `/questions/:id/verify` | Stage 2 (`verification`) | `Question.status = IN_REVIEW` → `APPROVED` | **ALIGNED** | Video is automatically queued in backend upon approval. |
| **03** | Teleprompter script editor | `/videos/:id?tab=script` | Stage 3 (`script`) | `Video.status = SCRIPT_REQUIRED` → `SCRIPT_READY` | **ALIGNED** | Script versioning tracks changes cleanly in backend. |
| **04** | Teleprompter controls | `/videos/:id?tab=recording` | Stage 4 (`recording`) | `Video.status = SCRIPT_READY` → `RECORDING` | **ALIGNED** | Status transitions cleanly to `RECORDING` on filming start. |
| **05** | Raw video upload card | `/videos/:id?tab=recording` | Stage 5 (`raw-video`) | `Video.status = RECORDING` → `RECORDED` | **PARTIAL** | Co-located with Step 04; shares `?tab=recording`. |
| **06** | 6-point pacing checklist | `/videos/:id?tab=editing` | Stage 6 (`editing`) | `Video.status = RECORDED` → `EDITING` → `EDITED` | **ALIGNED** | Links edited master cut Google Drive URL. |
| **07** | 6-point QC certification | `/videos/:id?tab=final-review` | Stage 7 (`final-qc`) | `Video.status = EDITED` → `QC_APPROVED` | **ALIGNED** | Rejection transitions video back to `EDITING`. |
| **08** | Thumbnail upload & presets | `/videos/:id?tab=thumbnail` | Stage 8 (`thumbnail`) | `Video.thumbnailId` exists; Status = `THUMBNAIL_READY` | **ALIGNED** | Thumbnail Drive URL persisted in `THUMBNAILS` worksheet. |
| **09** | 9:16 simulator & copy bars | `/social-review/:reviewId` or `?tab=social` | Stage 9 (`social-review`) | `SocialReviewRecord.status = APPROVED` | **CONFLICT RISK** | Dual URLs (`/social-review/:id` vs `/videos/:id?tab=social`). |
| **10** | Release schedule form | `/publishing` or `?tab=publishing` | Stage 10 (`publishing-setup`) | `Publishing.status = SCHEDULED` | **CONFLICT RISK** | Dual URLs (`/publishing` vs `/videos/:id?tab=publishing`). |
| **11** | Live URL inputs | `/publishing` or `?tab=publishing` | Stage 11 (`published`) | `Video.status = UPLOADED` / `PUBLISHED` | **CONFLICT RISK** | Dual URLs (`/publishing` vs `/videos/:id?tab=publishing`). |
| **12** | Projection diff viewer | `/platform-packages/:videoId` | Stage 12 (`platform-sync`) | `PlatformPackageProjection.status = SYNCED` | **ALIGNED** | Single canonical route `/platform-packages`. |
| **13** | Metric snapshot forms | `/social-analytics/:contentId` | Stage 13 (`analytics`) | `SocialAnalyticsRecord` persisted | **ALIGNED** | Isolated in separate analytics repository. |
| **14** | Aggregate retention curves | `/analytics/engagement` | Stage 14 (`performance-review`) | Read-only analytics aggregate queries | **ALIGNED** | Read-only view over recorded snapshots. |
| **15** | AI strategy recommendations | `/analytics/intelligence` | Stage 15 (`insights`) | `ContentStrategyRecommendation.status = APPLIED` | **ALIGNED** | Closed feedback loop redirects to `/studio` with query parameters. |

---

## 19. ROUTE → PAGE → WORKFLOW MATRIX

This matrix correlates the primary active routes with their rendered page components, responsible steps, and architectural classifications:

| Route Path | Mounted Page Component | Primary Production Step | Lifecycle State | Classification |
|---|---|---|---|---|
| `/studio` | `QuestionStudioPage` | Step 01 | `DRAFT` | **CANONICAL WORKSPACE** |
| `/questions` | `QuestionLibraryPage` | Steps 01–02 | Catalog | **OPERATIONAL CATALOG** |
| `/questions/:id/improve` | `QuestionImprovePage` | Step 01 (Aux) | `DRAFT` | **OPERATIONAL WORKSPACE (AUX)** |
| `/questions/:id/verify` | `QuestionVerifyApprovePage` | Step 02 | `IN_REVIEW` → `APPROVED` | **CANONICAL GATEWAY** |
| `/questions/:id` | `QuestionDetailPage` | Steps 01–02 | Inspection | **OPERATIONAL DETAIL** |
| `/videos/:videoId` | `VideoDetailPage` | Steps 03–08, 10–11 | Multiple | **MASTER UNIFIED WORKSPACE** |
| `/social-review` | `SocialReviewPage` | Step 09 | `PENDING_REVIEW` | **CANONICAL GATEWAY** |
| `/social-review/:reviewId` | `SocialReviewPage` | Step 09 | `APPROVED` | **CANONICAL GATEWAY** |
| `/platform-packages` | `PlatformPackagesPage` | Step 12 | `SYNC_VERIFIED` | **CANONICAL WORKSPACE** |
| `/publishing` | `PublishingPage` | Steps 10–11 | `SCHEDULED` / `UPLOADED` | **CANONICAL WORKSPACE** |
| `/social-analytics` | `SocialAnalyticsPage` | Step 13 | `METRICS_RECORDED` | **CANONICAL WORKSPACE** |
| `/analytics` (and sub-paths) | `AnalyticsExperiencePage` | Steps 14–15 | `REVIEWED` / `STRATEGY` | **CANONICAL WORKSPACE** |
| `/production` | `ProductionTrackerPage` | Pipeline Hub | Overview | **OPERATIONAL PIPELINE HUB** |
| `/planning` | `PlanningPage` | Pre-Production | Planning | **OPERATIONAL PLANNING HUB** |
| `/my-work` | `MyWorkPage` | Dispatcher | Tasks | **PERSONAL INBOX** |
| `/team` | `TeamOperationsPage` | Management | Capacity | **MANAGEMENT HUB** |
| `/content-masters/:id` | `ContentMasterPage` | Governance | Lifecycle | **GOVERNANCE HUB** |
| `/settings` | `SettingsPage` | System | Health | **ADMIN WORKSPACE** |
| `/admin/recovery` | `RecoveryAdminPage` | System | Disaster Recovery | **ADMIN CONSOLE** |

---

## 20. WRONG-RENDERING INVESTIGATION

A specific issue under audit investigation is:
> *"A page displays another workflow's content."*

### 20.1 Forensic Diagnosis & Identified Mechanisms
Static inspection revealed the exact structural causes of this symptom:

1. **Shared Master Container with Silent Tab Fallback**:
   - `VideoDetailPage.tsx` renders 9 different workspaces depending on `?tab=...`.
   - If a URL parameter is misspelled (e.g., `?tab=recrod` or `?tab=edit`), line 70 defaults unconditionally to `'script'`:
     ```tsx
     const [activeTab, setActiveTab] = useState<'script' | ...>('script');
     ```
   - **Result**: A user attempting to navigate to editing sees the Scripting workspace without any error notification.

2. **Redirects to Parent Hub Losing Entity Context**:
   - In `src/App.tsx`, routes like `/videos/record` or `/videos/edit-video` (without an ID) redirect to `/production`.
   - If a user had an active recording session and clicked a legacy filmer link, they are dumped onto the production table rather than their active video.

3. **Dual Mount of SocialReviewWorkspace**:
   - `SocialReviewWorkspace` renders inside `SocialReviewPage` AND `VideoDetailPage`.
   - When rendered in `VideoDetailPage?tab=social`, the component uses `video.questionId` to fetch data. If the video record's `questionId` is missing or mismatched, the workspace displays empty state or errors while the parent page shows video details.

4. **ProductionJourneyBar Active Stage Hardcoding**:
   - Several pages hardcode `activeStage` prop on `<ProductionJourneyBar activeStage="PLATFORM_SYNC" />`.
   - If a user opens `PlatformPackagesPage` for a video that is only at Step 04 (Filming), the top journey bar highlights Step 12 while the lower content shows that assets are missing.

---

## 21. 15-STEP OWNERSHIP COMPLETENESS CHECK

| Step | Product Truth Step Name | Canonical Owner Component | Canonical Route | Ownership Completeness |
|---|---|---|---|---|
| **Step 01** | Question Generation | `QuestionStudioPage.tsx` | `/studio` | **FULLY OWNED** |
| **Step 02** | Question Verification | `QuestionVerifyApprovePage.tsx` | `/questions/:id/verify` | **FULLY OWNED** |
| **Step 03** | Script / Teleprompter | `VideoDetailPage.tsx` (`ScriptWorkspace`) | `/videos/:id?tab=script` | **FULLY OWNED** |
| **Step 04** | Recording | `VideoDetailPage.tsx` (`RecordingWorkspace`) | `/videos/:id?tab=recording` | **FULLY OWNED** |
| **Step 05** | Raw Footage Handoff | `VideoDetailPage.tsx` (`RecordingWorkspace`) | `/videos/:id?tab=recording` | **PARTIALLY OWNED** (Co-located in Step 04) |
| **Step 06** | Editing | `VideoDetailPage.tsx` (`EditingWorkspace`) | `/videos/:id?tab=editing` | **FULLY OWNED** |
| **Step 07** | Final QC | `VideoDetailPage.tsx` (`FinalReviewWorkspace`) | `/videos/:id?tab=final-review` | **FULLY OWNED** |
| **Step 08** | Thumbnail | `VideoDetailPage.tsx` (`ThumbnailWorkspace`) | `/videos/:id?tab=thumbnail` | **FULLY OWNED** |
| **Step 09** | Social Review | `SocialReviewPage.tsx` | `/social-review/:reviewId` | **MULTIPLE OWNERS** (Dual-mounted in `VideoDetail`) |
| **Step 10** | Publishing Setup | `PublishingPage.tsx` | `/publishing` | **MULTIPLE OWNERS** (Dual-mounted in `VideoDetail`) |
| **Step 11** | Published / Live Verification | `PublishingPage.tsx` | `/publishing` | **MULTIPLE OWNERS** (Dual-mounted in `VideoDetail`) |
| **Step 12** | Platform Sync / Package | `PlatformPackagesPage.tsx` | `/platform-packages/:videoId` | **FULLY OWNED** |
| **Step 13** | Social Analytics | `SocialAnalyticsPage.tsx` | `/social-analytics/:contentId` | **FULLY OWNED** |
| **Step 14** | Performance Review | `AnalyticsExperiencePage.tsx` | `/analytics/engagement` | **FULLY OWNED** |
| **Step 15** | Performance Intelligence | `AnalyticsExperiencePage.tsx` | `/analytics/intelligence` | **FULLY OWNED** |

---

## 22. CONFIRMED FINDINGS

1. **Consolidation into `VideoDetailPage` is Operationally Real**:
   - The unified tabbed workspace in `VideoDetailPage.tsx` successfully houses active workspaces for Scripting, Recording, Editing, Final QC, Thumbnail, Pinned Comment, and Publishing.
2. **8 Page Components are Dead / Unmounted**:
   - `ProductionBoardPage.tsx`
   - `PublishingPackagePage.tsx`
   - `VideoReviewScriptPage.tsx`
   - `VideoRecordPage.tsx`
   - `VideoEditPage.tsx`
   - `VideoFinalPage.tsx`
   - `VideoThumbnailPage.tsx`
   - `VideoPinnedCommentPage.tsx`
   All 8 are imported in `src/App.tsx` but are completely bypassed by unconditional `<Navigate>` or `<VideoTabRedirect>` routes.
3. **Step 09 Has Dual Competing Live Implementations**:
   - Step 09 exists both as a dedicated full-page review console (`/social-review/:id`) and as an internal tab inside `VideoDetailPage` (`?tab=social`).
4. **Step 15 to Step 01 Loopback is Fully Implemented**:
   - `AnalyticsExperiencePage.handleApplyStrategy()` successfully converts performance intelligence recommendations into structured URL search parameters and routes directly to `/studio?topicId=...&difficulty=...`.
5. **Step 05 (Raw Footage Handoff) Lacks Dedicated Workspace Identity**:
   - Step 05 is structurally present inside `RecordingWorkspace.tsx` as a Drive upload card, rather than functioning as an independent handoff gate.
6. **Authentication Drops Deep Links**:
   - `AuthGuard.tsx` redirects unauthenticated users to `/login` without preserving target paths, redirecting to the role's default landing route on login.

---

## 23. POTENTIAL FINDINGS

1. **State Desynchronization Between Tab URL and Video Status**:
   - A user can load `?tab=final-review` on a video that is still in status `RECORDED`. The workspace mounts without fatal errors, but actions are disabled until prerequisite assets exist.
2. **Parameter Confusion Across Question Workflows**:
   - Query parameters `?id=...`, `?questionId=...`, and route parameter `/:id` are parsed via ad-hoc fallbacks in question pages, creating latent navigation fragility.
3. **Overlapping Edit Responsibilities in Question Pipeline**:
   - `QuestionImprovePage` and `QuestionDetailPage` both provide full-form editing of question text, options, and explanations, creating user confusion regarding which page is canonical for post-draft updates.

---

## 24. UNKNOWN / RUNTIME VERIFICATION REQUIRED

1. **Live Google Drive Large Video Upload Latency in iFrame**:
   - Whether uploading large (>500MB) raw video files directly inside `RecordingWorkspace` on slower connections causes iFrame timeouts cannot be verified statically.
2. **End-to-End Persistence of Multi-Platform Publish Scheduling**:
   - Static analysis verifies that `PublishScheduleModal` sends payload to `apiClient.schedulePublishing()`, but real Google Sheet persistence under high concurrency requires runtime multi-user verification.

---

## 25. STAGE 4 SUMMARY & CONCLUSION

The Stage 4 Forensic Audit has successfully answered the core question:
> *"For one workflow step, there are many pages/workflows. Exactly which page or workspace owns each production responsibility in the codebase?"*

### Summary of Architectural Health:
1. **The 15-Step Pipeline Exists in Reality**: All 15 canonical steps defined in `01-product-truth.md` possess real, functioning component implementations. The pipeline is orchestrated end-to-end by `ProductionJourneyContext` and `ProductionJourneyBar`.
2. **Duplication is Concentrated, Not Pervasive**: The apparent sprawl of pages is largely driven by **8 unmounted legacy page files** that were superseded by `VideoDetailPage` and `PlatformPackagesPage` but never deleted from `src/pages/`.
3. **Two Live Collisions Require Resolution in Stage 6**:
   - **Step 09 Social Review**: Needs a decision on whether the dedicated page (`/social-review`) or the in-context tab (`VideoDetail?tab=social`) is the sole canonical home.
   - **Steps 10/11 Publishing**: Needs a decision on whether the global publishing table (`/publishing`) or the single-video publishing tab (`VideoDetail?tab=publishing`) is the sole canonical home.
4. **Zero Production Risk**: No source code, tests, routes, or backend systems were modified during this read-only audit.

---

## 26. STAGE 4 COMPLETION CHECKLIST

- [x] `01-product-truth.md` read and used as product reference
- [x] `02-repository-inventory.md` read and used as repository reference
- [x] `03-routing-navigation-audit.md` read and used as routing reference
- [x] All 32 `src/pages/*.tsx` files individually inspected
- [x] All workflow workspace components in `src/components/` inspected
- [x] `ProductionJourneyContext.tsx` and `ProductionJourneyBar.tsx` inspected
- [x] Question workflow inspected across all 5 question pages
- [x] Video workflow inspected across all 8 video pages and sub-workspaces
- [x] Publishing workflow inspected across all 3 publishing pages
- [x] Analytics workflow inspected across both analytics pages
- [x] Context and state duplication mapped
- [x] URL and query parameter state interactions audited
- [x] Backend status mappings verified
- [x] 4 legacy workflow systems identified and analyzed
- [x] Duplicate responsibilities and collisions documented
- [x] Complete 15-step canonical page map constructed
- [x] Confirmed, Potential, and Unknown findings cleanly separated
- [x] No application code modified
- [x] No data modified; No Google Sheets writes; No Google Drive writes
- [x] `04-page-workflow-map.md` generated
