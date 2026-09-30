# UI Card & Container Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 08 of 30  
**Document:** 12 of 30  

---

## 1. Card Subsystem Summary

AST analysis identified **148 distinct card/container implementations**.
Major card archetypes:
1. **Metric / KPI Cards**: Display numeric values with trend indicators (`DashboardPage`, `AnalyticsExperiencePage`).
2. **Entity Action Cards**: Encapsulate an individual question, video, or social package with action footers.
3. **Workflow Stage Tiles**: Horizontal or grid cards representing discrete stages in the conveyor belt.
4. **Option Cards**: Authoring cards representing Multiple Choice Question options (A, B, C, D) with correct-answer toggles.

---

## 2. Card Interaction & Ambiguity Audit

- **False Affordance Cards**:
  - In `DashboardPage.tsx`, several summary cards feature subtle hover shadows (`hover:shadow-md`) giving the visual impression of clickability, but have no `onClick` handler.
- **Nested Clickable Surfaces**:
  - In `ProductionTrackerPage.tsx`, video cards have a root `onClick` navigating to `/videos/:id`, but also contain phase pills with separate `<Link>` targets. Clicking a phase pill can occasionally trigger the card root click if propagation is not stopped.
- **Verified Propagation Fix**:
  - Confirmed `e.stopPropagation()` is present on phase pill links in `ProductionTrackerPage.tsx:235`, mitigating propagation conflicts.
