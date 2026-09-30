# Database Source-of-Truth Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 17 of 30  
**Document:** 20 of 39  

---

## 1. Storage Tier Authority Classification

Every domain entity was audited across all physical storage tiers to determine the authoritative Source of Truth (SoT):

| Domain Entity | Google Sheets Role | Google Drive Role | In-Memory / Cache Role | Authoritative Source of Truth |
| :--- | :---: | :---: | :---: | :---: |
| **Questions** | **AUTHORITATIVE** | None | Read Cache | **Google Sheets (`QUESTIONS`)** |
| **Topics & Categories** | **AUTHORITATIVE** | None | Read Cache | **Google Sheets (`TOPICS`, `CATEGORIES`)** |
| **Videos (Metadata)** | **AUTHORITATIVE** | None | Read Cache | **Google Sheets (`VIDEOS`)** |
| **Videos (Raw Footage)**| Reference (URL/ID) | **AUTHORITATIVE** | None | **Google Drive (Folder `raw/`)** |
| **Videos (Final MP4)** | Reference (URL/ID) | **AUTHORITATIVE** | CDN/Stream | **Google Drive (Folder `final/`)** |
| **Scripts** | **AUTHORITATIVE** | None | None | **Google Sheets (`SCRIPT`)** |
| **Thumbnails (Metadata)**| **AUTHORITATIVE** | None | None | **Google Sheets (`THUMBNAILS`)** |
| **Thumbnails (Images)** | Reference (URL/ID) | **AUTHORITATIVE** | Static Cache | **Google Drive (Folder `thumbnails/`)** |
| **Assignments** | **AUTHORITATIVE** | None | None | **Google Sheets (`ASSIGNMENTS`)** |
| **Publishing Records** | **AUTHORITATIVE** | None | None | **Google Sheets (`PUBLISHING`)** |
| **Audit Logs** | **AUTHORITATIVE** | None | None | **Google Sheets (`AUDIT_LOG`)** |
| **Sequences** | **AUTHORITATIVE** | None | None | **Google Sheets (`SEQUENCES`)** |
| **Social Analytics** | **AUTHORITATIVE** | None | In-Memory Aggregate| **Google Sheets 2 (`SOCIAL_ANALYTICS`)** |
| **User Identities** | **AUTHORITATIVE** | None | Session Store | **Google Sheets (`USERS`)** |

---

## 2. Key Forensic Conclusion
- **Google Sheets is the single Source of Truth for all structured tabular business data.**
- **Google Drive is the single Source of Truth for all binary media assets.**
- **Zero data is stored in or sourced from a relational SQL database.**
