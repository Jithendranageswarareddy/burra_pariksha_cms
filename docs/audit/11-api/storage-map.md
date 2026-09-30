# Storage System Forensic Map

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 11 of 30  
**Document:** 11 of 30  

---

## 1. Storage Systems Overview

BP-CMS utilizes four distinct storage subsystems:
1. **Google Sheets (Primary Operational Database)**: 18 authoritative tabs storing all relational entity data.
2. **Google Drive (Binary Media Asset Store)**: Cloud storage folders for raw video recordings, final edited cuts, and exported thumbnails.
3. **Local Filesystem / GCS (Disaster Recovery Archive)**: JSON snapshot files representing point-in-time database backups.
4. **Browser LocalStorage / In-Memory Cache**: Active user session tokens, local UI drafts, and transient filter settings.

---

## 2. Storage System Distribution across Endpoints

| Storage System | Endpoints Utilizing | Percentage of API | Persistence Guarantee |
| :--- | :---: | :---: | :--- |
| **Google Sheets** | 214 endpoints | 79.0% | Persistent (Google Cloud Sheets API) |
| **Google Drive** | 18 endpoints | 6.6% | Persistent (Google Drive API v3) |
| **Local Filesystem / Snapshots**| 14 endpoints | 5.2% | Persistent (Server volume / Cloud Storage) |
| **In-Memory / Session Only** | 25 endpoints | 9.2% | Ephemeral (Lost on process restart) |
