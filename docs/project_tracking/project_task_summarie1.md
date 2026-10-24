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
