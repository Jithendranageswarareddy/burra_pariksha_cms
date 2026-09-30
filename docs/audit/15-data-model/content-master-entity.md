# Content Master Entity Forensic Dossier

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 15 of 30  
**Document:** 12 of 51  

---

## 1. Content Master Identity & Role

- **Canonical Name:** Content Master
- **Classification:** Business Entity (Aggregate Root)
- **Primary Identifier:** `BP-CNT-XXXXXX` (6 digits, e.g. `BP-CNT-000018`)
- **Physical Representation:** Row in Google Sheets tab `CONTENT_MASTERS` (16 columns)
- **TypeScript Model:** `interface ContentMaster` (`src/types/index.ts:290–345`)
- **Repository:** `contentMastersRepository` (`src/lib/repositories/content-masters.repository.ts`)

---

## 2. Aggregate Invariants

Content Master serves as the single overarching container that links:
- One Primary Question (`primaryQuestionId`)
- Zero or more Derivative Videos (`linkedVideoIds: string[]`)
- Zero or more Social Packages (`socialReviewPackageId`)
- Aggregate Lifecycle Status (`status: ContentMasterStatus`)

---

## 3. Storage Column Mapping (`CONTENT_MASTERS`)

| Col | Header | Type | Description |
| :-: | :--- | :---: | :--- |
| **A** | `id` | string | Primary Key (`BP-CNT-XXXXXX`) |
| **B** | `title` | string | Editorial topic headline |
| **C** | `topic_id` | string | FK to `TOPICS` |
| **D** | `subtopic_id` | string | FK to `SUBTOPICS` |
| **E** | `primary_question_id` | string | FK to `QUESTIONS.id` |
| **F** | `status` | enum | `DRAFT`, `ACTIVE`, `COMPLETED`, `ARCHIVED` |
| **G** | `owner_id` | string | User ID of content manager |
| **H** | `created_at` | ISO date | Creation timestamp |
| **I** | `updated_at` | ISO date | Update timestamp |
