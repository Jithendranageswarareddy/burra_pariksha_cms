# Configuration Differences: GitHub ↔ Google AI Studio ↔ Cloud Run

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 03 — GitHub ↔ Google AI Studio ↔ Cloud Run Provenance  
**Audit Date:** 2026-09-28  
**Audit Mode:** Read-Only Forensic Analysis  

---

## 1. Environment & Configuration Comparison Matrix

> **SECURITY NOTE:** No secret values are exposed. Only variable names and configuration keys are compared.

| Configuration Dimension | GitHub Target (`main`) | AI Studio Dev Container | Cloud Run Production Target | Reconciliation Status |
| :--- | :--- | :--- | :--- | :--- |
| **`NODE_ENV`** | `production` / unset | `development` | `production` | SAME (Expected env split) |
| **Port Mapping** | `PORT=3000` (`Dockerfile`) | `PORT=8080`, App on `3000` | `PORT=8080` ingress | SAME (Standard container proxy) |
| **TypeScript Target** | `ES2022` / `ESNext` | `ES2022` / `ESNext` | Compiled to CJS (`dist/server.cjs`) | SAME (esbuild handles CJS) |
| **Vite HMR** | Standard | Disabled via `DISABLE_HMR=true` | N/A (Static files served) | AI_STUDIO_ONLY optimization |
| **Google Drive OAuth Token** | `GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN` | `GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN` | Injected via Secret Manager | SAME (Canonical token confirmed) |
| **Google Sheets Spreadsheet ID** | `GOOGLE_SHEETS_ID` | `GOOGLE_SHEETS_ID` | `GOOGLE_SHEETS_ID` | SAME |
| **Analytics Spreadsheet ID** | `ANALYTICS_SPREADSHEET_ID` | `ANALYTICS_SPREADSHEET_ID` | `ANALYTICS_SPREADSHEET_ID` | SAME |
| **GCS Snapshot Bucket** | `GCS_SNAPSHOT_BUCKET` | `burra-pariksha-snapshots-2026` | Injected via Secret Manager | SAME |
| **AI Gemini Model** | `GEMINI_API_KEY` | `GEMINI_API_KEY` | Injected via Secret Manager | SAME |
| **Service Account Email** | `burra-pariksha-cms@...` | `burra-pariksha-cms@...` | Attached GCP Service Account | SAME |
| **Heap Limit** | Default Node | `--max-old-space-size=3072` | Container memory allocation | AI_STUDIO_ONLY optimization |

---

## 2. Configuration Key Insights

1. **Clean Separation of Environments:** As proven in `AUTHENTICATION-REFRESH-TOKEN-FORENSIC-AUDIT.md`, changes made to settings inside Google AI Studio apply **only** to the development container and do not leak into GitHub or Cloud Run production revisions.
2. **Standardized Runtime Ports:** Cloud Run injects `PORT=8080` into containers. In AI Studio, Nginx / ingress listens on 8080 and forwards to the Express server on 3000. In production, Dockerfile configures `PORT=3000` which Cloud Run maps to ingress.
