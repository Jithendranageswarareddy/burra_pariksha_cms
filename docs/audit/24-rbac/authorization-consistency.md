# Authorization Consistency Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 24 of 41  
**Document:** 28 of 41  

---

## 1. Multi-Layer Consistency Audit

| Action | UI Guard | Route Guard | API Middleware | Service Guard | Consistent? |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Draft Question** | Sidebar visible | Logged in | `requireAuth` | Validates schema | **YES** |
| **Verify Question** | Sidebar visible | Logged in | `requireRole` | `approveQuestion: ADMIN/MGR` | **YES** |
| **Edit Video** | Workspace tab | Logged in | `requireAuth` | `objectAuth: assignedEditor` | **YES** |
| **Schedule Publish** | Sidebar visible | Logged in | `requireRole` | `validatePublishReadiness` | **YES** |
| **Full Restore** | Link hidden | `isAdmin` | `requireRole([ADMIN])`| `restoreExecutionService` | **YES** |
