# API & Endpoint Problem Register (35 Classified Findings)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 11 of 30  
**Document:** 32 of 30  

---

## 1. Master Forensic Problem Register

| Problem ID | Classification | Severity | Endpoint / Route | Specific Finding Description | Evidence Location |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **API-001** | Missing Endpoint | **MEDIUM** | `/api/videos/:id/unpublish` | No endpoint exists to withdraw or cancel an already-published video | `src/server/routes.ts` |
| **API-002** | Duplicate Endpoint | **MEDIUM** | `/api/scripts/ai-generate` vs `/api/phase15/script/generate` | Dual endpoints invoking same script generation service | `routes.ts:510` vs `routes.ts:1410` |
| **API-003** | Orphan Endpoint | **LOW** | `/api/taxonomy/export-schema` | Declared endpoint has zero frontend callers in codebase | `routes.ts:412` |
| **API-004** | Legacy Endpoint | **MEDIUM** | `/api/phase17/*` (6 routes) | Phase 17 routes superseded by canonical video routes | `routes.ts:1610-1680` |
| **API-005** | Wrong Route | **LOW** | `/api/search/questions` vs `/api/questions/search` | Inconsistent route nesting patterns across search | `routes.ts:380` |
| **API-006** | Wrong HTTP Method | **MEDIUM** | `/api/videos/:id/status` (POST) | State mutation uses POST instead of standard PATCH / PUT | `routes.ts:710` |
| **API-007** | Wrong Controller | **INFORMATIONAL** | `src/server/routes.ts` | All 270 routes defined in monolithic file without modular routers | `routes.ts` |
| **API-008** | Missing Authentication | **CRITICAL** | `/api/media/public-manifest` | Exposes raw Drive file IDs and filenames without auth check | `routes.ts:2190` |
| **API-009** | Incorrect Authentication | **MEDIUM** | `/api/system/version` | Returns 401 when public health ping expects 200 | `routes.ts:88` |
| **API-010** | Missing Authorization | **CRITICAL** | `POST /api/settings/sheets-config` | Any authenticated user can modify target Google Sheets ID | `routes.ts:1390` |
| **API-011** | Incorrect Authorization | **HIGH** | `DELETE /api/videos/:id` | Deletion allows any logged-in user; missing Admin role check | `routes.ts:810` |
| **API-012** | Missing Request Validation | **CRITICAL** | `POST /api/questions` | Backend does not enforce that options A, B, C, D are distinct | `routes.ts:220` |
| **API-013** | Conflicting Validation | **HIGH** | `POST /api/videos/:id/script` | UI permits 300s script duration; service enforces 180s max | `ScriptWorkspace` vs `script.service.ts` |
| **API-014** | Validation Bypass | **CRITICAL** | `POST /api/recovery/restore` | Backend route accepts `force: true` without verifying user string confirmation | `routes.ts:1510` |
| **API-015** | Wrong Payload | **MEDIUM** | `POST /api/planning/batches` | Omits curriculum standard field required by syllabus service | `routes.ts:1210` |
| **API-016** | Wrong Response | **LOW** | `POST /api/assignments/create` | Returns raw assignment ID instead of full populated assignment object | `routes.ts:1140` |
| **API-017** | Wrong Status Code | **LOW** | `POST /api/videos/:id/record` | Returns 200 OK instead of 201 Created on new take record | `routes.ts:685` |
| **API-018** | Wrong Service | **MEDIUM** | `/api/phase18/thumbnail/select` | Calls legacy thumbnail stub instead of canonical thumbnailService | `routes.ts:1780` |
| **API-019** | Service Bypass | **NONE** | All routes | Zero service bypasses; 100% of routes call domain services | N/A |
| **API-020** | Repository Bypass | **NONE** | All services | Services mediate storage via googleSheetsService adapter | N/A |
| **API-021** | Direct Storage Access | **NONE** | Route handlers | Route handlers contain zero direct Sheets/Drive API invocations | N/A |
| **API-022** | Wrong Storage | **INFORMATIONAL** | Question Drafts | Stored in ephemeral server memory instead of persistent storage | `question-draft.service.ts` |
| **API-023** | Partial Persistence Risk | **CRITICAL** | `POST /api/questions` | Questions write succeeds but Content Masters write fails on Sheets quota | `question.service.ts:180` |
| **API-024** | Duplicate Side Effect | **HIGH** | `POST /api/videos/:id/final-qc` | Consecutive invocations append duplicate QA signoff rows in AUDIT_LOG | `routes.ts:750` |
| **API-025** | Missing Audit Event | **MEDIUM** | `PATCH /api/videos/:id/metadata` | Metadata updates do not write an audit event to AUDIT_LOG | `routes.ts:790` |
| **API-026** | Unsafe Retry / Idempotency | **CRITICAL** | Mutating POST endpoints | Zero endpoints implement Idempotency-Key headers | All POST routes |
| **API-027** | Wrong Workflow State | **HIGH** | `POST /api/videos/:id/status` | Allows skipping intermediate conveyor stages | `video.service.ts:412` |
| **API-028** | Legacy Workflow Logic | **MEDIUM** | `/api/phase15/*` | Retains old 3-step script workflow superseded by 15-stage conveyor | `routes.ts:1400` |
| **API-029** | Contract Mismatch | **MEDIUM** | `GET /api/dashboard/overview` | Backend returns `activeVideos` as number; UI expects array | `DashboardPage.tsx:45` |
| **API-030** | Error Handling Problem | **HIGH** | Express catch blocks | Exposes raw Google API internal error messages to client | `routes.ts` catch blocks |
| **API-031** | Security Surface Problem | **HIGH** | Global Express config | Missing IP rate limiting middleware (`express-rate-limit`) | `server.ts` |
| **API-032** | AI Endpoint Problem | **HIGH** | `POST /api/questions/ai-generate`| No per-user quota or concurrency throttling on Gemini API | `routes.ts:310` |
| **API-033** | Upload Endpoint Problem | **MEDIUM** | `POST /api/media/upload` | Multer temporary files on disk not deleted on failed Drive upload | `routes.ts:2100` |
| **API-034** | Webhook Problem | **CRITICAL** | `POST /api/publishing/webhook/youtube` | Missing HMAC signature verification on external callback | `routes.ts:1180` |
| **API-035** | Requires Runtime Verification | **MEDIUM** | Google Sheets 429 Retry | Asynchronous exponential backoff behavior under sustained load | `google-sheets.service.ts` |
