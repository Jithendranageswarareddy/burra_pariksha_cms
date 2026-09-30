# Stage 04: Teleprompter & Filming

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 21 of 30  
**Document:** 06 of 31  

---

## 1. Stage Identification

- **Canonical Stage:** 04 Teleprompter & Filming
- **Canonical Purpose:** Presenter filming session with interactive auto-scroll teleprompter and take logging.
- **Current Implementation:** `VideoDetailPage.tsx?tab=recording`, `RecordingWorkspace.tsx`, `TeleprompterModal.tsx`.
- **Active Route:** `/videos/:id?tab=recording`

---

## 2. Operational Flow Reconstructed

### INPUT
- `Script` content (`hookText`, `solution`, `callToAction`).
- Recording session settings (prompter scroll speed, font size, mirror mode).

### WORK
- Presenter activates interactive auto-scroll teleprompter.
- Logs recording takes, host notes, and filming timestamps.
- Updates video production status to `RECORDING`.

### OUTPUT
- Recorded filming session metadata and take index (`vd1.1`, `vd1.2`).
- Updated `VIDEOS` sheet row with host notes.

### STATE
- **Entity:** `Video`
- **Field:** `status`
- **Current State:** `VideoProductionStatus.RECORDING`
- **State Machine:** Video Production Machine (`VALID_VIDEO_TRANSITIONS`).
- **Authoritative Storage:** Google Sheets (`VIDEOS` tab).

### NEXT STAGE
- **Expected Canonical Next Stage:** 05 Raw Video
- **Actual Implementation Next Stage:** Remains on same tab (`?tab=recording`) to upload raw video footage.
- **Compression:** Stages 04 and 05 share the exact same UI component (`RecordingWorkspace.tsx`).

---

## 3. Evidence & Status

- **Evidence:** `src/components/video/RecordingWorkspace.tsx:640-670`, `src/components/video/TeleprompterModal.tsx`.
- **Implementation Status:** **FULLY IMPLEMENTED**
