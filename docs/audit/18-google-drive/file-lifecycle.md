# File Lifecycle & Workflow Conveyor Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 18 of 30  
**Document:** 23 of 40  

---

## 1. File Conveyor Progression (Stages 1 through 15)

Media files travel through the 15-stage conveyor lifecycle:

```
1. Stage 06 (Teleprompter Recording):
   - Presenter records take -> uploaded to Drive /Videos folder
   - Status: RECORDED | File: vd1.1.mp4 | MediaAsset: RAW Take 1

2. Stage 07 (Raw Footage Ingestion & Handoff):
   - Teleprompter review sign-off -> Video status: EDITING
   - Editor downloads raw stream via /api/videos/:id/stream

3. Stage 08 (Post-Production Editing Bay):
   - Editor uploads cuts (edited_cut_v1.mp4, edited_cut_v2.mp4)
   - Stored in Edited/ folder -> MediaAsset: EDITED

4. Stage 09 (Final QC Review & Sign-off):
   - Master render uploaded -> final_published_render.mp4
   - Final QC 12-point checklist verified -> Status: READY_FOR_REVIEW

5. Stage 10 (Thumbnail Design & Review):
   - Designer uploads thumbnail to Thumbnails/ folder (<= 5MB)
   - Status: PENDING_REVIEW -> Approved -> THUMBNAILS.drive_file_id

6. Stage 12 (Distribution Packaging):
   - Video (FINAL) + Thumbnail (APPROVED) packaged for publishing
   - Status: READY_TO_UPLOAD

7. Stage 13 (Multi-Platform Publishing):
   - Distribution service uploads to YouTube/Instagram
   - Status: UPLOADED / PUBLISHED
```

---

## 2. Hard Safety Gates Linked to Files
- **Gate D (Editing Bay Handoff):** Cannot transition to `EDITING` unless `video.driveFileId` is populated and references an accessible file.
- **Gate E (Final QC Sign-off):** Cannot transition to `FINAL_REVIEW` without valid master render file.
- **Gate F (Distribution Packaging):** Blocks publishing if `video.driveFileId` or `thumbnail.driveFileId` is missing.
