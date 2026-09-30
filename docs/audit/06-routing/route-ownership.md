# Route Domain & Team Ownership Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 06 — Complete Route Forensic Audit  
**Audit Date:** 2026-09-28  

---

## 1. Domain Ownership Breakdown of Routes

| Functional Domain | Primary Responsible Role | Total Routes Assigned | Representative Routes |
| :--- | :--- | :---: | :--- |
| **Question Authoring** | `QUESTION_AUTHOR`, `QUESTION_EDITOR` | 7 | `/studio`, `/questions`, `/questions/:id`, `/questions/improve`, `/questions/new`, `/generate` |
| **Verification & QA** | `QA_REVIEWER` | 4 | `/questions/verify`, `/questions/:id/verify`, `/social-review`, `/social-review/:reviewId` |
| **Video Production** | `PRESENTER`, `VIDEO_EDITOR`, `DESIGNER`| 32 | `/queue`, `/production`, `/videos/create-script`, `/videos/:videoId`, and 24 tab redirects |
| **Publishing & Social** | `PUBLISHING_LEAD` | 11 | `/platform-packages`, `/publishing`, `/publishing-package`, `/videos/:id/publish`, etc. |
| **Analytics & Intelligence**| `ANALYST` | 13 | `/analytics/overview` (+ 9 sub-routes), `/social-analytics`, `/social-analytics/:contentId` |
| **Management & Planning** | `CONTENT_LEAD` | 4 | `/planning`, `/content-masters`, `/content-masters/:id`, `/team` |
| **System & Recovery** | `ADMIN` | 4 | `/dashboard`, `/settings`, `/recovery`, `/admin` |
| **Authentication & Core**| ALL / PUBLIC | 4 | `/` (Parent), `/` (Index), `/my-work`, `/*` (404) |
