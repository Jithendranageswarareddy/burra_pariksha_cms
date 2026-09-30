# Partial Save & Distributed Transaction Forensic Audit (8 Multi-Write Operations)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 10 of 30  
**Document:** 16 of 30  

---

## 1. Executive Summary

Because Google Sheets does not provide ACID distributed transactions, multi-sheet operations executed by BP-CMS run as sequential HTTP calls. If Step 1 succeeds and Step 2 fails, the system is left in a **partially saved, inconsistent state**. An audit identified **8 critical multi-write operations** vulnerable to partial saves without automated compensation or rollback.

---

## 2. Multi-Write Operation Vulnerability Register

| Operation ID | Operation Name | Write Sequence (Steps) | Failure Scenario | Resulting Inconsistency | Concurrency Classification |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **PART-01** | Create Question with Video | 1. Write `QUESTIONS`<br>2. Write `CONTENT_MASTERS`<br>3. Write `VIDEOS`<br>4. Write `AUDIT_LOG` | Step 1 succeeds, Step 2/3 fails on Sheets rate-limit | Question exists in library but has no linked Video or Content Master record (Orphaned entity) | PARTIAL-SAVE POSSIBLE |
| **PART-02** | Finalize Video Production | 1. Update `VIDEOS` status<br>2. Update `WORKFLOW` state<br>3. Write `ASSIGNMENTS` | Step 1 updates video to `READY_TO_PUBLISH`, Step 3 fails | Video appears ready, but publishing manager never receives assignment notification | PARTIAL-SAVE POSSIBLE |
| **PART-03** | Save Script with Version | 1. Write `SCRIPT` current<br>2. Append `SCRIPT_VERSIONS` | Step 1 updates current script, Step 2 fails | Current teleprompter has new text, but historical version log is missing historical diff | PARTIAL-SAVE POSSIBLE |
| **PART-04** | Thumbnail Selection | 1. Write `THUMBNAILS`<br>2. Update `VIDEOS.thumbnail_url` | Step 1 writes thumbnail record, Step 2 fails | Thumbnail exists in gallery but main video entity still points to placeholder | PARTIAL-SAVE POSSIBLE |
| **PART-05** | Schedule Multi-Platform Publish | 1. Update `PUBLISHING` (YouTube)<br>2. Update `PUBLISHING` (IG)<br>3. Update `PUBLISHING` (FB) | YouTube schedules, IG fails on quota | Content scheduled on YouTube but abandoned on Instagram without retry queue | PARTIAL-SAVE POSSIBLE |
| **PART-06** | Task Reassignment | 1. Cancel old `ASSIGNMENTS`<br>2. Create new `ASSIGNMENTS` | Step 1 cancels, Step 2 fails | Previous assignee is unassigned; no new assignee assigned; task becomes stranded | PARTIAL-SAVE POSSIBLE |
| **PART-07** | Taxonomy Hierarchy Delete | 1. Delete `SUBTOPICS`<br>2. Delete `TOPICS` | Step 1 deletes some subtopics, Step 2 fails | Fragmented syllabus hierarchy with dangling foreign keys | PARTIAL-SAVE POSSIBLE |
| **PART-08** | Recovery Snapshot Restore | 1. Clear active tabs<br>2. Write snapshot data | Clear succeeds, write times out after 10 tabs | Devastating data loss: 8 tabs wiped completely, remaining tabs half-restored | **CRITICAL RISK** |
