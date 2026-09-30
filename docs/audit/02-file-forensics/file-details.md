# Detailed File-by-File Forensic Records

**System:** Burra Pariksha Content Management System (BP-CMS)
**Audit Step:** 02 — Complete File-by-File Forensic Inventory
**Audit Date:** 2026-09-28
**Total Files Documented:** 636

## FILE-0001: `.dockerignore`

- **Directory:** `.`
- **Filename:** `.dockerignore` ((none), 42 bytes)
- **Primary Purpose:** Exclusions from Docker container build context
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (0):** None
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0002: `.env.example`

- **Directory:** `.`
- **Filename:** `.env.example` (.example, 699 bytes)
- **Primary Purpose:** Template environment variable reference without secrets
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (0):** None
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: YES (Binary File Operations)
  - Gemini / AI Orchestration: YES (@google/genai SDK)
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0003: `.gitignore`

- **Directory:** `.`
- **Filename:** `.gitignore` ((none), 82 bytes)
- **Primary Purpose:** Git version control file and directory exclusion rules
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (0):** None
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0004: `01-product-truth.md`

- **Directory:** `.`
- **Filename:** `01-product-truth.md` (.md, 74,046 bytes)
- **Primary Purpose:** Root milestone architectural specification or audit document
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Static documentation or data artifact; no active execution risk)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** HISTORICAL (Historical milestone audit document from prior development stages)
- **Exports (0):** None
- **Imports (0):** None
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0005: `02-repository-inventory.md`

- **Directory:** `.`
- **Filename:** `02-repository-inventory.md` (.md, 47,434 bytes)
- **Primary Purpose:** Root milestone architectural specification or audit document
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Static documentation or data artifact; no active execution risk)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** HISTORICAL (Historical milestone audit document from prior development stages)
- **Exports (0):** None
- **Imports (0):** None
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: YES (Binary File Operations)
  - Gemini / AI Orchestration: YES (@google/genai SDK)
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: YES

---

## FILE-0006: `03-routing-navigation-audit.md`

- **Directory:** `.`
- **Filename:** `03-routing-navigation-audit.md` (.md, 66,649 bytes)
- **Primary Purpose:** Root milestone architectural specification or audit document
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Static documentation or data artifact; no active execution risk)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** HISTORICAL (Historical milestone audit document from prior development stages)
- **Exports (0):** None
- **Imports (0):** None
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: YES

---

## FILE-0007: `04-page-workflow-map.md`

- **Directory:** `.`
- **Filename:** `04-page-workflow-map.md` (.md, 75,934 bytes)
- **Primary Purpose:** Root milestone architectural specification or audit document
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Static documentation or data artifact; no active execution risk)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** HISTORICAL (Historical milestone audit document from prior development stages)
- **Exports (0):** None
- **Imports (0):** None
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: YES

---

## FILE-0008: `05-backend-data-map.md`

- **Directory:** `.`
- **Filename:** `05-backend-data-map.md` (.md, 100,220 bytes)
- **Primary Purpose:** Root milestone architectural specification or audit document
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Static documentation or data artifact; no active execution risk)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** HISTORICAL (Historical milestone audit document from prior development stages)
- **Exports (0):** None
- **Imports (0):** None
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: YES (Binary File Operations)
  - Gemini / AI Orchestration: YES (@google/genai SDK)
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0009: `06-canonical-architecture.md`

- **Directory:** `.`
- **Filename:** `06-canonical-architecture.md` (.md, 67,591 bytes)
- **Primary Purpose:** Root milestone architectural specification or audit document
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Static documentation or data artifact; no active execution risk)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** HISTORICAL (Historical milestone audit document from prior development stages)
- **Exports (0):** None
- **Imports (0):** None
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: YES (Binary File Operations)
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: YES

---

## FILE-0010: `07-page-ownership-implementation.md`

- **Directory:** `.`
- **Filename:** `07-page-ownership-implementation.md` (.md, 6,797 bytes)
- **Primary Purpose:** Root milestone architectural specification or audit document
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Static documentation or data artifact; no active execution risk)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** HISTORICAL (Historical milestone audit document from prior development stages)
- **Exports (0):** None
- **Imports (0):** None
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0011: `08-production-workflow-verification.md`

- **Directory:** `.`
- **Filename:** `08-production-workflow-verification.md` (.md, 10,489 bytes)
- **Primary Purpose:** Root milestone architectural specification or audit document
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Static documentation or data artifact; no active execution risk)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** HISTORICAL (Historical milestone audit document from prior development stages)
- **Exports (0):** None
- **Imports (0):** None
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0012: `08-workflow-convergence-implementation.md`

- **Directory:** `.`
- **Filename:** `08-workflow-convergence-implementation.md` (.md, 13,729 bytes)
- **Primary Purpose:** Root milestone architectural specification or audit document
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Static documentation or data artifact; no active execution risk)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** HISTORICAL (Historical milestone audit document from prior development stages)
- **Exports (1):** `CanonicalWorkflowState`
- **Imports (0):** None
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0013: `08A-workflow-convergence-remediation.md`

- **Directory:** `.`
- **Filename:** `08A-workflow-convergence-remediation.md` (.md, 6,080 bytes)
- **Primary Purpose:** Root milestone architectural specification or audit document
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Static documentation or data artifact; no active execution risk)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** HISTORICAL (Historical milestone audit document from prior development stages)
- **Exports (0):** None
- **Imports (0):** None
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0014: `09-api-convergence-implementation.md`

- **Directory:** `.`
- **Filename:** `09-api-convergence-implementation.md` (.md, 9,471 bytes)
- **Primary Purpose:** Root milestone architectural specification or audit document
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Static documentation or data artifact; no active execution risk)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** HISTORICAL (Historical milestone audit document from prior development stages)
- **Exports (0):** None
- **Imports (0):** None
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: YES (Binary File Operations)
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0015: `09-production-hardening.md`

- **Directory:** `.`
- **Filename:** `09-production-hardening.md` (.md, 25,149 bytes)
- **Primary Purpose:** Root milestone architectural specification or audit document
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Static documentation or data artifact; no active execution risk)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** HISTORICAL (Historical milestone audit document from prior development stages)
- **Exports (0):** None
- **Imports (0):** None
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0016: `10-production-readiness.md`

- **Directory:** `.`
- **Filename:** `10-production-readiness.md` (.md, 15,614 bytes)
- **Primary Purpose:** Root milestone architectural specification or audit document
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Static documentation or data artifact; no active execution risk)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** HISTORICAL (Historical milestone verification report from prior development stages)
- **Exports (0):** None
- **Imports (0):** None
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0017: `10-service-convergence-implementation.md`

- **Directory:** `.`
- **Filename:** `10-service-convergence-implementation.md` (.md, 11,969 bytes)
- **Primary Purpose:** Root milestone architectural specification or audit document
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Static documentation or data artifact; no active execution risk)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** HISTORICAL (Historical milestone verification report from prior development stages)
- **Exports (2):** `socialReviewService`, `platformAdaptationService`
- **Imports (0):** None
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: YES (Binary File Operations)
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0018: `11-legacy-removal-implementation.md`

- **Directory:** `.`
- **Filename:** `11-legacy-removal-implementation.md` (.md, 8,192 bytes)
- **Primary Purpose:** Root milestone architectural specification or audit document
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Static documentation or data artifact; no active execution risk)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** HISTORICAL (Historical milestone verification report from prior development stages)
- **Exports (0):** None
- **Imports (0):** None
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0019: `11-repository-convergence-implementation.md`

- **Directory:** `.`
- **Filename:** `11-repository-convergence-implementation.md` (.md, 9,103 bytes)
- **Primary Purpose:** Root milestone architectural specification or audit document
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Static documentation or data artifact; no active execution risk)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** HISTORICAL (Historical milestone verification report from prior development stages)
- **Exports (0):** None
- **Imports (0):** None
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0020: `12-data-ownership-implementation.md`

- **Directory:** `.`
- **Filename:** `12-data-ownership-implementation.md` (.md, 14,200 bytes)
- **Primary Purpose:** Root milestone architectural specification or audit document
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Static documentation or data artifact; no active execution risk)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** HISTORICAL (Historical milestone verification report from prior development stages)
- **Exports (0):** None
- **Imports (0):** None
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0021: `12-final-verification-report.md`

- **Directory:** `.`
- **Filename:** `12-final-verification-report.md` (.md, 10,026 bytes)
- **Primary Purpose:** Root milestone architectural specification or audit document
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Static documentation or data artifact; no active execution risk)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** HISTORICAL (Historical milestone verification report from prior development stages)
- **Exports (0):** None
- **Imports (0):** None
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0022: `13-github-local-reconciliation-report.md`

- **Directory:** `.`
- **Filename:** `13-github-local-reconciliation-report.md` (.md, 11,160 bytes)
- **Primary Purpose:** Root milestone architectural specification or audit document
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Static documentation or data artifact; no active execution risk)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** HISTORICAL (Historical milestone verification report from prior development stages)
- **Exports (0):** None
- **Imports (0):** None
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0023: `AUTHENTICATION-REFRESH-TOKEN-FORENSIC-AUDIT.md`

- **Directory:** `.`
- **Filename:** `AUTHENTICATION-REFRESH-TOKEN-FORENSIC-AUDIT.md` (.md, 12,069 bytes)
- **Primary Purpose:** Root milestone architectural specification or audit document
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Static documentation or data artifact; no active execution risk)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `googleDriveService`
- **Imports (0):** None
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: YES (Binary File Operations)
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0024: `Dockerfile`

- **Directory:** `.`
- **Filename:** `Dockerfile` ((none), 697 bytes)
- **Primary Purpose:** Production multi-stage Node 20 Alpine container specification
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (0):** None
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0025: `FINAL-TEST-DATA-DELETION-MANIFEST.md`

- **Directory:** `.`
- **Filename:** `FINAL-TEST-DATA-DELETION-MANIFEST.md` (.md, 8,191 bytes)
- **Primary Purpose:** Root milestone architectural specification or audit document
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Static documentation or data artifact; no active execution risk)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (0):** None
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0026: `README.md`

- **Directory:** `.`
- **Filename:** `README.md` (.md, 7,546 bytes)
- **Primary Purpose:** Root milestone architectural specification or audit document
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Static documentation or data artifact; no active execution risk)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (0):** None
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: YES (Binary File Operations)
  - Gemini / AI Orchestration: YES (@google/genai SDK)
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0027: `bun.lock`

- **Directory:** `.`
- **Filename:** `bun.lock` (.lock, 86,858 bytes)
- **Primary Purpose:** Bun binary/text dependency resolution lockfile
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (0):** None
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: YES (@google/genai SDK)
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0028: `full-repo-inventory.json`

- **Directory:** `.`
- **Filename:** `full-repo-inventory.json` (.json, 67,339 bytes)
- **Primary Purpose:** Application utility or helper module
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Static documentation or data artifact; no active execution risk)
- **Duplicate Classification:** SAME FUNCTION / DIFFERENT IMPLEMENTATION (Counterpart: `repo-inventory.json`, Reason: Full dump vs subset of static repository analysis)
- **Legacy Classification:** LEGACY CANDIDATE (Pre-computed static analysis artifacts from prior convergence)
- **Exports (0):** None
- **Imports (0):** None
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0029: `index.html`

- **Directory:** `.`
- **Filename:** `index.html` (.html, 1,111 bytes)
- **Primary Purpose:** Single Page Application HTML entry shell with Google Fonts
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (0):** None
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0030: `metadata.json`

- **Directory:** `.`
- **Filename:** `metadata.json` (.json, 261 bytes)
- **Primary Purpose:** Google AI Studio application identity manifest
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Static documentation or data artifact; no active execution risk)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (0):** None
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0031: `package.json`

- **Directory:** `.`
- **Filename:** `package.json` (.json, 3,440 bytes)
- **Primary Purpose:** NPM manifest, project scripts and dependencies specification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Static documentation or data artifact; no active execution risk)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (0):** None
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: YES (@google/genai SDK)
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0032: `repo-inventory.json`

- **Directory:** `.`
- **Filename:** `repo-inventory.json` (.json, 46,224 bytes)
- **Primary Purpose:** Application utility or helper module
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Static documentation or data artifact; no active execution risk)
- **Duplicate Classification:** SAME FUNCTION / DIFFERENT IMPLEMENTATION (Counterpart: `full-repo-inventory.json`, Reason: Subset vs full dump of static repository analysis)
- **Legacy Classification:** LEGACY CANDIDATE (Pre-computed static analysis artifacts from prior convergence)
- **Exports (0):** None
- **Imports (0):** None
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0033: `run-phase10-runner.ts`

- **Directory:** `.`
- **Filename:** `run-phase10-runner.ts` (.ts, 370 bytes)
- **Primary Purpose:** Batch CLI test runner
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (1):** `./src/tests/phase10-publishing-verification`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0034: `run-phase9-runner.ts`

- **Directory:** `.`
- **Filename:** `run-phase9-runner.ts` (.ts, 336 bytes)
- **Primary Purpose:** Batch CLI test runner
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (1):** `./src/tests/phase9-verification`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0035: `run-stage8-runner.ts`

- **Directory:** `.`
- **Filename:** `run-stage8-runner.ts` (.ts, 445 bytes)
- **Primary Purpose:** Batch CLI test runner
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** POSSIBLE DUPLICATE (Counterpart: `src/tests/stage8-continuous-verification.ts`, Reason: Redundant runner wrapper around stage 8 suite)
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (1):** `./src/tests/stage8-continuous-verification`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0036: `scripts/audit-and-clean-bp-cnt-000001.ts`

- **Directory:** `scripts`
- **Filename:** `audit-and-clean-bp-cnt-000001.ts` (.ts, 22,089 bytes)
- **Primary Purpose:** CLI maintenance, verification, reset, or migration script
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `AuditInventory`
- **Imports (2):** `../src/lib/repositories`, `../src/lib/services/google-drive.service`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: YES (Binary File Operations)
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0037: `scripts/clean-audit-log.ts`

- **Directory:** `scripts`
- **Filename:** `clean-audit-log.ts` (.ts, 2,764 bytes)
- **Primary Purpose:** CLI maintenance, verification, reset, or migration script
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (1):** `googleapis`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0038: `scripts/cleanup-and-migrate-users.ts`

- **Directory:** `scripts`
- **Filename:** `cleanup-and-migrate-users.ts` (.ts, 7,689 bytes)
- **Primary Purpose:** CLI maintenance, verification, reset, or migration script
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (3):** `../src/lib/google-sheets/client`, `../src/lib/services/deletion-safety.service`, `fs`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0039: `scripts/comprehensive-audit.ts`

- **Directory:** `scripts`
- **Filename:** `comprehensive-audit.ts` (.ts, 5,896 bytes)
- **Primary Purpose:** CLI maintenance, verification, reset, or migration script
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (1):** `googleapis`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0040: `scripts/execute-phase-2b.ts`

- **Directory:** `scripts`
- **Filename:** `execute-phase-2b.ts` (.ts, 15,088 bytes)
- **Primary Purpose:** CLI maintenance, verification, reset, or migration script
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** LEGACY CANDIDATE (Script targeting older milestone phase execution)
- **Exports (0):** None
- **Imports (3):** `googleapis`, `fs`, `path`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0041: `scripts/execute-phase-2c.ts`

- **Directory:** `scripts`
- **Filename:** `execute-phase-2c.ts` (.ts, 20,644 bytes)
- **Primary Purpose:** CLI maintenance, verification, reset, or migration script
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** LEGACY CANDIDATE (Script targeting older milestone phase execution)
- **Exports (0):** None
- **Imports (3):** `googleapis`, `fs`, `path`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0042: `scripts/execute-phase-2d.ts`

- **Directory:** `scripts`
- **Filename:** `execute-phase-2d.ts` (.ts, 9,009 bytes)
- **Primary Purpose:** CLI maintenance, verification, reset, or migration script
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** LEGACY CANDIDATE (Script targeting older milestone phase execution)
- **Exports (0):** None
- **Imports (3):** `googleapis`, `fs`, `path`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0043: `scripts/execute-production-baseline-reset.ts`

- **Directory:** `scripts`
- **Filename:** `execute-production-baseline-reset.ts` (.ts, 16,676 bytes)
- **Primary Purpose:** CLI maintenance, verification, reset, or migration script
- **Workflow Participation:** NONE
- **Risk Level:** **HIGH** (Destructive operational script with capability to wipe Google Sheets worksheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (3):** `googleapis`, `fs`, `path`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: YES (Binary File Operations)
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0044: `scripts/final-baseline-read-only-audit.ts`

- **Directory:** `scripts`
- **Filename:** `final-baseline-read-only-audit.ts` (.ts, 9,387 bytes)
- **Primary Purpose:** CLI maintenance, verification, reset, or migration script
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (3):** `googleapis`, `fs`, `path`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: YES (Binary File Operations)
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0045: `scripts/google-oauth-setup.ts`

- **Directory:** `scripts`
- **Filename:** `google-oauth-setup.ts` (.ts, 4,405 bytes)
- **Primary Purpose:** CLI maintenance, verification, reset, or migration script
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (4):** `http`, `url`, `crypto`, `googleapis`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: YES (Binary File Operations)
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0046: `scripts/live-audit-and-reset.ts`

- **Directory:** `scripts`
- **Filename:** `live-audit-and-reset.ts` (.ts, 3,810 bytes)
- **Primary Purpose:** CLI maintenance, verification, reset, or migration script
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (3):** `googleapis`, `fs`, `path`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0047: `scripts/phase-b-launch-reset.ts`

- **Directory:** `scripts`
- **Filename:** `phase-b-launch-reset.ts` (.ts, 25,459 bytes)
- **Primary Purpose:** CLI maintenance, verification, reset, or migration script
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** LEGACY CANDIDATE (Script targeting older milestone phase execution)
- **Exports (0):** None
- **Imports (8):** `fs`, `path`, `crypto`, `googleapis`, `../src/lib/schemas/google-sheets-schema`, `../src/lib/google-sheets/client`, `../src/lib/services/google-drive.service`, `../src/lib/repositories`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: YES (Binary File Operations)
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0048: `scripts/purge-test-data-for-production.ts`

- **Directory:** `scripts`
- **Filename:** `purge-test-data-for-production.ts` (.ts, 16,035 bytes)
- **Primary Purpose:** CLI maintenance, verification, reset, or migration script
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **HIGH** (Destructive operational script with capability to wipe Google Sheets worksheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (5):** `fs`, `path`, `../src/lib/schemas/google-sheets-schema`, `../src/lib/google-sheets/client`, `../src/lib/repositories`
- **Consumers (1 files):** `src/lib/mock-data/index.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0049: `scripts/restore-sequences-phase-e.ts`

- **Directory:** `scripts`
- **Filename:** `restore-sequences-phase-e.ts` (.ts, 19,685 bytes)
- **Primary Purpose:** CLI maintenance, verification, reset, or migration script
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (35):** `fs`, `path`, `../src/lib/google-sheets/client`, `../src/lib/schemas/google-sheets-schema`, `../src/lib/repositories/base.repository`, `../src/lib/repositories/users.repository`, `../src/lib/repositories/categories.repository`, `../src/lib/repositories/topics.repository` ... and 27 more
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0050: `scripts/seed-100-questions-e2e-workflow.ts`

- **Directory:** `scripts`
- **Filename:** `seed-100-questions-e2e-workflow.ts` (.ts, 32,965 bytes)
- **Primary Purpose:** CLI maintenance, verification, reset, or migration script
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (2):** `../src/lib/repositories`, `../src/types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0051: `scripts/taxonomy-cross-audit.ts`

- **Directory:** `scripts`
- **Filename:** `taxonomy-cross-audit.ts` (.ts, 5,420 bytes)
- **Primary Purpose:** CLI maintenance, verification, reset, or migration script
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (1):** `googleapis`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0052: `scripts/test-task-3b2-ui-e2e.ts`

- **Directory:** `scripts`
- **Filename:** `test-task-3b2-ui-e2e.ts` (.ts, 23,347 bytes)
- **Primary Purpose:** CLI maintenance, verification, reset, or migration script
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (10):** `../src/lib/services/taxonomy.service`, `../src/lib/services/question.service`, `../src/lib/ai/gemini.service`, `../src/lib/ai/gemini.client`, `../src/lib/services/auth.service`, `../src/lib/repositories/questions.repository`, `../src/lib/ai/validators/candidate.validator`, `../src/lib/ai/validators/mathematical.validator` ... and 2 more
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: YES (@google/genai SDK)
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: YES

---

## FILE-0053: `scripts/verify-canonical-content-id.ts`

- **Directory:** `scripts`
- **Filename:** `verify-canonical-content-id.ts` (.ts, 7,083 bytes)
- **Primary Purpose:** CLI maintenance, verification, reset, or migration script
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (1):** `googleapis`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0054: `scripts/verify-drive-state.ts`

- **Directory:** `scripts`
- **Filename:** `verify-drive-state.ts` (.ts, 3,737 bytes)
- **Primary Purpose:** CLI maintenance, verification, reset, or migration script
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (1):** `googleapis`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: YES (Binary File Operations)
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0055: `scripts/verify-gcs-state.ts`

- **Directory:** `scripts`
- **Filename:** `verify-gcs-state.ts` (.ts, 1,295 bytes)
- **Primary Purpose:** CLI maintenance, verification, reset, or migration script
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (1):** `googleapis`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0056: `scripts/verify-task5.ts`

- **Directory:** `scripts`
- **Filename:** `verify-task5.ts` (.ts, 13,747 bytes)
- **Primary Purpose:** CLI maintenance, verification, reset, or migration script
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (6):** `../src/lib/services/question.service`, `../src/lib/services/video.service`, `../src/lib/services/script.service`, `../src/lib/services/taxonomy.service`, `../src/lib/repositories`, `../src/types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0057: `scripts/verify-worksheet-preservation.ts`

- **Directory:** `scripts`
- **Filename:** `verify-worksheet-preservation.ts` (.ts, 3,287 bytes)
- **Primary Purpose:** CLI maintenance, verification, reset, or migration script
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (3):** `googleapis`, `fs`, `path`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0058: `server.ts`

- **Directory:** `.`
- **Filename:** `server.ts` (.ts, 2,291 bytes)
- **Primary Purpose:** Express server bootstrap, Vite middleware mounting, API registration
- **Workflow Participation:** NONE
- **Risk Level:** **CRITICAL** (Core system driver with direct mutations to production external infrastructure)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (8):** `express`, `path`, `fs`, `vite`, `./src/server/routes`, `./src/lib/services/snapshot-scheduler.service`, `./src/lib/repositories/users.repository`, `./src/lib/services/google-drive.service`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: YES (Binary File Operations)
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0059: `src/App.tsx`

- **Directory:** `src`
- **Filename:** `App.tsx` (.tsx, 11,113 bytes)
- **Primary Purpose:** Application utility or helper module
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `App`, `default`
- **Imports (29):** `react`, `react-router-dom`, `./contexts/AuthContext`, `./contexts/ProductionJourneyContext`, `./pages/LoginPage`, `./components/layout/Layout`, `./pages/DashboardPage`, `./pages/QuestionLibraryPage` ... and 21 more
- **Consumers (1 files):** `src/main.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: YES

---

## FILE-0060: `src/components/assignments/AssignmentBadge.tsx`

- **Directory:** `src/components/assignments`
- **Filename:** `AssignmentBadge.tsx` (.tsx, 3,859 bytes)
- **Primary Purpose:** Domain UI React component for assignments
- **Workflow Participation:** NONE
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `AssignmentStatusBadge`, `AssignmentPriorityBadge`
- **Imports (3):** `react`, `../../types`, `lucide-react`
- **Consumers (4 files):** `src/components/assignments/EntityAssignmentsSection.tsx`, `src/design-system/components/WorkflowStepNav.tsx`, `src/pages/MyWorkPage.tsx`, `src/pages/TeamOperationsPage.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0061: `src/components/assignments/AssignmentModal.tsx`

- **Directory:** `src/components/assignments`
- **Filename:** `AssignmentModal.tsx` (.tsx, 21,093 bytes)
- **Primary Purpose:** Domain UI React component for assignments
- **Workflow Participation:** NONE
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `AssignmentModal`
- **Imports (3):** `../../types`, `../../lib/api-client`, `lucide-react`
- **Consumers (4 files):** `src/components/assignments/EntityAssignmentsSection.tsx`, `src/pages/MyWorkPage.tsx`, `src/pages/PublishingPage.tsx`, `src/pages/TeamOperationsPage.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0062: `src/components/assignments/EntityAssignmentsSection.tsx`

- **Directory:** `src/components/assignments`
- **Filename:** `EntityAssignmentsSection.tsx` (.tsx, 8,705 bytes)
- **Primary Purpose:** Domain UI React component for assignments
- **Workflow Participation:** NONE
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `EntityAssignmentsSection`
- **Imports (5):** `../../types`, `../../lib/api-client`, `./AssignmentBadge`, `./AssignmentModal`, `lucide-react`
- **Consumers (2 files):** `src/pages/QuestionDetailPage.tsx`, `src/pages/VideoDetailPage.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0063: `src/components/common/Button.tsx`

- **Directory:** `src/components/common`
- **Filename:** `Button.tsx` (.tsx, 308 bytes)
- **Primary Purpose:** Domain UI React component for common
- **Workflow Participation:** NONE
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (3):** `ButtonProps`, `Button`, `default`
- **Imports (2):** `react`, `../../design-system/components/Button`
- **Consumers (50 files):** `src/components/dashboard/ChannelPerformanceSection.tsx`, `src/components/dashboard/ContinueProductionCard.tsx`, `src/components/layout/ErrorBoundary.tsx`, `src/components/publishing/FinalizePublishingModal.tsx`, `src/components/publishing/PackageCopierModal.tsx`, `src/components/publishing/PublishScheduleModal.tsx`, `src/components/publishing/PublishingAssignmentModal.tsx`, `src/components/publishing/RecordPublicationModal.tsx` ... and 42 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0064: `src/components/common/DifficultyBadge.tsx`

- **Directory:** `src/components/common`
- **Filename:** `DifficultyBadge.tsx` (.tsx, 967 bytes)
- **Primary Purpose:** Domain UI React component for common
- **Workflow Participation:** NONE
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `DifficultyBadge`
- **Imports (4):** `react`, `../../config/constants`, `../../types`, `../../design-system/components/Badge`
- **Consumers (6 files):** `src/components/questions/QuestionTable.tsx`, `src/components/queue/QueueTable.tsx`, `src/design-system/components/WorkflowStepNav.tsx`, `src/pages/ContentMasterPage.tsx`, `src/pages/QuestionDetailPage.tsx`, `src/pages/VideoDetailPage.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0065: `src/components/common/EmptyState.tsx`

- **Directory:** `src/components/common`
- **Filename:** `EmptyState.tsx` (.tsx, 352 bytes)
- **Primary Purpose:** Domain UI React component for common
- **Workflow Participation:** NONE
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (3):** `EmptyStateProps`, `EmptyState`, `default`
- **Imports (2):** `react`, `../../design-system/components/EmptyState`
- **Consumers (13 files):** `src/pages/AnalyticsExperiencePage.tsx`, `src/pages/ProductionBoardPage.tsx`, `src/pages/ProductionTrackerPage.tsx`, `src/pages/QuestionImprovePage.tsx`, `src/pages/QuestionLibraryPage.tsx`, `src/pages/QuestionVerifyApprovePage.tsx`, `src/pages/QueuePage.tsx`, `src/pages/VideoEditPage.tsx` ... and 5 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0066: `src/components/common/LoadingState.tsx`

- **Directory:** `src/components/common`
- **Filename:** `LoadingState.tsx` (.tsx, 601 bytes)
- **Primary Purpose:** Domain UI React component for common
- **Workflow Participation:** NONE
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (3):** `LoadingStateProps`, `LoadingState`, `default`
- **Imports (2):** `react`, `../../design-system/components/Loading`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0067: `src/components/common/Modal.tsx`

- **Directory:** `src/components/common`
- **Filename:** `Modal.tsx` (.tsx, 336 bytes)
- **Primary Purpose:** Domain UI React component for common
- **Workflow Participation:** NONE
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (3):** `ModalProps`, `Modal`, `default`
- **Imports (2):** `react`, `../../design-system/components/Modal`
- **Consumers (13 files):** `src/components/assignments/EntityAssignmentsSection.tsx`, `src/components/publishing/FinalizePublishingModal.tsx`, `src/components/publishing/PackageCopierModal.tsx`, `src/components/publishing/PublishScheduleModal.tsx`, `src/components/publishing/PublishingAssignmentModal.tsx`, `src/components/publishing/RecordPublicationModal.tsx`, `src/components/publishing/RetryPlatformModal.tsx`, `src/components/social/SocialReviewWorkspace.tsx` ... and 5 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0068: `src/components/common/SearchInput.tsx`

- **Directory:** `src/components/common`
- **Filename:** `SearchInput.tsx` (.tsx, 851 bytes)
- **Primary Purpose:** Domain UI React component for common
- **Workflow Participation:** NONE
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `SearchInput`
- **Imports (3):** `react`, `lucide-react`, `../../design-system/components/Input`
- **Consumers (1 files):** `src/pages/QuestionLibraryPage.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0069: `src/components/common/StatCard.tsx`

- **Directory:** `src/components/common`
- **Filename:** `StatCard.tsx` (.tsx, 2,177 bytes)
- **Primary Purpose:** Domain UI React component for common
- **Workflow Participation:** NONE
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `StatCard`
- **Imports (3):** `react`, `lucide-react`, `../../design-system/components/Card`
- **Consumers (4 files):** `src/pages/AnalyticsExperiencePage.tsx`, `src/pages/ProductionTrackerPage.tsx`, `src/pages/QueuePage.tsx`, `src/pages/SocialAnalyticsPage.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0070: `src/components/common/StatusBadge.tsx`

- **Directory:** `src/components/common`
- **Filename:** `StatusBadge.tsx` (.tsx, 2,498 bytes)
- **Primary Purpose:** Domain UI React component for common
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (3):** `QuestionStatusBadge`, `VideoStatusBadge`, `SocialStatusBadge`
- **Imports (3):** `react`, `../../config/constants`, `../../types`
- **Consumers (9 files):** `src/components/production/ProductionTable.tsx`, `src/components/publishing/PublishingTable.tsx`, `src/components/questions/QuestionTable.tsx`, `src/components/queue/QueueTable.tsx`, `src/components/video/RecordingWorkspace.tsx`, `src/design-system/components/WorkflowStepNav.tsx`, `src/pages/ContentMasterPage.tsx`, `src/pages/QuestionDetailPage.tsx` ... and 1 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0071: `src/components/common/TechnicalDetails.tsx`

- **Directory:** `src/components/common`
- **Filename:** `TechnicalDetails.tsx` (.tsx, 3,461 bytes)
- **Primary Purpose:** Domain UI React component for common
- **Workflow Participation:** NONE
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `TechnicalDetailsProps`, `TechnicalDetails`
- **Imports (1):** `lucide-react`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0072: `src/components/dashboard/ChannelPerformanceSection.tsx`

- **Directory:** `src/components/dashboard`
- **Filename:** `ChannelPerformanceSection.tsx` (.tsx, 8,051 bytes)
- **Primary Purpose:** Domain UI React component for dashboard
- **Workflow Participation:** 14 Performance Review (DIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `ChannelPerformanceSectionProps`, `ChannelPerformanceSection`
- **Imports (7):** `react`, `lucide-react`, `react-router-dom`, `../../design-system/components/Card`, `../../design-system/components/Button`, `../../design-system/components/Badge`, `../../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0073: `src/components/dashboard/ContinueProductionCard.tsx`

- **Directory:** `src/components/dashboard`
- **Filename:** `ContinueProductionCard.tsx` (.tsx, 7,806 bytes)
- **Primary Purpose:** Domain UI React component for dashboard
- **Workflow Participation:** NONE
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (3):** `ActionableProductionItem`, `ContinueProductionCardProps`, `ContinueProductionCard`
- **Imports (6):** `react`, `lucide-react`, `react-router-dom`, `../../design-system/components/Card`, `../../design-system/components/Button`, `../../design-system/components/Badge`
- **Consumers (2 files):** `src/components/dashboard/OperationalDispatch.tsx`, `src/pages/DashboardPage.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0074: `src/components/dashboard/ConveyorBeltVisualizer.tsx`

- **Directory:** `src/components/dashboard`
- **Filename:** `ConveyorBeltVisualizer.tsx` (.tsx, 7,204 bytes)
- **Primary Purpose:** Domain UI React component for dashboard
- **Workflow Participation:** NONE
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `ConveyorStageCounts`, `ConveyorBeltVisualizer`
- **Imports (3):** `react`, `react-router-dom`, `lucide-react`
- **Consumers (1 files):** `src/pages/DashboardPage.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0075: `src/components/dashboard/DailyWorkflowGuide.tsx`

- **Directory:** `src/components/dashboard`
- **Filename:** `DailyWorkflowGuide.tsx` (.tsx, 4,017 bytes)
- **Primary Purpose:** Domain UI React component for dashboard
- **Workflow Participation:** NONE
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `DailyWorkflowGuide`
- **Imports (3):** `react-router-dom`, `lucide-react`, `../../config/constants`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0076: `src/components/dashboard/DashboardFilterBar.tsx`

- **Directory:** `src/components/dashboard`
- **Filename:** `DashboardFilterBar.tsx` (.tsx, 4,500 bytes)
- **Primary Purpose:** Domain UI React component for dashboard
- **Workflow Participation:** NONE
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `DashboardFilterBar`
- **Imports (3):** `react`, `lucide-react`, `../../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0077: `src/components/dashboard/ExecutiveHeroBanner.tsx`

- **Directory:** `src/components/dashboard`
- **Filename:** `ExecutiveHeroBanner.tsx` (.tsx, 7,430 bytes)
- **Primary Purpose:** Domain UI React component for dashboard
- **Workflow Participation:** NONE
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `ExecutiveHeroBanner`
- **Imports (4):** `react`, `react-router-dom`, `lucide-react`, `../../types`
- **Consumers (1 files):** `src/pages/DashboardPage.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0078: `src/components/dashboard/ExecutiveVitalsBento.tsx`

- **Directory:** `src/components/dashboard`
- **Filename:** `ExecutiveVitalsBento.tsx` (.tsx, 7,042 bytes)
- **Primary Purpose:** Domain UI React component for dashboard
- **Workflow Participation:** NONE
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `ExecutiveVitalsBento`
- **Imports (3):** `react`, `lucide-react`, `react-router-dom`
- **Consumers (1 files):** `src/pages/DashboardPage.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0079: `src/components/dashboard/GlobalSearchBar.tsx`

- **Directory:** `src/components/dashboard`
- **Filename:** `GlobalSearchBar.tsx` (.tsx, 6,357 bytes)
- **Primary Purpose:** Domain UI React component for dashboard
- **Workflow Participation:** NONE
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `GlobalSearchBarProps`, `GlobalSearchBar`
- **Imports (4):** `lucide-react`, `react-router-dom`, `../../lib/api-client`, `../../types`
- **Consumers (1 files):** `src/components/layout/Header.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0080: `src/components/dashboard/OperationalDispatch.tsx`

- **Directory:** `src/components/dashboard`
- **Filename:** `OperationalDispatch.tsx` (.tsx, 20,527 bytes)
- **Primary Purpose:** Domain UI React component for dashboard
- **Workflow Participation:** NONE
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `OperationalDispatch`
- **Imports (5):** `react`, `react-router-dom`, `lucide-react`, `./ContinueProductionCard`, `./WhatsWaitingSection`
- **Consumers (1 files):** `src/pages/DashboardPage.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0081: `src/components/dashboard/PipelineVisualizer.tsx`

- **Directory:** `src/components/dashboard`
- **Filename:** `PipelineVisualizer.tsx` (.tsx, 12,483 bytes)
- **Primary Purpose:** Domain UI React component for dashboard
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `PipelineVisualizer`
- **Imports (3):** `react-router-dom`, `lucide-react`, `../../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0082: `src/components/dashboard/RecentAuditFeed.tsx`

- **Directory:** `src/components/dashboard`
- **Filename:** `RecentAuditFeed.tsx` (.tsx, 5,167 bytes)
- **Primary Purpose:** Domain UI React component for dashboard
- **Workflow Participation:** NONE
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `RecentAuditFeed`
- **Imports (3):** `react`, `../../types`, `lucide-react`
- **Consumers (1 files):** `src/pages/DashboardPage.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0083: `src/components/dashboard/StaleContentSection.tsx`

- **Directory:** `src/components/dashboard`
- **Filename:** `StaleContentSection.tsx` (.tsx, 6,659 bytes)
- **Primary Purpose:** Domain UI React component for dashboard
- **Workflow Participation:** NONE
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `StaleContentSection`
- **Imports (3):** `lucide-react`, `react-router-dom`, `../../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0084: `src/components/dashboard/TodaysWorkSection.tsx`

- **Directory:** `src/components/dashboard`
- **Filename:** `TodaysWorkSection.tsx` (.tsx, 8,477 bytes)
- **Primary Purpose:** Domain UI React component for dashboard
- **Workflow Participation:** NONE
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `TodaysWorkSection`
- **Imports (3):** `react-router-dom`, `lucide-react`, `../../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0085: `src/components/dashboard/WhatsWaitingSection.tsx`

- **Directory:** `src/components/dashboard`
- **Filename:** `WhatsWaitingSection.tsx` (.tsx, 8,654 bytes)
- **Primary Purpose:** Domain UI React component for dashboard
- **Workflow Participation:** NONE
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (3):** `WaitingCounts`, `WhatsWaitingSectionProps`, `WhatsWaitingSection`
- **Imports (6):** `react`, `lucide-react`, `react-router-dom`, `../../design-system/components/Card`, `../../design-system/components/Badge`, `../../types`
- **Consumers (2 files):** `src/components/dashboard/OperationalDispatch.tsx`, `src/pages/DashboardPage.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0086: `src/components/layout/ErrorBoundary.tsx`

- **Directory:** `src/components/layout`
- **Filename:** `ErrorBoundary.tsx` (.tsx, 4,039 bytes)
- **Primary Purpose:** Domain UI React component for layout
- **Workflow Participation:** NONE
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `ErrorBoundary`
- **Imports (2):** `lucide-react`, `../common/Button`
- **Consumers (1 files):** `src/components/layout/Layout.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0087: `src/components/layout/Header.tsx`

- **Directory:** `src/components/layout`
- **Filename:** `Header.tsx` (.tsx, 3,818 bytes)
- **Primary Purpose:** Domain UI React component for layout
- **Workflow Participation:** NONE
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `HeaderProps`, `Header`
- **Imports (8):** `react`, `lucide-react`, `../dashboard/GlobalSearchBar`, `./UserProfileMenu`, `./NotificationsMenu`, `./SystemHealthIndicator`, `react-router-dom`, `../../design-system/components/AppBreadcrumbs`
- **Consumers (29 files):** `src/components/layout/Layout.tsx`, `src/components/layout/PageHeader.tsx`, `src/design-system/components/AppBreadcrumbs.tsx`, `src/pages/AnalyticsExperiencePage.tsx`, `src/pages/ContentMasterPage.tsx`, `src/pages/MyWorkPage.tsx`, `src/pages/PlatformPackagesPage.tsx`, `src/pages/ProductionBoardPage.tsx` ... and 21 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0088: `src/components/layout/Layout.tsx`

- **Directory:** `src/components/layout`
- **Filename:** `Layout.tsx` (.tsx, 3,713 bytes)
- **Primary Purpose:** Domain UI React component for layout
- **Workflow Participation:** NONE
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `Layout`
- **Imports (5):** `react-router-dom`, `./Sidebar`, `./Header`, `./ErrorBoundary`, `../../design-system/components/AppBreadcrumbs`
- **Consumers (1 files):** `src/App.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0089: `src/components/layout/NotificationsMenu.tsx`

- **Directory:** `src/components/layout`
- **Filename:** `NotificationsMenu.tsx` (.tsx, 8,154 bytes)
- **Primary Purpose:** Domain UI React component for layout
- **Workflow Participation:** NONE
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `NotificationsMenuProps`, `NotificationsMenu`
- **Imports (2):** `lucide-react`, `../../lib/api-client`
- **Consumers (1 files):** `src/components/layout/Header.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0090: `src/components/layout/PageHeader.tsx`

- **Directory:** `src/components/layout`
- **Filename:** `PageHeader.tsx` (.tsx, 400 bytes)
- **Primary Purpose:** Domain UI React component for layout
- **Workflow Participation:** NONE
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (3):** `PageHeaderProps`, `PageHeader`, `default`
- **Imports (2):** `react`, `../../design-system/components/PageHeader`
- **Consumers (27 files):** `src/components/layout/Layout.tsx`, `src/design-system/components/AppBreadcrumbs.tsx`, `src/pages/AnalyticsExperiencePage.tsx`, `src/pages/ContentMasterPage.tsx`, `src/pages/MyWorkPage.tsx`, `src/pages/PlatformPackagesPage.tsx`, `src/pages/ProductionBoardPage.tsx`, `src/pages/ProductionTrackerPage.tsx` ... and 19 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0091: `src/components/layout/Sidebar.tsx`

- **Directory:** `src/components/layout`
- **Filename:** `Sidebar.tsx` (.tsx, 14,200 bytes)
- **Primary Purpose:** Domain UI React component for layout
- **Workflow Participation:** NONE
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `SidebarProps`, `Sidebar`
- **Imports (6):** `react-router-dom`, `lucide-react`, `../../config/navigation`, `../../config/constants`, `../../contexts/AuthContext`, `../../config/roles`
- **Consumers (1 files):** `src/components/layout/Layout.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: YES

---

## FILE-0092: `src/components/layout/SystemHealthIndicator.tsx`

- **Directory:** `src/components/layout`
- **Filename:** `SystemHealthIndicator.tsx` (.tsx, 6,270 bytes)
- **Primary Purpose:** Domain UI React component for layout
- **Workflow Participation:** NONE
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `SystemHealthIndicator`
- **Imports (2):** `lucide-react`, `../../lib/api-client`
- **Consumers (1 files):** `src/components/layout/Header.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0093: `src/components/layout/UserProfileMenu.tsx`

- **Directory:** `src/components/layout`
- **Filename:** `UserProfileMenu.tsx` (.tsx, 6,580 bytes)
- **Primary Purpose:** Domain UI React component for layout
- **Workflow Participation:** NONE
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `UserProfileMenuProps`, `UserProfileMenu`
- **Imports (5):** `lucide-react`, `react-router-dom`, `../../contexts/AuthContext`, `../../config/constants`, `../../config/roles`
- **Consumers (1 files):** `src/components/layout/Header.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0094: `src/components/production/PipelineProgress.tsx`

- **Directory:** `src/components/production`
- **Filename:** `PipelineProgress.tsx` (.tsx, 2,693 bytes)
- **Primary Purpose:** Domain UI React component for production
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `PipelineProgress`
- **Imports (3):** `react`, `../../types`, `../../config/constants`
- **Consumers (1 files):** `src/components/production/ProductionTable.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0095: `src/components/production/ProductionJourneyBar.tsx`

- **Directory:** `src/components/production`
- **Filename:** `ProductionJourneyBar.tsx` (.tsx, 11,496 bytes)
- **Primary Purpose:** Domain UI React component for production
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `ProductionJourneyBarProps`, `ProductionJourneyBar`
- **Imports (2):** `lucide-react`, `../../contexts/ProductionJourneyContext`
- **Consumers (8 files):** `src/pages/PlatformPackagesPage.tsx`, `src/pages/QuestionDetailPage.tsx`, `src/pages/QuestionStudioPage.tsx`, `src/pages/QuestionVerifyApprovePage.tsx`, `src/pages/VideoCreateScriptPage.tsx`, `src/pages/VideoDetailPage.tsx`, `src/pages/VideoEditPage.tsx`, `src/pages/VideoRecordPage.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0096: `src/components/production/ProductionKanban.tsx`

- **Directory:** `src/components/production`
- **Filename:** `ProductionKanban.tsx` (.tsx, 10,696 bytes)
- **Primary Purpose:** Domain UI React component for production
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `ProductionKanban`
- **Imports (6):** `react`, `react-router-dom`, `lucide-react`, `../../types`, `../../config/constants`, `../../utils/formatters`
- **Consumers (1 files):** `src/pages/ProductionTrackerPage.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0097: `src/components/production/ProductionTable.tsx`

- **Directory:** `src/components/production`
- **Filename:** `ProductionTable.tsx` (.tsx, 7,445 bytes)
- **Primary Purpose:** Domain UI React component for production
- **Workflow Participation:** NONE
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `ProductionTable`
- **Imports (8):** `react`, `react-router-dom`, `../../types`, `../common/StatusBadge`, `../../config/constants`, `./PipelineProgress`, `lucide-react`, `../../utils/formatters`
- **Consumers (1 files):** `src/pages/ProductionTrackerPage.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0098: `src/components/publishing/FinalizePublishingModal.tsx`

- **Directory:** `src/components/publishing`
- **Filename:** `FinalizePublishingModal.tsx` (.tsx, 6,452 bytes)
- **Primary Purpose:** Domain UI React component for publishing
- **Workflow Participation:** 11 Published (DIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `FinalizePublishingModal`
- **Imports (5):** `lucide-react`, `../common/Modal`, `../common/Button`, `../../lib/api-client`, `../../types`
- **Consumers (1 files):** `src/pages/PublishingPage.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0099: `src/components/publishing/PackageCopierModal.tsx`

- **Directory:** `src/components/publishing`
- **Filename:** `PackageCopierModal.tsx` (.tsx, 16,738 bytes)
- **Primary Purpose:** Domain UI React component for publishing
- **Workflow Participation:** NONE
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `PackageCopierModal`
- **Imports (5):** `lucide-react`, `../common/Modal`, `../common/Button`, `../../lib/api-client`, `../../types`
- **Consumers (1 files):** `src/pages/PublishingPage.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0100: `src/components/publishing/PublishScheduleModal.tsx`

- **Directory:** `src/components/publishing`
- **Filename:** `PublishScheduleModal.tsx` (.tsx, 9,756 bytes)
- **Primary Purpose:** Domain UI React component for publishing
- **Workflow Participation:** 11 Published (DIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `PublishScheduleModal`
- **Imports (5):** `lucide-react`, `../common/Modal`, `../common/Button`, `../../lib/api-client`, `../../types`
- **Consumers (1 files):** `src/pages/PublishingPage.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0101: `src/components/publishing/PublishingAssignmentModal.tsx`

- **Directory:** `src/components/publishing`
- **Filename:** `PublishingAssignmentModal.tsx` (.tsx, 10,966 bytes)
- **Primary Purpose:** Domain UI React component for publishing
- **Workflow Participation:** 11 Published (DIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `PublishingAssignmentModal`
- **Imports (5):** `lucide-react`, `../common/Modal`, `../common/Button`, `../../lib/api-client`, `../../types`
- **Consumers (2 files):** `src/components/assignments/EntityAssignmentsSection.tsx`, `src/pages/PublishingPage.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0102: `src/components/publishing/PublishingTable.tsx`

- **Directory:** `src/components/publishing`
- **Filename:** `PublishingTable.tsx` (.tsx, 24,042 bytes)
- **Primary Purpose:** Domain UI React component for publishing
- **Workflow Participation:** 11 Published (DIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `PublishingTableProps`, `PublishingTable`
- **Imports (4):** `lucide-react`, `../../types`, `../common/StatusBadge`, `../../lib/services/production-asset-validation.service`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0103: `src/components/publishing/PublishingWorkflowHeader.tsx`

- **Directory:** `src/components/publishing`
- **Filename:** `PublishingWorkflowHeader.tsx` (.tsx, 7,226 bytes)
- **Primary Purpose:** Domain UI React component for publishing
- **Workflow Participation:** 11 Published (DIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (5):** `PublishingWorkflowHeaderProps`, `PublishingStepMeta`, `PUBLISHING_STEPS`, `PublishingWorkflowHeader`, `default`
- **Imports (4):** `react`, `react-router-dom`, `lucide-react`, `../../lib/workflow/canonical-workflow`
- **Consumers (3 files):** `src/components/layout/Layout.tsx`, `src/pages/PublishingPackagePage.tsx`, `src/pages/PublishingPage.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0104: `src/components/publishing/RecordPublicationModal.tsx`

- **Directory:** `src/components/publishing`
- **Filename:** `RecordPublicationModal.tsx` (.tsx, 9,703 bytes)
- **Primary Purpose:** Domain UI React component for publishing
- **Workflow Participation:** 11 Published (DIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `RecordPublicationModal`
- **Imports (5):** `lucide-react`, `../common/Modal`, `../common/Button`, `../../lib/api-client`, `../../types`
- **Consumers (1 files):** `src/pages/PublishingPage.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0105: `src/components/publishing/RetryPlatformModal.tsx`

- **Directory:** `src/components/publishing`
- **Filename:** `RetryPlatformModal.tsx` (.tsx, 8,305 bytes)
- **Primary Purpose:** Domain UI React component for publishing
- **Workflow Participation:** 11 Published (DIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `RetryPlatformModal`
- **Imports (5):** `lucide-react`, `../common/Modal`, `../common/Button`, `../../lib/api-client`, `../../types`
- **Consumers (1 files):** `src/pages/PublishingPage.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0106: `src/components/questions/QuestionTable.tsx`

- **Directory:** `src/components/questions`
- **Filename:** `QuestionTable.tsx` (.tsx, 10,663 bytes)
- **Primary Purpose:** Domain UI React component for questions
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `QuestionTable`, `default`
- **Imports (7):** `react`, `react-router-dom`, `lucide-react`, `../../types`, `../common/StatusBadge`, `../common/DifficultyBadge`, `../../utils/formatters`
- **Consumers (1 files):** `src/pages/QuestionLibraryPage.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0107: `src/components/questions/QuestionWorkflowHeader.tsx`

- **Directory:** `src/components/questions`
- **Filename:** `QuestionWorkflowHeader.tsx` (.tsx, 5,076 bytes)
- **Primary Purpose:** Domain UI React component for questions
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (5):** `QuestionWorkflowHeaderProps`, `QuestionStepMeta`, `QUESTION_STEPS`, `QuestionWorkflowHeader`, `default`
- **Imports (5):** `react`, `react-router-dom`, `lucide-react`, `../../design-system/components/Badge`, `../../lib/workflow/canonical-workflow`
- **Consumers (4 files):** `src/components/layout/Layout.tsx`, `src/pages/QuestionDetailPage.tsx`, `src/pages/QuestionImprovePage.tsx`, `src/pages/QuestionLibraryPage.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0108: `src/components/queue/QueueTable.tsx`

- **Directory:** `src/components/queue`
- **Filename:** `QueueTable.tsx` (.tsx, 8,554 bytes)
- **Primary Purpose:** Domain UI React component for queue
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `QueueTable`
- **Imports (7):** `react`, `react-router-dom`, `lucide-react`, `../common/DifficultyBadge`, `../common/StatusBadge`, `../../config/constants`, `../../types`
- **Consumers (1 files):** `src/pages/QueuePage.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0109: `src/components/social/AssetWorkflowHeader.tsx`

- **Directory:** `src/components/social`
- **Filename:** `AssetWorkflowHeader.tsx` (.tsx, 7,161 bytes)
- **Primary Purpose:** Domain UI React component for social
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (5):** `AssetWorkflowHeaderProps`, `AssetStepMeta`, `ASSET_STEPS`, `AssetWorkflowHeader`, `default`
- **Imports (5):** `react`, `react-router-dom`, `lucide-react`, `../../design-system/components/Badge`, `../../lib/workflow/canonical-workflow`
- **Consumers (4 files):** `src/components/layout/Layout.tsx`, `src/pages/SocialReviewPage.tsx`, `src/pages/VideoPinnedCommentPage.tsx`, `src/pages/VideoThumbnailPage.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0110: `src/components/social/SocialReviewWorkspace.tsx`

- **Directory:** `src/components/social`
- **Filename:** `SocialReviewWorkspace.tsx` (.tsx, 53,900 bytes)
- **Primary Purpose:** Domain UI React component for social
- **Workflow Participation:** 09 Social Review (DIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `SocialReviewWorkspace`, `default`
- **Imports (8):** `../../types`, `../../lib/api-client`, `lucide-react`, `../../design-system/components/Card`, `../../design-system/components/Badge`, `../../design-system/components/Button`, `../../design-system/components/Alert`, `../../design-system/components/Modal`
- **Consumers (2 files):** `src/pages/SocialReviewPage.tsx`, `src/pages/VideoDetailPage.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0111: `src/components/video/EditingWorkspace.tsx`

- **Directory:** `src/components/video`
- **Filename:** `EditingWorkspace.tsx` (.tsx, 29,628 bytes)
- **Primary Purpose:** Domain UI React component for video
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `EditingWorkspace`
- **Imports (4):** `lucide-react`, `../../types`, `../../lib/api-client`, `../common/Button`
- **Consumers (1 files):** `src/pages/VideoDetailPage.tsx`
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0112: `src/components/video/FinalReviewWorkspace.tsx`

- **Directory:** `src/components/video`
- **Filename:** `FinalReviewWorkspace.tsx` (.tsx, 19,868 bytes)
- **Primary Purpose:** Domain UI React component for video
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `FinalReviewWorkspace`
- **Imports (7):** `lucide-react`, `../../types`, `../../lib/api-client`, `../../design-system/components/Button`, `../../design-system/components/Badge`, `../../design-system/components/Card`, `../../design-system/components/Alert`
- **Consumers (1 files):** `src/pages/VideoDetailPage.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0113: `src/components/video/PinnedCommentWorkspace.tsx`

- **Directory:** `src/components/video`
- **Filename:** `PinnedCommentWorkspace.tsx` (.tsx, 12,063 bytes)
- **Primary Purpose:** Domain UI React component for video
- **Workflow Participation:** 15 Intelligence Loop (DIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `PinnedCommentWorkspace`
- **Imports (4):** `lucide-react`, `../../types`, `../../lib/api-client`, `../common/Button`
- **Consumers (1 files):** `src/pages/VideoDetailPage.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0114: `src/components/video/PublishingWorkspace.tsx`

- **Directory:** `src/components/video`
- **Filename:** `PublishingWorkspace.tsx` (.tsx, 48,129 bytes)
- **Primary Purpose:** Domain UI React component for video
- **Workflow Participation:** 11 Published (DIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `PublishingWorkspace`
- **Imports (5):** `react-router-dom`, `lucide-react`, `../../types`, `../../lib/api-client`, `../common/Button`
- **Consumers (1 files):** `src/pages/VideoDetailPage.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0115: `src/components/video/RecordingWorkspace.tsx`

- **Directory:** `src/components/video`
- **Filename:** `RecordingWorkspace.tsx` (.tsx, 50,041 bytes)
- **Primary Purpose:** Domain UI React component for video
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `RecordingWorkspaceProps`, `RecordingWorkspace`
- **Imports (6):** `lucide-react`, `../../types`, `../../lib/api-client`, `../common/Button`, `../common/StatusBadge`, `../../config/constants`
- **Consumers (1 files):** `src/pages/VideoDetailPage.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0116: `src/components/video/ScriptWorkspace.tsx`

- **Directory:** `src/components/video`
- **Filename:** `ScriptWorkspace.tsx` (.tsx, 52,689 bytes)
- **Primary Purpose:** Domain UI React component for video
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (3):** `ScriptWorkspaceProps`, `ScriptWorkspace`, `default`
- **Imports (8):** `react-router-dom`, `lucide-react`, `../../types`, `../../lib/api-client`, `../../design-system/components/Button`, `../../design-system/components/Badge`, `../../design-system/components/Card`, `../../design-system/components/Alert`
- **Consumers (1 files):** `src/pages/VideoDetailPage.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0117: `src/components/video/ThumbnailWorkspace.tsx`

- **Directory:** `src/components/video`
- **Filename:** `ThumbnailWorkspace.tsx` (.tsx, 41,638 bytes)
- **Primary Purpose:** Domain UI React component for video
- **Workflow Participation:** 08 Thumbnail (DIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `ThumbnailWorkspace`
- **Imports (9):** `react-router-dom`, `lucide-react`, `../../types`, `../../lib/api-client`, `../../design-system/components/Button`, `../../design-system/components/Badge`, `../../design-system/components/Card`, `../../design-system/components/Alert` ... and 1 more
- **Consumers (1 files):** `src/pages/VideoDetailPage.tsx`
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0118: `src/components/video/VideoWorkflowHeader.tsx`

- **Directory:** `src/components/video`
- **Filename:** `VideoWorkflowHeader.tsx` (.tsx, 6,089 bytes)
- **Primary Purpose:** Domain UI React component for video
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (5):** `VideoWorkflowHeaderProps`, `VideoStepMeta`, `VIDEO_STEPS`, `VideoWorkflowHeader`, `default`
- **Imports (5):** `react`, `react-router-dom`, `lucide-react`, `../../design-system/components/Badge`, `../../lib/workflow/canonical-workflow`
- **Consumers (5 files):** `src/components/layout/Layout.tsx`, `src/pages/VideoEditPage.tsx`, `src/pages/VideoFinalPage.tsx`, `src/pages/VideoRecordPage.tsx`, `src/pages/VideoReviewScriptPage.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0119: `src/config/constants.ts`

- **Directory:** `src/config`
- **Filename:** `constants.ts` (.ts, 11,370 bytes)
- **Primary Purpose:** Domain business rule configuration and operational parameters
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (12):** `APP_CONFIG`, `QUESTION_STATUS_CONFIG`, `VIDEO_STATUS_CONFIG`, `DIFFICULTY_CONFIG`, `PRIORITY_CONFIG`, `SOCIAL_STATUS_CONFIG`, `PIPELINE_STEPS`, `VALID_VIDEO_TRANSITIONS`, `QUESTION_STYLES`, `AGING_THRESHOLDS` ... and 2 more
- **Imports (1):** `../types`
- **Consumers (14 files):** `src/components/common/DifficultyBadge.tsx`, `src/components/common/StatusBadge.tsx`, `src/components/dashboard/DailyWorkflowGuide.tsx`, `src/components/layout/Sidebar.tsx`, `src/components/layout/UserProfileMenu.tsx`, `src/components/production/PipelineProgress.tsx`, `src/components/production/ProductionKanban.tsx`, `src/components/production/ProductionTable.tsx` ... and 6 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0120: `src/config/media-upload.config.ts`

- **Directory:** `src/config`
- **Filename:** `media-upload.config.ts` (.ts, 3,096 bytes)
- **Primary Purpose:** Domain business rule configuration and operational parameters
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (7):** `ALLOWED_VIDEO_MIME_TYPES`, `ALLOWED_THUMBNAIL_MIME_TYPES`, `ALLOWED_MEDIA_MIME_TYPES`, `ALLOWED_EXTENSIONS`, `MAX_VIDEO_FILE_SIZE_BYTES`, `sanitizeFileName`, `validateMediaUpload`
- **Imports (1):** `../lib/google-sheets/errors`
- **Consumers (7 files):** `src/lib/ai/gemini.service.ts`, `src/lib/ai/orchestrator.ts`, `src/lib/ai/registry.ts`, `src/lib/ai/validators/blind-verifier.ts`, `src/lib/ai/validators/semantic-reasoning.provider.ts`, `src/lib/services/video.service.ts`, `src/tests/phase7-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0121: `src/config/navigation.ts`

- **Directory:** `src/config`
- **Filename:** `navigation.ts` (.ts, 5,891 bytes)
- **Primary Purpose:** Domain business rule configuration and operational parameters
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (6):** `HubNavItem`, `NavigationHub`, `AUTHORITATIVE_HUBS`, `NavItem`, `NavSection`, `NAVIGATION_SECTIONS`
- **Imports (1):** `./roles`
- **Consumers (5 files):** `src/components/layout/Sidebar.tsx`, `src/tests/phase04-shell-navigation-verification.ts`, `src/tests/phase10-analytics-experience-verification.ts`, `src/tests/phase11-legacy-ui-simplification-verification.ts`, `src/tests/phase12-final-ui-ux-acceptance-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0122: `src/config/question-creation.config.ts`

- **Directory:** `src/config`
- **Filename:** `question-creation.config.ts` (.ts, 8,544 bytes)
- **Primary Purpose:** Domain business rule configuration and operational parameters
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (11):** `DifficultyConfig`, `RealLifeContextCategory`, `ChallengeTypeConfig`, `PresentationTypeConfig`, `LanguageConfig`, `DIFFICULTY_LEVELS`, `REAL_LIFE_CONTEXTS`, `CHALLENGE_TYPES`, `PRESENTATION_TYPES`, `LANGUAGES` ... and 1 more
- **Imports (1):** `../types`
- **Consumers (10 files):** `src/lib/ai/gemini.service.ts`, `src/lib/ai/orchestrator.ts`, `src/lib/ai/registry.ts`, `src/lib/ai/validators/blind-verifier.ts`, `src/lib/ai/validators/semantic-reasoning.provider.ts`, `src/lib/services/smart-random.service.ts`, `src/lib/validators/question-creation.validator.ts`, `src/pages/QuestionStudioPage.tsx` ... and 2 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0123: `src/config/roles.ts`

- **Directory:** `src/config`
- **Filename:** `roles.ts` (.ts, 10,644 bytes)
- **Primary Purpose:** Domain business rule configuration and operational parameters
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (8):** `CanonicalRole`, `RoleDescriptor`, `CANONICAL_ROLE_DESCRIPTORS`, `resolveCanonicalRole`, `getRoleDisplayName`, `NavigationCapability`, `hasNavigationCapability`, `getDefaultLandingRoute`
- **Imports (1):** `../types`
- **Consumers (5 files):** `src/App.tsx`, `src/components/layout/Sidebar.tsx`, `src/components/layout/UserProfileMenu.tsx`, `src/config/navigation.ts`, `src/pages/MyWorkPage.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: YES

---

## FILE-0124: `src/config/snapshot.config.ts`

- **Directory:** `src/config`
- **Filename:** `snapshot.config.ts` (.ts, 5,346 bytes)
- **Primary Purpose:** Domain business rule configuration and operational parameters
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (3):** `SnapshotArchiveConfig`, `validateBucketName`, `getSnapshotArchiveConfig`
- **Imports (0):** None
- **Consumers (10 files):** `src/lib/ai/gemini.service.ts`, `src/lib/ai/orchestrator.ts`, `src/lib/ai/registry.ts`, `src/lib/ai/validators/blind-verifier.ts`, `src/lib/ai/validators/semantic-reasoning.provider.ts`, `src/lib/services/durable-snapshot-archive.service.ts`, `src/lib/services/snapshot-history.service.ts`, `src/lib/services/snapshot-scheduler.service.ts` ... and 2 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0125: `src/contexts/AuthContext.tsx`

- **Directory:** `src/contexts`
- **Filename:** `AuthContext.tsx` (.tsx, 2,069 bytes)
- **Primary Purpose:** Application utility or helper module
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `AuthProvider`, `useAuth`
- **Imports (2):** `../types`, `../lib/api-client`
- **Consumers (14 files):** `src/App.tsx`, `src/components/layout/Sidebar.tsx`, `src/components/layout/UserProfileMenu.tsx`, `src/pages/ContentMasterPage.tsx`, `src/pages/DashboardPage.tsx`, `src/pages/LoginPage.tsx`, `src/pages/MyWorkPage.tsx`, `src/pages/ProductionTrackerPage.tsx` ... and 6 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0126: `src/contexts/ProductionJourneyContext.tsx`

- **Directory:** `src/contexts`
- **Filename:** `ProductionJourneyContext.tsx` (.tsx, 35,083 bytes)
- **Primary Purpose:** Application utility or helper module
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (9):** `CanonicalIds`, `JourneyStage`, `JourneyNextAction`, `ProductionJourneyContextType`, `STAGE_DEFINITIONS`, `getJourneyStageById`, `getNextStage`, `ProductionJourneyProvider`, `useProductionJourney`
- **Imports (4):** `react-router-dom`, `../types`, `../lib/api-client`, `../lib/workflow/canonical-workflow`
- **Consumers (10 files):** `src/App.tsx`, `src/components/production/ProductionJourneyBar.tsx`, `src/pages/PlatformPackagesPage.tsx`, `src/pages/QuestionDetailPage.tsx`, `src/pages/QuestionStudioPage.tsx`, `src/pages/QuestionVerifyApprovePage.tsx`, `src/pages/VideoDetailPage.tsx`, `src/pages/VideoEditPage.tsx` ... and 2 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0127: `src/design-system/components/Alert.tsx`

- **Directory:** `src/design-system/components`
- **Filename:** `Alert.tsx` (.tsx, 2,507 bytes)
- **Primary Purpose:** Atomic design system primitive or token definition
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `AlertProps`, `Alert`
- **Imports (4):** `react`, `lucide-react`, `../tokens`, `../types`
- **Consumers (13 files):** `src/components/social/SocialReviewWorkspace.tsx`, `src/components/video/FinalReviewWorkspace.tsx`, `src/components/video/ScriptWorkspace.tsx`, `src/components/video/ThumbnailWorkspace.tsx`, `src/pages/DashboardPage.tsx`, `src/pages/QuestionImprovePage.tsx`, `src/pages/QuestionVerifyApprovePage.tsx`, `src/pages/VideoEditPage.tsx` ... and 5 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0128: `src/design-system/components/AppBreadcrumbs.tsx`

- **Directory:** `src/design-system/components`
- **Filename:** `AppBreadcrumbs.tsx` (.tsx, 9,612 bytes)
- **Primary Purpose:** Atomic design system primitive or token definition
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (3):** `AppBreadcrumbsProps`, `inferBreadcrumbs`, `AppBreadcrumbs`
- **Imports (4):** `react`, `lucide-react`, `react-router-dom`, `./PageHeader`
- **Consumers (3 files):** `src/components/layout/Header.tsx`, `src/components/layout/Layout.tsx`, `src/tests/phase04-shell-navigation-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0129: `src/design-system/components/Badge.tsx`

- **Directory:** `src/design-system/components`
- **Filename:** `Badge.tsx` (.tsx, 3,277 bytes)
- **Primary Purpose:** Atomic design system primitive or token definition
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (3):** `BadgeProps`, `BADGE_CONFIG`, `Badge`
- **Imports (4):** `react`, `lucide-react`, `../tokens`, `../types`
- **Consumers (33 files):** `src/components/assignments/EntityAssignmentsSection.tsx`, `src/components/common/DifficultyBadge.tsx`, `src/components/dashboard/ChannelPerformanceSection.tsx`, `src/components/dashboard/ContinueProductionCard.tsx`, `src/components/dashboard/WhatsWaitingSection.tsx`, `src/components/production/ProductionTable.tsx`, `src/components/publishing/PublishingTable.tsx`, `src/components/questions/QuestionTable.tsx` ... and 25 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0130: `src/design-system/components/Button.tsx`

- **Directory:** `src/design-system/components`
- **Filename:** `Button.tsx` (.tsx, 4,314 bytes)
- **Primary Purpose:** Atomic design system primitive or token definition
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `ButtonProps`, `Button`
- **Imports (4):** `react`, `lucide-react`, `../tokens`, `../types`
- **Consumers (51 files):** `src/components/common/Button.tsx`, `src/components/dashboard/ChannelPerformanceSection.tsx`, `src/components/dashboard/ContinueProductionCard.tsx`, `src/components/layout/ErrorBoundary.tsx`, `src/components/publishing/FinalizePublishingModal.tsx`, `src/components/publishing/PackageCopierModal.tsx`, `src/components/publishing/PublishScheduleModal.tsx`, `src/components/publishing/PublishingAssignmentModal.tsx` ... and 43 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0131: `src/design-system/components/Card.tsx`

- **Directory:** `src/design-system/components`
- **Filename:** `Card.tsx` (.tsx, 3,351 bytes)
- **Primary Purpose:** Atomic design system primitive or token definition
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (9):** `CardProps`, `Card`, `CardHeaderProps`, `CardHeader`, `CardTitleProps`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- **Imports (2):** `react`, `../tokens`
- **Consumers (23 files):** `src/components/common/StatCard.tsx`, `src/components/dashboard/ChannelPerformanceSection.tsx`, `src/components/dashboard/ContinueProductionCard.tsx`, `src/components/dashboard/OperationalDispatch.tsx`, `src/components/dashboard/WhatsWaitingSection.tsx`, `src/components/social/SocialReviewWorkspace.tsx`, `src/components/video/FinalReviewWorkspace.tsx`, `src/components/video/ScriptWorkspace.tsx` ... and 15 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0132: `src/design-system/components/EmptyState.tsx`

- **Directory:** `src/design-system/components`
- **Filename:** `EmptyState.tsx` (.tsx, 1,847 bytes)
- **Primary Purpose:** Atomic design system primitive or token definition
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `EmptyStateProps`, `EmptyState`
- **Imports (4):** `react`, `lucide-react`, `../tokens`, `./Button`
- **Consumers (14 files):** `src/components/common/EmptyState.tsx`, `src/pages/AnalyticsExperiencePage.tsx`, `src/pages/ProductionBoardPage.tsx`, `src/pages/ProductionTrackerPage.tsx`, `src/pages/QuestionImprovePage.tsx`, `src/pages/QuestionLibraryPage.tsx`, `src/pages/QuestionVerifyApprovePage.tsx`, `src/pages/QueuePage.tsx` ... and 6 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0133: `src/design-system/components/ErrorState.tsx`

- **Directory:** `src/design-system/components`
- **Filename:** `ErrorState.tsx` (.tsx, 2,705 bytes)
- **Primary Purpose:** Atomic design system primitive or token definition
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `ErrorStateProps`, `ErrorState`
- **Imports (3):** `lucide-react`, `../tokens`, `./Button`
- **Consumers (1 files):** `src/pages/DashboardPage.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0134: `src/design-system/components/Form.tsx`

- **Directory:** `src/design-system/components`
- **Filename:** `Form.tsx` (.tsx, 2,101 bytes)
- **Primary Purpose:** Atomic design system primitive or token definition
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (8):** `FormFieldProps`, `FormField`, `FormLabelProps`, `FormLabel`, `FormHelperText`, `FormErrorTextProps`, `FormErrorText`, `RequiredIndicator`
- **Imports (3):** `react`, `lucide-react`, `../tokens`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0135: `src/design-system/components/Icon.tsx`

- **Directory:** `src/design-system/components`
- **Filename:** `Icon.tsx` (.tsx, 750 bytes)
- **Primary Purpose:** Atomic design system primitive or token definition
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `IconProps`, `Icon`
- **Imports (4):** `react`, `lucide-react`, `../tokens`, `../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0136: `src/design-system/components/Input.tsx`

- **Directory:** `src/design-system/components`
- **Filename:** `Input.tsx` (.tsx, 4,753 bytes)
- **Primary Purpose:** Atomic design system primitive or token definition
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (4):** `InputProps`, `Input`, `TextareaProps`, `Textarea`
- **Imports (3):** `lucide-react`, `../tokens`, `../types`
- **Consumers (2 files):** `src/components/common/SearchInput.tsx`, `src/pages/QuestionLibraryPage.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0137: `src/design-system/components/Loading.tsx`

- **Directory:** `src/design-system/components`
- **Filename:** `Loading.tsx` (.tsx, 3,834 bytes)
- **Primary Purpose:** Atomic design system primitive or token definition
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (10):** `SpinnerProps`, `Spinner`, `PageLoadingProps`, `PageLoading`, `SectionLoadingProps`, `SectionLoading`, `CardLoading`, `ButtonLoading`, `SkeletonProps`, `Skeleton`
- **Imports (2):** `react`, `../tokens`
- **Consumers (10 files):** `src/components/common/LoadingState.tsx`, `src/pages/QuestionImprovePage.tsx`, `src/pages/QuestionVerifyApprovePage.tsx`, `src/pages/VideoCreateScriptPage.tsx`, `src/pages/VideoEditPage.tsx`, `src/pages/VideoFinalPage.tsx`, `src/pages/VideoPinnedCommentPage.tsx`, `src/pages/VideoRecordPage.tsx` ... and 2 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0138: `src/design-system/components/Modal.tsx`

- **Directory:** `src/design-system/components`
- **Filename:** `Modal.tsx` (.tsx, 4,974 bytes)
- **Primary Purpose:** Atomic design system primitive or token definition
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (4):** `ModalProps`, `Modal`, `ConfirmModalProps`, `ConfirmModal`
- **Imports (3):** `lucide-react`, `../tokens`, `./Button`
- **Consumers (14 files):** `src/components/assignments/EntityAssignmentsSection.tsx`, `src/components/common/Modal.tsx`, `src/components/publishing/FinalizePublishingModal.tsx`, `src/components/publishing/PackageCopierModal.tsx`, `src/components/publishing/PublishScheduleModal.tsx`, `src/components/publishing/PublishingAssignmentModal.tsx`, `src/components/publishing/RecordPublicationModal.tsx`, `src/components/publishing/RetryPlatformModal.tsx` ... and 6 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0139: `src/design-system/components/PageHeader.tsx`

- **Directory:** `src/design-system/components`
- **Filename:** `PageHeader.tsx` (.tsx, 2,732 bytes)
- **Primary Purpose:** Atomic design system primitive or token definition
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (3):** `BreadcrumbItem`, `PageHeaderProps`, `PageHeader`
- **Imports (4):** `react`, `lucide-react`, `react-router-dom`, `../tokens`
- **Consumers (28 files):** `src/components/layout/Layout.tsx`, `src/components/layout/PageHeader.tsx`, `src/design-system/components/AppBreadcrumbs.tsx`, `src/pages/AnalyticsExperiencePage.tsx`, `src/pages/ContentMasterPage.tsx`, `src/pages/MyWorkPage.tsx`, `src/pages/PlatformPackagesPage.tsx`, `src/pages/ProductionBoardPage.tsx` ... and 20 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0140: `src/design-system/components/Select.tsx`

- **Directory:** `src/design-system/components`
- **Filename:** `Select.tsx` (.tsx, 2,493 bytes)
- **Primary Purpose:** Atomic design system primitive or token definition
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (3):** `SelectOption`, `SelectProps`, `Select`
- **Imports (3):** `lucide-react`, `../tokens`, `../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0141: `src/design-system/components/StepIndicator.tsx`

- **Directory:** `src/design-system/components`
- **Filename:** `StepIndicator.tsx` (.tsx, 5,449 bytes)
- **Primary Purpose:** Atomic design system primitive or token definition
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (3):** `PRODUCTION_WORKFLOW_STEPS`, `StepIndicatorProps`, `StepIndicator`
- **Imports (5):** `react`, `lucide-react`, `../tokens`, `../types`, `../../lib/workflow/canonical-workflow`
- **Consumers (3 files):** `src/design-system/components/WorkflowStepNav.tsx`, `src/tests/phase04-shell-navigation-verification.ts`, `src/tests/phase12-final-ui-ux-acceptance-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0142: `src/design-system/components/SuccessState.tsx`

- **Directory:** `src/design-system/components`
- **Filename:** `SuccessState.tsx` (.tsx, 1,924 bytes)
- **Primary Purpose:** Atomic design system primitive or token definition
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `SuccessStateProps`, `SuccessState`
- **Imports (4):** `react`, `lucide-react`, `../tokens`, `./Button`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0143: `src/design-system/components/Table.tsx`

- **Directory:** `src/design-system/components`
- **Filename:** `Table.tsx` (.tsx, 6,006 bytes)
- **Primary Purpose:** Atomic design system primitive or token definition
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (14):** `TableProps`, `Table`, `TableHeader`, `TableHeadProps`, `TableHead`, `TableBody`, `TableRowProps`, `TableRow`, `TableCellProps`, `TableCell` ... and 4 more
- **Imports (4):** `react`, `lucide-react`, `../tokens`, `./Button`
- **Consumers (3 files):** `src/pages/ProductionTrackerPage.tsx`, `src/pages/QuestionLibraryPage.tsx`, `src/pages/QueuePage.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0144: `src/design-system/components/WorkflowStepNav.tsx`

- **Directory:** `src/design-system/components`
- **Filename:** `WorkflowStepNav.tsx` (.tsx, 5,782 bytes)
- **Primary Purpose:** Atomic design system primitive or token definition
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `WorkflowStepNavProps`, `WorkflowStepNav`
- **Imports (7):** `react`, `lucide-react`, `react-router-dom`, `./StepIndicator`, `../types`, `./Button`, `./Badge`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0145: `src/design-system/index.ts`

- **Directory:** `src/design-system`
- **Filename:** `index.ts` (.ts, 925 bytes)
- **Primary Purpose:** Atomic design system primitive or token definition
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (0):** None
- **Consumers (1 files):** `src/types/phase26-copilot.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0146: `src/design-system/tokens.ts`

- **Directory:** `src/design-system`
- **Filename:** `tokens.ts` (.ts, 8,124 bytes)
- **Primary Purpose:** Atomic design system primitive or token definition
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (7):** `COLOR_TOKENS`, `TYPOGRAPHY_TOKENS`, `SPACING_TOKENS`, `RADIUS_TOKENS`, `SHADOW_TOKENS`, `ICON_TOKENS`, `Z_INDEX_TOKENS`
- **Imports (0):** None
- **Consumers (16 files):** `src/design-system/components/Alert.tsx`, `src/design-system/components/Badge.tsx`, `src/design-system/components/Button.tsx`, `src/design-system/components/Card.tsx`, `src/design-system/components/EmptyState.tsx`, `src/design-system/components/ErrorState.tsx`, `src/design-system/components/Form.tsx`, `src/design-system/components/Icon.tsx` ... and 8 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0147: `src/design-system/types.ts`

- **Directory:** `src/design-system`
- **Filename:** `types.ts` (.ts, 843 bytes)
- **Primary Purpose:** Atomic design system primitive or token definition
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (9):** `ButtonVariant`, `ButtonSize`, `BadgeVariant`, `BadgeSize`, `AlertVariant`, `InputSize`, `IconSize`, `StepState`, `ProductionWorkflowStep`
- **Imports (2):** `react`, `lucide-react`
- **Consumers (370 files):** `scripts/seed-100-questions-e2e-workflow.ts`, `scripts/test-task-3b2-ui-e2e.ts`, `scripts/verify-task5.ts`, `src/components/assignments/AssignmentBadge.tsx`, `src/components/assignments/AssignmentModal.tsx`, `src/components/assignments/EntityAssignmentsSection.tsx`, `src/components/common/DifficultyBadge.tsx`, `src/components/common/StatusBadge.tsx` ... and 362 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0148: `src/index.css`

- **Directory:** `src`
- **Filename:** `index.css` (.css, 261 bytes)
- **Primary Purpose:** Application utility or helper module
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (1):** `tailwindcss`
- **Consumers (1 files):** `src/main.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0149: `src/lib/ai/config.ts`

- **Directory:** `src/lib/ai`
- **Filename:** `config.ts` (.ts, 1,368 bytes)
- **Primary Purpose:** Application utility or helper module
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `AIConfiguration`, `DEFAULT_AI_CONFIG`
- **Imports (0):** None
- **Consumers (18 files):** `src/lib/ai/gemini.service.ts`, `src/lib/ai/orchestrator.ts`, `src/lib/ai/registry.ts`, `src/lib/ai/validators/blind-verifier.ts`, `src/lib/ai/validators/semantic-reasoning.provider.ts`, `src/lib/services/durable-snapshot-archive.service.ts`, `src/lib/services/smart-random.service.ts`, `src/lib/services/snapshot-history.service.ts` ... and 10 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0150: `src/lib/ai/error.ts`

- **Directory:** `src/lib/ai`
- **Filename:** `error.ts` (.ts, 4,380 bytes)
- **Primary Purpose:** Application utility or helper module
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (5):** `AIErrorClassification`, `ClassifiedAIError`, `sanitizeKeyInMessage`, `classifyAIError`, `AIProviderError`
- **Imports (0):** None
- **Consumers (5 files):** `src/lib/ai/gemini.service.ts`, `src/lib/ai/orchestrator.ts`, `src/lib/ai/types.ts`, `src/lib/ai/validators/blind-verifier.ts`, `src/lib/validation/gemini-validation.provider.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0151: `src/lib/ai/gemini.client.ts`

- **Directory:** `src/lib/ai`
- **Filename:** `gemini.client.ts` (.ts, 1,682 bytes)
- **Primary Purpose:** Application utility or helper module
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `geminiClient`
- **Imports (1):** `@google/genai`
- **Consumers (17 files):** `scripts/test-task-3b2-ui-e2e.ts`, `src/lib/ai/gemini.service.ts`, `src/lib/ai/validators/blind-verifier.ts`, `src/lib/ai/validators/semantic-reasoning.provider.ts`, `src/lib/services/phase13-refinement.service.ts`, `src/lib/services/social-performance-intelligence.service.ts`, `src/lib/validation/gemini-validation.provider.ts`, `src/server/routes.ts` ... and 9 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: YES (@google/genai SDK)
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0152: `src/lib/ai/gemini.service.ts`

- **Directory:** `src/lib/ai`
- **Filename:** `gemini.service.ts` (.ts, 97,051 bytes)
- **Primary Purpose:** Application utility or helper module
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `GeminiService`, `geminiService`
- **Imports (33):** `./gemini.client`, `./config`, `./error`, `./registry`, `./schemas/question-candidate.schema`, `./schemas/script-generation.schema`, `./schemas/social-hook.schema`, `./schemas/teleprompter-script.schema` ... and 25 more
- **Consumers (14 files):** `scripts/test-task-3b2-ui-e2e.ts`, `src/lib/ai/phase24-orchestrator.service.ts`, `src/tests/phase-7-ai-generation-engine.ts`, `src/tests/phase13-live-verification.ts`, `src/tests/phase18-thumbnail-intelligence.ts`, `src/tests/phase4-verification.ts`, `src/tests/phase9-content-workflow-verification.ts`, `src/tests/qs14b-e2e-production-execution.ts` ... and 6 more
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: YES (@google/genai SDK)
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0153: `src/lib/ai/index.ts`

- **Directory:** `src/lib/ai`
- **Filename:** `index.ts` (.ts, 838 bytes)
- **Primary Purpose:** Application utility or helper module
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (0):** None
- **Consumers (1 files):** `src/types/phase26-copilot.ts`
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0154: `src/lib/ai/orchestrator.ts`

- **Directory:** `src/lib/ai`
- **Filename:** `orchestrator.ts` (.ts, 6,779 bytes)
- **Primary Purpose:** Application utility or helper module
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (3):** `OrchestratorOptions`, `AIOrchestrator`, `aiOrchestrator`
- **Imports (6):** `./registry`, `./types`, `./config`, `./error`, `../services/question-config.service`, `../../config/question-creation.config`
- **Consumers (4 files):** `src/tests/phase-7-ai-generation-engine.ts`, `src/tests/real-life-context-configuration.test.ts`, `src/tests/run-phase24-only.ts`, `src/tests/task6c-orchestrator-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0155: `src/lib/ai/phase24-orchestrator.service.ts`

- **Directory:** `src/lib/ai`
- **Filename:** `phase24-orchestrator.service.ts` (.ts, 16,409 bytes)
- **Primary Purpose:** Application utility or helper module
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (3):** `OrchestratorTaskOptions`, `Phase24AIOrchestrator`, `phase24AIOrchestrator`
- **Imports (10):** `../../types/phase24-ai`, `./types`, `./phase24-registry`, `../services/question-config.service`, `./gemini.service`, `./schemas/question-candidate.schema`, `./prompts/generation.prompt`, `../validators/question-creation.validator` ... and 2 more
- **Consumers (19 files):** `src/lib/services/comment-intelligence.service.ts`, `src/lib/services/content-strategy.service.ts`, `src/lib/services/phase13-refinement.service.ts`, `src/lib/services/phase15-script-production.service.ts`, `src/lib/services/phase18-thumbnail-intelligence.service.ts`, `src/lib/services/phase19-pinned-comment-intelligence.service.ts`, `src/lib/services/phase20-social-review.service.ts`, `src/lib/services/phase25-consensus.service.ts` ... and 11 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: YES (@google/genai SDK)
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0156: `src/lib/ai/phase24-registry.ts`

- **Directory:** `src/lib/ai`
- **Filename:** `phase24-registry.ts` (.ts, 3,809 bytes)
- **Primary Purpose:** Application utility or helper module
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `Phase24ProviderRegistry`, `phase24ProviderRegistry`
- **Imports (9):** `../../types/phase24-ai`, `./providers/gemini.adapter`, `./providers/openrouter.adapter`, `./providers/groq.adapter`, `./providers/mistral.adapter`, `./providers/cohere.adapter`, `./providers/huggingface.adapter`, `./providers/cerebras.adapter` ... and 1 more
- **Consumers (7 files):** `src/lib/ai/gemini.service.ts`, `src/lib/ai/orchestrator.ts`, `src/lib/ai/phase24-orchestrator.service.ts`, `src/lib/services/phase25-consensus.service.ts`, `src/tests/phase24-ai-orchestrator.ts`, `src/tests/run-phase25-only.ts`, `src/tests/run-phase26-only.ts`
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0157: `src/lib/ai/prompts/comment-intelligence.prompt.ts`

- **Directory:** `src/lib/ai/prompts`
- **Filename:** `comment-intelligence.prompt.ts` (.ts, 4,151 bytes)
- **Primary Purpose:** Structured LLM prompt template for comment-intelligence
- **Workflow Participation:** 15 Intelligence Loop (DIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (3):** `BURRA_PARIKSHA_COMMENT_INTELLIGENCE_SYSTEM_INSTRUCTION`, `BuildCommentIntelligencePromptInput`, `buildCommentIntelligencePrompt`
- **Imports (1):** `../../../types`
- **Consumers (2 files):** `src/lib/services/comment-intelligence.service.ts`, `src/tests/run-phase31-comment-intelligence.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0158: `src/lib/ai/prompts/generation.prompt.ts`

- **Directory:** `src/lib/ai/prompts`
- **Filename:** `generation.prompt.ts` (.ts, 11,351 bytes)
- **Primary Purpose:** Structured LLM prompt template for generation
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (3):** `sanitizePromptInput`, `BURRA_PARIKSHA_SYSTEM_INSTRUCTION`, `buildGenerationPrompt`
- **Imports (2):** `../../../types`, `../types`
- **Consumers (5 files):** `src/lib/ai/gemini.service.ts`, `src/lib/ai/phase24-orchestrator.service.ts`, `src/lib/ai/prompts/refinement.prompt.ts`, `src/tests/phase-7-ai-generation-engine.ts`, `src/tests/phase4-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0159: `src/lib/ai/prompts/performance-intelligence.prompt.ts`

- **Directory:** `src/lib/ai/prompts`
- **Filename:** `performance-intelligence.prompt.ts` (.ts, 4,997 bytes)
- **Primary Purpose:** Structured LLM prompt template for performance-intelligence
- **Workflow Participation:** 14 Performance Review (DIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `BURRA_PARIKSHA_PERFORMANCE_INTELLIGENCE_SYSTEM_INSTRUCTION`, `buildPerformanceIntelligencePrompt`
- **Imports (0):** None
- **Consumers (1 files):** `src/lib/services/social-performance-intelligence.service.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0160: `src/lib/ai/prompts/pinned-comment.prompt.ts`

- **Directory:** `src/lib/ai/prompts`
- **Filename:** `pinned-comment.prompt.ts` (.ts, 3,636 bytes)
- **Primary Purpose:** Structured LLM prompt template for pinned-comment
- **Workflow Participation:** 15 Intelligence Loop (DIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `BURRA_PARIKSHA_PINNED_COMMENT_SYSTEM_INSTRUCTION`, `buildPinnedCommentUserPrompt`
- **Imports (1):** `../../../types`
- **Consumers (1 files):** `src/lib/ai/gemini.service.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0161: `src/lib/ai/prompts/platform-adaptation.prompt.ts`

- **Directory:** `src/lib/ai/prompts`
- **Filename:** `platform-adaptation.prompt.ts` (.ts, 3,196 bytes)
- **Primary Purpose:** Structured LLM prompt template for platform-adaptation
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `buildPlatformAdaptationSystemPrompt`, `buildPlatformAdaptationUserPrompt`
- **Imports (1):** `../../../types`
- **Consumers (1 files):** `src/lib/ai/gemini.service.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0162: `src/lib/ai/prompts/refinement.prompt.ts`

- **Directory:** `src/lib/ai/prompts`
- **Filename:** `refinement.prompt.ts` (.ts, 5,501 bytes)
- **Primary Purpose:** Structured LLM prompt template for refinement
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `buildRefinementPrompt`
- **Imports (3):** `../../../types`, `../types`, `./generation.prompt`
- **Consumers (2 files):** `src/lib/ai/gemini.service.ts`, `src/tests/phase4-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0163: `src/lib/ai/prompts/script-generation.prompt.ts`

- **Directory:** `src/lib/ai/prompts`
- **Filename:** `script-generation.prompt.ts` (.ts, 4,429 bytes)
- **Primary Purpose:** Structured LLM prompt template for script-generation
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `BURRA_PARIKSHA_SCRIPT_SYSTEM_INSTRUCTION`, `buildTeluguScriptPrompt`
- **Imports (2):** `../../../types`, `../types`
- **Consumers (2 files):** `src/lib/ai/gemini.service.ts`, `src/lib/ai/prompts/refinement.prompt.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0164: `src/lib/ai/prompts/social-hook.prompt.ts`

- **Directory:** `src/lib/ai/prompts`
- **Filename:** `social-hook.prompt.ts` (.ts, 5,468 bytes)
- **Primary Purpose:** Structured LLM prompt template for social-hook
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `BURRA_PARIKSHA_SOCIAL_HOOK_SYSTEM_INSTRUCTION`, `buildSocialHookPrompt`
- **Imports (2):** `../../../types`, `../types`
- **Consumers (2 files):** `src/lib/ai/gemini.service.ts`, `src/tests/task8c-hook-presentation-engine-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0165: `src/lib/ai/prompts/social-metadata.prompt.ts`

- **Directory:** `src/lib/ai/prompts`
- **Filename:** `social-metadata.prompt.ts` (.ts, 4,789 bytes)
- **Primary Purpose:** Structured LLM prompt template for social-metadata
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `BURRA_PARIKSHA_SOCIAL_METADATA_SYSTEM_INSTRUCTION`, `buildSocialMetadataPrompt`
- **Imports (0):** None
- **Consumers (1 files):** `src/lib/ai/gemini.service.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0166: `src/lib/ai/prompts/social-quality.prompt.ts`

- **Directory:** `src/lib/ai/prompts`
- **Filename:** `social-quality.prompt.ts` (.ts, 5,560 bytes)
- **Primary Purpose:** Structured LLM prompt template for social-quality
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `buildSocialQualitySystemPrompt`, `buildSocialQualityUserPrompt`
- **Imports (1):** `../../../types`
- **Consumers (1 files):** `src/lib/ai/gemini.service.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0167: `src/lib/ai/prompts/teleprompter-script.prompt.ts`

- **Directory:** `src/lib/ai/prompts`
- **Filename:** `teleprompter-script.prompt.ts` (.ts, 6,608 bytes)
- **Primary Purpose:** Structured LLM prompt template for teleprompter-script
- **Workflow Participation:** 04 Teleprompter & Filming (DIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `BURRA_PARIKSHA_TELEPROMPTER_SCRIPT_SYSTEM_INSTRUCTION`, `buildTeleprompterScriptPrompt`
- **Imports (2):** `../../../types`, `../types`
- **Consumers (2 files):** `src/lib/ai/gemini.service.ts`, `src/tests/task8d-teleprompter-spoken-enhancer-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0168: `src/lib/ai/prompts/thumbnail-intelligence.prompt.ts`

- **Directory:** `src/lib/ai/prompts`
- **Filename:** `thumbnail-intelligence.prompt.ts` (.ts, 3,001 bytes)
- **Primary Purpose:** Structured LLM prompt template for thumbnail-intelligence
- **Workflow Participation:** 08 Thumbnail (DIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `BURRA_PARIKSHA_THUMBNAIL_SYSTEM_INSTRUCTION`, `buildThumbnailIntelligenceUserPrompt`
- **Imports (1):** `../../../types`
- **Consumers (1 files):** `src/lib/ai/gemini.service.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0169: `src/lib/ai/prompts/validation.prompt.ts`

- **Directory:** `src/lib/ai/prompts`
- **Filename:** `validation.prompt.ts` (.ts, 2,713 bytes)
- **Primary Purpose:** Structured LLM prompt template for validation
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `BURRA_PARIKSHA_VALIDATION_SYSTEM_INSTRUCTION`, `buildQuestionValidationPrompt`
- **Imports (0):** None
- **Consumers (1 files):** `src/lib/validation/gemini-validation.provider.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0170: `src/lib/ai/providers/base.adapter.ts`

- **Directory:** `src/lib/ai/providers`
- **Filename:** `base.adapter.ts` (.ts, 11,436 bytes)
- **Primary Purpose:** LLM provider adapter for base
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (1):** `../../../types/phase24-ai`
- **Consumers (9 files):** `src/lib/ai/providers/cerebras.adapter.ts`, `src/lib/ai/providers/cohere.adapter.ts`, `src/lib/ai/providers/experimental-labs.adapter.ts`, `src/lib/ai/providers/gemini.adapter.ts`, `src/lib/ai/providers/groq.adapter.ts`, `src/lib/ai/providers/huggingface.adapter.ts`, `src/lib/ai/providers/mistral.adapter.ts`, `src/lib/ai/providers/openrouter.adapter.ts` ... and 1 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0171: `src/lib/ai/providers/cerebras.adapter.ts`

- **Directory:** `src/lib/ai/providers`
- **Filename:** `cerebras.adapter.ts` (.ts, 2,125 bytes)
- **Primary Purpose:** LLM provider adapter for cerebras
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `CerebrasProviderAdapter`
- **Imports (2):** `../../../types/phase24-ai`, `./base.adapter`
- **Consumers (2 files):** `src/lib/ai/phase24-registry.ts`, `src/tests/phase24-ai-orchestrator.ts`
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0172: `src/lib/ai/providers/cohere.adapter.ts`

- **Directory:** `src/lib/ai/providers`
- **Filename:** `cohere.adapter.ts` (.ts, 2,118 bytes)
- **Primary Purpose:** LLM provider adapter for cohere
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `CohereProviderAdapter`
- **Imports (2):** `../../../types/phase24-ai`, `./base.adapter`
- **Consumers (2 files):** `src/lib/ai/phase24-registry.ts`, `src/tests/phase24-ai-orchestrator.ts`
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0173: `src/lib/ai/providers/experimental-labs.adapter.ts`

- **Directory:** `src/lib/ai/providers`
- **Filename:** `experimental-labs.adapter.ts` (.ts, 2,497 bytes)
- **Primary Purpose:** LLM provider adapter for experimental-labs
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `ExperimentalLabsProviderAdapter`
- **Imports (2):** `../../../types/phase24-ai`, `./base.adapter`
- **Consumers (2 files):** `src/lib/ai/phase24-registry.ts`, `src/tests/phase24-ai-orchestrator.ts`
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0174: `src/lib/ai/providers/gemini.adapter.ts`

- **Directory:** `src/lib/ai/providers`
- **Filename:** `gemini.adapter.ts` (.ts, 2,307 bytes)
- **Primary Purpose:** LLM provider adapter for gemini
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `GeminiProviderAdapter`
- **Imports (3):** `@google/genai`, `../../../types/phase24-ai`, `./base.adapter`
- **Consumers (3 files):** `src/lib/ai/phase24-registry.ts`, `src/tests/phase24-ai-orchestrator.ts`, `src/tests/qs-repair-regression.test.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: YES (@google/genai SDK)
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0175: `src/lib/ai/providers/groq.adapter.ts`

- **Directory:** `src/lib/ai/providers`
- **Filename:** `groq.adapter.ts` (.ts, 2,158 bytes)
- **Primary Purpose:** LLM provider adapter for groq
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `GroqProviderAdapter`
- **Imports (2):** `../../../types/phase24-ai`, `./base.adapter`
- **Consumers (2 files):** `src/lib/ai/phase24-registry.ts`, `src/tests/phase24-ai-orchestrator.ts`
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0176: `src/lib/ai/providers/huggingface.adapter.ts`

- **Directory:** `src/lib/ai/providers`
- **Filename:** `huggingface.adapter.ts` (.ts, 2,451 bytes)
- **Primary Purpose:** LLM provider adapter for huggingface
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `HuggingFaceProviderAdapter`
- **Imports (2):** `../../../types/phase24-ai`, `./base.adapter`
- **Consumers (2 files):** `src/lib/ai/phase24-registry.ts`, `src/tests/phase24-ai-orchestrator.ts`
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0177: `src/lib/ai/providers/mistral.adapter.ts`

- **Directory:** `src/lib/ai/providers`
- **Filename:** `mistral.adapter.ts` (.ts, 2,182 bytes)
- **Primary Purpose:** LLM provider adapter for mistral
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `MistralProviderAdapter`
- **Imports (2):** `../../../types/phase24-ai`, `./base.adapter`
- **Consumers (2 files):** `src/lib/ai/phase24-registry.ts`, `src/tests/phase24-ai-orchestrator.ts`
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0178: `src/lib/ai/providers/openrouter.adapter.ts`

- **Directory:** `src/lib/ai/providers`
- **Filename:** `openrouter.adapter.ts` (.ts, 2,342 bytes)
- **Primary Purpose:** LLM provider adapter for openrouter
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `OpenRouterProviderAdapter`
- **Imports (2):** `../../../types/phase24-ai`, `./base.adapter`
- **Consumers (2 files):** `src/lib/ai/phase24-registry.ts`, `src/tests/phase24-ai-orchestrator.ts`
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0179: `src/lib/ai/providers/xai.client.ts`

- **Directory:** `src/lib/ai/providers`
- **Filename:** `xai.client.ts` (.ts, 1,384 bytes)
- **Primary Purpose:** LLM provider adapter for xai.client.ts
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (3):** `XAIClientConfig`, `XAIClientWrapper`, `xaiClient`
- **Imports (0):** None
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0180: `src/lib/ai/registry.ts`

- **Directory:** `src/lib/ai`
- **Filename:** `registry.ts` (.ts, 2,625 bytes)
- **Primary Purpose:** Application utility or helper module
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `AIProviderRegistry`, `aiProviderRegistry`
- **Imports (2):** `./types`, `./config`
- **Consumers (9 files):** `src/lib/ai/gemini.service.ts`, `src/lib/ai/orchestrator.ts`, `src/lib/ai/phase24-orchestrator.service.ts`, `src/lib/services/phase25-consensus.service.ts`, `src/tests/phase-7-ai-generation-engine.ts`, `src/tests/phase24-ai-orchestrator.ts`, `src/tests/run-phase25-only.ts`, `src/tests/run-phase26-only.ts` ... and 1 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0181: `src/lib/ai/schemas/comment-intelligence.schema.ts`

- **Directory:** `src/lib/ai/schemas`
- **Filename:** `comment-intelligence.schema.ts` (.ts, 8,236 bytes)
- **Primary Purpose:** Zod structured output schema for comment-intelligence
- **Workflow Participation:** 15 Intelligence Loop (DIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (3):** `CommentIntelligenceGenAISchema`, `CommentIntelligenceZodSchema`, `CommentIntelligenceAIOutput`
- **Imports (2):** `@google/genai`, `zod`
- **Consumers (2 files):** `src/lib/services/comment-intelligence.service.ts`, `src/tests/run-phase31-comment-intelligence.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: YES (@google/genai SDK)
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0182: `src/lib/ai/schemas/performance-intelligence.schema.ts`

- **Directory:** `src/lib/ai/schemas`
- **Filename:** `performance-intelligence.schema.ts` (.ts, 6,443 bytes)
- **Primary Purpose:** Zod structured output schema for performance-intelligence
- **Workflow Participation:** 14 Performance Review (DIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (3):** `PerformanceIntelligenceGenAISchema`, `PerformanceIntelligenceZodSchema`, `PerformanceIntelligenceAIOutput`
- **Imports (2):** `@google/genai`, `zod`
- **Consumers (1 files):** `src/lib/services/social-performance-intelligence.service.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: YES (@google/genai SDK)
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0183: `src/lib/ai/schemas/pinned-comment.schema.ts`

- **Directory:** `src/lib/ai/schemas`
- **Filename:** `pinned-comment.schema.ts` (.ts, 1,967 bytes)
- **Primary Purpose:** Zod structured output schema for pinned-comment
- **Workflow Participation:** 15 Intelligence Loop (DIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (3):** `AiPinnedCommentPackageZodSchema`, `ValidatedPinnedCommentPackagePayload`, `GenAiPinnedCommentPackageResponseSchema`
- **Imports (2):** `zod`, `./question-candidate.schema`
- **Consumers (1 files):** `src/lib/ai/gemini.service.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0184: `src/lib/ai/schemas/platform-adaptation.schema.ts`

- **Directory:** `src/lib/ai/schemas`
- **Filename:** `platform-adaptation.schema.ts` (.ts, 3,822 bytes)
- **Primary Purpose:** Zod structured output schema for platform-adaptation
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `PlatformAdaptedVariantGenAISchema`, `PlatformAdaptedVariantZodSchema`
- **Imports (2):** `@google/genai`, `zod`
- **Consumers (1 files):** `src/lib/ai/gemini.service.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: YES (@google/genai SDK)
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0185: `src/lib/ai/schemas/question-candidate.schema.ts`

- **Directory:** `src/lib/ai/schemas`
- **Filename:** `question-candidate.schema.ts` (.ts, 4,105 bytes)
- **Primary Purpose:** Zod structured output schema for question-candidate
- **Workflow Participation:** 01 Question Generation (DIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (4):** `SchemaType`, `QuestionCandidateZodSchema`, `ValidatedCandidatePayload`, `GenAiQuestionCandidateResponseSchema`
- **Imports (2):** `zod`, `../../../types`
- **Consumers (14 files):** `src/lib/ai/gemini.service.ts`, `src/lib/ai/phase24-orchestrator.service.ts`, `src/lib/ai/schemas/pinned-comment.schema.ts`, `src/lib/ai/schemas/script-generation.schema.ts`, `src/lib/ai/schemas/social-hook.schema.ts`, `src/lib/ai/schemas/teleprompter-script.schema.ts`, `src/lib/ai/schemas/thumbnail-intelligence.schema.ts`, `src/lib/ai/schemas/validation.schema.ts` ... and 6 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: YES (@google/genai SDK)
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0186: `src/lib/ai/schemas/script-generation.schema.ts`

- **Directory:** `src/lib/ai/schemas`
- **Filename:** `script-generation.schema.ts` (.ts, 3,013 bytes)
- **Primary Purpose:** Zod structured output schema for script-generation
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (3):** `TeluguScriptZodSchema`, `ValidatedScriptPayload`, `GenAiTeluguScriptResponseSchema`
- **Imports (2):** `zod`, `./question-candidate.schema`
- **Consumers (2 files):** `src/lib/ai/gemini.service.ts`, `src/lib/ai/validators/script.validator.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: YES (@google/genai SDK)
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0187: `src/lib/ai/schemas/social-hook.schema.ts`

- **Directory:** `src/lib/ai/schemas`
- **Filename:** `social-hook.schema.ts` (.ts, 4,670 bytes)
- **Primary Purpose:** Zod structured output schema for social-hook
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (5):** `SocialHookVariantZodSchema`, `SocialPresentationStrategyZodSchema`, `SocialHookAndStrategyZodSchema`, `ValidatedSocialHookPayload`, `GenAiSocialHookResponseSchema`
- **Imports (3):** `zod`, `../../../types`, `./question-candidate.schema`
- **Consumers (2 files):** `src/lib/ai/gemini.service.ts`, `src/tests/task8c-hook-presentation-engine-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0188: `src/lib/ai/schemas/social-metadata.schema.ts`

- **Directory:** `src/lib/ai/schemas`
- **Filename:** `social-metadata.schema.ts` (.ts, 3,124 bytes)
- **Primary Purpose:** Zod structured output schema for social-metadata
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (3):** `SocialMetadataGenAISchema`, `SocialMetadataZodSchema`, `SocialMetadataAIResult`
- **Imports (2):** `@google/genai`, `zod`
- **Consumers (2 files):** `src/lib/ai/gemini.service.ts`, `src/tests/task8e-social-metadata-generator-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: YES (@google/genai SDK)
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0189: `src/lib/ai/schemas/social-quality.schema.ts`

- **Directory:** `src/lib/ai/schemas`
- **Filename:** `social-quality.schema.ts` (.ts, 5,175 bytes)
- **Primary Purpose:** Zod structured output schema for social-quality
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (3):** `SocialQualityAssessmentGenAISchema`, `SocialQualityAssessmentZodSchema`, `SocialQualityAssessmentAIOutput`
- **Imports (2):** `@google/genai`, `zod`
- **Consumers (1 files):** `src/lib/ai/gemini.service.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: YES (@google/genai SDK)
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0190: `src/lib/ai/schemas/teleprompter-script.schema.ts`

- **Directory:** `src/lib/ai/schemas`
- **Filename:** `teleprompter-script.schema.ts` (.ts, 3,518 bytes)
- **Primary Purpose:** Zod structured output schema for teleprompter-script
- **Workflow Participation:** 04 Teleprompter & Filming (DIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (5):** `TeleprompterSegmentSectionEnum`, `TeleprompterSegmentZodSchema`, `TeleprompterScriptZodSchema`, `ValidatedTeleprompterScriptPayload`, `GenAiTeleprompterScriptResponseSchema`
- **Imports (2):** `zod`, `./question-candidate.schema`
- **Consumers (2 files):** `src/lib/ai/gemini.service.ts`, `src/tests/task8d-teleprompter-spoken-enhancer-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0191: `src/lib/ai/schemas/thumbnail-intelligence.schema.ts`

- **Directory:** `src/lib/ai/schemas`
- **Filename:** `thumbnail-intelligence.schema.ts` (.ts, 4,731 bytes)
- **Primary Purpose:** Zod structured output schema for thumbnail-intelligence
- **Workflow Participation:** 08 Thumbnail (DIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (4):** `AiThumbnailConceptZodSchema`, `AiThumbnailIntelligenceResponseZodSchema`, `ValidatedThumbnailConceptsPayload`, `GenAiThumbnailIntelligenceResponseSchema`
- **Imports (2):** `zod`, `./question-candidate.schema`
- **Consumers (1 files):** `src/lib/ai/gemini.service.ts`
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0192: `src/lib/ai/schemas/validation.schema.ts`

- **Directory:** `src/lib/ai/schemas`
- **Filename:** `validation.schema.ts` (.ts, 1,467 bytes)
- **Primary Purpose:** Zod structured output schema for validation
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `GenAiValidationResponseSchema`
- **Imports (1):** `./question-candidate.schema`
- **Consumers (1 files):** `src/lib/validation/gemini-validation.provider.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0193: `src/lib/ai/testing/mock-provider.ts`

- **Directory:** `src/lib/ai/testing`
- **Filename:** `mock-provider.ts` (.ts, 5,100 bytes)
- **Primary Purpose:** Application utility or helper module
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `MockOutcome`, `MockAIProvider`
- **Imports (2):** `../types`, `../../../types`
- **Consumers (2 files):** `src/tests/phase-7-ai-generation-engine.ts`, `src/tests/task6c-orchestrator-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0194: `src/lib/ai/types.ts`

- **Directory:** `src/lib/ai`
- **Filename:** `types.ts` (.ts, 3,692 bytes)
- **Primary Purpose:** Application utility or helper module
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (9):** `AiRefinementAction`, `GenerateCandidateInput`, `QuestionCandidate`, `RefineCandidateInput`, `GenerationMetadata`, `GenerationResult`, `AIProviderOptions`, `ScriptGenerationResult`, `AIProvider`
- **Imports (4):** `../../types`, `./validators/candidate.validator`, `./error`, `./validators/mathematical.validator`
- **Consumers (369 files):** `scripts/seed-100-questions-e2e-workflow.ts`, `scripts/test-task-3b2-ui-e2e.ts`, `scripts/verify-task5.ts`, `src/components/assignments/AssignmentBadge.tsx`, `src/components/assignments/AssignmentModal.tsx`, `src/components/assignments/EntityAssignmentsSection.tsx`, `src/components/common/DifficultyBadge.tsx`, `src/components/common/StatusBadge.tsx` ... and 361 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0195: `src/lib/ai/validators/blind-verifier.ts`

- **Directory:** `src/lib/ai/validators`
- **Filename:** `blind-verifier.ts` (.ts, 27,129 bytes)
- **Primary Purpose:** Linguistic/orthographic semantic validator for Telugu and math
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (13):** `EquivalentRepresentation`, `BlindVerificationRequest`, `BlindVerificationDerivedResult`, `BlindVerifierProvider`, `BURRA_PARIKSHA_BLIND_SOLVER_SYSTEM_INSTRUCTION`, `GenAiBlindSolverResponseSchema`, `cleanNumber`, `getDirection`, `extractBaseAmounts`, `optionMatchesValue` ... and 3 more
- **Imports (6):** `../../../types`, `../types`, `../gemini.client`, `../config`, `../error`, `./mathematical.validator`
- **Consumers (7 files):** `src/lib/ai/gemini.service.ts`, `src/lib/ai/validators/candidate.validator.ts`, `src/lib/validation/multi-layer-verification.engine.ts`, `src/tests/hybrid-math-boundary.test.ts`, `src/tests/integration-semantic.test.ts`, `src/tests/qs18b-blind-math-verification.test.ts`, `src/tests/qs21b-mathematical-safety-gate.test.ts`
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: YES (@google/genai SDK)
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0196: `src/lib/ai/validators/candidate.validator.ts`

- **Directory:** `src/lib/ai/validators`
- **Filename:** `candidate.validator.ts` (.ts, 14,651 bytes)
- **Primary Purpose:** Linguistic/orthographic semantic validator for Telugu and math
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `CandidateValidationReport`, `CandidateValidator`
- **Imports (5):** `../schemas/question-candidate.schema`, `../types`, `../../../types`, `./mathematical.validator`, `./blind-verifier`
- **Consumers (17 files):** `scripts/test-task-3b2-ui-e2e.ts`, `src/lib/ai/gemini.service.ts`, `src/lib/ai/types.ts`, `src/pages/QuestionDetailPage.tsx`, `src/pages/QuestionImprovePage.tsx`, `src/pages/QuestionStudioPage.tsx`, `src/tests/phase-7-ai-generation-engine.ts`, `src/tests/phase4-verification.ts` ... and 9 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0197: `src/lib/ai/validators/mathematical.validator.ts`

- **Directory:** `src/lib/ai/validators`
- **Filename:** `mathematical.validator.ts` (.ts, 37,540 bytes)
- **Primary Purpose:** Linguistic/orthographic semantic validator for Telugu and math
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (3):** `MathVerificationStatus`, `MathVerificationResult`, `MathematicalValidator`
- **Imports (1):** `../types`
- **Consumers (9 files):** `scripts/test-task-3b2-ui-e2e.ts`, `src/lib/ai/types.ts`, `src/lib/ai/validators/blind-verifier.ts`, `src/lib/ai/validators/candidate.validator.ts`, `src/lib/services/phase13-refinement.service.ts`, `src/pages/QuestionStudioPage.tsx`, `src/tests/qs-successive-percentage-math.test.ts`, `src/tests/qs18b-blind-math-verification.test.ts` ... and 1 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0198: `src/lib/ai/validators/script.validator.ts`

- **Directory:** `src/lib/ai/validators`
- **Filename:** `script.validator.ts` (.ts, 4,321 bytes)
- **Primary Purpose:** Linguistic/orthographic semantic validator for Telugu and math
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `ScriptValidationReport`, `ScriptValidator`
- **Imports (2):** `../schemas/script-generation.schema`, `../../services/script.service`
- **Consumers (3 files):** `src/lib/ai/gemini.service.ts`, `src/lib/services/phase15-script-production.service.ts`, `src/tests/task6-telugu-script-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0199: `src/lib/ai/validators/semantic-reasoning.provider.ts`

- **Directory:** `src/lib/ai/validators`
- **Filename:** `semantic-reasoning.provider.ts` (.ts, 5,896 bytes)
- **Primary Purpose:** Linguistic/orthographic semantic validator for Telugu and math
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `SemanticReasoningProvider`
- **Imports (3):** `../../../types`, `../gemini.client`, `../config`
- **Consumers (3 files):** `src/lib/validation/question-validation.engine.ts`, `src/tests/integration-semantic.test.ts`, `src/tests/semantic-verification.test.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: YES (@google/genai SDK)
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0200: `src/lib/ai/verifier/arbitration.ts`

- **Directory:** `src/lib/ai/verifier`
- **Filename:** `arbitration.ts` (.ts, 2,094 bytes)
- **Primary Purpose:** Application utility or helper module
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (4):** `ArbitrationInput`, `ArbitrationResult`, `ArbitrationEngine`, `arbitrationEngine`
- **Imports (1):** `../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0201: `src/lib/api-client.ts`

- **Directory:** `src/lib`
- **Filename:** `api-client.ts` (.ts, 59,462 bytes)
- **Primary Purpose:** Application utility or helper module
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (4):** `ApiResponse`, `RecoveryStatusResponse`, `SnapshotHistoryItem`, `apiClient`
- **Imports (3):** `./schemas/google-sheets-schema`, `../types`, `./ai/types`
- **Consumers (59 files):** `src/components/assignments/AssignmentModal.tsx`, `src/components/assignments/EntityAssignmentsSection.tsx`, `src/components/dashboard/GlobalSearchBar.tsx`, `src/components/layout/NotificationsMenu.tsx`, `src/components/layout/SystemHealthIndicator.tsx`, `src/components/publishing/FinalizePublishingModal.tsx`, `src/components/publishing/PackageCopierModal.tsx`, `src/components/publishing/PublishScheduleModal.tsx` ... and 51 more
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0202: `src/lib/google-sheets/client.ts`

- **Directory:** `src/lib/google-sheets`
- **Filename:** `client.ts` (.ts, 38,064 bytes)
- **Primary Purpose:** Google Sheets API client, rate limiting, and error types
- **Workflow Participation:** NONE
- **Risk Level:** **CRITICAL** (Core system driver with direct mutations to production external infrastructure)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (10):** `GoogleSheetsConfig`, `RetryOptions`, `OperationalTelemetry`, `RateLimiterConfig`, `RateLimiterStats`, `isRateLimitError`, `RequestPressureLimiter`, `calculateBackoffDelay`, `GoogleSheetsClient`, `googleSheetsClient`
- **Imports (4):** `googleapis`, `./errors`, `./helpers`, `../services/deletion-safety.service`
- **Consumers (113 files):** `scripts/cleanup-and-migrate-users.ts`, `scripts/phase-b-launch-reset.ts`, `scripts/purge-test-data-for-production.ts`, `scripts/restore-sequences-phase-e.ts`, `scripts/test-task-3b2-ui-e2e.ts`, `src/components/assignments/AssignmentModal.tsx`, `src/components/assignments/EntityAssignmentsSection.tsx`, `src/components/dashboard/GlobalSearchBar.tsx` ... and 105 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0203: `src/lib/google-sheets/errors.ts`

- **Directory:** `src/lib/google-sheets`
- **Filename:** `errors.ts` (.ts, 9,719 bytes)
- **Primary Purpose:** Google Sheets API client, rate limiting, and error types
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (23):** `GoogleSheetsError`, `GoogleAuthError`, `SpreadsheetNotFoundError`, `WorksheetNotFoundError`, `MissingHeaderError`, `SchemaMismatchError`, `ReferenceIntegrityError`, `ValidationError`, `IdempotencyConflictError`, `NotFoundError` ... and 13 more
- **Imports (0):** None
- **Consumers (60 files):** `src/config/media-upload.config.ts`, `src/lib/google-sheets/client.ts`, `src/lib/google-sheets/helpers.ts`, `src/lib/repositories/base.repository.ts`, `src/lib/repositories/content-masters.repository.ts`, `src/lib/repositories/questions.repository.ts`, `src/lib/repositories/sequences.repository.ts`, `src/lib/services/audit.service.ts` ... and 52 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0204: `src/lib/google-sheets/helpers.ts`

- **Directory:** `src/lib/google-sheets`
- **Filename:** `helpers.ts` (.ts, 14,449 bytes)
- **Primary Purpose:** Google Sheets API client, rate limiting, and error types
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (8):** `colIndexToA1Letter`, `sanitizeSpreadsheetCellValue`, `unescapeSpreadsheetCellValue`, `parseCellValue`, `formatCellValue`, `rowToObject`, `objectToRow`, `validateWorksheetHeaders`
- **Imports (2):** `../schemas/google-sheets-schema`, `./errors`
- **Consumers (11 files):** `src/lib/google-sheets/client.ts`, `src/lib/repositories/base.repository.ts`, `src/lib/services/publishing.service.ts`, `src/lib/services/spreadsheet-verification.service.ts`, `src/tests/execute-phase-4a-topics.ts`, `src/tests/execute-phase-4b1-subtopics.ts`, `src/tests/phase-5-question-model.ts`, `src/tests/phase13-step2-retry-logic.ts` ... and 3 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0205: `src/lib/mock-data/dashboard.ts`

- **Directory:** `src/lib/mock-data`
- **Filename:** `dashboard.ts` (.ts, 4,361 bytes)
- **Primary Purpose:** Application utility or helper module
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (7):** `MOCK_DASHBOARD_METRICS`, `TaskItem`, `MOCK_TODAYS_WORK`, `ActivityLogItem`, `MOCK_RECENT_ACTIVITY`, `DelayedContentAlert`, `MOCK_DELAYED_CONTENT`
- **Imports (1):** `../../types`
- **Consumers (1 files):** `src/tests/run-phase23-only.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0206: `src/lib/mock-data/index.ts`

- **Directory:** `src/lib/mock-data`
- **Filename:** `index.ts` (.ts, 1,007 bytes)
- **Primary Purpose:** Application utility or helper module
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (4):** `getQuestionById`, `getVideoById`, `getTopicsByCategoryId`, `getSubtopicsByTopicId`
- **Imports (3):** `./questions`, `./production`, `./taxonomy`
- **Consumers (1 files):** `src/types/phase26-copilot.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0207: `src/lib/mock-data/production.ts`

- **Directory:** `src/lib/mock-data`
- **Filename:** `production.ts` (.ts, 4,613 bytes)
- **Primary Purpose:** Application utility or helper module
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `MOCK_VIDEOS`
- **Imports (1):** `../../types`
- **Consumers (1 files):** `src/lib/mock-data/index.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0208: `src/lib/mock-data/publishing.ts`

- **Directory:** `src/lib/mock-data`
- **Filename:** `publishing.ts` (.ts, 3,423 bytes)
- **Primary Purpose:** Application utility or helper module
- **Workflow Participation:** 11 Published (DIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `MOCK_PUBLISHING_RECORDS`
- **Imports (1):** `../../types`
- **Consumers (1 files):** `src/lib/repositories/publishing.repository.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0209: `src/lib/mock-data/questions.ts`

- **Directory:** `src/lib/mock-data`
- **Filename:** `questions.ts` (.ts, 12,310 bytes)
- **Primary Purpose:** Application utility or helper module
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `MOCK_QUESTIONS`
- **Imports (1):** `../../types`
- **Consumers (2 files):** `src/lib/mock-data/index.ts`, `src/lib/repositories/questions.repository.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0210: `src/lib/mock-data/queue.ts`

- **Directory:** `src/lib/mock-data`
- **Filename:** `queue.ts` (.ts, 3,271 bytes)
- **Primary Purpose:** Application utility or helper module
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `QueueItemView`, `MOCK_QUEUE`
- **Imports (1):** `../../types`
- **Consumers (1 files):** `src/lib/repositories/videos.repository.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0211: `src/lib/mock-data/taxonomy.ts`

- **Directory:** `src/lib/mock-data`
- **Filename:** `taxonomy.ts` (.ts, 4,437 bytes)
- **Primary Purpose:** Application utility or helper module
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (3):** `MOCK_CATEGORIES`, `MOCK_TOPICS`, `MOCK_SUBTOPICS`
- **Imports (1):** `../../types`
- **Consumers (6 files):** `src/lib/mock-data/index.ts`, `src/lib/repositories/categories.repository.ts`, `src/lib/repositories/subtopics.repository.ts`, `src/lib/repositories/topics.repository.ts`, `src/lib/services/production-sheet-initializer.service.ts`, `src/pages/SettingsPage.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0212: `src/lib/ownership/data-ownership.ts`

- **Directory:** `src/lib/ownership`
- **Filename:** `data-ownership.ts` (.ts, 8,632 bytes)
- **Primary Purpose:** Data ownership matrix and RBAC operation safety gate
- **Workflow Participation:** NONE
- **Risk Level:** **HIGH** (Core business state machine and RBAC safety gates governing production data mutations)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (5):** `FieldSemanticRole`, `resolveContentMasterId`, `isCanonicalDomainId`, `EntityOwnershipContract`, `ENTITY_OWNERSHIP_MATRIX`
- **Imports (1):** `../schemas/google-sheets-schema`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0213: `src/lib/ownership/index.ts`

- **Directory:** `src/lib/ownership`
- **Filename:** `index.ts` (.ts, 172 bytes)
- **Primary Purpose:** Data ownership matrix and RBAC operation safety gate
- **Workflow Participation:** NONE
- **Risk Level:** **HIGH** (Core business state machine and RBAC safety gates governing production data mutations)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (0):** None
- **Consumers (1 files):** `src/types/phase26-copilot.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0214: `src/lib/repositories/analytics.repository.ts`

- **Directory:** `src/lib/repositories`
- **Filename:** `analytics.repository.ts` (.ts, 5,225 bytes)
- **Primary Purpose:** Data access repository for analytics worksheet
- **Workflow Participation:** 13 Analytics (DIRECT)
- **Risk Level:** **HIGH** (Direct data access layer writing/reading Google Sheets worksheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `AnalyticsRepository`, `analyticsRepository`
- **Imports (3):** `./base.repository`, `../schemas/google-sheets-schema`, `../../types`
- **Consumers (8 files):** `scripts/restore-sequences-phase-e.ts`, `src/lib/repositories/sequences.repository.ts`, `src/lib/services/analytics.service.ts`, `src/tests/phase27-social-analytics-verification.ts`, `src/tests/run-phase27-only.ts`, `src/tests/run-phase32-c4-feedback-loop.ts`, `src/tests/test-isolation-safety-gate.test.ts`, `src/tests/verify-social-analytics-ui.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0215: `src/lib/repositories/assignments.repository.ts`

- **Directory:** `src/lib/repositories`
- **Filename:** `assignments.repository.ts` (.ts, 4,008 bytes)
- **Primary Purpose:** Data access repository for assignments worksheet
- **Workflow Participation:** NONE
- **Risk Level:** **HIGH** (Direct data access layer writing/reading Google Sheets worksheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `AssignmentsRepository`, `assignmentsRepository`
- **Imports (3):** `./base.repository`, `../schemas/google-sheets-schema`, `../../types`
- **Consumers (19 files):** `scripts/restore-sequences-phase-e.ts`, `src/lib/repositories/sequences.repository.ts`, `src/lib/services/object-auth.service.ts`, `src/lib/services/publishing.service.ts`, `src/lib/services/workflow-orchestration.service.ts`, `src/tests/execute-testdata-cleanup.ts`, `src/tests/phase10-verification.ts`, `src/tests/phase13-8-assignment-race-remediation.ts` ... and 11 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0216: `src/lib/repositories/audit-log.repository.ts`

- **Directory:** `src/lib/repositories`
- **Filename:** `audit-log.repository.ts` (.ts, 13,048 bytes)
- **Primary Purpose:** Data access repository for audit-log worksheet
- **Workflow Participation:** NONE
- **Risk Level:** **HIGH** (Direct data access layer writing/reading Google Sheets worksheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (5):** `AuditLogRepository`, `UserSessionState`, `UsersRepository`, `auditLogRepository`, `usersRepository`
- **Imports (3):** `./base.repository`, `../schemas/google-sheets-schema`, `../../types`
- **Consumers (37 files):** `scripts/restore-sequences-phase-e.ts`, `src/lib/services/analytics.service.ts`, `src/lib/services/comment-intelligence.service.ts`, `src/lib/services/content-strategy.service.ts`, `src/lib/services/publishing.service.ts`, `src/lib/services/social-comments.service.ts`, `src/lib/services/social-performance-intelligence.service.ts`, `src/lib/services/social-review.service.ts` ... and 29 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0217: `src/lib/repositories/base.repository.ts`

- **Directory:** `src/lib/repositories`
- **Filename:** `base.repository.ts` (.ts, 22,059 bytes)
- **Primary Purpose:** Data access repository for base worksheet
- **Workflow Participation:** NONE
- **Risk Level:** **HIGH** (Direct data access layer writing/reading Google Sheets worksheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (5):** `../schemas/google-sheets-schema`, `../google-sheets/client`, `../google-sheets/helpers`, `../google-sheets/errors`, `../services/deletion-safety.service`
- **Consumers (29 files):** `scripts/restore-sequences-phase-e.ts`, `src/lib/repositories/analytics.repository.ts`, `src/lib/repositories/assignments.repository.ts`, `src/lib/repositories/audit-log.repository.ts`, `src/lib/repositories/categories.repository.ts`, `src/lib/repositories/comment-intelligence.repository.ts`, `src/lib/repositories/content-batches.repository.ts`, `src/lib/repositories/content-masters.repository.ts` ... and 21 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0218: `src/lib/repositories/categories.repository.ts`

- **Directory:** `src/lib/repositories`
- **Filename:** `categories.repository.ts` (.ts, 1,130 bytes)
- **Primary Purpose:** Data access repository for categories worksheet
- **Workflow Participation:** NONE
- **Risk Level:** **HIGH** (Direct data access layer writing/reading Google Sheets worksheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `CategoriesRepository`, `categoriesRepository`
- **Imports (4):** `./base.repository`, `../schemas/google-sheets-schema`, `../../types`, `../mock-data/taxonomy`
- **Consumers (9 files):** `scripts/restore-sequences-phase-e.ts`, `src/lib/repositories/sequences.repository.ts`, `src/lib/services/production-sheet-initializer.service.ts`, `src/tests/execute-testdata-cleanup.ts`, `src/tests/live-production-verification.ts`, `src/tests/phase6-verification.ts`, `src/tests/task3d3-review-workflow-verification.ts`, `src/tests/task3d4-script-designer-workflow-verification.ts` ... and 1 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0219: `src/lib/repositories/comment-intelligence.repository.ts`

- **Directory:** `src/lib/repositories`
- **Filename:** `comment-intelligence.repository.ts` (.ts, 2,787 bytes)
- **Primary Purpose:** Data access repository for comment-intelligence worksheet
- **Workflow Participation:** 15 Intelligence Loop (DIRECT)
- **Risk Level:** **HIGH** (Direct data access layer writing/reading Google Sheets worksheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `CommentIntelligenceRepository`, `commentIntelligenceRepository`
- **Imports (3):** `./base.repository`, `../../types`, `../schemas/google-sheets-schema`
- **Consumers (7 files):** `scripts/restore-sequences-phase-e.ts`, `src/lib/repositories/sequences.repository.ts`, `src/lib/services/comment-intelligence.service.ts`, `src/lib/services/content-strategy.service.ts`, `src/tests/run-phase30-social-comments.ts`, `src/tests/run-phase31-comment-intelligence.ts`, `src/tests/run-phase32-c4-feedback-loop.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0220: `src/lib/repositories/content-batches.repository.ts`

- **Directory:** `src/lib/repositories`
- **Filename:** `content-batches.repository.ts` (.ts, 1,801 bytes)
- **Primary Purpose:** Data access repository for content-batches worksheet
- **Workflow Participation:** NONE
- **Risk Level:** **HIGH** (Direct data access layer writing/reading Google Sheets worksheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `ContentBatchesRepository`, `contentBatchesRepository`
- **Imports (3):** `./base.repository`, `../schemas/google-sheets-schema`, `../../types`
- **Consumers (5 files):** `scripts/restore-sequences-phase-e.ts`, `src/lib/repositories/sequences.repository.ts`, `src/lib/services/planning.service.ts`, `src/tests/execute-testdata-cleanup.ts`, `src/tests/task3a-planning-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0221: `src/lib/repositories/content-masters.repository.ts`

- **Directory:** `src/lib/repositories`
- **Filename:** `content-masters.repository.ts` (.ts, 1,940 bytes)
- **Primary Purpose:** Data access repository for content-masters worksheet
- **Workflow Participation:** NONE
- **Risk Level:** **HIGH** (Direct data access layer writing/reading Google Sheets worksheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `ContentMastersRepository`, `contentMastersRepository`
- **Imports (4):** `./base.repository`, `../schemas/google-sheets-schema`, `../../types`, `../google-sheets/errors`
- **Consumers (44 files):** `scripts/restore-sequences-phase-e.ts`, `src/lib/repositories/sequences.repository.ts`, `src/lib/services/analytics.service.ts`, `src/lib/services/comment-intelligence.service.ts`, `src/lib/services/object-auth.service.ts`, `src/lib/services/phase14-drive.service.ts`, `src/lib/services/phase18-thumbnail-intelligence.service.ts`, `src/lib/services/phase19-pinned-comment-intelligence.service.ts` ... and 36 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0222: `src/lib/repositories/content-plans.repository.ts`

- **Directory:** `src/lib/repositories`
- **Filename:** `content-plans.repository.ts` (.ts, 1,911 bytes)
- **Primary Purpose:** Data access repository for content-plans worksheet
- **Workflow Participation:** NONE
- **Risk Level:** **HIGH** (Direct data access layer writing/reading Google Sheets worksheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `ContentPlansRepository`, `contentPlansRepository`
- **Imports (3):** `./base.repository`, `../schemas/google-sheets-schema`, `../../types`
- **Consumers (6 files):** `scripts/restore-sequences-phase-e.ts`, `src/lib/repositories/sequences.repository.ts`, `src/lib/services/content-strategy.service.ts`, `src/lib/services/planning.service.ts`, `src/tests/execute-testdata-cleanup.ts`, `src/tests/task3a-planning-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0223: `src/lib/repositories/index.ts`

- **Directory:** `src/lib/repositories`
- **Filename:** `index.ts` (.ts, 1,717 bytes)
- **Primary Purpose:** Data access repository for index.ts worksheet
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **HIGH** (Direct data access layer writing/reading Google Sheets worksheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (0):** None
- **Consumers (1 files):** `src/types/phase26-copilot.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0224: `src/lib/repositories/intelligence.repository.ts`

- **Directory:** `src/lib/repositories`
- **Filename:** `intelligence.repository.ts` (.ts, 2,223 bytes)
- **Primary Purpose:** Data access repository for intelligence worksheet
- **Workflow Participation:** 15 Intelligence Loop (DIRECT)
- **Risk Level:** **HIGH** (Direct data access layer writing/reading Google Sheets worksheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `IntelligenceRepository`, `intelligenceRepository`
- **Imports (3):** `./base.repository`, `../../types`, `../schemas/google-sheets-schema`
- **Consumers (12 files):** `scripts/restore-sequences-phase-e.ts`, `src/lib/repositories/sequences.repository.ts`, `src/lib/services/comment-intelligence.service.ts`, `src/lib/services/content-strategy.service.ts`, `src/lib/services/social-performance-intelligence.service.ts`, `src/tests/phase28-social-performance-intelligence-verification.ts`, `src/tests/phase29-controlled-strategy-integration-verification.ts`, `src/tests/phase29b-posting-time-intelligence-verification.ts` ... and 4 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0225: `src/lib/repositories/media-assets.repository.ts`

- **Directory:** `src/lib/repositories`
- **Filename:** `media-assets.repository.ts` (.ts, 2,932 bytes)
- **Primary Purpose:** Data access repository for media-assets worksheet
- **Workflow Participation:** NONE
- **Risk Level:** **HIGH** (Direct data access layer writing/reading Google Sheets worksheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `MediaAssetsRepository`, `mediaAssetsRepository`
- **Imports (3):** `./base.repository`, `../schemas/google-sheets-schema`, `../../types`
- **Consumers (16 files):** `scripts/restore-sequences-phase-e.ts`, `src/lib/services/phase14-drive.service.ts`, `src/lib/services/phase17-video-production.service.ts`, `src/lib/services/phase18-thumbnail-intelligence.service.ts`, `src/lib/services/phase20-social-review.service.ts`, `src/lib/services/video.service.ts`, `src/server/routes.ts`, `src/tests/execute-testdata-cleanup.ts` ... and 8 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0226: `src/lib/repositories/phase20-social-reviews.repository.ts`

- **Directory:** `src/lib/repositories`
- **Filename:** `phase20-social-reviews.repository.ts` (.ts, 1,984 bytes)
- **Primary Purpose:** Data access repository for phase20-social-reviews worksheet
- **Workflow Participation:** 09 Social Review (DIRECT)
- **Risk Level:** **HIGH** (Direct data access layer writing/reading Google Sheets worksheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `Phase20SocialReviewsRepository`, `phase20SocialReviewsRepository`
- **Imports (2):** `../../types`, `./social-reviews.repository`
- **Consumers (3 files):** `src/lib/repositories/sequences.repository.ts`, `src/tests/phase20-social-review.ts`, `src/tests/phase22-publishing-hub.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0227: `src/lib/repositories/phase22-publishing.repository.ts`

- **Directory:** `src/lib/repositories`
- **Filename:** `phase22-publishing.repository.ts` (.ts, 2,247 bytes)
- **Primary Purpose:** Data access repository for phase22-publishing worksheet
- **Workflow Participation:** 11 Published (DIRECT)
- **Risk Level:** **HIGH** (Direct data access layer writing/reading Google Sheets worksheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `Phase22PublishingRepository`, `phase22PublishingRepository`
- **Imports (2):** `../../types`, `./publishing.repository`
- **Consumers (1 files):** `src/tests/phase22-publishing-hub.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0228: `src/lib/repositories/pinned-comment-packages.repository.ts`

- **Directory:** `src/lib/repositories`
- **Filename:** `pinned-comment-packages.repository.ts` (.ts, 3,069 bytes)
- **Primary Purpose:** Data access repository for pinned-comment-packages worksheet
- **Workflow Participation:** 15 Intelligence Loop (DIRECT)
- **Risk Level:** **HIGH** (Direct data access layer writing/reading Google Sheets worksheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `PinnedCommentPackagesRepository`, `pinnedCommentPackagesRepository`
- **Imports (1):** `../../types`
- **Consumers (7 files):** `src/lib/services/phase19-pinned-comment-intelligence.service.ts`, `src/lib/services/phase20-social-review.service.ts`, `src/lib/services/publishing.service.ts`, `src/tests/phase19-pinned-comment-intelligence.ts`, `src/tests/phase20-social-review.ts`, `src/tests/phase21-platform-adaptation.ts`, `src/tests/phase22-publishing-hub.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0229: `src/lib/repositories/pinned-comment-versions.repository.ts`

- **Directory:** `src/lib/repositories`
- **Filename:** `pinned-comment-versions.repository.ts` (.ts, 250 bytes)
- **Primary Purpose:** Data access repository for pinned-comment-versions worksheet
- **Workflow Participation:** 15 Intelligence Loop (DIRECT)
- **Risk Level:** **HIGH** (Direct data access layer writing/reading Google Sheets worksheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (0):** None
- **Consumers (3 files):** `scripts/restore-sequences-phase-e.ts`, `src/tests/execute-testdata-cleanup.ts`, `src/tests/verify-cleanup.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0230: `src/lib/repositories/pinned-comments.repository.ts`

- **Directory:** `src/lib/repositories`
- **Filename:** `pinned-comments.repository.ts` (.ts, 1,913 bytes)
- **Primary Purpose:** Data access repository for pinned-comments worksheet
- **Workflow Participation:** 15 Intelligence Loop (DIRECT)
- **Risk Level:** **HIGH** (Direct data access layer writing/reading Google Sheets worksheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (4):** `PinnedCommentsRepository`, `PinnedCommentVersionsRepository`, `pinnedCommentsRepository`, `pinnedCommentVersionsRepository`
- **Imports (3):** `./base.repository`, `../schemas/google-sheets-schema`, `../../types`
- **Consumers (20 files):** `scripts/restore-sequences-phase-e.ts`, `src/lib/repositories/sequences.repository.ts`, `src/lib/services/phase19-pinned-comment-intelligence.service.ts`, `src/lib/services/pinned-comment.service.ts`, `src/lib/services/publishing.service.ts`, `src/tests/comprehensive-e2e-suite.ts`, `src/tests/execute-testdata-cleanup.ts`, `src/tests/live-production-verification.ts` ... and 12 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0231: `src/lib/repositories/platform-adaptations.repository.ts`

- **Directory:** `src/lib/repositories`
- **Filename:** `platform-adaptations.repository.ts` (.ts, 8,588 bytes)
- **Primary Purpose:** Data access repository for platform-adaptations worksheet
- **Workflow Participation:** NONE
- **Risk Level:** **HIGH** (Direct data access layer writing/reading Google Sheets worksheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `PlatformAdaptationsRepository`, `platformAdaptationsRepository`
- **Imports (1):** `../../types`
- **Consumers (3 files):** `src/lib/services/platform-adaptation.service.ts`, `src/tests/phase21-platform-adaptation.ts`, `src/tests/phase22-publishing-hub.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0232: `src/lib/repositories/publishing.repository.ts`

- **Directory:** `src/lib/repositories`
- **Filename:** `publishing.repository.ts` (.ts, 4,842 bytes)
- **Primary Purpose:** Data access repository for publishing worksheet
- **Workflow Participation:** 11 Published (DIRECT)
- **Risk Level:** **HIGH** (Direct data access layer writing/reading Google Sheets worksheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `PublishingRepository`, `publishingRepository`
- **Imports (4):** `./base.repository`, `../schemas/google-sheets-schema`, `../../types`, `../mock-data/publishing`
- **Consumers (20 files):** `scripts/restore-sequences-phase-e.ts`, `src/lib/repositories/phase22-publishing.repository.ts`, `src/lib/services/phase19-pinned-comment-intelligence.service.ts`, `src/lib/services/pinned-comment.service.ts`, `src/lib/services/publishing.service.ts`, `src/lib/services/thumbnail.service.ts`, `src/tests/comprehensive-e2e-suite.ts`, `src/tests/execute-testdata-cleanup.ts` ... and 12 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0233: `src/lib/repositories/question-config.repository.ts`

- **Directory:** `src/lib/repositories`
- **Filename:** `question-config.repository.ts` (.ts, 3,559 bytes)
- **Primary Purpose:** Data access repository for question-config worksheet
- **Workflow Participation:** NONE
- **Risk Level:** **HIGH** (Direct data access layer writing/reading Google Sheets worksheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `QuestionConfigRepository`, `questionConfigRepository`
- **Imports (3):** `./base.repository`, `../schemas/google-sheets-schema`, `../../types`
- **Consumers (8 files):** `scripts/restore-sequences-phase-e.ts`, `src/lib/services/production-sheet-initializer.service.ts`, `src/lib/services/question-config.service.ts`, `src/tests/execute-testdata-cleanup.ts`, `src/tests/final-cleanup-verification.ts`, `src/tests/phase-6-configuration-engine.ts`, `src/tests/question-config-infrastructure.test.ts`, `src/tests/question-contract-regression.test.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0234: `src/lib/repositories/question-drafts.repository.ts`

- **Directory:** `src/lib/repositories`
- **Filename:** `question-drafts.repository.ts` (.ts, 1,921 bytes)
- **Primary Purpose:** Data access repository for question-drafts worksheet
- **Workflow Participation:** NONE
- **Risk Level:** **HIGH** (Direct data access layer writing/reading Google Sheets worksheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `QuestionDraftsRepository`, `questionDraftsRepository`
- **Imports (1):** `../../types`
- **Consumers (5 files):** `src/lib/services/question-draft.service.ts`, `src/lib/services/question-validation.service.ts`, `src/server/routes.ts`, `src/tests/stage01-draft-workflow-separation.test.ts`, `src/tests/stage02-targeted-bugfixes.test.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0235: `src/lib/repositories/question-videos.repository.ts`

- **Directory:** `src/lib/repositories`
- **Filename:** `question-videos.repository.ts` (.ts, 211 bytes)
- **Primary Purpose:** Data access repository for question-videos worksheet
- **Workflow Participation:** NONE
- **Risk Level:** **HIGH** (Direct data access layer writing/reading Google Sheets worksheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (0):** None
- **Consumers (3 files):** `scripts/restore-sequences-phase-e.ts`, `src/lib/repositories/sequences.repository.ts`, `src/tests/phase5-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0236: `src/lib/repositories/questions.repository.ts`

- **Directory:** `src/lib/repositories`
- **Filename:** `questions.repository.ts` (.ts, 4,157 bytes)
- **Primary Purpose:** Data access repository for questions worksheet
- **Workflow Participation:** NONE
- **Risk Level:** **HIGH** (Direct data access layer writing/reading Google Sheets worksheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `QuestionsRepository`, `questionsRepository`
- **Imports (5):** `./base.repository`, `../schemas/google-sheets-schema`, `../../types`, `../mock-data/questions`, `../google-sheets/errors`
- **Consumers (85 files):** `scripts/restore-sequences-phase-e.ts`, `scripts/test-task-3b2-ui-e2e.ts`, `src/lib/ai/gemini.service.ts`, `src/lib/repositories/sequences.repository.ts`, `src/lib/services/object-auth.service.ts`, `src/lib/services/phase15-script-production.service.ts`, `src/lib/services/phase17-video-production.service.ts`, `src/lib/services/phase18-thumbnail-intelligence.service.ts` ... and 77 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0237: `src/lib/repositories/refinement-candidates.repository.ts`

- **Directory:** `src/lib/repositories`
- **Filename:** `refinement-candidates.repository.ts` (.ts, 2,467 bytes)
- **Primary Purpose:** Data access repository for refinement-candidates worksheet
- **Workflow Participation:** NONE
- **Risk Level:** **HIGH** (Direct data access layer writing/reading Google Sheets worksheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `RefinementCandidate`, `refinementCandidatesRepository`
- **Imports (0):** None
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0238: `src/lib/repositories/script-versions.repository.ts`

- **Directory:** `src/lib/repositories`
- **Filename:** `script-versions.repository.ts` (.ts, 220 bytes)
- **Primary Purpose:** Data access repository for script-versions worksheet
- **Workflow Participation:** NONE
- **Risk Level:** **HIGH** (Direct data access layer writing/reading Google Sheets worksheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (0):** None
- **Consumers (3 files):** `scripts/restore-sequences-phase-e.ts`, `src/tests/execute-testdata-cleanup.ts`, `src/tests/verify-cleanup.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0239: `src/lib/repositories/scripts.repository.ts`

- **Directory:** `src/lib/repositories`
- **Filename:** `scripts.repository.ts` (.ts, 2,125 bytes)
- **Primary Purpose:** Data access repository for scripts worksheet
- **Workflow Participation:** NONE
- **Risk Level:** **HIGH** (Direct data access layer writing/reading Google Sheets worksheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (4):** `ScriptsRepository`, `ScriptVersionsRepository`, `scriptsRepository`, `scriptVersionsRepository`
- **Imports (3):** `./base.repository`, `../schemas/google-sheets-schema`, `../../types`
- **Consumers (34 files):** `scripts/restore-sequences-phase-e.ts`, `src/lib/repositories/sequences.repository.ts`, `src/lib/services/phase15-script-production.service.ts`, `src/lib/services/phase17-video-production.service.ts`, `src/lib/services/phase18-thumbnail-intelligence.service.ts`, `src/lib/services/phase19-pinned-comment-intelligence.service.ts`, `src/lib/services/phase20-social-review.service.ts`, `src/lib/services/publishing.service.ts` ... and 26 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0240: `src/lib/repositories/sequences.repository.ts`

- **Directory:** `src/lib/repositories`
- **Filename:** `sequences.repository.ts` (.ts, 10,264 bytes)
- **Primary Purpose:** Data access repository for sequences worksheet
- **Workflow Participation:** NONE
- **Risk Level:** **HIGH** (Direct data access layer writing/reading Google Sheets worksheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (3):** `SequenceRecord`, `SequencesRepository`, `sequencesRepository`
- **Imports (21):** `./base.repository`, `../schemas/google-sheets-schema`, `./questions.repository`, `./videos.repository`, `./scripts.repository`, `./thumbnails.repository`, `./pinned-comments.repository`, `./categories.repository` ... and 13 more
- **Consumers (24 files):** `scripts/restore-sequences-phase-e.ts`, `src/lib/services/data-integrity.service.ts`, `src/lib/services/id.service.ts`, `src/lib/services/operational-recovery.service.ts`, `src/lib/services/production-sheet-initializer.service.ts`, `src/lib/services/sequence-safety.service.ts`, `src/lib/services/snapshot-exporter.service.ts`, `src/lib/services/spreadsheet-verification.service.ts` ... and 16 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0241: `src/lib/repositories/social-comments.repository.ts`

- **Directory:** `src/lib/repositories`
- **Filename:** `social-comments.repository.ts` (.ts, 6,022 bytes)
- **Primary Purpose:** Data access repository for social-comments worksheet
- **Workflow Participation:** 15 Intelligence Loop (DIRECT)
- **Risk Level:** **HIGH** (Direct data access layer writing/reading Google Sheets worksheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `SocialCommentsRepository`, `socialCommentsRepository`
- **Imports (3):** `./base.repository`, `../schemas/google-sheets-schema`, `../../types`
- **Consumers (7 files):** `scripts/restore-sequences-phase-e.ts`, `src/lib/repositories/sequences.repository.ts`, `src/lib/services/comment-intelligence.service.ts`, `src/lib/services/social-comments.service.ts`, `src/tests/run-phase30-social-comments.ts`, `src/tests/run-phase31-comment-intelligence.ts`, `src/tests/run-phase32-c4-feedback-loop.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0242: `src/lib/repositories/social-reviews.repository.ts`

- **Directory:** `src/lib/repositories`
- **Filename:** `social-reviews.repository.ts` (.ts, 5,680 bytes)
- **Primary Purpose:** Data access repository for social-reviews worksheet
- **Workflow Participation:** 09 Social Review (DIRECT)
- **Risk Level:** **HIGH** (Direct data access layer writing/reading Google Sheets worksheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `SocialReviewsRepository`, `socialReviewsRepository`
- **Imports (3):** `./base.repository`, `../schemas/google-sheets-schema`, `../../types`
- **Consumers (23 files):** `scripts/restore-sequences-phase-e.ts`, `src/lib/repositories/phase20-social-reviews.repository.ts`, `src/lib/repositories/sequences.repository.ts`, `src/lib/services/phase20-social-review.service.ts`, `src/lib/services/publishing.service.ts`, `src/lib/services/social-review.service.ts`, `src/server/routes.ts`, `src/tests/comprehensive-e2e-suite.ts` ... and 15 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0243: `src/lib/repositories/strategy-recommendation.repository.ts`

- **Directory:** `src/lib/repositories`
- **Filename:** `strategy-recommendation.repository.ts` (.ts, 1,949 bytes)
- **Primary Purpose:** Data access repository for strategy-recommendation worksheet
- **Workflow Participation:** NONE
- **Risk Level:** **HIGH** (Direct data access layer writing/reading Google Sheets worksheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `StrategyRecommendationRepository`, `strategyRecommendationRepository`
- **Imports (3):** `./base.repository`, `../../types`, `../schemas/google-sheets-schema`
- **Consumers (3 files):** `scripts/restore-sequences-phase-e.ts`, `src/lib/services/content-strategy.service.ts`, `src/tests/run-phase32-c4-feedback-loop.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0244: `src/lib/repositories/subtopics.repository.ts`

- **Directory:** `src/lib/repositories`
- **Filename:** `subtopics.repository.ts` (.ts, 1,955 bytes)
- **Primary Purpose:** Data access repository for subtopics worksheet
- **Workflow Participation:** NONE
- **Risk Level:** **HIGH** (Direct data access layer writing/reading Google Sheets worksheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `SubtopicsRepository`, `subtopicsRepository`
- **Imports (4):** `./base.repository`, `../schemas/google-sheets-schema`, `../../types`, `../mock-data/taxonomy`
- **Consumers (11 files):** `scripts/restore-sequences-phase-e.ts`, `src/lib/repositories/sequences.repository.ts`, `src/lib/services/production-sheet-initializer.service.ts`, `src/tests/canonical-sequence-parsing.test.ts`, `src/tests/comprehensive-e2e-suite.ts`, `src/tests/execute-testdata-cleanup.ts`, `src/tests/live-production-verification.ts`, `src/tests/question-config-infrastructure.test.ts` ... and 3 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0245: `src/lib/repositories/thumbnail-candidates.repository.ts`

- **Directory:** `src/lib/repositories`
- **Filename:** `thumbnail-candidates.repository.ts` (.ts, 2,977 bytes)
- **Primary Purpose:** Data access repository for thumbnail-candidates worksheet
- **Workflow Participation:** 08 Thumbnail (DIRECT)
- **Risk Level:** **HIGH** (Direct data access layer writing/reading Google Sheets worksheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `ThumbnailCandidatesRepository`, `thumbnailCandidatesRepository`
- **Imports (1):** `../../types`
- **Consumers (5 files):** `src/lib/services/phase18-thumbnail-intelligence.service.ts`, `src/lib/services/phase20-social-review.service.ts`, `src/server/routes.ts`, `src/tests/phase18-thumbnail-intelligence.ts`, `src/tests/phase20-social-review.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0246: `src/lib/repositories/thumbnail-versions.repository.ts`

- **Directory:** `src/lib/repositories`
- **Filename:** `thumbnail-versions.repository.ts` (.ts, 232 bytes)
- **Primary Purpose:** Data access repository for thumbnail-versions worksheet
- **Workflow Participation:** 08 Thumbnail (DIRECT)
- **Risk Level:** **HIGH** (Direct data access layer writing/reading Google Sheets worksheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (0):** None
- **Consumers (5 files):** `scripts/restore-sequences-phase-e.ts`, `src/lib/services/phase18-thumbnail-intelligence.service.ts`, `src/tests/execute-testdata-cleanup.ts`, `src/tests/phase13-9-thumbnail-rollback-remediation.ts`, `src/tests/verify-cleanup.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0247: `src/lib/repositories/thumbnails.repository.ts`

- **Directory:** `src/lib/repositories`
- **Filename:** `thumbnails.repository.ts` (.ts, 2,173 bytes)
- **Primary Purpose:** Data access repository for thumbnails worksheet
- **Workflow Participation:** 08 Thumbnail (DIRECT)
- **Risk Level:** **HIGH** (Direct data access layer writing/reading Google Sheets worksheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (4):** `ThumbnailsRepository`, `ThumbnailVersionsRepository`, `thumbnailsRepository`, `thumbnailVersionsRepository`
- **Imports (3):** `./base.repository`, `../schemas/google-sheets-schema`, `../../types`
- **Consumers (27 files):** `scripts/restore-sequences-phase-e.ts`, `src/lib/repositories/sequences.repository.ts`, `src/lib/services/phase18-thumbnail-intelligence.service.ts`, `src/lib/services/phase20-social-review.service.ts`, `src/lib/services/publishing.service.ts`, `src/lib/services/thumbnail.service.ts`, `src/server/routes.ts`, `src/tests/comprehensive-e2e-suite.ts` ... and 19 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0248: `src/lib/repositories/topics.repository.ts`

- **Directory:** `src/lib/repositories`
- **Filename:** `topics.repository.ts` (.ts, 1,554 bytes)
- **Primary Purpose:** Data access repository for topics worksheet
- **Workflow Participation:** NONE
- **Risk Level:** **HIGH** (Direct data access layer writing/reading Google Sheets worksheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `TopicsRepository`, `topicsRepository`
- **Imports (4):** `./base.repository`, `../schemas/google-sheets-schema`, `../../types`, `../mock-data/taxonomy`
- **Consumers (12 files):** `scripts/restore-sequences-phase-e.ts`, `src/lib/repositories/sequences.repository.ts`, `src/lib/services/production-sheet-initializer.service.ts`, `src/tests/canonical-sequence-parsing.test.ts`, `src/tests/comprehensive-e2e-suite.ts`, `src/tests/execute-testdata-cleanup.ts`, `src/tests/live-production-verification.ts`, `src/tests/phase6-verification.ts` ... and 4 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0249: `src/lib/repositories/users.repository.ts`

- **Directory:** `src/lib/repositories`
- **Filename:** `users.repository.ts` (.ts, 217 bytes)
- **Primary Purpose:** Data access repository for users worksheet
- **Workflow Participation:** NONE
- **Risk Level:** **HIGH** (Direct data access layer writing/reading Google Sheets worksheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (0):** None
- **Consumers (31 files):** `scripts/restore-sequences-phase-e.ts`, `server.ts`, `src/lib/repositories/sequences.repository.ts`, `src/lib/services/auth.service.ts`, `src/lib/services/production-sheet-initializer.service.ts`, `src/lib/services/publishing.service.ts`, `src/server/middleware/auth.middleware.ts`, `src/server/routes.ts` ... and 23 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0250: `src/lib/repositories/validations.repository.ts`

- **Directory:** `src/lib/repositories`
- **Filename:** `validations.repository.ts` (.ts, 6,322 bytes)
- **Primary Purpose:** Data access repository for validations worksheet
- **Workflow Participation:** NONE
- **Risk Level:** **HIGH** (Direct data access layer writing/reading Google Sheets worksheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `ValidationsRepository`, `validationsRepository`
- **Imports (3):** `./base.repository`, `../schemas/google-sheets-schema`, `../../types`
- **Consumers (13 files):** `scripts/restore-sequences-phase-e.ts`, `src/lib/services/question-validation.service.ts`, `src/lib/services/question.service.ts`, `src/tests/creation-compensation-resilience.test.ts`, `src/tests/execute-testdata-cleanup.ts`, `src/tests/idempotency-concurrency-resilience.test.ts`, `src/tests/phase9-verification.ts`, `src/tests/pipeline-convergence-sequence-resilience.test.ts` ... and 5 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0251: `src/lib/repositories/videos.repository.ts`

- **Directory:** `src/lib/repositories`
- **Filename:** `videos.repository.ts` (.ts, 2,979 bytes)
- **Primary Purpose:** Data access repository for videos worksheet
- **Workflow Participation:** NONE
- **Risk Level:** **HIGH** (Direct data access layer writing/reading Google Sheets worksheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (4):** `QuestionVideosRepository`, `VideosRepository`, `questionVideosRepository`, `videosRepository`
- **Imports (4):** `./base.repository`, `../schemas/google-sheets-schema`, `../../types`, `../mock-data/queue`
- **Consumers (51 files):** `scripts/restore-sequences-phase-e.ts`, `src/lib/repositories/sequences.repository.ts`, `src/lib/services/object-auth.service.ts`, `src/lib/services/phase15-script-production.service.ts`, `src/lib/services/phase17-video-production.service.ts`, `src/lib/services/phase18-thumbnail-intelligence.service.ts`, `src/lib/services/phase19-pinned-comment-intelligence.service.ts`, `src/lib/services/phase20-social-review.service.ts` ... and 43 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0252: `src/lib/repositories/workflow.repository.ts`

- **Directory:** `src/lib/repositories`
- **Filename:** `workflow.repository.ts` (.ts, 985 bytes)
- **Primary Purpose:** Data access repository for workflow worksheet
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **HIGH** (Direct data access layer writing/reading Google Sheets worksheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `WorkflowRepository`, `workflowRepository`
- **Imports (3):** `./base.repository`, `../schemas/google-sheets-schema`, `../../types`
- **Consumers (15 files):** `scripts/restore-sequences-phase-e.ts`, `src/lib/services/pinned-comment.service.ts`, `src/lib/services/social-review.service.ts`, `src/tests/execute-testdata-cleanup.ts`, `src/tests/phase13-live-verification.ts`, `src/tests/phase13-step4-publishing-assignments.ts`, `src/tests/phase13-step5-publishing-integration.ts`, `src/tests/phase5-verification.ts` ... and 7 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0253: `src/lib/schemas/google-sheets-schema.ts`

- **Directory:** `src/lib/schemas`
- **Filename:** `google-sheets-schema.ts` (.ts, 86,073 bytes)
- **Primary Purpose:** Application utility or helper module
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (102):** `SHEET_TABS`, `PLANNING_SHEET_TABS`, `PlanningSheetTabName`, `SheetTabName`, `ALL_SHEET_TABS`, `SEQUENCE_ENTITIES`, `SequenceEntityType`, `ID_PREFIX_MAP`, `ColumnDefinition`, `SheetSchemaContract` ... and 92 more
- **Imports (2):** `zod`, `../../types`
- **Consumers (94 files):** `scripts/phase-b-launch-reset.ts`, `scripts/purge-test-data-for-production.ts`, `scripts/restore-sequences-phase-e.ts`, `src/lib/api-client.ts`, `src/lib/google-sheets/helpers.ts`, `src/lib/ownership/data-ownership.ts`, `src/lib/repositories/analytics.repository.ts`, `src/lib/repositories/assignments.repository.ts` ... and 86 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0254: `src/lib/services/analytics.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `analytics.service.ts` (.ts, 9,728 bytes)
- **Primary Purpose:** Domain orchestration service singleton for analytics
- **Workflow Participation:** 13 Analytics (DIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `AnalyticsService`, `analyticsService`
- **Imports (6):** `../repositories/analytics.repository`, `../repositories/content-masters.repository`, `./id.service`, `../repositories/audit-log.repository`, `../schemas/google-sheets-schema`, `../../types`
- **Consumers (9 files):** `src/lib/services/content-strategy.service.ts`, `src/lib/services/publishing.service.ts`, `src/lib/services/social-performance-intelligence.service.ts`, `src/tests/phase27-social-analytics-verification.ts`, `src/tests/phase28-social-performance-intelligence-verification.ts`, `src/tests/run-phase27-only.ts`, `src/tests/run-phase28-only.ts`, `src/tests/stage8-continuous-verification.ts` ... and 1 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0255: `src/lib/services/assignment.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `assignment.service.ts` (.ts, 51,413 bytes)
- **Primary Purpose:** Domain orchestration service singleton for assignment
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `AssignmentService`, `assignmentService`
- **Imports (5):** `../repositories`, `./id.service`, `./audit.service`, `../../types`, `../schemas/google-sheets-schema`
- **Consumers (11 files):** `src/lib/services/dashboard.service.ts`, `src/lib/services/video.service.ts`, `src/tests/phase10-verification.ts`, `src/tests/phase13-8-assignment-race-remediation.ts`, `src/tests/phase9-content-workflow-verification.ts`, `src/tests/task3d1-assignment-verification.ts`, `src/tests/task3d2-rbac-verification.ts`, `src/tests/task3d3-review-workflow-verification.ts` ... and 3 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0256: `src/lib/services/audit.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `audit.service.ts` (.ts, 5,114 bytes)
- **Primary Purpose:** Domain orchestration service singleton for audit
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (4):** `AuditService`, `WorkflowService`, `auditService`, `workflowService`
- **Imports (4):** `../repositories`, `../../types`, `../schemas/google-sheets-schema`, `../google-sheets/errors`
- **Consumers (46 files):** `src/lib/services/assignment.service.ts`, `src/lib/services/auth.service.ts`, `src/lib/services/content-master.service.ts`, `src/lib/services/full-snapshot-restore-execution.service.ts`, `src/lib/services/granular-assignment-restore.service.ts`, `src/lib/services/granular-pinned-comment-restore.service.ts`, `src/lib/services/granular-publishing-restore.service.ts`, `src/lib/services/granular-question-restore.service.ts` ... and 38 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0257: `src/lib/services/auth.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `auth.service.ts` (.ts, 12,587 bytes)
- **Primary Purpose:** Domain orchestration service singleton for auth
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (4):** `SessionPayload`, `SafeUser`, `AuthService`, `authService`
- **Imports (4):** `crypto`, `../repositories/users.repository`, `./audit.service`, `../../types`
- **Consumers (44 files):** `scripts/test-task-3b2-ui-e2e.ts`, `src/lib/services/content-master.service.ts`, `src/lib/services/dashboard.service.ts`, `src/lib/services/phase23-production.service.ts`, `src/lib/services/phase26-copilot.service.ts`, `src/lib/services/production-sheet-initializer.service.ts`, `src/lib/services/publishing.service.ts`, `src/lib/services/video.service.ts` ... and 36 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0258: `src/lib/services/comment-intelligence.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `comment-intelligence.service.ts` (.ts, 19,417 bytes)
- **Primary Purpose:** Domain orchestration service singleton for comment-intelligence
- **Workflow Participation:** 15 Intelligence Loop (DIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `CommentIntelligenceService`, `commentIntelligenceService`
- **Imports (11):** `../repositories/social-comments.repository`, `../repositories/comment-intelligence.repository`, `../repositories/content-masters.repository`, `./id.service`, `../repositories/audit-log.repository`, `../ai/phase24-orchestrator.service`, `../../types/phase24-ai`, `../ai/schemas/comment-intelligence.schema` ... and 3 more
- **Consumers (4 files):** `src/server/routes.ts`, `src/tests/phase19-pinned-comment-intelligence.ts`, `src/tests/run-phase31-comment-intelligence.ts`, `src/tests/run-phase32-c4-feedback-loop.ts`
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0259: `src/lib/services/content-master.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `content-master.service.ts` (.ts, 37,480 bytes)
- **Primary Purpose:** Domain orchestration service singleton for content-master
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (5):** `ContentMasterDetails`, `MigrationDryRunReport`, `MigrationExecutionResult`, `ContentMasterService`, `contentMasterService`
- **Imports (10):** `../repositories`, `./id.service`, `../../types`, `../schemas/google-sheets-schema`, `./audit.service`, `./workflow.service`, `./object-auth.service`, `./social-review.service` ... and 2 more
- **Consumers (21 files):** `src/lib/services/question.service.ts`, `src/lib/services/video.service.ts`, `src/lib/services/workflow-orchestration.service.ts`, `src/pages/ContentMasterPage.tsx`, `src/tests/category-decoupling-verification.test.ts`, `src/tests/creation-compensation-resilience.test.ts`, `src/tests/idempotency-concurrency-resilience.test.ts`, `src/tests/phase11-canonical-lifecycle-verification.ts` ... and 13 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0260: `src/lib/services/content-strategy.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `content-strategy.service.ts` (.ts, 20,276 bytes)
- **Primary Purpose:** Domain orchestration service singleton for content-strategy
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `ContentStrategyService`, `contentStrategyService`
- **Imports (11):** `../repositories/strategy-recommendation.repository`, `./social-performance-intelligence.service`, `../repositories/comment-intelligence.repository`, `./analytics.service`, `./taxonomy.service`, `../repositories/content-plans.repository`, `../repositories/audit-log.repository`, `./id.service` ... and 3 more
- **Consumers (1 files):** `src/tests/run-phase32-c4-feedback-loop.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0261: `src/lib/services/dashboard.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `dashboard.service.ts` (.ts, 61,044 bytes)
- **Primary Purpose:** Domain orchestration service singleton for dashboard
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (4):** `DashboardFilterOptions`, `DashboardDataContext`, `DashboardService`, `dashboardService`
- **Imports (5):** `../repositories`, `./assignment.service`, `./object-auth.service`, `../../config/constants`, `../../types`
- **Consumers (5 files):** `src/tests/category-decoupling-verification.test.ts`, `src/tests/phase14-step4-verification.ts`, `src/tests/phase15-step3-verification.ts`, `src/tests/phase15-step6-assignment-deduplication-verification.ts`, `src/tests/task2-content-master-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0262: `src/lib/services/data-integrity.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `data-integrity.service.ts` (.ts, 68,297 bytes)
- **Primary Purpose:** Domain orchestration service singleton for data-integrity
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `DataIntegrityService`, `dataIntegrityService`
- **Imports (5):** `../../types`, `../repositories`, `../schemas/google-sheets-schema`, `../google-sheets/client`, `../repositories/sequences.repository`
- **Consumers (10 files):** `src/lib/services/operational-recovery.service.ts`, `src/tests/edit-integration-test.ts`, `src/tests/fraction-persistence-retest.ts`, `src/tests/library-integration-retest.ts`, `src/tests/live-production-verification.ts`, `src/tests/phase10-verification.ts`, `src/tests/phase8a-verification.ts`, `src/tests/purge-test-artifacts.ts` ... and 2 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0263: `src/lib/services/deletion-safety.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `deletion-safety.service.ts` (.ts, 9,558 bytes)
- **Primary Purpose:** Domain orchestration service singleton for deletion-safety
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (9):** `DeletionBackupRecord`, `VerifiedDeletionToken`, `DeletionBackupError`, `DeletionBackupVerificationError`, `DirectDeleteBypassError`, `DeletionReadBackError`, `DeletionIntegrityError`, `DeletionSafetyService`, `deletionSafetyService`
- **Imports (3):** `fs`, `path`, `crypto`
- **Consumers (4 files):** `scripts/cleanup-and-migrate-users.ts`, `src/lib/google-sheets/client.ts`, `src/lib/repositories/base.repository.ts`, `src/tests/deletion-safety-pipeline.test.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0264: `src/lib/services/durable-snapshot-archive.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `durable-snapshot-archive.service.ts` (.ts, 16,230 bytes)
- **Primary Purpose:** Domain orchestration service singleton for durable-snapshot-archive
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `SnapshotMetaManifest`, `DurableSnapshotArchiveService`
- **Imports (4):** `googleapis`, `crypto`, `../../config/snapshot.config`, `./snapshot-exporter.service`
- **Consumers (7 files):** `src/lib/services/snapshot-history.service.ts`, `src/lib/services/snapshot-scheduler.service.ts`, `src/tests/surgical-repair.ts`, `src/tests/task3f410b-durable-archive-verification.ts`, `src/tests/task3f410c-durable-archive-integration-verification.ts`, `src/tests/task3f410e-gcs-smoke-test.ts`, `src/tests/task3f410f-scheduler-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: YES (@google/genai SDK)
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0265: `src/lib/services/full-snapshot-preflight.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `full-snapshot-preflight.service.ts` (.ts, 8,872 bytes)
- **Primary Purpose:** Domain orchestration service singleton for full-snapshot-preflight
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `FullSnapshotPreflightResult`, `FullSnapshotPreflightService`
- **Imports (3):** `./snapshot-exporter.service`, `./full-snapshot-restore.service`, `./restore-validator.service`
- **Consumers (3 files):** `src/lib/services/full-snapshot-restore-execution.service.ts`, `src/lib/services/full-snapshot-restore-plan.service.ts`, `src/tests/task3f48-full-snapshot-preflight-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0266: `src/lib/services/full-snapshot-restore-execution.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `full-snapshot-restore-execution.service.ts` (.ts, 22,402 bytes)
- **Primary Purpose:** Domain orchestration service singleton for full-snapshot-restore-execution
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (4):** `FullSnapshotRestoreExecutionRequest`, `FullSnapshotRestoreExecutionResult`, `FullSnapshotRestoreExecutionService`, `fullSnapshotRestoreExecutionService`
- **Imports (8):** `node:crypto`, `./snapshot-exporter.service`, `./full-snapshot-preflight.service`, `./full-snapshot-restore-plan.service`, `./full-snapshot-restore.service`, `./sequence-safety.service`, `./audit.service`, `../repositories`
- **Consumers (3 files):** `src/tests/task3f48-full-snapshot-restore-execution-verification.ts`, `src/tests/task3f49-full-restore-api-verification.ts`, `src/tests/task3f49-recovery-security-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0267: `src/lib/services/full-snapshot-restore-plan.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `full-snapshot-restore-plan.service.ts` (.ts, 17,619 bytes)
- **Primary Purpose:** Domain orchestration service singleton for full-snapshot-restore-plan
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (7):** `RestoreOperationType`, `RestorePlannedOperation`, `WorksheetRestorePlan`, `FullRestorePlan`, `EXACT_RESTORE_DEPENDENCY_ORDER`, `IMMUTABLE_VERSION_ENTITIES`, `FullSnapshotRestorePlanService`
- **Imports (5):** `node:crypto`, `./snapshot-exporter.service`, `./full-snapshot-preflight.service`, `./full-snapshot-restore.service`, `./restore-validator.service`
- **Consumers (4 files):** `src/lib/services/full-snapshot-restore-execution.service.ts`, `src/tests/task3f48-full-snapshot-restore-execution-verification.ts`, `src/tests/task3f48-full-snapshot-restore-plan-verification.ts`, `src/tests/task3f49-recovery-dry-run-api-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0268: `src/lib/services/full-snapshot-restore.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `full-snapshot-restore.service.ts` (.ts, 16,094 bytes)
- **Primary Purpose:** Domain orchestration service singleton for full-snapshot-restore
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (6):** `FULL_RESTORE_CONFIRMATION_PHRASE`, `FULL_RESTORE_ENTITY_ORDER`, `FullRestoreEntityType`, `EntityPlanDetail`, `FullSnapshotRestorePlan`, `FullSnapshotRestoreService`
- **Imports (5):** `node:crypto`, `./snapshot-exporter.service`, `./restore-validator.service`, `../schemas/google-sheets-schema`, `../repositories`
- **Consumers (6 files):** `src/lib/services/full-snapshot-preflight.service.ts`, `src/lib/services/full-snapshot-restore-execution.service.ts`, `src/lib/services/full-snapshot-restore-plan.service.ts`, `src/tests/task2-content-master-verification.ts`, `src/tests/task3f48-full-snapshot-preflight-verification.ts`, `src/tests/task3f48-full-snapshot-restore-planner-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0269: `src/lib/services/google-drive.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `google-drive.service.ts` (.ts, 24,634 bytes)
- **Primary Purpose:** Domain orchestration service singleton for google-drive
- **Workflow Participation:** NONE
- **Risk Level:** **CRITICAL** (Core system driver with direct mutations to production external infrastructure)
- **Duplicate Classification:** STRONG DUPLICATE CANDIDATE (Counterpart: `src/lib/services/phase14-drive.service.ts`, Reason: Dual implementations of Google Drive folder resolution and upload logic)
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (5):** `DriveFileMetadata`, `ContentFolderHierarchy`, `DriveDownloadResult`, `GoogleDriveService`, `googleDriveService`
- **Imports (3):** `googleapis`, `stream`, `../google-sheets/errors`
- **Consumers (22 files):** `scripts/audit-and-clean-bp-cnt-000001.ts`, `scripts/phase-b-launch-reset.ts`, `server.ts`, `src/lib/services/phase14-drive.service.ts`, `src/lib/services/phase18-thumbnail-intelligence.service.ts`, `src/lib/services/thumbnail.service.ts`, `src/lib/services/video.service.ts`, `src/server/routes.ts` ... and 14 more
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: YES (Binary File Operations)
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0270: `src/lib/services/granular-assignment-restore.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `granular-assignment-restore.service.ts` (.ts, 15,920 bytes)
- **Primary Purpose:** Domain orchestration service singleton for granular-assignment-restore
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (4):** `GranularAssignmentRestoreRequest`, `GranularAssignmentRestoreResult`, `GranularAssignmentRestoreService`, `granularAssignmentRestoreService`
- **Imports (5):** `./snapshot-exporter.service`, `./restore-validator.service`, `../repositories`, `./audit.service`, `../../types`
- **Consumers (1 files):** `src/tests/task3f47g-granular-assignment-restore-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0271: `src/lib/services/granular-pinned-comment-restore.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `granular-pinned-comment-restore.service.ts` (.ts, 17,425 bytes)
- **Primary Purpose:** Domain orchestration service singleton for granular-pinned-comment-restore
- **Workflow Participation:** 15 Intelligence Loop (DIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (4):** `GranularPinnedCommentRestoreRequest`, `GranularPinnedCommentRestoreResult`, `GranularPinnedCommentRestoreService`, `granularPinnedCommentRestoreService`
- **Imports (5):** `./snapshot-exporter.service`, `./restore-validator.service`, `../repositories`, `./audit.service`, `../../types`
- **Consumers (1 files):** `src/tests/task3f47e-granular-pinned-comment-restore-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0272: `src/lib/services/granular-publishing-restore.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `granular-publishing-restore.service.ts` (.ts, 14,014 bytes)
- **Primary Purpose:** Domain orchestration service singleton for granular-publishing-restore
- **Workflow Participation:** 11 Published (DIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (4):** `GranularPublishingRestoreRequest`, `GranularPublishingRestoreResult`, `GranularPublishingRestoreService`, `granularPublishingRestoreService`
- **Imports (5):** `./snapshot-exporter.service`, `./restore-validator.service`, `../repositories`, `./audit.service`, `../../types`
- **Consumers (1 files):** `src/tests/task3f47f-granular-publishing-restore-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0273: `src/lib/services/granular-question-restore.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `granular-question-restore.service.ts` (.ts, 14,465 bytes)
- **Primary Purpose:** Domain orchestration service singleton for granular-question-restore
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (4):** `GranularQuestionRestoreRequest`, `GranularQuestionRestoreResult`, `GranularQuestionRestoreService`, `granularQuestionRestoreService`
- **Imports (7):** `./snapshot-exporter.service`, `./restore-validator.service`, `../repositories`, `./taxonomy.service`, `./audit.service`, `../../types`, `../google-sheets/errors`
- **Consumers (2 files):** `src/tests/task3f47a-granular-question-restore-verification.ts`, `src/tests/task3f49-recovery-security-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0274: `src/lib/services/granular-script-restore.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `granular-script-restore.service.ts` (.ts, 18,741 bytes)
- **Primary Purpose:** Domain orchestration service singleton for granular-script-restore
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (4):** `GranularScriptRestoreRequest`, `GranularScriptRestoreResult`, `GranularScriptRestoreService`, `granularScriptRestoreService`
- **Imports (5):** `./snapshot-exporter.service`, `./restore-validator.service`, `../repositories`, `./audit.service`, `../../types`
- **Consumers (1 files):** `src/tests/task3f47c-granular-script-restore-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0275: `src/lib/services/granular-thumbnail-restore.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `granular-thumbnail-restore.service.ts` (.ts, 16,876 bytes)
- **Primary Purpose:** Domain orchestration service singleton for granular-thumbnail-restore
- **Workflow Participation:** 08 Thumbnail (DIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (4):** `GranularThumbnailRestoreRequest`, `GranularThumbnailRestoreResult`, `GranularThumbnailRestoreService`, `granularThumbnailRestoreService`
- **Imports (5):** `./snapshot-exporter.service`, `./restore-validator.service`, `../repositories`, `./audit.service`, `../../types`
- **Consumers (1 files):** `src/tests/task3f47d-granular-thumbnail-restore-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0276: `src/lib/services/granular-video-restore.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `granular-video-restore.service.ts` (.ts, 16,139 bytes)
- **Primary Purpose:** Domain orchestration service singleton for granular-video-restore
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (4):** `GranularVideoRestoreRequest`, `GranularVideoRestoreResult`, `GranularVideoRestoreService`, `granularVideoRestoreService`
- **Imports (5):** `./snapshot-exporter.service`, `./restore-validator.service`, `../repositories`, `./audit.service`, `../../types`
- **Consumers (1 files):** `src/tests/task3f47b-granular-video-restore-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0277: `src/lib/services/id.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `id.service.ts` (.ts, 4,559 bytes)
- **Primary Purpose:** Domain orchestration service singleton for id
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `IdService`, `idService`
- **Imports (3):** `../repositories/sequences.repository`, `../schemas/google-sheets-schema`, `../google-sheets/errors`
- **Consumers (48 files):** `src/lib/services/analytics.service.ts`, `src/lib/services/assignment.service.ts`, `src/lib/services/comment-intelligence.service.ts`, `src/lib/services/content-master.service.ts`, `src/lib/services/content-strategy.service.ts`, `src/lib/services/phase15-script-production.service.ts`, `src/lib/services/phase17-video-production.service.ts`, `src/lib/services/phase18-thumbnail-intelligence.service.ts` ... and 40 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0278: `src/lib/services/index.ts`

- **Directory:** `src/lib/services`
- **Filename:** `index.ts` (.ts, 3,002 bytes)
- **Primary Purpose:** Domain orchestration service singleton for index.ts
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (0):** None
- **Consumers (1 files):** `src/types/phase26-copilot.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0279: `src/lib/services/object-auth.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `object-auth.service.ts` (.ts, 21,188 bytes)
- **Primary Purpose:** Domain orchestration service singleton for object-auth
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (3):** `ActorContext`, `ObjectAuthorizationService`, `objectAuthService`
- **Imports (5):** `../../types`, `../repositories/assignments.repository`, `../repositories/questions.repository`, `../repositories/videos.repository`, `../repositories/content-masters.repository`
- **Consumers (26 files):** `src/lib/services/content-master.service.ts`, `src/lib/services/dashboard.service.ts`, `src/lib/services/phase23-production.service.ts`, `src/lib/services/phase26-copilot.service.ts`, `src/lib/services/production-sheet-initializer.service.ts`, `src/lib/services/publishing.service.ts`, `src/lib/services/video.service.ts`, `src/lib/services/workflow-orchestration.service.ts` ... and 18 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0280: `src/lib/services/operational-health.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `operational-health.service.ts` (.ts, 6,183 bytes)
- **Primary Purpose:** Domain orchestration service singleton for operational-health
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (6):** `ConnectivityStatus`, `AuthStatus`, `SpreadsheetAccessibility`, `OperationalHealthReport`, `OperationalHealthService`, `operationalHealthService`
- **Imports (2):** `../google-sheets/client`, `../google-sheets/errors`
- **Consumers (3 files):** `src/lib/services/operational-recovery.service.ts`, `src/pages/SettingsPage.tsx`, `src/tests/phase8b-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0281: `src/lib/services/operational-recovery.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `operational-recovery.service.ts` (.ts, 8,315 bytes)
- **Primary Purpose:** Domain orchestration service singleton for operational-recovery
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (4):** `RecoveryActionPlan`, `OperationalRecoveryState`, `OperationalRecoveryService`, `operationalRecoveryService`
- **Imports (7):** `./operational-health.service`, `./sequence-safety.service`, `./data-integrity.service`, `../repositories/sequences.repository`, `./audit.service`, `../google-sheets/errors`, `../schemas/google-sheets-schema`
- **Consumers (2 files):** `src/pages/SettingsPage.tsx`, `src/tests/phase8b-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0282: `src/lib/services/phase12-workflow.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `phase12-workflow.service.ts` (.ts, 18,122 bytes)
- **Primary Purpose:** Domain orchestration service singleton for phase12-workflow
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (4):** `WorkflowTransitionInput`, `ReviewCommentInput`, `Phase12WorkflowService`, `phase12WorkflowService`
- **Imports (3):** `../repositories`, `../../types`, `../google-sheets/errors`
- **Consumers (8 files):** `src/lib/services/content-master.service.ts`, `src/lib/services/phase17-video-production.service.ts`, `src/lib/services/publishing.service.ts`, `src/lib/services/question.service.ts`, `src/lib/services/thumbnail.service.ts`, `src/lib/services/video.service.ts`, `src/lib/services/workflow-orchestration.service.ts`, `src/tests/phase12-review-assignment-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0283: `src/lib/services/phase13-refinement.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `phase13-refinement.service.ts` (.ts, 23,953 bytes)
- **Primary Purpose:** Domain orchestration service singleton for phase13-refinement
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (5):** `Actor`, `RefinementIntent`, `RefinementResult`, `Phase13RefinementService`, `phase13RefinementService`
- **Imports (6):** `../repositories`, `../google-sheets/errors`, `../ai/validators/mathematical.validator`, `../ai/gemini.client`, `../ai/phase24-orchestrator.service`, `../../types`
- **Consumers (1 files):** `src/tests/phase13-ai-refinement-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: YES (@google/genai SDK)
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0284: `src/lib/services/phase14-drive.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `phase14-drive.service.ts` (.ts, 9,870 bytes)
- **Primary Purpose:** Domain orchestration service singleton for phase14-drive
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** STRONG DUPLICATE CANDIDATE (Counterpart: `src/lib/services/google-drive.service.ts`, Reason: Dual implementations of Google Drive folder resolution and upload logic)
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (3):** `UploadAssetParams`, `Phase14DriveService`, `phase14DriveService`
- **Imports (7):** `stream`, `crypto`, `./google-drive.service`, `../repositories/media-assets.repository`, `../repositories/content-masters.repository`, `../../types`, `../google-sheets/errors`
- **Consumers (7 files):** `src/lib/services/phase17-video-production.service.ts`, `src/lib/services/phase18-thumbnail-intelligence.service.ts`, `src/tests/phase14-production-drive-verification.ts`, `src/tests/phase14-real-drive-e2e.ts`, `src/tests/phase17-video-workflow-verification.ts`, `src/tests/phase18-thumbnail-intelligence.ts`, `src/tests/phase20-social-review.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: YES (Binary File Operations)
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0285: `src/lib/services/phase15-script-production.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `phase15-script-production.service.ts` (.ts, 20,442 bytes)
- **Primary Purpose:** Domain orchestration service singleton for phase15-script-production
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (3):** `ScriptGenerationResponse`, `Phase15ScriptProductionService`, `phase15ScriptProductionService`
- **Imports (9):** `../repositories/questions.repository`, `../repositories/videos.repository`, `../repositories/scripts.repository`, `../ai/phase24-orchestrator.service`, `../validators/phase15-script.validator`, `./id.service`, `./audit.service`, `../../types` ... and 1 more
- **Consumers (2 files):** `src/tests/phase15-script-production-verification.ts`, `src/tests/phase16-human-script-workflow-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0286: `src/lib/services/phase17-video-production.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `phase17-video-production.service.ts` (.ts, 24,409 bytes)
- **Primary Purpose:** Domain orchestration service singleton for phase17-video-production
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (3):** `WorkflowActor`, `Phase17VideoProductionService`, `phase17VideoProductionService`
- **Imports (10):** `../repositories/questions.repository`, `../repositories/scripts.repository`, `../repositories/videos.repository`, `../repositories/media-assets.repository`, `./phase14-drive.service`, `./id.service`, `./audit.service`, `./workflow.service` ... and 2 more
- **Consumers (3 files):** `src/lib/services/phase18-thumbnail-intelligence.service.ts`, `src/tests/multi-take-persistence.test.ts`, `src/tests/phase17-video-workflow-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: YES (Binary File Operations)
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0287: `src/lib/services/phase18-thumbnail-intelligence.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `phase18-thumbnail-intelligence.service.ts` (.ts, 28,280 bytes)
- **Primary Purpose:** Domain orchestration service singleton for phase18-thumbnail-intelligence
- **Workflow Participation:** 08 Thumbnail (DIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (5):** `CreateManualCandidateInput`, `UploadThumbnailBinaryInput`, `ThumbnailBinaryUploadResult`, `Phase18ThumbnailIntelligenceService`, `phase18ThumbnailIntelligenceService`
- **Imports (17):** `../../types`, `../repositories/thumbnail-candidates.repository`, `../repositories/thumbnails.repository`, `../repositories/thumbnail-versions.repository`, `../repositories/content-masters.repository`, `../repositories/questions.repository`, `../repositories/scripts.repository`, `../repositories/videos.repository` ... and 9 more
- **Consumers (1 files):** `src/tests/phase18-thumbnail-intelligence.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: YES (Binary File Operations)
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0288: `src/lib/services/phase19-pinned-comment-intelligence.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `phase19-pinned-comment-intelligence.service.ts` (.ts, 25,333 bytes)
- **Primary Purpose:** Domain orchestration service singleton for phase19-pinned-comment-intelligence
- **Workflow Participation:** 15 Intelligence Loop (DIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (5):** `CreateManualPackageInput`, `UpdatePackageInput`, `ProductionReadinessResult`, `Phase19PinnedCommentIntelligenceService`, `phase19PinnedCommentIntelligenceService`
- **Imports (12):** `../../types`, `../repositories/pinned-comment-packages.repository`, `../repositories/pinned-comments.repository`, `../repositories/content-masters.repository`, `../repositories/questions.repository`, `../repositories/scripts.repository`, `../repositories/videos.repository`, `../repositories/publishing.repository` ... and 4 more
- **Consumers (1 files):** `src/tests/phase19-pinned-comment-intelligence.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0289: `src/lib/services/phase20-social-review.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `phase20-social-review.service.ts` (.ts, 29,934 bytes)
- **Primary Purpose:** Domain orchestration service singleton for phase20-social-review
- **Workflow Participation:** 09 Social Review (DIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `Phase20SocialReviewService`, `phase20SocialReviewService`
- **Imports (15):** `crypto`, `../../types`, `../repositories/content-masters.repository`, `../repositories/questions.repository`, `../repositories/scripts.repository`, `../repositories/videos.repository`, `../repositories/thumbnails.repository`, `../repositories/thumbnail-candidates.repository` ... and 7 more
- **Consumers (5 files):** `src/lib/services/content-master.service.ts`, `src/lib/services/publishing.service.ts`, `src/lib/services/workflow-orchestration.service.ts`, `src/tests/phase20-social-review.ts`, `src/tests/phase22-publishing-hub.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0290: `src/lib/services/phase21-platform-adaptation.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `phase21-platform-adaptation.service.ts` (.ts, 4,505 bytes)
- **Primary Purpose:** Domain orchestration service singleton for phase21-platform-adaptation
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `Phase21PlatformAdaptationService`, `phase21PlatformAdaptationService`
- **Imports (2):** `../../types`, `./platform-adaptation.service`
- **Consumers (6 files):** `src/lib/services/publishing.service.ts`, `src/lib/services/social-enhancement.service.ts`, `src/lib/services/social-quality.service.ts`, `src/lib/services/social-review.service.ts`, `src/tests/phase21-platform-adaptation.ts`, `src/tests/phase22-publishing-hub.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0291: `src/lib/services/phase22-publishing-hub.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `phase22-publishing-hub.service.ts` (.ts, 3,006 bytes)
- **Primary Purpose:** Domain orchestration service singleton for phase22-publishing-hub
- **Workflow Participation:** 11 Published (DIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `Phase22PublishingHubService`, `phase22PublishingHubService`
- **Imports (2):** `../../types`, `./publishing.service`
- **Consumers (1 files):** `src/tests/phase22-publishing-hub.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0292: `src/lib/services/phase23-production.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `phase23-production.service.ts` (.ts, 35,800 bytes)
- **Primary Purpose:** Domain orchestration service singleton for phase23-production
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (3):** `Phase23ContextData`, `Phase23ProductionService`, `phase23ProductionService`
- **Imports (5):** `../repositories`, `./object-auth.service`, `./publishing.service`, `./taxonomy.service`, `../../types`
- **Consumers (2 files):** `src/lib/services/phase26-copilot.service.ts`, `src/tests/phase23-production-dashboard.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0293: `src/lib/services/phase25-consensus.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `phase25-consensus.service.ts` (.ts, 19,937 bytes)
- **Primary Purpose:** Domain orchestration service singleton for phase25-consensus
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (3):** `AuthorizationError`, `Phase25ConsensusService`, `phase25ConsensusService`
- **Imports (6):** `crypto`, `../../types/phase25-consensus`, `../ai/types`, `../ai/phase24-registry`, `../ai/phase24-orchestrator.service`, `../../types/phase24-ai`
- **Consumers (1 files):** `src/tests/run-phase25-only.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0294: `src/lib/services/phase26-copilot.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `phase26-copilot.service.ts` (.ts, 46,555 bytes)
- **Primary Purpose:** Domain orchestration service singleton for phase26-copilot
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (3):** `CopilotAuthorizationError`, `Phase26CopilotService`, `phase26CopilotService`
- **Imports (7):** `crypto`, `../../types/phase26-copilot`, `../../types`, `./object-auth.service`, `../ai/phase24-orchestrator.service`, `./phase23-production.service`, `../repositories`
- **Consumers (1 files):** `src/tests/run-phase26-only.ts`
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0295: `src/lib/services/pinned-comment.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `pinned-comment.service.ts` (.ts, 10,208 bytes)
- **Primary Purpose:** Domain orchestration service singleton for pinned-comment
- **Workflow Participation:** 15 Intelligence Loop (DIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (3):** `PinnedCommentPayload`, `PinnedCommentService`, `pinnedCommentService`
- **Imports (9):** `../repositories/pinned-comments.repository`, `../repositories/publishing.repository`, `../repositories/videos.repository`, `../repositories/questions.repository`, `../repositories/workflow.repository`, `./id.service`, `./audit.service`, `../../types` ... and 1 more
- **Consumers (5 files):** `src/tests/phase6-verification.ts`, `src/tests/qs14b-e2e-production-execution.ts`, `src/tests/stage8-continuous-verification.ts`, `src/tests/task2e4-pinned-comment-workflow.ts`, `src/tests/task8-publishing-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0296: `src/lib/services/planning.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `planning.service.ts` (.ts, 30,622 bytes)
- **Primary Purpose:** Domain orchestration service singleton for planning
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `PlanningService`, `planningService`
- **Imports (9):** `../repositories/content-plans.repository`, `../repositories/content-batches.repository`, `../repositories/questions.repository`, `../repositories/videos.repository`, `./id.service`, `./taxonomy.service`, `./audit.service`, `../../types` ... and 1 more
- **Consumers (2 files):** `src/tests/category-decoupling-verification.test.ts`, `src/tests/task3a-planning-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0297: `src/lib/services/platform-adaptation.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `platform-adaptation.service.ts` (.ts, 54,423 bytes)
- **Primary Purpose:** Domain orchestration service singleton for platform-adaptation
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (6):** `getGraphemeCount`, `safeTruncate`, `detectAnswerLeakage`, `adaptHashtags`, `PlatformAdaptationService`, `platformAdaptationService`
- **Imports (12):** `crypto`, `../../types`, `../validators/social-invariance.validator`, `../ai/phase24-orchestrator.service`, `../ai/types`, `../repositories/platform-adaptations.repository`, `../repositories/content-masters.repository`, `../repositories/questions.repository` ... and 4 more
- **Consumers (9 files):** `src/lib/services/phase21-platform-adaptation.service.ts`, `src/lib/services/publishing.service.ts`, `src/lib/services/social-enhancement.service.ts`, `src/lib/services/social-quality.service.ts`, `src/lib/services/social-review.service.ts`, `src/tests/phase21-platform-adaptation.ts`, `src/tests/phase22-publishing-hub.ts`, `src/tests/qs14b-e2e-production-execution.ts` ... and 1 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0298: `src/lib/services/production-asset-validation.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `production-asset-validation.service.ts` (.ts, 6,928 bytes)
- **Primary Purpose:** Domain orchestration service singleton for production-asset-validation
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `ProductionAssetValidationService`
- **Imports (1):** `../../types`
- **Consumers (9 files):** `src/components/publishing/PublishingTable.tsx`, `src/lib/services/production-board.service.ts`, `src/lib/services/publishing.service.ts`, `src/lib/services/video.service.ts`, `src/server/routes.ts`, `src/tests/phase12-step2-production-asset-validation.ts`, `src/tests/phase12-step3-production-asset-synchronization.ts`, `src/tests/phase12-step4-production-asset-readiness.ts` ... and 1 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0299: `src/lib/services/production-board.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `production-board.service.ts` (.ts, 7,619 bytes)
- **Primary Purpose:** Domain orchestration service singleton for production-board
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `ProductionBoardService`, `productionBoardService`
- **Imports (4):** `../../types`, `./publishing.service`, `./production-asset-validation.service`, `../repositories`
- **Consumers (1 files):** `src/tests/phase12-step4-production-asset-readiness.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0300: `src/lib/services/production-sheet-initializer.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `production-sheet-initializer.service.ts` (.ts, 12,491 bytes)
- **Primary Purpose:** Domain orchestration service singleton for production-sheet-initializer
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (3):** `SheetInitializationReport`, `ProductionSheetInitializer`, `productionSheetInitializer`
- **Imports (11):** `../google-sheets/client`, `../schemas/google-sheets-schema`, `../repositories/sequences.repository`, `../repositories/users.repository`, `../repositories/categories.repository`, `../repositories/topics.repository`, `../repositories/subtopics.repository`, `../repositories/question-config.repository` ... and 3 more
- **Consumers (2 files):** `src/tests/production-sheet-initializer-test.ts`, `src/tests/task2-content-master-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0301: `src/lib/services/publishing.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `publishing.service.ts` (.ts, 81,295 bytes)
- **Primary Purpose:** Domain orchestration service singleton for publishing
- **Workflow Participation:** 11 Published (DIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (4):** `CreatePublishingAssignmentInput`, `PublishReadinessResult`, `PublishingService`, `publishingService`
- **Imports (25):** `crypto`, `../repositories/publishing.repository`, `../repositories/social-reviews.repository`, `../repositories/content-masters.repository`, `../repositories/videos.repository`, `../repositories/questions.repository`, `../repositories/thumbnails.repository`, `../repositories/pinned-comments.repository` ... and 17 more
- **Consumers (24 files):** `src/lib/services/phase22-publishing-hub.service.ts`, `src/lib/services/phase23-production.service.ts`, `src/lib/services/production-board.service.ts`, `src/lib/services/workflow-orchestration.service.ts`, `src/tests/phase09-publishing-workflow-verification.ts`, `src/tests/phase10-publishing-verification.ts`, `src/tests/phase11-canonical-lifecycle-verification.ts`, `src/tests/phase12-step3-production-asset-synchronization.ts` ... and 16 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0302: `src/lib/services/question-config.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `question-config.service.ts` (.ts, 12,945 bytes)
- **Primary Purpose:** Domain orchestration service singleton for question-config
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (3):** `QuestionConfigError`, `QuestionConfigService`, `questionConfigService`
- **Imports (3):** `../repositories/question-config.repository`, `../../types`, `../schemas/google-sheets-schema`
- **Consumers (13 files):** `src/lib/ai/orchestrator.ts`, `src/lib/ai/phase24-orchestrator.service.ts`, `src/lib/services/question.service.ts`, `src/lib/services/smart-random.service.ts`, `src/lib/validation/multi-layer-verification.engine.ts`, `src/tests/idempotency-concurrency-resilience.test.ts`, `src/tests/phase-6-configuration-engine.ts`, `src/tests/phase-7-ai-generation-engine.ts` ... and 5 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0303: `src/lib/services/question-draft.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `question-draft.service.ts` (.ts, 6,582 bytes)
- **Primary Purpose:** Domain orchestration service singleton for question-draft
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (3):** `SaveDraftInput`, `QuestionDraftService`, `questionDraftService`
- **Imports (4):** `../../types`, `../repositories/question-drafts.repository`, `./taxonomy.service`, `./question.service`
- **Consumers (3 files):** `src/server/routes.ts`, `src/tests/stage01-draft-workflow-separation.test.ts`, `src/tests/stage02-targeted-bugfixes.test.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0304: `src/lib/services/question-validation.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `question-validation.service.ts` (.ts, 5,645 bytes)
- **Primary Purpose:** Domain orchestration service singleton for question-validation
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (3):** `ValidationActor`, `QuestionValidationService`, `questionValidationService`
- **Imports (6):** `../repositories/questions.repository`, `../repositories/question-drafts.repository`, `../repositories/validations.repository`, `./audit.service`, `../validation/question-validation.engine`, `../../types`
- **Consumers (7 files):** `src/tests/hybrid-math-boundary.test.ts`, `src/tests/phase9-verification.ts`, `src/tests/stage01-draft-workflow-separation.test.ts`, `src/tests/stage02-targeted-bugfixes.test.ts`, `src/tests/task5b-security-correctness-verification.ts`, `src/tests/task6d-validation-adapter-verification.ts`, `src/tests/task7b-unified-studio-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0305: `src/lib/services/question.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `question.service.ts` (.ts, 42,636 bytes)
- **Primary Purpose:** Domain orchestration service singleton for question
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **HIGH** (Core business state machine and RBAC safety gates governing production data mutations)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (5):** `DuplicateMatch`, `normalizeQuestionText`, `IdempotencyCacheEntry`, `QuestionService`, `questionService`
- **Imports (17):** `../repositories/questions.repository`, `../repositories/content-masters.repository`, `../repositories/validations.repository`, `../schemas/google-sheets-schema`, `../../types`, `./id.service`, `./taxonomy.service`, `./workflow.service` ... and 9 more
- **Consumers (38 files):** `scripts/test-task-3b2-ui-e2e.ts`, `scripts/verify-task5.ts`, `src/lib/services/question-draft.service.ts`, `src/tests/category-decoupling-verification.test.ts`, `src/tests/creation-compensation-resilience.test.ts`, `src/tests/edit-integration-test.ts`, `src/tests/fraction-persistence-retest.ts`, `src/tests/idempotency-concurrency-resilience.test.ts` ... and 30 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0306: `src/lib/services/restore-validator.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `restore-validator.service.ts` (.ts, 16,625 bytes)
- **Primary Purpose:** Domain orchestration service singleton for restore-validator
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (6):** `RestoreValidationRequest`, `RestoreConflict`, `MissingDependency`, `RestoreValidationResult`, `RestoreValidatorService`, `restoreValidatorService`
- **Imports (4):** `node:crypto`, `./snapshot-exporter.service`, `../schemas/google-sheets-schema`, `../repositories`
- **Consumers (11 files):** `src/lib/services/full-snapshot-preflight.service.ts`, `src/lib/services/full-snapshot-restore-plan.service.ts`, `src/lib/services/full-snapshot-restore.service.ts`, `src/lib/services/granular-assignment-restore.service.ts`, `src/lib/services/granular-pinned-comment-restore.service.ts`, `src/lib/services/granular-publishing-restore.service.ts`, `src/lib/services/granular-question-restore.service.ts`, `src/lib/services/granular-script-restore.service.ts` ... and 3 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0307: `src/lib/services/script.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `script.service.ts` (.ts, 15,877 bytes)
- **Primary Purpose:** Domain orchestration service singleton for script
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (4):** `ScriptContentPayload`, `SaveScriptOptions`, `ScriptService`, `scriptService`
- **Imports (9):** `../repositories/scripts.repository`, `../repositories/videos.repository`, `../repositories/questions.repository`, `./id.service`, `./audit.service`, `./video.service`, `../ai/phase24-orchestrator.service`, `../../types` ... and 1 more
- **Consumers (14 files):** `scripts/verify-task5.ts`, `src/lib/ai/gemini.service.ts`, `src/lib/ai/phase24-orchestrator.service.ts`, `src/lib/ai/validators/script.validator.ts`, `src/tests/phase10-verification.ts`, `src/tests/phase6-verification.ts`, `src/tests/phase8-recovery-verification.ts`, `src/tests/phase9-content-workflow-verification.ts` ... and 6 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0308: `src/lib/services/sequence-safety.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `sequence-safety.service.ts` (.ts, 12,349 bytes)
- **Primary Purpose:** Domain orchestration service singleton for sequence-safety
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (4):** `SequenceAnomaly`, `SequenceSafetyReport`, `SequenceSafetyService`, `sequenceSafetyService`
- **Imports (3):** `../repositories/sequences.repository`, `../repositories`, `../schemas/google-sheets-schema`
- **Consumers (5 files):** `src/lib/services/full-snapshot-restore-execution.service.ts`, `src/lib/services/operational-recovery.service.ts`, `src/pages/SettingsPage.tsx`, `src/tests/phase8b-verification.ts`, `src/tests/task2-content-master-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0309: `src/lib/services/similarity.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `similarity.service.ts` (.ts, 10,957 bytes)
- **Primary Purpose:** Domain orchestration service singleton for similarity
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (4):** `QuestionSimilarityMatch`, `DiversityRadarReport`, `SimilarityService`, `similarityService`
- **Imports (3):** `../repositories/questions.repository`, `./taxonomy.service`, `../../types`
- **Consumers (4 files):** `src/lib/validation/multi-layer-verification.engine.ts`, `src/pages/PlanningPage.tsx`, `src/tests/phase-5-question-model.ts`, `src/tests/task3a-planning-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0310: `src/lib/services/smart-random.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `smart-random.service.ts` (.ts, 8,300 bytes)
- **Primary Purpose:** Domain orchestration service singleton for smart-random
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (4):** `ResolvedCreationParameters`, `SmartRandomInput`, `SmartRandomService`, `smartRandomService`
- **Imports (6):** `../../config/question-creation.config`, `./taxonomy.service`, `../repositories/questions.repository`, `./question-config.service`, `../google-sheets/errors`, `../../types`
- **Consumers (9 files):** `src/lib/services/question.service.ts`, `src/tests/category-decoupling-verification.test.ts`, `src/tests/creation-compensation-resilience.test.ts`, `src/tests/idempotency-concurrency-resilience.test.ts`, `src/tests/phase-6-configuration-engine.ts`, `src/tests/pipeline-convergence-sequence-resilience.test.ts`, `src/tests/real-life-context-configuration.test.ts`, `src/tests/task4-question-creation-engine-verification.ts` ... and 1 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0311: `src/lib/services/snapshot-exporter.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `snapshot-exporter.service.ts` (.ts, 4,404 bytes)
- **Primary Purpose:** Domain orchestration service singleton for snapshot-exporter
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (5):** `WorksheetSnapshot`, `SnapshotMetadata`, `GoogleSheetsSnapshot`, `SnapshotExporterService`, `snapshotExporterService`
- **Imports (4):** `../google-sheets/client`, `../schemas/google-sheets-schema`, `../repositories/sequences.repository`, `node:crypto`
- **Consumers (32 files):** `src/lib/services/durable-snapshot-archive.service.ts`, `src/lib/services/full-snapshot-preflight.service.ts`, `src/lib/services/full-snapshot-restore-execution.service.ts`, `src/lib/services/full-snapshot-restore-plan.service.ts`, `src/lib/services/full-snapshot-restore.service.ts`, `src/lib/services/granular-assignment-restore.service.ts`, `src/lib/services/granular-pinned-comment-restore.service.ts`, `src/lib/services/granular-publishing-restore.service.ts` ... and 24 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0312: `src/lib/services/snapshot-history.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `snapshot-history.service.ts` (.ts, 8,382 bytes)
- **Primary Purpose:** Domain orchestration service singleton for snapshot-history
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (3):** `SnapshotHistoryItem`, `SnapshotHistoryService`, `snapshotHistoryService`
- **Imports (3):** `./snapshot-exporter.service`, `../../config/snapshot.config`, `./durable-snapshot-archive.service`
- **Consumers (4 files):** `src/lib/services/snapshot-scheduler.service.ts`, `src/tests/task3f410c-durable-archive-integration-verification.ts`, `src/tests/task3f410e-gcs-smoke-test.ts`, `src/tests/task3f410f-scheduler-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0313: `src/lib/services/snapshot-scheduler.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `snapshot-scheduler.service.ts` (.ts, 12,718 bytes)
- **Primary Purpose:** Domain orchestration service singleton for snapshot-scheduler
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (5):** `RetentionCandidateReport`, `RetentionEvaluationReport`, `SchedulerStatusReport`, `SnapshotSchedulerService`, `snapshotSchedulerService`
- **Imports (4):** `../../config/snapshot.config`, `./snapshot-history.service`, `./durable-snapshot-archive.service`, `./snapshot-exporter.service`
- **Consumers (2 files):** `server.ts`, `src/tests/task3f410f-scheduler-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0314: `src/lib/services/social-comments.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `social-comments.service.ts` (.ts, 11,420 bytes)
- **Primary Purpose:** Domain orchestration service singleton for social-comments
- **Workflow Participation:** 15 Intelligence Loop (DIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (4):** `CommentIngestionResult`, `BatchImportCommentsResult`, `SocialCommentsService`, `socialCommentsService`
- **Imports (6):** `../repositories/social-comments.repository`, `../repositories/content-masters.repository`, `./id.service`, `../repositories/audit-log.repository`, `../schemas/google-sheets-schema`, `../../types`
- **Consumers (4 files):** `src/server/routes.ts`, `src/tests/run-phase30-social-comments.ts`, `src/tests/run-phase31-comment-intelligence.ts`, `src/tests/run-phase32-c4-feedback-loop.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0315: `src/lib/services/social-enhancement.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `social-enhancement.service.ts` (.ts, 26,455 bytes)
- **Primary Purpose:** Domain orchestration service singleton for social-enhancement
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `SocialEnhancementService`
- **Imports (5):** `../../types`, `../validators/social-invariance.validator`, `../ai/phase24-orchestrator.service`, `./platform-adaptation.service`, `./social-quality.service`
- **Consumers (11 files):** `src/lib/services/social-review.service.ts`, `src/server/routes.ts`, `src/tests/phase13-live-verification.ts`, `src/tests/phase13-step3-package-copier.ts`, `src/tests/task8b-social-content-foundation-verification.ts`, `src/tests/task8c-hook-presentation-engine-verification.ts`, `src/tests/task8d-teleprompter-spoken-enhancer-verification.ts`, `src/tests/task8e-social-metadata-generator-verification.ts` ... and 3 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0316: `src/lib/services/social-performance-intelligence.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `social-performance-intelligence.service.ts` (.ts, 35,995 bytes)
- **Primary Purpose:** Domain orchestration service singleton for social-performance-intelligence
- **Workflow Participation:** 14 Performance Review (DIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `SocialPerformanceIntelligenceService`, `socialPerformanceIntelligenceService`
- **Imports (11):** `./analytics.service`, `../repositories/intelligence.repository`, `./id.service`, `./taxonomy.service`, `../repositories/audit-log.repository`, `../ai/gemini.client`, `../ai/phase24-orchestrator.service`, `../../types/phase24-ai` ... and 3 more
- **Consumers (6 files):** `src/lib/services/content-strategy.service.ts`, `src/tests/phase28-social-performance-intelligence-verification.ts`, `src/tests/phase29-controlled-strategy-integration-verification.ts`, `src/tests/phase29b-posting-time-intelligence-verification.ts`, `src/tests/run-phase28-only.ts`, `src/tests/stage8-continuous-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: YES (@google/genai SDK)
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0317: `src/lib/services/social-quality.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `social-quality.service.ts` (.ts, 19,762 bytes)
- **Primary Purpose:** Domain orchestration service singleton for social-quality
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (3):** `QUALITY_DIMENSION_WEIGHTS`, `SocialQualityService`, `socialQualityService`
- **Imports (5):** `../../types`, `../validators/social-invariance.validator`, `../ai/phase24-orchestrator.service`, `../ai/types`, `./platform-adaptation.service`
- **Consumers (2 files):** `src/lib/services/social-enhancement.service.ts`, `src/tests/task8g-social-quality-engagement-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0318: `src/lib/services/social-review.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `social-review.service.ts` (.ts, 27,162 bytes)
- **Primary Purpose:** Domain orchestration service singleton for social-review
- **Workflow Participation:** 09 Social Review (DIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `SocialReviewService`, `socialReviewService`
- **Imports (11):** `crypto`, `../../types`, `../repositories/questions.repository`, `../repositories/content-masters.repository`, `../repositories/social-reviews.repository`, `../repositories/audit-log.repository`, `../repositories/workflow.repository`, `../repositories/videos.repository` ... and 3 more
- **Consumers (21 files):** `src/lib/services/content-master.service.ts`, `src/lib/services/publishing.service.ts`, `src/lib/services/workflow-orchestration.service.ts`, `src/server/routes.ts`, `src/tests/phase09-publishing-workflow-verification.ts`, `src/tests/phase10-publishing-verification.ts`, `src/tests/phase10-verification.ts`, `src/tests/phase13-live-verification.ts` ... and 13 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0319: `src/lib/services/spreadsheet-verification.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `spreadsheet-verification.service.ts` (.ts, 12,215 bytes)
- **Primary Purpose:** Domain orchestration service singleton for spreadsheet-verification
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (4):** `TabVerificationResult`, `SpreadsheetHealthReport`, `SpreadsheetVerificationService`, `spreadsheetVerificationService`
- **Imports (5):** `../google-sheets/client`, `../schemas/google-sheets-schema`, `../google-sheets/helpers`, `../repositories/sequences.repository`, `../repositories`
- **Consumers (2 files):** `src/tests/live-production-verification.ts`, `src/tests/phase2-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0320: `src/lib/services/taxonomy.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `taxonomy.service.ts` (.ts, 36,629 bytes)
- **Primary Purpose:** Domain orchestration service singleton for taxonomy
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (7):** `CreateCategoryInput`, `TaxonomyTreeItem`, `PureTaxonomyTopic`, `TaxonomyMetrics`, `BulkImportDryRunReport`, `TaxonomyService`, `taxonomyService`
- **Imports (6):** `../repositories`, `../../types`, `../google-sheets/errors`, `./id.service`, `./audit.service`, `../schemas/google-sheets-schema`
- **Consumers (46 files):** `scripts/test-task-3b2-ui-e2e.ts`, `scripts/verify-task5.ts`, `src/lib/ai/gemini.service.ts`, `src/lib/services/content-strategy.service.ts`, `src/lib/services/granular-question-restore.service.ts`, `src/lib/services/phase23-production.service.ts`, `src/lib/services/planning.service.ts`, `src/lib/services/question-draft.service.ts` ... and 38 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0321: `src/lib/services/thumbnail.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `thumbnail.service.ts` (.ts, 19,508 bytes)
- **Primary Purpose:** Domain orchestration service singleton for thumbnail
- **Workflow Participation:** 08 Thumbnail (DIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (4):** `ThumbnailPayload`, `SaveThumbnailOptions`, `ThumbnailService`, `thumbnailService`
- **Imports (10):** `../repositories/thumbnails.repository`, `../repositories/videos.repository`, `../repositories/questions.repository`, `../repositories/publishing.repository`, `./id.service`, `./audit.service`, `./workflow.service`, `./google-drive.service` ... and 2 more
- **Consumers (10 files):** `src/tests/phase10-verification.ts`, `src/tests/phase13-9-thumbnail-rollback-remediation.ts`, `src/tests/phase6-verification.ts`, `src/tests/phase9-content-workflow-verification.ts`, `src/tests/qs14b-e2e-production-execution.ts`, `src/tests/stage8-continuous-verification.ts`, `src/tests/task2e3-thumbnail-workflow.ts`, `src/tests/task3d4-script-designer-workflow-verification.ts` ... and 2 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: YES (Binary File Operations)
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0322: `src/lib/services/video.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `video.service.ts` (.ts, 36,578 bytes)
- **Primary Purpose:** Domain orchestration service singleton for video
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **HIGH** (Core business state machine and RBAC safety gates governing production data mutations)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (3):** `VALID_VIDEO_TRANSITIONS`, `VideoService`, `videoService`
- **Imports (15):** `../repositories`, `../repositories/media-assets.repository`, `./id.service`, `./workflow.service`, `./audit.service`, `./assignment.service`, `./content-master.service`, `./google-drive.service` ... and 7 more
- **Consumers (26 files):** `scripts/verify-task5.ts`, `src/lib/services/publishing.service.ts`, `src/lib/services/question.service.ts`, `src/lib/services/script.service.ts`, `src/tests/multi-take-persistence.test.ts`, `src/tests/phase10-verification.ts`, `src/tests/phase12-step2-production-asset-validation.ts`, `src/tests/phase12-step3-production-asset-synchronization.ts` ... and 18 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: YES (Binary File Operations)
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0323: `src/lib/services/workflow-orchestration.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `workflow-orchestration.service.ts` (.ts, 31,066 bytes)
- **Primary Purpose:** Domain orchestration service singleton for workflow-orchestration
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (4):** `CanonicalWorkflowState`, `CanonicalWorkflowSummary`, `WorkflowOrchestrationService`, `workflowOrchestrationService`
- **Imports (12):** `../../types`, `../repositories/questions.repository`, `../repositories/videos.repository`, `../repositories/content-masters.repository`, `../repositories/assignments.repository`, `./object-auth.service`, `./social-review.service`, `./publishing.service` ... and 4 more
- **Consumers (2 files):** `src/tests/phase16-step2-lifecycle-orchestration.ts`, `src/tests/phase9-content-workflow-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0324: `src/lib/services/workflow.service.ts`

- **Directory:** `src/lib/services`
- **Filename:** `workflow.service.ts` (.ts, 187 bytes)
- **Primary Purpose:** Domain orchestration service singleton for workflow
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (0):** None
- **Consumers (15 files):** `src/lib/services/content-master.service.ts`, `src/lib/services/phase17-video-production.service.ts`, `src/lib/services/publishing.service.ts`, `src/lib/services/question.service.ts`, `src/lib/services/thumbnail.service.ts`, `src/lib/services/video.service.ts`, `src/lib/services/workflow-orchestration.service.ts`, `src/tests/phase12-review-assignment-verification.ts` ... and 7 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0325: `src/lib/validation/ambiguity.detector.ts`

- **Directory:** `src/lib/validation`
- **Filename:** `ambiguity.detector.ts` (.ts, 3,525 bytes)
- **Primary Purpose:** Validation engine for mathematical and question consistency
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `AmbiguityDetector`
- **Imports (1):** `../../types`
- **Consumers (3 files):** `src/lib/validation/multi-layer-verification.engine.ts`, `src/lib/validation/question-validation.engine.ts`, `src/tests/task5-question-validation-engine-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0326: `src/lib/validation/consensus.engine.ts`

- **Directory:** `src/lib/validation`
- **Filename:** `consensus.engine.ts` (.ts, 4,374 bytes)
- **Primary Purpose:** Validation engine for mathematical and question consistency
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `ConsensusEvaluationResult`, `ConsensusEngine`
- **Imports (1):** `../../types`
- **Consumers (4 files):** `src/lib/validation/question-validation.engine.ts`, `src/tests/hybrid-math-boundary.test.ts`, `src/tests/task5-question-validation-engine-verification.ts`, `src/tests/task6d-validation-adapter-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0327: `src/lib/validation/consistency.validator.ts`

- **Directory:** `src/lib/validation`
- **Filename:** `consistency.validator.ts` (.ts, 4,559 bytes)
- **Primary Purpose:** Validation engine for mathematical and question consistency
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `ConsistencyValidator`
- **Imports (1):** `../../types`
- **Consumers (3 files):** `src/lib/validation/multi-layer-verification.engine.ts`, `src/lib/validation/question-validation.engine.ts`, `src/tests/task5-question-validation-engine-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0328: `src/lib/validation/explanation.validator.ts`

- **Directory:** `src/lib/validation`
- **Filename:** `explanation.validator.ts` (.ts, 4,720 bytes)
- **Primary Purpose:** Validation engine for mathematical and question consistency
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `ExplanationValidator`
- **Imports (1):** `../../types`
- **Consumers (4 files):** `src/lib/validation/multi-layer-verification.engine.ts`, `src/lib/validation/question-validation.engine.ts`, `src/tests/task5-question-validation-engine-verification.ts`, `src/tests/task5b-security-correctness-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0329: `src/lib/validation/fairness.validator.ts`

- **Directory:** `src/lib/validation`
- **Filename:** `fairness.validator.ts` (.ts, 4,062 bytes)
- **Primary Purpose:** Validation engine for mathematical and question consistency
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `FairnessValidator`
- **Imports (1):** `../../types`
- **Consumers (3 files):** `src/lib/validation/multi-layer-verification.engine.ts`, `src/lib/validation/question-validation.engine.ts`, `src/tests/task5-question-validation-engine-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0330: `src/lib/validation/gemini-validation.provider.ts`

- **Directory:** `src/lib/validation`
- **Filename:** `gemini-validation.provider.ts` (.ts, 4,065 bytes)
- **Primary Purpose:** Validation engine for mathematical and question consistency
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `GeminiValidationProvider`, `geminiValidationProvider`
- **Imports (6):** `../../types`, `../ai/config`, `../ai/gemini.client`, `../ai/error`, `../ai/prompts/validation.prompt`, `../ai/schemas/validation.schema`
- **Consumers (1 files):** `src/tests/task6d-validation-adapter-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: YES (@google/genai SDK)
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0331: `src/lib/validation/index.ts`

- **Directory:** `src/lib/validation`
- **Filename:** `index.ts` (.ts, 387 bytes)
- **Primary Purpose:** Validation engine for mathematical and question consistency
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (0):** None
- **Consumers (1 files):** `src/types/phase26-copilot.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0332: `src/lib/validation/interfaces.ts`

- **Directory:** `src/lib/validation`
- **Filename:** `interfaces.ts` (.ts, 421 bytes)
- **Primary Purpose:** Validation engine for mathematical and question consistency
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (0):** None
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0333: `src/lib/validation/mathematical-logical.engine.ts`

- **Directory:** `src/lib/validation`
- **Filename:** `mathematical-logical.engine.ts` (.ts, 55,732 bytes)
- **Primary Purpose:** Validation engine for mathematical and question consistency
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `SolverSolution`, `MathematicalLogicalEngine`
- **Imports (1):** `../../types`
- **Consumers (6 files):** `src/lib/validation/multi-layer-verification.engine.ts`, `src/lib/validation/question-validation.engine.ts`, `src/tests/hybrid-math-boundary.test.ts`, `src/tests/qs-repair-regression.test.ts`, `src/tests/qs-successive-percentage-math.test.ts`, `src/tests/task5-question-validation-engine-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0334: `src/lib/validation/multi-layer-verification.engine.ts`

- **Directory:** `src/lib/validation`
- **Filename:** `multi-layer-verification.engine.ts` (.ts, 32,661 bytes)
- **Primary Purpose:** Validation engine for mathematical and question consistency
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (6):** `VerificationLayerStatus`, `VerificationLayerResult`, `HumanReviewState`, `MultiLayerVerificationOptions`, `MultiLayerVerificationReport`, `MultiLayerVerificationEngine`
- **Imports (13):** `../../types`, `../validators/question-creation.validator`, `../services/taxonomy.service`, `../services/question-config.service`, `./mathematical-logical.engine`, `./options.validator`, `./explanation.validator`, `./ambiguity.detector` ... and 5 more
- **Consumers (7 files):** `src/lib/services/question.service.ts`, `src/lib/validation/question-validation.engine.ts`, `src/tests/creation-compensation-resilience.test.ts`, `src/tests/idempotency-concurrency-resilience.test.ts`, `src/tests/phase9-verification.ts`, `src/tests/pipeline-convergence-sequence-resilience.test.ts`, `src/tests/unified-question-creation.test.ts`
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: YES (@google/genai SDK)
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0335: `src/lib/validation/options.validator.ts`

- **Directory:** `src/lib/validation`
- **Filename:** `options.validator.ts` (.ts, 13,921 bytes)
- **Primary Purpose:** Validation engine for mathematical and question consistency
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (5):** `OptionsValidationResult`, `ParsedNumericOption`, `parseNumericOptionWithUnit`, `normalizeNumericOption`, `OptionsValidator`
- **Imports (1):** `../../types`
- **Consumers (5 files):** `src/lib/validation/multi-layer-verification.engine.ts`, `src/lib/validation/question-validation.engine.ts`, `src/tests/task5-question-validation-engine-verification.ts`, `src/tests/task5b-security-correctness-verification.ts`, `src/tests/task7c-question-studio-quality-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0336: `src/lib/validation/question-validation.engine.ts`

- **Directory:** `src/lib/validation`
- **Filename:** `question-validation.engine.ts` (.ts, 21,377 bytes)
- **Primary Purpose:** Validation engine for mathematical and question consistency
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `ValidationPipelineOptions`, `QuestionValidationEngine`
- **Imports (12):** `../../types`, `../validators/question-creation.validator`, `../services/taxonomy.service`, `./options.validator`, `./mathematical-logical.engine`, `./explanation.validator`, `./ambiguity.detector`, `./consistency.validator` ... and 4 more
- **Consumers (11 files):** `src/lib/services/question-validation.service.ts`, `src/tests/integration-semantic.test.ts`, `src/tests/qs-repair-regression.test.ts`, `src/tests/qs-successive-percentage-math.test.ts`, `src/tests/qs-validation-alias-regression.test.ts`, `src/tests/qs21b-mathematical-safety-gate.test.ts`, `src/tests/studio-e2e-integration.ts`, `src/tests/task5-question-validation-engine-verification.ts` ... and 3 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0337: `src/lib/validation/testing/mock-validation-provider.ts`

- **Directory:** `src/lib/validation/testing`
- **Filename:** `mock-validation-provider.ts` (.ts, 2,000 bytes)
- **Primary Purpose:** Validation engine for mathematical and question consistency
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `MockValidationOutcome`, `MockQuestionValidatorProvider`
- **Imports (1):** `../../../types`
- **Consumers (1 files):** `src/tests/task6d-validation-adapter-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0338: `src/lib/validators/phase15-script.validator.ts`

- **Directory:** `src/lib/validators`
- **Filename:** `phase15-script.validator.ts` (.ts, 5,056 bytes)
- **Primary Purpose:** Application utility or helper module
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `Phase15ValidationReport`, `Phase15ScriptValidator`
- **Imports (1):** `../../types`
- **Consumers (1 files):** `src/lib/services/phase15-script-production.service.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0339: `src/lib/validators/phase20-social-quality-gate.validator.ts`

- **Directory:** `src/lib/validators`
- **Filename:** `phase20-social-quality-gate.validator.ts` (.ts, 16,772 bytes)
- **Primary Purpose:** Application utility or helper module
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `Phase20SocialQualityGateValidator`
- **Imports (3):** `../../types`, `./thumbnail-safety.validator`, `./pinned-comment-safety.validator`
- **Consumers (2 files):** `src/lib/services/phase20-social-review.service.ts`, `src/tests/phase20-social-review.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0340: `src/lib/validators/pinned-comment-safety.validator.ts`

- **Directory:** `src/lib/validators`
- **Filename:** `pinned-comment-safety.validator.ts` (.ts, 10,784 bytes)
- **Primary Purpose:** Application utility or helper module
- **Workflow Participation:** 15 Intelligence Loop (DIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `PinnedCommentSafetyValidator`
- **Imports (1):** `../../types`
- **Consumers (4 files):** `src/lib/ai/gemini.service.ts`, `src/lib/services/phase19-pinned-comment-intelligence.service.ts`, `src/lib/validators/phase20-social-quality-gate.validator.ts`, `src/tests/phase19-pinned-comment-intelligence.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0341: `src/lib/validators/platform-adaptation.validator.ts`

- **Directory:** `src/lib/validators`
- **Filename:** `platform-adaptation.validator.ts` (.ts, 4,621 bytes)
- **Primary Purpose:** Application utility or helper module
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `PlatformValidationResult`, `PlatformAdaptationValidator`
- **Imports (2):** `../../types`, `../google-sheets/errors`
- **Consumers (1 files):** `src/lib/services/platform-adaptation.service.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0342: `src/lib/validators/question-creation.validator.ts`

- **Directory:** `src/lib/validators`
- **Filename:** `question-creation.validator.ts` (.ts, 11,514 bytes)
- **Primary Purpose:** Application utility or helper module
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `QuestionCreationRequestPayload`, `QuestionCreationValidator`
- **Imports (3):** `../google-sheets/errors`, `../../config/question-creation.config`, `../../types`
- **Consumers (12 files):** `src/lib/ai/phase24-orchestrator.service.ts`, `src/lib/services/question.service.ts`, `src/lib/validation/multi-layer-verification.engine.ts`, `src/lib/validation/question-validation.engine.ts`, `src/tests/idempotency-concurrency-resilience.test.ts`, `src/tests/phase-5-question-model.ts`, `src/tests/qs-repair-regression.test.ts`, `src/tests/qs21b-mathematical-safety-gate.test.ts` ... and 4 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0343: `src/lib/validators/social-invariance.validator.ts`

- **Directory:** `src/lib/validators`
- **Filename:** `social-invariance.validator.ts` (.ts, 21,199 bytes)
- **Primary Purpose:** Application utility or helper module
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (3):** `SourceQuestionContext`, `EnhancedSocialScriptContext`, `SocialInvarianceValidator`
- **Imports (1):** `../../types`
- **Consumers (7 files):** `src/lib/services/platform-adaptation.service.ts`, `src/lib/services/social-enhancement.service.ts`, `src/lib/services/social-quality.service.ts`, `src/tests/task8b-social-content-foundation-verification.ts`, `src/tests/task8c-hook-presentation-engine-verification.ts`, `src/tests/task8e-social-metadata-generator-verification.ts`, `src/tests/task8f-multi-platform-adaptation-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0344: `src/lib/validators/thumbnail-safety.validator.ts`

- **Directory:** `src/lib/validators`
- **Filename:** `thumbnail-safety.validator.ts` (.ts, 6,583 bytes)
- **Primary Purpose:** Application utility or helper module
- **Workflow Participation:** 08 Thumbnail (DIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `ThumbnailSafetyValidator`
- **Imports (1):** `../../types`
- **Consumers (5 files):** `src/lib/ai/gemini.service.ts`, `src/lib/services/phase18-thumbnail-intelligence.service.ts`, `src/lib/validators/phase20-social-quality-gate.validator.ts`, `src/server/routes.ts`, `src/tests/phase18-thumbnail-intelligence.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0345: `src/lib/workflow/canonical-workflow.ts`

- **Directory:** `src/lib/workflow`
- **Filename:** `canonical-workflow.ts` (.ts, 21,494 bytes)
- **Primary Purpose:** Application utility or helper module
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (8):** `CanonicalWorkflowState`, `CanonicalStepDefinition`, `CANONICAL_15_STEPS`, `mapQuestionToWorkflowState`, `mapVideoToWorkflowState`, `mapSocialReviewToWorkflowState`, `mapPublishingToWorkflowState`, `getCanonicalStep`
- **Imports (1):** `../../types`
- **Consumers (6 files):** `src/components/publishing/PublishingWorkflowHeader.tsx`, `src/components/questions/QuestionWorkflowHeader.tsx`, `src/components/social/AssetWorkflowHeader.tsx`, `src/components/video/VideoWorkflowHeader.tsx`, `src/contexts/ProductionJourneyContext.tsx`, `src/design-system/components/StepIndicator.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0346: `src/main.tsx`

- **Directory:** `src`
- **Filename:** `main.tsx` (.tsx, 231 bytes)
- **Primary Purpose:** Application utility or helper module
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (4):** `react`, `react-dom/client`, `./App.tsx`, `./index.css`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0347: `src/pages/AnalyticsExperiencePage.tsx`

- **Directory:** `src/pages`
- **Filename:** `AnalyticsExperiencePage.tsx` (.tsx, 55,977 bytes)
- **Primary Purpose:** Routed full-page React view component for AnalyticsExperiencePage
- **Workflow Participation:** 13 Analytics (DIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `AnalyticsSection`, `AnalyticsExperiencePage`
- **Imports (10):** `react-router-dom`, `lucide-react`, `../components/layout/PageHeader`, `../components/common/StatCard`, `../lib/api-client`, `../design-system/components/EmptyState`, `../design-system/components/Badge`, `../design-system/components/Button` ... and 2 more
- **Consumers (1 files):** `src/App.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0348: `src/pages/ContentMasterPage.tsx`

- **Directory:** `src/pages`
- **Filename:** `ContentMasterPage.tsx` (.tsx, 67,532 bytes)
- **Primary Purpose:** Routed full-page React view component for ContentMasterPage
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `ContentMasterPage`
- **Imports (10):** `react-router-dom`, `lucide-react`, `../components/layout/PageHeader`, `../components/common/Button`, `../components/common/StatusBadge`, `../components/common/DifficultyBadge`, `../lib/api-client`, `../types` ... and 2 more
- **Consumers (1 files):** `src/App.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: YES

---

## FILE-0349: `src/pages/DashboardPage.tsx`

- **Directory:** `src/pages`
- **Filename:** `DashboardPage.tsx` (.tsx, 13,664 bytes)
- **Primary Purpose:** Routed full-page React view component for DashboardPage
- **Workflow Participation:** NONE
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `DashboardPage`
- **Imports (15):** `lucide-react`, `react-router-dom`, `../contexts/AuthContext`, `../lib/api-client`, `../design-system/components/Button`, `../design-system/components/Alert`, `../design-system/components/ErrorState`, `../components/dashboard/ExecutiveHeroBanner` ... and 7 more
- **Consumers (1 files):** `src/App.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0350: `src/pages/LoginPage.tsx`

- **Directory:** `src/pages`
- **Filename:** `LoginPage.tsx` (.tsx, 7,535 bytes)
- **Primary Purpose:** Routed full-page React view component for LoginPage
- **Workflow Participation:** NONE
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `LoginPage`
- **Imports (2):** `lucide-react`, `../contexts/AuthContext`
- **Consumers (1 files):** `src/App.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0351: `src/pages/MyWorkPage.tsx`

- **Directory:** `src/pages`
- **Filename:** `MyWorkPage.tsx` (.tsx, 47,757 bytes)
- **Primary Purpose:** Routed full-page React view component for MyWorkPage
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `MyWorkPage`
- **Imports (9):** `react-router-dom`, `../types`, `../lib/api-client`, `../contexts/AuthContext`, `../components/layout/PageHeader`, `../components/assignments/AssignmentBadge`, `../components/assignments/AssignmentModal`, `../config/roles` ... and 1 more
- **Consumers (1 files):** `src/App.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0352: `src/pages/NotFoundPage.tsx`

- **Directory:** `src/pages`
- **Filename:** `NotFoundPage.tsx` (.tsx, 1,013 bytes)
- **Primary Purpose:** Routed full-page React view component for NotFoundPage
- **Workflow Participation:** NONE
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `NotFoundPage`
- **Imports (4):** `react`, `react-router-dom`, `lucide-react`, `../components/common/Button`
- **Consumers (1 files):** `src/App.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0353: `src/pages/PlanningPage.tsx`

- **Directory:** `src/pages`
- **Filename:** `PlanningPage.tsx` (.tsx, 132,280 bytes)
- **Primary Purpose:** Routed full-page React view component for PlanningPage
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `PlanningPage`
- **Imports (4):** `react-router-dom`, `lucide-react`, `../types`, `../lib/services/similarity.service`
- **Consumers (1 files):** `src/App.tsx`
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0354: `src/pages/PlatformPackagesPage.tsx`

- **Directory:** `src/pages`
- **Filename:** `PlatformPackagesPage.tsx` (.tsx, 33,296 bytes)
- **Primary Purpose:** Routed full-page React view component for PlatformPackagesPage
- **Workflow Participation:** 10 Publishing Setup (DIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `PlatformPackagesPage`, `default`
- **Imports (8):** `react-router-dom`, `lucide-react`, `../components/layout/PageHeader`, `../components/common/Button`, `../components/production/ProductionJourneyBar`, `../contexts/ProductionJourneyContext`, `../lib/api-client`, `../types`
- **Consumers (1 files):** `src/App.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0355: `src/pages/ProductionBoardPage.tsx`

- **Directory:** `src/pages`
- **Filename:** `ProductionBoardPage.tsx` (.tsx, 43,076 bytes)
- **Primary Purpose:** Routed full-page React view component for ProductionBoardPage
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `ProductionBoardPage`
- **Imports (8):** `react-router-dom`, `lucide-react`, `../components/layout/PageHeader`, `../components/common/Button`, `../components/common/EmptyState`, `../lib/api-client`, `../types`, `../config/constants`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0356: `src/pages/ProductionTrackerPage.tsx`

- **Directory:** `src/pages`
- **Filename:** `ProductionTrackerPage.tsx` (.tsx, 17,937 bytes)
- **Primary Purpose:** Routed full-page React view component for ProductionTrackerPage
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `ProductionTrackerPage`
- **Imports (11):** `react-router-dom`, `lucide-react`, `../components/layout/PageHeader`, `../components/common/Button`, `../components/common/StatCard`, `../components/production/ProductionKanban`, `../components/production/ProductionTable`, `../components/common/EmptyState` ... and 3 more
- **Consumers (1 files):** `src/App.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0357: `src/pages/PublishingPackagePage.tsx`

- **Directory:** `src/pages`
- **Filename:** `PublishingPackagePage.tsx` (.tsx, 35,217 bytes)
- **Primary Purpose:** Routed full-page React view component for PublishingPackagePage
- **Workflow Participation:** 10 Publishing Setup (DIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `PublishingPackagePage`, `default`
- **Imports (7):** `react-router-dom`, `lucide-react`, `../components/layout/PageHeader`, `../components/common/Button`, `../components/publishing/PublishingWorkflowHeader`, `../lib/api-client`, `../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0358: `src/pages/PublishingPage.tsx`

- **Directory:** `src/pages`
- **Filename:** `PublishingPage.tsx` (.tsx, 33,979 bytes)
- **Primary Purpose:** Routed full-page React view component for PublishingPage
- **Workflow Participation:** 11 Published (DIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `PublishingPage`, `default`
- **Imports (14):** `lucide-react`, `react-router-dom`, `../components/layout/PageHeader`, `../components/common/Button`, `../components/common/Modal`, `../components/publishing/PackageCopierModal`, `../components/publishing/PublishScheduleModal`, `../components/publishing/RecordPublicationModal` ... and 6 more
- **Consumers (1 files):** `src/App.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0359: `src/pages/QuestionDetailPage.tsx`

- **Directory:** `src/pages`
- **Filename:** `QuestionDetailPage.tsx` (.tsx, 55,937 bytes)
- **Primary Purpose:** Routed full-page React view component for QuestionDetailPage
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `QuestionDetailPage`, `default`
- **Imports (14):** `react-router-dom`, `lucide-react`, `../components/layout/PageHeader`, `../components/common/Button`, `../components/questions/QuestionWorkflowHeader`, `../components/common/StatusBadge`, `../components/common/DifficultyBadge`, `../components/assignments/EntityAssignmentsSection` ... and 6 more
- **Consumers (1 files):** `src/App.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0360: `src/pages/QuestionImprovePage.tsx`

- **Directory:** `src/pages`
- **Filename:** `QuestionImprovePage.tsx` (.tsx, 41,805 bytes)
- **Primary Purpose:** Routed full-page React view component for QuestionImprovePage
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `QuestionImprovePage`
- **Imports (14):** `react-router-dom`, `lucide-react`, `../design-system/components/PageHeader`, `../design-system/components/Button`, `../design-system/components/Badge`, `../design-system/components/Card`, `../design-system/components/Alert`, `../design-system/components/Loading` ... and 6 more
- **Consumers (1 files):** `src/App.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0361: `src/pages/QuestionLibraryPage.tsx`

- **Directory:** `src/pages`
- **Filename:** `QuestionLibraryPage.tsx` (.tsx, 17,867 bytes)
- **Primary Purpose:** Routed full-page React view component for QuestionLibraryPage
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `QuestionLibraryPage`, `default`
- **Imports (10):** `react-router-dom`, `lucide-react`, `../components/layout/PageHeader`, `../components/common/Button`, `../components/common/SearchInput`, `../components/questions/QuestionTable`, `../components/common/EmptyState`, `../components/questions/QuestionWorkflowHeader` ... and 2 more
- **Consumers (1 files):** `src/App.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0362: `src/pages/QuestionStudioPage.tsx`

- **Directory:** `src/pages`
- **Filename:** `QuestionStudioPage.tsx` (.tsx, 70,945 bytes)
- **Primary Purpose:** Routed full-page React view component for QuestionStudioPage
- **Workflow Participation:** 01 Question Generation (DIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (5):** `StudioCandidate`, `Step01WorkflowState`, `Step01StateEvaluation`, `getStep01WorkflowState`, `QuestionStudioPage`
- **Imports (12):** `react-router-dom`, `lucide-react`, `../components/layout/PageHeader`, `../components/common/Button`, `../components/production/ProductionJourneyBar`, `../contexts/ProductionJourneyContext`, `../lib/api-client`, `../types` ... and 4 more
- **Consumers (2 files):** `src/App.tsx`, `src/tests/step01-question-studio-workflow-state.test.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0363: `src/pages/QuestionVerifyApprovePage.tsx`

- **Directory:** `src/pages`
- **Filename:** `QuestionVerifyApprovePage.tsx` (.tsx, 47,395 bytes)
- **Primary Purpose:** Routed full-page React view component for QuestionVerifyApprovePage
- **Workflow Participation:** 02 Question Verification (DIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `QuestionVerifyApprovePage`
- **Imports (15):** `react-router-dom`, `lucide-react`, `../design-system/components/PageHeader`, `../design-system/components/Button`, `../design-system/components/Badge`, `../design-system/components/Card`, `../design-system/components/Alert`, `../design-system/components/Loading` ... and 7 more
- **Consumers (1 files):** `src/App.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: YES

---

## FILE-0364: `src/pages/QueuePage.tsx`

- **Directory:** `src/pages`
- **Filename:** `QueuePage.tsx` (.tsx, 17,554 bytes)
- **Primary Purpose:** Routed full-page React view component for QueuePage
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `QueuePage`
- **Imports (10):** `react-router-dom`, `lucide-react`, `../components/layout/PageHeader`, `../components/common/Button`, `../components/common/StatCard`, `../components/queue/QueueTable`, `../components/common/EmptyState`, `../lib/api-client` ... and 2 more
- **Consumers (1 files):** `src/App.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0365: `src/pages/RecoveryAdminPage.tsx`

- **Directory:** `src/pages`
- **Filename:** `RecoveryAdminPage.tsx` (.tsx, 115,158 bytes)
- **Primary Purpose:** Routed full-page React view component for RecoveryAdminPage
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `RecoveryAdminPage`
- **Imports (6):** `lucide-react`, `../components/layout/PageHeader`, `../components/common/Button`, `../contexts/AuthContext`, `../lib/api-client`, `../types`
- **Consumers (1 files):** `src/App.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0366: `src/pages/SettingsPage.tsx`

- **Directory:** `src/pages`
- **Filename:** `SettingsPage.tsx` (.tsx, 130,669 bytes)
- **Primary Purpose:** Routed full-page React view component for SettingsPage
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `SettingsPage`
- **Imports (13):** `react-router-dom`, `lucide-react`, `../components/layout/PageHeader`, `../components/common/Button`, `../config/constants`, `../lib/mock-data/taxonomy`, `../lib/api-client`, `../types` ... and 5 more
- **Consumers (1 files):** `src/App.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: YES (@google/genai SDK)
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0367: `src/pages/SocialAnalyticsPage.tsx`

- **Directory:** `src/pages`
- **Filename:** `SocialAnalyticsPage.tsx` (.tsx, 72,365 bytes)
- **Primary Purpose:** Routed full-page React view component for SocialAnalyticsPage
- **Workflow Participation:** 13 Analytics (DIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `SocialAnalyticsPage`
- **Imports (7):** `react-router-dom`, `lucide-react`, `../components/layout/PageHeader`, `../components/common/Button`, `../components/common/StatCard`, `../lib/api-client`, `../types`
- **Consumers (1 files):** `src/App.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0368: `src/pages/SocialReviewPage.tsx`

- **Directory:** `src/pages`
- **Filename:** `SocialReviewPage.tsx` (.tsx, 23,694 bytes)
- **Primary Purpose:** Routed full-page React view component for SocialReviewPage
- **Workflow Participation:** 09 Social Review (DIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `SocialReviewPage`, `default`
- **Imports (8):** `react-router-dom`, `lucide-react`, `../contexts/AuthContext`, `../lib/api-client`, `../components/social/SocialReviewWorkspace`, `../components/social/AssetWorkflowHeader`, `../types`, `../components/common/Button`
- **Consumers (1 files):** `src/App.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: YES

---

## FILE-0369: `src/pages/TeamOperationsPage.tsx`

- **Directory:** `src/pages`
- **Filename:** `TeamOperationsPage.tsx` (.tsx, 49,825 bytes)
- **Primary Purpose:** Routed full-page React view component for TeamOperationsPage
- **Workflow Participation:** NONE
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `TeamOperationsPage`
- **Imports (8):** `react-router-dom`, `../types`, `../lib/api-client`, `../contexts/AuthContext`, `../components/layout/PageHeader`, `../components/assignments/AssignmentBadge`, `../components/assignments/AssignmentModal`, `lucide-react`
- **Consumers (1 files):** `src/App.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0370: `src/pages/VideoCreateScriptPage.tsx`

- **Directory:** `src/pages`
- **Filename:** `VideoCreateScriptPage.tsx` (.tsx, 5,419 bytes)
- **Primary Purpose:** Routed full-page React view component for VideoCreateScriptPage
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `VideoCreateScriptPage`, `default`
- **Imports (9):** `react-router-dom`, `../types`, `../lib/api-client`, `../components/production/ProductionJourneyBar`, `../design-system/components/Card`, `../design-system/components/Button`, `../design-system/components/Badge`, `../design-system/components/Loading` ... and 1 more
- **Consumers (1 files):** `src/App.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0371: `src/pages/VideoDetailPage.tsx`

- **Directory:** `src/pages`
- **Filename:** `VideoDetailPage.tsx` (.tsx, 28,303 bytes)
- **Primary Purpose:** Routed full-page React view component for VideoDetailPage
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `VideoDetailPage`, `default`
- **Imports (20):** `react-router-dom`, `lucide-react`, `../components/layout/PageHeader`, `../components/common/Button`, `../components/common/StatusBadge`, `../components/common/DifficultyBadge`, `../components/assignments/EntityAssignmentsSection`, `../lib/api-client` ... and 12 more
- **Consumers (1 files):** `src/App.tsx`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0372: `src/pages/VideoEditPage.tsx`

- **Directory:** `src/pages`
- **Filename:** `VideoEditPage.tsx` (.tsx, 37,879 bytes)
- **Primary Purpose:** Routed full-page React view component for VideoEditPage
- **Workflow Participation:** 06 Editing Bay (DIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `VideoEditPage`, `default`
- **Imports (14):** `react-router-dom`, `lucide-react`, `../types`, `../lib/api-client`, `../components/video/VideoWorkflowHeader`, `../components/production/ProductionJourneyBar`, `../contexts/ProductionJourneyContext`, `../design-system/components/PageHeader` ... and 6 more
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0373: `src/pages/VideoFinalPage.tsx`

- **Directory:** `src/pages`
- **Filename:** `VideoFinalPage.tsx` (.tsx, 30,560 bytes)
- **Primary Purpose:** Routed full-page React view component for VideoFinalPage
- **Workflow Participation:** 07 Final QC (DIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `VideoFinalPage`, `default`
- **Imports (12):** `react-router-dom`, `lucide-react`, `../types`, `../lib/api-client`, `../components/video/VideoWorkflowHeader`, `../design-system/components/PageHeader`, `../design-system/components/Card`, `../design-system/components/Button` ... and 4 more
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0374: `src/pages/VideoPinnedCommentPage.tsx`

- **Directory:** `src/pages`
- **Filename:** `VideoPinnedCommentPage.tsx` (.tsx, 25,281 bytes)
- **Primary Purpose:** Routed full-page React view component for VideoPinnedCommentPage
- **Workflow Participation:** 15 Intelligence Loop (DIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `VideoPinnedCommentPage`, `default`
- **Imports (12):** `react-router-dom`, `lucide-react`, `../types`, `../lib/api-client`, `../components/social/AssetWorkflowHeader`, `../design-system/components/PageHeader`, `../design-system/components/Card`, `../design-system/components/Button` ... and 4 more
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0375: `src/pages/VideoRecordPage.tsx`

- **Directory:** `src/pages`
- **Filename:** `VideoRecordPage.tsx` (.tsx, 49,594 bytes)
- **Primary Purpose:** Routed full-page React view component for VideoRecordPage
- **Workflow Participation:** 04 Teleprompter & Filming (DIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `VideoRecordPage`, `default`
- **Imports (14):** `react-router-dom`, `lucide-react`, `../types`, `../lib/api-client`, `../components/video/VideoWorkflowHeader`, `../components/production/ProductionJourneyBar`, `../contexts/ProductionJourneyContext`, `../design-system/components/PageHeader` ... and 6 more
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0376: `src/pages/VideoReviewScriptPage.tsx`

- **Directory:** `src/pages`
- **Filename:** `VideoReviewScriptPage.tsx` (.tsx, 31,649 bytes)
- **Primary Purpose:** Routed full-page React view component for VideoReviewScriptPage
- **Workflow Participation:** 03 Audience Script (DIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `VideoReviewScriptPage`, `default`
- **Imports (12):** `react-router-dom`, `lucide-react`, `../types`, `../lib/api-client`, `../components/video/VideoWorkflowHeader`, `../design-system/components/PageHeader`, `../design-system/components/Card`, `../design-system/components/Button` ... and 4 more
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0377: `src/pages/VideoThumbnailPage.tsx`

- **Directory:** `src/pages`
- **Filename:** `VideoThumbnailPage.tsx` (.tsx, 39,714 bytes)
- **Primary Purpose:** Routed full-page React view component for VideoThumbnailPage
- **Workflow Participation:** 08 Thumbnail (DIRECT)
- **Risk Level:** **MEDIUM** (User-facing UI component tied to client routing and stage progression)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `VideoThumbnailPage`, `default`
- **Imports (12):** `react-router-dom`, `lucide-react`, `../types`, `../lib/api-client`, `../components/social/AssetWorkflowHeader`, `../design-system/components/PageHeader`, `../design-system/components/Card`, `../design-system/components/Button` ... and 4 more
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0378: `src/server/middleware/auth.middleware.ts`

- **Directory:** `src/server/middleware`
- **Filename:** `auth.middleware.ts` (.ts, 4,681 bytes)
- **Primary Purpose:** Express route registration or authentication middleware
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (5):** `AuthUserContext`, `AuthenticatedRequest`, `extractSessionToken`, `requireAuth`, `requireRole`
- **Imports (4):** `express`, `../../lib/services/auth.service`, `../../lib/repositories/users.repository`, `../../types`
- **Consumers (13 files):** `src/server/routes.ts`, `src/tests/phase03-security-regression.ts`, `src/tests/phase11b-auth-verification.ts`, `src/tests/phase8i-security-qa-verification.ts`, `src/tests/qa-user-verification.ts`, `src/tests/task3d1-assignment-verification.ts`, `src/tests/task3d2-rbac-verification.ts`, `src/tests/task3f49-full-restore-api-verification.ts` ... and 5 more
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0379: `src/server/routes.ts`

- **Directory:** `src/server`
- **Filename:** `routes.ts` (.ts, 246,066 bytes)
- **Primary Purpose:** Express route registration or authentication middleware
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (3):** `apiRouter`, `aiRateLimiter`, `getRequestActor`
- **Imports (30):** `../lib/services`, `../lib/services/question-draft.service`, `../lib/repositories/question-drafts.repository`, `../lib/repositories/thumbnail-candidates.repository`, `../lib/validators/thumbnail-safety.validator`, `../lib/ai/gemini.client`, `../lib/ai/phase24-orchestrator.service`, `../lib/google-sheets/client` ... and 22 more
- **Consumers (5 files):** `server.ts`, `src/tests/phase13-step1-rbac-audit.ts`, `src/tests/phase8i-security-qa-verification.ts`, `src/tests/question-studio-config-integration.test.ts`, `src/tests/task3d2-rbac-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: YES (Binary File Operations)
  - Gemini / AI Orchestration: YES (@google/genai SDK)
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: YES

---

## FILE-0380: `src/server/test-routes.ts`

- **Directory:** `src/server`
- **Filename:** `test-routes.ts` (.ts, 31,505 bytes)
- **Primary Purpose:** Express route registration or authentication middleware
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `testRouter`
- **Imports (0):** None
- **Consumers (1 files):** `src/server/routes.ts`
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0381: `src/tests/api-client-header-regression.test.ts`

- **Directory:** `src/tests`
- **Filename:** `api-client-header-regression.test.ts` (.ts, 2,652 bytes)
- **Primary Purpose:** Automated test suite verifying api-client-header-regression
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (1):** `../lib/api-client`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0382: `src/tests/canonical-sequence-parsing.test.ts`

- **Directory:** `src/tests`
- **Filename:** `canonical-sequence-parsing.test.ts` (.ts, 12,434 bytes)
- **Primary Purpose:** Automated test suite verifying canonical-sequence-parsing
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (7):** `../lib/repositories/sequences.repository`, `../lib/repositories/questions.repository`, `../lib/repositories/content-masters.repository`, `../lib/repositories/topics.repository`, `../lib/repositories/subtopics.repository`, `../lib/repositories/users.repository`, `../lib/schemas/google-sheets-schema`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0383: `src/tests/category-decoupling-verification.test.ts`

- **Directory:** `src/tests`
- **Filename:** `category-decoupling-verification.test.ts` (.ts, 22,375 bytes)
- **Primary Purpose:** Automated test suite verifying category-decoupling-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (8):** `../lib/repositories`, `../lib/services/question.service`, `../lib/services/content-master.service`, `../lib/services/taxonomy.service`, `../lib/services/planning.service`, `../lib/services/smart-random.service`, `../lib/services/dashboard.service`, `../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0384: `src/tests/comprehensive-e2e-suite.ts`

- **Directory:** `src/tests`
- **Filename:** `comprehensive-e2e-suite.ts` (.ts, 11,395 bytes)
- **Primary Purpose:** Automated test suite verifying comprehensive-e2e-suite
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (14):** `assert`, `../lib/services/auth.service`, `../lib/repositories/users.repository`, `../lib/repositories/content-masters.repository`, `../lib/repositories/questions.repository`, `../lib/repositories/videos.repository`, `../lib/repositories/scripts.repository`, `../lib/repositories/thumbnails.repository` ... and 6 more
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0385: `src/tests/creation-compensation-resilience.test.ts`

- **Directory:** `src/tests`
- **Filename:** `creation-compensation-resilience.test.ts` (.ts, 17,488 bytes)
- **Primary Purpose:** Automated test suite verifying creation-compensation-resilience
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (12):** `../lib/services/question.service`, `../lib/services/content-master.service`, `../lib/services/id.service`, `../lib/validation/multi-layer-verification.engine`, `../lib/services/taxonomy.service`, `../lib/services/smart-random.service`, `../lib/repositories/questions.repository`, `../lib/repositories/content-masters.repository` ... and 4 more
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0386: `src/tests/d01-concurrency-protection.test.ts`

- **Directory:** `src/tests`
- **Filename:** `d01-concurrency-protection.test.ts` (.ts, 11,381 bytes)
- **Primary Purpose:** Automated test suite verifying d01-concurrency-protection
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (3):** `node:assert`, `../lib/repositories/base.repository`, `../lib/schemas/google-sheets-schema`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0387: `src/tests/deletion-safety-pipeline.test.ts`

- **Directory:** `src/tests`
- **Filename:** `deletion-safety-pipeline.test.ts` (.ts, 10,948 bytes)
- **Primary Purpose:** Automated test suite verifying deletion-safety-pipeline
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (4):** `node:assert`, `../lib/services/deletion-safety.service`, `../lib/google-sheets/client`, `../lib/repositories/base.repository`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0388: `src/tests/edit-integration-test.ts`

- **Directory:** `src/tests`
- **Filename:** `edit-integration-test.ts` (.ts, 7,257 bytes)
- **Primary Purpose:** Automated test suite verifying edit-integration-test
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (3):** `../lib/services/question.service`, `../lib/repositories`, `../lib/services/data-integrity.service`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0389: `src/tests/execute-phase-2-cleanup.ts`

- **Directory:** `src/tests`
- **Filename:** `execute-phase-2-cleanup.ts` (.ts, 6,296 bytes)
- **Primary Purpose:** Automated test suite verifying execute-phase-2-cleanup
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** LEGACY CANDIDATE (Script targeting older milestone phase execution)
- **Exports (0):** None
- **Imports (4):** `fs`, `path`, `../lib/google-sheets/client`, `../lib/schemas/google-sheets-schema`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0390: `src/tests/execute-phase-4a-topics.ts`

- **Directory:** `src/tests`
- **Filename:** `execute-phase-4a-topics.ts` (.ts, 9,187 bytes)
- **Primary Purpose:** Automated test suite verifying execute-phase-4a-topics
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (6):** `fs`, `path`, `../lib/google-sheets/client`, `../lib/schemas/google-sheets-schema`, `../lib/services/taxonomy.service`, `../lib/google-sheets/helpers`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0391: `src/tests/execute-phase-4b1-subtopics.ts`

- **Directory:** `src/tests`
- **Filename:** `execute-phase-4b1-subtopics.ts` (.ts, 12,197 bytes)
- **Primary Purpose:** Automated test suite verifying execute-phase-4b1-subtopics
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (7):** `fs`, `path`, `../lib/google-sheets/client`, `../lib/schemas/google-sheets-schema`, `../lib/services/taxonomy.service`, `../lib/google-sheets/helpers`, `../lib/repositories/sequences.repository`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0392: `src/tests/execute-safe-remediation.ts`

- **Directory:** `src/tests`
- **Filename:** `execute-safe-remediation.ts` (.ts, 10,225 bytes)
- **Primary Purpose:** Automated test suite verifying execute-safe-remediation
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (4):** `../lib/repositories`, `../lib/services/id.service`, `../lib/google-sheets/client`, `../lib/schemas/google-sheets-schema`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0393: `src/tests/execute-testdata-cleanup.ts`

- **Directory:** `src/tests`
- **Filename:** `execute-testdata-cleanup.ts` (.ts, 9,231 bytes)
- **Primary Purpose:** Automated test suite verifying execute-testdata-cleanup
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (24):** `../lib/google-sheets/client`, `../lib/repositories/questions.repository`, `../lib/repositories/content-masters.repository`, `../lib/repositories/videos.repository`, `../lib/repositories/scripts.repository`, `../lib/repositories/script-versions.repository`, `../lib/repositories/thumbnails.repository`, `../lib/repositories/thumbnail-versions.repository` ... and 16 more
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0394: `src/tests/final-cleanup-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `final-cleanup-verification.ts` (.ts, 5,189 bytes)
- **Primary Purpose:** Automated test suite verifying final-cleanup-verification
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (2):** `../lib/repositories`, `../lib/repositories/question-config.repository`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0395: `src/tests/find-context.ts`

- **Directory:** `src/tests`
- **Filename:** `find-context.ts` (.ts, 687 bytes)
- **Primary Purpose:** Automated test suite verifying find-context
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (2):** `../lib/repositories/audit-log.repository`, `../lib/google-sheets/client`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0396: `src/tests/forensic-audit-check.ts`

- **Directory:** `src/tests`
- **Filename:** `forensic-audit-check.ts` (.ts, 1,454 bytes)
- **Primary Purpose:** Automated test suite verifying forensic-audit-check
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (2):** `../lib/google-sheets/client`, `../lib/repositories/audit-log.repository`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0397: `src/tests/forensic-audit-results.txt`

- **Directory:** `src/tests`
- **Filename:** `forensic-audit-results.txt` (.txt, 9,262 bytes)
- **Primary Purpose:** Automated test suite verifying forensic-audit-results.txt
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (0):** None
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0398: `src/tests/fraction-persistence-retest.ts`

- **Directory:** `src/tests`
- **Filename:** `fraction-persistence-retest.ts` (.ts, 6,039 bytes)
- **Primary Purpose:** Automated test suite verifying fraction-persistence-retest
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (4):** `../lib/services/question.service`, `../lib/repositories`, `../lib/services/data-integrity.service`, `../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0399: `src/tests/fraction-protection.test.ts`

- **Directory:** `src/tests`
- **Filename:** `fraction-protection.test.ts` (.ts, 1,863 bytes)
- **Primary Purpose:** Automated test suite verifying fraction-protection
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (1):** `../lib/google-sheets/client`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0400: `src/tests/hybrid-math-boundary.test.ts`

- **Directory:** `src/tests`
- **Filename:** `hybrid-math-boundary.test.ts` (.ts, 5,525 bytes)
- **Primary Purpose:** Automated test suite verifying hybrid-math-boundary
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (4):** `../lib/services/question-validation.service`, `../lib/ai/validators/blind-verifier`, `../lib/validation/mathematical-logical.engine`, `../lib/validation/consensus.engine`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0401: `src/tests/idempotency-concurrency-resilience.test.ts`

- **Directory:** `src/tests`
- **Filename:** `idempotency-concurrency-resilience.test.ts` (.ts, 25,553 bytes)
- **Primary Purpose:** Automated test suite verifying idempotency-concurrency-resilience
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (15):** `../lib/services/question.service`, `../lib/services/content-master.service`, `../lib/services/id.service`, `../lib/validation/multi-layer-verification.engine`, `../lib/services/taxonomy.service`, `../lib/services/smart-random.service`, `../lib/services/question-config.service`, `../lib/repositories/questions.repository` ... and 7 more
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0402: `src/tests/integration-semantic.test.ts`

- **Directory:** `src/tests`
- **Filename:** `integration-semantic.test.ts` (.ts, 9,447 bytes)
- **Primary Purpose:** Automated test suite verifying integration-semantic
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (6):** `assert`, `../lib/validation/question-validation.engine`, `../types`, `../lib/ai/gemini.client`, `../lib/ai/validators/semantic-reasoning.provider`, `../lib/ai/validators/blind-verifier`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: YES (@google/genai SDK)
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0403: `src/tests/language-default-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `language-default-verification.ts` (.ts, 7,040 bytes)
- **Primary Purpose:** Automated test suite verifying language-default-verification
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (5):** `../types`, `../lib/services/question.service`, `../lib/services/taxonomy.service`, `../lib/ai/schemas/question-candidate.schema`, `./qa-user.fixture`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0404: `src/tests/library-integration-retest.ts`

- **Directory:** `src/tests`
- **Filename:** `library-integration-retest.ts` (.ts, 4,823 bytes)
- **Primary Purpose:** Automated test suite verifying library-integration-retest
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (2):** `../lib/services`, `../lib/services/data-integrity.service`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0405: `src/tests/live-production-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `live-production-verification.ts` (.ts, 11,174 bytes)
- **Primary Purpose:** Automated test suite verifying live-production-verification
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (15):** `../lib/google-sheets/client`, `../lib/schemas/google-sheets-schema`, `../lib/services/spreadsheet-verification.service`, `../lib/services/data-integrity.service`, `../lib/repositories/sequences.repository`, `../lib/repositories/users.repository`, `../lib/repositories/questions.repository`, `../lib/repositories/categories.repository` ... and 7 more
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0406: `src/tests/multi-take-persistence.test.ts`

- **Directory:** `src/tests`
- **Filename:** `multi-take-persistence.test.ts` (.ts, 7,886 bytes)
- **Primary Purpose:** Automated test suite verifying multi-take-persistence
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (8):** `../lib/services/video.service`, `../lib/services/phase17-video-production.service`, `../lib/repositories/media-assets.repository`, `../lib/repositories/videos.repository`, `../lib/repositories/questions.repository`, `../lib/repositories/content-masters.repository`, `../lib/services/id.service`, `../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0407: `src/tests/negative-tests.ts`

- **Directory:** `src/tests`
- **Filename:** `negative-tests.ts` (.ts, 6,021 bytes)
- **Primary Purpose:** Automated test suite verifying negative-tests
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (3):** `assert`, `../lib/services/auth.service`, `../lib/repositories/users.repository`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0408: `src/tests/p02-request-pressure-protection.test.ts`

- **Directory:** `src/tests`
- **Filename:** `p02-request-pressure-protection.test.ts` (.ts, 10,922 bytes)
- **Primary Purpose:** Automated test suite verifying p02-request-pressure-protection
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (3):** `node:assert`, `../lib/google-sheets/client`, `../lib/google-sheets/errors`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0409: `src/tests/parse-audit-calls.ts`

- **Directory:** `src/tests`
- **Filename:** `parse-audit-calls.ts` (.ts, 1,337 bytes)
- **Primary Purpose:** Automated test suite verifying parse-audit-calls
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (2):** `fs`, `path`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0410: `src/tests/phase-5-question-model.ts`

- **Directory:** `src/tests`
- **Filename:** `phase-5-question-model.ts` (.ts, 31,256 bytes)
- **Primary Purpose:** Automated test suite verifying phase-5-question-model
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** TEST LEGACY CANDIDATE (Early phase unit/integration tests superseded by end-to-end regression suites)
- **Exports (1):** `VerificationCheck`
- **Imports (9):** `../lib/services/question.service`, `../lib/services/taxonomy.service`, `../lib/services/similarity.service`, `../lib/repositories/questions.repository`, `../lib/schemas/google-sheets-schema`, `../lib/google-sheets/helpers`, `../lib/schemas/google-sheets-schema`, `../lib/validators/question-creation.validator` ... and 1 more
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0411: `src/tests/phase-6-configuration-engine.ts`

- **Directory:** `src/tests`
- **Filename:** `phase-6-configuration-engine.ts` (.ts, 17,239 bytes)
- **Primary Purpose:** Automated test suite verifying phase-6-configuration-engine
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** TEST LEGACY CANDIDATE (Early phase unit/integration tests superseded by end-to-end regression suites)
- **Exports (0):** None
- **Imports (8):** `../lib/schemas/google-sheets-schema`, `../lib/repositories/question-config.repository`, `../lib/services/question-config.service`, `../types`, `../lib/services/question.service`, `../lib/services/smart-random.service`, `../lib/repositories/questions.repository`, `../lib/services/taxonomy.service`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0412: `src/tests/phase-7-ai-generation-engine.ts`

- **Directory:** `src/tests`
- **Filename:** `phase-7-ai-generation-engine.ts` (.ts, 30,083 bytes)
- **Primary Purpose:** Automated test suite verifying phase-7-ai-generation-engine
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (13):** `../lib/ai/orchestrator`, `../lib/ai/gemini.service`, `../lib/ai/gemini.client`, `../lib/ai/registry`, `../lib/ai/testing/mock-provider`, `../lib/ai/validators/candidate.validator`, `../lib/ai/schemas/question-candidate.schema`, `../lib/ai/prompts/generation.prompt` ... and 5 more
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: YES (@google/genai SDK)
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0413: `src/tests/phase03-design-system-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `phase03-design-system-verification.ts` (.ts, 11,643 bytes)
- **Primary Purpose:** Automated test suite verifying phase03-design-system-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** TEST LEGACY CANDIDATE (Early phase unit/integration tests superseded by end-to-end regression suites)
- **Exports (0):** None
- **Imports (1):** `../design-system`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0414: `src/tests/phase03-security-regression.ts`

- **Directory:** `src/tests`
- **Filename:** `phase03-security-regression.ts` (.ts, 20,369 bytes)
- **Primary Purpose:** Automated test suite verifying phase03-security-regression
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** TEST LEGACY CANDIDATE (Early phase unit/integration tests superseded by end-to-end regression suites)
- **Exports (0):** None
- **Imports (5):** `../lib/services/auth.service`, `../lib/repositories/users.repository`, `../lib/services/object-auth.service`, `../server/middleware/auth.middleware`, `../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0415: `src/tests/phase04-shell-navigation-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `phase04-shell-navigation-verification.ts` (.ts, 18,728 bytes)
- **Primary Purpose:** Automated test suite verifying phase04-shell-navigation-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** TEST LEGACY CANDIDATE (Early phase unit/integration tests superseded by end-to-end regression suites)
- **Exports (0):** None
- **Imports (6):** `fs`, `path`, `../config/navigation`, `../design-system/components/StepIndicator`, `../design-system/components/AppBreadcrumbs`, `../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: YES

---

## FILE-0416: `src/tests/phase04-taxonomy-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `phase04-taxonomy-verification.ts` (.ts, 19,332 bytes)
- **Primary Purpose:** Automated test suite verifying phase04-taxonomy-verification
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** TEST LEGACY CANDIDATE (Early phase unit/integration tests superseded by end-to-end regression suites)
- **Exports (2):** `Phase04TestResult`, `Phase04Report`
- **Imports (5):** `../lib/repositories`, `../lib/services/taxonomy.service`, `../lib/google-sheets/errors`, `../lib/services/auth.service`, `../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0417: `src/tests/phase05-dashboard-home-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `phase05-dashboard-home-verification.ts` (.ts, 16,085 bytes)
- **Primary Purpose:** Automated test suite verifying phase05-dashboard-home-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** TEST LEGACY CANDIDATE (Early phase unit/integration tests superseded by end-to-end regression suites)
- **Exports (0):** None
- **Imports (2):** `fs`, `path`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0418: `src/tests/phase06-question-workflow-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `phase06-question-workflow-verification.ts` (.ts, 11,997 bytes)
- **Primary Purpose:** Automated test suite verifying phase06-question-workflow-verification
- **Workflow Participation:** 02 Question Verification (DIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** TEST LEGACY CANDIDATE (Early phase unit/integration tests superseded by end-to-end regression suites)
- **Exports (0):** None
- **Imports (2):** `fs`, `path`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0419: `src/tests/phase07-video-workflow-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `phase07-video-workflow-verification.ts` (.ts, 13,356 bytes)
- **Primary Purpose:** Automated test suite verifying phase07-video-workflow-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (2):** `fs`, `path`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0420: `src/tests/phase08-asset-review-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `phase08-asset-review-verification.ts` (.ts, 12,419 bytes)
- **Primary Purpose:** Automated test suite verifying phase08-asset-review-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (2):** `fs`, `path`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0421: `src/tests/phase09-publishing-workflow-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `phase09-publishing-workflow-verification.ts` (.ts, 13,997 bytes)
- **Primary Purpose:** Automated test suite verifying phase09-publishing-workflow-verification
- **Workflow Participation:** 11 Published (DIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `VerificationResult`
- **Imports (9):** `../lib/services/publishing.service`, `../lib/repositories/videos.repository`, `../lib/repositories/questions.repository`, `../lib/repositories/thumbnails.repository`, `../lib/repositories/pinned-comments.repository`, `../lib/repositories/social-reviews.repository`, `../lib/repositories/scripts.repository`, `../lib/services/social-review.service` ... and 1 more
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0422: `src/tests/phase10-analytics-experience-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `phase10-analytics-experience-verification.ts` (.ts, 5,542 bytes)
- **Primary Purpose:** Automated test suite verifying phase10-analytics-experience-verification
- **Workflow Participation:** 13 Analytics (DIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (2):** `../config/navigation`, `../lib/api-client`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0423: `src/tests/phase10-publishing-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `phase10-publishing-verification.ts` (.ts, 34,749 bytes)
- **Primary Purpose:** Automated test suite verifying phase10-publishing-verification
- **Workflow Participation:** 11 Published (DIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (12):** `../lib/services/publishing.service`, `../lib/repositories/videos.repository`, `../lib/repositories/questions.repository`, `../lib/repositories/scripts.repository`, `../lib/repositories/thumbnails.repository`, `../lib/repositories/pinned-comments.repository`, `../lib/repositories/social-reviews.repository`, `../lib/repositories/publishing.repository` ... and 4 more
- **Consumers (1 files):** `run-phase10-runner.ts`
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0424: `src/tests/phase10-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `phase10-verification.ts` (.ts, 42,359 bytes)
- **Primary Purpose:** Automated test suite verifying phase10-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (14):** `../lib/services/assignment.service`, `../lib/services/data-integrity.service`, `../lib/services/id.service`, `../lib/repositories/users.repository`, `../lib/repositories/assignments.repository`, `../lib/repositories/audit-log.repository`, `../lib/services/object-auth.service`, `../lib/services/social-review.service` ... and 6 more
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0425: `src/tests/phase11-canonical-lifecycle-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `phase11-canonical-lifecycle-verification.ts` (.ts, 21,042 bytes)
- **Primary Purpose:** Automated test suite verifying phase11-canonical-lifecycle-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `Phase11CheckResult`, `Phase11SuiteResult`
- **Imports (6):** `../lib/repositories`, `../lib/services/id.service`, `../lib/services/content-master.service`, `../lib/services/publishing.service`, `../lib/services/audit.service`, `../types`
- **Consumers (1 files):** `src/tests/run-phase11-only.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0426: `src/tests/phase11-legacy-ui-simplification-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `phase11-legacy-ui-simplification-verification.ts` (.ts, 11,342 bytes)
- **Primary Purpose:** Automated test suite verifying phase11-legacy-ui-simplification-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (4):** `fs`, `path`, `../config/navigation`, `../utils/formatters`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: YES

---

## FILE-0427: `src/tests/phase11-step1-dashboard-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `phase11-step1-dashboard-verification.ts` (.ts, 11,582 bytes)
- **Primary Purpose:** Automated test suite verifying phase11-step1-dashboard-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `TestResultItem`
- **Imports (2):** `node:fs`, `../types`
- **Consumers (1 files):** `src/tests/run-phase11-step1-dashboard.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0428: `src/tests/phase11-step2-manager-dashboard-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `phase11-step2-manager-dashboard-verification.ts` (.ts, 7,495 bytes)
- **Primary Purpose:** Automated test suite verifying phase11-step2-manager-dashboard-verification
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `TestResultItem`
- **Imports (2):** `node:fs`, `../types`
- **Consumers (1 files):** `src/tests/run-phase11-step2-manager-dashboard.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0429: `src/tests/phase11-step3-specialist-workboards-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `phase11-step3-specialist-workboards-verification.ts` (.ts, 6,629 bytes)
- **Primary Purpose:** Automated test suite verifying phase11-step3-specialist-workboards-verification
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `TestResultItem`
- **Imports (2):** `node:fs`, `../types`
- **Consumers (1 files):** `src/tests/run-phase11-step3-specialist-workboards.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0430: `src/tests/phase11a-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `phase11a-verification.ts` (.ts, 8,571 bytes)
- **Primary Purpose:** Automated test suite verifying phase11a-verification
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (4):** `../lib/services/auth.service`, `../lib/repositories/users.repository`, `../lib/repositories/audit-log.repository`, `crypto`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0431: `src/tests/phase11b-auth-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `phase11b-auth-verification.ts` (.ts, 10,935 bytes)
- **Primary Purpose:** Automated test suite verifying phase11b-auth-verification
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (5):** `../lib/services/auth.service`, `../lib/repositories/users.repository`, `../lib/repositories/audit-log.repository`, `../server/middleware/auth.middleware`, `../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0432: `src/tests/phase12-final-ui-ux-acceptance-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `phase12-final-ui-ux-acceptance-verification.ts` (.ts, 50,771 bytes)
- **Primary Purpose:** Automated test suite verifying phase12-final-ui-ux-acceptance-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (5):** `fs`, `path`, `child_process`, `../config/navigation`, `../design-system/components/StepIndicator`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: YES

---

## FILE-0433: `src/tests/phase12-review-assignment-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `phase12-review-assignment-verification.ts` (.ts, 24,656 bytes)
- **Primary Purpose:** Automated test suite verifying phase12-review-assignment-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `Phase12CheckResult`, `Phase12SuiteResult`
- **Imports (4):** `../lib/repositories`, `../lib/services/phase12-workflow.service`, `../types`, `../lib/google-sheets/errors`
- **Consumers (1 files):** `src/tests/run-phase12-only.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0434: `src/tests/phase12-step2-production-asset-validation.ts`

- **Directory:** `src/tests`
- **Filename:** `phase12-step2-production-asset-validation.ts` (.ts, 11,849 bytes)
- **Primary Purpose:** Automated test suite verifying phase12-step2-production-asset-validation
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (4):** `../lib/services/production-asset-validation.service`, `../lib/services/video.service`, `../lib/repositories/videos.repository`, `../types`
- **Consumers (1 files):** `src/tests/run-phase12-step2.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0435: `src/tests/phase12-step3-production-asset-synchronization.ts`

- **Directory:** `src/tests`
- **Filename:** `phase12-step3-production-asset-synchronization.ts` (.ts, 16,795 bytes)
- **Primary Purpose:** Automated test suite verifying phase12-step3-production-asset-synchronization
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (9):** `../lib/services/video.service`, `../lib/services/object-auth.service`, `../lib/services/workflow.service`, `../lib/services/audit.service`, `../lib/services/publishing.service`, `../lib/repositories/videos.repository`, `../lib/repositories/users.repository`, `../types` ... and 1 more
- **Consumers (1 files):** `src/tests/run-phase12-step3.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0436: `src/tests/phase12-step4-production-asset-readiness.ts`

- **Directory:** `src/tests`
- **Filename:** `phase12-step4-production-asset-readiness.ts` (.ts, 14,518 bytes)
- **Primary Purpose:** Automated test suite verifying phase12-step4-production-asset-readiness
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (7):** `../lib/services/production-asset-validation.service`, `../lib/services/production-board.service`, `../lib/services/publishing.service`, `../lib/repositories/videos.repository`, `../lib/repositories/questions.repository`, `../lib/google-sheets/client`, `../types`
- **Consumers (1 files):** `src/tests/run-phase12-step4.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0437: `src/tests/phase13-8-assignment-race-remediation.ts`

- **Directory:** `src/tests`
- **Filename:** `phase13-8-assignment-race-remediation.ts` (.ts, 15,223 bytes)
- **Primary Purpose:** Automated test suite verifying phase13-8-assignment-race-remediation
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (9):** `fs`, `path`, `../lib/services/assignment.service`, `../lib/repositories/assignments.repository`, `../lib/repositories/users.repository`, `../lib/repositories/audit-log.repository`, `../lib/services/audit.service`, `../lib/services/id.service` ... and 1 more
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0438: `src/tests/phase13-9-thumbnail-rollback-remediation.ts`

- **Directory:** `src/tests`
- **Filename:** `phase13-9-thumbnail-rollback-remediation.ts` (.ts, 13,624 bytes)
- **Primary Purpose:** Automated test suite verifying phase13-9-thumbnail-rollback-remediation
- **Workflow Participation:** 08 Thumbnail (DIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (8):** `../lib/services/thumbnail.service`, `../lib/repositories/thumbnails.repository`, `../lib/repositories/thumbnail-versions.repository`, `../lib/repositories/videos.repository`, `../lib/services/google-drive.service`, `../lib/services/id.service`, `../lib/services/audit.service`, `../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: YES (Binary File Operations)
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0439: `src/tests/phase13-ai-refinement-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `phase13-ai-refinement-verification.ts` (.ts, 27,771 bytes)
- **Primary Purpose:** Automated test suite verifying phase13-ai-refinement-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `Phase13CheckResult`, `Phase13SuiteResult`
- **Imports (5):** `../lib/repositories`, `../lib/services/phase13-refinement.service`, `../lib/ai/gemini.client`, `../types`, `../lib/google-sheets/errors`
- **Consumers (1 files):** `src/tests/run-phase13-only.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: YES (@google/genai SDK)
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0440: `src/tests/phase13-live-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `phase13-live-verification.ts` (.ts, 29,118 bytes)
- **Primary Purpose:** Automated test suite verifying phase13-live-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `Phase13VerificationResult`
- **Imports (20):** `../lib/google-sheets/client`, `../lib/services/publishing.service`, `../lib/services/social-review.service`, `../lib/services/social-enhancement.service`, `../lib/repositories/questions.repository`, `../lib/repositories/videos.repository`, `../lib/repositories/scripts.repository`, `../lib/repositories/thumbnails.repository` ... and 12 more
- **Consumers (1 files):** `src/tests/run-phase13-live.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0441: `src/tests/phase13-step1-publishing-scheduling.ts`

- **Directory:** `src/tests`
- **Filename:** `phase13-step1-publishing-scheduling.ts` (.ts, 18,152 bytes)
- **Primary Purpose:** Automated test suite verifying phase13-step1-publishing-scheduling
- **Workflow Participation:** 11 Published (DIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (13):** `../lib/services/publishing.service`, `../lib/repositories/videos.repository`, `../lib/repositories/questions.repository`, `../lib/repositories/publishing.repository`, `../lib/repositories/thumbnails.repository`, `../lib/repositories/pinned-comments.repository`, `../lib/repositories/scripts.repository`, `../lib/repositories/social-reviews.repository` ... and 5 more
- **Consumers (1 files):** `src/tests/run-phase13-step1.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0442: `src/tests/phase13-step1-rbac-audit.ts`

- **Directory:** `src/tests`
- **Filename:** `phase13-step1-rbac-audit.ts` (.ts, 3,803 bytes)
- **Primary Purpose:** Automated test suite verifying phase13-step1-rbac-audit
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (4):** `../lib/services/publishing.service`, `../lib/services/object-auth.service`, `../server/routes`, `../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0443: `src/tests/phase13-step2-retry-logic.ts`

- **Directory:** `src/tests`
- **Filename:** `phase13-step2-retry-logic.ts` (.ts, 24,826 bytes)
- **Primary Purpose:** Automated test suite verifying phase13-step2-retry-logic
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (13):** `../lib/services/publishing.service`, `../lib/repositories/videos.repository`, `../lib/repositories/publishing.repository`, `../lib/repositories/questions.repository`, `../lib/repositories/thumbnails.repository`, `../lib/repositories/pinned-comments.repository`, `../lib/repositories/social-reviews.repository`, `../lib/repositories/scripts.repository` ... and 5 more
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0444: `src/tests/phase13-step3-package-copier.ts`

- **Directory:** `src/tests`
- **Filename:** `phase13-step3-package-copier.ts` (.ts, 25,696 bytes)
- **Primary Purpose:** Automated test suite verifying phase13-step3-package-copier
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (12):** `../lib/services/publishing.service`, `../lib/repositories/videos.repository`, `../lib/repositories/publishing.repository`, `../lib/repositories/questions.repository`, `../lib/repositories/thumbnails.repository`, `../lib/repositories/pinned-comments.repository`, `../lib/repositories/scripts.repository`, `../lib/repositories/social-reviews.repository` ... and 4 more
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0445: `src/tests/phase13-step4-publishing-assignments.ts`

- **Directory:** `src/tests`
- **Filename:** `phase13-step4-publishing-assignments.ts` (.ts, 36,305 bytes)
- **Primary Purpose:** Automated test suite verifying phase13-step4-publishing-assignments
- **Workflow Participation:** 11 Published (DIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (16):** `../lib/services/publishing.service`, `../lib/services/social-review.service`, `../lib/repositories/videos.repository`, `../lib/repositories/publishing.repository`, `../lib/repositories/questions.repository`, `../lib/repositories/thumbnails.repository`, `../lib/repositories/pinned-comments.repository`, `../lib/repositories/scripts.repository` ... and 8 more
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0446: `src/tests/phase13-step5-publishing-integration.ts`

- **Directory:** `src/tests`
- **Filename:** `phase13-step5-publishing-integration.ts` (.ts, 32,979 bytes)
- **Primary Purpose:** Automated test suite verifying phase13-step5-publishing-integration
- **Workflow Participation:** 11 Published (DIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (16):** `../lib/services/publishing.service`, `../lib/services/social-review.service`, `../lib/services/production-asset-validation.service`, `../lib/repositories/videos.repository`, `../lib/repositories/publishing.repository`, `../lib/repositories/questions.repository`, `../lib/repositories/thumbnails.repository`, `../lib/repositories/pinned-comments.repository` ... and 8 more
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0447: `src/tests/phase14-production-drive-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `phase14-production-drive-verification.ts` (.ts, 15,007 bytes)
- **Primary Purpose:** Automated test suite verifying phase14-production-drive-verification
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `Phase14CheckResult`, `Phase14SuiteResult`
- **Imports (7):** `../lib/repositories/content-masters.repository`, `../lib/repositories/media-assets.repository`, `../lib/services/google-drive.service`, `../lib/services/phase14-drive.service`, `../types`, `../lib/google-sheets/errors`, `stream`
- **Consumers (1 files):** `src/tests/run-phase14-only.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: YES (Binary File Operations)
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0448: `src/tests/phase14-real-drive-e2e.ts`

- **Directory:** `src/tests`
- **Filename:** `phase14-real-drive-e2e.ts` (.ts, 10,776 bytes)
- **Primary Purpose:** Automated test suite verifying phase14-real-drive-e2e
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (7):** `crypto`, `../lib/services/google-drive.service`, `../lib/services/phase14-drive.service`, `../lib/repositories/content-masters.repository`, `../lib/repositories/media-assets.repository`, `../types`, `../lib/google-sheets/errors`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: YES (Binary File Operations)
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0449: `src/tests/phase14-step2-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `phase14-step2-verification.ts` (.ts, 13,260 bytes)
- **Primary Purpose:** Automated test suite verifying phase14-step2-verification
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (4):** `fs`, `path`, `../lib/services`, `../types`
- **Consumers (1 files):** `src/tests/run-phase15-step5.ts`
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0450: `src/tests/phase14-step3-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `phase14-step3-verification.ts` (.ts, 19,554 bytes)
- **Primary Purpose:** Automated test suite verifying phase14-step3-verification
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (2):** `fs`, `path`
- **Consumers (1 files):** `src/tests/run-phase15-step5.ts`
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0451: `src/tests/phase14-step4-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `phase14-step4-verification.ts` (.ts, 23,975 bytes)
- **Primary Purpose:** Automated test suite verifying phase14-step4-verification
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (6):** `fs`, `path`, `../lib/services/content-master.service`, `../lib/services/object-auth.service`, `../lib/services/dashboard.service`, `../types`
- **Consumers (1 files):** `src/tests/run-phase15-step5.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: YES

---

## FILE-0452: `src/tests/phase14-step5-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `phase14-step5-verification.ts` (.ts, 12,782 bytes)
- **Primary Purpose:** Automated test suite verifying phase14-step5-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (7):** `fs`, `path`, `../lib/repositories/social-reviews.repository`, `../lib/repositories/questions.repository`, `../lib/services/social-review.service`, `../lib/services/object-auth.service`, `../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: YES

---

## FILE-0453: `src/tests/phase15-script-production-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `phase15-script-production-verification.ts` (.ts, 15,075 bytes)
- **Primary Purpose:** Automated test suite verifying phase15-script-production-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `VerificationResult`
- **Imports (5):** `../lib/repositories/questions.repository`, `../lib/repositories/scripts.repository`, `../lib/services/phase15-script-production.service`, `../types`, `../lib/services/id.service`
- **Consumers (1 files):** `src/tests/run-phase15-only.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0454: `src/tests/phase15-step2-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `phase15-step2-verification.ts` (.ts, 11,534 bytes)
- **Primary Purpose:** Automated test suite verifying phase15-step2-verification
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (6):** `fs`, `path`, `../lib/services/content-master.service`, `../lib/services/object-auth.service`, `../lib/repositories`, `../types`
- **Consumers (1 files):** `src/tests/run-phase15-step5.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: YES

---

## FILE-0455: `src/tests/phase15-step3-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `phase15-step3-verification.ts` (.ts, 10,230 bytes)
- **Primary Purpose:** Automated test suite verifying phase15-step3-verification
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (5):** `fs`, `path`, `../lib/services/dashboard.service`, `../lib/services/object-auth.service`, `../types`
- **Consumers (1 files):** `src/tests/run-phase15-step5.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: YES

---

## FILE-0456: `src/tests/phase15-step5-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `phase15-step5-verification.ts` (.ts, 15,118 bytes)
- **Primary Purpose:** Automated test suite verifying phase15-step5-verification
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (6):** `fs`, `path`, `../lib/google-sheets/client`, `../lib/repositories/base.repository`, `../lib/repositories`, `../lib/schemas/google-sheets-schema`
- **Consumers (1 files):** `src/tests/run-phase15-step5.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0457: `src/tests/phase15-step6-assignment-deduplication-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `phase15-step6-assignment-deduplication-verification.ts` (.ts, 19,762 bytes)
- **Primary Purpose:** Automated test suite verifying phase15-step6-assignment-deduplication-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (7):** `fs`, `path`, `../types`, `../lib/services/object-auth.service`, `../lib/repositories/assignments.repository`, `../lib/services/dashboard.service`, `../lib/repositories`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: YES

---

## FILE-0458: `src/tests/phase16-human-script-workflow-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `phase16-human-script-workflow-verification.ts` (.ts, 10,823 bytes)
- **Primary Purpose:** Automated test suite verifying phase16-human-script-workflow-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `VerificationResult`
- **Imports (5):** `../lib/repositories/questions.repository`, `../lib/repositories/scripts.repository`, `../lib/services/phase15-script-production.service`, `../lib/services/id.service`, `../types`
- **Consumers (1 files):** `src/tests/run-phase16-only.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0459: `src/tests/phase16-step2-lifecycle-orchestration.ts`

- **Directory:** `src/tests`
- **Filename:** `phase16-step2-lifecycle-orchestration.ts` (.ts, 20,144 bytes)
- **Primary Purpose:** Automated test suite verifying phase16-step2-lifecycle-orchestration
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `Phase16VerificationResult`
- **Imports (8):** `../lib/repositories`, `../lib/services/content-master.service`, `../lib/services/workflow-orchestration.service`, `../lib/google-sheets/client`, `../types`, `../lib/services/object-auth.service`, `../lib/services/social-review.service`, `../lib/ai/gemini.client`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: YES (@google/genai SDK)
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0460: `src/tests/phase16-step3-rbac-gate.ts`

- **Directory:** `src/tests`
- **Filename:** `phase16-step3-rbac-gate.ts` (.ts, 13,644 bytes)
- **Primary Purpose:** Automated test suite verifying phase16-step3-rbac-gate
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `GateTestResult`, `GateSummary`
- **Imports (4):** `../lib/services/content-master.service`, `../lib/services/object-auth.service`, `../lib/repositories`, `../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: YES

---

## FILE-0461: `src/tests/phase16-step3-ui-integration.ts`

- **Directory:** `src/tests`
- **Filename:** `phase16-step3-ui-integration.ts` (.ts, 12,741 bytes)
- **Primary Purpose:** Automated test suite verifying phase16-step3-ui-integration
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (5):** `fs`, `path`, `../lib/api-client`, `../lib/services/content-master.service`, `../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: YES

---

## FILE-0462: `src/tests/phase17-video-workflow-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `phase17-video-workflow-verification.ts` (.ts, 31,436 bytes)
- **Primary Purpose:** Automated test suite verifying phase17-video-workflow-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `VerificationResult`
- **Imports (13):** `crypto`, `../lib/services/video.service`, `../lib/google-sheets/errors`, `../lib/repositories/questions.repository`, `../lib/repositories/scripts.repository`, `../lib/repositories/videos.repository`, `../lib/repositories/media-assets.repository`, `../lib/repositories/content-masters.repository` ... and 5 more
- **Consumers (1 files):** `src/tests/run-phase17-only.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: YES (Binary File Operations)
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0463: `src/tests/phase18-thumbnail-intelligence.ts`

- **Directory:** `src/tests`
- **Filename:** `phase18-thumbnail-intelligence.ts` (.ts, 25,418 bytes)
- **Primary Purpose:** Automated test suite verifying phase18-thumbnail-intelligence
- **Workflow Participation:** 08 Thumbnail (DIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `VerificationResult`
- **Imports (15):** `crypto`, `../lib/repositories/questions.repository`, `../lib/repositories/scripts.repository`, `../lib/repositories/videos.repository`, `../lib/repositories/media-assets.repository`, `../lib/repositories/content-masters.repository`, `../lib/repositories/thumbnails.repository`, `../lib/repositories/thumbnail-candidates.repository` ... and 7 more
- **Consumers (1 files):** `src/tests/run-phase18-only.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: YES (Binary File Operations)
  - Gemini / AI Orchestration: YES (@google/genai SDK)
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0464: `src/tests/phase19-pinned-comment-intelligence.ts`

- **Directory:** `src/tests`
- **Filename:** `phase19-pinned-comment-intelligence.ts` (.ts, 27,149 bytes)
- **Primary Purpose:** Automated test suite verifying phase19-pinned-comment-intelligence
- **Workflow Participation:** 15 Intelligence Loop (DIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `VerificationResult`
- **Imports (11):** `../lib/repositories/questions.repository`, `../lib/repositories/scripts.repository`, `../lib/repositories/videos.repository`, `../lib/repositories/content-masters.repository`, `../lib/repositories/publishing.repository`, `../lib/repositories/pinned-comments.repository`, `../lib/repositories/pinned-comment-packages.repository`, `../lib/services/phase19-pinned-comment-intelligence.service` ... and 3 more
- **Consumers (1 files):** `src/tests/run-phase19-only.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0465: `src/tests/phase2-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `phase2-verification.ts` (.ts, 7,440 bytes)
- **Primary Purpose:** Automated test suite verifying phase2-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** TEST LEGACY CANDIDATE (Early phase unit/integration tests superseded by end-to-end regression suites)
- **Exports (0):** None
- **Imports (5):** `../lib/schemas/google-sheets-schema`, `../lib/services/id.service`, `../lib/services/question.service`, `../lib/services/spreadsheet-verification.service`, `../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0466: `src/tests/phase20-social-review.ts`

- **Directory:** `src/tests`
- **Filename:** `phase20-social-review.ts` (.ts, 57,099 bytes)
- **Primary Purpose:** Automated test suite verifying phase20-social-review
- **Workflow Participation:** 09 Social Review (DIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `TestResultItem`, `Phase20VerificationSummary`
- **Imports (16):** `../lib/services/phase20-social-review.service`, `../lib/validators/phase20-social-quality-gate.validator`, `../lib/repositories/phase20-social-reviews.repository`, `../lib/repositories/content-masters.repository`, `../lib/repositories/questions.repository`, `../lib/repositories/scripts.repository`, `../lib/repositories/videos.repository`, `../lib/repositories/thumbnails.repository` ... and 8 more
- **Consumers (1 files):** `src/tests/run-phase20-only.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: YES (Binary File Operations)
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0467: `src/tests/phase21-platform-adaptation.ts`

- **Directory:** `src/tests`
- **Filename:** `phase21-platform-adaptation.ts` (.ts, 42,410 bytes)
- **Primary Purpose:** Automated test suite verifying phase21-platform-adaptation
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `TestResultItem`, `Phase21VerificationSummary`
- **Imports (11):** `../lib/services/phase21-platform-adaptation.service`, `../lib/repositories/platform-adaptations.repository`, `../lib/repositories/content-masters.repository`, `../lib/repositories/questions.repository`, `../lib/repositories/scripts.repository`, `../lib/repositories/videos.repository`, `../lib/repositories/thumbnails.repository`, `../lib/repositories/pinned-comment-packages.repository` ... and 3 more
- **Consumers (1 files):** `src/tests/run-phase21-only.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0468: `src/tests/phase22-publishing-hub.ts`

- **Directory:** `src/tests`
- **Filename:** `phase22-publishing-hub.ts` (.ts, 32,005 bytes)
- **Primary Purpose:** Automated test suite verifying phase22-publishing-hub
- **Workflow Participation:** 11 Published (DIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `Phase22TestResult`, `Phase22SuiteResult`
- **Imports (15):** `../lib/services/phase22-publishing-hub.service`, `../lib/repositories/phase22-publishing.repository`, `../lib/repositories/content-masters.repository`, `../lib/repositories/questions.repository`, `../lib/repositories/scripts.repository`, `../lib/repositories/videos.repository`, `../lib/repositories/thumbnails.repository`, `../lib/repositories/pinned-comment-packages.repository` ... and 7 more
- **Consumers (1 files):** `src/tests/run-phase22-only.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0469: `src/tests/phase23-production-dashboard.ts`

- **Directory:** `src/tests`
- **Filename:** `phase23-production-dashboard.ts` (.ts, 25,195 bytes)
- **Primary Purpose:** Automated test suite verifying phase23-production-dashboard
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `TestResult`, `TestSuiteSummary`
- **Imports (4):** `../lib/repositories`, `../lib/services/phase23-production.service`, `../lib/services/object-auth.service`, `../types`
- **Consumers (1 files):** `src/tests/run-phase23-only.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0470: `src/tests/phase24-ai-orchestrator.ts`

- **Directory:** `src/tests`
- **Filename:** `phase24-ai-orchestrator.ts` (.ts, 31,793 bytes)
- **Primary Purpose:** Automated test suite verifying phase24-ai-orchestrator
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `TestResult`, `Phase24VerificationReport`
- **Imports (13):** `../types/phase24-ai`, `../lib/ai/providers/base.adapter`, `../lib/ai/providers/gemini.adapter`, `../lib/ai/providers/openrouter.adapter`, `../lib/ai/providers/groq.adapter`, `../lib/ai/providers/mistral.adapter`, `../lib/ai/providers/cohere.adapter`, `../lib/ai/providers/huggingface.adapter` ... and 5 more
- **Consumers (1 files):** `src/tests/run-phase24-only.ts`
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: YES (@google/genai SDK)
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0471: `src/tests/phase27-social-analytics-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `phase27-social-analytics-verification.ts` (.ts, 7,231 bytes)
- **Primary Purpose:** Automated test suite verifying phase27-social-analytics-verification
- **Workflow Participation:** 13 Analytics (DIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `Phase27VerificationResult`
- **Imports (3):** `../lib/services/analytics.service`, `../lib/repositories/analytics.repository`, `../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0472: `src/tests/phase28-social-performance-intelligence-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `phase28-social-performance-intelligence-verification.ts` (.ts, 7,326 bytes)
- **Primary Purpose:** Automated test suite verifying phase28-social-performance-intelligence-verification
- **Workflow Participation:** 14 Performance Review (DIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `Phase28VerificationResult`
- **Imports (3):** `../lib/services/social-performance-intelligence.service`, `../lib/services/analytics.service`, `../lib/repositories/intelligence.repository`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0473: `src/tests/phase29-controlled-strategy-integration-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `phase29-controlled-strategy-integration-verification.ts` (.ts, 7,525 bytes)
- **Primary Purpose:** Automated test suite verifying phase29-controlled-strategy-integration-verification
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (5):** `../lib/services/social-performance-intelligence.service`, `../lib/services/taxonomy.service`, `../lib/repositories/questions.repository`, `../lib/repositories/content-masters.repository`, `../lib/repositories/intelligence.repository`
- **Consumers (1 files):** `src/tests/run-phase29.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0474: `src/tests/phase29b-posting-time-intelligence-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `phase29b-posting-time-intelligence-verification.ts` (.ts, 9,763 bytes)
- **Primary Purpose:** Automated test suite verifying phase29b-posting-time-intelligence-verification
- **Workflow Participation:** 15 Intelligence Loop (DIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (5):** `../lib/services/social-performance-intelligence.service`, `../lib/repositories/questions.repository`, `../lib/repositories/content-masters.repository`, `../lib/repositories/intelligence.repository`, `../types`
- **Consumers (1 files):** `src/tests/run-phase29.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0475: `src/tests/phase3-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `phase3-verification.ts` (.ts, 12,820 bytes)
- **Primary Purpose:** Automated test suite verifying phase3-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** TEST LEGACY CANDIDATE (Early phase unit/integration tests superseded by end-to-end regression suites)
- **Exports (0):** None
- **Imports (6):** `../lib/services/question.service`, `../lib/services/taxonomy.service`, `../lib/google-sheets/client`, `../lib/services/workflow.service`, `../lib/services/audit.service`, `../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0476: `src/tests/phase4-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `phase4-verification.ts` (.ts, 14,798 bytes)
- **Primary Purpose:** Automated test suite verifying phase4-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** TEST LEGACY CANDIDATE (Early phase unit/integration tests superseded by end-to-end regression suites)
- **Exports (1):** `TestResult`
- **Imports (8):** `../lib/ai/gemini.client`, `../lib/ai/gemini.service`, `../lib/ai/validators/candidate.validator`, `../lib/ai/prompts/generation.prompt`, `../lib/ai/prompts/refinement.prompt`, `../lib/services/question.service`, `../types`, `../lib/ai/types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: YES (@google/genai SDK)
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0477: `src/tests/phase5-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `phase5-verification.ts` (.ts, 20,650 bytes)
- **Primary Purpose:** Automated test suite verifying phase5-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** TEST LEGACY CANDIDATE (Early phase unit/integration tests superseded by end-to-end regression suites)
- **Exports (2):** `VerificationTestResult`, `Phase5VerificationSummary`
- **Imports (9):** `../lib/services/video.service`, `../lib/services/question.service`, `../lib/services/taxonomy.service`, `../lib/repositories/questions.repository`, `../lib/repositories/videos.repository`, `../lib/repositories/question-videos.repository`, `../lib/repositories/workflow.repository`, `../lib/repositories/audit-log.repository` ... and 1 more
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0478: `src/tests/phase6-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `phase6-verification.ts` (.ts, 20,949 bytes)
- **Primary Purpose:** Automated test suite verifying phase6-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** TEST LEGACY CANDIDATE (Early phase unit/integration tests superseded by end-to-end regression suites)
- **Exports (0):** None
- **Imports (13):** `../lib/services/script.service`, `../lib/services/thumbnail.service`, `../lib/services/pinned-comment.service`, `../lib/services/publishing.service`, `../lib/services/content-master.service`, `../lib/services/question.service`, `../lib/services/video.service`, `../lib/services/taxonomy.service` ... and 5 more
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0479: `src/tests/phase7-oauth-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `phase7-oauth-verification.ts` (.ts, 23,317 bytes)
- **Primary Purpose:** Automated test suite verifying phase7-oauth-verification
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `TestResult`
- **Imports (2):** `../lib/services/google-drive.service`, `googleapis`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: YES (Binary File Operations)
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0480: `src/tests/phase7-real-drive-e2e.ts`

- **Directory:** `src/tests`
- **Filename:** `phase7-real-drive-e2e.ts` (.ts, 6,063 bytes)
- **Primary Purpose:** Automated test suite verifying phase7-real-drive-e2e
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (2):** `../lib/services/google-drive.service`, `googleapis`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: YES (Binary File Operations)
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0481: `src/tests/phase7-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `phase7-verification.ts` (.ts, 9,371 bytes)
- **Primary Purpose:** Automated test suite verifying phase7-verification
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `TestResult`
- **Imports (7):** `../lib/services/google-drive.service`, `../lib/services/video.service`, `../lib/repositories/content-masters.repository`, `../lib/repositories/videos.repository`, `../config/media-upload.config`, `../types`, `../lib/services/object-auth.service`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: YES (Binary File Operations)
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0482: `src/tests/phase8-recovery-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `phase8-recovery-verification.ts` (.ts, 17,356 bytes)
- **Primary Purpose:** Automated test suite verifying phase8-recovery-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (7):** `../lib/services/script.service`, `../lib/services/video.service`, `../lib/services/id.service`, `../lib/services/google-drive.service`, `../lib/repositories`, `../types`, `../lib/google-sheets/errors`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: YES (Binary File Operations)
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0483: `src/tests/phase8a-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `phase8a-verification.ts` (.ts, 11,950 bytes)
- **Primary Purpose:** Automated test suite verifying phase8a-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (2):** `../lib/services/data-integrity.service`, `../lib/repositories`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0484: `src/tests/phase8b-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `phase8b-verification.ts` (.ts, 14,087 bytes)
- **Primary Purpose:** Automated test suite verifying phase8b-verification
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `TestAssertionResult`, `Phase8bVerificationReport`
- **Imports (8):** `../lib/google-sheets/errors`, `../lib/google-sheets/client`, `../lib/services/sequence-safety.service`, `../lib/services/operational-health.service`, `../lib/services/operational-recovery.service`, `../lib/services/audit.service`, `../lib/repositories`, `../lib/schemas/google-sheets-schema`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0485: `src/tests/phase8i-security-qa-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `phase8i-security-qa-verification.ts` (.ts, 43,976 bytes)
- **Primary Purpose:** Automated test suite verifying phase8i-security-qa-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `TestResult`, `SuiteSummary`
- **Imports (7):** `../lib/services/auth.service`, `../lib/services/object-auth.service`, `../server/middleware/auth.middleware`, `../server/routes`, `../lib/google-sheets/helpers`, `../types`, `../lib/schemas/google-sheets-schema`
- **Consumers (1 files):** `src/tests/run-all-regressions.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0486: `src/tests/phase9-content-workflow-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `phase9-content-workflow-verification.ts` (.ts, 103,541 bytes)
- **Primary Purpose:** Automated test suite verifying phase9-content-workflow-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `TestResult`
- **Imports (25):** `../lib/repositories/questions.repository`, `../lib/repositories/videos.repository`, `../lib/repositories/content-masters.repository`, `../lib/repositories/assignments.repository`, `../lib/repositories/users.repository`, `../lib/services/assignment.service`, `../lib/services/object-auth.service`, `../lib/repositories/scripts.repository` ... and 17 more
- **Consumers (1 files):** `src/tests/run-phase9.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0487: `src/tests/phase9-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `phase9-verification.ts` (.ts, 25,578 bytes)
- **Primary Purpose:** Automated test suite verifying phase9-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (7):** `../lib/validation/multi-layer-verification.engine`, `../lib/services/question.service`, `../lib/services/question-validation.service`, `../lib/repositories/validations.repository`, `../lib/repositories/questions.repository`, `../lib/services/taxonomy.service`, `../types`
- **Consumers (1 files):** `run-phase9-runner.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0488: `src/tests/pipeline-convergence-sequence-resilience.test.ts`

- **Directory:** `src/tests`
- **Filename:** `pipeline-convergence-sequence-resilience.test.ts` (.ts, 18,393 bytes)
- **Primary Purpose:** Automated test suite verifying pipeline-convergence-sequence-resilience
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (16):** `../lib/services/question.service`, `../lib/services/content-master.service`, `../lib/services/id.service`, `../lib/validation/multi-layer-verification.engine`, `../lib/services/taxonomy.service`, `../lib/services/smart-random.service`, `../lib/services/question-config.service`, `../lib/repositories/questions.repository` ... and 8 more
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0489: `src/tests/production-sheet-initializer-test.ts`

- **Directory:** `src/tests`
- **Filename:** `production-sheet-initializer-test.ts` (.ts, 4,580 bytes)
- **Primary Purpose:** Automated test suite verifying production-sheet-initializer-test
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (4):** `../lib/services/production-sheet-initializer.service`, `../lib/schemas/google-sheets-schema`, `../lib/google-sheets/client`, `../lib/repositories/sequences.repository`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0490: `src/tests/purge-test-artifacts.ts`

- **Directory:** `src/tests`
- **Filename:** `purge-test-artifacts.ts` (.ts, 8,402 bytes)
- **Primary Purpose:** Automated test suite verifying purge-test-artifacts
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (3):** `../lib/repositories`, `../lib/services/data-integrity.service`, `../lib/google-sheets/client`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0491: `src/tests/qa-user-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `qa-user-verification.ts` (.ts, 6,086 bytes)
- **Primary Purpose:** Automated test suite verifying qa-user-verification
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (5):** `./qa-user.fixture`, `../lib/services/auth.service`, `../lib/repositories/audit-log.repository`, `../server/middleware/auth.middleware`, `../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0492: `src/tests/qa-user.fixture.ts`

- **Directory:** `src/tests`
- **Filename:** `qa-user.fixture.ts` (.ts, 1,254 bytes)
- **Primary Purpose:** Automated test suite verifying qa-user.fixture
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `E2E_QA_USER`, `generateQaUserToken`
- **Imports (2):** `../types`, `../lib/services/auth.service`
- **Consumers (3 files):** `src/tests/language-default-verification.ts`, `src/tests/qa-user-verification.ts`, `src/tests/question-studio-config-integration.test.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0493: `src/tests/qs-duplicate-check-regression.test.ts`

- **Directory:** `src/tests`
- **Filename:** `qs-duplicate-check-regression.test.ts` (.ts, 4,439 bytes)
- **Primary Purpose:** Automated test suite verifying qs-duplicate-check-regression
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (2):** `../lib/services/question.service`, `../lib/repositories/questions.repository`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0494: `src/tests/qs-repair-regression.test.ts`

- **Directory:** `src/tests`
- **Filename:** `qs-repair-regression.test.ts` (.ts, 11,360 bytes)
- **Primary Purpose:** Automated test suite verifying qs-repair-regression
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (8):** `../lib/ai/schemas/question-candidate.schema`, `../lib/validators/question-creation.validator`, `../lib/ai/providers/gemini.adapter`, `../lib/ai/validators/candidate.validator`, `../lib/ai/phase24-orchestrator.service`, `../lib/validation/mathematical-logical.engine`, `../lib/validation/question-validation.engine`, `../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: YES (@google/genai SDK)
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0495: `src/tests/qs-successive-percentage-math.test.ts`

- **Directory:** `src/tests`
- **Filename:** `qs-successive-percentage-math.test.ts` (.ts, 8,347 bytes)
- **Primary Purpose:** Automated test suite verifying qs-successive-percentage-math
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (6):** `../lib/validation/mathematical-logical.engine`, `../lib/ai/validators/mathematical.validator`, `../lib/ai/validators/candidate.validator`, `../lib/validation/question-validation.engine`, `../lib/repositories`, `../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0496: `src/tests/qs-validation-alias-regression.test.ts`

- **Directory:** `src/tests`
- **Filename:** `qs-validation-alias-regression.test.ts` (.ts, 7,027 bytes)
- **Primary Purpose:** Automated test suite verifying qs-validation-alias-regression
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (2):** `../lib/validation/question-validation.engine`, `../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0497: `src/tests/qs14b-e2e-production-execution.ts`

- **Directory:** `src/tests`
- **Filename:** `qs14b-e2e-production-execution.ts` (.ts, 22,670 bytes)
- **Primary Purpose:** Automated test suite verifying qs14b-e2e-production-execution
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (13):** `../lib/services/question.service`, `../lib/services/script.service`, `../lib/services/video.service`, `../lib/services/thumbnail.service`, `../lib/services/pinned-comment.service`, `../lib/services/social-review.service`, `../lib/services/platform-adaptation.service`, `../lib/services/publishing.service` ... and 5 more
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: YES (Binary File Operations)
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0498: `src/tests/qs18b-blind-math-verification.test.ts`

- **Directory:** `src/tests`
- **Filename:** `qs18b-blind-math-verification.test.ts` (.ts, 14,479 bytes)
- **Primary Purpose:** Automated test suite verifying qs18b-blind-math-verification
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (7):** `../lib/ai/validators/candidate.validator`, `../lib/ai/validators/mathematical.validator`, `../lib/ai/validators/blind-verifier`, `../types`, `../lib/ai/types`, `../lib/repositories`, `../lib/services/question-config.service`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0499: `src/tests/qs19b-runtime-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `qs19b-runtime-verification.ts` (.ts, 7,145 bytes)
- **Primary Purpose:** Automated test suite verifying qs19b-runtime-verification
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (2):** `../lib/services/auth.service`, `../lib/repositories`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0500: `src/tests/qs19d-server-static-serving.test.ts`

- **Directory:** `src/tests`
- **Filename:** `qs19d-server-static-serving.test.ts` (.ts, 7,216 bytes)
- **Primary Purpose:** Automated test suite verifying qs19d-server-static-serving
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (4):** `fs`, `path`, `../lib/services/auth.service`, `../lib/repositories`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0501: `src/tests/qs21b-mathematical-safety-gate.test.ts`

- **Directory:** `src/tests`
- **Filename:** `qs21b-mathematical-safety-gate.test.ts` (.ts, 14,937 bytes)
- **Primary Purpose:** Automated test suite verifying qs21b-mathematical-safety-gate
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (8):** `../lib/ai/validators/candidate.validator`, `../lib/ai/validators/mathematical.validator`, `../lib/ai/validators/blind-verifier`, `../types`, `../lib/ai/types`, `../lib/validators/question-creation.validator`, `../lib/validation/question-validation.engine`, `../lib/repositories`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0502: `src/tests/question-config-infrastructure.test.ts`

- **Directory:** `src/tests`
- **Filename:** `question-config-infrastructure.test.ts` (.ts, 20,168 bytes)
- **Primary Purpose:** Automated test suite verifying question-config-infrastructure
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (10):** `../lib/schemas/google-sheets-schema`, `../lib/repositories/question-config.repository`, `../lib/services/question-config.service`, `../types`, `../lib/google-sheets/helpers`, `../lib/repositories/topics.repository`, `../lib/repositories/subtopics.repository`, `../lib/repositories/questions.repository` ... and 2 more
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0503: `src/tests/question-contract-regression.test.ts`

- **Directory:** `src/tests`
- **Filename:** `question-contract-regression.test.ts` (.ts, 14,849 bytes)
- **Primary Purpose:** Automated test suite verifying question-contract-regression
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (5):** `../lib/validators/question-creation.validator`, `../lib/services/question.service`, `../lib/services/taxonomy.service`, `../lib/repositories/question-config.repository`, `../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0504: `src/tests/question-studio-config-integration.test.ts`

- **Directory:** `src/tests`
- **Filename:** `question-studio-config-integration.test.ts` (.ts, 9,451 bytes)
- **Primary Purpose:** Automated test suite verifying question-studio-config-integration
- **Workflow Participation:** 01 Question Generation (DIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (5):** `express`, `../server/routes`, `./qa-user.fixture`, `../lib/services/question-config.service`, `../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0505: `src/tests/question-style-persistence.test.ts`

- **Directory:** `src/tests`
- **Filename:** `question-style-persistence.test.ts` (.ts, 19,884 bytes)
- **Primary Purpose:** Automated test suite verifying question-style-persistence
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (13):** `../lib/validators/question-creation.validator`, `../lib/services/question.service`, `../lib/repositories/questions.repository`, `../lib/repositories/sequences.repository`, `../lib/services/taxonomy.service`, `../lib/services/content-master.service`, `../lib/services/id.service`, `../lib/services/audit.service` ... and 5 more
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0506: `src/tests/real-life-context-configuration.test.ts`

- **Directory:** `src/tests`
- **Filename:** `real-life-context-configuration.test.ts` (.ts, 13,708 bytes)
- **Primary Purpose:** Automated test suite verifying real-life-context-configuration
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (14):** `../lib/services/question-config.service`, `../lib/services/smart-random.service`, `../lib/services/question.service`, `../lib/repositories/questions.repository`, `../lib/repositories/sequences.repository`, `../lib/ai/validators/candidate.validator`, `../lib/ai/orchestrator`, `../lib/validators/question-creation.validator` ... and 6 more
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0507: `src/tests/run-all-regressions.ts`

- **Directory:** `src/tests`
- **Filename:** `run-all-regressions.ts` (.ts, 6,190 bytes)
- **Primary Purpose:** Automated test suite verifying run-all-regressions
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (11):** `./task5-question-validation-engine-verification`, `./task6-telugu-script-verification`, `./task7c-question-studio-quality-verification`, `./task8b-social-content-foundation-verification`, `./task8c-hook-presentation-engine-verification`, `./task8d-teleprompter-spoken-enhancer-verification`, `./task8e-social-metadata-generator-verification`, `./task8f-multi-platform-adaptation-verification` ... and 3 more
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0508: `src/tests/run-phase11-only.ts`

- **Directory:** `src/tests`
- **Filename:** `run-phase11-only.ts` (.ts, 1,332 bytes)
- **Primary Purpose:** Automated test suite verifying run-phase11-only
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (1):** `./phase11-canonical-lifecycle-verification`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0509: `src/tests/run-phase11-step1-dashboard.ts`

- **Directory:** `src/tests`
- **Filename:** `run-phase11-step1-dashboard.ts` (.ts, 755 bytes)
- **Primary Purpose:** Automated test suite verifying run-phase11-step1-dashboard
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (1):** `./phase11-step1-dashboard-verification`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0510: `src/tests/run-phase11-step2-manager-dashboard.ts`

- **Directory:** `src/tests`
- **Filename:** `run-phase11-step2-manager-dashboard.ts` (.ts, 785 bytes)
- **Primary Purpose:** Automated test suite verifying run-phase11-step2-manager-dashboard
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (1):** `./phase11-step2-manager-dashboard-verification`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0511: `src/tests/run-phase11-step3-specialist-workboards.ts`

- **Directory:** `src/tests`
- **Filename:** `run-phase11-step3-specialist-workboards.ts` (.ts, 801 bytes)
- **Primary Purpose:** Automated test suite verifying run-phase11-step3-specialist-workboards
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (1):** `./phase11-step3-specialist-workboards-verification`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0512: `src/tests/run-phase12-only.ts`

- **Directory:** `src/tests`
- **Filename:** `run-phase12-only.ts` (.ts, 1,341 bytes)
- **Primary Purpose:** Automated test suite verifying run-phase12-only
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (1):** `./phase12-review-assignment-verification`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0513: `src/tests/run-phase12-step2.ts`

- **Directory:** `src/tests`
- **Filename:** `run-phase12-step2.ts` (.ts, 295 bytes)
- **Primary Purpose:** Automated test suite verifying run-phase12-step2
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (1):** `./phase12-step2-production-asset-validation`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0514: `src/tests/run-phase12-step3.ts`

- **Directory:** `src/tests`
- **Filename:** `run-phase12-step3.ts` (.ts, 300 bytes)
- **Primary Purpose:** Automated test suite verifying run-phase12-step3
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (1):** `./phase12-step3-production-asset-synchronization`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0515: `src/tests/run-phase12-step4.ts`

- **Directory:** `src/tests`
- **Filename:** `run-phase12-step4.ts` (.ts, 294 bytes)
- **Primary Purpose:** Automated test suite verifying run-phase12-step4
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (1):** `./phase12-step4-production-asset-readiness`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0516: `src/tests/run-phase13-live.ts`

- **Directory:** `src/tests`
- **Filename:** `run-phase13-live.ts` (.ts, 450 bytes)
- **Primary Purpose:** Automated test suite verifying run-phase13-live
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (1):** `./phase13-live-verification`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0517: `src/tests/run-phase13-only.ts`

- **Directory:** `src/tests`
- **Filename:** `run-phase13-only.ts` (.ts, 1,333 bytes)
- **Primary Purpose:** Automated test suite verifying run-phase13-only
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (1):** `./phase13-ai-refinement-verification`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0518: `src/tests/run-phase13-step1.ts`

- **Directory:** `src/tests`
- **Filename:** `run-phase13-step1.ts` (.ts, 374 bytes)
- **Primary Purpose:** Automated test suite verifying run-phase13-step1
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (1):** `./phase13-step1-publishing-scheduling`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0519: `src/tests/run-phase14-only.ts`

- **Directory:** `src/tests`
- **Filename:** `run-phase14-only.ts` (.ts, 1,359 bytes)
- **Primary Purpose:** Automated test suite verifying run-phase14-only
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (1):** `./phase14-production-drive-verification`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0520: `src/tests/run-phase15-only.ts`

- **Directory:** `src/tests`
- **Filename:** `run-phase15-only.ts` (.ts, 1,112 bytes)
- **Primary Purpose:** Automated test suite verifying run-phase15-only
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (1):** `./phase15-script-production-verification`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0521: `src/tests/run-phase15-step5.ts`

- **Directory:** `src/tests`
- **Filename:** `run-phase15-step5.ts` (.ts, 2,531 bytes)
- **Primary Purpose:** Automated test suite verifying run-phase15-step5
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (6):** `./phase15-step5-verification`, `./phase15-step3-verification`, `./phase15-step2-verification`, `./phase14-step2-verification`, `./phase14-step3-verification`, `./phase14-step4-verification`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0522: `src/tests/run-phase16-only.ts`

- **Directory:** `src/tests`
- **Filename:** `run-phase16-only.ts` (.ts, 929 bytes)
- **Primary Purpose:** Automated test suite verifying run-phase16-only
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (1):** `./phase16-human-script-workflow-verification`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0523: `src/tests/run-phase17-only.ts`

- **Directory:** `src/tests`
- **Filename:** `run-phase17-only.ts` (.ts, 931 bytes)
- **Primary Purpose:** Automated test suite verifying run-phase17-only
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (1):** `./phase17-video-workflow-verification`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0524: `src/tests/run-phase18-only.ts`

- **Directory:** `src/tests`
- **Filename:** `run-phase18-only.ts` (.ts, 926 bytes)
- **Primary Purpose:** Automated test suite verifying run-phase18-only
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (1):** `./phase18-thumbnail-intelligence`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0525: `src/tests/run-phase19-only.ts`

- **Directory:** `src/tests`
- **Filename:** `run-phase19-only.ts` (.ts, 1,127 bytes)
- **Primary Purpose:** Automated test suite verifying run-phase19-only
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (1):** `./phase19-pinned-comment-intelligence`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0526: `src/tests/run-phase20-only.ts`

- **Directory:** `src/tests`
- **Filename:** `run-phase20-only.ts` (.ts, 1,099 bytes)
- **Primary Purpose:** Automated test suite verifying run-phase20-only
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (1):** `./phase20-social-review`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0527: `src/tests/run-phase21-only.ts`

- **Directory:** `src/tests`
- **Filename:** `run-phase21-only.ts` (.ts, 1,110 bytes)
- **Primary Purpose:** Automated test suite verifying run-phase21-only
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (1):** `./phase21-platform-adaptation`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0528: `src/tests/run-phase22-only.ts`

- **Directory:** `src/tests`
- **Filename:** `run-phase22-only.ts` (.ts, 1,086 bytes)
- **Primary Purpose:** Automated test suite verifying run-phase22-only
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (1):** `./phase22-publishing-hub`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0529: `src/tests/run-phase23-only.ts`

- **Directory:** `src/tests`
- **Filename:** `run-phase23-only.ts` (.ts, 1,115 bytes)
- **Primary Purpose:** Automated test suite verifying run-phase23-only
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (1):** `./phase23-production-dashboard`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0530: `src/tests/run-phase24-only.ts`

- **Directory:** `src/tests`
- **Filename:** `run-phase24-only.ts` (.ts, 1,108 bytes)
- **Primary Purpose:** Automated test suite verifying run-phase24-only
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (1):** `./phase24-ai-orchestrator`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0531: `src/tests/run-phase25-only.ts`

- **Directory:** `src/tests`
- **Filename:** `run-phase25-only.ts` (.ts, 37,383 bytes)
- **Primary Purpose:** Automated test suite verifying run-phase25-only
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (5):** `../lib/ai/types`, `../types`, `../lib/services/phase25-consensus.service`, `../lib/ai/phase24-registry`, `../types/phase24-ai`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0532: `src/tests/run-phase26-only.ts`

- **Directory:** `src/tests`
- **Filename:** `run-phase26-only.ts` (.ts, 24,485 bytes)
- **Primary Purpose:** Automated test suite verifying run-phase26-only
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (5):** `../lib/services/phase26-copilot.service`, `../lib/repositories`, `../types`, `../lib/ai/phase24-registry`, `../types/phase24-ai`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0533: `src/tests/run-phase27-only.ts`

- **Directory:** `src/tests`
- **Filename:** `run-phase27-only.ts` (.ts, 20,277 bytes)
- **Primary Purpose:** Automated test suite verifying run-phase27-only
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (6):** `../lib/services/analytics.service`, `../lib/repositories/analytics.repository`, `../lib/repositories/content-masters.repository`, `../lib/repositories/questions.repository`, `../lib/services/object-auth.service`, `../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0534: `src/tests/run-phase28-only.ts`

- **Directory:** `src/tests`
- **Filename:** `run-phase28-only.ts` (.ts, 19,681 bytes)
- **Primary Purpose:** Automated test suite verifying run-phase28-only
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (11):** `../lib/services/social-performance-intelligence.service`, `../lib/services/analytics.service`, `../lib/repositories/intelligence.repository`, `../lib/repositories/content-masters.repository`, `../lib/repositories/questions.repository`, `../lib/repositories/topics.repository`, `../lib/repositories/subtopics.repository`, `../lib/services/object-auth.service` ... and 3 more
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0535: `src/tests/run-phase29.ts`

- **Directory:** `src/tests`
- **Filename:** `run-phase29.ts` (.ts, 729 bytes)
- **Primary Purpose:** Automated test suite verifying run-phase29
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (2):** `./phase29-controlled-strategy-integration-verification`, `./phase29b-posting-time-intelligence-verification`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0536: `src/tests/run-phase30-social-comments.ts`

- **Directory:** `src/tests`
- **Filename:** `run-phase30-social-comments.ts` (.ts, 19,490 bytes)
- **Primary Purpose:** Automated test suite verifying run-phase30-social-comments
- **Workflow Participation:** 15 Intelligence Loop (DIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (9):** `../lib/repositories/social-comments.repository`, `../lib/repositories/comment-intelligence.repository`, `../lib/services/social-comments.service`, `../lib/repositories/content-masters.repository`, `../lib/repositories/questions.repository`, `../lib/repositories/sequences.repository`, `../lib/services/id.service`, `../lib/schemas/google-sheets-schema` ... and 1 more
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0537: `src/tests/run-phase31-comment-intelligence.ts`

- **Directory:** `src/tests`
- **Filename:** `run-phase31-comment-intelligence.ts` (.ts, 24,296 bytes)
- **Primary Purpose:** Automated test suite verifying run-phase31-comment-intelligence
- **Workflow Participation:** 15 Intelligence Loop (DIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (12):** `../lib/services/comment-intelligence.service`, `../lib/services/social-comments.service`, `../lib/repositories/social-comments.repository`, `../lib/repositories/comment-intelligence.repository`, `../lib/repositories/content-masters.repository`, `../lib/repositories/questions.repository`, `../lib/services/id.service`, `../lib/repositories/audit-log.repository` ... and 4 more
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0538: `src/tests/run-phase32-c4-feedback-loop.ts`

- **Directory:** `src/tests`
- **Filename:** `run-phase32-c4-feedback-loop.ts` (.ts, 16,285 bytes)
- **Primary Purpose:** Automated test suite verifying run-phase32-c4-feedback-loop
- **Workflow Participation:** 15 Intelligence Loop (DIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (12):** `../contexts/ProductionJourneyContext`, `../lib/services/content-strategy.service`, `../lib/services/social-comments.service`, `../lib/services/comment-intelligence.service`, `../lib/repositories/analytics.repository`, `../lib/repositories/strategy-recommendation.repository`, `../lib/repositories/social-comments.repository`, `../lib/repositories/comment-intelligence.repository` ... and 4 more
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0539: `src/tests/run-phase9.ts`

- **Directory:** `src/tests`
- **Filename:** `run-phase9.ts` (.ts, 401 bytes)
- **Primary Purpose:** Automated test suite verifying run-phase9
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (1):** `./phase9-content-workflow-verification`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0540: `src/tests/run-task2.ts`

- **Directory:** `src/tests`
- **Filename:** `run-task2.ts` (.ts, 1,196 bytes)
- **Primary Purpose:** Automated test suite verifying run-task2
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (1):** `./task2-content-master-verification`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0541: `src/tests/run-task3d4.ts`

- **Directory:** `src/tests`
- **Filename:** `run-task3d4.ts` (.ts, 414 bytes)
- **Primary Purpose:** Automated test suite verifying run-task3d4
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (1):** `./task3d4-script-designer-workflow-verification`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0542: `src/tests/run-task3d5.ts`

- **Directory:** `src/tests`
- **Filename:** `run-task3d5.ts` (.ts, 429 bytes)
- **Primary Purpose:** Automated test suite verifying run-task3d5
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (1):** `./task3d5-workload-dashboard-verification`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0543: `src/tests/run-task3e1.ts`

- **Directory:** `src/tests`
- **Filename:** `run-task3e1.ts` (.ts, 429 bytes)
- **Primary Purpose:** Automated test suite verifying run-task3e1
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (1):** `./task3e1-my-work-operations-verification`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0544: `src/tests/run-task3f55.ts`

- **Directory:** `src/tests`
- **Filename:** `run-task3f55.ts` (.ts, 689 bytes)
- **Primary Purpose:** Automated test suite verifying run-task3f55
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (1):** `./task3f55-global-search-routing-verification`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0545: `src/tests/semantic-verification.test.ts`

- **Directory:** `src/tests`
- **Filename:** `semantic-verification.test.ts` (.ts, 3,499 bytes)
- **Primary Purpose:** Automated test suite verifying semantic-verification
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (2):** `../lib/ai/validators/semantic-reasoning.provider`, `../lib/ai/gemini.client`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: YES (@google/genai SDK)
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0546: `src/tests/sequence-self-healing-resilience.test.ts`

- **Directory:** `src/tests`
- **Filename:** `sequence-self-healing-resilience.test.ts` (.ts, 25,105 bytes)
- **Primary Purpose:** Automated test suite verifying sequence-self-healing-resilience
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (8):** `../lib/repositories/sequences.repository`, `../lib/repositories/questions.repository`, `../lib/repositories/content-masters.repository`, `../lib/repositories/videos.repository`, `../lib/repositories/users.repository`, `../lib/google-sheets/client`, `../lib/google-sheets/errors`, `../lib/schemas/google-sheets-schema`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0547: `src/tests/stage01-draft-workflow-separation.test.ts`

- **Directory:** `src/tests`
- **Filename:** `stage01-draft-workflow-separation.test.ts` (.ts, 6,716 bytes)
- **Primary Purpose:** Automated test suite verifying stage01-draft-workflow-separation
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (7):** `fs`, `path`, `../lib/services/question-draft.service`, `../lib/repositories/question-drafts.repository`, `../lib/services/question-validation.service`, `../lib/services/id.service`, `../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0548: `src/tests/stage02-targeted-bugfixes.test.ts`

- **Directory:** `src/tests`
- **Filename:** `stage02-targeted-bugfixes.test.ts` (.ts, 9,069 bytes)
- **Primary Purpose:** Automated test suite verifying stage02-targeted-bugfixes
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (9):** `fs`, `path`, `../lib/services/question-draft.service`, `../lib/repositories/question-drafts.repository`, `../lib/repositories/questions.repository`, `../lib/repositories/videos.repository`, `../lib/services/question-validation.service`, `../lib/services/id.service` ... and 1 more
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0549: `src/tests/stage02-video-transitions.test.ts`

- **Directory:** `src/tests`
- **Filename:** `stage02-video-transitions.test.ts` (.ts, 10,376 bytes)
- **Primary Purpose:** Automated test suite verifying stage02-video-transitions
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (7):** `../lib/services/video.service`, `../lib/services/google-drive.service`, `../lib/repositories/videos.repository`, `../lib/repositories/questions.repository`, `../lib/repositories/media-assets.repository`, `../lib/repositories/content-masters.repository`, `../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: YES (Binary File Operations)
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0550: `src/tests/stage8-continuous-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `stage8-continuous-verification.ts` (.ts, 41,005 bytes)
- **Primary Purpose:** Automated test suite verifying stage8-continuous-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (14):** `assert`, `../lib/services/question.service`, `../lib/services/video.service`, `../lib/services/script.service`, `../lib/services/thumbnail.service`, `../lib/services/pinned-comment.service`, `../lib/services/social-review.service`, `../lib/services/publishing.service` ... and 6 more
- **Consumers (1 files):** `run-stage8-runner.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: YES (Binary File Operations)
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: YES

---

## FILE-0551: `src/tests/step01-question-studio-workflow-state.test.ts`

- **Directory:** `src/tests`
- **Filename:** `step01-question-studio-workflow-state.test.ts` (.ts, 8,876 bytes)
- **Primary Purpose:** Automated test suite verifying step01-question-studio-workflow-state
- **Workflow Participation:** 01 Question Generation (DIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (4):** `../pages/QuestionStudioPage`, `../types`, `fs`, `path`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0552: `src/tests/studio-e2e-integration.ts`

- **Directory:** `src/tests`
- **Filename:** `studio-e2e-integration.ts` (.ts, 9,697 bytes)
- **Primary Purpose:** Automated test suite verifying studio-e2e-integration
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (4):** `../lib/services`, `../lib/repositories`, `../lib/services/data-integrity.service`, `../lib/validation/question-validation.engine`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0553: `src/tests/surgical-repair.ts`

- **Directory:** `src/tests`
- **Filename:** `surgical-repair.ts` (.ts, 8,153 bytes)
- **Primary Purpose:** Automated test suite verifying surgical-repair
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (6):** `../lib/repositories`, `../lib/services/snapshot-exporter.service`, `../lib/services/durable-snapshot-archive.service`, `../lib/services/data-integrity.service`, `fs`, `path`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0554: `src/tests/task2-content-master-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task2-content-master-verification.ts` (.ts, 14,517 bytes)
- **Primary Purpose:** Automated test suite verifying task2-content-master-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `Task2VerificationResult`
- **Imports (11):** `../lib/schemas/google-sheets-schema`, `../lib/repositories`, `../lib/services/id.service`, `../lib/services/sequence-safety.service`, `../lib/services/content-master.service`, `../lib/services/question.service`, `../lib/services/video.service`, `../lib/services/dashboard.service` ... and 3 more
- **Consumers (1 files):** `src/tests/run-task2.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0555: `src/tests/task2b-taxonomy-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task2b-taxonomy-verification.ts` (.ts, 14,130 bytes)
- **Primary Purpose:** Automated test suite verifying task2b-taxonomy-verification
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `Task2bVerificationResult`
- **Imports (5):** `../lib/services/taxonomy.service`, `../lib/services/question.service`, `../lib/repositories`, `../lib/google-sheets/client`, `../lib/google-sheets/errors`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0556: `src/tests/task2c-question-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task2c-question-verification.ts` (.ts, 24,037 bytes)
- **Primary Purpose:** Automated test suite verifying task2c-question-verification
- **Workflow Participation:** 02 Question Verification (DIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `Task2cVerificationResult`
- **Imports (6):** `../lib/services/question.service`, `../lib/services/taxonomy.service`, `../lib/repositories`, `../lib/google-sheets/client`, `../types`, `../lib/google-sheets/errors`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0557: `src/tests/task2d-gemini-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task2d-gemini-verification.ts` (.ts, 18,838 bytes)
- **Primary Purpose:** Automated test suite verifying task2d-gemini-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (9):** `../lib/ai/gemini.client`, `../lib/ai/gemini.service`, `../lib/services/question.service`, `../lib/services/taxonomy.service`, `../lib/services/audit.service`, `../lib/ai/validators/candidate.validator`, `../lib/ai/schemas/question-candidate.schema`, `../types` ... and 1 more
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: YES (@google/genai SDK)
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0558: `src/tests/task2d1-gemini-fallback-math.ts`

- **Directory:** `src/tests`
- **Filename:** `task2d1-gemini-fallback-math.ts` (.ts, 6,681 bytes)
- **Primary Purpose:** Automated test suite verifying task2d1-gemini-fallback-math
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (4):** `../lib/ai/gemini.client`, `../lib/ai/gemini.service`, `../lib/ai/validators/candidate.validator`, `../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: YES (@google/genai SDK)
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0559: `src/tests/task2e1-question-to-video.ts`

- **Directory:** `src/tests`
- **Filename:** `task2e1-question-to-video.ts` (.ts, 10,336 bytes)
- **Primary Purpose:** Automated test suite verifying task2e1-question-to-video
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (4):** `../lib/repositories`, `../lib/services/question.service`, `../lib/services/video.service`, `../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0560: `src/tests/task2e2-video-script-versioning.ts`

- **Directory:** `src/tests`
- **Filename:** `task2e2-video-script-versioning.ts` (.ts, 15,310 bytes)
- **Primary Purpose:** Automated test suite verifying task2e2-video-script-versioning
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (4):** `../lib/repositories`, `../lib/services/script.service`, `../lib/services/video.service`, `../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0561: `src/tests/task2e3-thumbnail-workflow.ts`

- **Directory:** `src/tests`
- **Filename:** `task2e3-thumbnail-workflow.ts` (.ts, 13,286 bytes)
- **Primary Purpose:** Automated test suite verifying task2e3-thumbnail-workflow
- **Workflow Participation:** 08 Thumbnail (DIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (4):** `../lib/repositories`, `../lib/services/thumbnail.service`, `../lib/services/video.service`, `../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0562: `src/tests/task2e4-pinned-comment-workflow.ts`

- **Directory:** `src/tests`
- **Filename:** `task2e4-pinned-comment-workflow.ts` (.ts, 15,429 bytes)
- **Primary Purpose:** Automated test suite verifying task2e4-pinned-comment-workflow
- **Workflow Participation:** 15 Intelligence Loop (DIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (4):** `../lib/repositories`, `../lib/services/pinned-comment.service`, `../lib/services/video.service`, `../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0563: `src/tests/task2e5-cleanup-safety.ts`

- **Directory:** `src/tests`
- **Filename:** `task2e5-cleanup-safety.ts` (.ts, 6,090 bytes)
- **Primary Purpose:** Automated test suite verifying task2e5-cleanup-safety
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (3):** `../lib/repositories`, `../lib/services/publishing.service`, `../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0564: `src/tests/task2e5-publishing-workflow.ts`

- **Directory:** `src/tests`
- **Filename:** `task2e5-publishing-workflow.ts` (.ts, 18,064 bytes)
- **Primary Purpose:** Automated test suite verifying task2e5-publishing-workflow
- **Workflow Participation:** 11 Published (DIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (4):** `../lib/repositories`, `../lib/services/publishing.service`, `../lib/services/video.service`, `../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0565: `src/tests/task2e6-final-pipeline-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task2e6-final-pipeline-verification.ts` (.ts, 12,286 bytes)
- **Primary Purpose:** Automated test suite verifying task2e6-final-pipeline-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (3):** `../lib/repositories`, `../lib/services/publishing.service`, `../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0566: `src/tests/task3-taxonomy-engine-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task3-taxonomy-engine-verification.ts` (.ts, 15,090 bytes)
- **Primary Purpose:** Automated test suite verifying task3-taxonomy-engine-verification
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `VerificationCheckResult`, `Task3VerificationReport`
- **Imports (3):** `../lib/services/taxonomy.service`, `../types`, `../lib/google-sheets/errors`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0567: `src/tests/task3a-planning-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task3a-planning-verification.ts` (.ts, 16,018 bytes)
- **Primary Purpose:** Automated test suite verifying task3a-planning-verification
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (9):** `../lib/services/planning.service`, `../lib/services/similarity.service`, `../lib/services/taxonomy.service`, `../lib/services/id.service`, `../lib/repositories/content-plans.repository`, `../lib/repositories/content-batches.repository`, `../lib/repositories/questions.repository`, `../lib/repositories/audit-log.repository` ... and 1 more
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0568: `src/tests/task3d1-assignment-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task3d1-assignment-verification.ts` (.ts, 16,080 bytes)
- **Primary Purpose:** Automated test suite verifying task3d1-assignment-verification
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `TestResultItem`
- **Imports (10):** `../lib/services/assignment.service`, `../lib/repositories/users.repository`, `../lib/repositories/assignments.repository`, `../lib/repositories/questions.repository`, `../lib/repositories/audit-log.repository`, `../lib/repositories/sequences.repository`, `../lib/services/id.service`, `../lib/services/auth.service` ... and 2 more
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0569: `src/tests/task3d2-rbac-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task3d2-rbac-verification.ts` (.ts, 18,726 bytes)
- **Primary Purpose:** Automated test suite verifying task3d2-rbac-verification
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `TestResultItem`
- **Imports (8):** `../lib/services/auth.service`, `../lib/services/assignment.service`, `../lib/repositories/users.repository`, `../lib/repositories/assignments.repository`, `../lib/repositories/questions.repository`, `../server/middleware/auth.middleware`, `../server/routes`, `../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0570: `src/tests/task3d3-review-workflow-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task3d3-review-workflow-verification.ts` (.ts, 31,554 bytes)
- **Primary Purpose:** Automated test suite verifying task3d3-review-workflow-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `TestResultItem`
- **Imports (14):** `../lib/services/question.service`, `../lib/services/assignment.service`, `../lib/services/auth.service`, `../lib/repositories/users.repository`, `../lib/repositories/questions.repository`, `../lib/repositories/assignments.repository`, `../lib/repositories/workflow.repository`, `../lib/repositories/audit-log.repository` ... and 6 more
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0571: `src/tests/task3d4-script-designer-workflow-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task3d4-script-designer-workflow-verification.ts` (.ts, 45,641 bytes)
- **Primary Purpose:** Automated test suite verifying task3d4-script-designer-workflow-verification
- **Workflow Participation:** 03 Audience Script (DIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `TestResultItem`
- **Imports (19):** `../lib/services/question.service`, `../lib/services/video.service`, `../lib/services/script.service`, `../lib/services/thumbnail.service`, `../lib/services/assignment.service`, `../lib/services/auth.service`, `../lib/repositories/users.repository`, `../lib/repositories/questions.repository` ... and 11 more
- **Consumers (1 files):** `src/tests/run-task3d4.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0572: `src/tests/task3d5-workload-dashboard-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task3d5-workload-dashboard-verification.ts` (.ts, 31,502 bytes)
- **Primary Purpose:** Automated test suite verifying task3d5-workload-dashboard-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `TestResultItem`, `Task3D5VerificationReport`
- **Imports (4):** `../lib/repositories`, `../lib/services/assignment.service`, `../lib/services/auth.service`, `../types`
- **Consumers (1 files):** `src/tests/run-task3d5.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0573: `src/tests/task3e1-my-work-operations-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task3e1-my-work-operations-verification.ts` (.ts, 16,461 bytes)
- **Primary Purpose:** Automated test suite verifying task3e1-my-work-operations-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `TestResultItem`, `Task3E1VerificationReport`
- **Imports (3):** `../lib/repositories`, `../lib/services/assignment.service`, `../types`
- **Consumers (1 files):** `src/tests/run-task3e1.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: YES

---

## FILE-0574: `src/tests/task3e2-production-board-api.ts`

- **Directory:** `src/tests`
- **Filename:** `task3e2-production-board-api.ts` (.ts, 4,199 bytes)
- **Primary Purpose:** Automated test suite verifying task3e2-production-board-api
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (2):** `../lib/services`, `../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0575: `src/tests/task3e3-readiness-rules-inspection.ts`

- **Directory:** `src/tests`
- **Filename:** `task3e3-readiness-rules-inspection.ts` (.ts, 4,281 bytes)
- **Primary Purpose:** Automated test suite verifying task3e3-readiness-rules-inspection
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (3):** `../lib/services`, `../lib/services/video.service`, `../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0576: `src/tests/task3f4-restore-validator-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task3f4-restore-validator-verification.ts` (.ts, 11,627 bytes)
- **Primary Purpose:** Automated test suite verifying task3f4-restore-validator-verification
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (4):** `node:crypto`, `../lib/services/restore-validator.service`, `../lib/services/snapshot-exporter.service`, `../lib/schemas/google-sheets-schema`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0577: `src/tests/task3f4-snapshot-exporter-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task3f4-snapshot-exporter-verification.ts` (.ts, 3,385 bytes)
- **Primary Purpose:** Automated test suite verifying task3f4-snapshot-exporter-verification
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (2):** `../lib/services/snapshot-exporter.service`, `../lib/schemas/google-sheets-schema`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: YES (@google/genai SDK)
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0578: `src/tests/task3f410a-snapshot-config-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task3f410a-snapshot-config-verification.ts` (.ts, 7,361 bytes)
- **Primary Purpose:** Automated test suite verifying task3f410a-snapshot-config-verification
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (1):** `../config/snapshot.config`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0579: `src/tests/task3f410b-durable-archive-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task3f410b-durable-archive-verification.ts` (.ts, 11,931 bytes)
- **Primary Purpose:** Automated test suite verifying task3f410b-durable-archive-verification
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (2):** `../lib/services/durable-snapshot-archive.service`, `../lib/services/snapshot-exporter.service`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: YES (@google/genai SDK)
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0580: `src/tests/task3f410c-durable-archive-integration-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task3f410c-durable-archive-integration-verification.ts` (.ts, 12,081 bytes)
- **Primary Purpose:** Automated test suite verifying task3f410c-durable-archive-integration-verification
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (3):** `../lib/services/snapshot-history.service`, `../lib/services/durable-snapshot-archive.service`, `../lib/services/snapshot-exporter.service`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0581: `src/tests/task3f410d-recovery-archive-ui-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task3f410d-recovery-archive-ui-verification.ts` (.ts, 11,909 bytes)
- **Primary Purpose:** Automated test suite verifying task3f410d-recovery-archive-ui-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `TestResultItem`
- **Imports (3):** `../types`, `../lib/api-client`, `node:fs`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: YES

---

## FILE-0582: `src/tests/task3f410e-gcs-smoke-test.ts`

- **Directory:** `src/tests`
- **Filename:** `task3f410e-gcs-smoke-test.ts` (.ts, 16,416 bytes)
- **Primary Purpose:** Automated test suite verifying task3f410e-gcs-smoke-test
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `TestResultItem`
- **Imports (5):** `../config/snapshot.config`, `../lib/services/durable-snapshot-archive.service`, `../lib/services/snapshot-history.service`, `../lib/services/snapshot-exporter.service`, `node:crypto`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0583: `src/tests/task3f410f-scheduler-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task3f410f-scheduler-verification.ts` (.ts, 15,396 bytes)
- **Primary Purpose:** Automated test suite verifying task3f410f-scheduler-verification
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `TestResultItem`
- **Imports (5):** `../lib/services/snapshot-scheduler.service`, `../lib/services/durable-snapshot-archive.service`, `../lib/services/snapshot-history.service`, `../lib/services/snapshot-exporter.service`, `node:crypto`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0584: `src/tests/task3f47a-granular-question-restore-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task3f47a-granular-question-restore-verification.ts` (.ts, 12,119 bytes)
- **Primary Purpose:** Automated test suite verifying task3f47a-granular-question-restore-verification
- **Workflow Participation:** 02 Question Verification (DIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (4):** `node:crypto`, `../lib/services/granular-question-restore.service`, `../lib/services/snapshot-exporter.service`, `../lib/schemas/google-sheets-schema`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0585: `src/tests/task3f47b-granular-video-restore-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task3f47b-granular-video-restore-verification.ts` (.ts, 19,576 bytes)
- **Primary Purpose:** Automated test suite verifying task3f47b-granular-video-restore-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (6):** `node:crypto`, `../lib/services/granular-video-restore.service`, `../lib/services/snapshot-exporter.service`, `../lib/schemas/google-sheets-schema`, `../lib/repositories`, `../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0586: `src/tests/task3f47c-granular-script-restore-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task3f47c-granular-script-restore-verification.ts` (.ts, 20,715 bytes)
- **Primary Purpose:** Automated test suite verifying task3f47c-granular-script-restore-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (6):** `node:crypto`, `../lib/services/granular-script-restore.service`, `../lib/services/snapshot-exporter.service`, `../lib/schemas/google-sheets-schema`, `../lib/repositories`, `../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0587: `src/tests/task3f47d-granular-thumbnail-restore-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task3f47d-granular-thumbnail-restore-verification.ts` (.ts, 20,812 bytes)
- **Primary Purpose:** Automated test suite verifying task3f47d-granular-thumbnail-restore-verification
- **Workflow Participation:** 08 Thumbnail (DIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (6):** `node:crypto`, `../lib/services/granular-thumbnail-restore.service`, `../lib/services/snapshot-exporter.service`, `../lib/schemas/google-sheets-schema`, `../lib/repositories`, `../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0588: `src/tests/task3f47e-granular-pinned-comment-restore-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task3f47e-granular-pinned-comment-restore-verification.ts` (.ts, 20,139 bytes)
- **Primary Purpose:** Automated test suite verifying task3f47e-granular-pinned-comment-restore-verification
- **Workflow Participation:** 15 Intelligence Loop (DIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (6):** `node:crypto`, `../lib/services/granular-pinned-comment-restore.service`, `../lib/services/snapshot-exporter.service`, `../lib/schemas/google-sheets-schema`, `../lib/repositories`, `../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0589: `src/tests/task3f47f-granular-publishing-restore-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task3f47f-granular-publishing-restore-verification.ts` (.ts, 18,828 bytes)
- **Primary Purpose:** Automated test suite verifying task3f47f-granular-publishing-restore-verification
- **Workflow Participation:** 11 Published (DIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (6):** `node:crypto`, `../lib/services/granular-publishing-restore.service`, `../lib/services/snapshot-exporter.service`, `../lib/schemas/google-sheets-schema`, `../lib/repositories`, `../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0590: `src/tests/task3f47g-granular-assignment-restore-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task3f47g-granular-assignment-restore-verification.ts` (.ts, 26,631 bytes)
- **Primary Purpose:** Automated test suite verifying task3f47g-granular-assignment-restore-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (6):** `node:crypto`, `../lib/services/granular-assignment-restore.service`, `../lib/services/snapshot-exporter.service`, `../lib/schemas/google-sheets-schema`, `../lib/repositories`, `../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0591: `src/tests/task3f48-full-snapshot-preflight-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task3f48-full-snapshot-preflight-verification.ts` (.ts, 9,458 bytes)
- **Primary Purpose:** Automated test suite verifying task3f48-full-snapshot-preflight-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (4):** `node:crypto`, `../lib/services/full-snapshot-preflight.service`, `../lib/schemas/google-sheets-schema`, `../lib/services/full-snapshot-restore.service`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0592: `src/tests/task3f48-full-snapshot-restore-execution-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task3f48-full-snapshot-restore-execution-verification.ts` (.ts, 36,593 bytes)
- **Primary Purpose:** Automated test suite verifying task3f48-full-snapshot-restore-execution-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (4):** `node:crypto`, `../lib/services/full-snapshot-restore-execution.service`, `../lib/services/full-snapshot-restore-plan.service`, `../lib/repositories`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0593: `src/tests/task3f48-full-snapshot-restore-plan-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task3f48-full-snapshot-restore-plan-verification.ts` (.ts, 14,184 bytes)
- **Primary Purpose:** Automated test suite verifying task3f48-full-snapshot-restore-plan-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (3):** `node:crypto`, `../lib/services/full-snapshot-restore-plan.service`, `../lib/schemas/google-sheets-schema`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0594: `src/tests/task3f48-full-snapshot-restore-planner-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task3f48-full-snapshot-restore-planner-verification.ts` (.ts, 6,806 bytes)
- **Primary Purpose:** Automated test suite verifying task3f48-full-snapshot-restore-planner-verification
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (3):** `node:crypto`, `../lib/services/full-snapshot-restore.service`, `../lib/schemas/google-sheets-schema`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0595: `src/tests/task3f49-full-restore-api-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task3f49-full-restore-api-verification.ts` (.ts, 15,354 bytes)
- **Primary Purpose:** Automated test suite verifying task3f49-full-restore-api-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `TestResultItem`
- **Imports (6):** `node:crypto`, `../types`, `../server/middleware/auth.middleware`, `../lib/schemas/google-sheets-schema`, `../lib/services/snapshot-exporter.service`, `../lib/services/full-snapshot-restore-execution.service`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0596: `src/tests/task3f49-full-restore-ui-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task3f49-full-restore-ui-verification.ts` (.ts, 19,746 bytes)
- **Primary Purpose:** Automated test suite verifying task3f49-full-restore-ui-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `TestResultItem`
- **Imports (3):** `node:fs`, `../types`, `../lib/api-client`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: YES

---

## FILE-0597: `src/tests/task3f49-granular-restore-api-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task3f49-granular-restore-api-verification.ts` (.ts, 19,209 bytes)
- **Primary Purpose:** Automated test suite verifying task3f49-granular-restore-api-verification
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `TestResultItem`
- **Imports (5):** `node:crypto`, `../types`, `../server/middleware/auth.middleware`, `../lib/schemas/google-sheets-schema`, `../lib/services/snapshot-exporter.service`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0598: `src/tests/task3f49-granular-restore-ui-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task3f49-granular-restore-ui-verification.ts` (.ts, 16,786 bytes)
- **Primary Purpose:** Automated test suite verifying task3f49-granular-restore-ui-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `TestResultItem`
- **Imports (3):** `node:fs`, `../types`, `../lib/api-client`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: YES

---

## FILE-0599: `src/tests/task3f49-recovery-admin-status-ui-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task3f49-recovery-admin-status-ui-verification.ts` (.ts, 7,685 bytes)
- **Primary Purpose:** Automated test suite verifying task3f49-recovery-admin-status-ui-verification
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `TestResultItem`
- **Imports (2):** `../types`, `../lib/api-client`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0600: `src/tests/task3f49-recovery-dry-run-api-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task3f49-recovery-dry-run-api-verification.ts` (.ts, 13,905 bytes)
- **Primary Purpose:** Automated test suite verifying task3f49-recovery-dry-run-api-verification
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `TestResultItem`
- **Imports (6):** `node:crypto`, `../types`, `../lib/repositories`, `../server/middleware/auth.middleware`, `../lib/services/full-snapshot-restore-plan.service`, `../lib/schemas/google-sheets-schema`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0601: `src/tests/task3f49-recovery-dry-run-ui-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task3f49-recovery-dry-run-ui-verification.ts` (.ts, 16,882 bytes)
- **Primary Purpose:** Automated test suite verifying task3f49-recovery-dry-run-ui-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `TestResultItem`
- **Imports (2):** `../types`, `../lib/api-client`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: YES

---

## FILE-0602: `src/tests/task3f49-recovery-security-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task3f49-recovery-security-verification.ts` (.ts, 19,356 bytes)
- **Primary Purpose:** Automated test suite verifying task3f49-recovery-security-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `TestResultItem`
- **Imports (9):** `node:crypto`, `../types`, `../server/middleware/auth.middleware`, `../lib/schemas/google-sheets-schema`, `../lib/services/snapshot-exporter.service`, `../lib/services/full-snapshot-restore-execution.service`, `../lib/services/granular-question-restore.service`, `../lib/services/audit.service` ... and 1 more
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0603: `src/tests/task3f49-recovery-snapshot-history-ui-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task3f49-recovery-snapshot-history-ui-verification.ts` (.ts, 10,681 bytes)
- **Primary Purpose:** Automated test suite verifying task3f49-recovery-snapshot-history-ui-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `TestResultItem`
- **Imports (2):** `../types`, `../lib/api-client`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: YES

---

## FILE-0604: `src/tests/task3f49-recovery-status-api-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task3f49-recovery-status-api-verification.ts` (.ts, 9,909 bytes)
- **Primary Purpose:** Automated test suite verifying task3f49-recovery-status-api-verification
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `TestResultItem`
- **Imports (3):** `../types`, `../lib/repositories`, `../server/middleware/auth.middleware`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0605: `src/tests/task3f55-global-search-routing-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task3f55-global-search-routing-verification.ts` (.ts, 16,860 bytes)
- **Primary Purpose:** Automated test suite verifying task3f55-global-search-routing-verification
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (2):** `../lib/services`, `../types`
- **Consumers (1 files):** `src/tests/run-task3f55.ts`
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0606: `src/tests/task4-question-creation-engine-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task4-question-creation-engine-verification.ts` (.ts, 25,094 bytes)
- **Primary Purpose:** Automated test suite verifying task4-question-creation-engine-verification
- **Workflow Participation:** 02 Question Verification (DIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `Task4CheckResult`, `Task4VerificationReport`
- **Imports (10):** `../lib/services/question.service`, `../lib/services/content-master.service`, `../lib/services/taxonomy.service`, `../lib/services/audit.service`, `../lib/services/id.service`, `../lib/repositories/questions.repository`, `../config/question-creation.config`, `../lib/validators/question-creation.validator` ... and 2 more
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0607: `src/tests/task5-question-validation-engine-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task5-question-validation-engine-verification.ts` (.ts, 37,574 bytes)
- **Primary Purpose:** Automated test suite verifying task5-question-validation-engine-verification
- **Workflow Participation:** 02 Question Verification (DIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `VerificationCheckResult`, `VerificationSuiteSummary`
- **Imports (12):** `../lib/validation/question-validation.engine`, `../lib/validation/mathematical-logical.engine`, `../lib/validation/options.validator`, `../lib/validation/explanation.validator`, `../lib/validation/ambiguity.detector`, `../lib/validation/consistency.validator`, `../lib/validation/fairness.validator`, `../lib/validation/consensus.engine` ... and 4 more
- **Consumers (1 files):** `src/tests/run-all-regressions.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0608: `src/tests/task5b-security-correctness-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task5b-security-correctness-verification.ts` (.ts, 19,620 bytes)
- **Primary Purpose:** Automated test suite verifying task5b-security-correctness-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `VerificationCheck`
- **Imports (8):** `../lib/validation/options.validator`, `../lib/validation/explanation.validator`, `../lib/services/question.service`, `../lib/services/question-validation.service`, `../lib/services/auth.service`, `../lib/repositories/validations.repository`, `../lib/repositories/questions.repository`, `../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0609: `src/tests/task6-telugu-script-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task6-telugu-script-verification.ts` (.ts, 12,827 bytes)
- **Primary Purpose:** Automated test suite verifying task6-telugu-script-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (7):** `../lib/repositories/questions.repository`, `../lib/repositories/videos.repository`, `../lib/repositories/scripts.repository`, `../lib/services/script.service`, `../lib/ai/gemini.service`, `../lib/ai/validators/script.validator`, `../types`
- **Consumers (1 files):** `src/tests/run-all-regressions.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: YES (@google/genai SDK)
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0610: `src/tests/task6b-provider-abstraction-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task6b-provider-abstraction-verification.ts` (.ts, 10,060 bytes)
- **Primary Purpose:** Automated test suite verifying task6b-provider-abstraction-verification
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (4):** `../lib/ai`, `../types`, `fs`, `path`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: YES (@google/genai SDK)
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0611: `src/tests/task6c-orchestrator-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task6c-orchestrator-verification.ts` (.ts, 15,538 bytes)
- **Primary Purpose:** Automated test suite verifying task6c-orchestrator-verification
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (6):** `../lib/ai/registry`, `../lib/ai/orchestrator`, `../lib/ai/testing/mock-provider`, `../types`, `fs`, `path`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: YES (@google/genai SDK)
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0612: `src/tests/task6d-validation-adapter-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task6d-validation-adapter-verification.ts` (.ts, 15,901 bytes)
- **Primary Purpose:** Automated test suite verifying task6d-validation-adapter-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (9):** `../lib/validation/gemini-validation.provider`, `../lib/validation/testing/mock-validation-provider`, `../lib/ai/gemini.client`, `../lib/validation/consensus.engine`, `../lib/validation/question-validation.engine`, `../lib/services/question-validation.service`, `../types`, `fs` ... and 1 more
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: YES (@google/genai SDK)
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: YES

---

## FILE-0613: `src/tests/task7-video-queue-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task7-video-queue-verification.ts` (.ts, 25,968 bytes)
- **Primary Purpose:** Automated test suite verifying task7-video-queue-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (11):** `../lib/services/video.service`, `../lib/services/question.service`, `../lib/services/taxonomy.service`, `../lib/services/workflow.service`, `../lib/services/audit.service`, `../lib/repositories/videos.repository`, `../lib/repositories/questions.repository`, `../lib/repositories/assignments.repository` ... and 3 more
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0614: `src/tests/task7b-unified-studio-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task7b-unified-studio-verification.ts` (.ts, 7,263 bytes)
- **Primary Purpose:** Automated test suite verifying task7b-unified-studio-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (8):** `../lib/repositories/questions.repository`, `../lib/repositories/content-masters.repository`, `../lib/services/audit.service`, `../lib/repositories/validations.repository`, `../lib/services/question-validation.service`, `../lib/validation/question-validation.engine`, `../lib/ai/validators/candidate.validator`, `../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: YES

---

## FILE-0615: `src/tests/task7c-question-studio-quality-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task7c-question-studio-quality-verification.ts` (.ts, 10,633 bytes)
- **Primary Purpose:** Automated test suite verifying task7c-question-studio-quality-verification
- **Workflow Participation:** 01 Question Generation (DIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `Task7CCheckResult`, `Task7CSuiteReport`
- **Imports (6):** `../lib/ai/validators/candidate.validator`, `../lib/ai/schemas/question-candidate.schema`, `../lib/validation/question-validation.engine`, `../lib/validation/options.validator`, `../config/question-creation.config`, `../types`
- **Consumers (1 files):** `src/tests/run-all-regressions.ts`
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0616: `src/tests/task8-publishing-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task8-publishing-verification.ts` (.ts, 26,225 bytes)
- **Primary Purpose:** Automated test suite verifying task8-publishing-verification
- **Workflow Participation:** 11 Published (DIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (16):** `../lib/services/publishing.service`, `../lib/services/video.service`, `../lib/services/question.service`, `../lib/services/taxonomy.service`, `../lib/services/thumbnail.service`, `../lib/services/pinned-comment.service`, `../lib/services/script.service`, `../lib/repositories/publishing.repository` ... and 8 more
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0617: `src/tests/task8b-social-content-foundation-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task8b-social-content-foundation-verification.ts` (.ts, 14,440 bytes)
- **Primary Purpose:** Automated test suite verifying task8b-social-content-foundation-verification
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `Task8BCheckResult`, `Task8BSuiteReport`
- **Imports (3):** `../types`, `../lib/validators/social-invariance.validator`, `../lib/services/social-enhancement.service`
- **Consumers (1 files):** `src/tests/run-all-regressions.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0618: `src/tests/task8c-hook-presentation-engine-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task8c-hook-presentation-engine-verification.ts` (.ts, 21,461 bytes)
- **Primary Purpose:** Automated test suite verifying task8c-hook-presentation-engine-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `Task8CCheckResult`, `Task8CVerificationReport`
- **Imports (6):** `../types`, `../lib/services/social-enhancement.service`, `../lib/validators/social-invariance.validator`, `../lib/ai/prompts/social-hook.prompt`, `../lib/ai/schemas/social-hook.schema`, `../lib/ai/gemini.service`
- **Consumers (1 files):** `src/tests/run-all-regressions.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: YES

---

## FILE-0619: `src/tests/task8d-teleprompter-spoken-enhancer-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task8d-teleprompter-spoken-enhancer-verification.ts` (.ts, 20,920 bytes)
- **Primary Purpose:** Automated test suite verifying task8d-teleprompter-spoken-enhancer-verification
- **Workflow Participation:** 04 Teleprompter & Filming (DIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `Task8DCheckResult`, `Task8DVerificationReport`
- **Imports (5):** `../types`, `../lib/services/social-enhancement.service`, `../lib/ai/prompts/teleprompter-script.prompt`, `../lib/ai/schemas/teleprompter-script.schema`, `../lib/ai/gemini.service`
- **Consumers (1 files):** `src/tests/run-all-regressions.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0620: `src/tests/task8e-social-metadata-generator-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task8e-social-metadata-generator-verification.ts` (.ts, 25,085 bytes)
- **Primary Purpose:** Automated test suite verifying task8e-social-metadata-generator-verification
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (3):** `VerificationCheckResult`, `SuiteVerificationReport`, `runTask8EVerificationSuite`
- **Imports (5):** `../types`, `../lib/services/social-enhancement.service`, `../lib/validators/social-invariance.validator`, `../lib/ai/gemini.service`, `../lib/ai/schemas/social-metadata.schema`
- **Consumers (1 files):** `src/tests/run-all-regressions.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: YES (@google/genai SDK)
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0621: `src/tests/task8f-multi-platform-adaptation-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task8f-multi-platform-adaptation-verification.ts` (.ts, 33,663 bytes)
- **Primary Purpose:** Automated test suite verifying task8f-multi-platform-adaptation-verification
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `VerificationCheckResult`, `SuiteVerificationReport`
- **Imports (4):** `../types`, `../lib/services/platform-adaptation.service`, `../lib/services/social-enhancement.service`, `../lib/validators/social-invariance.validator`
- **Consumers (1 files):** `src/tests/run-all-regressions.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0622: `src/tests/task8g-social-quality-engagement-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task8g-social-quality-engagement-verification.ts` (.ts, 46,002 bytes)
- **Primary Purpose:** Automated test suite verifying task8g-social-quality-engagement-verification
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (2):** `VerificationCheckResult`, `Task8GSuiteReport`
- **Imports (3):** `../types`, `../lib/services/social-quality.service`, `../lib/services/social-enhancement.service`
- **Consumers (1 files):** `src/tests/run-all-regressions.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0623: `src/tests/task8h-social-review-workflow-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task8h-social-review-workflow-verification.ts` (.ts, 32,021 bytes)
- **Primary Purpose:** Automated test suite verifying task8h-social-review-workflow-verification
- **Workflow Participation:** 09 Social Review (DIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `VerificationTestResult`
- **Imports (6):** `../lib/services/social-review.service`, `../lib/services/social-enhancement.service`, `../lib/repositories/social-reviews.repository`, `../lib/repositories/audit-log.repository`, `../lib/repositories/workflow.repository`, `../types`
- **Consumers (1 files):** `src/tests/run-all-regressions.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0624: `src/tests/task9-auth-verification.ts`

- **Directory:** `src/tests`
- **Filename:** `task9-auth-verification.ts` (.ts, 22,513 bytes)
- **Primary Purpose:** Automated test suite verifying task9-auth-verification
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (5):** `../lib/services/auth.service`, `../lib/repositories/users.repository`, `../lib/repositories/audit-log.repository`, `../server/middleware/auth.middleware`, `../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0625: `src/tests/test-isolation-safety-gate.test.ts`

- **Directory:** `src/tests`
- **Filename:** `test-isolation-safety-gate.test.ts` (.ts, 14,779 bytes)
- **Primary Purpose:** Automated test suite verifying test-isolation-safety-gate
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (5):** `../lib/google-sheets/client`, `../lib/google-sheets/errors`, `../lib/repositories/sequences.repository`, `../lib/repositories/analytics.repository`, `../lib/schemas/google-sheets-schema`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: YES (Worksheet Operations)
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0626: `src/tests/thumbnail-real-upload-workflow.test.ts`

- **Directory:** `src/tests`
- **Filename:** `thumbnail-real-upload-workflow.test.ts` (.ts, 21,957 bytes)
- **Primary Purpose:** Automated test suite verifying thumbnail-real-upload-workflow
- **Workflow Participation:** 08 Thumbnail (DIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (5):** `../lib/repositories`, `../lib/services/thumbnail.service`, `../lib/services/google-drive.service`, `../types`, `../lib/api-client`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0627: `src/tests/unified-question-creation.test.ts`

- **Directory:** `src/tests`
- **Filename:** `unified-question-creation.test.ts` (.ts, 12,745 bytes)
- **Primary Purpose:** Automated test suite verifying unified-question-creation
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (9):** `../lib/services/question.service`, `../lib/services/id.service`, `../lib/services/content-master.service`, `../lib/validation/multi-layer-verification.engine`, `../lib/services/taxonomy.service`, `../lib/services/smart-random.service`, `../lib/repositories/questions.repository`, `../lib/repositories/validations.repository` ... and 1 more
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: YES
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0628: `src/tests/verify-cleanup.ts`

- **Directory:** `src/tests`
- **Filename:** `verify-cleanup.ts` (.ts, 2,693 bytes)
- **Primary Purpose:** Automated test suite verifying verify-cleanup
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (17):** `../lib/repositories/questions.repository`, `../lib/repositories/content-masters.repository`, `../lib/repositories/videos.repository`, `../lib/repositories/scripts.repository`, `../lib/repositories/script-versions.repository`, `../lib/repositories/thumbnails.repository`, `../lib/repositories/thumbnail-versions.repository`, `../lib/repositories/pinned-comments.repository` ... and 9 more
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0629: `src/tests/verify-social-analytics-ui.ts`

- **Directory:** `src/tests`
- **Filename:** `verify-social-analytics-ui.ts` (.ts, 12,225 bytes)
- **Primary Purpose:** Automated test suite verifying verify-social-analytics-ui
- **Workflow Participation:** 13 Analytics (DIRECT)
- **Risk Level:** **LOW** (Test verification suite; executed in isolated memory or test sheets)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (5):** `../lib/services/content-master.service`, `../lib/repositories/content-masters.repository`, `../lib/services/analytics.service`, `../lib/repositories/analytics.repository`, `../types`
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0630: `src/types/index.ts`

- **Directory:** `src/types`
- **Filename:** `index.ts` (.ts, 88,808 bytes)
- **Primary Purpose:** TypeScript interfaces, workflow enums, and system types
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (209):** `QuestionStatus`, `QuestionValidationStatus`, `RenderValidationStatus`, `VideoProductionStatus`, `CanonicalProductionReadiness`, `DifficultyLevel`, `QuestionLanguage`, `PublishingPlatform`, `SocialPublishStatus`, `QuestionStyle` ... and 199 more
- **Imports (1):** `./phase24-ai`
- **Consumers (1 files):** `src/types/phase26-copilot.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: YES
  - Client / Route Involvement: NO

---

## FILE-0631: `src/types/phase24-ai.ts`

- **Directory:** `src/types`
- **Filename:** `phase24-ai.ts` (.ts, 3,309 bytes)
- **Primary Purpose:** TypeScript interfaces, workflow enums, and system types
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (14):** `AIProviderId`, `AITaskType`, `AIProviderHealthState`, `AIFailureCategory`, `AIGenerationSource`, `AIRetryPolicy`, `AIRateLimitState`, `AIProviderMetadata`, `AIRequest`, `AIAttemptDetail` ... and 4 more
- **Imports (0):** None
- **Consumers (21 files):** `src/lib/ai/phase24-orchestrator.service.ts`, `src/lib/ai/phase24-registry.ts`, `src/lib/ai/providers/base.adapter.ts`, `src/lib/ai/providers/cerebras.adapter.ts`, `src/lib/ai/providers/cohere.adapter.ts`, `src/lib/ai/providers/experimental-labs.adapter.ts`, `src/lib/ai/providers/gemini.adapter.ts`, `src/lib/ai/providers/groq.adapter.ts` ... and 13 more
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0632: `src/types/phase25-consensus.ts`

- **Directory:** `src/types`
- **Filename:** `phase25-consensus.ts` (.ts, 2,964 bytes)
- **Primary Purpose:** TypeScript interfaces, workflow enums, and system types
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (10):** `Phase25Verdict`, `Phase25ConsensusStatus`, `Phase25MathVerificationDetail`, `Phase25LanguageVerificationDetail`, `Phase25VerifierResult`, `Phase25ReconciliationResult`, `Phase25ConsensusProvenance`, `Phase25VerificationOptions`, `Phase25CandidateVerificationRequest`, `Phase25VerificationResponse`
- **Imports (2):** `./phase24-ai`, `../lib/ai/types`
- **Consumers (1 files):** `src/lib/services/phase25-consensus.service.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0633: `src/types/phase26-copilot.ts`

- **Directory:** `src/types`
- **Filename:** `phase26-copilot.ts` (.ts, 7,741 bytes)
- **Primary Purpose:** TypeScript interfaces, workflow enums, and system types
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (37):** `CopilotCapability`, `CopilotBaseSuggestion`, `NextTaskRecommendationData`, `QuestionImprovementData`, `DifficultyRecommendationData`, `ContextSuggestionItem`, `ContextSuggestionData`, `QuestionStyleSuggestionItem`, `QuestionStyleSuggestionData`, `ScriptSection` ... and 27 more
- **Imports (2):** `./phase24-ai`, `./index`
- **Consumers (1 files):** `src/lib/services/phase26-copilot.service.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0634: `src/utils/formatters.ts`

- **Directory:** `src/utils`
- **Filename:** `formatters.ts` (.ts, 3,993 bytes)
- **Primary Purpose:** Application utility or helper module
- **Workflow Participation:** Cross-Stage Workflow Coordinator (INDIRECT)
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (3):** `formatDisplayId`, `formatWorkflowStatusLabel`, `getVideoCanonicalStepUrl`
- **Imports (1):** `../types`
- **Consumers (4 files):** `src/components/production/ProductionKanban.tsx`, `src/components/production/ProductionTable.tsx`, `src/components/questions/QuestionTable.tsx`, `src/tests/phase11-legacy-ui-simplification-verification.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0635: `tsconfig.json`

- **Directory:** `.`
- **Filename:** `tsconfig.json` (.json, 508 bytes)
- **Primary Purpose:** TypeScript compiler and bundler resolution configuration
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Static documentation or data artifact; no active execution risk)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (0):** None
- **Imports (0):** None
- **Consumers (0 files):** CONSUMERS: NONE FOUND
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

## FILE-0636: `vite.config.ts`

- **Directory:** `.`
- **Filename:** `vite.config.ts` (.ts, 708 bytes)
- **Primary Purpose:** Vite SPA dev server and Tailwind v4 CSS bundler config
- **Workflow Participation:** NONE
- **Risk Level:** **LOW** (Isolated utility or configuration file)
- **Duplicate Classification:** NO DUPLICATE EVIDENCE
- **Legacy Classification:** CURRENT (Actively participates in current system architecture or active regression baseline)
- **Exports (1):** `default`
- **Imports (4):** `@tailwindcss/vite`, `@vitejs/plugin-react`, `path`, `vite`
- **Consumers (5 files):** `src/lib/ai/gemini.service.ts`, `src/lib/ai/orchestrator.ts`, `src/lib/ai/registry.ts`, `src/lib/ai/validators/blind-verifier.ts`, `src/lib/ai/validators/semantic-reasoning.provider.ts`
- **System Interactivity:**
  - HTTP / Express API: NO
  - Google Sheets API / DB: NO
  - Google Drive Binary / API: NO
  - Gemini / AI Orchestration: NO
  - RBAC & Safety Enforcement: NO
  - Client / Route Involvement: NO

---

