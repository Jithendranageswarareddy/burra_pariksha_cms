# Unused & Dormant Table Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 17 of 30  
**Document:** 27 of 39  

---

## 1. Table Traffic & Consumption Analysis

An audit of all 25 sheet schemas against route handlers, service consumers, and UI components was conducted to identify dormant or candidate-for-deprecation tables:

| Sheet Tab Name | Schema Defined | Repository Implemented | Route Consumers | UI Consumer Pages | Classification | Audit Finding |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| `QUESTION_VIDEOS` | YES | YES | 1 endpoint | 0 pages | **LOW USAGE / REDUNDANT** | Rarely queried; UI relies directly on `QUESTIONS.video_ids` |
| `PINNED_COMMENT_VERSIONS`| YES| YES | 1 endpoint | 0 pages | **DORMANT** | Versions are written on change but never displayed in UI |
| `THUMBNAIL_VERSIONS` | YES | YES | 1 endpoint | 1 modal | **LOW USAGE** | Historical versions written, rarely inspected |
| `QUESTION_CONFIG` | YES | YES | 2 endpoints | Admin Config | **ACTIVE** | Stores system parameters and validation thresholds |
| `MEDIA_ASSETS` | YES | YES | 3 endpoints | Media Bay | **ACTIVE** | Tracks Google Drive asset uploads |
| `CONTENT_BATCHES` | YES | YES | 4 endpoints | Planning | **ACTIVE** | Groups questions into editorial batches |

---

## 2. Remediation Recommendation
- `QUESTION_VIDEOS` should be officially designated as a legacy join table and consolidated into `QUESTIONS.video_ids` or vice versa during the future database migration step.
