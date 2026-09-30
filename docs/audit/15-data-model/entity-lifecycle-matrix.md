# Complete Entity-Lifecycle Matrix

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 15 of 30  
**Document:** 36 of 51  

---

## 1. Master Lifecycle State Matrix

| Entity | Created By | Initial State | State Owner | Intermediate States | Updater | Terminal State |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Question** | User / AI | `DRAFT` / `GENERATED` | `QuestionService` | `EDITING`, `REJECTED`, `APPROVED` | SME, Lead | `ARCHIVED` |
| **Content Master**| System | `DRAFT` | `ContentMasterService`| `ACTIVE`, `READY_FOR_REVIEW`, `APPROVED`, `PUBLISHED` | Lead | `COMPLETED`, `ARCHIVED` |
| **Video** | Lead | `QUEUED` | `VideoService` | `SCRIPT_READY`, `RECORDED`, `EDITED`, `FINAL_REVIEW`, `READY_TO_UPLOAD` | Editor, Lead | `UPLOADED`, `CANCELLED` |
| **Script** | Writer / AI | `DRAFT` | `ScriptService` | `REVISION_REQUIRED` | Writer, SME | `APPROVED` |
| **Thumbnail** | Designer / AI | `DRAFT` | `ThumbnailService`| `PENDING_REVIEW`, `REJECTED` | Lead | `APPROVED` |
| **Social Review** | System | `PENDING_REVIEW` | `SocialReviewService`| `CHANGES_REQUESTED`, `STALE_REVISION_REQUIRED` | Lead, Reviewer | `APPROVED`, `REJECTED` |
| **Publishing** | System | `NOT_STARTED` | `PublishingService`| `DRAFT`, `SCHEDULED`, `FAILED` | Publisher | `PUBLISHED` |
| **Assignment** | Lead | `ASSIGNED` | `AssignmentService`| `IN_PROGRESS`, `BLOCKED` | Assignee | `COMPLETED`, `CANCELLED` |
