# Dependency Version Conflicts & Range Discrepancies

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 04 — Dependency & Package Forensic Audit  
**Audit Date:** 2026-09-28  
**Audit Mode:** Read-Only Forensic Analysis  

---

## 1. Declared Caret Range vs Resolved Version Discrepancies

| Package Name | package.json Range | Resolved in node_modules | Discrepancy Note |
| :--- | :--- | :--- | :--- |
| **`zod`** | `^3.24.1` | `4.6.2` | **MAJOR VERSION RESOLUTION SHIFT:** `package.json` specifies `^3.24.1` (v3 range), but lockfile / node_modules resolved to `4.6.2` (v4). The codebase uses Zod 4 syntax without errors. |
| **`lucide-react`** | `^1.16.0` | `0.546.0` | **VERSION NOTATION DIVERGENCE:** Declared as `^1.16.0`, resolved as `0.546.0`. Lucide React official releases follow `0.x.x` semantic versioning. |
| **`express-rate-limit`**| `^7.5.0` | `8.7.0` | Resolved to v8 major release. |
| **`dotenv`** | `^16.4.7` | `17.4.2` | Resolved to v17 major release (Unused package). |

---

## 2. Risk Evaluation
The major version shift in `zod` (v3 to v4) is currently functioning properly without syntax failures (`tsc --noEmit` passes with 0 diagnostics). However, freezing this resolution in a committed `package-lock.json` is recommended for repeatable production deployments.
