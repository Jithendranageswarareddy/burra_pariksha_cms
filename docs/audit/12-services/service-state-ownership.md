# Service State Ownership & Competing Writers Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 12 of 30  
**Document:** 11 of 30  

---

## 1. State Ownership Principles

An architectural invariant of clean systems is that **each state field should have a single authoritative domain service owner**.
Static code analysis discovered **8 state fields with competing writers**, where multiple distinct services mutate the same status column independently without shared locks.

---

## 2. Competing State Writers Register

| State Field | Target Entity | Competing Services Modifying Field | Consequence of Competing Writers | Risk Level |
| :--- | :--- | :--- | :--- | :---: |
| `status` | Video | `video.service.ts`<br>`script.service.ts`<br>`publishing.service.ts`<br>`phase17-video-production.service.ts` | Services overwrite video status without verifying intermediate stages; race conditions on simultaneous saves | **CRITICAL** |
| `status` | Question | `question.service.ts`<br>`question-validation.service.ts`<br>`phase13-refinement.service.ts` | Polish service can revert approved question status back to draft | **HIGH** |
| `status` | Publishing | `publishing.service.ts`<br>`video.service.ts`<br>`phase23-production.service.ts` | Inconsistent publishing status between `VIDEOS` and `PUBLISHING` sheets | **HIGH** |
| `status` | Assignment | `assignment.service.ts`<br>`video.service.ts` | Completing video fails to automatically mark assignment completed | **MEDIUM** |
| `thumbnail_url` | Video | `thumbnail.service.ts`<br>`video.service.ts`<br>`phase18-thumbnail-intelligence.service.ts` | Thumbnail selected in workspace not propagated to main video record | **HIGH** |
| `script_id` | Video | `script.service.ts`<br>`video.service.ts` | Video record points to stale script ID upon new version creation | **MEDIUM** |
| `take_count` | Video | `video.service.ts`<br>`RecordingWorkspace.tsx` (Local) | Take counter discrepancy between database and local state | **LOW** |
| `workflow_stage`| ContentMaster| `content-master.service.ts`<br>`workflow.service.ts` | Multi-master workflow stage desynchronization | **HIGH** |
