# Workflow-to-Entity Mapping

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 20 of 30  
**Document:** 20 of 41  

---

## 1. Primary & Secondary Entities Across the 15 Stages

| Stage | Primary Entity | Secondary Entities Created/Read/Updated | Storage Locations |
| :---: | :--- | :--- | :--- |
| **01** | `QuestionDraft` | `Topic`, `Subtopic`, `Category` (Read) | `QUESTION_DRAFTS` Sheet |
| **02** | `Question` | `ContentMaster` (Create), `Video` (Create/Queue), `Validation` (Create) | `QUESTIONS`, `CONTENT_MASTERS`, `VIDEOS` |
| **03** | `Script` | `ScriptVersion` (Create), `Video` (Read) | `SCRIPTS`, `SCRIPT_VERSIONS` Sheets |
| **04** | `Video` | `Script` (Read), `Assignment` (Read) | `VIDEOS`, `SCRIPTS` Sheets |
| **05** | `MediaAsset` | `Video` (Update `driveFileId`), Google Drive Binary (Create) | Google Drive + `MEDIA_ASSETS`, `VIDEOS` |
| **06** | `Video` | `MediaAsset` (Read), Google Drive Final Cut (Create) | Google Drive + `VIDEOS` Sheet |
| **07** | `Video` | QC Checklist (Read/Sign) | `VIDEOS` Sheet (Status: `READY_TO_UPLOAD`) |
| **08** | `Thumbnail` | `ThumbnailVersion` (Create), Google Drive Image (Create) | Google Drive + `THUMBNAILS`, `VERSIONS` |
| **09** | `SocialReview` | `Question` (Read), `Video` (Read), `Thumbnail` (Read) | `SOCIAL_REVIEWS` Sheet |
| **10** | `Publishing` | `Video` (Read), Gate D Validation | `PUBLISHING` Sheet |
| **11** | `Publishing` | `Analytics` (Initial row created) | `PUBLISHING`, `ANALYTICS` Sheets |
| **12** | `PlatformSync` | `Publishing` (Read) | `PLATFORM_SYNC_LOGS` Sheet |
| **13** | `Analytics` | `Publishing` (Read), Engagement metrics entered | `ANALYTICS` Sheet |
| **14** | `Analytics` | Historical aggregation records (Read) | `ANALYTICS` Sheet (Computed) |
| **15** | `Intelligence`| `Analytics` (Read), Content Strategy Recommendation | `ANALYTICS_INTELLIGENCE` Sheet |
