# Route to Page & Root Component Mapping

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 06 — Complete Route Forensic Audit  
**Audit Date:** 2026-09-28  

---

## 1. Mapping Active Routes to Page Components

Across the 79 route declarations, exactly **23 distinct Page components** are rendered:

| Target Page Component | Page Source File | Routes Rendering This Page |
| :--- | :--- | :--- |
| `AnalyticsExperiencePage` | `src/pages/AnalyticsExperiencePage.tsx` | 10 routes (`/analytics/overview`, `/video`, `/platform`, `/topic`, `/subtopic`, `/difficulty`, `/engagement`, `/retention`, `/intelligence`, `/strategy`) |
| `ContentMasterPage` | `src/pages/ContentMasterPage.tsx` | 2 routes (`/content-masters`, `/content-masters/:id`) |
| `DashboardPage` | `src/pages/DashboardPage.tsx` | 1 route (`/dashboard`) |
| `LoginPage` | `src/pages/LoginPage.tsx` | Unauthenticated root fallback in `AppRoutes` |
| `MyWorkPage` | `src/pages/MyWorkPage.tsx` | 1 route (`/my-work`) |
| `NotFoundPage` | `src/pages/NotFoundPage.tsx` | 1 route (`/*`) |
| `PlanningPage` | `src/pages/PlanningPage.tsx` | 1 route (`/planning`) |
| `PlatformPackagesPage` | `src/pages/PlatformPackagesPage.tsx` | 4 routes (`/platform-packages`, `/videos/platform-packages`, `/videos/:videoId/platform-packages`, `/production/:videoId/platform-packages`) |
| `ProductionTrackerPage`| `src/pages/ProductionTrackerPage.tsx` | 1 route (`/production`) |
| `PublishingPage` | `src/pages/PublishingPage.tsx` | 1 route (`/publishing`) |
| `QuestionDetailPage` | `src/pages/QuestionDetailPage.tsx` | 1 route (`/questions/:id`) |
| `QuestionImprovePage` | `src/pages/QuestionImprovePage.tsx` | 1 route (`/questions/improve`) |
| `QuestionLibraryPage` | `src/pages/QuestionLibraryPage.tsx` | 1 route (`/questions`) |
| `QuestionStudioPage` | `src/pages/QuestionStudioPage.tsx` | 1 route (`/studio`) |
| `QuestionVerifyApprovePage`| `src/pages/QuestionVerifyApprovePage.tsx`| 2 routes (`/questions/verify`, `/questions/:id/verify`) |
| `QueuePage` | `src/pages/QueuePage.tsx` | 1 route (`/queue`) |
| `RecoveryAdminPage` | `src/pages/RecoveryAdminPage.tsx` | 2 routes (`/recovery`, `/admin`) |
| `SettingsPage` | `src/pages/SettingsPage.tsx` | 1 route (`/settings`) |
| `SocialAnalyticsPage` | `src/pages/SocialAnalyticsPage.tsx` | 2 routes (`/social-analytics`, `/social-analytics/:contentId`) |
| `SocialReviewPage` | `src/pages/SocialReviewPage.tsx` | 2 routes (`/social-review`, `/social-review/:reviewId`) |
| `TeamOperationsPage` | `src/pages/TeamOperationsPage.tsx` | 2 routes (`/team`, `/team-work`) |
| `VideoCreateScriptPage`| `src/pages/VideoCreateScriptPage.tsx`| 1 route (`/videos/create-script`) |
| `VideoDetailPage` | `src/pages/VideoDetailPage.tsx` | 1 route direct (`/videos/:videoId`) + 24 dynamic redirect routes |

---

## 2. Unrendered / Bypassed Page Files (8 Candidates)
As established in Step 05, 8 page files in `src/pages/` (`ProductionBoardPage.tsx`, `PublishingPackagePage.tsx`, `VideoEditPage.tsx`, `VideoFinalPage.tsx`, `VideoPinnedCommentPage.tsx`, `VideoRecordPage.tsx`, `VideoReviewScriptPage.tsx`, `VideoThumbnailPage.tsx`) are **never mounted** by any route in `src/App.tsx`.
