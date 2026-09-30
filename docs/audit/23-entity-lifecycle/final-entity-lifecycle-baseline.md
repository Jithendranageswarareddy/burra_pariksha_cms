# Final Entity Lifecycle Baseline Specification

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 23 of 35  
**Document:** 35 of 35  

---

## 1. Executive Forensic Verdict

> **"Can one real content item currently travel from Question Generation all the way through Intelligence Loop without breaking?"**  
> **FORENSIC VERDICT: PARTIALLY**

### Summary Evidence:
1. **End-to-End Traversability:** A real content item (`BP-Q-000001` / `BP-V-000001`) successfully travels through Stages 01 to 11 when guided by a human operator through the UI.
2. **Break Points:**
   - **First Hard Break:** Browser reload on `/questions/BP-DFT-*/verify` throws `HTTP 404` due to stale draft ID lookup after draft row deletion.
   - **State Machine Barrier:** Direct progression to `EDITING` throws illegal transition unless bypassed via 3 sequential PATCH requests.
   - **First Soft Break:** `VideoService.transitionStatus()` swallows Question status sync errors, causing silent state drift.
   - **Publishing Cascade Void:** Publishing live platform URLs marks `PUBLISHING` sheet as `PUBLISHED` but leaves `Video.status` in `VIDEOS` sheet as `READY_TO_UPLOAD`.
   - **Automation Voids:** Stages 12 and 13 lack automated external background workers (YouTube/Meta APIs) and depend on simulated UI toggles and manual form entry.
   - **Intelligence Loop:** Recommendations are synthesized via Gemini AI, but loopback to Stage 01 requires a human click to redirect to `/studio`.

---

## 2. Reference Content Item Verified at Runtime

- **Canonical Question:** `BP-Q-000001` (Status: `APPROVED`, `videoStatus: QUEUED`)
- **Canonical Content Master:** `BP-CNT-000001` (Status: `DRAFT`)
- **Canonical Video:** `BP-V-000001` (Status: `QUEUED`, Drive File: `1hE5dPcuPByYdUogk5AEKEO7JSKeK_9EK`, File: `vd1.2.mp4`)
- **Canonical Script:** `BP-S-000001` (Linked to `BP-Q-000001`)
- **Canonical Publishing:** `PUB-000001` (Linked to `BP-V-000001`, `pinnedCommentReady: true`, `thumbnailReady: false`)

---

## 3. Longest Verified Path

```
Stage 01 (Question Generation)
  ↓ [PASS]
Stage 02 (Question Verification & Canonicalization)
  ↓ [PASS]
Stage 03 (Audience Script)
  ↓ [PASS]
Stage 04 (Teleprompter & Filming)
  ↓ [PASS]
Stage 05 (Raw Video Handoff to Drive)
  ↓ [PASS]
Stage 06 (Video Editing Bay)
  ↓ [PASS via 3-step PATCH jump]
Stage 07 (Final QC Certification)
  ↓ [PASS]
Stage 08 (Thumbnail Studio)
  ↓ [PASS]
Stage 09 (Social Review & Packaging)
  ↓ [PASS]
Stage 10 (Publishing Setup & Gate D)
  ↓ [PASS]
Stage 11 (Published / Live Recording)
```

---

## 4. Final Required Conclusion

1. **Can one content item currently travel end-to-end?**  
   **PARTIALLY.** It can reach live publication and analytics review, but requires human intervention to bypass state machine barriers, avoid browser reloads on draft URLs, manually enter external metrics, and click the flywheel loopback.
2. **Where does the current implementation FIRST break?**  
   - **Stage:** Stage 02 (Question Verification)
   - **Entity:** `QuestionDraft` (`BP-DFT-529472-5SOD`)
   - **Action:** Browser Reload on `/questions/:id/verify`
   - **API:** `GET /api/questions/BP-DFT-529472-5SOD`
   - **Failure:** `HTTP 404: Question with ID "BP-DFT-529472-5SOD" not found`
   - **Evidence:** Draft row deleted from `QUESTION_DRAFTS` while URL bar retains stale draft ID.
3. **What is the longest currently verified lifecycle path?**  
   **Stage 01 (Question Generation) through Stage 11 (Published / Live Recording).**
