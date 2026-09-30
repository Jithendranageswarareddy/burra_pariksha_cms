# Database Index Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 17 of 30  
**Document:** 10 of 39  

---

## 1. Storage-Level Index Audit

A forensic inspection of the underlying persistence architecture confirms:
- **B-Tree Indexes:** **ZERO.** Google Sheets has no concept of database indexes.
- **Hash Indexes:** **ZERO.**
- **Unique Indexes:** **ZERO.**
- **Full-Text Indexes:** **ZERO.**

---

## 2. In-Memory Header & Column Indexing

To map JavaScript object properties to worksheet columns, `BaseRepository` implements an in-memory header index:

```typescript
// src/lib/repositories/base.repository.ts
protected cachedHeaders: string[] | null = null;
protected lastHeaderFetchTime: number = 0;
protected HEADER_CACHE_TTL_MS = 60000; // 1 minute header cache
```

- **Mechanism:** On the first read or write, the repository fetches Row 1 of the worksheet and builds a lookup map `Map<ColumnName, ColumnIndex>`.
- **Cache TTL:** 60 seconds.
- **A1 Notation Converter:** `colIndexToA1Letter(idx)` converts zero-based integer index to Google Sheets column letter (`0 -> 'A'`, `27 -> 'AB'`).

---

## 3. Query Performance & Scan Complexity

Because no storage-level index exists:
1. **Find by ID (`findById(id)`):**  
   Executes `getRows(sheetName)` to download **ALL rows** of the worksheet over HTTPS. Iterates linearly through rows in Node.js memory (`O(N)` search) to match the primary key column.
2. **Filtering (`find(filter)`):**  
   Downloads all rows and applies JavaScript `.filter()` in memory (`O(N)`).
3. **Scalability Ceiling:**  
   As tables grow beyond 5,000 rows, every single read operation downloads several megabytes of JSON over HTTPS, saturating network bandwidth and introducing multi-second query latencies.
