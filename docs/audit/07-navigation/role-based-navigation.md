# Role-Based Access Control (RBAC) & Navigation Filtering

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 07 of 30  
**Document:** 07 of 27  

---

## 1. RBAC Navigation Architecture

Navigation visibility in BP-CMS is dynamically pruned using capability predicates defined in `src/config/roles.ts` and evaluated inside `Sidebar.tsx`:

```typescript
// src/components/layout/Sidebar.tsx:201-205
const renderNavItem = (item: HubNavItem) => {
  if (item.capability && !hasNavigationCapability(user?.role, item.capability)) {
    return null;
  }
  ...
};
```

---

## 2. Navigation Capability Matrix across Canonical Roles

| Hub Navigation Item | Capability Flag | ADMIN | PRODUCER | LEAD_EDITOR | ACADEMIC_SOLVER | PRESENTER | SCRIPTWRITER | VIDEO_EDITOR | QA_REVIEWER | SOCIAL_MEDIA |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Overview** (`/dashboard`) | `VIEW_HOME` | YES | YES | YES | YES | YES | YES | YES | YES | YES |
| **My Work** (`/my-work`) | `VIEW_MY_WORK` | YES | YES | YES | YES | YES | YES | YES | YES | YES |
| **Question Library** (`/questions`) | `VIEW_QUESTIONS` | YES | YES | YES | YES | NO | YES | NO | YES | NO |
| **Question Studio** (`/studio`) | `VIEW_QUESTION_STUDIO` | YES | YES | YES | YES | NO | YES | NO | NO | NO |
| **Recording Queue** (`/queue`) | `VIEW_RECORDING_QUEUE` | YES | YES | YES | NO | YES | NO | NO | NO | NO |
| **Production Pipeline** (`/production`) | `VIEW_PRODUCTION` | YES | YES | YES | NO | YES | YES | YES | YES | NO |
| **Quality Signoff** (`/social-review`) | `VIEW_QUALITY_SIGNOFF` | YES | YES | YES | YES | NO | NO | NO | YES | YES |
| **Publishing Manager** (`/publishing`) | `VIEW_PUBLISHING` | YES | YES | YES | NO | NO | NO | NO | NO | YES |
| **Analytics Hub** (`/analytics/overview`) | `VIEW_ANALYTICS` | YES | YES | YES | YES | YES | YES | YES | YES | YES |
| **Planning & Batches** (`/planning`) | `VIEW_PLANNING` | YES | YES | YES | NO | NO | NO | NO | NO | NO |
| **Team Workload** (`/team`) | `VIEW_TEAM` | YES | YES | YES | NO | NO | NO | NO | NO | NO |
| **Content Explorer** (`/content-masters`) | `VIEW_CONTENT_MASTERS` | YES | YES | YES | YES | NO | YES | YES | YES | YES |
| **System Health** (`/settings`) | `VIEW_SYSTEM_HEALTH` | YES | NO | NO | NO | NO | NO | NO | NO | NO |
| **Disaster Recovery** (`/recovery`) | `VIEW_DISASTER_RECOVERY` | YES | NO | NO | NO | NO | NO | NO | NO | NO |

---

## 3. Critical Security & RBAC Finding

- **UI Filtering vs Route Enforcement Divergence**:
  - While `Sidebar.tsx` hides unauthorized navigation links, **child routes in `src/App.tsx` lack route guards**.
  - A user logged in as `VIDEO_EDITOR` or `SCRIPTWRITER` cannot see the "Disaster Recovery" or "System Health" links in the sidebar, but navigating directly to `/recovery` or `/settings` via the browser address bar will render the page!
  - **Audit Risk Classification**: HIGH. Must enforce route-level guard wrappers in remediation steps.
