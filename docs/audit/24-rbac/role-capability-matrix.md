# Role to Capability Matrix

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 24 of 41  
**Document:** 09 of 41  

---

| Role | Questions | Scripts | Filming | Editing | QC | Thumbnails | Social | Publishing | Analytics | Admin Tools |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **ADMIN** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** |
| **CONTENT_MANAGER** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | **ALLOW** | DENY |
| **QUESTION_CREATOR**| **ALLOW** | DENY | DENY | DENY | DENY | DENY | DENY | DENY | DENY | DENY |
| **QUESTION_EDITOR** | **ALLOW** | DENY | DENY | DENY | DENY | DENY | DENY | DENY | DENY | DENY |
| **SCRIPT_WRITER** | DENY | **ALLOW** | DENY | DENY | DENY | DENY | **ALLOW** | DENY | DENY | DENY |
| **STUDIO_PRESENTER**| DENY | DENY | **ALLOW** | DENY | DENY | DENY | DENY | DENY | DENY | DENY |
| **VIDEO_EDITOR** | DENY | DENY | DENY | **ALLOW** | DENY | DENY | DENY | DENY | DENY | DENY |
| **THUMBNAIL_DESIGNER**|DENY| DENY | DENY | DENY | DENY | **ALLOW** | DENY | DENY | DENY | DENY |
| **REVIEWER** | **ALLOW** | DENY | DENY | DENY | **ALLOW** | DENY | **ALLOW** | DENY | DENY | DENY |
| **PUBLISHING_MGR** | DENY | DENY | DENY | DENY | DENY | DENY | **ALLOW** | **ALLOW** | **ALLOW** | DENY |
| **ANALYTICS_VIEWER**| DENY | DENY | DENY | DENY | DENY | DENY | DENY | DENY | **ALLOW** | DENY |
