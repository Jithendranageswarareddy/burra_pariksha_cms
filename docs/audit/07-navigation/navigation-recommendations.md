# Navigation Architecture Remediation Roadmap

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 07 of 30  
**Document:** 26 of 27  

---

## 1. Remediation Strategy

To preserve stability while eliminating architectural divergences and security holes, remediation should proceed across three disciplined phases:

```
[Phase 1: Security & Route Hardening]  --->  [Phase 2: Consolidation & UX]  --->  [Phase 3: Final Pruning]
  - Add <RequireCapability> guards            - Replace navigate(-1) fallbacks     - Remove orphan page files
  - Protect /recovery and /settings           - Sync modals with searchParams       - Clean unused breadcrumb rules
```

---

## 2. Phased Action Items

### Phase 1: Security & RBAC Enforcement (Immediate Priority)
1. **Implement `<RequireCapability capability="...">` Route Guard**:
   - Wrap `/recovery`, `/admin`, and `/settings` inside route protection wrappers that evaluate `hasNavigationCapability(user.role, capability)`.
   - Redirect unauthorized actors cleanly to their assigned `landingRoute`.

### Phase 2: Navigation Consolidation & UX Hardening (Subsequent Phase)
1. **Defensive History Back Helper**:
   - Replace raw `navigate(-1)` in `NotFoundPage` and `ErrorBoundary` with `safeNavigateBack("/dashboard")`:
   ```typescript
   const handleBack = () => {
     if (window.history.length > 2) {
       navigate(-1);
     } else {
       navigate("/dashboard");
     }
   };
   ```
2. **URL Search Parameter Synchronization for High-Stakes Modals**:
   - Synchronize `RecoveryAdminPage` restore preflight confirmation with `?modal=restore_confirm`.
   - Synchronize `PublishingPage` broadcast scheduler with `?modal=schedule`.
3. **Accessibility Attributes on Production Stepper**:
   - Add `aria-current={stage.stageNumber === currentStage ? "step" : undefined}` and descriptive labels.

### Phase 3: Dead Code & Redirection Pruning (Converged Architecture)
1. Delete the 8 orphaned page components (`ProductionBoardPage.tsx`, `VideoRecordPage.tsx`, etc.) once backend migration is fully verified.
2. Remove legacy multi-route redirect blocks in `src/App.tsx` in favor of direct canonical workspace links.
