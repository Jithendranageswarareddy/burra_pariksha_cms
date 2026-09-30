# Critical Workflow Execution Traces

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 13 of 30  
**Document:** 27 of 30  

---

## 1. Trace 1: The Canonical Question-to-Publish Happy Path

1. **Stage 01 (Question Gen):** User prompts `POST /api/questions/create`. Gemini 2.5 generates question; written to `QUESTIONS` tab with `status: DRAFT`.
2. **Stage 02 (Verification):** SME opens `/questions/verify`. Automated validator runs; score = 88 (`validationStatus: VALID`). SME clicks "Approve" -> `POST /api/questions/draft/:id/approve` -> `status: APPROVED`.
3. **Queueing:** SME clicks "Queue Video" -> `POST /api/questions/:id/queue` -> Creates record in `VIDEOS` (`status: QUEUED`), updates question `videoStatus: QUEUED`.
4. **Stage 03 (Script):** Scriptwriter generates script -> `POST /api/videos/:id/script` -> SME approves -> `POST /api/videos/:id/script/mark-ready` -> Video `status: SCRIPT_READY`.
5. **Stage 04 & 05 (Filming):** Talent opens `/record`. Spoken takes uploaded to Drive -> Video `status: RECORDED`.
6. **Stage 06 (Editing):** Editor cuts 9:16 vertical render -> Uploads cut to Drive -> Video `status: EDITED`.
7. **Stage 07 (QC):** QC Lead verifies 12-point checklist -> Clicks "Sign Off QC" -> Video `status: READY_TO_UPLOAD`.
8. **Stage 08 (Thumbnail):** Thumbnail designer produces 720x1280 card -> Lead approves -> Thumbnail `status: APPROVED`.
9. **Stage 09 & 10 (Review):** Social review bundle compiled. Quality score = 92. Lead signs off -> `SocialReviewStatus: APPROVED`.
10. **Stage 11 & 12 (Publishing):** `POST /api/videos/:id/publishing/schedule` -> Background worker executes upload to YouTube Data API -> Platform video ID returned -> Video `status: UPLOADED`, Publishing `status: PUBLISHED`.
11. **Stage 13–15 (Feedback Loop):** YouTube views synced -> Metrics aggregated -> AI Strategy engine suggests new question topics.

---

## 2. Trace 2: The Script Rejection & Retake Loop

1. In Stage 04, Host discovers teleprompter script has unnatural phrasing.
2. Host clicks "Return Script to Editing" in `/record`.
3. API invokes `POST /api/videos/:videoId/script/return-to-editing`.
4. Video transitions `SCRIPT_READY -> SCRIPT_REQUIRED`.
5. Video Editor / Copywriter re-opens `/scripts`, modifies copy, and re-submits for approval.
6. Once re-approved, video returns to `SCRIPT_READY`, unblocking the teleprompter.
