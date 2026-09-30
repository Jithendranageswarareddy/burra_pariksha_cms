# Layout Components Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 05 — Frontend Architecture Forensic Audit  
**Audit Date:** 2026-09-28  

---

## 1. Inventory of Layout Components

All layout components reside in `src/components/layout/` (8 files):

| File Path | Component Name | Inbound Consumers | Apparent Responsibility | Status |
| :--- | :--- | :---: | :--- | :---: |
| `src/components/layout/Layout.tsx` | `Layout` | **1** (`src/App.tsx`) | Primary application frame & shell | CANONICAL |
| `src/components/layout/Header.tsx` | `Header` | **1** (`Layout.tsx`) | Global top navigation bar | CANONICAL |
| `src/components/layout/Sidebar.tsx` | `Sidebar` | **1** (`Layout.tsx`) | Collapsible role-filtered left drawer | CANONICAL |
| `src/components/layout/PageHeader.tsx` | `PageHeader` | **27 pages** | Standard page title, badge & action row | DUPLICATE CANDIDATE |
| `src/components/layout/ErrorBoundary.tsx` | `ErrorBoundary` | **1** (`Layout.tsx`) | Class-based React error boundary | CANONICAL |
| `src/components/layout/NotificationsMenu.tsx`| `NotificationsMenu` | **1** (`Header.tsx`) | Notification dropdown & poll trigger | CANONICAL |
| `src/components/layout/UserProfileMenu.tsx` | `UserProfileMenu` | **1** (`Header.tsx`) | User profile popover & logout trigger | CANONICAL |
| `src/components/layout/SystemHealthIndicator.tsx`| `SystemHealthIndicator` | **1** (`Header.tsx`) | Connectivity indicator for Sheets API | CANONICAL |

---

## 2. High-Risk Layout Duplication: `PageHeader`

The repository maintains **two competing implementations** of the standard page header:

1. **`src/components/layout/PageHeader.tsx`** (27 page consumers)
   - Accepts `title`, `subtitle`, `breadcrumbs`, `actions`, `badge`.
   - Ad-hoc Tailwind styling.
2. **`src/design-system/components/PageHeader.tsx`** (28 consumers)
   - Accepts `title`, `description`, `breadcrumbs`, `actions`, `badges`, `meta`.
   - Built on design system design tokens.

### Impact of Duplication
Individual pages randomly choose between `src/components/layout/PageHeader` and `src/design-system/components/PageHeader`, causing subtle visual inconsistencies in breadcrumb rendering, margin spacing, and action button alignment across pages.
