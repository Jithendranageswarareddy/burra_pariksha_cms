# Project Baseline Snapshot

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 01 — Repository & Environment Baseline  
**Audit Date:** 2026-09-28  
**Audit Mode:** Read-Only Forensic Audit  

---

## 1. Project Identity & Purpose

- **Name:** Burra Pariksha CMS
- **Package Name:** `burra-pariksha-cms` (from `package.json`)
- **Version:** `0.0.0` (unversioned development manifest)
- **Primary Domain:** Content database, question verification, multi-language AI generation, teleprompter script creation, automated video review, thumbnail generation, publishing pipeline, and social feedback intelligence for Telugu competitive exam YouTube/Instagram content.
- **Runtime Environment:** Google AI Studio Cloud Run development container (`K_SERVICE=ais-dev-fjjdmukiysol435fsvlcau`, Node.js v22.23.2).

---

## 2. Technology Stack Baseline

### A. Frontend
- **Framework:** React 19 (`react` 19.0.1, `react-dom` 19.0.1)
- **Routing:** React Router v7 (`react-router-dom` 7.18.2)
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite` 4.1.14, `tailwindcss` 4.1.14)
- **Animations:** Motion (`motion` 12.23.24)
- **Icons:** Lucide React (`lucide-react` 0.546.0)
- **Build Tool:** Vite 6 (`vite` 6.2.3, `@vitejs/plugin-react` 5.0.4)
- **Typography:** Google Fonts preconnected: `Noto Sans Telugu` (400, 500, 600, 700) and `Outfit` (300, 400, 500, 600, 700, 800)

### B. Backend & Server
- **Server Framework:** Express 4 (`express` 4.21.2)
- **Execution Engine:** `tsx` (`tsx` 4.21.0) for live TypeScript execution, `esbuild` 0.25.0 for production bundling
- **Security Middleware:** `helmet` 8.3.0, `express-rate-limit` 8.7.0
- **Multipart Streaming:** `busboy` 1.6.0
- **Environment:** `dotenv` 17.2.3

### C. Persistent Storage & Integrations
- **Primary Database:** Google Sheets API v4 (via `googleapis` 176.0.0)
- **Media Asset Storage:** Google Drive API v3 (via `googleapis` 176.0.0) with OAuth 2.0 user tokens / fallback service account JWT
- **Durable Snapshot Archive:** Google Cloud Storage (GCS) API (configured via `snapshot.config.ts`)
- **AI Engine:** Google Gen AI SDK (`@google/genai` 2.4.0) with multi-model provider fallbacks (Groq, Mistral, OpenRouter, Anthropic, Hugging Face, xAI)
- **Validation Engine:** Zod 4 (`zod` 4.4.3)

---

## 3. High-Level Inventory Metrics

```
Total Reachable Directories:  42
Total Audited Files:          636

Breakdown by File Category:
├── Source Files:              310  (48.7%)
├── Test Files & Runners:      252  (39.6%)
├── Utility Scripts:            21  (3.3%)
├── Migration Scripts:           1  (0.2%)
├── Documentation Files:        22  (3.5%)
├── Schema Definitions:         13  (2.0%)
├── Type Definitions:            4  (0.6%)
├── Configurations:              4  (0.6%)
├── Deployment Definitions:      2  (0.3%)
├── Generated Analysis:          2  (0.3%)
├── Static Assets:               2  (0.3%)
├── Package Manifests:           1  (0.2%)
├── Lockfiles:                   1  (0.2%)
└── Environment Templates:       1  (0.2%)
                                ───
                                636 Total Files
```

---

## 4. Source Files Technical Area Distribution

The 310 application source files are classified into the following 17 functional areas:

| Technical Area | File Count | Primary Directory Location | Description |
| :--- | :--- | :--- | :--- |
| **SERVICE** | 71 | `src/lib/services/` | Business domain orchestration (questions, videos, scripts, thumbnails, publishing, etc.) |
| **COMPONENT** | 80 | `src/components/` & `src/design-system/` | Reusable React UI components and atomic design system primitives |
| **AI** | 40 | `src/lib/ai/` | Prompt templates, AI client adaptors, generation engines, and verifiers |
| **REPOSITORY** | 39 | `src/lib/repositories/` | Data access layer wrapping Google Sheets worksheets and in-memory caches |
| **PAGE** | 31 | `src/pages/` | Routed full-screen view pages matching application route paths |
| **VALIDATION** | 20 | `src/lib/validation/` & `src/lib/validators/` | Mathematical verification, Telugu orthography checks, and schema validators |
| **MODEL / MOCK-DATA** | 7 | `src/lib/mock-data/` | Initial seed fixtures, taxonomy trees, and fallback question datasets |
| **CONFIGURATION** | 6 | `src/config/` | Topic distributions, style guides, generation configs, and snapshot retention |
| **DATABASE** | 3 | `src/lib/google-sheets/` | Google Sheets client, rate limiting, and error wrappers |
| **API** | 3 | `src/server/` | Express route definitions, streaming endpoints, and auth middleware |
| **FRONTEND** | 2 | `src/` (`App.tsx`, `main.tsx`) | React client entry points and top-level router hierarchy |
| **RBAC** | 2 | `src/lib/ownership/` | Data ownership matrices, user permissions, and operation safety gates |
| **CONTEXT** | 2 | `src/contexts/` | Global React contexts for Authentication and Theme |
| **BACKEND** | 1 | `server.ts` | Express server bootstrap, Vite middleware mounting, and background task schedulers |
| **WORKFLOW** | 1 | `src/lib/workflow/` | Centralized workflow orchestrator and state transition validation |
| **UTILITY** | 1 | `src/utils/` | Formatting, date, and currency utility helpers |
| **OTHER** | 1 | `src/lib/index.ts` | Shared barrel export |

---

## 5. Environment & Infrastructure Baseline

- **Repository Root:** `/app/applet`
- **Hosting Target:** Google Cloud Run (Containerized via Node 20 Alpine multi-stage Dockerfile)
- **Local Git Repository:** Absent in sandbox container (`.git` does not exist)
- **Historical Git Reference:** Local HEAD `d6bea6c`, Remote GitHub HEAD `b2e9f2f7` (documented in `13-github-local-reconciliation-report.md`)
- **Port Bindings:**
  - Node App Server: Port 3000
  - In-Container Cloud Run Port: Port 8080 (`PORT=8080`)
  - AI Studio Control Plane: Port 8000
- **Operational Data Protection Status:** Authoritative row count in operational Google Sheets worksheets is 0 rows (following pre-production cleanup on 2026-09-26 documented in `FINAL-TEST-DATA-DELETION-MANIFEST.md`). Core taxonomy, categories, sequence counters, and admin accounts are strictly preserved.
