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
