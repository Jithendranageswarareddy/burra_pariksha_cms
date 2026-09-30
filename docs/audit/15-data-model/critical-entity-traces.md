# Critical Entity Execution Traces

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 15 of 30  
**Document:** 49 of 51  

---

## 1. Trace: Question-to-Master-to-Video Entity Cascades

1. **Step 1 (Question Creation):** User submits question prompt. Server allocates `BP-Q-000042` via `sequenceSafetyService`. Appends row to `QUESTIONS`.
2. **Step 2 (Content Master Instantiation):** Server allocates `BP-CNT-000018`. Appends row to `CONTENT_MASTERS` with `primary_question_id = 'BP-Q-000042'`.
3. **Step 3 (Video Queueing):** Lead queues question. Server allocates `BP-V-000042`. Appends row to `VIDEOS` with `question_id = 'BP-Q-000042'` and `content_master_id = 'BP-CNT-000018'`.
4. **Step 4 (Bridge Association):** Appends row to `QUESTION_VIDEOS` linking `BP-Q-000042` and `BP-V-000042`.
5. **Step 5 (Publishing Pre-Allocation):** Appends row to `PUBLISHING` with `video_id = 'BP-V-000042'`.
