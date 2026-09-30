# Global Breadcrumb Navigation Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 07 of 30  
**Document:** 06 of 27  

---

## 1. Breadcrumb Architecture

Breadcrumbs in BP-CMS are centralized in `src/design-system/components/AppBreadcrumbs.tsx` and rendered globally in `src/components/layout/Layout.tsx` within a sticky sub-header bar (`sticky top-16 z-20`).

```typescript
// src/components/layout/Layout.tsx:63-70
<div id="shell-breadcrumb-bar" className="bg-white/80 backdrop-blur-xs border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-2 sticky top-16 z-20">
  <div className="max-w-7xl mx-auto">
    <AppBreadcrumbs />
  </div>
</div>
```

---

## 2. Dynamic Path Inference Engine (`inferBreadcrumbs`)

Instead of requiring every individual page component to manually pass breadcrumb props, BP-CMS utilizes an inference engine that deterministically parses `location.pathname` and `location.search`.

### Rule Mapping Matrix (32 Distinct Rule Blocks)

| URL Pattern | Query Params | Inferred Trail | Hub Link |
| :--- | :--- | :--- | :--- |
| `/dashboard`, `/` | Any | `Home > Overview` | `/dashboard` |
| `/my-work` | Any | `Home > My Work` | `/dashboard` |
| `/questions` | Any | `Questions > Question Library` | `/questions` |
| `/studio`, `/generate`, `/questions/new` | Any | `Questions > Question Studio` | `/questions` |
| `/questions/*/improve` | Any | `Questions > Question Studio > Improve Question` | `/questions`, `/studio` |
| `/questions/*/verify` | Any | `Questions > Question Studio > Verify & Approve` | `/questions`, `/studio` |
| `/questions/:id` | Any | `Questions > Question Details` | `/questions` |
| `/queue` | Any | `Production > Recording Queue` | `/production` |
| `/production` | Any | `Production > Production Pipeline` | `/production` |
| `/videos/:id` | `?tab=script` | `Production > Script Workspace` | `/production` |
| `/videos/:id` | `?tab=recording` | `Production > Recording Workspace` | `/production` |
| `/videos/:id` | `?tab=editing` | `Production > Editing Workspace` | `/production` |
| `/videos/:id` | `?tab=final-review` | `Production > Final QC Review` | `/production` |
| `/videos/:id` | `?tab=thumbnail` | `Production > Thumbnail Studio` | `/production` |
| `/videos/:id` | `?tab=social` | `Production > Social Review Simulator` | `/production` |
| `/videos/:id` | `?tab=pinned-comment` | `Production > Pinned Comment` | `/production` |
| `/videos/:id` | `?tab=publishing` | `Production > Publishing Dispatcher` | `/production` |
| `/social-review/*` | Any | `Publishing > Quality Signoff` | `/publishing` |
| `/platform-packages` | Any | `Publishing > Platform Packages` | `/publishing` |
| `/publishing` | Any | `Publishing > Publishing Manager` | `/publishing` |
| `/analytics/overview`| Any | `Analytics > Analytics Overview` | `/analytics/overview` |
| `/analytics/video` | Any | `Analytics > Video Performance` | `/analytics/overview` |
| `/analytics/engagement`| Any | `Analytics > Engagement` | `/analytics/overview` |
| `/analytics/retention` | Any | `Analytics > Retention` | `/analytics/overview` |
| `/analytics/intelligence`| Any | `Analytics > AI Insights` | `/analytics/overview` |
| `/planning` | Any | `Management & System > Planning & Batches` | `/planning` |
| `/team`, `/team-work` | Any | `Management & System > Team Workload` | `/team` |
| `/content-masters/*` | Any | `Management & System > Content Explorer` | `/content-masters` |
| `/settings` | Any | `Management & System > System Health` | `/settings` |
| `/recovery`, `/admin`| Any | `Management & System > Disaster Recovery` | `/recovery` |

---

## 3. Breadcrumb Accessibility & Rendering Quality

1. **Root Icon Anchor**: The root breadcrumb item renders a dedicated Home icon (`<Home className="w-3.5 h-3.5" />`) linked directly to `/dashboard`.
2. **Accessible Landmarks**: Renders `<nav aria-label="Breadcrumb">`.
3. **Active Terminal Node**: The final breadcrumb item is marked non-clickable with `font-semibold text-slate-900`.
4. **Horizontal Overflow**: Uses `overflow-x-auto whitespace-nowrap scrollbar-none` to gracefully handle deep hierarchies on mobile displays.
