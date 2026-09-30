# Data Replication Map

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 19 of 30  
**Document:** 15 of 35  

---

## 1. Catalog of Replicated Fields & Entities

Replication occurs where a value originating in one authoritative entity is copied into another entity for performance, convenience, or legacy reasons.

| Authoritative Field | Replicated Location | Why Copied | How Copied | Copy Direction | Update Propagation | Consistency Model | Conflict Risk |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **Video.status** | `Question.videoStatus` | UI list filtering in Questions table | Async in `VideoService.transitionStatus` | Video -> Question | Non-atomic best effort (swallows error) | Eventual / Broken | **CRITICAL** |
| **Thumbnail.status** | `Publishing.thumbnailReady`| Publishing readiness gate check | Async in `ThumbnailService.saveThumbnail` | Thumbnail -> Publishing | Checked if `pub` exists | Best-effort | **HIGH** |
| **PinnedComment.status**| `Publishing.pinnedCommentReady`| Publishing readiness gate check | Async in `PublishingService.validateReadiness`| Comment -> Publishing | Calculated during read | Strong (Calculated) | **LOW** |
| **Category.name** | `Question.categoryName` | Avoid table joins on question listing | Synchronous on question create | Taxonomy -> Question | Never updated on category rename | Denormalized Stale | **HIGH** |
| **Topic.name** | `Question.topicName` | Avoid table joins on question listing | Synchronous on question create | Taxonomy -> Question | Never updated on topic rename | Denormalized Stale | **HIGH** |
| **Subtopic.name** | `Question.subtopicName` | Avoid table joins on question listing | Synchronous on question create | Taxonomy -> Question | Never updated on subtopic rename | Denormalized Stale | **HIGH** |
| **Script.currentVersion**| `SCRIPT_VERSIONS` rows | Historical audit & diffing | Appended on `saveScript` | Script -> ScriptVersion | Sequential append | Best-effort | **MEDIUM** |
| **User.sessionVersion**| In-memory `userSessionStates` | JWT token revocation checking | Read on startup; mutated in RAM | Sheets -> Memory | Written back on explicit logout | Desynchronized | **CRITICAL** |
