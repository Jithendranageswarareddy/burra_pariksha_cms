# Terminal State Hazards & Dead-End Analysis

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 13 of 30  
**Document:** 20 of 30  

---

## 1. Terminal States Registry

A terminal state is a state with zero legal outbound transitions. Static analysis discovered **5 permanent terminal states**:

1. `VideoProductionStatus.UPLOADED`
2. `VideoProductionStatus.CANCELLED`
3. `AssignmentStatus.COMPLETED`
4. `AssignmentStatus.CANCELLED`
5. `CanonicalWorkflowState.ARCHIVED` (Model B)

---

## 2. Operational Hazards

### Hazard 1: Accidental Cancellation is Irreversible
If a Lead accidentally clicks "Cancel Video" on an active production video, `VideoProductionStatus` becomes `CANCELLED`.
- Under `VALID_VIDEO_TRANSITIONS`, `allowed` for `CANCELLED` is `[]` (empty array).
- There is **no `restoreVideo()` API or method** anywhere in the codebase.
- The video is permanently frozen in `CANCELLED` status. Even an Admin cannot restore it through the UI or API. The only remediation is manually opening Google Sheets and typing a previous status.

### Hazard 2: Completed Assignment Cannot Be Reopened
If a QC checklist is signed off prematurely and the Assignment marked `COMPLETED`, it cannot be reopened if post-QC flaws are discovered during publishing review. A brand-new assignment must be created from scratch.
