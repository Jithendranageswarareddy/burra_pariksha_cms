# Service Error Handling & Exception Management Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 12 of 30  
**Document:** 20 of 30  

---

## 1. Service Exception Patterns

Services in BP-CMS manage exceptions using three distinct paradigms:
1. **Throwing Standard Error Instances**: `throw new Error("Validation failed: ...")` (82% of services).
2. **Throwing Custom Domain Exceptions**: Classes such as `CopilotAuthorizationError` in `phase26-copilot.service.ts` (6% of services).
3. **Silent Catch & Logging**: Catching errors, logging via `console.error`, and returning default fallback values (12% of services).

---

## 2. Error Masking & Swallowing Register

| Service File | Method | Swallowed Exception | Fallback Returned | Consequence |
| :--- | :--- | :--- | :--- | :--- |
| `dashboard.service.ts` | `getOverviewMetrics()` | Google Sheets read timeout | Returns zeroed counters (`{ activeVideos: 0 }`) | User sees blank dashboard without knowing database timed out |
| `social-review.service.ts` | `getCommentMetrics()` | API token expiry | Returns empty array (`[]`) | Reviewer assumes video has zero comments |
| `data-integrity.service.ts` | `verifyAllDriveLinks()` | Drive 404 not found | Skips file silently | Broken drive links remain undetected in report |
