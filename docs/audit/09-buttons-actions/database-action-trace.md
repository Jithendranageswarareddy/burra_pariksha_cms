# Database & Cache Layer Action Trace

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 09 of 30  
**Document:** 15 of 30  

---

## 1. Database Architecture Status

As established in Step 01 and Step 05:
- **Primary Database**: Google Sheets (running via service account proxy).
- **Relational SQL / Firestore**: Not provisioned in current environment.
- **In-Memory Cache**: Services maintain local in-memory Map repositories (`usersRepository`, `taxonomyCache`) to accelerate reads and minimize Google Sheets API rate-limit exhaustion.

---

## 2. In-Memory Cache Invalidation Traces

| Mutating Action | Mutated Entity | Invalidated Cache Map | Reload Trigger |
| :--- | :--- | :--- | :--- |
| `ACT-AUTH-01` | User Session | `usersRepository.sessionCache` | Preloaded on server boot; refreshed on login |
| `ACT-SETT-01` | Taxonomy Tree | `taxonomyService.cache` | In-memory cache invalidated; sheets refetched on demand |
| `ACT-REST-01` | Disaster Restore | All in-memory repository caches | Full cache flush executed by `FullSnapshotRestoreExecutionService` |
