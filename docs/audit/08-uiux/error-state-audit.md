# Error State Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 08 of 30  
**Document:** 18 of 30  

---

## 1. Error Handling Topology

BP-CMS handles runtime errors across four defensive levels:
1. **Global Shell Error Boundary** (`Layout.tsx`): Catches unexpected layout-level crashes.
2. **Page-Level Error Boundary** (`Layout.tsx:79`): Wraps `<Outlet />` ensuring page crashes do not crash the Header or Sidebar.
3. **Component-Level Error Catchers**: Inline error alerts rendering message + retry button.
4. **Toast Notifications**: Floating ephemeral error notifications for failed API mutations.

---

## 2. Error State Audit Register

| Host Page / Component | Error Trigger | Displayed UI Element | Error Recovery Action | Navigation Side-Effect |
| :--- | :--- | :--- | :--- | :--- |
| `ErrorBoundary.tsx` | Unhandled React exception | Full error card with stack trace | "Try Again" / "Return Home" | Option to navigate `/dashboard` |
| `NotFoundPage.tsx` | 404 Unmatched URL | Error illustration with URL path | "Back to Home" / "Go Back" | Navigates `/dashboard` or `-1` |
| `QuestionDetailPage` | Question ID does not exist in Sheets | Inline Alert with AlertCircle | "Back to Questions" button | `navigate("/questions")` |
| `QuestionStudioPage` | Gemini AI generation quota / failure | Amber Warning Banner | "Retry Generation" button | Remains on Step 4 |
| `QuestionVerifyApprovePage`| Verification mutation failed | Red Toast Alert | "Retry Approval" button | Remains on verification page |
| `VideoDetailPage` | Video ID not found | Warning Container Card | "Back to Pipeline" button | `navigate("/production")` |
| `SettingsPage` | Google Sheets ping error | Red badge with error code | "Re-test Connection" button| None |
| `RecoveryAdminPage` | Snapshot checksum mismatch | Red Modal Warning Alert | "Abort Restore" button | Dismisses preflight modal |
| `LoginPage.tsx` | Invalid demo credentials | Red inline error box below input | Re-type credentials | None |
