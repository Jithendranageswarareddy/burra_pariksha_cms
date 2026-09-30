# Service Dependency Graph Architecture

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 12 of 30  
**Document:** 37 of 30  

---

## 1. Global Service Dependency Hierarchy

```
[API Controllers (routes.ts)]
       │
       ▼
┌────────────────────────────────────────────────────────────────┐
│  Tier 1: High-Level Orchestrators & God Services               │
│  - publishingService                                           │
│  - dataIntegrityService                                        │
│  - dashboardService                                            │
│  - fullSnapshotRestoreExecutionService                         │
└───────┬────────────────────────────────────────────────────────┘
        │ calls
        ▼
┌────────────────────────────────────────────────────────────────┐
│  Tier 2: Core Domain Services                                  │
│  - videoService                                                │
│  - questionService                                             │
│  - scriptService                                               │
│  - assignmentService                                           │
│  - contentMasterService                                        │
│  - taxonomyService                                             │
│  - thumbnailService                                            │
│  - pinnedCommentService                                        │
└───────┬────────────────────────────────────────────────────────┘
        │ calls
        ▼
┌────────────────────────────────────────────────────────────────┐
│  Tier 3: Specialized Domain & AI Services                      │
│  - platformAdaptationService                                   │
│  - commentIntelligenceService                                  │
│  - questionValidationService                                   │
│  - socialPerformanceIntelligenceService                        │
│  - phase26CopilotService                                       │
│  - geminiService                                               │
└───────┬────────────────────────────────────────────────────────┘
        │ calls
        ▼
┌────────────────────────────────────────────────────────────────┐
│  Tier 4: Cross-Cutting Safety & Infrastructure Support         │
│  - sequenceSafetyService                                       │
│  - auditService                                                │
│  - authService                                                 │
│  - idService                                                   │
└───────┬────────────────────────────────────────────────────────┘
        │ calls
        ▼
┌────────────────────────────────────────────────────────────────┐
│  Tier 5: Infrastructure Storage Adapters                       │
│  - googleSheetsService  (Reads/writes 18 Google Sheets tabs)   │
│  - googleDriveService   (Uploads/streams Google Drive media)   │
│  - durableSnapshotArchive (Reads/writes disk backup JSONs)     │
└────────────────────────────────────────────────────────────────┘
```
