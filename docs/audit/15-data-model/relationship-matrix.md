# Complete Relationship Matrix

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 15 of 30  
**Document:** 44 of 51  

---

## 1. Master Relationship Matrix

| From Entity | Relationship | To Entity | Cardinality | Required? | Foreign Key Reference | Enforced Where |
| :--- | :---: | :--- | :---: | :---: | :--- | :--- |
| **Category** | has many | **Topic** | 1:N | YES | `TOPICS.category_id` | App validation (`taxonomyService`) |
| **Topic** | has many | **Subtopic** | 1:N | YES | `SUBTOPICS.topic_id` | App validation (`taxonomyService`) |
| **Topic** | has many | **Question** | 1:N | YES | `QUESTIONS.topic_id` | App validation (`questionService`) |
| **Content Master** | primary link | **Question** | 1:1 | YES | `CONTENT_MASTERS.primary_question_id`| App validation (`contentMasterService`)|
| **Content Master** | owns | **Video** | 1:N | NO | `VIDEOS.content_master_id` | App validation (`videoService`) |
| **Question** | associated with| **Video** | N:M | NO | `QUESTION_VIDEOS` bridge tab | App validation (`videoService`) |
| **Video** | has one | **Script** | 1:1 | YES | `SCRIPT.video_id` | Unique check in `scriptService` |
| **Script** | has many | **ScriptVersion**| 1:N | NO | `SCRIPT_VERSIONS.script_id` | Append-only repository method |
| **Video** | has one | **Thumbnail** | 1:1 | YES | `THUMBNAILS.video_id` | Unique check in `thumbnailService` |
| **Video** | has one | **PinnedComment**| 1:1 | NO | `PINNED_COMMENTS.video_id` | Unique check in `pinnedCommentService`|
| **Video** | has one | **Publishing** | 1:1 | YES | `PUBLISHING.video_id` | Auto-created on video queue |
| **Video** | has many | **MediaAsset** | 1:N | NO | `MEDIA_ASSETS.content_id` | Multipart upload handler |
| **User** | assigned to | **Assignment** | 1:N | YES | `ASSIGNMENTS.assigned_user_id`| App validation (`assignmentService`) |
