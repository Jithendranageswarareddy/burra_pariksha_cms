# Cache Data-Flow Architecture

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 19 of 30  
**Document:** 21 of 35  

---

## 1. Catalog of In-Memory & Ephemeral Caches

The BP-CMS backend and frontend utilize 9 distinct volatile cache stores:

| Cache Identifier | Storage Tier | Lifetime / TTL | Contents | Invalidation Mechanism | Cross-Replica Sync |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **GoogleSheetsClient.rowCache** | Node.js Process RAM | 2,500 ms (2.5s) | Sheet row arrays | On append/update/delete | **NONE** (Per-Process) |
| **BaseRepository.cachedHeaders** | Node.js Process RAM | 60,000 ms (60s) | Column header arrays | TTL expiration | **NONE** (Per-Process) |
| **QuestionService.inFlightRegistry**| Node.js Process RAM | In-flight execution | Idempotency Promises | On request completion | **NONE** (Per-Process) |
| **QuestionService.completedCache** | Node.js Process RAM | Process lifetime | Cached Question results | None (Process bound) | **NONE** (Per-Process) |
| **SocialReviewService.draftCache** | Node.js Process RAM | Process lifetime | Review package drafts | Explicit clear or restart | **NONE** (Per-Process) |
| **CopilotService.suggestionStore** | Node.js Process RAM | Process lifetime | AI suggestions | Explicit clear or restart | **NONE** (Per-Process) |
| **UsersRepository.userSessionStates**| Node.js Process RAM | Process lifetime | Active JWT session states | On logout or restart | **NONE** (Per-Process) |
| **SnapshotHistoryService.cache** | Node.js Process RAM | Process lifetime | Snapshot metadata lists | On new snapshot export | **NONE** (Per-Process) |
| **Client localStorage** | Browser Storage | Persistent until cleared | `bp_session_token` | On explicit logout | Local to browser |

### Critical Cache Risk on Cloud Run:
Because Cloud Run automatically spins up multiple container instances and frequently recycles idle containers, **all in-memory caches are isolated to individual container instances**. This creates unavoidable cache incoherency across horizontal replicas.
