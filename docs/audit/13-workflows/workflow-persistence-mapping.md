# Workflow Persistence & Logging Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 13 of 30  
**Document:** 18 of 30  

---

## 1. Dual Audit Logging Subsystems

State transitions in BP-CMS generate records in two independent Google Sheets tabs:

1. **`WORKFLOW` Sheet Tab:**
   - Dedicated lifecycle transition ledger managed by `WorkflowService` (`src/lib/services/audit.service.ts:100–165`).
   - Columns: `id`, `entity_type`, `entity_id`, `from_status`, `to_status`, `triggered_by`, `actor_name`, `remarks`, `timestamp`.

2. **`AUDIT_LOG` Sheet Tab:**
   - General system event log managed by `AuditService` (`src/lib/services/audit.service.ts:12–98`).
   - Columns: `id`, `user_id`, `user_name`, `action`, `entity_type`, `entity_id`, `details`, `timestamp`.

---

## 2. Missing Workflow Logging in Critical Services

Static trace of all 50 state mutators discovered that **only 32 services consistently record transitions in `WORKFLOW` or `AUDIT_LOG`**:
- `phase17VideoProductionService.transitionToEditing` mutates video status to `EDITING` but **does NOT call `workflowService.recordTransition()`**.
- `assignmentService.completeAssignment` updates `ASSIGNMENTS` tab but does not emit a transition log.
- `contentMasterService.archiveMaster` updates `CONTENT_MASTERS` without recording the archive transition.

**Impact:** Forensic reconstruction of entity lifecycles from the `WORKFLOW` sheet reveals severe chronological gaps and unlogged state jumps.
