# Cross-Entity Consistency & State Duplication Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 15 of 30  
**Document:** 33 of 51  

---

## 1. Forensic Discovery: Duplicated State Columns

A major architectural finding is that **state is frequently duplicated across related sheets**:

### The `Question.videoStatus` vs `Video.status` Conflict
- `QUESTIONS` sheet tab has column H: `video_status`.
- `VIDEOS` sheet tab has column E: `status`.
- Both store enum `VideoProductionStatus` values (e.g. `QUEUED`, `RECORDED`, `EDITED`).
- When a video progresses from `RECORDED` to `EDITING` in `video.service.ts`, the service updates `VIDEOS.status`. However, in 3 out of 7 transition methods (`phase17:382`, `routes.ts:740`), **the secondary update to `QUESTIONS.video_status` is skipped**!
- *Result:* The Question reports `video_status: QUEUED` while the actual Video record is already in `EDITING` or `EDITED` status.
