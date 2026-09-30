# Database Cache Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 17 of 30  
**Document:** 34 of 39  

---

## 1. Caching Layers in Persistence Tier

To mitigate Google Sheets API latency (150-400ms per call) and quota consumption, the repository layer implements three distinct caching mechanisms:

| Cache Tier | Storage Location | Key Structure | TTL / Expiration | Invalidation Trigger |
| :--- | :--- | :--- | :---: | :--- |
| **Worksheet Header Cache** | `BaseRepository.cachedHeaders` | `sheetName` | 60,000 ms (1 min) | Time-based expiry |
| **Row Data Cache** | `googleSheetsClient.rowCache` | `${spreadsheetId}:${sheetName}` | 30,000 ms (30 sec) | Manual `invalidateRowCache(key)` on update/delete |
| **In-Flight Mutation Locks**| `BaseRepository.recordLocks` | `${sheetName}:${recordId}` | Duration of write | Promise completion |

---

## 2. Stale Cache Hazards & Cache Incoherency

1. **Uncoordinated Cache Invalidation:**  
   When a service calls `BaseRepository.update(id, data)`, it calls `client.invalidateRowCache()`. However, if another process or script mutates Google Sheets directly, the running server continues serving stale cached data until the 30-second TTL elapses.
2. **Read-Your-Own-Writes Lag:**  
   If an update operation succeeds in Google Sheets but the local cache invalidation fails or is missed, subsequent `findById()` calls in the same request thread return the stale pre-update row.
