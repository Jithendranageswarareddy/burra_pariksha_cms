# Development Dependencies Forensic Dossiers

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 04 — Dependency & Package Forensic Audit  
**Audit Date:** 2026-09-28  

Audit of all **11 declared development dependencies** in `package.json` (`devDependencies`):

| Package | Declared Version | Resolved Version | Category | Direct Usage | Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `@types/busboy` | `^1.5.4` | `1.5.4` | TYPE DEFINITIONS | Used by tsc during lint/compile | TypeScript type definitions for busboy |
| `@types/express` | `^4.17.21` | `4.17.25` | TYPE DEFINITIONS | Used by tsc during lint/compile | TypeScript type definitions for express |
| `@types/node` | `^22.14.0` | `22.20.2` | TYPE DEFINITIONS | Used by tsc during lint/compile | TypeScript type definitions for node |
| `@types/react` | `^19.2.18` | `19.3.0` | TYPE DEFINITIONS | Used by tsc during lint/compile | TypeScript type definitions for react |
| `@types/react-dom` | `^19.2.5` | `19.3.0` | TYPE DEFINITIONS | Used by tsc during lint/compile | TypeScript type definitions for react-dom |
| `autoprefixer` | `^10.4.21` | `10.5.6` | STYLING (LEGACY) | NO USAGE FOUND (Tailwind v4 built-in) | CSS vendor prefixer |
| `esbuild` | `^0.25.0` | `0.25.12` | BUNDLER | Invoked by build script to bundle server.ts | High-performance JavaScript bundler |
| `tailwindcss` | `^4.1.14` | `4.3.3` | STYLING | Imported in src/index.css | Tailwind CSS v4 engine |
| `tsx` | `^4.21.0` | `4.23.13` | RUNNER / COMPILER | Invoked by dev script & test runners | Zero-compilation TypeScript Node execution engine |
| `typescript` | `~5.8.2` | `5.8.3` | COMPILER | Invoked by npm run lint (tsc --noEmit) | TypeScript language compiler |
| `vite` | `^6.2.3` | `6.4.3` | BUILD / DEV SERVER | Imported in server.ts & vite.config.ts | Frontend bundler & development server |
