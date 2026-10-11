# S7-T07 — Database Separation Report

## 1. Executive Summary

- **Task**: S7-T07 — Separate Database
- **Objective**: Physically isolate all DATABASE-SPECIFIC infrastructure from the rest of the application into `database/firestore/`.
- **Status**: COMPLETE
- **Authoritative Datastore**: Google Cloud Firestore remains the sole transactional datastore for BP-CMS.
- **Invariant Upheld**: Generic request validation schemas, API DTOs, and application contracts are strictly NOT database infrastructure and remain in shared/backend locations (`src/lib/schemas/google-sheets-schema.ts`).

---

## 2. Target Architecture Structure

All database-specific infrastructure has been physically established under `database/firestore/`:

```
database/
└── firestore/
    ├── adapter/
    │   ├── admin.ts
    │   ├── errors.ts
    │   ├── firestore.repository.ts
    │   └── index.ts
    ├── repositories/
    │   ├── analytics.repository.ts
    │   ├── assignments.repository.ts
    │   ├── audit-log.repository.ts
    │   ├── base.repository.ts
    │   ├── comment-intelligence.repository.ts
    │   ├── content-batches.repository.ts
    │   ├── content-masters.repository.ts
    │   ├── content-plans.repository.ts
    │   ├── index.ts
    │   ├── intelligence.repository.ts
    │   ├── media-assets.repository.ts
    │   ├── pinned-comment-packages.repository.ts
    │   ├── pinned-comment-versions.repository.ts
    │   ├── pinned-comments.repository.ts
    │   ├── platform-adaptations.repository.ts
    │   ├── publishing.repository.ts
    │   ├── question-config.repository.ts
    │   ├── question-drafts.repository.ts
    │   ├── question-videos.repository.ts
    │   ├── questions.repository.ts
    │   ├── refinement-candidates.repository.ts
    │   ├── script-versions.repository.ts
    │   ├── scripts.repository.ts
    │   ├── social-comments.repository.ts
    │   ├── social-reviews.repository.ts
    │   ├── strategy-recommendation.repository.ts
    │   ├── subtopics.repository.ts
    │   ├── thumbnail-candidates.repository.ts
    │   ├── thumbnail-versions.repository.ts
    │   ├── thumbnails.repository.ts
    │   ├── topics.repository.ts
    │   ├── users.repository.ts
    │   ├── validations.repository.ts
    │   ├── videos.repository.ts
    │   └── workflow.repository.ts
    ├── schemas/
    │   ├── domain-schemas.ts
    │   └── index.ts
    ├── rules/
    │   └── firestore.rules
    ├── initialization/
    │   ├── firestore-production-initializer.ts
    │   └── index.ts
    ├── migrations/
    │   ├── firestore-migration.ts
    │   └── index.ts
    └── utilities/
        ├── firestore-converters.ts
        └── index.ts
```

---

## 3. Classification of Database vs. Non-Database Files

Every candidate file was strictly classified according to architectural responsibility:

| File / Directory | Category | Action | Rationale |
|---|---|---|---|
| `src/lib/firebase/admin.ts` | A. Firestore-specific database infrastructure | Moved to `database/firestore/adapter/admin.ts` | Manages server-side Firebase Admin SDK Firestore client instances. |
| `src/lib/firebase/errors.ts` | A. Firestore-specific database infrastructure | Moved to `database/firestore/adapter/errors.ts` | Firestore-specific error classes. |
| `src/lib/db/firestore.repository.ts` | A. Firestore-specific database infrastructure | Moved to `database/firestore/adapter/firestore.repository.ts` | Generic Firestore repository adapter implementing document persistence. |
| `src/lib/repositories/*.ts` (34 repositories) | A. Firestore-specific database infrastructure | Moved to `database/firestore/repositories/` | Authoritative Firestore collection persistence implementations. |
| `src/lib/schemas/domain-schemas.ts` | A. Firestore persistence schema | Moved to `database/firestore/schemas/domain-schemas.ts` | Authoritative Firestore collection names registry (`DOMAIN_COLLECTIONS`). |
| `firestore.rules` | A. Firestore security rules | Moved to `database/firestore/rules/firestore.rules` | Security rules for Cloud Firestore deployment. |
| `backend/features/recovery/services/firestore-production-initializer.service.ts` | A. Database bootstrap | Implementation relocated to `database/firestore/initialization/` | Core Firestore collection bootstrap logic (compatibility shim maintained in backend). |
| `backend/features/recovery/services/firestore-migration.service.ts` | A. Database migration | Implementation relocated to `database/firestore/migrations/` | Direct Firestore schema/data migration engine (compatibility shim maintained in backend). |
| `src/lib/db/firestore-converters.ts` | A. Firestore utilities | Moved to `database/firestore/utilities/firestore-converters.ts` | Firestore document field serialization converters. |
| `src/lib/schemas/google-sheets-schema.ts` | D. Request validation / API DTOs | **RETAINED in `src/lib/schemas/`** | Generic request validation schemas, Zod API parsers, DTOs. **NOT database code**. |
| `src/lib/db/repository.interface.ts` | B. Generic persistence contract | **RETAINED in `src/lib/db/`** | Abstract generic repository interface, independent of Firestore. |
| `src/lib/db/in-memory.repository.ts` | B. Generic test persistence | **RETAINED in `src/lib/db/`** | In-memory repository mock for offline testing, independent of Firestore. |
| `src/lib/db/index.ts` | B. Shared DB contract export | **RETAINED in `src/lib/db/`** | Exports generic persistence abstractions; re-exports Firestore adapter. |

---

## 4. Boundary Enforcement & Architecture Invariants

### 4.1 Schema Rule Invariant
Generic request validation schemas (such as Zod schemas in `src/lib/schemas/google-sheets-schema.ts`) describe API and HTTP layer concerns, NOT Firestore persistence mechanics.
- `database/firestore/` contains zero request validation schemas.
- `database/firestore/` contains zero API request DTOs.
- `database/firestore/` contains zero route/form validation.

### 4.2 Frontend Boundary Invariant
The frontend under `frontend/` contains ZERO direct references to:
- `database/firestore/`
- Firebase Admin SDK (`firebase-admin`)
- Firestore client libraries
- Direct database repositories

### 4.3 Database Layer Boundary Invariant
`database/firestore/` contains:
- ZERO imports from `frontend/`
- ZERO React / UI dependencies
- ZERO API request validation schemas

---

## 5. Tooling and Configuration Updates

1. **`firebase.json`**:
   Configured to resolve Firestore rules directly from the target location:
   ```json
   {
     "firestore": {
       "rules": "database/firestore/rules/firestore.rules"
     }
   }
   ```
2. **Old Implementation Locations Decommissioned**:
   - `src/lib/repositories/` — Completely deleted.
   - `src/lib/firebase/` — Completely deleted.
   - `src/lib/db/firestore.repository.ts` & `firestore-converters.ts` — Relocated and cleaned up.
   - `src/lib/schemas/domain-schemas.ts` — Relocated to `database/firestore/schemas/`.
   - Root `firestore.rules` — Relocated to `database/firestore/rules/firestore.rules`.
3. **Caller Import Updates**:
   - Updated 196 active caller references across `backend/`, `tests/`, and `scripts/`.
   - Zero broken imports remain.

---

## 6. Verification and Quality Gates

| Verification Gate | Command | Result |
|---|---|---|
| Static Typecheck | `npm run lint` (`tsc --noEmit`) | **PASS** (Exit Code 0, 0 errors) |
| Production Compilation | `npm run build` | **PASS** (Vite + esbuild dist/server.cjs) |
| Boundary & Ownership Audit | `npx tsx tests/s7-frontend-backend-boundary.test.ts` | **PASS** (Zero boundary violations across 5 gates) |
| Auth Regression Suite | `npm run test:auth` | **PASS** (7/7 tests passed) |
| RBAC Regression Suite | `npm run test:rbac` | **PASS** (12/12 tests passed) |
| Audit Ledger Regression Suite | `npm run test:audit` | **PASS** (8/8 tests passed) |
| Workflow State Engine Suite | `npm run test:workflow` | **PASS** (5/5 tests passed) |
| 2-Tier Taxonomy Suite | `npx tsx tests/s5-two-tier-taxonomy.test.ts` | **PASS** (11/11 tests passed) |
| No-Sequence Architecture Suite | `npx tsx tests/s6-no-sequence-architecture.test.ts` | **PASS** (10/10 tests passed) |
| Firestore Security Rules Suite | `npx tsx tests/firestore-rules.test.ts` | **PASS** (3/3 tests passed) |
| Runtime Startup Smoke Test | `npx tsx tests/s7-runtime-smoke.test.ts` | **PASS** (Health, readiness, auth rejection, Firestore read, clean shutdown) |
