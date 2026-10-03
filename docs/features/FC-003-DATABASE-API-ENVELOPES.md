# FEATURE CONTRACT: FC-003-DATABASE-API-ENVELOPES

## 1. Feature Identity
- **Feature ID**: FC-003
- **Feature Name**: Database Abstraction & Universal API Envelopes
- **Business Area**: Foundation / Persistence & API Gateway
- **Contract Version**: 1.0.0
- **Status**: APPROVED
- **Priority**: P0 (Blocker)
- **Owner / Domain**: Data Architecture & API Gateway
- **Related Workflow Stage(s)**: Universal (Prerequisite for all 15 steps)

---

## 2. Requirement
- **Business Requirement**: NFR-001 (Universal API Contracts), NFR-003 (Data Concurrency & OCC), NFR-006 (Zero Vendor Lock-in Abstraction).
- **User Problem**: Ad-hoc database queries and inconsistent REST responses lead to frontend regressions, race conditions, silent data overwrites, and tight coupling to specific cloud datastores.
- **Business Purpose**: Provide a clean architectural persistence boundary (`IRepository<T>`) decoupling domain logic from Firestore, coupled with universal REST request/response envelopes and deterministic Optimistic Concurrency Control (OCC).
- **Expected Capability**:
  - Generic `IRepository<T>` interface supporting `findById`, `create`, `update`, `delete`, and `findMany`.
  - Concrete Firestore repository implementation and in-memory test double for zero-overhead unit testing.
  - Universal REST envelope `ApiResponseEnvelope<T>`: `{ success: boolean, data?: T, error?: ApiErrorResponse, meta?: ResponseMetadata }`.
  - Canonical ID Generation Service (`src/lib/id.service.ts`) generating typed prefixed UUIDs/CUIDs (`qst_`, `scr_`, `vid_`, `med_`, `pub_`, `usr_`, `rev_`, `aud_`).
  - Strict OCC version enforcement rejecting stale updates with HTTP 409 `CONCURRENCY_CONFLICT`.
- **Scope**: Generic repository pattern, Firestore client integration, canonical ID generator, API envelope helpers, OCC middleware.
- **Explicit Non-Scope**: Domain-specific entity schemas (handled in respective feature contracts).

---

## 3. Business Acceptance
- **Happy-Path Acceptance**:
  - All successful API endpoints return HTTP 200/201 with `success: true` and standardized `data` payload.
  - Creating a domain entity generates a unique, typed canonical ID matching its domain prefix.
  - Updating a record with matching `expectedVersion === currentVersion` increments version by 1 and persists changes.
- **Validation Acceptance**:
  - Malformed request payload returns HTTP 400 with `success: false` and structured field-level Zod issues in `error.details`.
- **Authorization Acceptance**:
  - Envelopes for 401 and 403 responses strictly adhere to the standard `ApiErrorResponse` structure.
- **Concurrency Acceptance**:
  - Concurrent writes to the same entity with mismatched version yield HTTP 409 `CONCURRENCY_CONFLICT` with current server version in error payload.
- **Performance Acceptance**:
  - Repository abstraction introduces $< 2\text{ms}$ computational overhead over raw Firestore SDK calls.
- **Data Acceptance**:
  - In-memory test double mimics Firestore transaction and query semantics with 100% fidelity.
- **Audit Acceptance**:
  - All database write operations attach `requestId`, `actorId`, and UTC timestamp.

---

## 4. Domain Entities
- **Entities Involved**: `AggregateRoot`, `CanonicalId`, `ApiResponseEnvelope`, `ApiErrorResponse`.
- **Entity Ownership**: Core Infrastructure Context.
- **Relationships**: All domain entities inherit base attributes: `{ id: string, version: number, createdAt: string, updatedAt: string, isDeleted: boolean }`.
- **Versions**: Contract v1.0.
- **Immutable Fields**: `id`, `createdAt`.
- **Mutable Fields**: `version` (auto-incremented), `updatedAt`, `isDeleted`.
- **References**: Canonical IDs used universally across foreign keys.

---

## 5. Database / Data Contract
- **Collections Involved**: All 28 canonical Firestore collections defined in Stage 13.
- **Base Document Interface**:
  ```typescript
  export interface BaseEntity {
    id: string; // Typed prefix + UUID
    version: number; // Integer, begins at 1
    createdAt: string; // ISO 8601 UTC
    updatedAt: string; // ISO 8601 UTC
    isDeleted: boolean; // Soft delete flag
  }
  ```
- **Optimistic Concurrency Control (OCC)**:
  - Updates require `currentVersion` check: `WHERE id = :id AND version = :expectedVersion`.
  - Mutation updates: `SET version = version + 1, updatedAt = now()`.
- **Soft Deletion**: `isDeleted = true` flag; query adapters automatically filter `isDeleted == false` unless explicitly requested.
- **Source of Truth**: Google Cloud Firestore (Spark Tier native mode).

---

## 6. API Contract
### 6.1 Universal Response Envelope Structure
```typescript
export interface ApiResponseEnvelope<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Array<{ field: string; issue: string }>;
  };
  meta?: {
    requestId: string;
    timestamp: string;
    pagination?: { page: number; limit: number; total: number; totalPages: number };
  };
}
```
### 6.2 Standard HTTP Status Codes
- `200 OK`: Successful read or update.
- `201 CREATED`: Successful entity creation.
- `400 BAD_REQUEST`: Zod schema validation failed.
- `401 UNAUTHORIZED`: Authentication required or invalid.
- `403 FORBIDDEN`: Insufficient RBAC capability.
- `404 NOT_FOUND`: Resource with given ID does not exist or is soft-deleted.
- `409 CONFLICT`: Optimistic concurrency version mismatch.
- `422 UNPROCESSABLE_ENTITY`: Business rule invariant violated.
- `429 TOO_MANY_REQUESTS`: Rate limit exceeded.
- `500 INTERNAL_SERVER_ERROR`: Unhandled exception (sanitized in production).

---

## 7. Frontend Contract
- **Universal API Client**: Standard Axios / Fetch wrapper that unwraps `ApiResponseEnvelope<T>`:
  - If `success === true`, resolves with `data`.
  - If `success === false`, throws structured `ApiClientError` containing code, message, and details.
- **OCC Conflict UX**: When HTTP 409 is caught, client displays toast: *"This item has been modified by another user. Reloading latest data..."* and re-fetches without losing dirty drafts.

---

## 8. RBAC / Capability Contract
- **Enforcement**: Integrated with FC-002 middleware. Every route wrapper automatically checks capability before repository query execution.

---

## 9. Workflow Contract
- **State Preservation**: All state transitions update `version` and record transition timestamps, preventing split-brain states.

---

## 10. Validation Contract
- **Payload Validation**: Express middleware automatically parses incoming JSON using Zod schemas (`validateRequest({ body, query, params })`).
- **ID Validation**: Validates that `:id` parameter begins with the expected entity prefix.

---

## 11. Error Contract
- **Standard Error Class Hierarchy**:
  - `AppError` (Base class with HTTP status code and error code)
  - `NotFoundError` (404)
  - `ValidationError` (400)
  - `ConcurrencyConflictError` (409)
  - `UnauthorizedError` (401)
  - `ForbiddenError` (403)
- Global Express error handler catches all errors, formats them into `ApiResponseEnvelope`, and suppresses stack traces in production.

---

## 12. Audit Contract
- **Repository Hooks**: Repository mutation methods (`create`, `update`, `delete`) optionally emit entity change descriptors to `IAuditDispatcher`.

---

## 13. Realtime Contract
- **Applicable**: Standardized envelopes wrap SSE payloads, ensuring frontend parsers have a single format for both HTTP responses and SSE events.

---

## 14. Job / Async Contract
- **Applicable**: Background job processors use the exact same `IRepository<T>` adapters as the HTTP API.

---

## 15. AI Contract
- **Applicable**: AI responses are validated against Zod schemas before being wrapped in envelopes.

---

## 16. Media Contract
- **Applicable**: Media metadata documents inherit from `BaseEntity`.

---

## 17. Analytics Contract
- **Applicable**: Analytical read models use read-only repository interfaces.

---

## 18. Security Contract
- **Input Sanitization**: Zod schemas strip unknown fields (`.strict()`).
- **Error Information Leakage**: Database internal driver errors and stack traces are suppressed; only canonical error codes are returned to clients.

---

## 19. Observability Contract
- **Correlation**: `X-Request-Id` injected into every incoming HTTP request and attached to response envelope `meta.requestId`.
- **Timing**: Response headers include `Server-Timing: db;dur=XX` for repository execution profiling.

---

## 20. Cost Contract
- **Optimization**: Repository queries use explicit `.select()` projection to minimize Firestore read bandwidth and stay within the 50,000 daily read free tier limit.

---

## 21. Migration Contract
- **Dual-Write Support**: `IRepository<T>` can be configured with a `CompositeRepository` that writes to Firestore and legacy Google Sheets simultaneously during migration.

---

## 22. Test Contract
- **Unit Tests**:
  - `TC-DB-01`: Canonical ID generator produces correct prefix and UUID.
  - `TC-DB-02`: In-memory repository performs atomic CRUD operations.
  - `TC-DB-03`: OCC update succeeds with matching version and fails with mismatched version.
  - `TC-DB-04`: Soft delete excludes record from standard queries.
- **API Tests**:
  - `TC-API-01`: Global error handler converts `AppError` to universal error envelope.
  - `TC-API-02`: Zod validation middleware returns structured 400 response.

---

## 23. Dependencies
- **Prerequisite Features**: FC-001 (Identity context for actor ID).
- **Stage 25 Node**: `D-21 (Database Abstraction)`, `D-22 (API Envelopes)`.
- **Downstream Consumers**: FC-004 through FC-022.

---

## 24. Implementation Sequence
1. Implement canonical ID generator (`src/lib/id.service.ts`).
2. Implement application error classes (`src/lib/errors.ts`).
3. Define universal API envelope types and response helpers (`src/types/api-contracts.ts`).
4. Implement `IRepository<T>` interface and `InMemoryRepository<T>` test double (`src/lib/db/`).
5. Implement `FirestoreRepository<T>` production adapter (`src/lib/db/firestore.ts`).
6. Implement Express request validation and global error handling middlewares.
7. Verify against `TC-DB-01..04` and `TC-API-01..02`.

---

## 25. Deployment Contract
- **Required Env Vars**: `GCP_PROJECT_ID`, `FIRESTORE_DATABASE_ID` (default `(default)`).

---

## 26. Rollback Contract
- **Strategy**: Revert Cloud Run revision. In-memory and Firestore abstractions maintain backward-compatible document schemas.

---

## 27. Feature Completion Criteria
- [ ] Canonical ID service tested for all entity prefixes.
- [ ] Universal envelope wraps 100% of API responses.
- [ ] OCC conflict detection unit tested with concurrent write simulation.
- [ ] Firestore and In-Memory repositories share identical contract interface.
- [ ] Zero lint or build errors.

---

## 28. Open Issues / Assumptions
- **None**: Fully specified in Stage 12, 13, and 15.

---

## 29. Traceability
- **Stage 01**: NFR-001, NFR-003, NFR-006
- **Stage 04**: Clean Architecture Principles P-02, P-08
- **Stage 12**: Database Architecture (Firestore Native)
- **Stage 13**: Data Contracts & Canonical Collections
- **Stage 15**: API Contracts & Universal Envelopes
- **Stage 24**: Concurrency & OCC Test Matrix
- **Stage 25**: Nodes `D-21`, `D-22`
