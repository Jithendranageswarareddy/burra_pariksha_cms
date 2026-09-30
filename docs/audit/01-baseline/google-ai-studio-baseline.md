# Google AI Studio Baseline

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 01 — Repository & Environment Baseline  
**Audit Date:** 2026-09-28  
**Audit Mode:** Read-Only Forensic Inventory  

---

## 1. Platform Identity & Metadata

- **Platform Target:** Google AI Studio Applet Runtime
- **Applet ID:** `f592ca42-39af-4d83-aff2-6870ba939b0e`
- **Application Name:** Burra Pariksha CMS (configured in `metadata.json`)
- **Application Description:** "Content database and video production management system for the Burra Pariksha aptitude content channel."
- **Configured Permissions:** `requestFramePermissions: []`
- **Configured Capabilities:** `["MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API"]`
- **Platform Development URL:** `https://ais-dev-fjjdmukiysol435fsvlcau-618687518096.asia-east1.run.app`
- **Platform Preview / Shared URL:** `https://ais-pre-fjjdmukiysol435fsvlcau-618687518096.asia-east1.run.app`
- **Cloud Project Number:** `618687518096`
- **Cloud Region:** `asia-east1`

---

## 2. Full-Stack Application Architecture in AI Studio

The application is implemented as an integrated full-stack React SPA + Express server mounted within a single Node.js runtime process:

```
                          AI Studio Ingress (Port 8080)
                                      │
                                      ▼
                        Express Server (`server.ts`, Port 3000)
                                      │
               ┌──────────────────────┴──────────────────────┐
               ▼                                             ▼
       API Router (`/api`)                         Vite Middleware
      (src/server/routes.ts)                     (Development SPA Serving)
               │                                             │
      ┌────────┼────────┐                                    ▼
      ▼        ▼        ▼                           React 19 Frontend
  Services   Repos   Drive Routes                   (src/App.tsx, src/pages/*)
```

### A. Server Entry Point (`server.ts`)
- Configures Express with `trust proxy: 1`
- Logs Google Drive OAuth integration status
- Initializes the background snapshot scheduler (`snapshotSchedulerService.startScheduler()`)
- Preloads cached user identities into memory from Google Sheets
- Mounts `/api` Express router before static/Vite middleware
- In Development (`NODE_ENV !== 'production'`): Creates Vite server in middleware mode (`appType: 'spa'`) and mounts `vite.middlewares`
- In Production: Serves static compiled files from `dist/` and falls back to `dist/index.html` for SPA client-side routing

### B. Client Entry Point (`index.html` & `src/main.tsx`)
- `index.html` serves as the SPA shell, loading Google Fonts (`Noto Sans Telugu`, `Outfit`) and mounting `<div id="root">`
- `src/main.tsx` renders `<App />` into the DOM root using React 19's `createRoot`

### C. Client Routing & Pages (`src/App.tsx` & `src/pages/`)
- Uses React Router v7 (`BrowserRouter`, `Routes`, `Route`, `Navigate`)
- Implements 31 distinct full-screen pages
- Protected routes guarded by `AuthContext` (`ProtectedRoute`, `AdminRoute`, role-specific checks)

---

## 3. Google AI Studio Performance & Environment Tweaks

1. **HMR Disabling (`DISABLE_HMR=true`):**
   In `vite.config.ts`, Hot Module Replacement is controlled via `process.env.DISABLE_HMR`. In AI Studio agent editing mode, file watching is set to `null` to conserve container CPU and prevent DOM flickering during sequential file edits.
2. **Memory Allocation:**
   Container runtime supplies `NODE_OPTIONS=--max-old-space-size=3072`, giving the Node.js process 3GB of V8 heap space to handle Vite compilation and Google API streaming simultaneously.
3. **Execution Command:**
   The development server is started via `"dev": "tsx server.ts"`, enabling seamless zero-compilation TypeScript execution for both backend routes and Vite dev server.

---

## 4. AI Studio Integrations & Grounding

The applet declares `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API` in `metadata.json`. The backend integrates `@google/genai` (SDK v2.4.0) via `src/lib/ai/gemini.client.ts`, executing all Gemini model calls on the server side (`src/server/routes.ts`) rather than in client-side React code. This keeps API keys and model parameters strictly on the backend.
