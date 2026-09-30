# Role Security Entity Forensic Dossier

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 15 of 30  
**Document:** 21 of 51  

---

## 1. Role Representation Analysis

- **Classification:** Security / Access Entity
- **Physical Storage:** Hardcoded string enum in codebase (`src/types/index.ts:1010–1040`) + column D in `USERS` sheet tab.
- **Is Role a Database Table?** **NO.** There is no `ROLES` worksheet or database table. Roles exist purely as enumerated constants:

```typescript
export enum UserRole {
  ADMIN = 'ADMIN',
  PUBLISHER = 'PUBLISHER',
  CONTENT_MANAGER = 'CONTENT_MANAGER',
  TOPIC_LEAD = 'TOPIC_LEAD',
  QUESTION_CREATOR = 'QUESTION_CREATOR',
  QUESTION_EDITOR = 'QUESTION_EDITOR',
  TELUGU_TRANSLATOR = 'TELUGU_TRANSLATOR',
  STUDIO_PRESENTER = 'STUDIO_PRESENTER',
  SCRIPT_WRITER = 'SCRIPT_WRITER',
  VIDEO_EDITOR = 'VIDEO_EDITOR',
}
```

---

## 2. Inflexible Role Schema Limitations
Because roles are hardcoded enums rather than a dynamic database entity, adding a new role (e.g. "QC_DIRECTOR") requires modifying TypeScript source code and redeploying the application, rather than adding a row to a permissions table.
