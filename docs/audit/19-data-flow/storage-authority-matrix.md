# Storage Authority Matrix

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 19 of 30  
**Document:** 04 of 35  

---

## 1. Matrix of Business Entities Across Storage Subsystems

The following matrix classifies how every major entity is represented across storage subsystems:

| Business Entity | Google Sheets | Database (SQL) | Google Drive | Frontend State | Memory Cache | Authoritative Location | Representation Type |
| :--- | :---: | :---: | :---: | :---: | :---: | :--- | :--- |
| **Question** | **AUTHORITATIVE** | NOT PRESENT | NOT PRESENT | CACHE | CACHE (2.5s) | Google Sheets (`QUESTIONS`) | AUTHORITATIVE |
| **Question Draft** | **AUTHORITATIVE** | NOT PRESENT | NOT PRESENT | CACHE | NOT PRESENT | Google Sheets (`QUESTION_DRAFTS`) | AUTHORITATIVE |
| **Content Master** | **AUTHORITATIVE** | NOT PRESENT | REFERENCE | NOT PRESENT | NOT PRESENT | Google Sheets (`CONTENT_MASTERS`)| AUTHORITATIVE |
| **Script Text** | **AUTHORITATIVE** | NOT PRESENT | NOT PRESENT | CACHE | NOT PRESENT | Google Sheets (`SCRIPTS`) | AUTHORITATIVE |
| **Script Versions** | **AUTHORITATIVE** | NOT PRESENT | NOT PRESENT | NOT PRESENT | NOT PRESENT | Google Sheets (`SCRIPT_VERSIONS`)| AUTHORITATIVE |
| **Video Production Record**| **AUTHORITATIVE** | NOT PRESENT | NOT PRESENT | CACHE | NOT PRESENT | Google Sheets (`VIDEOS`) | AUTHORITATIVE |
| **Raw Video Binary** | REFERENCE | NOT PRESENT | **AUTHORITATIVE** | NOT PRESENT | NOT PRESENT | Google Drive (`Videos/`) | AUTHORITATIVE |
| **Edited Video Binary** | REFERENCE | NOT PRESENT | **AUTHORITATIVE** | NOT PRESENT | NOT PRESENT | Google Drive (`Edited/`) | AUTHORITATIVE |
| **Media Asset Record** | **AUTHORITATIVE** | NOT PRESENT | REFERENCE | NOT PRESENT | NOT PRESENT | Google Sheets (`MEDIA_ASSETS`) | AUTHORITATIVE |
| **Thumbnail Record** | **AUTHORITATIVE** | NOT PRESENT | REFERENCE | CACHE | NOT PRESENT | Google Sheets (`THUMBNAILS`) | AUTHORITATIVE |
| **Thumbnail Binary** | REFERENCE | NOT PRESENT | **AUTHORITATIVE** | DATA_URI | NOT PRESENT | Google Drive (`Thumbnails/`) | AUTHORITATIVE |
| **Pinned Comment** | **AUTHORITATIVE** | NOT PRESENT | NOT PRESENT | CACHE | NOT PRESENT | Google Sheets (`PINNED_COMMENTS`) | AUTHORITATIVE |
| **Social Review Package**| **AUTHORITATIVE** | NOT PRESENT | NOT PRESENT | CACHE | CACHE (`draftCache`)| Google Sheets (`SOCIAL_REVIEWS`) | AUTHORITATIVE |
| **Publishing Record** | **AUTHORITATIVE** | NOT PRESENT | NOT PRESENT | CACHE | NOT PRESENT | Google Sheets (`PUBLISHING`) | AUTHORITATIVE |
| **Analytics Snapshot**| **AUTHORITATIVE** | NOT PRESENT | NOT PRESENT | CACHE | NOT PRESENT | Google Sheets (`ANALYTICS`) | AUTHORITATIVE |
| **Performance Intelligence**| **AUTHORITATIVE** | NOT PRESENT | NOT PRESENT | CACHE | NOT PRESENT | Google Sheets (`ANALYTICS_INT`) | AUTHORITATIVE |
| **User Identity & Role** | **AUTHORITATIVE** | NOT PRESENT | NOT PRESENT | TOKEN | NOT PRESENT | Google Sheets (`USERS`) | AUTHORITATIVE |
| **User Session Validity**| REPLICA | NOT PRESENT | NOT PRESENT | TOKEN | **AUTHORITATIVE** | In-Memory (`userSessionStates`) | AUTHORITATIVE |
| **Sequence ID Allocation**| REPLICA | NOT PRESENT | NOT PRESENT | NOT PRESENT | **AUTHORITATIVE** | In-Memory Mutex + Sheets Row | DUAL / CONFLICT |
| **Workflow State Log** | **AUTHORITATIVE** | NOT PRESENT | NOT PRESENT | NOT PRESENT | NOT PRESENT | Google Sheets (`WORKFLOW_TRANS`) | AUTHORITATIVE |
| **Audit Trail Log** | **AUTHORITATIVE** | NOT PRESENT | NOT PRESENT | NOT PRESENT | NOT PRESENT | Google Sheets (`AUDIT_LOGS`) | AUTHORITATIVE |
| **Category Taxonomy** | **AUTHORITATIVE** | NOT PRESENT | NOT PRESENT | CACHE | CACHE (60s) | Google Sheets (`CATEGORIES`) | AUTHORITATIVE |
| **Topic Taxonomy** | **AUTHORITATIVE** | NOT PRESENT | NOT PRESENT | CACHE | CACHE (60s) | Google Sheets (`TOPICS`) | AUTHORITATIVE |
| **Subtopic Taxonomy** | **AUTHORITATIVE** | NOT PRESENT | NOT PRESENT | CACHE | CACHE (60s) | Google Sheets (`SUBTOPICS`) | AUTHORITATIVE |

---

## 2. Key Observations on Storage Authority

1. **Zero SQL Representation:** Relational database columns confirm zero active presence across all 24 entities.
2. **Binary vs Tabular Split:** Google Drive exclusively owns media byte blobs; Google Sheets exclusively owns metadata records.
3. **Volatile Authority Vulnerability:** User session validity and Sequence ID mutexes reside in Node.js volatile process memory rather than an external distributed cache (e.g. Redis/Valkey).
