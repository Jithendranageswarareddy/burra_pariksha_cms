# Empty State Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 08 of 30  
**Document:** 17 of 30  

---

## 1. Empty State Architecture

The application standardizes empty states using `src/components/common/EmptyState.tsx`.
Props supported:
- `icon`: Lucide icon component.
- `title`: Clear explanatory heading.
- `description`: Contextual explanation of why the view is empty.
- `actionLabel` & `actionHref` / `onAction`: Call to Action button.

---

## 2. Page-by-Page Empty State Audit

| Page Component | Empty Condition | Rendered Empty UI Component | Action CTA Label | Action Destination |
| :--- | :--- | :--- | :--- | :--- |
| `QuestionLibraryPage` | No questions match filters | `<EmptyState />` | "Reset Filters" / "Create Question" | Clears query / `/studio` |
| `QuestionLibraryPage` | Database table completely empty | `<EmptyState />` | "Author First Question" | `/studio` |
| `ProductionTrackerPage`| No videos in active pipeline | `<EmptyState />` | "Review Queue" | `/queue` |
| `QueuePage` | No questions ready for filming | `<EmptyState />` | "Verify Questions" | `/questions` |
| `SocialReviewPage` | No social packages awaiting signoff| `<EmptyState />` | "Go to Production Board" | `/production` |
| `PlatformPackagesPage`| No completed videos | `<EmptyState />` | "View Editing Bay" | `/production?status=EDITING`|
| `PublishingPage` | No scheduled broadcasts | Calendar Empty Tile | "Schedule First Video" | Opens schedule modal |
| `MyWorkPage` | Zero tasks assigned to user | `<EmptyState />` | "Explore Question Library" | `/questions` |
| `SocialAnalyticsPage` | No comments found | `<EmptyState />` | "Sync Social Accounts" | `/settings` |
| `ContentMasterPage` | No Content Master records | `<EmptyState />` | "Create Question Master" | `/studio` |
| `RecoveryAdminPage` | No backup archives found in GCS | Warning Banner Card | "Create Instant Snapshot" | Triggers backup job |
