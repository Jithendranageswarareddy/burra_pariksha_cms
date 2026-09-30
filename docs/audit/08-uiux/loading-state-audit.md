# Loading State Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 08 of 30  
**Document:** 16 of 30  

---

## 1. Loading State Architecture

BP-CMS deploys three distinct loading mechanisms:
1. **Full-Page Center Spinner**: Used during initial page data bootstrapping.
2. **Skeleton Skeletons**: Used in `QuestionLibraryPage` and `DashboardPage` during table fetching.
3. **Button Loading Spinners**: Disables the button and shows a rotating Lucide `<Loader2 className="animate-spin" />` during async mutations.

---

## 2. Loading State Audit by Page

| Page Component | Initial Page Load UI | Table / List Fetch UI | Button Async Loading? | Blocking Viewport? |
| :--- | :--- | :--- | :---: | :---: |
| `DashboardPage` | 4x Pulsing Metric Skeletons | Skeleton Rows | Yes (Refresh button) | No |
| `QuestionLibraryPage` | Table Skeleton (5 placeholder rows)| Pulsing Skeleton Rows | Yes (Search debounce) | No |
| `QuestionDetailPage` | Center Spinner (`<LoadingSpinner />`) | N/A | Yes (Action buttons) | Yes |
| `QuestionStudioPage` | Form Skeleton Loader | Drawer Spinner | Yes ("Save", "Generate AI")| Yes (During AI generation) |
| `ProductionTrackerPage`| 6 Column Skeletons | Shimmer Card Tiles | N/A | No |
| `VideoDetailPage` | Center Spinner with video title | Workspace Tab Spinner | Yes ("Approve", "Save Take")| No |
| `PlanningPage` | Raw spinner on mount | Un-memoized fetch cascades| **NO (High-risk click trap)** | No |
| `SettingsPage` | 3-tab skeleton | Ping indicator spinner | Yes ("Test Connection") | No |
| `RecoveryAdminPage` | Table Skeleton | Diff inspection spinner | Yes ("Initiate Restore") | Yes (Full overlay) |
