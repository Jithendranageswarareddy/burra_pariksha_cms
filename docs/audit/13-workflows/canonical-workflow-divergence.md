# Dual Canonical Workflow State Model Divergence

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 13 of 30  
**Document:** 07 of 30  

---

## 1. Forensic Discovery: Dual Enums with Identical Identifiers

The codebase declares **two conflicting enums named `CanonicalWorkflowState`** in two separate core files:

### Model A: Stage Presentation Model
- **File:** `src/lib/workflow/canonical-workflow.ts:28–36`
- **Enum Values (7 states):**
  ```typescript
  export enum CanonicalWorkflowState {
    NOT_STARTED = 'NOT_STARTED',
    IN_PROGRESS = 'IN_PROGRESS',
    COMPLETED = 'COMPLETED',
    REVISION_REQUIRED = 'REVISION_REQUIRED',
    REJECTED = 'REJECTED',
    BLOCKED = 'BLOCKED',
    ESCALATED = 'ESCALATED',
  }
  ```
- **Scope & Usage:** Governs the visual status of each of the 15 conveyor steps in UI headers, steppers, and journey bars.

### Model B: Subsystem Orchestration Model
- **File:** `src/lib/services/workflow-orchestration.service.ts:33–45`
- **Enum Values (11 states):**
  ```typescript
  export enum CanonicalWorkflowState {
    DRAFT = 'DRAFT',
    VALIDATED = 'VALIDATED',
    READY_FOR_REVIEW = 'READY_FOR_REVIEW',
    CHANGES_REQUESTED = 'CHANGES_REQUESTED',
    APPROVED = 'APPROVED',
    SCHEDULED = 'SCHEDULED',
    PUBLISHED = 'PUBLISHED',
    ARCHIVED = 'ARCHIVED',
    IN_PRODUCTION = 'IN_PRODUCTION',
    IN_REVIEW = 'IN_REVIEW',
    READY_TO_PUBLISH = 'READY_TO_PUBLISH',
  }
  ```
- **Scope & Usage:** Governs cross-domain orchestration, backend state transitions, and safety gate transitions.

---

## 2. Incompatibility Matrix

| Concept | Model A (`canonical-workflow.ts`) | Model B (`workflow-orchestration.service.ts`) | Divergence Impact |
| :--- | :--- | :--- | :--- |
| **Philosophy** | Milestone Progress (Did this step complete?) | Lifecycle Phase (Where does entity sit globally?) | Conceptual mismatch |
| **Type Overlap** | None! Zero common string literals between models | None! | Incompatible types |
| **API Endpoints** | Used in `GET /questions/:id/canonical-state` | Used in `POST /content-masters/:id/transition` | JSON payloads cannot be shared |
| **Database Persistence** | Never persisted; dynamically derived by mappers | Persisted to `WORKFLOW` sheet as transition log | Asymmetry |

---

## 3. Risk of Accidental Cross-Import

TypeScript compilation passes because neither file imports `CanonicalWorkflowState` from the other. However, if a developer imports `CanonicalWorkflowState` from `src/lib/workflow/canonical-workflow` into an orchestration service, or vice versa, the types collide:

```typescript
// Compile-time failure or runtime comparison defect:
if (entity.state === CanonicalWorkflowState.APPROVED) // Fails if importing Model A!
```

**Architectural Remediation Recommendation:** Rename Model A to `ConveyorStageStatus` and preserve Model B as `CanonicalEntityLifecycleState`.
