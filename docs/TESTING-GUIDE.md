# Testing Guide

The repository uses direct `tsx` scripts with Node assertions; it does not use
Vitest, Jest, or a test-discovery runner. Choose the narrowest command that
covers the changed behavior.

## Common commands

| Change area | Command |
| --- | --- |
| TypeScript type safety | `npm run lint` |
| Frontend/backend compilation and bundling | `npm run build` |
| Authentication/session behavior | `npm run test:auth` |
| RBAC/capabilities | `npm run test:rbac` |
| API and persistence boundaries | `npm run test:db-api` |
| Audit logging | `npm run test:audit` |
| Workflow transitions and GAR-02 | `npm run test:workflow` |
| Question generation and draft/verify separation | `npm run test:question-generation` |
| Frontend/backend architecture boundaries | `npm run test:architecture` |
| Runtime regression coverage | `npm run test:s7-t19` |
| All five foundational integration tests | `npm test` |

Additional `test:s*` scripts in `package.json` map directly to their named
Sprint 2, 4, or 8 test files. Use them only when that sprint behavior is in
scope.

## Sprint 11 datastore verification

| Verification tier | Command | Datastore target and evidence |
| --- | --- | --- |
| S11 in-memory unit suite | `npm run test:s11-unit` | Runs S11-T01 through S11-T06 sequentially with repository/service doubles; no datastore access. |
| S11-T02 Firestore integration | `npm run test:s11-t02:emulator` | Starts a disposable Firestore emulator for synthetic project `burra-pariksha-test`, runs the integration test, and tears the emulator down. |
| Direct S11-T02 integration | `npm run test:s11-t02:integration` | Only valid when a loopback emulator is already listening on `127.0.0.1:8080`; the test probes the host and fails closed before writes when unavailable. |
| S12-T01/S12-T02/S12-T03 focused unit suites | `npm run test:s12-t01`, `npm run test:s12-t02`, `npm run test:s12-t03` | Deterministic validators and TEXT/IMAGE contracts use in-memory doubles; no Firestore, Drive, or external service access. |
| S12-T04 focused unit suite | `npm run test:s12-t04` | AUDIO/ANIMATION contracts and mocked Drive orchestration; validates MIME, extension, size, Learning Unit linkage, and metadata-only output without external service access. |
| S12-T05 synthetic vertical slice | `npm run test:s12-t05` | Builds one synthetic percentages/discounts lesson across all three canonical modes and five formats, with deterministic calculations, Stage 02 quality checks, Learning Unit linkage, and mocked Drive metadata for binary formats. |
| S12-T06 compatibility matrix | `npm run test:s12-t06` | Covers all 15 backend-authoritative mode/format decisions, rejects invalid modes/formats, and proves legacy `EXPLAINED_QUESTIONS_VIDEO` normalization without rewriting stored data. |
| S13-T01 transition authority | `npm run test:s13-t01` | Exercises the canonical 15-step matrix, invalid-step fail-closed behavior, canonical/legacy worked-examples prerequisite resolution, and illegal-transition rejection using in-memory assertions only. |
| S13-T02 mode-aware prompts | `npm run test:s13-t02` | Verifies practical-math, everyday-money, and decision-scenario prompt guidance, legacy mode normalization, injection sanitization, and advisory/provenance metadata contracts without calling Gemini. |
| S13-T03 product pipeline mapping | `npm run test:s13-t03` | Verifies the pure Discover-to-Improve mapping over LearningUnit planning and all canonical stages 01–15, including verification, publish, measure, improve, and revision re-entry semantics. |
| S13-T04 linked LearningUnit context | `npm run test:s13-t04` | Verifies linked context propagation into script/teleprompter and downstream media/publication correlation while excluding LearningUnit IDs and staff/planning metadata from audience-facing prompts. |
| S13-T05 mutation route security matrix | `npm run test:s13-t05` | Inventories every POST/PUT/PATCH/DELETE declaration in the primary and modular routers (152 declarations), records authentication/authorization/actor-boundary PASS results, preserves public auth and non-mutating POST exceptions, and guards the previously unprotected script-history route. |
| S13-T06 linked video emulator acceptance | `npm run test:s13-t06` | Starts a disposable `burra-pariksha-test` Firestore emulator, persists a synthetic LearningUnit-linked question/video path, advances a canonical workflow, verifies immutable history, emulator-backed audit events, stale OCC rejection, and deletes only the run's synthetic records. Drive and AI remain metadata-only mocks. |

The S12-T06 matrix marks every canonical pair as `SUPPORTED` because the
requirements make presentation formats orthogonal to content modes. This is a
contract/linkage decision, not a claim that every pair is automatically
generated, rendered, or published. The legacy identifier remains readable and
write-compatible; callers normalize it only when evaluating canonical
compatibility.

S13-T01 keeps entity-local status machines (question, video production,
assignment, and content-master lifecycles) subordinate to their own aggregate
boundaries. They are not alternate definitions of the canonical 15-stage
workflow. Workflow-instance callers use `WorkflowEngine`, which performs the
single transition lookup through `transition-matrix.ts`.

S13-T05's route matrix is a deterministic source-level boundary audit. It does
not treat frontend visibility as authorization: mutation routes must have an
explicit role/capability/authentication boundary or be covered by the
router-wide authenticated boundary. Public authentication lifecycle endpoints
and POST endpoints that only resolve or generate advisory data are recorded as
intentional exceptions. OCC, immutable audit, ownership, and GAR-02 remain
service/domain responsibilities and are not weakened by the route-level audit.

S13-T06 is the first emulator-backed acceptance path for linked video content.
The test must fail closed unless the datastore guard resolves to the
`burra-pariksha-test` Firestore emulator on loopback. Its audit adapter uses the
same Admin SDK emulator target as domain repositories; no Drive upload, Gemini
request, publishing call, or production datastore access is permitted.

The S11 emulator command is intentionally wrapped by `firebase-tools
emulators:exec`; it must not be replaced with a command that points at a
configured cloud project. The integration fixture uses unique identifiers,
`testOnly: true`/`environment: 'TEST'` markers, and removes only records
created by that run. A successful unit run is not emulator evidence, and a
successful build is not type-check or persistence evidence.

## Production safety and selection rules

**MANDATORY**: All testing must strictly adhere to the Production Safety and
Code-Level-Only Testing Policy in [AGENTS.md](../AGENTS.md).
- The website is live under free-tier resource constraints. The live production
  environment, live Firestore database, external storage, and third-party APIs
  are strictly owner-controlled and owner-tested.
- IDE agents must never run tests against the live website, execute CRUD against
  production data, call live AI generation endpoints for testing, or deploy code.
- Before executing any test that could write data or make network calls, run the
  mandatory isolation checks (AGENTS.md Section 2.4). If isolation to a local
  mock or emulator cannot be verified, the test must not run.

### Selection rules

- Documentation-only: inspect the diff and run `git diff --check`; no build or
  test is needed.
- Leaf UI/utility: run its focused test and a static check if types changed.
- Shared contracts/API/config: run `npm run lint`, the relevant contract test,
  and `npm run build` when compilation or bundling can be affected.
- Backend workflow, RBAC, auth, or persistence: run the relevant focused
  regression test (with verified mocks/emulator), `npm run lint`, and `npm run build`.
- Use `npm test` and broader suites only for release work, cross-cutting
  changes, or an explicit request.

Run each selected command once. Rerun only after a relevant edit or to diagnose
the specific failure.
### S14-T01 related-artifact sequence

Run `npm run test:s14-t01` to verify the protected read-model behavior without
contacting Firestore or external services. The deterministic test covers the
preferred Intro -> Worked Examples -> Challenge ordering, artifacts with no
mode, alternate-format filtering, and bounded page metadata. The sequence API
is read-only and reuses the existing LearningUnit ownership/status validation.

### S14-T02 editorial calendar

Run `npm run test:s14-t02` to verify the operational calendar projection with
Topic, Subtopic, mode, format, audience, and planning-status filters. The test
also verifies legacy `EXPLAINED_QUESTIONS_VIDEO` normalization to
`WORKED_EXAMPLES`, deterministic ordering, pagination, and omission of OCC and
author metadata. The protected `GET /planning/editorial-calendar` endpoint
reads existing LearningUnit planning records and does not create calendar
records or alter workflow state.

### S15-T01 performance contracts

Run `npm run test:s15-t01` to validate the audience-performance and
learning-engagement contract shapes. Metrics are discriminated as
`AVAILABLE` values or explicit `UNAVAILABLE` reasons, preventing missing
provider data from being interpreted as zero learning or audience performance.
This is a pure contract test and performs no analytics persistence or provider
access.

### S15-T02 production effort

Run `npm run test:s15-t02` to verify explicit artifact/platform production-effort
records. The focused test covers actor attribution, independent persistence
identity, explicit metric values, role rejection, invalid metric input, and
optimistic-concurrency updates. Production time, cost, revision, rejection, and
reuse values are observations supplied by an authorized operator; the service
does not infer them from workflow history or audience analytics. Missing values
must use the S15-T01 `UNAVAILABLE` metric form.
