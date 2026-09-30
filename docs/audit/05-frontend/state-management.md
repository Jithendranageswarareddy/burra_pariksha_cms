# Frontend State Management Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 05 — Frontend Architecture Forensic Audit  
**Audit Date:** 2026-09-28  

---

## 1. State Management Mechanisms in Use

| Mechanism | Implementation | Files | Responsibility |
| :--- | :--- | :---: | :--- |
| **Local Component State** | React `useState` | **62 files** | Form inputs, modal visibilities, filter toggles, active tab state |
| **Global Context State** | React `createContext` | **2 files** | Authentication session (`AuthContext`) & Workflow journey (`ProductionJourneyContext`) |
| **URL Search Params** | React Router `useSearchParams` / `useLocation` | **14 files** | Tab selection (`?tab=editing`), status filters (`?status=EDITING`), question mode (`?mode=edit`) |
| **Browser Storage** | `localStorage` | **2 files** | Session token (`bp_session_token`) & Sidebar collapse (`bp_sidebar_collapsed`) |
| **External State Stores** | Redux, Zustand, Recoil | **0 files** | None present in repository |
| **Server Cache Libraries** | React Query, SWR, RTK Query | **0 files** | None present; all queries are manual `useEffect` calls |

---

## 2. State Duplication & Synchronization Risks
1. **Server State Duplication:** Pages fetch data via `apiClient` and store raw arrays into local `useState`. If another component updates the backend (e.g. an assignment modal), sibling views remain stale unless manually triggered to refetch.
2. **Dual Workflow State:** Workflow stage is tracked simultaneously in `ProductionJourneyContext.currentStage` AND in the page URL query param (`?tab=`), leading to race conditions during rapid stage progression.
