# BURRA PARIKSHA CMS — STAGE 7: PHASE 8
# LEGACY REMOVAL IMPLEMENTATION REPORT

## 1. Phase Objective
Phase 8 removes obsolete, deprecated, duplicate, superseded, unreachable, or compatibility-only implementation artifacts that have been safely migrated to the canonical architecture established in Stage 6 / Phases 1–7.

The overarching goal is **ONE ACTIVE IMPLEMENTATION PER BUSINESS RESPONSIBILITY**, while strictly enforcing zero risk to supported business features, live routes, API contracts, domain test suites, or production Google Sheets data invariants.

---

## 2. Baseline Architecture
The canonical architecture remains anchored on:
- **Routing & Navigation (Phases 1–2):** Singular route handlers in `src/App.tsx` and `src/server/routes.ts`.
- **Workflow & API Convergence (Phases 3–4):** Canonical 15-step conveyor workflow state machine (`workflowService`) and unified domain REST APIs.
- **Service Layer Convergence (Phase 5):** Canonical domain services (`questionService`, `scriptService`, `videoService`, `thumbnailService`, `pinnedCommentService`, `socialReviewService`, `publishingService`, `platformAdaptationService`, `contentMasterService`).
- **Repository Convergence (Phase 6):** Canonical Google Sheets-backed repositories (`questionsRepository`, `scriptsRepository`, `videosRepository`, `thumbnailsRepository`, `pinnedCommentsRepository`, `socialReviewsRepository`, `publishingRepository`, `contentMastersRepository`).
- **Data Ownership Governance (Phase 7):** Single source of truth per entity (`src/lib/ownership/data-ownership.ts`), authoritative worksheet mapping, and identity chain resolution.

---

## 3. Legacy Inventory & Classification Matrix

| File Path | Purported Purpose | Canonical Replacement | Classification | Action / Rationale |
|---|---|---|---|---|
| `src/pages/Phase23ProductionDashboardPage.tsx` | Obsolete Phase 23 Dashboard UI Page | `ProductionBoardPage.tsx` / `DashboardPage.tsx` | REMOVE | **DELETED.** 0 imports, 0 route references, completely unreferenced in `App.tsx` or tests. |
| `src/components/dashboard/BottleneckSection.tsx` | Legacy dashboard bottleneck widget | `DashboardPage.tsx` widgets | REMOVE | **DELETED.** 0 references across entire codebase. |
| `src/components/dashboard/PublishingReadinessSection.tsx` | Legacy publishing readiness widget | `PublishingPage.tsx` / `DashboardPage.tsx` | REMOVE | **DELETED.** 0 references across entire codebase. |
| `src/lib/services/phase15-script-production.service.ts` | Phase 15 script production service | `script.service.ts` (`scriptService`) | KEEP — COMPATIBILITY SURFACE | Active endpoints in `src/server/routes.ts` (`/api/phase15/...`) and test harness suite. |
| `src/lib/services/phase17-video-production.service.ts` | Phase 17 video production service | `video.service.ts` (`videoService`) | KEEP — COMPATIBILITY SURFACE | Active endpoints in `src/server/routes.ts` (`/api/phase17/...`) and test harness suite. |
| `src/lib/services/phase18-thumbnail-intelligence.service.ts` | Phase 18 thumbnail intelligence service | `thumbnail.service.ts` (`thumbnailService`) | KEEP — COMPATIBILITY SURFACE | Active endpoints in `src/server/routes.ts` (`/api/phase18/...`) and test harness suite. |
| `src/lib/services/phase14-drive.service.ts` | Phase 14 Drive service wrapper | `google-drive.service.ts` | KEEP — ACTIVE DEPENDENCY | Direct runtime dependency in `src/server/routes.ts` (`uploadProductionAsset`, `listAssets`). |
| `src/lib/services/phase20-social-review.service.ts` | Phase 20 review service wrapper | `social-review.service.ts` | KEEP — TEST HARNESS DEPENDENCY | Direct target of Phase 20 test harness (`npm run test:phase20`). |
| `src/lib/services/phase21-platform-adaptation.service.ts` | Phase 21 adaptation service wrapper | `platform-adaptation.service.ts` | KEEP — TEST HARNESS DEPENDENCY | Direct target of Phase 21 test harness (`npm run test:phase21`). |
| `src/lib/services/phase22-publishing-hub.service.ts` | Phase 22 publishing service wrapper | `publishing.service.ts` | KEEP — TEST HARNESS DEPENDENCY | Direct target of Phase 22 test harness (`npm run test:phase22`). |
| `src/lib/services/phase23-production.service.ts` | Phase 23 production service wrapper | `production-board.service.ts` / `workflow.service.ts` | KEEP — ACTIVE DEPENDENCY | Imported by `phase26-copilot.service.ts`. |
| `src/lib/services/phase24-orchestrator.service.ts` | Phase 24 AI orchestrator service | N/A (Canonical AI Orchestrator) | KEEP — ACTIVE PRODUCTION SERVICE | Primary AI orchestration engine across routes and AI services. |
| `src/lib/services/phase25-consensus.service.ts` | Phase 25 AI consensus service | N/A (Canonical AI Consensus) | KEEP — ACTIVE PRODUCTION SERVICE | Active REST endpoint in `src/server/routes.ts` (`/api/ai/consensus/...`). |
| `src/lib/services/phase26-copilot.service.ts` | Phase 26 AI copilot service | N/A (Canonical AI Copilot) | KEEP — ACTIVE PRODUCTION SERVICE | Active REST endpoint in `src/server/routes.ts` (`/api/ai/copilot/...`). |
| `src/lib/repositories/phase20-social-reviews.repository.ts` | Phase 20 social review repository adapter | `socialReviewsRepository` | KEEP — COMPATIBILITY ADAPTER | Phase 6 converged thin adapter delegating to `socialReviewsRepository`. |
| `src/lib/repositories/phase22-publishing.repository.ts` | Phase 22 publishing repository adapter | `publishingRepository` | KEEP — COMPATIBILITY ADAPTER | Phase 6 converged thin adapter delegating to `publishingRepository`. |
| `src/lib/ai/providers/xai.client.ts` | xAI API client prototype | Gemini/Vertex AI | DEFERRED — UNCERTAIN | Retained as potential future AI provider client. |
| `src/lib/ai/verifier/arbitration.ts` | Multi-provider arbitration helper | Gemini Consensus | DEFERRED — UNCERTAIN | Retained as multi-provider arbitration helper. |

---

## 4. Summary of Files Removed & Modified

### Files Removed
1. `src/pages/Phase23ProductionDashboardPage.tsx`
2. `src/components/dashboard/BottleneckSection.tsx`
3. `src/components/dashboard/PublishingReadinessSection.tsx`

### Files Modified
- None (All imports were clean; deleted files had zero references across the codebase).

---

## 5. Compatibility Surfaces Intentionally Retained
1. **Phase-Prefixed REST API Endpoints in `src/server/routes.ts`:**
   - `/api/phase15/*` (Script production endpoints)
   - `/api/phase17/*` (Video production endpoints)
   - `/api/phase18/*` (Thumbnail intelligence endpoints)
   - `/api/phase25/*` (AI consensus endpoints)
   - `/api/phase26/*` (AI copilot endpoints)
   - *Rationale:* Retained to maintain full backwards compatibility with external API callers and automated verification suites.
2. **Phase Repository Adapters:**
   - `phase20-social-reviews.repository.ts`
   - `phase22-publishing.repository.ts`
   - *Rationale:* Delegating compatibility adapters maintained for legacy test runners.

---

## 6. Production Data Safety Statement
- **Zero Production Data Mutations:** No Google Sheets rows were modified, cleared, or deleted.
- **Zero Sequence Regeneration:** No auto-increment ID counters in `SEQUENCES` worksheet were altered.
- **Zero Schema Modifying Operations:** Google Sheets worksheet structures remain 100% intact.

---

## 7. Verification Results

### TypeScript Typecheck (`npx tsc --noEmit`)
- **Status:** **PASS** (0 errors)

### Applet Compilation & Build (`npm run build`)
- **Status:** **PASS** (Vite build + ESBuild server bundle completed successfully in 14.93s)

### Applet Linting (`npm run lint`)
- **Status:** **PASS** (0 errors)

### Focused Verification Suites
- **Phase 20 Social Review Suite (`npm run test:phase20`):**
  - Passed: **23 / 25 checks**
  - Failures: **2 checks** (`P20-16` and `P20-25` strictly attributable to Google Drive OAuth `invalid_grant` credential state).
  - Code/Logic Errors: **0**.
- **Phase 21 Multi-Platform Adaptation Suite (`npm run test:phase21`):**
  - **25 / 25 PASSED (PASS)**.
- **Phase 22 Publishing Hub Suite (`npm run test:phase22`):**
  - **27 / 27 PASSED (PASS)**.

---

## 8. Explicit Phase Deferral
- **Phase 9 — Final Verification & Release Production Readiness:** Strictly deferred per roadmap instructions.
