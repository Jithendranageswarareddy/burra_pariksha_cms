# Step 30: 05 — Authentication, RBAC & Security Blueprint

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Document Type:** Security Architecture & Access-Control Blueprint  
**Status:** **AUTHORITATIVE BLUEPRINT**  
**Date:** 2026-09-29  

---

## 1. Multi-Layer Access Control Model

To eliminate the security gaps audited in Step 24 (such as missing React Router route guards, UI-only button disabling, and un-sandboxed administrative disaster recovery), BP-CMS implements a **Zero-Trust Multi-Layer Security Architecture**.

```
+-------------------------------------------------------------------------------+
| LAYER 1: CLIENT ROUTE GUARDS (React Router)                                   |
| - RequireAuth: Redirects unauthenticated traffic to /login                   |
| - RequireRole: Prevents unauthorized component mounting (403 Unauthorized View)|
+-------------------------------------------------------------------------------+
                                    │ (HTTPS + Cookie/Bearer)
+-------------------------------------------------------------------------------+
| LAYER 2: API GATEWAY AUTHENTICATION (Express Middleware)                      |
| - HMAC-SHA256 Stateless Token Verification                                    |
| - Monotonic sessionVersion check against database (Instant Revocation)        |
+-------------------------------------------------------------------------------+
                                    │
+-------------------------------------------------------------------------------+
| LAYER 3: ROLE & CAPABILITY MIDDLEWARE                                         |
| - requireRole(['ADMIN', 'REVIEWER'])                                          |
| - requireCapability('question.verify')                                        |
+-------------------------------------------------------------------------------+
                                    │
+-------------------------------------------------------------------------------+
| LAYER 4: OBJECT-LEVEL OWNERSHIP & POLICY ENFORCEMENT (ObjectAuthService)      |
| - Creator Ownership Assertions (authorId === user.id)                        |
| - Active Assignment Verification (assignedEditorId === user.id)               |
| - Anti-Self-Approval Enforcement (reviewerId !== authorId)                   |
+-------------------------------------------------------------------------------+
```

---

## 2. Definitive Role-to-Capability Matrix

| Role | Questions | Scripts | Filming | Editing | QC Review | Thumbnail | Publishing | Analytics | System Admin |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `ADMIN` | **ALL** | **ALL** | **ALL** | **ALL** | **ALL** | **ALL** | **ALL** | **ALL** | **FULL** |
| `CONTENT_MANAGER` | **ALL** | **ALL** | View | View | Verify | Approve | Schedule/Publish | Ingest/Diagnose | None |
| `TOPIC_LEAD` | Verify | Approve | View | View | Verify | Review | View | View | None |
| `QUESTION_CREATOR` | Create/Edit (Own) | None | None | None | None | None | None | None | None |
| `REVIEWER` | Verify | Review | None | None | Verify | None | None | None | None |
| `SCRIPT_WRITER` | View | Create/Edit (Own)| View | None | None | None | None | None | None |
| `STUDIO_PRESENTER` | View | View | Film/Upload Raw | None | None | None | None | None | None |
| `VIDEO_EDITOR` | View | View | View | Edit/Cut | Submit QC | None | None | None | None |
| `THUMBNAIL_DESIGNER`| View | None | None | None | None | Create/Upload | None | None | None |
| `COMMUNITY_MANAGER`| View | None | None | None | None | View | Social Review | View | None |
| `PUBLISHING_MANAGER`| View | None | None | None | None | View | Publish / Connect | View | None |
| `ANALYTICS_VIEWER` | View | None | None | None | None | None | View | Full Access | None |

---

## 3. Cryptographic Token & Session Specification

```typescript
// Target Token Verification Architecture
export interface UserSessionPayload {
  userId: string;
  email: string;
  role: UserRole;
  sessionVersion: number;
  iat: number;
  exp: number;
}

export function generateSessionToken(user: User): string {
  const payload: UserSessionPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    sessionVersion: user.sessionVersion,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 Hours
  };
  const serialized = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', process.env.SESSION_SECRET!).update(serialized).digest('base64url');
  return `${serialized}.${signature}`;
}
```

---

## 4. Disaster Recovery & Administrative Security Controls

1. **Step-Up MFA for High-Risk Actions:** Administrative database restore (`/api/recovery/restore/*`) and user role modifications require explicit MFA challenge verification.
2. **Strict Audit Trail:** Every administrative action is logged to an immutable, append-only `security_audit_events` table with client IP, user agent, actor ID, and full request payload.
