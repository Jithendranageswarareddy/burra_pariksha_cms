# Wrong Data Mutation Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 09 of 30  
**Document:** 23 of 30  

---

## 1. Wrong Data Mutation Criteria

An action is classified as **WRONG_DATA_MUTATION (ACT-012)** if it updates the wrong entity, mutates un-aliased draft IDs, or writes to inappropriate worksheet columns.

---

## 2. Wrong Data Mutation Register

| Action Trigger | Component | Mutated Identifier | Expected Target Identifier | Defect Description | Classification |
| :--- | :--- | :--- | :--- | :--- | :---: |
| "Refine Question" | `QuestionImprovePage.tsx:142` | `draft.id` (`BP-DFT-*`) | Canonical `BP-Q-*` | Updates in-memory draft store without synchronizing to canonical Questions sheet if already approved! | **ACT-012 (Data Divergence)** |
| "Reassign Task" | `TeamOperationsPage.tsx:165` | `task.assignmentId` | `assignment_id` | Omits updating secondary assignee cache in `usersRepository`, causing stale user workload view | **ACT-012 (Partial Write)** |
