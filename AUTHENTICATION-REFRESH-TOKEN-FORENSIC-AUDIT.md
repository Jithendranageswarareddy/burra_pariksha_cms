# GOOGLE DRIVE OAUTH REFRESH TOKEN — COMPLETE FORENSIC CODE AUDIT

**Date:** 2026-09-26  
**Audit Mode:** READ-ONLY Forensic Audit  
**Target:** Burra Pariksha CMS Google Drive OAuth Integration  

---

## 1. Executive Summary

This forensic audit was conducted to determine why Google Drive operations continue to fail with `invalid_grant: Token has been expired or revoked`, even after fresh OAuth refresh tokens were generated under an OAuth consent screen configured as `IN PRODUCTION`.

The investigation established conclusively:
1. **The application code is NOT the cause of the stale token.** The application code in `src/lib/services/google-drive.service.ts` does not hardcode, truncate, transform, or overwrite the refresh token. It faithfully passes `process.env.GOOGLE_DRIVE_REFRESH_TOKEN` directly to `google-auth-library`'s `OAuth2Client`.
2. **The active runtime container still holds the old expired token.** Both `process.env.GOOGLE_DRIVE_REFRESH_TOKEN` and the host-generated seed file `/app/.dev.env.json` contain the exact SHA-256 hash `68ecc9cded7231c7d5a8fb7670f7590c2facd2da15734ceb5e5fea712b1d99c4` (suffix `...RdQc`).
3. **AI Studio environment variables are decoupled from live container state.** AI Studio's supervisor (`/app/control-plane-api`) writes `/app/.dev.env.json` only during container initialization. Changes made in the Google AI Studio UI Secrets panel do not dynamically update the environment of an existing running container instance.
4. **OAuth Client consistency is 100% verified.** `scripts/google-oauth-setup.ts`, `src/server/routes.ts`, and `google-drive.service.ts` all reference the exact same `GOOGLE_CLIENT_ID` (`1925...com`) and `GOOGLE_CLIENT_SECRET` (`GOCS...JlFd`).

---

## 2. Complete Token Lifecycle

```
[ Google OAuth 2.0 Authorization Server ]
                 │
                 │ 1. User approves consent screen (access_type=offline, prompt=consent)
                 ▼
     [ Authorization Code: 4/0A... ]
                 │
                 │ 2. oauth2Client.getToken(code) exchanges code via POST https://oauth2.googleapis.com/token
                 ▼
[ Fresh Refresh Token: 1//0... ]
                 │
                 │ 3. Operator pastes token into Google AI Studio Secrets UI
                 ▼
[ Google AI Studio Cloud Metadata Store ]
                 │
                 │ 4. Host control plane fetches secrets during container provisioning
                 ▼
        [ /app/.dev.env.json ]
                 │
                 │ 5. Container startup script / supervisor exports JSON keys into process environment
                 ▼
      [ process.env.GOOGLE_DRIVE_REFRESH_TOKEN ]
                 │
                 │ 6. googleDriveService.getDriveApi() reads process.env.GOOGLE_DRIVE_REFRESH_TOKEN
                 ▼
 [ new google.auth.OAuth2(...).setCredentials({ refresh_token }) ]
                 │
                 │ 7. google.drive({ version: 'v3', auth: oauth2Client })
                 ▼
     [ Google Drive API v3 Calls (getFileMetadata, uploadFile, etc.) ]
                 │
                 │ 8. Library requests access token: POST https://oauth2.googleapis.com/token
                 ▼
   [ Google Token Endpoint Rejection: HTTP 400 invalid_grant ]
```

---

## 3. Inventory of Every Refresh Token Reference

| File | Line | Function / Context | Purpose | Reads | Writes | Caches | Transforms | Production Relevance |
|---|---|---|---|---|---|---|---|---|
| `src/lib/services/google-drive.service.ts` | 55 | `GoogleDriveService` field | In-memory token storage | No | Yes | Yes | No | Fallback / UI OAuth flow |
| `src/lib/services/google-drive.service.ts` | 57–60 | `setInMemoryAuth(token)` | Sets `tempRefreshToken` & resets client | No | Yes | Yes | No | Used by OAuth callback route |
| `src/lib/services/google-drive.service.ts` | 63–65 | `getInMemoryAuth()` | Retrieves `tempRefreshToken` | Yes | No | No | No | Diagnostic / Testing |
| `src/lib/services/google-drive.service.ts` | 103 | `getAuthProviderMode()` | Determines if mode is `OAUTH2` | Yes | No | No | No | **Active Production Decision** |
| `src/lib/services/google-drive.service.ts` | 147 | `getDriveApi()` | Assigns token to `OAuth2Client` | Yes | No | Yes | No | **Active Production Client Auth** |
| `src/server/routes.ts` | 340 | `GET /api/auth/google/callback` | Stores callback token in memory | No | Yes | Yes | No | Web OAuth interactive callback |
| `scripts/google-oauth-setup.ts` | 77 | `runLocalSetup()` | Outputs token to terminal stdout | No | No | No | No | Local setup acquisition tool |
| `src/tests/phase7-real-drive-e2e.ts` | 18, 24, 34 | `runPhase7RealDriveE2E()` | Test runner precheck | Yes | No | No | No | Test harness only |
| `src/tests/phase7-oauth-verification.ts` | 25, 52, 68, 87... | Test suite cases | Unit test assertions & env cleanup | Yes | Yes | No | No | Unit tests only |
| `.env.example` | 24 | Configuration template | Variable name documentation | No | No | No | No | Reference documentation |

---

## 4. GoogleDriveService Analysis

1. **When is `GOOGLE_DRIVE_REFRESH_TOKEN` read?**
   It is read inside `getAuthProviderMode()` (line 103) and inside `getDriveApi()` (line 147) upon the first Google Drive API operation.
2. **Is it read once at startup or every request?**
   `getDriveApi()` caches the created `driveApi` client instance in `this.driveApi` once `isAuthInitialized` is `true`. Within a single persistent Node.js process, subsequent calls reuse `this.driveApi`. However, across separate CLI processes (`node -e` or `npx tsx`), it is read fresh from `process.env` on every execution.
3. **Is there a singleton `GoogleDriveService`?**
   Yes. `export const googleDriveService = GoogleDriveService.getInstance();` creates a singleton.
4. **Can `setInMemoryAuth()` override the environment token?**
   **NO.** Lines 103 and 147 explicitly specify:
   ```typescript
   const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN || this.tempRefreshToken;
   ```
   If `process.env.GOOGLE_DRIVE_REFRESH_TOKEN` is defined and non-empty, `this.tempRefreshToken` is completely ignored.
5. **Can an OAuth callback replace the environment token?**
   **NO.** The callback route in `src/server/routes.ts` calls `googleDriveService.setInMemoryAuth(tokens.refresh_token)`. Because `process.env.GOOGLE_DRIVE_REFRESH_TOKEN` is present in the environment, the in-memory token has lower priority.
6. **Can a failed/old token survive a process restart?**
   Yes, because `process.env.GOOGLE_DRIVE_REFRESH_TOKEN` is populated from the external container environment, not from process memory.
7. **Can credentials be cached by `google-auth-library`?**
   `OAuth2Client` caches access tokens in memory for their ~1 hour validity, but does NOT cache refresh tokens across processes or persist them to disk.

---

## 5. Token Override Analysis

* Can any application code replace `process.env.GOOGLE_DRIVE_REFRESH_TOKEN`?
  **NO.** There are zero `process.env.GOOGLE_DRIVE_REFRESH_TOKEN = ...` mutations in production application code (`src/lib/` or `src/server/`).
* Is `dotenv` overriding it?
  **NO.** `dotenv` is present in `package.json`, but is never invoked or configured in `server.ts` or `src/`. No `.env` file exists on disk (only `.env.example`).
* Is any database or Google Sheets cell overriding it?
  **NO.** The CMS persistence layers (Sheets, SQLite, GCS) do not store or read OAuth tokens.

---

## 6. OAuth Setup Script Analysis (`scripts/google-oauth-setup.ts`)

1. **Client ID & Secret**: Reads directly from `process.env.GOOGLE_CLIENT_ID` and `process.env.GOOGLE_CLIENT_SECRET`.
2. **Redirect URI**: Uses `http://localhost:${PORT || 3005}/callback`.
3. **Scopes**: Requests `['https://www.googleapis.com/auth/drive.file']`.
4. **Offline Access**: Yes (`access_type: 'offline'`).
5. **Prompt**: Yes (`prompt: 'consent'`).
6. **Refresh Token Guarantee**: Guaranteed by Google because both `offline` and `consent` are enforced.
7. **Storage**: The script does NOT save, cache, or write the token to disk. It outputs the token strictly to `stdout`.

---

## 7. OAuth Client Consistency

Calculated SHA-256 fingerprints across runtime and scripts:
* **`GOOGLE_CLIENT_ID`**:
  * Length: `72` | Prefix: `1925` | Suffix: `.com`
  * SHA-256: `bb985c41ba076cee638c20aedc5858d0047026aeee2d860d2c35e79a56ce11b2`
  * **MATCH = YES**
* **`GOOGLE_CLIENT_SECRET`**:
  * Length: `35` | Prefix: `GOCS` | Suffix: `JlFd`
  * SHA-256: `628513d1d0aed8a79ebf23d6f29a4f25c1e46a0f8c651676f604de260a6e05c7`
  * **MATCH = YES**

---

## 8. AI Studio Secret Propagation Analysis

* **Mechanism**:
  1. The AI Studio platform runs `/app/control-plane-api` on port `8000`.
  2. When the workspace container boots or reconnects, the platform serializes secrets into `/app/.dev.env.json`.
  3. The file `/app/.dev.env.json` has a file modification time of `2026-09-26T12:32:09.948Z`.
  4. Both `process.env` and `/app/.dev.env.json` currently contain:
     * Length: `103`
     * SHA-256: `68ecc9cded7231c7d5a8fb7670f7590c2facd2da15734ceb5e5fea712b1d99c4`
     * Suffix: `...RdQc`
* **Finding**:
  The running container's `.dev.env.json` and `process.env` match each other identically. The reason the runtime still has the failing token is that the value delivered to `/app/.dev.env.json` at 12:32:09 UTC **was the old token hash**.

---

## 9. Environment Precedence Table

| Precedence | Source | Behavior in Current Codebase |
|---|---|---|
| **1 (Highest)** | `process.env.GOOGLE_DRIVE_REFRESH_TOKEN` | Read directly by `google-drive.service.ts` line 147. |
| **2** | `this.tempRefreshToken` (in-memory) | Evaluated ONLY if `process.env.GOOGLE_DRIVE_REFRESH_TOKEN` is unset/empty. |
| **3** | `/app/.dev.env.json` | Populates `process.env` at container launch via supervisor. |
| **4** | `.env` / `.env.local` | Not present / not used. |
| **5** | Google Sheets / Database | Does not store or provide OAuth tokens. |

---

## 10. Cloud Run Production Separation

* **AI Studio Development Runtime**:
  Runs `/app/applet` on Node.js 22 with Vite and Express, seeded by `/app/.dev.env.json`.
* **Cloud Run Production Runtime**:
  Runs Docker container (`CMD ["node", "dist/server.cjs"]`) with environment variables injected directly from Google Cloud Run Revision configuration or GCP Secret Manager.
* **Separation**:
  Updating secrets in Google AI Studio Settings applies ONLY to the AI Studio development environment. It has **no effect** on Cloud Run production deployments. A Cloud Run revision update/redeploy is required for production.

---

## 11. Git / Source Security

* **Git Repository**:
  `GIT PROVENANCE = UNAVAILABLE IN THIS ENVIRONMENT` (no `.git` directory exists in `/app/applet`).
* **Source Security**:
  No real credentials or refresh tokens are hardcoded in application source files.

---

## 12. Exact Root Cause Classification

**`NOT A CODE CAUSE`**

### Evidence:
1. `src/lib/services/google-drive.service.ts` faithfully reads `process.env.GOOGLE_DRIVE_REFRESH_TOKEN` without truncation or alteration.
2. In all fresh processes, `process.env.GOOGLE_DRIVE_REFRESH_TOKEN` evaluates to SHA-256 `68ecc9cd...`.
3. `/app/.dev.env.json` on disk contains SHA-256 `68ecc9cd...`.
4. No application code touches `/app/.dev.env.json` or mutates `process.env.GOOGLE_DRIVE_REFRESH_TOKEN`.
5. Google's API returns `invalid_grant: Token has been expired or revoked` precisely because the token delivered by the environment is the old, expired token.

---

## 13. Recommended Next Action

The newly generated production refresh token must be placed where the application actually reads it.

Because updating the secret in the AI Studio UI has repeatedly failed to replace the value in `/app/.dev.env.json`, the single concrete next action is:

**Provide the newly generated production refresh token directly in this conversation so it can be verified for syntax and updated in `/app/.dev.env.json` and `process.env` within the container, followed by an immediate read-only root folder verification (`getFileMetadata`).**
