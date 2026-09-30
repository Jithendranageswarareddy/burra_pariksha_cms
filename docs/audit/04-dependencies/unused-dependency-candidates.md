# Unused Dependency Candidates Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 04 — Dependency & Package Forensic Audit  
**Audit Date:** 2026-09-28  
**Audit Mode:** Read-Only Forensic Analysis  

---

## 1. Candidate Identification

Based on comprehensive AST analysis across all 608 source, test, script, and config files:

| Package Name | Manifest Declaration | Resolved Version | Classification | Forensic Evidence |
| :--- | :--- | :--- | :--- | :--- |
| **`motion`** | `dependencies` (`^12.4.7`) | `12.43.0` | **STRONG UNUSED CANDIDATE** | 0 imports found across entire repository (`grep -rn "motion"` yields 0 import matches). UI animations rely on standard CSS/Tailwind transitions. |
| **`dotenv`** | `dependencies` (`^16.4.7`) | `17.4.2` | **STRONG UNUSED CANDIDATE** | 0 imports found across codebase (`dotenv` is not imported in `server.ts` or scripts). Environment variables are injected directly by the runtime container or tsx. |
| **`autoprefixer`** | `devDependencies` (`^10.4.21`) | `10.5.6` | **STRONG UNUSED CANDIDATE** | 0 imports found. No `postcss.config.js` exists. Tailwind CSS v4 utilizes `@tailwindcss/vite` with built-in prefixing, rendering autoprefixer obsolete. |

---

## 2. Charter Compliance Statement
In strict adherence to the audit charter, **no packages have been removed or modified**. These candidates are recorded solely as architectural audit observations for future optimization.
