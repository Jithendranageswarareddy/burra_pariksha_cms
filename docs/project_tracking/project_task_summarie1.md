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
