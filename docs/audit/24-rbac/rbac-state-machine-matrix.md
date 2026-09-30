# RBAC to State Machine Matrix

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 24 of 41  
**Document:** 35 of 41  

---

| Current State | Target State | Authorized Roles | Enforcing Service | Verification Status |
| :--- | :--- | :--- | :--- | :---: |
| `QUEUED` | `SCRIPT_READY` | `SCRIPT_WRITER`, `ADMIN` | `script.service.ts` | **VALID** |
| `QUEUED` | `RECORDING` | `STUDIO_PRESENTER`, `ADMIN` | `video.service.ts` | **VALID** |
| `RECORDING` | `RECORDED` | `STUDIO_PRESENTER`, `ADMIN` | `video.service.ts` | **VALID** |
| `RECORDED` | `EDITING` | `VIDEO_EDITOR`, `ADMIN` | `video.service.ts` | **VALID** |
| `EDITING` | `EDITED` | `VIDEO_EDITOR`, `ADMIN` | `video.service.ts` | **VALID** |
| `EDITED` | `FINAL_REVIEW` | `VIDEO_EDITOR`, `ADMIN` | `video.service.ts` | **VALID** |
| `FINAL_REVIEW`| `READY_TO_UPLOAD`| `REVIEWER`, `ADMIN` | `video.service.ts` | **VALID** |
| `READY_TO_UPLOAD`| `UPLOADED` | `PUBLISHING_MANAGER`, `ADMIN`| `video.service.ts` | **OMITTED ON PUBLISH** |
