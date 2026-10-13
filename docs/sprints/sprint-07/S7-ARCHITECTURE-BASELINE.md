# S7-ARCHITECTURE-BASELINE: THE CANONICAL ARCHITECTURAL BASELINE

**Sprint**: SPRINT 7 — ARCHITECTURE REORGANIZATION & FEATURE ISOLATION  
**Task**: S7-T02 Freeze the Canonical Architecture  
**Document Status**: **AUTHORITATIVE ARCHITECTURAL BASELINE (FROZEN)**  
**Effective Date**: October 11, 2026  
**Derived From**: \`docs/sprints/sprint-07/S7-T01-REPOSITORY-FORENSIC-INVENTORY.md\`  
**Target Milestone**: Complete feature isolation, clean architectural boundaries, zero cross-feature leakage.

---

## 1. Executive Summary & Architectural Baseline Purpose

### 1.1 Core Mission
The primary objective of this architecture baseline is to transition Burra Pariksha CMS (BP-CMS) from an entangled, semi-monolithic structure into a cleanly modular, vertically isolated architecture where every business capability is:

1. **Independently Understandable**: A developer or AI coding agent can inspect a single feature's directory and comprehend its data flow, business rules, and UI without scanning hundreds of unrelated files.
2. **Independently Changeable**: Modifications to one stage (e.g., Question Generation) cannot cause regressions or break builds in unrelated stages (e.g., Video Publishing or Social Analytics).
3. **Independently Testable**: Unit, integration, and UI tests can run against a specific feature without mocking the entire repository.
4. **Independently Deployable (where practical)**: Feature boundaries align with service interfaces, enabling future microservices, edge workers, or modular bundle splitting.

### 1.2 Cognitive Overhead Minimization for AI Pair-Programming
In pair-programming with autonomous agents (Antigravity), repository context windows are precious. By enforcing strict vertical feature boundaries, an agent tasked with modifying Question Generation needs only inspect \`features/question-generation/\`, rather than loading a 7,329-line monolithic router (\`routes.ts\`), a 3,237-line monolithic type registry (\`index.ts\`), or 69 co-located services in \`src/lib/services/\`.

### 1.3 Scope of S7-T02
This document **freezes the rules and target architecture**. It does not perform file moves or code refactoring; implementation begins in subsequent Sprint 7 tasks (S7-T03 onward).

---

## 2. Canonical 10-Layer Architecture Model

BP-CMS establishes 10 canonical architectural layers. These represent permanent logical boundaries that govern code organization, import direction, and operational responsibility:

| Layer | Primary Role | Authoritative Scope | Runtime Context |
|:---|:---|:---|:---|
| **1. FRONTEND** | Client Presentation & Interaction | React components, pages, contexts, UI validation, view state | Browser / Client Bundle |
| **2. API** | Gateway & Communication | HTTP REST endpoints, Zod request validation, response serialization | Node.js Express / Client API Client |
| **3. BACKEND** | Business Use Cases & Application Orchestration | Application services, domain logic, authorization, error handling | Node.js Server |
| **4. WORKFLOW** | Business State Machine | Canonical 15-step transitions, gate checks, anti-self approval | Node.js Server / Domain |
| **5. AI** | Intelligence Generation & Analysis | Gemini client, prompt templates, output validation, token management | Node.js Server (Privileged) |
| **6. DATABASE** | Persistence & State Storage | Cloud Firestore adapter, repositories, schemas, atomic batch writes | Server / Cloud Firestore |
| **7. INTEGRATIONS** | External System Connectors | Google Drive OAuth2, Cloud Storage (GCS), YouTube Data API | Node.js Server (Privileged) |
| **8. SHARED** | Isomorphic Contracts & Utilities | TypeScript interfaces, API DTOs, domain enums, pure utilities | Isomorphic (Client & Server) |
| **9. CONFIGURATION** | Platform & Environment Settings | Runtime environment variables, business limits, build configs | Node.js / Build Tools / Client Safe |
| **10. TEST** | Verification & Quality Assurance | Unit tests, regression suites, gate verifications, mocks, fixtures | Node.js / CI Runner |

---

## 3. Frontend Boundary Specification

### 3.1 Scope & Responsibilities
The **FRONTEND** layer encompasses all client-side code executed in the browser:
- React pages (\`frontend/pages/\`, migrated from historical \`src/pages/\`)
- Reusable UI components (\`frontend/components/\`, \`frontend/design-system/\`, migrated from historical \`src/components/\`)
- Client React contexts and state providers (\`frontend/contexts/\`: \`AuthContext\`, \`NavigationContext\`)
- Client-side routing (\`App.tsx\`, React Router v7)
- Presentation-only formatting and UX validation (e.g., instant field presence, character counters)
- Strongly typed HTTP API client adapters (\`frontend/lib/api-client.ts\`, migrated from historical \`src/lib/api-client.ts\`)

### 3.2 Allowed Dependencies
The Frontend **MAY** import:
- The centralized API client (\`frontend/lib/api-client.ts\` or feature-scoped API clients)
- Shared contracts, types, and DTOs (\`shared/\`, \`shared/types/*\`, and isomorphic \`src/types/*\` shims)
- Shared constants and domain enums (\`QuestionStatus\`, \`VideoProductionStatus\`, \`DifficultyLevel\`)
- Frontend utilities and design system primitives (\`lucide-react\`, \`motion\`, Tailwind utilities)

### 3.3 Explicit Forbidden Dependencies
The Frontend **MUST NOT** directly import:
- ❌ Repositories (\`src/lib/repositories/*\`)
- ❌ Cloud Firestore adapters or Firestore SDK instances (\`src/lib/firebase/*\`)
- ❌ Firebase Admin SDK (\`firebase-admin\`)
- ❌ Backend application services (\`src/lib/services/*\`)
- ❌ Backend algorithmic validation engines (\`src/lib/validation/*\`, \`CandidateValidator\`)
- ❌ External AI provider implementations or SDKs (\`@google/genai\`, \`gemini.service.ts\`)
- ❌ Database initialization or migration machinery (\`firestore-production-initializer.service.ts\`)
- ❌ Secret-bearing infrastructure or server environment access (\`process.env\`)

> [!IMPORTANT]
> All frontend communication with backend services, databases, or AI capabilities **MUST** pass strictly through the HTTP API client.

---

## 4. Backend Boundary Specification

### 4.1 Scope & Responsibilities
The **BACKEND** layer is the authoritative server-side application layer running in Node.js:
- Express HTTP server and route dispatchers (\`server.ts\`, \`src/server/*\`)
- Application use-case handlers and orchestration services
- Domain services enforcing business invariants
- Role-based authorization and object-level security (\`role-capability-matrix.ts\`, \`object-auth.service.ts\`)
- Workflow state machine transition enforcement (\`workflow-engine.service.ts\`)
- Authoritative multi-layer validation engines (\`QuestionValidationEngine\`)
- Error propagation and standard HTTP response envelopes (\`ApiResponseEnvelope\`)

### 4.2 Authoritative Mandates
The Backend is **AUTHORITATIVE** for:
1. **Authorization**: Validating actor session cookies, role capabilities, and anti-self-approval rules (GAR-02: author !== approver).
2. **Business Validation**: Authoritative pedagogical, mathematical, and LaTeX verification. Client checks are UX hints only.
3. **Workflow Transitions**: Advancing or rejecting questions, videos, and publishing records through the 15-step state machine.
4. **Persistence Commands**: Executing atomic transactions and batch writes to Cloud Firestore.
5. **AI Orchestration**: Constructing prompts, enforcing token safety, calling Gemini APIs, and validating JSON output before returning to clients.

### 4.3 Forbidden Dependencies
- ❌ The Backend **MUST NOT** import any React components, JSX elements, React hooks, or frontend presentation code.

---

## 5. API Gateway Boundary Specification

### 5.1 Architecture & Flow
```
┌─────────────────┐       HTTP JSON       ┌─────────────────┐       Internal       ┌─────────────────┐
│ React Frontend  │ ────────────────────► │   HTTP REST     │ ───────────────────► │ Backend Domain  │
│  (UI / Pages)   │ ◄──────────────────── │  API Gateway    │ ◄─────────────────── │    Services     │
└─────────────────┘      REST Envelope    └─────────────────┘      Return DTO      └─────────────────┘
```

### 5.2 Architectural Rules
1. **No Direct Bypass**: The browser must never bypass the API gateway. Direct client database access or client-side LLM API access is prohibited.
2. **Feature-Oriented API Client Functions**: Frontend components must call clean, named functions on the API client (e.g., \`apiClient.saveQuestionDraft(payload)\`) rather than making ad-hoc \`fetch()\` calls with raw URLs.
3. **Decomposition & Organization**: The historical monolithic router (\`src/server/routes.ts\`, now canonically located at \`backend/server/routers/routes.ts\`) is bounded to HTTP dispatch, delegating domain logic to backend services and repositories. All requests are validated using canonical schemas in \`backend/server/validation/request-schemas.ts\`.

---

## 6. Database & Persistence Boundary Specification

### 6.1 Scope & Responsibilities
The **DATABASE** layer is pure persistence infrastructure:
- Cloud Firestore Admin SDK connection and configuration (\`database/firestore/adapter/admin.ts\`, with historical \`src/lib/firebase/admin.ts\` re-export)
- Entity repositories (\`database/firestore/repositories/*\`) performing CRUD, filtering, pagination, and atomic batch writes
- Canonical collection constants and schema contracts
- Cloud Firestore security rules (\`firestore.rules\`)
- Persistence utilities, seed scripts, and disaster recovery backup exporters

### 6.2 Separation of Concerns: Repositories vs. Services
- **Repositories Own**: Persistence mechanics (reading/writing Firestore documents, building queries, managing batch limits). Repositories **MUST NOT** contain business workflow decisions.
- **Services Own**: Domain business rules (validating invariants, checking permissions, orchestrating state transitions). Services call repositories to persist results.

### 6.3 Datastore Authority
- **Cloud Firestore** is the sole authoritative transactional database for Burra Pariksha CMS.
- **Google Sheets** is **NOT** a transactional database. All runtime dependencies on Google Sheets have been permanently excised.

### 6.4 Forbidden Dependencies
- ❌ Database code **MUST NOT** depend on React, frontend components, client contexts, or UI state.

---

## 7. AI Capability Boundary Specification

### 7.1 Scope & Privileges
The **AI** layer is a specialized server-side capability:
- Gemini LLM provider adapters (\`backend/ai/providers/gemini.service.ts\`, \`@google/genai\`)
- Domain-specific prompt templates (\`backend/ai/prompts/*\`)
- AI structured response schemas and repair parsers (\`backend/ai/schemas/*\`)
- Algorithmic output validators and pedagogical scoring engines (\`backend/ai/validators/*\`)
- Provider-neutral AI orchestrator (\`backend/ai/orchestrator/ai-orchestrator.service.ts\`)

### 7.2 Human-in-the-Loop Principle (AP-009)
AI is strictly **ADVISORY**:
- AI generates candidates, suggests explanations, and drafts tags.
- AI **NEVER** silently approves workflow transitions or bypasses review gates.
- Human review and approval by an authenticated reviewer is mandatory for all publication stages.

### 7.3 Forbidden Dependencies
- ❌ Frontend code **MUST NOT** import Gemini SDKs, provider implementations, AI prompt templates, or AI validator classes.

---

## 8. Canonical Workflow State Machine Boundary Specification

### 8.1 Scope & Business Ownership
The **WORKFLOW** layer governs the immutable lifecycle of all educational assets across 15 sequential stages:
$$\text{Stage 01: Ideation} \longrightarrow \text{Stage 02: Verification} \longrightarrow \dots \longrightarrow \text{Stage 15: Social Intelligence}$$

### 8.2 Operational Rules
1. **Centralized Authority**: All state transitions are validated by the backend workflow engine (\`backend/infrastructure/workflow/services/workflow-engine.service.ts\`).
2. **Anti-Self Approval (GAR-02)**: Authors cannot approve their own work (\`authorId !== reviewerId\`).
3. **Role Enforcement**: Every stage requires specific role capabilities (e.g., \`QUESTION:APPROVE\`, \`VIDEO:PUBLISH\`).
4. **Audit Trail**: Every workflow progression or rejection produces an immutable audit record in \`audit_logs\`.
5. **Frontend Presentation Only**: The frontend displays current workflow status badges and action buttons based on permissions; it cannot bypass transition gates.

---

## 9. Shared Code & Contracts Boundary Specification

### 9.1 What Belongs in Shared
A module or type belongs in **SHARED** only if it is genuinely isomorphic (consumed by both client and server):
- Domain data models (\`Question\`, \`Topic\`, \`Subtopic\`, \`Video\`, \`Script\`, \`Thumbnail\`, \`User\`)
- Standard API request/response envelopes (\`ApiResponseEnvelope<T>\`)
- Canonical domain enums (\`QuestionStatus\`, \`UserRole\`, \`DifficultyLevel\`, \`WorkflowStage\`)
- Pure utility functions with zero third-party framework dependencies (e.g., date formatters, string sanitizers)

### 9.2 What MUST NOT Be in Shared
- ❌ React components, JSX, or frontend DOM utilities
- ❌ Express request/response objects or server middleware
- ❌ Firebase Admin SDK or Firestore repository classes
- ❌ AI provider clients or prompt templates
- ❌ Secret keys, API tokens, or server-only configuration

> [!CAUTION]
> A type is **NOT** "shared" merely because multiple backend modules use it. Backend-only interfaces must reside in \`backend/\`.

---

## 10. Test Verification Boundary Specification

### 10.1 Hierarchy & Organization
Tests are classified by architectural role and execution speed:
```
tests/
├── unit/            # Pure, in-memory logic tests (no network/db)
├── integration/     # Service-to-repository and API-to-handler tests
├── e2e/             # Full browser and live Firestore workflow journeys
├── foundation/      # FC-001 through FC-005 capability tests
├── regression/      # Sprint-specific regression gates (S4, S5, S6)
├── security/        # Firestore security rules and RBAC tests
└── fixtures/        # Synthetic, deterministic mock data
```

### 10.2 Boundary Rules
- Tests may import production code, shared contracts, and test fixtures.
- Production code **MUST NEVER** import from \`tests/\`.
- Test helpers must never be bundled into the production client or server artifacts.

---

## 11. Documentation & Knowledge Boundary Specification

### 11.1 Authority Hierarchy
1. **Working Production Code**: The ground-truth reality of the system.
2. **Authoritative Architecture Baselines**:
   - \`docs/sprints/sprint-07/S7-ARCHITECTURE-BASELINE.md\` (This document — Sprint 7 baseline)
   - \`docs/architecture/26-COLLISION-RESISTANT-UUID-CANONICAL-ID-ARCHITECTURE.md\` (Sprint 6 baseline)
   - \`docs/architecture/25-TWO-TIER-TAXONOMY-ARCHITECTURE.md\` (Sprint 5 baseline)
3. **Feature & Domain Contracts**: \`docs/features/*\`.
4. **Sprint Execution Reports**: \`docs/execution/*\` (Historical records).
5. **Historical Spikes**: Clearly tagged as non-authoritative historical exploration.

---

## 12. External Integrations Boundary Specification

All third-party services must be accessed through backend-owned, isolated adapters:
- **Google Cloud Storage (GCS)**: Handled via backend storage services; binary media externalized.
- **Google Drive OAuth2**: Handled via \`drive-integration.service.ts\`; client never handles refresh tokens.
- **YouTube Data API v3**: Handled via \`youtube-oauth.service.ts\`; server manages access tokens and quota.
- **Google Gemini 2.5**: Handled via \`gemini.service.ts\`; API keys strictly secured on backend.

---

## 13. Configuration & Secrets Boundary Specification

Configuration is categorized into 4 strict tiers:
1. **Server Runtime Config**: \`PORT\`, \`NODE_ENV\`, \`FIREBASE_SERVICE_ACCOUNT_KEY\`, \`GEMINI_API_KEY\`, \`SESSION_SECRET\`. Managed via environment variables; **NEVER** exposed to client or committed to git.
2. **Domain Business Config**: \`question-creation.config.ts\`, \`production-taxonomy.ts\`. Declarative business rules and constants.
3. **Frontend UI Config**: Navigation routes, menu items, table pagination defaults. Safe for public client bundle.
4. **Build & Tooling Config**: \`vite.config.ts\`, \`tsconfig.json\`, \`Dockerfile\`. Developer environment and compilation parameters.

---

## 14. Canonical Dependency Direction & Hierarchy

The entire codebase must adhere strictly to the following unidirectional dependency flow:

```
                          ┌───────────────────────────┐
                          │         FRONTEND          │
                          │   (Pages / Components)    │
                          └─────────────┬─────────────┘
                                        │
                                        ▼ (HTTP REST)
                          ┌───────────────────────────┐
                          │        API GATEWAY        │
                          │    (Routes / Client)      │
                          └─────────────┬─────────────┘
                                        │
                                        ▼
                          ┌───────────────────────────┐
                          │          BACKEND          │
                          │   (Use Cases / Services)  │
                          └──────┬─────────────┬──────┘
                                 │             │
                    ┌────────────┘             └────────────┐
                    ▼                                       ▼
     ┌─────────────────────────────┐         ┌─────────────────────────────┐
     │      PERSISTENCE LAYER      │         │     AI & INTEGRATIONS       │
     │  (Repositories / Firestore) │         │   (Gemini / Drive / YouTube)│
     └─────────────────────────────┘         └─────────────────────────────┘
                    ▲                                       ▲
                    │                                       │
                    └───────────────────┬───────────────────┘
                                        │
                          ┌─────────────┴─────────────┐
                          │          SHARED           │
                          │ (Types / Models / Enums)  │
                          └───────────────────────────┘
```

---

## 15. Explicit Forbidden Dependencies Matrix

The following table freezes the **15 FORBIDDEN IMPORT RELATIONSHIPS** across BP-CMS:

| Violation Rule | Source Layer | Target Layer | Why It Is Forbidden |
|:---:|:---|:---|:---|
| **RULE-01** | Frontend | Repository | Bypasses backend authorization, validation, and audit logging. |
| **RULE-02** | Frontend | Firestore Adapter | Exposes raw database connection to client environment. |
| **RULE-03** | Frontend | Firebase Admin SDK | Client cannot run server-side admin credentials; bundle bloat. |
| **RULE-04** | Frontend | Backend Service | Couples client components to server-only Node.js execution context. |
| **RULE-05** | Frontend | Backend Validation Engine | Pulls heavy algorithmic parsing and LaTeX math solvers into browser bundle. |
| **RULE-06** | Frontend | Gemini Provider | Exposes LLM API keys and privileged prompt tuning parameters. |
| **RULE-07** | Frontend | Backend AI Client | Bypasses server token throttling and cost observability controls. |
| **RULE-08** | Frontend | DB Initializer / Migration | Client cannot execute database seeding or schema migration scripts. |
| **RULE-09** | Backend | React Page / Component | Server code must be headless; importing UI breaks Node.js build. |
| **RULE-10** | Backend | Frontend Context | Server cannot access React component lifecycle or browser session state. |
| **RULE-11** | Shared | Backend Service | Breaks isomorphic usage; prevents frontend from importing shared types. |
| **RULE-12** | Shared | Database Adapter | Pollutes pure data contracts with database connection overhead. |
| **RULE-13** | Shared | React / Express | Shared types must be pure TypeScript, free of UI or HTTP frameworks. |
| **RULE-14** | Database | Frontend / UI State | Persistence layers must remain agnostic to UI view models and filters. |
| **RULE-15** | Production | Test Modules / Fixtures | Test code must never be bundled or deployed to production environments. |

---

## 16. Allowed Dependencies Matrix

The following dependency relationships are officially authorized:

- ✅ **Frontend $\rightarrow$ API Client**: Client invokes strongly-typed API client methods.
- ✅ **Frontend $\rightarrow$ Shared Contracts**: Client uses shared interfaces for props and state.
- ✅ **Frontend $\rightarrow$ Design System**: Client imports UI primitives and theme tokens.
- ✅ **Backend Routes $\rightarrow$ Backend Services**: Routes parse requests and delegate to use-case services.
- ✅ **Backend Services $\rightarrow$ Workflow Engine**: Services query and execute workflow transitions.
- ✅ **Backend Services $\rightarrow$ AI Orchestrator**: Services invoke AI generation with domain prompts.
- ✅ **Backend Services $\rightarrow$ Repositories**: Services persist and retrieve domain entities.
- ✅ **Backend Services $\rightarrow$ Integration Adapters**: Services upload media to Drive/GCS or YouTube.
- ✅ **Repositories $\rightarrow$ Firestore Adapter**: Repositories query Cloud Firestore collections.
- ✅ **AI Orchestrator $\rightarrow$ AI Providers**: Orchestrator executes calls against Gemini SDK.
- ✅ **Tests $\rightarrow$ Production Modules**: Tests import code under test to verify behavior.
- ✅ **Tests $\rightarrow$ Test Fixtures**: Tests use deterministic synthetic fixtures.

---

## 17. Feature Isolation Model (Vertical Slice Architecture)

To make features independently understandable, changeable, and testable, Sprint 7 establishes the **Vertical Feature Slice Model**:

```
features/<feature-name>/
├── frontend/                     # UI, pages, components, local hooks
│   ├── pages/
│   ├── components/
│   └── hooks/
├── backend/                      # Route handlers, use cases, domain services
│   ├── routes/
│   └── services/
├── shared/                       # Feature-specific DTOs, contracts, interfaces
│   └── contracts/
└── tests/                        # Feature-focused unit & integration tests
    ├── unit/
    └── integration/
```

### Centralized Infrastructure Remains Centralized
Feature slices do not duplicate foundational infrastructure:
- Cloud Firestore connection (\`admin.ts\`) remains centralized in \`backend/infrastructure/database/\`.
- Authentication middleware remains centralized in \`backend/infrastructure/auth/\`.
- Design system primitives remain centralized in \`frontend/shared/design-system/\`.
- Canonical ID generator (\`id.service.ts\`) remains centralized in \`shared/lib/\`.

---

## 18. Question Generation (Stage 01) Target Isolation Architecture

Question Generation is officially declared the **First Feature-Isolation Slice** for Sprint 7:

```
┌────────────────────────────────────────────────────────────────────────┐
│             frontend/features/question-generation/                     │
│  [QuestionStudioPage]  [CandidateCard]  [QuestionStudioForm]           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ ✅ apiClient.generateQuestionCandidate()
                                    │ ✅ apiClient.saveQuestionDraft()
                                    │ ✅ apiClient.validateCandidate()
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│             backend/features/question-generation/                      │
│  [questions.router.ts]          ──► REST Route Gateway                 │
│  [question-generation.service]  ──► AI Prompts & Gemini Dispatch       │
│  [question-draft.service.ts]    ──► Draft Persistence (question_drafts)│
│  [candidate-validation.service] ──► Algorithmic Quality Pre-Check      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                     backend/infrastructure/                            │
│  [question-drafts.repository.ts] ──► Firestore: question_drafts        │
│  [topics.repository.ts]          ──► Firestore: topics, subtopics      │
│  [gemini.service.ts]             ──► Google Gemini 2.5 Flash API       │
└────────────────────────────────────────────────────────────────────────┘
```

### Specific Target Mandates for Question Generation:
1. **Remove Client AI Validator Imports**: Excise \`CandidateValidator\` from \`QuestionStudioPage.tsx\`. Candidate validation will occur via \`POST /api/questions/validate-candidate\`.
2. **Decouple Save from Verify**: Replace forced navigation to verification with an in-place draft save confirmation.

---

## 19. Save vs. Verify Operational Contract

### 19.1 Clear Operational Separation
To permanently resolve the user-reported issue where manual data was saved but perceived as failed, the following behavioral contract is frozen:

$$\text{\textbf{SAVE DRAFT}} \neq \text{\textbf{VERIFY}}$$

- **Command 1: \`SAVE DRAFT\`**
  - **Intent**: Persist user-entered data to Firestore (\`question_drafts\` collection) exactly as entered.
  - **Preconditions**: Minimal presence check (question text and basic fields). Zero strict math or LaTeX gate checks.
  - **UI Behavior**: Shows clear in-place success toast: *"Draft saved successfully."* **Remains on the studio page.**
  - **State**: Dirty flag cleared. Draft ID retained.

- **Command 2: \`SUBMIT FOR VERIFICATION\`**
  - **Intent**: Explicit user action requesting transition from Stage 01 to Stage 02.
  - **Preconditions**: Draft must be saved.
  - **UI Behavior**: User explicitly clicks *"Submit for Verification"*, navigating to \`QuestionVerifyApprovePage\`.
  - **Verification Engine**: Executes authoritative verification rules on the dedicated verification page.

---

## 20. API Responsibility Contract

Every feature API route must adhere to a standardized contract:
1. **HTTP Method & URL**: Strict REST conventions (e.g., \`POST /api/questions/draft\`, \`GET /api/questions/:id\`).
2. **Authentication & Authorization**: Handled via middleware (\`requireAuth\`, \`requireCapability('QUESTION:CREATE')\`).
3. **Payload Validation**: Incoming request body validated using Zod schemas before hitting domain services.
4. **Service Delegation**: Route handlers must **NOT** contain inline business calculations; they delegate immediately to use-case services.
5. **Standardized Response Envelope**: All endpoints return \`ApiResponseEnvelope<T>\` with consistent error formats and HTTP status codes.

---

## 21. Database & Persistence Responsibility Contract

The responsibility boundary between layers is frozen as follows:
- **Repositories**: Own document reads, writes, queries, and Firestore batch operations. Zero business rule decisions.
- **Domain Services**: Own business rules, validation, workflow state checking, and transactional coordination.
- **Workflow Engine**: Owns 15-step state transition rules and role capabilities.
- **API Routes**: Own HTTP serialization, header processing, and status code mapping.
- **Frontend**: Owns user interaction, form inputs, and visual state presentation.
- **AI Services**: Own generation, prompt crafting, and response parsing.

---

## 22. Large-File Decomposition Strategy

The following high-risk files identified in S7-T01 are formally scheduled for modular decomposition in Sprint 7 implementation tasks:

1. **\`src/server/routes.ts\` (7,329 lines)**: Will be decomposed into 8 feature routers (\`questions.router.ts\`, \`media.router.ts\`, \`planning.router.ts\`, \`publishing.router.ts\`, \`analytics.router.ts\`, \`recovery.router.ts\`, \`auth.router.ts\`, \`taxonomy.router.ts\`).
2. **\`src/types/index.ts\` (3,237 lines)**: Will be split into domain-scoped contracts (\`question.types.ts\`, \`media.types.ts\`, \`auth.types.ts\`, \`workflow.types.ts\`).
3. **\`src/pages/PlanningPage.tsx\` (2,573 lines)**: Will be divided into matrix view, calendar view, and batch management subcomponents.
4. **\`src/lib/services/publishing.service.ts\` (2,172 lines)**: Will be separated into YouTube upload adapter, platform adaptation, and publishing package manager.
5. **\`src/pages/RecoveryAdminPage.tsx\` (2,055 lines)**: Will be split into preflight simulation card, granular restore viewer, and full snapshot runner.
6. **\`src/pages/SettingsPage.tsx\` (1,974 lines)**: Will be decomposed into IAM settings, taxonomy manager, and operational health tabs.
7. **\`src/lib/api-client.ts\` (1,708 lines)**: Will be modularized into domain API clients combined via an API client facade.
8. **\`src/pages/QuestionStudioPage.tsx\` (1,686 lines)**: Will be broken down into form section, candidate preview card, and AI generation panel.

---

## 23. Preliminary Target Migration Structure Map (Current $\rightarrow$ Target)

Based on S7-T01 forensic evidence, the repository will evolve toward the following structure:

| Current File / Directory | Target Architectural Location | Architectural Rationale |
|:---|:---|:---|
| \`src/pages/QuestionStudioPage.tsx\` | \`frontend/features/question-generation/pages/QuestionStudioPage.tsx\` | Core Stage 01 workspace isolated into feature module. |
| \`src/pages/QuestionVerifyApprovePage.tsx\` | \`frontend/features/question-verification/pages/QuestionVerifyPage.tsx\` | Stage 02 authoritative verification workspace isolated. |
| \`src/pages/PlanningPage.tsx\` | \`frontend/features/planning/pages/PlanningPage.tsx\` | Stage 00 strategy workspace isolated. |
| \`src/pages/RecoveryAdminPage.tsx\` | \`frontend/features/recovery/pages/RecoveryAdminPage.tsx\` | Disaster recovery console isolated. |
| \`src/pages/SettingsPage.tsx\` | \`frontend/features/settings/pages/SettingsPage.tsx\` | Platform administration isolated. |
| \`src/server/routes.ts\` | \`backend/server/routers/*.router.ts\` | Monolithic router decomposed into feature routers. |
| \`src/lib/services/question-draft.service.ts\` | \`backend/features/question-generation/services/question-draft.service.ts\` | Draft persistence co-located with question generation. |
| \`src/lib/services/question-validation.service.ts\` | \`backend/features/question-verification/services/question-validation.service.ts\` | Authoritative validation co-located with verification. |
| \`src/lib/ai/prompts/generation.prompt.ts\` | \`backend/features/question-generation/ai/generation.prompt.ts\` | Feature prompt co-located with feature service. |
| \`src/lib/ai/validators/candidate.validator.ts\` | \`backend/features/question-verification/ai/candidate.validator.ts\` | Server-side validation co-located with verification. |
| \`src/lib/repositories/questions.repository.ts\` | \`backend/infrastructure/repositories/questions.repository.ts\` | Pure database access in centralized infrastructure. |
| \`src/lib/firebase/admin.ts\` | \`backend/infrastructure/database/firebase/admin.ts\` | Database connection adapter in centralized infrastructure. |
| \`src/types/index.ts\` | \`shared/types/domain/*.types.ts\` | Monolithic types split into domain contracts. |

---

## 24. Ten Mandatory Migration Rules

All remaining tasks in Sprint 7 must obey these **TEN COMMANDMENTS OF MIGRATION**:

1. **Zero Big-Bang Migrations**: Never move or restructure hundreds of files in a single step.
2. **One Feature Slice at a Time**: Migrate vertically slice-by-slice (e.g., Question Generation first).
3. **Preserve Runtime Invariants**: Every file move must preserve existing business behavior and contracts.
4. **Mandatory Verification Gate**: After each individual move:
   $$\text{Inspect} \longrightarrow \text{Move} \longrightarrow \text{Update Imports} \longrightarrow \text{\texttt{npm run lint}} \longrightarrow \text{\texttt{npm run build}} \longrightarrow \text{Targeted Tests} \longrightarrow \text{Commit} \longrightarrow \text{Push}$$
5. **Zero Mixing of Redesign with Migration**: Never combine visual UI redesigns or new business logic into a file relocation commit.
6. **Zero Behavioral Changes Without Explicit Mandate**: Do not alter algorithms, calculations, or validation rules during restructuring.
7. **Zero Production Database Resets**: Moving code must **NEVER** wipe Firestore collections, drop users, or destroy seed taxonomy.
8. **Zero Committed Secrets**: Credentials, service account JSONs, and API keys must remain strictly in \`.env\`.
9. **Main Branch Is Authoritative**: Every verified slice must be pushed cleanly to \`origin/main\`.
10. **Automated Architectural Enforceability**: New folder boundaries must be verifiable via static lint checks.

---

## 25. Architectural Enforcement & Automated Quality Gates

To prevent boundary degradation, Sprint 7 enforces automated architecture quality gates:
- **Rule A (No Frontend Backend Imports)**: Lint/test check fails if any file in \`frontend/pages/\` or \`frontend/components/\` imports from \`backend/infrastructure/services/\`, \`database/firestore/repositories/\`, or \`firebase-admin\`. Verified by \`tests/s7-frontend-backend-boundary.test.ts\`.
- **Rule B (No Frontend AI Validator Imports)**: Lint/test check fails if client code imports from \`backend/ai/validators/\` or provider SDKs (\`@google/genai\`). Verified by \`tests/s7-t09-ai-boundary.test.ts\`.
- **Rule C (No Shared Infrastructure Imports)**: Lint/test check fails if any contract in \`shared/\` imports \`express\`, \`react\`, or \`firebase-admin\`. Verified by \`tests/fc-005-shared-contract.test.ts\`.
- **Rule D (No Test Production Imports)**: Lint check fails if production source imports from \`tests/\`. Verified by \`tests/s7-frontend-backend-boundary.test.ts\`.

---

## 26. Source-of-Truth Authority Hierarchy

When resolving ambiguities or contradictions during Sprint 7 migration:

1. **Working Production Code & Tests**: The authoritative operational reality of BP-CMS.
2. **Sprint 7 Architecture Baseline (`S7-ARCHITECTURE-BASELINE.md`)**: The authoritative structural design.
3. **Active Architecture ADRs (`docs/architecture/25-*`, `docs/architecture/26-*`)**: Specific domain decisions.
4. **Feature Domain Contracts (`docs/features/*`)**: Acceptance criteria and data structures.
5. **Historical Sprint Execution Documents (`docs/execution/*`)**: Non-authoritative historical logs.

---

## 27. Sprint 7 Initial Technical Debt Ledger & Verified Resolution Status

The following violations documented at the start of Sprint 7 (in S7-T01 inventory) have been systematically tracked and resolved across S7-T01 through S7-T09:

| Known Legacy Violation | Historical Location | Resolution Status | Verified Implementation |
|:---|:---|:---|:---|
| **Direct AI Validator Import in Client** | \`src/pages/QuestionStudioPage.tsx:52-53\` | **RESOLVED (S7-T03)** | Migrated to API client calls; zero AI imports in \`frontend/pages/QuestionStudioPage.tsx\` |
| **Direct AI Validator Import in Detail** | \`src/pages/QuestionDetailPage.tsx:37\`, \`QuestionImprovePage.tsx:29\` | **RESOLVED (S7-T03)** | Validation routed through API endpoint \`/api/questions/:id/validate\` |
| **Save / Verify Forced Navigation Coupling** | \`src/pages/QuestionStudioPage.tsx:886-945\` | **RESOLVED (S7-T03)** | "Save Draft" persists to \`question_drafts\` with in-place toast; verification is a distinct user action |
| **Backend Service Import in Publishing UI** | \`src/components/publishing/PublishingTable.tsx:35\` | **RESOLVED (S7-T04)** | Migrated to \`frontend/components/publishing/PublishingTable.tsx\` calling \`apiClient\` |
| **Backend Service Type Imports in UI** | \`PlanningPage.tsx\`, \`SettingsPage.tsx\`, \`ContentMasterPage.tsx\` | **RESOLVED (S7-T04/T05)** | Migrated to canonical types in \`shared/types/\` |
| **Monolithic Router Architecture** | \`src/server/routes.ts\` | **RESOLVED (S7-T06/T07)** | Bounded to \`backend/server/routers/routes.ts\` with Firestore authority and neutral AI orchestrator |
| **Monolithic Type Definitions** | \`src/types/index.ts\` | **RESOLVED (S7-T08)** | Canonical types extracted to isomorphic \`shared/\` with backwards-compatible shims |
| **Monolithic API Client** | \`src/lib/api-client.ts\` | **RESOLVED (S7-T05/T08)** | Canonically located at \`frontend/lib/api-client.ts\` with typed feature methods |

---

## 28. S7-T03 Recommended Implementation Scope

With this architectural baseline frozen, task **S7-T03** will execute the first vertical feature slice:
1. **Target Feature**: Question Generation (Stage 01).
2. **Frontend Scope**:
   - Refactor \`QuestionStudioPage\` to remove direct \`CandidateValidator\` and \`MathVerificationResult\` imports.
   - Implement the **Save vs. Verify** decoupled contract: "Save Draft" persists to \`question_drafts\` with an in-place success toast and **does not navigate** to verification.
   - Add explicit "Submit for Verification" action.
3. **Backend Scope**:
   - Expose candidate validation via server route \`POST /api/questions/validate-candidate\`.
   - Ensure \`saveDraft\` endpoint remains fast and purely persistence-focused.
4. **Verification**: Full typecheck (\`npm run lint\`), production build (\`npm run build\`), and targeted regression testing.
