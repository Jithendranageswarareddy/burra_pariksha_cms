# File Differences: GitHub ↔ Google AI Studio

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 03 — GitHub ↔ Google AI Studio ↔ Cloud Run Provenance  
**Audit Date:** 2026-09-28  
**Audit Mode:** Read-Only Forensic Analysis  

---

## 1. Summary of Discrepancies

Based on the forensic evidence documented in `13-github-local-reconciliation-report.md` and verified in Steps 01–02:

| Discrepancy Category | File Count | Description |
| :--- | :---: | :--- |
| **IDENTICAL FILES** | 582 | Source files, tests, configs, and scripts aligned across Stage 6/7 baselines |
| **AI STUDIO ONLY (Local Working Tree)** | 42 | Untracked convergence reports, local inventories, and uncommitted Stage 7-10 ledgers |
| **GITHUB ONLY (Remote HEAD)** | 3 | Files deleted locally during Stage 7 Phase 8 legacy cleanup but still on remote `dac93d9` |
| **SAME PATH / DIFFERENT CONTENT** | 6 | Convergence files modified locally on top of `d6bea6c` while committed differently on remote |

---

## 2. File Difference Detail Matrix

| File Path | GitHub Status (`b2e9f2f` / `main`) | AI Studio Status (`/app/applet`) | Cloud Run Evidence | Difference Classification | Confidence |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `src/lib/ownership/data-ownership.ts` | Committed in `f5c7f8b2` | Present (Untracked locally in Stage 7) | Deployed in dev container | SAME CONTENT / DIVERGENT COMMIT | HIGH |
| `src/lib/ownership/index.ts` | Committed in `f5c7f8b2` | Present (Untracked locally in Stage 7) | Deployed in dev container | SAME CONTENT / DIVERGENT COMMIT | HIGH |
| `12-final-verification-report.md` | Committed in `b2e9f2f7` | Present (Untracked locally in Stage 7) | Static Doc | SAME CONTENT / DIVERGENT COMMIT | HIGH |
| `src/lib/repositories/publishing.repository.ts` | Committed prior to Phase 6 | Modified with Phase 22 Store Sync | Deployed in dev container | DIFFERENT_CONTENT | HIGH |
| `src/lib/repositories/social-reviews.repository.ts` | Committed prior to Phase 6 | Modified with Phase 20 Store Sync | Deployed in dev container | DIFFERENT_CONTENT | HIGH |
| `src/lib/repositories/phase20-social-reviews.repository.ts` | Committed prior to Phase 6 | Modified (Delegates to canonical) | Deployed in dev container | DIFFERENT_CONTENT | HIGH |
| `src/lib/repositories/phase22-publishing.repository.ts` | Committed prior to Phase 6 | Modified (Delegates to canonical) | Deployed in dev container | DIFFERENT_CONTENT | HIGH |
| `src/lib/services/phase20-social-review.service.ts` | Committed prior to Phase 6 | Modified (Delegates to canonical) | Deployed in dev container | DIFFERENT_CONTENT | HIGH |
| `src/lib/services/publishing.service.ts` | Committed prior to Phase 6 | Modified (Delegates to canonical) | Deployed in dev container | DIFFERENT_CONTENT | HIGH |
| `src/pages/Phase23ProductionDashboardPage.tsx` | Present on remote | Deleted locally in Stage 7 Phase 8 | Absent in dev container | GITHUB_ONLY | HIGH |
| `src/components/dashboard/BottleneckSection.tsx` | Present on remote | Deleted locally in Stage 7 Phase 8 | Absent in dev container | GITHUB_ONLY | HIGH |
| `src/components/dashboard/PublishingReadinessSection.tsx` | Present on remote | Deleted locally in Stage 7 Phase 8 | Absent in dev container | GITHUB_ONLY | HIGH |
| `11-repository-convergence-implementation.md` | Absent on remote | Present locally (Stage 7 report) | Static Doc | AI_STUDIO_ONLY | HIGH |
| `12-data-ownership-implementation.md` | Absent on remote | Present locally (Stage 7 report) | Static Doc | AI_STUDIO_ONLY | HIGH |
| `11-legacy-removal-implementation.md` | Absent on remote | Present locally (Stage 7 report) | Static Doc | AI_STUDIO_ONLY | HIGH |
| `09-production-hardening.md` | Absent on remote | Present locally (Stage 9 ledger) | Static Doc | AI_STUDIO_ONLY | HIGH |
| `10-production-readiness.md` | Absent on remote | Present locally (Stage 10 ledger) | Static Doc | AI_STUDIO_ONLY | HIGH |
| `FINAL-TEST-DATA-DELETION-MANIFEST.md` | Absent on remote | Present locally (2026-09-26 manifest)| Static Doc | AI_STUDIO_ONLY | HIGH |
| `repo-inventory.json` | Absent on remote | Present locally (Analysis snapshot) | Static Data | AI_STUDIO_ONLY | HIGH |
| `full-repo-inventory.json` | Absent on remote | Present locally (Analysis snapshot) | Static Data | AI_STUDIO_ONLY | HIGH |
| `docs/audit/01-baseline/*` (12 files) | Absent on remote | Present locally (Step 01 audit) | Static Doc | AI_STUDIO_ONLY | HIGH |
| `docs/audit/02-file-forensics/*` (18 files) | Absent on remote | Present locally (Step 02 audit) | Static Doc | AI_STUDIO_ONLY | HIGH |
| `docs/audit/03-github-ai-studio-cloudrun/*` | Absent on remote | Present locally (Step 03 audit) | Static Doc | AI_STUDIO_ONLY | HIGH |
