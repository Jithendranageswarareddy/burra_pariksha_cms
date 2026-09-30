# Workflow API Map

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 20 of 30  
**Document:** 25 of 41  

---

## 1. REST Endpoints by Workflow Stage

| Stage | HTTP Method & Path | Handler Function | Enforced Roles |
| :---: | :--- | :--- | :--- |
| **01** | `POST /api/questions/drafts` | `handleSaveQuestionDraftRoute` | Admin, Manager, Writer, Editor |
| **02** | `POST /api/questions/drafts/:id/approve`| `handleApproveQuestionDraftRoute`| Admin, Content Manager |
| **02** | `POST /api/videos/queue` | `handleQueueVideoRoute` | Admin, Content Manager |
| **03** | `POST /api/videos/:id/script` | `handleSaveScriptRoute` | Admin, Manager, Writer |
| **04** | `PATCH /api/videos/:id/status` | `handleUpdateVideoStatusRoute` | Admin, Manager, Host, Editor |
| **05** | `POST /api/videos/:id/upload` | `handleVideoUploadRoute` | Admin, Manager, Video Editor |
| **06** | `PATCH /api/videos/:id/status` | `handleUpdateVideoStatusRoute` | Admin, Manager, Video Editor |
| **07** | `PATCH /api/videos/:id/status` | `handleUpdateVideoStatusRoute` | Admin, Content Manager |
| **08** | `POST /api/videos/:id/thumbnail`| `handleSaveThumbnailRoute` | Admin, Manager, Designer |
| **09** | `POST /api/videos/:id/social-review`| `handleSaveSocialReviewRoute` | Admin, Content Manager |
| **10** | `POST /api/videos/:id/publish-platform`| `handlePublishPlatformRoute` | Admin, Content Manager |
| **11** | `POST /api/videos/:id/publish-platform`| `handlePublishPlatformRoute` | Admin, Content Manager |
| **12** | `GET /api/platform-packages/:id` | `handleGetPlatformPackageRoute` | Authenticated Users |
| **13** | `POST /api/analytics/snapshot` | `handleRecordAnalyticsRoute` | Admin, Analytics Specialist |
| **14** | `GET /api/analytics/summary` | `handleGetAnalyticsSummaryRoute` | Authenticated Users |
| **15** | `POST /api/analytics/intelligence`| `handleGenerateIntelligenceRoute`| Admin, Strategy Lead |
