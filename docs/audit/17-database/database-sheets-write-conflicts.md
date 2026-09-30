# Database ↔ Sheets Write-Conflict Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 17 of 30  
**Document:** 24 of 39  

---

## 1. Write-Path Execution Architecture

Every write operation executes through `BaseRepository.create()`, `update()`, or `delete()`:

```
[Concurrent Request A] ──┐
                         ├─► BaseRepository.recordLocks (Local Process Map)
[Concurrent Request B] ──┘         │
                                   ▼
                        GoogleSheetsClient.updateCell() / appendRow()
                                   │
                                   ▼ (HTTPS REST)
                         [Google Sheets Cloud API]
```

---

## 2. Write Concurrency Vulnerabilities

1. **In-Flight Lock Map Scoped to Single Process:**  
   `BaseRepository.recordLocks` uses an in-memory `Map<string, Promise<void>>` to serialize updates to the same record.
   - **Vulnerability:** When deployed to Google Cloud Run with multiple container instances (or during auto-scaling), instances do NOT share memory. Two requests hitting different Cloud Run containers bypass the lock completely.
2. **Blind Last-Write-Wins Overwrites:**  
   When updating a row, `update()` fetches the entire row, mutates the specific columns in memory, and writes the entire row back.
   - If User A modifies `status` while User B modifies `notes`, the second write overwrites the first write's updates, causing silent data loss.
3. **Optimistic Locking Absence:**  
   None of the 25 sheets maintain an `optimistic_version` or `etag` column (except `SOCIAL_REVIEWS` which contains an experimental `versionHash`). There is no mechanism to reject an update if the row changed since it was read.
