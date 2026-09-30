# Entity Ownership Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 15 of 30  
**Document:** 06 of 51  

---

## 1. Explicit vs Inferred Ownership Analysis

In BP-CMS, ownership is recorded inconsistently across entities:

| Entity | Dedicated Ownership Column in Sheet | Ownership Property in Type | Nature of Ownership | Owner Resolution Logic |
| :--- | :--- | :--- | :--- | :--- |
| **Question** | Column L: `created_by_user` | `createdByUser: string` | Explicit Creator | Identifies creator; no transfer mechanism |
| **Content Master** | Column G: `owner_id` | `ownerId: string` | Explicit Lead | Assigned manager responsible for container |
| **Video** | Column H: `assigned_host`, Col I: `assigned_editor` | `assignedHost`, `assignedEditor` | Operational Role | Split between presenter and video editor |
| **Script** | Column E: `author_id` | `authorId: string` | Explicit Writer | Scriptwriter assigned to draft |
| **Thumbnail** | Column E: `designer_id` | `designerId?: string` | Inferred | Optional; frequently null/empty in sheets |
| **Pinned Comment** | Column D: `author_id` | `authorId: string` | Explicit Copywriter | Copywriter submitting comment |
| **Assignment** | Column D: `assigned_user_id` | `assignedUserId: string` | Explicit Assignee | Directly binds task responsibility to User |
| **Publishing** | Column N: `published_by` | `publishedBy?: string` | Event Actor | User who authorized live publication |
| **Media Asset** | Column F: `uploaded_by` | `uploadedBy: string` | Ingestion Actor | User uploading binary file to Drive |

---

## 2. Ownership Gaps & Abandoned Entities
- If a user is deactivated (`status: INACTIVE` in `USERS` sheet), all Questions, Scripts, and Videos where they are recorded as owner remain assigned to them. BP-CMS has **no cascade re-assignment mechanism**, leaving entities orphaned until manual reassignment.
