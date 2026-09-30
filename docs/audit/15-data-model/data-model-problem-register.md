# Master Data Model Problem Register

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 15 of 30  
**Document:** 48 of 51  

---

## 1. Master Classified Problem Register (31 Issues)

| ID | Severity | Category | Target Entity / Area | Problem Description | Evidence |
| :--- | :---: | :--- | :--- | :--- | :--- |
| **DM-CRIT-01** | **CRITICAL** | Concurrency Collision | `Sequence` Counter | In-memory mutex allows duplicate IDs on multi-container Cloud Run scale | `sequence-safety.service.ts` |
| **DM-CRIT-02** | **CRITICAL** | Competing State | `Video.status` | 4 competing services mutate status without transactional isolation | `competing-state-writers.md` |
| **DM-CRIT-03** | **CRITICAL** | Orphan Risk | `QuestionVideo` Join | Video queue cascade failure leaves video with no question link | `video.service.ts:280` |
| **DM-CRIT-04** | **CRITICAL** | Permanent Dead-End | Video `CANCELLED` | Zero restoration paths exist in data model for cancelled videos | `terminal-state-hazards.md` |
| **DM-CRIT-05** | **CRITICAL** | Integrity Loss | Google Sheets | Zero physical foreign keys; row deletion leaves orphaned trees | `relationship-integrity.md` |
| **DM-CRIT-06** | **CRITICAL** | Binary Deletion | Google Drive Media | `DELETE /api/media/:fileId` deletes binary leaving dangling pointer in sheet | `routes.ts:1920` |
| **DM-HIGH-01** | **HIGH** | State Duplication | Question vs Video | `Question.videoStatus` desynchronizes from `Video.status` | `cross-entity-consistency.md` |
| **DM-HIGH-02** | **HIGH** | Aggregate Deadlock | `ContentMaster` | Cancelling 1 child video permanently blocks master completion | `content-master.service.ts:417` |
| **DM-HIGH-03** | **HIGH** | Type Confusion | Service Generic IDs | Methods accept `id: string`, allowing Question IDs passed to Video logic | `entity-id-audit.md` |
| **DM-HIGH-04** | **HIGH** | Unlinked Entity | `Assignment` | Completing video does not automatically update linked assignment | `assignment.service.ts:1310` |
| **DM-HIGH-05** | **HIGH** | Dual Enums | Canonical State | Two incompatible `CanonicalWorkflowState` enums declared | `canonical-workflow-divergence.md` |
| **DM-HIGH-06** | **HIGH** | JSON Fragility | `QUESTIONS.options`| Serialized JSON in sheet cell crashes parser if hand-edited | `question-entity.md` |
| **DM-HIGH-07** | **HIGH** | Partial Publication | `Publishing` | 1 platform failure flags entire package `FAILED`, risking duplicate retry | `publishing-entity.md` |
| **DM-HIGH-08** | **HIGH** | Disconnected Adapt | `PlatformAdaptation`| Adaptations generated but ignored by main publishing pipeline | `platform-adaptation-state-machine.md`|
| **DM-HIGH-09** | **HIGH** | Quota Bottleneck | Google Sheets API | 300 req/min API quota caps throughput for transactional data layer | `sheets-data-model.md` |
| **DM-HIGH-10** | **HIGH** | Missing Versioning | Entire Store | Lack of optimistic locking row versions exposes 95% of entities to races | `stale-state-detection.md` |
| **DM-MED-01** | **MEDIUM** | Inflexible Roles | `UserRole` Enum | Roles hardcoded in TypeScript rather than dynamic permission entity | `role-entity.md` |
| **DM-MED-02** | **MEDIUM** | Missing ACLs | Object Auth | Zero per-topic or per-record access control lists | `permission-entity.md` |
| **DM-MED-03** | **MEDIUM** | Memory Cache Loss | Draft Questions | Ephemeral draft cache wiped on server reboot | `draft-entity.md` |
| **DM-MED-04** | **MEDIUM** | Unbounded Audit | `AUDIT_LOG` Tab | Sheet grows unboundedly; full-table reads cause startup latency | `audit-record-entity.md` |
| **DM-MED-05** | **MEDIUM** | Disconnected Loop | Stage 15 to Stage 01| Recommendations from strategy engine do not pre-populate studio | `conceptual-data-model.md` |
| **DM-LOW-01** | **LOW** | Legacy Enums | Assignment Enum | Legacy `PENDING` string retained in assignment code | `assignment.service.ts:102` |
| **DM-LOW-02** | **LOW** | Unused Join Fields | `QUESTION_VIDEOS` | Contains legacy sequence columns not consumed by UI | `question-videos.repository.ts` |
