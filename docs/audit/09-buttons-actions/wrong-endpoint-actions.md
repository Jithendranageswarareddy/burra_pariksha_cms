# Wrong Endpoint Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 09 of 30  
**Document:** 22 of 30  

---

## 1. Wrong Endpoint Criteria

An action is classified as **WRONG_ENDPOINT (ACT-008)** if the HTTP route it invokes contradicts its semantic intent or bypasses the canonical service endpoint.

---

## 2. Wrong Endpoint Register

| Host Component | Button / Trigger | Invoked API Endpoint | Expected Canonical Endpoint | Discrepancy Description | Classification |
| :--- | :--- | :--- | :--- | :--- | :---: |
| `PlanningPage.tsx:188` | "Fetch Batch Health" | `/api/health` | `/api/planning/batches/health` | Calls global server health instead of batch-specific status | **ACT-008** |
| `VideoCreateScriptPage.tsx`| "Generate Draft Script"| `/api/scripts/generate` | `/api/scripts/draft` | Calls legacy un-memoized generator route | **ACT-008** |
| `PublishingPage.tsx:162`| "Sync Live Counts" | `/api/publishing/sync` | `/api/social/analytics/sync` | Invokes publisher dispatcher instead of social metrics engine | **ACT-008** |
