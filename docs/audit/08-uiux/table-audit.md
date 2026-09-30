# Data Table & Grid Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 08 of 30  
**Document:** 11 of 30  

---

## 1. Table Architecture

The application contains **13 significant data tables and grids**. They display lists of questions, videos, team tasks, social comments, taxonomy items, and system snapshots.

---

## 2. Table-by-Table Forensic Audit

| Table Host Page | Data Entity | Columns Rendered | Sorting | Filtering | Pagination | Row Click Action |
| :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| `QuestionLibraryPage` | Questions | ID, Topic, Statement, Difficulty, Status, Author, Date | Yes | Yes (Status, Topic, Search) | Yes (10/25/50) | `navigate("/questions/:id")` |
| `ProductionTrackerPage`| Videos | Pipeline Kanban Columns (Card Grid) | Yes | Yes (Status, Presenter) | Infinite / Scroll | `navigate("/videos/:id?tab=...")` |
| `QueuePage` | Queue Items | Queue Rank, Video Title, Presenter, Status, Actions | No | Yes (Status) | No | Launches Prompter Workspace |
| `SocialReviewPage` | Social Reviews | Review ID, Video Title, Platform, Status, Reviewer | Yes | Yes (Status) | Yes (15/page) | Opens Detail Drawer |
| `PlatformPackagesPage`| Platform Pkgs | Package ID, Video ID, Platforms, Readiness, Actions | No | Yes (Platform) | No | `navigate("/videos/:id?tab=publishing")` |
| `PublishingPage` | Publications | Slot Datetime, Title, Status, Live Links, Sync Check | Yes | Yes (Date range) | Yes (20/page) | Opens Post Inspector Modal |
| `AnalyticsExperiencePage`| Video Metrics | Rank, Title, Views, Retention 30s, Completion %, Score | Yes | Yes (Topic, Difficulty)| Yes (10/page) | Opens Detailed Retention Curve |
| `SocialAnalyticsPage` | Comments | Timestamp, Platform, Author, Comment Text, Sentiment | Yes | Yes (Sentiment, Platform)| Yes (25/page) | View Thread / Moderate |
| `TeamOperationsPage` | Team Members | Avatar, Name, Role, Active Tasks Count, Capacity Bar | Yes | Yes (Role) | No | Opens Workload Reassignment |
| `ContentMasterPage` | ContentMasters | CM ID, Question Link, Video Link, Stage, Sync State | Yes | Yes (Search) | Yes (20/page) | `navigate("/content-masters/:id")`|
| `SettingsPage` | Taxonomy | Subject, Topic, Subtopic Count, Active Weight | No | No | No | In-line Edit / Delete |
| `RecoveryAdminPage` | Snapshots | Snapshot ID, Timestamp, Records Count, Checksum, Size | Yes | No | No | Selects Snapshot for Preflight |
| `MyWorkPage` | Assigned Tasks| Urgency, Task Name, Stage, Due Date, Direct CTA | Yes | Yes (Stage) | No | Deep-links into task tab |
