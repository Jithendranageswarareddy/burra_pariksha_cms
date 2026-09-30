# Cloud Run Baseline Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 03 — GitHub ↔ Google AI Studio ↔ Cloud Run Provenance  
**Audit Date:** 2026-09-28  
**Audit Mode:** Read-Only Forensic Analysis  

---

## 1. Cloud Run Control Plane Access Status

```
CLOUD RUN CONTROL PLANE ACCESS: NOT_ACCESSIBLE FROM CURRENT ENVIRONMENT
```

The sandboxed container lacks the `gcloud` CLI and GCP IAM service management credentials (`roles/run.admin`). However, container runtime environment variables expose precise Cloud Run execution parameters.

---

## 2. In-Container Cloud Run Deployment Parameters (Verified Facts)

| Runtime Parameter | Verified Value | Evidence Source | Classification |
| :--- | :--- | :--- | :--- |
| **Cloud Run Service Name (`K_SERVICE`)** | `ais-dev-fjjdmukiysol435fsvlcau` | Container `process.env.K_SERVICE` | CONFIRMED |
| **Cloud Run Revision Name (`K_REVISION`)** | `ais-dev-fjjdmukiysol435fsvlcau-00001-s2w` | Container `process.env.K_REVISION` | CONFIRMED |
| **Container Port (`PORT`)** | `8080` | Container `process.env.PORT` | CONFIRMED |
| **Ingress Proxy Port (`NGINX_PORT`)** | `8080` | Container `process.env.NGINX_PORT` | CONFIRMED |
| **Control Plane Port (`CONTROL_PLANE_PORT`)** | `8000` | Container `process.env.CONTROL_PLANE_PORT` | CONFIRMED |
| **Internal Node Server Port (`DEFAULT_APP_PORT`)**| `3000` | Container `process.env.DEFAULT_APP_PORT` | CONFIRMED |
| **Request Timeout (`CLOUD_RUN_TIMEOUT_SECONDS`)** | `3600` (1 Hour) | Container `process.env.CLOUD_RUN_TIMEOUT_SECONDS` | CONFIRMED |
| **Cloud Project Number** | `618687518096` | URL Metadata | CONFIRMED |
| **Cloud Region** | `asia-east1` | URL Metadata | CONFIRMED |
| **Development App URL** | `https://ais-dev-fjjdmukiysol435fsvlcau-618687518096.asia-east1.run.app` | System Context Metadata | CONFIRMED |
| **Shared App URL** | `https://ais-pre-fjjdmukiysol435fsvlcau-618687518096.asia-east1.run.app` | System Context Metadata | CONFIRMED |
| **Service Account Identity** | `burra-pariksha-cms@burra-pariksha-cms.iam.gserviceaccount.com` | Container `process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL` | CONFIRMED |

---

## 3. Production Cloud Run Separation Architecture

As documented in `AUTHENTICATION-REFRESH-TOKEN-FORENSIC-AUDIT.md` (Section 10):
- **Development Runtime:** Hosted on Cloud Run service `ais-dev-fjjdmukiysol435fsvlcau` running Express + Vite via `tsx` on Node 22.
- **Production Runtime Target:** Built via `Dockerfile` (`node:20-alpine`), compiling Vite to `dist/` and `server.ts` via esbuild to `dist/server.cjs`, running `CMD ["node", "dist/server.cjs"]`. Secrets are injected via GCP Secret Manager and Cloud Run Revision environment variables, completely isolated from AI Studio local settings.
