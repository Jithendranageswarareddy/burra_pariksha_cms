# Step 27: Special Forensic Investigation — Test Identifier 1789891450880

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Document Type:** Dedicated Forensic Trace Dossier  
**Status:** **AUTHORITATIVE AUDIT**  
**Date:** 2026-09-29  

---

## 1. Executive Summary

Forensic investigation confirms the origin and exact creation mechanics of the persistent test artifacts bearing timestamp prefix `1789891450880` in the Burra Pariksha Google Sheets database.

```
[ Test Script: src/tests/phase09-publishing-workflow-verification.ts ]
                             │
                             ▼ (Lines 64–65: `Date.now() = 1789891450880`)
    ┌────────────────────────┴────────────────────────┐
    ▼                                                 ▼
[ questionsRepository.appendRecord() ]       [ videosRepository.appendRecord() ]
    │                                                 │
    ▼                                                 ▼
[ Google Sheets: QUESTIONS ]                 [ Google Sheets: VIDEOS ]
  - ID: `TEST-P09-Q-1789891450880`             - ID: `TEST-P09-V-1789891450880`
  - Status: `APPROVED`                         - Status: `READY_TO_UPLOAD`
```

---

## 2. Evidence from Source Code Inspection

In `src/tests/phase09-publishing-workflow-verification.ts`:
- **Line 64:** `const testQId = \`TEST-P09-Q-\${Date.now()}\`;`
- **Line 65:** `const testVId = \`TEST-P09-V-\${Date.now()}\`;`
- **Lines 68–85:** Direct append call to `questionsRepository.appendRecord()` without sandbox isolation.
- **Lines 88–100:** Direct append call to `videosRepository.appendRecord()`.
- **Lines 110–135:** Appends corresponding child records to `scriptsRepository`, `thumbnailsRepository`, and `pinnedCommentsRepository`.
- **Teardown Block:** The script lacks an automated `finally { ... }` cleanup block that deletes seeded test rows upon completion or failure.

---

## 3. Impact Assessment

1. **Sequence Numbering:** The canonical sequence generator parses digits using regex `/(\d+)$/`. Because `1789891450880` contains 13 digits (vastly larger than canonical 6-digit sequences like `000001`), un-sanitized sequence parsers risked jumping next allocated IDs to `1789891450881`.
2. **Production Safety Gate:** This prompted the implementation of the strict sequence sanitization logic (`canonical-sequence-parsing.test.ts`), which explicitly filters out `TEST-*` prefixes and enforces 6-digit bounds.
3. **Data Preservation Rule:** In accordance with the strict read-only audit mandate, these records remain preserved and un-mutated in the operational sheets.
