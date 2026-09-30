# Error Recovery Matrix (Exhaustive Cross-Surface Failure Mapping)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 10 of 30  
**Document:** 22 of 30  

---

## 1. Master Error Recovery Matrix

| Error Scenario | Source Component | Failed Operation | User Data Preserved? | Retry Available? | Retry Safe? | Rollback Implemented? | Navigation Action | Prescribed User Recovery Action | Risk Level |
| :--- | :--- | :--- | :---: | :---: | :---: | :---: | :--- | :--- | :---: |
| **ERR-01** | `QuestionStudioPage.tsx` | Save Question | YES | YES | NO (Dup risk) | NO | Stays on step 4 | Check fields; click Retry Save once | **CRITICAL** |
| **ERR-02** | `ScriptWorkspace.tsx` | Save Spoken Script | YES | YES | YES | YES | Stays on script tab | Re-verify word count; click Save Script | **LOW** |
| **ERR-03** | `RecordingWorkspace.tsx` | Submit Video Take | YES | YES | NO (Dup take) | NO | Stays on record tab | Verify Drive sharing permissions; retry | **HIGH** |
| **ERR-04** | `EditingWorkspace.tsx` | Submit Cut | YES | YES | YES | NO | Stays on edit tab | Re-paste valid Google Drive cut link | **MEDIUM** |
| **ERR-05** | `FinalReviewWorkspace.tsx`| QC Signoff | YES | YES | YES | NO | Stays on review tab | Verify all 12 items checked; re-click signoff | **LOW** |
| **ERR-06** | `PublishingWorkspace.tsx` | Schedule Platforms | NO (Resets) | YES | NO (Dup post) | NO | Stays on publish tab | Re-check platform toggles; re-enter schedule | **CRITICAL** |
| **ERR-07** | `AssignmentModal.tsx` | Create Assignment | YES | YES | NO (Dup assign)| NO | Modal remains open | Verify member availability; click Assign | **MEDIUM** |
| **ERR-08** | `PlanningPage.tsx` | Batch Plan Creation | NO (Lost) | NO | NO | NO | Page stuck loading | Refresh entire browser page; re-type plan | **HIGH** |
| **ERR-09** | `SettingsPage.tsx` | Save Sheet Config | NO (Reverts) | YES | YES | YES | Stays on settings | Re-enter Spreadsheet ID carefully | **MEDIUM** |
| **ERR-10** | `RecoveryAdminPage.tsx` | Restore Snapshot | PARTIAL | NO | NO | NO | Stays on recovery | DO NOT RETRY; inspect sheets manually! | **CRITICAL** |
