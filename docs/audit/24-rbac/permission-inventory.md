# Permission Inventory Forensic Register

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 24 of 41  
**Document:** 08 of 41  

---

## 1. Permission Evaluation Layers

Permissions are enforced at three distinct architectural layers:
1. **Frontend Route Gates (`App.tsx`):** Binary gate checking `if (!user) return <LoginPage />`.
2. **REST API Middleware (`routes.ts`):** Explicit `requireAuth` and `requireRole([UserRole.A, UserRole.B])`.
3. **Object-Level Authorization (`objectAuthService.ts`):** Fine-grained checks based on resource assignment, author ID, host ID, editor ID, and role.
