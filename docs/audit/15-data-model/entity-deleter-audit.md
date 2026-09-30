# Entity Deletion & Archival Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 15 of 30  
**Document:** 09 of 51  

---

## 1. Hard Deletion vs Soft Deletion vs Archival

Static analysis reveals that **BP-CMS almost entirely prohibits physical hard deletion** from Google Sheets:

| Entity | Hard Deletion Supported? | Soft Deletion / Archive Supported? | Deletion Route | Authorization | Cascading Effects |
| :--- | :---: | :---: | :--- | :--- | :--- |
| **Question** | NO | **YES** (`status: ARCHIVED`) | `POST /api/questions/:id/archive` | `ADMIN` | Blocked if active videos linked |
| **Content Master** | NO | **YES** (`status: ARCHIVED`) | `POST /api/content-masters/:id/archive` | `ADMIN` | Cascades soft-archive to children |
| **Video** | NO | **YES** (`status: CANCELLED`) | `PATCH /api/videos/:id/status` | `LEAD`, `ADMIN` | Permanent; cannot be restored |
| **Script** | NO | NO (Versions appended) | None | N/A | Retained permanently |
| **Thumbnail** | NO | NO (Candidates rejected) | None | N/A | Retained permanently |
| **Assignment** | NO | **YES** (`status: CANCELLED`) | `POST /api/assignments/:id/cancel` | `LEAD`, `ADMIN` | Cancels task, frees assignee |
| **User** | NO | **YES** (`status: INACTIVE`) | `PATCH /api/users/:id` | `ADMIN` | Revokes login / token validation |
| **Draft Question** | **YES** | NO | `DELETE /api/questions/draft/:id` | `USER` | Purges ephemeral draft from cache |
| **Drive Binary Files**| **YES** | NO | `DELETE /api/media/:fileId` | `ADMIN` | Permanently deletes file in Drive |

---

## 2. Hard Deletion Safety Risk on Drive Media
While Google Sheets records are preserved via soft-deletion, `src/server/routes.ts:1920` exposes a Drive deletion endpoint that calls `drive.files.delete({ fileId })`. If executed, the physical binary video is permanently destroyed while the corresponding row in `VIDEOS` continues to point to the deleted Drive file ID.
