# Database Repository Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 17 of 30  
**Document:** 15 of 39  

---

## 1. Master Repository Inventory (34 Repository Files)

All repositories reside in `src/lib/repositories/`. 100% of repositories inherit from `BaseRepository<T>`:

| Repository Class | Target Sheet / Storage | Primary Operations | Calling Services |
| :--- | :--- | :--- | :--- |
| `QuestionsRepository` | `SHEET_TABS.QUESTIONS` | `findById`, `findAll`, `create`, `update`, `filterByTopic` | `QuestionService`, `WorkflowOrchestrationService` |
| `VideosRepository` | `SHEET_TABS.VIDEOS` | `findById`, `findByQuestionId`, `create`, `updateStatus` | `VideoService`, `ProductionService` |
| `ContentMastersRepository` | `SHEET_TABS.CONTENT_MASTERS` | `findById`, `create`, `updateStatus`, `findAll` | `ContentMasterService` |
| `UsersRepository` | `SHEET_TABS.USERS` | `findById`, `findByEmail`, `create`, `deactivate` | `UserService`, `AuthService` |
| `CategoriesRepository` | `SHEET_TABS.CATEGORIES` | `findAll`, `findById`, `create` | `TaxonomyService` |
| `TopicsRepository` | `SHEET_TABS.TOPICS` | `findAll`, `findByCategory`, `create` | `TaxonomyService` |
| `SubtopicsRepository` | `SHEET_TABS.SUBTOPICS` | `findAll`, `findByTopic`, `create` | `TaxonomyService` |
| `ScriptsRepository` | `SHEET_TABS.SCRIPT` | `findByVideoId`, `saveScript`, `createVersion` | `ScriptService`, `TeleprompterService` |
| `ThumbnailsRepository` | `SHEET_TABS.THUMBNAILS` | `findByVideoId`, `saveThumbnail`, `createVersion` | `ThumbnailService` |
| `PinnedCommentsRepository`| `SHEET_TABS.PINNED_COMMENTS`| `findByVideoId`, `saveComment` | `SocialService` |
| `PublishingRepository` | `SHEET_TABS.PUBLISHING` | `findByVideoId`, `updatePlatformStatus` | `PublishingService` |
| `AssignmentsRepository` | `SHEET_TABS.ASSIGNMENTS` | `findByAssignee`, `create`, `complete` | `AssignmentService` |
| `AuditLogRepository` | `SHEET_TABS.AUDIT_LOG` | `appendEvent`, `findByEntity` | `AuditService` |
| `SequencesRepository` | `SHEET_TABS.SEQUENCES` | `getNextSequenceValue`, `repairSequences` | All Repositories creating records |
| `SocialReviewsRepository` | `SHEET_TABS.SOCIAL_REVIEWS` | `createReview`, `updateDecision` | `SocialReviewService` |
| `ValidationsRepository` | `SHEET_TABS.QUESTION_VALIDATIONS` | `saveValidation`, `findByQuestion` | `ValidationService` |
| `AnalyticsRepository` | `SOCIAL_ANALYTICS` (Spreadsheet 2) | `getMetricsByVideo`, `appendMetrics` | `AnalyticsService` |
| `SocialCommentsRepository`| `SOCIAL_COMMENTS` (Spreadsheet 2) | `getCommentsByVideo`, `ingestComments` | `SocialCommentService` |
| `IntelligenceRepository` | `PERFORMANCE_INTELLIGENCE` (S2) | `getIntelligenceReport` | `IntelligenceService` |
| `CommentIntelligenceRepository`| `COMMENT_INTELLIGENCE` (S2)| `getClusterInsights` | `CommentClusterService` |
| `StrategyRecommendationRepository`| `STRATEGY_RECOMMENDATIONS` (S2)| `getRecommendations` | `StrategyService` |
| `MediaAssetsRepository` | `SHEET_TABS.MEDIA_ASSETS` | `saveAsset`, `findByVideo` | `MediaService` |
| `QuestionConfigRepository`| `SHEET_TABS.QUESTION_CONFIG` | `getConfig`, `updateConfig` | `ConfigService` |
| `ContentPlansRepository` | `PLANNING_SHEET_TABS.CONTENT_PLANS` | `create`, `update`, `findAll` | `ContentPlanningService` |
| `ContentBatchesRepository`| `PLANNING_SHEET_TABS.CONTENT_BATCHES`| `create`, `linkQuestions` | `ContentPlanningService` |

---

## 2. BaseRepository Core Methods

```typescript
export abstract class BaseRepository<T extends Record<string, any>> {
  public async findById(id: string): Promise<T | null>;
  public async findAll(): Promise<T[]>;
  public async find(predicate: (item: T) => boolean): Promise<T[]>;
  public async create(data: Partial<T>): Promise<T>;
  public async update(id: string, updates: Partial<T>): Promise<T>;
  public async delete(id: string): Promise<boolean>;
}
```
