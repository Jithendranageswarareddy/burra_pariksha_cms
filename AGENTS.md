# BP-CMS Engineering Policy

This file is the default execution policy for repository tasks. Keep routine work
focused, evidence-based, and small. The navigation map is
[docs/ENGINEERING-INDEX.md](docs/ENGINEERING-INDEX.md).

## 1. Authority and non-negotiable invariants

Use this order when sources disagree:

1. Verified production code and automated tests.
2. Current architecture decisions and contracts.
3. Operational policies and active sprint requirements.
4. Historical sprint records, for provenance only.

The following rules remain mandatory:

- Cloud Firestore is the sole authoritative transactional datastore. Repositories
  own persistence mechanics; domain services own business rules.
- Frontend code communicates through typed API clients and never imports
  Firestore, Firebase Admin, backend services, server secrets, or AI providers.
  Backend code never imports React presentation code. Shared code stays
  framework- and secret-free.
- Taxonomy is exactly Topic -> Subtopic. Category is obsolete and must not be
  introduced into new runtime code, schemas, APIs, UI, or documentation.
- IDs use the collision-resistant UUID generators in `shared/lib/id.service.ts`.
  Do not add sequence counters, allocation collections, or repair systems.
- The backend owns the canonical 15-stage workflow, validation gates, RBAC,
  optimistic concurrency, and immutable audit trail.
- GAR-02 is strict: an artifact author cannot approve that artifact
  (`authorId !== approverId`). AI is advisory and never approves silently.
- SAVE DRAFT and SUBMIT FOR VERIFICATION are separate operations. Saving must
  not advance workflow state or trigger verification.
- Never reset, purge, seed, or migrate production Firestore data or external
  content during normal development. Tests must use mocks, emulators, or
  isolated synthetic records.

## 2. Scope-first execution

Before editing:

1. Classify the task: documentation-only, isolated UI/utility, shared
   contract/API, backend workflow/RBAC/persistence, or broad release work.
2. Identify the authoritative contract and acceptance criteria.
3. Inspect only the relevant feature slice and direct dependencies. Do not
   generate a repository-wide inventory for routine feature work.
4. Read historical sprint records only when the current task depends on them.
   Consult architecture documents when a boundary or unresolved decision is
   involved.
5. Ask for clarification only when an unresolved ambiguity blocks safe work.

Implement the smallest correct change. Reuse existing components, services,
contracts, and tests. Do not refactor unrelated code, rewrite historical
documentation, or add speculative compatibility layers.

## 3. Verification policy

State a short pre-test decision before running checks: changed scope, selected
commands, rationale, and intentionally omitted broader checks.

| Scope | Required verification |
| --- | --- |
| Documentation-only | Review exact diff; `git diff --check` |
| Isolated UI/utility | Focused test and applicable static check |
| Shared types/API/contracts/config | `npm run lint`; relevant contract test; `npm run build` when compilation or bundling may change |
| Backend workflow/RBAC/persistence | Relevant auth/RBAC/workflow/database regression test; `npm run lint`; `npm run build` |
| Broad release or explicitly requested full validation | `npm run test:architecture`, relevant regression suites, `npm run lint`, and `npm run build` |

Use the command map in [docs/TESTING-GUIDE.md](docs/TESTING-GUIDE.md). Run each
selected check once and reuse its result while the relevant files and
environment are unchanged. Never report a check, CI result, or runtime behavior
without evidence. Do not weaken assertions or make every routine task run the
full suite.

## 4. Task closure

Use this lightweight checklist:

**Classify -> inspect relevant files -> implement minimal diff -> state the
pre-test decision -> run required checks once -> review diff and status ->
commit/push only when authorized -> report evidence.**

Every report states:

- what changed and the exact files;
- checks actually run and their results;
- commit SHA and remote synchronization state when applicable;
- unresolved blockers or intentionally deferred work.

For Git synchronization, follow
[docs/operations/GIT-SYNC-PROTOCOL.md](docs/operations/GIT-SYNC-PROTOCOL.md):
fetch before deciding, never force-push or blindly resolve conflicts, stage only
task files, and verify `HEAD == origin/main` plus a clean tree after an
authorized push. Do not overwrite concurrent work.
