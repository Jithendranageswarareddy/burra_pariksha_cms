# Database Constraint Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 17 of 30  
**Document:** 11 of 39  

---

## 1. Storage-Level Constraint Audit

A forensic examination of Google Sheets persistence reveals **ZERO storage-tier constraints**:
- **NOT NULL Constraints:** None. Cells may be left blank or undefined.
- **UNIQUE Constraints:** None. Duplicate values in any column (including primary keys) are permitted by Google Sheets.
- **CHECK Constraints:** None. Arbitrary text values may be inserted into numeric, date, or boolean fields.
- **FOREIGN KEY Constraints:** None. Relational values referencing non-existent IDs are accepted without validation.
- **DEFAULT Value Constraints:** None. Default values must be generated in memory before payload serialization.

---

## 2. Application-Enforced Constraints

Because the storage tier is constraint-free, data integrity is 100% reliant on the application tier:

```
[Input Data]
     │
     ▼
[Zod Schemas: src/lib/schemas/google-sheets-schema.ts]
     │ (Type validation, Enum boundaries, Required field checks)
     ▼
[Domain Services: src/lib/services/*.service.ts]
     │ (Referential checks, duplicate detection, state machine guards)
     ▼
[Repositories: src/lib/repositories/*.repository.ts]
     │ (Primary key injection, timestamp generation)
     ▼
[Google Sheets: Pure Tabular Row Array]
```

| Constraint Type | Storage Tier (Google Sheets) | Application Tier (Zod / TypeScript) | Bypassed By |
| :--- | :---: | :---: | :--- |
| **Primary Key Uniqueness** | ❌ None | ⚠️ Optimistic Check (`SequencesRepository`) | Concurrent API requests, Direct Sheet Edits |
| **Not Null / Required** | ❌ None | ✅ Zod Object Schemas (`z.string().min(1)`) | Direct Sheet Edits, Untyped Appends |
| **Foreign Key Reference** | ❌ None | ✅ `deletionSafetyService` pre-delete checks | Direct Sheet Deletes, Bulk Reset Scripts |
| **Status Enum Validity** | ❌ None | ✅ Zod Enum Validation (`z.enum([...])`) | Direct Sheet Edits, Webhook Payloads |
| **Unique Sequences** | ❌ None | ⚠️ Sequence Row Increment | Concurrent API requests |
