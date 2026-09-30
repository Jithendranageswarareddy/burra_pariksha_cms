# Master Service Responsibility Matrix

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 12 of 30  
**Document:** 36 of 30  

---

## 1. Machine-Readable Responsibility Matrix (Sample)

| Service ID | Service Name | Bounded Context | Primary Entity | Direct Consumers | Dependencies | State Changes | Audit Events | God Service Rating | Confidence |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **SVC-001** | `QuestionService` | Pedagogy | Question | 21 routes, Studio | 4 services | YES | YES | NO | CONFIRMED |
| **SVC-002** | `VideoService` | Production | Video | 32 routes, Workspaces| 5 services | YES | YES | YES | CONFIRMED |
| **SVC-003** | `ScriptService` | Scripting | Script | 6 routes, Editor | 3 services | YES | YES | NO | CONFIRMED |
| **SVC-004** | `PublishingService` | Release | Publishing | 9 routes, Scheduler | 8 services | YES | YES | YES | CONFIRMED |
| **SVC-005** | `DataIntegrityService`| System | All Entities | 4 routes, Admin | 6 services | YES | YES | YES | CONFIRMED |
| **SVC-006** | `DashboardService` | Analytics | Metrics | 6 routes, Dashboard | 4 services | NO | NO | YES | CONFIRMED |
| **SVC-007** | `AssignmentService`| Workflow | Assignment | 11 routes, Modals | 4 services | YES | YES | NO | CONFIRMED |
| **SVC-008** | `TaxonomyService` | Syllabus | Category/Topic | 8 routes, Settings | 2 services | YES | YES | NO | CONFIRMED |
| **SVC-009** | `AuthService` | Security | User Session | 5 routes, Login | 2 services | YES | YES | NO | CONFIRMED |
| **SVC-010** | `GoogleSheetsService`| Persistence | Spreadsheet | 58 services | Google API | YES | NO | NO (Adapter)| CONFIRMED |
| **SVC-011** | `GoogleDriveService` | Media Store | Drive Files | 6 services | Google API | YES | NO | NO (Adapter)| CONFIRMED |
| **SVC-012** | `GeminiService` | AI Provider | LLM Prompts | 7 services | Gen AI SDK | NO | NO | NO (Adapter)| CONFIRMED |
