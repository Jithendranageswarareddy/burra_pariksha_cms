# Lifecycle Stage 06: Video Editing Bay

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 23 of 35  
**Document:** 09 of 35  

---

## 1. Transition Details

| Attribute | Forensic Value |
| :--- | :--- |
| **Origin Entity** | Raw Video Asset (`driveFileId`) & `Script` |
| **Action** | Video Editor Cut Submission |
| **Resulting Entity** | Master Rendered Cut |
| **State** | `Video.status = EDITED` |
| **Page / Component** | `VideoDetailPage.tsx?tab=editing` -> `EditingWorkspace.tsx` |
| **Active Route** | `/videos/:id?tab=editing` |
| **REST API** | `PATCH /api/videos/:id/status` |
| **Service Layer** | `video.service.ts:transitionStatus('EDITING' -> 'EDITED')` |
| **Repository Layer** | `videosRepository.updateRecord()` |
| **Authoritative Storage**| Google Drive (Master Cut) + Google Sheets `VIDEOS` |
| **Next Entity / State** | Final QC Certification |

---

## 2. THE CRITICAL "QUEUED -> EDITING" STATE MACHINE BARRIER

1. **State Machine Definition:** `src/lib/services/video.service.ts` defines:
   ```typescript
   QUEUED: [SCRIPT_READY, RECORDING, CANCELLED],
   RECORDING: [RECORDED, FAILED, QUEUED],
   RECORDED: [EDITING, ARCHIVED],
   EDITING: [EDITED, RECORDED, FAILED],
   EDITED: [FINAL_REVIEW, REVISION_REQUESTED]
   ```
2. **The Direct Transition Failure:** If an editor attempts to open and work on a video while it has status `QUEUED`, calling `transitionStatus('EDITING')` **throws an uncaught Error**:
   ```
   Invalid state transition from QUEUED to EDITING
   ```
3. **The Workaround in RecordingWorkspace.tsx:**
   To prevent workflow deadlock, the frontend executes a **synthetic 3-call sequential hop**:
   - `PATCH /api/videos/:id/status` -> `RECORDING`
   - `PATCH /api/videos/:id/status` -> `RECORDED`
   - `PATCH /api/videos/:id/status` -> `EDITING`
   This confirms that the business stage "Editing" cannot be entered naturally from `QUEUED` without tricking the backend state machine.
