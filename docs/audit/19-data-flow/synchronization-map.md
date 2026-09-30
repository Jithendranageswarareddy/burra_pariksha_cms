# System Synchronization Map

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 19 of 30  
**Document:** 16 of 35  

---

## 1. Synchronization Mechanics & Failure Profiles

| Synchronization Link | Trigger | Mechanism | Frequency | Failure Handling | Stale Window | Recovery Path |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Video.status -> Question.videoStatus** | Status Transition | Direct repository update | On change | Error swallowed in catch block | Permanent if failed | Manual script or re-queue |
| **Sheets Row -> In-Memory Row Cache** | Time / Read | Cache eviction / TTL | 2.5 seconds | Automatic expiry | Up to 2,500 ms | Automatic reload on next read |
| **Google Sheets -> Local Disk Backup** | Record Delete | Local file write | On deletion | Aborts deletion if backup fails | N/A (Atomic check) | Re-attempt deletion |
| **Google Drive File -> Sheets driveFileId** | File Upload | Multipart upload then sheet update | On upload | Catch block logs error; file remains in Drive | Permanent if failed | Orphan cleanup script |
| **Social Review AI -> SOCIAL_REVIEWS Sheet** | Review Generate | Draft cache then sheet persist | On review | Retained in memory Map | Until process restart | Regenerate review package |
