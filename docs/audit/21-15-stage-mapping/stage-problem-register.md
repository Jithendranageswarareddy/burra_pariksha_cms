# Stage Mapping Problem Register

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 21 of 30  
**Document:** 30 of 31  

---

## 1. Register of Discovered Stage Problems

| Finding ID | Classification | Severity | Affected Stage | Root Cause & Description |
| :--- | :--- | :---: | :---: | :--- |
| **STG-CRIT-01** | Chained API Hack | **CRITICAL** | Stage 04 -> 06 | `RecordingWorkspace.tsx` fires 3 serial HTTP PATCH requests to jump the `QUEUED -> EDITING` barrier. |
| **STG-CRIT-02** | Swallowed State Desync | **CRITICAL** | Stages 02–11 | `VideoService.transitionStatus` swallows Question status sync failures, creating permanent divergence. |
| **STG-HIGH-01** | Draft ID Route 404 | **HIGH** | Stage 02 | Approving draft deletes it from `QUESTION_DRAFTS` but leaves draft ID in URL bar, triggering 404 on refresh. |
| **STG-HIGH-02** | Missing Video Status Cascade| **HIGH** | Stage 11 | Publishing on all platforms updates `PUBLISHING` but omits updating `Video.status` to `UPLOADED`. |
| **STG-HIGH-03** | Workspace Tab Compression | **HIGH** | Stages 03–08 | 6 discrete canonical stages are compressed into tabs of a single monolithic page (`VideoDetailPage.tsx`). |
| **STG-MED-01** | External Sync Stubbed | **MEDIUM** | Stage 12 | Automated cross-platform API synchronization is simulated via manual UI toggles. |
| **STG-MED-02** | Manual Analytics Ingestion | **MEDIUM** | Stage 13 | 0 automated YouTube/Meta webhooks; analytics collection relies completely on human manual entry. |
| **STG-LOW-01** | Semi-Automated Loopback | **LOW** | Stage 15 | AI strategy recommendations require manual click to pre-populate `/studio` parameters. |
