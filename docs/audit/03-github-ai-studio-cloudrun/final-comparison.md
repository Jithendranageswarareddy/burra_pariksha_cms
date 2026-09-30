# Final Comparison & Provenance Verdict

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 03 — GitHub ↔ Google AI Studio ↔ Cloud Run Provenance  
**Audit Date:** 2026-09-28  
**Audit Mode:** Read-Only Forensic Analysis  

---

## 1. Definitive Answers to Core Provenance Questions

### QUESTION 1: Is GitHub the same code as Google AI Studio?
**ANSWER:** **NO (PARTIALLY DIVERGED)**  
**EVIDENCE:** As documented in `13-github-local-reconciliation-report.md` and verified in Step 02, local AI Studio HEAD `d6bea6cd525c` and remote GitHub HEAD `b2e9f2f7` diverged from common ancestor `dac93d9`. Six repository/service files contain local modifications not yet merged into remote, 3 legacy files were deleted locally, and 42 files exist locally in an uncommitted/untracked state.

---

### QUESTION 2: Which repository and branch represents the implementation?
**ANSWER:**  
- **Repository:** `Jithendranageswarareddy/burra_pariksha_cms`  
- **Branch:** `main`  
**EVIDENCE:** Unanimously documented across `10-production-readiness.md` (Line 6), `09-production-hardening.md` (Line 4), and `README.md`.

---

### QUESTION 3: Which files exist in AI Studio but not GitHub?
**ANSWER:** Exactly 42 local files, comprising:
- 12 Step 01 forensic audit docs under `docs/audit/01-baseline/`
- 18 Step 02 forensic audit docs under `docs/audit/02-file-forensics/`
- 15 Step 03 forensic audit docs under `docs/audit/03-github-ai-studio-cloudrun/`
- Root audit documents: `11-repository-convergence-implementation.md`, `12-data-ownership-implementation.md`, `11-legacy-removal-implementation.md`, `09-production-hardening.md`, `10-production-readiness.md`, `FINAL-TEST-DATA-DELETION-MANIFEST.md`, `repo-inventory.json`, `full-repo-inventory.json`.

---

### QUESTION 4: Which files exist in GitHub but not AI Studio?
**ANSWER:** Exactly 3 legacy files deleted in AI Studio during Stage 7 Phase 8 cleanup:
1. `src/pages/Phase23ProductionDashboardPage.tsx`
2. `src/components/dashboard/BottleneckSection.tsx`
3. `src/components/dashboard/PublishingReadinessSection.tsx`

---

### QUESTION 5: Which files differ in content?
**ANSWER:** Exactly 6 core persistence and domain service files:
1. `src/lib/repositories/publishing.repository.ts`
2. `src/lib/repositories/social-reviews.repository.ts`
3. `src/lib/repositories/phase20-social-reviews.repository.ts`
4. `src/lib/repositories/phase22-publishing.repository.ts`
5. `src/lib/services/phase20-social-review.service.ts`
6. `src/lib/services/publishing.service.ts`

---

### QUESTION 6: What code is actually deployed to Cloud Run?
**ANSWER:**  
- **Service Name:** `ais-dev-fjjdmukiysol435fsvlcau`  
- **Revision Name:** `ais-dev-fjjdmukiysol435fsvlcau-00001-s2w`  
- **Runtime:** Node.js 22 container running Express + Vite middleware from `/app/applet`  
- **Serving Traffic:** 100% of live traffic directed to this revision  
- **EVIDENCE:** Confirmed via container environment variables `K_SERVICE` and `K_REVISION`.

---

### QUESTION 7: What commit/version is deployed?
**ANSWER:**  
- **Commit:** The deployed code reflects local HEAD `d6bea6cd525c` plus in-memory/working-tree modifications of Stage 7–10 and the pre-production data purge of 2026-09-26.  
- **CONFIDENCE:** **HIGH**

---

### QUESTION 8: What is the deployment mechanism?
**ANSWER:** Continuous containerized mounting in Google AI Studio Cloud Run development runtime. For production, `Dockerfile` defines a multi-stage Node 20 build.  
**EVIDENCE:** Confirmed via `server.ts` dev server execution and container environment inspection.

---

### QUESTION 9: Are manual modifications evident?
**ANSWER:** **CONFIRMED**  
**EVIDENCE:** Changes have been made directly in the AI Studio container without immediate automated git push to GitHub remote, resulting in the documented commit history divergence.

---

### QUESTION 10: Are generated files involved?
**ANSWER:** **YES**  
**EVIDENCE:** Local static analysis dumps (`repo-inventory.json`, `full-repo-inventory.json`), dependency lockfile (`bun.lock`), and audit records reside in the repository workspace.

---

### QUESTION 11: Are environment/configurations different?
**ANSWER:** **SAME ESSENTIAL CONFIGURATION / EXPECTED RUNTIME SPLIT**  
**DETAILS:** Canonical variable names (`GOOGLE_SHEETS_ID`, `GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN`, `GEMINI_API_KEY`, `GCS_SNAPSHOT_BUCKET`) match across all environments. `DISABLE_HMR=true` and `NODE_OPTIONS=--max-old-space-size=3072` are localized AI Studio performance optimizations.

---

### QUESTION 12: Can the provenance chain be trusted?
**ANSWER:** **MEDIUM CONFIDENCE (REQUIRES GIT RECONCILIATION PRIOR TO FINAL RELEASE)**  
**EVIDENCE:** The codebase is architecturally sound and compiles cleanly, but before releasing to production or pushing to GitHub `main`, a human git rebase/merge between local `d6bea6c` and remote `b2e9f2f` / `64c70c3` must be executed to reconcile the parallel Stage 7 commits.
