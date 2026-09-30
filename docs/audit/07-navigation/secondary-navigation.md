# Secondary Navigation & Header System Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 07 of 30  
**Document:** 05 of 27  

---

## 1. Top Bar Header Architecture

The secondary navigation subsystem is hosted within `src/components/layout/Header.tsx`. It sits sticky at the top of the viewport (`sticky top-0 z-30`) with a height of 64px (`h-16`), white background, and bottom border.

```typescript
// src/components/layout/Header.tsx
export const Header: React.FC<HeaderProps> = ({
  onOpenMobileMenu,
  isCollapsed = false,
  onToggleCollapse,
}) => { ... };
```

---

## 2. Header Component Breakdown

The header is partitioned into three distinct functional zones:

```
+---------------------------------------------------------------------------------------------------+
| [Left Zone]                         [Center Zone]                           [Right Zone]          |
| [Mobile Menu] [Collapse Toggle]     [Global Search Input]                  [Health] [Bell] [User] |
| [Studio Identity / Current Page]    "Search questions, videos..."          [System] [Menu] [Menu] |
+---------------------------------------------------------------------------------------------------+
```

### 1. Left Zone: Navigation Controls & Page Context
- **Mobile Menu Trigger**: Hamburger button (`<Menu />`) visible on `lg:hidden` viewports. Calls `onOpenMobileMenu()`.
- **Desktop Sidebar Collapse / Expand Toggle**: Button toggling between `<PanelLeftOpen />` and `<PanelLeftClose />`. Features keyboard hint `Ctrl+B`.
- **Studio Identity**: Displayed on mobile viewports (`Sparkles` icon + "Burra Pariksha" text).
- **Current Page Title**: Dynamically computed on desktop via `inferBreadcrumbs(location.pathname, location.search)`. Extracts the final breadcrumb item label (e.g. "Question Library", "Production Pipeline", "Script Workspace").

### 2. Center Zone: Global Search
- **Component**: `<GlobalSearchBar id="header-global-search" />`
- **Container**: Flexibly centered container with max width `max-w-md mx-4`. Hidden on small mobile screens (`hidden sm:block`).
- **Functionality**: Provides global keyword search across questions, videos, scripts, and content masters with keyboard shortcut (`/` or `Ctrl+K`).

### 3. Right Zone: Operational Status, Alerts & Identity
- **System Health Indicator**: `<SystemHealthIndicator />` renders real-time backend Google Sheets connectivity and latency status.
- **Notifications Menu**: `<NotificationsMenu id="top-notifications-menu" />` displays pending tasks, stage handoffs, and editorial rejections.
- **User Profile Menu**: `<UserProfileMenu id="top-user-profile-menu" />` displays user avatar, email, active role, switch role action (in dev/demo mode), and logout.

---

## 3. Responsive Adaptations

| Screen Size | Mobile Hamburger | Collapse Toggle | Page Title | Global Search | System Health | User Menu |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Mobile (<640px)** | Visible | Hidden | Hidden | Hidden | Hidden | Visible |
| **Tablet (640-1023px)** | Visible | Hidden | Hidden | Visible | Visible | Visible |
| **Desktop (>=1024px)** | Hidden | Visible | Visible | Visible | Visible | Visible |
