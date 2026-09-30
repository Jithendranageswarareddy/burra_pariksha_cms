# Master Definitive Route Table

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 06 — Complete Route Forensic Audit  
**Audit Date:** 2026-09-28  

---

## 1. Master Route Table (79 Declarations in `src/App.tsx`)

| # | Route Path | Target Page / Element | Component Rendered | Purpose | Stage | Canonical Role | Primary Entry Point | Exit Transitions | APIs Triggered | Status |
| :-: | :--- | :--- | :--- | :--- | :-: | :--- | :--- | :--- | :--- | :---: |
| 1 | `/` (Parent) | `Layout` | `src/components/layout/Layout.tsx` | Root Authenticated Application Shell | - | ALL | App mount | - | `/api/auth/me` | **CANONICAL** |
| 2 | `/` (Index) | `Navigate to={landingRoute}` | - | Dynamic Role-Based Landing Redirect | - | ALL | Direct URL / root link | `/dashboard`, `/queue`, etc. | - | **CANONICAL** |
| 3 | `/dashboard` | `DashboardPage` | `src/pages/DashboardPage.tsx` | Executive overview & operational metrics | ALL | ALL | Sidebar, Logo | Any hub link | `/api/dashboard/stats`, `/api/health` | **CANONICAL** |
| 4 | `/planning` | `PlanningPage` | `src/pages/PlanningPage.tsx` | Topic syllabus planning & batch creation | 01 | CONTENT_LEAD | Sidebar | `/studio` | `/api/planning/*` (17 raw fetches) | **CANONICAL** |
| 5 | `/questions` | `QuestionLibraryPage` | `src/pages/QuestionLibraryPage.tsx` | Question master search, filter & review | 01-02 | ALL | Sidebar | `/questions/:id` | `/api/questions`, `/api/taxonomy` | **CANONICAL** |
| 6 | `/content-masters` | `ContentMasterPage` | `src/pages/ContentMasterPage.tsx` | Master Content Unit Explorer | 01-15 | CONTENT_LEAD | Sidebar | `/content-masters/:id` | `/api/content-masters` | **CANONICAL** |
| 7 | `/content-masters/:id` | `ContentMasterPage` | `src/pages/ContentMasterPage.tsx` | Content Master detail inspection | 01-15 | CONTENT_LEAD | Table row click | Back to list | `/api/content-masters/:id` | **CANONICAL** |
| 8 | `/social-review` | `SocialReviewPage` | `src/pages/SocialReviewPage.tsx` | QA review & signoff for social media packages | 09 | QA_REVIEWER | Sidebar | `/publishing` | `/api/social-reviews` | **CANONICAL** |
| 9 | `/social-review/:reviewId`| `SocialReviewPage` | `src/pages/SocialReviewPage.tsx` | Detailed review of individual social asset | 09 | QA_REVIEWER | Table row click | Back to list | `/api/social-reviews/:id` | **CANONICAL** |
| 10 | `/studio` | `QuestionStudioPage` | `src/pages/QuestionStudioPage.tsx` | Question generation studio (AI / manual) | 01 | QUESTION_AUTHOR | Sidebar, `/generate` | `/questions/:id/verify` | `/api/ai/generate-question`, `/api/questions` | **CANONICAL** |
| 11 | `/questions/new` | `Navigate to="/studio"` | - | Legacy alias for question creation | 01 | QUESTION_AUTHOR | Tests, bookmarks | `/studio` | - | **LEGACY ALIAS** |
| 12 | `/questions/improve` | `QuestionImprovePage` | `src/pages/QuestionImprovePage.tsx` | Batch question quality improvement | 02 | QUESTION_EDITOR | Studio action | `/questions/verify` | `/api/questions/improve` | **CANONICAL** |
| 13 | `/questions/:id/improve` | `QuestionImproveRedirect`| - | Redirect to improve page with query param | 02 | QUESTION_EDITOR | Detail page button | `/questions/improve?id=...` | - | **REDIRECT** |
| 14 | `/questions/verify` | `QuestionVerifyApprovePage`| `src/pages/QuestionVerifyApprovePage.tsx`| Question verification and approval queue | 02 | QA_REVIEWER | Studio exit | `/videos/create-script` | `/api/questions/verify` | **CANONICAL** |
| 15 | `/questions/:id/verify`| `QuestionVerifyApprovePage`| `src/pages/QuestionVerifyApprovePage.tsx`| Verify specific question | 02 | QA_REVIEWER | Library action | `/videos/create-script` | `/api/questions/:id` | **CANONICAL** |
| 16 | `/questions/:id` | `QuestionDetailPage` | `src/pages/QuestionDetailPage.tsx` | Single question deep inspection | 01-02 | ALL | Table row click | `/questions/improve` | `/api/questions/:id` | **CANONICAL** |
| 17 | `/generate` | `Navigate to="/studio"` | - | Legacy alias for studio | 01 | QUESTION_AUTHOR | Queue page | `/studio` | - | **LEGACY ALIAS** |
| 18 | `/queue` | `QueuePage` | `src/pages/QueuePage.tsx` | Recording studio schedule intake queue | 04 | PRESENTER | Sidebar | `/videos/:id?tab=recording` | `/api/queue`, `/api/videos` | **CANONICAL** |
| 19 | `/production` | `ProductionTrackerPage` | `src/pages/ProductionTrackerPage.tsx` | Multi-stage production pipeline tracker | 04-07 | VIDEO_LEAD | Sidebar | `/videos/:id` | `/api/videos` | **CANONICAL** |
| 20 | `/production-tracker` | `Navigate to="/production"`| - | Legacy alias for production tracker | 04-07 | VIDEO_LEAD | Old links | `/production` | - | **LEGACY ALIAS** |
| 21 | `/production-board` | `Navigate to="/production?status=EDITING"` | - | Legacy alias for production board | 06 | VIDEO_EDITOR | Old tests | `/production?status=EDITING`| - | **LEGACY ALIAS** |
| 22 | `/videos/create-script` | `VideoCreateScriptPage` | `src/pages/VideoCreateScriptPage.tsx` | Initial script generation for approved question | 03 | SCRIPTWRITER | Verify page exit | `/videos/:id?tab=script` | `/api/scripts/generate` | **CANONICAL** |
| 23 | `/videos/:videoId/script` | `VideoTabRedirect tab="script"` | - | Step 03 tab redirect | 03 | SCRIPTWRITER | Deep links | `/videos/:id?tab=script` | - | **REDIRECT** |
| 24 | `/production/:videoId/script` | `VideoTabRedirect tab="script"` | - | Step 03 alias redirect | 03 | SCRIPTWRITER | Deep links | `/videos/:id?tab=script` | - | **DUPLICATE ALIAS** |
| 25 | `/videos/:videoId/create-script` | `VideoTabRedirect tab="script"` | - | Step 03 alias redirect | 03 | SCRIPTWRITER | Deep links | `/videos/:id?tab=script` | - | **DUPLICATE ALIAS** |
| 26 | `/production/:videoId/create-script` | `VideoTabRedirect tab="script"` | - | Step 03 alias redirect | 03 | SCRIPTWRITER | Deep links | `/videos/:id?tab=script` | - | **DUPLICATE ALIAS** |
| 27 | `/videos/review-script` | `Navigate to="/production?status=SCRIPT_READY"` | - | Unrouted step redirect | 03 | QA_REVIEWER | Old navigation | `/production` | - | **LEGACY REDIRECT** |
| 28 | `/videos/:videoId/review-script` | `VideoTabRedirect tab="script"` | - | Step 03 alias redirect | 03 | QA_REVIEWER | Deep links | `/videos/:id?tab=script` | - | **DUPLICATE ALIAS** |
| 29 | `/production/:videoId/review-script` | `VideoTabRedirect tab="script"` | - | Step 03 alias redirect | 03 | QA_REVIEWER | Deep links | `/videos/:id?tab=script` | - | **DUPLICATE ALIAS** |
| 30 | `/videos/record` | `Navigate to="/production?status=RECORDING"` | - | Unrouted step redirect | 04 | PRESENTER | Old navigation | `/production` | - | **LEGACY REDIRECT** |
| 31 | `/videos/:videoId/record` | `VideoTabRedirect tab="recording"` | - | Step 04 tab redirect | 04 | PRESENTER | Deep links | `/videos/:id?tab=recording` | - | **REDIRECT** |
| 32 | `/production/:videoId/record` | `VideoTabRedirect tab="recording"` | - | Step 04 alias redirect | 04 | PRESENTER | Deep links | `/videos/:id?tab=recording` | - | **DUPLICATE ALIAS** |
| 33 | `/videos/edit-video` | `Navigate to="/production?status=EDITING"` | - | Unrouted step redirect | 06 | VIDEO_EDITOR | Old navigation | `/production` | - | **LEGACY REDIRECT** |
| 34 | `/videos/:videoId/edit-video` | `VideoTabRedirect tab="editing"` | - | Step 06 tab redirect | 06 | VIDEO_EDITOR | Deep links | `/videos/:id?tab=editing` | - | **REDIRECT** |
| 35 | `/production/:videoId/edit-video` | `VideoTabRedirect tab="editing"` | - | Step 06 alias redirect | 06 | VIDEO_EDITOR | Deep links | `/videos/:id?tab=editing` | - | **DUPLICATE ALIAS** |
| 36 | `/videos/final-video` | `Navigate to="/production?status=FINAL_REVIEW"` | - | Unrouted step redirect | 07 | QA_REVIEWER | Old navigation | `/production` | - | **LEGACY REDIRECT** |
| 37 | `/videos/:videoId/final-video` | `VideoTabRedirect tab="final-review"` | - | Step 07 tab redirect | 07 | QA_REVIEWER | Deep links | `/videos/:id?tab=final-review`| - | **REDIRECT** |
| 38 | `/production/:videoId/final-video` | `VideoTabRedirect tab="final-review"` | - | Step 07 alias redirect | 07 | QA_REVIEWER | Deep links | `/videos/:id?tab=final-review`| - | **DUPLICATE ALIAS** |
| 39 | `/videos/thumbnail` | `Navigate to="/production?status=READY_TO_UPLOAD"` | - | Unrouted step redirect | 08 | DESIGNER | Old navigation | `/production` | - | **LEGACY REDIRECT** |
| 40 | `/videos/:videoId/thumbnail` | `VideoTabRedirect tab="thumbnail"` | - | Step 08 tab redirect | 08 | DESIGNER | Deep links | `/videos/:id?tab=thumbnail` | - | **REDIRECT** |
| 41 | `/production/:videoId/thumbnail` | `VideoTabRedirect tab="thumbnail"` | - | Step 08 alias redirect | 08 | DESIGNER | Deep links | `/videos/:id?tab=thumbnail` | - | **DUPLICATE ALIAS** |
| 42 | `/videos/pinned-comment` | `Navigate to="/production"` | - | Unrouted step redirect | 09 | PUBLISHING_LEAD| Old navigation | `/production` | - | **LEGACY REDIRECT** |
| 43 | `/videos/:videoId/pinned-comment` | `VideoTabRedirect tab="pinned-comment"` | - | Step 09 tab redirect | 09 | PUBLISHING_LEAD| Deep links | `/videos/:id?tab=pinned-comment`| - | **REDIRECT** |
| 44 | `/production/:videoId/pinned-comment` | `VideoTabRedirect tab="pinned-comment"` | - | Step 09 alias redirect | 09 | PUBLISHING_LEAD| Deep links | `/videos/:id?tab=pinned-comment`| - | **DUPLICATE ALIAS** |
| 45 | `/videos/:videoId/social-review` | `VideoTabRedirect tab="social"` | - | Step 09 alias redirect | 09 | QA_REVIEWER | Deep links | `/videos/:id?tab=social` | - | **REDIRECT** |
| 46 | `/production/:videoId/social-review` | `VideoTabRedirect tab="social"` | - | Step 09 alias redirect | 09 | QA_REVIEWER | Deep links | `/videos/:id?tab=social` | - | **DUPLICATE ALIAS** |
| 47 | `/production/:videoId` | `VideoTabRedirect` | - | Production alias redirect | 04-09 | ALL | Deep links | `/videos/:id` | - | **DUPLICATE ALIAS** |
| 48 | `/videos/:videoId` | `VideoDetailPage` | `src/pages/VideoDetailPage.tsx` | Master unified video workspace (Tabs 03-11) | 03-11 | ALL | Pipeline click, queue click | Next workspace tab | `/api/videos/:id`, `/api/scripts` | **CANONICAL** |
| 49 | `/platform-packages` | `PlatformPackagesPage` | `src/pages/PlatformPackagesPage.tsx` | Social platform packaging & metadata | 10 | PUBLISHING_LEAD| Sidebar | `/publishing` | `/api/publishing/packages` | **CANONICAL** |
| 50 | `/videos/platform-packages` | `PlatformPackagesPage` | `src/pages/PlatformPackagesPage.tsx` | Alias to platform packages | 10 | PUBLISHING_LEAD| Direct URL | `/publishing` | `/api/publishing/packages` | **DUPLICATE ALIAS** |
| 51 | `/videos/:videoId/platform-packages`| `PlatformPackagesPage` | `src/pages/PlatformPackagesPage.tsx` | Single-video platform packaging | 10 | PUBLISHING_LEAD| Video action | `/publishing` | `/api/publishing/packages` | **CANONICAL** |
| 52 | `/production/:videoId/platform-packages`| `PlatformPackagesPage` | `src/pages/PlatformPackagesPage.tsx` | Alias to single-video platform packaging | 10 | PUBLISHING_LEAD| Direct URL | `/publishing` | `/api/publishing/packages` | **DUPLICATE ALIAS** |
| 53 | `/publishing-package` | `Navigate to="/platform-packages"` | - | Legacy alias redirect | 10 | PUBLISHING_LEAD| Old bookmarks | `/platform-packages` | - | **LEGACY ALIAS** |
| 54 | `/videos/publishing-package` | `Navigate to="/platform-packages"` | - | Legacy alias redirect | 10 | PUBLISHING_LEAD| Old bookmarks | `/platform-packages` | - | **LEGACY ALIAS** |
| 55 | `/videos/:videoId/publishing-package`| `Navigate to="/platform-packages"` | - | Legacy alias redirect | 10 | PUBLISHING_LEAD| Old bookmarks | `/platform-packages` | - | **LEGACY ALIAS** |
| 56 | `/production/:videoId/publishing-package`| `Navigate to="/platform-packages"` | - | Legacy alias redirect | 10 | PUBLISHING_LEAD| Old bookmarks | `/platform-packages` | - | **LEGACY ALIAS** |
| 57 | `/publishing` | `PublishingPage` | `src/pages/PublishingPage.tsx` | Multi-platform publishing manager | 11-12 | PUBLISHING_LEAD| Sidebar | `/analytics/overview` | `/api/publishing`, `/api/publishing/sync` | **CANONICAL** |
| 58 | `/videos/:videoId/publish` | `VideoTabRedirect tab="publishing"` | - | Video publishing tab redirect | 11 | PUBLISHING_LEAD| Direct URL | `/videos/:id?tab=publishing` | - | **REDIRECT** |
| 59 | `/production/:videoId/publish` | `VideoTabRedirect tab="publishing"` | - | Production alias redirect | 11 | PUBLISHING_LEAD| Direct URL | `/videos/:id?tab=publishing` | - | **DUPLICATE ALIAS** |
| 60 | `/analytics` | `Navigate to="/analytics/overview"`| - | Analytics root redirect | 13-14 | ANALYST | Direct URL | `/analytics/overview` | - | **REDIRECT** |
| 61 | `/analytics/overview` | `AnalyticsExperiencePage` | `src/pages/AnalyticsExperiencePage.tsx`| Analytics top-level overview dashboard | 13-14 | ANALYST | Sidebar | Sub-tab views | `/api/analytics/overview` | **CANONICAL** |
| 62 | `/analytics/video` | `AnalyticsExperiencePage` | `src/pages/AnalyticsExperiencePage.tsx`| Video performance analytics view | 13-14 | ANALYST | Tab click | Sub-tab views | `/api/analytics/videos` | **CANONICAL** |
| 63 | `/analytics/platform` | `AnalyticsExperiencePage` | `src/pages/AnalyticsExperiencePage.tsx`| Platform audience engagement view | 13-14 | ANALYST | Tab click | Sub-tab views | `/api/analytics/platforms` | **CANONICAL** |
| 64 | `/analytics/topic` | `AnalyticsExperiencePage` | `src/pages/AnalyticsExperiencePage.tsx`| Topic mastery analytics view | 13-14 | ANALYST | Tab click | Sub-tab views | `/api/analytics/topics` | **CANONICAL** |
| 65 | `/analytics/subtopic` | `AnalyticsExperiencePage` | `src/pages/AnalyticsExperiencePage.tsx`| Subtopic granular analytics view | 13-14 | ANALYST | Tab click | Sub-tab views | `/api/analytics/subtopics` | **CANONICAL** |
| 66 | `/analytics/difficulty` | `AnalyticsExperiencePage` | `src/pages/AnalyticsExperiencePage.tsx`| Difficulty breakdown analytics view | 13-14 | ANALYST | Tab click | Sub-tab views | `/api/analytics/difficulty` | **CANONICAL** |
| 67 | `/analytics/engagement` | `AnalyticsExperiencePage` | `src/pages/AnalyticsExperiencePage.tsx`| User engagement and comments view | 13-14 | ANALYST | Tab click | Sub-tab views | `/api/analytics/engagement` | **CANONICAL** |
| 68 | `/analytics/retention` | `AnalyticsExperiencePage` | `src/pages/AnalyticsExperiencePage.tsx`| Audience retention curve view | 13-14 | ANALYST | Tab click | Sub-tab views | `/api/analytics/retention` | **CANONICAL** |
| 69 | `/analytics/intelligence` | `AnalyticsExperiencePage` | `src/pages/AnalyticsExperiencePage.tsx`| AI predictive performance intelligence | 14-15 | ANALYST | Tab click | `/planning` | `/api/analytics/intelligence` | **CANONICAL** |
| 70 | `/analytics/strategy` | `AnalyticsExperiencePage` | `src/pages/AnalyticsExperiencePage.tsx`| Content editorial strategy suggestions | 15 | ANALYST | Tab click | `/planning` | `/api/analytics/strategy` | **CANONICAL** |
| 71 | `/social-analytics` | `SocialAnalyticsPage` | `src/pages/SocialAnalyticsPage.tsx` | Cross-channel social post metrics | 13 | ANALYST | Sidebar | `/social-analytics/:id` | `/api/social/analytics` | **CANONICAL** |
| 72 | `/social-analytics/:contentId`| `SocialAnalyticsPage` | `src/pages/SocialAnalyticsPage.tsx` | Detailed post analytics by content ID | 13 | ANALYST | Post click | Back to list | `/api/social/analytics/:id` | **CANONICAL** |
| 73 | `/my-work` | `MyWorkPage` | `src/pages/MyWorkPage.tsx` | Personalized team task queue & assignments | ALL | ALL | Sidebar, Profile | Entity detail pages | `/api/assignments/my-work` | **CANONICAL** |
| 74 | `/team` | `TeamOperationsPage` | `src/pages/TeamOperationsPage.tsx` | Team operational workload & reassignments | ALL | CONTENT_LEAD | Sidebar | Assignment modal | `/api/team/workload` | **CANONICAL** |
| 75 | `/team-work` | `TeamOperationsPage` | `src/pages/TeamOperationsPage.tsx` | Alias for team operations | ALL | CONTENT_LEAD | Direct link | Assignment modal | `/api/team/workload` | **DUPLICATE ALIAS** |
| 76 | `/settings` | `SettingsPage` | `src/pages/SettingsPage.tsx` | System health, taxonomy & Google Sheets config | SYSTEM | ADMIN | Sidebar | - | `/api/health`, `/api/taxonomy` | **CANONICAL** |
| 77 | `/recovery` | `RecoveryAdminPage` | `src/pages/RecoveryAdminPage.tsx` | Disaster recovery & snapshot restoration | SYSTEM | ADMIN | Sidebar (Admin) | - | `/api/recovery/*` | **CANONICAL** |
| 78 | `/admin` | `RecoveryAdminPage` | `src/pages/RecoveryAdminPage.tsx` | Alias for recovery admin | SYSTEM | ADMIN | Direct URL | - | `/api/recovery/*` | **DUPLICATE ALIAS** |
| 79 | `/*` | `NotFoundPage` | `src/pages/NotFoundPage.tsx` | Catch-all 404 error page | ALL | ALL | Unknown paths | `/dashboard` | - | **CANONICAL** |
