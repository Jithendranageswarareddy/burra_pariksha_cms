# Workspace Tab Subsystem Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 08 of 30  
**Document:** 14 of 30  

---

## 1. Tab Subsystem Topology

BP-CMS deploys **12 multi-tab environments**. The two master tabbed environments are:
1. **Video Production Cockpit (`VideoDetailPage.tsx`)**: 8 production tabs representing stages 03 through 10.
2. **Analytics Intelligence Hub (`AnalyticsExperiencePage.tsx`)**: 10 analytical sub-tabs.

---

## 2. Master Tab Audit Matrix

| Host Page Component | Active Tab State Mechanism | Deep-Link URL Contract | Tab Options Available | Fallback Tab |
| :--- | :--- | :--- | :--- | :--- |
| `VideoDetailPage.tsx` | `useSearchParams({ tab })` | `/videos/:id?tab=${tabKey}` | `overview`, `script`, `recording`, `editing`, `final-review`, `thumbnail`, `social`, `publishing` | `overview` |
| `AnalyticsExperiencePage.tsx`| Route Sub-paths in `App.tsx` | `/analytics/${subPath}` | `overview`, `video`, `platform`, `topic`, `subtopic`, `difficulty`, `engagement`, `retention`, `intelligence`, `strategy` | `overview` |
| `SettingsPage.tsx` | `useSearchParams({ tab })` | `/settings?tab=${tabKey}` | `taxonomy`, `sheets`, `system` | `taxonomy` |
| `MyWorkPage.tsx` | Local React State (`activeTab`) | None (Internal State) | `pending`, `in_review`, `completed` | `pending` |
| `PlanningPage.tsx` | Local React State (`activeTab`) | None (Internal State) | `curriculum`, `batches`, `distribution` | `curriculum` |
| `TeamOperationsPage.tsx` | Local React State (`activeTab`) | None (Internal State) | `workload`, `members`, `performance` | `workload` |
| `QuestionStudioPage.tsx` | Step Index (`currentStep`) | None (Internal State) | Step 1 (Curriculum), Step 2 (Options), Step 3 (Proof), Step 4 (AI Polish) | Step 1 |
| `ProductionTrackerPage.tsx`| `useSearchParams({ status })` | `/production?status=${status}`| Kanban swimlanes (All, Script, Record, Edit, QC, Ready) | `ALL` |
