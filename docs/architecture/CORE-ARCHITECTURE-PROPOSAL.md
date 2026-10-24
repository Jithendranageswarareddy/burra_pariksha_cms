# BURRA PARIKSHA CMS — CORE ARCHITECTURE PROPOSAL & RECONCILIATION

**Document Identifier:** `docs/architecture/CORE-ARCHITECTURE-PROPOSAL.md`  
**Status:** ACTIVE MASTER ARCHITECTURE PROPOSAL  
**Author:** Antigravity Engineering (SDLC Core Architecture Phase)  
**Governance:** [AGENTS.md](../../AGENTS.md), [04-ARCHITECTURE-PRINCIPLES.md](04-ARCHITECTURE-PRINCIPLES.md), [DECISION-LOG.md](DECISION-LOG.md)  
**Target Environments:** Local Development Workspace & Google AI Studio Applet Production Runtime  

---

## EXECUTIVE SUMMARY & GOVERNANCE OBJECTIVE

This document unifies, reconciles, and formalizes the core technical architecture of the **Burra Pariksha Content Management System (BP-CMS)** across its 15-stage educational content manufacturing pipeline. It establishes the authoritative **Local-to-Deployment Architecture Principle (Principle 16 / ADR-014)**, reconciles existing modular architecture documents (`04-ARCHITECTURE-PRINCIPLES.md` through `27-DEPENDENCY-BOUNDARIES.md`), distinguishes empirically verified repository facts from external deployment assumptions, and provides the authoritative foundation for upcoming sprint execution.

---

## 1. REQUIREMENTS AND DOMAIN BOUNDARIES

### 1.1 Product Mission and Content Invariant
Burra Pariksha is a specialized Telugu-language educational broadcast and digital publishing platform preparing candidates for competitive public service examinations (e.g., APPSC, TSPSC, SSC, Banking, Railways). Content integrity, spoken linguistic accuracy, syllabus alignment, broadcast technical loudness, and mobile visual ergonomics are paramount.

### 1.2 Three Canonical Content Production Modes
BP-CMS formally supports three distinct, dynamic content-production modes governed by `shared/registry/content-mode.registry.ts`:

| Mode Enum | Mode Title | Target Format & Aspect Ratio | Content Composition & Rules |
| :--- | :--- | :---: | :--- |
| `QUESTION_CHALLENGE_SHORT` | **Mode 1: Question Challenge Short** | 9:16 Vertical Video ($\le 60\text{s}$) | Single short MCQ or batch series ($N \in \{5,10,15,20\}$). Strict 4 options (`a,b,c,d`), syllabus hook, answer revelation, Telugu explanation. |
| `TOPIC_INTRODUCTION` | **Mode 2: Topic Introduction** | Configurable: 9:16 Vertical or 16:9 Landscape ($\le 180\text{s}$) | Concept demystification and syllabus orientation. **Enforces exactly 0 questions** (`questionCount === 0`). Step 02 adapts into concept/syllabus validation. |
| `EXPLAINED_QUESTIONS_VIDEO` | **Mode 3: Explained Questions Video** | 16:9 Landscape Video ($\le 20\text{m}$) | Comprehensive masterclass. Introductory concept hook + ordered question array ($N \in \{5,10,15,20\}$) with exhaustive Telugu analytical explanations. |

### 1.3 Canonical 15-Stage Workflow Backbone
All three content modes navigate through the single authoritative 15-stage workflow backbone defined in `src/lib/workflow/transition-matrix.ts` and `07-CANONICAL-15-STEP-WORKFLOW.md`:

```text
[01. Question Generation] ──► [02. Question Verification] ──► [03. Audience Script] ──► [04. Teleprompter & Filming]
                                                                                               │
[08. Thumbnail] ◄── [07. Final QC] ◄── [06. Editing Bay] ◄── [05. Raw Video Ingestion] ◄──────┘
       │
       ▼
[09. Social Review] ──► [10. Publishing Setup] ──► [11. Published] ──► [12. Platform Sync]
                                                                             │
[15. Intelligence Loop] ◄── [14. Performance Review] ◄── [13. Analytics] ◄──┘
```

### 1.4 Domain Bounded Contexts
1. **Curriculum & Taxonomy**: Two-Tier structure strictly: `Topic` $\to$ `Subtopic`. Legacy Category is completely eradicated.
2. **Question & Concept Studio**: Dynamic multi-mode ideation, candidate drafting, validation gates, and batch aggregation.
3. **Editorial & Scripting**: Spoken Telugu script generation, phonetics, timing markers, and teleprompter cue formatting.
4. **Media & Production**: Video recording, take segmentation, asset ingestion, Google Drive external storage delegation.
5. **Quality Control & Review**: Multi-layer QC, broadcast loudness checks, mobile safe-zone overlay verification.
6. **Distribution & Operations**: Multi-platform publishing dispatch, metadata generation, synchronized audit logging.

---

## 2. APPLICATION LAYERS, MODULES, AND RESPONSIBILITIES

The system is structured as a **Modular Full-Stack Application** adhering to strict dependency boundaries ([27-DEPENDENCY-BOUNDARIES.md](27-DEPENDENCY-BOUNDARIES.md)):

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER (SPA)                        │
│   React 19, Tailwind CSS v4, Motion, Lucide Icons, React Router v7      │
│   Pages (/src/pages), Workspaces (/src/components/studio), Hooks       │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Pure HTTP / JSON
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        TYPED API CLIENT LAYER                          │
│   Frontend API Clients (/src/lib/api) — Zero Server/Secret Imports    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ REST / Cookie Session
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     BACKEND CONTROLLER & ROUTER LAYER                  │
│   Express 4 Server (/backend/server/server.ts, /backend/server/routers)│
│   Auth Middleware (requireAuth), RBAC Guard (requireRole), Helmet      │
└───────────────────┬───────────────────────────────┬────────────────────┘
                    │                               │
                    ▼                               ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│        WORKFLOW ENGINE & DOMAIN      │  │      EXTERNAL ADAPTERS       │
│  State Machine (transition-matrix.ts)│  │  Gemini AI (@google/genai)   │
│  GAR-02 Anti-Self-Approval Guard     │  │  Google Drive (googleapis)   │
│  Quality Validators (VAL-Q-01..05)   │  │  GCS Snapshots (CloudStorage)│
└───────────────────┬──────────────────┘  └──────────────┬───────────────┘
                    │                                    │
                    ▼                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        PERSISTENCE REPOSITORY LAYER                    │
│   Firestore Repositories (/database/firestore/repositories)           │
│   Server-Privileged Firebase Admin SDK (cert / ADC)                    │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Loopback or Cloud
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       AUTHORITATIVE DATASTORE                          │
│   Production: Cloud Firestore (Named DB: ai-studio-burraparikshacon-..)│
│   Dev/Test: Local Firestore Emulator (127.0.0.1:8080)                  │
└────────────────────────────────────────────────────────────────────────┘
```

### Module Responsibilities:
- **`frontend/` & `src/`**: User interface components, responsive layout, interactive state, client-side validation, and route switching. Prohibited from importing Firebase Admin, database adapters, server secrets, or AI SDKs.
- **`backend/`**: Express HTTP server, REST endpoints, session cookie management, role capability resolution, workflow state transition validation, and external adapter orchestration.
- **`database/firestore/repositories/`**: Encapsulates all Firestore queries, transactions, optimistic concurrency checks, and persistence mechanics.
- **`shared/`**: Common types, request/response validation schemas (Zod), collision-resistant UUID generators (`shared/lib/id.service.ts`), and canonical role constants (`shared/constants/roles.ts`). Strictly framework- and secret-free.

---

## 3. DATA MODEL AND AUTHORITATIVE DATA SOURCES

### 3.1 Cloud Firestore as Sole Transactional Datastore
Cloud Firestore is the sole authoritative transactional database for BP-CMS (`12-DATABASE-ARCHITECTURE.md`).
- **Production Project ID**: `burra-pariksha-cms`
- **Production Named Database ID**: `ai-studio-burraparikshacon-f592ca42-39af-4d83-aff2-6870ba939b0e`
- **Synthetic Test Project ID**: `burra-pariksha-test` (Database: `(default)`)

### 3.2 Authoritative Collection Contract
All Firestore interactions conform strictly to [FIRESTORE-COLLECTION-CONTRACT.md](FIRESTORE-COLLECTION-CONTRACT.md):

| Collection Name | Document Key Structure | Purpose & Integrity Invariants |
| :--- | :--- | :--- |
| `question_drafts` | `dft_<uuid>` | Multi-mode authoring workspace drafts. Mode 1 holds candidate MCQ; Mode 2 holds concept draft with `questionCount: 0`; Mode 3 holds atomic aggregate with question array. |
| `questions` | `q_<uuid>` | Verified academic questions and concepts approved past Stage 02. |
| `videos` | `vid_<uuid>` | Canonical video production entities tracking stages 03 through 15. |
| `video_takes` | `tak_<uuid>` | Filming and teleprompter recording takes with media links. |
| `video_qc_reviews` | `qcr_<uuid>` | Stage 07 Quality Control audit records enforcing GAR-02. |
| `audit_events` | `aud_<uuid>` | Immutable append-only audit trail for every state change & admin override. |
| `users` | `usr_<uuid>` | Staff user accounts, credentials, and canonical role assignments. |
| `topics` | `top_<uuid>` | Tier 1 taxonomy units. |
| `subtopics` | `stp_<uuid>` | Tier 2 taxonomy units (strictly mapped to parent `topicId`). |
| `question_config` | `qcfg_<uuid>` | System operational configurations and batch size constraints. |

### 3.3 External Media Storage Separation
Binary media files (MP4, WebM, PNG, JPEG) are strictly externalized to **Google Drive** under `GOOGLE_DRIVE_ROOT_FOLDER_ID` via persistent OAuth 2.0 refresh token delegation. Only lightweight, typed metadata (`driveFileId`, `checksum`, `fileSizeBytes`, `mimeType`, `durationSeconds`) is stored in Firestore.

---

## 4. API BOUNDARIES, AUTH, RBAC, VALIDATION, AUDIT, AND CONCURRENCY

### 4.1 Authentication & Session Management
- **Token Mechanism**: Cryptographic HMAC-SHA256 signature over user session payload (`userId`, `role`, `issuedAt`, `expiresAt`).
- **Transport**: Stored in HTTP-only, secure, `SameSite=Lax` cookie named `bp_session`.
- **Secret Authority**: `SESSION_SECRET` (configured via `.env.local` locally or Google AI Studio Secrets panel in production).
- **Silent Fallbacks Prohibited**: Unauthenticated requests receive HTTP 401 Unauthorized. Silent fallback to default admin `USR-001` is permanently eradicated (resolving ACR-002).

### 4.2 Canonical RBAC and GAR-02 Anti-Self-Approval
- **11 Canonical Roles**: Defined in `shared/constants/roles.ts` (`SYSTEM_ADMINISTRATOR`, `ACADEMIC_LEAD`, `QUESTION_WRITER`, `QA_REVIEWER`, `SCRIPT_WRITER`, `MEDIA_MANAGER`, `VIDEO_EDITOR`, `QC_INSPECTOR`, `PUBLISHING_LEAD`, `ANALYTICS_VIEWER`, `AUDIT_COMPLIANCE_OFFICER`).
- **GAR-02 Strict Invariant**: An artifact author cannot approve their own work (`authorId !== approverId`).
- **Audited Administrator Override (ADR-002, ADR-013)**: To eliminate operational deadlock when the single System Administrator is author, the System Admin is permitted operational self-approval across all 15 stages strictly when explicit confirmation (`confirmedByAdmin: true`) and a justification of at least 10 characters are supplied. This override is immutably logged in `audit_events`. Zero bypass for regular employees.

### 4.3 Validation and Concurrency Control
- **Input Validation**: All API payloads are strictly validated at the boundary using Zod schemas (`shared/contracts/request-schemas.ts`). Invalid requests are rejected with HTTP 400 and structured error arrays before reaching domain logic.
- **Optimistic Concurrency Control (OCC)**: Every mutable entity maintains an integer `version` property. Mutations must supply the expected `version`. If the datastore version differs, the write is aborted with HTTP 409 Conflict.
- **Draft vs. Submission Gate**: `SAVE DRAFT` persists candidate data without advancing workflow status. `SUBMIT FOR VERIFICATION` executes stage transition checks and advances status to Stage 02.

---

## 5. LOCAL DEVELOPMENT AND TEST ARCHITECTURE

### 5.1 Principle 16: Unified Local-to-Deployment Codebase
The application maintains one production-quality codebase that runs locally and when published through Google AI Studio. Business logic, routing, schemas, and persistence algorithms are identical across both environments.

### 5.2 Local Development Workflow
- **Development Server (`npm run dev:local`)**: Orchestrated by `scripts/start-local-dev.ts`. Coordinates the Firestore Emulator, verifies emulator connectivity, seeds isolated test data, and boots the Express backend with hot reloading (`tsx watch`) and Vite frontend HMR.
- **Datastore Isolation Guard (`src/config/datastore-guard.ts`)**:
  - Automatically intercepts database operations.
  - Verifies that development runs against `127.0.0.1:8080` under approved synthetic project `burra-pariksha-test`.
  - Blocks any attempt to connect to production database `ai-studio-burraparikshacon-...` during local development and testing, failing closed before any write can occur.

### 5.3 Automated Testing Architecture
Testing is strictly code-level and isolated ([24-TEST-ARCHITECTURE.md](24-TEST-ARCHITECTURE.md), `AGENTS.md` Section 2):
1. **Unit Tests**: Mocked dependencies, deterministic fixtures, pure function verification (`tests/unit/`).
2. **Integration Tests**: In-memory repository stubs or verified local emulator (`tests/integration/`).
3. **Architecture Tests**: Automated boundary scanners verifying separation of concerns, forbidden imports, and taxonomy integrity (`tests/architecture/`).
4. **Live Production Isolation**: Automated tests must never connect to live production Firestore, send real Gemini AI requests, or mutate Google Drive assets.

---

## 6. GOOGLE AI STUDIO BUILD, PUBLISH, AND ENVIRONMENT SEPARATION

### 6.1 Build Pipeline & Production Artifact
The production deployment artifact is generated deterministically via `npm run build`:
```bash
vite build && esbuild backend/server/server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs
```
- **Frontend Assets**: Vite bundles React SPA into `dist/` with hashed static chunks (`dist/assets/`).
- **Backend Bundle**: esbuild compiles `server.ts` into a single Node.js CommonJS bundle (`dist/server.cjs`).
- **Production Entrypoint**: `npm start` runs `node dist/server.cjs`.

### 6.2 Serving Model in Production
In production (`NODE_ENV=production`):
1. Server loads environment variables and runs `validateEnvironmentRuntime()`.
2. Verifies datastore safety guard (`assertDatastoreSafe()`).
3. Mounts health and diagnostic probe routes (`/healthz`, `/readyz`, `/api/health`).
4. Mounts API router on `/api`.
5. Mounts static asset handler over `dist/`.
6. Handles unmatched client routes by serving `dist/index.html` for client-side React Router navigation.

### 6.3 The Canonical 8 Production Secrets
When imported into Google AI Studio, the application requests exactly the 8 canonical variables defined in [ENVIRONMENT-CONTRACT.md](../operations/ENVIRONMENT-CONTRACT.md):

1. `SESSION_SECRET`: Cookie HMAC signing key.
2. `GOOGLE_SERVICE_ACCOUNT_EMAIL`: GCP IAM Service Account email for Firebase Admin SDK.
3. `GOOGLE_PRIVATE_KEY`: RSA PEM Private Key for Firebase Admin SDK (resolves via ADC if omitted on GCP).
4. `GEMINI_API_KEY`: Google Gemini API key for assistive question studio generation.
5. `GOOGLE_DRIVE_ROOT_FOLDER_ID`: Root folder ID for video takes and media assets.
6. `GOOGLE_CLIENT_ID`: OAuth 2.0 Client ID for Drive upload delegation.
7. `GOOGLE_CLIENT_SECRET`: OAuth 2.0 Client Secret for Drive upload delegation.
8. `GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN`: Persistent OAuth 2.0 refresh token.

### 6.4 Verified Repository Facts vs. External Assumptions
- **Verified Repository Facts**:
  - Express cleanly serves Vite static build and API routes simultaneously.
  - Environment contract validation succeeds in production mode when 8 canonical secrets are present.
  - Firebase Admin SDK initializes with explicit credentials or ADC.
  - Liveness (`/healthz`) and readiness (`/readyz`) probes respond reliably.
- **External Environment Assumptions**:
  - Google AI Studio container runs Node.js 20+ runtime.
  - Web preview routing exposes the configured `PORT` (default 3000) or passes `$PORT` in environment.
  - Live deployment release is triggered manually by the Project Owner from the Google AI Studio console; automated IDE agents have no deployment authority.

---

## 7. FAILURE HANDLING, OBSERVABILITY, BACKUP/RECOVERY, AND SECURITY

### 7.1 Free-Tier Protection & Circuit Breakers (₹0.00 / month Budget)
To preserve the hard infrastructure budget invariant of ₹0.00 to ₹100/month:
- **AI Token Bucket Limiter**: In-memory rate limiter restricts requests to $\le 15\text{ RPM}$ and $\le 1\text{M tokens/day}$ under Google AI Studio's Gemini 2.5 Flash free tier.
- **Hard Daily Circuit Breaker**: Caps AI calls at 100 requests/day, cutting off outbound calls before commercial thresholds can be reached (`22-COST-ARCHITECTURE.md`).
- **Human Approval Gate (AP-009)**: AI never autonomously approves or advances any stage.

### 7.2 Observability and Probes
- **`/healthz`**: Kubernetes-style liveness probe. Returns HTTP 200 immediately if process is alive.
- **`/readyz`**: Readiness probe. Validates Firestore client connectivity and Google Drive configuration.
- **`/api/health`**: Deep diagnostic probe reporting non-sensitive runtime diagnostics.
- **Zero-Secret Logging Invariant**: Logs strictly censor passwords, private keys, refresh tokens, and session cookies.

### 7.3 Backup, Recovery, and Disaster Readiness
- **Cloud Firestore**: Recovery relies on manual or scheduled `gcloud firestore export/import`. Automated pre-cleanup export gaps documented in TASK-002/TASK-003.
- **Google Cloud Storage Snapshots**: Server-side `snapshotSchedulerService` runs automated snapshots when enabled.
- **Google Drive**: Assets protected by Google Drive 30-day trash retention.
- **Local Taxonomy Seed**: `src/lib/data/production-taxonomy.ts` provides fully deterministic, offline-capable recovery data.

### 7.4 Security Baseline
- **HTTP Headers**: Enforced via `helmet` (HSTS, clickjacking prevention, XSS filter, no-sniff).
- **Transport Security**: Cookies flagged `HttpOnly`, `SameSite=Lax`, and `Secure` in production.
- **Zero Browser Direct Access**: Browser clients have zero direct connections to Cloud Firestore, Firebase Admin SDK, or Gemini API keys. All access proxies through authenticated Express controllers.

---

## 8. INCREMENTAL MIGRATION AND IMPLEMENTATION PLAN

Following the canonical brownfield migration discipline (**`CLASSIFY → CONSOLIDATE → MIGRATE → VERIFY → RETIRE`**):

### Current State (Sprint 10 Completed):
- Multi-mode baseline established for Mode 1 (`QUESTION_CHALLENGE_SHORT`), Mode 2 (`TOPIC_INTRODUCTION`), and Mode 3 (`EXPLAINED_QUESTIONS_VIDEO`).
- Dynamic authoring workspaces implemented (`QuestionStudioPage.tsx`, `TopicIntroWorkspace.tsx`, `ExplainedQuestionsWorkspace.tsx`).
- Persistence, validation, and Stage 02 submission integrated and verified across all 3 modes with 100% test passing rate.

### Downstream Roadmap:
1. **Stage 03 Scripting & Teleprompter Adaptation**: Extend Audience Script and Teleprompter modules to ingest multi-question Mode 3 packages and Mode 2 concept demystifications without breaking Mode 1 single-short contracts.
2. **Stage 05 & 06 Filming & Editing Multi-Take Ingestion**: Support take grouping per question index for Mode 3 masterclasses while preserving single-take flows for Mode 1.
3. **Stage 07 Final QC Multi-Tab Consolidation**: Ensure QC inspection evaluates polymorphic criteria (Mode 2 syllabus verification, Mode 3 multi-question review) within `VideoDetailPage.tsx`.
4. **Stage 10 Publishing & Distribution Alignment**: Adapt metadata schemas for 16:9 masterclass publishing on YouTube Longform alongside 9:16 Shorts.

---

## 9. KEY DECISIONS, TRADEOFFS, ASSUMPTIONS, AND ACCEPTANCE CRITERIA

### 9.1 Active Architecture Decision Log (ADRs)

| ADR ID | Decision Summary | Core Rationale |
| :--- | :--- | :--- |
| **ADR-001** | Single 15-stage state engine (`transition-matrix.ts`) | Single source of truth for workflow states. |
| **ADR-002 / ADR-013** | Strict GAR-02 with audited System Admin override | Anti-self-approval with operational continuity for single admin. |
| **ADR-003** | AI Human Gating (AP-009) | Prohibits silent AI approvals on quality gates. |
| **ADR-004 / ADR-007** | Google AI Studio as Primary Release Target | Unified build/run environment with zero drift. |
| **ADR-008** | Two-Tier Taxonomy (`Topic` $\to$ `Subtopic`) | Obsoletes legacy Category permanently. |
| **ADR-009** | 4-option MCQ schema; Stage 02 concept verification for Mode 2 | Invariant 15-stage sequence without skipping steps. |
| **ADR-010** | Additive multi-mode model; mode-governed aspect ratios | Accommodates Mode 3 masterclasses and Mode 2 intros. |
| **ADR-011** | QC consolidated into `VideoDetailPage.tsx`; typed query params | Eliminates unmounted page fragmentation. |
| **ADR-012** | Mode 1 batch generation runner authorization | Scalable candidate generation ($N \in \{5,10,15,20\}$). |
| **ADR-014** | Unified Local-to-Deployment Architecture (Principle 16) | Single codebase running identically locally and in AI Studio. |

### 9.2 Key Technical Trade-offs
1. **In-Memory & Emulator Testing vs. Live Cloud Testing**:
   - *Decision*: Strictly test against mocks, in-memory fixtures, and local Firestore Emulator.
   - *Trade-off*: Avoids production cloud costs and quota exhaustion; requires comprehensive mock fidelity and explicit boundary testing.
2. **Single Atomic Aggregate vs. Relational Subcollections for Multi-Question Sets**:
   - *Decision*: Store Mode 3 question packages as single atomic aggregate documents in `question_drafts` and `questions`.
   - *Trade-off*: Guarantees atomic writes and transactional integrity across questions; limits package size to Firestore 1MB document ceiling (well within budget for $N \le 20$ questions).
3. **Strict Free-Tier Rate Limiting vs. Uncapped Throughput**:
   - *Decision*: Enforce 15 RPM token bucket and 100 calls/day circuit breaker.
   - *Trade-off*: Prioritizes ₹0.00 cost guarantee over burst throughput.

### 9.3 Open Questions & Research Items
- **GCP Cloud Run Container Constraints**: Confirm whether Google AI Studio Applet execution environment imposes container memory ceilings ($\le 512\text{MB}$) that require tuning Node's `--max-old-space-size`.
- **Automated Cloud Backup Trigger**: Develop an isolated, permission-gated GCP Cloud Function or manual CLI runbook for automated Firestore backups before future database maintenance.

### 9.4 Architecture Acceptance Criteria (AAC)
- **[AAC-01] Single Codebase**: Zero separate repository forks, development-only shims, or branched business logic between local development and deployed AI Studio runtime.
- **[AAC-02] Datastore Isolation**: Datastore safety guard prevents development or test execution from writing to production Firestore under all circumstances.
- **[AAC-03] Full 15-Stage Integrity**: All 3 content modes transition cleanly through the 15-stage workflow without skipping stages or violating state machine rules.
- **[AAC-04] Strict GAR-02 & Admin Override**: Self-approval rejected for all employees; admin self-approval permitted only with audited confirmation and $\ge 10$-character reason.
- **[AAC-05] Secret Externalization**: Zero secrets tracked in Git; exactly 8 canonical production secrets required in Google AI Studio.
- **[AAC-06] Two-Tier Taxonomy**: Zero runtime references to Category; Topic $\to$ Subtopic strictly enforced in database, APIs, and UI.
- **[AAC-07] Free-Tier Protection**: Outbound AI calls protected by token bucket limiter and daily circuit breaker guaranteeing ₹0.00 cost under Google AI Studio free tier.
- **[AAC-08] Verified Clean Build**: `npm run build` compiles frontend assets and backend server cleanly without errors or untyped warnings.

---

## 10. RECOMMENDED FIRST IMPLEMENTATION SPRINT BREAKDOWN

Based on the completion of Sprint 10 (which established the multi-mode authoring workspaces and persistence baseline), the first logical implementation sprint is **Sprint 11: Multi-Mode Production Workbench & Stage 03–07 Downstream Expansion**.

### Recommended Initial Task Breakdown:
- **`S11-T01`**: Audit Stage 03 (Audience Script) data contracts and UI for multi-mode payload consumption (Mode 2 concept demystification script vs. Mode 3 multi-question masterclass script).
- **`S11-T02`**: Implement Mode 2 and Mode 3 script generators and editors in `ScriptGenerationPage` / `ScriptWorkspace`.
- **`S11-T03`**: Adapt Stage 04 Teleprompter & Filming interface with question tab switching for Mode 3 multi-take filming.
- **`S11-T04`**: Extend Stage 05 Raw Video Ingestion to support multi-take registration mapped to Mode 3 question indices.
- **`S11-T05`**: Enhance Stage 07 Final QC within `VideoDetailPage.tsx` Tab 4 to validate Mode 2 syllabus criteria and Mode 3 question sequences with strict GAR-02 enforcement.
- **`S11-T06`**: Comprehensive automated test suite for Stage 03–07 multi-mode workflow integration.
