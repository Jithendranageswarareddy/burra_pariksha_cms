# Frontend Architecture Problem & Risk Register

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 05 — Frontend Architecture Forensic Audit  
**Audit Date:** 2026-09-28  

---

## 1. Forensic Problem Register

| ID | Category | Affected Files | Severity | Confidence | Description |
| :---: | :--- | :--- | :---: | :---: | :--- |
| **FE-01** | DUPLICATION | `src/design-system/Button.tsx` vs `src/components/common/Button.tsx` | **HIGH** | CONFIRMED | Two competing `Button` components split 103 consumers 52 vs 51. |
| **FE-02** | DUPLICATION | `src/design-system/PageHeader.tsx` vs `src/components/layout/PageHeader.tsx` | **HIGH** | CONFIRMED | Two competing `PageHeader` components split 55 consumers 28 vs 27. |
| **FE-03** | DUPLICATION | `src/design-system/EmptyState.tsx` vs `src/components/common/EmptyState.tsx` | **MEDIUM**| CONFIRMED | Competing empty states split 29 consumers 15 vs 14. |
| **FE-04** | DUPLICATION | `src/design-system/Modal.tsx` vs `src/components/common/Modal.tsx` | **MEDIUM**| CONFIRMED | Competing modal dialogs split 24 consumers 12 vs 12. |
| **FE-05** | LEGACY | 8 unrouted pages in `src/pages/` | **HIGH** | CONFIRMED | 8 pages (`VideoEditPage`, `ProductionBoardPage`, etc.) are dead code bypassed by redirects. |
| **FE-06** | BACKEND LEAKAGE | `src/components/publishing/PublishingTable.tsx` | **CRITICAL**| CONFIRMED | Directly instantiates backend `ProductionAssetValidationService` in browser component! |
| **FE-07** | BACKEND LEAKAGE | `RecoveryAdminPage`, `SettingsPage`, `VideoDetailPage` | **HIGH** | CONFIRMED | Exposes internal Google Sheets worksheet names, spreadsheet IDs, and GCS bucket masks. |
| **FE-08** | API ARCHITECTURE | `src/pages/PlanningPage.tsx` | **HIGH** | CONFIRMED | Contains 17 raw `fetch` calls bypassing centralized `apiClient` error/token handling. |
| **FE-09** | BUSINESS LOGIC | `src/contexts/ProductionJourneyContext.tsx` | **HIGH** | CONFIRMED | 996-line context calculates complex stage blocker logic in browser memory. |
| **FE-10** | STATE OWNERSHIP | `VideoDetailPage` vs URL vs `ProductionJourneyContext` | **HIGH** | CONFIRMED | Tri-state divergence between local state, URL params (`?tab=`), and context `currentStage`. |
| **FE-11** | RBAC / SECURITY | `src/App.tsx` (`AppRoutes`) | **MEDIUM**| CONFIRMED | No route-level guards on child routes; non-admin users can access admin page views client-side. |
| **FE-12** | ARCHITECTURE | `src/hooks/` | **MEDIUM**| CONFIRMED | Zero domain hooks; all pages implement repetitive `useState` / `useEffect` loading lifecycles. |
