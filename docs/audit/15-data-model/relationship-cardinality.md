# Relationship Cardinality Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 15 of 30  
**Document:** 27 of 51  

---

## 1. Cardinality Classification Matrix

| Association | Conceptual Intent | Actual Implementation Cardinality | Code Proof / Evidence |
| :--- | :---: | :---: | :--- |
| **Category -> Topic** | 1:N | **ONE-TO-MANY** | `TOPICS.category_id` references `CATEGORIES.id` |
| **Topic -> Subtopic** | 1:N | **ONE-TO-MANY** | `SUBTOPICS.topic_id` references `TOPICS.id` |
| **Content Master -> Question**| 1:1 (Primary) | **ONE-TO-ONE** | `CONTENT_MASTERS.primary_question_id` is unique string |
| **Content Master -> Video** | 1:N | **ONE-TO-MANY** | Multiple Videos hold same `content_master_id` |
| **Question -> Video** | 1:1 or 1:N | **MANY-TO-MANY (Bridge)** | `QUESTION_VIDEOS` sheet implements M:N join! |
| **Video -> Script** | 1:1 | **ONE-TO-ONE** | `SCRIPT.video_id` has unique constraint in service |
| **Script -> ScriptVersion** | 1:N | **ONE-TO-MANY** | `SCRIPT_VERSIONS` stores multiple revisions per script |
| **Video -> Thumbnail** | 1:1 (Approved) | **ONE-TO-MANY (Candidates)** | `THUMBNAIL_VERSIONS` stores multiple candidate designs |
| **Video -> PinnedComment** | 1:1 | **ONE-TO-ONE** | `PINNED_COMMENTS.video_id` holds 1 comment per video |
| **Video -> Publishing** | 1:1 | **ONE-TO-ONE** | `PUBLISHING.video_id` is unique per platform bundle |
| **User -> Assignment** | 1:N | **ONE-TO-MANY** | Multiple `ASSIGNMENTS` reference `assigned_user_id` |
| **User -> Question** | 1:N | **ONE-TO-MANY** | `QUESTIONS.created_by_user` references User |
