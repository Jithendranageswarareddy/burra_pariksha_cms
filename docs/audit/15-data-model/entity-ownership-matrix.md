# Complete Entity Ownership Matrix

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 15 of 30  
**Document:** 42 of 51  

---

## 1. Master Ownership Matrix

| Entity | Creator | Owner | Reader | Updater | Deleter | Authoritative State Owner |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Question** | `QUESTION_CREATOR`, `SME` | Creator User | All Authenticated Users | `QUESTION_EDITOR`, `SME`, `ADMIN` | `ADMIN` (Soft Archive) | `QuestionService` |
| **Draft Question** | Any User / AI | Creator User | Creator User | Creator User | Creator User (Purge) | `QuestionDraftsRepository` |
| **Content Master** | System Automated | Assigned Content Lead | All Authenticated Users | `TOPIC_LEAD`, `ADMIN` | `ADMIN` (Soft Archive) | `ContentMasterService` |
| **Script** | `SCRIPT_WRITER` | Scriptwriter | All Authenticated Users | `SCRIPT_WRITER`, `SME` | None (Permanent Versions) | `ScriptService` |
| **Video** | `TOPIC_LEAD` | Assigned Editor & Host | All Authenticated Users | `VIDEO_EDITOR`, `LEAD` | `ADMIN` (Cancel Only) | `VideoService` |
| **Media Asset** | Editor / Talent | Uploader User | All Authenticated Users | `ADMIN` | `ADMIN` (Drive Delete) | `GoogleDriveService` |
| **Thumbnail** | Designer / AI | Graphic Designer | All Authenticated Users | `CONTENT_MANAGER`, `ADMIN`| None | `ThumbnailService` |
| **Pinned Comment** | Copywriter | Copywriter User | All Authenticated Users | `CONTENT_MANAGER`, `ADMIN`| None | `PinnedCommentService` |
| **Social Review** | System Automated | Assigned Reviewer | Reviewer, Lead, Admin | `TOPIC_LEAD`, `SME` | None | `SocialReviewService` |
| **Publishing** | System Automated | Publisher User | `PUBLISHER`, `ADMIN` | `PUBLISHER`, `ADMIN` | None | `PublishingService` |
| **Assignment** | `TOPIC_LEAD` | Assigned User | Assignee, Lead, Admin | Assignee, Lead | `ADMIN` (Cancel) | `AssignmentService` |
| **User** | `ADMIN` | Admin | `ADMIN` | `ADMIN` | `ADMIN` (Deactivate) | `UsersRepository` |
| **Audit Event** | System | System | `ADMIN` | None (Append Only) | None | `AuditService` |
| **Workflow Event**| System | System | All Authenticated Users | None (Append Only) | None | `WorkflowService` |
| **Sequence** | System | System | System | System | None | `SequenceSafetyService` |
