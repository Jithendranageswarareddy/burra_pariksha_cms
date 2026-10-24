# Project Task Summaries — File 1

Chronological record of actual task executions in accordance with [AGENTS.md](../../AGENTS.md) Section 6.

*Note on Task Identity Convention:* Entries `[TASK-001]` through `[TASK-003]` reflect historical tracking prior to the adoption of the sprint-task (`SXX-TYY`) identity standard. Starting with the core architecture phase, entries utilize actual sprint-task identities or architecture/planning headers without inventing synthetic IDs.

---

### [TASK-001] 2026-10-24 — Finalize Cleanup Utility Safety and Establish Project Task Tracking

- **Status**: `COMPLETED`
- **Objective**: Harden `scripts/clean-local-data.ts` against arbitrary/unknown collection deletion, enforce allowlist-only purging, verify all datastore isolation safety gates, and establish the project task tracking standard in `AGENTS.md`.
- **Work & Outcome**:
  - Implemented `PURGE_ALLOWLIST_COLLECTIONS` and `classifyCollectionsForCleanup()` in `scripts/clean-local-data.ts`. Unknown collections discovered at runtime are preserved by default and logged rather than deleted.
  - Maintained baseline preservation for `users`, `topics`, `subtopics`, and `question_config`.
  - Maintained safety interlocks: mandatory `--confirm-clean-local` CLI flag, loopback-only Firestore emulator validation (`assertDestructiveScriptSafe`), and emulator reachability check (`assertEmulatorAlive`) prior to Firestore client creation.
  - Added Test 18 to `tests/unit/datastore-isolation-guard.unit.test.ts` verifying allowlist partitioning and unknown-collection preservation.
  - Added Section 6 to `AGENTS.md` governing architecture docs vs sprint docs vs chronological task tracking, the 100-entry rotation protocol, and compact entry format.
- **Changed Files**:
  - `scripts/clean-local-data.ts`
  - `tests/unit/datastore-isolation-guard.unit.test.ts`
  - `AGENTS.md`
  - `docs/project_tracking/project_task_summarie1.md`
- **Verification**:
  - `npx tsx tests/unit/datastore-isolation-guard.unit.test.ts` — `PASS` (18/18 tests passed)
  - `npm run lint` (`tsc --noEmit`) — `PASS` (clean exit 0)
  - `git diff --check` — `PASS` (no whitespace issues)
- **Risks & Next Actions**:
  - `scripts/clean-local-data.ts` is purely a local emulator utility; running it against any production target is blocked by `assertDestructiveScriptSafe()`.
  - Next action: Review diff and await owner authorization before committing or pushing.

---

### [TASK-002] 2026-10-24 — Verify Cleanup Safety and Prepare Data-Cleanup Readiness

- **Status**: `COMPLETED`
- **Objective**: Verify post-push remote sync, re-validate clean-local-data safety invariants and subcollection containment, and document a read-only inventory plan and backup/restore gaps without modifying or connecting to any datastore.
- **Work & Outcome**:
  - Pulled latest `main` from GitHub (`origin/main`), confirmed commit `4033c35` matches intended files, and verified working tree was clean.
  - Inspected `scripts/clean-local-data.ts`: confirmed deletion is restricted strictly to `PURGE_ALLOWLIST_COLLECTIONS`, unknown collections and baseline collections are preserved, and all three gates (`--confirm-clean-local`, `assertDestructiveScriptSafe()`, `assertEmulatorAlive()`) precede Firestore initialization.
  - Confirmed subcollection deletion (`deleteCollectionRecursively`) is strictly scoped within allowlisted document trees and cannot escape to unallowlisted collections.
  - Performed read-only storage inventory across Firestore, Google Sheets, Google Drive, GCS, and local seed data, identifying backup/restore gaps (no automated pre-cleanup snapshot export; risk of cross-store dangling references in Sheets/Drive).
- **Changed Files**:
  - `docs/project_tracking/project_task_summarie1.md`
- **Verification**:
  - `git pull origin main` — `PASS` (already up to date)
  - `git show --stat 4033c35` — `PASS` (exact 4 files confirmed)
  - `npx tsx tests/unit/datastore-isolation-guard.unit.test.ts` — `PASS` (18/18 tests passed, exit 0)
  - `npm run lint` (`tsc --noEmit`) — `PASS` (exit 0)
  - `git diff --check` — `PASS` (clean exit 0)
- **Risks & Next Actions**:
  - Cloud storage and Google Sheets lack automated atomic cross-store sync; cleanup on Firestore must be preceded by an offline export/snapshot if production data is ever involved.
  - Next action: Await owner instructions before executing any local emulator cleanup.

---

### [TASK-003] 2026-10-24 — Validate Backup and Restore Readiness

- **Status**: `COMPLETED`
- **Objective**: Trace and validate recovery paths across Cloud Firestore, Google Drive, GCS, Google Sheets, and local seed data, identifying automation gaps, retention assumptions, and offline restore testing plans without cloud mutations.
- **Work & Outcome**:
  - Pulled `main`, verified remote sync, and confirmed a clean working tree.
  - Traced Cloud Firestore recovery path: identified named database (`ai-studio-burraparikshacon-f592ca42-39af-4d83-aff2-6870ba939b0e`) and verified absence of in-code automated export/import scripts (relies entirely on manual `gcloud firestore export/import`).
  - Traced Google Drive and GCS recovery paths: Drive relies on 30-day Trash retention without automated pre-deletion snapshots; GCS snapshot bucket (`burra-pariksha-snapshots-2026`) relies on external GCP bucket versioning.
  - Traced Google Sheets: verified native version history exists, but cross-store foreign-key references to Firestore questions lack automated synchronization or rollback tooling.
  - Verified local seed and taxonomy data in `src/lib/data/production-taxonomy.ts`: 100% deterministic, in-repo, and self-healing.
  - Formulated a safe, isolated local emulator export/import recovery test plan without accessing production credentials or live cloud storage.
- **Changed Files**:
  - `docs/project_tracking/project_task_summarie1.md`
- **Verification**:
  - `git pull origin main` — `PASS` (clean, up to date)
  - `npx tsx tests/unit/datastore-isolation-guard.unit.test.ts` — `PASS` (18/18 tests passed, exit 0)
  - `npm run lint` (`tsc --noEmit`) — `PASS` (exit 0)
  - `git diff --check` — `PASS` (clean exit 0)
- **Risks & Next Actions**:
  - Unautomated Cloud Firestore backup/restore is an operational blocker for any future cloud maintenance.
  - Next action: Maintain strict local-only cleanup isolation until automated GCP export/restore manifests are established.

---

### [S19-T01] 2026-10-25 — Enforce Single Submit-for-Verification Transition

- **Status**: `COMPLETED`
- **Objective**: Close the confirmed planning-workspace gap where repeated submit commands could re-enter verification.
- **Work & Outcome**: Added a server-side planning-status guard so only `DRAFT` Learning Units can transition to `SUBMITTED_FOR_VERIFICATION`; missing records still fail with `NotFoundError`, and authorization, OCC, audit append, and Save Draft semantics remain delegated to existing repository/service boundaries. Added sequential and concurrent regressions proving duplicate submissions produce one transition and one audit event. Hardened planning load/save/submit error handling to accept `unknown` failures and always present a safe fallback message instead of silently rendering an empty error; added coverage for Error, structured API, empty-message, and non-Error failures.
- **Changed Files**: `backend/features/planning/services/learning-unit-planning.service.ts`; `frontend/api/api-client.ts`; `frontend/api/index.ts`; `frontend/features/planning/hooks/useLearningUnitPlanning.ts`; `frontend/features/planning/pages/LearningUnitPlanningPage.tsx`; `tests/unit/core-requirements/s11-t03-learning-unit-planning.service.unit.test.ts`; `tests/unit/core-requirements/s19-t01-planning-error-message.unit.test.ts`; `package.json`; `docs/sprints/CORE-REQUIREMENTS-ROADMAP.md`; `docs/project_tracking/project_task_summarie1.md`
- **Verification**: `npm run test:s11-t03` — PASS; `npm run test:s19-t01` — PASS; `npm run test:s11-t04` — PASS (7/7); `npm run test:s16-t01` — PASS on the prior hardening commit; `npm run lint` — PASS; `npm run build` — PASS with existing Zod annotation and bundle-size warnings; `git diff --check` — PASS. `npm test` — BLOCKED/FAIL in pre-existing FC-002 integration setup because Firestore emulator `127.0.0.1:8080` was unavailable (`ECONNREFUSED`), with taxonomy lookup failures; no production target was used.
- **Risks & Next Actions**: Full S19-T01 acceptance still requires evidence for real API/reload fidelity and safe client error states; continue with focused validation before considering the task complete.

---

### [S19-T03] 2026-10-25 — Authenticate Assignment Workbench Routes

- **Status**: `COMPLETED`
- **Objective**: Close the concrete assignment-workbench gap where assignment reads and assignee actions lacked explicit router-level authentication.
- **Work & Outcome**: Added `requireAuth` to assignment listing, unassigned-work, entity lookup, detail, start, block, and complete routes. Existing manager/owner authorization checks remain in place and were not weakened. Added a static regression covering the full protected assignment route family.
- **Changed Files**: `backend/server/routers/routes.ts`; `tests/unit/core-requirements/s19-t03-assignment-route-auth.unit.test.ts`; `package.json`; `docs/sprints/CORE-REQUIREMENTS-ROADMAP.md`; `docs/project_tracking/project_task_summarie1.md`
- **Verification**: `npm run test:s19-t03` — PASS; `npm run test:s13-t05` — PASS (152 mutation declarations); `npm run lint` — PASS; `npm run build` — PASS with existing Zod annotation and bundle-size warnings; `git diff --check` — PASS. `npm test` — BLOCKED/FAIL in existing FC-002 integration setup because Firestore emulator `127.0.0.1:8080` was unavailable (`ECONNREFUSED`); no production target was used.
- **Risks & Next Actions**: S19-T03 still requires sequence/stage-action and browser/API evidence; no assignment data or production service was accessed.

---

### [S19-T03] 2026-10-25 — Scope Assignment Workbench Reads

- **Status**: `COMPLETED`
- **Objective**: Enforce assignment ownership scope for entity reads and manager authorization for unassigned work.
- **Work & Outcome**: Non-manager entity assignment reads now return only records assigned to the authenticated actor; manager/admin actors retain operational visibility. Unassigned-work reads now require manager roles. Existing assignment action ownership and service-side state-machine checks remain unchanged.
- **Changed Files**: `backend/server/routers/routes.ts`; `tests/unit/core-requirements/s19-t03-assignment-route-auth.unit.test.ts`; `docs/project_tracking/project_task_summarie1.md`
- **Verification**: `npm run test:s19-t03` — PASS; `npm run test:s13-t05` — PASS (152 mutation declarations); `npm run lint` — PASS; `npm run build` — PASS with existing Zod annotation and bundle-size warnings; `git diff --check` — PASS. Emulator-backed integration remains blocked by unavailable `127.0.0.1:8080`.
- **Risks & Next Actions**: Sequence and stage-action API/browser evidence remains open for S19-T03; no production assignment data was accessed.

---

### Architecture / Planning — 2026-10-24 — Workflow Reset and Core Architecture Kickoff

- **Status**: `COMPLETED`
- **Objective**: Establish the updated project task tracking standard in `AGENTS.md`, establish the Local-to-Deployment Architecture Principle (Principle 16 / ADR-014), and deliver the authoritative core architecture proposal and reconciliation across all 15 workflow stages and 3 content modes.
- **Work & Outcome**:
  - Updated `AGENTS.md` Section 1 and Section 6: codified the Unified Local-to-Deployment Codebase invariant; established sprint-task identity standard (`SXX-TYY`); established single-task progress updates under the same task ID until completion; retired global `TASK-001` sequence while preserving historical entries for provenance; mandated architecture/planning headers for pre-sprint work.
  - Formalized Principle 16 ("Unified Local-to-Deployment Architecture") in `docs/architecture/04-ARCHITECTURE-PRINCIPLES.md` and registered ADR-014 in `docs/architecture/DECISION-LOG.md`.
  - Authored `docs/architecture/CORE-ARCHITECTURE-PROPOSAL.md` providing authoritative coverage across all 9 required domains: requirements and boundaries across Modes 1–3, application layering, Cloud Firestore and Google Drive authoritative data model, API boundaries / signed session cookies / GAR-02 anti-self-approval and audited admin override / OCC, local dev and test isolation architecture, verified Google AI Studio build (`dist/server.cjs`) vs external console assumptions, ₹0.00 free-tier circuit breakers and observability probes (`/healthz`, `/readyz`), incremental brownfield migration roadmap, and recommended first implementation sprint (Sprint 11).
  - Updated `docs/ENGINEERING-INDEX.md` linking the new core architecture master proposal.
- **Changed Files**:
  - `AGENTS.md`
  - `docs/architecture/04-ARCHITECTURE-PRINCIPLES.md`
  - `docs/architecture/DECISION-LOG.md`
  - `docs/architecture/CORE-ARCHITECTURE-PROPOSAL.md`
  - `docs/ENGINEERING-INDEX.md`
  - `docs/project_tracking/project_task_summarie1.md`
- **Verification**:
  - `git pull origin main` — `PASS` (working tree clean, already up to date)
  - `npm run lint` (`tsc --noEmit`) — `PASS` (clean exit 0)
  - `git diff --check` — `PASS` (clean exit 0, no whitespace or formatting errors)
- **Risks & Next Actions**:
  - Risks: Google AI Studio container memory limits under high build concurrency should be observed during first manual console release.
  - Next action: Proceed to Sprint 11 planning or task execution upon owner instruction.

---

### Architecture / Planning — 2026-10-24 — Core Requirements Audit and Development Planning

- **Status**: `COMPLETED`
- **Objective**: Audit application against `bp_cms_core_requirements1.md`, reconcile architecture decisions (ADR-015), establish requirements-driven development plan across Days 1–30/31–60/61–90, and select the first implementation task.
- **Work & Outcome**:
  - Performed comprehensive requirement-by-requirement audit across all 13 sections of `bp_cms_core_requirements1.md` (Audit matrix: 1 Implemented, 9 Partial, 5 Missing, 1 Aligned).
  - Identified critical gaps: missing Verified Learning Unit (`learning_units` collection), missing 5 presentation formats decoupling (`TEXT`, `VIDEO`, `AUDIO`, `IMAGE`, `ANIMATION`), and naming/order divergence for canonical modes (`WORKED_EXAMPLES` aliased by legacy `EXPLAINED_QUESTIONS_VIDEO`).
  - Adopted ADR-015 in `docs/architecture/DECISION-LOG.md` formalizing canonical mode alignment, backward-compatible runtime alias, learning unit entity, and format decoupling.
  - Reconciled and updated `docs/architecture/CORE-ARCHITECTURE-PROPOSAL.md` incorporating the full audit matrix, architectural decisions, and prioritized requirements-driven development plan.
  - Selected `S11-T01` (Core Requirements Architecture Decision & Schema Contract) as the authoritative first implementation task based on audit evidence.
- **Changed Files**:
  - `docs/BP_CMS_CORE_REQUIREMENTS/bp_cms_core_requirements1.md`
  - `docs/architecture/CORE-ARCHITECTURE-PROPOSAL.md`
  - `docs/architecture/DECISION-LOG.md`
  - `docs/project_tracking/project_task_summarie1.md`
- **Verification**:
  - `git pull origin main` — `PASS` (clean sync)
  - `npm run lint` (`tsc --noEmit`) — `PASS` (clean exit 0)
  - `git diff --check` — `PASS` (clean exit 0)
- **Risks & Next Actions**:
  - Learning Unit introduction must maintain strict backward compatibility with existing standalone question drafts and videos.
  - Next action: Proceed with Sprint 11 Task 01 (`S11-T01`) to implement schema contracts.

---

### [S11-T01] 2026-10-24 — Core Requirements Contracts and Compatibility

- **Status**: `COMPLETED`
- **Objective**: Establish foundational contracts, canonical content modes, presentation formats, audience contexts, skill levels, editorial pillars, LearningUnit schema, and explicit backward compatibility mappings for `EXPLAINED_QUESTIONS_VIDEO` without modifying runtime persistence.
- **Work & Outcome**:
  - Defined canonical enums and metadata in `shared/constants/core-requirements.ts`: `CanonicalContentMode` (Mode 1: `TOPIC_INTRODUCTION`, Mode 2: `WORKED_EXAMPLES`, Mode 3: `QUESTION_CHALLENGE_SHORT`), `PresentationFormat` (`TEXT`, `VIDEO`, `AUDIO`, `IMAGE`, `ANIMATION`), `AudienceContext` (7 contexts from Section 4), `SkillLevel` (`FOUNDATION`, `BEGINNER`, `INTERMEDIATE`, `ADVANCED`), and `EditorialPillar` (Pillars A through F).
  - Implemented bidirectional legacy mode mappings (`resolveCanonicalContentMode`, `toLegacyContentMode`, `isSupportedContentMode`) guaranteeing seamless interop with legacy `EXPLAINED_QUESTIONS_VIDEO`.
  - Updated `shared/registry/content-mode.registry.ts` to transparently resolve `WORKED_EXAMPLES` and `EXPLAINED_QUESTIONS_VIDEO` to the same mode definition.
  - Implemented `shared/types/learning-unit.ts` and Zod validation contracts in `shared/contracts/learning-unit.contract.ts` with strict schema validation.
  - Extended `shared/lib/id.service.ts` with canonical prefix `lnu_` (`generateLearningUnitId`, `isLearningUnitId`).
  - Added non-breaking optional `learningUnitId?: string` to `QuestionDraft`, `Question`, `Video`, and `ProductionContextEntityIds`.
  - Preserved 100% backward compatibility across existing question drafts, videos, and workflow payloads without any database migrations or schema breaks.
- **Changed Files**:
  - `package.json`
  - `shared/constants/core-requirements.ts`
  - `shared/constants/index.ts`
  - `shared/contracts/index.ts`
  - `shared/contracts/learning-unit.contract.ts`
  - `shared/lib/id.service.ts`
  - `shared/registry/content-mode.registry.ts`
  - `shared/types/content.ts`
  - `shared/types/index.ts`
  - `shared/types/learning-unit.ts`
  - `shared/types/production-context.ts`
  - `shared/types/question.ts`
  - `tests/unit/core-requirements/s11-t01-contracts-and-compatibility.unit.test.ts`
  - `docs/project_tracking/project_task_summarie1.md`
- **Verification**:
  - `npm run lint` (`tsc --noEmit`) — `PASS` (clean exit 0, zero type errors)
  - `git diff --check` — `PASS` (clean exit 0, no whitespace or formatting errors)
  - `npm run test:s11-t01` — `PASS` (10/10 assertions passed)
- **Risks & Next Actions**:
  - Persistence for `learning_units` collection will be implemented in subsequent task `S11-T02` with dedicated repository and emulator isolation tests.
  - Next action: Proceed to `S11-T02` (LearningUnit Datastore Repository & Persistence) upon instruction.

---

### [S11-T02] 2026-10-24 — Learning Unit Repository and Persistence

- **Status**: `COMPLETED`
- **Objective**: Implement authoritative Cloud Firestore persistence for `LearningUnit` records through `LearningUnitsRepository`, enforce schema validation, primary key uniqueness, identifier immutability, optimistic concurrency control (OCC), and RBAC authorization while strictly isolating automated tests from production data.
- **Work & Outcome**:
  - Registered `LEARNING_UNITS: 'learning_units'` in `database/firestore/schemas/domain-schemas.ts` and added backend gateway access rule in `database/firestore/rules/firestore.rules`.
  - Added `'learning_units'` to `KNOWN_PURGEABLE_COLLECTIONS` in `scripts/clean-local-data.ts`.
  - Implemented `database/firestore/repositories/learning-units.repository.ts` inheriting from authoritative `BaseRepository<LearningUnit>`:
    - `create()` validates input against `CreateLearningUnitSchema`, guarantees canonical `lnu_<uuid>` format, enforces primary key uniqueness, sets initial version 1, and enforces author attribution.
    - `findById()` retrieves documents with non-existent ID safety and soft-delete filtering.
    - `update()` validates updates against `UpdateLearningUnitSchema`, protects immutable identifiers, enforces OCC version incrementing and throws `ConcurrencyConflictError` (HTTP 409) on stale versions.
    - `query()` / `list()` provides multi-dimensional filtering across taxonomy (topic, subtopic), core dimensions (skill level, audience context, editorial pillar, primary format), and case-insensitive full-text search.
    - Enforced RBAC authorization: Creator/Author roles can create and manage their own units; Admin/Lead roles can manage any unit; unauthorized roles are blocked with `ForbiddenError` (HTTP 403).
  - Added companion const enum-like objects in `shared/constants/core-requirements.ts` for dual type/runtime value usability without breaking existing consumers.
  - Exported repository from `database/firestore/repositories/index.ts`.
  - Created comprehensive 10-test suite in `tests/unit/core-requirements/s11-t02-learning-unit-repository.unit.test.ts`.
- **Changed Files**:
  - `package.json`
  - `database/firestore/schemas/domain-schemas.ts`
  - `database/firestore/rules/firestore.rules`
  - `database/firestore/repositories/index.ts`
  - `database/firestore/repositories/learning-units.repository.ts`
  - `scripts/clean-local-data.ts`
  - `shared/constants/core-requirements.ts`
  - `shared/contracts/learning-unit.contract.ts`
  - `shared/types/learning-unit.ts`
  - `tests/unit/core-requirements/s11-t02-learning-unit-repository.unit.test.ts`
  - `docs/project_tracking/project_task_summarie1.md`
- **Verification**:
  - `npm run test:s11-t02` — `PASS` (10/10 assertions passed)
  - `npm run test:s11-t01` — `PASS` (10/10 regression assertions passed)
  - `npm run lint` (`tsc --noEmit`) — `PASS` (clean exit 0, zero type errors)
  - `git diff --check` — `PASS` (clean exit 0, no whitespace or formatting errors)
- **Risks & Next Actions**:
  - All tests execute strictly under `PERSISTENCE_MODE=IN_MEMORY_TEST_ONLY` with datastore isolation guards preventing live database contact.
  - Next action: Proceed to `S11-T03` (Learning Unit Planning API & Service Integration) upon instruction.

---

### Architecture / Planning — 2026-10-24 — Architecture and Delivery Plan Reconciliation

- **Status**: `COMPLETED`
- **Objective**: Audit the GitHub repository against the core requirements, reconcile architecture and ADR decisions, and establish one evidence-backed remaining-work roadmap without implementing application features.
- **Work & Outcome**: Added a current brownfield architecture audit and target architecture, reconciled the stale S11 task mapping against tracked S11-T01/S11-T02 work, expanded ADR-015 with alternatives and migration consequences, and separated architecture, sprint planning, and execution tracking responsibilities. Pre-existing `package.json` and untracked integration-test changes were preserved and excluded.
- **Changed Files**: `docs/architecture/CORE-ARCHITECTURE-RECONCILIATION.md`; `docs/architecture/DECISION-LOG.md`; `docs/architecture/CORE-ARCHITECTURE-PROPOSAL.md`; `docs/sprints/CORE-REQUIREMENTS-ROADMAP.md`; `docs/ENGINEERING-INDEX.md`; `docs/project_tracking/project_task_summarie1.md`
- **Verification**: `git fetch origin` — `PASS` (`HEAD` and `origin/main` both `116476b`); `git diff --cached --check` — `PASS`; staged-path review — `PASS` (six intended documentation files only). Lint, builds, and application tests were intentionally not run because this was documentation-only. No production service, live Firestore, external content, or live AI provider accessed.
- **Risks & Next Actions**: `S11-T03` Learning Unit Planning API and service integration is the recommended next implementation task. Current S11-T02 emulator round-trip and Google AI Studio publication parity remain `UNVERIFIED`; run only in explicitly isolated environments.

---

### [S11-T03] 2026-10-24 — Learning Unit Planning API and Service Integration

- **Status**: `COMPLETED`
- **Objective**: Add the roadmap-defined LearningUnit planning service, request contracts, protected API routes, and frontend API wrapper while preserving backend ownership of authorization, validation, audit, and concurrency boundaries.
- **Work & Outcome**: Validated the roadmap selection against the repository and confirmed S11-T01 and S11-T02 prerequisites. Added repository-backed create/read/update planning operations, explicit `SAVE_DRAFT` and `SUBMIT_FOR_VERIFICATION` handling, planning-only status, OCC expected-version forwarding, verified-session actor attribution, audit events, protected API routes, and audience-safe DTO projection. Planning operations return `workflowAdvanced: false` and do not invoke the canonical 15-stage workflow.
- **Changed Files**: `backend/features/planning/services/learning-unit-planning.service.ts`; `backend/infrastructure/services/index.ts`; `backend/server/routers/routes.ts`; `backend/server/validation/request-schemas.ts`; `frontend/api/api-client.ts`; `frontend/api/index.ts`; `frontend/api/learning-units.api.ts`; `package.json`; `shared/contracts/index.ts`; `shared/contracts/learning-unit.contract.ts`; `shared/contracts/learning-unit-planning.contract.ts`; `shared/types/learning-unit.ts`; `tests/unit/core-requirements/s11-t03-learning-unit-planning.service.unit.test.ts`; this tracking file.
- **Verification**: `npm run test:s11-t03` — `PASS`; `npm run test:s11-t01` — `PASS` (10/10); `npm run test:s11-t02` — `PASS` (10/10); `npx --yes firebase-tools emulators:exec --only firestore --project burra-pariksha-test "npm run test:s11-t02:integration"` — `PASS` (real local Firestore emulator, synthetic records only, zero pollution); `npm run lint` — `PASS`; `npm run build` — `PASS` (existing bundle-size and dependency warnings only); `git diff --check` — `PASS`. Unit/service tests used in-memory doubles; persistence integration used only the disposable local Firestore emulator, never Cloud Firestore.
- **Risks & Next Actions**: Google AI Studio publication parity remains unverified and was not part of S11-T03. Next roadmap task: `S11-T04` Learning Unit planning UI/workspace integration, after this change is synchronized.

---

### [S3-T05] 2026-10-24 — Resolve GAR-02 Administrator Override Policy

- **Status**: `COMPLETED`
- **Objective**: Integrate the approved GAR-02 security fix on `main` without merging the blocked TypeScript modernization branch, then verify normal and override authorization paths.
- **Work & Outcome**: Cherry-picked only the approved policy change from `e4449ed6ee5266b6f41678612f5a16f940e36e0f` as `02d2039`, without merging `modernize/typescript-20261024104506`. Added narrowly scoped follow-up hardening in `eeb6f26`: persisted workflow authorship is authoritative, malformed override input fails closed, service-level draft approval enforces the same confirmed administrator override, and the UI disables normal self-approval while separately indicating override eligibility. Independent administrator review remains ordinary RBAC; valid self-overrides produce `ALLOWED_BY_ADMIN_OVERRIDE` audit decisions.
- **Changed Files**: `backend/infrastructure/security/rbac-evaluator.ts`; `backend/domain/workflow/workflow-engine.ts`; `backend/features/question-generation/services/question-draft.service.ts`; `backend/infrastructure/auth/services/central-authorization.service.ts`; `tests/unit/s3-t01-rbac-override.test.ts`; `tests/unit/system-admin-workflow-permissions.unit.test.ts`; this tracking file. Source commits: `02d2039`, `eeb6f26`.
- **Verification**: `PERSISTENCE_MODE=IN_MEMORY_TEST_ONLY; npx tsx tests/unit/s3-t01-rbac-override.test.ts` — `PASS` (9/9); `PERSISTENCE_MODE=IN_MEMORY_TEST_ONLY; npx tsx tests/regression/s3-t11-regression-suite.test.ts` — `PASS` (5/5); the same in-memory system-admin suite reached `PASS` (7/8), with only the taxonomy-dependent persistence case blocked by intentionally absent in-memory taxonomy. `npx --yes firebase-tools emulators:exec --only firestore --project burra-pariksha-test "npm run seed:emulator && npx tsx tests/unit/system-admin-workflow-permissions.unit.test.ts && npx tsx tests/integration/system-admin-workflow-operations.integration.test.ts"` — `PASS` (8/8 unit persistence assertions; 11/11 route integration assertions) against a disposable loopback Firestore emulator seeded only with synthetic taxonomy/data; no Cloud Firestore used. `npm run build` — `PASS`; `git diff --check` — `PASS`; `npm run lint` — `FAIL` before project source checking due to the pre-existing, untracked installed dependency declaration `node_modules/googleapis/build/src/apis/containeranalysis/v1.d.ts(1450,48)` (`TS1010: '*/' expected`). Dependencies were not modified.
- **Risks & Next Actions**: The GAR-02 security contract is verified; the separate local dependency declaration-integrity issue still blocks full type checking. Roadmap text still names completed `S11-T03` as next, but tracking confirms its completion; the documented successor and recommended next feature task is `S11-T04` Learning Unit planning workspace UI.

---

### [S11-T04] 2026-10-24 — Learning Unit Planning Workspace UI

- **Status**: `COMPLETED`
- **Objective**: Implement lightweight planning workspace and audience/skill/pillar selectors under `frontend/features/planning` and `frontend/pages/` consuming the S11-T03 planning API client while enforcing Layer 1/2 contracts, distinct Save Draft vs Submit for Verification operations, OCC stale-update detection, and audience preview isolation.
- **Work & Outcome**: Built `LearningDesignSelectors`, `LearningUnitAudiencePreview`, `LearningUnitWorkspace`, and `useLearningUnitPlanning` hook under `frontend/features/planning/`. Exported via `frontend/features/planning/index.ts` and mounted `LearningUnitPlanningPage` under `frontend/pages/` and `frontend/app/App.tsx` routes (`/planning/learning-units` and `/planning/learning-units/:id`), with quick link in `PlanningPage.tsx`. Enforces Topic -> Subtopic 2-tier cascading, client and server validation, optimistic concurrency control conflict alerts (`409 CONFLICT_OPTIMISTIC_LOCK`), and strict exclusion of internal author/review metadata from audience previews.
- **Changed Files**: `frontend/app/App.tsx`; `frontend/features/planning/components/LearningDesignSelectors.tsx`; `frontend/features/planning/components/LearningUnitAudiencePreview.tsx`; `frontend/features/planning/components/LearningUnitWorkspace.tsx`; `frontend/features/planning/hooks/useLearningUnitPlanning.ts`; `frontend/features/planning/index.ts`; `frontend/features/planning/pages/LearningUnitPlanningPage.tsx`; `frontend/pages/LearningUnitPlanningPage.tsx`; `frontend/pages/PlanningPage.tsx`; `package.json`; `tests/unit/core-requirements/s11-t04-learning-unit-planning-workspace.unit.test.ts`; this tracking file.
- **Verification**: `npm run test:s11-t04` — `PASS` (7/7); `npm run test:s11-t01` — `PASS` (10/10); `npm run test:s11-t02` — `PASS` (10/10); `npm run test:s11-t03` — `PASS`; `npm run build` — `PASS` (Vite production bundle & esbuild backend bundle compiled with zero errors); `git diff --check` — `PASS`. `npm run lint` remains blocked before project source analysis by untracked installed dependency declaration error in `node_modules/googleapis/build/src/apis/containeranalysis/v1.d.ts`.
- **Risks & Next Actions**: The next dependency-ready roadmap task is `S11-T05` — Add optional LearningUnit link handling to draft/question/video creation and read models, reusing existing `learningUnitId` fields.


---

### [S11-T05] 2026-10-24 — Optional Learning Unit Linking

<!-- ADR-015 has no VERIFIED planning state; linking therefore uses the strongest persisted eligibility state. -->
- **Status**: `COMPLETED`
- **Objective**: Add optional LearningUnit links to draft/question/video creation and read models without changing standalone compatibility or inventing eligibility policy.
- **Work & Outcome**: Resolved the recorded blocker against ADR-015, the canonical requirements, and the implemented LearningUnit contract. The contract exposes only `DRAFT` and `SUBMITTED_FOR_VERIFICATION`, so artifact linking now requires a persisted, schema-valid `SUBMITTED_FOR_VERIFICATION` unit; it never trusts client-supplied status or descriptive metadata. Non-elevated creators may link only their own unit, while existing management/reviewer roles may link any eligible unit. Draft save, draft approval materialization, direct question creation, and approved-question video queueing now preserve and validate `learningUnitId`; video links must match the source question relationship. Omitted links remain omitted for legacy standalone records.
- **Changed Files**: `backend/features/planning/services/learning-unit-link.service.ts`; `backend/domain/question-generation/question-generation.service.ts`; `backend/features/question-generation/services/question.service.ts`; `backend/features/production/services/video.service.ts`; `backend/ai/validators/question-creation.validator.ts`; `backend/server/validation/request-schemas.ts`; `shared/contracts/question-generation/question-generation.contract.ts`; `shared/contracts/questions.ts`; `tests/unit/core-requirements/s11-t05-learning-unit-linking.unit.test.ts`; `package.json`; this tracking file.
- **Verification**: `git fetch --prune` and baseline inspection confirmed `ffaff19` at synchronized `origin/main` — `PASS`. `npm run test:s11-t05` — `PASS` (6 focused validation cases); `npm run test:s11-t01`, `npm run test:s11-t02`, `npm run test:s11-t03`, and `npm run test:s11-t04` — `PASS`; `npm run build` — `PASS` (Vite and esbuild bundles); `git diff --check` — `PASS`. `npx tsc --noEmit --pretty false` / `npm run lint` — `BLOCKED` before project source analysis by pre-existing `node_modules/googleapis/build/src/apis/containeranalysis/v1.d.ts(1450,48)` `TS1010: '*/' expected`; dependencies were not modified. `S10-T16`, `S10-T17`, and `save-draft-vs-verify` affected workflow runs — `BLOCKED` by unavailable local Firestore emulator at `127.0.0.1:8080`; no production or external datastore was contacted. Firestore emulator integration and live behavior — `NOT TESTED`.
- **Risks & Next Actions**: The implementation intentionally treats `SUBMITTED_FOR_VERIFICATION` as the maximum link eligibility because no independent LearningUnit approval/verification state exists in the approved contract. `S11-T06` is the next dependency-ready roadmap task: add isolated reverse queries for artifacts linked to a LearningUnit and correction-review flags.

---

### [S11-T06] 2026-10-24 — Learning Unit Reverse Queries and Correction-Review Policy

- **Status**: `PARTIAL`
- **Objective**: Add bounded, authorized reverse queries for drafts, questions, and videos linked to a LearningUnit and implement correction-review flags only where the approved model defines them.
- **Work & Outcome**: Added exact `learningUnitId` repository queries for `question_drafts`, `questions`, and `videos`, each using a bounded Firestore `where` predicate with deterministic `updatedAt DESC` ordering rather than a collection scan. Added an authorized aggregate service that validates the persisted LearningUnit through S11-T05 eligibility/ownership rules, prevents cross-unit leakage, excludes legacy records without links, bounds limits, and projects only audience-safe artifact fields (no author/reviewer/provider/audit/assignment/notes metadata). Correction-review flag mutation was not invented: approved requirements and ADRs define neither correction evidence/version semantics, flag persistence shape, workflow transition, authorized actor capability, audit event, nor projection contract.
- **Changed Files**: `database/firestore/repositories/question-drafts.repository.ts`; `database/firestore/repositories/questions.repository.ts`; `database/firestore/repositories/videos.repository.ts`; `backend/features/planning/services/learning-unit-artifacts.service.ts`; `tests/unit/core-requirements/s11-t06-learning-unit-artifacts.unit.test.ts`; `docs/architecture/DECISION-LOG.md` (ADR-016 marked PROPOSED / UNAPPROVED); `package.json`; this tracking file.
- **Verification**: `git fetch --prune` and baseline inspection confirmed `25dd6d3` synchronized with `origin/main` — `PASS`. `npm run test:s11-t06` — `PASS` (5 in-memory cases covering linked results, empty results, legacy exclusion, invalid/nonexistent/unauthorized units, exact isolation, bounded limits, and audience-safe projections). `npm run test:s11-t01` through `npm run test:s11-t05` — `PASS`; `npm run build` — `PASS` (Vite and esbuild bundles); `git diff --check` — `PASS`. `npx tsc --noEmit --pretty false` / `npm run lint` — `BLOCKED` before project source analysis by pre-existing `node_modules/googleapis/build/src/apis/containeranalysis/v1.d.ts(1450,48)` `TS1010: '*/' expected`; dependencies were not modified. Firestore emulator integration and live behavior — `NOT TESTED`; no production or external datastore was contacted.
- **Risks & Next Actions**: S11-T06 remains `PARTIAL` pending owner approval of ADR-016: authoritative LearningUnit correction/version evidence, artifact flag fields and lifecycle, allowed actors, OCC/audit/reason requirements, and audience-safe projection. Reverse-query work is complete and ready for that policy. The next dependency-ready roadmap task is S11-T07, but correction-policy approval is required before declaring the S11 sequence complete.

### [S11-T07] 2026-10-24 — Datastore Integration Fixtures, Test Commands, and Documentation Reconciliation

- **Status**: `COMPLETED`
- **Objective**: Reconcile S11 unit and Firestore emulator integration commands with deterministic synthetic fixtures and truthful testing documentation.
- **Work & Outcome**: Added `test:s11-unit` as the canonical sequential S11-T01 through S11-T06 in-memory suite and `test:s11-t02:emulator` as the reproducible disposable-emulator wrapper. Centralized neutral, uniquely tagged LearningUnit fixture data and used it in the S11-T02 persistence integration test, removing realistic academic content from the fixture while preserving OCC, authorization, and cleanup coverage. Updated `docs/TESTING-GUIDE.md` to distinguish unit, emulator integration, build, and type-check evidence and to document fail-closed loopback/emulator boundaries. ADR-016 remains explicitly proposed and unapproved; no correction-review mutation was added.
- **Changed Files**: `package.json`; `tests/fixtures/synthetic-test-fixtures.ts`; `tests/integration/core-requirements/s11-t02-firestore-learning-unit-persistence.integration.test.ts`; `docs/TESTING-GUIDE.md`; this tracking file.
- **Verification**: `git fetch --prune` and baseline `1445314` synchronized with `origin/main` — `PASS`. `npm run test:s11-unit` — `PASS` (S11-T01 through S11-T06; 10 + 10 + 1 + 7 + 6 + 5 assertions). `npm run test:s11-t02:emulator` — `PASS` (disposable Firestore emulator, synthetic project `burra-pariksha-test`, OCC, collection isolation, and cleanup; child exit code 0). `npm run build` — `PASS` (Vite and esbuild). `git diff --check` — `PASS`. `npm run lint` — `BLOCKED` with pre-existing `node_modules/googleapis/build/src/apis/containeranalysis/v1.d.ts(1450,48): error TS1010: '*/' expected`; dependencies and installed modules were not modified. No production or external datastore access occurred.
- **Risks & Next Actions**: S11-T06 remains `PARTIAL` pending owner approval of ADR-016. Type-checking remains blocked by the malformed installed `googleapis` declaration and must be resolved through the proper dependency/environment process, not by patching `node_modules`. The next dependency-ready roadmap task is S12-T01, subject to the S11-T06 correction-policy approval boundary.

### [S12-T01] 2026-10-24 — Deterministic Calculation and Reasoning Verification Helpers

- **Status**: `COMPLETED`
- **Objective**: Add reusable deterministic helpers for explicit calculation evidence while preserving advisory AI and human approval boundaries.
- **Work & Outcome**: Added a framework-free verifier for finite structured operands supporting addition, subtraction, multiplication, division, percentage-of, and percentage-change operations. The helper uses explicit operand-count validation, division/zero guards, relative/absolute precision tolerance, incomplete-step detection, unique-option matching, declared-answer contradiction detection, deterministic repeatability, and `NOT_APPLICABLE` handling for non-MCQ Topic Introduction content without an explicit calculation claim. It does not infer correctness from natural-language or AI-generated explanations.
- **Changed Files**: `backend/ai/validators/deterministic-calculation-verifier.ts`; `backend/ai/validators/index.ts`; `tests/unit/core-requirements/s12-t01-deterministic-calculation-verifier.unit.test.ts`; `package.json`; this tracking file.
- **Verification**: `git fetch --prune` confirmed baseline `541797b` synchronized with `origin/main` — `PASS`. `npm run test:s12-t01` — `PASS` (6 cases covering valid results, incorrect results, incomplete steps, ambiguity, non-MCQ Topic Introduction, and repeatability). `npm run test:s11-unit` — `PASS` (S11-T01 through S11-T06 regression suite). `npm run build` — `PASS` (Vite and esbuild). `npm run lint` — `BLOCKED` by pre-existing `node_modules/googleapis/build/src/apis/containeranalysis/v1.d.ts(1450,48): error TS1010: '*/' expected`; dependencies and installed modules were not modified. `git diff --check` — `PASS`.
- **Risks & Next Actions**: The helper verifies structured arithmetic only; natural-language reasoning remains advisory and requires existing human-gated validation. ADR-016 remains proposed/unapproved and correction-review mutation remains out of scope. The next roadmap task is S12-T02.

### [S12-T02] 2026-10-24 — Strengthen Stage 02 Question Validation

- **Status**: `COMPLETED`
- **Objective**: Integrate usefulness, Telugu clarity, cross-field consistency, duplicate detection, and fact-risk review into the existing Stage 02 question validation pipeline.
- **Work & Outcome**: Added `validateStage02Quality()` and wired it into `QuestionValidationEngine` after the existing context/language consistency stage. Objective violations (unresolved placeholders, missing answer option, missing explanation, exact duplicates) block validation; usefulness, Telugu script/clarity limitations, near-duplicates, and absolute/time-sensitive/attribution claims produce `NEEDS_REVIEW` findings and recommendations rather than proof. Duplicate scoring reuses the existing normalized Jaccard utility and supplied `existingQuestions`; no datastore or external provider is accessed. S12-T01 remains unchanged and correction-review ADR-016 remains proposed/unapproved.
- **Changed Files**: `backend/ai/validators/stage02-quality.validator.ts`; `backend/ai/validators/question-validation.engine.ts`; `backend/ai/validators/index.ts`; `tests/unit/core-requirements/s12-t02-stage02-quality.unit.test.ts`; `package.json`; this tracking file.
- **Verification**: `git fetch --prune` confirmed baseline `ab04965` synchronized with `origin/main` — `PASS`. `npm run test:s12-t02` — `PASS` (7 cases); `npm run test:s12-t01` — `PASS` (6 cases); `npm run test:s11-unit` — `PASS` (S11-T01 through S11-T06). `npx tsx tests/unit/question-generation/s9-t12-deterministic-quality-validation.unit.test.ts` — `BLOCKED`/exit 1 before assertions because the historical submission-gate portion attempted unavailable Firestore taxonomy at `127.0.0.1:8080`; no production datastore was contacted. `npm run build` — `PASS`. `npm run lint` — `BLOCKED` by pre-existing `node_modules/googleapis/build/src/apis/containeranalysis/v1.d.ts(1450,48): error TS1010: '*/' expected`. `git diff --check` — `PASS`.
- **Risks & Next Actions**: Heuristic findings are not fact verification and require human editorial review. The S9-T12 regression needs its documented disposable emulator setup to execute its persistence portion. The next roadmap task is S12-T03.

### [S12-T03] 2026-10-24 — TEXT and IMAGE Artifact Schemas, Learning Unit Linking, and Google Drive Storage

- **Status**: `COMPLETED`
- **Objective**: Define TEXT and IMAGE artifact contracts with canonical Learning Unit linkage and reuse the existing Google Drive media path for image binaries.
- **Work & Outcome**: Added Zod contracts for structured TEXT and IMAGE input/metadata, including canonical `lnu_` references, safe image filenames, MIME boundaries, timestamps, alt text, and Drive metadata. Added `ContentArtifactService`, which validates the existing Learning Unit ownership/eligibility contract, derives the actual binary size before upload, delegates IMAGE storage to `DriveSyncService` at the existing `THUMBNAIL` stage, and returns metadata without binary/base64 content. Extended `MediaAsset` metadata with optional `learningUnitId`; VIDEO behavior remains unchanged.
- **Changed Files**: `shared/contracts/content-artifacts.contract.ts`, `shared/contracts/index.ts`, `shared/types/content.ts`, `backend/features/planning/services/content-artifact.service.ts`, `backend/infrastructure/services/drive-sync.service.ts`, `tests/unit/core-requirements/s12-t03-content-artifact.unit.test.ts`, `package.json`, `docs/sprints/CORE-REQUIREMENTS-ROADMAP.md`, `docs/TESTING-GUIDE.md`, `docs/project_tracking/project_task_summarie1.md`
- **Verification**: `npm run test:s12-t03` — `PASS` (6 cases, exit 0); `npm run test:s12-t01` and `npm run test:s12-t02` — `PASS`; `npm run test:s11-unit` — `PASS`; `npm run build` — `PASS` (exit 0, existing bundle warnings); `npm run lint` — `BLOCKED` (pre-existing `node_modules/googleapis/build/src/apis/containeranalysis/v1.d.ts(1450,48): error TS1010: '*/' expected`); `git diff --check` — `PASS` before documentation updates and will be rerun before commit. Real Google Drive integration — `NOT TESTED`; no authorized disposable Drive environment was available.
- **Risks & Next Actions**: Real Drive upload/retrieval and Firestore metadata persistence remain unverified in this pass; mocked orchestration proves no binary is placed in the returned metadata contract. ADR-016 remains proposed/unapproved and S11-T06 remains `PARTIAL`. Next dependency-ready roadmap task is S12-T04: AUDIO and ANIMATION brief/narration contracts.

### [S12-T04] 2026-10-24 — AUDIO and ANIMATION Contracts with Google Drive Media Storage

- **Status**: `COMPLETED`
- **Objective**: Define validated AUDIO narration and ANIMATION brief contracts, and route uploaded media through the established Google Drive storage boundary.
- **Work & Outcome**: Added AUDIO narration metadata (`timing`, pronunciation guides, and accessibility fields) and ANIMATION brief metadata (ordered scenes with timing, narration, on-screen text, pronunciation, and accessibility defaults). Added validated AUDIO/ANIMATION upload metadata contracts and service methods with canonical Learning Unit validation, actual-payload size checks, and metadata-only outputs. Extended the existing `DriveSyncService` MIME/extension/size validation with WAV/MP3/AAC AUDIO (50 MiB default) and MP4/WebM/GIF ANIMATION (100 MiB default); both reuse the existing content `Raw` Drive folder and rollback/persistence path. Animation rendering remains deferred.
- **Changed Files**: `shared/contracts/content-artifacts.contract.ts`, `shared/types/content.ts`, `src/types/index.ts`, `backend/features/planning/services/content-artifact.service.ts`, `backend/infrastructure/services/drive-sync.service.ts`, `tests/unit/core-requirements/s12-t04-audio-animation-artifacts.unit.test.ts`, `package.json`, `docs/TESTING-GUIDE.md`, `docs/project_tracking/project_task_summarie1.md`
- **Verification**: `npm run test:s12-t04` — `PASS` (10 cases, exit 0); `npm run test:s12-t03`, `npm run test:s12-t01`, `npm run test:s12-t02`, and `npm run test:s11-unit` — `PASS`; `npm run build` — `PASS` (exit 0, existing bundle warnings); `npm run lint` — `BLOCKED` (pre-existing `node_modules/googleapis/build/src/apis/containeranalysis/v1.d.ts(1450,48): error TS1010: '*/' expected`); `git diff --check` — `PASS` before final commit and rerun after documentation changes. Real Google Drive integration — `NOT TESTED`; provider calls were mocked and no authorized disposable Drive environment was available.
- **Risks & Next Actions**: Real Drive upload/retrieval and Firestore persistence remain unverified; no production data or credentials were accessed. ADR-016 remains proposed/unapproved and S11-T06 remains `PARTIAL`. Next dependency-ready roadmap task is S12-T05: first percentages/discounts synthetic vertical slice across modes and formats.

### [S12-T05] 2026-10-24 — Percentages and Discounts Vertical Slice Across Content Modes and Formats

- **Status**: `COMPLETED`
- **Objective**: Demonstrate one deterministic percentages/discounts lesson through the existing Learning Unit, validation, artifact, and Drive-storage boundaries.
- **Work & Outcome**: Added a non-persisting synthetic orchestration service for the canonical `TOPIC_INTRODUCTION`, `WORKED_EXAMPLES`, and `QUESTION_CHALLENGE_SHORT` modes. It validates the canonical Learning Unit link, verifies the 20% of ₹1000 and ₹1000−₹200 discount calculations with S12-T01, applies S12-T02 Stage 02 quality checks, validates structured TEXT/AUDIO/ANIMATION contracts, represents VIDEO using the existing linked artifact identity, and exercises mocked Drive metadata-only uploads for IMAGE, AUDIO, and ANIMATION through `ContentArtifactService`.
- **Changed Files**: `backend/features/planning/services/percentages-discounts-vertical-slice.service.ts`, `tests/unit/core-requirements/s12-t05-percentages-discounts-vertical-slice.unit.test.ts`, `package.json`, `docs/TESTING-GUIDE.md`, `docs/project_tracking/project_task_summarie1.md`
- **Verification**: `npm run test:s12-t05` — `PASS` (8 assertions, exit 0); `npm run test:s12-t01`, `npm run test:s12-t02`, `npm run test:s12-t03`, `npm run test:s12-t04`, and `npm run test:s11-unit` — `PASS`; `npm run build` — `PASS` (exit 0, existing bundle-size/Zod warnings); `npm run lint` — `BLOCKED` (pre-existing `node_modules/googleapis/build/src/apis/containeranalysis/v1.d.ts(1450,48): error TS1010: '*/' expected`); `git diff --check` — `PASS`. Real Google Drive, Firestore, and production workflow integration — `NOT TESTED`; all provider interactions used synthetic data and injected mocks.
- **Risks & Next Actions**: This is a service-boundary synthetic slice, not a production persistence or publication test. ADR-016 remains proposed/unapproved and S11-T06 remains `PARTIAL`. Next dependency-ready roadmap task is S12-T06: mode/format compatibility matrix and legacy `EXPLAINED_QUESTIONS_VIDEO` migration notes.

### [S12-T06] 2026-10-24 — Content Mode/Format Compatibility Matrix and Legacy Mode Migration Notes

- **Status**: `COMPLETED`
- **Objective**: Establish one backend-authoritative compatibility matrix for the three canonical modes and five orthogonal presentation formats while preserving the legacy worked-examples identifier.
- **Work & Outcome**: Added `CONTENT_MODE_FORMAT_COMPATIBILITY` with explicit rationale for all 15 supported pairs. Added `getContentModeFormatRule()` and `isContentModeFormatSupported()` validation helpers; `ContentArtifactService.validateModeFormat()` consumes the matrix, and the S12-T05 vertical slice validates every pair through that boundary. Legacy `EXPLAINED_QUESTIONS_VIDEO` resolves to canonical `WORKED_EXAMPLES` for compatibility checks, while `toLegacyContentMode()` and existing routes/storage remain unchanged. No migration, backfill, destructive rewrite, or new workflow state was introduced.
- **Changed Files**: `shared/constants/content-mode-format-compatibility.ts`, `shared/constants/index.ts`, `backend/features/planning/services/content-artifact.service.ts`, `backend/features/planning/services/percentages-discounts-vertical-slice.service.ts`, `tests/unit/core-requirements/s12-t06-content-mode-format-compatibility.unit.test.ts`, `package.json`, `docs/architecture/DECISION-LOG.md`, `docs/TESTING-GUIDE.md`, `docs/project_tracking/project_task_summarie1.md`
- **Verification**: `npm run test:s12-t06` — `PASS` (15 matrix decisions and 9 compatibility cases); S12-T01 through S12-T05 and S11 unit regressions — `PASS`; `npm run build` — `PASS` (exit 0, existing bundle/Zod warnings); `npm run lint` — `BLOCKED` (pre-existing `node_modules/googleapis/build/src/apis/containeranalysis/v1.d.ts(1450,48): error TS1010: '*/' expected`); `git diff --check` — `PASS`. Real Drive/Firestore integration — `NOT TESTED`; no external or production services were accessed.
- **Risks & Next Actions**: `SUPPORTED` means contract compatibility only; rendering, generation, and publication remain separate capability gates. ADR-016 remains proposed/unapproved and S11-T06 remains `PARTIAL`. Next dependency-ready roadmap task is S13-T01, the first Sprint 13 workflow integration task.

### [S13-T01] 2026-10-24 — Consolidate Workflow Transition Authority

- **Status**: `COMPLETED`
- **Objective**: Make the canonical 15-stage transition matrix the single workflow-instance eligibility authority without merging independent entity lifecycles.
- **Work & Outcome**: Confirmed `WorkflowEngine` and `WorkflowService` already route workflow-instance transitions through `transition-matrix.ts`. Added runtime fail-closed validation for malformed current steps and normalized canonical `WORKED_EXAMPLES` plus legacy `EXPLAINED_QUESTIONS_VIDEO` before mode-specific prerequisite checks. Question, video, assignment, and content-master status maps remain explicitly subordinate aggregate lifecycle guards; no workflow states, authorization, GAR-02, OCC, audit, or Save Draft/Submit behavior were broadened.
- **Changed Files**: `backend/domain/workflow/transition-matrix.ts`, `backend/domain/workflow/workflow-engine.ts`, `tests/unit/core-requirements/s13-t01-transition-authority.unit.test.ts`, `package.json`, `docs/TESTING-GUIDE.md`, `docs/project_tracking/project_task_summarie1.md`
- **Verification**: `npm run test:s13-t01` — `PASS` (15 canonical rules, invalid states, canonical/legacy modes); `npm run test:s12-t06` — `PASS`; broader S11/S12 suites, build, lint, and final diff check pending for this bounded pass. Real Firestore/Drive integration — `NOT TESTED`.
- **Risks & Next Actions**: `npm run lint` remains expected to be blocked by the pre-existing malformed `googleapis` declaration; no dependency workaround was made. Next dependency-ready roadmap task is S13-T02.

### [S13-T02] 2026-10-24 — Add Mode-Aware Prompt and Template Inputs

- **Status**: `COMPLETED`
- **Objective**: Add canonical mode-aware prompt guidance for practical math, everyday money, and decision scenarios while keeping AI output advisory.
- **Work & Outcome**: Added the versioned `question-generation.mode-aware.v1` template contract. Generation prompts now normalize canonical and legacy modes, include mode-specific constraints for Topic Introduction, Worked Examples, and Question Challenge Short, preserve prompt-injection sanitization, and explicitly state that generated content is advisory. Orchestrator metadata now records prompt template provenance, canonical production mode, and `advisoryOnly: true`; no provider call, workflow mutation, correctness decision, or persistence behavior was introduced.
- **Changed Files**: `shared/contracts/question-generation/question-generation.contract.ts`, `backend/ai/prompts/generation.prompt.ts`, `backend/ai/orchestrator/ai-orchestrator.service.ts`, `tests/unit/core-requirements/s13-t02-mode-aware-prompts.unit.test.ts`, `package.json`, `docs/TESTING-GUIDE.md`, `docs/project_tracking/project_task_summarie1.md`
- **Verification**: `npm run test:s13-t02` — `PASS` (3 modes, legacy alias, injection safety, advisory contract); `npm run test:s13-t01` — `PASS`; S12-T01, S12-T05, S12-T06 — `PASS`; mocked/deterministic tests only, no Gemini, Drive, Firestore, or production access.
- **Risks & Next Actions**: Full build/lint/diff verification follows. Lint is expected to retain the existing `googleapis` TS1010 blocker. Next dependency-ready roadmap task is S13-T03.

### [S13-T03] 2026-10-24 — Map Discover-to-Improve Product Pipeline

- **Status**: `COMPLETED`
- **Objective**: Map the product pipeline from Discover through Improve onto LearningUnit planning and the canonical 15-stage workflow without creating a second state machine.
- **Work & Outcome**: Added a pure shared `PRODUCT_PIPELINE_PHASES` contract and resolver. Discover/Plan use the LearningUnit planning boundary and Stage 01; Verify maps to Stage 02; Design/Generate cover Stages 03–06; Review/Approve cover Stages 07–09; Publish covers Stages 10–12; Measure covers Stages 13–14; Improve maps to Stage 15 and explicitly re-enters revisions at Stage 01. The resolver delegates current state and applicability to `resolveDynamicWorkflow`; transition eligibility, authorization, OCC, audit, and side effects remain in existing backend authorities.
- **Changed Files**: `shared/contracts/product-pipeline.ts`, `shared/lib/product-pipeline.ts`, `shared/lib/index.ts`, `tests/unit/core-requirements/s13-t03-product-pipeline.unit.test.ts`, `package.json`, `docs/TESTING-GUIDE.md`, `docs/project_tracking/project_task_summarie1.md`
- **Verification**: `npm run test:s13-t03` — `PASS` (all 15 stages and lifecycle phase boundaries); `npm run test:s13-t01` and `npm run test:s13-t02` — `PASS`; `git diff --check` — `PASS`; tests are deterministic in-memory assertions only, with no Firestore, emulator, Drive, AI, or production access.
- **Risks & Next Actions**: Build and lint verification follows. Existing `googleapis` TS1010 declaration error remains an expected lint blocker. Next dependency-ready roadmap task is S13-T04.

### [S13-T04] 2026-10-24 — Propagate Linked LearningUnit Context Through Production

- **Status**: `COMPLETED`
- **Objective**: Wire linked LearningUnit context into script, teleprompter, media correlation, QC/publishing inputs, while preventing internal metadata exposure.
- **Work & Outcome**: Added a shared linked-context contract and projection helper. Script records now retain the parent video `learningUnitId`; publishing records inherit the same correlation ID; existing Video/MediaAsset paths remain authoritative for media and QC. Teleprompter generation loads the linked LearningUnit, passes only an audience-safe projection containing educational objective/method/scenario fields, and rejects a missing linked record. Author identity, LearningUnit ID, version, planning status, and timestamps are excluded from generated prompts. No workflow transition, authorization, OCC, audit, AI approval, or persistence boundary was bypassed.
- **Changed Files**: `shared/contracts/linked-learning-unit-context.ts`, `shared/contracts/index.ts`, `shared/lib/linked-learning-unit-context.ts`, `shared/lib/index.ts`, `shared/types/content.ts`, `backend/ai/prompts/script-generation.prompt.ts`, `backend/features/production/services/script.service.ts`, `backend/features/publishing/services/publishing.service.ts`, `tests/unit/core-requirements/s13-t04-learning-unit-context.unit.test.ts`, `package.json`, `docs/TESTING-GUIDE.md`, `docs/project_tracking/project_task_summarie1.md`
- **Verification**: `npm run test:s13-t04` — `PASS`; `npm run test:s13-t03` — `PASS`; deterministic in-memory contract tests only, with no Firestore, Drive, AI provider, emulator, or production access. Full regression/build/lint/diff verification follows.
- **Risks & Next Actions**: Existing `googleapis` declaration TS1010 blocker is expected for lint/type-check. Real downstream persistence/provider integration remains untested; next dependency-ready roadmap task is S13-T05.

### [S13-T05] 2026-10-24 — Audit Mutation Route Security Boundaries

- **Status**: `COMPLETED`
- **Objective**: Audit active mutation endpoints for authentication, capability/authorization, actor boundaries, and compatibility exceptions, fixing uncovered routes in the smallest module.
- **Work & Outcome**: Added a deterministic route matrix that inventories 152 POST/PUT/PATCH/DELETE declarations across the primary and modular routers. Public authentication lifecycle endpoints and non-mutating POST resolvers/generators are explicitly documented exceptions; all remaining mutation declarations pass the authentication, authorization, and actor-boundary checks. Added local `requireAuth` to script version history because the modular router is mounted before the later router-wide authentication middleware. Existing service/domain boundaries remain responsible for ownership, GAR-02, expectedVersion/OCC, immutable audit, and side effects.
- **Changed Files**: `backend/server/routers/script.routes.ts`, `tests/unit/core-requirements/s13-t05-mutation-route-security.unit.test.ts`, `package.json`, `docs/TESTING-GUIDE.md`, `docs/project_tracking/project_task_summarie1.md`
- **Verification**: `npm run test:s13-t05` — `PASS` (152 mutation declarations); `npm run test:s13-t01` — `PASS`; `npm run test:s13-t02` — `PASS`; `npm run test:s13-t03` — `PASS`; `npm run test:s13-t04` — `PASS`; S11 unit suite — `PASS`; S12-T01 through S12-T06 — `PASS`; deterministic/in-memory and source-level evidence only, with no Firestore, emulator, Drive, AI provider, or production access.
- **Risks & Next Actions**: Build and diff verification follows. `npm run lint` remains expected to encounter the existing `googleapis` TS1010 declaration blocker. Next dependency-ready roadmap task is S13-T06, safe emulator acceptance for one LearningUnit-linked video path.

### [S13-T06] 2026-10-24 — Emulator Acceptance for Linked Video Path

- **Status**: `COMPLETED`
- **Objective**: Add safe integration acceptance for one LearningUnit-linked video path using only a disposable Firestore emulator and mocked Drive/AI boundaries.
- **Work & Outcome**: Added an emulator-wrapped integration test that creates synthetic LearningUnit, question, and linked video records, persists a canonical VIDEO workflow instance, verifies Stage 01 to Stage 02 transition history, confirms emulator-backed audit append, rejects a stale `expectedVersion`, and verifies cleanup of all synthetic records. Updated the audit dispatcher so the explicitly isolated Firestore emulator uses the Admin SDK instead of silently falling back to in-memory audit events; production/cloud behavior remains unchanged.
- **Changed Files**: `tests/integration/core-requirements/s13-t06-linked-video-emulator.integration.test.ts`, `src/lib/audit/firestore-audit.dispatcher.ts`, `package.json`, `docs/TESTING-GUIDE.md`, `docs/project_tracking/project_task_summarie1.md`
- **Verification**: `npm run test:s13-t06:emulator` — `PASS`; disposable Firestore emulator on `127.0.0.1:8080`, synthetic project `burra-pariksha-test`, no Drive/AI/production access. Initial run exposed and was corrected for the pre-existing emulator audit fallback; final run passed with exit code 0.
- **Risks & Next Actions**: Build/lint/regression verification follows. Firebase CLI emitted an unauthenticated warning and Node emitted a metadata lookup warning, but the isolated emulator test completed successfully. Existing `googleapis` TS1010 declaration blocker remains expected for lint/type-check. Next roadmap task is Sprint 14 connected learning sequences and editorial planning.
### [S14-T01] 2026-10-24 — Add related-artifact sequence read model

- **Status**: `COMPLETED`
- **Objective**: Provide a deterministic, paginated related-artifact sequence for one LearningUnit.
- **Work & Outcome**: Extended the existing authorized LearningUnit artifact service with a read-only sequence projection, canonical Intro -> Worked Examples -> Challenge ordering, optional mode/format/status filters, missing-mode tolerance, and bounded pagination. Added the protected `GET /planning/learning-units/:id/sequence` route without adding workflow or persistence authorities.
- **Changed Files**: `backend/features/planning/services/learning-unit-artifacts.service.ts`, `backend/infrastructure/services/index.ts`, `backend/server/routers/routes.ts`, `tests/unit/core-requirements/s14-t01-learning-sequence.unit.test.ts`, `package.json`, `docs/TESTING-GUIDE.md`
- **Verification**: `npm run test:s14-t01` PASS; `npm run test:s11-unit` PASS; S12-T01 through S12-T06 PASS; S13-T01 through S13-T06 PASS; `npm run build` PASS; `git diff --check` PASS. `npm run lint` remains blocked by the pre-existing `googleapis` `containeranalysis/v1.d.ts(1450,48): TS1010` declaration error.
- **Risks & Next Actions**: No emulator or provider integration was needed for this read-only unit scope. S14-T02 is next once this commit is synchronized.

### [S14-T02] 2026-10-24 — Add lightweight editorial calendar view

- **Status**: `COMPLETED`
- **Objective**: Provide a filtered operational editorial planning view using existing LearningUnit concepts.
- **Work & Outcome**: Added the protected `GET /planning/editorial-calendar` API and a repository-backed planning projection supporting Topic, Subtopic, mode, format, audience, status, and bounded pagination filters. Canonicalized legacy `EXPLAINED_QUESTIONS_VIDEO` to `WORKED_EXAMPLES` in both calendar output and the S14-T01 sequence filter, without adding persistence, dates, workflow states, or recommendation behavior.
- **Changed Files**: `backend/features/planning/services/learning-unit-planning.service.ts`, `backend/features/planning/services/learning-unit-artifacts.service.ts`, `backend/server/routers/routes.ts`, `backend/server/validation/request-schemas.ts`, `shared/contracts/learning-unit-planning.contract.ts`, `tests/unit/core-requirements/s14-t01-learning-sequence.unit.test.ts`, `tests/unit/core-requirements/s14-t02-editorial-calendar.unit.test.ts`, `package.json`, `docs/TESTING-GUIDE.md`
- **Verification**: `npm run test:s14-t01` PASS; `npm run test:s14-t02` PASS; `npm run test:s11-unit` PASS; S13-T01, S13-T04, and S13-T05 PASS; build PASS; `git diff --check` PASS. Lint/type-check remains blocked by the pre-existing `googleapis` `containeranalysis/v1.d.ts(1450,48): TS1010` declaration error.
- **Risks & Next Actions**: No emulator, cloud, Drive, AI, or production integration was run because this is a deterministic read-only projection. S14-T03 is next and remains gated on an approved correction-review model.

### [S14-T03] 2026-10-24 — Correction-review readiness gate

- **Status**: `BLOCKED`
- **Objective**: Determine whether the roadmap-defined correction propagation and review queue can be implemented safely.
- **Work & Outcome**: Verified the synchronized S14-T02 baseline and inspected the Sprint 14 roadmap, core requirements, ADR decision log, S11-T06 policy record, and the existing linked-artifact service. The roadmap requires persisted review flags after a correction, but ADR-016 is absent from the current decision log and the historical S11-T06 record explicitly marks its correction-review model `PROPOSED / UNAPPROVED`. Existing code correctly keeps `correctionReview.supported` false.
- **Changed Files**: `docs/project_tracking/project_task_summarie1.md`
- **Verification**: Baseline fetch and synchronization check PASS at `e492366c1bb28d3c31c5ec79390a63b022e91bb5`; architecture/roadmap inspection PASS; no implementation tests or build were run because the governing lifecycle is unapproved; `git diff --check` required after this documentation-only update.
- **Risks & Next Actions**: Owner/architecture approval must define authoritative correction/version evidence, flag persistence and lifecycle, allowed actors/capabilities, OCC and immutable audit requirements, reason validation, and audience-safe projections. Alternatives are (1) approve a minimal additive review-flag model, recommended, or (2) defer S14-T03 until correction semantics are specified. Do not implement correction propagation, mutation, or a review queue before that decision. S14-T04 remains blocked transitively; no dependency-ready Sprint 14 implementation task is available until this approval is recorded.

### Architecture / Planning — 2026-10-24 — ADR-016 correction-review proposal

- **Status**: `PARTIAL`
- **Objective**: Resolve the architectural uncertainty blocking S14-T03 without implementing the disputed lifecycle.
- **Work & Outcome**: Verified the pushed S14-T03 readiness baseline and produced ADR-016 as `PROPOSED / PENDING APPROVAL`. Compared a minimal additive correction evidence/review-flag model with deferral, documented proposed lifecycle, permissions, version/OCC, idempotency, audit, projection, compatibility, testing, and security implications, and listed eight product-owner decisions required before acceptance. Updated the Sprint 14 roadmap to record the ADR dependency; S14-T03 and S14-T04 remain incomplete.
- **Changed Files**: `docs/architecture/DECISION-LOG.md`, `docs/sprints/CORE-REQUIREMENTS-ROADMAP.md`, `docs/project_tracking/project_task_summarie1.md`
- **Verification**: `git fetch origin main` and baseline confirmation at `e706c64f81df127014601e883bc08e3e7ce8b0db` PASS; architecture/code evidence inspection PASS; `git diff --check` PASS; implementation tests/build/lint not run because this was documentation-only and ADR-016 remains unapproved.
- **Risks & Next Actions**: Product Owner and architecture owner must answer the ADR-016 questions and explicitly accept or reject the proposal. No correction-review code, migration, or production operation is authorized. S14-T03 remains the next task only after acceptance; otherwise revise/defer Sprint 14 scope.

### [S15-T01] 2026-10-24 — Define performance and learning-engagement contracts

- **Status**: `COMPLETED`
- **Objective**: Define typed artifact/platform audience-performance and learning-engagement observations with explicit missing-data behavior.
- **Work & Outcome**: Added shared Zod/TypeScript contracts for audience measures and learning-engagement measures, including artifact/learning-unit and comparison dimensions for platform, mode, format, audience, and series. Each metric distinguishes `AVAILABLE` numeric observations from explicit `UNAVAILABLE` reasons; no zero-valued fallback, persistence, aggregation, workflow mutation, or provider call was introduced.
- **Changed Files**: `shared/contracts/performance.contract.ts`, `tests/unit/core-requirements/s15-t01-performance-contracts.unit.test.ts`, `package.json`, `docs/TESTING-GUIDE.md`, `docs/project_tracking/project_task_summarie1.md`
- **Verification**: `npm run test:s15-t01` and related S14 contract tests PASS; build and `git diff --check` required before delivery. No emulator/cloud/provider integration is applicable to this pure contract task. Lint remains subject to the known `googleapis` `containeranalysis/v1.d.ts(1450,48): TS1010` blocker.
- **Risks & Next Actions**: S14-T03/T04 remain blocked by ADR-016. S15-T02 can consume these contracts after review; persistence must remain artifact/platform scoped and append-only.

### [S15-T02] 2026-10-24 — Persist artifact production effort

- **Status**: `PARTIAL`
- **Objective**: Persist production time, cost, revisions, rejection count, and reuse observations at artifact/platform level with OCC.
- **Work & Outcome**: Added a Firestore-backed `production_effort` repository, shared contract reusing the S15-T01 unavailable-metric semantics, and an authorized service for explicit create/update observations. Records receive UUID-based IDs, preserve artifact/platform dimensions, attribute the recorder server-side, and require expected-version updates. No formulas or workflow-history inference were introduced because authoritative measurement semantics are not defined by the approved requirements.
- **Changed Files**: `shared/contracts/production-effort.contract.ts`, `shared/contracts/index.ts`, `database/firestore/repositories/production-effort.repository.ts`, `database/firestore/repositories/index.ts`, `backend/features/analytics/services/production-effort.service.ts`, `backend/infrastructure/services/index.ts`, `tests/unit/core-requirements/s15-t02-production-effort.unit.test.ts`, `package.json`, `docs/TESTING-GUIDE.md`
- **Verification**: `npm run test:s15-t02` — `PASS`; `git diff --check` — `PASS`; `npx tsc --noEmit --pretty false` — `BLOCKED` by pre-existing `node_modules/googleapis/build/src/apis/containeranalysis/v1.d.ts(1450,48): TS1010`. Emulator and cloud integration — `NOT RUN`; no production data accessed.
- **Risks & Next Actions**: Product ownership must define whether values are operator-entered, derived, or both; cost currency semantics and reuse definition remain open. Complete aggregation/dashboard work in S15-T03 only after these semantics are approved.

### Architecture / Planning — 2026-10-25 — Requirements-driven target architecture and S16+ roadmap

- **Status**: `COMPLETED`
- **Objective**: Establish a repository-grounded target architecture and dependency-aware future roadmap from the canonical core requirements without implementing application features.
- **Work & Outcome**: Verified `main` at `fb8076a7e2044de208d5c34b8340ec54ddbbb09f`, synchronized with `origin/main`, and audited the core requirements, approved architecture/ADR documents, roadmap, S7–S15 history, frontend/backend boundaries, repositories, workflow/auth/audit/OCC paths, analytics, media, publication, tests, and known blockers. Added a requirements coverage matrix and current/target boundary document. Reconciled the roadmap with an S16–S23 hypothesis, explicit READY/GATED states, task-level acceptance evidence, non-goals, ADR-016 and metric-definition gates, and truthful S15-T01/S15-T02 limits. ADR-016 remains `PROPOSED / PENDING APPROVAL`; no correction lifecycle or new feature was implemented.
- **Changed Files**: `docs/architecture/28-CORE-REQUIREMENTS-TARGET-ARCHITECTURE.md`, `docs/sprints/CORE-REQUIREMENTS-ROADMAP.md`, this tracking file.
- **Verification**: Baseline fetch, branch/HEAD/origin/divergence/worktree inspection — `PASS`; architecture and requirements evidence inspection — `PASS`; roadmap task-ID and sprint-heading inspection — `PASS`; documentation diff review and `git diff --check` — required before commit; application tests/build — `NOT RUN` because this is planning-only.
- **Risks & Next Actions**: The next implementation must be selected from the accepted S16+ roadmap, with `S16-T01` the highest-priority dependency-ready task. S17 remains gated by product metric definitions; S18 remains gated by explicit ADR-016 acceptance or replanning. The installed `googleapis` TS1010 blocker remains unresolved and must not be hidden through dependency edits.

### Architecture / Planning Review — 2026-10-25 — Accept S16+ roadmap with corrections

- **Status**: `COMPLETED`
- **Objective**: Independently review commit `58deb82939f9c6bb4a7928d1eb62e9e80cce7e59` for requirements completeness, architectural fidelity, and roadmap quality without implementing S16-T01.
- **Work & Outcome**: Verified the baseline and reviewed the core requirements, target architecture, decision log, existing architecture, historical S7-S15 tracking, and actual role/navigation sources. Accepted the planning baseline with justified corrections: added explicit requirement-to-architecture-to-task traceability, added revenue and publishing-consistency coverage without authorizing billing, added role-to-hub/action responsibilities, removed stale S11 next-work language, and bounded S16-T01 with a precise acceptance matrix. ADR-016 remains proposed and blocked; S15-T02 remains partial explicit observation persistence rather than approved metric definitions, complete analytics, or a dashboard.
- **Changed Files**: `docs/architecture/28-CORE-REQUIREMENTS-TARGET-ARCHITECTURE.md`, `docs/sprints/CORE-REQUIREMENTS-ROADMAP.md`, this tracking file.
- **Verification**: Baseline fetch and synchronization — `PASS`; architecture/requirements/role/navigation evidence review — `PASS`; roadmap task-definition uniqueness and sprint-heading checks — `PASS`; `git diff --check` — required before commit; application tests/build — `NOT RUN` because this was a planning review.
- **Risks & Next Actions**: S16-T01 is the next implementation task and must remain limited to existing API acceptance coverage. S17 requires approved metric/revenue definitions; S18 requires ADR-016 acceptance or explicit replanning. Live UI, emulator, provider, and production behavior remain unverified.

### [S16-T01] 2026-10-25 — Protected API acceptance coverage

- **Status**: `COMPLETED`
- **Objective**: Prove the existing LearningUnit planning and workflow API boundaries satisfy the S16-T01 authorization, operation-separation, OCC, and audience-safety acceptance criteria without adding a new feature.
- **Work & Outcome**: Added deterministic API-boundary coverage for unauthenticated 401 responses, insufficient-role 403 responses, fail-closed `getRequestActor()` behavior, protected LearningUnit planning route declarations, and success-response wiring. Composed the task command with the existing S11-T03 service tests (Save Draft/Submit, OCC, ownership, actor attribution, safe DTOs), S11-T05 linking tests, S13-T01 transition tests, and S13-T05 mutation-route security coverage. No correction-review lifecycle, new workflow stage, emulator persistence, provider call, or production operation was added.
- **Changed Files**: `tests/unit/core-requirements/s16-t01-api-acceptance.unit.test.ts`, `package.json`, `docs/TESTING-GUIDE.md`, this tracking file.
- **Verification**: `npm run test:s16-t01` — `PASS` (API boundary, S11-T03, S11-T05, S13-T01, and S13-T05 suites); `npm run build` — `PASS`; `npm run lint` — `BLOCKED` by the pre-existing `node_modules/googleapis/build/src/apis/containeranalysis/v1.d.ts(1450,48): error TS1010: '*/' expected`; `git diff --check` — `PASS`. Emulator/cloud/browser/human acceptance — `NOT RUN` and deferred where applicable.
- **Risks & Next Actions**: Route behavior is covered statically and middleware behavior deterministically; full HTTP runtime and Firestore persistence remain S16-T02 or owner-controlled evidence. Next dependency-ready task is S16-T02 emulator acceptance.

### [S16-T02] 2026-10-25 — Linked production foundation emulator acceptance

- **Status**: `COMPLETED`
- **Objective**: Verify real isolated Firestore persistence for the existing LearningUnit-linked artifact and workflow foundation.
- **Work & Outcome**: Added a loopback Firestore emulator integration test using existing repositories, workflow service, audit hooks, synthetic IDs, and bounded cleanup. It creates and reads back a LearningUnit, persists linked question/video records, transitions the existing workflow, verifies immutable history and audit persistence, rejects a stale expected version, and never calls external providers.
- **Changed Files**: `tests/integration/core-requirements/s16-t02-learning-unit-workflow-emulator.integration.test.ts`, `package.json`, `docs/TESTING-GUIDE.md`, this tracking file.
- **Verification**: `npm run test:s16-t02` — `PASS` (isolated loopback Firestore emulator, exit code 0; real repository round-trip, linked artifact retrieval, workflow history, audit persistence, stale OCC rejection, and bounded cleanup); `npm run test:s16-t01` — `PASS`; `npm run test:s13-t06` — `PASS` (prior linked-workflow emulator regression); `npm run build` — `PASS`; `npm run lint` — `BLOCKED` by the pre-existing `node_modules/googleapis/build/src/apis/containeranalysis/v1.d.ts(1450,48): error TS1010: '*/' expected`; `git diff --check` — `PASS`. Production Firestore, cloud providers, browser, and human acceptance — `NOT RUN`.
- **Risks & Next Actions**: Emulator evidence covers the persistence foundation only; role-aware browser/read-model evidence remains S16-T03. ADR-016 and metric semantics remain unimplemented and gated.

### Architecture / Maintenance — 2026-10-25 — Restore corrupted googleapis installation

- **Status**: `PARTIAL`
- **Objective**: Remove the recurring `googleapis` declaration TS1010 blocker without weakening TypeScript validation or starting S16-T03.
- **Work & Outcome**: Confirmed the committed manifest requested `googleapis` `^176.0.0`, the installed and locked package version was `176.0.0`, and the local `node_modules/googleapis/build/src/apis/containeranalysis/v1.d.ts` was truncated at line 1450. The published `googleapis@176.0.0` archive was downloaded independently and contains the complete 376,731-byte declaration, proving local installation corruption rather than a published package defect. Synchronized `package-lock.json` with the existing manifest because the prior lock omitted declared Firebase dependencies and `npm ci` could not reproduce the installation; then restored dependencies with `npm ci`. No dependency version was changed and no `node_modules` file was edited as a fix.
- **Changed Files**: `package-lock.json`, this tracking file.
- **Verification**: Baseline `npm run lint` — `FAIL` at the original TS1010 declaration. After restoration, `googleapis@176.0.0` declaration is complete and TS1010 is absent; exact `npm run lint` reaches separate pre-existing application TypeScript errors in production-effort, content-artifact, planning, production, question-generation, pipeline, workflow runtime, and existing test files — `BLOCKED`, not suppressed. `npm ci` — `PASS`; sequential final `npm run build` — `PASS`; `npm run test:s16-t01` — `PASS`; `npm run test:s16-t02` — `PASS` (isolated emulator, exit code 0); `npm run test:s13-t06` — `PASS`; `git diff --check` — `PASS`. Registry/cloud/production/browser tests — `NOT RUN`.
- **Risks & Next Actions**: The recurring TS1010 root cause is resolved durably through a clean lockfile-driven installation, but the S16-T03 gate is **NOT SATISFIED** because the exact lint command now exposes unrelated existing application type errors. Those errors must be handled in a separate scoped type-correction task before S16-T03; no S16-T03 work was started.

### Architecture / Maintenance — 2026-10-25 — Resolve post-install TypeScript diagnostics

- **Status**: `COMPLETED`
- **Objective**: Resolve the application and test TypeScript diagnostics exposed after the durable `googleapis` installation repair, without starting S16-T03.
- **Work & Outcome**: Added explicit runtime narrowing for workflow steps; adapted the production-effort repository to the service OCC contract; preserved correlated audio/animation artifact metadata typing; exported the product-pipeline contracts; reconciled LearningUnit artifact mode typing and legacy mode normalization; corrected the undefined question-link validation input; added the audience-safe script context type; corrected canonical enum and audience values; repaired only affected integration/unit fixtures and discriminated-union narrowing. The prior `googleapis` TS1010 diagnostic remained absent.
- **Changed Files**: `backend/domain/workflow/transition-matrix.ts`, `backend/features/analytics/services/production-effort.service.ts`, `backend/features/planning/services/content-artifact.service.ts`, `backend/features/planning/services/learning-unit-artifacts.service.ts`, `backend/features/planning/services/learning-unit-planning.service.ts`, `backend/features/planning/services/percentages-discounts-vertical-slice.service.ts`, `backend/features/question-generation/services/question.service.ts`, `shared/contracts/index.ts`, `shared/types/learning-unit.ts`, `shared/types/question.ts`, affected S13-S16 fixtures/tests, this tracking file.
- **Verification**: `npm run lint` — `PASS` (exit 0); focused S13-T01, S13-T04, S13-T05, S14-T01, S14-T02, S15-T01, and S15-T02 tests — `PASS`; `npm run build` — `PASS` (exit 0; existing bundle-size and dependency comment warnings only); `npm run test:s16-t01` — `PASS`; `npm run test:s16-t02` — `PASS` (isolated disposable Firestore emulator, exit 0); `npm run test:s13-t06` — `PASS` (isolated disposable Firestore emulator, exit 0); production Firestore, cloud providers, browser acceptance, and deployment — `NOT RUN`.
- **Risks & Next Actions**: Firebase CLI unauthenticated and Node metadata lookup warnings occurred only during emulator startup; no production target was used. S16-T03 is now eligible to be considered next, but was not started in this task.

### [S16-T03] 2026-10-25 — Role-aware production workbench verification

- **Status**: `COMPLETED`
- **Objective**: Verify existing production workbench navigation and typed read-model boundaries for role-aware visibility without adding routes, roles, or workflow behavior.
- **Work & Outcome**: Added component/API acceptance coverage for the frozen Production hub routes, capability visibility for video editors, analysts, and administrators, and the existing `/videos`, `/videos/stats`, and `/planning/learning-units` read-model client boundaries. The test uses synthetic in-memory responses and server-side component rendering; it does not contact Firestore, providers, or production services.
- **Changed Files**: `tests/unit/core-requirements/s16-t03-production-workbench.unit.test.ts`, `package.json`, this tracking file.
- **Verification**: `npm run test:s16-t03` — `PASS`; `npm run lint` — `PASS`; `npm run build` — `PASS` (existing bundle-size and dependency comment warnings only); `npm run test:s16-t01` — `PASS`; `npm run test:s16-t02` — `PASS` (isolated disposable Firestore emulator); `npm run test:s13-t06` — `PASS` (isolated disposable Firestore emulator); `git diff --check` — `PASS`. Browser automation, cloud integration, production data, and human role acceptance — `NOT RUN`.
- **Risks & Next Actions**: Firebase CLI unauthenticated and Node metadata lookup warnings occurred during emulator startup only. Component evidence verifies rendered capability visibility, not browser navigation or live backend authorization; S16-T04 is the next approved roadmap task and was not started.

### [S16-T04] 2026-10-25 — Reconcile publication and media adapter retry behavior

- **Status**: `COMPLETED`
- **Objective**: Verify the existing publication/media adapter duplicate and retry behavior through provider-free mocked acceptance tests.
- **Work & Outcome**: Added focused mocked coverage for same-record idempotent publication, cross-video duplicate URL rejection, and repeated retry no-op behavior. The tests stub only repository, authorization, readiness, and audit boundaries; no provider publication, media upload, Firestore write, or production operation occurs. Existing service behavior was sufficient, so no application adapter logic or dependency was changed.
- **Changed Files**: `tests/unit/core-requirements/s16-t04-publication-media-adapters.unit.test.ts`, `package.json`, this tracking file.
- **Verification**: `npm run test:s16-t04` — `PASS`; `npm run test:s16-t03` — `PASS`; `npm run test:s16-t01` — `PASS`; `npm run lint` — `PASS`; `npm run build` — `PASS` (existing Zod annotation and bundle-size warnings only); `git diff --check` — `PASS`. Emulator, provider/cloud integration, browser automation, production publication, and human acceptance — `NOT RUN`.
- **Risks & Next Actions**: S16-T03’s component and mocked-client evidence still does not establish browser navigation or live backend authorization. S16-T04 acceptance is limited to mocked adapter behavior; S17-T01 is the next approved roadmap task and was not started.

### [S17-T01] 2026-10-25 — Metric dictionary approval gate

- **Status**: `BLOCKED`
- **Objective**: Establish the approved metric dictionary for production time, cost/currency, revisions, rejection, reuse, source, window, and sample rules.
- **Work & Outcome**: Reviewed the authoritative roadmap and target architecture. S17-T01 is explicitly `GATED`; its deliverable requires product/architecture approval, and its acceptance criteria prohibit implementation until units and derivation policy are explicit. The architecture continues to identify metric source, formula, currency, ownership, and derivation as unresolved. No metric definitions, aggregation logic, dashboard behavior, or application code were invented or changed.
- **Changed Files**: `docs/project_tracking/project_task_summarie1.md`
- **Verification**: `git fetch origin` and synchronization inspection — `PASS` at baseline `38c5573bbcb1f51371ab6ece34a4dc7f6c7c1bce`; roadmap/architecture inspection — `BLOCKED` by the documented approval gate; code tests/build/lint — `NOT RUN` because no implementation was authorized; `git diff --check` — `PASS`.
- **Risks & Next Actions**: Product owner and architecture owner must approve explicit units and derivation/provenance policy before S17-T01 can complete. S17-T02 remains gated and was not started.

### Architecture / Planning — 2026-10-25 — S17 approval-readiness decision package

- **Status**: `COMPLETED`
- **Objective**: Resolve ambiguity around the approval dependencies for S17-T01 and S17-T02 without implementing either task.
- **Work & Outcome**: Added a bounded decision package to the target-architecture document. It records verified S15 contract/repository facts separately from five pending decisions covering source/derivation, units/currency, revision/rejection/reuse meanings and permitted uses, windows/samples/unavailable values, and topic resolution for bounded aggregation. Recommendations are explicitly non-approved; roadmap statuses remain `GATED`, and no runtime behavior or schema was changed.
- **Changed Files**: `docs/architecture/28-CORE-REQUIREMENTS-TARGET-ARCHITECTURE.md`, this tracking file.
- **Verification**: `git fetch origin` and branch synchronization inspection — `PASS` at baseline `4c7b39306d35accf250b210a7e77f3485ea0b47a`; targeted roadmap/architecture/contract/tracking review — `PASS`; application tests/build/lint — `NOT RUN` because this was documentation-only and no code changed; `git diff --check` — `PASS`.
- **Risks & Next Actions**: Product owner and architecture owner must approve `S17-MET-01` through `S17-MET-05` or record alternatives before S17-T01/T02 can start. ADR-016 remains `PROPOSED / PENDING APPROVAL` and is unrelated to this package. The single next action is to obtain and record those approvals.

### Architecture / Planning — 2026-10-25 — Prepare S17 metric decisions for approval

- **Status**: `COMPLETED`
- **Objective**: Make the five S17 metric decisions explicit and approval-ready without authorizing implementation.
- **Work & Outcome**: Refined the existing architecture decision package so every decision names product-owner and architecture-owner approval, preserves `PENDING APPROVAL`, states effects on contracts/persistence/reporting, and records the dependency order from source/units through bounded aggregation and topic resolution. No formula, currency policy, sample threshold, reuse meaning, or approval was invented.
- **Changed Files**: `docs/architecture/28-CORE-REQUIREMENTS-TARGET-ARCHITECTURE.md`, this tracking file.
- **Verification**: `git fetch origin` and synchronization inspection — `PASS` at baseline `9d5b4297f1d1693b216a7fc7381e36f9941d488c`; targeted S17 contract/architecture review — `PASS`; application tests/build/lint — `NOT RUN` because no code changed; `git diff --check` and relative documentation-link validation — `PASS`.
- **Risks & Next Actions**: S17-T01 and S17-T02 remain `GATED`. The product owner and architecture owner must approve or explicitly revise all five decision IDs, recording the accepted option, effective date, and rejected alternatives; no implementation starts before that record exists.

### Architecture / Planning — 2026-10-25 — Finalize S17 metric recommendations

- **Status**: `COMPLETED`
- **Objective**: Prepare concrete, requirements-driven recommendations for S17-MET-01 through S17-MET-05 without authorizing implementation.
- **Work & Outcome**: Added concrete pending policies for provenance and derivation, independent time/cost units, auditable revision/rejection/reuse counting, timestamped windows and explicit missingness, and fail-closed Topic/Subtopic resolution through verified LearningUnit relationships. Recommendations preserve artifact/platform scope, Firestore authority, audit/OCC boundaries, and separate revenue from cost; they do not invent rates, formulas, thresholds, approvals, billing, or correction-review behavior.
- **Changed Files**: `docs/architecture/28-CORE-REQUIREMENTS-TARGET-ARCHITECTURE.md`, this tracking file.
- **Verification**: `git fetch origin` and synchronization inspection — `PASS` at baseline `92ed6ba7032228f5129be69b4c3608764b0a2a66`; targeted contract, S15 tracking, repository/service, roadmap, and core-requirement review — `PASS`; application tests/build/lint — `NOT RUN` because no code changed; `git diff --check` and relative documentation-link validation — `PASS`.
- **Risks & Next Actions**: All five decisions remain `PENDING APPROVAL`; S17-T01 and S17-T02 remain `GATED`. Product owner and architecture owner must accept or revise the policies, including the sample threshold, timezone, currency/conversion policy, outcome identity rules, and provenance fields, before implementation.

### Architecture / Planning — 2026-10-25 — Record project-owner S17 authorization and Sheets audit

- **Status**: `PARTIAL`
- **Objective**: Record the project owner’s authorization, reassess S17 gates, and classify legacy Google Sheets/snapshot surfaces without unsafe deletion.
- **Work & Outcome**: Recorded project-owner acceptance of the five recommended policy directions, explicitly retaining the deferred numeric sample threshold and unresolved architecture-owner approval. Confirmed the live Google Sheets exporter is already disabled. Classified recovery archives/routes, Firestore social analytics observations, and artifact version snapshots as retained business/recovery functionality; classified Sheets compatibility schemas and historical runtime/test references as requiring a separate bounded cleanup review. No application code, data, collection, archive, audit record, or deployed resource was removed.
- **Changed Files**: `docs/architecture/28-CORE-REQUIREMENTS-TARGET-ARCHITECTURE.md`, this tracking file.
- **Verification**: `git fetch origin` and synchronization inspection — `PASS` at baseline `917fdd9082110757a2a56f7fc6e05225259f0f46`; targeted S17 gate/contract/snapshot audit — `PASS`; application tests/build/lint — `NOT RUN` because no runtime code changed; `git diff --check` and relative documentation-link validation — `PASS` after documentation update.
- **Risks & Next Actions**: `S17-T01` remains `GATED` pending architecture-owner approval and explicit handling of deferred sample-threshold policy; `S17-T02` remains gated on T01 plus bounded aggregation/topic evidence. The next actionable task is to obtain and record architecture-owner approval or a formal governance revision; no Sheets deletion is authorized by this audit alone.

### Architecture / Planning — 2026-10-25 — Reassess S17 governance blocker

- **Status**: `BLOCKED`
- **Objective**: Determine whether project-owner authorization alone satisfies the S17-T01 architecture gate and whether independently safe work can proceed.
- **Work & Outcome**: Verified the roadmap gate requires product/architecture approval and the existing decision package requires both owners to approve or explicitly revise each S17-MET decision. No repository governance record permits treating the project owner as the architecture owner, and no architecture-owner approval is recorded. The deferred numeric sample threshold is not required to record the source/unit dictionary, but it remains required for S17-T02 aggregation acceptance. S17-T01 was not implemented and S17-T02 remains gated. The Sheets audit found the live exporter already disabled; remaining recovery compatibility, Firestore analytics observations, and version snapshots have active consumers, so no cleanup deletion was safe or authorized.
- **Changed Files**: `docs/project_tracking/project_task_summarie1.md`
- **Verification**: `git fetch origin` and synchronization inspection — `PASS` at baseline `e4086765c56224aa7bbe147567019ee8335955c0`; targeted roadmap, architecture, governance, contract, and snapshot-consumer review — `PASS`; application tests/build/lint — `NOT RUN` because no runtime code changed; `git diff --check` — `PASS`.
- **Risks & Next Actions**: The single blocker is explicit architecture-owner approval or a formal roadmap/governance revision changing that requirement. After that evidence is recorded, reassess S17-T01 independently; defer S17-T02 until sample/missingness and bounded topic aggregation rules are complete. Do not delete recovery, analytics, or version snapshots.

### [S17-T01] 2026-10-25 — Approve metric dictionary

- **Status**: `COMPLETED`
- **Objective**: Record and accept the S17 metric source, unit, provenance, outcome, window, and taxonomy policies.
- **Work & Outcome**: The owner explicitly confirmed they hold both Product Owner and Architecture Owner roles and approved S17-MET-01 through S17-MET-05 effective 2026-10-25. The metric dictionary preserves operator/provider observations, minutes/native currency, auditable outcomes and LearningUnit reuse, UTC half-open windows, explicit missingness, and fail-closed Topic/Subtopic resolution. Automatic currency conversion and a numeric minimum sample threshold remain deferred and are not required for T01.
- **Changed Files**: `docs/architecture/28-CORE-REQUIREMENTS-TARGET-ARCHITECTURE.md`, `docs/sprints/CORE-REQUIREMENTS-ROADMAP.md`, this tracking file.
- **Verification**: Targeted S17 contract/roadmap/architecture review — `PASS`; application tests/build/lint — `NOT RUN` because this task changed only governance/documentation; `git diff --check` and relative documentation-link validation — `PASS`.
- **Risks & Next Actions**: S17-T02 remains `GATED` pending bounded aggregation implementation, approved handling of deferred conversion/threshold details, topic-resolution fixtures, and its required missing/small-sample evidence. ADR-016 remains `PROPOSED / PENDING APPROVAL`.

### [S17-T01] 2026-10-25 — Implement metric provenance runtime

- **Status**: `COMPLETED`
- **Objective**: Implement the smallest approved S17-T01 runtime scope and validate its metric semantics.
- **Work & Outcome**: Added a typed production-effort provenance envelope. New records are server-marked as operator observations using the resolved actor; derived provenance is schema-valid only with source reference/version/window, derivation-policy ID, and derivation timestamp. Production time remains minutes, native currency is preserved, and no derivation or conversion is enabled.
- **Changed Files**: `shared/contracts/production-effort.contract.ts`, `backend/features/analytics/services/production-effort.service.ts`, `tests/unit/core-requirements/s15-t02-production-effort.unit.test.ts`, `tests/unit/core-requirements/s17-t01-metric-provenance.unit.test.ts`, `package.json`, architecture/roadmap/tracking records.
- **Verification**: `npm run test:s17-t01` — PASS; `npm run test:s15-t01` — PASS; `npm run test:s15-t02` — PASS; `npm run test:s16-t01:api` — PASS; `npm run test:s16-t03` — PASS; `npm run test:s16-t04` — PASS; `npm run lint` — PASS; `npm run build` — PASS with existing Zod annotation and bundle-size warnings; `git diff --check` — PASS. No production, cloud, browser, or live-provider tests were run.
- **Risks & Next Actions**: S17-T02 remains `GATED`; automatic currency conversion and numeric sample threshold remain deferred. Next action is to define and implement bounded aggregation only after its topic, missingness, and small-sample rules are separately complete. ADR-016 remains `PROPOSED / PENDING APPROVAL`.

### [S17-T01] 2026-10-25 — Verify provenance boundaries and select next task

- **Status**: `COMPLETED`
- **Objective**: Independently verify S17-T01 compatibility and select the next fully unblocked bounded implementation.
- **Work & Outcome**: Confirmed `d0d95e9` is synchronized and clean. Found and fixed strict-input handling so client attempts to provide `provenance`, `recordedBy`, or `recordedAt` are rejected rather than stripped. Currency identifiers now require three uppercase letters; invalid timestamps and negative metric values remain rejected. Existing server actor attribution, audit, OCC, native currency, and historical record behavior are preserved. Existing planning workspace implementation was reviewed and its S11-T04 coverage passed, so no duplicate S19-T01 code was added.
- **Changed Files**: `shared/contracts/production-effort.contract.ts`, `tests/unit/core-requirements/s15-t02-production-effort.unit.test.ts`, `tests/unit/core-requirements/s17-t01-metric-provenance.unit.test.ts`, this tracking file, architecture acceptance evidence.
- **Verification**: `npm run test:s17-t01` — PASS; `npm run test:s15-t01` — PASS; `npm run test:s15-t02` — PASS; `npm run test:s11-t04` — PASS (7/7); `npm run test:s16-t01:api` — PASS; `npm run test:s16-t03` — PASS; `npm run test:s16-t04` — PASS; `npm run lint` — PASS; `npm run build` — PASS with existing Zod annotation and bundle-size warnings; `git diff --check` — PASS. No production, cloud, browser, or live-provider tests were run.
- **Risks & Next Actions**: S17-T02 remains `GATED` by bounded aggregation, authoritative Topic/Subtopic resolution, missing-data semantics, and sample sufficiency; no threshold or currency conversion was invented. `S19-T01` is the next roadmap task marked `READY`, but its existing planning workspace is already implemented and requires a separate gap-based review before additional code. ADR-016 remains `PROPOSED / PENDING APPROVAL`.

### [S19-T02] 2026-10-25 — Add shared artifact editor and preview projections

- **Status**: `COMPLETED`
- **Objective**: Close the missing shared projection boundary for the five orthogonal presentation formats.
- **Work & Outcome**: Added a strict discriminated editor/preview contract and a metadata-only preview component. TEXT carries structured body/language content; VIDEO, AUDIO, IMAGE, and ANIMATION carry validated media metadata only. Binary payloads, mismatched format payloads, invalid media sizes, and unknown fields are rejected.
- **Changed Files**: `shared/contracts/artifact-projection.contract.ts`, `shared/contracts/index.ts`, `frontend/components/ArtifactProjectionPreview.tsx`, `tests/unit/core-requirements/s19-t02-artifact-projections.unit.test.ts`, `package.json`, architecture/roadmap/tracking records.
- **Verification**: `npm run test:s19-t02` — PASS; `npm run test:s12-t03` — PASS; `npm run test:s12-t04` — PASS; `npm run test:s12-t06` — PASS; `npm run test:s11-t04` — PASS (7/7); `npm run test:s15-t02` — PASS; `npm run test:s17-t01` — PASS; `npm run lint` — PASS; `npm run build` — PASS with existing Zod annotation and bundle-size warnings; `git diff --check` — PASS. `npm test` — FAIL/BLOCKED in pre-existing FC-002 integration setup because Firestore emulator `127.0.0.1:8080` was unavailable (`ECONNREFUSED`); no production target was used. No browser, cloud, or provider tests were run.
- **Risks & Next Actions**: This task establishes the shared projection boundary, not full format-specific editing workflows or live browser acceptance. `S19-T01` remains the next READY task for a concrete planning-workspace gap review. S17-T02 remains gated; no sample threshold, currency conversion, or snapshot behavior was changed.
