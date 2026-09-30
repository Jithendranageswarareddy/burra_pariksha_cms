# URL Query Parameter Synchronization & Deep-Linking Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 07 of 30  
**Document:** 14 of 27  

---

## 1. Deep-Linking Topology

BP-CMS relies heavily on URL query parameters to maintain stateful views, tab selections, active filters, and search queries. Deep linking allows users to bookmark or share exact operational contexts.

---

## 2. Active URL Query Parameter Contracts

| Route Path | Query Parameter | Expected Type / Values | Parameter Purpose | Consumer Component |
| :--- | :--- | :--- | :--- | :--- |
| `/videos/:id` | `?tab=` | `overview`, `script`, `recording`, `editing`, `final-review`, `thumbnail`, `social`, `publishing` | Controls active production workspace | `VideoDetailPage.tsx` |
| `/questions` | `?status=` | `DRAFT`, `VERIFIED`, `IN_PRODUCTION`, `PUBLISHED`, `REJECTED`, `ALL` | Filters question table by lifecycle status | `QuestionLibraryPage.tsx` |
| `/questions` | `?topic=` | Topic ID string (e.g. `TOPIC-01`) | Filters questions by curriculum topic | `QuestionLibraryPage.tsx` |
| `/questions` | `?search=` | Free text string | Real-time text search filter | `QuestionLibraryPage.tsx` |
| `/production` | `?status=` | `SCRIPT_READY`, `RECORDING`, `EDITING`, `FINAL_REVIEW`, `READY_TO_UPLOAD`, `PUBLISHED` | Filters kanban conveyor belt columns | `ProductionTrackerPage.tsx` |
| `/studio` | `?id=` | Question ID string | Loads existing question for refinement | `QuestionStudioPage.tsx` |
| `/studio` | `?topicId=`| Topic ID string | Pre-populates syllabus topic selection | `QuestionStudioPage.tsx` |
| `/social-analytics`| `?contentId=` | ContentMaster ID string | Filters comments by content master | `SocialAnalyticsPage.tsx` |
| `/settings` | `?tab=` | `taxonomy`, `sheets`, `system` | Controls active administration tab | `SettingsPage.tsx` |
| `/my-work` | `?user=` | User ID string | Inspects assigned tasks for specific user | `MyWorkPage.tsx` |

---

## 3. URL Synchronization Reliability

1. **Vite / React Router Parity**: All query parameters survive page reloads and browser back/forward transitions.
2. **Missing Parameter Fallback**: Every parameter consumer implements explicit defensive fallbacks:
   - `searchParams.get("tab") || "overview"`
   - `searchParams.get("status") || "ALL"`
3. **Legacy Shim Redirects**: URLs like `/videos/create-script` redirect cleanly to `/production?status=SCRIPT_READY` with preserved search parameters.
