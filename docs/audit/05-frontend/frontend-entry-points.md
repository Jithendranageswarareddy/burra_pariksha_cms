# Frontend Root & Entry Points Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 05 — Frontend Architecture Forensic Audit  
**Audit Date:** 2026-09-28  

---

## 1. Primary Entry Point Identification

The application possesses a single, unambiguous frontend entry point:

### Entry Point Chain
```
index.html (Mount element: <div id="root"></div>)
   │
   ▼
src/main.tsx (createRoot DOM bootstrap)
   │
   ▼
src/App.tsx (Provider stack, auth gate, and client routing)
```

---

## 2. File-by-File Entry Point Dossiers

### `index.html`
- **Path:** `/index.html`
- **Purpose:** HTML5 document root and Vite module script host.
- **Title:** "BP-CMS - Burra Pariksha Content Management System"
- **Scripts:** `<script type="module" src="/src/main.tsx"></script>`
- **Mount Point:** `<div id="root"></div>`

### `src/main.tsx`
- **Path:** `src/main.tsx`
- **Total Lines:** 11 lines
- **Imports:**
  - `{ StrictMode } from "react"`
  - `{ createRoot } from "react-dom/client"`
  - `App from "./App.tsx"`
  - `"./index.css"` (Global Tailwind v4 styling)
- **Responsibilities:** Mounts `<App />` into `document.getElementById("root")` under React 19 `<StrictMode>`.
- **Side Effects:** Zero custom initialization, zero telemetry, zero service worker registration.

### `src/App.tsx`
- **Path:** `src/App.tsx`
- **Total Lines:** 210 lines
- **Provider Nesting Stack:**
  ```tsx
  <BrowserRouter>
    <AuthProvider>
      <ProductionJourneyProvider>
        <AppRoutes />
      </ProductionJourneyProvider>
    </AuthProvider>
  </BrowserRouter>
  ```
- **Auth Gate Behavior (`AppRoutes`):**
  1. Checks `const { user, isLoading } = useAuth()`.
  2. If `isLoading`: Renders full-screen spinning loader (`"Verifying team session..."`).
  3. If `!user`: Renders `<LoginPage />` (Unauthenticated state).
  4. If `user`: Computes `const landingRoute = getDefaultLandingRoute(user?.role)` and renders `<Routes>` wrapped in `<Layout />`.

---

## 3. Alternative / Competing Entry Points

- **Audit Finding:** **Zero alternative entry points.** There are no secondary HTML templates, micro-frontend mount scripts, or competing root files.
