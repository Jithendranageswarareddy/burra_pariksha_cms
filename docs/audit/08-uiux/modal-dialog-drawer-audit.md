# Modal, Dialog & Drawer Forensic Audit (18 Contextual Overlays)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 08 of 30  
**Document:** 13 of 30  

---

## 1. Overlay Subsystem Architecture

All 18 modal, dialog, and drawer components in BP-CMS operate as **in-memory React state overlays**. None are currently synchronized with browser URL parameters (e.g. `?modal=reassign`), causing browser back button presses to unload the entire page.

---

## 2. Complete Overlay Inventory & Mechanics

| Host Page / Component | Overlay Name | Component Architecture | Trigger Mechanism | Dismissal Mechanics | State Side-Effects |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `Layout.tsx` / `Sidebar` | Mobile Nav Drawer | Fixed full-height slide-over | Top header hamburger button | Click backdrop, `Escape` key, nav item click | Closes mobile navigation |
| `Header.tsx` | Global Search Drawer | Centered floating modal | `/` or `Ctrl+K` shortcut, click search | Click outside, `Escape`, item select | Navigates to target entity |
| `Header.tsx` | Notifications Dropdown | Top-right anchor popover | Bell icon click | Click outside, item click | Marks item as read |
| `Header.tsx` | User Profile Menu | Top-right anchor popover | User avatar click | Click outside, action click | Switches active demo role |
| `QuestionStudioPage` | AI Candidates Drawer | Right slide-over panel | "Generate AI Batch" button | "Use Candidate" button, close icon | Populates form fields |
| `QuestionStudioPage` | Unsaved Changes Dialog| Center modal dialog | Attempting step leave with dirty state | "Discard & Leave", "Keep Editing" | Resets or preserves form |
| `QuestionVerifyApprovePage`| Rejection Reason Modal| Center modal dialog | "Reject Question" button | "Confirm Rejection", "Cancel" | Logs rejection note to sheet |
| `ProductionJourneyBar` | Prerequisite Blocked Popover| Floating tooltip card | Clicking locked stage pill | Click outside, clicking unlocked stage| None (Informational only) |
| `RecordingWorkspace` | Take Notes Modal | Center modal dialog | "Add Take Notes" button | "Save Notes", "Cancel" | Appends note to take log |
| `FinalReviewWorkspace`| QC Failure Reason Dialog| Center modal dialog | Toggling QC item to FAIL | "Log Defect", "Cancel" | Binds defect to editor task |
| `PublishingPage` | Schedule Release Modal | Center modal dialog | "Schedule Broadcast" button | "Confirm Schedule", "Cancel" | Sets scheduled datetime |
| `PublishingPage` | Post Inspector Drawer | Right slide-over panel | Clicking publication row | "Close Drawer", click backdrop | None (Read-only review) |
| `SocialReviewPage` | Telugu Verification Modal| Center modal dialog | "Inspect Telugu Transcription" | "Close", "Approve Script" | None (Visual comparison) |
| `TeamOperationsPage` | Reassign Task Modal | Center modal dialog | "Reassign Task" button | "Confirm Reassign", "Cancel" | Mutates task assignee ID |
| `SettingsPage` | Edit Taxonomy Modal | Center modal dialog | "Edit Topic" table button | "Save Changes", "Cancel" | Mutates taxonomy tree |
| `RecoveryAdminPage` | Disaster Restore Preflight| Center high-impact modal | "Initiate Restore" button | "Confirm Disaster Restore", "Cancel" | Triggers database rollback |
| `MyWorkPage` | Quick Complete Modal | Center modal dialog | "Mark as Done" task action | "Confirm", "Cancel" | Advances task status |
| `ErrorBoundary.tsx` | Runtime Crash Modal | Full-viewport error card | Unhandled React exception | "Reload Application", "Go Home" | Resets React error state |
