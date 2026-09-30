# Error Message Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 10 of 30  
**Document:** 11 of 30  

---

## 1. Error Display Taxonomy

BP-CMS utilizes four primary mechanisms to display validation and operational errors to users:
1. **Inline Field Validation Text**: Rendered directly below inputs (e.g. `text-red-500 text-xs`) for immediate field errors.
2. **Form-Level Banner / Alert Box**: Rendered at the top of forms (e.g. `bg-red-50 border-red-200 text-red-800`) upon API submission failure.
3. **Modal Dialog Error Banners**: Displayed inside modal containers when sub-actions fail.
4. **Console-Only Errors**: Errors caught in `catch` blocks that invoke `console.error(err)` but provide zero UI feedback.

---

## 2. Problematic Error Message Classifications

| Error Message Text | Host Component | Trigger | Defect Classification | Impact on User |
| :--- | :--- | :--- | :--- | :--- |
| `"Failed to save question"` | `QuestionStudioPage.tsx` | 400 Bad Request from API | **VAGUE ERROR** | User cannot determine which step or field caused the validation rejection. |
| `"An error occurred. Please try again."` | `ScriptWorkspace.tsx` | Network or 500 error | **GENERIC ERROR** | Gives no technical detail or recovery guidance. |
| `"Error: [GoogleSheets API] 429 RESOURCE_EXHAUSTED: Quota exceeded"` | `SettingsPage.tsx` | Google Sheets API rate limit | **TECHNICAL LEAK** | Exposes raw backend stack trace and internal cloud quota limits to end user. |
| `"Invalid ID specified"` | `VideoDetailPage.tsx` | Entity not found (404) | **MISLEADING ERROR** | Fails to state whether video ID, question ID, or user ID was invalid. |
| `"Operation failed: check logs"` | `PlanningPage.tsx` | Batch creation error | **NO RECOVERY ACTION** | Normal users have zero access to server stdout logs. |
