# Frontend Component Inventory Forensic Dossiers

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 05 — Frontend Architecture Forensic Audit  
**Audit Date:** 2026-09-28  

---

## 1. Component Population Overview

The frontend repository contains **80 distinct component files** across two directory trees:
- `src/components/`: **59 component files** (Domain feature components and ad-hoc shared widgets)
- `src/design-system/`: **21 component & token files** (18 components + 3 tokens/index files)

---

## 2. Directory-by-Directory Breakdown of `src/components/`

### A. `src/components/layout/` (8 components)
- `Layout.tsx`, `Header.tsx`, `Sidebar.tsx`, `PageHeader.tsx`, `ErrorBoundary.tsx`, `NotificationsMenu.tsx`, `UserProfileMenu.tsx`, `SystemHealthIndicator.tsx`.

### B. `src/components/common/` (9 components)
- Ad-hoc reusable UI primitives: `Button.tsx`, `Modal.tsx`, `EmptyState.tsx`, `LoadingState.tsx`, `StatusBadge.tsx`, `DifficultyBadge.tsx`, `StatCard.tsx`, `SearchInput.tsx`, `TechnicalDetails.tsx`.

### C. `src/components/dashboard/` (14 components)
- Dashboard widgets: `ActionRequiredAlerts.tsx`, `AssignmentsWidget.tsx`, `AttentionItemsWidget.tsx`, `BatchStatusWidget.tsx`, `ContinueProductionCard.tsx`, `ExecutiveHeroBanner.tsx`, `GlobalSearchBar.tsx`, `OperationalHealthWidget.tsx`, `PipelineStatusWidget.tsx`, `ProductionVelocityWidget.tsx`, `QuickActionsSection.tsx`, `RecentActivityWidget.tsx`, `StatsOverview.tsx`, `WhatsWaitingSection.tsx`.

### D. `src/components/questions/` (8 components)
- Question lifecycle: `BulkGenerateModal.tsx`, `ExportModal.tsx`, `GenerationStudio.tsx`, `QuestionFilters.tsx`, `QuestionGrid.tsx`, `QuestionTable.tsx`, `QuestionWorkflowHeader.tsx`, `TopicHierarchySelector.tsx`.

### E. `src/components/video/` (8 components)
- Video production: `EditingWorkspace.tsx`, `FinalReviewWorkspace.tsx`, `PinnedCommentWorkspace.tsx`, `PublishingWorkspace.tsx`, `RecordingWorkspace.tsx`, `ScriptWorkspace.tsx`, `ThumbnailWorkspace.tsx`, `VideoWorkflowHeader.tsx`.

### F. `src/components/production/` (1 component)
- Global journey bar: `ProductionJourneyBar.tsx` (Canonical 15-stage workflow visualizer).

### G. `src/components/publishing/` (6 components)
- Publishing lifecycle: `FinalizePublishingModal.tsx`, `PackageCopierModal.tsx`, `PublishScheduleModal.tsx`, `PublishingAssignmentModal.tsx`, `PublishingTable.tsx`, `PublishingWorkflowHeader.tsx`, `RecordPublicationModal.tsx`, `RetryPlatformModal.tsx`.

### H. `src/components/social/` (2 components)
- Social review: `AssetWorkflowHeader.tsx`, `SocialReviewWorkspace.tsx`.

### I. `src/components/assignments/` (3 components)
- Team assignments: `AssignmentBadge.tsx`, `AssignmentModal.tsx`, `EntityAssignmentsSection.tsx`.

---

## 3. Directory Breakdown of `src/design-system/` (18 UI Components)
- `Alert.tsx`, `AppBreadcrumbs.tsx`, `Badge.tsx`, `Button.tsx`, `Card.tsx`, `EmptyState.tsx`, `ErrorState.tsx`, `Form.tsx`, `Icon.tsx`, `Input.tsx`, `Loading.tsx`, `Modal.tsx`, `PageHeader.tsx`, `Select.tsx`, `StepIndicator.tsx`, `SuccessState.tsx`, `Table.tsx`, `WorkflowStepNav.tsx`.
