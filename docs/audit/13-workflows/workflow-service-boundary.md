# Workflow Service Boundaries & Coordination

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 13 of 30  
**Document:** 24 of 30  

---

## 1. Division of Responsibilities across Workflow Services

Three services share responsibility for workflow coordination:

1. **`WorkflowOrchestrationService` (`src/lib/services/workflow-orchestration.service.ts`):**
   - High-level cross-domain coordinator.
   - Enforces hard safety gates between Questions, Videos, Reviews, and Publishing.
   - Implements `transitionToCanonicalState()`.

2. **`WorkflowService` (`src/lib/services/audit.service.ts:100–165`):**
   - Pure persistence logger.
   - Writes state transition rows to the `WORKFLOW` Google Sheets tab.
   - Exposes `recordTransition()` and `getHistory()`.

3. **`Domain Services` (`video.service.ts`, `question.service.ts`, etc.):**
   - Low-level state machine maintainers.
   - Enforce domain-specific transition tables (`VALID_VIDEO_TRANSITIONS`).
   - Execute localized validation.

---

## 2. Boundary Leakage & God Service Anti-Pattern

Instead of all status mutations flowing through `WorkflowOrchestrationService`, domain services and routes frequently bypass it to update sheets directly. `PublishingService` has grown into a 2,168-line god service that performs its own workflow checks, video status updates, master status updates, and YouTube API calls, bypassing the orchestrator.
