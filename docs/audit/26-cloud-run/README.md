# Step 26: Cloud Run / Deployment / Environment Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Document Type:** Forensic Deployment Audit  
**Phase:** Step 26 of 30  
**Status:** **AUTHORITATIVE AUDIT**  
**Date:** 2026-09-29  

---

## 1. Audit Scope & Executive Summary

This forensic audit examines the build pipelines, container specifications (`Dockerfile`), deployment mechanics, Google Cloud Run runtime parameters, container images, environment variables, secret management, IAM service accounts, networking, health checks, observability, and environment drift for the Burra Pariksha Content Management System (BP-CMS).

### Key Forensic Findings:
1. **Container Topology:** Full-stack unified container (`node:20-alpine`) hosting React 19 SPA static assets via Vite alongside Node.js 22 LTS Express API server listening on `PORT=3000` (or `PORT=8080` in Cloud Run container).
2. **Cloud Run Service:** Primary service `ais-dev-fjjdmukiysol435fsvlcau-618687518096` deployed in region `asia-east1` with development URL `https://ais-dev-fjjdmukiysol435fsvlcau-618687518096.asia-east1.run.app` and preview URL `https://ais-pre-fjjdmukiysol435fsvlcau-618687518096.asia-east1.run.app`.
3. **Build Pipeline:** Multi-stage Docker build utilizing `npm ci` and `esbuild server.ts --bundle --platform=node --format=cjs --packages=external --sourcemap --outfile=dist/server.cjs`.
4. **Filesystem Assumption:** Ephemeral container filesystem; all persistent tabular data routes to Google Sheets API v4 and media binaries to Google Drive API v3.
5. **Security & Secrets:** Runtime environment variables inject `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GEMINI_API_KEY`, and `SESSION_SECRET` directly into process memory without client-side exposure.

---

## 2. Document Catalog

- `cloud-run-service-inventory.md` — Active and historical Cloud Run service catalog
- `cloud-run-configuration.md` — CPU, memory, concurrency, timeout, and scaling configurations
- `live-revision.md` — Production revision inspection and immutable digest tracking
- `deployment-chain.md` — Source-to-Container-to-Cloud Run deployment trace
- `dockerfile-audit.md` — 2-stage multi-stage Docker build forensic analysis
- `environment-variable-audit.md` — Complete inventory of 14 runtime environment variables
- `secret-management.md` — Secret handling, OAuth tokens, and API key protection
- `service-account-iam.md` — Runtime compute service account and OAuth scope audit
- `storage.md` — Ephemeral container filesystem vs Google Drive binary storage
- `networking.md` — Ingress, CORS, custom domains, and HTTPS enforcement
- `frontend-backend-deployment.md` — Colocated frontend-backend Express static serving architecture
- `environment-drift.md` — Drift analysis across Local, AI Studio, GitHub, and Cloud Run
- `deployment-problem-register.md` — Classified deployment problem register (CRITICAL, HIGH, MEDIUM, LOW)
- `final-cloud-run-baseline.md` — Definitive 45-point Cloud Run deployment baseline
