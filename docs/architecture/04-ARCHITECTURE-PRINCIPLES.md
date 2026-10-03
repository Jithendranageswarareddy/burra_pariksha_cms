# Burra Pariksha Content Management System (BP-CMS)
# Stage 04 — Architecture Principles

**Document Stage:** Stage 04 — Architecture Principles  
**Document Status:** ACCEPTED & ESTABLISHED  
**Version:** 2.0.0 (Master Architecture Baseline)  
**Date:** 2026-10-03  
**Preceding Authoritative Baselines:**
- Stage 01: `docs/requirements/01-REQUIREMENTS-BASELINE.md` (Version 1.1.0)
- Stage 02: `docs/acceptance/02-BUSINESS-ACCEPTANCE-CRITERIA.md` (Version 1.1.0)
- Stage 03: `docs/baseline/03-CURRENT-SYSTEM-BASELINE.md` (Version 1.1.0)

---

## 1. Document Control & Purpose

### 1.1 Purpose
This document establishes the permanent, non-negotiable architectural principles, boundaries, data integrity rules, and governance policies for BP-CMS. It acts as the technical constitution for all downstream architecture specifications (Stages 05–26), implementation cycles (Stage 27), and release gates (Stages 28–30).

### 1.2 Non-Negotiable Governance Declarations
1. **Constitutional Invariant:** These principles govern all future engineering design and code modifications across BP-CMS.
2. **Implementation Scope Boundary:** This document defines architectural invariants and structural rules. It does **NOT** implement features or modify database schemas.
3. **No Unapproved Fallbacks or Mocks:** Synthetic business-content fallback generators, test-bypass backdoors, and production mock engines are permanently barred from the system.
4. **Strict Traceability:** Every principle directly enforces one or more Stage 01 Requirements (`BR-*`, `NFR-*`, `BND-*`, `OPS-*`) and Stage 02 Acceptance Criteria (`AC2-*`, `NEG-*`).

---

## 2. The 30 Operational Architecture Principles

### 04.01 Single Source of Truth
- **Principle ID:** `AP-04.01`
- **Name:** Single Source of Truth (SSOT)
- **Rule:** Every domain entity, workflow state, and configuration parameter MUST have exactly one authoritative storage owner at runtime. Redundant state stores or dual-writing without a single authoritative coordinator are strictly prohibited.
- **Why it exists:** Prevents split-brain state, contradictory workflow statuses, and race conditions between storage layers.
- **Applies to:** All domain services, repositories, workflow controllers, and storage adapters.
- **MUST:** Designate one primary store for every entity type and route all mutations through its authoritative repository.
- **MUST NOT:** Maintain dual, unsynchronized copies of primary business records across independent databases or sheets without master-replica coordination.
- **Verification Method:** Automated multi-repository write audit; inspection of state mutation pipelines.
- **Related Stage 01 Requirement(s):** `BR-001`, `BR-006`, `NFR-001`, `BND-001`
- **Related Stage 02 Acceptance Criteria:** `AC2-001`, `NEG-05`, `NEG-10`
- **Dependencies on Later Stages:** Stage 06 (Domain Model), Stage 12 (Database Decision), Stage 13 (Data Contract).

---

### 04.02 Separation of Concerns
- **Principle ID:** `AP-04.02`
- **Name:** Separation of Concerns (SoC)
- **Rule:** Software layers MUST strictly separate presentation (UI), transport/routing (HTTP/API), business logic (Domain/Services), state coordination (Workflow Engine), and persistence (Repositories/Adapters).
- **Why it exists:** Prevents monolithic spaghetti code where UI components execute database queries, or persistence adapters execute business rules.
- **Applies to:** Frontend components, Express routes, Domain Services, Repositories.
- **MUST:** Keep UI components purely presentational, service classes pure business logic, and repositories pure data access.
- **MUST NOT:** Embed SQL queries, sheet mutations, or workflow transitions inside React components or API route handlers.
- **Verification Method:** Static code analysis, dependency linting, architectural module boundary tests.
- **Related Stage 01 Requirement(s):** `NFR-005`
- **Related Stage 02 Acceptance Criteria:** `AC2-024`
- **Dependencies on Later Stages:** Stage 05 (System Boundary), Stage 10 (Frontend IA), Stage 15 (API Contract).

---

### 04.03 Frontend/Backend Boundary
- **Principle ID:** `AP-04.03`
- **Name:** Frontend/Backend Boundary
- **Rule:** The frontend is an untrusted presentation tier. All security, workflow authorization, business rule enforcement, and data validation MUST occur server-side behind explicit API boundaries.
- **Why it exists:** Client-side checks can be bypassed via direct HTTP calls, browser developer tools, or automated scripts.
- **Applies to:** React Single Page Application (SPA), Express API server, REST endpoints.
- **MUST:** Validate every request on the server regardless of frontend form validation.
- **MUST NOT:** Trust client-computed permissions, client-assigned roles, or client-asserted state transitions.
- **Verification Method:** Direct API penetration testing bypassing frontend forms with invalid payloads.
- **Related Stage 01 Requirement(s):** `NFR-003`, `BND-001`
- **Related Stage 02 Acceptance Criteria:** `AC2-006`, `NEG-01`, `NEG-08`
- **Dependencies on Later Stages:** Stage 05 (System Boundary), Stage 09 (RBAC), Stage 15 (API Contract).

---

### 04.04 API-First Communication
- **Principle ID:** `AP-04.04`
- **Name:** API-First Communication
- **Rule:** All interactions between the frontend, backend, background workers, and external systems MUST occur over strictly defined, versioned, and schema-validated API contracts (JSON REST / RPC).
- **Why it exists:** Decouples client rendering from server architecture and enables independent verification and testing.
- **Applies to:** All HTTP routes, controllers, API client SDKs.
- **MUST:** Define explicit request/response schemas (e.g., Zod / OpenAPI) for every endpoint.
- **MUST NOT:** Expose internal repository structures, raw database rows, or unvalidated payload buffers directly over HTTP.
- **Verification Method:** Schema validation middleware automated tests; OpenAPI schema compliance checks.
- **Related Stage 01 Requirement(s):** `NFR-005`, `OPS-003`
- **Related Stage 02 Acceptance Criteria:** `AC2-024`
- **Dependencies on Later Stages:** Stage 15 (API Contract), Stage 26 (Feature Contracts).

---

### 04.05 Domain Ownership
- **Principle ID:** `AP-04.05`
- **Name:** Domain Ownership & Bounded Contexts
- **Rule:** Each business domain (Curriculum/Questions, Scripts, Video Production, Quality Control, Publishing, Analytics, Identity) MUST encapsulate its own entities, rules, and repository operations within bounded contexts.
- **Why it exists:** Prevents cross-domain coupling where a change in Video Production breaks Question taxonomy or Publishing logic.
- **Applies to:** Domain models, repository packages, service modules.
- **MUST:** Access external domain entities exclusively through public service interfaces or domain events.
- **MUST NOT:** Allow cross-domain repository mutations (e.g., Script Service writing directly to Question tables).
- **Verification Method:** Modular dependency boundary analysis and import restriction lint rules.
- **Related Stage 01 Requirement(s):** `BR-001` through `BR-010`, `NFR-005`
- **Related Stage 02 Acceptance Criteria:** `AC2-001` through `AC2-020`
- **Dependencies on Later Stages:** Stage 06 (Domain Model), Stage 13 (Data Contract).

---

### 04.06 Workflow Authority
- **Principle ID:** `AP-04.06`
- **Name:** Authoritative Canonical Workflow Engine
- **Rule:** All state transitions along the canonical 15-step digital assembly line MUST be evaluated and executed solely by the server-side Workflow Engine.
- **Why it exists:** Prevents illegal stage skipping, unverified releases, and uncontrolled workflow divergence.
- **Applies to:** `ContentMaster`, `Question`, `Script`, `Video`, `PublishPackage`.
- **MUST:** Enforce sequential step gates, prerequisites, and role capabilities before advancing or reworking content.
- **MUST NOT:** Allow frontend code or individual CRUD endpoints to mutate workflow step fields directly.
- **Verification Method:** Automated state-machine transition matrix tests; negative jump attempts (`NEG-02`).
- **Related Stage 01 Requirement(s):** Section 5 (Canonical 15-Step Workflow), `NFR-001`
- **Related Stage 02 Acceptance Criteria:** `AC2-001`, `AC2-002`, `NEG-02`
- **Dependencies on Later Stages:** Stage 07 (Canonical 15-Step Workflow), Stage 08 (State Model).

---

### 04.07 Server-Side Business Rules
- **Principle ID:** `AP-04.07`
- **Name:** Server-Side Business Rules Enforcement
- **Rule:** Core business invariants (e.g., exactly 4 distinct options per MCQ, -14 LUFS audio compliance check, valid mathematical proof requirement) MUST be executed in server-side domain services.
- **Why it exists:** Guarantees educational accuracy and broadcast compliance regardless of client platform or tool used.
- **Applies to:** Question Validator, Script Validator, QC Service, Publishing Validator.
- **MUST:** Execute domain validators before persisting state transitions or issuing approvals.
- **MUST NOT:** Rely on frontend UI flags (e.g., `isValid: true`) transmitted in HTTP request bodies.
- **Verification Method:** Unit and integration tests executing domain validators against valid and corrupted payloads.
- **Related Stage 01 Requirement(s):** `BR-001`, `BR-003`, `BR-005`, `NFR-001`
- **Related Stage 02 Acceptance Criteria:** `AC2-011`, `AC2-016`, `AC2-017`
- **Dependencies on Later Stages:** Stage 06 (Domain Model), Stage 26 (Feature Contracts).

---

### 04.08 Server-Side Authorization & RBAC
- **Principle ID:** `AP-04.08`
- **Name:** Server-Side Authorization & Anti-Self-Approval
- **Rule:** User authentication tokens, roles, and granular capabilities MUST be verified server-side on every request. Anti-self-approval rules (author cannot verify own question/script/video) MUST be strictly enforced by the server.
- **Why it exists:** Protects system integrity and enforces peer-review governance across all human quality gates.
- **Applies to:** Express authentication middleware, authorization guards, review endpoints.
- **MUST:** Reject unauthenticated requests with HTTP 401 and unauthorized actions with HTTP 403.
- **MUST NOT:** Permit UI role-switching without re-authenticating with server-verified credentials.
- **Verification Method:** Automated security tests attempting self-approval (`NEG-01`) and unauthorized role execution (`NEG-08`).
- **Related Stage 01 Requirement(s):** `NFR-003`, `BND-001`
- **Related Stage 02 Acceptance Criteria:** `AC2-006`, `NEG-01`, `NEG-08`
- **Dependencies on Later Stages:** Stage 09 (RBAC Capability Matrix), Stage 19 (Security Architecture).

---

### 04.09 Persistence Integrity
- **Principle ID:** `AP-04.09`
- **Name:** Persistence Integrity & Referential Consistency
- **Rule:** All relationships between entities (e.g., `ContentMaster` ↔ `Question` ↔ `Script` ↔ `Video` ↔ `QC Record`) MUST maintain strict referential integrity. Orphaned child records and dangling pointers are forbidden.
- **Why it exists:** Prevents data corruption where video files or published records lose their originating question proof or author identity.
- **Applies to:** Database repositories, schema migrations, sheet adapters.
- **MUST:** Verify foreign key / parent entity existence before creating or linking sub-records.
- **MUST NOT:** Hard-delete parent aggregate roots while active child production assets exist.
- **Verification Method:** Database consistency check scripts, integrity validation test suite.
- **Related Stage 01 Requirement(s):** `NFR-001`, `NFR-005`
- **Related Stage 02 Acceptance Criteria:** `AC2-008`, `AC2-009`
- **Dependencies on Later Stages:** Stage 12 (Database Decision), Stage 13 (Data Contract).

---

### 04.10 Auditability & Append-Only Ledger
- **Principle ID:** `AP-04.10`
- **Name:** Forensic Auditability & Immutability
- **Rule:** Every business mutation, workflow transition, review decision, and administrative override MUST emit an immutable audit log record containing entity ID, actor ID, action name, before/after values, and UTC timestamp.
- **Why it exists:** Provides complete forensic traceability for academic accuracy, compliance disputes, and operational accountability.
- **Applies to:** `AuditLogRepository`, all service mutation methods.
- **MUST:** Record audit entries atomically with or immediately following the business transaction.
- **MUST NOT:** Provide API endpoints or database operations that update, overwrite, or delete audit log entries.
- **Verification Method:** Automated mutation audit verification; attempt to modify audit table records (`NEG-10`).
- **Related Stage 01 Requirement(s):** `NFR-001`, `NFR-003`, Section 3.1 Item 17
- **Related Stage 02 Acceptance Criteria:** `AC2-005`, `NEG-10`
- **Dependencies on Later Stages:** Stage 21 (Audit & Observability).

---

### 04.11 Versioning & Immutability
- **Principle ID:** `AP-04.11`
- **Name:** Entity Versioning & Historical Immutability
- **Rule:** Questions, Scripts, QC Certifications, and Publishing Packages MUST increment version counters upon material revision. Historical approved versions MUST remain immutable and readable.
- **Why it exists:** Video editors and presenters must know precisely which script revision they recorded, and past broadcast records must reflect the exact verified text.
- **Applies to:** `ContentMaster`, `Question`, `Script`, `VideoMetadata`.
- **MUST:** Create a new revision/version record when content is modified post-approval.
- **MUST NOT:** Overwrite previously approved and recorded versions in-place.
- **Verification Method:** Version increment tests; historical version retrieval verification.
- **Related Stage 01 Requirement(s):** `BR-001`, `BR-002`, `NFR-001`
- **Related Stage 02 Acceptance Criteria:** `AC2-008`, `AC2-009`
- **Dependencies on Later Stages:** Stage 06 (Domain Model), Stage 13 (Data Contract).

---

### 04.12 Optimistic Concurrency Control
- **Principle ID:** `AP-04.12`
- **Name:** Optimistic Concurrency Control (OCC)
- **Rule:** Concurrent mutations on domain entities MUST validate the entity's version or updated timestamp against the client's expected version before applying updates.
- **Why it exists:** Prevents "lost update" anomalies when two editors or reviewers collaborate on the same item simultaneously.
- **Applies to:** Repositories, service update methods, REST PUT/PATCH controllers.
- **MUST:** Return HTTP 409 Conflict when a mutation is attempted on a stale entity version.
- **MUST NOT:** Silently overwrite unread remote modifications with stale local state.
- **Verification Method:** Concurrency collision test suite simulating simultaneous edits (`NEG-05`).
- **Related Stage 01 Requirement(s):** `NFR-001`, `NFR-005`
- **Related Stage 02 Acceptance Criteria:** `AC2-010`, `NEG-05`
- **Dependencies on Later Stages:** Stage 13 (Data Contract), Stage 15 (API Contract).

---

### 04.13 Idempotency
- **Principle ID:** `AP-04.13`
- **Name:** Idempotent Action Execution
- **Rule:** All mutating operations that initiate external dispatches, publishing releases, or state transitions MUST accept and enforce an idempotency key.
- **Why it exists:** Prevents duplicate video publishing, double billing, or repeated notifications caused by network retries or double-clicks.
- **Applies to:** Publishing service, job dispatchers, webhook handlers, sync triggers.
- **MUST:** Return identical successful results for repeated requests carrying the same idempotency key without re-executing side effects.
- **MUST NOT:** Fire multiple external API dispatch calls when identical requests are received concurrently.
- **Verification Method:** Automated idempotent retry tests against publishing endpoints (`NEG-04`).
- **Related Stage 01 Requirement(s):** `BR-006`, `BR-007`, `NFR-001`
- **Related Stage 02 Acceptance Criteria:** `AC2-007`, `NEG-04`
- **Dependencies on Later Stages:** Stage 15 (API Contract), Stage 17 (Job Architecture).

---

### 04.14 Strict Schema Validation
- **Principle ID:** `AP-04.14`
- **Name:** Boundary Schema Validation
- **Rule:** All input data entering the system from HTTP requests, AI service responses, external platform webhooks, or spreadsheet rows MUST be validated against strict type-safe schemas (e.g., Zod) before processing.
- **Why it exists:** Eliminates runtime crashes, injection vulnerabilities, and malformed entity records at the system boundary.
- **Applies to:** Route request body parsers, AI output parsers, external API client adapters.
- **MUST:** Reject malformed payloads immediately with descriptive validation errors before executing business logic.
- **MUST NOT:** Pass unchecked `any` or raw JSON objects into domain services or repositories.
- **Verification Method:** Schema validation fuzz testing and boundary error assertion suites.
- **Related Stage 01 Requirement(s):** `NFR-001`, `NFR-003`, `NFR-005`
- **Related Stage 02 Acceptance Criteria:** `AC2-024`
- **Dependencies on Later Stages:** Stage 13 (Data Contract), Stage 15 (API Contract), Stage 18 (AI Architecture).

---

### 04.15 Explicit Error Handling & Classification
- **Principle ID:** `AP-04.15`
- **Name:** Explicit Error Handling & Sanitization
- **Rule:** All errors MUST be explicitly caught, classified (e.g., `VALIDATION_ERROR`, `AUTH_ERROR`, `NOT_FOUND`, `CONFLICT`, `PROVIDER_ERROR`), and sanitized. Secrets and API keys MUST NEVER appear in error messages or client responses.
- **Why it exists:** Protects system security, prevents information leakage, and provides actionable feedback to operators.
- **Applies to:** Global Express error middleware, AI adapters, cloud storage adapters.
- **MUST:** Sanitize all outgoing error messages using regex redaction (`AIza...`, `sk-...`).
- **MUST NOT:** Return raw stack traces, database connection strings, or unredacted keys in API responses.
- **Verification Method:** Error response security scanning and redactor unit tests.
- **Related Stage 01 Requirement(s):** `NFR-003`, `NFR-005`
- **Related Stage 02 Acceptance Criteria:** `AC2-006`, `NEG-08`
- **Dependencies on Later Stages:** Stage 15 (API Contract), Stage 19 (Security Architecture).

---

### 04.16 AI as an Assistive Capability
- **Principle ID:** `AP-04.16`
- **Name:** AI as Assistive Intelligence (Zero Autonomous Authority)
- **Rule:** Generative AI is strictly an assistive drafting, translation, and analysis capability. AI models MUST NEVER autonomously transition workflow states, approve content, or bypass human review gates.
- **Why it exists:** Guarantees absolute pedagogical correctness and legal compliance by retaining human accountability.
- **Applies to:** Gemini Service, Question Studio, Script Assistant, Thumbnail Intelligence.
- **MUST:** Place AI outputs in unverified draft buffers requiring explicit human operator review and sign-off.
- **MUST NOT:** Permit AI service workers or automated prompts to mark questions as `VERIFIED` or videos as `QC_APPROVED`.
- **Verification Method:** Workflow gate inspection verifying that AI responses require human actor tokens to advance (`NEG-06`).
- **Related Stage 01 Requirement(s):** `BR-001`, `BR-010`, `NFR-001`
- **Related Stage 02 Acceptance Criteria:** `AC2-004`, `NEG-06`
- **Dependencies on Later Stages:** Stage 18 (AI Architecture).

---

### 04.17 Mandatory Human Approval Gates
- **Principle ID:** `AP-04.17`
- **Name:** Mandatory Human Approval Gates
- **Rule:** Content progression across the four critical quality checkpoints (Step 02 Question Verification, Step 07 Final QC, Step 09 Social Review, Step 10 Publishing Setup) REQUIRES explicit human sign-off with authenticated operator credentials.
- **Why it exists:** Prevents defective academic questions, flawed audio/video renders, and misconfigured social posts from reaching public broadcasts.
- **Applies to:** Steps 02, 07, 09, 10 workflow controllers and UI review desks.
- **MUST:** Require verified human operator action to sign QC certificates and publishing authorizations.
- **MUST NOT:** Implement automated timer-based "auto-approval" bypasses for quality gates.
- **Verification Method:** Automated workflow audit ensuring zero transitions occur through human gates without valid human signatures (`NEG-03`).
- **Related Stage 01 Requirement(s):** `BR-001` through `BR-006`, Section 5
- **Related Stage 02 Acceptance Criteria:** `AC2-002`, `AC2-003`, `NEG-01`, `NEG-03`
- **Dependencies on Later Stages:** Stage 07 (Canonical Workflow), Stage 09 (RBAC).

---

### 04.18 Separation of Media Binaries and Metadata
- **Principle ID:** `AP-04.18`
- **Name:** Media Binary & Metadata Storage Separation
- **Rule:** High-volume binary assets (camera footage, master MP4s, WAV audio, high-res PNGs) MUST be stored in dedicated object/file storage (Google Drive / Cloud Storage). Database and spreadsheet stores MUST ONLY contain media metadata, URIs, and cryptographic checksums.
- **Why it exists:** Prevents database bloat, payload memory exhaustion, and performance degradation.
- **Applies to:** Video ingestion, Thumbnail uploads, File repositories.
- **MUST:** Stream binary files directly to object storage and record metadata pointers (`URI`, `MIME`, `SHA-256`, `durationMs`) in application storage.
- **MUST NOT:** Store Base64-encoded video/audio files or raw byte arrays in database tables or Google Sheets cells.
- **Verification Method:** Database payload schema validation rejecting large binary data fields (`NEG-07`).
- **Related Stage 01 Requirement(s):** `BR-003`, `BR-004`, `NFR-001`, `NFR-002`, `BND-002`
- **Related Stage 02 Acceptance Criteria:** `AC2-015`, `NEG-07`
- **Dependencies on Later Stages:** Stage 14 (Media Architecture).

---

### 04.19 Storage Provider Responsibility & Decoupling
- **Principle ID:** `AP-04.19`
- **Name:** Storage Provider Responsibility & Interface Decoupling
- **Rule:** Persistence implementations (e.g., Google Sheets adapter, relational database adapter) MUST be hidden behind abstract Repository interfaces. Business services MUST remain completely agnostic of underlying storage mechanics.
- **Why it exists:** Allows seamless migration from Google Sheets to relational databases (e.g., PostgreSQL / Cloud SQL) without rewriting core domain services.
- **Applies to:** All Repository interfaces and concrete storage implementations.
- **MUST:** Interact with data stores strictly via Repository interfaces (`findById`, `save`, `update`, `findAll`).
- **MUST NOT:** Leak storage-specific query objects, sheet range strings, or driver connections into domain service layers.
- **Verification Method:** Repository interface mock tests; implementation swap verification.
- **Related Stage 01 Requirement(s):** `NFR-005`, `NFR-006`
- **Related Stage 02 Acceptance Criteria:** `AC2-024`
- **Dependencies on Later Stages:** Stage 12 (Database Decision), Stage 13 (Data Contract), Stage 23 (Migration Architecture).

---

### 04.20 Real-Time State Notification & Synchronization
- **Principle ID:** `AP-04.20`
- **Name:** Real-Time Team State Notification
- **Rule:** Asynchronous state changes (e.g., background render completion, QC review sign-off, live publishing execution) MUST notify active operator sessions through non-blocking event-driven communication (e.g., Server-Sent Events / WebSockets / polling fallbacks).
- **Why it exists:** Eliminates operator confusion, prevents duplicate working on the same project, and accelerates assembly-line throughput.
- **Applies to:** Workflow engine, UI notification hub, queue listeners.
- **MUST:** Emit event payloads containing entity ID, new workflow step, and actor upon state transition.
- **MUST NOT:** Cause client browser tabs to hang or lock up while waiting for long-running background tasks.
- **Verification Method:** Real-time event propagation tests; multi-client UI synchronization assertions.
- **Related Stage 01 Requirement(s):** `NFR-002`, `NFR-008`
- **Related Stage 02 Acceptance Criteria:** `AC2-021`
- **Dependencies on Later Stages:** Stage 16 (Realtime Architecture).

---

### 04.21 Observability, Telemetry & Structured Logging
- **Principle ID:** `AP-04.21`
- **Name:** Observability & Structured Health Telemetry
- **Rule:** The system MUST emit structured JSON logs with correlation IDs, latency metrics, and standardized health check endpoints (`/api/health`, `/api/ready`) across all runtime services.
- **Why it exists:** Enables rapid diagnosis of production incidents, bottleneck detection, and infrastructure monitoring.
- **Applies to:** Express server, background jobs, external API adapters.
- **MUST:** Include `timestamp`, `level`, `requestId`, `component`, and `message` in every structured log.
- **MUST NOT:** Log unformatted plain text strings or sensitive user credentials / API keys.
- **Verification Method:** Health check integration tests; log format parsing automated verification.
- **Related Stage 01 Requirement(s):** `NFR-001`, `NFR-009`, `OPS-003`
- **Related Stage 02 Acceptance Criteria:** `AC2-023`
- **Dependencies on Later Stages:** Stage 21 (Audit & Observability).

---

### 04.22 Centralized & Environment-Driven Configuration
- **Principle ID:** `AP-04.22`
- **Name:** Configuration Management & 12-Factor Compliance
- **Rule:** All operational configurations (port, storage bucket names, API URLs, model IDs) MUST be injected via environment variables (`.env`). Secrets MUST NEVER be committed to Git.
- **Why it exists:** Enforces 12-factor application design, prevents secret leakage, and simplifies environment staging.
- **Applies to:** Configuration loaders, deployment manifests, environment files.
- **MUST:** Provide `.env.example` documenting all configuration keys without default secret values.
- **MUST NOT:** Hardcode API keys, service account credentials, or environment-specific URLs in source code.
- **Verification Method:** Automated repository secret scan (git-secrets / gitleaks).
- **Related Stage 01 Requirement(s):** `NFR-003`, `OPS-001`
- **Related Stage 02 Acceptance Criteria:** `AC2-022`
- **Dependencies on Later Stages:** Stage 19 (Security Architecture), Stage 29 (Deployment & Release).

---

### 04.23 Defense-in-Depth Security
- **Principle ID:** `AP-04.23`
- **Name:** Defense-in-Depth & Least Privilege Security
- **Rule:** Security controls MUST operate in multiple overlapping layers (CORS restrictions, rate limiting, authentication middleware, capability checks, input sanitization, output encoding).
- **Why it exists:** Ensures that a failure in one defensive layer does not compromise the security of the entire platform.
- **Applies to:** Network gateways, Express middleware, authentication handlers, data access layers.
- **MUST:** Restrict API routes with rate limiters and strict CORS headers matching verified application origins.
- **MUST NOT:** Expose administrative endpoints or internal database tooling to public unauthenticated traffic.
- **Verification Method:** OWASP Top 10 automated security scan, penetration test suite.
- **Related Stage 01 Requirement(s):** `NFR-003`, `BND-001`
- **Related Stage 02 Acceptance Criteria:** `AC2-006`, `NEG-08`
- **Dependencies on Later Stages:** Stage 19 (Security Architecture).

---

### 04.24 High Performance & Low Latency
- **Principle ID:** `AP-04.24`
- **Name:** High Performance & Responsive Execution
- **Rule:** Interactive UI actions MUST respond in <200ms; standard API read endpoints MUST return in <500ms; long-running operations MUST be offloaded to background workers.
- **Why it exists:** Maintains high operator velocity across fast-paced studio teleprompter and editing bay workflows.
- **Applies to:** API controllers, database query builders, frontend state caches.
- **MUST:** Index frequently queried fields and cache static taxonomy structures.
- **MUST NOT:** Perform synchronous external API calls or large file operations within interactive UI request-response cycles.
- **Verification Method:** Automated load and latency benchmarking tests under simulated 50-user load.
- **Related Stage 01 Requirement(s):** `NFR-002`
- **Related Stage 02 Acceptance Criteria:** `AC2-025`
- **Dependencies on Later Stages:** Stage 15 (API Contract), Stage 17 (Job Architecture).

---

### 04.25 Horizontal Scalability & Statelessness
- **Principle ID:** `AP-04.25`
- **Name:** Stateless API & Scalability
- **Rule:** The API application tier MUST remain completely stateless. User session state and operational data MUST reside in external persistent stores.
- **Why it exists:** Enables container instances (e.g., Cloud Run) to scale horizontally from 0 to N without session stickiness or state loss.
- **Applies to:** Server entry point, session handling, background task managers.
- **MUST:** Store session tokens and transient locks in shared databases or token stores.
- **MUST NOT:** Rely on in-memory globals or local server disk storage for multi-instance request coordination.
- **Verification Method:** Multi-instance deployment simulation tests verifying session consistency across restarts.
- **Related Stage 01 Requirement(s):** `NFR-004`, `OPS-001`
- **Related Stage 02 Acceptance Criteria:** `AC2-024`
- **Dependencies on Later Stages:** Stage 12 (Database Decision), Stage 29 (Deployment & Release).

---

### 04.26 Modular Extensibility & Open/Closed Design
- **Principle ID:** `AP-04.26`
- **Name:** Modular Extensibility (Open for Extension, Closed for Modification)
- **Rule:** New social distribution platforms (e.g., LinkedIn Video), new AI providers, or new storage adapters MUST be addable via pluggable interface contracts without modifying existing core workflow code.
- **Why it exists:** Allows BP-CMS to adapt to emerging social video platforms and generative models without risking regression.
- **Applies to:** Provider registries, publishing connectors, analytics harvesters.
- **MUST:** Implement new connectors against established interfaces (e.g., `PublishingPlatformAdapter`, `AIProvider`).
- **MUST NOT:** Add hardcoded `if (platform === 'NEW_PLATFORM')` conditionals throughout core domain services.
- **Verification Method:** Unit tests registering and executing dynamic provider plugins.
- **Related Stage 01 Requirement(s):** `BR-006`, `BR-007`, `NFR-005`
- **Related Stage 02 Acceptance Criteria:** `AC2-013`, `AC2-018`
- **Dependencies on Later Stages:** Stage 05 (System Boundary), Stage 18 (AI Architecture).

---

### 04.27 Brownfield Modernization & Zero Operational Disruption
- **Principle ID:** `AP-04.27`
- **Name:** Brownfield Modernization & Data Preservation
- **Rule:** Modernization activities MUST preserve all historical production questions, published records, and media links created under prior iterations. Live production operations MUST NOT experience uncoordinated data loss.
- **Why it exists:** Protects years of valuable competitive exam intellectual property and active broadcast analytics.
- **Applies to:** Schema migrations, repository refactorings, storage transitions.
- **MUST:** Implement non-destructive migration scripts with rollback capability and data verification checkpoints.
- **MUST NOT:** Truncate production tables or wipe Google Sheets data during system upgrades.
- **Verification Method:** End-to-end data migration dry-run and parity verification test suite.
- **Related Stage 01 Requirement(s):** Section 1.1 Item 15, `NFR-001`, `OPS-002`
- **Related Stage 02 Acceptance Criteria:** `AC2-022`, `NEG-09`
- **Dependencies on Later Stages:** Stage 23 (Migration Architecture), Stage 30 (Production Baseline).

---

### 04.28 Legacy Isolation & Structured Refactoring
- **Principle ID:** `AP-04.28`
- **Name:** Legacy Code Classification & Quarantine
- **Rule:** Existing legacy components MUST be explicitly classified as `KEEP`, `MODIFY`, `MERGE`, `DEPRECATE`, `REMOVE`, or `CREATE`. Unused legacy code MUST be decommissioned systematically with verified dependency analysis.
- **Why it exists:** Eliminates dead code, stale mock engines, and confusing duplicates while preventing accidental breaking of hidden dependencies.
- **Applies to:** All legacy files in `src/`, legacy routes, old test artifacts.
- **MUST:** Document dependency impacts before removing or modifying legacy service methods.
- **MUST NOT:** Delete legacy endpoints without verifying that frontend routes and background jobs no longer reference them.
- **Verification Method:** Repository-wide dead code scans and route reference validation suites.
- **Related Stage 01 Requirement(s):** `NFR-005`
- **Related Stage 02 Acceptance Criteria:** `AC2-024`
- **Dependencies on Later Stages:** Stage 25 (Implementation Dependency Graph), Stage 27 (Implementation Cycle).

---

### 04.29 Realistic Test Architecture (Zero Production Mocks)
- **Principle ID:** `AP-04.29`
- **Name:** Realistic Testing & Production Mock Prohibition
- **Rule:** Automated test suites MUST execute against realistic integration boundaries. Mock data generators, fake in-memory stores, and authentication bypass backdoors MUST NEVER be compiled into production artifacts or active runtime services.
- **Why it exists:** Prevents deceptive test passes where mock engines mask real-world API breaks, database schema mismatches, or live permission failures.
- **Applies to:** Test suites, production service classes, build pipelines.
- **MUST:** Isolate test mocks strictly inside test files (`*.test.ts`, `tests/`) and execute production builds with zero test backdoors.
- **MUST NOT:** Include `if (isTest || isMock)` branching inside production domain services or repository classes.
- **Verification Method:** Production artifact string scan verifying zero occurrences of `MOCK_DEVELOPMENT`, `forceFallback`, or test bypasses.
- **Related Stage 01 Requirement(s):** `NFR-001`, `NFR-005`, `NFR-009`
- **Related Stage 02 Acceptance Criteria:** `AC2-024`
- **Dependencies on Later Stages:** Stage 24 (Test Architecture), Stage 28 (Verification & Human Testing).

---

### 04.30 Deployment Independence & Infrastructure Frugality
- **Principle ID:** `AP-04.30`
- **Name:** Deployment Independence & Cost Invariant (COST-001)
- **Rule:** The platform MUST support containerized deployment (e.g., Docker / Google Cloud Run) within strict frugality constraints (**Target: ₹0 – ₹100 initial infrastructure investment**).
- **Why it exists:** Maximizes operational runway and prevents unbudgeted cloud infrastructure expenses during channel growth.
- **Applies to:** `Dockerfile`, deployment scripts, cloud provisioning configs.
- **MUST:** Leverage free-tier cloud quotas, scale-to-zero container hosting, and existing Google Workspace resources.
- **MUST NOT:** Provision expensive dedicated managed clusters, commercial SaaS, or multi-zone paid databases without explicit Product Owner approval.
- **Verification Method:** Cloud infrastructure cost audit and deployment configuration budget verification (`NEG-09`).
- **Related Stage 01 Requirement(s):** `NFR-006`, `OPS-001`
- **Related Stage 02 Acceptance Criteria:** `AC2-022`, `NEG-09`
- **Dependencies on Later Stages:** Stage 22 (Cost Architecture), Stage 29 (Deployment & Release).

---

## 3. Architectural Boundaries Matrix

| Architectural Boundary | Owns | Reads | Writes | Validates | Authorizes | Must NOT Control |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FRONTEND** | View state, UI input state, teleprompter scroll, form ergonomics | API responses, cached reference data | Dispatches HTTP requests | Form presence & UI formatting | Nothing (Untrusted) | Database mutations, workflow authorization, server state transitions |
| **BACKEND / API** | HTTP Routing, transport parsing, request correlation, error formatting | Incoming HTTP headers & bodies | HTTP responses, structured error payloads | Request headers, schema conformance | Route access, session authentication | Business rule domain calculations, persistent storage mechanics |
| **DOMAIN / SERVICES** | Business entities, mathematical logic, pedagogical rules | Repositories, Domain models | Entities, verification results | MCQ options (4 distinct), proofs, pacing | Feature-specific business permissions | Direct database SQL/Sheets queries, raw HTTP transport formatting |
| **WORKFLOW ENGINE** | 15-Stage assembly line transitions, step pre-conditions | Aggregate statuses, QC certificates | State transition events, step updates | Step sequence, prerequisite completion | Workflow forward/rework progression | Presentation formatting, binary media streaming |
| **REPOSITORIES / DATA ACCESS** | Data mapping, query execution, OCC checks | Storage tables, Google Sheets | Storage records, version increments | Schema data types, foreign keys | Storage connection credentials | Workflow state transition rules, academic validation |
| **DATABASE / PERSISTENCE** | Physical table schemas, indexes, transaction journals | Stored rows, sheet cells | Committed rows, sheet cells | Storage constraints, uniqueness | Database engine permissions | UI presentation logic, AI model orchestration |
| **MEDIA STORAGE** | Binary files, video takes, master cuts, image thumbnails | Object blobs, files | Uploaded streams, deletion markers | File sizes, container MIME types | Storage bucket IAM permissions | Domain workflow state, publishing schedules |
| **AI SERVICES** | AI Prompt construction, model failover, output parsing | Unverified drafts, taxonomy context | Structured suggestions, draft buffers | AI response JSON schemas | Nothing (Assistive only) | Final verification approval, workflow advancement, live publishing |
| **AUDIT SYSTEM** | Immutable audit logs, change history ledgers | Mutation event streams | Append-only audit entries | Audit record structure, timestamps | Audit log query access | Business state mutation, entity deletion |
| **ANALYTICS ENGINE** | Retention metrics, view telemetry, drop-off curves | External platform metrics | Ingested metric snapshots | Metric ranges, timestamp validity | Analytics access permissions | Production content drafting, publishing dispatch |
| **EXTERNAL PLATFORM INTEGRATIONS**| External API client adapters, token refresh flows | Social platform status responses | Live publish requests, sync queries | Platform-specific parameters | Social platform API keys | Internal 15-stage workflow state transitions |

---

## 4. Source-of-Truth Policy

| Domain Entity / Data Category | Authoritative Source of Truth | Permitted Replicas / Caches | Conflict Resolution Strategy |
| :--- | :--- | :--- | :--- |
| **User Identity & Accounts** | Central Authentication Database / User Repository | Transient JWT claims in client memory | Server-authoritative token verification |
| **Roles & Granular Capabilities** | Central RBAC Permission Matrix | Client session store (UI rendering only) | Server capability guard re-evaluation on every request |
| **Taxonomy (Class, Topic, Subtopic)**| Central Taxonomy Repository | Frontend in-memory cache (TTL: 1 hour) | Server taxonomy version check upon entity save |
| **Questions (Text, Options, Proofs)**| Question Repository (`BP-Q-*`) | Unverified drafts in Question Studio UI | Optimistic Concurrency Control (Version increment) |
| **Content Masters (`BP-CNT-*`)** | Content Master Repository | Dashboard table cache (React Query) | Server-side OCC version validation (HTTP 409 on conflict) |
| **Workflow State (Steps 01–15)** | Workflow Engine State Table | UI Stage Indicators (Presentational) | Workflow Engine state machine is absolute authority |
| **Workflow History & State Logs** | Immutable Workflow History Ledger | None (Read-only historical view) | Append-only timestamped ledger |
| **Audience Scripts (`BP-SCR-*`)** | Script Repository | Teleprompter local buffer during filming | Script version binding to Content Master |
| **Studio Takes & Recording Logs** | Video Production Repository | Presenter local log before save | Primary take designated and locked by human presenter |
| **Media Binary Files** | Google Drive / Cloud Storage Bucket | None (Streaming URLs / Presigned URIs) | SHA-256 checksum recorded in Video Repository |
| **Video Metadata & Cuts (`BP-VID-*`)** | Video Metadata Repository | Editing desk preview cache | Media Storage locator validation |
| **QC Certification Records** | QC Repository (`BP-QC-*`) | UI certificate modal view | Cryptographically signed human QC officer signature |
| **Thumbnail Assets & Packaging** | Thumbnail Repository (`BP-THM-*`) | Social Review 9:16 simulator cache | Approved variant ID locked to Content Master |
| **Publishing Setup & Schedules** | Publishing Repository (`BP-PUB-*`) | Calendar schedule view | Server cron / release scheduler authority |
| **Platform Broadcast Records** | Platform Sync Repository | Social dashboard links | Verified live URL HTTP 200 response check |
| **Analytics & Retention Telemetry** | Analytics Telemetry Store | Trend chart cache | Standardized snapshot interval ingestion (24h, 7d, 30d) |
| **Forensic Audit Records** | Append-Only Audit Log Repository | None (Immutable read-only query view) | Append-only storage invariant; zero mutation permitted |
| **System Configuration** | Environment Variables & Config Store | Process environment memory | Server restart / config reload trigger |

---

## 5. AI Architecture Rules (Assistive Intelligence)

1. **AI is Exclusively Assistive:** AI services generate drafts, translations, distractor recommendations, and retention insights. AI has zero autonomous authority to approve, sign off, or advance workflow items.
2. **Mandatory Schema Validation:** Every AI completion MUST be validated against strict Zod schemas before being returned to services or presentation layers.
3. **Explicit Error States:** If the AI provider fails, times out, or returns invalid schemas, the system MUST return an explicit `AIProviderError` (`AUTH_ERROR`, `QUOTA_EXHAUSTED`, `INVALID_REQUEST`).
4. **Prohibition of Synthetic Business Fallbacks:** Under NO circumstances may the system manufacture synthetic replacement business content (fake questions, mock scripts, or canned comments) to disguise an AI provider failure.
5. **Human Review Buffer:** All AI-generated suggestions MUST be placed in unverified draft buffers where a human operator must review, edit, and approve the content before it enters the verified production pipeline.
6. **Provenance Tracking:** Every AI-assisted candidate record MUST retain provenance metadata detailing the model ID, prompt version, latency, and timestamp of generation.

---

## 6. Authoritative Workflow Governance

1. **Sequential Assembly Line:** Content progression strictly follows the canonical 15-stage sequence:
   - `01. Question Generation` ➔ `02. Question Verification` ➔ `03. Audience Script` ➔ `04. Teleprompter & Filming` ➔ `05. Raw Video` ➔ `06. Editing Bay` ➔ `07. Final QC` ➔ `08. Thumbnail` ➔ `09. Social Review` ➔ `10. Publishing Setup` ➔ `11. Published` ➔ `12. Platform Sync` ➔ `13. Analytics` ➔ `14. Performance Review` ➔ `15. Intelligence Loop`.
2. **Zero Stage Skipping (`NEG-02`):** Forward progress requires completing all intermediate quality gates and prerequisite data attachments. Jumping over stages is rejected server-side.
3. **Rework and Rejection Routing:** When content fails a review gate (e.g., Step 07 QC rejection), the Workflow Engine routes the entity back to the precise rework stage (e.g., Step 06 Editing Bay or Step 04 Filming) with mandatory human rejection remarks.
4. **Anti-Self-Approval Enforcement (`NEG-01`):** A human operator cannot approve their own authored content at review gates (e.g., Question Author cannot sign Step 02 Question Verification).
5. **Atomic State Mutations:** Workflow state transitions MUST update the entity step, write an audit log entry, and notify subscribers in a single coordinated transaction.

---

## 7. Data Integrity Invariants

1. **Deterministic Canonical Identifiers:** Every entity is assigned a permanent, human-readable, domain-prefixed identifier:
   - `BP-CNT-######` (Content Master)
   - `BP-Q-######` (Question)
   - `BP-SCR-######` (Script)
   - `BP-VID-######` (Video Metadata)
   - `BP-QC-######` (QC Certificate)
   - `BP-THM-######` (Thumbnail Package)
   - `BP-PUB-######` (Publishing Package)
   - `BP-AUD-######` (Audit Record)
2. **Optimistic Concurrency Control:** Updates to domain aggregates must supply the current entity version. Stale updates fail immediately with HTTP 409 Conflict.
3. **Idempotent Operations:** Mutating actions supporting retries must supply an `idempotencyKey` to guarantee that exactly one execution takes place.
4. **Cryptographic Checksums:** Media files registered in Step 05 (Raw Video) and Step 06 (Master MP4) must record SHA-256 checksums to detect file corruption or tampering.
5. **No Loss of Historical Data:** Reworking or updating content increments version counters; historical approved records remain immutable.

---

## 8. Legacy / Brownfield Modernization Rules

Existing legacy codebase modules MUST be categorized under one of the six standard modernization classifications:

1. **`KEEP`:** High-quality, compliant production code retained without modification.
2. **`MODIFY`:** Production code updated to align with schema validation, error classification, or OCC rules.
3. **`MERGE`:** Redundant or fragmented implementations consolidated into a single authoritative service.
4. **`DEPRECATE`:** Legacy paths flagged for retirement, maintained with warnings until callers migrate.
5. **`REMOVE`:** Dead code, obsolete mock utilities, and duplicate files removed after dependency analysis.
6. **`CREATE`:** New architectural modules implemented to fulfill missing Stage 01/02 requirements.

---

## 9. Test Architecture Principles

1. **Realistic Test Execution:** Automated tests must verify real production paths without injecting fake workflows or mock data into production service classes.
2. **Strict Test Pyramid:**
   - **Unit Tests:** Fast, isolated validation of algorithms, mathematical proofs, pacing calculations, and schema parsers.
   - **Integration Tests:** Verification of repository operations, database transactions, and service coordination.
   - **API Contract Tests:** Validation of endpoint request/response contracts, HTTP status codes, and error sanitization.
   - **Workflow Acceptance Tests:** Full execution of 15-step state machine flows and negative gates (`NEG-01` to `NEG-10`).
   - **Security & Concurrency Tests:** Penetration tests verifying RBAC enforcement, OCC collision handling, and secret redaction.
3. **No Production Test Bypasses:** Production builds must contain zero test-only bypass headers, mock flags, or simulated authorization overrides.

---

## 10. Deployment Principles

1. **Containerized Stateless Packaging:** The backend API and frontend assets compile into standardized, lightweight container images (e.g., Docker).
2. **Cloud Run / Scalable Container Hosting:** Deployed to zero-scale container infrastructure (Google Cloud Run) to maintain 99.9% availability while honoring the **₹0–₹100 cost invariant (COST-001)**.
3. **Environment Parity:** Staging and production environments use identical container images, differentiated purely through environment variables.
4. **Non-Destructive Migrations:** Database and schema updates execute via versioned, backward-compatible migration scripts.
5. **Zero-Downtime Rollbacks:** Deployment pipelines must support instant rollbacks to previous stable container revisions in the event of health check failures.

---

## 11. Traceability Matrix

| Principle ID | Principle Name | Stage 01 Req | Stage 02 AC / Negative Gate | Future SDLC Stage | Verification Method |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **AP-04.01** | Single Source of Truth | `BR-001`, `NFR-001`, `BND-001` | `AC2-001`, `NEG-05` | Stages 06, 12, 13 | Multi-store write audit |
| **AP-04.02** | Separation of Concerns | `NFR-005` | `AC2-024` | Stages 05, 10, 15 | Static code boundary linting |
| **AP-04.03** | Frontend/Backend Boundary | `NFR-003`, `BND-001` | `AC2-006`, `NEG-08` | Stages 05, 09, 15 | Direct API bypass testing |
| **AP-04.04** | API-First Communication | `NFR-005`, `OPS-003` | `AC2-024` | Stages 15, 26 | Schema compliance tests |
| **AP-04.05** | Domain Ownership | `BR-001` to `BR-010` | `AC2-001` to `AC2-020`| Stages 06, 13 | Dependency boundary analysis |
| **AP-04.06** | Workflow Authority | Sec 5, `NFR-001` | `AC2-001`, `NEG-02` | Stages 07, 08 | State machine transition tests |
| **AP-04.07** | Server-Side Business Rules | `BR-001`, `BR-003`, `NFR-001` | `AC2-011`, `AC2-016` | Stages 06, 26 | Server validator unit tests |
| **AP-04.08** | Server-Side Authorization | `NFR-003`, `BND-001` | `AC2-006`, `NEG-01`, `NEG-08`| Stages 09, 19 | RBAC penetration test suite |
| **AP-04.09** | Persistence Integrity | `NFR-001`, `NFR-005` | `AC2-008`, `AC2-009` | Stages 12, 13 | Referential integrity scripts |
| **AP-04.10** | Forensic Auditability | `NFR-001`, `NFR-003` | `AC2-005`, `NEG-10` | Stage 21 | Mutation audit verification |
| **AP-04.11** | Versioning & Immutability | `BR-001`, `BR-002`, `NFR-001` | `AC2-008`, `AC2-009` | Stages 06, 13 | Version increment tests |
| **AP-04.12** | Optimistic Concurrency Control | `NFR-001`, `NFR-005` | `AC2-010`, `NEG-05` | Stages 13, 15 | Concurrency collision tests |
| **AP-04.13** | Idempotency | `BR-006`, `NFR-001` | `AC2-007`, `NEG-04` | Stages 15, 17 | Idempotent retry tests |
| **AP-04.14** | Boundary Schema Validation | `NFR-001`, `NFR-005` | `AC2-024` | Stages 13, 15, 18 | Schema fuzz testing suite |
| **AP-04.15** | Explicit Error Handling | `NFR-003`, `NFR-005` | `AC2-006`, `NEG-08` | Stages 15, 19 | Key redactor unit tests |
| **AP-04.16** | AI as Assistive Capability | `BR-001`, `BR-010` | `AC2-004`, `NEG-06` | Stage 18 | AI authority gate tests |
| **AP-04.17** | Mandatory Human Quality Gates | `BR-001` to `BR-006` | `AC2-002`, `NEG-03` | Stages 07, 09 | Human signature audit |
| **AP-04.18** | Media & Metadata Separation | `BR-003`, `NFR-001`, `BND-002` | `AC2-015`, `NEG-07` | Stage 14 | Database payload size audit |
| **AP-04.19** | Storage Decoupling | `NFR-005`, `NFR-006` | `AC2-024` | Stages 12, 13, 23 | Repository interface tests |
| **AP-04.20** | Real-Time State Notification | `NFR-002`, `NFR-008` | `AC2-021` | Stage 16 | Multi-client sync tests |
| **AP-04.21** | Observability & Telemetry | `NFR-001`, `NFR-009`, `OPS-003`| `AC2-023` | Stage 21 | Structured log parser tests |
| **AP-04.22** | Centralized Configuration | `NFR-003`, `OPS-001` | `AC2-022` | Stages 19, 29 | Repository secret scan |
| **AP-04.23** | Defense-in-Depth Security | `NFR-003`, `BND-001` | `AC2-006`, `NEG-08` | Stage 19 | OWASP Top 10 security scan |
| **AP-04.24** | High Performance Execution | `NFR-002` | `AC2-025` | Stages 15, 17 | Latency benchmark suites |
| **AP-04.25** | Horizontal Scalability | `NFR-004`, `OPS-001` | `AC2-024` | Stages 12, 29 | Stateless multi-instance tests|
| **AP-04.26** | Modular Extensibility | `BR-006`, `NFR-005` | `AC2-013`, `AC2-018` | Stages 05, 18 | Dynamic plugin registration |
| **AP-04.27** | Brownfield Modernization | Sec 1.1 Item 15, `NFR-001` | `AC2-022`, `NEG-09` | Stages 23, 30 | Migration dry-run parity test |
| **AP-04.28** | Legacy Code Isolation | `NFR-005` | `AC2-024` | Stages 25, 27 | Dead code reference scan |
| **AP-04.29** | Realistic Test Architecture | `NFR-001`, `NFR-005` | `AC2-024` | Stages 24, 28 | Production mock string scan |
| **AP-04.30** | Deployment Independence & Cost | `NFR-006`, `OPS-001` | `AC2-022`, `NEG-09` | Stages 22, 29 | Infrastructure budget audit |

---

## 12. Prohibited Architectural Anti-Patterns

The following design and implementation patterns are strictly prohibited across all future BP-CMS engineering:

1. **Frontend-Owned Business State:** Storing canonical workflow status or permissions only in React component state.
2. **Client-Only Authorization:** Rendering UI buttons based on client-asserted roles without backend API capability checks.
3. **Direct Database Queries from Presentation:** Invoking SQL queries, sheet row updates, or file uploads directly from browser code.
4. **Duplicated Workflow Authorities:** Implementing competing state-machine logic in multiple services or UI pages.
5. **Silent Fallback Business Content:** Catching AI provider errors and fabricating substitute questions or scripts without throwing explicit errors.
6. **AI Autonomous Quality Sign-off:** Permitting AI completions to mark content as verified, certified, or published.
7. **Hidden State Mutations:** Mutating related entity fields without emitting audit log records.
8. **Silent Overwrites (Lost Updates):** Saving database updates without checking optimistic concurrency version counters.
9. **Unaudited State Mutations:** Performing database inserts, updates, or deletes without recording actor ID and timestamp.
10. **Illegal Stage Skipping:** Advancing a Content Master to downstream steps without completing prerequisite reviews.
11. **Test Authentication Bypasses in Production:** Adding `if (req.headers['x-bypass-auth'])` backdoors into production middleware.
12. **Production Mock Engines:** Packaging fake in-memory repositories or synthetic database stores into production builds.
13. **Duplicated Sources of Truth:** Storing canonical question data in multiple independently updated spreadsheets or databases.
14. **Undocumented Legacy Bypasses:** Maintaining unmonitored legacy endpoints that circumvent the 15-step workflow.
15. **Hardcoded Secrets & Credentials:** Storing API keys, JWT secrets, or database passwords in code files or public repositories.
16. **Environment-Specific Production Logic:** Branching core business rules based on `NODE_ENV === 'production'`.

---

## 13. Stage 04 Sign-Off & Verification

This document has been compiled and verified against the Stage 01 Requirements Baseline and Stage 02 Business Acceptance Criteria. It is closed and ready to serve as the binding architecture contract for all subsequent SDLC stages.
