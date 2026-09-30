# Entity Reader & Visibility Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 15 of 30  
**Document:** 07 of 51  

---

## 1. Access Control & Reader Scopes

| Entity | Read API Route | Minimum Role Enforced | Tenant / Team Scope | Publicly Visible Fields |
| :--- | :--- | :--- | :--- | :--- |
| **Question** | `GET /api/questions`, `GET /api/questions/:id` | `VIEWER` (Any Auth) | Global (All users) | Title, options, explanation, category |
| **Content Master** | `GET /api/content-masters` | `VIEWER` (Any Auth) | Global | Aggregate status, title, child counts |
| **Video** | `GET /api/videos`, `GET /api/videos/:id` | `VIEWER` (Any Auth) | Global | Video status, Drive links, assignments |
| **Script** | `GET /api/videos/:id/script` | `VIEWER` (Any Auth) | Global | Script copy, target duration, versions |
| **Thumbnail** | `GET /api/videos/:id/thumbnail` | `VIEWER` (Any Auth) | Global | Image URL, concept prompt, status |
| **Pinned Comment** | `GET /api/videos/:id/pinned-comment`| `VIEWER` (Any Auth) | Global | Text, hashtags, links, status |
| **Social Review** | `GET /api/social-review/:id` | `SME`, `LEAD`, `ADMIN` | Role-Guarded | Quality scores, review comments |
| **Publishing** | `GET /api/publishing` | `LEAD`, `ADMIN` | Role-Guarded | Live platform URLs, schedules |
| **User** | `GET /api/users` | `ADMIN` | Restricted | Email, name, role, status |
| **Audit Log** | `GET /api/audit-logs` | `ADMIN` | Restricted | Actor ID, IP, action details |
| **Sequence** | Internal only (No API route) | System / Super Admin | Internal Only | Next sequence numbers |
