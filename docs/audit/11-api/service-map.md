# Route to Service Mapping Forensic Audit (61 Domain Services)

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Audit Step:** 11 of 30  
**Document:** 09 of 30  

---

## 1. Service Layer Coverage Summary

An exhaustive trace confirms that **100% of the 270 API endpoints in `src/server/routes.ts` call a domain service**. Zero endpoints make direct calls to the raw Google Sheets or Google Drive API clients from route handlers.

---

## 2. Top Domain Services & Endpoint Coverage

| Service Name | Source File | Endpoints Served | Primary Functional Responsibility |
| :--- | :--- | :---: | :--- |
| **`videoService`** | `src/lib/services/video.service.ts` | 32 | Video lifecycle, statuses, takes, edits, QC |
| **`questionService`** | `src/lib/services/question.service.ts` | 21 | Question authoring, drafts, metadata, retrieval |
| **`planningService`** | `src/lib/services/planning.service.ts` | 18 | Content plans, curriculum batches, syllabi |
| **`copilotService`** | `src/lib/services/phase26-copilot.service.ts` | 15 | AI Copilot orchestration, context prompts |
| **`recoveryService`** | `src/lib/services/full-snapshot-restore-execution.service.ts` | 14 | Snapshot backup, restore execution, verification |
| **`assignmentService`** | `src/lib/services/assignment.service.ts` | 11 | Workload assignment, reassignment, completion |
| **`platformAdaptationService`**| `src/lib/services/platform-adaptation.service.ts` | 11 | Multi-platform post formatting and adaptation |
| **`publishingService`** | `src/lib/services/publishing.service.ts` | 9 | Multi-channel publishing schedules and records |
| **`analyticsService`** | `src/lib/services/analytics.service.ts` | 8 | Performance intelligence, feedback metrics |
| **`taxonomyService`** | `src/lib/services/taxonomy.service.ts` | 8 | Categories, syllabus topics, subtopics |
| **`scriptService`** | `src/lib/services/script.service.ts` | 6 | Spoken scripts, teleprompter versions, cues |
| **`authService`** | `src/lib/services/auth.service.ts` | 5 | User login, JWT sessions, role verification |
| **`thumbnailService`** | `src/lib/services/thumbnail.service.ts` | 4 | Thumbnail generation variants and selection |
| **Other Domain Services (48)** | Various files in `src/lib/services/` | 108 | Intelligence loops, social comments, consensus |
