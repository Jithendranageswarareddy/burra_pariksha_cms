# Burra Pariksha CMS
# 15 — API Architecture & Contracts

Stage: 15 — API Architecture & Contracts

STATUS:
ACCEPTED — COMPLETE — CLOSED

Implementation Status:
COMPLETE

Technical Verification:
PASSED

GitHub Verification:
PASSED

Product Owner Acceptance:
ACCEPTED

Stage Closure:
CLOSED

Closure Date:
2026-10-02

Version:
1.1.0

Purpose:
Establishes the authoritative backend API contracts for the Burra Pariksha Content Management System (BP-CMS). Formally specifies:
1. **Universal Protocol Envelopes:** Standardized JSON response envelope (`success: true`, `data`, `meta`) and error envelope (`success: false`, `error: { code, message, details, timestamp, requestId }`).
2. **Error Codes Dictionary:** 9 canonical error codes mapped to precise HTTP status codes (401, 403, 400, 422, 404, 409, 500).
3. **15 Canonical Workflow Step Endpoints:** Exhaustive contracts covering Steps 01 through 15 with endpoint paths, HTTP verbs, Zod request schemas, required RBAC capabilities (`RESOURCE:ACTION`), human-gating flags (`AP-009`), and audit event emission types (`AP-014`).
4. **Supporting Domain Endpoints:** Atomic ACID workflow transitions, media asset metadata ingestion with SHA-256 tamper verification (`AP-007`/`AP-008`), pre-retirement cold archiving, session validation, and immutable audit ledger inspection.
5. **Security & Governance Enforcement:** Segregation of Duties (`GAR-02` Anti-Self-Approval), AI-Gating Boundaries (`AP-009`), and Optimistic Concurrency Control (`AP-005` OCC version checks).

---

## 01. Document Control

| Attribute | Specification | Evidence / Governance Note |
| :--- | :--- | :---: |
| **Document Title** | BP-CMS Stage 15 API Architecture & Contracts | FACT |
| **File Path** | `docs/architecture/15-API-CONTRACT.md` | FACT |
| **Document Stage** | Stage 15 — API Architecture & Contracts | FACT |
| **Authority** | Authoritative Backend API Contract Specification & Security Gate Registry | FACT |
| **Status** | ACCEPTED — COMPLETE — CLOSED | FACT |
| **Version** | `1.1.0` (Master SDLC Reset Baseline) | FACT |
| **Closure Date** | 2026-10-02 | FACT |
| **Preceding Verified Stages** | Stage 01 (`01-REQUIREMENTS-BASELINE.md` - 100% Accepted)<br>Stage 02 (`02-BUSINESS-ACCEPTANCE-CRITERIA.md` - 100% Accepted)<br>Stage 03 (`03-CURRENT-SYSTEM-BASELINE.md` - 100% Accepted & Closed)<br>Stage 04 (`04-ARCHITECTURE-PRINCIPLES.md` - 100% Accepted & Closed)<br>Stage 05 (`05-SYSTEM-BOUNDARY.md` - 100% Verified & Closed)<br>Stage 06 (`06-DOMAIN-MODEL.md` - 100% Verified & Closed)<br>Stage 07 (`07-CANONICAL-15-STEP-WORKFLOW.md` - 100% Verified & Closed)<br>Stage 08 (`08-STATE-MODEL.md` - 100% Verified & Closed)<br>Stage 09 (`09-RBAC-CAPABILITY-MATRIX.md` - 100% Verified & Closed)<br>Stage 10 (`10-FRONTEND-IA.md` - 100% Verified & Closed)<br>Stage 11 (`11-PAGE-ROUTE-CONTRACT.md` - 100% Verified & Closed)<br>Stage 12 (`12-DATABASE-DECISION.md` - 100% Verified & Closed)<br>Stage 13 (`13-DATA-CONTRACT.md` - 100% Verified & Closed)<br>Stage 14 (`14-MEDIA-ARCHITECTURE.md` - 100% Verified & Closed) | FACT |
| **Subsequent Stages** | Stage 16+ (Physical Express Controller Middleware Implementations, Workers, Real Cloud Deployments) | FACT |
| **Baseline Repository Commit** | `0b15641` | FACT |
| **Architectural Scope** | Formally specifies API contracts, HTTP verbs, paths, Zod schemas, error dictionaries, segregation of duties, and audit emissions without writing physical Express route handlers | FACT |

### Architectural Deferral Declaration
All physical Express route controller execution implementations, live network listeners on port 3000, database connector pools, and third-party platform API OAuth dispatches are **EXPLICITLY DEFERRED** to subsequent implementation stages (Stage 16+ Physical Backend Services). Zero physical server routes or network sockets are bound in Stage 15; all contracts are declared as strongly typed TypeScript definitions and runtime Zod validation schemas.

---

## 02. Architectural Foundations & Principles

The BP-CMS backend API architecture is designed under strict adherence to the Stage 04 Architecture Principles:
1. **AP-004 Capability-Based Zero Trust:** Endpoints verify granular atomic capabilities in `RESOURCE:ACTION` syntax (Stage 09). Coarse-grained roles alone are insufficient.
2. **AP-005 Concurrency Control (OCC):** Every mutating API operation requires an `expectedVersion` integer. Concurrency collisions fail deterministically with HTTP 409 `CONFLICT_OPTIMISTIC_LOCK`.
3. **AP-007 / AP-008 Media Metadata Decoupling:** Binary bytes never flow through the primary CMS transactional database. The API manages logical metadata, SHA-256 checksums, and Google Drive / Archive locators.
4. **AP-009 Human-Gated Boundaries:** AI agents are categorically barred from executing approvals on Steps 02, 07, 09, 10, 14, and 15 (`FORBIDDEN_BY_AI_GATING`).
5. **GAR-02 Segregation of Duties:** Content creators, authors, and editors are programmatically prohibited from approving or auditing their own work (`FORBIDDEN_BY_SEGREGATION_OF_DUTIES`).
6. **AP-014 Immutable Audit Ledger:** Every state-modifying API request deterministically emits a structured audit event to the append-only ledger collection.

---

## 03. Universal API Response & Error Envelopes

Every BP-CMS HTTP endpoint communicates using standardized JSON envelopes.

### 3.1 Standard Success Envelope (HTTP 200 / 201)
```typescript
interface ApiSuccessResponse<T> {
  readonly success: true;
  readonly data: T;
  readonly meta: {
    readonly timestamp: string;         // ISO-8601 UTC timestamp
    readonly requestId: string;         // Canonical REQ-xxxxxx identifier
    readonly executionDurationMs?: number;
    readonly version?: number;          // Optimistic concurrency version if applicable
  };
}
```

*Example Payload:*
```json
{
  "success": true,
  "data": {
    "questionId": "BP-Q-000412",
    "version": 1,
    "status": "DRAFT"
  },
  "meta": {
    "timestamp": "2026-10-02T20:00:00.000Z",
    "requestId": "REQ-7f91a2bc"
  }
}
```

### 3.2 Standard Error Envelope (HTTP 4xx / 5xx)
```typescript
interface ApiErrorResponse {
  readonly success: false;
  readonly error: {
    readonly code: ApiErrorCode;        // Standardized error code enum
    readonly message: string;           // Clear, actionable human-readable message
    readonly details?: Record<string, unknown> | null; // Sanitized debugging context
    readonly timestamp: string;         // ISO-8601 UTC timestamp
    readonly requestId: string;         // Tracing identifier matching request header
  };
}
```

*Example Error Payload (Segregation of Duties Violation):*
```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN_BY_SEGREGATION_OF_DUTIES",
    "message": "Self-approval prohibited: Creator (USR-000101) cannot perform audit verification on their own asset (GAR-02).",
    "details": {
      "authorUserId": "USR-000101",
      "actorUserId": "USR-000101"
    },
    "timestamp": "2026-10-02T20:00:00.000Z",
    "requestId": "REQ-ERR-SOD-mf7a19bc"
  }
}
```

---

## 04. Standardized Error Codes Dictionary

| Error Code | HTTP Status | Trigger Condition / Architectural Boundary |
| :--- | :---: | :--- |
| `UNAUTHENTICATED` | **401 Unauthorized** | Missing, expired, malformed, or invalid Authorization Bearer token. |
| `FORBIDDEN_LACKS_CAPABILITY` | **403 Forbidden** | Authenticated user lacks the explicit `RESOURCE:ACTION` capability required by the endpoint (Stage 09 RBAC). |
| `FORBIDDEN_BY_SEGREGATION_OF_DUTIES` | **403 Forbidden** | Attempted self-review or self-approval (`GAR-02`). Content author/creator matches the verifying actor. |
| `FORBIDDEN_BY_AI_GATING` | **403 Forbidden** | Automated agent or AI assistant attempted to invoke approval/sign-off on human-gated steps (02, 07, 09, 10, 14, 15 per `AP-009`). |
| `FORBIDDEN_BY_BUSINESS_RULE` | **400 Bad Request** | Business precondition failed (e.g., incomplete 10-point review checklist, invalid resolution, missing mandatory watermark). |
| `VALIDATION_ERROR` | **422 Unprocessable** | Request body, query parameters, or URL path parameters failed Zod schema validation. |
| `RESOURCE_NOT_FOUND` | **404 Not Found** | Target resource ID does not exist in Firestore or is marked soft-deleted (`isDeleted: true`). |
| `CONFLICT_OPTIMISTIC_LOCK` | **409 Conflict** | Concurrency conflict (`AP-005`). `expectedVersion` does not match the current Firestore document `version`. |
| `INTERNAL_SERVER_ERROR` | **500 Internal Error** | Unhandled server exception. Details sanitized to prevent information leakage. |

---

## 05. Canonical 15-Step Workflow API Contracts

All 15 stages from the Stage 07 Canonical Workflow are mapped to dedicated REST endpoints.

| Step | HTTP Verb | Endpoint Path | Required Capability | Human Gated? | Anti-Self Approval? | Emitted Audit Event |
| :---: | :---: | :--- | :--- | :---: | :---: | :--- |
| **01** | `POST` | `/api/v1/questions` | `QUESTION:CREATE` | No | No | `QUESTION_CREATED` |
| **02** | `POST` | `/api/v1/questions/:id/reviews` | `QUESTION_REVIEW:VERIFY` | **Yes** | **Yes (`GAR-02`)** | `QUESTION_VERIFIED` |
| **03** | `POST` | `/api/v1/contents/:id/scripts` | `SCRIPT:CREATE` | No | No | `SCRIPT_CREATED` |
| **04** | `POST` | `/api/v1/videos` | `VIDEO:CREATE` | No | No | `VIDEO_SESSION_SCHEDULED` |
| **05** | `POST` | `/api/v1/videos/:id/takes` | `VIDEO_TAKE:UPLOAD` | No | No | `VIDEO_TAKE_INGESTED` |
| **06** | `POST` | `/api/v1/videos/:id/edits` | `VIDEO_EDIT:CREATE` | No | No | `VIDEO_EDIT_SUBMITTED` |
| **07** | `POST` | `/api/v1/video-edits/:id/qc` | `VIDEO_EDIT:APPROVE` | **Yes** | **Yes (`GAR-02`)** | `VIDEO_QC_DECIDED` |
| **08** | `POST` | `/api/v1/contents/:id/thumbnails` | `THUMBNAIL:CREATE` | No | No | `THUMBNAIL_REGISTERED` |
| **09** | `POST` | `/api/v1/contents/:id/social-reviews` | `SOCIAL_REVIEW:APPROVE` | **Yes** | No | `SOCIAL_REVIEW_DECIDED` |
| **10** | `POST` | `/api/v1/publishing-packages` | `PUBLISHING_PACKAGE:CREATE` | **Yes** | No | `PUBLISHING_PACKAGE_STAGED` |
| **11** | `POST` | `/api/v1/publishing-packages/:id/publish` | `PUBLICATION:PUBLISH` | No | No | `PUBLICATION_DISPATCHED` |
| **12** | `POST` | `/api/v1/publications/:id/sync` | `PUBLICATION:SYNC` | No | No | `PUBLICATION_SYNCED` |
| **13** | `POST` | `/api/v1/publications/:id/analytics-snapshots` | `ANALYTICS_SNAPSHOT:CREATE` | No | No | `ANALYTICS_INGESTED` |
| **14** | `POST` | `/api/v1/contents/:id/performance-reviews` | `PERFORMANCE_RECORD:REVIEW` | **Yes** | No | `PERFORMANCE_REVIEWED` |
| **15** | `POST` | `/api/v1/contents/:id/intelligence-insights` | `INTELLIGENCE_INSIGHT:APPROVE` | **Yes** | No | `INTELLIGENCE_LOOP_CLOSED` |

---

## 06. Detailed Step Specifications & Validation Rules

### Step 01: Question Generation / Drafting
- **Path & Method:** `POST /api/v1/questions`
- **Capability:** `QUESTION:CREATE`
- **Request Body Contract:** `Step01CreateQuestionRequestSchema`
- **Validation Rules:**
  - `promptTelugu`: min 5, max 500 chars (authentic Telugu Unicode script).
  - 4 options (`optionA` .. `optionD`) non-empty.
  - `correctOptionIndex`: 0, 1, 2, or 3.
  - `subject`: `MATHEMATICS`, `PHYSICAL_SCIENCE`, `BIOLOGICAL_SCIENCE`, or `SOCIAL_STUDIES`.
  - `classGrade`: 6 to 10 integer.
- **Workflow Impact:** Generates `BP-Q-xxxxxx`, initial version `BP-QV-xxxxxx-V01`, advances workflow instance to Step 02 (`PENDING_REVIEW`).

### Step 02: Question Verification / Pedagogical Review
- **Path & Method:** `POST /api/v1/questions/:id/reviews`
- **Capability:** `QUESTION_REVIEW:VERIFY`
- **Governance:** Human-Gated (`AP-009`); Anti-Self-Approval (`GAR-02`: reviewer must not equal question creator).
- **Request Body Contract:** `Step02QuestionReviewRequestSchema`
- **Validation Rules:**
  - Evaluates all 10 pedagogical checklist booleans: accuracy, Telugu grammar, distractors, single correct answer, explanation quality, syllabus alignment, age appropriateness, mathematical rigour, diagram clarity, and bias-free content.
  - `expectedVersion`: integer OCC check.
  - `verdict`: `APPROVED` | `REVISION_REQUIRED` | `REJECTED`.
- **Workflow Impact:**
  - `APPROVED`: Question status becomes `VERIFIED`. Advances workflow instance to Step 03 (`AUDIENCE_SCRIPT`).
  - `REVISION_REQUIRED`: Question status becomes `REVISION_REQUIRED`. Triggers rework loop back to Step 01.

### Step 07: Final Video QC Audit Sign-off
- **Path & Method:** `POST /api/v1/video-edits/:id/qc`
- **Capability:** `VIDEO_EDIT:APPROVE`
- **Governance:** Human-Gated (`AP-009`); Anti-Self-Approval (`GAR-02`: reviewer must not equal video editor).
- **Request Body Contract:** `Step07VideoQcRequestSchema`
- **Validation Rules:**
  - Loudness compliance, clipping absence, audio sync, artifact absence, Telugu subtitle timing alignment, and branding overlay.
- **Workflow Impact:**
  - `APPROVED`: Video Edit status becomes `QC_APPROVED`. Advances to Step 08.
  - `REVISION_REQUIRED`: Triggers rework loop back to Step 06 (Editing Bay).

### Step 09: Social Review & 9:16 Mobile Framing Simulator Sign-off
- **Path & Method:** `POST /api/v1/contents/:id/social-reviews`
- **Capability:** `SOCIAL_REVIEW:APPROVE`
- **Governance:** Human-Gated (`AP-009`).
- **Request Body Contract:** `Step09SocialReviewRequestSchema`
- **Validation Rules:**
  - UI safe zone validations for YouTube Shorts, Instagram Reels, and Facebook Reels.
  - Telugu headline legibility rating (1 to 5).
- **Workflow Impact:** Advances to Step 10 (`PUBLISHING_SETUP`).

### Step 10: Publishing Package Staging & Release Assembly
- **Path & Method:** `POST /api/v1/publishing-packages`
- **Capability:** `PUBLISHING_PACKAGE:CREATE`
- **Governance:** Human-Gated (`AP-009` Content Lead sign-off).
- **Request Body Contract:** `Step10CreatePublishingPackageRequestSchema`
- **Validation Rules:**
  - Resolves approved `videoEditId` and `thumbnailId`.
  - Target platforms: non-empty array of `YOUTUBE_SHORTS`, `INSTAGRAM_REELS`, `FACEBOOK_REELS`.
  - Scheduled release time (future ISO date string).

---

## 07. Supporting Domain API Contracts

### 7.1 Atomic Workflow State Transitions (`AP-001`, `AP-005`)
- **Path & Method:** `POST /api/v1/workflow-instances/:id/transitions`
- **Capability:** `WORKFLOW_TRANSITION:TRANSITION`
- **Contract:** `WorkflowTransitionRequestSchema`
- **Semantics:** Executes an atomic multi-document transaction updating the `WorkflowInstance` and appending an immutable `WorkflowTransition` audit document. Enforces OCC on current step and valid transition matrix paths (Stage 07/08).

### 7.2 Media Ingestion & Tamper Verification (`AP-007`, `AP-008`, Stage 14)
- **Metadata Registration:** `POST /api/v1/media-assets` (`MEDIA_ASSET:CREATE`)
  - Enforces 64-character hex SHA-256 hash registration, Google Drive locator IDs, and strict provider decoupling.
- **Tamper Verification:** `POST /api/v1/media-assets/:id/verify-hash` (`MEDIA_ASSET:VERIFY`)
  - Compares recalculation hash against registered Firestore hash; triggers quarantine if mismatched.
- **Cold Storage Archival:** `POST /api/v1/media-assets/:id/archive` (`MEDIA_ASSET:ARCHIVE`)
  - Transitions retired active media from Google Drive to Google Cloud Storage Coldline.

### 7.3 Identity, Role, & Session Queries
- **User Session:** `GET /api/v1/auth/session` (`USER:VIEW`)
  - Returns authenticated user details, assigned role, and resolved array of capability strings.
- **Audit Ledger Inspection:** `GET /api/v1/audit-events` (`AUDIT_EVENT:VIEW`)
  - Read-only inspection of the append-only ledger for compliance auditing.

---

## 08. Security & Business Rules Governance Engine

The API layer enforces three non-negotiable security interceptors prior to route handler execution:

```
[ Incoming HTTP Request ]
          │
          ▼
[ 1. Bearer Token Authentication ] ──(Invalid)──► 401 UNAUTHENTICATED
          │
          ▼
[ 2. Zero-Trust Capability Check ] ──(Missing)──► 403 FORBIDDEN_LACKS_CAPABILITY
          │
          ▼
[ 3. AI-Gating Boundary Check ]   ──(AI on Gate)► 403 FORBIDDEN_BY_AI_GATING
          │
          ▼
[ 4. Segregation of Duties Check] ──(Self-Approve)► 403 FORBIDDEN_BY_SEGREGATION_OF_DUTIES
          │
          ▼
[ 5. Zod Runtime Schema Validate] ──(Malformed)──► 422 VALIDATION_ERROR
          │
          ▼
[ 6. Optimistic Concurrency Check] ──(Version Diff)► 409 CONFLICT_OPTIMISTIC_LOCK
          │
          ▼
[ 7. Atomic Business Execution & Audit Ledger Event Emit (AP-014) ]
          │
          ▼
[ 200 / 201 Standard Success Response Envelope ]
```

---

## 09. Architectural Verification & Acceptance Sign-off

### 9.1 Verification Suite Results (`test:stage15`)
The automated verification suite (`src/tests/stage15-api-contract.test.ts`) programmatically validates all Stage 15 specifications:
1. Universal Response Envelope Validation: **PASSED** (100% conforming envelope layout)
2. Standardized Error Codes Dictionary: **PASSED** (All 9 error codes mapped to correct HTTP statuses)
3. Canonical 15-Step Workflow API Registry: **PASSED** (15/15 step contracts with valid capabilities)
4. Zod Request Schemas: **PASSED** (Positive and negative test cases for all 15 stages)
5. Segregation of Duties (`GAR-02`): **PASSED** (Creator self-approval strictly rejected)
6. AI-Gating Boundary (`AP-009`): **PASSED** (AI blocked from all 6 human checkpoints)
7. Optimistic Concurrency Control (`AP-005`): **PASSED** (Version mismatches rejected with 409)
8. Capability-Based Access Control (`AP-004`): **PASSED** (Granular capability validation)
9. Supporting Domain & Media Ingestion: **PASSED** (Workflow transitions and SHA-256 media contracts)

### 9.2 Formal Acceptance Declaration
```
================================================================================
STAGE 15 — API ARCHITECTURE & CONTRACTS
STATUS: ACCEPTED — COMPLETE — CLOSED
VERSION: 1.1.0
API CONTRACTS: src/types/api-contracts.ts (15 CANONICAL WORKFLOW ENDPOINTS + SUPPORTING DOMAIN)
TEST SUITE: src/tests/stage15-api-contract.test.ts (9/9 PASSED)
TECHNICAL VERIFICATION: PASSED
PRODUCT OWNER ACCEPTANCE: ACCEPTED
STAGE 15 CLOSED: YES
NEXT STAGE: STAGE 16 — NOT STARTED
================================================================================
```
