# Identity Model Forensic Specification

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 24 of 41  
**Document:** 04 of 41  

---

## 1. Identity Representation & Attributes

The authoritative user identity entity is modeled in `src/types/index.ts` (lines 208–220):
```typescript
export interface User {
  id: string;              // Primary Identifier (e.g. USR-001)
  name: string;            // Display Name (e.g. 'Jithendra Reddy')
  email: string;           // Unique Email
  role: UserRole | string; // Primary Active Role
  roles?: (UserRole | string)[]; // Multi-Role Secondary Array
  avatarUrl?: string;
  isActive: boolean;       // Instant Deactivation Flag
  password_hash?: string;  // Native scrypt hash
  sessionVersion?: number; // Monotonically increasing session invalidator
  last_login_at?: string;
  createdAt: string;
  updatedAt: string;
}
```

---

## 2. Multi-Role Architecture

The system supports both single primary role and composite secondary roles (`roles?: string[]`). When `requireRole` evaluates permissions:
```typescript
const userRoles = [user.role, ...(user.roles || [])];
const isAllowed = isAdmin || userRoles.some(r => allowedRoles.includes(r));
```
