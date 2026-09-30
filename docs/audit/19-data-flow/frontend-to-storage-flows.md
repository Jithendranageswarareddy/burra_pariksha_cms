# Frontend-to-Storage Data Flows

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 19 of 30  
**Document:** 07 of 35  

---

## 1. Frontend Ingress Architecture

The frontend architecture does not utilize an intermediate state management library (such as Redux, MobX, or Zustand) nor a server-state cache manager (such as TanStack React Query or SWR).

Instead, data flows directly from:
```
Page Component (useState / useEffect)
  ↓
API Client Bridge (src/lib/api-client.ts) OR Raw window.fetch()
  ↓
HTTP REST Endpoint (Express /api/*)
```

### Forensic Observations on Frontend Data Flow:
1. **Isolated Component State:** Every page component manages its own fetch lifecycles. For example, `PlanningPage.tsx` executes 7 parallel raw `fetch()` calls on mount (`lines 165-180`).
2. **Absence of Shared Cache Invalidation:** When a record is mutated on one page (e.g. status transition on `VideoDetailPage`), other open tabs or previously visited pages retain their stale local state until an explicit full-page refresh or remount occurs.
3. **Direct Form Buffering:** Complex forms (e.g. `QuestionCreatePage.tsx` and `ScriptWorkspace.tsx`) hold unsaved drafts purely in React state. Browser navigation or tab closure immediately discards unpersisted changes unless explicit draft saving was executed.
4. **Token Storage:** The JWT session token is persisted in `localStorage.getItem('bp_session_token')` and attached via standard HTTP `Authorization: Bearer <token>` headers.
