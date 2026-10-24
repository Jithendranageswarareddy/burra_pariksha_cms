# Blocked TypeScript Upgrade Diagnostic Report

## Scope and repository state

- Investigated branch: `modernize/typescript-20261024104506`
- Baseline branch: `main` at `e9af868`
- Investigation commit: `24d5f6f`
- No package manifest versions were changed and no upgrade group was started.
- `git diff main...HEAD --name-status` reports only:
  - `.tsupgrader/runtime-validation/baseline-result.json`
  - `.tsupgrader/runtime-validation/eval-plan.json`
  - `package-lock.json`
- The lockfile change adds missing Firebase root/package records produced during
  dependency installation; declared versions in `package.json` remain unchanged.
- GAR-02 test, evaluator, and RBAC model hashes are identical to `main`.

## Failure A: TypeScript `TS1010`

### Reproduction

Command:

```text
npx --no-install tsc --noEmit --pretty false
```

Result: **FAIL**, exit code 2.

```text
node_modules/googleapis/build/src/apis/containeranalysis/v1.d.ts(1450,48):
error TS1010: '*/' expected.
```

Installed versions:

- Node `v22.18.0`
- npm `10.9.3`
- TypeScript `5.8.3` (resolved from the unchanged `~5.8.2` range)
- `googleapis@176.0.0`

The declaration has 1,450 lines and ends exactly at:

```text
/**
 * Maven artifacts uploaded to Artifact
```

The comment and declaration are unterminated at end of file. Of 453 generated
`.d.ts` files under `node_modules/googleapis/build/src/apis`, this was the only
file with a suspicious truncated final line. `tsconfig.json` already has
`skipLibCheck: true`; that setting cannot suppress a parser error caused by an
unterminated comment.

### Evidence and conclusion

**Verified cause:** the installed `googleapis@176.0.0` declaration artifact is
incomplete or corrupt at the filesystem/package-artifact level. This is not a
source-code error and is not caused by an incompatible compiler option.

**Unresolved distinction:** the available evidence does not establish whether
the truncation was present in the published npm tarball or occurred during
local extraction/cache handling. npm registry metadata identifies the
`googleapis@176.0.0` tarball and its integrity value, and the local cache has a
matching request entry, but the cached tarball was not extracted or rewritten
during this investigation.

### Minimum safe remediation

Before any upgrade attempt, obtain a verified complete `googleapis` artifact
using a clean, isolated dependency installation/cache and confirm its tarball
integrity. If the published `176.0.0` tarball itself contains the truncation,
select a known-good compatible `googleapis` release through the normal
dependency-review process. Do not patch `node_modules` or suppress the parser
error in `tsconfig.json`.

## Failure B: GAR-02 unit test

### Reproduction

Command:

```text
node .\node_modules\tsx\dist\cli.mjs tests\unit\s3-t01-rbac-override.test.ts
```

Result: **FAIL**, exit code 1; 5 of 9 checks passed.

Failing assertions:

1. **Test 2**, line 98: admin normal self-approval expected `false`, received
   `true`.
2. **Test 3**, line 130: admin confirmed override expected `true`, received
   `false`.
3. **Test 4**, line 152: missing author identity expected `false`, received
   `true`.
4. **Test 8**, line 251: admin UI override eligibility expected `true`, received
   `false`.

### Evidence and conclusion

**Verified cause:** the checked-in test contract and implementation disagree.
`evaluateSegregationOfDuties` currently grants administrators unconditional
approval/verification access and returns `isOverride: false`. The missing
author fail-closed check is reached only after the administrator branch. The
UI service consequently returns `isOverrideEligible: false` for the
administrator path.

This behavior is present on `main`: the test, evaluator, and RBAC model have
identical object hashes on the investigation branch and `main`. `git blame`
shows the test originated in commit `4eff4625` (2026-10-05), before the
upgrade workflow branch. The failure is therefore reproducible and pre-existing;
it was not introduced by the blocked upgrade workflow.

### Minimum safe remediation

Treat the GAR-02 policy as an explicit product decision before changing code:
the current project policy requires strict anti-self-approval
(`authorId !== approverId`) and says AI/admin paths must not silently approve.
Reconcile the evaluator, UI state logic, and tests together in a separate
authorized security/RBAC task. Do not weaken or rewrite the tests merely to
make the dependency baseline pass.

## Workflow status

- Dependency installation: **PASS**
- Compile tool baseline: **PASS**
- Runtime baseline: **FAIL** on both the malformed declaration and GAR-02 tests
- Package upgrades: **NOT STARTED**
- Post-upgrade validation: **NOT RUN**
- Upgrade remains **BLOCKED** until a clean dependency artifact and a healthy,
  policy-consistent pre-upgrade test baseline are demonstrated.

## Diagnostic commands

- `git diff --name-status main...HEAD`
- `git diff --check main...HEAD`
- `npx --no-install tsc --noEmit --pretty false`
- `node .\node_modules\tsx\dist\cli.mjs tests\unit\s3-t01-rbac-override.test.ts`
- `npm view googleapis@176.0.0 dist.integrity dist.tarball --json`
- `npm cache ls googleapis@176.0.0`

