# Foreign Key & Relationship Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 17 of 30  
**Document:** 09 of 39  

---

## 1. Relationship Inventory (32 Logical Foreign Keys)

A forensic audit of all repository classes and schema definitions reveals **32 logical relationships** across the 25 tables. **Zero foreign keys are enforced by the storage engine.**

| Source Table | Source Column | Target Table | Target Column | Cardinality | Application Cascade Rule |
| :--- | :--- | :--- | :--- | :---: | :--- |
| `TOPICS` | `category_id` | `CATEGORIES` | `id` | N : 1 | Deletion blocked if child topics exist |
| `SUBTOPICS` | `topic_id` | `TOPICS` | `id` | N : 1 | Deletion blocked if child subtopics exist |
| `QUESTIONS` | `category_id` | `CATEGORIES` | `id` | N : 1 | No storage cascade; app validation |
| `QUESTIONS` | `topic_id` | `TOPICS` | `id` | N : 1 | Deletion blocked if questions exist |
| `QUESTIONS` | `subtopic_id` | `SUBTOPICS` | `id` | N : 1 | Deletion blocked if questions exist |
| `QUESTIONS` | `created_by` | `USERS` | `id` | N : 1 | No check on user deletion |
| `VIDEOS` | `question_id` | `QUESTIONS` | `id` | N : 1 | Deletion safety service prevents cascade |
| `VIDEOS` | `content_master_id`| `CONTENT_MASTERS`| `id` | N : 1 | Many videos belong to one content master |
| `SCRIPT` | `video_id` | `VIDEOS` | `id` | 1 : 1 | One active script per video |
| `SCRIPT_VERSIONS` | `script_id` | `SCRIPT` | `id` | N : 1 | Multiple revisions per script |
| `THUMBNAILS` | `video_id` | `VIDEOS` | `id` | 1 : 1 | One active thumbnail per video |
| `PINNED_COMMENTS` | `video_id` | `VIDEOS` | `id` | 1 : 1 | One pinned comment package per video |
| `ASSIGNMENTS` | `assignee_id` | `USERS` | `id` | N : 1 | Task assigned to team member |
| `PUBLISHING` | `video_id` | `VIDEOS` | `id` | N : 1 | Multi-platform distribution per video |
| `WORKFLOW` | `entity_id` | `QUESTIONS` / `VIDEOS`| `id` | N : 1 | Polymorphic link to audited entity |
| `AUDIT_LOG` | `user_id` | `USERS` | `id` | N : 1 | Audit event actor ID |

---

## 2. Integrity Enforcement: Application vs Database

- **Database Foreign Keys:** **0**  
  Google Sheets API allows any text to be written into any cell. Writing `category_id: "CAT-NONEXISTENT"` succeeds immediately.
- **Application Validation:**  
  Referential integrity is enforced exclusively by `deletion-safety.service.ts` and repository validation logic prior to executing writes.
- **Orphan Record Risk:**  
  If a row is deleted directly in the Google Sheets UI or via an operational script without invoking `deletionSafetyService`, child rows in `QUESTIONS`, `VIDEOS`, and `ASSIGNMENTS` become permanent orphans.
