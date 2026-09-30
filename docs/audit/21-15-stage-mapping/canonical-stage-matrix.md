# Canonical Stage Master Matrix

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 21 of 30  
**Document:** 18 of 31  

---

## 1. Master Cross-Stage Mapping Table

| # | Canonical Business Stage | Actual Code Implementation | Active Route | Primary Entity | Authoritative Storage | Implementation Status |
| :- | :--- | :--- | :--- | :--- | :--- | :---: |
| **01** | Question Generation | `QuestionStudioPage` / `question-draft.service` | `/studio` | `QuestionDraft` | `QUESTION_DRAFTS` Sheet | **FULLY IMPLEMENTED** |
| **02** | Question Verification | `QuestionVerifyApprovePage` / `question.service` | `/questions/:id/verify` | `Question` | `QUESTIONS` Sheet | **FULLY IMPLEMENTED** |
| **03** | Audience Script | `VideoDetailPage?tab=script` / `script.service` | `/videos/:id?tab=script` | `Script` | `SCRIPTS` Sheet | **FULLY IMPLEMENTED** |
| **04** | Teleprompter & Filming| `VideoDetailPage?tab=recording` | `/videos/:id?tab=recording` | `Video` | `VIDEOS` Sheet | **FULLY IMPLEMENTED** |
| **05** | Raw Video | `RecordingWorkspace` / `google-drive.service` | `/videos/:id?tab=recording` | `MediaAsset` | Google Drive + `MEDIA_ASSETS`| **FULLY IMPLEMENTED** |
| **06** | Video Editing Bay | `VideoDetailPage?tab=editing` | `/videos/:id?tab=editing` | `Video` | Google Drive + `VIDEOS` | **FULLY IMPLEMENTED** |
| **07** | Final QC | `VideoDetailPage?tab=final-review` | `/videos/:id?tab=final-review` | `Video` | `VIDEOS` Sheet | **FULLY IMPLEMENTED** |
| **08** | Thumbnail | `VideoDetailPage?tab=thumbnail` / `thumbnail.service`| `/videos/:id?tab=thumbnail` | `Thumbnail` | Google Drive + `THUMBNAILS` | **FULLY IMPLEMENTED** |
| **09** | Social Review | `SocialReviewPage` / `social-review.service` | `/social-review/:id` | `SocialReview` | `SOCIAL_REVIEWS` Sheet | **FULLY IMPLEMENTED** |
| **10** | Publishing Setup | `PublishingPage` / `publishing.service` | `/publishing` | `Publishing` | `PUBLISHING` Sheet | **FULLY IMPLEMENTED** |
| **11** | Published / Live | `PublishingPage` / `markPlatformPublished` | `/publishing` | `Publishing` | `PUBLISHING` Sheet | **FULLY IMPLEMENTED** |
| **12** | Platform Sync | `PlatformPackagesPage` / `platform-adaptation` | `/platform-packages` | `PlatformSyncLog` | `PLATFORM_SYNC_LOGS` Sheet | **PARTIALLY IMPLEMENTED**|
| **13** | Analytics | `SocialAnalyticsPage` / `analytics.service` | `/social-analytics/:id` | `SocialAnalytics` | `ANALYTICS` Sheet | **PARTIALLY IMPLEMENTED**|
| **14** | Performance Review | `AnalyticsExperiencePage` (Tab 1) | `/analytics/engagement` | Aggregations | `ANALYTICS` Sheet (Derived)| **FULLY IMPLEMENTED** |
| **15** | Intelligence Loop | `AnalyticsExperiencePage` (Tab 2) | `/analytics/intelligence`| `Intelligence` | `ANALYTICS_INTELLIGENCE` | **PARTIALLY IMPLEMENTED**|
