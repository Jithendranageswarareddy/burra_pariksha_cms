# Primary Sidebar Navigation Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 07 of 30  
**Document:** 04 of 27  

---

## 1. Primary Navigation Architecture

The primary navigation of BP-CMS is encapsulated in `src/components/layout/Sidebar.tsx`. It serves as the primary orienting mechanism for authenticated users.

```typescript
// src/components/layout/Sidebar.tsx
export interface SidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}
```

---

## 2. Visual & Interaction States

The Sidebar supports three distinct operational presentations:

### 1. Expanded Desktop Sidebar
- **Width**: `w-64` (16rem / 256px).
- **Presentation**: Full branding logo, hub section titles (e.g. "HOME", "QUESTIONS"), full item labels, descriptive subtitles, and badge pills.
- **Trigger**: Default desktop state when `isSidebarCollapsed === false`.

### 2. Collapsed Mini Sidebar (Icon Only)
- **Width**: `w-16` (4rem / 64px).
- **Presentation**: Collapses to icon-only vertical ribbon. Hub headers and labels are hidden. Icons feature accessible tooltip tags (`title="{item.name} • {item.description}"`).
- **Hover Expansion**: Features an intelligent mouse hover expansion (`isHovered` state) that temporarily expands the ribbon when hovered.

### 3. Mobile Responsive Drawer
- **Presentation**: Full-screen slide-over drawer with backdrop overlay (`bg-slate-900/60`).
- **Accessibility**: Listens for `Escape` key press to automatically close (`useEffect` lines 74-86).
- **Backdrop Dismiss**: Clicking the backdrop dismisses the drawer (`onClick={onCloseMobile}`).

---

## 3. Active Link Mapping Logic (`isCurrentActive`)

A critical strength of `Sidebar.tsx` is its deterministic active link calculation engine (`isCurrentActive`, lines 92-194). Rather than relying on simple prefix matching which causes false positives, it maps contextual sub-routes to parent hub items:

| Hub Item Target (`href`) | Sub-Routes Evaluated as Active | Forensic Evaluation Logic |
| :--- | :--- | :--- |
| `/dashboard` | `/`, `/dashboard` | Strict equality |
| `/my-work` | `/my-work` | Strict equality |
| `/questions` | `/questions`, `/questions/*` (excluding `/questions/new`, `/improve`, `/verify`) | Contextual routing partition |
| `/studio` | `/studio`, `/generate`, `/questions/new`, `/questions/:id/improve`, `/questions/:id/verify` | Unifies authoring sub-paths into Question Studio |
| `/queue` | `/queue` | Strict equality |
| `/production` | `/production`, `/production-tracker`, `/production-board`, `/videos/*` | Unifies tracker, kanban, and video workspaces into Pipeline |
| `/social-review` | `/social-review`, `/social-review/*` | Path prefix check |
| `/publishing` | `/publishing`, `/platform-packages`, `/publishing-package` | Unifies dispatcher and platform packages into Publishing |
| `/analytics/overview`| `/analytics/*`, `/social-analytics/*` | Unifies all 10 analytics tabs and social logs into Analytics Hub |
| `/planning` | `/planning` | Strict equality |
| `/team` | `/team`, `/team-work` | Multiple alias handling |
| `/content-masters`| `/content-masters`, `/content-masters/*` | Content Master detail views map to Explorer |
| `/settings` | `/settings` | Strict equality |
| `/recovery` | `/recovery`, `/admin` | Disaster recovery alias handling |

---

## 4. Role Badge & Identity Anchor

At the bottom of the sidebar, `Sidebar.tsx` renders the active user's operational context:
- Displays user full name and canonical role badge.
- Shows role descriptor badge with distinct color coding (Admin = Purple, Lead Editor = Blue, Academic = Emerald).
- Quick-action sign-out button (`useAuth().logout`).
