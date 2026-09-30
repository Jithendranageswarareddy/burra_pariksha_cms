# Lifecycle Data-Flow Mapping

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 19 of 30  
**Document:** 25 of 35  

---

## 1. The 15-Stage Business Workflow vs Real Data Flows

| Canonical Business Stage | Input Data | Active UI Surface | Domain Service | Persistence Target | State Changed | Next Stage Dependency |
| :- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Question Generation** | Prompt, Topic | `AIQuestionStudioPage` | `QuestionDraftService` | `QUESTION_DRAFTS` | `DRAFT` | Draft saved |
| **2. Question Verification** | Draft candidate | `DraftReviewModal` | `QuestionDraftService` | `QUESTIONS` Sheet | `APPROVED` | Verification passes |
| **3. Audience Script** | Question text | `ScriptWorkspace` | `ScriptService` | `SCRIPTS` Sheet | `SCRIPT_READY` | Hook + 3-step solution |
| **4. Teleprompter & Filming**| Script text | `RecordingWorkspace` | `VideoService` | None (Playback) | None | Prompter scroll |
| **5. Raw Video** | MP4 File | `RecordingWorkspace` | `GoogleDriveService` | Google Drive | `RECORDED` | File uploaded |
| **6. Editing Bay** | Raw cuts | `EditingWorkspace` | `Phase14DriveService` | Google Drive | `EDITED` | Render upload |
| **7. Final QC** | Edited video | `FinalReviewWorkspace` | `VideoService` | `VIDEOS` Sheet | `READY_TO_UPLOAD`| QC checklist signed |
| **8. Thumbnail** | Headline, Image | `ThumbnailWorkspace` | `ThumbnailService` | `THUMBNAILS` Sheet| `APPROVED` | 5MB check passed |
| **9. Social Review** | Question, Video | `SocialReviewWorkspace` | `SocialReviewService` | `SOCIAL_REVIEWS` | `APPROVED` | Copilot preview |
| **10. Publishing Setup** | URLs, Schedule | `PublishingWorkspace` | `PublishingService` | `PUBLISHING` Sheet | `SCHEDULED` | Gate D validation |
| **11. Published** | Live post URL | `PublishingWorkspace` | `PublishingService` | `PUBLISHING` Sheet | `PUBLISHED` | URL validation |
| **12. Platform Sync** | API webhooks | `PlatformSyncLogs` | `PublishingService` | `PLATFORM_SYNC` | Log entry | External verification|
| **13. Analytics** | Views, Likes | `AnalyticsDashboard` | `AnalyticsService` | `ANALYTICS` Sheet | Metrics saved | Daily/weekly poll |
| **14. Performance Review** | Aggregated stats| `AnalyticsDashboard` | `AnalyticsService` | None (Computed) | None | Comparative charts |
| **15. Intelligence Loop** | Historical data | `IntelligencePanel` | `SocialPerfIntService` | `ANALYTICS_INT` | Advisory report | AI recommendations |
