# RBAC to 15-Stage Workflow Matrix

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 24 of 41  
**Document:** 34 of 41  

---

| Stage | Canonical Stage Name | Authoritative Role | Permitted Secondary Roles | Backend Enforced? |
| :---: | :--- | :--- | :--- | :---: |
| **01** | Question Generation | `QUESTION_CREATOR` | `CREATOR`, `CONTENT_MANAGER`, `ADMIN` | **YES** |
| **02** | Question Verification | `QUESTION_EDITOR` | `REVIEWER`, `CONTENT_MANAGER`, `ADMIN` | **YES** |
| **03** | Audience Script | `SCRIPT_WRITER` | `CONTENT_WRITER`, `CONTENT_MANAGER`, `ADMIN` | **YES** |
| **04** | Teleprompter & Filming| `STUDIO_PRESENTER` | `SPEAKER`, `CONTENT_MANAGER`, `ADMIN` | **YES** |
| **05** | Raw Video Handoff | `STUDIO_PRESENTER` | `VIDEO_EDITOR`, `ADMIN` | **YES** |
| **06** | Video Editing Bay | `VIDEO_EDITOR` | `EDITOR`, `CONTENT_MANAGER`, `ADMIN` | **YES** |
| **07** | Final QC Certification| `REVIEWER` | `CONTENT_MANAGER`, `ADMIN` | **YES** |
| **08** | Thumbnail Studio | `THUMBNAIL_DESIGNER` | `DESIGNER`, `TOPIC_LEAD`, `ADMIN` | **YES** |
| **09** | Social Review | `REVIEWER` | `COMMUNITY_MANAGER`, `ADMIN` | **YES** |
| **10** | Publishing Setup | `PUBLISHING_MANAGER` | `CONTENT_MANAGER`, `ADMIN` | **YES** |
| **11** | Published / Live | `PUBLISHING_MANAGER` | `CONTENT_MANAGER`, `ADMIN` | **YES** |
| **12** | Platform Sync | `PUBLISHING_MANAGER` | `ADMIN` | **YES** |
| **13** | Analytics Ingestion | `ANALYTICS_VIEWER` | `PUBLISHING_MANAGER`, `ADMIN` | **YES** |
| **14** | Performance Review | `ANALYTICS_VIEWER` | `CONTENT_MANAGER`, `ADMIN` | **YES** |
| **15** | Intelligence Loop | `CONTENT_MANAGER` | `ANALYTICS_VIEWER`, `ADMIN` | **YES** |
