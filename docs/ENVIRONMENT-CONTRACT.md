# BURRA PARIKSHA CMS (BP-CMS) — AUTHORITATIVE ENVIRONMENT CONTRACT

This document defines the single source of truth for all environment variables, runtime configurations, and secrets in the Burra Pariksha CMS application.

---

## EXECUTIVE SUMMARY: THE CANONICAL 8 PRODUCTION SECRETS

When the repository is pulled into **Google AI Studio**, Google AI Studio must request **EXACTLY** the following 8 variables in its Secrets panel:

| # | Secret / Config Name | Secret? | Required? | Purpose |
| :-: | :--- | :---: | :---: | :--- |
| 1 | `SESSION_SECRET` | **YES** | **YES** | HMAC-SHA256 signature key for `bp_session` cookies |
| 2 | `GOOGLE_SERVICE_ACCOUNT_EMAIL` | **NO** | **YES**\* | GCP Service Account email for privileged Firebase Admin SDK |
| 3 | `GOOGLE_PRIVATE_KEY` | **YES** | **YES**\* | GCP Service Account RSA Private Key (PEM format) |
| 4 | `GEMINI_API_KEY` | **YES** | **YES** | Google Gemini API key for AI Question Studio & verification |
| 5 | `GOOGLE_DRIVE_ROOT_FOLDER_ID` | **NO** | **YES** | Root folder ID in Google Drive for video takes & thumbnails |
| 6 | `GOOGLE_CLIENT_ID` | **NO** | **YES** | Google OAuth 2.0 Client ID for Drive media upload delegation |
| 7 | `GOOGLE_CLIENT_SECRET` | **YES** | **YES** | Google OAuth 2.0 Client Secret for Drive media delegation |
| 8 | `GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN` | **YES** | **YES** | Persistent Google OAuth 2.0 refresh token for Drive uploads |

*\*Note: In a deployed Google Cloud environment with an attached runtime service identity (IAM Service Account), Application Default Credentials (ADC) will resolve automatically if explicit credentials are omitted.*

---

## SECTION 1 — RUNTIME REQUIRED VARIABLES

These variables are required for core application startup and authenticated user operations.

| Variable Name | Secret? | Required/Optional | Purpose | Runtime Scope | AI Studio Request |
| :--- | :---: | :---: | :--- | :--- | :---: |
| `SESSION_SECRET` | **YES** | **REQUIRED** *(in production)* | Signs and validates HMAC-SHA256 user authentication tokens in `bp_session` cookies. | Server-side (`src/lib/services/auth.service.ts`) | **YES** |
| `NODE_ENV` | **NO** | **OPTIONAL** | Declares execution environment mode (`production` or `development`). Defaults to `production` in container. | Server & Vite (`server.ts`) | **NO** *(built-in)* |
| `PORT` | **NO** | **OPTIONAL** | Port on which the Express HTTP server listens. Defaults to `3000`. | Server (`server.ts`) | **NO** *(built-in)* |
| `HOST` | **NO** | **OPTIONAL** | Network interface binding. Defaults to `0.0.0.0`. | Server (`server.ts`) | **NO** *(built-in)* |

---

## SECTION 2 — FIREBASE / FIRESTORE VARIABLES

The backend communicates with Cloud Firestore via the **server-privileged Firebase Admin SDK**. Browser clients NEVER connect directly to Firestore.

| Variable Name | Secret? | Required/Optional | Purpose | Runtime Scope | AI Studio Request |
| :--- | :---: | :---: | :--- | :--- | :---: |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | **NO** | **REQUIRED** *(local/non-ADC)* | Email address of the GCP IAM Service Account used by Firebase Admin SDK `cert()`. | Server (`src/lib/firebase/admin.ts`) | **YES** |
| `GOOGLE_PRIVATE_KEY` | **YES** | **REQUIRED** *(local/non-ADC)* | RSA Private Key (PEM format) of the Service Account for Firebase Admin SDK `cert()`. | Server (`src/lib/firebase/admin.ts`) | **YES** |
| `GCP_PROJECT_ID` | **NO** | **OPTIONAL** | GCP project ID override. Defaults to committed `firebase-applet-config.json` (`burra-pariksha-cms`). | Server (`src/lib/firebase/admin.ts`) | **NO** *(has default)* |
| `GOOGLE_CLOUD_PROJECT` | **NO** | **OPTIONAL** | Alternative standard GCP project variable name. | Server (`src/lib/firebase/admin.ts`) | **NO** *(has default)* |
| `FIRESTORE_DATABASE_ID` | **NO** | **OPTIONAL** | Target named Firestore database ID. Defaults to committed configuration (`ai-studio-burraparikshacon-f592ca42-39af-4d83-aff2-6870ba939b0e`). | Server (`src/lib/firebase/admin.ts`) | **NO** *(has default)* |

> **Note on Firebase Web API Keys**: The client Web API key (`AIzaSy...`) in `firebase-applet-config.json` is legacy client metadata. The server-side Firebase Admin SDK uses service account credentials / ADC and does not require a Web API key.

---

## SECTION 3 — ARTIFICIAL INTELLIGENCE VARIABLES

| Variable Name | Secret? | Required/Optional | Purpose | Runtime Scope | AI Studio Request |
| :--- | :---: | :---: | :--- | :--- | :---: |
| `GEMINI_API_KEY` | **YES** | **REQUIRED** *(for AI)* | Authorizes `@google/genai` calls for Question Studio ideation, Telugu scripting, teleprompter generation, and multi-layer verification. | Server (`src/lib/ai/gemini.client.ts`) | **YES** |
| `GEMINI_MODEL` | **NO** | **OPTIONAL** | Model identifier. Defaults to `gemini-3.1-flash-lite`. | Server (`src/lib/ai/config.ts`) | **NO** *(has default)* |
| `AI_DEFAULT_PROVIDER` | **NO** | **OPTIONAL** | Selects primary AI provider. Defaults to `gemini`. | Server (`src/lib/ai/config.ts`) | **NO** *(has default)* |
| `AI_FALLBACK_PROVIDERS`| **NO** | **OPTIONAL** | Comma-delimited list of fallback AI providers. Defaults to empty. | Server (`src/lib/ai/config.ts`) | **NO** *(has default)* |

---

## SECTION 4 — GOOGLE DRIVE VARIABLES (MEDIA & TAKES)

Google Drive stores video takes, master cuts, teleprompter scripts, and thumbnail binaries.

| Variable Name | Secret? | Required/Optional | Purpose | Runtime Scope | AI Studio Request |
| :--- | :---: | :---: | :--- | :--- | :---: |
| `GOOGLE_DRIVE_ROOT_FOLDER_ID` | **NO** | **REQUIRED** | Google Drive folder ID where media assets and video files are created and stored. | Server (`src/lib/services/google-drive.service.ts`) | **YES** |
| `GOOGLE_CLIENT_ID` | **NO** | **REQUIRED** *(OAuth)* | Google OAuth 2.0 Client ID for Drive user delegation mode. | Server (`src/lib/services/google-drive.service.ts`) | **YES** |
| `GOOGLE_CLIENT_SECRET` | **YES** | **REQUIRED** *(OAuth)* | Google OAuth 2.0 Client Secret for Drive delegation mode. | Server (`src/lib/services/google-drive.service.ts`) | **YES** |
| `GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN` | **YES** | **REQUIRED** *(OAuth)* | Long-lived Google OAuth 2.0 refresh token for headless Drive operations. | Server (`src/lib/services/google-drive.service.ts`) | **YES** |
| `GOOGLE_REDIRECT_URI` | **NO** | **OPTIONAL** | Registered OAuth redirect URL. Defaults to `http://localhost:3000/api/auth/google/callback`. | Server (`src/server/routes.ts`) | **NO** *(has default)* |
| `MAX_THUMBNAIL_SIZE_BYTES` | **NO** | **OPTIONAL** | Maximum thumbnail file upload size. Defaults to 5 MB (`5242880`). | Server (`src/lib/services/drive-sync.service.ts`) | **NO** *(has default)* |
| `MAX_VIDEO_SIZE_BYTES` | **NO** | **OPTIONAL** | Maximum video file upload size. Defaults to 100 MB (`104857600`). | Server (`src/lib/services/drive-sync.service.ts`) | **NO** *(has default)* |

---

## SECTION 5 — OPTIONAL CONFIGURATION

These variables have sensible defaults and should NOT be prompted for during normal deployment:

| Variable Name | Secret? | Default Value | Purpose | AI Studio Request |
| :--- | :---: | :--- | :--- | :---: |
| `LOG_LEVEL` | **NO** | `INFO` | Structured logging verbosity (`DEBUG`, `INFO`, `WARN`, `ERROR`). | **NO** |
| `DISABLE_HMR` | **NO** | `false` | Vite Hot Module Replacement toggle for local UI development. | **NO** |
| `SKIP_DRIVE_SYNC` | **NO** | `false` | Offline developer toggle to mock Google Drive calls. | **NO** |
| `SKIP_SHEETS_SYNC` | **NO** | `false` | Offline developer toggle to bypass Google Sheets sync. | **NO** |
| `ANALYTICS_SPREADSHEET_ID` | **NO** | `undefined` | Optional isolated Google Sheet for audience retention telemetry. | **NO** |
| `GCS_SNAPSHOT_BUCKET` | **NO** | `""` | Optional Google Cloud Storage bucket for snapshot backup archives. | **NO** |
| `GCS_SNAPSHOT_ENABLED` | **NO** | `false` | Toggle for GCS snapshot archiving. | **NO** |
| `GCS_SNAPSHOT_RETENTION_DAYS` | **NO** | `365` | Retention duration for snapshot archives. | **NO** |
| `GCS_SNAPSHOT_SCHEDULE_ENABLED`| **NO** | `false` | Toggle for periodic automated backup scheduler. | **NO** |

---

## SECTION 6 — TEST-ONLY VARIABLES

These variables are isolated strictly to automated test suites (`tests/`) and verification scripts. They have built-in fixture fallbacks and MUST NOT be requested by Google AI Studio:

| Variable Name | Purpose | Fallback Behavior |
| :--- | :--- | :--- |
| `S2_T05_CREATOR_EMAIL` | Golden Path test creator account | Defaults to internal fixture `s2_t05_creator@burrapariksha.local` |
| `S2_T05_CREATOR_PASSWORD` | Golden Path test creator password | Defaults to internal fixture `password123` |
| `S2_T05_REVIEWER_EMAIL` | Golden Path test reviewer account | Defaults to internal fixture `s2_t05_reviewer@burrapariksha.local` |
| `S2_T05_REVIEWER_PASSWORD` | Golden Path test reviewer password | Defaults to internal fixture `password123` |
| `BASE_URL` | Integration test target base URL | Defaults to `http://localhost:3000` |
| `CHROME_PATH` | Puppeteer browser test executable | Defaults to system Chrome path |
| `PERSISTENCE_MODE` | In-memory repository override | Defaults to live `FIRESTORE` mode |
| `TEST_AUTH_TOKEN` / `ADMIN_TOKEN` | Diagnostic multitake script auth | Defaults to script CLI credentials |

---

## SECTION 7 — LEGACY / UNUSED VARIABLES

These variables belonged to previous architectures or tooling and are NOT required by the current live runtime:

| Variable Name | Historical Context | Current Status |
| :--- | :--- | :--- |
| `GOOGLE_SHEETS_ID` | Primary database during Phase 2 (replaced by Cloud Firestore in Sprint 4). | Retained only for optional legacy double-write sync; not required for CMS. |
| `BOOTSTRAP_SECRET` | Token for legacy `/api/sheets/initialize` endpoint. | Not used for Firestore or standard CMS operations. |
| `INITIAL_ADMIN_PASSWORD` | Seed password for initial user creation during manual reset. | Built-in fallback `password123` is used if omitted. |
| `FIREBASE_TOKEN` | Firebase CLI deployment token. | CI/CD deploy token only; never used in application runtime code. |
| Third-Party AI Keys (`GROQ_API_KEY`, etc.) | Experimental multi-provider fallback adapters. | Fully optional; system defaults directly to `GEMINI_API_KEY`. |

---

## SECTION 8 — LOCAL DEVELOPMENT SETUP

1. Clone repository:
   ```bash
   git clone https://github.com/Jithendranageswarareddy/burra_pariksha_cms.git
   cd burra_pariksha_cms
   npm install
   ```
2. Create local configuration file from template:
   ```bash
   cp .env.local.example .env.local
   ```
3. Populate `.env.local` with your development credentials (the 8 canonical variables).
4. Run environment status check:
   ```bash
   npm run env:check
   ```
5. Start local server:
   ```bash
   npm run dev
   ```

`.env.local` is gitignored and will never be tracked or committed to GitHub.

---

## SECTION 9 — GOOGLE AI STUDIO SETUP

1. Import the repository in Google AI Studio.
2. In the **Secrets** panel, configure the 8 canonical production secrets:
   - `SESSION_SECRET`
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_PRIVATE_KEY`
   - `GEMINI_API_KEY`
   - `GOOGLE_DRIVE_ROOT_FOLDER_ID`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN`
3. Launch the Applet. The backend initializes Firebase Admin SDK, connects to Cloud Firestore, verifies session signing, and mounts the API seamlessly.
