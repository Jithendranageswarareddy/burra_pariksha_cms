# Burra Pariksha Content Management System (BP-CMS)
# Sprint 1 — Existing Implementation Baseline Report

**Document Stage:** Baseline Audit & Verification  
**Status:** ESTABLISHED & IMMUTABLE BASELINE  
**Date:** 2026-10-04  
**Environment:** Google AI Studio Development Runtime (Primary)  
**Upstream Source of Truth:** GitHub `main` branch  

---

## 1. Repository & Baseline Identification

| Parameter | Authoritative Value |
| :--- | :--- |
| **Project Name** | Burra Pariksha Content Management System (BP-CMS) |
| **Repository URL** | `https://github.com/Jithendranageswarareddy/burra_pariksha_cms.git` |
| **Active Branch** | `main` (Tracking `origin/main`) |
| **Current Commit SHA** | `5c4d6a552c33cb7f8b10c984e5508bae1dc78ee5` |
| **Commit Message** | `feat(core): implement fc-005 workflow state engine` |
| **Commit Author** | Jithendranageswarareddy <jithendrareddy629@gmail.com> |
| **Import Timestamp** | 2026-10-04T08:33:00Z |
| **Git Working Tree** | Clean on tracked files; untracked docs and templates present |

---

## 2. Technology Stack & Runtime Profile

### 2.1 Runtime & Tooling
- **Node.js**: v22.14.0
- **TypeScript**: ~5.8.2 (`tsconfig.json` target ES2022, bundler module resolution)
- **TypeScript Execution**: `tsx` v4.21.0
- **Bundler & Dev Server**: Vite v6.2.3 (`vite.config.ts`), esbuild v0.25.0
- **Package Manager**: npm (lockfile `bun.lock` / `package.json`)

### 2.2 Frontend Stack
- **Library**: React 19.0.1, React-DOM 19.0.1
- **Router**: React Router DOM 7.18.2
- **Styling**: Tailwind CSS v4.1.14 with `@tailwindcss/vite`
- **Component Primitives**: Lucide React v0.546.0, Motion v12.23.24
- **Entry Point**: `index.html` -> `src/main.tsx` -> `src/App.tsx`

### 2.3 Backend Stack
- **Framework**: Express 4.21.2 mounted with Vite dev middleware in dev mode (`server.ts`)
- **Security Middleware**: Helmet 8.3.0, Express-Rate-Limit 8.7.0, timing-safe crypto comparison
- **File Parsing**: Busboy 1.6.0
- **Schema Validation**: Zod 4.4.3
- **Entry Point**: `server.ts` (dev: `tsx server.ts`, prod: `node dist/server.cjs`)

### 2.4 Persistence Layer
- **Interface Contract**: `IRepository<T>` with Optimistic Concurrency Control (OCC)
- **In-Memory Store**: `InMemoryRepository<T>` with atomic deep cloning and soft deletion
- **Google Sheets Adapter**: Google Sheets API v4 (`googleapis` 176.0.0) mapping 19 worksheet tabs
- **Firestore Adapter**: `FirestoreRepository<T>` abstraction supporting atomic operations

### 2.5 Security & Authentication
- **Session Tokens**: HMAC-SHA256 signed `bp_session` HTTP-only cookies
- **Password Storage**: Scrypt key derivation with per-user salt and timing-safe equality checks
- **Authorization Engine**: Deterministic RBAC matrix (`src/lib/auth/rbac-evaluator.ts`, `src/types/rbac-models.ts`)
- **Segregation of Duties**: GAR-02 anti-self-approval rule enforced server-side
- **AI Gating**: AP-009 structural exclusion of AI actors from approving human quality gates

### 2.6 External Integrations
- **AI Provider**: Google GenAI SDK (`@google/genai` v2.4.0) with Gemini Flash/Pro
- **Google Drive**: Drive API v3 for binary media uploads and folder organization
- **Google Sheets**: Sheets API v4 for production tracking and analytics synchronization
- **Google Cloud Storage**: GCS bucket snapshot synchronization
- **Publishing**: YouTube Data API v3 and multi-platform distribution stubs

---

## 3. Commands & Verification Scripts

| Purpose | Command | Status | Result |
| :--- | :--- | :--- | :--- |
| **Lint / Typecheck** | `npm run lint` (`tsc --noEmit`) | PASSED | 0 errors |
| **Production Build** | `npm run build` | PASSED | Vite client bundle + esbuild server bundle created |
| **Test Suite** | `npm test` | PASSED | 40/40 tests passed across 5 test suites |
| **Auth Tests (FC-001)** | `npm run test:auth` | PASSED | 7 passed, 0 failed |
| **RBAC Tests (FC-002)** | `npm run test:rbac` | PASSED | 12 passed, 0 failed |
| **DB / API Tests (FC-003)** | `npm run test:db-api` | PASSED | 8 passed, 0 failed |
| **Audit Tests (FC-004)** | `npm run test:audit` | PASSED | 8 passed, 0 failed |
| **Workflow Tests (FC-005)** | `npm run test:workflow` | PASSED | 5 passed, 0 failed |
| **Development Server** | `npm run dev` | RUNNABLE | Binds to `0.0.0.0:3000` |
| **Production Server** | `npm start` | RUNNABLE | Serves from `dist/server.cjs` |

---

## 4. Environment Variables & Secret Configuration Audit

*Note: Per strict security policy, only variable names and availability flags are listed below. No secret values are exposed.*

| Variable Name | Category | Available in AI Studio | Used By | Required For |
| :--- | :--- | :---: | :--- | :--- |
| `PORT` | Networking | YES | Express server | Server listening port (default 3000) |
| `NODE_ENV` | Runtime | YES | Vite, Express, Logger | Environment mode |
| `SESSION_SECRET` | Security Secret | YES | Auth Middleware | Signing & verifying HMAC session cookies |
| `INITIAL_ADMIN_PASSWORD`| Security Secret | YES | User Seed Service | Default Admin (USR-001) credentials |
| `BOOTSTRAP_SECRET` | Security Secret | YES | Admin Routes | Spreadsheet bootstrap authorization |
| `GEMINI_API_KEY` | External Secret | YES | Gemini Client / AI Service | Google GenAI API completions |
| `GEMINI_MODEL` | Configuration | YES | AI Orchestrator | Default Gemini model alias |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Service Account | YES | Google Sheets/Drive Client | Service account authentication |
| `GOOGLE_PRIVATE_KEY` | Private Key Secret | YES | Google JWT Auth | Service account token generation |
| `GOOGLE_CLIENT_ID` | OAuth Secret | YES | OAuth Setup Script | User OAuth consent flow |
| `GOOGLE_CLIENT_SECRET` | OAuth Secret | YES | OAuth Setup Script | User OAuth consent exchange |
| `GOOGLE_DRIVE_REFRESH_TOKEN` | OAuth Secret | YES | Drive Upload Service | User-delegated Drive file uploads |
| `GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN`| OAuth Secret | YES | Drive Upload Service | Secondary Drive token fallback |
| `GOOGLE_DRIVE_ROOT_FOLDER_ID` | Storage ID | YES | Drive Media Guard | Root media storage folder pointer |
| `GOOGLE_SHEETS_ID` | Storage ID | YES | Sheets Repository | Master BP-CMS production spreadsheet |
| `ANALYTICS_SPREADSHEET_ID` | Storage ID | YES | Analytics Service | Separate analytics spreadsheet pointer |
| `GCS_SNAPSHOT_BUCKET` | Storage Config | YES | Snapshot Service | Cloud Storage backup bucket |
| `K_SERVICE` / `K_REVISION` | Cloud Run Runtime | YES | Server Telemetry | Container runtime identity |

---

## 5. Architectural Implementation Status

### 5.1 What Currently Works (Fully Verified)
1. **System Foundation & Identity (FC-001)**:
   - Scrypt password hashing with constant-time verification.
   - HMAC-SHA256 signed session cookie extraction and verification.
   - Rate limiting and payload validation on authentication endpoints.
2. **Roles & Granular RBAC Matrix (FC-002)**:
   - 12 canonical roles with 61 fine-grained capabilities.
   - Server-authoritative capability checking via `requireCapability` middleware.
   - Rejection of client-supplied roles and identities.
   - Segregation of Duties (GAR-02): anti-self-approval rule prevents creators from approving own content.
   - AI Gating (AP-009): AI agents structurally forbidden from executing approvals on human-gated steps.
3. **Database Abstraction & API Envelopes (FC-003)**:
   - Generic `IRepository<T>` abstraction supporting atomic operations, soft deletion, and OCC versioning.
   - Universal JSend-style API envelope (`{ success, data, error, meta }`) with correlation IDs.
   - Strict Zod validation middleware parsing and validating request bodies.
4. **Audit Ledger & Observability (FC-004)**:
   - 7-dimensional immutable audit ledger recording `actor`, `role`, `action`, `resource`, `verdict`, and `timestamp`.
   - Automatic credential redaction engine sanitizing passwords, tokens, and keys from audit details.
   - Google Cloud Logging JSON structured format with correlation trace IDs.
   - Standardized health probe endpoints (`/healthz`, `/readyz`).
5. **Workflow State Engine (FC-005)**:
   - 15-stage canonical state transition matrix enforcing sequential N -> N+1 progression.
   - Prevention of illegal forward stage jumping (returns HTTP 422).
   - Rejection routing with mandatory human remarks returning content to designated authoring steps.
   - Real-time event bus dispatching transition events across subscribers.

### 5.2 What Partially Works (Needs End-to-End Verification in Sprint 2)
1. **Question Creation & Verification UI Golden Path**:
   - The backend question service, schema validator, and workflow engine are functional.
   - The frontend `QuestionStudioPage` and `QuestionVerifyApprovePage` need browser verification to confirm form submission, state transition, and refresh persistence.
2. **Google Sheets Live Remote Persistence**:
   - Service account credentials and spreadsheet IDs are configured in the environment.
   - Local tests currently exercise the in-memory repository implementation; remote Google Sheets round-trip sync must be verified against the live sheet.
3. **Media Storage Guard (AP-007 / AP-008)**:
   - `MediaStorageGuard` validates metadata and blocks raw binary payloads.
   - Ingestion endpoints need live Drive file ID upload testing.

### 5.3 What Does Not Work / Known Limitations
1. **Third-Party Social Publishing Connectors**:
   - YouTube, Instagram, and Facebook live publish dispatchers operate with structured stubs rather than active OAuth platform tokens.
2. **Real-time SSE Connection Reconnect in Safari / Proxies**:
   - Server-Sent Events `/api/v1/events/stream` requires testing with reverse-proxy buffering configurations.

### 5.4 Known Code / Documentation Mismatches
1. **Document Naming in Architecture Directory**:
   - Some earlier architecture drafts used `09-RBAC-CAPABILITY-MATRIX.md` while later references use `09-RBAC-CAPABILITY-MODEL.md`.
   - Both are present in repository history; the authoritative code implementation is `src/types/rbac-models.ts` and `src/lib/auth/rbac-evaluator.ts`.
2. **Dual Workflow Nomenclature**:
   - Code maintains both canonical 15-stage nomenclature (`STAGE_01_QUESTION_GENERATION` ... `STAGE_15_INTELLIGENCE_LOOP`) and legacy phase statuses (`DRAFT`, `SCRIPT_READY`, `RECORDED`, `EDITED`, `READY_TO_UPLOAD`, etc.).
   - The dual mapping is cleanly mediated by `src/lib/workflow/canonical-workflow.ts` and `src/lib/workflow/transition-matrix.ts`.

---

## 6. Sprint 2 Readiness Assessment

**Status:** `READY`

All prerequisites for Sprint 2 (System Stabilization & Golden Path) have been satisfied:
- Codebase imported and verified against GitHub `main` commit `5c4d6a5`.
- Full TypeScript check passes with 0 errors.
- Production build succeeds.
- Comprehensive automated test suite passes 40/40 tests.
- Cloud Run environment variables and secrets are present.
