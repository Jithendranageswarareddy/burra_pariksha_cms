# Runtime State Machine Verification Requirements

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 13 of 30  
**Document:** 29 of 30  

---

## 1. Purpose of Runtime Verification

Due to the strict read-only nature of Step 13, dynamic behaviors involving multi-user concurrency, API error responses, and live Google Sheets rate limits could not be actively simulated. The following **14 verification scenarios** must be executed in a dedicated staging environment:

---

## 2. Test Verification Matrix

| Test ID | Target State Machine | Verification Objective | Expected Dynamic Behavior |
| :--- | :--- | :--- | :--- |
| **RTV-WF-01** | Video Transition Discrepancy | Trigger "Return to Recording" from `FINAL_REVIEW` via UI button | Confirm UI displays 400 error due to backend Definition A rejecting transition |
| **RTV-WF-02** | Auto-Advance Guard | Upload edited cut to `POST /phase17/video/:id/transition-editing` for `QUEUED` video | Confirm video status forcibly jumps to `EDITING` bypassing script/recording |
| **RTV-WF-03** | Gate B Enforcement | Attempt to queue video for question with `status: DRAFT` | Confirm server rejects with `ValidationError` ("Gate B Violation") |
| **RTV-WF-04** | Gate F Enforcement | Attempt to schedule publishing for video in `EDITING` status | Confirm server rejects with `ValidationError` ("Gate F Violation") |
| **RTV-WF-05** | Optimistic Lock Collision | Submit social review with mismatched `versionHash` | Confirm server rejects with HTTP 409 Conflict |
| **RTV-WF-06** | Idempotent Replay | Call `workflowOrchestrationService.transitionToCanonicalState` twice | Confirm second invocation is a safe no-op returning identical summary |
| **RTV-WF-07** | Duplicate Queue Hazard | Click "Queue Video" twice within 100ms in UI | Check if two rows are created in `VIDEOS` sheet |
| **RTV-WF-08** | Multi-Platform Partial Failure | Mock Instagram API failure during publishing execution | Verify if YouTube remains published and how retry handles YouTube |
| **RTV-WF-09** | Terminal Cancellation Restore | Attempt to update video from `CANCELLED` to `QUEUED` via API | Verify that `VALID_VIDEO_TRANSITIONS` strictly blocks reactivation |
| **RTV-WF-10** | Assignment Completion Sync | Complete video production through to `UPLOADED` | Check if linked assignment in `ASSIGNMENTS` sheet remains `IN_PROGRESS` |
| **RTV-WF-11** | Competing Write Race | Dispatch concurrent status updates to `VIDEOS` from two worker threads | Confirm if last write silently overwrites intermediate states |
| **RTV-WF-12** | Master Multi-Video Deadlock| Link 2 videos to Master; complete Video 1, cancel Video 2 | Verify if Master completion is permanently deadlocked |
| **RTV-WF-13** | Workflow Sheet Logging | Trigger status update via `phase17VideoProductionService` | Inspect `WORKFLOW` sheet tab to confirm missing log row |
| **RTV-WF-14** | Question Status Bypass | Send `PATCH /api/questions/:id/status` with `APPROVED` on invalid question | Verify if status is updated despite invalid options |
