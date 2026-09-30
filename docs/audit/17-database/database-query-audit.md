# Database Query Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 17 of 30  
**Document:** 17 of 39  

---

## 1. Query Execution Architecture

Because Google Sheets API v4 does not provide an SQL query engine (no `SELECT`, `WHERE`, `JOIN`, `GROUP BY`), all data querying is implemented in Node.js runtime memory:

```
1. CLIENT REQUEST: GET /api/questions?topic_id=TOP-0001
2. REPOSITORY CALL: questionsRepository.filterByTopic('TOP-0001')
3. GOOGLE SHEETS API CALL: GET https://sheets.googleapis.com/v4/spreadsheets/{id}/values/QUESTIONS!A1:AL5000
4. NETWORK TRANSFER: Downloads entire 5,000-row sheet payload (approx. 2MB JSON)
5. IN-MEMORY PARSING: rowToObject() deserializes 5,000 rows into TypeScript objects
6. IN-MEMORY FILTER: rows.filter(q => q.topic_id === 'TOP-0001')
7. HTTP RESPONSE: Returns 24 matching questions to caller
```

---

## 2. In-Memory Query Patterns in Repositories

| Query Operation | Typical Implementation | Storage-Tier Pushdown | Computational Complexity |
| :--- | :--- | :---: | :---: |
| **Find by Primary Key** | `rows.find(r => r.id === targetId)` | ❌ None (Full sheet fetch) | `O(N)` memory scan |
| **Filter by Foreign Key** | `rows.filter(r => r.topic_id === topicId)` | ❌ None (Full sheet fetch) | `O(N)` memory scan |
| **Multiple Conditions** | `rows.filter(r => r.status === 'APPROVED' && r.difficulty === 'BEGINNER')` | ❌ None (Full sheet fetch) | `O(N)` memory scan |
| **Sorting / Ordering** | `rows.sort((a, b) => b.created_at - a.created_at)` | ❌ None (Full sheet fetch) | `O(N log N)` in memory |
| **Pagination** | `rows.slice(offset, offset + limit)` | ❌ None (Full sheet fetch) | `O(1)` slice of `O(N)` data |
| **Cross-Table Joins** | Sequential repository calls; in-memory map join | ❌ None (Multiple full sheet fetches) | `O(N + M)` network & CPU |

---

## 3. Performance & Cost Vulnerabilities

1. **Unbounded Memory Consumption:**  
   Fetching 10,000 questions into V8 heap requires ~25MB of memory per request. Under concurrent traffic, Node.js heap quickly spikes.
2. **Quota Depletion:**  
   A dashboard displaying questions, videos, scripts, thumbnails, and assignments triggers 5 full sheet downloads on a single page load, consuming 5 Google Sheets read quota units.
