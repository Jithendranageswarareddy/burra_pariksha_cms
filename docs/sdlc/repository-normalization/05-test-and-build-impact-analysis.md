# SDLC Pre-Gate: 05 — Test & Build Impact Analysis

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Document Type:** Build & Test Integrity Analysis  
**Status:** **AUTHORITATIVE ANALYSIS**  
**Date:** 2026-09-29  

---

## 1. Build Verification Pipeline

The BP-CMS build pipeline consists of two compilation stages defined in `package.json` (`"build": "vite build && esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs"`):
1. **Frontend Compilation (Vite + React 19 + TypeScript):** Emits static assets into `dist/`.
2. **Backend Compilation (esbuild + Node.js 22):** Bundles `server.ts` into `dist/server.cjs`.

### Build Invariants:
- All path aliases (`@/` resolving to `./src`) must remain intact in `vite.config.ts` and `tsconfig.json`.
- Type checking (`npm run lint` / `tsc --noEmit`) must complete with 0 errors.

---

## 2. Test Execution Safety & Coverage

- **Active Unit & Regression Tests:** Core regression test suites (`stage01-draft-workflow-separation.test.ts`, `stage02-video-transitions.test.ts`, `canonical-sequence-parsing.test.ts`, `d01-concurrency-protection.test.ts`) are preserved and executed.
- **Legacy Phase Test Scripts:** Preserved in `src/tests/` to prevent breaking existing npm scripts, but documented as legacy regression fixtures.
- **Production Safety:** Tests with live Google Sheets/Drive mutation risks remain gated with `SKIP_SHEETS_SYNC=true` to prevent polluting production data.
