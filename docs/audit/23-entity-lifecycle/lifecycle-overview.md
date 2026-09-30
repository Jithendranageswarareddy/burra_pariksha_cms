# Complete Lifecycle Operational Overview

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 23 of 35  
**Document:** 03 of 35  

---

## 1. Intended vs Implemented Lifecycle Pipeline

```
[01 Question Studio]  --> Draft Created (BP-DFT-*)
       |
[02 Verification]     --> Approved -> Canonical IDs (BP-Q-*, BP-CNT-*, BP-V-*)
       |                  [Draft Deleted from Sheet]
       |
[03 Script Bay]       --> Presenter Script Created (BP-S-*)
       |
[04 Teleprompter]     --> Filming Session (Video: RECORDING)
       |
[05 Raw Video]        --> Upload to Drive -> driveFileId (Video: RECORDED)
       |
[06 Editing Bay]      --> Master Cut Produced (Video: EDITED)
       |                  * State Barrier Bypass Required if Video was QUEUED *
       |
[07 Final QC]         --> 6-Point Certification (Video: READY_TO_UPLOAD)
       |
[08 Thumbnail]        --> Upload Image to Drive (BP-T-*, thumbnailReady=true)
       |
[09 Social Review]    --> Packaging, Hashtags, Pinned Comment (SR-*)
       |
[10 Publishing Setup] --> Gate D Audit -> Scheduled (PUB-*)
       |
[11 Published]        --> Live URLs Ingested -> Baseline Analytics Created
       |                  * Video.status Fails to Cascade *
       |
[12 Platform Sync]    --> Adaptation Checks (Simulated / Stubbed)
       |
[13 Analytics]        --> Manual Metric Snapshots Ingested (ANL-*)
       |
[14 Performance]      --> Retention & Drop-off Diagnostics Computed
       |
[15 Intelligence]     --> Gemini AI Flywheel Recommendations (INT-*)
       |                  * Semi-automated Query Param Loopback to Studio *
       v
[Stage 01 Question Studio]
```

---

## 2. Overall Pipeline Verdict

Can one content item currently travel through this entire pipeline?
**VERDICT: PARTIALLY**
- It traverses Stages 01 through 11 if guided by a human operator through the tabbed UI.
- It encounters a fatal 404 on draft verification browser refresh.
- It requires an artificial 3-step API jump to transition from `QUEUED` to `EDITING`.
- It leaves `Video.status` in `READY_TO_UPLOAD` after publication.
- Stages 12 and 13 require manual simulated toggles and manual metric data entry due to absence of automated external webhooks.
