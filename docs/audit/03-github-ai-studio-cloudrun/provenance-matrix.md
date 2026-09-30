# Version & Provenance Consistency Matrix

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 03 — GitHub ↔ Google AI Studio ↔ Cloud Run Provenance  
**Audit Date:** 2026-09-28  
**Audit Mode:** Read-Only Forensic Analysis  

---

## Provenance Consistency Matrix

| Item / Subsystem | GitHub (`main`) | Google AI Studio | Cloud Run Dev Revision | Match? | Forensic Evidence |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **Repository Name** | `burra_pariksha_cms` | `burra_pariksha_cms` | `burra_pariksha_cms` | **YES** | `package.json`, `10-production-readiness.md` |
| **Branch** | `main` | Untracked (`d6bea6c` base) | Container image | **DIVERGED** | Local HEAD `d6bea6c` vs Remote HEAD `b2e9f2f` / `64c70c3` |
| **Latest Commit SHA** | `64c70c324b4b` / `d510ef516c` | `d6bea6cd525c` + uncommitted | In-container snapshot | **DIVERGED** | Documented commit history divergence |
| **package.json** | `burra-pariksha-cms` v0.0.0 | `burra-pariksha-cms` v0.0.0 | Identical in container | **YES** | `package.json` identical |
| **Lockfile** | `bun.lock` | `bun.lock` | `bun.lock` present | **YES** | Bun lockfile present across envs |
| **Frontend Framework** | React 19 + Tailwind v4 | React 19 + Tailwind v4 | Served via Vite middleware | **YES** | `src/App.tsx`, `vite.config.ts` |
| **Backend Framework** | Express 4.21.2 | Express 4.21.2 | Express listening on 3000 | **YES** | `server.ts` |
| **15-Step Workflow** | Canonical Conveyor | Canonical Conveyor | Managed by `workflowService` | **YES** | `src/lib/workflow/`, `video.service.ts` |
| **AI Gemini Service** | `@google/genai` v2.4.0 | `@google/genai` v2.4.0 | Server-side execution | **YES** | `src/lib/ai/gemini.client.ts` |
| **Google Sheets DB** | `GOOGLE_SHEETS_ID` | `GOOGLE_SHEETS_ID` | 21 worksheets purged (0 rows)| **YES** | `FINAL-TEST-DATA-DELETION-MANIFEST.md` |
| **Google Drive Media** | `GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN`| `GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN`| OAuth 2.0 user token | **YES** | `AUTHENTICATION-REFRESH-TOKEN-FORENSIC-AUDIT.md` |
| **Dockerfile** | Node 20 Alpine multi-stage | Node 20 Alpine multi-stage | Builder + Runner spec | **YES** | `/Dockerfile` |
| **Generated Output** | Excluded (`.gitignore`) | Excluded (`.gitignore`) | Bundled in prod runner | **YES** | `dist/` not tracked |
