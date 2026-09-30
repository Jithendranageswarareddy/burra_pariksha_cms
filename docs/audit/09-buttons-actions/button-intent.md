# Button Intent Forensic Audit (Apparent vs Actual Intent)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 09 of 30  
**Document:** 04 of 30  

---

## 1. Intent Divergence Overview

A button's visible label creates user expectation (**Apparent Intent**). In several instances, the underlying implementation executes compound side effects (**Actual Intent**) that are invisible to the user.

---

## 2. Intent Discrepancy Register

| Button UI Label | Location | Apparent Intent | Actual Intent & Hidden Side-Effects | Divergence Classification |
| :--- | :--- | :--- | :--- | :--- |
| **"Approve Question & Launch Production"** | `QuestionVerifyApprovePage.tsx:388` | Approves question text and marks verified | 1) Sets Question status to `VERIFIED`<br>2) Allocates Video sequence ID<br>3) Creates initial Video record in `Videos` sheet in `SCRIPT_READY`<br>4) Creates draft ContentMaster entity<br>5) Navigates to `/videos/:id?tab=script` | **COMPOUND SIDE-EFFECT (ACT-028)** |
| **"Approve Script & Advance to Filming"** | `ScriptWorkspace.tsx:293` | Signs off script wording | 1) Locks script version in `ScriptVersions` sheet<br>2) Formats teleprompter cues<br>3) Updates Video status to `RECORDING`<br>4) Places video in Presenter queue | **COMPOUND SIDE-EFFECT (ACT-028)** |
| **"Save Changes"** | `SettingsPage.tsx:210` | Updates local form settings | 1) Directly overwrites taxonomy subjects in Google Sheets<br>2) Rebuilds in-memory taxonomy tree<br>3) Invalidates all client caches | **DIRECT MUTATION (ACT-012)** |
| **"Initiate Restore"** | `RecoveryAdminPage.tsx:204` | Starts preflight inspection | 1) Directly wipes target database tables if confirmed<br>2) Replaces database state with GCS backup archive | **DESTRUCTIVE ACTION (ACT-012)** |
| **"Cancel"** | `QuestionStudioPage.tsx:810` | Closes authoring modal | Unconditionally navigates to `/questions` discarding unsaved form edits without dirty confirmation if step < 2 | **SILENT DISCARD (ACT-002)** |
