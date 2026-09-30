# Failed Request & User Data Preservation Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 10 of 30  
**Document:** 15 of 30  

---

## 1. User Data Preservation Analysis

When an asynchronous request fails, preserving user-entered data is essential to avoid severe user frustration and loss of intellectual work (e.g. academic questions, spoken teleprompter scripts).

### Audit Verdict across Major Forms:
- **Preserved in Component State**: 78% of forms maintain user-entered data in React state variables upon failure.
- **Accidentally Wiped / Reset**: 22% of forms suffer from state-wiping defects under specific failure triggers:
  1. `QuestionStudioPage.tsx`: If the user navigates back to step 1 after an error on step 4, intermediate wizard form state can reset to defaults if step synchronization fails.
  2. `PublishingWorkspace.tsx`: If publishing scheduling fails with a 400 error, selected platform toggles reset to default single-platform selection (`['youtube']`).
  3. `LoginPage.tsx`: On invalid credentials, password field resets to empty string (intentional security design).

---

## 2. Failure State Behavior Register

| Form Surface | Input Preservation | Loading Spinner Reset | Submit Button Re-enabled | Error Banner Displayed | Recovery Guidance |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `QuestionStudioPage.tsx` | YES | YES | YES | YES | Displays error message; user can edit fields |
| `ScriptWorkspace.tsx` | YES | YES | YES | YES | User can re-edit spoken script and retry |
| `RecordingWorkspace.tsx` | YES | YES | YES | YES | Drive URL preserved |
| `EditingWorkspace.tsx` | YES | YES | YES | YES | Edited Drive URL preserved |
| `FinalReviewWorkspace.tsx`| YES | YES | YES | YES | 12 checkboxes remain checked |
| `SettingsPage.tsx` | NO (Reverts) | YES | YES | YES | Config resets to pre-edit local state! |
| `AssignmentModal.tsx` | YES | YES | YES | YES | Modal remains open with selections |
| `PlanningPage.tsx` | NO (Batch creator)| STUCK | NO | NO (Swallowed) | Page remains stuck in loading; user must reload! |
