# Repository Terminology Cleanup: 05 — Dead File Candidates & Isolation

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Document Type:** Dead File & Legacy Artifact Analysis  
**Status:** **AUTHORITATIVE AUDIT**  
**Date:** 2026-09-29  

---

## 1. Dead File & Legacy Artifact Audit

| Artifact Path | Type | Reason for Retention / Isolation | Safety Assessment |
| :--- | :--- | :--- | :--- |
| `scripts/clean-audit-log.ts` | Historical Tool | One-time maintenance tool; not executed during normal builds. | **SAFE (ISOLATED)** |
| `scripts/restore-sequences-phase-e.ts` | Historical Tool | Historical sequence restore tool; isolated from runtime. | **SAFE (ISOLATED)** |
| `src/tests/parse-audit-calls.ts` | Test Helper | Static AST parsing helper used in test audits. | **SAFE (RETAINED)** |
| `src/tests/find-context.ts` | Test Helper | Helper utility for test debugging. | **SAFE (RETAINED)** |

---

## 2. Retention Rule

In accordance with strict SDLC safety protocols, no production files or database records were deleted. Operational scripts are cataloged and isolated from the primary runtime commands (`dev`, `build`, `start`, `test:all`).
