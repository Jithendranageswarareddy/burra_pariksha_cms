# Multiple State Machines Analysis

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 20 of 30  
**Document:** 18 of 41  

---

## 1. Cross-Entity State Machine Interaction

The content production lifecycle does not rely on a single unified state machine. Instead, 4 distinct state machines operate in tandem across entities:

1. **Question State Machine:** Governs Question verification and approval (`QuestionStatus`).
2. **Video State Machine:** Governs scripting, filming, editing, and QC (`VideoProductionStatus`).
3. **Publishing State Machine:** Governs platform scheduling and live publication (`SocialPublishStatus`).
4. **Canonical Workflow State Machine:** Computes an aggregated view across the three lower machines (`CanonicalWorkflowState`).

### The Aggregation Discrepancy:
Because `CanonicalWorkflowState` is dynamically computed in frontend code via helper functions (`mapQuestionToWorkflowState`, `mapVideoToWorkflowState`), **it is not persisted in Google Sheets**. The persistent layer stores only individual entity statuses.
