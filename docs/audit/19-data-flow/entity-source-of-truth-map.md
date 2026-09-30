# Entity Source-of-Truth Mapping

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 19 of 30  
**Document:** 03 of 35  

---

## 1. Detailed Entity Authority Profiles

### Entity: Question
- **AUTHORITATIVE SOURCE:** Google Sheets (`QUESTIONS` worksheet)
- **WHY THIS SOURCE IS AUTHORITATIVE:** All validation, status gates, unique ID queries, and business reads execute against `questionsRepository.findById()` and `questionsRepository.findAll()`.
- **EVIDENCE:** `src/lib/services/question.service.ts:229,300,521`; `src/lib/repositories/questions.repository.ts`.
- **OTHER REPRESENTATIONS:** In-memory `GoogleSheetsClient.rowCache` (2.5s TTL), React `useState` in `QuestionsListPage.tsx`, and Stage 01 `QUESTION_DRAFTS`.
- **REPRESENTATION TYPE:** `QUESTIONS` Sheet = AUTHORITATIVE; `rowCache` = CACHE; React State = CACHE; `QUESTION_DRAFTS` = PRECURSOR/DRAFT.
- **WRITERS:** `QuestionService.createQuestionFromRequest`, `QuestionService.updateQuestion`, `QuestionService.updateStatus`, `QuestionDraftService.approveDraft`.
- **READERS:** `QuestionService`, `VideoService`, `PlanningService`, `TaxonomyService`, `DataIntegrityService`, `MultiLayerVerificationEngine`.
- **SYNC MECHANISM:** Synchronous row update over HTTPS; invalidates client row cache.
- **CONFLICT POSSIBILITY:** High during concurrent edits; no optimistic row versioning (`_version` or `etag`).
- **CURRENT STATUS:** CONFIRMED SINGLE TABULAR AUTHORITY.

---

### Entity: Video
- **AUTHORITATIVE SOURCE:** Google Sheets (`VIDEOS` worksheet)
- **WHY THIS SOURCE IS AUTHORITATIVE:** Stores primary production status, assignment metadata, target duration, and Drive file linkage.
- **EVIDENCE:** `src/lib/services/video.service.ts:178,360,581`; `src/lib/repositories/videos.repository.ts`.
- **OTHER REPRESENTATIONS:** `Question.videoStatus` in `QUESTIONS` worksheet; `QUESTION_VIDEOS` join table; frontend workspace tabs.
- **REPRESENTATION TYPE:** `VIDEOS` Sheet = AUTHORITATIVE; `Question.videoStatus` = REPLICA; `QUESTION_VIDEOS` = REFERENCE.
- **WRITERS:** `VideoService.queueApprovedQuestion`, `VideoService.transitionStatus`, `VideoService.updateVideoMetadata`.
- **READERS:** `VideoService`, `ScriptService`, `ThumbnailService`, `PublishingService`, `DashboardService`.
- **SYNC MECHANISM:** Asynchronous best-effort update to `Question.videoStatus` wrapped in `try/catch` with `console.warn`.
- **CONFLICT POSSIBILITY:** **CRITICAL**. If the secondary update to `Question.videoStatus` fails, `Video.status` and `Question.videoStatus` permanently diverge.
- **CURRENT STATUS:** MULTIPLE / COMPETING STATE REPRESENTATIONS.

---

### Entity: Raw Video Binary
- **AUTHORITATIVE SOURCE:** Google Drive API v3
- **WHY THIS SOURCE IS AUTHORITATIVE:** Holds the actual media bytes, MIME type (`video/mp4`), byte length, and file hash.
- **EVIDENCE:** `src/lib/services/google-drive.service.ts:321-460`; `src/server/routes.ts:1715-1780`.
- **OTHER REPRESENTATIONS:** `Video.driveFileId` string in `VIDEOS` tab; `MediaAsset.driveFileId` in `MEDIA_ASSETS` tab.
- **REPRESENTATION TYPE:** Google Drive = AUTHORITATIVE; Sheets `driveFileId` = REFERENCE.
- **WRITERS:** `handleVideoUploadRoute` via Multer stream to `GoogleDriveService.uploadFile()`.
- **READERS:** Video streaming route (`/api/videos/:id/stream`), external YouTube upload workers.
- **SYNC MECHANISM:** Manual write cascade: file uploaded to Drive first; file ID written to Sheets second.
- **CONFLICT POSSIBILITY:** **CRITICAL**. Non-atomic cascade: if Sheets write fails, binary file is permanently orphaned in Google Drive.
- **CURRENT STATUS:** DUAL-SYSTEM ASYMMETRIC AUTHORITY.

---

### Entity: Content Master
- **AUTHORITATIVE SOURCE:** Google Sheets (`CONTENT_MASTERS` worksheet)
- **WHY THIS SOURCE IS AUTHORITATIVE:** Canonical anchor unifying Question, Video, Script, and Drive hierarchy.
- **EVIDENCE:** `src/lib/services/content-master.service.ts:50-120`; `src/lib/repositories/content-masters.repository.ts`.
- **OTHER REPRESENTATIONS:** `Question.contentMasterId`, `Question.contentId`, `Video.contentMasterId`, Google Drive folder `BP-CNT-######`.
- **REPRESENTATION TYPE:** `CONTENT_MASTERS` = AUTHORITATIVE; Entity fields = REFERENCES; Drive folder = PHYSICAL REPLICA.
- **WRITERS:** `ContentMasterService.createContentMaster`.
- **READERS:** All lifecycle workspace services.
- **SYNC MECHANISM:** Sequential creation during question creation; compensation delete if question persistence fails.
- **CONFLICT POSSIBILITY:** Dual ID naming (`contentId` vs `contentMasterId`) in legacy rows.
- **CURRENT STATUS:** CONFIRMED SINGLE TABULAR AUTHORITY.

---

### Entity: User Session & Authentication State
- **AUTHORITATIVE SOURCE:** Server Process In-Memory State (`UsersRepository.userSessionStates`)
- **WHY THIS SOURCE IS AUTHORITATIVE:** Determines whether an issued JWT is active, expired, or revoked based on in-memory version counter.
- **EVIDENCE:** `src/lib/repositories/audit-log.repository.ts:84-88`; `src/lib/services/auth.service.ts:254-388`.
- **OTHER REPRESENTATIONS:** `USERS.session_version` in Google Sheets (persisted only on explicit logout); client `localStorage.bp_session_token`.
- **REPRESENTATION TYPE:** In-Memory Map = AUTHORITATIVE; Sheets = ARCHIVAL REPLICA; `localStorage` = CLIENT TOKEN.
- **WRITERS:** `AuthService.login`, `AuthService.logout`.
- **READERS:** `requireAuth` Express middleware on every authenticated API request.
- **SYNC MECHANISM:** Lazy write back to Sheets on logout; container memory wiped on restart.
- **CONFLICT POSSIBILITY:** **CRITICAL RISK ON CLOUD RUN**. Container restarts or multi-instance scaling invalidate or bifurcate session tracking.
- **CURRENT STATUS:** VOLATILE IN-MEMORY AUTHORITY.
