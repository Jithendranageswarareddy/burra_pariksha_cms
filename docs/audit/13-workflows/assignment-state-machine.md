# Assignment State Machine Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 13 of 30  
**Document:** 10 of 30  

---

## 1. AssignmentStatus State Model

Defined in `src/types/index.ts:132–138` and implemented in `src/lib/services/assignment.service.ts:94–105`:

```typescript
export enum AssignmentStatus {
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  BLOCKED = 'BLOCKED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}
```

---

## 2. Transition Matrix (`src/lib/services/assignment.service.ts:95–103`)

| State | Allowed Target Transitions | Notes |
| :--- | :--- | :--- |
| `ASSIGNED` | `IN_PROGRESS`, `CANCELLED`, `BLOCKED` | Initial state when lead assigns task to user |
| `IN_PROGRESS` | `BLOCKED`, `COMPLETED`, `CANCELLED` | Active work phase |
| `BLOCKED` | `IN_PROGRESS`, `CANCELLED`, `COMPLETED` | Suspended due to missing upstream asset |
| `COMPLETED` | *None* | **Terminal State** |
| `CANCELLED` | *None* | **Terminal State** |
| `PENDING` (Legacy)| `IN_PROGRESS`, `CANCELLED`, `BLOCKED` | Backwards-compatibility fallback |

---

## 3. Disconnection from Upstream Production Events

A major finding is that **Assignment completion is largely unlinked from actual entity status changes**:
- When a video editor finishes editing and advances the Video to `EDITED`, the corresponding Editing Assignment in `ASSIGNMENTS` sheet is **not automatically marked COMPLETED**.
- The editor must manually find the Assignment in the UI and click "Mark Complete".
- If the editor forgets, the Assignment remains `IN_PROGRESS` indefinitely, skewing team workload metrics on `/team/workload` and reporting false bottlenecks on the dashboard.
