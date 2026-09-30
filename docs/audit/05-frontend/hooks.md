# Custom Hooks Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 05 — Frontend Architecture Forensic Audit  
**Audit Date:** 2026-09-28  

---

## 1. Inventory of Custom Hooks

An exhaustive search across all frontend files reveals that **no `src/hooks/` directory exists** in the repository.

Only **two custom React hooks** are defined across the entire application:

| Hook Name | Declaring File | Primary Responsibility | Consumers Count |
| :--- | :--- | :--- | :---: |
| `useAuth()` | `src/contexts/AuthContext.tsx` | Exposes `user`, `isLoading`, `login`, `logout`, `refreshUser` | **18 files** |
| `useProductionJourney()` | `src/contexts/ProductionJourneyContext.tsx` | Exposes canonical IDs, active entities, 15-stage workflow, blockers, transitions | **24 files** |

---

## 2. Standard React & Router Hooks Usage

Instead of custom encapsulated domain hooks (e.g. `useQuestion()`, `useVideo()`, `useAssignments()`), pages and components directly invoke primitive React and React Router hooks:
- `useState`: Used in **62 frontend files**.
- `useEffect`: Used in **51 frontend files** (handling data fetching, interval timers, polling).
- `useNavigate`: Used in **38 frontend files**.
- `useParams`: Used in **16 frontend files** (reading route entity IDs).
- `useLocation` / `useSearchParams`: Used in **14 frontend files** (reading query params and tabs).
- `useCallback` / `useMemo`: Used in **12 frontend files**.
- `useRef`: Used in **9 frontend files** (teleprompter scrolling, file inputs, dropdown references).

---

## 3. Hook Architecture Deficiencies
1. **Business Logic in Pages:** Because domain-specific custom hooks are absent, complex data fetching, retry loops, optimistic UI updates, and validation logic are written directly inside page component bodies.
2. **Duplicated Fetching Logic:** Multiple pages reimplement identical `useEffect(() => { loadData(); }, [id])` patterns.
