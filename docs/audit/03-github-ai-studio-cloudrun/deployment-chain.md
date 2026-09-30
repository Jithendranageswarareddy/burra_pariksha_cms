# Deployment Chain Analysis

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 03 — GitHub ↔ Google AI Studio ↔ Cloud Run Provenance  
**Audit Date:** 2026-09-28  
**Audit Mode:** Read-Only Forensic Analysis  

---

## 1. Verified Development Deployment Chain (Google AI Studio)

The active development environment operates on an integrated Google AI Studio Cloud Run platform pipeline:

```
Developer Code Edits in Workspace (/app/applet)
                    │
                    ▼
Live Process Execution via `tsx server.ts` (Port 3000)
                    │
                    ├── Express Server mounts /api endpoints
                    └── Vite Server (Middleware Mode) compiles and serves React frontend
                    │
                    ▼
In-Container Reverse Proxy (Nginx on Port 8080)
                    │
                    ▼
Cloud Run Service (`ais-dev-fjjdmukiysol435fsvlcau`, Revision: `ais-dev-fjjdmukiysol435fsvlcau-00001-s2w`)
                    │
                    ▼
Development URL: https://ais-dev-fjjdmukiysol435fsvlcau-618687518096.asia-east1.run.app
```

---

## 2. Verified Production Deployment Target Pipeline (Dockerfile)

For standalone production hosting, the repository defines a containerized pipeline:

```
GitHub `main` Commit (`Jithendranageswarareddy/burra_pariksha_cms`)
                    │
                    ▼
Google Cloud Build / Docker Multi-Stage Build
                    │
                    ├── Stage 1: builder (node:20-alpine)
                    │     - npm run build
                    │     - vite build (Frontend SPA -> dist/)
                    │     - esbuild server.ts (Backend -> dist/server.cjs)
                    │
                    └── Stage 2: runner (node:20-alpine)
                          - npm ci --omit=dev
                          - COPY --from=builder /app/dist ./dist
                          - ENV NODE_ENV=production, PORT=3000
                          - CMD ["node", "dist/server.cjs"]
                    │
                    ▼
Google Artifact Registry (Container Image Digest)
                    │
                    ▼
Google Cloud Run Production Service
                    │
                    ▼
Live Production Traffic (Single-instance concurrency pinned)
```

---

## 3. Trigger & Deployment Automation

- **Development Updates:** Continuous in-container execution via tsx. Changes in `/app/applet` take effect immediately without redeployment.
- **Production Updates:** Manual or GitHub Actions triggered build to Cloud Run. No active GitHub Actions workflow file (`.github/workflows/`) was discovered in the repository root, indicating production deployment is triggered via Cloud Build or manual `gcloud run deploy`.
