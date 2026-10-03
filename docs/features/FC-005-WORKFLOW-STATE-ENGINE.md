# FEATURE CONTRACT: FC-005-WORKFLOW-STATE-ENGINE

## 1. Feature Identity
- **Feature ID**: FC-005
- **Feature Name**: Canonical 15-Step Workflow State Machine
- **Business Area**: Core Content / Workflow State Engine
- **Contract Version**: 1.0.0
- **Status**: APPROVED
- **Priority**: P0 (Blocker)
- **Owner / Domain**: Workflow Architecture Context
- **Related Workflow Stage(s)**: Governs Steps 01 through 15

---

## 2. Requirement
- **Business Requirement**: BR-001 through BR-008 & NFR-003 (Deterministic Concurrency & State Machine).
- **User Problem**: Content manufacturing across 15 stages without a formalized state machine results in out-of-order execution (e.g. filming before question approval), split-brain states, and corrupted workflows.
- **Business Purpose**: Provide an authoritative, backend-enforced state machine governing the canonical 15-step sequence, managing the decoupled 5-dimensional state model, and enforcing strict transition guards.
- **Expected Capability**:
  - Deterministic state machine interface `IWorkflowEngine`.
  - Management of the 5 decoupled state dimensions:
    1. `workflowStep` (1..15)
    2. `contentStatus` (`DRAFT`, `IN_REVIEW`, `APPROVED`, `REJECTED`, `ARCHIVED`)
    3. `mediaStatus` (`NOT_REQUIRED`, `PENDING_UPLOAD`, `PROCESSING`, `READY`, `FAILED`)
    4. `publicationStatus` (`UNPUBLISHED`, `SCHEDULED`, `LIVE`, `SYNCED`, `ERROR`)
    5. `jobStatus` (`IDLE`, `QUEUED`, `PROCESSING`, `COMPLETED`, `FAILED`)
  - Atomic transition execution: `transition(item, targetStep, action, actorContext)`.
  - Rejection of invalid, backward, or unauthorized state transitions.
- **Scope**: Transition graph validation, transition guards, state history persistence, optimistic concurrency validation.
- **Explicit Non-Scope**: Domain-specific content forms (handled in FC-006, FC-008, etc.).

---

## 3. Business Acceptance
- **Happy-Path Acceptance**:
  - Item progresses sequentially from Step 01 $\to$ 02 $\to$ 03 $\dots \to$ 15 upon authorized actions.
  - State transitions increment item version and append a record to `workflow_history`.
- **Validation Acceptance**:
  - Attempting an invalid jump (e.g. Step 01 $\to$ Step 05 directly) returns HTTP 422 `INVALID_WORKFLOW_TRANSITION`.
- **Authorization Acceptance**:
  - Transitions without required capability return HTTP 403 `INSUFFICIENT_PERMISSIONS`.
- **GAR-02 Anti-Self-Approval Acceptance**:
  - Rejection with HTTP 403 when transition actor is the author for verification steps (Steps 02, 07, 09).
- **Concurrency Acceptance**:
  - Concurrent transition attempts on the same item return HTTP 409 `CONCURRENCY_CONFLICT`.
- **Performance Acceptance**:
  - Transition guard calculation and state validation completes in $< 5\text{ms}$.
- **Audit Acceptance**:
  - `WORKFLOW_TRANSITION_SUCCESS` and `WORKFLOW_TRANSITION_REJECTED` dispatched for every attempt.

---

## 4. Domain Entities
- **Entities Involved**: `WorkflowInstance`, `WorkflowTransition`, `WorkflowHistoryEntry`.
- **Entity Ownership**: Core Workflow Engine Domain.
- **Relationships**: Each content item (`Question`, `Script`, `Video`, `PublishingPackage`) is linked to a `WorkflowInstance`.
- **Versions**: Engine v1.0.
- **Immutable Fields**: `workflowId`, `createdAt`, `fromStep`, `transitionAction`, `transitionTimestamp`.
- **Mutable Fields**: `currentStep`, `currentStatus`, `updatedAt`, `version`.
- **Lifecycle**: `Active` $\to$ `Completed` | `Terminated`.

---

## 5. Database / Data Contract
- **Collections Involved**: `workflow_instances`, `workflow_history`.
- **Document Structure**:
  ```typescript
  export interface WorkflowInstanceDocument extends BaseEntity {
    id: string; // wfl_ + UUIDv4
    entityType: 'QUESTION' | 'SCRIPT' | 'VIDEO' | 'PACKAGE';
    entityId: string;
    currentStep: number; // 1 to 15
    contentStatus: ContentStatus;
    mediaStatus: MediaStatus;
    publicationStatus: PublicationStatus;
    jobStatus: JobStatus;
    lastTransitionAt: string;
    lastTransitionBy: string;
  }
  ```
- **Optimistic Concurrency**: Firestore transaction enforcing `version == expectedVersion`.
- **Source of Truth**: Firestore `workflow_instances` collection.

---

## 6. API Contract
### 6.1 `POST /api/v1/workflow/:id/transition`
- **Authentication**: Required.
- **Required Capability**: Dependent on target step (e.g., `QUESTION_VERIFY` for Step 02).
- **Request Schema**:
  ```typescript
  {
    targetStep: z.number().int().min(1).max(15),
    action: z.string(),
    reason?: z.string(),
    expectedVersion: z.number().int().positive()
  }
  ```
- **Response Schema**: `ApiResponseEnvelope<{ workflow: WorkflowInstanceDocument }>`
- **Error Codes**: `400 INVALID_INPUT`, `403 FORBIDDEN`, `409 CONCURRENCY_CONFLICT`, `422 INVALID_WORKFLOW_TRANSITION`.
- **Audit Event**: `WORKFLOW_STEP_TRANSITIONED`.

### 6.2 `GET /api/v1/workflow/:id/history`
- **Authentication**: Required.
- **Response Schema**: `ApiResponseEnvelope<{ history: WorkflowHistoryEntry[] }>`.

---

## 7. Frontend Contract
- **Canonical Route**: Integrated across all Studio Hubs via `<WorkflowBreadcrumb>` and `<WorkflowStatusBar>`.
- **Allowed Roles / Capabilities**: Dynamic per step.
- **UX Behavior**:
  - Displays canonical 15-step progress bar with active step highlighted.
  - Action buttons (e.g. *"Submit for Review"*, *"Approve"*, *"Reject"*) dynamically enabled based on valid next transitions.
  - Blocked transitions show disabled button with tooltip explaining missing prerequisite.

---

## 8. RBAC / Capability Contract
- **Step-to-Capability Mapping**:
  - Step 01 $\to$ 02: `QUESTION_SUBMIT`
  - Step 02 $\to$ 03: `QUESTION_VERIFY` (Enforces GAR-02)
  - Step 03 $\to$ 04: `SCRIPT_SUBMIT`
  - Step 04 $\to$ 05: `FILMING_COMPLETE`
  - Step 05 $\to$ 06: `VIDEO_INGEST`
  - Step 06 $\to$ 07: `VIDEO_EDIT_COMPLETE`
  - Step 07 $\to$ 08: `VIDEO_QC_VERIFY` (Enforces GAR-02)
  - Step 08 $\to$ 09: `THUMBNAIL_APPROVE`
  - Step 09 $\to$ 10: `SOCIAL_REVIEW_APPROVE` (Enforces GAR-02)
  - Step 10 $\to$ 11: `PUBLISH_SCHEDULE`
  - Step 11 $\to$ 12: `PUBLISH_EXECUTE`
  - Step 12 $\to$ 13: `PLATFORM_SYNC`
  - Step 13 $\to$ 14: `ANALYTICS_INGEST`
  - Step 14 $\to$ 15: `PERFORMANCE_INDEX`
  - Step 15 $\to$ 01: `INTELLIGENCE_LOOP_FEED`

---

## 9. Workflow Contract
- **Canonical Transition Graph**:
  - Forward transitions must be $+1$ sequential step (or skip non-applicable step if explicitly allowed).
  - Rejection transitions return item to designated revision step (e.g., Step 02 rejection returns to Step 01 with `Q_REJECTED` status).

---

## 10. Validation Contract
- **Guard Validation**: Target step must be present in `VALID_NEXT_STEPS[currentStep]`.
- **Precondition Checks**: Associated content must meet completeness criteria (e.g. cannot transition to Step 02 if question options $< 4$).

---

## 11. Error Contract
- `403 FORBIDDEN`: Attempting transition without role capability or violating GAR-02.
- `409 CONFLICT`: Concurrency version mismatch.
- `422 UNPROCESSABLE_ENTITY`: Transition illegal according to state machine table.

---

## 12. Audit Contract
- **Event Name**: `WORKFLOW_TRANSITION`.
- **Payload**: `workflowId`, `entityId`, `fromStep`, `toStep`, `action`, `actorId`, `timestamp`, `version`.

---

## 13. Realtime Contract
- **SSE Broadcast**: Emits `workflow.step_transitioned` with `{ entityId, fromStep, toStep, actorId }` to update studio hub workspaces in real time.

---

## 14. Job / Async Contract
- **Async Execution**: State transitions are strictly synchronous. Asynchronous jobs (e.g. video rendering) update the orthogonal `jobStatus` dimension without blocking the workflow engine.

---

## 15. AI Contract
- **Applicable**: No. AI cannot execute transitions.

---

## 16. Media Contract
- **Applicable**: Media uploads update `mediaStatus` to `READY` before permitting transition into Editing Bay (Step 06).

---

## 17. Analytics Contract
- **Applicable**: Step 13–15 transitions update `publicationStatus` and `contentStatus`.

---

## 18. Security Contract
- **Backend Authority**: Backend validates all state machine guards. Client-side state representations are treated as untrusted hints.

---

## 19. Observability Contract
- **Metrics**: `workflow.transitions_total` partitioned by step and status. `workflow.transition_duration_seconds`.

---

## 20. Cost Contract
- **Cost**: ₹0.00. 1 Firestore write per transition, remaining well within free tier limits.

---

## 21. Migration Contract
- **Legacy State Mapping**: Existing Google Sheets status strings (`"Draft"`, `"Approved"`, `"Shot"`) mapped into canonical 15-step numbers during data import.

---

## 22. Test Contract
- **Unit Tests**:
  - `TC-WF-01`: Deterministic state machine allows Step $N \to N+1$.
  - `TC-WF-02`: State machine blocks illegal jump (e.g. Step 1 $\to$ 5).
  - `TC-WF-03`: Rejection transitions return item to correct authoring stage.
  - `TC-WF-04`: 5 decoupled state dimensions update independently without cross-corruption.
- **Integration Tests**:
  - `TC-WF-05`: `POST /api/v1/workflow/:id/transition` persists transition to Firestore.

---

## 23. Dependencies
- **Prerequisite Features**: FC-001 (Auth), FC-002 (RBAC & GAR-02), FC-003 (Database & API envelope), FC-004 (Audit).
- **Stage 25 Node**: `D-14 (Workflow Engine)`, `D-15 (Workflow Transitions)`.
- **Downstream Consumers**: FC-006 through FC-022.

---

## 24. Implementation Sequence
1. Define 15-step enums and 5-dimensional state types (`src/types/workflow.ts`).
2. Implement transition table and guards (`src/lib/workflow/state-machine.ts`).
3. Implement `WorkflowService` with OCC transaction handling.
4. Implement `/api/v1/workflow/*` endpoints.
5. Create React workflow components (`<WorkflowBreadcrumb>`, `<WorkflowActionPanel>`).
6. Verify against `TC-WF-01..05`.

---

## 25. Deployment Contract
- **Dependencies**: Code-only deployment. `workflow_instances` collection auto-created in Firestore.

---

## 26. Rollback Contract
- **Strategy**: Revert Cloud Run revision. Existing instance documents remain compatible.

---

## 27. Feature Completion Criteria
- [ ] 15 sequential steps verified against transition table.
- [ ] 5-dimensional state model operates orthogonally.
- [ ] OCC version conflict verified under parallel execution.
- [ ] Realtime SSE event emitted on transition.
- [ ] Zero lint or build errors.

---

## 28. Open Issues / Assumptions
- **None**: Authoritative state model fully established in Stage 07 and Stage 08.

---

## 29. Traceability
- **Stage 01**: BR-001..008
- **Stage 02**: DAC-001..006
- **Stage 07**: Canonical 15-Step Workflow Specification
- **Stage 08**: Decoupled 5-Dimensional State Machine Architecture
- **Stage 09**: Capability Matrix & Transition Guards
- **Stage 13**: `workflow_instances` collection schema
- **Stage 15**: `/api/v1/workflow/*`
- **Stage 24**: 15×9 Workflow Test Matrix
- **Stage 25**: Nodes `D-14`, `D-15`
