# SDLC Pre-Gate: 08 — Normalization Risks & Mitigations

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Document Type:** Risk Register & Mitigation Strategy  
**Status:** **AUTHORITATIVE ANALYSIS**  
**Date:** 2026-09-29  

---

## 1. Normalization Risk Register

| Risk ID | Risk Description | Severity | Likelihood | Mitigation Strategy |
| :--- | :--- | :---: | :---: | :--- |
| **RSK-NORM-01** | Broken relative imports from file renaming | **HIGH** | LOW | Use barrel re-exports (`index.ts`) and TypeScript compiler verification (`tsc --noEmit`) before committing. |
| **RSK-NORM-02** | Broken npm scripts in automated environments | **MEDIUM** | LOW | Retain existing `test:phaseXX` scripts as backward-compatible aliases in `package.json`. |
| **RSK-NORM-03** | Loss of historical audit traceability | **MEDIUM** | LOW | Strictly preserve `docs/audit/` step designations while applying professional terminology to `docs/sdlc/`. |
| **RSK-NORM-04** | Accidental mutation of Google Sheets or Drive | **CRITICAL**| NONE | Zero data or API endpoint changes executed during normalization; strict read-only operation. |
| **RSK-NORM-05** | Production Cloud Run build failure | **HIGH** | NONE | Full `npm run build` executed to verify Vite bundle and `dist/server.cjs` esbuild compilation. |
