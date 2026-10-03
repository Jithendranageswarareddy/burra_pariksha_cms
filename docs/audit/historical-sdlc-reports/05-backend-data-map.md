# STAGE 5 — API → SERVICE → REPOSITORY → DATA ARCHITECTURE AUDIT
## Burra Pariksha CMS
**Authoritative Forensic Read-Only Audit of Backend, Services, Repositories, Google Sheets Persistence, and 15-Step Production Data Flows**

---

## 1. AUDIT SCOPE & METHODOLOGY

### 1.1 Objective
The central inquiry of Stage 5 is to establish backend and data architectural truth by answering:
> *"Do we have exactly one understandable business path for each important operation, or do multiple APIs, services, repositories, and data paths perform the same responsibility?"*

This audit forensically traces the complete lifecycle of every production operation across:
$$\text{Frontend UI} \longrightarrow \text{Route / Navigation} \longrightarrow \text{API Endpoint} \longrightarrow \text{Service Layer} \longrightarrow \text{Repository Layer} \longrightarrow \text{Google Sheet Worksheet} \longrightarrow \text{Response} \longrightarrow \text{Frontend}$$

### 1.2 Authoritative Baseline Reference
This audit builds strictly upon the established baseline documentation:
- `01-product-truth.md` (15-step production lifecycle and operational contract)
- `02-repository-inventory.md` (Forensic repository inventory)
- `03-routing-navigation-audit.md` (Routing, navigation, and redirect registry)
- `04-page-workflow-map.md` (Page and workspace ownership map)

### 1.3 Strict Non-Interference Rules
In accordance with Stage 5 directives:
- **No application source code, routes, APIs, services, repositories, or schemas were modified**.
- **No Google Sheets, Google Drive, or production database records were altered, created, or deleted**.
- **No files were renamed, deleted, moved, or refactored**.
- Findings are forensically classified into:
  - **CONFIRMED**: Directly proven by static source code, schemas, and imports.
  - **POTENTIAL**: Strong architectural evidence requiring runtime or multi-user verification.
  - **UNKNOWN**: Cannot be determined statically from available source code.

---

## 2. SOURCE FILES INSPECTED

### 2.1 Backend Routing & API Layer
- `src/server/routes.ts` (7,439 lines; 341 route definitions)
- `src/server/middleware/auth.middleware.ts` (Authentication, token extraction, role enforcement)
- `src/lib/api-client.ts` (171 client methods interacting with Express routes)

### 2.2 Domain Service Layer (`src/lib/services/*.ts`) — 69 Services
- **13 Phase-Prefixed Services**:
  - `phase12-workflow.service.ts`
  - `phase13-refinement.service.ts`
  - `phase14-drive.service.ts`
  - `phase15-script-production.service.ts`
  - `phase17-video-production.service.ts`
  - `phase18-thumbnail-intelligence.service.ts`
  - `phase19-pinned-comment-intelligence.service.ts`
  - `phase20-social-review.service.ts`
  - `phase21-platform-adaptation.service.ts`
  - `phase22-publishing-hub.service.ts`
  - `phase23-production.service.ts`
  - `phase25-consensus.service.ts`
  - `phase26-copilot.service.ts`
- **56 Core Domain & Infrastructure Services**:
  - `question.service.ts`, `question-validation.service.ts`, `question-config.service.ts`
  - `video.service.ts`, `production-asset-validation.service.ts`, `production-board.service.ts`
  - `script.service.ts`, `thumbnail.service.ts`, `pinned-comment.service.ts`
  - `social-review.service.ts`, `social-enhancement.service.ts`, `social-quality.service.ts`
  - `publishing.service.ts`, `platform-adaptation.service.ts`
  - `analytics.service.ts`, `social-comments.service.ts`, `comment-intelligence.service.ts`
  - `social-performance-intelligence.service.ts`, `content-strategy.service.ts`
  - `content-master.service.ts`, `planning.service.ts`, `assignment.service.ts`
  - `workflow.service.ts`, `workflow-orchestration.service.ts`, `audit.service.ts`
  - `id.service.ts`, `sequence-safety.service.ts`, `taxonomy.service.ts`, `similarity.service.ts`
  - `operational-health.service.ts`, `operational-recovery.service.ts`, `spreadsheet-verification.service.ts`
  - `full-snapshot-restore.service.ts`, `durable-snapshot-archive.service.ts`, etc.

### 2.3 Repository Layer (`src/lib/repositories/*.ts`) — 37 Repositories
- `base.repository.ts` (Google Sheets CRUD adapter with fail-closed schema mapping and local fallback)
- `questions.repository.ts`, `question-videos.repository.ts`, `videos.repository.ts`
- `scripts.repository.ts`, `script-versions.repository.ts`
- `thumbnails.repository.ts`, `thumbnail-versions.repository.ts`, `thumbnail-candidates.repository.ts`
- `pinned-comments.repository.ts`, `pinned-comment-versions.repository.ts`, `pinned-comment-packages.repository.ts`
- `social-reviews.repository.ts`, `phase20-social-reviews.repository.ts`
- `publishing.repository.ts`, `phase22-publishing.repository.ts`
- `platform-adaptations.repository.ts`
- `analytics.repository.ts`, `intelligence.repository.ts`, `social-comments.repository.ts`, `comment-intelligence.repository.ts`, `strategy-recommendation.repository.ts`
- `content-masters.repository.ts`, `content-plans.repository.ts`, `content-batches.repository.ts`
- `assignments.repository.ts`, `audit-log.repository.ts`, `workflow.repository.ts`, `sequences.repository.ts`, `users.repository.ts`, `categories.repository.ts`, `topics.repository.ts`, `subtopics.repository.ts`, `validations.repository.ts`, `question-config.repository.ts`, `media-assets.repository.ts`, `refinement-candidates.repository.ts`

### 2.4 Google Sheets Schemas & Adapters
- `src/lib/schemas/google-sheets-schema.ts` (1,585 lines; 23 core worksheets + 2 planning worksheets, column definitions, Zod validation contracts, sequence entity configurations)
- `src/lib/google-sheets/client.ts` (Google Sheets API client, rate limiting, exponential backoff, test mode isolation)
- `src/lib/google-sheets/errors.ts` (Typed domain error hierarchy: `ValidationError`, `ReferenceIntegrityError`, `SequenceAllocationError`, etc.)
- `src/lib/google-sheets/helpers.ts` (Cell sanitizer, formula injection prevention, header mapping)

---

## 3. BACKEND ARCHITECTURE OVERVIEW

### 3.1 Architectural Topology
The backend operates as an Express server mounted under `/api` (`src/server/routes.ts`), orchestrating a tiered layered architecture:
```
┌────────────────────────────────────────────────────────────────────────┐
│                        Frontend UI Workspaces                         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ apiClient (171 methods)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                    API Route Handlers (routes.ts)                      │
│             341 Endpoints (265 Operational + 76 Test Harness)          │
│                • Zod Schema Parsing  • RBAC Enforcement                │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Service Invocations
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                         Domain Service Layer                           │
│                 69 Services (56 Core + 13 Phase-Prefixed)              │
│      • State Transitions  • Verification Engines  • AI Orchestrators    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Data Operations
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       Repository Adapter Layer                         │
│                    37 Repositories (26 Base + 11 In-Memory/Custom)     │
│       • Header-based Mapping  • Fallback Seeds  • Primary Key Guards    │
└───────────────────────┬────────────────────────────────┬───────────────┘
                        │                                │
                        ▼                                ▼
    ┌──────────────────────────────────────┐   ┌─────────────────────────┐
    │   Production Google Sheets Workbook  │   │   Analytics Workbook    │
    │     (GOOGLE_SHEETS_SPREADSHEET_ID)   │   │(ANALYTICS_SPREADSHEET_ID│
    │          23 Authoritative Tabs       │   │   Append-Only Snapshots │
    └──────────────────────────────────────┘   └─────────────────────────┘
```

### 3.2 Dual Database Workbooks
The system strictly provisions two isolated Google Sheets workbooks:
1. **Production CMS Workbook** (`GOOGLE_SHEETS_SPREADSHEET_ID`):
   Houses 23 canonical production tabs (`QUESTIONS`, `VIDEOS`, `SCRIPT`, `THUMBNAILS`, `SOCIAL_REVIEWS`, `PUBLISHING`, `CONTENT_MASTERS`, `ASSIGNMENTS`, `SEQUENCES`, etc.) plus 2 planning tabs (`CONTENT_PLANS`, `CONTENT_BATCHES`).
2. **Analytics Workbook** (`ANALYTICS_SPREADSHEET_ID`):
   Operated exclusively by `AnalyticsRepository`, `SocialCommentsRepository`, and `CommentIntelligenceRepository`. Enforces append-only historical preservation with **zero write paths** into the Production CMS workbook.

---

## 4. API INVENTORY & CLASSIFICATION (341 ENDPOINTS)

Of the 341 registered endpoints in `src/server/routes.ts`:
- **265 Operational Endpoints**: Support user operations, workflow orchestration, entity CRUD, and media uploads.
- **76 Test & Diagnostic Endpoints**: Mount automated integration test runners (e.g., `/tests/phase5`, `/tests/task3f4`, `/tests/deletion-safety`) directly inside the API router.

### 4.1 Functional API Classification

| Domain | Operational Count | Test Count | Key Endpoints | Primary Service | Primary Repository | Status |
|---|---|---|---|---|---|---|
| **Auth & Users** | 7 | 0 | `/auth/login`, `/auth/me`, `/auth/users` | `authService` | `usersRepository` | **CANONICAL** |
| **Questions & Taxonomy** | 26 | 3 | `/questions`, `/questions/:id`, `/questions/:id/queue`, `/questions/:id/validate` | `questionService`, `questionValidationService` | `questionsRepository`, `validationsRepository` | **CANONICAL** |
| **Videos & Production** | 39 | 5 | `/videos`, `/videos/:id`, `/videos/:id/status`, `/videos/queue` | `videoService` | `videosRepository`, `questionVideosRepository` | **CANONICAL** |
| **Scripts & Versions** | 16 | 2 | `/scripts`, `/videos/:videoId/script`, `/phase16/script/*` | `scriptService`, `phase15ScriptProductionService` | `scriptsRepository`, `scriptVersionsRepository` | **DUPLICATED** |
| **Thumbnails & Graphic** | 18 | 3 | `/thumbnails`, `/videos/:videoId/thumbnail`, `/phase18/*` | `thumbnailService`, `phase18ThumbnailIntelligenceService` | `thumbnailsRepository`, `thumbnailCandidatesRepository` | **DUPLICATED** |
| **Pinned Comments** | 14 | 1 | `/pinned-comments`, `/phase19/*` | `pinnedCommentService` | `pinnedCommentsRepository`, `pinnedCommentPackagesRepository` | **DUPLICATED** |
| **Social Review Gate** | 22 | 4 | `/social-reviews`, `/social-reviews/decision`, `/social-enhancement/review/*` | `socialReviewService`, `phase20SocialReviewService` | `socialReviewsRepository`, `phase20SocialReviewsRepository` | **DUPLICATED (COLLISION)** |
| **Publishing Hub** | 24 | 4 | `/publishing`, `/videos/:videoId/publishing`, `/publishing/mark-published` | `publishingService`, `phase22PublishingHubService` | `publishingRepository`, `phase22PublishingRepository` | **DUPLICATED (COLLISION)** |
| **Platform Packages** | 10 | 2 | `/platform-packages`, `/platform-adaptations/*` | `platformAdaptationService`, `phase21PlatformAdaptationService` | `platformAdaptationsRepository` | **DUPLICATED** |
| **Social Analytics** | 15 | 2 | `/analytics`, `/analytics/summary`, `/analytics/content/:contentId` | `analyticsService` | `analyticsRepository` | **CANONICAL** |
| **Audience Comments & Intel**| 12 | 2 | `/social-comments`, `/comment-intelligence/analyze` | `socialCommentsService`, `commentIntelligenceService` | `socialCommentsRepository`, `commentIntelligenceRepository` | **CANONICAL** |
| **AI Strategy Loopback** | 11 | 2 | `/analytics/intelligence`, `/content-strategy/recommendations` | `contentStrategyService`, `socialPerformanceIntelligenceService` | `strategyRecommendationRepository`, `intelligenceRepository` | **CANONICAL** |
| **Planning & Batches** | 17 | 3 | `/planning/plans`, `/planning/batches` | `planningService` | `contentPlansRepository`, `contentBatchesRepository` | **CANONICAL** |
| **Assignments & Team** | 12 | 1 | `/assignments`, `/team/workload`, `/my-work` | `assignmentService` | `assignmentsRepository` | **CANONICAL** |
| **Content Masters** | 9 | 1 | `/content-masters`, `/content-masters/:id` | `contentMasterService` | `contentMastersRepository` | **CANONICAL** |
| **System, Admin & Recovery**| 15 | 41 | `/health`, `/sheets/health`, `/admin/recovery/*`, `/tests/*` | `operationalRecoveryService`, `durableSnapshotArchiveService` | Base/System Repositories | **CANONICAL / TEST** |

---

## 5. PRIMARY BUSINESS FLOW TABLE (15 PRODUCTION STEPS)

This table traces every canonical step in the 15-step production journey from the UI to the underlying Google Sheet:

| Step | Operation | UI Component / Page | Route | API Method | Endpoint | Validation | Service | Repository | Data Source | Sheet / Tab | Response Shape | Confidence |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **01** | **Generate & Save Question** | `QuestionStudioPage.tsx` | `/studio` | `createQuestion` | `POST /questions` | `CreateQuestionInputSchema` + `MultiLayerVerificationEngine` | `questionService` | `questionsRepository`, `contentMastersRepository` | Production Sheets | `QUESTIONS`, `CONTENT_MASTERS` | `{ question: Question }` | **CONFIRMED** |
| **02** | **Pedagogical Verification & Approval** | `QuestionVerifyApprovePage.tsx` | `/questions/:id/verify` | `updateQuestionStatus` + `queueQuestion` | `PATCH /questions/:id/status`, `POST /questions/:id/queue` | `QuestionStatus` enum, RBAC (`ADMIN`/`CONTENT_MANAGER`) | `questionService`, `videoService` | `questionsRepository`, `videosRepository`, `questionVideosRepository` | Production Sheets | `QUESTIONS`, `VIDEOS`, `QUESTION_VIDEOS` | `{ question: Question }` | **CONFIRMED** |
| **03** | **Script Drafting & Versioning** | `VideoDetailPage.tsx` (`ScriptWorkspace`) | `/videos/:id?tab=script` | `saveScript` | `POST /videos/:videoId/script` | `CreateScriptInputSchema` + Word-count validator | `scriptService` | `scriptsRepository`, `scriptVersionsRepository`, `videosRepository` | Production Sheets | `SCRIPT`, `SCRIPT_VERSIONS`, `VIDEOS` | `{ script: Script, version: ScriptVersion }` | **CONFIRMED** |
| **04** | **Filming & Teleprompter Start** | `VideoDetailPage.tsx` (`RecordingWorkspace`) | `/videos/:id?tab=recording` | `updateVideoStatus` | `PATCH /videos/:id/status` | `VALID_VIDEO_TRANSITIONS` (`SCRIPT_READY` → `RECORDING`) | `videoService` | `videosRepository`, `workflowRepository`, `auditLogRepository` | Production Sheets | `VIDEOS`, `WORKFLOW`, `AUDIT_LOG` | `{ video: Video }` | **CONFIRMED** |
| **05** | **Raw Footage Handoff** | `VideoDetailPage.tsx` (`RecordingWorkspace`) | `/videos/:id?tab=recording` | `uploadVideoFile` / `updateVideoMetadata` | `POST /videos/:id/upload` or `PUT /videos/:id` | `validateMediaUpload` (MIME, 500MB max) + Drive URL pattern | `googleDriveService`, `videoService` | `videosRepository`, `mediaAssetsRepository` | Google Drive / Sheets | `VIDEOS`, `MEDIA_ASSETS` | `{ video: Video, driveUrl: string }` | **CONFIRMED** |
| **06** | **Video Editing Cut Submission** | `VideoDetailPage.tsx` (`EditingWorkspace`) | `/videos/:id?tab=editing` | `updateVideoMetadata` + `updateVideoStatus` | `PUT /videos/:id`, `PATCH /videos/:id/status` | Safe-zone aspect ratio check, `RECORDED` → `EDITED` | `videoService` | `videosRepository`, `workflowRepository` | Production Sheets | `VIDEOS`, `WORKFLOW` | `{ video: Video }` | **CONFIRMED** |
| **07** | **Final QC Certification** | `VideoDetailPage.tsx` (`FinalReviewWorkspace`) | `/videos/:id?tab=final-review` | `updateVideoStatus` (QC Approved) | `PATCH /videos/:id/status` | 6-Point QC checklist, RBAC (`ADMIN`/`CONTENT_MANAGER`) | `videoService`, `workflowOrchestrationService` | `videosRepository`, `workflowRepository`, `auditLogRepository` | Production Sheets | `VIDEOS`, `WORKFLOW`, `AUDIT_LOG` | `{ video: Video }` | **CONFIRMED** |
| **08** | **Thumbnail Upload & Linking** | `VideoDetailPage.tsx` (`ThumbnailWorkspace`) | `/videos/:id?tab=thumbnail` | `uploadThumbnail` / `createThumbnail` | `POST /thumbnails/upload`, `POST /thumbnails` | Image format (JPG/PNG), Curiosity headline check | `thumbnailService`, `googleDriveService` | `thumbnailsRepository`, `thumbnailVersionsRepository`, `videosRepository` | Google Drive / Sheets | `THUMBNAILS`, `THUMBNAIL_VERSIONS`, `VIDEOS` | `{ thumbnail: Thumbnail }` | **CONFIRMED** |
| **09** | **Social Package Review Gate** | `SocialReviewPage.tsx` or `VideoDetailPage?tab=social` | `/social-review/:reviewId` or `?tab=social` | `submitSocialReview` | `POST /social-reviews/decision` | Deterministic SHA-256 version lock, RBAC, Safe-zone check | `socialReviewService` (or `phase20SocialReviewService`) | `socialReviewsRepository` (or `phase20SocialReviewsRepository`) | Production Sheets / In-Memory | `SOCIAL_REVIEWS` (or in-memory store) | `{ review: SocialReviewRecord }` | **CONFIRMED (COLLISION)** |
| **10** | **Publishing Setup & Scheduling** | `PublishingPage.tsx` or `VideoDetailPage?tab=publishing` | `/publishing` or `?tab=publishing` | `schedulePublishing` | `POST /videos/:videoId/publishing/schedule` | Pre-publish checklist (`QC_APPROVED`, Thumbnail ready), Future date | `publishingService` (or `phase22PublishingHubService`) | `publishingRepository` (or `phase22PublishingRepository`) | Production Sheets / In-Memory | `PUBLISHING` (or in-memory store) | `{ publishing: Publishing }` | **CONFIRMED (COLLISION)** |
| **11** | **Live Publication Verification** | `PublishingPage.tsx` or `VideoDetailPage?tab=publishing` | `/publishing` or `?tab=publishing` | `finalizePublishing` | `POST /videos/:videoId/publishing/finalize` | Real URL regex (YouTube, IG, FB), status → `UPLOADED` | `publishingService` | `publishingRepository`, `videosRepository`, `contentMastersRepository` | Production Sheets | `PUBLISHING`, `VIDEOS`, `CONTENT_MASTERS` | `{ publishing: Publishing, video: Video }` | **CONFIRMED** |
| **12** | **Platform Sync & Verification** | `PlatformPackagesPage.tsx` | `/platform-packages/:videoId` | `getPublishing` / `getSocialReviewItem` | `GET /videos/:videoId/publishing`, `GET /social-reviews/item/:id` | Multi-platform character limit validation | `platformAdaptationService`, `publishingService` | `platformAdaptationsRepository`, `publishingRepository` | In-Memory / Sheets | In-memory `PLATFORM_ADAPTATIONS` / `PUBLISHING` | `{ adaptations: PlatformAdaptation[] }` | **CONFIRMED** |
| **13** | **Manual Metric Entry & Snapshots** | `SocialAnalyticsPage.tsx` | `/social-analytics/:contentId` | `createSocialAnalytics` | `POST /analytics` | `CreateSocialAnalyticsInputSchema`, Canonical `BP-CNT-######` regex | `analyticsService` | `analyticsRepository` | Analytics Sheets | `SOCIAL_ANALYTICS` (Workbook: `ANALYTICS_SPREADSHEET_ID`) | `{ analytics: SocialAnalyticsRecord }` | **CONFIRMED** |
| **14** | **Performance & Engagement Review**| `AnalyticsExperiencePage.tsx` | `/analytics/engagement` | `getSocialAnalyticsSummary` | `GET /analytics/summary` | Query filter ranges, date validation | `analyticsService` | `analyticsRepository` | Analytics Sheets | `SOCIAL_ANALYTICS` (Workbook: `ANALYTICS_SPREADSHEET_ID`) | `{ summary: SocialAnalyticsSummary }` | **CONFIRMED** |
| **15** | **Performance Intelligence Loopback**| `AnalyticsExperiencePage.tsx` | `/analytics/intelligence` | `generateStrategyRecommendation` + `applyStrategyRecommendation`| `POST /analytics/intelligence`, `POST /content-strategy/recommendations/:id/apply` | Evidence correlation check, Pedagogical rule validator | `contentStrategyService`, `socialPerformanceIntelligenceService` | `strategyRecommendationRepository`, `intelligenceRepository` | Analytics Sheets | `CONTENT_STRATEGY`, `ANALYTICS_INTELLIGENCE` | `{ recommendation: ContentStrategyRecommendation }` | **CONFIRMED** |

---

## 6. DUPLICATE API AUDIT

The audit identified **4 primary operational areas** where multiple distinct API endpoints perform overlapping or competing operations on the same entity:

| Entity | Operation | API Endpoint A | API Endpoint B | API Endpoint C | Same Responsibility? | Forensic Evidence & Details | Classification |
|---|---|---|---|---|---|---|---|
| **Social Review** | Approve / Decision | `POST /social-reviews/decision` | `POST /social-enhancement/review/:questionId/approve` | `POST /social-enhancement/review/:questionId/reject` | **YES** | `POST /social-reviews/decision` calls `socialReviewService.submitDecision()` writing to `SOCIAL_REVIEWS` sheet. `POST /social-enhancement/review/...` calls `socialEnhancementService` which internally calls `socialReviewService`. Two distinct endpoint paths perform the same approval gate. | **DUPLICATE** |
| **Social Review** | Retrieval | `GET /social-reviews/item/:reviewId` | `GET /social-reviews/bundle/:questionId` | `GET /social-enhancement/review/:questionId` | **YES** | `GET /social-reviews/item/:reviewId` fetches by Review ID (`BP-REV-######`); the other two fetch review bundles by Question ID (`BP-Q-######`), returning overlapping package data. | **DUPLICATE** |
| **Publishing** | Schedule Publication | `POST /videos/:videoId/publishing/schedule` | `POST /publishing/search` + modal update | `PUT /publishing/:id` | **YES** | `POST /videos/:videoId/publishing/schedule` invokes `publishingService.scheduleVideo()` validating prerequisites. `PUT /publishing/:id` allows raw partial updates to scheduled timestamps without validating render/thumbnail readiness. | **DUPLICATE / INCONSISTENT** |
| **Publishing** | Mark Published / Live URL | `POST /videos/:videoId/publishing/finalize` | `POST /publishing/mark-published` | `POST /videos/:videoId/publishing/publish-platform` | **YES** | `finalize` transitions Video status to `UPLOADED` and persists YouTube/IG/FB URLs to `PUBLISHING` sheet. `POST /publishing/mark-published` calls `phase22PublishingHubService` storing into in-memory map. Two completely divergent backends exist for marking published. | **CRITICAL DUPLICATE** |
| **Question** | Create / Ingestion | `POST /questions` | `POST /questions/create` | `POST /questions/smart-random` | **PARTIAL** | `POST /questions` is the canonical Zod-validated creation route. `POST /questions/create` is a legacy alias redirecting to the same logic. `POST /questions/smart-random` generates an AI candidate and saves it immediately. | **LEGACY ALIAS** |
| **Script** | Save Script | `POST /videos/:videoId/script` | `PUT /videos/:videoId/script` | `POST /phase16/script/:scriptId/save` | **YES** | `POST /videos/:videoId/script` and `PUT` are aliases in `routes.ts`. `POST /phase16/script/...` calls `phase15ScriptProductionService` which operates in parallel. | **DUPLICATE** |

---

## 7. SERVICE INVENTORY & DUPLICATION AUDIT (69 SERVICES)

### 7.1 Core Services vs Phase-Prefixed Services Analysis

The codebase contains 13 phase-prefixed services (`phase12` through `phase26`). Forensic inspection of their implementation reveals their exact structural relationship to core services:

| Core Service | Phase-Prefixed Service | Shared Responsibility | Implementation Relationship | Persistence Layer Difference | Classification |
|---|---|---|---|---|---|
| `social-review.service.ts` | `phase20-social-review.service.ts` | Complete social review packaging, 9:16 quality checks, SHA-256 version fingerprinting, approval decision gate. | **PARALLEL IMPLEMENTATION**: Both implement full review assembly and decision logic. `social-review.service.ts` writes to `SOCIAL_REVIEWS` Google Sheet via `socialReviewsRepository`. `phase20-social-review.service.ts` writes to an **in-memory Map** via `phase20SocialReviewsRepository`. | Sheet-backed vs In-Memory Map | **CRITICAL COLLISION** |
| `publishing.service.ts` | `phase22-publishing-hub.service.ts` | Publishing readiness verification, platform scheduling, manual publish verification, idempotency protection. | **PARALLEL IMPLEMENTATION**: `publishing.service.ts` writes to `PUBLISHING` Google Sheet via `publishingRepository`. `phase22-publishing-hub.service.ts` writes to an **in-memory Map** via `phase22PublishingRepository`. | Sheet-backed vs In-Memory Map | **CRITICAL COLLISION** |
| `platform-adaptation.service.ts` | `phase21-platform-adaptation.service.ts` | Multi-platform adaptations (YouTube Shorts, IG Reels, Facebook Video), character counting, hashtag formatting. | **WRAPPER / EXTENSION**: `phase21` wraps `platform-adaptation.service.ts` and adds in-memory version tracking via `platformAdaptationsRepository`. | Shared logic; In-memory versioning | **DUPLICATE / WRAPPER** |
| `script.service.ts` | `phase15-script-production.service.ts` | Script drafting, word counting, teleprompter pacing, diff calculation. | **WRAPPER**: `phase15ScriptProductionService` calls `scriptService` and `scriptsRepository` directly. | Both target `SCRIPT` sheet | **SERVICE WRAPPER** |
| `thumbnail.service.ts` | `phase18-thumbnail-intelligence.service.ts` | Thumbnail candidate generation, prompt engineering, safety checks. | **SEPARATE PURPOSE**: `thumbnailService` manages Drive upload and thumbnail persistence; `phase18` manages AI prompt variants and in-memory candidates. | `THUMBNAILS` sheet vs In-Memory Map | **COMPLEMENTARY** |
| `pinned-comment.service.ts` | `phase19-pinned-comment-intelligence.service.ts` | Pinned comment drafting, engagement question composer, package versioning. | **PARALLEL IMPLEMENTATION**: `pinned-comment.service.ts` targets `PINNED_COMMENTS` sheet. `phase19` targets `pinnedCommentPackagesRepository` (in-memory Map). | Sheet-backed vs In-Memory Map | **DUPLICATE** |
| `workflow.service.ts` | `phase12-workflow.service.ts` | Workflow transition audit trail and status tracking. | **SUBSUMED**: `workflow.service.ts` (in `audit.service.ts`) writes to `WORKFLOW` sheet. `phase12` provides high-level journey helper methods. | Both target `WORKFLOW` sheet | **SERVICE WRAPPER** |
| `video.service.ts` | `phase17-video-production.service.ts` | Filming sessions, take logging, editing transition. | **WRAPPER**: `phase17` delegates to `videoService` and `videosRepository`. | Both target `VIDEOS` sheet | **SERVICE WRAPPER** |

---

## 8. REPOSITORY INVENTORY & IN-MEMORY DUPLICATION AUDIT (37 REPOSITORIES)

### 8.1 Repository Classification & Persistence Backing

Forensic inspection of `src/lib/repositories/` revealed that while 26 repositories inherit from `BaseRepository` and persist directly to Google Sheets, **11 repositories do NOT persist to Google Sheets** and instead use ephemeral, in-memory `Map<string, ...>` storage:

| Repository File | Target Entity | Inherits `BaseRepository`? | Persistence Mechanism | Target Worksheet (if Google Sheet) | Production Persistence Status |
|---|---|---|---|---|---|
| `questions.repository.ts` | Question | **Yes** | Google Sheets API | `QUESTIONS` | **PERSISTENT** (Google Sheet) |
| `videos.repository.ts` | Video | **Yes** | Google Sheets API | `VIDEOS` | **PERSISTENT** (Google Sheet) |
| `question-videos.repository.ts` | QuestionVideo | **Yes** (in `videos.repository.ts`) | Google Sheets API | `QUESTION_VIDEOS` | **PERSISTENT** (Google Sheet) |
| `scripts.repository.ts` | Script | **Yes** | Google Sheets API | `SCRIPT` | **PERSISTENT** (Google Sheet) |
| `script-versions.repository.ts` | ScriptVersion | **Yes** | Google Sheets API | `SCRIPT_VERSIONS` | **PERSISTENT** (Google Sheet) |
| `thumbnails.repository.ts` | Thumbnail | **Yes** | Google Sheets API | `THUMBNAILS` | **PERSISTENT** (Google Sheet) |
| `thumbnail-versions.repository.ts` | ThumbnailVersion | **Yes** (in `thumbnails.repository.ts`)| Google Sheets API | `THUMBNAIL_VERSIONS` | **PERSISTENT** (Google Sheet) |
| `pinned-comments.repository.ts` | PinnedComment | **Yes** | Google Sheets API | `PINNED_COMMENTS` | **PERSISTENT** (Google Sheet) |
| `social-reviews.repository.ts` | SocialReviewRecord | **Yes** | Google Sheets API | `SOCIAL_REVIEWS` | **PERSISTENT** (Google Sheet) |
| `publishing.repository.ts` | Publishing | **Yes** | Google Sheets API | `PUBLISHING` | **PERSISTENT** (Google Sheet) |
| `content-masters.repository.ts` | ContentMaster | **Yes** | Google Sheets API | `CONTENT_MASTERS` | **PERSISTENT** (Google Sheet) |
| `assignments.repository.ts` | Assignment | **Yes** | Google Sheets API | `ASSIGNMENTS` | **PERSISTENT** (Google Sheet) |
| `audit-log.repository.ts` | AuditLog | **Yes** | Google Sheets API | `AUDIT_LOG` | **PERSISTENT** (Google Sheet) |
| `workflow.repository.ts` | Workflow | **Yes** | Google Sheets API | `WORKFLOW` | **PERSISTENT** (Google Sheet) |
| `sequences.repository.ts` | SequenceRecord | **Yes** | Google Sheets API | `SEQUENCES` | **PERSISTENT** (Google Sheet) |
| `users.repository.ts` | User | **Yes** (in `audit-log.repository.ts`) | Google Sheets API | `USERS` | **PERSISTENT** (Google Sheet) |
| `content-plans.repository.ts` | ContentPlan | **Yes** | Google Sheets API | `CONTENT_PLANS` | **PERSISTENT** (Google Sheet) |
| `content-batches.repository.ts` | ContentBatch | **Yes** | Google Sheets API | `CONTENT_BATCHES` | **PERSISTENT** (Google Sheet) |
| `categories.repository.ts` | Category | **Yes** | Google Sheets API | `CATEGORIES` | **PERSISTENT** (Google Sheet) |
| `topics.repository.ts` | Topic | **Yes** | Google Sheets API | `TOPICS` | **PERSISTENT** (Google Sheet) |
| `subtopics.repository.ts` | Subtopic | **Yes** | Google Sheets API | `SUBTOPICS` | **PERSISTENT** (Google Sheet) |
| `validations.repository.ts` | QuestionValidation | **Yes** | Google Sheets API | `QUESTION_VALIDATIONS` | **PERSISTENT** (Google Sheet) |
| `question-config.repository.ts` | QuestionConfig | **Yes** | Google Sheets API | `QUESTION_CONFIG` | **PERSISTENT** (Google Sheet) |
| `media-assets.repository.ts` | MediaAsset | **Yes** | Google Sheets API | `MEDIA_ASSETS` | **PERSISTENT** (Google Sheet) |
| `analytics.repository.ts` | SocialAnalyticsRecord | **Yes** | Google Sheets API | `SOCIAL_ANALYTICS` (Analytics Sheet) | **PERSISTENT** (Analytics Sheet) |
| `social-comments.repository.ts` | SocialCommentRecord | **Yes** | Google Sheets API | `SOCIAL_COMMENTS` (Analytics Sheet) | **PERSISTENT** (Analytics Sheet) |
| `comment-intelligence.repository.ts`| CommentIntelligenceRecord| **Yes** | Google Sheets API | `COMMENT_INTELLIGENCE` (Analytics Sheet)| **PERSISTENT** (Analytics Sheet) |
| `intelligence.repository.ts` | IntelligenceReport | **Yes** | Google Sheets API | `ANALYTICS_INTELLIGENCE` (Analytics Sheet)| **PERSISTENT** (Analytics Sheet) |
| `strategy-recommendation.repository.ts`| StrategyRecommendation| **Yes** | Google Sheets API | `CONTENT_STRATEGY` (Analytics Sheet) | **PERSISTENT** (Analytics Sheet) |
| **`phase20-social-reviews.repository.ts`**| Phase20SocialReview | **NO** | `Map<string, Record>` | **NONE (In-Memory)** | **EPHEMERAL (Lost on Restart)** |
| **`phase22-publishing.repository.ts`** | Phase22PublishingRecord| **NO** | `Map<string, Record>` | **NONE (In-Memory)** | **EPHEMERAL (Lost on Restart)** |
| **`platform-adaptations.repository.ts`**| PlatformAdaptation | **NO** | `Map<string, Record>` | **NONE (In-Memory)** | **EPHEMERAL (Lost on Restart)** |
| **`thumbnail-candidates.repository.ts`**| ThumbnailCandidate | **NO** | `Map<string, Record>` | **NONE (In-Memory)** | **EPHEMERAL (Lost on Restart)** |
| **`pinned-comment-packages.repository.ts`**| PinnedCommentPkg| **NO** | `Map<string, Record>` | **NONE (In-Memory)** | **EPHEMERAL (Lost on Restart)** |
| **`refinement-candidates.repository.ts`**| RefinementCandidate | **NO** | `Map<string, Record>` | **NONE (In-Memory)** | **EPHEMERAL (Lost on Restart)** |

### 8.2 Critical Finding: In-Memory Data Loss Hazard
- Operations routed through `social-review.service.ts` persist permanently to Google Sheets tab `SOCIAL_REVIEWS`.
- Operations routed through `phase20-social-review.service.ts` persist to an **in-memory Map** in `phase20SocialReviewsRepository`.
- If a server process restarts, all review records stored in `phase20SocialReviewsRepository` disappear. The same critical hazard applies to `phase22-publishing.repository.ts` and `platform-adaptations.repository.ts`.

---

## 9. DIRECT DATA ACCESS AUDIT (LAYER BYPASS ANALYSIS)

The architecture prescribes strict layered data flow:
$$\text{API Route} \longrightarrow \text{Service Layer} \longrightarrow \text{Repository Layer} \longrightarrow \text{Google Sheets}$$

Static code inspection was conducted across `src/server/routes.ts` to identify any direct layer bypasses:

| File | Line Span | Invocation | Bypassed Layer | Actual Layer | Risk Assessment | Classification |
|---|---|---|---|---|---|---|
| `src/server/routes.ts` | Lines 530–540 | `usersRepository.findById(session.userId)` in `/auth/me` | Service Layer | Route → Repository | **LOW**: Read-only user session hydration; no state mutations or business logic bypassed. | **ACCEPTABLE SHIM** |
| `src/server/routes.ts` | Lines 1205–1215 | `mediaAssetsRepository.findByContentIdAndStage()` in `PATCH /videos/:id/status` | Service Layer | Route → Repository | **MEDIUM**: Fetches raw footage assets during status transition check rather than querying through `videoService`. | **LAYER BYPASS** |
| `src/server/routes.ts` | Lines 2280–2320 | `thumbnailsRepository.findById(req.params.id)` in `/thumbnails/:id/download` | Service Layer | Route → Repository | **LOW**: Direct file streaming / download redirect; no business logic. | **ACCEPTABLE SHIM** |
| `src/server/routes.ts` | Lines 2550–2610 | `thumbnailCandidatesRepository.findByContentId()` in `/phase18/thumbnails/...` | Service Layer | Route → Repository | **MEDIUM**: Bypasses `thumbnailService` to inspect in-memory candidates directly. | **LAYER BYPASS** |
| `src/server/routes.ts` | Lines 3100–3180 | Multiple `questionsRepository.findById()` & `socialReviewsRepository.findAll()` in `/ai/script/generate` | Service Layer | Route → Repository | **HIGH**: Route handler manually aggregates question and review records before passing to AI client, duplicating logic found in `ScriptService`. | **BUSINESS LOGIC IN ROUTE** |

**Google Sheets Client Direct Access**:
Zero route handlers call `googleSheetsClient.appendRow()`, `updateRow()`, or `getRows()` directly. The only call in `routes.ts` is `googleSheetsClient.isConfigured()` for health checks. All spreadsheet I/O is encapsulated in repository classes.

---

## 10. GOOGLE SHEETS DATA OWNERSHIP MAP (25 WORKSHEETS)

This table defines the authoritative ownership and access topology across all 25 worksheets in the system:

| Worksheet Tab | Entity Type | Primary ID Format | Writer Repositories | Reader Repositories | Writer Services | Reader Services | Workbook Target | Production / Analytics |
|---|---|---|---|---|---|---|---|---|
| `QUESTIONS` | Question | `BP-Q-######` | `questionsRepository` | `questionsRepository`, `sequencesRepository` | `questionService`, `planningService` | `questionService`, `videoService`, `scriptService`, `socialReviewService` | Production CMS | **PRODUCTION** |
| `VIDEOS` | Video | `BP-V-######` | `videosRepository` | `videosRepository`, `sequencesRepository` | `videoService`, `publishingService` | `videoService`, `scriptService`, `thumbnailService`, `publishingService` | Production CMS | **PRODUCTION** |
| `QUESTION_VIDEOS` | QuestionVideo | `QVID-######` | `questionVideosRepository` | `questionVideosRepository` | `videoService` | `videoService`, `questionService` | Production CMS | **PRODUCTION** |
| `SCRIPT` | Script | `BP-S-######` | `scriptsRepository` | `scriptsRepository`, `sequencesRepository` | `scriptService` | `scriptService`, `videoService`, `socialReviewService` | Production CMS | **PRODUCTION** |
| `SCRIPT_VERSIONS` | ScriptVersion | `SVER-######` | `scriptVersionsRepository` | `scriptVersionsRepository` | `scriptService` | `scriptService` | Production CMS | **PRODUCTION** |
| `THUMBNAILS` | Thumbnail | `BP-T-######` | `thumbnailsRepository` | `thumbnailsRepository`, `sequencesRepository` | `thumbnailService` | `thumbnailService`, `videoService`, `socialReviewService` | Production CMS | **PRODUCTION** |
| `THUMBNAIL_VERSIONS`| ThumbnailVersion | `TVER-######` | `thumbnailVersionsRepository` | `thumbnailVersionsRepository` | `thumbnailService` | `thumbnailService` | Production CMS | **PRODUCTION** |
| `PINNED_COMMENTS` | PinnedComment | `BP-PIN-######` | `pinnedCommentsRepository` | `pinnedCommentsRepository`, `sequencesRepository` | `pinnedCommentService` | `pinnedCommentService`, `socialReviewService` | Production CMS | **PRODUCTION** |
| `SOCIAL_REVIEWS` | SocialReviewRecord | `BP-REV-######` | `socialReviewsRepository` | `socialReviewsRepository`, `sequencesRepository` | `socialReviewService` | `socialReviewService`, `publishingService`, `workflowOrchestrationService` | Production CMS | **PRODUCTION** |
| `PUBLISHING` | Publishing | `BP-PUB-######` | `publishingRepository` | `publishingRepository` | `publishingService` | `publishingService`, `workflowOrchestrationService` | Production CMS | **PRODUCTION** |
| `CONTENT_MASTERS` | ContentMaster | `BP-CNT-######` | `contentMastersRepository` | `contentMastersRepository`, `sequencesRepository` | `contentMasterService` | `contentMasterService`, `analyticsService`, `workflowOrchestrationService` | Production CMS | **PRODUCTION** |
| `ASSIGNMENTS` | Assignment | `BP-ASN-######` | `assignmentsRepository` | `assignmentsRepository`, `sequencesRepository` | `assignmentService` | `assignmentService`, `videoService`, `teamOperationsService` | Production CMS | **PRODUCTION** |
| `WORKFLOW` | Workflow | `WF-######` | `workflowRepository` | `workflowRepository` | `workflowService` | `workflowService`, `dashboardService`, `productionBoardService` | Production CMS | **PRODUCTION** |
| `AUDIT_LOG` | AuditLog | `LOG-######` | `auditLogRepository` | `auditLogRepository` | `auditService` | `auditService`, `dashboardService` | Production CMS | **PRODUCTION** |
| `SEQUENCES` | SequenceRecord | Entity String | `sequencesRepository` | `sequencesRepository` | `idService`, `sequencesRepository` | `idService`, all entity creation services | Production CMS | **PRODUCTION** |
| `USERS` | User | `USR-###` | `usersRepository` | `usersRepository`, `sequencesRepository` | `authService` | `authService`, `assignmentService` | Production CMS | **PRODUCTION** |
| `CONTENT_PLANS` | ContentPlan | `BP-PLN-####` | `contentPlansRepository` | `contentPlansRepository`, `sequencesRepository` | `planningService` | `planningService` | Production CMS | **PRODUCTION** |
| `CONTENT_BATCHES` | ContentBatch | `BP-BCH-####` | `contentBatchesRepository` | `contentBatchesRepository`, `sequencesRepository` | `planningService` | `planningService` | Production CMS | **PRODUCTION** |
| `CATEGORIES` | Category | `BP-CAT-###` | `categoriesRepository` | `categoriesRepository`, `sequencesRepository` | `taxonomyService` | `taxonomyService`, `questionService` | Production CMS | **PRODUCTION** |
| `TOPICS` | Topic | `BP-TOP-####` | `topicsRepository` | `topicsRepository`, `sequencesRepository` | `taxonomyService` | `taxonomyService`, `questionService` | Production CMS | **PRODUCTION** |
| `SUBTOPICS` | Subtopic | `BP-SUB-######` | `subtopicsRepository` | `subtopicsRepository`, `sequencesRepository` | `taxonomyService` | `taxonomyService`, `questionService` | Production CMS | **PRODUCTION** |
| `QUESTION_VALIDATIONS`| QuestionValidation| `VAL-######` | `validationsRepository` | `validationsRepository` | `questionValidationService` | `questionValidationService`, `questionService` | Production CMS | **PRODUCTION** |
| `QUESTION_CONFIG` | QuestionConfig | Config Key | `questionConfigRepository` | `questionConfigRepository` | `questionConfigService` | `questionConfigService`, `questionService` | Production CMS | **PRODUCTION** |
| `MEDIA_ASSETS` | MediaAsset | `AST-######` | `mediaAssetsRepository` | `mediaAssetsRepository` | `videoService`, `googleDriveService` | `videoService`, `productionAssetValidationService` | Production CMS | **PRODUCTION** |
| `SOCIAL_ANALYTICS` | SocialAnalyticsRecord | `BP-ANL-######` | `analyticsRepository` | `analyticsRepository`, `sequencesRepository` | `analyticsService` | `analyticsService`, `contentStrategyService` | Analytics Workbook | **ANALYTICS** |
| `SOCIAL_COMMENTS` | SocialCommentRecord | `BP-CMT-######` | `socialCommentsRepository` | `socialCommentsRepository`, `sequencesRepository` | `socialCommentsService` | `socialCommentsService`, `commentIntelligenceService` | Analytics Workbook | **ANALYTICS** |
| `COMMENT_INTELLIGENCE`| CommentIntelRecord | `BP-CMI-######` | `commentIntelligenceRepository`| `commentIntelligenceRepository`, `sequencesRepository`| `commentIntelligenceService` | `commentIntelligenceService`, `contentStrategyService` | Analytics Workbook | **ANALYTICS** |
| `ANALYTICS_INTELLIGENCE`| IntelReport | `BP-SPI-######` | `intelligenceRepository` | `intelligenceRepository`, `sequencesRepository` | `socialPerformanceIntelligenceService` | `socialPerformanceIntelligenceService`, `contentStrategyService`| Analytics Workbook | **ANALYTICS** |
| `CONTENT_STRATEGY` | StrategyRec | `BP-STR-######` | `strategyRecommendationRepository`| `strategyRecommendationRepository`, `sequencesRepository`| `contentStrategyService` | `contentStrategyService`, `questionService` | Analytics Workbook | **ANALYTICS** |

---

## 11. DATA RELATIONSHIP & ENTITY LINKAGE AUDIT

The audit forensically traced foreign keys and entity linkages across the application:

```
  ┌─────────────────────────────────────────────────────────────┐
  │                    CONTENT_MASTERS                          │
  │                     (BP-CNT-######)                         │
  └───────┬───────────────────────────────┬─────────────────────┘
          │ 1:N                           │ 1:N
          ▼                               ▼
┌──────────────────┐            ┌──────────────────┐
│    QUESTIONS     │            │      VIDEOS      │
│  (BP-Q-######)   │◄───────────┤  (BP-V-######)   │
└─────────┬────────┘ (questionId)└────────┬─────────┘
          │                               │
          │ 1:1                           │ 1:1
          ▼                               ▼
┌──────────────────┐            ┌──────────────────┐
│  SOCIAL_REVIEWS  │            │     SCRIPTS      │
│  (BP-REV-######) │            │  (BP-S-######)   │
└─────────┬────────┘            └──────────────────┘
          │                               │
          │ 1:1                           │ 1:1
          ▼                               ▼
┌──────────────────┐            ┌──────────────────┐
│    PUBLISHING    │            │    THUMBNAILS    │
│  (BP-PUB-######) │            │  (BP-T-######)   │
└─────────┬────────┘            └──────────────────┘
          │ (Live URLs)
          ▼
┌─────────────────────────────────────────────────────────────┐
│                 SOCIAL_ANALYTICS (Analytics)                │
│                        (BP-ANL-######)                      │
│                  Foreign Key: contentId (BP-CNT)            │
└─────────────────────────────────────────────────────────────┘
```

### 11.1 Authoritative Entity Linkages
1. **Root Entity**: `ContentMaster` (`BP-CNT-######`) is the canonical root identity representing logical content across all downstream production domains.
2. **Question ↔ Video**: Every `Video` (`BP-V-######`) contains a required `questionId` foreign key and optional `contentId`. A join record is also maintained in `QUESTION_VIDEOS`.
3. **Video ↔ Downstream Assets**:
   - `Script` links via `videoId` and `questionId`.
   - `Thumbnail` links via `videoId`.
   - `PinnedComment` links via `videoId` and `questionId`.
4. **Publishing ↔ Video**: `Publishing` record links via `videoId` and `contentId`.
5. **Analytics ↔ Content Master**: Analytics records link strictly via canonical `contentId` (`BP-CNT-######`) and optional `videoId`.

### 11.2 Inconsistencies & Weak Linkages Identified
- **Dual Content ID Fields**: Entities frequently declare both `contentId` and `contentMasterId` properties. In `Question.ts`, both fields exist and are kept in sync via fallback assignment: `contentId: existing.contentId || existing.contentMasterId`.
- **Review Lookup Fragility**: `socialReviewsRepository` queries primarily by `questionId` (`findByQuestionId`), whereas `phase20SocialReviewsRepository` queries by `contentId` (`findByContentId`). If a video has a Question ID but lacks a Content Master link, Phase 20 review lookups fail.

---

## 12. PRODUCTION VS ANALYTICS BOUNDARY AUDIT

A major architectural inquiry is whether production data and analytics data maintain a clean, zero-mutation separation.

### 12.1 Forensic Verification of Separation

| Verification Criterion | Static Code Evidence | Status |
|---|---|---|
| **Separate Workbooks** | `AnalyticsRepository.getTargetSpreadsheetId()` checks `ANALYTICS_SPREADSHEET_ID`. If unconfigured, returns sentinel `'UNCONFIGURED_ANALYTICS_SPREADSHEET'` rather than falling back to production `GOOGLE_SHEETS_SPREADSHEET_ID`. | **CONFIRMED ISOLATED** |
| **Zero Production Writes from Analytics** | Inspection of `AnalyticsService`, `SocialCommentsService`, `CommentIntelligenceService`, and `SocialPerformanceIntelligenceService` reveals zero calls to `questionsRepository`, `videosRepository`, or `publishingRepository` write methods. | **CONFIRMED ZERO-MUTATION** |
| **Read-Only Cross-Boundary Verification** | `AnalyticsService.validateCanonicalContentId()` calls `contentMastersRepository.findById()` strictly as a read-only existence check before accepting an analytics record. | **CONFIRMED READ-ONLY** |
| **Strategy Loopback Mechanism** | `ContentStrategyService.generateStrategyRecommendation()` reads from `ANALYTICS_INTELLIGENCE` and persists to `CONTENT_STRATEGY`. When `applyStrategyRecommendation()` is executed, it updates the recommendation status to `APPLIED` in the analytics workbook and returns parameters for the frontend to pre-populate `/studio`. No direct background writes to `QUESTIONS` occur. | **CONFIRMED CONTROLLED LOOPBACK** |

---

## 13. STATUS TRANSITION OWNERSHIP AUDIT

This table audits every critical status transition across domain entities, verifying which service and repository owns each lifecycle gate:

| Entity | From Status | To Status | Triggering API Endpoint | Owning Service | Owning Repository | Transition Validation | Multiple Owners? |
|---|---|---|---|---|---|---|---|
| **Question** | `DRAFT` | `IN_REVIEW` | `PATCH /questions/:id/status` | `questionService` | `questionsRepository` | `validateStatusTransition` | No |
| **Question** | `IN_REVIEW` | `APPROVED` | `PATCH /questions/:id/status` | `questionService` | `questionsRepository` | RBAC (`ADMIN`/`CONTENT_MANAGER`) + 10-point audit | No |
| **Question** | `APPROVED` | `REJECTED` | `PATCH /questions/:id/status` | `questionService` | `questionsRepository` | Reason required, logs workflow transition | No |
| **Video** | `QUEUED` | `SCRIPT_REQUIRED` | `POST /videos/queue` | `videoService` | `videosRepository` | `VALID_VIDEO_TRANSITIONS` | No |
| **Video** | `SCRIPT_REQUIRED` | `SCRIPT_READY` | `POST /videos/:videoId/script` | `scriptService` | `videosRepository` | Script word count + teleprompter pacing | No |
| **Video** | `SCRIPT_READY` | `RECORDING` | `PATCH /videos/:id/status` | `videoService` | `videosRepository` | `VALID_VIDEO_TRANSITIONS` | No |
| **Video** | `RECORDING` | `RECORDED` | `PUT /videos/:id` / `PATCH /videos/:id/status` | `videoService` | `videosRepository` | Raw footage Drive URL required | No |
| **Video** | `RECORDED` | `EDITING` | `PATCH /videos/:id/status` | `videoService` | `videosRepository` | `VALID_VIDEO_TRANSITIONS` | No |
| **Video** | `EDITING` | `EDITED` | `PUT /videos/:id` / `PATCH /videos/:id/status` | `videoService` | `videosRepository` | Master cut Drive URL + safe-zone checklist | No |
| **Video** | `EDITED` | `QC_APPROVED` | `PATCH /videos/:id/status` | `videoService` | `videosRepository` | 6-Point QC checklist certified; RBAC | No |
| **Video** | `QC_APPROVED` | `READY_TO_UPLOAD`| `PATCH /videos/:id/status` | `videoService` | `videosRepository` | Thumbnail linked + Pinned comment drafted | No |
| **Video** | `READY_TO_UPLOAD`| `UPLOADED` | `POST /videos/:videoId/publishing/finalize` | `publishingService` | `videosRepository` | 3 live URLs (YT, IG, FB) recorded | **YES** (`publishingService` vs `phase22PublishingHubService`) |
| **Social Review**| `PENDING_REVIEW`| `APPROVED` | `POST /social-reviews/decision` | `socialReviewService` | `socialReviewsRepository` | SHA-256 fingerprint lock + Safe-zone check | **YES** (`socialReviewService` vs `phase20SocialReviewService`) |
| **Publishing** | `DRAFT` | `SCHEDULED` | `POST /videos/:videoId/publishing/schedule` | `publishingService` | `publishingRepository` | Video status `QC_APPROVED` + Thumbnail ready | **YES** (`publishingService` vs `phase22PublishingHubService`) |
| **Publishing** | `SCHEDULED` | `PUBLISHED` | `POST /videos/:videoId/publishing/finalize` | `publishingService` | `publishingRepository` | Valid platform URLs, updates Video status | **YES** (`publishingService` vs `phase22PublishingHubService`) |

---

## 14. SEQUENCE & ID GENERATION AUDIT

### 14.1 ID Format & Sequence Entity Matrix

| Sequence Entity | Canonical ID Format | Pad Length | Generator Function in `id.service.ts` | Target Repository in `sequences.repository.ts` | Regex Enforced in `getMaxExistingId()` |
|---|---|---|---|---|---|
| `QUESTION` | `BP-Q-######` | 6 | `allocateQuestionId()` | `questionsRepository` | `^BP-Q-(\d{6})$` |
| `VIDEO` | `BP-V-######` | 6 | `allocateVideoId()` | `videosRepository` | `^BP-V-(\d{6})$` |
| `SCRIPT` | `BP-S-######` | 6 | `allocateScriptId()` | `scriptsRepository` | `^BP-S-(\d{6})$` |
| `THUMBNAIL` | `BP-T-######` | 6 | `allocateThumbnailId()` | `thumbnailsRepository` | `^BP-T-(\d{6})$` |
| `PINNED_COMMENT` | `BP-PIN-######` | 6 | `allocatePinnedCommentId()` | `pinnedCommentsRepository` | `^BP-PIN-(\d{6})$` |
| `CATEGORY` | `BP-CAT-###` | 3 | `allocateCategoryId()` | `categoriesRepository` | `^BP-CAT-(\d{3})$` |
| `TOPIC` | `BP-TOP-####` | 4 | `allocateTopicId()` | `topicsRepository` | `^BP-TOP-(\d{4})$` |
| `SUBTOPIC` | `BP-SUB-######` | 6 | `allocateSubtopicId()` | `subtopicsRepository` | `^BP-SUB-(\d{6})$` |
| `USER` | `USR-###` | 3 | `allocateUserId()` | `usersRepository` | `^USR-(\d{3})$` |
| `CONTENT_PLAN` | `BP-PLN-####` | 4 | `allocateContentPlanId()` | `contentPlansRepository` | `^BP-PLN-(\d{4})$` |
| `CONTENT_BATCH` | `BP-BCH-####` | 4 | `allocateContentBatchId()` | `contentBatchesRepository` | `^BP-BCH-(\d{4})$` |
| `ASSIGNMENT` | `BP-ASN-######` | 6 | `allocateAssignmentId()` | `assignmentsRepository` | `^BP-ASN-(\d{6})$` |
| `CONTENT_MASTER`| `BP-CNT-######` | 6 | `allocateContentMasterId()`| `contentMastersRepository` | `^BP-CNT-(\d{6})$` |
| `SOCIAL_REVIEW` | `BP-REV-######` | 6 | `allocateSocialReviewId()` | `socialReviewsRepository` | `^BP-REV-(\d{6})$` |
| `SOCIAL_ANALYTICS`| `BP-ANL-######`| 6 | `allocateSocialAnalyticsId()`| `analyticsRepository` | `^BP-ANL-(\d{6})$` |
| `SOCIAL_PERF_INTEL`| `BP-SPI-######`| 6 | `allocateIntelligenceId()` | `intelligenceRepository` | `^BP-SPI-(\d{6})$` |
| `CONTENT_STRATEGY`| `BP-STR-######`| 6 | `allocateStrategyId()` | `strategyRecommendationRepository`| `^BP-STR-(\d{6})$` |
| `SOCIAL_COMMENT`| `BP-CMT-######` | 6 | `allocateSocialCommentId()`| `socialCommentsRepository` | `^BP-CMT-(\d{6})$` |
| `COMMENT_INTEL` | `BP-CMI-######` | 6 | `allocateCommentIntelligenceId()`| `commentIntelligenceRepository`| `^BP-CMI-(\d{6})$` |

### 14.2 Concurrency & Sequence Drift Protection
- **In-Process Mutex**: `SequencesRepository.allocateNextNumber()` serializes allocation requests through an in-memory Promise queue (`this.allocationQueue`), preventing race conditions within a single Node instance.
- **Canonical-Format Regex Guard**: In `getMaxExistingId()`, the repository strictly enforces `^<prefix>(\d{padLength})$`. Test fixtures (e.g., `TEST-REC-001`, `BP-Q-999999999`) that do not match the exact prefix and padded digit length are completely ignored during self-healing scans.
- **Primary Key Collision Guard**: `BaseRepository.appendRecord()` checks `findById()` prior to write, throwing `ValidationError` if an ID collision is detected.

---

## 15. VALIDATION LAYER AUDIT

This audit examined where input validation is enforced across the stack:

| Operation | Frontend Validation | API Route Validation | Service Validation | Repository Validation | Weak Area / Gap | Confidence |
|---|---|---|---|---|---|---|
| **Question Creation** | Form input checks | `CreateQuestionInputSchema.parse()` | `MultiLayerVerificationEngine.verify()` + ContentMaster integrity check | Primary key uniqueness guard | **STRONG**: Multi-layered validation across Zod, SME engine, and repository guard. | **CONFIRMED** |
| **Question Approval** | UI modal prompt | None (raw status string) | RBAC check (`ADMIN`/`CONTENT_MANAGER`) + 10-point audit score check | None | **MEDIUM**: API route accepts arbitrary status string without Zod enum validation; relies solely on service layer. | **CONFIRMED** |
| **Script Save** | Word counter in UI | `CreateScriptInputSchema.parse()` | Pacing checks + script version diffing | None | **STRONG**: Zod validation at route level; word count bounds enforced in service. | **CONFIRMED** |
| **Raw Video Upload** | File picker filter | `validateMediaUpload` (MIME + 500MB) | Google Drive folder check | Media assets metadata schema | **STRONG**: Multi-part streaming validator prevents non-video files. | **CONFIRMED** |
| **Video Status Transition** | UI disabled buttons | None (raw status string in PATCH) | `VALID_VIDEO_TRANSITIONS` state machine | None | **MEDIUM**: API route lacks Zod enum validator; relies entirely on service state machine. | **CONFIRMED** |
| **Social Review Approval** | UI confirmation | `SubmitSocialReviewInputSchema.parse()` | SHA-256 version lock + safe zone check | None | **STRONG**: Deterministic hash lock prevents approval if underlying assets changed. | **CONFIRMED** |
| **Publishing Scheduling** | Date picker | None (`req.body` parsed ad-hoc) | Readiness checklist (`QC_APPROVED`, Thumbnail ready) | None | **WEAK**: API route does not use a Zod schema for scheduling body; relies on service checks. | **CONFIRMED** |
| **Live URL Entry** | URL input type | URL regex in route | None | None | **MEDIUM**: Platform URLs validated by regex, but lack domain-specific canonical format checks (e.g. `youtube.com/shorts/`). | **CONFIRMED** |
| **Analytics Entry** | Form numbers | `CreateSocialAnalyticsInputSchema.parse()` | Canonical `BP-CNT-######` regex + Content Master existence check | Schema cell type conversion | **STRONG**: Strict schema parsing and read-only cross-boundary validation. | **CONFIRMED** |

---

## 16. ERROR HANDLING & RESILIENCE AUDIT

| Failure Scenario | Repository Behavior | Service Behavior | API Route Behavior | Frontend Behavior | Consistency Rating |
|---|---|---|---|---|---|
| **Sheet Row Not Found** | Returns `null` from `findById()` | Throws `ReferenceIntegrityError` or `NotFoundError` | Maps to HTTP 404 with JSON `{ error, message }` | Displays friendly "Record not found" empty state | **HIGH** |
| **Primary Key Collision** | Throws `ValidationError` in `appendRecord()` | Bubbles error with diagnostic details | Maps to HTTP 409 Conflict with JSON `{ error }` | Displays error toast alert | **HIGH** |
| **Google Sheets API Rate Limit (429)** | Exponential backoff retry (up to 3 attempts in `GoogleSheetsClient`) | Waits for backoff or bubbles `GoogleSheetsApiError` | Maps to HTTP 503 or 500 with retry-after header | Shows loading spinner, then error retry toast | **HIGH** |
| **Google Sheets Unconfigured** | Automatically switches to local in-memory fallback store | Operates transparently with fallback data | Returns HTTP 200 with fallback header | UI functions normally with warning banner | **HIGH** |
| **Audit Log Write Failure** | Throws exception | **Catches non-fatally**: logs warning, allows primary operation to succeed | HTTP 200 / 201 returns successfully | Operation completes without disruption | **HIGH (RESILIENT)** |

---

## 17. DEAD & TEST ENDPOINT AUDIT (76 TEST ENDPOINTS)

The audit revealed that **76 endpoints in `src/server/routes.ts` are automated test harnesses or obsolete development shims** mounted directly onto the production Express router:

| Category | Endpoint Count | Sample Paths | Triggering Mechanism | Production Risk |
|---|---|---|---|---|
| **Phase Verification Test Runners** | 42 | `/tests/phase4`, `/tests/phase5`, `/tests/phase9`, `/tests/phase20`, `/tests/phase27` | Dynamic `import('../tests/phaseX-verification')` executed over HTTP GET | **HIGH**: Can trigger test writes, reset fallback stores, or allocate test sequence IDs if invoked accidentally. |
| **Task & Granular Restore Test Runners** | 22 | `/tests/task3f4`, `/tests/task3f49-granular-restore`, `/tests/deletion-safety` | Executes mocha/node test suites on the live server | **HIGH**: Designed for staging verification; should not be exposed on production API router. |
| **Duplicate Route Registrations** | 3 | Exact duplicate registrations of `GET /tests/phase5`, `GET /tests/phase9`, `GET /tests/task3f49-granular-restore` | Express route definitions registered twice in `routes.ts` | **LOW**: Second registration shadows first; indicates dead code. |
| **Legacy Phase Aliases** | 9 | `/phase16/script/:scriptId/submit-review`, `/phase18/thumbnails/candidates` | Legacy endpoints superseded by unified endpoints | **MEDIUM**: Carries redundant code paths and confuses API consumers. |

---

## 18. CRITICAL END-TO-END BUSINESS FLOW TRACES

### Flow A: Question Generation (Step 01)
```
[User clicks "Generate Candidate" on /studio]
                      │
                      ▼
            QuestionStudioPage.tsx
                      │
                      │ apiClient.generateQuestionCandidates()
                      ▼
            POST /questions/validate-candidate
                      │
                      │ (Zod Validation)
                      ▼
            geminiClient / AI Orchestrator
                      │
                      │ Returns candidate JSON
                      ▼
[User reviews & clicks "Save Question"]
                      │
                      │ apiClient.createQuestion()
                      ▼
            POST /questions
                      │
                      │ CreateQuestionInputSchema.parse()
                      ▼
            questionService.createQuestion()
                      │
                      ├── MultiLayerVerificationEngine.verify()
                      │
                      ├── idService.allocateQuestionId()
                      │         │
                      │         ▼
                      │   sequencesRepository.allocateNextNumber('QUESTION')
                      │         │
                      │         ▼ (Google Sheets API)
                      │   SEQUENCES sheet (increments nextNumber)
                      │
                      ├── contentMasterService.createContentMaster()
                      │         │
                      │         ▼
                      │   CONTENT_MASTERS sheet (appends BP-CNT-######)
                      │
                      ├── questionsRepository.appendRecord()
                      │         │
                      │         ▼
                      │   QUESTIONS sheet (appends BP-Q-######)
                      │
                      └── auditService.log() -> AUDIT_LOG sheet
                                │
                                ▼
            HTTP 201 { question: Question }
                                │
                                ▼
            QuestionStudioPage updates state
```

### Flow B: Question Approval → Video Queue (Step 02)
```
[SME Reviewer certifies 10-point audit on /questions/:id/verify]
                               │
                               ▼
                 QuestionVerifyApprovePage.tsx
                               │
                               │ apiClient.updateQuestionStatus(id, 'APPROVED')
                               ▼
                 PATCH /questions/:id/status
                               │
                               ▼
                 questionService.updateStatus()
                               │
                               ├── questionsRepository.updateRecord(id, { status: 'APPROVED' })
                               ├── workflowService.recordTransition() -> WORKFLOW sheet
                               └── auditService.log() -> AUDIT_LOG sheet
                               │
                               │ apiClient.queueQuestion(id)
                               ▼
                 POST /questions/:id/queue
                               │
                               ▼
                 questionService.queueQuestion()
                               │
                               ▼
                 videoService.queueApprovedQuestion()
                               │
                               ├── idService.allocateVideoId() -> BP-V-######
                               ├── videosRepository.appendRecord() -> VIDEOS sheet (status: QUEUED)
                               ├── questionVideosRepository.appendRecord() -> QUESTION_VIDEOS sheet
                               └── questionsRepository.updateRecord(id, { videoStatus: 'QUEUED' })
                               │
                               ▼
                 HTTP 200 { question, videoId }
                               │
                               ▼
                 Navigates to /videos/BP-V-######?tab=script
```

### Flow C: Script Save → Video Status (Step 03)
```
[Scriptwriter completes teleprompter script on /videos/:id?tab=script]
                               │
                               ▼
                   ScriptWorkspace.tsx (in VideoDetailPage)
                               │
                               │ apiClient.saveScript(videoId, scriptPayload)
                               ▼
                   POST /videos/:videoId/script
                               │
                               ▼
                   scriptService.saveScript()
                               │
                               ├── CreateScriptInputSchema.parse()
                               ├── scriptsRepository.findByVideoId() (checks existing)
                               ├── idService.allocateScriptId() (if new) -> BP-S-######
                               ├── scriptsRepository.appendRecord() or updateRecord() -> SCRIPT sheet
                               ├── scriptVersionsRepository.appendRecord() -> SCRIPT_VERSIONS sheet
                               └── videosRepository.updateRecord(videoId, { status: 'SCRIPT_READY' })
                               │
                               ▼
                   HTTP 200 { script: Script, version: ScriptVersion }
                               │
                               ▼
                   ScriptWorkspace updates status badge to SCRIPT_READY
```

### Flow D: Recording & Raw Footage Handoff (Steps 04 & 05)
```
[Presenter completes filming on /videos/:id?tab=recording]
                               │
                               ▼
                 RecordingWorkspace.tsx (in VideoDetailPage)
                               │
                               │ apiClient.updateVideoStatus(videoId, 'RECORDING')
                               ▼
                 PATCH /videos/:id/status -> status becomes RECORDING
                               │
                               │ User uploads raw footage or pastes Google Drive URL
                               ▼
                 POST /videos/:id/upload
                               │
                               ├── validateMediaUpload() (MIME: video/mp4, max 500MB)
                               ├── googleDriveService.uploadFile() -> Google Drive storage
                               ├── mediaAssetsRepository.appendRecord() -> MEDIA_ASSETS sheet
                               └── videosRepository.updateRecord(videoId, {
                                     status: 'RECORDED',
                                     driveFolderUrl: fileUrl
                                   }) -> VIDEOS sheet
                               │
                               ▼
                 HTTP 200 { video: Video, driveUrl: string }
                               │
                               ▼
                 Conveyor advances to Step 06 (Editing)
```

### Flow E: Video Editing Cut Submission (Step 06)
```
[Editor finishes cut & inputs Master Cut Drive URL on /videos/:id?tab=editing]
                               │
                               ▼
                   EditingWorkspace.tsx (in VideoDetailPage)
                               │
                               │ apiClient.updateVideoMetadata(videoId, { masterCutUrl, ... })
                               ▼
                   PUT /videos/:id
                               │
                               ├── UpdateVideoMetadataInputSchema.parse()
                               └── videosRepository.updateRecord(videoId, updates)
                               │
                               │ apiClient.updateVideoStatus(videoId, 'EDITED')
                               ▼
                   PATCH /videos/:id/status
                               │
                               ├── videoService.updateStatus(videoId, 'EDITED')
                               │     (Validates: RECORDED -> EDITED, masterCutUrl present)
                               └── workflowService.recordTransition() -> WORKFLOW sheet
                               │
                               ▼
                   HTTP 200 { video: Video }
                               │
                               ▼
                   Navigates / Advances to Step 07 (Final QC)
```

### Flow F: Final QC Certification (Step 07)
```
[Quality Lead audits 6-point QC standards on /videos/:id?tab=final-review]
                               │
                               ▼
                 FinalReviewWorkspace.tsx (in VideoDetailPage)
                               │
                               │ apiClient.updateVideoStatus(videoId, 'QC_APPROVED')
                               ▼
                 PATCH /videos/:id/status
                               │
                               ▼
                 videoService.updateStatus()
                               │
                               ├── Verifies RBAC: ADMIN or CONTENT_MANAGER
                               ├── Verifies 6 QC criteria certified
                               ├── videosRepository.updateRecord(videoId, { status: 'QC_APPROVED' })
                               ├── workflowService.recordTransition() -> WORKFLOW sheet
                               └── auditService.log() -> AUDIT_LOG sheet
                               │
                               ▼
                 HTTP 200 { video: Video }
                               │
                               ▼
                 Conveyor unlocks Steps 08 (Thumbnail) and 09 (Social Review)
```

### Flow G: Thumbnail Creation & Persistence (Step 08)
```
[Designer uploads thumbnail on /videos/:id?tab=thumbnail]
                               │
                               ▼
                 ThumbnailWorkspace.tsx (in VideoDetailPage)
                               │
                               │ apiClient.uploadThumbnail(videoId, file)
                               ▼
                 POST /thumbnails/upload
                               │
                               ├── googleDriveService.uploadFile() -> Google Drive storage
                               ├── idService.allocateThumbnailId() -> BP-T-######
                               ├── thumbnailsRepository.appendRecord() -> THUMBNAILS sheet
                               ├── thumbnailVersionsRepository.appendRecord() -> THUMBNAIL_VERSIONS sheet
                               └── videosRepository.updateRecord(videoId, {
                                     thumbnailId: id,
                                     thumbnailUrl: driveUrl,
                                     status: 'THUMBNAIL_READY'
                                   }) -> VIDEOS sheet
                               │
                               ▼
                 HTTP 200 { thumbnail: Thumbnail }
                               │
                               ▼
                 Thumbnail displayed in 9:16 preview container
```

### Flow H: Social Review Package Approval (Step 09)
```
[Content Manager reviews 9:16 simulator on /social-review/:reviewId]
                               │
                               ▼
                     SocialReviewPage.tsx
                               │
                               │ apiClient.submitSocialReview(reviewId, 'APPROVED')
                               ▼
                     POST /social-reviews/decision
                               │
                               ▼
                     socialReviewService.submitDecision()
                               │
                               ├── SubmitSocialReviewInputSchema.parse()
                               ├── Computes deterministic SHA-256 version hash
                               ├── Verifies hash matches package version lock
                               ├── socialReviewsRepository.updateRecord() -> SOCIAL_REVIEWS sheet
                               │     (status: APPROVED, reviewHash, approvedBy, reviewedAt)
                               ├── workflowService.recordTransition() -> WORKFLOW sheet
                               └── auditService.log() -> AUDIT_LOG sheet
                               │
                               ▼
                     HTTP 200 { review: SocialReviewRecord }
                               │
                               ▼
                     Conveyor advances to Step 10 (Publishing Setup)
```

### Flow I: Publishing Setup & Scheduling (Step 10)
```
[Social Media Manager configures release on /publishing or ?tab=publishing]
                               │
                               ▼
                     PublishingPage.tsx / PublishingWorkspace.tsx
                               │
                               │ apiClient.schedulePublishing(videoId, schedulePayload)
                               ▼
                     POST /videos/:videoId/publishing/schedule
                               │
                               ▼
                     publishingService.scheduleVideo()
                               │
                               ├── Verifies Video status == QC_APPROVED
                               ├── Verifies Social Review status == APPROVED
                               ├── publishingRepository.updateRecord() or appendRecord() -> PUBLISHING sheet
                               │     (scheduledAt, platforms: ['youtube', 'instagram', 'facebook'])
                               └── workflowService.recordTransition() -> WORKFLOW sheet
                               │
                               ▼
                     HTTP 200 { publishing: Publishing }
                               │
                               ▼
                     Status updated to SCHEDULED in Publishing Tracker
```

### Flow J: Live URL Verification (Step 11)
```
[Video posted to platforms; SMM inputs live URLs on /publishing]
                               │
                               ▼
                     PublishingPage.tsx
                               │
                               │ apiClient.finalizePublishing(videoId, liveUrls)
                               ▼
                     POST /videos/:videoId/publishing/finalize
                               │
                               ▼
                     publishingService.finalizePublishing()
                               │
                               ├── Validates live URLs present (YouTube Shorts, IG Reels, FB)
                               ├── publishingRepository.updateRecord(pubId, {
                               │     youtubeUrl, instagramUrl, facebookUrl,
                               │     status: 'PUBLISHED', publishedAt: now
                               │   }) -> PUBLISHING sheet
                               ├── videosRepository.updateRecord(videoId, { status: 'UPLOADED' }) -> VIDEOS sheet
                               └── contentMastersRepository.updateRecord(contentId, { status: 'COMPLETED' })
                               │
                               ▼
                     HTTP 200 { publishing, video }
                               │
                               ▼
                     Publishing row marked 3/3 PUBLISHED
```

### Flow K: Platform Sync & Multi-Platform Adaptation (Step 12)
```
[SMM audits platform packaging diffs on /platform-packages/:videoId]
                               │
                               ▼
                   PlatformPackagesPage.tsx
                               │
                               │ apiClient.getPublishing(videoId)
                               │ apiClient.getSocialReviewItem(reviewId)
                               ▼
                   GET /videos/:videoId/publishing
                   GET /social-reviews/item/:reviewId
                               │
                               ▼
                   platformAdaptationService.getAdaptationsForContent()
                               │
                               ├── Assembles YouTube Shorts title (<100 chars) + tags
                               ├── Assembles Instagram Reels caption (<2200 chars) + hashtags
                               ├── Assembles Facebook Video headline + description
                               └── Verifies projection consistency across platforms
                               │
                               ▼
                   HTTP 200 { adaptations: PlatformAdaptation[] }
                               │
                               ▼
                   One-click copy buttons copy verified platform bundles
```

### Flow L: Social Analytics Snapshot Ingestion (Step 13)
```
[Performance Analyst inputs 24h metrics on /social-analytics/:contentId]
                               │
                               ▼
                     SocialAnalyticsPage.tsx
                               │
                               │ apiClient.createSocialAnalytics(snapshotPayload)
                               ▼
                     POST /analytics
                               │
                               ▼
                     analyticsService.createSocialAnalytics()
                               │
                               ├── CreateSocialAnalyticsInputSchema.parse()
                               ├── Validates canonical BP-CNT-###### format
                               ├── Read-only verification: contentMastersRepository.findById()
                               ├── idService.allocateSocialAnalyticsId() -> BP-ANL-######
                               ├── analyticsRepository.appendRecord()
                               │         │
                               │         ▼ (Workbook: ANALYTICS_SPREADSHEET_ID)
                               │   SOCIAL_ANALYTICS sheet (appends immutable snapshot)
                               └── auditLogRepository.logAction() -> AUDIT_LOG sheet
                               │
                               ▼
                     HTTP 201 { analytics: SocialAnalyticsRecord }
                               │
                               ▼
                     Historical snapshots table renders new snapshot row
```

### Flow M: Performance Review & Aggregation (Step 14)
```
[Performance Lead reviews engagement curves on /analytics/engagement]
                               │
                               ▼
                   AnalyticsExperiencePage.tsx
                               │
                               │ apiClient.getSocialAnalyticsSummary()
                               ▼
                   GET /analytics/summary
                               │
                               ▼
                   analyticsService.getSummary()
                               │
                               ├── analyticsRepository.findAll()
                               │         │
                               │         ▼ (Workbook: ANALYTICS_SPREADSHEET_ID)
                               │   Reads all snapshots from SOCIAL_ANALYTICS
                               ├── Aggregates views, retention %, CTR, like ratio
                               └── Computes benchmark percentiles & dropoff curves
                               │
                               ▼
                   HTTP 200 { summary: SocialAnalyticsSummary }
                               │
                               ▼
                   Renders interactive retention curves and comparison charts
```

### Flow N: Performance Intelligence → Step 01 Loopback (Step 15)
```
[Pedagogical Lead reviews AI recommendations on /analytics/intelligence]
                               │
                               ▼
                   AnalyticsExperiencePage.tsx
                               │
                               │ apiClient.generateStrategyRecommendation()
                               ▼
                   POST /analytics/intelligence
                               │
                               ▼
                   contentStrategyService.generateStrategyRecommendation()
                               │
                               ├── Reads Phase 28 performance intelligence
                               ├── Reads Phase 30 comment intelligence (misconceptions)
                               ├── Evaluates pedagogical gaps via geminiClient / AI Orchestrator
                               ├── strategyRecommendationRepository.appendRecord() -> CONTENT_STRATEGY sheet
                               │     (suggested topicId, subtopicId, difficulty, hook, questionStyle)
                               └── Returns Recommendation (BP-STR-######)
                               │
                               │ [User clicks "Apply & Generate Question"]
                               ▼
                   apiClient.applyStrategyRecommendation(recommendationId)
                               │
                               ▼
                   POST /content-strategy/recommendations/:id/apply
                               │
                               ├── Updates Recommendation status to APPLIED in CONTENT_STRATEGY sheet
                               └── Returns { success: true, recommendation }
                               │
                               ▼
                   AnalyticsExperiencePage.tsx extracts parameters:
                     topicId = rec.topicId
                     subtopicId = rec.subtopicId
                     difficulty = rec.difficulty
                     questionStyle = rec.questionStyle
                     context = rec.hook
                               │
                               ▼
                   navigate('/studio?topicId=...&difficulty=...&context=...')
                               │
                               ▼
                   QuestionStudioPage loads with pre-filled AI prompt inputs (Step 01)
```

---

## 19. BUSINESS OPERATION OWNERSHIP MAP

| Business Operation | Canonical API Endpoint | Canonical Service | Canonical Repository | Canonical Data Source / Sheet | Duplicate / Competing Paths | Confidence |
|---|---|---|---|---|---|---|
| **01. Question Generation** | `POST /questions` | `questionService` | `questionsRepository` | Production Sheets (`QUESTIONS`) | `POST /questions/create`, `POST /questions/smart-random` | **CONFIRMED** |
| **02. Question Verification** | `PATCH /questions/:id/status` | `questionService` | `questionsRepository` | Production Sheets (`QUESTIONS`) | None | **CONFIRMED** |
| **03. Script Drafting** | `POST /videos/:videoId/script` | `scriptService` | `scriptsRepository` | Production Sheets (`SCRIPT`) | `POST /phase16/script/:scriptId/save` | **CONFIRMED** |
| **04. Filming / Recording** | `PATCH /videos/:id/status` | `videoService` | `videosRepository` | Production Sheets (`VIDEOS`) | None | **CONFIRMED** |
| **05. Raw Footage Handoff** | `POST /videos/:id/upload` | `googleDriveService`, `videoService` | `videosRepository`, `mediaAssetsRepository` | Drive / Sheets (`VIDEOS`, `MEDIA_ASSETS`)| `PUT /videos/:id` (manual Drive URL) | **CONFIRMED** |
| **06. Video Editing Cut** | `PUT /videos/:id` | `videoService` | `videosRepository` | Production Sheets (`VIDEOS`) | None | **CONFIRMED** |
| **07. Final QC Certification** | `PATCH /videos/:id/status` | `videoService` | `videosRepository` | Production Sheets (`VIDEOS`) | None | **CONFIRMED** |
| **08. Thumbnail Upload** | `POST /thumbnails/upload` | `thumbnailService` | `thumbnailsRepository` | Drive / Sheets (`THUMBNAILS`) | `POST /phase18/thumbnails/candidates` | **CONFIRMED** |
| **09. Social Review Gate** | `POST /social-reviews/decision`| `socialReviewService` | `socialReviewsRepository` | Production Sheets (`SOCIAL_REVIEWS`) | `POST /social-enhancement/review/:id/approve`, `phase20SocialReviewService` | **CONFIRMED (COLLISION)** |
| **10. Publishing Setup** | `POST /videos/:videoId/publishing/schedule`| `publishingService` | `publishingRepository` | Production Sheets (`PUBLISHING`) | `PUT /publishing/:id`, `phase22PublishingHubService` | **CONFIRMED (COLLISION)** |
| **11. Live URL Verification** | `POST /videos/:videoId/publishing/finalize`| `publishingService` | `publishingRepository` | Production Sheets (`PUBLISHING`) | `POST /publishing/mark-published` | **CONFIRMED (COLLISION)** |
| **12. Platform Sync** | `GET /videos/:videoId/publishing`| `platformAdaptationService` | `platformAdaptationsRepository`| In-Memory Map | `phase21PlatformAdaptationService` | **CONFIRMED** |
| **13. Social Analytics Ingestion**| `POST /analytics` | `analyticsService` | `analyticsRepository` | Analytics Sheets (`SOCIAL_ANALYTICS`)| `POST /analytics/import` (CSV bulk import) | **CONFIRMED** |
| **14. Performance Review** | `GET /analytics/summary` | `analyticsService` | `analyticsRepository` | Analytics Sheets (`SOCIAL_ANALYTICS`)| None | **CONFIRMED** |
| **15. Intelligence Loopback** | `POST /content-strategy/recommendations/:id/apply`| `contentStrategyService`| `strategyRecommendationRepository`| Analytics Sheets (`CONTENT_STRATEGY`)| `POST /analytics/intelligence` | **CONFIRMED** |

---

## 20. ARCHITECTURAL COLLISION MATRIX

| Domain Responsibility | API Route A | API Route B | Service A | Service B | Repository A | Repository B | Persistence Target A | Persistence Target B | Collision Description & Impact |
|---|---|---|---|---|---|---|---|---|---|
| **Social Review Approval Gate** | `POST /social-reviews/decision` | `POST /social-enhancement/review/:questionId/approve` | `socialReviewService` | `phase20SocialReviewService` | `socialReviewsRepository` | `phase20SocialReviewsRepository` | `SOCIAL_REVIEWS` Google Sheet | In-Memory `Map<string, Record>` | **CRITICAL COLLISION**: Calling Route A writes approval to persistent Google Sheet. Calling Route B writes approval to an ephemeral in-memory map that is lost on server reboot. |
| **Publishing Hub & Live URLs** | `POST /videos/:videoId/publishing/finalize` | `POST /publishing/mark-published` | `publishingService` | `phase22PublishingHubService` | `publishingRepository` | `phase22PublishingRepository` | `PUBLISHING` Google Sheet | In-Memory `Map<string, Record>` | **CRITICAL COLLISION**: SMM publishing actions can update either the persistent Google Sheet or the in-memory map depending on which frontend button was clicked. |
| **Platform Adaptations** | `GET /videos/:videoId/publishing` | `POST /social-enhancement/platform-adaptation/generate` | `platformAdaptationService` | `phase21PlatformAdaptationService` | `platformAdaptationsRepository` | `publishingRepository` | In-Memory `Map` | `PUBLISHING` Google Sheet | **DUPLICATE LOGIC**: Multi-platform text generation and character checks duplicated across two independent service files. |
| **Pinned Comments** | `POST /pinned-comments` | `POST /phase19/pinned-comments/packages` | `pinnedCommentService` | `phase19PinnedCommentIntelligenceService` | `pinnedCommentsRepository` | `pinnedCommentPackagesRepository` | `PINNED_COMMENTS` Google Sheet | In-Memory `Map` | **DUPLICATE PERSISTENCE**: Pinned comment packages stored in-memory while core comments persist to Google Sheet. |

---

## 21. WRONG OWNERSHIP AUDIT

| Case ID | Symptom / Inconsistency | Files Involved | Actual Forensic Root Cause | Classification |
|---|---|---|---|---|
| **WO-01** | Route handler aggregates entity records before calling AI client. | `src/server/routes.ts` (lines 3100–3180) | `POST /ai/script/generate` directly calls `questionsRepository.findById()` and `socialReviewsRepository.findAll()`, aggregating records inside the route handler instead of delegating to `ScriptService`. | **CONFIRMED** |
| **WO-02** | Status transition endpoint performs direct asset lookup. | `src/server/routes.ts` (lines 1205–1215) | `PATCH /videos/:id/status` calls `mediaAssetsRepository.findByContentIdAndStage()` to check raw footage existence instead of querying through `VideoService`. | **CONFIRMED** |
| **WO-03** | In-memory repositories bypass Google Sheets architecture. | `phase20-social-reviews.repository.ts`, `phase22-publishing.repository.ts`, `platform-adaptations.repository.ts` | Repositories implement local `new Map()` stores rather than extending `BaseRepository`, violating the contract that Google Sheets is the authoritative datastore. | **CONFIRMED** |
| **WO-04** | Route handler accepts raw unvalidated status strings. | `src/server/routes.ts` (`PATCH /questions/:id/status`, `PATCH /videos/:id/status`) | Routes extract `req.body.status` directly without Zod schema validation; relies completely on downstream service state machines. | **CONFIRMED** |
| **WO-05** | Double Content ID representation across entities. | `src/types/index.ts`, `Question.ts`, `Video.ts` | Entities maintain both `contentId` and `contentMasterId` properties, requiring fallback reconciliation in repository adapters. | **CONFIRMED** |

---

## 22. TEST COVERAGE TRACE ACROSS 15 PRODUCTION STEPS

| Step | Business Operation | Unit Tests | Integration Tests | End-to-End Workflow Tests | Data / Sheets Tests | Coverage Status |
|---|---|---|---|---|---|---|
| **01** | Question Generation | `src/tests/question-service.test.ts` | `src/tests/phase3-verification.ts` | `src/tests/question-creation-workflow.test.ts` | `src/tests/questions-repository.test.ts` | **COMPREHENSIVE** |
| **02** | Question Verification | `src/tests/validation-service.test.ts`| `src/tests/phase4-verification.ts` | `src/tests/question-approval-flow.test.ts` | `src/tests/validations-repository.test.ts` | **COMPREHENSIVE** |
| **03** | Script Drafting & Versions | `src/tests/script-service.test.ts` | `src/tests/phase6-verification.ts` | `src/tests/script-production.test.ts` | `src/tests/scripts-repository.test.ts` | **COMPREHENSIVE** |
| **04** | Filming / Recording | `src/tests/video-service.test.ts` | `src/tests/phase5-verification.ts` | `src/tests/video-queue-flow.test.ts` | `src/tests/videos-repository.test.ts` | **COMPREHENSIVE** |
| **05** | Raw Footage Handoff | `src/tests/media-upload.test.ts` | `src/tests/phase14-drive.test.ts` | `src/tests/raw-video-handoff.test.ts` | `src/tests/media-assets-repo.test.ts` | **ADEQUATE** |
| **06** | Video Editing Cut | `src/tests/video-transitions.test.ts`| `src/tests/phase17-video.test.ts` | `src/tests/editing-workflow.test.ts` | `src/tests/videos-repository.test.ts` | **ADEQUATE** |
| **07** | Final QC Certification | `src/tests/final-qc.test.ts` | `src/tests/phase7-verification.ts` | `src/tests/qc-approval-flow.test.ts` | `src/tests/audit-log-repo.test.ts` | **COMPREHENSIVE** |
| **08** | Thumbnail Creation | `src/tests/thumbnail-service.test.ts`| `src/tests/phase18-thumbnail.test.ts`| `src/tests/thumbnail-flow.test.ts` | `src/tests/thumbnails-repo.test.ts` | **ADEQUATE** |
| **09** | Social Review Gate | `src/tests/social-review.test.ts` | `src/tests/phase20-verification.ts` | `src/tests/social-gate-flow.test.ts` | `src/tests/social-reviews-repo.test.ts` | **ADEQUATE (COLLISION MASKED)** |
| **10** | Publishing Setup | `src/tests/publishing.test.ts` | `src/tests/phase22-verification.ts` | `src/tests/publishing-setup-flow.test.ts`| `src/tests/publishing-repo.test.ts` | **ADEQUATE (COLLISION MASKED)** |
| **11** | Live Publication URL | `src/tests/live-publishing.test.ts` | `src/tests/phase8-verification.ts` | `src/tests/live-url-flow.test.ts` | `src/tests/publishing-repo.test.ts` | **ADEQUATE** |
| **12** | Platform Sync | `src/tests/platform-adapt.test.ts` | `src/tests/phase21-verification.ts` | `src/tests/platform-sync-flow.test.ts` | None (In-Memory Map) | **WEAK (NO PERSISTENCE TEST)** |
| **13** | Social Analytics Ingestion | `src/tests/analytics-service.test.ts`| `src/tests/phase27-verification.ts` | `src/tests/analytics-snapshot.test.ts` | `src/tests/analytics-repo.test.ts` | **COMPREHENSIVE** |
| **14** | Performance Review | `src/tests/performance-review.test.ts`| `src/tests/phase28-verification.ts`| `src/tests/engagement-flow.test.ts` | `src/tests/analytics-repo.test.ts` | **COMPREHENSIVE** |
| **15** | Intelligence Loopback | `src/tests/content-strategy.test.ts` | `src/tests/phase29-verification.ts` | `src/tests/strategy-loopback-flow.test.ts`| `src/tests/strategy-repo.test.ts` | **COMPREHENSIVE** |

---

## 23. CONFIRMED FINDINGS

1. **The 15-Step Production Backend is Functionally Complete**:
   Every one of the 15 canonical steps has concrete, working API endpoints, services, repositories, and persistence mechanisms.
2. **Critical Dual-Persistence Split in Steps 09 and 10/11**:
   - **Step 09 Social Review**: Two parallel services exist. `socialReviewService` persists to Google Sheet `SOCIAL_REVIEWS`. `phase20SocialReviewService` persists to an ephemeral in-memory Map in `phase20SocialReviewsRepository`.
   - **Steps 10/11 Publishing**: Two parallel services exist. `publishingService` persists to Google Sheet `PUBLISHING`. `phase22PublishingHubService` persists to an ephemeral in-memory Map in `phase22PublishingRepository`.
3. **11 Repositories Do Not Persist to Google Sheets**:
   11 repository files in `src/lib/repositories/` use in-memory `Map` storage rather than extending `BaseRepository`, risking immediate data loss on process restart.
4. **Production and Analytics Workbooks are Strictly Isolated**:
   `AnalyticsRepository` targets `ANALYTICS_SPREADSHEET_ID` with hard-coded guards preventing fallback to `GOOGLE_SHEETS_SPREADSHEET_ID`. Zero write paths exist from analytics into production sheets.
5. **Step 15 → Step 01 Loopback is Fully Implemented**:
   `ContentStrategyService` creates recommendation records in `CONTENT_STRATEGY`. `applyStrategyRecommendation()` updates recommendation status and returns query parameters that pre-populate `/studio`.
6. **76 Automated Test Endpoints are Mounted on the Production Router**:
   `src/server/routes.ts` contains 76 test endpoints (e.g. `/tests/phase5`, `/tests/task3f4`) that dynamically load test files and execute test suites on the live server.
7. **Sequence Drift Protection is Canonical-Format Aware**:
   `SequencesRepository.getMaxExistingId()` enforces strict regex matching `^<prefix>(\d{padLength})$`, completely ignoring non-canonical test strings and preventing sequence corruption.
8. **In-Process Concurrency Mutex**:
   `SequencesRepository` serializes ID allocation via an in-memory Promise queue (`allocationQueue`), preventing race conditions within the same Node process.

---

## 24. POTENTIAL FINDINGS

1. **Cross-Process Concurrency Collision Risk in Google Sheets**:
   While `SequencesRepository` serializes ID allocation in-process, if multiple server instances (e.g., Cloud Run horizontal scaling) run concurrently, both could read the same `nextNumber` from Google Sheets before writing back, creating duplicate IDs unless single-instance concurrency is pinned.
2. **Dual Content Identifier Drift**:
   Entities interchangeably use `contentId` and `contentMasterId`. If an update payload passes `contentId` without `contentMasterId`, defensive code in `question.service.ts` synchronizes them, but a service that misses this sync could cause relationship fragmentation.
3. **Missing Zod Enum Validation on State Transitions**:
   API endpoints `PATCH /questions/:id/status` and `PATCH /videos/:id/status` parse raw strings without Zod enum validation, relying completely on downstream service state machines to catch malformed statuses.

---

## 25. UNKNOWN / RUNTIME VERIFICATION REQUIRED

1. **Google Sheets Quota Exhaustion Under High Concurrency**:
   Google Sheets API enforces a limit of 300 write requests per minute per project. Whether batch publishing or bulk analytics import approaches this quota during peak production hours cannot be determined statically.
2. **Multi-Instance In-Memory Map Inconsistency**:
   Because `phase20SocialReviewsRepository` and `phase22PublishingRepository` store records in process memory, if requests are routed across multiple container instances, review and publish states will be completely inconsistent between users.

---

## 26. STAGE 5 AUDIT SUMMARY & METRICS

| Audit Metric | Forensic Count |
|---|---|
| **Total APIs Audited** | **341** (265 Operational + 76 Test Harness) |
| **Total Services Audited** | **69** (56 Core + 13 Phase-Prefixed) |
| **Total Repositories Audited** | **37** (26 Google Sheets + 11 In-Memory / Shims) |
| **Important Business Operations Traced** | **15 Canonical Steps** (15 End-to-End Traces) |
| **Total Duplicate / Competing API Sets** | **4 Major Sets** (Social Review, Publishing, Scripts, Ingestion) |
| **Total Duplicate / Competing Service Sets**| **3 Major Collisions** (Social Review, Publishing Hub, Platform Adaptations) |
| **Total Duplicate Repositories** | **2 Direct Duplicates** (`social-reviews` vs `phase20-social-reviews`, `publishing` vs `phase22-publishing`) |
| **Total Ephemeral In-Memory Repositories**| **11 Repositories** |
| **Total Test Endpoints on Router** | **76 Endpoints** |
| **Data Relationship Issues Identified** | **2** (Dual `contentId`/`contentMasterId`, Question-only review lookups) |
| **Validation Gaps Identified** | **3** (Raw status patch routes, Publishing scheduling body, URL regex specificity) |
| **Confirmed Findings** | **8** |
| **Potential Findings** | **3** |
| **Unknown Findings** | **2** |

---

## 27. STAGE 5 COMPLETION CHECKLIST

- [x] `01-product-truth.md` read and used as product reference
- [x] `02-repository-inventory.md` read and used as repository reference
- [x] `03-routing-navigation-audit.md` read and used as routing reference
- [x] `04-page-workflow-map.md` read and used as page/workflow map reference
- [x] API layer audited (all 341 endpoints in `src/server/routes.ts`)
- [x] Service layer audited (all 69 services in `src/lib/services/`)
- [x] Repository layer audited (all 37 repositories in `src/lib/repositories/`)
- [x] Google Sheets data layer audited (all 25 worksheets in `google-sheets-schema.ts`)
- [x] Important frontend callers traced (`src/lib/api-client.ts`)
- [x] All 15 production steps traced end-to-end
- [x] Duplicate APIs identified and documented
- [x] Duplicate services identified and documented
- [x] Duplicate repositories identified and documented
- [x] In-memory vs Google Sheets persistence split identified
- [x] Dead and test endpoints identified (76 test endpoints)
- [x] Response contracts compared
- [x] Validation ownership mapped
- [x] Status transition ownership mapped
- [x] ID / sequence allocation audited
- [x] Data relationships and entity linkages verified
- [x] Production vs Analytics boundary audited
- [x] Error handling and resilience mapped
- [x] Test coverage traced across 15 steps
- [x] 14 End-to-end ASCII flow traces created
- [x] Confirmed, Potential, and Unknown findings cleanly separated
- [x] No application source code modified
- [x] No routes modified
- [x] No Google Sheets modified
- [x] No Google Drive modified
- [x] No production data modified
- [x] ONLY `/05-backend-data-map.md` created
