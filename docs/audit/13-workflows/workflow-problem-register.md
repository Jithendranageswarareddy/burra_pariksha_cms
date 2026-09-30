# Master Workflow & State Engine Problem Register

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 13 of 30  
**Document:** 28 of 30  

---

## 1. Classified Workflow Problem Findings (29 Issues)

| Problem ID | Category | Severity | Component / Area | Description of Defect | Evidence Location |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **WF-CRIT-01** | Gate Bypass | **CRITICAL** | `phase17VideoProductionService` | Auto-advance guard jumps `QUEUED -> EDITING`, skipping scriptwriting & recording | `phase17:382` |
| **WF-CRIT-02** | State Discrepancy | **CRITICAL** | `constants.ts` vs `video.service` | `FINAL_REVIEW` allows `RECORDING` in UI, but backend rejects with 400 error | `constants.ts:258` |
| **WF-CRIT-03** | Competing Writers | **CRITICAL** | Video `status` Column | 4 competing services overwrite status without concurrency locks | `competing-state-writers.md` |
| **WF-CRIT-04** | Partial Transaction| **CRITICAL** | `videoService.queueApprovedQuestion`| Multi-sheet cascade fails midway; leaves orphaned video without question join | `video.service.ts:280` |
| **WF-CRIT-05** | Irreversible State | **CRITICAL** | Video `CANCELLED` | Accidental cancellation is permanent; zero restore/reactivate paths exist | `terminal-state-hazards.md` |
| **WF-CRIT-06** | Gate Bypass | **CRITICAL** | `PATCH /api/videos/:id/status` | Direct status patch to `UPLOADED` skips thumbnail, QC checklist, and live YouTube URL | `routes.ts:740` |
| **WF-HIGH-01** | Dual Enums | **HIGH** | `CanonicalWorkflowState` | Two conflicting enums with identical name and incompatible states | `canonical-workflow-divergence.md` |
| **WF-HIGH-02** | Multi-Platform Sync| **HIGH** | `PublishingService` | Single platform failure marks entire package FAILED; retry risks duplicate post | `publishing.service.ts:445` |
| **WF-HIGH-03** | Multi-Video Master | **HIGH** | `ContentMasterService` | Cancelling 1 of multiple linked videos permanently blocks master completion | `content-master.service.ts:417` |
| **WF-HIGH-04** | Unlinked Assignment| **HIGH** | `AssignmentService` | Completing video does not auto-complete assignment; skews team metrics | `assignment.service.ts:1310` |
| **WF-HIGH-05** | Missing Audit Log | **HIGH** | `phase17VideoProductionService` | Status mutation to `EDITING` fails to write to `WORKFLOW` sheet | `phase17:390` |
| **WF-HIGH-06** | Concurrency Race | **HIGH** | Entire Sheet Store | Lack of optimistic locking version counters exposes 90% of tables to races | `stale-state-detection.md` |
| **WF-HIGH-07** | God Service | **HIGH** | `PublishingService` | 2,168-line service bypasses orchestrator to execute localized workflow checks | `publishing.service.ts` |
| **WF-HIGH-08** | Invariant Leakage | **HIGH** | `PATCH /api/questions/:id/status`| Allows setting APPROVED on question with invalid options or missing explanation | `routes.ts:512` |
| **WF-HIGH-09** | Replay Vulnerability| **HIGH** | `videoService.queueApprovedQuestion`| Non-idempotent; re-clicking button creates duplicate video records | `video.service.ts:287` |
| **WF-HIGH-10** | Snapshot Bypass | **HIGH** | `FullSnapshotRestoreService` | Restores historical rows blindly; regresses published videos without workflow trace | `full-snapshot-restore.service.ts`|
| **WF-HIGH-11** | Dead-End State | **HIGH** | Assignment `COMPLETED` | Completed assignment cannot be reopened if post-QC flaws are found | `terminal-state-hazards.md` |
| **WF-HIGH-12** | Disconnected Adapt | **HIGH** | `PlatformAdaptationService` | Publishing engine does not enforce adaptation approval before distribution | `platform-adaptation.service.ts` |
| **WF-HIGH-13** | Loopback Disconnect| **HIGH** | Stage 15 to Stage 01 | Recommendations from `/analytics/strategy` are not populated in `/studio` | `canonical-workflow.ts:60` |
| **WF-HIGH-14** | Infinite Rejection | **HIGH** | Rejected Questions | Rejected questions stay in `QUESTIONS` indefinitely; no garbage collection | `question.service.ts` |
| **WF-HIGH-15** | State Desync | **HIGH** | Question Validation | `status` and `validationStatus` can diverge into contradictory states | `question.service.ts:835` |
| **WF-MED-01** | Ambiguous Role | **MEDIUM** | QC Sign-off | Allowed for both LEAD and ADMIN; lack of secondary sign-off on high-risk topics | `routes.ts` |
| **WF-MED-02** | HTTP Code Inconsistency| **MEDIUM** | Route Controllers | State errors return mix of 400, 409, 422, and unformatted 500s | `workflow-error-propagation.md` |
| **WF-MED-03** | Parallelism Block | **MEDIUM** | Conveyor Model | Strictly linear model blocks thumbnail creation until video editing completes | `workflow-conveyor-lifecycle.md` |
| **WF-MED-04** | In-Memory Lock Loss| **MEDIUM** | `AssignmentService` | `creationLockMap` lost on server reboot; allows concurrent duplicate assignments | `assignment.service.ts:87` |
| **WF-MED-05** | Cache Invalidation | **MEDIUM** | Idempotency Cache | 1,000-entry memory cache wiped on Cloud Run container rotation | `question.service.ts:98` |
| **WF-LOW-01** | UI Presentation Lag| **LOW** | Client Stepper | Conveyor bar requires manual page reload to reflect external background transitions| `VideoDetailPage.tsx` |
| **WF-LOW-02** | Teleprompter Counter| **LOW** | Take Counter | Client-side take increment desynchronized from video record in sheet | `RecordingWorkspace.tsx` |
| **WF-LOW-03** | Legacy Pending | **LOW** | Assignment Enum | Legacy `PENDING` status string retained in transition map | `assignment.service.ts:102` |
