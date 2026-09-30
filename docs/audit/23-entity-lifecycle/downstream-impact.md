# Downstream Impact Forensic Cascade

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 23 of 35  
**Document:** 28 of 35  

---

## 1. Cascade Cascading Impacts

### Break 1: Draft Approval Route 404 (BRK-HD-01)
- **Point of Failure:** Stage 02 (`/questions/:id/verify`)
- **Direct Consequence:** Reviewer cannot refresh browser or bookmark verification approval state.
- **Downstream Consequence:** Does not prevent downstream API calls if the user immediately clicks "Next", but forces manual recovery if page reload occurs.

### Break 2: State Machine Barrier QUEUED -> EDITING (BRK-HD-02)
- **Point of Failure:** Stage 06 (`video.service.ts`)
- **Direct Consequence:** Fast-track video editing directly from queued status fails with unhandled 400 error.
- **Downstream Consequence:** Master cut cannot be saved; Stage 07 (QC) cannot receive `finalRenderPath`; Stage 10 (Publishing Gate D) remains permanently blocked on `videoReady: false`.

### Break 3: Omission of Video Status Cascade at Publishing (BRK-SF-02)
- **Point of Failure:** Stage 11 (`publishing.service.ts`)
- **Direct Consequence:** `Video.status` in `VIDEOS` sheet remains `READY_TO_UPLOAD` indefinitely.
- **Downstream Consequence:** Video production dashboard shows the video as "Pending Upload" even while live links are active on YouTube/Instagram.
