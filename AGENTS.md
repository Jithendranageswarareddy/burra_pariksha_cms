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

## 2. Production safety and code-level-only testing

### 2.1 Live environment is not an IDE test environment

- The production website, production API, production Firestore database
  (`ai-studio-burraparikshacon-f592ca42-39af-4d83-aff2-6870ba939b0e`),
  production Google Sheets, production Google Drive, production Google Cloud
  Storage, and all connected external services are strictly owner-controlled
  resources operating under free-tier constraints.
- The IDE agent (including Antigravity, subagents, and any coding/testing agents)
  must not use the live environment for exploratory testing, automated browser
  testing, routine verification, or repeated health checks.
- The IDE agent must not log in to the live website, navigate through production
  workflows, submit forms, generate questions, create drafts, edit records,
  approve content, delete records, upload files, or trigger workflow
  transitions as part of testing.
- Do not perform CRUD operations against production data for convenience, test
  coverage, debugging, demonstrations, or regression tests.
- Do not run tests that create temporary production users, questions, drafts,
  videos, audit records, analytics, or other entities.
- Do not run repeated health checks or integrity scans that consume production
  database reads or API quotas.
- Do not call production AI generation endpoints (`@google/genai` Gemini API)
  merely to prove that generation works.
- Do not publish, synchronize, or upload content to real external platforms as
  part of testing.
- The owner will manually verify the live website and will report observations,
  screenshots, logs, error messages, or network traces for code-level diagnosis.

### 2.2 Explicit authorization is required for live tests

- A live test may be performed only when the owner explicitly authorizes the
  particular operation.
- Authorization must specifically identify the intended environment, the action
  or test, and the permitted scope. A general request to improve the
  application, test the workflow, fix defects, or prepare for launch does not
  authorize live testing.
- Even when authorized:
  - Perform only the specifically approved action.
  - Do not expand the test to other production operations.
  - Avoid destructive operations unless separately and explicitly authorized.
  - Confirm likely resource usage and external side effects before proceeding.
  - Stop immediately if the actual target differs from the approved target.
  - Report what was performed and what was not performed.
- Do not interpret approval for a code change or a local test as approval for
  production operations.

### 2.3 Allowed code-level verification

Prefer the following methods, in order of suitability:

1. Static code inspection and repository searches.
2. TypeScript type checking, linting, and production builds (`npm run lint`,
   `npm run build`).
3. Unit tests with deterministic mocks and fixtures.
4. Domain-service and workflow-state tests with mocked repositories.
5. API contract tests against an isolated test server and in-memory or mocked
   dependencies.
6. Component tests that do not contact production services.
7. Architecture, authorization, RBAC, taxonomy, workflow-transition,
   concurrency, and regression tests using isolated fixtures.
8. Emulator-based integration tests only after confirming that all writes are
   confined to the intended emulator.
9. Local end-to-end tests against a dedicated local environment using synthetic
   data, mocked external services, and explicit database-target safeguards.

Prefer existing scripts that are known to be safe. Inspect a test's setup,
teardown, fixtures, environment variables, and external dependencies before
executing it. A test is not safe merely because its filename includes `unit`,
`integration`, `E2E`, `test`, or `isolation`.

### 2.4 Mandatory test-environment isolation checks

Before running any test that could write data or call external services:

- Inspect the test command and its transitive setup scripts.
- Determine the effective database project and database ID.
- Determine whether the test uses an emulator, mocks, a local database, a
  remote test project, or production.
- Inspect initialization and cleanup code, including `beforeAll`, `afterAll`,
  `beforeEach`, `afterEach`, and `finally` blocks.
- Check whether the test sends real AI requests, emails, notifications,
  storage operations, analytics events, or publishing requests.
- Confirm that environment variables and credentials cannot silently redirect a
  test to production.
- Confirm that missing emulator configuration or an unrecognized target causes
  the test to fail closed before any mutation.
- Prefer disabling network access or mocking outbound integrations when
  practical.
- If the effective target cannot be established, do not execute the test.
  Inspect the code and report the uncertainty instead.
- Never assume that a test project is isolated simply because its name contains
  `test`.

### 2.5 Resource and free-tier conservation

- Minimize database reads and writes, external API requests, build repetitions,
  and long-running processes.
- Do not run the same expensive suite repeatedly without a concrete reason.
- Avoid live AI inference, bulk generation, repeated polling, recursive
  collection scans, and unnecessary integrity checks.
- Reuse test fixtures and local results where appropriate.
- Prefer targeted tests for a changed module, followed by the minimum required
  regression suites.
- Do not add paid services, enable billing, change quotas, or incur new
  recurring costs without the owner's explicit approval.
- Do not claim that a budget alert imposes a hard spending limit.
- Report when a test would consume an external API quota or incur a possible
  charge, and choose a mocked alternative by default.

### 2.6 No destructive data maintenance by default

- Never wipe collections, reset production data, delete production records,
  remove production files, or clean production spreadsheets as part of routine
  testing.
- Do not delete backups, snapshots, audit history, administrator records,
  taxonomy, configuration, or operational records without explicit
  authorization.
- Do not perform migrations, bulk updates, credential rotation, project
  changes, database recreation, or production cleanup merely because they seem
  useful.
- Data cleanup and production maintenance must be treated as separate,
  explicitly authorized tasks with a verified target, reviewed manifest, and
  recovery plan.

### 2.7 No automatic deployment or publication

- Do not deploy the application, modify DNS, change production environment
  variables, alter production security rules, or publish content as a side
  effect of tests.
- Do not run production migrations or infrastructure changes without separate
  explicit authorization.
- A successful build or passing test suite is not permission to deploy.
- Preserve the existing production deployment unless the owner explicitly asks
  for a deployment operation.

### 2.8 Evidence-based reporting

Every test report must distinguish:

- `PASS` — the exact test ran and its assertions passed.
- `FAIL` — the test ran and one or more assertions failed.
- `BLOCKED` — the test could not safely run because a prerequisite or safe
  target was unavailable.
- `NOT TESTED` — the test was not executed.
- `NOT VERIFIED` — the available evidence does not establish the claim.

Reports must identify the exact command, environment, scope, and result.
Never claim to have manually tested the live UI if no browser interaction
occurred. Never infer UI correctness from API tests, component tests, source
inspection, or a successful build. Never claim production persistence or live
integrations work based solely on mocks. Clearly distinguish code-level
confidence from owner-verified production behavior.

### 2.9 Application to the BP-CMS 15-stage workflow

The canonical workflow remains:

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

Across all three content modes:
- Question Challenge Short
- Topic Introduction
- Explained Questions Video

Apply these invariants:
- Test workflow rules, state transitions, validation, authorization,
  concurrency, and persistence contracts strictly at the code level.
- Use synthetic fixtures and mocked repositories or isolated emulators.
- Verify that Save Draft remains distinct from Submit for Verification.
- Preserve GAR-02 anti-self-approval (`authorId !== approverId`).
- Preserve backend-owned authorization and workflow enforcement.
- Preserve optimistic concurrency controls and audit invariants.
- Preserve Topic -> Subtopic taxonomy.
- Ensure internal reviewer notes and operational metadata cannot leak into
  audience-facing output.
- Preserve regression coverage across all three modes.
- Use mocked or sandboxed publishing, synchronization, and analytics
  integrations.
- Do not create a new question or perform any of the 15 workflow stages on the
  production website.
- Do not call the live production website merely to confirm a stage's
  functionality.
- The owner will manually run the live 15-stage journey using a new question
  and report issues. The IDE agent diagnoses issues from supplied screenshots,
  logs, error messages, network traces, and relevant source code, then
  implements and tests code fixes in isolation.

## 3. Scope-first execution

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

## 4. Verification policy

State a short pre-test decision before running checks: changed scope, selected
commands, rationale, and intentionally omitted broader checks.

All verification must strictly adhere to Section 2 (Production safety and
code-level-only testing). Before running any test that could write data or call
external services, execute the mandatory isolation checks in Section 2.4. If
safe isolation cannot be verified, the test must not run.

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

## 5. Task closure

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

## 6. Project documentation and task tracking

Documentation concerns are strictly separated:

- **Architecture documents (`docs/architecture/`)**: System design, boundaries,
  target architecture models, database schemas, API contracts, and ADRs.
- **Sprint documents (`docs/sprints/`)**: Work breakdown, active scope, milestone
  goals, and sprint-level retrospective outcomes.
- **Project task tracking (`docs/project_tracking/`)**: Chronological summaries of
  actual task execution, verification results, and immediate next actions.

### 6.1 Task tracking files and naming convention

- The initial task tracking file is
  `docs/project_tracking/project_task_summarie1.md`. Preserve this exact
  filename.
- Each tracking file contains at most 100 entries, sequentially numbered from
  `001` to `100`.
- When a file reaches 100 entries, start a new numbered summary file following
  the sequence: `docs/project_tracking/project_task_summarie2.md`,
  `project_task_summarie3.md`, etc.
- Do not invent, backfill, or summarize historical tasks retrospectively.

### 6.2 Compact entry format

Every completed or attempted task appends a concise entry using this format:

```markdown
### [TASK-XXX] YYYY-MM-DD — <Short Task Title>

- **Status**: `COMPLETED` | `PARTIAL` | `BLOCKED` | `NOT COMPLETED`
- **Objective**: <Concise 1-line summary of requested goal>
- **Work & Outcome**: <Summary of concrete changes and operational results>
- **Changed Files**: <List of modified, staged, or created files; commit SHA if committed>
- **Verification**: <Exact commands executed and evidence-backed results (PASS / FAIL / NOT TESTED)>
- **Risks & Next Actions**: <Unresolved risks, safe-target caveats, or immediate follow-ups>
```

### 6.3 Tracking integrity rules

- Record only evidence-backed facts. Never mark a task `COMPLETED` if a command
  did not finish or assertions failed.
- Do not copy full logs, paste server secrets, or duplicate architecture or
  sprint planning documents into task entries.
- Maintain tracking updates alongside the task diff; stage tracking entries only
  when the task is verified.
