# Cross-Storage Data Flows

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 19 of 30  
**Document:** 14 of 35  

---

## 1. Cross-Tier Data Synchronization

BP-CMS relies on two disparate physical cloud storage systems:
1. **Google Sheets:** Authoritative for tabular metadata.
2. **Google Drive:** Authoritative for binary blobs.

### Cross-Storage Coupling Analysis:

| Flow Description | Storage Tier A | Storage Tier B | Coordination Mechanism | Failure Behavior | Consistency Model |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Video Upload** | Google Drive (Binary) | Google Sheets (`VIDEOS`) | Sequential write in route handler | If Sheets fails, file remains in Drive | Best-effort; leaves orphan Drive files |
| **Thumbnail Upload** | Google Drive (Binary) | Google Sheets (`THUMBNAILS`) | Sequential write in service | If Sheets fails, file remains in Drive | Best-effort; leaves orphan Drive files |
| **Content Master Init**| Google Sheets (`CONTENT_MASTERS`) | Google Drive (Folder) | Folder creation during pipeline | If Drive fails, folder missing | Manual reconciliation needed |
| **Deletion Pipeline** | Google Sheets (Row Delete) | Local Disk (Backup JSON) | 6-phase backup token flow | Disk file deleted on container restart | Vulnerable on stateless Cloud Run |
