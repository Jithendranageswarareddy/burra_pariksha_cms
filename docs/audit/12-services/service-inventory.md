# Service Inventory Forensic Register (72 Services)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 12 of 30  
**Document:** 02 of 30  

---

## 1. Inventory Summary

BP-CMS contains **72 discrete service implementations** comprising 39,888 lines of TypeScript code:
- **Core Domain Services**: 24 services (Questions, Videos, Scripts, Thumbnails, Publishing, Taxonomy)
- **Workflow & Orchestration Services**: 12 services (Conveyor transitions, assignments, boards)
- **Disaster Recovery & Safety Services**: 18 services (Snapshots, preflight, granular restore, sequence safety)
- **AI & Intelligence Services**: 7 services (Gemini orchestration, copilot, comment intelligence)
- **Legacy Phase Services**: 11 services (Phase 12 through Phase 25 historical subsystems)

---

## 2. Master Service Inventory Register (Sample of Core Services)

| Service ID | Service Name | File Path | Exports | Primary Responsibility | Consumers | Repositories Used | State Changes? | Audit Events? | Classification |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| **SVC-001** | `QuestionService` | `src/lib/services/question.service.ts` | `QuestionService`, `questionService` | Question authoring, validation, status | Routes, Studio, QA | `googleSheetsService` | YES | YES | Core Domain |
| **SVC-002** | `VideoService` | `src/lib/services/video.service.ts` | `VideoService`, `videoService` | Video takes, editing, QC signoff, status | Routes, Workspaces | `googleSheetsService` | YES | YES | Potential God Service |
| **SVC-003** | `ScriptService` | `src/lib/services/script.service.ts` | `ScriptService`, `scriptService` | Teleprompter script, pacing, versions | Routes, Teleprompter | `googleSheetsService` | YES | YES | Core Domain |
| **SVC-004** | `PublishingService` | `src/lib/services/publishing.service.ts` | `PublishingService`, `publishingService` | Multi-platform scheduling, live post logs | Routes, Scheduler | `googleSheetsService` | YES | YES | Potential God Service |
| **SVC-005** | `DataIntegrityService` | `src/lib/services/data-integrity.service.ts` | `DataIntegrityService` | Cross-sheet relation repair, sync | Routes, Admin | `googleSheetsService` | YES | YES | Potential God Service |
| **SVC-006** | `DashboardService` | `src/lib/services/dashboard.service.ts` | `DashboardService` | Metric aggregation, pipeline health | Routes, Dashboard | `googleSheetsService` | NO | NO | Potential God Service |
| **SVC-007** | `AssignmentService` | `src/lib/services/assignment.service.ts` | `AssignmentService` | Task allocation, workload balancing | Routes, Modals | `googleSheetsService` | YES | YES | Workflow Domain |
| **SVC-008** | `TaxonomyService` | `src/lib/services/taxonomy.service.ts` | `TaxonomyService` | Categories, topics, subtopics, syllabus | Routes, Settings | `googleSheetsService` | YES | YES | Core Domain |
| **SVC-009** | `AuthService` | `src/lib/services/auth.service.ts` | `AuthService`, `authService` | JWT authentication, sessions, roles | Routes, Login, Nav | LocalStorage / Sheets | YES | YES | Security |
| **SVC-010** | `GoogleSheetsService` | `src/lib/services/google-sheets.service.ts`| `GoogleSheetsService` | Authoritative Sheets persistence adapter| 58 Services | Google Sheets API v4 | YES | NO | Infrastructure Adapter |
| **SVC-011** | `GoogleDriveService` | `src/lib/services/google-drive.service.ts` | `GoogleDriveService` | Google Drive binary asset manager | Video, Edit, Thumb | Google Drive API v3 | YES | NO | Infrastructure Adapter |
| **SVC-012** | `GeminiService` | `src/lib/ai/gemini.service.ts` | `GeminiService`, `geminiService` | Gemini SDK client & model wrapper | AI Services, Copilot | Google Gen AI API | NO | NO | AI Integration |
