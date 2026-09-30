# Master Source-of-Truth Architectural Map

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 15 of 30  
**Document:** 31 of 51  

---

## 1. Storage Location vs Source of Truth

An architectural invariant is that a storage location is not necessarily the authoritative source of truth.

| Entity Class | Physical Storage Location | Authoritative Source of Truth | Replicas / Caches | Sync Direction |
| :--- | :--- | :--- | :--- | :--- |
| **Questions** | Google Sheets: `QUESTIONS` | Google Sheets (`QUESTIONS`) | Local Memory Cache, UI React Query | Sheets -> Cache |
| **Videos (Meta)** | Google Sheets: `VIDEOS` | Google Sheets (`VIDEOS`) | UI React State, `Question.videoStatus` | Sheets -> UI / Secondary Sheet |
| **Video (Raw Take)**| Google Drive: `RAW` folder | Google Drive File Blob | Stream URL, Drive file ID in Sheets | Drive -> Sheets |
| **Video (Cut Render)**| Google Drive: `EDITED` folder| Google Drive File Blob | Stream URL, Drive file ID in Sheets | Drive -> Sheets |
| **Thumbnails** | Google Sheets + Google Drive | Google Drive (Binary) + Sheets (Meta)| Ephemeral Candidate Memory Cache | Drive/Sheets -> Memory |
| **Publishing State**| Google Sheets: `PUBLISHING` | External Platform APIs (YouTube/IG)| Google Sheets `PUBLISHING` row | External API -> Sheets |
| **Analytics** | Google Sheets + Derived | External Platform APIs | Computed In-Memory Aggregations | Platform API -> Derived |
| **Users / Auth** | Google Sheets: `USERS` | Google Sheets (`USERS`) | JWT Signed Session Bearer Token | Sheets -> JWT |
| **Sequences** | Google Sheets: `SEQUENCES` | Google Sheets (`SEQUENCES`) | In-Memory Mutex Counter | Sheets <-> Mutex |
