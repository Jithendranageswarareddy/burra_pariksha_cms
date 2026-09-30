# Lifecycle Problem Register

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 23 of 35  
**Document:** 34 of 35  

---

## 1. Complete Register of Lifecycle Anomalies

| Problem ID | Category | Severity | Stage | Evidence Location | Description |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **LIF-CRIT-01** | State Machine Barrier | **CRITICAL** | Stage 06 | `video.service.ts:365` | `QUEUED -> EDITING` is an illegal transition, forcing a 3-step HTTP PATCH hack. |
| **LIF-CRIT-02** | Swallowed State Desync | **CRITICAL** | Stage 02–06 | `video.service.ts:415` | `try...catch` block swallows question sync errors, allowing `Video.status` and `Question.videoStatus` to diverge. |
| **LIF-HIGH-01** | Stale Draft Route 404 | **HIGH** | Stage 02 | `QuestionVerifyApprovePage.tsx` | Draft approval deletes draft row but leaves draft ID in URL, triggering 404 on browser reload. |
| **LIF-HIGH-02** | Missing Video Status Cascade | **HIGH** | Stage 11 | `publishing.service.ts:680` | Publishing on all platforms marks `PUBLISHING` as published but omits updating `Video.status` in `VIDEOS` sheet. |
| **LIF-HIGH-03** | Monolithic Tab Compression | **HIGH** | Stages 03–08 | `VideoDetailPage.tsx` | 6 independent canonical lifecycle stages are compressed into URL query tabs. |
| **LIF-MED-01** | External Sync Stubbed | **MEDIUM** | Stage 12 | `platform-adaptation.service.ts` | Zero live integration with YouTube/Meta APIs; platform sync is simulated. |
| **LIF-MED-02** | Manual Metric Ingestion | **MEDIUM** | Stage 13 | `analytics.service.ts` | Zero automated polling daemons or webhooks; relies completely on human form input. |
| **LIF-LOW-01** | Semi-Automated Loopback | **LOW** | Stage 15 | `AnalyticsExperiencePage.tsx` | Flywheel recommendations require human button click to redirect to `/studio` with query params. |
