# Post-Authentication Landing Resolution Forensic Audit

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 07 of 30  
**Document:** 16 of 27  

---

## 1. Landing Resolution Architecture

When an authenticated user lands on the root route (`/`), BP-CMS computes their initial destination using `getDefaultLandingRoute(user?.role)` defined in `src/App.tsx`.

```typescript
// src/App.tsx:83
<Route index element={<Navigate to={landingRoute} replace />} />
```

---

## 2. Canonical Landing Route Mappings

| User Role | Resolved Landing Route | Destination Page Component | Operational Justification |
| :--- | :--- | :--- | :--- |
| `ADMIN` | `/dashboard` | `DashboardPage.tsx` | Executive overview of all system activity and team metrics |
| `PRODUCER` | `/dashboard` | `DashboardPage.tsx` | High-level conveyor belt velocity and sprint status |
| `LEAD_EDITOR` | `/production` | `ProductionTrackerPage.tsx` | Direct oversight of active video editing and review pipeline |
| `ACADEMIC_SOLVER`| `/questions` | `QuestionLibraryPage.tsx` | Immediate focus on unverified questions awaiting academic audit |
| `PRESENTER` | `/queue` | `QueuePage.tsx` | Studio recording schedule and active prompter intake |
| `SCRIPTWRITER` | `/studio` | `QuestionStudioPage.tsx` | Drafting question scripts and pedagogical prompts |
| `VIDEO_EDITOR` | `/production` | `ProductionTrackerPage.tsx` | Focus on videos in EDITING status |
| `QA_REVIEWER` | `/social-review`| `SocialReviewPage.tsx` | Reviewing Telugu grammar and platform-ready packages |
| `SOCIAL_MEDIA` | `/publishing` | `PublishingPage.tsx` | Scheduled broadcast calendar and distribution queue |
| Unrecognized / Fallback | `/dashboard` | `DashboardPage.tsx` | Safe operational default |

---

## 3. Login Redirect Preservation (`from` state)

When an unauthenticated user attempts to access a protected deep-link (e.g. `/videos/BP-VID-104?tab=editing`), `LoginPage.tsx` extracts the location state:

```typescript
// src/pages/LoginPage.tsx:48
const from = location.state?.from?.pathname || "/";
navigate(from, { replace: true });
```

This ensures users retain their exact deep-link context following successful authentication.
