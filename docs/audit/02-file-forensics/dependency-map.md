# Dependency Map

**System:** Burra Pariksha Content Management System (BP-CMS)
**Audit Step:** 02 — Complete File-by-File Forensic Inventory
**Audit Date:** 2026-09-28

## Core Subsystem Architecture Chains

```
CLIENT ROUTE (React Router v7 in src/App.tsx)
  ↓ renders
PAGE COMPONENT (src/pages/*.tsx)
  ↓ composes
DOMAIN / ATOMIC UI (src/components/* & src/design-system/components/*)
  ↓ invokes API or direct service
EXPRESS ROUTER (src/server/routes.ts & src/server/drive-routes.ts)
  ↓ executes RBAC & Safety Gate
AUTH & RBAC ENGINE (src/lib/ownership/data-ownership.ts & src/server/middleware/auth.middleware.ts)
  ↓ coordinates domain logic
DOMAIN SERVICES (src/lib/services/*.service.ts & src/lib/workflow/)
  ↓ dispatches AI generation / validation
AI SUBSYSTEM & VALIDATION ENGINES (src/lib/ai/ & src/lib/validation/)
  ↓ reads/writes persistent entities
REPOSITORIES (src/lib/repositories/*.repository.ts)
  ↓ executes rate-limited backoff requests
GOOGLE SHEETS API (src/lib/google-sheets/client.ts) & GOOGLE DRIVE API (src/lib/services/google-drive.service.ts)
```

## Direct File-to-File Dependency Samples (High-Impact Cores)

### `server.ts`
- **Imports (8):**
  - `express`
  - `path`
  - `fs`
  - `vite`
  - `./src/server/routes`
  - `./src/lib/services/snapshot-scheduler.service`
  - `./src/lib/repositories/users.repository`
  - `./src/lib/services/google-drive.service`
- **Exports (0):**

### `src/App.tsx`
- **Imports (29):**
  - `react`
  - `react-router-dom`
  - `./contexts/AuthContext`
  - `./contexts/ProductionJourneyContext`
  - `./pages/LoginPage`
  - `./components/layout/Layout`
  - `./pages/DashboardPage`
  - `./pages/QuestionLibraryPage`
  - `./pages/QuestionDetailPage`
  - `./pages/QuestionImprovePage`
  - `./pages/QuestionVerifyApprovePage`
  - `./pages/QuestionStudioPage`
  - `./pages/QueuePage`
  - `./pages/ProductionTrackerPage`
  - `./pages/VideoDetailPage`
  - `./pages/VideoCreateScriptPage`
  - `./pages/PlatformPackagesPage`
  - `./pages/PublishingPage`
  - `./pages/SocialAnalyticsPage`
  - `./pages/AnalyticsExperiencePage`
  - `./pages/SettingsPage`
  - `./pages/RecoveryAdminPage`
  - `./pages/PlanningPage`
  - `./pages/MyWorkPage`
  - `./pages/TeamOperationsPage`
  - `./pages/ContentMasterPage`
  - `./pages/SocialReviewPage`
  - `./pages/NotFoundPage`
  - `./config/roles`
- **Exports (2):**
  - `App`
  - `default`

### `src/server/routes.ts`
- **Imports (30):**
  - `../lib/services`
  - `../lib/services/question-draft.service`
  - `../lib/repositories/question-drafts.repository`
  - `../lib/repositories/thumbnail-candidates.repository`
  - `../lib/validators/thumbnail-safety.validator`
  - `../lib/ai/gemini.client`
  - `../lib/ai/phase24-orchestrator.service`
  - `../lib/google-sheets/client`
  - `../types`
  - `../lib/services/production-asset-validation.service`
  - `../lib/services/object-auth.service`
  - `../lib/repositories/users.repository`
  - `../lib/repositories/questions.repository`
  - `../lib/repositories/media-assets.repository`
  - `../lib/repositories/videos.repository`
  - `../lib/repositories/social-reviews.repository`
  - `../lib/repositories/thumbnails.repository`
  - `../lib/repositories/scripts.repository`
  - `../lib/services/social-enhancement.service`
  - `../lib/services/social-review.service`
  - `../lib/schemas/google-sheets-schema`
  - `../lib/services/social-comments.service`
  - `../lib/services/comment-intelligence.service`
  - `helmet`
  - `busboy`
  - `googleapis`
  - `../lib/services/google-drive.service`
  - `express-rate-limit`
  - `./middleware/auth.middleware`
  - `./test-routes`
- **Exports (3):**
  - `apiRouter`
  - `aiRateLimiter`
  - `getRequestActor`

### `src/lib/google-sheets/client.ts`
- **Imports (4):**
  - `googleapis`
  - `./errors`
  - `./helpers`
  - `../services/deletion-safety.service`
- **Exports (10):**
  - `GoogleSheetsConfig`
  - `RetryOptions`
  - `OperationalTelemetry`
  - `RateLimiterConfig`
  - `RateLimiterStats`
  - `isRateLimitError`
  - `RequestPressureLimiter`
  - `calculateBackoffDelay`
  - `GoogleSheetsClient`
  - `googleSheetsClient`

### `src/lib/services/google-drive.service.ts`
- **Imports (3):**
  - `googleapis`
  - `stream`
  - `../google-sheets/errors`
- **Exports (5):**
  - `DriveFileMetadata`
  - `ContentFolderHierarchy`
  - `DriveDownloadResult`
  - `GoogleDriveService`
  - `googleDriveService`

### `src/lib/services/video.service.ts`
- **Imports (15):**
  - `../repositories`
  - `../repositories/media-assets.repository`
  - `./id.service`
  - `./workflow.service`
  - `./audit.service`
  - `./assignment.service`
  - `./content-master.service`
  - `./google-drive.service`
  - `./object-auth.service`
  - `../../config/media-upload.config`
  - `stream`
  - `../../types`
  - `./production-asset-validation.service`
  - `../schemas/google-sheets-schema`
  - `../google-sheets/errors`
- **Exports (3):**
  - `VALID_VIDEO_TRANSITIONS`
  - `VideoService`
  - `videoService`

### `src/lib/services/question.service.ts`
- **Imports (17):**
  - `../repositories/questions.repository`
  - `../repositories/content-masters.repository`
  - `../repositories/validations.repository`
  - `../schemas/google-sheets-schema`
  - `../../types`
  - `./id.service`
  - `./taxonomy.service`
  - `./workflow.service`
  - `./audit.service`
  - `./content-master.service`
  - `../google-sheets/errors`
  - `../validation/multi-layer-verification.engine`
  - `crypto`
  - `./video.service`
  - `../validators/question-creation.validator`
  - `./smart-random.service`
  - `./question-config.service`
- **Exports (5):**
  - `DuplicateMatch`
  - `normalizeQuestionText`
  - `IdempotencyCacheEntry`
  - `QuestionService`
  - `questionService`

### `src/lib/ownership/data-ownership.ts`
- **Imports (1):**
  - `../schemas/google-sheets-schema`
- **Exports (5):**
  - `FieldSemanticRole`
  - `resolveContentMasterId`
  - `isCanonicalDomainId`
  - `EntityOwnershipContract`
  - `ENTITY_OWNERSHIP_MATRIX`

### `src/lib/ai/gemini.client.ts`
- **Imports (1):**
  - `@google/genai`
- **Exports (1):**
  - `geminiClient`

