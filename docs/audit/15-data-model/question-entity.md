# Question Business Entity Forensic Dossier

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 15 of 30  
**Document:** 10 of 51  

---

## 1. Question Identity & Physical Model

- **Canonical Name:** Question
- **Classification:** Business Entity (Core Curriculum Unit)
- **Primary Identifier:** `id` (Pattern: `BP-Q-XXXXXX`, 6 digits, e.g. `BP-Q-000042`)
- **Foreign Keys Held:**
  - `categoryId` -> `CATEGORIES.id` (`BP-CAT-XXX`)
  - `topicId` -> `TOPICS.id` (`BP-TOP-XXXX`)
  - `subtopicId` -> `SUBTOPICS.id` (`BP-SUB-XXXXXX`)
  - `contentMasterId` -> `CONTENT_MASTERS.id` (`BP-CNT-XXXXXX`)
- **Physical Representation:** Row in Google Sheets tab `QUESTIONS` (24 columns)
- **TypeScript Model:** `interface Question` (`src/types/index.ts:180–230`)
- **Repository:** `questionsRepository` (`src/lib/repositories/questions.repository.ts`)

---

## 2. Column-by-Column Schema Reconciliation

| Column Index | Sheet Header | TypeScript Property | Data Type | Nullable? | Description / Integrity Constraints |
| :---: | :--- | :--- | :---: | :---: | :--- |
| **A** | `id` | `id` | string | NO | Primary Key (`BP-Q-XXXXXX`) |
| **B** | `category_id` | `categoryId` | string | NO | FK to `CATEGORIES` |
| **C** | `topic_id` | `topicId` | string | NO | FK to `TOPICS` |
| **D** | `subtopic_id` | `subtopicId` | string | YES | Optional FK to `SUBTOPICS` |
| **E** | `question_text`| `questionText` | string | NO | Full question prompt in Telugu/English |
| **F** | `status` | `status` | enum | NO | `DRAFT`, `GENERATED`, `EDITING`, `APPROVED`, `REJECTED`, `ARCHIVED` |
| **G** | `validation_status`| `validationStatus`| enum | NO | `NOT_VALIDATED`, `VALIDATING`, `VALID`, `NEEDS_REVIEW`, `INVALID` |
| **H** | `video_status` | `videoStatus` | enum | YES | Replicated `VideoProductionStatus` (Competing State!) |
| **I** | `options` | `options` | JSON | NO | Array of exactly 4 MCQ options with `isCorrect` flag |
| **J** | `explanation` | `explanation` | string | NO | Pedagogical solution text in Telugu |
| **K** | `difficulty` | `difficulty` | enum | NO | `EASY`, `MEDIUM`, `HARD` |
| **L** | `created_by_user`| `createdByUser` | string | NO | User ID of creator |
| **M** | `content_master_id`| `contentMasterId` | string | YES | FK to parent `CONTENT_MASTERS` |
| **N** | `created_at` | `createdAt` | ISO date | NO | Creation timestamp |
| **O** | `updated_at` | `updatedAt` | ISO date | NO | Modification timestamp |

---

## 3. Critical Forensic Findings on Question Entity
1. **Competing `video_status` Column:** Column H stores `video_status` directly on the Question row. When a video advances in `VIDEOS` sheet, `video.service.ts` performs a secondary update to `QUESTIONS.video_status`. If the secondary write fails, the Question reports a stale video status.
2. **JSON Serialization in Sheets:** Column I stores `options` as a serialized JSON string. If a user manually edits the sheet cell and breaks JSON syntax, `questionsRepository.findAll()` throws an unhandled parsing error, crashing question listings.
