# Architecture Dependency Graph & Topology

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 04 — Dependency & Package Forensic Audit  
**Audit Date:** 2026-09-28  

---

## 1. Top-Level Architectural Dependency Hierarchy

The codebase exhibits a strict unidirectional dependency layering:

```
[ FRONTEND LAYER ]
  │
  ├─ UI Components & Icons: lucide-react (98 files)
  ├─ Rendering & Lifecycle: react, react-dom (47 files)
  ├─ Routing & Navigation:  react-router-dom (61 files)
  └─ Schema Validation:     zod (12 files)
         │
         ▼
[ SERVER & ROUTING LAYER ]
  │
  ├─ Application Server:    express (3 files: server.ts, routes)
  ├─ Security Middleware:   helmet, express-rate-limit (server.ts)
  ├─ Multipart Parser:      busboy (server.ts for video upload stream)
  └─ Local Dev Serving:     vite (dev middleware integration)
         │
         ▼
[ CORE SERVICE & LOGIC LAYER ]
  │
  ├─ AI Generation Engine:  @google/genai (7 files: gemini adapters)
  ├─ Schema & Formats:      zod (12 files: validation schemas)
  └─ In-Memory / Auth:      Custom token hashing & session management
         │
         ▼
[ DATA & INFRASTRUCTURE LAYER ]
  │
  ├─ Primary Datastore:     googleapis (21 files: Sheets API v4)
  └─ Media Storage:         googleapis (21 files: Drive API v3)
         │
         ▼
[ TOOLING & BUILD LAYER ]
  │
  ├─ Bundler / Dev Server:  vite, @vitejs/plugin-react, @tailwindcss/vite
  ├─ Transpilation Engine:  tsx, typescript, @types/*
  └─ CSS Styling Engine:    tailwindcss
```

---

## 2. Layering Integrity & Coupling Observations

1. **Clean Separation of Frontend & Google APIs:**
   - No frontend file under `src/pages/` or `src/components/` directly imports `googleapis` or `@google/genai`.
   - All Google APIs and AI SDKs are isolated to `src/services/`, `src/repositories/`, and `server.ts`.

2. **Frontend UI Coupling:**
   - `lucide-react` is the most widely imported 3rd-party library (98 components).
   - `react-router-dom` provides all routing hooks (`useNavigate`, `useParams`, `useLocation`, `Link`).

3. **Backend Middleware Integration:**
   - `helmet`, `express-rate-limit`, and `busboy` are concentrated in `server.ts` without scattering across child routes.
