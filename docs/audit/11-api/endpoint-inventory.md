# API Endpoint Inventory (271 Endpoints)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 11 of 30  
**Document:** 02 of 30  

---

## 1. Inventory Summary

Across `src/server/routes.ts` and `server.ts`, **271 endpoints** are declared:
- **Total Route Definitions**: 271
- **HTTP GET**: 128
- **HTTP POST**: 122
- **HTTP PUT**: 7
- **HTTP PATCH**: 11
- **HTTP DELETE**: 3
- **Primary Mount**: `app.use('/api', apiRouter)` in `server.ts`

---

## 2. Representative Endpoint Inventory Register (Sample of Canonical Routes)

| Endpoint ID | Method | Route Path | Domain | Authentication | Authorization | Service Invoked | Storage Target | Status Codes | Classification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **API-001** | `POST` | `/auth/login` | Authentication | Public | None | `authService.login` | Local Session | 200, 401, 500 | Auth |
| **API-002** | `POST` | `/auth/logout` | Authentication | Authenticated | None | `authService.logout` | Local Session | 200, 500 | Auth |
| **API-003** | `GET` | `/auth/me` | Authentication | Authenticated | None | `authService.getCurrentUser`| `USERS` Sheet | 200, 401 | Auth |
| **API-004** | `GET` | `/health` | System Health | Public | None | `operationalHealthService`| Memory / Config | 200 | Health |
| **API-005** | `GET` | `/dashboard/overview` | Dashboard | Authenticated | None | `dashboardService.getOverview`| Multi-Sheet | 200, 500 | Analytics |
| **API-006** | `GET` | `/questions` | Questions | Authenticated | None | `questionService.getQuestions`| `QUESTIONS` Sheet | 200, 500 | CRUD |
| **API-007** | `POST` | `/questions` | Questions | Authenticated | `CREATOR` | `questionService.createQuestion`| `QUESTIONS` / `CONTENT_MASTERS` | 201, 400, 500 | Workflow |
| **API-008** | `GET` | `/questions/:id` | Questions | Authenticated | None | `questionService.getQuestionById`| `QUESTIONS` Sheet | 200, 404, 500 | CRUD |
| **API-009** | `PATCH`| `/questions/:id` | Questions | Authenticated | `SME` | `questionService.updateQuestion`| `QUESTIONS` Sheet | 200, 400, 500 | CRUD |
| **API-010** | `POST` | `/questions/:id/verify` | Questions | Authenticated | `VERIFIER` | `questionValidationService.verify`| `QUESTIONS` Sheet | 200, 400, 500 | Verification |
| **API-011** | `POST` | `/questions/ai-generate`| Questions | Authenticated | `CREATOR` | `aiService.generateCandidate`| Gemini / Memory | 200, 400, 500 | AI Generation |
| **API-012** | `GET` | `/videos` | Videos | Authenticated | None | `videoService.getVideos` | `VIDEOS` Sheet | 200, 500 | CRUD |
| **API-013** | `GET` | `/videos/:id` | Videos | Authenticated | None | `videoService.getVideoById`| `VIDEOS` Sheet | 200, 404, 500 | CRUD |
| **API-014** | `POST` | `/videos/:id/record` | Videos | Authenticated | `PRESENTER` | `videoService.recordTake` | `VIDEOS` Sheet / Drive | 200, 400, 500 | Production |
| **API-015** | `POST` | `/videos/:id/edit` | Videos | Authenticated | `EDITOR` | `videoService.submitCut` | `VIDEOS` Sheet / Drive | 200, 400, 500 | Production |
| **API-016** | `POST` | `/videos/:id/final-qc`| Videos | Authenticated | `QA_LEAD` | `videoService.signoffQc` | `VIDEOS` Sheet | 200, 400, 500 | Quality Control |
| **API-017** | `POST` | `/videos/:id/script` | Scripts | Authenticated | `SCRIPTWRITER`| `scriptService.saveScript` | `SCRIPT` / `SCRIPT_VERSIONS` | 200, 400, 500 | Production |
| **API-018** | `POST` | `/videos/:id/thumbnail`| Thumbnails | Authenticated | `DESIGNER` | `thumbnailService.saveThumbnail`| `THUMBNAILS` Sheet | 200, 400, 500 | Production |
| **API-019** | `POST` | `/publishing/schedule` | Publishing | Authenticated | `SOCIAL_LEAD`| `publishingService.schedule` | `PUBLISHING` Sheet | 200, 400, 500 | Publishing |
| **API-020** | `POST` | `/recovery/restore` | Recovery | Authenticated | `SUPER_ADMIN` | `FullSnapshotRestoreExecutionService`| All 18 Sheets Tabs | 200, 403, 500 | Disaster Recovery |
