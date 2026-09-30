# Application Entry-Points Baseline

**System:** Burra Pariksha Content Management System (BP-CMS)
**Audit Step:** 02 — Complete File-by-File Forensic Inventory
**Audit Date:** 2026-09-28

## Verified Runtime Entry Points

| Entry Point | Target Runtime | Command / Trigger | Consumers / Purpose |
| :--- | :--- | :--- | :--- |
| `server.ts` | Node.js Backend Server | `npm run dev` (`tsx server.ts`) / `node dist/server.cjs` | Express server bootstrap, Vite dev middleware mounting, API registration |
| `src/main.tsx` | Browser SPA Frontend | Loaded via `index.html` `<script type="module" src="/src/main.tsx">` | React 19 client bootstrap (`createRoot(document.getElementById("root"))`) |
| `src/App.tsx` | React Client Router | Rendered by `main.tsx` | Defines top-level router hierarchy, authentication guards, theme context |
| `src/server/routes.ts` | Backend API Gateway | Mounted in `server.ts` via `app.use("/api", createApiRouter())` | Master router dispatching requests to all domain services |
| `src/server/drive-routes.ts` | Drive Media Streaming | Mounted in `server.ts` via `app.use("/api/drive", createDriveRouter())` | Binary media streaming, partial content ranges, thumbnail downloads |
| `Dockerfile` | Cloud Run Container | `docker build .` | Multi-stage Node 20 container image specification |
| `run-stage8-runner.ts` | Root Test Runner | `npx tsx run-stage8-runner.ts` | Batch execution of Stage 8 continuous workflow tests |
| `run-phase9-runner.ts` | Root Test Runner | `npx tsx run-phase9-runner.ts` | Batch execution of Phase 9 publishing verification |
| `run-phase10-runner.ts` | Root Test Runner | `npx tsx run-phase10-runner.ts` | Batch execution of Phase 10 analytics verification |
