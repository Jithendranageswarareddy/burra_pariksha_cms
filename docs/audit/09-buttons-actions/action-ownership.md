# Action Ownership & Architecture Mapping

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 09 of 30  
**Document:** 27 of 30  

---

## 1. End-to-End Ownership Topology

This document establishes the authoritative ownership chain across UI, Handler, API, Service, Repository, State, and Persistence tiers:

```
ACTION  ->  UI COMPONENT  ->  FRONTEND HANDLER  ->  SERVER API ROUTE
  ->  BACKEND SERVICE  ->  DATA REPOSITORY  ->  GOOGLE SHEETS TAB
```

---

## 2. End-to-End Action Ownership Matrix

| Action | UI Component Owner | Frontend Handler | Server Route Owner | Backend Service Owner | Repository Owner | Persistence Sheet |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| Create Question | `QuestionStudioPage` | `handleSaveSuccess()` | `POST /api/questions` | `QuestionService` | `QuestionsRepository` | `Questions` |
| Verify Question | `QuestionVerifyApprovePage`| `handleApproveSuccess()` | `POST /api/questions/:id/verify`| `QuestionService` | `QuestionsRepository` | `Questions`, `Videos` |
| Approve Script | `ScriptWorkspace` | `handleApproveScript()` | `POST /api/scripts/:id/approve` | `ScriptService` | `ScriptsRepository` | `Scripts`, `ScriptVersions` |
| Record Video | `RecordingWorkspace` | `handleFinishRecording()`| `POST /api/videos/:id/record` | `VideoService` | `VideosRepository` | `Videos` |
| Submit Edit | `EditingWorkspace` | `handleSubmitForQC()` | `POST /api/videos/:id/submit-edit`| `VideoService` | `VideosRepository` | `Videos` |
| Approve QC | `FinalReviewWorkspace` | `handleApproveVideo()` | `POST /api/videos/:id/approve-qc` | `VideoService` | `VideosRepository` | `Videos` |
| Save Thumbnail | `ThumbnailWorkspace` | `handleApproveThumbnail()`| `/api/videos/:id/thumbnail` | `ThumbnailService` | `ThumbnailsRepository`| `Thumbnails` |
| Signoff Social | `SocialReviewPage` | `handleSignoff()` | `POST /api/social-reviews/:id/approve`| `SocialReviewService`| `SocialReviewsRepository`| `SocialReviews` |
| Schedule Broadcast| `PublishingWorkspace`| `handleScheduleSuccess()`| `POST /api/publishing/schedule` | `PublishingService` | `PublishingRepository` | `PublishingQueue` |
