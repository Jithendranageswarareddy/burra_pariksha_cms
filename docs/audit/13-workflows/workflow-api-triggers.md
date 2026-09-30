# Workflow API Triggers Forensic Catalog

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 13 of 30  
**Document:** 17 of 30  

---

## 1. Master API Transition Catalog

Static analysis of `src/server/routes.ts` identified **38 distinct API endpoints** that trigger persistent state changes:

| Endpoint | HTTP | Target Entity | Triggered Transition | Enforced Role |
| :--- | :---: | :--- | :--- | :--- |
| `/api/questions/create` | POST | Question | `NULL` -> `DRAFT` / `GENERATED` | USER, SME |
| `/api/questions/draft/:id/approve`| POST | Question | `GENERATED` -> `APPROVED` | SME, LEAD |
| `/api/questions/:id/queue` | POST | Question / Video | `APPROVED` -> Video `QUEUED` | SME, LEAD |
| `/api/questions/:id/status` | PATCH | Question | Arbitrary allowed next | SME, LEAD, ADMIN |
| `/api/videos/queue` | POST | Video | `NOT_STARTED` -> `QUEUED` | SME, LEAD |
| `/api/videos/:id/status` | PATCH | Video | Arbitrary `VALID_VIDEO_TRANSITIONS` | LEAD, ADMIN |
| `/api/videos/:videoId/script/mark-ready`| POST| Video / Script | `SCRIPT_REQUIRED` -> `SCRIPT_READY` | USER, SME |
| `/api/videos/:videoId/script/return-to-editing`| POST| Video / Script | `SCRIPT_READY` -> `SCRIPT_REQUIRED` | USER, SME |
| `/api/phase17/video/:videoId/transition-editing`| POST| Video | `* -> EDITING` | USER, EDITOR |
| `/api/phase17/video/:videoId/approve-final`| POST| Video | `EDITED` -> `READY_TO_UPLOAD` | LEAD, ADMIN |
| `/api/videos/:id/final-render/complete`| POST| Video | `EDITING` -> `EDITED` | EDITOR, LEAD |
| `/api/phase18/thumbnails/candidates/:id/approve`| POST| Thumbnail | `PENDING` -> `APPROVED` | LEAD, ADMIN |
| `/api/phase18/thumbnails/candidates/:id/reject`| POST| Thumbnail | `PENDING` -> `REJECTED` | LEAD, ADMIN |
| `/api/videos/:videoId/publishing/schedule`| POST| Publishing | `DRAFT` -> `SCHEDULED` | LEAD, ADMIN |
| `/api/videos/:videoId/publishing/publish-platform`| POST| Publishing | `SCHEDULED` -> `PUBLISHED` | LEAD, ADMIN |
| `/api/videos/:videoId/publishing/fail`| POST| Publishing | `* -> FAILED` | SYSTEM, ADMIN |
| `/api/videos/:videoId/publishing/retry`| POST| Publishing | `FAILED -> SCHEDULED` | LEAD, ADMIN |
| `/api/videos/:videoId/publishing/finalize`| POST| Video / Master | Video `UPLOADED`, Master `COMPLETED` | LEAD, ADMIN |
| `/api/content-masters/:id/transition`| POST| Content Master | Multi-state transition | LEAD, ADMIN |
| `/api/content-masters/:id/archive`| POST| Content Master | `* -> ARCHIVED` | ADMIN |
| `/api/assignments/:id/start` | POST | Assignment | `ASSIGNED -> IN_PROGRESS` | USER, ASSIGNEE |
| `/api/assignments/:id/block` | POST | Assignment | `IN_PROGRESS -> BLOCKED` | USER, ASSIGNEE |
| `/api/assignments/:id/complete`| POST | Assignment | `IN_PROGRESS -> COMPLETED` | USER, LEAD |
| `/api/assignments/:id/cancel` | POST | Assignment | `* -> CANCELLED` | LEAD, ADMIN |
