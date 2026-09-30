# Critical Endpoint Forensic Traces (5 High-Impact Operations)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 11 of 30  
**Document:** 31 of 30  

---

## 1. Deep Forensic Traces for Critical Operations

### Trace 1: `POST /api/videos/:id/final-qc` (QC Signoff)
- **Route**: `POST /api/videos/:id/final-qc`
- **Controller**: `routes.ts:740`
- **Authentication**: Bearer JWT session token
- **Authorization**: Required Role `LEAD` / `ADMIN`
- **Validation**: Enforces 12-point QC checklist items are all true.
- **Service**: `src/lib/services/video.service.ts` -> `signoffQc()`
- **Business Rule**: Transitions status from `FINAL_REVIEW` to `READY_TO_PUBLISH`. Allocates publishing task to social manager.
- **Storage**: Updates `VIDEOS` sheet tab; writes new task to `ASSIGNMENTS` tab; appends to `AUDIT_LOG`.
- **Side Effect Risk**: 3 sequential writes; non-atomic.

### Trace 2: `POST /api/publishing/schedule` (Platform Scheduling)
- **Route**: `POST /api/publishing/schedule`
- **Controller**: `routes.ts:1040`
- **Authentication**: Bearer JWT session token
- **Authorization**: Manager role
- **Validation**: Datetime in future; at least 1 platform selected.
- **Service**: `src/lib/services/publishing.service.ts` -> `schedulePublishing()`
- **Business Rule**: Validates platform OAuth tokens; writes schedule records.
- **Storage**: Updates `PUBLISHING` sheet tab.

### Trace 3: `POST /api/recovery/restore` (Disaster Recovery Restore)
- **Route**: `POST /api/recovery/restore`
- **Controller**: `routes.ts:1510`
- **Authentication**: Bearer JWT session token
- **Authorization**: Super Admin role (`requireRole('SUPER_ADMIN')`)
- **Validation**: Checks snapshot ID format and force boolean. (Bypasses UI text confirmation!)
- **Service**: `FullSnapshotRestoreExecutionService` -> `executeRestore()`
- **Storage**: Clears and writes to all 18 Google Sheets tabs.
- **Critical Risk**: If interrupted mid-execution, leaves partial spreadsheet tabs wiped.
