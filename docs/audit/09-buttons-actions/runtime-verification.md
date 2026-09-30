# Runtime Action Verification Requirements

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 09 of 30  
**Document:** 32 of 30  

---

## 1. Runtime Action Verification Scope

Static code inspection confirmed the logic for 90% of user actions. However, 8 asynchronous, multi-service, or hardware-interacting actions require live browser execution verification:

---

## 2. Verification Items

1. **Gemini Streaming Generation (`ACT-QSTU-01`)**:
   - Verify whether chunk-by-chunk SSE text streaming updates the live preview card without freezing the main thread.
2. **Teleprompter WPM Auto-Scroll (`ACT-PROM-01`)**:
   - Verify whether words-per-minute speed adjustment accurately paces speech during live camera intake.
3. **Google Sheets Concurrent Row Insertion (`ACT-QSTU-02`)**:
   - Verify whether rapid concurrent "Save Question" clicks correctly serialize IDs without collision via `sequenceSafetyService`.
4. **Kanban Card Drag-and-Drop Mutation (`ACT-PROD-01`)**:
   - Verify whether dragging a card between columns triggers a live `PATCH /api/videos/:id/status` and updates the stepper.
5. **Multi-Platform Scheduled Release Dispatch (`ACT-PUB-01`)**:
   - Verify whether the scheduled broadcast background timer reliably fires at the designated timestamp.
6. **Disaster Recovery Restore Preflight (`ACT-REST-01`)**:
   - Verify whether backup snapshot download and decompression from GCS executes within timeout limits (< 10 seconds).
7. **Social Comments AI Sentiment Analysis (`ACT-ANL-01`)**:
   - Verify whether bulk sentiment classification of 500+ comments completes without exhausting Gemini quota.
8. **Take Video Recording Upload (`ACT-REC-01`)**:
   - Verify whether large video file uploads (> 50MB) stream directly to Google Drive without hitting server memory limits.
