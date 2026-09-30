# Operational Data-Flow Inventory

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 19 of 30  
**Document:** 05 of 35  

---

## 1. Inventory of Core Operational Data Flows

| Flow ID | Operation Description | Trigger Surface | Ingress Layer | Domain Service | Persistence Target | Consistency Model |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **DF-01** | Manual Question Creation | `QuestionCreationModal.tsx` | `POST /api/questions` | `QuestionService` | `QUESTIONS` + `CONTENT_MASTERS` | Best-Effort Cascade |
| **DF-02** | AI Question Generation | `AIQuestionStudioPage.tsx` | `POST /api/ai/generate` | `AIOrchestratorService` | `QUESTION_DRAFTS` Tab | Strong (Single Write) |
| **DF-03** | Question Draft Approval | `DraftReviewModal.tsx` | `POST /api/questions/drafts/:id/approve` | `QuestionDraftService` | `QUESTIONS` + Delete Draft | Non-Atomic 2-Step |
| **DF-04** | Question Status Transition | `QuestionDetailPage.tsx` | `PATCH /api/questions/:id/status`| `QuestionService` | `QUESTIONS` + `WORKFLOW` | Sequential Writes |
| **DF-05** | Queue Approved Question | `ApprovedQuestionsPage.tsx`| `POST /api/videos/queue` | `VideoService` | `VIDEOS` + `QUESTIONS` (Dual)| Non-Atomic 3-Step |
| **DF-06** | Video Status Transition | `VideoDetailPage.tsx` | `PATCH /api/videos/:id/status` | `VideoService` | `VIDEOS` + `QUESTIONS` (Sync)| Best-Effort Swallowed |
| **DF-07** | Raw Video File Upload | `RecordingWorkspace.tsx` | `POST /api/videos/:id/upload` | `GoogleDriveService` | Google Drive + `VIDEOS` | Non-Atomic Dual-System |
| **DF-08** | Video Stream Playback | `VideoPlayerComponent.tsx`| `GET /api/videos/:id/stream` | `GoogleDriveService` | Direct Stream Pipe | Transient Proxy |
| **DF-09** | Script Save & Versioning | `ScriptWorkspace.tsx` | `POST /api/videos/:id/script` | `ScriptService` | `SCRIPTS` + `SCRIPT_VERSIONS` | Sequential Writes |
| **DF-10** | Thumbnail Save & Version | `ThumbnailWorkspace.tsx` | `POST /api/videos/:id/thumbnail`| `ThumbnailService` | `THUMBNAILS` + `VERSIONS` | Sequential Writes |
| **DF-11** | Social Review Package | `SocialReviewWorkspace.tsx`| `POST /api/videos/:id/social-review`| `SocialReviewService`| `SOCIAL_REVIEWS` Tab | Single Tab Write |
| **DF-12** | Mark Platform Published | `PublishingWorkspace.tsx` | `POST /api/videos/:id/publish-platform`| `PublishingService`| `PUBLISHING` + `ANALYTICS` | Sequential Writes |
| **DF-13** | Ingest Analytics Snapshot| `AnalyticsDashboardPage.tsx`| `POST /api/analytics/snapshot` | `AnalyticsService` | `ANALYTICS` Tab | Single Tab Append |
| **DF-14** | Generate AI Intelligence | `IntelligencePanel.tsx` | `POST /api/analytics/intelligence`| `SocialPerfIntService` | `ANALYTICS_INTELLIGENCE` | Single Tab Append |
| **DF-15** | User Login & Authentication | `LoginPage.tsx` | `POST /api/auth/login` | `AuthService` | Memory Map + `USERS` read | Memory State Authoritative |
| **DF-16** | Deletion Safety Hardened | `SettingsPage.tsx` | `DELETE /api/questions/:id` | `DeletionSafetyService` | Disk Backup + Sheet Delete | 6-Phase Pipeline |
