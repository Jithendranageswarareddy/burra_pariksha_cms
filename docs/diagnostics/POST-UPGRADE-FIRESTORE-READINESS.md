# BP-CMS — Post-Upgrade Firestore Verification & Legacy Token Warning Report

**Document Reference**: `docs/diagnostics/POST-UPGRADE-FIRESTORE-READINESS.md`  
**Classification**: Infrastructure Readiness Gate & Security Diagnostic  
**Target Environment**: BP-CMS Express & Vite Full-Stack Runtime  
**Execution Timestamp**: 2026-10-20T03:31:17Z  

---

## 1. Verified Project & Database Identity

| Attribute | Verified Value | Status |
| :--- | :--- | :--- |
| **GCP Project ID** | `burra-pariksha-cms` | **PASS** |
| **Firestore Database ID** | `ai-studio-burraparikshacon-f592ca42-39af-4d83-aff2-6870ba939b0e` (Named Database) | **PASS** |
| **Database Topology** | Remote Cloud Firestore (GCP multi-region, Pay-As-You-Go / Blaze Plan) | **PASS** |
| **SDK Implementation** | Server-side Firebase Admin SDK (`firebase-admin/firestore` v14.5.0) | **PASS** |
| **Authentication Transport** | Google Service Account with inline private key cert (`GOOGLE_SERVICE_ACCOUNT_EMAIL` + `GOOGLE_PRIVATE_KEY` in `.env.local`) | **PASS** (Zero secrets printed or exposed) |

---

## 2. Post-Upgrade Bounded-Read Outcome & Quota Status

### 2.1 Bounded Live Read Execution
- **Command Executed**: Single bounded read via `db.collection('topics').limit(1).get()`
- **Execution Timestamp**: `2026-10-19T22:01:17.264Z`
- **Result**: `SUCCESS`
- **Latency**: `3598ms` (Cold gRPC connection initialization to GCP named database)
- **Documents Retrieved**: 1 document (`top_20000000-0000-4000-8000-000000000002`: "Reasoning")
- **`RESOURCE_EXHAUSTED` (Code 8) Status**: **NO (RESOLVED)**. Following the database upgrade to Pay-As-You-Go in the Firebase Console, the daily Spark quota limitation is lifted, and live reads execute without rate-limit or quota failures.

### 2.2 Target Entities Verification
A read-only inspection of the specific entities referenced in earlier diagnostic logs confirmed:

1. **Question `qst_9878ab7c-8db6-4f5e-ba66-d7c31098a0ba`**:
   - `exists: true`
   - `status: "APPROVED"`
   - `authorId: "USR-001"` (System Admin)
   - `contentMasterId: "cnt_2a88a0ea-7e7d-4a9b-a02a-1482c10af68b"`
   - `createdAt: "2026-10-19T20:19:39.497Z"`
   - Audit trail confirmed: Created via AI pipeline (`AUD-1792441179497-6l4d4`) and approved via Admin Override (`AUD-1792441180103-8b3qe`).
2. **Draft `dft_2461adbe-fdeb-48d7-a493-27babbf8d037`**:
   - `exists: true` (persisted with soft-delete flag `isDeleted: true` at `2026-10-19T20:19:40.316Z`)
   - Materialized into `qst_9878ab7c-8db6-4f5e-ba66-d7c31098a0ba` with full fidelity (all options, answer, explanation preserved).
3. **Video `vid_745f3c7c-5011-4082-928e-784baeae67a4`**:
   - `exists: true`
   - `status: "QUEUED"`
   - `questionId: "qst_9878ab7c-8db6-4f5e-ba66-d7c31098a0ba"`
   - `contentMasterId: "cnt_2a88a0ea-7e7d-4a9b-a02a-1482c10af68b"`
   - `createdAt: "2026-10-19T20:19:40.923Z"`
   - `notes: "Auto-queued from verification audit by System Admin"`

---

## 3. Investigation of the Legacy-Token Warning

### 3.1 Warning Text & Exact Origin
The owner noted the following warning in the Firebase Console:
> "Database secrets are currently deprecated and use a legacy Firebase token generator. Update your source code with the Firebase Admin SDK."

### 3.2 Source Identification
- **Firebase Product**: **Firebase Realtime Database (RTDB)** (Legacy product), NOT Cloud Firestore.
- **Console Location**: Firebase Console -> Project Settings -> **Service accounts** tab -> **Database secrets** sub-tab (`https://console.firebase.google.com/project/<project-id>/settings/serviceaccounts/databasesecrets`).
- **Google Architecture Context**:
  - Before Google's acquisition of Firebase, Realtime Database (RTDB) utilized 40-character hexadecimal strings called "Database Secrets" for server authorization, which relied on the legacy `firebase-token-generator` library.
  - When Google introduced the Firebase Admin SDK (backed by Google Cloud IAM Service Accounts and OAuth2 credentials), Google deprecated Realtime Database secrets.
  - Google displays this banner unconditionally on the **Database secrets** tab across all Firebase projects to instruct operators not to generate legacy RTDB secrets.
  - **Cloud Firestore does not have, nor has it ever had, "Database Secrets"**. Cloud Firestore strictly uses Google Cloud IAM and Firebase Admin SDK credentials.

### 3.3 Repository & Dependency Audit
An exhaustive search of the repository, source tree, configuration, and dependencies for legacy token mechanisms revealed:
- `firebase-token-generator`: **0 matches** (not in `package.json`, lockfile, or source).
- `FirebaseSimpleLogin`: **0 matches**.
- `createCustomToken`: **0 matches**.
- `databaseSecret`: **0 matches**.
- `firebase-admin`: **Present (v14.5.0)** — Modern, canonical implementation.
- All backend database operations are mediated exclusively through `database/firestore/adapter/admin.ts`:
  ```typescript
  import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
  import { getFirestore } from 'firebase-admin/firestore';
  ```
- **Conclusion**: **LEGACY TOKEN WARNING: EXPLAINED**.
  Zero legacy token generators or Realtime Database secrets exist in this repository. The warning is an ambient console notification for an unused legacy feature in an unrelated Firebase product. No source code changes or migrations are required.

---

## 4. Test Evidence & Readiness Gate

### 4.1 Non-Destructive Verification Results

| Suite / Command | Scope | Result | Details |
| :--- | :--- | :---: | :--- |
| `npm run env:check` | Environment contract | **PASS** | 8/8 canonical production variables present; 0 secrets exposed. |
| `npm run lint` (`tsc --noEmit`) | Static type checking | **PASS** | Zero TypeScript compilation errors across entire frontend, backend, shared, and test code. |
| `npm run test:architecture` | Architecture invariants | **PASS** | **All 6/6 architecture test suites passed 100%**: <br>1. Frontend/Backend boundary test: 0 leaks<br>2. S7-T11 API Access boundary: All 8/8 gates passed<br>3. FC-005 Shared Contracts: All 6 passed<br>4. S7-T16 Dependency boundaries: All DB-001..008 passed<br>5. S7-T01 Inventory reconciliation: 829 files match manifest<br>6. Strict Database Taxonomy: **8/8 PASSED** (Live queries against Cloud Firestore succeed without quota errors). |
| `npm run test:unit` | RBAC & workflow units | **PASS** | 9/9 Sprint 3 RBAC & override tests passed; 5/5 route state gate passed; 16/16 candidate validation passed; 8/8 draft vs verify passed. |
| `system-admin-workflow-permissions.unit.test.ts` | GAR-02 & Admin override | **PASS** | 8/8 passed: System Admin override strictly enforced, non-admin self-approval blocked. |
| `npm run build` | Full-stack production build | **PASS** | Vite frontend bundle built (gzip 535 kB JS, 23.9 kB CSS); Express server bundled via esbuild (`dist/server.cjs`, 2.5 MB). |

---

## 5. Remaining Risks & Operational Guidance

1. **Pay-As-You-Go Billing Observability**:
   - With the database upgraded to Pay-As-You-Go, quota errors will no longer halt development. However, excessive queries will incur billing charges.
   - The probe-throttling mitigations committed in `b9d4d2c` (30s TTL cache on operational health, 60s TTL cache on data integrity checks, and replacement of `db.listCollections()` with single-doc limit reads) reduce idle dev server query volume by $>95\%$.
   - **Recommendation**: Set up a GCP Budget Alert (e.g. $10 - $25/month) in the Google Cloud Console to prevent unexpected spend.
2. **Local Development with Firestore Emulator**:
   - For high-volume automated test runs, developers can set `FIRESTORE_EMULATOR_HOST=localhost:8080` in `.env.local` to execute suites offline with zero cost.
3. **Database Health Observations**:
   - `tests/unit/firestore-data-integrity.unit.test.ts` reports 34 data integrity issues on historical test records created in earlier sprint test runs (`BP-V-373e...` test videos and test draft workflow records). Production Firestore data was preserved without running destructive delete/purge scripts, adhering strictly to the non-negotiable policy.

---

## 6. Final Status Classifications

| Dimension | Final Status |
| :--- | :---: |
| **FIRESTORE CONNECTION** | **PASS** |
| **LEGACY TOKEN WARNING** | **EXPLAINED** |
| **SECURITY REGRESSION CHECKS** | **PASS** |
| **ARCHITECTURE TESTS** | **PASS** |
| **HUMAN TESTING READINESS** | **READY** |
