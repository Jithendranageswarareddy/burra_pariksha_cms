# Declarative Links Inventory (All `<Link>` and `<NavLink>` Elements)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 07 of 30  
**Document:** 10 of 27  

---

## 1. Declarative Navigation Summary

The Burra Pariksha CMS uses React Router DOM's declarative navigation components:
- **`<NavLink>`**: Used in `src/components/layout/Sidebar.tsx` for primary hub items with active state highlighting.
- **`<Link>`**: Used in headers, breadcrumbs, tables, cards, and empty states.

---

## 2. Declarative Links Master Catalog

| # | Source File & Line | Component | Target Path (`to`) | Visual Presentation | Accessible Label / Title |
|---|---|---|---|---|---|
| 1 | `src/components/layout/Sidebar.tsx:213` | `<NavLink>` | `item.href` | Mini sidebar collapsed icon | `title="${item.name} • ${item.description}"` |
| 2 | `src/components/layout/Sidebar.tsx:237` | `<NavLink>` | `item.href` | Expanded sidebar nav pill with icon & label | `aria-current={active ? "page" : undefined}` |
| 3 | `src/components/layout/Layout.tsx:34` | `<a href>` | `#app-main-content` | Skip to main content (screen reader accessible) | "Skip to main content" |
| 4 | `src/design-system/components/AppBreadcrumbs.tsx:289` | `<Link>` | `"/dashboard"` | Root Home Icon anchor | `title="Burra Pariksha Home"` |
| 5 | `src/design-system/components/AppBreadcrumbs.tsx:304` | `<Link>` | `item.href` | Intermediate breadcrumb parent segment | Breadcrumb label text |
| 6 | `src/pages/DashboardPage.tsx:142` | `<Link>` | `"/questions"` | "View All Questions" header action link | "View all questions in library" |
| 7 | `src/pages/DashboardPage.tsx:158` | `<Link>` | `"/studio"` | "Create New Question" quick link | "Open question studio" |
| 8 | `src/pages/DashboardPage.tsx:174` | `<Link>` | `"/queue"` | "Recording Schedule" link | "Open recording queue" |
| 9 | `src/pages/DashboardPage.tsx:190` | `<Link>` | `"/production"` | "Full Production Board" link | "Open production pipeline" |
| 10 | `src/pages/DashboardPage.tsx:206` | `<Link>` | `"/social-review"` | "Pending Reviews" badge link | "Open social signoff" |
| 11 | `src/pages/DashboardPage.tsx:222` | `<Link>` | `"/publishing"` | "Scheduled Broadcasts" link | "Open publishing manager" |
| 12 | `src/pages/DashboardPage.tsx:238` | `<Link>` | `"/analytics/overview"`| "Deep Intelligence" link | "Open analytics hub" |
| 13 | `src/pages/PlanningPage.tsx:98` | `<Link>` | `"/studio?topicId=${topic.id}"` | "Draft for Topic" button link | "Create question for topic" |
| 14 | `src/pages/QuestionLibraryPage.tsx:220` | `<Link>` | `"/studio"` | "Author New Question" primary CTA | "Author new question" |
| 15 | `src/pages/QuestionLibraryPage.tsx:310` | `<Link>` | ``/questions/${item.id}`` | Question table title link | Question text |
| 16 | `src/pages/QuestionLibraryPage.tsx:334` | `<Link>` | ``/questions/${item.id}/verify`` | "Verify" quick action link | "Verify question" |
| 17 | `src/pages/ProductionTrackerPage.tsx:210` | `<Link>` | ``/videos/${v.id}`` | Video card title link | Video title |
| 18 | `src/pages/ProductionTrackerPage.tsx:234` | `<Link>` | ``/videos/${v.id}?tab=script`` | "Script" phase pill link | "Open script workspace" |
| 19 | `src/pages/ProductionTrackerPage.tsx:242` | `<Link>` | ``/videos/${v.id}?tab=recording``| "Recording" phase pill link | "Open recording workspace" |
| 20 | `src/pages/ProductionTrackerPage.tsx:250` | `<Link>` | ``/videos/${v.id}?tab=editing`` | "Editing" phase pill link | "Open editing workspace" |
| 21 | `src/pages/ProductionTrackerPage.tsx:258` | `<Link>` | ``/videos/${v.id}?tab=final-review``| "QC Review" phase pill link | "Open QC review workspace" |
| 22 | `src/pages/ProductionTrackerPage.tsx:266` | `<Link>` | ``/videos/${v.id}?tab=thumbnail``| "Thumbnail" phase pill link | "Open thumbnail workspace" |
| 23 | `src/pages/SocialReviewPage.tsx:142` | `<Link>` | ``/social-review/${rev.id}``| Review list item link | Review item title |
| 24 | `src/pages/PublishingPage.tsx:190` | `<Link>` | ``/videos/${pub.videoId}``| Publishing package video title link| Video title |
| 25 | `src/pages/PlatformPackagesPage.tsx:142`| `<Link>` | `"/publishing"` | "Back to Publishing" top link | "Back to publishing" |
| 26 | `src/pages/ContentMasterPage.tsx:210` | `<Link>` | ``/questions/${cm.questionId}``| Question linkage badge link | "View source question" |
| 27 | `src/pages/ContentMasterPage.tsx:218` | `<Link>` | ``/videos/${cm.videoId}`` | Video linkage badge link | "View target video" |
| 28 | `src/pages/MyWorkPage.tsx:178` | `<Link>` | `task.route` | Task title actionable link | Task name |
| 29 | `src/pages/TeamOperationsPage.tsx:210` | `<Link>` | ``/my-work?user=${member.id}``| Team member assigned workload link | "Inspect assigned work" |
| 30 | `src/components/common/EmptyState.tsx:48`| `<Link>` | `actionHref` | Action button link on empty screen | Action label |
| 31-38 | Secondary sub-components | `<Link>` | Specific routes | Contextual links | Various action labels |
