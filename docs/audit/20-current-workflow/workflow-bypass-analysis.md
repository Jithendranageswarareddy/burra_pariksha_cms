# Workflow Bypass Analysis

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 20 of 30  
**Document:** 29 of 41  

---

## 1. Catalog of Discovered Workflow Bypasses

| Bypass ID | Intended Path | Discovered Bypass Vector | Enabling Mechanism | Risk |
| :--- | :--- | :--- | :--- | :---: |
| **BYPASS-01** | Stage 01 -> 02 -> 03 | Direct Question Creation modal creates canonical Question immediately without Draft stage. | `POST /api/questions` creates `BP-Q-` directly. | **MEDIUM** |
| **BYPASS-02** | Stage 04 -> 05 -> 06 | Direct status mutation from `RECORDED` to `EDITING` bypassing raw footage upload if `bypassRawCheck=true`. | Query parameter flag in `video.service.ts:360`. | **HIGH** |
| **BYPASS-03** | Stage 02 Verification | Direct approval via `updateQuestionStatus(APPROVED)` without executing MultiLayerVerificationEngine. | Direct PATCH `/api/questions/:id/status`. | **HIGH** |
| **BYPASS-04** | Stage 08 Thumbnail | Video marked `READY_TO_UPLOAD` even if thumbnail status is `PENDING`. | Final QC check does not block on thumbnail. | **MEDIUM** |
| **BYPASS-05** | Stage 10 Publishing | Direct platform publish via URL entry without scheduling setup. | `markPlatformPublished` called directly. | **LOW** |
| **BYPASS-06** | Stage 04-06 Sequence | 3-step chained status jump in `RecordingWorkspace.tsx` bypassing filming session. | Frontend sequential API calls. | **CRITICAL** |
