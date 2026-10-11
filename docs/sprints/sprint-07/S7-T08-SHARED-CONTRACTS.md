# S7-T08 — Shared Contracts Architectural Extraction

## Executive Summary

- **Task**: S7-T08 Extract Shared Contracts
- **Baseline**: `4b7486b0a057ba5cbdf27e4108e34dc48f72dc28` (Accepted S7-T07 Baseline)
- **Status**: COMPLETE
- **Objective**: Establish a clean, technology-independent shared layer containing strictly concepts legitimately understood and exchanged between frontend and backend. Eliminate duplicated frontend/backend types, eliminate frontend imports from backend/database types, establish clean unidirectional dependency boundaries, and ensure zero backend-only service types or persistence implementation models enter `shared/`.

---

## 1. Previous Type / Contract Locations

Prior to S7-T08:
1. `src/types/index.ts`: A monolithic 3,200+ line barrel file mixing domain entity interfaces, backend-only persistence concepts, server-side AI evaluation types, Google Sheets tab representations, frontend state structures, and status enums.
2. `src/types/*.ts`: 15 domain/architecture-specific files (`workflow.ts`, `ai.ts`, `copilot.ts`, `consensus.ts`, `realtime-architecture.ts`, etc.) containing a mixture of API DTOs and internal engine orchestration types.
3. `frontend/api/contracts.ts`: Created as an interim bridge during S7-T05 to decouple frontend components from backend imports, containing localized copies and manual DTO structures.
4. `frontend/pages/` and `frontend/components/`: Containing direct imports pointing back to `../../src/types` or `../../../src/types` across 74+ presentation files.

---

## 2. Classification Methodology

Every type and file was classified individually into one of the following categories:

| Category | Description | Placement |
|---|---|---|
| **A. Shared application/domain type** | Pure entity shapes understood by both frontend & backend (`Question`, `Topic`, `Subtopic`, `User`, `Assignment`, `AuditLog`) | `shared/types/` |
| **B. Shared API contract** | DTOs, request payloads, API response envelopes, pagination meta | `shared/contracts/` |
| **C. Shared workflow contract** | Workflow transition requests/responses, canonical step catalog, dimension state representations | `shared/contracts/workflow.ts` & `shared/constants/workflow.ts` |
| **D. Shared RBAC contract** | Canonical roles, capabilities, access profiles, capability strings | `shared/contracts/rbac.ts` & `shared/constants/roles.ts` |
| **E. Shared constant/enum** | Pure enums & constants needed by both frontend and backend (`QuestionStatus`, `DifficultyLevel`, `UserRole`, etc.) | `shared/constants/` |
| **F. Backend-only service type** | Service internals, idempotency caches, orchestrators, execution context | Retained in `backend/` |
| **G. Frontend-only type** | UI view state, form state, component prop types, local React hooks | Retained in `frontend/` |
| **H. Database/persistence type** | Firestore repository internals, DocumentSnapshot, collection schemas | Retained in `database/firestore/` |
| **I. AI implementation type** | Gemini SDK types, prompt builders, LLM provider configurations | Retained in `backend/` |
| **J. Configuration type** | Server environment variables, server secrets | Retained in `backend/` |
| **K. Test-only type** | Synthetic test fixtures, mock repository types | Retained in `tests/` |

**Authoritative Rule Enforced**:
> **Backend-only service types were NOT moved into shared.**

---

## 3. Shared Types Extracted (`shared/types/`)

- `shared/types/taxonomy.ts`:
  - `Topic`: Autonomous root taxonomy entity (`top_<uuid>` or legacy `TOP-*`)
  - `Subtopic`: Child taxonomy entity (`sub_<uuid>` or legacy `SUB-*`) referencing parent via `topicId`
  - *Strict invariant*: `Category` is permanently eliminated.
- `shared/types/question.ts`:
  - `Question`: Canonical question entity with 4 options, explanation, mathematical proof, difficulty, and language.
  - `QuestionDraft`: Draft persistence entity (`qst_...` or `BP-Q-######`).
  - `QuestionCandidate`: AI generation candidate shape.
  - `QuestionConfigEntry`: Question Studio prompt configuration dimension entry.
  - `GroupedQuestionConfig`: Dimension groups for Question Studio controls.
  - `QuestionStudioConfigResponse`: Initial taxonomy and config bundle.
  - `QuestionFilterInput`: Canonical question querying and filtering interface.
- `shared/types/content.ts`:
  - `ContentMaster`, `ContentMasterCanonicalState`, `ContentMasterReadinessResult`
  - `Video`, `QuestionVideo`, `ProductionStats`
  - `Script`, `ScriptVersion`
  - `Thumbnail`, `ThumbnailVersion`, `ThumbnailCandidate`, `ThumbnailCandidateVersion`, `ThumbnailSafetyReport`
  - `PinnedComment`, `PinnedCommentVersion`, `PinnedCommentPackage`
  - `Publishing`, `PlatformPublishInfo`, `PlatformPackageProjection`
  - `SocialReviewRecord`, `SocialReviewPackageBundle`
  - `ContentPlan`, `ContentBatch`, `BatchProgressMetrics`, `SubtopicCoverage`, `TopicCoverage`, `CoverageOverviewData`, `ContentGapAnalysis`
  - `SocialAnalyticsRecord`, `CreateSocialAnalyticsInput`, `SocialAnalyticsSummary`, `SocialAnalyticsQueryFilters`
  - `SocialCommentRecord`, `CreateSocialCommentInput`, `ImportSocialCommentsInput`, `SocialCommentQueryFilters`, `CommentIntelligenceRecord`
  - `SocialPerformanceIntelligenceRecord`, `ContentStrategyRecommendation`
  - `DashboardMetrics`, `TodaysWorkItem`, `BottleneckStage`, `StaleContentItem`, `PublishingReadinessItem`, `GlobalSearchResult`, `DashboardOverviewData`
  - `IntegrityIssue`, `IntegritySeverity`, `IntegrityCategory`, `WorksheetHealthSummary`, `IntegrityCheckSummary`
- `shared/types/user.ts`:
  - `User`, `Assignment`, `UserWorkload`, `TeamWorkloadSummary`, `UnassignedWorkItem`, `MyWorkSummary`
- `shared/types/audit.ts`:
  - `AuditLog`, `Workflow`

---

## 4. Shared Contracts Extracted (`shared/contracts/`)

- `shared/contracts/api.ts`:
  - `ApiResponseEnvelope<T>`: Universal API envelope wrapper `{ success: true, data: T, meta?: ApiResponseMeta }`
  - `ApiSuccessResponse<T>`, `ApiErrorResponse`, `ApiErrorPayload`, `ResponsePaginationMeta`
- `shared/contracts/questions.ts`:
  - `CreateQuestionInput`, `UpdateQuestionInput`, `SaveQuestionDraftInput`, `SubmitForVerificationInput`
  - `GenerateCandidateInput`, `RefineCandidateInput`, `GenerationResult`
  - `ValidationResult`, `ValidationCheckItem`, `AnswerVerificationResult`, `ExplanationVerificationResult`, `CandidateValidationReport`
- `shared/contracts/workflow.ts`:
  - `WorkflowDimensionState`, `WorkflowTransitionRequest`, `WorkflowTransitionResponse`, `WorkflowTransitionInput`, `WorkflowTransitionResult`
  - `WorkflowActionContext`, `WorkflowActorContext`, `WorkflowInstanceDocument`, `ValidTransitionTarget`
- `shared/contracts/rbac.ts`:
  - `CapabilityString`, `formatCapability()`, `parseCapability()`
  - `UserAccessProfile`, `RoleCapabilities`
- `shared/contracts/planning.ts`:
  - `ContentMasterDetails`, `QuestionSimilarityMatch`, `DiversityRadarReport`, `ContentDiversityWarning`
- `shared/contracts/assignments.ts`:
  - `CreateAssignmentInput`, `UpdateAssignmentInput`, `BulkAssignInput`, `AssignmentFilters`
- `shared/contracts/users.ts`:
  - `CreateUserInput`, `UpdateUserInput`, `UserFilters`
- `shared/contracts/system.ts`:
  - `ConnectivityStatus`, `AuthStatus`, `OperationalTelemetry`, `OperationalHealthReport`, `SystemHealthReport`

---

## 5. Shared Constants Extracted (`shared/constants/`)

- `shared/constants/enums.ts`:
  - `DifficultyLevel`, `QuestionDifficulty` (alias)
  - `QuestionStatus`, `QuestionValidationStatus`, `RenderValidationStatus`
  - `VideoProductionStatus`, `CanonicalProductionReadiness`, `QuestionLanguage`
  - `PublishingPlatform`, `PlatformType`, `SocialPublishStatus`, `SocialReviewStatus`, `SocialQualityStatus`
  - `QuestionStyle`, `PriorityLevel`, `ContentMasterStatus`, `ContentPlanStatus`, `ContentBatchStatus`, `AssignmentStatus`
  - `AiRefinementAction`, `SocialPlatform`
- `shared/constants/workflow.ts`:
  - `CANONICAL_15_STEPS`: Array of `CanonicalStepDefinition` definitions for Steps 01 through 15
  - `CANONICAL_WORKFLOW_STEPS`: Indexed step definition map
  - Decoupled state dimensions: `EditorialStatus`, `ValidationStatus`, `AssetStatus`, `PublishStatus`, `AnalyticsStatus`
  - Five decoupled dimensions: `ContentStatus`, `MediaStatus`, `PublicationStatus`, `JobStatus`
- `shared/constants/roles.ts`:
  - `CanonicalRbacRole` (11 canonical roles), `CANONICAL_RBAC_ROLES`, `CanonicalRole`
  - `UserRole` (20 legacy roles for user directory compatibility)
  - `AuthorizationResource`, `AuthorizationAction`, `AssignmentRole`, `AssignmentEntityType`, `AssignmentTaskType`

---

## 6. Backend-Only Types Intentionally Retained

The following categories were strictly audited and confirmed NOT to be moved to `shared/`:
- **Persistence internals**: `BaseRepository<T>`, `IRepository<T>`, `FirestoreRepository<T>`, `FirestoreConverters`, Firestore document converters, transaction runners, queries, batches, and connection options.
- **Server routing & context**: Express `Request`, `Response`, `NextFunction`, `AuthenticatedRequest`, `MiddlewareContext`, route handlers, and error handlers.
- **Security & Authorization engine internals**: `Scrypt` password hasher internals, HMAC token signers, authorization policy evaluation graphs, and session store mechanics.
- **AI Engine implementations**: Gemini SDK instances, prompt engineering templates, token throttling queues, and validation engines (`CandidateValidator`, `MultiLayerVerificationEngine`).
- **Configuration & Secrets**: `process.env` bindings, service account paths, Firebase Admin initialization credentials.

---

## 7. Frontend-Only Types Intentionally Retained

- React presentation types: Component Props, form control values, UI view modes, tab states, breadcrumb display states, local hook state interfaces.
- Design system primitives: Icon names, modal states, toast message queue objects, responsive layout breakpoints.

---

## 8. API Contract Changes at Import Level

1. **Frontend**: All 74 UI components, pages, design system tokens, and api client modules now import contracts and types from `../../shared` or `../../../shared`. Zero references to `src/types` remain in `frontend/`.
2. **Frontend API Client (`frontend/api/api-client.ts`)**:
   - Consumes canonical DTOs and envelopes from `shared/contracts` and `shared/types`.
   - Has zero dependencies on backend services, backend validators, or database repositories.
3. **Frontend Re-export Shim (`frontend/api/contracts.ts`)**:
   - Re-exports cleanly from `../../shared`, preventing any accidental breakage for legacy paths.

---

## 9. Workflow Contract Placement

- Canonical 15-stage workflow definitions and route mappings live in `shared/constants/workflow.ts` (`CANONICAL_15_STEPS`, `CANONICAL_WORKFLOW_STEPS`).
- Transition DTOs, transition input/result types, and actor context interfaces live in `shared/contracts/workflow.ts`.
- The authoritative workflow execution engine (`workflow-engine.service.ts`) remains strictly in `backend/infrastructure/services/`.

---

## 10. RBAC Contract Placement

- Roles, resources, and action identifiers live in `shared/constants/roles.ts`.
- Capability formatting (`formatCapability`, `parseCapability`), access profiles, and permission DTOs live in `shared/contracts/rbac.ts`.
- Policy evaluation engines, session authorization middleware, and database access enforcement remain strictly in `backend/infrastructure/auth/`.

---

## 11. Validation-Schema Decisions

- Pure API contract DTOs and envelope validations are technology-independent and reside in `shared/contracts/`.
- Deep domain validation rules requiring Firestore lookups, reference checks, AI validation, or server secrets remain backend-owned under `backend/features/.../validation/`.
- `database/firestore/` contains zero generic request validation schemas.

---

## 12. Dependency-Direction Result

The target unidirectional dependency model is fully enforced and verified:

```
frontend ───────────► shared
    │
    ▼
   API (HTTP boundary)
    ▲
    │
backend ────────────► shared
    │
    ▼
database/firestore ─► shared
```

Boundary test results:
- `shared → frontend`: **0 imports**
- `shared → backend`: **0 imports**
- `shared → database`: **0 imports**
- `shared → src/`: **0 imports**
- `shared → @google/genai`: **0 imports**
- `shared → process.env`: **0 references**
- `frontend → backend implementation`: **0 imports**
- `frontend → database`: **0 imports**
- `frontend → src/types`: **0 imports**

---

## 13. Duplicate-Definition Audit

- **Removed duplicates**:
  - Eliminated duplicate `DifficultyLevel` nominal enum declaration across `src/types` and `shared`, establishing `shared/constants/enums.ts` as the sole canonical source of truth with `src/types/index.ts` re-exporting the canonical shared enums.
  - Eliminated duplicate inline type definitions in `frontend/api/contracts.ts` and `frontend/api/api-client.ts`.
  - Unified `CanonicalStepDefinition` and `CANONICAL_15_STEPS` between frontend presentation and workflow constants.
- **Intentional distinctions preserved**:
  - `UserRole` (legacy 20-role directory representation) vs `CanonicalRbacRole` (authoritative 11-role capability model). Both are co-located in `shared/constants/roles.ts` with explicit documentation.

---

## 14. Architecture Test Results

Test executed: `tests/s7-frontend-backend-boundary.test.ts`
- Scanned 123 frontend files: **0 violations**
- Scanned 162 backend files: **0 violations**
- Scanned 47 database files: **0 violations**
- Scanned 20 shared files: **0 violations**
- Physical backend ownership: Verified
- Physical database ownership: Verified
- Result: **ALL GATES PASSED**

---

## 15. Quality Gate Results

| Check | Command | Result |
|---|---|---|
| Static Typecheck | `npm run lint` (`tsc --noEmit`) | **0 errors, Exit code 0** |
| Production Build | `npm run build` (`vite build && esbuild ...`) | **Vite bundle + dist/server.cjs (2.3 MB), Exit code 0** |
| Boundary Architecture | `npx tsx tests/s7-frontend-backend-boundary.test.ts` | **PASS (All 6 sections passed)** |
| Auth Regression | `npx tsx tests/fc-001-auth.test.ts` | **7 passed, 0 failed** |
| RBAC Regression | `npx tsx tests/fc-002-rbac.test.ts` | **12 passed, 0 failed** |
| Audit Regression | `npx tsx tests/fc-004-audit.test.ts` | **8 passed, 0 failed** |
| Workflow Regression | `npx tsx tests/fc-005-workflow.test.ts` | **5 passed, 0 failed** |
| 2-Tier Taxonomy | `npx tsx tests/s5-two-tier-taxonomy.test.ts` | **11 passed, 0 failed** |
| No-Sequence Architecture | `npx tsx tests/s6-no-sequence-architecture.test.ts` | **10 passed, 0 failed** |
| Runtime Smoke Test | `npx tsx tests/s7-runtime-smoke.test.ts` | **All endpoints (200, 401, healthz, readyz, firestore read) passed** |

---

## 16. Git Commit SHA

- Initial Commit: `d0be949d0201448eeb6cd729bfafb2527ec9f78f`
- Branch: `main`

---

## 17. HEAD == origin/main

- Verified: `HEAD == origin/main` (Synchronized with remote main)
- Working Tree: Clean

---

## 18. Remaining Debt

- In subsequent sprint tasks (e.g. S7-T09), backend services and repository imports still referencing `src/types` can be progressively updated to import directly from `shared/types` and `shared/constants`, allowing the eventual removal of the `src/types/` compatibility barrel.
