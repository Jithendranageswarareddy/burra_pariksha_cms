# FEATURE CONTRACT: FC-001-SYSTEM-FOUNDATION-IDENTITY

## 1. Feature Identity
- **Feature ID**: FC-001
- **Feature Name**: System Foundation & Identity Authentication
- **Business Area**: Foundation / Identity & Access Management
- **Contract Version**: 1.0.0
- **Status**: APPROVED
- **Priority**: P0 (Blocker)
- **Owner / Domain**: Core Foundation / IAM Context
- **Related Workflow Stage(s)**: Universal (Prerequisite for Steps 01–15)

---

## 2. Requirement
- **Business Requirement**: BR-009 (System Integrity, Audit & Multi-User Governance) & NFR-004 (Zero-Trust Identity Authentication).
- **User Problem**: Operators and creators currently operate without verified cryptographic identity sessions, creating security and accountability risks.
- **Business Purpose**: Provide zero-trust authentication, secure HTTP-only session cookies, deterministic actor ID resolution (`usr_` prefix), and session revocation capabilities.
- **Expected Capability**:
  - Secure session creation via identity provider token exchange / local password hash verification.
  - Signed HTTP-only session cookie issuance with SameSite=Lax/Strict.
  - Active session validation middleware extracting `actorId`, `email`, `role`, and `sessionId`.
  - Immediate session invalidation (logout / global session revocation).
- **Scope**: Token verification, session creation, session cookie management, actor context propagation.
- **Explicit Non-Scope**: Role assignment matrix logic (governed by FC-002), user profile editing UI (governed by FC-002).

---

## 3. Business Acceptance
- **Happy-Path Acceptance**:
  - Valid login credentials return HTTP 200 with `Set-Cookie` header (`bp_session`) and universal `ApiResponseEnvelope`.
  - Protected API routes correctly decode `req.user` context with `actorId` and `role`.
  - Logout endpoint clears `bp_session` cookie and invalidates session token in backend session store.
- **Validation Acceptance**:
  - Malformed email or blank password yields HTTP 400 with `INVALID_INPUT` error code.
- **Authorization Acceptance**:
  - Unauthenticated requests to protected endpoints return HTTP 401 `UNAUTHORIZED`.
- **Failure Acceptance**:
  - Invalid password yields HTTP 401 with generic message "Invalid credentials" to prevent enumeration.
- **Workflow Acceptance**:
  - Session verification executes in $< 10\text{ms}$ overhead per HTTP transaction.
- **Data Acceptance**:
  - Passwords stored strictly as Argon2id / bcrypt hashes with work factor $\ge 12$. Plaintext never logged or stored.
- **Performance Acceptance**:
  - Authentication middleware handles 500 requests/second with $P95 < 15\text{ms}$.
- **Security Acceptance**:
  - Session cookies marked `HttpOnly; Secure; SameSite=Lax`. Cross-Site Scripting (XSS) cannot access session token.
- **Audit Acceptance**:
  - `AUTH_LOGIN_SUCCESS`, `AUTH_LOGIN_FAILED`, and `AUTH_LOGOUT` events dispatched to `IAuditDispatcher`.

---

## 4. Domain Entities
- **Entities Involved**: `User`, `UserSession`, `AuthCredential`.
- **Entity Ownership**: Core Security Domain.
- **Relationships**: One `User` has zero or more active `UserSession` records.
- **Versions**: Schema version 1.0.
- **Immutable Fields**: `userId` (prefixed `usr_`), `createdAt`, `userEmail`.
- **Mutable Fields**: `passwordHash`, `lastLoginAt`, `revokedAt`, `expiresAt`.
- **References**: `sessionId` linked to `userId`.
- **Lifecycle**: `Active` $\to$ `Expired` | `Revoked`.

---

## 5. Database / Data Contract
- **Collections Involved**: `users`, `user_sessions`.
- **Fields Created**:
  - `user_sessions`: `{ id: string, userId: string, tokenHash: string, ipAddress: string, userAgent: string, expiresAt: Timestamp, createdAt: Timestamp }`
- **Fields Updated**: `users.lastLoginAt = Timestamp.now()`.
- **Fields Read**: `users.passwordHash`, `users.role`, `user_sessions.tokenHash`.
- **IDs**: Prefixed `ses_` + UUIDv4 for sessions; `usr_` + UUIDv4 for users.
- **Constraints**: Unique index on `users.email`; index on `user_sessions.tokenHash`.
- **Optimistic Concurrency**: Timestamp-based session expiration checks.
- **Timestamps**: All timestamps in ISO 8601 UTC.
- **Audit Fields**: `createdAt`, `revokedAt`.
- **Soft Deletion**: Not applicable to sessions; sessions are hard deleted or marked revoked.
- **Source of Truth**: Firestore `users` and `user_sessions` collections.

---

## 6. API Contract
### 6.1 `POST /api/v1/auth/login`
- **Authentication**: Public.
- **Required Capability**: None.
- **Request Schema**: `{ email: z.string().email(), password: z.string().min(8) }`.
- **Response Schema**: `ApiResponseEnvelope<{ user: { id: string, email: string, name: string, role: string } }>`.
- **Error Codes**: `400 INVALID_INPUT`, `401 INVALID_CREDENTIALS`, `429 RATE_LIMITED`.
- **Audit Event**: `AUTH_LOGIN_SUCCESS` on success; `AUTH_LOGIN_FAILED` on bad credentials.

### 6.2 `POST /api/v1/auth/logout`
- **Authentication**: Bearer / Session Cookie.
- **Required Capability**: None (Authenticated user).
- **Request Schema**: `{}`.
- **Response Schema**: `ApiResponseEnvelope<{ success: true }>`.
- **Audit Event**: `AUTH_LOGOUT`.

### 6.3 `GET /api/v1/auth/me`
- **Authentication**: Required.
- **Response Schema**: `ApiResponseEnvelope<{ user: { id: string, email: string, role: string, capabilities: string[] } }>`.

---

## 7. Frontend Contract
- **Canonical Route**: `/login` (Login workspace) & universal app shell header.
- **Allowed Roles / Capabilities**: All (Public login route; authenticated shell).
- **Data Required**: Current user session status.
- **Actions**: Submit login credentials; click logout.
- **States**: Loading spinner on login submission; error alert on invalid credentials; redirect to `/dashboard` on success.
- **Permission UX**: Unauthenticated users visiting any route redirected to `/login?redirect=<target>`.

---

## 8. RBAC / Capability Contract
- **Roles Allowed**: Public for login; any authenticated role (`SuperAdmin`, `Admin`, `SubjectMatterExpert`, `ScriptWriter`, `Presenter`, `VideoEditor`, `QualityController`, `Publisher`, `SocialMediaManager`, `AnalyticsViewer`) for `/auth/me` and `/auth/logout`.
- **Capabilities Required**: None for login; valid session token for identity checks.
- **Approval Restrictions**: N/A.

---

## 9. Workflow Contract
- **Workflow Stage**: Foundational prerequisite for all 15 steps.
- **Entry Condition**: User accesses BP-CMS.
- **Completion Condition**: Caller identity cryptographically verified and bound to request context.
- **Next Stage**: Access granted to target workflow route.

---

## 10. Validation Contract
- **Format Validation**: Email RFC 5322 regex; password minimum length 8 characters.
- **Session Validation**: Token must not be expired (`expiresAt > now()`); token must not be present in revocation list.

---

## 11. Error Contract
- `400 BAD_REQUEST`: Empty email or password payload.
- `401 UNAUTHORIZED`: Invalid password, expired session, missing cookie.
- `403 FORBIDDEN`: User account status disabled/banned.
- `429 TOO_MANY_REQUESTS`: More than 5 failed attempts in 15 minutes (IP rate limit).
- `500 INTERNAL_SERVER_ERROR`: Database lookup or hashing engine failure.

---

## 12. Audit Contract
- **Event Name**: `AUTH_LOGIN_SUCCESS`, `AUTH_LOGIN_FAILED`, `AUTH_LOGOUT`, `SESSION_REVOKED`.
- **Payload**: `actorId`, `ipAddress`, `userAgent`, `timestamp`, `requestId`.

---

## 13. Realtime Contract
- **Realtime Requirement**: None for authentication itself. Session revocation may broadcast `session.terminated` via SSE if user is actively connected.

---

## 14. Job / Async Contract
- **Async Processing**: None. Authentication is strictly synchronous ($< 50\text{ms}$).
- **Cleanup Job**: Daily scheduled task to delete expired `user_sessions` older than 30 days.

---

## 15. AI Contract
- **Applicable**: No. AI is strictly prohibited from authenticating or generating sessions.

---

## 16. Media Contract
- **Applicable**: No.

---

## 17. Analytics Contract
- **Applicable**: Tracks login failure rates for security telemetry; strictly operational.

---

## 18. Security Contract
- **Password Storage**: Argon2id with 64MB memory, 3 iterations, 4 parallelism.
- **Session Token**: 256-bit cryptographically secure random bytes hashed with SHA-256 in database.
- **Cookie Security**: `HttpOnly; Secure; SameSite=Lax; Path=/`.
- **CORS**: Explicit whitelist of CMS origins; `credentials: true`.

---

## 19. Observability Contract
- **Request ID**: Propagated via `X-Request-Id` header on all auth endpoints.
- **Logging**: Structured JSON log with `auth.attempt`, `user.email_hash` (never plain email or password).

---

## 20. Cost Contract
- **Resources**: Cloud Run CPU during hash calculation, Firestore reads (1 per login).
- **Free Tier Target**: $\approx 100$ logins/day consumes $< 1\%$ of Cloud Run and Firestore free tier. Expected monthly cost: ₹0.00.

---

## 21. Migration Contract
- **Legacy System**: Hardcoded / unauthenticated Apps Script execution.
- **Strategy**: Introduce session middleware with fallback to legacy bearer token during Phase A transition.

---

## 22. Test Contract
- **Unit Tests**:
  - `TC-AUTH-01`: Password hash generation and verification.
  - `TC-AUTH-02`: Token generation and SHA-256 hash matching.
  - `TC-AUTH-03`: Middleware populates `req.user` from valid cookie.
- **API Integration Tests**:
  - `TC-AUTH-04`: `POST /api/v1/auth/login` valid returns cookie.
  - `TC-AUTH-05`: `POST /api/v1/auth/login` invalid returns 401.
  - `TC-AUTH-06`: Expired cookie returns 401 on protected route.
- **Security Tests**:
  - `TC-AUTH-07`: Rate limiter blocks after 5 failed login attempts.

---

## 23. Dependencies
- **Prerequisite Features**: None (Root of dependency graph).
- **Stage 25 Node**: `D-01 (Identity / Authentication)`.
- **Downstream Consumers**: FC-002, FC-003, and all business features.

---

## 24. Implementation Sequence
1. Implement password hashing utility (`src/lib/auth/password.ts`).
2. Implement session token generation & verification (`src/lib/auth/session.ts`).
3. Implement `authenticateSession` Express middleware.
4. Implement `/api/v1/auth/login`, `/logout`, `/me` endpoints.
5. Implement frontend `/login` view and authentication React context provider.
6. Verify against `TC-AUTH-01..07`.

---

## 25. Deployment Contract
- **Required Env Vars**: `SESSION_SECRET` (minimum 32-char high-entropy string), `COOKIE_DOMAIN`, `NODE_ENV=production`.
- **Smoke Test**: `curl -X POST https://cms.burrapariksha.com/api/v1/auth/login` with test credentials.

---

## 26. Rollback Contract
- **Rollback Trigger**: Auth failure rate $> 1\%$ on valid credentials.
- **Strategy**: Revert Cloud Run revision. Existing user sessions remain valid if `SESSION_SECRET` is unchanged.

---

## 27. Feature Completion Criteria
- [ ] Login, logout, and session check endpoints pass all unit & integration tests.
- [ ] Session cookie uses `HttpOnly; Secure; SameSite=Lax`.
- [ ] Rate limiting actively blocks brute force attempts.
- [ ] No plaintext passwords or secrets in logs.
- [ ] Code compiles cleanly with zero lint and build errors.

---

## 28. Open Issues / Assumptions
- **Assumption**: Initial users will be seeded via administrative script (`npm run seed:admin`). Google OAuth2 SSO can be layered on later without breaking this contract.

---

## 29. Traceability
- **Stage 01**: BR-009, NFR-004
- **Stage 02**: DAC-001, DAC-006
- **Stage 06**: Domain Model IAM Context
- **Stage 09**: Authentication Pre-condition
- **Stage 13**: `users`, `user_sessions` collections
- **Stage 15**: `/api/v1/auth/*` endpoints
- **Stage 19**: Zero-Trust Authentication Architecture
- **Stage 21**: Audit Events `AUTH_*`
- **Stage 22**: Zero-Cost Spark/Cloud Run Tier
- **Stage 24**: Security Test Matrix
- **Stage 25**: Node `D-01`
