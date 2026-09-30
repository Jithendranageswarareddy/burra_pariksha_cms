# Entity Source-of-Truth Matrix

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 15 of 30  
**Document:** 43 of 51  

---

## 1. Authoritative Source of Truth Matrix

| Entity | Primary ID Scheme | Source of Truth | Physical Storage | Replicas / Caches | Synchronization Mechanism |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Question** | `BP-Q-XXXXXX` | Google Sheets (`QUESTIONS`) | Google Sheets | Local memory cache, UI query | Polling / React Query cache |
| **Draft Question** | `BP-DFT-XXXXXX`| Application Memory | In-Memory / LocalStorage | None | Ephemeral session state |
| **Content Master** | `BP-CNT-XXXXXX`| Google Sheets (`CONTENT_MASTERS`)| Google Sheets | UI state | Polling / manual refresh |
| **Script** | `BP-S-XXXXXX` | Google Sheets (`SCRIPT`) | Google Sheets | Version tab (`SCRIPT_VERSIONS`)| Transactional append |
| **Video (Meta)** | `BP-V-XXXXXX` | Google Sheets (`VIDEOS`) | Google Sheets | `Question.videoStatus` | Unreliable multi-sheet writes |
| **Video (Raw Take)**| `driveFileId` | Google Drive File Blob | Google Drive | Stream URL in Sheets | Direct Drive API queries |
| **Video (Cut Render)**| `editedDriveId`| Google Drive File Blob | Google Drive | Stream URL in Sheets | Direct Drive API queries |
| **Thumbnail** | `BP-T-XXXXXX` | Google Sheets + Google Drive | Sheets + Drive | Candidate memory store | Dual-write on approval |
| **Publishing** | `PUB-XXXXXX` | External YouTube/IG APIs | Google Sheets (`PUBLISHING`)| Polled metrics & status | Platform webhook / polling sync |
| **Social Analytics**| `BP-ANL-XXXXXX`| External YouTube API | Computed / Derived | Daily snapshot sheet | Periodic harvesting job |
| **User** | `USR-XXX` | Google Sheets (`USERS`) | Google Sheets | Signed JWT Session Cookie | Verified on every HTTP request |
| **Sequence** | Entity Name string | Google Sheets (`SEQUENCES`) | Google Sheets | In-memory Promise mutex | Mutex serialize + Sheets flush |
