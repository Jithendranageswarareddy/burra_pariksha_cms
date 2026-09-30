# State Machine Inventory

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 20 of 30  
**Document:** 15 of 41  

---

## 1. Inventory of Active State Machines

| State Machine | Target Entity | Defined States | Initial State | Terminal States | Transition Authority |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **Video Production Machine** | `Video` | 13 | `NOT_STARTED` | `UPLOADED`, `CANCELLED` | `VideoService.transitionStatus` |
| **Question Lifecycle Machine**| `Question` | 6 | `DRAFT` / `GENERATED` | `ARCHIVED` | `QuestionService.updateStatus` |
| **Canonical Workflow Machine**| Multi-Entity | 7 | `NOT_STARTED` | `COMPLETED`, `REJECTED` | `mapToCanonicalWorkflowState` |
| **Social Publishing Machine** | `Publishing` | 4 | `NOT_STARTED` | `PUBLISHED`, `FAILED` | `PublishingService.markPublished` |
| **Assignment Lifecycle Machine**| `Assignment` | 5 | `ASSIGNED` | `COMPLETED`, `CANCELLED` | `AssignmentService.updateStatus` |
