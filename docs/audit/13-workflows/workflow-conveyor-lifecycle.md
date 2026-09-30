# 15-Stage Conveyor Lifecycle Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 13 of 30  
**Document:** 02 of 30  

---

## 1. Conveyor Belt Model Overview

BP-CMS structures all educational video content production along a linear, 15-stage canonical conveyor belt defined in `src/lib/workflow/canonical-workflow.ts`. Each stage represents a discrete production milestone with dedicated input/output artifacts, completion gates, and failure/revision routes.

```
[01: Question Gen] -> [02: Verification] -> [03: Scriptwriting] -> [04: Teleprompter]
       ^                     |                      |                     |
       |                     v                      v                     v
   Loopback            [Rejection]            [Script Rev]           [Retake]
       |
[05: Raw Footage]  -> [06: Editing Bay]  -> [07: Final QC]       -> [08: Thumbnail]
                             |                      |                     |
                             v                      v                     v
                        [Re-edit]              [QC Reject]           [Redesign]
       |
[09: Pinned Comment] -> [10: Social Review] -> [11: Scheduling] -> [12: Published]
                             |
                             v
                        [Changes Req]
       |
[13: Platform Sync] -> [14: Analytics]   -> [15: Intelligence] --- (Loops back to 01)
```

---

## 2. Canonical 15-Stage Production Specification

| Stage # | Stage Name | Path Route | Input Entity | Output Entity | Mandatory Completion Gate | Forward Route | Revision Route | Rejection Route |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **01** | Question Generation | `/studio` | Syllabus taxonomy & prompt | `Question` (DRAFT / GENERATED) | Valid 4-option MCQs with explanation | Stage 02 | `/studio` | `/library` |
| **02** | Question Verification | `/questions/verify` | Unverified Question | `Question` (APPROVED) | Score >= 80, valid curriculum mapping | Stage 03 | `/questions/improve` | `/library` |
| **03** | Audience Script | `/scripts` | Approved Question | `Script` (APPROVED) | Target duration <= 180s, Telugu tone | Stage 04 | `/scripts` | `/scripts` |
| **04** | Teleprompter & Filming | `/record` | Approved Script | Raw recording session | Spoken takes completed | Stage 05 | `/record` | `/scripts` |
| **05** | Raw Video Handoff | `/production` | Camera take video files | `Video` (Drive raw URL) | Drive asset verified and uploaded | Stage 06 | `/production` | `/record` |
| **06** | Editing Bay | `/production` | Raw Video file & cut notes | `Video` (Drive edit URL) | 1080x1920 9:16 vertical render | Stage 07 | `/production` | `/production` |
| **07** | Final QC Sign-off | `/qc` | Rendered Video Cut | `Video` (READY_TO_UPLOAD) | 12-point QC checklist passes | Stage 08 | `/production` | `/record` |
| **08** | Thumbnail Creation | `/thumbnails` | Video & Concept prompt | `Thumbnail` (APPROVED) | 720x1280 image approved | Stage 09 | `/thumbnails` | `/thumbnails` |
| **09** | Pinned Comment | `/comments` | Explanation & Telegram link| `PinnedComment` (READY) | Non-empty text, validated links | Stage 10 | `/comments` | `/comments` |
| **10** | Social Review Package | `/review` | Video, Thumb, Comment, Tags| `SocialReviewBundle` (APPROVED)| Human reviewer sign-off | Stage 11 | `/review` | `/review` |
| **11** | Publishing Setup | `/publishing` | Approved Package & Schedule | Platform schedule job | ISO timestamp in future, auth token | Stage 12 | `/publishing` | `/review` |
| **12** | Live Distribution | `/publishing` | Scheduled payload | Live Platform Posts | Video ID returned from YouTube API | Stage 13 | `/publishing` | `/publishing` |
| **13** | Platform Verification | `/publishing` | Platform Post ID | `Publishing` (Sync status) | YouTube, IG, FB confirmed live | Stage 14 | `/publishing` | `/publishing` |
| **14** | Analytics Harvesting | `/analytics` | Live Platform URLs | Performance metrics | View, watch time, retention stats | Stage 15 | `/analytics` | N/A |
| **15** | Performance Intelligence| `/analytics/strategy`| Multi-dimensional metrics| AI Strategy Recommendations | Strategy applied to Question Studio | Stage 01 | `/analytics` | N/A |

---

## 3. Structural Vulnerabilities in Conveyor Implementation

1. **Linearity vs Concurrency Paradox:** While the canonical model treats Stages 08 (Thumbnail) and 09 (Pinned Comment) as sequential steps following Stage 07 (QC), in operational practice these creative tasks are executed in parallel by different team members while editing is in progress. The strict conveyor gating artificially blocks thumbnail approval if video QC has not completed.
2. **Infinite Rejection Loops:** Stages 01 and 02 provide rejection loops to `/library`, but the Question entity status remains `REJECTED`. No automated garbage collection or archiving removes perpetually rejected questions, resulting in 40+ stale questions cluttering queue views.
3. **Loopback Mechanism Disconnect:** Stage 15 claims to loop back to Stage 01 by applying AI Strategy Recommendations to Question Studio (`/studio`). Code inspection of `src/pages/QuestionStudioPage.tsx` reveals that query parameters or recommendation payloads from `/analytics/strategy` are not parsed or auto-populated into the prompt generator, making this loopback purely conceptual.
