# File-Level Side Effects Forensic Map

**System:** Burra Pariksha Content Management System (BP-CMS)
**Audit Step:** 02 — Complete File-by-File Forensic Inventory
**Audit Date:** 2026-09-28

## Side-Effect Classification Overview

| Side-Effect Type | File Count | Representative Modules | Operational Safeguards |
| :--- | :---: | :--- | :--- |
| **EXTERNAL MUTATION (Google Sheets)** | 42 | `src/lib/repositories/*`, `src/lib/google-sheets/client.ts` | Rate-limiting queue, exponential backoff, test isolation gate |
| **EXTERNAL MUTATION (Google Drive)** | 6 | `src/lib/services/google-drive.service.ts`, `src/server/drive-routes.ts` | Idempotent hash checks, fallback in-memory buffer storage |
| **EXTERNAL MUTATION (Cloud Storage)** | 3 | `src/lib/services/durable-snapshot-archive.service.ts` | Scheduled retention pruning, admin secret preflight verification |
| **EXTERNAL API CALLS (Gemini / AI)** | 15 | `src/lib/ai/gemini.client.ts`, `src/lib/ai/providers/*` | Multi-provider fallback chain, JSON schema validation enforcement |
| **LOCAL MUTATION (In-Memory State)** | 78 | `src/lib/services/*`, `src/contexts/AuthContext.tsx` | Session tokens, volatile caches, workflow state transitions |
| **READ ONLY (Static / Spec)** | 492 | `src/pages/*`, `src/components/*`, `src/types/*`, `.md` | Pure UI rendering, type definitions, static documentation |
