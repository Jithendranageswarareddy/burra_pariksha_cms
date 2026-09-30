# Dependency Consumer Map & Coupling Analysis

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 04 — Dependency & Package Forensic Audit  
**Audit Date:** 2026-09-28  

---

## 1. Direct Dependency Inbound Coupling Metrics

Ranked by number of distinct source files importing the package:

| Rank | Package Name | Inbound Importing Files | Primary Consumer Directories | Coupling Severity |
| :---: | :--- | :---: | :--- | :---: |
| 1 | `lucide-react` | **98** | `src/components/`, `src/pages/` | LOW (Pure presentation icons) |
| 2 | `react-router-dom` | **61** | `src/pages/`, `src/components/` | MEDIUM (Navigation & URL state) |
| 3 | `react` | **47** | `src/components/`, `src/pages/`, `src/contexts/` | CORE (Component lifecycle & hooks) |
| 4 | `googleapis` | **21** | `src/repositories/`, `src/services/` | CRITICAL (Primary data persistence) |
| 5 | `zod` | **12** | `src/validation/`, `src/services/` | HIGH (Data contracts & validation) |
| 6 | `@google/genai` | **7** | `src/services/ai/` | CRITICAL (Core intelligence features) |
| 7 | `express` | **3** | `server.ts`, `src/server/` | CRITICAL (HTTP application server) |
| 8 | `react-dom` | **1** | `src/main.tsx` | CORE (DOM mount root) |
| 9 | `busboy` | **1** | `server.ts` | HIGH (File upload streaming) |
| 10 | `helmet` | **1** | `server.ts` | MEDIUM (Security headers) |
| 11 | `express-rate-limit` | **1** | `server.ts` | MEDIUM (DDoS / brute force defense) |
| 12 | `@tailwindcss/vite` | **1** | `vite.config.ts` | BUILD (CSS engine plugin) |
| 13 | `@vitejs/plugin-react` | **1** | `vite.config.ts` | BUILD (React JSX compiler plugin) |
| 14 | `motion` | **0** | None | DEAD (Declared, unused) |
| 15 | `dotenv` | **0** | None | DEAD (Declared, unused) |

---

## 2. Directory Coupling Distribution

- **`src/components/`**: Heavy consumers of `lucide-react` (52 files), `react` (36 files), `react-router-dom` (28 files).
- **`src/pages/`**: Heavy consumers of `lucide-react` (28 files), `react-router-dom` (24 files), `react` (11 files).
- **`src/repositories/`**: Exclusive consumers of `googleapis` (16 files) for Google Sheets CRUD operations.
- **`src/services/ai/`**: Exclusive consumers of `@google/genai` (7 files) for Gemini multi-modal processing.
- **`src/validation/`**: Exclusive consumers of `zod` (12 files) for runtime schema enforcement.
