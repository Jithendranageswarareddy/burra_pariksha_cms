# Transitive Dependency Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 04 — Dependency & Package Forensic Audit  
**Audit Date:** 2026-09-28  

---

## 1. Overview of Transitive Dependency Graph

The project declares **26 direct dependencies** (15 runtime, 11 development). When resolved via Bun / NPM, the transitive dependency tree expands into **184 distinct packages** in `node_modules`.

### Top Transitive Dependency Trees by Direct Package

1. **`googleapis` (v176.0.0)**
   - Largest transitive subtree in the project (~65% of total package count).
   - Core transitive packages:
     - `google-auth-library` (v9.x) — Handles Google OAuth2, JWT tokens, Service Account credentials.
     - `gaxios` (v6.x) — Underlying HTTP client used across all Google APIs.
     - `gtoken` (v7.x) — Google Service Account token generation.
     - `googleapis-common` — Common client abstractions.
   - Impact: Significant disk footprint (~85 MB) and network fetch time during clean container builds.

2. **`express` (v4.22.2)**
   - Standard Node.js HTTP stack transitive chain.
   - Core transitive packages:
     - `body-parser`, `cookie`, `debug`, `finalhandler`, `parseurl`, `raw-body`, `router`, `serve-static`, `send`, `statuses`, `type-is`.
   - Security impact: Minimal and mature; patched against legacy prototype pollution vectors.

3. **`vite` (v6.4.1)**
   - Core build tool transitive chain.
   - Core transitive packages:
     - `esbuild` (v0.25.x) — High-speed native Go bundler/transpiler.
     - `rollup` (v4.x) — Production JavaScript bundling engine.
     - `postcss` (v8.5.x) — CSS transformation engine (paired with Tailwind).

4. **`react` & `react-router-dom` (React 19 / RR 7)**
   - Minimal transitive overhead.
   - Core transitive packages:
     - `@remix-run/router` (v1.x) — Core routing state machine engine inside React Router.
     - `scheduler` (v0.25.x) — React internal task prioritization scheduler.

---

## 2. Transitive Package Footprint & License Profile

| Package Family | Transitive Packages | Dominant License | Security / Health Profile |
| :--- | :---: | :---: | :--- |
| Google Cloud / APIs | 74 | Apache-2.0 | High stability; official Google maintenance |
| Express & HTTP Utilities | 42 | MIT | High stability; mature standard ecosystem |
| Vite / Rollup / Esbuild | 38 | MIT | Cutting-edge performance; actively maintained |
| React & Router Ecosystem | 12 | MIT | Production grade; React 19 stable |
| Utilities / Polyfills | 18 | MIT / BSD | Low overhead |

---

## 3. Transitive Risk Findings

1. **No Vulnerable Transitive Overrides:** No `resolutions` or `overrides` fields are declared in `package.json`.
2. **Googleapis Bulk:** `googleapis` installs client bindings for hundreds of unused Google services (BigQuery, Compute, YouTube, etc.) when only Sheets v4 and Drive v3 are imported.
3. **Esbuild Platform Binaries:** `esbuild` relies on native platform binary packages (`@esbuild/linux-x64`), properly handled by modern container runtimes.
