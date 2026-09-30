# Security Boundary Architecture Map

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 24 of 41  
**Document:** 36 of 41  

---

## Architectural Security Perimeter

```
[CLIENT BROWSER]
  │ (React SPA on Vite)
  ├─> AuthContext: Holds memory user profile
  ├─> AppRoutes: Binary gate (if !user -> LoginPage)
  ├─> Soft Route Filter: Direct URL entry mounts page
  │
══╡ HTTP BOUNDARY: Cookie (bp_session) / Bearer Token ╞══════════════
  │
[EXPRESS API SERVER]
  │
  ├─> Helmet Security Headers
  ├─> Rate Limiters (aiRateLimiter)
  ├─> requireAuth Middleware:
  │     ├─> Cryptographic HMAC-SHA256 verification
  │     ├─> Token expiration check (24h TTL)
  │     ├─> Revocation registry check (isSessionRevoked)
  │     └─> Authoritative sessionVersion check (USERS tab)
  ├─> requireRole Middleware:
  │     └─> Evaluates user.roles vs allowedRoles (ADMIN bypass)
  │
══╡ SERVICE LAYER BOUNDARY ╞═════════════════════════════════════════
  │
[DOMAIN SERVICES]
  │
  ├─> ObjectAuthorizationService:
  │     ├─> canAccessVideo / canModifyVideo
  │     ├─> canModifyQuestion (authorId check)
  │     ├─> hasActiveAssignment check (ASSIGNMENTS tab)
  │     └─> Self-approval block for reviewers
  ├─> State Machine Validation (VALID_VIDEO_TRANSITIONS)
  │
══╡ STORAGE BOUNDARY: Server-Side Service Account Only ╞══════════════
  │
[PERSISTENCE STORES]
  ├─> Google Sheets API v4 (Authoritative Tabular DB)
  └─> Google Drive API v3 (Authoritative Binary Storage)
```
