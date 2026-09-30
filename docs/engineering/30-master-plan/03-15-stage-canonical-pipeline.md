# Step 30: 03 — Canonical 15-Stage Production Pipeline Specification

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Document Type:** 15-Stage Production Pipeline Engineering Specification  
**Status:** **AUTHORITATIVE BLUEPRINT**  
**Date:** 2026-09-29  

---

## 1. Canonical 15-Stage Lifecycle Architecture

The Burra Pariksha Content Management System operates on a strict, end-to-end 15-stage content creation lifecycle. The target architecture unifies all divergent state enums into this single canonical lifecycle.

```
+---------------------------------------------------------------------------------------------------------+
|                                    15-STAGE CANONICAL PRODUCTION PIPELINE                                |
+---------------------------------------------------------------------------------------------------------+
| STAGE 01: QUESTION GENERATION     | Ingest raw question, AI bilingual generation, schema validation    |
| STAGE 02: QUESTION VERIFICATION   | Peer review, fact-check, Telugu grammar validation, canonicalize   |
| STAGE 03: SCRIPT CREATION         | Teleprompter script authoring, timing calculation, pronunciation   |
| STAGE 04: FILMING / RECORDING     | Studio recording, teleprompter execution, raw take selection       |
| STAGE 05: RAW VIDEO INGESTION     | Multi-part chunked upload to Google Drive Raw folder, integrity QC |
| STAGE 06: VIDEO EDITING           | Motion graphics, Telugu captions, cuts, color grading              |
| STAGE 07: EDITING REVIEW & QC     | Quality certification, audio loudness check (-14 LUFS), resolution |
| STAGE 08: THUMBNAIL GENERATION    | AI thumbnail prompt, high-res canvas composite, A/B variants       |
| STAGE 09: SOCIAL MEDIA REVIEW     | Multi-platform copy (YT, Insta, X), pinned comments, hashtags      |
| STAGE 10: PUBLISHING CONFIG       | Scheduling matrix, platform selection, visibility permissions       |
| STAGE 11: MULTI-PLATFORM PUBLISH  | Automated distribution via YouTube Data API & Meta Graph API       |
| STAGE 12: PLATFORM VERIFICATION   | Post-live status check, URL verification, pinned comment sync      |
| STAGE 13: PERFORMANCE INGESTION   | Automated metrics polling (views, retention, CTR, engagement)      |
| STAGE 14: PERFORMANCE DIAGNOSIS   | Drop-off curve analysis, CTR benchmarking, topic heatmapping       |
| STAGE 15: INTELLIGENCE SYNTHESIS  | Loop-closing topic generation, prompt tuning, feeding Stage 01     |
+---------------------------------------------------------------------------------------------------------+
```

---

## 2. Stage-by-Stage Engineering Matrix

| Stage ID | Stage Name | Primary Role | Inputs Required | Required Outputs / Artifacts | Target Validation Gate | Next Valid States |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **01** | `QUESTION_GENERATION` | `QUESTION_CREATOR` | Topic, Difficulty, Exam Type | Bilingual Question Draft (`BP-DFT-*`) | Gate A: Schema & Format Check | `02`, `REJECTED` |
| **02** | `QUESTION_VERIFICATION` | `REVIEWER` | Question Draft | Canonical Question ID (`BP-Q-*`), Content Master (`BP-CNT-*`) | Gate B: Reviewer Verification (No Self-Approval) | `03`, `01` (Revision) |
| **03** | `SCRIPT_CREATION` | `SCRIPT_WRITER` | Canonical Question | Script (`BP-S-*`), Timing & Pronunciation notes | Script Character Count & Timing Check | `04`, `02` |
| **04** | `FILMING_RECORDING` | `STUDIO_PRESENTER` | Script, Teleprompter | Video Record (`BP-V-*`), Selected Takes | Studio Host Assignment Check | `05`, `03` |
| **05** | `RAW_VIDEO_INGESTION` | `STUDIO_PRESENTER` | Video Record, Raw MP4 | Google Drive File ID (`1hE5...`), SHA256 checksum | File Integrity & Duration Check | `06`, `04` |
| **06** | `VIDEO_EDITING` | `VIDEO_EDITOR` | Raw Video, Script | Edited Master MP4, Telugu Subtitle track (VTT/SRT) | Assigned Editor Check | `07`, `05` |
| **07** | `EDITING_REVIEW_QC` | `REVIEWER` / `TOPIC_LEAD` | Edited Video, Subtitles | QC Certification Record, Loudness Report | Gate C: Video/Audio QC Pass | `08`, `06` (Revision) |
| **08** | `THUMBNAIL_GENERATION` | `THUMBNAIL_DESIGNER` | Question & Video | Master Thumbnail PNG (1280x720, < 2MB), Drive ID | Image Dimensions & Aspect Ratio Check | `09`, `08` |
| **09** | `SOCIAL_MEDIA_REVIEW` | `COMMUNITY_MANAGER` | Question, Video, Thumb | Multi-platform Copy, Pinned Comments, Tags | Platform Character Limits & Hashtags | `10`, `09` |
| **10** | `PUBLISHING_CONFIG` | `PUBLISHING_MANAGER` | Social Copy, Thumbnail | Publishing Record (`PUB-*`), Publish Schedule | Gate D: Complete Pre-Publish Validation | `11`, `09` |
| **11** | `MULTI_PLATFORM_PUBLISH`| System Worker / `PUBLISHER` | Publishing Record | YouTube Video ID, Instagram Reel ID, Post URLs | Platform API 200 OK Response | `12`, `10` (Error) |
| **12** | `PLATFORM_VERIFICATION` | `COMMUNITY_MANAGER` | Live Post URLs | Verified Live Status, First Comment Posted Confirmation | HTTP Status 200 on Platform URLs | `13`, `11` |
| **13** | `PERFORMANCE_INGESTION` | System Worker | Live Video IDs | 24h/7d/30d Metrics (Views, Watch Time, Likes, CTR) | Metric Range & Sanity Check | `14` |
| **14** | `PERFORMANCE_DIAGNOSIS` | `ANALYTICS_VIEWER` | Aggregated Metrics | Diagnostic Report, Audience Drop-off Points | Diagnostic Algorithm Evaluation | `15` |
| **15** | `INTELLIGENCE_SYNTHESIS`| `CONTENT_MANAGER` | Diagnostic Insights | Future Topic Recommendations, Prompt Directives | 1-Click Studio Ingestion Payload | `01` (Loop Closed) |

---

## 3. Critical Fixes for Audited Workflow Breaks

### 3.1 Remediation of BRK-HD-01 (Draft Reload 404)
- **Problem:** In Stage 02, approving a draft deletes `QUESTION_DRAFTS` and creates `BP-Q-000001`, but browser URL retains the old draft ID.
- **Blueprint Fix:**
  1. Draft canonicalization performs an atomic database transaction moving data to `questions`.
  2. Server responds with `{ canonicalId: 'BP-Q-000001', redirectUrl: '/questions/BP-Q-000001' }`.
  3. Frontend React Router immediately executes `navigate('/questions/BP-Q-000001', { replace: true })`.

### 3.2 Remediation of BRK-HD-02 (`QUEUED -> EDITING` Barrier)
- **Problem:** In Stage 06, state machine blocked direct transition from `QUEUED` to `EDITING`, forcing client to make 3 consecutive API PATCH hops.
- **Blueprint Fix:**
  - Explicitly permit `QUEUED -> EDITING` and `FILMED -> EDITING` directly in `StateTransitionGraph`.
  - Single atomic API call `POST /api/videos/:id/claim-editing` automatically assigns editor and moves state to `EDITING`.

### 3.3 Remediation of BRK-SF-02 (Publishing Status Desynchronization)
- **Problem:** Stage 11 updates `Publishing.status = PUBLISHED` but leaves `Video.status = READY_TO_UPLOAD`.
- **Blueprint Fix:**
  - Cascade publishing event across all linked records in a single database transaction:
  ```sql
  UPDATE content_items SET status = 'PUBLISHED', updated_at = NOW() WHERE id = :contentId;
  UPDATE videos SET status = 'PUBLISHED', updated_at = NOW() WHERE content_id = :contentId;
  UPDATE questions SET video_status = 'PUBLISHED', updated_at = NOW() WHERE content_id = :contentId;
  UPDATE publishing_records SET status = 'PUBLISHED', published_at = NOW() WHERE id = :publishingId;
  ```
