# Reusable vs Page-Specific Component Classification

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 05 — Frontend Architecture Forensic Audit  
**Audit Date:** 2026-09-28  

---

## 1. Classification Framework

Components are categorized into four reusability tiers:
1. **APPLICATION-WIDE (T1):** Used across 10+ pages or in global application shell.
2. **FEATURE-SHARED (T2):** Used across multiple pages within a functional domain (e.g. video workspaces, question filters).
3. **WORKFLOW-SHARED (T3):** Tied to canonical 15-stage workflow orchestration.
4. **PAGE-SPECIFIC / SINGLE-USE (T4):** Embedded tightly inside a single page or parent component.

---

## 2. Tier Breakdown & Metrics

| Tier | Component Count | Examples | Coupling Profile |
| :--- | :---: | :--- | :--- |
| **Tier 1: Application-Wide** | 22 | `Button`, `PageHeader`, `Card`, `Badge`, `Modal`, `Layout`, `Sidebar`, `Header` | Core UI primitives; high coupling |
| **Tier 2: Feature-Shared** | 18 | `AssignmentModal`, `EntityAssignmentsSection`, `GlobalSearchBar`, `QuestionFilters`, `QuestionTable` | Domain workflows; medium coupling |
| **Tier 3: Workflow-Shared** | 9 | `ProductionJourneyBar`, `VideoWorkflowHeader`, `QuestionWorkflowHeader`, `PublishingWorkflowHeader` | Stage navigation; high business logic |
| **Tier 4: Single-Use** | 31 | `ScriptWorkspace`, `EditingWorkspace`, `ThumbnailWorkspace`, `ExecutiveHeroBanner`, `PackageCopierModal` | Page-bound subcomponents |

---

## 3. Structural Reusability Observations
- High degree of modularity in video production: `VideoDetailPage` cleanly delegates step views to 7 specialized workspaces in `src/components/video/`.
- Low reusability in dashboard: 14 separate widget files in `src/components/dashboard/` are single-use components consumed only by `DashboardPage.tsx`.
