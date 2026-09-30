# Baseline Observations

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 01 — Repository & Environment Baseline  
**Audit Date:** 2026-09-28  
**Audit Mode:** Read-Only Forensic Inventory  

---

## 1. Baseline Observations & Factual Notes

In accordance with Step 01 auditing principles, this section records purely factual observations discovered during the forensic inventory. These observations identify structural patterns, historical remnants, and potential redundancies for investigation in subsequent audit steps (Steps 02–14). No removals, refactoring, or redesigns are proposed or executed in this step.

---

### A. Root Directory Documentation Density
- **Observation:** Exactly 22 markdown (`.md`) files reside in the root workspace directory (`/app/applet`), totaling over 600 KB of text documentation.
- **Context:** These files represent sequential milestone reports from earlier development stages (Stage 1 through Stage 13, Stage 8, Stage 9, Stage 10, Auth audit, and Data deletion manifest). Prior to Step 01, no dedicated `docs/` directory existed.
- **Classification:** Factual repository organization characteristic — to be analyzed in Step 13 (Legacy Code & Architecture).

---

### B. Package Management & Lockfile Tooling Divergence
- **Observation:** The repository root contains `bun.lock` (86,858 bytes), but does not contain `package-lock.json`. Conversely, `/Dockerfile` specifies `npm ci` and `npm ci --omit=dev`, while npm scripts invoke `tsx` via Node.
- **Context:** Bun was utilized during rapid phase development to resolve dependencies, while production containerization is standard Node/Alpine.
- **Classification:** Operational divergence — requires verification in Step 14 (Deployment & Runtime Readiness).

---

### C. Root Test Runner Scripts
- **Observation:** Three standalone test runners exist directly at the project root:
  - `run-stage8-runner.ts`
  - `run-phase9-runner.ts`
  - `run-phase10-runner.ts`
- **Context:** These runners orchestrate batch execution of specific test sets. They coexist alongside 32 `run-*.ts` runners inside `src/tests/` and the 28 `npm run test:phase*` scripts defined in `package.json`.
- **Classification:** Potential runner redundancy — requires later architectural review.

---

### D. Committed Static Analysis JSON Artifacts
- **Observation:** Two large JSON files reside in the project root:
  - `repo-inventory.json` (46,224 bytes)
  - `full-repo-inventory.json` (67,339 bytes)
- **Context:** Inspection indicates these are generated static analysis outputs from a prior repository convergence audit (assessing repository export callers and service dependencies).
- **Classification:** Generated analysis snapshot committed to repository — to be audited in Step 13.

---

### E. Environment Variable Naming Variations
- **Observation:** Across 636 audited files, several environment variables appear in canonical forms alongside legacy variants:
  - `GOOGLE_DRIVE_OAUTH_REFRESH_TOKEN` (canonical production) vs `GOOGLE_DRIVE_REFRESH_TOKEN` (legacy variant referenced in `phase7-oauth-verification.ts`).
  - `GOOGLE_SHEETS_ID` (canonical database) vs `GOOGLE_SPREADSHEET_ID` (referenced in older Phase 13 tests) and `SPREADSHEET_ID` (referenced in `client.ts` fallback logic and `test-isolation-safety-gate.test.ts`).
- **Context:** Documented in `AUTHENTICATION-REFRESH-TOKEN-FORENSIC-AUDIT.md`.
- **Classification:** Factual variable naming overlap — requires data layer validation in Step 05.

---

### F. Phase-Prefixed Domain Files
- **Observation:** Several source files and services retain phase-prefixed naming conventions:
  - `src/lib/services/phase14-drive.service.ts`
  - `src/lib/services/phase13-*.service.ts` (e.g. `phase13-package-builder.service.ts`, `phase13-publishing-orchestrator.service.ts`, etc.)
  - `src/types/phase24-ai.ts`, `src/types/phase25-consensus.ts`, `src/types/phase26-copilot.ts`
- **Context:** As new features were introduced in phases (e.g. Phase 13 Publishing, Phase 14 Media, Phase 24 AI), modular services were named to reflect those phase deliverables.
- **Classification:** Evolutionary naming artifact — to be examined in Step 04 (Backend Services) and Step 13 (Convergence).

---

### G. Test Suite Volume & Phase Traceability
- **Observation:** The test directory (`src/tests/`) contains 249 files, comprising 39.6% of the entire file inventory.
- **Context:** Tests are tightly organized by chronological development phase (`phase03` through `phase32`), specific task numbers (`task2` through `task9`), and targeted regression gates (`stage01`, `stage02`, `qs18b`, `qs21b`).
- **Classification:** Active regression safety net — will receive a dedicated audit in Step 12 (Test Suite Coverage).

---

### H. Multi-Model AI Provider Redundancy
- **Observation:** The AI subsystem (`src/lib/ai/providers/`) contains adaptors for 8 distinct AI providers:
  - Gemini (`gemini.adapter.ts` — primary)
  - Groq (`groq.adapter.ts`)
  - Mistral (`mistral.adapter.ts`)
  - Anthropic (`anthropic.adapter.ts`)
  - OpenRouter (`openrouter.adapter.ts`)
  - Cohere (`cohere.adapter.ts`)
  - Hugging Face (`huggingface.adapter.ts`)
  - Experimental Labs (`experimental-labs.adapter.ts`)
- **Context:** Built to guarantee zero-outage fallback during AI generation of competitive exam questions and teleprompter scripts.
- **Classification:** Architectural resiliency pattern — to be investigated in Step 09 (AI Orchestration).

---

### I. Data Isolation & Pre-Production Hygiene
- **Observation:** In `FINAL-TEST-DATA-DELETION-MANIFEST.md` (dated 2026-09-26), authoritative row counts for all 21 transactional Google Sheets worksheets are confirmed at exactly 0 rows, while core reference taxonomy (Categories, Topics, Subtopics), administrative users (`USERS`), and ID counters (`SEQUENCES`) remain fully populated and protected.
- **Context:** The system was systematically purged of test artifacts before this baseline audit.
- **Classification:** Confirmed operational baseline state — safe for non-mutating development and analysis.
