# 03 — CURRENT SYSTEM BASELINE

Stage: 03 — Current System Baseline

Status:
ACCEPTED

Implementation Status:
COMPLETE — AUTHORITATIVE CURRENT SYSTEM BASELINE & VERIFICATION SUITE ESTABLISHED

Approval:
PRODUCT OWNER ACCEPTED (v1.1.0)

Version:
1.1.0 (Master SDLC Reset Baseline)

Date:
2026-10-02

Purpose:
Freezes and documents the ACTUAL CURRENT SYSTEM as it exists today. This is a brownfield forensic baseline of empirical reality, completely decoupled from target architecture roadmaps, aspirational designs, or future modernization proposals.

---

## 01. Document Control & Baseline Identity

| Attribute | Specification | Evidence Classification |
| :--- | :--- | :---: |
| **Document Title** | BP-CMS Stage 03 Current System Baseline | FACT |
| **Canonical File Path** | `docs/baseline/03-CURRENT-SYSTEM-BASELINE.md` | FACT |
| **Baseline Type** | Brownfield Forensic Software Baseline (Read-Only State Freeze) | FACT |
| **Current Stage** | Stage 03 — Current System Baseline | FACT |
| **Status** | **ACCEPTED** | FACT |
| **Version** | `1.1.0` (Master SDLC Reset Baseline) | FACT |
| **Acceptance Status** | **PRODUCT OWNER ACCEPTED** | FACT |
| **Implementation Status** | **COMPLETE** (Executable test suite: `src/tests/stage03-current-system-baseline.test.ts`) | FACT |
| **Preceding Verified Stages** | Stage 01 (`01-REQUIREMENTS-BASELINE.md` - Accepted v1.1.0), Stage 02 (`02-BUSINESS-ACCEPTANCE-CRITERIA.md` - Accepted v1.1.0) | FACT |
| **Automated Test Script** | `npm run test:stage03` (`tsx src/tests/stage03-current-system-baseline.test.ts`) | FACT |
| **Audit Methodology** | Static Source Code Analysis, AST Symbol Tracing, Runtime Environment Probe | FACT |
| **Source of Truth Commit** | Baseline frozen at commit `548ff5d2c1adcbcb6ea82425856a59032169ec2f` | FACT |

### Categorical Separation & Semantic Definitions
Throughout this document, the following operational classifications are strictly enforced:
- **FACT:** Directly observed in current application source code, configuration files, package manifests, or active runtime environment. Cited with file path, line numbers, and symbol names.
- **INFERENCE:** Logical deduction drawn directly from observed facts, where the underlying mechanism is partially implicit or derived from side effects.
- **UNKNOWN:** Areas where repository source code is silent, ambiguous, or lacks definitive trace evidence.
- **UNVERIFIED:** Behaviors that require live third-party cloud interaction (e.g., active Google Sheets quota limits, Google Drive remote trash retention) that cannot be safely tested without live production mutation.
- **TARGET ARCHITECTURE / ASPIRATIONAL:** Any proposal, design, or roadmap document (such as `docs/architecture/29-target/` or `docs/engineering/30-master-plan/`) describing PostgreSQL, Cloud SQL, Redis, BullMQ, or WebSockets. These represent **WHAT THE SYSTEM SHOULD BECOME IN FUTURE STAGES**, and are **STRICTLY NOT PART OF THE CURRENT IMPLEMENTATION**.

---

## 03.1 Repository Baseline

### Directory Structure & Inventory
The repository is structured as a full-stack TypeScript project running Express with Vite middleware in development and a standalone Node.js CommonJS server in production.

| Directory Path | Purpose / Domain Role | File Count | Current Status | Code Evidence Reference |
| :--- | :--- | :---: | :---: | :--- |
| `/` | Monorepo Root: Package configs, build manifests, server entry | 14 | ACTIVE | `package.json`, `server.ts`, `vite.config.ts`, `tsconfig.json`, `Dockerfile` |
| `/src/` | Primary TypeScript source tree | - | ACTIVE | `src/App.tsx`, `src/index.css` |
| `/src/pages/` | Routed full-screen React page views | 31 | ACTIVE | 31 `.tsx` files (`src/pages/*.tsx`) |
| `/src/components/` | Presentation, domain, and workflow UI components | 80+ | ACTIVE | Subdirectories: `assignments`, `common`, `dashboard`, `layout`, `production`, `publishing`, `questions`, `queue`, `social`, `video` |
| `/src/design-system/` | Design system component tokens & UI primitives | 12 | ACTIVE (DUPLICATE) | `src/design-system/components/` (coexists with `src/components/common/`) |
| `/src/server/` | Express API router, middleware, and test routers | 4 | ACTIVE | `src/server/routes.ts` (6,571 lines), `src/server/test-routes.ts`, `src/server/middleware/` |
| `/src/lib/services/` | Business logic singletons and domain orchestrators | 69 | ACTIVE | `src/lib/services/*.ts` (~39,888 lines) |
| `/src/lib/repositories/` | Data access layer wrapping Google Sheets and local caches | 37 | ACTIVE | `src/lib/repositories/*.ts` |
| `/src/lib/schemas/` | Authoritative Google Sheets schema contracts (Zod) | 1 | ACTIVE | `src/lib/schemas/google-sheets-schema.ts` (1,585 lines) |
| `/src/lib/google-sheets/`| Google Sheets API v4 client, error mapping, batch helpers | 3 | ACTIVE | `src/lib/google-sheets/client.ts`, `errors.ts`, `helpers.ts` |
| `/src/lib/ai/` | Google Gemini AI SDK client and orchestrators | 3 | ACTIVE | `src/lib/ai/gemini.client.ts`, `ai-orchestrator.service.ts` |
| `/src/lib/workflow/` | State machine engines, transition guards, step definitions | 6 | ACTIVE | `src/lib/workflow/` (`canonical-workflow.ts`, `media-storage-guard.ts`, etc.) |
| `/src/contexts/` | React Context providers (Auth, Production Journey) | 2 | ACTIVE | `src/contexts/AuthContext.tsx`, `ProductionJourneyContext.tsx` |
| `/src/types/` | Global TypeScript enums, interfaces, domain types | 4 | ACTIVE | `src/types/index.ts` (3,277 lines), `ai.ts`, `copilot.ts`, `consensus.ts` |
| `/src/tests/` | Standalone test scripts and regression suites | 145 | ACTIVE | Executed individually via `tsx` runner |
| `/docs/` | Repository documentation, audit archives, engineering plans | 300+ | ACTIVE | `docs/audit/`, `docs/engineering/`, `docs/requirements/`, `docs/acceptance/` |

### Package Dependencies (`package.json`)
- **HTTP Backend Server:** `express` (`^4.21.2`)
- **Frontend View Engine:** `react` & `react-dom` (`^19.0.1`)
- **Client SPA Routing:** `react-router-dom` (`^7.18.2`)
- **Google Cloud Persistence:** `googleapis` (`^176.0.0`) for Google Sheets v4 and Google Drive v3
- **Generative AI SDK:** `@google/genai` (`^2.4.0`)
- **Schema Validation:** `zod` (`^4.4.3`)
- **Security Middleware:** `helmet` (`^8.3.0`), `express-rate-limit` (`^8.7.0`)
- **Multipart Streaming:** `busboy` (`^1.6.0`)
- **Styling & UI:** `tailwindcss` (`^4.1.14`), `@tailwindcss/vite` (`^4.1.14`), `lucide-react` (`^0.546.0`), `motion` (`^12.23.24`)
- **Build & Execution:** `typescript` (`~5.8.2`), `tsx` (`^4.21.0`), `vite` (`^6.2.3`), `esbuild` (`^0.25.0`)

### Runtime Model & Server Execution
- **Dev Mode (`npm run dev`):** Express server starts on `HOST:PORT` (`server.ts`). In development (`NODE_ENV !== 'production'`), Vite runs in middleware mode (`createViteServer({ server: { middlewareMode: true }, appType: 'spa' })`) mounted onto Express via `app.use(vite.middlewares)`.
- **Production Mode (`npm start`):** Runs `node dist/server.cjs`. Built via `npm run build` (`vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs`).
- **Configuration Precedence:**
  - Host: CLI `--host <val>` takes precedence over `process.env.HOST` (default `'0.0.0.0'`).
  - Port: CLI `--port <val>` takes precedence over `process.env.PORT` (default `3000`).

---

## 03.2 Frontend Inventory (31 Routed Pages)

The frontend contains **exactly 31 React page components** located in `src/pages/`:

| Page Component File | Primary Route(s) | Primary User Role | Workflow Stages Handled | Implementation Reality |
| :--- | :--- | :--- | :--- | :--- |
| `LoginPage.tsx` | `/login` | Public / All | Pre-Workflow Identity | Session creation, password verification |
| `DashboardPage.tsx` | `/dashboard` | All Roles | Pipeline Overview | Stage throughput counters, active assignment queues |
| `PlanningPage.tsx` | `/planning` | Content Manager | Stage 00 Content Planning | Curricular plans, batch creation, topic quotas |
| `ContentMasterPage.tsx` | `/content-masters`, `/content-masters/:id` | Content Manager / Lead | Stage 00/01 Master Entity | Unified parent entity coordinator |
| `QuestionLibraryPage.tsx` | `/questions` | Creator / Verifier | Stage 01 Question Library | Tabular search, filter by subject/topic/status |
| `QuestionStudioPage.tsx` | `/studio`, `/questions/new` | Content Creator | Stage 01 Question Drafting | AI prompt builder, math validation, Telugu inputs |
| `QuestionDetailPage.tsx` | `/questions/:id` | Creator / Verifier | Stage 01/02 Question Detail | Inspects single question record, audit trail |
| `QuestionImprovePage.tsx` | `/questions/improve`, `/questions/:id/improve` | Creator / Verifier | Stage 01/02 Refinement | AI-assisted question rewriting & difficulty tuning |
| `QuestionVerifyApprovePage.tsx` | `/verify`, `/questions/verify` | Question Verifier | Stage 02 Verification | Mathematical verification, pedagogical approval |
| `QueuePage.tsx` | `/queue` | All Roles | Cross-Stage Work Queue | Role-filtered pending tasks |
| `MyWorkPage.tsx` | `/my-work` | All Roles | Personal Workspace | Tasks assigned directly to current session user |
| `ProductionBoardPage.tsx`| `/production/board` | Lead / Manager | Stages 03–11 Kanban | Visual Kanban board of video stages |
| `ProductionTrackerPage.tsx`| `/production` | Production Team | Stages 03–11 Pipeline | Tabular list of active video productions |
| `VideoDetailPage.tsx` | `/videos/:videoId`, `/production/:videoId` | Video Team / Leads | Stages 03–11 Master Workspace | **Consolidated master video workspace**: 7 horizontal tabs |
| `VideoCreateScriptPage.tsx`| `/videos/:videoId/script` | Script Writer | Stage 03 Script Studio | Dedicated script drafting interface |
| `VideoReviewScriptPage.tsx`| `/videos/:videoId/script/review` | Content Lead | Stage 03 Script Approval | Script verification and lock |
| `VideoRecordPage.tsx` | `/videos/:videoId/record` | Studio Presenter | Stage 04 Recording Studio | Web camera recording, teleprompter scroll |
| `VideoEditPage.tsx` | `/videos/:videoId/edit` | Video Editor | Stage 06 Video Editing | Editor assignment, render link submission |
| `VideoFinalPage.tsx` | `/videos/:videoId/final` | QC Lead | Stage 07 Final QC Review | Quality check checklist, pass/fail gating |
| `VideoThumbnailPage.tsx` | `/videos/:videoId/thumbnail` | Thumbnail Designer | Stage 08 Thumbnail Workspace | Thumbnail prompt, file upload, A/B variants |
| `VideoPinnedCommentPage.tsx`| `/videos/:videoId/pinned-comment` | Social Lead | Stage 09 Pinned Comment | Engagement comment drafting & approval |
| `SocialReviewPage.tsx` | `/social-review`, `/social-review/:reviewId`| Social Manager | Stage 10 Social Review | Platform adaptation preview (YT/IG/FB) |
| `PublishingPage.tsx` | `/publishing` | Publishing Manager | Stage 11 Publishing Queue | Scheduled release dates, platform publish triggers |
| `PublishingPackagePage.tsx`| `/publishing/:id` | Publishing Manager | Stage 11 Package Inspection| Multi-platform asset bundle checklist |
| `PlatformPackagesPage.tsx`| `/platform-packages` | Publisher | Stage 12 Platform Sync | External platform verification tracking |
| `SocialAnalyticsPage.tsx` | `/analytics/social` | Analyst / Lead | Stage 13 Social Analytics | View counts, engagement rates, retention curves |
| `AnalyticsExperiencePage.tsx`| `/analytics` | Analyst / Exec | Stage 14 Performance | Executive KPI dashboards, topic performance |
| `TeamOperationsPage.tsx` | `/team` | Admin / Manager | Operations Management | Team member workload, role assignments |
| `SettingsPage.tsx` | `/settings` | Admin | Configuration | User management, category taxonomy editor |
| `RecoveryAdminPage.tsx` | `/admin/recovery` | Super Admin | Disaster Recovery | Snapshot export, restore, data integrity verification |
| `NotFoundPage.tsx` | `*` | All | Error Fallback | 404 navigation recovery |

### Dual Component Libraries
1. **Legacy Common Components (`src/components/common/`):** Contains `Button.tsx`, `Modal.tsx`, `Card.tsx`, `Badge.tsx`, `Input.tsx`, `Select.tsx`. Uses direct Tailwind utility classes.
2. **Design System Components (`src/design-system/components/`):** Contains `Button.tsx`, `Modal.tsx`, `Card.tsx`, `Badge.tsx`, `PageHeader.tsx`, `AppBreadcrumbs.tsx`, `WorkflowStepNav.tsx`, etc. Uses structured design tokens.
3. Coexistence: Both libraries currently coexist; pages import from both.

---

## 03.3 Backend Inventory

### Express Server Entrypoint (`server.ts`)
- Configures proxy trust (`app.set('trust proxy', 1)`).
- Initializes snapshot scheduler (`snapshotSchedulerService.startScheduler()`).
- Preloads authoritative users (`usersRepository.findAll()`).
- Mounts API router at `/api` before frontend middlewares (`app.use('/api', apiRouter)`).
- Mounts Vite middlewares in dev; serves `dist/index.html` static bundle in production.

### Monolithic API Router (`src/server/routes.ts`)
- Contains **6,571 lines of code** (246 KB).
- Mounts JSON body parser (`express.json({ limit: '50mb' })`).
- Mounts Helmet security headers with permissive CSP for iframe preview.
- Mounts `aiRateLimiter` on AI endpoints.
- Mounts `extractSessionToken` middleware to parse cookies and Bearer headers.
- Implements 247 production API routes.

---

## 03.4 Routes & Navigation Inventory

### Client Routes (`src/App.tsx`)
- Defines **78 `<Route>` elements** plus fallback wildcard route (79 total routes).
- Grouped into 6 core hubs:
  1. Home Hub (`/dashboard`, `/my-work`)
  2. Questions Hub (`/questions`, `/studio`, `/questions/:id`, `/questions/:id/improve`, `/questions/:id/verify`)
  3. Video Production Hub (`/production`, `/production/board`, `/videos/:videoId`, and sub-routes)
  4. Publishing Hub (`/social-review`, `/publishing`, `/platform-packages`)
  5. Analytics Hub (`/analytics`, `/analytics/social`)
  6. Administration Hub (`/team`, `/settings`, `/admin/recovery`)

### API Route Taxonomy
- `/api/auth/*` (6 endpoints)
- `/api/questions/*` (38 endpoints)
- `/api/videos/*` (42 endpoints)
- `/api/scripts/*` (18 endpoints)
- `/api/drive/*` (14 endpoints)
- `/api/qc/*` (12 endpoints)
- `/api/thumbnails/*` (16 endpoints)
- `/api/pinned-comments/*` (12 endpoints)
- `/api/social-reviews/*` (14 endpoints)
- `/api/publishing/*` (24 endpoints)
- `/api/platform-sync/*` (8 endpoints)
- `/api/analytics/*` (15 endpoints)
- `/api/ai/*` (9 endpoints)
- `/api/planning/*` (16 endpoints)
- `/api/assignments/*` (14 endpoints)
- `/api/taxonomy/*` (12 endpoints)
- `/api/recovery/*` (10 endpoints)
- `/api/internal/tests/*` (59 test endpoints, enabled via `ENABLE_TEST_HARNESS=true`)

---

## 03.5 Services Inventory (69 Domain Services)

`src/lib/services/` contains **69 domain services** (~39,888 lines):
- **Core Workflow Singletons:**
  - `videoService` (`video.service.ts`): Video lifecycle, stage transitions, editor assignments.
  - `questionService` (`question.service.ts`): Question drafting, validation, review transitions.
  - `scriptService` (`script.service.ts`): Spoken script drafting, teleprompter pacing.
  - `thumbnailService` (`thumbnail.service.ts`): Thumbnail generation, file upload, A/B variant tracking.
  - `publishingService` (`publishing.service.ts`): Multi-platform scheduling, publication sync.
  - `googleDriveService` (`google-drive.service.ts`): Google Drive API v3 wrapper, folder creation, streaming upload.
  - `authService` (`auth.service.ts`): Scrypt credential hashing, session tokens.
  - `snapshotSchedulerService` (`snapshot-scheduler.service.ts`): Scheduled disaster recovery backup exports.

---

## 03.6 Repositories Inventory (37 Repositories)

`src/lib/repositories/` contains **37 repositories** extending `BaseRepository`:
- Maintain an in-memory `Map<string, T>` cache.
- Wrap Google Sheets API v4 operations (`appendRecord`, `updateRecord`, `findAll`, `findById`).
- Key Repositories:
  - `questionsRepository` (`questions.repository.ts`)
  - `videosRepository` (`videos.repository.ts`)
  - `scriptsRepository` (`scripts.repository.ts`)
  - `thumbnailsRepository` (`thumbnails.repository.ts`)
  - `usersRepository` (`users.repository.ts`)
  - `mediaAssetsRepository` (`media-assets.repository.ts`)
  - `sequencesRepository` (`sequences.repository.ts`)
  - `publishingRepository` (`publishing.repository.ts`)
  - `auditLogRepository` (`audit-log.repository.ts`)
  - `contentPlansRepository` (`content-plans.repository.ts`)
  - `contentBatchesRepository` (`content-batches.repository.ts`)

---

## 03.7 Sheets Persistence Architecture (25 Tabs)

Google Sheets API v4 is the **sole authoritative database** in the current system. Defined in `src/lib/schemas/google-sheets-schema.ts`, `ALL_SHEET_TABS` contains **exactly 25 authoritative worksheets**:

1. `USERS` — System user identity & auth credentials
2. `CATEGORIES` — Curricular subject categories
3. `TOPICS` — Subject curriculum topics
4. `SUBTOPICS` — Granular subtopics
5. `QUESTIONS` — Core question repository
6. `QUESTION_VIDEOS` — Question-to-video relationship join table
7. `VIDEOS` — Master video production projects
8. `SCRIPT` — Video spoken scripts
9. `SCRIPT_VERSIONS` — Script revision history
10. `THUMBNAILS` — Video thumbnail master
11. `THUMBNAIL_VERSIONS` — Candidate image variants
12. `PINNED_COMMENTS` — Social engagement comments
13. `PINNED_COMMENT_VERSIONS` — Pinned comment revisions
14. `WORKFLOW` — State transition audit log
15. `ASSIGNMENTS` — Task delegation & tracking
16. `PUBLISHING` — Multi-platform publishing records
17. `AUDIT_LOG` — Immutable action audit log
18. `SEQUENCES` — Monotonic ID generation sequences
19. `CONTENT_MASTERS` — Master content aggregate wrapper
20. `SOCIAL_REVIEWS` — Pre-publishing QC reviews
21. `QUESTION_VALIDATIONS` — Pedagogical verification audit records
22. `QUESTION_CONFIG` — Dynamic application configuration
23. `MEDIA_ASSETS` — Binary asset index & external metadata
24. `CONTENT_PLANS` — Curricular planning batches
25. `CONTENT_BATCHES` — Topic production batches

---

## 03.8 Google Drive Binary Asset Storage Pipeline

### Architecture & Service
- Implemented in `src/lib/services/google-drive.service.ts` using Google Drive API v3.
- All high-definition raw camera footage, master MP4 cuts, and thumbnail image binaries live exclusively in Google Drive.
- Authenticated via OAuth 2.0 refresh token (`GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN`).

### Media Storage Boundary Guard
- Implemented in `src/lib/workflow/media-storage-guard.ts` (`validateMediaAssetMetadata`).
- Enforces Architecture Principles AP-007 and AP-008:
  - Prohibits storing raw binary buffers or large base64 data URIs in application database records.
  - Requires all media assets to link to an authoritative `entityId`, `entityType`, and valid external pointer (`driveFileId` or `externalUrl`).

---

## 03.9 Authentication Architecture

- **Credential Hashing:** Node.js native `crypto.scrypt` with unique 16-byte salt and constant-time `crypto.timingSafeEqual`.
- **Session Tokens:** HMAC-SHA256 signed stateless session tokens containing `userId`, `role`, `email`, and `sessionVersion`.
- **Transmission:** HTTP-only cookie (`bp_session`) or `Authorization: Bearer <token>`.
- **Session Invalidation:** Revoking sessions increments the `sessionVersion` column in the `USERS` worksheet, immediately invalidating active tokens.

---

## 03.10 Role-Based Access Control (RBAC) & Authorization

- **Defined Roles:** 20 roles defined in `src/types/index.ts` (`ADMIN`, `PUBLISHER`, `CONTENT_MANAGER`, `TOPIC_LEAD`, `QUESTION_CREATOR`, `QUESTION_EDITOR`, `TELUGU_TRANSLATOR`, `STUDIO_PRESENTER`, `SCRIPT_WRITER`, `VIDEO_EDITOR`, `THUMBNAIL_DESIGNER`, `DESIGNER`, `PUBLISHING_MANAGER`, `COMMUNITY_MANAGER`, `CREATOR`, `EDITOR`, `ANALYTICS_VIEWER`, `REVIEWER`, `SPEAKER`, `CONTENT_WRITER`).
- **Server Enforcement:** Express endpoints protect privileged operations via `requireRole(...)` middleware.
- **Client Route Gap:** Client-side React Router (`App.tsx`) wraps routes in general authentication checks, but does not enforce fine-grained role-based route guards at the component level.

---

## 03.11 Existing Workflow & State Machine Engine

### Canonical 15-Step Workflow Engine
- Implemented in `src/lib/workflow/canonical-workflow.ts`:
  - Defines `CANONICAL_15_STEPS` (1 to 15) and `CanonicalStageIdentifier`.
  - Implements `validateCanonicalWorkflowTransition(req)` enforcing sequential transitions, actor authentication, and AI safety policies.
- Coexists with legacy entity status enums (`QuestionStatus`, `VideoProductionStatus`, `SocialPublishStatus`).

---

## 03.12 Existing Automated Tests Inventory (145 Test Files)

- `src/tests/` contains **145 test files**.
- Executed as standalone Node.js scripts via `tsx`.
- Key scripts in `package.json`:
  - `npm run test:stage02`: Evaluates Stage 02 business acceptance criteria (7 checks).
  - `npm run test:stage03`: Evaluates Stage 03 current system baseline invariants (7 checks).
  - `npm run test:architecture`: Evaluates Stage 04 architecture principles (AP-001 through AP-015).
  - `npm run test:workflow`: Evaluates Step 01 question studio workflow state.
  - `npm run test:unit`, `npm run test:regression`, `npm run test:publishing`, `npm run test:all`.

---

## 03.13 Deployment Architecture (Cloud Run & Dockerfile)

### Multi-Stage Dockerfile
- **Stage 1 (builder):** `node:20-alpine`, runs `npm ci` and `npm run build` (`vite build && esbuild server.ts ...`).
- **Stage 2 (runner):** `node:20-alpine`, runs `npm ci --omit=dev`, copies `dist/`, exposes port 3000, runs `node dist/server.cjs`.

### Build Output
- Client SPA: `dist/index.html` and bundled client assets.
- Production Server: `dist/server.cjs` (standalone CommonJS bundle).

---

## 03.14 Environment Variables & Configuration

*Source of truth: `.env.example`*
- `GOOGLE_SHEETS_ID`: Production Google Sheets database ID.
- `ANALYTICS_SPREADSHEET_ID`: Ingested analytics spreadsheet ID.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`: Google OAuth 2.0 application credentials.
- `GOOGLE_REDIRECT_URI`: OAuth callback URI.
- `GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN`: Canonical Google Drive OAuth 2.0 refresh token.
- `GOOGLE_DRIVE_ROOT_FOLDER_ID`: Parent root folder ID.
- `GEMINI_API_KEY`, `GEMINI_MODEL`: Google Gemini client configuration.
- `SESSION_SECRET`: HMAC-SHA256 signature secret for sessions.
- `BOOTSTRAP_SECRET`, `INITIAL_ADMIN_PASSWORD`: Admin bootstrap credentials.
- `GCS_SNAPSHOT_BUCKET`, `GCS_SNAPSHOT_ENABLED`: Disaster recovery backup settings.

---

## 03.15 Known Defects, Hard/Soft Breaks & Technical Debt Register

### Confirmed Hard Breaks (Execution Blockers)
1. **Draft Reload 404 (`BRK-HD-01`):** Approving a question navigates immediately to `/videos/:videoId` before the Google Sheets append transaction completes; refreshing during this window causes 404.
2. **QUEUED -> EDITING Transition Barrier (`BRK-HD-02`):** Direct movement from `QUEUED` to `EDITING` is rejected by legacy state checks, requiring fragile chained PATCH requests.
3. **Quota Exhaustion & Transaction Void (`DB-CRIT-01`):** Google Sheets 300 req/min quota causes `429 RESOURCE_EXHAUSTED` under concurrent operations; lack of ACID guarantees risks split-brain state.

### Confirmed Soft Breaks (State Desynchronizations)
1. **Swallowed Question Status Sync (`BRK-SF-01`):** Errors during secondary status updates to `Question.videoStatus` are caught and logged without rollback.
2. **Publishing Status Cascade Void (`BRK-SF-02`):** Marking releases as `PUBLISHED` updates `PUBLISHING` tab but fails to cascade to `VIDEOS.status`.
3. **Missing Client Route Guards (`SEC-HIGH-01`):** Client router relies solely on backend API 403s rather than blocking unauthorized URL navigation.
4. **Dual Drive Folder Hierarchy (`DRIVE-MED-01`):** Coexistence of flat Phase 7 folders and nested Phase 14 directory structures creates fragmented storage locations.
5. **Sequence Number Jumps (`SEQ-MED-01`):** Un-sanitized regex parsing in sequence allocations caused 13-digit timestamp test IDs to threaten sequence numbering bounds.

---

```
================================================================================
STAGE 03 — CURRENT SYSTEM BASELINE
STATUS: ACCEPTED
DOCUMENT: docs/baseline/03-CURRENT-SYSTEM-BASELINE.md
VERSION: 1.1.0
IMPLEMENTATION STATUS: COMPLETE
TEST SUITE: src/tests/stage03-current-system-baseline.test.ts (npm run test:stage03)
TECHNICAL VERIFICATION: PASS (0 errors)
NEXT STAGE: STAGE 04 — TARGET ARCHITECTURE SPECIFICATION / MODERNIZATION
================================================================================
```
