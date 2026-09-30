# API Authorization Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 24 of 41  
**Document:** 15 of 41  

---

## 1. Middleware Authorization Enforcement

In `src/server/middleware/auth.middleware.ts`:
```typescript
export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const userRoles = [req.user.role, ...(req.user.roles || [])];
    const isAdmin = userRoles.includes(UserRole.ADMIN) || userRoles.includes('ADMIN');
    const isAllowed = isAdmin || userRoles.some((r) => allowedRoles.includes(r));
    if (!isAllowed) {
      return res.status(403).json({ success: false, error: 'Forbidden: Insufficient role permissions.' });
    }
    next();
  };
}
```
