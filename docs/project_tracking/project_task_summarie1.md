# Project Task Summaries — File 1 (Tasks 001–100)

Chronological record of actual task executions in accordance with [AGENTS.md](../../AGENTS.md) Section 6.

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
