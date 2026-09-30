# Entity Updater Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 15 of 30  
**Document:** 08 of 51  

---

## 1. Update Path Dissection

Updates in BP-CMS fall into three distinct operational categories:
1. **Content Updates:** Modifying text, options, explanations, prompts, URLs.
2. **Workflow / Status Updates:** Transitioning lifecycle enums.
3. **Metadata / System Updates:** Modifying timestamps, version counters, review scores.

---

## 2. Master Entity Update Matrix

| Entity | Content Update Route | Status Transition Route | Authorized Roles | Enforced Preconditions |
| :--- | :--- | :--- | :--- | :--- |
| **Question** | `PUT /api/questions/:id` | `PATCH /api/questions/:id/status` | `QUESTION_EDITOR`, `SME`, `ADMIN` | Cannot edit question if video in production |
| **Content Master** | `PUT /api/content-masters/:id` | `POST /api/content-masters/:id/transition`| `TOPIC_LEAD`, `ADMIN` | All children must reach prerequisite states |
| **Video** | `PUT /api/videos/:id` | `PATCH /api/videos/:id/status` | `VIDEO_EDITOR`, `LEAD`, `ADMIN` | Must satisfy `VALID_VIDEO_TRANSITIONS` |
| **Script** | `POST /api/videos/:id/script` | `POST /api/videos/:id/script/mark-ready` | `SCRIPT_WRITER`, `SME`, `ADMIN` | Target duration <= 180s |
| **Thumbnail** | `POST /api/videos/:id/thumbnail`| `PATCH /api/thumbnails/:id/status` | `CONTENT_MANAGER`, `ADMIN` | Image URL must be valid Drive/GCS link |
| **Pinned Comment** | `POST /api/videos/:id/pinned-comment`| `PATCH /api/pinned-comments/:id/status`| `CONTENT_MANAGER`, `ADMIN` | Non-empty text |
| **Assignment** | `PATCH /api/assignments/:id` | `POST /api/assignments/:id/start|complete`| `ASSIGNEE`, `LEAD`, `ADMIN` | Target transition valid in state machine |
| **Publishing** | `PUT /api/publishing/:id` | `POST /api/videos/:id/publishing/schedule`| `PUBLISHER`, `ADMIN` | Gate F & G must evaluate to true |
| **User** | `PATCH /api/users/:id` | `PATCH /api/users/:id` (`status`) | `ADMIN` | Email cannot be modified |
