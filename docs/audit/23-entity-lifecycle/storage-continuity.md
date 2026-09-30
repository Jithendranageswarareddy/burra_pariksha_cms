# Storage Continuity Forensic Register

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 23 of 35  
**Document:** 22 of 35  

---

## 1. Storage Location Matrix Across Lifecycle

| Stage | Entity | Primary Google Sheet | Google Drive Location | Database / Local Cache | Authoritative Source |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **01** | `QuestionDraft` | `QUESTION_DRAFTS` | None | Local row cache | Google Sheets |
| **02** | `Question` | `QUESTIONS` | None | Local row cache | Google Sheets |
| **02** | `ContentMaster`| `CONTENT_MASTERS` | Folder hierarchy root | Local row cache | Google Sheets |
| **03** | `Script` | `SCRIPTS`, `SCRIPT_VERSIONS` | None | In-memory draft | Google Sheets |
| **04** | `Video` | `VIDEOS` | None | None | Google Sheets |
| **05** | `RawVideo` | `MEDIA_ASSETS` | `.../Videos/vd1.2.mp4` | Multer temp disk | Drive (Bytes) + Sheets (Meta) |
| **06** | `EditedVideo` | `VIDEOS` (`finalRenderPath`)| `.../Videos/final_render.mp4`| None | Drive (Bytes) + Sheets (Meta) |
| **08** | `Thumbnail` | `THUMBNAILS` | `.../Thumbnails/thumb.png` | Base64 URI | Drive (Bytes) + Sheets (Meta) |
| **09** | `SocialReview`| `SOCIAL_REVIEWS` | None | `SocialReviewService.draftCache` | Google Sheets |
| **10** | `Publishing` | `PUBLISHING` | None | None | Google Sheets |
| **12** | `PlatformSync` | `PLATFORM_SYNC_LOGS`| None | None | Google Sheets |
| **13** | `Analytics` | `ANALYTICS` (Isolated) | None | In-memory fallback | Google Sheets (`ANALYTICS_SPREADSHEET_ID`) |
| **15** | `Intelligence`| `ANALYTICS_INTELLIGENCE` | None | `Phase26CopilotService.suggestionStore` | Google Sheets |
