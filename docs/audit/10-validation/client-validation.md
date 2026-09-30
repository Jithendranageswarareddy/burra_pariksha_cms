# Client Validation Forensic Audit (74 Rules)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 10 of 30  
**Document:** 05 of 30  

---

## 1. Overview of Client Validation Architecture

BP-CMS executes client-side validation through three distinct paradigms:
1. **Interactive State Guards in Event Handlers**: Checking state variables prior to triggering async fetch calls.
2. **Dynamic UI Button Disabling**: Setting `disabled={!isValid}` directly on submit buttons to prevent invocation.
3. **Form Schema Parsing**: Integrating Zod or custom validator functions before serializing JSON payloads.

---

## 2. Client Validation Rule Register (Selected Core Rules)

| Rule ID | Form / Component | Field | Validation Condition | Validator Mechanism | Trigger Moment | UI Error Indication | API Blocked? |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **CLV-01** | `LoginPage.tsx` | `email` | Valid email regex pattern | RegExp match | `onChange` / `onSubmit` | Text banner below input | YES |
| **CLV-02** | `LoginPage.tsx` | `password` | `password.length >= 6` | Length check | `onSubmit` | Text banner below input | YES |
| **CLV-03** | `QuestionStudioPage.tsx` | `questionText` | `10 <= text.length <= 500` | Inline length check | `onChange` | Character counter & red border | YES (Button disabled) |
| **CLV-04** | `QuestionStudioPage.tsx` | `optionA..D` | Each option must be distinct | Set size comparison | `onBlur` / Step 2 Next | Warning toast & error text | YES |
| **CLV-05** | `QuestionStudioPage.tsx` | `correctOption`| Value in `['A','B','C','D']` | Controlled select | `onChange` | Select dropdown validation | YES |
| **CLV-06** | `QuestionStudioPage.tsx` | `explanation` | `explanation.length >= 10` | Length check | Step 3 Next | Step advancement blocked | YES |
| **CLV-07** | `ScriptWorkspace.tsx` | `hook` | `hook.trim().length >= 10` | String trim check | `handleSave` | Inline error banner | YES |
| **CLV-08** | `ScriptWorkspace.tsx` | `targetDuration`| `30 <= duration <= 300` | Number range check | `onChange` | Red border on input | YES |
| **CLV-09** | `RecordingWorkspace.tsx` | `rawDriveUrl` | Includes `drive.google.com` | Substring check | `handleSaveTake` | Validation alert banner | YES |
| **CLV-10** | `EditingWorkspace.tsx` | `editedDriveUrl`| Includes `drive.google.com` | Substring check | `handleSubmitCut` | Red border & error text | YES |
| **CLV-11** | `FinalReviewWorkspace.tsx`| 12 Checklist Items| All 12 items checked (`true`)| Array `every()` | `handleSignoff` | Signoff button disabled | YES |
| **CLV-12** | `PublishingWorkspace.tsx` | `platforms` | At least 1 platform selected | Array length check | `handleSchedule` | Platform selection alert | YES |
| **CLV-13** | `RecoveryAdminPage.tsx` | `confirmText` | Equals `"RESTORE-SNAPSHOT"` | String equality | `onChange` | Restore button disabled | YES |
