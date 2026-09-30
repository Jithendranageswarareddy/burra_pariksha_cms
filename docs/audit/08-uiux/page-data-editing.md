# Page Data Editing Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 08 of 30  
**Document:** 07 of 30  

---

## 1. Data Editing Architecture

This document audits all user-editable fields across the application, identifying inputs, data types, validation constraints, persistence mechanisms, and cancel/reset behavior.

---

## 2. Editable Field Inventory by Page & Workspace

| Page / Workspace | Editable Field | Input Component | Validation Rule | Persistence Trigger | Target API / Store |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `QuestionStudioPage` | Question Text (English) | `<textarea>` | Required, min 10 chars | "Save Draft" / "Continue" | `POST /api/questions` |
| `QuestionStudioPage` | Question Text (Telugu) | `<textarea>` | Required, Telugu Unicode | "Save Draft" / "Continue" | `POST /api/questions` |
| `QuestionStudioPage` | Option A, B, C, D (EN/TE)| 4x `<input type="text">`| Required, non-empty | Form submission | `POST /api/questions` |
| `QuestionStudioPage` | Correct Option Selector | Radio Button Group | Exactly one of A, B, C, D | Form submission | `POST /api/questions` |
| `QuestionStudioPage` | Academic Proof & Steps | `<textarea>` | Required, min 20 chars | Form submission | `POST /api/questions` |
| `QuestionImprovePage` | Refined Question Text | `<textarea>` | Non-empty | "Save Changes" | `PUT /api/questions/:id` |
| `QuestionVerifyApprovePage`| Verification Checklist | 5x Checkboxes | All 5 must be checked | "Approve & Start Video" | `POST /api/questions/:id/verify` |
| `QuestionVerifyApprovePage`| Rejection Reason | `<textarea>` | Required on reject | "Reject Question" | `POST /api/questions/:id/reject` |
| `ScriptWorkspace` | Telugu Spoken Script | Monospace `<textarea>` | Required, spoken pacing | "Approve Script" | `POST /api/scripts/:id` |
| `RecordingWorkspace` | Google Drive Raw Video URL| `<input type="url">` | Valid drive.google.com URI | "Save Take" | `POST /api/videos/:id/record` |
| `RecordingWorkspace` | Take Notes & Best Take | Radio + `<input>` | Selection required | "Advance to Edit" | `POST /api/videos/:id/record` |
| `EditingWorkspace` | Rough Cut Drive URL | `<input type="url">` | Valid drive.google.com URI | "Submit for QC" | `POST /api/videos/:id/edit` |
| `EditingWorkspace` | Edit Checklist Toggles | 4x Switches | Optional | In-place state | `POST /api/videos/:id/edit` |
| `FinalReviewWorkspace`| 12-Point QC Checklist | 12x Checkboxes | All 12 required to pass | "Approve Video" | `POST /api/videos/:id/qc` |
| `ThumbnailWorkspace` | Thumbnail Image URL | `<input type="url">` | Valid image URL | "Approve Thumbnail" | `POST /api/videos/:id/thumbnail` |
| `ThumbnailWorkspace` | Text Hook Overlay | `<input type="text">` | Max 45 characters | Form state | `POST /api/videos/:id/thumbnail` |
| `PublishingWorkspace` | Scheduled Datetime | `<input type="datetime-local">`| Must be in future | "Schedule Broadcast" | `POST /api/publishing/schedule` |
| `PublishingWorkspace` | Target Platforms Checkbox| 4x Checkboxes | At least 1 selected | "Schedule Broadcast" | `POST /api/publishing/schedule` |
| `TeamOperationsPage` | User Task Reassignment | Modal `<select>` | Valid team member ID | "Confirm Reassignment" | `POST /api/team/reassign` |
| `SettingsPage` | Taxonomy Subject / Topic | Form inputs | Non-empty alphanumeric | "Save Taxonomy" | `POST /api/taxonomy` |
