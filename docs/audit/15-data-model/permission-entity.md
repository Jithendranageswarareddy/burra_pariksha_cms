# Permission Security Entity Forensic Dossier

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 15 of 30  
**Document:** 22 of 51  

---

## 1. Permission Representation Analysis

- **Classification:** Security / Access Entity
- **Physical Storage:** Code constants in `src/lib/services/object-auth.service.ts` and `src/server/middleware/auth.middleware.ts`.
- **Is Permission a Database Table?** **NO.** Permissions do not exist as persistent rows. They are procedural switch statements evaluated at runtime:

```typescript
// Procedural check in auth.middleware.ts:
if (!allowedRoles.includes(user.role)) {
  return res.status(403).json({ error: 'Forbidden' });
}
```

---

## 2. Lack of Fine-Grained ACLs
BP-CMS lacks an Access Control List (ACL) data model. Permissions cannot be granted per-record or per-topic; an `ADMIN` or `TOPIC_LEAD` has identical global permissions across every syllabus topic and video.
