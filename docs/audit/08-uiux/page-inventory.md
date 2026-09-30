# Definitive Page Inventory (All 31 Page Files)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 08 of 30  
**Document:** 02 of 30  

---

## 1. Inventory Summary

The Burra Pariksha CMS frontend codebase contains **31 page component files** located in `src/pages/`.
- **Active Canonical Routed Pages:** 23
- **Unrouted Legacy Page Candidates:** 8 (superseded by the consolidated `VideoDetailPage` tabbed workspace and consolidated trackers)

---

## 2. Definitive Page Inventory Table

| # | Page ID | Page Name | Primary Route | Source File | Canonical Role | Workflow Stage | Entity Type | Status |
|---|---|---|---|---|---|---|---|---|
| 1 | `PAGE-LOGIN` | Login Page | `/login` (Unauth) | `src/pages/LoginPage.tsx` | ALL (Public) | Auth | User / Session | CANONICAL |
| 2 | `PAGE-DASH` | Executive Dashboard | `/dashboard` | `src/pages/DashboardPage.tsx` | ALL | Overview | Aggregated | CANONICAL |
| 3 | `PAGE-MYWORK` | My Work Task Queue | `/my-work` | `src/pages/MyWorkPage.tsx` | ALL | Personal | Task / Assignment | CANONICAL |
| 4 | `PAGE-PLAN` | Planning & Batches | `/planning` | `src/pages/PlanningPage.tsx` | Content Lead | Stage 01 Pre-plan | Topic / Batch | CANONICAL |
| 5 | `PAGE-QLIB` | Question Library | `/questions` | `src/pages/QuestionLibraryPage.tsx` | Academic / Lead | Stages 01-02 | Question | CANONICAL |
| 6 | `PAGE-QDET` | Question Detail Page | `/questions/:id` | `src/pages/QuestionDetailPage.tsx` | Academic / Lead | Stages 01-02 | Question | CANONICAL |
| 7 | `PAGE-QSTUDIO` | Question Authoring Studio | `/studio` | `src/pages/QuestionStudioPage.tsx` | Question Author | Stage 01 | Question | CANONICAL |
| 8 | `PAGE-QIMP` | Question Improvement | `/questions/improve` | `src/pages/QuestionImprovePage.tsx` | Question Editor | Stage 02 | Question | CANONICAL |
| 9 | `PAGE-QVERIFY` | Question Verify & Approve | `/questions/verify` | `src/pages/QuestionVerifyApprovePage.tsx` | QA Reviewer | Stage 02 | Question | CANONICAL |
| 10 | `PAGE-QUEUE` | Recording Queue | `/queue` | `src/pages/QueuePage.tsx` | Presenter / Studio | Stage 04 | Video / Prompter | CANONICAL |
| 11 | `PAGE-PRODTRK` | Production Tracker | `/production` | `src/pages/ProductionTrackerPage.tsx` | Video Lead / Editor | Stages 04-07 | Video Production | CANONICAL |
| 12 | `PAGE-VCSCRIPT` | Video Create Script Page | `/videos/create-script` | `src/pages/VideoCreateScriptPage.tsx` | Scriptwriter | Stage 03 | Video Script | CANONICAL |
| 13 | `PAGE-VDET` | Video Detail Workspace | `/videos/:videoId` | `src/pages/VideoDetailPage.tsx` | Video Team / Lead | Stages 03-11 | Video Master | CANONICAL |
| 14 | `PAGE-SOCREV` | Social Review Signoff | `/social-review` | `src/pages/SocialReviewPage.tsx` | QA / Social Lead | Stage 09 | Social Package | CANONICAL |
| 15 | `PAGE-PLTPKG` | Platform Packages | `/platform-packages` | `src/pages/PlatformPackagesPage.tsx` | Publishing Lead | Stage 10 | Platform Package | CANONICAL |
| 16 | `PAGE-PUB` | Publishing Manager | `/publishing` | `src/pages/PublishingPage.tsx` | Publishing Lead | Stages 11-12 | Publication Slot | CANONICAL |
| 17 | `PAGE-ANL-EXP` | Analytics Experience Hub | `/analytics/*` | `src/pages/AnalyticsExperiencePage.tsx` | Analyst / Admin | Stages 13-15 | Performance Metric | CANONICAL |
| 18 | `PAGE-SOCANL` | Social Analytics | `/social-analytics` | `src/pages/SocialAnalyticsPage.tsx` | Analyst / Social | Stage 13 | Social Metric | CANONICAL |
| 19 | `PAGE-TEAM` | Team Operations | `/team` | `src/pages/TeamOperationsPage.tsx` | Content Lead / Admin| Operations | Team Member | CANONICAL |
| 20 | `PAGE-CMASTER` | Content Explorer | `/content-masters` | `src/pages/ContentMasterPage.tsx` | Lead / Admin | Stages 01-15 | Content Master | CANONICAL |
| 21 | `PAGE-SETT` | System Health & Settings | `/settings` | `src/pages/SettingsPage.tsx` | System Admin | System | Configuration | CANONICAL |
| 22 | `PAGE-RECOV` | Disaster Recovery Admin | `/recovery` | `src/pages/RecoveryAdminPage.tsx` | System Admin | Disaster Recovery| System Snapshot | CANONICAL |
| 23 | `PAGE-404` | Not Found Page | `/*` (Catch-all) | `src/pages/NotFoundPage.tsx` | ALL | Utility | None | CANONICAL |
| 24 | `PAGE-LEG-PBRD`| Production Board (Legacy) | Unrouted (`-> /production`)| `src/pages/ProductionBoardPage.tsx` | Video Editor | Stages 04-07 | Video Production | LEGACY |
| 25 | `PAGE-LEG-PUBP`| Publishing Package (Legacy)| Unrouted (`-> /platform-packages`)| `src/pages/PublishingPackagePage.tsx` | Publishing Lead | Stage 10 | Platform Package | LEGACY |
| 26 | `PAGE-LEG-VREV`| Video Review Script (Legacy)| Unrouted (`-> /videos/:id?tab=script`)| `src/pages/VideoReviewScriptPage.tsx` | QA Reviewer | Stage 03 | Video Script | LEGACY |
| 27 | `PAGE-LEG-VREC`| Video Record (Legacy) | Unrouted (`-> /videos/:id?tab=recording`)| `src/pages/VideoRecordPage.tsx` | Presenter | Stage 04 | Video Recording | LEGACY |
| 28 | `PAGE-LEG-VEDT`| Video Edit (Legacy) | Unrouted (`-> /videos/:id?tab=editing`)| `src/pages/VideoEditPage.tsx` | Video Editor | Stage 06 | Video Cut | LEGACY |
| 29 | `PAGE-LEG-VFIN`| Video Final QC (Legacy) | Unrouted (`-> /videos/:id?tab=final-review`)| `src/pages/VideoFinalPage.tsx` | QA Reviewer | Stage 07 | Video Master | LEGACY |
| 30 | `PAGE-LEG-VTHM`| Video Thumbnail (Legacy)| Unrouted (`-> /videos/:id?tab=thumbnail`)| `src/pages/VideoThumbnailPage.tsx` | Designer | Stage 08 | Thumbnail | LEGACY |
| 31 | `PAGE-LEG-VPC` | Video Pinned Comment (Legacy)| Unrouted (`-> /videos/:id?tab=pinned-comment`)| `src/pages/VideoPinnedCommentPage.tsx` | Social Lead | Stage 09 | Social Asset | LEGACY |
