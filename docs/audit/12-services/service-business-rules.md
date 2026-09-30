# Service Business Rules Forensic Audit (64 Domain Rules)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 12 of 30  
**Document:** 07 of 30  

---

## 1. Overview of Business Rules in Service Layer

Business rules enforce domain logic, state invariants, pedagogical standards, and editorial constraints. Across all 72 services, **64 distinct business rules** were identified and cataloged.

---

## 2. Core Business Rules Register (Sample by Subsystem)

| Rule ID | Host Service | Business Rule Condition | Expected Invariant | Side Effect Triggered |
| :--- | :--- | :--- | :--- | :--- |
| **BR-01** | `question.service.ts` | Question Creation | Must have exactly 4 options (A, B, C, D); correct option must be in `['A','B','C','D']` | Creates linked `CONTENT_MASTERS` row |
| **BR-02** | `question.service.ts` | Question Verification | If status == `REJECTED`, `rejectionReason` must be non-empty string | Status set to REJECTED; audit event emitted |
| **BR-03** | `question.service.ts` | Question Approval | Verification score must be >= 80 to transition to `VERIFIED` | Automatically initiates Video Production entity |
| **BR-04** | `script.service.ts` | Script Duration Pacing | Spoken duration calculated as `wordCount / (wpm / 60)`; must be between 30s and 180s | Flags warning if exceeding 180s |
| **BR-05** | `script.service.ts` | Script Versioning | Every save to an approved script must append a diff snapshot to `SCRIPT_VERSIONS` | Version number incremented monotonically |
| **BR-06** | `video.service.ts` | Take Submission | `takeNumber` must increment monotonically per video entity | Appends take metadata to `VIDEOS` sheet |
| **BR-07** | `video.service.ts` | QC Signoff | All 12 Quality Control checklist points must be verified true | Sets status to `READY_TO_PUBLISH`; assigns publish task |
| **BR-08** | `publishing.service.ts` | Scheduling Window | `scheduledTime` must be at least 15 minutes in future and within 30 days | Creates scheduled job in publishing queue |
| **BR-09** | `assignment.service.ts` | Workload Cap | Team member cannot be assigned > 5 active video tasks simultaneously | Rejects assignment with `WORKLOAD_EXCEEDED` error |
| **BR-10** | `sequence-safety.service.ts` | ID Continuity | Sequential ID gaps greater than 1 must be flagged and repaired | Locks sequence counter during allocation |
