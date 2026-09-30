# Modal, Drawer & Overlay Navigation Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 07 of 30  
**Document:** 13 of 27  

---

## 1. Overlay Navigation Architecture

Modals and overlays interrupt standard page flow to capture focused user input, display confirmation gates, or present contextual details without navigating away from the underlying route.

The audit examined whether modals are **state-driven** (React state) or **route-driven** (URL query param or route matching).

---

## 2. Modal & Drawer Inventory

| Modal / Overlay Component | Host Page / Component | Drive Mechanism | Trigger Mechanism | Dismissal / Exit Flow |
| :--- | :--- | :--- | :--- | :--- |
| **Mobile Navigation Drawer** | `Sidebar.tsx` / `Layout.tsx` | State (`isOpenMobile`) | Hamburger button in `Header.tsx` | Click backdrop, `Escape` key, or click nav item |
| **User Profile Dropdown** | `UserProfileMenu.tsx` | State (`isOpen`) | Avatar button click | Click outside, click action, or `Escape` |
| **Notifications Dropdown**| `NotificationsMenu.tsx` | State (`isOpen`) | Bell icon click | Click outside, click notification, or `Escape`|
| **Global Search Overlay** | `GlobalSearchBar.tsx` | State (`isOpen`) | Input focus, typing, or `Ctrl+K` | Click result (navigates), click outside, or `Escape`|
| **Stage Prerequisite Tooltip**| `ProductionJourneyBar.tsx`| State (`activeTooltipStage`)| Click blocked stage pill | Click outside or click another stage |
| **Schedule Release Modal** | `PublishingPage.tsx` | State (`isScheduleModalOpen`)| "Schedule Broadcast" button | Cancel button, backdrop click, or submit form |
| **Restore Preflight Dialog**| `RecoveryAdminPage.tsx` | State (`showConfirmModal`) | "Initiate Restore" button | "Cancel Preflight" or confirm disaster recovery |
| **AI Question Candidate Drawer**| `QuestionStudioPage.tsx` | State (`showCandidates`) | "Generate AI Batch" button | Select candidate into form or close drawer |
| **Telugu Script Review Modal**| `SocialReviewPage.tsx` | State (`showTeluguModal`)| "Inspect Telugu Transcription" | Close button or signoff approval |

---

## 3. Forensic Evaluation & Risks

1. **State vs Route Driving**: All 9 modals in the application are currently **state-driven**.
2. **Back-Button Trap**: Because modals are state-driven and not synchronized to the URL (e.g. `?modal=schedule`), pressing the browser back button unloads the entire page rather than simply dismissing the modal dialog.
3. **Deep Linking Inability**: Users cannot share direct URLs to specific modal views (e.g. direct link to schedule confirmation).
4. **Remediation**: Transition high-stakes overlays (such as publishing scheduling and disaster recovery confirmations) to URL search parameters.
