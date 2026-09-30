# The QUEUED -> EDITING Execution Trace

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 20 of 30  
**Document:** 34 of 41  

---

## 1. Complete Forensic Trace of the QUEUED -> EDITING Workaround

### Architectural Conflict:
In `src/lib/services/video.service.ts:59-66`:
```typescript
[VideoProductionStatus.QUEUED]: [
  VideoProductionStatus.SCRIPT_REQUIRED,
  VideoProductionStatus.SCRIPT_READY,
  VideoProductionStatus.ON_HOLD,
  VideoProductionStatus.CANCELLED,
]
`
Direct transition from `QUEUED` to `EDITING` is strictly illegal.

### Real Code Path in `src/components/video/RecordingWorkspace.tsx:335-362`:
When a user clicks "Advance to Editing" from `RecordingWorkspace.tsx`:

```typescript
// STEP 1: If currently QUEUED, advance to SCRIPT_READY
if (currentStatus === VideoProductionStatus.QUEUED) {
  await apiClient.updateVideoStatus(
    videoId,
    VideoProductionStatus.SCRIPT_READY,
    'Advancing QUEUED status to SCRIPT_READY'
  );
  currentStatus = VideoProductionStatus.SCRIPT_READY;
}

// STEP 2: Advance from SCRIPT_READY to RECORDED
if (currentStatus === VideoProductionStatus.SCRIPT_READY || currentStatus === VideoProductionStatus.RECORDING) {
  await apiClient.updateVideoStatus(
    videoId,
    VideoProductionStatus.RECORDED,
    'Advancing SCRIPT_READY/RECORDING to RECORDED (raw footage secured)'
  );
  currentStatus = VideoProductionStatus.RECORDED;
}

// STEP 3: Advance from RECORDED to EDITING
if (currentStatus === VideoProductionStatus.RECORDED) {
  await apiClient.updateVideoStatus(
    videoId,
    VideoProductionStatus.EDITING,
    'Raw footage secured, advancing to Step 06 Video Editing'
  );
  if (onStatusChange) onStatusChange();
}
```

### Forensic Evaluation:
The application circumvents its own strict state machine by firing **three consecutive HTTP PATCH requests** in a single client event!
- If the network drops or Google Sheets rate limits on call #2, the video is permanently stuck in `RECORDED` status.
- This creates 3 redundant `WORKFLOW_TRANSITIONS` and 3 redundant `AUDIT_LOGS` entries for a single user action.
