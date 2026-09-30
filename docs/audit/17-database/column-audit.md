# Database Column Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 17 of 30  
**Document:** 07 of 39  

---

## 1. Column Inventory & Data Type Distribution

Across the 25 primary schemas, **368 distinct column definitions** exist. Because Google Sheets stores all cell values as text strings or formatted primitives, data types are enforced by TypeScript serialization/deserialization:

| Serialized Data Type | Column Count | Storage Representation in Google Sheets | Deserialization Parser |
| :--- | :---: | :--- | :--- |
| **string** | 214 | Plain text cell | Direct string passthrough |
| **number** | 48 | Formatted numeric cell | `Number(cell)` or `parseInt(cell, 10)` |
| **boolean** | 32 | `TRUE` / `FALSE` string | `cell === 'TRUE' || cell === true` |
| **date / timestamp** | 46 | ISO 8601 string (`YYYY-MM-DDTHH:mm:ss.sssZ`) | `new Date(cell)` |
| **json / array** | 28 | JSON stringified text (`["item1", "item2"]`) | `JSON.parse(cell)` with try/catch fallback |

---

## 2. Critical Table Column Analysis

### 1. Table `QUESTIONS` (38 Columns)
- `id` (string, PK, e.g. `BP-Q-000001`)
- `code` (string, legacy identifier)
- `category_id` (string, logical FK to CATEGORIES)
- `topic_id` (string, logical FK to TOPICS)
- `subtopic_id` (string, logical FK to SUBTOPICS)
- `question_text` (string, main stem)
- `option_a`, `option_b`, `option_c`, `option_d` (strings, 4 multiple choice options)
- `correct_option` (string, 'A' | 'B' | 'C' | 'D')
- `explanation` (string, detailed pedagogical rationale)
- `difficulty` (string, 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED')
- `language` (string, 'TE' | 'EN')
- `status` (string, QuestionStatus enum)
- `validation_status` (string, QuestionValidationStatus enum)
- `validation_score` (number, algorithmic quality score 0-100)
- `video_ids` (string, JSON serialized array of linked video IDs)
- `created_at`, `updated_at`, `created_by`, `updated_by` (audit fields)

### 2. Table `VIDEOS` (32 Columns)
- `id` (string, PK, e.g. `BP-V-000001`)
- `question_id` (string, logical FK to QUESTIONS)
- `content_id` (string, legacy content ID)
- `content_master_id` (string, canonical FK to CONTENT_MASTERS)
- `status` (string, VideoProductionStatus enum)
- `priority` (string, PriorityLevel enum)
- `teleprompter_script` (string, formatted script text)
- `drive_raw_folder_id`, `drive_edit_folder_id`, `drive_final_url` (Google Drive references)
- `assigned_editor_id`, `assigned_presenter_id` (logical FKs to USERS)

---

## 3. Schema Drift & Column Anomalies

1. **JSON Stringified Columns in Tabular Cells:**  
   28 columns store complex objects or arrays as raw JSON strings (e.g. `QUESTIONS.video_ids`, `CONTENT_PLANS.target_dates`, `SOCIAL_REVIEWS.checklist`). If manual edits are made in Google Sheets, malformed JSON causes runtime `SyntaxError` during deserialization.
2. **Redundant Columns:**  
   - `VIDEOS.content_id` vs `VIDEOS.content_master_id` (both point to content master).
   - `TOPICS.category_name` (denormalized duplicate of `CATEGORIES.name`).
