# Provenance Graph

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 03 — GitHub ↔ Google AI Studio ↔ Cloud Run Provenance  
**Audit Date:** 2026-09-28  
**Audit Mode:** Read-Only Forensic Analysis  

---

## 1. Actual System Provenance Graph

```
                        GITHUB REMOTE (`main`)
                     [Jithendranageswarareddy/burra_pariksha_cms]
                                 │
                                 ├── Commit `dac93d9` (Common Ancestor)
                                 │     │
                   ┌─────────────┴─────┴─────────────┐
                   ▼                                 ▼
         REMOTE GITHUB BRANCH               LOCAL AI STUDIO WORKSPACE
         HEAD: `64c70c3` / `d510ef5`          HEAD: `d6bea6c`
         (Pushed Stage 7/9/10 commits)      (Implemented Stage 7-10 locally)
                   │                                 │
                   │                                 ▼
                   │                     AI STUDIO CONTAINER RUNTIME
                   │                     - tsx server.ts (Port 3000)
                   │                     - Vite Middleware Hot Reloading
                   │                     - In-Container Nginx Proxy (8080)
                   │                                 │
                   │                                 ▼
                   │                     DEV CLOUD RUN REVISION
                   │                     Service: ais-dev-fjjdmukiysol435fsvlcau
                   │                     Revision: ais-dev-...-00001-s2w
                   │                     Serving Live Traffic: 100%
                   │                                 │
                   ▼                                 ▼
     ┌─────────────────────────────────────────────────────────────┐
     │ HUMAN RECONCILIATION GATE (Before Step 30 Final Deployment)  │
     │ - Pull/Rebase local `d6bea6c` with remote GitHub `main`      │
     │ - Resolve 6 modified repositories/services                 │
     │ - Delete 3 legacy files on remote                           │
     │ - Push single unified release commit to GitHub              │
     └─────────────────────────────┬───────────────────────────────┘
                                   │
                                   ▼
                   PRODUCTION CLOUD RUN SERVICE
                   (Built via Dockerfile: node:20-alpine)
                   (Target: Pinned single-instance production app)
```
