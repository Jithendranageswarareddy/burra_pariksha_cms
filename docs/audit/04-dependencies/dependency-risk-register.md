# Dependency Risk Register & Forensic Triage

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 04 — Dependency & Package Forensic Audit  
**Audit Date:** 2026-09-28  

---

## 1. Identified Dependency Risks & Anomalies

| ID | Package / Area | Severity | Risk Classification | Evidence / Description | Mitigation Phase |
| :---: | :--- | :---: | :--- | :--- | :---: |
| **DR-01** | `bun.lock` vs `npm ci` | **HIGH** | Package Manager Divergence | Repository uses `bun.lock` locally, but `Dockerfile` calls `npm ci` (requires `package-lock.json`). | Target Architecture |
| **DR-02** | `googleapis` Bulk Import | **MEDIUM** | Disk & Memory Bloat | Installs monolithic v176.0.0 package (~85 MB) instead of scoped `@googleapis/sheets` and `@googleapis/drive`. | Refactoring Phase |
| **DR-03** | Unused Runtime Packages | **LOW** | Dead Code in Production | `motion` (^12.23.24) and `dotenv` (^17.2.3) have 0 imports in application source. | Cleanup Phase |
| **DR-04** | Unused Dev Packages | **LOW** | Dead Tooling | `autoprefixer` (^10.4.21) has 0 references; Tailwind v4 utilizes built-in lightningcss. | Cleanup Phase |
| **DR-05** | Build Plugins in Runtime | **LOW** | Dependency Placement | `@tailwindcss/vite` and `@vitejs/plugin-react` are in `dependencies` rather than `devDependencies`. | Normalization Phase |
| **DR-06** | Caret Range Version Drift | **LOW** | Floating Minor Versions | 25 of 26 packages declare `^` (caret) ranges rather than strict pinned versions. | Hardening Phase |

---

## 2. Security Vulnerability Scan Summary

- Audit of package CVE registries: No known critical remote code execution (RCE) or prototype pollution vulnerabilities found in declared packages (`express` 4.21+, `helmet` 8.3+, `zod` 4.4+).
- Auth token handling uses in-memory / cryptographic hashing rather than deprecated external JWT packages.
