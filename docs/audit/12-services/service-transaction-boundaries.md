# Service Transaction Boundaries & Multi-Write Audit (19 Operations)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 12 of 30  
**Document:** 18 of 30  

---

## 1. Executive Summary

Because Google Sheets does not provide two-phase commit transactions, multi-sheet operations executed by BP-CMS run as sequential HTTP calls.
An audit identified **19 service methods performing multiple sequential persistence writes without automated atomic rollback**.

---

## 2. Multi-Write Operation Vulnerability Register (Sample)

| Service Method | Sequential Write Steps | Failure Scenario | Resulting Inconsistency | Classification |
| :--- | :--- | :--- | :--- | :--- |
| `questionService.createQuestion()` | 1. Append `QUESTIONS`<br>2. Append `CONTENT_MASTERS`<br>3. Append `AUDIT_LOG` | Step 1 succeeds; Step 2 fails on Google Sheets 429 quota | Question exists in library but is orphaned without master record | **PARTIAL SAVE RISK** |
| `videoService.signoffQc()` | 1. Update `VIDEOS` (status)<br>2. Update `WORKFLOW`<br>3. Append `ASSIGNMENTS` | Step 1 succeeds; Step 3 fails | Video marked `READY_TO_PUBLISH`, but publishing manager task is never assigned | **PARTIAL SAVE RISK** |
| `publishingService.schedulePublishing()` | 1. Update `PUBLISHING` (YT)<br>2. Update `PUBLISHING` (IG)<br>3. Update `VIDEOS` | Step 1 succeeds; Step 2 fails | Content scheduled on YouTube but dropped on Instagram without retry | **PARTIAL SAVE RISK** |
| `fullSnapshotRestoreExecutionService.executeRestore()`| 1. Clear 18 sheets<br>2. Repopulate 18 sheets | Step 1 clears; Step 2 fails midway on sheet 11 | **DISASTER**: Database left half-empty with 8 deleted sheets | **CRITICAL RISK** |
