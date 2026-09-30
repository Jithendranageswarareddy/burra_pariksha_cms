# Critical Known Cases Deep Dive

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 21 of 30  
**Document:** 28 of 31  

---

## 1. Forensic Analysis of the Top 5 Known Issues

1. **The `BP-DFT-529472-5SOD` Case:**
   - Trace confirmed in `QuestionVerifyApprovePage.tsx`.
   - Materializing a canonical question physically deletes the draft row.
   - Leaving the draft ID in the browser URL bar causes an unhandled 404 on browser reload.

2. **The `QUEUED -> EDITING` Workaround:**
   - Direct transition is forbidden by `VALID_VIDEO_TRANSITIONS`.
   - `RecordingWorkspace.tsx` circumvents the barrier by firing 3 back-to-back PATCH requests.
   - Partial failure leaves the entity stranded in intermediate states.

3. **The `Video.status` vs `Question.videoStatus` Desynchronization:**
   - Secondary write wrapped in `try/catch` with `console.warn`.
   - Broken network or quota creates persistent state divergence between video lists and video detail bays.

4. **The Drive Folder Hierarchy Dualism:**
   - Phase 7 (`Content/BP-CNT/Videos`) vs Phase 14 (`BP-CNT/Raw`).
   - Both layouts exist in production Google Drive root, fragmenting media asset discoverability.

5. **The Missing `Video.status = UPLOADED` Transition:**
   - In `publishing.service.ts`, marking all platforms published updates `PUBLISHING` and `ANALYTICS`, but never updates `Video.status` to `UPLOADED`.
