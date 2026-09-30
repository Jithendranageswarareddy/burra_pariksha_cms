# Forensic Navigation Problem Register

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 07 of 30  
**Document:** 25 of 27  

---

## 1. Problem Classification Matrix

| Finding ID | Classification | Location / Component | Defect Summary | Business / Security Impact | Remediation Phase |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **NAV-SEC-01** | **SECURITY (CRITICAL)** | `src/App.tsx` vs `Sidebar.tsx` | Client-side menu hiding without router route guards. Non-admin users can access `/recovery` and `/settings` via URL entry. | Unauthorized configuration modification or snapshot restore execution. | Immediate (Phase 1 Fix) |
| **NAV-UX-02** | **UX RISK (HIGH)** | `NotFoundPage.tsx:48`, `ErrorBoundary.tsx:70` | Unconditional `navigate(-1)` history back calls can strand deep-linked users or loop back to fatal error views. | Frustrating dead-end UX for users opening shared task links. | Phase 2 Cleanup |
| **NAV-UX-03** | **UX RISK (MEDIUM)** | `ProductionJourneyBar.tsx` | Stepper pills on mobile screens require excessive horizontal scrolling without snap indicators. | Mobile operators may miss stage progression cues. | Phase 2 Cleanup |
| **NAV-ARC-04** | **ARCHITECTURE (MEDIUM)** | `ProductionJourneyContext.tsx:869` | Stage 13 computes route as `/social-analytics/:id`, but analytics hub hosts metrics at `/analytics/*`. | Fragmented mental model for analytics tracking. | Phase 2 Cleanup |
| **NAV-A11Y-05**| **ACCESSIBILITY (LOW)** | `ProductionJourneyBar.tsx` | Stepper stage pills lack explicit `aria-current="step"` and progressive step announcements. | Screen reader users receive sub-optimal progress telemetry. | Phase 2 Cleanup |
| **NAV-DEAD-06**| **DEAD CODE (LOW)** | `src/App.tsx` lines 106, 113, 117, 121, 125, 130, 134, 150 | 8 orphaned page imports retained solely for redirect routes. | Adds unnecessary bundle size overhead. | Phase 2 Pruning |
