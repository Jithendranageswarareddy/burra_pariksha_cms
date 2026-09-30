# Workflow Problem Register

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 20 of 30  
**Document:** 38 of 41  

---

## 1. Classified Problem Findings

| Finding ID | Classification | Severity | Affected Stage | Description |
| :--- | :--- | :---: | :---: | :--- |
| **WF-PROB-01** | Multi-Call Client Hack | **CRITICAL** | Stage 04 -> 06 | `RecordingWorkspace` executes 3 serial HTTP PATCH requests to jump state machine barrier. |
| **WF-PROB-02** | Swallowed State Sync Error | **CRITICAL** | All Stages | `VideoService` catches and swallows Question status sync failures. |
| **WF-PROB-03** | Missing Route Navigation | **HIGH** | Stage 02 | `QuestionVerifyApprovePage` approves draft but leaves draft ID in URL bar, causing 404 on reload. |
| **WF-PROB-04** | Incomplete Upload Transition | **HIGH** | Stage 11 | Publishing on 3 platforms leaves `Video.status` in `READY_TO_UPLOAD` instead of `UPLOADED`. |
| **WF-PROB-05** | Parameter Loss on Redirect | **HIGH** | Stage 10 | Route `/videos/:id/publishing-package` redirects to `/platform-packages` dropping `:id`. |
| **WF-PROB-06** | Unauthenticated Admin Access| **HIGH** | System | `/admin` and `/recovery` lack client-side route guards in `App.tsx`. |
| **WF-PROB-07** | Manual Analytics Polling | **MEDIUM** | Stage 13 | Analytics ingestion requires manual form entry; zero automated YouTube/Meta webhooks. |
| **WF-PROB-08** | In-Memory Feedback Loop | **MEDIUM** | Stage 15 | AI strategy recommendations applied in RAM; manual copy-paste required for new questions. |
