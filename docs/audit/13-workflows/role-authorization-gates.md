# Role-Based Workflow Authorization Gates

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 13 of 30  
**Document:** 22 of 30  

---

## 1. Role-Guarded State Transitions

BP-CMS enforces role-based authorization across 48 distinct workflow actions using the `requireRole()` Express middleware and `objectAuthService.verifyAction()`:

```
SUPER_ADMIN > ADMIN > MANAGER > SME > LEAD > EDITOR / HOST / ASSIGNEE > VIEWER
```

---

## 2. RBAC Transition Matrix

| Workflow Transition | Minimum Authorized Role | Enforcement Layer | Bypassed by Admin Override? |
| :--- | :--- | :--- | :---: |
| Draft Question -> Approved Question | `SME`, `LEAD` | Route & Service | Yes (`UserRole.ADMIN`) |
| Queue Approved Question to Video | `LEAD`, `MANAGER` | Route Middleware | Yes |
| Script Draft -> Script Approved | `SME`, `LEAD` | Route Middleware | Yes |
| Raw Video Upload -> Editing Transition| `EDITOR`, `LEAD` | Route Middleware | Yes |
| Edited Video -> Final QC Sign-off | `LEAD`, `MANAGER` | Route Middleware | Yes |
| Final QC -> Ready to Upload | `LEAD`, `ADMIN` | Service Invariant | Yes |
| Social Review Approval | `LEAD`, `MANAGER` | `SocialReviewService` | Yes |
| Schedule & Publish Live Social Post | `LEAD`, `ADMIN` | Route Middleware | Yes |
| Archive Question or Content Master | `ADMIN`, `SUPER_ADMIN` | ObjectAuthService | No (Requires explicit Admin) |
| Hard Sequence Safety Override | `SUPER_ADMIN` | `sequenceSafetyService`| No (Strict Super Admin) |
