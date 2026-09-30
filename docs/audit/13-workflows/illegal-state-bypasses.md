# Illegal State Bypasses & Invariant Violations

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 13 of 30  
**Document:** 14 of 30  

---

## 1. Executive Summary of Discovered Bypasses

Despite the existence of formal transition tables and safety gates, static code analysis revealed **6 confirmed illegal state bypasses** where code paths completely bypass gates, short-circuit state transitions, or directly mutate Google Sheets without validation.

---

## 2. Forensic Bypass Dossiers

### BYPASS-01: Auto-Advance Guard Bypasses Scriptwriting & Recording
- **File:** `src/lib/services/phase17-video-production.service.ts:382–395`
- **Code:**
  ```typescript
  // Auto-Advance Guard: If video is in RAW/RECORDED/SCRIPT_READY/QUEUED state, automatically transition to EDITING
  let currentState = this.getWorkflowState(video);
  if (
    currentState === 'RAW' ||
    video.status === VideoProductionStatus.RECORDED ||
    video.status === VideoProductionStatus.SCRIPT_READY ||
    video.status === VideoProductionStatus.QUEUED ||
    video.status === VideoProductionStatus.SCRIPT_REQUIRED
  ) {
    await videosRepository.updateRecord(videoId, {
      status: VideoProductionStatus.EDITING,
      updatedAt: new Date().toISOString(),
    });
    video.status = VideoProductionStatus.EDITING;
  }
  ```
- **Forensic Finding:** If an edited binary cut is uploaded via `POST /api/phase17/video/:videoId/transition-editing`, the method forcibly mutates the video from `QUEUED` or `SCRIPT_REQUIRED` directly to `EDITING`!
- **Invariant Violated:** Violates `VALID_VIDEO_TRANSITIONS` which forbids `QUEUED -> EDITING`. Completely circumvents Scriptwriting (Stage 03), Teleprompter (Stage 04), and Raw Recording (Stage 05).

---

### BYPASS-02: Direct Status Update Bypasses Gate G
- **File:** `src/server/routes.ts:740–765` (`PATCH /api/videos/:id/status`)
- **Forensic Finding:** The route controller calls `videoService.updateStatus(id, newStatus)`. While `updateStatus` validates `validateTransition`, it **never executes Gate F or Gate G checks**. A user with valid role can advance a video directly from `READY_TO_UPLOAD` to `UPLOADED` without a live YouTube link, thumbnail, or pinned comment.

---

### BYPASS-03: Snapshot Restore Execution Blindly Overwrites Production States
- **File:** `src/lib/services/full-snapshot-restore-execution.service.ts:80–120`
- **Forensic Finding:** The restore engine restores historical rows directly into `VIDEOS` and `QUESTIONS` tabs using `sheets.spreadsheets.values.batchUpdate()`, completely bypassing all domain services, transition tables, and audit logs. A restored entity can regress from `PUBLISHED` to `DRAFT` with no record in `WORKFLOW` sheet.

---

### BYPASS-04: Question Status Patch without Validation Check
- **File:** `src/server/routes.ts:512–530` (`PATCH /api/questions/:id/status`)
- **Forensic Finding:** Allows setting `status = "APPROVED"` without asserting `validationStatus === "VALID"`. An invalid question with 2 options can be forced to APPROVED by calling this patch endpoint.

---

### BYPASS-05: Direct Assignment Completion without Deliverable Link
- **File:** `src/lib/services/assignment.service.ts:694–720`
- **Forensic Finding:** `assignmentService.completeAssignment()` marks status as `COMPLETED` without checking if the underlying entity (Script, Video, or Thumbnail) actually exists or reached its target milestone.

---

### BYPASS-06: Webhook Callback State Injection
- **File:** `src/server/routes.ts:1820–1850`
- **Forensic Finding:** Unauthenticated webhook endpoint updates publishing status based on raw JSON body payload without cryptographic HMAC verification.
