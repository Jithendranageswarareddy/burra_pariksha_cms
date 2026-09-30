# Action Problem Register (ACT-001 through ACT-035)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 09 of 30  
**Document:** 31 of 30  

---

## 1. Action Problem Classification Register

| Finding ID | Classification | Location / Component | Problem Summary | Risk Level |
| :--- | :--- | :--- | :--- | :---: |
| **ACT-001** | Does Nothing | `PlanningPage.tsx:412, 445` | "Export Plan" and "Batch Print" buttons are stubs with empty/console.log handlers | LOW |
| **ACT-002** | Wrong Intent | `QuestionStudioPage.tsx:810` | "Cancel" button silently discards draft question without confirmation dialog | MEDIUM |
| **ACT-003** | Wrong Permission | `RecordingWorkspace.tsx` | "Save Take" button visible to non-presenter roles in tab | LOW |
| **ACT-004** | Permission Bypass | `RecoveryAdminPage.tsx` | Non-admin users can access disaster restore route directly via browser address bar | **CRITICAL** |
| **ACT-005** | Missing Frontend Validation| `PlanningPage.tsx:320` | Quick batch creation lacks syllabus topic ID validation | HIGH |
| **ACT-006** | Missing Backend Validation | `src/server/routes.ts:1840` | `/api/publishing/schedule` accepts past datetimes without validation error | MEDIUM |
| **ACT-007** | Validation Bypass | `src/server/routes.ts:892` | Direct verification API call defaults checklist to true if omitted | HIGH |
| **ACT-008** | Wrong Endpoint | `PlanningPage.tsx:188` | Calls server-wide `/api/health` instead of batch health status | LOW |
| **ACT-009** | Wrong HTTP Method | None discovered | All mutating endpoints use `POST` or `PUT` | INFORMATIONAL |
| **ACT-010** | Wrong Payload | `SocialReviewPage.tsx:142` | Sends redundant unneeded legacy fields in approve review payload | LOW |
| **ACT-011** | Wrong ID | `QuestionImprovePage.tsx:142` | Can save updates using `BP-DFT-*` without syncing canonical `BP-Q-*` | HIGH |
| **ACT-012** | Wrong Data Mutation | `TeamOperationsPage.tsx:165` | Reassigning user omits updating secondary cache in `usersRepository` | MEDIUM |
| **ACT-013** | Missing Service Validation | `question.service.ts` | Does not verify whether video already exists before creating another on re-verify | HIGH |
| **ACT-014** | Wrong Service | `ThumbnailWorkspace.tsx` | Calls legacy `Phase18ThumbnailIntelligenceService` instead of `ThumbnailService`| MEDIUM |
| **ACT-015** | Wrong Business Rule | `ScriptWorkspace.tsx` | Spoken duration warning allows proceeding despite exceeding 90-second boundary | LOW |
| **ACT-016** | Invalid State Transition | `ProductionTrackerPage.tsx` | Kanban drag-and-drop can skip Stage 07 (QC) directly to Stage 08 (Thumbnail) | **CRITICAL** |
| **ACT-017** | Legacy Workflow Logic | `VideoCreateScriptPage.tsx` | Standalone script generator executes deprecated Phase 15 pipeline code | MEDIUM |
| **ACT-018** | Missing Persistence | `PlanningPage.tsx` | Batch sprint notes written to temporary state but omitted from Google Sheets | HIGH |
| **ACT-019** | Partial Persistence | `QuestionVerifyApprovePage.tsx`| If video creation fails after question update, question is marked verified with no video! | **CRITICAL** |
| **ACT-020** | Duplicate Persistence | `QuestionStudioPage.tsx` | Draft questions written to both `QuestionDrafts` and in-memory cache simultaneously | LOW |
| **ACT-021** | Missing Audit Event | `ThumbnailWorkspace.tsx:298` | Thumbnail approval omits calling `auditService.logEvent()` | MEDIUM |
| **ACT-022** | Wrong Audit Event | `VideoService.submitRoughCut` | Logs `VIDEO_UPDATED` instead of specific `ROUGH_CUT_SUBMITTED` event | LOW |
| **ACT-023** | Stale UI | `SettingsPage.tsx` | Taxonomy changes do not trigger automated refresh of category dropdowns | MEDIUM |
| **ACT-024** | Missing UI Refresh | `PlanningPage.tsx` | Raw fetch mutations do not invalidate React Query cache | HIGH |
| **ACT-025** | Wrong Navigation | `NotFoundPage.tsx:48` | Secondary action uses `navigate(-1)` which breaks on external bookmark entry | HIGH |
| **ACT-026** | Navigation Before Success | None discovered | All checked actions await API promise resolution before navigating | INFORMATIONAL |
| **ACT-027** | Navigation After Failure | `QuestionVerifyApprovePage` error| Navigates to `/studio` on error catch without presenting error message | MEDIUM |
| **ACT-028** | Hidden Side Effects | `QuestionVerifyApprovePage.tsx`| Single click performs 6 separate writes and entity allocations | HIGH |
| **ACT-029** | Duplicate Action Impl | `QuestionStudioPage` vs `PlanningPage`| Two distinct question authoring forms with divergent validation | MEDIUM |
| **ACT-030** | Legacy Action | `ProductionBoardPage.tsx` | Unrouted page contains dead legacy actions | LOW |
| **ACT-031** | Orphan Action | `VideoPinnedCommentPage.tsx`| Unrouted actions for pinned comments superseded by tab | LOW |
| **ACT-032** | Incorrect Error Handling | `PlanningPage.tsx` | Catches errors with empty `catch (err) {}` swallowing network errors | HIGH |
| **ACT-033** | Incorrect Loading Handling | `PlanningPage.tsx` | Action buttons lack loading spinners during network requests | HIGH |
| **ACT-034** | Multiple Responsibility Action | `RecoveryAdminPage.tsx` | Single confirmation triggers backup download, sheet wipe, and batch insert | HIGH |
| **ACT-035** | Requires Runtime Verification | Gemini Live Text Stream | Live token chunking requires browser execution test | MEDIUM |
