# Dependency Differences: GitHub ↔ Google AI Studio ↔ Cloud Run

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 03 — GitHub ↔ Google AI Studio ↔ Cloud Run Provenance  
**Audit Date:** 2026-09-28  
**Audit Mode:** Read-Only Forensic Analysis  

---

## 1. Core Dependency Alignment

| Package Name | package.json Version | bun.lock Version | Dockerfile Target | Cloud Run Runtime Status |
| :--- | :--- | :--- | :--- | :--- |
| **`react`** | `^19.0.0` (resolves 19.0.1) | `19.0.1` | Built in builder stage | Bundled in `dist/assets/` |
| **`react-dom`** | `^19.0.0` (resolves 19.0.1) | `19.0.1` | Built in builder stage | Bundled in `dist/assets/` |
| **`react-router-dom`** | `^7.1.3` (resolves 7.18.2) | `7.18.2` | Built in builder stage | Bundled in `dist/assets/` |
| **`express`** | `^4.21.2` | `4.21.2` | Production dependency (`--omit=dev`) | Runtime dependency |
| **`@google/genai`** | `^2.4.0` | `2.4.0` | Production dependency (`--omit=dev`) | Runtime dependency |
| **`googleapis`** | `^176.0.0` | `176.0.0` | Production dependency (`--omit=dev`) | Runtime dependency |
| **`zod`** | `^4.4.3` | `4.4.3` | Production dependency (`--omit=dev`) | Runtime dependency |
| **`tailwindcss`** | `^4.0.0` (resolves 4.1.14) | `4.1.14` | Dev dependency (built via Vite) | Bundled into `dist/assets/index.css` |
| **`vite`** | `^6.0.5` (resolves 6.2.3) | `6.2.3` | Dev dependency (used in builder stage) | Dev server middleware in AI Studio |
| **`tsx`** | `^4.19.2` (resolves 4.21.0) | `4.21.0` | Dev dependency (not in prod runner) | Active dev runner in AI Studio |
| **`esbuild`** | `^0.25.0` | `0.25.0` | Dev dependency (builds server.ts) | Bundles `dist/server.cjs` |

---

## 2. Dependency Discrepancy Findings

1. **Lockfile Format:** The repository contains `bun.lock` (Bun format) but no `package-lock.json`. In the Dockerfile, `npm ci` is specified. When running `npm ci` without `package-lock.json`, npm will exit with an error or require `npm install`. This is a verified divergence between the local Bun lockfile and the npm-based container build.
2. **Version Pinning:** Core production dependencies (`@google/genai`, `googleapis`, `express`, `zod`) use caret semver ranges (`^`) in `package.json`, making a synchronized lockfile essential for reproducible builds across environments.
