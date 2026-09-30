# "Back" Button & History Navigation Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 07 of 30  
**Document:** 11 of 27  

---

## 1. Back Navigation Architecture

Back navigation allows users to retreat from detailed task views to overarching listings or prior workflows. The audit evaluated whether the application utilizes **browser history back (`navigate(-1)`)** or **explicit static route back links**.

---

## 2. Browser History vs Explicit Route Analysis

| Back Button Implementation | Locations in Codebase | Risk Assessment | Forensic Recommendation |
| :--- | :--- | :--- | :--- |
| **`navigate(-1)` (Browser History)** | 2 occurrences (`NotFoundPage.tsx:48`, `ErrorBoundary.tsx:70`) | **HIGH RISK**: If user arrives via deep link or external bookmark, `navigate(-1)` can exit the application or loop back to error. | Safe only with fallback: `history.length > 1 ? navigate(-1) : navigate("/dashboard")`. |
| **Explicit Static Route Links** | 14 occurrences (e.g. `QuestionDetailPage`, `VideoDetailPage`, `PlatformPackagesPage`) | **STABLE / PREDICTABLE**: Always returns the user to the authoritative parent hub or list view. | Highly recommended canonical pattern across all pages. |

---

## 3. Page-by-Page Back Button Audit

| Page Component | Back Button UI Element | Implementation | Destination Target | Reliability Score |
| :--- | :--- | :--- | :--- | :--- |
| `QuestionDetailPage.tsx` | Header "Back to Questions" | `onClick={() => navigate("/questions")}` | `/questions` | 100% (Predictable) |
| `QuestionImprovePage.tsx` | "Cancel" button | `onClick={() => navigate("/studio")}` | `/studio` | 100% (Predictable) |
| `QuestionVerifyApprovePage.tsx`| "Back to Studio" fallback | `onClick={() => navigate("/studio")}` | `/studio` | 100% (Predictable) |
| `VideoDetailPage.tsx` | "Back to Production Board" | `onClick={() => navigate("/production")}` | `/production` | 100% (Predictable) |
| `SocialReviewPage.tsx` | Detail View "Back to Queue"| `onClick={() => navigate("/social-review")}`| `/social-review` | 100% (Predictable) |
| `PlatformPackagesPage.tsx` | Top Action "Back to Publisher" | `to="/publishing"` (`<Link>`) | `/publishing` | 100% (Predictable) |
| `ContentMasterPage.tsx` | Detail View "Back to Explorer"| `onClick={() => navigate("/content-masters")}`| `/content-masters`| 100% (Predictable) |
| `NotFoundPage.tsx` | Secondary CTA "Go Back" | `onClick={() => navigate(-1)}` | Browser History (`-1`) | 60% (Unpredictable) |
| `ErrorBoundary.tsx` | Crash UI "Go Back" | `onClick={() => navigate(-1)}` | Browser History (`-1`) | 60% (Unpredictable) |
