# Workflow Navigation Map

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 20 of 30  
**Document:** 23 of 41  

---

## 1. Journey Stepper Navigation Dispatch

When a user clicks a step on `ProductionJourneyBar.tsx` or uses `WorkflowStepNav.tsx`:

| Stage | Target Route | Query Parameter | Component Mounted | Next Allowed Step |
| :---: | :--- | :--- | :--- | :---: |
| **01** | `/studio` | None | `QuestionStudioPage` | 02 |
| **02** | `/questions/:id/verify` | None | `QuestionVerifyApprovePage` | 03 |
| **03** | `/videos/:id` | `?tab=script` | `VideoDetailPage` -> `ScriptWorkspace` | 04 |
| **04** | `/videos/:id` | `?tab=recording` | `VideoDetailPage` -> `RecordingWorkspace` | 05 |
| **05** | `/videos/:id` | `?tab=recording` | `VideoDetailPage` -> `RecordingWorkspace` | 06 |
| **06** | `/videos/:id` | `?tab=editing` | `VideoDetailPage` -> `EditingWorkspace` | 07 |
| **07** | `/videos/:id` | `?tab=final-review`| `VideoDetailPage` -> `FinalReviewWorkspace` | 08 |
| **08** | `/videos/:id` | `?tab=thumbnail` | `VideoDetailPage` -> `ThumbnailWorkspace` | 09 |
| **09** | `/social-review/:id` | None | `SocialReviewPage` | 10 |
| **10** | `/publishing` | None | `PublishingPage` | 11 |
| **11** | `/publishing` | None | `PublishingPage` | 12 |
| **12** | `/platform-packages` | None | `PlatformPackagesPage` | 13 |
| **13** | `/social-analytics/:id`| None | `SocialAnalyticsPage` | 14 |
| **14** | `/analytics/engagement`| None | `AnalyticsExperiencePage` | 15 |
| **15** | `/analytics/intelligence`| None | `AnalyticsExperiencePage` | 01 (Loopback) |
