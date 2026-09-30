# Validation & Error-State Problem Register (31 Classified Findings)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 10 of 30  
**Document:** 28 of 30  

---

## 1. Master Forensic Problem Register

| Problem ID | Classification | Severity | Component / File | Specific Finding Description | Evidence Location |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **VAL-001** | Missing Required Validation | **CRITICAL** | `routes.ts` (`POST /api/questions`) | Backend accepts duplicate answer options (A == B == C == D); only client checks uniqueness! | `src/server/routes.ts:220` |
| **VAL-002** | Incorrect Required Field | **HIGH** | `routes.ts` (`POST /api/videos/:id/script`) | Route allows script submission with empty `hook` if full text is sent, breaking teleprompter | `src/server/routes.ts:510` |
| **VAL-003** | Client Validation Missing | **MEDIUM** | `TeamOperationsPage.tsx` | Dropdown allows assigning SUPER_ADMIN role without client-side permission check | `src/pages/TeamOperationsPage.tsx:180` |
| **VAL-004** | Server Validation Missing | **CRITICAL** | `routes.ts` (`POST /api/videos/:id/status`) | Endpoint allows advancing video to READY_TO_PUBLISH without verifying 12-point QC checklist | `src/server/routes.ts:740` |
| **VAL-005** | Client/Server Validation Conflict | **HIGH** | `ScriptWorkspace.tsx` vs `script.service.ts` | UI allows 300s script duration; service rejects duration > 180s | `ScriptWorkspace.tsx` vs `script.service.ts:114` |
| **VAL-006** | Validation Duplication | **LOW** | `QuestionStudioPage` & `routes.ts` | Question text length `>= 10` check duplicated across 3 layers | `QuestionStudioPage.tsx:120` |
| **VAL-007** | Validation Ownership Unclear | **MEDIUM** | `PublishingWorkspace.tsx` | Neither UI nor server owns validation for platform credential freshness | `src/components/video/PublishingWorkspace.tsx` |
| **VAL-008** | Validation Bypass | **CRITICAL** | `RecoveryAdminPage` vs `routes.ts` | Backend accepts `force: true` on snapshot restore without checking "RESTORE-SNAPSHOT" confirmation string | `src/server/routes.ts:1510` |
| **VAL-009** | Incorrect Validation Rule | **MEDIUM** | `PlanningPage.tsx` | Strict batch code regex `^[A-Z]{3}-\d{3}$` rejects valid legacy batch naming conventions | `src/pages/PlanningPage.tsx:142` |
| **VAL-010** | Incorrect Error Message | **MEDIUM** | `VideoDetailPage.tsx` | Displays "Invalid ID specified" when backend actually returned 403 Forbidden | `src/pages/VideoDetailPage.tsx:94` |
| **VAL-011** | Error Not Surfaced | **HIGH** | `QuestionDetailPage.tsx` | Catch block in `updateMetadata` logs to console without setting user error banner | `src/pages/QuestionDetailPage.tsx:184` |
| **VAL-012** | Error Swallowed | **HIGH** | `PlanningPage.tsx` | Asynchronous batch creation error caught and swallowed with zero UI notification | `src/pages/PlanningPage.tsx:312` |
| **VAL-013** | Missing Retry | **MEDIUM** | `PlanningPage.tsx` | On batch generation failure, no retry action is rendered; requires browser refresh | `src/pages/PlanningPage.tsx:320` |
| **VAL-014** | Unsafe Retry | **CRITICAL** | `QuestionStudioPage.tsx` | Retrying question save after network timeout creates duplicate question records | `src/pages/QuestionStudioPage.tsx:410` |
| **VAL-015** | Duplicate Submission Risk | **HIGH** | `VideoRecordPage.tsx` | Submit button not disabled during async request; double-click creates duplicate takes | `src/pages/VideoRecordPage.tsx:95` |
| **VAL-016** | Partial Save Risk | **CRITICAL** | `question.service.ts` | Question write succeeds but Content Master write fails; leaves orphaned record | `src/lib/services/question.service.ts:180` |
| **VAL-017** | Missing Rollback | **HIGH** | `QuestionDetailPage.tsx` | Optimistic metadata badge update has no rollback on server 500 error | `src/pages/QuestionDetailPage.tsx:190` |
| **VAL-018** | Incomplete Compensation | **HIGH** | `publishing.service.ts` | Multi-platform publish fails on Instagram; YouTube post not rolled back or flagged | `src/lib/services/publishing.service.ts:240` |
| **VAL-019** | Optimistic Update Without Rollback | **HIGH** | `SocialAnalyticsPage.tsx` | Sentiment pill updates immediately; on failure UI remains desynchronized | `src/pages/SocialAnalyticsPage.tsx:210` |
| **VAL-020** | Stale Data | **MEDIUM** | `DashboardPage.tsx` | Metrics cached on load; never refreshed after publishing completions | `src/pages/DashboardPage.tsx:65` |
| **VAL-021** | Missing Refresh | **MEDIUM** | `QuestionLibraryPage.tsx` | Modal approval does not invalidate table cache; requires manual page reload | `src/pages/QuestionLibraryPage.tsx:140` |
| **VAL-022** | Incorrect Loading State | **MEDIUM** | `QuestionStudioPage.tsx` | Uses text swap ("Saving...") without visual spinner indicator | `src/pages/QuestionStudioPage.tsx:450` |
| **VAL-023** | Stuck Loading State | **HIGH** | `PlanningPage.tsx` | Missing `finally { setIsLoading(false) }` leaves page permanently hung on network error | `src/pages/PlanningPage.tsx:325` |
| **VAL-024** | Incorrect Success State | **MEDIUM** | `QuestionStudioPage.tsx` | Navigates immediately to question detail before user can inspect step 4 summary | `src/pages/QuestionStudioPage.tsx:430` |
| **VAL-025** | Incorrect Error State | **MEDIUM** | `ScriptWorkspace.tsx` | Exposes raw backend error string containing Google Cloud API quota details | `src/components/video/ScriptWorkspace.tsx:280` |
| **VAL-026** | Incorrect Navigation After Failure | **HIGH** | `VideoDetailPage.tsx` | 401 session expiry unloads component and redirects to /login, losing unsaved script | `src/pages/VideoDetailPage.tsx:112` |
| **VAL-027** | Incorrect Navigation After Success | **MEDIUM** | `RecordingWorkspace.tsx` | Automatically navigates to editing tab after take submit, preventing immediate retake | `src/components/video/RecordingWorkspace.tsx:190` |
| **VAL-028** | Permission Validation Conflict | **HIGH** | `SettingsPage.tsx` | Settings route lacks backend permission guard; non-admin can POST config updates | `src/server/routes.ts:1390` |
| **VAL-029** | Workflow Validation Conflict | **HIGH** | `video.service.ts` | Status update endpoint permits skipping stages (e.g. RECORDED directly to PUBLISHED) | `src/lib/services/video.service.ts:412` |
| **VAL-030** | Concurrent Update Risk | **CRITICAL** | `ScriptWorkspace.tsx` | Last-write-wins without optimistic locking allows scriptwriter A to overwrite B | `src/lib/services/script.service.ts:88` |
| **VAL-031** | Requires Runtime Verification | **MEDIUM** | Google Sheets 429 Backoff | Real-world retry behavior under sustained concurrent API rate-limiting | `src/lib/services/google-sheets.service.ts:95` |
