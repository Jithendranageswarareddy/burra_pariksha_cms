# Entity Creator Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 15 of 30  
**Document:** 05 of 51  

---

## 1. Master Creator Audit Matrix

| Entity | Creation Mechanism | Entrypoint Endpoint / Service | Creator Identity | Enforced Role |
| :--- | :--- | :--- | :--- | :--- |
| **Question** | Manual Form or AI Generator | `POST /api/questions/create` | Authenticated User | `QUESTION_CREATOR`, `SME`, `ADMIN` |
| **Draft Question** | AI Prompt Workspace | `POST /api/questions/draft` | Authenticated User | Any authenticated user |
| **Content Master** | Auto-instantiated on Question Create | `contentMasterService.createContentMaster()`| Domain Service | System / Inherited User |
| **Script** | Scriptwriting Workspace or AI Copilot | `POST /api/videos/:id/script` | Content Writer | `SCRIPT_WRITER`, `LEAD`, `ADMIN` |
| **Video** | Queueing an Approved Question | `POST /api/videos/queue` | Lead / Manager | `TOPIC_LEAD`, `CONTENT_MANAGER`, `ADMIN` |
| **Media Asset** | Multipart Upload / Drive Ingestion | `POST /api/media/upload` | Talent / Editor | `STUDIO_PRESENTER`, `VIDEO_EDITOR` |
| **Thumbnail** | AI Concept Gen or Manual Upload | `POST /api/videos/:id/thumbnail` | Graphic Designer | `CONTENT_MANAGER`, `ADMIN` |
| **Pinned Comment** | Form Submission | `POST /api/videos/:id/pinned-comment` | Copywriter / Lead | `CONTENT_MANAGER`, `ADMIN` |
| **Social Review** | Background Bundle Compilation | `SocialReviewService.getReviewPackageBundle`| Domain Service | System Automated |
| **Publishing** | Video Queueing Side Effect | `publishingService.initializePublishing` | Domain Service | System Automated |
| **Assignment** | Task Allocation Workspace | `POST /api/assignments` | Topic Lead / Manager| `TOPIC_LEAD`, `CONTENT_MANAGER`, `ADMIN` |
| **Audit Event** | Event Logging Middleware | `auditService.log()` | Domain Service | System Automated |
| **Workflow Event**| Status Mutation Hook | `workflowService.recordTransition()` | Domain Service | System Automated |
