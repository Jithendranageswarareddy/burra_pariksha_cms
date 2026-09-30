# Form State Matrix (Finite State Transition Model)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 10 of 30  
**Document:** 26 of 30  

---

## 1. Universal Form Lifecycle State Machine

Each form surface across BP-CMS models a subset of the following canonical states:
```
INITIAL -> EDITING -> VALIDATING -> INVALID (Client) -> SUBMITTING -> SUCCESS -> PRISTINE / NAVIGATED
                                                     \-> ERROR (Server) -> RETRYING
```

---

## 2. Form Finite State Implementation Matrix

| Form Surface | Initial State | Editing State | Client Valid State | Client Invalid State | Submitting State | Server Success State | Server Error State | Reset / Clear State | Unsaved Changes Guard? | State Persistence Mechanism |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :--- |
| **`LoginPage.tsx`** | Empty fields | Controlled input | Green submit button | Red email/pass banner | Button disabled | Redirect to `/dashboard` | Inline error string | Reset on logout | NO | LocalStorage Session |
| **`QuestionStudioPage.tsx`** | Step 1 defaults | Form state object | Step Next enabled | Step Next disabled | "Saving..." text | Green banner; nav to ID | Red banner on Step 4 | "Reset Draft" button | **YES (Modal dialog)** | Local Draft State |
| **`QuestionImprovePage.tsx`** | Existing question data | Dirty field tracking | Save enabled | Error text inline | Spinner on button | Inline badge: "Updated" | Red alert box | "Revert Changes" | NO | None (Lost on nav) |
| **`ScriptWorkspace.tsx`** | Script data loaded | Textarea dirty | "Save Script" active | Word count warning | Button disabled | Toast: "Script saved" | Inline banner | None | **YES (Dirty flag)** | Local State / Versions |
| **`RecordingWorkspace.tsx`** | Previous takes list | Inputting Drive URL | Submit enabled | Alert: "Invalid Drive"| Spinner active | Advance to Editing tab | Red text below input | Clear take input | NO | None |
| **`EditingWorkspace.tsx`** | Cut link input | Inputting Cut link | Submit enabled | Alert: "Invalid Drive"| Spinner active | Advance to Review tab | Red text below input | None | NO | None |
| **`FinalReviewWorkspace.tsx`**| 12 empty checkboxes | Checking boxes | 12/12 checked | < 12 checked (Disabled)| Spinner active | Advance to Publish tab| Red banner | "Reset Checklist" | NO | None |
| **`PublishingWorkspace.tsx`** | Platform channels | Toggling channels | Valid datetime | Past datetime alert | Spinner active | Banner: "Scheduled" | Generic alert (Resets)| None | **YES (Dirty flag)** | None |
| **`AssignmentModal.tsx`** | Clean modal | Member selected | Save enabled | Missing member alert | Spinner on button | Modal unmounts | Red alert in modal | Reset on modal close | NO | None |
| **`PlanningPage.tsx`** | Empty batch form | Typing syllabus | Submit active | Missing field alert | Permanent spinner | Silent append to list | **STUCK SPINNER** | Reset form button | NO | None |
| **`SettingsPage.tsx`** | Current config values | Editing inputs | Save enabled | Syntax regex alert | Spinner on button | Toast: "Settings saved" | Toast: "Save failed" | "Revert to Saved" | NO | LocalStorage / State |
| **`RecoveryAdminPage.tsx`** | Snapshot list loaded| Typing confirm text| Restore enabled | Button disabled | Fullscreen overlay | Banner: "Restored" | Red critical alert | "Cancel Preflight" | NO | Snapshot Filesystem |
