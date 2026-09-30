# Primary Key Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 17 of 30  
**Document:** 08 of 39  

---

## 1. Primary Key Generation Architecture

BP-CMS uses formatted business sequence identifiers as primary keys across all 25 tables. Unlike relational databases that use auto-incrementing integers (`SERIAL`, `IDENTITY`) or UUIDs (`gen_random_uuid()`), BP-CMS implements an application-tier sequence generator:

- **Source Code:** `src/lib/repositories/sequences.repository.ts`
- **Storage Table:** Tab `SEQUENCES` in primary Google Sheet
- **Schema:**
  - `entity_type` (PK, e.g. 'QUESTION', 'VIDEO', 'CONTENT_MASTER')
  - `current_value` (number, highest sequence number allocated)
  - `prefix` (string, e.g. 'BP-Q-', 'BP-V-', 'BP-CNT-')
  - `pad_length` (number, formatting length, typically 6 digits)
  - `updated_at` (timestamp of last sequence update)

---

## 2. Sequence Prefix Mapping

```typescript
export const ID_PREFIX_MAP = {
  CONTENT_MASTER: { prefix: 'BP-CNT-', padLength: 6 }, // e.g. BP-CNT-000001
  QUESTION:       { prefix: 'BP-Q-',   padLength: 6 }, // e.g. BP-Q-000001
  VIDEO:          { prefix: 'BP-V-',   padLength: 6 }, // e.g. BP-V-000001
  SCRIPT:         { prefix: 'BP-SCR-', padLength: 6 }, // e.g. BP-SCR-000001
  THUMBNAIL:      { prefix: 'BP-THM-', padLength: 6 }, // e.g. BP-THM-000001
  PINNED_COMMENT: { prefix: 'BP-PC-',  padLength: 6 }, // e.g. BP-PC-000001
  ASSIGNMENT:     { prefix: 'ASN-',    padLength: 6 }, // e.g. ASN-000001
  USER:           { prefix: 'USR-',    padLength: 4 }, // e.g. USR-0001
  CATEGORY:       { prefix: 'CAT-',    padLength: 3 }, // e.g. CAT-001
  TOPIC:          { prefix: 'TOP-',    padLength: 4 }, // e.g. TOP-0001
  SUBTOPIC:       { prefix: 'SUB-',    padLength: 5 }, // e.g. SUB-00001
  AUDIT_LOG:      { prefix: 'AUD-',    padLength: 8 }, // e.g. AUD-00000001
  WORKFLOW:       { prefix: 'WF-',     padLength: 8 }, // e.g. WF-00000001
};
```

---

## 3. Concurrency Hazards in Sequence Generation

1. **Race Condition Under Concurrent Creation:**  
   To allocate an ID, `SequencesRepository.getNextSequenceValue(entityType)`:
   - Reads current sequence row from `SEQUENCES` tab.
   - Increments `current_value` by 1 in Node.js memory.
   - Writes updated value back to `SEQUENCES` tab via Google Sheets API.
2. **Absence of Atomic Fetch-and-Add:**  
   If two HTTP requests create questions simultaneously, both read `current_value = 142`. Both increment to `143` and write `143`. Both questions are assigned `BP-Q-000143`, resulting in **duplicate primary keys** in the `QUESTIONS` tab.
3. **Absence of Storage-Tier Unique Constraint:**  
   Because Google Sheets has no unique key constraints, the duplicate ID is successfully appended without error, corrupting primary key uniqueness.
