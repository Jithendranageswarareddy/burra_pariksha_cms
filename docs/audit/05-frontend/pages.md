# Frontend Pages Forensic Dossiers

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 05 — Frontend Architecture Forensic Audit  
**Audit Date:** 2026-09-28  

---

## 1. Complete Inventory of All 31 Frontend Pages

Audited across `src/pages/`:

| Page Filename | Route Mounted in App.tsx | Workflow Stage | Apparent Role | Status |
| :--- | :--- | :---: | :--- | :---: |
| `AnalyticsExperiencePage.tsx` | `/analytics/*` | Stage 13-14 | Analyst / Admin | CANONICAL |
| `ContentMasterPage.tsx` | `/content-masters`, `/content-masters/:id` | Stages 01-15 | Content Lead / Admin | CANONICAL |
| `DashboardPage.tsx` | `/dashboard` | Overview | All Roles | CANONICAL |
| `LoginPage.tsx` | Unauthenticated root | Auth | Public / Team | CANONICAL |
| `MyWorkPage.tsx` | `/my-work` | Personalized | All Team Members | CANONICAL |
| `NotFoundPage.tsx` | `*` (Catch-all) | Utility | All Roles | CANONICAL |
| `PlanningPage.tsx` | `/planning` | Stage 01 Pre-plan | Content Lead / SME | CANONICAL (Has 17 raw fetches) |
| `PlatformPackagesPage.tsx` | `/platform-packages` | Stage 10 | Publishing Lead | CANONICAL |
| `ProductionBoardPage.tsx` | **UNROUTED** (`/production-board` -> `/production`) | Stages 04-07 | Video Team | **LEGACY CANDIDATE** |
| `ProductionTrackerPage.tsx` | `/production` | Stages 04-07 | Video Lead / Editor | CANONICAL |
| `PublishingPackagePage.tsx` | **UNROUTED** (`/publishing-package` -> `/platform-packages`) | Stage 10 | Publishing Lead | **LEGACY CANDIDATE** |
| `PublishingPage.tsx` | `/publishing` | Stage 11 | Publishing Lead | CANONICAL |
| `QuestionDetailPage.tsx` | `/questions/:id` | Stage 01-02 | Question Author/Editor | CANONICAL |
| `QuestionImprovePage.tsx` | `/questions/improve`, `/:id/improve` | Stage 02 | Question Editor | CANONICAL |
| `QuestionLibraryPage.tsx` | `/questions` | Stage 01-02 | Content Team | CANONICAL |
| `QuestionStudioPage.tsx` | `/studio`, `/questions/new`, `/generate` | Stage 01 | Question Author / SME | CANONICAL |
| `QuestionVerifyApprovePage.tsx`| `/questions/verify`, `/:id/verify` | Stage 02 | QA Reviewer | CANONICAL |
| `QueuePage.tsx` | `/queue` | Intake / Staging | Video Lead / Presenter | CANONICAL |
| `RecoveryAdminPage.tsx` | `/recovery`, `/admin` | System Recovery | System Admin | CANONICAL |
| `SettingsPage.tsx` | `/settings` | System Health | System Admin | CANONICAL |
| `SocialAnalyticsPage.tsx` | `/social-analytics`, `/:contentId` | Stage 13 | Analyst | CANONICAL |
| `SocialReviewPage.tsx` | `/social-review`, `/:reviewId` | Stage 09 | QA / Publishing Lead | CANONICAL |
| `TeamOperationsPage.tsx` | `/team`, `/team-work` | Operations | Content Lead / Admin | CANONICAL |
| `VideoCreateScriptPage.tsx` | `/videos/create-script` | Stage 03 | Scriptwriter | CANONICAL |
| `VideoDetailPage.tsx` | `/videos/:videoId`, `/production/:videoId` | Stages 03-11 | Video Production Team | CANONICAL (Consolidates all video steps via tabs) |
| `VideoEditPage.tsx` | **UNROUTED** (Redirected to `VideoDetailPage?tab=editing`) | Stage 06 | Video Editor | **LEGACY CANDIDATE** |
| `VideoFinalPage.tsx` | **UNROUTED** (Redirected to `VideoDetailPage?tab=final-review`) | Stage 07 | QA / Lead | **LEGACY CANDIDATE** |
| `VideoPinnedCommentPage.tsx` | **UNROUTED** (Redirected to `VideoDetailPage?tab=pinned-comment`) | Stage 09 | Social Lead | **LEGACY CANDIDATE** |
| `VideoRecordPage.tsx` | **UNROUTED** (Redirected to `VideoDetailPage?tab=recording`) | Stage 04 | Presenter | **LEGACY CANDIDATE** |
| `VideoReviewScriptPage.tsx` | **UNROUTED** (Redirected to `VideoDetailPage?tab=script`) | Stage 03 | QA Reviewer | **LEGACY CANDIDATE** |
| `VideoThumbnailPage.tsx` | **UNROUTED** (Redirected to `VideoDetailPage?tab=thumbnail`) | Stage 08 | Visual Designer | **LEGACY CANDIDATE** |

---

## 2. Page Classification Breakdown

- **Total Pages:** 31
- **Canonical Routed Pages:** 23
- **Unrouted Legacy Pages:** 8
  - 6 individual video step pages superseded by `VideoDetailPage.tsx` tabbed workspaces (`EditingWorkspace`, `RecordingWorkspace`, `ScriptWorkspace`, `ThumbnailWorkspace`, `FinalReviewWorkspace`, `PinnedCommentWorkspace`).
  - 1 superseded production board page (`ProductionBoardPage.tsx` replaced by `ProductionTrackerPage.tsx`).
  - 1 superseded publishing package page (`PublishingPackagePage.tsx` replaced by `PlatformPackagesPage.tsx`).
