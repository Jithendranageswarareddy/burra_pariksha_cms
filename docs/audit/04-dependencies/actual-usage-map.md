# Actual Import & Usage Map

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 04 — Dependency & Package Forensic Audit  
**Audit Date:** 2026-09-28  

This document maps every declared external dependency to its importing files and usage frequency across the codebase:

| Package Name | Usage Category | Import Frequency | Primary Inbound Consumer Files |
| :--- | :--- | :---: | :--- |
| `@google/genai` | DIRECTLY USED | 7 files | `src/lib/ai/gemini.client.ts`, `src/lib/ai/providers/gemini.adapter.ts`, `src/lib/ai/schemas/comment-intelligence.schema.ts` ... + 4 more |
| `@tailwindcss/vite` | DIRECTLY USED | 1 files | `vite.config.ts` |
| `@vitejs/plugin-react` | DIRECTLY USED | 1 files | `vite.config.ts` |
| `busboy` | DIRECTLY USED | 1 files | `src/server/routes.ts` |
| `dotenv` | NO USAGE FOUND | 0 files | None (Referenced via config / script) |
| `express` | DIRECTLY USED | 3 files | `server.ts`, `src/server/middleware/auth.middleware.ts`, `src/tests/question-studio-config-integration.test.ts` |
| `express-rate-limit` | DIRECTLY USED | 1 files | `src/server/routes.ts` |
| `googleapis` | DIRECTLY USED | 21 files | `scripts/clean-audit-log.ts`, `scripts/comprehensive-audit.ts`, `scripts/execute-phase-2b.ts` ... + 18 more |
| `helmet` | DIRECTLY USED | 1 files | `src/server/routes.ts` |
| `lucide-react` | DIRECTLY USED | 98 files | `src/components/assignments/AssignmentBadge.tsx`, `src/components/assignments/AssignmentModal.tsx`, `src/components/assignments/EntityAssignmentsSection.tsx` ... + 95 more |
| `motion` | NO USAGE FOUND | 0 files | None (Referenced via config / script) |
| `react` | DIRECTLY USED | 47 files | `src/App.tsx`, `src/components/assignments/AssignmentBadge.tsx`, `src/components/common/Button.tsx` ... + 44 more |
| `react-dom` | DIRECTLY USED | 1 files | `src/main.tsx` |
| `react-router-dom` | DIRECTLY USED | 61 files | `src/App.tsx`, `src/components/dashboard/ChannelPerformanceSection.tsx`, `src/components/dashboard/ContinueProductionCard.tsx` ... + 58 more |
| `zod` | DIRECTLY USED | 12 files | `src/lib/ai/schemas/comment-intelligence.schema.ts`, `src/lib/ai/schemas/performance-intelligence.schema.ts`, `src/lib/ai/schemas/pinned-comment.schema.ts` ... + 9 more |
| `@types/busboy` | BUILD / TYPECHECK | 0 files | None (Referenced via config / script) |
| `@types/express` | BUILD / TYPECHECK | 0 files | None (Referenced via config / script) |
| `@types/node` | BUILD / TYPECHECK | 0 files | None (Referenced via config / script) |
| `@types/react` | BUILD / TYPECHECK | 0 files | None (Referenced via config / script) |
| `@types/react-dom` | BUILD / TYPECHECK | 0 files | None (Referenced via config / script) |
| `autoprefixer` | NO USAGE FOUND | 0 files | None (Referenced via config / script) |
| `esbuild` | CLI / BUILD SCRIPT | 0 files | None (Referenced via config / script) |
| `tailwindcss` | DIRECTLY USED | 1 files | `src/index.css` |
| `tsx` | CLI / BUILD SCRIPT | 0 files | None (Referenced via config / script) |
| `typescript` | CLI / BUILD SCRIPT | 0 files | None (Referenced via config / script) |
| `vite` | DIRECTLY USED | 2 files | `server.ts`, `vite.config.ts` |
