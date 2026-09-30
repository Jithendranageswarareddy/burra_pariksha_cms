# Ownership Authorization Forensic Specification

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 24 of 41  
**Document:** 19 of 41  

---

## 1. Ownership Enforcement Fields

| Entity | Ownership Field | Evaluated By | Bypass Condition |
| :--- | :--- | :--- | :--- |
| `Question` | `authorId` | `objectAuthService.canModifyQuestion` | Role is `ADMIN` or `CONTENT_MANAGER` |
| `Video` | `assignedHost`, `assignedEditor` | `objectAuthService.canModifyVideo` | Role is `ADMIN` or `CONTENT_MANAGER` |
| `ContentMaster` | `createdBy` | `objectAuthService.canModifyContentMaster` | Role is `ADMIN` or `CONTENT_MANAGER` |
| `User` | `id` | `objectAuthService.canModifyUser` | Role is `ADMIN` |
