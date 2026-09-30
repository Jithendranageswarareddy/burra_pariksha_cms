# Read-Path Analysis

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 19 of 30  
**Document:** 18 of 35  

---

## 1. System Read Paths & Query Performance

Every query in BP-CMS traverses through `BaseRepository<T>` down to Google Sheets API v4.

### Read Path Profile:
1. **Full Worksheet Downloads:** Methods such as `findAll()` execute `spreadsheets.values.get` across the full sheet range (e.g. `QUESTIONS!A1:Z1000`).
2. **In-Memory Filtering:** Filtering by ID, status, category, or date is executed entirely in Node.js runtime memory using `Array.prototype.filter()`.
3. **Caching Layer:**
   - **Row Cache:** `2,500 ms` TTL in `GoogleSheetsClient`. Rapid back-to-back queries hit RAM.
   - **Header Cache:** `60,000 ms` TTL in `BaseRepository`. Column position lookups hit RAM.
4. **Stale Read Windows:**
   - On a single container, stale reads are bounded by 2.5 seconds.
   - In a multi-container Cloud Run deployment, Container B has no notification when Container A updates a row, allowing up to 2.5s stale data or cache divergence.
