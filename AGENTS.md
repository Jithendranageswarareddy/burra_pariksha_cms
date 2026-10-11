# BP-CMS — Antigravity Engineering & Architecture Rules

## 0. Prime Directive

Build and preserve a real, working Burra Pariksha Content Management System (BP-CMS).

Every implementation must be:

1. Functionally correct.
2. Consistent with the current authoritative architecture.
3. Verifiable by tests, lint/type checks, build, and runtime probes where applicable.
4. Incremental and reversible.
5. Committed and pushed to `origin/main` only after verification.

Do not declare work complete from documentation alone.

---

## 1. Source-of-Truth Hierarchy

When information conflicts, resolve it in this order:

1. **Working production code and tests** — operational reality.
2. **Sprint 7 Architecture Baseline** — authoritative structural architecture:
   `docs/sprints/sprint-07/S7-ARCHITECTURE-BASELINE.md`
3. **Active architecture ADRs** — especially:
   - `docs/architecture/25-TWO-TIER-TAXONOMY-ARCHITECTURE.md`
   - `docs/architecture/26-COLLISION-RESISTANT-UUID-CANONICAL-ID-ARCHITECTURE.md`
4. **Feature/domain contracts** under `docs/features/`.
5. Historical sprint reports and exploratory documents.

Never revive an obsolete design merely because an older document, comment, test, or filename still contains it. When stale documentation is discovered, update or clearly deprecate it rather than treating it as current architecture.

---

## 2. Canonical BP-CMS Business Architecture

BP-CMS follows the canonical 15-step production workflow:

1. Question Generation
2. Question Verification
3. Audience Script
4. Teleprompter & Filming
5. Raw Video
6. Editing Bay
7. Final QC
8. Thumbnail
9. Social Review
10. Publishing Setup
11. Published
12. Platform Sync
13. Analytics
14. Performance Review
15. Intelligence Loop

Preserve this business lifecycle unless an explicit architecture/product decision changes it.

### Canonical taxonomy

The active taxonomy is:

**Topic → Subtopic**

There is no active runtime Category entity. Do not reintroduce Category into new code, schemas, APIs, UI, seed data, or documentation.

### Canonical entity IDs

Entity IDs use the centralized UUID-based ID strategy.

Do not create, restore, or extend database-backed sequence/counter infrastructure for new entities. Do not add sequence administration, sequence repair, or `allocate*Id` compatibility mechanisms.

Historical identifiers may be preserved only when required for compatibility or auditability.

---

## 3. Canonical 10-Layer Architecture

BP-CMS has these logical layers:

1. **FRONTEND** — React presentation, interaction, client state, UX.
2. **API** — HTTP REST gateway, request validation, serialization.
3. **BACKEND** — application services, use cases, domain/business rules.
4. **WORKFLOW** — canonical 15-step state machine, transition gates, GAR-02.
5. **AI** — Gemini providers, prompts, structured parsing, AI validators/orchestration.
6. **DATABASE** — Firestore persistence, repositories, schemas, transactions/batches.
7. **INTEGRATIONS** — Google Drive, GCS where used, YouTube and other external adapters.
8. **SHARED** — genuinely isomorphic types, DTOs, enums, and pure utilities.
9. **CONFIGURATION** — runtime/build/business configuration and safe public UI configuration.
10. **TEST** — unit, integration, e2e, foundation, regression, security, fixtures.

These are logical boundaries even while the repository is being migrated toward the target vertical-slice structure.

---

## 4. Dependency Direction — Mandatory

The allowed high-level flow is:

`Frontend → API → Backend → Workflow / AI / Integrations / Database`

Shared contracts may be consumed by both client and server.

### Frontend MUST NOT directly import

- Firestore repositories or database adapters.
- Firebase Admin SDK.
- Backend application/domain services.
- Backend validation engines.
- Gemini SDK/provider implementations.
- Server-only AI validators.
- Database initialization, migration, seed, recovery, or backup machinery.
- Server secrets or `process.env`.

The browser communicates with the server through the API client.

### Backend MUST NOT import

- React components.
- JSX.
- React hooks.
- Frontend presentation modules or client-only contexts.

### Shared MUST remain pure

Shared modules must not depend on:

- React.
- Express request/response types.
- Firebase Admin.
- Firestore adapters.
- Gemini/provider SDKs.
- Server secrets.
- Feature-specific server implementation details.

### Production code MUST NOT import from

`tests/`

Tests may import production code; production code must never depend on tests or fixtures.

---

## 5. Firestore Is the Authoritative Database

**Cloud Firestore is the sole authoritative transactional datastore for BP-CMS.**

Use the server-side persistence path:

`React → Express API → Backend/Domain Services → Firestore Repositories → Firebase Admin → Cloud Firestore`

Repositories own persistence mechanics only. Business rules, validation, authorization, and workflow decisions belong above the repository layer.

### Google Sheets rule

**Google Sheets is NOT a transactional database and MUST NOT be used as runtime application state.**

Do not:

- Read/write runtime entities from Google Sheets.
- Add new Google Sheets persistence adapters.
- Treat spreadsheet schemas as the source of truth for application data.
- Add Google Sheets IDs, synchronization logic, or concurrency rules to the transactional data path.

Google Sheets may be used only for an explicitly approved secondary purpose such as export/reporting/analytics workflows, never as the authoritative runtime datastore.

Any stale "Google Sheets database" wording is legacy and must not guide implementation.

---

## 6. Current Persistence and Security Rules

The Firebase Admin path is server-side only.

The application uses explicit Firebase Admin credentials:

- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`

with the approved ADC fallback where implemented.

`firebase-applet-config.json` is metadata/configuration only and must not contain secrets.

Never commit:

- service-account JSON files,
- private keys,
- API keys,
- OAuth refresh tokens,
- session secrets,
- passwords,
- `.env` files containing credentials.

---

## 7. API and Frontend Contract

All client/server communication must use typed API contracts.

Frontend components should call feature-oriented API client methods, not ad-hoc raw `fetch()` calls.

API routes must:

1. Authenticate and authorize.
2. Validate request payloads.
3. Delegate to backend/use-case services.
4. Return the standard response contract and appropriate HTTP status.

Do not put business calculations, Firestore queries, workflow decisions, or AI orchestration directly inside route handlers.

---

## 8. AI Boundary

AI is a server-side capability.

The frontend must not call Gemini directly and must not contain privileged Gemini provider implementations or server-side AI validators.

AI is advisory:

- AI may generate candidates, explanations, scripts, tags, suggestions, and analyses.
- AI must not silently approve workflow transitions.
- Human review remains mandatory for approval/publication gates.

Provider/API credentials remain server-side.

---

## 9. Workflow Authority and GAR-02

The backend/workflow layer is authoritative for business state transitions.

The workflow engine owns transition rules for the canonical 15-step lifecycle.

Enforce:

`authorId !== reviewerId`

for approval operations where GAR-02 applies.

The frontend may display status and available actions, but it cannot bypass workflow gates, authorization, or transition validation.

Every meaningful workflow progression/rejection must preserve the required audit trail.

---

## 10. Critical Save vs. Verify Contract

This distinction is mandatory:

**SAVE DRAFT ≠ VERIFY**

### SAVE DRAFT

- Persists user-entered draft data to Firestore.
- Performs only minimal required presence/shape checks.
- Does not silently execute strict verification.
- Does not automatically navigate to the verification page.
- Must provide an explicit success/failure result.
- Retains the draft ID and leaves the user in the editing workflow.

### SUBMIT FOR VERIFICATION

- Is an explicit user action.
- Requires a saved draft.
- Requests the Stage 01 → Stage 02 transition.
- Runs authoritative verification on the verification workflow/page.

Never couple successful draft persistence to automatic verification in a way that makes a saved draft appear to have failed.

---

## 11. Feature Isolation — Sprint 7

Sprint 7 uses a vertical feature-slice architecture.

Target logical structure:

`features/<feature-name>/`
- `frontend/`
- `backend/`
- `shared/`
- `tests/`

Central infrastructure remains centralized, including Firestore connection/adapters, authentication middleware, shared design-system primitives, and the canonical ID generator.

### Feature-isolation rule

A coding agent working on one feature should inspect only the required feature slice plus the small set of shared/infrastructure contracts it legitimately depends on.

Do not make unrelated feature files part of a change merely for convenience.

Question Generation (Stage 01) is the first migration slice.

---

## 12. Question Generation Rules

For Question Generation:

- Topic and Subtopic options must come from the authoritative application data/API, not duplicated hardcoded business lists.
- AI generation must use the backend AI boundary.
- Candidate validation must be exposed through a server API rather than importing backend validation engines into the browser.
- Draft persistence must remain fast and persistence-focused.
- Saving a draft must not automatically trigger Stage 02 verification.
- "Submit for Verification" must be explicit.
- Do not modify unrelated workflow stages while isolating Stage 01.

Stable technical enums may be shared when they are genuinely isomorphic; business data that lives in Firestore must not be duplicated in the UI as a second source of truth.

---

## 13. Large Files and Monoliths

Large files must be decomposed incrementally.

Known high-risk areas include:

- `src/server/routes.ts`
- `src/types/index.ts`
- `src/lib/api-client.ts`
- oversized feature pages and services identified in the Sprint 7 baseline.

Do not perform a big-bang rewrite.

Decompose one feature or responsibility at a time while preserving behavior.

Never combine a migration/refactor with an unrelated visual redesign or new business behavior unless the task explicitly requires it.

---

## 14. No Destructive Database Testing

Never run destructive reset/seed/cleanup operations against the genuine live Firestore dataset merely to make tests easier.

Before executing tests that can mutate persistent state, determine whether they target:

- unit/in-memory data,
- isolated test data,
- a controlled integration environment,
- or real production data.

Do not wipe users, taxonomy, questions, audit history, or other live collections as part of refactoring.

---

## 15. Required Engineering Execution Cycle

For every implementation task:

**Inspect → Plan narrowly → Implement → Test → Lint/typecheck → Build → Runtime probe when needed → Commit → Push → Verify**

Minimum quality gates:

- `npm run lint`
- `npm run build`
- targeted tests for the changed feature
- broader regression tests when the change crosses boundaries

After commit:

- push to `origin/main`
- verify the remote `main` points to the new commit
- ensure the working tree is clean
- report the actual commit SHA

Do not claim completion when a gate failed or when the GitHub state is unverified.

---

## 16. Documentation Rules

Documentation must describe the actual current architecture.

When architecture changes:

1. Update the authoritative architecture document when required.
2. Update stale comments/configuration references discovered in the touched scope.
3. Clearly distinguish current architecture from historical migration records.

Do not preserve obsolete Google Sheets, Category, or sequence architecture merely because old documentation contains it.

Do not invent a new source of truth when an authoritative contract already exists.

---

## 17. Change-Scope Discipline

Every task must have an explicit scope.

For a focused task:

- inspect only the relevant feature and its direct dependencies first;
- change only the files necessary to satisfy the task;
- avoid opportunistic cleanup in unrelated modules;
- do not alter unrelated workflow stages, data models, integrations, or UI;
- preserve existing behavior unless the task explicitly changes that behavior.

When a dependency must be changed, make the smallest architectural change that restores the boundary.

---

## 18. Migration Rules

All Sprint 7 migrations follow these rules:

1. One feature slice at a time.
2. Preserve runtime invariants.
3. No big-bang repository rewrite.
4. No unrelated redesign during migration.
5. No destructive production database operations.
6. No secrets committed.
7. Keep `main` authoritative and synchronized.
8. Make architectural boundaries statically testable wherever practical.
9. Remove stale dependencies rather than adding compatibility layers for obsolete architecture.
10. Every migration step must leave the repository buildable and testable.

---

## 19. Legacy Architecture That MUST NOT Be Reintroduced

The following are explicitly obsolete unless a new approved architecture decision says otherwise:

- Google Sheets as runtime/transactional database.
- Category as an active taxonomy layer.
- Database-backed sequence/counter infrastructure for entity IDs.
- Direct browser access to Firestore.
- Direct browser access to Gemini/provider APIs.
- Frontend imports of backend services or backend validation engines.
- Save-Draft → automatic-Verify coupling.
- Feature-specific business data duplicated as hardcoded UI state when an authoritative API/data source exists.
- Large cross-feature edits performed merely to make one feature work.

---

## 20. Primary Instruction for Antigravity

Before changing code, read:

1. `AGENTS.md`
2. `docs/sprints/sprint-07/S7-ARCHITECTURE-BASELINE.md`
3. The relevant feature/domain contract
4. The relevant current implementation and tests

Then implement the smallest correct change that moves the repository toward the frozen architecture.

When a current implementation conflicts with these rules, do not silently invent a third architecture. Surface the conflict, follow the current authoritative code/architecture hierarchy, and make the minimum change required by the active task.
