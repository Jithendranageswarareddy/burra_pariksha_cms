# Deployment & Environment Baseline

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 01 — Repository & Environment Baseline  
**Audit Date:** 2026-09-28  
**Audit Mode:** Read-Only Forensic Inventory  
**Total Process.Env Variables Discovered:** 39 Distinct Names across 636 Files  

---

## 1. Deployment Architecture

The application is architected for containerized deployment on **Google Cloud Run**.

### A. Dockerfile Specifications (`/Dockerfile`)
- **Base Image:** `node:20-alpine` (multi-stage)
- **Stage 1 (Builder):**
  - Installs all dependencies via `npm ci`
  - Executes `npm run build`
    - Vite builds frontend client assets into `dist/`
    - esbuild bundles `server.ts` into standalone CommonJS binary `dist/server.cjs` (`--bundle --platform=node --format=cjs --packages=external --sourcemap`)
- **Stage 2 (Runner):**
  - Installs production-only dependencies via `npm ci --omit=dev`
  - Copies compiled `dist/` directory from builder stage
  - Environment variables set: `ENV NODE_ENV=production`, `ENV PORT=3000`
  - Exposes port `3000`
  - Startup command: `CMD ["node", "dist/server.cjs"]`

### B. Deployment & Build Commands (`package.json`)
- `npm run dev`: `tsx server.ts` (interprets Express server with mounted Vite middleware)
- `npm run build`: `vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs`
- `npm run start`: `node dist/server.cjs`
- `npm run preview`: `vite preview`
- `npm run clean`: `rm -rf dist server.js`

---

## 2. Environment Variables & Secret References Audit

> **CRITICAL SECURITY NOTICE:** In accordance with the audit charter, **NO SECRET VALUES** were inspected, copied, or stored. All secret tokens, private keys, passwords, and credentials remain **REDACTED / NOT INSPECTED**.

The following table records every `process.env` variable identifier referenced across the codebase:

| # | Environment Variable Name | Referenced In (Files Count) | Representative Files | Purpose | Required for Prod? | Canonical vs Legacy / Test | Secret Value Status |
| :- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `ALLOW_LIVE_TEST_WRITES` | 2 | `src/lib/google-sheets/client.ts`, `src/tests/test-isolation-safety-gate.test.ts` | Safety override permitting writes to live sheets in automated tests | No | Test-Only Safety Gate | REDACTED / NOT INSPECTED |
| 2 | `ANALYTICS_SPREADSHEET_ID` | 6 | `src/lib/google-sheets/client.ts`, `src/lib/repositories/analytics.repository.ts`, `src/lib/repositories/social-comments.repository.ts` | Dedicated Google Spreadsheet ID for social analytics and comments | Yes | Canonical Production | REDACTED / NOT INSPECTED |
| 3 | `ANTHROPIC_API_KEY` | 2 | `src/lib/ai/providers/anthropic.adapter.ts`, `src/tests/phase24-ai-orchestrator.ts` | API key for Anthropic Claude fallback provider | Optional | Provider Adapter | REDACTED / NOT INSPECTED |
| 4 | `BOOTSTRAP_SECRET` | 3 | `src/lib/services/durable-snapshot-archive.service.ts`, `src/server/routes.ts`, `src/tests/task3f49-recovery-security-verification.ts` | Authorization token for server-side recovery and restore preflight endpoints | Yes | Canonical Security | REDACTED / NOT INSPECTED |
| 5 | `CLOUD_RUN_TIMEOUT_SECONDS` | 1 | Runtime Environment (`env`) | Cloud Run request deadline timeout configuration | Auto | Infrastructure | REDACTED / NOT INSPECTED |
| 6 | `CMS_TEST_ISOLATION` | 2 | `src/lib/google-sheets/client.ts`, `src/tests/test-isolation-safety-gate.test.ts` | Guard flag enforcing test isolation from production sheets | No | Test-Only Safety Gate | REDACTED / NOT INSPECTED |
| 7 | `COHERE_API_KEY` | 2 | `src/lib/ai/providers/cohere.adapter.ts`, `src/tests/phase24-ai-orchestrator.ts` | API key for Cohere fallback provider | Optional | Provider Adapter | REDACTED / NOT INSPECTED |
| 8 | `CONTROL_PLANE_PORT` | 1 | Runtime Environment (`env`) | Google AI Studio control plane port (8000) | Auto | Infrastructure | REDACTED / NOT INSPECTED |
| 9 | `DEFAULT_APP_PORT` | 1 | Runtime Environment (`env`) | Default local development port (3000) | Auto | Infrastructure | REDACTED / NOT INSPECTED |
| 10 | `DISABLE_HMR` | 2 | `vite.config.ts` | Disables Vite file watcher and HMR to save CPU in container | Optional | AI Studio Dev | REDACTED / NOT INSPECTED |
| 11 | `EXPERIMENTAL_LABS_API_KEY` | 2 | `src/lib/ai/providers/experimental-labs.adapter.ts`, `src/tests/phase24-ai-orchestrator.ts` | API key for experimental labs provider | Optional | Provider Adapter | REDACTED / NOT INSPECTED |
| 12 | `GCS_SNAPSHOT_BUCKET` | 4 | `src/config/snapshot.config.ts`, `src/tests/task3f410a-snapshot-config-verification.ts` | Google Cloud Storage bucket for automated database backups | Yes | Canonical Infrastructure | REDACTED / NOT INSPECTED |
| 13 | `GCS_SNAPSHOT_ENABLED` | 4 | `src/config/snapshot.config.ts`, `src/tests/task3f410a-snapshot-config-verification.ts` | Master switch for automated GCS snapshotting | Yes | Canonical Production | REDACTED / NOT INSPECTED |
| 14 | `GCS_SNAPSHOT_INTERVAL_HOURS` | 1 | `src/config/snapshot.config.ts` | Interval in hours between scheduled GCS snapshots | Optional | Configuration | REDACTED / NOT INSPECTED |
| 15 | `GCS_SNAPSHOT_MIN_KEEP_COUNT` | 1 | `src/config/snapshot.config.ts` | Minimum number of snapshots preserved regardless of age | Optional | Configuration | REDACTED / NOT INSPECTED |
| 16 | `GCS_SNAPSHOT_RETENTION_CLEANUP_ENABLED` | 1 | `src/config/snapshot.config.ts` | Flag enabling automated pruning of expired snapshots | Optional | Configuration | REDACTED / NOT INSPECTED |
| 17 | `GCS_SNAPSHOT_RETENTION_DAYS` | 2 | `src/config/snapshot.config.ts`, `src/tests/task3f410a-snapshot-config-verification.ts` | Maximum age in days before GCS snapshots are pruned | Optional | Configuration | REDACTED / NOT INSPECTED |
| 18 | `GCS_SNAPSHOT_SCHEDULE_ENABLED` | 1 | `src/config/snapshot.config.ts` | Enables recurring background timer in `server.ts` | Optional | Configuration | REDACTED / NOT INSPECTED |
| 19 | `GEMINI_API_KEY` | 10 | `src/lib/ai/gemini.client.ts`, `src/lib/ai/gemini.service.ts`, `src/lib/services/durable-snapshot-archive.service.ts` | Primary API key for Google Gemini model generation and verification | Yes | Canonical AI Integration | REDACTED / NOT INSPECTED |
| 20 | `GEMINI_MODEL` | 2 | `src/lib/ai/config.ts`, `src/lib/ai/gemini.client.ts` | Primary Gemini model alias override (e.g. `gemini-2.5-flash`) | Optional | Configuration | REDACTED / NOT INSPECTED |
| 21 | `GOOGLE_CLIENT_ID` | 8 | `scripts/google-oauth-setup.ts`, `src/lib/services/google-drive.service.ts` | Google Cloud OAuth 2.0 Web Client ID | Yes | Canonical Drive OAuth | REDACTED / NOT INSPECTED |
| 22 | `GOOGLE_CLIENT_SECRET` | 8 | `scripts/google-oauth-setup.ts`, `src/lib/services/google-drive.service.ts` | Google Cloud OAuth 2.0 Web Client Secret | Yes | Canonical Drive OAuth | REDACTED / NOT INSPECTED |
| 23 | `GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN` | 6 | `scripts/final-baseline-read-only-audit.ts`, `src/lib/services/google-drive.service.ts` | Canonical Google Drive OAuth 2.0 user refresh token | Yes | Canonical Drive OAuth | REDACTED / NOT INSPECTED |
| 24 | `GOOGLE_DRIVE_REFRESH_TOKEN` | 1 | `src/tests/phase7-oauth-verification.ts` | Legacy variable name audited and replaced by `GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN` | No | Legacy (Do Not Use) | REDACTED / NOT INSPECTED |
| 25 | `GOOGLE_DRIVE_ROOT_FOLDER_ID` | 5 | `scripts/verify-drive-state.ts`, `src/lib/services/google-drive.service.ts` | Google Drive root folder ID (`Burra Pariksha`) | Yes | Canonical Infrastructure | REDACTED / NOT INSPECTED |
| 26 | `GOOGLE_PRIVATE_KEY` | 20 | `src/lib/google-sheets/client.ts`, `scripts/comprehensive-audit.ts` | Google Service Account RSA private key for Google Sheets API | Yes | Canonical Persistence | REDACTED / NOT INSPECTED |
| 27 | `GOOGLE_REDIRECT_URI` | 3 | `src/lib/services/google-drive.service.ts`, `src/server/routes.ts` | OAuth 2.0 callback redirect URI | Yes | Canonical Drive OAuth | REDACTED / NOT INSPECTED |
| 28 | `GOOGLE_SERVICE_ACCOUNT_EMAIL` | 21 | `src/lib/google-sheets/client.ts`, `scripts/clean-audit-log.ts` | Google Service Account email for Google Sheets API | Yes | Canonical Persistence | REDACTED / NOT INSPECTED |
| 29 | `GOOGLE_SHEETS_ID` | 25 | `src/lib/google-sheets/client.ts`, `src/lib/repositories/base.repository.ts` | Authoritative primary Google Spreadsheet ID | Yes | Canonical Database | REDACTED / NOT INSPECTED |
| 30 | `GOOGLE_SPREADSHEET_ID` | 4 | `src/tests/phase13-step2-retry-logic.ts` to `phase13-step5` | Legacy alias for `GOOGLE_SHEETS_ID` in older Phase 13 tests | No | Legacy Test Alias | REDACTED / NOT INSPECTED |
| 31 | `GROQ_API_KEY` | 2 | `src/lib/ai/providers/groq.adapter.ts`, `src/tests/phase24-ai-orchestrator.ts` | API key for Groq Llama 3 fallback provider | Optional | Provider Adapter | REDACTED / NOT INSPECTED |
| 32 | `HUGGING_FACE_API_KEY` | 2 | `src/lib/ai/providers/huggingface.adapter.ts`, `src/tests/phase24-ai-orchestrator.ts` | API key for Hugging Face inference provider | Optional | Provider Adapter | REDACTED / NOT INSPECTED |
| 33 | `INITIAL_ADMIN_PASSWORD` | 2 | `src/lib/services/production-sheet-initializer.service.ts`, `src/lib/services/durable-snapshot-archive.service.ts` | Initial administrative user password during database initialization | Optional | Bootstrap Only | REDACTED / NOT INSPECTED |
| 34 | `K_SERVICE` | 1 | Runtime Environment (`env`) | Cloud Run service name identifier (`ais-dev-fjjdmukiysol435fsvlcau`) | Auto | Cloud Run Metadata | REDACTED / NOT INSPECTED |
| 35 | `MAX_THUMBNAIL_SIZE_BYTES` | 1 | `src/lib/services/phase14-drive.service.ts` | Maximum permissible thumbnail upload size | Optional | Limits | REDACTED / NOT INSPECTED |
| 36 | `MAX_VIDEO_SIZE_BYTES` | 1 | `src/lib/services/phase14-drive.service.ts` | Maximum permissible video upload size | Optional | Limits | REDACTED / NOT INSPECTED |
| 37 | `MISTRAL_API_KEY` | 2 | `src/lib/ai/providers/mistral.adapter.ts`, `src/tests/phase24-ai-orchestrator.ts` | API key for Mistral AI fallback provider | Optional | Provider Adapter | REDACTED / NOT INSPECTED |
| 38 | `NGINX_PORT` | 1 | Runtime Environment (`env`) | Container ingress proxy port (8080) | Auto | Infrastructure | REDACTED / NOT INSPECTED |
| 39 | `NODE_ENV` | 17 | `server.ts`, `src/lib/google-sheets/client.ts`, `src/lib/services/auth.service.ts` | Runtime environment flag (`development` or `production`) | Yes | Node Standard | REDACTED / NOT INSPECTED |
| 40 | `NODE_OPTIONS` | 1 | Runtime Environment (`env`) | Node memory allocation flag (`--max-old-space-size=3072`) | Auto | Infrastructure | REDACTED / NOT INSPECTED |
| 41 | `NODE_VERSION` | 1 | Runtime Environment (`env`) | Node.js engine release version (`22.23.2`) | Auto | Infrastructure | REDACTED / NOT INSPECTED |
| 42 | `OPENROUTER_API_KEY` | 2 | `src/lib/ai/providers/openrouter.adapter.ts`, `src/tests/phase24-ai-orchestrator.ts` | API key for OpenRouter multi-model gateway | Optional | Provider Adapter | REDACTED / NOT INSPECTED |
| 43 | `PORT` | 4 | `server.ts`, `Dockerfile`, `scripts/google-oauth-setup.ts`, Runtime env | Application HTTP listening port (defaults to 3000, 8080 in Cloud Run) | Yes | Server Standard | REDACTED / NOT INSPECTED |
| 44 | `SESSION_SECRET` | 3 | `src/lib/services/auth.service.ts`, `src/tests/phase11a-verification.ts` | Secret key for signing session tokens and user state cookies | Yes | Canonical Auth | REDACTED / NOT INSPECTED |
| 45 | `SKIP_DRIVE_SYNC` | 3 | `src/lib/services/google-drive.service.ts`, `src/tests/phase7-oauth-verification.ts` | Bypasses live Google Drive binary uploads, storing files in memory | Optional | Test / Fallback | REDACTED / NOT INSPECTED |
| 46 | `SKIP_SHEETS_SYNC` | 5 | `src/lib/google-sheets/client.ts`, `src/tests/phase6-verification.ts` | Bypasses live Google Sheets API requests, operating purely in memory | Optional | Test / Fallback | REDACTED / NOT INSPECTED |
| 47 | `SPREADSHEET_ID` | 3 | `src/lib/google-sheets/client.ts`, `src/tests/live-production-verification.ts` | Legacy alias for `GOOGLE_SHEETS_ID` | No | Legacy Alias | REDACTED / NOT INSPECTED |
| 48 | `TEST_ANALYTICS_SPREADSHEET_ID` | 6 | `src/lib/google-sheets/client.ts`, `src/lib/repositories/analytics.repository.ts` | Test sheet isolation ID for analytics | No | Test Isolation Gate | REDACTED / NOT INSPECTED |
| 49 | `TEST_ENFORCE_RATE_LIMIT` | 1 | `src/lib/google-sheets/client.ts` | Test harness flag to test Google Sheets API rate-limiting logic | No | Test-Only Harness | REDACTED / NOT INSPECTED |
| 50 | `TEST_GOOGLE_SHEETS_ID` | 3 | `src/lib/google-sheets/client.ts`, `src/lib/repositories/base.repository.ts` | Test sheet isolation ID for core operational tables | No | Test Isolation Gate | REDACTED / NOT INSPECTED |
| 51 | `XAI_API_KEY` | 1 | `src/lib/ai/providers/xai.client.ts` | API key for xAI Grok provider | Optional | Provider Adapter | REDACTED / NOT INSPECTED |

---

## 3. Configuration Security Posture

1. **Clean Version Control:** The `.gitignore` file strictly excludes `.env*` (while allowing `.env.example`). No `.env` or secret file was found committed to the repository root or subdirectories.
2. **Environment Example Completeness:** `.env.example` documents all 27 primary variables required for production operations and test safety gates.
3. **Legacy Redundancy Identification:**
   - `GOOGLE_DRIVE_REFRESH_TOKEN` vs `GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN`: The codebase previously had ambiguity documented in `AUTHENTICATION-REFRESH-TOKEN-FORENSIC-AUDIT.md`. The canonical variable is `GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN`.
   - `SPREADSHEET_ID` and `GOOGLE_SPREADSHEET_ID`: Found in older test suites; the canonical production variable is `GOOGLE_SHEETS_ID`.
