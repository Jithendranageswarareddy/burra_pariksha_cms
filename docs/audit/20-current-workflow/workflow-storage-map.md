# Workflow Storage Mapping

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 20 of 30  
**Document:** 21 of 41  

---

## 1. Storage of State and Metadata Across Stages

| Stage | Authoritative Storage | Replicated Storage | Ephemeral / Cache |
| :---: | :--- | :--- | :--- |
| **01** | `QUESTION_DRAFTS` Sheet | None | Form state in `QuestionStudioPage` |
| **02** | `QUESTIONS` + `CONTENT_MASTERS` | `VALIDATIONS` Sheet | Row cache (2.5s) |
| **03** | `SCRIPTS` + `SCRIPT_VERSIONS` | Embedded JSON in `SCRIPTS` | Script editor buffer |
| **04** | `VIDEOS` Sheet (`RECORDING`) | None | Teleprompter scroll state |
| **05** | Google Drive API v3 (MP4 bytes) | `VIDEOS` (`driveFileId`) | Stream buffer |
| **06** | Google Drive API v3 (Final cut) | `VIDEOS` (`finalRenderPath`)| Stream buffer |
| **07** | `VIDEOS` Sheet (`READY_TO_UPLOAD`)| None | QC sign-off UI state |
| **08** | Google Drive (Image) + `THUMBNAILS`| `Publishing.thumbnailReady` | Data URI preview |
| **09** | `SOCIAL_REVIEWS` Sheet | `SocialReviewService.draftCache`| 9:16 simulator iframe |
| **10** | `PUBLISHING` Sheet | None | Schedule datetime picker |
| **11** | `PUBLISHING` Sheet (`PUBLISHED`)| `ANALYTICS` (Init row) | Platform URL regex check |
| **12** | `PLATFORM_SYNC_LOGS` Sheet | None | Sync status chip |
| **13** | `ANALYTICS` Sheet | Aggregation views | Metric input form |
| **14** | `ANALYTICS` Sheet (Computed) | None | Chart rendering buffers |
| **15** | `ANALYTICS_INTELLIGENCE` Sheet | AI Strategy recommendations | Suggestion drawer |
