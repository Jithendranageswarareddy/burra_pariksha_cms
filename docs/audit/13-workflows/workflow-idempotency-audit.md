# Workflow Idempotency & Replay Safety Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 13 of 30  
**Document:** 21 of 30  

---

## 1. Idempotency Invariants

In distributed workflow systems, transition commands must be **idempotent**: repeating the same command should yield the exact same end state without duplicating side effects, allocating new IDs, or corrupting state histories.

---

## 2. Idempotency Implementations & Vulnerabilities

| Transition Endpoint / Service Method | Idempotency Guard Present? | Mechanism Employed | Vulnerability / Defect | Risk Level |
| :--- | :---: | :--- | :--- | :---: |
| `workflowOrchestrationService.transitionToCanonicalState` | **YES** | `if (previousState === targetState) return summaryBefore;` (`line 638`) | Clean no-op; safe from replay | LOW |
| `questionService.createQuestion` | **YES** | Deterministic SHA-256 payload fingerprint cache | Memory-bounded cache (1,000 entries); restarts wipe cache | MEDIUM |
| `videoService.queueApprovedQuestion` | **NO** | None! | Calling twice creates two duplicate Video rows in `VIDEOS` sheet for the same question! | **CRITICAL** |
| `publishingService.schedulePublishing` | **NO** | None! | Re-clicking schedule button appends duplicate schedule entries | **HIGH** |
| `assignmentService.assignToUser` | **PARTIAL** | `creationLockMap` | In-flight promise locking; does not protect across cluster restarts | MEDIUM |
| `phase18ThumbnailService.approveCandidate` | **NO** | None! | Duplicate approval calls emit duplicate audit events | LOW |
