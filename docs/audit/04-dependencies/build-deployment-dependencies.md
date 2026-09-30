# Build & Deployment Dependencies Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 04 — Dependency & Package Forensic Audit  
**Audit Date:** 2026-09-28  
**Audit Mode:** Read-Only Forensic Analysis  

---

## 1. Build Pipeline Dependencies

| Package Name | Declared Version | Resolved Version | Pipeline Stage | Operational Function |
| :--- | :--- | :--- | :--- | :--- |
| **`vite`** | `^6.0.5` | `6.4.3` | Dev Server / Build | Client SPA compilation, dev server middleware |
| **`@vitejs/plugin-react`** | `^5.0.0` | `5.2.0` | Client Build | React 19 JSX compilation and Fast Refresh |
| **`@tailwindcss/vite`** | `^4.0.0` | `4.3.3` | Client Build | Vite plugin bundling Tailwind CSS v4 |
| **`tailwindcss`** | `^4.0.0` | `4.3.3` | Client Build | Core Tailwind CSS v4 engine |
| **`esbuild`** | `^0.25.0` | `0.25.12` | Server Build | Bundles `server.ts` into standalone CommonJS binary `dist/server.cjs` |
| **`tsx`** | `^4.19.2` | `4.23.13` | Dev Server / Tests | Zero-compilation TypeScript execution engine for dev and test runners |
| **`typescript`** | `^5.8.2` | `5.8.3` | Verification | Static type checker (`tsc --noEmit` in `npm run lint`) |

---

## 2. Dockerfile & Production Container Deployment

- **Builder Stage (`node:20-alpine`):**
  - Executes `npm run build` (`vite build` + `esbuild`).
  - Output artifacts: `dist/assets/*` and `dist/server.cjs`.
- **Runner Stage (`node:20-alpine`):**
  - Installs production-only dependencies: `npm ci --omit=dev`.
  - Copies compiled `dist/`.
  - Exposes port 3000, running `node dist/server.cjs`.
