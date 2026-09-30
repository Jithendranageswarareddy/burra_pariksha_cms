# Action Authorization Forensic Matrix

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 24 of 41  
**Document:** 21 of 41  

---

| Action | Allowed Roles | Backend Guard | API Endpoint | Enforcement Verdict |
| :--- | :--- | :--- | :--- | :---: |
| **Create Question Draft** | `CREATOR`, `QUESTION_CREATOR`, `ADMIN` | `requireAuth` | `POST /api/question-drafts` | **SECURE** |
| **Approve Question** | `REVIEWER`, `CONTENT_MANAGER`, `ADMIN` | `requireRole`, `objectAuth` | `POST /api/questions/create-from-draft` | **SECURE** |
| **Save Script** | `SCRIPT_WRITER`, `CREATOR`, `ADMIN` | `requireAuth`, `objectAuth` | `POST /api/scripts` | **SECURE** |
| **Start Filming** | `STUDIO_PRESENTER`, `SPEAKER`, `ADMIN`| `requireAuth` | `PATCH /api/videos/:id/status` | **SECURE** |
| **Upload Raw Video** | `STUDIO_PRESENTER`, `ADMIN` | `requireAuth` | `POST /api/videos/:id/upload-raw` | **SECURE** |
| **Save Master Cut** | `VIDEO_EDITOR`, `EDITOR`, `ADMIN` | `requireAuth`, `objectAuth` | `PATCH /api/videos/:id/status` | **SECURE** |
| **Approve Final QC** | `REVIEWER`, `CONTENT_MANAGER`, `ADMIN` | `requireRole`, `objectAuth` | `PATCH /api/videos/:id/status` | **SECURE** |
| **Approve Thumbnail** | `DESIGNER`, `TOPIC_LEAD`, `ADMIN` | `requireAuth` | `POST /api/thumbnails` | **SECURE** |
| **Approve Social Review**| `REVIEWER`, `ADMIN` | `requireRole` | `POST /api/social-reviews/:id/approve` | **SECURE** |
| **Schedule Publishing**| `PUBLISHING_MANAGER`, `ADMIN` | `requireRole` | `POST /api/publishing/schedule` | **SECURE** |
| **Mark Published** | `PUBLISHING_MANAGER`, `ADMIN` | `requireRole` | `POST /api/publishing/mark-published` | **SECURE** |
| **Synthesize AI Flywheel**| `ANALYTICS_VIEWER`, `ADMIN` | `requireRole`, `aiRateLimiter`| `POST /api/intelligence/generate` | **SECURE** |
| **Full Snapshot Restore**| `ADMIN` Only | `requireRole([ADMIN])` | `POST /api/recovery/restore/full` | **ADMIN ONLY** |
