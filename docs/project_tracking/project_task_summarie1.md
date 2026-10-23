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
