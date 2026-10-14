# BP-CMS — Antigravity Engineering & Architecture Rules

## 0. Prime Directive: Real Working Code & Runtime Application First

1. **Real Working Code is Primary**:
   - Building and delivering real, functioning application features, components, services, and modules is always the top priority.
   - The primary goal is a working, reliable, real-time application that users can actually run and operate.
2. **Build & Runtime Verification Mandatory**:
   - Always verify that the code, feature, or module compiles cleanly without errors (`npm run build`) and passes type checks (`npm run lint`).
   - Never consider a feature completed based on abstract specifications alone; real code must exist, compile, and function.
3. **Documentation is Secondary**:
   - Extensive markdown documentation or reports are secondary to working code.
   - Do not spend excessive effort generating verbose documentation at the expense of implementing and verifying real code.

---

## 1. Source-of-Truth Authority Hierarchy

When specifications, codebase patterns, or documentation conflict, Antigravity MUST resolve conflicts using the following strict hierarchy:

1. **Verified Working Production Code and Automated Tests** — Establish actual runtime behavior and current operational reality.
2. **Current Authoritative Architecture Documents and Active Architecture Decisions** — Define intended system architecture, structural rules, domain models, and invariants:
   - Architecture Specifications (`docs/architecture/04-*` through `26-*`)
   - Canonical 15-Step Workflow (`docs/architecture/07-CANONICAL-15-STEP-WORKFLOW.md`)
   - Cloud Firestore Datastore Architecture (`docs/architecture/12-DATABASE-ARCHITECTURE.md`)
   - Two-Tier Taxonomy Architecture (`docs/architecture/25-TWO-TIER-TAXONOMY-ARCHITECTURE.md`)
   - Collision-Resistant UUID Canonical IDs (`docs/architecture/26-COLLISION-RESISTANT-UUID-CANONICAL-ID-ARCHITECTURE.md`)
   - Active Architecture Decision Log (`docs/architecture/DECISION-LOG.md`)
3. **Current Feature, API, Page, and Operational Contracts** — Define behavior within their respective scopes and must remain strictly consistent with the architecture:
   - Feature Contracts (`docs/features/FC-*`, `docs/features/FEATURE-CONTRACT-INDEX.md`)
   - API Contracts (`docs/architecture/15-API-CONTRACT.md`, `docs/api/`)
   - Page & Route Contracts (`docs/architecture/11-PAGE-ROUTE-CONTRACT.md`, `docs/pages/`)
   - Operational Runbooks & Environment Contracts (`docs/operations/ENVIRONMENT-CONTRACT.md`, `docs/operations/GIT-SYNC-PROTOCOL.md`, `docs/operations/LOCAL-ENVIRONMENT-SETUP.md`)
4. **Historical Sprint Records** — Provide provenance, implementation evidence, and audit logs; they must not override current authoritative documents:
   - Sprint 7 Architecture Baseline (`docs/sprints/sprint-07/S7-ARCHITECTURE-BASELINE.md`): Preserved as an immutable historical structural audit and implementation baseline, but does not outrank current architecture contracts.
   - Historical Sprint Archives (`docs/sprints/sprint-01/` through `docs/sprints/sprint-07/`, past sprint reports, historical spikes).

### Conflict Resolution Axiom: Observed Runtime Behavior vs. Intended Architecture
When observed runtime behavior or codebase patterns conflict with intended architecture:
1. **Document the Discrepancy**: Explicitly identify and record the conflict and its scope.
2. **Preserve Verified Facts**: Do not invent false claims about runtime behavior.
3. **Follow the Approved Current Architecture**: Implement fixes and align code with the authoritative architecture and contracts rather than silently treating an implementation defect, legacy relic, or unintentional bug as the desired design.

> [!CRITICAL]
> **Historical documents must NEVER override current architecture.** Never revive an obsolete design (e.g., Google Sheets persistence, Category taxonomy, numeric sequence allocation counters) merely because an older sprint document, comment, test fixture, or filename still mentions it.

---

## 2. Stale Architecture Rule

When stale Google Sheets, Category, sequence, or other obsolete architecture references are discovered:
- **Do NOT revive that architecture.**
- **Identify it as legacy.**
- **Follow the current authoritative architecture.**
- **Update the stale reference when it is inside the scope of the task.**

---

## 3. Cloud Firestore Authority

**Cloud Firestore is the sole authoritative transactional datastore for BP-CMS.**

1. **Transactional Authority**: All runtime application entities (questions, question drafts, topics, subtopics, scripts, videos, thumbnails, publishing records, users, audit logs) must be persisted through the backend persistence layer into Cloud Firestore.
2. **Separation of Concerns**:
   - **Repositories Own Persistence Mechanics**: Reading/writing Firestore documents, executing queries, and handling atomic transactions/batches. Repositories MUST NOT make business workflow decisions.
   - **Domain Services Own Business Rules**: Invariant validation, role authorization, and state transitions reside strictly in backend/domain services.
3. **Frontend Isolation**: The frontend must NEVER directly access Firestore. No direct Firestore SDK initialization, queries, or listeners in client-side code.
4. **Firebase Admin Server-Side Only**: Firebase Admin SDK (`firebase-admin`) must remain strictly server-side.
5. **Credentials Security**: The server uses explicit Firebase Admin credentials (`GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_PRIVATE_KEY`) or approved ADC fallback. Credentials and service account keys must never be exposed to the client or committed to git.

---

## 4. Google Sheets Decommissioning Rule

**Google Sheets is NOT the transactional database and MUST NOT be used as runtime application state.**

1. **Zero Runtime Persistence**: Do NOT read or write runtime entities from Google Sheets.
2. **Zero New Sheets Infrastructure**: Do NOT introduce new Sheets repositories, Sheets persistence adapters, Sheets runtime synchronization, or spreadsheet-based transactional concurrency.
3. **Schemas Are Not Authoritative**: Do NOT treat Sheets schemas or tab definitions as authoritative application data models.
4. **Approved Secondary Use Only**: Google Sheets may only be used for an explicitly approved secondary purpose such as export/reporting/analytics, if such a purpose exists in the current architecture. It must NEVER participate in the transactional data path.
5. **No Active Instructions**: Any legacy wording or documentation instructing Antigravity to treat Google Sheets as a database is obsolete and overridden by this rule.

---

## 5. Canonical Two-Tier Taxonomy Architecture

The authoritative taxonomy is strictly two-tier:

$$\text{\textbf{Topic}} \longrightarrow \text{\textbf{Subtopic}}$$

1. **Topic is Top-Level**: Autonomous root taxonomy entity (`top_<uuid>` or legacy `TOP-*`) with no parent category.
2. **Subtopic Belongs to Topic**: Child entity (`sub_<uuid>` or legacy `SUB-*`) referencing its parent via mandatory `topicId`.
3. **Category is Obsolete**: The legacy `Category` concept is permanently obsolete and must NOT be reintroduced into:
   - Runtime entities
   - Firestore collections
   - APIs
   - UI (forms, matrices, filters, breadcrumbs, search)
   - New schemas
   - Seed data
   - Documentation
   - New feature logic

---

## 6. Entity ID Architecture (UUID-Based)

The canonical entity ID strategy is distributed, collision-resistant UUID-based IDs generated by `shared/lib/id.service.ts` (with `src/lib/id.service.ts` re-export shim):

$$\text{Format: } \langle\text{prefix}\rangle\_\langle\text{uuid\_v4}\rangle \quad (\text{e.g., } \texttt{qst\_...}, \texttt{vid\_...}, \texttt{scr\_...}, \texttt{thm\_...}, \texttt{top\_...}, \texttt{sub\_...})$$

1. **Stateless ID Generation**: IDs are generated locally and statelessly via `generate*Id()` methods without database round-trips or coordination.
2. **Prohibited Sequence Infrastructure**: Do NOT reintroduce:
   - Database-backed sequence allocation (`sequences` Firestore collection)
   - Sequence counters or numeric counters
   - Sequence repair systems or forward-only guard services
   - Sequence administration UI or sync tools
   - `allocate*Id()` compatibility infrastructure
3. **Historical IDs**: Historical identifiers (e.g., `QST-001`, `TOP-101`) may only be preserved where required for backward compatibility or audit logs.

---

## 7. Frontend / Backend Boundary

The codebase enforces strict unidirectional dependency flow:

$$\text{\textbf{Frontend}} \longrightarrow \text{\textbf{API Client}} \longrightarrow \text{\textbf{API Gateway / Backend}} \longrightarrow \text{\textbf{Database / AI / Workflow / Integrations}}$$

### Frontend MUST NOT Directly Import or Access:
- ❌ Cloud Firestore repositories (`database/firestore/repositories/*`; historical `src/lib/repositories/*` decommissioned)
- ❌ Firestore adapters or Firestore SDK instances (`database/firestore/adapter/*`; historical `src/lib/firebase/*` decommissioned)
- ❌ Firebase Admin SDK (`firebase-admin` - server-side only)
- ❌ Backend application/domain services (`backend/features/*/services/*`, `backend/infrastructure/services/*`; historical `src/lib/services/*` decommissioned)
- ❌ Backend algorithmic validation engines (`backend/ai/validators/*`; historical `src/lib/validation/*` decommissioned, `CandidateValidator`)
- ❌ Server HTTP routes or Express dispatchers (`backend/server/*`; historical `src/server/*` decommissioned)
- ❌ Gemini provider SDKs (`@google/genai`) or AI provider implementations (`backend/ai/providers/*`)
- ❌ Server-side AI validators (`backend/ai/validators/*`)
- ❌ Database initialization, migration, seed, recovery, or backup infrastructure
- ❌ Server secrets or `process.env` in client-side code

### Backend MUST NOT Import:
- ❌ React presentation code (components, pages, JSX, hooks, client contexts)

### Shared Contracts:
- Modules in `shared/` must be pure TypeScript (interfaces, DTOs, enums, pure utilities) free of React, Express, Firebase Admin, or server secrets.

### Test Isolation:
- Production code must NEVER import from `tests/`.

---

## 8. API Rules

1. **Typed API Client Functions**: Frontend communication with the server must go through typed API client functions (e.g., `apiClient.saveQuestionDraft(payload)`). Do not encourage ad-hoc direct `fetch()` calls when a feature API client should exist.
2. **Route Responsibilities**: API routes should:
   - Authenticate and authorize requests (via middleware).
   - Validate incoming payloads using Zod schemas.
   - Delegate immediately to backend domain services.
   - Serialize standardized responses (`ApiResponseEnvelope<T>`).
3. **Zero Inline Business Logic**: Do NOT place business calculations, Firestore queries, workflow decisions, or AI orchestration directly into route handlers.

---

## 9. AI Boundary (Human-in-the-Loop AP-009)

1. **Server-Side Only**: Gemini LLM and privileged AI capabilities are strictly server-side. The frontend must not directly call Gemini or import provider implementations.
2. **Advisory Role**: AI is strictly advisory:
   - AI generates candidates, suggests explanations, drafts audience scripts, and proposes metadata.
   - AI must NEVER silently approve business workflow transitions.
3. **Human Review Mandatory**: Human-in-the-loop review and approval by an authenticated user is mandatory for all publication stages.
4. **Token & Cost Observability**: Token throttling, prompts, and credentials remain governed on the server.

---

## 10. Workflow Authority and GAR-02 Rule

1. **Canonical 15-Step Workflow**: Preserve the sequential business stages (01 Question Generation through 15 Social Performance Analytics).
2. **Backend Authoritative**: The backend workflow engine (`workflow-engine.service.ts`) is authoritative for:
   - State machine transitions
   - Role capability checks
   - Validation gates
   - Anti-self-approval enforcement
3. **Anti-Self-Approval (GAR-02 Rule)**: The author of an artifact cannot approve their own work:
   $$\text{\texttt{authorId}} \neq \text{\texttt{approverId}}$$
4. **Frontend Presentation Only**: The frontend presents workflow state and allowed actions; it cannot bypass transition gates.
5. **Immutable Audit Trail**: Every stage progression, rejection, or edit must generate an audit log record.

---

## 11. Save vs. Verify Operational Contract

This distinction is an explicit, mandatory architectural rule:

$$\text{\textbf{SAVE DRAFT}} \neq \text{\textbf{VERIFY}}$$

### SAVE DRAFT:
- Persists user-entered draft data to Firestore (`question_drafts` collection).
- Performs only minimal required checks (field presence, basic shape).
- Remains in the editing workflow on the current page.
- Shows explicit save success/failure feedback (e.g., in-place toast).
- Does NOT automatically navigate to verification.
- Does NOT silently execute Stage 02 verification.
- Clears dirty state and retains the draft ID.

### SUBMIT FOR VERIFICATION:
- Is an explicit, deliberate user action.
- Requires a saved draft.
- Initiates the Stage 01 $\rightarrow$ Stage 02 workflow transition.
- Invokes authoritative verification rules on the dedicated verification workspace.

> [!WARNING]
> Never couple successful draft persistence to automatic verification in a way that makes a valid saved draft appear to have failed.

---

## 12. Vertical Feature-Slice Architecture (Sprint 7)

Sprint 7 transitions the codebase to a vertical feature-slice architecture to make each capability independently understandable, changeable, and testable:

```
features/<feature-name>/
├── frontend/                     # UI components, pages, local hooks
├── backend/                      # Route handlers, use cases, domain services
├── shared/                       # Feature DTOs, contracts, interfaces
└── tests/                        # Feature-focused unit & integration tests
```

1. **Central Infrastructure Remains Centralized**: Foundational infrastructure stays centralized:
   - Database connection & Admin SDK (`backend/infrastructure/database/`)
   - Authentication middleware (`backend/infrastructure/auth/`)
   - Canonical ID generator (`shared/lib/id.service.ts`)
   - Design system primitives (`frontend/shared/design-system/`)
2. **Smallest Relevant Inspection Scope**: When working on a feature, inspect only the relevant feature slice plus legitimate shared/infrastructure dependencies.
3. **Zero Cross-Feature Leakage**: Do not perform broad repository scanning or unrelated cross-feature modifications.

---

## 13. Change-Scope Discipline

Every implementation task must maintain strict change-scope discipline:
- **Inspect before modifying**: Understand baseline contracts before making edits.
- **Implement the smallest correct change**: Satisfy the task requirements with minimal surface area.
- **Do not combine unrelated refactors**: Keep tasks focused on their explicit objective.
- **Do not perform big-bang migrations**: Restructure incrementally slice-by-slice.
- **Do not redesign unrelated UI**: Preserve visual layout unless explicitly instructed.
- **Do not alter unrelated workflow stages**: Leave unaffected stages untouched.
- **Do not create unnecessary compatibility layers for obsolete architecture**: Delete dead patterns cleanly rather than maintaining legacy shims.

---

## 14. Database Safety (Zero Destructive Operations)

**Destructive operations against the real Firestore environment are strictly prohibited during normal development and refactoring.**

Never reset, wipe, or purge:
- `users`
- `topics` / `subtopics` (taxonomy)
- `questions` / `question_drafts`
- `audit_logs`
- Workflow data
- Production collections

merely to make testing easier.

Before running tests that mutate state:
- Ensure they execute against synthetic/mock data, in-memory fixtures, or isolated test records.
- Never trigger production reset/seed scripts unless explicitly instructed by the user with documented intent.

---

## 15. Risk-Based Engineering Execution Cycle & Verification Policy

Every task must follow a credit-efficient, risk-proportional engineering workflow:

$$\text{Inspect} \longrightarrow \text{Plan narrowly} \longrightarrow \text{Implement} \longrightarrow \text{Pre-Test Decision} \longrightarrow \text{Targeted Verification} \longrightarrow \text{Commit} \longrightarrow \text{Push} \longrightarrow \text{Confirm}$$

### 15.1 Mandatory Pre-Test Decision Rule
Before executing any verification commands, Antigravity MUST formulate a brief, explicit **Pre-Test Decision** recorded in the response:
1. **Changed Scope Classification**: Identify which risk tier applies (Documentation-only, Isolated code, Shared contracts/dependencies, Runtime/workflow/RBAC/persistence, or Full suite).
2. **Selected Verification Commands**: List the specific command(s) selected.
3. **Selection Rationale**: State why each command is necessary and why omitted commands are safely bypassed.
4. **No Redundant Execution**: Do NOT execute unrelated checks or repeatedly rerun commands that have already passed on the same unchanged commit and environment.

### 15.2 Risk-Based Verification Tiers (Default Policy)
Antigravity must select verification actions strictly proportional to the changed files, dependencies, and regression risk:

| Verification Tier | Scope & Trigger Criteria | Mandatory Verification Actions | Safely Bypassed Actions |
| :--- | :--- | :--- | :--- |
| **Tier 1: Documentation-Only** | Markdown (`.md`), documentation specs, ADRs, comments, sprint logs, diagrams. (No executable code, config, or generated artifacts changed). | 1. Review diff (`git diff`)<br>2. Run `git diff --check`<br>*(Exception: Run `npm run test:architecture` only if tracked file counts or inventory manifests in `docs/` are modified)* | **SKIP**: `npm run build`, `npm run lint` (`tsc --noEmit`), and all runtime/integration test suites. |
| **Tier 2: Isolated Code Changes** | Individual UI presentation component, styling, local hook, or leaf utility without shared signature alterations. | 1. Targeted unit/slice test for the changed module<br>2. Targeted static check if types were touched | **SKIP**: Full application production build, full regression suites, unrelated feature tests. |
| **Tier 3: Shared Contracts, Types & APIs** | `shared/` contracts, `src/types/`, `frontend/api/`, package dependencies (`package.json`), or bundler configuration. | 1. `npm run lint` (static typecheck across all consumers)<br>2. Relevant contract tests (e.g., `fc-005-shared-contract.test.ts` or `test:architecture`)<br>3. `npm run build` (when compilation, packaging, or bundling could be affected) | **SKIP**: Unrelated feature regression suites or live browser automation. |
| **Tier 4: Runtime, Workflow, RBAC & Persistence** | Backend route dispatchers, domain services, workflow engine, Firestore repositories, auth/session middleware, security evaluators, or business invariants. | 1. Relevant integration/regression tests (e.g., `test:workflow`, `test:rbac`, `test:auth`, `test:db-api`, `test:question-generation`, or `test:s7-t19`)<br>2. `npm run lint` (typecheck)<br>3. `npm run build`<br>4. Add new targeted integration/E2E test if behavior is newly introduced | **SKIP**: Unrelated feature tests. |
| **Tier 5: Full Suite / Release Gates** | Sprint release gates, broad cross-cutting refactoring, explicit user instruction, or ambiguous systemic test failures. | Full suite: `npm run test:architecture`, `npm run lint`, `npm run build`, and comprehensive regression test suites. | None. |

### 15.3 Single Execution & Result Reuse Invariant
- Execute each selected check **exactly once**.
- Valid check results from the current unchanged commit and environment are reusable across subsequent reasoning steps in the same task.
- Never rerun identical long-running commands (e.g., `npm run build`, `npm run lint`) unless relevant files have changed or a specific failure requires diagnostic re-execution.

### 15.4 Preserved Git Commit, Push & Verification Protocol
Every task modifying tracked files must conclude with strict source-control hygiene:
1. **Targeted Stage**: Stage only files within the task scope (`git add <files>`). Never use `git add .` indiscriminately.
2. **Conventional Commit**: Commit with a concise, descriptive conventional message (e.g., `docs(...)`, `feat(...)`, `fix(...)`).
3. **Direct Push**: Push directly to `origin/main` (`git push origin main`).
4. **Final Verification**:
   - Confirm `HEAD == origin/main`.
   - Confirm clean working tree (`git status` shows nothing to commit).
   - Report the actual commit SHA to the user.
