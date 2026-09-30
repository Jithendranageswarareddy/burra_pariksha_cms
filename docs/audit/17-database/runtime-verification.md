# Runtime Verification Requirements

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 17 of 30  
**Document:** 38 of 39  

---

## 1. Deferred Runtime Verification Protocol

In strict adherence to the **READ-ONLY AUDIT CHARTER**, zero live mutations, stress tests, or concurrency simulations were executed against the production environment. The following **12 dynamic behaviors** are formally deferred to integration testing:

| Check ID | Verification Objective | Deferred Dynamic Test Procedure | Target Storage Tier |
| :--- | :--- | :--- | :--- |
| **VERIF-01** | Concurrent Sequence Increment | Fire 10 simultaneous POST requests to create questions; verify whether duplicate primary keys are generated | `SEQUENCES` tab |
| **VERIF-02** | Multi-Instance Lock Bypass | Deploy 2 Cloud Run instances; trigger concurrent updates to the same video record; verify if last write silently wins | `VIDEOS` tab |
| **VERIF-03** | Google Sheets Quota Threshold | Send 350 sequential read calls in 60 seconds; measure exact backoff behavior upon receiving HTTP 429 | Google Sheets API v4 |
| **VERIF-04** | Partial-Save Cascade Failure | Inject a network drop during step 2 of Content Master creation; verify if orphaned rows remain in `CONTENT_MASTERS` | Multi-Sheet |
| **VERIF-05** | Malformed JSON Resilience | Manually insert invalid JSON into a `video_ids` cell; verify whether list views degrade gracefully or throw 500 | `QUESTIONS` tab |
| **VERIF-06** | Header Cache Invalidation | Add a column to Row 1 of Google Sheets; verify whether the server detects the new header within 60 seconds | `BaseRepository` Cache |
| **VERIF-07** | Large Sheet Memory Footprint | Seed a test spreadsheet with 10,000 rows; measure Node.js process heap memory during `findAll()` | Node V8 Heap |
| **VERIF-08** | Fallback Store Ephemerality | Write 5 records in local development mode; restart the Node process; verify that `fallbackStore` is empty | In-Memory `Map` |
| **VERIF-09** | Deletion Safety Pre-Checks | Attempt to delete a Topic that has active Questions; verify that `deletionSafetyService` blocks the deletion | Referential Integrity |
| **VERIF-10** | Drive Binary Link Validity | Query `VIDEOS` table; verify that all `drive_final_url` links correspond to accessible files in Google Drive | Google Drive v3 |
| **VERIF-11** | Secondary Spreadsheet Routing| Query `AnalyticsRepository`; verify that API calls correctly target `ANALYTICS_SPREADSHEET_ID` | Analytics Sheet |
| **VERIF-12** | Secret Redaction in Snapshots | Run snapshot export utility; inspect resulting JSON to confirm zero exposure of `GOOGLE_PRIVATE_KEY` | Snapshot Exporter |
