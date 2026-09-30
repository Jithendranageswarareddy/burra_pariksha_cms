# 6-Hub Information Architecture Forensic Analysis

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 07 of 30  
**Document:** 03 of 27  

---

## 1. Hub Hierarchy & Configuration

The definitive Information Architecture of BP-CMS is defined in `src/config/navigation.ts` as `AUTHORITATIVE_HUBS`. It enforces six frozen administrative and operational hubs containing 14 primary navigation items:

```typescript
// src/config/navigation.ts
export const AUTHORITATIVE_HUBS: NavigationHub[] = [ ... ];
```

---

## 2. Complete Hub & Item Audit Matrix

| Hub ID | Hub Title | Required Capability | Nav Item ID | Nav Item Label | Route (`href`) | Icon Name | Capability Filter | Badge / Tag |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `hub-home` | **HOME** | `VIEW_HOME` | `home-overview` | Overview | `/dashboard` | `LayoutDashboard` | `VIEW_HOME` | - |
| `hub-home` | **HOME** | `VIEW_HOME` | `home-my-work` | My Work | `/my-work` | `UserCheck` | `VIEW_MY_WORK` | `Tasks` |
| `hub-questions` | **QUESTIONS** | `VIEW_QUESTIONS` | `questions-library` | Question Library | `/questions` | `BookOpen` | `VIEW_QUESTIONS` | - |
| `hub-questions` | **QUESTIONS** | `VIEW_QUESTIONS` | `questions-studio` | Question Studio | `/studio` | `Sparkles` | `VIEW_QUESTION_STUDIO` | `Studio` |
| `hub-production` | **PRODUCTION** | `VIEW_PRODUCTION` | `production-queue` | Recording Queue | `/queue` | `Video` | `VIEW_RECORDING_QUEUE` | - |
| `hub-production` | **PRODUCTION** | `VIEW_PRODUCTION` | `production-pipeline`| Production Pipeline | `/production` | `Film` | `VIEW_PRODUCTION` | - |
| `hub-publishing` | **PUBLISHING** | `VIEW_PUBLISHING` | `publishing-signoff` | Quality Signoff | `/social-review` | `ShieldCheck` | `VIEW_QUALITY_SIGNOFF` | - |
| `hub-publishing` | **PUBLISHING** | `VIEW_PUBLISHING` | `publishing-manager` | Publishing Manager | `/publishing` | `UploadCloud` | `VIEW_PUBLISHING` | - |
| `hub-analytics` | **ANALYTICS** | `VIEW_ANALYTICS` | `analytics-hub` | Analytics Hub | `/analytics/overview`| `BarChart2` | `VIEW_ANALYTICS` | - |
| `hub-management` | **MANAGEMENT & SYSTEM** | `VIEW_MANAGEMENT` | `mgmt-planning` | Planning & Batches | `/planning` | `Compass` | `VIEW_PLANNING` | - |
| `hub-management` | **MANAGEMENT & SYSTEM** | `VIEW_MANAGEMENT` | `mgmt-team` | Team Workload | `/team` | `Users` | `VIEW_TEAM` | - |
| `hub-management` | **MANAGEMENT & SYSTEM** | `VIEW_MANAGEMENT` | `mgmt-content-masters`| Content Explorer | `/content-masters` | `Layers` | `VIEW_CONTENT_MASTERS` | - |
| `hub-management` | **MANAGEMENT & SYSTEM** | `VIEW_MANAGEMENT` | `mgmt-system-health` | System Health | `/settings` | `Settings` | `VIEW_SYSTEM_HEALTH` | - |
| `hub-management` | **MANAGEMENT & SYSTEM** | `VIEW_MANAGEMENT` | `mgmt-recovery` | Disaster Recovery | `/recovery` | `RotateCcw` | `VIEW_DISASTER_RECOVERY` | `Admin` |

---

## 3. Backward Compatibility Interface

To ensure legacy scripts and test suites do not break, `src/config/navigation.ts` exports a compatibility mapping:

```typescript
export interface NavItem extends HubNavItem {}
export interface NavSection {
  title: string;
  subtitle?: string;
  isSecondary?: boolean;
  items: NavItem[];
}
export const NAVIGATION_SECTIONS: NavSection[] = AUTHORITATIVE_HUBS.map((hub) => ({
  title: hub.title,
  subtitle: hub.subtitle,
  items: hub.items,
}));
```

---

## 4. Architectural Analysis & Findings

1. **Hub Integrity**: All 6 hubs have dedicated titles and capability gates.
2. **Item Count**: 14 authoritative navigation destinations exist across the 6 hubs.
3. **Route Alignment**: Every item's `href` matches a registered route inside `src/App.tsx`.
4. **Disaster Recovery Isolation**: The `mgmt-recovery` item explicitly specifies `adminOnly: true` and requires `VIEW_DISASTER_RECOVERY` capability, preventing unauthorized access by creators or editors.
