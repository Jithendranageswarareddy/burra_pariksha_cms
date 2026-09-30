# Validation Bypass Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 09 of 30  
**Document:** 24 of 30  

---

## 1. Validation Bypass Criteria

An action is classified as **VALIDATION_BYPASS (ACT-007)** if a workflow transition or mutation can be executed without fulfilling required validation checks.

---

## 2. Validation Bypass Register

| Vulnerable Action | Normal UI Validation Path | Bypass Execution Path | Security / Integrity Impact | Risk Level |
| :--- | :--- | :--- | :--- | :---: |
| Question Approval | 5-point checklist must be 100% checked in UI | Direct `POST /api/questions/:id/verify` with empty body | Backend defaults checklist to true if unsupplied! | **HIGH (ACT-007)** |
| Publishing Scheduling| Enforces future release datetime > 15 mins | Direct `POST /api/publishing/schedule` with past ISO string | Past dates accepted by backend; immediate trigger fired | **MEDIUM (ACT-007)** |
| Rough Cut Submission| Checks for valid Google Drive URL in UI form | Direct `POST /api/videos/:id/submit-edit` with arbitrary string | Unverified URL saved as rough cut video link | **HIGH (ACT-007)** |
| Batch Creation | Verifies syllabus topic mapping in UI wizard | Direct fetch call in `PlanningPage.tsx` with null topicId | Creates orphaned batch unlinked to syllabus | **MEDIUM (ACT-007)** |
