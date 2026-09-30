# Relationship Data-Flow Architecture

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 19 of 30  
**Document:** 23 of 35  

---

## 1. Cross-Entity Foreign Key Network

BP-CMS implements 32 cross-entity relationships:

```
[CATEGORY] (CAT-###)
  ↓ 1:N
[TOPIC] (TOP-###)
  ↓ 1:N
[SUBTOPIC] (SUB-###)
  ↓ 1:N
[QUESTION] (BP-Q-######) ←────── 1:1 ──────→ [CONTENT_MASTER] (BP-CNT-######)
  ↓ 1:1 (Primary)                                     │ 1:1
[VIDEO] (BP-V-######)                                 │
  ├────── 1:1 ──────→ [SCRIPT] (BP-S-######)           │
  ├────── 1:1 ──────→ [THUMBNAIL] (BP-T-######)        │
  ├────── 1:1 ──────→ [PINNED_COMMENT] (BP-PIN-######) │
  ├────── 1:1 ──────→ [PUBLISHING] (PUB-######)        │
  └────── 1:N ──────→ [ANALYTICS] (ANL-######)         │
                                                       ↓
                                    [GOOGLE DRIVE ROOT FOLDER]
```

### Relationship Enforcement:
- **Storage-Level Foreign Keys:** 0 physical foreign keys (Google Sheets has no relational constraints).
- **Application Enforcement:** All referential integrity checks occur in TypeScript service code (e.g. `findById()` prior to creation).
- **Redundant Relationships:** Both `Video.questionId` and the `QUESTION_VIDEOS` join worksheet store the exact same 1:1 relationship.
