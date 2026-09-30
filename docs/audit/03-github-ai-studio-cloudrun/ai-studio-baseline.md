# Google AI Studio Baseline

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 03 — GitHub ↔ Google AI Studio ↔ Cloud Run Provenance  
**Audit Date:** 2026-09-28  
**Audit Mode:** Read-Only Forensic Analysis  

---

## 1. Google AI Studio Workspace Identity

- **Workspace Working Directory:** `/app/applet`
- **Applet ID:** `f592ca42-39af-4d83-aff2-6870ba939b0e`
- **Applet Name:** `Burra Pariksha CMS` (configured in `metadata.json`)
- **Applet Directory Environment Variable:** `APPLET_DIR=applet`, `APP_DIR=/app/applet`
- **Active Node.js Version:** `v22.23.2`
- **Heap Allocation:** `NODE_OPTIONS=--max-old-space-size=3072` (3GB V8 limit)

---

## 2. AI Studio Git Metadata Status

```
GOOGLE AI STUDIO GIT METADATA: NOT_AVAILABLE
```

The active development container does not mount a `.git` directory. Version control metadata within AI Studio is ephemeral, with changes written directly to the container filesystem.

---

## 3. Working Tree Status & Local Commit Baseline

As established in `13-github-local-reconciliation-report.md`:
- **Documented Local HEAD:** `d6bea6cd525c0ec50c9f785357cfd4953e6943f2` (`refactor: converge services onto canonical service architecture`)
- **Working Tree State:** `MODIFIED`
- **Inventory in AI Studio:** 636 audited files (excluding `node_modules` and `docs/`)
- **Local Uncommitted Layers:**
  1. Stage 7 Phase 6 Repository Convergence (modified 6 repositories/services).
  2. Stage 7 Phase 7 Data Ownership (`src/lib/ownership/data-ownership.ts`).
  3. Stage 7 Phase 8 Legacy Deletions (deleted 3 dead files: `Phase23ProductionDashboardPage.tsx`, `BottleneckSection.tsx`, `PublishingReadinessSection.tsx`).
  4. Stage 8 Continuous Workflow Verification & Hardening (`08-production-workflow-verification.md`).
  5. Stage 9 Concurrency & Request Pressure Hardening (`BaseRepository.withRecordLock()`, `GoogleSheetsClient.RequestPressureLimiter`).
  6. Stage 10 Final Production Readiness Ledger (`10-production-readiness.md`).
  7. Pre-Production Test Data Deletion Manifest (`FINAL-TEST-DATA-DELETION-MANIFEST.md` on 2026-09-26).
  8. Step 01 & Step 02 Forensic Audit Ledgers under `docs/audit/`.

---

## 4. AI Studio Runtime Architecture

- **Dev Server Process:** `tsx server.ts` (Port 3000)
- **Ingress Proxy:** Nginx / Cloud Run container entry on Port 8080
- **Internal Routing:** Express server mounts `/api` routes and wraps Vite in middleware mode for hot frontend asset delivery.
