# Architectural Divergences Across Navigation Subsystems

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 07 of 30  
**Document:** 18 of 27  

---

## 1. Divergence Overview

Because BP-CMS evolved from a multi-page phase-by-phase application into a consolidated workspace model, subtle divergences exist between:
1. **The Navigation Config** (`src/config/navigation.ts`)
2. **The React Router Tree** (`src/App.tsx`)
3. **The Production Journey Stepper** (`src/contexts/ProductionJourneyContext.tsx`)
4. **The Breadcrumbs Engine** (`src/design-system/components/AppBreadcrumbs.tsx`)

---

## 2. Complete Divergence Register

| Subsystem A | Subsystem B | Divergence Description | User / Runtime Impact | Severity |
| :--- | :--- | :--- | :--- | :--- |
| `navigation.ts` | `App.tsx` | `navigation.ts` routes Quality Signoff to `/social-review`, whereas `App.tsx` registers both `/social-review` and `/social-review/:reviewId`. | None (Handled gracefully via path prefix matching). | LOW |
| `ProductionJourneyContext` | `App.tsx` | Journey Stage 09 routes to `/social-review/:reviewId`, but in video workspace it routes to `/videos/:id?tab=social`. | Dual mental models: standalone review vs integrated workspace. | MEDIUM |
| `navigation.ts` | `ProductionJourneyContext` | Journey Stage 04 routes to `/videos/:id?tab=recording`, while Navigation Hub 3 routes Recording Queue to `/queue`. | Presenters navigate to `/queue` for daily schedule, but pipeline advances directly to tab. | LOW (Appropriate role separation). |
| `AppBreadcrumbs.tsx` | `App.tsx` | `inferBreadcrumbs()` covers legacy routes like `/videos/create-script` even though `App.tsx` immediately redirects them. | Redundant dead code in breadcrumbs inference rules. | LOW |
| `Sidebar.tsx` | `App.tsx` | `Sidebar.tsx` hides `/recovery` for non-admins, but `App.tsx` allows any authenticated user to enter `/recovery` directly. | **Security / RBAC vulnerability**: Client-side menu hiding without route guard. | HIGH |
