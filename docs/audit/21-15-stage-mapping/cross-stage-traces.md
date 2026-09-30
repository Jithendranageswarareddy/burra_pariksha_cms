# Cross-Stage Execution Traces (15 Canonical Traces)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 21 of 30  
**Document:** 27 of 31  

---

## 1. Execution Traces Across All 15 Transitions

- **Trace 01 (01 -> 02):** Question draft saved -> Dispatches `navigate('/questions/' + draftId + '/verify')`.
- **Trace 02 (02 -> 03):** Question approved -> Video auto-queued -> Dispatches `navigate('/videos/' + videoId + '?tab=script')`.
- **Trace 03 (03 -> 04):** Script v1 saved -> Switches tab to `?tab=recording`.
- **Trace 04 (04 -> 05):** Filming session completed -> Remains on `?tab=recording` for file upload.
- **Trace 05 (05 -> 06):** Raw MP4 uploaded -> Chained 3-call workaround dispatches to `?tab=editing`.
- **Trace 06 (06 -> 07):** Master render linked -> Switches tab to `?tab=final-review`.
- **Trace 07 (07 -> 08):** 6-point QC signed -> Switches tab to `?tab=thumbnail`.
- **Trace 08 (08 -> 09):** Thumbnail approved -> Dispatches `navigate('/social-review/' + reviewId)`.
- **Trace 09 (09 -> 10):** Social package signed off -> Dispatches `navigate('/publishing')`.
- **Trace 10 (10 -> 11):** Scheduled release confirmed -> Enters live platform URLs.
- **Trace 11 (11 -> 12):** Live URLs saved -> Dispatches `navigate('/platform-packages')`.
- **Trace 12 (12 -> 13):** Sync confirmed -> Dispatches `navigate('/social-analytics/' + contentId)`.
- **Trace 13 (13 -> 14):** Metrics entered -> Dispatches `navigate('/analytics/engagement')`.
- **Trace 14 (14 -> 15):** Retention curves analyzed -> Switches tab to `/analytics/intelligence`.
- **Trace 15 (15 -> 01):** AI strategy applied -> Dispatches `navigate('/studio?topicId=...')` (Flywheel Loopback).
