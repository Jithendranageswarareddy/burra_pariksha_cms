# Entity State Ownership Forensic Matrix

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 15 of 30  
**Document:** 34 of 51  

---

## 1. Master State Ownership Matrix

| Entity | State Field | Authorized Writers in Code | Authoritative Domain Owner | Invariant Violation Risk |
| :--- | :--- | :--- | :--- | :---: |
| **Question** | `status` | `question.service.ts`, `question-validation.service.ts`, `phase13.service.ts`, `routes.ts` | `QuestionService` | **CRITICAL** |
| **Question** | `validation_status` | `question-validation.service.ts`, `question.service.ts` | `QuestionValidationService` | **HIGH** |
| **Video** | `status` | `video.service.ts`, `script.service.ts`, `phase17.service.ts`, `publishing.service.ts` | `VideoService` | **CRITICAL** |
| **Script** | `status` | `script.service.ts`, `phase15.service.ts`, `phase16.service.ts` | `ScriptService` | **MEDIUM** |
| **Thumbnail** | `status` | `thumbnail.service.ts`, `phase18.service.ts` | `ThumbnailService` | **MEDIUM** |
| **Publishing**| `status` | `publishing.service.ts`, `routes.ts` | `PublishingService` | **HIGH** |
| **Assignment**| `status` | `assignment.service.ts` | `AssignmentService` | **LOW** |
| **ContentMaster**| `status`| `content-master.service.ts` | `ContentMasterService` | **LOW** |
