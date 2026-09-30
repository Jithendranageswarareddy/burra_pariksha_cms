# Frontend Architecture Topological Map

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 05 — Frontend Architecture Forensic Audit  
**Audit Date:** 2026-09-28  

---

## 1. Complete Topological Frontend Architecture Graph

```
                                  [ index.html ]
                                         │
                                         ▼
                                  [ src/main.tsx ]
                                         │
                                         ▼
                                  [ src/App.tsx ]
                                         │
                   ┌─────────────────────┴─────────────────────┐
                   ▼                                           ▼
            <BrowserRouter>                             <AuthProvider>
                   │                                           │
                   ▼                                           ▼
      <ProductionJourneyProvider> ───────────────►  [ useAuth / user state ]
                   │
                   ▼
              <AppRoutes>
                   │
         ┌─────────┴─────────┐
         ▼                   ▼
    [!user: Login]     [user: Layout Shell]
    LoginPage.tsx            │
                             ├─ Header.tsx (Search, Health, Notifications, Profile)
                             ├─ Sidebar.tsx (11-Role Filtered Drawer)
                             ├─ ProductionJourneyBar.tsx (15-Stage Workflow Bar)
                             ├─ ErrorBoundary.tsx (Component Crash Isolation)
                             │
                             ▼
                    <Outlet /> (Active Route)
                             │
     ┌───────────────────────┼────────────────────────┐
     ▼                       ▼                        ▼
[ CONTENT DOMAIN ]      [ VIDEO DOMAIN ]       [ INTELLIGENCE DOMAIN ]
PlanningPage            QueuePage              AnalyticsExperiencePage
QuestionLibraryPage     ProductionTrackerPage  SocialAnalyticsPage
QuestionDetailPage      VideoDetailPage        TeamOperationsPage
QuestionStudioPage       ├─ ScriptWorkspace    DashboardPage
QuestionVerifyPage       ├─ RecordWorkspace    MyWorkPage
ContentMasterPage        ├─ EditingWorkspace   SettingsPage
SocialReviewPage         ├─ FinalWorkspace     RecoveryAdminPage
                         ├─ ThumbWorkspace
                         └─ PublishWorkspace
                             │
                             ▼
              [ SHARED UI & ATOMIC PRIMITIVES ]
       ┌─────────────────────┴─────────────────────┐
       ▼                                           ▼
[ src/design-system/ ]                     [ src/components/common/ ]
Button, Modal, Card,                       Button, Modal, StatCard,
PageHeader, Badge, Alert,                  StatusBadge, DifficultyBadge,
EmptyState, Table                          EmptyState, LoadingState
       │                                           │
       └─────────────────────┬─────────────────────┘
                             ▼
                 [ DATA & API BRIDGE LAYER ]
                             │
               src/lib/api-client.ts (49 consumers)
                             │
                             ▼
               Backend Express HTTP Endpoints (/api/*)
```
