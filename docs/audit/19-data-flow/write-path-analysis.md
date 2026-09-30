# Write-Path Analysis

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 19 of 30  
**Document:** 19 of 35  

---

## 1. System Write Path Mechanics & Latency

All mutating operations execute HTTP POST/PUT/PATCH calls across Google Sheets API v4.

### Write Execution Mechanics:
1. **Append vs Update:**
   - **Appends (`appendRecord`):** Appends to bottom of sheet via `spreadsheets.values.append`. Latency: ~400ms–900ms.
   - **In-Place Updates (`updateRecord`):** First scans sheet to determine physical 1-based row index, then issues `spreadsheets.values.update` for that row range. Latency: ~800ms–1,800ms (two Google API network round trips).
2. **Lock Contention:**
   - Sequential writes on the same sheet must wait for `inFlightReads` and cache invalidation.
   - High-concurrency batch imports can trigger Google Sheets `429 Rate Limit Exceeded` (quota is 300 requests per minute per project).
3. **No Batching Across Entities:**
   - Cascading operations execute sequential HTTP calls rather than a single atomic batch request.
