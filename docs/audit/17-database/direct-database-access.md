# Direct Database Access Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 17 of 30  
**Document:** 16 of 39  

---

## 1. Architectural Boundary Review

The canonical architecture requires:
`API Handler -> Domain Service -> Repository -> BaseRepository -> GoogleSheetsClient`

A forensic code scan was performed to detect cases where services or utilities **bypass the repository layer** and invoke `googleSheetsClient` directly.

---

## 2. Detected Direct Access Instances

| Source File | Function / Context | Direct Call | Reason / Classification |
| :--- | :--- | :--- | :---: |
| `src/lib/services/deletion-safety.service.ts` | `verifyNoDanglingReferences(tab, id)` | `googleSheetsClient.getRows(tab)` | **DIRECT ACCESS (BYPASS):** Bypasses repository to perform raw row scanning across arbitrary sheets |
| `src/lib/services/snapshot-exporter.service.ts` | `exportAllTabs()` | `googleSheetsClient.getRows(tab)` | **DIRECT ACCESS (BACKUP):** Iterates through `ALL_SHEET_TABS` to export raw backup rows |
| `src/lib/services/snapshot-recovery.service.ts` | `restoreSheetFromSnapshot(tab, rows)`| `googleSheetsClient.replaceRows(tab, rows)`| **DIRECT ACCESS (RESTORATION):** Overwrites sheet contents directly during recovery |
| `scripts/cleanup-and-migrate-users.ts` | `main()` | `googleSheetsClient.getRows('USERS')` | **DIRECT ACCESS (SCRIPT):** Operational maintenance script |
| `scripts/purge-test-data-for-production.ts` | `main()` | `googleSheetsClient.deleteRow(tab, rowIdx)`| **DIRECT ACCESS (SCRIPT):** Operational maintenance script |

---

## 3. Risks of Direct Access Bypasses

1. **Bypassing Schema Contracts:**  
   When `googleSheetsClient.getRows()` is called directly, row values are returned as unparsed string arrays (`string[][]`) without type casting or date parsing.
2. **Bypassing In-Flight Lock Registry:**  
   `BaseRepository.recordLocks` is bypassed when `googleSheetsClient` is invoked directly, allowing unsynchronized mutations to race against repository operations.
