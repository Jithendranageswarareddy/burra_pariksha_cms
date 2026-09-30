# Loading & Submission State Forensic Audit (8 State Deficiencies)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 10 of 30  
**Document:** 20 of 30  

---

## 1. Executive Summary

Submission states ensure that users receive immediate feedback, are prevented from double-submitting forms, and that interfaces do not lock permanently when network failures occur.
An audit of 32 form surfaces identified **8 loading and submission state deficiencies**.

---

## 2. Loading State Defect Register

| Defect ID | Host Form / Component | Defect Type | Root Cause in Code | User Impact |
| :--- | :--- | :--- | :--- | :--- |
| **LOAD-01** | `PlanningPage.tsx` (Batch Create) | **STUCK LOADING STATE** | Catch block catches error but `setIsLoading(false)` is missing in one branch | Spinner spins forever; form never becomes interactive again. |
| **LOAD-02** | `QuestionStudioPage.tsx` | **MISSING SUBMIT SPINNER** | Button relies on raw text change ("Saving...") without visual spinner | User cannot tell if app is hung during slow 3-second Google Sheets write. |
| **LOAD-03** | `VideoRecordPage.tsx` (Legacy) | **DOUBLE SUBMIT VULNERABILITY** | Submit button does not disable `onClick` during async promise execution | Double-clicking button creates two identical take entries in `VIDEOS` sheet. |
| **LOAD-04** | `SettingsPage.tsx` | **PARTIAL FORM LOCK** | Input fields remain editable while save button is in loading state | User types while request in flight; typed text is lost upon response refresh. |
| **LOAD-05** | `FinalReviewWorkspace.tsx` | **MISSING LOADING INDICATOR** | Signoff handler executes async service call with no loading state variable | UI appears unresponsive for 1-2 seconds after clicking "Sign Off". |
| **LOAD-06** | `AssignmentModal.tsx` | **DISMISSAL DURING IN-FLIGHT** | Modal close button (`X`) remains active while save promise is executing | User closes modal mid-save; request continues in background without user awareness. |
| **LOAD-07** | `PublishScheduleModal.tsx` | **PREMATURE LOADING RESET** | `setIsSubmitting(false)` called before modal close animation completes | Flashes interactive button for a split second before modal unmounts. |
| **LOAD-08** | `RecoveryAdminPage.tsx` | **GLOBAL UI LOCK WITHOUT PROGRESS**| Preflight restore blocks entire page for 30+ seconds with indeterminate bar | Super admin cannot ascertain progress across individual sheets/tabs. |
