# Error State Navigation & Fallback Routes Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 07 of 30  
**Document:** 21 of 27  

---

## 1. Error Navigation Architecture

Error navigation handles routing misdirections, broken deep-links, runtime React exceptions, and disaster recovery scenarios.

```
[Unmatched URL / Broken Link] ---> [NotFoundPage (404)] ---> Option A: "Back to Home" (/dashboard)
                                                       ---> Option B: "Go Back" (navigate(-1))

[React Render Exception]      ---> [ErrorBoundary Fallback] ---> Option A: "Reload View" (window.location.reload)
                                                            ---> Option B: "Return Home" (/dashboard)
                                                            ---> Option C: "Go Back" (navigate(-1))
```

---

## 2. Error Boundary Navigation Mechanisms

BP-CMS deploys two levels of ErrorBoundary:
1. **Application Shell ErrorBoundary** (`src/components/layout/Layout.tsx:31`): Wraps entire layout frame.
2. **Page-Level ErrorBoundary** (`src/components/layout/Layout.tsx:79`): Wraps `<Outlet />` ensuring page crashes do not take down the Header and Sidebar!

### Action Controls in `ErrorBoundary.tsx`:
- **"Try Again"**: Calls `this.setState({ hasError: false, error: null })` to attempt component remounting.
- **"Reload Application"**: Invokes `window.location.reload()` to refresh client assets.
- **"Return Home"**: Invokes `navigate("/dashboard")`.

---

## 3. 404 Not Found Navigation Mechanisms

`src/pages/NotFoundPage.tsx` intercepts all unmatched routes via `<Route path="*" element={<NotFoundPage />} />`:
- Displays HTTP 404 code, helpful error description, and attempted path.
- Provides primary CTA: "Back to Overview" (`<Button onClick={() => navigate("/dashboard")}>`).
- Provides secondary CTA: "Go Back" (`<Button onClick={() => navigate(-1)} variant="secondary">`).
