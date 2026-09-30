# Complete Directory Inventory

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 01 — Repository & Environment Baseline  
**Audit Date:** 2026-09-28  
**Audit Mode:** Read-Only Forensic Audit  
**Total Directories Discovered:** 42 (including workspace root)

---

## Directory Catalog Table

| # | Directory Path | Parent Directory | Apparent Purpose | Major Contents | Category | Active Status | Legacy Assessment |
| :- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `.` | *(Root)* | Repository root container | Configs, Dockerfile, server.ts, README, 22 audit docs | ROOT | ACTIVE | Contains historical Phase markdown docs |
| 2 | `scripts` | `.` | Maintenance, verification, seed, and reset scripts | 22 TypeScript execution scripts | SCRIPT | ACTIVE | Several scripts represent past phase migrations/audits |
| 3 | `src` | `.` | Application root source tree | `App.tsx`, `main.tsx`, `index.css`, core modules | SOURCE | ACTIVE | Active codebase root |
| 4 | `src/components` | `src` | Domain UI React components | 9 sub-modules for domain features | COMPONENT | ACTIVE | Active UI tree |
| 5 | `src/components/assignments` | `src/components` | Specialist assignment and workboard UI | Task assignment dialogs, work queues, load indicators | COMPONENT | ACTIVE | Active (Phase 11–16) |
| 6 | `src/components/common` | `src/components` | Shared generic UI components | Navbar, sidebar, header, notifications, error boundaries | COMPONENT | ACTIVE | Active |
| 7 | `src/components/dashboard` | `src/components` | Dashboard metrics and activity feeds | Stat widgets, velocity cards, workload meters | COMPONENT | ACTIVE | Active |
| 8 | `src/components/layout` | `src/components` | Page shell layouts | App layout, sub-headers, navigation rails | COMPONENT | ACTIVE | Active |
| 9 | `src/components/production` | `src/components` | Production board and tracker widgets | Kanban cards, status tags, stage progression items | COMPONENT | ACTIVE | Active |
| 10 | `src/components/publishing` | `src/components` | Publishing hub and packaging UI | Multi-platform package previews, schedule drawers | COMPONENT | ACTIVE | Active (Phase 21–22) |
| 11 | `src/components/questions` | `src/components` | Question cards and preview components | Math formatting, Telugu rendering cards | COMPONENT | ACTIVE | Active |
| 12 | `src/components/queue` | `src/components` | Queue list controls | Bulk queue action bars | COMPONENT | ACTIVE | Active |
| 13 | `src/components/social` | `src/components` | Social media metrics and comment cards | Engagement monitors, sentiment badges | COMPONENT | ACTIVE | Active (Phase 27–30) |
| 14 | `src/components/video` | `src/components` | Video production UI controls | Media players, take selector, asset upload dropzones | COMPONENT | ACTIVE | Active (Phase 7, 14, 17) |
| 15 | `src/config` | `src` | Domain configuration files | Topic distributions, style config, snapshot config | CONFIGURATION | ACTIVE | Active |
| 16 | `src/contexts` | `src` | React context providers | `AuthContext.tsx`, `ThemeContext.tsx` | CONTEXT | ACTIVE | Active |
| 17 | `src/design-system` | `src` | Atomic design system tokens and types | Tokens, typography, color constants, types | COMPONENT | ACTIVE | Active (Unified in Phase 03) |
| 18 | `src/design-system/components` | `src/design-system` | Reusable atomic UI primitives | Button, Badge, Card, Modal, Input, EmptyState, etc. | COMPONENT | ACTIVE | Active |
| 19 | `src/lib` | `src` | Shared libraries and subsystems | Core business domain logic, AI, services, repos | SOURCE | ACTIVE | Active |
| 20 | `src/lib/ai` | `src/lib` | AI orchestration core | Gemini client, orchestrator, config, cost tracking | AI | ACTIVE | Active (Phase 7, 24–26) |
| 21 | `src/lib/ai/prompts` | `src/lib/ai` | Structured LLM prompt templates | Telugu question prompts, teleprompter, social prompts | AI | ACTIVE | Active |
| 22 | `src/lib/ai/providers` | `src/lib/ai` | Multi-LLM provider adaptors | Gemini, Groq, Mistral, Anthropic, OpenRouter adaptors | AI | ACTIVE | Active |
| 23 | `src/lib/ai/schemas` | `src/lib/ai` | Zod structured output schemas | 12 output validation schemas for LLM responses | SCHEMA | ACTIVE | Active |
| 24 | `src/lib/ai/testing` | `src/lib/ai` | AI evaluation and mock helpers | Mock provider fixtures | AI / TEST | ACTIVE | Test-only helper |
| 25 | `src/lib/ai/validators` | `src/lib/ai` | AI output semantic validation | Telugu linguistic and mathematical safety validators | VALIDATION | ACTIVE | Active |
| 26 | `src/lib/ai/verifier` | `src/lib/ai` | Multi-layer AI verification engine | Cross-model consensus and verification orchestrator | AI | ACTIVE | Active |
| 27 | `src/lib/google-sheets` | `src/lib` | Google Sheets database driver | Rate-limited client, exponential backoff, error types | DATABASE | ACTIVE | Active |
| 28 | `src/lib/mock-data` | `src/lib` | Development fallback datasets | Fallback questions, taxonomy, users, configurations | MODEL | ACTIVE | Active / Fallback |
| 29 | `src/lib/ownership` | `src/lib` | Data ownership & RBAC safety matrix | Operation permissions, deletion gates, role matrices | RBAC | ACTIVE | Active (Phase 7/12) |
| 30 | `src/lib/repositories` | `src/lib` | Persistent entity repository layer | 39 repositories wrapping Google Sheets & in-memory caches | REPOSITORY | ACTIVE | Active (Contains some phase-prefixed variants) |
| 31 | `src/lib/schemas` | `src/lib` | Core database schema definition | `google-sheets-schema.ts` defining all 25 worksheets | SCHEMA | ACTIVE | Active |
| 32 | `src/lib/services` | `src/lib` | Domain business logic services | 71 service singletons managing lifecycle state | SERVICE | ACTIVE | Active (Contains several phase-specific services) |
| 33 | `src/lib/validation` | `src/lib` | Question verification engines | Math safety gates, Telugu grammar, option checkers | VALIDATION | ACTIVE | Active |
| 34 | `src/lib/validation/testing` | `src/lib/validation` | Test assertion helpers for validation | Validation test harnesses | VALIDATION / TEST | ACTIVE | Test-only helper |
| 35 | `src/lib/validators` | `src/lib` | Entity field and state transition validators | Question, video, script, and transition validators | VALIDATION | ACTIVE | Active |
| 36 | `src/lib/workflow` | `src/lib` | Workflow state transition engine | Canonical 15-stage workflow state coordinator | WORKFLOW | ACTIVE | Active |
| 37 | `src/pages` | `src` | Routed screen page views | 31 page components (QuestionStudio, VideoDetailPage, etc.) | PAGE | ACTIVE | Active (Some older/simpler page variants exist) |
| 38 | `src/server` | `src` | Express server route definitions | API route handlers, Google Drive streaming endpoints | API | ACTIVE | Active |
| 39 | `src/server/middleware` | `src/server` | Express middleware | `auth.middleware.ts` for session and RBAC gating | API / AUTH | ACTIVE | Active |
| 40 | `src/tests` | `src` | Automated test suite | 249 test files covering regression, e2e, phase specs | TEST | ACTIVE | Comprehensive regression baseline |
| 41 | `src/types` | `src` | Global TypeScript declarations | Core entity interfaces, enums, workflow state types | TYPE_DEFINITION | ACTIVE | Active |
| 42 | `src/utils` | `src` | General utility functions | `formatters.ts` date, number, Telugu formatting | UTILITY | ACTIVE | Active |

---

## Notes on Directory Boundaries & Convergence

1. **Phase-Specific Legacy Directories:** While all directories are currently active, certain directories exhibit naming remnants of incremental build phases (e.g. `src/lib/ai/schemas`, `src/types/phase24-ai.ts`, `src/types/phase25-consensus.ts`, `src/types/phase26-copilot.ts`).
2. **Component Granularity:** UI components are well-isolated into functional domains under `src/components/`, while atomic UI building blocks are isolated under `src/design-system/components/`.
3. **Repository Depth:** The persistence layer (`src/lib/repositories/`) is flat with 39 repositories corresponding to the 25 operational and reference worksheets in Google Sheets, plus specialized helper caches.
