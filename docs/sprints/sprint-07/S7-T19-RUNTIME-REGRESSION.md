# S7-T19 — Full Runtime Regression

## Verdict

**COMPLETE WITH EXPLICIT BLOCKERS**

The deterministic Question Generation, persistence, submission, authentication, RBAC,
database/API, workflow, and audit contract suites passed. The local application loaded
in a browser and the live configured AI provider returned a candidate. Authenticated
browser dashboard access and the reviewer verification UI could not be completed because
the configured S2-T05 creator identity was rejected with HTTP 401. No runtime defect was
confirmed, and no runtime code was changed.

## Environment and safety

- Workspace: `C:\Users\jithendra\OneDrive\Desktop\burra_pariksha_cms`
- Branch: `main`
- Runtime: Node.js 22.18.0, npm 10.9.3
- Development server: `http://127.0.0.1:3000`
- Firestore emulator: not configured (`FIRESTORE_EMULATOR_HOST` unset).
- Firestore-backed tests used the repository's configured test path and synthetic test
  identifiers; test records were cleaned up. No production collection reset or bulk
  deletion was performed.
- Secrets and credential values were not printed or committed.

## Regression matrix

| Area | Status | Evidence and scope |
|---|---|---|
| Application shell and login page | **PASS** | Browser opened `http://127.0.0.1:3000/` and rendered the Burra Pariksha CMS secure sign-in page. |
| Health endpoint | **PASS** | Direct HTTP request to `/api/healthz` returned HTTP 200. |
| Unauthenticated protection | **PASS** | Direct HTTP request to `/api/v1/dashboard/overview` returned HTTP 401. Invalid login also returned HTTP 401. |
| Authenticated dashboard browser flow | **BLOCKED** | The configured S2-T05 creator identity returned HTTP 401; no authenticated browser claim is made. |
| Question Generation options and taxonomy | **PASS** | [`question-generation-workflow.e2e.test.ts`](../../../tests/e2e/question-generation/question-generation-workflow.e2e.test.ts) loaded seven topics and five subtopics and validated Topic → Subtopic alignment. |
| Live AI provider request | **PASS** | A direct service-level generation request using configured provider settings returned an object. This proves provider execution only; it does not prove authenticated UI behavior. |
| AI invalid-response/timeout handling | **UNVERIFIED** | No separate forced provider failure or timeout was executed in this regression; the behavior remains covered only to the extent of existing tests and implementation. |
| Save Draft | **PASS** | The E2E and integration Question Generation tests persisted a canonical `dft_<uuid>` draft through the repository and independently read it back. See [`question-generation.service.ts`](../../../backend/domain/question-generation/question-generation.service.ts). |
| Firestore persistence | **PASS** | The Question Generation E2E and integration tests independently read the persisted draft and removed the synthetic test record during cleanup. |
| Save Draft ≠ Verify | **PASS** | After Save Draft, the record remained `DRAFT` / `QUESTION_STUDIO` and was absent from the `questions` collection before explicit submission. |
| Submit for Verification | **PASS** | Explicit submission transitioned the same draft to `SUBMITTED_FOR_REVIEW` / `STAGE_02_VERIFICATION`. |
| Verification UI/reviewer journey | **BLOCKED** | No separate authorized reviewer identity was available after creator login returned 401; no UI approval claim is made. |
| Authentication contract | **PASS** | [`fc-001-auth.test.ts`](../../../tests/integration/fc-001-auth.test.ts): 7/7 passed. |
| RBAC and anti-self-approval | **PASS** | [`fc-002-rbac.test.ts`](../../../tests/integration/fc-002-rbac.test.ts): 12/12 passed, including capability, ownership, forged-role, AI-gating, and GAR-02 cases. |
| Database/API contracts | **PASS** | [`fc-003-db-api.test.ts`](../../../tests/integration/fc-003-db-api.test.ts): 8/8 passed. |
| Workflow transitions and persistence | **PASS** | [`fc-005-workflow.test.ts`](../../../tests/integration/fc-005-workflow.test.ts): 5/5 passed, including sequential 15-step transitions, illegal jumps, rejection routing, OCC, GAR-02, audit, and realtime integration. |
| Runtime-specific audit inspection | **UNVERIFIED** | The workflow and audit contract suites passed, but the cleaned-up Question Generation runtime records were not retained for a separate post-run audit query. |

## Executed flows

### Flow A — Save Draft

1. Loaded taxonomy options and selected a valid Topic → Subtopic pair.
2. Prepared and structurally validated a Telugu candidate.
3. Saved a synthetic draft using the canonical UUID-prefixed ID format.
4. Independently read the record back from the persistence path.
5. Confirmed `DRAFT` / `QUESTION_STUDIO`.
6. Confirmed no corresponding record existed in `questions`.
7. Deleted the synthetic test record during test cleanup.

Result: **PASS**. The executable evidence is in
[`question-generation-workflow.e2e.test.ts`](../../../tests/e2e/question-generation/question-generation-workflow.e2e.test.ts)
and
[`question-generation-slice.integration.test.ts`](../../../tests/integration/question-generation/question-generation-slice.integration.test.ts).

### Flow B — Submit for Verification

1. Started from the independently persisted draft in Flow A.
2. Invoked the explicit submit operation.
3. Confirmed `SUBMITTED_FOR_REVIEW` / `STAGE_02_VERIFICATION`.
4. Confirmed cleanup of the synthetic record.

Result: **PASS**. Save Draft did not silently submit or navigate to verification.

## Defects and fixes

No confirmed application defect was found. No runtime source file was changed.
The rejected configured test identity is an environment/test-identity blocker, not a
confirmed application defect.

## Validation results

- `npm test`: **PASS**
- `npm run test:question-generation`: **PASS**
- `npm run test:architecture`: **PASS**
- `npm run lint`: **PASS**
- `npm run build`: **PASS** (existing non-fatal bundle/comment warnings only)
- `git diff --check`: **PASS**
- Browser shell load: **PASS**
- Direct `/api/healthz`: **PASS** (HTTP 200)
- Direct unauthenticated dashboard request: **PASS** (HTTP 401 protection)
- Live provider generation: **PASS**
- Authenticated browser dashboard and reviewer UI: **BLOCKED** by configured test identity HTTP 401

## Remaining blockers and unverified claims

- Reconfigure or authorize a non-production test identity, then repeat the authenticated
  dashboard and reviewer verification browser journeys.
- Execute a separately controlled provider failure/timeout test if those paths are required
  as runtime evidence.
- Retain synthetic runtime audit identifiers long enough to perform an independent audit
  record query, or add a narrowly scoped non-production audit-evidence harness.
- Until those steps are completed, this regression must not be reported as an unrestricted
  full runtime pass.
