# Runtime Verification Requirements

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 08 of 30  
**Document:** 29 of 30  

---

## 1. Runtime Verification Scope

Static code analysis and AST parsing reconstructed 95% of the UI architecture. However, 6 dynamic behaviors require live browser runtime verification:

---

## 2. Runtime Verification Items

1. **Gemini Streaming Generation in Question Studio**:
   - Verification Need: Confirm whether chunk-by-chunk SSE streaming properly updates `<textarea>` without focus loss.
2. **Teleprompter Auto-Scroll Pacing in Recording Workspace**:
   - Verification Need: Test whether words-per-minute (WPM) playback speed dynamically adjusts smoothly during live recording.
3. **Google Sheets Real-Time Latency Ping**:
   - Verification Need: Measure whether `SystemHealthIndicator` latency accurately reflects live API response times.
4. **Mobile Slide-Over Touch Gestures**:
   - Verification Need: Test whether swiping dismisses the mobile navigation drawer on iOS/Android WebKit.
5. **Drag-and-Drop Kanban Column Reordering**:
   - Verification Need: Test whether dragging a video card between columns in `ProductionTrackerPage` immediately updates status.
6. **Disaster Recovery Preflight Diffs**:
   - Verification Need: Verify whether record count diff calculation completes under 3 seconds with large datasets.
