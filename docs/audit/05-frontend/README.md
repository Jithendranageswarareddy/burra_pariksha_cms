# Step 05: Frontend Architecture Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 05 of 30  
**Audit Date:** 2026-09-28  
**Audit Mode:** Read-Only Forensic Analysis  
**Auditor:** Forensic Software Auditor (Evidence-First, Zero Mutation)  

---

## 1. Executive Summary

Step 05 reconstructs the complete frontend architecture of the BP-CMS application across all **115 frontend source files** (`src/main.tsx`, `src/App.tsx`, 31 pages, 59 components, 21 design-system components, and 2 React contexts).

### Absolute Read-Only Charter Statement
In strict adherence to the project audit charter:
- **Zero code, component, or layout modifications** were performed.
- **Zero duplicate components were merged or deleted**.
- **Zero routes or navigation paths were altered**.
- **Zero package dependencies or styles were changed**.
- All findings are backed by verified source code citations.

---

## 2. Key Architecture Metrics Summary

| Metric / Dimension | Verified Value | Evidence Classification |
| :--- | :--- | :--- |
| **Total Frontend Source Files** | 115 files | CONFIRMED (`src/main.tsx`, `src/App.tsx`, 31 pages, 59 components, 21 design system, 2 contexts) |
| **Frontend Entry Point** | `src/main.tsx` mounts `src/App.tsx` at `#root` | CONFIRMED |
| **Application Shells** | 1 Root Authenticated Shell (`Layout.tsx`) + 1 Public Unauthenticated Shell (`LoginPage.tsx`) | CONFIRMED |
| **Layout Components** | 8 layout files in `src/components/layout/` | CONFIRMED |
| **Total Pages Discovered** | 31 pages under `src/pages/` | CONFIRMED |
| **Active / Routed Pages** | 23 pages imported & mounted in `src/App.tsx` | CONFIRMED |
| **Unrouted / Legacy Pages** | 8 pages unrouted in `src/App.tsx` (redirected to tabs/other routes) | CONFIRMED |
| **Total Components** | 80 components (59 in `src/components/`, 21 in `src/design-system/`) | CONFIRMED |
| **Canonical Component System**| Dual competing systems: `src/design-system/` (18 UI components) vs `src/components/common/` (9 ad-hoc components) | CONFIRMED |
| **Duplicate Component Candidates**| 5 high-severity component duplicates (`Button`, `Modal`, `EmptyState`, `PageHeader`, `Badge`) | CONFIRMED |
| **Custom Hooks** | 2 hooks (`useAuth` in AuthContext, `useProductionJourney` in ProductionJourneyContext; 0 files in `src/hooks/`) | CONFIRMED |
| **React Contexts** | 2 contexts (`AuthContext.tsx`, `ProductionJourneyContext.tsx`) | CONFIRMED |
| **State Management** | Local Component State (`useState` in 62 files) + 2 Contexts + URL Search Params | CONFIRMED |
| **Centralized API Client** | `src/lib/api-client.ts` (1,667 lines, imported by 49 frontend consumers) | CONFIRMED |
| **Direct Fetch in Pages** | 1 page (`src/pages/PlanningPage.tsx` with 17 raw `fetch` calls) | CONFIRMED |
| **Backend Leakage Findings** | 19 occurrences of Sheets worksheet names, Drive folder IDs, or GCS concepts in UI | CONFIRMED |

---

## 3. Step 05 Audit Documentation Index

This directory contains the 26 forensic frontend audit documents:
1. [`README.md`](./README.md) — Executive summary, scope, and key metrics
2. [`frontend-entry-points.md`](./frontend-entry-points.md) — Entry point bootstrap and mount flow
3. [`application-shell.md`](./application-shell.md) — Shell hierarchy, global navigation, and header/sidebar
4. [`layouts.md`](./layouts.md) — Layout components inventory and responsibilities
5. [`pages.md`](./pages.md) — Comprehensive dossier of all 31 frontend pages
6. [`components.md`](./components.md) — Complete 80-component inventory across components and design system
7. [`component-consumer-map.md`](./component-consumer-map.md) — Inbound usage graph from pages to components
8. [`canonical-components.md`](./canonical-components.md) — Identification of canonical UI candidates
9. [`duplicate-components.md`](./duplicate-components.md) — Detailed comparison of competing component implementations
10. [`legacy-components.md`](./legacy-components.md) — Dead, obsolete, or unrouted frontend components
11. [`reusable-vs-page-specific.md`](./reusable-vs-page-specific.md) — Reusability classification and coupling
12. [`hooks.md`](./hooks.md) — Audit of custom hooks and hook architecture
13. [`contexts.md`](./contexts.md) — Deep audit of `AuthContext` and `ProductionJourneyContext`
14. [`state-management.md`](./state-management.md) — State mechanisms across component, context, and URL
15. [`state-ownership.md`](./state-ownership.md) — Conflicting sources of truth and state synchronization
16. [`frontend-services.md`](./frontend-services.md) — Services directly imported by frontend code
17. [`api-clients.md`](./api-clients.md) — Architecture of `apiClient` bridge vs direct fetch
18. [`backend-leakage.md`](./backend-leakage.md) — Forensic register of backend/storage leakage in UI
19. [`frontend-business-logic.md`](./frontend-business-logic.md) — Workflow and validation logic embedded in UI
20. [`api-response-coupling.md`](./api-response-coupling.md) — Coupling to raw backend schema response shapes
21. [`frontend-auth-rbac.md`](./frontend-auth-rbac.md) — Role-based access control, landing routes, and guards
22. [`workflow-ui-mapping.md`](./workflow-ui-mapping.md) — Mapping frontend views to the 15 production stages
23. [`frontend-architecture-map.md`](./frontend-architecture-map.md) — Full topological frontend architecture graph
24. [`frontend-responsibility-map.md`](./frontend-responsibility-map.md) — Architectural responsibility division
25. [`frontend-problem-register.md`](./frontend-problem-register.md) — Factual problem and risk register
26. [`final-frontend-baseline.md`](./final-frontend-baseline.md) — Definitive answers to core frontend audit questions
