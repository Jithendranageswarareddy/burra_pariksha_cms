# Form Forensic Audit (17 Direct Forms)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 08 of 30  
**Document:** 10 of 30  

---

## 1. Form Implementations Overview

The application features **17 direct form structures** across its pages.
Form paradigms used:
- **Controlled React State**: State hooks (`useState`) binding inputs directly.
- **Zod Schema Validation**: Used in `QuestionStudioPage` and `PublishingWorkspace`.
- **Manual Form Submission**: Form events intercepted via `e.preventDefault()`.

---

## 2. Form Audit Register

| Host Page | Form Purpose | State Model | Validation Schema | Unsaved Changes Warning? | Reset / Clear Handler? |
| :--- | :--- | :--- | :--- | :---: | :---: |
| `LoginPage.tsx` | User authentication credentials | Controlled | Basic string checks | No | No |
| `QuestionStudioPage.tsx`| 4-step question authoring | Controlled | Zod `questionSchema` | Yes (Modal prompt) | Yes ("Reset Draft") |
| `QuestionImprovePage.tsx`| Academic question polish | Controlled | Manual validation | No | Yes ("Revert Changes")|
| `QuestionDetailPage.tsx` | Quick comment/note submission | Controlled | Non-empty check | No | Yes (Clears input) |
| `ScriptWorkspace.tsx` | Spoken teleprompter script | Controlled | Length & duration checks | Yes (Dirty check) | No |
| `RecordingWorkspace.tsx`| Video take recording metadata | Controlled | Drive URI regex | No | Yes ("Reset Take") |
| `EditingWorkspace.tsx` | Edit Bay submission form | Controlled | Drive URI regex | No | No |
| `FinalReviewWorkspace.tsx`| 12-point QC checklist | Controlled | 100% completion check | No | Yes ("Reset Checklist")|
| `ThumbnailWorkspace.tsx`| Thumbnail URL & text overlay | Controlled | URL validation | No | No |
| `PublishingWorkspace.tsx`| Multi-platform scheduler | Controlled | Datetime & platform checks| Yes (Dirty check) | No |
| `TeamOperationsPage.tsx`| Member reassignment form | Controlled | Select validation | No | Yes (On modal close) |
| `SettingsPage.tsx` | Taxonomy subject/topic editor | Controlled | Non-empty checks | No | Yes ("Cancel") |
| `SettingsPage.tsx` | Google Sheets config form | Controlled | Spreadsheet ID format | No | Yes ("Revert") |
| `SocialAnalyticsPage.tsx`| Feedback filter form | Controlled | Date range & sentiment | No | Yes ("Clear Filters") |
| `PlanningPage.tsx` | Batch creation form | Controlled | Batch code & topic checks | No | Yes ("Reset") |
| `PlanningPage.tsx` | Curriculum topic editor | Controlled | Subject & topic checks | No | Yes ("Cancel") |
| `RecoveryAdminPage.tsx` | Preflight confirmation form | Controlled | String confirmation | No | Yes ("Cancel Preflight")|
