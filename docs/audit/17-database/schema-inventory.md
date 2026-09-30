# Database Schema Inventory

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 17 of 30  
**Document:** 05 of 39  

---

## 1. Schema Definitions in Codebase

In BP-CMS, schemas are not defined in SQL DDL files (`CREATE SCHEMA`), but rather in TypeScript schema contracts:
- **Location:** `src/lib/schemas/google-sheets-schema.ts`
- **Contract Type:** `SheetSchemaContract`
- **Total Registered Schemas:** **25 authoritative schemas** (23 core + 2 planning)

```typescript
export interface SheetSchemaContract {
  sheetName: SheetTabName;
  primaryKey: string;
  columns: SheetColumnDefinition[];
  allowUnknownColumns?: boolean;
}
```

---

## 2. Complete Inventory of the 25 Sheet Schemas

| # | Schema Name | Sheet Tab Name | Primary Key | Column Count | Domain Purpose |
| :-: | :--- | :--- | :---: | :-: | :--- |
| **01** | `CONTENT_MASTERS` | `CONTENT_MASTERS` | `id` | 12 | Master content umbrella aggregating questions, scripts & videos |
| **02** | `USERS` | `USERS` | `id` | 11 | Team members, authentication identities, RBAC roles, active flags |
| **03** | `CATEGORIES` | `CATEGORIES` | `id` | 7 | High-level educational domain taxonomy |
| **04** | `TOPICS` | `TOPICS` | `id` | 9 | Subject-specific topical groupings under categories |
| **05** | `SUBTOPICS` | `SUBTOPICS` | `id` | 10 | Granular educational sub-specialties under topics |
| **06** | `QUESTIONS` | `QUESTIONS` | `id` | 38 | Core educational quiz items, options, explanations, status |
| **07** | `QUESTION_VIDEOS` | `QUESTION_VIDEOS` | `id` | 5 | Many-to-many link table associating questions to video productions |
| **08** | `VIDEOS` | `VIDEOS` | `id` | 32 | Video production records, teleprompter specs, Drive asset links |
| **09** | `SCRIPT` | `SCRIPT` | `id` | 13 | Active video teleprompter scripts, hooks, CTA text |
| **10** | `SCRIPT_VERSIONS` | `SCRIPT_VERSIONS` | `id` | 7 | Historical revision log for script iterations |
| **11** | `THUMBNAILS` | `THUMBNAILS` | `id` | 16 | Video thumbnail designs, variants, Drive URLs, review status |
| **12** | `THUMBNAIL_VERSIONS`| `THUMBNAIL_VERSIONS`| `id` | 7 | Historical revision log for thumbnail designs |
| **13** | `PINNED_COMMENTS` | `PINNED_COMMENTS` | `id` | 9 | Engagement pinned comments per video asset |
| **14** | `PINNED_COMMENT_VERSIONS`| `PINNED_COMMENT_VERSIONS`| `id` | 5 | Revision history for pinned comments |
| **15** | `WORKFLOW` | `WORKFLOW` | `id` | 10 | Conveyor state transition audit trail |
| **16** | `ASSIGNMENTS` | `ASSIGNMENTS` | `id` | 18 | Task delegation to human creators, assignees, deadlines |
| **17** | `PUBLISHING` | `PUBLISHING` | `id` | 33 | Multi-platform publishing schedules, platform URLs, metadata |
| **18** | `AUDIT_LOG` | `AUDIT_LOG` | `id` | 8 | Immutable system event log, actor details, timestamps |
| **19** | `SOCIAL_REVIEWS` | `SOCIAL_REVIEWS` | `id` | 15 | Editorial quality control reviews, peer approvals |
| **20** | `SEQUENCES` | `SEQUENCES` | `entity_type`| 5 | Atomic sequence counters for business ID generation |
| **21** | `CONTENT_PLANS` | `CONTENT_PLANS` | `id` | 18 | Editorial strategy and batch planning umbrellas |
| **22** | `CONTENT_BATCHES` | `CONTENT_BATCHES` | `id` | 11 | Production batches grouping content plans |
| **23** | `QUESTION_VALIDATIONS`| `QUESTION_VALIDATIONS`| `id` | 17 | Automated algorithmic validation audit logs |
| **24** | `QUESTION_CONFIG` | `QUESTION_CONFIG` | `id` | 10 | System configuration and dynamic parameters |
| **25** | `MEDIA_ASSETS` | `MEDIA_ASSETS` | `id` | 12 | Raw footage, audio files, b-roll references in Google Drive |

---

## 3. Secondary Analytics Schemas (Spreadsheet 2)

In addition to the 25 primary schemas, 5 analytics schemas are declared in `src/lib/repositories/analytics.repository.ts` targeting `ANALYTICS_SPREADSHEET_ID`:
1. `SOCIAL_ANALYTICS` (YouTube, Instagram, Facebook engagement metrics)
2. `SOCIAL_COMMENTS` (Ingested audience comments and reactions)
3. `COMMENT_INTELLIGENCE` (Sentiment analysis, cluster classifications)
4. `SOCIAL_PERFORMANCE_INTELLIGENCE` (AI performance insights)
5. `STRATEGY_RECOMMENDATIONS` (Algorithmic content recommendations)
