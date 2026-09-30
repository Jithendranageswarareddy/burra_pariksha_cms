# Database ↔ Sheets Read-Conflict Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 17 of 30  
**Document:** 25 of 39  

---

## 1. Divergent Read Paths Across Application

A forensic sweep of read routes in `src/server/routes.ts` reveals that different endpoints query different data sources for the same logical domain concepts:

| Domain Concept | Read Path A (Endpoint & Source) | Read Path B (Endpoint & Source) | Divergence / Risk |
| :--- | :--- | :--- | :--- |
| **Questions** | `GET /api/questions` (Reads `QUESTIONS` sheet via repository) | `GET /api/questions/drafts` (Reads in-memory draft repository) | Drafts are invisible to main question search until approved |
| **Video Production** | `GET /api/videos` (Reads `VIDEOS` sheet) | `GET /api/production/teleprompter/:id` (Direct script query) | Teleprompter page can display script text newer than video metadata |
| **Social Reviews** | `GET /api/reviews` (Reads `SOCIAL_REVIEWS` tab) | `GET /api/videos/:id/review` (Reads review embedded in video row)| Two different review statuses can be returned simultaneously |
| **Analytics Metrics**| `GET /api/analytics/realtime` (Simulated / live API) | `GET /api/analytics/historical` (Reads `SOCIAL_ANALYTICS` sheet) | Realtime metrics desynchronized from sheet-cached figures |
| **Thumbnails** | `GET /api/thumbnails` (Reads `THUMBNAILS` sheet) | `GET /api/thumbnails/candidates` (Reads Drive folder directly) | Drive images not yet registered in sheet are hidden in UI |

---

## 2. Impact on User Experience
Because different pages consume different read paths, users experience noticeable state flicker: approving a video on the Production Bay shows it as "APPROVED", but navigating immediately to the Content Master overview still displays it as "IN_PRODUCTION" until the Google Sheets row cache expires.
