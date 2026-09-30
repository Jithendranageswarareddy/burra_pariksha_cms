# Cloud Run Database & Runtime Concurrency Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 17 of 30  
**Document:** 31 of 39  

---

## 1. Cloud Run Deployment Model

BP-CMS is deployed as a containerized Node.js service on **Google Cloud Run**:
- **Execution Environment:** Fully managed serverless container runtime.
- **Port:** Port 3000 (HTTP).
- **Scaling Behavior:** Dynamically scales from 0 to N container instances based on incoming request volume.
- **Persistence Attachment:** Cloud Run containers are completely **stateless**. No persistent disk or local database file (e.g. SQLite) is attached.

---

## 2. Distributed Concurrency & Lock Breakdown

Because Cloud Run spins up multiple independent container instances during traffic surges:

```
                     [Incoming User Traffic]
                               │
                ┌──────────────┴──────────────┐
                ▼                             ▼
       [Cloud Run Instance 1]        [Cloud Run Instance 2]
       (Local Process Memory)        (Local Process Memory)
        - recordLocks Map             - recordLocks Map
        - fallbackStore Map           - fallbackStore Map
        - rowCache Map                - rowCache Map
                │                             │
                └──────────────┬──────────────┘
                               ▼ (HTTPS)
                  [Google Sheets REST API]
```

1. **In-Flight Lock Map Breakdown:**  
   `BaseRepository.recordLocks` only serializes requests within the *same* Node.js process. When Instance 1 and Instance 2 concurrently process updates for the same question (`BP-Q-000042`), they bypass each other's locks, causing race conditions at the Google Sheets API.
2. **Distributed Sequence Generation Race:**  
   Both instances can fetch the same sequence counter from `SEQUENCES` tab and generate identical primary keys.
3. **Cache Incoherency Across Containers:**  
   Instance 1 updates row 50 and invalidates its local `rowCache`. Instance 2 does not receive an invalidation signal and continues serving stale cached row data for up to 60 seconds.
