# Component Consumer Map & Inbound Coupling Graph

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 05 — Frontend Architecture Forensic Audit  
**Audit Date:** 2026-09-28  

---

## 1. Top Inbound Component Consumer Metrics

| Component Path | Component Name | Consumers | Primary Consumers |
| :--- | :--- | :---: | :--- |
| `src/design-system/components/Button.tsx` | `Button` (DS) | **52** | Pages, modals, workspaces, tables |
| `src/components/common/Button.tsx` | `Button` (Ad-hoc) | **51** | Pages, widgets, cards, headers |
| `src/design-system/components/PageHeader.tsx`| `PageHeader` (DS) | **28** | Active production & analytics pages |
| `src/components/layout/PageHeader.tsx` | `PageHeader` (Layout) | **27** | Feature pages, library pages |
| `src/design-system/components/Badge.tsx` | `Badge` (DS) | **24** | Status tags, tables, detail views |
| `src/design-system/components/Card.tsx` | `Card` (DS) | **19** | Dashboard, analytics, forms |
| `src/design-system/components/EmptyState.tsx`| `EmptyState` (DS) | **15** | Workspaces, filtered list states |
| `src/components/common/EmptyState.tsx` | `EmptyState` (Ad-hoc)| **14** | Library, queue, table views |
| `src/design-system/components/Alert.tsx` | `Alert` (DS) | **14** | Form warnings, error banners |
| `src/design-system/components/Modal.tsx` | `Modal` (DS) | **12** | Action modals, export dialogs |
| `src/components/common/Modal.tsx` | `Modal` (Ad-hoc) | **12** | Assignment modals, copy dialogs |
| `src/design-system/components/Loading.tsx` | `Loading` (DS) | **11** | Async page loaders, spinners |
| `src/components/common/StatusBadge.tsx` | `StatusBadge` | **8** | Question & Video status rendering |
| `src/components/production/ProductionJourneyBar.tsx`| `ProductionJourneyBar` | **8** | Global layout shell, stage overview |
| `src/components/common/DifficultyBadge.tsx`| `DifficultyBadge` | **5** | Question cards and tables |
| `src/components/common/StatCard.tsx` | `StatCard` | **4** | Dashboard & overview metrics |
| `src/components/video/VideoWorkflowHeader.tsx`| `VideoWorkflowHeader`| **4** | Video workspaces (scripts, edit, etc.) |

---

## 2. Inbound Coupling Insights
- Extreme architectural split: `Button` has ~103 total consumers split almost exactly 50/50 between the two duplicate Button files.
- `PageHeader` has 55 total consumers split 28 vs 27 between the two PageHeader files.
- `EmptyState` has 29 total consumers split 15 vs 14 between the two EmptyState files.
