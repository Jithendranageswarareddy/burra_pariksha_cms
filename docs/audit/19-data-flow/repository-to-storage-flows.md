# Repository-to-Storage Data Flows

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 19 of 30  
**Document:** 10 of 35  

---

## 1. Repository Abstraction Layer

The repository layer (`src/lib/repositories/`) provides the data-access contract for the application.

All 34 repository classes inherit from `BaseRepository<T>` (`src/lib/repositories/base.repository.ts`).

```
Domain Service
  ↓
Concrete Repository (e.g. QuestionsRepository)
  ↓
BaseRepository<T>
  ↓
Object-to-Row Serialization (objectToRow / rowToObject)
  ↓
GoogleSheetsClient (src/lib/google-sheets/client.ts)
  ↓
HTTPS REST Transport (googleapis ^176.0.0)
  ↓
Google Sheets API v4 (Google Cloud Infrastructure)
```

### Key Data-Access Mechanisms:
1. **Full-Table Scans for Queries:** Because Google Sheets does not provide indexing, methods such as `findAll()`, `findByQuestionId()`, and `findByVideoId()` execute `googleSheetsClient.readRows()`, which downloads the **entire worksheet** into Node.js memory before executing JavaScript Array filtering (`.find()`, `.filter()`).
2. **Short-Lived Row Cache:** Reads pass through `rowCache` with a **2,500 ms TTL**. Within 2.5 seconds, identical worksheet requests return in-memory copies.
3. **Sequential Appends:** `appendRecord()` converts an object to an array of cell values according to `schema.columns`, appends via `spreadsheets.values.append`, and invalidates `rowCache`.
4. **Header Caching:** `cachedHeaders` caches column headers for **60,000 ms (60s)**.
