# Route Conflicts & Precedence Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 06 — Complete Route Forensic Audit  
**Audit Date:** 2026-09-28  

---

## 1. Route Precedence & Collisions in `src/App.tsx`

React Router v6/v7 utilizes ranked path matching rather than strict declaration order. However, several route pairs present potential ambiguity:

### 1. Static vs Dynamic Route Ranking
- `/questions/new` vs `/questions/:id`
- `/questions/improve` vs `/questions/:id`
- `/questions/verify` vs `/questions/:id`
- **Status:** React Router correctly ranks explicit static segments higher than parameterized segments (`:id`). If a user requests `/questions/verify`, it mounts `QuestionVerifyApprovePage` rather than treating `"verify"` as an `:id`.

### 2. Multi-Segment Static Collisions
- `/questions/:id/verify` vs `/questions/:id`
- **Status:** Evaluated correctly; the two-segment path has higher specificity.

### 3. Duplicate Declaration Overlap
- `/team` and `/team-work` both render `<TeamOperationsPage />` independently.
- `/recovery` and `/admin` both render `<RecoveryAdminPage />` independently.
- **Impact:** Divergent URLs for the same canonical view can lead to inconsistent browser history, analytics fragmentation, and duplicate bookmarking.
