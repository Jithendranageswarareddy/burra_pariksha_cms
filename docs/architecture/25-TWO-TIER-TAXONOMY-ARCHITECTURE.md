# 25 — 2-TIER TAXONOMY ARCHITECTURE SPECIFICATION (SPRINT 5)

## 1. Executive Summary & Architectural Mandate

In Sprint 5, Burra Pariksha CMS (BP-CMS) migrated from the legacy 3-tier taxonomy (`Category → Topic → Subtopic`) to a clean, authoritative **2-tier taxonomy**:

$$\text{Topic} \longrightarrow \text{Subtopic}$$

### Key Principles
1. **Topic is Top-Level**: A `Topic` is an autonomous root taxonomy entity with no parent container, no `categoryId`, and no `categoryName`.
2. **Subtopic Belongs Directly to Topic**: Every `Subtopic` references exactly one parent `Topic` via its mandatory foreign key `topicId`.
3. **Complete End-to-End Category Removal**: The legacy `Category` concept has been completely removed across:
   - Frontend UI (forms, matrices, filters, breadcrumbs, search)
   - Backend Services (`TaxonomyService`, `PlanningService`, `QuestionService`, `DashboardService`, `SimilarityService`, `VideoService`, etc.)
   - Repositories (deletion of `CategoriesRepository`, removal of `findByCategoryId`)
   - Domain Models & Types (`src/types/index.ts`, `src/types/route-contracts.ts`)
   - Validation & Schemas (`google-sheets-schema.ts`, `domain-schemas.ts`)
   - Firestore Persistence Model (`categories` collection removed from active registry)
   - ID Sequence Allocation (removal of `allocateCategoryId` and `SEQUENCE_ENTITIES.CATEGORY`)
   - Production Seed Data (`production-taxonomy.ts`, `firestore-production-initializer.service.ts`)
   - API Contracts (removal of `GET /categories`, `GET /categories/:id`, `POST /categories`, removal of `categoryId` query params)

---

## 2. Target Domain Models

### Topic (Root Taxonomy Entity)
```typescript
export interface Topic {
  id: string;            // e.g. "TOP-101" or "BP-TOP-001"
  name: string;          // e.g. "Time and Work"
  slug: string;          // e.g. "time-and-work"
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
  subtopicsCount?: number;
  createdAt: string;     // ISO timestamp
  updatedAt?: string;    // ISO timestamp
}
```

### Subtopic (Direct Child Entity)
```typescript
export interface Subtopic {
  id: string;            // e.g. "SUB-101-01" or "BP-SUB-001"
  topicId: string;       // Foreign key directly linking to Topic.id
  name: string;          // e.g. "Wages & Efficiency"
  slug: string;          // e.g. "wages-and-efficiency"
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
  createdAt: string;     // ISO timestamp
  updatedAt?: string;    // ISO timestamp
}
```

### Content Entities (Question, ContentMaster, ContentPlan)
All content artifacts reference taxonomy strictly via `topicId`, `topicName`, `subtopicId`, and `subtopicName`:
```typescript
export interface Question {
  id: string;
  topicId: string;
  topicName?: string;
  subtopicId: string;
  subtopicName?: string;
  difficulty: DifficultyLevel;
  language: QuestionLanguage;
  questionText: string;
  options: QuestionOptions;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: string;
  // ... other question fields (zero category fields)
}
```

---

## 3. Active REST API Endpoints

| Method | Endpoint | Description | Query / Body Parameters |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/topics` | List all topics | `search?: string`, `includeInactive?: boolean` |
| `GET` | `/api/topics/:id` | Fetch topic by ID | `id: string` |
| `GET` | `/api/subtopics` | List subtopics | `topicId?: string`, `includeInactive?: boolean` |
| `GET` | `/api/subtopics/:id` | Fetch subtopic by ID | `id: string` |
| `GET` | `/api/taxonomy/pure-tree` | Hierarchical 2-tier tree | `includeInactive?: boolean` |
| `GET` | `/api/taxonomy/summary` | Full summary of topics & subtopics | None |

> [!NOTE]
> All `/categories` routes (`GET /categories`, `GET /categories/:id`, `POST /categories`) have been permanently decommissioned.

---

## 4. Legitimate Generic Uses of "Category" (Preserved Type B)
In accordance with Sprint 5 specifications, non-taxonomy generic uses of the English word "category" remain preserved:
1. `IntegrityCategory`: Database/schema diagnostic categories (`'DATA_TYPE'`, `'FOREIGN_KEY'`, `'ID_INTEGRITY'`, etc.)
2. `ValidationCheckItem.category`: Structural question validation check areas (`'OPTION'`, `'ANSWER'`, `'METADATA'`)
3. `AIFailureCategory`: AI provider error classification (`'TIMEOUT'`, `'RATE_LIMITED'`, `'QUOTA_EXCEEDED'`)
4. `feedbackCategories`: Reviewer rejection reason tags (`'EDITORIAL'`, `'QUALITY'`, `'FACTUAL'`)
5. `statusCategory`: Stale content monitoring buckets (`'FRESH'`, `'WAITING'`, `'STALE'`)
6. `validateMediaUpload({ category: 'video' | 'thumbnail' | 'audio' })`: Media asset binary types
