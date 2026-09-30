# Cloud Run Baseline Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 01 — Repository & Environment Baseline  
**Audit Date:** 2026-09-28  
**Audit Mode:** Read-Only Forensic Inventory  

---

## 1. Cloud Run Control Plane Accessibility Status

```
CLOUD RUN CONTROL PLANE ACCESS STATUS: NOT_ACCESSIBLE FROM CURRENT ENVIRONMENT
```

### Forensic Justification:
1. **Absence of CLI Tooling:** Inspection of the container (`which gcloud`) confirms that the Google Cloud SDK (`gcloud`) CLI is not installed in the runtime environment.
2. **Absence of IAM Management Tokens:** The container environment does not contain GCP compute metadata tokens or credentials with IAM permissions (`roles/run.admin` or `roles/run.viewer`) to query the Cloud Run Admin API (`run.googleapis.com`).
3. **Audit Charter Compliance:** In accordance with the charter:
   - No GCP control plane requests were executed.
   - Zero deployments or container image pushes were performed.
   - Zero revisions, scaling rules, or traffic allocations were altered.

---

## 2. In-Container Cloud Run Runtime Parameters (Confirmed Facts)

Although the remote GCP management console is inaccessible, the container runtime environment injects standard Cloud Run runtime metadata, which was forensically verified directly via shell environment inspection:

| Parameter | Observed Value | Evidence Source | Classification |
| :--- | :--- | :--- | :--- |
| **Cloud Run Service Name (`K_SERVICE`)** | `ais-dev-fjjdmukiysol435fsvlcau` | Container `process.env` | CONFIRMED |
| **GCP Cloud Region** | `asia-east1` | System URL Metadata | CONFIRMED |
| **GCP Project Number** | `618687518096` | System URL Metadata | CONFIRMED |
| **Development App URL** | `https://ais-dev-fjjdmukiysol435fsvlcau-618687518096.asia-east1.run.app` | System URL Metadata | CONFIRMED |
| **Shared App URL** | `https://ais-pre-fjjdmukiysol435fsvlcau-618687518096.asia-east1.run.app` | System URL Metadata | CONFIRMED |
| **Internal Container Port (`PORT`)** | `8080` | Container `process.env` | CONFIRMED |
| **Container Ingress Port (`NGINX_PORT`)** | `8080` | Container `process.env` | CONFIRMED |
| **Node Server Internal Port (`DEFAULT_APP_PORT`)**| `3000` | Container `process.env` / `server.ts` | CONFIRMED |
| **Control Plane Port (`CONTROL_PLANE_PORT`)** | `8000` | Container `process.env` | CONFIRMED |
| **Cloud Run Request Timeout (`CLOUD_RUN_TIMEOUT_SECONDS`)** | `3600` (1 Hour) | Container `process.env` | CONFIRMED |
| **Container Node.js Engine** | `v22.23.2` | `process.version` | CONFIRMED |
| **Container V8 Heap Size Allocation (`NODE_OPTIONS`)** | `--max-old-space-size=3072` (3 GB) | Container `process.env` | CONFIRMED |
| **Container Operational Mode (`NODE_ENV`)** | `development` | Container `process.env` | CONFIRMED |

---

## 3. Production Deployment Container Specification (`Dockerfile`)

The repository includes a production-grade multi-stage `Dockerfile` tailored for Cloud Run deployment:
- **Build Stage:** `node:20-alpine AS builder` runs `npm ci` and `npm run build`. Compiles frontend SPA into `dist/` and bundles `server.ts` into CommonJS standalone runner `dist/server.cjs`.
- **Runtime Stage:** `node:20-alpine AS runner` installs production dependencies only (`npm ci --omit=dev`), sets `ENV NODE_ENV=production` and `ENV PORT=3000`, copies `dist/`, and exposes port `3000`.
- **Execution Target:** `CMD ["node", "dist/server.cjs"]`.

---

## 4. Cloud Run Ingress & Port Mapping Summary

Inside the development sandbox:
- Cloud Run exposes ingress at port `8080`.
- An internal reverse proxy directs client traffic to the Express server running on port `3000`.
- The Express server mounts `/api` routes directly and forwards web requests to Vite dev middleware (`vite.middlewares`), ensuring unified full-stack serving without CORS or multi-host routing.
