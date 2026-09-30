# Service Layer Execution Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 09 of 30  
**Document:** 09 of 30  

---

## 1. Service Layer Architecture

The backend repository contains **60+ specialized service classes** in `src/lib/services/`. Each action routes through one or more service methods that coordinate business logic, repository access, Google Sheets I/O, and audit events.

---

## 2. Service Invocation Register by Action

| Action ID | Triggering Action | Primary Service Class | Primary Method | Secondary Service Side-Effects |
| :--- | :--- | :--- | :--- | :--- |
| `ACT-QSTU-02` | Save Question | `QuestionService` | `createQuestion()` | `SequenceSafetyService.allocate()`<br>`AuditService.log()` |
| `ACT-QVER-01` | Approve Question | `QuestionService` | `verifyQuestion()` | `WorkflowOrchestrationService.createVideoRecord()`<br>`ContentMasterService.createContentMaster()` |
| `ACT-SCPT-01` | Approve Script | `ScriptService` | `approveScript()` | `AuditService.log()`<br>`Phase15ScriptProductionService` |
| `ACT-REC-01` | Record Footage | `VideoService` | `recordVideoTake()` | `GoogleDriveService.verifyFileAccess()` |
| `ACT-EDIT-01` | Submit Rough Cut | `VideoService` | `submitRoughCut()` | `AssignmentService.createAssignment()` |
| `ACT-QC-01` | Approve Cut | `VideoService` | `approveFinalQC()` | `Phase18ThumbnailIntelligenceService.init()` |
| `ACT-THUM-01` | Approve Thumbnail | `ThumbnailService` | `approveThumbnail()` | `Phase20SocialReviewService.createReview()` |
| `ACT-SOC-01` | Signoff Social | `SocialReviewService` | `approveReview()` | `Phase22PublishingHubService.stagePackage()` |
| `ACT-PUB-01` | Schedule Release | `PublishingService` | `scheduleRelease()` | `AuditService.log()` |
| `ACT-REST-01` | Execute Restore | `FullSnapshotRestoreExecutionService`| `executeRestore()` | `SnapshotSchedulerService`<br>`DurableSnapshotArchiveService` |
