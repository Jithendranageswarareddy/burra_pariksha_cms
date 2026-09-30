# Concurrency & Overwrite Risk Forensic Audit (7 Risk Scenarios)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 10 of 30  
**Document:** 19 of 30  

---

## 1. Executive Summary

Because BP-CMS operates in a multi-user collaborative environment (content planners, scriptwriters, presenters, video editors, and social media managers), concurrent updates to the same entities are frequent.
Static analysis reveals that **none of the Google Sheets tables utilize optimistic locking (e.g. `version` or `updated_at` check)**. Updates operate on a strict **Last-Write-Wins (LWW)** basis.

---

## 2. Concurrency Risk Scenario Register

| Risk ID | Entity / Surface | Concurrent Operations | Consequence / Data Loss | Concurrency Classification | Evidence |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **CONC-01** | `ScriptWorkspace.tsx` | Two scriptwriters editing script for Video V-101 simultaneously | Writer B saves 10 seconds after Writer A; Writer A'''s entire script changes are overwritten silently! | Last-Write-Wins (Data Overwrite) | No `version` check in `saveScript` |
| **CONC-02** | `QuestionImprovePage.tsx` | SME editing question while QA reviewer marks it verified | SME saves draft; overrides QA reviewer'''s verified status back to DRAFT or stale review notes | Last-Write-Wins (Workflow Regression)| `question.service.ts` full row replace |
| **CONC-03** | `AssignmentModal.tsx` | Two managers assigning different team members to same video | Second manager'''s assignment overwrites first; first assignee never notified of cancellation | Blind Overwrite | `assignment.service.ts` |
| **CONC-04** | `PublishingWorkspace.tsx` | Lead schedules video while social manager updates tags | Tag update payload does not include scheduled time; resets video to DRAFT | Payload Omits Concurrent Fields | `publishing.service.ts:312` |
| **CONC-05** | `SettingsPage.tsx` | Admin A modifies taxonomy while Admin B modifies sheet IDs | Form submits entire config object; Admin B overwrites Admin A'''s taxonomy changes | Monolithic Config Overwrite | `SettingsPage.tsx:410` |
| **CONC-06** | `PlanningPage.tsx` | Automated batch creation during manual topic addition | Google Sheets row insertion collision; two rows written with identical row indices | Sheet Appending Race Condition | `google-sheets.service.ts` |
| **CONC-07** | `RecoveryAdminPage.tsx` | Restore executed while background sync is active | System writes snapshot while sync attempts cell write; sheet corruption | Unlocked Disaster Recovery | `durable-snapshot-archive.ts` |
