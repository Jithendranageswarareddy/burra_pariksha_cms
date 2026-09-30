# Retry Behavior Forensic Audit (11 Retry Mechanisms & 6 Unsafe Risks)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 10 of 30  
**Document:** 14 of 30  

---

## 1. Executive Summary

A comprehensive scan identified **11 explicit retry mechanisms** in BP-CMS:
- **Automatic Exponential Backoff**: Implemented in `src/lib/services/google-sheets.service.ts` for Google Sheets 429 rate-limiting.
- **Interactive "Try Again" Buttons**: Present in `QuestionStudioPage`, `ScriptWorkspace`, `ProductionTrackerPage`, and `SettingsPage`.
- **Manual Form Re-submission**: Retrying submission by clicking the primary action button following an error toast/banner.

---

## 2. Unsafe Retry Risk Register

Retrying mutations without idempotency keys creates severe data corruption risks. The following **6 unsafe retry risks** were confirmed:

| Risk ID | Operation / Form | Retry Trigger | Idempotency Key? | Consequence of Unsafe Retry | Risk Level |
| :--- | :--- | :--- | :---: | :--- | :---: |
| **RTY-01** | `QuestionStudioPage.tsx` Save Question | User clicks "Retry Save" on timeout | NO | Duplicates question record in `QUESTIONS` sheet with new sequence ID! | **CRITICAL** |
| **RTY-02** | `VideoRecordPage.tsx` Record Take | Presenter resubmits take on network lag | NO | Creates duplicate take records with incremented `takeNumber` for identical Drive file | **HIGH** |
| **RTY-03** | `PlanningPage.tsx` Batch Generation | Planner clicks "Generate Batch" twice | NO | Spawns two distinct batches with overlapping topic scopes | **HIGH** |
| **RTY-04** | `PublishingWorkspace.tsx` Platform Post | User retries failed platform dispatch | NO | Can double-post content to YouTube or Instagram if initial API call succeeded on platform but timed out in CMS | **CRITICAL** |
| **RTY-05** | `AssignmentModal.tsx` Assign Task | Lead retries assignment creation | NO | Creates duplicate assignment rows assigned to same user for same entity | **MEDIUM** |
| **RTY-06** | `RecoveryAdminPage.tsx` Preflight Snapshot | Admin triggers snapshot creation retry | NO | Creates duplicate snapshot archives consuming excessive storage | **LOW** |
