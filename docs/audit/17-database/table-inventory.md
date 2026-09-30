# Database Table Inventory

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 17 of 30  
**Document:** 06 of 39  

---

## 1. Master Table Inventory Matrix

In BP-CMS, each Google Sheets tab acts as a physical database table. The following table provides the comprehensive master inventory:

| Schema / Tab | Physical Table Name | Domain Entity | Primary Key | Foreign Keys (Logical) | Storage Indexes | Calling Repositories | Production Status |
| :--- | :--- | :--- | :---: | :--- | :---: | :--- | :---: |
| `CONTENT_MASTERS` | `CONTENT_MASTERS` | ContentMaster | `id` | `topic_id`, `category_id` | None | `ContentMastersRepository` | **ACTIVE** |
| `USERS` | `USERS` | User | `id` | None | None | `UsersRepository` | **ACTIVE** |
| `CATEGORIES` | `CATEGORIES` | Category | `id` | None | None | `CategoriesRepository` | **ACTIVE** |
| `TOPICS` | `TOPICS` | Topic | `id` | `category_id` | None | `TopicsRepository` | **ACTIVE** |
| `SUBTOPICS` | `SUBTOPICS` | Subtopic | `id` | `topic_id`, `category_id` | None | `SubtopicsRepository` | **ACTIVE** |
| `QUESTIONS` | `QUESTIONS` | Question | `id` | `topic_id`, `subtopic_id`, `author_id` | None | `QuestionsRepository` | **ACTIVE** |
| `QUESTION_VIDEOS` | `QUESTION_VIDEOS` | QuestionVideo | `id` | `question_id`, `video_id` | None | `QuestionVideosRepository` | **LOW USAGE** |
| `VIDEOS` | `VIDEOS` | Video | `id` | `question_id`, `content_id` | None | `VideosRepository` | **ACTIVE** |
| `SCRIPT` | `SCRIPT` | Script | `id` | `video_id`, `author_id` | None | `ScriptsRepository` | **ACTIVE** |
| `SCRIPT_VERSIONS` | `SCRIPT_VERSIONS` | ScriptVersion | `id` | `script_id`, `video_id` | None | `ScriptsRepository` | **ACTIVE** |
| `THUMBNAILS` | `THUMBNAILS` | Thumbnail | `id` | `video_id`, `designer_id` | None | `ThumbnailsRepository` | **ACTIVE** |
| `THUMBNAIL_VERSIONS`| `THUMBNAIL_VERSIONS`| ThumbnailVersion| `id` | `thumbnail_id`, `video_id` | None | `ThumbnailsRepository` | **ACTIVE** |
| `PINNED_COMMENTS` | `PINNED_COMMENTS` | PinnedComment | `id` | `video_id`, `author_id` | None | `PinnedCommentsRepository`| **ACTIVE** |
| `PINNED_COMMENT_VERSIONS`| `PINNED_COMMENT_VERSIONS`| PinnedCommentVersion| `id` | `comment_id`, `video_id` | None | `PinnedCommentsRepository`| **ACTIVE** |
| `WORKFLOW` | `WORKFLOW` | WorkflowTransition | `id` | `entity_id`, `actor_id` | None | `WorkflowRepository` | **ACTIVE** |
| `ASSIGNMENTS` | `ASSIGNMENTS` | Assignment | `id` | `entity_id`, `assignee_id` | None | `AssignmentsRepository` | **ACTIVE** |
| `PUBLISHING` | `PUBLISHING` | PublishingRecord | `id` | `video_id`, `publisher_id` | None | `PublishingRepository` | **ACTIVE** |
| `AUDIT_LOG` | `AUDIT_LOG` | AuditEvent | `id` | `entity_id`, `user_id` | None | `AuditLogRepository` | **ACTIVE** |
| `SOCIAL_REVIEWS` | `SOCIAL_REVIEWS` | SocialReview | `id` | `content_id`, `reviewer_id`| None | `SocialReviewsRepository` | **ACTIVE** |
| `SEQUENCES` | `SEQUENCES` | Sequence | `entity_type`| None | None | `SequencesRepository` | **ACTIVE** |
| `CONTENT_PLANS` | `CONTENT_PLANS` | ContentPlan | `id` | `created_by` | None | `ContentPlansRepository` | **ACTIVE** |
| `CONTENT_BATCHES` | `CONTENT_BATCHES` | ContentBatch | `id` | `plan_id`, `assigned_to` | None | `ContentBatchesRepository` | **ACTIVE** |
| `QUESTION_VALIDATIONS`| `QUESTION_VALIDATIONS`| ValidationRecord| `id` | `question_id` | None | `ValidationsRepository` | **ACTIVE** |
| `QUESTION_CONFIG` | `QUESTION_CONFIG` | ConfigEntry | `id` | None | None | `QuestionConfigRepository`| **ACTIVE** |
| `MEDIA_ASSETS` | `MEDIA_ASSETS` | MediaAsset | `id` | `video_id`, `uploader_id` | None | `MediaAssetsRepository` | **ACTIVE** |

---

## 2. Table Lifecycle Observations
- **0 Physical SQL Tables:** Every table is a worksheet tab accessible via Google Sheets REST API.
- **Physical Limits:** Google Sheets caps each worksheet at 10,000,000 cells or approximately 40,000 to 100,000 rows depending on column width.
- **Table `QUESTION_VIDEOS`:** Redundant join table. Relationships are duplicated in `QUESTIONS.video_ids` (JSON string).
