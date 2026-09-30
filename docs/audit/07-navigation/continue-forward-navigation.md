# Forward Progression & Next Action Navigation Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 07 of 30  
**Document:** 12 of 27  

---

## 1. Forward Progression Model

Forward progression moves content through the 15-stage pipeline upon successful completion of human actions (authoring, verifying, filming, cutting, designing, signing off, and scheduling).

```
[Stage 01: Studio] ----(Save Question)----> [Stage 02: Verification]
                                                      |
                                             (Approve Question)
                                                      |
                                                      v
[Stage 04: Recording] <--(Approve Script)--- [Stage 03: Scriptwriting]
         |
  (Ingest Footage)
         |
         v
[Stage 06: Editing] -----(Submit Cut)-----> [Stage 07: Final QC Review]
                                                      |
                                               (Approve Video)
                                                      |
                                                      v
[Stage 09: Social Review] <--(Approve Thumb)-- [Stage 08: Thumbnail Studio]
         |
  (Signoff Social)
         |
         v
[Stage 10: Dispatcher] ---(Schedule Post)---> [Stage 11: Live Verification]
```

---

## 2. Complete Forward Action Catalog

| Source Component | Action Button Label | Success Handler | Target Route / Query Param | Pipeline Advancement |
| :--- | :--- | :--- | :--- | :--- |
| `QuestionStudioPage.tsx` | "Save & Continue to Verification" | `handleSaveSuccess()` | `/questions/${created.id}/verify` | Stage 01 -> Stage 02 |
| `QuestionVerifyApprovePage.tsx`| "Approve Question & Launch Production"| `handleApproveSuccess()`| `/videos/${targetVideoId}?tab=script` | Stage 02 -> Stage 03 |
| `ScriptWorkspace.tsx` | "Approve & Start Filming" | `handleApproveScript()` | `/videos/${videoId}?tab=recording` | Stage 03 -> Stage 04/05 |
| `RecordingWorkspace.tsx` | "Raw Footage Uploaded - Begin Edit"| `handleFinishRecording()`| `/videos/${videoId}?tab=editing` | Stage 05 -> Stage 06 |
| `EditingWorkspace.tsx` | "Submit Cut for Executive Review" | `handleSubmitForQC()` | `/videos/${videoId}?tab=final-review` | Stage 06 -> Stage 07 |
| `FinalReviewWorkspace.tsx`| "Approve Video & Design Thumbnail" | `handleApproveVideo()` | `/videos/${videoId}?tab=thumbnail` | Stage 07 -> Stage 08 |
| `ThumbnailWorkspace.tsx` | "Approve Thumbnail & Package" | `handleApproveThumbnail()`| `/videos/${videoId}?tab=social` | Stage 08 -> Stage 09 |
| `SocialSimulatorWorkspace.tsx`| "Approve Social Package" | `handleApproveSocial()` | `/videos/${videoId}?tab=publishing` | Stage 09 -> Stage 10 |
| `PublishingWorkspace.tsx` | "Schedule Multi-Platform Broadcast"| `handleScheduleSuccess()`| `/publishing` | Stage 10 -> Stage 11 |
| `ProductionJourneyBar.tsx` | "Next Action: ${nextAction.label}"| `handleNextActionClick()` | `nextAction.route` | Contextually Advances |

---

## 3. Reliability Analysis

1. **State Preservation**: Forward actions pass the primary entity ID (`videoId`, `questionId`, `contentMasterId`) in the destination route, ensuring no contextual data loss.
2. **Tab Preservation**: Workspace actions update the `tab` search param rather than navigating to a separate route, ensuring immediate rendering without remounting the video context.
3. **Idempotency**: All forward transitions verify that prior stage outputs exist before enabling the progression button.
