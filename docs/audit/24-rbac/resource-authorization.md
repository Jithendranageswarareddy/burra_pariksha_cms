# Resource-Level Authorization Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 24 of 41  
**Document:** 18 of 41  

---

## 1. Object Authorization Engine (`src/lib/services/object-auth.service.ts`)

The application implements fine-grained object-level access control:
- **Questions:** Can be modified by author (`question.authorId === actor.id`), active assignment holder, or Admin.
- **Videos:** Can be modified by `assignedHost`, `assignedEditor`, active task assignee, or Admin.
- **Scripts:** Can be modified by script writer assignment or Admin.
- **Self-Approval Protection:** A reviewer cannot approve a video or script if they are the designated host, editor, or author.
