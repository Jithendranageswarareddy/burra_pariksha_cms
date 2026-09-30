# Workflow Action Matrix (15 Canonical Stages)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 09 of 30  
**Document:** 30 of 30  

---

## 1. 15-Stage Workflow Action Matrix

| Stage | Stage Name | Primary Action Button | Triggered API | Service Called | Entity State Transition | Destination Next Stage |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- |
| **01** | Question Generation | "Save & Continue to Verification"| `POST /api/questions` | `QuestionService.createQuestion()` | `[NONE]` -> `DRAFT` | Stage 02 (`/questions/:id/verify`) |
| **02** | Question Verification | "Approve Question & Launch Production"| `POST /api/questions/:id/verify`| `QuestionService.verifyQuestion()`| `DRAFT` -> `VERIFIED` | Stage 03 (`/videos/:id?tab=script`) |
| **03** | Audience Script | "Approve Script & Advance to Filming"| `POST /api/scripts/:id/approve` | `ScriptService.approveScript()` | Video: `SCRIPT_READY` -> `RECORDING` | Stage 04 (`/videos/:id?tab=recording`)|
| **04** | Teleprompter Prep | "Start Prompter Run" | In-Memory Timer / Pacing | `ScriptService.formatPrompter()` | Prompter Cues Cached | Stage 05 (Studio Filming) |
| **05** | Raw Video Filming | "Raw Footage Uploaded - Begin Edit"| `POST /api/videos/:id/record` | `VideoService.recordVideoTake()` | Video: `RECORDING` -> `EDITING` | Stage 06 (`/videos/:id?tab=editing`) |
| **06** | Video Editing Bay | "Submit Cut for Executive Review" | `POST /api/videos/:id/submit-edit`| `VideoService.submitRoughCut()` | Video: `EDITING` -> `FINAL_REVIEW`| Stage 07 (`/videos/:id?tab=final-review`)|
| **07** | Final QC Review | "Approve Video & Design Thumbnail"| `POST /api/videos/:id/approve-qc` | `VideoService.approveFinalQC()` | Video: `FINAL_REVIEW` -> `READY_TO_UPLOAD`| Stage 08 (`/videos/:id?tab=thumbnail`)|
| **08** | Thumbnail Studio | "Approve Thumbnail & Package" | `POST /api/videos/:id/thumbnail` | `ThumbnailService.saveThumbnail()`| Thumbnail: `DRAFT` -> `APPROVED` | Stage 09 (`/videos/:id?tab=social`) |
| **09** | Social Gatekeeper | "Approve Social Package" | `POST /api/social-reviews/:id/approve`| `SocialReviewService.approveReview()`| SocialReview: `PENDING` -> `APPROVED`| Stage 10 (`/videos/:id?tab=publishing`)|
| **10** | Publishing Setup | "Schedule Multi-Platform Broadcast"| `POST /api/publishing/schedule` | `PublishingService.scheduleRelease()`| Video: `READY` -> `PUBLISHED` | Stage 11 (`/publishing`) |
| **11** | Published & Live | "Verify Channel Distribution" | External URL verification | `PublishingService.verifyLiveStatus()`| Sync record confirmed | Stage 12 (Live Verification) |
| **12** | Platform Sync | "Check Metrics Synchronization" | `POST /api/publishing/sync` | `PlatformAdaptationService.sync()` | Cross-channel URLs recorded | Stage 13 (`/social-analytics`) |
| **13** | Social Analytics | "Fetch Latest Comments" | `POST /api/social/comments/sync`| `SocialCommentsService.sync()` | Comments appended | Stage 14 (`/analytics/engagement`)|
| **14** | Performance Review | "Analyze Retention Curves" | `GET /api/analytics/retention` | `AnalyticsService.getRetention()` | Retention metrics queried | Stage 15 (`/analytics/intelligence`)|
| **15** | Pedagogical Loop | "Apply Insights to Next Batch" | `POST /api/analytics/intelligence/apply`| `CommentIntelligenceService` | Loops to Stage 01 (`/planning`) | Stage 01 (Compounding Loop) |
