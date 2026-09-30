# Stale Data & Cache Synchronization Forensic Audit (9 Vulnerabilities)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 10 of 30  
**Document:** 18 of 30  

---

## 1. Executive Summary

Because BP-CMS relies on Google Sheets as its backend database, API calls experience latency ranging from 400ms to 2500ms. To optimize response times, several components cache data in React state or local variables without implementing cache invalidation or WebSockets/polling. This creates **9 significant stale-data surfaces**.

---

## 2. Stale Data Vulnerability Register

| Surface / Component | Stale Data Mechanism | Mutation Trigger | Cause of Desynchronization | Consequence |
| :--- | :--- | :--- | :--- | :--- |
| `DashboardPage.tsx` | Metric counters cached on mount | New video produced or published | No polling or event bus to update counter cards | Overview dashboard displays outdated metrics until full manual browser refresh. |
| `ProductionJourneyBar.tsx` | 15-stage status badge | User advances stage in tabbed workspace | Stepper bar queries parent entity once; child workspace changes status via sub-endpoint | Stepper indicates previous stage even though current stage is finished. |
| `PlanningPage.tsx` | Batch list in memory | Batch generated via AI prompt | Raw `fetch` does not trigger React Query cache invalidation | User does not see new batch until navigating away and back. |
| `QuestionLibraryPage.tsx` | Filtered question table | Question status changed in modal | Table state does not refetch upon modal closure | Approved question still shows "PENDING_VERIFICATION" in list. |
| `ScriptWorkspace.tsx` | Teleprompter script text | Script updated by another user | Component has no concurrency polling | User overwrites colleague's script edits with stale local state. |
| `SettingsPage.tsx` | Taxonomy category tree | New topic added via Planning page | Settings page fetches taxonomy once on initial load | New syllabus topics invisible in settings dropdowns. |
| `TeamOperationsPage.tsx` | Team member workload count | Task assigned in AssignmentModal | Workload calculation uses stale assignment list | Overloaded member appears available for additional tasks. |
| `VideoDetailPage.tsx` | Video metadata header | Video title updated in script tab | Sub-workspace updates video title; header reads parent video prop | Header displays old title while tab displays new title. |
| `RecoveryAdminPage.tsx` | Snapshot archive list | New snapshot generated | Archive list does not automatically refetch | Newly created disaster recovery snapshot missing from table. |
