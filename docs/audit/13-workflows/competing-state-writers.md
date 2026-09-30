# Competing State Writers Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 13 of 30  
**Document:** 15 of 30  

---

## 1. Concurrency & State Ownership Vulnerability

Because Google Sheets serves as the database without row-level locks, transactions, or optimistic locking version counters, **competing services writing to the same state column create severe race conditions and data corruption**.

Static analysis identified **8 persistent state fields mutated independently by competing services**:

---

## 2. Master Competing Writers Register

| # | State Field | Entity / Sheet | Competing Writing Services | Failure Mode / Race Condition | Risk Level |
| :-: | :--- | :--- | :--- | :--- | :---: |
| **01** | `status` | Video / `VIDEOS` | 1. `video.service.ts`<br>2. `script.service.ts`<br>3. `publishing.service.ts`<br>4. `phase17-video-production.service.ts` | Script service marks `SCRIPT_READY` while editor is marking `EDITING`; last write wins, overwriting production status. | **CRITICAL** |
| **02** | `status` | Question / `QUESTIONS` | 1. `question.service.ts`<br>2. `question-validation.service.ts`<br>3. `phase13-refinement.service.ts` | Polish service resets approved question status back to draft during simultaneous verification. | **HIGH** |
| **03** | `status` | Publishing / `PUBLISHING` | 1. `publishing.service.ts`<br>2. `video.service.ts`<br>3. `phase23-production.service.ts` | Desynchronization between video status `UPLOADED` and publishing status `FAILED`. | **HIGH** |
| **04** | `status` | Assignment / `ASSIGNMENTS` | 1. `assignment.service.ts`<br>2. `video.service.ts` | Video service completing task does not coordinate with assignment completion. | **MEDIUM** |
| **05** | `thumbnail_url`| Video / `VIDEOS` | 1. `thumbnail.service.ts`<br>2. `video.service.ts`<br>3. `phase18-thumbnail-intelligence.service.ts` | Thumbnail selected in Phase 18 workspace does not update main video record in `VIDEOS` sheet. | **HIGH** |
| **06** | `script_id` | Video / `VIDEOS` | 1. `script.service.ts`<br>2. `video.service.ts` | Reverting script to prior version leaves video record pointing to obsolete script ID. | **MEDIUM** |
| **07** | `take_count` | Video / `VIDEOS` | 1. `video.service.ts`<br>2. `RecordingWorkspace.tsx` (Client) | Take counter discrepancy between client state and server record. | **LOW** |
| **08** | `workflow_stage`| Master / `CONTENT_MASTERS` | 1. `content-master.service.ts`<br>2. `workflow.service.ts` | Multiple services incrementing workflow stage out of sequence. | **HIGH** |
