# Stage-to-Storage Mapping Matrix

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 21 of 30  
**Document:** 22 of 31  

---

## 1. Physical Storage Subsystems Across Stages

| Stage | Google Sheets Worksheet | Database (SQL) | Google Drive Folder | In-Memory / Ephemeral | Authoritative Source |
| :---: | :--- | :---: | :--- | :--- | :--- |
| **01** | `QUESTION_DRAFTS` | 0 SQL | None | React state in Studio | Google Sheets (`QUESTION_DRAFTS`) |
| **02** | `QUESTIONS` + `CONTENT_MASTERS` | 0 SQL | None | Row cache (2.5s) | Google Sheets (`QUESTIONS`) |
| **03** | `SCRIPTS` + `SCRIPT_VERSIONS` | 0 SQL | None | Editor state | Google Sheets (`SCRIPTS`) |
| **04** | `VIDEOS` Sheet | 0 SQL | None | Prompter state | Google Sheets (`VIDEOS`) |
| **05** | `VIDEOS` + `MEDIA_ASSETS` | 0 SQL | `Videos` / `vd1.1.mp4` | Streaming buffer | Google Drive (Bytes) + Sheets (Meta)|
| **06** | `VIDEOS` Sheet | 0 SQL | `Edited` / Final Cut | Streaming buffer | Google Drive (Bytes) + Sheets (Meta)|
| **07** | `VIDEOS` Sheet | 0 SQL | None | QC checklist form | Google Sheets (`VIDEOS`) |
| **08** | `THUMBNAILS` + `VERSIONS` | 0 SQL | `Thumbnails` Folder | Data URI preview | Google Drive (Bytes) + Sheets (Meta)|
| **09** | `SOCIAL_REVIEWS` | 0 SQL | None | `draftCache` Map | Google Sheets (`SOCIAL_REVIEWS`) |
| **10** | `PUBLISHING` | 0 SQL | None | Scheduling picker | Google Sheets (`PUBLISHING`) |
| **11** | `PUBLISHING` + `ANALYTICS` | 0 SQL | None | Live URL input | Google Sheets (`PUBLISHING`) |
| **12** | `PLATFORM_SYNC_LOGS` | 0 SQL | None | Simulated chip | Google Sheets (`PLATFORM_SYNC_LOGS`)|
| **13** | `ANALYTICS` | 0 SQL | None | Metric form | Google Sheets (`ANALYTICS`) |
| **14** | `ANALYTICS` (Computed) | 0 SQL | None | Chart buffers | Google Sheets (`ANALYTICS`) |
| **15** | `ANALYTICS_INTELLIGENCE` | 0 SQL | None | AI advice drawer | Google Sheets (`ANALYTICS_INT`) |
