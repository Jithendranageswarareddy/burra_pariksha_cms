# 15 — API ARCHITECTURE & CONTRACT
## Burra Pariksha Content Management System (BP-CMS)
### Stage 15 of 30-Stage Modernization Program — Authoritative Backend REST API Contract

```
================================================================================
Document ID:       BP-ARCH-15-API
Version:           15.0.0-SDLC-RESTART
Status:            APPROVED / AUTHORITATIVE ARCHITECTURAL SPECIFICATION
Scope:             Backend REST API Endpoints, Envelopes, Request/Response Schemas,
                   15-Step Workflow Contracts, RBAC Gating, Concurrency & Idempotency
Upstream Inputs:   01-REQUIREMENTS-BASELINE.md
                   02-BUSINESS-ACCEPTANCE-CRITERIA.md
                   03-CURRENT-SYSTEM-BASELINE.md
                   04-ARCHITECTURE-PRINCIPLES.md (AP-001 through AP-014)
                   05-TARGET-SYSTEM-BOUNDARY.md
                   06-DOMAIN-MODEL.md
                   07-CANONICAL-15-STEP-WORKFLOW.md
                   08-STATE-MODEL.md
                   09-RBAC-CAPABILITY-MODEL.md
                   10-FRONTEND-INFORMATION-ARCHITECTURE.md
                   11-PAGE-ROUTE-CONTRACT.md
                   12-DATABASE-ARCHITECTURE.md
                   13-DATA-MODEL-DATA-CONTRACT.md
                   14-MEDIA-ARCHITECTURE.md
Downstream Stages: 16-REALTIME-ARCHITECTURE.md
                   17-JOB-ASYNC-ARCHITECTURE.md
                   18-AI-ARCHITECTURE.md
                   19-SECURITY-ARCHITECTURE.md
                   20-ANALYTICS-ARCHITECTURE.md
                   21-AUDIT-OBSERVABILITY.md
                   26-FEATURE-CONTRACTS.md
                   27-IMPLEMENTATION.md
                   28-INTEGRATION-HUMAN-TESTING.md
Target Prefix:     /api/v1 (Canonical REST Surface)
Legacy Prefix:     /api (Brownfield Compatibility Shim)
Budget Constraint: Hard Initial Infrastructure Ceiling: ₹0–₹100 (Zero-Cost Invariant)
================================================================================
```

---

## 1. Document Governance & Anti-Overclaim Statement

### 1.1 Purpose
This document establishes the authoritative **Backend REST API Architecture and Contract** for the Burra Pariksha Content Management System (BP-CMS). Building directly upon the Stage 06 Domain Model, Stage 07 Canonical 15-Step Workflow, Stage 08 State Model, Stage 09 RBAC Capability Model, Stage 13 Data Contract, and Stage 14 Media Architecture, this specification establishes the binding interface contract between client interfaces, background workers, and the server-authoritative application core.

### 1.2 Strict Anti-Overclaim Invariants
1. **Design and Contract Specification Only:** This document formalizes the *conceptual and logical backend API contracts*. It does **not** assert that Express route handlers, controllers, middlewares, or validation filters have been implemented or refactored.
2. **Zero Runtime Code Modification:** No application source code, Express router files (`src/server/routes.ts`), controller classes, or middleware pipelines are modified in Stage 15.
3. **No Premature Dependency Installation:** No external HTTP routing or validation libraries are installed during this stage.
4. **Contractual Boundary:** Stage 15 establishes the binding contract that **Stage 27 (Implementation)** and **Stage 28 (Integration & Testing)** will physically implement and verify.

---

## 2. API Scope & Architectural Context

The BP-CMS API surface partitions into four distinct operational classifications:
1. **Canonical Target API (`/api/v1/*`):** Strongly-typed, versioned REST endpoints implementing the complete domain model, fine-grained capability checks (`RESOURCE:ACTION`), optimistic concurrency control (`expectedVersion`), and standard response envelopes.
2. **Legacy / Brownfield API (`/api/*`):** Existing monolithic endpoints currently registered in `src/server/routes.ts`. These remain operational during the modernization phase and are mapped for controlled deprecation.
3. **Internal Streaming & Proxy Endpoints (`/api/v1/media/stream/:refId`):** Authenticated, range-supporting media streaming tunnels insulating users from raw cloud storage credentials.
4. **External Integration Adapters:** Background asynchronous endpoints coordinating data exchange with YouTube Data API, Meta Graph API, Google Drive, and Gemini Assistive AI.

---

## 3. Authoritative Upstream Inputs

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                AUTHORITATIVE UPSTREAM INPUTS                           │
├─────────────────────────┬──────────────────────────────────────────────────────────────┤
│ 04. Architecture Princ. │ AP-002 (Server Authoritative), AP-005 (OCC Versioning),      │
│                         │ AP-009 (AI Boundary Gating), AP-010 (Single State Owner).    │
├─────────────────────────┼──────────────────────────────────────────────────────────────┤
│ 07. 15-Step Workflow    │ Explicit lifecycle progression from Step 01 (Question        │
│                         │ Generation) through Step 15 (Pedagogical Intelligence Loop). │
├─────────────────────────┼──────────────────────────────────────────────────────────────┤
│ 08. State Model         │ 6 strictly decoupled state dimensions: Business Workflow,    │
│                         │ Entity Lifecycle, Media Processing, Job, Publication, Archive│
├─────────────────────────┼──────────────────────────────────────────────────────────────┤
│ 09. RBAC Capability     │ User -> Role -> Capability authorization matrix;             │
│                         │ GAR-02 anti-self-approval rule (`author !== reviewer`).      │
├─────────────────────────┼──────────────────────────────────────────────────────────────┤
│ 11. Page Route Contract │ Page-to-API mapping ensuring every UI view has backing data. │
├─────────────────────────┼──────────────────────────────────────────────────────────────┤
│ 13. Data Contract       │ 28 canonical collections, field types, Zod schemas, IDs.     │
├─────────────────────────┼──────────────────────────────────────────────────────────────┤
│ 14. Media Architecture  │ Abstract MediaReference pointers, SHA-256 integrity hashes.   │
└─────────────────────────┴──────────────────────────────────────────────────────────────┘
```

---

## 4. HTTP Contract Standards & Universal Envelopes

All canonical endpoints under `/api/v1/*` strictly adhere to the universal response envelope.

### 4.1 Success Response Envelope (`ApiSuccessResponse<T>`)
```typescript
export interface ApiSuccessMeta {
  readonly timestamp: string;         // ISO 8601 UTC string (Server-generated)
  readonly requestId: string;         // Format: REQ-xxxxxxxx (UUID or correlation token)
  readonly executionDurationMs: number;// Execution latency in milliseconds
  readonly version?: number;          // Document version (for OCC entities)
  readonly pagination?: {             // Present on collection list queries
    readonly page: number;
    readonly limit: number;
    readonly totalCount: number;
    readonly totalPages: number;
    readonly hasNextPage: boolean;
  };
}

export interface ApiSuccessResponse<T> {
  readonly success: true;
  readonly data: T;
  readonly meta: ApiSuccessMeta;
}
```

### 4.2 Error Response Envelope (`ApiErrorResponse`)
```typescript
export interface ApiErrorDetails {
  readonly code: ApiErrorCode;        // Machine-readable error enum
  readonly message: string;           // Human-readable explanation
  readonly details?: Record<string, unknown> | null; // Detailed field validation errors
  readonly timestamp: string;         // ISO 8601 UTC string
  readonly requestId: string;         // Correlation identifier for log investigation
}

export interface ApiErrorResponse {
  readonly success: false;
  readonly error: ApiErrorDetails;
}
```

### 4.3 Standardized Error Codes & HTTP Status Mapping
```text
┌───────────────────────────────────────┬────────────┬───────────────────────────────────┐
│ Error Code Enum                       │ HTTP Status│ Business Scenario                 │
├───────────────────────────────────────┼────────────┼───────────────────────────────────┤
│ `UNAUTHENTICATED`                     │ 401        │ Missing or expired bearer/cookie  │
│ `FORBIDDEN_LACKS_CAPABILITY`          │ 403        │ User lacks specific permission    │
│ `FORBIDDEN_BY_SEGREGATION_OF_DUTIES`  │ 403        │ GAR-02: Self-approval prohibited  │
│ `FORBIDDEN_BY_AI_GATING`              │ 403        │ AP-009: AI cannot approve human-  │
│                                       │            │ gated workflow steps              │
│ `RESOURCE_NOT_FOUND`                  │ 404        │ Target ID does not exist          │
│ `CONFLICT_OPTIMISTIC_LOCK`            │ 409        │ OCC check failed (stale version)  │
│ `CONFLICT_INVALID_WORKFLOW_STATE`     │ 409        │ Step transition invalid from state│
│ `VALIDATION_ERROR`                    │ 422        │ Zod schema validation failure     │
│ `RATE_LIMIT_EXCEEDED`                 │ 429        │ Too many requests on throttled API│
│ `INTERNAL_SERVER_ERROR`               │ 500        │ Uncaught server exception         │
│ `EXTERNAL_DEPENDENCY_ERROR`           │ 502 / 503  │ Drive, YouTube, or Gemini failure │
└───────────────────────────────────────┴────────────┴───────────────────────────────────┘
```

---

## 5. Security, Request Context & Concurrency Contract

### 5.1 Request Context (`ApiRequestContext`)
Every request passing through `/api/v1/*` middleware is enriched with a verified, server-derived security context:
```typescript
export interface ApiRequestContext {
  readonly requestId: string;         // Injected from X-Request-ID or auto-generated
  readonly actorUserId: string;       // Verified from session cookie / JWT (USR-xxxxxx)
  readonly actorRoles: readonly string[]; // Canonical assigned roles (e.g. ROLE_CONTENT_LEAD)
  readonly actorCapabilities: readonly string[]; // Flattened array of RESOURCE:ACTION tokens
  readonly isAiAgent: boolean;        // True if call originates from background AI worker
  readonly ipAddress: string;         // Client IP address
  readonly userAgent: string;         // Client browser/device signature
}
```
**Strict Invariant:** Client-supplied actor claims (`req.body.actorId` or `req.headers['x-actor-id']`) are **strictly untrusted and discarded**. Actor identity is derived solely from the cryptographically verified session token.

### 5.2 Optimistic Concurrency Control (OCC) Contract
For all mutable business entities, client mutation requests (`PUT`, `PATCH`, `POST /transition`) must supply the `expectedVersion`:
1. Client fetches document with `meta.version = 4`.
2. Client submits update with `{ expectedVersion: 4, ...data }`.
3. Server executes Firestore transaction verifying: `currentDocument.version === payload.expectedVersion`.
4. If version matches, write commits and document version advances to `5`.
5. If version mismatches, server aborts transaction and returns `409 Conflict` with `CONFLICT_OPTIMISTIC_LOCK`.

### 5.3 Idempotency Contract
Mutating operations that trigger external broadcast, media ingestion, or state transitions accept an optional or mandatory `Idempotency-Key: <UUIDv4>` header. Duplicate submissions within a 24-hour window return the cached response of the initial commit without re-executing business logic.

---

## 6. Canonical 15-Step Workflow API Contracts

The 15-step workflow lifecycle is orchestrated through dedicated, strongly-typed endpoint contracts. Every step specifies the exact entering, executing, reviewing, and advancing APIs.

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                         CANONICAL 15-STEP WORKFLOW API SUITE                           │
├──────┬────────────────────────┬────────┬─────────────────────────────┬─────────────────┤
│ Step │ Business Stage         │ Method │ Canonical Endpoint Path     │ Capability Req. │
├──────┼────────────────────────┼────────┼─────────────────────────────┼─────────────────┤
│ 01   │ Question Generation    │ POST   │ `/api/v1/questions`         │ QUESTION:CREATE │
│ 02   │ Question Verification  │ POST   │ `/api/v1/questions/:id/rev.`│ QUESTION_REV:VER│
│ 03   │ Audience Script        │ POST   │ `/api/v1/contents/:id/script` SCRIPT:CREATE   │
│ 04   │ Teleprompter & Filming │ POST   │ `/api/v1/videos`            │ VIDEO:CREATE    │
│ 05   │ Raw Video Ingestion    │ POST   │ `/api/v1/videos/:id/takes`  │ VIDEO_TAKE:UPL  │
│ 06   │ Editing Bay Submission │ POST   │ `/api/v1/videos/:id/edits`  │ VIDEO_EDIT:CREAT│
│ 07   │ Final QC Sign-off      │ POST   │ `/api/v1/video-edits/:id/qc`│ VIDEO_EDIT:APPR │
│ 08   │ Thumbnail Registration │ POST   │ `/api/v1/contents/:id/thumb`│ THUMBNAIL:CREATE│
│ 09   │ Social Review Audit    │ POST   │ `/api/v1/contents/:id/soc-r`│ SOCIAL_REV:APPR │
│ 10   │ Publishing Staging     │ POST   │ `/api/v1/publishing-packages` PKG:CREATE      │
│ 11   │ Publication Dispatch   │ POST   │ `/api/v1/packages/:id/pub`  │ PUBLICATION:PUB │
│ 12   │ Platform Sync          │ POST   │ `/api/v1/publications/:id/sy` PUBLICATION:SYNC│
│ 13   │ Analytics Ingestion    │ POST   │ `/api/v1/pubs/:id/analytics`│ ANALYTICS:CREATE│
│ 14   │ Performance Review     │ POST   │ `/api/v1/contents/:id/perf` │ PERF_REC:REVIEW │
│ 15   │ Intelligence Loop      │ POST   │ `/api/v1/contents/:id/intel`│ INTEL_INS:APPROV│
└──────┴────────────────────────┴────────┴─────────────────────────────┴─────────────────┘
```

---

### 6.1 Step 01 — Question Generation / Drafting

#### `POST /api/v1/questions`
- **Authentication:** Authenticated Session
- **Capability:** `QUESTION:CREATE`
- **Resource / Action:** `QUESTION:CREATE`
- **Request Parameters:** None
- **Request Body:**
  ```json
  {
    "promptTelugu": "ఆంధ్రప్రదేశ్ విభజన చట్టం 2014 ప్రకారం...",
    "optionA": "సెక్షన్ 46",
    "optionB": "సెక్షన్ 47",
    "optionC": "సెక్షన్ 48",
    "optionD": "సెక్షన్ 49",
    "correctOptionIndex": 0,
    "subject": "POLITY",
    "classGrade": 10,
    "curriculumStandard": "APPSC_GROUP_2",
    "difficultyLevel": "MEDIUM",
    "aiDrafted": false,
    "aiPromptContext": null
  }
  ```
- **Validation Rules:**
  - `promptTelugu`: min 10, max 1000 characters.
  - Exactly 4 options; `correctOptionIndex` must be an integer between 0 and 3.
  - `subject` must match syllabus enum.
- **Response Schema:** `ApiSuccessResponse<QuestionDocument>` (HTTP 201 Created).
- **Error Responses:** 401 Unauthenticated, 403 Forbidden (Lacks `QUESTION:CREATE`), 422 Validation Error.
- **Business Rule:** Creates a new `Question` document in `DRAFT` state and automatically initializes an aggregate `Content` item (`BP-CNT-######`) with associated `WorkflowInstance` in Stage 1.
- **Workflow Impact:** Initializes `WorkflowInstance.currentStep = 1`.
- **Audit Event:** Emits `QUESTION_CREATED` with actor ID and correlation UUID.
- **Source of Truth:** Cloud Firestore (`questions`).

---

### 6.2 Step 02 — Question Verification (Human-Gated, Anti-Self-Approval)

#### `POST /api/v1/questions/:id/reviews`
- **Authentication:** Authenticated Session
- **Capability:** `QUESTION_REVIEW:VERIFY`
- **Resource / Action:** `QUESTION_REVIEW:VERIFY`
- **Request Parameters:** `id: string` (e.g. `BP-Q-000142`)
- **Request Body:**
  ```json
  {
    "expectedVersion": 1,
    "checklistAccuracy": true,
    "checklistTeluguGrammar": true,
    "checklistOptionDistractors": true,
    "checklistSingleCorrectAnswer": true,
    "checklistExplanationQuality": true,
    "checklistSyllabusAlignment": true,
    "checklistAgeAppropriate": true,
    "checklistMathematicalRigour": true,
    "checklistDiagramClarity": true,
    "checklistBiasFree": true,
    "verdict": "APPROVED",
    "reviewNotes": "Pedagogical verification complete. Question verified against APPSC 2014 gazette."
  }
  ```
- **Validation Rules:**
  - All 10 checklist booleans are mandatory.
  - `verdict`: `APPROVED` | `REVISION_REQUIRED` | `REJECTED`.
  - `reviewNotes`: min 5, max 1000 characters.
- **Response Schema:** `ApiSuccessResponse<QuestionReviewDocument>` (HTTP 200 OK).
- **Error Responses:**
  - `401 UNAUTHENTICATED`: Missing session.
  - `403 FORBIDDEN_BY_SEGREGATION_OF_DUTIES`: Actor is question author (`GAR-02`).
  - `403 FORBIDDEN_BY_AI_GATING`: Caller is an automated AI agent (`AP-009`).
  - `409 CONFLICT_OPTIMISTIC_LOCK`: Question modified concurrently.
  - `422 VALIDATION_ERROR`: Missing checklist items.
- **Business Rule (GAR-02 Anti-Self-Approval):** Server retrieves the target Question. If `req.user.id === targetQuestion.authorUserId`, mutation is rejected with `403 FORBIDDEN_BY_SEGREGATION_OF_DUTIES`.
- **Workflow Impact:**
  - If `APPROVED`: Atomically advances `WorkflowInstance.currentStep` from 1 to 2, then from 2 to 3 (`Audience Script`), setting `Question.lifecycleState = VERIFIED`.
  - If `REVISION_REQUIRED`: Sets `Question.lifecycleState = REVISION_REQUIRED`, retaining step 2 until revision submitted.
- **Audit Event:** Emits `QUESTION_VERIFIED` with checklist payload and verdict.
- **Source of Truth:** Cloud Firestore (`question_reviews`).

---

### 6.3 Step 03 — Audience Script Creation & Versioning

#### `POST /api/v1/contents/:id/scripts`
- **Authentication:** Authenticated Session
- **Capability:** `SCRIPT:CREATE`
- **Resource / Action:** `SCRIPT:CREATE`
- **Request Parameters:** `id: string` (Content ID `BP-CNT-######`)
- **Request Body:**
  ```json
  {
    "expectedVersion": 1,
    "hookCopyTelugu": "ఆంధ్రప్రదేశ్ విభజన చట్టంలో ఈ సెక్షన్ మీకు తెలుసా?",
    "bodyCopyTelugu": "విభజన చట్టం 2014 ప్రకారం ఆర్థిక వనరుల కేటాయింపు సెక్షన్ 46 కింద నిర్వహించబడింది...",
    "callToActionTelugu": "మరిన్ని గ్రూప్ 2 ప్రిపరేషన్ ప్రశ్నల కోసం బుర్ర పరీక్షను ఫాలో అవ్వండి.",
    "targetPacingWpm": 125,
    "estimatedDurationSeconds": 58
  }
  ```
- **Validation Rules:**
  - `hookCopyTelugu`: min 5, max 300 chars.
  - `bodyCopyTelugu`: min 10, max 2000 chars.
  - `callToActionTelugu`: min 5, max 300 chars.
  - `estimatedDurationSeconds`: integer between 20 and 75.
- **Response Schema:** `ApiSuccessResponse<ScriptDocument>` (HTTP 201 Created).
- **Workflow Impact:** Sets `scripts.lifecycleState = APPROVED` and advances `WorkflowInstance.currentStep` to 4 (`Teleprompter & Filming`).
- **Audit Event:** Emits `SCRIPT_CREATED`.

---

### 6.4 Step 04 — Teleprompter & Filming Session Setup

#### `POST /api/v1/videos`
- **Authentication:** Authenticated Session
- **Capability:** `VIDEO:CREATE`
- **Resource / Action:** `VIDEO:CREATE`
- **Request Body:**
  ```json
  {
    "contentId": "BP-CNT-000142",
    "scriptId": "BP-S-000142",
    "presenterUserId": "USR-000008",
    "studioLocation": "Studio Bay 1 (Main Stage)",
    "cameraSetupNotes": "Vertical 9:16 rig, 85mm prime lens, teleprompter speed 125 WPM."
  }
  ```
- **Validation Rules:** Valid canonical ID patterns; `presenterUserId` must exist and hold `ROLE_PRESENTER`.
- **Response Schema:** `ApiSuccessResponse<VideoDocument>` (HTTP 201 Created).
- **Workflow Impact:** Initializes `Video` record in `SCHEDULED` state; advances workflow to Step 5 (`Raw Video`).

---

### 6.5 Step 05 — Raw Video Take Ingestion

#### `POST /api/v1/videos/:id/takes`
- **Authentication:** Authenticated Session
- **Capability:** `VIDEO_TAKE:UPLOAD`
- **Resource / Action:** `VIDEO_TAKE:UPLOAD`
- **Request Parameters:** `id: string` (Video ID `BP-V-######`)
- **Request Body:**
  ```json
  {
    "takeNumber": 1,
    "durationSeconds": 59.4,
    "mediaAssetId": "MED-000892",
    "driveFileId": "1BxiMVs0XRA5nFMdKvBHK...",
    "cameraAngle": "PRIMARY_FRONT",
    "isPreferredTake": true,
    "takeNotes": "Clean delivery, strong hook pacing."
  }
  ```
- **Validation Rules:** `mediaAssetId` must be registered in `media_assets` with verified SHA-256 hash.
- **Workflow Impact:** Records `VideoTake`. When preferred take is confirmed, advances workflow to Step 6 (`Editing Bay`).

---

### 6.6 Step 06 — Editing Bay Cut / Master MP4 Submission

#### `POST /api/v1/videos/:id/edits`
- **Authentication:** Authenticated Session
- **Capability:** `VIDEO_EDIT:CREATE`
- **Resource / Action:** `VIDEO_EDIT:CREATE`
- **Request Parameters:** `id: string` (Video ID `BP-V-######`)
- **Request Body:**
  ```json
  {
    "cutNumber": 1,
    "mediaAssetId": "MED-000915",
    "driveFileId": "1BxiMVs0XRA5nFMdKvBHK999...",
    "resolutionWidth": 1080,
    "resolutionHeight": 1920,
    "durationSeconds": 58.2,
    "hasBurraParikshaWatermark": true,
    "hasTeluguSubtitlesBurned": true,
    "hasAudioNormalisation": true,
    "editNotes": "Master MP4 cut. Audio normalized to -14.0 LUFS. Burned yellow Telugu subtitles."
  }
  ```
- **Validation Rules:** Resolution must be strictly $1080 \times 1920$ (vertical 9:16); duration between 15 and 70 seconds.
- **Workflow Impact:** Sets `video_edits.qcStatus = QC_PENDING`; advances workflow to Step 7 (`Final QC`).

---

### 6.7 Step 07 — Final Video QC Audit Sign-off (Human-Gated, Anti-Self-Approval)

#### `POST /api/v1/video-edits/:id/qc`
- **Authentication:** Authenticated Session
- **Capability:** `VIDEO_EDIT:APPROVE`
- **Resource / Action:** `VIDEO_EDIT:APPROVE`
- **Request Parameters:** `id: string` (Video Edit ID)
- **Request Body:**
  ```json
  {
    "expectedVersion": 1,
    "audioLoudnessCompliant": true,
    "audioClippingAbsent": true,
    "syncTimingAccurate": true,
    "visualArtifactsAbsent": true,
    "subtitleTimingAligned": true,
    "brandingOverlayCompliant": true,
    "verdict": "APPROVED",
    "rejectionReason": null
  }
  ```
- **Business Rule (GAR-02 Anti-Self-Approval):** Server checks video editor identity. If `req.user.id === targetEdit.editorUserId`, request is rejected with `403 FORBIDDEN_BY_SEGREGATION_OF_DUTIES`.
- **Workflow Impact:** If `APPROVED`, advances workflow to Step 8 (`Thumbnail`); sets `video_edits.qcStatus = APPROVED_MASTER`. If rejected, returns workflow to Step 6 for re-cut.

---

### 6.8 Step 08 — Thumbnail Artwork Variant Registration

#### `POST /api/v1/contents/:id/thumbnails`
- **Authentication:** Authenticated Session
- **Capability:** `THUMBNAIL:CREATE`
- **Request Body:**
  ```json
  {
    "variant": "A",
    "mediaAssetId": "MED-000940",
    "driveFileId": "1BxiMVs0XRA5nFMdKvBHKthumb...",
    "width": 1080,
    "height": 1920,
    "teluguHeadline": "గ్రూప్ 2 బిట్ గ్యారెంటీ!",
    "designerUserId": "USR-000012"
  }
  ```
- **Workflow Impact:** Registers thumbnail variant; advances workflow to Step 9 (`Social Review`).

---

### 6.9 Step 09 — Social Review & 9:16 Mobile Framing Simulator Sign-off (Human-Gated)

#### `POST /api/v1/contents/:id/social-reviews`
- **Authentication:** Authenticated Session
- **Capability:** `SOCIAL_REVIEW:APPROVE`
- **Request Body:**
  ```json
  {
    "expectedVersion": 1,
    "youtubeShortsUiSafeZonePassed": true,
    "instagramReelsUiSafeZonePassed": true,
    "facebookReelsUiSafeZonePassed": true,
    "teluguTextLegibilityScore": 5,
    "hookVisibilityUnderHeaderPassed": true,
    "verdict": "APPROVED",
    "reviewNotes": "All three platform overlay safe zones verified clean. No subtitle clipping."
  }
  ```
- **Workflow Impact:** Advances workflow to Step 10 (`Publishing Setup`).

---

### 6.10 Step 10 — Publishing Package Staging & Release Assembly (Human-Gated)

#### `POST /api/v1/publishing-packages`
- **Authentication:** Authenticated Session
- **Capability:** `PUBLISHING_PACKAGE:CREATE`
- **Request Body:**
  ```json
  {
    "contentId": "BP-CNT-000142",
    "selectedVideoEditId": "BP-VE-000142-C01",
    "selectedThumbnailId": "BP-TH-000142",
    "platforms": ["YOUTUBE_SHORTS", "INSTAGRAM_REELS", "FACEBOOK_REELS"],
    "scheduledPublishTime": "2026-10-04T18:00:00.000Z",
    "titleTelugu": "AP విభజన చట్టం 2014 - ముఖ్యమైన సెక్షన్లు | APPSC Group 2",
    "descriptionTelugu": "ఆంధ్రప్రదేశ్ విభజన చట్టం 2014 లోని కీలకమైన సెక్షన్ 46 వివరణ...",
    "tags": ["APPSC", "Group2", "APHistory", "BurraPariksha", "CompetitiveExams"]
  }
  ```
- **Workflow Impact:** Creates `PublishingPackage` in `STAGED` state; advances workflow to Step 11 (`Published`).

---

### 6.11 Step 11 — Release / Distribution Dispatch

#### `POST /api/v1/publishing-packages/:id/publish`
- **Authentication:** Authenticated Session
- **Capability:** `PUBLICATION:PUBLISH`
- **Headers:** `Idempotency-Key: <UUID>`
- **Request Body:**
  ```json
  {
    "expectedVersion": 1,
    "publishImmediately": true,
    "confirmationToken": "CONFIRM-RELEASE-BP-CNT-000142"
  }
  ```
- **Business Rule:** Verifies confirmation token; creates `Publication` records for each target platform in `PENDING` state; triggers background publication dispatch queue.
- **Workflow Impact:** Advances workflow to Step 12 (`Platform Sync`).

---

### 6.12 Step 12 — Platform Sync & Publication Verification

#### `POST /api/v1/publications/:id/sync`
- **Authentication:** Service / Authenticated Worker
- **Capability:** `PUBLICATION:SYNC`
- **Request Body:**
  ```json
  {
    "platformPostId": "dQw4w9WgXcQ",
    "platformUrl": "https://youtube.com/shorts/dQw4w9WgXcQ",
    "syncStatus": "LIVE",
    "failureReason": null
  }
  ```
- **Business Rule:** Sets `publications.publicationState = CONFIRMED_LIVE`; records live streaming URL.
- **Workflow Impact:** Advances workflow to Step 13 (`Analytics`).

---

### 6.13 Step 13 — Analytics Snapshot Ingestion

#### `POST /api/v1/publications/:id/analytics-snapshots`
- **Authentication:** Worker / Authenticated Session
- **Capability:** `ANALYTICS_SNAPSHOT:CREATE`
- **Request Body:**
  ```json
  {
    "viewsCount": 14250,
    "watchTimeSeconds": 482000,
    "averageViewDurationSeconds": 33.8,
    "retentionAt3sPercent": 74.2,
    "completionRatePercent": 52.8,
    "likesCount": 890,
    "sharesCount": 142,
    "commentsCount": 68,
    "retentionCurvePoints": [100, 92, 85, 78, 74, 68, 62, 58, 54, 52],
    "snapshotTime": "2026-10-05T18:00:00.000Z"
  }
  ```
- **Business Rule:** Appends immutable `AnalyticsSnapshot` record.
- **Workflow Impact:** When 24h milestone snapshot arrives, advances workflow to Step 14 (`Performance Review`).

---

### 6.14 Step 14 — Content Performance Scorecard Audit Sign-off (Human-Gated)

#### `POST /api/v1/contents/:id/performance-reviews`
- **Authentication:** Authenticated Session
- **Capability:** `PERFORMANCE_RECORD:REVIEW`
- **Request Body:**
  ```json
  {
    "expectedVersion": 1,
    "pedagogicalResonanceScore": 88,
    "studentEngagementScore": 76,
    "conceptMasteryConfirmed": true,
    "verdict": "PROVEN_PEDAGOGY",
    "evaluatorNotes": "Retention curve remained flat through the explanation segment. Excellent concept clarity."
  }
  ```
- **Workflow Impact:** Records `PerformanceRecord`; advances workflow to Step 15 (`Intelligence Loop`).

---

### 6.15 Step 15 — AI Intelligence Loop Insights & Curriculum Recommendations (Human-Gated)

#### `POST /api/v1/contents/:id/intelligence-insights`
- **Authentication:** Authenticated Session
- **Capability:** `INTELLIGENCE_INSIGHT:APPROVE`
- **Request Body:**
  ```json
  {
    "curriculumTopic": "AP Reorganisation Act 2014 - Section 46",
    "identifiedLearningFrictionPoint": "Students confuse Section 46 (tax allocation) with Section 48 (apportionment of assets).",
    "recommendedFollowupQuestionType": "Comparative match-the-following on Sections 46, 47, and 48.",
    "recommendedDifficultyAdjustment": "MAINTAIN_DIFFICULTY",
    "approvedForNextCycle": true,
    "approvedByUserId": "USR-000004"
  }
  ```
- **Workflow Impact:** Creates `IntelligenceInsight` record; marks `WorkflowInstance.workflowStatus = COMPLETED`; closes the 15-step loop by feeding directives into Step 01 backlog.

---

## 7. Supporting Domain API Contracts

### 7.1 Workflow State Machine Transition (Authoritative Engine Boundary)

#### `POST /api/v1/workflow-instances/:id/transitions`
- **Authentication:** Authenticated Session
- **Capability:** `WORKFLOW_TRANSITION:TRANSITION`
- **Request Body:**
  ```json
  {
    "expectedCurrentStep": 6,
    "targetStep": 7,
    "reason": "Master cut completed and submitted for QC review.",
    "isReworkTransition": false,
    "transitionMetadata": { "videoEditId": "BP-VE-000142-C01" }
  }
  ```
- **Atomic Transaction Commit (Stage 12 Boundary 1):**
  1. Verifies `WorkflowInstance.currentStep === payload.expectedCurrentStep`.
  2. Verifies actor holds required capability for target step.
  3. Mutates `WorkflowInstance.currentStep = payload.targetStep`.
  4. Inserts immutable `workflow_transitions` record (`TRN-YYYYMMDD-####`).
  5. Inserts `audit_events` record.
  6. All 5 steps commit atomically in a single Firestore `runTransaction`.
- **Error Responses:** 409 Conflict if OCC fails or if target step transition is illegal per Stage 08 state machine.

---

### 7.2 Media Ingestion & Tamper Verification

#### `POST /api/v1/media-assets`
- **Capability:** `MEDIA_ASSET:CREATE`
- **Request Body:**
  ```json
  {
    "name": "take01_front.mp4",
    "mediaType": "VIDEO",
    "mimeType": "video/mp4",
    "sizeBytes": 145028000,
    "sha256Hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "driveFileId": "1BxiMVs0XRA5nFMdKvBHKtake1",
    "driveFolderId": "1FolderId01Takes",
    "folderHierarchyPath": "/BP-Production/BP-CNT-000142/01_raw_takes/",
    "webViewLink": "https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBHKtake1/view",
    "webContentLink": "https://drive.google.com/uc?id=1BxiMVs0XRA5nFMdKvBHKtake1"
  }
  ```
- **Business Rule:** Registers media metadata and SHA-256 fingerprint in Firestore.

#### `POST /api/v1/media-assets/:id/verify-hash`
- **Capability:** `MEDIA_ASSET:VERIFY`
- **Request Body:** `{ "currentSha256Hash": "e3b0c442..." }`
- **Business Rule:** Verifies current hash matches registered hash. If mismatch detected, marks `isQuarantined = true`.

#### `POST /api/v1/media-assets/:id/archive`
- **Capability:** `MEDIA_ASSET:ARCHIVE`
- **Request Body:**
  ```json
  {
    "archiveProvider": "GCS_COLDLINE",
    "bucketName": "bp-cms-cold-preservation",
    "objectPath": "archives/2026/BP-CNT-000142/MED-000892.mp4",
    "manifestId": "MAN-000142"
  }
  ```
- **Business Rule:** Initiates two-phase archival handshake per Stage 14 Section 12.

---

### 7.3 Identity, RBAC & Audit Ledger

#### `GET /api/v1/auth/session`
- **Capability:** `USER:VIEW`
- **Response Schema:** Returns authenticated user profile, assigned organizational roles, and active capabilities array.

#### `GET /api/v1/audit-events`
- **Capability:** `AUDIT_EVENT:VIEW`
- **Query Parameters:** `resourceType`, `resourceId`, `actorId`, `startDate`, `endDate`, `page`, `limit`.
- **Response Schema:** Paginated array of immutable `AuditEventDocument` records.

---

## 8. Brownfield API Inventory & Modernization Mapping

Inspection of `src/server/routes.ts` reveals over 270 endpoints. The inventory maps existing endpoints to their canonical target disposition:

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              BROWNFIELD ROUTE INVENTORY                                │
├───────────────────────────────┬─────────────┬──────────────────────────────────────────┤
│ Existing Route Group          │ Disposition │ Modernization Transition Strategy        │
├───────────────────────────────┼─────────────┼──────────────────────────────────────────┤
│ `/api/auth/login`, `logout`   │ MODIFY      │ Retain session cookie mechanics; wrap    │
│                               │             │ payload in `ApiSuccessResponse`.         │
├───────────────────────────────┼─────────────┼──────────────────────────────────────────┤
│ `/api/content-masters/*`      │ REPLACE     │ Replace with `/api/v1/contents/*` and    │
│                               │             │ `/api/v1/workflow-instances/*`.          │
├───────────────────────────────┼─────────────┼──────────────────────────────────────────┤
│ `/api/questions/draft`        │ MERGE       │ Merge into canonical `POST /questions`   │
│ `/api/questions/smart-random` │             │ and `POST /questions/ai-suggest`.        │
├───────────────────────────────┼─────────────┼──────────────────────────────────────────┤
│ `/api/questions/config`       │ REPLACE     │ Replace with `/api/v1/configurations`.   │
├───────────────────────────────┼─────────────┼──────────────────────────────────────────┤
│ `/api/social-enhancement/*`   │ MODIFY      │ Standardize under `/api/v1/ai/*` with    │
│                               │             │ explicit human-gated checkpoints.        │
├───────────────────────────────┼─────────────┼──────────────────────────────────────────┤
│ In-memory locking routes      │ DEPRECATE   │ Eradicate in-process locks; rely on OCC. │
├───────────────────────────────┼─────────────┼──────────────────────────────────────────┤
│ Ad-hoc status PATCH routes    │ REMOVE      │ Eliminate universal status patches;      │
│                               │             │ route all moves via Workflow Engine.     │
└───────────────────────────────┴─────────────┴──────────────────────────────────────────┘
```

---

## 9. Legacy / Compatibility Shim Architecture

To ensure zero downtime during frontend modernization:
1. **Canonical Prefix (`/api/v1/*`):** Houses the new, strongly-typed REST contract.
2. **Compatibility Shim (`/api/*`):** Existing frontend calls to `/api/content-masters` or `/api/questions` are internally routed through a compatibility adapter that unwraps legacy payloads, executes canonical `/api/v1` operations, and transforms output back into legacy JSON structures.
3. **Retirement Milestone:** The compatibility shim is retired strictly in **Stage 30 (Final System Audit)** after all frontend views are verified against `/api/v1`.

---

## 10. API Source-of-Truth Matrix

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              API SOURCE-OF-TRUTH MATRIX                                │
├──────────────────────┬───────────────────────────────┬─────────────────────────────────┤
│ API Domain / Concern │ Governing SDLC Stage          │ Authority Description           │
├──────────────────────┼───────────────────────────────┼─────────────────────────────────┤
│ Endpoint Syntax & Env│ Stage 15 (API Architecture)   │ Universal response & envelopes  │
│ Workflow Transitions │ Stage 07 & 08 (Workflow/State)│ Valid stage moves & atomicity   │
│ RBAC & Capabilities  │ Stage 09 (RBAC Model)         │ Permission strings & GAR-02     │
│ Entity & Field Schema│ Stage 13 (Data Contract)      │ Zod schemas, field names, types │
│ Media & Hashing      │ Stage 14 (Media Architecture) │ Abstract refs & SHA-256 digests │
│ Realtime Push        │ Stage 16 (Realtime Arch)      │ SSE / WebSocket event push      │
│ Background Workers   │ Stage 17 (Job / Async)        │ Distributed job queue execution │
│ AI Prompt Ingestion  │ Stage 18 (AI Architecture)    │ Gemini assistive prompts & gates│
│ Security & Tokens    │ Stage 19 (Security Arch)      │ Session cookie & CSRF validation│
│ Analytics Telemetry  │ Stage 20 (Analytics Arch)     │ Social metrics normalization    │
│ Forensic Logging     │ Stage 21 (Audit/Observability)│ Tamper-evident AuditEvent specs │
└──────────────────────┴───────────────────────────────┴─────────────────────────────────┘
```

---

## 11. Traceability Matrix

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              STAGE 15 TRACEABILITY MATRIX                              │
├────────────────────────────┬─────────────────────────────┬─────────────────────────────┤
│ Requirement / Principle    │ Canonical API Endpoint      │ Implementation Target       │
├────────────────────────────┼─────────────────────────────┼─────────────────────────────┤
│ AP-002 (Server Authorit.)  │ `POST /workflow-instances/..` Stage 27 (Engine Router)    │
│ AP-005 (OCC Versioning)    │ All `PUT`, `PATCH`, `POST`  │ Stage 27 (OCC Middleware)   │
│ AP-007 (Binary Isolation)  │ `POST /media-assets`        │ Stage 17, 27 (Media Router) │
│ AP-009 (AI-Gating Boundary)│ `POST /questions/:id/reviews` Stage 27 (Gate Middleware)  │
│ GAR-02 (Anti-Self-Approval)│ `POST /video-edits/:id/qc`  │ Stage 27 (SOD Validator)    │
│ 15-Step Workflow           │ Steps 01 through 15 Suite   │ Stage 27 (Workflow Handlers)│
│ Brownfield Compatibility   │ Legacy `/api/*` Shim Router │ Stage 27 (Compatibility)    │
└────────────────────────────┴─────────────────────────────┴─────────────────────────────┘
```

---

## 12. Unresolved Decisions & Conflict Register

### 12.1 API Architecture Decisions (AAD)
- **AAD-001 (Universal Response Envelope):** All `/api/v1` routes return `{ success: true, data: T, meta: ApiSuccessMeta }`. Raw un-enveloped JSON is forbidden.
- **AAD-002 (Explicit Workflow Gating):** Workflow state can only advance via `POST /workflow-instances/:id/transitions` or dedicated review decision endpoints. Generic `PATCH` requests on status fields are rejected.
- **AAD-003 (Cookie + Bearer Dual Auth):** API accepts session tokens via either `bp_session` HTTP-only cookie (web browser) or `Authorization: Bearer <token>` (background workers).

### 12.2 API Architecture Conflicts (AACR)
- **AACR-001 (Monolithic Routes vs. Modular Routers):** `src/server/routes.ts` is 6,562 lines long. Resolved: Stage 15 specifies modular domain routers (`/questions`, `/videos`, `/workflows`); physical code modularization executes in Stage 27.
- **AACR-002 (In-Memory Locks vs. OCC):** Brownfield used in-memory Promise locks. Resolved: Stage 15 mandates OCC versioning via `expectedVersion`.
- **AACR-003 (Coarse Roles vs. Fine-Grained Capabilities):** Brownfield used `requireRole([ADMIN])`. Resolved: Stage 15 mandates `requireCapability('RESOURCE:ACTION')`.

---

## 13. Downstream Implementation Contract

Downstream stages must implement the contracts defined herein:
- **Stage 16 (Realtime Architecture):** Define Server-Sent Events (SSE) or WebSocket push notifications for workflow updates triggered by Step 02, 07, 09, 11, and 12 APIs.
- **Stage 17 (Job / Async Architecture):** Implement asynchronous workers for Step 11 distribution dispatch, Step 12 platform sync, and Step 13 analytics ingestion.
- **Stage 18 (AI Architecture):** Implement Gemini assistive generation endpoints backing Step 01 drafting and Step 15 pedagogical intelligence.
- **Stage 19 (Security Architecture):** Harden CSRF protection, rate limiting, and session invalidation.
- **Stage 27 (Implementation):** Implement Express route controllers, Zod validation middleware, and Firestore transactional handlers matching Section 6 and 7.
- **Stage 28 (Integration & Testing):** Execute automated E2E integration test suites verifying all 15 workflow endpoints and anti-self-approval rules.

---

## 14. Architectural Invariants

The API Architecture enforces **15 non-negotiable invariants**:
1. **Server-Authoritative Governance (AP-002):** The backend is the sole authority for business state; frontend validation is for UX convenience only.
2. **Standardized Response Envelope:** All canonical API responses implement `ApiSuccessResponse<T>` or `ApiErrorResponse`.
3. **No Unauthenticated State Mutation:** Every mutating API requires an authenticated session and verified capability token.
4. **GAR-02 Anti-Self-Approval Enforcement:** Academic and QC review endpoints reject mutations if the reviewer is the asset author.
5. **AP-009 AI Gating Boundary:** AI workers cannot execute approval decisions on human-gated steps (02, 07, 09, 10, 14, 15).
6. **Optimistic Concurrency Control:** All update mutations verify `expectedVersion` to prevent silent overwrite collisions.
7. **Atomic Multi-Document Commits:** Stage transitions commit the stage advance, transition log, and audit event in a single atomic transaction.
8. **No Direct Binary Payloads:** Media binaries stream via dedicated multipart handlers; business entity JSON never contains binary blobs.
9. **Provider-Independent References:** APIs return abstract `MediaReference` locators, not vendor-locked URLs.
10. **Immutable Event Ledgers:** Historical transition and audit endpoints are append-only; update/delete operations throw hard 405 Method Not Allowed errors.
11. **Idempotency on Distribution APIs:** Broadcast dispatch and sync APIs enforce unique idempotency keys.
12. **Untrusted Client Identity:** Actor identity is derived strictly from verified session tokens, never from request body parameters.
13. **Strict Zero-Cost Infrastructure Invariant:** API architecture introduces zero fee-bearing external services, operating 100% within free tiers.
14. **Deterministic Error Codes:** Error responses supply categorized `ApiErrorCode` tokens for programmatic client handling.
15. **Preservation of Brownfield Compatibility:** Legacy `/api/*` endpoints remain supported via compatibility shims during modernization.

---

## 15. Completion Checklist & Sign-off

- [x] Defined universal API response and error envelopes (`ApiSuccessResponse`, `ApiErrorResponse`).
- [x] Standardized error codes dictionary and HTTP status mappings (401, 403, 404, 409, 422, 500).
- [x] Specified request context and zero-trust actor derivation contract.
- [x] Defined Optimistic Concurrency Control (OCC) and idempotency contracts.
- [x] Documented complete canonical endpoint suites for all 15 workflow steps.
- [x] Codified GAR-02 anti-self-approval and AP-009 AI-gating validation rules.
- [x] Defined supporting domain APIs for Workflow Transitions, Media Ingestion, and Audit Logs.
- [x] Conducted comprehensive audit of brownfield routes in `src/server/routes.ts`.
- [x] Established legacy `/api/*` compatibility shim architecture.
- [x] Codified API Source-of-Truth and Traceability matrices.
- [x] Established Decision (AAD) and Conflict (AACR) registers.
- [x] Defined downstream implementation responsibilities for Stages 16 through 28.
- [x] Codified 15 mandatory architectural invariants.
- [x] **Zero production application source code modified.**
- [x] **Zero database schema or physical infrastructure created.**
- [x] **Zero runtime behavior changed.**

```
================================================================================
STAGE 15 — API ARCHITECTURE & CONTRACT
================================================================================
Artifact:            docs/architecture/15-API-CONTRACT.md
Version:             15.0.0-SDLC-RESTART
Status:              ACCEPTED — COMPLETE — CLOSED
SDLC Restart Stage:  Stage 15 of 30
Application Code:    UNCHANGED (Zero Source Modifications)
Database / Infra:    UNCHANGED (Zero Schema or Cloud Changes)
Stage Boundary:      HALTED AT STAGE 15. Awaiting Stage 16 Instruction.
================================================================================
```

---

## 16. Anti-Overclaim Statement

> **CONFIRMATION:**
> SDLC Stage 15 is an ARCHITECTURE / CONTRACT stage.
> 
> **API ARCHITECTURE CONTRACT COMPLETE.**
> **API RUNTIME IMPLEMENTATION NOT PERFORMED.**
> 
> No Express route handlers, controllers, or middlewares were modified or implemented. No database schemas were altered. No frontend components were changed. No deployment or infrastructure changes occurred. All physical route refactoring, Zod middleware wiring, and automated integration tests are deferred strictly to **Stage 27 (Implementation)** and **Stage 28 (Integration & Testing)**.
