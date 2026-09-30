# Final Service-Layer Baseline (28 Core Forensic Queries)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 12 of 30  
**Document:** 43 of 30  

---

## 1. Comprehensive Baseline Findings

### 1. How many services exist?
There are **72 discrete services** (70 in `src/lib/services/` + 2 in `src/lib/ai/`, plus 1 barrel export in `index.ts`).

### 2. What is each service responsible for?
Services are organized into Pedagogy (6), Production (8), Publishing (7), Workflow (9), Disaster Recovery (18), Infrastructure (6), AI (7), and Legacy Phases (11).

### 3. Which services have the most consumers?
`googleSheetsService` (58 services), `auditService` (32 services), `videoService` (32 routes, 12 services), `questionService` (21 routes, 8 services).

### 4. Which services have the most dependencies?
`publishingService` (8 dependencies), `dataIntegrityService` (6 dependencies), `videoService` (5 dependencies).

### 5. Which services interact with repositories?
**58 services** interact with repository adapters (`googleSheetsService`, `googleDriveService`, snapshot archive).

### 6. Which services bypass repositories?
**Zero services**. Storage access is cleanly mediated through storage adapters.

### 7. Which services access storage directly?
Only the 3 dedicated infrastructure adapters (`googleSheetsService`, `googleDriveService`, `durableSnapshotArchive`).

### 8. Which services access Google Sheets?
**58 services** read or write to the 18 authoritative Google Sheets tabs.

### 9. Which services access the database?
**Zero services**. No SQL or relational database engine is used.

### 10. Which services access Google Drive?
**6 services** manage binary takes, cuts, and images in Google Drive.

### 11. Which services call external systems?
**18 services** call external systems (Google Cloud APIs, Google Gen AI SDK, YouTube Data API, Meta Graph API).

### 12. Which services call AI systems?
**7 services** orchestrate Gemini 2.5 Flash/Pro and Imagen models.

### 13. Which services contain workflow logic?
**34 services** contain workflow logic that gates, advances, or validates stages along the 15-stage conveyor.

### 14. Which services change workflow state?
**50 services** execute status updates across Questions, Videos, Publishing, and Assignments.

### 15. Which services write the same state fields?
**8 state fields** have competing writers (notably Video `status` written by 4 different services).

### 16. Which business rules are duplicated?
**14 business rules** are duplicated across services or between route handlers and services.

### 17. Which services contain duplicated logic?
**6 service pairs** have overlapping responsibilities (e.g. `scriptService` vs `phase15Service`).

### 18. Which services are legacy?
**11 services** represent phase-specific historical milestones.

### 19. Which services are orphaned?
**9 services** have zero active API or UI callers.

### 20. Which services have circular dependencies?
**Zero services**. Dependency flow is strictly hierarchical.

### 21. Which services have broad responsibilities?
`PublishingService`, `DataIntegrityService`, `DashboardService`, `VideoService`, `PlanningService`.

### 22. Which services are potential god services?
**4 services**: `PublishingService` (2,168 lines), `DataIntegrityService` (1,835 lines), `DashboardService` (1,425 lines), `VideoService` (920 lines).

### 23. Which services have partial transaction risks?
**19 services** perform sequential multi-sheet writes without distributed commit or rollback.

### 24. Which services have retry/idempotency risks?
Mutating methods in `QuestionService`, `VideoService`, and `PublishingService` lack idempotency keys.

### 25. Which services have significant side effects?
**19 services** trigger 3 or more cascading writes to Google Sheets and audit logs.

### 26. Which services have error-handling problems?
Silent error swallowing in `DashboardService`, raw Google API error leaks in `routes.ts` catch blocks.

### 27. Which findings require runtime verification?
**12 dynamic items** (Google Sheets 429 backoff, YouTube OAuth, concurrent writes, restore timing).

### 28. What are the highest-risk service-layer findings?
1. Competing writers modifying Video `status` without state machine locking.
2. Multi-sheet sequential writes lacking atomic distributed transactions (Partial save / orphan risk).
3. Monolithic god services (`PublishingService` and `DataIntegrityService`) with low cohesion and high coupling.
4. Non-idempotent question and video creation methods risking duplicate records on retry.
5. Snapshot restore wiping 18 sheets sequentially without rollback safeguards.
