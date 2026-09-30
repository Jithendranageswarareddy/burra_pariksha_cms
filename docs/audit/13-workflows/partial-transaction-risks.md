# Partial Transaction Risks & State Cascade Hazards

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 13 of 30  
**Document:** 19 of 30  

---

## 1. Google Sheets Multi-Step Transaction Vulnerability

Because Google Sheets does not provide two-phase commit (2PC) or distributed ACID transactions, operations that mutate multiple sheets sequentially are vulnerable to **partial failure**:

```
Step 1: Write to Sheet A (SUCCESS)
Step 2: Write to Sheet B (NETWORK TIMEOUT / QUOTA ERROR 429)
Step 3: Rollback Step 1? (NO AUTOMATED ROLLBACK IMPLEMENTED!)
Result: Corrupted / Desynchronized System State
```

---

## 2. High-Risk Multi-Sheet Cascade Operations

Static analysis identified **19 multi-sheet cascade operations** at extreme risk of partial transaction failure:

1. **`videoService.queueApprovedQuestion`:**
   - Sequential writes: `VIDEOS` -> `QUESTIONS` (videoStatus) -> `QUESTION_VIDEOS` -> `WORKFLOW` -> `AUDIT_LOG`.
   - If `QUESTION_VIDEOS` fails, the Video exists in `VIDEOS`, but the join table is missing, creating an orphaned video with no question relation.
2. **`publishingService.finalizePublishing`:**
   - Sequential writes: `PUBLISHING` -> `VIDEOS` (status=UPLOADED) -> `CONTENT_MASTERS` (status=COMPLETED) -> `AUDIT_LOG`.
   - If `CONTENT_MASTERS` fails, the video is marked `UPLOADED`, but the master remains `ACTIVE`, permanently blocking completion.
3. **`questionService.createQuestion`:**
   - Sequential writes: `QUESTIONS` -> `CONTENT_MASTERS` -> `AUDIT_LOG`.
   - If master write fails, an orphaned question exists without a parent curriculum container.
