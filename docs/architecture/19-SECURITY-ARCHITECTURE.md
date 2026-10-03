# 19 — SECURITY ARCHITECTURE
## Burra Pariksha Content Management System (BP-CMS)
### Stage 19 of 30-Stage Modernization Program — Authoritative Authentication, Authorization, Session Governance & Defensive Security Contracts

```
================================================================================
Document ID:       BP-ARCH-19-SECURITY
Version:           19.0.0-SDLC-RESTART
Status:            APPROVED / AUTHORITATIVE ARCHITECTURAL SPECIFICATION
Scope:             Authentication & Session Lifecycles, Backend Authoritative RBAC,
                   Capability Enforcement Pipeline, Cookie/Token Contracts, CORS/CSRF,
                   Secrets Governance, Media/API Defenses, Realtime/Job Security,
                   Rate Limiting & Free-Tier Budget Compliance (₹0–₹100/mo)
Upstream Inputs:   01-REQUIREMENTS-BASELINE.md
                   02-BUSINESS-ACCEPTANCE-CRITERIA.md
                   03-CURRENT-SYSTEM-BASELINE.md
                   04-ARCHITECTURE-PRINCIPLES.md (AP-002, AP-005, AP-009, AP-010, AP-011, AP-012, AP-014)
                   05-TARGET-SYSTEM-BOUNDARY.md
                   06-DOMAIN-MODEL.md
                   07-CANONICAL-15-STEP-WORKFLOW.md
                   08-STATE-MODEL.md (Entity Lifecycle vs Job Execution vs AI State)
                   09-RBAC-CAPABILITY-MODEL.md (Authoritative Roles, Capabilities & GAR-02)
                   10-FRONTEND-INFORMATION-ARCHITECTURE.md
                   11-PAGE-ROUTE-CONTRACT.md
                   12-DATABASE-ARCHITECTURE.md (Firestore Native Hybrid)
                   13-DATA-MODEL-DATA-CONTRACT.md
                   14-MEDIA-ARCHITECTURE.md (Binary Media Isolation & Checksum Integrity)
                   15-API-CONTRACT.md (REST Envelopes, Error Codes, Idempotency-Key)
                   16-REALTIME-ARCHITECTURE.md (SSE Channel Authorization)
                   17-JOB-ASYNC-ARCHITECTURE.md (Cloud Tasks OIDC Authentication)
                   18-AI-ARCHITECTURE.md (Human-Gated AI Boundary & Secret Shielding)
Downstream Stages: 20-ANALYTICS-ARCHITECTURE.md
                   21-AUDIT-OBSERVABILITY.md
                   22-COST-ARCHITECTURE.md
                   23-MIGRATION-ARCHITECTURE.md
                   24-TEST-ARCHITECTURE.md
                   25-IMPLEMENTATION-DEPENDENCY-PLAN.md
                   26-FEATURE-CONTRACTS.md
                   27-IMPLEMENTATION.md
                   28-INTEGRATION-HUMAN-TESTING.md
Master Axiom:      FRONTEND PERMISSIONS ARE UX. BACKEND PERMISSIONS ARE SECURITY.
                   Frontend checks shape the user experience; backend checks are authoritative.
Budget Invariant:  Hard Initial Infrastructure Ceiling: ₹0–₹100 / month (Zero Paid Security PaaS)
================================================================================
```

---

## 1. Document Governance & Anti-Overclaim Statement

### 1.1 Purpose
This document establishes the authoritative **Security Architecture, Defense-in-Depth Specification, and Cryptographic Governance Model** for the Burra Pariksha Content Management System (BP-CMS). Its purpose is to define:
1. The structural boundaries and contracts governing user identity, authentication, and session lifecycles.
2. The authoritative backend authorization pipeline implementing the **Stage 09 (RBAC & Capabilities)** model:
   $$\text{User} \to \text{Role} \to \text{Capability} \to \text{Resource} \to \text{Action} \to \text{Authorization Decision}$$
3. The cryptographic storage, transport, and validation policies for cookies, session tokens, and service-to-service credentials.
4. Defense-in-depth mechanisms including Cross-Origin Resource Sharing (CORS), Cross-Site Request Forgery (CSRF) defenses, rate limiting, and input sanitization.
5. Strict access control for media binaries (Stage 14), API endpoints (Stage 15), real-time channels (Stage 16), asynchronous worker endpoints (Stage 17), and assistive AI subsystems (Stage 18).
6. Security testing requirements, brownfield migration findings, and compliance with the project's **₹0–₹100/month** budget ceiling.

### 1.2 Strict Anti-Overclaim Invariants
1. **Design and Contract Specification Only:** This document formalizes the *conceptual, logical, and contractual security architecture*. It does **not** assert that runtime authentication middleware, cryptographic token signing routines, CORS filters, rate limiters, or firewall rules have been modified or deployed.
2. **Zero Runtime Code Modification:** No application source code, Express router files (`src/server/routes.ts`), React frontend components, or database schemas are modified during Stage 19.
3. **No Paid Security PaaS:** No commercial Identity-as-a-Service (IDaaS) products (such as Auth0, Okta, WorkOS) or managed Web Application Firewalls (such as Cloudflare Enterprise, AWS WAF) are provisioned.
4. **Contractual Boundary:** Stage 19 establishes the binding architectural contract that **Stage 26 (Feature Contracts)**, **Stage 27 (Implementation)**, and **Stage 28 (Integration & Testing)** will physically implement and verify.

---

## 2. Primary Security Principle: Frontend UX vs. Backend Enforcement

The cornerstone of BP-CMS security architecture is the **Golden Axiom of Access Control**:

$$\mathbf{FRONTEND\ PERMISSIONS\ ARE\ UX.\ BACKEND\ PERMISSIONS\ ARE\ SECURITY.}$$

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                               THE ACCESS CONTROL DIVIDE                                │
├───────────────────────────────────────────┬────────────────────────────────────────────┤
│ Frontend Permission Layer (Pure UX)       │ Backend Enforcement Layer (Real Security)  │
├───────────────────────────────────────────┼────────────────────────────────────────────┤
│ • Hides or shows navigation menu items    │ • Cryptographically verifies session token │
│ • Disables or grays out submit buttons    │ • Resolves actor identity & assigned roles │
│ • Prevents accidental navigation to views │ • Evaluates granular capability matrix     │
│ • Renders contextual diff & review panels │ • Enforces resource tenancy & ownership    │
│ • Displays user-friendly permission toasts│ • Checks GAR-02 anti-self-approval rule    │
│ • Client bundle can be modified or evaded │ • Server-side code is the ultimate barrier │
├───────────────────────────────────────────┴────────────────────────────────────────────┤
│ THREAT MODEL AXIOM: A compromised client, curl request, or automated script can easily │
│ bypass all frontend React logic. The backend must independently authorize every call.  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

Frontend capability checks improve usability by preventing user frustration and guiding workflow progression. **However, frontend checks must never be considered a security boundary.** Every API endpoint, database mutation, media access URL, workflow transition, and administrative operation must execute independent, authoritative server-side authorization.

---

## 3. Authentication Architecture

Authentication establishes and verifies the identity of human operators and automated services accessing BP-CMS.

```text
CLIENT (Browser)                   BP-CMS BACKEND (Express)                PERSISTENCE (Firestore)
  │                                           │                                      │
  │  POST /api/v1/auth/login                  │                                      │
  │  { email, password }                      │                                      │
  ├──────────────────────────────────────────►│                                      │
  │                                           │ 1. Rate Limit Check (AUTH_BURST)     │
  │                                           │ 2. Fetch User Record                 │
  │                                           ├─────────────────────────────────────►│
  │                                           │◄─────────────────────────────────────┤
  │                                           │ 3. Timing-Safe scrypt Verification   │
  │                                           │ 4. Verify isActive === true          │
  │                                           │ 5. Create Session Record             │
  │                                           ├─────────────────────────────────────►│
  │                                           │ 6. Set HttpOnly Secure Cookie        │
  │  200 OK                                   │                                      │
  │  Set-Cookie: bp_session=SES-...; HttpOnly │                                      │
  │◄──────────────────────────────────────────┤                                      │
```

### 3.1 Identity Model
Every human user in BP-CMS is represented by an immutable user profile containing:
- `userId`: Deterministic canonical identifier (e.g. `USR-20261004-001`).
- `email`: Normalized, lowercase email address used as primary username.
- `passwordHash`: Salted cryptographic hash derived via `scrypt` (`scrypt$v1$<salt>$<derived_key>`).
- `roles`: Set of assigned canonical RBAC roles (Stage 09).
- `sessionVersion`: Monotonic integer incremented on global password reset or forced session invalidation.
- `isActive`: Boolean flag; deactivated accounts are immediately rejected by authentication middleware.

### 3.2 Authentication Mechanisms
1. **Interactive Studio Operators (Browser):** Authenticate via email and password, establishing an encrypted, server-validated session transported in an `HttpOnly`, `SameSite=Lax`, `Secure` cookie (`bp_session`).
2. **Automated Background Workers (Cloud Tasks):** Authenticate via Google-signed OpenID Connect (OIDC) identity tokens verifying service-to-service trust (Stage 17).
3. **External Platform Webhooks (Future):** Authenticate via HMAC-SHA256 request signature verification using shared secret keys.

### 3.3 Session Lifecycle & State Machine
Sessions follow a strict, auditable lifecycle:
$$\text{CREATING} \to \text{ACTIVE} \to \text{EXPIRED} \mid \text{REVOKED}$$
- **Creation:** Upon successful credential verification, the server generates an unguessable session token (`SES-` prefix, 256 bits of entropy) and records the active session in Firestore.
- **Verification:** On every authenticated request, the session record is validated against expiration time, client IP range, user active state, and global `sessionVersion`.
- **Idle Timeout:** Inactive sessions expire after **120 minutes** of zero activity.
- **Absolute Timeout:** All sessions expire unconditionally after **24 hours**, requiring re-authentication.
- **Revocation:** Triggered explicitly via user logout (`POST /api/v1/auth/logout`) or administratively via session invalidation.

### 3.4 Account Recovery & Disablement
- Deactivating a user (`isActive: false`) immediately blocks all existing and future requests without waiting for token TTL expiration.
- Password reset increments `User.sessionVersion`, instantly rendering all previously issued sessions and bearer tokens invalid across all devices.

---

## 4. Authorization Architecture

Authorization determines whether an authenticated actor has permission to perform a specific action on a specific resource.

```text
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                         BACKEND AUTHORIZATION DECISION PIPELINE                        │
 └────────────────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │   1. Identity Resolution  │  Extract userId, roles, and session
                        └─────────────┬─────────────┘
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │  2. Capability Evaluation │  Check roleHasCapability(role, cap)
                        └─────────────┬─────────────┘  or explicit user capabilities
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │  3. Resource Ownership    │  Check tenancy, creator assignment,
                        └─────────────┬─────────────┘  or workspace isolation
                                      │
                                      ▼
                        ┌───────────────────────────┐
                        │  4. Business Rule Guard   │  GAR-02: Author !== Approver
                        └─────────────┬─────────────┘  Step transition sequence legality
                                      │
                 ┌────────────────────┴────────────────────┐
                 │                                         │
                 ▼                                         ▼
   ┌───────────────────────────┐             ┌───────────────────────────┐
   │    403 Forbidden Denied   │             │   Authorized Execution    │
   └───────────────────────────┘             └───────────────────────────┘
```

### 4.1 Granular Authorization Pipeline
Every request mutates or reads resources through an unbroken 4-stage evaluation:
1. **Identity Resolution:** Validates session and extracts active user context (`userId`, `roles`).
2. **Capability Check:** Evaluates whether any assigned role grants the required `CapabilityString` (e.g. `QUESTION_REVIEW`).
3. **Resource Ownership & Tenancy:** Evaluates entity-level constraints (e.g. a creator may only edit their own draft until submitted for review).
4. **Business Rule & Anti-Self-Approval Guard (GAR-02):** Enforces separation of duties. An author cannot approve their own authored question, script, or video cut, regardless of their role.

---

## 5. RBAC Alignment (Stage 09 Integration)

The security enforcement architecture reuses the authoritative **Stage 09 (RBAC & Capability Model)** without deviation. No ad-hoc roles or shadow permissions are introduced.

### 5.1 Canonical Roles & Permissions
```text
┌──────────────────────────┬─────────────────────────────┬───────────────────────────────────────┐
│ Canonical Role           │ Primary Studio Scope        │ Core Capabilities                     │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────────────┤
│ `CURRICULUM_LEAD`        │ Question Authoring & Review │ QUESTION_CREATE, QUESTION_REVIEW,     │
│                          │                             │ QUESTION_APPROVE, SCRIPT_REVIEW       │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────────────┤
│ `CONTENT_CREATOR`        │ Ideation & Draft Creation   │ QUESTION_CREATE, SCRIPT_CREATE,       │
│                          │                             │ AI_GENERATE_INVOKE                    │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────────────┤
│ `REVIEWER`               │ Pedagogical Verification    │ QUESTION_REVIEW, SCRIPT_REVIEW,       │
│                          │                             │ THUMBNAIL_REVIEW                      │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────────────┤
│ `PRODUCER`               │ Video Capture & Assembly    │ VIDEO_RECORD, VIDEO_EDIT,             │
│                          │                             │ MEDIA_INGEST, THUMBNAIL_CREATE        │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────────────┤
│ `PUBLISHER`              │ Social Platform Dispatch    │ PUBLISH_SCHEDULE, PUBLISH_EXECUTE,    │
│                          │                             │ PLATFORM_SYNC                         │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────────────┤
│ `ADMIN`                  │ System & User Governance    │ SYSTEM_CONFIGURE, USER_MANAGE,        │
│                          │                             │ AUDIT_VIEW, DISASTER_RECOVER          │
└──────────────────────────┴─────────────────────────────┴───────────────────────────────────────┘
```

---

## 6. Capability Architecture & Evaluation

Capabilities in BP-CMS follow strict dot-notation taxonomy:
$$\mathbf{CAPABILITY} = \mathbf{RESOURCE} \cdot \mathbf{ACTION}$$
Examples: `QUESTION.CREATE`, `QUESTION.APPROVE`, `VIDEO.TRANSCODE`, `PUBLISH.DISPATCH`.

### 6.1 Capability Inheritance & Evaluation
- **No Wildcard Grants in Production:** Wildcards (`*.*`) are strictly prohibited in production to prevent unintended privilege escalation. Even `ADMIN` roles possess explicitly enumerated capabilities.
- **Pure Function Evaluation:** Capability checks are computed using deterministic pure functions:
  ```typescript
  const isAuthorized = roleHasCapability(user.role, 'QUESTION_APPROVE');
  ```
- **Contextual Capabilities:** Dynamic conditions (e.g. `isAuthor`, `isAssignedReviewer`) are evaluated alongside static capabilities:
  ```typescript
  if (actor.id === question.authorId && action === 'APPROVE') {
    throw new SecurityException('FORBIDDEN_SELF_APPROVAL', 'GAR-02 violation');
  }
  ```

---

## 7. Session Architecture & State Management

Sessions bridge stateless HTTP requests with authenticated user context.

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              SESSION LIFECYCLE PARAMETERS                              │
├──────────────────────────┬─────────────────────────────┬───────────────────────────────┤
│ Parameter                │ Specification               │ Architectural Rationale       │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ Session Identifier       │ SES-{256-bit-random-hex}    │ Cryptographically unguessable │
│ Storage Mechanism        │ Firestore `/sessions` doc   │ Durable across container dies │
│ Idle Expiration Timeout  │ 120 minutes (2 hours)       │ Mitigates unattended sessions │
│ Absolute Session Lifetime│ 24 hours                    │ Forces periodic credential re-auth│
│ Session Token Cookie     │ `bp_session` (HttpOnly)     │ Immune to client XSS theft    │
│ Global Version Check     │ `sessionVersion` matching   │ Instant multi-device logout   │
│ Concurrent Sessions      │ Allowed (max 5 per user)    │ Multi-tab & studio mobile use │
└──────────────────────────┴─────────────────────────────┴───────────────────────────────┘
```

---

## 8. Cookies and Tokens Architecture

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              COOKIE & TOKEN ATTRIBUTES                                 │
├──────────────────────────┬─────────────────────────────┬───────────────────────────────┤
│ Attribute                │ Configuration               │ Security Objective            │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ Name                     │ `bp_session`                │ Standardized session cookie   │
│ `HttpOnly`               │ `true`                      │ Blocks JavaScript `document.cookie`│
│ `Secure`                 │ `true` (prod), `false` (dev)│ Transmitted over HTTPS only   │
│ `SameSite`               │ `Lax`                       │ Defends against cross-site CSRF│
│ Path                     │ `/`                         │ Valid across all API routes   │
│ Max-Age                  │ 86400 (24 hours)            │ Enforces absolute session cap │
└──────────────────────────┴─────────────────────────────┴───────────────────────────────┘
```

### 8.1 Bearer Token Header Fallback
For non-browser clients (such as local CLI tools or automated integration tests), the server accepts an `Authorization: Bearer <token>` header containing the identical session token format.

---

## 9. Cross-Site Request Forgery (CSRF) Architecture

BP-CMS enforces a multi-layer defense against CSRF:
1. **`SameSite=Lax` Cookie Policy:** Browsers automatically withhold the `bp_session` cookie on cross-site state-mutating requests (POST, PUT, DELETE, PATCH).
2. **Custom Request Header Requirement:** All mutating API endpoints require the presence of a custom header:
   `X-BP-Requested-With: XMLHttpRequest` (or standard `Content-Type: application/json`).
   Cross-origin form submissions (`<form method="POST">`) cannot set custom headers without triggering a preflight OPTIONS check.
3. **Origin & Referer Validation:** For state-changing requests, the backend verifies that the incoming `Origin` or `Referer` header strictly matches the configured CORS allowed origins.

---

## 10. Cross-Origin Resource Sharing (CORS) Architecture

CORS policies are configured strictly to prohibit unrestricted wildcard reflection:

```typescript
export const DEFAULT_CORS_CONFIG: CorsConfig = {
  allowedOrigins: [
    'https://bp-cms.web.app',
    'https://burra-pariksha-cms.web.app',
    'http://localhost:5173', // Vite local development
    'http://localhost:3000', // Express local server
  ],
  allowedMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-BP-Requested-With',
    'X-Request-ID',
    'X-Idempotency-Key',
    'Last-Event-ID',
  ],
  allowCredentials: true,
  maxAgeSeconds: 86400, // 24 hours preflight cache
};
```
*Wildcard CORS (`Access-Control-Allow-Origin: *`) is strictly forbidden for any route using credentials.*

---

## 11. Secrets Management Architecture

To protect sensitive infrastructure and API keys without incurring paid secret-manager costs:
1. **Zero Secrets in Source Control:** No passwords, private keys, service account credentials, or API tokens may ever be committed to Git. `.gitignore` strictly blocks all `.env`, `.env.*`, and `*.pem` files.
2. **Server-Side Environment Externalization:** Secrets are injected exclusively at container runtime via Google Cloud Run environment variables:
   - `SESSION_SECRET`: 64-character hex secret for cryptographic operations.
   - `GEMINI_API_KEY`: Server-side API key for Google AI Studio.
   - `GOOGLE_SERVICE_ACCOUNT_KEY`: Encrypted JSON credentials for Sheets/Drive.
3. **Zero Secret Leakage Invariant:**
   - Bundlers (Vite/Rollup) are configured to ensure environment variables lacking `VITE_` prefixes are completely stripped from client bundles.
   - System error handlers, audit ledgers, and logging formatters automatically sanitize strings matching known credential patterns.

---

## 12. API Security Architecture (Stage 15 Integration)

Grounded in **Stage 15 (API Architecture)**:
1. **Strict Input Validation:** All API request bodies and query parameters are parsed through strict Zod schemas before execution. Unknown or extra fields are stripped (`strip()` or `strict()`).
2. **Privilege Escalation Defenses:**
   - **Horizontal Escalation:** Handlers verify that the authenticated `userId` matches the resource author or assigned reviewer.
   - **Vertical Escalation:** Handlers reject any client payload attempting to self-assign roles or tamper with `sessionVersion`.
3. **ID Enumeration Prevention:** All public identifiers use random, non-sequential alphanumeric IDs (`Q-20261004-98124`, `JOB-20261004-8931af`), preventing sequential scraping.
4. **Replay & Duplicate Protection:** All mutating endpoints require deterministic `X-Idempotency-Key` headers (Stage 15).

---

## 13. Media Access Security Architecture (Stage 14 Integration)

Grounded in **Stage 14 (Media Architecture)**:
1. **Binary Storage Isolation:** Raw video binaries, audio masters, and artwork variants reside strictly in private Google Drive or Google Cloud Storage buckets. Under no circumstances are raw bucket URLs exposed publicly.
2. **Time-Limited Signed URLs:** When an authorized operator requests media preview or download, the server generates a short-lived signed URL:
   - **Review Workspace:** 15-minute expiration time.
   - **Teleprompter Script Preview:** 60-minute expiration time.
3. **Cryptographic Tamper Detection:** Before any video take or final cut is approved, the system verifies its SHA-256 checksum against the immutable hash recorded in `MediaAsset.sha256Checksum`. Any checksum mismatch flags the asset as `STORAGE_CORRUPTED`.

---

## 14. Audit Security Architecture (Stage 21 Integration)

Security-relevant actions emit immutable structured audit records to `/audit_events`:

```typescript
export interface SecurityAuditEvent {
  readonly eventId: string; // AUD-YYYYMMDD-XXXXXX
  readonly timestamp: string;
  readonly actorId: string;
  readonly actorRole: CanonicalRbacRole;
  readonly capability: string;
  readonly resource: string;
  readonly resourceId: string;
  readonly action: AuditActionType;
  readonly ipAddress: string;
  readonly userAgent: string;
  readonly success: boolean;
  readonly errorCode?: string;
  readonly diff: Record<string, unknown> | null;
}
```
*Audit records are write-only for standard users and can never be updated or deleted through application APIs.*

---

## 15. Rate Limiting Architecture

To protect serverless resources and third-party API quotas, BP-CMS enforces multi-tier rate limiting:

```text
┌──────────────────────┬─────────────────┬──────────────────┬────────────────────────────┐
│ Tier                 │ Time Window     │ Max Requests     │ Target Scope               │
├──────────────────────┼─────────────────┼──────────────────┼────────────────────────────┤
│ `AUTH_BURST`         │ 1 minute        │ 5 requests       │ `/api/v1/auth/login`       │
├──────────────────────┼─────────────────┼──────────────────┼────────────────────────────┤
│ `AI_GENERATION`      │ 1 minute        │ 10 requests      │ `/api/v1/ai/generate`      │
├──────────────────────┼─────────────────┼──────────────────┼────────────────────────────┤
│ `MEDIA_INGESTION`    │ 1 minute        │ 10 requests      │ `/api/v1/media/upload`     │
├──────────────────────┼─────────────────┼──────────────────┼────────────────────────────┤
│ `STANDARD_API`       │ 1 minute        │ 60 requests      │ General `/api/v1/*` routes │
└──────────────────────┴─────────────────┴──────────────────┴────────────────────────────┘
```
Exceeded limits return `429 Too Many Requests` with a standard `Retry-After: {seconds}` header.

---

## 16. Service-to-Service Security Architecture (Stage 17 Integration)

1. **Cloud Tasks to Cloud Run:** The internal worker route (`POST /api/v1/jobs/execute`) is strictly inaccessible to public traffic.
2. **Google OpenID Connect (OIDC) Verification:** Cloud Tasks provides a cryptographically signed Google OIDC token in the `Authorization: Bearer <oidc_token>` header. The Cloud Run handler validates the token's signature, audience (`https://bp-cms.run.app`), and issuer (`accounts.google.com`). Requests lacking valid OIDC verification are rejected with `401 Unauthorized`.

---

## 17. Frontend Security UX Contracts

1. **Unauthorized Navigation:** If a user attempts to navigate to a route requiring capabilities they lack (e.g. `/admin/users`), the frontend shell redirects them to their default landing page and displays an informational toast (`"You lack permission to view this workspace"`).
2. **Disabled Actions:** Buttons for unauthorized actions are disabled with contextual tooltips explaining the required role.
3. **Session Expiry Handling:** When an API call returns `401 Unauthorized`, the client session context invalidates local state and smoothly redirects to `/login?redirect={current_path}`.

---

## 18. Backend Security Enforcement Pipeline

The authoritative request handling sequence in Express follows an unbreakable 9-stage pipeline:

```text
1. Network Ingress & TLS Termination (Cloud Run)
   ↓
2. CORS & Security Headers (Helmet, Origin Validation)
   ↓
3. Rate Limiter (Token Bucket / IP Window)
   ↓
4. Authentication Middleware (Cookie / Bearer Token Verification)
   ↓
5. Granular Capability Middleware (Role & Capability Mapping)
   ↓
6. Resource Ownership & Tenancy Verification
   ↓
7. Business Rule & State Transition Verification (GAR-02)
   ↓
8. Atomic Database Mutation (Firestore Transaction)
   ↓
9. Audit Event Emission (Immutable Security Log)
```

---

## 19. Failure Model & Error Representation

Security failures map consistently to standard Stage 15 `ApiResponseEnvelope` schemas:
- `401 Unauthorized`: Missing, expired, or invalid session token.
- `403 Forbidden`: Authenticated actor lacks required capability or violates business rules (e.g. GAR-02).
- `404 Not Found`: Returned instead of `403` when revealing resource existence would leak sensitive information.
- `429 Too Many Requests`: Rate limit tier exceeded.
- *Error messages describe the failure reason clearly without leaking stack traces or internal database paths.*

---

## 20. Security + Workflow Integration (15-Step Studio Pipeline)

1. **Step-Gated Authorization:** Advancing a `WorkflowInstance` from Step $N$ to Step $N+1$ requires specific step-level capabilities defined in Stage 09.
2. **Anti-Self-Approval Enforcement (GAR-02):** The backend verifies that the approving actor is distinct from the author who created the draft in all human-gated review stages (Steps 02, 04, 07, 10).

---

## 21. Security + AI Subsystem Integration (Stage 18 Alignment)

1. **Non-Authoritative AI Boundary:** AI generation outputs are treated as untrusted input. They enter isolated proposals and cannot directly mutate canonical entities.
2. **Prompt Injection Defense:** External context variables are sanitized and escaped before injection into Gemini system prompts.
3. **API Key Isolation:** Client applications have zero direct access to Google AI Studio or Gemini endpoints; all requests proxy through authenticated backend controllers.

---

## 22. Security + Realtime Integration (Stage 16 Alignment)

1. **SSE Connection Authentication:** The EventSource handshake (`GET /api/v1/realtime/events`) requires a valid session token via cookie or query token.
2. **Channel Subscription Authorization:** Clients may only subscribe to entity channels (`entity:question:{id}`) for resources they are authorized to read. User channels (`user:{userId}`) are strictly restricted to the owning actor.

---

## 23. Security + Asynchronous Jobs Integration (Stage 17 Alignment)

1. **Job Creation RBAC:** Job scheduling endpoints enforce capability checks matching the underlying task (`AI_GENERATION` requires `QUESTION_CREATE`).
2. **Optimistic Lease Locks:** Background workers acquire atomic lease locks in Firestore (`leaseExpiresAt`), preventing concurrent worker races or duplicate execution.

---

## 24. Comprehensive Security Test Architecture

Stage 24 and Stage 28 must implement the following 20 architectural security test suites:
1. `TEST-SEC-01`: Unauthenticated request to protected route returns `401 Unauthorized`.
2. `TEST-SEC-02`: Valid login issues `HttpOnly`, `SameSite=Lax`, `Secure` session cookie.
3. `TEST-SEC-03`: Inactive user (`isActive: false`) rejected at authentication gate.
4. `TEST-SEC-04`: Token with outdated `sessionVersion` rejected with `401 Unauthorized`.
5. `TEST-SEC-05`: User lacking capability receives `403 Forbidden`.
6. `TEST-SEC-06`: Author attempting to approve own question fails with GAR-02 violation.
7. `TEST-SEC-07`: Horizontal privilege escalation attempt (editing another creator's draft) blocked.
8. `TEST-SEC-08`: Vertical privilege escalation attempt (user self-assigning `ADMIN` role) blocked.
9. `TEST-SEC-09`: Cross-site POST request lacking custom header rejected by CSRF guard.
10. `TEST-SEC-10`: CORS request from unauthorized origin rejected.
11. `TEST-SEC-11`: Rate limit burst ($> 5$ login attempts in 1 minute) returns `429 Too Many Requests`.
12. `TEST-SEC-12`: Gemini API key never appears in client bundle, logs, or error responses.
13. `TEST-SEC-13`: Tampered video binary (corrupted SHA-256) rejected during approval.
14. `TEST-SEC-14`: Media signed URL expires after configured window.
15. `TEST-SEC-15`: Cloud Tasks internal worker route rejects requests lacking valid Google OIDC token.
16. `TEST-SEC-16`: SSE connection rejected for unauthenticated client.
17. `TEST-SEC-17`: SSE client cannot subscribe to private user channel of another user.
18. `TEST-SEC-18`: Non-authoritative AI output cannot directly advance workflow step.
19. `TEST-SEC-19`: Mutating request with duplicate `Idempotency-Key` returns original cached result.
20. `TEST-SEC-20`: Security audit log generated for every authentication and authorization event.

---

## 25. Cost Architecture & Budget Invariant

BP-CMS enforces a hard budget ceiling: **₹0 to ₹100 / month**.
- **Authentication:** In-process Node.js `scrypt` hashing and Firestore session persistence = **₹0.00 / month**.
- **Authorization:** Pure functional RBAC capability evaluation in memory = **₹0.00 / month**.
- **CORS / CSRF / Headers:** Native Express and Helmet middleware = **₹0.00 / month**.
- **Rate Limiting:** In-memory token bucket on Cloud Run = **₹0.00 / month**.
- **Total Security Infrastructure Cost:** **₹0.00 / month** (100% Free-Tier Compliant).

---

## 26. Brownfield / Migration Findings

```text
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              BROWNFIELD SECURITY AUDIT                                 │
├──────────────────────────┬─────────────────────────────┬───────────────────────────────┤
│ Security Dimension       │ Current Brownfield State    │ Target Security Architecture  │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ Authentication           │ `AuthService` with scrypt & │ KEEP & ENHANCE: Add strict    │
│                          │ `bp_session` cookie         │ idle timeout and multi-device │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ Authorization            │ Coarse role checks in       │ REPLACE: Granular capability  │
│                          │ routes (`requireRole`)      │ matrix (`roleHasCapability`)  │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ Anti-Self-Approval       │ Enforced in some services,  │ STANDARDIZE: Universal GAR-02 │
│                          │ absent in others            │ middleware enforcement        │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ CSRF Protection          │ `SameSite` cookies only;    │ ENHANCE: Add custom header    │
│                          │ no header validation        │ requirement for all mutations │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ CORS Configuration       │ Permissive in development;  │ STANDARDIZE: Strict origin    │
│                          │ needs strict production map │ whitelist without wildcards   │
├──────────────────────────┼─────────────────────────────┼───────────────────────────────┤
│ Secrets Management       │ Server `.env` file;         │ KEEP: Externalized Cloud Run  │
│                          │ mostly uncommitted          │ environment variables         │
└──────────────────────────┴─────────────────────────────┴───────────────────────────────┘
```

---

## 27. Security Decision Register (SDR)

- **SDR-01:** Adopt `HttpOnly`, `SameSite=Lax`, `Secure` cookies as the primary browser authentication mechanism.
- **SDR-02:** Enforce the Golden Axiom: Frontend permissions are UX; backend authorization is authoritative.
- **SDR-03:** Enforce the GAR-02 anti-self-approval rule universally across all workflow approval transitions.
- **SDR-04:** Use Google-signed OIDC identity tokens for internal service-to-service Cloud Tasks worker invocations.
- **SDR-05:** Rely on native Node.js `scrypt` hashing and Firestore session tracking to maintain ₹0.00 infrastructure cost.
- **SDR-06:** Strictly prohibit wildcard CORS on any credentialed or state-changing API route.
- **SDR-07:** Implement time-limited signed URLs for all media binary access to isolate Google Drive storage.
- **SDR-08:** Enforce SHA-256 cryptographic checksum verification for all video and media assets.

---

## 28. Open Decisions & Conflict Registers

### 28.1 Security Architecture Records (SJAR)
- **SJAR-01 (Approved):** Adopt session versioning for immediate global multi-device logout.
- **SJAR-02 (Approved):** Mandate custom request header verification for CSRF mitigation.

### 28.2 Conflict Register (SJACR)
- **SJACR-01 (Resolved):** *Stateless JWT vs. Stateful Database Session.*
  - **Resolution:** Stateful database session tracking in Firestore is selected. Pure stateless JWTs cannot be instantly revoked upon security incidents or user deactivation without a distributed denylist, which adds unnecessary complexity.
- **SJACR-02 (Deferred to Stage 22):** *Verification of free-tier Firebase Auth vs. custom scrypt session maintenance.*
  - **Status:** Deferred to Stage 22 (Cost Architecture).

---

## 29. Stage 19 Acceptance Criteria & Anti-Overclaim Confirmation

### 29.1 Acceptance Criteria Checklist
- [x] Primary security principle (Frontend UX vs Backend Enforcement) explicitly defined.
- [x] Authentication architecture and session lifecycle documented.
- [x] Authorization pipeline ($\text{User} \to \text{Role} \to \text{Capability} \to \text{Resource} \to \text{Action}$) defined.
- [x] Stage 09 RBAC and capability matrix integrated without contradictions.
- [x] Session architecture, timeouts, versioning, and revocation specified.
- [x] Cookie and token parameters (`HttpOnly`, `SameSite=Lax`, `Secure`) defined.
- [x] CSRF and CORS defensive architectures specified.
- [x] Secrets management and zero-leakage invariants established.
- [x] API, Media, Audit, Rate Limiting, and Service-to-Service defenses defined.
- [x] Integrations with Workflow, AI (Stage 18), Realtime (Stage 16), and Jobs (Stage 17) documented.
- [x] 20 comprehensive security test suites specified.
- [x] ₹0.00 / month cost compliance proven.
- [x] Zero runtime code files modified during Stage 19.

### 29.2 Final Anti-Overclaim Statement
**Stage 19 security architecture is documented and contractually defined; runtime authentication middleware, capability evaluators, and security enforcement pipelines remain for later implementation stages.**
