# SDLC Pre-Gate: 04 — Import & Export Impact Analysis

**System:** Burra Pariksha Content Management System (BP-CMS)  
**Document Type:** Import / Export Dependency Analysis  
**Status:** **AUTHORITATIVE ANALYSIS**  
**Date:** 2026-09-29  

---

## 1. Import & Export Dependency Graph

All active service, repository, and type imports across `src/` were analyzed to ensure that barrel exports (`index.ts`) and direct callers maintain 100% path integrity.

```
[ UI Pages / Workspaces ]
          │
          ▼ import { service } from '@/lib/services'
[ src/lib/services/index.ts (Barrel Export) ]
    ├── analytics.service.ts
    ├── auth.service.ts
    ├── google-drive.service.ts (Aliases legacy phase14DriveService)
    ├── publishing.service.ts
    ├── question.service.ts
    ├── script.service.ts
    ├── video.service.ts
    └── workflow-orchestration.service.ts
          │
          ▼ import { repository } from '@/lib/repositories'
[ src/lib/repositories/index.ts (Barrel Export) ]
    ├── questions.repository.ts
    ├── videos.repository.ts
    ├── scripts.repository.ts
    ├── publishing.repository.ts (Aliases legacy phase22PublishingRepository)
    └── social-reviews.repository.ts (Aliases legacy phase20SocialReviewsRepository)
```

---

## 2. Re-Export Compatibility Strategy

To ensure zero broken imports across both active application code and existing test files:
1. Canonical services and repositories are exported under standard domain names (e.g. `workflowOrchestrationService`, `publishingService`).
2. Legacy identifier aliases (e.g. `export const phase14DriveService = googleDriveService;`) are retained inside barrel exports (`src/lib/services/index.ts` and `src/lib/repositories/index.ts`).
3. This guarantees that both legacy test scripts and future SDLC Work Packages resolve imports cleanly without runtime or compile errors.
