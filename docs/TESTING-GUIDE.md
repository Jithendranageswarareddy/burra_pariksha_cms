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
scope. Firestore integration scripts require the repository's configured test
environment; do not point them at production data.

## Selection rules

- Documentation-only: inspect the diff and run `git diff --check`; no build or
  test is needed.
- Leaf UI/utility: run its focused test and a static check if types changed.
- Shared contracts/API/config: run `npm run lint`, the relevant contract test,
  and `npm run build` when compilation or bundling can be affected.
- Backend workflow, RBAC, auth, or persistence: run the relevant focused
  regression test, `npm run lint`, and `npm run build`.
- Use `npm test` and broader suites only for release work, cross-cutting
  changes, or an explicit request.

Run each selected command once. Rerun only after a relevant edit or to diagnose
the specific failure.
