# Generated Files Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 03 — GitHub ↔ Google AI Studio ↔ Cloud Run Provenance  
**Audit Date:** 2026-09-28  
**Audit Mode:** Read-Only Forensic Analysis  

---

## 1. Inventory of Generated Artifacts in Codebase

| Path | Generator / Source | Size | Tracked in Git? | Runtime Required? | Description |
| :--- | :--- | :---: | :---: | :---: | :--- |
| `repo-inventory.json` | Static AST analysis script | 46.2 KB | Untracked / Local | NO | Analysis of repository export callers and dependencies |
| `full-repo-inventory.json` | Static AST analysis script | 67.3 KB | Untracked / Local | NO | Comprehensive dump of repository classes, services, and tests |
| `bun.lock` | Bun package manager | 86.9 KB | Committed | NO (dev only) | Dependency resolution lockfile |
| `dist/` | Vite + esbuild (`npm run build`) | Dynamic | Excluded by `.gitignore` | YES (Production runner only) | Client SPA bundle and compiled `dist/server.cjs` |
| `docs/audit/01-baseline/*` | Step 01 Forensic Audit | ~130 KB | Local audit artifact | NO | Baseline audit ledgers |
| `docs/audit/02-file-forensics/*`| Step 02 Forensic Audit | ~950 KB | Local audit artifact | NO | File-by-file forensic dossiers |
| `docs/audit/03-github-ai-studio-cloudrun/*` | Step 03 Forensic Audit | ~120 KB | Local audit artifact | NO | Provenance and deployment ledgers |

---

## 2. Assessment of Build Artifact Hygiene

- **No Committed Build Directories:** `dist/`, `build/`, and `node_modules/` are properly excluded by `.gitignore`.
- **Static Analysis Dumps:** `repo-inventory.json` and `full-repo-inventory.json` are present in the working tree. As documented in `13-github-local-reconciliation-report.md` (Section 25), these are local temporary artifacts and must not be committed to GitHub.
