# Runtime Verification Requirements for Data Model

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 15 of 30  
**Document:** 50 of 51  

---

## 1. Read-Only Forensic Safety Protocol

In compliance with the project audit charter, **no destructive runtime writes, test records, or schema alterations were performed during this audit**. The following 10 verification scenarios must be executed in a sandboxed staging environment:

1. **RTV-DM-01:** Concurrently allocate 50 sequence IDs across 5 worker threads to test mutex safety.
2. **RTV-DM-02:** Attempt to insert invalid JSON into `QUESTIONS.options` to verify error handling.
3. **RTV-DM-03:** Verify if deleting a question row cascades or leaves orphaned videos.
4. **RTV-DM-04:** Check if updating `VIDEOS.status` propagates to `QUESTIONS.video_status`.
5. **RTV-DM-05:** Test if an empty Drive file ID correctly triggers frontend placeholder UI.
6. **RTV-DM-06:** Test if cancelling 1 of 2 videos attached to a Content Master locks completion.
7. **RTV-DM-07:** Verify if `AUDIT_LOG` sheet correctly appends without locking table reads.
8. **RTV-DM-08:** Confirm if Draft Question promotion correctly allocates sequential canonical ID.
9. **RTV-DM-09:** Verify if deactivating a user invalidates active JWT tokens.
10. **RTV-DM-10:** Test Google Sheets 429 quota backoff behavior under sustained load.
